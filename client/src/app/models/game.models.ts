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
  title: 'Conocimiento General',
  questions: [
    {
      id: 1,
      text: '¿Cuál es la capital de Francia?',
      options: ['Berlín', 'Madrid', 'París', 'Roma'],
      correctIndex: 2,
      timeLimitSeconds: 20,
    },
    {
      id: 2,
      text: '¿Cuántos lados tiene un hexágono?',
      options: ['5', '6', '7', '8'],
      correctIndex: 1,
      timeLimitSeconds: 15,
    },
    {
      id: 3,
      text: '¿Qué planeta está más cerca del Sol?',
      options: ['Venus', 'Tierra', 'Marte', 'Mercurio'],
      correctIndex: 3,
      timeLimitSeconds: 20,
    },
  ],
};

export const DEMO_PLAYER_NAMES = ['Alejandro', 'Beatriz', 'Carlos', 'Diana', 'Emilio'];
