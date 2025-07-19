import { VideoIntelligenceResults } from '@/types';

// 고도화된 감정 분석 관련 타입 정의
export interface EnhancedEmotionAnalysis {
  overallEmotionalState: {
    parent: EmotionalProfile;
    child: EmotionalProfile;
  };
  emotionalTimeline: EmotionalTimelineAnalysis;
  emotionalInteraction: EmotionalInteractionAnalysis;
  emotionalDevelopment: EmotionalDevelopmentIndicators;
  emotionalRegulation: EmotionalRegulationAnalysis;
}

export interface EmotionalProfile {
  primaryEmotions: {
    joy: number;
    surprise: number;
    sadness: number;
    anger: number;
    fear: number;
    disgust: number;
    neutral: number;
  };
  secondaryEmotions: {
    excitement: number;
    contentment: number;
    frustration: number;
    curiosity: number;
    boredom: number;
    concentration: number;
    affection: number;
  };
  emotionalIntensity: number;
  emotionalStability: number;
  emotionalExpressiveness: number;
  emotionalConsistency: number;
}

export interface EmotionalTimelineAnalysis {
  timePoints: EmotionalTimePoint[];
  emotionalFluctuations: EmotionalFluctuation[];
  emotionalTransitions: EmotionalTransition[];
  peakEmotionalMoments: PeakEmotionalMoment[];
}

export interface EmotionalTimePoint {
  timestamp: number;
  parentEmotion: string;
  childEmotion: string;
  parentIntensity: number;
  childIntensity: number;
  synchrony: number;
  confidence: number;
}

export interface EmotionalFluctuation {
  person: 'parent' | 'child';
  startTime: number;
  endTime: number;
  fromEmotion: string;
  toEmotion: string;
  intensity: number;
  trigger?: string;
}

export interface EmotionalTransition {
  timestamp: number;
  person: 'parent' | 'child';
  transitionType: 'gradual' | 'sudden' | 'cyclic';
  emotionChain: string[];
  duration: number;
  stability: number;
}

export interface PeakEmotionalMoment {
  timestamp: number;
  emotion: string;
  person: 'parent' | 'child';
  intensity: number;
  duration: number;
  context: string;
  impact: number;
}

export interface EmotionalInteractionAnalysis {
  emotionalSynchrony: number;
  emotionalContagion: EmotionalContagionAnalysis;
  emotionalSupport: EmotionalSupportAnalysis;
  emotionalMirroring: EmotionalMirroringAnalysis;
  emotionalRegulation: EmotionalRegulationSupport;
}

export interface EmotionalContagionAnalysis {
  parentToChild: number;
  childToParent: number;
  bidirectional: number;
  emotionalSpread: {
    joy: number;
    excitement: number;
    frustration: number;
    calm: number;
  };
}

export interface EmotionalSupportAnalysis {
  parentSupport: {
    comforting: number;
    encouraging: number;
    validating: number;
    soothing: number;
  };
  childSupport: {
    affection: number;
    empathy: number;
    playfulness: number;
    responsiveness: number;
  };
}

export interface EmotionalMirroringAnalysis {
  facialMirroring: number;
  emotionalMirroring: number;
  behavioralMirroring: number;
  delayedMirroring: number;
  accuracyOfMirroring: number;
}

export interface EmotionalRegulationSupport {
  coRegulation: number;
  parentModeling: number;
  childSelfRegulation: number;
  regulationStrategies: string[];
  effectiveness: number;
}

export interface EmotionalDevelopmentIndicators {
  child: {
    emotionalRecognition: number;
    emotionalExpression: number;
    emotionalVocabulary: number;
    emotionalRegulation: number;
    socialEmotionalSkills: number;
    empathyDevelopment: number;
  };
  parent: {
    emotionalSensitivity: number;
    emotionalResponsiveness: number;
    emotionalGuidance: number;
    emotionalModeling: number;
  };
}

export interface EmotionalRegulationAnalysis {
  selfRegulation: {
    parent: SelfRegulationMetrics;
    child: SelfRegulationMetrics;
  };
  coRegulation: CoRegulationMetrics;
  regulationStrategies: RegulationStrategy[];
  regulationEffectiveness: number;
}

export interface SelfRegulationMetrics {
  emotionalControl: number;
  recoverySpeed: number;
  consistencyLevel: number;
  adaptability: number;
}

export interface CoRegulationMetrics {
  synchedRegulation: number;
  parentLeadRegulation: number;
  childInitiatedRegulation: number;
  mutualRegulation: number;
}

export interface RegulationStrategy {
  strategy: string;
  frequency: number;
  effectiveness: number;
  person: 'parent' | 'child' | 'both';
  context: string;
}

export class EnhancedEmotionAnalyzer {
  private readonly confidenceThreshold = 0.6;
  private readonly timeWindow = 5; // seconds
  private readonly emotionMappings = {
    // Google Cloud Vision 감정 매핑
    'joy': 'joy',
    'sorrow': 'sadness',
    'anger': 'anger',
    'surprise': 'surprise',
    'under_exposed': 'neutral',
    'blurred': 'neutral',
    'headwear': 'neutral',
    'very_likely': 1.0,
    'likely': 0.8,
    'possible': 0.6,
    'unlikely': 0.4,
    'very_unlikely': 0.2
  };

  /**
   * 종합적인 감정 분석 수행
   */
  async analyzeEnhancedEmotions(
    videoData: VideoIntelligenceResults,
    speechData?: any[]
  ): Promise<EnhancedEmotionAnalysis> {
    console.log('Starting enhanced emotion analysis...');
    
    // 1. 전체 감정 상태 분석
    const overallEmotionalState = await this.analyzeOverallEmotionalState(videoData);
    
    // 2. 감정 타임라인 분석
    const emotionalTimeline = await this.analyzeEmotionalTimeline(videoData);
    
    // 3. 감정 상호작용 분석
    const emotionalInteraction = await this.analyzeEmotionalInteraction(videoData, emotionalTimeline);
    
    // 4. 감정 발달 지표 분석
    const emotionalDevelopment = await this.analyzeEmotionalDevelopment(videoData, speechData);
    
    // 5. 감정 조절 분석
    const emotionalRegulation = await this.analyzeEmotionalRegulation(videoData, emotionalTimeline);
    
    console.log('Enhanced emotion analysis completed');
    
    return {
      overallEmotionalState,
      emotionalTimeline,
      emotionalInteraction,
      emotionalDevelopment,
      emotionalRegulation
    };
  }

  /**
   * 전체 감정 상태 분석
   */
  private async analyzeOverallEmotionalState(videoData: VideoIntelligenceResults): Promise<{
    parent: EmotionalProfile;
    child: EmotionalProfile;
  }> {
    const faceDetections = videoData.faceDetection || [];
    
    // 얼굴 감지 데이터를 부모/자녀로 분리
    const separatedFaces = this.separateFacesByAge(faceDetections);
    
    // 각자의 감정 프로필 생성
    const parentProfile = await this.createEmotionalProfile(separatedFaces.parent);
    const childProfile = await this.createEmotionalProfile(separatedFaces.child);
    
    return {
      parent: parentProfile,
      child: childProfile
    };
  }

  /**
   * 얼굴 감지 데이터를 연령대별로 분리
   */
  private separateFacesByAge(faceDetections: any[]): { parent: any[]; child: any[] } {
    const parent: any[] = [];
    const child: any[] = [];
    
    faceDetections.forEach(detection => {
      // 얼굴 크기와 위치를 기반으로 연령 추정
      const faceSize = this.calculateFaceSize(detection);
      const facePosition = this.calculateFacePosition(detection);
      
      // 휴리스틱: 더 큰 얼굴 = 부모, 작은 얼굴 = 자녀
      // 실제로는 더 정교한 분류 필요
      if (faceSize > 0.15 || facePosition.height < 0.6) {
        parent.push(detection);
      } else {
        child.push(detection);
      }
    });
    
    return { parent, child };
  }

  /**
   * 얼굴 크기 계산
   */
  private calculateFaceSize(detection: any): number {
    if (detection.boundingBox?.vertices) {
      const vertices = detection.boundingBox.vertices;
      const width = Math.abs(vertices[1].x - vertices[0].x);
      const height = Math.abs(vertices[2].y - vertices[1].y);
      return width * height;
    }
    return 0;
  }

  /**
   * 얼굴 위치 계산
   */
  private calculateFacePosition(detection: any): { x: number; y: number; width: number; height: number } {
    if (detection.boundingBox?.vertices) {
      const vertices = detection.boundingBox.vertices;
      return {
        x: vertices[0].x || 0,
        y: vertices[0].y || 0,
        width: Math.abs(vertices[1].x - vertices[0].x),
        height: Math.abs(vertices[2].y - vertices[1].y)
      };
    }
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  /**
   * 감정 프로필 생성
   */
  private async createEmotionalProfile(faceData: any[]): Promise<EmotionalProfile> {
    const primaryEmotions = {
      joy: 0,
      surprise: 0,
      sadness: 0,
      anger: 0,
      fear: 0,
      disgust: 0,
      neutral: 0
    };
    
    const secondaryEmotions = {
      excitement: 0,
      contentment: 0,
      frustration: 0,
      curiosity: 0,
      boredom: 0,
      concentration: 0,
      affection: 0
    };
    
    let totalIntensity = 0;
    let intensityCount = 0;
    const expressivenessMeasures: number[] = [];
    const consistencyMeasures: number[] = [];
    
    faceData.forEach(face => {
      if (face.attributes) {
        // 기본 감정 분석
        const emotions = this.extractEmotionsFromFace(face);
        Object.keys(emotions).forEach(emotion => {
          if ((primaryEmotions as Record<string, number>)[emotion] !== undefined) {
            (primaryEmotions as Record<string, number>)[emotion] += emotions[emotion];
          }
        });
        
        // 2차 감정 추론
        const secondaryEmotionScores = this.inferSecondaryEmotions(emotions);
        Object.keys(secondaryEmotionScores).forEach(emotion => {
          if ((secondaryEmotions as Record<string, number>)[emotion] !== undefined) {
            (secondaryEmotions as Record<string, number>)[emotion] += secondaryEmotionScores[emotion];
          }
        });
        
        // 감정 강도 계산
        const intensity = this.calculateEmotionalIntensity(emotions);
        totalIntensity += intensity;
        intensityCount++;
        
        // 표현력 측정
        const expressiveness = this.calculateExpressiveness(face.attributes);
        expressivenessMeasures.push(expressiveness);
        
        // 일관성 측정 (시간적 연속성)
        const consistency = this.calculateConsistency(emotions);
        consistencyMeasures.push(consistency);
      }
    });
    
    // 평균 계산
    const faceCount = faceData.length || 1;
    Object.keys(primaryEmotions).forEach(emotion => {
      (primaryEmotions as Record<string, number>)[emotion] /= faceCount;
    });
    
    Object.keys(secondaryEmotions).forEach(emotion => {
      (secondaryEmotions as Record<string, number>)[emotion] /= faceCount;
    });
    
    // 안정성 계산
    const emotionalStability = this.calculateEmotionalStability(primaryEmotions, faceData);
    
    return {
      primaryEmotions,
      secondaryEmotions,
      emotionalIntensity: intensityCount > 0 ? totalIntensity / intensityCount : 0,
      emotionalStability,
      emotionalExpressiveness: expressivenessMeasures.reduce((a, b) => a + b, 0) / expressivenessMeasures.length || 0,
      emotionalConsistency: consistencyMeasures.reduce((a, b) => a + b, 0) / consistencyMeasures.length || 0
    };
  }

  /**
   * 얼굴에서 감정 추출
   */
  private extractEmotionsFromFace(face: any): any {
    const emotions = {
      joy: 0,
      surprise: 0,
      sadness: 0,
      anger: 0,
      fear: 0,
      disgust: 0,
      neutral: 0
    };
    
    if (face.attributes) {
      // Google Cloud Vision API 형식에 맞춰 감정 추출
      if (face.attributes.joyLikelihood) {
        emotions.joy = this.convertLikelihoodToScore(face.attributes.joyLikelihood);
      }
      if (face.attributes.sorrowLikelihood) {
        emotions.sadness = this.convertLikelihoodToScore(face.attributes.sorrowLikelihood);
      }
      if (face.attributes.angerLikelihood) {
        emotions.anger = this.convertLikelihoodToScore(face.attributes.angerLikelihood);
      }
      if (face.attributes.surpriseLikelihood) {
        emotions.surprise = this.convertLikelihoodToScore(face.attributes.surpriseLikelihood);
      }
      
      // 중립 감정 계산 (다른 감정들의 역함수)
      const totalEmotions = emotions.joy + emotions.sadness + emotions.anger + emotions.surprise;
      emotions.neutral = Math.max(0, 1 - totalEmotions);
    }
    
    return emotions;
  }

  /**
   * 가능성을 점수로 변환
   */
  private convertLikelihoodToScore(likelihood: string): number {
    const likelihoodMap = {
      'VERY_LIKELY': 1.0,
      'LIKELY': 0.8,
      'POSSIBLE': 0.6,
      'UNLIKELY': 0.4,
      'VERY_UNLIKELY': 0.2
    };
    
    return (likelihoodMap as Record<string, number>)[likelihood] || 0;
  }

  /**
   * 2차 감정 추론
   */
  private inferSecondaryEmotions(primaryEmotions: any): any {
    const secondaryEmotions = {
      excitement: 0,
      contentment: 0,
      frustration: 0,
      curiosity: 0,
      boredom: 0,
      concentration: 0,
      affection: 0
    };
    
    // 기본 감정 조합을 통한 2차 감정 추론
    secondaryEmotions.excitement = (primaryEmotions.joy * 0.7 + primaryEmotions.surprise * 0.3);
    secondaryEmotions.contentment = (primaryEmotions.joy * 0.6 + primaryEmotions.neutral * 0.4);
    secondaryEmotions.frustration = (primaryEmotions.anger * 0.6 + primaryEmotions.sadness * 0.4);
    secondaryEmotions.curiosity = (primaryEmotions.surprise * 0.8 + primaryEmotions.neutral * 0.2);
    secondaryEmotions.boredom = (primaryEmotions.neutral * 0.8 + primaryEmotions.sadness * 0.2);
    secondaryEmotions.concentration = (primaryEmotions.neutral * 0.7 + primaryEmotions.surprise * 0.3);
    secondaryEmotions.affection = (primaryEmotions.joy * 0.8 + primaryEmotions.neutral * 0.2);
    
    return secondaryEmotions;
  }

  /**
   * 감정 강도 계산
   */
  private calculateEmotionalIntensity(emotions: any): number {
    const values = Object.values(emotions);
    const maxEmotion = Math.max(...values);
    const avgEmotion = values.reduce((a, b) => a + b, 0) / values.length;
    
    return (maxEmotion * 0.7 + avgEmotion * 0.3);
  }

  /**
   * 표현력 계산
   */
  private calculateExpressiveness(attributes: any): number {
    let expressiveness = 0;
    let factors = 0;
    
    // 얼굴 특성 기반 표현력 계산
    if (attributes.headwearLikelihood) {
      // 머리 장식물이 적을수록 표현력 높음
      expressiveness += (1 - this.convertLikelihoodToScore(attributes.headwearLikelihood)) * 0.2;
      factors++;
    }
    
    if (attributes.blurredLikelihood) {
      // 흐릿하지 않을수록 표현력 높음
      expressiveness += (1 - this.convertLikelihoodToScore(attributes.blurredLikelihood)) * 0.3;
      factors++;
    }
    
    if (attributes.underExposedLikelihood) {
      // 노출이 적절할수록 표현력 높음
      expressiveness += (1 - this.convertLikelihoodToScore(attributes.underExposedLikelihood)) * 0.5;
      factors++;
    }
    
    return factors > 0 ? expressiveness / factors : 0.5;
  }

  /**
   * 일관성 계산
   */
  private calculateConsistency(emotions: any): number {
    const values = Object.values(emotions);
    const maxEmotion = Math.max(...values);
    const variance = this.calculateVariance(values);
    
    // 낮은 분산과 높은 최대값 = 높은 일관성
    return Math.max(0, 1 - variance / maxEmotion);
  }

  /**
   * 분산 계산
   */
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.min(1, variance); // 정규화
  }

  /**
   * 감정 안정성 계산
   */
  private calculateEmotionalStability(emotions: any, faceData: any[]): number {
    if (faceData.length < 2) {return 1;}
    
    let stabilityScore = 0;
    let comparisons = 0;
    
    // 인접한 프레임 간 감정 변화 측정
    for (let i = 1; i < faceData.length; i++) {
      const prevEmotions = this.extractEmotionsFromFace(faceData[i - 1]);
      const currEmotions = this.extractEmotionsFromFace(faceData[i]);
      
      let emotionChange = 0;
      Object.keys(emotions).forEach(emotion => {
        emotionChange += Math.abs(currEmotions[emotion] - prevEmotions[emotion]);
      });
      
      stabilityScore += (1 - Math.min(1, emotionChange / 2));
      comparisons++;
    }
    
    return comparisons > 0 ? stabilityScore / comparisons : 1;
  }

  /**
   * 감정 타임라인 분석
   */
  private async analyzeEmotionalTimeline(videoData: VideoIntelligenceResults): Promise<EmotionalTimelineAnalysis> {
    const faceDetections = videoData.faceDetection || [];
    const separatedFaces = this.separateFacesByAge(faceDetections);
    
    // 시간 포인트 생성
    const timePoints = this.createEmotionalTimePoints(separatedFaces);
    
    // 감정 변동 분석
    const emotionalFluctuations = this.analyzeEmotionalFluctuations(timePoints);
    
    // 감정 전환 분석
    const emotionalTransitions = this.analyzeEmotionalTransitions(timePoints);
    
    // 감정 피크 분석
    const peakEmotionalMoments = this.analyzePeakEmotionalMoments(timePoints);
    
    return {
      timePoints,
      emotionalFluctuations,
      emotionalTransitions,
      peakEmotionalMoments
    };
  }

  /**
   * 감정 타임 포인트 생성
   */
  private createEmotionalTimePoints(separatedFaces: { parent: any[]; child: any[] }): EmotionalTimePoint[] {
    const timePoints: EmotionalTimePoint[] = [];
    const maxLength = Math.max(separatedFaces.parent.length, separatedFaces.child.length);
    
    for (let i = 0; i < maxLength; i++) {
      const parentFace = separatedFaces.parent[i];
      const childFace = separatedFaces.child[i];
      
      const parentEmotion = parentFace ? this.extractEmotionsFromFace(parentFace) : { neutral: 1 };
      const childEmotion = childFace ? this.extractEmotionsFromFace(childFace) : { neutral: 1 };
      
      const parentDominant = this.findDominantEmotion(parentEmotion);
      const childDominant = this.findDominantEmotion(childEmotion);
      
      // 감정 동조성 계산
      const synchrony = this.calculateEmotionalSynchrony(parentEmotion, childEmotion);
      
      timePoints.push({
        timestamp: i * 1.0, // 1초 간격 가정
        parentEmotion: parentDominant.emotion,
        childEmotion: childDominant.emotion,
        parentIntensity: parentDominant.intensity,
        childIntensity: childDominant.intensity,
        synchrony,
        confidence: Math.min(parentDominant.confidence, childDominant.confidence)
      });
    }
    
    return timePoints;
  }

  /**
   * 지배적 감정 찾기
   */
  private findDominantEmotion(emotions: any): { emotion: string; intensity: number; confidence: number } {
    let maxEmotion = 'neutral';
    let maxIntensity = 0;
    
    Object.keys(emotions).forEach(emotion => {
      if (emotions[emotion] > maxIntensity) {
        maxEmotion = emotion;
        maxIntensity = emotions[emotion];
      }
    });
    
    return {
      emotion: maxEmotion,
      intensity: maxIntensity,
      confidence: maxIntensity
    };
  }

  /**
   * 감정 동조성 계산
   */
  private calculateEmotionalSynchrony(parentEmotions: any, childEmotions: any): number {
    let synchrony = 0;
    let commonEmotions = 0;
    
    Object.keys(parentEmotions).forEach(emotion => {
      if (childEmotions[emotion] !== undefined) {
        // 감정 강도의 유사성 계산
        const similarity = 1 - Math.abs(parentEmotions[emotion] - childEmotions[emotion]);
        synchrony += similarity;
        commonEmotions++;
      }
    });
    
    return commonEmotions > 0 ? synchrony / commonEmotions : 0;
  }

  /**
   * 감정 변동 분석
   */
  private analyzeEmotionalFluctuations(timePoints: EmotionalTimePoint[]): EmotionalFluctuation[] {
    const fluctuations: EmotionalFluctuation[] = [];
    
    // 부모와 자녀 각각의 감정 변동 분석
    ['parent', 'child'].forEach(person => {
      let currentEmotion = person === 'parent' ? timePoints[0]?.parentEmotion : timePoints[0]?.childEmotion;
      let startTime = 0;
      
      for (let i = 1; i < timePoints.length; i++) {
        const emotion = person === 'parent' ? timePoints[i].parentEmotion : timePoints[i].childEmotion;
        const intensity = person === 'parent' ? timePoints[i].parentIntensity : timePoints[i].childIntensity;
        
        if (emotion !== currentEmotion) {
          fluctuations.push({
            person: person as 'parent' | 'child',
            startTime,
            endTime: timePoints[i].timestamp,
            fromEmotion: currentEmotion,
            toEmotion: emotion,
            intensity,
            trigger: this.inferEmotionalTrigger(currentEmotion, emotion)
          });
          
          currentEmotion = emotion;
          startTime = timePoints[i].timestamp;
        }
      }
    });
    
    return fluctuations;
  }

  /**
   * 감정 트리거 추론
   */
  private inferEmotionalTrigger(fromEmotion: string, toEmotion: string): string {
    const triggers = {
      'neutral_to_joy': 'positive_stimulus',
      'joy_to_neutral': 'activity_completion',
      'neutral_to_surprise': 'unexpected_event',
      'surprise_to_joy': 'pleasant_surprise',
      'joy_to_excitement': 'escalation',
      'excitement_to_neutral': 'calming_down',
      'neutral_to_concentration': 'task_focus',
      'concentration_to_satisfaction': 'task_completion'
    };
    
    const key = `${fromEmotion}_to_${toEmotion}`;
    return (triggers as Record<string, string>)[key] || 'unknown';
  }

  /**
   * 감정 전환 분석
   */
  private analyzeEmotionalTransitions(timePoints: EmotionalTimePoint[]): EmotionalTransition[] {
    const transitions: EmotionalTransition[] = [];
    
    // 감정 전환 패턴 분석
    ['parent', 'child'].forEach(person => {
      let emotionSequence: string[] = [];
      let startTime = 0;
      let currentEmotion = person === 'parent' ? timePoints[0]?.parentEmotion : timePoints[0]?.childEmotion;
      
      for (let i = 0; i < timePoints.length; i++) {
        const emotion = person === 'parent' ? timePoints[i].parentEmotion : timePoints[i].childEmotion;
        
        if (emotion !== currentEmotion || i === timePoints.length - 1) {
          emotionSequence.push(currentEmotion);
          
          if (emotionSequence.length >= 2) {
            const transitionType = this.classifyTransitionType(emotionSequence);
            const stability = this.calculateTransitionStability(emotionSequence);
            
            transitions.push({
              timestamp: startTime,
              person: person as 'parent' | 'child',
              transitionType,
              emotionChain: [...emotionSequence],
              duration: timePoints[i].timestamp - startTime,
              stability
            });
          }
          
          emotionSequence = [emotion];
          startTime = timePoints[i].timestamp;
          currentEmotion = emotion;
        }
      }
    });
    
    return transitions;
  }

  /**
   * 전환 타입 분류
   */
  private classifyTransitionType(emotionSequence: string[]): 'gradual' | 'sudden' | 'cyclic' {
    // 순환 패턴 감지
    const uniqueEmotions = new Set(emotionSequence);
    if (uniqueEmotions.size < emotionSequence.length * 0.7) {
      return 'cyclic';
    }
    
    // 급격한 변화 감지
    const emotionChanges = this.countEmotionChanges(emotionSequence);
    if (emotionChanges > emotionSequence.length * 0.6) {
      return 'sudden';
    }
    
    return 'gradual';
  }

  /**
   * 감정 변화 횟수 계산
   */
  private countEmotionChanges(emotionSequence: string[]): number {
    let changes = 0;
    for (let i = 1; i < emotionSequence.length; i++) {
      if (emotionSequence[i] !== emotionSequence[i - 1]) {
        changes++;
      }
    }
    return changes;
  }

  /**
   * 전환 안정성 계산
   */
  private calculateTransitionStability(emotionSequence: string[]): number {
    const changes = this.countEmotionChanges(emotionSequence);
    return Math.max(0, 1 - (changes / emotionSequence.length));
  }

  /**
   * 감정 피크 분석
   */
  private analyzePeakEmotionalMoments(timePoints: EmotionalTimePoint[]): PeakEmotionalMoment[] {
    const peaks: PeakEmotionalMoment[] = [];
    
    ['parent', 'child'].forEach(person => {
      const emotionHistory: { emotion: string; intensity: number; timestamp: number }[] = [];
      
      timePoints.forEach(point => {
        const emotion = person === 'parent' ? point.parentEmotion : point.childEmotion;
        const intensity = person === 'parent' ? point.parentIntensity : point.childIntensity;
        
        emotionHistory.push({
          emotion,
          intensity,
          timestamp: point.timestamp
        });
        
        // 윈도우 기반 피크 감지
        if (emotionHistory.length >= 5) {
          const windowData = emotionHistory.slice(-5);
          const peakMoment = this.findPeakInWindow(windowData);
          
          if (peakMoment && peakMoment.intensity > 0.7) {
            peaks.push({
              timestamp: peakMoment.timestamp,
              emotion: peakMoment.emotion,
              person: person as 'parent' | 'child',
              intensity: peakMoment.intensity,
              duration: 2, // 추정 지속 시간
              context: this.inferEmotionalContext(peakMoment.emotion),
              impact: this.calculateEmotionalImpact(peakMoment.intensity, peakMoment.emotion)
            });
          }
        }
      });
    });
    
    return peaks;
  }

  /**
   * 윈도우에서 피크 찾기
   */
  private findPeakInWindow(windowData: any[]): any {
    let maxIntensity = 0;
    let peakMoment = null;
    
    windowData.forEach(data => {
      if (data.intensity > maxIntensity) {
        maxIntensity = data.intensity;
        peakMoment = data;
      }
    });
    
    return peakMoment;
  }

  /**
   * 감정 맥락 추론
   */
  private inferEmotionalContext(emotion: string): string {
    const contexts = {
      'joy': 'positive_interaction',
      'excitement': 'engaging_activity',
      'surprise': 'unexpected_discovery',
      'concentration': 'focused_task',
      'affection': 'bonding_moment',
      'frustration': 'challenge_encounter',
      'neutral': 'calm_interaction'
    };
    
    return (contexts as Record<string, string>)[emotion] || 'general_interaction';
  }

  /**
   * 감정 임팩트 계산
   */
  private calculateEmotionalImpact(intensity: number, emotion: string): number {
    const emotionWeights = {
      'joy': 1.0,
      'excitement': 0.9,
      'surprise': 0.8,
      'affection': 1.0,
      'frustration': 0.7,
      'sadness': 0.6,
      'anger': 0.5,
      'neutral': 0.3
    };
    
    const weight = (emotionWeights as Record<string, number>)[emotion] || 0.5;
    return intensity * weight;
  }

  /**
   * 감정 상호작용 분석
   */
  private async analyzeEmotionalInteraction(
    videoData: VideoIntelligenceResults,
    timelineAnalysis: EmotionalTimelineAnalysis
  ): Promise<EmotionalInteractionAnalysis> {
    // 감정 동조성 분석
    const emotionalSynchrony = this.calculateOverallSynchrony(timelineAnalysis.timePoints);
    
    // 감정 전염 분석
    const emotionalContagion = this.analyzeEmotionalContagion(timelineAnalysis.timePoints);
    
    // 감정 지원 분석
    const emotionalSupport = this.analyzeEmotionalSupport(timelineAnalysis.emotionalFluctuations);
    
    // 감정 미러링 분석
    const emotionalMirroring = this.analyzeEmotionalMirroring(timelineAnalysis.timePoints);
    
    // 감정 조절 지원 분석
    const emotionalRegulation = this.analyzeEmotionalRegulationSupport(timelineAnalysis.emotionalFluctuations);
    
    return {
      emotionalSynchrony,
      emotionalContagion,
      emotionalSupport,
      emotionalMirroring,
      emotionalRegulation
    };
  }

  /**
   * 전체 동조성 계산
   */
  private calculateOverallSynchrony(timePoints: EmotionalTimePoint[]): number {
    const synchronyValues = timePoints.map(point => point.synchrony);
    return synchronyValues.reduce((a, b) => a + b, 0) / synchronyValues.length || 0;
  }

  /**
   * 감정 전염 분석
   */
  private analyzeEmotionalContagion(timePoints: EmotionalTimePoint[]): EmotionalContagionAnalysis {
    let parentToChildContagion = 0;
    let childToParentContagion = 0;
    let bidirectionalContagion = 0;
    
    const emotionalSpread = {
      joy: 0,
      excitement: 0,
      frustration: 0,
      calm: 0
    };
    
    // 감정 전염 패턴 분석
    for (let i = 1; i < timePoints.length; i++) {
      const prev = timePoints[i - 1];
      const curr = timePoints[i];
      
      // 부모 → 자녀 전염
      if (prev.parentEmotion === curr.childEmotion && prev.parentEmotion !== prev.childEmotion) {
        parentToChildContagion++;
        if ((emotionalSpread as Record<string, number>)[prev.parentEmotion]) {
          (emotionalSpread as Record<string, number>)[prev.parentEmotion]++;
        }
      }
      
      // 자녀 → 부모 전염
      if (prev.childEmotion === curr.parentEmotion && prev.childEmotion !== prev.parentEmotion) {
        childToParentContagion++;
        if ((emotionalSpread as Record<string, number>)[prev.childEmotion]) {
          (emotionalSpread as Record<string, number>)[prev.childEmotion]++;
        }
      }
      
      // 양방향 전염
      if (prev.parentEmotion === curr.childEmotion && prev.childEmotion === curr.parentEmotion) {
        bidirectionalContagion++;
      }
    }
    
    const totalPoints = timePoints.length;
    
    return {
      parentToChild: parentToChildContagion / totalPoints,
      childToParent: childToParentContagion / totalPoints,
      bidirectional: bidirectionalContagion / totalPoints,
      emotionalSpread
    };
  }

  /**
   * 감정 지원 분석
   */
  private analyzeEmotionalSupport(fluctuations: EmotionalFluctuation[]): EmotionalSupportAnalysis {
    const parentSupport = {
      comforting: 0,
      encouraging: 0,
      validating: 0,
      soothing: 0
    };
    
    const childSupport = {
      affection: 0,
      empathy: 0,
      playfulness: 0,
      responsiveness: 0
    };
    
    fluctuations.forEach(fluctuation => {
      if (fluctuation.person === 'parent') {
        // 부모의 지원적 감정 변화
        if (fluctuation.toEmotion === 'joy' && fluctuation.fromEmotion === 'neutral') {
          parentSupport.encouraging++;
        }
        if (fluctuation.toEmotion === 'contentment' && fluctuation.fromEmotion === 'concern') {
          parentSupport.comforting++;
        }
        if (fluctuation.toEmotion === 'affection') {
          parentSupport.validating++;
        }
      } else {
        // 자녀의 지원적 감정 변화
        if (fluctuation.toEmotion === 'joy') {
          childSupport.playfulness++;
        }
        if (fluctuation.toEmotion === 'affection') {
          childSupport.affection++;
        }
        if (fluctuation.trigger === 'response_to_parent') {
          childSupport.responsiveness++;
        }
      }
    });
    
    return {
      parentSupport,
      childSupport
    };
  }

  /**
   * 감정 미러링 분석
   */
  private analyzeEmotionalMirroring(timePoints: EmotionalTimePoint[]): EmotionalMirroringAnalysis {
    let facialMirroring = 0;
    let emotionalMirroring = 0;
    const behavioralMirroring = 0;
    let delayedMirroring = 0;
    let totalAccuracy = 0;
    
    for (let i = 0; i < timePoints.length; i++) {
      const point = timePoints[i];
      
      // 즉시 미러링
      if (point.parentEmotion === point.childEmotion) {
        emotionalMirroring++;
        facialMirroring += point.synchrony;
      }
      
      // 지연 미러링 (1-2초 후)
      if (i >= 2) {
        const prevPoint = timePoints[i - 2];
        if (prevPoint.parentEmotion === point.childEmotion || prevPoint.childEmotion === point.parentEmotion) {
          delayedMirroring++;
        }
      }
      
      // 미러링 정확도
      totalAccuracy += point.synchrony;
    }
    
    const totalPoints = timePoints.length;
    
    return {
      facialMirroring: facialMirroring / totalPoints,
      emotionalMirroring: emotionalMirroring / totalPoints,
      behavioralMirroring: behavioralMirroring / totalPoints, // 추후 제스처 데이터로 계산
      delayedMirroring: delayedMirroring / totalPoints,
      accuracyOfMirroring: totalAccuracy / totalPoints
    };
  }

  /**
   * 감정 조절 지원 분석
   */
  private analyzeEmotionalRegulationSupport(fluctuations: EmotionalFluctuation[]): EmotionalRegulationSupport {
    let coRegulation = 0;
    let parentModeling = 0;
    let childSelfRegulation = 0;
    const regulationStrategies: string[] = [];
    
    fluctuations.forEach(fluctuation => {
      // 공동 조절 (부모-자녀 함께)
      if (fluctuation.trigger === 'mutual_regulation') {
        coRegulation++;
        regulationStrategies.push('co_regulation');
      }
      
      // 부모 모델링 (부모가 먼저 조절)
      if (fluctuation.person === 'parent' && fluctuation.toEmotion === 'neutral') {
        parentModeling++;
        regulationStrategies.push('parent_modeling');
      }
      
      // 자녀 자기 조절
      if (fluctuation.person === 'child' && fluctuation.toEmotion === 'neutral') {
        childSelfRegulation++;
        regulationStrategies.push('self_regulation');
      }
    });
    
    const totalRegulationEvents = coRegulation + parentModeling + childSelfRegulation;
    const effectiveness = totalRegulationEvents / fluctuations.length;
    
    return {
      coRegulation: coRegulation / fluctuations.length,
      parentModeling: parentModeling / fluctuations.length,
      childSelfRegulation: childSelfRegulation / fluctuations.length,
      regulationStrategies: Array.from(new Set(regulationStrategies)),
      effectiveness
    };
  }

  /**
   * 감정 발달 지표 분석
   */
  private async analyzeEmotionalDevelopment(
    videoData: VideoIntelligenceResults,
    speechData?: any[]
  ): Promise<EmotionalDevelopmentIndicators> {
    const faceDetections = videoData.faceDetection || [];
    const separatedFaces = this.separateFacesByAge(faceDetections);
    
    // 자녀 감정 발달 지표
    const child = await this.analyzeChildEmotionalDevelopment(separatedFaces.child, speechData);
    
    // 부모 감정 지원 지표
    const parent = await this.analyzeParentEmotionalSupport(separatedFaces.parent, speechData);
    
    return {
      child,
      parent
    };
  }

  /**
   * 자녀 감정 발달 분석
   */
  private async analyzeChildEmotionalDevelopment(childFaces: any[], speechData?: any[]): Promise<any> {
    const emotionRecognition = this.calculateEmotionRecognition(childFaces);
    const emotionExpression = this.calculateEmotionExpression(childFaces);
    const emotionVocabulary = this.calculateEmotionVocabulary(speechData);
    const emotionRegulation = this.calculateEmotionRegulation(childFaces);
    const socialEmotionalSkills = this.calculateSocialEmotionalSkills(childFaces);
    const empathyDevelopment = this.calculateEmpathyDevelopment(childFaces);
    
    return {
      emotionalRecognition: emotionRecognition,
      emotionalExpression: emotionExpression,
      emotionalVocabulary: emotionVocabulary,
      emotionalRegulation: emotionRegulation,
      socialEmotionalSkills,
      empathyDevelopment
    };
  }

  /**
   * 부모 감정 지원 분석
   */
  private async analyzeParentEmotionalSupport(parentFaces: any[], speechData?: any[]): Promise<any> {
    const emotionalSensitivity = this.calculateEmotionalSensitivity(parentFaces);
    const emotionalResponsiveness = this.calculateEmotionalResponsiveness(parentFaces);
    const emotionalGuidance = this.calculateEmotionalGuidance(speechData);
    const emotionalModeling = this.calculateEmotionalModeling(parentFaces);
    
    return {
      emotionalSensitivity,
      emotionalResponsiveness,
      emotionalGuidance,
      emotionalModeling
    };
  }

  // 감정 발달 지표 계산 메서드들 (간소화된 버전)
  private calculateEmotionRecognition(faces: any[]): number {
    // 다양한 감정 인식 능력 측정
    const emotionTypes = new Set();
    faces.forEach(face => {
      const emotions = this.extractEmotionsFromFace(face);
      Object.keys(emotions).forEach(emotion => {
        if (emotions[emotion] > 0.5) {
          emotionTypes.add(emotion);
        }
      });
    });
    
    return Math.min(100, emotionTypes.size * 15);
  }

  private calculateEmotionExpression(faces: any[]): number {
    let totalExpression = 0;
    faces.forEach(face => {
      totalExpression += this.calculateExpressiveness(face.attributes || {});
    });
    
    return faces.length > 0 ? (totalExpression / faces.length) * 100 : 0;
  }

  private calculateEmotionVocabulary(speechData?: any[]): number {
    if (!speechData) {return 50;} // 기본값
    
    const emotionWords = ['기쁜', '슬픈', '화난', '놀란', '무서운', '좋아', '싫어', '재미있는'];
    let foundWords = 0;
    
    speechData.forEach(segment => {
      const text = segment.alternatives?.[0]?.transcript || '';
      emotionWords.forEach(word => {
        if (text.includes(word)) {
          foundWords++;
        }
      });
    });
    
    return Math.min(100, foundWords * 12);
  }

  private calculateEmotionRegulation(faces: any[]): number {
    // 감정 조절 능력 측정 (간소화)
    const stability = this.calculateEmotionalStability({}, faces);
    return stability * 100;
  }

  private calculateSocialEmotionalSkills(faces: any[]): number {
    // 사회적 감정 기술 측정
    return 70 + Math.random() * 30; // 임시 구현
  }

  private calculateEmpathyDevelopment(faces: any[]): number {
    // 공감 능력 발달 측정
    return 65 + Math.random() * 35; // 임시 구현
  }

  private calculateEmotionalSensitivity(faces: any[]): number {
    // 부모의 감정 민감도 측정
    return 75 + Math.random() * 25; // 임시 구현
  }

  private calculateEmotionalResponsiveness(faces: any[]): number {
    // 부모의 감정 반응성 측정
    return 80 + Math.random() * 20; // 임시 구현
  }

  private calculateEmotionalGuidance(speechData?: any[]): number {
    // 부모의 감정 지도 능력 측정
    if (!speechData) {return 70;}
    
    const guidanceWords = ['괜찮아', '좋아', '잘했어', '천천히', '함께', '도와줄게'];
    let foundWords = 0;
    
    speechData.forEach(segment => {
      const text = segment.alternatives?.[0]?.transcript || '';
      guidanceWords.forEach(word => {
        if (text.includes(word)) {
          foundWords++;
        }
      });
    });
    
    return Math.min(100, 60 + foundWords * 8);
  }

  private calculateEmotionalModeling(faces: any[]): number {
    // 부모의 감정 모델링 능력 측정
    return 85 + Math.random() * 15; // 임시 구현
  }

  /**
   * 감정 조절 분석
   */
  private async analyzeEmotionalRegulation(
    videoData: VideoIntelligenceResults,
    timelineAnalysis: EmotionalTimelineAnalysis
  ): Promise<EmotionalRegulationAnalysis> {
    // 자기 조절 분석
    const selfRegulation = {
      parent: this.analyzeSelfRegulation(timelineAnalysis.timePoints, 'parent'),
      child: this.analyzeSelfRegulation(timelineAnalysis.timePoints, 'child')
    };
    
    // 공동 조절 분석
    const coRegulation = this.analyzeCoRegulation(timelineAnalysis.timePoints);
    
    // 조절 전략 분석
    const regulationStrategies = this.analyzeRegulationStrategies(timelineAnalysis.emotionalFluctuations);
    
    // 조절 효과성 분석
    const regulationEffectiveness = this.calculateRegulationEffectiveness(regulationStrategies);
    
    return {
      selfRegulation,
      coRegulation,
      regulationStrategies,
      regulationEffectiveness
    };
  }

  /**
   * 자기 조절 분석
   */
  private analyzeSelfRegulation(timePoints: EmotionalTimePoint[], person: 'parent' | 'child'): SelfRegulationMetrics {
    const emotions = timePoints.map(point => 
      person === 'parent' ? point.parentEmotion : point.childEmotion
    );
    
    const intensities = timePoints.map(point => 
      person === 'parent' ? point.parentIntensity : point.childIntensity
    );
    
    // 감정 조절 능력 계산
    const emotionalControl = this.calculateEmotionalControl(emotions, intensities);
    const recoverySpeed = this.calculateRecoverySpeed(emotions, intensities);
    const consistencyLevel = this.calculateConsistencyLevel(emotions);
    const adaptability = this.calculateAdaptability(emotions);
    
    return {
      emotionalControl,
      recoverySpeed,
      consistencyLevel,
      adaptability
    };
  }

  /**
   * 공동 조절 분석
   */
  private analyzeCoRegulation(timePoints: EmotionalTimePoint[]): CoRegulationMetrics {
    let synchedRegulation = 0;
    let parentLeadRegulation = 0;
    let childInitiatedRegulation = 0;
    let mutualRegulation = 0;
    
    for (let i = 1; i < timePoints.length; i++) {
      const prev = timePoints[i - 1];
      const curr = timePoints[i];
      
      // 동시 조절
      if (prev.synchrony > 0.8 && curr.synchrony > 0.8) {
        synchedRegulation++;
      }
      
      // 부모 주도 조절
      if (prev.parentEmotion === 'neutral' && curr.childEmotion === 'neutral') {
        parentLeadRegulation++;
      }
      
      // 자녀 주도 조절
      if (prev.childEmotion === 'neutral' && curr.parentEmotion === 'neutral') {
        childInitiatedRegulation++;
      }
      
      // 상호 조절
      if (prev.synchrony < 0.5 && curr.synchrony > 0.8) {
        mutualRegulation++;
      }
    }
    
    const totalPoints = timePoints.length;
    
    return {
      synchedRegulation: synchedRegulation / totalPoints,
      parentLeadRegulation: parentLeadRegulation / totalPoints,
      childInitiatedRegulation: childInitiatedRegulation / totalPoints,
      mutualRegulation: mutualRegulation / totalPoints
    };
  }

  /**
   * 조절 전략 분석
   */
  private analyzeRegulationStrategies(fluctuations: EmotionalFluctuation[]): RegulationStrategy[] {
    const strategies: RegulationStrategy[] = [];
    
    fluctuations.forEach(fluctuation => {
      if (fluctuation.toEmotion === 'neutral' || fluctuation.toEmotion === 'contentment') {
        strategies.push({
          strategy: this.identifyRegulationStrategy(fluctuation),
          frequency: 1,
          effectiveness: this.calculateStrategyEffectiveness(fluctuation),
          person: fluctuation.person,
          context: fluctuation.trigger || 'unknown'
        });
      }
    });
    
    return strategies;
  }

  /**
   * 조절 전략 식별
   */
  private identifyRegulationStrategy(fluctuation: EmotionalFluctuation): string {
    const strategies = {
      'anger_to_neutral': 'calming_down',
      'frustration_to_neutral': 'problem_solving',
      'excitement_to_neutral': 'self_soothing',
      'sadness_to_neutral': 'comfort_seeking',
      'surprise_to_neutral': 'processing'
    };
    
    const key = `${fluctuation.fromEmotion}_to_${fluctuation.toEmotion}`;
    return (strategies as Record<string, string>)[key] || 'general_regulation';
  }

  /**
   * 전략 효과성 계산
   */
  private calculateStrategyEffectiveness(fluctuation: EmotionalFluctuation): number {
    const duration = fluctuation.endTime - fluctuation.startTime;
    const intensity = fluctuation.intensity;
    
    // 짧은 시간에 강한 변화 = 높은 효과성
    return Math.min(1, intensity / (duration + 1));
  }

  /**
   * 조절 효과성 계산
   */
  private calculateRegulationEffectiveness(strategies: RegulationStrategy[]): number {
    if (strategies.length === 0) {return 0;}
    
    const totalEffectiveness = strategies.reduce((sum, strategy) => sum + strategy.effectiveness, 0);
    return totalEffectiveness / strategies.length;
  }

  // 자기 조절 메트릭 계산 헬퍼 메서드들
  private calculateEmotionalControl(emotions: string[], intensities: number[]): number {
    let controlScore = 0;
    let controlEvents = 0;
    
    for (let i = 1; i < emotions.length; i++) {
      if (emotions[i] === 'neutral' && emotions[i-1] !== 'neutral') {
        controlScore += (1 - intensities[i-1]); // 높은 강도에서 조절은 더 어려움
        controlEvents++;
      }
    }
    
    return controlEvents > 0 ? controlScore / controlEvents : 0;
  }

  private calculateRecoverySpeed(emotions: string[], intensities: number[]): number {
    const recoveryTimes: number[] = [];
    
    for (let i = 0; i < emotions.length; i++) {
      if (emotions[i] !== 'neutral' && emotions[i] !== 'contentment') {
        // 회복 시간 찾기
        for (let j = i + 1; j < emotions.length; j++) {
          if (emotions[j] === 'neutral' || emotions[j] === 'contentment') {
            recoveryTimes.push(j - i);
            break;
          }
        }
      }
    }
    
    if (recoveryTimes.length === 0) {return 0;}
    
    const avgRecoveryTime = recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length;
    return Math.max(0, 1 - (avgRecoveryTime / 10)); // 정규화
  }

  private calculateConsistencyLevel(emotions: string[]): number {
    const emotionCounts: Record<string, number> = {};
    emotions.forEach(emotion => {
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    });
    
    const dominantEmotion = Object.keys(emotionCounts).reduce((a, b) => 
      emotionCounts[a] > emotionCounts[b] ? a : b
    );
    
    return emotionCounts[dominantEmotion] / emotions.length;
  }

  private calculateAdaptability(emotions: string[]): number {
    const uniqueEmotions = new Set(emotions);
    const adaptabilityScore = uniqueEmotions.size / 7; // 7개 기본 감정 기준
    
    return Math.min(1, adaptabilityScore);
  }
} 