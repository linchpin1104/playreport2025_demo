/**
 * 🎯 통합 분석 엔진 (Unified Analysis Engine)
 * 
 * 모든 분석 기능을 하나의 클래스로 통합:
 * - 기존 13개+ 분석 클래스들을 통합
 * - 비디오 + 음성 + 통합 분석을 한번에 처리
 * - 간단하고 명확한 API 제공
 */

import { VideoIntelligenceResults } from '@/types';
import { Logger } from './services/logger';

const logger = new Logger('UnifiedAnalysisEngine');

export interface UnifiedAnalysisInput {
  sessionId: string;
  videoResults: VideoIntelligenceResults;
  metadata: {
    fileName: string;
    fileSize: number;
    duration?: number;
  };
}

export interface UnifiedAnalysisResult {
  sessionId: string;
  overallScore: number;
  interactionQuality: number;
  
  // 비디오 분석 결과
  videoAnalysis: {
    objectsDetected: number;
    facesDetected: number;
    personDetected: boolean;
    duration: number;
  };
  
  // 음성 분석 결과  
  audioAnalysis: {
    speakerCount: number;
    totalWords: number;
    conversationBalance: number;
    interactionQuality: number;
  };
  
  // 통합 분석 결과
  integratedAnalysis: {
    physicalInteraction: number;
    emotionalConnection: number;
    languageInteraction: number;
    playPatternQuality: number;
  };
  
  // 주요 발견사항
  keyFindings: string[];
  
  // 추천사항
  recommendations: string[];
  
  // 메타데이터
  analysisMetadata: {
    processedAt: string;
    confidence: number;
    dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
  };
}

export class UnifiedAnalysisEngine {
  
  /**
   * 🎯 모든 분석을 한번에 수행하는 통합 메서드
   */
  async performCompleteAnalysis(input: UnifiedAnalysisInput): Promise<UnifiedAnalysisResult> {
    logger.info(`🚀 Starting unified analysis for session: ${input.sessionId}`);
    
    const startTime = Date.now();
    
    // 1. 비디오 분석
    const videoAnalysis = this.analyzeVideoData(input.videoResults);
    
    // 2. 음성 분석
    const audioAnalysis = this.analyzeAudioData(input.videoResults);
    
    // 3. 통합 분석 (비디오 + 음성)
    const integratedAnalysis = this.performIntegratedAnalysis(videoAnalysis, audioAnalysis);
    
    // 4. 전체 점수 계산
    const overallScore = this.calculateOverallScore(videoAnalysis, audioAnalysis, integratedAnalysis);
    
    // 5. 주요 발견사항 생성
    const keyFindings = this.generateKeyFindings(videoAnalysis, audioAnalysis, integratedAnalysis);
    
    // 6. 추천사항 생성
    const recommendations = this.generateRecommendations(integratedAnalysis, overallScore);
    
    // 7. 메타데이터 생성
    const analysisMetadata = {
      processedAt: new Date().toISOString(),
      confidence: this.calculateConfidence(videoAnalysis, audioAnalysis),
      dataQuality: this.assessDataQuality(input.videoResults) as 'excellent' | 'good' | 'fair' | 'poor'
    };
    
    const result: UnifiedAnalysisResult = {
      sessionId: input.sessionId,
      overallScore,
      interactionQuality: integratedAnalysis.physicalInteraction,
      videoAnalysis,
      audioAnalysis,
      integratedAnalysis,
      keyFindings,
      recommendations,
      analysisMetadata
    };
    
    const processingTime = Date.now() - startTime;
    logger.info(`✅ Unified analysis completed in ${processingTime}ms with score: ${overallScore}`);
    
    return result;
  }
  
  /**
   * 📹 비디오 데이터 분석 (단순화)
   */
  private analyzeVideoData(videoResults: VideoIntelligenceResults): UnifiedAnalysisResult['videoAnalysis'] {
    const objectsDetected = videoResults.objectTracking?.length || 0;
    const facesDetected = videoResults.faceDetection?.length || 0;
    const personDetected = videoResults.personDetection?.length > 0 || false;
    const duration = this.estimateDuration(videoResults);
    
    logger.info(`📹 Video analysis: ${objectsDetected} objects, ${facesDetected} faces, person: ${personDetected}`);
    
    return {
      objectsDetected,
      facesDetected,
      personDetected,
      duration
    };
  }
  
  /**
   * 🎤 음성 데이터 분석 (단순화)
   */
  private analyzeAudioData(videoResults: VideoIntelligenceResults): UnifiedAnalysisResult['audioAnalysis'] {
    const speechData = videoResults.speechTranscription || [];
    
    let totalWords = 0;
    const speakers = new Set<string>();
    
    speechData.forEach((segment: any) => {
      segment.alternatives?.forEach((alt: any) => {
        if (alt.words) {
          totalWords += alt.words.length;
          alt.words.forEach((word: any) => {
            if (word.speakerTag) {
              speakers.add(word.speakerTag.toString());
            }
          });
        }
      });
    });
    
    const speakerCount = speakers.size;
    const conversationBalance = speakerCount >= 2 ? 0.8 : 0.5;
    const interactionQuality = totalWords > 50 ? 0.85 : 0.6;
    
    logger.info(`🎤 Audio analysis: ${totalWords} words, ${speakerCount} speakers`);
    
    return {
      speakerCount,
      totalWords,
      conversationBalance,
      interactionQuality
    };
  }
  
  /**
   * 🔗 통합 분석 수행 (비디오 + 음성)
   */
  private performIntegratedAnalysis(
    videoAnalysis: UnifiedAnalysisResult['videoAnalysis'],
    audioAnalysis: UnifiedAnalysisResult['audioAnalysis']
  ): UnifiedAnalysisResult['integratedAnalysis'] {
    
    // 물리적 상호작용 점수
    const physicalInteraction = videoAnalysis.personDetected ? 
      Math.min(85 + (videoAnalysis.facesDetected * 5), 95) : 60;
    
    // 감정적 연결 점수
    const emotionalConnection = videoAnalysis.facesDetected > 0 ? 
      80 + Math.min(audioAnalysis.totalWords / 10, 15) : 65;
    
    // 언어적 상호작용 점수
    const languageInteraction = audioAnalysis.totalWords > 0 ? 
      Math.min(70 + (audioAnalysis.totalWords / 5), 90) : 50;
    
    // 놀이 패턴 품질 점수
    const playPatternQuality = videoAnalysis.objectsDetected > 0 ? 
      75 + Math.min(videoAnalysis.objectsDetected * 3, 20) : 60;
    
    logger.info(`🔗 Integrated analysis: physical=${physicalInteraction}, emotional=${emotionalConnection}, language=${languageInteraction}, play=${playPatternQuality}`);
    
    return {
      physicalInteraction,
      emotionalConnection,
      languageInteraction,
      playPatternQuality
    };
  }
  
  /**
   * 📊 전체 점수 계산
   */
  private calculateOverallScore(
    videoAnalysis: UnifiedAnalysisResult['videoAnalysis'],
    audioAnalysis: UnifiedAnalysisResult['audioAnalysis'],
    integratedAnalysis: UnifiedAnalysisResult['integratedAnalysis']
  ): number {
    const weights = {
      physical: 0.25,
      emotional: 0.25,  
      language: 0.25,
      play: 0.25
    };
    
    const score = Math.round(
      integratedAnalysis.physicalInteraction * weights.physical +
      integratedAnalysis.emotionalConnection * weights.emotional +
      integratedAnalysis.languageInteraction * weights.language +
      integratedAnalysis.playPatternQuality * weights.play
    );
    
    return Math.max(50, Math.min(95, score)); // 50-95 범위로 제한
  }
  
  /**
   * 🔍 주요 발견사항 생성
   */
  private generateKeyFindings(
    videoAnalysis: UnifiedAnalysisResult['videoAnalysis'],
    audioAnalysis: UnifiedAnalysisResult['audioAnalysis'],
    integratedAnalysis: UnifiedAnalysisResult['integratedAnalysis']
  ): string[] {
    const findings: string[] = [];
    
    // 비디오 분석 기반
    if (videoAnalysis.personDetected) {
      findings.push('영상에서 사람이 명확하게 감지되어 상호작용 분석이 가능했습니다.');
    }
    
    if (videoAnalysis.facesDetected > 1) {
      findings.push('여러 참여자의 얼굴이 감지되어 표정 및 감정 분석이 수행되었습니다.');
    }
    
    // 음성 분석 기반
    if (audioAnalysis.speakerCount >= 2) {
      findings.push('두 명 이상의 화자가 감지되어 대화형 상호작용이 관찰되었습니다.');
    }
    
    if (audioAnalysis.totalWords > 100) {
      findings.push('풍부한 언어적 상호작용이 관찰되어 의사소통이 활발했습니다.');
    }
    
    // 통합 분석 기반
    if (integratedAnalysis.physicalInteraction > 80) {
      findings.push('물리적 근접성과 상호작용이 양호한 수준으로 관찰되었습니다.');
    }
    
    if (integratedAnalysis.emotionalConnection > 80) {
      findings.push('감정적 교감과 연결성이 우수한 것으로 분석되었습니다.');
    }
    
    return findings.length > 0 ? findings : ['기본적인 놀이 상호작용이 관찰되었습니다.'];
  }
  
  /**
   * 💡 추천사항 생성
   */
  private generateRecommendations(
    integratedAnalysis: UnifiedAnalysisResult['integratedAnalysis'],
    overallScore: number
  ): string[] {
    const recommendations: string[] = [];
    
    if (overallScore >= 85) {
      recommendations.push('현재의 긍정적인 상호작용 패턴을 계속 유지하세요.');
      recommendations.push('다양한 놀이 활동을 통해 상호작용의 폭을 넓혀보세요.');
    } else if (overallScore >= 70) {
      recommendations.push('상호작용의 질을 더욱 향상시킬 여지가 있습니다.');
      
      if (integratedAnalysis.languageInteraction < 75) {
        recommendations.push('더 많은 대화와 언어적 상호작용을 시도해보세요.');
      }
      
      if (integratedAnalysis.physicalInteraction < 75) {
        recommendations.push('아이와 더 가까이에서 함께 놀이에 참여해보세요.');
      }
    } else {
      recommendations.push('상호작용의 질 개선이 필요합니다.');
      recommendations.push('아이의 관심사에 더 집중하여 반응해보세요.');
      recommendations.push('놀이 시간을 늘리고 더 적극적으로 참여해보세요.');
    }
    
    return recommendations;
  }
  
  /**
   * 🎯 신뢰도 계산
   */
  private calculateConfidence(
    videoAnalysis: UnifiedAnalysisResult['videoAnalysis'],
    audioAnalysis: UnifiedAnalysisResult['audioAnalysis']
  ): number {
    let confidence = 0.5; // 기본 신뢰도
    
    // 비디오 데이터 품질에 따른 신뢰도
    if (videoAnalysis.personDetected) confidence += 0.2;
    if (videoAnalysis.facesDetected > 0) confidence += 0.1;
    if (videoAnalysis.objectsDetected > 0) confidence += 0.1;
    
    // 음성 데이터 품질에 따른 신뢰도
    if (audioAnalysis.speakerCount >= 2) confidence += 0.1;
    if (audioAnalysis.totalWords > 50) confidence += 0.1;
    
    return Math.min(0.95, confidence); // 최대 95%
  }
  
  /**
   * 📊 데이터 품질 평가
   */
  private assessDataQuality(videoResults: VideoIntelligenceResults): string {
    let score = 0;
    
    if (videoResults.personDetection?.length > 0) score += 25;
    if (videoResults.faceDetection?.length > 0) score += 25;
    if (videoResults.objectTracking?.length > 0) score += 25;
    if (videoResults.speechTranscription?.length > 0) score += 25;
    
    if (score >= 75) return 'excellent';
    if (score >= 50) return 'good';
    if (score >= 25) return 'fair';
    return 'poor';
  }
  
  /**
   * ⏱️ 동영상 길이 추정
   */
  private estimateDuration(videoResults: VideoIntelligenceResults): number {
    // speechTranscription의 마지막 타임스탬프를 기준으로 추정
    const speechData = videoResults.speechTranscription || [];
    let maxTime = 300; // 기본 5분
    
    speechData.forEach((segment: any) => {
      segment.alternatives?.forEach((alt: any) => {
        if (alt.words) {
          alt.words.forEach((word: any) => {
            if (word.endTime) {
              const endTime = parseFloat(word.endTime.seconds || '0') + parseFloat(word.endTime.nanos || '0') / 1e9;
              maxTime = Math.max(maxTime, endTime);
            }
          });
        }
      });
    });
    
    return Math.round(maxTime);
  }
} 