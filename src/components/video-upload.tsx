'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { formatFileSize, isValidVideoFile, validateFileSize } from '@/lib/utils';
import { FileUploadResponse } from '@/types';

interface VideoUploadProps {
  onUploadSuccess?: (response: FileUploadResponse) => void;
  onUploadError?: (error: string) => void;
  maxFileSize?: number; // MB
  allowedTypes?: string[];
  isLoading?: boolean;
}

export default function VideoUpload({
  onUploadSuccess,
  onUploadError,
  maxFileSize = 100,
  allowedTypes = ['mp4', 'mov', 'avi', 'mkv', 'webm'],
  isLoading = false
}: VideoUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
    if (!isValidVideoFile(selectedFile.name, allowedTypes)) {
      onUploadError?.(`지원하지 않는 파일 형식입니다. (${allowedTypes.join(', ')})`);
      return;
    }

    // Validate file size
    if (!validateFileSize(selectedFile, maxFileSize)) {
      onUploadError?.(`파일 크기가 ${maxFileSize}MB를 초과합니다.`);
      return;
    }

    setFile(selectedFile);
  }, [allowedTypes, maxFileSize, onUploadError]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleUpload = useCallback(async () => {
    if (!file) {return;}

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('video', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('업로드에 실패했습니다.');
      }

      const data: FileUploadResponse = await response.json();
      
      if (data.success) {
        onUploadSuccess?.(data);
        setFile(null);
      } else {
        throw new Error(data.error || '업로드에 실패했습니다.');
      }
    } catch (error) {
      onUploadError?.(error instanceof Error ? error.message : '업로드에 실패했습니다.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [file, onUploadSuccess, onUploadError]);

  const handleRemoveFile = useCallback(() => {
    setFile(null);
  }, []);

  return (
    <div className="w-full max-w-md mx-auto">
      {!file ? (
        <div
          className={`upload-zone ${dragOver ? 'dragover' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center py-8">
            <svg
              className="w-12 h-12 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-lg font-medium text-gray-700 mb-2">
              놀이영상을 업로드해주세요
            </p>
            <p className="text-sm text-gray-500 mb-4">
              파일을 드래그하여 놓거나 클릭하여 선택하세요
            </p>
            <Button
              variant="outline"
              onClick={() => document.getElementById('file-input')?.click()}
            >
              파일 선택
            </Button>
            <input
              id="file-input"
              type="file"
              accept={allowedTypes.map(type => `.${type}`).join(',')}
              className="hidden"
              onChange={handleFileInputChange}
            />
          </div>
          <div className="mt-4 text-xs text-gray-500">
            <p>지원 형식: {allowedTypes.join(', ')}</p>
            <p>최대 크기: {maxFileSize}MB</p>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">선택된 파일</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveFile}
              disabled={uploading}
            >
              ✕
            </Button>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              <span className="font-medium">파일명:</span> {file.name}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">크기:</span> {formatFileSize(file.size)}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">형식:</span> {file.type}
            </p>
          </div>

          {uploading && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                업로드 중... {uploadProgress}%
              </p>
            </div>
          )}

          <div className="mt-6 flex space-x-3">
            <Button
              onClick={handleUpload}
              disabled={uploading || isLoading}
              className="flex-1"
            >
              {uploading ? '업로드 중...' : isLoading ? '분석 중...' : '분석 시작'}
            </Button>
            <Button
              variant="outline"
              onClick={handleRemoveFile}
              disabled={uploading || isLoading}
            >
              취소
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 