import * as fs from 'fs/promises';
import * as path from 'path';
import config from '@/lib/config';
import { PlayAnalysisCore } from '@/lib/play-analysis-extractor';

/**
 * 놀이 분석 데이터 저장 시스템
 * 추출된 핵심 정보와 분석 결과를 체계적으로 저장하고 관리
 */

export interface PlayAnalysisSession {
  sessionId: string;
  metadata: {
    fileName: string;
    originalName: string;
    fileSize: number;
    uploadedAt: string;
    analyzedAt: string;
    lastUpdated: string;
    status: 'uploaded' | 'analyzed' | 'core_extracted' | 'voice_analyzed' | 'comprehensive_analysis_started' | 'comprehensive_analysis_completed' | 'evaluation_completed' | 'report_generated';
  };
  paths: {
    corePath?: string;
    evaluationPath?: string;
    reportPath?: string;
    rawDataPath?: string;
    voiceAnalysisPath?: string;
    integratedAnalysisPath?: string;
  };
  analysis: {
    participantCount: number;
    videoDuration: number;
    safetyScore: number;
    overallScore?: number;
    keyInsights?: string[];
  };
  evaluation?: PlayEvaluationResult;
  voiceAnalysis?: {
    speakerCount: number;
    totalSpeechDuration: number;
    averageInteractionQuality: number;
    emotionalSynchrony: number;
    conversationBalance: number;
  };
  integratedAnalysis?: {
    overallScore: number;
    interactionQuality: number;
    completedAt: string;
    processingSteps: number;
  };
  comprehensiveAnalysis?: {
    status: 'in_progress' | 'completed' | 'error';
    startTime: string;
    endTime?: string;
    currentStep: string;
    progress: number;
    steps: Array<{
      step: string;
      status: 'pending' | 'in_progress' | 'completed' | 'error';
      progress: number;
      message: string;
      startTime?: string;
      endTime?: string;
      error?: string;
    }>;
    error?: string;
  };
  tags: string[];
}

export interface PlayEvaluationResult {
  evaluationId: string;
  sessionId: string;
  evaluatedAt: string;
  scores: {
    interactionQuality: number;
    emotionalConnection: number;
    developmentalSupport: number;
    playEnvironment: number;
    overall: number;
  };
  insights: {
    strengths: string[];
    improvements: string[];
    recommendations: string[];
  };
  detailedAnalysis: {
    participantAnalysis: ParticipantAnalysis[];
    temporalAnalysis: TemporalAnalysis;
    interactionPatterns: InteractionPattern[];
  };
}

export interface ParticipantAnalysis {
  participantId: string;
  role: 'parent' | 'child' | 'unknown';
  engagementLevel: number;
  emotionalState: number;
  activityLevel: number;
  behaviors: {
    positive: string[];
    concerning: string[];
    neutral: string[];
  };
}

export interface TemporalAnalysis {
  segments: {
    startTime: number;
    endTime: number;
    quality: number;
    primaryActivity: string;
    notes: string;
  }[];
  peakPeriods: {
    startTime: number;
    endTime: number;
    intensity: number;
    reason: string;
  }[];
  trends: {
    engagement: 'increasing' | 'decreasing' | 'stable';
    emotion: 'positive' | 'negative' | 'neutral';
    activity: 'active' | 'passive' | 'mixed';
  };
}

export interface InteractionPattern {
  patternType: 'cooperative' | 'competitive' | 'parallel' | 'guided' | 'independent';
  frequency: number;
  duration: number;
  quality: number;
  examples: string[];
}

export class PlayDataStorage {
  private readonly BASE_DIR = path.join(process.cwd(), 'src', 'lib', 'play-data');
  private readonly SESSIONS_DIR = path.join(this.BASE_DIR, 'sessions');
  private readonly CORES_DIR = path.join(this.BASE_DIR, 'cores');
  private readonly EVALUATIONS_DIR = path.join(this.BASE_DIR, 'evaluations');
  private readonly REPORTS_DIR = path.join(this.BASE_DIR, 'reports');
  private readonly INDEX_FILE = path.join(this.BASE_DIR, 'sessions-index.json');

  constructor() {
    this.initializeDirectories();
  }

  /**
   * 디렉토리 확인 및 생성
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      // 디렉토리가 이미 존재하는 경우 무시
    }
  }

  /**
   * 디렉토리 초기화
   */
  private async initializeDirectories(): Promise<void> {
    const dirs = [this.SESSIONS_DIR, this.CORES_DIR, this.EVALUATIONS_DIR, this.REPORTS_DIR];
    
    for (const dir of dirs) {
      await this.ensureDirectoryExists(dir);
    }
  }

  /**
   * 새로운 분석 세션 생성
   */
  async createSession(
    fileName: string,
    originalName: string,
    fileSize: number
  ): Promise<PlayAnalysisSession> {
    const sessionId = this.generateSessionId();
    const now = new Date().toISOString();

    const session: PlayAnalysisSession = {
      sessionId,
      metadata: {
        fileName,
        originalName,
        fileSize,
        uploadedAt: now,
        analyzedAt: now,
        lastUpdated: now,
        status: 'uploaded'
      },
      paths: {},
      analysis: {
        participantCount: 0,
        videoDuration: 0,
        safetyScore: 0
      },
      tags: []
    };

    await this.saveSession(session);
    return session;
  }

  /**
   * 핵심 정보 저장
   */
  async savePlayCore(
    sessionId: string, 
    coreData: PlayAnalysisCore
  ): Promise<void> {
    const filePath = path.join(this.CORES_DIR, `session_${sessionId}_core.json`);
    
    const data = {
      sessionId,
      extractedAt: new Date().toISOString(),
      coreData
    };

    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');

    // 세션 데이터 업데이트
    const session = await this.getSession(sessionId);
    if (session) {
      session.paths.corePath = filePath;
      session.metadata.status = 'core_extracted';
      session.metadata.lastUpdated = new Date().toISOString();
      await this.saveSession(session);
    }

    await this.updateIndex();
    console.log(`💾 Core data saved for session: ${sessionId}`);
  }

  /**
   * 평가 결과 저장
   */
  async saveEvaluation(
    sessionId: string,
    evaluation: PlayEvaluationResult
  ): Promise<void> {
    const filePath = path.join(this.EVALUATIONS_DIR, `session_${sessionId}_evaluation.json`);
    
    const data = {
      sessionId,
      savedAt: new Date().toISOString(),
      evaluation
    };

    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');

    // 세션 데이터 업데이트
    const session = await this.getSession(sessionId);
    if (session) {
      session.paths.evaluationPath = filePath;
      session.evaluation = evaluation;
      session.metadata.status = 'evaluation_completed';
      session.metadata.lastUpdated = new Date().toISOString();
      await this.saveSession(session);
    }

    await this.updateIndex();
    console.log(`📊 Evaluation saved for session: ${sessionId}`);
  }

  /**
   * 리포트 저장
   */
  async saveReport(sessionId: string, reportData: any): Promise<void> {
    const filePath = path.join(this.REPORTS_DIR, `session_${sessionId}_report.json`);
    
    const data = {
      sessionId,
      generatedAt: new Date().toISOString(),
      reportData
    };

    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');

    // 세션 데이터 업데이트
    const session = await this.getSession(sessionId);
    if (session) {
      session.paths.reportPath = filePath;
      session.metadata.status = 'report_generated';
      session.metadata.lastUpdated = new Date().toISOString();
      await this.saveSession(session);
    }

    await this.updateIndex();
    console.log(`📋 Report saved for session: ${sessionId}`);
  }

  /**
   * 세션 저장
   */
  async saveSession(session: PlayAnalysisSession): Promise<void> {
    const filePath = path.join(this.SESSIONS_DIR, `session_${session.sessionId}.json`);
    await fs.writeFile(filePath, JSON.stringify(session, null, 2), 'utf8');
    await this.updateIndex();
  }

  /**
   * 세션 조회
   */
  async getSession(sessionId: string): Promise<PlayAnalysisSession | null> {
    try {
      const filePath = path.join(this.SESSIONS_DIR, `session_${sessionId}.json`);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.log(`📁 Session not found: ${sessionId}`);
      return null;
    }
  }

  /**
   * 핵심 정보 조회
   */
  async getPlayCore(sessionId: string): Promise<PlayAnalysisCore | null> {
    try {
      const filePath = path.join(this.CORES_DIR, `session_${sessionId}_core.json`);
      const data = await fs.readFile(filePath, 'utf8');
      const result = JSON.parse(data);
      return result.coreData;
    } catch (error) {
      console.log(`📁 Core data not found for session: ${sessionId}`);
      return null;
    }
  }

  /**
   * 평가 결과 조회
   */
  async getEvaluation(sessionId: string): Promise<PlayEvaluationResult | null> {
    try {
      const filePath = path.join(this.EVALUATIONS_DIR, `session_${sessionId}_evaluation.json`);
      const data = await fs.readFile(filePath, 'utf8');
      const result = JSON.parse(data);
      return result.evaluation;
    } catch (error) {
      console.log(`📁 Evaluation not found for session: ${sessionId}`);
      return null;
    }
  }

  /**
   * 리포트 조회
   */
  async getReport(sessionId: string): Promise<any | null> {
    try {
      const filePath = path.join(this.REPORTS_DIR, `session_${sessionId}_report.json`);
      const data = await fs.readFile(filePath, 'utf8');
      const result = JSON.parse(data);
      return result.reportData;
    } catch (error) {
      console.log(`📁 Report not found for session: ${sessionId}`);
      return null;
    }
  }

  /**
   * 세션 목록 조회
   */
  async getSessionList(): Promise<PlayAnalysisSession[]> {
    try {
      const sessions: PlayAnalysisSession[] = [];
      const files = await fs.readdir(this.SESSIONS_DIR);
      
      for (const file of files) {
        if (file.endsWith('.json') && file.startsWith('session_')) {
          try {
            const filePath = path.join(this.SESSIONS_DIR, file);
            const data = await fs.readFile(filePath, 'utf8');
            const session = JSON.parse(data);
            sessions.push(session);
          } catch (error) {
            console.error(`Error reading session file ${file}:`, error);
          }
        }
      }

      return sessions.sort((a, b) => 
        new Date(b.metadata.lastUpdated).getTime() - new Date(a.metadata.lastUpdated).getTime()
      );
    } catch (error) {
      return [];
    }
  }

  /**
   * 세션 검색
   */
  async searchSessions(query: string): Promise<PlayAnalysisSession[]> {
    const sessions = await this.getSessionList();
    const lowerQuery = query.toLowerCase();

    return sessions.filter(session =>
      session.metadata.fileName.toLowerCase().includes(lowerQuery) ||
      session.metadata.originalName.toLowerCase().includes(lowerQuery) ||
      session.analysis.keyInsights?.some(insight => 
        insight.toLowerCase().includes(lowerQuery)
      ) ||
      session.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * 세션 태그 업데이트
   */
  async updateSessionTags(sessionId: string, tags: string[]): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      session.tags = tags;
      session.metadata.lastUpdated = new Date().toISOString();
      await this.saveSession(session);
    }
  }

  /**
   * 세션 삭제
   */
  async deleteSession(sessionId: string): Promise<void> {
    // 모든 관련 파일 삭제
    const filesToDelete = [
      path.join(this.SESSIONS_DIR, `session_${sessionId}.json`),
      path.join(this.CORES_DIR, `session_${sessionId}_core.json`),
      path.join(this.EVALUATIONS_DIR, `session_${sessionId}_evaluation.json`),
      path.join(this.REPORTS_DIR, `session_${sessionId}_report.json`)
    ];

    for (const filePath of filesToDelete) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        // 파일이 존재하지 않는 경우 무시
      }
    }

    await this.updateIndex();
    console.log(`🗑️ Session deleted: ${sessionId}`);
  }

  /**
   * 통합 분석 결과 저장
   */
  async saveIntegratedAnalysisData(sessionId: string, integratedAnalysis: any): Promise<void> {
    try {
      // GCP Firestore에 통합 분석 데이터 저장
      const gcpStorage = new (await import('@/lib/gcp-data-storage')).GCPDataStorage();
      
      const analysisData = {
        sessionId,
        integratedAnalysis,
        savedAt: new Date().toISOString()
      };

      // Firestore에 저장
      await gcpStorage.saveIntegratedAnalysisData(sessionId, analysisData);
      
      console.log(`🚀 Integrated analysis data saved to GCP for session: ${sessionId}`);
      
    } catch (error) {
      console.error(`❌ Error saving integrated analysis data for session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * 통합 분석 결과 조회
   */
  async getIntegratedAnalysisData(sessionId: string): Promise<any | null> {
    try {
      // GCP Firestore에서 통합 분석 데이터 조회
      const gcpStorage = new (await import('@/lib/gcp-data-storage')).GCPDataStorage();
      const result = await gcpStorage.getIntegratedAnalysisData(sessionId);
      return result;
    } catch (error) {
      console.log(`📁 No integrated analysis data found for session: ${sessionId}`);
      return null;
    }
  }

  /**
   * 종합 분석 상태 업데이트
   */
  async updateComprehensiveAnalysisStatus(
    sessionId: string, 
    status: 'in_progress' | 'completed' | 'error',
    currentStep?: string,
    progress?: number,
    steps?: any[],
    error?: string
  ): Promise<void> {
    const sessionData = await this.getSession(sessionId);
    if (!sessionData) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // 세션 인덱스 파일이 있는지 확인
    sessionData.comprehensiveAnalysis = sessionData.comprehensiveAnalysis || {};
    
    if (!sessionData.comprehensiveAnalysis.status) {
      sessionData.comprehensiveAnalysis.status = status;
    }
    if (!sessionData.comprehensiveAnalysis.progress) {
      sessionData.comprehensiveAnalysis.progress = progress || 0;
    }
    if (!sessionData.comprehensiveAnalysis.currentStep) {
      sessionData.comprehensiveAnalysis.currentStep = currentStep || 'unknown';
    }
    if (steps) sessionData.comprehensiveAnalysis.steps = steps;
    if (status === 'completed' || status === 'error') {
      sessionData.comprehensiveAnalysis.endTime = new Date().toISOString();
    }
    if (error && status === 'error') {
      sessionData.comprehensiveAnalysis.error = error;
    }

    sessionData.metadata.lastUpdated = new Date().toISOString();
    await this.saveSession(sessionData);
    
    console.log(`📊 Comprehensive analysis status updated: ${sessionId} - ${status} (${progress}%)`);
  }

  /**
   * 종합 분석 진행 상황 조회
   */
  async getComprehensiveAnalysisStatus(sessionId: string): Promise<any | null> {
    const sessionData = await this.getSession(sessionId);
    return sessionData?.comprehensiveAnalysis || null;
  }

  /**
   * 모든 세션의 종합 분석 현황 조회
   */
  async getAllComprehensiveAnalysisStatuses(): Promise<Array<{sessionId: string, status: any}>> {
    const sessions = await this.getSessionList();
    return sessions
      .filter(session => session.comprehensiveAnalysis)
      .map(session => ({
        sessionId: session.sessionId,
        status: session.comprehensiveAnalysis
      }));
  }

  /**
   * 실시간 진행 상황 추적을 위한 세션 조회
   */
  async getSessionWithProgress(sessionId: string): Promise<{
    session: PlayAnalysisSession | null,
    progress: {
      currentStep: string,
      totalProgress: number,
      steps: any[],
      status: string
    } | null
  }> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return { session: null, progress: null };
    }

    const progress = session.comprehensiveAnalysis ? {
      currentStep: session.comprehensiveAnalysis.currentStep,
      totalProgress: session.comprehensiveAnalysis.progress,
      steps: session.comprehensiveAnalysis.steps,
      status: session.comprehensiveAnalysis.status
    } : null;

    return { session, progress };
  }

  /**
   * 분석 결과 통계 조회
   */
  async getAnalysisStatistics(): Promise<{
    total: number,
    completed: number,
    inProgress: number,
    errors: number,
    averageScore: number,
    completionRate: number
  }> {
    const sessions = await this.getSessionList();
    
    const total = sessions.length;
    const completed = sessions.filter(s => s.comprehensiveAnalysis?.status === 'completed').length;
    const inProgress = sessions.filter(s => s.comprehensiveAnalysis?.status === 'in_progress').length;
    const errors = sessions.filter(s => s.comprehensiveAnalysis?.status === 'error').length;
    
    const completedSessions = sessions.filter(s => s.analysis.overallScore);
    const averageScore = completedSessions.length > 0 
      ? Math.round(completedSessions.reduce((sum, s) => sum + (s.analysis.overallScore || 0), 0) / completedSessions.length)
      : 0;
    
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      inProgress,
      errors,
      averageScore,
      completionRate
    };
  }

  /**
   * 세션 정리 (오래된 임시 파일 정리)
   */
  async cleanupOldSessions(olderThanDays: number = 30): Promise<number> {
    const sessions = await this.getSessionList();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    let cleanedCount = 0;
    
    for (const session of sessions) {
      const uploadDate = new Date(session.metadata.uploadedAt);
      if (uploadDate < cutoffDate && (
        session.comprehensiveAnalysis?.status === 'error' || 
        session.metadata.status === 'uploaded'
      )) {
        await this.deleteSession(session.sessionId);
        cleanedCount++;
      }
    }
    
    console.log(`🧹 Cleaned up ${cleanedCount} old sessions`);
    return cleanedCount;
  }

  /**
   * 세션 검색 (고급) 
   */
  async searchSessionsAdvanced(criteria: {
    status?: string,
    minScore?: number,
    maxScore?: number,
    dateFrom?: string,
    dateTo?: string,
    tags?: string[],
    hasVoiceAnalysis?: boolean,
    hasIntegratedAnalysis?: boolean
  }): Promise<PlayAnalysisSession[]> {
    const sessions = await this.getSessionList();
    
    return sessions.filter(session => {
      // 상태 필터
      if (criteria.status && session.comprehensiveAnalysis?.status !== criteria.status) {
        return false;
      }
      
      // 점수 필터
      if (criteria.minScore !== undefined && (session.analysis.overallScore || 0) < criteria.minScore) {
        return false;
      }
      if (criteria.maxScore !== undefined && (session.analysis.overallScore || 0) > criteria.maxScore) {
        return false;
      }
      
      // 날짜 필터
      if (criteria.dateFrom) {
        const sessionDate = new Date(session.metadata.uploadedAt);
        const fromDate = new Date(criteria.dateFrom);
        if (sessionDate < fromDate) return false;
      }
      if (criteria.dateTo) {
        const sessionDate = new Date(session.metadata.uploadedAt);
        const toDate = new Date(criteria.dateTo);
        if (sessionDate > toDate) return false;
      }
      
      // 태그 필터
      if (criteria.tags && criteria.tags.length > 0) {
        const hasMatchingTag = criteria.tags.some(tag => session.tags.includes(tag));
        if (!hasMatchingTag) return false;
      }
      
      // 음성 분석 여부
      if (criteria.hasVoiceAnalysis !== undefined) {
        const hasVoice = !!session.voiceAnalysis;
        if (hasVoice !== criteria.hasVoiceAnalysis) return false;
      }
      
      // 통합 분석 여부
      if (criteria.hasIntegratedAnalysis !== undefined) {
        const hasIntegrated = !!session.integratedAnalysis;
        if (hasIntegrated !== criteria.hasIntegratedAnalysis) return false;
      }
      
      return true;
    });
  }

  // 추가 메서드들 (기존 코드의 호환성을 위해)
  async saveSessionData(sessionId: string, sessionData: PlayAnalysisSession): Promise<void> {
    await this.saveSession(sessionData);
  }

  async getSessionData(sessionId: string): Promise<PlayAnalysisSession | null> {
    return await this.getSession(sessionId);
  }

  async saveVoiceAnalysisData(sessionId: string, voiceAnalysis: any): Promise<void> {
    try {
      // GCP Firestore에 음성 분석 데이터 저장
      const gcpStorage = new (await import('@/lib/gcp-data-storage')).GCPDataStorage();
      await gcpStorage.saveVoiceAnalysis(sessionId, voiceAnalysis);
      console.log(`🎤 Voice analysis data saved for session: ${sessionId}`);
    } catch (error) {
      console.error(`❌ Error saving voice analysis data for session ${sessionId}:`, error);
      throw error;
    }
  }

  async saveEvaluationData(sessionId: string, evaluation: any): Promise<void> {
    await this.saveEvaluation(sessionId, evaluation);
  }

  async saveReportData(sessionId: string, report: any): Promise<void> {
    await this.saveReport(sessionId, report);
  }

  async getAllSessions(): Promise<PlayAnalysisSession[]> {
    return await this.getSessionList();
  }

  /**
   * 인덱스 업데이트
   */
  private async updateIndex(): Promise<void> {
    try {
      const sessions = await this.getSessionList();
      const index = {
        lastUpdated: new Date().toISOString(),
        totalSessions: sessions.length,
        sessions: sessions.map(session => ({
          sessionId: session.sessionId,
          fileName: session.metadata.fileName,
          status: session.metadata.status,
          uploadedAt: session.metadata.uploadedAt,
          lastUpdated: session.metadata.lastUpdated
        }))
      };

      await fs.writeFile(this.INDEX_FILE, JSON.stringify(index, null, 2), 'utf8');
    } catch (error) {
      console.error('Failed to update index:', error);
    }
  }

  /**
   * 세션 ID 생성
   */
  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
} 