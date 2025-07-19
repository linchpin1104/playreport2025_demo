// 놀이 분석 비즈니스 로직 관련 타입 정의

import { TimeSegment, BoundingBox, Point3D } from './video-analysis';

// 참여자 관련 타입
export interface Participant {
  id: string;
  role: 'parent' | 'child' | 'unknown';
  age?: number;
  gender?: 'male' | 'female' | 'unknown';
}

export interface ParticipantTrackingData {
  participant: Participant;
  boundingBoxes: BoundingBox[];
  timeSegments: TimeSegment[];
  movementMetrics: {
    totalMovement: number;
    averageSpeed: number;
    maxSpeed: number;
    activityLevel: 'low' | 'medium' | 'high';
  };
}

// 놀이 객체 관련 타입
export interface PlayObject {
  id: string;
  type: 'toy' | 'tool' | 'furniture' | 'other';
  name: string;
  description: string;
  category: string;
}

export interface PlayObjectData {
  object: PlayObject;
  detectionFrames: Array<{
    timeOffset: number;
    boundingBox: BoundingBox;
    confidence: number;
  }>;
  usageMetrics: {
    totalUsageTime: number;
    interactionCount: number;
    averageInteractionDuration: number;
    popularityScore: number;
  };
}

// 근접성 분석 타입
export interface ProximityData {
  participants: [string, string]; // 참여자 ID 쌍
  distance: number;
  timeSegment: TimeSegment;
  proximityLevel: 'very_close' | 'close' | 'medium' | 'far';
}

// 움직임 분석 타입
export interface MovementAnalysisData {
  synchronizedMovements: Array<{
    participants: string[];
    timeSegment: TimeSegment;
    synchronizationScore: number;
  }>;
  individualMovements: Array<{
    participantId: string;
    movementType: 'walking' | 'running' | 'sitting' | 'standing' | 'playing';
    timeSegment: TimeSegment;
    intensity: number;
  }>;
}

// 활동 수준 분석 타입
export interface ActivityLevelData {
  participantId: string;
  overallLevel: 'low' | 'medium' | 'high';
  timeBasedLevels: Array<{
    timeSegment: TimeSegment;
    level: 'low' | 'medium' | 'high';
    metrics: {
      movementAmount: number;
      interactionCount: number;
      engagementScore: number;
    };
  }>;
}

// 얼굴 분석 타입
export interface ExpressionData {
  expression: 'happy' | 'sad' | 'neutral' | 'surprised' | 'angry' | 'focused' | 'confused';
  confidence: number;
  timeSegment: TimeSegment;
  participantId: string;
}

export interface FaceAnalysisData {
  participantId: string;
  expressions: ExpressionData[];
  gazeDirections: Array<{
    direction: 'camera' | 'participant' | 'object' | 'other';
    timeSegment: TimeSegment;
    confidence: number;
  }>;
  attentionMetrics: {
    totalAttentionTime: number;
    averageAttentionDuration: number;
    attentionSwitchCount: number;
  };
}

// 음성 분석 타입
export interface SpeechSegment {
  text: string;
  speakerId: string;
  timeSegment: TimeSegment;
  confidence: number;
  emotion?: 'positive' | 'negative' | 'neutral';
  volume?: number;
}

export interface ConversationData {
  totalSpeechTime: number;
  speakerDistribution: Record<string, number>;
  turnTakingMetrics: {
    totalTurns: number;
    averageTurnDuration: number;
    interruptionCount: number;
  };
  languageMetrics: {
    vocabularyRichness: number;
    sentenceComplexity: number;
    questionCount: number;
    commandCount: number;
  };
}

// 상호작용 패턴 타입
export interface InteractionPattern {
  patternType: 'cooperative' | 'competitive' | 'parallel' | 'guided' | 'independent';
  participants: string[];
  timeSegment: TimeSegment;
  intensity: number;
  description: string;
  examples: string[];
}

// 놀이 품질 메트릭 타입
export interface PlayQualityMetrics {
  engagementScore: number;
  interactionQuality: number;
  emotionalPositivity: number;
  learningOpportunities: number;
  creativityScore: number;
  safetyScore: number;
  overallScore: number;
}

// 발달 지표 타입
export interface DevelopmentIndicators {
  physicalDevelopment: {
    grossMotorSkills: number;
    fineMotorSkills: number;
    coordination: number;
  };
  cognitiveDevelopment: {
    problemSolving: number;
    creativity: number;
    attention: number;
    memory: number;
  };
  socialDevelopment: {
    cooperation: number;
    communication: number;
    empathy: number;
    sharing: number;
  };
  emotionalDevelopment: {
    emotionalRegulation: number;
    expressiveness: number;
    resilience: number;
  };
}

// 추천사항 타입
export interface PlayRecommendation {
  category: 'activity' | 'toy' | 'environment' | 'interaction';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  reasoning: string;
  ageAppropriate: boolean;
  implementationTips: string[];
}

// 세션 메타데이터 타입
export interface SessionMetadata {
  sessionId: string;
  duration: number;
  participants: Participant[];
  sessionType: 'free_play' | 'structured_play' | 'guided_play';
  environment: 'indoor' | 'outdoor' | 'mixed';
  timestamp: string;
  videoQuality: 'high' | 'medium' | 'low';
}

// 통합 놀이 분석 결과 타입
export interface IntegratedPlayAnalysisResult {
  sessionMetadata: SessionMetadata;
  participantData: ParticipantTrackingData[];
  playObjectData: PlayObjectData[];
  proximityAnalysis: ProximityData[];
  movementAnalysis: MovementAnalysisData;
  activityLevels: ActivityLevelData[];
  faceAnalysis: FaceAnalysisData[];
  conversationData: ConversationData;
  interactionPatterns: InteractionPattern[];
  playQualityMetrics: PlayQualityMetrics;
  developmentIndicators: DevelopmentIndicators;
  recommendations: PlayRecommendation[];
  processingMetadata: {
    analysisVersion: string;
    processingTime: number;
    confidence: number;
    warnings: string[];
  };
}

// 놀이 분석 핵심 정보 타입
export interface PlayAnalysisCore {
  sessionId: string;
  summary: {
    totalPlayTime: number;
    participantCount: number;
    primaryPlayStyle: string;
    keyHighlights: string[];
  };
  metrics: {
    engagementScore: number;
    interactionQuality: number;
    learningValue: number;
    emotionalWellbeing: number;
    safetyScore: number;
  };
  insights: {
    strengths: string[];
    improvementAreas: string[];
    developmentOpportunities: string[];
  };
  recommendations: PlayRecommendation[];
  exportMetadata: {
    fileName: string;
    fileSize: number;
    exportTime: string;
    format: string;
  };
}

// 분석 요청 타입
export interface PlayAnalysisRequest {
  sessionId: string;
  videoData: {
    fileName: string;
    fileSize: number;
    duration: number;
    format: string;
  };
  analysisOptions: {
    enableDetailedAnalysis: boolean;
    enableRecommendations: boolean;
    analysisDepth: 'basic' | 'detailed' | 'comprehensive';
    focusAreas: string[];
  };
  participantInfo?: {
    childAge?: number;
    specialNeeds?: string[];
    previousAnalysis?: string[];
  };
}

// 분석 상태 타입
export interface AnalysisStatus {
  sessionId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStage: string;
  estimatedTimeRemaining: number;
  startTime: string;
  lastUpdated: string;
  error?: string;
} 