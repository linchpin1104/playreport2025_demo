import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { VideoAnalysisService } from '@/lib/services/video-analysis-service';
import { GCPDataStorage } from '@/lib/gcp-data-storage';
import { configManager } from '@/lib/services/config-manager';
import { Logger } from '@/lib/services/logger';
import { UnifiedAnalysisEngine } from '@/lib/unified-analysis-engine';

const logger = new Logger('ComprehensiveAnalysisAPI');

/**
 * 🚀 비동기 통합 분석 API v2.0 (데이터 추출 워크플로우)
 * 
 * 개선된 처리 방식:
 * 1. 즉시 응답 반환 (분석 시작됨)
 * 2. 백그라운드에서 원본 데이터 → 추출 → 저장 → 분석 수행
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
  const logger = new Logger('ComprehensiveAnalysisAPI');
  const startTime = new Date().toISOString();
  let sessionId = '';
  
  try {
    const body = await request.json() as ComprehensiveAnalysisRequest;
    sessionId = body.sessionId; // 외부 스코프에서 접근 가능하도록
    
    if (!sessionId) {
      logger.error('❌ SessionId is required');
      return NextResponse.json({
        sessionId: '',
        status: 'failed' as const,
        async: false,
        startTime,
        totalProgress: 0,
        error: '세션 ID가 필요합니다.'
      }, { status: 400 });
    }
    
    logger.info(`🎯 Starting comprehensive analysis for session: ${sessionId}`);

    // 🎯 Vercel 타임아웃 해결책: 파일 크기별 처리 전략
    // 작은 파일(50MB 미만): 동기 처리 (3분 내 완료 예상)
    // 큰 파일(50MB 이상): 비동기 처리 + 결과보기 버튼
    const gcpStorage = new GCPDataStorage();
    const sessionData = await gcpStorage.getSession(sessionId);
    const fileSize = sessionData?.metadata?.fileSize || 0;
    const fileSizeMB = fileSize / 1024 / 1024;
    
    // 50MB 미만은 동기 처리, 이상은 비동기 처리
    const isAsync = fileSizeMB >= 50;
    
    logger.info(`🎯 Analysis request: ${sessionId}, fileSize: ${fileSizeMB.toFixed(1)}MB, async: ${isAsync}`);
    
    // 세션 존재 확인
    if (!sessionData) {
      logger.error(`❌ Session not found: ${sessionId}`);
      return NextResponse.json({
        sessionId: '',
        status: 'failed' as const,
        async: isAsync,
        startTime,
        totalProgress: 0,
        error: `세션 ${sessionId}을 찾을 수 없습니다. 영상을 다시 업로드해주세요.`
      }, { status: 404 });
    }

    // 이미 진행 중이거나 완료된 세션 체크
    if (sessionData.metadata.status === 'processing' || sessionData.metadata.status === 'completed') {
      logger.info(`✅ Session already in progress/completed: ${sessionId}, status: ${sessionData.metadata.status}`);
      return NextResponse.json({
        sessionId,
        status: sessionData.metadata.status === 'completed' ? 'completed' as const : 'processing' as const,
        async: isAsync,
        startTime: sessionData.metadata.lastUpdated,
        totalProgress: sessionData.metadata.status === 'completed' ? 100 : 50,
        polling: sessionData.metadata.status === 'processing' ? {
          statusUrl: `/api/comprehensive-analysis/status/${sessionId}`,
          interval: 15,
          timeout: 600
        } : undefined
      });
    }

    if (sessionData.metadata.status === 'error') {
      logger.info(`⚠️ Session in error state: ${sessionId}, resetting...`);
      return NextResponse.json({
        sessionId,
        status: 'failed' as const,
        async: isAsync,
        startTime: sessionData.metadata.lastUpdated,
        totalProgress: 0,
        error: '이전 분석에서 오류가 발생했습니다. 다시 시도해주세요.'
      });
    }

    logger.info(`✅ Session verified: ${sessionId}, status: ${sessionData.metadata.status}`);

    // 2. 비디오+음성 분석 (Long Running Operation 시작)
    logger.info('🎬 Step 1: Starting Video Intelligence Long Running Operation...');
    sessionData.metadata.status = 'video_intelligence_operation_started';
    sessionData.metadata.lastUpdated = startTime;
    await gcpStorage.saveSession(sessionData);

    let operationInfo: any;
    
    try {
      const videoAnalysisService = new VideoAnalysisService();
      const gsUri = sessionData.paths.rawDataPath ?? `gs://${configManager.get('gcp.bucketName')}/${sessionData.metadata.fileName}`;
      
      const analysisRequest = {
        sessionId,
        gsUri,
        fileName: sessionData.metadata.fileName,
        options: {
          enableVoiceAnalysis: true,
          enableTranscription: true,
        }
      };
      
      logger.info(`🚀 Starting Google Cloud Video Intelligence Long Running Operation for: ${gsUri}`);
      const serviceResult = await videoAnalysisService.performCompleteAnalysis(analysisRequest);
      
      if (serviceResult.isFailure()) {
        throw new Error(serviceResult.getError().message || '비디오+음성 분석 시작에 실패했습니다.');
      }
      
      operationInfo = serviceResult.getValue();
      logger.info(`✅ Video Intelligence operation started: ${operationInfo.operationId}`);
      
      // Operation 정보를 세션에 저장
      sessionData.analysis = sessionData.analysis || {};
      sessionData.analysis.videoIntelligenceOperation = {
        operationId: operationInfo.operationId,
        operationName: operationInfo.operationName,
        status: operationInfo.status,
        startTime: operationInfo.startTime,
        gsUri: gsUri
      };
      sessionData.metadata.status = 'video_intelligence_processing';
      sessionData.metadata.lastUpdated = new Date().toISOString();
      
      await gcpStorage.saveSession(sessionData);
      
    } catch (error) {
      logger.error('❌ Video Intelligence operation start failed:', error as Error);
      sessionData.metadata.status = 'error';
      sessionData.metadata.lastUpdated = new Date().toISOString();
      await gcpStorage.saveSession(sessionData);
      throw error;
    }

    // 🔄 즉시 processing 상태로 응답 반환
    logger.info(`🔄 Returning immediate response, operation ${operationInfo.operationId} will be monitored via Status API`);
    
    return NextResponse.json({
      sessionId,
      status: 'processing' as const,
      async: true,
      startTime,
      totalProgress: 25, // Video Intelligence 시작됨
      currentStep: 'Google Cloud Video Intelligence 분석 진행 중... (3-7분 소요)',
      operationId: operationInfo.operationId,
      polling: {
        statusUrl: `/api/comprehensive-analysis/status/${sessionId}`,
        interval: 15,  // 15초마다 상태 확인
        timeout: 900   // 15분 후 타임아웃
      }
    });

  } catch (error) {
    logger.error('❌ Comprehensive analysis API error:', error as Error);
    return NextResponse.json({
      sessionId,
      status: 'failed' as const,
      async: false,
      startTime,
      totalProgress: 0,
      error: error instanceof Error ? error.message : '분석 시작 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
} 