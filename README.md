# 🎯 놀이 상호작용 분석 시스템

AI 기반 부모-자녀 놀이 영상 분석을 통해 상호작용 패턴을 파악하고 발달 지원 방안을 제공하는 시스템입니다.

## 📋 주요 기능

### 🔍 핵심 분석
- **Google Cloud Video Intelligence**: 객체 추적, 얼굴 감지, 음성 전사
- **통합 분석 엔진**: 비디오 및 음성 데이터 통합 분석
- **실시간 대시보드**: 분석 결과 시각화

### 🔄 워크플로우
```
영상 업로드 → 세션 생성 → 비디오 분석 → 결과 저장 → 대시보드 표시
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

### 2. 환경 설정 (.env.local)
```env
# Google Cloud Platform 설정
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON=your-service-account-json
GOOGLE_CLOUD_BUCKET=your-bucket-name

# Firebase 설정
FIREBASE_ADMIN_PROJECT_ID=your-firebase-project
FIREBASE_ADMIN_CLIENT_EMAIL=your-client-email
FIREBASE_ADMIN_PRIVATE_KEY="your-private-key"

# Next.js 환경
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
```

## 🛠️ 기술 스택
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **UI Components**: shadcn/ui
- **Cloud Services**: Google Cloud Video Intelligence API
- **Database**: Firestore
- **Storage**: Google Cloud Storage

## 📊 API 엔드포인트
- `/api/upload` - 영상 업로드 (Presigned URL 방식)
- `/api/comprehensive-analysis` - 비동기 분석 시작
- `/api/comprehensive-analysis/status/[sessionId]` - 분석 상태 확인
- `/api/play-sessions/[sessionId]` - 세션 데이터 조회

## 🔧 아키텍처

### 단순화된 구조
```
클라이언트 → Next.js API → Google Cloud → Firestore
    ↓           ↓              ↓           ↓
영상 업로드  → 분석 API   → Video Intelligence → 결과 저장
```

### 핵심 컴포넌트
- **VideoAnalyzer**: Google Cloud Video Intelligence 직접 호출
- **UnifiedAnalysisEngine**: 분석 결과 통합 처리  
- **GCPDataStorage**: Firestore 및 Cloud Storage 관리

## 📱 사용 방법
1. **사용자 정보 입력** (`/user-info`)
2. **영상 업로드** (`/upload`) 
3. **분석 진행** (`/analysis`) - 실시간 상태 확인
4. **결과 확인** (`/results`) - 대시보드로 결과 표시

## 🎯 특징
- **비동기 분석**: Vercel 타임아웃 방지
- **실시간 폴링**: 분석 진행 상태 실시간 업데이트
- **Presigned URL**: 대용량 파일 업로드 지원
- **에러 복구**: 세션 관리 및 에러 핸들링 