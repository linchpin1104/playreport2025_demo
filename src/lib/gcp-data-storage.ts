import { Firestore } from '@google-cloud/firestore';
import { Storage } from '@google-cloud/storage';
import { 
  PlayAnalysisSession, 
  PlayEvaluationResult,
  IntegratedAnalysisResult,
  TemporalAnalysis,
  GCPInteractionPattern as InteractionPattern,
  UserInfo
} from '@/types';
import { PlayAnalysisCore } from '@/types/play-analysis';
import { config } from '@/lib/config';

// 세션 데이터 타입들
export interface PlaySessionMetadata {
  createdAt: string;
  uploadedAt: string;
  status: 'created' | 'uploaded' | 'analyzed' | 'completed' | 'error' | 'evaluation_completed' | 'integrated_analysis_completed';
  originalFileName: string;
  fileSize: number;
  duration?: number;
  userId?: string;
  processedAt?: string;
  analysisType: 'comprehensive' | 'basic' | 'detailed';
}

// 사용자 정보 타입 (기본)
export interface BaseUserInfo {
  childAge: number;
  childName: string;
  childGender: '남자' | '여자';
  caregiverName: string;
  phoneNumber: string;
  caregiverType: '엄마' | '아빠' | '조부모' | '기타';
  additionalNotes?: string;
  submittedAt: string;
}

// 확장된 사용자 정보 타입 (선택적 필드들 포함)
export interface ExtendedUserInfo extends BaseUserInfo {
  relationshipWithChild?: string;
  previousPlaySessions?: number;
  specialConcerns?: string[];
  developmentalStage?: string;
}

// 경로 정보 타입  
export interface PlaySessionPaths {
  rawDataPath?: string;
  processedDataPath?: string;
  analysisPath?: string;
  reportPath?: string;
  evaluationPath?: string;
  integratedAnalysisPath?: string;
}

export class GCPDataStorage {
  private readonly firestore: Firestore;
  private readonly storage: Storage;
  private readonly bucketName: string;

  // Firestore 컬렉션 이름들
  private readonly SESSIONS_COLLECTION = 'play-sessions';
  private readonly CORES_COLLECTION = 'play-cores';
  private readonly EVALUATIONS_COLLECTION = 'play-evaluations';
  private readonly REPORTS_COLLECTION = 'play-reports';
  private readonly VOICE_ANALYSIS_COLLECTION = 'voice-analysis';
  private readonly SESSION_INDEX_DOC = 'session-index';

  constructor() {
    const serviceAccountJson = process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    
    // Vercel 환경에서는 JSON 키를 직접 사용
    if (serviceAccountJson) {
      console.log('✅ Service Account JSON 발견, Firestore 직접 인증 사용');
      try {
        const credentials = JSON.parse(serviceAccountJson);
        
        // Firestore 초기화 (JSON 키 사용)
        this.firestore = new Firestore({
          projectId: config.googleCloud.projectId,
          credentials,
          ignoreUndefinedProperties: true,
          settings: {
            maxRetries: 3,
            timeout: 30000,
            keepAlive: true,
            maxIdleChannels: 10,
            retryOptions: {
              maxRetries: 3,
              initialRetryDelayMillis: 100,
              maxRetryDelayMillis: 30000
            }
          }
        });

        // Cloud Storage 초기화 (JSON 키 사용)
        this.storage = new Storage({
          projectId: config.googleCloud.projectId,
          credentials,
          timeout: 120000
        });
      } catch (jsonError) {
        console.error('❌ Service Account JSON 파싱 실패:', jsonError);
        throw new Error(`Service Account JSON 파싱 실패: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
      }
    } 
    // 로컬 개발환경에서는 키 파일 사용
    else if (config.googleCloud.keyFile && config.googleCloud.keyFile.length > 0) {
      console.log('✅ 키 파일 경로 발견, Firestore 파일 인증 사용');
      
      // Firestore 초기화 (키 파일 사용)
      this.firestore = new Firestore({
        projectId: config.googleCloud.projectId,
        keyFilename: config.googleCloud.keyFile,
        ignoreUndefinedProperties: true,
        settings: {
          maxRetries: 3,
          timeout: 30000,
          keepAlive: true,
          maxIdleChannels: 10,
          retryOptions: {
            maxRetries: 3,
            initialRetryDelayMillis: 100,
            maxRetryDelayMillis: 30000
          }
        }
      });

      // Cloud Storage 초기화 (키 파일 사용)
      this.storage = new Storage({
        projectId: config.googleCloud.projectId,
        keyFilename: config.googleCloud.keyFile,
        timeout: 120000
      });
    }
    // Application Default Credentials 시도
    else {
      console.log('⚠️ 명시적 인증 정보 없음, Application Default Credentials 시도');
      
      // Firestore 초기화 (기본 인증)
      this.firestore = new Firestore({
        projectId: config.googleCloud.projectId,
        ignoreUndefinedProperties: true,
        settings: {
          maxRetries: 3,
          timeout: 30000,
          keepAlive: true,
          maxIdleChannels: 10,
          retryOptions: {
            maxRetries: 3,
            initialRetryDelayMillis: 100,
            maxRetryDelayMillis: 30000
          }
        }
      });

      // Cloud Storage 초기화 (기본 인증)
      this.storage = new Storage({
        projectId: config.googleCloud.projectId,
        timeout: 120000
      });
    }

    this.bucketName = config.googleCloud.bucketName;
    
    console.log(`✅ GCPDataStorage 초기화 완료:`);
    console.log(`   - Project: ${config.googleCloud.projectId}`);
    console.log(`   - Bucket: ${this.bucketName}`);
    console.log(`   - Auth: ${serviceAccountJson ? 'JSON Key' : config.googleCloud.keyFile ? 'Key File' : 'Default'}`);
  }

  /**
   * 🎬 새 분석 세션 생성
   */
  async createSession(
    originalName: string,
    fileSize: number
  ): Promise<PlayAnalysisSession> {
    const sessionId = this.generateSessionId();
    const now = new Date().toISOString();

    const session: PlayAnalysisSession = {
      sessionId,
      metadata: {
        fileName: sessionId,
        originalName,
        fileSize,
        uploadedAt: now,
        analyzedAt: '',
        lastUpdated: now,
        status: 'uploaded'
      },
      paths: {
        rawDataPath: '',
        videoUrl: '',
        thumbnailUrl: ''
      },
      analysis: {
        participantCount: 0,
        videoDuration: 0,
        safetyScore: 0
      },
      tags: []
    };

    try {
      // Firestore에 저장
      await this.firestore
        .collection(this.SESSIONS_COLLECTION)
        .doc(sessionId)
        .set(session);

      // 세션 인덱스 업데이트
      await this.updateSessionIndex(session);

      console.log(`✅ Session created in Firestore: ${sessionId}`);
      return session;
    } catch (error) {
      console.error(`❌ Error creating session:`, error);
      throw error;
    }
  }

  /**
   * 🎬 사용자 정보와 함께 새 분석 세션 생성
   */
  async createSessionWithUserInfo(
    originalName: string,
    fileSize: number,
    userInfo: UserInfo
  ): Promise<PlayAnalysisSession> {
    const sessionId = this.generateSessionId();
    const now = new Date().toISOString();

    const session: PlayAnalysisSession = {
      sessionId,
      userInfo,
      metadata: {
        fileName: sessionId,
        originalName,
        fileSize,
        uploadedAt: now,
        analyzedAt: '',
        lastUpdated: now,
        status: 'uploaded'
      },
      paths: {
        rawDataPath: '',
        videoUrl: '',
        thumbnailUrl: ''
      },
      analysis: {
        participantCount: 0,
        videoDuration: 0,
        safetyScore: 0
      },
      tags: []
    };

    try {
      // Firestore에 저장
      await this.firestore
        .collection(this.SESSIONS_COLLECTION)
        .doc(sessionId)
        .set(session);

      // Cloud Storage에 JSON 백업 저장
      await this.saveToCloudStorage(`sessions/${sessionId}.json`, session);

      // 세션 인덱스 업데이트
      await this.updateSessionIndex(session);

      console.log(`✅ Session with user info created in Firestore: ${sessionId}`);
      return session;
    } catch (error) {
      console.error(`❌ Error creating session with user info:`, error);
      throw error;
    }
  }

  /**
   * 📄 세션 정보 조회
   */
  async getSession(sessionId: string): Promise<PlayAnalysisSession | null> {
    try {
      const doc = await this.firestore
        .collection(this.SESSIONS_COLLECTION)
        .doc(sessionId)
        .get();

      if (!doc.exists) {
        return null;
      }

      return doc.data() as PlayAnalysisSession;
    } catch (error) {
      console.error(`❌ Error getting session ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * 💾 세션 정보 저장/업데이트
   */
  async saveSession(session: PlayAnalysisSession): Promise<void> {
    try {
      session.metadata.lastUpdated = new Date().toISOString();

      // Firestore에 저장
      await this.firestore
        .collection(this.SESSIONS_COLLECTION)
        .doc(session.sessionId)
        .set(session, { merge: true });

      // Cloud Storage에 JSON 백업
      await this.saveToCloudStorage(`sessions/${session.sessionId}.json`, session);

      // 세션 인덱스 업데이트
      await this.updateSessionIndex(session);

      console.log(`✅ Session updated in Firestore: ${session.sessionId}`);
    } catch (error) {
      console.error(`❌ Error saving session ${session.sessionId}:`, error);
      throw error;
    }
  }

  /**
   * 🎯 핵심 분석 데이터 저장
   */
  async savePlayCore(
    sessionId: string,
    playCore: PlayAnalysisCore
  ): Promise<void> {
    try {
      const coreData = {
        ...playCore,
        sessionId,
        savedAt: new Date().toISOString()
      };

      // Firestore에 저장
      await this.firestore
        .collection(this.CORES_COLLECTION)
        .doc(sessionId)
        .set(coreData);

      // Cloud Storage에 JSON 백업
      await this.saveToCloudStorage(`cores/${sessionId}_core.json`, coreData);

      // 세션 정보 업데이트
      const session = await this.getSession(sessionId);
      if (session) {
        session.paths.corePath = `gs://${this.bucketName}/cores/${sessionId}_core.json`;
        session.metadata.status = 'core_extracted';
        session.analysis.participantCount = playCore.summary?.participantCount || 0;
        session.analysis.videoDuration = playCore.summary?.totalPlayTime || 0;
        session.analysis.safetyScore = playCore.metrics?.safetyScore || 0;

        await this.saveSession(session);
      }

      console.log(`✅ Play core saved in Firestore: ${sessionId}`);
    } catch (error) {
      console.error(`❌ Error saving play core for ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * 🎤 음성 분석 데이터 저장
   */
  async saveVoiceAnalysis(sessionId: string, voiceAnalysis: any): Promise<void> {
    try {
      const voiceData = {
        sessionId,
        savedAt: new Date().toISOString(),
        ...voiceAnalysis
      };

      // Firestore에 저장
      await this.firestore
        .collection(this.VOICE_ANALYSIS_COLLECTION)
        .doc(sessionId)
        .set(voiceData);

      // Cloud Storage에 JSON 백업
      await this.saveToCloudStorage(`voice-analysis/${sessionId}_voice.json`, voiceData);

      // 세션 정보 업데이트
      const session = await this.getSession(sessionId);
      if (session) {
        session.paths.voiceAnalysisPath = `gs://${this.bucketName}/voice-analysis/${sessionId}_voice.json`;
        session.metadata.status = 'voice_analyzed';
        session.voiceAnalysis = {
          speakerCount: voiceAnalysis.speakerAnalysis?.speakerProfiles?.length || 0,
          totalSpeechDuration: voiceAnalysis.speakerAnalysis?.totalSpeechDuration || 0,
          averageInteractionQuality: voiceAnalysis.emotionAnalysis?.averageInteractionQuality || 0,
          emotionalSynchrony: voiceAnalysis.emotionAnalysis?.emotionalSynchrony || 0,
          conversationBalance: voiceAnalysis.conversationAnalysis?.conversationBalance || 0
        };

        await this.saveSession(session);
      }

      console.log(`✅ Voice analysis saved in Firestore: ${sessionId}`);
    } catch (error) {
      console.error(`❌ Error saving voice analysis for ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * 📊 평가 결과 저장
   */
  async saveEvaluation(
    sessionId: string,
    evaluation: PlayEvaluationResult
  ): Promise<void> {
    try {
      // Firestore에 저장
      await this.firestore
        .collection(this.EVALUATIONS_COLLECTION)
        .doc(sessionId)
        .set(evaluation);

      // Cloud Storage에 JSON 백업
      await this.saveToCloudStorage(`evaluations/${sessionId}_evaluation.json`, evaluation);

      // 세션 정보 업데이트
      const session = await this.getSession(sessionId);
      if (session) {
        session.paths.evaluationPath = `gs://${this.bucketName}/evaluations/${sessionId}_evaluation.json`;
        session.evaluation = evaluation;
        session.metadata.status = 'evaluation_completed';
        session.analysis.overallScore = evaluation.scores.overall;
        session.analysis.keyInsights = evaluation.insights.strengths.slice(0, 3);

        await this.saveSession(session);
      }

      console.log(`✅ Evaluation saved in Firestore: ${sessionId}`);
    } catch (error) {
      console.error(`❌ Error saving evaluation for ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * 📊 분석 단계별 결과 저장 (크기 최적화)
   */
  async saveAnalysisStep(
    sessionId: string,
    step: string,
    analysisData: any
  ): Promise<void> {
    try {
      // 데이터 정리 (undefined 값 제거 및 Firestore 호환성 확보)
      const cleanedData = this.makeFirestoreCompatible(analysisData);
      
      // 데이터 크기 확인 및 최적화
      const dataString = JSON.stringify(cleanedData);
      const dataSize = Buffer.byteLength(dataString, 'utf8');
      
      console.log(`📊 분석 데이터 크기: ${dataSize} bytes`);
      
      // 1MB 제한 체크
      if (dataSize > 1000000) { // 1MB 제한보다 작게 설정
        console.log('📦 데이터 크기가 큰 관계로 요약 버전 저장');
        
        // 요약 데이터 생성
        const summarizedData = this.createSummaryData(cleanedData, sessionId, step);
        
        const stepData = {
          sessionId,
          step,
          savedAt: new Date().toISOString(),
          dataSize,
          isSummary: true,
          ...summarizedData
        };

        // Firestore에 요약 데이터 저장
        await this.firestore
          .collection('analysis-steps')
          .doc(`${sessionId}_${step}`)
          .set(stepData);

        // 전체 데이터는 Cloud Storage에만 저장
        await this.saveToCloudStorage(`analysis-steps/${sessionId}_${step}_full.json`, {
          sessionId,
          step,
          savedAt: new Date().toISOString(),
          dataSize,
          isFull: true,
          ...cleanedData
        });

        console.log(`✅ 요약 데이터 저장 완료: ${sessionId} - ${step}`);
      } else {
        // 일반 크기 데이터는 기존 방식으로 저장
        const stepData = {
          sessionId,
          step,
          savedAt: new Date().toISOString(),
          dataSize,
          isSummary: false,
          ...cleanedData
        };

        await this.firestore
          .collection('analysis-steps')
          .doc(`${sessionId}_${step}`)
          .set(stepData);

        await this.saveToCloudStorage(`analysis-steps/${sessionId}_${step}.json`, stepData);
        
        console.log(`✅ 전체 데이터 저장 완료: ${sessionId} - ${step}`);
      }
    } catch (error) {
      console.error(`❌ Error saving analysis step ${step} for ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * 🧹 undefined 값 정리 함수 (강화된 버전)
   */
  private cleanUndefinedValues(obj: any): any {
    if (obj === null || obj === undefined) {
      return null;
    }
    
    if (Array.isArray(obj)) {
      return obj
        .map(item => this.cleanUndefinedValues(item))
        .filter(item => item !== null && item !== undefined);
    }
    
    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const cleanedValue = this.cleanUndefinedValues(value);
        if (cleanedValue !== null && cleanedValue !== undefined) {
          // 빈 객체나 빈 배열도 제거
          if (typeof cleanedValue === 'object' && !Array.isArray(cleanedValue)) {
            if (Object.keys(cleanedValue).length > 0) {
              cleaned[key] = cleanedValue;
            }
          } else if (Array.isArray(cleanedValue)) {
            if (cleanedValue.length > 0) {
              cleaned[key] = cleanedValue;
            }
          } else {
            cleaned[key] = cleanedValue;
          }
        }
      }
      return cleaned;
    }
    
    return obj;
  }

  /**
   * 🔧 Firestore 호환 데이터 변환 (강화된 undefined 처리)
   */
  private makeFirestoreCompatible(data: any): any {
    const cleaned = this.cleanUndefinedValues(data);
    
    // 추가 보호: 모든 객체 키를 재귀적으로 검사
    const recursiveClean = (obj: any): any => {
      if (obj === null || obj === undefined) {
        return null;
      }
      
      if (Array.isArray(obj)) {
        return obj
          .map(item => recursiveClean(item))
          .filter(item => item !== null && item !== undefined);
      }
      
      if (typeof obj === 'object') {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
          if (value !== null && value !== undefined) {
            // 특별히 personDetection과 boundingBox 처리
            if (key === 'personDetection' && Array.isArray(value)) {
              result[key] = value.map(detection => this.cleanPersonDetection(detection));
            } else if (key === 'boundingBox' && typeof value === 'object') {
              result[key] = this.cleanBoundingBox(value);
            } else {
              result[key] = recursiveClean(value);
            }
          }
        }
        return result;
      }
      
      return obj;
    };
    
    return recursiveClean(cleaned);
  }

  /**
   * 🧹 PersonDetection 데이터 정리
   */
  private cleanPersonDetection(detection: any): any {
    if (!detection || typeof detection !== 'object') {
      return null;
    }

    const cleaned: any = {};

    // tracks 배열 정리
    if (Array.isArray(detection.tracks)) {
      const cleanedTracks = detection.tracks.map((track: any) => {
        if (!track || typeof track !== 'object') {return null;}
        
        const cleanedTrack: any = {};
        
        // segment 정리
        if (track.segment && typeof track.segment === 'object') {
          const segment = track.segment;
          if (segment.startTimeOffset !== undefined || segment.endTimeOffset !== undefined) {
            cleanedTrack.segment = {
              startTimeOffset: segment.startTimeOffset ?? 0,
              endTimeOffset: segment.endTimeOffset ?? 0
            };
          }
        }

        // timestampedObjects 정리
        if (Array.isArray(track.timestampedObjects)) {
          const cleanedObjects = track.timestampedObjects.map((obj: any) => {
            if (!obj || typeof obj !== 'object') {return null;}
            
            const cleanedObj: { [key: string]: any } = {};
            
            // timeOffset 정리
            if (obj.timeOffset !== undefined) {
              cleanedObj.timeOffset = obj.timeOffset;
            }
            
            // confidence 정리
            if (obj.confidence !== undefined) {
              cleanedObj.confidence = obj.confidence;
            }
            
            // boundingBox 정리
            if (obj.normalizedBoundingBox) {
              cleanedObj.normalizedBoundingBox = this.cleanBoundingBox(obj.normalizedBoundingBox);
            }
            
            // attributes 정리
            if (Array.isArray(obj.attributes)) {
              cleanedObj.attributes = obj.attributes.filter((attr: any) => attr !== null && attr !== undefined);
            }
            
            return Object.keys(cleanedObj).length > 0 ? cleanedObj : null;
          }).filter((obj: any) => obj !== null);
          
          if (cleanedObjects.length > 0) {
            cleanedTrack.timestampedObjects = cleanedObjects;
          }
        }

        return Object.keys(cleanedTrack).length > 0 ? cleanedTrack : null;
      }).filter((track: any) => track !== null);
      
      if (cleanedTracks.length > 0) {
        cleaned.tracks = cleanedTracks;
      }
    }

    return Object.keys(cleaned).length > 0 ? cleaned : null;
  }

  /**
   * 🧹 BoundingBox 데이터 정리
   */
  private cleanBoundingBox(bbox: any): { left: number; top: number; right: number; bottom: number } {
    if (!bbox || typeof bbox !== 'object') {
      return {
        left: 0,
        top: 0,
        right: 1,
        bottom: 1
      };
    }

    return {
      left: bbox.left ?? 0,
      top: bbox.top ?? 0,
      right: bbox.right ?? 1,
      bottom: bbox.bottom ?? 1
    };
  }

  /**
   * 📊 요약 데이터 생성
   */
  private createSummaryData(analysisData: any, sessionId: string, step: string): any {
    if (step === 'video-processing' && analysisData.analysisResult) {
      // 분석 결과에서 핵심 정보만 추출
      const result = analysisData.analysisResult;
      
      return {
        analysisResult: {
          // 중요한 메타데이터
          metadata: result.metadata,
          
          // 통계적 요약 정보
          summary: {
            objectTrackingCount: result.analysisResults?.objectTracking?.length || 0,
            speechSegmentCount: result.analysisResults?.speechTranscription?.length || 0,
            faceDetectionCount: result.analysisResults?.faceDetection?.length || 0,
            personDetectionCount: result.analysisResults?.personDetection?.length || 0,
            shotChangeCount: result.analysisResults?.shotChanges?.length || 0
          },
          
          // 실제 분석에 필요한 핵심 데이터 (압축)
          analysisResults: {
            speechTranscription: result.analysisResults?.speechTranscription || [],
            // 다른 데이터는 Cloud Storage에서 필요시 로드
            objectTracking: this.compressObjectTracking(result.analysisResults?.objectTracking || []),
            faceDetection: this.compressFaceDetection(result.analysisResults?.faceDetection || []),
            personDetection: this.compressPersonDetection(result.analysisResults?.personDetection || [])
          }
        },
        processingTime: analysisData.processingTime,
        completedAt: analysisData.completedAt
      };
    }
    
    return analysisData;
  }

  /**
   * 객체 추적 데이터 압축
   */
  private compressObjectTracking(data: any[]): any[] {
    return data.slice(0, 10).map(item => ({
      entity: item.entity,
      confidence: item.confidence,
      frameCount: item.frames?.length || 0,
      segment: item.segment
    }));
  }

  /**
   * 얼굴 감지 데이터 압축
   */
  private compressFaceDetection(data: any[]): any[] {
    return data.slice(0, 20).map(item => ({
      boundingBox: item.boundingBox,
      confidence: item.confidence,
      timeOffset: item.timeOffset
    }));
  }

  /**
   * 인물 감지 데이터 압축
   */
  private compressPersonDetection(data: any[]): any[] {
    return data.slice(0, 20).map(item => ({
      boundingBox: item.boundingBox,
      confidence: item.confidence,
      timeOffset: item.timeOffset
    }));
  }

  /**
   * 📊 분석 단계별 결과 조회
   */
  async getAnalysisStep(sessionId: string, step: string): Promise<any | null> {
    try {
      const doc = await this.firestore
        .collection('analysis-steps')
        .doc(`${sessionId}_${step}`)
        .get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data();
      if (!data) {
        return null;
      }
      
      return data;
    } catch (error) {
      console.error(`❌ Error getting analysis step ${step} for ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * 🔍 세션 검색
   */
  async searchSessions(query: string): Promise<PlayAnalysisSession[]> {
    try {
      // Firestore는 full-text search가 제한적이므로 클라이언트 측에서 필터링
      const allSessions = await this.getAllSessions();
      
      return allSessions.filter(session => 
        session.metadata.originalName.toLowerCase().includes(query.toLowerCase()) ||
        session.sessionId.toLowerCase().includes(query.toLowerCase()) ||
        session.userInfo?.childName?.toLowerCase().includes(query.toLowerCase()) ||
        session.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );
    } catch (error) {
      console.error('Error searching sessions:', error);
      throw new Error(`세션 검색 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * 🎯 핵심 분석 데이터 조회
   */
  async getPlayCore(sessionId: string): Promise<PlayAnalysisCore | null> {
    try {
      const doc = await this.firestore
        .collection(this.CORES_COLLECTION)
        .doc(sessionId)
        .get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data();
      if (!data) {
        return null;
      }
      
      // sessionId와 savedAt 제거하고 PlayAnalysisCore 반환
      const { sessionId: _, savedAt: __, ...playCore } = data;
      return playCore as PlayAnalysisCore;
    } catch (error) {
      console.error(`❌ Error getting play core for ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * 🎤 음성 분석 데이터 조회
   */
  async getVoiceAnalysis(sessionId: string): Promise<any | null> {
    try {
      const doc = await this.firestore
        .collection(this.VOICE_ANALYSIS_COLLECTION)
        .doc(sessionId)
        .get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data();
      if (!data) {
        return null;
      }
      
      // sessionId와 savedAt 제거하고 음성 분석 데이터 반환
      const { sessionId: _, savedAt: __, ...voiceAnalysis } = data;
      return voiceAnalysis;
    } catch (error) {
      console.error(`❌ Error getting voice analysis for ${sessionId}:`, error);
      return null;
    }
  }

  /**
   * 🗑️ 세션 삭제
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      const batch = this.firestore.batch();

      // 모든 관련 문서 삭제
      batch.delete(this.firestore.collection(this.SESSIONS_COLLECTION).doc(sessionId));
      batch.delete(this.firestore.collection(this.CORES_COLLECTION).doc(sessionId));
      batch.delete(this.firestore.collection(this.EVALUATIONS_COLLECTION).doc(sessionId));
      batch.delete(this.firestore.collection(this.VOICE_ANALYSIS_COLLECTION).doc(sessionId));

      await batch.commit();

      // Cloud Storage에서도 삭제
      await this.deleteFromCloudStorage(`sessions/${sessionId}.json`);
      await this.deleteFromCloudStorage(`cores/${sessionId}_core.json`);
      await this.deleteFromCloudStorage(`evaluations/${sessionId}_evaluation.json`);
      await this.deleteFromCloudStorage(`voice-analysis/${sessionId}_voice.json`);

      console.log(`✅ Session deleted from Firestore: ${sessionId}`);
    } catch (error) {
      console.error(`❌ Error deleting session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * 📊 저장소 통계 조회
   */
  async getStorageStats(): Promise<{
    totalSessions: number;
    totalSize: number;
    latestSession: string;
    statusCounts: Record<string, number>;
  }> {
    try {
      const sessions = await this.getAllSessions();
      
      const stats = {
        totalSessions: sessions.length,
        totalSize: sessions.reduce((sum, session) => sum + session.metadata.fileSize, 0),
        latestSession: sessions.length > 0 ? sessions[0].metadata.lastUpdated : '',
        statusCounts: {} as Record<string, number>
      };

      // 상태별 카운트
      sessions.forEach(session => {
        const status = session.metadata.status;
        stats.statusCounts[status] = (stats.statusCounts[status] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('❌ Error getting storage stats:', error);
      return {
        totalSessions: 0,
        totalSize: 0,
        latestSession: '',
        statusCounts: {}
      };
    }
  }

  // Private helper methods

  /**
   * 세션 ID 생성
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 🎯 원본 분석 데이터를 Cloud Storage에 저장 (공개 메서드)
   */
  async saveToCloudStorage(fileName: string, data: any): Promise<void> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(`data/${fileName}`);
      
      console.log(`💾 Saving data to Cloud Storage: ${fileName}`);
      
      await file.save(JSON.stringify(data, null, 2), {
        metadata: {
          contentType: 'application/json',
          metadata: {
            savedAt: new Date().toISOString(),
            dataType: 'analysis-data'
          }
        },
      });
      
      console.log(`✅ Data saved successfully: gs://${this.bucketName}/data/${fileName}`);
    } catch (error) {
      console.error(`❌ Error saving to Cloud Storage: ${fileName}`, error);
      throw error; // 원본 데이터 저장은 중요하므로 에러를 던짐
    }
  }

  /**
   * 🔍 Cloud Storage에서 JSON 파일 읽기 (공개 메서드)
   */
  async loadFromCloudStorage(fileName: string): Promise<any | null> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(`data/${fileName}`);
      
      const [exists] = await file.exists();
      if (!exists) {
        return null;
      }
      
      const [content] = await file.download();
      return JSON.parse(content.toString());
    } catch (error) {
      console.error(`❌ Error loading from Cloud Storage: ${fileName}`, error);
      return null;
    }
  }

  /**
   * Cloud Storage에서 JSON 파일 삭제
   */
  private async deleteFromCloudStorage(fileName: string): Promise<void> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(`data/${fileName}`);
      
      await file.delete();
    } catch (error) {
      console.error(`❌ Error deleting from Cloud Storage: ${fileName}`, error);
      // Cloud Storage 삭제 실패는 치명적 오류로 처리하지 않음
    }
  }

  /**
   * 세션 인덱스 업데이트
   */
  private async updateSessionIndex(session: PlayAnalysisSession): Promise<void> {
    try {
      const indexRef = this.firestore
        .collection('metadata')
        .doc(this.SESSION_INDEX_DOC);

      await this.firestore.runTransaction(async (transaction) => {
        const indexDoc = await transaction.get(indexRef);
        
        let indexData = {
          sessions: [] as PlayAnalysisSession[],
          lastUpdated: new Date().toISOString(),
          totalSessions: 0
        };

        if (indexDoc.exists) {
          indexData = indexDoc.data() as any;
        }

        // 기존 세션 제거 및 새 세션 추가
        indexData.sessions = indexData.sessions.filter(s => s.sessionId !== session.sessionId);
        indexData.sessions.push(session);
        indexData.lastUpdated = new Date().toISOString();
        indexData.totalSessions = indexData.sessions.length;

        transaction.set(indexRef, indexData);
      });
    } catch (error) {
      console.error('❌ Error updating session index:', error);
    }
  }

  /**
   * 📝 세션 상태 업데이트
   */
  async updateSessionStatus(
    sessionId: string, 
    status: 'uploaded' | 'analyzed' | 'core_extracted' | 'voice_analyzed' | 'integrated_analysis_completed' | 'evaluation_completed' | 'report_generated'
  ): Promise<void> {
    try {
      const sessionRef = this.firestore.collection(this.SESSIONS_COLLECTION).doc(sessionId);
      
      await sessionRef.update({
        'metadata.status': status,
        'metadata.lastUpdated': new Date().toISOString()
      });
      
      console.log(`✅ Session ${sessionId} status updated to: ${status}`);
    } catch (error) {
      console.error(`❌ Error updating session ${sessionId} status:`, error);
      throw error;
    }
  }

  /**
   * 📤 파일 업로드
   */
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string = 'video/mp4'
  ): Promise<{ gsUri: string; fileName: string; fileSize: number }> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const uniqueFileName = `${Date.now()}-${fileName}`;
      const file = bucket.file(uniqueFileName);
      
      console.log(`📤 Uploading file: ${uniqueFileName}`);
      
      // 파일 업로드
      await file.save(fileBuffer, {
        metadata: {
          contentType,
          metadata: {
            originalName: fileName,
            uploadedAt: new Date().toISOString()
          }
        }
      });
      
      const gsUri = `gs://${this.bucketName}/${uniqueFileName}`;
      
      console.log(`✅ File uploaded successfully: ${gsUri}`);
      
      return {
        gsUri,
        fileName: uniqueFileName,
        fileSize: fileBuffer.length
      };
    } catch (error) {
      console.error('❌ Error uploading file:', error);
      throw error;
    }
  }

  /**
   * 🗑️ 파일 삭제
   */
  async deleteFile(gsUri: string): Promise<void> {
    try {
      const fileName = gsUri.replace(`gs://${this.bucketName}/`, '');
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(fileName);
      
      await file.delete();
      console.log(`✅ File deleted: ${gsUri}`);
    } catch (error) {
      console.error(`❌ Error deleting file ${gsUri}:`, error);
      throw error;
    }
  }

  /**
   * 📊 세션 통계 조회
   */
  async getSessionStats(): Promise<{
    totalSessions: number;
    completedSessions: number;
    averageProcessingTime: number;
    statusDistribution: Record<string, number>;
  }> {
    try {
      const sessions = await this.getAllSessions();
      
      const stats = {
        totalSessions: sessions.length,
        completedSessions: sessions.filter(s => s.metadata.status === 'report_generated').length,
        averageProcessingTime: 0,
        statusDistribution: {} as Record<string, number>
      };
      
      // 상태별 분포 계산
      sessions.forEach(session => {
        const status = session.metadata.status;
        stats.statusDistribution[status] = (stats.statusDistribution[status] || 0) + 1;
      });
      
      // 평균 처리 시간 계산 (완료된 세션 기준)
      const completedSessions = sessions.filter(s => s.metadata.status === 'report_generated');
      if (completedSessions.length > 0) {
        const totalTime = completedSessions.reduce((sum, session) => {
          const uploadTime = new Date(session.metadata.uploadedAt).getTime();
          const completionTime = new Date(session.metadata.lastUpdated).getTime();
          return sum + (completionTime - uploadTime);
        }, 0);
        
        stats.averageProcessingTime = Math.round(totalTime / completedSessions.length / 1000); // 초 단위
      }
      
      return stats;
    } catch (error) {
      console.error('❌ Error getting session stats:', error);
      throw error;
    }
  }

  /**
   * 🔄 세션 데이터 동기화
   */
  async syncSessionData(sessionId: string): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }
      
      // Cloud Storage에 백업
      const backupData = {
        session,
        syncedAt: new Date().toISOString()
      };
      
      const fileName = `backups/sessions/${sessionId}.json`;
      const file = this.storage.bucket(this.bucketName).file(fileName);
      
      await file.save(JSON.stringify(backupData, null, 2), {
        metadata: {
          contentType: 'application/json'
        }
      });
      
      console.log(`✅ Session ${sessionId} synced to Cloud Storage`);
    } catch (error) {
      console.error(`❌ Error syncing session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * 📊 세션 업데이트
   */
  async updateSession(sessionId: string, updateData: Partial<PlayAnalysisSession>): Promise<PlayAnalysisSession> {
    try {
      const existingSession = await this.getSession(sessionId);
      if (!existingSession) {
        throw new Error(`Session ${sessionId} not found`);
      }

      const updatedSession = {
        ...existingSession,
        ...updateData,
        metadata: {
          ...existingSession.metadata,
          ...updateData.metadata,
          lastUpdated: new Date().toISOString()
        }
      };

      await this.saveSession(updatedSession);
      return updatedSession;
    } catch (error) {
      console.error(`❌ Error updating session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * 📊 모든 세션 조회 (필터링 옵션)
   */
  async getAllSessions(options?: {
    limit?: number;
    offset?: number;
    status?: string;
    search?: string;
  }): Promise<PlayAnalysisSession[]> {
    try {
      let query: any = this.firestore.collection(this.SESSIONS_COLLECTION);

      // 상태 필터링
      if (options?.status) {
        query = query.where('metadata.status', '==', options.status);
      }

      // 정렬 (최신순)
      query = query.orderBy('metadata.uploadedAt', 'desc');

      // 페이징
      if (options?.offset) {
        query = query.offset(options.offset);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const snapshot = await query.get();
      const sessions: PlayAnalysisSession[] = [];

      snapshot.forEach((doc: any) => {
        const data = doc.data() as PlayAnalysisSession;
        
        // 검색 필터링 (클라이언트 사이드)
        if (options?.search) {
          const searchLower = options.search.toLowerCase();
          const matchesSearch = 
            data.metadata.originalName.toLowerCase().includes(searchLower) ||
            data.sessionId.toLowerCase().includes(searchLower) ||
            (data.tags?.some((tag: string) => tag.toLowerCase().includes(searchLower)));
          
          if (matchesSearch) {
            sessions.push(data);
          }
        } else {
          sessions.push(data);
        }
      });

      return sessions;
    } catch (error) {
      console.error('❌ Error getting all sessions:', error);
      return [];
    }
  }

  /**
   * 📊 세션 개수 조회
   */
  async getSessionCount(status?: string): Promise<number> {
    try {
      let query: any = this.firestore.collection(this.SESSIONS_COLLECTION);

      if (status) {
        query = query.where('metadata.status', '==', status);
      }

      const snapshot = await query.get();
      return snapshot.size;
    } catch (error) {
      console.error('❌ Error getting session count:', error);
      return 0;
    }
  }

  /**
   * 🔄 통합 분석 데이터 저장
   */
  async saveIntegratedAnalysisData(sessionId: string, analysisData: any): Promise<void> {
    try {
      const integratedData = {
        sessionId,
        savedAt: new Date().toISOString(),
        ...analysisData
      };

      // Firestore에 저장
      await this.firestore
        .collection('integrated-analysis')
        .doc(sessionId)
        .set(integratedData);

      // Cloud Storage에 JSON 백업
      await this.saveToCloudStorage(`integrated-analysis/${sessionId}_integrated.json`, integratedData);

      // 세션 정보 업데이트
      const session = await this.getSession(sessionId);
      if (session) {
        session.paths.integratedAnalysisPath = `gs://${this.bucketName}/integrated-analysis/${sessionId}_integrated.json`;
        session.metadata.status = 'integrated_analysis_completed';
        session.analysis.overallScore = analysisData.comprehensiveScores?.overallDevelopment || 0;
        session.analysis.interactionQuality = analysisData.comprehensiveScores?.communicationQuality || 0;
        session.analysis.completedAt = new Date().toISOString();
        session.integratedAnalysis = analysisData;

        await this.saveSession(session);
      }

      console.log(`✅ Integrated analysis saved in Firestore: ${sessionId}`);
    } catch (error) {
      console.error(`❌ Error saving integrated analysis for ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * 🔄 통합 분석 데이터 조회
   */
  async getIntegratedAnalysisData(sessionId: string): Promise<any | null> {
    try {
      const doc = await this.firestore
        .collection('integrated-analysis')
        .doc(sessionId)
        .get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data();
      return data?.integratedAnalysis || data;
    } catch (error) {
      console.error(`❌ Error getting integrated analysis for ${sessionId}:`, error);
      return null;
    }
  }
} 