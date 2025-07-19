import fs from 'fs';
import path from 'path';
import config from './config';
import { PlayAnalysisSession, PlayEvaluationResult, AnalysisReport, IntegratedAnalysisResult } from '@/types';
import { Logger } from './services/logger';

const logger = new Logger('PlayDataStorage');