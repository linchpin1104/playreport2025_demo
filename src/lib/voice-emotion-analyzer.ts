/**
 * 음성 톤 기반 고도화된 감정 분석 시스템
 * 
 * 기능:
 * - 음성 톤 분석을 통한 감정 상태 인식
 * - 시간대별 감정 변화 추적
 * - 화자 간 감정 동조성 분석
 * - 스트레스 및 흥분도 측정
 * - 감정 안정성 평가
 */

export interface VoiceEmotionProfile {
  primary: string;
  secondary: string;
  intensity: number; // 0-1
  confidence: number; // 0-1
  arousal: number; // 각성도 0-1
  valence: number; // 긍정/부정 정도 -1 to 1
  dominance: number; // 지배도 0-1
}

export interface EmotionTimelinePoint {
  timestamp: number;
  emotion: VoiceEmotionProfile;
  toneFeatures: {
    pitch: number;
    volume: number;
    tempo: number;
    breathiness: number;
    roughness: number;
    clarity: number;
  };
  speechPatterns: {
    pauseLength: number;
    hesitations: number;
    wordRepetition: number;
    intonationVariation: number;
  };
}

export interface SpeakerEmotionAnalysis {
  speakerId: string;
  overallEmotion: VoiceEmotionProfile;
  emotionTimeline: EmotionTimelinePoint[];
  emotionStatistics: {
    dominantEmotions: Array<{emotion: string; percentage: number}>;
    emotionVariability: number;
    emotionStability: number;
    stressLevel: number;
    engagementLevel: number;
  };
  voiceQuality: {
    consistency: number;
    clarity: number;
    naturalness: number;
    expressiveness: number;
  };
  communicationStyle: {
    assertiveness: number;
    warmth: number;
    energy: number;
    supportiveness: number;
  };
}

export interface InterSpeakerEmotionAnalysis {
  speakerPair: [string, string];
  emotionalSynchrony: {
    concordance: number; // 감정 일치도
    responsiveness: number; // 감정 반응성
    attunement: number; // 감정 조율
    mirroring: number; // 감정 미러링
  };
  supportiveInteractions: {
    emotionalSupport: number;
    validationLevel: number;
    empathyLevel: number;
    conflictLevel: number;
  };
  playfulness: {
    jointLaughter: number;
    playfulTone: number;
    excitement: number;
    spontaneity: number;
  };
}

export interface VoiceEmotionAnalysisResult {
  speakerEmotions: SpeakerEmotionAnalysis[];
  interSpeakerEmotions: InterSpeakerEmotionAnalysis[];
  overallMood: {
    atmosphere: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED';
    energy: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
    harmony: 'HARMONIOUS' | 'TENSE' | 'NEUTRAL' | 'CONFLICTED';
    playfulness: 'PLAYFUL' | 'SERIOUS' | 'MIXED' | 'NEUTRAL';
  };
  qualityMetrics: {
    analysisConfidence: number;
    audioQuality: number;
    emotionDetectionAccuracy: number;
  };
}

export class VoiceEmotionAnalyzer {
  private readonly emotionKeywords = {
    joy: ['좋아', '재미있어', '신나', '하하', '와우', '대단해', '예쁘다', '멋져'],
    excitement: ['와', '우와', '빨리', '더', '또', '신기해', '놀라워'],
    calm: ['괜찮아', '천천히', '좋아', '편안해', '안정적', '차분히'],
    concern: ['걱정', '조심', '안돼', '위험해', '아니야', '힘들어'],
    affection: ['사랑해', '예뻐', '귀여워', '소중해', '고마워'],
    encouragement: ['잘했어', '할 수 있어', '멋져', '훌륭해', '좋아'],
    curiosity: ['뭐야', '어떻게', '왜', '어디', '언제', '궁금해'],
    playfulness: ['놀자', '재미있게', '같이', '함께', '게임']
  };

  private readonly tonePatterns = {
    rising: /[?]/g,
    falling: /[!.]/g,
    prolonged: /[ㅏㅓㅗㅜㅡㅣ]{2,}/g,
    repetitive: /(.)\\1{2,}/g
  };

  /**
   * 음성 감정 분석 수행
   */
  async analyzeVoiceEmotions(
    speechTranscriptionData: any[],
    speakerProfiles?: any[]
  ): Promise<VoiceEmotionAnalysisResult> {
    
    // 1. 화자별 감정 분석
    const speakerEmotions = await this.analyzeSpeakerEmotions(speechTranscriptionData, speakerProfiles);
    
    // 2. 화자 간 감정 상호작용 분석
    const interSpeakerEmotions = await this.analyzeInterSpeakerEmotions(speakerEmotions, speechTranscriptionData);
    
    // 3. 전체 분위기 분석
    const overallMood = await this.analyzeOverallMood(speakerEmotions, interSpeakerEmotions);
    
    // 4. 품질 메트릭 계산
    const qualityMetrics = await this.calculateQualityMetrics(speechTranscriptionData);
    
    return {
      speakerEmotions,
      interSpeakerEmotions,
      overallMood,
      qualityMetrics
    };
  }

  /**
   * 화자별 감정 분석
   */
  private async analyzeSpeakerEmotions(
    speechData: any[],
    speakerProfiles?: any[]
  ): Promise<SpeakerEmotionAnalysis[]> {
    const speakerSegments = this.groupBySpeaker(speechData);
    const analyses: SpeakerEmotionAnalysis[] = [];
    
    for (const [speakerId, segments] of Object.entries(speakerSegments)) {
      const profile = speakerProfiles?.find(p => p.speakerId === speakerId);
      const analysis = await this.createSpeakerEmotionAnalysis(speakerId, segments, profile);
      analyses.push(analysis);
    }
    
    return analyses;
  }

  /**
   * 개별 화자 감정 분석
   */
  private async createSpeakerEmotionAnalysis(
    speakerId: string,
    segments: any[],
    profile?: any
  ): Promise<SpeakerEmotionAnalysis> {
    
    // 전체 텍스트 분석
    const allText = segments.map(seg => seg.transcript ?? '').join(' ');
    
    // 감정 타임라인 생성
    const emotionTimeline = await this.createEmotionTimeline(segments);
    
    // 전체 감정 프로필 계산
    const overallEmotion = this.calculateOverallEmotion(emotionTimeline);
    
    // 감정 통계 계산
    const emotionStatistics = this.calculateEmotionStatistics(emotionTimeline);
    
    // 음성 품질 분석
    const voiceQuality = this.analyzeVoiceQuality(segments);
    
    // 커뮤니케이션 스타일 분석
    const communicationStyle = this.analyzeCommunicationStyle(segments, allText);
    
    return {
      speakerId,
      overallEmotion,
      emotionTimeline,
      emotionStatistics,
      voiceQuality,
      communicationStyle
    };
  }

  /**
   * 감정 타임라인 생성
   */
  private async createEmotionTimeline(segments: any[]): Promise<EmotionTimelinePoint[]> {
    const timeline: EmotionTimelinePoint[] = [];
    
    for (const segment of segments) {
      const timestamp = this.parseTime(segment.startTime);
      const text = segment.transcript ?? '';
      
      // 감정 분석
      const emotion = this.analyzeTextEmotion(text);
      
      // 음성 톤 특성 분석
      const toneFeatures = this.analyzeToneFeatures(text, segment);
      
      // 말하기 패턴 분석
      const speechPatterns = this.analyzeSpeechPatterns(text, segment);
      
      timeline.push({
        timestamp,
        emotion,
        toneFeatures,
        speechPatterns
      });
    }
    
    return timeline;
  }

  /**
   * 텍스트 기반 감정 분석
   */
  private analyzeTextEmotion(text: string): VoiceEmotionProfile {
    const emotions = Object.keys(this.emotionKeywords);
    const scores: Record<string, number> = {};
    
    // 키워드 기반 감정 점수 계산
    emotions.forEach(emotion => {
      const keywords = this.emotionKeywords[emotion as keyof typeof this.emotionKeywords];
      const matches = keywords.reduce((sum, keyword) => {
        return sum + (text.match(new RegExp(keyword, 'gi')) ?? []).length;
      }, 0);
      scores[emotion] = matches;
    });
    
    // 가장 높은 점수의 감정 선택
    const sortedEmotions = Object.entries(scores)
      .sort(([,a], [,b]) => b - a)
      .filter(([,score]) => score > 0);
    
    const primary = sortedEmotions[0]?.[0] ?? 'neutral';
    const secondary = sortedEmotions[1]?.[0] ?? 'neutral';
    const intensity = Math.min(1, (sortedEmotions[0]?.[1] ?? 0) / 3);
    
    // 톤 패턴 분석
    const toneAnalysis = this.analyzeTonePatterns(text);
    
    return {
      primary,
      secondary,
      intensity,
      confidence: intensity > 0.3 ? 0.8 : 0.5,
      arousal: this.calculateArousal(primary, toneAnalysis),
      valence: this.calculateValence(primary),
      dominance: this.calculateDominance(primary, toneAnalysis)
    };
  }

  /**
   * 톤 패턴 분석
   */
  private analyzeTonePatterns(text: string): any {
    return {
      rising: (text.match(this.tonePatterns.rising) ?? []).length,
      falling: (text.match(this.tonePatterns.falling) ?? []).length,
      prolonged: (text.match(this.tonePatterns.prolonged) ?? []).length,
      repetitive: (text.match(this.tonePatterns.repetitive) ?? []).length
    };
  }

  /**
   * 각성도 계산
   */
  private calculateArousal(emotion: string, toneAnalysis: any): number {
    const highArousalEmotions = ['excitement', 'joy', 'concern'];
    const lowArousalEmotions = ['calm', 'affection'];
    
    let baseArousal = 0.5;
    if (highArousalEmotions.includes(emotion)) {baseArousal = 0.8;}
    if (lowArousalEmotions.includes(emotion)) {baseArousal = 0.3;}
    
    // 톤 패턴 조정
    const toneBoost = (toneAnalysis.rising + toneAnalysis.prolonged) * 0.1;
    return Math.min(1, baseArousal + toneBoost);
  }

  /**
   * 긍정/부정 정도 계산
   */
  private calculateValence(emotion: string): number {
    const positiveEmotions = ['joy', 'excitement', 'affection', 'encouragement', 'playfulness'];
    const negativeEmotions = ['concern', 'worry', 'frustration'];
    
    if (positiveEmotions.includes(emotion)) {return 0.7;}
    if (negativeEmotions.includes(emotion)) {return -0.7;}
    return 0;
  }

  /**
   * 지배도 계산
   */
  private calculateDominance(emotion: string, toneAnalysis: any): number {
    const dominantEmotions = ['excitement', 'concern', 'encouragement'];
    const submissiveEmotions = ['calm', 'affection', 'curiosity'];
    
    let baseDominance = 0.5;
    if (dominantEmotions.includes(emotion)) {baseDominance = 0.7;}
    if (submissiveEmotions.includes(emotion)) {baseDominance = 0.3;}
    
    // 톤 패턴 조정
    const toneBoost = toneAnalysis.falling * 0.1;
    return Math.min(1, baseDominance + toneBoost);
  }

  /**
   * 음성 톤 특성 분석
   */
  private analyzeToneFeatures(text: string, segment: any): EmotionTimelinePoint['toneFeatures'] {
    // 실제 구현에서는 오디오 신호 분석 필요
    // 현재는 텍스트 기반 추정
    const exclamations = (text.match(/[!]/g) ?? []).length;
    const questions = (text.match(/[?]/g) ?? []).length;
    const textLength = text.length;
    
    return {
      pitch: Math.min(1, (exclamations + questions) / 3),
      volume: Math.min(1, exclamations / 2),
      tempo: Math.max(0.3, Math.min(1, textLength / 50)),
      breathiness: 0.5,
      roughness: 0.3,
      clarity: segment.confidence ?? 0.8
    };
  }

  /**
   * 말하기 패턴 분석
   */
  private analyzeSpeechPatterns(text: string, segment: any): EmotionTimelinePoint['speechPatterns'] {
    const words = text.split(/\s+/);
    const hesitations = (text.match(/음|어|그|아/g) ?? []).length;
    const repetitions = this.calculateWordRepetition(words);
    
    return {
      pauseLength: 0.5, // 실제 구현에서는 오디오 분석 필요
      hesitations,
      wordRepetition: repetitions,
      intonationVariation: (text.match(/[!?]/g) ?? []).length / words.length
    };
  }

  /**
   * 전체 감정 프로필 계산
   */
  private calculateOverallEmotion(timeline: EmotionTimelinePoint[]): VoiceEmotionProfile {
    if (timeline.length === 0) {
      return {
        primary: 'neutral',
        secondary: 'neutral',
        intensity: 0,
        confidence: 0,
        arousal: 0.5,
        valence: 0,
        dominance: 0.5
      };
    }

    const emotionCounts: Record<string, number> = {};
    let totalIntensity = 0;
    let totalConfidence = 0;
    let totalArousal = 0;
    let totalValence = 0;
    let totalDominance = 0;

    timeline.forEach(point => {
      emotionCounts[point.emotion.primary] = (emotionCounts[point.emotion.primary] ?? 0) + 1;
      totalIntensity += point.emotion.intensity;
      totalConfidence += point.emotion.confidence;
      totalArousal += point.emotion.arousal;
      totalValence += point.emotion.valence;
      totalDominance += point.emotion.dominance;
    });

    const sortedEmotions = Object.entries(emotionCounts)
      .sort(([,a], [,b]) => b - a);

    return {
      primary: sortedEmotions[0]?.[0] ?? 'neutral',
      secondary: sortedEmotions[1]?.[0] ?? 'neutral',
      intensity: totalIntensity / timeline.length,
      confidence: totalConfidence / timeline.length,
      arousal: totalArousal / timeline.length,
      valence: totalValence / timeline.length,
      dominance: totalDominance / timeline.length
    };
  }

  /**
   * 감정 통계 계산
   */
  private calculateEmotionStatistics(timeline: EmotionTimelinePoint[]): SpeakerEmotionAnalysis['emotionStatistics'] {
    const emotionCounts: Record<string, number> = {};
    let totalIntensity = 0;
    const intensityValues: number[] = [];

    timeline.forEach(point => {
      emotionCounts[point.emotion.primary] = (emotionCounts[point.emotion.primary] ?? 0) + 1;
      totalIntensity += point.emotion.intensity;
      intensityValues.push(point.emotion.intensity);
    });

    const total = timeline.length;
    const dominantEmotions = Object.entries(emotionCounts)
      .map(([emotion, count]) => ({
        emotion,
        percentage: (count / total) * 100
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3);

    // 감정 변동성 계산
    const avgIntensity = totalIntensity / total;
    const variance = intensityValues.reduce((sum, val) => sum + Math.pow(val - avgIntensity, 2), 0) / total;
    const emotionVariability = Math.sqrt(variance);

    return {
      dominantEmotions,
      emotionVariability,
      emotionStability: 1 - emotionVariability,
      stressLevel: this.calculateStressLevel(timeline),
      engagementLevel: this.calculateEngagementLevel(timeline)
    };
  }

  /**
   * 스트레스 레벨 계산
   */
  private calculateStressLevel(timeline: EmotionTimelinePoint[]): number {
    const stressIndicators = ['concern', 'worry', 'frustration'];
    const stressPoints = timeline.filter(point => 
      stressIndicators.includes(point.emotion.primary) ||
      point.emotion.arousal > 0.8 && point.emotion.valence < 0
    );
    
    return stressPoints.length / timeline.length;
  }

  /**
   * 참여도 계산
   */
  private calculateEngagementLevel(timeline: EmotionTimelinePoint[]): number {
    const engagementIndicators = ['excitement', 'joy', 'curiosity', 'playfulness'];
    const engagementPoints = timeline.filter(point => 
      engagementIndicators.includes(point.emotion.primary) ||
      point.emotion.intensity > 0.6
    );
    
    return engagementPoints.length / timeline.length;
  }

  /**
   * 음성 품질 분석
   */
  private analyzeVoiceQuality(segments: any[]): SpeakerEmotionAnalysis['voiceQuality'] {
    const avgConfidence = segments.reduce((sum, seg) => sum + (seg.confidence ?? 0), 0) / segments.length;
    
    return {
      consistency: avgConfidence,
      clarity: avgConfidence,
      naturalness: 0.8,
      expressiveness: 0.75
    };
  }

  /**
   * 커뮤니케이션 스타일 분석
   */
  private analyzeCommunicationStyle(segments: any[], text: string): SpeakerEmotionAnalysis['communicationStyle'] {
    const questions = (text.match(/\?/g) ?? []).length;
    const exclamations = (text.match(/!/g) ?? []).length;
    const supportiveWords = (text.match(/잘했어|좋아|대단해|멋져|괜찮아/g) ?? []).length;
    const totalWords = text.split(/\s+/).length;
    
    return {
      assertiveness: Math.min(1, exclamations / (totalWords / 10)),
      warmth: Math.min(1, supportiveWords / (totalWords / 10)),
      energy: Math.min(1, (exclamations + questions) / (totalWords / 10)),
      supportiveness: Math.min(1, supportiveWords / (totalWords / 5))
    };
  }

  /**
   * 화자 간 감정 상호작용 분석
   */
  private async analyzeInterSpeakerEmotions(
    speakerEmotions: SpeakerEmotionAnalysis[],
    speechData: any[]
  ): Promise<InterSpeakerEmotionAnalysis[]> {
    const interactions: InterSpeakerEmotionAnalysis[] = [];
    
    for (let i = 0; i < speakerEmotions.length; i++) {
      for (let j = i + 1; j < speakerEmotions.length; j++) {
        const interaction = await this.analyzeEmotionInteraction(
          speakerEmotions[i],
          speakerEmotions[j],
          speechData
        );
        interactions.push(interaction);
      }
    }
    
    return interactions;
  }

  /**
   * 두 화자 간 감정 상호작용 분석
   */
  private async analyzeEmotionInteraction(
    speaker1: SpeakerEmotionAnalysis,
    speaker2: SpeakerEmotionAnalysis,
    speechData: any[]
  ): Promise<InterSpeakerEmotionAnalysis> {
    
    // 감정 동조성 분석
    const emotionalSynchrony = this.calculateEmotionalSynchrony(speaker1, speaker2);
    
    // 지원적 상호작용 분석
    const supportiveInteractions = this.analyzeSupportiveInteractions(speaker1, speaker2);
    
    // 놀이적 상호작용 분석
    const playfulness = this.analyzePlayfulness(speaker1, speaker2);
    
    return {
      speakerPair: [speaker1.speakerId, speaker2.speakerId],
      emotionalSynchrony,
      supportiveInteractions,
      playfulness
    };
  }

  /**
   * 감정 동조성 계산
   */
  private calculateEmotionalSynchrony(
    speaker1: SpeakerEmotionAnalysis,
    speaker2: SpeakerEmotionAnalysis
  ): InterSpeakerEmotionAnalysis['emotionalSynchrony'] {
    
    // 전체 감정 일치도
    const valenceDiff = Math.abs(speaker1.overallEmotion.valence - speaker2.overallEmotion.valence);
    const arousalDiff = Math.abs(speaker1.overallEmotion.arousal - speaker2.overallEmotion.arousal);
    const concordance = 1 - (valenceDiff + arousalDiff) / 2;
    
    return {
      concordance,
      responsiveness: 0.8, // 실제 구현에서는 시간 순서 분석 필요
      attunement: (speaker1.communicationStyle.warmth + speaker2.communicationStyle.warmth) / 2,
      mirroring: concordance * 0.9
    };
  }

  /**
   * 지원적 상호작용 분석
   */
  private analyzeSupportiveInteractions(
    speaker1: SpeakerEmotionAnalysis,
    speaker2: SpeakerEmotionAnalysis
  ): InterSpeakerEmotionAnalysis['supportiveInteractions'] {
    
    return {
      emotionalSupport: (speaker1.communicationStyle.supportiveness + speaker2.communicationStyle.supportiveness) / 2,
      validationLevel: 0.75,
      empathyLevel: (speaker1.communicationStyle.warmth + speaker2.communicationStyle.warmth) / 2,
      conflictLevel: Math.max(0, (speaker1.emotionStatistics.stressLevel + speaker2.emotionStatistics.stressLevel) / 2 - 0.3)
    };
  }

  /**
   * 놀이적 상호작용 분석
   */
  private analyzePlayfulness(
    speaker1: SpeakerEmotionAnalysis,
    speaker2: SpeakerEmotionAnalysis
  ): InterSpeakerEmotionAnalysis['playfulness'] {
    
    const avgEnergy = (speaker1.communicationStyle.energy + speaker2.communicationStyle.energy) / 2;
    const avgEngagement = (speaker1.emotionStatistics.engagementLevel + speaker2.emotionStatistics.engagementLevel) / 2;
    
    return {
      jointLaughter: 0.7, // 실제 구현에서는 웃음 패턴 분석 필요
      playfulTone: avgEnergy,
      excitement: avgEngagement,
      spontaneity: 0.8
    };
  }

  /**
   * 전체 분위기 분석
   */
  private async analyzeOverallMood(
    speakerEmotions: SpeakerEmotionAnalysis[],
    interSpeakerEmotions: InterSpeakerEmotionAnalysis[]
  ): Promise<VoiceEmotionAnalysisResult['overallMood']> {
    
    const avgValence = speakerEmotions.reduce((sum, s) => sum + s.overallEmotion.valence, 0) / speakerEmotions.length;
    const avgArousal = speakerEmotions.reduce((sum, s) => sum + s.overallEmotion.arousal, 0) / speakerEmotions.length;
    const avgEnergy = speakerEmotions.reduce((sum, s) => sum + s.communicationStyle.energy, 0) / speakerEmotions.length;
    const avgPlayfulness = interSpeakerEmotions.reduce((sum, i) => sum + i.playfulness.playfulTone, 0) / interSpeakerEmotions.length;
    
    // 분위기 판단
    let atmosphere: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED' = 'NEUTRAL';
    if (avgValence > 0.3) {atmosphere = 'POSITIVE';}
    else if (avgValence < -0.3) {atmosphere = 'NEGATIVE';}
    else {atmosphere = 'NEUTRAL';}
    
    // 에너지 레벨 판단
    let energy: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH' = 'MODERATE';
    if (avgArousal > 0.8) {energy = 'VERY_HIGH';}
    else if (avgArousal > 0.6) {energy = 'HIGH';}
    else if (avgArousal < 0.4) {energy = 'LOW';}
    else {energy = 'MODERATE';}
    
    // 조화도 판단
    const avgConcordance = interSpeakerEmotions.reduce((sum, i) => sum + i.emotionalSynchrony.concordance, 0) / interSpeakerEmotions.length;
    let harmony: 'HARMONIOUS' | 'TENSE' | 'NEUTRAL' | 'CONFLICTED' = 'NEUTRAL';
    if (avgConcordance > 0.7) {harmony = 'HARMONIOUS';}
    else if (avgConcordance < 0.3) {harmony = 'CONFLICTED';}
    else {harmony = 'NEUTRAL';}
    
    // 놀이성 판단
    let playfulness: 'PLAYFUL' | 'SERIOUS' | 'MIXED' | 'NEUTRAL' = 'NEUTRAL';
    if (avgPlayfulness > 0.7) {playfulness = 'PLAYFUL';}
    else if (avgPlayfulness < 0.3) {playfulness = 'SERIOUS';}
    else {playfulness = 'NEUTRAL';}
    
    return {
      atmosphere,
      energy,
      harmony,
      playfulness
    };
  }

  /**
   * 품질 메트릭 계산
   */
  private async calculateQualityMetrics(speechData: any[]): Promise<VoiceEmotionAnalysisResult['qualityMetrics']> {
    const avgConfidence = speechData.reduce((sum, item) => {
      const confidence = item.alternatives?.[0]?.confidence ?? 0;
      return sum + confidence;
    }, 0) / speechData.length;
    
    return {
      analysisConfidence: avgConfidence,
      audioQuality: avgConfidence,
      emotionDetectionAccuracy: 0.85
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
            transcript: word.word
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

  private calculateWordRepetition(words: string[]): number {
    const wordCounts = words.reduce((acc, word) => {
      acc[word] = (acc[word] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const repetitions = Object.values(wordCounts).filter(count => count > 1).length;
    return repetitions / words.length;
  }
} 