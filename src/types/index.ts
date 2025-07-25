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
  data: Array<{
    label?: string;
    value: number;
    time?: number;
    category?: string;
    x?: number | string;
    y?: number | string;
    [key: string]: string | number | undefined;
  }>;
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

// Play Analysis Session Types
export interface PlayAnalysisSession {
  sessionId: string;
  userInfo?: UserInfo;
  metadata: {
    fileName: string;
    originalName: string;
    fileSize: number;
    uploadedAt: string;
    analyzedAt: string;
    lastUpdated: string;
    status: 'uploaded' | 'processing' | 'completed' | 'failed' | 'error' | 'core_extracted' | 'voice_analyzed' | 'evaluation_completed' | 'integrated_analysis_completed' | 'report_generated' | 'comprehensive_analysis_started' | 'comprehensive_analysis_completed' | 'video_intelligence_operation_started' | 'video_intelligence_processing' | 'data_processing';
  };
  paths: {
    videoUrl?: string;
    thumbnailUrl?: string;
    analysisDataUrl?: string;
    extractedDataUrl?: string;    // 추출된 분석 데이터 경로
    unifiedAnalysisUrl?: string;  // 통합 분석 결과 경로
    corePath?: string;
    voiceAnalysisPath?: string;
    evaluationPath?: string;
    integratedAnalysisPath?: string;
    rawDataPath?: string;
  };
  analysis: {
    participantCount: number;
    videoDuration: number;
    safetyScore: number;
    overallScore?: number;
    keyInsights?: string[];
    interactionQuality?: number;
    completedAt?: string;
    processingSteps?: string[];
    // 🔧 Long Running Operation 지원
    videoIntelligenceOperation?: {
      operationId: string;
      operationName: string;
      status: 'running' | 'completed' | 'failed';
      startTime: string;
      progress?: number;
      gsUri: string;
      completedAt?: string;
      error?: string;
    };
  };
  tags: string[];
  
  // Optional extended analysis data
  voiceAnalysis?: unknown;
  evaluation?: PlayEvaluationResult;
  integratedAnalysis?: IntegratedAnalysisResult;
}

// Play Evaluation Result
export interface PlayEvaluationResult {
  evaluationId: string;
  sessionId: string;
  evaluatedAt: string;
  scores: {
    interactionQuality: number;
    emotionalConnection: number;
    developmentalSupport: number;
    playEnvironment: number;
    overall: number;
  };
  insights: {
    strengths: string[];
    improvements: string[];
    recommendations: string[];
  };
  detailedAnalysis: {
    participantAnalysis: ParticipantAnalysis[];
    temporalAnalysis: TemporalAnalysis;
    interactionPatterns: GCPInteractionPattern[];
  };
}

// Analysis Report
export interface AnalysisReport {
  reportId: string;
  sessionId: string;
  generatedAt: string;
  reportType: 'comprehensive' | 'quick' | 'detailed';
  sections: {
    executiveSummary: string;
    keyFindings: string[];
    recommendations: string[];
    developmentGoals: string[];
  };
  scores: {
    overall: number;
    physical: number;
    cognitive: number;
    social: number;
    emotional: number;
  };
  metadata: {
    generationTime: number;
    analysisVersion: string;
    reportVersion: string;
  };
}

// IntegratedAnalysisResult interface (moved from lib to avoid circular dependency)
export interface IntegratedAnalysisResult {
  sessionInfo: {
    sessionId: string;
    duration: number;
    participants: string[];
    analysisTimestamp: string;
  };
  physicalInteraction: PhysicalInteractionResult;
  languageInteraction: LanguageInteractionResult;
  emotionalInteraction: EmotionalInteractionResult;
  playPatterns: PlayPatternResult;
  comprehensiveScores: {
    physicalEngagement: number;
    communicationQuality: number;
    emotionalConnection: number;
    playCreativity: number;
    overallDevelopment: number;
  };
  developmentInsights: {
    strengths: string[];
    areasForImprovement: string[];
    recommendations: string[];
    developmentStage: string;
  };
  detailedReport: {
    executiveSummary: string;
    keyFindings: string[];
    behaviorPatterns: string[];
    interactionQuality: 'excellent' | 'good' | 'fair' | 'needs_improvement';
    nextSteps: string[];
  };
}

// Define supporting types locally to avoid circular dependencies
export interface ParticipantAnalysis {
  participantId: string;
  role: 'parent' | 'child' | 'unknown';
  engagementLevel: number;
  emotionalState: number;
  activityLevel: number;
  behaviors: {
    positive: string[];
    concerning: string[];
    neutral: string[];
  };
}

export interface TemporalAnalysis {
  segments: {
    startTime: number;
    endTime: number;
    activityType: string;
    intensity: number;
    participants: string[];
  }[];
  totalDuration: number;
  averageSegmentLength: number;
  peakActivityPeriods: {
    startTime: number;
    endTime: number;
    intensity: number;
  }[];
}

export interface GCPInteractionPattern {
  patternType: 'cooperative' | 'competitive' | 'parallel' | 'guided' | 'independent';
  frequency: number;
  duration: number;
  quality: number;
  examples: string[];
} 

export interface FileUploadMetadata {
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

// Language Analysis Types (missing types)
export interface SpeechAnalysisResult {
  transcript: TranscriptEntry[];
  speakerCount: number;
  totalDuration: number;
  confidence: number;
}

export interface LanguageInteractionResult {
  speakerStats: Record<string, SpeakerStats>;
  interactionMetrics: LanguageMetrics;
  detailedMetrics: DetailedLanguageMetrics;
  interactionPatterns: ConversationPattern;
  qualityScore: number;
}

export interface LanguageMetrics {
  turnTakingBalance: number;
  responseAppropriateness: number;
  communicationEffectiveness: number;
  vocabularyDiversity: number;
}

export interface DetailedLanguageMetrics {
  averageUtteranceLength: number;
  turnFrequency: number;
  responsiveness: number;
  languageComplexity: LanguageComplexity;
  vocabularyUsage: VocabularyUsage;
}

export interface SpeechPattern {
  pattern: string;
  frequency: number;
  confidence: number;
}

export interface VocabularyUsage {
  uniqueWords: number;
  totalWords: number;
  averageWordsPerUtterance: number;
  complexityLevel: 'basic' | 'intermediate' | 'advanced';
}

export interface ConversationFlow {
  transitions: number;
  averageResponseTime: number;
  interruptionRate: number;
}

export interface LanguageComplexity {
  syntacticComplexity: number;
  semanticRichness: number;
  conversationalMaturity: number;
}

export interface ConversationPattern {
  turnTaking: {
    turnCount: number;
    averageTurnDuration: number;
    turnBalance: number;
  };
  turnCount: number;
}

export interface TranscriptEntry {
  text: string;
  speaker: string;
  time: number;
  startTime: number;
  endTime: number;
  confidence: number;
}

export interface SpeakerStats {
  utteranceCount: number;
  avgWordCount: number;
  avgInterval: number;
  totalWords: number;
  dominanceScore: number;
}

export interface UtteranceClassification {
  questions: number;
  statements: number;
  commands: number;
  // responses: number; // This was causing an error
} 