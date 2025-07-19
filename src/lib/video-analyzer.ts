import { readFileSync } from 'fs';
import { VideoIntelligenceServiceClient, protos } from '@google-cloud/video-intelligence';
import config from '@/lib/config';
import { VideoIntelligenceResults } from '@/types';

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

export class VideoAnalyzer {
  private readonly client: VideoIntelligenceServiceClient;
  private readonly features: protos.google.cloud.videointelligence.v1.Feature[];

  constructor() {
    this.client = new VideoIntelligenceServiceClient({
      projectId: config.googleCloud.projectId,
      keyFilename: config.googleCloud.keyFile,
    });

    this.features = [
      protos.google.cloud.videointelligence.v1.Feature.OBJECT_TRACKING,
      protos.google.cloud.videointelligence.v1.Feature.FACE_DETECTION,
      protos.google.cloud.videointelligence.v1.Feature.PERSON_DETECTION,
      protos.google.cloud.videointelligence.v1.Feature.SHOT_CHANGE_DETECTION,
      protos.google.cloud.videointelligence.v1.Feature.SPEECH_TRANSCRIPTION,
      protos.google.cloud.videointelligence.v1.Feature.TEXT_DETECTION,
    ];
  }

  /**
   * 비디오 분석 및 메타데이터 추출
   */
  async analyzeVideo(
    videoInput: string | Buffer, 
    options: VideoAnalysisOptions = {}
  ): Promise<VideoIntelligenceResults> {
    try {
      let request: any;

      // 입력 타입에 따라 요청 구성
      if (typeof videoInput === 'string') {
        // GCS URI 또는 로컬 파일 경로
        if (videoInput.startsWith('gs://')) {
          request = {
            inputUri: videoInput,
            features: this.features,
          };
        } else {
          // 로컬 파일 처리
          const inputContent = readFileSync(videoInput);
          request = {
            inputContent,
            features: this.features,
          };
        }
      } else {
        // Buffer 처리
        request = {
          inputContent: videoInput,
          features: this.features,
        };
      }

      // 음성 전사 설정
      if (options.enableTranscription || options.enableSpeakerDiarization) {
        request.videoContext = {
          speechTranscriptionConfig: {
            languageCode: 'ko-KR',
            enableSpeakerDiarization: options.enableSpeakerDiarization || false,
            diarizationSpeakerCount: 2,
            enableWordTimeOffsets: true,
            enableWordConfidence: true,
          },
        };
      }

      console.log('🎬 비디오 분석 시작...');
      
      // 분석 요청 실행
      const [operation] = await this.client.annotateVideo(request);
      
      console.log('⏳ 분석 처리 중...');
      const [result] = await operation.promise();
      
      console.log('✅ 비디오 분석 완료!');
      
      return this.processResults(result);
      
    } catch (error) {
      console.error('❌ 비디오 분석 중 오류:', error);
      throw new Error(`비디오 분석 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * 분석 결과를 구조화된 형태로 변환
   */
  private processResults(result: any): VideoIntelligenceResults {
    const annotationResults = result.annotationResults?.[0];
    
    if (!annotationResults) {
      throw new Error('분석 결과가 없습니다.');
    }

    // 객체 추적 데이터 처리
    const objectTracking = annotationResults.objectAnnotations?.map((obj: any) => ({
      entity: {
        entityId: obj.entity?.entityId || '',
        description: obj.entity?.description || '',
        languageCode: obj.entity?.languageCode || 'ko'
      },
      confidence: obj.confidence || 0,
      frames: obj.frames?.map((frame: any) => ({
        normalizedBoundingBox: {
          left: frame.normalizedBoundingBox?.left || 0,
          top: frame.normalizedBoundingBox?.top || 0,
          right: frame.normalizedBoundingBox?.right || 0,
          bottom: frame.normalizedBoundingBox?.bottom || 0,
        },
        timeOffset: this.parseTimeOffset(frame.timeOffset)
      })) || [],
      segment: {
        startTimeOffset: this.parseTimeOffset(obj.segment?.startTimeOffset),
        endTimeOffset: this.parseTimeOffset(obj.segment?.endTimeOffset)
      }
    })) || [];

    // 음성 전사 데이터 처리
    const speechTranscription = annotationResults.speechTranscriptions?.map((speech: any) => ({
      alternatives: speech.alternatives?.map((alt: any) => ({
        transcript: alt.transcript || '',
        confidence: alt.confidence || 0,
        words: alt.words?.map((word: any) => ({
          word: word.word || '',
          startTime: this.parseTimeOffset(word.startTime),
          endTime: this.parseTimeOffset(word.endTime),
          confidence: word.confidence || 0,
          speakerTag: word.speakerTag || 0
        })) || []
      })) || [],
      languageCode: speech.languageCode || 'ko'
    })) || [];

    // 얼굴 감지 데이터 처리
    const faceDetection = annotationResults.faceAnnotations?.map((face: any) => ({
      tracks: face.tracks?.map((track: any) => ({
        segment: {
          startTimeOffset: this.parseTimeOffset(track.segment?.startTimeOffset),
          endTimeOffset: this.parseTimeOffset(track.segment?.endTimeOffset)
        },
        timestampedObjects: track.timestampedObjects?.map((obj: any) => ({
          normalizedBoundingBox: {
            left: obj.normalizedBoundingBox?.left || 0,
            top: obj.normalizedBoundingBox?.top || 0,
            right: obj.normalizedBoundingBox?.right || 0,
            bottom: obj.normalizedBoundingBox?.bottom || 0,
          },
          timeOffset: this.parseTimeOffset(obj.timeOffset),
          attributes: obj.attributes || [],
          landmarks: obj.landmarks || []
        })) || []
      })) || []
    })) || [];

    // 사람 감지 데이터 처리
    const personDetection = annotationResults.personDetectionAnnotations?.map((person: any) => ({
      tracks: person.tracks?.map((track: any) => ({
        segment: {
          startTimeOffset: this.parseTimeOffset(track.segment?.startTimeOffset),
          endTimeOffset: this.parseTimeOffset(track.segment?.endTimeOffset)
        },
        timestampedObjects: track.timestampedObjects?.map((obj: any) => ({
          normalizedBoundingBox: {
            left: obj.normalizedBoundingBox?.left || 0,
            top: obj.normalizedBoundingBox?.top || 0,
            right: obj.normalizedBoundingBox?.right || 0,
            bottom: obj.normalizedBoundingBox?.bottom || 0,
          },
          timeOffset: this.parseTimeOffset(obj.timeOffset),
          attributes: obj.attributes || [],
          landmarks: obj.landmarks || []
        })) || []
      })) || []
    })) || [];

    // 장면 변화 데이터 처리
    const shotChanges = annotationResults.shotAnnotations?.map((shot: any) => ({
      startTimeOffset: this.parseTimeOffset(shot.startTimeOffset),
      endTimeOffset: this.parseTimeOffset(shot.endTimeOffset)
    })) || [];

    // 명시적 콘텐츠 데이터 처리
    const explicitContent = annotationResults.explicitAnnotation?.frames?.map((frame: any) => ({
      timeOffset: this.parseTimeOffset(frame.timeOffset),
      pornographyLikelihood: frame.pornographyLikelihood || 'VERY_UNLIKELY'
    })) || [];

    return {
      objectTracking,
      speechTranscription,
      faceDetection,
      personDetection,
      shotChanges,
      explicitContent
    };
  }

  /**
   * 시간 오프셋 파싱
   */
  private parseTimeOffset(timeOffset: any): number {
    if (!timeOffset) {
      return 0;
    }
    
    const seconds = parseInt(timeOffset.seconds || '0');
    const nanos = parseInt(timeOffset.nanos || '0');
    
    return seconds + nanos / 1000000000;
  }

  /**
   * 비디오 품질 메트릭 계산
   */
  async calculateQualityMetrics(analysisResults: VideoIntelligenceResults): Promise<{
    videoQuality: number;
    audioQuality: number;
    overallQuality: number;
  }> {
    // 비디오 품질 평가 (객체 추적 및 얼굴 감지 기반)
    const videoQuality = this.assessVideoQuality(analysisResults);
    
    // 오디오 품질 평가 (음성 전사 정확도 기반)
    const audioQuality = this.assessAudioQuality(analysisResults);
    
    // 전체 품질 점수
    const overallQuality = (videoQuality + audioQuality) / 2;
    
    return {
      videoQuality: Math.round(videoQuality * 100) / 100,
      audioQuality: Math.round(audioQuality * 100) / 100,
      overallQuality: Math.round(overallQuality * 100) / 100
    };
  }

  private assessVideoQuality(results: VideoIntelligenceResults): number {
    let quality = 0.5; // 기본 점수

    // 객체 추적 데이터 품질 평가
    if (results.objectTracking?.length > 0) {
      const avgConfidence = results.objectTracking.reduce((sum, obj) => sum + obj.confidence, 0) / results.objectTracking.length;
      quality += avgConfidence * 0.3;
    }

    // 얼굴 감지 데이터 품질 평가
    if (results.faceDetection?.length > 0) {
      quality += 0.2; // 얼굴이 감지되면 품질 향상
    }

    // 사람 감지 데이터 품질 평가
    if (results.personDetection?.length > 0) {
      quality += 0.2; // 사람이 감지되면 품질 향상
    }

    return Math.min(quality, 1.0); // 최대 1.0으로 제한
  }

  private assessAudioQuality(results: VideoIntelligenceResults): number {
    let quality = 0.5; // 기본 점수

    // 음성 전사 품질 평가
    if (results.speechTranscription?.length > 0) {
      const transcriptions = results.speechTranscription;
      let totalConfidence = 0;
      let totalWords = 0;

      transcriptions.forEach(speech => {
        speech.alternatives?.forEach(alt => {
          if (alt.words) {
            alt.words.forEach(word => {
              totalConfidence += word.confidence;
              totalWords++;
            });
          }
        });
      });

      if (totalWords > 0) {
        const avgConfidence = totalConfidence / totalWords;
        quality += avgConfidence * 0.5;
      }
    }

    return Math.min(quality, 1.0); // 최대 1.0으로 제한
  }

  /**
   * 분석 진행 상황 콜백과 함께 비디오 분석 (실시간 업데이트용)
   */
  async analyzeVideoWithProgress(
    videoInput: string | Buffer,
    options: VideoAnalysisOptions = {},
    progressCallback?: (progress: number, stage: string) => void
  ): Promise<VideoIntelligenceResults> {
    
    if (progressCallback) {
      progressCallback(10, '비디오 업로드 중...');
    }

    try {
      // 분석 요청 시작
      if (progressCallback) {
        progressCallback(30, '분석 요청 전송 중...');
      }

      const results = await this.analyzeVideo(videoInput, options);

      if (progressCallback) {
        progressCallback(80, '결과 처리 중...');
      }

      // 품질 메트릭 계산
      const qualityMetrics = await this.calculateQualityMetrics(results);

      if (progressCallback) {
        progressCallback(100, '분석 완료!');
      }

      return results;
    } catch (error) {
      if (progressCallback) {
        progressCallback(0, '분석 실패');
      }
      throw error;
    }
  }
} 