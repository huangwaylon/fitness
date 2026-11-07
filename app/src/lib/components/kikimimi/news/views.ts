// しずえの ニュース's own pages (views.ts): its round (しずえ at her desk, the questions) and its results (each
// question's review, the bulletin's transcript). Its lobby is the quiz's (no places: its content's one).
import type { GameViews } from '../views.ts';

export const views: GameViews = {
  play: () => import('./NewsPlay.svelte'),
  results: () => import('./NewsResults.svelte')
};
