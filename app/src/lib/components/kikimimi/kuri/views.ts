// くりかえし チャレンジ's own pages (views.ts): its round (the ladder, the mic, the sentence lit as said) and its results
// (how far the run got, shown only to you). No lobby: it's solo, started from its mode's page.
import type { GameViews } from '../views.ts';

export const views: GameViews = {
  play: () => import('./KuriPlay.svelte'),
  results: () => import('./KuriResults.svelte')
};
