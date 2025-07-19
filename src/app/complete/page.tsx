'use client';

import { 
  CheckCircle, Download, Home, BarChart3, 
  Calendar, Clock, Users, Target, ArrowRight, 
  Heart, Brain, Star, Loader2
} from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CompletionStats {
  totalSessions: number;
  analysisTime: string;
  keyInsights: number;
  improvementAreas: number;
  nextRecommendation: string;
}

const mockStats: CompletionStats = {
  totalSessions: 1,
  analysisTime: '8분 45초',
  keyInsights: 12,
  improvementAreas: 4,
  nextRecommendation: '매일 30분 자유놀이 시간 확보하기'
};

// useSearchParams를 사용하는 별도의 클라이언트 컴포넌트
function CompletePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('sessionId');
  
  const [stats, setStats] = useState<CompletionStats>(mockStats);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    // 완료 통계 로드
    // 실제로는 API에서 세션 완료 통계를 가져올 것
    console.log('Complete page loaded for session:', sessionId);
  }, [sessionId]);

  const handleDownloadReport = async () => {
    setIsDownloading(true);
    // PDF 다운로드 시뮬레이션
    setTimeout(() => {
      setIsDownloading(false);
      alert('리포트가 다운로드되었습니다!');
    }, 2000);
  };

  const handleViewResults = () => {
    router.push(`/results?sessionId=${sessionId}`);
  };

  const handleNewAnalysis = () => {
    router.push('/upload');
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* 완료 헤더 */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm mb-8">
          <CardContent className="text-center py-12">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              분석 완료! 🎉
            </h1>
            
            <p className="text-xl text-gray-600 mb-2">
              놀이 상호작용 분석이 성공적으로 완료되었습니다
            </p>
            
            <p className="text-gray-500">
              세션 ID: {sessionId}
            </p>
          </CardContent>
        </Card>

        {/* 분석 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-3">
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {stats.totalSessions}
              </h3>
              <p className="text-sm text-gray-600">완료된 세션</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-3">
                <Clock className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {stats.analysisTime}
              </h3>
              <p className="text-sm text-gray-600">분석 시간</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-3">
                <Brain className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {stats.keyInsights}
              </h3>
              <p className="text-sm text-gray-600">핵심 인사이트</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-3">
                <Target className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {stats.improvementAreas}
              </h3>
              <p className="text-sm text-gray-600">개선 영역</p>
            </CardContent>
          </Card>
        </div>

        {/* 다음 단계 추천 */}
        <Card className="shadow-xl border-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Star className="w-6 h-6" />
              다음 단계 추천
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-medium mb-2">
                  {stats.nextRecommendation}
                </p>
                <p className="text-blue-100">
                  분석 결과를 바탕으로 가장 효과적인 다음 단계를 제안드립니다
                </p>
              </div>
              <ArrowRight className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        {/* 액션 버튼들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow cursor-pointer" 
                onClick={handleViewResults}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    상세 결과 보기
                  </h3>
                  <p className="text-sm text-gray-600">
                    분석 결과와 차트를 자세히 확인하세요
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow cursor-pointer" 
                onClick={handleDownloadReport}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  {isDownloading ? (
                    <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
                  ) : (
                    <Download className="w-6 h-6 text-green-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    리포트 다운로드
                  </h3>
                  <p className="text-sm text-gray-600">
                    PDF 형태의 상세 리포트를 받아보세요
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 하단 액션 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleNewAnalysis}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Users className="w-5 h-5 mr-2" />
            새로운 분석 시작
          </Button>
          
          <Button
            onClick={handleGoHome}
            variant="outline"
            size="lg"
            className="bg-white/80 hover:bg-white"
          >
            <Home className="w-5 h-5 mr-2" />
            홈으로 돌아가기
          </Button>
        </div>

        {/* 추가 정보 */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm mt-8">
          <CardContent className="p-6 text-center">
            <Heart className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-2">
              분석을 완료해 주셔서 감사합니다!
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              아이와의 소중한 시간을 더욱 의미 있게 만들어 나가시길 바랍니다.
              궁금한 점이 있으시면 언제든 문의해 주세요.
            </p>
            <div className="flex justify-center space-x-4">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                전문 AI 분석
              </Badge>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                개인맞춤 리포트
              </Badge>
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                발달 가이드
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Loading fallback 컴포넌트
function CompletePageLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              완료 페이지 로딩 중...
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
export default function CompletePage() {
  return (
    <Suspense fallback={<CompletePageLoading />}>
      <CompletePageContent />
    </Suspense>
  );
} 