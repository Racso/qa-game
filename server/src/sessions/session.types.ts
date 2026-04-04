import { Subject } from 'rxjs';
import { Activity } from '../activities/entities/activity.entity.js';

export type SessionPhase = 'lobby' | 'question' | 'question_closed' | 'leaderboard' | 'ended';

export interface SessionPlayer {
  id: string;
  name: string;
  score: number;
  streak: number;
}

export interface PlayerAnswer {
  playerId: string;
  optionIndex: number;
  answeredAt: number; // ms timestamp — used for speed scoring
}

export interface AnswerDistribution {
  optionIndex: number;
  count: number;
  percentage: number;
  isCorrect: boolean;
}

export interface QuestionResult {
  questionIndex: number;
  distribution: AnswerDistribution[];
  correctIndex: number;
}

// ── SSE event payload ────────────────────────────────────────────

export type SseEventType =
  | 'session_state'
  | 'player_joined'
  | 'game_started'
  | 'question_open'
  | 'question_closed'
  | 'leaderboard'
  | 'game_ended'
  | 'ping';

export interface SsePayload {
  type: SseEventType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any;
}

// ── Live session state (in-memory) ───────────────────────────────

export interface SessionState {
  code: string;
  activity: Activity;
  phase: SessionPhase;
  currentQuestionIndex: number;
  players: Map<string, SessionPlayer>;
  /** questionIndex → playerId → PlayerAnswer */
  answers: Map<number, Map<string, PlayerAnswer>>;
  questionStartedAt: number | null;
  timer: ReturnType<typeof setTimeout> | null;
  subject: Subject<{ data: SsePayload }>;
}
