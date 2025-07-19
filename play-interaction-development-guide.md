# 놀이 상호작용 분석 프로그램 개발 가이드

## 🚀 개요
부모-자녀 놀이 영상을 분석하여 상호작용 질을 평가하고 발달 지원 수준을 측정하는 AI 기반 분석 시스템 개발 가이드입니다.

## 📋 목차
1. [시스템 아키텍처](#시스템-아키텍처)
2. [핵심 분석 모듈](#핵심-분석-모듈)
3. [점수 계산 알고리즘](#점수-계산-알고리즘)
4. [데이터 통합 및 보고서](#데이터-통합-및-보고서)
5. [실시간 분석](#실시간-분석)
6. [API 설계](#api-설계)
7. [환경 설정](#환경-설정)

---

## 시스템 아키텍처

### 디렉토리 구조
```
play_interaction_analyzer/
├── data_processing/
│   ├── video_analyzer.py      # 비디오 데이터 처리
│   ├── audio_analyzer.py      # 음성 전사 및 분석
│   └── data_merger.py         # 데이터 통합
├── analysis_modules/
│   ├── physical_interaction.py
│   ├── emotional_interaction.py
│   ├── language_interaction.py
│   └── play_patterns.py
├── scoring/
│   ├── metrics_calculator.py
│   └── report_generator.py
├── visualization/
│   └── dashboard_generator.py
├── api/
│   └── endpoints.py
└── config/
    └── settings.py
```

---

## 핵심 분석 모듈

### 1. 비디오 분석 모듈

#### `video_analyzer.py`
```python
from google.cloud import videointelligence

class VideoAnalyzer:
    def __init__(self):
        self.client = videointelligence.VideoIntelligenceServiceClient()
        self.features = [
            videointelligence.Feature.OBJECT_TRACKING,
            videointelligence.Feature.FACE_DETECTION,
            videointelligence.Feature.PERSON_DETECTION,
            videointelligence.Feature.SHOT_CHANGE_DETECTION
        ]
    
    def analyze_video(self, video_path):
        """
        비디오 분석 및 메타데이터 추출
        
        Returns:
            dict: {
                'object_tracking': [...],
                'face_detection': [...],
                'person_detection': [...],
                'shot_changes': [...]
            }
        """
        with open(video_path, 'rb') as f:
            input_content = f.read()
        
        operation = self.client.annotate_video(
            request={
                "features": self.features,
                "input_content": input_content,
            }
        )
        
        result = operation.result(timeout=300)
        return self._process_results(result)
    
    def _process_results(self, result):
        """분석 결과를 구조화된 형태로 변환"""
        return {
            'object_tracking': self._extract_object_tracks(result),
            'face_detection': self._extract_face_data(result),
            'person_detection': self._extract_person_data(result),
            'shot_changes': self._extract_shot_changes(result)
        }
```

### 2. 물리적 상호작용 분석

#### `physical_interaction.py`
```python
import numpy as np
from typing import List, Dict, Tuple

class PhysicalInteractionAnalyzer:
    def __init__(self):
        self.proximity_threshold = 0.3  # 근접 판단 기준
        self.sync_window = 2.0  # 동기화 판단 시간 창(초)
    
    def calculate_proximity(self, person1_bbox: Dict, person2_bbox: Dict) -> float:
        """
        두 사람 간 정규화된 거리 계산
        
        Args:
            person1_bbox: {'left': 0.1, 'top': 0.2, 'right': 0.3, 'bottom': 0.8}
            person2_bbox: {'left': 0.4, 'top': 0.2, 'right': 0.6, 'bottom': 0.8}
        
        Returns:
            float: 0-1 사이의 거리 값 (0=매우 가까움, 1=매우 멀음)
        """
        # 중심점 계산
        center1 = self._get_center(person1_bbox)
        center2 = self._get_center(person2_bbox)
        
        # 유클리드 거리
        distance = np.sqrt((center1[0] - center2[0])**2 + 
                          (center1[1] - center2[1])**2)
        
        # 정규화 (대각선 길이 기준)
        normalized_distance = distance / np.sqrt(2)
        return min(normalized_distance, 1.0)
    
    def analyze_movement_synchrony(self, movements1: List, movements2: List) -> Dict:
        """
        움직임 동기화 분석
        
        Returns:
            dict: {
                'sync_score': float,  # 0-1
                'synchronized_events': List[Tuple[time, type]],
                'mirroring_count': int
            }
        """
        sync_events = []
        
        for m1 in movements1:
            for m2 in movements2:
                time_diff = abs(m1['time'] - m2['time'])
                if time_diff <= self.sync_window:
                    if self._is_similar_movement(m1, m2):
                        sync_events.append((m1['time'], 'synchronized'))
                    elif self._is_mirrored_movement(m1, m2):
                        sync_events.append((m1['time'], 'mirrored'))
        
        return {
            'sync_score': len(sync_events) / max(len(movements1), len(movements2)),
            'synchronized_events': sync_events,
            'mirroring_count': sum(1 for _, t in sync_events if t == 'mirrored')
        }
    
    def calculate_activity_metrics(self, bbox_sequence: List) -> Dict:
        """
        활동성 수준 측정
        
        Returns:
            dict: {
                'activity_level': str,  # 'low', 'medium', 'high'
                'movement_speed': float,
                'activity_area': float,
                'static_ratio': float
            }
        """
        if len(bbox_sequence) < 2:
            return self._default_activity_metrics()
        
        # 움직임 속도 계산
        speeds = []
        for i in range(1, len(bbox_sequence)):
            speed = self._calculate_speed(
                bbox_sequence[i-1], 
                bbox_sequence[i]
            )
            speeds.append(speed)
        
        avg_speed = np.mean(speeds)
        
        # 활동 영역 계산
        all_centers = [self._get_center(bbox) for bbox in bbox_sequence]
        activity_area = self._calculate_coverage_area(all_centers)
        
        # 정적 시간 비율
        static_frames = sum(1 for s in speeds if s < 0.01)
        static_ratio = static_frames / len(speeds)
        
        # 활동 수준 판정
        if avg_speed < 0.05 and static_ratio > 0.7:
            activity_level = 'low'
        elif avg_speed > 0.15 or static_ratio < 0.3:
            activity_level = 'high'
        else:
            activity_level = 'medium'
        
        return {
            'activity_level': activity_level,
            'movement_speed': avg_speed,
            'activity_area': activity_area,
            'static_ratio': static_ratio
        }
    
    def _get_center(self, bbox: Dict) -> Tuple[float, float]:
        """바운딩 박스의 중심점 계산"""
        x = (bbox['left'] + bbox['right']) / 2
        y = (bbox['top'] + bbox['bottom']) / 2
        return (x, y)
    
    def _calculate_speed(self, bbox1: Dict, bbox2: Dict) -> float:
        """두 프레임 간 움직임 속도 계산"""
        center1 = self._get_center(bbox1)
        center2 = self._get_center(bbox2)
        distance = np.sqrt((center1[0] - center2[0])**2 + 
                          (center1[1] - center2[1])**2)
        return distance
    
    def _calculate_coverage_area(self, centers: List[Tuple]) -> float:
        """활동 영역의 면적 계산"""
        if len(centers) < 3:
            return 0.0
        
        xs = [c[0] for c in centers]
        ys = [c[1] for c in centers]
        
        area = (max(xs) - min(xs)) * (max(ys) - min(ys))
        return area
```

### 3. 언어 상호작용 분석

#### `language_interaction.py`
```python
import re
from collections import Counter
from typing import List, Dict
import openai

class LanguageInteractionAnalyzer:
    def __init__(self, api_key: str):
        openai.api_key = api_key
        self.analysis_prompt = """
        음성 전사 텍스트를 분석하여 다음을 추출하세요:

        1. 발화 통계:
           - 각 화자별 발화 횟수
           - 평균 발화 길이 (단어 수)
           - 발화 간격 (초)

        2. 발화 유형 분류:
           - 질문: "어떻게", "뭐", "왜", "뭘", "어디" 등으로 시작
           - 지시/제안: "해봐", "하자", "해줄게", "해야", "하면" 등 포함
           - 감정 표현: 감탄사, 감정 단어 ("좋아", "싫어", "예쁘다" 등)
           - 칭찬/격려: "잘했어", "멋지다", "대단해" 등

        3. 상호작용 패턴:
           - 대화 주도성 (발화 시작 빈도)
           - 반응 시간 (평균 응답 간격)
           - 대화 연결성 (주제 일관성 점수 0-1)

        4. 주요 키워드:
           - 빈도수 상위 10개 단어
           - 놀이 관련 어휘
           - 호명 빈도

        5. 발달 지표:
           - 문장 복잡도
           - 어휘 다양성
           - 상호작용 언어 사용

        출력 형식: JSON
        """
    
    def analyze_transcript(self, transcript: List[Dict]) -> Dict:
        """
        전사 텍스트 분석
        
        Args:
            transcript: [
                {'speaker': '참석자1', 'time': 5, 'text': '어떻게 하는 걸 거 같아.'},
                ...
            ]
        
        Returns:
            dict: 분석 결과
        """
        # 기본 통계 계산
        basic_stats = self._calculate_basic_stats(transcript)
        
        # GPT를 사용한 심화 분석
        detailed_analysis = self._gpt_analysis(transcript)
        
        # 키워드 추출
        keywords = self._extract_keywords(transcript)
        
        # 대화 패턴 분석
        conversation_patterns = self._analyze_conversation_patterns(transcript)
        
        return {
            'basic_stats': basic_stats,
            'detailed_analysis': detailed_analysis,
            'keywords': keywords,
            'conversation_patterns': conversation_patterns
        }
    
    def _calculate_basic_stats(self, transcript: List[Dict]) -> Dict:
        """기본 발화 통계 계산"""
        stats = {}
        
        # 화자별 그룹화
        speakers = {}
        for entry in transcript:
            speaker = entry['speaker']
            if speaker not in speakers:
                speakers[speaker] = []
            speakers[speaker].append(entry)
        
        # 화자별 통계
        for speaker, entries in speakers.items():
            utterance_count = len(entries)
            
            # 평균 발화 길이
            word_counts = [len(e['text'].split()) for e in entries]
            avg_length = sum(word_counts) / len(word_counts) if word_counts else 0
            
            # 발화 간격
            intervals = []
            for i in range(1, len(entries)):
                interval = entries[i]['time'] - entries[i-1]['time']
                intervals.append(interval)
            avg_interval = sum(intervals) / len(intervals) if intervals else 0
            
            stats[speaker] = {
                'utterance_count': utterance_count,
                'avg_word_count': round(avg_length, 1),
                'avg_interval': round(avg_interval, 1),
                'total_words': sum(word_counts)
            }
        
        return stats
    
    def _gpt_analysis(self, transcript: List[Dict]) -> Dict:
        """GPT를 사용한 심화 분석"""
        # 전사 텍스트를 문자열로 변환
        transcript_text = "\n".join([
            f"{entry['speaker']} ({entry['time']}초): {entry['text']}"
            for entry in transcript
        ])
        
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": self.analysis_prompt},
                {"role": "user", "content": transcript_text}
            ],
            temperature=0.3
        )
        
        # JSON 파싱
        import json
        return json.loads(response.choices[0].message.content)
    
    def _extract_keywords(self, transcript: List[Dict]) -> Dict:
        """키워드 추출"""
        all_words = []
        for entry in transcript:
            # 기본 전처리
            words = re.findall(r'\w+', entry['text'].lower())
            all_words.extend(words)
        
        # 불용어 제거 (간단한 한국어 불용어 리스트)
        stopwords = {'이', '그', '저', '것', '을', '를', '이', '가', '은', '는', '에', '의'}
        filtered_words = [w for w in all_words if w not in stopwords and len(w) > 1]
        
        # 빈도수 계산
        word_freq = Counter(filtered_words)
        
        return {
            'top_keywords': word_freq.most_common(10),
            'total_unique_words': len(set(filtered_words)),
            'total_words': len(filtered_words)
        }
    
    def _analyze_conversation_patterns(self, transcript: List[Dict]) -> Dict:
        """대화 패턴 분석"""
        if len(transcript) < 2:
            return {}
        
        patterns = {
            'turn_taking': [],
            'response_times': [],
            'initiation_count': {}
        }
        
        # 턴테이킹 분석
        for i in range(1, len(transcript)):
            if transcript[i]['speaker'] != transcript[i-1]['speaker']:
                response_time = transcript[i]['time'] - transcript[i-1]['time']
                patterns['response_times'].append(response_time)
                patterns['turn_taking'].append({
                    'from': transcript[i-1]['speaker'],
                    'to': transcript[i]['speaker'],
                    'time': transcript[i]['time'],
                    'response_time': response_time
                })
        
        # 대화 시작 횟수
        for i, entry in enumerate(transcript):
            if i == 0 or transcript[i]['time'] - transcript[i-1]['time'] > 3.0:
                speaker = entry['speaker']
                patterns['initiation_count'][speaker] = patterns['initiation_count'].get(speaker, 0) + 1
        
        # 평균 반응 시간
        avg_response_time = sum(patterns['response_times']) / len(patterns['response_times']) if patterns['response_times'] else 0
        
        return {
            'avg_response_time': round(avg_response_time, 2),
            'turn_count': len(patterns['turn_taking']),
            'initiation_count': patterns['initiation_count'],
            'conversation_flow': patterns['turn_taking'][:10]  # 처음 10개만
        }
```

### 4. 감정적 상호작용 분석

#### `emotional_interaction.py`
```python
import numpy as np
from typing import List, Dict, Tuple

class EmotionalInteractionAnalyzer:
    def __init__(self):
        self.face_size_threshold = 0.1  # 얼굴 크기 임계값
        self.gaze_alignment_threshold = 0.8  # 시선 정렬 임계값
    
    def analyze_face_orientation(self, face_data: List[Dict]) -> Dict:
        """
        얼굴 지향 행동 분석
        
        Args:
            face_data: 얼굴 감지 데이터 리스트
        
        Returns:
            dict: {
                'mutual_gaze_time': float,  # 상호 응시 시간 비율
                'face_to_face_ratio': float,  # 얼굴 대면 비율
                'proximity_changes': List[Dict],  # 근접성 변화
                'engagement_score': float  # 0-1
            }
        """
        if not face_data:
            return self._default_face_metrics()
        
        mutual_gaze_frames = 0
        face_to_face_frames = 0
        proximity_changes = []
        
        for i, frame in enumerate(face_data):
            if len(frame.get('faces', [])) >= 2:
                # 두 얼굴이 모두 감지된 경우
                face1, face2 = frame['faces'][:2]
                
                # 상호 응시 판단
                if self._is_mutual_gaze(face1, face2):
                    mutual_gaze_frames += 1
                
                # 얼굴 대면 판단
                if self._is_face_to_face(face1, face2):
                    face_to_face_frames += 1
                
                # 근접성 변화 추적
                if i > 0 and len(face_data[i-1].get('faces', [])) >= 2:
                    prev_distance = self._calculate_face_distance(
                        face_data[i-1]['faces'][0], 
                        face_data[i-1]['faces'][1]
                    )
                    curr_distance = self._calculate_face_distance(face1, face2)
                    
                    if abs(curr_distance - prev_distance) > 0.05:
                        proximity_changes.append({
                            'time': frame['time'],
                            'change': 'closer' if curr_distance < prev_distance else 'farther',
                            'magnitude': abs(curr_distance - prev_distance)
                        })
        
        total_frames = len(face_data)
        
        return {
            'mutual_gaze_time': mutual_gaze_frames / total_frames if total_frames > 0 else 0,
            'face_to_face_ratio': face_to_face_frames / total_frames if total_frames > 0 else 0,
            'proximity_changes': proximity_changes,
            'engagement_score': self._calculate_engagement_score(
                mutual_gaze_frames / total_frames if total_frames > 0 else 0,
                face_to_face_frames / total_frames if total_frames > 0 else 0,
                len(proximity_changes)
            )
        }
    
    def estimate_emotional_states(self, face_data: List[Dict], movement_data: List[Dict]) -> Dict:
        """
        감정 상태 추정 (표정 인식 없이)
        
        Returns:
            dict: {
                'engagement_periods': List[Tuple[start, end, level]],
                'interaction_quality': str,  # 'high', 'medium', 'low'
                'emotional_synchrony': float  # 0-1
            }
        """
        engagement_periods = []
        current_period = None
        
        for i, frame in enumerate(face_data):
            engagement_level = self._estimate_frame_engagement(frame, movement_data, i)
            
            if engagement_level > 0.6:  # 높은 참여도
                if current_period is None:
                    current_period = [frame['time'], frame['time'], 'high']
                else:
                    current_period[1] = frame['time']
            else:
                if current_period is not None:
                    engagement_periods.append(tuple(current_period))
                    current_period = None
        
        # 마지막 기간 추가
        if current_period is not None:
            engagement_periods.append(tuple(current_period))
        
        # 상호작용 품질 판단
        total_high_engagement_time = sum(end - start for start, end, _ in engagement_periods)
        total_time = face_data[-1]['time'] - face_data[0]['time'] if face_data else 1
        engagement_ratio = total_high_engagement_time / total_time
        
        if engagement_ratio > 0.6:
            interaction_quality = 'high'
        elif engagement_ratio > 0.3:
            interaction_quality = 'medium'
        else:
            interaction_quality = 'low'
        
        return {
            'engagement_periods': engagement_periods,
            'interaction_quality': interaction_quality,
            'emotional_synchrony': self._calculate_emotional_synchrony(face_data, movement_data)
        }
    
    def _is_mutual_gaze(self, face1: Dict, face2: Dict) -> bool:
        """상호 응시 여부 판단"""
        # 얼굴 중심점 계산
        center1 = self._get_face_center(face1)
        center2 = self._get_face_center(face2)
        
        # 얼굴 방향 추정 (간단한 휴리스틱)
        # 실제로는 랜드마크 기반 계산이 필요하지만, bbox만으로 추정
        horizontal_alignment = abs(center1[1] - center2[1]) < 0.2
        facing_each_other = abs(center1[0] - center2[0]) > 0.1
        
        return horizontal_alignment and facing_each_other
    
    def _is_face_to_face(self, face1: Dict, face2: Dict) -> bool:
        """얼굴 대면 여부 판단"""
        center1 = self._get_face_center(face1)
        center2 = self._get_face_center(face2)
        
        # 수평 정렬 확인
        horizontal_alignment = abs(center1[1] - center2[1]) < 0.3
        
        # 적절한 거리 확인
        distance = abs(center1[0] - center2[0])
        appropriate_distance = 0.2 < distance < 0.6
        
        return horizontal_alignment and appropriate_distance
    
    def _calculate_face_distance(self, face1: Dict, face2: Dict) -> float:
        """두 얼굴 간 거리 계산"""
        center1 = self._get_face_center(face1)
        center2 = self._get_face_center(face2)
        
        distance = np.sqrt((center1[0] - center2[0])**2 + (center1[1] - center2[1])**2)
        return distance
    
    def _get_face_center(self, face: Dict) -> Tuple[float, float]:
        """얼굴 중심점 계산"""
        bbox = face['boundingBox']
        x = (bbox['left'] + bbox['right']) / 2
        y = (bbox['top'] + bbox['bottom']) / 2
        return (x, y)
    
    def _calculate_engagement_score(self, gaze_ratio: float, face_ratio: float, changes: int) -> float:
        """참여도 점수 계산"""
        # 가중치 적용
        score = (gaze_ratio * 0.4 + face_ratio * 0.4 + min(changes / 10, 1) * 0.2)
        return round(score, 2)
    
    def _estimate_frame_engagement(self, face_frame: Dict, movement_data: List[Dict], frame_idx: int) -> float:
        """프레임별 참여도 추정"""
        engagement = 0.0
        
        # 얼굴 감지 여부
        if face_frame.get('faces'):
            engagement += 0.3
            
            # 얼굴 크기 (근접성 지표)
            if len(face_frame['faces']) >= 2:
                avg_face_size = np.mean([self._get_face_size(f) for f in face_frame['faces'][:2]])
                if avg_face_size > self.face_size_threshold:
                    engagement += 0.3
        
        # 움직임 활동성
        if frame_idx < len(movement_data):
            movement = movement_data[frame_idx]
            if movement.get('activity_level') in ['medium', 'high']:
                engagement += 0.4
        
        return engagement
    
    def _get_face_size(self, face: Dict) -> float:
        """얼굴 크기 계산"""
        bbox = face['boundingBox']
        width = bbox['right'] - bbox['left']
        height = bbox['bottom'] - bbox['top']
        return width * height
    
    def _calculate_emotional_synchrony(self, face_data: List[Dict], movement_data: List[Dict]) -> float:
        """감정적 동기화 계산"""
        if not face_data or not movement_data:
            return 0.0
        
        sync_frames = 0
        total_frames = min(len(face_data), len(movement_data))
        
        for i in range(total_frames):
            face_engagement = self._estimate_frame_engagement(face_data[i], movement_data, i)
            
            # 두 참가자가 비슷한 참여도를 보이는 경우
            if face_engagement > 0.5 and len(face_data[i].get('faces', [])) >= 2:
                sync_frames += 1
        
        return sync_frames / total_frames if total_frames > 0 else 0.0
    
    def _default_face_metrics(self) -> Dict:
        """기본 얼굴 지표"""
        return {
            'mutual_gaze_time': 0.0,
            'face_to_face_ratio': 0.0,
            'proximity_changes': [],
            'engagement_score': 0.0
        }
```

### 5. 놀이 패턴 분석

#### `play_patterns.py`
```python
from typing import List, Dict, Tuple
import numpy as np

class PlayPatternAnalyzer:
    def __init__(self):
        self.min_activity_duration = 10  # 최소 활동 지속 시간(초)
        self.transition_threshold = 0.3  # 활동 전환 임계값
    
    def analyze_toy_usage(self, object_tracks: List[Dict]) -> Dict:
        """
        장난감 사용 패턴 분석
        
        Returns:
            dict: {
                'toys_detected': List[str],
                'usage_duration': Dict[str, float],
                'sharing_ratio': float,
                'toy_transitions': List[Dict]
            }
        """
        toys = {}
        transitions = []
        
        # 장난감별 사용 시간 계산
        for track in object_tracks:
            if track['category'] == 'toy':
                toy_id = track['entity_id']
                if toy_id not in toys:
                    toys[toy_id] = {
                        'first_seen': track['time'],
                        'last_seen': track['time'],
                        'frames': 1,
                        'shared_frames': 0
                    }
                else:
                    toys[toy_id]['last_seen'] = track['time']
                    toys[toy_id]['frames'] += 1
                
                # 공유 여부 확인 (두 사람이 동시에 상호작용)
                if self._is_shared_interaction(track):
                    toys[toy_id]['shared_frames'] += 1
        
        # 사용 시간 및 공유 비율 계산
        usage_duration = {}
        total_shared_frames = 0
        total_frames = 0
        
        for toy_id, data in toys.items():
            duration = data['last_seen'] - data['first_seen']
            usage_duration[toy_id] = duration
            total_shared_frames += data['shared_frames']
            total_frames += data['frames']
        
        sharing_ratio = total_shared_frames / total_frames if total_frames > 0 else 0
        
        # 장난감 전환 분석
        prev_toy = None
        prev_time = None
        
        for track in sorted(object_tracks, key=lambda x: x['