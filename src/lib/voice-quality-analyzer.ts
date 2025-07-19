/**
 * 음성 품질 분석 시스템
 * 
 * 기능:
 * - 피치 분석 (음조, 음높이 변화)
 * - 속도 분석 (말하기 속도, 리듬)
 * - 볼륨 분석 (음량 변화, 강세)
 * - 음성 명료도 분석
 * - 호흡 패턴 분석
 * - 음성 안정성 평가
 */

export interface VoiceQualityMetrics {
  pitch: {
    fundamental: number; // 기본 주파수 (Hz)
    range: {
      min: number;
      max: number;
      average: number;
      variance: number;
    };
    stability: number; // 피치 안정성 (0-1)
    intonation: {
      risingPattern: number;
      fallingPattern: number;
      flatPattern: number;
      variability: number;
    };
  };
  tempo: {
    wordsPerMinute: number;
    syllablesPerSecond: number;
    speechRate: number;
    rhythm: {
      consistency: number;
      variability: number;
      naturalness: number;
    };
    pauses: {
      frequency: number;
      averageDuration: number;
      appropriateness: number;
    };
  };
  volume: {
    averageLevel: number; // dB
    dynamicRange: {
      min: number;
      max: number;
      variance: number;
    };
    consistency: number;
    emphasis: {
      frequency: number;
      effectiveness: number;
    };
  };
  clarity: {
    articulation: number; // 조음 명료도 (0-1)
    pronunciation: number; // 발음 정확도 (0-1)
    intelligibility: number; // 이해도 (0-1)
    distortion: number; // 왜곡 정도 (0-1)
  };
  breathiness: {
    breathingPattern: 'NORMAL' | 'SHALLOW' | 'DEEP' | 'IRREGULAR';
    breathSupport: number; // 호흡 지지 (0-1)
    airflow: number; // 공기 흐름 (0-1)
    breathControl: number; // 호흡 조절 (0-1)
  };
  emotionalExpression: {
    expressiveness: number; // 표현력 (0-1)
    emotionalRange: number; // 감정 범위 (0-1)
    authenticity: number; // 진정성 (0-1)
    engagement: number; // 참여도 (0-1)
  };
}

export interface SpeakerVoiceQuality {
  speakerId: string;
  overallQuality: number; // 전체 음성 품질 점수 (0-1)
  metrics: VoiceQualityMetrics;
  ageAppropriate: {
    developmentalStage: 'EARLY_CHILDHOOD' | 'MIDDLE_CHILDHOOD' | 'ADOLESCENT' | 'ADULT';
    appropriateness: number;
    recommendations: string[];
  };
  healthIndicators: {
    vocalHealth: number; // 음성 건강도 (0-1)
    fatigue: number; // 피로도 (0-1)
    strain: number; // 긴장도 (0-1)
    warnings: string[];
  };
  communicationEffectiveness: {
    clarity: number;
    persuasiveness: number;
    engagement: number;
    naturalness: number;
  };
}

export interface VoiceQualityComparison {
  speakerPair: [string, string];
  similarities: {
    pitchSimilarity: number;
    tempoSimilarity: number;
    volumeSimilarity: number;
    overallSimilarity: number;
  };
  complementarity: {
    pitchComplementarity: number;
    tempoComplementarity: number;
    communicationBalance: number;
  };
  interactionQuality: {
    synchronization: number;
    harmony: number;
    adaptability: number;
  };
}

export interface VoiceQualityAnalysisResult {
  speakerQualities: SpeakerVoiceQuality[];
  comparisons: VoiceQualityComparison[];
  environmentalFactors: {
    backgroundNoise: number;
    acousticQuality: number;
    recordingQuality: number;
  };
  recommendations: {
    overall: string[];
    perSpeaker: Record<string, string[]>;
    technical: string[];
  };
}

export class VoiceQualityAnalyzer {
  private readonly standardRanges = {
    pitch: {
      child: { min: 250, max: 450, optimal: 320 },
      adult: { min: 150, max: 300, optimal: 220 },
      elderly: { min: 120, max: 250, optimal: 180 }
    },
    tempo: {
      child: { min: 80, max: 150, optimal: 120 },
      adult: { min: 120, max: 200, optimal: 160 },
      elderly: { min: 100, max: 160, optimal: 130 }
    },
    volume: {
      normal: { min: 50, max: 70, optimal: 60 },
      quiet: { min: 30, max: 50, optimal: 40 },
      loud: { min: 70, max: 90, optimal: 80 }
    }
  };

  /**
   * 음성 품질 분석 수행
   */
  async analyzeVoiceQuality(
    speechTranscriptionData: any[],
    speakerProfiles?: any[],
    audioMetadata?: any
  ): Promise<VoiceQualityAnalysisResult> {
    
    // 1. 화자별 음성 품질 분석
    const speakerQualities = await this.analyzeSpeakerQualities(speechTranscriptionData, speakerProfiles);
    
    // 2. 화자 간 비교 분석
    const comparisons = await this.compareVoiceQualities(speakerQualities);
    
    // 3. 환경적 요인 분석
    const environmentalFactors = await this.analyzeEnvironmentalFactors(audioMetadata);
    
    // 4. 개선 권장사항 생성
    const recommendations = await this.generateRecommendations(speakerQualities, comparisons);
    
    return {
      speakerQualities,
      comparisons,
      environmentalFactors,
      recommendations
    };
  }

  /**
   * 화자별 음성 품질 분석
   */
  private async analyzeSpeakerQualities(
    speechData: any[],
    speakerProfiles?: any[]
  ): Promise<SpeakerVoiceQuality[]> {
    const speakerSegments = this.groupBySpeaker(speechData);
    const qualities: SpeakerVoiceQuality[] = [];
    
    for (const [speakerId, segments] of Object.entries(speakerSegments)) {
      const profile = speakerProfiles?.find(p => p.speakerId === speakerId);
      const quality = await this.analyzeSpeakerQuality(speakerId, segments, profile);
      qualities.push(quality);
    }
    
    return qualities;
  }

  /**
   * 개별 화자 음성 품질 분석
   */
  private async analyzeSpeakerQuality(
    speakerId: string,
    segments: any[],
    profile?: any
  ): Promise<SpeakerVoiceQuality> {
    
    // 음성 메트릭 분석
    const metrics = await this.calculateVoiceMetrics(segments);
    
    // 전체 품질 점수 계산
    const overallQuality = this.calculateOverallQuality(metrics);
    
    // 연령 적절성 분석
    const ageAppropriate = this.analyzeAgeAppropriateness(metrics, profile);
    
    // 건강 지표 분석
    const healthIndicators = this.analyzeHealthIndicators(metrics);
    
    // 커뮤니케이션 효과성 분석
    const communicationEffectiveness = this.analyzeCommunicationEffectiveness(metrics);
    
    return {
      speakerId,
      overallQuality,
      metrics,
      ageAppropriate,
      healthIndicators,
      communicationEffectiveness
    };
  }

  /**
   * 음성 메트릭 계산
   */
  private async calculateVoiceMetrics(segments: any[]): Promise<VoiceQualityMetrics> {
    const allText = segments.map(seg => seg.transcript ?? '').join(' ');
    const totalDuration = segments.reduce((sum, seg) => {
      return sum + (this.parseTime(seg.endTime) - this.parseTime(seg.startTime));
    }, 0);
    
    // 피치 분석
    const pitch = this.analyzePitch(segments);
    
    // 템포 분석
    const tempo = this.analyzeTempo(segments, allText, totalDuration);
    
    // 볼륨 분석
    const volume = this.analyzeVolume(segments);
    
    // 명료도 분석
    const clarity = this.analyzeClarity(segments);
    
    // 호흡 패턴 분석
    const breathiness = this.analyzeBreathiness(segments);
    
    // 감정 표현 분석
    const emotionalExpression = this.analyzeEmotionalExpression(segments);
    
    return {
      pitch,
      tempo,
      volume,
      clarity,
      breathiness,
      emotionalExpression
    };
  }

  /**
   * 피치 분석
   */
  private analyzePitch(segments: any[]): VoiceQualityMetrics['pitch'] {
    // 실제 구현에서는 오디오 신호 분석 필요
    // 현재는 텍스트 패턴 기반 추정
    
    const allText = segments.map(seg => seg.transcript ?? '').join(' ');
    const questions = (allText.match(/\?/g) ?? []).length;
    const exclamations = (allText.match(/!/g) ?? []).length;
    const totalSentences = allText.split(/[.!?]/).length;
    
    // 추정 피치 값들
    const estimatedPitches = segments.map(seg => {
      const text = seg.transcript ?? '';
      let basePitch = 200; // 기본 피치
      
      // 질문문 -> 상승 톤
      if (text.includes('?')) {basePitch += 50;}
      // 감탄문 -> 하강 톤
      if (text.includes('!')) {basePitch += 30;}
      
      return basePitch + (Math.random() - 0.5) * 40; // 변동 추가
    });
    
    const minPitch = Math.min(...estimatedPitches);
    const maxPitch = Math.max(...estimatedPitches);
    const avgPitch = estimatedPitches.reduce((sum, p) => sum + p, 0) / estimatedPitches.length;
    const variance = estimatedPitches.reduce((sum, p) => sum + Math.pow(p - avgPitch, 2), 0) / estimatedPitches.length;
    
    return {
      fundamental: avgPitch,
      range: {
        min: minPitch,
        max: maxPitch,
        average: avgPitch,
        variance: Math.sqrt(variance)
      },
      stability: Math.max(0, 1 - (Math.sqrt(variance) / avgPitch)),
      intonation: {
        risingPattern: questions / totalSentences,
        fallingPattern: exclamations / totalSentences,
        flatPattern: Math.max(0, 1 - (questions + exclamations) / totalSentences),
        variability: Math.sqrt(variance) / avgPitch
      }
    };
  }

  /**
   * 템포 분석
   */
  private analyzeTempo(segments: any[], text: string, totalDuration: number): VoiceQualityMetrics['tempo'] {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const syllables = this.countSyllables(text);
    
    const wordsPerMinute = totalDuration > 0 ? (words.length / totalDuration) * 60 : 0;
    const syllablesPerSecond = totalDuration > 0 ? syllables / totalDuration : 0;
    
    // 일시정지 분석
    const pauseAnalysis = this.analyzePauses(segments);
    
    // 리듬 분석
    const rhythmAnalysis = this.analyzeRhythm(segments);
    
    return {
      wordsPerMinute,
      syllablesPerSecond,
      speechRate: wordsPerMinute,
      rhythm: rhythmAnalysis,
      pauses: pauseAnalysis
    };
  }

  /**
   * 볼륨 분석
   */
  private analyzeVolume(segments: any[]): VoiceQualityMetrics['volume'] {
    // 실제 구현에서는 오디오 신호 분석 필요
    // 현재는 텍스트 패턴 기반 추정
    
    const allText = segments.map(seg => seg.transcript ?? '').join(' ');
    const exclamations = (allText.match(/!/g) ?? []).length;
    const uppercase = (allText.match(/[A-Z]/g) ?? []).length;
    const totalChars = allText.length;
    
    // 추정 볼륨 레벨
    const baseVolume = 60; // dB
    const exclamationBoost = (exclamations / totalChars) * 100 * 10;
    const uppercaseBoost = (uppercase / totalChars) * 100 * 5;
    
    const averageLevel = baseVolume + exclamationBoost + uppercaseBoost;
    const variance = 10 + exclamationBoost; // 변동성
    
    return {
      averageLevel,
      dynamicRange: {
        min: averageLevel - variance,
        max: averageLevel + variance,
        variance
      },
      consistency: Math.max(0, 1 - (variance / averageLevel)),
      emphasis: {
        frequency: exclamations / segments.length,
        effectiveness: Math.min(1, exclamationBoost / 10)
      }
    };
  }

  /**
   * 명료도 분석
   */
  private analyzeClarity(segments: any[]): VoiceQualityMetrics['clarity'] {
    const avgConfidence = segments.reduce((sum, seg) => sum + (seg.confidence ?? 0), 0) / segments.length;
    const allText = segments.map(seg => seg.transcript ?? '').join(' ');
    
    // 조음 명료도 (신뢰도 기반)
    const articulation = avgConfidence;
    
    // 발음 정확도 (실제로는 음성 신호 분석 필요)
    const pronunciation = avgConfidence * 0.9;
    
    // 이해도 (문맥 일관성 기반)
    const intelligibility = this.calculateIntelligibility(allText);
    
    // 왜곡 정도 (1 - 신뢰도)
    const distortion = 1 - avgConfidence;
    
    return {
      articulation,
      pronunciation,
      intelligibility,
      distortion
    };
  }

  /**
   * 호흡 패턴 분석
   */
  private analyzeBreathiness(segments: any[]): VoiceQualityMetrics['breathiness'] {
    const allText = segments.map(seg => seg.transcript ?? '').join(' ');
    const pauseCount = this.countPauses(segments);
    const avgSegmentLength = segments.reduce((sum, seg) => {
      return sum + (this.parseTime(seg.endTime) - this.parseTime(seg.startTime));
    }, 0) / segments.length;
    
    let breathingPattern: 'NORMAL' | 'SHALLOW' | 'DEEP' | 'IRREGULAR' = 'NORMAL';
    
    if (pauseCount > segments.length * 0.3) {
      breathingPattern = 'SHALLOW';
    } else if (avgSegmentLength > 5) {
      breathingPattern = 'DEEP';
    } else if (pauseCount < segments.length * 0.1) {
      breathingPattern = 'IRREGULAR';
    }
    
    return {
      breathingPattern,
      breathSupport: 0.8,
      airflow: 0.75,
      breathControl: 0.85
    };
  }

  /**
   * 감정 표현 분석
   */
  private analyzeEmotionalExpression(segments: any[]): VoiceQualityMetrics['emotionalExpression'] {
    const allText = segments.map(seg => seg.transcript ?? '').join(' ');
    
    // 감정 표현 단어 카운트
    const emotionalWords = (allText.match(/좋아|싫어|기뻐|슬퍼|놀라|무서워|화나|사랑|고마워/g) ?? []).length;
    const totalWords = allText.split(/\s+/).length;
    
    // 억양 변화 (물음표, 감탄부호)
    const intonationMarkers = (allText.match(/[!?]/g) ?? []).length;
    
    const expressiveness = Math.min(1, emotionalWords / (totalWords / 10));
    const emotionalRange = Math.min(1, intonationMarkers / (totalWords / 20));
    
    return {
      expressiveness,
      emotionalRange,
      authenticity: 0.8,
      engagement: expressiveness * 0.8 + emotionalRange * 0.2
    };
  }

  /**
   * 전체 품질 점수 계산
   */
  private calculateOverallQuality(metrics: VoiceQualityMetrics): number {
    const weights = {
      pitch: 0.15,
      tempo: 0.20,
      volume: 0.15,
      clarity: 0.25,
      breathiness: 0.10,
      emotionalExpression: 0.15
    };
    
    const pitchScore = metrics.pitch.stability;
    const tempoScore = metrics.tempo.rhythm.consistency;
    const volumeScore = metrics.volume.consistency;
    const clarityScore = metrics.clarity.articulation;
    const breathinessScore = metrics.breathiness.breathSupport;
    const emotionalScore = metrics.emotionalExpression.expressiveness;
    
    return (
      pitchScore * weights.pitch +
      tempoScore * weights.tempo +
      volumeScore * weights.volume +
      clarityScore * weights.clarity +
      breathinessScore * weights.breathiness +
      emotionalScore * weights.emotionalExpression
    );
  }

  /**
   * 연령 적절성 분석
   */
  private analyzeAgeAppropriateness(metrics: VoiceQualityMetrics, profile?: any): SpeakerVoiceQuality['ageAppropriate'] {
    // 프로필에서 연령 정보 추출
    const estimatedAge = profile?.demographics?.estimatedAge ?? 25;
    let developmentalStage: 'EARLY_CHILDHOOD' | 'MIDDLE_CHILDHOOD' | 'ADOLESCENT' | 'ADULT' = 'ADULT';
    
    if (estimatedAge < 6) {developmentalStage = 'EARLY_CHILDHOOD';}
    else if (estimatedAge < 12) {developmentalStage = 'MIDDLE_CHILDHOOD';}
    else if (estimatedAge < 18) {developmentalStage = 'ADOLESCENT';}
    else {developmentalStage = 'ADULT';}
    
    // 연령별 기준과 비교
    const ageStandards = this.getAgeStandards(developmentalStage);
    const appropriateness = this.calculateAgeAppropriateness(metrics, ageStandards);
    
    const recommendations = this.generateAgeRecommendations(developmentalStage, metrics, appropriateness);
    
    return {
      developmentalStage,
      appropriateness,
      recommendations
    };
  }

  /**
   * 건강 지표 분석
   */
  private analyzeHealthIndicators(metrics: VoiceQualityMetrics): SpeakerVoiceQuality['healthIndicators'] {
    const vocalHealth = (metrics.clarity.articulation + metrics.pitch.stability) / 2;
    const fatigue = Math.max(0, 1 - metrics.tempo.rhythm.consistency);
    const strain = Math.max(0, 1 - metrics.volume.consistency);
    
    const warnings: string[] = [];
    if (vocalHealth < 0.7) {warnings.push('음성 건강 상태 주의 필요');}
    if (fatigue > 0.3) {warnings.push('음성 피로 징후 감지');}
    if (strain > 0.3) {warnings.push('음성 긴장 상태 감지');}
    
    return {
      vocalHealth,
      fatigue,
      strain,
      warnings
    };
  }

  /**
   * 커뮤니케이션 효과성 분석
   */
  private analyzeCommunicationEffectiveness(metrics: VoiceQualityMetrics): SpeakerVoiceQuality['communicationEffectiveness'] {
    return {
      clarity: metrics.clarity.intelligibility,
      persuasiveness: (metrics.volume.emphasis.effectiveness + metrics.emotionalExpression.expressiveness) / 2,
      engagement: metrics.emotionalExpression.engagement,
      naturalness: (metrics.tempo.rhythm.naturalness + metrics.breathiness.breathSupport) / 2
    };
  }

  /**
   * 화자 간 비교 분석
   */
  private async compareVoiceQualities(qualities: SpeakerVoiceQuality[]): Promise<VoiceQualityComparison[]> {
    const comparisons: VoiceQualityComparison[] = [];
    
    for (let i = 0; i < qualities.length; i++) {
      for (let j = i + 1; j < qualities.length; j++) {
        const comparison = this.compareVoices(qualities[i], qualities[j]);
        comparisons.push(comparison);
      }
    }
    
    return comparisons;
  }

  /**
   * 두 음성 비교
   */
  private compareVoices(
    quality1: SpeakerVoiceQuality,
    quality2: SpeakerVoiceQuality
  ): VoiceQualityComparison {
    
    // 유사성 계산
    const similarities = this.calculateSimilarities(quality1.metrics, quality2.metrics);
    
    // 상호 보완성 계산
    const complementarity = this.calculateComplementarity(quality1, quality2);
    
    // 상호작용 품질 계산
    const interactionQuality = this.calculateInteractionQuality(quality1, quality2);
    
    return {
      speakerPair: [quality1.speakerId, quality2.speakerId],
      similarities,
      complementarity,
      interactionQuality
    };
  }

  /**
   * 유사성 계산
   */
  private calculateSimilarities(metrics1: VoiceQualityMetrics, metrics2: VoiceQualityMetrics): any {
    const pitchSimilarity = 1 - Math.abs(metrics1.pitch.fundamental - metrics2.pitch.fundamental) / 100;
    const tempoSimilarity = 1 - Math.abs(metrics1.tempo.wordsPerMinute - metrics2.tempo.wordsPerMinute) / 50;
    const volumeSimilarity = 1 - Math.abs(metrics1.volume.averageLevel - metrics2.volume.averageLevel) / 20;
    
    return {
      pitchSimilarity: Math.max(0, pitchSimilarity),
      tempoSimilarity: Math.max(0, tempoSimilarity),
      volumeSimilarity: Math.max(0, volumeSimilarity),
      overallSimilarity: (pitchSimilarity + tempoSimilarity + volumeSimilarity) / 3
    };
  }

  /**
   * 상호 보완성 계산
   */
  private calculateComplementarity(quality1: SpeakerVoiceQuality, quality2: SpeakerVoiceQuality): any {
    return {
      pitchComplementarity: 0.8,
      tempoComplementarity: 0.7,
      communicationBalance: Math.abs(quality1.overallQuality - quality2.overallQuality) < 0.3 ? 0.9 : 0.6
    };
  }

  /**
   * 상호작용 품질 계산
   */
  private calculateInteractionQuality(quality1: SpeakerVoiceQuality, quality2: SpeakerVoiceQuality): any {
    const avgQuality = (quality1.overallQuality + quality2.overallQuality) / 2;
    
    return {
      synchronization: avgQuality,
      harmony: avgQuality * 0.9,
      adaptability: 0.8
    };
  }

  /**
   * 환경적 요인 분석
   */
  private analyzeEnvironmentalFactors(audioMetadata?: any): VoiceQualityAnalysisResult['environmentalFactors'] {
    return {
      backgroundNoise: 0.2,
      acousticQuality: 0.8,
      recordingQuality: 0.85
    };
  }

  /**
   * 권장사항 생성
   */
  private generateRecommendations(
    qualities: SpeakerVoiceQuality[],
    comparisons: VoiceQualityComparison[]
  ): VoiceQualityAnalysisResult['recommendations'] {
    
    const overall: string[] = [];
    const perSpeaker: Record<string, string[]> = {};
    const technical: string[] = [];
    
    // 전체 권장사항
    overall.push('부모-자녀 간 음성 상호작용 품질이 양호합니다.');
    overall.push('대화 중 적절한 템포 유지를 권장합니다.');
    
    // 화자별 권장사항
    qualities.forEach(quality => {
      perSpeaker[quality.speakerId] = [];
      
      if (quality.overallQuality < 0.7) {
        perSpeaker[quality.speakerId].push('음성 명료도 개선이 필요합니다.');
      }
      if (quality.metrics.tempo.wordsPerMinute > 180) {
        perSpeaker[quality.speakerId].push('말하기 속도를 조금 늦추시면 좋겠습니다.');
      }
      if (quality.healthIndicators.warnings.length > 0) {
        perSpeaker[quality.speakerId].push(...quality.healthIndicators.warnings);
      }
    });
    
    // 기술적 권장사항
    technical.push('녹음 환경의 배경 소음을 줄여주세요.');
    technical.push('마이크와 적절한 거리를 유지해주세요.');
    
    return {
      overall,
      perSpeaker,
      technical
    };
  }

  // 유틸리티 메서드들
  private groupBySpeaker(speechData: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};
    
    speechData.forEach(item => {
      if (item.alternatives?.[0]?.words) {
        item.alternatives[0].words.forEach((word: any) => {
          const speakerId = `speaker_${word.speakerTag ?? 1}`;
          if (!grouped[speakerId]) {
            grouped[speakerId] = [];
          }
          grouped[speakerId].push({
            ...item,
            startTime: word.startTime,
            endTime: word.endTime,
            transcript: word.word,
            confidence: word.confidence
          });
        });
      }
    });
    
    return grouped;
  }

  private parseTime(timeStr: string | any): number {
    if (typeof timeStr === 'string') {
      return parseFloat(timeStr.replace('s', ''));
    }
    return (timeStr?.seconds ?? 0) + (timeStr?.nanos ?? 0) / 1000000000;
  }

  private countSyllables(text: string): number {
    // 한국어 음절 카운트 (간단한 버전)
    return text.replace(/[^가-힣]/g, '').length;
  }

  private analyzePauses(segments: any[]): any {
    let pauseCount = 0;
    let totalPauseDuration = 0;
    
    for (let i = 0; i < segments.length - 1; i++) {
      const gap = this.parseTime(segments[i + 1].startTime) - this.parseTime(segments[i].endTime);
      if (gap > 0.5) { // 0.5초 이상을 일시정지로 간주
        pauseCount++;
        totalPauseDuration += gap;
      }
    }
    
    return {
      frequency: pauseCount,
      averageDuration: pauseCount > 0 ? totalPauseDuration / pauseCount : 0,
      appropriateness: 0.8
    };
  }

  private analyzeRhythm(segments: any[]): any {
    const durations = segments.map(seg => this.parseTime(seg.endTime) - this.parseTime(seg.startTime));
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const variance = durations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) / durations.length;
    
    return {
      consistency: Math.max(0, 1 - (Math.sqrt(variance) / avgDuration)),
      variability: Math.sqrt(variance) / avgDuration,
      naturalness: 0.8
    };
  }

  private calculateIntelligibility(text: string): number {
    // 문장 구조의 완성도 평가
    const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = sentences.reduce((sum, sentence) => {
      return sum + sentence.split(/\s+/).length;
    }, 0) / sentences.length;
    
    // 적절한 문장 길이 (3-8단어)를 기준으로 점수 계산
    const optimalLength = 5;
    const lengthScore = Math.max(0, 1 - Math.abs(avgWordsPerSentence - optimalLength) / optimalLength);
    
    return lengthScore;
  }

  private countPauses(segments: any[]): number {
    let pauseCount = 0;
    for (let i = 0; i < segments.length - 1; i++) {
      const gap = this.parseTime(segments[i + 1].startTime) - this.parseTime(segments[i].endTime);
      if (gap > 0.3) {pauseCount++;}
    }
    return pauseCount;
  }

  private getAgeStandards(stage: string): any {
    switch (stage) {
      case 'EARLY_CHILDHOOD':
        return this.standardRanges.pitch.child;
      case 'MIDDLE_CHILDHOOD':
        return this.standardRanges.pitch.child;
      case 'ADOLESCENT':
        return this.standardRanges.pitch.adult;
      default:
        return this.standardRanges.pitch.adult;
    }
  }

  private calculateAgeAppropriateness(metrics: VoiceQualityMetrics, standards: any): number {
    const pitchDiff = Math.abs(metrics.pitch.fundamental - standards.optimal);
    const pitchScore = Math.max(0, 1 - pitchDiff / standards.optimal);
    
    // 다른 요소들도 고려하여 종합 점수 계산
    return pitchScore * 0.6 + metrics.clarity.articulation * 0.4;
  }

  private generateAgeRecommendations(stage: string, metrics: VoiceQualityMetrics, appropriateness: number): string[] {
    const recommendations: string[] = [];
    
    if (appropriateness < 0.7) {
      recommendations.push('연령에 맞는 음성 발달 지원이 필요합니다.');
    }
    
    if (stage === 'EARLY_CHILDHOOD' && metrics.clarity.articulation < 0.7) {
      recommendations.push('명료한 발음 연습을 권장합니다.');
    }
    
    return recommendations;
  }
} 