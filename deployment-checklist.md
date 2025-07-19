# 🚀 배포 후 체크리스트

## ✅ 기본 기능 테스트
- [ ] **홈페이지** 로딩 확인
- [ ] **업로드 페이지** 접근 가능
- [ ] **대시보드** 차트 렌더링 확인

## 🎥 핵심 기능 테스트  
- [ ] **비디오 업로드** 성공
- [ ] **분석 진행률** 표시 확인
- [ ] **결과 페이지** 10개 차트 모두 표시
- [ ] **세션 목록** 조회 가능

## 🔧 기술적 확인사항
- [ ] **API 응답속도** 정상 (< 30초)
- [ ] **GCP 연동** 정상 (Firestore/Storage)
- [ ] **에러 로그** 확인 (Vercel Dashboard)
- [ ] **환경변수** 올바르게 설정

## 🛠 문제 해결
### 만약 에러가 발생한다면:

**1. 빌드 에러**
```bash
# Vercel에서 빌드 로그 확인
# Function Logs > Build Logs
```

**2. 런타임 에러** 
```bash
# Vercel Dashboard > Functions > View Details
# Error 로그 확인
```

**3. 환경변수 문제**
- Settings > Environment Variables에서 값 재확인
- JSON 형식 문법 에러 체크
- 따옴표 이스케이프 확인

**4. GCP 인증 문제**
- 서비스 계정 권한 확인:
  - Cloud Storage Admin
  - Firestore Admin  
  - Video Intelligence API User
  - Speech-to-Text API User

## 📞 배포 완료 후 알려주세요!
배포가 완료되면 URL을 알려주시면 함께 테스트해보겠습니다! 🎉 