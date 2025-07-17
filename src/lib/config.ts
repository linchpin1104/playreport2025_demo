// Type declaration for process.env
declare const process: {
  env: {
    [key: string]: string | undefined;
    NODE_ENV: string;
  };
};

// App Configuration
export const config = {
  app: {
    name: 'Play Report',
    description: '놀이영상 분석 및 레포트 생성 서비스',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    maxFileSize: process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '100MB',
    allowedFileTypes: (process.env.NEXT_PUBLIC_ALLOWED_FILE_TYPES || 'mp4,mov,avi,mkv').split(','),
  },
  
  // Google Cloud Configuration
  googleCloud: {
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || '',
    keyFile: process.env.GOOGLE_CLOUD_KEY_FILE || '',
    bucketName: process.env.GOOGLE_CLOUD_BUCKET || '',
    location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
  },
  
  // OpenAI Configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4000'),
  },
  
  // Firebase Configuration
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  },
  
  // Firebase Admin Configuration
  firebaseAdmin: {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || '',
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL || '',
  },
  
  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
    timeout: parseInt(process.env.API_TIMEOUT || '30000'),
  },
  
  // Video Analysis Configuration
  videoAnalysis: {
    maxDuration: parseInt(process.env.MAX_VIDEO_DURATION || '600'), // 10 minutes
    minDuration: parseInt(process.env.MIN_VIDEO_DURATION || '30'), // 30 seconds
    supportedFormats: ['mp4', 'mov', 'avi', 'mkv', 'webm'],
    maxResolution: process.env.MAX_VIDEO_RESOLUTION || '1920x1080',
  },
  
  // Analysis Features Configuration
  analysisFeatures: {
    objectTracking: true,
    speechTranscription: true,
    faceDetection: true,
    personDetection: true,
    shotChangeDetection: true,
    explicitContentDetection: true,
    languageCode: process.env.SPEECH_LANGUAGE_CODE || 'ko-KR',
    enableSpeakerDiarization: true,
    diarizationSpeakerCount: 2,
  },
  
  // Development Configuration
  isDev: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: process.env.ENABLE_CONSOLE_LOG !== 'false',
  },
};

// Validation function to check required environment variables
export function validateConfig() {
  const required = [
    'GOOGLE_CLOUD_PROJECT_ID',
    'OPENAI_API_KEY',
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'FIREBASE_ADMIN_PROJECT_ID',
    'FIREBASE_ADMIN_PRIVATE_KEY',
    'FIREBASE_ADMIN_CLIENT_EMAIL',
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`Missing required environment variables: ${missing.join(', ')}`);
    return false;
  }
  
  return true;
}

// Get configuration with validation
export function getConfig() {
  if (!validateConfig()) {
    throw new Error('Configuration validation failed');
  }
  
  return config;
}

export default config; 