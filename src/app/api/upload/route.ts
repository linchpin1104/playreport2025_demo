import { NextRequest, NextResponse } from 'next/server';
import { Storage } from '@google-cloud/storage';
import config from '@/lib/config';
import { v4 as uuidv4 } from 'uuid';
import { isDevelopmentMode, getMockUploadData, logDevelopmentMode } from '@/lib/mock-data-loader';

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: config.googleCloud.projectId,
  keyFilename: config.googleCloud.keyFile,
});

export async function POST(request: NextRequest) {
  try {
    // 개발 모드 체크
    if (isDevelopmentMode()) {
      logDevelopmentMode('Upload API');
      
      // Mock 데이터 반환 (실제 업로드 없이 바로 성공 응답)
      const mockData = getMockUploadData();
      
      // 실제 업로드 시간을 시뮬레이션 (짧게)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return NextResponse.json(mockData);
    }

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
    const filePath = `videos/${uniqueFileName}`;

    // Get or create bucket
    const bucketName = config.googleCloud.bucketName;
    const bucket = storage.bucket(bucketName);
    
    // Check if bucket exists, if not create it
    try {
      const [exists] = await bucket.exists();
      if (!exists) {
        console.log(`Creating bucket: ${bucketName}`);
        await storage.createBucket(bucketName, {
          location: config.googleCloud.location,
        });
        console.log(`Bucket ${bucketName} created`);
      }
    } catch (error) {
      console.log('Bucket creation/check error:', error);
      // Continue anyway, might exist but have different permissions
    }

    // Upload file to Google Cloud Storage
    const file_buffer = Buffer.from(await file.arrayBuffer());
    const gcsFile = bucket.file(filePath);
    
    await gcsFile.save(file_buffer, {
      metadata: {
        contentType: file.type,
      },
      resumable: false,
    });

    console.log(`File uploaded successfully: ${filePath}`);

    // Generate Google Cloud Storage URI (gs://)
    const gsUri = `gs://${bucketName}/${filePath}`;
    
    // Generate signed URL for browser access (optional)
    const [signedUrl] = await gcsFile.getSignedUrl({
      action: 'read',
      expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    });

    // Return success response
    return NextResponse.json({
      success: true,
      fileUrl: signedUrl, // For browser access
      gsUri: gsUri, // For Video Intelligence API
      fileName: uniqueFileName,
      originalName: file.name,
      fileSize: file.size,
      contentType: file.type,
      bucketName: bucketName,
      filePath: filePath
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