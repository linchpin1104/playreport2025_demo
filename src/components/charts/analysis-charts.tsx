'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { ChartData, DevelopmentIndicators } from '@/types';

interface AnalysisChartsProps {
  visualizations: ChartData[];
  developmentIndicators: DevelopmentIndicators;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AnalysisCharts({ visualizations, developmentIndicators }: AnalysisChartsProps) {
  const renderChart = (chart: ChartData, index: number) => {
    switch (chart.type) {
      case 'bar':
        return (
          <div key={index} className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">{chart.title}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chart.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={chart.xAxis || 'name'} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey={chart.yAxis || 'value'} fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      
      case 'pie':
        return (
          <div key={index} className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">{chart.title}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chart.data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="score"
                >
                  {chart.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );
      
      case 'line':
        return (
          <div key={index} className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">{chart.title}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chart.data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={chart.xAxis || 'time'} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey={chart.yAxis || 'value'} stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      
      case 'timeline':
        return (
          <div key={index} className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">{chart.title}</h3>
            <div className="space-y-4">
              {chart.data.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-4">
                  <div className="w-16 text-sm text-gray-500">{item.time}</div>
                  <div className="flex-1 bg-gray-100 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.person}</span>
                      <span className="text-sm text-gray-600">{item.emotion}</span>
                    </div>
                    <div className="mt-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${item.intensity * 10}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const developmentData = [
    { name: '언어', score: developmentIndicators.language.score, color: '#0088FE' },
    { name: '사회성', score: developmentIndicators.social.score, color: '#00C49F' },
    { name: '인지', score: developmentIndicators.cognitive.score, color: '#FFBB28' },
    { name: '운동', score: developmentIndicators.motor.score, color: '#FF8042' },
    { name: '정서', score: developmentIndicators.emotional.score, color: '#8884D8' },
  ];

  return (
    <div className="space-y-6">
      {/* Development Indicators Overview */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">발달 지표 종합</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {developmentData.map((item, index) => (
            <div key={index} className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-2">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="#e5e7eb"
                    strokeWidth="4"
                    fill="none"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke={item.color}
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${(item.score / 100) * 176} 176`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-semibold">{item.score}</span>
                </div>
              </div>
              <div className="text-sm font-medium text-gray-700">{item.name}</div>
            </div>
          ))}
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={developmentData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Bar dataKey="score" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Individual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {visualizations.map((chart, index) => renderChart(chart, index))}
      </div>

      {/* Development Details */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">발달 영역별 세부 분석</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(developmentIndicators).map(([key, indicator]) => (
            <div key={key} className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3 capitalize">
                {key === 'language' ? '언어' : 
                 key === 'social' ? '사회성' : 
                 key === 'cognitive' ? '인지' : 
                 key === 'motor' ? '운동' : 
                 key === 'emotional' ? '정서' : key}
              </h4>
              
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">점수</span>
                  <span className="text-sm font-medium">{indicator.score}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${indicator.score}%` }}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-1">관찰 사항</h5>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {indicator.observations.map((obs: string, idx: number) => (
                      <li key={idx} className="flex items-start">
                        <span className="inline-block w-1 h-1 bg-gray-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                        <span>{obs}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-1">추천 사항</h5>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {indicator.recommendations.map((rec: string, idx: number) => (
                      <li key={idx} className="flex items-start">
                        <span className="inline-block w-1 h-1 bg-blue-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 