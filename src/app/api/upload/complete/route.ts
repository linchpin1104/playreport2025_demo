import { NextRequest, NextResponse } from 'next/server';
import { GCPDataStorage } from '@/lib/gcp-data-storage';
import { UserInfo } from '@/types';

// Route Segment Config
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface UploadCompleteRequest {
  uploadId: string;
  gsUri: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  contentType: string;
  userInfo: {
    caregiverName: string;
    childName: string;
    childAge: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: UploadCompleteRequest = await request.json();
    const { 
      uploadId, 
      gsUri, 
      fileName, 
      originalName, 
      fileSize, 
      contentType, 
      userInfo 
    } = body;

    // 입력값 검증
    if (!uploadId || !gsUri || !fileName || !userInfo) {
      return NextResponse.json(
        { success: false, error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    console.log(`🎯 업로드 완료 처리 시작: ${uploadId}`);
    console.log(`📁 파일 정보: ${originalName} (${fileSize} bytes) → ${gsUri}`);

    // 프로덕션 환경 GCP 설정 확인
    let gcpStorage: GCPDataStorage | null = null;
    
    try {
      // GCPDataStorage 안전 초기화
      gcpStorage = new GCPDataStorage();
      
      const session = await gcpStorage.createSessionWithUserInfo(
        fileName, // GCS 파일명
        originalName, // 원본 파일명
        fileSize,
        userInfo
      );

      // gsUri를 세션에 추가
      session.paths.rawDataPath = gsUri;
      session.metadata.uploadId = uploadId;
      session.metadata.contentType = contentType;

      // 세션 저장
      await gcpStorage.saveSession(session);

      console.log(`✅ 프로덕션 세션 생성 완료: ${session.sessionId}`);

      return NextResponse.json({
        success: true,
        message: '업로드가 성공적으로 완료되었습니다.',
        session: {
          sessionId: session.sessionId,
          status: session.metadata.status,
          createdAt: session.metadata.uploadedAt,
          uploadId: uploadId,
        },
        file: {
          gsUri,
          fileName,
          originalName,
          fileSize,
          contentType,
        },
        userInfo: {
          caregiverName: userInfo.caregiverName,
          childName: userInfo.childName,
          childAge: userInfo.childAge,
        },
        uploadTime: new Date().toISOString(),
      });

    } catch (storageError) {
      console.error('❌ GCP 세션 생성 오류:', storageError);
      
      // GCP 관련 에러인지 확인
      const errorMessage = storageError instanceof Error ? storageError.message : String(storageError);
      const isGcpError = storageError instanceof Error && (
        storageError.message.includes('Configuration') ||
        storageError.message.includes('credentials') ||
        storageError.message.includes('GOOGLE_APPLICATION_CREDENTIALS') ||
        storageError.message.includes('service account') ||
        storageError.message.includes('Firebase') ||
        storageError.message.includes('Firestore') ||
        storageError.message.includes('Storage')
      );
      
      if (isGcpError) {
        console.log('❌ GCP 설정 오류 감지 → 정확한 에러 메시지 반환');
        
        return NextResponse.json({
          success: false,
          error: '업로드는 완료되었으나 세션 생성에 실패했습니다.',
          details: {
            reason: 'Google Cloud Platform 환경변수가 설정되지 않았습니다.',
            uploadedFile: {
              fileName: originalName,
              fileSize: `${Math.round(fileSize / 1024 / 1024)}MB`,
              uploadTime: new Date().toISOString()
            },
            requiredActions: [
              '1. Vercel 대시보드에서 다음 환경변수를 설정하세요:',
              '   - GOOGLE_CLOUD_PROJECT_ID=your-project-id',
              '   - FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."',
              '   - FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com',
              '   - GOOGLE_CLOUD_BUCKET=your-storage-bucket',
              '2. 환경변수 설정 후 동일한 파일을 다시 업로드하세요.',
              '3. 업로드된 파일은 임시로 저장되었지만 분석할 수 없습니다.'
            ],
            supportLink: '자세한 설정 방법은 VERCEL_ENV_SETUP.md를 참고하세요.',
            canRetry: true
          }
        }, { status: 424 }); // Failed Dependency
      }
      
      // 다른 종류의 GCP 에러
      throw storageError;
    }

  } catch (error) {
    console.error('❌ 업로드 완료 처리 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '업로드 완료 처리 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
} 