import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.html',
})
export class HomeComponent {
  constructor(private router: Router) {}

  hostGame(): void {
    this.router.navigate(['/create']);
  }

  joinGame(): void {
    this.router.navigate(['/play', '0']);
  }
}
