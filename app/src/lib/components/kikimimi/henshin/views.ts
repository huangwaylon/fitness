// 音の へんしん's own pages (views.ts): its round (a choice or a dictation, the takes compared at the reveal) and its results
// (each phrase's review with its three takes). Its lobby is the quiz's (no ばしょ: its options carry today's phenomenon).
import type { GameViews } from '../views.ts';

export const views: GameViews = {
  play: () => import('./HenshinPlay.svelte'),
  results: () => import('./HenshinResults.svelte')
};
