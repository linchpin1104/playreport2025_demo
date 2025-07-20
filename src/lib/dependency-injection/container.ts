import { ServiceResult } from '../interfaces';
import { Logger } from '../services/logger';

export type ServiceLifetime = 'singleton' | 'transient' | 'scoped';

export interface ServiceDescriptor<T = any> {
  token: string | symbol;
  implementation: new (...args: any[]) => T;
  factory?: (...args: any[]) => T;
  dependencies?: (string | symbol)[];
  lifetime: ServiceLifetime;
}

export interface ServiceRegistration<T = any> {
  descriptor: ServiceDescriptor<T>;
  instance?: T;
  scopedInstances?: Map<string, T>;
}

export class DIContainer {
  private services: Map<string | symbol, ServiceRegistration> = new Map();
  private readonly logger: Logger;
  private scopeId: string = 'default';

  constructor() {
    this.logger = new Logger('DIContainer');
  }

  /**
   * 서비스 등록
   */
  register<T>(descriptor: ServiceDescriptor<T>): DIContainer {
    this.services.set(descriptor.token, {
      descriptor,
      instance: undefined,
      scopedInstances: new Map()
    });

    this.logger.debug(`Service registered: ${String(descriptor.token)}`);
    return this;
  }

  /**
   * 싱글톤 서비스 등록
   */
  registerSingleton<T>(
    token: string | symbol,
    implementation: new (...args: any[]) => T,
    dependencies: (string | symbol)[] = []
  ): DIContainer {
    return this.register({
      token,
      implementation,
      dependencies,
      lifetime: 'singleton'
    });
  }

  /**
   * 임시 서비스 등록 (매번 새 인스턴스)
   */
  registerTransient<T>(
    token: string | symbol,
    implementation: new (...args: any[]) => T,
    dependencies: (string | symbol)[] = []
  ): DIContainer {
    return this.register({
      token,
      implementation,
      dependencies,
      lifetime: 'transient'
    });
  }

  /**
   * 스코프 서비스 등록 (스코프 당 하나의 인스턴스)
   */
  registerScoped<T>(
    token: string | symbol,
    implementation: new (...args: any[]) => T,
    dependencies: (string | symbol)[] = []
  ): DIContainer {
    return this.register({
      token,
      implementation,
      dependencies,
      lifetime: 'scoped'
    });
  }

  /**
   * 팩토리 함수로 서비스 등록
   */
  registerFactory<T>(
    token: string | symbol,
    factory: (...args: any[]) => T,
    dependencies: (string | symbol)[] = [],
    lifetime: ServiceLifetime = 'transient'
  ): DIContainer {
    return this.register({
      token,
      implementation: null as any,
      factory,
      dependencies,
      lifetime
    });
  }

  /**
   * 서비스 해결
   */
  resolve<T>(token: string | symbol): ServiceResult<T> {
    try {
      const registration = this.services.get(token);
      
      if (!registration) {
        return ServiceResult.failure(
          'SERVICE_NOT_FOUND',
          `Service not found: ${String(token)}`,
          { token: String(token) }
        );
      }

      const instance = this.createInstance<T>(registration);
      
      if (!instance) {
        return ServiceResult.failure(
          'INSTANCE_CREATION_FAILED',
          `Failed to create instance for: ${String(token)}`,
          { token: String(token) }
        );
      }

      return ServiceResult.success(instance);
    } catch (error) {
      this.logger.error(
        `Service resolution failed: ${String(token)}`, 
        error instanceof Error ? error : new Error(String(error))
      );
      return ServiceResult.failure(
        'RESOLUTION_ERROR',
        `Service resolution failed: ${String(token)}`,
        { 
          token: String(token), 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }
      );
    }
  }

  /**
   * 인스턴스 생성
   */
  private createInstance<T>(registration: ServiceRegistration<T>): T | null {
    const { descriptor } = registration;

    switch (descriptor.lifetime) {
      case 'singleton':
        return this.getSingletonInstance(registration);
      
      case 'scoped':
        return this.getScopedInstance(registration);
      
      case 'transient':
        return this.createNewInstance(registration);
      
      default:
        return null;
    }
  }

  /**
   * 싱글톤 인스턴스 가져오기
   */
  private getSingletonInstance<T>(registration: ServiceRegistration<T>): T {
    if (!registration.instance) {
      registration.instance = this.createNewInstance(registration);
    }
    return registration.instance;
  }

  /**
   * 스코프 인스턴스 가져오기
   */
  private getScopedInstance<T>(registration: ServiceRegistration<T>): T {
    if (!registration.scopedInstances!.has(this.scopeId)) {
      const instance = this.createNewInstance(registration);
      registration.scopedInstances!.set(this.scopeId, instance);
    }
    return registration.scopedInstances!.get(this.scopeId)!;
  }

  /**
   * 새 인스턴스 생성
   */
  private createNewInstance<T>(registration: ServiceRegistration<T>): T {
    const { descriptor } = registration;
    
    // 의존성 해결
    const dependencies = this.resolveDependencies(descriptor.dependencies || []);
    
    // 팩토리 함수 사용
    if (descriptor.factory) {
      return descriptor.factory(...dependencies);
    }
    
    // 생성자 사용
    return new descriptor.implementation(...dependencies);
  }

  /**
   * 의존성 해결
   */
  private resolveDependencies(dependencies: (string | symbol)[]): any[] {
    return dependencies.map(dep => {
      const result = this.resolve(dep);
      if (result.isFailure()) {
        throw new Error(`Failed to resolve dependency: ${String(dep)}`);
      }
      return result.getValue();
    });
  }

  /**
   * 스코프 시작
   */
  beginScope(scopeId: string): DIContainer {
    const scopedContainer = new DIContainer();
    scopedContainer.services = this.services;
    scopedContainer.scopeId = scopeId;
    return scopedContainer;
  }

  /**
   * 스코프 종료
   */
  endScope(): void {
    // 스코프 인스턴스 정리
    for (const registration of Array.from(this.services.values())) {
      if (registration.scopedInstances) {
        registration.scopedInstances.delete(this.scopeId);
      }
    }
  }

  /**
   * 컨테이너 정리
   */
  dispose(): void {
    this.services.clear();
    this.logger.info('DI Container disposed');
  }

  /**
   * 등록된 서비스 목록
   */
  getRegisteredServices(): string[] {
    return Array.from(this.services.keys()).map(key => String(key));
  }
}

// 서비스 토큰 정의 (PlayDataStorage 제거 - GCPDataStorage로 통일)
export const ServiceTokens = {
  // Core Services
  LOGGER: Symbol('Logger'),
  CONFIG_MANAGER: Symbol('ConfigManager'),
  CACHE_MANAGER: Symbol('CacheManager'),
  
  // Data Services
  VIDEO_ANALYZER: Symbol('VideoAnalyzer'),
  GCP_DATA_STORAGE: Symbol('GCPDataStorage'),
  
  // Analysis Services
  INTEGRATED_ANALYSIS_SYSTEM: Symbol('IntegratedAnalysisSystem'),
  PHYSICAL_INTERACTION_ANALYZER: Symbol('PhysicalInteractionAnalyzer'),
  LANGUAGE_INTERACTION_ANALYZER: Symbol('LanguageInteractionAnalyzer'),
  EMOTIONAL_INTERACTION_ANALYZER: Symbol('EmotionalInteractionAnalyzer'),
  PLAY_PATTERN_ANALYZER: Symbol('PlayPatternAnalyzer'),
  
  // External Services
  OPENAI_CLIENT: Symbol('OpenAIClient'),
  GOOGLE_CLOUD_STORAGE: Symbol('GoogleCloudStorage'),
  FIRESTORE: Symbol('Firestore'),
  VIDEO_INTELLIGENCE_CLIENT: Symbol('VideoIntelligenceClient'),
  
  // Utility Services
  API_OPTIMIZER: Symbol('APIOptimizer'),
  SPEAKER_DIARIZATION: Symbol('SpeakerDiarization'),
  PLAY_ANALYSIS_EXTRACTOR: Symbol('PlayAnalysisExtractor'),
  
  // Business Services
  VIDEO_ANALYSIS_SERVICE: Symbol('VideoAnalysisService'),
  ERROR_HANDLING_SERVICE: Symbol('ErrorHandlingService')
} as const;

// 글로벌 컨테이너 인스턴스
export const container = new DIContainer(); 