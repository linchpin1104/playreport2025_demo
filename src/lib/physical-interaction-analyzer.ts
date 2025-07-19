/**
 * 물리적 상호작용 분석 모듈
 * 근접성, 움직임 동기화, 활동성 수준 측정
 */

export interface BoundingBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface MovementEvent {
  time: number;
  type: 'move' | 'gesture' | 'static';
  direction?: 'up' | 'down' | 'left' | 'right';
  intensity: number;
  bbox: BoundingBox;
}

export interface ActivityMetrics {
  activityLevel: 'low' | 'medium' | 'high';
  movementSpeed: number;
  activityArea: number;
  staticRatio: number;
}

export interface SynchronyAnalysis {
  syncScore: number;
  synchronizedEvents: Array<{
    time: number;
    type: 'synchronized' | 'mirrored';
  }>;
  mirroringCount: number;
}

export interface PhysicalInteractionResult {
  proximityAnalysis: {
    averageDistance: number;
    closestApproach: number;
    proximityScore: number;
  };
  movementSynchrony: SynchronyAnalysis;
  activityMetrics: {
    person1: ActivityMetrics;
    person2: ActivityMetrics;
    overallSynchrony: number;
  };
  interactionEvents: Array<{
    time: number;
    type: 'approach' | 'retreat' | 'parallel_movement' | 'contact';
    duration: number;
    intensity: number;
  }>;
}

export class PhysicalInteractionAnalyzer {
  private readonly proximityThreshold = 0.3; // 근접 판단 기준
  private readonly syncWindow = 2.0; // 동기화 판단 시간 창(초)
  private readonly movementThreshold = 0.01; // 움직임 감지 임계값

  /**
   * 물리적 상호작용 분석 수행
   */
  async analyzePhysicalInteraction(
    personDetectionData: unknown[],
    sessionMetadata: Record<string, unknown>
  ): Promise<PhysicalInteractionResult> {
    try {
      console.log('🔍 물리적 상호작용 분석 시작');
      console.log('📊 입력 데이터:', {
        personDetectionDataLength: personDetectionData?.length || 0,
        firstItemSample: personDetectionData?.[0] || null
      });
      
      // 사람 데이터 분리
      const person1Data = this.extractPersonData(personDetectionData, 0);
      const person2Data = this.extractPersonData(personDetectionData, 1);

      console.log('📊 추출된 데이터 요약:', {
        person1Count: person1Data.length,
        person2Count: person2Data.length
      });

      if (person1Data.length === 0 && person2Data.length === 0) {
        console.log('⚠️ 사람 데이터가 없어 기본값 반환');
        return this.getDefaultResult();
      }

      // 근접성 분석
      const proximityAnalysis = this.analyzeProximity(person1Data, person2Data);

      // 움직임 추출
      const movements1 = this.extractMovements(person1Data);
      const movements2 = this.extractMovements(person2Data);

      // 움직임 동기화 분석
      const movementSynchrony = this.analyzeMovementSynchrony(movements1, movements2);

      // 활동성 수준 분석
      const activityMetrics = {
        person1: this.calculateActivityMetrics(person1Data),
        person2: this.calculateActivityMetrics(person2Data),
        overallSynchrony: this.calculateOverallSynchrony(movements1, movements2)
      };

      // 상호작용 이벤트 감지
      const interactionEvents = this.detectInteractionEvents(person1Data, person2Data);

      const result = {
        proximityAnalysis,
        movementSynchrony,
        activityMetrics,
        interactionEvents
      };

      console.log('✅ 물리적 상호작용 분석 완료:', {
        proximityScore: proximityAnalysis.proximityScore,
        syncScore: movementSynchrony.syncScore,
        interactionEventCount: interactionEvents.length
      });

      return result;

    } catch (error) {
      console.error('❌ 물리적 상호작용 분석 오류:', error);
      return this.getDefaultResult();
    }
  }

  /**
   * 사람 데이터 추출 (개선된 버전)
   */
  private extractPersonData(detectionData: unknown[], personIndex: number): Array<{
    time: number;
    bbox: BoundingBox;
    confidence: number;
  }> {
    const personData: Array<{
      time: number;
      bbox: BoundingBox;
      confidence: number;
    }> = [];
    
    console.log(`🔍 사람 데이터 추출 시작 (personIndex: ${personIndex})`);
    console.log(`📊 전체 detectionData 길이: ${detectionData?.length || 0}`);
    
    if (!detectionData || detectionData.length === 0) {
      console.log('⚠️ detectionData가 비어있음');
      return personData;
    }
    
    // Google Cloud Video Intelligence API의 personDetection 구조에 맞게 수정
    let personCount = 0;
    
    for (const detection of detectionData) {
      const detectionData_cast = detection as any;
      
      if (detectionData_cast.tracks) {
        for (const track of detectionData_cast.tracks) {
          // 각 트랙은 하나의 사람을 나타냄
          if (personCount === personIndex) {
            console.log(`✅ 사람 ${personIndex} 트랙 발견`);
            console.log(`📊 트랙 정보:`, {
              hasTimestampedObjects: !!track.timestampedObjects,
              timestampedObjectsLength: track.timestampedObjects?.length || 0,
              hasSegment: !!track.segment,
              segment: track.segment || null
            });
            
            // 방법 1: timestampedObjects 사용 (기본)
            if (track.timestampedObjects && track.timestampedObjects.length > 0) {
              for (const timestampedObject of track.timestampedObjects) {
                const bbox = timestampedObject.normalizedBoundingBox;
                console.log(`🔍 TimestampedObject 처리:`, {
                  hasTimeOffset: !!timestampedObject.timeOffset,
                  timeOffset: timestampedObject.timeOffset,
                  hasBbox: !!bbox,
                  bbox,
                  confidence: timestampedObject.confidence
                });
                
                if (bbox) {
                  let timeValue = 0;
                  if (timestampedObject.timeOffset) {
                    if (typeof timestampedObject.timeOffset === 'number') {
                      timeValue = timestampedObject.timeOffset;
                    } else if (typeof timestampedObject.timeOffset === 'object') {
                      const seconds = parseInt(timestampedObject.timeOffset.seconds || '0');
                      const nanos = parseInt(timestampedObject.timeOffset.nanos || '0');
                      timeValue = seconds + nanos / 1000000000;
                    }
                  }
                  
                  personData.push({
                    time: timeValue,
                    bbox: {
                      left: bbox.left || 0,
                      top: bbox.top || 0,
                      right: bbox.right || 1,
                      bottom: bbox.bottom || 1
                    },
                    confidence: timestampedObject.confidence || 0.5
                  });
                }
              }
            }
            // 방법 2: segment 정보 사용 (fallback)
            else if (track.segment) {
              console.log(`🔄 timestampedObjects가 비어있음 - segment 정보 사용`);
              const startTime = track.segment.startTimeOffset || 0;
              const endTime = track.segment.endTimeOffset || 0;
              
              // 세그먼트 시간 동안 가상의 데이터 포인트 생성
              const duration = endTime - startTime;
              const intervals = Math.max(1, Math.min(10, Math.floor(duration))); // 1-10개 간격
              
              for (let i = 0; i <= intervals; i++) {
                const time = startTime + (duration * i / intervals);
                personData.push({
                  time,
                  bbox: {
                    left: 0.2 + (personIndex * 0.3), // 사람별로 다른 위치
                    top: 0.2,
                    right: 0.5 + (personIndex * 0.3),
                    bottom: 0.8
                  },
                  confidence: 0.7 // 기본 신뢰도
                });
              }
              
              console.log(`📊 세그먼트 기반 데이터 생성: ${personData.length}개`);
            }
          }
          personCount++;
        }
      }
    }
    
    console.log(`📊 추출된 사람 ${personIndex} 데이터: ${personData.length}개`);
    if (personData.length > 0) {
      console.log(`🎯 첫 번째 데이터 샘플:`, personData[0]);
      console.log(`🎯 마지막 데이터 샘플:`, personData[personData.length - 1]);
    } else {
      console.log('⚠️ 추출된 데이터가 없습니다. 데이터 구조 확인 필요:');
      console.log('🔍 첫 번째 detection 샘플:', JSON.stringify(detectionData[0], null, 2));
    }

    return personData.sort((a, b) => a.time - b.time);
  }

  /**
   * 근접성 분석
   */
  private analyzeProximity(person1Data: Array<{
    time: number;
    bbox: BoundingBox;
    confidence: number;
  }>, person2Data: Array<{
    time: number;
    bbox: BoundingBox;
    confidence: number;
  }>): {
    averageDistance: number;
    closestApproach: number;
    proximityScore: number;
  } {
    const distances = [];
    let closestDistance = Infinity;

    // 시간 순으로 정렬하여 매칭
    const minLength = Math.min(person1Data.length, person2Data.length);
    
    for (let i = 0; i < minLength; i++) {
      const distance = this.calculateDistance(person1Data[i].bbox, person2Data[i].bbox);
      distances.push(distance);
      
      if (distance < closestDistance) {
        closestDistance = distance;
      }
    }

    const averageDistance = distances.length > 0 ? 
      distances.reduce((sum, d) => sum + d, 0) / distances.length : 1.0;

    // 근접성 점수 계산 (0-1, 1이 가장 가까움)
    const proximityScore = Math.max(0, 1 - averageDistance);

    return {
      averageDistance,
      closestApproach: closestDistance === Infinity ? 1.0 : closestDistance,
      proximityScore
    };
  }

  /**
   * 두 바운딩 박스 간 거리 계산
   */
  private calculateDistance(bbox1: BoundingBox, bbox2: BoundingBox): number {
    const center1 = this.getCenter(bbox1);
    const center2 = this.getCenter(bbox2);
    
    const distance = Math.sqrt(
      Math.pow(center1.x - center2.x, 2) + 
      Math.pow(center1.y - center2.y, 2)
    );
    
    // 정규화 (대각선 길이 기준)
    return Math.min(distance / Math.sqrt(2), 1.0);
  }

  /**
   * 바운딩 박스 중심점 계산
   */
  private getCenter(bbox: BoundingBox): { x: number; y: number } {
    return {
      x: (bbox.left + bbox.right) / 2,
      y: (bbox.top + bbox.bottom) / 2
    };
  }

  /**
   * 움직임 추출
   */
  private extractMovements(personData: Array<{
    time: number;
    bbox: BoundingBox;
    confidence: number;
  }>): MovementEvent[] {
    const movements = [];
    
    for (let i = 1; i < personData.length; i++) {
      const prev = personData[i - 1];
      const curr = personData[i];
      
      const speed = this.calculateSpeed(prev.bbox, curr.bbox);
      const direction = this.calculateDirection(prev.bbox, curr.bbox);
      
      let type: 'move' | 'gesture' | 'static' = 'static';
      if (speed > this.movementThreshold) {
        type = speed > 0.05 ? 'move' : 'gesture';
      }
      
      movements.push({
        time: curr.time,
        type,
        direction,
        intensity: speed,
        bbox: curr.bbox
      });
    }
    
    return movements;
  }

  /**
   * 움직임 속도 계산
   */
  private calculateSpeed(bbox1: BoundingBox, bbox2: BoundingBox): number {
    const center1 = this.getCenter(bbox1);
    const center2 = this.getCenter(bbox2);
    
    return Math.sqrt(
      Math.pow(center1.x - center2.x, 2) + 
      Math.pow(center1.y - center2.y, 2)
    );
  }

  /**
   * 움직임 방향 계산
   */
  private calculateDirection(bbox1: BoundingBox, bbox2: BoundingBox): 'up' | 'down' | 'left' | 'right' {
    const center1 = this.getCenter(bbox1);
    const center2 = this.getCenter(bbox2);
    
    const dx = center2.x - center1.x;
    const dy = center2.y - center1.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    } else {
      return dy > 0 ? 'down' : 'up';
    }
  }

  /**
   * 움직임 동기화 분석
   */
  private analyzeMovementSynchrony(movements1: MovementEvent[], movements2: MovementEvent[]): SynchronyAnalysis {
    const syncEvents = [];
    let mirroringCount = 0;

    for (const m1 of movements1) {
      for (const m2 of movements2) {
        const timeDiff = Math.abs(m1.time - m2.time);
        
        if (timeDiff <= this.syncWindow) {
          if (this.isSimilarMovement(m1, m2)) {
            syncEvents.push({
              time: m1.time,
              type: 'synchronized' as const
            });
          } else if (this.isMirroredMovement(m1, m2)) {
            syncEvents.push({
              time: m1.time,
              type: 'mirrored' as const
            });
            mirroringCount++;
          }
        }
      }
    }

    const syncScore = syncEvents.length / Math.max(movements1.length, movements2.length, 1);

    return {
      syncScore: Math.min(syncScore, 1.0),
      synchronizedEvents: syncEvents,
      mirroringCount
    };
  }

  /**
   * 유사한 움직임 판단
   */
  private isSimilarMovement(m1: MovementEvent, m2: MovementEvent): boolean {
    return (
      m1.type === m2.type &&
      m1.direction === m2.direction &&
      Math.abs(m1.intensity - m2.intensity) < 0.02
    );
  }

  /**
   * 미러링 움직임 판단
   */
  private isMirroredMovement(m1: MovementEvent, m2: MovementEvent): boolean {
    const oppositeDirection: Record<string, string> = {
      'up': 'down',
      'down': 'up',
      'left': 'right',
      'right': 'left'
    };

    return (
      m1.type === m2.type &&
      m1.direction !== undefined &&
      m2.direction !== undefined &&
      m1.direction === oppositeDirection[m2.direction] &&
      Math.abs(m1.intensity - m2.intensity) < 0.02
    );
  }

  /**
   * 활동성 수준 계산
   */
  private calculateActivityMetrics(personData: Array<{
    time: number;
    bbox: BoundingBox;
    confidence: number;
  }>): ActivityMetrics {
    if (personData.length < 2) {
      return {
        activityLevel: 'low',
        movementSpeed: 0,
        activityArea: 0,
        staticRatio: 1.0
      };
    }

    // 움직임 속도 계산
    const speeds = [];
    for (let i = 1; i < personData.length; i++) {
      const speed = this.calculateSpeed(personData[i - 1].bbox, personData[i].bbox);
      speeds.push(speed);
    }

    const avgSpeed = speeds.length > 0 ? 
      speeds.reduce((sum, s) => sum + s, 0) / speeds.length : 0;

    // 활동 영역 계산
    const centers = personData.map(p => this.getCenter(p.bbox));
    const activityArea = this.calculateCoverageArea(centers);

    // 정적 시간 비율
    const staticFrames = speeds.filter(s => s < this.movementThreshold).length;
    const staticRatio = staticFrames / speeds.length;

    // 활동 수준 판정
    let activityLevel: 'low' | 'medium' | 'high' = 'low';
    if (avgSpeed < 0.02 && staticRatio > 0.7) {
      activityLevel = 'low';
    } else if (avgSpeed > 0.08 || staticRatio < 0.3) {
      activityLevel = 'high';
    } else {
      activityLevel = 'medium';
    }

    return {
      activityLevel,
      movementSpeed: avgSpeed,
      activityArea,
      staticRatio
    };
  }

  /**
   * 활동 영역 면적 계산
   */
  private calculateCoverageArea(centers: Array<{ x: number; y: number }>): number {
    if (centers.length < 3) {
      return 0.0;
    }

    const xs = centers.map(c => c.x);
    const ys = centers.map(c => c.y);

    const area = (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
    return Math.max(0, Math.min(area, 1.0));
  }

  /**
   * 전체 동기화 계산
   */
  private calculateOverallSynchrony(movements1: MovementEvent[], movements2: MovementEvent[]): number {
    if (movements1.length === 0 || movements2.length === 0) {
      return 0.0;
    }

    const syncAnalysis = this.analyzeMovementSynchrony(movements1, movements2);
    return syncAnalysis.syncScore;
  }

  /**
   * 상호작용 이벤트 감지
   */
  private detectInteractionEvents(person1Data: Array<{
    time: number;
    bbox: BoundingBox;
    confidence: number;
  }>, person2Data: Array<{
    time: number;
    bbox: BoundingBox;
    confidence: number;
  }>): Array<{
    time: number;
    type: 'approach' | 'retreat' | 'parallel_movement' | 'contact';
    duration: number;
    intensity: number;
  }> {
    const events = [];
    const minLength = Math.min(person1Data.length, person2Data.length);

    for (let i = 1; i < minLength; i++) {
      const prevDistance = this.calculateDistance(person1Data[i-1].bbox, person2Data[i-1].bbox);
      const currDistance = this.calculateDistance(person1Data[i].bbox, person2Data[i].bbox);
      const distanceChange = currDistance - prevDistance;

      let eventType: 'approach' | 'retreat' | 'parallel_movement' | 'contact' = 'parallel_movement';
      
      if (Math.abs(distanceChange) > 0.02) {
        if (distanceChange < 0) {
          eventType = 'approach';
        } else {
          eventType = 'retreat';
        }
      }

      if (currDistance < 0.1) {
        eventType = 'contact';
      }

      events.push({
        time: person1Data[i].time,
        type: eventType,
        duration: 1.0, // 프레임 단위
        intensity: Math.abs(distanceChange)
      });
    }

    return events;
  }

  /**
   * 시간 오프셋 파싱
   */
  private parseTimeOffset(timeOffset: string): number {
    if (!timeOffset) {return 0;}
    
    // "123.456s" 형태의 문자열을 숫자로 변환
    const match = timeOffset.match(/^(\d+(?:\.\d+)?)s?$/);
    return match ? parseFloat(match[1]) : 0;
  }

  /**
   * 기본 결과 반환
   */
  private getDefaultResult(): PhysicalInteractionResult {
    return {
      proximityAnalysis: {
        averageDistance: 1.0,
        closestApproach: 1.0,
        proximityScore: 0.0
      },
      movementSynchrony: {
        syncScore: 0.0,
        synchronizedEvents: [],
        mirroringCount: 0
      },
      activityMetrics: {
        person1: {
          activityLevel: 'low',
          movementSpeed: 0,
          activityArea: 0,
          staticRatio: 1.0
        },
        person2: {
          activityLevel: 'low',
          movementSpeed: 0,
          activityArea: 0,
          staticRatio: 1.0
        },
        overallSynchrony: 0.0
      },
      interactionEvents: []
    };
  }
} 