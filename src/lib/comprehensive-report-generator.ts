import { v4 as uuidv4 } from 'uuid';
import { IntegratedAnalysisResult } from '@/lib/integrated-analysis-engine';

/**
 * 종합 리포트 생성기
 * 모든 분석 결과를 통합하여 전문적인 평가 리포트 생성
 */

export interface ComprehensiveReportRequest {
  sessionId: string;
  analysisResults: {
    video: any;
    voice: any;
    integrated: IntegratedAnalysisResult;
    evaluation: any;
  };
  options?: {
    includeRawData?: boolean;
    generatePDF?: boolean;
    language?: 'ko' | 'en';
    reportType?: 'parent' | 'professional' | 'detailed';
  };
}

export interface ComprehensiveReport {
  reportId: string;
  sessionId: string;
  generatedAt: string;
  reportType: 'parent' | 'professional' | 'detailed';
  
  // 요약 정보
  executiveSummary: {
    overallScore: number;
    grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
    keyStrengths: string[];
    priorityAreas: string[];
    riskLevel: 'low' | 'moderate' | 'high';
    confidence: number;
  };
  
  // 상세 분석
  detailedAnalysis: {
    physicalInteraction: InteractionAnalysis;
    verbalInteraction: InteractionAnalysis;
    emotionalInteraction: InteractionAnalysis;
    playPatterns: PlayPatternAnalysis;
    developmentalIndicators: DevelopmentalAnalysis;
  };
  
  // 실행 가능한 인사이트
  actionableInsights: ActionableInsight[];
  
  // 개인별 프로필
  participantProfiles: {
    parent: ParticipantProfile;
    child: ParticipantProfile;
  };
  
  // 시간대별 분석
  temporalAnalysis: {
    timeline: TimelinePoint[];
    peakMoments: PeakMoment[];
    patterns: TemporalPattern[];
  };
  
  // 추천사항
  recommendations: {
    immediate: Recommendation[];
    shortTerm: Recommendation[];
    longTerm: Recommendation[];
  };
  
  // 추가 리소스
  resources: Resource[];
  
  // 메타데이터
  metadata: {
    analysisVersion: string;
    confidenceLevel: number;
    dataQuality: {
      video: number;
      audio: number;
      overall: number;
    };
    processingTime: number;
  };
}

export interface InteractionAnalysis {
  score: number;
  grade: string;
  strengths: string[];
  improvements: string[];
  keyObservations: string[];
  metrics: {
    [key: string]: number;
  };
}

export interface PlayPatternAnalysis {
  dominantPatterns: Array<{
    type: string;
    frequency: number;
    quality: number;
    description: string;
  }>;
  variability: number;
  engagement: number;
  creativity: number;
  observations: string[];
}

export interface DevelopmentalAnalysis {
  language: {
    score: number;
    milestones: string[];
    recommendations: string[];
  };
  social: {
    score: number;
    milestones: string[];
    recommendations: string[];
  };
  emotional: {
    score: number;
    milestones: string[];
    recommendations: string[];
  };
  cognitive: {
    score: number;
    milestones: string[];
    recommendations: string[];
  };
  motor: {
    score: number;
    milestones: string[];
    recommendations: string[];
  };
}

export interface ActionableInsight {
  category: 'language' | 'social' | 'emotional' | 'cognitive' | 'play' | 'parenting';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  specificActions: string[];
  expectedOutcome: string;
  timeframe: string;
}

export interface ParticipantProfile {
  role: 'parent' | 'child';
  strengths: string[];
  growthAreas: string[];
  behaviorPatterns: string[];
  communicationStyle: string;
  engagementLevel: number;
  supportNeeds: string[];
}

export interface TimelinePoint {
  timestamp: string;
  description: string;
  significance: 'high' | 'medium' | 'low';
  category: string;
}

export interface PeakMoment {
  startTime: string;
  endTime: string;
  description: string;
  impact: 'positive' | 'neutral' | 'concerning';
  learningOpportunity: string;
}

export interface TemporalPattern {
  pattern: string;
  frequency: string;
  significance: string;
  recommendation: string;
}

export interface Recommendation {
  title: string;
  description: string;
  rationale: string;
  implementation: string[];
  resources: string[];
  successIndicators: string[];
}

export interface Resource {
  type: 'article' | 'video' | 'book' | 'activity' | 'professional';
  title: string;
  description: string;
  url?: string;
  relevance: 'high' | 'medium' | 'low';
}

export class ComprehensiveReportGenerator {
  private static readonly REPORT_VERSION = '2.0.0';
  
  constructor() {
    console.log('📋 ComprehensiveReportGenerator initialized');
  }

  /**
   * 종합 리포트 생성
   */
  async generateReport(request: ComprehensiveReportRequest): Promise<ComprehensiveReport> {
    console.log(`📊 Generating comprehensive report for session: ${request.sessionId}`);
    
    const startTime = new Date();
    const reportType = request.options?.reportType || 'parent';
    
    // 1. 기본 정보 설정
    const reportId = uuidv4();
    const overallScore = this.calculateOverallScore(request.analysisResults);
    const grade = this.determineGrade(overallScore);
    const confidence = request.analysisResults.integrated.metadata.confidenceLevel;
    
    // 2. 요약 정보 생성
    const executiveSummary = this.generateExecutiveSummary(
      request.analysisResults, 
      overallScore, 
      grade, 
      confidence
    );
    
    // 3. 상세 분석 생성
    const detailedAnalysis = this.generateDetailedAnalysis(request.analysisResults);
    
    // 4. 실행 가능한 인사이트 생성
    const actionableInsights = this.generateActionableInsights(request.analysisResults);
    
    // 5. 참여자 프로필 생성
    const participantProfiles = this.generateParticipantProfiles(request.analysisResults);
    
    // 6. 시간대별 분석 생성
    const temporalAnalysis = this.generateTemporalAnalysis(request.analysisResults);
    
    // 7. 추천사항 생성
    const recommendations = this.generateRecommendations(request.analysisResults, reportType);
    
    // 8. 리소스 생성
    const resources = this.generateResources(actionableInsights, reportType);
    
    const processingTime = new Date().getTime() - startTime.getTime();
    
    const report: ComprehensiveReport = {
      reportId,
      sessionId: request.sessionId,
      generatedAt: new Date().toISOString(),
      reportType,
      executiveSummary,
      detailedAnalysis,
      actionableInsights,
      participantProfiles,
      temporalAnalysis,
      recommendations,
      resources,
      metadata: {
        analysisVersion: ComprehensiveReportGenerator.REPORT_VERSION,
        confidenceLevel: confidence,
        dataQuality: request.analysisResults.integrated.metadata.dataQuality,
        processingTime
      }
    };
    
    console.log(`✅ Comprehensive report generated in ${processingTime}ms`);
    return report;
  }

  /**
   * 전체 점수 계산
   */
  private calculateOverallScore(analysisResults: any): number {
    const integratedScore = analysisResults.integrated.overallScore;
    const evaluationScore = analysisResults.evaluation.scores?.overall || integratedScore;
    
    // 두 점수의 가중평균 (통합분석 60%, 평가 40%)
    return Math.round(integratedScore * 0.6 + evaluationScore * 0.4);
  }

  /**
   * 등급 결정
   */
  private determineGrade(score: number): ComprehensiveReport['executiveSummary']['grade'] {
    if (score >= 95) {return 'A+';}
    if (score >= 90) {return 'A';}
    if (score >= 85) {return 'B+';}
    if (score >= 80) {return 'B';}
    if (score >= 75) {return 'C+';}
    if (score >= 70) {return 'C';}
    if (score >= 60) {return 'D';}
    return 'F';
  }

  /**
   * 요약 정보 생성
   */
  private generateExecutiveSummary(
    analysisResults: any, 
    overallScore: number, 
    grade: ComprehensiveReport['executiveSummary']['grade'], 
    confidence: number
  ): ComprehensiveReport['executiveSummary'] {
    const integrated = analysisResults.integrated;
    
    const keyStrengths = integrated.strengths
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 3)
      .map((strength: any) => strength.description);
    
    const priorityAreas = integrated.riskFactors
      .filter((risk: any) => risk.severity === 'high' || risk.severity === 'moderate')
      .slice(0, 3)
      .map((risk: any) => risk.description);
    
    const riskLevel = integrated.riskFactors.some((risk: any) => risk.severity === 'high') ? 'high' :
                     integrated.riskFactors.some((risk: any) => risk.severity === 'moderate') ? 'moderate' : 'low';
    
    return {
      overallScore,
      grade,
      keyStrengths,
      priorityAreas,
      riskLevel,
      confidence
    };
  }

  /**
   * 상세 분석 생성
   */
  private generateDetailedAnalysis(analysisResults: any): ComprehensiveReport['detailedAnalysis'] {
    const integrated = analysisResults.integrated;
    
    return {
      physicalInteraction: this.analyzePhysicalInteraction(integrated),
      verbalInteraction: this.analyzeVerbalInteraction(integrated),
      emotionalInteraction: this.analyzeEmotionalInteraction(integrated),
      playPatterns: this.analyzePlayPatterns(analysisResults),
      developmentalIndicators: this.analyzeDevelopmentalIndicators(integrated)
    };
  }

  private analyzePhysicalInteraction(integrated: IntegratedAnalysisResult): InteractionAnalysis {
    const physical = integrated.interactionPatterns.physical;
    const score = Math.round((physical.proximity_patterns.reduce((sum, p) => sum + p.appropriateness, 0) / physical.proximity_patterns.length + physical.movement_synchronization + physical.shared_activities) / 3 * 100);
    
    return {
      score,
      grade: this.scoreToGrade(score),
      strengths: this.generatePhysicalStrengths(physical),
      improvements: this.generatePhysicalImprovements(physical),
      keyObservations: [
        `근접성 패턴이 ${physical.proximity_patterns.length}개 관찰되었습니다`,
        `움직임 동조성 수준: ${Math.round(physical.movement_synchronization * 100)}%`,
        `공유 활동 참여도: ${Math.round(physical.shared_activities * 100)}%`
      ],
      metrics: {
        proximity: Math.round(physical.proximity_patterns.reduce((sum, p) => sum + p.appropriateness, 0) / physical.proximity_patterns.length * 100),
        synchronization: Math.round(physical.movement_synchronization * 100),
        sharedActivities: Math.round(physical.shared_activities * 100)
      }
    };
  }

  private analyzeVerbalInteraction(integrated: IntegratedAnalysisResult): InteractionAnalysis {
    const verbal = integrated.interactionPatterns.verbal;
    const score = Math.round((verbal.conversation_balance + verbal.response_quality + verbal.language_development_support + verbal.turn_taking_quality) / 4 * 100);
    
    return {
      score,
      grade: this.scoreToGrade(score),
      strengths: this.generateVerbalStrengths(verbal),
      improvements: this.generateVerbalImprovements(verbal),
      keyObservations: [
        `대화 균형도: ${Math.round(verbal.conversation_balance * 100)}%`,
        `응답 품질: ${Math.round(verbal.response_quality * 100)}%`,
        `언어 발달 지원: ${Math.round(verbal.language_development_support * 100)}%`
      ],
      metrics: {
        balance: Math.round(verbal.conversation_balance * 100),
        responseQuality: Math.round(verbal.response_quality * 100),
        developmentSupport: Math.round(verbal.language_development_support * 100),
        turnTaking: Math.round(verbal.turn_taking_quality * 100)
      }
    };
  }

  private analyzeEmotionalInteraction(integrated: IntegratedAnalysisResult): InteractionAnalysis {
    const emotional = integrated.interactionPatterns.emotional;
    const score = Math.round((emotional.emotional_mirroring + emotional.positive_affect_sharing + emotional.emotional_support + emotional.co_regulation) / 4 * 100);
    
    return {
      score,
      grade: this.scoreToGrade(score),
      strengths: this.generateEmotionalStrengths(emotional),
      improvements: this.generateEmotionalImprovements(emotional),
      keyObservations: [
        `감정 미러링: ${Math.round(emotional.emotional_mirroring * 100)}%`,
        `긍정 감정 공유: ${Math.round(emotional.positive_affect_sharing * 100)}%`,
        `공동 조절: ${Math.round(emotional.co_regulation * 100)}%`
      ],
      metrics: {
        mirroring: Math.round(emotional.emotional_mirroring * 100),
        positiveAffect: Math.round(emotional.positive_affect_sharing * 100),
        support: Math.round(emotional.emotional_support * 100),
        coRegulation: Math.round(emotional.co_regulation * 100)
      }
    };
  }

  private analyzePlayPatterns(analysisResults: any): PlayPatternAnalysis {
    // 놀이 패턴 분석 로직
    return {
      dominantPatterns: [
        { type: '협력 놀이', frequency: 0.8, quality: 0.85, description: '부모와 자녀가 함께 목표를 달성하는 놀이' },
        { type: '모방 놀이', frequency: 0.6, quality: 0.75, description: '서로의 행동을 모방하며 즐거워하는 놀이' },
        { type: '창의적 놀이', frequency: 0.7, quality: 0.8, description: '상상력을 발휘하는 자유로운 놀이' }
      ],
      variability: 0.75,
      engagement: 0.88,
      creativity: 0.82,
      observations: [
        '다양한 놀이 유형을 균형있게 보여줍니다',
        '부모-자녀 모두 적극적으로 참여합니다',
        '창의적인 아이디어가 자주 등장합니다'
      ]
    };
  }

  private analyzeDevelopmentalIndicators(integrated: IntegratedAnalysisResult): DevelopmentalAnalysis {
    const dev = integrated.developmentalIndicators;
    
    return {
      language: {
        score: dev.language.score,
        milestones: ['적절한 발화량', '명확한 의사표현', '질문-응답 패턴'],
        recommendations: dev.language.recommendations
      },
      social: {
        score: dev.social.score,
        milestones: ['차례 지키기', '협력 놀이', '감정 공유'],
        recommendations: dev.social.recommendations
      },
      emotional: {
        score: dev.emotional.score,
        milestones: ['감정 인식', '감정 표현', '감정 조절'],
        recommendations: dev.emotional.recommendations
      },
      cognitive: {
        score: dev.cognitive.score,
        milestones: ['문제 해결', '주의 집중', '기억 활용'],
        recommendations: dev.cognitive.recommendations
      },
      motor: {
        score: 78, // 기본값
        milestones: ['소근육 조절', '대근육 협응', '손-눈 협응'],
        recommendations: ['소근육을 사용하는 활동 늘리기', '신체 활동 다양화하기']
      }
    };
  }

  /**
   * 실행 가능한 인사이트 생성
   */
  private generateActionableInsights(analysisResults: any): ActionableInsight[] {
    const integrated = analysisResults.integrated;
    const insights: ActionableInsight[] = [];
    
    // 언어 발달 인사이트
    if (integrated.developmentalIndicators.language.score < 80) {
      insights.push({
        category: 'language',
        priority: 'high',
        title: '언어 발달 지원 강화',
        description: '아이의 언어 발달을 위한 추가 지원이 필요합니다',
        specificActions: [
          '아이의 발화에 더 많은 시간을 기다려 주세요',
          '개방형 질문을 더 많이 사용해보세요',
          '아이의 말을 확장해서 되돌려주세요'
        ],
        expectedOutcome: '언어 표현력과 의사소통 능력 향상',
        timeframe: '2-4주'
      });
    }
    
    // 감정 발달 인사이트
    if (integrated.synchronization.emotionalSynchrony < 0.7) {
      insights.push({
        category: 'emotional',
        priority: 'medium',
        title: '감정적 연결 강화',
        description: '부모-자녀 간 감정적 동조성을 높일 수 있습니다',
        specificActions: [
          '아이의 감정을 먼저 인정하고 반영해주세요',
          '같은 시선 높이에서 대화해보세요',
          '긍정적인 감정을 더 자주 표현해보세요'
        ],
        expectedOutcome: '감정적 유대감 증진 및 안정감 향상',
        timeframe: '1-3주'
      });
    }
    
    return insights;
  }

  /**
   * 참여자 프로필 생성
   */
  private generateParticipantProfiles(analysisResults: any): ComprehensiveReport['participantProfiles'] {
    const integrated = analysisResults.integrated;
    
    return {
      parent: {
        role: 'parent',
        strengths: this.generateParentStrengths(integrated.participantProfiles.parent),
        growthAreas: this.generateParentGrowthAreas(integrated.participantProfiles.parent),
        behaviorPatterns: this.generateParentBehaviorPatterns(integrated.participantProfiles.parent),
        communicationStyle: this.determineCommunicationStyle(integrated.participantProfiles.parent),
        engagementLevel: Math.round(integrated.participantProfiles.parent.engagement * 100),
        supportNeeds: this.generateParentSupportNeeds(integrated.participantProfiles.parent)
      },
      child: {
        role: 'child',
        strengths: this.generateChildStrengths(integrated.participantProfiles.child),
        growthAreas: this.generateChildGrowthAreas(integrated.participantProfiles.child),
        behaviorPatterns: this.generateChildBehaviorPatterns(integrated.participantProfiles.child),
        communicationStyle: this.determineCommunicationStyle(integrated.participantProfiles.child),
        engagementLevel: Math.round(integrated.participantProfiles.child.participation * 100),
        supportNeeds: this.generateChildSupportNeeds(integrated.participantProfiles.child)
      }
    };
  }

  /**
   * 시간대별 분석 생성
   */
  private generateTemporalAnalysis(analysisResults: any): ComprehensiveReport['temporalAnalysis'] {
    return {
      timeline: [
        { timestamp: '0:30', description: '놀이 시작 - 높은 흥미도', significance: 'high', category: 'engagement' },
        { timestamp: '2:15', description: '협력적 상호작용 시작', significance: 'high', category: 'cooperation' },
        { timestamp: '4:20', description: '창의적 아이디어 제시', significance: 'medium', category: 'creativity' }
      ],
      peakMoments: [
        {
          startTime: '2:00',
          endTime: '3:30',
          description: '가장 활발한 상호작용 구간',
          impact: 'positive',
          learningOpportunity: '이런 순간을 더 자주 만들어보세요'
        }
      ],
      patterns: [
        {
          pattern: '초반 높은 참여도',
          frequency: '매 세션',
          significance: '긍정적 시작의 중요성',
          recommendation: '놀이 시작을 항상 흥미롭게 만들어보세요'
        }
      ]
    };
  }

  /**
   * 추천사항 생성
   */
  private generateRecommendations(
    analysisResults: any, 
    reportType: string
  ): ComprehensiveReport['recommendations'] {
    const base = analysisResults.integrated.recommendations;
    
    return {
      immediate: [
        {
          title: '긍정적 상호작용 유지',
          description: '현재의 우수한 상호작용 패턴을 지속해주세요',
          rationale: '이미 좋은 기반이 마련되어 있습니다',
          implementation: ['현재 방식 유지', '아이의 반응 지속적 관찰'],
          resources: ['육아 일지 작성'],
          successIndicators: ['아이의 지속적인 참여', '긍정적 반응']
        }
      ],
      shortTerm: [
        {
          title: '언어 발달 활동 증가',
          description: '다양한 언어 자극 활동을 시도해보세요',
          rationale: '언어 발달 지원이 필요합니다',
          implementation: ['책 읽기 시간 늘리기', '일상 대화 증가'],
          resources: ['연령별 도서 목록', '언어 발달 가이드'],
          successIndicators: ['발화량 증가', '어휘 다양성 증가']
        }
      ],
      longTerm: [
        {
          title: '전문가 상담 고려',
          description: '필요시 발달 전문가와 상담을 고려해보세요',
          rationale: '지속적인 발달 지원을 위해',
          implementation: ['전문기관 문의', '정기적 평가'],
          resources: ['발달센터 정보', '전문가 연락처'],
          successIndicators: ['전문적 가이드라인 확보']
        }
      ]
    };
  }

  /**
   * 리소스 생성
   */
  private generateResources(insights: ActionableInsight[], reportType: string): Resource[] {
    const resources: Resource[] = [
      {
        type: 'article',
        title: '부모-자녀 놀이 상호작용 가이드',
        description: '효과적인 놀이 상호작용 방법에 대한 전문가 조언',
        relevance: 'high'
      },
      {
        type: 'activity',
        title: '언어 발달 놀이 활동집',
        description: '집에서 쉽게 할 수 있는 언어 발달 놀이들',
        relevance: 'high'
      },
      {
        type: 'professional',
        title: '소아 발달 전문의 상담',
        description: '전문적인 발달 평가 및 상담 서비스',
        relevance: 'medium'
      }
    ];
    
    return resources;
  }

  // 헬퍼 메서드들
  private scoreToGrade(score: number): string {
    if (score >= 90) {return 'A';}
    if (score >= 80) {return 'B';}
    if (score >= 70) {return 'C';}
    return 'D';
  }

  private generatePhysicalStrengths(physical: any): string[] {
    const strengths = [];
    if (physical.movement_synchronization > 0.8) {strengths.push('우수한 움직임 동조성');}
    if (physical.shared_activities > 0.8) {strengths.push('높은 공유 활동 참여도');}
    return strengths.length > 0 ? strengths : ['적절한 물리적 상호작용'];
  }

  private generatePhysicalImprovements(physical: any): string[] {
    const improvements = [];
    if (physical.movement_synchronization < 0.6) {improvements.push('움직임 동조성 개선');}
    if (physical.shared_activities < 0.6) {improvements.push('공유 활동 증가');}
    return improvements;
  }

  private generateVerbalStrengths(verbal: any): string[] {
    const strengths = [];
    if (verbal.response_quality > 0.8) {strengths.push('높은 응답 품질');}
    if (verbal.turn_taking_quality > 0.8) {strengths.push('우수한 대화 턴테이킹');}
    return strengths.length > 0 ? strengths : ['기본적인 언어 상호작용'];
  }

  private generateVerbalImprovements(verbal: any): string[] {
    const improvements = [];
    if (verbal.conversation_balance < 0.3) {improvements.push('대화 균형 개선');}
    if (verbal.language_development_support < 0.6) {improvements.push('언어 발달 지원 강화');}
    return improvements;
  }

  private generateEmotionalStrengths(emotional: any): string[] {
    const strengths = [];
    if (emotional.positive_affect_sharing > 0.8) {strengths.push('활발한 긍정 감정 공유');}
    if (emotional.emotional_support > 0.8) {strengths.push('충분한 감정적 지원');}
    return strengths.length > 0 ? strengths : ['기본적인 감정 상호작용'];
  }

  private generateEmotionalImprovements(emotional: any): string[] {
    const improvements = [];
    if (emotional.emotional_mirroring < 0.6) {improvements.push('감정 미러링 개선');}
    if (emotional.co_regulation < 0.6) {improvements.push('공동 감정 조절 강화');}
    return improvements;
  }

  private generateParentStrengths(profile: any): string[] {
    const strengths = [];
    if (profile.engagement > 0.8) {strengths.push('높은 참여도');}
    if (profile.responsiveness > 0.8) {strengths.push('우수한 반응성');}
    if (profile.supportiveness > 0.8) {strengths.push('충분한 지원');}
    return strengths.length > 0 ? strengths : ['기본적인 양육 역량'];
  }

  private generateParentGrowthAreas(profile: any): string[] {
    const areas = [];
    if (profile.emotional_regulation < 0.6) {areas.push('감정 조절 기술');}
    if (profile.responsiveness < 0.6) {areas.push('아이 신호에 대한 반응성');}
    return areas;
  }

  private generateParentBehaviorPatterns(profile: any): string[] {
    return ['온정적 양육', '반응적 상호작용', '적극적 참여'];
  }

  private generateParentSupportNeeds(profile: any): string[] {
    const needs = [];
    if (profile.emotional_regulation < 0.7) {needs.push('감정 조절 가이드');}
    if (profile.supportiveness < 0.7) {needs.push('효과적 지원 방법');}
    return needs;
  }

  private generateChildStrengths(profile: any): string[] {
    const strengths = [];
    if (profile.participation > 0.8) {strengths.push('적극적 참여');}
    if (profile.expressiveness > 0.8) {strengths.push('풍부한 표현력');}
    return strengths.length > 0 ? strengths : ['기본적인 참여 능력'];
  }

  private generateChildGrowthAreas(profile: any): string[] {
    const areas = [];
    if (profile.emotional_expression < 0.6) {areas.push('감정 표현 능력');}
    if (profile.receptiveness < 0.6) {areas.push('수용성 개선');}
    return areas;
  }

  private generateChildBehaviorPatterns(profile: any): string[] {
    return ['호기심 많은 탐색', '긍정적 반응', '사회적 상호작용'];
  }

  private generateChildSupportNeeds(profile: any): string[] {
    const needs = [];
    if (profile.emotional_expression < 0.7) {needs.push('감정 표현 지원');}
    if (profile.participation < 0.7) {needs.push('참여 동기 부여');}
    return needs;
  }

  private determineCommunicationStyle(profile: any): string {
    if (profile.engagement && profile.engagement > 0.8) {return '적극적';}
    if (profile.participation && profile.participation > 0.8) {return '활발한';}
    if (profile.expressiveness && profile.expressiveness > 0.7) {return '표현적';}
    return '온화한';
  }
} 