import { Storage } from '@google-cloud/storage';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { configManager } from '@/lib/services/config-manager';
import { GCPDataStorage } from '@/lib/gcp-data-storage';
import { UserInfo } from '@/types';

// Next.js App Router Route Segment Config
export const runtime = 'nodejs';
export const maxDuration = 300; // 5분

// 캐시 비활성화
export const revalidate = 0;

// Google Cloud Storage 인스턴스 (런타임에 초기화)
let storage: Storage | null = null;

function initializeStorage() {
  if (storage) return storage;
  
  try {
    if (!configManager.isConfigAvailable('gcp.keyFile') || !configManager.isConfigAvailable('gcp.projectId')) {
      console.warn('⚠️ GCP 설정이 없습니다. 로컬 개발 모드로 실행됩니다.');
      return null;
    }

    storage = new Storage({
      projectId: configManager.get('gcp.projectId'),
      keyFilename: configManager.get('gcp.keyFile'),
    });
    
    return storage;
  } catch (error) {
    console.error('❌ Google Cloud Storage 초기화 실패:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // 파일 크기 체크를 먼저 수행 (메모리 절약)
    const contentLength = request.headers.get('content-length');
    const maxSize = 500 * 1024 * 1024; // 500MB
    
    if (contentLength && parseInt(contentLength) > maxSize) {
      return NextResponse.json(
        { success: false, error: '파일 크기가 500MB를 초과합니다.' },
        { status: 413 } // Request Entity Too Large
      );
    }

    console.log('📤 파일 업로드 요청 시작...');
    
    const formData = await request.formData();
    const file = formData.get('video') as File;
    const userInfoString = formData.get('userInfo') as string;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: '파일이 선택되지 않았습니다.' },
        { status: 400 }
      );
    }

    if (!userInfoString) {
      return NextResponse.json(
        { success: false, error: '사용자 정보가 필요합니다.' },
        { status: 400 }
      );
    }

    // 사용자 정보 파싱
    let userInfo: UserInfo;
    try {
      userInfo = JSON.parse(userInfoString);
    } catch {
      return NextResponse.json(
        { success: false, error: '사용자 정보 형식이 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: '지원하지 않는 파일 형식입니다.' },
        { status: 400 }
      );
    }

    // Validate file size (after FormData parsing)
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: '파일 크기가 500MB를 초과합니다.' },
        { status: 413 }
      );
    }

    console.log(`📁 파일 정보: ${file.name} (${file.size} bytes, ${file.type})`);

    // Google Cloud Storage 초기화
    const storageInstance = initializeStorage();
    
    if (!storageInstance) {
      return NextResponse.json(
        { success: false, error: 'Google Cloud Storage 설정이 필요합니다.' },
        { status: 503 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    
    const bucketName = configManager.get('gcp.bucketName');
    const bucket = storageInstance.bucket(bucketName);
    const file_upload = bucket.file(`videos/${uniqueFileName}`);
    
    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log(`📁 Uploading file: ${file.name} (${buffer.length} bytes) to videos/${uniqueFileName}`);

    // Upload to Google Cloud Storage (simple way that worked before)
    const stream = file_upload.createWriteStream({
      metadata: {
        contentType: file.type,
        metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          caregiverName: userInfo.caregiverName,
          childName: userInfo.childName,
          childAge: userInfo.childAge.toString(),
        }
      },
      resumable: file.size > 5 * 1024 * 1024, // 5MB 이상만 resumable
    });

    await new Promise<void>((resolve, reject) => {
      stream.on('error', reject);
      stream.on('finish', resolve);
      stream.end(buffer);
    });

    const gsUri = `gs://${bucketName}/videos/${uniqueFileName}`;
    console.log(`✅ File uploaded successfully: videos/${uniqueFileName}`);

    // Create session in Firestore with user info
    const gcpStorage = new GCPDataStorage();
    const session = await gcpStorage.createSessionWithUserInfo(
      `videos/${uniqueFileName}`,
      file.name,
      file.size,
      userInfo
    );

    // gsUri를 세션에 추가하고 저장
    session.paths.rawDataPath = gsUri;
    await gcpStorage.saveSession(session);

    console.log(`✅ Session created with user info: ${session.sessionId}`);

    return NextResponse.json({
      success: true,
      fileName: uniqueFileName,
      gsUri,
      originalName: file.name,
      fileSize: file.size,
      contentType: file.type,
      uploadTime: new Date().toISOString(),
      userInfo: {
        caregiverName: userInfo.caregiverName,
        childName: userInfo.childName,
        childAge: userInfo.childAge
      },
      session: {
        sessionId: session.sessionId,
        status: session.metadata.status,
        createdAt: session.metadata.uploadedAt
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: '업로드 중 오류가 발생했습니다.' },
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