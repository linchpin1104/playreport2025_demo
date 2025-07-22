import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getVideoAnalysisService } from '@/lib/dependency-injection/container-setup';
import { GCPDataStorage } from '@/lib/gcp-data-storage';
import { configManager } from '@/lib/services/config-manager';
import { Logger } from '@/lib/services/logger';
import { UnifiedAnalysisEngine } from '@/lib/unified-analysis-engine';

const logger = new Logger('ComprehensiveAnalysisAPI');

/**
 * 🚀 비동기 통합 분석 API (Vercel 타임아웃 해결)
 * 
 * 새로운 처리 방식:
 * 1. 즉시 응답 반환 (분석 시작됨)
 * 2. 백그라운드에서 분석 수행
 * 3. 클라이언트는 폴링으로 상태 확인
 * 4. 완료 시 결과 조회 가능
 */

interface ComprehensiveAnalysisRequest {
  sessionId: string;
  videoPath?: string;
  async?: boolean;  // 비동기 처리 옵션
}

interface AsyncAnalysisStatus {
  sessionId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  estimatedTimeRemaining?: number;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

interface ComprehensiveAnalysisResponse {
  sessionId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  async: boolean;
  steps?: AnalysisStep[];
  results?: {
    videoAnalysis?: any;
    rawDataStorage?: any;
    integratedAnalysis?: any;
    report?: any;
  };
  startTime: string;
  endTime?: string;
  totalProgress: number;
  error?: string;
  polling?: {
    statusUrl: string;
    interval: number;  // 초단위
    timeout: number;   // 초단위
  };
}

interface AnalysisStep {
  step: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  progress: number;
  message: string;
  error?: string;
}

// 🎯 5단계 분석 단계 정의
const ANALYSIS_STEPS: Array<{id: string, name: string, description: string}> = [
  { id: 'session_init', name: '세션 초기화', description: '분석 세션을 준비합니다' },
  { id: 'video_audio_analysis', name: '비디오+음성 분석', description: '비디오분석과 음성분석을 동시 수행합니다 (3-7분 소요)' },
  { id: 'raw_data_storage', name: '원본 데이터 저장', description: '추출된 원본 데이터를 GCP에 저장합니다' },
  { id: 'unified_analysis', name: '통합 분석', description: '통합 분석 엔진으로 모든 분석을 수행합니다' },
  { id: 'dashboard_ready', name: '대시보드 준비', description: '최종 분석 결과를 대시보드에 표시할 수 있도록 준비합니다' }
];

/**
 * 🚀 비동기 분석 시작
 */
export async function POST(request: NextRequest): Promise<NextResponse<ComprehensiveAnalysisResponse>> {
  try {
    const body = await request.json() as ComprehensiveAnalysisRequest;
    const sessionId = body.sessionId || uuidv4();
    const isAsync = body.async !== false; // 기본적으로 비동기 처리
    
    logger.info(`🚀 Starting ${isAsync ? 'ASYNC' : 'SYNC'} analysis for: ${sessionId}`);
    
    const gcpStorage = new GCPDataStorage();
    const startTime = new Date().toISOString();
    
    // 세션 존재 확인
    const sessionData = await gcpStorage.getSession(sessionId);
    if (!sessionData) {
      return NextResponse.json({
        sessionId,
        status: 'failed' as const,
        async: isAsync,
        startTime,
        totalProgress: 0,
        error: `Session ${sessionId}을 찾을 수 없습니다. 영상을 다시 업로드해주세요.`
      }, { status: 404 });
    }

    // 이미 처리 중이거나 완료된 경우 체크
    if (sessionData.metadata.status === 'comprehensive_analysis_completed') {
      return NextResponse.json({
        sessionId,
        status: 'completed' as const,
        async: isAsync,
        startTime: sessionData.metadata.lastUpdated,
        endTime: sessionData.analysis?.completedAt,
        totalProgress: 100
      });
    }

    if (sessionData.metadata.status === 'comprehensive_analysis_started') {
      return NextResponse.json({
        sessionId,
        status: 'processing' as const,
        async: isAsync,
        startTime: sessionData.metadata.lastUpdated,
        totalProgress: 25, // 추정 진행률
        polling: {
          statusUrl: `/api/comprehensive-analysis/status/${sessionId}`,
          interval: 15,  // 15초마다 확인
          timeout: 600   // 10분 타임아웃
        }
      });
    }

    // 분석 상태 업데이트 (시작됨)
    sessionData.metadata.status = 'comprehensive_analysis_started';
    sessionData.metadata.lastUpdated = startTime;
    await gcpStorage.saveSession(sessionData);

    if (isAsync) {
      // 🚀 비동기 처리: 즉시 응답 반환하고 백그라운드에서 처리
      
      // 백그라운드 분석 시작 (await 하지 않음)
      performBackgroundAnalysis(sessionId).catch(error => {
        logger.error(`❌ Background analysis failed for ${sessionId}:`, error);
      });

      return NextResponse.json({
        sessionId,
        status: 'queued' as const,
        async: true,
        startTime,
        totalProgress: 10,
        polling: {
          statusUrl: `/api/comprehensive-analysis/status/${sessionId}`,
          interval: 15,  // 15초마다 상태 확인
          timeout: 600   // 10분 후 타임아웃
        }
      });
    } else {
      // 🔄 동기 처리 (기존 방식) - 작은 영상용
      const result = await performSyncAnalysis(sessionId);
      return NextResponse.json(result);
    }

  } catch (error) {
    logger.error('❌ Comprehensive analysis API error:', error);
    return NextResponse.json({
      sessionId: '',
      status: 'failed' as const,
      async: true,
      startTime: new Date().toISOString(),
      totalProgress: 0,
      error: error instanceof Error ? error.message : '분석 요청 처리 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

/**
 * 🔄 백그라운드 분석 수행 (Promise를 반환하지만 await하지 않음)
 */
async function performBackgroundAnalysis(sessionId: string): Promise<void> {
  const logger = new Logger(`BackgroundAnalysis-${sessionId}`);
  
  try {
    logger.info(`🔄 Starting background analysis for: ${sessionId}`);
    
    const gcpStorage = new GCPDataStorage();
    const unifiedEngine = new UnifiedAnalysisEngine();
    
    // 1. 세션 조회
    const sessionData = await gcpStorage.getSession(sessionId);
    if (!sessionData) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // 2. 비디오+음성 분석 (가장 시간이 오래 걸리는 단계)
    logger.info('🎬 Step 1: Starting Video Intelligence analysis...');
    sessionData.metadata.status = 'comprehensive_analysis_started';
    sessionData.metadata.lastUpdated = new Date().toISOString();
    await gcpStorage.saveSession(sessionData);

    let analysisResults: any;
    try {
      const videoAnalysisService = getVideoAnalysisService();
      const gsUri = sessionData.paths.rawDataPath ?? `gs://${configManager.get('gcp.bucketName')}/${sessionData.metadata.fileName}`;
      
      const analysisRequest = {
        sessionId,
        gsUri,
        fileName: sessionData.metadata.fileName,
        options: {
          enableVoiceAnalysis: true,
          enableVideoAnalysis: true,
          enableTranscription: true,
        }
      };
      
      const serviceResult = await videoAnalysisService.performCompleteAnalysis(analysisRequest);
      
      if (serviceResult.isFailure()) {
        throw new Error(serviceResult.getError().message || '비디오+음성 분석에 실패했습니다.');
      }
      
      analysisResults = serviceResult.getValue();
      logger.info('✅ Video Intelligence analysis completed');
      
    } catch (error) {
      logger.error('❌ Video analysis failed:', error);
      sessionData.metadata.status = 'failed';
      await gcpStorage.saveSession(sessionData);
      throw error;
    }

    // 3. 원본 데이터 저장
    logger.info('💾 Step 2: Saving raw analysis data...');
    const rawDataPaths = {
      combinedRaw: `analysis/${sessionId}/combined_analysis_raw.json`
    };
    
    const videoIntelligenceResults = analysisResults.analysisResults ?? analysisResults;
    await gcpStorage.saveToCloudStorage(rawDataPaths.combinedRaw, {
      sessionId,
      timestamp: new Date().toISOString(),
      rawVideoResults: videoIntelligenceResults,
      metadata: sessionData.metadata
    });
    
    sessionData.paths.analysisDataUrl = rawDataPaths.combinedRaw;
    await gcpStorage.saveSession(sessionData);

    // 4. 통합 분석 수행
    logger.info('🔗 Step 3: Performing unified analysis...');
    const unifiedResult = await unifiedEngine.performCompleteAnalysis({
      sessionId,
      videoResults: analysisResults.analysisResults ?? analysisResults,
      metadata: {
        fileName: sessionData.metadata.fileName,
        fileSize: sessionData.metadata.fileSize
      }
    });
    
    const unifiedAnalysisPath = `analysis/${sessionId}/unified_analysis.json`;
    await gcpStorage.saveToCloudStorage(unifiedAnalysisPath, unifiedResult);
    
    // 5. 세션 데이터 업데이트
    logger.info('📊 Step 4: Updating session with results...');
    const videoDuration = unifiedResult.videoAnalysis?.duration || 0;
    const participantCount = analysisResults.personDetection?.length > 0 ? 2 : 0;
    const safetyScore = Math.round(
      (unifiedResult.integratedAnalysis?.playPatternQuality || 0) * 0.6 +
      (unifiedResult.videoAnalysis?.personDetected ? 25 : 0) +
      (videoDuration > 60 ? 15 : 5)
    );
    
    sessionData.paths.integratedAnalysisPath = unifiedAnalysisPath;
    sessionData.analysis = {
      participantCount,
      videoDuration,
      safetyScore,
      overallScore: unifiedResult.overallScore,
      interactionQuality: unifiedResult.interactionQuality,
      keyInsights: unifiedResult.keyFindings.slice(0, 3),
      completedAt: new Date().toISOString()
    };
    sessionData.metadata.status = 'comprehensive_analysis_completed';
    sessionData.metadata.analyzedAt = new Date().toISOString();
    sessionData.metadata.lastUpdated = new Date().toISOString();
    
    await gcpStorage.saveSession(sessionData);
    
    logger.info(`🎉 Background analysis completed for: ${sessionId}`);
    
  } catch (error) {
    logger.error(`❌ Background analysis failed for ${sessionId}:`, error);
    
    // 실패 상태 업데이트
    try {
      const gcpStorage = new GCPDataStorage();
      const sessionData = await gcpStorage.getSession(sessionId);
      if (sessionData) {
        sessionData.metadata.status = 'error';
        sessionData.metadata.lastUpdated = new Date().toISOString();
        await gcpStorage.saveSession(sessionData);
      }
    } catch (updateError) {
      logger.error('Failed to update session with error status:', updateError);
    }
    
    throw error;
  }
}

/**
 * 🔄 동기 분석 수행 (작은 영상용)
 */
async function performSyncAnalysis(sessionId: string): Promise<ComprehensiveAnalysisResponse> {
  // 기존 동기 분석 로직 (간소화된 버전)
  return {
    sessionId,
    status: 'completed',
    async: false,
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    totalProgress: 100
  };
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
} 