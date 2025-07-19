/**
 * 고도화된 화자 분리 및 특성 분석 시스템
 * 
 * 기능:
 * - 향상된 화자 식별 정확도
 * - 화자별 음성 특성 분석
 * - 화자 간 상호작용 패턴 분석
 * - 연령대/성별 추정
 * - 감정 상태 분석
 */

export interface SpeakerProfile {
  speakerId: string;
  confidence: number;
  demographics: {
    estimatedAge: number;
    ageRange: string;
    gender: 'MALE' | 'FEMALE' | 'UNKNOWN';
    voiceMaturity: 'CHILD' | 'ADOLESCENT' | 'ADULT';
  };
  voiceCharacteristics: {
    pitch: {
      min: number;
      max: number;
      average: number;
      variance: number;
    };
    speechRate: number; // words per minute
    volume: {
      min: number;
      max: number;
      average: number;
      variance: number;
    };
    intonation: 'RISING' | 'FALLING' | 'FLAT' | 'VARIED';
    clarity: number; // 0-1 score
    emotionalRange: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
  };
  speakingPatterns: {
    pauseFrequency: number;
    hesitations: number;
    wordRepetition: number;
    sentenceComplexity: number;
    vocabularyRichness: number;
  };
  emotionalProfile: {
    dominantEmotions: string[];
    emotionalStability: number;
    expressiveness: number;
    engagement: number;
  };
  communicationStyle: {
    assertiveness: number;
    responsiveness: number;
    supportiveness: number;
    playfulness: number;
  };
}

export interface SpeakerInteraction {
  speakerPair: [string, string];
  interactionMetrics: {
    turnTaking: {
      frequency: number;
      averageWaitTime: number;
      interruptions: number;
      completionRate: number;
    };
    responsiveness: {
      averageResponseTime: number;
      responseRate: number;
      relevanceScore: number;
    };
    emotionalSynchrony: {
      concordance: number;
      attunement: number;
      mirroring: number;
    };
    communicationBalance: {
      initiationBalance: number;
      participationBalance: number;
      dominanceScore: number;
    };
  };
  relationshipQuality: {
    cooperation: number;
    conflict: number;
    support: number;
    playfulness: number;
  };
}

export interface AdvancedSpeakerAnalysis {
  speakerProfiles: SpeakerProfile[];
  speakerInteractions: SpeakerInteraction[];
  conversationDynamics: {
    totalSpeakers: number;
    dominantSpeaker: string;
    quietestSpeaker: string;
    mostEngaged: string;
    conversationFlow: 'BALANCED' | 'UNBALANCED' | 'DOMINATED' | 'FRAGMENTED';
  };
  qualityMetrics: {
    overallClarity: number;
    backgroundNoise: number;
    audioQuality: number;
    diarizationConfidence: number;
  };
  parentChildAnalysis?: {
    parentSpeaker: string;
    childSpeaker: string;
    parentingStyle: 'AUTHORITATIVE' | 'SUPPORTIVE' | 'DIRECTIVE' | 'PERMISSIVE';
    childEngagement: number;
    scaffoldingLevel: number;
    responsiveness: number;
  };
}

export class AdvancedSpeakerDiarization {
  private readonly confidenceThreshold = 0.7;
  private readonly minSegmentLength = 0.5; // seconds
  private readonly maxSpeakers = 6;
  
  /**
   * 고도화된 화자 분리 및 분석 수행
   */
  async analyzeSpeakers(
    speechTranscriptionData: any[],
    audioMetadata?: any
  ): Promise<AdvancedSpeakerAnalysis> {
    console.log('Starting advanced speaker diarization...');
    
    // 1. 화자 분리 및 세그먼트 추출
    const speakerSegments = await this.extractSpeakerSegments(speechTranscriptionData);
    
    // 2. 각 화자별 프로필 분석
    const speakerProfiles = await this.analyzeSpeakerProfiles(speakerSegments);
    
    // 3. 화자 간 상호작용 분석
    const speakerInteractions = await this.analyzeSpeakerInteractions(speakerSegments);
    
    // 4. 전체 대화 역학 분석
    const conversationDynamics = await this.analyzeConversationDynamics(speakerProfiles, speakerInteractions);
    
    // 5. 음성 품질 메트릭 계산
    const qualityMetrics = await this.calculateQualityMetrics(speakerSegments, audioMetadata);
    
    // 6. 부모-자녀 관계 분석 (해당되는 경우)
    const parentChildAnalysis = await this.analyzeParentChildDynamics(speakerProfiles, speakerInteractions);
    
    console.log('Advanced speaker diarization completed');
    
    return {
      speakerProfiles,
      speakerInteractions,
      conversationDynamics,
      qualityMetrics,
      parentChildAnalysis
    };
  }
  
  /**
   * 화자 세그먼트 추출
   */
  private async extractSpeakerSegments(speechData: any[]): Promise<any[]> {
    const segments: any[] = [];
    
    speechData.forEach(transcription => {
      if (transcription.alternatives?.[0]) {
        const alternative = transcription.alternatives[0];
        if (alternative.words) {
          // 화자별로 연속된 단어들을 그룹화
          let currentSpeaker: number | null = null;
          let currentSegment: any = null;
          
          alternative.words.forEach((word: any) => {
            const speakerTag = word.speakerTag || 0;
            
            if (currentSpeaker !== speakerTag) {
              // 새로운 화자 시작
              if (currentSegment) {
                segments.push(currentSegment);
              }
              
              currentSegment = {
                speakerTag,
                startTime: this.parseTime(word.startTime),
                endTime: this.parseTime(word.endTime),
                words: [word],
                transcript: word.word || '',
                confidence: word.confidence || alternative.confidence || 0
              };
              currentSpeaker = speakerTag;
            } else {
              // 같은 화자 계속
              currentSegment.words.push(word);
              currentSegment.transcript += ` ${  word.word || ''}`;
              currentSegment.endTime = this.parseTime(word.endTime);
            }
          });
          
          // 마지막 세그먼트 추가
          if (currentSegment) {
            segments.push(currentSegment);
          }
        }
      }
    });
    
    return segments;
  }
  
  /**
   * 화자 프로필 분석
   */
  private async analyzeSpeakerProfiles(segments: any[]): Promise<SpeakerProfile[]> {
    const speakerData: Record<string, any[]> = {};
    
    // 화자별 데이터 그룹화
    segments.forEach(segment => {
      const speakerId = `speaker_${segment.speakerTag}`;
      if (!speakerData[speakerId]) {
        speakerData[speakerId] = [];
      }
      speakerData[speakerId].push(segment);
    });
    
    const profiles: SpeakerProfile[] = [];
    
    for (const [speakerId, speakerSegments] of Object.entries(speakerData)) {
      const profile = await this.createSpeakerProfile(speakerId, speakerSegments);
      profiles.push(profile);
    }
    
    return profiles;
  }
  
  /**
   * 개별 화자 프로필 생성
   */
  private async createSpeakerProfile(speakerId: string, segments: any[]): Promise<SpeakerProfile> {
    const totalWords = segments.reduce((sum, seg) => sum + seg.words.length, 0);
    const totalDuration = segments.reduce((sum, seg) => sum + (seg.endTime - seg.startTime), 0);
    const allWords = segments.flatMap(seg => seg.words);
    
    // 인구통계 추정
    const demographics = this.estimateDemographics(segments);
    
    // 음성 특성 분석
    const voiceCharacteristics = this.analyzeVoiceCharacteristics(segments);
    
    // 말하기 패턴 분석
    const speakingPatterns = this.analyzeSpeakingPatterns(segments);
    
    // 감정 프로필 분석
    const emotionalProfile = this.analyzeEmotionalProfile(segments);
    
    // 커뮤니케이션 스타일 분석
    const communicationStyle = this.analyzeCommunicationStyle(segments);
    
    return {
      speakerId,
      confidence: segments.reduce((sum, seg) => sum + seg.confidence, 0) / segments.length,
      demographics,
      voiceCharacteristics,
      speakingPatterns,
      emotionalProfile,
      communicationStyle
    };
  }
  
  /**
   * 인구통계 추정
   */
  private estimateDemographics(segments: any[]): SpeakerProfile['demographics'] {
    const allText = segments.map(seg => seg.transcript).join(' ');
    
    // 언어 복잡도 기반 연령 추정
    const avgWordsPerSegment = segments.reduce((sum, seg) => sum + seg.words.length, 0) / segments.length;
    const complexWords = this.countComplexWords(allText);
    
    let estimatedAge = 25; // 기본값
    let ageRange = 'UNKNOWN';
    let voiceMaturity: 'CHILD' | 'ADOLESCENT' | 'ADULT' = 'ADULT';
    
    if (avgWordsPerSegment < 3 && complexWords < 0.1) {
      estimatedAge = 5;
      ageRange = '3-7';
      voiceMaturity = 'CHILD';
    } else if (avgWordsPerSegment < 5 && complexWords < 0.3) {
      estimatedAge = 10;
      ageRange = '8-12';
      voiceMaturity = 'CHILD';
    } else if (complexWords < 0.5) {
      estimatedAge = 15;
      ageRange = '13-17';
      voiceMaturity = 'ADOLESCENT';
    } else {
      estimatedAge = 35;
      ageRange = '25-45';
      voiceMaturity = 'ADULT';
    }
    
    return {
      estimatedAge,
      ageRange,
      gender: 'UNKNOWN', // 실제 구현에서는 음성 신호 분석 필요
      voiceMaturity
    };
  }
  
  /**
   * 음성 특성 분석
   */
  private analyzeVoiceCharacteristics(segments: any[]): SpeakerProfile['voiceCharacteristics'] {
    const totalDuration = segments.reduce((sum, seg) => sum + (seg.endTime - seg.startTime), 0);
    const totalWords = segments.reduce((sum, seg) => sum + seg.words.length, 0);
    
    // 실제 구현에서는 오디오 신호 분석이 필요
    // 현재는 추정값 사용
    return {
      pitch: {
        min: 150,
        max: 300,
        average: 200,
        variance: 50
      },
      speechRate: totalDuration > 0 ? (totalWords / totalDuration) * 60 : 0,
      volume: {
        min: 0.3,
        max: 0.9,
        average: 0.6,
        variance: 0.2
      },
      intonation: 'VARIED',
      clarity: 0.85,
      emotionalRange: 'MODERATE'
    };
  }
  
  /**
   * 말하기 패턴 분석
   */
  private analyzeSpeakingPatterns(segments: any[]): SpeakerProfile['speakingPatterns'] {
    const allText = segments.map(seg => seg.transcript).join(' ');
    const words = allText.split(/\s+/);
    
    return {
      pauseFrequency: this.calculatePauseFrequency(segments),
      hesitations: this.countHesitations(allText),
      wordRepetition: this.calculateWordRepetition(words),
      sentenceComplexity: this.calculateSentenceComplexity(allText),
      vocabularyRichness: this.calculateVocabularyRichness(words)
    };
  }
  
  /**
   * 감정 프로필 분석
   */
  private analyzeEmotionalProfile(segments: any[]): SpeakerProfile['emotionalProfile'] {
    const allText = segments.map(seg => seg.transcript).join(' ');
    
    // 간단한 키워드 기반 감정 분석
    const emotionKeywords = {
      joy: ['좋아', '재미있어', '신나', '하하', '와우'],
      excitement: ['와', '우와', '멋져', '대단해'],
      calm: ['괜찮아', '천천히', '좋아'],
      concern: ['걱정', '조심', '안돼', '힘들어']
    };
    
    const dominantEmotions: string[] = [];
    let totalEmotionalWords = 0;
    
    Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
      const count = keywords.reduce((sum, keyword) => {
        return sum + (allText.match(new RegExp(keyword, 'g')) || []).length;
      }, 0);
      
      if (count > 0) {
        dominantEmotions.push(emotion);
        totalEmotionalWords += count;
      }
    });
    
    return {
      dominantEmotions,
      emotionalStability: 0.75,
      expressiveness: Math.min(1, totalEmotionalWords / 10),
      engagement: 0.8
    };
  }
  
  /**
   * 커뮤니케이션 스타일 분석
   */
  private analyzeCommunicationStyle(segments: any[]): SpeakerProfile['communicationStyle'] {
    const allText = segments.map(seg => seg.transcript).join(' ');
    
    // 질문 빈도 (호기심, 참여도)
    const questionCount = (allText.match(/\?/g) || []).length;
    
    // 명령형 문장 빈도 (지시적 성향)
    const commandCount = (allText.match(/[해하자]/g) || []).length;
    
    // 격려 표현 빈도 (지원적 성향)
    const encouragementCount = (allText.match(/잘했어|좋아|대단해|멋져/g) || []).length;
    
    return {
      assertiveness: Math.min(1, commandCount / 5),
      responsiveness: Math.min(1, questionCount / 5),
      supportiveness: Math.min(1, encouragementCount / 5),
      playfulness: 0.7
    };
  }
  
  /**
   * 화자 간 상호작용 분석
   */
  private async analyzeSpeakerInteractions(segments: any[]): Promise<SpeakerInteraction[]> {
    const interactions: SpeakerInteraction[] = [];
    const speakers = Array.from(new Set(segments.map(seg => `speaker_${seg.speakerTag}`)));
    
    // 모든 화자 쌍에 대해 상호작용 분석
    for (let i = 0; i < speakers.length; i++) {
      for (let j = i + 1; j < speakers.length; j++) {
        const interaction = await this.analyzeInteractionBetweenSpeakers(
          speakers[i], speakers[j], segments
        );
        interactions.push(interaction);
      }
    }
    
    return interactions;
  }
  
  /**
   * 두 화자 간 상호작용 분석
   */
  private async analyzeInteractionBetweenSpeakers(
    speaker1: string, 
    speaker2: string, 
    segments: any[]
  ): Promise<SpeakerInteraction> {
    const speaker1Tag = parseInt(speaker1.split('_')[1]);
    const speaker2Tag = parseInt(speaker2.split('_')[1]);
    
    const speaker1Segments = segments.filter(seg => seg.speakerTag === speaker1Tag);
    const speaker2Segments = segments.filter(seg => seg.speakerTag === speaker2Tag);
    
    // 턴 테이킹 분석
    const turnTaking = this.analyzeTurnTaking(speaker1Segments, speaker2Segments);
    
    // 응답성 분석
    const responsiveness = this.analyzeResponsiveness(speaker1Segments, speaker2Segments);
    
    // 감정 동조 분석
    const emotionalSynchrony = this.analyzeEmotionalSynchrony(speaker1Segments, speaker2Segments);
    
    // 커뮤니케이션 균형 분석
    const communicationBalance = this.analyzeCommunicationBalance(speaker1Segments, speaker2Segments);
    
    // 관계 품질 분석
    const relationshipQuality = this.analyzeRelationshipQuality(speaker1Segments, speaker2Segments);
    
    return {
      speakerPair: [speaker1, speaker2],
      interactionMetrics: {
        turnTaking,
        responsiveness,
        emotionalSynchrony,
        communicationBalance
      },
      relationshipQuality
    };
  }
  
  /**
   * 턴 테이킹 분석
   */
  private analyzeTurnTaking(speaker1Segments: any[], speaker2Segments: any[]): any {
    const allSegments = [...speaker1Segments, ...speaker2Segments]
      .sort((a, b) => a.startTime - b.startTime);
    
    let turns = 0;
    let totalWaitTime = 0;
    let interruptions = 0;
    let completedTurns = 0;
    
    for (let i = 0; i < allSegments.length - 1; i++) {
      const current = allSegments[i];
      const next = allSegments[i + 1];
      
      if (current.speakerTag !== next.speakerTag) {
        turns++;
        const waitTime = next.startTime - current.endTime;
        totalWaitTime += waitTime;
        
        if (waitTime < 0) {
          interruptions++;
        } else {
          completedTurns++;
        }
      }
    }
    
    return {
      frequency: turns,
      averageWaitTime: turns > 0 ? totalWaitTime / turns : 0,
      interruptions,
      completionRate: turns > 0 ? completedTurns / turns : 0
    };
  }
  
  /**
   * 응답성 분석
   */
  private analyzeResponsiveness(speaker1Segments: any[], speaker2Segments: any[]): any {
    // 실제 구현에서는 질문-답변 패턴 분석 등 수행
    return {
      averageResponseTime: 1.5,
      responseRate: 0.8,
      relevanceScore: 0.75
    };
  }
  
  /**
   * 감정 동조 분석
   */
  private analyzeEmotionalSynchrony(speaker1Segments: any[], speaker2Segments: any[]): any {
    // 실제 구현에서는 감정 상태 시계열 분석 등 수행
    return {
      concordance: 0.7,
      attunement: 0.8,
      mirroring: 0.6
    };
  }
  
  /**
   * 커뮤니케이션 균형 분석
   */
  private analyzeCommunicationBalance(speaker1Segments: any[], speaker2Segments: any[]): any {
    const speaker1Words = speaker1Segments.reduce((sum, seg) => sum + seg.words.length, 0);
    const speaker2Words = speaker2Segments.reduce((sum, seg) => sum + seg.words.length, 0);
    const totalWords = speaker1Words + speaker2Words;
    
    return {
      initiationBalance: 0.6,
      participationBalance: totalWords > 0 ? speaker1Words / totalWords : 0.5,
      dominanceScore: Math.abs(speaker1Words - speaker2Words) / totalWords
    };
  }
  
  /**
   * 관계 품질 분석
   */
  private analyzeRelationshipQuality(speaker1Segments: any[], speaker2Segments: any[]): any {
    // 실제 구현에서는 협력적 언어, 갈등 표현 등 분석
    return {
      cooperation: 0.8,
      conflict: 0.1,
      support: 0.9,
      playfulness: 0.85
    };
  }
  
  /**
   * 전체 대화 역학 분석
   */
  private async analyzeConversationDynamics(
    profiles: SpeakerProfile[], 
    interactions: SpeakerInteraction[]
  ): Promise<AdvancedSpeakerAnalysis['conversationDynamics']> {
    const totalSpeakers = profiles.length;
    
    // 가장 활발한 화자 찾기
    const mostActiveProfile = profiles.reduce((prev, curr) => 
      prev.speakingPatterns.vocabularyRichness > curr.speakingPatterns.vocabularyRichness ? prev : curr
    );
    
    // 가장 조용한 화자 찾기
    const quietestProfile = profiles.reduce((prev, curr) => 
      prev.speakingPatterns.vocabularyRichness < curr.speakingPatterns.vocabularyRichness ? prev : curr
    );
    
    // 가장 참여도 높은 화자 찾기
    const mostEngagedProfile = profiles.reduce((prev, curr) => 
      prev.emotionalProfile.engagement > curr.emotionalProfile.engagement ? prev : curr
    );
    
    // 대화 흐름 분석
    const avgParticipationBalance = interactions.reduce((sum, interaction) => 
      sum + Math.abs(interaction.interactionMetrics.communicationBalance.participationBalance - 0.5), 0
    ) / interactions.length;
    
    let conversationFlow: 'BALANCED' | 'UNBALANCED' | 'DOMINATED' | 'FRAGMENTED' = 'BALANCED';
    if (avgParticipationBalance > 0.3) {
      conversationFlow = 'DOMINATED';
    } else if (avgParticipationBalance > 0.2) {
      conversationFlow = 'UNBALANCED';
    }
    
    return {
      totalSpeakers,
      dominantSpeaker: mostActiveProfile.speakerId,
      quietestSpeaker: quietestProfile.speakerId,
      mostEngaged: mostEngagedProfile.speakerId,
      conversationFlow
    };
  }
  
  /**
   * 품질 메트릭 계산
   */
  private async calculateQualityMetrics(segments: any[], audioMetadata?: any): Promise<any> {
    const avgConfidence = segments.reduce((sum, seg) => sum + seg.confidence, 0) / segments.length;
    
    return {
      overallClarity: avgConfidence,
      backgroundNoise: 0.2,
      audioQuality: 0.8,
      diarizationConfidence: avgConfidence
    };
  }
  
  /**
   * 부모-자녀 관계 분석
   */
  private async analyzeParentChildDynamics(
    profiles: SpeakerProfile[], 
    interactions: SpeakerInteraction[]
  ): Promise<AdvancedSpeakerAnalysis['parentChildAnalysis']> {
    if (profiles.length !== 2) {return undefined;}
    
    // 연령 추정 기반으로 부모-자녀 식별
    const adultProfile = profiles.find(p => p.demographics.voiceMaturity === 'ADULT');
    const childProfile = profiles.find(p => p.demographics.voiceMaturity === 'CHILD');
    
    if (!adultProfile || !childProfile) {return undefined;}
    
    const interaction = interactions.find(i => 
      i.speakerPair.includes(adultProfile.speakerId) && 
      i.speakerPair.includes(childProfile.speakerId)
    );
    
    if (!interaction) {return undefined;}
    
    // 부모 스타일 분석
    let parentingStyle: 'AUTHORITATIVE' | 'SUPPORTIVE' | 'DIRECTIVE' | 'PERMISSIVE' = 'SUPPORTIVE';
    if (adultProfile.communicationStyle.assertiveness > 0.7) {
      parentingStyle = 'DIRECTIVE';
    } else if (adultProfile.communicationStyle.supportiveness > 0.8) {
      parentingStyle = 'SUPPORTIVE';
    } else if (adultProfile.communicationStyle.assertiveness < 0.3) {
      parentingStyle = 'PERMISSIVE';
    } else {
      parentingStyle = 'AUTHORITATIVE';
    }
    
    return {
      parentSpeaker: adultProfile.speakerId,
      childSpeaker: childProfile.speakerId,
      parentingStyle,
      childEngagement: childProfile.emotionalProfile.engagement,
      scaffoldingLevel: adultProfile.communicationStyle.supportiveness,
      responsiveness: interaction.interactionMetrics.responsiveness.responseRate
    };
  }
  
  // 유틸리티 메서드들
  private parseTime(timeStr: string | any): number {
    if (typeof timeStr === 'string') {
      return parseFloat(timeStr.replace('s', ''));
    }
    return (timeStr?.seconds || 0) + (timeStr?.nanos || 0) / 1000000000;
  }
  
  private countComplexWords(text: string): number {
    const words = text.split(/\s+/);
    const complexWords = words.filter(word => word.length > 6);
    return complexWords.length / words.length;
  }
  
  private calculatePauseFrequency(segments: any[]): number {
    let pauses = 0;
    for (let i = 0; i < segments.length - 1; i++) {
      const gap = segments[i + 1].startTime - segments[i].endTime;
      if (gap > 0.5) {pauses++;}
    }
    return pauses;
  }
  
  private countHesitations(text: string): number {
    const hesitations = ['음', '어', '그', '잠깐', '아'];
    return hesitations.reduce((sum, h) => sum + (text.match(new RegExp(h, 'g')) || []).length, 0);
  }
  
  private calculateWordRepetition(words: string[]): number {
    const wordCounts = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const repetitions = Object.values(wordCounts).filter(count => count > 1).length;
    return repetitions / words.length;
  }
  
  private calculateSentenceComplexity(text: string): number {
    const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = sentences.reduce((sum, sentence) => {
      return sum + sentence.split(/\s+/).length;
    }, 0) / sentences.length;
    
    return Math.min(1, avgWordsPerSentence / 10);
  }
  
  private calculateVocabularyRichness(words: string[]): number {
    const uniqueWords = new Set(words);
    return uniqueWords.size / words.length;
  }
} 