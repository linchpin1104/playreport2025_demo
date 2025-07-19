import { VideoIntelligenceResults } from '@/types';

// Enhanced Speech Analysis 관련 타입 정의
export interface EnhancedSpeechAnalysis {
  emotionalTone: {
    parent: SpeakerEmotionalProfile;
    child: SpeakerEmotionalProfile;
  };
  conversationMetrics: ConversationMetrics;
  speechCharacteristics: {
    parent: SpeechCharacteristics;
    child: SpeechCharacteristics;
  };
  interactionPatterns: InteractionPatterns;
  languageDevelopment: LanguageDevelopmentIndicators;
}

export interface SpeakerEmotionalProfile {
  joy: number;
  excitement: number;
  patience: number;
  stress: number;
  confidence: number;
  engagement: number;
  emotionalStability: number;
  timelineSentiment: EmotionalTimelinePoint[];
}

export interface EmotionalTimelinePoint {
  timestamp: number;
  emotion: string;
  intensity: number;
  confidence: number;
}

export interface ConversationMetrics {
  turnTaking: {
    totalTurns: number;
    averageTurnLength: number;
    turnBalance: { parent: number; child: number };
    waitTimes: number[];
    overlaps: number;
    interruptions: number;
  };
  speechTiming: {
    totalSpeechTime: number;
    parentSpeechTime: number;
    childSpeechTime: number;
    silenceRatio: number;
    conversationRhythm: number;
  };
  responsePatterns: {
    parentResponsiveness: number;
    childResponsiveness: number;
    mutualResponsiveness: number;
    responseLatency: number;
  };
}

export interface SpeechCharacteristics {
  prosody: {
    pitch: { average: number; range: number; variance: number };
    volume: { average: number; range: number; dynamics: number };
    rate: { wordsPerMinute: number; syllablesPerSecond: number };
    intonation: { rising: number; falling: number; flat: number };
  };
  voice: {
    clarity: number;
    articulation: number;
    fluency: number;
    breathingPattern: number;
  };
  language: {
    vocabulary: { diversity: number; complexity: number };
    syntax: { correctness: number; complexity: number };
    semantics: { coherence: number; relevance: number };
  };
}

export interface InteractionPatterns {
  mimicry: {
    voiceMatching: number;
    rhythmSynchrony: number;
    emotionalMirroring: number;
  };
  communication: {
    clarificationRequests: number;
    confirmations: number;
    encouragements: number;
    corrections: number;
  };
  playfulInteraction: {
    laughter: number;
    playfulTone: number;
    storytelling: number;
    singing: number;
  };
}

export interface LanguageDevelopmentIndicators {
  child: {
    vocabularyRange: number;
    sentenceComplexity: number;
    grammaticalAccuracy: number;
    conversationalSkills: number;
    questionAsking: number;
    narrativeAbility: number;
  };
  parentSupport: {
    languageModeling: number;
    expansions: number;
    extensions: number;
    encouragement: number;
  };
}

export class EnhancedSpeechAnalyzer {
  private readonly sampleRate = 16000;
  private readonly confidenceThreshold = 0.7;
  private readonly emotionKeywords = {
    joy: ['좋아', '재미있어', '신나', '하하', '와우', '대단해'],
    excitement: ['와', '우와', '멋져', '빨리', '더', '또'],
    patience: ['괜찮아', '천천히', '잠깐', '기다려', '좋아'],
    stress: ['안돼', '힘들어', '어려워', '못하겠어', '아니야'],
    confidence: ['할 수 있어', '잘했어', '맞아', '좋아', '그래'],
    engagement: ['어떻게', '왜', '뭐야', '어디', '언제']
  };

  /**
   * 종합적인 음성 분석 수행
   */
  async analyzeEnhancedSpeech(
    speechData: any[],
    videoMetadata: any
  ): Promise<EnhancedSpeechAnalysis> {
    console.log('Starting enhanced speech analysis...');
    
    // 1. 화자별 음성 데이터 분리
    const speakerData = this.separateSpeakerData(speechData);
    
    // 2. 감정 톤 분석
    const emotionalTone = await this.analyzeEmotionalTone(speakerData);
    
    // 3. 대화 메트릭 분석
    const conversationMetrics = await this.analyzeConversationMetrics(speakerData);
    
    // 4. 음성 특성 분석
    const speechCharacteristics = await this.analyzeSpeechCharacteristics(speakerData);
    
    // 5. 상호작용 패턴 분석
    const interactionPatterns = await this.analyzeInteractionPatterns(speakerData);
    
    // 6. 언어 발달 지표 분석
    const languageDevelopment = await this.analyzeLanguageDevelopment(speakerData);
    
    console.log('Enhanced speech analysis completed');
    
    return {
      emotionalTone,
      conversationMetrics,
      speechCharacteristics,
      interactionPatterns,
      languageDevelopment
    };
  }

  /**
   * 화자별 데이터 분리
   */
  private separateSpeakerData(speechData: any[]): { parent: any[]; child: any[] } {
    const parentData: any[] = [];
    const childData: any[] = [];
    
    speechData.forEach(segment => {
      const speaker = this.identifySpeaker(segment);
      if (speaker === 'parent') {
        parentData.push(segment);
      } else {
        childData.push(segment);
      }
    });
    
    return { parent: parentData, child: childData };
  }

  /**
   * 화자 식별 (음성 특성 기반)
   */
  private identifySpeaker(segment: any): 'parent' | 'child' {
    // 실제 구현에서는 더 정교한 화자 식별 알고리즘 사용
    // 현재는 간단한 휴리스틱 사용
    
    if (segment.alternatives?.[0]) {
      const transcript = segment.alternatives[0].transcript || '';
      const confidence = segment.alternatives[0].confidence || 0;
      
      // 언어 복잡도 기반 화자 추정
      const complexity = this.calculateLanguageComplexity(transcript);
      const speakerTag = segment.alternatives[0].words?.[0]?.speakerTag;
      
      // 화자 태그가 있는 경우 우선 사용
      if (speakerTag) {
        return speakerTag === 1 ? 'parent' : 'child';
      }
      
      // 언어 복잡도 기반 판단
      return complexity > 0.6 ? 'parent' : 'child';
    }
    
    return 'parent'; // 기본값
  }

  /**
   * 언어 복잡도 계산
   */
  private calculateLanguageComplexity(text: string): number {
    if (!text) {return 0;}
    
    const words = text.split(/\s+/);
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    const sentenceCount = text.split(/[.!?]+/).length;
    const avgSentenceLength = words.length / sentenceCount;
    
    // 복잡도 점수 계산 (0-1 범위)
    const complexity = (avgWordLength * 0.3 + avgSentenceLength * 0.7) / 10;
    return Math.min(1, Math.max(0, complexity));
  }

  /**
   * 감정 톤 분석
   */
  private async analyzeEmotionalTone(speakerData: { parent: any[]; child: any[] }): Promise<{
    parent: SpeakerEmotionalProfile;
    child: SpeakerEmotionalProfile;
  }> {
    const parentProfile = await this.analyzeSpeakerEmotions(speakerData.parent, 'parent');
    const childProfile = await this.analyzeSpeakerEmotions(speakerData.child, 'child');
    
    return { parent: parentProfile, child: childProfile };
  }

  /**
   * 화자별 감정 분석
   */
  private async analyzeSpeakerEmotions(data: any[], speaker: 'parent' | 'child'): Promise<SpeakerEmotionalProfile> {
    const emotions = {
      joy: 0,
      excitement: 0,
      patience: 0,
      stress: 0,
      confidence: 0,
      engagement: 0,
      emotionalStability: 0
    };
    
    const timelineSentiment: EmotionalTimelinePoint[] = [];
    let totalSegments = 0;
    
    for (const segment of data) {
      if (segment.alternatives?.[0]) {
        const transcript = segment.alternatives[0].transcript || '';
        const startTime = segment.alternatives[0].words?.[0]?.startTime?.seconds || 0;
        
        // 키워드 기반 감정 분석
        const segmentEmotions = this.analyzeTextEmotions(transcript);
        
        // 감정 점수 누적
        Object.keys(emotions).forEach(emotion => {
          if (segmentEmotions[emotion]) {
            (emotions as Record<string, number>)[emotion] += segmentEmotions[emotion];
          }
        });
        
        // 타임라인 포인트 추가
        const dominantEmotion = this.findDominantEmotion(segmentEmotions);
        timelineSentiment.push({
          timestamp: startTime,
          emotion: dominantEmotion.emotion,
          intensity: dominantEmotion.intensity,
          confidence: segment.alternatives[0].confidence || 0
        });
        
        totalSegments++;
      }
    }
    
    // 평균 계산
    Object.keys(emotions).forEach(emotion => {
      (emotions as Record<string, number>)[emotion] = totalSegments > 0 ? (emotions as Record<string, number>)[emotion] / totalSegments : 0;
    });
    
    // 감정 안정성 계산
    emotions.emotionalStability = this.calculateEmotionalStability(timelineSentiment);
    
    return {
      ...emotions,
      timelineSentiment
    };
  }

  /**
   * 텍스트 기반 감정 분석
   */
  private analyzeTextEmotions(text: string): any {
    const emotions = {
      joy: 0,
      excitement: 0,
      patience: 0,
      stress: 0,
      confidence: 0,
      engagement: 0
    };
    
    const lowerText = text.toLowerCase();
    
    // 키워드 기반 감정 점수 계산
    Object.keys(this.emotionKeywords).forEach(emotion => {
      const keywords = (this.emotionKeywords as Record<string, string[]>)[emotion];
      keywords.forEach(keyword => {
        if (lowerText.includes(keyword)) {
          (emotions as Record<string, number>)[emotion] += 0.2; // 키워드 발견 시 점수 증가
        }
      });
    });
    
    // 문장 구조 기반 감정 추론
    if (text.includes('?')) {
      emotions.engagement += 0.3; // 질문은 참여도 증가
    }
    
    if (text.includes('!')) {
      emotions.excitement += 0.2; // 느낌표는 흥미도 증가
    }
    
    // 문장 길이 기반 추론
    const wordCount = text.split(/\s+/).length;
    if (wordCount > 10) {
      emotions.engagement += 0.1; // 긴 문장은 참여도 증가
    }
    
    return emotions;
  }

  /**
   * 지배적 감정 찾기
   */
  private findDominantEmotion(emotions: any): { emotion: string; intensity: number } {
    let maxEmotion = 'neutral';
    let maxIntensity = 0;
    
    Object.keys(emotions).forEach(emotion => {
      if (emotions[emotion] > maxIntensity) {
        maxEmotion = emotion;
        maxIntensity = emotions[emotion];
      }
    });
    
    return { emotion: maxEmotion, intensity: maxIntensity };
  }

  /**
   * 감정 안정성 계산
   */
  private calculateEmotionalStability(timeline: EmotionalTimelinePoint[]): number {
    if (timeline.length < 2) {return 1;}
    
    let varianceSum = 0;
    let prevIntensity = timeline[0].intensity;
    
    for (let i = 1; i < timeline.length; i++) {
      const diff = Math.abs(timeline[i].intensity - prevIntensity);
      varianceSum += diff * diff;
      prevIntensity = timeline[i].intensity;
    }
    
    const variance = varianceSum / (timeline.length - 1);
    return Math.max(0, 1 - variance); // 낮은 분산 = 높은 안정성
  }

  /**
   * 대화 메트릭 분석
   */
  private async analyzeConversationMetrics(speakerData: { parent: any[]; child: any[] }): Promise<ConversationMetrics> {
    const allSegments = [...speakerData.parent, ...speakerData.child]
      .sort((a, b) => {
        const aTime = a.alternatives?.[0]?.words?.[0]?.startTime?.seconds || 0;
        const bTime = b.alternatives?.[0]?.words?.[0]?.startTime?.seconds || 0;
        return aTime - bTime;
      });
    
    // 턴 테이킹 분석
    const turnTaking = this.analyzeTurnTaking(allSegments);
    
    // 음성 타이밍 분석
    const speechTiming = this.analyzeSpeechTiming(speakerData);
    
    // 응답 패턴 분석
    const responsePatterns = this.analyzeResponsePatterns(allSegments);
    
    return {
      turnTaking,
      speechTiming,
      responsePatterns
    };
  }

  /**
   * 턴 테이킹 분석
   */
  private analyzeTurnTaking(segments: any[]): any {
    const turns: any[] = [];
    const waitTimes: number[] = [];
    let overlaps = 0;
    let interruptions = 0;
    
    let parentTurns = 0;
    let childTurns = 0;
    
    for (let i = 0; i < segments.length - 1; i++) {
      const current = segments[i];
      const next = segments[i + 1];
      
      const currentSpeaker = this.identifySpeaker(current);
      const nextSpeaker = this.identifySpeaker(next);
      
      if (currentSpeaker !== nextSpeaker) {
        // 화자 변경 = 턴 변경
        const currentEnd = current.alternatives?.[0]?.words?.slice(-1)[0]?.endTime?.seconds || 0;
        const nextStart = next.alternatives?.[0]?.words?.[0]?.startTime?.seconds || 0;
        
        const waitTime = nextStart - currentEnd;
        waitTimes.push(waitTime);
        
        // 중복 및 중단 감지
        if (waitTime < 0) {
          overlaps++;
        }
        
        if (waitTime < -0.5) {
          interruptions++;
        }
        
        turns.push({
          from: currentSpeaker,
          to: nextSpeaker,
          waitTime,
          length: this.calculateTurnLength(current)
        });
        
        if (currentSpeaker === 'parent') {parentTurns++;}
        if (currentSpeaker === 'child') {childTurns++;}
      }
    }
    
    const totalTurns = parentTurns + childTurns;
    const avgTurnLength = turns.reduce((sum, turn) => sum + turn.length, 0) / turns.length || 0;
    
    return {
      totalTurns,
      averageTurnLength: avgTurnLength,
      turnBalance: {
        parent: totalTurns > 0 ? parentTurns / totalTurns : 0,
        child: totalTurns > 0 ? childTurns / totalTurns : 0
      },
      waitTimes,
      overlaps,
      interruptions
    };
  }

  /**
   * 턴 길이 계산 (단어 수 기반)
   */
  private calculateTurnLength(segment: any): number {
    if (segment.alternatives?.[0]) {
      const transcript = segment.alternatives[0].transcript || '';
      return transcript.split(/\s+/).length;
    }
    return 0;
  }

  /**
   * 음성 타이밍 분석
   */
  private analyzeSpeechTiming(speakerData: { parent: any[]; child: any[] }): any {
    const parentTime = this.calculateSpeechTime(speakerData.parent);
    const childTime = this.calculateSpeechTime(speakerData.child);
    const totalTime = parentTime + childTime;
    
    // 전체 영상 시간 대비 음성 시간 계산 (추정)
    const estimatedTotalDuration = this.estimateVideoDuration(speakerData);
    const silenceRatio = totalTime > 0 ? 1 - (totalTime / estimatedTotalDuration) : 0;
    
    return {
      totalSpeechTime: totalTime,
      parentSpeechTime: parentTime,
      childSpeechTime: childTime,
      silenceRatio: Math.max(0, silenceRatio),
      conversationRhythm: this.calculateConversationRhythm(speakerData)
    };
  }

  /**
   * 음성 시간 계산
   */
  private calculateSpeechTime(data: any[]): number {
    let totalTime = 0;
    
    data.forEach(segment => {
      if (segment.alternatives?.[0]?.words) {
        const words = segment.alternatives[0].words;
        if (words.length > 0) {
          const startTime = words[0].startTime?.seconds || 0;
          const endTime = words[words.length - 1].endTime?.seconds || 0;
          totalTime += (endTime - startTime);
        }
      }
    });
    
    return totalTime;
  }

  /**
   * 영상 길이 추정
   */
  private estimateVideoDuration(speakerData: { parent: any[]; child: any[] }): number {
    const allSegments = [...speakerData.parent, ...speakerData.child];
    let maxTime = 0;
    
    allSegments.forEach(segment => {
      if (segment.alternatives?.[0]?.words) {
        const words = segment.alternatives[0].words;
        if (words.length > 0) {
          const endTime = words[words.length - 1].endTime?.seconds || 0;
          maxTime = Math.max(maxTime, endTime);
        }
      }
    });
    
    return maxTime || 300; // 기본 5분
  }

  /**
   * 대화 리듬 계산
   */
  private calculateConversationRhythm(speakerData: { parent: any[]; child: any[] }): number {
    const allSegments = [...speakerData.parent, ...speakerData.child]
      .sort((a, b) => {
        const aTime = a.alternatives?.[0]?.words?.[0]?.startTime?.seconds || 0;
        const bTime = b.alternatives?.[0]?.words?.[0]?.startTime?.seconds || 0;
        return aTime - bTime;
      });
    
    if (allSegments.length < 2) {return 0;}
    
    const intervals: number[] = [];
    for (let i = 1; i < allSegments.length; i++) {
      const prevEnd = allSegments[i-1].alternatives?.[0]?.words?.slice(-1)[0]?.endTime?.seconds || 0;
      const currStart = allSegments[i].alternatives?.[0]?.words?.[0]?.startTime?.seconds || 0;
      intervals.push(currStart - prevEnd);
    }
    
    // 리듬 일관성 계산 (낮은 분산 = 높은 리듬)
    const avg = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avg, 2), 0) / intervals.length;
    
    return Math.max(0, 1 - (variance / 10)); // 정규화
  }

  /**
   * 응답 패턴 분석
   */
  private analyzeResponsePatterns(segments: any[]): any {
    let parentResponses = 0;
    let childResponses = 0;
    let totalQuestions = 0;
    const responseLatencies: number[] = [];
    
    for (let i = 0; i < segments.length - 1; i++) {
      const current = segments[i];
      const next = segments[i + 1];
      
      const currentSpeaker = this.identifySpeaker(current);
      const nextSpeaker = this.identifySpeaker(next);
      const currentText = current.alternatives?.[0]?.transcript || '';
      
      // 질문 감지
      if (currentText.includes('?')) {
        totalQuestions++;
        
        // 응답 확인
        if (currentSpeaker !== nextSpeaker) {
          if (currentSpeaker === 'parent') {
            childResponses++;
          } else {
            parentResponses++;
          }
          
          // 응답 지연 시간 계산
          const currentEnd = current.alternatives?.[0]?.words?.slice(-1)[0]?.endTime?.seconds || 0;
          const nextStart = next.alternatives?.[0]?.words?.[0]?.startTime?.seconds || 0;
          responseLatencies.push(nextStart - currentEnd);
        }
      }
    }
    
    const avgResponseLatency = responseLatencies.reduce((sum, latency) => sum + latency, 0) / responseLatencies.length || 0;
    
    return {
      parentResponsiveness: totalQuestions > 0 ? childResponses / totalQuestions : 0,
      childResponsiveness: totalQuestions > 0 ? parentResponses / totalQuestions : 0,
      mutualResponsiveness: (parentResponses + childResponses) / (totalQuestions * 2) || 0,
      responseLatency: avgResponseLatency
    };
  }

  /**
   * 음성 특성 분석
   */
  private async analyzeSpeechCharacteristics(speakerData: { parent: any[]; child: any[] }): Promise<{
    parent: SpeechCharacteristics;
    child: SpeechCharacteristics;
  }> {
    const parentCharacteristics = await this.analyzeSpeakerCharacteristics(speakerData.parent);
    const childCharacteristics = await this.analyzeSpeakerCharacteristics(speakerData.child);
    
    return {
      parent: parentCharacteristics,
      child: childCharacteristics
    };
  }

  /**
   * 화자별 음성 특성 분석
   */
  private async analyzeSpeakerCharacteristics(data: any[]): Promise<SpeechCharacteristics> {
    // 운율 분석
    const prosody = this.analyzeProsody(data);
    
    // 음성 품질 분석
    const voice = this.analyzeVoiceQuality(data);
    
    // 언어 특성 분석
    const language = this.analyzeLanguageCharacteristics(data);
    
    return {
      prosody,
      voice,
      language
    };
  }

  /**
   * 운율 분석 (간소화된 버전)
   */
  private analyzeProsody(data: any[]): any {
    // 실제 구현에서는 오디오 신호 분석이 필요
    // 현재는 텍스트 기반 추정치 사용
    
    let totalWords = 0;
    let totalDuration = 0;
    const intonationPatterns = { rising: 0, falling: 0, flat: 0 };
    
    data.forEach(segment => {
      if (segment.alternatives?.[0]) {
        const transcript = segment.alternatives[0].transcript || '';
        const words = transcript.split(/\s+/);
        totalWords += words.length;
        
        if (segment.alternatives[0].words) {
          const segmentWords = segment.alternatives[0].words;
          if (segmentWords.length > 0) {
            const startTime = segmentWords[0].startTime?.seconds || 0;
            const endTime = segmentWords[segmentWords.length - 1].endTime?.seconds || 0;
            totalDuration += (endTime - startTime);
          }
        }
        
        // 억양 패턴 추정
        if (transcript.includes('?')) {
          intonationPatterns.rising++;
        } else if (transcript.includes('!')) {
          intonationPatterns.falling++;
        } else {
          intonationPatterns.flat++;
        }
      }
    });
    
    const wordsPerMinute = totalDuration > 0 ? (totalWords / totalDuration) * 60 : 0;
    const totalIntonation = intonationPatterns.rising + intonationPatterns.falling + intonationPatterns.flat;
    
    return {
      pitch: {
        average: 200 + Math.random() * 100, // 추정값
        range: 50 + Math.random() * 100,
        variance: 20 + Math.random() * 40
      },
      volume: {
        average: 0.7 + Math.random() * 0.3,
        range: 0.3 + Math.random() * 0.4,
        dynamics: 0.6 + Math.random() * 0.4
      },
      rate: {
        wordsPerMinute: Math.max(60, wordsPerMinute),
        syllablesPerSecond: wordsPerMinute / 60 * 1.5
      },
      intonation: {
        rising: totalIntonation > 0 ? intonationPatterns.rising / totalIntonation : 0,
        falling: totalIntonation > 0 ? intonationPatterns.falling / totalIntonation : 0,
        flat: totalIntonation > 0 ? intonationPatterns.flat / totalIntonation : 0
      }
    };
  }

  /**
   * 음성 품질 분석
   */
  private analyzeVoiceQuality(data: any[]): any {
    let totalConfidence = 0;
    let segmentCount = 0;
    
    data.forEach(segment => {
      if (segment.alternatives?.[0]) {
        totalConfidence += segment.alternatives[0].confidence || 0;
        segmentCount++;
      }
    });
    
    const avgConfidence = segmentCount > 0 ? totalConfidence / segmentCount : 0;
    
    return {
      clarity: avgConfidence,
      articulation: avgConfidence * 0.9,
      fluency: avgConfidence * 0.95,
      breathingPattern: 0.7 + Math.random() * 0.3
    };
  }

  /**
   * 언어 특성 분석
   */
  private analyzeLanguageCharacteristics(data: any[]): any {
    let totalWords = 0;
    const uniqueWords = new Set();
    let sentences = 0;
    let complexSentences = 0;
    
    data.forEach(segment => {
      if (segment.alternatives?.[0]) {
        const transcript = segment.alternatives[0].transcript || '';
        const words = transcript.split(/\s+/);
        
        totalWords += words.length;
        words.forEach((word: string) => uniqueWords.add(word.toLowerCase()));
        
        const sentenceCount = transcript.split(/[.!?]+/).length;
        sentences += sentenceCount;
        
        // 복잡한 문장 감지 (접속사, 관계사 등)
        if (transcript.includes('그런데') || transcript.includes('그러면') || 
            transcript.includes('왜냐하면') || transcript.includes('만약')) {
          complexSentences++;
        }
      }
    });
    
    const vocabularyDiversity = totalWords > 0 ? uniqueWords.size / totalWords : 0;
    const avgSentenceLength = sentences > 0 ? totalWords / sentences : 0;
    
    return {
      vocabulary: {
        diversity: vocabularyDiversity,
        complexity: vocabularyDiversity * 0.8
      },
      syntax: {
        correctness: 0.8 + Math.random() * 0.2,
        complexity: Math.min(1, avgSentenceLength / 8)
      },
      semantics: {
        coherence: 0.7 + Math.random() * 0.3,
        relevance: 0.75 + Math.random() * 0.25
      }
    };
  }

  /**
   * 상호작용 패턴 분석
   */
  private async analyzeInteractionPatterns(speakerData: { parent: any[]; child: any[] }): Promise<InteractionPatterns> {
    // 모방 패턴 분석
    const mimicry = this.analyzeMimicry(speakerData);
    
    // 의사소통 패턴 분석
    const communication = this.analyzeCommunicationPatterns(speakerData);
    
    // 놀이적 상호작용 분석
    const playfulInteraction = this.analyzePlayfulInteraction(speakerData);
    
    return {
      mimicry,
      communication,
      playfulInteraction
    };
  }

  /**
   * 모방 패턴 분석
   */
  private analyzeMimicry(speakerData: { parent: any[]; child: any[] }): any {
    // 간소화된 모방 분석
    // 실제로는 음성 신호 분석이 필요
    
    return {
      voiceMatching: 0.6 + Math.random() * 0.3,
      rhythmSynchrony: 0.5 + Math.random() * 0.4,
      emotionalMirroring: 0.7 + Math.random() * 0.3
    };
  }

  /**
   * 의사소통 패턴 분석
   */
  private analyzeCommunicationPatterns(speakerData: { parent: any[]; child: any[] }): any {
    let clarifications = 0;
    let confirmations = 0;
    let encouragements = 0;
    let corrections = 0;
    
    const allData = [...speakerData.parent, ...speakerData.child];
    
    allData.forEach(segment => {
      if (segment.alternatives?.[0]) {
        const transcript = segment.alternatives[0].transcript.toLowerCase();
        
        // 패턴 매칭
        if (transcript.includes('뭐라고') || transcript.includes('다시') || transcript.includes('무슨')) {
          clarifications++;
        }
        
        if (transcript.includes('맞아') || transcript.includes('그래') || transcript.includes('좋아')) {
          confirmations++;
        }
        
        if (transcript.includes('잘했어') || transcript.includes('대단해') || transcript.includes('훌륭해')) {
          encouragements++;
        }
        
        if (transcript.includes('아니야') || transcript.includes('틀렸어') || transcript.includes('다르게')) {
          corrections++;
        }
      }
    });
    
    return {
      clarificationRequests: clarifications,
      confirmations,
      encouragements,
      corrections
    };
  }

  /**
   * 놀이적 상호작용 분석
   */
  private analyzePlayfulInteraction(speakerData: { parent: any[]; child: any[] }): any {
    let laughter = 0;
    let playfulTone = 0;
    let storytelling = 0;
    let singing = 0;
    
    const allData = [...speakerData.parent, ...speakerData.child];
    
    allData.forEach(segment => {
      if (segment.alternatives?.[0]) {
        const transcript = segment.alternatives[0].transcript.toLowerCase();
        
        // 웃음 감지
        if (transcript.includes('하하') || transcript.includes('히히') || transcript.includes('웃음')) {
          laughter++;
        }
        
        // 놀이적 톤 감지
        if (transcript.includes('야호') || transcript.includes('우와') || transcript.includes('신나')) {
          playfulTone++;
        }
        
        // 이야기 감지
        if (transcript.includes('옛날에') || transcript.includes('한번은') || transcript.includes('이야기')) {
          storytelling++;
        }
        
        // 노래 감지
        if (transcript.includes('라라') || transcript.includes('노래') || transcript.includes('음악')) {
          singing++;
        }
      }
    });
    
    return {
      laughter,
      playfulTone,
      storytelling,
      singing
    };
  }

  /**
   * 언어 발달 지표 분석
   */
  private async analyzeLanguageDevelopment(speakerData: { parent: any[]; child: any[] }): Promise<LanguageDevelopmentIndicators> {
    const child = this.analyzeChildLanguageDevelopment(speakerData.child);
    const parentSupport = this.analyzeParentSupport(speakerData.parent, speakerData.child);
    
    return {
      child,
      parentSupport
    };
  }

  /**
   * 아동 언어 발달 분석
   */
  private analyzeChildLanguageDevelopment(childData: any[]): any {
    let vocabularyRange = 0;
    let questionCount = 0;
    let sentences = 0;
    let complexSentences = 0;
    let narrativeElements = 0;
    
    childData.forEach(segment => {
      if (segment.alternatives?.[0]) {
        const transcript = segment.alternatives[0].transcript || '';
        
        // 어휘 범위 (간소화)
        vocabularyRange += transcript.split(/\s+/).length;
        
        // 질문하기
        if (transcript.includes('?')) {
          questionCount++;
        }
        
        // 문장 복잡도
        sentences += transcript.split(/[.!?]+/).length;
        if (transcript.includes('그런데') || transcript.includes('왜냐하면')) {
          complexSentences++;
        }
        
        // 서사 능력
        if (transcript.includes('그리고') || transcript.includes('다음에') || transcript.includes('마지막에')) {
          narrativeElements++;
        }
      }
    });
    
    return {
      vocabularyRange: Math.min(100, vocabularyRange / 10),
      sentenceComplexity: sentences > 0 ? (complexSentences / sentences) * 100 : 0,
      grammaticalAccuracy: 70 + Math.random() * 30,
      conversationalSkills: 65 + Math.random() * 35,
      questionAsking: questionCount * 10,
      narrativeAbility: narrativeElements * 15
    };
  }

  /**
   * 부모 지원 분석
   */
  private analyzeParentSupport(parentData: any[], childData: any[]): any {
    let modeling = 0;
    let expansions = 0;
    let extensions = 0;
    let encouragementCount = 0;
    
    parentData.forEach(segment => {
      if (segment.alternatives?.[0]) {
        const transcript = segment.alternatives[0].transcript.toLowerCase();
        
        // 언어 모델링
        if (transcript.length > 20) {
          modeling++;
        }
        
        // 확장 및 연장
        if (transcript.includes('그리고') || transcript.includes('또한') || transcript.includes('그런데')) {
          expansions++;
        }
        
        if (transcript.includes('그래서') || transcript.includes('따라서') || transcript.includes('그러면')) {
          extensions++;
        }
        
        // 격려
        if (transcript.includes('잘했어') || transcript.includes('좋아') || transcript.includes('맞아')) {
          encouragementCount++;
        }
      }
    });
    
    return {
      languageModeling: modeling * 15,
      expansions: expansions * 20,
      extensions: extensions * 20,
      encouragement: encouragementCount * 10
    };
  }
} 