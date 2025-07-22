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
    console.log('🔍 환경변수 상태 체크:');
    console.log(`   - NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`   - VERCEL: ${process.env.VERCEL}`);
    console.log(`   - GOOGLE_CLOUD_PROJECT_ID: ${process.env.GOOGLE_CLOUD_PROJECT_ID ? '설정됨' : '없음'}`);
    console.log(`   - GOOGLE_CLOUD_BUCKET: ${process.env.GOOGLE_CLOUD_BUCKET ? '설정됨' : '없음'}`);
    console.log(`   - GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON: ${process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON ? '설정됨' : '없음'}`);
    console.log(`   - GOOGLE_CLOUD_KEY_FILE: ${process.env.GOOGLE_CLOUD_KEY_FILE ? '설정됨' : '없음'}`);
    
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
      console.warn(`❌ 지원하지 않는 파일 형식: ${contentType}`);
      return NextResponse.json(
        { success: false, error: '지원하지 않는 파일 형식입니다.' },
        { status: 400 }
      );
    }

    console.log('✅ 파일 검증 통과');

    // Google Cloud Storage 초기화
    console.log('🔧 Google Cloud Storage 초기화 시도...');
    const storageInstance = initializeStorage();
    if (!storageInstance) {
      console.error('❌ Google Cloud Storage 초기화 실패');
      return NextResponse.json(
        { success: false, error: 'Google Cloud Storage 설정이 필요합니다. 관리자에게 문의하세요.' },
        { status: 503 }
      );
    }

    console.log('✅ Google Cloud Storage 초기화 성공');

    // 고유 파일명 생성
    const fileExtension = fileName.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `videos/${uniqueFileName}`;

    console.log(`📁 생성된 파일 경로: ${filePath}`);

    // 세션 생성
    console.log('📝 세션 생성 시도...');
    let session;
    try {
      const gcpStorage = new GCPDataStorage();
      session = await gcpStorage.createSessionWithUserInfo(
        uniqueFileName,
        fileName,
        fileSize,
        userInfo
      );
      console.log(`✅ 세션 생성 성공: ${session.sessionId}`);
    } catch (sessionError) {
      console.error('❌ 세션 생성 실패:', sessionError);
      return NextResponse.json(
        { success: false, error: `세션 생성 실패: ${sessionError instanceof Error ? sessionError.message : String(sessionError)}` },
        { status: 500 }
      );
    }

    // Presigned URL 생성 (1시간 유효)
    console.log('🔗 Presigned URL 생성 시도...');
    let signedUrl;
    try {
      const bucketName = configManager.get('gcp.bucketName');
      if (!bucketName) {
        throw new Error('GOOGLE_CLOUD_BUCKET 환경변수가 설정되지 않았습니다');
      }
      
      console.log(`🪣 버킷명: ${bucketName}`);
      const bucket = storageInstance.bucket(bucketName);
      const file = bucket.file(filePath);

      const [url] = await file.getSignedUrl({
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
      
      signedUrl = url;
      console.log(`✅ Presigned URL 생성 완료`);
    } catch (urlError) {
      console.error('❌ Presigned URL 생성 실패:', urlError);
      return NextResponse.json(
        { success: false, error: `Presigned URL 생성 실패: ${urlError instanceof Error ? urlError.message : String(urlError)}` },
        { status: 500 }
      );
    }

    // 세션에 업로드 정보 추가
    console.log('💾 세션 업데이트 시도...');
    try {
      const bucketName = configManager.get('gcp.bucketName');
      const gsUri = `gs://${bucketName}/${filePath}`;
      session.paths.rawDataPath = gsUri;
      
      const gcpStorage = new GCPDataStorage();
      await gcpStorage.saveSession(session);
      console.log(`✅ 세션 업데이트 완료: ${session.sessionId}`);
    } catch (updateError) {
      console.error('❌ 세션 업데이트 실패:', updateError);
      // 세션 업데이트 실패해도 Presigned URL은 생성되었으므로 경고만 로그
      console.warn('⚠️ 세션 업데이트는 실패했지만 업로드는 가능합니다');
    }

    console.log('🎉 Presigned URL API 응답 준비 완료');
    return NextResponse.json({
      success: true,
      uploadUrl: signedUrl,
      sessionId: session.sessionId,
      fileName: uniqueFileName,
      originalName: fileName,
      fileSize,
      gsUri: `gs://${configManager.get('gcp.bucketName')}/${filePath}`,
      session: {
        sessionId: session.sessionId,
        status: session.metadata.status,
        createdAt: session.metadata.uploadedAt
      }
    });

  } catch (error) {
    console.error('❌ Presigned URL API 최상위 에러:', error);
    console.error('❌ 에러 스택:', error instanceof Error ? error.stack : 'No stack available');
    
    // 에러 타입별 메시지
    let errorMessage = 'Presigned URL 생성 중 알 수 없는 오류가 발생했습니다.';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        timestamp: new Date().toISOString(),
        requestId: `error-${Date.now()}`
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