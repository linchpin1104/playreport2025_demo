'use client';

import { CheckCircle, Loader2, Brain, Users, AlertCircle, Settings, FileText, Zap } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface AnalysisStep {
  step: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  progress: number;
  message: string;
  startTime?: string;
  endTime?: string;
}

interface ComprehensiveAnalysisResponse {
  sessionId: string;
  status: 'in_progress' | 'completed' | 'error';
  steps: AnalysisStep[];
  results?: {
    videoAnalysis?: any;
    voiceAnalysis?: any;
    integratedAnalysis?: any;
    evaluation?: any;
    report?: any;
  };
  error?: string;
  startTime: string;
  endTime?: string;
  totalProgress: number;
}

// 간소화된 5단계 정의 (comprehensive-analysis와 일치)
const STEP_INFO = {
  session_init: {
    title: '세션 초기화',
    description: '분석 세션을 준비합니다',
    icon: Settings
  },
  video_audio_analysis: {
    title: '비디오+음성 분석',
    description: '비디오분석과 음성분석을 동시 수행합니다',
    icon: Brain
  },
  raw_data_storage: {
    title: '원본 데이터 저장',
    description: '추출된 원본 데이터를 GCP에 저장합니다',
    icon: AlertCircle
  },
  unified_analysis: {
    title: '통합 분석',
    description: '새로운 통합 분석 엔진으로 모든 분석을 수행합니다',
    icon: Brain
  },
  dashboard_ready: {
    title: '대시보드 준비',
    description: '최종 분석 결과를 대시보드에 표시할 수 있도록 준비합니다',
    icon: CheckCircle
  }
};

// useSearchParams를 사용하는 별도의 클라이언트 컴포넌트
function AnalysisPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  
  const [analysisResult, setAnalysisResult] = useState<ComprehensiveAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 중복 호출 방지를 위한 refs
  const analysisStarted = useRef(false);

  // 통합 분석 실행 - 오직 comprehensive-analysis API만 호출
  const startComprehensiveAnalysis = useCallback(async () => {
    if (!sessionId || analysisStarted.current || isAnalyzing) {
      return;
    }

    console.log(`🚀 Starting COMPREHENSIVE analysis for session: ${sessionId}`);
    
    // 먼저 기존 세션 상태 확인
    try {
      const sessionCheckResponse = await fetch(`/api/play-sessions/${sessionId}`);
      if (sessionCheckResponse.ok) {
        const sessionData = await sessionCheckResponse.json();
        if (sessionData.success && sessionData.session) {
          const status = sessionData.session.metadata?.status;
          
          // 이미 완료된 분석이면 결과 페이지로 직접 이동
          if (status === 'comprehensive_analysis_completed') {
            console.log(`✅ Analysis already completed for session: ${sessionId}. Redirecting...`);
            router.push(`/results?sessionId=${sessionId}`);
            return;
          }
          
          // 진행 중인 분석이면 경고 표시
          if (status === 'comprehensive_analysis_started') {
            console.log(`⚠️ Analysis already in progress for session: ${sessionId}`);
            setError('이미 분석이 진행 중입니다. 잠시 후 다시 시도해주세요.');
            return;
          }
        }
      }
    } catch (error) {
      console.warn('Session check failed, proceeding with analysis:', error);
    }
    
    analysisStarted.current = true;
    setIsAnalyzing(true);
    setError(null);

    // 초기 상태 설정
    const initialSteps: AnalysisStep[] = Object.keys(STEP_INFO).map(stepKey => ({
      step: stepKey,
      status: 'pending' as const,
      progress: 0,
      message: STEP_INFO[stepKey as keyof typeof STEP_INFO].description
    }));

    setAnalysisResult({
      sessionId,
      status: 'in_progress',
      steps: initialSteps,
      startTime: new Date().toISOString(),
      totalProgress: 0
    });

    try {
      // 🎯 단 하나의 API만 호출: comprehensive-analysis
      const response = await fetch('/api/comprehensive-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          videoPath: `${sessionId}.mp4`
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API 호출 실패: ${response.status}`);
      }

      const result: ComprehensiveAnalysisResponse = await response.json();
      
      console.log('✅ Comprehensive analysis result:', result);
      setAnalysisResult(result);

      // 성공적으로 완료된 경우 결과 페이지로 이동
      if (result.status === 'completed') {
        console.log(`🎉 Analysis completed! Redirecting to results page...`);
        setTimeout(() => {
          router.push(`/results?sessionId=${sessionId}`);
        }, 2000);
      } else if (result.status === 'error') {
        setError(result.error || '분석 중 오류가 발생했습니다.');
      }

    } catch (err) {
      console.error('❌ Comprehensive analysis error:', err);
      const errorMessage = err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.';
      setError(errorMessage);
      
      // 에러가 발생해도 기본 분석이 있을 수 있으니 결과 페이지로 이동 시도
      setTimeout(() => {
        console.log('🔄 Attempting to redirect to results despite error...');
        router.push(`/results?sessionId=${sessionId}`);
      }, 5000);
    } finally {
      setIsAnalyzing(false);
    }
  }, [sessionId, router, isAnalyzing]);

  // 자동 분석 시작
  useEffect(() => {
    if (sessionId && !analysisStarted.current && !isAnalyzing) {
      console.log(`📋 Auto-starting comprehensive analysis for session: ${sessionId}`);
      startComprehensiveAnalysis();
    }
  }, [sessionId, startComprehensiveAnalysis, isAnalyzing]);

  // 현재 활성 단계 계산
  const getCurrentStepInfo = () => {
    if (!analysisResult?.steps) {return null;}
    
    const activeStep = analysisResult.steps.find(step => step.status === 'in_progress') || 
                      analysisResult.steps.find(step => step.status === 'pending');
    return activeStep;
  };

  const currentStep = getCurrentStepInfo();
  const totalProgress = analysisResult?.totalProgress || 0;

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                ❌ 세션 정보 없음
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-4">
                올바른 세션 ID가 필요합니다. 업로드 페이지에서 다시 시도해 주세요.
              </p>
              <Button onClick={() => router.push('/upload')} className="bg-blue-600 hover:bg-blue-700">
                업로드 페이지로 이동
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm mb-8">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
              <Zap className="w-8 h-8 text-blue-600" />
              🎯 통합 놀이 상호작용 분석
            </CardTitle>
            <p className="text-gray-600 text-lg">
              🚀 실제 AI 분석 진행 중
            </p>
            <p className="text-sm text-gray-500">
              세션 ID: <code className="bg-gray-100 px-2 py-1 rounded">{sessionId}</code>
            </p>
            
            {/* 전체 진행률 */}
            <div className="mt-6 max-w-md mx-auto">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">전체 진행률</span>
                <span className="text-sm font-bold text-blue-600">{totalProgress}%</span>
              </div>
              <Progress value={totalProgress} className="h-3 bg-gray-200" />
            </div>
          </CardHeader>
        </Card>

        {/* 에러 표시 */}
        {error && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>오류:</strong> {error}
              <div className="mt-2 text-sm">
                결과 페이지로 자동 이동을 시도합니다...
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* 현재 진행 중인 단계 강조 */}
        {currentStep && (
          <Card className="mb-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1">
                    {STEP_INFO[currentStep.step as keyof typeof STEP_INFO]?.title || currentStep.step}
                  </h3>
                  <p className="opacity-90">
                    {currentStep.message}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{currentStep.progress}%</div>
                  <div className="text-sm opacity-90">진행중</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 분석 단계 목록 */}
        <div className="space-y-4">
          {Object.entries(STEP_INFO).map(([stepKey, stepInfo]) => {
            const stepData = analysisResult?.steps.find(s => s.step === stepKey);
            const isActive = currentStep?.step === stepKey;
            const isCompleted = stepData?.status === 'completed';
            const isError = stepData?.status === 'error';
            const Icon = stepInfo.icon;

            return (
              <Card
                key={stepKey}
                className={`shadow-lg transition-all duration-300 ${
                  isActive
                    ? 'border-blue-500 bg-blue-50 scale-[1.02] shadow-xl'
                    : isCompleted
                    ? 'border-green-500 bg-green-50'
                    : isError
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    {/* 아이콘 */}
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isActive
                          ? 'bg-blue-500 text-white'
                          : isError
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isActive ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : isCompleted ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : isError ? (
                        <AlertCircle className="w-6 h-6" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>

                    {/* 단계 정보 */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {stepInfo.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {stepData?.message || stepInfo.description}
                      </p>
                      
                      {/* 진행률 바 */}
                      {isActive && stepData && (
                        <div className="mt-3">
                          <Progress value={stepData.progress} className="h-2" />
                        </div>
                      )}
                    </div>

                    {/* 상태 표시 */}
                    <div className="text-right">
                      {isCompleted && (
                        <div className="text-green-600 font-semibold text-sm flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          완료
                        </div>
                      )}
                      {isActive && (
                        <div className="text-blue-600 font-semibold text-sm flex items-center gap-1">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          진행중
                        </div>
                      )}
                      {isError && (
                        <div className="text-red-600 font-semibold text-sm flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          오류
                        </div>
                      )}
                      {!stepData && (
                        <div className="text-gray-400 font-semibold text-sm">
                          대기중
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 완료 메시지 */}
        {analysisResult?.status === 'completed' && (
          <Card className="mt-8 bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-xl">
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-20 h-20 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-2">🎉 분석 완료!</h2>
              <p className="text-lg opacity-90 mb-6">
                상세한 분석 결과를 확인하러 가볼까요?
              </p>
              <Button
                onClick={() => router.push(`/results?sessionId=${sessionId}`)}
                size="lg"
                className="bg-white text-green-600 hover:bg-gray-100 font-semibold"
              >
                결과 페이지로 이동 →
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 분석 진행 중 안내 */}
        {isAnalyzing && (
          <Card className="mt-8 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                💡 분석 진행 중 안내
              </h3>
              <ul className="space-y-1 text-sm opacity-90">
                <li>• 분석 시간은 영상 길이에 따라 달라집니다 (보통 2-5분)</li>
                <li>• 실제 Google Cloud AI 분석이 진행되고 있습니다</li>
                <li>• 분석 중에는 페이지를 새로고침하지 말아주세요</li>
                <li>• 완료 후 자동으로 결과 페이지로 이동합니다</li>
              </ul>
            </CardContent>
          </Card>
        )}

        {/* 수동 재시작 버튼 (오류 시에만 표시) */}
        {error && !isAnalyzing && (
          <Card className="mt-8">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold mb-3">문제가 지속되나요?</h3>
              <div className="space-x-3">
                <Button
                  onClick={() => {
                    analysisStarted.current = false;
                    setError(null);
                    startComprehensiveAnalysis();
                  }}
                  variant="outline"
                >
                  다시 분석하기
                </Button>
                <Button
                  onClick={() => router.push('/upload')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  새 영상 업로드
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// 로딩 컴포넌트
function AnalysisPageLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              🚀 분석 준비 중...
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// 메인 컴포넌트
export default function AnalysisPage() {
  return (
    <Suspense fallback={<AnalysisPageLoading />}>
      <AnalysisPageContent />
    </Suspense>
  );
} 