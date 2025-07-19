'use client';

import { User, Baby, CheckCircle, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserInfo } from '@/types';
import LargeFileUploader from '@/components/large-file-uploader';

interface UploadResult {
  success: boolean;
  sessionId: string;
  gsUri: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  uploadTime: string;
  isDevelopment?: boolean;
}

export default function UploadPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // localStorage에서 사용자 정보 가져오기
    const savedUserInfo = localStorage.getItem('tempUserInfo');
    if (!savedUserInfo) {
      // 사용자 정보가 없으면 정보 입력 페이지로 리디렉트
      router.push('/user-info');
      return;
    }

    try {
      const parsedUserInfo = JSON.parse(savedUserInfo) as UserInfo;
      setUserInfo(parsedUserInfo);
    } catch (error) {
      console.error('사용자 정보 파싱 오류:', error);
      router.push('/user-info');
    }
  }, [router]);

  const handleUploadComplete = (result: UploadResult) => {
    if (result.success) {
      console.log('🎉 대용량 업로드 성공:', result.sessionId);
      setUploadSuccess(true);
      setError(null);

      // localStorage에서 임시 정보 제거
      localStorage.removeItem('tempUserInfo');

      // 2초 후 분석 페이지로 이동
      setTimeout(() => {
        router.push(`/analysis?sessionId=${result.sessionId}`);
      }, 2000);
    } else {
      setError('업로드가 실패했습니다.');
    }
  };

  // 로딩 중일 때
  if (!userInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">사용자 정보를 확인하고 있습니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* 제목 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📹 대용량 놀이영상 업로드
          </h1>
          <p className="text-gray-600">
            최대 500MB까지 업로드 가능합니다. 안전하고 빠른 클라우드 직접 업로드 방식을 사용합니다.
          </p>
        </div>

        {/* 사용자 정보 요약 */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5 text-blue-600" />
              업로드 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <div>
                  <span className="text-gray-600">양육자:</span>
                  <span className="ml-1 font-medium">{userInfo.caregiverName}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Baby className="w-4 h-4 text-gray-500" />
                <div>
                  <span className="text-gray-600">아이:</span>
                  <span className="ml-1 font-medium">{userInfo.childName}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">나이:</span>
                <span className="ml-1 font-medium">{userInfo.childAge}세</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 업로드 완료 상태 */}
        {uploadSuccess ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-700 mb-2">
                🎉 대용량 업로드 완료!
              </h3>
              <p className="text-gray-600 mb-4">
                영상이 성공적으로 클라우드에 업로드되었습니다. 분석 페이지로 이동합니다.
              </p>
              <div className="animate-pulse text-blue-600">
                분석 페이지로 이동 중...
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* 대용량 업로드 컴포넌트 */}
            <LargeFileUploader
              userInfo={userInfo}
              maxSizeMB={500}
              onUploadComplete={handleUploadComplete}
            />

            {/* 업로드 방식 안내 */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">
                  ⚡ 대용량 파일 업로드 특징
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-700">
                  <div>
                    <h4 className="font-medium mb-2">✨ 고속 업로드</h4>
                    <ul className="space-y-1 text-blue-600">
                      <li>• Google Cloud Storage 직접 업로드</li>
                      <li>• 서버를 거치지 않는 빠른 전송</li>
                      <li>• 실시간 진행률 추적</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">🔒 안전한 보관</h4>
                    <ul className="space-y-1 text-blue-600">
                      <li>• 암호화된 전송 및 저장</li>
                      <li>• 중단된 업로드 재개 가능</li>
                      <li>• 업로드 완료 후 자동 검증</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 지원 파일 형식 안내 */}
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  📋 업로드 요구사항
                </h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
                  <div>
                    <h4 className="font-medium mb-2">📁 지원 형식</h4>
                    <ul className="space-y-1">
                      <li>• MP4 (추천)</li>
                      <li>• MOV (QuickTime)</li>
                      <li>• AVI</li>
                      <li>• MKV</li>
                      <li>• WEBM</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">⚖️ 파일 크기</h4>
                    <ul className="space-y-1">
                      <li>• 최대 500MB까지 지원</li>
                      <li>• 권장 크기: 300-500MB</li>
                      <li>• 최소 1분 이상의 놀이 영상</li>
                      <li>• HD 품질 권장 (1080p)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 오류 상태 */}
        {error && (
          <Alert className="mt-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
} 