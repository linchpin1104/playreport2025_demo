# 🚀 개발 모드 사용 가이드

개발 모드를 사용하면 실제 API 호출 대신 Mock 데이터를 사용하여 빠르고 효율적으로 개발과 테스트를 할 수 있습니다.

## 📋 개발 모드의 장점

### ✅ 시간 절약
- 영상 업로드: 1초 (실제: 50초)
- 영상 분석: 2초 (실제: 4분)
- 상세 분석: 1.5초 (실제: 10초)
- AI 레포트: 3초 (실제: 10초)

### ✅ 비용 절약
- Google Cloud Video Intelligence API 호출 없음
- OpenAI GPT-4 API 호출 없음
- Firebase Storage 업로드 없음

### ✅ 일관된 테스트
- 동일한 Mock 데이터로 반복 테스트 가능
- 오프라인 개발 가능
- 네트워크 문제 없음

## 🛠️ 설정 방법

### 방법 1: 환경 변수 설정 (권장)

1. `.env.local` 파일 생성 또는 수정:
```bash
# 개발 모드 활성화
USE_MOCK_DATA=true

# 기타 필요한 환경 변수들...
OPENAI_API_KEY=your_actual_api_key_here
GOOGLE_CLOUD_PROJECT_ID=your_project_id_here
```

2. 서버 재시작:
```bash
npm run dev
```

### 방법 2: 브라우저에서 토글 (임시)

1. 웹 페이지에서 **"🚀 개발 모드 활성화"** 버튼 클릭
2. 페이지가 자동으로 새로고침되며 개발 모드 활성화
3. 브라우저 새로고침 시까지 유지

## 📁 Mock 데이터 구조

```
src/lib/mock-data/
├── sample-analysis.json        # 실제 분석 결과 JSON
└── mock-data-loader.ts         # Mock 데이터 로더
```

## 🔧 API 엔드포인트별 Mock 동작

### 1. 업로드 API (`/api/upload`)
```typescript
// Mock 응답 (1초 후)
{
  success: true,
  fileName: 'sample-video.mp4',
  gsUri: 'gs://mock-bucket/sample-video.mp4',
  ...
}
```

### 2. 분석 API (`/api/analyze`)
```typescript
// Mock 응답 (2초 후)
{
  success: true,
  results: {
    speechTranscription: [...],
    objectTracking: [...],
    faceDetection: [...],
    ...
  }
}
```

### 3. 상세 분석 API (`/api/detailed-analysis`)
```typescript
// Mock 응답 (1.5초 후)
{
  success: true,
  detailedAnalysis: {
    emotionalAnalysis: { smilingDetections: 45, ... },
    spatialAnalysis: { averageDistance: 0.245, ... },
    activityAnalysis: { childActivityLevel: 'dynamic', ... },
    ...
  }
}
```

### 4. 레포트 생성 API (`/api/report`)
```typescript
// Mock 응답 (3초 후)
{
  success: true,
  analysis: {
    summary: "Mock 분석 결과...",
    insights: { ... },
    recommendations: [...],
    ...
  }
}
```

## 🔍 개발 모드 확인 방법

### 터미널 로그 확인
```bash
🚀 [개발 모드] Upload API: Mock 데이터 사용 중
🚀 [개발 모드] Analysis API: Mock 데이터 사용 중
🚀 [개발 모드] Detailed Analysis API: Mock 데이터 사용 중
🚀 [개발 모드] Report API: Mock 데이터 사용 중
```

### 브라우저 개발자 도구
1. F12 키로 개발자 도구 열기
2. Console 탭에서 Mock 데이터 로그 확인
3. Network 탭에서 빠른 응답 시간 확인

### 상태 API 확인
```bash
curl http://localhost:3000/api/dev-status
```

## 🔄 실제 API로 전환

### 방법 1: 환경 변수 변경
```bash
# .env.local 파일에서
USE_MOCK_DATA=false
```

### 방법 2: 브라우저에서 토글
1. **"🔄 실제 API 사용"** 버튼 클릭
2. 페이지 새로고침 후 실제 API 사용

## 🎯 실제 사용 시나리오

### 1. 새로운 기능 개발
```bash
# 개발 모드 활성화
USE_MOCK_DATA=true

# 빠른 개발 사이클
영상 업로드 → 분석 → 상세 분석 → 레포트 생성 (총 7.5초)
```

### 2. UI/UX 테스트
- 동일한 Mock 데이터로 반복 테스트
- 다양한 브라우저에서 테스트
- 반응형 디자인 확인

### 3. 성능 테스트
- 실제 API 지연 없이 순수 프론트엔드 성능 측정
- 메모리 사용량 확인
- 렌더링 성능 최적화

### 4. 데모 및 프레젠테이션
- 네트워크 연결 없이 안정적인 데모
- 빠른 응답으로 원활한 프레젠테이션
- 예측 가능한 결과

## 🛡️ 주의사항

### 1. 프로덕션 환경
- 프로덕션 배포 시 반드시 `USE_MOCK_DATA=false` 설정
- 환경 변수 검증 필수

### 2. Mock 데이터 업데이트
- 실제 API 스펙 변경 시 Mock 데이터도 함께 업데이트
- 새로운 기능 추가 시 해당 Mock 데이터 추가

### 3. 테스트 한계
- Mock 데이터는 실제 API 동작과 다를 수 있음
- 최종 테스트는 반드시 실제 API로 수행
- 에러 케이스 테스트 제한

## 📞 문제 해결

### 개발 모드가 활성화되지 않는 경우
1. 환경 변수 확인: `USE_MOCK_DATA=true`
2. 서버 재시작: `npm run dev`
3. 브라우저 캐시 삭제
4. 콘솔 로그 확인

### Mock 데이터 로딩 오류
1. `src/lib/mock-data/sample-analysis.json` 파일 존재 확인
2. JSON 파일 구조 검증
3. 파일 권한 확인

### API 응답 형식 오류
1. Mock 데이터와 실제 API 응답 구조 비교
2. 타입 정의 확인
3. 로그 메시지 확인

이 가이드를 따라하면 효율적인 개발과 테스트를 할 수 있습니다! 🚀 