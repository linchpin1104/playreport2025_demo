'use client';

import React, { useState } from 'react';
import VideoUpload from '@/components/video-upload';
import AnalysisResults from '@/components/analysis-results';
import DevModeToggle from '@/components/dev-mode-toggle';
import { FileUploadResponse, VideoIntelligenceResults, AIAnalysisResponse } from '@/types';

export default function HomePage() {
  const [uploadedFile, setUploadedFile] = useState<FileUploadResponse | null>(null);
  const [analysisResults, setAnalysisResults] = useState<VideoIntelligenceResults | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'upload' | 'analyzing' | 'results' | 'generating' | 'complete'>('upload');

  const handleUploadSuccess = async (response: FileUploadResponse) => {
    setUploadedFile(response);
    setCurrentStep('analyzing');
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Step 1: Analyze video with Cloud Video Intelligence
      const analysisResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gsUri: response.gsUri,
          fileName: response.fileName,
        }),
      });

      if (!analysisResponse.ok) {
        throw new Error('비디오 분석에 실패했습니다.');
      }

      const analysisData = await analysisResponse.json();
      
      if (!analysisData.success) {
        throw new Error(analysisData.error || '비디오 분석에 실패했습니다.');
      }

      setAnalysisResults(analysisData.results);
      setCurrentStep('results');
      
    } catch (error) {
      setError(error instanceof Error ? error.message : '분석 중 오류가 발생했습니다.');
      setCurrentStep('upload');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!analysisResults) return;
    
    setCurrentStep('generating');
    setIsGeneratingReport(true);
    setError(null);
    
    try {
      // Step 2: Generate AI report
      const reportResponse = await fetch('/api/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoIntelligenceResults: analysisResults,
          childAge: 5, // TODO: Get from user input
          parentGender: 'female', // TODO: Get from user input
          playType: 'collaborative', // TODO: Get from user input
        }),
      });

      if (!reportResponse.ok) {
        throw new Error('레포트 생성에 실패했습니다.');
      }

      const reportData = await reportResponse.json();
      
      if (!reportData.success) {
        throw new Error(reportData.error || '레포트 생성에 실패했습니다.');
      }

      setAiAnalysis(reportData.analysis);
      setCurrentStep('complete');
      
    } catch (error) {
      setError(error instanceof Error ? error.message : '레포트 생성 중 오류가 발생했습니다.');
      setCurrentStep('results');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleUploadError = (error: string) => {
    setError(error);
  };

  const handleReset = () => {
    setUploadedFile(null);
    setAnalysisResults(null);
    setAiAnalysis(null);
    setError(null);
    setCurrentStep('upload');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            놀이영상 분석 서비스
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            부모와 아이의 놀이상호작용을 분석하여 전문적인 레포트를 제공합니다
          </p>
        </div>

        {/* Progress Steps */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-4">
              {/* Step 1: Upload */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium ${
                currentStep === 'upload' ? 'bg-blue-500' : 
                ['analyzing', 'results', 'generating', 'complete'].includes(currentStep) ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                {['analyzing', 'results', 'generating', 'complete'].includes(currentStep) ? '✓' : '1'}
              </div>
              <span className="text-sm font-medium text-gray-700">업로드</span>
              <div className="w-8 h-0.5 bg-gray-300"></div>

              {/* Step 2: Analysis */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium ${
                currentStep === 'analyzing' ? 'bg-blue-500' : 
                ['results', 'generating', 'complete'].includes(currentStep) ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                {['results', 'generating', 'complete'].includes(currentStep) ? '✓' : '2'}
              </div>
              <span className="text-sm font-medium text-gray-700">분석</span>
              <div className="w-8 h-0.5 bg-gray-300"></div>

              {/* Step 3: Results */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium ${
                currentStep === 'results' ? 'bg-blue-500' : 
                ['generating', 'complete'].includes(currentStep) ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                {['generating', 'complete'].includes(currentStep) ? '✓' : '3'}
              </div>
              <span className="text-sm font-medium text-gray-700">결과</span>
              <div className="w-8 h-0.5 bg-gray-300"></div>

              {/* Step 4: Report */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium ${
                currentStep === 'generating' ? 'bg-blue-500' : 
                currentStep === 'complete' ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                {currentStep === 'complete' ? '✓' : '4'}
              </div>
              <span className="text-sm font-medium text-gray-700">레포트</span>
              <div className="w-8 h-0.5 bg-gray-300"></div>

              {/* Step 5: Complete */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium ${
                currentStep === 'complete' ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                ✓
              </div>
              <span className="text-sm font-medium text-gray-700">완료</span>
            </div>
          </div>
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              {currentStep === 'upload' && '놀이영상을 업로드해주세요'}
              {currentStep === 'analyzing' && '비디오를 분석하고 있습니다...'}
              {currentStep === 'results' && '분석 결과를 확인하세요'}
              {currentStep === 'generating' && 'AI 레포트를 생성하고 있습니다...'}
              {currentStep === 'complete' && '분석이 완료되었습니다!'}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">오류가 발생했습니다</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          {/* Development Mode Toggle */}
          <DevModeToggle />
          
          {/* Upload Step */}
          {currentStep === 'upload' && (
            <VideoUpload 
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
              isLoading={isAnalyzing}
            />
          )}

          {/* Analyzing Step */}
          {currentStep === 'analyzing' && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">비디오 분석 중...</h3>
              <p className="text-gray-600">영상을 분석하고 있습니다. 잠시만 기다려주세요.</p>
              <p className="text-sm text-gray-500 mt-2">분석에는 몇 분이 소요될 수 있습니다.</p>
            </div>
          )}

          {/* Results Step */}
          {currentStep === 'results' && analysisResults && (
            <div>
              <AnalysisResults 
                results={analysisResults}
                uploadedFile={uploadedFile}
                onGenerateReport={handleGenerateReport}
                onReset={handleReset}
              />
            </div>
          )}

          {/* Generating Report Step */}
          {currentStep === 'generating' && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">AI 레포트 생성 중...</h3>
              <p className="text-gray-600">분석 결과를 바탕으로 전문적인 레포트를 생성하고 있습니다.</p>
              <p className="text-sm text-gray-500 mt-2">AI 분석에는 1-2분이 소요됩니다.</p>
            </div>
          )}

          {/* Complete Step */}
          {currentStep === 'complete' && aiAnalysis && (
            <div>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">분석 완료!</h2>
                <p className="text-gray-600">놀이상호작용 분석이 완료되었습니다.</p>
              </div>
              
              {/* AI Analysis Results would go here */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-medium mb-4">AI 분석 레포트</h3>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(aiAnalysis, null, 2)}
                </pre>
              </div>
              
              <div className="mt-6 text-center">
                <button
                  onClick={handleReset}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  새로운 분석 시작
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 