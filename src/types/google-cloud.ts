// Google Cloud Video Intelligence API 응답 타입 정의

export interface VideoIntelligenceAnnotationResults {
  objectAnnotations?: ObjectAnnotation[];
  personDetectionAnnotations?: PersonDetectionAnnotation[];
  frameLabelAnnotations?: LabelAnnotation[];
  segmentLabelAnnotations?: LabelAnnotation[];
  shotAnnotations?: VideoSegment[];
  textAnnotations?: TextAnnotation[];
}

export interface ObjectAnnotation {
  entity?: Entity;
  confidence?: number;
  frames?: ObjectFrame[];
  segment?: VideoSegment;
}

export interface PersonDetectionAnnotation {
  tracks?: Track[];
  version?: string;
}

export interface Track {
  segment?: VideoSegment;
  timestampedObjects?: TimestampedObject[];
  attributes?: DetectedAttribute[];
  confidence?: number;
}

export interface TimestampedObject {
  normalizedBoundingBox?: BoundingBox;
  timeOffset?: Duration;
  attributes?: DetectedAttribute[];
  landmarks?: DetectedLandmark[];
}

export interface LabelAnnotation {
  entity?: Entity;
  categoryEntities?: Entity[];
  segments?: LabelSegment[];
  frames?: LabelFrame[];
}

export interface Entity {
  entityId?: string;
  description?: string;
  languageCode?: string;
}

export interface LabelSegment {
  segment?: VideoSegment;
  confidence?: number;
}

export interface LabelFrame {
  timeOffset?: Duration;
  confidence?: number;
}

export interface VideoSegment {
  startTimeOffset?: Duration;
  endTimeOffset?: Duration;
}

export interface Duration {
  seconds?: number | string;
  nanos?: number;
}

export interface ObjectFrame {
  normalizedBoundingBox?: BoundingBox;
  timeOffset?: Duration;
}

export interface BoundingBox {
  left?: number;
  top?: number;
  right?: number;
  bottom?: number;
}

export interface TextAnnotation {
  text?: string;
  segments?: VideoSegment[];
}

export interface DetectedAttribute {
  name?: string;
  confidence?: number;
  value?: string;
}

export interface DetectedLandmark {
  name?: string;
  point?: NormalizedVertex;
  confidence?: number;
}

export interface NormalizedVertex {
  x?: number;
  y?: number;
}

// 전체 API 응답 타입
export interface VideoIntelligenceResponse {
  annotationResults?: VideoIntelligenceAnnotationResults[];
  name?: string;
  metadata?: Record<string, unknown>;
  done?: boolean;
  error?: {
    code?: number;
    message?: string;
    details?: Record<string, unknown>[];
  };
} 