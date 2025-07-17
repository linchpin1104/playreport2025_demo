import { NextRequest, NextResponse } from 'next/server';
import { VideoIntelligenceResults } from '@/types';
import { EnhancedSpeechAnalyzer } from '@/lib/enhanced-speech-analysis';
import { EnhancedEmotionAnalyzer } from '@/lib/emotion-analyzer';
import { BasicGestureDetector } from '@/lib/basic-gesture-detector';
import { isDevelopmentMode, logDevelopmentMode } from '@/lib/mock-data-loader';

// 통합 분석 결과 타입
export interface EnhancedAnalysisResult {
  speechAnalysis: any;
  emotionAnalysis: any;
  gestureAnalysis: any;
  integratedInsights: IntegratedInsights;
  analysisMetadata: AnalysisMetadata;
}

export interface IntegratedInsights {
  overallEngagement: number;
  communicationQuality: number;
  emotionalConnection: number;
  physicalInteraction: number;
  developmentalIndicators: {
    language: number;
    social: number;
    emotional: number;
    cognitive: number;
    physical: number;
  };
  parentingStyle: {
    responsiveness: number;
    warmth: number;
    structure: number;
    support: number;
  };
  childDevelopment: {
    expressiveness: number;
    regulation: number;
    socialSkills: number;
    creativity: number;
  };
  interactionPatterns: {
    synchrony: number;
    reciprocity: number;
    attunement: number;
    cooperation: number;
  };
}

export interface AnalysisMetadata {
  analysisVersion: string;
  processedAt: string;
  analysisModules: string[];
  confidenceScore: number;
  analysisDepth: 'basic' | 'enhanced' | 'comprehensive';
  processingTime: number;
}

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // 개발 모드 체크
    if (isDevelopmentMode()) {
      logDevelopmentMode('Enhanced Analysis API');
      
      // Mock 통합 분석 데이터
      const mockEnhancedAnalysis: EnhancedAnalysisResult = {
        speechAnalysis: {
          emotionalTone: {
            parent: {
              joy: 0.85,
              excitement: 0.72,
              patience: 0.88,
              stress: 0.15,
              confidence: 0.92,
              engagement: 0.87,
              emotionalStability: 0.89
            },
            child: {
              joy: 0.92,
              excitement: 0.88,
              patience: 0.65,
              stress: 0.12,
              confidence: 0.78,
              engagement: 0.90,
              emotionalStability: 0.82
            }
          },
          conversationMetrics: {
            turnTaking: {
              totalTurns: 45,
              averageTurnLength: 3.2,
              turnBalance: { parent: 0.58, child: 0.42 },
              waitTimes: [1.2, 0.8, 1.5, 0.9, 1.1],
              overlaps: 3,
              interruptions: 2
            },
            speechTiming: {
              totalSpeechTime: 180,
              parentSpeechTime: 105,
              childSpeechTime: 75,
              silenceRatio: 0.25,
              conversationRhythm: 0.78
            }
          }
        },
        emotionAnalysis: {
          overallEmotionalState: {
            parent: {
              primaryEmotions: {
                joy: 0.78,
                surprise: 0.15,
                neutral: 0.07,
                sadness: 0.0,
                anger: 0.0,
                fear: 0.0,
                disgust: 0.0
              },
              emotionalIntensity: 0.82,
              emotionalStability: 0.88
            },
            child: {
              primaryEmotions: {
                joy: 0.85,
                surprise: 0.10,
                neutral: 0.05,
                sadness: 0.0,
                anger: 0.0,
                fear: 0.0,
                disgust: 0.0
              },
              emotionalIntensity: 0.89,
              emotionalStability: 0.85
            }
          },
          emotionalInteraction: {
            emotionalSynchrony: 0.82,
            emotionalContagion: {
              parentToChild: 0.75,
              childToParent: 0.68,
              bidirectional: 0.72
            }
          }
        },
        gestureAnalysis: {
          detectedGestures: [
            {
              id: 'parent_pointing_15',
              type: 'pointing',
              person: 'parent',
              startTime: 15.2,
              endTime: 16.1,
              confidence: 0.87,
              intensity: 0.72,
              description: '부모가 무언가를 가리키고 있습니다'
            },
            {
              id: 'child_clapping_23',
              type: 'clapping',
              person: 'child',
              startTime: 23.5,
              endTime: 25.2,
              confidence: 0.92,
              intensity: 0.88,
              description: '아이가 박수를 치고 있습니다'
            },
            {
              id: 'interaction_hugging_45',
              type: 'hugging',
              person: 'both',
              startTime: 45.1,
              endTime: 47.8,
              confidence: 0.95,
              intensity: 0.92,
              description: '따뜻한 포옹을 나누고 있습니다'
            }
          ],
          gestureStatistics: {
            totalGestures: 28,
            gesturesByPerson: { parent: 15, child: 13 },
            averageGestureDuration: 2.3,
            gestureFrequency: 0.56,
            mostCommonGesture: 'pointing'
          },
          parentChildGestureSync: {
            synchronizedGestures: 8,
            mirroredGestures: 5,
            responseGestures: 12,
            gestureImitation: 6,
            syncScore: 0.75
          }
        },
        integratedInsights: {
          overallEngagement: 87.5,
          communicationQuality: 85.2,
          emotionalConnection: 89.1,
          physicalInteraction: 82.6,
          developmentalIndicators: {
            language: 84.3,
            social: 88.7,
            emotional: 86.9,
            cognitive: 82.1,
            physical: 79.5
          },
          parentingStyle: {
            responsiveness: 89.2,
            warmth: 91.5,
            structure: 78.3,
            support: 86.7
          },
          childDevelopment: {
            expressiveness: 87.4,
            regulation: 83.9,
            socialSkills: 85.8,
            creativity: 88.2
          },
          interactionPatterns: {
            synchrony: 82.5,
            reciprocity: 79.8,
            attunement: 86.3,
            cooperation: 84.1
          }
        },
        analysisMetadata: {
          analysisVersion: '1.0.0-phase1',
          processedAt: new Date().toISOString(),
          analysisModules: ['enhanced-speech', 'emotion-analyzer', 'basic-gesture'],
          confidenceScore: 0.856,
          analysisDepth: 'enhanced',
          processingTime: 2500
        }
      };
      
      // 실제 분석 시간 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      return NextResponse.json({
        success: true,
        analysis: mockEnhancedAnalysis
      });
    }

    const body = await request.json();
    const { videoIntelligenceResults } = body;

    if (!videoIntelligenceResults) {
      return NextResponse.json(
        { success: false, error: '비디오 분석 결과가 제공되지 않았습니다.' },
        { status: 400 }
      );
    }

    console.log('Starting enhanced analysis...');

    // 1. 고도화된 음성 분석
    const speechAnalyzer = new EnhancedSpeechAnalyzer();
    const speechAnalysis = await speechAnalyzer.analyzeEnhancedSpeech(
      videoIntelligenceResults.speechTranscription,
      { duration: 300 } // 5분 추정
    );

    // 2. 고도화된 감정 분석
    const emotionAnalyzer = new EnhancedEmotionAnalyzer();
    const emotionAnalysis = await emotionAnalyzer.analyzeEnhancedEmotions(
      videoIntelligenceResults,
      videoIntelligenceResults.speechTranscription
    );

    // 3. 기본 제스처 분석
    const gestureDetector = new BasicGestureDetector();
    const gestureAnalysis = await gestureDetector.analyzeBasicGestures(
      videoIntelligenceResults
    );

    // 4. 통합 인사이트 생성
    const integratedInsights = await generateIntegratedInsights(
      speechAnalysis,
      emotionAnalysis,
      gestureAnalysis,
      videoIntelligenceResults
    );

    // 5. 분석 메타데이터 생성
    const analysisMetadata = generateAnalysisMetadata(
      startTime,
      speechAnalysis,
      emotionAnalysis,
      gestureAnalysis
    );

    const enhancedAnalysisResult: EnhancedAnalysisResult = {
      speechAnalysis,
      emotionAnalysis,
      gestureAnalysis,
      integratedInsights,
      analysisMetadata
    };

    console.log('Enhanced analysis completed successfully');

    return NextResponse.json({
      success: true,
      analysis: enhancedAnalysisResult
    });

  } catch (error) {
    console.error('Enhanced analysis error:', error);
    return NextResponse.json(
      { success: false, error: '고도화된 분석 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 통합 인사이트 생성
 */
async function generateIntegratedInsights(
  speechAnalysis: any,
  emotionAnalysis: any,
  gestureAnalysis: any,
  videoData: VideoIntelligenceResults
): Promise<IntegratedInsights> {
  // 전체 참여도 계산
  const overallEngagement = calculateOverallEngagement(
    speechAnalysis,
    emotionAnalysis,
    gestureAnalysis
  );

  // 의사소통 품질 계산
  const communicationQuality = calculateCommunicationQuality(
    speechAnalysis,
    gestureAnalysis
  );

  // 감정적 연결 계산
  const emotionalConnection = calculateEmotionalConnection(
    emotionAnalysis,
    speechAnalysis
  );

  // 물리적 상호작용 계산
  const physicalInteraction = calculatePhysicalInteraction(
    gestureAnalysis,
    videoData
  );

  // 발달 지표 계산
  const developmentalIndicators = calculateDevelopmentalIndicators(
    speechAnalysis,
    emotionAnalysis,
    gestureAnalysis
  );

  // 부모 양육 스타일 분석
  const parentingStyle = analyzeParentingStyle(
    speechAnalysis,
    emotionAnalysis,
    gestureAnalysis
  );

  // 자녀 발달 상태 분석
  const childDevelopment = analyzeChildDevelopment(
    speechAnalysis,
    emotionAnalysis,
    gestureAnalysis
  );

  // 상호작용 패턴 분석
  const interactionPatterns = analyzeInteractionPatterns(
    speechAnalysis,
    emotionAnalysis,
    gestureAnalysis
  );

  return {
    overallEngagement,
    communicationQuality,
    emotionalConnection,
    physicalInteraction,
    developmentalIndicators,
    parentingStyle,
    childDevelopment,
    interactionPatterns
  };
}

/**
 * 전체 참여도 계산
 */
function calculateOverallEngagement(
  speechAnalysis: any,
  emotionAnalysis: any,
  gestureAnalysis: any
): number {
  const speechEngagement = speechAnalysis.emotionalTone?.parent?.engagement || 0;
  const childSpeechEngagement = speechAnalysis.emotionalTone?.child?.engagement || 0;
  const emotionalEngagement = emotionAnalysis.overallEmotionalState?.parent?.emotionalIntensity || 0;
  const gestureEngagement = gestureAnalysis.gestureStatistics?.gestureFrequency || 0;

  const avgSpeechEngagement = (speechEngagement + childSpeechEngagement) / 2;
  const normalizedGestureEngagement = Math.min(1, gestureEngagement / 2);

  return Math.round(
    (avgSpeechEngagement * 40 + 
     emotionalEngagement * 35 + 
     normalizedGestureEngagement * 25) * 100
  );
}

/**
 * 의사소통 품질 계산
 */
function calculateCommunicationQuality(
  speechAnalysis: any,
  gestureAnalysis: any
): number {
  const turnTaking = speechAnalysis.conversationMetrics?.turnTaking || {};
  const responsiveness = speechAnalysis.conversationMetrics?.responsePatterns?.mutualResponsiveness || 0;
  const gestureSync = gestureAnalysis.parentChildGestureSync?.syncScore || 0;

  const turnBalance = 1 - Math.abs((turnTaking.turnBalance?.parent || 0.5) - 0.5) * 2;
  const interruptionPenalty = Math.max(0, 1 - (turnTaking.interruptions || 0) * 0.1);

  return Math.round(
    (turnBalance * 30 + 
     responsiveness * 40 + 
     gestureSync * 20 + 
     interruptionPenalty * 10) * 100
  );
}

/**
 * 감정적 연결 계산
 */
function calculateEmotionalConnection(
  emotionAnalysis: any,
  speechAnalysis: any
): number {
  const emotionalSynchrony = emotionAnalysis.emotionalInteraction?.emotionalSynchrony || 0;
  const emotionalContagion = emotionAnalysis.emotionalInteraction?.emotionalContagion?.bidirectional || 0;
  const parentWarmth = speechAnalysis.emotionalTone?.parent?.joy || 0;
  const childResponsiveness = speechAnalysis.emotionalTone?.child?.engagement || 0;

  return Math.round(
    (emotionalSynchrony * 35 + 
     emotionalContagion * 30 + 
     parentWarmth * 20 + 
     childResponsiveness * 15) * 100
  );
}

/**
 * 물리적 상호작용 계산
 */
function calculatePhysicalInteraction(
  gestureAnalysis: any,
  videoData: VideoIntelligenceResults
): number {
  const totalGestures = gestureAnalysis.gestureStatistics?.totalGestures || 0;
  const syncScore = gestureAnalysis.parentChildGestureSync?.syncScore || 0;
  const interactionGestures = gestureAnalysis.interactionGestures?.length || 0;

  const gestureFrequency = Math.min(1, totalGestures / 30);
  const interactionFrequency = Math.min(1, interactionGestures / 10);

  return Math.round(
    (gestureFrequency * 40 + 
     syncScore * 35 + 
     interactionFrequency * 25) * 100
  );
}

/**
 * 발달 지표 계산
 */
function calculateDevelopmentalIndicators(
  speechAnalysis: any,
  emotionAnalysis: any,
  gestureAnalysis: any
): IntegratedInsights['developmentalIndicators'] {
  const languageScore = calculateLanguageScore(speechAnalysis);
  const socialScore = calculateSocialScore(speechAnalysis, gestureAnalysis);
  const emotionalScore = calculateEmotionalScore(emotionAnalysis);
  const cognitiveScore = calculateCognitiveScore(speechAnalysis, gestureAnalysis);
  const physicalScore = calculatePhysicalScore(gestureAnalysis);

  return {
    language: Math.round(languageScore * 100),
    social: Math.round(socialScore * 100),
    emotional: Math.round(emotionalScore * 100),
    cognitive: Math.round(cognitiveScore * 100),
    physical: Math.round(physicalScore * 100)
  };
}

/**
 * 언어 발달 점수 계산
 */
function calculateLanguageScore(speechAnalysis: any): number {
  const childLanguage = speechAnalysis.languageDevelopment?.child || {};
  const parentSupport = speechAnalysis.languageDevelopment?.parentSupport || {};

  const vocabularyScore = (childLanguage.vocabularyRange || 0) / 100;
  const complexityScore = (childLanguage.sentenceComplexity || 0) / 100;
  const supportScore = (parentSupport.languageModeling || 0) / 100;

  return (vocabularyScore * 0.4 + complexityScore * 0.3 + supportScore * 0.3);
}

/**
 * 사회성 발달 점수 계산
 */
function calculateSocialScore(speechAnalysis: any, gestureAnalysis: any): number {
  const conversationMetrics = speechAnalysis.conversationMetrics || {};
  const gestureSync = gestureAnalysis.parentChildGestureSync || {};

  const turnTakingScore = Math.min(1, (conversationMetrics.turnTaking?.totalTurns || 0) / 30);
  const responsivenessScore = conversationMetrics.responsePatterns?.childResponsiveness || 0;
  const mirroringScore = (gestureSync.mirroredGestures || 0) / 10;

  return (turnTakingScore * 0.4 + responsivenessScore * 0.4 + mirroringScore * 0.2);
}

/**
 * 감정 발달 점수 계산
 */
function calculateEmotionalScore(emotionAnalysis: any): number {
  const childEmotions = emotionAnalysis.overallEmotionalState?.child || {};
  const emotionalDevelopment = emotionAnalysis.emotionalDevelopment?.child || {};

  const intensityScore = childEmotions.emotionalIntensity || 0;
  const stabilityScore = childEmotions.emotionalStability || 0;
  const recognitionScore = (emotionalDevelopment.emotionalRecognition || 0) / 100;

  return (intensityScore * 0.3 + stabilityScore * 0.4 + recognitionScore * 0.3);
}

/**
 * 인지 발달 점수 계산
 */
function calculateCognitiveScore(speechAnalysis: any, gestureAnalysis: any): number {
  const childLanguage = speechAnalysis.languageDevelopment?.child || {};
  const gesturePatterns = gestureAnalysis.gesturePatterns || [];

  const questionScore = (childLanguage.questionAsking || 0) / 100;
  const narrativeScore = (childLanguage.narrativeAbility || 0) / 100;
  const gestureVariety = Math.min(1, gesturePatterns.length / 10);

  return (questionScore * 0.4 + narrativeScore * 0.4 + gestureVariety * 0.2);
}

/**
 * 신체 발달 점수 계산
 */
function calculatePhysicalScore(gestureAnalysis: any): number {
  const gestureStats = gestureAnalysis.gestureStatistics || {};
  const gestureTypes = gestureStats.gesturesByType || {};

  const totalGestures = gestureStats.totalGestures || 0;
  const movementGestures = (gestureTypes.walking || 0) + (gestureTypes.running || 0) + (gestureTypes.jumping || 0);
  const fineMotorGestures = (gestureTypes.pointing || 0) + (gestureTypes.clapping || 0) + (gestureTypes.reaching || 0);

  const activityScore = Math.min(1, totalGestures / 30);
  const movementScore = Math.min(1, movementGestures / 10);
  const fineMotorScore = Math.min(1, fineMotorGestures / 10);

  return (activityScore * 0.4 + movementScore * 0.3 + fineMotorScore * 0.3);
}

/**
 * 부모 양육 스타일 분석
 */
function analyzeParentingStyle(
  speechAnalysis: any,
  emotionAnalysis: any,
  gestureAnalysis: any
): IntegratedInsights['parentingStyle'] {
  const responsiveness = calculateParentResponsiveness(speechAnalysis, gestureAnalysis);
  const warmth = calculateParentWarmth(speechAnalysis, emotionAnalysis);
  const structure = calculateParentStructure(speechAnalysis, gestureAnalysis);
  const support = calculateParentSupport(speechAnalysis, emotionAnalysis);

  return {
    responsiveness: Math.round(responsiveness * 100),
    warmth: Math.round(warmth * 100),
    structure: Math.round(structure * 100),
    support: Math.round(support * 100)
  };
}

/**
 * 부모 반응성 계산
 */
function calculateParentResponsiveness(speechAnalysis: any, gestureAnalysis: any): number {
  const responsePatterns = speechAnalysis.conversationMetrics?.responsePatterns || {};
  const gestureResponses = gestureAnalysis.parentChildGestureSync?.responseGestures || 0;

  const speechResponsiveness = responsePatterns.parentResponsiveness || 0;
  const gestureResponsiveness = Math.min(1, gestureResponses / 10);

  return (speechResponsiveness * 0.7 + gestureResponsiveness * 0.3);
}

/**
 * 부모 온정성 계산
 */
function calculateParentWarmth(speechAnalysis: any, emotionAnalysis: any): number {
  const parentEmotions = speechAnalysis.emotionalTone?.parent || {};
  const emotionalSupport = emotionAnalysis.emotionalInteraction?.emotionalSupport?.parentSupport || {};

  const joyScore = parentEmotions.joy || 0;
  const patienceScore = parentEmotions.patience || 0;
  const supportScore = (emotionalSupport.comforting || 0) / 10;

  return (joyScore * 0.4 + patienceScore * 0.4 + supportScore * 0.2);
}

/**
 * 부모 구조화 계산
 */
function calculateParentStructure(speechAnalysis: any, gestureAnalysis: any): number {
  const turnTaking = speechAnalysis.conversationMetrics?.turnTaking || {};
  const gesturePatterns = gestureAnalysis.gesturePatterns || [];

  const turnBalance = turnTaking.turnBalance?.parent || 0;
  const guidingGestures = gesturePatterns.filter(p => p.context === 'guiding').length;

  const balanceScore = Math.min(1, turnBalance / 0.6); // 적절한 주도권
  const guidingScore = Math.min(1, guidingGestures / 5);

  return (balanceScore * 0.6 + guidingScore * 0.4);
}

/**
 * 부모 지원 계산
 */
function calculateParentSupport(speechAnalysis: any, emotionAnalysis: any): number {
  const parentSupport = speechAnalysis.languageDevelopment?.parentSupport || {};
  const emotionalSupport = emotionAnalysis.emotionalInteraction?.emotionalSupport?.parentSupport || {};

  const languageSupport = (parentSupport.encouragement || 0) / 100;
  const emotionalSupportScore = (emotionalSupport.encouraging || 0) / 10;

  return (languageSupport * 0.6 + emotionalSupportScore * 0.4);
}

/**
 * 자녀 발달 상태 분석
 */
function analyzeChildDevelopment(
  speechAnalysis: any,
  emotionAnalysis: any,
  gestureAnalysis: any
): IntegratedInsights['childDevelopment'] {
  const expressiveness = calculateChildExpressiveness(speechAnalysis, emotionAnalysis);
  const regulation = calculateChildRegulation(emotionAnalysis, speechAnalysis);
  const socialSkills = calculateChildSocialSkills(speechAnalysis, gestureAnalysis);
  const creativity = calculateChildCreativity(speechAnalysis, gestureAnalysis);

  return {
    expressiveness: Math.round(expressiveness * 100),
    regulation: Math.round(regulation * 100),
    socialSkills: Math.round(socialSkills * 100),
    creativity: Math.round(creativity * 100)
  };
}

/**
 * 자녀 표현력 계산
 */
function calculateChildExpressiveness(speechAnalysis: any, emotionAnalysis: any): number {
  const childEmotions = speechAnalysis.emotionalTone?.child || {};
  const emotionalExpressiveness = emotionAnalysis.overallEmotionalState?.child?.emotionalExpressiveness || 0;

  const engagementScore = childEmotions.engagement || 0;
  const excitementScore = childEmotions.excitement || 0;

  return (engagementScore * 0.4 + excitementScore * 0.3 + emotionalExpressiveness * 0.3);
}

/**
 * 자녀 조절 능력 계산
 */
function calculateChildRegulation(emotionAnalysis: any, speechAnalysis: any): number {
  const childEmotions = emotionAnalysis.overallEmotionalState?.child || {};
  const emotionalRegulation = emotionAnalysis.emotionalRegulation?.selfRegulation?.child || {};

  const stabilityScore = childEmotions.emotionalStability || 0;
  const controlScore = emotionalRegulation.emotionalControl || 0;
  const recoveryScore = emotionalRegulation.recoverySpeed || 0;

  return (stabilityScore * 0.4 + controlScore * 0.3 + recoveryScore * 0.3);
}

/**
 * 자녀 사회적 기술 계산
 */
function calculateChildSocialSkills(speechAnalysis: any, gestureAnalysis: any): number {
  const childLanguage = speechAnalysis.languageDevelopment?.child || {};
  const gestureSync = gestureAnalysis.parentChildGestureSync || {};

  const conversationSkills = (childLanguage.conversationalSkills || 0) / 100;
  const imitationScore = Math.min(1, (gestureSync.gestureImitation || 0) / 5);
  const syncScore = gestureSync.syncScore || 0;

  return (conversationSkills * 0.4 + imitationScore * 0.3 + syncScore * 0.3);
}

/**
 * 자녀 창의성 계산
 */
function calculateChildCreativity(speechAnalysis: any, gestureAnalysis: any): number {
  const childLanguage = speechAnalysis.languageDevelopment?.child || {};
  const gesturePatterns = gestureAnalysis.gesturePatterns || [];

  const narrativeScore = (childLanguage.narrativeAbility || 0) / 100;
  const questionScore = (childLanguage.questionAsking || 0) / 100;
  const gestureVariety = Math.min(1, gesturePatterns.filter(p => p.person === 'child').length / 8);

  return (narrativeScore * 0.4 + questionScore * 0.3 + gestureVariety * 0.3);
}

/**
 * 상호작용 패턴 분석
 */
function analyzeInteractionPatterns(
  speechAnalysis: any,
  emotionAnalysis: any,
  gestureAnalysis: any
): IntegratedInsights['interactionPatterns'] {
  const synchrony = calculateInteractionSynchrony(speechAnalysis, emotionAnalysis, gestureAnalysis);
  const reciprocity = calculateInteractionReciprocity(speechAnalysis, gestureAnalysis);
  const attunement = calculateInteractionAttunement(emotionAnalysis, speechAnalysis);
  const cooperation = calculateInteractionCooperation(gestureAnalysis, speechAnalysis);

  return {
    synchrony: Math.round(synchrony * 100),
    reciprocity: Math.round(reciprocity * 100),
    attunement: Math.round(attunement * 100),
    cooperation: Math.round(cooperation * 100)
  };
}

/**
 * 상호작용 동조성 계산
 */
function calculateInteractionSynchrony(
  speechAnalysis: any,
  emotionAnalysis: any,
  gestureAnalysis: any
): number {
  const emotionalSynchrony = emotionAnalysis.emotionalInteraction?.emotionalSynchrony || 0;
  const gestureSynchrony = gestureAnalysis.parentChildGestureSync?.syncScore || 0;
  const speechRhythm = speechAnalysis.conversationMetrics?.speechTiming?.conversationRhythm || 0;

  return (emotionalSynchrony * 0.4 + gestureSynchrony * 0.35 + speechRhythm * 0.25);
}

/**
 * 상호작용 상호성 계산
 */
function calculateInteractionReciprocity(speechAnalysis: any, gestureAnalysis: any): number {
  const mutualResponsiveness = speechAnalysis.conversationMetrics?.responsePatterns?.mutualResponsiveness || 0;
  const responseGestures = gestureAnalysis.parentChildGestureSync?.responseGestures || 0;

  const responseScore = Math.min(1, responseGestures / 15);

  return (mutualResponsiveness * 0.7 + responseScore * 0.3);
}

/**
 * 상호작용 조율 계산
 */
function calculateInteractionAttunement(emotionAnalysis: any, speechAnalysis: any): number {
  const emotionalContagion = emotionAnalysis.emotionalInteraction?.emotionalContagion?.bidirectional || 0;
  const parentSensitivity = speechAnalysis.emotionalTone?.parent?.patience || 0;
  const childResponsiveness = speechAnalysis.emotionalTone?.child?.engagement || 0;

  return (emotionalContagion * 0.5 + parentSensitivity * 0.3 + childResponsiveness * 0.2);
}

/**
 * 상호작용 협력 계산
 */
function calculateInteractionCooperation(gestureAnalysis: any, speechAnalysis: any): number {
  const interactionGestures = gestureAnalysis.interactionGestures || [];
  const cooperativeGestures = interactionGestures.filter(g => g.type === 'cooperative').length;
  const turnTaking = speechAnalysis.conversationMetrics?.turnTaking || {};

  const cooperativeScore = Math.min(1, cooperativeGestures / 5);
  const turnBalance = 1 - Math.abs((turnTaking.turnBalance?.parent || 0.5) - 0.5) * 2;

  return (cooperativeScore * 0.6 + turnBalance * 0.4);
}

/**
 * 분석 메타데이터 생성
 */
function generateAnalysisMetadata(
  startTime: number,
  speechAnalysis: any,
  emotionAnalysis: any,
  gestureAnalysis: any
): AnalysisMetadata {
  const processingTime = Date.now() - startTime;
  
  // 신뢰도 점수 계산
  const speechConfidence = 0.85; // 음성 분석 신뢰도 (간소화)
  const emotionConfidence = 0.78; // 감정 분석 신뢰도 (간소화)
  const gestureConfidence = gestureAnalysis.gestureStatistics?.totalGestures > 0 ? 0.72 : 0.5;
  
  const overallConfidence = (speechConfidence + emotionConfidence + gestureConfidence) / 3;
  
  return {
    analysisVersion: '1.0.0-phase1',
    processedAt: new Date().toISOString(),
    analysisModules: ['enhanced-speech', 'emotion-analyzer', 'basic-gesture'],
    confidenceScore: Math.round(overallConfidence * 1000) / 1000,
    analysisDepth: 'enhanced',
    processingTime
  };
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
} 