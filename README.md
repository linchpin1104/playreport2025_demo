# 놀이영상 분석 서비스 (Play Report)

부모와 아이의 놀이상호작용을 분석하여 전문적인 레포트를 제공하는 AI 기반 서비스입니다.

## 🎯 주요 기능

### 1. 영상 분석 기능
- **Cloud Video Intelligence API** 활용한 1차 분석
- 객체 추적 (Object Tracking)
- 음성 전사 및 화자 분리 (Speech Transcription)
- 얼굴 감지 (Face Detection)
- 인물 감지 (Person Detection)
- 장면 전환 감지 (Shot Change Detection)

### 2. AI 분석 레포트 생성
- **OpenAI GPT-4** 활용한 2차 분석
- 상호작용 품질 평가
- 의사소통 패턴 분석
- 감정 상태 파악
- 놀이 패턴 식별
- 발달 지표 평가
- 개인화된 추천사항 제공

### 3. 시각화 대시보드
- 상호작용 지표 차트
- 발달 영역별 점수 시각화
- 감정 상태 타임라인
- 놀이 패턴 분석 그래프

## 🏗️ 기술 스택

### Frontend
- **Next.js 14** (App Router)
- **React 18** (TypeScript)
- **Tailwind CSS** (스타일링)
- **shadcn/ui** (UI 컴포넌트)
- **Recharts** (데이터 시각화)
- **React Query** (상태 관리)

### Backend
- **Next.js API Routes** (서버리스 API)
- **Google Cloud Video Intelligence API** (영상 분석)
- **OpenAI API** (AI 분석)
- **Firebase Storage** (파일 저장)
- **Firebase Admin SDK** (서버사이드 작업)

### DevOps & Tools
- **TypeScript** (타입 안전성)
- **ESLint** (코드 품질)
- **Vercel** (배포)

## 📋 사전 요구사항

### 1. API 키 설정
다음 서비스들의 API 키가 필요합니다:

- **Google Cloud Platform**
  - Video Intelligence API 활성화
  - 서비스 계정 키 파일 생성
  - Cloud Storage 버킷 생성

- **OpenAI**
  - GPT-4 API 액세스
  - API 키 발급

- **Firebase**
  - Firebase 프로젝트 생성
  - Storage 설정
  - Admin SDK 키 설정

### 2. 시스템 요구사항
- Node.js 18.0.0 이상
- npm 9.0.0 이상

## 🚀 설치 및 실행

### 1. 프로젝트 클론
```bash
git clone <repository-url>
cd play_report
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```env
# Google Cloud Video Intelligence API
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_KEY_FILE=path/to/service-account-key.json
GOOGLE_CLOUD_BUCKET=your-bucket-name

# OpenAI API
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase Admin
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MAX_FILE_SIZE=100MB
NEXT_PUBLIC_ALLOWED_FILE_TYPES=mp4,mov,avi,mkv,webm
```

### 4. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 `http://localhost:3000`에 접속하여 애플리케이션을 확인하세요.

## 📁 프로젝트 구조

```
play_report/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API 라우트
│   │   │   ├── upload/        # 파일 업로드
│   │   │   ├── analyze/       # 영상 분석
│   │   │   └── report/        # AI 레포트 생성
│   │   ├── globals.css        # 전역 스타일
│   │   └── page.tsx           # 메인 페이지
│   ├── components/            # React 컴포넌트
│   │   ├── ui/               # 기본 UI 컴포넌트
│   │   ├── charts/           # 차트 컴포넌트
│   │   └── video-upload.tsx  # 영상 업로드 컴포넌트
│   ├── lib/                   # 유틸리티 함수
│   │   ├── config.ts         # 설정 관리
│   │   └── utils.ts          # 공통 유틸리티
│   └── types/                 # TypeScript 타입 정의
│       └── index.ts          # 타입 정의
├── public/                    # 정적 파일
├── BACKEND_RULES.md          # 백엔드 개발 규칙
├── FRONTEND_RULES.md         # 프론트엔드 개발 규칙
└── README.md                 # 프로젝트 문서
```

## 🔄 워크플로우

### 1. 영상 업로드
- 사용자가 놀이 영상을 드래그 앤 드롭 또는 선택하여 업로드
- 파일 검증 (형식, 크기 제한)
- Firebase Storage에 업로드

### 2. 영상 분석
- Cloud Video Intelligence API를 통한 1차 분석
- 객체 추적, 음성 전사, 얼굴/인물 감지 등
- 구조화된 데이터로 변환

### 3. AI 레포트 생성
- OpenAI GPT-4를 통한 2차 분석
- 전문적인 놀이상호작용 레포트 생성
- 발달 지표 평가 및 추천사항 제공

### 4. 결과 시각화
- 차트 및 그래프로 분석 결과 표시
- 발달 영역별 점수 시각화
- 상호작용 패턴 분석

## 🔧 주요 API 엔드포인트

### `/api/upload`
- **POST**: 영상 파일 업로드
- Firebase Storage에 파일 저장
- 파일 URL 반환

### `/api/analyze`
- **POST**: 영상 분석 요청
- Cloud Video Intelligence API 호출
- 분석 결과 반환

### `/api/report`
- **POST**: AI 레포트 생성
- OpenAI API를 통한 종합 분석
- 시각화 데이터 포함

## 📊 분석 결과 예시

### 상호작용 지표
- 전체 상호작용 품질: 85/100
- 부모 참여도: 90/100
- 아이 참여도: 80/100

### 발달 영역별 점수
- 언어 발달: 85/100
- 사회성 발달: 90/100
- 인지 발달: 80/100
- 운동 발달: 75/100
- 정서 발달: 88/100

### 추천사항
- 아이의 자발적 발화를 더 많이 유도하세요
- 놀이 중 아이의 관심을 따라가는 시간을 늘려보세요
- 긍정적인 피드백을 더 자주 제공하세요

## 🚨 문제 해결

### 일반적인 문제들

1. **API 키 관련 에러**
   - 환경 변수가 올바르게 설정되었는지 확인
   - Google Cloud 서비스 계정 권한 확인

2. **파일 업로드 실패**
   - 파일 크기 제한 확인 (100MB)
   - 지원되는 파일 형식 확인 (mp4, mov, avi, mkv, webm)

3. **분석 시간 초과**
   - 영상 길이 단축 (권장: 10분 이하)
   - 네트워크 연결 상태 확인

## 🤝 기여 방법

1. Fork 프로젝트
2. Feature 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add amazing feature'`)
4. 브랜치에 Push (`git push origin feature/amazing-feature`)
5. Pull Request 생성

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 지원

문제나 질문이 있으시면 [이슈](https://github.com/your-repo/issues)를 통해 문의해주세요.

---

**놀이영상 분석 서비스**는 AI 기술을 활용하여 부모와 아이의 소중한 놀이 시간을 더욱 의미 있게 만들어주는 서비스입니다. 🎈 