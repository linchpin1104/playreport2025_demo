// 의존성 주입을 위한 인터페이스 정의
export interface IVideoAnalyzer {
  analyzeVideo(videoPath: string, options: VideoAnalysisOptions): Promise<VideoAnalysisResult>;
}

export interface IDataStorage {
  saveSession(session: PlaySession): Promise<void>;
  getSession(sessionId: string): Promise<PlaySession | null>;
  updateSession(sessionId: string, data: Partial<PlaySession>): Promise<void>;
}

export interface ILogger {
  info(message: string, metadata?: Record<string, unknown>): void;
  error(message: string, error?: Error, metadata?: Record<string, unknown>): void;
  warn(message: string, metadata?: Record<string, unknown>): void;
}

export interface IConfigService {
  getConfig(key: string): string | undefined;
  getRequiredConfig(key: string): string;
  isProduction(): boolean;
  isDevelopment(): boolean;
}

// 서비스 결과 타입 - 함수형 스타일 결과 처리
export class ServiceResult<T> {
  private constructor(
    private readonly success: boolean,
    private readonly value?: T,
    private readonly errorCode?: string,
    private readonly message?: string,
    private readonly metadata?: Record<string, unknown>
  ) {}

  static success<T>(value: T): ServiceResult<T> {
    return new ServiceResult(true, value);
  }

  static failure<T>(
    errorCode: string,
    message: string,
    metadata?: Record<string, unknown>
  ): ServiceResult<T> {
    return new ServiceResult<T>(false, undefined, errorCode, message, metadata);
  }

  isSuccess(): boolean {
    return this.success;
  }

  isFailure(): boolean {
    return !this.success;
  }

  getValue(): T {
    if (!this.success) {
      throw new Error('Cannot get value from failed result');
    }
    return this.value!;
  }

  getError(): { code: string; message: string; metadata?: Record<string, unknown> } {
    if (this.success) {
      throw new Error('Cannot get error from successful result');
    }
    return {
      code: this.errorCode!,
      message: this.message!,
      metadata: this.metadata
    };
  }

  // 체이닝을 위한 메서드
  map<U>(fn: (value: T) => U): ServiceResult<U> {
    if (this.success) {
      try {
        return ServiceResult.success(fn(this.value!));
      } catch (error) {
        return ServiceResult.failure('MAPPING_ERROR', 'Error during result mapping', { error });
      }
    }
    return ServiceResult.failure(this.errorCode!, this.message!, this.metadata);
  }

  // 플랫 맵 (비동기 체이닝)
  async flatMap<U>(fn: (value: T) => Promise<ServiceResult<U>>): Promise<ServiceResult<U>> {
    if (this.success) {
      try {
        return await fn(this.value!);
      } catch (error) {
        return ServiceResult.failure('FLATMAP_ERROR', 'Error during async result mapping', { error });
      }
    }
    return ServiceResult.failure(this.errorCode!, this.message!, this.metadata);
  }
}

// 결과 타입 강화
export interface VideoAnalysisResult {
  sessionId: string;
  objectTracking: ObjectTrackingResult[];
  faceDetection: FaceDetectionResult[];
  personDetection: PersonDetectionResult[];
  speechTranscription: SpeechTranscriptionResult[];
  qualityMetrics: QualityMetrics;
  analysisMetadata: AnalysisMetadata;
}

export interface ObjectTrackingResult {
  objectId: string;
  description: string;
  confidence: number;
  timeSegments: TimeSegment[];
  boundingBoxes: BoundingBox[];
}

export interface FaceDetectionResult {
  faceId: string;
  confidence: number;
  emotions: EmotionResult[];
  landmarks: FaceLandmark[];
  timeSegments: TimeSegment[];
}

export interface PersonDetectionResult {
  personId: string;
  confidence: number;
  boundingBoxes: BoundingBox[];
  landmarks: PersonLandmark[];
  timeSegments: TimeSegment[];
}

export interface SpeechTranscriptionResult {
  speakerId: string;
  text: string;
  confidence: number;
  timeSegment: TimeSegment;
  wordLevelTimings: WordTiming[];
}

export interface TimeSegment {
  startTime: number;
  endTime: number;
}

export interface BoundingBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface EmotionResult {
  emotion: string;
  confidence: number;
  timestamp: number;
}

export interface QualityMetrics {
  overallScore: number;
  videoQuality: number;
  audioQuality: number;
  analysisCompleteness: number;
}

export interface AnalysisMetadata {
  timestamp: string;
  processingTime: number;
  version: string;
  environment: string;
}

// 추가 인터페이스들
export interface VideoAnalysisOptions {
  enableVoiceAnalysis?: boolean;
  enableGestureRecognition?: boolean;
  enableObjectDetection?: boolean;
  enableFaceDetection?: boolean;
  enableTranscription?: boolean;
  enableSpeakerDiarization?: boolean;
  enableSentimentAnalysis?: boolean;
  enableQualityMetrics?: boolean;
  enableComprehensiveAnalysis?: boolean;
}

export interface PlaySession {
  sessionId: string;
  metadata: {
    fileName: string;
    originalName: string;
    fileSize: number;
    uploadedAt: string;
    analyzedAt: string;
    lastUpdated: string;
    status: string;
  };
  paths: {
    rawDataPath?: string;
    processedDataPath?: string;
    reportPath?: string;
  };
  analysis: {
    participantCount: number;
    videoDuration: number;
    safetyScore: number;
  };
  tags: string[];
}

export interface FaceLandmark {
  type: string;
  position: { x: number; y: number; z?: number };
}

export interface PersonLandmark {
  type: string;
  position: { x: number; y: number; z?: number };
}

export interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
  confidence: number;
} 