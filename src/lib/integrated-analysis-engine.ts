/**
 * 통합 분석 엔진
 * 비디오 분석 결과와 음성 분석 결과를 결합하여 종합적인 인사이트를 제공
 */

export interface VideoAnalysisResult {
  objectDetections: Array<{
    entity: string;
    confidence: number;
    timeOffset: string;
  }>;
  faceDetections: Array<{
    confidence: number;
    timeOffset: string;
    joy?: number;
    surprise?: number;
    anger?: number;
    sorrow?: number;
  }>;
  personDetections: Array<{
    confidence: number;
    timeOffset: string;
    trackId?: number;
  }>;
  speechTranscriptions: Array<{
    transcript: string;
    confidence: number;
    startTime: string;
    endTime: string;
    speaker?: number;
  }>;
}

export interface VoiceAnalysisResult {
  speakers: Array<{
    speakerId: number;
    demographic: {
      age: 'adult' | 'child' | 'teenager';
      gender: 'male' | 'female' | 'unknown';
    };
    emotionalProfile: {
      dominant: string;
      engagement: number;
      stability: number;
    };
    speechCharacteristics: {
      pitch: 'low' | 'medium' | 'high';
      tempo: 'slow' | 'normal' | 'fast';
      volume: 'low' | 'moderate' | 'high';
    };
  }>;
  conversationMetrics: {
    turnTaking: {
      balance: number;
      appropriateness: number;
    };
    responseTime: {
      average: number;
      appropriateness: number;
    };
    interactionQuality: number;
  };
  emotionAnalysis: {
    timeline: Array<{
      timeOffset: string;
      emotion: string;
      intensity: number;
      speaker: number;
    }>;
    overallMood: string;
    emotionalSynchrony: number;
  };
}

export interface IntegratedAnalysisResult {
  overallScore: number;
  interactionQuality: number;
  synchronization: {
    emotionalSynchrony: number;
    behavioralSynchrony: number;
    linguisticSynchrony: number;
    temporalSynchrony: number;
  };
  participantProfiles: {
    parent: {
      engagement: number;
      responsiveness: number;
      supportiveness: number;
      emotional_regulation: number;
    };
    child: {
      participation: number;
      expressiveness: number;
      receptiveness: number;
      emotional_expression: number;
    };
  };
  interactionPatterns: {
    physical: {
      proximity_patterns: Array<{
        timeRange: string;
        level: 'close' | 'moderate' | 'distant';
        appropriateness: number;
      }>;
      movement_synchronization: number;
      shared_activities: number;
    };
    verbal: {
      conversation_balance: number;
      response_quality: number;
      language_development_support: number;
      turn_taking_quality: number;
    };
    emotional: {
      emotional_mirroring: number;
      positive_affect_sharing: number;
      emotional_support: number;
      co_regulation: number;
    };
  };
  keyFindings: string[];
  recommendations: string[];
  riskFactors: Array<{
    factor: string;
    severity: 'low' | 'moderate' | 'high';
    description: string;
  }>;
  strengths: Array<{
    area: string;
    score: number;
    description: string;
  }>;
  developmentalIndicators: {
    language: {
      score: number;
      areas: string[];
      recommendations: string[];
    };
    social: {
      score: number;
      areas: string[];
      recommendations: string[];
    };
    emotional: {
      score: number;
      areas: string[];
      recommendations: string[];
    };
    cognitive: {
      score: number;
      areas: string[];
      recommendations: string[];
    };
  };
  completedAt: string;
  processingSteps: number;
  metadata: {
    analysisVersion: string;
    confidenceLevel: number;
    dataQuality: {
      video: number;
      audio: number;
      overall: number;
    };
  };
}

export class IntegratedAnalysisEngine {
  private static readonly ANALYSIS_VERSION = '2.0.0';
  
  constructor() {
    console.log('🔧 IntegratedAnalysisEngine initialized');
  }

  /**
   * 비디오와 음성 분석 결과를 통합하여 종합 분석을 수행
   */
  async performIntegratedAnalysis(
    videoAnalysis: VideoAnalysisResult,
    voiceAnalysis: VoiceAnalysisResult,
    sessionId: string
  ): Promise<IntegratedAnalysisResult> {
    console.log(`🔄 Starting integrated analysis for session: ${sessionId}`);
    
    const startTime = new Date();
    
    // 1. 참여자 프로필 분석
    const participantProfiles = this.analyzeParticipantProfiles(videoAnalysis, voiceAnalysis);
    
    // 2. 동기화 분석
    const synchronization = this.analyzeSynchronization(videoAnalysis, voiceAnalysis);
    
    // 3. 상호작용 패턴 분석
    const interactionPatterns = this.analyzeInteractionPatterns(videoAnalysis, voiceAnalysis);
    
    // 4. 발달 지표 분석
    const developmentalIndicators = this.analyzeDevelopmentalIndicators(videoAnalysis, voiceAnalysis);
    
    // 5. 전체 점수 계산
    const scores = this.calculateOverallScores(participantProfiles, synchronization, interactionPatterns);
    
    // 6. 주요 발견사항 및 추천사항 생성
    const insights = this.generateInsights(participantProfiles, synchronization, interactionPatterns, developmentalIndicators);
    
    // 7. 위험 요소 및 강점 분석
    const riskAndStrengths = this.analyzeRiskAndStrengths(participantProfiles, interactionPatterns, developmentalIndicators);
    
    // 8. 데이터 품질 평가
    const dataQuality = this.assessDataQuality(videoAnalysis, voiceAnalysis);
    
    const result: IntegratedAnalysisResult = {
      overallScore: scores.overall,
      interactionQuality: scores.interaction,
      synchronization,
      participantProfiles,
      interactionPatterns,
      keyFindings: insights.findings,
      recommendations: insights.recommendations,
      riskFactors: riskAndStrengths.risks,
      strengths: riskAndStrengths.strengths,
      developmentalIndicators,
      completedAt: new Date().toISOString(),
      processingSteps: 8,
      metadata: {
        analysisVersion: IntegratedAnalysisEngine.ANALYSIS_VERSION,
        confidenceLevel: this.calculateConfidenceLevel(dataQuality),
        dataQuality
      }
    };
    
    const processingTime = new Date().getTime() - startTime.getTime();
    console.log(`✅ Integrated analysis completed in ${processingTime}ms`);
    
    return result;
  }

  /**
   * 참여자 프로필 분석
   */
  private analyzeParticipantProfiles(videoAnalysis: VideoAnalysisResult, voiceAnalysis: VoiceAnalysisResult) {
    const parentSpeaker = voiceAnalysis.speakers.find(s => s.demographic.age === 'adult');
    const childSpeaker = voiceAnalysis.speakers.find(s => s.demographic.age === 'child');
    
    const parentProfile = {
      engagement: parentSpeaker?.emotionalProfile.engagement || 0.5,
      responsiveness: voiceAnalysis.conversationMetrics.responseTime.appropriateness,
      supportiveness: this.calculateSupportiveness(videoAnalysis, voiceAnalysis, 'parent'),
      emotional_regulation: parentSpeaker?.emotionalProfile.stability || 0.5
    };
    
    const childProfile = {
      participation: childSpeaker?.emotionalProfile.engagement || 0.5,
      expressiveness: this.calculateExpressiveness(videoAnalysis, voiceAnalysis, 'child'),
      receptiveness: voiceAnalysis.conversationMetrics.turnTaking.appropriateness,
      emotional_expression: this.calculateEmotionalExpression(videoAnalysis, childSpeaker)
    };
    
    return {
      parent: parentProfile,
      child: childProfile
    };
  }

  /**
   * 동기화 분석
   */
  private analyzeSynchronization(videoAnalysis: VideoAnalysisResult, voiceAnalysis: VoiceAnalysisResult) {
    return {
      emotionalSynchrony: voiceAnalysis.emotionAnalysis?.emotionalSynchrony || 0.7,
      behavioralSynchrony: this.calculateBehavioralSynchrony(videoAnalysis),
      linguisticSynchrony: this.calculateLinguisticSynchrony(videoAnalysis.speechTranscriptions),
      temporalSynchrony: this.calculateTemporalSynchrony(videoAnalysis, voiceAnalysis)
    };
  }

  /**
   * 상호작용 패턴 분석
   */
  private analyzeInteractionPatterns(videoAnalysis: VideoAnalysisResult, voiceAnalysis: VoiceAnalysisResult) {
    return {
      physical: {
        proximity_patterns: this.analyzeProximityPatterns(videoAnalysis),
        movement_synchronization: this.calculateBehavioralSynchrony(videoAnalysis),
        shared_activities: this.calculateSharedActivities(videoAnalysis)
      },
      verbal: {
        conversation_balance: voiceAnalysis.conversationMetrics.turnTaking.balance,
        response_quality: voiceAnalysis.conversationMetrics.responseTime.appropriateness,
        language_development_support: this.calculateLanguageDevelopmentSupport(videoAnalysis, voiceAnalysis),
        turn_taking_quality: voiceAnalysis.conversationMetrics.turnTaking.appropriateness
      },
      emotional: {
        emotional_mirroring: this.calculateEmotionalMirroring(videoAnalysis, voiceAnalysis),
        positive_affect_sharing: this.calculatePositiveAffectSharing(videoAnalysis),
        emotional_support: this.calculateEmotionalSupport(videoAnalysis, voiceAnalysis),
        co_regulation: this.calculateCoRegulation(voiceAnalysis)
      }
    };
  }

  /**
   * 발달 지표 분석
   */
  private analyzeDevelopmentalIndicators(videoAnalysis: VideoAnalysisResult, voiceAnalysis: VoiceAnalysisResult) {
    const childSpeaker = voiceAnalysis.speakers.find(s => s.demographic.age === 'child');
    
    return {
      language: {
        score: this.calculateLanguageScore(videoAnalysis, childSpeaker),
        areas: ['발화 빈도', '어휘 다양성', '문장 구조'],
        recommendations: ['더 많은 질문하기', '새로운 단어 소개하기']
      },
      social: {
        score: this.calculateSocialScore(videoAnalysis, voiceAnalysis),
        areas: ['턴테이킹', '공유 주의', '협력 놀이'],
        recommendations: ['사회적 규칙 연습하기', '협력 게임 늘리기']
      },
      emotional: {
        score: this.calculateEmotionalScore(videoAnalysis, voiceAnalysis),
        areas: ['감정 표현', '감정 인식', '감정 조절'],
        recommendations: ['감정 어휘 늘리기', '감정 조절 기법 연습']
      },
      cognitive: {
        score: this.calculateCognitiveScore(videoAnalysis, voiceAnalysis),
        areas: ['문제 해결', '주의 집중', '기억력'],
        recommendations: ['문제 해결 놀이 늘리기', '집중력 향상 활동']
      }
    };
  }

  /**
   * 전체 점수 계산
   */
  private calculateOverallScores(participantProfiles: any, synchronization: any, interactionPatterns: any) {
    const parentScore = (participantProfiles.parent.engagement + 
                       participantProfiles.parent.responsiveness + 
                       participantProfiles.parent.supportiveness + 
                       participantProfiles.parent.emotional_regulation) / 4;
    
    const childScore = (participantProfiles.child.participation + 
                       participantProfiles.child.expressiveness + 
                       participantProfiles.child.receptiveness + 
                       participantProfiles.child.emotional_expression) / 4;
    
    const syncScore = (synchronization.emotionalSynchrony + 
                      synchronization.behavioralSynchrony + 
                      synchronization.linguisticSynchrony + 
                      synchronization.temporalSynchrony) / 4;
    
    const interactionScore = (interactionPatterns.physical.movement_synchronization + 
                            interactionPatterns.verbal.conversation_balance + 
                            interactionPatterns.emotional.emotional_mirroring) / 3;
    
    const overall = Math.round((parentScore + childScore + syncScore + interactionScore) / 4 * 100);
    const interaction = Math.round(interactionScore * 100);
    
    return { overall, interaction };
  }

  /**
   * 인사이트 생성
   */
  private generateInsights(participantProfiles: any, synchronization: any, interactionPatterns: any, developmentalIndicators: any) {
    const findings: string[] = [];
    const recommendations: string[] = [];
    
    // 부모 참여도 분석
    if (participantProfiles.parent.engagement > 0.8) {
      findings.push('부모의 적극적인 참여가 관찰됩니다');
    } else if (participantProfiles.parent.engagement < 0.5) {
      findings.push('부모의 참여도 향상이 필요합니다');
      recommendations.push('더 적극적으로 놀이에 참여해보세요');
    }
    
    // 아이 표현력 분석
    if (participantProfiles.child.expressiveness > 0.7) {
      findings.push('아이의 표현력이 우수합니다');
    } else {
      findings.push('아이의 표현력 개발이 도움될 수 있습니다');
      recommendations.push('아이의 발화를 더 많이 유도해보세요');
    }
    
    // 감정 동조성 분석
    if (synchronization.emotionalSynchrony > 0.8) {
      findings.push('부모-자녀 간 우수한 감정적 연결이 관찰됩니다');
    } else if (synchronization.emotionalSynchrony < 0.6) {
      findings.push('감정적 연결 강화가 필요합니다');
      recommendations.push('아이의 감정에 더 민감하게 반응해보세요');
    }
    
    // 대화 균형 분석
    if (interactionPatterns.verbal.conversation_balance < 0.3) {
      findings.push('부모가 대화를 주도하는 경향이 있습니다');
      recommendations.push('아이에게 더 많은 발화 기회를 제공해보세요');
    } else if (interactionPatterns.verbal.conversation_balance > 0.7) {
      findings.push('아이가 대화를 주도하는 경향이 있습니다');
      recommendations.push('적절한 가이드를 제공해보세요');
    }
    
    return { findings, recommendations };
  }

  /**
   * 위험 요소 및 강점 분석
   */
  private analyzeRiskAndStrengths(participantProfiles: any, interactionPatterns: any, developmentalIndicators: any) {
    const risks = [];
    const strengths = [];
    
    // 위험 요소 확인
    if (participantProfiles.parent.responsiveness < 0.5) {
      risks.push({
        factor: '낮은 부모 반응성',
        severity: 'moderate' as const,
        description: '아이의 신호에 대한 반응이 제한적입니다'
      });
    }
    
    if (developmentalIndicators.language.score < 60) {
      risks.push({
        factor: '언어 발달 지연 위험',
        severity: 'high' as const,
        description: '언어 발달에 추가 지원이 필요할 수 있습니다'
      });
    }
    
    // 강점 확인
    if (interactionPatterns.emotional.positive_affect_sharing > 0.8) {
      strengths.push({
        area: '긍정적 감정 공유',
        score: Math.round(interactionPatterns.emotional.positive_affect_sharing * 100),
        description: '부모-자녀 간 긍정적 감정 교류가 활발합니다'
      });
    }
    
    if (participantProfiles.child.participation > 0.7) {
      strengths.push({
        area: '높은 참여도',
        score: Math.round(participantProfiles.child.participation * 100),
        description: '아이가 놀이에 적극적으로 참여합니다'
      });
    }
    
    return { risks, strengths };
  }

  // 헬퍼 메서드들
  private calculateSupportiveness(videoAnalysis: VideoAnalysisResult, voiceAnalysis: VoiceAnalysisResult, participant: 'parent' | 'child'): number {
    // 지원성 계산 로직
    return 0.75; // 임시값
  }
  
  private calculateExpressiveness(videoAnalysis: VideoAnalysisResult, voiceAnalysis: VoiceAnalysisResult, participant: 'parent' | 'child'): number {
    // 표현력 계산 로직
    return 0.68; // 임시값
  }
  
  private calculateEmotionalExpression(videoAnalysis: VideoAnalysisResult, speaker: any): number {
    // 감정 표현 계산 로직
    return speaker?.emotionalProfile?.engagement || 0.6;
  }
  
  private calculateBehavioralSynchrony(videoAnalysis: VideoAnalysisResult): number {
    // 행동 동조성 계산 로직
    return 0.79; // 임시값
  }
  
  private calculateLinguisticSynchrony(speechTranscriptions: any[]): number {
    // 언어적 동조성 계산 로직
    return 0.85; // 임시값
  }
  
  private calculateTemporalSynchrony(videoAnalysis: VideoAnalysisResult, voiceAnalysis: VoiceAnalysisResult): number {
    // 시간적 동조성 계산 로직
    return 0.73; // 임시값
  }
  
  private analyzeProximityPatterns(videoAnalysis: VideoAnalysisResult) {
    // 근접성 패턴 분석
    return [
      { timeRange: '0-30s', level: 'close' as const, appropriateness: 0.9 },
      { timeRange: '30-60s', level: 'moderate' as const, appropriateness: 0.8 }
    ];
  }
  
  private calculateSharedActivities(videoAnalysis: VideoAnalysisResult): number {
    // 공유 활동 계산
    return 0.82;
  }
  
  private calculateLanguageDevelopmentSupport(videoAnalysis: VideoAnalysisResult, voiceAnalysis: VoiceAnalysisResult): number {
    // 언어 발달 지원 계산
    return 0.76;
  }
  
  private calculateEmotionalMirroring(videoAnalysis: VideoAnalysisResult, voiceAnalysis: VoiceAnalysisResult): number {
    // 감정 미러링 계산
    return 0.81;
  }
  
  private calculatePositiveAffectSharing(videoAnalysis: VideoAnalysisResult): number {
    // 긍정 감정 공유 계산
    const positiveEmotions = videoAnalysis.faceDetections.filter(face => (face.joy || 0) > 0.5);
    return positiveEmotions.length > 0 ? 0.87 : 0.45;
  }
  
  private calculateEmotionalSupport(videoAnalysis: VideoAnalysisResult, voiceAnalysis: VoiceAnalysisResult): number {
    // 감정 지원 계산
    return 0.78;
  }
  
  private calculateCoRegulation(voiceAnalysis: VoiceAnalysisResult): number {
    // 공동 조절 계산
    return 0.74;
  }
  
  private calculateLanguageScore(videoAnalysis: VideoAnalysisResult, childSpeaker: any): number {
    // 언어 점수 계산
    const transcriptions = videoAnalysis.speechTranscriptions.filter(t => t.speaker === 2); // 아이
    return Math.min(100, transcriptions.length * 10 + 40);
  }
  
  private calculateSocialScore(videoAnalysis: VideoAnalysisResult, voiceAnalysis: VoiceAnalysisResult): number {
    // 사회성 점수 계산
    return Math.round(voiceAnalysis.conversationMetrics.interactionQuality * 100);
  }
  
  private calculateEmotionalScore(videoAnalysis: VideoAnalysisResult, voiceAnalysis: VoiceAnalysisResult): number {
    // 감정 점수 계산
    const positiveEmotions = videoAnalysis.faceDetections.filter(face => (face.joy || 0) > 0.3);
    return Math.min(100, positiveEmotions.length * 15 + 50);
  }
  
  private calculateCognitiveScore(videoAnalysis: VideoAnalysisResult, voiceAnalysis: VoiceAnalysisResult): number {
    // 인지 점수 계산
    return 75; // 임시값
  }
  
  private assessDataQuality(videoAnalysis: VideoAnalysisResult, voiceAnalysis: VoiceAnalysisResult) {
    const videoQuality = Math.min(100, videoAnalysis.faceDetections.length * 10 + videoAnalysis.objectDetections.length * 5 + 30);
    const audioQuality = Math.min(100, voiceAnalysis.speakers.length * 20 + videoAnalysis.speechTranscriptions.length * 5 + 40);
    const overall = Math.round((videoQuality + audioQuality) / 2);
    
    return {
      video: videoQuality,
      audio: audioQuality,
      overall
    };
  }
  
  private calculateConfidenceLevel(dataQuality: any): number {
    return Math.round(dataQuality.overall * 0.9); // 데이터 품질에 기반한 신뢰도
  }
} 