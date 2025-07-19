# 🚀 실제 적용을 위한 완전한 설정 체크리스트

## 📋 **설정 완료 상태 확인**

### ✅ **이미 완료된 사항들**
- [x] 모든 필수 패키지 설치 완료
- [x] Mock/Real 모드 전환 기능 구현
- [x] VideoAnalyzer 모듈 구현
- [x] GCP API 통합 코드 완료
- [x] Firebase Storage 규칙 설정

### ❌ **누락된 필수 설정들**

---

## 🔧 **1. 환경 변수 파일 생성 (필수)**

### 1.1 `.env.local` 파일 생성

프로젝트 루트에 `.env.local` 파일을 생성하고 아래 내용을 복사:

```bash
# ===========================================
# 놀이 상호작용 분석 시스템 환경 변수
# ===========================================

# ====================================
# 개발 모드 설정
# ====================================
# true: Mock 데이터 사용 (개발/테스트용)
# false: 실제 GCP API 사용 (프로덕션용)
DEVELOPMENT_MODE=true

# ====================================
# Google Cloud Platform 설정
# ====================================
# GCP 프로젝트 ID (필수)
GOOGLE_CLOUD_PROJECT_ID=your-project-id

# GCP 서비스 계정 키 파일 경로 (필수)
GOOGLE_APPLICATION_CREDENTIALS=./gcp-service-account-key.json

# ====================================
# Firebase 설정
# ====================================
# Firebase 프로젝트 설정 (Firebase Console에서 복사)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase Admin 설정 (서버 측 Firebase 사용)
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key-here\n-----END PRIVATE KEY-----"
FIREBASE_ADMIN_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com

# ====================================
# Cloud Storage 설정
# ====================================
# 비디오 파일 저장용 버킷 이름 (필수)
GCP_STORAGE_BUCKET=your-video-bucket-name

# ====================================
# OpenAI API 설정 (선택사항)
# ====================================
# GPT를 활용한 고급 분석 기능용 (선택사항)
OPENAI_API_KEY=your-openai-api-key

# ====================================
# 시스템 설정
# ====================================
# 업로드 파일 크기 제한 (MB)
MAX_FILE_SIZE=100

# 세션 타임아웃 (분)
SESSION_TIMEOUT=60

# ====================================
# 로그 설정
# ====================================
# 로그 레벨 (debug, info, warn, error)
LOG_LEVEL=info

# 개발 모드에서 상세 로그 출력
VERBOSE_LOGGING=true
```

---

## 🔐 **2. GCP 서비스 계정 키 파일 생성 (필수)**

### 2.1 GCP 콘솔에서 서비스 계정 생성
1. [GCP Console](https://console.cloud.google.com/)에 로그인
2. **IAM 및 관리자** → **서비스 계정**
3. **서비스 계정 만들기** 클릭
4. 이름: `play-analysis-service`
5. 설명: `Play interaction analysis service account`

### 2.2 필요한 권한 부여
다음 역할들을 서비스 계정에 부여:
- **Cloud Video Intelligence API 사용자**
- **Cloud Storage 관리자**  
- **Cloud Firestore 사용자**
- **Cloud Text-to-Speech 사용자**

### 2.3 키 파일 다운로드
1. 생성된 서비스 계정 클릭
2. **키** 탭 → **키 추가** → **새 키 만들기**
3. **JSON** 형식 선택
4. 다운로드된 파일을 `gcp-service-account-key.json`로 이름 변경
5. 프로젝트 루트에 저장

---

## 🔥 **3. Firebase 프로젝트 설정 (필수)**

### 3.1 Firebase 프로젝트 생성 또는 연결
1. [Firebase Console](https://console.firebase.google.com/)에 로그인
2. **프로젝트 추가** 또는 기존 GCP 프로젝트 가져오기
3. **Authentication**, **Firestore**, **Storage** 활성화

### 3.2 Firebase 설정 정보 확인
1. **프로젝트 설정** (⚙️ 아이콘)
2. **일반** 탭에서 **Firebase SDK 스니펫** 확인
3. **구성** 선택하여 설정 값들 복사

### 3.3 Firebase Storage 규칙 적용
Firebase Console → **Storage** → **규칙** 탭에서:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

---

## 🌐 **4. GCP API 활성화 (필수)**

### 4.1 필수 API 활성화
다음 명령어들을 실행하여 필요한 API들을 활성화:

```bash
# Cloud Video Intelligence API
gcloud services enable videointelligence.googleapis.com

# Cloud Firestore API  
gcloud services enable firestore.googleapis.com

# Cloud Storage API
gcloud services enable storage.googleapis.com

# Cloud Text-to-Speech API
gcloud services enable texttospeech.googleapis.com
```

### 4.2 또는 GCP Console에서 직접 활성화
1. [GCP Console](https://console.cloud.google.com/)
2. **API 및 서비스** → **라이브러리**
3. 각 API를 검색하여 **사용 설정** 클릭

---

## 💾 **5. Cloud Storage 버킷 생성 (필수)**

### 5.1 비디오 저장용 버킷 생성
```bash
# 버킷 생성 (버킷 이름은 전역적으로 고유해야 함)
gsutil mb gs://your-video-bucket-name

# 버킷 권한 설정
gsutil iam ch serviceAccount:your-service-account@your-project.iam.gserviceaccount.com:objectAdmin gs://your-video-bucket-name
```

### 5.2 환경 변수 업데이트
`.env.local` 파일에서 `GCP_STORAGE_BUCKET` 값을 실제 버킷 이름으로 변경

---

## 📊 **6. 비용 및 한도 설정 (권장)**

### 6.1 예상 비용
- **Video Intelligence API**: $0.10/분 (처음 1000분 무료)
- **Cloud Storage**: $0.020/GB/월
- **Firestore**: 읽기/쓰기 작업당 $0.06/100k
- **Text-to-Speech**: $4.00/1M 문자

### 6.2 비용 제한 설정
1. GCP Console → **결제** → **예산 및 알림**
2. 월 예산 설정 (권장: $50-100)
3. 알림 임계값 설정 (80%, 90%, 100%)

---

## 🧪 **7. 테스트 및 검증**

### 7.1 Mock 모드 테스트
```bash
# 개발 서버 실행
npm run dev

# 브라우저에서 http://localhost:3000 접속
# 비디오 업로드 및 분석 테스트
```

### 7.2 Real 모드 전환 테스트
1. `.env.local`에서 `DEVELOPMENT_MODE=false`로 변경
2. 서버 재시작
3. 실제 비디오 분석 테스트

---

## 🔍 **8. 문제 해결**

### 8.1 일반적인 오류들
- **PERMISSION_DENIED**: API 활성화 또는 서비스 계정 권한 확인
- **INVALID_ARGUMENT**: 환경 변수 설정 확인
- **RESOURCE_EXHAUSTED**: 할당량 초과 - 결제 계정 확인

### 8.2 개발 모드 토글 확인
시스템 상단의 개발 모드 토글을 통해 실시간 상태 확인 가능

---

## ⚡ **9. 보안 고려사항**

### 9.1 필수 보안 설정
- `.env.local` 파일을 Git에 커밋하지 않기
- 서비스 계정 키 파일 보안 관리
- Firebase 규칙 적절히 설정
- 프로덕션에서는 도메인 제한 설정

### 9.2 권장 보안 조치
- 정기적인 서비스 계정 키 교체
- 최소 권한 원칙 적용
- 모니터링 및 로깅 활성화

---

## 🎯 **10. 최종 확인 체크리스트**

- [ ] `.env.local` 파일 생성 및 설정
- [ ] GCP 서비스 계정 키 파일 설정
- [ ] Firebase 프로젝트 설정 완료
- [ ] 필수 GCP API 활성화
- [ ] Cloud Storage 버킷 생성
- [ ] 비용 한도 설정
- [ ] Mock 모드 테스트 완료
- [ ] Real 모드 전환 테스트 완료
- [ ] 보안 설정 적용

---

## 📞 **도움이 필요한 경우**

### 빠른 시작 가이드
1. 위의 체크리스트를 순서대로 진행
2. 각 단계에서 오류 발생 시 **GCP_SETUP_GUIDE.md** 참조
3. 개발 모드 토글을 통해 실시간 상태 확인

### 추가 문서들
- `GCP_SETUP_GUIDE.md`: 상세한 GCP 설정 가이드
- `README.md`: 전체 시스템 개요
- `BACKEND_RULES.md`: 백엔드 개발 규칙
- `FRONTEND_RULES.md`: 프론트엔드 개발 규칙 