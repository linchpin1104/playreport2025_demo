// API 및 서비스 관련 타입 정의

import { PlayAnalysisCore, IntegratedPlayAnalysisResult, PlayAnalysisRequest, AnalysisStatus } from './play-analysis';
import { VideoIntelligenceResults, VideoAnalysisOptions, AnalysisMetadata, QualityMetrics } from './video-analysis';

// 기본 API 응답 타입
export interface BaseApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  timestamp: string;
}

// 업로드 관련 타입
export interface FileUploadRequest {
  fileName: string;
  fileSize: number;
  contentType: string;
  buffer: Buffer;
}

export interface FileUploadResponse {
  success: boolean;
  gsUri: string;
  fileName: string;
  fileSize: number;
  uploadTime: string;
  processingTime: number;
  metadata: {
    originalName: string;
    contentType: string;
    duration: number;
    resolution: string;
    bitrate: number;
  };
}

// 세션 관련 타입
export interface SessionData {
  sessionId: string;
  metadata: {
    fileName: string;
    originalName: string;
    fileSize: number;
    uploadedAt: string;
    analyzedAt: string;
    lastUpdated: string;
    status: 'uploaded' | 'processing' | 'analyzed' | 'completed' | 'failed';
  };
  paths: {
    rawDataPath?: string;
    processedDataPath?: string;
    reportPath?: string;
    thumbnailPath?: string;
  };
  analysis: {
    participantCount: number;
    videoDuration: number;
    safetyScore: number;
    processingTime?: number;
  };
  tags: string[];
  settings?: {
    analysisDepth: 'basic' | 'detailed' | 'comprehensive';
    enableRecommendations: boolean;
    languagePreference: string;
  };
}

// 분석 요청 타입
export interface VideoAnalysisRequest {
  sessionId?: string;
  gsUri?: string;
  fileName?: string;
  options?: VideoAnalysisOptions;
  participantInfo?: {
    childAge?: number;
    specialNeeds?: string[];
    previousAnalysis?: string[];
  };
}

export interface VideoAnalysisResponse {
  success: boolean;
  analysisResults: VideoIntelligenceResults;
  metadata: AnalysisMetadata;
  qualityMetrics: QualityMetrics;
  stage1Complete: boolean;
  stage2Complete: boolean;
  stage3Complete: boolean;
  stage4Complete: boolean;
}

// 상세 분석 타입
export interface DetailedAnalysisRequest {
  sessionId: string;
  type: 'physical' | 'language' | 'emotional' | 'play-pattern';
  analysisResults: VideoIntelligenceResults;
  metadata: AnalysisMetadata;
  options?: {
    enableDetailedMetrics: boolean;
    focusAreas: string[];
  };
}

export interface DetailedAnalysisResponse {
  success: boolean;
  analysisType: string;
  results: IntegratedPlayAnalysisResult;
  metadata: AnalysisMetadata;
  processingTime: number;
}

// 개발 상태 타입
export interface DevStatusRequest {
  developmentMode?: boolean;
}

export interface GCPServiceStatus {
  firestore: boolean;
  videointelligence: boolean;
  cloudstorage: boolean;
  texttospeech: boolean;
}

export interface DevStatusResponse {
  isDevelopmentMode: boolean;
  gcpServices: GCPServiceStatus;
  timestamp: string;
  environment: string;
  projectId: string;
  features: {
    mockDataEnabled: boolean;
    realTimeAnalysis: boolean;
    detailedLogging: boolean;
  };
}

// 레포트 생성 타입
export interface ReportGenerationRequest {
  sessionId: string;
  analysisResults: IntegratedPlayAnalysisResult;
  reportType: 'summary' | 'detailed' | 'comprehensive';
  format: 'json' | 'pdf' | 'html';
  language: 'ko' | 'en';
  includeRecommendations: boolean;
}

export interface ReportGenerationResponse {
  success: boolean;
  reportId: string;
  reportUrl: string;
  format: string;
  generationTime: number;
  metadata: {
    sessionId: string;
    reportType: string;
    pageCount?: number;
    wordCount?: number;
    fileSize: number;
  };
}

// 캐시 관련 타입
export interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number;
  metadata?: Record<string, unknown>;
}

export interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  cleanupInterval: number;
  enableLogging: boolean;
  enableMetrics: boolean;
}

export interface CacheStats {
  totalEntries: number;
  hitCount: number;
  missCount: number;
  evictionCount: number;
  hitRate: number;
  memoryUsage: number;
}

// API 최적화 관련 타입
export interface RequestConfig {
  debounceMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
  cacheKey?: string;
  cacheTTL?: number;
  enableLogging?: boolean;
}

export interface RequestState {
  inProgress: boolean;
  lastRequest: number;
  requestCount: number;
  lastResult?: unknown;
  errorCount: number;
}

// 에러 핸들링 타입
export interface ErrorContext {
  operation: string;
  metadata?: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  endpoint?: string;
  userAgent?: string;
  timestamp?: string;
  correlationId?: string;
}

export interface ErrorReportingConfig {
  enableConsoleLogging: boolean;
  enableFileLogging: boolean;
  enableRemoteReporting: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  enableStackTrace: boolean;
  maxErrorsPerSession: number;
}

// 로깅 관련 타입
export interface LogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  service: string;
  message: string;
  metadata?: Record<string, unknown>;
  error?: Error;
  correlationId?: string;
  userId?: string;
  sessionId?: string;
}

export interface LoggerConfig {
  minLevel: 'error' | 'warn' | 'info' | 'debug';
  enableConsole: boolean;
  enableFile: boolean;
  enableRemote: boolean;
  format: 'json' | 'text';
  maxFileSize: number;
  maxFiles: number;
}

// 설정 관리 타입
export interface ConfigSchema {
  environment: {
    nodeEnv: string;
    isDevelopment: boolean;
    isProduction: boolean;
    isTest: boolean;
  };
  server: {
    port: number;
    host: string;
    timeout: number;
  };
  gcp: {
    projectId: string;
    region: string;
    keyFile: string;
    bucketName: string;
  };
  apis: {
    openai: {
      apiKey: string;
      model: string;
      maxTokens: number;
      temperature: number;
    };
    videoIntelligence: {
      features: string[];
      timeout: number;
    };
  };
  cache: {
    defaultTTL: number;
    maxSize: number;
    cleanupInterval: number;
  };
  logging: {
    level: string;
    enableConsole: boolean;
    enableFile: boolean;
  };
}

// 데이터베이스 관련 타입
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  connectionLimit: number;
  timeout: number;
}

export interface DatabaseQuery {
  query: string;
  params: unknown[];
  timeout?: number;
}

export interface DatabaseResult<T = unknown> {
  success: boolean;
  data?: T[];
  rowCount?: number;
  executionTime: number;
  error?: string;
}

// 외부 서비스 연동 타입
export interface ExternalServiceConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  retryCount: number;
  retryDelay: number;
  headers?: Record<string, string>;
}

export interface ExternalServiceResponse<T = unknown> {
  success: boolean;
  data?: T;
  statusCode: number;
  headers: Record<string, string>;
  responseTime: number;
  error?: string;
}

// 메트릭 수집 타입
export interface PerformanceMetrics {
  apiCalls: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
  };
  cacheMetrics: CacheStats;
  errorMetrics: {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsByEndpoint: Record<string, number>;
  };
  resourceUsage: {
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
  };
  timestamp: string;
}

// 헬스 체크 타입
export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  responseTime: number;
  details?: Record<string, unknown>;
  error?: string;
}

export interface SystemHealthStatus {
  overall: 'healthy' | 'unhealthy' | 'degraded';
  services: HealthCheckResult[];
  timestamp: string;
  uptime: number;
  version: string;
} 