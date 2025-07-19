'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
  RadialLinearScale,
} from 'chart.js';
import { 
  Calendar, 
  Clock, 
  Users, 
  TrendingUp,
  Brain,
  MessageCircle,
  Heart,
  Gamepad2,
  BarChart3,
  Activity,
  Award,
  Target,
  CheckCircle,
  AlertCircle,
  Info,
  Lightbulb,
  ArrowLeft
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Bar, Doughnut, Line, Pie, Radar } from 'react-chartjs-2';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlayAnalysisSession } from '@/lib/play-data-storage';

// Chart.js imports

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
  RadialLinearScale,
);

interface PlayInteractionDashboardProps {
  sessionId: string;
  sessionData?: PlayAnalysisSession;
}

interface ChartData {
  proximityData: number[];
  interactionData: { label: string; value: number; color: string }[];
  engagementData: { label: string; value: number; color: string }[];
  speechFrequencyData: { label: string; value: number }[];
  conversationLeadData: { label: string; value: number; color: string }[];
  toyUsageData: { label: string; value: number; color: string }[];
  attentionData: number[];
  developmentRadarData: { label: string; current: number; average: number }[];
}

interface DashboardMetrics {
  interactionQuality: number;
  developmentSupport: number;
  playEnvironment: number;
  totalParticipants: number;
  videoDuration: string;
  analysisDate: string;
  totalSpeech: number;
  dominantSpeaker: string;
  sceneChanges: number;
  objectsDetected: number;
  maxAttentionSpan: number;
  avgAttentionSpan: number;
}

export default function PlayInteractionDashboard({ sessionId, sessionData }: PlayInteractionDashboardProps) {
  const [activeTab, setActiveTab] = useState('physical');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 세션 데이터로부터 메트릭과 차트 데이터 생성
    const generateDashboardData = () => {
      if (!sessionData) {
        // 🚨 분석 실패 상태로 처리 - Mock 데이터 생성하지 않음
        setMetrics(null);
        setChartData(null);
        setIsLoading(false);
        return;
      }

      // 분석 상태 확인
      if (sessionData.metadata.status === 'error' || 
          sessionData.metadata.status === 'failed' ||
          !sessionData.analysis ||
          !sessionData.comprehensiveAnalysis) {
        // 🚨 분석 실패 상태
        setMetrics(null);
        setChartData(null);
        setIsLoading(false);
        return;
      }

      // 실제 세션 데이터로부터 메트릭 계산
      const analysis = sessionData.analysis;
      const metadata = sessionData.metadata;
      
      setMetrics({
        interactionQuality: analysis.overallScore || 75,
        developmentSupport: Math.round((analysis.overallScore || 75) * 0.9),
        playEnvironment: Math.round((analysis.overallScore || 75) * 1.1),
        totalParticipants: analysis.participantCount || 2,
        videoDuration: `${Math.round(analysis.videoDuration || 300 / 60)}분 ${Math.round((analysis.videoDuration || 300) % 60)}초`,
        analysisDate: new Date(metadata.analyzedAt).toLocaleDateString('ko-KR'),
        totalSpeech: 49, // Mock
        dominantSpeaker: '자녀(참석자 2)', // Mock
        sceneChanges: 8, // Mock
        objectsDetected: 12, // Mock
        maxAttentionSpan: 125, // Mock
        avgAttentionSpan: 45 // Mock
      });

      // 기본 차트 데이터 (실제 데이터 연결 필요)
      setChartData({
        proximityData: [0.8, 0.5, 0.3, 0.4, 0.6, 0.7],
        interactionData: [
          { label: '함께 놀기', value: 45, color: '#667eea' },
          { label: '병행 놀이', value: 25, color: '#764ba2' },
          { label: '개별 활동', value: 20, color: '#4299e1' },
          { label: '관찰하기', value: 10, color: '#f6ad55' }
        ],
        engagementData: [
          { label: '적극 참여', value: 55, color: '#48bb78' },
          { label: '수동 참여', value: 25, color: '#667eea' },
          { label: '관찰', value: 15, color: '#f6ad55' },
          { label: '비참여', value: 5, color: '#fc8181' }
        ],
        speechFrequencyData: [
          { label: '참석자 1 (부모)', value: 20 },
          { label: '참석자 2 (자녀)', value: 29 }
        ],
        conversationLeadData: [
          { label: '자녀 주도', value: 59, color: '#764ba2' },
          { label: '부모 주도', value: 41, color: '#667eea' }
        ],
        toyUsageData: [
          { label: '블록', value: 35, color: '#667eea' },
          { label: '인형', value: 25, color: '#764ba2' },
          { label: '공', value: 20, color: '#4299e1' },
          { label: '기타', value: 20, color: '#f6ad55' }
        ],
        attentionData: [3, 4, 5, 5, 4, 3, 4, 5, 5, 5, 4, 3, 2, 3, 4, 5, 4, 4, 3, 3],
        developmentRadarData: [
          { label: '신체발달', current: 8, average: 7 },
          { label: '인지발달', current: 7, average: 7 },
          { label: '언어발달', current: 7.5, average: 7 },
          { label: '사회성', current: 8, average: 7 },
          { label: '정서발달', current: 7, average: 7 }
        ]
      });
      
      setIsLoading(false);
    };

    generateDashboardData();
  }, [sessionData]);

  // 차트 공통 옵션
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  // 1. 근접성 차트 데이터
  const proximityChartData = {
    labels: ['0분', '1분', '2분', '3분', '4분', '5분'],
    datasets: [{
      label: '부모-자녀 거리',
      data: chartData?.proximityData || [],
      borderColor: '#667eea',
      backgroundColor: 'rgba(102, 126, 234, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  // 2. 상호작용 패턴 차트 데이터
  const interactionChartData = {
    labels: chartData?.interactionData.map(item => item.label) || [],
    datasets: [{
      label: '시간 비율 (%)',
      data: chartData?.interactionData.map(item => item.value) || [],
      backgroundColor: chartData?.interactionData.map(item => item.color) || []
    }]
  };

  // 3. 참여도 차트 데이터
  const engagementChartData = {
    labels: chartData?.engagementData.map(item => item.label) || [],
    datasets: [{
      data: chartData?.engagementData.map(item => item.value) || [],
      backgroundColor: chartData?.engagementData.map(item => item.color) || []
    }]
  };

  // 4. 장난감 사용 차트 데이터
  const toyUsageChartData = {
    labels: chartData?.toyUsageData.map(item => item.label) || [],
    datasets: [{
      data: chartData?.toyUsageData.map(item => item.value) || [],
      backgroundColor: chartData?.toyUsageData.map(item => item.color) || []
    }]
  };

  // 5. 역할 분담 차트 데이터
  const roleChartData = {
    labels: ['주도성', '반응성', '창의성', '협력성', '집중도'],
    datasets: [{
      label: '부모',
      data: [3, 5, 4, 5, 4],
      borderColor: '#667eea',
      backgroundColor: 'rgba(102, 126, 234, 0.2)'
    }, {
      label: '자녀',
      data: [5, 3, 4, 3, 3],
      borderColor: '#764ba2',
      backgroundColor: 'rgba(118, 75, 162, 0.2)'
    }]
  };

  // 6. 주의집중 차트 데이터
  const attentionChartData = {
    labels: Array.from({length: 20}, (_, i) => `${(i * 0.25).toFixed(1)}분`),
    datasets: [{
      label: '집중도',
      data: chartData?.attentionData || [],
      borderColor: '#48bb78',
      backgroundColor: 'rgba(72, 187, 120, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  // 7. 발달 레이더 차트 데이터
  const developmentRadarChartData = {
    labels: chartData?.developmentRadarData.map(item => item.label) || [],
    datasets: [{
      label: '현재 수준',
      data: chartData?.developmentRadarData.map(item => item.current) || [],
      borderColor: '#667eea',
      backgroundColor: 'rgba(102, 126, 234, 0.2)'
    }, {
      label: '연령 평균',
      data: chartData?.developmentRadarData.map(item => item.average) || [],
      borderColor: '#764ba2',
      backgroundColor: 'rgba(118, 75, 162, 0.2)',
      borderDash: [5, 5]
    }]
  };

  // 8. 발화 빈도 차트 데이터
  const speechFrequencyChartData = {
    labels: chartData?.speechFrequencyData.map(item => item.label) || [],
    datasets: [{
      label: '발화 횟수',
      data: chartData?.speechFrequencyData.map(item => item.value) || [],
      backgroundColor: ['#667eea', '#764ba2']
    }]
  };

  // 9. 대화 주도성 차트 데이터
  const conversationLeadChartData = {
    labels: chartData?.conversationLeadData.map(item => item.label) || [],
    datasets: [{
      data: chartData?.conversationLeadData.map(item => item.value) || [],
      backgroundColor: chartData?.conversationLeadData.map(item => item.color) || []
    }]
  };

  // 10. 상호작용 품질 차트 데이터
  const interactionQualityChartData = {
    labels: ['반응성', '지지성', '명확성', '참여도', '긍정성'],
    datasets: [{
      label: '언어적 상호작용 품질',
      data: [8, 7, 8, 9, 7],
      borderColor: '#4299e1',
      backgroundColor: 'rgba(66, 153, 225, 0.2)'
    }]
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div className="text-lg font-medium text-gray-600">대시보드를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  // 🚨 분석 실패 상태 처리
  if (!metrics || !chartData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl font-bold text-red-600 mb-2 flex items-center justify-center gap-3">
                <AlertCircle className="w-8 h-8" />
                분석 실패
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <div className="space-y-2">
                    <p className="font-semibold">영상 분석에 실패했습니다.</p>
                    <p className="text-sm">
                      영상에서 사람을 감지할 수 없어 놀이 상호작용 분석이 불가능합니다.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>

              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h3 className="text-blue-800 font-semibold mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  해결 방법
                </h3>
                <ul className="text-blue-700 text-sm space-y-1 list-disc list-inside">
                  <li>영상에 사람이 명확하게 보이는지 확인해주세요</li>
                  <li>영상 화질이 충분한지 확인해주세요</li>
                  <li>조명이 적절한지 확인해주세요</li>
                  <li>카메라가 사람 전체를 촬영하고 있는지 확인해주세요</li>
                </ul>
              </div>
              
              <div className="flex justify-center gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => window.history.back()}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  돌아가기
                </Button>
                <Button 
                  onClick={() => window.location.href = '/upload'}
                  className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                >
                  <Target className="w-4 h-4" />
                  새로운 분석 시작
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-3">🎯 부모-자녀 놀이 상호작용 분석 대시보드</h1>
          <div className="flex flex-wrap gap-6 text-sm opacity-90">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>분석일: {metrics.analysisDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>영상 길이: {metrics.videoDuration}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>참여자: 부모 1명, 자녀 1명</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* 종합 점수 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-xl">
            <CardContent className="p-6 text-center">
              <h2 className="text-lg font-semibold mb-2">상호작용 질 점수</h2>
              <div className="text-5xl font-bold mb-2">{metrics.interactionQuality}</div>
              <div className="text-sm opacity-90">/ 10점</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-xl">
            <CardContent className="p-6 text-center">
              <h2 className="text-lg font-semibold mb-2">발달 지원 수준</h2>
              <div className="text-5xl font-bold mb-2">{metrics.developmentSupport}</div>
              <div className="text-sm opacity-90">/ 10점</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-xl">
            <CardContent className="p-6 text-center">
              <h2 className="text-lg font-semibold mb-2">놀이 환경 최적화</h2>
              <div className="text-5xl font-bold mb-2">{metrics.playEnvironment}</div>
              <div className="text-sm opacity-90">/ 10점</div>
            </CardContent>
          </Card>
        </div>

        {/* 탭 컨테이너 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white shadow-md">
            <TabsTrigger value="physical" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              물리적 상호작용
            </TabsTrigger>
            <TabsTrigger value="emotional" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              감정적 상호작용
            </TabsTrigger>
            <TabsTrigger value="play-pattern" className="flex items-center gap-2">
              <Gamepad2 className="w-4 h-4" />
              놀이 패턴
            </TabsTrigger>
            <TabsTrigger value="development" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              발달 지표
            </TabsTrigger>
            <TabsTrigger value="language" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              언어적 상호작용
            </TabsTrigger>
          </TabsList>

          {/* 물리적 상호작용 탭 */}
          <TabsContent value="physical" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    근접성 분석
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 mb-4">
                    <Line data={proximityChartData} options={chartOptions} />
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                    <h3 className="text-blue-800 font-semibold mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      인사이트
                    </h3>
                    <p className="text-blue-700 text-sm">
                      부모와 자녀가 전체 시간의 65%를 가까운 거리에서 상호작용했습니다. 
                      특히 놀이 중반부에 밀접한 상호작용이 관찰되었습니다.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-600" />
                    활동성 수준
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">평균 움직임 속도</span>
                    <Badge variant="outline">중간</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">활동적 시간 비율</span>
                    <span className="font-bold text-green-600">72%</span>
                  </div>
                  <Progress value={72} className="h-2" />
                  <div className="flex justify-between items-center">
                    <span className="font-medium">정적 활동 시간</span>
                    <span className="font-bold text-blue-600">28%</span>
                  </div>
                  <Progress value={28} className="h-2" />
                  
                  {/* 히트맵 */}
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">활동성 히트맵</h4>
                    <div className="grid grid-cols-10 gap-1">
                      {Array.from({ length: 50 }, (_, i) => {
                        const intensity = Math.random();
                        return (
                          <div
                            key={i}
                            className={`aspect-square rounded ${
                              intensity > 0.7 ? 'bg-purple-500' :
                              intensity > 0.4 ? 'bg-purple-300' : 'bg-purple-100'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    상호작용 패턴
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Bar data={interactionChartData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-600" />
                    공간 활용도
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">이동 범위</span>
                    <Badge className="bg-green-100 text-green-800">넓음</Badge>
                  </div>
                  <Progress value={85} className="h-2" />
                  <div className="flex justify-between items-center">
                    <span className="font-medium">주 활동 영역</span>
                    <Badge variant="outline">중앙 및 좌측</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 감정적 상호작용 탭 */}
          <TabsContent value="emotional" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    얼굴 지향 행동
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">얼굴 감지 횟수</span>
                    <span className="font-bold text-blue-600">130회</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">평균 지속 시간</span>
                    <span className="font-bold text-green-600">2.3초</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">상호 응시 추정</span>
                    <Badge className="bg-green-100 text-green-800">높음</Badge>
                  </div>
                  <Progress value={78} className="h-2" />
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    참여도 지표
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Doughnut data={engagementChartData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-yellow-600" />
                    제스처 분석
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">큰 움직임</span>
                    <span className="font-bold text-blue-600">45회</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">손동작 추정</span>
                    <Badge className="bg-yellow-100 text-yellow-800">빈번함</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">모방 행동</span>
                    <span className="font-bold text-green-600">12회 관찰</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    반응성 측정
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">평균 반응 시간</span>
                    <span className="font-bold text-green-600">1.2초</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">동기화된 움직임</span>
                    <span className="font-bold text-blue-600">23회</span>
                  </div>
                  <Progress value={82} className="h-2" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 놀이 패턴 탭 */}
          <TabsContent value="play-pattern" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5 text-indigo-600" />
                    장난감 사용 분석
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">감지된 장난감</span>
                    <span className="font-bold text-blue-600">3종류</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">공유 놀이 시간</span>
                    <span className="font-bold text-green-600">68%</span>
                  </div>
                  <Progress value={68} className="h-2" />
                  <div className="flex justify-between items-center">
                    <span className="font-medium">개별 놀이 시간</span>
                    <span className="font-bold text-orange-600">32%</span>
                  </div>
                  <Progress value={32} className="h-2" />
                  
                  <div className="mt-4 h-48">
                    <Pie data={toyUsageChartData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    활동 전환점
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                      <Clock className="w-4 h-4 text-blue-600 mr-3" />
                      <div>
                        <span className="font-bold text-blue-600">0:45</span>
                        <span className="ml-2">새로운 장난감 도입</span>
                      </div>
                    </div>
                    <div className="flex items-center p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                      <Clock className="w-4 h-4 text-green-600 mr-3" />
                      <div>
                        <span className="font-bold text-green-600">2:15</span>
                        <span className="ml-2">활동 패턴 변화 감지</span>
                      </div>
                    </div>
                    <div className="flex items-center p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                      <Clock className="w-4 h-4 text-purple-600 mr-3" />
                      <div>
                        <span className="font-bold text-purple-600">3:30</span>
                        <span className="ml-2">협력 놀이 시작</span>
                      </div>
                    </div>
                    <div className="flex items-center p-3 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                      <Clock className="w-4 h-4 text-orange-600 mr-3" />
                      <div>
                        <span className="font-bold text-orange-600">4:50</span>
                        <span className="ml-2">활동 강도 증가</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-600" />
                    역할 분담
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 mb-4">
                    <Radar data={roleChartData} options={chartOptions} />
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                    <h3 className="text-green-800 font-semibold mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      인사이트
                    </h3>
                    <p className="text-green-700 text-sm">
                      부모가 주로 지원적 역할을 하며, 자녀의 주도성을 존중하는 패턴이 관찰됩니다.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-600" />
                    놀이 다양성
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">활동 유형 수</span>
                    <span className="font-bold text-blue-600">5가지</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">평균 지속 시간</span>
                    <span className="font-bold text-green-600">70초</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 발달 지표 탭 */}
          <TabsContent value="development" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    주의집중 분석
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-48 mb-4">
                    <Line data={attentionChartData} options={chartOptions} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">최장 집중 시간</span>
                    <span className="font-bold text-blue-600">{metrics.maxAttentionSpan}초</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">평균 집중 시간</span>
                    <span className="font-bold text-green-600">{metrics.avgAttentionSpan}초</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-600" />
                    신체 발달 지표
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">대근육 활동</span>
                        <Badge className="bg-green-100 text-green-800">활발함</Badge>
                      </div>
                      <Progress value={88} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">균형감</span>
                        <Badge className="bg-blue-100 text-blue-800">양호</Badge>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">협응성</span>
                        <Badge className="bg-yellow-100 text-yellow-800">발달 중</Badge>
                      </div>
                      <Progress value={70} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    사회성 발달
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">상호작용 빈도</span>
                    <Badge className="bg-green-100 text-green-800">높음</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">협력 행동</span>
                    <span className="font-bold text-blue-600">15회</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">모방 학습</span>
                    <Badge className="bg-blue-100 text-blue-800">관찰됨</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    종합 발달 평가
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Radar data={developmentRadarChartData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 언어적 상호작용 탭 */}
          <TabsContent value="language" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                    발화 빈도 분석
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-48 mb-4">
                    <Bar data={speechFrequencyChartData} options={chartOptions} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">총 발화 횟수</span>
                    <span className="font-bold text-blue-600">{metrics.totalSpeech}회</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">평균 발화 간격</span>
                    <span className="font-bold text-green-600">7.1초</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-600" />
                    대화 주도성
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-48 mb-4">
                    <Doughnut data={conversationLeadChartData} options={chartOptions} />
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                    <h3 className="text-blue-800 font-semibold mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      인사이트
                    </h3>
                    <p className="text-blue-700 text-sm">
                      {metrics.dominantSpeaker}가 대화를 더 많이 주도하며(59%), 부모는 반응적 대화 패턴을 보입니다.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    발화 특성 분석
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">질문 빈도</span>
                    <span className="font-bold text-blue-600">15회</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">지시/제안</span>
                    <span className="font-bold text-green-600">12회</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">감정 표현</span>
                    <span className="font-bold text-purple-600">8회</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">칭찬/격려</span>
                    <span className="font-bold text-orange-600">3회</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-orange-600" />
                    언어 발달 지표
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">문장 완성도</span>
                        <Badge className="bg-green-100 text-green-800">높음</Badge>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">어휘 다양성</span>
                        <Badge className="bg-blue-100 text-blue-800">적절함</Badge>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">상호작용 언어</span>
                        <Badge className="bg-yellow-100 text-yellow-800">발달 중</Badge>
                      </div>
                      <Progress value={70} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-600" />
                    주요 키워드
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center p-4">
                    <div className="flex flex-wrap justify-center gap-2">
                      <Badge className="text-lg px-3 py-1 bg-blue-100 text-blue-800">이렇게(12)</Badge>
                      <Badge className="text-base px-2 py-1 bg-purple-100 text-purple-800">유주야(8)</Badge>
                      <Badge className="text-sm px-2 py-1 bg-green-100 text-green-800">하자(6)</Badge>
                      <Badge className="text-sm px-2 py-1 bg-orange-100 text-orange-800">꽃(5)</Badge>
                      <Badge className="text-sm px-2 py-1 bg-blue-100 text-blue-800">색깔(5)</Badge>
                      <Badge className="text-xs px-2 py-1 bg-purple-100 text-purple-800">케이크(4)</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    상호작용 품질
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-48 mb-4">
                    <Radar data={interactionQualityChartData} options={chartOptions} />
                  </div>
                  <div className="bg-teal-50 p-4 rounded-lg border-l-4 border-teal-500">
                    <h3 className="text-teal-800 font-semibold mb-2 flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      언어적 상호작용 평가
                    </h3>
                    <ul className="text-teal-700 text-sm space-y-1">
                      <li>• 부모는 자녀의 말에 반응적으로 대답하며 지지적 태도를 보입니다</li>
                      <li>• 자녀는 자신의 의견을 적극적으로 표현하고 있습니다</li>
                      <li>• 갈등 상황에서 언어적 중재가 적절히 이루어졌습니다</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* 종합 권장사항 */}
        <Card className="mt-8 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Lightbulb className="w-6 h-6 text-yellow-500" />
              종합 권장사항
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
              <h3 className="text-green-800 font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                강점
              </h3>
              <ul className="text-green-700 space-y-2 text-sm">
                <li>• 부모와 자녀 간 활발한 신체적 상호작용이 관찰됩니다</li>
                <li>• 다양한 놀이 활동으로 전환이 자연스럽게 이루어집니다</li>
                <li>• 자녀의 주도성을 존중하는 부모의 반응적 태도가 긍정적입니다</li>
                <li>• 언어적 상호작용이 풍부하고 양방향 소통이 활발합니다</li>
                <li>• 갈등 상황에서 적절한 언어적 중재가 이루어졌습니다</li>
              </ul>
            </div>
            
            <div className="bg-orange-50 p-6 rounded-lg border-l-4 border-orange-500">
              <h3 className="text-orange-800 font-semibold mb-3 flex items-center gap-2">
                <Target className="w-5 h-5" />
                개선 제안
              </h3>
              <ul className="text-orange-700 space-y-2 text-sm">
                <li>• 한 가지 활동에 더 오래 집중할 수 있도록 지원해보세요</li>
                <li>• 칭찬과 격려 표현을 더 자주 사용해보세요 (현재 3회 → 목표 10회)</li>
                <li>• 자녀의 감정을 언어로 표현하도록 돕는 대화를 늘려보세요</li>
                <li>• 소근육 활동이 포함된 놀이를 추가해보세요</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 