import { Storage } from '@google-cloud/storage';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { configManager } from '@/lib/services/config-manager';
import { GCPDataStorage } from '@/lib/gcp-data-storage';
import { UserInfo } from '@/types';

// Next.js App Router Route Segment Config
export const runtime = 'nodejs';
export const revalidate = 0;

// Google Cloud Storage 인스턴스 (런타임에 초기화)
let storage: Storage | null = null;

function initializeStorage() {
  if (storage) return storage;
  
  try {
    if (!configManager.isConfigAvailable('gcp.projectId')) {
      console.warn('⚠️ GCP Project ID가 없습니다. 환경변수 GOOGLE_CLOUD_PROJECT_ID를 설정하세요.');
      return null;
    }

    const projectId = configManager.get('gcp.projectId');
    const keyFile = configManager.get('gcp.keyFile');
    const serviceAccountJson = process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON;

    // Vercel 환경에서는 JSON 키를 직접 사용
    if (serviceAccountJson) {
      console.log('✅ Service Account JSON 발견, 직접 인증 사용');
      try {
        const credentials = JSON.parse(serviceAccountJson);
        storage = new Storage({
          projectId,
          credentials
        });
      } catch (jsonError) {
        console.error('❌ Service Account JSON 파싱 실패:', jsonError);
        return null;
      }
    } 
    // 로컬 개발환경에서는 키 파일 사용
    else if (keyFile && keyFile.length > 0) {
      console.log('✅ 키 파일 경로 발견, 파일 인증 사용');
      storage = new Storage({
        projectId,
        keyFilename: keyFile,
      });
    }
    // 둘 다 없으면 기본 인증 시도 (Application Default Credentials)
    else {
      console.log('⚠️ 명시적 인증 정보 없음, Application Default Credentials 시도');
      storage = new Storage({
        projectId
      });
    }
    
    console.log(`✅ Google Cloud Storage 초기화 완료 (Project: ${projectId})`);
    return storage;
  } catch (error) {
    console.error('❌ Google Cloud Storage 초기화 실패:', error);
    return null;
  }
}

/**
 * 🆕 Presigned URL 방식 업로드 API
 * Vercel 50MB 제한을 우회하기 위해 클라이언트가 GCS로 직접 업로드
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Presigned URL 업로드 API 시작');
    
    const body = await request.json();
    const { fileName, fileSize, contentType, userInfo }: {
      fileName: string;
      fileSize: number;
      contentType: string;
      userInfo: UserInfo;
    } = body;

    console.log(`📊 업로드 요청 정보:`);
    console.log(`   - 파일명: ${fileName}`);
    console.log(`   - 크기: ${fileSize} bytes (${Math.round(fileSize / 1024 / 1024 * 100) / 100}MB)`);
    console.log(`   - 타입: ${contentType}`);

    // 파일 크기 검증 (500MB)
    const maxSize = 500 * 1024 * 1024;
    if (fileSize > maxSize) {
      console.warn(`❌ 파일 크기 초과: ${fileSize} > ${maxSize}`);
      return NextResponse.json(
        { success: false, error: `파일 크기가 500MB를 초과합니다. (${Math.round(fileSize / 1024 / 1024)}MB)` },
        { status: 413 }
      );
    }

    // 파일 형식 검증
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm'];
    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json(
        { success: false, error: '지원하지 않는 파일 형식입니다.' },
        { status: 400 }
      );
    }

    // Google Cloud Storage 초기화
    const storageInstance = initializeStorage();
    if (!storageInstance) {
      return NextResponse.json(
        { success: false, error: 'Google Cloud Storage 설정이 필요합니다.' },
        { status: 503 }
      );
    }

    // 고유 파일명 생성
    const fileExtension = fileName.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `videos/${uniqueFileName}`;

    console.log(`📁 생성된 파일 경로: ${filePath}`);

    // 세션 생성
    const gcpStorage = new GCPDataStorage();
    const session = await gcpStorage.createSessionWithUserInfo(
      uniqueFileName,
      fileName,
      fileSize,
      userInfo
    );

    console.log(`✅ 세션 생성: ${session.sessionId}`);

    // Presigned URL 생성 (1시간 유효)
    const bucketName = configManager.get('gcp.bucketName');
    const bucket = storageInstance.bucket(bucketName);
    const file = bucket.file(filePath);

    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 60 * 60 * 1000, // 1시간
      contentType: contentType,
      extensionHeaders: {
        'x-goog-meta-session-id': session.sessionId,
        'x-goog-meta-original-name': fileName,
        'x-goog-meta-user-info': JSON.stringify(userInfo),
      },
    });

    console.log(`✅ Presigned URL 생성 완료`);

    // 세션에 업로드 정보 추가
    const gsUri = `gs://${bucketName}/${filePath}`;
    session.paths.rawDataPath = gsUri;
    await gcpStorage.saveSession(session);

    return NextResponse.json({
      success: true,
      uploadUrl: signedUrl,
      sessionId: session.sessionId,
      fileName: uniqueFileName,
      originalName: fileName,
      fileSize,
      gsUri,
      session: {
        sessionId: session.sessionId,
        status: session.metadata.status,
        createdAt: session.metadata.uploadedAt
      }
    });

  } catch (error) {
    console.error('❌ Presigned URL 생성 오류:', error);
    return NextResponse.json(
      { success: false, error: 'Presigned URL 생성 중 오류가 발생했습니다.' },
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