export interface Question {
  id: number;
  text: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  timeLimitSeconds: number;
}

export interface Activity {
  id: string;
  title: string;
  questions: Question[];
}

export interface Player {
  id: string;
  name: string;
  score: number;
  streak: number;
}

export interface AnswerDistribution {
  optionIndex: number;
  count: number;
  isCorrect: boolean;
  percentage: number;
}

export interface QuestionResult {
  questionId: number;
  correctIndex: number;
  distribution: AnswerDistribution[];
  playerAnswers: Map<string, number>;
}

export type GamePhase = 'idle' | 'lobby' | 'question' | 'results' | 'leaderboard';

export const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;

export const DEMO_ACTIVITY: Activity = {
  id: 'demo-1',
  title: 'General Knowledge',
  questions: [
    {
      id: 1,
      text: 'What is the capital of France?',
      options: ['Berlin', 'Madrid', 'Paris', 'Rome'],
      correctIndex: 2,
      timeLimitSeconds: 20,
    },
    {
      id: 2,
      text: 'How many sides does a hexagon have?',
      options: ['5', '6', '7', '8'],
      correctIndex: 1,
      timeLimitSeconds: 15,
    },
    {
      id: 3,
      text: 'Which planet is closest to the Sun?',
      options: ['Venus', 'Earth', 'Mars', 'Mercury'],
      correctIndex: 3,
      timeLimitSeconds: 20,
    },
  ],
};

export const DEMO_PLAYER_NAMES = ['Alejandro', 'Beatriz', 'Carlos', 'Diana', 'Emilio'];
