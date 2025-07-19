import { PlayAnalysisSession, PlayEvaluationResult, AnalysisReport, IntegratedAnalysisResult } from '../types';
import config from './config';
import { Logger } from './services/logger';

const logger = new Logger('PlayDataStorage');

/**
 * PlayDataStorage - 플레이 분석 데이터 저장 및 관리
 * 로컬 파일시스템과 메모리 기반 데이터 저장소
 */
export class PlayDataStorage {
  private sessions: Map<string, PlayAnalysisSession> = new Map();
  private evaluations: Map<string, PlayEvaluationResult> = new Map();
  private reports: Map<string, AnalysisReport> = new Map();
  private integratedAnalysis: Map<string, IntegratedAnalysisResult> = new Map();

  constructor() {
    logger.info('PlayDataStorage initialized');
  }

  // Session Management
  async saveSession(session: PlayAnalysisSession): Promise<void> {
    this.sessions.set(session.sessionId, session);
    logger.info(`💾 Session saved: ${session.sessionId}`);
  }

  async getSession(sessionId: string): Promise<PlayAnalysisSession | null> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      logger.info(`📁 Session not found: ${sessionId}`);
      return null;
    }
    return session;
  }

  async deleteSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
    this.evaluations.delete(sessionId);
    this.reports.delete(sessionId);
    this.integratedAnalysis.delete(sessionId);
    logger.info(`🗑️ Session deleted: ${sessionId}`);
  }

  // Evaluation Management
  async saveEvaluation(sessionId: string, evaluation: PlayEvaluationResult): Promise<void> {
    this.evaluations.set(sessionId, evaluation);
    logger.info(`📊 Evaluation saved for session: ${sessionId}`);
  }

  async getEvaluation(sessionId: string): Promise<PlayEvaluationResult | null> {
    const evaluation = this.evaluations.get(sessionId);
    if (!evaluation) {
      logger.info(`📁 Evaluation not found for session: ${sessionId}`);
      return null;
    }
    return evaluation;
  }

  // Report Management
  async saveReport(sessionId: string, report: AnalysisReport): Promise<void> {
    this.reports.set(sessionId, report);
    logger.info(`📋 Report saved for session: ${sessionId}`);
  }

  async getReport(sessionId: string): Promise<AnalysisReport | null> {
    const report = this.reports.get(sessionId);
    if (!report) {
      logger.info(`📁 Report not found for session: ${sessionId}`);
      return null;
    }
    return report;
  }

  // Integrated Analysis Management
  async saveIntegratedAnalysisData(sessionId: string, analysis: IntegratedAnalysisResult): Promise<void> {
    this.integratedAnalysis.set(sessionId, analysis);
    logger.info(`🚀 Integrated analysis data saved for session: ${sessionId}`);
  }

  async getIntegratedAnalysisData(sessionId: string): Promise<IntegratedAnalysisResult | null> {
    const analysis = this.integratedAnalysis.get(sessionId);
    if (!analysis) {
      logger.info(`📁 No integrated analysis data found for session: ${sessionId}`);
      return null;
    }
    return analysis;
  }

  // Utility Methods
  async getAllSessions(): Promise<PlayAnalysisSession[]> {
    return Array.from(this.sessions.values());
  }

  async getSessionCount(): Promise<number> {
    return this.sessions.size;
  }

  async clearAll(): Promise<void> {
    this.sessions.clear();
    this.evaluations.clear();
    this.reports.clear();
    this.integratedAnalysis.clear();
    logger.info('🧹 All data cleared');
  }
}

// Export singleton instance
export const playDataStorage = new PlayDataStorage();