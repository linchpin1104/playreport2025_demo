import { NextRequest, NextResponse } from 'next/server';
import { isDevelopmentMode } from '@/lib/mock-data-loader';

export async function GET(request: NextRequest) {
  try {
    const isDevMode = isDevelopmentMode();
    
    return NextResponse.json({
      isDevMode,
      nodeEnv: process.env.NODE_ENV,
      useMockData: process.env.USE_MOCK_DATA,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('개발 모드 상태 확인 오류:', error);
    
    return NextResponse.json(
      { success: false, error: '개발 모드 상태를 확인할 수 없습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
} 