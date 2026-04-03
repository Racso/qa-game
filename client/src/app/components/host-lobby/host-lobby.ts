import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DEMO_PLAYER_NAMES } from '@/app/models/game.models';
import { GameService } from '@services/game.service';

@Component({
  selector: 'app-host-lobby',
  standalone: true,
  templateUrl: './host-lobby.html',
})
export class HostLobbyComponent implements OnInit {
  private demoPlayerIdx = 0;

  constructor(
    readonly gameService: GameService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    if (this.gameService.gamePhase() !== 'lobby') {
      this.router.navigate(['/home']);
    }
  }

  addDemoPlayer(): void {
    const name = DEMO_PLAYER_NAMES[this.demoPlayerIdx % DEMO_PLAYER_NAMES.length];
    this.demoPlayerIdx++;
    this.gameService.addPlayer(name);
  }

  startGame(): void {
    if (this.gameService.players().length === 0) return;
    this.gameService.startGame();
    this.router.navigate(['/play', 0]);
  }

  goBack(): void {
    this.gameService.resetGame();
    this.router.navigate(['/home']);
  }
}
