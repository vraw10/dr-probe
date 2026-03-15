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
  topicTag: string;
  explanation: string;
  visualDescription?: string; // Description of the clinical image
  imageUrl?: string; // Generated image URL
}

export interface QuizConfig {
  topic: string;
  count: number;
  mode: QuizMode;
  isVisual: boolean;
}

export type AppStep = 'setup' | 'quiz' | 'results';

export interface QuizResult {
  questionId: string;
  userAnswerIndex: number | null; // null if skipped, though we enforce completion usually
  isCorrect: boolean;
}