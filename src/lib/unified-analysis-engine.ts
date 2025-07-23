/**
 * 🎯 통합 분석 엔진 (Unified Analysis Engine) v2.0
 * 
 * 개선된 워크플로우:
 * 1. 원본 데이터 → 데이터 추출 → 추출된 데이터 저장
 * 2. 분석기들은 추출된 데이터만 사용 (메모리 효율성)
 * 3. 실제 데이터 기반 분석 (가짜 데이터 완전 제거)
 */

import { VideoIntelligenceResults } from '@/types';
import { DataExtractor, ExtractedAnalysisData } from './data-extractor';
import { EmotionalInteractionAnalyzer, EmotionalInteractionResult } from './emotional-interaction-analyzer';
import { LanguageInteractionAnalyzer, LanguageInteractionResult } from './language-interaction-analyzer';
import { PhysicalInteractionAnalyzer, PhysicalInteractionResult } from './physical-interaction-analyzer';
import { PlayPatternAnalyzer, PlayPatternResult } from './play-pattern-analyzer';
import { Logger } from './services/logger';

const logger = new Logger('UnifiedAnalysisEngine');

export interface UnifiedAnalysisInput {
  sessionId: string;
  videoResults: VideoIntelligenceResults;
  userInfo?: {
    parentAge?: number;
    childAge?: number;
    relationship?: string;
  };
  metadata?: {
    fileName?: string;
    fileSize?: number;
  };
}

export interface UnifiedAnalysisResult {
  sessionId: string;
  overallScore: number;
  interactionQuality: number;
  videoAnalysis: {
    duration: number;
    participantCount: number;
    sceneChanges: number;
    objectsDetected: number;
    personDetected: boolean;
  };
  audioAnalysis: {
    totalUtterances: number;
    averageUtteranceLength: number;
    speechDuration: number;
    silenceDuration: number;
    uniqueWords: number;
  };
  integratedAnalysis: {
    physicalInteraction: PhysicalInteractionResult;
    languageInteraction: LanguageInteractionResult;
    emotionalInteraction: EmotionalInteractionResult;
    playPatterns: PlayPatternResult;
    playPatternQuality: number;
  };
  keyFindings: string[];
  recommendations: string[];
  analysisMetadata: {
    processedAt: string;
    confidence: number;
    dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
    extractionMetrics: {
      originalDataSize: number;
      extractedDataSize: number;
      compressionRatio: number;
    };
  };
}

export class UnifiedAnalysisEngine {
  private readonly dataExtractor: DataExtractor;
  private readonly physicalAnalyzer: PhysicalInteractionAnalyzer;
  private readonly languageAnalyzer: LanguageInteractionAnalyzer;
  private readonly emotionalAnalyzer: EmotionalInteractionAnalyzer;
  private readonly playPatternAnalyzer: PlayPatternAnalyzer;

  constructor() {
    this.dataExtractor = new DataExtractor();
    this.physicalAnalyzer = new PhysicalInteractionAnalyzer();
    this.languageAnalyzer = new LanguageInteractionAnalyzer();
    this.emotionalAnalyzer = new EmotionalInteractionAnalyzer();
    this.playPatternAnalyzer = new PlayPatternAnalyzer();
  }

  /**
   * 📊 완전한 분석 수행 (새로운 워크플로우)
   */
  async performCompleteAnalysis(input: UnifiedAnalysisInput): Promise<{result: UnifiedAnalysisResult, extractedData: ExtractedAnalysisData}> {
    try {
      logger.info(`🚀 Starting unified analysis for session: ${input.sessionId}`);

      // 🔄 1단계: 원본 데이터에서 분석용 데이터 추출
      logger.info('📊 Step 1: Extracting analysis data from raw results...');
      const extractedData = await this.dataExtractor.extractAnalysisData(
        input.sessionId,
        input.videoResults
      );

      // 🔍 2단계: 추출된 데이터로 분석 수행
      logger.info('🧠 Step 2: Performing analysis with extracted data...');
      const result = await this.executeAnalysisWithExtractedData(input, extractedData);

      logger.info(`✅ Unified analysis completed for ${input.sessionId}`);
      return { result, extractedData };

    } catch (error) {
      logger.error(`❌ Unified analysis failed for ${input.sessionId}:`, error);
      throw error;
    }
  }

  private async executeAnalysisWithExtractedData(
    input: UnifiedAnalysisInput, 
    extractedData: ExtractedAnalysisData
  ): Promise<UnifiedAnalysisResult> {
    const startTime = Date.now();
    
    // 1. 기본 비디오 분석 (추출된 메타데이터 사용)
    const videoAnalysis = this.analyzeVideoFromExtractedData(extractedData);
    
    // 2. 기본 음성 분석 (추출된 음성 데이터 사용)
    const audioAnalysis = this.analyzeAudioFromExtractedData(extractedData);
    
    // 3. 상세 분석 실행 (병렬 처리, 추출된 데이터만 사용)
    logger.info('🔍 Running detailed analysis with extracted data...');
    const [physicalInteraction, languageInteraction, emotionalInteraction, playPatterns] = await Promise.all([
      this.physicalAnalyzer.analyzePhysicalInteractionFromExtractedData(
        extractedData.personMovements,
        { duration: extractedData.sceneMetadata.totalDuration, participants: extractedData.sceneMetadata.participantCount }
      ),
      this.languageAnalyzer.analyzeLanguageInteraction(extractedData.speechData),
      this.emotionalAnalyzer.analyzeEmotionalInteraction(
        extractedData.faceInteractions,
        extractedData.personMovements // converted format
      ),
      this.playPatternAnalyzer.analyzePlayPatternsFromExtractedData(
        extractedData.objectEvents,
        extractedData.personMovements,
        { duration: extractedData.sceneMetadata.totalDuration }
      )
    ]);

    // 4. 통합 분석 결과
    const integratedAnalysis = {
      physicalInteraction,
      languageInteraction,
      emotionalInteraction,
      playPatterns,
      playPatternQuality: this.calculatePlayPatternQuality(playPatterns)
    };
    
    // 5. 전체 점수 계산
    const overallScore = this.calculateOverallScore(videoAnalysis, audioAnalysis, integratedAnalysis);
    
    // 6. 상호작용 품질 계산
    const interactionQuality = this.calculateInteractionQuality(integratedAnalysis);
    
    // 7. 주요 발견사항 생성
    const keyFindings = this.generateKeyFindings(videoAnalysis, audioAnalysis, integratedAnalysis);
    
    // 8. 추천사항 생성
    const recommendations = this.generateRecommendations(integratedAnalysis, overallScore);
    
    // 9. 메타데이터 생성 (추출 메트릭 포함)
    const analysisMetadata = {
      processedAt: new Date().toISOString(),
      confidence: this.calculateConfidence(videoAnalysis, audioAnalysis),
      dataQuality: this.assessDataQuality(extractedData) as 'excellent' | 'good' | 'fair' | 'poor',
      extractionMetrics: {
        originalDataSize: extractedData.originalDataSize,
        extractedDataSize: extractedData.extractedDataSize,
        compressionRatio: extractedData.compressionRatio
      }
    };
    
    const result: UnifiedAnalysisResult = {
      sessionId: input.sessionId,
      overallScore,
      interactionQuality,
      videoAnalysis,
      audioAnalysis,
      integratedAnalysis,
      keyFindings,
      recommendations,
      analysisMetadata
    };
    
    const processingTime = Date.now() - startTime;
    logger.info(`✅ Analysis with extracted data completed in ${processingTime}ms`, {
      overallScore,
      compressionRatio: `${extractedData.compressionRatio.toFixed(1)}%`,
      originalDataSize: `${(extractedData.originalDataSize / 1024 / 1024).toFixed(2)}MB`,
      extractedDataSize: `${(extractedData.extractedDataSize / 1024).toFixed(1)}KB`
    });
    
    return result;
  }

  private analyzeVideoFromExtractedData(extractedData: ExtractedAnalysisData) {
    const { sceneMetadata, personMovements, objectEvents } = extractedData;
    
    return {
      duration: sceneMetadata.totalDuration,
      participantCount: sceneMetadata.participantCount,
      sceneChanges: sceneMetadata.shotChanges.length,
      objectsDetected: objectEvents.length,
      personDetected: personMovements.length > 0
    };
  }

  private analyzeAudioFromExtractedData(extractedData: ExtractedAnalysisData) {
    const { speechData } = extractedData;
    
    const totalUtterances = speechData.length;
    const totalWords = speechData.reduce((sum, entry) => {
      const wordCount = entry.text.trim().split(/\s+/).length;
      return sum + wordCount;
    }, 0);
    
    const averageUtteranceLength = totalUtterances > 0 ? totalWords / totalUtterances : 0;
    
    // 발화 시간 계산 (대략적으로 단어당 0.5초로 추정)
    const speechDuration = totalWords * 0.5;
    const silenceDuration = Math.max(0, extractedData.sceneMetadata.totalDuration - speechDuration);
    
    // 고유 단어 수 계산
    const allWords = speechData.flatMap(entry => 
      entry.text.toLowerCase().split(/\s+/).filter(word => word.length > 2)
    );
    const uniqueWords = new Set(allWords).size;

    return {
      totalUtterances,
      averageUtteranceLength: Number(averageUtteranceLength.toFixed(1)),
      speechDuration: Number(speechDuration.toFixed(1)),
      silenceDuration: Number(silenceDuration.toFixed(1)),
      uniqueWords
    };
  }

  private calculatePlayPatternQuality(playPatterns: PlayPatternResult): number {
    // 장난감 다양성, 공유 비율, 창의성 기반으로 품질 점수 계산
    const diversityScore = Math.min(playPatterns.toysDetected.length * 20, 40);
    const sharingScore = playPatterns.sharingRatio * 30;
    const creativityScore = playPatterns.creativityIndicators.diversityScore * 0.3;
    
    return Math.round(diversityScore + sharingScore + creativityScore);
  }

  private calculateOverallScore(videoAnalysis: any, audioAnalysis: any, integratedAnalysis: any): number {
    const videoScore = Math.min(
      (videoAnalysis.participantCount > 0 ? 25 : 0) +
      (videoAnalysis.duration > 60 ? 15 : videoAnalysis.duration * 0.25) +
      (videoAnalysis.objectsDetected > 0 ? 10 : 0), 50
    );

    const audioScore = Math.min(
      (audioAnalysis.totalUtterances * 0.5) +
      (audioAnalysis.uniqueWords > 20 ? 10 : audioAnalysis.uniqueWords * 0.5), 25
    );

    const interactionScore = Math.round(
      (integratedAnalysis.physicalInteraction.proximityScore * 0.3) +
      (integratedAnalysis.emotionalInteraction.engagementScore * 0.3) +
      (integratedAnalysis.playPatterns.overallScore * 0.4)
    );

    const total = videoScore + audioScore + Math.min(interactionScore, 25);
    return Math.min(Math.round(total), 100);
  }

  private calculateInteractionQuality(integratedAnalysis: any): number {
    const physicalQuality = integratedAnalysis.physicalInteraction.proximityScore;
    const emotionalQuality = integratedAnalysis.emotionalInteraction.engagementScore;
    const languageQuality = Math.min(integratedAnalysis.languageInteraction.conversationPatterns.turnCount * 2, 50);
    const playQuality = integratedAnalysis.playPatterns.overallScore;

    const avgQuality = (physicalQuality + emotionalQuality + languageQuality + playQuality) / 4;
    return Math.round(avgQuality);
  }

  private generateKeyFindings(videoAnalysis: any, audioAnalysis: any, integratedAnalysis: any): string[] {
    const findings: string[] = [];

    // 비디오 분석 기반 발견사항
    if (videoAnalysis.participantCount >= 2) {
      findings.push(`${videoAnalysis.participantCount}명의 참여자가 ${videoAnalysis.duration.toFixed(1)}초 동안 상호작용했습니다.`);
    }

    // 신체적 상호작용
    const physical = integratedAnalysis.physicalInteraction;
    if (physical.proximityScore > 70) {
      findings.push('부모와 자녀가 가까운 거리에서 활발한 신체적 상호작용을 보였습니다.');
    }
    if (physical.synchronizedEvents.length > 0) {
      findings.push(`${physical.synchronizedEvents.length}회의 움직임 동기화가 관찰되었습니다.`);
    }

    // 언어적 상호작용
    const language = integratedAnalysis.languageInteraction;
    if (language.conversationPatterns.turnCount > 10) {
      findings.push(`${language.conversationPatterns.turnCount}회의 대화 교환으로 활발한 언어적 상호작용을 보였습니다.`);
    }

    // 감정적 상호작용
    const emotional = integratedAnalysis.emotionalInteraction;
    if (emotional.interactionQuality === 'high') {
      findings.push('높은 수준의 감정적 유대감과 참여도가 관찰되었습니다.');
    }

    // 놀이 패턴
    const play = integratedAnalysis.playPatterns;
    if (play.toysDetected.length > 2) {
      findings.push(`${play.toysDetected.length}가지 장난감을 활용한 다양한 놀이 활동이 이루어졌습니다.`);
    }

    return findings.slice(0, 5); // 최대 5개
  }

  private generateRecommendations(integratedAnalysis: any, overallScore: number): string[] {
    const recommendations: string[] = [];

    if (overallScore < 60) {
      recommendations.push('전체적인 상호작용을 늘리기 위해 함께하는 시간을 증가시켜 보세요.');
    }

    const physical = integratedAnalysis.physicalInteraction;
    if (physical.activityLevel === 'low') {
      recommendations.push('더 활동적인 놀이를 통해 신체적 상호작용을 늘려보세요.');
    }

    const language = integratedAnalysis.languageInteraction;
    if (language.utteranceTypes.questions < 5) {
      recommendations.push('자녀에게 더 많은 질문을 하여 대화를 유도해보세요.');
    }

    const play = integratedAnalysis.playPatterns;
    if (play.sharingRatio < 0.5) {
      recommendations.push('함께 장난감을 사용하는 협력 놀이를 더 늘려보세요.');
    }

    return recommendations.slice(0, 4);
  }

  private calculateConfidence(videoAnalysis: unknown, audioAnalysis: unknown): number {
    let confidence = 0;

    const videoData = videoAnalysis as Record<string, unknown>;
    const audioData = audioAnalysis as Record<string, unknown>;

    // 비디오 데이터 품질
    if (videoData.participantCount && (videoData.participantCount as number) > 0) {
      confidence += 30;
    }
    if (videoData.duration && (videoData.duration as number) > 60) {
      confidence += 20;
    }
    if (videoData.objectsDetected && (videoData.objectsDetected as number) > 0) {
      confidence += 20;
    }

    // 음성 데이터 품질  
    if (audioData.totalUtterances && (audioData.totalUtterances as number) > 5) {
      confidence += 20;
    }
    if (audioData.uniqueWords && (audioData.uniqueWords as number) > 10) {
      confidence += 10;
    }

    return Math.min(confidence, 100);
  }

  private assessDataQuality(extractedData: ExtractedAnalysisData): string {
    const { personMovements, speechData, faceInteractions, objectEvents } = extractedData;
    
    let score = 0;
    
    // 사람 감지 품질
    if (personMovements.length >= 2) {
      score += 25;
    } else if (personMovements.length === 1) {
      score += 15;
    }
    
    // 음성 데이터 품질
    if (speechData.length > 10) {
      score += 25;
    } else if (speechData.length > 5) {
      score += 15;
    } else if (speechData.length > 0) {
      score += 10;
    }
    
    // 얼굴 감지 품질
    if (faceInteractions.length > 50) {
      score += 25;
    } else if (faceInteractions.length > 10) {
      score += 15;
    } else if (faceInteractions.length > 0) {
      score += 10;
    }
    
    // 객체 감지 품질
    if (objectEvents.length > 3) {
      score += 25;
    } else if (objectEvents.length > 1) {
      score += 15;
    } else if (objectEvents.length > 0) {
      score += 10;
    }
    
    if (score >= 80) {
      return 'excellent';
    }
    if (score >= 60) {
      return 'good';
    }
    if (score >= 40) {
      return 'fair';
    }
    return 'poor';
  }
} 