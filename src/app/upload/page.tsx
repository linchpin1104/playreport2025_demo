'use client';

import { FileVideo, Upload, CheckCircle, AlertTriangle, User, Baby } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { UserInfo } from '@/types';

export default function UploadPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [success, setSuccess] = useState(false);
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

  const handleFileSelect = (file: File) => {
    // 파일 타입 검증
    if (!file.type.startsWith('video/')) {
      setError('비디오 파일만 업로드할 수 있습니다.');
      return;
    }
    
    // 파일 크기 검증 (300MB 제한)
    if (file.size > 300 * 1024 * 1024) {
      setError('파일 크기는 300MB 이하여야 합니다.');
      return;
    }
    
    setSelectedFile(file);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile || !userInfo) {return;}

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // 업로드 진행 시뮬레이션
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // FormData 생성
      const formData = new FormData();
      formData.append('video', selectedFile);
      formData.append('userInfo', JSON.stringify(userInfo));

      // 업로드 API 호출
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadProgress(100);
        setSuccess(true);
        
        // localStorage에서 임시 정보 제거
        localStorage.removeItem('tempUserInfo');
        
        // 2초 후 분석 페이지로 이동
        setTimeout(() => {
          router.push(`/analysis?sessionId=${result.session.sessionId}`);
        }, 2000);
      } else {
        throw new Error(result.error || '업로드에 실패했습니다.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
      handleFileSelect(file);
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
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            놀이영상 업로드
          </h1>
          <p className="text-gray-600">
            분석할 놀이영상을 업로드해주세요
          </p>
        </div>

        {/* 사용자 정보 요약 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              입력된 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">양육자:</span>
                  <span>{userInfo.caregiverName} ({userInfo.caregiverType})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Baby className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">아이:</span>
                  <span>{userInfo.childName} ({userInfo.childAge}세, {userInfo.childGender})</span>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/user-info')}
                >
                  정보 수정
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {success ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-700 mb-2">
                업로드 완료!
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
          <Card>
            <CardContent className="p-8">
              {!selectedFile ? (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('video-input')?.click()}
                >
                  <FileVideo className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">
                    파일을 드래그하거나 클릭하여 선택하세요
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    MP4, MOV, AVI 등의 비디오 파일 (최대 300MB)
                  </p>
                  <Button variant="outline">
                    파일 선택
                  </Button>
                  <input
                    id="video-input"
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {handleFileSelect(file);}
                    }}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="text-center">
                  <FileVideo className="w-16 h-16 mx-auto mb-4 text-blue-500" />
                  <h3 className="text-lg font-semibold mb-2">선택된 파일</h3>
                  <p className="text-gray-600 mb-1">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500 mb-6">
                    크기: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>

                  {isUploading ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 justify-center">
                        <Upload className="w-5 h-5 animate-pulse" />
                        <span>업로드 중...</span>
                      </div>
                      <Progress value={uploadProgress} className="w-full" />
                      <p className="text-sm text-gray-600">
                        {uploadProgress}% 완료
                      </p>
                    </div>
                  ) : (
                    <div className="flex gap-4 justify-center">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedFile(null)}
                      >
                        다시 선택
                      </Button>
                      <Button onClick={handleUpload}>
                        업로드 시작
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <Alert className="mt-6">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            업로드된 영상은 분석 후 안전하게 처리됩니다
          </p>
        </div>
      </div>
    </div>
  );
} 