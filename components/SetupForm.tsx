import React, { useState } from 'react';
import { QuizConfig, QuizMode } from '../types';

interface SetupFormProps {
  onStart: (config: QuizConfig) => void;
  isLoading: boolean;
}

const SetupForm: React.FC<SetupFormProps> = ({ onStart, isLoading }) => {
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState<number>(5);
  const [mode, setMode] = useState<QuizMode>('random');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    onStart({ topic, count, mode });
  };

  const getModeStyles = (m: QuizMode) => {
    const base = "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all cursor-pointer text-center space-y-2 h-full";
    if (mode === m) {
      return `${base} border-indigo-600 bg-indigo-50 text-indigo-900 shadow-sm`;
    }
    return `${base} border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-600`;
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
      <div className="bg-slate-900 p-8 text-white text-center relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500 rounded-full opacity-20 blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500 rounded-full opacity-20 blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl mb-4 shadow-lg border-4 border-indigo-500 transform -rotate-3 hover:rotate-3 transition-transform duration-300">
                👩‍⚕️
            </div>
            <h1 className="text-4xl font-brand mb-2 tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-white">
                Dr. Probe
            </h1>
            <p className="text-slate-300 font-medium">Targeted practice for PG entrance</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        
        <div className="space-y-3">
          <label htmlFor="topic" className="block text-sm font-semibold text-slate-700 uppercase tracking-wider">
            Target Topic
          </label>
          <div className="relative">
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., 'behavioural problems due to relationships'"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-800 placeholder-slate-400"
              disabled={isLoading}
              autoFocus
            />
            <p className="mt-2 text-xs text-slate-500">
              Be vague or precise, Dr. Probe adapts!
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center mb-2">
            <span className="block text-sm font-semibold text-slate-700 uppercase tracking-wider">
              Exam Mode
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
             <button type="button" onClick={() => setMode('random')} className={getModeStyles('random')} disabled={isLoading}>
                <div className="font-bold text-lg">Standard</div>
                <div className="text-xs opacity-80 leading-tight">Balanced mix of difficulty</div>
             </button>
             <button type="button" onClick={() => setMode('hard')} className={getModeStyles('hard')} disabled={isLoading}>
                <div className="font-bold text-lg">Hard</div>
                <div className="text-xs opacity-80 leading-tight">Deep concepts & correlation</div>
             </button>
             <button type="button" onClick={() => setMode('tricky')} className={getModeStyles('tricky')} disabled={isLoading}>
                <div className="font-bold text-lg">Tricky</div>
                <div className="text-xs opacity-80 leading-tight">Subtle traps & confusers</div>
             </button>
          </div>
        </div>

        <div className="space-y-3">
          <span className="block text-sm font-semibold text-slate-700 uppercase tracking-wider">
            Question Count
          </span>
          <div className="flex gap-4">
            {[5, 10, 20].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setCount(val)}
                disabled={isLoading}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                  count === val
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 ring-2 ring-indigo-600 ring-offset-2'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {val} Questions
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={!topic.trim() || isLoading}
          className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all transform active:scale-95 ${
            !topic.trim() || isLoading
              ? 'bg-slate-800 cursor-not-allowed shadow-none'
              : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-indigo-200'
          }`}
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-1.5 py-1">
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Generating Exam...</span>
              </div>
              <span className="text-xs font-normal text-slate-300 animate-pulse">
                Dr. Probe is scanning her archives...
              </span>
            </div>
          ) : (
            'Start Assessment'
          )}
        </button>
      </form>
    </div>
  );
};

export default SetupForm;