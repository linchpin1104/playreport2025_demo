'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Upload, User, Baby, Calendar } from 'lucide-react';
import VideoUpload from '@/components/video-upload';
import { UserInfo, FileUploadResponse } from '@/types';

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

  const handleUploadComplete = (result: FileUploadResponse) => {
    if (result.success) {
      console.log('🎉 업로드 성공:', result.session?.sessionId);
      setUploadSuccess(true);
      setError(null);

      // localStorage에서 임시 정보 제거
      localStorage.removeItem('tempUserInfo');

      // 2초 후 분석 페이지로 이동
      setTimeout(() => {
        router.push(`/analysis?sessionId=${result.session?.sessionId}`);
      }, 2000);
    } else {
      setError(result.error || '업로드가 실패했습니다.');
    }
  };

  const handleUploadError = (errorMessage: string) => {
    setError(errorMessage);
    setUploadSuccess(false);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
            <Upload className="w-8 h-8 text-blue-600" />
            놀이 영상 업로드
          </h1>
          <p className="text-gray-600">
            아이의 놀이 영상을 업로드하여 발달 상태를 분석해보세요
          </p>
        </div>

        {/* 사용자 정보 요약 */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>보호자: {userInfo.caregiverName}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Baby className="w-4 h-4" />
                <span>아이: {userInfo.childName}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>나이: {userInfo.childAge}개월</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 에러 메시지 */}
        {error && (
          <Card className="mb-6 border-red-200">
            <CardContent className="p-4">
              <div className="text-red-600 text-center">
                <p className="font-medium">업로드 실패</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {uploadSuccess ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-700 mb-2">
                🎉 업로드 완료!
              </h3>
              <p className="text-gray-600 mb-4">
                영상이 성공적으로 업로드되었습니다. 분석 페이지로 이동합니다.
              </p>
              <div className="animate-pulse text-blue-600">
                분석 페이지로 이동 중...
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* 기존 검증된 업로드 컴포넌트 사용 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  영상 파일 업로드 (최대 500MB)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <VideoUpload
                  onUploadComplete={handleUploadComplete}
                  onError={handleUploadError}
                  maxFileSize={500}
                  userInfo={userInfo}
                />
              </CardContent>
            </Card>

            {/* 업로드 방식 안내 */}
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-600">
                  <h4 className="font-medium mb-2">📋 업로드 가이드</h4>
                  <ul className="space-y-1">
                    <li>• 지원 형식: MP4, MOV, AVI, MKV, WEBM</li>
                    <li>• 최대 크기: 500MB</li>
                    <li>• 권장 길이: 5-30분</li>
                    <li>• 안정적인 인터넷 연결 권장</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
} 