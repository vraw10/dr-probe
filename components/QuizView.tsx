import React, { useState } from 'react';
import { Question } from '../types';

interface QuizViewProps {
  questions: Question[];
  onComplete: (userAnswers: Map<number, number>) => void;
  topic: string;
}

const QuizView: React.FC<QuizViewProps> = ({ questions, onComplete, topic }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, number>>(new Map());

  const currentQuestion = questions[currentIndex];
  const total = questions.length;

  const handleSelectOption = (optionIndex: number) => {
    setAnswers(prev => new Map(prev).set(currentIndex, optionIndex));
  };

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete(answers);
    }
  };

  const isCurrentAnswered = answers.has(currentIndex);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Sticky Progress Bar */}
      <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200 -mx-4 px-6 py-4 mb-6 sm:mx-0 sm:rounded-xl sm:border sm:top-20 transition-all">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Progress
          </span>
          <span className="text-sm font-bold text-indigo-900">
             {currentIndex + 1} <span className="text-slate-400 font-normal">/ {total}</span>
          </span>
        </div>
        <div className="flex gap-1.5 sm:gap-2">
          {questions.map((_, idx) => {
            let statusClass = "bg-slate-200"; // Future
            if (idx < currentIndex) {
                statusClass = "bg-indigo-600"; // Completed
            } else if (idx === currentIndex) {
                statusClass = "bg-indigo-600 ring-2 ring-indigo-200 ring-offset-1"; // Current
            }
            
            return (
              <div
                key={idx}
                className={`h-2 rounded-full flex-1 transition-all duration-300 ${statusClass}`}
              />
            );
          })}
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden min-h-[400px] flex flex-col">
        {/* Badges */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex gap-2">
        </div>

        <div className="p-6 md:p-8 flex-grow">
          <h3 className="text-xl md:text-2xl font-medium text-slate-800 leading-relaxed mb-8">
            {currentQuestion.text}
          </h3>

          <div className="space-y-4">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = answers.get(currentIndex) === idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3 group ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 group-hover:border-slate-400'
                  }`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <span className={`text-lg ${isSelected ? 'text-indigo-900 font-medium' : 'text-slate-700'}`}>
                    {option}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-between items-center sticky bottom-0">
          <button
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentIndex === 0
                ? 'text-slate-300 cursor-not-allowed'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            Previous
          </button>

          <button
            onClick={handleNext}
            disabled={!isCurrentAnswered}
            className={`px-8 py-3 rounded-lg text-white font-semibold shadow-md transition-all ${
              !isCurrentAnswered
                ? 'bg-slate-300 cursor-not-allowed shadow-none'
                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg active:transform active:scale-95'
            }`}
          >
            {currentIndex === total - 1 ? 'Submit Test' : 'Next Question'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizView;