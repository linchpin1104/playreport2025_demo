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

    // 세션 상태에 따른 응답 생성
    const response: AnalysisStatusResponse = {
      sessionId,
      status: mapSessionStatusToAnalysisStatus(sessionData.metadata.status),
      progress: calculateProgress(sessionData.metadata.status),
      currentStep: getCurrentStep(sessionData.metadata.status),
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