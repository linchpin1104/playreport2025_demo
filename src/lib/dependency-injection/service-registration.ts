import { Firestore } from '@google-cloud/firestore';
import { Storage } from '@google-cloud/storage';
import { VideoIntelligenceServiceClient } from '@google-cloud/video-intelligence';
import OpenAI from 'openai';
import { AdvancedSpeakerDiarization } from '../advanced-speaker-diarization';
import { EmotionalInteractionAnalyzer } from '../emotional-interaction-analyzer';
import { GCPDataStorage } from '../gcp-data-storage';
import { IntegratedAnalysisSystem } from '../integrated-analysis-system';
import { LanguageInteractionAnalyzer } from '../language-interaction-analyzer';
import { PhysicalInteractionAnalyzer } from '../physical-interaction-analyzer';
import { PlayAnalysisExtractor } from '../play-analysis-extractor';
import { PlayPatternAnalyzer } from '../play-pattern-analyzer';
import { APIOptimizer } from '../services/api-optimizer';
import { CacheManager } from '../services/cache';
import { ConfigManager } from '../services/config-manager';
import { ErrorHandlingService } from '../services/error-handling-service';
import { Logger, LoggerFactory } from '../services/logger';
import { VideoAnalyzer } from '../video-analyzer';
import { DIContainer, ServiceTokens, container } from './container';

/**
 * DI 컨테이너 서비스 등록 설정 (PlayDataStorage 제거 - GCPDataStorage로 통일)
 */
export function configureServices(container: DIContainer): void {
  // Core Services
  container.registerSingleton(
    ServiceTokens.CONFIG_MANAGER,
    ConfigManager
  );

  container.registerSingleton(
    ServiceTokens.CACHE_MANAGER,
    CacheManager
  );

  container.registerSingleton(
    ServiceTokens.API_OPTIMIZER,
    APIOptimizer
  );

  container.registerFactory(
    ServiceTokens.LOGGER,
    (service: string) => LoggerFactory.getLogger(service),
    [],
    'transient'
  );

  // External Service Clients
  container.registerFactory(
    ServiceTokens.VIDEO_INTELLIGENCE_CLIENT,
    () => {
      const configManager = container.resolve<ConfigManager>(ServiceTokens.CONFIG_MANAGER);
      if (configManager.isFailure()) {
        throw new Error('Failed to resolve ConfigManager');
      }
      
      const config = configManager.getValue().getAll();
      return new VideoIntelligenceServiceClient({
        projectId: config.gcp.projectId,
        keyFilename: config.gcp.keyFile,
      });
    },
    [ServiceTokens.CONFIG_MANAGER],
    'singleton'
  );

  container.registerFactory(
    ServiceTokens.GOOGLE_CLOUD_STORAGE,
    () => {
      const configManager = container.resolve<ConfigManager>(ServiceTokens.CONFIG_MANAGER);
      if (configManager.isFailure()) {
        throw new Error('Failed to resolve ConfigManager');
      }
      
      const config = configManager.getValue().getAll();
      return new Storage({
        projectId: config.gcp.projectId,
        keyFilename: config.gcp.keyFile,
      });
    },
    [ServiceTokens.CONFIG_MANAGER],
    'singleton'
  );

  container.registerFactory(
    ServiceTokens.FIRESTORE,
    () => {
      const configManager = container.resolve<ConfigManager>(ServiceTokens.CONFIG_MANAGER);
      if (configManager.isFailure()) {
        throw new Error('Failed to resolve ConfigManager');
      }
      
      const config = configManager.getValue().getAll();
      return new Firestore({
        projectId: config.gcp.projectId,
        keyFilename: config.gcp.keyFile,
      });
    },
    [ServiceTokens.CONFIG_MANAGER],
    'singleton'
  );

  container.registerFactory(
    ServiceTokens.OPENAI_CLIENT,
    () => {
      const configManager = container.resolve<ConfigManager>(ServiceTokens.CONFIG_MANAGER);
      if (configManager.isFailure()) {
        throw new Error('Failed to resolve ConfigManager');
      }
      
      const config = configManager.getValue().getAll();
      return new OpenAI({
        apiKey: config.apis.openai.apiKey,
      });
    },
    [ServiceTokens.CONFIG_MANAGER],
    'singleton'
  );

  container.registerSingleton(
    ServiceTokens.ERROR_HANDLING_SERVICE,
    ErrorHandlingService
  );

  // VideoAnalyzer - ConfigManager 의존성 추가
  container.registerFactory(
    ServiceTokens.VIDEO_ANALYZER,
    () => {
      const configManager = container.resolve<ConfigManager>(ServiceTokens.CONFIG_MANAGER);
      if (configManager.isFailure()) {
        throw new Error('Failed to resolve ConfigManager');
      }
      
      // VideoAnalyzer는 내부적으로 ConfigManager.getInstance()를 사용하므로
      // 여기서는 단순히 생성만 해주면 됨
      return new VideoAnalyzer();
    },
    [ServiceTokens.CONFIG_MANAGER],
    'singleton'
  );

  // Data Storage - GCPDataStorage만 사용 (PlayDataStorage 제거)
  container.registerFactory(
    ServiceTokens.GCP_DATA_STORAGE,
    () => {
      return new GCPDataStorage();
    },
    [],
    'singleton'
  );

  // Analysis Services
  container.registerSingleton(
    ServiceTokens.PHYSICAL_INTERACTION_ANALYZER,
    PhysicalInteractionAnalyzer
  );

  container.registerSingleton(
    ServiceTokens.LANGUAGE_INTERACTION_ANALYZER,
    LanguageInteractionAnalyzer
  );

  container.registerSingleton(
    ServiceTokens.EMOTIONAL_INTERACTION_ANALYZER,
    EmotionalInteractionAnalyzer
  );

  container.registerSingleton(
    ServiceTokens.PLAY_PATTERN_ANALYZER,
    PlayPatternAnalyzer
  );

  container.registerSingleton(
    ServiceTokens.INTEGRATED_ANALYSIS_SYSTEM,
    IntegratedAnalysisSystem
  );

  container.registerSingleton(
    ServiceTokens.PLAY_ANALYSIS_EXTRACTOR,
    PlayAnalysisExtractor
  );

  container.registerSingleton(
    ServiceTokens.SPEAKER_DIARIZATION,
    AdvancedSpeakerDiarization
  );
}

/**
 * 서비스 인스턴스 해결 헬퍼
 */
export class ServiceResolver {
  static resolve<T>(token: symbol): T {
    const result = container.resolve<T>(token);
    if (result.isFailure()) {
      throw new Error(`Failed to resolve service: ${token.toString()}`);
    }
    return result.getValue();
  }

  static tryResolve<T>(token: symbol): T | null {
    const result = container.resolve<T>(token);
    return result.isSuccess() ? result.getValue() : null;
  }
} 