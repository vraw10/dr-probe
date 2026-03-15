import React, { useState } from 'react';
import { AppStep, Question, QuizConfig } from './types';
import SetupForm from './components/SetupForm';
import QuizView from './components/QuizView';
import ResultsView from './components/ResultsView';
import { generateQuestions } from './services/geminiService';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('setup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<QuizConfig | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Map<number, number>>(new Map());

  const handleStart = async (newConfig: QuizConfig) => {
    setLoading(true);
    setError(null);
    setConfig(newConfig);
    
    try {
      const generatedQuestions = await generateQuestions(
        newConfig.topic,
        newConfig.count,
        newConfig.mode,
        []
      );
      setQuestions(generatedQuestions);
      setStep('quiz');
    } catch (err: any) {
      setError(err.message || "Something went wrong generating questions.");
    } finally {
      setLoading(false);
    }
  };

  const handleRepeat = async () => {
    if (!config) return;
    setLoading(true);
    setError(null);
    
    try {
      // Pass the current question texts to avoid repetitions
      const previousStems = questions.map(q => q.text);
      const generatedQuestions = await generateQuestions(
        config.topic,
        config.count,
        config.mode,
        previousStems
      );
      
      setQuestions(generatedQuestions);
      setUserAnswers(new Map()); // Reset answers
      setStep('quiz');
    } catch (err: any) {
      setError(err.message || "Something went wrong generating new questions.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuizComplete = (answers: Map<number, number>) => {
    setUserAnswers(answers);
    setStep('results');
  };

  const handleRestart = () => {
    setStep('setup');
    setQuestions([]);
    setUserAnswers(new Map());
    setConfig(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative">
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white border-2 border-indigo-500 shadow-lg transform -rotate-3 hover:rotate-0 transition-all cursor-pointer">
               <span className="text-xl filter drop-shadow">👩‍⚕️</span>
             </div>
             <span className="font-brand text-2xl tracking-wide text-slate-900 relative">
               Dr. Probe
               <span className="absolute -top-1 -right-2 w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
             </span>
           </div>
           
           <div className="flex items-center gap-3">
             {step !== 'setup' && config && step !== 'results' && (
               <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-block px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-500">
                    {config.topic}
                  </span>
                  <span className={`hidden sm:inline-block px-3 py-1 rounded-full text-xs font-medium border ${
                     config.mode === 'hard' ? 'bg-red-50 text-red-600 border-red-200' : 
                     config.mode === 'tricky' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                     'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>
                    {config.mode === 'random' ? 'Standard' : config.mode === 'hard' ? 'Hard' : 'Tricky'}
                  </span>
               </div>
             )}
           </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             {error}
          </div>
        )}

        {step === 'setup' && (
          <SetupForm onStart={handleStart} isLoading={loading} />
        )}

        {step === 'quiz' && questions.length > 0 && config && (
          <QuizView 
            questions={questions} 
            topic={config.topic} 
            onComplete={handleQuizComplete} 
          />
        )}

        {step === 'results' && (
          <ResultsView 
            questions={questions} 
            userAnswers={userAnswers} 
            onRestart={handleRestart} 
            onRepeat={handleRepeat}
            isLoading={loading}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white mt-auto">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center text-slate-400 text-sm">
          <p>© {new Date().getFullYear()} Dr. Probe. AI-generated content - verify with standard textbooks.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;