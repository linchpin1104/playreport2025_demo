import { NextRequest, NextResponse } from 'next/server';
import { GCPDataStorage } from '@/lib/gcp-data-storage';

/**
 * 놀이 세션 관리 API
 * - 세션 목록 조회
 * - 세션 검색
 * - 세션 생성
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    console.log(`📋 Fetching play sessions - limit: ${limit}, offset: ${offset}`);

    const gcpStorage = new GCPDataStorage();
    
    // 세션 목록 조회 (필터링 옵션 포함)
    const sessions = await gcpStorage.getAllSessions({
      limit,
      offset,
      status: status || undefined,
      search: search || undefined
    });

    const totalCount = await gcpStorage.getSessionCount(status || undefined);

    return NextResponse.json({
      success: true,
      sessions,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });

  } catch (error) {
    console.error('❌ Play Sessions GET error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '세션 목록 조회 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, originalName, fileSize } = body;

    if (!fileName || !originalName || !fileSize) {
      return NextResponse.json(
        { success: false, error: '필수 매개변수가 누락되었습니다.' },
        { status: 400 }
      );
    }

    console.log(`📝 Creating new play session: ${originalName}`);

    const gcpStorage = new GCPDataStorage();
    const session = await gcpStorage.createSession(fileName, originalName, fileSize);

    console.log(`✅ Session created: ${session.sessionId}`);

    return NextResponse.json({
      success: true,
      session
    });

  } catch (error) {
    console.error('❌ Play Sessions POST error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '세션 생성 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: '세션 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log(`🗑️ Deleting session: ${sessionId}`);

    const gcpStorage = new GCPDataStorage();
    await gcpStorage.deleteSession(sessionId);

    console.log(`✅ Session deleted: ${sessionId}`);

    return NextResponse.json({
      success: true,
      message: '세션이 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('❌ Play Sessions DELETE error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '세션 삭제 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
} 