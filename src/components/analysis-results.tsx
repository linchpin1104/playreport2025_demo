'use client';

import React, { useState, useMemo } from 'react';
import { VideoIntelligenceResults, FileUploadResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AnalysisResultsProps {
  results: VideoIntelligenceResults;
  uploadedFile: FileUploadResponse | null;
  onGenerateReport: () => void;
  onReset: () => void;
}

// 상세 분석 결과 타입
interface DetailedAnalysisResult {
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
    proximityRatio: number;
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

// Helper function to format time objects
const formatTime = (timeObj: any): string => {
  if (!timeObj) return 'N/A';
  
  // Handle different time object formats
  if (typeof timeObj === 'object' && timeObj.seconds !== undefined) {
    const seconds = parseInt(timeObj.seconds || 0);
    const nanos = parseInt(timeObj.nanos || 0);
    const totalSeconds = seconds + nanos / 1000000000;
    
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = Math.floor(totalSeconds % 60);
    const milliseconds = Math.floor((totalSeconds % 1) * 1000);
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  }
  
  // Handle string formats
  if (typeof timeObj === 'string') {
    return timeObj;
  }
  
  return 'N/A';
};

// 상호작용 분석을 위한 유틸리티 함수들
const analyzeInteractions = (results: VideoIntelligenceResults) => {
  // 화자 구분 분석
  const speakerAnalysis = results.speechTranscription.reduce((acc, transcript) => {
    transcript.alternatives?.forEach(alt => {
      alt.words?.forEach(word => {
        const speaker = word.speakerTag || 0;
        if (!acc[speaker]) {
          acc[speaker] = { wordCount: 0, totalTime: 0, segments: [] };
        }
        acc[speaker].wordCount++;
        if (word.startTime && word.endTime) {
          // Handle both string and object formats for time
          const start = typeof word.startTime === 'string' 
            ? parseFloat(word.startTime.replace('s', ''))
            : ((word.startTime as any).seconds || 0) + ((word.startTime as any).nanos || 0) / 1000000000;
          const end = typeof word.endTime === 'string'
            ? parseFloat(word.endTime.replace('s', ''))
            : ((word.endTime as any).seconds || 0) + ((word.endTime as any).nanos || 0) / 1000000000;
          acc[speaker].totalTime += (end - start);
        }
      });
    });
    return acc;
  }, {} as Record<number, { wordCount: number; totalTime: number; segments: any[] }>);

  // 가장 많이 감지된 객체들
  const objectFrequency = results.objectTracking.reduce((acc, obj) => {
    const name = obj.entity?.description || 'Unknown';
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 얼굴 감지 시간 분석
  const faceTrackingDuration = results.faceDetection.reduce((total, face) => {
    return total + (face.tracks?.length || 0);
  }, 0);

  // 장면 전환 빈도 (놀이 패턴 변화)
  const sceneChanges = results.shotChanges.length;
  
  return {
    speakerAnalysis,
    objectFrequency,
    faceTrackingDuration,
    sceneChanges,
    totalSpeakers: Object.keys(speakerAnalysis).length,
    dominantSpeaker: Object.entries(speakerAnalysis).sort(([,a], [,b]) => b.wordCount - a.wordCount)[0]?.[0] || 'none'
  };
};

export default function AnalysisResults({ 
  results, 
  uploadedFile, 
  onGenerateReport, 
  onReset 
}: AnalysisResultsProps) {
  const [detailedAnalysis, setDetailedAnalysis] = useState<DetailedAnalysisResult | null>(null);
  const [isLoadingDetailedAnalysis, setIsLoadingDetailedAnalysis] = useState(false);
  const [detailedAnalysisError, setDetailedAnalysisError] = useState<string | null>(null);
  
  // JSON 다운로드 기능
  const handleDownloadJSON = () => {
    const analysisData = {
      metadata: {
        fileName: uploadedFile?.fileName || 'unknown',
        originalName: uploadedFile?.originalName || 'unknown',
        fileSize: uploadedFile?.fileSize,
        contentType: uploadedFile?.contentType,
        gsUri: uploadedFile?.gsUri,
        exportTime: new Date().toISOString(),
        version: "1.0"
      },
      analysisResults: results,
      summary: {
        speechTranscriptions: results.speechTranscription.length,
        objectTracking: results.objectTracking.length,
        faceDetections: results.faceDetection.length,
        personDetections: results.personDetection.length,
        shotChanges: results.shotChanges.length,
        explicitContent: results.explicitContent.length,
      }
    };

    const jsonString = JSON.stringify(analysisData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `video-analysis-${uploadedFile?.fileName || 'data'}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 상세 분석 실행 함수
  const handleDetailedAnalysis = async () => {
    setIsLoadingDetailedAnalysis(true);
    setDetailedAnalysisError(null);
    
    try {
      const response = await fetch('/api/detailed-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysisResults: results,
          metadata: {
            fileName: uploadedFile?.fileName || 'unknown',
            originalName: uploadedFile?.originalName || 'unknown',
            fileSize: uploadedFile?.fileSize,
            contentType: uploadedFile?.contentType,
            gsUri: uploadedFile?.gsUri,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setDetailedAnalysis(data.detailedAnalysis);
        setSelectedTab('detailed'); // 상세 분석 탭으로 자동 이동
      } else {
        setDetailedAnalysisError(data.error || '상세 분석 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('상세 분석 오류:', error);
      setDetailedAnalysisError('상세 분석 중 오류가 발생했습니다.');
    } finally {
      setIsLoadingDetailedAnalysis(false);
    }
  };

  const [selectedTab, setSelectedTab] = useState('insights');

  const analysis = useMemo(() => analyzeInteractions(results), [results]);

  const renderInsightsTab = () => (
    <div className="space-y-6">
      {/* 상호작용 개요 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">🗣️ 대화 분석</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">화자 수:</span>
                <span className="font-medium">{analysis.totalSpeakers}명</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">주도 화자:</span>
                <span className="font-medium">
                  {analysis.dominantSpeaker === '0' ? '화자 1' : 
                   analysis.dominantSpeaker === '1' ? '화자 2' : '미확인'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">총 발화량:</span>
                <span className="font-medium">
                  {Object.values(analysis.speakerAnalysis).reduce((sum, s) => sum + s.wordCount, 0)}단어
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">👁️ 시선 추적</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">얼굴 감지:</span>
                <span className="font-medium">{results.faceDetection.length}개 구간</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">추적 지속성:</span>
                <span className="font-medium">{analysis.faceTrackingDuration}프레임</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">상호 응시도:</span>
                <span className="font-medium">
                  {results.faceDetection.length > 1 ? '높음' : results.faceDetection.length === 1 ? '보통' : '낮음'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">🎮 놀이 패턴</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">활동 전환:</span>
                <span className="font-medium">{analysis.sceneChanges}회</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">놀이 유형:</span>
                <span className="font-medium">
                  {analysis.sceneChanges > 10 ? '활동적' : analysis.sceneChanges > 5 ? '보통' : '정적'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">집중도:</span>
                <span className="font-medium">
                  {analysis.sceneChanges < 5 ? '높음' : analysis.sceneChanges < 10 ? '보통' : '낮음'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 화자별 상세 분석 */}
      {Object.keys(analysis.speakerAnalysis).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>화자별 참여도 분석</CardTitle>
            <CardDescription>각 화자의 발화량과 참여 시간을 비교분석합니다</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analysis.speakerAnalysis).map(([speaker, data]) => (
                <div key={speaker} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">
                      {speaker === '0' ? '🧑 화자 1 (부모 추정)' : '👶 화자 2 (아이 추정)'}
                    </h4>
                    <span className="text-sm text-gray-500">
                      {((data.wordCount / Object.values(analysis.speakerAnalysis).reduce((sum, s) => sum + s.wordCount, 0)) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">발화량: </span>
                      <span className="font-medium">{data.wordCount}단어</span>
                    </div>
                    <div>
                      <span className="text-gray-600">발화 시간: </span>
                      <span className="font-medium">{data.totalTime.toFixed(1)}초</span>
                    </div>
                  </div>
                  <div className="mt-3 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${speaker === '0' ? 'bg-blue-500' : 'bg-green-500'}`}
                      style={{ 
                        width: `${(data.wordCount / Object.values(analysis.speakerAnalysis).reduce((sum, s) => sum + s.wordCount, 0)) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 놀이 객체 분석 */}
      {Object.keys(analysis.objectFrequency).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>놀이 도구 및 객체 분석</CardTitle>
            <CardDescription>영상에서 감지된 객체들과 상호작용 빈도</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(analysis.objectFrequency)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 6)
                .map(([object, frequency]) => (
                <div key={object} className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm font-medium">{object}</div>
                  <div className="text-xs text-gray-600">{frequency}회 감지</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderDetailedTab = (tabKey: string) => {
    switch(tabKey) {
      case 'detailed':
        return (
          <div className="space-y-6">
            {detailedAnalysisError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                <strong>오류:</strong> {detailedAnalysisError}
              </div>
            )}
            
            {!detailedAnalysis && !detailedAnalysisError && (
              <div className="text-center py-8 text-gray-500">
                <p>상세 분석 버튼을 클릭하여 놀이 상호작용에 대한 상세한 분석을 확인하세요.</p>
              </div>
            )}
            
            {detailedAnalysis && (
              <div className="space-y-6">
                {/* 감정 분석 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">😊 감정 분석</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">웃는 표정 감지</h4>
                        <p className="text-2xl font-bold text-green-600">{detailedAnalysis.emotionalAnalysis.smilingDetections}회</p>
                        <p className="text-sm text-gray-600">전체 프레임 대비 {detailedAnalysis.emotionalAnalysis.childSmilingRatio.toFixed(1)}%</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">카메라 응시</h4>
                        <p className="text-2xl font-bold text-blue-600">{detailedAnalysis.emotionalAnalysis.lookingAtCameraDetections}회</p>
                        <p className="text-sm text-gray-600">카메라를 향한 시선 감지</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 공간 분석 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">📏 공간 분석</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">평균 거리</h4>
                        <p className="text-2xl font-bold text-purple-600">{detailedAnalysis.spatialAnalysis.averageDistance.toFixed(3)}</p>
                        <p className="text-sm text-gray-600">부모-아이 간 거리</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">가장 가까운 거리</h4>
                        <p className="text-2xl font-bold text-green-600">{detailedAnalysis.spatialAnalysis.minDistance.toFixed(3)}</p>
                        <p className="text-sm text-gray-600">최소 거리</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">근접 비율</h4>
                        <p className="text-2xl font-bold text-orange-600">{detailedAnalysis.spatialAnalysis.proximityRatio.toFixed(1)}%</p>
                        <p className="text-sm text-gray-600">가까운 거리 유지 시간</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 활동성 분석 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">🏃 활동성 분석</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">활동 수준</h4>
                        <p className={`text-2xl font-bold ${
                          detailedAnalysis.activityAnalysis.childActivityLevel === 'dynamic' ? 'text-red-600' :
                          detailedAnalysis.activityAnalysis.childActivityLevel === 'moderate' ? 'text-yellow-600' :
                          'text-blue-600'
                        }`}>
                          {detailedAnalysis.activityAnalysis.childActivityLevel === 'dynamic' ? '동적' :
                           detailedAnalysis.activityAnalysis.childActivityLevel === 'moderate' ? '보통' : '정적'}
                        </p>
                        <p className="text-sm text-gray-600">아이의 움직임 패턴</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">움직임 점수</h4>
                        <p className="text-2xl font-bold text-indigo-600">{detailedAnalysis.activityAnalysis.movementScore.toFixed(1)}</p>
                        <p className="text-sm text-gray-600">활동 강도 측정</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 상호작용 분석 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">🧸 장난감 상호작용</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">상호작용 비율</h4>
                        <p className="text-2xl font-bold text-green-600">{detailedAnalysis.interactionAnalysis.toyInteractionRatio.toFixed(1)}%</p>
                        <p className="text-sm text-gray-600">장난감과 접촉한 시간</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">감지된 장난감</h4>
                        <p className="text-lg font-medium text-blue-600">{detailedAnalysis.interactionAnalysis.detectedToys.length}개</p>
                        <p className="text-sm text-gray-600">{detailedAnalysis.interactionAnalysis.detectedToys.slice(0, 3).join(', ')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 최적 놀이 시간 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">⭐ 최적 놀이 시간</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">전체 참여도 점수</h4>
                        <p className="text-3xl font-bold text-purple-600">{detailedAnalysis.optimalPlayTime.overallEngagementScore}/100</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">최적 시간대</h4>
                        <div className="space-y-2">
                          {detailedAnalysis.optimalPlayTime.bestPeriods.map((period, index) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <span className="font-medium">{period.startTime} - {period.endTime}</span>
                              <span className="text-sm text-gray-600">{period.reason}</span>
                              <span className="font-bold text-green-600">{period.score}점</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        );
      case 'speech':
        return (
          <div className="space-y-3">
            <h4 className="font-semibold">음성 전사 및 화자 분리 결과</h4>
            {results.speechTranscription.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {results.speechTranscription.map((transcript, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="space-y-2">
                      {transcript.alternatives?.map((alt, altIndex) => (
                        <div key={altIndex}>
                          <p className="text-sm font-medium">{alt.transcript}</p>
                          <div className="text-xs text-gray-500 flex flex-wrap gap-4">
                            <span>신뢰도: {((alt.confidence || 0) * 100).toFixed(1)}%</span>
                            <span>단어 수: {alt.words?.length || 0}</span>
                            {alt.words?.length && alt.words.length > 0 && (
                              <span>화자 분포: {Array.from(new Set(alt.words.map(w => w.speakerTag))).join(', ')}</span>
                            )}
                          </div>
                          {alt.words && alt.words.length > 0 && (
                            <div className="mt-2 text-xs">
                              <details>
                                <summary className="cursor-pointer text-gray-600 hover:text-gray-800">단어별 화자 정보</summary>
                                <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                                  {alt.words.slice(0, 20).map((word, wordIndex) => (
                                    <div key={wordIndex} className="text-xs">
                                      <span className={`px-1 rounded ${word.speakerTag === 0 ? 'bg-blue-100' : 'bg-green-100'}`}>
                                        {word.word}
                                      </span>
                                      <span className="text-gray-500 ml-1">S{word.speakerTag}</span>
                                    </div>
                                  ))}
                                </div>
                              </details>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">음성 전사 결과가 없습니다.</p>
            )}
          </div>
        );

      case 'objects':
        return (
          <div className="space-y-3">
            <h4 className="font-semibold">감지된 객체 및 상호작용</h4>
            {results.objectTracking.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {results.objectTracking.map((obj, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <span className="font-medium">{obj.entity?.description || 'Unknown'}</span>
                        <div className="text-sm text-gray-600 mt-1">
                          <div>신뢰도: {((obj.confidence || 0) * 100).toFixed(1)}%</div>
                          <div>감지 프레임: {obj.frames?.length || 0}개</div>
                          <div>언어 코드: {obj.entity?.languageCode || 'N/A'}</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        지속시간: {obj.segment ? 
                          `${formatTime(obj.segment.startTimeOffset)} - ${formatTime(obj.segment.endTimeOffset)}` : 
                          'N/A'
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">감지된 객체가 없습니다.</p>
            )}
          </div>
        );

      case 'faces':
        return (
          <div className="space-y-3">
            <h4 className="font-semibold">얼굴 감지 및 시선 분석</h4>
            {results.faceDetection.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {results.faceDetection.map((face, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="text-sm">
                      <span className="font-medium">👤 얼굴 #{index + 1}</span>
                      <div className="text-gray-600 mt-2 space-y-1">
                        <div>추적 구간: {face.tracks?.length || 0}개</div>
                        {face.tracks && face.tracks.length > 0 && (
                          <div>
                            <div>첫 감지: {formatTime(face.tracks[0]?.segment?.startTimeOffset)}</div>
                            <div>마지막 감지: {formatTime(face.tracks[face.tracks.length - 1]?.segment?.endTimeOffset)}</div>
                            <div>총 추적 지점: {face.tracks.reduce((sum, track) => sum + (track.timestampedObjects?.length || 0), 0)}개</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">감지된 얼굴이 없습니다.</p>
            )}
          </div>
        );

      case 'timeline':
        return (
          <div className="space-y-3">
            <h4 className="font-semibold">활동 타임라인 및 장면 전환</h4>
            {results.shotChanges.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {results.shotChanges.map((shot, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="font-medium">장면 {index + 1}</div>
                    <div className="text-sm text-gray-600">
                      {formatTime(shot.startTimeOffset)} - {formatTime(shot.endTimeOffset)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">장면 전환 데이터가 없습니다.</p>
            )}
          </div>
        );

      case 'raw':
        return (
          <div className="space-y-3">
            <h4 className="font-semibold">원본 분석 데이터 (JSON)</h4>
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-green-600">✅</span>
            영상 분석 완료
          </CardTitle>
          <CardDescription>
            {uploadedFile?.originalName} 파일의 상호작용 분석이 완료되었습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {results.objectTracking.length}
              </div>
              <div className="text-sm text-gray-600">객체 추적</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {results.speechTranscription.length}
              </div>
              <div className="text-sm text-gray-600">음성 전사</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {results.faceDetection.length}
              </div>
              <div className="text-sm text-gray-600">얼굴 감지</div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {results.shotChanges.length}
              </div>
              <div className="text-sm text-gray-600">장면 전환</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>상세 분석 결과</CardTitle>
          <CardDescription>
            상호작용 중심의 전문적인 놀이 분석 데이터입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-lg">
              {[
                { key: 'insights', label: '🎯 상호작용 인사이트', emoji: '🎯' },
                { key: 'detailed', label: '📊 상세 분석', emoji: '📊' },
                { key: 'speech', label: '🗣️ 대화 분석', emoji: '🗣️' },
                { key: 'objects', label: '🧸 놀이 도구', emoji: '🧸' },
                { key: 'faces', label: '👁️ 시선 추적', emoji: '👁️' },
                { key: 'timeline', label: '⏱️ 활동 타임라인', emoji: '⏱️' },
                { key: 'raw', label: '📄 원본 데이터', emoji: '📄' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedTab(tab.key)}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1 ${
                    selectedTab === tab.key 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span>{tab.emoji}</span>
                  <span className="hidden sm:inline">{tab.label.split(' ').slice(1).join(' ')}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-64">
            {selectedTab === 'insights' ? renderInsightsTab() : renderDetailedTab(selectedTab)}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold mb-1">다음 단계: AI 전문 레포트</h3>
              <p className="text-sm text-gray-600">
                원본 분석 데이터를 확인했다면, 전문적인 발달 지표 레포트를 생성하세요.
              </p>
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={handleDownloadJSON}
                className="px-6"
              >
                📁 JSON 다운로드
              </Button>
              <Button 
                variant="outline" 
                onClick={onReset}
                className="px-6"
              >
                새로 시작
              </Button>
              <Button 
                onClick={handleDetailedAnalysis}
                disabled={isLoadingDetailedAnalysis}
                className="px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {isLoadingDetailedAnalysis ? '분석 중...' : '📊 상세 분석'}
              </Button>
              <Button 
                onClick={onGenerateReport}
                className="px-6 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
              >
                🤖 AI 레포트 생성
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 