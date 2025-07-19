import { NextRequest, NextResponse } from 'next/server';
import { isDevelopmentMode, logDevelopmentMode } from '@/lib/mock-data-loader';
import { PlayDataStorage } from '@/lib/play-data-storage';

/**
 * 세션별 핵심 분석 데이터 조회 API
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: '세션 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const storage = new PlayDataStorage();
    
    // 세션 존재 확인
    const session = await storage.getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: '세션을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 핵심 분석 데이터 조회
    const playCore = await storage.getPlayCore(sessionId);
    
    if (!playCore) {
      return NextResponse.json(
        { success: false, error: '핵심 분석 데이터를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      playCore,
      sessionId,
      metadata: {
        sessionStatus: session.metadata.status,
        lastUpdated: session.metadata.lastUpdated,
        corePath: session.paths.corePath
      }
    });

  } catch (error) {
    console.error('Play core retrieval error:', error);
    return NextResponse.json(
      { success: false, error: '핵심 분석 데이터 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 