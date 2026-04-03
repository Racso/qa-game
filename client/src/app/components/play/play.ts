import { Component, DestroyRef, Input, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { OPTION_LABELS } from '@/app/models/game.models';
import { GameService } from '@services/game.service';

type AnswerState = 'idle' | 'answered';

@Component({
  selector: 'app-play',
  standalone: true,
  templateUrl: './play.html',
})
export class PlayComponent implements OnInit {
  @Input() questionIndex = '0';

  readonly optionLabels = OPTION_LABELS;
  readonly selectedOption = signal<number | null>(null);
  readonly answerState = signal<AnswerState>('idle');
  readonly timeLeft = signal<number>(0);
  readonly timerProgress = signal<number>(100);

  private timerId: ReturnType<typeof setInterval> | null = null;
  private readonly destroyRef = inject(DestroyRef);

  readonly isCorrect = computed(() => {
    const sel = this.selectedOption();
    const q = this.gameService.currentQuestion();
    if (sel === null || !q) return false;
    return sel === q.correctIndex;
  });

  readonly questionNumber = computed(() => this.gameService.currentQuestionIndex() + 1);
  readonly totalQuestions = computed(() => this.gameService.totalQuestions());
  readonly question = computed(() => this.gameService.currentQuestion());
  readonly isTimerUrgent = computed(() => this.timeLeft() <= 5 && this.timeLeft() > 0);

  constructor(
    readonly gameService: GameService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    if (this.gameService.gamePhase() !== 'question') {
      this.router.navigate(['/home']);
      return;
    }
    this.startTimer();
    this.destroyRef.onDestroy(() => this.clearTimer());
  }

  private startTimer(): void {
    const q = this.gameService.currentQuestion();
    if (!q) return;
    const limit = q.timeLimitSeconds;
    this.timeLeft.set(limit);
    this.timerProgress.set(100);

    this.timerId = setInterval(() => {
      this.timeLeft.update((t) => {
        const next = t - 1;
        this.timerProgress.set(Math.max(0, (next / limit) * 100));
        if (next <= 0) {
          this.clearTimer();
          if (this.answerState() === 'idle') {
            this.autoClose();
          }
          return 0;
        }
        return next;
      });
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private autoClose(): void {
    this.submitMockAnswers();
    this.gameService.closeQuestion();
    this.router.navigate(['/results']);
  }

  selectOption(optIdx: number): void {
    if (this.answerState() !== 'idle') return;
    this.clearTimer();
    this.selectedOption.set(optIdx);
    this.answerState.set('answered');
    this.gameService.submitAnswer('me', optIdx);
    this.submitMockAnswers();
    setTimeout(() => {
      this.gameService.closeQuestion();
      this.router.navigate(['/results']);
    }, 900);
  }

  private submitMockAnswers(): void {
    const q = this.gameService.currentQuestion();
    if (!q) return;
    this.gameService.players().forEach((player) => {
      const rand = Math.random();
      let choice: number;
      if (rand < 0.62) {
        choice = q.correctIndex;
      } else {
        const wrong = [0, 1, 2, 3].filter((x) => x !== q.correctIndex);
        choice = wrong[Math.floor(Math.random() * wrong.length)];
      }
      this.gameService.submitAnswer(player.id, choice);
    });
  }

  getCardClass(optIdx: number): string {
    const state = this.answerState();
    const selected = this.selectedOption();
    const q = this.question();
    if (state === 'idle') return 'opt-idle';
    const isCorrect = q?.correctIndex === optIdx;
    const isSelected = optIdx === selected;
    if (isCorrect) return 'opt-correct';
    if (isSelected) return 'opt-wrong';
    return 'opt-dim';
  }
}
