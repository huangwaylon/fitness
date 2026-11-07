// まねっこ シャドーイング's own pages (views.ts): its round (hear, say it, the two melody lines) and its end. No lobby of
// its own: the mode page's はじめる starts it alone.
import type { GameViews } from '../views.ts';

export const views: GameViews = {
  play: () => import('./ManePlay.svelte'),
  results: () => import('./ManeResults.svelte')
};
