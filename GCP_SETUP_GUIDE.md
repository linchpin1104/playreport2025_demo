# 🚀 GCP 서비스 활성화 가이드

실제 데이터 분석을 위해 필요한 Google Cloud Platform 서비스들을 활성화하는 방법을 안내합니다.

## 📋 필수 서비스 목록

### 1. Cloud Firestore API
- **목적**: 분석 결과 및 세션 데이터 저장
- **현재 상태**: ❌ 비활성화됨
- **활성화 URL**: https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=full-kids-tracker

### 2. Cloud Video Intelligence API
- **목적**: 비디오 분석 (객체 추적, 얼굴 감지, 음성 전사)
- **활성화 URL**: https://console.developers.google.com/apis/api/videointelligence.googleapis.com/overview?project=full-kids-tracker

### 3. Cloud Storage API
- **목적**: 비디오 파일 저장
- **활성화 URL**: https://console.developers.google.com/apis/api/storage.googleapis.com/overview?project=full-kids-tracker

### 4. Cloud Text-to-Speech API
- **목적**: TTS 기능 (향후 구현 예정)
- **활성화 URL**: https://console.developers.google.com/apis/api/texttospeech.googleapis.com/overview?project=full-kids-tracker

## 🔧 단계별 활성화 방법

### 1단계: Google Cloud Console 접속
1. https://console.cloud.google.com/ 에 접속
2. 프로젝트 선택: `full-kids-tracker`

### 2단계: API 활성화
각 서비스별로 다음 단계를 수행:

1. **Firestore API 활성화**
   ```bash
   # 브라우저에서 접속
   https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=full-kids-tracker
   
   # 또는 gcloud CLI 사용
   gcloud services enable firestore.googleapis.com --project=full-kids-tracker
   ```

2. **Video Intelligence API 활성화**
   ```bash
   # 브라우저에서 접속
   https://console.developers.google.com/apis/api/videointelligence.googleapis.com/overview?project=full-kids-tracker
   
   # 또는 gcloud CLI 사용
   gcloud services enable videointelligence.googleapis.com --project=full-kids-tracker
   ```

3. **Cloud Storage API 활성화**
   ```bash
   # 브라우저에서 접속
   https://console.developers.google.com/apis/api/storage.googleapis.com/overview?project=full-kids-tracker
   
   # 또는 gcloud CLI 사용
   gcloud services enable storage.googleapis.com --project=full-kids-tracker
   ```

### 3단계: Firestore 데이터베이스 설정
1. https://console.firebase.google.com/ 에서 `full-kids-tracker` 프로젝트 선택
2. Firestore Database 생성:
   - **모드**: 프로덕션 모드
   - **위치**: asia-northeast3 (서울)
   - **보안 규칙**: 초기에는 테스트 모드로 시작

### 4단계: Cloud Storage 버킷 생성
1. Google Cloud Console에서 Cloud Storage 섹션 이동
2. 버킷 생성:
   - **이름**: `full-kids-tracker-videos`
   - **위치**: asia-northeast3 (서울)
   - **스토리지 클래스**: Standard

## 🔐 서비스 계정 및 인증 설정

### 1. 서비스 계정 생성
```bash
# 서비스 계정 생성
gcloud iam service-accounts create play-analysis-service \
    --display-name="Play Analysis Service" \
    --project=full-kids-tracker

# 필요한 역할 부여
gcloud projects add-iam-policy-binding full-kids-tracker \
    --member="serviceAccount:play-analysis-service@full-kids-tracker.iam.gserviceaccount.com" \
    --role="roles/firestore.user"

gcloud projects add-iam-policy-binding full-kids-tracker \
    --member="serviceAccount:play-analysis-service@full-kids-tracker.iam.gserviceaccount.com" \
    --role="roles/videointelligence.editor"

gcloud projects add-iam-policy-binding full-kids-tracker \
    --member="serviceAccount:play-analysis-service@full-kids-tracker.iam.gserviceaccount.com" \
    --role="roles/storage.objectAdmin"
```

### 2. 서비스 계정 키 생성
```bash
# 키 파일 생성
gcloud iam service-accounts keys create ./service-account-key.json \
    --iam-account=play-analysis-service@full-kids-tracker.iam.gserviceaccount.com
```

### 3. 환경 변수 설정
`.env.local` 파일에 다음 내용 추가:
```env
# GCP 설정
GOOGLE_CLOUD_PROJECT_ID=full-kids-tracker
GOOGLE_CLOUD_KEY_FILE=./service-account-key.json
GOOGLE_CLOUD_BUCKET_NAME=full-kids-tracker-videos

# 개발 모드 설정 (실제 분석 사용 시 false로 변경)
DEVELOPMENT_MODE=false
```

## 🧪 활성화 확인 방법

### 1. API 상태 확인
```bash
# 활성화된 서비스 확인
gcloud services list --enabled --project=full-kids-tracker

# 특정 서비스 상태 확인
gcloud services describe firestore.googleapis.com --project=full-kids-tracker
```

### 2. 테스트 요청
서버 실행 후 다음 URL에서 개발 모드 상태 확인:
```
http://localhost:3000/api/dev-status
```

## 💰 비용 예상

### 예상 월 비용 (소규모 사용 기준)
- **Firestore**: 읽기/쓰기 요청에 따라 $0-10
- **Video Intelligence**: 비디오 분석 시간에 따라 $15-50
- **Cloud Storage**: 저장된 데이터 양에 따라 $1-5
- **총 예상 비용**: $16-65/월

### 비용 최적화 팁
1. 불필요한 분석 기능 비활성화
2. 분석 완료 후 임시 파일 삭제
3. Cloud Storage 수명주기 정책 설정
4. 예산 알림 설정

## 🚨 주의사항

### 1. API 할당량 제한
- Video Intelligence API: 시간당 600분 분석 제한
- Firestore: 읽기/쓰기 요청 제한 있음

### 2. 보안 설정
- 서비스 계정 키 파일을 안전하게 보관
- Firestore 보안 규칙 설정
- 불필요한 권한 제거

### 3. 지역 설정
- 모든 서비스를 같은 지역(asia-northeast3)에 설정하여 지연 시간 최소화

## 🔄 개발 → 프로덕션 전환

### 1. 환경 변수 변경
```env
# .env.local 파일 수정
DEVELOPMENT_MODE=false
```

### 2. 서버 재시작
```bash
npm run dev
```

### 3. 실제 분석 테스트
1. 비디오 파일 업로드
2. 실제 API 호출 확인
3. 분석 결과 검증

## 📞 지원 및 문의

API 활성화 중 문제가 발생하면:
1. Google Cloud Console의 로그 확인
2. 서비스 계정 권한 재확인
3. 프로젝트 결제 상태 확인

---

**💡 팁**: 처음에는 소량의 테스트 데이터로 시작하여 비용을 확인한 후 본격적인 사용을 시작하세요! 