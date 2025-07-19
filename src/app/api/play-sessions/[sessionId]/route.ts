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

    // Fallback 세션 감지 - 명확한 에러 메시지 제공
    if (sessionId.includes('prod-fallback-') || 
        sessionId.includes('dev-session-') || 
        sessionId.includes('dev-upload-')) {
      
      console.log(`❌ Fallback session detected: ${sessionId}`);
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'GCP 설정 오류로 인한 임시 세션입니다.',
          details: {
            reason: 'Google Cloud Platform 환경변수가 설정되지 않았습니다.',
            solutions: [
              '1. Vercel 대시보드에서 다음 환경변수를 설정하세요:',
              '   - GOOGLE_CLOUD_PROJECT_ID',
              '   - FIREBASE_ADMIN_PRIVATE_KEY', 
              '   - FIREBASE_ADMIN_CLIENT_EMAIL',
              '   - GOOGLE_CLOUD_BUCKET',
              '2. 환경변수 설정 후 다시 영상을 업로드하세요.',
              '3. 자세한 설정 방법은 VERCEL_ENV_SETUP.md를 참고하세요.'
            ]
          },
          sessionId,
          canRetry: true
        },
        { status: 424 } // Failed Dependency
      );
    }

    // 실제 GCP 세션 조회
    try {
      const gcpStorage = new GCPDataStorage();
      const session = await gcpStorage.getSession(sessionId);

      if (!session) {
        return NextResponse.json(
          { 
            success: false, 
            error: '요청하신 세션을 찾을 수 없습니다.',
            details: {
              sessionId,
              reason: '세션이 존재하지 않거나 만료되었습니다.',
              solutions: [
                '1. 세션 ID가 정확한지 확인하세요.',
                '2. 새로운 영상을 업로드하여 분석을 시작하세요.',
                '3. 세션이 24시간 이상 지났다면 만료되었을 수 있습니다.'
              ]
            }
          },
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
      
      const errorMessage = gcpError instanceof Error ? gcpError.message : String(gcpError);
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Google Cloud Platform 연결 오류가 발생했습니다.',
          details: {
            reason: errorMessage,
            solutions: [
              '1. 네트워크 연결을 확인하세요.',
              '2. GCP 서비스 계정 키가 올바른지 확인하세요.',
              '3. Firestore 데이터베이스가 활성화되어 있는지 확인하세요.',
              '4. 잠시 후 다시 시도하세요.'
            ],
            supportInfo: '문제가 계속 발생하면 시스템 관리자에게 문의하세요.'
          }
        },
        { status: 503 } // Service Unavailable
      );
    }

  } catch (error) {
    console.error(`❌ Session retrieval error for ${params.sessionId}:`, error);
    return NextResponse.json(
      { 
        success: false, 
        error: '세션 조회 중 예상치 못한 오류가 발생했습니다.',
        details: {
          reason: error instanceof Error ? error.message : '알 수 없는 오류',
          solutions: [
            '1. 페이지를 새로고침하고 다시 시도하세요.',
            '2. 브라우저 캐시를 지우고 다시 접속하세요.',
            '3. 문제가 지속되면 새로운 영상을 업로드하세요.'
          ]
        }
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