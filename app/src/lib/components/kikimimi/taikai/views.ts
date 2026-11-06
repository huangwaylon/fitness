// しずえの しゅうまつ たいかい's own pages (views.ts): its lobby, its show and its results.
import type { GameViews } from '../views.ts';

export const views: GameViews = {
  lobby: () => import('./TaikaiLobby.svelte'),
  play: () => import('./TaikaiPlay.svelte'),
  results: () => import('./TaikaiResults.svelte')
};
