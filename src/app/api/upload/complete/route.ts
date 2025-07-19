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

    try {
      // Firestore에 세션 생성
      const gcpStorage = new GCPDataStorage();
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

      console.log(`✅ 세션 생성 완료: ${session.sessionId}`);

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
      console.error('❌ 세션 생성 오류:', storageError);
      
      // GCP 관련 에러인 경우 개발 모드로 처리
      if (storageError instanceof Error && storageError.message.includes('Configuration')) {
        return NextResponse.json({
          success: true,
          message: '개발 모드: 업로드 완료 시뮬레이션',
          session: {
            sessionId: `dev-session-${uploadId}`,
            status: 'development',
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
        });
      }
      
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