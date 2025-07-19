'use client';

import { 
  FileText, Download, ArrowLeft, TrendingUp, Target, 
  Lightbulb, Heart, Brain, Users, MessageCircle, Star,
  CheckCircle, AlertCircle, Info, Loader2
} from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ReportData {
  sessionInfo: {
    sessionId: string;
    analysisDate: string;
    videoDuration: string;
    participants: string[];
  };
  overallAssessment: {
    interactionQuality: number;
    developmentSupport: number;
    playEnvironment: number;
    totalScore: number;
    grade: string;
  };
  detailedAnalysis: {
    strengths: string[];
    improvements: string[];
    developmentGoals: string[];
    recommendations: string[];
  };
  developmentPlan: {
    shortTerm: Array<{
      goal: string;
      activities: string[];
      timeframe: string;
    }>;
    longTerm: Array<{
      goal: string;
      activities: string[];
      timeframe: string;
    }>;
  };
}

const mockReportData: ReportData = {
  sessionInfo: {
    sessionId: 'session_123',
    analysisDate: '2024-01-15',
    videoDuration: '15분 30초',
    participants: ['부모', '아이(5세)']
  },
  overallAssessment: {
    interactionQuality: 85,
    developmentSupport: 78,
    playEnvironment: 92,
    totalScore: 85,
    grade: 'A'
  },
  detailedAnalysis: {
    strengths: [
      '아이와의 눈맞춤이 자연스럽고 충분합니다',
      '아이의 관심사를 잘 파악하고 반응해줍니다',
      '창의적인 놀이 아이디어를 제시합니다',
      '아이의 감정을 잘 읽고 공감해줍니다'
    ],
    improvements: [
      '아이가 주도하는 놀이 시간을 더 늘려보세요',
      '기다림의 시간을 조금 더 가져보세요',
      '아이의 실수에 대해 더 관대하게 반응해보세요'
    ],
    developmentGoals: [
      '자율성과 독립성 발달 지원',
      '창의적 사고력 향상',
      '사회성 및 협력 능력 개발',
      '언어 표현력 증진'
    ],
    recommendations: [
      '매일 30분씩 자유놀이 시간을 가져보세요',
      '아이의 질문에 바로 답하기보다는 함께 생각해보는 시간을 가져보세요',
      '다양한 재료와 도구를 제공하여 창의적 놀이를 격려해보세요',
      '아이의 감정을 언어로 표현하도록 도와주세요'
    ]
  },
  developmentPlan: {
    shortTerm: [
      {
        goal: '아이 주도 놀이 증가',
        activities: ['자유놀이 시간 30분 확보', '아이의 아이디어 적극 수용', '기다림의 시간 연습'],
        timeframe: '2-4주'
      },
      {
        goal: '창의적 표현 지원',
        activities: ['다양한 미술 재료 제공', '상상놀이 격려', '아이의 작품 전시'],
        timeframe: '4-6주'
      }
    ],
    longTerm: [
      {
        goal: '자율성 발달 지원',
        activities: ['선택권 제공', '책임감 기르기', '문제해결 기회 제공'],
        timeframe: '3-6개월'
      },
      {
        goal: '사회성 발달 지원',
        activities: ['또래와의 놀이 기회 확대', '협력 놀이 경험', '감정 표현 훈련'],
        timeframe: '6-12개월'
      }
    ]
  }
};

// useSearchParams를 사용하는 별도의 클라이언트 컴포넌트
function ReportPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('sessionId');
  
  const [reportData, setReportData] = useState<ReportData>(mockReportData);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // 리포트 데이터 로드
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const handleDownloadReport = async () => {
    setIsGenerating(true);
    
    // PDF 생성 시뮬레이션
    setTimeout(() => {
      setIsGenerating(false);
      // 실제로는 PDF 생성 API 호출
      alert('리포트가 다운로드되었습니다!');
    }, 2000);
  };

  const handleBackToResults = () => {
    router.push(`/results?sessionId=${sessionId}`);
  };

  const getGradeColor = (grade: string) => {
    const gradeColors = {
      'A': 'bg-green-100 text-green-800 border-green-200',
      'B': 'bg-blue-100 text-blue-800 border-blue-200',
      'C': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'D': 'bg-red-100 text-red-800 border-red-200'
    };
    return gradeColors[grade as keyof typeof gradeColors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) {return 'text-green-600';}
    if (score >= 80) {return 'text-blue-600';}
    if (score >= 70) {return 'text-yellow-600';}
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) {return <CheckCircle className="w-5 h-5 text-green-600" />;}
    if (score >= 80) {return <Star className="w-5 h-5 text-blue-600" />;}
    if (score >= 70) {return <Info className="w-5 h-5 text-yellow-600" />;}
    return <AlertCircle className="w-5 h-5 text-red-600" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                리포트 생성 중...
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBackToResults}
            className="flex items-center gap-2 bg-white/80 hover:bg-white"
          >
            <ArrowLeft className="w-4 h-4" />
            분석 결과로 돌아가기
          </Button>
          
          <Button
            onClick={handleDownloadReport}
            disabled={isGenerating}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                PDF 다운로드
              </>
            )}
          </Button>
        </div>

        {/* 리포트 제목 */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <FileText className="w-8 h-8 text-blue-600" />
              <CardTitle className="text-3xl font-bold text-gray-900">
                놀이 상호작용 분석 리포트
              </CardTitle>
            </div>
            <div className="text-gray-600 space-y-1">
              <p>세션 ID: {reportData.sessionInfo.sessionId}</p>
              <p>분석 일자: {reportData.sessionInfo.analysisDate}</p>
              <p>영상 길이: {reportData.sessionInfo.videoDuration}</p>
              <p>참가자: {reportData.sessionInfo.participants.join(', ')}</p>
            </div>
          </CardHeader>
        </Card>

        {/* 종합 평가 */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              종합 평가
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">상호작용 질</span>
                  <div className="flex items-center gap-2">
                    {getScoreIcon(reportData.overallAssessment.interactionQuality)}
                    <span className={`font-semibold ${getScoreColor(reportData.overallAssessment.interactionQuality)}`}>
                      {reportData.overallAssessment.interactionQuality}점
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">발달 지원</span>
                  <div className="flex items-center gap-2">
                    {getScoreIcon(reportData.overallAssessment.developmentSupport)}
                    <span className={`font-semibold ${getScoreColor(reportData.overallAssessment.developmentSupport)}`}>
                      {reportData.overallAssessment.developmentSupport}점
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">놀이 환경</span>
                  <div className="flex items-center gap-2">
                    {getScoreIcon(reportData.overallAssessment.playEnvironment)}
                    <span className={`font-semibold ${getScoreColor(reportData.overallAssessment.playEnvironment)}`}>
                      {reportData.overallAssessment.playEnvironment}점
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">전체 점수</p>
                  <div className="flex items-center justify-center gap-3">
                    <span className={`text-4xl font-bold ${getScoreColor(reportData.overallAssessment.totalScore)}`}>
                      {reportData.overallAssessment.totalScore}
                    </span>
                    <Badge className={`text-lg px-3 py-1 ${getGradeColor(reportData.overallAssessment.grade)}`}>
                      {reportData.overallAssessment.grade}등급
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 상세 분석 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 강점 */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-green-700">
                <Heart className="w-5 h-5" />
                주요 강점
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {reportData.detailedAnalysis.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* 개선 사항 */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-blue-700">
                <Target className="w-5 h-5" />
                개선 사항
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {reportData.detailedAnalysis.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{improvement}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* 발달 목표 */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-purple-700">
              <Brain className="w-5 h-5" />
              발달 목표
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportData.detailedAnalysis.developmentGoals.map((goal, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Star className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{goal}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 권장사항 */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-orange-700">
              <Lightbulb className="w-5 h-5" />
              권장사항
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.detailedAnalysis.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-orange-600">{index + 1}</span>
                  </div>
                  <span className="text-sm text-gray-700">{recommendation}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 발달 계획 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 단기 계획 */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-blue-700">
                <Target className="w-5 h-5" />
                단기 계획 (2-6주)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.developmentPlan.shortTerm.map((plan, index) => (
                  <div key={index} className="border-l-4 border-blue-400 pl-4">
                    <h4 className="font-semibold text-gray-800 mb-2">{plan.goal}</h4>
                    <ul className="space-y-1">
                      {plan.activities.map((activity, actIndex) => (
                        <li key={actIndex} className="text-sm text-gray-600 flex items-start gap-1">
                          <span className="text-blue-400">•</span>
                          {activity}
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-gray-500 mt-2">기간: {plan.timeframe}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 장기 계획 */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-green-700">
                <Users className="w-5 h-5" />
                장기 계획 (3-12개월)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.developmentPlan.longTerm.map((plan, index) => (
                  <div key={index} className="border-l-4 border-green-400 pl-4">
                    <h4 className="font-semibold text-gray-800 mb-2">{plan.goal}</h4>
                    <ul className="space-y-1">
                      {plan.activities.map((activity, actIndex) => (
                        <li key={actIndex} className="text-sm text-gray-600 flex items-start gap-1">
                          <span className="text-green-400">•</span>
                          {activity}
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-gray-500 mt-2">기간: {plan.timeframe}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 추가 정보 */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>참고사항:</strong> 이 리포트는 AI 기반 분석 결과입니다. 
                더 정확한 평가를 위해 전문가 상담을 받으시기를 권장합니다.
                개별 아이의 발달 속도와 특성을 고려하여 적절히 조정해 주세요.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Loading fallback 컴포넌트
function ReportPageLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              리포트 로딩 중...
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
export default function ReportPage() {
  return (
    <Suspense fallback={<ReportPageLoading />}>
      <ReportPageContent />
    </Suspense>
  );
} 