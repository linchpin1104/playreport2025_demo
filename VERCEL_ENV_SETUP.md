# 🚀 Vercel 프로덕션 환경변수 설정 가이드

## 📋 필수 환경변수 목록

### **1️⃣ Google Cloud Platform 설정**

```bash
# GCP 프로젝트 설정
GOOGLE_CLOUD_PROJECT_ID=your-gcp-project-id
GOOGLE_CLOUD_BUCKET=your-storage-bucket
GOOGLE_CLOUD_LOCATION=us-central1

# GCP 서비스 계정 키 (JSON 형태, 개행은 \n으로 처리)
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"..."}

# 또는 개별 설정
FIREBASE_ADMIN_PROJECT_ID=your-firebase-project-id
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----"
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

### **2️⃣ OpenAI API 설정**

```bash
OPENAI_API_KEY=sk-proj-your-openai-api-key
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=4000
```

### **3️⃣ 시스템 설정**

```bash
# 운영 모드 설정
DEVELOPMENT_MODE=false
NODE_ENV=production

# 파일 업로드 설정
MAX_FILE_SIZE=500
NEXT_PUBLIC_MAX_FILE_SIZE=500MB
NEXT_PUBLIC_ALLOWED_FILE_TYPES=mp4,mov,avi,mkv,webm

# 앱 URL
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## 🔧 Vercel 대시보드에서 환경변수 설정

### **방법 1: Vercel 웹 대시보드**

1. **Vercel 대시보드** 접속 → 프로젝트 선택
2. **Settings** → **Environment Variables** 탭 이동
3. 각 환경변수를 **Production**, **Preview**, **Development** 환경별로 설정

### **방법 2: Vercel CLI (선택사항)**

```bash
# Vercel CLI 설치
npm install -g vercel

# 로그인
vercel login

# 환경변수 설정 (대화형)
vercel env add GOOGLE_CLOUD_PROJECT_ID production
vercel env add OPENAI_API_KEY production
vercel env add DEVELOPMENT_MODE production
```

## 🚨 중요한 주의사항

### **1. 서비스 계정 키 처리**

**❌ 잘못된 방법:**
```bash
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
```

**✅ 올바른 방법:**
```bash
# 전체 JSON을 환경변수로 설정
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}

# 또는 개별 필드로 분리
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

### **2. 개행 문자 처리**

Private Key에서 개행 문자는 `\n`으로 변환:

```bash
# 원본
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQD...
-----END PRIVATE KEY-----

# 환경변수용 변환
"-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQD...\n-----END PRIVATE KEY-----"
```

### **3. 필수 환경변수 우선순위**

**높은 우선순위 (필수):**
- `GOOGLE_CLOUD_PROJECT_ID`
- `FIREBASE_ADMIN_PRIVATE_KEY`
- `FIREBASE_ADMIN_CLIENT_EMAIL` 
- `OPENAI_API_KEY`
- `DEVELOPMENT_MODE=false`

**중간 우선순위:**
- `GOOGLE_CLOUD_BUCKET`
- `NEXT_PUBLIC_APP_URL`

**낮은 우선순위 (기본값 사용 가능):**
- `OPENAI_MODEL`
- `MAX_FILE_SIZE`

## 🔍 환경변수 테스트

### **로컬에서 프로덕션 모드 테스트:**

```bash
# .env.local에 프로덕션 값 설정 후 테스트
DEVELOPMENT_MODE=false npm run build
DEVELOPMENT_MODE=false npm start
```

### **Vercel 배포 후 테스트:**

1. **업로드 테스트**: `/upload` 페이지에서 실제 파일 업로드
2. **분석 테스트**: 업로드 후 분석 진행 확인
3. **로그 확인**: Vercel 대시보드 → Functions 탭에서 로그 확인

## 🛠️ 문제 해결

### **GCP 오류 해결:**

```bash
# 환경변수 누락 시 로그에서 확인
[ERROR] GCP 세션 생성 오류: Configuration error
[INFO] 🔧 프로덕션 환경에서 GCP 오류 → 개발 모드로 폴백

# 해결책: 필수 GCP 환경변수 설정 확인
```

### **OpenAI API 오류 해결:**

```bash
# API 키 오류 시
[ERROR] OpenAI API error: 401 Unauthorized

# 해결책: OPENAI_API_KEY 확인 및 재설정
```

## 📈 성능 최적화

### **권장 설정:**

```bash
# 함수 실행 시간 최적화
VERCEL_MAX_DURATION=300

# 메모리 최적화
VERCEL_MEMORY=3008

# 리전 설정
VERCEL_REGION=iad1
```

---

**🎯 환경변수 설정 완료 후 `vercel --prod` 로 배포하면 대용량 업로드가 완벽하게 작동합니다!** 