// 구조화된 에러 시스템
export enum ErrorCode {
  // 입력 관련 에러
  INVALID_INPUT = 'INVALID_INPUT',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  
  // 분석 관련 에러
  VIDEO_ANALYSIS_FAILED = 'VIDEO_ANALYSIS_FAILED',
  AUDIO_ANALYSIS_FAILED = 'AUDIO_ANALYSIS_FAILED',
  PROCESSING_TIMEOUT = 'PROCESSING_TIMEOUT',
  
  // 외부 서비스 에러
  GCP_SERVICE_ERROR = 'GCP_SERVICE_ERROR',
  FIRESTORE_ERROR = 'FIRESTORE_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  OPENAI_API_ERROR = 'OPENAI_API_ERROR',
  
  // 시스템 에러
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  // 인증/권한 에러
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  
  // 비즈니스 로직 에러
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  ANALYSIS_NOT_COMPLETE = 'ANALYSIS_NOT_COMPLETE',
  INVALID_SESSION_STATE = 'INVALID_SESSION_STATE'
}

export interface ErrorMetadata {
  sessionId?: string;
  userId?: string;
  timestamp: string;
  endpoint?: string;
  userAgent?: string;
  correlationId?: string;
  retryCount?: number;
  [key: string]: unknown;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly metadata: ErrorMetadata;
  public readonly isOperational: boolean;
  public readonly stack?: string;
  public readonly cause?: Error;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    metadata: Partial<ErrorMetadata> = {},
    cause?: Error
  ) {
    super(message);
    
    this.code = code;
    this.statusCode = statusCode;
    this.metadata = {
      timestamp: new Date().toISOString(),
      ...metadata
    };
    this.isOperational = true;
    
    if (cause) {
      this.stack = cause.stack;
      this.cause = cause;
    }
    
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      metadata: this.metadata,
      isOperational: this.isOperational
    };
  }
}

// 특정 에러 타입들
export class ValidationError extends AppError {
  constructor(message: string, metadata: Partial<ErrorMetadata> = {}) {
    super(ErrorCode.INVALID_INPUT, message, 400, metadata);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, metadata: Partial<ErrorMetadata> = {}) {
    super(ErrorCode.SESSION_NOT_FOUND, `${resource} not found`, 404, metadata);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service: string, cause?: Error, metadata: Partial<ErrorMetadata> = {}) {
    super(
      ErrorCode.GCP_SERVICE_ERROR,
      `Service ${service} is currently unavailable`,
      503,
      metadata,
      cause
    );
  }
}

export class ProcessingTimeoutError extends AppError {
  constructor(operation: string, timeout: number, metadata: Partial<ErrorMetadata> = {}) {
    super(
      ErrorCode.PROCESSING_TIMEOUT,
      `Operation ${operation} timed out after ${timeout}ms`,
      408,
      metadata
    );
  }
}

// 에러 헬퍼 함수들
export const ErrorHelpers = {
  isOperationalError: (error: Error): error is AppError => {
    return error instanceof AppError && error.isOperational;
  },

  isGCPError: (error: Error): boolean => {
    return error.message?.includes('google.cloud') || 
           error.message?.includes('GRPC') ||
           error.message?.includes('DEADLINE_EXCEEDED');
  },

  isNetworkError: (error: Error): boolean => {
    return error.message?.includes('ECONNRESET') ||
           error.message?.includes('ENOTFOUND') ||
           error.message?.includes('ETIMEDOUT');
  },

  createFromUnknown: (error: unknown, context?: string): AppError => {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      if (ErrorHelpers.isGCPError(error)) {
        return new ServiceUnavailableError('GCP', error);
      }

      if (ErrorHelpers.isNetworkError(error)) {
        return new AppError(ErrorCode.NETWORK_ERROR, error.message, 503, { context });
      }

      return new AppError(ErrorCode.INTERNAL_SERVER_ERROR, error.message, 500, { context });
    }

    return new AppError(
      ErrorCode.INTERNAL_SERVER_ERROR,
      'An unknown error occurred',
      500,
      { context, originalError: String(error) }
    );
  }
};

// 에러 리포터 인터페이스
export interface IErrorReporter {
  report(error: AppError): Promise<void>;
}

// 로그 기반 에러 리포터
export class LogErrorReporter implements IErrorReporter {
  async report(error: AppError): Promise<void> {
    console.error('[ERROR]', {
      code: error.code,
      message: error.message,
      metadata: error.metadata,
      stack: error.stack
    });
  }
} 