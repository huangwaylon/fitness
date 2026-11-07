// ようじ でんわ's own pages (views.ts): its round (the phone and the memo) and its results (each call's review). Its lobby
// is the quiz's (the places its content has, the players).
import type { GameViews } from '../views.ts';

export const views: GameViews = {
  play: () => import('./CallPlay.svelte'),
  results: () => import('./CallResults.svelte')
};
