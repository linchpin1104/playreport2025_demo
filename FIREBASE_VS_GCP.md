# 🔥 Firebase vs Google Cloud Platform 차이점 및 설정 가이드

## 📊 **현재 시스템 아키텍처**

우리 시스템은 **Firebase**와 **Google Cloud Platform**을 모두 사용하는 하이브리드 아키텍처입니다:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   클라이언트     │    │   Next.js API   │    │   Google Cloud   │
│   (브라우저)     │    │   (서버 측)     │    │   Platform       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
    Firebase SDK           Firebase Admin         GCP Client SDK
         │                       │                       │
         ├─ 파일 업로드           ├─ 서버 인증            ├─ Video Intelligence
         ├─ 인증 (선택사항)      ├─ Firestore 접근       ├─ Cloud Storage
         └─ 실시간 업데이트      └─ 스토리지 관리        └─ Text-to-Speech
```

---

## 🔍 **Firebase vs GCP 비교**

### **Firebase (클라이언트 측)**
- **목적**: 웹/모바일 앱 개발 플랫폼
- **특징**: 간단한 SDK, 실시간 기능
- **사용 범위**: 클라이언트 측 기능

### **Google Cloud Platform (서버 측)**
- **목적**: 클라우드 컴퓨팅 플랫폼
- **특징**: 강력한 API, 머신러닝 서비스
- **사용 범위**: 서버 측 고급 기능

---

## 🏗️ **현재 시스템에서의 역할 분담**

### **Firebase 사용 부분**
1. **클라이언트 파일 업로드** (브라우저 → Firebase Storage)
2. **실시간 업데이트** (선택사항)
3. **사용자 인증** (선택사항)

### **GCP 사용 부분**
1. **Video Intelligence API** (영상 분석)
2. **Cloud Firestore** (데이터 저장)
3. **Cloud Storage** (파일 관리)
4. **Text-to-Speech** (음성 변환)

---

## 🔧 **실제 설정 방법**

### **1. 단일 프로젝트 접근법 (권장)**

#### 1.1 GCP 프로젝트 생성
```bash
# GCP 프로젝트 생성
gcloud projects create your-project-id

# 프로젝트 선택
gcloud config set project your-project-id
```

#### 1.2 Firebase 추가 (같은 프로젝트에)
1. [Firebase Console](https://console.firebase.google.com/)
2. **프로젝트 추가** → **기존 Google Cloud 프로젝트 선택**
3. 위에서 생성한 프로젝트 선택

### **2. 필수 API 활성화**
```bash
# Firebase/GCP 공통 필수 API들
gcloud services enable firestore.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable videointelligence.googleapis.com
gcloud services enable texttospeech.googleapis.com
```

### **3. 서비스 계정 생성 (GCP + Firebase Admin 공용)**
```bash
# 서비스 계정 생성
gcloud iam service-accounts create play-analysis-service \
  --display-name="Play Analysis Service"

# 필요한 권한 부여
gcloud projects add-iam-policy-binding your-project-id \
  --member="serviceAccount:play-analysis-service@your-project-id.iam.gserviceaccount.com" \
  --role="roles/firestore.user"

gcloud projects add-iam-policy-binding your-project-id \
  --member="serviceAccount:play-analysis-service@your-project-id.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding your-project-id \
  --member="serviceAccount:play-analysis-service@your-project-id.iam.gserviceaccount.com" \
  --role="roles/videointelligence.admin"

# 키 파일 생성
gcloud iam service-accounts keys create gcp-service-account-key.json \
  --iam-account=play-analysis-service@your-project-id.iam.gserviceaccount.com
```

---

## 📝 **환경 변수 설정 완전 가이드**

### **`.env.local` 파일 생성**
```bash
# ===========================================
# 통합 Firebase/GCP 설정
# ===========================================

# 프로젝트 ID (Firebase와 GCP 공통)
GOOGLE_CLOUD_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
FIREBASE_ADMIN_PROJECT_ID=your-project-id

# GCP 서비스 계정 키
GOOGLE_APPLICATION_CREDENTIALS=./gcp-service-account-key.json

# Firebase 클라이언트 설정 (Firebase Console > 프로젝트 설정 > 일반)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# Firebase Admin 설정 (서비스 계정 키 파일에서 추출)
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
FIREBASE_ADMIN_CLIENT_EMAIL=play-analysis-service@your-project-id.iam.gserviceaccount.com

# Cloud Storage 버킷
GCP_STORAGE_BUCKET=your-project-id.appspot.com

# 기타 설정
DEVELOPMENT_MODE=true
```

---

## 🔄 **설정 값 확인 방법**

### **Firebase 설정 값 확인**
1. [Firebase Console](https://console.firebase.google.com/)
2. 프로젝트 선택 → ⚙️ **프로젝트 설정**
3. **일반** 탭 → **내 앱** 섹션 → **Firebase SDK 스니펫**
4. **구성** 선택하여 값들 복사

### **GCP 서비스 계정 정보 확인**
1. [GCP Console](https://console.cloud.google.com/)
2. **IAM 및 관리자** → **서비스 계정**
3. 생성한 서비스 계정 클릭
4. **키** 탭에서 JSON 키 파일 다운로드

---

## 🚨 **일반적인 설정 실수들**

### **1. 프로젝트 ID 불일치**
```bash
# ❌ 잘못된 예
GOOGLE_CLOUD_PROJECT_ID=gcp-project-123
NEXT_PUBLIC_FIREBASE_PROJECT_ID=firebase-project-456

# ✅ 올바른 예 (동일한 프로젝트 사용)
GOOGLE_CLOUD_PROJECT_ID=your-unified-project
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-unified-project
```

### **2. 서비스 계정 권한 부족**
```bash
# 모든 필요한 역할 확인
gcloud projects get-iam-policy your-project-id \
  --flatten="bindings[].members" \
  --format="table(bindings.role)" \
  --filter="bindings.members:play-analysis-service@your-project-id.iam.gserviceaccount.com"
```

### **3. API 미활성화**
```bash
# 활성화된 API 확인
gcloud services list --enabled
```

---

## 💰 **비용 구조**

### **Firebase 비용**
- **Firestore**: 읽기/쓰기 당 $0.06/100k
- **Storage**: $0.026/GB/월
- **Functions**: $0.40/백만 호출

### **GCP 비용**
- **Video Intelligence**: $0.10/분
- **Cloud Storage**: $0.020/GB/월
- **Text-to-Speech**: $16/백만 문자

### **예상 월 비용 (중소규모 사용)**
- **Firebase**: $5-15/월
- **GCP APIs**: $10-30/월
- **총 예상**: $15-45/월

---

## 🎯 **빠른 설정 체크리스트**

### **Phase 1: 프로젝트 설정**
- [ ] GCP 프로젝트 생성
- [ ] Firebase 프로젝트 연결 (같은 프로젝트)
- [ ] 필수 API 활성화
- [ ] 서비스 계정 생성 및 권한 부여

### **Phase 2: 환경 변수 설정**
- [ ] `.env.local` 파일 생성
- [ ] Firebase 설정 값 입력
- [ ] GCP 서비스 계정 키 파일 설정
- [ ] 모든 환경 변수 값 확인

### **Phase 3: 테스트**
- [ ] Mock 모드 테스트
- [ ] 개발 모드 토글 상태 확인
- [ ] Real 모드 전환 테스트

---

## 🔧 **문제 해결 팁**

### **자주 발생하는 오류들**
1. **"Project not found"** → 프로젝트 ID 확인
2. **"Permission denied"** → 서비스 계정 권한 확인
3. **"API not enabled"** → 필수 API 활성화 확인
4. **"Invalid credentials"** → 서비스 계정 키 파일 경로 확인

### **디버깅 도구**
```bash
# 현재 GCP 설정 확인
gcloud config list

# 서비스 계정 권한 확인  
gcloud projects get-iam-policy your-project-id

# Firebase 프로젝트 확인
firebase projects:list
```

---

## 📚 **추가 리소스**

- [Firebase 공식 문서](https://firebase.google.com/docs)
- [GCP 공식 문서](https://cloud.google.com/docs)
- [Firebase vs GCP 비교 가이드](https://firebase.google.com/docs/projects/learn-more#firebase-cloud-relationship)
- [GCP 가격 계산기](https://cloud.google.com/products/calculator) 