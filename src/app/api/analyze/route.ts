import { NextRequest, NextResponse } from 'next/server';
import { getVideoAnalysisService } from '@/lib/dependency-injection/container-setup';
import { VideoAnalysisRequest } from '@/lib/services/video-analysis-service';

/**
 * 비디오 분석 API - 실제 Google Cloud Video Intelligence 사용
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, gsUri, fileName, options } = body;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: '세션 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!gsUri) {
      return NextResponse.json(
        { success: false, error: '비디오 URI가 필요합니다.' },
        { status: 400 }
      );
    }

    console.log(`🎬 Starting video analysis for session: ${sessionId}`);
    console.log(`📁 Video URI: ${gsUri}`);
    
    const videoAnalysisService = getVideoAnalysisService();
    
    const analysisRequest: VideoAnalysisRequest = {
      sessionId,
      gsUri,
      fileName,
      options
    };

    const result = await videoAnalysisService.performCompleteAnalysis(analysisRequest);

    console.log(`✅ Video analysis completed for session: ${sessionId}`);

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Analysis error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '분석 중 오류가 발생했습니다.' 
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