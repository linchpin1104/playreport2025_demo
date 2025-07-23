import { VideoIntelligenceResults } from '@/types';
import { EmotionalInteractionAnalyzer, FaceData } from './emotional-interaction-analyzer';
import { LanguageInteractionAnalyzer, TranscriptEntry } from './language-interaction-analyzer';
import { Logger } from './services/logger';

const logger = new Logger('DataExtractor');

/**
 * 📊 분석용 추출 데이터 인터페이스 (확장됨)
 * 원본 데이터에서 분석에 필요한 핵심 데이터만 추출한 결과
 */
export interface ExtractedAnalysisData {
  sessionId: string;
  extractedAt: string;
  originalDataSize: number; // bytes
  extractedDataSize: number; // bytes
  compressionRatio: number; // 압축률
  
  // 추출된 핵심 데이터 (대폭 확장)
  personMovements: Array<{
    personId: number;
    movements: Array<{
      time: number;
      bbox: { left: number; top: number; right: number; bottom: number };
      center: [number, number];
      size: number;
      confidence?: number;
      attributes?: unknown[]; // 추가 속성 정보
    }>;
  }>;
  
  speechData: TranscriptEntry[];
  
  speechDetails: {
    totalWords: number;
    speakers: Record<string, {
      wordCount: number;
      avgConfidence: number;
      timeRange: [number, number];
    }>;
    wordConfidenceDistribution: Array<{ confidence: number; count: number }>;
  };
  
  faceInteractions: FaceData[];
  
  faceDetails: {
    totalDetections: number;
    avgFaceSize: number;
    facePresenceRatio: number; // 전체 시간 대비 얼굴 감지 비율
    faceSizeDistribution: Array<{ size: number; count: number }>;
  };
  
  objectEvents: Array<{
    objectId: string;
    objectName: string;
    confidence: number;
    events: Array<{
      time: number;
      confidence: number;
      bbox: { left: number; top: number; right: number; bottom: number };
      size: number;
      center: [number, number];
    }>;
    totalDuration: number;
    avgConfidence: number;
  }>;
  
  sceneMetadata: {
    totalDuration: number;
    shotChanges: Array<{ time: number; duration: number }>;
    participantCount: number;
    averageConfidence: number;
    qualityMetrics: {
      personDetectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
      speechTranscriptionQuality: 'excellent' | 'good' | 'fair' | 'poor';
      objectDetectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
      overallDataQuality: 'excellent' | 'good' | 'fair' | 'poor';
    };
  };
  
  timelineEvents: Array<{
    time: number;
    type: 'person_detected' | 'face_detected' | 'object_detected' | 'speech_start' | 'speech_end' | 'scene_change';
    details: unknown;
  }>;
}

/**
 * 🔄 데이터 추출기 (Data Extractor) v2.0 - 포괄적 추출
 * 분석 품질을 위해 더 많은 데이터를 추출하되 구조화된 형태로 정리
 */
export class DataExtractor {
  
  /**
   * 원본 데이터에서 분석용 데이터 추출 (대폭 확장)
   */
  extractAnalysisData(
    sessionId: string, 
    rawResults: VideoIntelligenceResults
  ): ExtractedAnalysisData {
    const startTime = Date.now();
    
    // 원본 데이터 크기 측정
    const originalDataSize = JSON.stringify(rawResults).length;
    logger.info(`🔍 Starting comprehensive data extraction for ${sessionId}`, {
      originalDataSize: `${(originalDataSize / 1024 / 1024).toFixed(2)}MB`
    });

    // 1. 사람 움직임 데이터 추출 (모든 정보 포함)
    const personMovements = this.extractPersonMovementsComprehensive(rawResults.personDetection ?? []);
    
    // 2. 음성 데이터 추출 (모든 발화 + 상세 통계)
    const { speechData, speechDetails } = this.extractSpeechDataComprehensive(rawResults.speechTranscription ?? []);
    
    // 3. 얼굴 상호작용 데이터 추출 (모든 감지 + 통계)
    const { faceInteractions, faceDetails } = this.extractFaceDataComprehensive(rawResults.faceDetection ?? []);
    
    // 4. 객체 이벤트 데이터 추출 (낮은 신뢰도도 포함 + 메타데이터)
    const objectEvents = this.extractObjectEventsComprehensive(rawResults.objectTracking ?? []);
    
    // 5. 장면 메타데이터 추출 (품질 평가 포함)
    const sceneMetadata = this.extractSceneMetadataComprehensive(rawResults, personMovements, speechData, faceInteractions, objectEvents);
    
    // 6. 시간선 이벤트 생성
    const timelineEvents = this.generateTimelineEvents(rawResults, personMovements, speechData, faceInteractions, objectEvents);

    const extractedData: ExtractedAnalysisData = {
      sessionId,
      extractedAt: new Date().toISOString(),
      originalDataSize,
      extractedDataSize: 0, // 계산 후 설정
      compressionRatio: 0,
      personMovements,
      speechData,
      speechDetails,
      faceInteractions,
      faceDetails,
      objectEvents,
      sceneMetadata,
      timelineEvents
    };

    // 추출된 데이터 크기 계산
    const extractedDataSize = JSON.stringify(extractedData).length;
    extractedData.extractedDataSize = extractedDataSize;
    extractedData.compressionRatio = ((originalDataSize - extractedDataSize) / originalDataSize) * 100;

    const processingTime = Date.now() - startTime;
    
    logger.info(`✅ Comprehensive data extraction completed in ${processingTime}ms`, {
      originalSize: `${(originalDataSize / 1024 / 1024).toFixed(2)}MB`,
      extractedSize: `${(extractedDataSize / 1024).toFixed(1)}KB`,
      compressionRatio: `${extractedData.compressionRatio.toFixed(1)}%`,
      personMovements: `${personMovements.length} persons, ${personMovements.reduce((sum, p) => sum + p.movements.length, 0)} movements`,
      speechEntries: `${speechData.length} entries, ${speechDetails.totalWords} words`,
      faceInteractions: `${faceInteractions.length} detections`,
      objectEvents: `${objectEvents.length} objects, ${objectEvents.reduce((sum, o) => sum + o.events.length, 0)} events`,
      timelineEvents: timelineEvents.length,
      dataQuality: sceneMetadata.qualityMetrics.overallDataQuality
    });

    return extractedData;
  }

  /**
   * 사람 움직임 데이터 포괄적 추출 (모든 정보 포함)
   */
  private extractPersonMovementsComprehensive(personDetection: unknown[]): ExtractedAnalysisData['personMovements'] {
    const movements: ExtractedAnalysisData['personMovements'] = [];
    
    personDetection.forEach((person: unknown, personIndex) => {
      const personMovements: unknown[] = [];
      const personData = person as Record<string, unknown>;
      
      const tracks = personData.tracks as Array<Record<string, unknown>> ?? [];
      tracks.forEach((track: Record<string, unknown>) => {
        const timestampedObjects = track.timestampedObjects as Array<Record<string, unknown>> ?? [];
        timestampedObjects.forEach((obj: Record<string, unknown>) => {
          // 🔄 필터링 완화: bbox가 있는 모든 객체 포함
          if (obj.normalizedBoundingBox) {
            const bbox = obj.normalizedBoundingBox as Record<string, number>;
            const time = this.parseTimeOffset(obj.timeOffset);
            
            // 모든 정보 포함 (신뢰도, 속성 등)
            personMovements.push({
              time,
              bbox: {
                left: bbox.left ?? 0,
                top: bbox.top ?? 0,
                right: bbox.right ?? 1,
                bottom: bbox.bottom ?? 1
              },
              center: [
                (bbox.left + bbox.right) / 2,
                (bbox.top + bbox.bottom) / 2
              ],
              size: (bbox.right - bbox.left) * (bbox.bottom - bbox.top),
              confidence: (obj.confidence as number) ?? 0,
              attributes: (obj.attributes as unknown[]) ?? []
            });
          }
        });
      });
      
      if (personMovements.length > 0) {
        movements.push({
          personId: personIndex,
          movements: personMovements.sort((a: unknown, b: unknown) => {
            const aTime = (a as {time: number}).time;
            const bTime = (b as {time: number}).time;
            return aTime - bTime;
          })
        });
      }
    });

    logger.info(`👥 Comprehensive person movements: ${movements.length} persons, ${movements.reduce((sum, p) => sum + p.movements.length, 0)} total movements`);
    return movements;
  }

  /**
   * 음성 데이터 포괄적 추출 (모든 발화 + 통계)
   */
  private extractSpeechDataComprehensive(speechTranscription: unknown[]): { speechData: TranscriptEntry[], speechDetails: ExtractedAnalysisData['speechDetails'] } {
    const entries: TranscriptEntry[] = [];
    const speakerStats: Record<string, { wordCount: number; confidenceSum: number; times: number[] }> = {};
    const wordConfidences: number[] = [];
    let totalWords = 0;
    
    speechTranscription.forEach((transcript) => {
      const transcriptData = transcript as Record<string, unknown>;
      const alternatives = transcriptData.alternatives as Array<Record<string, unknown>> ?? [];
      const alternative = alternatives[0];
      if (alternative?.transcript && alternative.words) {
        
        // 화자별로 그룹화
        const speakerGroups: Record<number, unknown[]> = {};
        const words = alternative.words as Array<Record<string, unknown>>;
        words.forEach((word: Record<string, unknown>) => {
          const speakerTag = (word.speakerTag as number) ?? 0;
          if (!speakerGroups[speakerTag]) {
            speakerGroups[speakerTag] = [];
          }
          speakerGroups[speakerTag].push(word);
          
          // 통계 수집
          if (word.confidence) {
            wordConfidences.push(word.confidence as number);
          }
        });

        // 🔄 필터링 완화: 모든 의미있는 발화 포함 (1자 이상)
        Object.entries(speakerGroups).forEach(([speakerTag, words]) => {
          const speaker = `참석자${parseInt(speakerTag) + 1}`;
          const wordList = words as Array<Record<string, unknown>>;
          const text = wordList.map(w => w.word as string).join(' ');
          const firstWord = wordList[0];
          const time = parseFloat((firstWord?.startTime as string) ?? '0');
          
          // 최소 길이 조건 완화 (1자 이상, 공백만 아니면 포함)
          if (text.trim().length > 0) {
            entries.push({ speaker, time, text: text.trim() });
            
            // 화자별 통계
            if (!speakerStats[speaker]) {
              speakerStats[speaker] = { wordCount: 0, confidenceSum: 0, times: [] };
            }
            speakerStats[speaker].wordCount += wordList.length;
            speakerStats[speaker].confidenceSum += wordList.reduce((sum: number, w: Record<string, unknown>) => sum + ((w.confidence as number) ?? 0), 0);
            speakerStats[speaker].times.push(time);
            totalWords += wordList.length;
          }
        });
      }
    });

    // 화자별 상세 통계 계산
    const speakers: Record<string, {wordCount: number; avgConfidence: number; timeRange: [number, number]}> = {};
    Object.entries(speakerStats).forEach(([speaker, stats]) => {
      speakers[speaker] = {
        wordCount: stats.wordCount,
        avgConfidence: stats.wordCount > 0 ? stats.confidenceSum / stats.wordCount : 0,
        timeRange: [Math.min(...stats.times), Math.max(...stats.times)]
      };
    });

    // 신뢰도 분포 계산
    const confidenceBins = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
    const wordConfidenceDistribution = confidenceBins.slice(0, -1).map((bin, i) => {
      const nextBin = confidenceBins[i + 1];
      const count = wordConfidences.filter(c => c >= bin && c < nextBin).length;
      return { confidence: bin, count };
    });

    const sortedEntries = entries.sort((a, b) => a.time - b.time);
    
    const speechDetails = {
      totalWords,
      speakers,
      wordConfidenceDistribution
    };
    
    logger.info(`🗣️ Comprehensive speech data: ${sortedEntries.length} utterances, ${totalWords} words, ${Object.keys(speakers).length} speakers`);
    return { speechData: sortedEntries, speechDetails };
  }

  /**
   * 얼굴 데이터 포괄적 추출 (모든 감지 + 통계)
   */
  private extractFaceDataComprehensive(faceDetection: unknown[]): { faceInteractions: FaceData[], faceDetails: ExtractedAnalysisData['faceDetails'] } {
    const faceData: FaceData[] = [];
    const faceSizes: number[] = [];
    let totalDetections = 0;
    
    faceDetection.forEach((face) => {
      const faceRecord = face as Record<string, unknown>;
      const tracks = faceRecord.tracks as Array<Record<string, unknown>> ?? [];
      tracks.forEach((track: Record<string, unknown>) => {
        const timestampedObjects = track.timestampedObjects as Array<Record<string, unknown>> ?? [];
        timestampedObjects.forEach((obj: Record<string, unknown>) => {
          // 🔄 모든 얼굴 감지 포함 (필터링 없음)
          if (obj.normalizedBoundingBox) {
            const boundingBoxData = obj.normalizedBoundingBox as Record<string, number>;
            const bbox = {
              left: boundingBoxData.left ?? 0,
              top: boundingBoxData.top ?? 0,
              right: boundingBoxData.right ?? 1,
              bottom: boundingBoxData.bottom ?? 1
            };
            
            const faceSize = (bbox.right - bbox.left) * (bbox.bottom - bbox.top);
            faceSizes.push(faceSize);
            
            faceData.push({
              boundingBox: bbox,
              time: this.parseTimeOffset(obj.timeOffset)
            });
            totalDetections++;
          }
        });
      });
    });

    // 얼굴 크기 분포 계산
    const sizeBins = [0, 0.01, 0.05, 0.1, 0.2, 1.0];
    const faceSizeDistribution = sizeBins.slice(0, -1).map((bin, i) => {
      const nextBin = sizeBins[i + 1];
      const count = faceSizes.filter(s => s >= bin && s < nextBin).length;
      return { size: bin, count };
    });

    const avgFaceSize = faceSizes.length > 0 ? faceSizes.reduce((a, b) => a + b, 0) / faceSizes.length : 0;
    
    // 시간 범위 계산
    const times = faceData.map(f => f.time);
    const totalDuration = times.length > 0 ? Math.max(...times) - Math.min(...times) : 0;
    const facePresenceRatio = totalDuration > 0 ? (times.length * 0.5) / totalDuration : 0; // 대략적 추정

    const faceDetails = {
      totalDetections,
      avgFaceSize,
      facePresenceRatio: Math.min(facePresenceRatio, 1),
      faceSizeDistribution
    };

    const sortedFaceData = faceData.sort((a, b) => a.time - b.time);
    logger.info(`😊 Comprehensive face data: ${sortedFaceData.length} detections, avg size: ${avgFaceSize.toFixed(4)}`);
    
    return { faceInteractions: sortedFaceData, faceDetails };
  }

  /**
   * 객체 이벤트 포괄적 추출 (낮은 신뢰도도 포함)
   */
  private extractObjectEventsComprehensive(objectTracking: unknown[]): ExtractedAnalysisData['objectEvents'] {
    const objectEvents: ExtractedAnalysisData['objectEvents'] = [];
    
    objectTracking.forEach((obj) => {
      const objData = obj as Record<string, unknown>;
      const entity = objData.entity as Record<string, unknown>;
      const objectName = (entity?.description as string) ?? 'unknown';
      const events: unknown[] = [];
      const confidences: number[] = [];
      
      const tracks = objData.tracks as Array<Record<string, unknown>> ?? [];
      tracks.forEach((track: Record<string, unknown>) => {
        const timestampedObjects = track.timestampedObjects as Array<Record<string, unknown>> ?? [];
        timestampedObjects.forEach((timestampedObj: Record<string, unknown>) => {
          const confidence = (timestampedObj.confidence as number) ?? 0;
          
          // 🔄 신뢰도 조건 대폭 완화: 0.1 이상 (거의 모든 감지 포함)
          if (confidence >= 0.1 && timestampedObj.normalizedBoundingBox) {
            const bboxData = timestampedObj.normalizedBoundingBox as Record<string, number>;
            const bbox = {
              left: bboxData.left ?? 0,
              top: bboxData.top ?? 0,
              right: bboxData.right ?? 1,
              bottom: bboxData.bottom ?? 1
            };
            
            events.push({
              time: this.parseTimeOffset(timestampedObj.timeOffset),
              confidence,
              bbox,
              size: (bbox.right - bbox.left) * (bbox.bottom - bbox.top),
              center: [(bbox.left + bbox.right) / 2, (bbox.top + bbox.bottom) / 2]
            });
            confidences.push(confidence);
          }
        });
      });
      
      if (events.length > 0) {
        const sortedEvents = events.sort((a: unknown, b: unknown) => {
          const aTime = (a as {time: number}).time;
          const bTime = (b as {time: number}).time;
          return aTime - bTime;
        });
        const avgConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
        const firstEvent = sortedEvents[0] as {time: number};
        const lastEvent = sortedEvents[sortedEvents.length - 1] as {time: number};
        const totalDuration = sortedEvents.length > 1 
          ? lastEvent.time - firstEvent.time 
          : 0;
        
        objectEvents.push({
          objectId: (entity?.entityId as string) ?? `obj_${objectEvents.length}`,
          objectName,
          confidence: Math.max(...confidences), // 최고 신뢰도
          events: sortedEvents as Array<{time: number; confidence: number; bbox: {left: number; top: number; right: number; bottom: number}; size: number; center: [number, number]}>,
          totalDuration,
          avgConfidence
        });
      }
    });

    logger.info(`🧸 Comprehensive object events: ${objectEvents.length} objects, ${objectEvents.reduce((sum, o) => sum + o.events.length, 0)} total events`);
    return objectEvents;
  }

  /**
   * 장면 메타데이터 포괄적 추출 (품질 평가 포함)
   */
  private extractSceneMetadataComprehensive(
    rawResults: VideoIntelligenceResults,
    personMovements: ExtractedAnalysisData['personMovements'],
    speechData: TranscriptEntry[],
    faceInteractions: FaceData[],
    objectEvents: ExtractedAnalysisData['objectEvents']
  ): ExtractedAnalysisData['sceneMetadata'] {
    // 전체 시간 계산 (더 정확하게)
    const allTimes: number[] = [];
    
    // 모든 소스에서 시간 정보 수집
    personMovements.forEach(person => {
      person.movements.forEach((m: {time: number}) => allTimes.push(m.time));
    });
    
    speechData.forEach((entry: TranscriptEntry) => allTimes.push(entry.time));
    faceInteractions.forEach((f: FaceData) => allTimes.push(f.time));
    objectEvents.forEach(obj => {
      obj.events.forEach((e: {time: number}) => allTimes.push(e.time));
    });
    
    const totalDuration = allTimes.length > 0 ? Math.max(...allTimes) - Math.min(...allTimes) : 0;
    
    // 장면 변화 (더 상세히)
    const shotChanges = rawResults.shotChanges?.map(shot => ({
      time: this.parseTimeOffset(shot.startTimeOffset),
      duration: this.parseTimeOffset(shot.endTimeOffset) - this.parseTimeOffset(shot.startTimeOffset)
    })) ?? [];
    
    // 참여자 수 (person detection 기준)
    const participantCount = personMovements.length;
    
    // 전체 신뢰도 계산
    const allConfidences: number[] = [];
    objectEvents.forEach(obj => {
      obj.events.forEach((e: {confidence: number}) => {
        if (e.confidence > 0) {
          allConfidences.push(e.confidence);
        }
      });
    });
    
    const averageConfidence = allConfidences.length > 0 
      ? allConfidences.reduce((a, b) => a + b, 0) / allConfidences.length 
      : 0;

    // 품질 평가
    const qualityMetrics = {
      personDetectionQuality: this.assessPersonDetectionQuality(personMovements),
      speechTranscriptionQuality: this.assessSpeechQuality(speechData),
      objectDetectionQuality: this.assessObjectDetectionQuality(objectEvents),
      overallDataQuality: 'good' as const
    };
    
    // 전체 품질 평가
    const qualityScores = {
      excellent: 4, good: 3, fair: 2, poor: 1
    };
    const avgQualityScore = (
      qualityScores[qualityMetrics.personDetectionQuality] +
      qualityScores[qualityMetrics.speechTranscriptionQuality] +
      qualityScores[qualityMetrics.objectDetectionQuality]
    ) / 3;
    
    if (avgQualityScore >= 3.5) {
      qualityMetrics.overallDataQuality = 'excellent';
    } else if (avgQualityScore >= 2.5) {
      qualityMetrics.overallDataQuality = 'good';
    } else if (avgQualityScore >= 1.5) {
      qualityMetrics.overallDataQuality = 'fair';
    } else {
      qualityMetrics.overallDataQuality = 'poor';
    }

    logger.info(`🎬 Comprehensive scene metadata: ${totalDuration.toFixed(1)}s, ${participantCount} participants, ${shotChanges.length} scenes, quality: ${qualityMetrics.overallDataQuality}`);

    return {
      totalDuration,
      shotChanges,
      participantCount,
      averageConfidence,
      qualityMetrics
    };
  }

  /**
   * 시간선 이벤트 생성 (분석을 위한 통합 타임라인)
   */
  private generateTimelineEvents(
    rawResults: VideoIntelligenceResults,
    personMovements: ExtractedAnalysisData['personMovements'],
    speechData: TranscriptEntry[],
    faceInteractions: FaceData[],
    objectEvents: ExtractedAnalysisData['objectEvents']
  ): ExtractedAnalysisData['timelineEvents'] {
    const events: ExtractedAnalysisData['timelineEvents'] = [];

    // 사람 감지 이벤트
    personMovements.forEach(person => {
      person.movements.forEach((movement: {time: number; confidence?: number; size: number}) => {
        events.push({
          time: movement.time,
          type: 'person_detected',
          details: { personId: person.personId, confidence: movement.confidence, size: movement.size }
        });
      });
    });

    // 얼굴 감지 이벤트
    faceInteractions.forEach(face => {
      events.push({
        time: face.time,
        type: 'face_detected',
        details: { faceSize: (face.boundingBox.right - face.boundingBox.left) * (face.boundingBox.bottom - face.boundingBox.top) }
      });
    });

    // 음성 이벤트
    speechData.forEach((speech: TranscriptEntry) => {
      events.push({
        time: speech.time,
        type: 'speech_start',
        details: { speaker: speech.speaker, text: speech.text.substring(0, 50) + (speech.text.length > 50 ? '...' : '') }
      });
    });

    // 객체 감지 이벤트
    objectEvents.forEach(obj => {
      obj.events.forEach((event: {time: number; confidence: number; size: number}) => {
        events.push({
          time: event.time,
          type: 'object_detected',
          details: { objectName: obj.objectName, confidence: event.confidence, size: event.size }
        });
      });
    });

    // 장면 변화 이벤트
    rawResults.shotChanges?.forEach(shot => {
      events.push({
        time: this.parseTimeOffset(shot.startTimeOffset),
        type: 'scene_change',
        details: { duration: this.parseTimeOffset(shot.endTimeOffset) - this.parseTimeOffset(shot.startTimeOffset) }
      });
    });

    const sortedEvents = events.sort((a, b) => a.time - b.time);
    logger.info(`📅 Generated timeline: ${sortedEvents.length} events`);
    
    return sortedEvents;
  }

  // 품질 평가 메서드들
  private assessPersonDetectionQuality(personMovements: ExtractedAnalysisData['personMovements']): 'excellent' | 'good' | 'fair' | 'poor' {
    if (personMovements.length >= 2 && personMovements.reduce((sum, p) => sum + p.movements.length, 0) > 100) {
      return 'excellent';
    }
    if (personMovements.length >= 1 && personMovements.reduce((sum, p) => sum + p.movements.length, 0) > 50) {
      return 'good';
    }
    if (personMovements.length >= 1 && personMovements.reduce((sum, p) => sum + p.movements.length, 0) > 20) {
      return 'fair';
    }
    return 'poor';
  }

  private assessSpeechQuality(speechData: TranscriptEntry[]): 'excellent' | 'good' | 'fair' | 'poor' {
    if (speechData.length > 20) {
      return 'excellent';
    }
    if (speechData.length > 10) {
      return 'good';
    }
    if (speechData.length > 5) {
      return 'fair';
    }
    return 'poor';
  }

  private assessObjectDetectionQuality(objectEvents: ExtractedAnalysisData['objectEvents']): 'excellent' | 'good' | 'fair' | 'poor' {
    const totalEvents = objectEvents.reduce((sum, o) => sum + o.events.length, 0);
    if (objectEvents.length > 5 && totalEvents > 50) {
      return 'excellent';
    }
    if (objectEvents.length > 3 && totalEvents > 20) {
      return 'good';
    }
    if (objectEvents.length > 1 && totalEvents > 10) {
      return 'fair';
    }
    return 'poor';
  }

  /**
   * 시간 오프셋 파싱
   */
  private parseTimeOffset(timeOffset: unknown): number {
    if (!timeOffset) {
      return 0;
    }
    
    if (typeof timeOffset === 'string') {
      return parseFloat(timeOffset);
    }
    
    const timeOffsetObj = timeOffset as Record<string, unknown>;
    if (timeOffsetObj.seconds !== undefined) {
      const seconds = parseInt(timeOffsetObj.seconds as string) ?? 0;
      const nanos = parseInt(timeOffsetObj.nanos as string) ?? 0;
      return seconds + nanos / 1e9;
    }
    
    return 0;
  }
} 