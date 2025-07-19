'use client';

import React, { useState, useCallback } from 'react';
import { Upload, X, CheckCircle, AlertCircle, FileVideo } from 'lucide-react';
import { UserInfo } from '@/types';

interface LargeFileUploaderProps {
  onUploadComplete: (result: UploadResult) => void;
  userInfo: UserInfo;
  maxSizeMB?: number;
}

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

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  speed: number; // bytes per second
  timeRemaining: number; // seconds
}

interface UploadState {
  status: 'idle' | 'preparing' | 'uploading' | 'completing' | 'success' | 'error';
  progress: UploadProgress | null;
  error: string | null;
  file: File | null;
  uploadId: string | null;
}

export default function LargeFileUploader({ 
  onUploadComplete, 
  userInfo, 
  maxSizeMB = 500 
}: LargeFileUploaderProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: null,
    error: null,
    file: null,
    uploadId: null,
  });

  // 파일 선택 처리
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    // 파일 크기 검증
    if (file.size > maxSizeBytes) {
      setUploadState(prev => ({
        ...prev,
        status: 'error',
        error: `파일 크기가 ${maxSizeMB}MB를 초과합니다. (현재: ${Math.round(file.size / 1024 / 1024)}MB)`,
      }));
      return;
    }

    // 파일 타입 검증
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      setUploadState(prev => ({
        ...prev,
        status: 'error',
        error: '지원하지 않는 파일 형식입니다. MP4, MOV, AVI, MKV, WEBM 파일만 업로드 가능합니다.',
      }));
      return;
    }

    setUploadState(prev => ({
      ...prev,
      file,
      status: 'idle',
      error: null,
      progress: null,
    }));

    // 파일 선택 후 자동으로 업로드 시작
    startUpload(file);
  }, [maxSizeMB]);

  // 업로드 시작
  const startUpload = useCallback(async (file: File) => {
    try {
      setUploadState(prev => ({
        ...prev,
        status: 'preparing',
        error: null,
      }));

      console.log('🚀 대용량 업로드 시작:', file.name, `(${Math.round(file.size / 1024 / 1024)}MB)`);

      // 1. Signed URL 요청
      const signedUrlResponse = await fetch('/api/upload/signed-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          userInfo: {
            caregiverName: userInfo.caregiverName,
            childName: userInfo.childName,
            childAge: userInfo.childAge,
          },
        }),
      });

      if (!signedUrlResponse.ok) {
        const errorData = await signedUrlResponse.json();
        throw new Error(errorData.error || 'Signed URL 생성 실패');
      }

      const signedUrlData = await signedUrlResponse.json();
      
      if (!signedUrlData.success) {
        throw new Error(signedUrlData.error || 'Signed URL 생성 실패');
      }

      console.log('✅ Signed URL 생성 완료:', signedUrlData.uploadId);

      setUploadState(prev => ({
        ...prev,
        uploadId: signedUrlData.uploadId,
        status: 'uploading',
      }));

      // 2. 직접 GCS에 업로드 (진행률 추적)
      await uploadToGCS(file, signedUrlData);

      // 3. 업로드 완료 처리
      await completeUpload(signedUrlData);

    } catch (error) {
      console.error('❌ 업로드 오류:', error);
      setUploadState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다.',
      }));
    }
  }, [userInfo]);

  // GCS에 직접 업로드
  const uploadToGCS = useCallback(async (file: File, signedUrlData: any) => {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const startTime = Date.now();

      // 진행률 추적
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const now = Date.now();
          const elapsed = (now - startTime) / 1000; // seconds
          const speed = event.loaded / elapsed; // bytes per second
          const timeRemaining = (event.total - event.loaded) / speed; // seconds

          const progress: UploadProgress = {
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100),
            speed,
            timeRemaining,
          };

          setUploadState(prev => ({
            ...prev,
            progress,
          }));
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log('✅ GCS 업로드 완료');
          resolve();
        } else {
          reject(new Error(`업로드 실패: ${xhr.status} ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('네트워크 오류로 업로드가 실패했습니다.'));
      });

      // 개발 모드인 경우 mock 업로드
      if (signedUrlData.isDevelopment) {
        console.log('🔧 개발 모드: Mock 업로드 시뮬레이션');
        setTimeout(() => {
          // 진행률 시뮬레이션
          let progress = 0;
          const interval = setInterval(() => {
            progress += 10;
            setUploadState(prev => ({
              ...prev,
              progress: {
                loaded: (file.size * progress) / 100,
                total: file.size,
                percentage: progress,
                speed: file.size / 10, // 가상의 속도
                timeRemaining: (100 - progress) / 10,
              },
            }));

            if (progress >= 100) {
              clearInterval(interval);
              resolve();
            }
          }, 500);
        }, 100);
        return;
      }

      // 실제 GCS 업로드
      xhr.open('PUT', signedUrlData.signedUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  }, []);

  // 업로드 완료 처리
  const completeUpload = useCallback(async (signedUrlData: any) => {
    setUploadState(prev => ({
      ...prev,
      status: 'completing',
    }));

    const completeResponse = await fetch('/api/upload/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uploadId: signedUrlData.uploadId,
        gsUri: signedUrlData.gsUri,
        fileName: signedUrlData.fileName,
        originalName: signedUrlData.originalName,
        fileSize: signedUrlData.fileSize,
        contentType: signedUrlData.contentType,
        userInfo: {
          caregiverName: userInfo.caregiverName,
          childName: userInfo.childName,
          childAge: userInfo.childAge,
        },
      }),
    });

    if (!completeResponse.ok) {
      const errorData = await completeResponse.json();
      throw new Error(errorData.error || '업로드 완료 처리 실패');
    }

    const completeData = await completeResponse.json();
    
    if (!completeData.success) {
      throw new Error(completeData.error || '업로드 완료 처리 실패');
    }

    console.log('🎉 업로드 완전 완료:', completeData.session.sessionId);

    setUploadState(prev => ({
      ...prev,
      status: 'success',
    }));

    // 완료 콜백 호출
    onUploadComplete({
      success: true,
      sessionId: completeData.session.sessionId,
      gsUri: completeData.file.gsUri,
      fileName: completeData.file.fileName,
      originalName: completeData.file.originalName,
      fileSize: completeData.file.fileSize,
      uploadTime: completeData.uploadTime,
      isDevelopment: completeData.isDevelopment,
    });
  }, [onUploadComplete, userInfo]);

  // 업로드 재시작
  const retryUpload = useCallback(() => {
    if (uploadState.file) {
      startUpload(uploadState.file);
    }
  }, [uploadState.file, startUpload]);

  // 취소 처리
  const cancelUpload = useCallback(() => {
    setUploadState({
      status: 'idle',
      progress: null,
      error: null,
      file: null,
      uploadId: null,
    });
  }, []);

  // 진행률 포맷팅
  const formatProgress = (progress: UploadProgress) => {
    const loadedMB = Math.round(progress.loaded / 1024 / 1024);
    const totalMB = Math.round(progress.total / 1024 / 1024);
    const speedMBps = Math.round(progress.speed / 1024 / 1024 * 10) / 10;
    const timeRemainingMin = Math.round(progress.timeRemaining / 60);

    return {
      size: `${loadedMB}MB / ${totalMB}MB`,
      speed: `${speedMBps}MB/s`,
      timeRemaining: timeRemainingMin > 0 ? `${timeRemainingMin}분 남음` : '거의 완료',
    };
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          영상 파일 업로드
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          최대 {maxSizeMB}MB까지 업로드 가능합니다. (MP4, MOV, AVI, MKV, WEBM)
        </p>
      </div>

      {/* 파일 선택 영역 */}
      {uploadState.status === 'idle' && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
          <input
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
            id="large-file-input"
          />
          <label htmlFor="large-file-input" className="cursor-pointer">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg text-gray-600 mb-2">
              여기를 클릭하여 영상 파일을 선택하세요
            </p>
            <p className="text-sm text-gray-500">
              또는 파일을 드래그앤드롭하세요
            </p>
          </label>
        </div>
      )}

      {/* 선택된 파일 정보 */}
      {uploadState.file && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileVideo className="h-8 w-8 text-blue-500" />
              <div>
                <p className="font-medium text-gray-900">{uploadState.file.name}</p>
                <p className="text-sm text-gray-500">
                  {Math.round(uploadState.file.size / 1024 / 1024)}MB
                </p>
              </div>
            </div>
            {uploadState.status === 'idle' && (
              <button
                onClick={cancelUpload}
                className="text-gray-400 hover:text-red-500"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 진행률 표시 */}
      {(uploadState.status === 'preparing' || uploadState.status === 'uploading' || uploadState.status === 'completing') && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              {uploadState.status === 'preparing' && '업로드 준비 중...'}
              {uploadState.status === 'uploading' && '업로드 중...'}
              {uploadState.status === 'completing' && '업로드 완료 처리 중...'}
            </span>
            {uploadState.progress && (
              <span className="text-sm text-gray-500">
                {uploadState.progress.percentage}%
              </span>
            )}
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadState.progress?.percentage || 0}%` }}
            />
          </div>

          {uploadState.progress && uploadState.status === 'uploading' && (
            <div className="flex justify-between text-xs text-gray-500">
              <span>{formatProgress(uploadState.progress).size}</span>
              <span>{formatProgress(uploadState.progress).speed}</span>
              <span>{formatProgress(uploadState.progress).timeRemaining}</span>
            </div>
          )}
        </div>
      )}

      {/* 성공 상태 */}
      {uploadState.status === 'success' && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            <p className="text-green-700 font-medium">
              업로드가 성공적으로 완료되었습니다!
            </p>
          </div>
        </div>
      )}

      {/* 오류 상태 */}
      {uploadState.status === 'error' && uploadState.error && (
        <div className="mb-6">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center mb-2">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-red-700 font-medium">업로드 오류</p>
            </div>
            <p className="text-red-600 text-sm mb-3">{uploadState.error}</p>
            <div className="flex space-x-3">
              <button
                onClick={retryUpload}
                className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm"
              >
                다시 시도
              </button>
              <button
                onClick={cancelUpload}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 