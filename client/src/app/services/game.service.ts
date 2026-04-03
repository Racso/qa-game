import { Injectable, computed, signal } from '@angular/core';
import { Activity, AnswerDistribution, GamePhase, Player, Question, QuestionResult } from '@/app/models/game.models';

@Injectable({ providedIn: 'root' })
export class GameService {
  // ── Core state ────────────────────────────────────────────────
  readonly activity = signal<Activity | null>(null);
  readonly players = signal<Player[]>([]);
  readonly joinCode = signal<string>('');
  readonly currentQuestionIndex = signal<number>(0);
  readonly questionResults = signal<QuestionResult[]>([]);
  readonly gamePhase = signal<GamePhase>('idle');

  // Answer tracking for the current question (not surfaced to UI)
  private readonly currentAnswers = signal<Map<string, number>>(new Map());
  private questionStartTime = 0;

  // ── Computed ──────────────────────────────────────────────────
  readonly currentQuestion = computed<Question | null>(() => {
    const act = this.activity();
    if (!act) return null;
    const idx = this.currentQuestionIndex();
    return act.questions[idx] ?? null;
  });

  readonly currentResult = computed<QuestionResult | null>(() => {
    const results = this.questionResults();
    const idx = this.currentQuestionIndex();
    return results[idx] ?? null;
  });

  readonly rankedPlayers = computed<Player[]>(() =>
    [...this.players()].sort((a, b) => b.score - a.score),
  );

  readonly isLastQuestion = computed<boolean>(() => {
    const act = this.activity();
    if (!act) return false;
    return this.currentQuestionIndex() === act.questions.length - 1;
  });

  readonly totalQuestions = computed<number>(() => this.activity()?.questions.length ?? 0);

  // ── Actions ───────────────────────────────────────────────────

  startNewGame(activity: Activity): void {
    this.activity.set(activity);
    this.joinCode.set(this.generateCode());
    this.players.set([]);
    this.currentQuestionIndex.set(0);
    this.questionResults.set([]);
    this.currentAnswers.set(new Map());
    this.gamePhase.set('lobby');
  }

  addPlayer(name: string): void {
    const id = `player-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    this.players.update((ps) => [...ps, { id, name, score: 0, streak: 0 }]);
  }

  startGame(): void {
    this.currentQuestionIndex.set(0);
    this.currentAnswers.set(new Map());
    this.questionStartTime = Date.now();
    this.gamePhase.set('question');
  }

  submitAnswer(playerId: string, optionIndex: number): void {
    this.currentAnswers.update((m) => new Map(m).set(playerId, optionIndex));
  }

  closeQuestion(): void {
    const question = this.currentQuestion();
    if (!question) return;

    const answers = this.currentAnswers();
    const totalAnswers = answers.size;

    const distribution: AnswerDistribution[] = [0, 1, 2, 3].map((i) => {
      const count = [...answers.values()].filter((v) => v === i).length;
      return {
        optionIndex: i,
        count,
        isCorrect: i === question.correctIndex,
        percentage: totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0,
      };
    });

    const result: QuestionResult = {
      questionId: question.id,
      correctIndex: question.correctIndex,
      distribution,
      playerAnswers: new Map(answers),
    };

    this.questionResults.update((rs) => [...rs, result]);

    // Score players
    const elapsed = (Date.now() - this.questionStartTime) / 1000;
    this.players.update((players) =>
      players.map((player) => {
        const answer = answers.get(player.id);
        if (answer === undefined) {
          // Didn't answer — reset streak
          return { ...player, streak: 0 };
        }
        if (answer !== question.correctIndex) {
          return { ...player, streak: 0 };
        }
        const timeRatio = Math.min(elapsed / question.timeLimitSeconds, 1);
        const basePoints = Math.round(1000 * (1 - timeRatio * 0.5));
        const streakBonus = player.streak >= 1 ? 200 : 0;
        return {
          ...player,
          score: player.score + basePoints + streakBonus,
          streak: player.streak + 1,
        };
      }),
    );

    this.currentAnswers.set(new Map());
    this.gamePhase.set('results');
  }

  nextQuestion(): void {
    if (this.isLastQuestion()) {
      this.gamePhase.set('leaderboard');
    } else {
      this.currentQuestionIndex.update((i) => i + 1);
      this.currentAnswers.set(new Map());
      this.questionStartTime = Date.now();
      this.gamePhase.set('question');
    }
  }

  resetGame(): void {
    this.activity.set(null);
    this.players.set([]);
    this.joinCode.set('');
    this.currentQuestionIndex.set(0);
    this.questionResults.set([]);
    this.currentAnswers.set(new Map());
    this.gamePhase.set('idle');
  }

  // ── Helpers ───────────────────────────────────────────────────

  private generateCode(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }
}
