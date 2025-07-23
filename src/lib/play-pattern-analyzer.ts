export interface ObjectTrack {
  entity_id: string;
  category: string;
  time: number;
  confidence: number;
}

export interface PlayPatternResult {
  toysDetected: string[];
  usageDuration: Record<string, number>;
  sharingRatio: number;
  toyTransitions: Array<{from: string; to: string; time: number}>;
  activityTransitions: Array<{time: number; type: string; description: string}>;
  cooperativePatterns: Array<{time: number; duration: number; participants: string[]}>;
  creativityIndicators: {
    diversityScore: number;
    innovationEvents: number;
    explorationRatio: number;
  };
  overallScore: number;
}

export class PlayPatternAnalyzer {
  private readonly minActivityDuration = 10;
  private readonly transitionThreshold = 0.3;
  private readonly toyCategories = new Set(['toy', 'ball', 'doll', 'block', 'car', 'book', 'puzzle']);

  async analyzePlayPatterns(
    objectTrackingData: any[],
    personDetectionData: any[],
    sessionMetadata: any
  ): Promise<PlayPatternResult> {
    console.log('🧸 Starting play pattern analysis');
    console.log(`📊 Object tracking data: ${objectTrackingData?.length || 0} entries, Person data: ${personDetectionData?.length || 0} entries`);

    if (!objectTrackingData || objectTrackingData.length === 0) {
      console.warn('⚠️ No object tracking data available');
      return this.createEmptyResult();
    }

    try {
      // 1. 장난감 사용 패턴 분석
      const toyUsage = this.analyzeToyUsageFromRealData(objectTrackingData);
      
      // 2. 활동 전환 분석
      const activityTransitions = this.analyzeActivityTransitionsFromRealData(objectTrackingData, personDetectionData);
      
      // 3. 협력 놀이 패턴 감지
      const cooperativePatterns = this.detectCooperativePatternsFromRealData(objectTrackingData, personDetectionData);
      
      // 4. 창의성 지표 계산
      const creativityIndicators = this.calculateCreativityFromRealData(objectTrackingData);
      
      // 5. 전체 점수 계산
      const overallScore = this.calculateOverallScore(toyUsage, activityTransitions, cooperativePatterns, creativityIndicators);

      console.log('✅ Play pattern analysis completed', {
        toysDetected: toyUsage.toys.length,
        sharingRatio: `${(toyUsage.sharingRatio * 100).toFixed(1)}%`,
        transitions: activityTransitions.length,
        cooperativeEvents: cooperativePatterns.length,
        overallScore
      });

      return {
        toysDetected: toyUsage.toys,
        usageDuration: toyUsage.duration,
        sharingRatio: toyUsage.sharingRatio,
        toyTransitions: toyUsage.transitions,
        activityTransitions,
        cooperativePatterns,
        creativityIndicators,
        overallScore
      };
    } catch (error) {
      console.error('❌ Error in play pattern analysis:', error);
      return this.createEmptyResult();
    }
  }

  /**
   * 🔄 추출된 데이터로 놀이 패턴 분석 (신규 메서드)
   */
  async analyzePlayPatternsFromExtractedData(
    objectEvents: Array<{
      objectId: string;
      objectName: string;
      events: Array<{
        time: number;
        confidence: number;
        bbox: { left: number; top: number; right: number; bottom: number };
      }>;
    }>,
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
  ): Promise<PlayPatternResult> {
    console.log('🧸 Starting play pattern analysis with extracted data');
    console.log(`📊 Object events: ${objectEvents?.length || 0} objects, Person movements: ${personMovements?.length || 0} persons`);

    if (!objectEvents || objectEvents.length === 0) {
      console.warn('⚠️ No object events data available');
      return this.createEmptyResult();
    }

    try {
      // 1. 장난감 사용 패턴 분석 (추출된 데이터)
      const toyUsage = this.analyzeToyUsageFromExtractedData(objectEvents);
      
      // 2. 활동 전환 분석 (추출된 데이터)
      const activityTransitions = this.analyzeActivityTransitionsFromExtractedData(objectEvents, personMovements);
      
      // 3. 협력 놀이 패턴 감지 (추출된 데이터)
      const cooperativePatterns = this.detectCooperativePatternsFromExtractedData(objectEvents, personMovements);
      
      // 4. 창의성 지표 계산 (추출된 데이터)
      const creativityIndicators = this.calculateCreativityFromExtractedData(objectEvents);
      
      // 5. 전체 점수 계산
      const overallScore = this.calculateOverallScore(toyUsage, activityTransitions, cooperativePatterns, creativityIndicators);

      console.log('✅ Play pattern analysis completed with extracted data', {
        toysDetected: toyUsage.toys.length,
        sharingRatio: `${(toyUsage.sharingRatio * 100).toFixed(1)}%`,
        transitions: activityTransitions.length,
        cooperativeEvents: cooperativePatterns.length,
        overallScore
      });

      return {
        toysDetected: toyUsage.toys,
        usageDuration: toyUsage.duration,
        sharingRatio: toyUsage.sharingRatio,
        toyTransitions: toyUsage.transitions,
        activityTransitions,
        cooperativePatterns,
        creativityIndicators,
        overallScore
      };
    } catch (error) {
      console.error('❌ Error in play pattern analysis with extracted data:', error);
      return this.createEmptyResult();
    }
  }

  private analyzeToyUsageFromRealData(objectData: any[]) {
    const toys = new Set<string>();
    const toyDuration: Record<string, {start: number; end: number; frames: number; interactions: number}> = {};
    const transitions: Array<{from: string; to: string; time: number}> = [];

    // 객체 추적 데이터 처리
    const objectEvents: Array<{name: string; time: number; confidence: number}> = [];

    objectData.forEach(obj => {
      obj.tracks?.forEach((track: any) => {
        const entityName = obj.entity?.description?.toLowerCase() || 'unknown_object';
        
        track.timestampedObjects?.forEach((timestampedObj: any) => {
          const time = this.parseTimeOffset(timestampedObj.timeOffset);
          const confidence = timestampedObj.confidence || 0.5;
          
          // 장난감 관련 객체인지 확인
          const isToy = this.isToyRelated(entityName);
          if (isToy || confidence > 0.7) { // 높은 신뢰도의 객체는 포함
            toys.add(entityName);
            objectEvents.push({ name: entityName, time, confidence });
          }
        });
      });
    });

    // 시간순 정렬
    objectEvents.sort((a, b) => a.time - b.time);

    // 장난감별 사용 시간 및 상호작용 계산
    objectEvents.forEach((event, index) => {
      const toyName = event.name;
      
      if (!toyDuration[toyName]) {
        toyDuration[toyName] = { start: event.time, end: event.time, frames: 1, interactions: 0 };
      } else {
        toyDuration[toyName].end = event.time;
        toyDuration[toyName].frames++;
      }

      // 연속된 이벤트 간 전환 감지
      if (index > 0) {
        const prevEvent = objectEvents[index - 1];
        const timeDiff = event.time - prevEvent.time;
        
        if (prevEvent.name !== event.name && timeDiff < 30) { // 30초 이내 전환
          transitions.push({
            from: prevEvent.name,
            to: event.name,
            time: event.time
          });
        }
      }
    });

    // 사용 시간 계산
    const duration: Record<string, number> = {};
    Object.entries(toyDuration).forEach(([toy, data]) => {
      duration[toy] = Math.max(data.end - data.start, data.frames * 2); // 최소 지속 시간 보장
    });

    // 공유 비율 계산 (시간대별 중복 객체 감지 기반)
    const timeSlots: Record<number, Set<string>> = {};
    objectEvents.forEach(event => {
      const timeSlot = Math.floor(event.time / 5) * 5; // 5초 슬롯
      if (!timeSlots[timeSlot]) {
        timeSlots[timeSlot] = new Set();
      }
      timeSlots[timeSlot].add(event.name);
    });

    let sharedSlots = 0;
    const totalSlots = Object.keys(timeSlots).length;
    Object.values(timeSlots).forEach(objects => {
      if (objects.size > 1) { // 여러 객체가 동시에 감지된 경우
        sharedSlots++;
      }
    });

    const sharingRatio = totalSlots > 0 ? sharedSlots / totalSlots : 0;

    console.log(`🎲 Toy usage: ${toys.size} toys detected, ${transitions.length} transitions, ${(sharingRatio * 100).toFixed(1)}% sharing`);

    return {
      toys: Array.from(toys),
      duration,
      sharingRatio: Number(sharingRatio.toFixed(3)),
      transitions: transitions.slice(0, 10) // 최대 10개 전환만
    };
  }

  private analyzeToyUsageFromExtractedData(
    objectEvents: Array<{ objectId: string; objectName: string; events: Array<{ time: number; confidence: number }> }>
  ) {
    const toys = new Set<string>();
    const toyDuration: Record<string, {start: number; end: number; eventCount: number}> = {};
    const transitions: Array<{from: string; to: string; time: number}> = [];

    // 모든 이벤트를 시간순으로 정렬
    const allEvents: Array<{objectName: string; time: number; confidence: number}> = [];
    
    objectEvents.forEach(obj => {
      const objectName = obj.objectName.toLowerCase();
      
      // 장난감 관련 객체만 처리
      if (this.isToyRelated(objectName)) {
        toys.add(objectName);
        
        obj.events.forEach(event => {
          allEvents.push({
            objectName,
            time: event.time,
            confidence: event.confidence
          });
        });

        // 사용 시간 계산
        if (obj.events.length > 0) {
          const times = obj.events.map(e => e.time);
          toyDuration[objectName] = {
            start: Math.min(...times),
            end: Math.max(...times),
            eventCount: obj.events.length
          };
        }
      }
    });

    // 시간순 정렬 후 전환 분석
    allEvents.sort((a, b) => a.time - b.time);
    
    for (let i = 1; i < allEvents.length; i++) {
      const prevEvent = allEvents[i-1];
      const currEvent = allEvents[i];
      
      if (prevEvent.objectName !== currEvent.objectName && 
          currEvent.time - prevEvent.time < 30) { // 30초 이내 전환
        transitions.push({
          from: prevEvent.objectName,
          to: currEvent.objectName,
          time: currEvent.time
        });
      }
    }

    // 사용 시간 및 공유 비율 계산
    const duration: Record<string, number> = {};
    Object.entries(toyDuration).forEach(([toy, data]) => {
      duration[toy] = Math.max(data.end - data.start, data.eventCount * 2);
    });

    // 공유 비율 (동시간대 여러 객체 이벤트 기준)
    const timeSlots: Record<number, Set<string>> = {};
    allEvents.forEach(event => {
      const timeSlot = Math.floor(event.time / 5) * 5; // 5초 슬롯
      if (!timeSlots[timeSlot]) {
        timeSlots[timeSlot] = new Set();
      }
      timeSlots[timeSlot].add(event.objectName);
    });

    let sharedSlots = 0;
    const totalSlots = Object.keys(timeSlots).length;
    Object.values(timeSlots).forEach(objects => {
      if (objects.size > 1) {
        sharedSlots++;
      }
    });

    const sharingRatio = totalSlots > 0 ? sharedSlots / totalSlots : 0;

    console.log(`🎲 Toy usage with extracted data: ${toys.size} toys detected, ${transitions.length} transitions, ${(sharingRatio * 100).toFixed(1)}% sharing`);

    return {
      toys: Array.from(toys),
      duration,
      sharingRatio: Number(sharingRatio.toFixed(3)),
      transitions: transitions.slice(0, 10) // 최대 10개 전환만
    };
  }

  private analyzeActivityTransitionsFromRealData(objectData: any[], personData: any[]) {
    const transitions: Array<{time: number; type: string; description: string}> = [];

    // 객체 감지 이벤트 추출
    const objectEvents: Array<{time: number; object: string; confidence: number}> = [];
    
    objectData.forEach(obj => {
      obj.tracks?.forEach((track: any) => {
        const entityName = obj.entity?.description || 'object';
        
        track.timestampedObjects?.forEach((timestampedObj: any) => {
          const time = this.parseTimeOffset(timestampedObj.timeOffset);
          const confidence = timestampedObj.confidence || 0.5;
          
          objectEvents.push({ time, object: entityName, confidence });
        });
      });
    });

    // 시간순 정렬
    objectEvents.sort((a, b) => a.time - b.time);

    // 활동 전환점 감지
    let currentPhase = '';
    let phaseStartTime = 0;
    const phaseMinDuration = 15; // 최소 15초

    objectEvents.forEach((event, index) => {
      const timeFromStart = event.time;
      
      // 새로운 객체 도입 감지
      if (index === 0 || 
          (index > 0 && event.object !== objectEvents[index - 1].object && 
           event.time - objectEvents[index - 1].time > 10)) {
        
        // 이전 페이즈가 충분히 길었다면 종료
        if (currentPhase && timeFromStart - phaseStartTime > phaseMinDuration) {
          transitions.push({
            time: Math.round(timeFromStart),
            type: 'object_transition',
            description: `새로운 객체 도입: ${event.object}`
          });
        }
        
        currentPhase = event.object;
        phaseStartTime = timeFromStart;
      }
    });

    // 활동 강도 변화 감지 (객체 감지 빈도 기반)
    const timeWindows = Math.ceil((objectEvents[objectEvents.length - 1]?.time || 60) / 30); // 30초 윈도우
    
    for (let i = 0; i < timeWindows - 1; i++) {
      const windowStart = i * 30;
      const windowEnd = (i + 1) * 30;
      const nextWindowEnd = (i + 2) * 30;
      
      const currentWindow = objectEvents.filter(e => e.time >= windowStart && e.time < windowEnd);
      const nextWindow = objectEvents.filter(e => e.time >= windowEnd && e.time < nextWindowEnd);
      
      if (currentWindow.length > 0 && nextWindow.length > 0) {
        const currentIntensity = currentWindow.length;
        const nextIntensity = nextWindow.length;
        
        const intensityChange = (nextIntensity - currentIntensity) / currentIntensity;
        
        if (intensityChange > 0.5) { // 50% 이상 증가
          transitions.push({
            time: windowEnd,
            type: 'intensity_increase',
            description: '활동 강도 증가'
          });
        } else if (intensityChange < -0.5) { // 50% 이상 감소
          transitions.push({
            time: windowEnd,
            type: 'intensity_decrease', 
            description: '활동 강도 감소'
          });
        }
      }
    }

    console.log(`🔄 Activity transitions: ${transitions.length} significant changes detected`);
    
    return transitions.sort((a, b) => a.time - b.time);
  }

  private analyzeActivityTransitionsFromExtractedData(
    objectEvents: Array<{ objectName: string; events: Array<{ time: number; confidence: number }> }>,
    personMovements: Array<{ personId: number; movements: Array<{ time: number; center: [number, number] }> }>
  ) {
    const transitions: Array<{time: number; type: string; description: string}> = [];

    // 객체 이벤트들을 시간순으로 정렬
    const allObjectEvents: Array<{time: number; object: string}> = [];
    
    objectEvents.forEach(obj => {
      obj.events.forEach(event => {
        allObjectEvents.push({
          time: event.time,
          object: obj.objectName
        });
      });
    });

    allObjectEvents.sort((a, b) => a.time - b.time);

    // 새로운 객체 도입 감지
    let currentObject = '';
    let objectStartTime = 0;
    const minDuration = 15; // 최소 15초

    allObjectEvents.forEach(event => {
      if (currentObject !== event.object) {
        if (currentObject && event.time - objectStartTime > minDuration) {
          transitions.push({
            time: Math.round(event.time),
            type: 'object_transition',
            description: `새로운 객체 도입: ${event.object}`
          });
        }
        currentObject = event.object;
        objectStartTime = event.time;
      }
    });

    // 활동 강도 변화 감지 (30초 윈도우)
    const totalDuration = allObjectEvents.length > 0 ? 
      allObjectEvents[allObjectEvents.length - 1].time - allObjectEvents[0].time : 60;
    const timeWindows = Math.ceil(totalDuration / 30);
    
    for (let i = 0; i < timeWindows - 1; i++) {
      const windowStart = i * 30;
      const windowEnd = (i + 1) * 30;
      const nextWindowEnd = (i + 2) * 30;
      
      const currentWindow = allObjectEvents.filter(e => e.time >= windowStart && e.time < windowEnd);
      const nextWindow = allObjectEvents.filter(e => e.time >= windowEnd && e.time < nextWindowEnd);
      
      if (currentWindow.length > 0 && nextWindow.length > 0) {
        const intensityChange = (nextWindow.length - currentWindow.length) / currentWindow.length;
        
        if (intensityChange > 0.5) {
          transitions.push({
            time: windowEnd,
            type: 'intensity_increase',
            description: '활동 강도 증가'
          });
        } else if (intensityChange < -0.5) {
          transitions.push({
            time: windowEnd,
            type: 'intensity_decrease', 
            description: '활동 강도 감소'
          });
        }
      }
    }

    console.log(`🔄 Activity transitions with extracted data: ${transitions.length} significant changes detected`);
    
    return transitions.sort((a, b) => a.time - b.time);
  }

  private detectCooperativePatternsFromRealData(objectData: any[], personData: any[]) {
    const patterns: Array<{time: number; duration: number; participants: string[]}> = [];

    // 시간대별 객체와 사람 동시 감지 분석
    const timeSlots: Record<number, {objects: number; persons: number}> = {};
    
    // 객체 이벤트 집계
    objectData.forEach(obj => {
      obj.tracks?.forEach((track: any) => {
        track.timestampedObjects?.forEach((timestampedObj: any) => {
          const time = this.parseTimeOffset(timestampedObj.timeOffset);
          const timeSlot = Math.floor(time / 10) * 10; // 10초 슬롯
          
          if (!timeSlots[timeSlot]) {
            timeSlots[timeSlot] = { objects: 0, persons: 0 };
          }
          timeSlots[timeSlot].objects++;
        });
      });
    });

    // 사람 이벤트 집계
    personData.forEach(person => {
      person.tracks?.forEach((track: any) => {
        track.timestampedObjects?.forEach((timestampedObj: any) => {
          const time = this.parseTimeOffset(timestampedObj.timeOffset);
          const timeSlot = Math.floor(time / 10) * 10;
          
          if (!timeSlots[timeSlot]) {
            timeSlots[timeSlot] = { objects: 0, persons: 0 };
          }
          timeSlots[timeSlot].persons++;
        });
      });
    });

    // 협력 놀이 패턴 감지 (객체와 사람이 동시에 많이 감지되는 구간)
    const sortedSlots = Object.entries(timeSlots)
      .map(([timeStr, data]) => ({ time: parseInt(timeStr), ...data }))
      .sort((a, b) => a.time - b.time);

    let cooperativeStart: number | null = null;
    
    sortedSlots.forEach((slot, index) => {
      const isCooperative = slot.objects >= 2 && slot.persons >= 2; // 최소 조건
      
      if (isCooperative && cooperativeStart === null) {
        cooperativeStart = slot.time;
      } else if (!isCooperative && cooperativeStart !== null) {
        const duration = slot.time - cooperativeStart;
        if (duration >= 20) { // 최소 20초 이상
          patterns.push({
            time: cooperativeStart,
            duration,
            participants: ['parent', 'child'] // 기본 참여자
          });
        }
        cooperativeStart = null;
      }
    });

    // 마지막 협력 구간 처리
    if (cooperativeStart !== null && sortedSlots.length > 0) {
      const lastSlot = sortedSlots[sortedSlots.length - 1];
      const duration = lastSlot.time - cooperativeStart + 10;
      if (duration >= 20) {
        patterns.push({
          time: cooperativeStart,
          duration,
          participants: ['parent', 'child']
        });
      }
    }

    console.log(`🤝 Cooperative patterns: ${patterns.length} collaborative periods detected`);
    
    return patterns;
  }

  private detectCooperativePatternsFromExtractedData(
    objectEvents: Array<{ events: Array<{ time: number }> }>,
    personMovements: Array<{ movements: Array<{ time: number }> }>
  ) {
    const patterns: Array<{time: number; duration: number; participants: string[]}> = [];

    // 시간대별 활동 집계
    const timeSlots: Record<number, {objects: number; persons: number}> = {};
    
    // 객체 이벤트 집계
    objectEvents.forEach(obj => {
      obj.events.forEach(event => {
        const timeSlot = Math.floor(event.time / 10) * 10; // 10초 슬롯
        if (!timeSlots[timeSlot]) {
          timeSlots[timeSlot] = { objects: 0, persons: 0 };
        }
        timeSlots[timeSlot].objects++;
      });
    });

    // 사람 움직임 집계
    personMovements.forEach(person => {
      person.movements.forEach(movement => {
        const timeSlot = Math.floor(movement.time / 10) * 10;
        if (!timeSlots[timeSlot]) {
          timeSlots[timeSlot] = { objects: 0, persons: 0 };
        }
        timeSlots[timeSlot].persons++;
      });
    });

    // 협력 놀이 패턴 감지
    const sortedSlots = Object.entries(timeSlots)
      .map(([timeStr, data]) => ({ time: parseInt(timeStr), ...data }))
      .sort((a, b) => a.time - b.time);

    let cooperativeStart: number | null = null;
    
    sortedSlots.forEach(slot => {
      const isCooperative = slot.objects >= 2 && slot.persons >= 1; // 조건 완화
      
      if (isCooperative && cooperativeStart === null) {
        cooperativeStart = slot.time;
      } else if (!isCooperative && cooperativeStart !== null) {
        const duration = slot.time - cooperativeStart;
        if (duration >= 20) {
          patterns.push({
            time: cooperativeStart,
            duration,
            participants: ['parent', 'child']
          });
        }
        cooperativeStart = null;
      }
    });

    // 마지막 협력 구간 처리
    if (cooperativeStart !== null && sortedSlots.length > 0) {
      const lastSlot = sortedSlots[sortedSlots.length - 1];
      const duration = lastSlot.time - cooperativeStart + 10;
      if (duration >= 20) {
        patterns.push({
          time: cooperativeStart,
          duration,
          participants: ['parent', 'child']
        });
      }
    }

    console.log(`🤝 Cooperative patterns with extracted data: ${patterns.length} collaborative periods detected`);
    
    return patterns;
  }

  private calculateCreativityFromRealData(objectData: any[]) {
    const uniqueObjects = new Set<string>();
    let totalConfidence = 0;
    let objectCount = 0;

    // 객체 다양성 및 신뢰도 분석
    objectData.forEach(obj => {
      const entityName = obj.entity?.description?.toLowerCase() || 'unknown';
      uniqueObjects.add(entityName);
      
      obj.tracks?.forEach((track: any) => {
        track.timestampedObjects?.forEach((timestampedObj: any) => {
          const confidence = timestampedObj.confidence || 0.5;
          totalConfidence += confidence;
          objectCount++;
        });
      });
    });

    const avgConfidence = objectCount > 0 ? totalConfidence / objectCount : 0;
    const diversityScore = Math.min((uniqueObjects.size / Math.max(objectCount / 10, 1)) * 100, 100);
    
    // 혁신 이벤트: 새로운 객체 도입이나 높은 신뢰도 이벤트
    const innovationEvents = Math.max(0, uniqueObjects.size - 2); // 기본 2개 이상부터 혁신으로 간주
    
    // 탐색 비율: 평균 신뢰도 기반
    const explorationRatio = Math.min(avgConfidence + 0.3, 1.0); // 신뢰도가 높을수록 체계적 탐색

    console.log(`🎨 Creativity analysis: ${uniqueObjects.size} unique objects, diversity: ${diversityScore.toFixed(1)}, exploration: ${(explorationRatio * 100).toFixed(1)}%`);

    return {
      diversityScore: Math.round(diversityScore),
      innovationEvents,
      explorationRatio: Number(explorationRatio.toFixed(3))
    };
  }

  private calculateCreativityFromExtractedData(
    objectEvents: Array<{ objectId: string; objectName: string; events: Array<{ confidence: number }> }>
  ) {
    const uniqueObjects = new Set(objectEvents.map(obj => obj.objectName));
    let totalConfidence = 0;
    let eventCount = 0;

    objectEvents.forEach(obj => {
      obj.events.forEach(event => {
        totalConfidence += event.confidence;
        eventCount++;
      });
    });

    const avgConfidence = eventCount > 0 ? totalConfidence / eventCount : 0;
    const diversityScore = Math.min((uniqueObjects.size / Math.max(eventCount / 10, 1)) * 100, 100);
    
    const innovationEvents = Math.max(0, uniqueObjects.size - 1);
    const explorationRatio = Math.min(avgConfidence + 0.2, 1.0);

    console.log(`🎨 Creativity analysis with extracted data: ${uniqueObjects.size} unique objects, diversity: ${diversityScore.toFixed(1)}, exploration: ${(explorationRatio * 100).toFixed(1)}%`);

    return {
      diversityScore: Math.round(diversityScore),
      innovationEvents,
      explorationRatio: Number(explorationRatio.toFixed(3))
    };
  }

  private calculateOverallScore(
    toyUsage: any,
    activityTransitions: any[],
    cooperativePatterns: any[],
    creativityIndicators: any
  ): number {
    const toyScore = Math.min(toyUsage.toys.length * 15, 40); // 장난감 다양성 (최대 40점)
    const sharingScore = toyUsage.sharingRatio * 30; // 공유 놀이 (30점)
    const transitionScore = Math.min(activityTransitions.length * 3, 15); // 활동 전환 (최대 15점)
    const cooperationScore = Math.min(cooperativePatterns.length * 8, 25); // 협력 놀이 (최대 25점)
    const creativityScore = creativityIndicators.diversityScore * 0.1; // 창의성 (10점)

    const total = toyScore + sharingScore + transitionScore + cooperationScore + creativityScore;
    
    console.log(`📊 Score breakdown: toys=${toyScore}, sharing=${sharingScore.toFixed(1)}, transitions=${transitionScore}, cooperation=${cooperationScore}, creativity=${creativityScore.toFixed(1)}`);
    
    return Math.round(total);
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

  private isToyRelated(entityName: string): boolean {
    const toyKeywords = ['toy', 'ball', 'doll', 'block', 'car', 'truck', 'book', 'puzzle', 'game', 'bear', 'animal'];
    return toyKeywords.some(keyword => entityName.includes(keyword)) || 
           this.toyCategories.has(entityName);
  }

  private createEmptyResult(): PlayPatternResult {
    return {
      toysDetected: [],
      usageDuration: {},
      sharingRatio: 0,
      toyTransitions: [],
      activityTransitions: [],
      cooperativePatterns: [],
      creativityIndicators: {
        diversityScore: 0,
        innovationEvents: 0,
        explorationRatio: 0
      },
      overallScore: 0
    };
  }
} 