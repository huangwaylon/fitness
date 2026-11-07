// たちぎき's own pages (views.ts): its round (the seats, the claims, the faces) and its results (each conversation's
// review). Its lobby is the quiz's (the places its content has, the players).
import type { GameViews } from '../views.ts';

export const views: GameViews = {
  play: () => import('./TachiPlay.svelte'),
  results: () => import('./TachiResults.svelte')
};
