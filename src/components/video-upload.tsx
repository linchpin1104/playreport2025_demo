'use client';

import { FileVideo, Upload, X } from 'lucide-react';
import React, { useState, useCallback } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileUploadResponse, UserInfo } from '@/types';

interface VideoUploadProps {
  onUploadComplete: (result: FileUploadResponse) => void;
  onError: (error: string) => void;
  maxFileSize?: number; // MB 단위
  userInfo: UserInfo; // 사용자 정보 추가
}

const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm'];
const allowedExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm'];

export default function VideoUpload({ 
  onUploadComplete, 
  onError,
  maxFileSize = 500, // 원래 의도대로 500MB 제한
  userInfo, // userInfo prop 추가
}: VideoUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const isValidVideoFile = (fileName: string): boolean => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return allowedExtensions.includes(extension || '');
  };

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileSelect = useCallback((selectedFile: File) => {
    // Validate file type
    if (!isValidVideoFile(selectedFile.name)) {
      onError(`지원하지 않는 파일 형식입니다. (${allowedExtensions.join(', ')})`);
      return;
    }

    // Validate file size
    const maxSizeBytes = maxFileSize * 1024 * 1024;
    if (selectedFile.size > maxSizeBytes) {
      onError(`파일 크기가 ${maxFileSize}MB를 초과합니다.`);
      return;
    }

    setFile(selectedFile);
  }, [maxFileSize, onError]);

  const handleUpload = useCallback(async () => {
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const fileSizeMB = Math.round(file.size / 1024 / 1024 * 100) / 100;
      console.log('🚀 클라이언트 업로드 시작:');
      console.log(`   - 파일명: ${file.name}`);
      console.log(`   - 파일 크기: ${file.size} bytes (${fileSizeMB}MB)`);
      console.log(`   - 파일 타입: ${file.type}`);
      console.log(`   - 최대 허용: ${maxFileSize}MB`);
      
      const formData = new FormData();
      formData.append('video', file);
      
      // userInfo를 JSON 문자열로 추가
      formData.append('userInfo', JSON.stringify(userInfo));
      
      console.log('📤 서버로 전송 시작...');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      console.log(`📥 서버 응답: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        // 응답이 JSON인지 확인
        const contentType = response.headers.get('content-type');
        let errorMessage = '업로드에 실패했습니다.';
        
        try {
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            // HTML이나 텍스트 응답 처리
            const errorText = await response.text();
            console.error('서버 에러 응답:', errorText);
            
            // 일반적인 HTTP 에러 메시지 처리
            if (response.status === 413) {
              errorMessage = '파일 크기가 너무 큽니다. (최대 500MB)';
            } else if (response.status === 400) {
              errorMessage = '잘못된 요청입니다.';
            } else if (response.status === 500) {
              errorMessage = '서버 오류가 발생했습니다.';
            } else {
              errorMessage = `업로드 실패 (${response.status})`;
            }
          }
        } catch (parseError) {
          console.error('응답 파싱 오류:', parseError);
          errorMessage = `업로드 실패 (${response.status})`;
        }
        
        throw new Error(errorMessage);
      }

      const data: FileUploadResponse = await response.json();
      
      if (data.success) {
        console.log('✅ 업로드 완료:', data.session?.sessionId);
        onUploadComplete(data);
        setFile(null);
      } else {
        throw new Error(data.error || '업로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('❌ 업로드 오류:', error);
      onError(error instanceof Error ? error.message : '업로드에 실패했습니다.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [file, onUploadComplete, onError, userInfo, maxFileSize]);

  const handleRemoveFile = useCallback(() => {
    setFile(null);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  }, [handleFileSelect]);

  return (
    <div className="w-full">
      {!file ? (
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors duration-200
            ${dragOver 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('video-file-input')?.click()}
        >
          <FileVideo className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-700">
              비디오 파일을 드래그하거나 클릭하여 선택하세요
            </p>
            <p className="text-sm text-gray-500">
              지원 형식: {allowedExtensions.map(ext => ext.toUpperCase()).join(', ')}
            </p>
            <p className="text-sm text-gray-500">
              최대 크기: {maxFileSize}MB
            </p>
          </div>
          <input
            id="video-file-input"
            type="file"
            accept={allowedTypes.join(',')}
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* 선택된 파일 정보 */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <FileVideo className="w-8 h-8 text-blue-500" />
              <div>
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
              </div>
            </div>
            {!uploading && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveFile}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* 업로드 진행률 */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">업로드 중...</span>
                <span className="text-sm text-gray-500">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* 업로드 버튼 */}
          {!uploading && (
            <Button
              onClick={handleUpload}
              className="w-full"
              size="lg"
            >
              <Upload className="w-4 h-4 mr-2" />
              업로드 시작
            </Button>
          )}
        </div>
      )}
    </div>
  );
} 