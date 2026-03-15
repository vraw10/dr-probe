export type Difficulty = 'E' | 'M' | 'H';
export type Precision = 'Low' | 'Med' | 'High';
export type QuizMode = 'random' | 'hard' | 'tricky';

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswerIndex: number;
  difficulty: Difficulty;
  precision: Precision;
  explanation: string;
}

export interface QuizConfig {
  topic: string;
  count: number;
  mode: QuizMode;
}

export type AppStep = 'setup' | 'quiz' | 'results';

export interface QuizResult {
  questionId: string;
  userAnswerIndex: number | null; // null if skipped, though we enforce completion usually
  isCorrect: boolean;
}