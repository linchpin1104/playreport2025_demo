// 설정 관리 시스템
export interface ConfigSchema {
  // 환경 설정
  environment: {
    nodeEnv: string;
    isDevelopment: boolean;
    isProduction: boolean;
    isTest: boolean;
  };

  // 서버 설정
  server: {
    port: number;
    host: string;
    timeout: number;
  };

  // GCP 설정
  gcp: {
    projectId: string;
    region: string;
    keyFile: string;
    bucketName: string;
  };

  // API 설정
  apis: {
    openai: {
      apiKey: string;
      model: string;
      maxTokens: number;
      temperature: number;
    };
    videoIntelligence: {
      features: string[];
      timeout: number;
    };
  };

  // 캐시 설정
  cache: {
    defaultTTL: number;
    maxSize: number;
    cleanupInterval: number;
  };

  // 로깅 설정
  logging: {
    level: string;
    enableConsole: boolean;
    enableFile: boolean;
  };

  // 업로드 설정
  upload: {
    maxFileSize: number;
    allowedTypes: string[];
    uploadTimeout: number;
  };

  // 분석 설정
  analysis: {
    maxProcessingTime: number;
    retryAttempts: number;
    enableMockData: boolean;
  };
}

export class ConfigManager {
  private config: ConfigSchema;
  private readonly validators: Map<string, (value: any) => boolean> = new Map();
  private readonly required: Set<string> = new Set();

  constructor() {
    this.setupValidators();
    this.setupRequired();
    this.config = this.loadConfig();
    this.validateConfig();
  }

  private setupValidators(): void {
    // 환경 변수 검증 규칙
    this.validators.set('environment.nodeEnv', (value) => 
      ['development', 'production', 'test'].includes(value)
    );
    
    this.validators.set('server.port', (value) => 
      typeof value === 'number' && value > 0 && value <= 65535
    );
    
    this.validators.set('gcp.projectId', (value) => 
      typeof value === 'string' && value.length > 0
    );
    
    this.validators.set('apis.openai.apiKey', (value) => 
      typeof value === 'string' && value.startsWith('sk-')
    );
    
    this.validators.set('upload.maxFileSize', (value) => 
      typeof value === 'number' && value > 0
    );
    
    this.validators.set('analysis.maxProcessingTime', (value) => 
      typeof value === 'number' && value > 0
    );
  }

  private setupRequired(): void {
    this.required.add('gcp.projectId');
    this.required.add('gcp.keyFile');
    this.required.add('apis.openai.apiKey');
  }

  private loadConfig(): ConfigSchema {
    const nodeEnv = process.env.NODE_ENV || 'development';
    
    return {
      environment: {
        nodeEnv,
        isDevelopment: nodeEnv === 'development',
        isProduction: nodeEnv === 'production',
        isTest: nodeEnv === 'test'
      },

      server: {
        port: parseInt(process.env.PORT || '3000'),
        host: process.env.HOST || 'localhost',
        timeout: parseInt(process.env.SERVER_TIMEOUT || '30000')
      },

      gcp: {
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || '',
        region: process.env.GOOGLE_CLOUD_REGION || 'us-central1',
        keyFile: process.env.GOOGLE_CLOUD_KEY_FILE || '',
        bucketName: process.env.GOOGLE_CLOUD_BUCKET_NAME || ''
      },

      apis: {
        openai: {
          apiKey: process.env.OPENAI_API_KEY || '',
          model: process.env.OPENAI_MODEL || 'gpt-4',
          maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4000'),
          temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7')
        },
        videoIntelligence: {
          features: (process.env.VIDEO_INTELLIGENCE_FEATURES || 'OBJECT_TRACKING,FACE_DETECTION').split(','),
          timeout: parseInt(process.env.VIDEO_INTELLIGENCE_TIMEOUT || '300000')
        }
      },

      cache: {
        defaultTTL: parseInt(process.env.CACHE_DEFAULT_TTL || '300000'),
        maxSize: parseInt(process.env.CACHE_MAX_SIZE || '100'),
        cleanupInterval: parseInt(process.env.CACHE_CLEANUP_INTERVAL || '60000')
      },

      logging: {
        level: process.env.LOG_LEVEL || (nodeEnv === 'development' ? 'debug' : 'info'),
        enableConsole: process.env.LOG_ENABLE_CONSOLE !== 'false',
        enableFile: process.env.LOG_ENABLE_FILE === 'true'
      },

      upload: {
        maxFileSize: parseInt(process.env.UPLOAD_MAX_FILE_SIZE || '104857600'), // 100MB
        allowedTypes: (process.env.UPLOAD_ALLOWED_TYPES || 'mp4,mov,avi,mkv,webm').split(','),
        uploadTimeout: parseInt(process.env.UPLOAD_TIMEOUT || '300000')
      },

      analysis: {
        maxProcessingTime: parseInt(process.env.ANALYSIS_MAX_PROCESSING_TIME || '1800000'), // 30분
        retryAttempts: parseInt(process.env.ANALYSIS_RETRY_ATTEMPTS || '3'),
        enableMockData: process.env.ENABLE_MOCK_DATA === 'true'
      }
    };
  }

  private validateConfig(): void {
    const errors: string[] = [];

    // 필수 설정 확인
    for (const key of Array.from(this.required)) {
      const value = this.get(key);
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors.push(`Required configuration missing: ${key}`);
      }
    }

    // 설정 값 검증
    for (const [key, validator] of Array.from(this.validators.entries())) {
      const value = this.get(key);
      if (value !== undefined && !validator(value)) {
        errors.push(`Invalid configuration value for ${key}: ${value}`);
      }
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
  }

  // 설정 값 조회
  get<T = any>(key: string): T {
    const keys = key.split('.');
    let current: any = this.config;

    for (const k of keys) {
      if (current[k] === undefined) {
        return undefined as T;
      }
      current = current[k];
    }

    return current as T;
  }

  // 설정 값 존재 여부 확인
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  // 필수 설정 값 조회 (없으면 에러)
  getRequired<T = any>(key: string): T {
    const value = this.get<T>(key);
    if (value === undefined) {
      throw new Error(`Required configuration missing: ${key}`);
    }
    return value;
  }

  // 기본값과 함께 설정 값 조회
  getWithDefault<T = any>(key: string, defaultValue: T): T {
    const value = this.get<T>(key);
    return value !== undefined ? value : defaultValue;
  }

  // 전체 설정 조회
  getAll(): ConfigSchema {
    return { ...this.config };
  }

  // 환경별 설정 조회
  getEnvironmentConfig() {
    return {
      isDevelopment: this.config.environment.isDevelopment,
      isProduction: this.config.environment.isProduction,
      isTest: this.config.environment.isTest,
      nodeEnv: this.config.environment.nodeEnv
    };
  }

  // 설정 검증 상태 확인
  getValidationStatus() {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 필수 설정 확인
    for (const key of Array.from(this.required)) {
      const value = this.get(key);
      if (!value) {
        errors.push(`Missing required config: ${key}`);
      }
    }

    // 권장 설정 확인
    const recommended = [
      'gcp.region',
      'cache.defaultTTL',
      'logging.level'
    ];

    for (const key of recommended) {
      const value = this.get(key);
      if (!value) {
        warnings.push(`Recommended config not set: ${key}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      configuredKeys: this.getConfiguredKeys()
    };
  }

  private getConfiguredKeys(): string[] {
    const keys: string[] = [];
    
    const traverse = (obj: any, prefix: string = '') => {
      for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          traverse(obj[key], fullKey);
        } else {
          keys.push(fullKey);
        }
      }
    };

    traverse(this.config);
    return keys;
  }

  // 설정 재로드
  reload(): void {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  // 개발 모드 전용 설정 오버라이드
  overrideForDevelopment(overrides: Partial<ConfigSchema>): void {
    if (!this.config.environment.isDevelopment) {
      throw new Error('Configuration override only allowed in development mode');
    }
    
    this.config = { ...this.config, ...overrides };
  }
}

// 싱글톤 인스턴스
export const configManager = new ConfigManager();

// 편의 함수들
export const config = {
  get: <T = any>(key: string): T => configManager.get<T>(key),
  getRequired: <T = any>(key: string): T => configManager.getRequired<T>(key),
  getWithDefault: <T = any>(key: string, defaultValue: T): T => configManager.getWithDefault<T>(key, defaultValue),
  has: (key: string): boolean => configManager.has(key),
  
  // 자주 사용하는 설정들
  isDevelopment: () => configManager.get<boolean>('environment.isDevelopment'),
  isProduction: () => configManager.get<boolean>('environment.isProduction'),
  getGCPConfig: () => configManager.get('gcp'),
  getOpenAIConfig: () => configManager.get('apis.openai'),
  getUploadConfig: () => configManager.get('upload'),
  getAnalysisConfig: () => configManager.get('analysis')
};

// 환경 변수 확인 헬퍼
export const checkEnvironment = () => {
  const status = configManager.getValidationStatus();
  
  if (!status.isValid) {
    console.error('❌ Configuration validation failed:');
    status.errors.forEach(error => console.error(`  - ${error}`));
    throw new Error('Invalid configuration');
  }
  
  if (status.warnings.length > 0) {
    console.warn('⚠️  Configuration warnings:');
    status.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
  
  console.log('✅ Configuration validated successfully');
  return status;
}; 