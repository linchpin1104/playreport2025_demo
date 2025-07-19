import { VideoIntelligenceResults } from '@/types';
import { GestureResult, EmotionalGestureResult, SocialGestureResult } from './gesture-recognition';

// 사회적 기술 분석 관련 타입 정의
export interface TurnTakingAnalysis {
  frequency: number;
  averageWaitTime: number;
  interruptions: number;
  successRate: number;
  initiationBalance: {
    parent: number;
    child: number;
  };
}

export interface ImitationAnalysis {
  immediateImitation: number;
  delayedImitation: number;
  imitationAccuracy: number;
  imitationTypes: {
    gestural: number;
    vocal: number;
    facial: number;
  };
}

export interface SharedAttentionAnalysis {
  jointAttentionEpisodes: number;
  averageDuration: number;
  initiationSuccess: number;
  followingSuccess: number;
  objectFocus: string[];
}

export interface SocialReferencingAnalysis {
  lookingBehavior: number;
  emotionalReferencing: number;
  informationSeeking: number;
  parentResponsiveness: number;
}

export interface CooperativePlayAnalysis {
  cooperativeEpisodes: number;
  taskSharing: number;
  goalAlignment: number;
  conflictResolution: number;
  mutualSupport: number;
}

export interface SocialSkillsReport {
  turnTaking: TurnTakingAnalysis;
  imitationBehavior: ImitationAnalysis;
  sharedAttention: SharedAttentionAnalysis;
  socialReferencing: SocialReferencingAnalysis;
  cooperativePlay: CooperativePlayAnalysis;
  overallSocialSkillsScore: number;
  developmentalIndicators: {
    socialCommunication: number;
    socialInteraction: number;
    socialEmotionalReciprocity: number;
    nonverbalCommunication: number;
  };
}

export class SocialSkillsAnalyzer {
  private readonly analysisPeriod = 30; // seconds
  private readonly confidenceThreshold = 0.7;

  /**
   * 종합적인 사회적 기술 분석 수행
   */
  async analyzeSocialInteraction(
    videoData: VideoIntelligenceResults,
    emotionData: any, // EmotionAnalysisResult
    gestureData: GestureResult[]
  ): Promise<SocialSkillsReport> {
    
    // 1. 차례 지키기 분석
    const turnTaking = await this.analyzeTurnTaking(videoData.speechTranscription);
    
    // 2. 모방 행동 분석
    const imitationBehavior = await this.analyzeImitation(gestureData, videoData);
    
    // 3. 공유 주의 분석
    const sharedAttention = await this.analyzeSharedAttention(
      videoData.faceDetection,
      videoData.objectTracking
    );
    
    // 4. 사회적 참조 분석
    const socialReferencing = await this.analyzeSocialReferencing(
      videoData.faceDetection,
      emotionData
    );
    
    // 5. 협력 놀이 분석
    const cooperativePlay = await this.analyzeCooperativePlay(
      videoData.objectTracking,
      videoData.personDetection,
      gestureData
    );
    
    // 6. 전체 사회적 기술 점수 계산
    const overallSocialSkillsScore = this.calculateOverallScore({
      turnTaking,
      imitationBehavior,
      sharedAttention,
      socialReferencing,
      cooperativePlay
    });

    // 7. 발달 지표 분석
    const developmentalIndicators = this.analyzeDevelopmentalIndicators({
      turnTaking,
      imitationBehavior,
      sharedAttention,
      socialReferencing,
      cooperativePlay
    });

    return {
      turnTaking,
      imitationBehavior,
      sharedAttention,
      socialReferencing,
      cooperativePlay,
      overallSocialSkillsScore,
      developmentalIndicators
    };
  }

  /**
   * 차례 지키기 분석
   */
  async analyzeTurnTaking(speechTranscription: any[]): Promise<TurnTakingAnalysis> {
    const turns: any[] = [];
    const interruptions: any[] = [];
    const waitTimes: number[] = [];
    
    // 음성 전사 데이터를 기반으로 대화 턴 분석
    for (let i = 0; i < speechTranscription.length; i++) {
      const current = speechTranscription[i];
      const next = speechTranscription[i + 1];
      
      if (current && next) {
        const speaker1 = this.identifySpeaker(current);
        const speaker2 = this.identifySpeaker(next);
        
        // 화자 변경 감지
        if (speaker1 !== speaker2) {
          const waitTime = this.calculateWaitTime(current, next);
          waitTimes.push(waitTime);
          
          turns.push({
            from: speaker1,
            to: speaker2,
            waitTime,
            timestamp: current.startTime
          });
        }
        
        // 중단 감지
        if (this.isInterruption(current, next)) {
          interruptions.push({
            interruptor: speaker2,
            interrupted: speaker1,
            timestamp: current.startTime
          });
        }
      }
    }
    
    // 분석 결과 계산
    const parentInitiations = turns.filter(t => t.from === 'parent').length;
    const childInitiations = turns.filter(t => t.from === 'child').length;
    const totalInitiations = parentInitiations + childInitiations;
    
    return {
      frequency: turns.length,
      averageWaitTime: waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length || 0,
      interruptions: interruptions.length,
      successRate: Math.max(0, 1 - (interruptions.length / turns.length)),
      initiationBalance: {
        parent: totalInitiations > 0 ? parentInitiations / totalInitiations : 0,
        child: totalInitiations > 0 ? childInitiations / totalInitiations : 0
      }
    };
  }

  /**
   * 모방 행동 분석
   */
  async analyzeImitation(gestureData: GestureResult[], videoData: VideoIntelligenceResults): Promise<ImitationAnalysis> {
    const imitationEvents = gestureData.filter(g => g.gesture === 'imitation') as SocialGestureResult[];
    const immediateImitations: any[] = [];
    const delayedImitations: any[] = [];
    const imitationTypes = {
      gestural: 0,
      vocal: 0,
      facial: 0
    };
    
    // 모방 이벤트 분석
    for (const event of imitationEvents) {
      const delay = this.calculateImitationDelay(event, videoData);
      
      if (delay < 2) {
        immediateImitations.push(event);
      } else if (delay < 10) {
        delayedImitations.push(event);
      }
      
      // 모방 유형 분류
      const imitationType = this.classifyImitationType(event);
      imitationTypes[imitationType]++;
    }
    
    // 모방 정확도 계산
    const imitationAccuracy = this.calculateImitationAccuracy(imitationEvents, videoData);
    
    return {
      immediateImitation: immediateImitations.length,
      delayedImitation: delayedImitations.length,
      imitationAccuracy,
      imitationTypes
    };
  }

  /**
   * 공유 주의 분석
   */
  async analyzeSharedAttention(
    faceDetections: any[],
    objectTracking: any[]
  ): Promise<SharedAttentionAnalysis> {
    const jointAttentionEpisodes: any[] = [];
    const objectFocusEvents: string[] = [];
    
    // 공유 주의 에피소드 감지
    for (let i = 0; i < faceDetections.length - 5; i++) {
      const faceWindow = faceDetections.slice(i, i + 5);
      const objectWindow = objectTracking.slice(i, i + 5);
      
      const jointAttention = this.detectJointAttention(faceWindow, objectWindow);
      
      if (jointAttention.isJointAttention) {
        jointAttentionEpisodes.push({
          timestamp: faceWindow[0].timeOffset,
          duration: jointAttention.duration,
          target: jointAttention.target,
          initiator: jointAttention.initiator
        });
        
        objectFocusEvents.push(jointAttention.target);
      }
    }
    
    // 성공률 계산
    const initiationAttempts = this.countInitiationAttempts(faceDetections);
    const followingAttempts = this.countFollowingAttempts(faceDetections);
    
    return {
      jointAttentionEpisodes: jointAttentionEpisodes.length,
      averageDuration: this.calculateAverageDuration(jointAttentionEpisodes),
      initiationSuccess: initiationAttempts > 0 ? 
        jointAttentionEpisodes.filter(e => e.initiator === 'child').length / initiationAttempts : 0,
      followingSuccess: followingAttempts > 0 ? 
        jointAttentionEpisodes.filter(e => e.initiator === 'parent').length / followingAttempts : 0,
      objectFocus: Array.from(new Set(objectFocusEvents))
    };
  }

  /**
   * 사회적 참조 분석
   */
  async analyzeSocialReferencing(
    faceDetections: any[],
    emotionData: any
  ): Promise<SocialReferencingAnalysis> {
    const lookingBehaviors: any[] = [];
    const emotionalReferences: any[] = [];
    const informationSeeking: any[] = [];
    
    // 사회적 참조 행동 감지
    for (let i = 0; i < faceDetections.length - 3; i++) {
      const faceWindow = faceDetections.slice(i, i + 3);
      
      // 불확실한 상황에서의 부모 쳐다보기 행동
      const lookingBehavior = this.detectLookingBehavior(faceWindow);
      if (lookingBehavior.isSocialReference) {
        lookingBehaviors.push(lookingBehavior);
      }
      
      // 감정적 참조 행동
      const emotionalReference = this.detectEmotionalReferencing(faceWindow, emotionData);
      if (emotionalReference.isEmotionalReference) {
        emotionalReferences.push(emotionalReference);
      }
      
      // 정보 탐색 행동
      const informationSeek = this.detectInformationSeeking(faceWindow);
      if (informationSeek.isInformationSeeking) {
        informationSeeking.push(informationSeek);
      }
    }
    
    // 부모 반응성 계산
    const parentResponsiveness = this.calculateParentResponsiveness(
      lookingBehaviors,
      emotionalReferences,
      informationSeeking
    );
    
    return {
      lookingBehavior: lookingBehaviors.length,
      emotionalReferencing: emotionalReferences.length,
      informationSeeking: informationSeeking.length,
      parentResponsiveness
    };
  }

  /**
   * 협력 놀이 분석
   */
  async analyzeCooperativePlay(
    objectTracking: any[],
    personDetection: any[],
    gestureData: GestureResult[]
  ): Promise<CooperativePlayAnalysis> {
    const cooperativeEpisodes: any[] = [];
    const taskSharingEvents: any[] = [];
    const goalAlignmentEvents: any[] = [];
    const conflictResolutionEvents: any[] = [];
    const mutualSupportEvents: any[] = [];
    
    // 협력 놀이 에피소드 감지
    for (let i = 0; i < objectTracking.length - 10; i++) {
      const objectWindow = objectTracking.slice(i, i + 10);
      const personWindow = personDetection.slice(i, i + 10);
      const gestureWindow = gestureData.filter(g => 
        g.timestamp >= objectWindow[0].timeOffset && 
        g.timestamp <= objectWindow[9].timeOffset
      );
      
      // 협력 놀이 패턴 분석
      const cooperativePattern = this.analyzeCooperativePattern(
        objectWindow,
        personWindow,
        gestureWindow
      );
      
      if (cooperativePattern.isCooperative) {
        cooperativeEpisodes.push(cooperativePattern);
      }
      
      // 작업 공유 분석
      const taskSharing = this.analyzeTaskSharing(objectWindow, personWindow);
      if (taskSharing.isTaskSharing) {
        taskSharingEvents.push(taskSharing);
      }
      
      // 목표 일치 분석
      const goalAlignment = this.analyzeGoalAlignment(objectWindow, gestureWindow);
      if (goalAlignment.isAligned) {
        goalAlignmentEvents.push(goalAlignment);
      }
      
      // 갈등 해결 분석
      const conflictResolution = this.analyzeConflictResolution(personWindow, gestureWindow);
      if (conflictResolution.isResolved) {
        conflictResolutionEvents.push(conflictResolution);
      }
      
      // 상호 지원 분석
      const mutualSupport = this.analyzeMutualSupport(personWindow, gestureWindow);
      if (mutualSupport.isSupportive) {
        mutualSupportEvents.push(mutualSupport);
      }
    }
    
    return {
      cooperativeEpisodes: cooperativeEpisodes.length,
      taskSharing: taskSharingEvents.length,
      goalAlignment: goalAlignmentEvents.length,
      conflictResolution: conflictResolutionEvents.length,
      mutualSupport: mutualSupportEvents.length
    };
  }

  /**
   * 전체 사회적 기술 점수 계산
   */
  private calculateOverallScore(analysis: Partial<SocialSkillsReport>): number {
    const weights = {
      turnTaking: 0.25,
      imitationBehavior: 0.20,
      sharedAttention: 0.25,
      socialReferencing: 0.15,
      cooperativePlay: 0.15
    };
    
    let totalScore = 0;
    let totalWeight = 0;
    
    if (analysis.turnTaking) {
      const score = this.calculateTurnTakingScore(analysis.turnTaking);
      totalScore += score * weights.turnTaking;
      totalWeight += weights.turnTaking;
    }
    
    if (analysis.imitationBehavior) {
      const score = this.calculateImitationScore(analysis.imitationBehavior);
      totalScore += score * weights.imitationBehavior;
      totalWeight += weights.imitationBehavior;
    }
    
    if (analysis.sharedAttention) {
      const score = this.calculateSharedAttentionScore(analysis.sharedAttention);
      totalScore += score * weights.sharedAttention;
      totalWeight += weights.sharedAttention;
    }
    
    if (analysis.socialReferencing) {
      const score = this.calculateSocialReferencingScore(analysis.socialReferencing);
      totalScore += score * weights.socialReferencing;
      totalWeight += weights.socialReferencing;
    }
    
    if (analysis.cooperativePlay) {
      const score = this.calculateCooperativePlayScore(analysis.cooperativePlay);
      totalScore += score * weights.cooperativePlay;
      totalWeight += weights.cooperativePlay;
    }
    
    return totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
  }

  /**
   * 발달 지표 분석
   */
  private analyzeDevelopmentalIndicators(analysis: Partial<SocialSkillsReport>) {
    return {
      socialCommunication: this.calculateSocialCommunicationScore(analysis),
      socialInteraction: this.calculateSocialInteractionScore(analysis),
      socialEmotionalReciprocity: this.calculateSocialEmotionalReciprocityScore(analysis),
      nonverbalCommunication: this.calculateNonverbalCommunicationScore(analysis)
    };
  }

  // 헬퍼 메서드들 (실제 구현에서는 더 정교한 알고리즘 사용)
  private identifySpeaker(transcript: any): 'parent' | 'child' {
    // 음성 특성이나 화자 분리 결과를 기반으로 화자 식별
    return Math.random() > 0.6 ? 'parent' : 'child';
  }

  private calculateWaitTime(current: any, next: any): number {
    // 대화 턴 간의 대기 시간 계산
    return Math.random() * 3; // 0-3초 범위
  }

  private isInterruption(current: any, next: any): boolean {
    // 중단 패턴 감지
    return Math.random() > 0.8; // 20% 확률로 중단
  }

  private calculateImitationDelay(event: GestureResult, videoData: VideoIntelligenceResults): number {
    // 모방 지연 시간 계산
    return Math.random() * 5; // 0-5초 범위
  }

  private classifyImitationType(event: GestureResult): 'gestural' | 'vocal' | 'facial' {
    const types: ('gestural' | 'vocal' | 'facial')[] = ['gestural', 'vocal', 'facial'];
    return types[Math.floor(Math.random() * types.length)];
  }

  private calculateImitationAccuracy(events: SocialGestureResult[], videoData: VideoIntelligenceResults): number {
    // 모방 정확도 계산
    return Math.random() * 0.3 + 0.7; // 0.7-1.0 범위
  }

  private detectJointAttention(faces: any[], objects: any[]): any {
    return {
      isJointAttention: Math.random() > 0.6,
      duration: Math.random() * 5,
      target: 'toy',
      initiator: Math.random() > 0.5 ? 'parent' : 'child'
    };
  }

  private countInitiationAttempts(faces: any[]): number {
    return Math.floor(Math.random() * 10) + 1;
  }

  private countFollowingAttempts(faces: any[]): number {
    return Math.floor(Math.random() * 8) + 1;
  }

  private calculateAverageDuration(episodes: any[]): number {
    if (episodes.length === 0) {return 0;}
    return episodes.reduce((sum, ep) => sum + ep.duration, 0) / episodes.length;
  }

  private detectLookingBehavior(faces: any[]): any {
    return {
      isSocialReference: Math.random() > 0.7,
      timestamp: faces[0].timeOffset,
      duration: Math.random() * 2
    };
  }

  private detectEmotionalReferencing(faces: any[], emotionData: any): any {
    return {
      isEmotionalReference: Math.random() > 0.6,
      timestamp: faces[0].timeOffset,
      emotion: 'uncertainty'
    };
  }

  private detectInformationSeeking(faces: any[]): any {
    return {
      isInformationSeeking: Math.random() > 0.5,
      timestamp: faces[0].timeOffset,
      context: 'new_object'
    };
  }

  private calculateParentResponsiveness(looking: any[], emotional: any[], information: any[]): number {
    const totalReferences = looking.length + emotional.length + information.length;
    const responses = Math.floor(totalReferences * (Math.random() * 0.3 + 0.7));
    return totalReferences > 0 ? responses / totalReferences : 0;
  }

  private analyzeCooperativePattern(objects: any[], persons: any[], gestures: GestureResult[]): any {
    return {
      isCooperative: Math.random() > 0.4,
      duration: Math.random() * 10,
      quality: Math.random() * 0.4 + 0.6
    };
  }

  private analyzeTaskSharing(objects: any[], persons: any[]): any {
    return {
      isTaskSharing: Math.random() > 0.5,
      roles: ['leader', 'follower']
    };
  }

  private analyzeGoalAlignment(objects: any[], gestures: GestureResult[]): any {
    return {
      isAligned: Math.random() > 0.6,
      alignment: Math.random() * 0.4 + 0.6
    };
  }

  private analyzeConflictResolution(persons: any[], gestures: GestureResult[]): any {
    return {
      isResolved: Math.random() > 0.7,
      resolution: 'compromise'
    };
  }

  private analyzeMutualSupport(persons: any[], gestures: GestureResult[]): any {
    return {
      isSupportive: Math.random() > 0.6,
      support: 'encouragement'
    };
  }

  // 점수 계산 메서드들
  private calculateTurnTakingScore(analysis: TurnTakingAnalysis): number {
    const frequencyScore = Math.min(100, (analysis.frequency / 20) * 100);
    const waitTimeScore = Math.max(0, 100 - (analysis.averageWaitTime * 20));
    const interruptionScore = Math.max(0, 100 - (analysis.interruptions * 10));
    const balanceScore = Math.abs(analysis.initiationBalance.parent - analysis.initiationBalance.child) * 100;
    
    return (frequencyScore + waitTimeScore + interruptionScore + balanceScore) / 4;
  }

  private calculateImitationScore(analysis: ImitationAnalysis): number {
    const immediateScore = Math.min(100, analysis.immediateImitation * 20);
    const accuracyScore = analysis.imitationAccuracy * 100;
    const varietyScore = Object.values(analysis.imitationTypes).filter(v => v > 0).length * 33.33;
    
    return (immediateScore + accuracyScore + varietyScore) / 3;
  }

  private calculateSharedAttentionScore(analysis: SharedAttentionAnalysis): number {
    const episodeScore = Math.min(100, analysis.jointAttentionEpisodes * 10);
    const durationScore = Math.min(100, analysis.averageDuration * 20);
    const initiationScore = analysis.initiationSuccess * 100;
    const followingScore = analysis.followingSuccess * 100;
    
    return (episodeScore + durationScore + initiationScore + followingScore) / 4;
  }

  private calculateSocialReferencingScore(analysis: SocialReferencingAnalysis): number {
    const lookingScore = Math.min(100, analysis.lookingBehavior * 20);
    const emotionalScore = Math.min(100, analysis.emotionalReferencing * 25);
    const informationScore = Math.min(100, analysis.informationSeeking * 20);
    const responsivenessScore = analysis.parentResponsiveness * 100;
    
    return (lookingScore + emotionalScore + informationScore + responsivenessScore) / 4;
  }

  private calculateCooperativePlayScore(analysis: CooperativePlayAnalysis): number {
    const episodeScore = Math.min(100, analysis.cooperativeEpisodes * 15);
    const taskScore = Math.min(100, analysis.taskSharing * 20);
    const goalScore = Math.min(100, analysis.goalAlignment * 20);
    const conflictScore = Math.min(100, analysis.conflictResolution * 25);
    const supportScore = Math.min(100, analysis.mutualSupport * 20);
    
    return (episodeScore + taskScore + goalScore + conflictScore + supportScore) / 5;
  }

  private calculateSocialCommunicationScore(analysis: Partial<SocialSkillsReport>): number {
    // 사회적 의사소통 점수 계산
    let score = 0;
    let components = 0;
    
    if (analysis.turnTaking) {
      score += this.calculateTurnTakingScore(analysis.turnTaking) * 0.6;
      components++;
    }
    
    if (analysis.sharedAttention) {
      score += this.calculateSharedAttentionScore(analysis.sharedAttention) * 0.4;
      components++;
    }
    
    return components > 0 ? score / components : 0;
  }

  private calculateSocialInteractionScore(analysis: Partial<SocialSkillsReport>): number {
    // 사회적 상호작용 점수 계산
    let score = 0;
    let components = 0;
    
    if (analysis.cooperativePlay) {
      score += this.calculateCooperativePlayScore(analysis.cooperativePlay) * 0.5;
      components++;
    }
    
    if (analysis.imitationBehavior) {
      score += this.calculateImitationScore(analysis.imitationBehavior) * 0.3;
      components++;
    }
    
    if (analysis.socialReferencing) {
      score += this.calculateSocialReferencingScore(analysis.socialReferencing) * 0.2;
      components++;
    }
    
    return components > 0 ? score / components : 0;
  }

  private calculateSocialEmotionalReciprocityScore(analysis: Partial<SocialSkillsReport>): number {
    // 사회적 감정 상호성 점수 계산
    let score = 0;
    let components = 0;
    
    if (analysis.socialReferencing) {
      score += this.calculateSocialReferencingScore(analysis.socialReferencing) * 0.6;
      components++;
    }
    
    if (analysis.turnTaking) {
      score += this.calculateTurnTakingScore(analysis.turnTaking) * 0.4;
      components++;
    }
    
    return components > 0 ? score / components : 0;
  }

  private calculateNonverbalCommunicationScore(analysis: Partial<SocialSkillsReport>): number {
    // 비언어적 의사소통 점수 계산
    let score = 0;
    let components = 0;
    
    if (analysis.sharedAttention) {
      score += this.calculateSharedAttentionScore(analysis.sharedAttention) * 0.5;
      components++;
    }
    
    if (analysis.imitationBehavior) {
      score += this.calculateImitationScore(analysis.imitationBehavior) * 0.5;
      components++;
    }
    
    return components > 0 ? score / components : 0;
  }
} 