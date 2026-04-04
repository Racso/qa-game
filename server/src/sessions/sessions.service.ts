import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Observable, Subject, interval, merge } from 'rxjs';
import { map } from 'rxjs/operators';
import { ActivitiesService } from '../activities/activities.service.js';
import { CreateSessionDto } from './dto/create-session.dto.js';
import { JoinSessionDto } from './dto/join-session.dto.js';
import { SubmitAnswerDto } from './dto/submit-answer.dto.js';
import {
  AnswerDistribution,
  QuestionResult,
  SessionPlayer,
  SessionState,
  SsePayload,
} from './session.types.js';

@Injectable()
export class SessionsService {
  private readonly sessions = new Map<string, SessionState>();

  constructor(private readonly activitiesService: ActivitiesService) {}

  // ── Create ───────────────────────────────────────────────────

  async create(dto: CreateSessionDto): Promise<{ code: string }> {
    const activity = await this.activitiesService.findOne(dto.activityId);
    activity.questions.sort((a, b) => a.order - b.order);

    const code = this.generateCode();
    const session: SessionState = {
      code,
      activity,
      phase: 'lobby',
      currentQuestionIndex: 0,
      players: new Map(),
      answers: new Map(),
      questionStartedAt: null,
      timer: null,
      subject: new Subject(),
    };

    this.sessions.set(code, session);
    return { code };
  }

  // ── Read ─────────────────────────────────────────────────────

  getState(code: string) {
    const s = this.requireSession(code);
    return this.snapshot(s);
  }

  // ── SSE stream ───────────────────────────────────────────────

  getEventStream(code: string): Observable<{ data: SsePayload }> {
    const session = this.requireSession(code);

    const initial$ = new Observable<{ data: SsePayload }>((sub) => {
      sub.next({ data: { type: 'session_state', payload: this.snapshot(session) } });
      sub.complete();
    });

    const heartbeat$ = interval(25_000).pipe(
      map(() => ({ data: { type: 'ping' as const } })),
    );

    return merge(initial$, session.subject.asObservable(), heartbeat$);
  }

  // ── Join ─────────────────────────────────────────────────────

  join(code: string, dto: JoinSessionDto): { playerId: string; name: string } {
    const session = this.requireSession(code);
    if (session.phase !== 'lobby') {
      throw new BadRequestException('Game has already started');
    }

    const playerId = crypto.randomUUID();
    const player: SessionPlayer = { id: playerId, name: dto.name, score: 0, streak: 0 };
    session.players.set(playerId, player);

    this.emit(session, { type: 'player_joined', payload: { player: this.publicPlayer(player) } });
    return { playerId, name: dto.name };
  }

  // ── Start game ───────────────────────────────────────────────

  start(code: string): void {
    const session = this.requireSession(code);
    if (session.phase !== 'lobby') {
      throw new BadRequestException('Game is not in lobby phase');
    }
    if (session.players.size === 0) {
      throw new BadRequestException('No players have joined yet');
    }

    session.phase = 'question';
    session.currentQuestionIndex = 0;
    this.openQuestion(session);
  }

  // ── Submit answer ────────────────────────────────────────────

  submitAnswer(code: string, dto: SubmitAnswerDto): void {
    const session = this.requireSession(code);
    if (session.phase !== 'question') {
      throw new BadRequestException('No question is currently open');
    }
    if (!session.players.has(dto.playerId)) {
      throw new NotFoundException('Player not found in this session');
    }

    const qIdx = session.currentQuestionIndex;
    if (!session.answers.has(qIdx)) session.answers.set(qIdx, new Map());
    const qAnswers = session.answers.get(qIdx)!;

    if (qAnswers.has(dto.playerId)) {
      throw new BadRequestException('Player already answered this question');
    }

    qAnswers.set(dto.playerId, {
      playerId: dto.playerId,
      optionIndex: dto.optionIndex,
      answeredAt: Date.now(),
    });

    // Auto-close when all players have answered
    if (qAnswers.size === session.players.size) {
      this.closeQuestion(session);
    }
  }

  // ── Next question ────────────────────────────────────────────

  next(code: string): void {
    const session = this.requireSession(code);
    if (session.phase !== 'question_closed') {
      throw new BadRequestException('Current question is not closed yet');
    }

    const isLast = session.currentQuestionIndex >= session.activity.questions.length - 1;

    if (isLast) {
      this.endGame(session);
    } else {
      session.currentQuestionIndex++;
      session.phase = 'question';
      this.openQuestion(session);
    }
  }

  // ── Results ──────────────────────────────────────────────────

  getResults(code: string) {
    const session = this.requireSession(code);
    if (session.phase !== 'leaderboard' && session.phase !== 'ended') {
      throw new BadRequestException('Game has not ended yet');
    }
    return {
      activity: { id: session.activity.id, title: session.activity.title },
      players: this.rankedPlayers(session),
      questionResults: this.allQuestionResults(session),
    };
  }

  // ── Internal helpers ─────────────────────────────────────────

  private openQuestion(session: SessionState): void {
    const question = session.activity.questions[session.currentQuestionIndex];
    session.questionStartedAt = Date.now();

    this.emit(session, {
      type: 'question_open',
      payload: {
        question: { id: question.id, text: question.text, options: question.options, timeLimitSeconds: question.timeLimitSeconds },
        index: session.currentQuestionIndex,
        total: session.activity.questions.length,
      },
    });

    session.timer = setTimeout(() => {
      if (session.phase === 'question') {
        this.closeQuestion(session);
      }
    }, question.timeLimitSeconds * 1000);
  }

  private closeQuestion(session: SessionState): void {
    if (session.phase !== 'question') return; // idempotent

    if (session.timer) {
      clearTimeout(session.timer);
      session.timer = null;
    }

    session.phase = 'question_closed';

    const result = this.computeQuestionResult(session);
    this.applyScores(session, result);

    this.emit(session, {
      type: 'question_closed',
      payload: {
        result,
        leaderboard: this.rankedPlayers(session).slice(0, 10),
      },
    });
  }

  private endGame(session: SessionState): void {
    session.phase = 'leaderboard';
    const ranked = this.rankedPlayers(session);
    this.emit(session, { type: 'leaderboard', payload: { players: ranked } });

    // Brief delay then close the stream
    setTimeout(() => {
      session.phase = 'ended';
      this.emit(session, { type: 'game_ended' });
      session.subject.complete();
    }, 5_000);
  }

  private computeQuestionResult(session: SessionState): QuestionResult {
    const qIdx = session.currentQuestionIndex;
    const question = session.activity.questions[qIdx];
    const qAnswers = session.answers.get(qIdx) ?? new Map();
    const total = session.players.size;

    const distribution: AnswerDistribution[] = [0, 1, 2, 3].map((i) => {
      const count = [...qAnswers.values()].filter((a) => a.optionIndex === i).length;
      return {
        optionIndex: i,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        isCorrect: i === question.correctIndex,
      };
    });

    return { questionIndex: qIdx, distribution, correctIndex: question.correctIndex };
  }

  private applyScores(session: SessionState, result: QuestionResult): void {
    const qIdx = session.currentQuestionIndex;
    const question = session.activity.questions[qIdx];
    const qAnswers = session.answers.get(qIdx) ?? new Map();
    const startedAt = session.questionStartedAt ?? Date.now();

    session.players.forEach((player) => {
      const answer = qAnswers.get(player.id);
      if (!answer || answer.optionIndex !== result.correctIndex) {
        player.streak = 0;
        return;
      }
      const elapsed = Math.min((answer.answeredAt - startedAt) / 1000, question.timeLimitSeconds);
      const timeRatio = elapsed / question.timeLimitSeconds;
      const basePoints = Math.round(1000 * (1 - timeRatio * 0.5)); // 500–1000
      const streakBonus = player.streak >= 1 ? 200 : 0;
      player.score += basePoints + streakBonus;
      player.streak += 1;
    });
  }

  private allQuestionResults(session: SessionState): QuestionResult[] {
    return session.activity.questions.map((_, i) => {
      const savedPhase = session.phase;
      const savedIdx = session.currentQuestionIndex;
      session.currentQuestionIndex = i;
      session.phase = 'question_closed';
      const result = this.computeQuestionResult(session);
      session.currentQuestionIndex = savedIdx;
      session.phase = savedPhase;
      return result;
    });
  }

  private emit(session: SessionState, payload: SsePayload): void {
    session.subject.next({ data: payload });
  }

  private snapshot(session: SessionState) {
    const question =
      session.phase === 'question' || session.phase === 'question_closed'
        ? (() => {
            const q = session.activity.questions[session.currentQuestionIndex];
            return { id: q.id, text: q.text, options: q.options, timeLimitSeconds: q.timeLimitSeconds };
          })()
        : null;

    return {
      code: session.code,
      activityTitle: session.activity.title,
      phase: session.phase,
      currentQuestionIndex: session.currentQuestionIndex,
      totalQuestions: session.activity.questions.length,
      players: [...session.players.values()].map(this.publicPlayer),
      question,
      questionStartedAt: session.questionStartedAt,
    };
  }

  private rankedPlayers(session: SessionState) {
    return [...session.players.values()]
      .sort((a, b) => b.score - a.score)
      .map((p, i) => ({ ...this.publicPlayer(p), rank: i + 1 }));
  }

  private publicPlayer(player: SessionPlayer) {
    return { id: player.id, name: player.name, score: player.score, streak: player.streak };
  }

  private requireSession(code: string): SessionState {
    const session = this.sessions.get(code);
    if (!session) throw new NotFoundException(`Session ${code} not found`);
    return session;
  }

  private generateCode(): string {
    let code: string;
    do {
      code = Math.floor(1000 + Math.random() * 9000).toString();
    } while (this.sessions.has(code));
    return code;
  }
}
