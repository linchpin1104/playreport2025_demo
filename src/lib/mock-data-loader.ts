import { VideoIntelligenceResults } from '@/types';
import sampleAnalysis from './mock-data/sample-analysis.json';

// 개발 모드 확인
export const isDevelopmentMode = () => {
  // 브라우저 환경에서는 localStorage와 전역 변수도 확인
  if (typeof window !== 'undefined') {
    const localStorageDevMode = localStorage.getItem('devMode') === 'true';
    const globalDevMode = (window as any).__DEV_MODE__ === true;
    
    if (localStorageDevMode || globalDevMode) {
      return true;
    }
  }
  
  // 서버 환경에서는 환경 변수 확인
  return process.env.USE_MOCK_DATA === 'true' || process.env.NODE_ENV === 'development';
};

// Mock 업로드 데이터 생성
export const getMockUploadData = () => {
  return {
    success: true,
    fileName: 'sample-video.mp4',
    originalName: 'sample-video.mp4',
    fileSize: 15000000, // 15MB
    contentType: 'video/mp4',
    gsUri: 'gs://mock-bucket/sample-video.mp4',
    uploadUrl: 'https://mock-storage.googleapis.com/upload',
  };
};

// Mock 분석 결과 데이터 반환
export const getMockAnalysisData = (): VideoIntelligenceResults => {
  // 실제 JSON 파일에서 analysisResults 부분만 추출
  const mockData = sampleAnalysis as any;
  
  return {
    objectTracking: mockData.analysisResults?.objectTracking || [],
    speechTranscription: mockData.analysisResults?.speechTranscription || [],
    faceDetection: mockData.analysisResults?.faceDetection || [],
    personDetection: mockData.analysisResults?.personDetection || [],
    shotChanges: mockData.analysisResults?.shotChanges || [],
    explicitContent: mockData.analysisResults?.explicitContent || [],
  };
};

// Mock 상세 분석 결과 생성
export const getMockDetailedAnalysis = () => {
  return {
    emotionalAnalysis: {
      smilingDetections: 45,
      lookingAtCameraDetections: 23,
      childSmilingRatio: 78.5,
      childSmilingFrames: 157,
      totalChildFrames: 200,
    },
    spatialAnalysis: {
      averageDistance: 0.245,
      minDistance: 0.089,
      maxDistance: 0.678,
      proximityRatio: 67.3,
      distanceOverTime: [
        { timeOffset: '0s', distance: 0.234 },
        { timeOffset: '5s', distance: 0.198 },
        { timeOffset: '10s', distance: 0.156 },
        { timeOffset: '15s', distance: 0.203 },
        { timeOffset: '20s', distance: 0.267 },
      ],
    },
    activityAnalysis: {
      childActivityLevel: 'dynamic' as const,
      movementScore: 18.7,
      averageMovementPerSecond: 0.087,
      movementFrames: 134,
      totalFrames: 200,
    },
    interactionAnalysis: {
      toyInteractionRatio: 42.5,
      toyInteractionFrames: 85,
      totalPlayFrames: 200,
      detectedToys: ['ball', 'blocks', 'doll', 'car'],
      interactionPeaks: [
        { timeOffset: '8s', intensity: 0.89 },
        { timeOffset: '25s', intensity: 0.76 },
        { timeOffset: '41s', intensity: 0.92 },
      ],
    },
    optimalPlayTime: {
      bestPeriods: [
        { startTime: '5s', endTime: '15s', score: 92, reason: '높은 웃음 비율, 적절한 거리 유지' },
        { startTime: '35s', endTime: '45s', score: 88, reason: '활발한 활동, 장난감 상호작용' },
      ],
      overallEngagementScore: 87,
    },
  };
};

// Mock AI 레포트 생성
export const getMockAIReport = () => {
  return {
    success: true,
    analysis: {
      summary: "Mock 분석 결과: 아이와 부모 간의 활발한 상호작용이 관찰되었습니다. 특히 놀이 도구를 활용한 협력적 놀이 패턴이 두드러졌습니다.",
      insights: {
        interactionQuality: 87,
        parentEngagement: 92,
        childEngagement: 83,
        communicationPatterns: [
          {
            type: 'verbal' as const,
            frequency: 22,
            duration: 66,
            initiator: 'parent' as const,
            timeSegments: [{ startTimeOffset: "0s", endTimeOffset: "60s" }]
          }
        ],
        emotionalStates: [
          {
            emotion: 'joy' as const,
            intensity: 85,
            duration: 45,
            person: 'child' as const,
            timeSegments: [{ startTimeOffset: "0s", endTimeOffset: "45s" }]
          }
        ],
        playPatterns: [
          {
            type: 'collaborative' as const,
            duration: 120,
            objects: ['ball', 'blocks', 'doll'],
            timeSegments: [{ startTimeOffset: "0s", endTimeOffset: "120s" }]
          }
        ]
      },
      recommendations: [
        "더 많은 언어적 격려를 통해 아이의 자신감을 높여보세요.",
        "다양한 놀이 도구를 순환적으로 사용해보세요.",
        "아이의 주도적인 놀이를 더 많이 격려해보세요.",
        "긍정적인 피드백을 지속적으로 제공해보세요."
      ],
      developmentIndicators: {
        language: {
          score: 78,
          observations: ["활발한 언어 표현", "적절한 어휘 사용"],
          recommendations: ["더 많은 대화 시간 확보", "새로운 어휘 도입"]
        },
        social: {
          score: 85,
          observations: ["좋은 눈맞춤", "사회적 신호 이해"],
          recommendations: ["다른 아이들과의 상호작용 기회 제공"]
        },
        cognitive: {
          score: 82,
          observations: ["문제 해결 능력", "창의적 사고"],
          recommendations: ["다양한 퍼즐 활동 도입"]
        },
        motor: {
          score: 79,
          observations: ["균형 잡힌 대근육 발달", "정밀한 소근육 조작"],
          recommendations: ["더 많은 신체 활동 기회 제공"]
        },
        emotional: {
          score: 88,
          observations: ["안정된 감정 조절", "긍정적 표현"],
          recommendations: ["감정 표현 어휘 확장"]
        }
      },
      visualizations: []
    },
    metadata: {
      childAge: 4,
      parentGender: 'female',
      playType: 'free-play',
      generatedAt: new Date().toISOString(),
      analysisVersion: '2.0-mock'
    }
  };
};

// 개발 모드 상태 로깅
export const logDevelopmentMode = (component: string) => {
  if (isDevelopmentMode()) {
    console.log(`🚀 [개발 모드] ${component}: Mock 데이터 사용 중`);
  }
}; 