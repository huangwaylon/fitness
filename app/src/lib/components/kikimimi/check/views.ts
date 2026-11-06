// みみ チェック's own pages (views.ts): its round under the way-through bar, and its result (the placed stage).
import type { GameViews } from '../views.ts';

export const views: GameViews = {
  play: () => import('./CheckPlay.svelte'),
  results: () => import('../onboarding/Placed.svelte')
};
