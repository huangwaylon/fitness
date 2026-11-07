// はつおん ききわけ's own pages (views.ts): its card (hear both, say one; あてっこ) and its end. Its lobby is the quiz's (the
// players, for あてっこ); solo, the mode page's はじめる starts it at once.
import type { GameViews } from '../views.ts';

export const views: GameViews = {
  play: () => import('./PairPlay.svelte'),
  results: () => import('./PairResults.svelte')
};
