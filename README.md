# 🎯 놀이 상호작용 분석 시스템

AI 기반 부모-자녀 놀이 영상 분석을 통해 상호작용 패턴을 파악하고 발달 지원 방안을 제공하는 시스템입니다.

## 📋 주요 기능

### 🔍 분석 모듈
- **물리적 상호작용**: 근접성, 움직임 동기화, 활동성 분석
- **언어적 상호작용**: 음성 전사, 대화 패턴, 발화 특성 분석
- **감정적 상호작용**: 얼굴 지향 행동, 참여도, 감정적 동기화
- **놀이 패턴**: 장난감 사용 패턴, 활동 전환, 협력 놀이 분석

### 📊 결과 대시보드
- **5개 탭 구성**: 물리적/감정적/언어적 상호작용, 놀이 패턴, 발달 지표
- **실시간 차트**: 근접성, 발화 빈도, 참여도 등 다양한 시각화
- **히트맵**: 활동성 시각화 및 패턴 분석
- **종합 평가**: 상호작용 질 점수 및 발달 지원 권장사항

### 🔄 페이지 플로우
```
홈 → 업로드 → 분석 → 결과 → 리포트 → 완료
```

## 🚀 빠른 시작

### 1. 설치 및 실행
```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 브라우저에서 접속
open http://localhost:3000
```

### 2. 개발 모드 (기본값)
- **특징**: Mock 데이터 사용, 빠른 테스트, 무료
- **용도**: 개발 및 데모 목적

### 3. 실제 데이터 모드
- **특징**: 실제 GCP 서비스 사용, 정확한 분석
- **용도**: 프로덕션 환경 및 실제 분석

## 🔧 환경 설정

### 기본 환경 변수 (.env.local)
```env
# 개발 모드 설정
DEVELOPMENT_MODE=true

# Google Cloud Platform 설정 (실제 모드용)
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_KEY_FILE=./path/to/service-account-key.json
GOOGLE_CLOUD_BUCKET_NAME=your-bucket-name

# Next.js 환경
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
```

### 실제 데이터 모드 설정

#### 1. GCP 서비스 활성화
```bash
# 필수 API 활성화
gcloud services enable firestore.googleapis.com
gcloud services enable videointelligence.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable texttospeech.googleapis.com
```

#### 2. 서비스 계정 생성
```bash
# 서비스 계정 생성
gcloud iam service-accounts create play-analysis-service \
    --display-name="Play Analysis Service"

# 권한 부여
gcloud projects add-iam-policy-binding your-project-id \
    --member="serviceAccount:play-analysis-service@your-project-id.iam.gserviceaccount.com" \
    --role="roles/firestore.user"

gcloud projects add-iam-policy-binding your-project-id \
    --member="serviceAccount:play-analysis-service@your-project-id.iam.gserviceaccount.com" \
    --role="roles/videointelligence.editor"

gcloud projects add-iam-policy-binding your-project-id \
    --member="serviceAccount:play-analysis-service@your-project-id.iam.gserviceaccount.com" \
    --role="roles/storage.objectAdmin"

# 키 파일 생성
gcloud iam service-accounts keys create ./service-account-key.json \
    --iam-account=play-analysis-service@your-project-id.iam.gserviceaccount.com
```

#### 3. Firestore 데이터베이스 생성
1. Firebase Console에서 프로젝트 선택
2. Firestore Database 생성
3. 서울(asia-northeast3) 지역 선택

#### 4. Cloud Storage 버킷 생성
```bash
# 버킷 생성
gsutil mb -l asia-northeast3 gs://your-bucket-name
```

#### 5. 환경 변수 설정
```env
# 실제 모드 활성화
DEVELOPMENT_MODE=false

# GCP 설정
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_KEY_FILE=./service-account-key.json
GOOGLE_CLOUD_BUCKET_NAME=your-bucket-name
```

## 🎮 사용 방법

### 개발 모드 사용
1. 기본 설정으로 서버 실행
2. 브라우저에서 http://localhost:3000 접속
3. 비디오 업로드 (Mock 데이터 사용)
4. 분석 결과 확인

### 실제 데이터 모드 전환
1. 상단 설정 버튼 클릭
2. GCP 서비스 상태 확인
3. "모드 전환" 버튼 클릭
4. 실제 비디오 분석 수행

## 📊 분석 결과

### 종합 점수
- **상호작용 질**: 부모-자녀 상호작용의 전반적 품질
- **발달 지원**: 발달 단계에 맞는 지원 수준
- **놀이 환경**: 놀이 환경의 최적화 정도

### 상세 분석
- **물리적 상호작용**: 근접성, 활동성, 움직임 동기화
- **언어적 상호작용**: 발화 패턴, 대화 주도성, 언어 발달
- **감정적 상호작용**: 얼굴 지향, 참여도, 감정적 동기화
- **놀이 패턴**: 장난감 사용, 활동 전환, 협력 놀이
- **발달 지표**: 주의집중, 신체발달, 사회성 발달

## 💰 비용 안내

### 개발 모드
- **비용**: 완전 무료
- **특징**: Mock 데이터 사용

### 실제 모드 (월 예상 비용)
- **Firestore**: $0-10 (사용량에 따라)
- **Video Intelligence**: $15-50 (분석 시간에 따라)
- **Cloud Storage**: $1-5 (저장 용량에 따라)
- **총 예상**: $16-65/월

## 🔒 보안 설정

### Firestore 보안 규칙
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 환경 변수 보안
- 서비스 계정 키 파일을 절대 공개하지 마세요
- `.env.local` 파일을 `.gitignore`에 추가하세요
- 프로덕션에서는 환경 변수를 안전하게 관리하세요

## 🛠️ 개발 가이드

### 프로젝트 구조
```
src/
├── app/                 # Next.js 앱 라우터
│   ├── page.tsx        # 홈 페이지
│   ├── upload/         # 업로드 페이지
│   ├── analysis/       # 분석 페이지
│   ├── results/        # 결과 페이지
│   ├── report/         # 리포트 페이지
│   └── complete/       # 완료 페이지
├── lib/                # 유틸리티 라이브러리
│   ├── video-analyzer.ts        # 비디오 분석 엔진
│   ├── gcp-data-storage.ts     # GCP 데이터 저장소
│   ├── mock-data-loader.ts     # Mock 데이터 로더
│   └── ...
└── components/         # React 컴포넌트
    ├── ui/            # 기본 UI 컴포넌트
    └── ...
```

### 새로운 분석 모듈 추가
1. `src/lib/` 디렉토리에 새 분석 모듈 생성
2. `VideoAnalyzer` 클래스에 분석 로직 추가
3. 결과 타입을 `src/types/index.ts`에 정의
4. 대시보드 컴포넌트에 시각화 추가

### 커스텀 차트 추가
1. `recharts` 라이브러리 사용
2. `src/app/results/page.tsx`에 차트 컴포넌트 추가
3. Mock 데이터와 실제 데이터 모두 지원

## 🧪 테스트

### 개발 모드 테스트
```bash
# 서버 실행
npm run dev

# 브라우저에서 전체 플로우 테스트
open http://localhost:3000
```

### 실제 모드 테스트
1. GCP 서비스 활성화
2. 환경 변수 설정
3. 모드 전환 후 실제 비디오 업로드
4. 분석 결과 확인

### ESLint 검사
```bash
# 코드 품질 검사
npm run lint

# 자동 수정
npm run lint -- --fix
```

## 📚 참고 자료

### 기술 스택
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Charts**: Recharts
- **Backend**: Next.js API Routes
- **Database**: Google Cloud Firestore
- **Storage**: Google Cloud Storage
- **AI**: Google Cloud Video Intelligence API

### 외부 문서
- [Google Cloud Video Intelligence API](https://cloud.google.com/video-intelligence/docs)
- [Firestore 문서](https://firebase.google.com/docs/firestore)
- [Next.js 문서](https://nextjs.org/docs)
- [Recharts 문서](https://recharts.org/en-US/)

## 🐛 문제 해결

### 자주 발생하는 오류

#### 1. Firestore 권한 오류
```
Error: 7 PERMISSION_DENIED: Cloud Firestore API has not been used
```
**해결책**: [GCP 설정 가이드](GCP_SETUP_GUIDE.md) 참조

#### 2. 비디오 업로드 실패
```
Error: 413 Request Entity Too Large
```
**해결책**: 비디오 크기를 100MB 이하로 줄이세요

#### 3. 분석 시간 초과
```
Error: Analysis timeout
```
**해결책**: 비디오 길이를 10분 이하로 줄이세요

### 로그 확인
```bash
# 개발 모드 로그
npm run dev

# 프로덕션 모드 로그
npm run build && npm start
```

## 🤝 기여하기

1. Fork 저장소
2. 새 브랜치 생성 (`git checkout -b feature/new-analysis`)
3. 변경사항 커밋 (`git commit -am 'Add new analysis module'`)
4. 브랜치 푸시 (`git push origin feature/new-analysis`)
5. Pull Request 생성

## 📄 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.

## 📞 지원

### 문의
- 기술적 문제: GitHub Issues 생성
- 일반 문의: 프로젝트 담당자 연락

### 업데이트
- 새로운 기능 추가 시 README 업데이트
- 브레이킹 체인지 시 마이그레이션 가이드 제공

---

**🎉 즐거운 놀이 상호작용 분석 되세요!** 