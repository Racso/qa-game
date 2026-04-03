import { Component, OnInit, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Player } from '@/app/models/game.models';
import { GameService } from '@services/game.service';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  templateUrl: './leaderboard.html',
})
export class LeaderboardComponent implements OnInit {
  readonly ranked = computed(() => this.gameService.rankedPlayers());
  readonly activityTitle = computed(() => this.gameService.activity()?.title ?? '');

  constructor(
    readonly gameService: GameService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    if (this.gameService.gamePhase() !== 'leaderboard') {
      this.router.navigate(['/home']);
    }
  }

  playAgain(): void {
    this.gameService.resetGame();
    this.router.navigate(['/home']);
  }

  getMedal(index: number): string {
    return ['🥇', '🥈', '🥉'][index] ?? '';
  }

  getDelay(index: number): string {
    return `${80 + index * 70}ms`;
  }

  isTopThree(index: number): boolean {
    return index < 3;
  }

  getScoreColor(player: Player, index: number): string {
    if (index === 0) return 'text-amber';
    if (index === 1) return 'text-ink-dim';
    if (index === 2) return 'text-[#cd7f32]';
    return 'text-ink-ghost';
  }
}
