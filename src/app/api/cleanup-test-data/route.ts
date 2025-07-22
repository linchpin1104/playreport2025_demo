import { NextRequest, NextResponse } from 'next/server';
import { GCPDataStorage } from '@/lib/gcp-data-storage';
import { Storage } from '@google-cloud/storage';
import { configManager } from '@/lib/services/config-manager';

/**
 * 🧹 테스트 데이터 정리 API
 * Firestore와 Cloud Storage에서 테스트 세션 데이터들을 안전하게 삭제
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      confirmDelete, 
      deleteAll = false, 
      keepRecentHours = 24,
      dryRun = true,
      cleanupOrphanedFiles = false  // 고아 파일 정리 옵션 추가
    } = body;

    // 보안 확인
    if (!confirmDelete || confirmDelete !== 'YES_DELETE_TEST_DATA') {
      return NextResponse.json({
        success: false,
        error: 'confirmDelete 필드에 "YES_DELETE_TEST_DATA"를 입력해주세요.'
      }, { status: 400 });
    }

    console.log('🧹 테스트 데이터 정리 시작...');
    console.log(`   - 전체 삭제: ${deleteAll}`);
    console.log(`   - 최근 ${keepRecentHours}시간 데이터 보존`);
    console.log(`   - 드라이런 모드: ${dryRun}`);
    console.log(`   - 고아 파일 정리: ${cleanupOrphanedFiles}`);

    const gcpStorage = new GCPDataStorage();
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - keepRecentHours);

    // 1. 모든 세션 조회
    console.log('📊 세션 목록 조회 중...');
    const allSessions = await gcpStorage.getAllSessions();
    console.log(`   - 전체 세션 수: ${allSessions.length}`);

    // 2. 삭제 대상 필터링
    const sessionsToDelete = allSessions.filter(session => {
      if (deleteAll) return true;
      
      const uploadedAt = new Date(session.metadata.uploadedAt);
      return uploadedAt < cutoffTime;
    });

    console.log(`   - 삭제 대상 세션 수: ${sessionsToDelete.length}`);

    // 3. 고아 파일 검사 (cleanupOrphanedFiles가 true인 경우)
    let orphanedFiles: string[] = [];
    if (cleanupOrphanedFiles) {
      console.log('🔍 고아 파일 검사 중...');
      orphanedFiles = await findOrphanedFiles(allSessions);
      console.log(`   - 고아 파일 수: ${orphanedFiles.length}`);
    }

    // 4. 드라이런 모드인 경우 삭제 예정 목록만 반환
    if (dryRun) {
      const previewList = sessionsToDelete.map(session => ({
        sessionId: session.sessionId,
        originalName: session.metadata.originalName,
        uploadedAt: session.metadata.uploadedAt,
        status: session.metadata.status,
        fileSize: Math.round(session.metadata.fileSize / 1024 / 1024 * 100) / 100 + 'MB'
      }));

      return NextResponse.json({
        success: true,
        message: `${sessionsToDelete.length}개의 세션이 삭제 예정입니다. (dryRun=false로 실제 삭제 가능)`,
        previewList,
        orphanedFilesCount: orphanedFiles.length,
        orphanedFiles: orphanedFiles.slice(0, 20), // 처음 20개만 미리보기
        totalCount: allSessions.length
      });
    }

    if (sessionsToDelete.length === 0 && orphanedFiles.length === 0) {
      return NextResponse.json({
        success: true,
        message: '삭제할 테스트 데이터가 없습니다.',
        deletedCount: 0,
        totalCount: allSessions.length
      });
    }

    // 5. 실제 삭제 실행
    console.log('🗑️ 실제 삭제 시작...');
    let deletedSessionCount = 0;
    let deletedOrphanCount = 0;
    const errors: string[] = [];

    // 세션 삭제
    for (const session of sessionsToDelete) {
      try {
        await gcpStorage.deleteSession(session.sessionId);
        deletedSessionCount++;
        console.log(`   ✅ 세션 삭제: ${session.sessionId} (${session.metadata.originalName})`);
      } catch (error) {
        const errorMsg = `세션 삭제 실패 ${session.sessionId}: ${error instanceof Error ? error.message : String(error)}`;
        errors.push(errorMsg);
        console.error(`   ❌ ${errorMsg}`);
      }
    }

    // 고아 파일 삭제
    if (orphanedFiles.length > 0) {
      console.log('🗑️ 고아 파일 삭제 중...');
      for (const filePath of orphanedFiles) {
        try {
          await deleteFromCloudStorage(filePath);
          deletedOrphanCount++;
          console.log(`   ✅ 고아 파일 삭제: ${filePath}`);
        } catch (error) {
          const errorMsg = `고아 파일 삭제 실패 ${filePath}: ${error instanceof Error ? error.message : String(error)}`;
          errors.push(errorMsg);
          console.error(`   ❌ ${errorMsg}`);
        }
      }
    }

    // 6. 결과 반환
    const response = {
      success: true,
      message: `${deletedSessionCount}개 세션, ${deletedOrphanCount}개 고아 파일 삭제 완료`,
      deletedSessionCount,
      deletedOrphanCount,
      totalChecked: sessionsToDelete.length,
      remainingSessionCount: allSessions.length - deletedSessionCount,
      errors: errors.length > 0 ? errors : undefined
    };

    console.log('✅ 테스트 데이터 정리 완료:', response);
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ 테스트 데이터 정리 실패:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

/**
 * 🔍 고아 파일 검색 (Firestore에 연결되지 않은 Cloud Storage 파일들)
 */
async function findOrphanedFiles(activeSessions: any[]): Promise<string[]> {
  try {
    // Cloud Storage 인스턴스 초기화 
    const projectId = configManager.get('gcp.projectId');
    const bucketName = configManager.get('gcp.bucketName');
    const serviceAccountJson = process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    
    let storage: Storage;
    if (serviceAccountJson) {
      const credentials = JSON.parse(serviceAccountJson);
      storage = new Storage({ projectId, credentials });
    } else {
      storage = new Storage({ projectId });
    }

    // 활성 세션의 파일 경로들 수집
    const activeFilePaths = new Set<string>();
    activeSessions.forEach(session => {
      if (session.paths.rawDataPath) {
        const gsPath = session.paths.rawDataPath;
        if (gsPath.startsWith('gs://')) {
          const filePath = gsPath.split('/').slice(3).join('/');
          activeFilePaths.add(filePath);
        }
      }
      
      // 예상되는 JSON 백업 파일들도 추가
      activeFilePaths.add(`sessions/${session.sessionId}.json`);
      activeFilePaths.add(`cores/${session.sessionId}_core.json`);
      activeFilePaths.add(`evaluations/${session.sessionId}_evaluation.json`);
    });

    // Cloud Storage의 모든 파일 목록 조회
    const [files] = await storage.bucket(bucketName).getFiles({
      prefix: 'videos/', // videos 폴더만 검사
    });

    // 고아 파일 찾기
    const orphanedFiles: string[] = [];
    for (const file of files) {
      if (!activeFilePaths.has(file.name)) {
        orphanedFiles.push(file.name);
      }
    }

    return orphanedFiles;
  } catch (error) {
    console.error('❌ 고아 파일 검색 실패:', error);
    return [];
  }
}

/**
 * Cloud Storage에서 파일 삭제
 */
async function deleteFromCloudStorage(filePath: string): Promise<void> {
  const projectId = configManager.get('gcp.projectId');
  const bucketName = configManager.get('gcp.bucketName');
  const serviceAccountJson = process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  
  let storage: Storage;
  if (serviceAccountJson) {
    const credentials = JSON.parse(serviceAccountJson);
    storage = new Storage({ projectId, credentials });
  } else {
    storage = new Storage({ projectId });
  }

  const file = storage.bucket(bucketName).file(filePath);
  await file.delete();
}

/**
 * 🔍 현재 저장된 데이터 현황 조회
 */
export async function GET() {
  try {
    const gcpStorage = new GCPDataStorage();
    
    // 모든 세션 조회
    const allSessions = await gcpStorage.getAllSessions();
    
    // 상태별 분류
    const statusCounts = allSessions.reduce((acc: any, session) => {
      const status = session.metadata.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    // 최근 데이터 현황
    const now = new Date();
    const last24h = allSessions.filter(s => 
      new Date(s.metadata.uploadedAt) > new Date(now.getTime() - 24 * 60 * 60 * 1000)
    ).length;
    const last7days = allSessions.filter(s => 
      new Date(s.metadata.uploadedAt) > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    ).length;

    // 파일 크기 통계
    const totalSize = allSessions.reduce((sum, s) => sum + (s.metadata.fileSize || 0), 0);
    const avgSize = allSessions.length > 0 ? totalSize / allSessions.length : 0;

    // Cloud Storage 사용량 조회 시도
    let storageStats: any = null;
    try {
      const orphanedFiles = await findOrphanedFiles(allSessions);
      storageStats = {
        고아파일수: orphanedFiles.length,
        고아파일예시: orphanedFiles.slice(0, 5)
      };
    } catch (error) {
      console.warn('Cloud Storage 통계 조회 실패:', error);
    }

    const stats = {
      총세션수: allSessions.length,
      상태별통계: statusCounts,
      최근24시간: last24h,
      최근7일: last7days,
      총파일크기: Math.round(totalSize / 1024 / 1024 * 100) / 100 + 'MB',
      평균파일크기: Math.round(avgSize / 1024 / 1024 * 100) / 100 + 'MB',
      최신세션: allSessions.length > 0 ? {
        sessionId: allSessions[0].sessionId,
        originalName: allSessions[0].metadata.originalName,
        uploadedAt: allSessions[0].metadata.uploadedAt,
        status: allSessions[0].metadata.status
      } : null,
      클라우드스토리지: storageStats
    };

    return NextResponse.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('❌ 데이터 현황 조회 실패:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    }, { status: 500 });
  }
} 