// Every key the app keeps in Web Storage, in one registry (round 9 §2 item 15), and guarded access to it.
// Live data lives under `island.*`. The demo lives under `island-demo.*` (localStorage and sessionStorage), so it
// can never read or overwrite a live key, queue or cache (round 9 §2 item 14). The snapshot cache itself is in
// IndexedDB (cache.ts); `island.snapshot` is only read once, to migrate it.
import type { PersonId } from '#lib/types.ts';

export interface KV {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

export const LIVE = {
  key: 'island.key',
  me: 'island.me',
  queue: 'island.queue',
  /** The pre-IndexedDB snapshot cache (round 9): migrated once, then removed. */
  legacyCache: 'island.snapshot'
} as const;

export const DEMO = {
  /** localStorage: today's demo taps, shared by both players' tabs. */
  events: 'island-demo.events',
  /** sessionStorage: `plain` | `harvest`, sticky for the tab once `?demo` was opened. */
  mode: 'island-demo.mode',
  /** sessionStorage: which player this tab is (`?demo&as=B`). */
  as: 'island-demo.as',
  /** Before round 9 the demo's taps sat next to the live keys. */
  legacyEvents: 'island.demo.events'
} as const;

/** This phone's own preferences (not data, never synced; shared by the live app and the demo). */
export const DEVICE = {
  /** localStorage: `{ music, sfx, voice, volume }` (lib/sound/settings.ts; all off by default). */
  sound: 'island.sound'
} as const;

/** The island scene's own small keys (not data: losing them only replays a greeting or a balloon). */
export const SCENE = {
  /** localStorage `if-<beat>` = the Tokyo day a startup beat (open, morning, evening, lowweek) last played. */
  beat: (beat: string) => `if-${beat}`,
  /** sessionStorage: balloons shown this session (at most 3). */
  balloons: 'if-balloon',
  /** localStorage `hf-seen:<day>` = how many of the partner's high-fives that day were already announced. */
  highFivesSeen: (day: string) => `hf-seen:${day}`,
  /** localStorage `bells-seen` = `{ date, parts: { A, B } }`: today's ベル per person and fruit already shown flying into
   *  the jar, so only new earnings fly in (round 11). */
  bellsSeen: 'bells-seen'
} as const;

/** Why something could not be kept on the phone: `full` (quota) or `unavailable` (private mode, blocked, broken). */
export type StorageProblem = 'full' | 'unavailable';

const win = typeof window !== 'undefined' ? window : null;
const safe = <T>(f: () => T): T | null => {
  try {
    return f();
  } catch {
    return null; // Safari with storage blocked throws on mere access
  }
};

let local: KV | null = safe(() => win?.localStorage ?? null);
let session: KV | null = safe(() => win?.sessionStorage ?? null);
let listener: ((p: StorageProblem) => void) | null = null;

/** Tests: swap the stores. */
export function configureStorage(o: { local?: KV | null; session?: KV | null }): void {
  if (o.local !== undefined) local = o.local;
  if (o.session !== undefined) session = o.session;
}

export const localKV = (): KV | null => local;
export const sessionKV = (): KV | null => session;

/** The store shows a banner for these (once per kind and session). One listener. */
export function onStorageProblem(fn: ((p: StorageProblem) => void) | null): void {
  listener = fn;
}

export function reportStorageProblem(e: unknown): StorageProblem {
  const name = (e as { name?: unknown } | null)?.name;
  const p: StorageProblem = name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED' ? 'full' : 'unavailable';
  listener?.(p);
  return p;
}

export function readJson<T>(kv: KV | null, k: string): T | null {
  try {
    const s = kv?.getItem(k);
    return s ? (JSON.parse(s) as T) : null;
  } catch {
    return null;
  }
}

/** False (and reported) when it could not be stored: the caller keeps it in memory for this session. */
export function writeJson(kv: KV | null, k: string, v: unknown): boolean {
  return writeRaw(kv, k, JSON.stringify(v));
}

export function writeRaw(kv: KV | null, k: string, v: string): boolean {
  if (!kv) return false;
  try {
    kv.setItem(k, v);
    return true;
  } catch (e) {
    reportStorageProblem(e);
    return false;
  }
}

export function remove(kv: KV | null, k: string): void {
  safe(() => kv?.removeItem(k));
}

// ---------- who I am ----------

export const getKey = (): string | null => safe(() => local?.getItem(LIVE.key) ?? null);
export const getStoredMe = (): PersonId | null => readJson<PersonId>(local, LIVE.me);
export const storeMe = (me: PersonId): boolean => writeJson(local, LIVE.me, me);
