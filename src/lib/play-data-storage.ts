import fs from 'fs';
import path from 'path';
import { PlayAnalysisSession, PlayEvaluationResult, AnalysisReport, IntegratedAnalysisResult } from '@/types';
import config from './config';
import { Logger } from './services/logger';

const logger = new Logger('PlayDataStorage');