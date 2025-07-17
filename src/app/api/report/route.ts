import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import config from '@/lib/config';
import { VideoIntelligenceResults, AIAnalysisResponse, PlayInteractionInsights } from '@/types';
import { isDevelopmentMode, getMockAIReport, logDevelopmentMode } from '@/lib/mock-data-loader';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

export async function POST(request: NextRequest) {
  try {
    // 개발 모드 체크
    if (isDevelopmentMode()) {
      logDevelopmentMode('Report API');
      
      // Mock 데이터 반환 (실제 OpenAI 호출 없이 바로 성공 응답)
      const mockReport = getMockAIReport();
      
      // 실제 AI 분석 시간을 시뮬레이션 (짧게)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      return NextResponse.json(mockReport);
    }

    const body = await request.json();
    const { videoIntelligenceResults, childAge, parentGender, playType } = body;

    if (!videoIntelligenceResults) {
      return NextResponse.json(
        { success: false, error: '비디오 분석 결과가 제공되지 않았습니다.' },
        { status: 400 }
      );
    }

    // Generate comprehensive analysis prompt
    const analysisPrompt = createAdvancedAnalysisPrompt(
      videoIntelligenceResults,
      childAge,
      parentGender,
      playType
    );

    console.log('Generating AI analysis report...');

    // Generate analysis using OpenAI
    const completion = await openai.chat.completions.create({
      model: config.openai.model,
      messages: [
        {
          role: 'system',
          content: `당신은 부모-아이 놀이상호작용 분석 전문가이자 아동발달 심리학자입니다. 
          제공된 Google Cloud Video Intelligence 분석 데이터를 바탕으로 전문적이고 실용적인 놀이상호작용 레포트를 생성해주세요.
          
          📊 주요 분석 영역:
          1. **화자 구분 분석**: 부모/아이의 대화 비중, 주도권, 반응성
          2. **시선 및 상호작용**: 얼굴 감지를 통한 눈맞춤 패턴, 상호 응시
          3. **공간 및 움직임**: 근접성, 활동성, 위치 관계
          4. **감정 및 참여도**: 표정, 제스처, 활동 전환점
          5. **놀이 패턴**: 협력 vs 개별, 장난감 사용, 역할 분담
          6. **발달 지표**: 언어, 사회성, 인지, 운동, 정서 발달
          7. **부모-자녀 관계**: 반응성, 모방, 칭찬/격려, 온정성
          8. **환경 최적화**: 선호 도구, 최적 시간, 공간 활용
          
          🎯 레포트 특징:
          - 구체적인 수치와 시간대 정보 활용
          - 실용적인 개선 제안사항 제시
          - 발달 단계에 맞는 맞춤형 분석
          - 긍정적 측면과 개선 영역 균형 있게 제시
          
          응답은 반드시 JSON 형식으로 제공하고, 한국어로 작성해주세요.`
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      max_tokens: config.openai.maxTokens,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('AI 분석 응답을 받을 수 없습니다.');
    }

    // Parse AI response
    let analysisResult: AIAnalysisResponse;
    try {
      analysisResult = JSON.parse(aiResponse);
    } catch (error) {
      console.error('AI response parsing error:', error);
      throw new Error('AI 응답 파싱에 실패했습니다.');
    }

    // Generate enhanced visualization data
    const visualizations = generateAdvancedVisualizationData(videoIntelligenceResults, analysisResult);

    // Complete analysis response
    const completeAnalysis: AIAnalysisResponse = {
      ...analysisResult,
      visualizations,
    };

    console.log('AI analysis report generated successfully');

    return NextResponse.json({
      success: true,
      analysis: completeAnalysis,
      metadata: {
        childAge,
        parentGender,
        playType,
        generatedAt: new Date().toISOString(),
        analysisVersion: '2.0-advanced'
      },
    });

  } catch (error) {
    console.error('AI analysis error:', error);
    
    // OpenAI API 할당량 초과 시 기본 레포트 생성
    if (error instanceof Error && (
      error.message.includes('rate limit') || 
      error.message.includes('quota') ||
      error.message.includes('insufficient_quota')
    )) {
      console.log('OpenAI API quota exceeded, returning quota error response...');
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'OpenAI API 할당량을 초과했습니다. 결제 정보를 확인하거나 잠시 후 다시 시도해주세요.',
          quotaExceeded: true 
        },
        { status: 429 }
      );
    }
    
    if (error instanceof Error) {
      if (error.message.includes('invalid_api_key')) {
        return NextResponse.json(
          { success: false, error: 'OpenAI API 키가 유효하지 않습니다.' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'AI 분석 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

function createAdvancedAnalysisPrompt(
  results: VideoIntelligenceResults,
  childAge?: number,
  parentGender?: string,
  playType?: string
): string {
  // 화자 분석 데이터 추출
  const speakerData = extractSpeakerAnalysis(results);
  const objectData = extractObjectAnalysis(results);
  const faceData = extractFaceAnalysis(results);
  const sceneData = extractSceneAnalysis(results);
  
  const speechData = results.speechTranscription
    .map(st => st.alternatives?.[0]?.transcript)
    .filter(Boolean)
    .join(' ');

  return `
다음은 부모-아이 놀이 영상의 상세 분석 데이터입니다:

**📋 기본 정보:**
- 아이 연령: ${childAge || '정보 없음'}세
- 부모 성별: ${parentGender || '정보 없음'}
- 놀이 유형: ${playType || '정보 없음'}

**🗣️ 화자 구분 및 대화 분석:**
${speakerData}

**🎮 놀이 도구 및 객체 상호작용:**
${objectData}

**👁️ 얼굴 감지 및 시선 추적:**
${faceData}

**⏱️ 활동 패턴 및 장면 전환:**
${sceneData}

**📝 전체 음성 전사 내용:**
"${speechData.substring(0, 1000)}${speechData.length > 1000 ? '...' : ''}"

다음 JSON 형식으로 **전문적이고 실용적인** 분석 응답을 제공해주세요:

{
  "summary": "놀이상호작용의 전반적 특징과 품질에 대한 종합 요약 (200자 이내)",
  "insights": {
    "interactionQuality": 85,
    "parentEngagement": 90,
    "childEngagement": 80,
    "communicationPatterns": [
      {
        "type": "verbal",
        "frequency": 15,
        "duration": 120,
        "initiator": "parent",
        "timeSegments": [{"startTimeOffset": "0s", "endTimeOffset": "30s"}],
        "description": "구체적인 의사소통 패턴 설명"
      }
    ],
    "emotionalStates": [
      {
        "emotion": "joy",
        "intensity": 8,
        "duration": 60,
        "person": "child",
        "timeSegments": [{"startTimeOffset": "10s", "endTimeOffset": "70s"}],
        "indicators": ["웃음소리", "활발한 움직임", "적극적 참여"]
      }
    ],
    "playPatterns": [
      {
        "type": "collaborative",
        "duration": 180,
        "objects": ["블록", "인형"],
        "timeSegments": [{"startTimeOffset": "0s", "endTimeOffset": "180s"}],
        "description": "협력적 놀이의 구체적 특징",
        "leadingRole": "parent"
      }
    ],
    "proximityAnalysis": {
      "averageDistance": "가까움",
      "closeInteractionTime": 150,
      "physicalContactFrequency": 5,
      "spatialMovementPattern": "정적/활동적"
    },
    "attentionPatterns": {
      "eyeContactFrequency": 12,
      "mutualGazeTime": 45,
      "jointAttentionEvents": 8,
      "attentionShifts": 6
    }
  },
  "recommendations": [
    "구체적이고 실행 가능한 놀이 개선 제안 1 (시간대, 방법 포함)",
    "아이의 발달 단계를 고려한 놀이 확장 방법",
    "부모의 참여 방식 개선 제안",
    "놀이 환경 최적화 방안",
    "다음 단계 발달을 위한 구체적 활동 제안"
  ],
  "developmentIndicators": {
    "language": {
      "score": 85,
      "observations": [
        "아이의 어휘 사용 정도와 문장 구성 능력",
        "부모와의 언어적 상호작용 빈도",
        "언어 이해 및 표현 발달 수준"
      ],
      "recommendations": [
        "어휘 확장을 위한 구체적 놀이 방법",
        "언어 발달을 촉진하는 상호작용 기법"
      ],
      "nextSteps": "다음 발달 단계를 위한 언어 활동 제안"
    },
    "social": {
      "score": 90,
      "observations": [
        "사회적 상호작용 능력과 눈맞춤 빈도",
        "차례 지키기와 규칙 이해 정도",
        "감정 공유와 공감 능력"
      ],
      "recommendations": [
        "사회성 발달을 위한 놀이 활동",
        "또래 관계 준비를 위한 기술 연습"
      ],
      "nextSteps": "사회성 확장을 위한 다음 단계 활동"
    },
    "cognitive": {
      "score": 80,
      "observations": [
        "문제 해결 능력과 집중력",
        "창의적 사고와 상상력 발현",
        "인과관계 이해와 논리적 사고"
      ],
      "recommendations": [
        "인지 발달을 촉진하는 놀이 방법",
        "사고력 확장을 위한 질문 기법"
      ],
      "nextSteps": "인지 능력 향상을 위한 도전적 활동"
    },
    "motor": {
      "score": 75,
      "observations": [
        "대근육 및 소근육 발달 상태",
        "협응력과 균형감각",
        "도구 사용 능력과 손재주"
      ],
      "recommendations": [
        "운동 발달을 위한 신체 활동",
        "미세 운동 기술 향상 방법"
      ],
      "nextSteps": "운동 능력 발달을 위한 진전된 활동"
    },
    "emotional": {
      "score": 88,
      "observations": [
        "감정 조절 능력과 표현 방식",
        "좌절 상황에서의 대처 능력",
        "긍정적 정서와 즐거움 표현"
      ],
      "recommendations": [
        "정서 발달을 위한 상호작용 방법",
        "감정 이해와 표현 향상 기법"
      ],
      "nextSteps": "정서적 성숙을 위한 다음 단계 지원"
    }
  },
  "parentChildDynamics": {
    "responsiveness": {
      "score": 85,
      "parentToChild": "부모가 아이 신호에 반응하는 정도",
      "childToParent": "아이가 부모 신호에 반응하는 정도",
      "mutualResponsiveness": "상호 반응성의 질과 타이밍"
    },
    "warmth": {
      "score": 90,
      "indicators": ["신체적 친밀감", "따뜻한 음성 톤", "격려와 칭찬"],
      "recommendations": "온정성 유지 및 향상 방법"
    },
    "structure": {
      "score": 75,
      "clarity": "놀이 규칙과 경계의 명확성",
      "consistency": "일관된 상호작용 패턴",
      "flexibility": "상황에 따른 유연한 대응"
    }
  },
  "environmentalFactors": {
    "preferredObjects": ["가장 많이 사용된 놀이 도구들"],
    "optimalPlayTime": "가장 활발한 상호작용 시간대",
    "spaceUtilization": "공간 활용 패턴과 선호 영역",
    "distractionFactors": "주의를 분산시키는 요소들",
    "recommendations": "놀이 환경 개선을 위한 구체적 제안"
  }
}

**💡 주의사항:**
- 모든 점수는 1-100 척도로 표시
- 구체적인 시간대와 관찰 사실을 바탕으로 분석
- 발달 단계에 적합한 기대치 적용
- 긍정적 측면을 강조하되 개선점도 정확히 제시
- 실제 실행 가능한 구체적 제안사항 포함
`;
}

// 화자 분석 데이터 추출
function extractSpeakerAnalysis(results: VideoIntelligenceResults): string {
  const speakerData: Record<number, { wordCount: number; totalTime: number; words: string[] }> = {};
  
  results.speechTranscription.forEach(transcript => {
    transcript.alternatives?.forEach(alt => {
      alt.words?.forEach(word => {
        const speaker = word.speakerTag || 0;
        if (!speakerData[speaker]) {
          speakerData[speaker] = { wordCount: 0, totalTime: 0, words: [] };
        }
        speakerData[speaker].wordCount++;
        speakerData[speaker].words.push(word.word || '');
        
        if (word.startTime && word.endTime) {
          const start = parseFloat(word.startTime.replace('s', ''));
          const end = parseFloat(word.endTime.replace('s', ''));
          speakerData[speaker].totalTime += (end - start);
        }
      });
    });
  });

  let analysis = "화자별 분석:\n";
  Object.entries(speakerData).forEach(([speaker, data]) => {
    const speakerName = speaker === '0' ? '화자 1 (부모 추정)' : '화자 2 (아이 추정)';
    analysis += `- ${speakerName}: ${data.wordCount}단어, ${data.totalTime.toFixed(1)}초 발화\n`;
    analysis += `  주요 단어: ${data.words.slice(0, 10).join(', ')}\n`;
  });

  return analysis;
}

// 객체 분석 데이터 추출
function extractObjectAnalysis(results: VideoIntelligenceResults): string {
  const objectFreq: Record<string, number> = {};
  const objectDetails: Record<string, { confidence: number; duration: string }> = {};

  results.objectTracking.forEach(obj => {
    const name = obj.entity?.description || 'Unknown';
    objectFreq[name] = (objectFreq[name] || 0) + 1;
    objectDetails[name] = {
      confidence: obj.confidence || 0,
      duration: `${obj.segment?.startTimeOffset || '0s'} - ${obj.segment?.endTimeOffset || '0s'}`
    };
  });

  let analysis = "감지된 놀이 도구:\n";
  Object.entries(objectFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .forEach(([object, frequency]) => {
      const details = objectDetails[object];
      analysis += `- ${object}: ${frequency}회 감지, 신뢰도 ${(details.confidence * 100).toFixed(1)}%\n`;
    });

  return analysis;
}

// 얼굴 분석 데이터 추출
function extractFaceAnalysis(results: VideoIntelligenceResults): string {
  const totalFaces = results.faceDetection.length;
  const totalTracks = results.faceDetection.reduce((sum, face) => sum + (face.tracks?.length || 0), 0);
  const totalTimePoints = results.faceDetection.reduce((sum, face) => 
    sum + face.tracks?.reduce((trackSum, track) => trackSum + (track.timestampedObjects?.length || 0), 0) || 0, 0);

  return `얼굴 감지 분석:
- 감지된 얼굴 수: ${totalFaces}개
- 총 추적 구간: ${totalTracks}개
- 총 감지 지점: ${totalTimePoints}개
- 지속적 얼굴 감지: ${totalTracks > 5 ? '높음' : totalTracks > 2 ? '보통' : '낮음'}
- 예상 상호 응시도: ${totalFaces >= 2 ? '높음' : '보통'}`;
}

// 장면 분석 데이터 추출
function extractSceneAnalysis(results: VideoIntelligenceResults): string {
  const sceneChanges = results.shotChanges.length;
  const avgSceneDuration = sceneChanges > 0 ? "동적 계산 필요" : "단일 장면";
  
  return `활동 패턴 분석:
- 장면 전환 횟수: ${sceneChanges}회
- 놀이 활동성: ${sceneChanges > 10 ? '매우 활동적' : sceneChanges > 5 ? '활동적' : '정적'}
- 집중도 추정: ${sceneChanges < 5 ? '높음 (긴 집중)' : sceneChanges < 10 ? '보통' : '낮음 (자주 전환)'}
- 놀이 다양성: ${sceneChanges > 8 ? '다양함' : '일관됨'}`;
}

function generateAdvancedVisualizationData(
  results: VideoIntelligenceResults,
  analysis: AIAnalysisResponse
) {
  const visualizations = [];

  // 상호작용 품질 방사형 차트
  visualizations.push({
    type: 'radar' as const,
    title: '상호작용 품질 분석',
    data: [
      { area: '부모 참여도', score: analysis.insights.parentEngagement },
      { area: '아이 참여도', score: analysis.insights.childEngagement },
      { area: '전체 상호작용', score: analysis.insights.interactionQuality },
      { area: '의사소통', score: 85 },
      { area: '감정 공유', score: 80 },
      { area: '협력성', score: 90 },
    ],
  });

  // 발달 지표 대시보드
  visualizations.push({
    type: 'bar' as const,
    title: '발달 영역별 분석',
    data: [
      { area: '언어', score: analysis.developmentIndicators.language.score },
      { area: '사회성', score: analysis.developmentIndicators.social.score },
      { area: '인지', score: analysis.developmentIndicators.cognitive.score },
      { area: '운동', score: analysis.developmentIndicators.motor.score },
      { area: '정서', score: analysis.developmentIndicators.emotional.score },
    ],
    xAxis: 'area',
    yAxis: 'score',
  });

  // 화자별 참여도 (음성 데이터가 있는 경우)
  if (results.speechTranscription.length > 0) {
    const speakerData = results.speechTranscription.reduce((acc, transcript) => {
      transcript.alternatives?.forEach(alt => {
        alt.words?.forEach(word => {
          const speaker = word.speakerTag || 0;
          acc[speaker] = (acc[speaker] || 0) + 1;
        });
      });
      return acc;
    }, {} as Record<number, number>);

    visualizations.push({
      type: 'pie' as const,
      title: '화자별 발화 비중',
      data: Object.entries(speakerData).map(([speaker, count]) => ({
        name: speaker === '0' ? '부모' : '아이',
        value: count,
        color: speaker === '0' ? '#3B82F6' : '#10B981'
      })),
    });
  }

  // 감정 상태 타임라인
  if (analysis.insights.emotionalStates.length > 0) {
    visualizations.push({
      type: 'timeline' as const,
      title: '감정 상태 변화',
      data: analysis.insights.emotionalStates.map(state => ({
        time: state.timeSegments[0]?.startTimeOffset || '0s',
        emotion: state.emotion,
        intensity: state.intensity,
        person: state.person,
        duration: state.duration
      })),
    });
  }

  // 놀이 객체 사용 빈도
  if (results.objectTracking.length > 0) {
    const objectFreq = results.objectTracking.reduce((acc, obj) => {
      const name = obj.entity?.description || 'Unknown';
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    visualizations.push({
      type: 'bar' as const,
      title: '놀이 도구 사용 빈도',
      data: Object.entries(objectFreq)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8)
        .map(([object, frequency]) => ({
          name: object,
          value: frequency
        })),
      xAxis: 'name',
      yAxis: 'value',
    });
  }

  return visualizations;
}

// OpenAI API 없이 기본 분석 생성
function generateBasicAnalysis(
  results: VideoIntelligenceResults,
  childAge?: number,
  parentGender?: string,
  playType?: string
): AIAnalysisResponse {
  const speechCount = results.speechTranscription?.length || 0;
  const objectCount = results.objectTracking?.length || 0;
  const faceCount = results.faceDetection?.length || 0;
  const personCount = results.personDetection?.length || 0;
  
  // 기본 분석 결과 생성
  return {
    summary: `영상 분석 결과, 총 ${speechCount}개의 음성 구간과 ${objectCount}개의 객체 상호작용, ${faceCount}개의 얼굴 감지가 확인되었습니다. 전반적으로 ${speechCount > 10 ? '활발한' : '적절한'} 놀이 상호작용이 이루어졌습니다.`,
    insights: {
      interactionQuality: Math.min(95, 70 + (speechCount * 1.5)),
      parentEngagement: Math.min(90, 65 + (speechCount * 1.2) + (faceCount * 0.8)),
      childEngagement: Math.min(90, 65 + (speechCount * 1.0) + (objectCount * 0.5)),
      communicationPatterns: [
        {
          type: 'verbal' as const,
          frequency: speechCount,
          duration: speechCount * 3,
          initiator: 'parent' as const,
          timeSegments: [{ startTimeOffset: "0s", endTimeOffset: "60s" }]
        }
      ],
      emotionalStates: [
        {
          emotion: 'joy' as const,
          intensity: Math.min(90, 70 + (speechCount * 1.5)),
          duration: 60,
          person: 'child' as const,
          timeSegments: [{ startTimeOffset: "0s", endTimeOffset: "60s" }]
        },
        {
          emotion: 'concentration' as const,
          intensity: Math.min(85, 65 + (faceCount * 2)),
          duration: 60,
          person: 'parent' as const,
          timeSegments: [{ startTimeOffset: "0s", endTimeOffset: "60s" }]
        }
      ],
      playPatterns: [
        {
          type: objectCount > 20 ? 'collaborative' as const : 'parallel' as const,
          duration: 60,
          objects: objectCount > 0 ? ['장난감', '책', '블록'] : ['대화', '관찰'],
          timeSegments: [{ startTimeOffset: "0s", endTimeOffset: "60s" }]
        }
      ]
    },
    recommendations: [
      "더 많은 언어적 상호작용을 통해 아이의 언어 발달을 촉진하세요.",
      "다양한 놀이 도구를 활용하여 창의성을 높여보세요.",
      "아이와의 눈맞춤을 통해 정서적 유대감을 강화하세요.",
      "놀이 중 아이의 반응을 주의 깊게 관찰하고 반응해주세요."
    ],
    developmentIndicators: {
      language: {
        score: Math.min(90, 60 + (speechCount * 2)),
        observations: [
          `총 ${speechCount}개의 언어적 상호작용이 관찰되었습니다.`,
          speechCount > 15 ? "활발한 언어 사용을 보여줍니다." : "언어 사용을 더 늘려볼 수 있습니다."
        ],
        recommendations: ["더 많은 대화 시간을 가져보세요.", "아이의 말에 적극적으로 반응해주세요."]
      },
      social: {
        score: Math.min(95, 65 + (faceCount * 1.5) + (personCount * 5)),
        observations: [
          `${faceCount}회의 얼굴 감지로 사회적 상호작용을 확인했습니다.`,
          `${personCount}명이 놀이에 참여하여 사회적 환경이 조성되었습니다.`
        ],
        recommendations: ["눈맞춤을 통한 상호작용을 늘려보세요.", "함께하는 놀이 시간을 증가시켜보세요."]
      },
      cognitive: {
        score: Math.min(90, 60 + (objectCount * 1.2)),
        observations: [
          `${objectCount}개의 객체 상호작용으로 인지적 활동을 확인했습니다.`,
          objectCount > 20 ? "다양한 인지적 자극이 제공되었습니다." : "더 다양한 놀이 도구 활용을 권장합니다."
        ],
        recommendations: ["다양한 놀이 도구를 활용해보세요.", "문제 해결 놀이를 함께 시도해보세요."]
      },
      motor: {
        score: Math.min(85, 65 + (objectCount * 0.8)),
        observations: [
          `객체 조작 활동을 통한 운동 발달이 관찰되었습니다.`,
          "손과 눈의 협응력 발달에 도움이 되는 활동이 포함되었습니다."
        ],
        recommendations: ["소근육 발달을 위한 활동을 늘려보세요.", "큰 움직임을 포함한 놀이를 시도해보세요."]
      },
      emotional: {
        score: Math.min(90, 70 + (faceCount * 1.2)),
        observations: [
          `${faceCount}회의 얼굴 감지로 정서적 교감을 확인했습니다.`,
          "부모-아이 간의 정서적 유대감이 형성되고 있습니다."
        ],
        recommendations: ["감정 표현을 격려해주세요.", "정서적 안정감을 제공해주세요."]
      }
    },
    visualizations: []
  };
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
} 