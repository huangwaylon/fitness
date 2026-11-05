// The players' portraits (customization.md §5): a look's head, drawn once from the look and kept by its hash, so the
// コーデ chips and the せってい row show the 3D player's head without a renderer of their own. Drawn by whoever
// paints (the すがた level's preview registers its renderer while it's open: never a second context); kept in memory
// and in localStorage (`look.portraits`, the latest PORTRAIT_KEEP, newest last), so the せってい row has them on the
// next opening too. A look with none yet shows the caller's stand-in until it's drawn.
import { SvelteMap } from 'svelte/reactivity';
import type { PlayerLook } from '#lib/contract/look.ts';

/** Pixels a side (the strip's 60px chips at 2×; the せってい row's 48 px). */
const PORTRAIT_PX = 128;
const KEEP = 24;
const STORE = 'look.portraits';

/** Draws a look's head as a data URL (null: nothing drawn). */
export type Painter = (look: PlayerLook, px: number) => Promise<string | null>;

/** A look's key: its fields in a fixed order, hashed (FNV-1a 32). */
function lookHash(l: PlayerLook): string {
  const s = [l.hair, l.hairColor, l.eye, l.eyeColor, l.mouth, l.mouthFrame, l.skin, l.cheek, l.nose, l.top, l.bottom, l.socks, l.shoes, l.glasses, l.ornament, l.hat ?? null].join('|');
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return (h >>> 0).toString(36);
}

const shots = new SvelteMap<string, string>();
/** What's kept, read once as the module loads (never inside a $derived: that may not write state). */
function load() {
  if (typeof localStorage === 'undefined') return;
  try {
    const kept = JSON.parse(localStorage.getItem(STORE) ?? '[]') as [string, string][];
    if (Array.isArray(kept)) for (const [k, v] of kept) if (typeof k === 'string' && typeof v === 'string' && v.startsWith('data:image/')) shots.set(k, v);
  } catch {
    /* none kept, or unreadable: drawn again */
  }
}
load();
function save() {
  const all = [...shots].slice(-KEEP);
  for (let n = all.length; n > 0; n = Math.floor(n / 2)) {
    try {
      localStorage.setItem(STORE, JSON.stringify(all.slice(-n)));
      return;
    } catch {
      /* full: keep fewer (never the user's data's room) */
    }
  }
}

let painter: Painter | null = null;
/** Who draws them when no one else does (the island's renderer, when it's idle): the partner's look, one never edited
 *  on this phone. */
let fallback: Painter | null = null;
const wanted = new Map<string, PlayerLook>();
/** Looks the painter drew nothing for this session (the logic mode, a missing part): not asked again. */
const missed = new Set<string>();
let busy = false;

async function drain() {
  if (busy) return;
  busy = true;
  try {
    for (let p = painter ?? fallback; p && wanted.size; p = painter ?? fallback) {
      const [key, look] = wanted.entries().next().value!;
      wanted.delete(key);
      if (shots.has(key)) continue;
      const url = await p(look, PORTRAIT_PX).catch(() => null);
      if (!url) missed.add(key);
      else {
        shots.set(key, url);
        save();
      }
    }
  } finally {
    busy = false;
  }
}

/** A look's portrait (a data URL), or null while it has none; asks for one to be drawn. Reactive (a $derived reads
 *  it again once drawn). */
export function portraitOf(look: PlayerLook): string | null {
  const key = lookHash(look);
  const url = shots.get(key);
  if (url) return url;
  if (!wanted.has(key) && !missed.has(key)) {
    wanted.set(key, look);
    queueMicrotask(drain);
  }
  return null;
}

/** Set (or clear, null) who draws the portraits: the すがた preview while it's open. */
export function usePainter(p: Painter | null): void {
  painter = p;
  if (p) void drain();
}

/** Set (or clear, null) who draws the portraits when no usePainter painter is set: the island's renderer (world3d,
 *  person3d). @public */
export function useIdlePainter(p: Painter | null): void {
  fallback = p;
  if (p) void drain();
}
