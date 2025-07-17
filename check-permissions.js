const fs = require('fs');
const path = require('path');

console.log('🔍 Google Cloud 권한 및 설정 확인 스크립트\n');

// 1. 환경변수 확인
console.log('1️⃣ 환경변수 확인:');
require('dotenv').config({ path: '.env.local' });

const requiredEnvVars = [
  'GOOGLE_CLOUD_PROJECT_ID',
  'GOOGLE_CLOUD_KEY_FILE',
  'GOOGLE_CLOUD_BUCKET'
];

requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    console.log(`   ✅ ${envVar}: ${value}`);
  } else {
    console.log(`   ❌ ${envVar}: 설정되지 않음`);
  }
});

// 2. 서비스 계정 키 파일 확인
console.log('\n2️⃣ 서비스 계정 키 파일 확인:');
const keyFile = process.env.GOOGLE_CLOUD_KEY_FILE;
if (keyFile && fs.existsSync(keyFile)) {
  console.log(`   ✅ 키 파일 존재: ${keyFile}`);
  
  try {
    const keyData = JSON.parse(fs.readFileSync(keyFile, 'utf8'));
    console.log(`   ✅ 프로젝트 ID: ${keyData.project_id}`);
    console.log(`   ✅ 클라이언트 이메일: ${keyData.client_email}`);
    console.log(`   ✅ 키 타입: ${keyData.type}`);
  } catch (error) {
    console.log(`   ❌ 키 파일 읽기 오류: ${error.message}`);
  }
} else {
  console.log(`   ❌ 키 파일 없음: ${keyFile}`);
}

// 3. 필요한 API 확인 안내
console.log('\n3️⃣ 필요한 API 활성화 확인:');
console.log('   Google Cloud Console에서 다음 API들이 활성화되어 있는지 확인하세요:');
console.log('   📋 Video Intelligence API');
console.log('   📋 Cloud Storage API');
console.log('   📋 Cloud Storage JSON API');
console.log('   📋 Identity and Access Management (IAM) API');

// 4. 권한 확인 안내
console.log('\n4️⃣ 서비스 계정 권한 확인:');
console.log('   IAM 및 관리 → IAM에서 다음 역할들이 있는지 확인하세요:');
console.log('   👤 Cloud Video Intelligence API 사용자');
console.log('   👤 스토리지 객체 뷰어');
console.log('   👤 스토리지 객체 생성자');
console.log('   👤 서비스 계정 토큰 생성자');

// 5. 테스트 URL 안내
console.log('\n5️⃣ 테스트 안내:');
console.log('   🌐 서버 실행: npm run dev');
console.log('   🌐 브라우저: http://localhost:3000');
console.log('   🎬 영상 업로드 테스트');

console.log('\n🎯 권한 설정 완료 후 서버를 재시작하세요!');
console.log('💡 권한 변경 후 적용까지 최대 5분 소요될 수 있습니다.'); 