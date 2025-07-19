'use client';

import { Upload, Play, FileVideo, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useRef } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 비디오 파일 검증
      if (!file.type.startsWith('video/')) {
        setError('비디오 파일만 업로드할 수 있습니다.');
        return;
      }
      
      // 파일 크기 검증 (100MB 제한)
      if (file.size > 100 * 1024 * 1024) {
        setError('파일 크기는 100MB 이하여야 합니다.');
        return;
      }
      
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {return;}

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

      // 업로드 API 호출
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadProgress(100);
        setSuccess(true);
        
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
      setSelectedFile(file);
      setError(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🎯 놀이 상호작용 분석
          </h1>
          <p className="text-gray-600">
            부모-자녀 놀이 영상을 업로드하여 상호작용 분석을 시작하세요
          </p>
        </div>

        {/* 업로드 카드 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              비디오 업로드
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedFile ? (
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileVideo className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">
                  파일을 드래그하거나 클릭하여 선택하세요
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  MP4, MOV, AVI 등의 비디오 파일 (최대 100MB)
                </p>
                <Button variant="outline">
                  파일 선택
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <FileVideo className="w-8 h-8 text-blue-500" />
                  <div className="flex-1">
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">업로드 진행중...</span>
                      <span className="text-sm text-gray-500">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}

                {success && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      업로드가 완료되었습니다! 분석 페이지로 이동 중...
                    </AlertDescription>
                  </Alert>
                )}

                {!isUploading && !success && (
                  <Button 
                    onClick={handleUpload}
                    className="w-full"
                    size="lg"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    분석 시작
                  </Button>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </CardContent>
        </Card>

        {/* 오류 메시지 */}
        {error && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* 안내 사항 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📋 분석 안내</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>부모와 자녀가 함께 놀이하는 영상이 최적입니다</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>3-10분 길이의 영상을 권장합니다</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>참여자들이 선명하게 보이는 영상이 좋습니다</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>분석에는 약 2-3분이 소요됩니다</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 