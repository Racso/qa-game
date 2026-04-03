import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'home',
    loadComponent: () => import('@components/home/home').then((m) => m.HomeComponent),
  },
  {
    path: 'create',
    loadComponent: () => import('@components/create/create').then((m) => m.CreateComponent),
  },
  {
    path: 'host-lobby',
    loadComponent: () => import('@components/host-lobby/host-lobby').then((m) => m.HostLobbyComponent),
  },
  {
    path: 'play/:questionIndex',
    loadComponent: () => import('@components/play/play').then((m) => m.PlayComponent),
  },
  {
    path: 'results',
    loadComponent: () => import('@components/results/results').then((m) => m.ResultsComponent),
  },
  {
    path: 'leaderboard',
    loadComponent: () => import('@components/leaderboard/leaderboard').then((m) => m.LeaderboardComponent),
  },
  { path: '**', redirectTo: 'home' },
];
