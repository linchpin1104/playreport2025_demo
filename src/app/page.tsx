'use client';

import { 
  Play, Upload, BarChart3, FileText, CheckCircle, 
  Users, MessageCircle, Brain, Target, Star,
  ArrowRight, Video, Clock, Shield
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  const router = useRouter();

  const handleStartAnalysis = () => {
    router.push('/upload');
  };

  const features = [
    {
      icon: Users,
      title: '물리적 상호작용 분석',
      description: '부모-자녀 간 근접성, 움직임 동기화, 활동성 수준을 분석합니다.',
      color: 'text-blue-600'
    },
    {
      icon: MessageCircle,
      title: '언어적 상호작용 분석',
      description: '대화 패턴, 발화 빈도, 언어 발달 지표를 상세히 분석합니다.',
      color: 'text-green-600'
    },
    {
      icon: Brain,
      title: '감정적 상호작용 분석',
      description: '얼굴 지향 행동, 참여도, 감정적 동기화를 측정합니다.',
      color: 'text-purple-600'
    },
    {
      icon: Target,
      title: '놀이 패턴 분석',
      description: '장난감 사용 패턴, 활동 전환, 협력 놀이 분석을 제공합니다.',
      color: 'text-orange-600'
    }
  ];

  const steps = [
    {
      number: 1,
      title: '비디오 업로드',
      description: '부모-자녀 놀이 영상을 업로드하세요',
      icon: Upload,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      number: 2,
      title: 'AI 분석',
      description: '다각도 상호작용 분석을 진행합니다',
      icon: BarChart3,
      color: 'bg-green-100 text-green-600'
    },
    {
      number: 3,
      title: '결과 확인',
      description: '상세한 분석 결과를 확인하세요',
      icon: CheckCircle,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      number: 4,
      title: '리포트 생성',
      description: '전문적인 발달 지원 리포트를 받으세요',
      icon: FileText,
      color: 'bg-orange-100 text-orange-600'
    }
  ];

  const benefits = [
    {
      icon: Clock,
      title: '빠른 분석',
      description: '2-3분 내 완료되는 신속한 분석'
    },
    {
      icon: Shield,
      title: '안전한 보관',
      description: '클라우드 기반 안전한 데이터 보관'
    },
    {
      icon: Star,
      title: '전문성',
      description: '아동발달 전문가 기반 분석 알고리즘'
    },
    {
      icon: Target,
      title: '맞춤형 권장',
      description: '개별 발달 단계에 맞는 맞춤 권장사항'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Video className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  놀이 상호작용 분석
                </h1>
                <p className="text-sm text-gray-600">
                  AI 기반 부모-자녀 상호작용 분석 서비스
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              베타 서비스
            </Badge>
          </div>
        </div>
      </div>

      {/* 히어로 섹션 */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-800 mb-6">
            🎯 부모-자녀 놀이 상호작용을
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              과학적으로 분석해보세요
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            AI 기반 영상 분석을 통해 부모와 자녀의 상호작용 패턴을 파악하고, 
            발달 단계에 맞는 맞춤형 지원 방안을 제공합니다.
          </p>
          
          <div className="flex justify-center gap-4 mb-12">
            <Button 
              onClick={handleStartAnalysis}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg"
            >
              <Play className="w-5 h-5 mr-2" />
              분석 시작하기
            </Button>
            
            <Button 
              variant="outline"
              size="lg"
              className="px-8 py-4 text-lg"
            >
              <Video className="w-5 h-5 mr-2" />
              데모 보기
            </Button>
          </div>

          {/* 통계 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">1,000+</div>
              <div className="text-sm text-gray-600">분석 완료</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">95%</div>
              <div className="text-sm text-gray-600">만족도</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">4.8/5</div>
              <div className="text-sm text-gray-600">평균 평점</div>
            </div>
          </div>
        </div>

        {/* 주요 기능 */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">
            🔍 주요 분석 기능
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gray-100 mb-4 ${feature.color}`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* 분석 과정 */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">
            🚀 간단한 4단계 분석 과정
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${step.color}`}>
                  <step.icon className="w-8 h-8" />
                </div>
                <div className="text-lg font-semibold text-gray-800 mb-2">
                  {step.number}. {step.title}
                </div>
                <p className="text-sm text-gray-600">
                  {step.description}
                </p>
                {index < steps.length - 1 && (
                  <ArrowRight className="w-6 h-6 text-gray-400 mx-auto mt-4 hidden lg:block" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 장점 */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">
            💡 서비스 장점
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 mb-4">
                    <benefit.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">
                    {benefit.title}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA 섹션 */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardContent className="p-12">
              <h3 className="text-3xl font-bold mb-4">
                지금 바로 시작해보세요!
              </h3>
              <p className="text-xl mb-8 opacity-90">
                부모와 자녀의 소중한 순간을 분석하고, 더 나은 상호작용을 만들어보세요.
              </p>
              <Button 
                onClick={handleStartAnalysis}
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg"
              >
                <Upload className="w-5 h-5 mr-2" />
                무료로 시작하기
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 푸터 */}
      <div className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">놀이 상호작용 분석</span>
            </div>
            <p className="text-gray-400 mb-6">
              AI 기반 부모-자녀 상호작용 분석으로 더 나은 놀이 환경을 만들어보세요
            </p>
            <div className="flex justify-center gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white">서비스 소개</a>
              <a href="#" className="hover:text-white">개인정보처리방침</a>
              <a href="#" className="hover:text-white">이용약관</a>
              <a href="#" className="hover:text-white">고객지원</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 