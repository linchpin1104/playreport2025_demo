import { NextRequest, NextResponse } from 'next/server';
import { GCPDataStorage } from '@/lib/gcp-data-storage';

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: '세션 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log(`📋 Fetching session: ${sessionId}`);

    const gcpStorage = new GCPDataStorage();
    const session = await gcpStorage.getSession(sessionId);

    if (!session) {
      return NextResponse.json(
        { success: false, error: '세션을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    console.log(`✅ Session found: ${sessionId}`);

    return NextResponse.json({
      success: true,
      session
    });

  } catch (error) {
    console.error(`❌ Session retrieval error for ${params.sessionId}:`, error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '세션 조회 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId;
    const body = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: '세션 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log(`📝 Updating session: ${sessionId}`);

    const gcpStorage = new GCPDataStorage();
    const updatedSession = await gcpStorage.updateSession(sessionId, body);

    console.log(`✅ Session updated: ${sessionId}`);

    return NextResponse.json({
      success: true,
      session: updatedSession
    });

  } catch (error) {
    console.error(`❌ Session update error for ${params.sessionId}:`, error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '세션 업데이트 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId;

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
    console.error(`❌ Session deletion error for ${params.sessionId}:`, error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '세션 삭제 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
} 