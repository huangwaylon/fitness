// The players' portraits (customization.md §5): a look's head, drawn once from the look and kept by its hash, so the
// コーデ chips and the せってい row show the 3D player's head without a renderer of their own. Drawn by whoever
// paints (the すがた level's preview registers its renderer while it's open: never a second context); kept in
// localStorage, each under its own key (`look.portrait.<hash>`; `look.portraits` the kept hashes, the latest KEEP,
// newest last), so the せってい row has them on the next opening too, and in memory only as a head is asked for
// (KEEP at most, the least recently asked for let go: each a 10-20 KB data URL). Nothing is read as the module loads:
// a head's own entry the first time it's asked for. A look with none yet shows the caller's stand-in until it's drawn.
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

const PREFIX = 'look.portrait.';

/** The heads in memory (least recently asked for first), at most KEEP; not reactive state (read inside a $derived). */
const shots = new Map<string, string>();
/** A head drawn this session: the $derived that asked re-reads (shots itself is no state: a read may fill it). */
let drawn = $state(0);
/** The heads whose kept entry was read (none there: not read again till it's drawn or let go of). */
const asked = new Set<string>();
const storage = (): Storage | null => (typeof localStorage === 'undefined' ? null : localStorage);
const remember = (key: string, url: string) => {
  shots.delete(key);
  shots.set(key, url);
  if (shots.size > KEEP) {
    const old = shots.keys().next().value!;
    shots.delete(old);
    // (asked again, read again from its entry)
    asked.delete(old);
  }
};

let migrated = false;
/** The kept hashes, newest last; the old format (`look.portraits` the [hash, data URL] pairs) split once. */
function index(): string[] {
  const ls = storage();
  if (!ls) return [];
  try {
    const raw = JSON.parse(ls.getItem(STORE) ?? '[]') as unknown[];
    if (!Array.isArray(raw)) return [];
    if (!migrated && raw.some((e) => Array.isArray(e))) {
      migrated = true;
      const keys: string[] = [];
      // (its room first: each head then fits where the whole list was)
      ls.removeItem(STORE);
      for (const e of raw)
        if (Array.isArray(e) && typeof e[0] === 'string' && typeof e[1] === 'string' && e[1].startsWith('data:image/')) {
          try {
            ls.setItem(PREFIX + e[0], e[1]);
            keys.push(e[0]);
          } catch {
            break; // (full: the rest drawn again)
          }
        }
      ls.setItem(STORE, JSON.stringify(keys));
      return keys;
    }
    migrated = true;
    return raw.filter((k): k is string => typeof k === 'string');
  } catch {
    return []; // unreadable, or full mid-migration: drawn again
  }
}
/** A head from memory, else its own kept entry (read once: a miss is none till it's drawn). */
function kept(key: string): string | null {
  const url = shots.get(key);
  if (url) {
    remember(key, url);
    return url;
  }
  if (asked.has(key)) return null;
  asked.add(key);
  try {
    if (!migrated) index();
    const v = storage()?.getItem(PREFIX + key);
    if (v?.startsWith('data:image/')) {
      remember(key, v);
      return v;
    }
  } catch {
    /* unreadable: drawn again */
  }
  return null;
}
/** Keep a drawn head: its entry, the index (the latest KEEP; the rest's entries removed), fewer when storage is full
 *  (never the user's data's room). */
function save(key: string, url: string) {
  const ls = storage();
  if (!ls) return;
  let keys = [...index().filter((k) => k !== key), key];
  const drop = (n: number) => {
    for (const k of keys.slice(0, Math.max(0, keys.length - n))) ls.removeItem(PREFIX + k);
    keys = keys.slice(-n);
  };
  drop(KEEP);
  for (let n = keys.length; n > 0; n = Math.floor(n / 2)) {
    try {
      ls.setItem(PREFIX + key, url);
      ls.setItem(STORE, JSON.stringify(keys));
      return;
    } catch {
      drop(Math.floor(n / 2));
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
      if (kept(key)) continue;
      const url = await p(look, PORTRAIT_PX).catch(() => null);
      if (!url) missed.add(key);
      else {
        remember(key, url);
        save(key, url);
        drawn++;
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
  void drawn;
  const url = kept(key);
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
