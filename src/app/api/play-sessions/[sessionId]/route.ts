import { NextRequest, NextResponse } from 'next/server';
import { GCPDataStorage } from '@/lib/gcp-data-storage';

// Fallback 세션 감지 및 Mock 데이터 생성
function createMockSessionData(sessionId: string) {
  const now = new Date().toISOString();
  
  return {
    sessionId,
    metadata: {
      status: 'uploaded',
      uploadedAt: now,
      fileName: 'mock-video.mp4',
      fileSize: 50 * 1024 * 1024, // 50MB
      contentType: 'video/mp4',
      uploadId: sessionId.split('-').pop() || 'mock-upload-id',
      userInfo: {
        caregiverName: '테스트 양육자',
        childName: '테스트 아이',
        childAge: 3
      }
    },
    paths: {
      rawDataPath: `gs://mock-bucket/videos/${sessionId}.mp4`,
      processedDataPath: null,
      thumbnailPath: null,
      analysisResultPath: null
    },
    results: {
      videoAnalysis: null,
      languageAnalysis: null,
      comprehensiveAnalysis: null,
      lastUpdated: now
    },
    createdAt: now,
    updatedAt: now
  };
}

// Fallback 세션인지 확인
function isFallbackSession(sessionId: string): boolean {
  return sessionId.includes('prod-fallback-') || 
         sessionId.includes('dev-session-') || 
         sessionId.includes('dev-upload-');
}

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

    // Fallback 세션인 경우 Mock 데이터 반환
    if (isFallbackSession(sessionId)) {
      console.log(`🔧 Detected fallback session: ${sessionId} → returning mock data`);
      const mockSession = createMockSessionData(sessionId);
      
      return NextResponse.json({
        success: true,
        session: mockSession,
        isMockData: true,
        fallbackReason: 'GCP configuration unavailable'
      });
    }

    // 실제 GCP 세션 조회 시도
    try {
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

    } catch (gcpError) {
      console.error(`❌ GCP session retrieval failed for ${sessionId}:`, gcpError);
      
      // GCP 오류 시 Mock 세션으로 폴백
      console.log(`🔧 GCP error → creating mock session for: ${sessionId}`);
      const mockSession = createMockSessionData(sessionId);
      
      return NextResponse.json({
        success: true,
        session: mockSession,
        isMockData: true,
        fallbackReason: 'GCP storage error'
      });
    }

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