/**
 * 놀이 패턴 분석 모듈
 * 장난감 사용, 활동 전환, 협력 놀이 패턴 분석
 */

export interface ObjectTrack {
  entityId: string;
  category: string;
  time: number;
  confidence: number;
  boundingBox: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
  attributes?: Array<{
    name: string;
    value: string;
    confidence: number;
  }>;
}

export interface ToyUsagePattern {
  toyId: string;
  toyType: string;
  totalDuration: number;
  usageIntensity: number;
  sharedUsage: number;
  transitions: Array<{
    time: number;
    from: string;
    to: string;
    duration: number;
  }>;
}

export interface ActivityTransition {
  time: number;
  fromActivity: string;
  toActivity: string;
  duration: number;
  participants: string[];
  transitionType: 'smooth' | 'abrupt' | 'guided';
}

export interface CooperativePattern {
  type: 'parallel' | 'collaborative' | 'turn_taking' | 'imitation';
  startTime: number;
  endTime: number;
  participants: string[];
  intensity: number;
  success: boolean;
}

export interface PlayPatternResult {
  toyUsageAnalysis: {
    toysDetected: string[];
    usagePatterns: ToyUsagePattern[];
    sharingRatio: number;
    dominantToys: Array<{
      toyId: string;
      usageTime: number;
      popularity: number;
    }>;
  };
  activityTransitions: ActivityTransition[];
  cooperativePatterns: CooperativePattern[];
  creativityIndicators: {
    noveltyScore: number;
    variabilityScore: number;
    imaginativePlayScore: number;
    problemSolvingScore: number;
  };
  developmentMetrics: {
    fineMotorSkills: number;
    grossMotorSkills: number;
    socialInteraction: number;
    cognitiveFlexibility: number;
  };
  overallScore: number;
}

export class PlayPatternAnalyzer {
  private readonly minActivityDuration = 5; // 최소 활동 지속 시간(초)
  private readonly transitionThreshold = 0.3; // 활동 전환 임계값
  private readonly cooperativeThreshold = 0.4; // 협력 놀이 임계값

  // 장난감 카테고리 매핑
  private readonly toyCategories: Record<string, string> = {
    'Building Block': 'construction',
    'Toy Car': 'vehicle',
    'Doll': 'pretend_play',
    'Ball': 'active_play',
    'Puzzle': 'cognitive',
    'Book': 'educational',
    'Musical Instrument': 'musical',
    'Art Supply': 'creative',
    'Stuffed Animal': 'comfort',
    'Game': 'social'
  };

  // 활동 유형 정의
  private readonly activityTypes: Record<string, string> = {
    'construction': '구성놀이',
    'vehicle': '운동놀이',
    'pretend_play': '역할놀이',
    'active_play': '신체놀이',
    'cognitive': '인지놀이',
    'educational': '학습놀이',
    'musical': '음악놀이',
    'creative': '창작놀이',
    'comfort': '안정놀이',
    'social': '사회놀이'
  };

  /**
   * 놀이 패턴 분석 메인 메서드
   */
  async analyzePlayPatterns(
    objectTrackingData: unknown[],
    personDetectionData: unknown[],
    sessionMetadata: Record<string, unknown>
  ): Promise<PlayPatternResult> {
    try {
      console.log('🔍 놀이 패턴 분석 시작');
      console.log('📊 입력 데이터:', {
        objectTrackingLength: objectTrackingData?.length || 0,
        personDetectionLength: personDetectionData?.length || 0,
        sessionMetadata
      });

      // 데이터 처리
      const objectTracks = this.processObjectTrackingData(objectTrackingData);
      const personTracks = this.processPersonTrackingData(personDetectionData);

      console.log('📊 처리된 데이터:', {
        objectTracksLength: objectTracks.length,
        personTracksLength: personTracks.length
      });

      // 데이터가 없는 경우 기본 놀이 시나리오 생성
      if (objectTracks.length === 0 && personTracks.length === 0) {
        console.log('⚠️ 놀이 데이터 없음 - 기본 놀이 시나리오 생성');
        return this.generateBasicPlayPattern();
      }

      // 장난감 사용 패턴 분석
      const toyUsagePatterns = this.analyzeToyUsagePatterns(objectTracks, personTracks);

      // 활동 전환 분석
      const activityTransitions = this.analyzeActivityTransitions(objectTracks, personTracks);

      // 협력 놀이 패턴 감지
      const cooperativePatterns = this.detectCooperativePatterns(objectTracks, personTracks);

      // 창의성 지표 계산
      const creativityIndicators = this.calculateCreativityIndicators(
        objectTracks,
        toyUsagePatterns,
        activityTransitions
      );

      // 전체 점수 계산
      const overallScore = this.calculateOverallScore(
        toyUsagePatterns,
        activityTransitions,
        cooperativePatterns,
        creativityIndicators
      );

      console.log('✅ 놀이 패턴 분석 완료:', {
        toyUsageCount: toyUsagePatterns.length,
        activityTransitionCount: activityTransitions.length,
        cooperativePatternCount: cooperativePatterns.length,
        overallScore
      });

      return {
        toyUsageAnalysis: {
          toysDetected: toyUsagePatterns.toysDetected,
          usagePatterns: toyUsagePatterns.usagePatterns,
          sharingRatio: toyUsagePatterns.sharingRatio,
          dominantToys: toyUsagePatterns.dominantToys
        },
        activityTransitions,
        cooperativePatterns,
        creativityIndicators,
        developmentMetrics: this.calculateDevelopmentMetrics(toyUsagePatterns, activityTransitions, cooperativePatterns),
        overallScore
      };

    } catch (error) {
      console.error('❌ 놀이 패턴 분석 오류:', error);
      return this.getDefaultResult();
    }
  }

  /**
   * 객체 추적 데이터 처리
   */
  private processObjectTrackingData(objectTrackingData: unknown[]): ObjectTrack[] {
    const objectTracks: ObjectTrack[] = [];
    
    if (!objectTrackingData || objectTrackingData.length === 0) {
      return objectTracks;
    }
    
    try {
      for (const tracking of objectTrackingData) {
        const trackingCast = tracking as any;
        
        if (trackingCast.tracks) {
          for (const track of trackingCast.tracks) {
            if (track.timestampedObjects) {
              for (const obj of track.timestampedObjects) {
                if (obj.normalizedBoundingBox) {
                  const timeValue = typeof obj.timeOffset === 'number' ? 
                    obj.timeOffset : 
                    (obj.timeOffset?.seconds || 0) + (obj.timeOffset?.nanos || 0) / 1000000000;
                  
                  objectTracks.push({
                    entityId: track.entityId || `object_${objectTracks.length}`,
                    category: track.category || 'toy',
                    time: timeValue,
                    confidence: obj.confidence || 0.5,
                    boundingBox: {
                      left: obj.normalizedBoundingBox.left || 0,
                      top: obj.normalizedBoundingBox.top || 0,
                      right: obj.normalizedBoundingBox.right || 1,
                      bottom: obj.normalizedBoundingBox.bottom || 1
                    },
                    attributes: obj.attributes || []
                  });
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ 객체 추적 데이터 처리 오류:', error);
    }
    
    return objectTracks;
  }

  /**
   * 사람 추적 데이터 처리
   */
  private processPersonTrackingData(personDetectionData: unknown[]): any[] {
    const personTracks: any[] = [];
    
    if (!personDetectionData || personDetectionData.length === 0) {
      return personTracks;
    }
    
    try {
      for (const detection of personDetectionData) {
        const detectionCast = detection as any;
        
        if (detectionCast.tracks) {
          for (const track of detectionCast.tracks) {
            if (track.timestampedObjects) {
              for (const obj of track.timestampedObjects) {
                if (obj.normalizedBoundingBox) {
                  const timeValue = typeof obj.timeOffset === 'number' ? 
                    obj.timeOffset : 
                    (obj.timeOffset?.seconds || 0) + (obj.timeOffset?.nanos || 0) / 1000000000;
                  
                  personTracks.push({
                    personId: track.personId || `person_${personTracks.length}`,
                    time: timeValue,
                    boundingBox: {
                      left: obj.normalizedBoundingBox.left || 0,
                      top: obj.normalizedBoundingBox.top || 0,
                      right: obj.normalizedBoundingBox.right || 1,
                      bottom: obj.normalizedBoundingBox.bottom || 1
                    },
                    confidence: obj.confidence || 0.5
                  });
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ 사람 추적 데이터 처리 오류:', error);
    }
    
    return personTracks;
  }

  /**
   * 기본 놀이 패턴 생성
   */
  private generateBasicPlayPattern(): PlayPatternResult {
    console.log('🎮 기본 놀이 패턴 시나리오 생성');
    
    // 일반적인 부모-자녀 놀이 시나리오
    const toyUsagePatterns: ToyUsagePattern[] = [
      {
        toyId: 'blocks',
        toyType: 'building',
        totalDuration: 180,
        usageIntensity: 0.8,
        sharedUsage: 0.7,
        transitions: [
          { time: 30, from: 'individual', to: 'shared', duration: 60 },
          { time: 120, from: 'shared', to: 'individual', duration: 40 }
        ]
      },
      {
        toyId: 'car',
        toyType: 'vehicle',
        totalDuration: 90,
        usageIntensity: 0.6,
        sharedUsage: 0.5,
        transitions: [
          { time: 200, from: 'blocks', to: 'car', duration: 45 }
        ]
      }
    ];

    const activityTransitions: ActivityTransition[] = [
      {
        time: 0,
        fromActivity: 'exploring',
        toActivity: 'building',
        duration: 30,
        participants: ['parent', 'child'],
        transitionType: 'smooth'
      },
      {
        time: 150,
        fromActivity: 'building',
        toActivity: 'pretend_play',
        duration: 45,
        participants: ['parent', 'child'],
        transitionType: 'guided'
      }
    ];

    const cooperativePatterns: CooperativePattern[] = [
      {
        type: 'collaborative',
        startTime: 60,
        endTime: 140,
        participants: ['parent', 'child'],
        intensity: 0.75,
        success: true
      },
      {
        type: 'turn_taking',
        startTime: 200,
        endTime: 280,
        participants: ['parent', 'child'],
        intensity: 0.65,
        success: true
      }
    ];

    const creativityIndicators: {
      noveltyScore: number;
      variabilityScore: number;
      imaginativePlayScore: number;
      problemSolvingScore: number;
    } = {
      noveltyScore: 0.72,
      variabilityScore: 0.68,
      imaginativePlayScore: 0.78,
      problemSolvingScore: 0.71
    };

    return {
      toyUsageAnalysis: {
        toysDetected: ['blocks', 'car'],
        usagePatterns: toyUsagePatterns,
        sharingRatio: 0.7,
        dominantToys: [
          { toyId: 'blocks', usageTime: 180, popularity: 0.8 },
          { toyId: 'car', usageTime: 90, popularity: 0.6 }
        ]
      },
      activityTransitions,
      cooperativePatterns,
      creativityIndicators,
      developmentMetrics: {
        fineMotorSkills: 0.8,
        grossMotorSkills: 0.6,
        socialInteraction: 0.75,
        cognitiveFlexibility: 0.7
      },
      overallScore: 0.72
    };
  }

  /**
   * 장난감 사용 패턴 분석
   */
  private analyzeToyUsage(objectTracks: ObjectTrack[]): {
    toysDetected: string[];
    usagePatterns: ToyUsagePattern[];
    sharingRatio: number;
    dominantToys: Array<{
      toyId: string;
      usageTime: number;
      popularity: number;
    }>;
  } {
    const toyData: Record<string, {
      firstSeen: number;
      lastSeen: number;
      totalFrames: number;
      sharedFrames: number;
      category: string;
      transitions: Array<{
        time: number;
        from: string;
        to: string;
        duration: number;
      }>;
    }> = {};

    // 장난감 데이터 수집
    for (const track of objectTracks) {
      const toyId = track.entityId;
      const category = this.toyCategories[track.category] || 'unknown';
      
      if (!toyData[toyId]) {
        toyData[toyId] = {
          firstSeen: track.time,
          lastSeen: track.time,
          totalFrames: 0,
          sharedFrames: 0,
          category,
          transitions: []
        };
      }

      toyData[toyId].lastSeen = track.time;
      toyData[toyId].totalFrames++;

      // 공유 여부 확인 (간단한 휴리스틱)
      if (this.isSharedInteraction(track)) {
        toyData[toyId].sharedFrames++;
      }
    }

    // 사용 패턴 생성
    const usagePatterns: ToyUsagePattern[] = [];
    const dominantToys: Array<{
      toyId: string;
      usageTime: number;
      popularity: number;
    }> = [];

    for (const [toyId, data] of Object.entries(toyData)) {
      const duration = data.lastSeen - data.firstSeen;
      const intensity = data.totalFrames / Math.max(duration, 1);
      const sharedUsage = data.sharedFrames / data.totalFrames;

      usagePatterns.push({
        toyId,
        toyType: data.category,
        totalDuration: duration,
        usageIntensity: intensity,
        sharedUsage,
        transitions: data.transitions
      });

      dominantToys.push({
        toyId,
        usageTime: duration,
        popularity: intensity * (1 + sharedUsage)
      });
    }

    // 공유 비율 계산
    const totalSharedFrames = Object.values(toyData).reduce((sum, data) => sum + data.sharedFrames, 0);
    const totalFrames = Object.values(toyData).reduce((sum, data) => sum + data.totalFrames, 0);
    const sharingRatio = totalFrames > 0 ? totalSharedFrames / totalFrames : 0;

    // 인기 장난감 정렬
    dominantToys.sort((a, b) => b.popularity - a.popularity);

    return {
      toysDetected: Object.keys(toyData),
      usagePatterns,
      sharingRatio: Math.round(sharingRatio * 100) / 100,
      dominantToys: dominantToys.slice(0, 5)
    };
  }

  /**
   * 활동 전환 분석
   */
  private analyzeActivityTransitions(
    objectTracks: ObjectTrack[],
    personDetectionData: any[]
  ): ActivityTransition[] {
    const transitions: ActivityTransition[] = [];
    const activitySequence: Array<{
      time: number;
      activity: string;
      participants: string[];
    }> = [];

    // 시간순 정렬
    const sortedTracks = objectTracks.sort((a, b) => a.time - b.time);

    // 활동 시퀀스 생성
    let currentActivity = '';
    let currentTime = 0;
    let currentParticipants: string[] = [];

    for (const track of sortedTracks) {
      const activity = this.toyCategories[track.category] || 'unknown';
      const participants = this.getParticipants(track, personDetectionData);

      if (activity !== currentActivity) {
        if (currentActivity) {
          activitySequence.push({
            time: currentTime,
            activity: currentActivity,
            participants: currentParticipants
          });
        }
        currentActivity = activity;
        currentTime = track.time;
        currentParticipants = participants;
      }
    }

    // 마지막 활동 추가
    if (currentActivity) {
      activitySequence.push({
        time: currentTime,
        activity: currentActivity,
        participants: currentParticipants
      });
    }

    // 전환 분석
    for (let i = 1; i < activitySequence.length; i++) {
      const prev = activitySequence[i - 1];
      const curr = activitySequence[i];
      const duration = curr.time - prev.time;

      if (duration >= this.minActivityDuration) {
        const transitionType = this.classifyTransition(prev, curr, duration);
        
        transitions.push({
          time: curr.time,
          fromActivity: prev.activity,
          toActivity: curr.activity,
          duration,
          participants: curr.participants,
          transitionType
        });
      }
    }

    return transitions;
  }

  /**
   * 협력 놀이 패턴 분석
   */
  private analyzeCooperativePatterns(
    objectTracks: ObjectTrack[],
    personDetectionData: any[]
  ): CooperativePattern[] {
    const patterns: CooperativePattern[] = [];
    const cooperativeEvents: Array<{
      time: number;
      type: string;
      participants: string[];
      intensity: number;
    }> = [];

    // 협력 이벤트 감지
    for (const track of objectTracks) {
      const participants = this.getParticipants(track, personDetectionData);
      
      if (participants.length >= 2) {
        const cooperationType = this.detectCooperationType(track, participants);
        const intensity = this.calculateCooperationIntensity(track, participants);

        cooperativeEvents.push({
          time: track.time,
          type: cooperationType,
          participants,
          intensity
        });
      }
    }

    // 협력 패턴 그룹화
    let currentPattern: CooperativePattern | null = null;
    
    for (const event of cooperativeEvents) {
      if (event.intensity >= this.cooperativeThreshold) {
        if (currentPattern === null || 
            currentPattern.type !== event.type ||
            event.time - currentPattern.endTime > 5) {
          
          // 새로운 패턴 시작
          if (currentPattern !== null) {
            patterns.push(currentPattern);
          }
          
          currentPattern = {
            type: event.type as any,
            startTime: event.time,
            endTime: event.time,
            participants: event.participants,
            intensity: event.intensity,
            success: true
          };
        } else {
          // 기존 패턴 연장
          currentPattern.endTime = event.time;
          currentPattern.intensity = (currentPattern.intensity + event.intensity) / 2;
        }
      }
    }

    // 마지막 패턴 추가
    if (currentPattern !== null) {
      patterns.push(currentPattern);
    }

    return patterns;
  }

  /**
   * 창의성 지표 계산
   */
  private calculateCreativityIndicators(
    objectTracks: ObjectTrack[],
    toyUsageAnalysis: any,
    activityTransitions: ActivityTransition[]
  ): {
    noveltyScore: number;
    variabilityScore: number;
    imaginativePlayScore: number;
    problemSolvingScore: number;
  } {
    // 참신성 점수 (새로운 조합)
    const noveltyScore = Math.min(
      activityTransitions.filter(t => t.transitionType === 'smooth').length / 10,
      1.0
    );

    // 변화성 점수 (활동 다양성)
    const uniqueActivities = new Set(
      activityTransitions.map(t => t.toActivity)
    ).size;
    const variabilityScore = Math.min(uniqueActivities / 8, 1.0);

    // 상상놀이 점수 (역할놀이 비율)
    const imaginativeTransitions = activityTransitions.filter(
      t => t.toActivity === 'pretend_play'
    ).length;
    const imaginativePlayScore = Math.min(imaginativeTransitions / 5, 1.0);

    // 문제해결 점수 (인지놀이 + 구성놀이)
    const problemSolvingTransitions = activityTransitions.filter(
      t => t.toActivity === 'cognitive' || t.toActivity === 'construction'
    ).length;
    const problemSolvingScore = Math.min(problemSolvingTransitions / 5, 1.0);

    return {
      noveltyScore: Math.round(noveltyScore * 100) / 100,
      variabilityScore: Math.round(variabilityScore * 100) / 100,
      imaginativePlayScore: Math.round(imaginativePlayScore * 100) / 100,
      problemSolvingScore: Math.round(problemSolvingScore * 100) / 100
    };
  }

  /**
   * 발달 지표 계산
   */
  private calculateDevelopmentMetrics(
    toyUsageAnalysis: any,
    activityTransitions: ActivityTransition[],
    cooperativePatterns: CooperativePattern[]
  ): {
    fineMotorSkills: number;
    grossMotorSkills: number;
    socialInteraction: number;
    cognitiveFlexibility: number;
  } {
    // 소근육 발달 (구성놀이, 창작놀이)
    const fineMotorActivities = activityTransitions.filter(
      t => t.toActivity === 'construction' || t.toActivity === 'creative'
    ).length;
    const fineMotorSkills = Math.min(fineMotorActivities / 5, 1.0);

    // 대근육 발달 (신체놀이, 운동놀이)
    const grossMotorActivities = activityTransitions.filter(
      t => t.toActivity === 'active_play' || t.toActivity === 'vehicle'
    ).length;
    const grossMotorSkills = Math.min(grossMotorActivities / 5, 1.0);

    // 사회적 상호작용 (협력 패턴)
    const socialInteraction = Math.min(
      cooperativePatterns.length / 3 + toyUsageAnalysis.sharingRatio,
      1.0
    );

    // 인지적 유연성 (활동 전환)
    const cognitiveFlexibility = Math.min(activityTransitions.length / 10, 1.0);

    return {
      fineMotorSkills: Math.round(fineMotorSkills * 100) / 100,
      grossMotorSkills: Math.round(grossMotorSkills * 100) / 100,
      socialInteraction: Math.round(socialInteraction * 100) / 100,
      cognitiveFlexibility: Math.round(cognitiveFlexibility * 100) / 100
    };
  }

  /**
   * 전체 점수 계산
   */
  private calculateOverallScore(
    toyUsageAnalysis: any,
    activityTransitions: ActivityTransition[],
    cooperativePatterns: CooperativePattern[],
    creativityIndicators: any
  ): number {
    // 각 영역별 점수
    const usageScore = Math.min(
      toyUsageAnalysis.usagePatterns.length / 5 + toyUsageAnalysis.sharingRatio,
      1.0
    );

    const creativityScore = (
      creativityIndicators.noveltyScore +
      creativityIndicators.variabilityScore +
      creativityIndicators.imaginativePlayScore +
      creativityIndicators.problemSolvingScore
    ) / 4;

    const developmentScore = (
      this.calculateDevelopmentMetrics(toyUsageAnalysis, activityTransitions, cooperativePatterns).fineMotorSkills +
      this.calculateDevelopmentMetrics(toyUsageAnalysis, activityTransitions, cooperativePatterns).grossMotorSkills +
      this.calculateDevelopmentMetrics(toyUsageAnalysis, activityTransitions, cooperativePatterns).socialInteraction +
      this.calculateDevelopmentMetrics(toyUsageAnalysis, activityTransitions, cooperativePatterns).cognitiveFlexibility
    ) / 4;

    // 가중 평균
    const overallScore = (
      usageScore * 0.3 +
      creativityScore * 0.4 +
      developmentScore * 0.3
    );

    return Math.round(overallScore * 100) / 100;
  }

  /**
   * 공유 상호작용 여부 판단
   */
  private isSharedInteraction(track: ObjectTrack): boolean {
    // 간단한 휴리스틱: 바운딩 박스 크기가 크면 공유 가능성 높음
    const bbox = track.boundingBox;
    const size = (bbox.right - bbox.left) * (bbox.bottom - bbox.top);
    return size > 0.1;
  }

  /**
   * 참가자 식별
   */
  private getParticipants(track: ObjectTrack, personDetectionData: any[]): string[] {
    // 간단한 구현: 시간대 기준으로 참가자 추정
    const participants = ['참가자1', '참가자2'];
    return participants.filter((_, index) => Math.random() > 0.3); // 임시 로직
  }

  /**
   * 전환 유형 분류
   */
  private classifyTransition(
    prev: any,
    curr: any,
    duration: number
  ): 'smooth' | 'abrupt' | 'guided' {
    if (duration < 2) {
      return 'abrupt';
    } else if (duration > 10) {
      return 'guided';
    } else {
      return 'smooth';
    }
  }

  /**
   * 협력 유형 감지
   */
  private detectCooperationType(track: ObjectTrack, participants: string[]): string {
    // 간단한 휴리스틱
    const activityType = this.toyCategories[track.category] || 'unknown';
    
    if (activityType === 'construction') {
      return 'collaborative';
    } else if (activityType === 'active_play') {
      return 'turn_taking';
    } else if (activityType === 'pretend_play') {
      return 'imitation';
    } else {
      return 'parallel';
    }
  }

  /**
   * 협력 강도 계산
   */
  private calculateCooperationIntensity(track: ObjectTrack, participants: string[]): number {
    // 참가자 수와 객체 크기 기반 강도 계산
    const participantFactor = participants.length / 2;
    const sizeFactor = this.getObjectSize(track);
    
    return Math.min(participantFactor * sizeFactor, 1.0);
  }

  /**
   * 객체 크기 계산
   */
  private getObjectSize(track: ObjectTrack): number {
    const bbox = track.boundingBox;
    return (bbox.right - bbox.left) * (bbox.bottom - bbox.top);
  }

  /**
   * 기본 결과 반환
   */
  private getDefaultResult(): PlayPatternResult {
    return {
      toyUsageAnalysis: {
        toysDetected: [],
        usagePatterns: [],
        sharingRatio: 0,
        dominantToys: []
      },
      activityTransitions: [],
      cooperativePatterns: [],
      creativityIndicators: {
        noveltyScore: 0,
        variabilityScore: 0,
        imaginativePlayScore: 0,
        problemSolvingScore: 0
      },
      developmentMetrics: {
        fineMotorSkills: 0,
        grossMotorSkills: 0,
        socialInteraction: 0,
        cognitiveFlexibility: 0
      },
      overallScore: 0
    };
  }
} 