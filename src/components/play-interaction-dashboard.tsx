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
  Lightbulb
} from 'lucide-react';

interface PlayInteractionDashboardProps {
  sessionId: string;
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
  analysis?: {
    overallScore: number;
    interactionQuality: number;
    safetyScore: number;
    completedAt: string;
    keyInsights?: string[];
  };
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
    
    // 파일 크기로 추정
    if (sessionData?.metadata.fileSize) {
      const estimatedSeconds = Math.min(Math.round(sessionData.metadata.fileSize / 1000000), 120);
      const minutes = Math.floor(estimatedSeconds / 60);
      const seconds = estimatedSeconds % 60;
      return `약 ${minutes}분 ${seconds}초`;
    }
    
    return '정보 없음';
  };

  const videoDuration = getVideoDuration();
  const analysisDate = sessionData ? new Date(sessionData.analysis?.completedAt || sessionData.metadata.uploadedAt).toLocaleDateString('ko-KR') : '';

  // 실제 점수들 (없으면 0)
  const scores = {
    interaction: hasValidAnalysis ? sessionData.analysis.interactionQuality : 0,
    development: hasValidAnalysis ? Math.round(sessionData.analysis.overallScore * 0.9) : 0,
    environment: hasValidAnalysis ? Math.round(sessionData.analysis.overallScore * 1.1) : 0
  };

  return (
    <div style={{ fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif', background: '#f0f2f5', color: '#333', minHeight: '100vh' }}>
      {/* 헤더 */}
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '28px', margin: '0 0 10px 0' }}>🎯 부모-자녀 놀이 상호작용 분석 대시보드</h1>
          <div style={{ display: 'flex', gap: '20px', fontSize: '14px', opacity: 0.9 }}>
            <span>📅 분석일: {analysisDate}</span>
            <span>⏱️ 영상 길이: {videoDuration}</span>
            <span>👥 참여자: 부모 1명, 자녀 1명</span>
          </div>
          
          {/* 분석 실패 알림 */}
          {isAnalysisFailed && (
            <Alert style={{ marginTop: '20px', background: 'rgba(252, 129, 129, 0.1)', border: '1px solid rgba(252, 129, 129, 0.3)', borderRadius: '8px' }}>
              <AlertTriangle style={{ width: '16px', height: '16px', color: '#fc8181' }} />
              <AlertDescription style={{ color: 'white', marginLeft: '10px' }}>
                <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>영상 분석에 실패했습니다.</div>
                <div style={{ fontSize: '13px' }}>충분한 분석 데이터를 추출할 수 없어 상세 분석이 제한됩니다.</div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
        {/* 종합 점수 섹션 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
          <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '18px', margin: '0 0 10px 0' }}>상호작용 질 점수</h2>
            <div style={{ fontSize: '48px', fontWeight: 'bold', margin: '10px 0' }}>
              {hasValidAnalysis ? (scores.interaction / 10).toFixed(1) : '0.0'}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>/ 10점</div>
            {!hasValidAnalysis && <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.8 }}>데이터 부족</div>}
          </div>

          <div style={{ background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)', color: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '18px', margin: '0 0 10px 0' }}>발달 지원 수준</h2>
            <div style={{ fontSize: '48px', fontWeight: 'bold', margin: '10px 0' }}>
              {hasValidAnalysis ? (scores.development / 10).toFixed(1) : '0.0'}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>/ 10점</div>
            {!hasValidAnalysis && <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.8 }}>데이터 부족</div>}
          </div>

          <div style={{ background: 'linear-gradient(135deg, #f6ad55 0%, #ed8936 100%)', color: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '18px', margin: '0 0 10px 0' }}>놀이 환경 최적화</h2>
            <div style={{ fontSize: '48px', fontWeight: 'bold', margin: '10px 0' }}>
              {hasValidAnalysis ? Math.min((scores.environment / 10), 10).toFixed(1) : '0.0'}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>/ 10점</div>
            {!hasValidAnalysis && <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.8 }}>데이터 부족</div>}
          </div>
        </div>

        {/* 주요 발견사항 */}
        {hasValidAnalysis && sessionData.analysis.keyInsights && sessionData.analysis.keyInsights.length > 0 && (
          <Card style={{ marginBottom: '30px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <CardHeader>
              <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5a67d8' }}>
                <CheckCircle style={{ width: '20px', height: '20px' }} />
                주요 분석 결과
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {sessionData.analysis.keyInsights.map((insight, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#f7fafc', borderRadius: '8px' }}>
                    <CheckCircle style={{ width: '16px', height: '16px', color: '#48bb78', flexShrink: 0 }} />
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 탭 컨테이너 */}
        <div style={{ marginTop: '30px' }}>
          {/* 탭 버튼들 */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e2e8f0' }}>
            {[
              { id: 'physical', label: '물리적 상호작용', icon: Users },
              { id: 'emotional', label: '감정적 상호작용', icon: Heart },
              { id: 'play-pattern', label: '놀이 패턴', icon: Gamepad2 },
              { id: 'development', label: '발달 지표', icon: Brain },
              { id: 'language', label: '언어적 상호작용', icon: MessageCircle }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '10px 20px',
                    background: 'none',
                    border: 'none',
                    fontSize: '16px',
                    cursor: 'pointer',
                    color: activeTab === tab.id ? '#5a67d8' : '#718096',
                    position: 'relative',
                    borderBottom: activeTab === tab.id ? '2px solid #5a67d8' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Icon style={{ width: '16px', height: '16px' }} />
                  {tab.label}
                </button>
              );
            })}
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
                  <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', borderRadius: '8px', marginBottom: '15px' }}>
                    <div style={{ textAlign: 'center', color: '#6c757d' }}>
                      <BarChart3 style={{ width: '48px', height: '48px', margin: '0 auto 10px' }} />
                      <div>근접성 분석 데이터가</div>
                      <div>부족합니다</div>
                    </div>
                  </div>
                  <div style={{ background: '#edf2f7', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #48bb78' }}>
                    <h3 style={{ color: '#48bb78', fontSize: '16px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Lightbulb style={{ width: '16px', height: '16px' }} />
                      인사이트
                    </h3>
                    <p style={{ fontSize: '14px', color: '#4a5568', margin: 0 }}>
                      {hasValidAnalysis 
                        ? "부모-자녀 근접성 데이터 분석을 위해서는 더 긴 영상이 필요합니다."
                        : "근접성 분석을 위한 데이터가 부족합니다."
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card style={{ borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <CardHeader>
                  <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5a67d8' }}>
                    <Users style={{ width: '20px', height: '20px' }} />
                    상호작용 패턴
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
                    <span style={{ fontWeight: 500 }}>전체 분석 점수</span>
                    <span style={{ color: '#5a67d8', fontWeight: 'bold' }}>
                      {hasValidAnalysis ? `${sessionData.analysis.overallScore}점` : '데이터 없음'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
                    <span style={{ fontWeight: 500 }}>상호작용 품질</span>
                    <span style={{ color: '#5a67d8', fontWeight: 'bold' }}>
                      {hasValidAnalysis ? `${sessionData.analysis.interactionQuality}점` : '데이터 없음'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
                    <span style={{ fontWeight: 500 }}>안전 점수</span>
                    <span style={{ color: '#5a67d8', fontWeight: 'bold' }}>
                      {hasValidAnalysis ? `${sessionData.analysis.safetyScore || 0}점` : '데이터 없음'}
                    </span>
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
                    주요 키워드
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6c757d' }}>
                    <MessageCircle style={{ width: '48px', height: '48px', margin: '0 auto 15px' }} />
                    <div style={{ marginBottom: '5px' }}>음성 데이터가 부족하여</div>
                    <div>키워드를 추출할 수 없습니다</div>
                  </div>
                </CardContent>
              </Card>

              <Card style={{ borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <CardHeader>
                  <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5a67d8' }}>
                    <BarChart3 style={{ width: '20px', height: '20px' }} />
                    발화 빈도 분석
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
                    <span style={{ fontWeight: 500 }}>총 발화 횟수</span>
                    <span style={{ color: '#6c757d' }}>데이터 없음</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
                    <span style={{ fontWeight: 500 }}>평균 발화 간격</span>
                    <span style={{ color: '#6c757d' }}>데이터 없음</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
                    <span style={{ fontWeight: 500 }}>대화 주도성</span>
                    <span style={{ color: '#6c757d' }}>데이터 없음</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 다른 탭들도 비슷하게 데이터 부족 메시지 표시 */}
          {['emotional', 'play-pattern', 'development'].includes(activeTab) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
              <Card style={{ borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <CardContent style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
                  <Brain style={{ width: '48px', height: '48px', margin: '0 auto 15px' }} />
                  <div style={{ marginBottom: '5px', fontSize: '16px' }}>
                    {activeTab === 'emotional' && '감정적 상호작용'}
                    {activeTab === 'play-pattern' && '놀이 패턴'}  
                    {activeTab === 'development' && '발달 지표'}
                  </div>
                  <div>분석을 위한 데이터가 부족합니다</div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* 종합 권장사항 */}
        <Card style={{ marginTop: '30px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
          <CardHeader>
            <CardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#5a67d8' }}>
              <Lightbulb style={{ width: '20px', height: '20px' }} />
              종합 권장사항
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasValidAnalysis ? (
              <div>
                <div style={{ background: '#edf4ff', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #48bb78', marginBottom: '15px' }}>
                  <h3 style={{ color: '#48bb78', fontSize: '16px', marginBottom: '10px' }}>✅ 강점</h3>
                  <ul style={{ marginLeft: '20px', lineHeight: 1.8, color: '#4a5568' }}>
                    <li>전체 분석 점수 {sessionData.analysis.overallScore}점으로 양호한 상호작용이 관찰됩니다</li>
                    <li>상호작용 품질 점수 {sessionData.analysis.interactionQuality}점으로 높은 수준입니다</li>
                    {sessionData.analysis.keyInsights?.map((insight, index) => (
                      <li key={index}>{insight}</li>
                    ))}
                  </ul>
                </div>
                <div style={{ background: '#fef5e7', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #f39c12' }}>
                  <h3 style={{ color: '#f39c12', fontSize: '16px', marginBottom: '10px' }}>🎯 개선 제안</h3>
                  <ul style={{ marginLeft: '20px', lineHeight: 1.8, color: '#4a5568' }}>
                    <li>더 긴 영상으로 상세한 근접성 분석을 진행해보세요</li>
                    <li>음성이 포함된 영상으로 언어적 상호작용을 분석해보세요</li>
                    <li>다양한 놀이 상황에서의 분석을 위해 여러 영상을 업로드해보세요</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div style={{ background: '#fef5e7', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #f39c12', textAlign: 'center' }}>
                <AlertTriangle style={{ width: '48px', height: '48px', color: '#f39c12', margin: '0 auto 15px' }} />
                <h3 style={{ color: '#f39c12', fontSize: '18px', marginBottom: '10px' }}>분석 데이터 부족</h3>
                <p style={{ color: '#4a5568', lineHeight: 1.6, margin: 0 }}>
                  상세한 분석을 위해 다음 조건을 충족하는 영상을 업로드해주세요:<br />
                  • 명확하게 사람이 보이는 영상<br />
                  • 30초 이상의 충분한 길이<br />
                  • 적절한 조명과 화질<br />
                  • 음성이 포함된 영상 (언어 분석용)
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 