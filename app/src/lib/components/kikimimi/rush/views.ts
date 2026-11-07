// すうじ ラッシュ's own pages (views.ts): its round (the counter and the ticket) and its results (the line served, the
// review of each customer). Its lobby is the quiz's (the places its content has, the players, きょうりょく / しょうぶ).
import type { GameViews } from '../views.ts';

export const views: GameViews = {
  play: () => import('./RushPlay.svelte'),
  results: () => import('./RushResults.svelte')
};
