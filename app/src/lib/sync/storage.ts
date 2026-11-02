// Every key the app keeps in Web Storage, in one registry, and guarded access to it.
// Live data lives under `island.*`. The demo lives under `island-demo.*` (localStorage and sessionStorage), so it
// can never read or overwrite a live key, queue or cache. The snapshot cache itself is in IndexedDB (cache.ts).
import type { Who } from '#lib/types.ts';

export interface KV {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

export const LIVE = {
  key: 'island.key',
  me: 'island.me',
  queue: 'island.queue',
  /** Events the server acked whose rows the snapshot cache hasn't fetched back yet (queue.ts `ackedEvents()`). */
  acked: 'island.acked',
  /** `{ me, date }`: the Tokyo day my all-four goals were last reported to the relay (sync/push.ts: once a day). */
  goalSent: 'island.goalSent',
  /** `{ day, t }`: the relay time of the last shared-world change this phone heard that Tokyo day (sync/live.ts: the
   *  hello's `since`, so a reload hears only what's new). */
  since: 'island.liveSince',
  /** `{ day, events }`: today's shared world as this phone folded it (store/world.svelte.ts: mine and the partner's). */
  world: 'island.world',
  /** `{ <morning>: { A?, B? } }`: both people's wishes on shooting stars by the morning each brings its fragment
   *  (store/world.svelte.ts: kept past the day they were made in). */
  wishes: 'island.wishes',
  /** `{ day, watered }`: yesterday's watered flowers (world.ts FLOWERS ids), both people's (store/world.svelte.ts: today's hybrids). */
  worldPrev: 'island.worldPrev',
  /** `[entry…]`: the island's decorations, each item's winning op (store/decor.svelte.ts: the layout before the sheet
   *  answers, and what the relay brought since). */
  decor: 'island.decor',
  /** `[entry…]`: the tent's room, each piece's (and the wallpaper's and the floor's) winning op (store/tent.svelte.ts). */
  tent: 'island.tent',
  /** `[entry…]`: the island's layout, each id's winning op (store/layout.svelte.ts: objects, terrain chunks, a reset,
   *  the homes' looks). */
  layout: 'island.layout',
  /** `{ [who]: at }`: the newest board post (its last change, ms) this phone had seen when it last opened the board, by
   *  who I am (components/board/posts.svelte.ts: the 「！」 over the board). */
  boardSeen: 'island.boardSeen'
} as const;

export const DEMO = {
  /** localStorage: today's demo taps, shared by both players' tabs. */
  events: 'island-demo.events',
  /** sessionStorage: `plain` | `harvest`, sticky for the tab once `?demo` was opened. */
  mode: 'island-demo.mode',
  /** sessionStorage: which player this tab is (`?demo&as=B`). */
  as: 'island-demo.as',
  /** sessionStorage: how many weeks of history the demo makes (`?demo&weeks=60`; default 8). */
  weeks: 'island-demo.weeks',
  /** localStorage: the demo's relay (sync/live-local.ts): `{ day, log }`, the day's shared world both tabs keep. */
  relay: 'island-demo.relay',
  /** localStorage: when each player's tab last left (sync/live-local.ts: the relay's welcome `gone`). */
  gone: 'island-demo.gone',
  /** localStorage `island-demo.world.<A|B>`: the demo's shared world as each player's tab folded it (store/world.svelte.ts). */
  world: 'island-demo.world',
  /** localStorage: the demo's decorations (store/decor.svelte.ts), both players' tabs' (kept for good, as the sheet). */
  decor: 'island-demo.decor',
  /** localStorage: the demo's tent (store/tent.svelte.ts), both players' tabs' (kept for good, as the sheet). */
  tent: 'island-demo.tent',
  /** localStorage: the demo's layout (store/layout.svelte.ts), both players' tabs'. */
  layout: 'island-demo.layout',
  /** localStorage: the demo's board seen marks (components/board/posts.svelte.ts), by player. */
  boardSeen: 'island-demo.boardSeen'
} as const;

/** This phone's own preferences (not data, never synced; shared by the live app and the demo). */
export const DEVICE = {
  /** localStorage: `{ music, sfx, volume }` (lib/sound/settings.ts; all off by default). */
  sound: 'island.sound',
  /** localStorage: the language last shown (`ja` / `en`), so an English launch loads its strings before the first paint
   *  (the `locale` pref stays the truth). */
  locale: 'island.locale',
  /** localStorage: `{ on, endpoint?, lang?, at? }`: せってい's つうち switch and what the relay was last given
   *  (sync/push.ts; off by default). */
  push: 'island.push',
  /** localStorage: `[text…]`: my own phrases for my villager's balloon, the last few, newest first (island/say.ts). */
  says: 'island.says',
  /** localStorage: `[code…]`: the tent's pieces I picked last, newest first (tent/TentEdit.svelte's さいきん tab). */
  tentRecent: 'island.tentRecent',
  /** localStorage: `{ [who]: day }`: the Tokyo day this phone last showed the tent's HHA letter, by who I am (the demo's
   *  tabs share it; tent/TentRoom.svelte). */
  tentRated: 'island.tentRated',
  /** localStorage: how many times this phone said 「いまの かぐを おいてね」 (a tap on another piece while one is held:
   *  the hint shows the first few times only; tent/TentEdit.svelte). */
  tentHoldHint: 'island.tentHoldHint',
  /** localStorage: `3d` | `2d`: how this phone draws the island (せってい's 3D switch; store/islandRender.svelte.ts). */
  islandRender: 'island.render'
} as const;

/** The island scene's own small keys (not data: losing them only replays a greeting or a balloon). */
export const SCENE = {
  /** localStorage `if-<beat>` = the Tokyo day a startup beat (open, morning, evening, lowweek) last played. */
  beat: (beat: string) => `if-${beat}`,
  /** localStorage `hf-got.<A|B>` = `{ day, ats }`: the partner's high-fives this person's phone heard that Tokyo day, by
   *  their tap's relay time (island/highFives.ts: each one's banner once; per person: the demo's two tabs share it). */
  highFivesGot: (me: string) => `hf-got.${me}`,
  /** localStorage `bells-seen` = `{ date, parts: { A, B } }`: today's ベル per person and fruit already shown flying into
   *  the wallet, so only new earnings fly in. */
  bellsSeen: 'bells-seen',
  /** localStorage `scene-day` = `{ date, picked: [uid…] }`: the day items (shells, fossils, the bottle, fragments, weeds)
   *  this phone picked up, dug or pulled today (island/sceneDay.ts; a new day starts empty). */
  day: 'scene-day',
  /** localStorage `fruit-day` = `{ date, dropped: [id…], picked: [id…] }`: today's met fruit this phone has shown
   *  falling and picked up (`A:pear`; island/fruitDay.ts; a new day starts empty). */
  fruit: 'fruit-day',
  /** localStorage `scene-wish` = `{ <Tokyo date>: n }`: this phone's wishes on shooting stars, each a star fragment on
   *  that morning's beach (island/stars.ts, sceneDay.ts). */
  wish: 'scene-wish',
  /** localStorage `fireworks-day` = the Tokyo date this phone last showed the both-of-us-met-everything volley
   *  (island/Fireworks.svelte: once a day). */
  fireworks: 'fireworks-day',
  /** localStorage `scene-garden` = `{ date, watered: ['fl:x:z'…], hybrid }`: the flowers watered today and the hybrid
   *  today shows (from yesterday's watering). */
  garden: 'scene-garden',
  /** localStorage `scene-stretch` = `{ date, morning, done }`: today's group stretching on this phone (island/stretching.ts):
   *  whether the island was opened 06:00–08:00 (the tape deck's morning) and whether it already played. */
  stretch: 'scene-stretch',
  /** localStorage `scene-franklin` = `{ date, asked, fed }`: Turkey Day on this phone (island/Visitor.svelte): whether
   *  Franklin asked for his fish and whether a catch made him happy. */
  franklin: 'scene-franklin',
  /** localStorage `scene-wedding` = the date the wedding day's confetti last burst on this phone (island/Wedding.svelte). */
  wedding: 'scene-wedding',
  /** localStorage `scene-birthday` = `{ date, confetti, candles }`: a birthday on this phone (island/birthday.ts): whether the
   *  confetti has burst and whether the cake's candles are out. */
  birthday: 'scene-birthday'
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
/** Who this phone is paired as (`G`: the guest). */
export const getStoredMe = (): Who | null => readJson<Who>(local, LIVE.me);
export const storeMe = (me: Who): boolean => writeJson(local, LIVE.me, me);
