// ことば タイル's own pages (views.ts): its round (the board) and its results (the review of each sentence). Its lobby is
// the quiz's (the places its content has, the players).
import type { GameViews } from '../views.ts';

export const views: GameViews = {
  play: () => import('./TilePlay.svelte'),
  results: () => import('./TileResults.svelte')
};
