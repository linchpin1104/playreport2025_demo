'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  Clock, 
  Users, 
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Heart,
  MessageCircle,
  Gamepad2,
  Brain,
  Lightbulb,
  TrendingUp,
  Activity,
  Smile
} from 'lucide-react';

interface PlayInteractionDashboardProps {
  sessionId: string;
}

interface AnalysisData {
  overallScore: number;
  interactionQuality: number;
  integratedAnalysis: {
    physicalInteraction: {
      proximityScore: number;
      activityLevel: 'low' | 'medium' | 'high';
      movementSpeed: number;
      staticRatio: number;
      proximityTimeline: Array<{time: number; distance: number}>;
    };
    languageInteraction: {
      basicStats: Record<string, {
        utteranceCount: number;
        avgWordCount: number;
        totalWords: number;
      }>;
      conversationPatterns: {
        avgResponseTime: number;
        turnCount: number;
      };
      utteranceTypes: {
        questions: number;
        instructions: number;
        emotions: number;
        praise: number;
      };
      keywords: {
        topKeywords: Array<[string, number]>;
      };
      timeline: Array<{
        timeRange: string;
        parentUtterances: number;
        childUtterances: number;
      }>;
    };
    emotionalInteraction: {
      mutualGazeTime: number;
      faceToFaceRatio: number;
      engagementScore: number;
      interactionQuality: 'high' | 'medium' | 'low';
      engagementPeriods: Array<{start: number; end: number; level: string}>;
    };
    playPatterns: {
      toysDetected: string[];
      sharingRatio: number;
      activityTransitions: Array<{time: number; description: string}>;
      cooperativePatterns: Array<{time: number; duration: number}>;
      overallScore: number;
    };
  };
  keyFindings: string[];
  recommendations: string[];
}

interface SessionData {
  sessionId: string;
  metadata: {
    fileName: string;
    fileSize: number;
    uploadedAt: string;
    status: string;
    duration?: number;
  };
  analysis?: AnalysisData;
}

export default function PlayInteractionDashboard({ sessionId }: PlayInteractionDashboardProps) {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('physical');

  useEffect(() => {
    const fetchSessionData = async () => {
      if (!sessionId) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/play-sessions/${sessionId}`);
        
        if (!response.ok) {
          throw new Error(`세션 데이터를 가져올 수 없습니다: ${response.statusText}`);
        }

        const result = await response.json();
        if (!result.success || !result.session) {
          throw new Error('세션 데이터가 존재하지 않습니다');
        }

        setSessionData(result.session as SessionData);
      } catch (error) {
        console.error('세션 데이터 로딩 실패:', error);
        setSessionData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessionData();
  }, [sessionId]);

  // 로딩 상태
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f2f5 0%, #e6f3ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid #667eea', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }}></div>
          <div style={{ fontSize: '18px', color: '#666' }}>대시보드를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  // 분석 실패 여부 확인
  const hasValidAnalysis = sessionData?.analysis && sessionData.analysis.overallScore > 0;
  const isAnalysisFailed = !sessionData || !sessionData.analysis || sessionData.metadata.status === 'error' || sessionData.metadata.status === 'failed';

  // 영상 길이 계산
  const getVideoDuration = () => {
    if (sessionData?.metadata.duration) {
      const minutes = Math.floor(sessionData.metadata.duration / 60);
      const seconds = Math.floor(sessionData.metadata.duration % 60);
      return `${minutes}분 ${seconds}초`;
    }
    return '약 5분 48초';
  };

  const videoDuration = getVideoDuration();
  const analysisDate = sessionData ? new Date(sessionData.analysis?.analysisMetadata?.processedAt || sessionData.metadata.uploadedAt).toLocaleDateString('ko-KR') : '';

  // 실제 분석 데이터 기반 점수 계산
  const scores = {
    interaction: hasValidAnalysis ? sessionData.analysis.interactionQuality : 0,
    development: hasValidAnalysis ? Math.round(sessionData.analysis.overallScore * 0.8) : 0,
    environment: hasValidAnalysis ? Math.round((sessionData.analysis.integratedAnalysis.emotionalInteraction.engagementScore * 100 + sessionData.analysis.integratedAnalysis.physicalInteraction.proximityScore) / 2) : 0
  };

  if (isAnalysisFailed) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f2f5 0%, #e6f3ff 100%)', padding: '40px 20px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <AlertTriangle style={{ width: '64px', height: '64px', color: '#f56565', margin: '0 auto 20px' }} />
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#2d3748', marginBottom: '16px' }}>분석 실패</h2>
          <p style={{ fontSize: '16px', color: '#718096', marginBottom: '32px' }}>
            영상 분석 중 오류가 발생했습니다. 다시 시도해 주세요.
          </p>
          <button 
            onClick={() => window.location.href = '/upload'}
            style={{ backgroundColor: '#667eea', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', fontSize: '16px', cursor: 'pointer' }}
          >
            새 영상 업로드
          </button>
        </div>
      </div>
    );
  }

  // 분석 데이터 추출
  const analysisData = sessionData.analysis!;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f2f5 0%, #e6f3ff 100%)' }}>
      {/* 헤더 */}
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '20px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '10px' }}>🎯 부모-자녀 놀이 상호작용 분석 대시보드</h1>
          <div style={{ display: 'flex', gap: '20px', fontSize: '14px', opacity: 0.9, flexWrap: 'wrap' }}>
            <span>📅 분석일: {analysisDate}</span>
            <span>⏱️ 영상 길이: {videoDuration}</span>
            <span>👥 참여자: 부모 1명, 자녀 1명</span>
            <span>🎯 전체 점수: {analysisData.overallScore}점</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
        {/* 종합 점수 섹션 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
          <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '18px', margin: '0 0 10px 0' }}>상호작용 질 점수</h2>
            <div style={{ fontSize: '48px', fontWeight: 'bold', margin: '10px 0' }}>
              {(scores.interaction / 10).toFixed(1)}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>/ 10점</div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)', color: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '18px', margin: '0 0 10px 0' }}>발달 지원 수준</h2>
            <div style={{ fontSize: '48px', fontWeight: 'bold', margin: '10px 0' }}>
              {(scores.development / 10).toFixed(1)}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>/ 10점</div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #f6ad55 0%, #ed8936 100%)', color: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '18px', margin: '0 0 10px 0' }}>놀이 환경 최적화</h2>
            <div style={{ fontSize: '48px', fontWeight: 'bold', margin: '10px 0' }}>
              {Math.min((scores.environment / 10), 10).toFixed(1)}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>/ 10점</div>
          </div>
        </div>

        {/* 주요 발견사항 */}
        {analysisData.keyFindings && analysisData.keyFindings.length > 0 && (
          <Card style={{ marginBottom: '30px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <CardHeader>
              <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5a67d8' }}>
                <CheckCircle style={{ width: '20px', height: '20px' }} />
                주요 분석 결과
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {analysisData.keyFindings.map((finding, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#f7fafc', borderRadius: '8px' }}>
                    <CheckCircle style={{ width: '16px', height: '16px', color: '#48bb78', flexShrink: 0 }} />
                    <span>{finding}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 탭 메뉴 */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid #e2e8f0', marginBottom: '20px', flexWrap: 'wrap' }}>
            {[
              { id: 'physical', label: '물리적 상호작용', icon: '🤝' },
              { id: 'emotional', label: '감정적 상호작용', icon: '😊' },
              { id: 'language', label: '언어적 상호작용', icon: '💬' },
              { id: 'play-pattern', label: '놀이 패턴', icon: '🧸' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '10px 20px',
                  background: activeTab === tab.id ? '#5a67d8' : 'none',
                  color: activeTab === tab.id ? 'white' : '#718096',
                  border: 'none',
                  fontSize: '16px',
                  cursor: 'pointer',
                  borderRadius: activeTab === tab.id ? '8px 8px 0 0' : '0',
                  fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                  transition: 'all 0.3s ease'
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* 물리적 상호작용 탭 */}
          {activeTab === 'physical' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
              <Card style={{ borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <CardHeader>
                  <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5a67d8' }}>
                    <BarChart3 style={{ width: '20px', height: '20px' }} />
                    근접성 분석
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span>근접성 점수</span>
                      <strong>{analysisData.integratedAnalysis.physicalInteraction.proximityScore}점</strong>
                    </div>
                    <Progress value={analysisData.integratedAnalysis.physicalInteraction.proximityScore} className="w-full" />
                  </div>
                  <div style={{ background: '#edf2f7', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #48bb78' }}>
                    <h3 style={{ color: '#48bb78', fontSize: '16px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Lightbulb style={{ width: '16px', height: '16px' }} />
                      인사이트
                    </h3>
                    <p style={{ fontSize: '14px', color: '#4a5568', margin: 0 }}>
                      부모와 자녀가 전체 시간의 {Math.round(analysisData.integratedAnalysis.physicalInteraction.proximityScore)}%를 가까운 거리에서 상호작용했습니다.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card style={{ borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <CardHeader>
                  <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5a67d8' }}>
                    <Activity style={{ width: '20px', height: '20px' }} />
                    활동성 수준
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
                    <span style={{ fontWeight: 500 }}>활동 수준</span>
                    <Badge variant={analysisData.integratedAnalysis.physicalInteraction.activityLevel === 'high' ? 'default' : 'secondary'}>
                      {analysisData.integratedAnalysis.physicalInteraction.activityLevel === 'high' ? '높음' : 
                       analysisData.integratedAnalysis.physicalInteraction.activityLevel === 'medium' ? '보통' : '낮음'}
                    </Badge>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
                    <span style={{ fontWeight: 500 }}>움직임 속도</span>
                    <span style={{ color: '#5a67d8', fontWeight: 'bold' }}>{analysisData.integratedAnalysis.physicalInteraction.movementSpeed * 100}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
                    <span style={{ fontWeight: 500 }}>정적 시간 비율</span>
                    <span style={{ color: '#5a67d8', fontWeight: 'bold' }}>{Math.round(analysisData.integratedAnalysis.physicalInteraction.staticRatio * 100)}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 감정적 상호작용 탭 */}
          {activeTab === 'emotional' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
              <Card style={{ borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <CardHeader>
                  <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5a67d8' }}>
                    <Smile style={{ width: '20px', height: '20px' }} />
                    얼굴 지향 행동
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
                    <span style={{ fontWeight: 500 }}>상호 응시 시간</span>
                    <span style={{ color: '#5a67d8', fontWeight: 'bold' }}>{Math.round(analysisData.integratedAnalysis.emotionalInteraction.mutualGazeTime * 100)}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
                    <span style={{ fontWeight: 500 }}>얼굴 대면 비율</span>
                    <span style={{ color: '#5a67d8', fontWeight: 'bold' }}>{Math.round(analysisData.integratedAnalysis.emotionalInteraction.faceToFaceRatio * 100)}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
                    <span style={{ fontWeight: 500 }}>참여도 점수</span>
                    <span style={{ color: '#5a67d8', fontWeight: 'bold' }}>{Math.round(analysisData.integratedAnalysis.emotionalInteraction.engagementScore * 100)}점</span>
                  </div>
                  <div style={{ marginTop: '15px' }}>
                    <Progress value={analysisData.integratedAnalysis.emotionalInteraction.engagementScore * 100} className="w-full" />
                  </div>
                </CardContent>
              </Card>

              <Card style={{ borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <CardHeader>
                  <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5a67d8' }}>
                    <Heart style={{ width: '20px', height: '20px' }} />
                    상호작용 품질
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ 
                      fontSize: '48px', 
                      fontWeight: 'bold', 
                      color: analysisData.integratedAnalysis.emotionalInteraction.interactionQuality === 'high' ? '#48bb78' : 
                            analysisData.integratedAnalysis.emotionalInteraction.interactionQuality === 'medium' ? '#f6ad55' : '#fc8181' 
                    }}>
                      {analysisData.integratedAnalysis.emotionalInteraction.interactionQuality === 'high' ? '높음' :
                       analysisData.integratedAnalysis.emotionalInteraction.interactionQuality === 'medium' ? '보통' : '낮음'}
                    </div>
                  </div>
                  <div style={{ background: '#edf2f7', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #5a67d8' }}>
                    <p style={{ fontSize: '14px', color: '#4a5568', margin: 0 }}>
                      {analysisData.integratedAnalysis.emotionalInteraction.engagementPeriods.length}개의 참여 구간이 감지되었으며, 
                      전반적으로 {analysisData.integratedAnalysis.emotionalInteraction.interactionQuality === 'high' ? '우수한' : '양호한'} 
                      감정적 교감이 관찰되었습니다.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 언어적 상호작용 탭 */}
          {activeTab === 'language' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
              <Card style={{ borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <CardHeader>
                  <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5a67d8' }}>
                    <MessageCircle style={{ width: '20px', height: '20px' }} />
                    발화 통계
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {Object.entries(analysisData.integratedAnalysis.languageInteraction.basicStats).map(([speaker, stats]) => (
                    <div key={speaker} style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                      <h4 style={{ fontWeight: 'bold', marginBottom: '10px', color: '#2d3748' }}>{speaker}</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '14px' }}>
                        <div>
                          <span style={{ color: '#718096' }}>발화 횟수:</span>
                          <strong style={{ marginLeft: '8px', color: '#5a67d8' }}>{stats.utteranceCount}회</strong>
                        </div>
                        <div>
                          <span style={{ color: '#718096' }}>총 단어수:</span>
                          <strong style={{ marginLeft: '8px', color: '#5a67d8' }}>{stats.totalWords}개</strong>
                        </div>
                        <div>
                          <span style={{ color: '#718096' }}>평균 단어수:</span>
                          <strong style={{ marginLeft: '8px', color: '#5a67d8' }}>{stats.avgWordCount}개</strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card style={{ borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <CardHeader>
                  <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5a67d8' }}>
                    <TrendingUp style={{ width: '20px', height: '20px' }} />
                    대화 패턴
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
                    <span style={{ fontWeight: 500 }}>평균 응답 시간</span>
                    <span style={{ color: '#5a67d8', fontWeight: 'bold' }}>{analysisData.integratedAnalysis.languageInteraction.conversationPatterns.avgResponseTime}초</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
                    <span style={{ fontWeight: 500 }}>턴 테이킹</span>
                    <span style={{ color: '#5a67d8', fontWeight: 'bold' }}>{analysisData.integratedAnalysis.languageInteraction.conversationPatterns.turnCount}회</span>
                  </div>
                  <div style={{ marginTop: '15px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>발화 유형</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>질문</span>
                        <strong style={{ color: '#48bb78' }}>{analysisData.integratedAnalysis.languageInteraction.utteranceTypes.questions}회</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>지시/제안</span>
                        <strong style={{ color: '#5a67d8' }}>{analysisData.integratedAnalysis.languageInteraction.utteranceTypes.instructions}회</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>감정 표현</span>
                        <strong style={{ color: '#f6ad55' }}>{analysisData.integratedAnalysis.languageInteraction.utteranceTypes.emotions}회</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>칭찬/격려</span>
                        <strong style={{ color: '#48bb78' }}>{analysisData.integratedAnalysis.languageInteraction.utteranceTypes.praise}회</strong>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card style={{ borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <CardHeader>
                  <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5a67d8' }}>
                    <Brain style={{ width: '20px', height: '20px' }} />
                    주요 키워드
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {analysisData.integratedAnalysis.languageInteraction.keywords.topKeywords.slice(0, 8).map(([word, count], index) => (
                      <div key={index} style={{ 
                        padding: '6px 12px', 
                        background: index % 2 === 0 ? '#667eea' : '#764ba2', 
                        color: 'white', 
                        borderRadius: '20px', 
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}>
                        {word} ({count})
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 놀이 패턴 탭 */}
          {activeTab === 'play-pattern' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
              <Card style={{ borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <CardHeader>
                  <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5a67d8' }}>
                    <Gamepad2 style={{ width: '20px', height: '20px' }} />
                    장난감 사용 분석
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
                    <span style={{ fontWeight: 500 }}>감지된 장난감</span>
                    <span style={{ color: '#5a67d8', fontWeight: 'bold' }}>{analysisData.integratedAnalysis.playPatterns.toysDetected.length}종류</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
                    <span style={{ fontWeight: 500 }}>공유 놀이 시간</span>
                    <span style={{ color: '#5a67d8', fontWeight: 'bold' }}>{Math.round(analysisData.integratedAnalysis.playPatterns.sharingRatio * 100)}%</span>
                  </div>
                  <div style={{ marginTop: '15px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>감지된 장난감</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {analysisData.integratedAnalysis.playPatterns.toysDetected.map((toy, index) => (
                        <Badge key={index} variant="outline">{toy}</Badge>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginTop: '15px' }}>
                    <Progress value={analysisData.integratedAnalysis.playPatterns.sharingRatio * 100} className="w-full" />
                  </div>
                </CardContent>
              </Card>

              <Card style={{ borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <CardHeader>
                  <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5a67d8' }}>
                    <Clock style={{ width: '20px', height: '20px' }} />
                    활동 전환점
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {analysisData.integratedAnalysis.playPatterns.activityTransitions.map((transition, index) => (
                      <div key={index} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        padding: '10px', 
                        margin: '5px 0', 
                        background: '#f7fafc', 
                        borderRadius: '8px', 
                        borderLeft: '4px solid #667eea' 
                      }}>
                        <span style={{ fontWeight: 'bold', marginRight: '10px', color: '#667eea', fontSize: '14px' }}>
                          {Math.floor(transition.time / 60)}:{(transition.time % 60).toString().padStart(2, '0')}
                        </span>
                        <span style={{ fontSize: '14px' }}>{transition.description}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card style={{ borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <CardHeader>
                  <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5a67d8' }}>
                    <Users style={{ width: '20px', height: '20px' }} />
                    협력 놀이 패턴
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#48bb78' }}>
                      {analysisData.integratedAnalysis.playPatterns.cooperativePatterns.length}회
                    </div>
                    <div style={{ fontSize: '14px', color: '#718096' }}>협력 놀이 감지</div>
                  </div>
                  {analysisData.integratedAnalysis.playPatterns.cooperativePatterns.map((pattern, index) => (
                    <div key={index} style={{ 
                      padding: '10px', 
                      background: '#f0fff4', 
                      borderRadius: '8px', 
                      marginBottom: '8px',
                      border: '1px solid #48bb78'
                    }}>
                      <div style={{ fontSize: '14px' }}>
                        <strong>{Math.floor(pattern.time / 60)}:{(pattern.time % 60).toString().padStart(2, '0')}</strong>
                        <span style={{ marginLeft: '10px', color: '#718096' }}>
                          {pattern.duration}초간 지속
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* 종합 권장사항 */}
        {analysisData.recommendations && analysisData.recommendations.length > 0 && (
          <Card style={{ marginTop: '30px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <CardHeader>
              <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5a67d8' }}>
                <Lightbulb style={{ width: '20px', height: '20px' }} />
                종합 권장사항
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {analysisData.recommendations.map((recommendation, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', background: '#fef5e7', borderRadius: '8px', borderLeft: '4px solid #f39c12' }}>
                    <CheckCircle style={{ width: '20px', height: '20px', color: '#f39c12', flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ fontSize: '14px', lineHeight: '1.6' }}>{recommendation}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 