import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Activity, DEMO_ACTIVITY } from '@/app/models/game.models';
import { GameService } from '@services/game.service';

interface DraftQuestion {
  text: string;
  optA: string;
  optB: string;
  optC: string;
  optD: string;
  correctIndex: 0 | 1 | 2 | 3;
  timeLimitSeconds: number;
}

const blankQuestion = (): DraftQuestion => ({
  text: '',
  optA: '',
  optB: '',
  optC: '',
  optD: '',
  correctIndex: 0,
  timeLimitSeconds: 20,
});

@Component({
  selector: 'app-create',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './create.html',
})
export class CreateComponent {
  title = signal('');
  questions = signal<DraftQuestion[]>([blankQuestion()]);
  readonly timeLimits = [10, 15, 20, 30];
  readonly optionLabels = ['A', 'B', 'C', 'D'] as const;

  constructor(
    private gameService: GameService,
    private router: Router,
  ) {}

  addQuestion(): void {
    this.questions.update((qs) => [...qs, blankQuestion()]);
  }

  removeQuestion(index: number): void {
    this.questions.update((qs) => qs.filter((_, i) => i !== index));
  }

  setCorrect(qIdx: number, opt: 0 | 1 | 2 | 3): void {
    this.questions.update((qs) => qs.map((q, i) => (i === qIdx ? { ...q, correctIndex: opt } : q)));
  }

  setTimeLimit(qIdx: number, seconds: number): void {
    this.questions.update((qs) => qs.map((q, i) => (i === qIdx ? { ...q, timeLimitSeconds: seconds } : q)));
  }

  updateQuestion(qIdx: number, field: keyof DraftQuestion, value: string): void {
    this.questions.update((qs) =>
      qs.map((q, i) => (i === qIdx ? { ...q, [field]: value } : q)),
    );
  }

  loadDemo(): void {
    this.title.set(DEMO_ACTIVITY.title);
    this.questions.set(
      DEMO_ACTIVITY.questions.map((q) => ({
        text: q.text,
        optA: q.options[0],
        optB: q.options[1],
        optC: q.options[2],
        optD: q.options[3],
        correctIndex: q.correctIndex,
        timeLimitSeconds: q.timeLimitSeconds,
      })),
    );
  }

  isValid(): boolean {
    return (
      this.title().trim().length > 0 &&
      this.questions().length > 0 &&
      this.questions().every((q) => q.text.trim() && q.optA && q.optB && q.optC && q.optD)
    );
  }

  startHosting(): void {
    if (!this.isValid()) return;

    const activity: Activity = {
      id: `act-${Date.now()}`,
      title: this.title().trim(),
      questions: this.questions().map((q, i) => ({
        id: i + 1,
        text: q.text.trim(),
        options: [q.optA, q.optB, q.optC, q.optD],
        correctIndex: q.correctIndex,
        timeLimitSeconds: q.timeLimitSeconds,
      })),
    };

    this.gameService.startNewGame(activity);
    this.router.navigate(['/host-lobby']);
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }
}
