'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DevModeToggle() {
  const [isDevMode, setIsDevMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 개발 모드 상태 확인
    checkDevMode();
  }, []);

  const checkDevMode = async () => {
    try {
      // 환경 변수 확인을 위한 간단한 API 호출
      const response = await fetch('/api/dev-status');
      if (response.ok) {
        const data = await response.json();
        setIsDevMode(data.isDevMode);
      }
    } catch (error) {
      console.error('개발 모드 상태 확인 오류:', error);
      // 기본값으로 process.env 확인
      setIsDevMode(process.env.NODE_ENV === 'development');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDevMode = () => {
    const newDevMode = !isDevMode;
    setIsDevMode(newDevMode);
    
    // 로컬 스토리지에 상태 저장
    localStorage.setItem('devMode', newDevMode.toString());
    
    // 환경 변수 시뮬레이션을 위한 전역 변수 설정
    (window as any).__DEV_MODE__ = newDevMode;
    
    // 페이지 새로고침으로 설정 적용
    window.location.reload();
  };

  if (isLoading) {
    return null;
  }

  return (
    <Card className="mb-4 border-dashed border-2 border-yellow-300 bg-yellow-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          🚀 개발 모드
          <span className={`px-2 py-1 text-xs rounded-full ${
            isDevMode 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {isDevMode ? 'ON' : 'OFF'}
          </span>
        </CardTitle>
        <CardDescription>
          개발 모드에서는 실제 API 호출 대신 Mock 데이터를 사용하여 빠른 개발과 테스트가 가능합니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <div className="text-sm text-gray-600">
            {isDevMode ? (
              <div className="space-y-1">
                <p>✅ Mock 데이터 사용 중</p>
                <p>✅ 실제 API 호출 없음</p>
                <p>✅ 빠른 테스트 가능</p>
                <p>✅ 토큰 사용량 절약</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p>🔄 실제 API 호출 사용</p>
                <p>🔄 Google Cloud Video Intelligence API</p>
                <p>🔄 OpenAI GPT-4 API</p>
                <p>🔄 Firebase Storage</p>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={toggleDevMode}
              variant={isDevMode ? "destructive" : "default"}
              size="sm"
            >
              {isDevMode ? '🔄 실제 API 사용' : '🚀 개발 모드 활성화'}
            </Button>
            
            {isDevMode && (
              <Button 
                onClick={() => {
                  // 콘솔에 Mock 데이터 정보 출력
                  console.log('🚀 개발 모드 활성화됨 - Mock 데이터를 사용합니다.');
                  console.log('📁 Mock 데이터 경로: src/lib/mock-data/');
                  console.log('⚙️ 설정 파일: src/lib/mock-data-loader.ts');
                }}
                variant="outline"
                size="sm"
              >
                📋 로그 확인
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 