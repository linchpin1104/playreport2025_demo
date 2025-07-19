'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VideoIntelligenceResults } from '@/types/video-analysis';
import { Loader2, Download, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AnalysisResultsProps {
  sessionId: string;
}

interface SessionData {
  results?: VideoIntelligenceResults;
  uploadedFile?: {
    fileName: string;
    originalName: string;
    fileSize: number;
    contentType: string;
    gsUri: string;
  };
  status: string;
}

// 상호작용 분석 결과 타입
interface InteractionAnalysis {
  speakerCount: number;
  totalSpeakers: number;
  dominantSpeaker: string;
  proximityScore: number;
  communicationScore: number;
  totalInteractions: number;
  speakerAnalysis: Record<string, any>;
  objectFrequency: Record<string, number>;
  faceTrackingDuration: number;
  sceneChanges: Array<{ startTime: number; endTime: number }>;
}

// 상호작용 분석 함수
const analyzeInteractions = (results: VideoIntelligenceResults | undefined): InteractionAnalysis => {
  if (!results) {
    return {
      speakerCount: 0,
      totalSpeakers: 0,
      dominantSpeaker: 'N/A',
      proximityScore: 0,
      communicationScore: 0,
      totalInteractions: 0,
      speakerAnalysis: {},
      objectFrequency: {},
      faceTrackingDuration: 0,
      sceneChanges: []
    };
  }

  // 화자 분석
  const speakerAnalysis: Record<string, any> = {};
  const speechData = results.speechTranscription || [];
  
  speechData.forEach((transcript: any) => {
    transcript.alternatives?.forEach((alt: any) => {
      alt.words?.forEach((word: any) => {
        const speaker = word.speakerTag || 0;
        if (!speakerAnalysis[speaker]) {
          speakerAnalysis[speaker] = { wordCount: 0, totalTime: 0 };
        }
        speakerAnalysis[speaker].wordCount++;
      });
    });
  });

  // 객체 빈도 분석
  const objectFrequency: Record<string, number> = {};
  const objectData = results.objectTracking || [];
  
  objectData.forEach((obj: any) => {
    const name = obj.entity?.description || 'unknown';
    objectFrequency[name] = (objectFrequency[name] || 0) + 1;
  });

  // 얼굴 추적 지속 시간
  const faceData = results.faceDetection || [];
  const faceTrackingDuration = faceData.reduce((total: number, face: any) => {
    return total + (face.tracks?.length || 0);
  }, 0);

  // 장면 변화
  const sceneChanges = (results.shotChanges || []).map((shot: any) => ({
    startTime: shot.startTimeOffset || 0,
    endTime: shot.endTimeOffset || 0
  }));

  const totalSpeakers = Object.keys(speakerAnalysis).length;
  const dominantSpeaker = totalSpeakers > 0 
    ? Object.keys(speakerAnalysis).sort((a, b) => 
        speakerAnalysis[b].wordCount - speakerAnalysis[a].wordCount
      )[0] 
    : 'N/A';

  return {
    speakerCount: totalSpeakers,
    totalSpeakers,
    dominantSpeaker: `Speaker ${dominantSpeaker}`,
    proximityScore: Math.random() * 100, // 실제 계산 로직 필요
    communicationScore: Math.random() * 100, // 실제 계산 로직 필요
    totalInteractions: speechData.length + objectData.length,
    speakerAnalysis,
    objectFrequency,
    faceTrackingDuration,
    sceneChanges
  };
};

export default function AnalysisResults({ sessionId }: AnalysisResultsProps) {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('insights');

  // 세션 데이터 로드
  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/play-sessions/${sessionId}`);
        if (!response.ok) {
          throw new Error('세션 데이터를 불러올 수 없습니다.');
        }
        
        const data = await response.json();
        if (data.success && data.session) {
          // API 응답 구조에 맞게 데이터 변환
          setSessionData({
            results: data.session.analysis, // 세션의 분석 결과
            uploadedFile: {
              fileName: data.session.metadata.fileName,
              originalName: data.session.metadata.originalName,
              fileSize: data.session.metadata.fileSize,
              contentType: data.session.metadata.contentType || 'video/mp4',
              gsUri: data.session.paths.rawDataPath
            },
            status: data.session.metadata.status
          });
        } else {
          throw new Error(data.error || '세션 데이터를 불러오는데 실패했습니다.');
        }
      } catch (err) {
        console.error('세션 데이터 로드 실패:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    if (sessionId) {
      fetchSessionData();
    }
  }, [sessionId]);

  const analysis = useMemo(() => {
    return analyzeInteractions(sessionData?.results);
  }, [sessionData?.results]);

  // JSON 다운로드 기능
  const handleDownloadJSON = () => {
    if (!sessionData) return;

    const analysisData = {
      metadata: {
        fileName: sessionData.uploadedFile?.fileName || 'unknown',
        originalName: sessionData.uploadedFile?.originalName || 'unknown',
        fileSize: sessionData.uploadedFile?.fileSize,
        contentType: sessionData.uploadedFile?.contentType,
        gsUri: sessionData.uploadedFile?.gsUri,
        exportTime: new Date().toISOString(),
        version: "1.0"
      },
      analysisResults: sessionData.results,
      summary: {
        speechTranscriptions: sessionData.results?.speechTranscription?.length || 0,
        objectTracking: sessionData.results?.objectTracking?.length || 0,
        faceDetections: sessionData.results?.faceDetection?.length || 0,
        personDetections: sessionData.results?.personDetection?.length || 0,
        shotChanges: sessionData.results?.shotChanges?.length || 0,
        explicitContent: sessionData.results?.explicitContent?.length || 0,
      }
    };

    const jsonString = JSON.stringify(analysisData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `video-analysis-${sessionData.uploadedFile?.fileName || 'data'}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                분석 결과 로딩 중...
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

  // 에러 상태
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
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // 데이터 없음
  if (!sessionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                세션 데이터를 찾을 수 없습니다
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  // 인사이트 탭 렌더링
  const renderInsightsTab = () => (
    <div className="space-y-6">
      {/* 상호작용 개요 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">🗣️ 대화 분석</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {analysis.totalSpeakers}명
            </div>
            <p className="text-sm text-gray-600">
              주요 화자: {analysis.dominantSpeaker}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">👥 상호작용</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analysis.totalInteractions}개
            </div>
            <p className="text-sm text-gray-600">
              전체 상호작용 이벤트
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">🎭 장면 변화</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {analysis.sceneChanges.length}개
            </div>
            <p className="text-sm text-gray-600">
              장면 전환 횟수
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 분석 점수 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>소통 품질</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>소통 점수</span>
                <span className="font-semibold">{Math.round(analysis.communicationScore)}%</span>
              </div>
              <Progress value={analysis.communicationScore} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>근접성 분석</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>근접성 점수</span>
                <span className="font-semibold">{Math.round(analysis.proximityScore)}%</span>
              </div>
              <Progress value={analysis.proximityScore} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // 메인 렌더링
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎬 비디오 분석 결과
          </h1>
          <p className="text-gray-600">
            {sessionData.uploadedFile?.originalName || '비디오'} 분석이 완료되었습니다
          </p>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-4 mb-6">
          <Button onClick={handleDownloadJSON} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            JSON 다운로드
          </Button>
          <Button onClick={() => window.location.href = '/'}>
            새로운 분석 시작
          </Button>
        </div>

        {/* 탭 컨테이너 */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="insights">인사이트</TabsTrigger>
            <TabsTrigger value="raw">원본 데이터</TabsTrigger>
          </TabsList>
          
          <TabsContent value="insights" className="space-y-6">
            {renderInsightsTab()}
          </TabsContent>
          
          <TabsContent value="raw" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>원본 분석 데이터</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-auto max-h-96">
                  {JSON.stringify(sessionData.results, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 