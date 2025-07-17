# Google Cloud 설정 가이드

## 📋 설정 체크리스트

### 1. Google Cloud Console 접속
- URL: https://console.cloud.google.com
- 프로젝트: `full-kids-tracker`
- 서비스 계정: `firebase-app-hosting-compute@full-kids-tracker.iam.gserviceaccount.com`

### 2. 필요한 API 활성화

#### A. API 및 서비스 → 라이브러리 접속
다음 API들을 검색하여 활성화:

```
✅ Video Intelligence API
✅ Cloud Storage API
✅ Cloud Storage JSON API
✅ Identity and Access Management (IAM) API
✅ Service Usage API
```

#### B. 각 API 활성화 방법
1. 검색창에 API 이름 입력
2. 해당 API 클릭
3. "사용 설정" 버튼 클릭
4. 활성화 완료 확인

### 3. 서비스 계정 권한 설정

#### A. IAM 및 관리 → IAM 메뉴 접속
1. `firebase-app-hosting-compute@full-kids-tracker.iam.gserviceaccount.com` 찾기
2. 수정(연필 아이콘) 클릭
3. "다른 역할 추가" 클릭

#### B. 필요한 역할 추가
다음 역할들을 추가해주세요:

```
✅ Cloud Video Intelligence API 사용자
   - 역할: roles/videointelligence.user
   - 설명: Video Intelligence API 사용 권한

✅ 스토리지 객체 뷰어
   - 역할: roles/storage.objectViewer
   - 설명: Storage 객체 읽기 권한

✅ 스토리지 객체 생성자
   - 역할: roles/storage.objectCreator
   - 설명: Storage 객체 생성 권한

✅ 서비스 계정 토큰 생성자
   - 역할: roles/iam.serviceAccountTokenCreator
   - 설명: 서비스 계정 토큰 생성 권한

✅ 편집자 (선택사항)
   - 역할: roles/editor
   - 설명: 프로젝트 전체 편집 권한
```

### 4. 스토리지 버킷 권한 확인

#### A. Cloud Storage → 버킷 메뉴 접속
1. `full-kids.firebasestorage.app` 버킷 클릭
2. "권한" 탭 클릭
3. 서비스 계정에 다음 권한 확인:
   - Storage Legacy Bucket Reader
   - Storage Legacy Bucket Writer
   - Storage Legacy Object Reader
   - Storage Legacy Object Writer

#### B. 권한 추가 (필요한 경우)
1. "구성원 추가" 클릭
2. "새 구성원": `firebase-app-hosting-compute@full-kids-tracker.iam.gserviceaccount.com`
3. "역할 선택": 위의 Storage 관련 역할들 추가

### 5. 서비스 계정 키 확인

#### A. IAM 및 관리 → 서비스 계정 메뉴 접속
1. `firebase-app-hosting-compute@full-kids-tracker.iam.gserviceaccount.com` 클릭
2. "키" 탭 클릭
3. 기존 키 확인 또는 새 키 생성

#### B. 새 키 생성 (필요한 경우)
1. "키 추가" → "새 키 만들기" 클릭
2. "키 유형": JSON 선택
3. "만들기" 클릭
4. 다운로드된 JSON 파일을 프로젝트 루트에 저장

### 6. 환경변수 확인

현재 설정된 환경변수:
```bash
GOOGLE_CLOUD_PROJECT_ID=full-kids-tracker
GOOGLE_CLOUD_KEY_FILE=./full-kids-tracker-d8b9c211d27a.json
GOOGLE_CLOUD_BUCKET=full-kids.firebasestorage.app
```

### 7. 권한 테스트

#### A. 서비스 계정 인증 테스트
```bash
# Google Cloud SDK 설치 후 (선택사항)
gcloud auth activate-service-account --key-file=full-kids-tracker-d8b9c211d27a.json
gcloud config set project full-kids-tracker
```

#### B. Video Intelligence API 테스트
```bash
# API 사용 가능 여부 확인
gcloud services list --enabled | grep videointelligence
```

### 8. 문제 해결

#### A. 일반적인 오류와 해결방법

**오류**: `PERMISSION_DENIED`
- **해결**: 서비스 계정에 Video Intelligence API 사용자 역할 추가
- **확인**: IAM → 서비스 계정 권한 재확인

**오류**: `INVALID_ARGUMENT`
- **해결**: 올바른 gs:// URI 형식 사용
- **확인**: Firebase Storage URL 변환 함수 동작 확인

**오류**: `NOT_FOUND`
- **해결**: 스토리지 버킷 접근 권한 확인
- **확인**: Cloud Storage 버킷 권한 설정

#### B. 권한 적용 시간
- 권한 변경 후 적용까지 최대 5분 소요
- 변경 후 서버 재시작 권장

### 9. 최종 확인

✅ Video Intelligence API 활성화 완료
✅ 서비스 계정 권한 설정 완료
✅ 스토리지 버킷 권한 설정 완료
✅ 환경변수 설정 완료
✅ 서비스 계정 키 파일 존재 확인

---

**🎉 설정 완료 후 애플리케이션을 재시작하여 테스트해보세요!**

### 테스트 방법:
1. `npm run dev` 서버 재시작
2. 브라우저에서 `http://localhost:3000` 접속
3. 영상 업로드 테스트
4. 분석 결과 확인 