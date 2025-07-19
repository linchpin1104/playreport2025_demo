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
import { PlayDataStorage } from '../play-data-storage';
import { PlayPatternAnalyzer } from '../play-pattern-analyzer';
import { APIOptimizer } from '../services/api-optimizer';
import { CacheManager } from '../services/cache';
import { ConfigManager } from '../services/config-manager';
import { ErrorHandlingService } from '../services/error-handling-service';
import { Logger, LoggerFactory } from '../services/logger';
import { VideoAnalyzer } from '../video-analyzer';
import { DIContainer, ServiceTokens } from './container';

/**
 * DI 컨테이너 서비스 등록 설정
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

  // Data Services
  container.registerFactory(
    ServiceTokens.VIDEO_ANALYZER,
    () => {
      // VideoAnalyzer는 리팩토링 후 의존성 주입을 받도록 수정 예정
      const client = container.resolve(ServiceTokens.VIDEO_INTELLIGENCE_CLIENT);
      if (client.isFailure()) {
        throw new Error('Failed to resolve VideoIntelligenceClient');
      }
      
      // 현재는 기존 방식으로 생성하되, 추후 리팩토링 예정
      return new VideoAnalyzer();
    },
    [ServiceTokens.VIDEO_INTELLIGENCE_CLIENT],
    'singleton'
  );

  container.registerFactory(
    ServiceTokens.GCP_DATA_STORAGE,
    () => {
      // GCPDataStorage는 리팩토링 후 의존성 주입을 받도록 수정 예정
      const firestore = container.resolve(ServiceTokens.FIRESTORE);
      const storage = container.resolve(ServiceTokens.GOOGLE_CLOUD_STORAGE);
      
      if (firestore.isFailure() || storage.isFailure()) {
        throw new Error('Failed to resolve GCP dependencies');
      }
      
      // 현재는 기존 방식으로 생성하되, 추후 리팩토링 예정
      return new GCPDataStorage();
    },
    [ServiceTokens.FIRESTORE, ServiceTokens.GOOGLE_CLOUD_STORAGE],
    'singleton'
  );

  container.registerSingleton(
    ServiceTokens.PLAY_DATA_STORAGE,
    PlayDataStorage
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

  container.registerFactory(
    ServiceTokens.INTEGRATED_ANALYSIS_SYSTEM,
    () => {
      // IntegratedAnalysisSystem은 리팩토링 후 의존성 주입을 받도록 수정 예정
      const physicalAnalyzer = container.resolve(ServiceTokens.PHYSICAL_INTERACTION_ANALYZER);
      const languageAnalyzer = container.resolve(ServiceTokens.LANGUAGE_INTERACTION_ANALYZER);
      const emotionalAnalyzer = container.resolve(ServiceTokens.EMOTIONAL_INTERACTION_ANALYZER);
      const playPatternAnalyzer = container.resolve(ServiceTokens.PLAY_PATTERN_ANALYZER);
      
      if (physicalAnalyzer.isFailure() || languageAnalyzer.isFailure() || 
          emotionalAnalyzer.isFailure() || playPatternAnalyzer.isFailure()) {
        throw new Error('Failed to resolve analysis dependencies');
      }
      
      // 현재는 기존 방식으로 생성하되, 추후 리팩토링 예정
      return new IntegratedAnalysisSystem();
    },
    [
      ServiceTokens.PHYSICAL_INTERACTION_ANALYZER,
      ServiceTokens.LANGUAGE_INTERACTION_ANALYZER,
      ServiceTokens.EMOTIONAL_INTERACTION_ANALYZER,
      ServiceTokens.PLAY_PATTERN_ANALYZER
    ],
    'singleton'
  );

  // Utility Services
  container.registerSingleton(
    ServiceTokens.SPEAKER_DIARIZATION,
    AdvancedSpeakerDiarization
  );

  container.registerSingleton(
    ServiceTokens.PLAY_ANALYSIS_EXTRACTOR,
    PlayAnalysisExtractor
  );
}

/**
 * 서비스 레졸브 헬퍼 함수들
 */
export class ServiceResolver {
  constructor(private readonly container: DIContainer) {}

  getVideoAnalyzer(): VideoAnalyzer {
    const result = this.container.resolve<VideoAnalyzer>(ServiceTokens.VIDEO_ANALYZER);
    if (result.isFailure()) {
      throw new Error('Failed to resolve VideoAnalyzer');
    }
    return result.getValue();
  }

  getGCPDataStorage(): GCPDataStorage {
    const result = this.container.resolve<GCPDataStorage>(ServiceTokens.GCP_DATA_STORAGE);
    if (result.isFailure()) {
      throw new Error('Failed to resolve GCPDataStorage');
    }
    return result.getValue();
  }

  getIntegratedAnalysisSystem(): IntegratedAnalysisSystem {
    const result = this.container.resolve<IntegratedAnalysisSystem>(ServiceTokens.INTEGRATED_ANALYSIS_SYSTEM);
    if (result.isFailure()) {
      throw new Error('Failed to resolve IntegratedAnalysisSystem');
    }
    return result.getValue();
  }

  getLogger(service: string): Logger {
    const result = this.container.resolve<Logger>(ServiceTokens.LOGGER);
    if (result.isFailure()) {
      throw new Error('Failed to resolve Logger');
    }
    return result.getValue();
  }

  getConfigManager(): ConfigManager {
    const result = this.container.resolve<ConfigManager>(ServiceTokens.CONFIG_MANAGER);
    if (result.isFailure()) {
      throw new Error('Failed to resolve ConfigManager');
    }
    return result.getValue();
  }

  getCacheManager(): CacheManager {
    const result = this.container.resolve<CacheManager>(ServiceTokens.CACHE_MANAGER);
    if (result.isFailure()) {
      throw new Error('Failed to resolve CacheManager');
    }
    return result.getValue();
  }

  getAPIOptimizer(): APIOptimizer {
    const result = this.container.resolve<APIOptimizer>(ServiceTokens.API_OPTIMIZER);
    if (result.isFailure()) {
      throw new Error('Failed to resolve APIOptimizer');
    }
    return result.getValue();
  }
} 