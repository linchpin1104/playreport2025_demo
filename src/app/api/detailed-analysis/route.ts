import { NextRequest, NextResponse } from 'next/server';
import { VideoIntelligenceResults } from '@/types';
import { isDevelopmentMode, getMockDetailedAnalysis, logDevelopmentMode } from '@/lib/mock-data-loader';

// 상세한 놀이 상호작용 분석 결과 타입
interface DetailedPlayAnalysis {
  emotionalAnalysis: {
    smilingDetections: number;
    lookingAtCameraDetections: number;
    childSmilingRatio: number;
    childSmilingFrames: number;
    totalChildFrames: number;
  };
  spatialAnalysis: {
    averageDistance: number;
    minDistance: number;
    maxDistance: number;
    proximityRatio: number; // 가까운 거리 비율
    distanceOverTime: Array<{
      timeOffset: string;
      distance: number;
    }>;
  };
  activityAnalysis: {
    childActivityLevel: 'static' | 'dynamic' | 'moderate';
    movementScore: number;
    averageMovementPerSecond: number;
    movementFrames: number;
    totalFrames: number;
  };
  interactionAnalysis: {
    toyInteractionRatio: number;
    toyInteractionFrames: number;
    totalPlayFrames: number;
    detectedToys: string[];
    interactionPeaks: Array<{
      timeOffset: string;
      intensity: number;
    }>;
  };
  optimalPlayTime: {
    bestPeriods: Array<{
      startTime: string;
      endTime: string;
      score: number;
      reason: string;
    }>;
    overallEngagementScore: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    // 개발 모드 체크
    if (isDevelopmentMode()) {
      logDevelopmentMode('Detailed Analysis API');
      
      // Mock 데이터 반환 (실제 상세 분석 없이 바로 성공 응답)
      const mockDetailedAnalysis = getMockDetailedAnalysis();
      
      // 실제 분석 시간을 시뮬레이션 (짧게)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return NextResponse.json({
        success: true,
        detailedAnalysis: mockDetailedAnalysis,
        metadata: {
          analysisType: 'detailed-play-interaction',
          processedAt: new Date().toISOString(),
          mode: 'development'
        },
      });
    }

    const body = await request.json();
    const { analysisResults, metadata } = body;

    if (!analysisResults) {
      return NextResponse.json(
        { success: false, error: '분석 결과가 제공되지 않았습니다.' },
        { status: 400 }
      );
    }

    console.log('Starting detailed play analysis...');

    // 상세한 놀이 분석 수행
    const detailedAnalysis = await performDetailedPlayAnalysis(analysisResults);

    console.log('Detailed play analysis completed');

    return NextResponse.json({
      success: true,
      detailedAnalysis,
      metadata: {
        ...metadata,
        analysisType: 'detailed-play-interaction',
        processedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Detailed analysis error:', error);
    
    return NextResponse.json(
      { success: false, error: '상세 분석 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

async function performDetailedPlayAnalysis(results: VideoIntelligenceResults): Promise<DetailedPlayAnalysis> {
  // 1. 감정 분석 (웃는 표정, 카메라 응시)
  const emotionalAnalysis = analyzeEmotionalAttributes(results);
  
  // 2. 공간 분석 (부모-아이 거리)
  const spatialAnalysis = analyzeSpatialProximity(results);
  
  // 3. 활동성 분석 (아이의 움직임)
  const activityAnalysis = analyzeChildActivity(results);
  
  // 4. 상호작용 분석 (장난감 상호작용)
  const interactionAnalysis = analyzeToyInteraction(results);
  
  // 5. 최적 놀이 시간 분석
  const optimalPlayTime = analyzeOptimalPlayTime(results, emotionalAnalysis, spatialAnalysis, activityAnalysis);

  return {
    emotionalAnalysis,
    spatialAnalysis,
    activityAnalysis,
    interactionAnalysis,
    optimalPlayTime,
  };
}

// 1. 감정 분석: 웃는 표정과 카메라 응시 감지
function analyzeEmotionalAttributes(results: VideoIntelligenceResults) {
  let smilingDetections = 0;
  let lookingAtCameraDetections = 0;
  let childSmilingFrames = 0;
  let totalChildFrames = 0;

  // Person Detection 데이터에서 감정 속성 추출
  results.personDetection?.forEach(person => {
    person.tracks?.forEach(track => {
      track.timestampedObjects?.forEach(obj => {
        totalChildFrames++;
        
        // 속성 확인
        obj.attributes?.forEach(attr => {
          if (attr.name === 'smiling' && attr.value === 'true') {
            smilingDetections++;
            childSmilingFrames++;
          }
          if (attr.name === 'looking_at_camera' && attr.value === 'true') {
            lookingAtCameraDetections++;
          }
        });
      });
    });
  });

  // Face Detection 데이터에서 감정 속성 추출
  results.faceDetection?.forEach(faceAnnotation => {
    faceAnnotation.tracks?.forEach(track => {
      track.timestampedObjects?.forEach(obj => {
        obj.attributes?.forEach((attr: any) => {
          if (attr.name === 'smiling' && attr.value === 'true') {
            smilingDetections++;
          }
          if (attr.name === 'looking_at_camera' && attr.value === 'true') {
            lookingAtCameraDetections++;
          }
        });
      });
    });
  });

  const childSmilingRatio = totalChildFrames > 0 ? (childSmilingFrames / totalChildFrames) * 100 : 0;

  return {
    smilingDetections,
    lookingAtCameraDetections,
    childSmilingRatio,
    childSmilingFrames,
    totalChildFrames,
  };
}

// 2. 공간 분석: 부모와 아이의 거리 분석
function analyzeSpatialProximity(results: VideoIntelligenceResults) {
  const distances: Array<{ timeOffset: string; distance: number }> = [];
  const personObjects = results.objectTracking?.filter(obj => obj.entity?.description === 'person') || [];
  
  if (personObjects.length >= 2) {
    const parent = personObjects[0];
    const child = personObjects[1];
    
    // 각 프레임에서 거리 계산
    parent.frames?.forEach((parentFrame, index) => {
      const childFrame = child.frames?.[index];
      if (childFrame) {
        const parentCenter = getBoundingBoxCenter(parentFrame.normalizedBoundingBox);
        const childCenter = getBoundingBoxCenter(childFrame.normalizedBoundingBox);
        
        const distance = calculateDistance(parentCenter, childCenter);
        distances.push({
          timeOffset: parentFrame.timeOffset || `${index}s`,
          distance,
        });
      }
    });
  }

  const distanceValues = distances.map(d => d.distance);
  const averageDistance = distanceValues.length > 0 ? distanceValues.reduce((a, b) => a + b, 0) / distanceValues.length : 0;
  const minDistance = Math.min(...distanceValues);
  const maxDistance = Math.max(...distanceValues);
  
  // 가까운 거리 비율 (거리 0.3 이하를 가까운 것으로 간주)
  const proximityThreshold = 0.3;
  const proximityFrames = distanceValues.filter(d => d <= proximityThreshold).length;
  const proximityRatio = distanceValues.length > 0 ? (proximityFrames / distanceValues.length) * 100 : 0;

  return {
    averageDistance,
    minDistance: isFinite(minDistance) ? minDistance : 0,
    maxDistance: isFinite(maxDistance) ? maxDistance : 0,
    proximityRatio,
    distanceOverTime: distances.slice(0, 100), // 최대 100개 포인트로 제한
  };
}

// 3. 활동성 분석: 아이의 움직임 분석
function analyzeChildActivity(results: VideoIntelligenceResults) {
  const childObject = results.objectTracking?.find(obj => obj.entity?.description === 'person');
  
  if (!childObject?.frames || childObject.frames.length < 2) {
    return {
      childActivityLevel: 'static' as const,
      movementScore: 0,
      averageMovementPerSecond: 0,
      movementFrames: 0,
      totalFrames: 0,
    };
  }

  const movements: number[] = [];
  let movementFrames = 0;
  
  for (let i = 1; i < childObject.frames.length; i++) {
    const prevFrame = childObject.frames[i - 1];
    const currentFrame = childObject.frames[i];
    
    if (prevFrame.normalizedBoundingBox && currentFrame.normalizedBoundingBox) {
      const prevCenter = getBoundingBoxCenter(prevFrame.normalizedBoundingBox);
      const currentCenter = getBoundingBoxCenter(currentFrame.normalizedBoundingBox);
      
      const movement = calculateDistance(prevCenter, currentCenter);
      movements.push(movement);
      
      // 움직임 임계값 (0.05 이상을 움직임으로 간주)
      if (movement > 0.05) {
        movementFrames++;
      }
    }
  }

  const averageMovementPerSecond = movements.length > 0 ? movements.reduce((a, b) => a + b, 0) / movements.length : 0;
  const movementScore = averageMovementPerSecond * 100;

  let activityLevel: 'static' | 'dynamic' | 'moderate' = 'static';
  if (movementScore > 15) {
    activityLevel = 'dynamic';
  } else if (movementScore > 5) {
    activityLevel = 'moderate';
  }

  return {
    childActivityLevel: activityLevel,
    movementScore,
    averageMovementPerSecond,
    movementFrames,
    totalFrames: childObject.frames.length,
  };
}

// 4. 상호작용 분석: 장난감 상호작용 분석
function analyzeToyInteraction(results: VideoIntelligenceResults) {
  const toyObjects = results.objectTracking?.filter(obj => 
    obj.entity?.description?.includes('toy') || 
    obj.entity?.description?.includes('ball') ||
    obj.entity?.description?.includes('doll') ||
    obj.entity?.description?.includes('block')
  ) || [];
  
  const childObject = results.objectTracking?.find(obj => obj.entity?.description === 'person');
  
  if (!childObject || toyObjects.length === 0) {
    return {
      toyInteractionRatio: 0,
      toyInteractionFrames: 0,
      totalPlayFrames: 0,
      detectedToys: [],
      interactionPeaks: [],
    };
  }

  const detectedToys = toyObjects.map(toy => toy.entity?.description || 'unknown');
  let interactionFrames = 0;
  const interactionPeaks: Array<{ timeOffset: string; intensity: number }> = [];

  // 각 프레임에서 아이와 장난감의 근접성 확인
  childObject.frames?.forEach((childFrame, index) => {
    let maxInteractionIntensity = 0;
    
    toyObjects.forEach(toy => {
      const toyFrame = toy.frames?.[index];
      if (toyFrame && childFrame.normalizedBoundingBox && toyFrame.normalizedBoundingBox) {
        const childCenter = getBoundingBoxCenter(childFrame.normalizedBoundingBox);
        const toyCenter = getBoundingBoxCenter(toyFrame.normalizedBoundingBox);
        
        const distance = calculateDistance(childCenter, toyCenter);
        
        // 상호작용 임계값 (거리 0.4 이하를 상호작용으로 간주)
        if (distance <= 0.4) {
          interactionFrames++;
          const intensity = Math.max(0, 1 - distance);
          maxInteractionIntensity = Math.max(maxInteractionIntensity, intensity);
        }
      }
    });
    
    if (maxInteractionIntensity > 0.5) {
      interactionPeaks.push({
        timeOffset: childFrame.timeOffset || `${index}s`,
        intensity: maxInteractionIntensity,
      });
    }
  });

  const totalPlayFrames = childObject.frames?.length || 0;
  const toyInteractionRatio = totalPlayFrames > 0 ? (interactionFrames / totalPlayFrames) * 100 : 0;

  return {
    toyInteractionRatio,
    toyInteractionFrames: interactionFrames,
    totalPlayFrames,
    detectedToys,
    interactionPeaks: interactionPeaks.slice(0, 20), // 최대 20개 피크로 제한
  };
}

// 5. 최적 놀이 시간 분석
function analyzeOptimalPlayTime(
  results: VideoIntelligenceResults,
  emotionalAnalysis: any,
  spatialAnalysis: any,
  activityAnalysis: any
) {
  const bestPeriods: Array<{ startTime: string; endTime: string; score: number; reason: string }> = [];
  
  // 간단한 최적 시간 분석 (실제로는 더 복잡한 알고리즘 필요)
  const samplePeriods = [
    { startTime: '0s', endTime: '30s', score: 0, reason: '' },
    { startTime: '30s', endTime: '60s', score: 0, reason: '' },
    { startTime: '60s', endTime: '90s', score: 0, reason: '' },
  ];

  samplePeriods.forEach(period => {
    let score = 50; // 기본 점수
    let reasons: string[] = [];
    
    // 웃음 비율이 높으면 점수 증가
    if (emotionalAnalysis.childSmilingRatio > 20) {
      score += 20;
      reasons.push('높은 웃음 비율');
    }
    
    // 적절한 거리 유지 시 점수 증가
    if (spatialAnalysis.proximityRatio > 30 && spatialAnalysis.proximityRatio < 80) {
      score += 15;
      reasons.push('적절한 거리 유지');
    }
    
    // 적절한 활동성 시 점수 증가
    if (activityAnalysis.childActivityLevel === 'moderate' || activityAnalysis.childActivityLevel === 'dynamic') {
      score += 15;
      reasons.push('활발한 활동');
    }
    
    period.score = Math.min(100, score);
    period.reason = reasons.join(', ') || '기본 평가';
  });

  // 상위 점수 기간들을 선택
  const topPeriods = samplePeriods
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  const overallEngagementScore = Math.round(
    (emotionalAnalysis.childSmilingRatio * 0.3) +
    (spatialAnalysis.proximityRatio * 0.3) +
    (activityAnalysis.movementScore * 0.4)
  );

  return {
    bestPeriods: topPeriods,
    overallEngagementScore: Math.min(100, overallEngagementScore),
  };
}

// 유틸리티 함수들
function getBoundingBoxCenter(box: any) {
  return {
    x: (box.left + box.right) / 2,
    y: (box.top + box.bottom) / 2,
  };
}

function calculateDistance(point1: { x: number; y: number }, point2: { x: number; y: number }) {
  return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
} 