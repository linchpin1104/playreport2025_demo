import { NextRequest, NextResponse } from 'next/server';
import { VideoIntelligenceServiceClient } from '@google-cloud/video-intelligence';
import { protos } from '@google-cloud/video-intelligence';
import config from '@/lib/config';
import { VideoIntelligenceResults } from '@/types';
import { isDevelopmentMode, getMockAnalysisData, logDevelopmentMode } from '@/lib/mock-data-loader';

// Initialize Google Cloud Video Intelligence client
const client = new VideoIntelligenceServiceClient({
  projectId: config.googleCloud.projectId,
  keyFilename: config.googleCloud.keyFile,
});

export async function POST(request: NextRequest) {
  try {
    // 개발 모드 체크
    if (isDevelopmentMode()) {
      logDevelopmentMode('Analysis API');
      
      // Mock 데이터 반환 (실제 분석 없이 바로 성공 응답)
      const mockResults = getMockAnalysisData();
      
      // 실제 분석 시간을 시뮬레이션 (짧게)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return NextResponse.json({
        success: true,
        results: mockResults,
        metadata: {
          fileName: 'sample-video.mp4',
          gsUri: 'gs://mock-bucket/sample-video.mp4',
          processingTime: Date.now(),
        },
      });
    }

    const body = await request.json();
    const { gsUri, fileName } = body;

    if (!gsUri) {
      return NextResponse.json(
        { success: false, error: 'Google Cloud Storage URI가 제공되지 않았습니다.' },
        { status: 400 }
      );
    }

    if (!fileName) {
      return NextResponse.json(
        { success: false, error: '파일 이름이 제공되지 않았습니다.' },
        { status: 400 }
      );
    }

    // Validate gs:// URI format
    if (!gsUri.startsWith('gs://')) {
      return NextResponse.json(
        { success: false, error: '올바른 Google Cloud Storage URI 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    // Configure video analysis request
    const analysisRequest = {
      inputUri: gsUri,
      features: [
        protos.google.cloud.videointelligence.v1.Feature.OBJECT_TRACKING,
        protos.google.cloud.videointelligence.v1.Feature.SPEECH_TRANSCRIPTION,
        protos.google.cloud.videointelligence.v1.Feature.FACE_DETECTION,
        protos.google.cloud.videointelligence.v1.Feature.PERSON_DETECTION,
        protos.google.cloud.videointelligence.v1.Feature.SHOT_CHANGE_DETECTION,
        protos.google.cloud.videointelligence.v1.Feature.EXPLICIT_CONTENT_DETECTION
      ],
      videoContext: {
        speechTranscriptionConfig: {
          languageCode: config.analysisFeatures.languageCode,
          enableSpeakerDiarization: config.analysisFeatures.enableSpeakerDiarization,
          diarizationSpeakerCount: config.analysisFeatures.diarizationSpeakerCount,
          enableWordTimeOffsets: true,
          enableWordConfidence: true,
        },
        faceDetectionConfig: {
          includeAttributes: true,
          includeBoundingBoxes: true,
        },
        personDetectionConfig: {
          includeBoundingBoxes: true,
          includeAttributes: true,
        },
      },
    };

    console.log('Starting video analysis for:', fileName);
    console.log('Using input URI:', gsUri);
    console.log('Speech transcription config:', {
      languageCode: config.analysisFeatures.languageCode,
      enableSpeakerDiarization: config.analysisFeatures.enableSpeakerDiarization,
      diarizationSpeakerCount: config.analysisFeatures.diarizationSpeakerCount,
    });
    
    // Start video analysis
    const [operation] = await client.annotateVideo(analysisRequest);
    const [result] = await operation.promise();

    // Debug: Log raw analysis results
    console.log('Raw analysis result structure:', JSON.stringify({
      annotationResults: result.annotationResults?.length || 0,
      speechTranscriptions: result.annotationResults?.[0]?.speechTranscriptions?.length || 0,
      objectAnnotations: result.annotationResults?.[0]?.objectAnnotations?.length || 0,
      faceDetectionAnnotations: result.annotationResults?.[0]?.faceDetectionAnnotations?.length || 0,
    }, null, 2));

    // Parse analysis results
    const analysisResults: VideoIntelligenceResults = {
      objectTracking: (result.annotationResults?.[0]?.objectAnnotations || []) as any,
      speechTranscription: (result.annotationResults?.[0]?.speechTranscriptions || []) as any,
      faceDetection: (result.annotationResults?.[0]?.faceDetectionAnnotations || []) as any,
      personDetection: (result.annotationResults?.[0]?.personDetectionAnnotations || []) as any,
      shotChanges: (result.annotationResults?.[0]?.shotAnnotations || []) as any,
      explicitContent: (result.annotationResults?.[0]?.explicitAnnotation?.frames || []) as any,
    };

    console.log('Video analysis completed for:', fileName);
    console.log('Speech transcription results:', analysisResults.speechTranscription.length);

    return NextResponse.json({
      success: true,
      results: analysisResults,
      metadata: {
        fileName,
        gsUri,
        processingTime: Date.now(),
      },
    });

  } catch (error) {
    console.error('Video analysis error:', error);
    
    // Handle specific Google Cloud errors
    if (error instanceof Error) {
      if (error.message.includes('PERMISSION_DENIED')) {
        return NextResponse.json(
          { success: false, error: 'Google Cloud 서비스 계정 권한이 부족합니다. 설정을 확인해주세요.' },
          { status: 403 }
        );
      }
      
      if (error.message.includes('INVALID_ARGUMENT')) {
        return NextResponse.json(
          { success: false, error: '비디오 파일 형식이나 경로가 올바르지 않습니다.' },
          { status: 400 }
        );
      }
      
      if (error.message.includes('NOT_FOUND')) {
        return NextResponse.json(
          { success: false, error: '비디오 파일을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: '비디오 분석 중 오류가 발생했습니다.' },
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

// Helper function to validate video URL
function isValidVideoUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'https:' || parsedUrl.protocol === 'gs:';
  } catch {
    return false;
  }
}

// Helper function to estimate processing time
function estimateProcessingTime(fileSize: number): number {
  // Rough estimate: 1MB takes about 10 seconds
  const sizeInMB = fileSize / (1024 * 1024);
  return Math.ceil(sizeInMB * 10);
} 