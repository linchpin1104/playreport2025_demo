import { PlayAnalysisCore , PlayAnalysisExtractor } from '@/lib/play-analysis-extractor';
import { VideoIntelligenceResults } from '@/types';
import { AppError } from '../errors';
import { GCPDataStorage } from '../gcp-data-storage';
import { IntegratedAnalysisSystem , IntegratedAnalysisResult } from '../integrated-analysis-system';
import { ServiceResult } from '../interfaces';
import { VideoAnalyzer } from '../video-analyzer';
import { ErrorHandlingService } from './error-handling-service';
import { Logger } from './logger';
import { ConfigManager } from './config-manager';

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
    analysisMode: 'development' | 'production';
    sessionId?: string;
  };
  stage1Complete: boolean;
  stage2Complete: boolean;
  stage3Complete: boolean;
  stage4Complete: boolean;
}

export interface ProcessedAnalysisData {
  videoAnalysisData: {
    objectTracking: VideoIntelligenceResults['objectTracking'];
    faceDetection: VideoIntelligenceResults['faceDetection'];
    personDetection: VideoIntelligenceResults['personDetection'];
    shotChanges: VideoIntelligenceResults['shotChanges'];
  };
  audioAnalysisData: {
    transcript: TranscriptEntry[];
    speakers: string[];
    emotions: EmotionEntry[];
    voiceMetrics: VoiceMetricsEntry[];
  };
  sessionMetadata: {
    duration: number;
    participants: string[];
    sessionType: 'play-interaction';
    timestamp: string;
  };
}

export interface TranscriptEntry {
  text: string;
  confidence: number;
  startTime: number;
  endTime: number;
  speaker: string;
  time: number; // 호환성을 위해 추가
}

export interface EmotionEntry {
  emotion: string;
  confidence: number;
  timeSegment: { start: number; end: number };
  speaker: string;
}

export interface VoiceMetricsEntry {
  volume: number;
  pitch: number;
  rate: number;
  timeSegment: { start: number; end: number };
  speaker: string;
}

export class VideoAnalysisService {
  private readonly logger: Logger;
  private readonly errorHandler: ErrorHandlingService;

  constructor(
    private readonly videoAnalyzer: VideoAnalyzer,
    private readonly gcpDataStorage: GCPDataStorage,
    private readonly integratedAnalysisSystem: IntegratedAnalysisSystem,
    private readonly playAnalysisExtractor: PlayAnalysisExtractor
  ) {
    this.logger = new Logger('VideoAnalysisService');
    this.errorHandler = new ErrorHandlingService();
  }

  /**
   * 전체 비디오 분석 워크플로우 실행
   */
  async performCompleteAnalysis(request: VideoAnalysisRequest): Promise<ServiceResult<VideoAnalysisResult>> {
    return this.errorHandler.wrapAsync(
      'complete-video-analysis',
      async () => {
        this.logger.info('Starting complete video analysis', { request });

        // 런타임에서 필요한 환경변수 검증
        try {
          const configManager = ConfigManager.getInstance();
          
          // GCP 관련 설정이 필요한 경우에만 체크
          if (request.options?.enableTranscription || 
              request.options?.enableSpeakerDiarization || 
              request.options?.enableComprehensiveAnalysis) {
            configManager.validateRequiredConfig(['gcp.keyFile']);
          }
          
          // OpenAI 관련 설정이 필요한 경우에만 체크
          if (request.options?.enableComprehensiveAnalysis ||
              request.options?.enableSentimentAnalysis) {
            configManager.validateRequiredConfig(['apis.openai.apiKey']);
          }
        } catch (configError) {
          // 환경변수 누락 시 경고 로그만 남기고 계속 진행 (개발 모드)
          this.logger.warn('Configuration warning (continuing with limited features):', {
            error: configError instanceof Error ? configError.message : String(configError)
          });
        }

        // 1. 비디오 경로 확인
        const videoPathResult = await this.resolveVideoPath(request);
        if (videoPathResult.isFailure()) {
          throw new Error(`Video path resolution failed: ${videoPathResult.getError().message}`);
        }

        const { videoPath, sessionData } = videoPathResult.getValue();

        // 2. Stage 1: 기본 비디오 분석
        this.logger.info('🎬 Stage 1: Google Cloud Video Intelligence 분석 시작...');
        const stage1Result = await this.performStage1Analysis(videoPath, request.options);
        if (stage1Result.isFailure()) {
          throw new Error(`Stage 1 analysis failed: ${stage1Result.getError().message}`);
        }

        const analysisResults = stage1Result.getValue();
        this.logger.info('✅ Stage 1 완료: 기본 비디오 분석 완료');

        // 3. Stage 2: 데이터 분리 및 가공
        this.logger.info('🔄 Stage 2: 데이터 분리 및 가공 시작...');
        const stage2Result = await this.performStage2Processing(analysisResults);
        if (stage2Result.isFailure()) {
          throw new Error(`Stage 2 processing failed: ${stage2Result.getError().message}`);
        }

        const processedData = stage2Result.getValue();
        this.logger.info('✅ Stage 2 완료: 데이터 분리 완료');

        // 4. Stage 3: 통합 분석
        this.logger.info('🎯 Stage 3: 통합 분석 시작...');
        const stage3Result = await this.performStage3Analysis(processedData);
        if (stage3Result.isFailure()) {
          throw new Error(`Stage 3 analysis failed: ${stage3Result.getError().message}`);
        }

        const integratedResults = stage3Result.getValue();
        this.logger.info('✅ Stage 3 완료: 통합 분석 완료');

        // 5. Stage 4: 핵심 정보 추출 (원본 analysisResults 사용)
        this.logger.info('🎪 Stage 4: 핵심 정보 추출 시작...');
        const stage4Result = await this.performStage4Extraction(analysisResults, sessionData);
        if (stage4Result.isFailure()) {
          throw new Error(`Stage 4 extraction failed: ${stage4Result.getError().message}`);
        }

        this.logger.info('✅ Stage 4 완료: 핵심 정보 추출 완료');
        this.logger.info('🎉 전체 분석 완료!');

        // 6. 결과 구성
        const result: VideoAnalysisResult = {
          analysisResults,
          metadata: {
            fileName: request.fileName || sessionData?.metadata?.fileName || 'unknown',
            gsUri: videoPath,
            processingTime: Date.now(),
            analysisMode: 'production',
            sessionId: request.sessionId
          },
          stage1Complete: true,
          stage2Complete: true,
          stage3Complete: true,
          stage4Complete: true
        };

        return result;
      },
      {
        sessionId: request.sessionId,
        metadata: {
          fileName: request.fileName,
          gsUri: request.gsUri,
          endpoint: '/api/analyze',
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

  /**
   * Stage 1: 기본 비디오 분석
   */
  private async performStage1Analysis(videoPath: string, options: Record<string, any> = {}): Promise<ServiceResult<VideoIntelligenceResults>> {
    return this.errorHandler.wrapAsync(
      'stage1-video-analysis',
      async () => {
        const analysisOptions = {
          enableVoiceAnalysis: true,
          enableGestureRecognition: true,
          enableObjectDetection: true,
          enableFaceDetection: true,
          enableTranscription: true,
          enableSpeakerDiarization: true,
          enableSentimentAnalysis: true,
          enableQualityMetrics: true,
          enableComprehensiveAnalysis: true,
          ...options
        };

        const results = await this.videoAnalyzer.analyzeVideo(videoPath, analysisOptions);
        
        // 🚨 핵심: 사람 감지 확인 (Person Detection 또는 Object Detection)
        const hasPersonDetection = results.personDetection && results.personDetection.length > 0;
        const hasPersonInObjects = results.objectTracking && 
          results.objectTracking.some((obj: any) => 
            obj.entity?.description?.toLowerCase() === 'person' && obj.confidence > 0.5
          );

        if (!hasPersonDetection && !hasPersonInObjects) {
          throw new Error(
            '영상에서 사람을 감지할 수 없어 놀이 상호작용 분석이 불가능합니다. ' +
            '다음을 확인해주세요:\n' +
            '• 영상에 사람이 명확하게 보이는지 확인\n' +
            '• 영상 화질이 충분한지 확인\n' +
            '• 조명이 적절한지 확인\n' +
            '• 카메라가 사람 전체를 촬영하고 있는지 확인'
          );
        }

        // Person Detection이 실패했지만 Object Detection에서 person을 찾은 경우 로그
        if (!hasPersonDetection && hasPersonInObjects) {
          console.log('ℹ️ Person Detection API 실패, Object Detection에서 사람 감지 대체 사용');
          
          // Object Detection 결과를 Person Detection 형태로 변환
          const personObjects = results.objectTracking.filter((obj: any) => 
            obj.entity?.description?.toLowerCase() === 'person' && obj.confidence > 0.5
          );
          
          console.log(`👥 Object Detection에서 감지된 사람: ${personObjects.length}명`);
          personObjects.forEach((person: any, index: number) => {
            console.log(`👤 Person ${index + 1}: 신뢰도 ${(person.confidence * 100).toFixed(1)}%, 프레임 ${person.frames?.length || 0}개`);
          });
        }
        
        // 얼굴이나 음성 전사도 확인 (선택사항이지만 경고)
        if (results.faceDetection.length === 0 && results.speechTranscription.length === 0) {
          this.logger.warn('⚠️ 얼굴과 음성이 모두 감지되지 않았습니다. 분석 품질이 제한적일 수 있습니다.');
        }

        return results;
      },
      {
        metadata: {
          videoPath,
          stage: 'stage1',
          timestamp: new Date().toISOString()
        }
      }
    );
  }

  /**
   * Stage 2: 데이터 분리 및 가공
   */
  private async performStage2Processing(analysisResults: VideoIntelligenceResults): Promise<ServiceResult<ProcessedAnalysisData>> {
    return this.errorHandler.wrapAsync(
      'stage2-data-processing',
      async () => {
        // 필요한 핵심 정보만 추출하여 가공
        const processedData: ProcessedAnalysisData = {
          videoAnalysisData: {
            objectTracking: analysisResults.objectTracking || [],
            faceDetection: analysisResults.faceDetection || [],
            personDetection: analysisResults.personDetection || [],
            shotChanges: analysisResults.shotChanges || []
          },
          audioAnalysisData: {
            transcript: this.extractTranscript(analysisResults.speechTranscription),
            speakers: this.extractSpeakers(analysisResults.speechTranscription),
            emotions: [],
            voiceMetrics: []
          },
          sessionMetadata: {
            duration: this.calculateDuration(analysisResults.shotChanges),
            participants: ['parent', 'child'],
            sessionType: 'play-interaction',
            timestamp: new Date().toISOString()
          }
        };

        return processedData;
      },
      {
        metadata: {
          stage: 'stage2',
          dataSize: JSON.stringify(analysisResults).length,
          timestamp: new Date().toISOString()
        }
      }
    );
  }

  /**
   * Stage 3: 통합 분석
   */
  private async performStage3Analysis(processedData: ProcessedAnalysisData): Promise<ServiceResult<IntegratedAnalysisResult>> {
    return this.errorHandler.wrapAsync(
      'stage3-integrated-analysis',
      async () => {
        return await this.integratedAnalysisSystem.performIntegratedAnalysis(
          processedData,
          processedData.sessionMetadata.timestamp
        );
      },
      {
        metadata: {
          stage: 'stage3',
          sessionType: processedData.sessionMetadata.sessionType,
          timestamp: new Date().toISOString()
        }
      }
    );
  }

  /**
   * Stage 4: 핵심 정보 추출
   */
  private async performStage4Extraction(analysisResults: VideoIntelligenceResults, sessionData: any): Promise<ServiceResult<PlayAnalysisCore>> {
    return this.errorHandler.wrapAsync(
      'stage4-core-extraction',
      async () => {
        const playCore = await this.playAnalysisExtractor.extractPlayAnalysisCore(
          analysisResults,
          {
            fileName: sessionData?.metadata?.fileName || 'unknown',
            fileSize: sessionData?.metadata?.fileSize || 0,
            exportTime: new Date().toISOString()
          }
        );

        // 세션이 있는 경우 핵심 정보 저장
        if (sessionData?.sessionId) {
          await this.gcpDataStorage.savePlayCore(sessionData.sessionId, playCore);
          await this.gcpDataStorage.updateSessionStatus(sessionData.sessionId, 'analyzed');
        }

        return playCore;
      },
      {
        sessionId: sessionData?.sessionId,
        metadata: {
          stage: 'stage4',
          fileName: sessionData?.metadata?.fileName,
          timestamp: new Date().toISOString()
        }
      }
    );
  }

  /**
   * 전사 데이터 추출
   */
  private extractTranscript(speechTranscription: any[]): TranscriptEntry[] {
    if (!speechTranscription || speechTranscription.length === 0) {
      return [];
    }

    return speechTranscription.map(item => ({
      text: item.alternatives?.[0]?.transcript || '',
      confidence: item.alternatives?.[0]?.confidence || 0,
      startTime: item.alternatives?.[0]?.words?.[0]?.startTime || 0,
      endTime: item.alternatives?.[0]?.words?.[item.alternatives[0].words.length - 1]?.endTime || 0,
      speaker: item.alternatives?.[0]?.words?.[0]?.speakerTag?.toString() || 'unknown',
      time: item.alternatives?.[0]?.words?.[0]?.startTime || 0
    }));
  }

  /**
   * 화자 정보 추출
   */
  private extractSpeakers(speechTranscription: any[]): string[] {
    if (!speechTranscription || speechTranscription.length === 0) {
      return [];
    }

    const speakers = new Set<string>();
    speechTranscription.forEach(item => {
      item.alternatives?.[0]?.words?.forEach((word: any) => {
        if (word.speakerTag) {
          speakers.add(`speaker_${word.speakerTag}`);
        }
      });
    });

    return Array.from(speakers);
  }

  /**
   * 비디오 지속 시간 계산
   */
  private calculateDuration(shotChanges: any[]): number {
    if (!shotChanges || shotChanges.length === 0) {
      return 0;
    }

    const lastShot = shotChanges[shotChanges.length - 1];
    return lastShot.endTimeOffset || 0;
  }
} 