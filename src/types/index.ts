// User Information Types
export interface UserInfo {
  caregiverName: string;
  phoneNumber: string;
  caregiverType: '엄마' | '아빠' | '조부모' | '기타';
  childAge: number;
  childName: string;
  childGender: '남자' | '여자';
  additionalNotes?: string;
  submittedAt: string;
}

export interface ParticipantInfo {
  user: UserInfo;
  sessionId: string;
  createdAt: string;
}

// Video Analysis Types
export interface VideoAnalysisRequest {
  videoUrl: string;
  fileName: string;
  fileSize: number;
  duration?: number;
}

export interface VideoAnalysisResponse {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  results?: VideoIntelligenceResults;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

// Google Cloud Video Intelligence API Types
export interface VideoIntelligenceResults {
  objectTracking: ObjectTrackingAnnotation[];
  speechTranscription: SpeechTranscription[];
  faceDetection: FaceDetectionAnnotation[];
  personDetection: PersonDetectionAnnotation[];
  shotChanges: ShotChangeAnnotation[];
  explicitContent: ExplicitContentAnnotation[];
}

export interface ObjectTrackingAnnotation {
  entity: {
    entityId: string;
    description: string;
    languageCode: string;
  };
  confidence: number;
  frames: ObjectTrackingFrame[];
  segment: VideoSegment;
}

export interface ObjectTrackingFrame {
  normalizedBoundingBox: NormalizedBoundingBox;
  timeOffset: string;
}

export interface SpeechTranscription {
  alternatives: SpeechRecognitionAlternative[];
  languageCode: string;
}

export interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
  words: WordInfo[];
}

export interface WordInfo {
  startTime: string;
  endTime: string;
  word: string;
  confidence: number;
  speakerTag?: number;
}

export interface FaceDetectionAnnotation {
  tracks: FaceTrack[];
}

export interface FaceTrack {
  segment: VideoSegment;
  timestampedObjects: TimestampedObject[];
}

export interface TimestampedObject {
  normalizedBoundingBox: NormalizedBoundingBox;
  timeOffset: string;
  attributes: FaceAttribute[];
}

export interface FaceAttribute {
  name: string;
  confidence: number;
  value: string;
}

export interface PersonDetectionAnnotation {
  tracks: PersonTrack[];
}

export interface PersonTrack {
  segment: VideoSegment;
  timestampedObjects: TimestampedObject[];
}

export interface ShotChangeAnnotation {
  startTimeOffset: string;
  endTimeOffset: string;
}

export interface ExplicitContentAnnotation {
  frames: ExplicitContentFrame[];
}

export interface ExplicitContentFrame {
  timeOffset: string;
  pornographyLikelihood: string;
}

// Common Types
export interface VideoSegment {
  startTimeOffset: string;
  endTimeOffset: string;
}

export interface NormalizedBoundingBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

// AI Analysis Types
export interface AIAnalysisRequest {
  videoIntelligenceResults: VideoIntelligenceResults;
  childAge?: number;
  parentGender?: 'male' | 'female' | 'other';
  playType?: string;
}

export interface AIAnalysisResponse {
  summary: string;
  insights: PlayInteractionInsights;
  recommendations: string[];
  developmentIndicators: DevelopmentIndicators;
  visualizations: ChartData[];
}

export interface PlayInteractionInsights {
  interactionQuality: number; // 0-100
  parentEngagement: number; // 0-100
  childEngagement: number; // 0-100
  communicationPatterns: CommunicationPattern[];
  emotionalStates: EmotionalState[];
  playPatterns: PlayPattern[];
}

export interface CommunicationPattern {
  type: 'verbal' | 'nonverbal' | 'gesture';
  frequency: number;
  duration: number;
  initiator: 'parent' | 'child';
  timeSegments: VideoSegment[];
}

export interface EmotionalState {
  emotion: 'joy' | 'excitement' | 'concentration' | 'frustration' | 'boredom';
  intensity: number;
  duration: number;
  person: 'parent' | 'child';
  timeSegments: VideoSegment[];
}

export interface PlayPattern {
  type: 'collaborative' | 'parallel' | 'imitative' | 'creative' | 'structured';
  duration: number;
  objects: string[];
  timeSegments: VideoSegment[];
}

export interface DevelopmentIndicators {
  language: DevelopmentMetric;
  social: DevelopmentMetric;
  cognitive: DevelopmentMetric;
  motor: DevelopmentMetric;
  emotional: DevelopmentMetric;
}

export interface DevelopmentMetric {
  score: number; // 0-100
  observations: string[];
  recommendations: string[];
}

// Chart and Visualization Types
export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'timeline' | 'heatmap' | 'radar';
  title: string;
  data: any[];
  xAxis?: string;
  yAxis?: string;
  categories?: string[];
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// File Upload Types
export interface FileUploadResponse {
  success: boolean;
  fileUrl?: string;
  gsUri?: string;
  fileName?: string;
  originalName?: string;
  fileSize?: number;
  contentType?: string;
  bucketName?: string;
  filePath?: string;
  error?: string;
}

// Report Types
export interface PlayReport {
  id: string;
  videoUrl: string;
  fileName: string;
  analysisResults: VideoIntelligenceResults;
  aiAnalysis: AIAnalysisResponse;
  createdAt: Date;
  childAge?: number;
  parentGender?: 'male' | 'female' | 'other';
  playType?: string;
} 