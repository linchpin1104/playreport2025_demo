/**
 * 통합 분석 시스템
 * 모든 분석 모듈을 통합하여 종합적인 놀이 상호작용 분석 수행
 */

import { EmotionalInteractionAnalyzer, EmotionalInteractionResult, FaceData } from './emotional-interaction-analyzer';
import { LanguageInteractionAnalyzer, LanguageInteractionResult, TranscriptEntry } from './language-interaction-analyzer';
import { PhysicalInteractionAnalyzer, PhysicalInteractionResult } from './physical-interaction-analyzer';
import { PlayPatternAnalyzer, PlayPatternResult, ObjectTrack } from './play-pattern-analyzer';

export interface IntegratedAnalysisInput {
  videoAnalysisData: {
    objectTracking: unknown[];
    faceDetection: unknown[];
    personDetection: unknown[];
    shotChanges: unknown[];
  };
  audioAnalysisData: {
    transcript: TranscriptEntry[];
    speakers: string[];
    emotions: unknown[];
    voiceMetrics: unknown[];
  };
  sessionMetadata: {
    duration: number;
    participants: string[];
    sessionType: string;
    timestamp: string;
  };
}

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
  rawData: {
    physicalInteraction: PhysicalInteractionResult;
    languageInteraction: LanguageInteractionResult;
    emotionalInteraction: EmotionalInteractionResult;
    playPatterns: PlayPatternResult;
  };
}

export class IntegratedAnalysisSystem {
  private readonly physicalAnalyzer: PhysicalInteractionAnalyzer;
  private readonly languageAnalyzer: LanguageInteractionAnalyzer;
  private readonly emotionalAnalyzer: EmotionalInteractionAnalyzer;
  private readonly playPatternAnalyzer: PlayPatternAnalyzer;

  constructor() {
    this.physicalAnalyzer = new PhysicalInteractionAnalyzer();
    this.languageAnalyzer = new LanguageInteractionAnalyzer();
    this.emotionalAnalyzer = new EmotionalInteractionAnalyzer();
    this.playPatternAnalyzer = new PlayPatternAnalyzer();
  }

  /**
   * 통합 분석 수행
   */
  async performIntegratedAnalysis(
    input: IntegratedAnalysisInput,
    sessionId: string
  ): Promise<IntegratedAnalysisResult> {
    try {
      console.log('Starting integrated analysis for session:', sessionId);

      // 1. 물리적 상호작용 분석
      const physicalInteraction = await this.physicalAnalyzer.analyzePhysicalInteraction(
        input.videoAnalysisData.personDetection,
        input.sessionMetadata
      );

      // 2. 언어 상호작용 분석
      const languageInteraction = await this.languageAnalyzer.analyzeLanguageInteraction(
        input.audioAnalysisData.transcript
      );

      // 3. 감정적 상호작용 분석
      const faceData = this.convertToFaceData(input.videoAnalysisData.faceDetection);
      const emotionalInteraction = await this.emotionalAnalyzer.analyzeEmotionalInteraction(
        faceData,
        input.videoAnalysisData.personDetection,
        input.audioAnalysisData.emotions
      );

      // 4. 놀이 패턴 분석
      const objectTracks = this.convertToObjectTracks(input.videoAnalysisData.objectTracking);
      const playPatterns = await this.playPatternAnalyzer.analyzePlayPatterns(
        objectTracks,
        input.videoAnalysisData.personDetection,
        input.sessionMetadata
      );

      // 5. 종합 점수 계산
      const comprehensiveScores = this.calculateComprehensiveScores(
        physicalInteraction,
        languageInteraction,
        emotionalInteraction,
        playPatterns
      );

      // 6. 발달 인사이트 생성
      const developmentInsights = this.generateDevelopmentInsights(
        physicalInteraction,
        languageInteraction,
        emotionalInteraction,
        playPatterns,
        comprehensiveScores
      );

      // 7. 상세 리포트 생성
      const detailedReport = this.generateDetailedReport(
        physicalInteraction,
        languageInteraction,
        emotionalInteraction,
        playPatterns,
        comprehensiveScores,
        developmentInsights
      );

      return {
        sessionInfo: {
          sessionId,
          duration: input.sessionMetadata.duration,
          participants: input.sessionMetadata.participants,
          analysisTimestamp: new Date().toISOString()
        },
        physicalInteraction,
        languageInteraction,
        emotionalInteraction,
        playPatterns,
        comprehensiveScores,
        developmentInsights,
        detailedReport,
        rawData: {
          physicalInteraction,
          languageInteraction,
          emotionalInteraction,
          playPatterns
        }
      };

    } catch (error) {
      console.error('Integrated analysis error:', error);
      throw new Error(`통합 분석 실패: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 상호작용 질 점수 계산 (Python InteractionScoreCalculator 반영, 1-10 점수)
   */
  private calculateComprehensiveScores(
    physical: PhysicalInteractionResult,
    language: LanguageInteractionResult,
    emotional: EmotionalInteractionResult,
    play: PlayPatternResult
  ): {
    physicalEngagement: number;
    communicationQuality: number;
    emotionalConnection: number;
    playCreativity: number;
    overallDevelopment: number;
  } {
    // Python weights 적용
    const weights = {
      physical_proximity: 0.15,
      movement_synchrony: 0.10,
      face_orientation: 0.15,
      language_frequency: 0.15,
      language_quality: 0.15,
      play_diversity: 0.10,
      attention_span: 0.10,
      conflict_resolution: 0.10
    };

    let totalScore = 0;

    // 1. 물리적 근접성 (전체 시간 대비 근거리 상호작용 시간)
    const proximityRatio = (physical?.proximityAnalysis?.proximityScore || 0);
    const proximityScore = proximityRatio * 10 * weights.physical_proximity;
    totalScore += proximityScore;

    // 2. 움직임 동기화
    const syncRatio = (physical?.movementSynchrony?.syncScore || 0);
    const movementScore = syncRatio * 10 * weights.movement_synchrony;
    totalScore += movementScore;

    // 3. 얼굴 방향 (참여도)
    const faceOrientationRatio = (emotional?.faceOrientationAnalysis?.engagementScore || 0);
    const faceScore = faceOrientationRatio * 10 * weights.face_orientation;
    totalScore += faceScore;

    // 4. 언어적 상호작용 빈도
    const utteranceCount = language?.conversationPatterns?.turnTaking?.turnCount || 
                          language?.conversationPatterns?.turnCount || 0;
    const languageFrequencyRatio = Math.min(utteranceCount / 50, 1); // 50회를 최대로 정규화
    const languageFrequencyScore = languageFrequencyRatio * 10 * weights.language_frequency;
    totalScore += languageFrequencyScore;

    // 5. 언어적 상호작용 품질
    const languageQualityRatio = (language?.qualityScore || language?.overallScore || 0);
    const languageQualityScore = languageQualityRatio * 10 * weights.language_quality;
    totalScore += languageQualityScore;

    // 6. 놀이 다양성
    const playDiversityRatio = (play?.creativityIndicators?.variabilityScore || 0);
    const playDiversityScore = playDiversityRatio * 10 * weights.play_diversity;
    totalScore += playDiversityScore;

    // 7. 주의 지속 시간
    const attentionSpanRatio = (play?.attentionSpan?.averageFocusDuration || 0) / 60; // 분으로 변환 후 정규화
    const attentionScore = Math.min(attentionSpanRatio, 1) * 10 * weights.attention_span;
    totalScore += attentionScore;

    // 8. 갈등 해결
    const conflictResolutionRatio = 1 - (play?.conflictIndicators?.conflictFrequency || 0); // 갈등이 적을수록 높은 점수
    const conflictScore = conflictResolutionRatio * 10 * weights.conflict_resolution;
    totalScore += conflictScore;

    // 개별 영역 점수 계산 (1-10 범위)
    const physicalEngagement = Math.round(((proximityScore + movementScore) / (weights.physical_proximity + weights.movement_synchrony)) * 100) / 100;
    const communicationQuality = Math.round(((languageFrequencyScore + languageQualityScore) / (weights.language_frequency + weights.language_quality)) * 100) / 100;
    const emotionalConnection = Math.round((faceScore / weights.face_orientation) * 100) / 100;
    const playCreativity = Math.round(((playDiversityScore + attentionScore + conflictScore) / (weights.play_diversity + weights.attention_span + weights.conflict_resolution)) * 100) / 100;
    
    // 전체 발달 점수 (1-10 범위)
    const overallDevelopment = Math.round(totalScore * 100) / 100;

    const result = {
      physicalEngagement: Math.max(1, Math.min(10, physicalEngagement)),
      communicationQuality: Math.max(1, Math.min(10, communicationQuality)),
      emotionalConnection: Math.max(1, Math.min(10, emotionalConnection)),
      playCreativity: Math.max(1, Math.min(10, playCreativity)),
      overallDevelopment: Math.max(1, Math.min(10, overallDevelopment))
    };

    console.log('🧮 Python 알고리즘 점수 계산 완료 (1-10 범위):', {
      individual: {
        proximity: proximityScore,
        movement: movementScore,
        faceOrientation: faceScore,
        languageFreq: languageFrequencyScore,
        languageQuality: languageQualityScore,
        playDiversity: playDiversityScore,
        attention: attentionScore,
        conflict: conflictScore
      },
      totals: result
    });

    return result;
  }

  /**
   * 발달 인사이트 생성
   */
  private generateDevelopmentInsights(
    physical: PhysicalInteractionResult,
    language: LanguageInteractionResult,
    emotional: EmotionalInteractionResult,
    play: PlayPatternResult,
    scores: {
      physicalEngagement: number;
      communicationQuality: number;
      emotionalConnection: number;
      playCreativity: number;
      overallDevelopment: number;
    }
  ): {
    strengths: string[];
    areasForImprovement: string[];
    recommendations: string[];
    developmentStage: string;
  } {
    const strengths: string[] = [];
    const areasForImprovement: string[] = [];
    const recommendations: string[] = [];

    // 강점 분석
    if (scores.physicalEngagement > 0.7) {
      strengths.push('우수한 신체적 상호작용과 움직임 동기화');
    }
    if (scores.communicationQuality > 0.7) {
      strengths.push('활발한 언어적 상호작용과 대화 패턴');
    }
    if (scores.emotionalConnection > 0.7) {
      strengths.push('깊은 감정적 연결과 공감적 반응');
    }
    if (scores.playCreativity > 0.7) {
      strengths.push('창의적이고 다양한 놀이 패턴');
    }

    // 개선 영역 분석
    if (scores.physicalEngagement < 0.5) {
      areasForImprovement.push('신체적 상호작용 및 근접성 향상 필요');
      recommendations.push('함께 하는 신체 활동이나 접촉 놀이 늘리기');
    }
    if (scores.communicationQuality < 0.5) {
      areasForImprovement.push('언어적 상호작용 개선 필요');
      recommendations.push('대화를 유도하는 질문과 반응 늘리기');
    }
    if (scores.emotionalConnection < 0.5) {
      areasForImprovement.push('감정적 연결 강화 필요');
      recommendations.push('아이의 감정에 더 민감하게 반응하고 공감하기');
    }
    if (scores.playCreativity < 0.5) {
      areasForImprovement.push('놀이의 창의성과 다양성 향상 필요');
      recommendations.push('새로운 놀이 방법을 제안하고 아이의 상상력 격려하기');
    }

    // 발달 단계 평가
    const developmentStage = this.assessDevelopmentStage(scores);

    return {
      strengths,
      areasForImprovement,
      recommendations,
      developmentStage
    };
  }

  /**
   * 상세 리포트 생성 (Python REPORT_GENERATION_PROMPT 구조 반영)
   */
  private generateDetailedReport(
    physical: PhysicalInteractionResult,
    language: LanguageInteractionResult,
    emotional: EmotionalInteractionResult,
    play: PlayPatternResult,
    scores: {
      physicalEngagement: number;
      communicationQuality: number;
      emotionalConnection: number;
      playCreativity: number;
      overallDevelopment: number;
    },
    insights: {
      strengths: string[];
      areasForImprovement: string[];
      recommendations: string[];
      developmentStage: string;
    }
  ): {
    executiveSummary: string;
    comprehensiveScores: {
      physicalEngagement: { score: number; description: string };
      communicationQuality: { score: number; description: string };
      emotionalConnection: { score: number; description: string };
      playCreativity: { score: number; description: string };
      overallDevelopment: { score: number; description: string };
    };
    strengths: string[];
    developmentalAssessment: {
      physicalDevelopment: string;
      languageDevelopment: string;
      emotionalDevelopment: string;
      playDevelopment: string;
    };
    improvementRecommendations: string[];
    additionalObservationPoints: string[];
    interactionQuality: 'excellent' | 'good' | 'fair' | 'needs_improvement';
  } {
    // 1. 종합 점수 (각 영역별 1-10점) - Python 구조
    const comprehensiveScores = {
      physicalEngagement: {
        score: scores.physicalEngagement,
        description: this.getScoreDescription(scores.physicalEngagement, 'physical')
      },
      communicationQuality: {
        score: scores.communicationQuality,
        description: this.getScoreDescription(scores.communicationQuality, 'communication')
      },
      emotionalConnection: {
        score: scores.emotionalConnection,
        description: this.getScoreDescription(scores.emotionalConnection, 'emotional')
      },
      playCreativity: {
        score: scores.playCreativity,
        description: this.getScoreDescription(scores.playCreativity, 'play')
      },
      overallDevelopment: {
        score: scores.overallDevelopment,
        description: this.getScoreDescription(scores.overallDevelopment, 'overall')
      }
    };

    // 전체 상호작용 품질 평가 (1-10 범위로 수정)
    const overallScore = scores.overallDevelopment;
    let interactionQuality: 'excellent' | 'good' | 'fair' | 'needs_improvement';
    
    if (overallScore >= 8) {
      interactionQuality = 'excellent';
    } else if (overallScore >= 6) {
      interactionQuality = 'good';
    } else if (overallScore >= 4) {
      interactionQuality = 'fair';
    } else {
      interactionQuality = 'needs_improvement';
    }

    // 2. 강점 (구체적 관찰 사례 포함)
    const strengths = [
      ...insights.strengths,
      ...this.generateSpecificObservations(physical, language, emotional, play)
    ];

    // 3. 발달 영역별 평가
    const developmentalAssessment = {
      physicalDevelopment: this.assessPhysicalDevelopment(physical, scores.physicalEngagement),
      languageDevelopment: this.assessLanguageDevelopment(language, scores.communicationQuality),
      emotionalDevelopment: this.assessEmotionalDevelopment(emotional, scores.emotionalConnection),
      playDevelopment: this.assessPlayDevelopment(play, scores.playCreativity)
    };

    // 4. 개선 권장사항 (실행 가능한 3-5개)
    const improvementRecommendations = [
      ...insights.recommendations.slice(0, 5), // 최대 5개로 제한
      ...this.generateActionableRecommendations(scores)
    ].slice(0, 5);

    // 5. 추가 관찰 포인트
    const additionalObservationPoints = this.generateObservationPoints(scores, insights);

    // 요약 생성 (1-10 점수 반영)
    const executiveSummary = `
      이번 놀이 세션에서 전반적인 상호작용 품질은 ${this.getQualityDescription(interactionQuality)}입니다.
      물리적 참여도 ${scores.physicalEngagement}/10점, 
      의사소통 품질 ${scores.communicationQuality}/10점, 
      감정적 연결 ${scores.emotionalConnection}/10점, 
      놀이 창의성 ${scores.playCreativity}/10점, 
      전체 발달 지수 ${scores.overallDevelopment}/10점으로 평가되었습니다.
      
      ${insights.developmentStage}에 해당하는 발달 수준을 보여주고 있습니다.
    `.trim();

    return {
      executiveSummary,
      comprehensiveScores,
      strengths,
      developmentalAssessment,
      improvementRecommendations,
      additionalObservationPoints,
      interactionQuality
    };
  }

  /**
   * 데이터 변환: 얼굴 데이터 (안전한 접근)
   */
  private convertToFaceData(faceDetectionData: unknown[]): FaceData[] {
    if (!faceDetectionData || !Array.isArray(faceDetectionData)) {
      return [];
    }

    try {
      return faceDetectionData.map((frame: any) => ({
        time: this.parseTimeOffset(frame?.timeOffset),
        faces: frame?.faces || []
      }));
    } catch (error) {
      console.warn('⚠️ 얼굴 데이터 변환 오류:', error);
      return [];
    }
  }

  /**
   * 데이터 변환: 객체 트래킹 (안전한 접근)
   */
  private convertToObjectTracks(objectTrackingData: unknown[]): ObjectTrack[] {
    if (!objectTrackingData || !Array.isArray(objectTrackingData)) {
      return [];
    }

    const tracks: ObjectTrack[] = [];
    
    try {
      for (const track of objectTrackingData) {
        const trackData = track as any;
        if (trackData?.tracks) {
          for (const trackInfo of trackData.tracks) {
            for (const timestampedObject of trackInfo?.timestampedObjects || []) {
              tracks.push({
                entityId: trackInfo?.entity?.entityId || 'unknown',
                category: trackInfo?.entity?.category || 'unknown',
                time: this.parseTimeOffset(timestampedObject?.timeOffset),
                confidence: timestampedObject?.confidence || 0,
                boundingBox: timestampedObject?.normalizedBoundingBox || {
                  left: 0, top: 0, right: 1, bottom: 1
                },
                attributes: timestampedObject?.attributes || []
              });
            }
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ 객체 트래킹 데이터 변환 오류:', error);
    }

    return tracks;
  }

  /**
   * 시간 오프셋 파싱 (안전한 접근)
   */
  private parseTimeOffset(timeOffset: any): number {
    if (!timeOffset) {return 0;}
    
    try {
      // 숫자인 경우
      if (typeof timeOffset === 'number') {
        return timeOffset;
      }
      
      // 객체인 경우 (Google Cloud API 형식)
      if (typeof timeOffset === 'object') {
        const seconds = parseInt(timeOffset.seconds || '0');
        const nanos = parseInt(timeOffset.nanos || '0');
        return seconds + nanos / 1000000000;
      }
      
      // 문자열인 경우
      if (typeof timeOffset === 'string') {
        const match = timeOffset.match(/^(\d+(?:\.\d+)?)s?$/);
        return match ? parseFloat(match[1]) : 0;
      }
      
      return 0;
    } catch (error) {
      console.warn('⚠️ 시간 오프셋 파싱 오류:', error);
      return 0;
    }
  }

  /**
   * 발달 단계 평가
   */
  private assessDevelopmentStage(scores: {
    physicalEngagement: number;
    communicationQuality: number;
    emotionalConnection: number;
    playCreativity: number;
    overallDevelopment: number;
  }): string {
    const avgScore = scores.overallDevelopment;
    
    if (avgScore >= 0.8) {
      return '우수한 발달 단계';
    } else if (avgScore >= 0.6) {
      return '양호한 발달 단계';
    } else if (avgScore >= 0.4) {
      return '평균적 발달 단계';
    } else {
      return '발달 지원 필요';
    }
  }

  /**
   * 품질 설명 생성
   */
  private getQualityDescription(quality: string): string {
    switch (quality) {
      case 'excellent': return '매우 우수';
      case 'good': return '양호';
      case 'fair': return '보통';
      case 'needs_improvement': return '개선 필요';
      default: return '평가 불가';
    }
  }

  /**
   * 점수 설명 생성 (1-10 점수 기반)
   */
  private getScoreDescription(score: number, category: string): string {
    const level = score >= 8 ? 'excellent' : score >= 6 ? 'good' : score >= 4 ? 'fair' : 'needs_improvement';
    
    const descriptions = {
      physical: {
        excellent: '매우 활발한 신체적 상호작용과 우수한 움직임 동기화',
        good: '양호한 신체적 참여와 적절한 근접성',
        fair: '보통 수준의 신체적 상호작용',
        needs_improvement: '신체적 상호작용 향상 필요'
      },
      communication: {
        excellent: '매우 풍부하고 질 높은 언어적 상호작용',
        good: '활발하고 의미 있는 대화 패턴',
        fair: '기본적인 의사소통 수준',
        needs_improvement: '언어적 상호작용 증진 필요'
      },
      emotional: {
        excellent: '깊은 감정적 연결과 높은 공감적 반응',
        good: '안정적인 감정적 유대감',
        fair: '기본적인 감정적 연결',
        needs_improvement: '감정적 연결 강화 필요'
      },
      play: {
        excellent: '매우 창의적이고 다양한 놀이 패턴',
        good: '창의적인 놀이 접근',
        fair: '일반적인 놀이 수준',
        needs_improvement: '놀이 창의성 향상 필요'
      },
      overall: {
        excellent: '전반적으로 우수한 발달 수준',
        good: '양호한 전반적 발달',
        fair: '평균적인 발달 수준',
        needs_improvement: '전반적 발달 지원 필요'
      }
    };

    return descriptions[category as keyof typeof descriptions][level];
  }

  /**
   * 구체적 관찰 사례 생성
   */
  private generateSpecificObservations(
    physical: PhysicalInteractionResult,
    language: LanguageInteractionResult,
    emotional: EmotionalInteractionResult,
    play: PlayPatternResult
  ): string[] {
    const observations: string[] = [];

    // 물리적 관찰
    if (physical?.proximityAnalysis?.proximityScore > 0.7) {
      observations.push('지속적인 근거리 상호작용으로 친밀감 형성');
    }

    // 언어적 관찰
    const turnCount = language?.conversationPatterns?.turnTaking?.turnCount || 
                     language?.conversationPatterns?.turnCount || 0;
    if (turnCount > 30) {
      observations.push(`${turnCount}회의 활발한 대화 교환으로 풍부한 언어적 상호작용`);
    }

    // 감정적 관찰
    if (emotional?.emotionalSynchrony && emotional.emotionalSynchrony > 0.6) {
      observations.push('높은 감정적 동기화로 서로의 감정에 민감한 반응');
    }

    // 놀이 관찰
    if (play?.creativityIndicators?.noveltyScore > 0.8) {
      observations.push('새로운 놀이 아이디어 창출과 창의적 문제 해결');
    }

    return observations;
  }

  /**
   * 발달 영역별 평가 메서드들
   */
  private assessPhysicalDevelopment(physical: PhysicalInteractionResult, score: number): string {
    if (score >= 8) {
      return '대근육 및 소근육 발달이 우수하며, 공간 인식과 신체 협응력이 뛰어납니다.';
    } else if (score >= 6) {
      return '연령에 적합한 신체 발달을 보이며, 기본적인 운동 능력이 양호합니다.';
    } else if (score >= 4) {
      return '평균적인 신체 발달 수준으로, 지속적인 신체 활동이 필요합니다.';
    } else {
      return '신체 발달 지원이 필요하며, 전문적인 운동 프로그램 참여를 권장합니다.';
    }
  }

  private assessLanguageDevelopment(language: LanguageInteractionResult, score: number): string {
    if (score >= 8) {
      return '언어 표현력과 이해력이 뛰어나며, 복잡한 의사소통이 가능합니다.';
    } else if (score >= 6) {
      return '연령에 적합한 언어 발달을 보이며, 기본적인 의사소통 능력이 양호합니다.';
    } else if (score >= 4) {
      return '평균적인 언어 발달 수준으로, 더 많은 언어적 자극이 필요합니다.';
    } else {
      return '언어 발달 지원이 필요하며, 전문적인 언어 치료 상담을 권장합니다.';
    }
  }

  private assessEmotionalDevelopment(emotional: EmotionalInteractionResult, score: number): string {
    if (score >= 8) {
      return '감정 조절 능력이 뛰어나며, 타인의 감정에 대한 공감 능력이 우수합니다.';
    } else if (score >= 6) {
      return '연령에 적합한 감정 발달을 보이며, 기본적인 감정 표현이 양호합니다.';
    } else if (score >= 4) {
      return '평균적인 감정 발달 수준으로, 감정 표현 연습이 필요합니다.';
    } else {
      return '감정 발달 지원이 필요하며, 전문적인 상담이 도움이 될 것입니다.';
    }
  }

  private assessPlayDevelopment(play: PlayPatternResult, score: number): string {
    if (score >= 8) {
      return '놀이를 통한 학습 능력이 뛰어나며, 창의적이고 상상력 있는 놀이를 즐깁니다.';
    } else if (score >= 6) {
      return '연령에 적합한 놀이 발달을 보이며, 다양한 놀이 활동에 참여합니다.';
    } else if (score >= 4) {
      return '평균적인 놀이 발달 수준으로, 더 다양한 놀이 경험이 필요합니다.';
    } else {
      return '놀이 발달 지원이 필요하며, 구조화된 놀이 프로그램이 도움이 될 것입니다.';
    }
  }

  /**
   * 실행 가능한 권장사항 생성
   */
  private generateActionableRecommendations(scores: {
    physicalEngagement: number;
    communicationQuality: number;
    emotionalConnection: number;
    playCreativity: number;
    overallDevelopment: number;
  }): string[] {
    const recommendations: string[] = [];

    if (scores.physicalEngagement < 6) {
      recommendations.push('매일 30분 이상 함께하는 신체 활동 시간 확보');
    }

    if (scores.communicationQuality < 6) {
      recommendations.push('하루 20분 이상 일대일 대화 시간 만들기');
    }

    if (scores.emotionalConnection < 6) {
      recommendations.push('감정 표현 놀이와 공감 활동 늘리기');
    }

    if (scores.playCreativity < 6) {
      recommendations.push('창의적 놀이 도구와 새로운 놀이 환경 제공');
    }

    return recommendations;
  }

  /**
   * 추가 관찰 포인트 생성
   */
  private generateObservationPoints(scores: any, insights: any): string[] {
    return [
      '다양한 상황에서의 상호작용 패턴 관찰',
      '스트레스 상황에서의 반응 양상 주의 깊게 관찰',
      '또래 관계에서의 사회적 기술 발달 상태 확인',
      '집중력과 주의력 지속 시간 변화 추적',
      '새로운 환경에서의 적응력과 탐색 행동 관찰'
    ];
  }
} 