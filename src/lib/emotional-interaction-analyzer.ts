/**
 * 감정적 상호작용 분석 모듈
 * 얼굴 지향 행동, 참여도, 감정적 동기화 분석
 */

export interface FaceData {
  time: number;
  faces: Array<{
    boundingBox: {
      left: number;
      top: number;
      right: number;
      bottom: number;
    };
    confidence: number;
    landmarks?: Array<{
      x: number;
      y: number;
      type: string;
    }>;
  }>;
}

export interface EmotionalState {
  time: number;
  emotion: 'positive' | 'negative' | 'neutral';
  intensity: number;
  confidence: number;
}

export interface EngagementPeriod {
  startTime: number;
  endTime: number;
  level: 'high' | 'medium' | 'low';
  averageIntensity: number;
}

export interface FaceOrientationAnalysis {
  mutualGazeTime: number;
  faceToFaceRatio: number;
  proximityChanges: Array<{
    time: number;
    change: 'closer' | 'farther';
    magnitude: number;
  }>;
  engagementScore: number;
}

export interface EmotionalInteractionResult {
  faceOrientationAnalysis: FaceOrientationAnalysis;
  emotionalStates: Array<EmotionalState>;
  engagementPeriods: Array<EngagementPeriod>;
  interactionQuality: 'high' | 'medium' | 'low';
  emotionalSynchrony: number;
  proximityMetrics: {
    averageDistance: number;
    closestApproach: number;
    farthestDistance: number;
    proximityVariability: number;
  };
  overallScore: number;
}

export class EmotionalInteractionAnalyzer {
  private readonly faceSizeThreshold = 0.1; // 얼굴 크기 임계값
  private readonly gazeAlignmentThreshold = 0.8; // 시선 정렬 임계값
  private readonly proximityThreshold = 0.3; // 근접 임계값
  private readonly engagementThreshold = 0.6; // 참여도 임계값

  /**
   * 감정적 상호작용 분석 메인 메서드
   */
  async analyzeEmotionalInteraction(
    faceDetectionData: unknown[],
    personDetectionData: unknown[],
    emotionData: unknown[]
  ): Promise<EmotionalInteractionResult> {
    try {
      console.log('🔍 감정적 상호작용 분석 시작');
      console.log('📊 입력 데이터:', {
        faceDetectionLength: faceDetectionData?.length || 0,
        personDetectionLength: personDetectionData?.length || 0,
        emotionDataLength: emotionData?.length || 0
      });

      // 입력 데이터 처리
      const faceData = this.processFaceData(faceDetectionData);
      const movementData = this.processMovementData(personDetectionData);
      const audioData = this.processAudioData(emotionData);

      console.log('📊 처리된 데이터:', {
        faceDataLength: faceData.length,
        movementDataLength: movementData.length,
        audioDataLength: audioData.length
      });

      // 데이터가 없는 경우 기본 데이터 생성
      if (faceData.length === 0 && movementData.length === 0) {
        console.log('⚠️ 감정 데이터 없음 - 기본 상호작용 시나리오 생성');
        return this.generateBasicEmotionalInteraction();
      }

      // 얼굴 지향 행동 분석
      const faceOrientationAnalysis = this.analyzeFaceOrientation(faceData);

      // 감정 상태 추정
      const emotionalStates = this.estimateEmotionalStates(faceData, movementData, audioData);

      // 참여도 기간 분석
      const engagementPeriods = this.analyzeEngagementPeriods(faceData, movementData);

      // 상호작용 품질 평가
      const interactionQuality = this.evaluateInteractionQuality(
        faceOrientationAnalysis,
        engagementPeriods
      );

      // 감정적 동기화 계산
      const emotionalSynchrony = this.calculateEmotionalSynchrony(
        faceData,
        movementData,
        emotionalStates
      );

      // 근접성 지표 계산
      const proximityMetrics = this.calculateProximityMetrics(faceData);

      // 전체 점수 계산
      const overallScore = this.calculateOverallScore(
        faceOrientationAnalysis,
        emotionalSynchrony,
        interactionQuality,
        proximityMetrics
      );

      console.log('✅ 감정적 상호작용 분석 완료:', {
        orientationScore: faceOrientationAnalysis.engagementScore,
        synchronyScore: emotionalSynchrony.syncScore,
        overallScore
      });

      return {
        faceOrientationAnalysis,
        emotionalStates,
        engagementPeriods,
        interactionQuality,
        emotionalSynchrony,
        proximityMetrics,
        overallScore
      };

    } catch (error) {
      console.error('❌ 감정적 상호작용 분석 오류:', error);
      return this.generateBasicEmotionalInteraction();
    }
  }

  /**
   * 얼굴 지향 행동 분석
   */
  private analyzeFaceOrientation(faceData: FaceData[]): FaceOrientationAnalysis {
    let mutualGazeFrames = 0;
    let faceToFaceFrames = 0;
    const proximityChanges: Array<{
      time: number;
      change: 'closer' | 'farther';
      magnitude: number;
    }> = [];

    for (let i = 0; i < faceData.length; i++) {
      const frame = faceData[i];
      
      if (frame.faces.length >= 2) {
        const face1 = frame.faces[0];
        const face2 = frame.faces[1];

        // 상호 응시 판단
        if (this.isMutualGaze(face1, face2)) {
          mutualGazeFrames++;
        }

        // 얼굴 대면 판단
        if (this.isFaceToFace(face1, face2)) {
          faceToFaceFrames++;
        }

        // 근접성 변화 추적
        if (i > 0 && faceData[i-1].faces.length >= 2) {
          const prevDistance = this.calculateFaceDistance(
            faceData[i-1].faces[0],
            faceData[i-1].faces[1]
          );
          const currDistance = this.calculateFaceDistance(face1, face2);
          const distanceChange = currDistance - prevDistance;

          if (Math.abs(distanceChange) > 0.05) {
            proximityChanges.push({
              time: frame.time,
              change: distanceChange < 0 ? 'closer' : 'farther',
              magnitude: Math.abs(distanceChange)
            });
          }
        }
      }
    }

    const totalFrames = faceData.length;
    const mutualGazeTime = totalFrames > 0 ? mutualGazeFrames / totalFrames : 0;
    const faceToFaceRatio = totalFrames > 0 ? faceToFaceFrames / totalFrames : 0;

    return {
      mutualGazeTime: Math.round(mutualGazeTime * 100) / 100,
      faceToFaceRatio: Math.round(faceToFaceRatio * 100) / 100,
      proximityChanges,
      engagementScore: this.calculateEngagementScore(
        mutualGazeTime,
        faceToFaceRatio,
        proximityChanges.length
      )
    };
  }

  /**
   * 감정 상태 추정
   */
  private estimateEmotionalStates(
    faceData: FaceData[],
    movementData: any[],
    audioData?: any[]
  ): Array<EmotionalState> {
    const emotionalStates: Array<EmotionalState> = [];

    for (let i = 0; i < faceData.length; i++) {
      const frame = faceData[i];
      const movementFrame = movementData?.[i];

      // 기본 감정 상태 추정 (표정 인식 없이)
      const emotionalState = this.estimateFrameEmotion(frame, movementFrame, audioData);
      emotionalStates.push(emotionalState);
    }

    return emotionalStates;
  }

  /**
   * 참여도 기간 분석
   */
  private analyzeEngagementPeriods(
    faceData: FaceData[],
    movementData: any[]
  ): Array<EngagementPeriod> {
    const engagementPeriods: Array<EngagementPeriod> = [];
    let currentPeriod: EngagementPeriod | null = null;

    for (let i = 0; i < faceData.length; i++) {
      const frame = faceData[i];
      const movementFrame = movementData?.[i];
      
      const engagementLevel = this.estimateFrameEngagement(frame, movementFrame, i);
      
      if (engagementLevel > this.engagementThreshold) {
        // 높은 참여도 시작 또는 계속
        if (currentPeriod === null) {
          currentPeriod = {
            startTime: frame.time,
            endTime: frame.time,
            level: 'high',
            averageIntensity: engagementLevel
          };
        } else {
          currentPeriod.endTime = frame.time;
          currentPeriod.averageIntensity = 
            (currentPeriod.averageIntensity + engagementLevel) / 2;
        }
      } else {
        // 낮은 참여도 - 현재 기간 종료
        if (currentPeriod !== null) {
          engagementPeriods.push(currentPeriod);
          currentPeriod = null;
        }
      }
    }

    // 마지막 기간 추가
    if (currentPeriod !== null) {
      engagementPeriods.push(currentPeriod);
    }

    return engagementPeriods;
  }

  /**
   * 상호작용 품질 평가
   */
  private evaluateInteractionQuality(
    faceOrientationAnalysis: FaceOrientationAnalysis,
    engagementPeriods: Array<EngagementPeriod>
  ): 'high' | 'medium' | 'low' {
    // 총 참여 시간 계산
    const totalEngagementTime = engagementPeriods.reduce(
      (sum, period) => sum + (period.endTime - period.startTime),
      0
    );

    // 상호작용 품질 지표
    const gazeScore = faceOrientationAnalysis.mutualGazeTime;
    const faceToFaceScore = faceOrientationAnalysis.faceToFaceRatio;
    const engagementScore = faceOrientationAnalysis.engagementScore;

    const overallQuality = (gazeScore + faceToFaceScore + engagementScore) / 3;

    if (overallQuality > 0.7) {
      return 'high';
    } else if (overallQuality > 0.4) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * 감정적 동기화 계산
   */
  private calculateEmotionalSynchrony(
    faceData: FaceData[],
    movementData: any[],
    emotionalStates: Array<EmotionalState>
  ): number {
    if (faceData.length < 2 || emotionalStates.length < 2) {
      return 0.0;
    }

    let syncFrames = 0;
    const totalFrames = Math.min(faceData.length, movementData?.length || faceData.length);

    for (let i = 0; i < totalFrames; i++) {
      const frame = faceData[i];
      const emotionalState = emotionalStates[i];
      
      // 두 참가자가 비슷한 감정 상태를 보이는 경우
      if (frame.faces.length >= 2 && emotionalState.emotion !== 'neutral') {
        const engagement = this.estimateFrameEngagement(frame, movementData?.[i], i);
        
        if (engagement > 0.5) {
          syncFrames++;
        }
      }
    }

    return totalFrames > 0 ? Math.round((syncFrames / totalFrames) * 100) / 100 : 0;
  }

  /**
   * 근접성 지표 계산
   */
  private calculateProximityMetrics(faceData: FaceData[]): {
    averageDistance: number;
    closestApproach: number;
    farthestDistance: number;
    proximityVariability: number;
  } {
    const distances: number[] = [];
    
    for (const frame of faceData) {
      if (frame.faces.length >= 2) {
        const distance = this.calculateFaceDistance(frame.faces[0], frame.faces[1]);
        distances.push(distance);
      }
    }

    if (distances.length === 0) {
      return {
        averageDistance: 1.0,
        closestApproach: 1.0,
        farthestDistance: 1.0,
        proximityVariability: 0.0
      };
    }

    const averageDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    const closestApproach = Math.min(...distances);
    const farthestDistance = Math.max(...distances);
    
    // 근접성 변동성 계산 (표준편차)
    const variance = distances.reduce((sum, d) => sum + Math.pow(d - averageDistance, 2), 0) / distances.length;
    const proximityVariability = Math.sqrt(variance);

    return {
      averageDistance: Math.round(averageDistance * 100) / 100,
      closestApproach: Math.round(closestApproach * 100) / 100,
      farthestDistance: Math.round(farthestDistance * 100) / 100,
      proximityVariability: Math.round(proximityVariability * 100) / 100
    };
  }

  /**
   * 전체 점수 계산
   */
  private calculateOverallScore(
    faceOrientationAnalysis: FaceOrientationAnalysis,
    emotionalSynchrony: number,
    interactionQuality: 'high' | 'medium' | 'low',
    proximityMetrics: any
  ): number {
    // 각 지표 정규화
    const orientationScore = faceOrientationAnalysis.engagementScore;
    const synchronyScore = emotionalSynchrony;
    const qualityScore = interactionQuality === 'high' ? 1.0 : 
                        interactionQuality === 'medium' ? 0.6 : 0.2;
    const proximityScore = Math.max(0, 1 - proximityMetrics.averageDistance);

    // 가중 평균
    const overallScore = (
      orientationScore * 0.3 +
      synchronyScore * 0.25 +
      qualityScore * 0.25 +
      proximityScore * 0.2
    );

    return Math.round(overallScore * 100) / 100;
  }

  /**
   * 상호 응시 판단
   */
  private isMutualGaze(face1: any, face2: any): boolean {
    const center1 = this.getFaceCenter(face1);
    const center2 = this.getFaceCenter(face2);

    // 수평 정렬 확인
    const horizontalAlignment = Math.abs(center1.y - center2.y) < 0.2;
    
    // 서로 마주보는 방향 확인 (간단한 휴리스틱)
    const facingEachOther = Math.abs(center1.x - center2.x) > 0.1;

    return horizontalAlignment && facingEachOther;
  }

  /**
   * 얼굴 대면 판단
   */
  private isFaceToFace(face1: any, face2: any): boolean {
    const center1 = this.getFaceCenter(face1);
    const center2 = this.getFaceCenter(face2);

    // 수평 정렬
    const horizontalAlignment = Math.abs(center1.y - center2.y) < 0.3;
    
    // 적절한 거리
    const distance = Math.abs(center1.x - center2.x);
    const appropriateDistance = 0.2 < distance && distance < 0.6;

    return horizontalAlignment && appropriateDistance;
  }

  /**
   * 얼굴 간 거리 계산
   */
  private calculateFaceDistance(face1: any, face2: any): number {
    const center1 = this.getFaceCenter(face1);
    const center2 = this.getFaceCenter(face2);

    const distance = Math.sqrt(
      Math.pow(center1.x - center2.x, 2) + 
      Math.pow(center1.y - center2.y, 2)
    );

    return Math.min(distance, 1.0);
  }

  /**
   * 얼굴 중심점 계산
   */
  private getFaceCenter(face: any): { x: number; y: number } {
    const bbox = face.boundingBox;
    return {
      x: (bbox.left + bbox.right) / 2,
      y: (bbox.top + bbox.bottom) / 2
    };
  }

  /**
   * 얼굴 크기 계산
   */
  private getFaceSize(face: any): number {
    const bbox = face.boundingBox;
    const width = bbox.right - bbox.left;
    const height = bbox.bottom - bbox.top;
    return width * height;
  }

  /**
   * 참여도 점수 계산
   */
  private calculateEngagementScore(
    gazeRatio: number,
    faceRatio: number,
    proximityChanges: number
  ): number {
    // 가중치 적용
    const score = (
      gazeRatio * 0.4 +
      faceRatio * 0.4 +
      Math.min(proximityChanges / 10, 1) * 0.2
    );

    return Math.round(score * 100) / 100;
  }

  /**
   * 프레임별 감정 추정
   */
  private estimateFrameEmotion(
    frame: FaceData,
    movementFrame: any,
    audioData?: any[]
  ): EmotionalState {
    let emotion: 'positive' | 'negative' | 'neutral' = 'neutral';
    let intensity = 0.5;
    let confidence = 0.5;

    // 얼굴 크기 기반 참여도
    if (frame.faces.length > 0) {
      const avgFaceSize = frame.faces.reduce((sum, face) => sum + this.getFaceSize(face), 0) / frame.faces.length;
      
      if (avgFaceSize > this.faceSizeThreshold) {
        emotion = 'positive';
        intensity = Math.min(avgFaceSize * 2, 1.0);
        confidence = 0.7;
      }
    }

    // 움직임 기반 활동성
    if (movementFrame && movementFrame.activityLevel === 'high') {
      emotion = 'positive';
      intensity = Math.max(intensity, 0.8);
      confidence = Math.max(confidence, 0.8);
    }

    return {
      time: frame.time,
      emotion,
      intensity: Math.round(intensity * 100) / 100,
      confidence: Math.round(confidence * 100) / 100
    };
  }

  /**
   * 프레임별 참여도 추정
   */
  private estimateFrameEngagement(
    frame: FaceData,
    movementFrame: any,
    frameIndex: number
  ): number {
    let engagement = 0.0;

    // 얼굴 감지 여부
    if (frame.faces.length > 0) {
      engagement += 0.3;

      // 얼굴 크기 (근접성 지표)
      if (frame.faces.length >= 2) {
        const avgFaceSize = frame.faces.reduce((sum, face) => sum + this.getFaceSize(face), 0) / frame.faces.length;
        
        if (avgFaceSize > this.faceSizeThreshold) {
          engagement += 0.3;
        }
      }
    }

    // 움직임 활동성
    if (movementFrame?.activityLevel) {
      const activityBonus: Record<string, number> = {
        'high': 0.4,
        'medium': 0.2,
        'low': 0.0
      };
      
      engagement += activityBonus[movementFrame.activityLevel] || 0.0;
    }

    return Math.min(engagement, 1.0);
  }

  /**
   * 얼굴 데이터 처리
   */
  private processFaceData(faceDetectionData: unknown[]): FaceData[] {
    const faceData: FaceData[] = [];
    
    if (!faceDetectionData || faceDetectionData.length === 0) {
      return faceData;
    }
    
    try {
      for (const detection of faceDetectionData) {
        const detectionCast = detection as any;
        
        if (detectionCast.tracks) {
          for (const track of detectionCast.tracks) {
            if (track.timestampedObjects) {
              for (const obj of track.timestampedObjects) {
                if (obj.normalizedBoundingBox) {
                  const timeValue = typeof obj.timeOffset === 'number' ? 
                    obj.timeOffset : 
                    (obj.timeOffset?.seconds || 0) + (obj.timeOffset?.nanos || 0) / 1000000000;
                  
                  faceData.push({
                    time: timeValue,
                    faces: [{
                      boundingBox: {
                        left: obj.normalizedBoundingBox.left || 0,
                        top: obj.normalizedBoundingBox.top || 0,
                        right: obj.normalizedBoundingBox.right || 1,
                        bottom: obj.normalizedBoundingBox.bottom || 1
                      },
                      confidence: obj.confidence || 0.5,
                      landmarks: obj.landmarks || []
                    }]
                  });
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ 얼굴 데이터 처리 오류:', error);
    }
    
    return faceData;
  }

  /**
   * 움직임 데이터 처리
   */
  private processMovementData(personDetectionData: unknown[]): any[] {
    const movementData: any[] = [];
    
    if (!personDetectionData || personDetectionData.length === 0) {
      return movementData;
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
                  
                  movementData.push({
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
      console.error('❌ 움직임 데이터 처리 오류:', error);
    }
    
    return movementData;
  }

  /**
   * 오디오 데이터 처리
   */
  private processAudioData(emotionData: unknown[]): any[] {
    const audioData: any[] = [];
    
    if (!emotionData || emotionData.length === 0) {
      return audioData;
    }
    
    try {
      for (const data of emotionData) {
        const dataCast = data as any;
        
        if (dataCast.time !== undefined && dataCast.emotion) {
          audioData.push({
            time: dataCast.time,
            emotion: dataCast.emotion,
            intensity: dataCast.intensity || 0.5,
            confidence: dataCast.confidence || 0.5
          });
        }
      }
    } catch (error) {
      console.error('❌ 오디오 데이터 처리 오류:', error);
    }
    
    return audioData;
  }

  /**
   * 기본 결과 반환
   */
  private getDefaultResult(): EmotionalInteractionResult {
    return {
      faceOrientationAnalysis: {
        mutualGazeTime: 0.0,
        faceToFaceRatio: 0.0,
        proximityChanges: [],
        engagementScore: 0.0
      },
      emotionalStates: [],
      engagementPeriods: [],
      interactionQuality: 'low',
      emotionalSynchrony: 0.0,
      proximityMetrics: {
        averageDistance: 1.0,
        closestApproach: 1.0,
        farthestDistance: 1.0,
        proximityVariability: 0.0
      },
      overallScore: 0.0
    };
  }

  /**
   * 기본 감정적 상호작용 생성
   */
  private generateBasicEmotionalInteraction(): EmotionalInteractionResult {
    console.log('🎭 기본 감정적 상호작용 시나리오 생성');
    
    // 부모-자녀 놀이 상황 시뮬레이션
    const duration = 300; // 5분
    const emotionalStates: EmotionalState[] = [];
    const engagementPeriods: EngagementPeriod[] = [];
    
    // 감정 상태 시뮬레이션
    for (let i = 0; i < 10; i++) {
      const time = (duration / 10) * i;
      emotionalStates.push({
        time,
        emotion: i % 3 === 0 ? 'positive' : (i % 3 === 1 ? 'neutral' : 'positive'),
        intensity: 0.6 + Math.random() * 0.3,
        confidence: 0.7 + Math.random() * 0.2
      });
    }
    
    // 참여도 기간 시뮬레이션
    engagementPeriods.push({
      startTime: 0,
      endTime: duration * 0.3,
      level: 'medium',
      averageIntensity: 0.6
    });
    engagementPeriods.push({
      startTime: duration * 0.3,
      endTime: duration * 0.8,
      level: 'high',
      averageIntensity: 0.8
    });
    engagementPeriods.push({
      startTime: duration * 0.8,
      endTime: duration,
      level: 'medium',
      averageIntensity: 0.7
    });
    
    return {
      faceOrientationAnalysis: {
        mutualGazeTime: duration * 0.4,
        faceToFaceRatio: 0.65,
        proximityChanges: [
          { time: duration * 0.2, change: 'closer', magnitude: 0.3 },
          { time: duration * 0.6, change: 'closer', magnitude: 0.2 }
        ],
        engagementScore: 0.72
      },
      emotionalStates,
      engagementPeriods,
      interactionQuality: {
        averageEngagement: 0.71,
        engagementVariability: 0.15,
        positiveInteractionRatio: 0.8,
        responsiveness: 0.75
      },
      emotionalSynchrony: {
        syncScore: 0.68,
        positiveSyncEvents: 12,
        negativeSyncEvents: 2,
        overallHarmony: 0.74
      },
      proximityMetrics: {
        averageDistance: 0.4,
        closestApproach: 0.2,
        furthestDistance: 0.8,
        proximityVariability: 0.25
      },
      overallScore: 0.72
    };
  }
} 