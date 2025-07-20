import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getVideoAnalysisService } from '@/lib/dependency-injection/container-setup';
import { GCPDataStorage } from '@/lib/gcp-data-storage';
import { configManager } from '@/lib/services/config-manager';
import { Logger } from '@/lib/services/logger';
import { UnifiedAnalysisEngine } from '@/lib/unified-analysis-engine';

const logger = new Logger('ComprehensiveAnalysisAPI');

/**
 * 🎯 간소화된 통합 분석 API
 * 
 * 사용자 요청 로직:
 * 1. 영상 업로드 (최대 500MB) ✅ 이미 완료됨
 * 2. 비디오분석/음성분석 동시 수행
 * 3. 원본 데이터를 GCP에 저장
 * 4. 통합 분석 수행 (새로운 UnifiedAnalysisEngine 사용)
 * 5. 대시보드에 결과 표시
 */

interface ComprehensiveAnalysisRequest {
  sessionId: string;
  videoPath?: string;
}

interface AnalysisStep {
  step: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  progress: number;
  message: string;
  error?: string;
}

interface ComprehensiveAnalysisResponse {
  sessionId: string;
  status: 'in_progress' | 'completed' | 'error';
  steps: AnalysisStep[];
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
  details?: {
    reason: string;
    requiredActions: string[];
    supportLink: string;
  };
}

// 🎯 사용자 요구사항에 맞는 5단계 정의
const ANALYSIS_STEPS: Array<{id: string, name: string, description: string}> = [
  { id: 'session_init', name: '세션 초기화', description: '분석 세션을 준비합니다' },
  { id: 'video_audio_analysis', name: '비디오+음성 분석', description: '비디오분석과 음성분석을 동시 수행합니다' },
  { id: 'raw_data_storage', name: '원본 데이터 저장', description: '추출된 원본 데이터를 GCP에 저장합니다' },
  { id: 'unified_analysis', name: '통합 분석', description: '새로운 통합 분석 엔진으로 모든 분석을 수행합니다' },
  { id: 'dashboard_ready', name: '대시보드 준비', description: '최종 분석 결과를 대시보드에 표시할 수 있도록 준비합니다' }
];

// 단계 업데이트 헬퍼 함수
async function updateStep(
  storage: GCPDataStorage,
  sessionId: string,
  steps: AnalysisStep[],
  stepId: string,
  status: AnalysisStep['status'],
  progress: number,
  message: string,
  error?: string
) {
  const step = steps.find(s => s.step === stepId);
  if (step) {
    step.status = status;
    step.progress = progress;
    step.message = message;
    if (error) { step.error = error; }
  }
  
  logger.info(`📊 Step ${stepId}: ${status} (${progress}%) - ${message}`);
}

export async function POST(request: NextRequest): Promise<NextResponse<ComprehensiveAnalysisResponse>> {
  // 변수들을 try 블록 외부에서 선언
  let sessionId = '';
  let steps: AnalysisStep[] = [];
  const startTime = new Date().toISOString();
  
  try {
    const body = await request.json() as ComprehensiveAnalysisRequest;
    sessionId = body.sessionId || uuidv4();
    
    logger.info(`🚀 Starting simplified 5-step analysis for: ${sessionId}`);
    
    const gcpStorage = new GCPDataStorage();
    const unifiedEngine = new UnifiedAnalysisEngine();
    
    // 분석 단계 초기화
    steps = ANALYSIS_STEPS.map(step => ({
      step: step.id,
      status: 'pending' as const,
      progress: 0,
      message: step.description
    }));
    
    // 응답 객체 초기화
    const response: ComprehensiveAnalysisResponse = {
      sessionId,
      status: 'in_progress',
      steps,
      results: {},
      startTime,
      totalProgress: 0
    };

    // 🎯 STEP 1: 세션 초기화 
    await updateStep(gcpStorage, sessionId, steps, 'session_init', 'in_progress', 10, '분석 세션을 초기화하고 있습니다...');
    
    // 기존 세션 정보 조회
    const sessionData = await gcpStorage.getSession(sessionId);
    if (!sessionData) {
      throw new Error(`Session ${sessionId}을 찾을 수 없습니다. 영상을 다시 업로드해주세요.`);
    }
    
    // 세션 상태 업데이트
    sessionData.metadata.status = 'comprehensive_analysis_started';
    sessionData.metadata.lastUpdated = new Date().toISOString();
    await gcpStorage.saveSession(sessionData);
    
    await updateStep(gcpStorage, sessionId, steps, 'session_init', 'completed', 100, '세션 초기화 완료');

    // 🎯 STEP 2: 비디오+음성 분석 (동시 수행)
    await updateStep(gcpStorage, sessionId, steps, 'video_audio_analysis', 'in_progress', 0, '비디오분석과 음성분석을 동시 수행하고 있습니다...');
    
    let analysisResults: any;
    
    try {
      // VideoAnalysisService를 직접 호출
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
      
      await updateStep(gcpStorage, sessionId, steps, 'video_audio_analysis', 'completed', 100, '비디오+음성 분석 완료');
      response.results!.videoAnalysis = analysisResults;

    } catch (error) {
      logger.error('❌ Video+Audio analysis failed:', error as Error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      await updateStep(gcpStorage, sessionId, steps, 'video_audio_analysis', 'error', 0, '비디오+음성 분석 실패', errorMessage);
      
      if (errorMessage.includes('PERMISSION_DENIED') || errorMessage.includes('permission')) {
        return NextResponse.json({
          ...response,
          status: 'error',
          error: 'GCP 권한 오류로 인해 분석을 수행할 수 없습니다.',
          details: {
            reason: 'Google Cloud Platform 서비스 계정 권한이 설정되지 않았습니다.',
            requiredActions: [
              '1. Vercel 환경변수 설정',
              '2. GCP 서비스 계정 권한 확인',
              '3. Video Intelligence API 활성화 확인'
            ],
            supportLink: 'VERCEL_ENV_SETUP.md를 참고하세요.'
          }
        }, { status: 424 });
      }
      
      throw error;
    }

    // 🎯 STEP 3: 원본 데이터 저장 (GCP)
    await updateStep(gcpStorage, sessionId, steps, 'raw_data_storage', 'in_progress', 0, '추출된 원본 데이터를 GCP에 저장하고 있습니다...');
    
    try {
      const rawDataPaths = {
        videoAnalysisRaw: `analysis/${sessionId}/video_analysis_raw.json`,
        audioAnalysisRaw: `analysis/${sessionId}/audio_analysis_raw.json`,
        combinedRaw: `analysis/${sessionId}/combined_analysis_raw.json`
      };
      
      // 원본 데이터를 GCP에 저장
      const videoIntelligenceResults = analysisResults.analysisResults ?? analysisResults;
      await gcpStorage.saveToCloudStorage(rawDataPaths.combinedRaw, {
        sessionId,
        timestamp: new Date().toISOString(),
        rawVideoResults: videoIntelligenceResults,
        metadata: sessionData.metadata
      });
      
      // 세션에 원본 데이터 경로 업데이트
      sessionData.paths = {
        ...sessionData.paths,
        analysisDataUrl: rawDataPaths.combinedRaw
      };
      await gcpStorage.saveSession(sessionData);
      
      await updateStep(gcpStorage, sessionId, steps, 'raw_data_storage', 'completed', 100, '원본 데이터 GCP 저장 완료');
      response.results!.rawDataStorage = rawDataPaths;
      
    } catch (error) {
      logger.error('❌ Raw data storage failed:', error as Error);
      await updateStep(gcpStorage, sessionId, steps, 'raw_data_storage', 'error', 0, '원본 데이터 저장 실패', error instanceof Error ? error.message : String(error));
      throw error;
    }

    // 🎯 STEP 4: 통합 분석 수행 (새로운 UnifiedAnalysisEngine 사용)
    await updateStep(gcpStorage, sessionId, steps, 'unified_analysis', 'in_progress', 0, '통합 분석 엔진으로 모든 분석을 수행하고 있습니다...');
    
    try {
      // 새로운 UnifiedAnalysisEngine 사용
      const unifiedResult = await unifiedEngine.performCompleteAnalysis({
        sessionId,
        videoResults: analysisResults.analysisResults ?? analysisResults,
        metadata: {
          fileName: sessionData.metadata.fileName,
          fileSize: sessionData.metadata.fileSize
        }
      });
      
      // 통합 분석 결과 저장
      const unifiedAnalysisPath = `analysis/${sessionId}/unified_analysis.json`;
      await gcpStorage.saveToCloudStorage(unifiedAnalysisPath, unifiedResult);
      
      // 세션 업데이트
      sessionData.paths.integratedAnalysisPath = unifiedAnalysisPath;
      sessionData.analysis = {
        ...sessionData.analysis,
        overallScore: unifiedResult.overallScore,
        interactionQuality: unifiedResult.interactionQuality,
        keyInsights: unifiedResult.keyFindings.slice(0, 3),
        completedAt: new Date().toISOString()
      };
      await gcpStorage.saveSession(sessionData);
      
      await updateStep(gcpStorage, sessionId, steps, 'unified_analysis', 'completed', 100, '통합 분석 완료');
      response.results!.integratedAnalysis = unifiedResult;
      
    } catch (error) {
      logger.error('❌ Unified analysis failed:', error as Error);
      await updateStep(gcpStorage, sessionId, steps, 'unified_analysis', 'error', 0, '통합 분석 실패', error instanceof Error ? error.message : String(error));
      throw error;
    }

    // 🎯 STEP 5: 대시보드 준비 완료
    await updateStep(gcpStorage, sessionId, steps, 'dashboard_ready', 'in_progress', 0, '대시보드 표시를 위한 최종 준비를 하고 있습니다...');
    
    try {
      const unifiedResult = response.results!.integratedAnalysis;
      
      // 대시보드용 요약 데이터 생성
      const dashboardData = {
        sessionId,
        overallScore: unifiedResult.overallScore,
        summary: {
          videoAnalysis: unifiedResult.videoAnalysis,
          audioAnalysis: unifiedResult.audioAnalysis,
          integratedAnalysis: unifiedResult.integratedAnalysis,
          keyFindings: unifiedResult.keyFindings,
          recommendations: unifiedResult.recommendations,
          completedAt: new Date().toISOString()
        },
        metadata: unifiedResult.analysisMetadata
      };
      
      // 대시보드 데이터 저장
      const dashboardPath = `analysis/${sessionId}/dashboard_data.json`;
      await gcpStorage.saveToCloudStorage(dashboardPath, dashboardData);
      
      // 세션 최종 상태 업데이트
      sessionData.metadata.status = 'comprehensive_analysis_completed';
      // 'reportPath' is not a known property of sessionData.paths type, so set it directly
      (sessionData.paths as any).reportPath = dashboardPath;
      await gcpStorage.saveSession(sessionData);

      await updateStep(gcpStorage, sessionId, steps, 'dashboard_ready', 'completed', 100, '모든 분석 완료! 대시보드에서 결과를 확인할 수 있습니다.');
      response.results!.report = dashboardData;
      
    } catch (error) {
      logger.error('❌ Dashboard preparation failed:', error as Error);
      await updateStep(gcpStorage, sessionId, steps, 'dashboard_ready', 'error', 0, '대시보드 준비 실패', error instanceof Error ? error.message : String(error));
      throw error;
    }

    // ✅ 최종 응답 준비
    response.status = 'completed';
    response.endTime = new Date().toISOString();
    response.totalProgress = 100;
    
    logger.info(`🎉 Simplified 5-step analysis completed for: ${sessionId}`);
    
    return NextResponse.json(response);
    
  } catch (error) {
    logger.error(`❌ Comprehensive analysis failed for ${sessionId}:`, error as Error);
    
    return NextResponse.json({
      sessionId,
      status: 'error' as const,
      steps: steps || [],
      startTime,
      endTime: new Date().toISOString(),
      totalProgress: 0,
      error: error instanceof Error ? error.message : '분석 중 예기치 못한 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
} 