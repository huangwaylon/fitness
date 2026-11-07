// ふたりで ロールプレイ's own pages (views.ts): its lobby (the scene and the role cards), its turn (the line to say, the
// mic, the ✓ chips) and its results (the team's phrases, お手本).
import type { GameViews } from '../views.ts';

export const views: GameViews = {
  lobby: () => import('./RoleLobby.svelte'),
  play: () => import('./RolePlay.svelte'),
  results: () => import('./RoleResults.svelte')
};
