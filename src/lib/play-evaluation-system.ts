/**
 * Play Evaluation System
 * 놀이 상호작용을 종합적으로 평가하고 점수를 제공하는 시스템
 */

interface EvaluationScores {
  overall: number;                    // 전체 점수 (0-100)
  interactionQuality: number;         // 상호작용 질 (0-100)
  developmentSupport: number;         // 발달 지원 수준 (0-100)
  playEnvironment: number;           // 놀이 환경 최적화 (0-100)
  communicationScore: number;         // 소통 점수 (0-100)
  emotionalConnection: number;        // 감정적 연결 (0-100)
  attentionSpan: number;             // 주의집중 (0-100)
  creativity: number;                 // 창의성 (0-100)
}

interface EvaluationInsights {
  strengths: string[];                // 강점들
  improvements: string[];             // 개선점들
  developmentGoals: string[];         // 발달 목표들
  recommendations: string[];          // 권장사항들
  riskFactors?: string[];            // 위험 요소들 (선택적)
}

interface PlayEvaluationResult {
  sessionId: string;
  scores: EvaluationScores;
  insights: EvaluationInsights;
  grade: 'A' | 'B' | 'C' | 'D';       // 전체 등급
  evaluatedAt: string;
  metadata: {
    evaluationVersion: string;
    criteria: string[];
    processingTime: number;
  };
}

export class PlayEvaluationSystem {
  private readonly evaluationVersion = '2.0.0';

  /**
   * 통합 분석 결과를 기반으로 놀이 세션을 종합 평가
   */
  async evaluatePlaySession(integratedAnalysis: any): Promise<PlayEvaluationResult> {
    const startTime = Date.now();
    
    console.log('🔍 Starting comprehensive play evaluation...');
    
    // 기본 점수 계산
    const scores = await this.calculateScores(integratedAnalysis);
    
    // 인사이트 생성
    const insights = await this.generateInsights(integratedAnalysis, scores);
    
    // 전체 등급 계산
    const grade = this.calculateGrade(scores.overall);
    
    const evaluationResult: PlayEvaluationResult = {
      sessionId: integratedAnalysis.sessionId || 'unknown',
      scores,
      insights,
      grade,
      evaluatedAt: new Date().toISOString(),
      metadata: {
        evaluationVersion: this.evaluationVersion,
        criteria: [
          'physical_interaction',
          'emotional_connection', 
          'language_development',
          'play_patterns',
          'attention_span',
          'creativity_indicators'
        ],
        processingTime: Date.now() - startTime
      }
    };
    
    console.log(`✅ Play evaluation completed:`, {
      sessionId: integratedAnalysis.sessionId,
      overallScore: scores.overall,
      grade,
      processingTime: evaluationResult.metadata.processingTime
    });
    
    return evaluationResult;
  }

  /**
   * 통합 분석 데이터를 기반으로 점수 계산
   */
  private async calculateScores(integratedAnalysis: any): Promise<EvaluationScores> {
    const {
      physicalInteraction = {},
      emotionalInteraction = {},
      languageInteraction = {},
      playPatterns = {},
      overallScore = 75
    } = integratedAnalysis;

    // 각 영역별 점수 계산 (0-100 범위)
    const interactionQuality = this.calculateInteractionQuality(physicalInteraction, emotionalInteraction);
    const developmentSupport = this.calculateDevelopmentSupport(languageInteraction, playPatterns);
    const playEnvironment = this.calculatePlayEnvironment(playPatterns, physicalInteraction);
    const communicationScore = this.calculateCommunicationScore(languageInteraction);
    const emotionalConnection = this.calculateEmotionalConnection(emotionalInteraction);
    const attentionSpan = this.calculateAttentionSpan(integratedAnalysis);
    const creativity = this.calculateCreativity(playPatterns, languageInteraction);

    // 전체 점수는 모든 영역의 가중 평균
    const overall = Math.round(
      (interactionQuality * 0.25) +
      (developmentSupport * 0.20) +
      (playEnvironment * 0.15) +
      (communicationScore * 0.20) +
      (emotionalConnection * 0.15) +
      (attentionSpan * 0.03) +
      (creativity * 0.02)
    );

    return {
      overall: Math.max(0, Math.min(100, overall)),
      interactionQuality: Math.round(interactionQuality),
      developmentSupport: Math.round(developmentSupport),
      playEnvironment: Math.round(playEnvironment),
      communicationScore: Math.round(communicationScore),
      emotionalConnection: Math.round(emotionalConnection),
      attentionSpan: Math.round(attentionSpan),
      creativity: Math.round(creativity)
    };
  }

  /**
   * 상호작용 질 점수 계산
   */
  private calculateInteractionQuality(physical: any, emotional: any): number {
    const proximityScore = physical.proximityScore || 70;
    const engagementScore = emotional.overallEngagement || 75;
    const responseTime = physical.averageResponseTime || 2.0;
    
    // 응답 시간이 빠를수록 높은 점수
    const responseScore = Math.max(0, 100 - (responseTime * 10));
    
    return (proximityScore * 0.4) + (engagementScore * 0.4) + (responseScore * 0.2);
  }

  /**
   * 발달 지원 수준 계산
   */
  private calculateDevelopmentSupport(language: any, play: any): number {
    const vocabularyDiversity = language.vocabularyDiversity || 70;
    const playDiversity = play.diversityScore || 75;
    const scaffolding = language.scaffoldingLevel || 60;
    
    return (vocabularyDiversity * 0.35) + (playDiversity * 0.35) + (scaffolding * 0.30);
  }

  /**
   * 놀이 환경 최적화 점수
   */
  private calculatePlayEnvironment(play: any, physical: any): number {
    const spaceUtilization = physical.spaceUtilization || 80;
    const materialVariety = play.materialVariety || 70;
    const safetyScore = physical.safetyIndicators || 90;
    
    return (spaceUtilization * 0.4) + (materialVariety * 0.35) + (safetyScore * 0.25);
  }

  /**
   * 소통 점수 계산
   */
  private calculateCommunicationScore(language: any): number {
    const turnTaking = language.turnTakingBalance || 0.7;
    const responseAppropriate = language.responseAppropriateness || 0.8;
    const languageComplexity = language.complexityScore || 70;
    
    return (turnTaking * 40) + (responseAppropriate * 35) + (languageComplexity * 0.25);
  }

  /**
   * 감정적 연결 점수
   */
  private calculateEmotionalConnection(emotional: any): number {
    const emotionalSync = emotional.emotionalSynchrony || 0.75;
    const positiveInteractions = emotional.positiveInteractionRatio || 0.8;
    const conflictResolution = emotional.conflictResolutionScore || 70;
    
    return (emotionalSync * 35) + (positiveInteractions * 40) + (conflictResolution * 0.25);
  }

  /**
   * 주의집중 점수
   */
  private calculateAttentionSpan(analysis: any): number {
    const averageAttention = analysis.averageAttentionSpan || 45;
    const maxAttention = analysis.maxAttentionSpan || 120;
    
    // 45초 이상이면 80점, 120초 이상이면 90점 베이스
    const baseScore = averageAttention >= 45 ? 80 : averageAttention * 1.78; // 45초 = 80점
    const bonusScore = maxAttention >= 120 ? 10 : (maxAttention / 120) * 10;
    
    return Math.min(100, baseScore + bonusScore);
  }

  /**
   * 창의성 점수
   */
  private calculateCreativity(play: any, language: any): number {
    const imaginativePlay = play.imaginativePlayScore || 70;
    const problemSolving = play.problemSolvingInstances || 0;
    const uniqueExpressions = language.uniqueExpressionCount || 5;
    
    const problemSolvingScore = Math.min(100, problemSolving * 20); // 문제 해결 1회당 20점
    const expressionScore = Math.min(100, uniqueExpressions * 4); // 독특한 표현 1개당 4점
    
    return (imaginativePlay * 0.6) + (problemSolvingScore * 0.25) + (expressionScore * 0.15);
  }

  /**
   * 전체 점수를 기반으로 등급 계산
   */
  private calculateGrade(overallScore: number): 'A' | 'B' | 'C' | 'D' {
    if (overallScore >= 90) {
      return 'A';
    }
    if (overallScore >= 80) {
      return 'B';
    }
    if (overallScore >= 70) {
      return 'C';
    }
    return 'D';
  }

  /**
   * 점수를 기반으로 인사이트 생성
   */
  private async generateInsights(analysis: any, scores: EvaluationScores): Promise<EvaluationInsights> {
    const strengths: string[] = [];
    const improvements: string[] = [];
    const developmentGoals: string[] = [];
    const recommendations: string[] = [];

    // 강점 식별
    if (scores.interactionQuality >= 80) {
      strengths.push('부모와 자녀 간 활발한 상호작용이 관찰됩니다');
    }
    if (scores.communicationScore >= 80) {
      strengths.push('언어적 소통이 매우 활발하고 효과적입니다');
    }
    if (scores.emotionalConnection >= 80) {
      strengths.push('감정적 유대감과 동조화가 우수합니다');
    }
    if (scores.creativity >= 75) {
      strengths.push('창의적이고 상상력이 풍부한 놀이를 보입니다');
    }

    // 개선점 식별
    if (scores.attentionSpan < 70) {
      improvements.push('주의집중 시간을 늘리는 활동이 필요합니다');
    }
    if (scores.communicationScore < 70) {
      improvements.push('더 풍부한 언어적 상호작용을 위해 대화를 늘려보세요');
    }
    if (scores.playEnvironment < 75) {
      improvements.push('놀이 공간과 도구 활용을 개선해보세요');
    }
    if (scores.emotionalConnection < 70) {
      improvements.push('감정적 연결과 공감 표현을 더 늘려보세요');
    }

    // 발달 목표 설정
    developmentGoals.push('균형있는 언어 및 사회성 발달 지원');
    developmentGoals.push('창의적 사고와 문제해결 능력 향상');
    developmentGoals.push('집중력과 지속성 강화');

    // 구체적 권장사항
    if (scores.overall >= 85) {
      recommendations.push('현재의 우수한 상호작용 패턴을 유지하세요');
      recommendations.push('더 복잡한 놀이와 도전 과제를 제시해보세요');
    } else if (scores.overall >= 70) {
      recommendations.push('긍정적인 피드백과 격려를 더 자주 표현해보세요');
      recommendations.push('자녀의 주도권을 더 존중하고 지지해주세요');
    } else {
      recommendations.push('놀이 시간을 늘리고 더 집중적인 상호작용을 시도해보세요');
      recommendations.push('전문가와의 상담을 고려해보시기 바랍니다');
    }

    // 일반적 권장사항
    recommendations.push('매일 30분 이상의 질적 놀이 시간을 확보하세요');
    recommendations.push('자녀의 감정을 언어로 표현하도록 도와주세요');

    return {
      strengths,
      improvements,
      developmentGoals,
      recommendations
    };
  }

  /**
   * 빠른 점수 계산 (단순화된 버전)
   */
  async quickEvaluation(basicData: any): Promise<{ score: number; grade: string }> {
    const baseScore = basicData.overallScore || 75;
    const adjustedScore = Math.max(50, Math.min(100, baseScore));
    const grade = this.calculateGrade(adjustedScore);
    
    return {
      score: adjustedScore,
      grade
    };
  }
} 