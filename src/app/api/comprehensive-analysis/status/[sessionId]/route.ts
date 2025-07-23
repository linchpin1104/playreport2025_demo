import { NextRequest, NextResponse } from 'next/server';
import { GCPDataStorage } from '@/lib/gcp-data-storage';
import { Logger } from '@/lib/services/logger';

const logger = new Logger('AnalysisStatusAPI');

// 분석 진행 중인 세션들을 추적 (동시성 방지)
const processingLock = new Set<string>();

/**
 * 📊 분석 상태 확인 API (스마트 백그라운드 처리)
 * Vercel 해결책: 폴링 시마다 실제 분석을 단계별로 수행
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

    // 🔄 스마트 백그라운드 처리: 멈춘 분석을 다시 시작
    await triggerStuckAnalysis(sessionId, sessionData, gcpStorage);

    // 최신 세션 데이터 다시 가져오기
    const updatedSessionData = await gcpStorage.getSession(sessionId);
    const finalSessionData = updatedSessionData || sessionData;

    // 세션 상태에 따른 응답 생성
    const response: AnalysisStatusResponse = {
      sessionId,
      status: mapSessionStatusToAnalysisStatus(finalSessionData.metadata.status),
      progress: calculateProgress(finalSessionData.metadata.status),
      currentStep: getCurrentStep(finalSessionData.metadata.status),
      startedAt: finalSessionData.metadata.uploadedAt,
      completedAt: finalSessionData.analysis?.completedAt
    };

    // 완료된 경우 결과 포함
    if (response.status === 'completed' && finalSessionData.analysis) {
      response.results = {
        overallScore: finalSessionData.analysis.overallScore,
        interactionQuality: finalSessionData.analysis.interactionQuality,
        videoDuration: finalSessionData.analysis.videoDuration,
        participantCount: finalSessionData.analysis.participantCount,
        keyInsights: finalSessionData.analysis.keyInsights
      };
    }

    // 실패한 경우 에러 메시지 포함
    if (response.status === 'failed') {
      response.error = '분석 중 오류가 발생했습니다. 영상을 다시 업로드해주세요.';
    }

    // 처리 중인 경우 예상 시간 계산
    if (response.status === 'processing') {
      const elapsedMinutes = Math.floor((Date.now() - new Date(finalSessionData.metadata.lastUpdated).getTime()) / (1000 * 60));
      const estimatedTotal = Math.max(5, finalSessionData.metadata.fileSize / 1024 / 1024 / 10); // MB당 0.1분 추정
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
 * 🔄 멈춘 분석을 감지하고 재시작하는 함수
 */
async function triggerStuckAnalysis(
  sessionId: string, 
  sessionData: any, 
  gcpStorage: GCPDataStorage
): Promise<void> {
  // 이미 처리 중이면 스킵
  if (processingLock.has(sessionId)) {
    logger.info(`⏳ Analysis already in progress for ${sessionId}`);
    return;
  }

  // comprehensive_analysis_started 상태인데 너무 오래된 경우만 처리
  if (sessionData.metadata.status !== 'comprehensive_analysis_started') {
    return;
  }

  const lastUpdated = new Date(sessionData.metadata.lastUpdated);
  const now = new Date();
  const minutesStuck = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);

  // 2분 이상 멈춘 경우에만 재시작
  if (minutesStuck < 2) {
    return;
  }

  logger.info(`🚨 Detected stuck analysis for ${sessionId} (${minutesStuck.toFixed(1)} minutes stuck)`);

  // 락 설정
  processingLock.add(sessionId);

  try {
    // 간단한 분석 트리거: comprehensive-analysis API 호출
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/comprehensive-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        async: true
      })
    });

    if (response.ok) {
      logger.info(`🔄 Analysis re-triggered for ${sessionId}`);
    } else {
      logger.error(`❌ Failed to re-trigger analysis for ${sessionId}: ${response.status}`);
    }
    
  } catch (error) {
    logger.error(`❌ Failed to trigger background analysis for ${sessionId}:`, error);
  } finally {
    // 30초 후 락 해제
    setTimeout(() => {
      processingLock.delete(sessionId);
    }, 30 * 1000);
  }
} 