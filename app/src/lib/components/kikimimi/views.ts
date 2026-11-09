// Each game's own views in the sheet's slots (KikimimiSheet.svelte: its lobby, its round, its results, in place of the
// quiz's Lobby, Play and Results), from its folder's views.ts (components/kikimimi/<gm>/views.ts, `export const views:
// GameViews`; the folder named as the game): found by the folder, each page its own chunk by import(). A game's lane
// (round/registry.ts) is pure, so its pages are here.
import type { Component } from 'svelte';
import type { GameId } from '#lib/kikimimi/round/types.ts';

/** A page of a game's: the sheet mounts it with `{ game, onagain, onmissed, ondone, onhub }` (ui/Lazy.svelte). */
type View = () => Promise<{ default: Component<any> }>;
export interface GameViews {
  lobby?: View;
  play?: View;
  results?: View;
}
export type Slot = keyof GameViews;

const BY: Readonly<Record<GameId, GameViews>> = Object.fromEntries(
  Object.entries(import.meta.glob<GameViews>('./*/views.ts', { eager: true, import: 'views' })).map(([f, v]) => [f.split('/')[1], v])
);
/** A game's own view in a slot (null: the quiz's), its chunk's loader for the sheet's <Lazy>. */
export function viewOf(gm: GameId | null | undefined, slot: Slot): View | null {
  return (gm && Object.hasOwn(BY, gm) ? BY[gm][slot] : undefined) ?? null;
}
