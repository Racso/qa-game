import { Component, OnInit, computed } from '@angular/core';
import { Router } from '@angular/router';
import { OPTION_LABELS } from '@/app/models/game.models';
import { GameService } from '@services/game.service';

@Component({
  selector: 'app-results',
  standalone: true,
  templateUrl: './results.html',
})
export class ResultsComponent implements OnInit {
  readonly optionLabels = OPTION_LABELS;

  readonly result = computed(() => this.gameService.currentResult());
  readonly question = computed(() => this.gameService.currentQuestion());
  readonly top3 = computed(() => this.gameService.rankedPlayers().slice(0, 3));
  readonly isLast = computed(() => this.gameService.isLastQuestion());
  readonly questionNumber = computed(() => this.gameService.currentQuestionIndex() + 1);

  constructor(
    readonly gameService: GameService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    if (this.gameService.gamePhase() !== 'results') {
      this.router.navigate(['/home']);
    }
  }

  next(): void {
    this.gameService.nextQuestion();
    const phase = this.gameService.gamePhase();
    if (phase === 'leaderboard') {
      this.router.navigate(['/leaderboard']);
    } else {
      this.router.navigate(['/play', this.gameService.currentQuestionIndex()]);
    }
  }

  getBarDelay(index: number): string {
    return `${index * 120}ms`;
  }
}
