// 비디오 분석 관련 타입 정의

// 기본 타입들
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

export interface Point3D {
  x: number;
  y: number;
  z?: number;
}

export interface NormalizedBoundingBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

// 비디오 메타데이터
export interface VideoMetadata {
  duration: number;
  fps: number;
  resolution: {
    width: number;
    height: number;
  };
  fileSize: number;
  format: string;
}

// 객체 추적 관련 타입
export interface ObjectTrackingFrame {
  normalizedBoundingBox: NormalizedBoundingBox;
  timeOffset: number;
  confidence?: number;
}

export interface ObjectTrackingEntity {
  entityId: string;
  description: string;
  languageCode: string;
}

export interface ObjectTrackingData {
  entity: ObjectTrackingEntity;
  confidence: number;
  frames: ObjectTrackingFrame[];
  segment: TimeSegment;
}

// 얼굴 감지 관련 타입
export interface FaceLandmark {
  type: string;
  position: Point3D;
}

export interface FaceAttribute {
  name: string;
  value: string;
  confidence: number;
}

export interface FaceTimestampedObject {
  normalizedBoundingBox: NormalizedBoundingBox;
  timeOffset: number;
  attributes: FaceAttribute[];
  landmarks: FaceLandmark[];
}

export interface FaceTrack {
  segment: TimeSegment;
  timestampedObjects: FaceTimestampedObject[];
}

export interface FaceDetectionData {
  tracks: FaceTrack[];
}

// 인물 감지 관련 타입
export interface PersonLandmark {
  type: string;
  position: Point3D;
}

export interface PersonAttribute {
  name: string;
  value: string;
  confidence: number;
}

export interface PersonTimestampedObject {
  normalizedBoundingBox: NormalizedBoundingBox;
  timeOffset: number;
  attributes: PersonAttribute[];
  landmarks: PersonLandmark[];
}

export interface PersonTrack {
  segment: TimeSegment;
  timestampedObjects: PersonTimestampedObject[];
}

export interface PersonDetectionData {
  tracks: PersonTrack[];
}

// 음성 전사 관련 타입
export interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
  confidence: number;
  speakerTag?: number;
}

export interface SpeechAlternative {
  transcript: string;
  confidence: number;
  words: WordTiming[];
}

export interface SpeechTranscriptionData {
  alternatives: SpeechAlternative[];
  languageCode: string;
}

// 샷 변경 관련 타입
export interface ShotChangeData {
  startTimeOffset: number;
  endTimeOffset: number;
}

// 명시적 콘텐츠 감지 타입
export interface ExplicitContentFrame {
  timeOffset: number;
  pornographyLikelihood: 'VERY_UNLIKELY' | 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'VERY_LIKELY';
  adultLikelihood: 'VERY_UNLIKELY' | 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'VERY_LIKELY';
  spoofLikelihood: 'VERY_UNLIKELY' | 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'VERY_LIKELY';
  medicalLikelihood: 'VERY_UNLIKELY' | 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'VERY_LIKELY';
  violenceLikelihood: 'VERY_UNLIKELY' | 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'VERY_LIKELY';
  racyLikelihood: 'VERY_UNLIKELY' | 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'VERY_LIKELY';
}

export interface ExplicitContentData {
  frames: ExplicitContentFrame[];
}

// 통합 비디오 분석 결과 타입
export interface VideoIntelligenceResults {
  objectTracking: ObjectTrackingData[];
  faceDetection: FaceDetectionData[];
  personDetection: PersonDetectionData[];
  speechTranscription: SpeechTranscriptionData[];
  shotChanges: ShotChangeData[];
  explicitContent: ExplicitContentData[];
}

// 분석 옵션 타입
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
  languageCode?: string;
  speakerCount?: number;
  timeout?: number;
}

// 분석 메타데이터 타입
export interface AnalysisMetadata {
  sessionId: string;
  fileName: string;
  fileSize: number;
  processingTime: number;
  analysisMode: 'development' | 'production';
  timestamp: string;
  version: string;
  environment: string;
}

// 품질 메트릭 타입
export interface QualityMetrics {
  overallScore: number;
  videoQuality: number;
  audioQuality: number;
  analysisCompleteness: number;
  confidenceScore: number;
}

// 완전한 분석 결과 타입
export interface CompleteAnalysisResult {
  analysisResults: VideoIntelligenceResults;
  metadata: AnalysisMetadata;
  qualityMetrics: QualityMetrics;
  stage1Complete: boolean;
  stage2Complete: boolean;
  stage3Complete: boolean;
  stage4Complete: boolean;
} 