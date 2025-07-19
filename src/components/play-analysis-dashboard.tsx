'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlayAnalysisCore } from '@/lib/play-analysis-extractor';
import { PlayAnalysisSession } from '@/types';

/**
 * 놀이 분석 결과 대시보드
 */

interface PlayAnalysisDashboardProps {
  sessionId: string;
}

export default function PlayAnalysisDashboard({ sessionId }: PlayAnalysisDashboardProps) {
  const [analysisData, setAnalysisData] = useState<PlayAnalysisCore | null>(null);
  const [sessionData, setSessionData] = useState<PlayAnalysisSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // useCallback으로 함수 정의
  const loadAnalysisData = useCallback(async () => {
    try {
      setLoading(true);
      
      // 세션 데이터 로드
      const sessionResponse = await fetch(`/api/play-sessions/${sessionId}`);
      const sessionResult = await sessionResponse.json();
      
      if (sessionResult.success) {
        setSessionData(sessionResult.session);
        
        // 분석 데이터 로드
        const analysisResponse = await fetch(`/api/play-sessions/${sessionId}/analysis`);
        const analysisResult = await analysisResponse.json();
        
        if (analysisResult.success) {
          setAnalysisData(analysisResult.analysis);
        } else {
          setError('분석 데이터를 불러오는데 실패했습니다.');
        }
      } else {
        setError('세션 데이터를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      console.error('데이터 로드 오류:', err);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadAnalysisData();
  }, [loadAnalysisData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">분석 결과를 불러오는 중...</div>
      </div>
    );
  }

  if (!analysisData || !sessionData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">분석 데이터를 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 정보 */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
        <h1 className="text-2xl font-bold mb-2">놀이 상호작용 분석 결과</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm opacity-90">비디오 파일</p>
            <p className="font-semibold">{sessionData.metadata.originalName}</p>
          </div>
          <div>
            <p className="text-sm opacity-90">분석 일시</p>
            <p className="font-semibold">
              {new Date(sessionData.metadata.analyzedAt).toLocaleDateString('ko-KR')}
            </p>
          </div>
          <div>
            <p className="text-sm opacity-90">비디오 길이</p>
            <p className="font-semibold">
              {Math.round(analysisData.metadata.videoDuration || 0)}초
            </p>
          </div>
        </div>
      </div>

      {/* 주요 지표 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard
          title="전체 안전성"
          score={analysisData.safetyMetrics.overallSafetyScore}
          color="green"
          description="놀이 환경의 안전성 수준"
        />
        <ScoreCard
          title="상호작용 근접성"
          score={analysisData.participants.interactionMetrics.proximityScore}
          color="blue"
          description="부모-자녀 간 물리적 근접성"
        />
        <ScoreCard
          title="감정적 참여도"
          score={analysisData.emotionalIndicators.faceDetection.faceEngagementScore}
          color="purple"
          description="얼굴 표정 기반 참여도"
        />
        <ScoreCard
          title="장면 연속성"
          score={analysisData.temporalAnalysis.continuityScore}
          color="orange"
          description="집중도 및 일관성 지표"
        />
      </div>

      {/* 상세 분석 탭 */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="participants">참여자</TabsTrigger>
          <TabsTrigger value="objects">놀이 객체</TabsTrigger>
          <TabsTrigger value="emotions">감정 분석</TabsTrigger>
          <TabsTrigger value="timeline">시간 분석</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <OverviewTab coreData={analysisData} sessionData={sessionData} />
        </TabsContent>

        <TabsContent value="participants" className="space-y-4">
          <ParticipantsTab coreData={analysisData} />
        </TabsContent>

        <TabsContent value="objects" className="space-y-4">
          <ObjectsTab coreData={analysisData} />
        </TabsContent>

        <TabsContent value="emotions" className="space-y-4">
          <EmotionsTab coreData={analysisData} />
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <TimelineTab coreData={analysisData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * 점수 카드 컴포넌트
 */
function ScoreCard({ 
  title, 
  score, 
  color, 
  description 
}: { 
  title: string; 
  score: number; 
  color: string; 
  description: string;
}) {
  const percentage = Math.round(score * 100);
  const colorClasses = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500'
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-2">{percentage}%</div>
        <Progress value={percentage} className="h-2 mb-2" />
        <p className="text-xs text-gray-600">{description}</p>
      </CardContent>
    </Card>
  );
}

/**
 * 개요 탭
 */
function OverviewTab({ 
  coreData, 
  sessionData 
}: { 
  coreData: PlayAnalysisCore; 
  sessionData: PlayAnalysisSession;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>분석 요약</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold">참여자 수</p>
              <p>{coreData.participants.count}명</p>
            </div>
            <div>
              <p className="font-semibold">놀이 객체 수</p>
              <p>{coreData.playObjects.totalObjectCount}개</p>
            </div>
            <div>
              <p className="font-semibold">얼굴 감지 횟수</p>
              <p>{coreData.emotionalIndicators.faceDetection.detectionCount}회</p>
            </div>
            <div>
              <p className="font-semibold">대면 상호작용</p>
              <p>{coreData.emotionalIndicators.faceDetection.faceToFaceInteractions}회</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>상호작용 품질</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">상호작용 빈도</span>
                <span className="text-sm font-medium">
                  {Math.round(coreData.participants.interactionMetrics.interactionFrequency * 100)}%
                </span>
              </div>
              <Progress value={coreData.participants.interactionMetrics.interactionFrequency * 100} />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">동기화 수준</span>
                <span className="text-sm font-medium">
                  {Math.round(coreData.participants.interactionMetrics.synchronizationLevel * 100)}%
                </span>
              </div>
              <Progress value={coreData.participants.interactionMetrics.synchronizationLevel * 100} />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">상호 참여도</span>
                <span className="text-sm font-medium">
                  {Math.round(coreData.participants.interactionMetrics.roleDistribution.mutualEngagement * 100)}%
                </span>
              </div>
              <Progress value={coreData.participants.interactionMetrics.roleDistribution.mutualEngagement * 100} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * 참여자 탭
 */
function ParticipantsTab({ coreData }: { coreData: PlayAnalysisCore }) {
  return (
    <div className="space-y-4">
      {coreData.participants.trackingData.map((participant, index) => (
        <Card key={participant.participantId}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full ${
                participant.role === 'parent' ? 'bg-blue-500' : 'bg-green-500'
              }`} />
              {participant.role === 'parent' ? '부모' : '자녀'} ({participant.participantId})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium">추적 프레임 수</p>
                <p className="text-2xl font-bold">{participant.trackingFrames.length}</p>
              </div>
              <div>
                <p className="text-sm font-medium">활동 수준</p>
                <p className="text-2xl font-bold">
                  {Math.round(participant.movementMetrics.activityLevel * 100)}%
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">움직임 범위</p>
                <p className="text-sm">
                  X: {(participant.movementMetrics.movementRange.xVariance * 100).toFixed(1)}% / 
                  Y: {(participant.movementMetrics.movementRange.yVariance * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * 놀이 객체 탭
 */
function ObjectsTab({ coreData }: { coreData: PlayAnalysisCore }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>놀이 객체 참여도</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">다양성 점수</span>
                <span className="text-sm font-medium">
                  {Math.round(coreData.playObjects.engagementMetrics.diversityScore * 100)}%
                </span>
              </div>
              <Progress value={coreData.playObjects.engagementMetrics.diversityScore * 100} />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">공유 빈도</span>
                <span className="text-sm font-medium">
                  {Math.round(coreData.playObjects.engagementMetrics.sharingFrequency * 100)}%
                </span>
              </div>
              <Progress value={coreData.playObjects.engagementMetrics.sharingFrequency * 100} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {coreData.playObjects.toys.map((toy, index) => (
          <Card key={toy.objectId}>
            <CardHeader>
              <CardTitle className="text-lg">{toy.objectType}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">사용 시간</span>
                  <span className="text-sm font-medium">{toy.usageMetrics.totalUsageTime.toFixed(1)}초</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">참여도</span>
                  <span className="text-sm font-medium">
                    {Math.round(toy.usageMetrics.engagementLevel * 100)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">공유 가능성</span>
                  <span className="text-sm font-medium">
                    {Math.round(toy.usageMetrics.shareability * 100)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

/**
 * 감정 분석 탭
 */
function EmotionsTab({ coreData }: { coreData: PlayAnalysisCore }) {
  const { emotionalEngagement } = coreData.emotionalIndicators;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>부모 감정 상태</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">긍정성</span>
                <span className="text-sm font-medium">
                  {Math.round(emotionalEngagement.parentEmotionalState.positivity * 100)}%
                </span>
              </div>
              <Progress value={emotionalEngagement.parentEmotionalState.positivity * 100} />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">반응성</span>
                <span className="text-sm font-medium">
                  {Math.round(emotionalEngagement.parentEmotionalState.responsiveness * 100)}%
                </span>
              </div>
              <Progress value={emotionalEngagement.parentEmotionalState.responsiveness * 100} />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">인내심</span>
                <span className="text-sm font-medium">
                  {Math.round(emotionalEngagement.parentEmotionalState.patience * 100)}%
                </span>
              </div>
              <Progress value={emotionalEngagement.parentEmotionalState.patience * 100} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>자녀 감정 상태</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">즐거움</span>
                <span className="text-sm font-medium">
                  {Math.round(emotionalEngagement.childEmotionalState.joy * 100)}%
                </span>
              </div>
              <Progress value={emotionalEngagement.childEmotionalState.joy * 100} />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">호기심</span>
                <span className="text-sm font-medium">
                  {Math.round(emotionalEngagement.childEmotionalState.curiosity * 100)}%
                </span>
              </div>
              <Progress value={emotionalEngagement.childEmotionalState.curiosity * 100} />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">좌절감</span>
                <span className="text-sm font-medium">
                  {Math.round(emotionalEngagement.childEmotionalState.frustration * 100)}%
                </span>
              </div>
              <Progress value={emotionalEngagement.childEmotionalState.frustration * 100} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>감정 동기화</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">
              {Math.round(emotionalEngagement.emotionalSynchrony * 100)}%
            </div>
            <Progress value={emotionalEngagement.emotionalSynchrony * 100} className="mb-2" />
            <p className="text-sm text-gray-600">
              부모와 자녀 간 감정 상태의 동기화 정도
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * 시간 분석 탭
 */
function TimelineTab({ coreData }: { coreData: PlayAnalysisCore }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>시간대별 활동 수준</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {coreData.spatialAnalysis.activityLevels.timeBasedActivity.map((activity, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-16 text-sm">
                  {Math.round(activity.timeOffset)}초
                </div>
                <div className="flex-1">
                  <Progress value={activity.activityLevel * 100} />
                </div>
                <div className="w-12 text-sm text-right">
                  {Math.round(activity.activityLevel * 100)}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>최고 상호작용 구간</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {coreData.temporalAnalysis.peakInteractionPeriods.map((period, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">
                      {Math.round(period.timeOffset)}초 - {Math.round(period.timeOffset + period.duration)}초
                    </p>
                    <p className="text-sm text-gray-600">
                      {period.interactionType === 'mixed' ? '복합 상호작용' : 
                       period.interactionType === 'physical' ? '물리적 상호작용' : 
                       period.interactionType === 'verbal' ? '언어적 상호작용' : '객체 기반 상호작용'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{Math.round(period.intensity * 100)}%</p>
                    <p className="text-sm text-gray-600">강도</p>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span>지속 시간: {period.duration}초</span>
                  <span>품질 점수: {Math.round(period.qualityScore * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 