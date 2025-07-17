const https = require('https');

console.log('🔍 Google Cloud 권한 문제 빠른 진단\n');

// 1. 환경변수 확인
console.log('1️⃣ 환경변수 확인:');
require('dotenv').config({ path: '.env.local' });

const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
const keyFile = process.env.GOOGLE_CLOUD_KEY_FILE;

console.log(`   ✅ 프로젝트 ID: ${projectId}`);
console.log(`   ✅ 키 파일: ${keyFile}`);

// 2. 서비스 계정 정보 확인
console.log('\n2️⃣ 서비스 계정 정보:');
try {
  const fs = require('fs');
  const keyData = JSON.parse(fs.readFileSync(keyFile, 'utf8'));
  console.log(`   ✅ 서비스 계정: ${keyData.client_email}`);
  console.log(`   ✅ 프로젝트: ${keyData.project_id}`);
} catch (error) {
  console.log(`   ❌ 키 파일 오류: ${error.message}`);
}

// 3. 문제점 진단
console.log('\n3️⃣ 가능한 문제점:');
console.log('   🔍 Video Intelligence API가 활성화되지 않음');
console.log('   🔍 올바른 역할 이름이 아님');
console.log('   🔍 서비스 계정에 충분한 권한 없음');

// 4. 해결 방법 안내
console.log('\n4️⃣ 즉시 해결 방법:');
console.log('   💡 방법 1: 편집자 역할 부여 (가장 간단)');
console.log('   💡 방법 2: 올바른 역할 이름으로 검색');
console.log('   💡 방법 3: API 활성화 재확인');

console.log('\n🎯 Google Cloud Console 직접 링크:');
console.log(`   📋 API 활성화: https://console.cloud.google.com/apis/library?project=${projectId}`);
console.log(`   👤 IAM 권한: https://console.cloud.google.com/iam-admin/iam?project=${projectId}`);

console.log('\n🔧 올바른 역할 이름들:');
console.log('   ✅ "편집자" (Editor) - 가장 간단한 해결책');
console.log('   ✅ "Video Intelligence API User" (정확한 이름)');
console.log('   ✅ "Storage Admin" (스토리지 전체 권한)');

console.log('\n⚠️  중요: "Cloud Video Intelligence API 사용자"가 아니라');
console.log('         "Video Intelligence API User" 또는 "편집자"를 검색하세요!');

console.log('\n🚀 다음 단계:');
console.log('   1. Google Cloud Console 접속');
console.log('   2. Video Intelligence API 활성화 확인');
console.log('   3. 서비스 계정에 "편집자" 역할 추가');
console.log('   4. 5분 대기 후 서버 재시작');
console.log('   5. 영상 업로드 테스트'); 