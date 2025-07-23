import { NextRequest, NextResponse } from 'next/server';
import { GCPDataStorage } from '@/lib/gcp-data-storage';

/**
 * 📊 분석 상태 확인 API
 * 비동기 분석의 진행 상태를 확인하는 폴링용 엔드포인트
 */

interface AnalysisStatusResponse {
  sessionId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  estimatedTimeRemaining?: number;
  error?: string;
  startedAt: string;
  completedAt?: string;
  results?: {
    overallScore?: number;
    interactionQuality?: number;
    videoDuration?: number;
    participantCount?: number;
    keyInsights?: string[];
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
): Promise<NextResponse<AnalysisStatusResponse>> {
  try {
    const { sessionId } = params;
    
    if (!sessionId) {
      return NextResponse.json({
        sessionId: '',
        status: 'failed',
        progress: 0,
        currentStep: 'error',
        error: 'Session ID is required',
        startedAt: new Date().toISOString()
      }, { status: 400 });
    }

    const gcpStorage = new GCPDataStorage();
    const sessionData = await gcpStorage.getSession(sessionId);
    
    if (!sessionData) {
      return NextResponse.json({
        sessionId,
        status: 'failed',
        progress: 0,
        currentStep: 'error',
        error: 'Session not found',
        startedAt: new Date().toISOString()
      }, { status: 404 });
    }
    
    // 🔍 Video Intelligence Operation 상태 실시간 확인
    let currentStatus = sessionData.metadata.status;
    let currentProgress = calculateProgress(currentStatus);
    let currentStep = getCurrentStep(currentStatus);
    
    // Video Intelligence Operation이 진행 중인 경우 실제 상태 확인
    if (sessionData.analysis?.videoIntelligenceOperation && 
        (currentStatus === 'video_intelligence_processing' || currentStatus === 'video_intelligence_operation_started')) {
      
      try {
        // VideoAnalyzer를 사용해서 실제 operation 상태 확인
        const { VideoAnalyzer } = await import('@/lib/video-analyzer');
        const videoAnalyzer = new VideoAnalyzer();
        
        const operationStatus = await videoAnalyzer.checkOperationStatus(
          sessionData.analysis.videoIntelligenceOperation.operationName
        );
        
        console.log(`🔍 Real-time operation status for ${sessionId}:`, operationStatus);
        
        if (operationStatus.status === 'completed') {
          // Operation 완료됨 - 나머지 분석 파이프라인 시작
          currentStatus = 'data_processing';
          currentProgress = 75;
          currentStep = '분석 데이터 처리 중...';
          
          // 세션 업데이트 및 나머지 분석 파이프라인 시작 (백그라운드에서)
          setImmediate(async () => {
            try {
              sessionData.analysis.videoIntelligenceOperation.status = 'completed';
              sessionData.metadata.status = currentStatus;
              sessionData.metadata.lastUpdated = new Date().toISOString();
              await gcpStorage.saveSession(sessionData);
              
              // 🔄 Video Intelligence 결과가 있으면 나머지 분석 계속 진행
              if (operationStatus.result) {
                console.log(`🚀 Starting analysis pipeline continuation for ${sessionId}`);
                await continueAnalysisPipeline(sessionId, operationStatus.result);
              }
            } catch (error) {
              console.error('Failed to update session or continue analysis pipeline:', error);
              await updateSessionWithError(sessionId, `분석 파이프라인 실행 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
            }
          });
          
        } else if (operationStatus.status === 'failed') {
          // Operation 실패
          currentStatus = 'error';
          currentProgress = 0;
          currentStep = 'error';
          
        } else if (operationStatus.status === 'running') {
          // Operation 아직 진행 중
          currentStatus = 'video_intelligence_processing';
          currentProgress = operationStatus.progress || 50;
          currentStep = 'Google Cloud Video Intelligence 분석 진행 중... (3-7분 소요)';
        }
        
      } catch (error) {
        console.error(`❌ Failed to check operation status for ${sessionId}:`, error);
        // 에러가 발생해도 기존 세션 상태 기반으로 응답
      }
    }

    // 세션 상태에 따른 응답 생성
    const response: AnalysisStatusResponse = {
      sessionId,
      status: mapSessionStatusToAnalysisStatus(currentStatus),
      progress: currentProgress,
      currentStep: currentStep,
      startedAt: sessionData.metadata.uploadedAt,
      completedAt: sessionData.analysis?.completedAt
    };

    // 완료된 경우 결과 포함
    if (response.status === 'completed' && sessionData.analysis) {
      response.results = {
        overallScore: sessionData.analysis.overallScore,
        interactionQuality: sessionData.analysis.interactionQuality,
        videoDuration: sessionData.analysis.videoDuration,
        participantCount: sessionData.analysis.participantCount,
        keyInsights: sessionData.analysis.keyInsights
      };
    }

    // 실패한 경우 에러 메시지 포함
    if (response.status === 'failed') {
      response.error = '분석 중 오류가 발생했습니다. 영상을 다시 업로드해주세요.';
    }

    // 처리 중인 경우 예상 시간 계산
    if (response.status === 'processing') {
      const elapsedMinutes = Math.floor((Date.now() - new Date(sessionData.metadata.lastUpdated).getTime()) / (1000 * 60));
      const estimatedTotal = Math.max(5, sessionData.metadata.fileSize / 1024 / 1024 / 10); // MB당 0.1분 추정
      response.estimatedTimeRemaining = Math.max(1, estimatedTotal - elapsedMinutes);
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Status check failed:', error);
    return NextResponse.json({
      sessionId: '',
      status: 'failed',
      progress: 0,
      currentStep: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      startedAt: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * 세션 상태를 분석 상태로 매핑
 */
function mapSessionStatusToAnalysisStatus(sessionStatus: string): 'queued' | 'processing' | 'completed' | 'failed' {
  switch (sessionStatus) {
    case 'uploaded':
      return 'queued';
    case 'comprehensive_analysis_started':
      return 'processing';
    case 'comprehensive_analysis_completed':
      return 'completed';
    case 'error':
    case 'failed':
      return 'failed';
    default:
      return 'queued';
  }
}

/**
 * 진행률 계산
 */
function calculateProgress(sessionStatus: string): number {
  switch (sessionStatus) {
    case 'uploaded':
      return 5;
    case 'comprehensive_analysis_started':
      return 50; // 추정 중간값
    case 'comprehensive_analysis_completed':
      return 100;
    case 'error':
    case 'failed':
      return 0;
    default:
      return 10;
  }
}

/**
 * 현재 단계 설명
 */
function getCurrentStep(sessionStatus: string): string {
  switch (sessionStatus) {
    case 'uploaded':
      return '분석 대기 중...';
    case 'comprehensive_analysis_started':
      return 'Google Cloud Video Intelligence 분석 진행 중... (3-7분 소요)';
    case 'comprehensive_analysis_completed':
      return '분석 완료!';
    case 'error':
    case 'failed':
      return '분석 실패';
    default:
      return '대기 중...';
  }
} 

/**
 * 💻 Video Intelligence 완료 후 나머지 분석 파이프라인 계속 진행
 */
async function continueAnalysisPipeline(sessionId: string, videoIntelligenceResults: any): Promise<void> {
  console.log(`🔄 Continuing analysis pipeline for ${sessionId}`);
  
  const gcpStorage = new GCPDataStorage();
  
  try {
    const sessionData = await gcpStorage.getSession(sessionId);
    if (!sessionData) {
      throw new Error('세션 데이터를 찾을 수 없습니다.');
    }
    
    // 상태 업데이트
    sessionData.metadata.status = 'data_processing';
    sessionData.metadata.lastUpdated = new Date().toISOString();
    await gcpStorage.saveSession(sessionData);
    
    // 1. 원본 데이터 저장
    console.log('💾 Step 1: Saving raw analysis data...');
    const rawDataPath = `analysis/${sessionId}/combined_analysis_raw.json`;
    await gcpStorage.uploadJSONData(rawDataPath, videoIntelligenceResults);
    console.log('✅ Raw data saved successfully');
    
    // 2. 데이터 추출 (압축)
    console.log('🔍 Step 2: Extracting essential data...');
    const { DataExtractor } = await import('@/lib/data-extractor');
    const dataExtractor = new DataExtractor();
    const extractedData = await dataExtractor.extractAnalysisData(videoIntelligenceResults, sessionId);
    
    // 추출된 데이터 저장
    const extractedDataPath = `analysis/${sessionId}/extracted_data.json`;
    await gcpStorage.uploadJSONData(extractedDataPath, extractedData);
    console.log(`✅ Extracted data saved: ${(JSON.stringify(extractedData).length / 1024).toFixed(1)}KB`);
    
    // 3. 통합 분석 엔진 실행
    console.log('🧠 Step 3: Running unified analysis engine...');
    const { UnifiedAnalysisEngine } = await import('@/lib/unified-analysis-engine');
    const unifiedEngine = new UnifiedAnalysisEngine();
    const { result: unifiedResult } = await unifiedEngine.performCompleteAnalysis({
      sessionId,
      videoIntelligenceResults,
      participantInfo: {
        childAge: sessionData.userInfo?.childAge || 5,
        specialNeeds: []
      }
    });
    
    // 4. 최종 결과 저장
    const finalResultPath = `analysis/${sessionId}/unified_analysis.json`;
    await gcpStorage.uploadJSONData(finalResultPath, unifiedResult);
    console.log('✅ Unified analysis completed and saved');
    
    // 5. 세션 완료 처리
    sessionData.paths.extractedDataUrl = extractedDataPath;
    sessionData.paths.unifiedAnalysisUrl = finalResultPath;
    sessionData.analysis = {
      ...sessionData.analysis,
      ...unifiedResult,
      completedAt: new Date().toISOString()
    };
    sessionData.metadata.status = 'completed';
    sessionData.metadata.lastUpdated = new Date().toISOString();
    sessionData.metadata.completedAt = new Date().toISOString();
    
    await gcpStorage.saveSession(sessionData);
    console.log(`🎉 Complete analysis pipeline finished for ${sessionId}`);
    
  } catch (error) {
    console.error(`❌ Analysis pipeline failed for ${sessionId}:`, error);
    await updateSessionWithError(sessionId, `분석 파이프라인 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}

/**
 * ❌ 세션을 에러 상태로 업데이트
 */
async function updateSessionWithError(sessionId: string, errorMessage: string): Promise<void> {
  const gcpStorage = new GCPDataStorage();
  
  try {
    const sessionData = await gcpStorage.getSession(sessionId);
    if (sessionData) {
      sessionData.metadata.status = 'error';
      sessionData.metadata.lastUpdated = new Date().toISOString();
      sessionData.metadata.error = errorMessage;
      await gcpStorage.saveSession(sessionData);
      console.log(`❌ Session ${sessionId} marked as error: ${errorMessage}`);
    }
  } catch (error) {
    console.error(`Failed to update session ${sessionId} with error:`, error);
  }
} 