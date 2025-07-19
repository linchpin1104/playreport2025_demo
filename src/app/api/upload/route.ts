import { Storage } from '@google-cloud/storage';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import config from '@/lib/config';
import { GCPDataStorage } from '@/lib/gcp-data-storage';

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: config.googleCloud.projectId,
  keyFilename: config.googleCloud.keyFile,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('video') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: '파일이 선택되지 않았습니다.' },
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

    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: '파일 크기가 100MB를 초과합니다.' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const bucketName = config.googleCloud.storageBucket;
    const bucket = storage.bucket(bucketName);
    const file_upload = bucket.file(`videos/${uniqueFileName}`);
    
    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log(`📁 Uploading file: ${file.name} (${buffer.length} bytes) to videos/${uniqueFileName}`);

    // Upload to Google Cloud Storage
    const stream = file_upload.createWriteStream({
      metadata: {
        contentType: file.type,
        metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        }
      },
      resumable: false
    });

    await new Promise<void>((resolve, reject) => {
      stream.on('error', reject);
      stream.on('finish', resolve);
      stream.end(buffer);
    });

    const gsUri = `gs://${bucketName}/videos/${uniqueFileName}`;
    console.log(`✅ File uploaded successfully: videos/${uniqueFileName}`);

    // Create session in Firestore
    const gcpStorage = new GCPDataStorage();
    const session = await gcpStorage.createSession(
      `videos/${uniqueFileName}`,
      file.name,
      file.size
    );

    // gsUri를 세션에 추가
    session.paths.rawDataPath = gsUri;
    if (!session.paths.integratedAnalysisPath) {
      session.paths.integratedAnalysisPath = undefined;
    }
    await gcpStorage.saveSession(session);

    console.log(`✅ Session created: ${session.sessionId}`);

    return NextResponse.json({
      success: true,
      fileName: uniqueFileName,
      gsUri,
      originalName: file.name,
      fileSize: file.size,
      contentType: file.type,
      uploadTime: new Date().toISOString(),
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