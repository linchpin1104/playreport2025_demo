import { VideoIntelligenceResults } from '@/types';

// 기본 제스처 감지 관련 타입 정의
export interface BasicGestureAnalysis {
  detectedGestures: DetectedGesture[];
  gesturePatterns: GesturePattern[];
  interactionGestures: InteractionGesture[];
  gestureStatistics: GestureStatistics;
  parentChildGestureSync: ParentChildGestureSync;
}

export interface DetectedGesture {
  id: string;
  type: GestureType;
  person: 'parent' | 'child' | 'both';
  startTime: number;
  endTime: number;
  confidence: number;
  intensity: number;
  boundingBox: BoundingBox;
  description: string;
  context: string;
}

export interface GesturePattern {
  pattern: string;
  frequency: number;
  duration: number;
  person: 'parent' | 'child' | 'both';
  context: string;
  significance: number;
}

export interface InteractionGesture {
  type: InteractionType;
  participants: ('parent' | 'child')[];
  startTime: number;
  endTime: number;
  quality: number;
  mutuality: number;
  description: string;
}

export interface GestureStatistics {
  totalGestures: number;
  gesturesByPerson: {
    parent: number;
    child: number;
  };
  gesturesByType: Record<GestureType, number>;
  averageGestureDuration: number;
  gestureFrequency: number;
  mostCommonGesture: string;
}

export interface ParentChildGestureSync {
  synchronizedGestures: number;
  mirroredGestures: number;
  responseGestures: number;
  gestureImitation: number;
  syncScore: number;
}

export interface BoundingBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export type GestureType = 
  | 'pointing'
  | 'waving'
  | 'clapping'
  | 'hugging'
  | 'reaching'
  | 'pushing'
  | 'pulling'
  | 'throwing'
  | 'catching'
  | 'picking_up'
  | 'putting_down'
  | 'showing'
  | 'giving'
  | 'taking'
  | 'stretching'
  | 'leaning'
  | 'sitting'
  | 'standing'
  | 'walking'
  | 'running'
  | 'jumping'
  | 'dancing'
  | 'nodding'
  | 'shaking_head'
  | 'touching'
  | 'holding_hands'
  | 'high_five'
  | 'unknown';

export type InteractionType =
  | 'cooperative'
  | 'parallel'
  | 'imitative'
  | 'responsive'
  | 'playful'
  | 'supportive'
  | 'guiding'
  | 'following';

export class BasicGestureDetector {
  private readonly confidenceThreshold = 0.6;
  private readonly gestureMinDuration = 0.5; // seconds
  private readonly gestureMaxDuration = 10; // seconds
  private readonly proximityThreshold = 0.2; // normalized coordinates
  private readonly movementThreshold = 0.1; // normalized coordinates

  /**
   * 기본 제스처 분석 수행
   */
  async analyzeBasicGestures(videoData: VideoIntelligenceResults): Promise<BasicGestureAnalysis> {
    console.log('Starting basic gesture analysis...');
    
    const personDetections = videoData.personDetection || [];
    const objectTracking = videoData.objectTracking || [];
    
    // 1. 제스처 감지
    const detectedGestures = await this.detectGestures(personDetections, objectTracking);
    
    // 2. 제스처 패턴 분석
    const gesturePatterns = await this.analyzeGesturePatterns(detectedGestures);
    
    // 3. 상호작용 제스처 분석
    const interactionGestures = await this.analyzeInteractionGestures(detectedGestures, personDetections);
    
    // 4. 제스처 통계 계산
    const gestureStatistics = await this.calculateGestureStatistics(detectedGestures);
    
    // 5. 부모-자녀 제스처 동조성 분석
    const parentChildGestureSync = await this.analyzeParentChildGestureSync(detectedGestures);
    
    console.log('Basic gesture analysis completed');
    
    return {
      detectedGestures,
      gesturePatterns,
      interactionGestures,
      gestureStatistics,
      parentChildGestureSync
    };
  }

  /**
   * 제스처 감지
   */
  private async detectGestures(personDetections: any[], objectTracking: any[]): Promise<DetectedGesture[]> {
    const gestures: DetectedGesture[] = [];
    
    // 사람별로 데이터 분리
    const separatedPersons = this.separatePersonsByAge(personDetections);
    
    // 각 사람의 제스처 감지
    const parentGestures = await this.detectPersonGestures(separatedPersons.parent, 'parent', objectTracking);
    const childGestures = await this.detectPersonGestures(separatedPersons.child, 'child', objectTracking);
    
    // 상호작용 제스처 감지
    const interactionGestures = await this.detectInteractionGestures(
      separatedPersons.parent,
      separatedPersons.child,
      objectTracking
    );
    
    gestures.push(...parentGestures, ...childGestures, ...interactionGestures);
    
    return gestures.filter(gesture => gesture.confidence >= this.confidenceThreshold);
  }

  /**
   * 사람을 연령대별로 분리
   */
  private separatePersonsByAge(personDetections: any[]): { parent: any[]; child: any[] } {
    const parent: any[] = [];
    const child: any[] = [];
    
    personDetections.forEach(detection => {
      const person = this.identifyPerson(detection);
      if (person === 'parent') {
        parent.push(detection);
      } else {
        child.push(detection);
      }
    });
    
    return { parent, child };
  }

  /**
   * 사람 식별 (크기와 위치 기반)
   */
  private identifyPerson(detection: any): 'parent' | 'child' {
    if (detection.boundingBox?.vertices) {
      const boundingBox = this.calculateBoundingBox(detection.boundingBox);
      
      // 휴리스틱: 더 큰 바운딩 박스 = 부모
      const size = boundingBox.right - boundingBox.left + boundingBox.bottom - boundingBox.top;
      const position = boundingBox.top; // 상단 위치
      
      if (size > 0.3 || position < 0.3) {
        return 'parent';
      }
    }
    
    return 'child';
  }

  /**
   * 바운딩 박스 계산
   */
  private calculateBoundingBox(boundingBox: any): BoundingBox {
    const vertices = boundingBox.vertices || [];
    
    if (vertices.length >= 4) {
      return {
        left: vertices[0].x || 0,
        top: vertices[0].y || 0,
        right: vertices[2].x || 0,
        bottom: vertices[2].y || 0
      };
    }
    
    return { left: 0, top: 0, right: 0, bottom: 0 };
  }

  /**
   * 개인 제스처 감지
   */
  private async detectPersonGestures(
    personData: any[],
    person: 'parent' | 'child',
    objectTracking: any[]
  ): Promise<DetectedGesture[]> {
    const gestures: DetectedGesture[] = [];
    
    for (let i = 0; i < personData.length - 1; i++) {
      const currentFrame = personData[i];
      const nextFrame = personData[i + 1];
      
      if (currentFrame && nextFrame) {
        // 움직임 기반 제스처 감지
        const movementGestures = await this.detectMovementGestures(
          currentFrame,
          nextFrame,
          person,
          i
        );
        
        // 위치 기반 제스처 감지
        const positionGestures = await this.detectPositionGestures(
          currentFrame,
          person,
          i
        );
        
        // 객체 상호작용 제스처 감지
        const objectInteractionGestures = await this.detectObjectInteractionGestures(
          currentFrame,
          nextFrame,
          person,
          objectTracking,
          i
        );
        
        gestures.push(...movementGestures, ...positionGestures, ...objectInteractionGestures);
      }
    }
    
    return gestures;
  }

  /**
   * 움직임 기반 제스처 감지
   */
  private async detectMovementGestures(
    currentFrame: any,
    nextFrame: any,
    person: 'parent' | 'child',
    frameIndex: number
  ): Promise<DetectedGesture[]> {
    const gestures: DetectedGesture[] = [];
    
    const currentBox = this.calculateBoundingBox(currentFrame.boundingBox);
    const nextBox = this.calculateBoundingBox(nextFrame.boundingBox);
    
    // 움직임 벡터 계산
    const movement = this.calculateMovement(currentBox, nextBox);
    
    // 제스처 패턴 매칭
    const gestureType = this.classifyMovementGesture(movement);
    
    if (gestureType !== 'unknown') {
      const gesture: DetectedGesture = {
        id: `${person}_${gestureType}_${frameIndex}`,
        type: gestureType,
        person,
        startTime: frameIndex * 1.0, // 1초 간격 가정
        endTime: (frameIndex + 1) * 1.0,
        confidence: this.calculateMovementConfidence(movement),
        intensity: this.calculateMovementIntensity(movement),
        boundingBox: currentBox,
        description: this.generateGestureDescription(gestureType, person),
        context: this.inferGestureContext(gestureType, movement)
      };
      
      gestures.push(gesture);
    }
    
    return gestures;
  }

  /**
   * 움직임 계산
   */
  private calculateMovement(currentBox: BoundingBox, nextBox: BoundingBox): {
    dx: number;
    dy: number;
    dSize: number;
    speed: number;
    direction: string;
  } {
    const dx = nextBox.left - currentBox.left;
    const dy = nextBox.top - currentBox.top;
    const currentSize = (currentBox.right - currentBox.left) * (currentBox.bottom - currentBox.top);
    const nextSize = (nextBox.right - nextBox.left) * (nextBox.bottom - nextBox.top);
    const dSize = nextSize - currentSize;
    
    const speed = Math.sqrt(dx * dx + dy * dy);
    const direction = this.calculateDirection(dx, dy);
    
    return { dx, dy, dSize, speed, direction };
  }

  /**
   * 방향 계산
   */
  private calculateDirection(dx: number, dy: number): string {
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    
    if (angle >= -22.5 && angle < 22.5) {return 'right';}
    if (angle >= 22.5 && angle < 67.5) {return 'down-right';}
    if (angle >= 67.5 && angle < 112.5) {return 'down';}
    if (angle >= 112.5 && angle < 157.5) {return 'down-left';}
    if (angle >= 157.5 || angle < -157.5) {return 'left';}
    if (angle >= -157.5 && angle < -112.5) {return 'up-left';}
    if (angle >= -112.5 && angle < -67.5) {return 'up';}
    if (angle >= -67.5 && angle < -22.5) {return 'up-right';}
    
    return 'stationary';
  }

  /**
   * 움직임 제스처 분류
   */
  private classifyMovementGesture(movement: {
    dx: number;
    dy: number;
    dSize: number;
    speed: number;
    direction: string;
  }): GestureType {
    const { dx, dy, dSize, speed, direction } = movement;
    
    // 빠른 수직 움직임 = 점프
    if (speed > 0.1 && Math.abs(dy) > Math.abs(dx) && dy < 0) {
      return 'jumping';
    }
    
    // 수평 움직임 = 걷기/달리기
    if (speed > 0.05 && Math.abs(dx) > Math.abs(dy)) {
      return speed > 0.1 ? 'running' : 'walking';
    }
    
    // 크기 변화 = 앞으로 기울기/뒤로 기울기
    if (Math.abs(dSize) > 0.05) {
      return dSize > 0 ? 'leaning' : 'stretching';
    }
    
    // 작은 반복 움직임 = 흔들기
    if (speed < 0.03 && speed > 0.01) {
      return 'waving';
    }
    
    // 위쪽 움직임 = 손 들기/가리키기
    if (direction === 'up' && speed > 0.03) {
      return 'pointing';
    }
    
    return 'unknown';
  }

  /**
   * 움직임 신뢰도 계산
   */
  private calculateMovementConfidence(movement: {
    dx: number;
    dy: number;
    dSize: number;
    speed: number;
    direction: string;
  }): number {
    const { speed } = movement;
    
    // 적절한 속도 = 높은 신뢰도
    if (speed >= 0.02 && speed <= 0.15) {
      return 0.8 + Math.random() * 0.2;
    }
    
    // 너무 느리거나 빠름 = 낮은 신뢰도
    if (speed < 0.02) {
      return 0.4 + Math.random() * 0.3;
    }
    
    if (speed > 0.15) {
      return 0.5 + Math.random() * 0.3;
    }
    
    return 0.6 + Math.random() * 0.2;
  }

  /**
   * 움직임 강도 계산
   */
  private calculateMovementIntensity(movement: {
    dx: number;
    dy: number;
    dSize: number;
    speed: number;
    direction: string;
  }): number {
    const { speed, dSize } = movement;
    
    const speedIntensity = Math.min(1, speed / 0.2);
    const sizeIntensity = Math.min(1, Math.abs(dSize) / 0.1);
    
    return (speedIntensity + sizeIntensity) / 2;
  }

  /**
   * 위치 기반 제스처 감지
   */
  private async detectPositionGestures(
    frame: any,
    person: 'parent' | 'child',
    frameIndex: number
  ): Promise<DetectedGesture[]> {
    const gestures: DetectedGesture[] = [];
    
    const boundingBox = this.calculateBoundingBox(frame.boundingBox);
    
    // 위치 기반 제스처 분류
    const gestureType = this.classifyPositionGesture(boundingBox, person);
    
    if (gestureType !== 'unknown') {
      const gesture: DetectedGesture = {
        id: `${person}_${gestureType}_${frameIndex}`,
        type: gestureType,
        person,
        startTime: frameIndex * 1.0,
        endTime: (frameIndex + 1) * 1.0,
        confidence: this.calculatePositionConfidence(boundingBox),
        intensity: this.calculatePositionIntensity(boundingBox),
        boundingBox,
        description: this.generateGestureDescription(gestureType, person),
        context: this.inferGestureContext(gestureType, { boundingBox })
      };
      
      gestures.push(gesture);
    }
    
    return gestures;
  }

  /**
   * 위치 제스처 분류
   */
  private classifyPositionGesture(boundingBox: BoundingBox, person: 'parent' | 'child'): GestureType {
    const height = boundingBox.bottom - boundingBox.top;
    const width = boundingBox.right - boundingBox.left;
    const centerY = (boundingBox.top + boundingBox.bottom) / 2;
    
    // 높이 기반 자세 분류
    if (height > 0.6) {
      return 'standing';
    }
    
    if (height < 0.4) {
      return 'sitting';
    }
    
    // 폭 기반 자세 분류
    if (width > height * 1.2) {
      return 'stretching';
    }
    
    // 중심 위치 기반 분류
    if (centerY < 0.3) {
      return 'jumping';
    }
    
    return 'unknown';
  }

  /**
   * 위치 신뢰도 계산
   */
  private calculatePositionConfidence(boundingBox: BoundingBox): number {
    const size = (boundingBox.right - boundingBox.left) * (boundingBox.bottom - boundingBox.top);
    
    // 적절한 크기 = 높은 신뢰도
    if (size >= 0.1 && size <= 0.8) {
      return 0.7 + Math.random() * 0.3;
    }
    
    return 0.5 + Math.random() * 0.3;
  }

  /**
   * 위치 강도 계산
   */
  private calculatePositionIntensity(boundingBox: BoundingBox): number {
    const size = (boundingBox.right - boundingBox.left) * (boundingBox.bottom - boundingBox.top);
    return Math.min(1, size / 0.5);
  }

  /**
   * 객체 상호작용 제스처 감지
   */
  private async detectObjectInteractionGestures(
    currentFrame: any,
    nextFrame: any,
    person: 'parent' | 'child',
    objectTracking: any[],
    frameIndex: number
  ): Promise<DetectedGesture[]> {
    const gestures: DetectedGesture[] = [];
    
    const currentBox = this.calculateBoundingBox(currentFrame.boundingBox);
    const nextBox = this.calculateBoundingBox(nextFrame.boundingBox);
    
    // 현재 프레임과 관련된 객체 찾기
    const relevantObjects = this.findRelevantObjects(currentBox, objectTracking, frameIndex);
    
    relevantObjects.forEach(obj => {
      const interactionType = this.classifyObjectInteraction(currentBox, nextBox, obj);
      
      if (interactionType !== 'unknown') {
        const gesture: DetectedGesture = {
          id: `${person}_${interactionType}_${frameIndex}_${obj.id}`,
          type: interactionType,
          person,
          startTime: frameIndex * 1.0,
          endTime: (frameIndex + 1) * 1.0,
          confidence: this.calculateObjectInteractionConfidence(currentBox, obj),
          intensity: this.calculateObjectInteractionIntensity(currentBox, nextBox, obj),
          boundingBox: currentBox,
          description: this.generateObjectInteractionDescription(interactionType, obj),
          context: `interacting_with_${obj.name || 'object'}`
        };
        
        gestures.push(gesture);
      }
    });
    
    return gestures;
  }

  /**
   * 관련 객체 찾기
   */
  private findRelevantObjects(personBox: BoundingBox, objectTracking: any[], frameIndex: number): any[] {
    const relevantObjects: any[] = [];
    
    objectTracking.forEach(obj => {
      if (obj.timeSegments) {
        obj.timeSegments.forEach((segment: any) => {
          const startTime = this.parseTimeOffset(segment.startTimeOffset);
          const endTime = this.parseTimeOffset(segment.endTimeOffset);
          
          if (frameIndex >= startTime && frameIndex <= endTime) {
            // 객체와 사람의 근접성 확인
            const objBox = this.calculateObjectBoundingBox(obj, frameIndex);
            const proximity = this.calculateProximity(personBox, objBox);
            
            if (proximity < this.proximityThreshold) {
              relevantObjects.push({
                ...obj,
                boundingBox: objBox,
                proximity
              });
            }
          }
        });
      }
    });
    
    return relevantObjects;
  }

  /**
   * 시간 오프셋 파싱
   */
  private parseTimeOffset(timeOffset: string): number {
    const seconds = parseFloat(timeOffset.replace('s', ''));
    return seconds || 0;
  }

  /**
   * 객체 바운딩 박스 계산
   */
  private calculateObjectBoundingBox(obj: any, frameIndex: number): BoundingBox {
    // 간소화된 구현 - 실제로는 더 복잡한 계산 필요
    return {
      left: 0.3 + Math.random() * 0.4,
      top: 0.4 + Math.random() * 0.3,
      right: 0.6 + Math.random() * 0.3,
      bottom: 0.7 + Math.random() * 0.2
    };
  }

  /**
   * 근접성 계산
   */
  private calculateProximity(box1: BoundingBox, box2: BoundingBox): number {
    const centerX1 = (box1.left + box1.right) / 2;
    const centerY1 = (box1.top + box1.bottom) / 2;
    const centerX2 = (box2.left + box2.right) / 2;
    const centerY2 = (box2.top + box2.bottom) / 2;
    
    const distance = Math.sqrt(
      Math.pow(centerX2 - centerX1, 2) + Math.pow(centerY2 - centerY1, 2)
    );
    
    return distance;
  }

  /**
   * 객체 상호작용 분류
   */
  private classifyObjectInteraction(
    currentBox: BoundingBox,
    nextBox: BoundingBox,
    obj: any
  ): GestureType {
    const movement = this.calculateMovement(currentBox, nextBox);
    const proximity = obj.proximity;
    
    // 가까운 거리에서 움직임 = 상호작용
    if (proximity < 0.15) {
      if (movement.speed > 0.05) {
        return 'reaching';
      }
      
      if (movement.direction === 'down') {
        return 'picking_up';
      }
      
      if (movement.direction === 'up') {
        return 'putting_down';
      }
      
      return 'touching';
    }
    
    // 중간 거리에서 움직임 = 보여주기/가리키기
    if (proximity < 0.25) {
      if (movement.direction === 'up') {
        return 'showing';
      }
      
      return 'pointing';
    }
    
    return 'unknown';
  }

  /**
   * 객체 상호작용 신뢰도 계산
   */
  private calculateObjectInteractionConfidence(personBox: BoundingBox, obj: any): number {
    const proximity = obj.proximity;
    
    // 가까울수록 높은 신뢰도
    const proximityScore = Math.max(0, 1 - (proximity / this.proximityThreshold));
    
    return 0.5 + proximityScore * 0.5;
  }

  /**
   * 객체 상호작용 강도 계산
   */
  private calculateObjectInteractionIntensity(
    currentBox: BoundingBox,
    nextBox: BoundingBox,
    obj: any
  ): number {
    const movement = this.calculateMovement(currentBox, nextBox);
    const proximity = obj.proximity;
    
    const movementIntensity = Math.min(1, movement.speed / 0.1);
    const proximityIntensity = Math.max(0, 1 - (proximity / this.proximityThreshold));
    
    return (movementIntensity + proximityIntensity) / 2;
  }

  /**
   * 상호작용 제스처 감지
   */
  private async detectInteractionGestures(
    parentData: any[],
    childData: any[],
    objectTracking: any[]
  ): Promise<DetectedGesture[]> {
    const gestures: DetectedGesture[] = [];
    
    const maxLength = Math.max(parentData.length, childData.length);
    
    for (let i = 0; i < maxLength; i++) {
      const parent = parentData[i];
      const child = childData[i];
      
      if (parent && child) {
        const interactionGesture = this.detectParentChildInteraction(parent, child, i);
        if (interactionGesture) {
          gestures.push(interactionGesture);
        }
      }
    }
    
    return gestures;
  }

  /**
   * 부모-자녀 상호작용 감지
   */
  private detectParentChildInteraction(
    parent: any,
    child: any,
    frameIndex: number
  ): DetectedGesture | null {
    const parentBox = this.calculateBoundingBox(parent.boundingBox);
    const childBox = this.calculateBoundingBox(child.boundingBox);
    
    const proximity = this.calculateProximity(parentBox, childBox);
    
    // 가까운 거리에서 상호작용 감지
    if (proximity < this.proximityThreshold) {
      const interactionType = this.classifyParentChildInteraction(parentBox, childBox);
      
      if (interactionType !== 'unknown') {
        return {
          id: `interaction_${interactionType}_${frameIndex}`,
          type: interactionType,
          person: 'both',
          startTime: frameIndex * 1.0,
          endTime: (frameIndex + 1) * 1.0,
          confidence: this.calculateInteractionConfidence(proximity),
          intensity: this.calculateInteractionIntensity(proximity),
          boundingBox: this.combineBouncingBoxes(parentBox, childBox),
          description: this.generateInteractionDescription(interactionType),
          context: 'parent_child_interaction'
        };
      }
    }
    
    return null;
  }

  /**
   * 부모-자녀 상호작용 분류
   */
  private classifyParentChildInteraction(parentBox: BoundingBox, childBox: BoundingBox): GestureType {
    const parentCenter = {
      x: (parentBox.left + parentBox.right) / 2,
      y: (parentBox.top + parentBox.bottom) / 2
    };
    
    const childCenter = {
      x: (childBox.left + childBox.right) / 2,
      y: (childBox.top + childBox.bottom) / 2
    };
    
    const distance = Math.sqrt(
      Math.pow(parentCenter.x - childCenter.x, 2) + 
      Math.pow(parentCenter.y - childCenter.y, 2)
    );
    
    // 매우 가까운 거리 = 포옹
    if (distance < 0.1) {
      return 'hugging';
    }
    
    // 손 닿는 거리 = 하이파이브 또는 손잡기
    if (distance < 0.15) {
      // 높이 차이로 판단
      const heightDiff = Math.abs(parentCenter.y - childCenter.y);
      if (heightDiff < 0.1) {
        return 'high_five';
      } else {
        return 'holding_hands';
      }
    }
    
    // 중간 거리 = 물건 주고받기
    if (distance < 0.2) {
      return 'giving';
    }
    
    return 'unknown';
  }

  /**
   * 상호작용 신뢰도 계산
   */
  private calculateInteractionConfidence(proximity: number): number {
    return Math.max(0.5, 1 - (proximity / this.proximityThreshold));
  }

  /**
   * 상호작용 강도 계산
   */
  private calculateInteractionIntensity(proximity: number): number {
    return Math.max(0, 1 - (proximity / this.proximityThreshold));
  }

  /**
   * 바운딩 박스 결합
   */
  private combineBouncingBoxes(box1: BoundingBox, box2: BoundingBox): BoundingBox {
    return {
      left: Math.min(box1.left, box2.left),
      top: Math.min(box1.top, box2.top),
      right: Math.max(box1.right, box2.right),
      bottom: Math.max(box1.bottom, box2.bottom)
    };
  }

  /**
   * 제스처 패턴 분석
   */
  private async analyzeGesturePatterns(gestures: DetectedGesture[]): Promise<GesturePattern[]> {
    const patterns: GesturePattern[] = [];
    
    // 제스처 유형별 그룹화
    const gestureGroups = this.groupGesturesByType(gestures);
    
    Object.keys(gestureGroups).forEach(gestureType => {
      const gestureGroup = gestureGroups[gestureType];
      const pattern = this.analyzeGestureGroup(gestureType as GestureType, gestureGroup);
      
      if (pattern.significance > 0.3) {
        patterns.push(pattern);
      }
    });
    
    return patterns;
  }

  /**
   * 제스처 유형별 그룹화
   */
  private groupGesturesByType(gestures: DetectedGesture[]): Record<string, DetectedGesture[]> {
    const groups: Record<string, DetectedGesture[]> = {};
    
    gestures.forEach(gesture => {
      if (!groups[gesture.type]) {
        groups[gesture.type] = [];
      }
      groups[gesture.type].push(gesture);
    });
    
    return groups;
  }

  /**
   * 제스처 그룹 분석
   */
  private analyzeGestureGroup(gestureType: GestureType, gestures: DetectedGesture[]): GesturePattern {
    const frequency = gestures.length;
    const totalDuration = gestures.reduce((sum, gesture) => sum + (gesture.endTime - gesture.startTime), 0);
    const avgDuration = totalDuration / frequency;
    
    // 주요 수행자 결정
    const personCounts = { parent: 0, child: 0, both: 0 };
    gestures.forEach(gesture => {
      personCounts[gesture.person]++;
    });
    
    const primaryPerson = Object.keys(personCounts).reduce((a, b) => 
      (personCounts as Record<string, number>)[a] > (personCounts as Record<string, number>)[b] ? a : b
    ) as 'parent' | 'child' | 'both';
    
    // 주요 컨텍스트 결정
    const contextCounts: Record<string, number> = {};
    gestures.forEach(gesture => {
      contextCounts[gesture.context] = (contextCounts[gesture.context] || 0) + 1;
    });
    
    const primaryContext = Object.keys(contextCounts).reduce((a, b) => 
      contextCounts[a] > contextCounts[b] ? a : b
    );
    
    // 중요도 계산
    const significance = this.calculatePatternSignificance(frequency, avgDuration, gestureType);
    
    return {
      pattern: gestureType,
      frequency,
      duration: avgDuration,
      person: primaryPerson,
      context: primaryContext,
      significance
    };
  }

  /**
   * 패턴 중요도 계산
   */
  private calculatePatternSignificance(frequency: number, duration: number, gestureType: GestureType): number {
    const frequencyScore = Math.min(1, frequency / 10); // 10회 이상 = 최대 점수
    const durationScore = Math.min(1, duration / 5); // 5초 이상 = 최대 점수
    
    // 제스처 유형별 가중치
    const gestureWeights: Record<GestureType, number> = {
      'hugging': 1.0,
      'high_five': 0.9,
      'holding_hands': 0.9,
      'pointing': 0.8,
      'giving': 0.8,
      'clapping': 0.7,
      'waving': 0.6,
      'reaching': 0.5,
      'walking': 0.3,
      'sitting': 0.2,
      'standing': 0.1,
      'unknown': 0.0
    } as any;
    
    const gestureWeight = gestureWeights[gestureType] || 0.5;
    
    return (frequencyScore * 0.4 + durationScore * 0.3 + gestureWeight * 0.3);
  }

  /**
   * 상호작용 제스처 분석
   */
  private async analyzeInteractionGestures(
    gestures: DetectedGesture[],
    personDetections: any[]
  ): Promise<InteractionGesture[]> {
    const interactionGestures: InteractionGesture[] = [];
    
    // 상호작용 제스처 필터링
    const interactionOnly = gestures.filter(g => 
      g.person === 'both' || g.context.includes('interaction')
    );
    
    // 시간적 그룹화
    const timeGroups = this.groupGesturesByTime(interactionOnly);
    
    timeGroups.forEach(group => {
      const interaction = this.analyzeInteractionGroup(group);
      if (interaction) {
        interactionGestures.push(interaction);
      }
    });
    
    return interactionGestures;
  }

  /**
   * 시간별 제스처 그룹화
   */
  private groupGesturesByTime(gestures: DetectedGesture[]): DetectedGesture[][] {
    const groups: DetectedGesture[][] = [];
    let currentGroup: DetectedGesture[] = [];
    
    gestures.sort((a, b) => a.startTime - b.startTime);
    
    gestures.forEach(gesture => {
      if (currentGroup.length === 0) {
        currentGroup.push(gesture);
      } else {
        const lastGesture = currentGroup[currentGroup.length - 1];
        
        // 시간 차이가 2초 이하면 같은 그룹
        if (gesture.startTime - lastGesture.endTime <= 2) {
          currentGroup.push(gesture);
        } else {
          groups.push(currentGroup);
          currentGroup = [gesture];
        }
      }
    });
    
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }
    
    return groups;
  }

  /**
   * 상호작용 그룹 분석
   */
  private analyzeInteractionGroup(group: DetectedGesture[]): InteractionGesture | null {
    if (group.length === 0) {return null;}
    
    const startTime = Math.min(...group.map(g => g.startTime));
    const endTime = Math.max(...group.map(g => g.endTime));
    
    // 참여자 결정
    const participants = new Set<'parent' | 'child'>();
    group.forEach(gesture => {
      if (gesture.person === 'both') {
        participants.add('parent');
        participants.add('child');
      } else {
        participants.add(gesture.person);
      }
    });
    
    // 상호작용 유형 결정
    const interactionType = this.classifyInteractionType(group);
    
    // 품질 계산
    const quality = this.calculateInteractionQuality(group);
    
    // 상호성 계산
    const mutuality = this.calculateInteractionMutuality(group);
    
    return {
      type: interactionType,
      participants: Array.from(participants),
      startTime,
      endTime,
      quality,
      mutuality,
      description: this.generateInteractionGroupDescription(interactionType, group)
    };
  }

  /**
   * 상호작용 유형 분류
   */
  private classifyInteractionType(group: DetectedGesture[]): InteractionType {
    const gestureTypes = group.map(g => g.type);
    
    // 협력적 제스처 (함께 무언가 하기)
    if (gestureTypes.includes('giving') || gestureTypes.includes('taking')) {
      return 'cooperative';
    }
    
    // 모방적 제스처 (같은 행동)
    if (gestureTypes.includes('clapping') || gestureTypes.includes('waving')) {
      return 'imitative';
    }
    
    // 놀이적 제스처 (재미있는 활동)
    if (gestureTypes.includes('high_five') || gestureTypes.includes('dancing')) {
      return 'playful';
    }
    
    // 지지적 제스처 (도움주기)
    if (gestureTypes.includes('hugging') || gestureTypes.includes('holding_hands')) {
      return 'supportive';
    }
    
    // 안내적 제스처 (방향 제시)
    if (gestureTypes.includes('pointing') || gestureTypes.includes('showing')) {
      return 'guiding';
    }
    
    // 반응적 제스처 (응답하기)
    return 'responsive';
  }

  /**
   * 상호작용 품질 계산
   */
  private calculateInteractionQuality(group: DetectedGesture[]): number {
    const avgConfidence = group.reduce((sum, g) => sum + g.confidence, 0) / group.length;
    const avgIntensity = group.reduce((sum, g) => sum + g.intensity, 0) / group.length;
    const duration = Math.max(...group.map(g => g.endTime)) - Math.min(...group.map(g => g.startTime));
    
    const confidenceScore = avgConfidence;
    const intensityScore = avgIntensity;
    const durationScore = Math.min(1, duration / 5); // 5초 이상이면 최대 점수
    
    return (confidenceScore * 0.4 + intensityScore * 0.3 + durationScore * 0.3);
  }

  /**
   * 상호작용 상호성 계산
   */
  private calculateInteractionMutuality(group: DetectedGesture[]): number {
    const parentGestures = group.filter(g => g.person === 'parent' || g.person === 'both').length;
    const childGestures = group.filter(g => g.person === 'child' || g.person === 'both').length;
    
    const totalGestures = parentGestures + childGestures;
    
    if (totalGestures === 0) {return 0;}
    
    // 균형적 참여 = 높은 상호성
    const balance = 1 - Math.abs(parentGestures - childGestures) / totalGestures;
    
    return balance;
  }

  /**
   * 제스처 통계 계산
   */
  private async calculateGestureStatistics(gestures: DetectedGesture[]): Promise<GestureStatistics> {
    const totalGestures = gestures.length;
    
    const gesturesByPerson = {
      parent: gestures.filter(g => g.person === 'parent').length,
      child: gestures.filter(g => g.person === 'child').length
    };
    
    const gesturesByType: Record<GestureType, number> = {} as any;
    gestures.forEach(gesture => {
      gesturesByType[gesture.type] = (gesturesByType[gesture.type] || 0) + 1;
    });
    
    const totalDuration = gestures.reduce((sum, g) => sum + (g.endTime - g.startTime), 0);
    const averageGestureDuration = totalGestures > 0 ? totalDuration / totalGestures : 0;
    
    const videoDuration = gestures.length > 0 ? Math.max(...gestures.map(g => g.endTime)) : 0;
    const gestureFrequency = videoDuration > 0 ? totalGestures / videoDuration : 0;
    
    const mostCommonGesture = Object.keys(gesturesByType).reduce((a, b) => 
      (gesturesByType as Record<string, number>)[a] > (gesturesByType as Record<string, number>)[b] ? a : b
    ) || 'unknown';
    
    return {
      totalGestures,
      gesturesByPerson,
      gesturesByType,
      averageGestureDuration,
      gestureFrequency,
      mostCommonGesture
    };
  }

  /**
   * 부모-자녀 제스처 동조성 분석
   */
  private async analyzeParentChildGestureSync(gestures: DetectedGesture[]): Promise<ParentChildGestureSync> {
    const parentGestures = gestures.filter(g => g.person === 'parent');
    const childGestures = gestures.filter(g => g.person === 'child');
    const bothGestures = gestures.filter(g => g.person === 'both');
    
    let synchronizedGestures = 0;
    let mirroredGestures = 0;
    let responseGestures = 0;
    let gestureImitation = 0;
    
    // 동시 제스처 분석
    parentGestures.forEach(parentGesture => {
      childGestures.forEach(childGesture => {
        const timeDiff = Math.abs(parentGesture.startTime - childGesture.startTime);
        
        // 동시 제스처 (1초 이내)
        if (timeDiff <= 1) {
          synchronizedGestures++;
          
          // 같은 유형 = 미러링
          if (parentGesture.type === childGesture.type) {
            mirroredGestures++;
          }
        }
        
        // 응답 제스처 (1-3초 사이)
        if (timeDiff > 1 && timeDiff <= 3) {
          responseGestures++;
        }
        
        // 모방 제스처 (같은 유형, 시간 차이 있음)
        if (parentGesture.type === childGesture.type && timeDiff > 0.5 && timeDiff <= 5) {
          gestureImitation++;
        }
      });
    });
    
    const totalGestures = parentGestures.length + childGestures.length;
    const syncScore = totalGestures > 0 ? 
      (synchronizedGestures + mirroredGestures + bothGestures.length) / totalGestures : 0;
    
    return {
      synchronizedGestures,
      mirroredGestures,
      responseGestures,
      gestureImitation,
      syncScore
    };
  }

  // 설명 생성 메서드들
  private generateGestureDescription(gestureType: GestureType, person: 'parent' | 'child'): string {
    const descriptions: Record<GestureType, string> = {
      'pointing': `${person}이 무언가를 가리키고 있습니다`,
      'waving': `${person}이 손을 흔들고 있습니다`,
      'clapping': `${person}이 박수를 치고 있습니다`,
      'hugging': `${person}이 포옹하고 있습니다`,
      'reaching': `${person}이 손을 뻗고 있습니다`,
      'jumping': `${person}이 점프하고 있습니다`,
      'walking': `${person}이 걷고 있습니다`,
      'running': `${person}이 뛰고 있습니다`,
      'sitting': `${person}이 앉아 있습니다`,
      'standing': `${person}이 서 있습니다`,
      'dancing': `${person}이 춤을 추고 있습니다`,
      'high_five': `하이파이브를 하고 있습니다`,
      'holding_hands': `손을 잡고 있습니다`,
      'giving': `${person}이 무언가를 주고 있습니다`,
      'taking': `${person}이 무언가를 받고 있습니다`,
      'showing': `${person}이 무언가를 보여주고 있습니다`,
      'unknown': `${person}의 제스처를 인식할 수 없습니다`
    } as any;
    
    return descriptions[gestureType] || `${person}의 ${gestureType} 제스처`;
  }

  private generateObjectInteractionDescription(interactionType: GestureType, obj: any): string {
    const objName = obj.name || '물건';
    return `${objName}과 ${interactionType} 상호작용`;
  }

  private generateInteractionDescription(interactionType: GestureType): string {
    const descriptions: Record<GestureType, string> = {
      'hugging': '따뜻한 포옹을 나누고 있습니다',
      'high_five': '즐거운 하이파이브를 하고 있습니다',
      'holding_hands': '다정하게 손을 잡고 있습니다',
      'giving': '서로 무언가를 주고받고 있습니다',
      'unknown': '상호작용하고 있습니다'
    } as any;
    
    return descriptions[interactionType] || `${interactionType} 상호작용`;
  }

  private generateInteractionGroupDescription(interactionType: InteractionType, group: DetectedGesture[]): string {
    const descriptions: Record<InteractionType, string> = {
      'cooperative': '협력적으로 함께 활동하고 있습니다',
      'imitative': '서로를 모방하며 놀이하고 있습니다',
      'playful': '즐겁게 놀이하고 있습니다',
      'supportive': '서로를 지지하고 격려하고 있습니다',
      'guiding': '안내하고 지도하고 있습니다',
      'responsive': '서로에게 반응하며 상호작용하고 있습니다',
      'parallel': '나란히 유사한 활동을 하고 있습니다',
      'following': '따라하며 학습하고 있습니다'
    };
    
    return descriptions[interactionType] || '상호작용하고 있습니다';
  }

  private inferGestureContext(gestureType: GestureType, data: any): string {
    const contexts: Record<GestureType, string> = {
      'pointing': 'attention_directing',
      'waving': 'greeting_or_farewell',
      'clapping': 'celebration_or_approval',
      'hugging': 'affection_expression',
      'reaching': 'object_interaction',
      'jumping': 'excitement_or_play',
      'walking': 'movement_or_exploration',
      'running': 'high_energy_play',
      'sitting': 'rest_or_focus',
      'standing': 'attention_or_readiness',
      'dancing': 'joyful_expression',
      'high_five': 'celebration_or_encouragement',
      'holding_hands': 'connection_or_guidance',
      'giving': 'sharing_or_helping',
      'taking': 'receiving_or_accepting',
      'showing': 'communication_or_teaching',
      'unknown': 'general_activity'
    } as any;
    
    return contexts[gestureType] || 'unknown_context';
  }
} 