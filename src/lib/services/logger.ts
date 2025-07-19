// 구조화된 로깅 시스템
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  metadata?: Record<string, unknown>;
  correlationId?: string;
  sessionId?: string;
  userId?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export interface ILogger {
  debug(message: string, metadata?: Record<string, unknown>): void;
  info(message: string, metadata?: Record<string, unknown>): void;
  warn(message: string, metadata?: Record<string, unknown>): void;
  error(message: string, error?: Error, metadata?: Record<string, unknown>): void;
  withContext(context: Partial<LogEntry>): ILogger;
}

export class Logger implements ILogger {
  private context: Partial<LogEntry> = {};
  private readonly minLevel: LogLevel = LogLevel.INFO;

  constructor(
    private readonly service: string,
    private readonly config: {
      minLevel?: LogLevel;
      enableConsole?: boolean;
      enableFile?: boolean;
    } = {}
  ) {
    this.minLevel = config.minLevel ?? (process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO);
  }

  withContext(context: Partial<LogEntry>): ILogger {
    const newLogger = new Logger(this.service, this.config);
    newLogger.context = { ...this.context, ...context };
    return newLogger;
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  error(message: string, error?: Error, metadata?: Record<string, unknown>): void {
    const errorMetadata = error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : undefined;

    this.log(LogLevel.ERROR, message, metadata, errorMetadata);
  }

  private log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, unknown>,
    error?: { name: string; message: string; stack?: string }
  ): void {
    if (level < this.minLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.service,
      ...this.context,
      metadata: { ...this.context.metadata, ...metadata },
      error
    };

    // Console output (개발 환경에서만 pretty-print)
    if (this.config.enableConsole !== false) {
      this.logToConsole(entry);
    }

    // Production에서는 실제 로그 수집 시스템으로 전송
    if (process.env.NODE_ENV === 'production') {
      this.logToExternalService(entry);
    }
  }

  private logToConsole(entry: LogEntry): void {
    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    const levelColors = ['\x1b[36m', '\x1b[32m', '\x1b[33m', '\x1b[31m'];
    const resetColor = '\x1b[0m';

    const levelName = levelNames[entry.level];
    const levelColor = levelColors[entry.level];
    
    const prefix = `${levelColor}[${levelName}]${resetColor}`;
    const timestamp = `\x1b[90m${entry.timestamp}\x1b[0m`;
    const service = `\x1b[90m[${entry.service}]\x1b[0m`;
    
    let output = `${prefix} ${timestamp} ${service} ${entry.message}`;

    if (entry.sessionId) {
      output += ` \x1b[90m(session: ${entry.sessionId})\x1b[0m`;
    }

    if (entry.correlationId) {
      output += ` \x1b[90m(correlation: ${entry.correlationId})\x1b[0m`;
    }

    console.log(output);

    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      console.log('  Metadata:', entry.metadata);
    }

    if (entry.error) {
      console.error('  Error:', entry.error);
    }
  }

  private logToExternalService(entry: LogEntry): void {
    // TODO: 실제 환경에서는 Cloud Logging, DataDog, New Relic 등으로 전송
    // 현재는 JSON 형태로 출력
    console.log(JSON.stringify(entry));
  }
}

// 서비스별 로거 팩토리
export class LoggerFactory {
  private static readonly loggers: Map<string, Logger> = new Map();

  static getLogger(service: string): ILogger {
    if (!this.loggers.has(service)) {
      this.loggers.set(service, new Logger(service));
    }
    return this.loggers.get(service)!;
  }

  static createLogger(service: string, config?: { minLevel?: LogLevel }): ILogger {
    return new Logger(service, config);
  }
}

// 각 서비스별 로거 인스턴스
export const loggers = {
  videoAnalysis: LoggerFactory.getLogger('video-analysis'),
  audioAnalysis: LoggerFactory.getLogger('audio-analysis'),
  dataStorage: LoggerFactory.getLogger('data-storage'),
  apiGateway: LoggerFactory.getLogger('api-gateway'),
  auth: LoggerFactory.getLogger('auth'),
  upload: LoggerFactory.getLogger('upload'),
  report: LoggerFactory.getLogger('report')
};

// 기존 console.log 대체를 위한 마이그레이션 헬퍼
export const migrateConsoleLog = (service: string) => {
  const logger = LoggerFactory.getLogger(service);
  
  return {
    // 기존: console.log('✅ 작업 완료')
    // 신규: log.success('작업 완료')
    success: (message: string, metadata?: Record<string, unknown>) => {
      logger.info(`✅ ${message}`, metadata);
    },
    
    // 기존: console.log('🔄 작업 진행중')
    // 신규: log.progress('작업 진행중')
    progress: (message: string, metadata?: Record<string, unknown>) => {
      logger.info(`🔄 ${message}`, metadata);
    },
    
    // 기존: console.log('🚨 경고')
    // 신규: log.warning('경고')
    warning: (message: string, metadata?: Record<string, unknown>) => {
      logger.warn(`🚨 ${message}`, metadata);
    },
    
    // 기존: console.error('❌ 에러')
    // 신규: log.failure('에러', error)
    failure: (message: string, error?: Error, metadata?: Record<string, unknown>) => {
      logger.error(`❌ ${message}`, error, metadata);
    }
  };
}; 