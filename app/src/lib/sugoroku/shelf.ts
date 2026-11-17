// 英語すごろく's ことばだな (docs/sugoroku.md "Saving"): what every game on this phone made, kept after it ends: the words,
// lines and pictures with their Japanese (newest first, one a text, at most SHELF), and the souvenirs ever found (by
// name, so a later build's pictures keep them). The menu shows it; the next ふりかえり mixes in two older ones.
import { DEVICE, localKV, readJson, writeJson } from '#lib/sync/storage.ts';
import type { Game } from './game.ts';
import { PICTURES } from './pictures.ts';

interface ShelfWord {
  en: string;
  ja: string;
  kind: 'word' | 'sentence' | 'picture';
}
export interface Shelf {
  words: ShelfWord[];
  /** Pictures ever spelt (their English names). */
  items: string[];
  games: number;
}
const SHELF = 300;
const EMPTY: Shelf = { words: [], items: [], games: 0 };

export function loadShelf(): Shelf {
  const x = readJson<Shelf>(localKV(), DEVICE.sugorokuShelf);
  return x && Array.isArray(x.words) && Array.isArray(x.items) ? { ...EMPTY, ...x } : EMPTY;
}

/** The shelf with a finished game's things on it (pure). */
export function shelved(sh: Shelf, g: Game): Shelf {
  const fresh = [...g.made].reverse().filter((m) => m.ja).map((m) => ({ en: m.text, ja: m.ja, kind: m.kind }));
  const seen = new Set<string>(), words: ShelfWord[] = [];
  for (const w of [...fresh, ...sh.words]) if (!seen.has(w.en) && words.length < SHELF) (seen.add(w.en), words.push(w));
  const items = [...new Set([...sh.items, ...g.players.flatMap((p) => p.items.map((i) => PICTURES[i]?.w).filter((w): w is string => !!w))])];
  return { words, items, games: sh.games + 1 };
}

/** Put a finished game on this phone's shelf. */
export const shelve = (g: Game): Shelf => {
  const sh = shelved(loadShelf(), g);
  writeJson(localKV(), DEVICE.sugorokuShelf, sh);
  return sh;
};
