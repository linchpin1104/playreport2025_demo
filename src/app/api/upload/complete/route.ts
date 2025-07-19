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
      
      // 모든 GCP 관련 에러에 대해 개발 모드로 폴백
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
        console.log('🔧 프로덕션 환경에서 GCP 오류 → 개발 모드로 폴백');
        
        // 개발 모드 세션 생성
        const devSessionId = `prod-fallback-${uploadId}`;
        
        return NextResponse.json({
          success: true,
          message: '프로덕션 환경: GCP 설정 오류로 인한 폴백 모드',
          session: {
            sessionId: devSessionId,
            status: 'production-fallback',
            createdAt: new Date().toISOString(),
            uploadId: uploadId,
          },
          file: {
            gsUri,
            fileName,
            originalName,
            fileSize,
            contentType,
          },
          userInfo,
          uploadTime: new Date().toISOString(),
          isDevelopment: true,
          fallbackReason: 'GCP configuration error in production'
        });
      }
      
      // GCP 관련 에러가 아닌 경우는 다시 던지기
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