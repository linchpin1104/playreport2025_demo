// 캐싱 시스템
export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  cleanupInterval: number;
  enableLogging: boolean;
}

export class MemoryCache<T> {
  private readonly cache: Map<string, CacheEntry<T>> = new Map();
  private cleanupTimer?: NodeJS.Timeout;
  private readonly config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: config.maxSize ?? 100,
      defaultTTL: config.defaultTTL ?? 5 * 60 * 1000, // 5분
      cleanupInterval: config.cleanupInterval ?? 60 * 1000, // 1분
      enableLogging: config.enableLogging ?? false
    };

    this.startCleanupTimer();
  }

  set(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    
    // 캐시 크기 제한
    if (this.cache.size >= this.config.maxSize) {
      this.evictLeastRecentlyUsed();
    }

    this.cache.set(key, {
      value,
      timestamp: now,
      ttl: ttl ?? this.config.defaultTTL,
      accessCount: 0,
      lastAccessed: now
    });

    if (this.config.enableLogging) {
      console.log(`Cache SET: ${key} (TTL: ${ttl ?? this.config.defaultTTL}ms)`);
    }
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    
    // TTL 확인
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      if (this.config.enableLogging) {
        console.log(`Cache EXPIRED: ${key}`);
      }
      return null;
    }

    // 액세스 정보 업데이트
    entry.accessCount++;
    entry.lastAccessed = now;

    if (this.config.enableLogging) {
      console.log(`Cache HIT: ${key} (access count: ${entry.accessCount})`);
    }

    return entry.value;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted && this.config.enableLogging) {
      console.log(`Cache DELETE: ${key}`);
    }
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    if (this.config.enableLogging) {
      console.log('Cache CLEARED');
    }
  }

  size(): number {
    return this.cache.size;
  }

  getStats() {
    const entries = Array.from(this.cache.values());
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      totalAccess: entries.reduce((sum, entry) => sum + entry.accessCount, 0),
      avgAccessCount: entries.length > 0 ? entries.reduce((sum, entry) => sum + entry.accessCount, 0) / entries.length : 0,
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : null,
      newestEntry: entries.length > 0 ? Math.max(...entries.map(e => e.timestamp)) : null
    };
  }

  private evictLeastRecentlyUsed(): void {
    if (this.cache.size === 0) {return;}

    let lruKey: string | null = null;
    let lruTime = Infinity;

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
      if (this.config.enableLogging) {
        console.log(`Cache EVICTED (LRU): ${lruKey}`);
      }
    }
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0 && this.config.enableLogging) {
      console.log(`Cache CLEANUP: ${cleanedCount} entries removed`);
    }
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clear();
  }
}

// 캐시 매니저 - 여러 캐시 인스턴스 관리
export class CacheManager {
  private readonly caches: Map<string, MemoryCache<any>> = new Map();

  getCache<T>(name: string, config?: Partial<CacheConfig>): MemoryCache<T> {
    if (!this.caches.has(name)) {
      this.caches.set(name, new MemoryCache<T>(config));
    }
    return this.caches.get(name)!;
  }

  clearAll(): void {
    for (const cache of Array.from(this.caches.values())) {
      cache.clear();
    }
  }

  getGlobalStats() {
    const stats: Record<string, any> = {};
    for (const [name, cache] of Array.from(this.caches.entries())) {
      stats[name] = cache.getStats();
    }
    return stats;
  }

  destroy(): void {
    for (const cache of Array.from(this.caches.values())) {
      cache.destroy();
    }
    this.caches.clear();
  }
}

// 싱글톤 캐시 매니저
export const cacheManager = new CacheManager();

// 특정 목적별 캐시 인스턴스
export const caches = {
  // 세션 정보 캐시 (5분)
  sessions: cacheManager.getCache<any>('sessions', { defaultTTL: 5 * 60 * 1000 }),
  
  // 분석 결과 캐시 (30분)
  analysisResults: cacheManager.getCache<any>('analysisResults', { defaultTTL: 30 * 60 * 1000 }),
  
  // 개발 상태 캐시 (1분)
  devStatus: cacheManager.getCache<any>('devStatus', { defaultTTL: 60 * 1000 }),
  
  // API 응답 캐시 (10분)
  apiResponses: cacheManager.getCache<any>('apiResponses', { defaultTTL: 10 * 60 * 1000 }),
  
  // 파일 메타데이터 캐시 (1시간)
  fileMetadata: cacheManager.getCache<any>('fileMetadata', { defaultTTL: 60 * 60 * 1000 })
};

// 캐시 키 생성 헬퍼
export const CacheKeys = {
  session: (sessionId: string) => `session:${sessionId}`,
  analysisResult: (sessionId: string, type: string) => `analysis:${sessionId}:${type}`,
  devStatus: () => 'dev-status',
  apiResponse: (endpoint: string, params: string) => `api:${endpoint}:${params}`,
  fileMetadata: (fileId: string) => `file:${fileId}`
};

// 캐시 데코레이터 함수
export function cached<T>(
  cache: MemoryCache<T>,
  keyGenerator: (...args: any[]) => string,
  ttl?: number
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const key = keyGenerator(...args);
      
      // 캐시 확인
      const cached = cache.get(key);
      if (cached !== null) {
        return cached;
      }

      // 캐시 미스 - 실제 메서드 실행
      const result = await originalMethod.apply(this, args);
      
      // 결과 캐시
      cache.set(key, result, ttl);
      
      return result;
    };

    return descriptor;
  };
}

// 사용 예시
/*
class VideoAnalysisService {
  @cached(caches.analysisResults, (sessionId: string) => CacheKeys.analysisResult(sessionId, 'video'))
  async analyzeVideo(sessionId: string): Promise<VideoAnalysisResult> {
    // 실제 분석 로직
  }
}
*/ 