import { GCPDataStorage } from '../gcp-data-storage';
import { IntegratedAnalysisSystem } from '../integrated-analysis-system';
import { PlayAnalysisExtractor } from '../play-analysis-extractor';
import { VideoAnalysisService } from '../services/video-analysis-service';
import { VideoAnalyzer } from '../video-analyzer';
import { container, ServiceTokens } from './container';
import { configureServices, ServiceResolver } from './service-registration';

// 컨테이너 초기화 (한 번만 실행)
let isInitialized = false;

export function initializeContainer(): void {
  if (isInitialized) {
    return;
  }

  // 모든 서비스 등록
  configureServices(container);

  // 비즈니스 서비스 등록
  container.registerFactory(
    ServiceTokens.VIDEO_ANALYSIS_SERVICE,
    () => {
      const videoAnalyzer = container.resolve<VideoAnalyzer>(ServiceTokens.VIDEO_ANALYZER);
      const gcpDataStorage = container.resolve<GCPDataStorage>(ServiceTokens.GCP_DATA_STORAGE);
      const integratedAnalysisSystem = container.resolve<IntegratedAnalysisSystem>(ServiceTokens.INTEGRATED_ANALYSIS_SYSTEM);
      const playAnalysisExtractor = container.resolve<PlayAnalysisExtractor>(ServiceTokens.PLAY_ANALYSIS_EXTRACTOR);

      if (videoAnalyzer.isFailure() || gcpDataStorage.isFailure() || 
          integratedAnalysisSystem.isFailure() || playAnalysisExtractor.isFailure()) {
        throw new Error('Failed to resolve dependencies for VideoAnalysisService');
      }

      return new VideoAnalysisService(
        videoAnalyzer.getValue(),
        gcpDataStorage.getValue(),
        integratedAnalysisSystem.getValue(),
        playAnalysisExtractor.getValue()
      );
    },
    [
      ServiceTokens.VIDEO_ANALYZER,
      ServiceTokens.GCP_DATA_STORAGE,
      ServiceTokens.INTEGRATED_ANALYSIS_SYSTEM,
      ServiceTokens.PLAY_ANALYSIS_EXTRACTOR
    ],
    'singleton'
  );

  isInitialized = true;
}

// 서비스 해결자 인스턴스 제공
export function getServiceResolver(): ServiceResolver {
  initializeContainer();
  return new ServiceResolver(container);
}

// 특정 서비스 해결 헬퍼 함수들
export function getVideoAnalysisService(): VideoAnalysisService {
  initializeContainer();
  const result = container.resolve<VideoAnalysisService>(ServiceTokens.VIDEO_ANALYSIS_SERVICE);
  if (result.isFailure()) {
    throw new Error('Failed to resolve VideoAnalysisService');
  }
  return result.getValue();
}

// 모든 서비스 토큰을 내보냄
export { ServiceTokens } from './container'; 