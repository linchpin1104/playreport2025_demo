import { AppError, ErrorCode, ErrorMetadata } from '../errors';
import { ServiceResult } from '../interfaces';
import { Logger } from './logger';

export interface ErrorContext {
  operation: string;
  metadata?: ErrorMetadata;
  userId?: string;
  sessionId?: string;
  endpoint?: string;
  userAgent?: string;
}

export interface ErrorReportingConfig {
  enableConsoleLogging: boolean;
  enableFileLogging: boolean;
  enableRemoteReporting: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

export class ErrorHandlingService {
  private readonly logger: Logger;
  private readonly config: ErrorReportingConfig;

  constructor(config: Partial<ErrorReportingConfig> = {}) {
    this.logger = new Logger('ErrorHandlingService');
    this.config = {
      enableConsoleLogging: config.enableConsoleLogging ?? true,
      enableFileLogging: config.enableFileLogging ?? false,
      enableRemoteReporting: config.enableRemoteReporting ?? false,
      logLevel: config.logLevel ?? 'error'
    };
  }

  /**
   * 에러 처리 및 보고
   */
  handleError(error: Error, context: ErrorContext): ServiceResult<never> {
    const appError = this.normalizeError(error, context);
    
    // 에러 로깅
    this.logError(appError, context);
    
    // 에러 보고
    this.reportError(appError, context);
    
    // 서비스 결과 반환
    return ServiceResult.failure(
      appError.code,
      appError.message,
      {
        ...appError.metadata,
        operation: context.operation,
        correlationId: this.generateCorrelationId()
      }
    );
  }

  /**
   * 비동기 작업 래퍼 - 에러 자동 처리
   */
  async wrapAsync<T>(
    operation: string,
    fn: () => Promise<T>,
    context: Partial<ErrorContext> = {}
  ): Promise<ServiceResult<T>> {
    const fullContext: ErrorContext = {
      operation,
      metadata: {
        timestamp: new Date().toISOString(),
        ...context.metadata
      },
      ...context
    };

    try {
      const result = await fn();
      return ServiceResult.success(result);
    } catch (error) {
      return this.handleError(error as Error, fullContext);
    }
  }

  /**
   * 동기 작업 래퍼 - 에러 자동 처리
   */
  wrap<T>(
    operation: string,
    fn: () => T,
    context: Partial<ErrorContext> = {}
  ): ServiceResult<T> {
    const fullContext: ErrorContext = {
      operation,
      metadata: {
        timestamp: new Date().toISOString(),
        ...context.metadata
      },
      ...context
    };

    try {
      const result = fn();
      return ServiceResult.success(result);
    } catch (error) {
      return this.handleError(error as Error, fullContext);
    }
  }

  /**
   * 유효성 검증 에러 처리
   */
  handleValidationError(
    field: string,
    value: any,
    rule: string,
    context: Partial<ErrorContext> = {}
  ): ServiceResult<never> {
    const error = new AppError(
      ErrorCode.INVALID_INPUT,
      `Validation failed for field '${field}': ${rule}`,
      400,
      {
        field,
        value: String(value),
        rule,
        timestamp: new Date().toISOString(),
        ...context.metadata
      }
    );

    return this.handleError(error, { operation: 'validation', ...context });
  }

  /**
   * 비즈니스 로직 에러 처리
   */
  handleBusinessError(
    code: ErrorCode,
    message: string,
    context: Partial<ErrorContext> = {}
  ): ServiceResult<never> {
    const error = new AppError(
      code,
      message,
      400,
      {
        timestamp: new Date().toISOString(),
        ...context.metadata
      }
    );

    return this.handleError(error, { operation: 'business-logic', ...context });
  }

  /**
   * 외부 서비스 에러 처리
   */
  handleExternalServiceError(
    service: string,
    originalError: Error,
    context: Partial<ErrorContext> = {}
  ): ServiceResult<never> {
    const error = new AppError(
      ErrorCode.GCP_SERVICE_ERROR,
      `External service ${service} failed: ${originalError.message}`,
      503,
      {
        service,
        originalError: originalError.message,
        timestamp: new Date().toISOString(),
        ...context.metadata
      },
      originalError
    );

    return this.handleError(error, { operation: `external-service-${service}`, ...context });
  }

  /**
   * 타임아웃 에러 처리
   */
  handleTimeoutError(
    operation: string,
    timeout: number,
    context: Partial<ErrorContext> = {}
  ): ServiceResult<never> {
    const error = new AppError(
      ErrorCode.PROCESSING_TIMEOUT,
      `Operation '${operation}' timed out after ${timeout}ms`,
      408,
      {
        operation,
        timeout,
        timestamp: new Date().toISOString(),
        ...context.metadata
      }
    );

    return this.handleError(error, { operation: 'timeout', ...context });
  }

  /**
   * 에러 정규화 - 모든 에러를 AppError로 변환
   */
  private normalizeError(error: Error, context: ErrorContext): AppError {
    if (error instanceof AppError) {
      return error;
    }

    // 일반 에러를 AppError로 변환
    return new AppError(
      ErrorCode.INTERNAL_SERVER_ERROR,
      error.message || 'An unexpected error occurred',
      500,
      {
        originalError: error.name,
        operation: context.operation,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        ...context.metadata
      },
      error
    );
  }

  /**
   * 에러 로깅
   */
  private logError(error: AppError, context: ErrorContext): void {
    const logData = {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      operation: context.operation,
      metadata: error.metadata,
      stack: error.stack
    };

    if (error.statusCode >= 500) {
      this.logger.error(`Server Error: ${error.message}`, error, logData);
    } else if (error.statusCode >= 400) {
      this.logger.warn(`Client Error: ${error.message}`, logData);
    } else {
      this.logger.info(`Handled Error: ${error.message}`, logData);
    }
  }

  /**
   * 에러 보고
   */
  private reportError(error: AppError, context: ErrorContext): void {
    if (!this.config.enableRemoteReporting) {
      return;
    }

    // 여기서 원격 에러 보고 시스템 (Sentry, Datadog 등)으로 전송
    // 현재는 콘솔 로그만 출력
    console.error('Error Report:', {
      error: error.toJSON(),
      context,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 상관관계 ID 생성
   */
  private generateCorrelationId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 에러 통계 수집
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByCode: Record<string, number>;
    errorsByOperation: Record<string, number>;
  } {
    // 실제 구현에서는 메모리 또는 외부 저장소에서 통계 수집
    return {
      totalErrors: 0,
      errorsByCode: {},
      errorsByOperation: {}
    };
  }
}

// 싱글톤 인스턴스
export const errorHandlingService = new ErrorHandlingService({
  enableConsoleLogging: true,
  enableFileLogging: process.env.NODE_ENV === 'production',
  enableRemoteReporting: process.env.NODE_ENV === 'production',
  logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'error'
});

// 편의 함수들
export const handleError = (error: Error, context: ErrorContext) => 
  errorHandlingService.handleError(error, context);

export const wrapAsync = <T>(operation: string, fn: () => Promise<T>, context?: Partial<ErrorContext>) =>
  errorHandlingService.wrapAsync(operation, fn, context);

export const wrap = <T>(operation: string, fn: () => T, context?: Partial<ErrorContext>) =>
  errorHandlingService.wrap(operation, fn, context); 