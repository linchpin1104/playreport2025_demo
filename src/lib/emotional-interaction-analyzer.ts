export interface FaceData {
  boundingBox: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
  time: number;
}

export interface EmotionalInteractionResult {
  mutualGazeTime: number;
  faceToFaceRatio: number;
  proximityChanges: Array<{time: number; change: 'closer' | 'farther'; magnitude: number}>;
  engagementScore: number;
  engagementPeriods: Array<{start: number; end: number; level: 'high' | 'medium' | 'low'}>;
  interactionQuality: 'high' | 'medium' | 'low';
  emotionalSynchrony: number;
}

export class EmotionalInteractionAnalyzer {
  private readonly faceSizeThreshold = 0.1;
  private readonly gazeAlignmentThreshold = 0.8;

  async analyzeEmotionalInteraction(
    faceData: FaceData[],
    personDetectionData: any[],
    emotionData?: any[]
  ): Promise<EmotionalInteractionResult> {
    console.log('😊 Starting emotional interaction analysis');
    console.log(`📊 Face data: ${faceData?.length || 0} entries, Person data: ${personDetectionData?.length || 0} entries`);

    if (!faceData || faceData.length === 0) {
      console.warn('⚠️ No face detection data available');
      return this.createEmptyResult();
    }

    try {
      // 1. 얼굴 지향 행동 분석
      const faceOrientation = this.analyzeFaceOrientationFromRealData(faceData);
      
      // 2. 감정 상태 추정
      const emotionalStates = this.estimateEmotionalStatesFromRealData(faceData, personDetectionData);
      
      console.log('✅ Emotional interaction analysis completed', {
        mutualGazeTime: faceOrientation.mutualGazeTime.toFixed(2),
        faceToFaceRatio: faceOrientation.faceToFaceRatio.toFixed(2),
        engagementPeriods: emotionalStates.engagementPeriods.length,
        interactionQuality: emotionalStates.interactionQuality
      });

      return {
        mutualGazeTime: faceOrientation.mutualGazeTime,
        faceToFaceRatio: faceOrientation.faceToFaceRatio,
        proximityChanges: faceOrientation.proximityChanges,
        engagementScore: faceOrientation.engagementScore,
        engagementPeriods: emotionalStates.engagementPeriods,
        interactionQuality: emotionalStates.interactionQuality,
        emotionalSynchrony: emotionalStates.emotionalSynchrony
      };
    } catch (error) {
      console.error('❌ Error in emotional interaction analysis:', error);
      return this.createEmptyResult();
    }
  }

  private analyzeFaceOrientationFromRealData(faceData: FaceData[]) {
    let mutualGazeFrames = 0;
    let faceToFaceFrames = 0;
    const proximityChanges: Array<{time: number; change: 'closer' | 'farther'; magnitude: number}> = [];

    // 시간순으로 정렬된 얼굴 데이터 그룹화 (시간대별)
    const timeGroups: Record<number, FaceData[]> = {};
    faceData.forEach(face => {
      const timeKey = Math.floor(face.time);
      if (!timeGroups[timeKey]) {
        timeGroups[timeKey] = [];
      }
      timeGroups[timeKey].push(face);
    });

    const timeKeys = Object.keys(timeGroups).map(Number).sort();
    let prevDistance = 0;
    let validFrames = 0;

    timeKeys.forEach((timeKey, index) => {
      const faces = timeGroups[timeKey];
      
      if (faces.length >= 2) {
        // 가장 큰 두 얼굴 선택 (가장 명확한 얼굴들)
        const sortedFaces = faces
          .sort((a, b) => this.getFaceSize(b) - this.getFaceSize(a))
          .slice(0, 2);

        const face1 = sortedFaces[0];
        const face2 = sortedFaces[1];

        // 상호 응시 판단 (휴리스틱 기반)
        if (this.isMutualGaze(face1, face2)) {
          mutualGazeFrames++;
        }

        // 얼굴 대면 판단
        if (this.isFaceToFace(face1, face2)) {
          faceToFaceFrames++;
        }

        // 근접성 변화 추적
        const currentDistance = this.calculateFaceDistance(face1, face2);
        if (index > 0 && Math.abs(currentDistance - prevDistance) > 0.05) {
          proximityChanges.push({
            time: timeKey,
            change: currentDistance < prevDistance ? 'closer' : 'farther',
            magnitude: Math.abs(currentDistance - prevDistance)
          });
        }
        prevDistance = currentDistance;
        validFrames++;
      }
    });

    const totalFrames = timeKeys.length;
    const mutualGazeTime = validFrames > 0 ? mutualGazeFrames / validFrames : 0;
    const faceToFaceRatio = validFrames > 0 ? faceToFaceFrames / validFrames : 0;
    
    console.log(`👀 Face orientation: ${validFrames} valid frames, mutual gaze: ${(mutualGazeTime * 100).toFixed(1)}%, face-to-face: ${(faceToFaceRatio * 100).toFixed(1)}%`);
    
    return {
      mutualGazeTime: Number(mutualGazeTime.toFixed(3)),
      faceToFaceRatio: Number(faceToFaceRatio.toFixed(3)),
      proximityChanges,
      engagementScore: this.calculateEngagementScore(mutualGazeTime, faceToFaceRatio, proximityChanges.length)
    };
  }

  private estimateEmotionalStatesFromRealData(faceData: FaceData[], movementData: any[]) {
    const engagementPeriods: Array<{start: number; end: number; level: 'high' | 'medium' | 'low'}> = [];
    let currentPeriod: {start: number; end: number; level: 'high' | 'medium' | 'low'} | null = null;

    // 시간순으로 정렬
    const sortedFaceData = [...faceData].sort((a, b) => a.time - b.time);

    if (sortedFaceData.length === 0) {
      return {
        engagementPeriods: [],
        interactionQuality: 'low' as const,
        emotionalSynchrony: 0
      };
    }

    // 시간대별 참여도 분석
    const timeGroups: Record<number, FaceData[]> = {};
    sortedFaceData.forEach(face => {
      const timeKey = Math.floor(face.time / 5) * 5; // 5초 간격으로 그룹화
      if (!timeGroups[timeKey]) {
        timeGroups[timeKey] = [];
      }
      timeGroups[timeKey].push(face);
    });

    Object.entries(timeGroups)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([timeStr, faces]) => {
        const time = parseInt(timeStr);
        const engagement = this.calculateFrameEngagementFromRealData(faces);
        
        let level: 'high' | 'medium' | 'low';
        if (engagement > 0.7) level = 'high';
        else if (engagement > 0.4) level = 'medium';
        else level = 'low';

        if (currentPeriod === null || currentPeriod.level !== level) {
          if (currentPeriod !== null) {
            engagementPeriods.push(currentPeriod);
          }
          currentPeriod = { start: time, end: time + 5, level };
        } else {
          currentPeriod.end = time + 5;
        }
      });

    if (currentPeriod !== null) {
      engagementPeriods.push(currentPeriod);
    }

    // 상호작용 품질 판단
    const totalHighEngagement = engagementPeriods
      .filter(p => p.level === 'high')
      .reduce((sum, p) => sum + (p.end - p.start), 0);
    
    const totalTime = sortedFaceData.length > 0 ? 
      sortedFaceData[sortedFaceData.length - 1].time - sortedFaceData[0].time : 1;
    
    const highEngagementRatio = totalHighEngagement / Math.max(totalTime, 1);

    let interactionQuality: 'high' | 'medium' | 'low';
    if (highEngagementRatio > 0.6) interactionQuality = 'high';
    else if (highEngagementRatio > 0.3) interactionQuality = 'medium';
    else interactionQuality = 'low';

    console.log(`💝 Emotional states: ${engagementPeriods.length} periods, ${totalHighEngagement}s high engagement, quality: ${interactionQuality}`);

    return {
      engagementPeriods,
      interactionQuality,
      emotionalSynchrony: this.calculateEmotionalSynchronyFromRealData(faceData)
    };
  }

  private calculateFrameEngagementFromRealData(faces: FaceData[]): number {
    if (faces.length === 0) return 0;

    let engagement = 0.0;

    // 얼굴 감지 여부 및 개수
    if (faces.length >= 1) {
      engagement += 0.3;
      
      if (faces.length >= 2) {
        engagement += 0.3; // 두 얼굴 모두 감지
        
        // 얼굴 크기 (근접성 지표)
        const avgFaceSize = faces.reduce((sum, face) => sum + this.getFaceSize(face), 0) / faces.length;
        if (avgFaceSize > this.faceSizeThreshold) {
          engagement += 0.2;
        }
        
        // 얼굴 간 관계 분석
        if (faces.length >= 2) {
          const face1 = faces[0];
          const face2 = faces[1];
          
          // 적절한 거리에 있는지
          const distance = this.calculateFaceDistance(face1, face2);
          if (distance > 0.1 && distance < 0.8) { // 너무 가깝지도 멀지도 않음
            engagement += 0.2;
          }
        }
      }
    }

    return Math.min(engagement, 1.0);
  }

  private calculateEmotionalSynchronyFromRealData(faceData: FaceData[]): number {
    if (faceData.length < 2) return 0.0;

    // 시간 그룹화 (1초 간격)
    const timeGroups: Record<number, FaceData[]> = {};
    faceData.forEach(face => {
      const timeKey = Math.floor(face.time);
      if (!timeGroups[timeKey]) {
        timeGroups[timeKey] = [];
      }
      timeGroups[timeKey].push(face);
    });

    let syncFrames = 0;
    let totalFrames = 0;

    Object.values(timeGroups).forEach(faces => {
      if (faces.length >= 2) {
        totalFrames++;
        
        // 얼굴 크기 및 위치 유사성 분석
        const sizes = faces.map(f => this.getFaceSize(f));
        const positions = faces.map(f => this.getFaceCenter(f));
        
        // 크기 유사성 (상대적 크기 차이가 적을 때)
        const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;
        const sizeVariance = sizes.reduce((sum, size) => sum + Math.pow(size - avgSize, 2), 0) / sizes.length;
        
        // 위치 분산 (너무 멀리 떨어져 있지 않을 때)
        const avgX = positions.reduce((sum, pos) => sum + pos[0], 0) / positions.length;
        const avgY = positions.reduce((sum, pos) => sum + pos[1], 0) / positions.length;
        const posVariance = positions.reduce((sum, pos) => 
          sum + Math.pow(pos[0] - avgX, 2) + Math.pow(pos[1] - avgY, 2), 0) / positions.length;
        
        // 동기화 조건: 크기 차이가 적고 위치가 적절히 분산되어 있음
        if (sizeVariance < 0.01 && posVariance > 0.01 && posVariance < 0.5) {
          syncFrames++;
        }
      }
    });

    const synchrony = totalFrames > 0 ? syncFrames / totalFrames : 0.0;
    console.log(`🔄 Emotional synchrony: ${syncFrames}/${totalFrames} synchronized frames (${(synchrony * 100).toFixed(1)}%)`);
    
    return Number(synchrony.toFixed(3));
  }

  // 기존 유틸리티 메서드들 (하드코딩 제거)
  private isMutualGaze(face1: FaceData, face2: FaceData): boolean {
    const center1 = this.getFaceCenter(face1);
    const center2 = this.getFaceCenter(face2);

    // 수평 정렬 확인 (비슷한 높이)
    const horizontalAlignment = Math.abs(center1[1] - center2[1]) < 0.2;
    // 서로 마주보고 있는지 (적절한 거리)
    const facingEachOther = Math.abs(center1[0] - center2[0]) > 0.1;

    return horizontalAlignment && facingEachOther;
  }

  private isFaceToFace(face1: FaceData, face2: FaceData): boolean {
    const center1 = this.getFaceCenter(face1);
    const center2 = this.getFaceCenter(face2);

    const horizontalAlignment = Math.abs(center1[1] - center2[1]) < 0.3;
    const distance = Math.abs(center1[0] - center2[0]);
    const appropriateDistance = 0.2 < distance && distance < 0.6;

    return horizontalAlignment && appropriateDistance;
  }

  private calculateFaceDistance(face1: FaceData, face2: FaceData): number {
    const center1 = this.getFaceCenter(face1);
    const center2 = this.getFaceCenter(face2);

    return Math.sqrt(Math.pow(center1[0] - center2[0], 2) + Math.pow(center1[1] - center2[1], 2));
  }

  private getFaceCenter(face: FaceData): [number, number] {
    const bbox = face.boundingBox;
    const x = (bbox.left + bbox.right) / 2;
    const y = (bbox.top + bbox.bottom) / 2;
    return [x, y];
  }

  private getFaceSize(face: FaceData): number {
    const bbox = face.boundingBox;
    const width = bbox.right - bbox.left;
    const height = bbox.bottom - bbox.top;
    return width * height;
  }

  private calculateEngagementScore(gazeRatio: number, faceRatio: number, changes: number): number {
    const score = (gazeRatio * 0.4 + faceRatio * 0.4 + Math.min(changes / 10, 1) * 0.2);
    return Number((score * 100).toFixed(2));
  }

  private createEmptyResult(): EmotionalInteractionResult {
    return {
      mutualGazeTime: 0,
      faceToFaceRatio: 0,
      proximityChanges: [],
      engagementScore: 0,
      engagementPeriods: [],
      interactionQuality: 'low',
      emotionalSynchrony: 0
    };
  }
} 