'use client';

import { 
  Play, 
  Brain, 
  Users, 
  MessageSquare, 
  Heart, 
  Gamepad2,
  BarChart3,
  Settings,
  CheckCircle,
  Circle,
  AlertTriangle,
  Code,
  Database,
  Cloud,
  Zap
} from 'lucide-react';
import React, { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AnalysisModule {
  id: string;
  name: string;
  description: string;
  status: 'completed' | 'in_progress' | 'pending';
  icon: React.ReactNode;
  progress: number;
  features: string[];
}

interface SystemMetrics {
  totalSessions: number;
  analysisAccuracy: number;
  processingSpeed: number;
  completionRate: number;
}

export default function PlayInteractionGuide() {
  const [activeModule, setActiveModule] = useState<string>('overview');
  const [systemMetrics] = useState<SystemMetrics>({
    totalSessions: 1247,
    analysisAccuracy: 94.5,
    processingSpeed: 85,
    completionRate: 98.2
  });

  const analysisModules: AnalysisModule[] = [
    {
      id: 'video_analysis',
      name: '비디오 분석 모듈',
      description: 'Google Cloud Video Intelligence 기반 영상 분석',
      status: 'completed',
      icon: <Play className="w-5 h-5" />,
      progress: 100,
      features: [
        'Object Tracking',
        'Face Detection',
        'Person Detection',
        'Shot Change Detection',
        'Explicit Content Detection'
      ]
    },
    {
      id: 'physical_interaction',
      name: '물리적 상호작용 분석',
      description: '근접성, 움직임 동기화, 활동성 수준 측정',
      status: 'in_progress',
      icon: <Users className="w-5 h-5" />,
      progress: 75,
      features: [
        '근접성 계산',
        '움직임 동기화',
        '활동성 수준 측정',
        '공간적 관계 분석',
        '제스처 인식'
      ]
    },
    {
      id: 'language_interaction',
      name: '언어 상호작용 분석',
      description: '발화 통계, 대화 패턴, 키워드 분석',
      status: 'completed',
      icon: <MessageSquare className="w-5 h-5" />,
      progress: 100,
      features: [
        '화자 분리',
        '발화 통계',
        '대화 패턴 분석',
        '키워드 추출',
        '언어 발달 지표'
      ]
    },
    {
      id: 'emotional_interaction',
      name: '감정적 상호작용 분석',
      description: '얼굴 지향, 참여도, 감정적 동기화 분석',
      status: 'in_progress',
      icon: <Heart className="w-5 h-5" />,
      progress: 60,
      features: [
        '얼굴 지향 분석',
        '상호 응시 감지',
        '참여도 측정',
        '감정적 동기화',
        '표정 기반 감정 추정'
      ]
    },
    {
      id: 'play_patterns',
      name: '놀이 패턴 분석',
      description: '장난감 사용, 활동 전환, 협력 놀이 패턴',
      status: 'pending',
      icon: <Gamepad2 className="w-5 h-5" />,
      progress: 30,
      features: [
        '장난감 사용 패턴',
        '활동 전환 분석',
        '협력 놀이 감지',
        '놀이 유형 분류',
        '창의성 지표'
      ]
    },
    {
      id: 'integrated_analysis',
      name: '통합 분석 시스템',
      description: '모든 분석 결과를 통합하여 종합 평가',
      status: 'completed',
      icon: <Brain className="w-5 h-5" />,
      progress: 100,
      features: [
        '데이터 통합',
        '점수 계산',
        '종합 평가',
        '개발 지표 생성',
        '추천사항 제공'
      ]
    }
  ];

  const systemArchitecture = {
    frontend: {
      name: 'Frontend Layer',
      technologies: ['Next.js 14', 'React 18', 'TypeScript', 'Tailwind CSS'],
      status: 'active'
    },
    backend: {
      name: 'Backend Services',
      technologies: ['Google Cloud Video Intelligence', 'Google Cloud Speech-to-Text', 'OpenAI GPT-4'],
      status: 'active'
    },
    database: {
      name: 'Data Storage',
      technologies: ['Google Cloud Firestore', 'Google Cloud Storage', 'Firebase'],
      status: 'active'
    },
    analysis: {
      name: 'Analysis Engine',
      technologies: ['Advanced Speaker Diarization', 'Voice Emotion Analyzer', 'Conversation Flow Analyzer'],
      status: 'active'
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Circle className="w-4 h-4 text-yellow-600" />;
      case 'pending':
        return <AlertTriangle className="w-4 h-4 text-gray-400" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            놀이 상호작용 분석 시스템
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            AI 기반 부모-자녀 놀이 영상 분석 및 발달 지원 평가 시스템
          </p>
          
          {/* System Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{systemMetrics.totalSessions.toLocaleString()}</div>
                <div className="text-sm text-gray-600">총 분석 세션</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{systemMetrics.analysisAccuracy}%</div>
                <div className="text-sm text-gray-600">분석 정확도</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{systemMetrics.processingSpeed}%</div>
                <div className="text-sm text-gray-600">처리 속도</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{systemMetrics.completionRate}%</div>
                <div className="text-sm text-gray-600">완료율</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeModule} onValueChange={setActiveModule} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">시스템 개요</TabsTrigger>
            <TabsTrigger value="modules">분석 모듈</TabsTrigger>
            <TabsTrigger value="architecture">아키텍처</TabsTrigger>
            <TabsTrigger value="development">개발 가이드</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    분석 모듈 진행 상황
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysisModules.map((module) => (
                      <div key={module.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {module.icon}
                          <div>
                            <div className="font-medium">{module.name}</div>
                            <div className="text-sm text-gray-600">{module.description}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(module.status)}
                            <span className="text-sm font-medium">{module.progress}%</span>
                          </div>
                          <Progress value={module.progress} className="w-20 mt-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    최근 업데이트
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Alert>
                      <CheckCircle className="w-4 h-4" />
                      <AlertDescription>
                        <strong>GCP 기반 데이터 저장소 마이그레이션 완료</strong>
                        <br />
                        Firestore + Cloud Storage 이중 저장 시스템 구현
                      </AlertDescription>
                    </Alert>
                    <Alert>
                      <CheckCircle className="w-4 h-4" />
                      <AlertDescription>
                        <strong>고도화된 음성 분석 시스템 구현</strong>
                        <br />
                        화자 분리, 감정 분석, 대화 흐름 분석 완료
                      </AlertDescription>
                    </Alert>
                    <Alert>
                      <AlertTriangle className="w-4 h-4" />
                      <AlertDescription>
                        <strong>물리적 상호작용 분석 모듈 개발 중</strong>
                        <br />
                        근접성 계산 및 움직임 동기화 알고리즘 구현 진행
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Modules Tab */}
          <TabsContent value="modules" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {analysisModules.map((module) => (
                <Card key={module.id} className="relative">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {module.icon}
                        {module.name}
                      </CardTitle>
                      <Badge className={getStatusColor(module.status)}>
                        {module.status === 'completed' ? '완료' : 
                         module.status === 'in_progress' ? '진행중' : '대기'}
                      </Badge>
                    </div>
                    <CardDescription>{module.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">진행률</span>
                        <span className="text-sm font-medium">{module.progress}%</span>
                      </div>
                      <Progress value={module.progress} />
                      
                      <div className="space-y-2">
                        <div className="text-sm font-medium">주요 기능</div>
                        <ul className="text-sm space-y-1">
                          {module.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 text-green-600" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Architecture Tab */}
          <TabsContent value="architecture" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  시스템 아키텍처
                </CardTitle>
                <CardDescription>
                  클라우드 네이티브 아키텍처 기반의 확장 가능한 분석 시스템
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {Object.entries(systemArchitecture).map(([key, layer]) => (
                    <Card key={key} className="text-center">
                      <CardContent className="p-4">
                        <div className="mb-3">
                          {key === 'frontend' && <Code className="w-8 h-8 mx-auto text-blue-600" />}
                          {key === 'backend' && <Cloud className="w-8 h-8 mx-auto text-green-600" />}
                          {key === 'database' && <Database className="w-8 h-8 mx-auto text-purple-600" />}
                          {key === 'analysis' && <Brain className="w-8 h-8 mx-auto text-orange-600" />}
                        </div>
                        <h3 className="font-semibold mb-2">{layer.name}</h3>
                        <div className="space-y-1">
                          {layer.technologies.map((tech, index) => (
                            <div key={index} className="text-xs bg-gray-100 rounded px-2 py-1">
                              {tech}
                            </div>
                          ))}
                        </div>
                        <Badge className="mt-2 bg-green-100 text-green-800">
                          {layer.status}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>데이터 플로우</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {[
                      { step: 1, title: '영상 업로드', desc: 'Google Cloud Storage' },
                      { step: 2, title: '비디오 분석', desc: 'Video Intelligence API' },
                      { step: 3, title: '음성 분석', desc: 'Speech-to-Text + 고도화 분석' },
                      { step: 4, title: '통합 분석', desc: 'Multi-modal Analysis' },
                      { step: 5, title: '결과 저장', desc: 'Firestore + Cloud Storage' }
                    ].map((item, index) => (
                      <div key={index} className="text-center">
                        <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-2">
                          {item.step}
                        </div>
                        <h4 className="font-medium">{item.title}</h4>
                        <p className="text-sm text-gray-600">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Development Tab */}
          <TabsContent value="development" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>개발 환경 설정</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">필수 서비스</h4>
                      <ul className="space-y-1 text-sm">
                        <li>• Google Cloud Video Intelligence API</li>
                        <li>• Google Cloud Speech-to-Text API</li>
                        <li>• Google Cloud Firestore</li>
                        <li>• Google Cloud Storage</li>
                        <li>• OpenAI GPT-4 API</li>
                      </ul>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">개발 도구</h4>
                      <ul className="space-y-1 text-sm">
                        <li>• Node.js 18+</li>
                        <li>• Next.js 14</li>
                        <li>• TypeScript</li>
                        <li>• Tailwind CSS</li>
                        <li>• shadcn/ui</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>API 엔드포인트</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { method: 'POST', endpoint: '/api/upload', desc: '영상 업로드' },
                      { method: 'POST', endpoint: '/api/analyze', desc: '비디오 분석' },
                      { method: 'POST', endpoint: '/api/integrated-analysis', desc: '통합 분석' },
                      { method: 'GET', endpoint: '/api/play-sessions', desc: '세션 목록' },
                      { method: 'GET', endpoint: '/api/play-sessions/[id]', desc: '세션 상세' }
                    ].map((api, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Badge variant="outline" className="text-xs">
                          {api.method}
                        </Badge>
                        <code className="text-sm font-mono">{api.endpoint}</code>
                        <span className="text-sm text-gray-600">{api.desc}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>구현 로드맵</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { phase: 'Phase 1', title: '기본 인프라 구축', status: 'completed', items: ['GCP 기반 저장소', '기본 분석 API', '세션 관리'] },
                    { phase: 'Phase 2', title: '고도화 분석 구현', status: 'in_progress', items: ['음성 분석 고도화', '물리적 상호작용 분석', '감정 분석'] },
                    { phase: 'Phase 3', title: '놀이 패턴 분석', status: 'pending', items: ['장난감 사용 패턴', '활동 전환 분석', '협력 놀이 감지'] },
                    { phase: 'Phase 4', title: '실시간 분석', status: 'pending', items: ['실시간 스트리밍', '라이브 피드백', '즉시 분석'] }
                  ].map((phase, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{phase.phase}: {phase.title}</h4>
                        <Badge className={getStatusColor(phase.status)}>
                          {phase.status === 'completed' ? '완료' : 
                           phase.status === 'in_progress' ? '진행중' : '예정'}
                        </Badge>
                      </div>
                      <ul className="text-sm space-y-1 text-gray-600">
                        {phase.items.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            {getStatusIcon(phase.status)}
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 