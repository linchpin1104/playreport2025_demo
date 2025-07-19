// API 최적화 서비스
export interface RequestConfig {
  debounceMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
  cacheKey?: string;
  cacheTTL?: number;
}

export interface RequestState {
  inProgress: boolean;
  lastCall: number;
  callCount: number;
  lastResult?: any;
  lastError?: Error;
}

export class APIOptimizer {
  private readonly requestStates: Map<string, RequestState> = new Map();
  private readonly debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly cache: Map<string, { value: any; timestamp: number; ttl: number }> = new Map();

  // 디바운스된 API 호출
  async debouncedCall<T>(
    key: string,
    fn: () => Promise<T>,
    config: RequestConfig = {}
  ): Promise<T> {
    const {
      debounceMs = 1000,
      maxRetries = 3,
      retryDelayMs = 1000,
      timeoutMs = 30000,
      cacheKey,
      cacheTTL = 60000
    } = config;

    // 캐시 확인
    if (cacheKey && this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!.value;
    }

    // 현재 진행 중인 요청 확인
    const state = this.getRequestState(key);
    
    if (state.inProgress) {
      throw new Error(`Request ${key} is already in progress`);
    }

    // 디바운스 타이머 설정
    return new Promise<T>((resolve, reject) => {
      // 기존 타이머 클리어
      if (this.debounceTimers.has(key)) {
        clearTimeout(this.debounceTimers.get(key));
      }

      // 새 타이머 설정
      const timer = setTimeout(async () => {
        try {
          this.debounceTimers.delete(key);
          const result = await this.executeWithRetry(key, fn, maxRetries, retryDelayMs, timeoutMs);
          
          // 결과 캐시
          if (cacheKey) {
            this.cache.set(cacheKey, {
              value: result,
              timestamp: Date.now(),
              ttl: cacheTTL
            });
          }
          
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, debounceMs);

      this.debounceTimers.set(key, timer);
    });
  }

  // 중복 호출 방지
  async singleCall<T>(
    key: string,
    fn: () => Promise<T>,
    config: RequestConfig = {}
  ): Promise<T> {
    const state = this.getRequestState(key);
    
    // 이미 진행 중인 요청이 있다면 대기
    if (state.inProgress) {
      return this.waitForCompletion(key);
    }

    // 요청 시작
    state.inProgress = true;
    state.lastCall = Date.now();
    state.callCount++;

    try {
      const result = await this.executeWithRetry(
        key,
        fn,
        config.maxRetries ?? 3,
        config.retryDelayMs ?? 1000,
        config.timeoutMs ?? 30000
      );
      
      state.lastResult = result;
      state.lastError = undefined;
      
      return result;
    } catch (error) {
      state.lastError = error as Error;
      throw error;
    } finally {
      state.inProgress = false;
    }
  }

  // 재시도 로직
  private async executeWithRetry<T>(
    key: string,
    fn: () => Promise<T>,
    maxRetries: number,
    retryDelayMs: number,
    timeoutMs: number
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.executeWithTimeout(fn, timeoutMs);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }

        // 지수 백오프
        const delay = retryDelayMs * Math.pow(2, attempt);
        await this.delay(delay);
      }
    }

    throw lastError;
  }

  // 타임아웃 처리
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) => {
        setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs);
      })
    ]);
  }

  // 요청 완료 대기
  private async waitForCompletion<T>(key: string): Promise<T> {
    const state = this.getRequestState(key);
    
    while (state.inProgress) {
      await this.delay(100);
    }

    if (state.lastError) {
      throw state.lastError;
    }

    return state.lastResult;
  }

  // 요청 상태 관리
  private getRequestState(key: string): RequestState {
    if (!this.requestStates.has(key)) {
      this.requestStates.set(key, {
        inProgress: false,
        lastCall: 0,
        callCount: 0
      });
    }
    return this.requestStates.get(key)!;
  }

  // 캐시 유효성 확인
  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) {return false;}
    
    return Date.now() - cached.timestamp < cached.ttl;
  }

  // 지연 유틸리티
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 통계 정보
  getStats() {
    const states = Array.from(this.requestStates.entries());
    
    return {
      totalRequests: states.length,
      inProgressRequests: states.filter(([, state]) => state.inProgress).length,
      totalCalls: states.reduce((sum, [, state]) => sum + state.callCount, 0),
      cacheSize: this.cache.size,
      activeTimers: this.debounceTimers.size
    };
  }

  // 정리
  cleanup(): void {
    // 타이머 정리
    for (const timer of Array.from(this.debounceTimers.values())) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    // 캐시 정리
    this.cache.clear();
    
    // 요청 상태 정리
    this.requestStates.clear();
  }
}

// 싱글톤 인스턴스
export const apiOptimizer = new APIOptimizer();

// 특정 용도별 최적화된 함수들
export const OptimizedAPI = {
  // dev-status API 최적화 (1분 캐시, 5초 디바운스)
  async getDevStatus() {
    return apiOptimizer.debouncedCall(
      'dev-status',
      async () => {
        const response = await fetch('/api/dev-status');
        return response.json();
      },
      {
        debounceMs: 5000,
        cacheKey: 'dev-status',
        cacheTTL: 60000,
        maxRetries: 2
      }
    );
  },

  // 분석 상태 확인 (중복 호출 방지)
  async getAnalysisStatus(sessionId: string) {
    return apiOptimizer.singleCall(
      `analysis-status-${sessionId}`,
      async () => {
        const response = await fetch(`/api/analysis-status?sessionId=${sessionId}`);
        return response.json();
      },
      {
        maxRetries: 3,
        retryDelayMs: 2000,
        timeoutMs: 15000
      }
    );
  },

  // 세션 정보 조회 (캐시 활용)
  async getSession(sessionId: string) {
    return apiOptimizer.debouncedCall(
      `session-${sessionId}`,
      async () => {
        const response = await fetch(`/api/session/${sessionId}`);
        return response.json();
      },
      {
        debounceMs: 1000,
        cacheKey: `session-${sessionId}`,
        cacheTTL: 5 * 60 * 1000, // 5분
        maxRetries: 2
      }
    );
  }
};

// React Hook 통합 (사용 예시)
/*
import { useEffect, useState } from 'react';
import { OptimizedAPI } from '@/lib/services/api-optimizer';

export function useOptimizedDevStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    OptimizedAPI.getDevStatus()
      .then(setStatus)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { status, loading, error };
}
*/ 