# 환경 설정 가이드

이 문서는 놀이영상 분석 서비스의 환경 설정을 위한 상세한 가이드입니다.

## 1. Google Cloud Platform 설정

### 1.1 프로젝트 생성
1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. 프로젝트 ID 기록 (환경 변수에 사용)

### 1.2 API 활성화
다음 API들을 활성화하세요:
- Cloud Video Intelligence API
- Cloud Storage API

```bash
# gcloud CLI 사용시
gcloud services enable videointelligence.googleapis.com
gcloud services enable storage.googleapis.com
```

### 1.3 서비스 계정 생성
1. IAM 및 관리자 > 서비스 계정 메뉴 이동
2. 새 서비스 계정 생성
3. 다음 역할 부여:
   - Video Intelligence API 사용자
   - Storage 객체 관리자
   - Storage 객체 뷰어

### 1.4 서비스 계정 키 생성
1. 생성한 서비스 계정 클릭
2. 키 탭 > 키 추가 > JSON 키 생성
3. 다운로드된 JSON 파일을 프로젝트 루트에 저장
4. 파일 경로를 `GOOGLE_CLOUD_KEY_FILE` 환경 변수에 설정

### 1.5 Cloud Storage 버킷 생성
```bash
gsutil mb gs://your-bucket-name
```

## 2. OpenAI API 설정

### 2.1 OpenAI 계정 생성
1. [OpenAI Platform](https://platform.openai.com/)에 가입
2. 사용량 제한 및 결제 정보 설정

### 2.2 API 키 생성
1. API Keys 메뉴 이동
2. Create new secret key 클릭
3. 생성된 키를 `OPENAI_API_KEY` 환경 변수에 설정

### 2.3 모델 액세스 확인
- GPT-4 모델 액세스 권한 확인
- 사용량 제한 설정 (비용 관리)

## 3. Firebase 설정

### 3.1 Firebase 프로젝트 생성
1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 Google Cloud 프로젝트 연결

### 3.2 웹 앱 추가
1. 프로젝트 설정 > 일반 탭
2. 웹 앱 추가 (`</>` 아이콘 클릭)
3. 앱 등록 후 구성 정보 복사

### 3.3 Firebase Storage 설정
1. Storage 메뉴 이동
2. 시작하기 클릭
3. 보안 규칙 설정:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /videos/{fileName} {
      allow read, write: if request.auth != null || true; // 개발용 (운영환경에서는 인증 필요)
    }
  }
}
```

### 3.4 Firebase Admin SDK 설정
1. 프로젝트 설정 > 서비스 계정 탭
2. 새 비공개 키 생성 (Firebase Admin SDK)
3. 다운로드된 JSON 파일의 정보를 환경 변수에 설정

## 4. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Google Cloud Video Intelligence API
GOOGLE_CLOUD_PROJECT_ID=your-gcp-project-id
GOOGLE_CLOUD_KEY_FILE=./path/to/service-account-key.json
GOOGLE_CLOUD_BUCKET=your-storage-bucket-name
GOOGLE_CLOUD_LOCATION=us-central1

# OpenAI API
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=4000

# Firebase Configuration (프론트엔드용)
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase Admin SDK (서버사이드용)
FIREBASE_ADMIN_PROJECT_ID=your-firebase-project-id
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MAX_FILE_SIZE=100MB
NEXT_PUBLIC_ALLOWED_FILE_TYPES=mp4,mov,avi,mkv,webm
MAX_VIDEO_DURATION=600
MIN_VIDEO_DURATION=30
SPEECH_LANGUAGE_CODE=ko-KR

# API Configuration
API_TIMEOUT=30000
LOG_LEVEL=info
ENABLE_CONSOLE_LOG=true
```

## 5. 개발 환경 검증

### 5.1 의존성 설치
```bash
npm install
```

### 5.2 환경 변수 검증
```bash
npm run dev
```

### 5.3 API 엔드포인트 테스트
브라우저에서 다음 URL들을 테스트하세요:
- `http://localhost:3000/api/upload` (GET 요청시 405 에러 응답 정상)
- `http://localhost:3000/api/analyze` (GET 요청시 405 에러 응답 정상)
- `http://localhost:3000/api/report` (GET 요청시 405 에러 응답 정상)

## 6. 보안 고려사항

### 6.1 API 키 보안
- 환경 변수 파일(`.env.local`)은 절대 버전 관리에 포함하지 마세요
- 프로덕션 환경에서는 환경 변수를 서버 설정으로 관리하세요

### 6.2 Firebase 보안 규칙
- 운영 환경에서는 인증된 사용자만 파일 업로드 허용
- 파일 크기 및 형식 제한 설정

### 6.3 API 사용량 제한
- OpenAI API 사용량 모니터링
- Google Cloud 할당량 및 결제 알림 설정

## 7. 문제 해결

### 7.1 일반적인 오류들

**Google Cloud 인증 오류**
```
Error: Could not load the default credentials
```
해결: 서비스 계정 키 파일 경로 확인

**OpenAI API 키 오류**
```
Error: Invalid API key
```
해결: API 키 형식 확인 (`sk-`로 시작해야 함)

**Firebase 초기화 오류**
```
Error: Firebase project not found
```
해결: Firebase 프로젝트 ID 확인

### 7.2 디버깅 팁
- 환경 변수 로딩 확인: `console.log(process.env.YOUR_VAR)`
- API 응답 로그 확인: 개발자 도구 Network 탭
- 서버 로그 확인: 터미널 출력

## 8. 배포 설정

### 8.1 Vercel 배포
1. Vercel 계정 생성
2. 프로젝트 연결
3. 환경 변수 설정 (Dashboard > Settings > Environment Variables)

### 8.2 환경 변수 배포 시 주의사항
- `NEXT_PUBLIC_` 접두사가 있는 변수만 클라이언트에 노출
- 민감한 정보는 서버 전용 환경 변수로 설정
- 프로덕션 환경에서는 적절한 도메인 설정

이 가이드를 따라 설정하면 놀이영상 분석 서비스를 성공적으로 실행할 수 있습니다! 