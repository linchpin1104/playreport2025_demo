'use client';

import { 
  Settings, ToggleLeft, ToggleRight, CheckCircle, 
  XCircle, AlertCircle, RefreshCw, ExternalLink,
  Cloud, Database, Video, FileText
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// 최적화된 API 호출 함수
async function getOptimizedDevStatus() {
  // 중복 호출 방지 및 캐싱을 위한 최적화된 fetch
  const cacheKey = 'dev-status-cache';
  const cacheTTL = 60000; // 1분
  
  // 캐시 확인
  const cachedData = localStorage.getItem(cacheKey);
  if (cachedData) {
    const { data, timestamp } = JSON.parse(cachedData);
    if (Date.now() - timestamp < cacheTTL) {
      return data;
    }
  }

  // 실제 API 호출
  const response = await fetch('/api/dev-status', {
    method: 'GET',
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  });
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.status}`);
  }
  
  const data = await response.json();
  
  // 캐시 저장
  localStorage.setItem(cacheKey, JSON.stringify({
    data,
    timestamp: Date.now()
  }));
  
  return data;
}

// 디바운싱 유틸리티
function useDebounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  return (...args: Parameters<T>) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    const timer = setTimeout(() => {
      func(...args);
    }, delay);
    
    setDebounceTimer(timer);
  };
}

interface ServiceStatus {
  name: string;
  enabled: boolean;
  description: string;
  setupUrl?: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface DevModeStatus {
  isDevelopmentMode: boolean;
  gcpServices: ServiceStatus[];
  isLoading: boolean;
  error?: string;
  lastUpdated?: number;
}

export default function DevModeToggle() {
  const [status, setStatus] = useState<DevModeStatus>({
    isDevelopmentMode: true,
    gcpServices: [
      {
        name: 'Firestore',
        enabled: false,
        description: '분석 결과 및 세션 데이터 저장',
        setupUrl: 'https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=full-kids-tracker',
        icon: Database
      },
      {
        name: 'Video Intelligence',
        enabled: false,
        description: '비디오 분석 (객체 추적, 얼굴 감지)',
        setupUrl: 'https://console.developers.google.com/apis/api/videointelligence.googleapis.com/overview?project=full-kids-tracker',
        icon: Video
      },
      {
        name: 'Cloud Storage',
        enabled: false,
        description: '비디오 파일 저장',
        setupUrl: 'https://console.developers.google.com/apis/api/storage.googleapis.com/overview?project=full-kids-tracker',
        icon: Cloud
      },
      {
        name: 'Text-to-Speech',
        enabled: false,
        description: 'TTS 기능 (향후 구현 예정)',
        setupUrl: 'https://console.developers.google.com/apis/api/texttospeech.googleapis.com/overview?project=full-kids-tracker',
        icon: FileText
      }
    ],
    isLoading: false
  });

  const [isToggling, setIsToggling] = useState(false);
  const [requestCount, setRequestCount] = useState(0);

  // 디바운싱된 로드 함수
  const debouncedLoadDevStatus = useDebounce(async () => {
    if (status.isLoading) {return;} // 이미 로딩 중이면 스킵
    
    setStatus(prev => ({ ...prev, isLoading: true, error: undefined }));
    setRequestCount(prev => prev + 1);
    
    try {
      const data = await getOptimizedDevStatus();
      
      setStatus(prev => ({
        ...prev,
        isDevelopmentMode: data.isDevelopmentMode,
        gcpServices: prev.gcpServices.map(service => ({
          ...service,
          enabled: data.gcpServices?.[service.name.toLowerCase().replace(/[^a-z]/g, '')] || false
        })),
        isLoading: false,
        lastUpdated: Date.now()
      }));
    } catch (error) {
      console.error('Dev status load error:', error);
      setStatus(prev => ({
        ...prev,
        isLoading: false,
        error: '상태 확인 중 오류가 발생했습니다.'
      }));
    }
  }, 2000); // 2초 디바운스

  // 컴포넌트 마운트 시 한 번만 실행
  useEffect(() => {
    debouncedLoadDevStatus();
  }, []); // 빈 의존성 배열

  const toggleMode = async () => {
    if (isToggling) {return;} // 이미 전환 중이면 스킵
    
    if (!status.isDevelopmentMode) {
      // 실제 모드에서 개발 모드로 변경 (항상 가능)
      setIsToggling(true);
      try {
        const response = await fetch('/api/dev-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ developmentMode: true })
        });
        
        if (response.ok) {
          setStatus(prev => ({ ...prev, isDevelopmentMode: true }));
          // 캐시 무효화
          localStorage.removeItem('dev-status-cache');
        }
      } catch (error) {
        console.error('모드 전환 실패:', error);
      } finally {
        setIsToggling(false);
      }
      return;
    }

    // 개발 모드에서 실제 모드로 변경하려면 GCP 서비스 확인
    const enabledServices = status.gcpServices.filter(service => service.enabled);
    
    if (enabledServices.length < 2) {
      // 최소 Firestore와 Video Intelligence가 필요
      alert('실제 데이터 모드를 사용하려면 최소 Firestore와 Video Intelligence API를 활성화해야 합니다.');
      return;
    }

    setIsToggling(true);
    try {
      const response = await fetch('/api/dev-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ developmentMode: false })
      });
      
      if (response.ok) {
        setStatus(prev => ({ ...prev, isDevelopmentMode: false }));
        // 캐시 무효화
        localStorage.removeItem('dev-status-cache');
      }
    } catch (error) {
      console.error('모드 전환 실패:', error);
    } finally {
      setIsToggling(false);
    }
  };

  // 수동 새로고침 (디바운싱 적용)
  const handleRefresh = () => {
    // 캐시 무효화
    localStorage.removeItem('dev-status-cache');
    debouncedLoadDevStatus();
  };

  const getStatusColor = (enabled: boolean) => {
    return enabled ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (enabled: boolean) => {
    return enabled ? CheckCircle : XCircle;
  };

  const enabledServicesCount = status.gcpServices.filter(service => service.enabled).length;
  const canUseRealMode = enabledServicesCount >= 2;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          개발 모드 설정
          {requestCount > 0 && (
            <Badge variant="outline" className="text-xs">
              API 호출: {requestCount}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 성능 정보 */}
        {status.lastUpdated && (
          <div className="text-xs text-gray-500">
            마지막 업데이트: {new Date(status.lastUpdated).toLocaleTimeString()}
          </div>
        )}
        
        {/* 현재 모드 표시 */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-semibold text-lg">
              현재 모드: {status.isDevelopmentMode ? '개발 모드' : '실제 데이터 모드'}
            </h3>
            <p className="text-sm text-gray-600">
              {status.isDevelopmentMode 
                ? 'Mock 데이터를 사용하여 빠른 테스트가 가능합니다'
                : '실제 GCP 서비스를 사용하여 비디오를 분석합니다'
              }
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant={status.isDevelopmentMode ? 'secondary' : 'default'}>
              {status.isDevelopmentMode ? '개발' : '실제'}
            </Badge>
            
            <Button
              onClick={toggleMode}
              disabled={isToggling || status.isLoading}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {isToggling ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : status.isDevelopmentMode ? (
                <ToggleLeft className="w-4 h-4" />
              ) : (
                <ToggleRight className="w-4 h-4" />
              )}
              모드 전환
            </Button>
          </div>
        </div>

        {/* 에러 표시 */}
        {status.error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {status.error}
            </AlertDescription>
          </Alert>
        )}

        {/* GCP 서비스 상태 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold">GCP 서비스 상태</h4>
            <Button
              onClick={handleRefresh}
              disabled={status.isLoading}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${status.isLoading ? 'animate-spin' : ''}`} />
              새로고침
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {status.gcpServices.map((service, index) => {
              const StatusIcon = getStatusIcon(service.enabled);
              const ServiceIcon = service.icon;
              
              return (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <ServiceIcon className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="font-medium">{service.name}</div>
                      <div className="text-xs text-gray-500">{service.description}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`w-5 h-5 ${getStatusColor(service.enabled)}`} />
                    {service.setupUrl && !service.enabled && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(service.setupUrl, '_blank')}
                        className="p-1"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 실제 모드 전환 가능 여부 */}
        {status.isDevelopmentMode && !canUseRealMode && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              실제 데이터 모드를 사용하려면 최소 2개의 GCP 서비스가 활성화되어야 합니다.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
} 