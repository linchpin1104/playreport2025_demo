import { VideoIntelligenceResults } from '@/types';

export interface PhysicalInteractionResult {
  proximityScore: number;
  activityLevel: 'low' | 'medium' | 'high';
  movementSpeed: number;
  activityArea: number;
  staticRatio: number;
  synchronizedEvents: Array<{time: number; type: 'synchronized' | 'mirrored'}>;
  proximityTimeline: Array<{time: number; distance: number}>;
}

export class PhysicalInteractionAnalyzer {
  private readonly proximityThreshold = 0.3;
  private readonly syncWindow = 2.0;

  async analyzePhysicalInteraction(
    personDetectionData: any[],
    sessionMetadata: any
  ): Promise<PhysicalInteractionResult> {
    console.log('🔍 Starting physical interaction analysis');
    console.log(`📊 Person detection data: ${personDetectionData?.length || 0} entries`);

    if (!personDetectionData || personDetectionData.length === 0) {
      console.warn('⚠️ No person detection data available');
      return this.createEmptyResult();
    }

    try {
      // 1. 실제 데이터에서 근접성 분석
      const proximityData = this.analyzeProximityFromRealData(personDetectionData);
      
      // 2. 실제 데이터에서 활동성 수준 분석
      const activityData = this.analyzeActivityFromRealData(personDetectionData);
      
      // 3. 실제 움직임 패턴에서 동기화 분석
      const synchronizationData = this.analyzeSynchronizationFromRealData(personDetectionData);

      console.log('✅ Physical interaction analysis completed', {
        proximityScore: proximityData.score,
        activityLevel: activityData.level,
        eventsFound: synchronizationData.events.length
      });

      return {
        proximityScore: proximityData.score,
        activityLevel: activityData.level,
        movementSpeed: activityData.speed,
        activityArea: activityData.area,
        staticRatio: activityData.staticRatio,
        synchronizedEvents: synchronizationData.events,
        proximityTimeline: proximityData.timeline
      };
    } catch (error) {
      console.error('❌ Error in physical interaction analysis:', error);
      return this.createEmptyResult();
    }
  }

  /**
   * 🔄 추출된 데이터로 물리적 상호작용 분석 (신규 메서드)
   */
  async analyzePhysicalInteractionFromExtractedData(
    personMovements: Array<{
      personId: number;
      movements: Array<{
        time: number;
        bbox: { left: number; top: number; right: number; bottom: number };
        center: [number, number];
        size: number;
      }>;
    }>,
    sessionMetadata: any
  ): Promise<PhysicalInteractionResult> {
    console.log('🔍 Starting physical interaction analysis with extracted data');
    console.log(`📊 Person movements: ${personMovements?.length || 0} persons`);

    if (!personMovements || personMovements.length === 0) {
      console.warn('⚠️ No person movement data available');
      return this.createEmptyResult();
    }

    try {
      // 1. 추출된 데이터에서 근접성 분석
      const proximityData = this.analyzeProximityFromExtractedData(personMovements);
      
      // 2. 추출된 데이터에서 활동성 수준 분석
      const activityData = this.analyzeActivityFromExtractedData(personMovements);
      
      // 3. 추출된 데이터에서 동기화 분석
      const synchronizationData = this.analyzeSynchronizationFromExtractedData(personMovements);

      console.log('✅ Physical interaction analysis completed with extracted data', {
        proximityScore: proximityData.score,
        activityLevel: activityData.level,
        eventsFound: synchronizationData.events.length
      });

      return {
        proximityScore: proximityData.score,
        activityLevel: activityData.level,
        movementSpeed: activityData.speed,
        activityArea: activityData.area,
        staticRatio: activityData.staticRatio,
        synchronizedEvents: synchronizationData.events,
        proximityTimeline: proximityData.timeline
      };
    } catch (error) {
      console.error('❌ Error in physical interaction analysis with extracted data:', error);
      return this.createEmptyResult();
    }
  }

  private analyzeProximityFromRealData(personData: any[]): {score: number; timeline: Array<{time: number; distance: number}>} {
    const timeline: Array<{time: number; distance: number}> = [];
    let totalProximity = 0;
    let validFrames = 0;
    
    // 사람 추적 데이터를 시간순으로 그룹화
    const frameGroups: Record<number, any[]> = {};
    
    personData.forEach(person => {
      person.tracks?.forEach((track: any) => {
        track.timestampedObjects?.forEach((obj: any) => {
          const timeSeconds = this.parseTimeOffset(obj.timeOffset);
          const timeKey = Math.floor(timeSeconds);
          
          if (!frameGroups[timeKey]) {
            frameGroups[timeKey] = [];
          }
          frameGroups[timeKey].push({
            time: timeSeconds,
            bbox: obj.normalizedBoundingBox
          });
        });
      });
    });

    // 각 시간대에서 두 사람 간 거리 계산
    Object.entries(frameGroups).forEach(([timeStr, objects]) => {
      const time = parseInt(timeStr);
      
      if (objects.length >= 2) {
        // 가장 큰 두 개의 바운딩 박스 선택 (가장 명확한 사람들)
        const sortedObjects = objects
          .filter(obj => obj.bbox)
          .sort((a, b) => this.getBboxSize(b.bbox) - this.getBboxSize(a.bbox))
          .slice(0, 2);

        if (sortedObjects.length === 2) {
          const distance = this.calculateDistance(sortedObjects[0].bbox, sortedObjects[1].bbox);
          timeline.push({ time, distance });
          totalProximity += (1 - distance); // 거리가 가까울수록 높은 점수
          validFrames++;
        }
      }
    });

    const score = validFrames > 0 
      ? Math.min((totalProximity / validFrames) * 100, 100)
      : 0;
    
    console.log(`📏 Proximity analysis: ${validFrames} valid frames, score: ${score.toFixed(1)}`);
    
    return { score: Math.round(score), timeline };
  }

  private analyzeProximityFromExtractedData(
    personMovements: Array<{ personId: number; movements: Array<{ time: number; center: [number, number]; size: number }> }>
  ): {score: number; timeline: Array<{time: number; distance: number}>} {
    const timeline: Array<{time: number; distance: number}> = [];
    let totalProximity = 0;
    let validFrames = 0;

    if (personMovements.length < 2) {
      console.warn('⚠️ Need at least 2 persons for proximity analysis');
      return { score: 0, timeline: [] };
    }

    const person1Movements = personMovements[0].movements;
    const person2Movements = personMovements[1].movements;

    // 시간 기준으로 매칭
    person1Movements.forEach(movement1 => {
      // 가장 가까운 시간의 person2 움직임 찾기
      const closestMovement2 = person2Movements.reduce((closest, movement2) => {
        const timeDiff1 = Math.abs(movement1.time - movement2.time);
        const timeDiff2 = Math.abs(movement1.time - closest.time);
        return timeDiff1 < timeDiff2 ? movement2 : closest;
      }, person2Movements[0]);

      if (Math.abs(movement1.time - closestMovement2.time) <= 2) { // 2초 이내
        const distance = Math.sqrt(
          Math.pow(movement1.center[0] - closestMovement2.center[0], 2) +
          Math.pow(movement1.center[1] - closestMovement2.center[1], 2)
        );

        timeline.push({ time: movement1.time, distance });
        totalProximity += (1 - Math.min(distance, 1)); // 거리가 가까울수록 높은 점수
        validFrames++;
      }
    });

    const score = validFrames > 0 
      ? Math.min((totalProximity / validFrames) * 100, 100)
      : 0;
    
    console.log(`📏 Proximity analysis with extracted data: ${validFrames} valid frames, score: ${score.toFixed(1)}`);
    
    return { score: Math.round(score), timeline };
  }

  private analyzeActivityFromRealData(personData: any[]): {
    level: 'low' | 'medium' | 'high';
    speed: number;
    area: number;
    staticRatio: number;
  } {
    const movements: Array<{time: number; center: [number, number]; size: number}> = [];
    
    // 사람별 움직임 추출
    personData.forEach(person => {
      person.tracks?.forEach((track: any) => {
        const trackMovements: Array<{time: number; center: [number, number]; size: number}> = [];
        
        track.timestampedObjects?.forEach((obj: any) => {
          if (obj.normalizedBoundingBox) {
            const time = this.parseTimeOffset(obj.timeOffset);
            const center = this.getBboxCenter(obj.normalizedBoundingBox);
            const size = this.getBboxSize(obj.normalizedBoundingBox);
            
            trackMovements.push({ time, center, size });
          }
        });
        
        // 시간순 정렬
        trackMovements.sort((a, b) => a.time - b.time);
        movements.push(...trackMovements);
      });
    });

    if (movements.length < 2) {
      return { level: 'low', speed: 0, area: 0, staticRatio: 1 };
    }

    // 움직임 속도 계산
    const speeds: number[] = [];
    for (let i = 1; i < movements.length; i++) {
      const timeDiff = movements[i].time - movements[i-1].time;
      if (timeDiff > 0) {
        const distance = Math.sqrt(
          Math.pow(movements[i].center[0] - movements[i-1].center[0], 2) +
          Math.pow(movements[i].center[1] - movements[i-1].center[1], 2)
        );
        speeds.push(distance / timeDiff);
      }
    }

    const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;

    // 활동 영역 계산
    const xCoords = movements.map(m => m.center[0]);
    const yCoords = movements.map(m => m.center[1]);
    const area = xCoords.length > 0 ? 
      (Math.max(...xCoords) - Math.min(...xCoords)) * (Math.max(...yCoords) - Math.min(...yCoords)) : 0;

    // 정적 비율 계산 (속도가 매우 낮은 구간)
    const staticThreshold = 0.01;
    const staticFrames = speeds.filter(s => s < staticThreshold).length;
    const staticRatio = speeds.length > 0 ? staticFrames / speeds.length : 1;

    // 활동 수준 결정
    let level: 'low' | 'medium' | 'high';
    if (avgSpeed < 0.02 && staticRatio > 0.7) {
      level = 'low';
    } else if (avgSpeed > 0.08 || staticRatio < 0.3) {
      level = 'high';
    } else {
      level = 'medium';
    }

    console.log(`🏃 Activity analysis: speed=${avgSpeed.toFixed(4)}, area=${area.toFixed(3)}, static=${(staticRatio * 100).toFixed(1)}%`);

    return {
      level,
      speed: Number(avgSpeed.toFixed(3)),
      area: Number(area.toFixed(3)),
      staticRatio: Number(staticRatio.toFixed(3))
    };
  }

  private analyzeActivityFromExtractedData(
    personMovements: Array<{ personId: number; movements: Array<{ time: number; center: [number, number]; size: number }> }>
  ): { level: 'low' | 'medium' | 'high'; speed: number; area: number; staticRatio: number } {
    
    const allMovements = personMovements.flatMap(person => person.movements);
    
    if (allMovements.length < 2) {
      return { level: 'low', speed: 0, area: 0, staticRatio: 1 };
    }

    // 시간순 정렬
    allMovements.sort((a, b) => a.time - b.time);

    // 움직임 속도 계산
    const speeds: number[] = [];
    for (let i = 1; i < allMovements.length; i++) {
      const timeDiff = allMovements[i].time - allMovements[i-1].time;
      if (timeDiff > 0) {
        const distance = Math.sqrt(
          Math.pow(allMovements[i].center[0] - allMovements[i-1].center[0], 2) +
          Math.pow(allMovements[i].center[1] - allMovements[i-1].center[1], 2)
        );
        speeds.push(distance / timeDiff);
      }
    }

    const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;

    // 활동 영역 계산
    const xCoords = allMovements.map(m => m.center[0]);
    const yCoords = allMovements.map(m => m.center[1]);
    const area = xCoords.length > 0 ? 
      (Math.max(...xCoords) - Math.min(...xCoords)) * (Math.max(...yCoords) - Math.min(...yCoords)) : 0;

    // 정적 비율 계산
    const staticThreshold = 0.01;
    const staticFrames = speeds.filter(s => s < staticThreshold).length;
    const staticRatio = speeds.length > 0 ? staticFrames / speeds.length : 1;

    // 활동 수준 결정
    let level: 'low' | 'medium' | 'high';
    if (avgSpeed < 0.02 && staticRatio > 0.7) {
      level = 'low';
    } else if (avgSpeed > 0.08 || staticRatio < 0.3) {
      level = 'high';
    } else {
      level = 'medium';
    }

    console.log(`🏃 Activity analysis with extracted data: speed=${avgSpeed.toFixed(4)}, area=${area.toFixed(3)}, static=${(staticRatio * 100).toFixed(1)}%`);

    return {
      level,
      speed: Number(avgSpeed.toFixed(3)),
      area: Number(area.toFixed(3)),
      staticRatio: Number(staticRatio.toFixed(3))
    };
  }

  private analyzeSynchronizationFromRealData(personData: any[]): {events: Array<{time: number; type: 'synchronized' | 'mirrored'}>} {
    const events: Array<{time: number; type: 'synchronized' | 'mirrored'}> = [];
    
    // 각 사람별 움직임 패턴 추출
    const personTracks: Array<Array<{time: number; center: [number, number]}>> = [];
    
    personData.forEach(person => {
      person.tracks?.forEach((track: any) => {
        const trackData: Array<{time: number; center: [number, number]}> = [];
        
        track.timestampedObjects?.forEach((obj: any) => {
          if (obj.normalizedBoundingBox) {
            const time = this.parseTimeOffset(obj.timeOffset);
            const center = this.getBboxCenter(obj.normalizedBoundingBox);
            trackData.push({ time, center });
          }
        });
        
        if (trackData.length > 0) {
          trackData.sort((a, b) => a.time - b.time);
          personTracks.push(trackData);
        }
      });
    });

    // 두 사람의 움직임 동기화 분석
    if (personTracks.length >= 2) {
      const track1 = personTracks[0];
      const track2 = personTracks[1];
      
      // 시간대별로 움직임 방향 비교
      for (let i = 1; i < Math.min(track1.length, track2.length); i++) {
        const t1Prev = track1[i-1];
        const t1Curr = track1[i];
        const t2Prev = track2[i-1];
        const t2Curr = track2[i];
        
        if (Math.abs(t1Curr.time - t2Curr.time) <= this.syncWindow) {
          // 움직임 벡터 계산
          const v1 = [t1Curr.center[0] - t1Prev.center[0], t1Curr.center[1] - t1Prev.center[1]];
          const v2 = [t2Curr.center[0] - t2Prev.center[0], t2Curr.center[1] - t2Prev.center[1]];
          
          // 벡터 크기 확인 (최소 움직임)
          const magnitude1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]);
          const magnitude2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1]);
          
          if (magnitude1 > 0.01 && magnitude2 > 0.01) {
            // 내적을 이용한 방향 유사성 계산
            const dotProduct = v1[0] * v2[0] + v1[1] * v2[1];
            const similarity = dotProduct / (magnitude1 * magnitude2);
            
            if (similarity > 0.7) {
              // 같은 방향 - 동기화
              events.push({ time: t1Curr.time, type: 'synchronized' });
            } else if (similarity < -0.7) {
              // 반대 방향 - 미러링
              events.push({ time: t1Curr.time, type: 'mirrored' });
            }
          }
        }
      }
    }

    console.log(`🔄 Synchronization analysis: ${events.length} events found`);
    
    return { events };
  }

  private analyzeSynchronizationFromExtractedData(
    personMovements: Array<{ personId: number; movements: Array<{ time: number; center: [number, number]; size: number }> }>
  ): {events: Array<{time: number; type: 'synchronized' | 'mirrored'}>} {
    const events: Array<{time: number; type: 'synchronized' | 'mirrored'}> = [];
    
    if (personMovements.length < 2) {
      return { events: [] };
    }

    const person1Movements = personMovements[0].movements.sort((a, b) => a.time - b.time);
    const person2Movements = personMovements[1].movements.sort((a, b) => a.time - b.time);
    
    // 두 사람의 움직임 동기화 분석
    for (let i = 1; i < Math.min(person1Movements.length, person2Movements.length); i++) {
      const p1Prev = person1Movements[i-1];
      const p1Curr = person1Movements[i];
      const p2Prev = person2Movements[i-1];
      const p2Curr = person2Movements[i];
      
      if (Math.abs(p1Curr.time - p2Curr.time) <= this.syncWindow) {
        // 움직임 벡터 계산
        const v1 = [p1Curr.center[0] - p1Prev.center[0], p1Curr.center[1] - p1Prev.center[1]];
        const v2 = [p2Curr.center[0] - p2Prev.center[0], p2Curr.center[1] - p2Prev.center[1]];
        
        // 벡터 크기 확인
        const magnitude1 = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]);
        const magnitude2 = Math.sqrt(v2[0] * v2[0] + v2[1] * v2[1]);
        
        if (magnitude1 > 0.01 && magnitude2 > 0.01) {
          // 내적을 이용한 방향 유사성
          const dotProduct = v1[0] * v2[0] + v1[1] * v2[1];
          const similarity = dotProduct / (magnitude1 * magnitude2);
          
          if (similarity > 0.7) {
            events.push({ time: p1Curr.time, type: 'synchronized' });
          } else if (similarity < -0.7) {
            events.push({ time: p1Curr.time, type: 'mirrored' });
          }
        }
      }
    }

    console.log(`🔄 Synchronization analysis with extracted data: ${events.length} events found`);
    
    return { events };
  }

  // 유틸리티 메서드들
  private parseTimeOffset(timeOffset: any): number {
    if (!timeOffset) return 0;
    
    if (typeof timeOffset === 'string') {
      return parseFloat(timeOffset);
    }
    
    if (timeOffset.seconds !== undefined) {
      const seconds = parseInt(timeOffset.seconds) || 0;
      const nanos = parseInt(timeOffset.nanos) || 0;
      return seconds + nanos / 1e9;
    }
    
    return 0;
  }

  private getBboxCenter(bbox: any): [number, number] {
    const x = (bbox.left + bbox.right) / 2;
    const y = (bbox.top + bbox.bottom) / 2;
    return [x, y];
  }

  private getBboxSize(bbox: any): number {
    const width = bbox.right - bbox.left;
    const height = bbox.bottom - bbox.top;
    return width * height;
  }

  private calculateDistance(bbox1: any, bbox2: any): number {
    const center1 = this.getBboxCenter(bbox1);
    const center2 = this.getBboxCenter(bbox2);
    
    return Math.sqrt(
      Math.pow(center1[0] - center2[0], 2) + 
      Math.pow(center1[1] - center2[1], 2)
    );
  }

  private createEmptyResult(): PhysicalInteractionResult {
    return {
      proximityScore: 0,
      activityLevel: 'low',
      movementSpeed: 0,
      activityArea: 0,
      staticRatio: 1,
      synchronizedEvents: [],
      proximityTimeline: []
    };
  }
} 