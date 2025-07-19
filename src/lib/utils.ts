import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Video file validation utilities
export function isValidVideoFile(fileName: string, allowedTypes: string[]): boolean {
  const fileExtension = fileName.split('.').pop()?.toLowerCase();
  if (!fileExtension) {return false;}
  
  // allowedTypes는 파일 확장자 배열 (예: ['mp4', 'mov', 'avi', 'mkv', 'webm'])
  return allowedTypes.includes(fileExtension);
}

export function validateFileSize(file: File, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024; // MB to bytes
  return file.size <= maxSizeBytes;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) {return '0 Bytes';}
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))  } ${  sizes[i]}`;
}
 