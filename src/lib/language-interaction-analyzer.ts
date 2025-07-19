/**
 * 언어 상호작용 분석 모듈
 * 발화 통계, 대화 패턴, 키워드 분석
 */

export interface TranscriptEntry {
  speaker: string;
  time: number;
  startTime?: number;
  endTime?: number;
  text: string;
  confidence?: number;
}

export interface SpeakerStats {
  utteranceCount: number;
  avgWordCount: number;
  avgInterval: number;
  totalWords: number;
  dominanceScore: number;
}

export interface ConversationPattern {
  avgResponseTime: number;
  turnCount: number;
  initiationCount: Record<string, number>;
  conversationFlow: Array<{
    from: string;
    to: string;
    time: number;
    responseTime: number;
  }>;
}

export interface KeywordAnalysis {
  topKeywords: Array<[string, number]>;
  totalUniqueWords: number;
  totalWords: number;
  vocabularyDiversity: number;
  playRelatedWords: Array<[string, number]>;
  emotionalWords: Array<[string, number]>;
}

export interface UtteranceClassification {
  questions: number;
  instructions: number;
  emotional_expressions: number;
  praise_encouragement: number;
  total_utterances: number;
}

export interface LanguageInteractionResult {
  speakerStats: Record<string, SpeakerStats>;
  utteranceClassification: Record<string, UtteranceClassification>;
  keywordAnalysis: KeywordAnalysis;
  interactionPatterns: ConversationPattern;
  complexity: {
    averageSentenceLength: number;
    vocabularyDiversity: number;
    complexSentenceRatio: number;
    overallComplexity: number;
  };
  qualityScore: number;
}

export class LanguageInteractionAnalyzer {
  private readonly stopWords = new Set([
    '이', '그', '저', '것', '을', '를', '이', '가', '은', '는', '에', '의', '도', '와', '과', '로', '으로',
    '하다', '있다', '되다', '아니다', '그렇다', '이렇다', '저렇다', '어떻다', '어떻게', '왜', '언제', '어디서',
    '누구', '무엇', '어느', '몇', '얼마', '어떤', '이런', '그런', '저런', '좀', '잘', '더', '가장', '매우'
  ]);

  private readonly playWords = new Set([
    '놀이', '장난감', '게임', '공', '블록', '인형', '자동차', '레고', '퍼즐', '그림', '책', '색칠', '만들기',
    '쌓기', '맞추기', '던지기', '굴리기', '숨기기', '찾기', '따라하기', '흉내내기', '역할놀이', '소꿉놀이'
  ]);

  private readonly emotionalWords = new Set([
    '좋아', '싫어', '예쁘다', '멋지다', '재밌다', '신나다', '즐겁다', '기쁘다', '슬프다', '무서워', '놀랍다',
    '대단하다', '훌륭하다', '멋있다', '아름답다', '사랑해', '고마워', '미안해', '축하해', '행복해', '웃음',
    '화나다', '짜증나다', '답답하다', '스트레스', '편안하다', '안심', '걱정', '두렵다', '용감하다', '자신감'
  ]);

  private readonly praiseWords = new Set([
    '잘했어', '멋지다', '대단해', '훌륭해', '좋아', '최고', '완벽해', '정말', '참', '아주', '너무', '엄청',
    '굉장히', '정말로', '진짜', '와', '우와', '대박', '짱', '멋있어', '예뻐', '똑똑해', '영리해', '착해'
  ]);

  /**
   * 언어 상호작용 분석 메인 메서드
   */
  async analyzeLanguageInteraction(transcript: any[]): Promise<LanguageInteractionResult> {
    try {
      console.log('🔍 언어 상호작용 분석 시작');
      console.log('📊 입력 데이터:', { transcriptLength: transcript?.length || 0 });

      // Google Cloud Speech-to-Text API 형식을 표준 형식으로 변환
      const processedTranscript = this.processTranscriptData(transcript);
      console.log('✅ 변환된 transcript:', { processedLength: processedTranscript.length });

      if (!processedTranscript || processedTranscript.length === 0) {
        console.log('⚠️ 빈 transcript 데이터 - 기본값 반환');
        return this.getDefaultResult();
      }

      // 화자별 통계 계산
      const speakerStats = this.calculateSpeakerStats(processedTranscript);

      // 발화 분류
      const utteranceClassification = this.classifyUtterances(processedTranscript);

      // 키워드 분석
      const keywordAnalysis = this.analyzeKeywords(processedTranscript);

      // 상호작용 패턴 분석
      const interactionPatterns = this.analyzeInteractionPatterns(processedTranscript);

      // 언어적 복잡성 분석
      const complexity = this.analyzeLinguisticComplexity(processedTranscript);

      // 전체 품질 점수 계산
      const qualityScore = this.calculateOverallQualityScore(
        speakerStats,
        utteranceClassification,
        keywordAnalysis,
        interactionPatterns,
        complexity
      );

      console.log('✅ 언어 상호작용 분석 완료');
      return {
        speakerStats,
        utteranceClassification,
        keywordAnalysis,
        interactionPatterns,
        complexity,
        qualityScore
      };
    } catch (error) {
      console.error('❌ 언어 상호작용 분석 오류:', error);
      return this.getDefaultResult();
    }
  }

  /**
   * Google Cloud Speech-to-Text API 형식을 표준 형식으로 변환
   */
  private processTranscriptData(rawTranscript: any[]): TranscriptEntry[] {
    const processedEntries: TranscriptEntry[] = [];
    
    if (!rawTranscript || rawTranscript.length === 0) {
      return processedEntries;
    }

    let speakerIndex = 0;
    
    for (const entry of rawTranscript) {
      try {
        // Google Cloud Speech-to-Text API 형식 처리
        if (entry.alternatives && entry.alternatives.length > 0) {
          const bestAlternative = entry.alternatives[0];
          const text = bestAlternative.transcript;
          
          // 빈 텍스트 건너뛰기
          if (!text || text.trim().length === 0) {
            continue;
          }
          
          // 화자 정보 추정 (실제 speaker diarization 데이터가 없는 경우)
          const speaker = `speaker_${(speakerIndex % 2) + 1}`;
          
          // 시간 정보 추정
          const startTime = entry.startTime || 0;
          const endTime = entry.endTime || startTime + 1;
          
          processedEntries.push({
            text: text.trim(),
            speaker,
            startTime,
            endTime,
            confidence: bestAlternative.confidence || 0
          });
          
          speakerIndex++;
        }
        // 이미 처리된 형식인 경우
        else if (entry.text && entry.speaker) {
          processedEntries.push({
            text: entry.text.trim(),
            speaker: entry.speaker,
            startTime: entry.startTime || 0,
            endTime: entry.endTime || 1,
            confidence: entry.confidence || 0
          });
        }
      } catch (entryError) {
        console.warn('⚠️ transcript 항목 처리 중 오류:', entryError);
        continue;
      }
    }
    
    console.log(`📊 변환 완료: ${rawTranscript.length} → ${processedEntries.length}개 항목`);
    return processedEntries;
  }

  /**
   * 화자별 기본 통계 계산
   */
  private calculateSpeakerStats(transcript: TranscriptEntry[]): Record<string, SpeakerStats> {
    const speakerData: Record<string, TranscriptEntry[]> = {};
    
    // 화자별 데이터 그룹화
    for (const entry of transcript) {
      if (!speakerData[entry.speaker]) {
        speakerData[entry.speaker] = [];
      }
      speakerData[entry.speaker].push(entry);
    }

    const stats: Record<string, SpeakerStats> = {};
    const totalUtterances = transcript.length;

    for (const [speaker, entries] of Object.entries(speakerData)) {
      const utteranceCount = entries.length;
      
      // 평균 발화 길이
      const wordCounts = entries.map(e => this.countWords(e.text));
      const avgWordCount = wordCounts.length > 0 ? 
        wordCounts.reduce((sum, count) => sum + count, 0) / wordCounts.length : 0;

      // 발화 간격
      const intervals = [];
      for (let i = 1; i < entries.length; i++) {
        const interval = entries[i].time - entries[i-1].time;
        intervals.push(interval);
      }
      const avgInterval = intervals.length > 0 ? 
        intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length : 0;

      // 총 단어 수
      const totalWords = wordCounts.reduce((sum, count) => sum + count, 0);

      // 대화 주도성 점수
      const dominanceScore = utteranceCount / totalUtterances;

      stats[speaker] = {
        utteranceCount,
        avgWordCount: Math.round(avgWordCount * 10) / 10,
        avgInterval: Math.round(avgInterval * 10) / 10,
        totalWords,
        dominanceScore: Math.round(dominanceScore * 100) / 100
      };
    }

    return stats;
  }

  /**
   * 상호작용 패턴 분석 (Python _analyze_conversation_patterns 기반)
   */
  private analyzeInteractionPatterns(transcript: TranscriptEntry[]): ConversationPattern {
    if (transcript.length < 2) {
      return {
        avgResponseTime: 0,
        turnCount: 0,
        initiationCount: {},
        conversationFlow: []
      };
    }

    const patterns: any = {
      turnTaking: [],
      responseTimes: [],
      initiationCount: {}
    };

    // 턴테이킹 분석
    for (let i = 1; i < transcript.length; i++) {
      if (transcript[i].speaker !== transcript[i-1].speaker) {
        const responseTime = transcript[i].startTime - transcript[i-1].endTime;
        patterns.responseTimes.push(responseTime);
        patterns.turnTaking.push({
          from: transcript[i-1].speaker,
          to: transcript[i].speaker,
          time: transcript[i].startTime,
          responseTime
        });
      }
    }

    // 대화 시작 횟수 (3초 이상 간격이면 새로운 대화 시작으로 간주)
    for (let i = 0; i < transcript.length; i++) {
      if (i === 0 || transcript[i].startTime - transcript[i-1].endTime > 3.0) {
        const speaker = transcript[i].speaker;
        patterns.initiationCount[speaker] = (patterns.initiationCount[speaker] || 0) + 1;
      }
    }

    // 평균 반응 시간
    const avgResponseTime = patterns.responseTimes.length > 0 ? 
      patterns.responseTimes.reduce((sum: number, time: number) => sum + time, 0) / patterns.responseTimes.length : 0;

    // 빠른 응답 (2초 이내) 및 지연 응답 (5초 이상) 계산
    const quickResponses = patterns.responseTimes.filter((time: number) => time <= 2).length;
    const delayedResponses = patterns.responseTimes.filter((time: number) => time >= 5).length;

    return {
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      turnCount: patterns.turnTaking.length,
      initiationCount: patterns.initiationCount,
      conversationFlow: patterns.turnTaking.slice(0, 10) // 처음 10개만
    };
  }

  /**
   * 언어적 복잡성 분석 (Python 기반)
   */
  private analyzeLinguisticComplexity(transcript: TranscriptEntry[]): {
    averageSentenceLength: number;
    vocabularyDiversity: number;
    complexSentenceRatio: number;
    overallComplexity: number;
  } {
    if (transcript.length === 0) {
      return {
        averageSentenceLength: 0,
        vocabularyDiversity: 0,
        complexSentenceRatio: 0,
        overallComplexity: 0
      };
    }

    let totalWords = 0;
    let totalSentences = 0;
    const allWords: string[] = [];
    let complexSentences = 0;

    for (const entry of transcript) {
      const sentences = entry.text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      totalSentences += sentences.length;

      for (const sentence of sentences) {
        const words = this.extractWords(sentence);
        totalWords += words.length;
        allWords.push(...words);

        // 복잡한 문장 판단 (접속사, 종속절 등 포함)
        if (this.isComplexSentence(sentence)) {
          complexSentences++;
        }
      }
    }

    const averageSentenceLength = totalSentences > 0 ? totalWords / totalSentences : 0;
    const uniqueWords = new Set(allWords);
    const vocabularyDiversity = allWords.length > 0 ? uniqueWords.size / allWords.length : 0;
    const complexSentenceRatio = totalSentences > 0 ? complexSentences / totalSentences : 0;

    const overallComplexity = (
      (averageSentenceLength / 10) * 0.4 +
      vocabularyDiversity * 0.3 +
      complexSentenceRatio * 0.3
    );

    return {
      averageSentenceLength: Math.round(averageSentenceLength * 100) / 100,
      vocabularyDiversity: Math.round(vocabularyDiversity * 100) / 100,
      complexSentenceRatio: Math.round(complexSentenceRatio * 100) / 100,
      overallComplexity: Math.round(overallComplexity * 100) / 100
    };
  }

  /**
   * 복잡한 문장 판단
   */
  private isComplexSentence(sentence: string): boolean {
    // 한국어 복잡성 지표
    const complexityMarkers = [
      '그런데', '하지만', '그러나', '그래서', '따라서', '왜냐하면', '만약', '비록', '설령',
      '때문에', '으로써', '함으로써', '에 의해', '을 통해', '를 위해', '면서', '으면서'
    ];

    const lowerSentence = sentence.toLowerCase();
    return complexityMarkers.some(marker => lowerSentence.includes(marker)) ||
           sentence.length > 20; // 긴 문장도 복잡성 지표로 간주
  }

  /**
   * 키워드 분석
   */
  private analyzeKeywords(transcript: TranscriptEntry[]): KeywordAnalysis {
    const allWords: string[] = [];
    const playWords: string[] = [];
    const emotionalWords: string[] = [];

    // 모든 텍스트에서 단어 추출
    for (const entry of transcript) {
      if (!entry?.text || typeof entry.text !== 'string') {
        console.warn('⚠️ 키워드 분석 중 잘못된 transcript 항목:', entry);
        continue;
      }
      
      const words = this.extractWords(entry.text);
      allWords.push(...words);

      // 놀이 관련 단어 추출
      const playMatches = words.filter(word => this.playWords.has(word));
      playWords.push(...playMatches);

      // 감정 단어 추출
      const emotionalMatches = words.filter(word => this.emotionalWords.has(word));
      emotionalWords.push(...emotionalMatches);
    }

    // 불용어 제거
    const filteredWords = allWords.filter(word => 
      !this.stopWords.has(word) && word.length > 1
    );

    // 단어 빈도 계산
    const wordFreq = this.countFrequencies(filteredWords);
    const playWordFreq = this.countFrequencies(playWords);
    const emotionalWordFreq = this.countFrequencies(emotionalWords);

    // 어휘 다양성 계산 (TTR: Type-Token Ratio)
    const vocabularyDiversity = filteredWords.length > 0 ? 
      new Set(filteredWords).size / filteredWords.length : 0;

    return {
      topKeywords: Array.from(wordFreq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10),
      totalUniqueWords: new Set(filteredWords).size,
      totalWords: filteredWords.length,
      vocabularyDiversity: Math.round(vocabularyDiversity * 100) / 100,
      playRelatedWords: Array.from(playWordFreq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
      emotionalWords: Array.from(emotionalWordFreq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    };
  }

  /**
   * 발화 유형 분류
   */
  private classifyUtterances(transcript: TranscriptEntry[]): Record<string, UtteranceClassification> {
    const classification: Record<string, UtteranceClassification> = {};

    // 화자별 분류 초기화
    for (const entry of transcript) {
      if (!classification[entry.speaker]) {
        classification[entry.speaker] = {
          questions: 0,
          instructions: 0,
          emotional_expressions: 0,
          praise_encouragement: 0,
          total_utterances: 0
        };
      }
    }

    // 발화 분류
    for (const entry of transcript) {
      if (!entry?.text || typeof entry.text !== 'string') {
        console.warn('⚠️ 잘못된 transcript 항목:', entry);
        continue;
      }
      
      const text = entry.text.toLowerCase();
      const speaker = entry.speaker || 'unknown';
      
      if (!classification[speaker]) {
        classification[speaker] = {
          total_utterances: 0,
          questions: 0,
          responses: 0,
          initiations: 0,
          positive_words: 0,
          negative_words: 0,
          complex_sentences: 0,
          simple_sentences: 0
        };
      }
      
      classification[speaker].total_utterances++;

      // 질문 감지
      if (this.isQuestion(text)) {
        classification[speaker].questions++;
      }

      // 지시/제안 감지
      if (this.isInstruction(text)) {
        classification[speaker].instructions++;
      }

      // 감정 표현 감지
      if (this.isEmotionalExpression(text)) {
        classification[speaker].emotional_expressions++;
      }

      // 칭찬/격려 감지
      if (this.isPraiseEncouragement(text)) {
        classification[speaker].praise_encouragement++;
      }
    }

    return classification;
  }

  /**
   * 발달 지표 계산
   */
  private calculateDevelopmentIndicators(
    transcript: TranscriptEntry[],
    speakerStats: Record<string, SpeakerStats>,
    keywordAnalysis: KeywordAnalysis
  ): {
    sentenceComplexity: number;
    vocabularyDiversity: number;
    interactionLanguageUsage: number;
    conversationCohesion: number;
  } {
    // 문장 복잡도 (평균 단어 수 기준)
    const avgComplexity = Object.values(speakerStats)
      .reduce((sum, stats) => sum + stats.avgWordCount, 0) / Object.keys(speakerStats).length;
    const sentenceComplexity = Math.min(avgComplexity / 10, 1); // 0-1 정규화

    // 어휘 다양성
    const vocabularyDiversity = keywordAnalysis.vocabularyDiversity;

    // 상호작용 언어 사용 (놀이 관련 단어 + 감정 단어 비율)
    const interactionWords = keywordAnalysis.playRelatedWords.length + 
                           keywordAnalysis.emotionalWords.length;
    const interactionLanguageUsage = Math.min(interactionWords / 20, 1); // 0-1 정규화

    // 대화 연결성 (턴테이킹 빈도 기준)
    const speakers = Object.keys(speakerStats);
    const conversationCohesion = speakers.length >= 2 ? 
      Math.min(transcript.length / (transcript[transcript.length - 1].time - transcript[0].time), 1) : 0;

    return {
      sentenceComplexity: Math.round(sentenceComplexity * 100) / 100,
      vocabularyDiversity: Math.round(vocabularyDiversity * 100) / 100,
      interactionLanguageUsage: Math.round(interactionLanguageUsage * 100) / 100,
      conversationCohesion: Math.round(conversationCohesion * 100) / 100
    };
  }

  /**
   * 전체 점수 계산 (Python 기반)
   */
  private calculateOverallQualityScore(
    speakerStats: SpeakerStats,
    utteranceClassification: UtteranceClassification,
    keywordAnalysis: KeywordAnalysis,
    interactionPatterns: ConversationPattern,
    complexity: {
      averageSentenceLength: number;
      vocabularyDiversity: number;
      complexSentenceRatio: number;
      overallComplexity: number;
    }
  ): number {
    // 각 요소별 점수 계산
    const speakers = Object.keys(speakerStats);
    const avgUtteranceCount = speakers.length > 0 ? 
      speakers.reduce((sum, speaker) => sum + speakerStats[speaker].utteranceCount, 0) / speakers.length : 0;

    const utteranceScore = Math.min(avgUtteranceCount / 10, 1.0); // 평균 10회 발화를 1.0으로 기준

    // 상호작용 점수 (턴테이킹 기반)
    const interactionScore = interactionPatterns.turnCount > 0 ? 
      Math.min(interactionPatterns.turnCount / 20, 1.0) : 0;

    // 어휘 다양성 점수
    const vocabularyScore = keywordAnalysis.vocabularyDiversity || 0;

    // 복잡성 점수
    const complexityScore = complexity.overallComplexity;

    // 가중 평균으로 전체 점수 계산
    const overallScore = (
      utteranceScore * 0.3 +
      interactionScore * 0.3 +
      vocabularyScore * 0.2 +
      complexityScore * 0.2
    );

    return Math.round(overallScore * 1000) / 1000; // 소수점 3자리까지
  }

  /**
   * 단어 수 계산
   */
  private countWords(text: string): number {
    if (!text || typeof text !== 'string') {
      return 0;
    }
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * 단어 추출
   */
  private extractWords(text: string): string[] {
    if (!text || typeof text !== 'string') {
      return [];
    }
    // 한글, 영문, 숫자만 추출
    const words = text.toLowerCase().match(/[가-힣a-z0-9]+/g) || [];
    return words.filter(word => word.length > 0);
  }

  /**
   * 단어 빈도 계산
   */
  private countFrequencies(words: string[]): Map<string, number> {
    const freq = new Map<string, number>();
    for (const word of words) {
      freq.set(word, (freq.get(word) || 0) + 1);
    }
    return freq;
  }

  /**
   * 질문 감지
   */
  private isQuestion(text: string): boolean {
    const questionWords = ['어떻게', '뭐', '왜', '뭘', '어디', '누가', '언제', '어떤', '몇', '얼마'];
    return questionWords.some(word => text.includes(word)) || text.includes('?');
  }

  /**
   * 지시/제안 감지
   */
  private isInstruction(text: string): boolean {
    const instructionWords = ['해봐', '하자', '해줄게', '해야', '하면', '해볼까', '같이', '함께'];
    return instructionWords.some(word => text.includes(word));
  }

  /**
   * 감정 표현 감지
   */
  private isEmotionalExpression(text: string): boolean {
    const words = this.extractWords(text);
    return words.some(word => this.emotionalWords.has(word)) || 
           /[!]+|[~]+|ㅋ|ㅎ|ㅠ|ㅜ/.test(text);
  }

  /**
   * 칭찬/격려 감지
   */
  private isPraiseEncouragement(text: string): boolean {
    const words = this.extractWords(text);
    return words.some(word => this.praiseWords.has(word));
  }

  /**
   * 기본 결과 반환
   */
  private getDefaultResult(): LanguageInteractionResult {
    return {
      speakerStats: {},
      utteranceClassification: {},
      keywordAnalysis: {
        topKeywords: [],
        totalUniqueWords: 0,
        totalWords: 0,
        vocabularyDiversity: 0,
        playRelatedWords: [],
        emotionalWords: []
      },
      interactionPatterns: {
        avgResponseTime: 0,
        turnCount: 0,
        initiationCount: {},
        conversationFlow: []
      },
      complexity: {
        averageSentenceLength: 0,
        vocabularyDiversity: 0,
        complexSentenceRatio: 0,
        overallComplexity: 0
      },
      qualityScore: 0
    };
  }
} 