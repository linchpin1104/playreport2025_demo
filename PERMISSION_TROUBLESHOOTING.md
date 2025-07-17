# 🚨 Google Cloud 권한 문제 해결 가이드

## 현재 오류 상황
```
Error: 7 PERMISSION_DENIED: The caller does not have permission
```

## 🔍 문제 진단

### 1. API 활성화 상태 확인 (가장 중요!)

#### A. Video Intelligence API 활성화 확인
1. **Google Cloud Console 접속**: https://console.cloud.google.com
2. **프로젝트 선택**: `full-kids-tracker`
3. **API 및 서비스 → 라이브러리** 메뉴
4. **"Video Intelligence API" 검색**
5. **상태 확인**: "사용 설정됨" 또는 "관리" 버튼이 표시되어야 함

#### B. 필수 API 목록 (모두 활성화 필요)
```
✅ Cloud Video Intelligence API
✅ Cloud Resource Manager API  
✅ Cloud Storage API
✅ Cloud Storage JSON API
✅ Identity and Access Management (IAM) API
```

### 2. 올바른 역할 이름 (검색 안 될 때)

#### A. 정확한 역할 이름들
```
❌ "Cloud Video Intelligence API 사용자" (검색 안됨)
✅ "Video Intelligence API 사용자" (올바른 이름)

또는 영어로:
✅ "Video Intelligence API User"
✅ "Storage Object Viewer"
✅ "Storage Object Creator"
✅ "Service Account Token Creator"
```

#### B. 역할 ID로 검색
```
roles/videointelligence.user
roles/storage.objectViewer
roles/storage.objectCreator
roles/iam.serviceAccountTokenCreator
```

### 3. 간단한 해결방법 (권장)

#### A. 편집자 역할 부여 (테스트용)
가장 간단한 해결책:
1. **IAM 및 관리 → IAM** 메뉴
2. **서비스 계정 찾기**: `firebase-app-hosting-compute@full-kids-tracker.iam.gserviceaccount.com`
3. **수정(연필 아이콘) 클릭**
4. **"다른 역할 추가" 클릭**
5. **"편집자" 역할 추가** (`roles/editor`)

⚠️ **주의**: 편집자 역할은 매우 강력한 권한입니다. 테스트 후 필요한 권한만 남기는 것을 권장합니다.

#### B. 소유자 역할 부여 (최후 수단)
만약 편집자 역할로도 안 된다면:
1. **"소유자" 역할 추가** (`roles/owner`)

### 4. 서비스 계정 재생성 (필요시)

#### A. 새 서비스 계정 생성
1. **IAM 및 관리 → 서비스 계정** 메뉴
2. **"서비스 계정 만들기" 클릭**
3. **서비스 계정 이름**: `video-analysis-service`
4. **설명**: `Video Intelligence API용 서비스 계정`
5. **역할 선택**: `편집자` 또는 다음 역할들
   - Video Intelligence API User
   - Storage Admin
   - Service Account Token Creator

#### B. 새 키 생성
1. **생성된 서비스 계정 클릭**
2. **"키" 탭**
3. **"키 추가" → "새 키 만들기"**
4. **JSON 형식 선택**
5. **키 파일 다운로드**

### 5. 환경변수 업데이트

새 서비스 계정을 생성한 경우 `.env.local` 파일 업데이트:
```bash
GOOGLE_CLOUD_PROJECT_ID=full-kids-tracker
GOOGLE_CLOUD_KEY_FILE=./새-서비스-계정-키-파일.json
GOOGLE_CLOUD_BUCKET=full-kids.firebasestorage.app
```

### 6. 권한 적용 시간

- **API 활성화**: 즉시 적용
- **IAM 권한 변경**: 최대 5분
- **서비스 계정 키**: 즉시 적용

### 7. 테스트 방법

#### A. gcloud CLI 테스트 (선택사항)
```bash
# gcloud 설치 후
gcloud auth activate-service-account --key-file=./키파일.json
gcloud config set project full-kids-tracker

# API 활성화 확인
gcloud services list --enabled | grep videointelligence

# 권한 테스트
gcloud auth list
```

#### B. 웹 애플리케이션 테스트
1. 서버 재시작: `npm run dev`
2. 브라우저: `http://localhost:3000`
3. 영상 업로드 테스트

### 8. 최종 권한 설정 (운영용)

테스트 완료 후 최소 권한으로 변경:
```
✅ Video Intelligence API User (roles/videointelligence.user)
✅ Storage Object Viewer (roles/storage.objectViewer)
✅ Storage Object Creator (roles/storage.objectCreator)
```

---

## 🎯 즉시 해결 방법

### 단계 1: API 활성화 재확인
1. https://console.cloud.google.com/apis/library?project=full-kids-tracker
2. "Video Intelligence API" 검색 → 활성화

### 단계 2: 편집자 권한 부여 (임시)
1. https://console.cloud.google.com/iam-admin/iam?project=full-kids-tracker
2. `firebase-app-hosting-compute@full-kids-tracker.iam.gserviceaccount.com` 찾기
3. 수정 → "편집자" 역할 추가

### 단계 3: 서버 재시작
```bash
pkill -f "next dev"
npm run dev
```

### 단계 4: 테스트
브라우저에서 영상 업로드 테스트

---

**💡 편집자 역할로 테스트가 성공하면, 이후 필요한 권한만 남기고 편집자 역할을 제거하세요.** 