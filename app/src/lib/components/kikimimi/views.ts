// Each game's own views in the sheet's slots (KikimimiSheet.svelte: its lobby, its round, its results, in place of the
// quiz's Lobby, Play and Results), from its folder's views.ts (components/kikimimi/<gm>/views.ts, `export const views:
// GameViews`; the folder named as the game): found by the folder, each page its own chunk by import(). A game's lane
// (round/registry.ts) is pure, so its pages are here.
import type { Component } from 'svelte';
import type { GameId } from '#lib/kikimimi/round/types.ts';

/** A page of a game's: the sheet mounts it with `{ game, onagain, onmissed, ondone, onhub }`. */
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
/** Each page's chunk, one promise (the sheet's {#await} keeps it, never mounting it again). */
const LOADED = new Map<View, ReturnType<View>>();

/** A game's own view in a slot (null: the quiz's). */
export function viewOf(gm: GameId | null | undefined, slot: Slot): ReturnType<View> | null {
  const v = gm && Object.hasOwn(BY, gm) ? BY[gm][slot] : undefined;
  if (!v) return null;
  let p = LOADED.get(v);
  if (!p) LOADED.set(v, (p = v()));
  return p;
}
