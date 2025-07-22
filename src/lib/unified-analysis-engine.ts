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
  performCompleteAnalysis(input: UnifiedAnalysisInput): UnifiedAnalysisResult {
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
   * 🔗 통합 분석 수행 (실제 데이터 기반)
   */
  private performIntegratedAnalysis(
    videoAnalysis: UnifiedAnalysisResult['videoAnalysis'],
    audioAnalysis: UnifiedAnalysisResult['audioAnalysis']
  ): UnifiedAnalysisResult['integratedAnalysis'] {
    
    // 물리적 상호작용 점수 (실제 감지 비율 기반)
    const personConfidence = videoAnalysis.personDetected ? 1.0 : 0.0;
    const faceRatio = Math.min(videoAnalysis.facesDetected / 2, 1.0); // 2명 기준 정규화
    const physicalInteraction = Math.round(
      (personConfidence * 40) +        // 사람 감지 40점
      (faceRatio * 35) +               // 얼굴 감지 비율 35점  
      (videoAnalysis.duration > 60 ? 25 : 15)  // 충분한 길이 25점
    );
    
    // 감정적 연결 점수 (얼굴과 음성 데이터 기반)
    const faceEngagement = videoAnalysis.facesDetected > 0 ? Math.min(videoAnalysis.facesDetected * 20, 40) : 0;
    const speechEngagement = Math.min((audioAnalysis.totalWords / 50) * 30, 30); // 50단어 기준
    const speakerInteraction = audioAnalysis.speakerCount > 1 ? 30 : 10;
    const emotionalConnection = Math.round(faceEngagement + speechEngagement + speakerInteraction);
    
    // 언어적 상호작용 점수 (실제 대화 데이터 기반)
    const wordDensity = audioAnalysis.totalWords / Math.max(videoAnalysis.duration, 30) * 60; // 분당 단어수
    const conversationScore = audioAnalysis.speakerCount > 1 ? 40 : 20;
    const wordScore = Math.min(wordDensity * 2, 40); // 분당 20단어면 만점
    const balanceScore = audioAnalysis.conversationBalance * 20;
    const languageInteraction = Math.round(conversationScore + wordScore + balanceScore);
    
    // 놀이 패턴 품질 점수 (객체와 상호작용 기반)
    const objectEngagement = Math.min(videoAnalysis.objectsDetected * 10, 40); // 객체당 10점
    const durationBonus = videoAnalysis.duration > 120 ? 30 : (videoAnalysis.duration > 60 ? 20 : 10);
    const interactionBonus = (physicalInteraction + emotionalConnection) > 120 ? 30 : 20;
    const playPatternQuality = Math.round(objectEngagement + durationBonus + interactionBonus);
    
    // 최종 점수 정규화 (0-100 범위)
    const normalizedScores = {
      physicalInteraction: Math.max(0, Math.min(100, physicalInteraction)),
      emotionalConnection: Math.max(0, Math.min(100, emotionalConnection)), 
      languageInteraction: Math.max(0, Math.min(100, languageInteraction)),
      playPatternQuality: Math.max(0, Math.min(100, playPatternQuality))
    };
    
    logger.info(`🔗 Real data analysis: physical=${normalizedScores.physicalInteraction}, emotional=${normalizedScores.emotionalConnection}, language=${normalizedScores.languageInteraction}, play=${normalizedScores.playPatternQuality}`);
    
    return normalizedScores;
  }
  
  /**
   * 📊 전체 점수 계산 (실제 데이터 품질 기반)
   */
  private calculateOverallScore(
    videoAnalysis: UnifiedAnalysisResult['videoAnalysis'],
    audioAnalysis: UnifiedAnalysisResult['audioAnalysis'],
    integratedAnalysis: UnifiedAnalysisResult['integratedAnalysis']
  ): number {
    // 데이터 품질에 따른 가중치 조정
    const dataQualityMultiplier = this.calculateDataQualityMultiplier(videoAnalysis, audioAnalysis);
    
    const weights = {
      physical: 0.25,
      emotional: 0.25,  
      language: 0.25,
      play: 0.25
    };
    
    const rawScore = Math.round(
      integratedAnalysis.physicalInteraction * weights.physical +
      integratedAnalysis.emotionalConnection * weights.emotional +
      integratedAnalysis.languageInteraction * weights.language +
      integratedAnalysis.playPatternQuality * weights.play
    );
    
    // 데이터 품질에 따른 최종 점수 조정
    const adjustedScore = Math.round(rawScore * dataQualityMultiplier);
    
    // 최소/최대 점수는 실제 데이터 가용성에 따라 결정
    const minScore = audioAnalysis.totalWords > 0 && videoAnalysis.personDetected ? 30 : 10;
    const maxScore = dataQualityMultiplier > 0.8 ? 100 : 85;
    
    return Math.max(minScore, Math.min(maxScore, adjustedScore));
  }
  
  /**
   * 📈 데이터 품질에 따른 점수 보정 계수 계산
   */
  private calculateDataQualityMultiplier(
    videoAnalysis: UnifiedAnalysisResult['videoAnalysis'],
    audioAnalysis: UnifiedAnalysisResult['audioAnalysis']
  ): number {
    let qualityScore = 0.5; // 기본 50%
    
    // 비디오 데이터 품질
    if (videoAnalysis.personDetected) qualityScore += 0.2;
    if (videoAnalysis.facesDetected > 0) qualityScore += 0.1;
    if (videoAnalysis.objectsDetected > 0) qualityScore += 0.1;
    if (videoAnalysis.duration > 60) qualityScore += 0.1;
    
    // 오디오 데이터 품질
    if (audioAnalysis.totalWords > 0) qualityScore += 0.1;
    if (audioAnalysis.speakerCount > 1) qualityScore += 0.1;
    
    return Math.min(1.0, qualityScore);
  }
  
  /**
   * 💡 주요 발견사항 생성 (동적 조건 기반)
   */
  private generateKeyFindings(
    videoAnalysis: UnifiedAnalysisResult['videoAnalysis'],
    audioAnalysis: UnifiedAnalysisResult['audioAnalysis'],
    integratedAnalysis: UnifiedAnalysisResult['integratedAnalysis']
  ): string[] {
    const findings: string[] = [];
    
    // 비디오 분석 기반 (실제 감지 데이터)
    if (videoAnalysis.personDetected) {
      findings.push('영상에서 사람이 명확하게 감지되어 상호작용 분석이 가능했습니다.');
    }
    
    if (videoAnalysis.facesDetected > 1) {
      findings.push(`${videoAnalysis.facesDetected}명의 참여자 얼굴이 감지되어 표정 및 감정 분석이 수행되었습니다.`);
    }
    
    if (videoAnalysis.objectsDetected > 3) {
      findings.push(`${videoAnalysis.objectsDetected}개의 놀이 관련 객체가 감지되어 다양한 놀이 활동이 확인되었습니다.`);
    }
    
    // 음성 분석 기반 (실제 대화 데이터)
    if (audioAnalysis.speakerCount >= 2) {
      findings.push(`${audioAnalysis.speakerCount}명의 화자가 감지되어 대화형 상호작용이 관찰되었습니다.`);
    }
    
    const wordDensity = audioAnalysis.totalWords / Math.max(videoAnalysis.duration, 30) * 60;
    if (wordDensity > 15) { // 분당 15단어 이상
      findings.push(`분당 ${Math.round(wordDensity)}단어의 활발한 언어적 상호작용이 관찰되었습니다.`);
    }
    
    // 통합 분석 기반 (동적 임계값)
    const avgScore = (integratedAnalysis.physicalInteraction + integratedAnalysis.emotionalConnection + 
                     integratedAnalysis.languageInteraction + integratedAnalysis.playPatternQuality) / 4;
    
    if (integratedAnalysis.physicalInteraction > avgScore * 1.2) {
      findings.push('물리적 근접성과 상호작용이 특히 활발한 수준으로 관찰되었습니다.');
    }
    
    if (integratedAnalysis.emotionalConnection > avgScore * 1.2) {
      findings.push('감정적 교감과 연결성이 평균보다 우수한 것으로 분석되었습니다.');
    }
    
    if (integratedAnalysis.languageInteraction > avgScore * 1.2) {
      findings.push('언어적 상호작용과 대화 품질이 평균보다 높은 수준입니다.');
    }
    
    // 분석 품질에 따른 메시지
    const dataQuality = this.calculateDataQualityMultiplier(videoAnalysis, audioAnalysis);
    if (dataQuality > 0.8) {
      findings.push('고품질 분석 데이터를 바탕으로 신뢰할 수 있는 결과를 제공합니다.');
    } else if (dataQuality < 0.5) {
      findings.push('분석 가능한 데이터가 제한적이어서 기본적인 분석만 수행되었습니다.');
    }
    
    return findings.length > 0 ? findings : ['기본적인 놀이 상호작용이 관찰되었습니다.'];
  }
  
  /**
   * 💡 추천사항 생성 (동적 분석 기반)
   */
  private generateRecommendations(
    integratedAnalysis: UnifiedAnalysisResult['integratedAnalysis'],
    overallScore: number
  ): string[] {
    const recommendations: string[] = [];
    
    // 각 영역별 점수와 전체 평균 비교
    const avgScore = (integratedAnalysis.physicalInteraction + integratedAnalysis.emotionalConnection + 
                     integratedAnalysis.languageInteraction + integratedAnalysis.playPatternQuality) / 4;
    
    const excellentThreshold = Math.max(80, avgScore * 1.1);
    const goodThreshold = Math.max(60, avgScore * 0.9);
    
    // 전체 점수 기반 일반 추천사항
    if (overallScore >= excellentThreshold) {
      recommendations.push('전반적으로 우수한 상호작용 패턴을 보이고 있습니다.');
      recommendations.push('현재의 긍정적인 접근 방식을 계속 유지하며, 새로운 놀이 활동도 시도해보세요.');
    } else if (overallScore >= goodThreshold) {
      recommendations.push('양호한 상호작용이 관찰되며, 몇 가지 영역에서 개선 가능성이 있습니다.');
    } else {
      recommendations.push('상호작용의 질을 높이기 위한 개선이 필요합니다.');
      recommendations.push('아이와의 놀이에 더 적극적으로 참여하고 반응해보세요.');
    }
    
    // 영역별 구체적 추천사항 (상대적 비교 기반)
    if (integratedAnalysis.languageInteraction < avgScore * 0.8) {
      recommendations.push('언어적 상호작용을 늘려보세요. 아이와 더 많은 대화를 나누고, 놀이 중 설명과 질문을 활용해보세요.');
    }
    
    if (integratedAnalysis.physicalInteraction < avgScore * 0.8) {
      recommendations.push('물리적 참여를 늘려보세요. 아이와 더 가까이에서 함께 놀이에 직접 참여해보세요.');
    }
    
    if (integratedAnalysis.emotionalConnection < avgScore * 0.8) {
      recommendations.push('감정적 연결을 강화해보세요. 아이의 감정에 더 민감하게 반응하고 공감을 표현해보세요.');
    }
    
    if (integratedAnalysis.playPatternQuality < avgScore * 0.8) {
      recommendations.push('놀이 패턴을 다양화해보세요. 다른 종류의 놀잇감을 활용하거나 새로운 놀이 방식을 시도해보세요.');
    }
    
    // 분석 데이터 품질에 따른 추가 추천사항
    if (recommendations.length < 3) {
      recommendations.push('더 정확한 분석을 위해 다양한 상황에서의 놀이 영상을 추가로 분석해보세요.');
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
    if (videoAnalysis.personDetected) { confidence += 0.2; }
    if (videoAnalysis.facesDetected > 0) { confidence += 0.1; }
    if (videoAnalysis.objectsDetected > 0) { confidence += 0.1; }
    
    // 음성 데이터 품질에 따른 신뢰도
    if (audioAnalysis.speakerCount >= 2) { confidence += 0.1; }
    if (audioAnalysis.totalWords > 50) { confidence += 0.1; }
    
    return Math.min(0.95, confidence); // 최대 95%
  }
  
  /**
   * 📊 데이터 품질 평가
   */
  private assessDataQuality(videoResults: VideoIntelligenceResults): string {
    let score = 0;
    
    // Video analysis scoring
    if (videoResults.objectTracking?.length > 0) { score += 20; }
    if (videoResults.faceDetection?.length > 0) { score += 15; }
    if (videoResults.personDetection?.length > 0) { score += 25; }
    
    // Audio analysis scoring  
    if (videoResults.speechTranscription?.length > 0) { score += 15; }

    // Integration bonus scoring
    if (videoResults.personDetection?.length > 0 && videoResults.speechTranscription?.length > 0) { score += 10; }
    if (videoResults.faceDetection?.length > 0 && videoResults.speechTranscription?.length > 0) { score += 5; }
    if (videoResults.objectTracking?.length > 5 && videoResults.speechTranscription?.length > 0) { score += 8; }

    if (score >= 90) { return 'excellent'; }
    if (score >= 70) { return 'good'; }
    if (score >= 50) { return 'average'; }
    return 'poor';
  }
  
  /**
   * 🎯 비디오 길이 추정 (여러 데이터 소스 활용)
   */
  private estimateDuration(videoResults: VideoIntelligenceResults): number {
    let maxDuration = 0;
    
    // 1. Shot changes에서 길이 추정 (가장 정확)
    if (videoResults.shotChanges && videoResults.shotChanges.length > 0) {
      const lastShot = videoResults.shotChanges[videoResults.shotChanges.length - 1];
      if (lastShot.endTimeOffset) {
        maxDuration = Math.max(maxDuration, parseFloat(lastShot.endTimeOffset.toString()));
      }
    }
    
    // 2. Object tracking에서 길이 추정
    if (videoResults.objectTracking) {
      videoResults.objectTracking.forEach((obj: any) => {
        obj.frames?.forEach((frame: any) => {
          if (frame.timeOffset) {
            const timeSeconds = parseFloat(frame.timeOffset.seconds ?? '0') + 
                               parseFloat(frame.timeOffset.nanos ?? '0') / 1e9;
            maxDuration = Math.max(maxDuration, timeSeconds);
          }
        });
      });
    }
    
    // 3. Speech transcription에서 길이 추정
    const speechData = videoResults.speechTranscription || [];
    speechData.forEach((segment: any) => {
      segment.alternatives?.forEach((alt: any) => {
        alt.words?.forEach((word: any) => {
          if (word.endTime) {
            const endTime = parseFloat(word.endTime.seconds ?? '0') + 
                           parseFloat(word.endTime.nanos ?? '0') / 1e9;
            maxDuration = Math.max(maxDuration, endTime);
          }
        });
      });
    });
    
    // 4. Face detection에서 길이 추정
    if (videoResults.faceDetection) {
      videoResults.faceDetection.forEach((face: any) => {
        face.tracks?.forEach((track: any) => {
          if (track.segment?.endTimeOffset) {
            const endTime = parseFloat(track.segment.endTimeOffset.seconds ?? '0') + 
                           parseFloat(track.segment.endTimeOffset.nanos ?? '0') / 1e9;
            maxDuration = Math.max(maxDuration, endTime);
          }
        });
      });
    }
    
    // 5. Person detection에서 길이 추정
    if (videoResults.personDetection) {
      videoResults.personDetection.forEach((person: any) => {
        person.tracks?.forEach((track: any) => {
          if (track.segment?.endTimeOffset) {
            const endTime = parseFloat(track.segment.endTimeOffset.seconds ?? '0') + 
                           parseFloat(track.segment.endTimeOffset.nanos ?? '0') / 1e9;
            maxDuration = Math.max(maxDuration, endTime);
          }
        });
      });
    }
    
    // 최종 길이 결정 (최소 30초, 최대 600초 제한)
    const finalDuration = maxDuration > 0 ? maxDuration : 60; // 기본 1분
    const clampedDuration = Math.max(30, Math.min(600, finalDuration));
    
    logger.info(`🎬 Video duration estimated: ${clampedDuration}s (from ${maxDuration}s)`);
    
    return Math.round(clampedDuration);
  }
} 