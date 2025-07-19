/**
 * 대화 흐름 및 상호작용 패턴 분석 시스템
 * 
 * 기능:
 * - 턴 테이킹 패턴 분석
 * - 대화 주도권 분석
 * - 응답 패턴 분석
 * - 상호작용 품질 평가
 * - 대화 발달 지표 분석
 */

export interface ConversationTurn {
  speakerId: string;
  startTime: number;
  endTime: number;
  duration: number;
  transcript: string;
  turnType: 'INITIATION' | 'RESPONSE' | 'CONTINUATION' | 'INTERRUPTION';
  previousSpeaker?: string;
  nextSpeaker?: string;
  gapDuration?: number; // 이전 턴과의 간격
  overlapDuration?: number; // 겹치는 시간
}

export interface TurnTakingPatterns {
  totalTurns: number;
  averageTurnLength: number;
  turnDistribution: Record<string, number>; // 화자별 턴 수
  turnInitiation: Record<string, number>; // 화자별 대화 시작 횟수
  turnResponse: Record<string, number>; // 화자별 응답 횟수
  averageGapTime: number;
  averageOverlapTime: number;
  interruptions: {
    total: number;
    byInitiator: Record<string, number>;
    byTarget: Record<string, number>;
  };
  successfulTurns: number;
  failedTurns: number;
  turnCompletionRate: number;
}

export interface DialogueFlow {
  conversationRhythm: {
    consistency: number;
    naturalness: number;
    fluency: number;
    pacing: 'SLOW' | 'MODERATE' | 'FAST' | 'VARIABLE';
  };
  interactionQuality: {
    responsiveness: number;
    mutuality: number;
    synchronization: number;
    balance: number;
  };
  conversationDominance: {
    dominantSpeaker: string;
    dominanceScore: number;
    participationBalance: Record<string, number>;
    initiationBalance: Record<string, number>;
  };
  supportiveInteractions: {
    validations: number;
    encouragements: number;
    expansions: number;
    clarifications: number;
    agreements: number;
    disagreements: number;
  };
}

export interface ConversationDevelopment {
  scaffolding: {
    parentScaffolding: number;
    childResponsiveness: number;
    scaffoldingEffectiveness: number;
    languageExpansion: number;
  };
  learningOpportunities: {
    newVocabulary: string[];
    conceptIntroduction: string[];
    questionAsking: number;
    answerProviding: number;
    elaboration: number;
  };
  cognitiveEngagement: {
    problemSolving: number;
    creativity: number;
    criticalThinking: number;
    curiosity: number;
  };
  socialSkills: {
    politeness: number;
    cooperation: number;
    empathy: number;
    sharing: number;
    negotiation: number;
  };
}

export interface ConversationFlowAnalysisResult {
  turns: ConversationTurn[];
  turnTakingPatterns: TurnTakingPatterns;
  dialogueFlow: DialogueFlow;
  conversationDevelopment: ConversationDevelopment;
  parentChildDynamics: {
    parentingStyle: 'AUTHORITATIVE' | 'SUPPORTIVE' | 'DIRECTIVE' | 'PERMISSIVE';
    childEngagement: number;
    mutualEnjoyment: number;
    learningMoments: number;
    conflictResolution: number;
  };
  qualityMetrics: {
    overallQuality: number;
    developmentalAppropriate: number;
    interactionRichness: number;
    educationalValue: number;
  };
  recommendations: {
    conversationImprovement: string[];
    developmentSupport: string[];
    interactionEnhancement: string[];
  };
}

export class ConversationFlowAnalyzer {
  private readonly supportiveWords = ['좋아', '잘했어', '맞아', '그래', '대단해', '훌륭해', '멋져'];
  private readonly questionWords = ['뭐', '왜', '어떻게', '어디', '언제', '누구', '무엇'];
  private readonly expansionWords = ['그리고', '또', '더', '다시', '아니면', '만약'];
  private readonly scaffoldingWords = ['천천히', '같이', '함께', '도와줄게', '해보자'];

  /**
   * 대화 흐름 분석 수행
   */
  async analyzeConversationFlow(
    speechTranscriptionData: any[],
    speakerProfiles?: any[]
  ): Promise<ConversationFlowAnalysisResult> {
    console.log('Starting conversation flow analysis...');
    
    // 1. 대화 턴 추출
    const turns = await this.extractConversationTurns(speechTranscriptionData);
    
    // 2. 턴 테이킹 패턴 분석
    const turnTakingPatterns = await this.analyzeTurnTakingPatterns(turns);
    
    // 3. 대화 흐름 분석
    const dialogueFlow = await this.analyzeDialogueFlow(turns, turnTakingPatterns);
    
    // 4. 대화 발달 지표 분석
    const conversationDevelopment = await this.analyzeConversationDevelopment(turns, speakerProfiles);
    
    // 5. 부모-자녀 역학 분석
    const parentChildDynamics = await this.analyzeParentChildDynamics(turns, speakerProfiles);
    
    // 6. 품질 메트릭 계산
    const qualityMetrics = await this.calculateQualityMetrics(turns, dialogueFlow, conversationDevelopment);
    
    // 7. 권장사항 생성
    const recommendations = await this.generateRecommendations(turnTakingPatterns, dialogueFlow, conversationDevelopment);
    
    console.log('Conversation flow analysis completed');
    
    return {
      turns,
      turnTakingPatterns,
      dialogueFlow,
      conversationDevelopment,
      parentChildDynamics,
      qualityMetrics,
      recommendations
    };
  }

  /**
   * 대화 턴 추출
   */
  private async extractConversationTurns(speechData: any[]): Promise<ConversationTurn[]> {
    const turns: ConversationTurn[] = [];
    
    // 화자별 연속된 발화를 턴으로 그룹화
    let currentSpeaker: string | null = null;
    let currentTurn: Partial<ConversationTurn> | null = null;
    
    for (const transcript of speechData) {
      if (transcript.alternatives?.[0]?.words) {
        const words = transcript.alternatives[0].words;
        
        for (const word of words) {
          const speakerId = `speaker_${word.speakerTag || 1}`;
          const startTime = this.parseTime(word.startTime);
          const endTime = this.parseTime(word.endTime);
          
          if (currentSpeaker !== speakerId) {
            // 새로운 화자 시작 - 이전 턴 완료
            if (currentTurn) {
              turns.push({
                speakerId: currentTurn.speakerId!,
                startTime: currentTurn.startTime!,
                endTime: currentTurn.endTime!,
                duration: currentTurn.endTime! - currentTurn.startTime!,
                transcript: currentTurn.transcript!,
                turnType: this.determineTurnType(currentTurn, turns),
                previousSpeaker: turns.length > 0 ? turns[turns.length - 1].speakerId : undefined,
                gapDuration: this.calculateGapDuration(currentTurn, turns)
              });
            }
            
            // 새로운 턴 시작
            currentTurn = {
              speakerId,
              startTime,
              endTime,
              transcript: word.word || ''
            };
            currentSpeaker = speakerId;
          } else {
            // 같은 화자 계속
            if (currentTurn) {
              currentTurn.endTime = endTime;
              currentTurn.transcript += ` ${  word.word || ''}`;
            }
          }
        }
      }
    }
    
    // 마지막 턴 추가
    if (currentTurn) {
      turns.push({
        speakerId: currentTurn.speakerId!,
        startTime: currentTurn.startTime!,
        endTime: currentTurn.endTime!,
        duration: currentTurn.endTime! - currentTurn.startTime!,
        transcript: currentTurn.transcript!,
        turnType: this.determineTurnType(currentTurn, turns),
        previousSpeaker: turns.length > 0 ? turns[turns.length - 1].speakerId : undefined,
        gapDuration: this.calculateGapDuration(currentTurn, turns)
      });
    }
    
    // 다음 화자 정보 추가
    for (let i = 0; i < turns.length - 1; i++) {
      turns[i].nextSpeaker = turns[i + 1].speakerId;
    }
    
    return turns;
  }

  /**
   * 턴 타입 결정
   */
  private determineTurnType(
    currentTurn: Partial<ConversationTurn>, 
    existingTurns: ConversationTurn[]
  ): ConversationTurn['turnType'] {
    if (existingTurns.length === 0) {
      return 'INITIATION';
    }
    
    const lastTurn = existingTurns[existingTurns.length - 1];
    const gapDuration = this.calculateGapDuration(currentTurn, existingTurns);
    
    // 겹치는 시간이 있으면 인터럽션
    if (gapDuration !== undefined && gapDuration < 0) {
      return 'INTERRUPTION';
    }
    
    // 같은 화자가 계속 말하면 계속
    if (lastTurn.speakerId === currentTurn.speakerId) {
      return 'CONTINUATION';
    }
    
    // 다른 화자가 응답
    return 'RESPONSE';
  }

  /**
   * 간격 시간 계산
   */
  private calculateGapDuration(
    currentTurn: Partial<ConversationTurn>, 
    existingTurns: ConversationTurn[]
  ): number | undefined {
    if (existingTurns.length === 0) {return undefined;}
    
    const lastTurn = existingTurns[existingTurns.length - 1];
    return (currentTurn.startTime || 0) - lastTurn.endTime;
  }

  /**
   * 턴 테이킹 패턴 분석
   */
  private async analyzeTurnTakingPatterns(turns: ConversationTurn[]): Promise<TurnTakingPatterns> {
    const speakers = Array.from(new Set(turns.map(t => t.speakerId)));
    
    // 턴 분포 계산
    const turnDistribution: Record<string, number> = {};
    const turnInitiation: Record<string, number> = {};
    const turnResponse: Record<string, number> = {};
    
    speakers.forEach(speaker => {
      turnDistribution[speaker] = 0;
      turnInitiation[speaker] = 0;
      turnResponse[speaker] = 0;
    });
    
    let totalGapTime = 0;
    let totalOverlapTime = 0;
    let gapCount = 0;
    let overlapCount = 0;
    let successfulTurns = 0;
    let failedTurns = 0;
    
    const interruptions = {
      total: 0,
      byInitiator: {} as Record<string, number>,
      byTarget: {} as Record<string, number>
    };
    
    speakers.forEach(speaker => {
      interruptions.byInitiator[speaker] = 0;
      interruptions.byTarget[speaker] = 0;
    });
    
    turns.forEach(turn => {
      turnDistribution[turn.speakerId]++;
      
      if (turn.turnType === 'INITIATION') {
        turnInitiation[turn.speakerId]++;
      } else if (turn.turnType === 'RESPONSE') {
        turnResponse[turn.speakerId]++;
        successfulTurns++;
      } else if (turn.turnType === 'INTERRUPTION') {
        interruptions.total++;
        interruptions.byInitiator[turn.speakerId]++;
        if (turn.previousSpeaker) {
          interruptions.byTarget[turn.previousSpeaker]++;
        }
        failedTurns++;
      } else {
        successfulTurns++;
      }
      
      if (turn.gapDuration !== undefined) {
        if (turn.gapDuration >= 0) {
          totalGapTime += turn.gapDuration;
          gapCount++;
        } else {
          totalOverlapTime += Math.abs(turn.gapDuration);
          overlapCount++;
        }
      }
    });
    
    const averageTurnLength = turns.reduce((sum, turn) => sum + turn.duration, 0) / turns.length;
    const averageGapTime = gapCount > 0 ? totalGapTime / gapCount : 0;
    const averageOverlapTime = overlapCount > 0 ? totalOverlapTime / overlapCount : 0;
    const turnCompletionRate = turns.length > 0 ? successfulTurns / turns.length : 0;
    
    return {
      totalTurns: turns.length,
      averageTurnLength,
      turnDistribution,
      turnInitiation,
      turnResponse,
      averageGapTime,
      averageOverlapTime,
      interruptions,
      successfulTurns,
      failedTurns,
      turnCompletionRate
    };
  }

  /**
   * 대화 흐름 분석
   */
  private async analyzeDialogueFlow(
    turns: ConversationTurn[],
    turnTakingPatterns: TurnTakingPatterns
  ): Promise<DialogueFlow> {
    
    // 대화 리듬 분석
    const conversationRhythm = this.analyzeConversationRhythm(turns, turnTakingPatterns);
    
    // 상호작용 품질 분석
    const interactionQuality = this.analyzeInteractionQuality(turns, turnTakingPatterns);
    
    // 대화 지배력 분석
    const conversationDominance = this.analyzeConversationDominance(turns, turnTakingPatterns);
    
    // 지원적 상호작용 분석
    const supportiveInteractions = this.analyzeSupportiveInteractions(turns);
    
    return {
      conversationRhythm,
      interactionQuality,
      conversationDominance,
      supportiveInteractions
    };
  }

  /**
   * 대화 리듬 분석
   */
  private analyzeConversationRhythm(
    turns: ConversationTurn[],
    patterns: TurnTakingPatterns
  ): DialogueFlow['conversationRhythm'] {
    
    const gapVariance = this.calculateGapVariance(turns);
    const turnLengthVariance = this.calculateTurnLengthVariance(turns);
    
    const consistency = Math.max(0, 1 - (gapVariance + turnLengthVariance) / 2);
    const naturalness = patterns.turnCompletionRate;
    const fluency = Math.max(0, 1 - (patterns.interruptions.total / patterns.totalTurns));
    
    let pacing: 'SLOW' | 'MODERATE' | 'FAST' | 'VARIABLE' = 'MODERATE';
    if (patterns.averageGapTime > 2) {pacing = 'SLOW';}
    else if (patterns.averageGapTime < 0.5) {pacing = 'FAST';}
    else if (gapVariance > 0.5) {pacing = 'VARIABLE';}
    
    return {
      consistency,
      naturalness,
      fluency,
      pacing
    };
  }

  /**
   * 상호작용 품질 분석
   */
  private analyzeInteractionQuality(
    turns: ConversationTurn[],
    patterns: TurnTakingPatterns
  ): DialogueFlow['interactionQuality'] {
    
    const responsiveness = patterns.turnResponse ? 
      Object.values(patterns.turnResponse).reduce((sum, count) => sum + count, 0) / patterns.totalTurns : 0;
    
    const mutuality = this.calculateMutuality(patterns.turnDistribution);
    const synchronization = patterns.turnCompletionRate;
    const balance = this.calculateBalance(patterns.turnDistribution);
    
    return {
      responsiveness,
      mutuality,
      synchronization,
      balance
    };
  }

  /**
   * 대화 지배력 분석
   */
  private analyzeConversationDominance(
    turns: ConversationTurn[],
    patterns: TurnTakingPatterns
  ): DialogueFlow['conversationDominance'] {
    
    const speakers = Object.keys(patterns.turnDistribution);
    const dominantSpeaker = speakers.reduce((prev, curr) => 
      patterns.turnDistribution[prev] > patterns.turnDistribution[curr] ? prev : curr
    );
    
    const totalTurns = patterns.totalTurns;
    const dominantTurns = patterns.turnDistribution[dominantSpeaker];
    const dominanceScore = dominantTurns / totalTurns;
    
    const participationBalance: Record<string, number> = {};
    const initiationBalance: Record<string, number> = {};
    
    speakers.forEach(speaker => {
      participationBalance[speaker] = patterns.turnDistribution[speaker] / totalTurns;
      initiationBalance[speaker] = patterns.turnInitiation[speaker] / Object.values(patterns.turnInitiation).reduce((sum, count) => sum + count, 0);
    });
    
    return {
      dominantSpeaker,
      dominanceScore,
      participationBalance,
      initiationBalance
    };
  }

  /**
   * 지원적 상호작용 분석
   */
  private analyzeSupportiveInteractions(turns: ConversationTurn[]): DialogueFlow['supportiveInteractions'] {
    let validations = 0;
    let encouragements = 0;
    let expansions = 0;
    let clarifications = 0;
    let agreements = 0;
    let disagreements = 0;
    
    turns.forEach(turn => {
      const text = turn.transcript.toLowerCase();
      
      // 검증/확인
      if (this.supportiveWords.some(word => text.includes(word))) {
        validations++;
      }
      
      // 격려
      if (text.includes('잘했어') || text.includes('대단해') || text.includes('좋아')) {
        encouragements++;
      }
      
      // 확장
      if (this.expansionWords.some(word => text.includes(word))) {
        expansions++;
      }
      
      // 명확화
      if (this.questionWords.some(word => text.includes(word))) {
        clarifications++;
      }
      
      // 동의
      if (text.includes('맞아') || text.includes('그래') || text.includes('네')) {
        agreements++;
      }
      
      // 반대
      if (text.includes('아니야') || text.includes('안돼') || text.includes('싫어')) {
        disagreements++;
      }
    });
    
    return {
      validations,
      encouragements,
      expansions,
      clarifications,
      agreements,
      disagreements
    };
  }

  /**
   * 대화 발달 지표 분석
   */
  private async analyzeConversationDevelopment(
    turns: ConversationTurn[],
    speakerProfiles?: any[]
  ): Promise<ConversationDevelopment> {
    
    // 스캐폴딩 분석
    const scaffolding = this.analyzeScaffolding(turns, speakerProfiles);
    
    // 학습 기회 분석
    const learningOpportunities = this.analyzeLearningOpportunities(turns);
    
    // 인지적 참여 분석
    const cognitiveEngagement = this.analyzeCognitiveEngagement(turns);
    
    // 사회적 기술 분석
    const socialSkills = this.analyzeSocialSkills(turns);
    
    return {
      scaffolding,
      learningOpportunities,
      cognitiveEngagement,
      socialSkills
    };
  }

  /**
   * 스캐폴딩 분석
   */
  private analyzeScaffolding(
    turns: ConversationTurn[],
    speakerProfiles?: any[]
  ): ConversationDevelopment['scaffolding'] {
    
    // 부모와 자녀 식별
    const parentSpeaker = speakerProfiles?.find(p => p.demographics?.voiceMaturity === 'ADULT')?.speakerId;
    const childSpeaker = speakerProfiles?.find(p => p.demographics?.voiceMaturity === 'CHILD')?.speakerId;
    
    if (!parentSpeaker || !childSpeaker) {
      return {
        parentScaffolding: 0,
        childResponsiveness: 0,
        scaffoldingEffectiveness: 0,
        languageExpansion: 0
      };
    }
    
    const parentTurns = turns.filter(t => t.speakerId === parentSpeaker);
    const childTurns = turns.filter(t => t.speakerId === childSpeaker);
    
    // 부모 스캐폴딩 계산
    const scaffoldingCount = parentTurns.filter(turn => 
      this.scaffoldingWords.some(word => turn.transcript.toLowerCase().includes(word))
    ).length;
    const parentScaffolding = scaffoldingCount / parentTurns.length;
    
    // 자녀 반응성 계산
    const childResponses = childTurns.filter(turn => turn.turnType === 'RESPONSE').length;
    const childResponsiveness = childResponses / childTurns.length;
    
    // 스캐폴딩 효과성 계산
    const scaffoldingEffectiveness = (parentScaffolding + childResponsiveness) / 2;
    
    // 언어 확장 계산
    const expansionCount = parentTurns.filter(turn => 
      this.expansionWords.some(word => turn.transcript.toLowerCase().includes(word))
    ).length;
    const languageExpansion = expansionCount / parentTurns.length;
    
    return {
      parentScaffolding,
      childResponsiveness,
      scaffoldingEffectiveness,
      languageExpansion
    };
  }

  /**
   * 학습 기회 분석
   */
  private analyzeLearningOpportunities(turns: ConversationTurn[]): ConversationDevelopment['learningOpportunities'] {
    const allText = turns.map(t => t.transcript).join(' ');
    const words = allText.split(/\s+/);
    
    // 새로운 어휘 추정 (복잡한 단어들)
    const newVocabulary = words.filter(word => word.length > 5).slice(0, 10);
    
    // 개념 소개 (설명적 표현)
    const conceptWords = ['이것은', '저것은', '이게', '저게', '이거는', '저거는'];
    const conceptIntroduction = conceptWords.filter(concept => allText.includes(concept));
    
    // 질문하기
    const questionAsking = (allText.match(/\?/g) || []).length;
    
    // 답변 제공
    const answerProviding = turns.filter(turn => 
      turn.turnType === 'RESPONSE' && turn.transcript.length > 10
    ).length;
    
    // 상세 설명
    const elaboration = turns.filter(turn => turn.transcript.length > 50).length;
    
    return {
      newVocabulary,
      conceptIntroduction,
      questionAsking,
      answerProviding,
      elaboration
    };
  }

  /**
   * 인지적 참여 분석
   */
  private analyzeCognitiveEngagement(turns: ConversationTurn[]): ConversationDevelopment['cognitiveEngagement'] {
    const allText = turns.map(t => t.transcript).join(' ').toLowerCase();
    
    // 문제 해결
    const problemSolvingWords = ['어떻게', '왜', '방법', '해결', '생각'];
    const problemSolving = problemSolvingWords.reduce((sum, word) => 
      sum + (allText.match(new RegExp(word, 'g')) || []).length, 0
    ) / turns.length;
    
    // 창의성
    const creativityWords = ['새로운', '다른', '만들어', '상상', '아이디어'];
    const creativity = creativityWords.reduce((sum, word) => 
      sum + (allText.match(new RegExp(word, 'g')) || []).length, 0
    ) / turns.length;
    
    // 비판적 사고
    const criticalThinkingWords = ['생각해', '왜', '어떻게', '만약', '그럼'];
    const criticalThinking = criticalThinkingWords.reduce((sum, word) => 
      sum + (allText.match(new RegExp(word, 'g')) || []).length, 0
    ) / turns.length;
    
    // 호기심
    const curiosityWords = ['궁금', '신기', '재미있', '놀라', '모르겠'];
    const curiosity = curiosityWords.reduce((sum, word) => 
      sum + (allText.match(new RegExp(word, 'g')) || []).length, 0
    ) / turns.length;
    
    return {
      problemSolving: Math.min(1, problemSolving),
      creativity: Math.min(1, creativity),
      criticalThinking: Math.min(1, criticalThinking),
      curiosity: Math.min(1, curiosity)
    };
  }

  /**
   * 사회적 기술 분석
   */
  private analyzeSocialSkills(turns: ConversationTurn[]): ConversationDevelopment['socialSkills'] {
    const allText = turns.map(t => t.transcript).join(' ').toLowerCase();
    
    // 예의
    const politenessWords = ['감사', '미안', '죄송', '고마워', '안녕'];
    const politeness = politenessWords.reduce((sum, word) => 
      sum + (allText.match(new RegExp(word, 'g')) || []).length, 0
    ) / turns.length;
    
    // 협력
    const cooperationWords = ['함께', '같이', '도와', '협력', '우리'];
    const cooperation = cooperationWords.reduce((sum, word) => 
      sum + (allText.match(new RegExp(word, 'g')) || []).length, 0
    ) / turns.length;
    
    // 공감
    const empathyWords = ['이해', '공감', '느낌', '기분', '마음'];
    const empathy = empathyWords.reduce((sum, word) => 
      sum + (allText.match(new RegExp(word, 'g')) || []).length, 0
    ) / turns.length;
    
    // 공유
    const sharingWords = ['나눠', '함께', '같이', '주고', '받고'];
    const sharing = sharingWords.reduce((sum, word) => 
      sum + (allText.match(new RegExp(word, 'g')) || []).length, 0
    ) / turns.length;
    
    // 협상
    const negotiationWords = ['아니면', '그럼', '만약', '대신', '바꿔'];
    const negotiation = negotiationWords.reduce((sum, word) => 
      sum + (allText.match(new RegExp(word, 'g')) || []).length, 0
    ) / turns.length;
    
    return {
      politeness: Math.min(1, politeness),
      cooperation: Math.min(1, cooperation),
      empathy: Math.min(1, empathy),
      sharing: Math.min(1, sharing),
      negotiation: Math.min(1, negotiation)
    };
  }

  /**
   * 부모-자녀 역학 분석
   */
  private async analyzeParentChildDynamics(
    turns: ConversationTurn[],
    speakerProfiles?: any[]
  ): Promise<ConversationFlowAnalysisResult['parentChildDynamics']> {
    
    // 부모 스타일 분석
    const parentingStyle = this.analyzeParentingStyle(turns, speakerProfiles);
    
    // 자녀 참여도 분석
    const childEngagement = this.analyzeChildEngagement(turns, speakerProfiles);
    
    // 상호 즐거움 분석
    const mutualEnjoyment = this.analyzeMutualEnjoyment(turns);
    
    // 학습 순간 분석
    const learningMoments = this.analyzeLearningMoments(turns);
    
    // 갈등 해결 분석
    const conflictResolution = this.analyzeConflictResolution(turns);
    
    return {
      parentingStyle,
      childEngagement,
      mutualEnjoyment,
      learningMoments,
      conflictResolution
    };
  }

  /**
   * 부모 스타일 분석
   */
  private analyzeParentingStyle(
    turns: ConversationTurn[],
    speakerProfiles?: any[]
  ): 'AUTHORITATIVE' | 'SUPPORTIVE' | 'DIRECTIVE' | 'PERMISSIVE' {
    
    const parentSpeaker = speakerProfiles?.find(p => p.demographics?.voiceMaturity === 'ADULT')?.speakerId;
    if (!parentSpeaker) {return 'SUPPORTIVE';}
    
    const parentTurns = turns.filter(t => t.speakerId === parentSpeaker);
    const parentText = parentTurns.map(t => t.transcript).join(' ').toLowerCase();
    
    // 지시적 표현
    const directiveCount = (parentText.match(/해야|하지마|안돼|해/g) || []).length;
    
    // 지원적 표현
    const supportiveCount = (parentText.match(/좋아|잘했어|도와줄게|함께/g) || []).length;
    
    // 권위적 표현
    const authoritativeCount = (parentText.match(/왜냐하면|이유는|생각해봐/g) || []).length;
    
    // 허용적 표현
    const permissiveCount = (parentText.match(/괜찮아|맘대로|하고싶은대로/g) || []).length;
    
    const scores = {
      DIRECTIVE: directiveCount,
      SUPPORTIVE: supportiveCount,
      AUTHORITATIVE: authoritativeCount,
      PERMISSIVE: permissiveCount
    };
    
    return Object.entries(scores).reduce((prev, curr) => 
      curr[1] > scores[prev] ? curr[0] as keyof typeof scores : prev
    , 'SUPPORTIVE' as keyof typeof scores);
  }

  /**
   * 자녀 참여도 분석
   */
  private analyzeChildEngagement(
    turns: ConversationTurn[],
    speakerProfiles?: any[]
  ): number {
    const childSpeaker = speakerProfiles?.find(p => p.demographics?.voiceMaturity === 'CHILD')?.speakerId;
    if (!childSpeaker) {return 0;}
    
    const childTurns = turns.filter(t => t.speakerId === childSpeaker);
    const totalTurns = turns.length;
    
    // 참여 비율
    const participationRate = childTurns.length / totalTurns;
    
    // 자발적 발화 비율
    const initiationRate = childTurns.filter(t => t.turnType === 'INITIATION').length / childTurns.length;
    
    // 평균 발화 길이
    const avgTurnLength = childTurns.reduce((sum, turn) => sum + turn.transcript.length, 0) / childTurns.length;
    const lengthScore = Math.min(1, avgTurnLength / 50);
    
    return (participationRate * 0.4 + initiationRate * 0.3 + lengthScore * 0.3);
  }

  /**
   * 상호 즐거움 분석
   */
  private analyzeMutualEnjoyment(turns: ConversationTurn[]): number {
    const allText = turns.map(t => t.transcript).join(' ').toLowerCase();
    
    const enjoymentWords = ['재미있', '좋아', '신나', '웃음', '하하', '기뻐', '즐거'];
    const enjoymentCount = enjoymentWords.reduce((sum, word) => 
      sum + (allText.match(new RegExp(word, 'g')) || []).length, 0
    );
    
    return Math.min(1, enjoymentCount / 10);
  }

  /**
   * 학습 순간 분석
   */
  private analyzeLearningMoments(turns: ConversationTurn[]): number {
    const learningMoments = turns.filter(turn => {
      const text = turn.transcript.toLowerCase();
      return text.includes('배우') || text.includes('알아') || text.includes('새로') || 
             text.includes('처음') || text.includes('몰랐') || text.includes('신기');
    });
    
    return learningMoments.length;
  }

  /**
   * 갈등 해결 분석
   */
  private analyzeConflictResolution(turns: ConversationTurn[]): number {
    const conflictWords = ['안돼', '싫어', '아니야', '힘들어'];
    const resolutionWords = ['괜찮아', '이해', '미안', '다시', '함께'];
    
    const allText = turns.map(t => t.transcript).join(' ').toLowerCase();
    
    const conflictCount = conflictWords.reduce((sum, word) => 
      sum + (allText.match(new RegExp(word, 'g')) || []).length, 0
    );
    
    const resolutionCount = resolutionWords.reduce((sum, word) => 
      sum + (allText.match(new RegExp(word, 'g')) || []).length, 0
    );
    
    return conflictCount > 0 ? resolutionCount / conflictCount : 1;
  }

  /**
   * 품질 메트릭 계산
   */
  private async calculateQualityMetrics(
    turns: ConversationTurn[],
    dialogueFlow: DialogueFlow,
    conversationDevelopment: ConversationDevelopment
  ): Promise<ConversationFlowAnalysisResult['qualityMetrics']> {
    
    const overallQuality = (
      dialogueFlow.interactionQuality.balance * 0.3 +
      dialogueFlow.interactionQuality.responsiveness * 0.3 +
      dialogueFlow.conversationRhythm.naturalness * 0.4
    );
    
    const developmentalAppropriate = (
      conversationDevelopment.scaffolding.scaffoldingEffectiveness * 0.4 +
      conversationDevelopment.cognitiveEngagement.curiosity * 0.3 +
      conversationDevelopment.socialSkills.cooperation * 0.3
    );
    
    const interactionRichness = (
      dialogueFlow.supportiveInteractions.validations +
      dialogueFlow.supportiveInteractions.encouragements +
      dialogueFlow.supportiveInteractions.expansions
    ) / turns.length;
    
    const educationalValue = (
      conversationDevelopment.learningOpportunities.questionAsking +
      conversationDevelopment.learningOpportunities.answerProviding +
      conversationDevelopment.learningOpportunities.elaboration
    ) / turns.length;
    
    return {
      overallQuality,
      developmentalAppropriate,
      interactionRichness: Math.min(1, interactionRichness),
      educationalValue: Math.min(1, educationalValue)
    };
  }

  /**
   * 권장사항 생성
   */
  private async generateRecommendations(
    turnTakingPatterns: TurnTakingPatterns,
    dialogueFlow: DialogueFlow,
    conversationDevelopment: ConversationDevelopment
  ): Promise<ConversationFlowAnalysisResult['recommendations']> {
    
    const conversationImprovement: string[] = [];
    const developmentSupport: string[] = [];
    const interactionEnhancement: string[] = [];
    
    // 대화 개선 권장사항
    if (turnTakingPatterns.interruptions.total > turnTakingPatterns.totalTurns * 0.2) {
      conversationImprovement.push('상대방의 말을 끝까지 들어주세요.');
    }
    
    if (dialogueFlow.interactionQuality.balance < 0.6) {
      conversationImprovement.push('대화 참여 균형을 맞춰보세요.');
    }
    
    if (dialogueFlow.conversationRhythm.consistency < 0.7) {
      conversationImprovement.push('일정한 대화 리듬을 유지해보세요.');
    }
    
    // 발달 지원 권장사항
    if (conversationDevelopment.scaffolding.parentScaffolding < 0.5) {
      developmentSupport.push('자녀의 학습을 더 적극적으로 도와주세요.');
    }
    
    if (conversationDevelopment.cognitiveEngagement.curiosity < 0.5) {
      developmentSupport.push('호기심을 자극하는 질문을 더 많이 해보세요.');
    }
    
    if (conversationDevelopment.socialSkills.cooperation < 0.5) {
      developmentSupport.push('협력적 활동을 늘려보세요.');
    }
    
    // 상호작용 향상 권장사항
    if (dialogueFlow.supportiveInteractions.encouragements < 2) {
      interactionEnhancement.push('격려 표현을 더 많이 사용해보세요.');
    }
    
    if (dialogueFlow.supportiveInteractions.expansions < 2) {
      interactionEnhancement.push('아이의 말을 확장해주는 표현을 사용해보세요.');
    }
    
    return {
      conversationImprovement,
      developmentSupport,
      interactionEnhancement
    };
  }

  // 유틸리티 메서드들
  private parseTime(timeStr: string | any): number {
    if (typeof timeStr === 'string') {
      return parseFloat(timeStr.replace('s', ''));
    }
    return (timeStr?.seconds || 0) + (timeStr?.nanos || 0) / 1000000000;
  }

  private calculateGapVariance(turns: ConversationTurn[]): number {
    const gaps = turns.map(turn => turn.gapDuration || 0);
    const avgGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
    const variance = gaps.reduce((sum, gap) => sum + Math.pow(gap - avgGap, 2), 0) / gaps.length;
    return Math.sqrt(variance) / (avgGap + 1);
  }

  private calculateTurnLengthVariance(turns: ConversationTurn[]): number {
    const lengths = turns.map(turn => turn.duration);
    const avgLength = lengths.reduce((sum, length) => sum + length, 0) / lengths.length;
    const variance = lengths.reduce((sum, length) => sum + Math.pow(length - avgLength, 2), 0) / lengths.length;
    return Math.sqrt(variance) / avgLength;
  }

  private calculateMutuality(turnDistribution: Record<string, number>): number {
    const speakers = Object.keys(turnDistribution);
    if (speakers.length < 2) {return 0;}
    
    const totalTurns = Object.values(turnDistribution).reduce((sum, count) => sum + count, 0);
    const expectedTurns = totalTurns / speakers.length;
    
    const variance = speakers.reduce((sum, speaker) => {
      return sum + Math.pow(turnDistribution[speaker] - expectedTurns, 2);
    }, 0) / speakers.length;
    
    return Math.max(0, 1 - Math.sqrt(variance) / expectedTurns);
  }

  private calculateBalance(turnDistribution: Record<string, number>): number {
    const speakers = Object.keys(turnDistribution);
    if (speakers.length < 2) {return 1;}
    
    const totalTurns = Object.values(turnDistribution).reduce((sum, count) => sum + count, 0);
    const ratios = speakers.map(speaker => turnDistribution[speaker] / totalTurns);
    
    // 가장 균형잡힌 상태는 모든 화자가 동등한 비율
    const idealRatio = 1 / speakers.length;
    const deviations = ratios.map(ratio => Math.abs(ratio - idealRatio));
    const avgDeviation = deviations.reduce((sum, dev) => sum + dev, 0) / deviations.length;
    
    return Math.max(0, 1 - (avgDeviation / idealRatio));
  }
} 