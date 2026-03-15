import React, { useState } from 'react';
import { Question } from '../types';

interface ResultsViewProps {
  questions: Question[];
  userAnswers: Map<number, number>;
  onRestart: () => void;
  onRepeat: () => void;
  isLoading: boolean;
}

const ResultsView: React.FC<ResultsViewProps> = ({ questions, userAnswers, onRestart, onRepeat, isLoading }) => {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const toggleExplanation = (index: number) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setExpandedIds(newSet);
  };

  let score = 0;
  questions.forEach((q, idx) => {
    if (userAnswers.get(idx) === q.correctAnswerIndex) {
      score++;
    }
  });

  const percentage = Math.round((score / questions.length) * 100);

  const getDifficultyColor = (d: string) => {
    switch (d) {
      case 'E': return 'bg-green-100 text-green-800 border-green-200';
      case 'M': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'H': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getPrecisionColor = (p: string) => {
    switch (p) {
      case 'High': return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      case 'Med': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Low': return 'text-slate-500 bg-slate-100 border-slate-200';
      default: return 'text-slate-500';
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 relative">
      {/* Score Header */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
        <div className="bg-slate-900 text-white p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-indigo-600 opacity-10 transform -skew-y-6 origin-top-left"></div>
            <h2 className="text-3xl font-bold relative z-10 font-brand">Assessment Complete</h2>
            <div className="mt-6 inline-block relative z-10">
                <span className="text-6xl font-extrabold tracking-tight">{score}</span>
                <span className="text-2xl text-slate-400 font-medium">/{questions.length}</span>
            </div>
            <p className="mt-4 text-slate-400 relative z-10">
                You scored {percentage}%. 
                {percentage >= 80 ? ' Excellent work!' : percentage >= 50 ? ' Good effort.' : ' Keep practicing.'}
            </p>
        </div>
        
        {/* Actions Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-center gap-4">
            {/* New Topic (Primary) */}
            <button 
                onClick={onRestart}
                disabled={isLoading}
                className="py-3 px-6 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg transition-all flex items-center justify-center gap-2 shadow-md active:scale-95"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Take New Test
            </button>

            {/* Repeat Topic (Secondary) */}
            <button 
                onClick={onRepeat}
                disabled={isLoading}
                className={`py-3 px-6 rounded-xl font-semibold transition-all shadow-sm flex items-center justify-center gap-2 border ${
                  isLoading 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-800'
                }`}
            >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Repeat This Topic
                  </>
                )}
            </button>
        </div>
      </div>

      {/* Questions Review */}
      <div className="space-y-6">
        {questions.map((q, idx) => {
            const userAnswer = userAnswers.get(idx);
            const isCorrect = userAnswer === q.correctAnswerIndex;
            const isExpanded = expandedIds.has(idx);

            return (
                <div key={q.id} className={`bg-white rounded-xl border-l-4 shadow-sm p-6 transition-all duration-300 ${isCorrect ? 'border-green-500' : 'border-red-500'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex flex-wrap gap-2">
                           <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getDifficultyColor(q.difficulty)}`}>
                              {q.difficulty === 'E' ? 'Easy' : q.difficulty === 'M' ? 'Moderate' : 'Hard'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getPrecisionColor(q.precision)}`}>
                              Precision: {q.precision}
                          </span>
                      </div>
                      
                      {/* Info Button for Explanation */}
                      <button 
                        onClick={() => toggleExplanation(idx)}
                        className={`p-2 rounded-full transition-colors flex-shrink-0 ${
                          isExpanded 
                            ? 'bg-indigo-100 text-indigo-700' 
                            : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                        }`}
                        title="Show Strategic Explanation"
                      >
                         <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                         </svg>
                      </button>
                    </div>

                    <h3 className="text-lg text-slate-800 font-medium mb-4 leading-relaxed">
                        <span className="text-slate-400 mr-2">{idx + 1}.</span>
                        {q.text}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        {q.options.map((opt, optIdx) => {
                            const isSelected = userAnswer === optIdx;
                            const isTarget = q.correctAnswerIndex === optIdx;
                            
                            let style = "border-slate-200 bg-white text-slate-600";
                            let icon = null;

                            if (isTarget) {
                                style = "border-green-500 bg-green-50 text-green-900 font-medium";
                                icon = <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
                            } else if (isSelected && !isCorrect) {
                                style = "border-red-300 bg-red-50 text-red-900";
                                icon = <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
                            }

                            return (
                                <div key={optIdx} className={`p-3 rounded-lg border flex items-center justify-between text-sm ${style}`}>
                                    <span>{opt}</span>
                                    {icon}
                                </div>
                            );
                        })}
                    </div>

                    {/* Expandable Explanation Card */}
                    {isExpanded && (
                      <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-lg p-5 animate-fade-in-down">
                        <div className="flex gap-3">
                          <div className="mt-0.5">
                            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-indigo-800 uppercase tracking-wide mb-1">Strategic Approach</h4>
                            <p className="text-indigo-900 text-sm leading-relaxed">
                              {q.explanation}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
            );
        })}
      </div>
    </div>
  );
};

export default ResultsView;