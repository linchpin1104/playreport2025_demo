export interface TranscriptEntry {
  speaker: string;
  time: number;
  text: string;
}

export interface LanguageInteractionResult {
  basicStats: Record<string, {
    utteranceCount: number;
    avgWordCount: number;
    avgInterval: number;
    totalWords: number;
  }>;
  conversationPatterns: {
    avgResponseTime: number;
    turnCount: number;
    initiationCount: Record<string, number>;
  };
  utteranceTypes: {
    questions: number;
    instructions: number;
    emotions: number;
    praise: number;
  };
  keywords: {
    topKeywords: Array<[string, number]>;
    totalUniqueWords: number;
    totalWords: number;
  };
  timeline: Array<{
    timeRange: string;
    parentUtterances: number;
    childUtterances: number;
  }>;
}

export class LanguageInteractionAnalyzer {
  private readonly supportiveWords = ['좋아', '잘했어', '맞아', '그래', '대단해', '훌륭해', '멋져', '훌륭한', '최고', '완벽', '우와'];
  private readonly questionWords = ['뭐', '왜', '어떻게', '어디', '언제', '누구', '무엇', '어느', '몇', '얼마'];
  private readonly instructionWords = ['해봐', '하자', '해줄게', '해야', '하면', '해보자', '같이', '함께'];
  private readonly emotionWords = ['좋아', '싫어', '예쁘', '무서워', '재밌', '슬퍼', '기뻐', '화나', '놀라', '신나'];

  async analyzeLanguageInteraction(transcript: TranscriptEntry[]): Promise<LanguageInteractionResult> {
    console.log('🗣️ Starting language interaction analysis');
    console.log(`📊 Transcript entries: ${transcript?.length || 0}`);

    if (!transcript || transcript.length === 0) {
      console.warn('⚠️ No speech transcription data available');
      return this.createEmptyResult();
    }

    try {
      // 1. 기본 통계 계산
      const basicStats = this.calculateBasicStats(transcript);
      
      // 2. 대화 패턴 분석
      const conversationPatterns = this.analyzeConversationPatterns(transcript);
      
      // 3. 발화 유형 분류
      const utteranceTypes = this.classifyUtteranceTypes(transcript);
      
      // 4. 키워드 추출
      const keywords = this.extractKeywords(transcript);
      
      // 5. 시간별 발화 분석
      const timeline = this.analyzeTimeline(transcript);

      console.log('✅ Language interaction analysis completed', {
        speakers: Object.keys(basicStats).length,
        totalUtterances: Object.values(basicStats).reduce((sum, stat) => sum + stat.utteranceCount, 0),
        totalWords: keywords.totalWords,
        keywordsFound: keywords.topKeywords.length
      });

      return {
        basicStats,
        conversationPatterns,
        utteranceTypes,
        keywords,
        timeline
      };
    } catch (error) {
      console.error('❌ Error in language interaction analysis:', error);
      return this.createEmptyResult();
    }
  }

  private calculateBasicStats(transcript: TranscriptEntry[]) {
    const stats: Record<string, any> = {};
    
    // 화자별 그룹화
    const speakers: Record<string, TranscriptEntry[]> = {};
    transcript.forEach(entry => {
      const speaker = entry.speaker || 'Unknown';
      if (!speakers[speaker]) {
        speakers[speaker] = [];
      }
      speakers[speaker].push(entry);
    });

    // 화자별 통계 계산
    Object.entries(speakers).forEach(([speaker, entries]) => {
      const utteranceCount = entries.length;
      
      // 단어 수 계산 (한국어 처리)
      const wordCounts = entries.map(e => {
        if (!e.text || typeof e.text !== 'string') return 0;
        // 한국어는 어절 단위로 계산
        return e.text.trim().split(/\s+/).filter(word => word.length > 0).length;
      });
      
      const totalWords = wordCounts.reduce((a, b) => a + b, 0);
      const avgWordCount = wordCounts.length > 0 ? totalWords / wordCounts.length : 0;
      
      // 발화 간격 계산
      const intervals: number[] = [];
      const sortedEntries = [...entries].sort((a, b) => a.time - b.time);
      
      for (let i = 1; i < sortedEntries.length; i++) {
        const interval = sortedEntries[i].time - sortedEntries[i-1].time;
        if (interval > 0 && interval < 300) { // 5분 이내의 합리적인 간격만
          intervals.push(interval);
        }
      }
      
      const avgInterval = intervals.length > 0 ? intervals.reduce((a, b) => a + b, 0) / intervals.length : 0;

      stats[speaker] = {
        utteranceCount,
        avgWordCount: Math.round(avgWordCount * 10) / 10,
        avgInterval: Math.round(avgInterval * 10) / 10,
        totalWords
      };
      
      console.log(`👤 ${speaker}: ${utteranceCount} utterances, ${totalWords} words, avg ${avgWordCount.toFixed(1)} words/utterance`);
    });

    return stats;
  }

  private analyzeConversationPatterns(transcript: TranscriptEntry[]) {
    if (transcript.length < 2) {
      return {
        avgResponseTime: 0,
        turnCount: 0,
        initiationCount: {}
      };
    }

    const responseTimes: number[] = [];
    const initiationCount: Record<string, number> = {};
    let turnCount = 0;

    // 시간순 정렬
    const sortedTranscript = [...transcript].sort((a, b) => a.time - b.time);

    // 턴테이킹 분석
    for (let i = 1; i < sortedTranscript.length; i++) {
      const prev = sortedTranscript[i-1];
      const curr = sortedTranscript[i];
      
      if (prev.speaker !== curr.speaker) {
        // 화자 전환 발생
        const responseTime = curr.time - prev.time;
        if (responseTime > 0 && responseTime < 30) { // 30초 이내의 합리적인 응답
          responseTimes.push(responseTime);
          turnCount++;
        }
      }
    }

    // 대화 시작 횟수 분석
    sortedTranscript.forEach((entry, index) => {
      const speaker = entry.speaker || 'Unknown';
      
      // 첫 발화거나 긴 침묵 후 발화인 경우
      if (index === 0 || sortedTranscript[index].time - sortedTranscript[index-1].time > 5.0) {
        initiationCount[speaker] = (initiationCount[speaker] || 0) + 1;
      }
    });

    const avgResponseTime = responseTimes.length > 0 ? 
      responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;

    console.log(`🔄 Conversation patterns: ${turnCount} turns, avg response time: ${avgResponseTime.toFixed(2)}s`);

    return {
      avgResponseTime: Math.round(avgResponseTime * 100) / 100,
      turnCount,
      initiationCount
    };
  }

  private classifyUtteranceTypes(transcript: TranscriptEntry[]) {
    let questions = 0;
    let instructions = 0;
    let emotions = 0;
    let praise = 0;

    transcript.forEach(entry => {
      if (!entry.text || typeof entry.text !== 'string') return;
      
      const text = entry.text.toLowerCase().trim();
      
      // 질문 감지
      if (this.questionWords.some(word => text.includes(word)) || text.includes('?') || text.endsWith('?')) {
        questions++;
      }
      
      // 지시/제안 감지
      if (this.instructionWords.some(word => text.includes(word))) {
        instructions++;
      }
      
      // 감정 표현 감지
      if (this.emotionWords.some(word => text.includes(word))) {
        emotions++;
      }
      
      // 칭찬/격려 감지
      if (this.supportiveWords.some(word => text.includes(word))) {
        praise++;
      }
    });

    console.log(`🎭 Utterance types: questions=${questions}, instructions=${instructions}, emotions=${emotions}, praise=${praise}`);

    return { questions, instructions, emotions, praise };
  }

  private extractKeywords(transcript: TranscriptEntry[]) {
    const allWords: string[] = [];
    
    transcript.forEach(entry => {
      if (!entry.text || typeof entry.text !== 'string') return;
      
      // 한국어 텍스트 처리
      const words = entry.text.toLowerCase()
        .replace(/[^\w\s가-힣]/g, ' ') // 특수문자 제거, 한글 유지
        .split(/\s+/)
        .filter(word => word.length > 0);
      
      allWords.push(...words);
    });

    // 불용어 제거 (한국어 불용어 포함)
    const stopwords = new Set([
      '이', '그', '저', '것', '을', '를', '이', '가', '은', '는', '에', '의', '와', '과', '도', '만', '에서', '으로', '부터', '까지',
      '하다', '있다', '되다', '같다', '보다', '주다', '받다', '가다', '오다', '들다', '나다', '말다',
      '아', '어', '오', '우', '으', '음', '네', '요', '해', '해요', '합니다', '이다', '입니다'
    ]);
    
    const filteredWords = allWords.filter(word => 
      !stopwords.has(word) && 
      word.length > 1 && 
      !/^\d+$/.test(word) // 숫자만인 단어 제외
    );

    // 빈도 계산
    const frequency: Record<string, number> = {};
    filteredWords.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    // 최소 2회 이상 나온 단어만 선택
    const significantWords = Object.entries(frequency)
      .filter(([_, count]) => count >= 2)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10) as Array<[string, number]>;

    console.log(`📝 Keywords extracted: ${significantWords.length} significant words from ${filteredWords.length} total words`);

    return {
      topKeywords: significantWords,
      totalUniqueWords: Object.keys(frequency).length,
      totalWords: filteredWords.length
    };
  }

  private analyzeTimeline(transcript: TranscriptEntry[]) {
    if (transcript.length === 0) {
      return [];
    }

    const timeline: Array<{
      timeRange: string;
      parentUtterances: number;
      childUtterances: number;
    }> = [];

    // 전체 시간 범위 계산
    const sortedTranscript = [...transcript].sort((a, b) => a.time - b.time);
    const maxTime = Math.max(...sortedTranscript.map(t => t.time));
    const intervals = Math.max(1, Math.ceil(maxTime / 60)); // 1분 단위

    for (let i = 0; i < intervals; i++) {
      const startTime = i * 60;
      const endTime = (i + 1) * 60;
      
      const intervalTranscripts = sortedTranscript.filter(t => 
        t.time >= startTime && t.time < endTime
      );
      
      // 부모/자녀 구분 (화자 이름이나 번호로 추정)
      const parentUtterances = intervalTranscripts.filter(t => {
        const speaker = t.speaker.toLowerCase();
        return speaker.includes('1') || 
               speaker.includes('parent') || 
               speaker.includes('엄마') || 
               speaker.includes('아빠') ||
               speaker.includes('부모');
      }).length;
      
      const childUtterances = intervalTranscripts.filter(t => {
        const speaker = t.speaker.toLowerCase();
        return speaker.includes('2') || 
               speaker.includes('child') || 
               speaker.includes('아이') || 
               speaker.includes('자녀');
      }).length;

      // 구분이 안 되는 경우 첫 번째 화자를 부모로 가정
      const totalClassified = parentUtterances + childUtterances;
      const unclassified = intervalTranscripts.length - totalClassified;
      
      timeline.push({
        timeRange: `${i}-${i+1}분`,
        parentUtterances: parentUtterances + Math.floor(unclassified / 2),
        childUtterances: childUtterances + Math.ceil(unclassified / 2)
      });
    }

    console.log(`📊 Timeline created: ${timeline.length} intervals`);

    return timeline;
  }

  private createEmptyResult(): LanguageInteractionResult {
    return {
      basicStats: {},
      conversationPatterns: {
        avgResponseTime: 0,
        turnCount: 0,
        initiationCount: {}
      },
      utteranceTypes: {
        questions: 0,
        instructions: 0,
        emotions: 0,
        praise: 0
      },
      keywords: {
        topKeywords: [],
        totalUniqueWords: 0,
        totalWords: 0
      },
      timeline: []
    };
  }
} 