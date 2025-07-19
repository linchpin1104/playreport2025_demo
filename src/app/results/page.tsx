'use client';

import { Loader2, AlertCircle, ArrowLeft, Download } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PlayInteractionDashboard from '@/components/play-interaction-dashboard';
import { PlayAnalysisSession } from '@/lib/play-data-storage';

// useSearchParams를 사용하는 별도의 클라이언트 컴포넌트
function ResultsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('sessionId');
  
  const [sessionData, setSessionData] = useState<PlayAnalysisSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 세션 데이터 로드
  useEffect(() => {
    const fetchSessionData = async () => {
      if (!sessionId) {
        setError('세션 ID가 필요합니다.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        console.log(`🔍 Loading session data for: ${sessionId}`);
        
        const response = await fetch(`/api/play-sessions/${sessionId}`);
        if (!response.ok) {
          throw new Error(`세션 데이터를 불러올 수 없습니다: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.session) {
          console.log('✅ Session data loaded:', data.session);
          setSessionData(data.session);
        } else {
          throw new Error(data.error || '세션 데이터를 불러오는데 실패했습니다.');
        }
      } catch (err) {
        console.error('❌ Session data loading failed:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessionData();
  }, [sessionId]);

  const handleBackToAnalysis = () => {
    if (sessionId) {
      router.push(`/analysis?sessionId=${sessionId}`);
    } else {
      router.push('/upload');
    }
  };

  const handleGoToReport = () => {
    if (sessionId) {
      router.push(`/report?sessionId=${sessionId}`);
    }
  };

  const handleNewAnalysis = () => {
    router.push('/upload');
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                세션 정보를 찾을 수 없습니다
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">
                올바른 세션 ID가 필요합니다. 분석 페이지에서 다시 시도해 주세요.
              </p>
              <Button onClick={() => router.push('/upload')} className="bg-blue-600 hover:bg-blue-700">
                새로운 분석 시작
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                분석 결과를 불러오는 중...
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                오류 발생
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
              
              <div className="flex justify-center gap-4">
                <Button 
                  variant="outline" 
                  onClick={handleBackToAnalysis}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  다시 분석하기
                </Button>
                <Button 
                  onClick={handleNewAnalysis}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  새로운 분석 시작
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // 성공적으로 데이터를 로드한 경우 대시보드 표시
  return (
    <div className="min-h-screen">
      {/* 상단 네비게이션 바 */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleBackToAnalysis}
              className="flex items-center gap-2 hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4" />
              분석으로 돌아가기
            </Button>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleGoToReport}
                className="flex items-center gap-2 hover:bg-gray-50"
              >
                <Download className="w-4 h-4" />
                상세 리포트 보기
              </Button>
              <Button
                onClick={handleNewAnalysis}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                새로운 분석 시작
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 대시보드 */}
      <PlayInteractionDashboard 
        sessionId={sessionId} 
        sessionData={sessionData || undefined}
      />
    </div>
  );
}

// 로딩 컴포넌트
function ResultsPageLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              결과 페이지를 준비하는 중...
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

// 메인 컴포넌트 - Suspense로 감싸기
export default function ResultsPage() {
  return (
    <Suspense fallback={<ResultsPageLoading />}>
      <ResultsPageContent />
    </Suspense>
  );
} 