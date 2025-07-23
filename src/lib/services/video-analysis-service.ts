import { VideoIntelligenceResults } from '@/types';
import { AppError } from '../errors';
import { GCPDataStorage } from '../gcp-data-storage';
import { ServiceResult } from '../interfaces';
import { VideoAnalyzer } from '../video-analyzer';
import { ErrorHandlingService } from './error-handling-service';
import { Logger } from './logger';

export interface VideoAnalysisRequest {
  sessionId?: string;
  gsUri?: string;
  fileName?: string;
  options?: {
    enableVoiceAnalysis?: boolean;
    enableGestureRecognition?: boolean;
    enableObjectDetection?: boolean;
    enableFaceDetection?: boolean;
    enableTranscription?: boolean;
    enableSpeakerDiarization?: boolean;
    enableSentimentAnalysis?: boolean;
    enableQualityMetrics?: boolean;
    enableComprehensiveAnalysis?: boolean;
  };
  participantInfo?: {
    childAge?: number;
    specialNeeds?: string[];
    previousAnalysis?: string[];
  };
}

export interface VideoAnalysisResult {
  analysisResults: VideoIntelligenceResults;
  metadata: {
    fileName: string;
    gsUri: string;
    processingTime: number;
    analysisMode: string;
    sessionId?: string;
  };
  stage1Complete: boolean;
  stage2Complete: boolean;
  stage3Complete: boolean;
  stage4Complete: boolean;
}

/**
 * 🎬 간소화된 비디오 분석 서비스
 * DI 시스템 제거하고 직접 인스턴스화 사용
 */
export class VideoAnalysisService {
  private readonly logger: Logger;
  private readonly errorHandler: ErrorHandlingService;
  private readonly videoAnalyzer: VideoAnalyzer;
  private readonly gcpDataStorage: GCPDataStorage;

  constructor() {
    this.logger = new Logger('VideoAnalysisService');
    this.errorHandler = new ErrorHandlingService();
    this.videoAnalyzer = new VideoAnalyzer();
    this.gcpDataStorage = new GCPDataStorage();
  }

  /**
   * 전체 비디오 분석 워크플로우 실행 (단순화됨)
   */
  async performCompleteAnalysis(request: VideoAnalysisRequest): Promise<ServiceResult<VideoIntelligenceResults>> {
    return this.errorHandler.wrapAsync(
      'video-analysis',
      async () => {
        this.logger.info('🎬 Starting simplified video analysis', { request });

        // 1. 비디오 경로 확인
        const videoPathResult = await this.resolveVideoPath(request);
        if (videoPathResult.isFailure()) {
          throw new Error(`Video path resolution failed: ${videoPathResult.getError().message}`);
        }

        const { videoPath } = videoPathResult.getValue();

        // 2. VideoAnalyzer로 직접 분석 (단계별 복잡성 제거)
        this.logger.info('🔍 Starting Google Cloud Video Intelligence analysis...');
        
        const analysisOptions = {
          enableVoiceAnalysis: request.options?.enableVoiceAnalysis ?? true,
          enableVideoAnalysis: request.options?.enableVideoAnalysis ?? true,
          enableTranscription: request.options?.enableTranscription ?? true,
          enableSpeakerDiarization: request.options?.enableSpeakerDiarization ?? true,
          enableFaceDetection: request.options?.enableFaceDetection ?? true,
          enableObjectDetection: request.options?.enableObjectDetection ?? true,
          enableGestureRecognition: request.options?.enableGestureRecognition ?? true,
        };

        const results = await this.videoAnalyzer.analyzeVideo(videoPath, analysisOptions);
        
        this.logger.info('✅ Video Intelligence analysis completed');
        
        // 3. 결과 반환 (추가 처리 없이)
        return results;
      },
      {
        sessionId: request.sessionId,
        metadata: {
          fileName: request.fileName,
          gsUri: request.gsUri,
          timestamp: new Date().toISOString()
        }
      }
    );
  }

  /**
   * 비디오 경로 해결
   */
  private async resolveVideoPath(request: VideoAnalysisRequest): Promise<ServiceResult<{ videoPath: string; sessionData: any }>> {
    return this.errorHandler.wrapAsync(
      'resolve-video-path',
      async () => {
        if (!request.sessionId && !request.gsUri) {
          throw new Error('sessionId 또는 gsUri가 필요합니다.');
        }

        if (request.sessionId) {
          const session = await this.gcpDataStorage.getSession(request.sessionId);
          if (!session) {
            throw new Error('세션을 찾을 수 없습니다.');
          }

          const videoPath = session.paths.rawDataPath;
          if (!videoPath) {
            throw new Error('비디오 경로가 없습니다.');
          }

          return { videoPath, sessionData: session };
        } else {
          return { videoPath: request.gsUri!, sessionData: null };
        }
      },
      {
        sessionId: request.sessionId,
        metadata: {
          gsUri: request.gsUri,
          timestamp: new Date().toISOString()
        }
      }
    );
  }
}

/**
 * 🏭 간소화된 팩토리 함수 (DI 시스템 대체)
 */
export function getVideoAnalysisService(): VideoAnalysisService {
  return new VideoAnalysisService();
} 