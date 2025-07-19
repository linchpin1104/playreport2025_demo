import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';
import { ConfigManager } from '@/lib/services/config-manager';

// Route Segment Config
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SignedUrlRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
  userInfo: {
    caregiverName: string;
    childName: string;
    childAge: number;
  };
}

let storage: Storage | null = null;

function initializeStorage() {
  if (storage) return storage;
  
  try {
    const configManager = ConfigManager.getInstance();
    
    if (!configManager.isConfigAvailable('gcp.keyFile') || !configManager.isConfigAvailable('gcp.projectId')) {
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
    const body: SignedUrlRequest = await request.json();
    const { fileName, fileType, fileSize, userInfo } = body;

    // 입력값 검증
    if (!fileName || !fileType || !fileSize || !userInfo) {
      return NextResponse.json(
        { success: false, error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 파일 크기 검증 (500MB 제한)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (fileSize > maxSize) {
      return NextResponse.json(
        { success: false, error: '파일 크기가 500MB를 초과합니다.' },
        { status: 413 }
      );
    }

    // 파일 타입 검증
    const allowedTypes = [
      'video/mp4', 'video/quicktime', 'video/x-msvideo', 
      'video/x-matroska', 'video/webm', 'video/avi'
    ];
    if (!allowedTypes.includes(fileType)) {
      return NextResponse.json(
        { success: false, error: '지원하지 않는 파일 형식입니다.' },
        { status: 400 }
      );
    }

    const storageInstance = initializeStorage();
    
    if (!storageInstance) {
      // 개발 모드 - Mock Signed URL
      const mockUploadId = `dev-upload-${Date.now()}`;
      return NextResponse.json({
        success: true,
        uploadId: mockUploadId,
        signedUrl: 'https://storage.googleapis.com/dev-bucket/mock-upload',
        resumableUploadUrl: 'https://storage.googleapis.com/upload/dev-bucket/mock-resumable',
        gsUri: `gs://dev-bucket/videos/${mockUploadId}.${fileName.split('.').pop()}`,
        fileName: `${mockUploadId}.${fileName.split('.').pop()}`,
        originalName: fileName,
        fileSize,
        contentType: fileType,
        expiresIn: 15 * 60 * 1000, // 15분
        isDevelopment: true
      });
    }

    const configManager = ConfigManager.getInstance();
    const bucketName = configManager.get('gcp.storageBucket');
    const bucket = storageInstance.bucket(bucketName);
    
    // 고유 파일명 생성
    const fileExtension = fileName.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `videos/${uniqueFileName}`;
    const file = bucket.file(filePath);

    console.log(`📁 Signed URL 생성: ${fileName} (${fileSize} bytes) → ${filePath}`);

    // Signed URL 생성 (PUT 방식, 15분 유효)
    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15분
      contentType: fileType,
      extensionHeaders: {
        'x-goog-meta-original-name': fileName,
        'x-goog-meta-caregiver-name': userInfo.caregiverName,
        'x-goog-meta-child-name': userInfo.childName,
        'x-goog-meta-child-age': userInfo.childAge.toString(),
        'x-goog-meta-uploaded-at': new Date().toISOString(),
      },
    });

    // Resumable Upload URL 생성 (대용량 파일용)
    const [resumableUploadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'resumable',
      expires: Date.now() + 60 * 60 * 1000, // 1시간
      contentType: fileType,
      extensionHeaders: {
        'x-goog-meta-original-name': fileName,
        'x-goog-meta-caregiver-name': userInfo.caregiverName,
        'x-goog-meta-child-name': userInfo.childName,
        'x-goog-meta-child-age': userInfo.childAge.toString(),
        'x-goog-meta-uploaded-at': new Date().toISOString(),
      },
    });

    const gsUri = `gs://${bucketName}/${filePath}`;
    const uploadId = uuidv4();

    console.log(`✅ Signed URL 생성 완료: ${uploadId}`);

    return NextResponse.json({
      success: true,
      uploadId,
      signedUrl,
      resumableUploadUrl,
      gsUri,
      fileName: uniqueFileName,
      originalName: fileName,
      fileSize,
      contentType: fileType,
      expiresIn: 15 * 60 * 1000, // 15분 (ms)
      resumableExpiresIn: 60 * 60 * 1000, // 1시간 (ms)
    });

  } catch (error) {
    console.error('❌ Signed URL 생성 오류:', error);
    return NextResponse.json(
      { success: false, error: 'Signed URL 생성 중 오류가 발생했습니다.' },
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