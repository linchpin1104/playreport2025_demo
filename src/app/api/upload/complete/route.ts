import { NextRequest, NextResponse } from 'next/server';
import { GCPDataStorage } from '@/lib/gcp-data-storage';

/**
 * 업로드 완료 알림 API
 * 클라이언트가 GCS 직접 업로드 완료 후 세션 상태 업데이트
 */
export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log(`🔄 업로드 완료 처리: ${sessionId}`);

    const gcpStorage = new GCPDataStorage();
    const session = await gcpStorage.getSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: '세션을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 세션 상태 업데이트
    session.metadata.status = 'uploaded';
    session.metadata.lastUpdated = new Date().toISOString();
    await gcpStorage.saveSession(session);

    console.log(`✅ 업로드 완료 상태 업데이트: ${sessionId}`);

    return NextResponse.json({
      success: true,
      sessionId: session.sessionId,
      status: session.metadata.status
    });

  } catch (error) {
    console.error('❌ 업로드 완료 처리 오류:', error);
    return NextResponse.json(
      { success: false, error: '상태 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 