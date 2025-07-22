#!/usr/bin/env node

/**
 * 🧹 테스트 데이터 정리 스크립트
 * 
 * 사용법:
 * node cleanup-script.js --check                    # 현황만 조회
 * node cleanup-script.js --dry-run                  # 삭제 예정 목록 확인
 * node cleanup-script.js --delete-all              # 모든 데이터 삭제
 * node cleanup-script.js --keep-hours 48           # 48시간 이전 데이터만 삭제
 * node cleanup-script.js --orphans                 # 고아 파일도 함께 정리
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function main() {
  const args = process.argv.slice(2);
  
  // 명령어 파싱
  const isCheck = args.includes('--check');
  const isDryRun = args.includes('--dry-run');
  const deleteAll = args.includes('--delete-all');
  const includeOrphans = args.includes('--orphans');
  
  const keepHoursIndex = args.indexOf('--keep-hours');
  const keepHours = keepHoursIndex !== -1 && args[keepHoursIndex + 1] 
    ? parseInt(args[keepHoursIndex + 1]) 
    : 24;

  console.log('🧹 테스트 데이터 정리 도구');
  console.log('================================');

  try {
    if (isCheck) {
      // 현황 조회
      console.log('📊 현재 데이터 현황 조회 중...');
      const response = await fetch(`${BASE_URL}/api/cleanup-test-data`, {
        method: 'GET'
      });
      
      const result = await response.json();
      if (result.success) {
        console.log('\n📈 데이터 현황:');
        console.log('================');
        Object.entries(result.stats).forEach(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            console.log(`${key}:`);
            Object.entries(value).forEach(([subKey, subValue]) => {
              console.log(`  - ${subKey}: ${subValue}`);
            });
          } else {
            console.log(`${key}: ${value}`);
          }
        });
      } else {
        console.error('❌ 현황 조회 실패:', result.error);
      }
      return;
    }

    // 정리 작업
    console.log(`🗑️ 설정:`);
    console.log(`   - 전체 삭제: ${deleteAll}`);
    console.log(`   - 보존 시간: 최근 ${keepHours}시간`);
    console.log(`   - 고아 파일 정리: ${includeOrphans}`);
    console.log(`   - 드라이런: ${isDryRun}`);

    const cleanupData = {
      confirmDelete: 'YES_DELETE_TEST_DATA',
      deleteAll,
      keepRecentHours: keepHours,
      dryRun: isDryRun,
      cleanupOrphanedFiles: includeOrphans
    };

    console.log('\n🚀 정리 작업 시작...');
    const response = await fetch(`${BASE_URL}/api/cleanup-test-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cleanupData)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('\n✅ 정리 완료:');
      console.log('===============');
      console.log(`메시지: ${result.message}`);
      
      if (result.deletedSessionCount !== undefined) {
        console.log(`삭제된 세션: ${result.deletedSessionCount}개`);
      }
      
      if (result.deletedOrphanCount !== undefined) {
        console.log(`삭제된 고아 파일: ${result.deletedOrphanCount}개`);
      }
      
      if (result.remainingSessionCount !== undefined) {
        console.log(`남은 세션: ${result.remainingSessionCount}개`);
      }

      if (result.previewList && result.previewList.length > 0) {
        console.log('\n📋 삭제 예정 목록:');
        result.previewList.forEach((item, index) => {
          console.log(`${index + 1}. ${item.originalName} (${item.fileSize}) - ${item.uploadedAt}`);
        });
        
        if (result.orphanedFilesCount > 0) {
          console.log(`\n🗂️ 고아 파일: ${result.orphanedFilesCount}개`);
          if (result.orphanedFiles) {
            result.orphanedFiles.slice(0, 10).forEach((file, index) => {
              console.log(`${index + 1}. ${file}`);
            });
            if (result.orphanedFiles.length > 10) {
              console.log(`... 및 ${result.orphanedFiles.length - 10}개 추가`);
            }
          }
        }

        console.log('\n💡 실제 삭제하려면 --dry-run 없이 다시 실행하세요.');
      }

      if (result.errors && result.errors.length > 0) {
        console.log('\n⚠️ 오류 발생:');
        result.errors.forEach(error => console.log(`   - ${error}`));
      }
    } else {
      console.error('❌ 정리 실패:', result.error);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ 스크립트 실행 오류:', error.message);
    process.exit(1);
  }
}

// 도움말 표시
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🧹 테스트 데이터 정리 스크립트

사용법:
  node cleanup-script.js [옵션]

옵션:
  --check                 현재 데이터 현황만 조회
  --dry-run              삭제 예정 목록만 확인 (실제 삭제 안함)  
  --delete-all           모든 테스트 데이터 삭제
  --keep-hours N         N시간 이전 데이터만 삭제 (기본: 24)
  --orphans              고아 파일(연결되지 않은 파일)도 함께 정리
  --help, -h             이 도움말 표시

예제:
  node cleanup-script.js --check
  node cleanup-script.js --dry-run --keep-hours 48
  node cleanup-script.js --delete-all --orphans
  node cleanup-script.js --keep-hours 72
`);
  process.exit(0);
}

// 메인 함수 실행
main().catch(console.error); 