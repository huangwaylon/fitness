// The shared music stages (docs/sound-sync.md): what plays on the island (`isl`: K.K., the island's cut-ins) and on
// each room's stereo (`t`, `u`, `v`), one record per stage, the same on every phone. A record says what plays from when
// (`at`, the relay's clock) for how long; anyone starts, replaces or stops one (last writer wins by (at, who):
// live-protocol newerMusic, the relay's rule too). Every phone projects it on its own: the visuals for everyone, the
// sound (sound.svelte.ts syncMusic) where the stage is, from where the song is now. Nothing goes out when a song ends:
// each phone reaches its end by itself.
//   bindStage({ send, serverNow, me })     once, the layout: the relay (store/world.svelte.ts)
//   request('isl', 'kk-march')  ·  hush('isl')    from a tap
//   hear(record)  ·  acked(intent, t)      the room's records (mine too, at hello) and my own's ack (its clamp)
//   enterStage('t')  → leave               where I am (the island page, a home's room)
//   live('isl')                            what plays there now (reactive through `stage.on`)
import { MUSIC_MS_MAX, MUSIC_SKEW_MS, MUSIC_STOP_KEEP_MS, musicLive, newerMusic, type Intent, type MusicRec, type MusicSrc, type Who } from '#lib/contract/live-protocol.ts';
import { AUDIO } from './manifest.ts';
import { kkTrack } from './kk.ts';
import type { EventMusicId } from './events.ts';
import type { MusicTrack } from './hourly.ts';

/** A stage's record: `song` null when stopped. */
export interface Stage {
  src: MusicSrc;
  song: string | null;
  at: number;
  ms: number;
  who: Who;
  pc?: string;
}

/** A song with no length in its manifest (`d`) is taken to last this long (ms). */
const DEFAULT_MS = 360_000;

/** The stages' records (the stopped ones too, for a while: an older start heard late stays beaten), and where I am. */
export const stage = $state<{ on: Partial<Record<MusicSrc, Stage>>; here: MusicSrc | null }>({ on: {}, here: null });

interface Net {
  send(i: Intent): boolean;
  serverNow(): number;
  me(): Who | null;
}
let net: Net = { send: () => false, serverNow: () => Date.now(), me: () => null };
const subs = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | undefined;

/** The relay in use (the layout, once). */
export function bindStage(n: Net): void {
  net = n;
}

/** Called at each change of a stage or of where I am (sound.svelte.ts: syncMusic, inside the tap that asked). */
export function onStage(fn: () => void): () => void {
  subs.add(fn);
  return () => void subs.delete(fn);
}

const changed = () => subs.forEach((f) => f());

/** The file a stage's song plays from: an island cut-in (`ev-<id>`, events.ts), else a K.K. song, his live file on
 *  the island, its aircheck on a room's stereo. Null: no such song, or K.K.'s list not loaded yet (kk.ts loadKK). */
export function stageTrack(src: MusicSrc, song: string): MusicTrack | null {
  if (song.startsWith('ev-')) return AUDIO.events[song.slice(3) as EventMusicId] ?? null;
  return kkTrack(song, src === 'isl' ? 'live' : 'aircheck')?.track ?? null;
}

/** Take a record if it beats the stage's (newerMusic) and still says something (musicLive). */
function put(s: Stage): boolean {
  const cur = stage.on[s.src];
  if ((cur && !newerMusic(s, cur)) || !musicLive({ ...s, song: s.song ?? undefined }, net.serverNow())) return false;
  stage.on = { ...stage.on, [s.src]: s };
  sweep();
  changed();
  return true;
}

/** Let the records that say nothing any more go (a song over, a stop long past), and wake at the next end. */
function sweep(): void {
  clearTimeout(timer);
  const now = net.serverNow();
  const on = Object.fromEntries(Object.entries(stage.on).filter(([, s]) => musicLive({ ...s, song: s.song ?? undefined }, now)));
  const gone = Object.keys(on).length < Object.keys(stage.on).length;
  if (gone) stage.on = on;
  const ends = Object.values(on).map((s) => s.at + (s.song ? s.ms : MUSIC_STOP_KEEP_MS));
  if (ends.length) timer = setTimeout(sweep, Math.max(0, Math.min(...ends) - now) + 20);
  if (gone) changed();
}

/** Play `song` on stage `src` for everyone (from a tap): `ms` its length (else the file's `d`), `pc` the stereo. */
export function request(src: MusicSrc, song: string, o: { ms?: number; pc?: string } = {}): void {
  const cur = stage.on[src];
  // after the stage's record whatever this phone's clock says: a tap always replaces what plays
  const at = Math.max(Math.round(net.serverNow()), (cur?.at ?? 0) + 1);
  const ms = Math.min(MUSIC_MS_MAX, Math.max(1, Math.round(o.ms ?? (stageTrack(src, song)?.dur ?? DEFAULT_MS / 1000) * 1000)));
  put({ src, song, at, ms, who: net.me() ?? 'A', ...(o.pc ? { pc: o.pc } : {}) });
  net.send({ kind: 'music', src, at, song, ms, ...(o.pc ? { pc: o.pc } : {}) });
}

/** Stop stage `src` for everyone (from a tap). */
export function hush(src: MusicSrc): void {
  const at = Math.max(Math.round(net.serverNow()), (stage.on[src]?.at ?? 0) + 1);
  put({ src, song: null, at, ms: 0, who: net.me() ?? 'A' });
  net.send({ kind: 'music', src, at });
}

/** A record the room sent (another's, or mine: at my hello, or the one that beat mine). */
export function hear(m: MusicRec): void {
  put({ src: m.src, song: m.song ?? null, at: m.at, ms: m.ms ?? 0, who: m.who, ...(m.pc ? { pc: m.pc } : {}) });
}

/** My record's ack: the room took its `at` as its own clock (`t`) when it was over MUSIC_SKEW_MS off (an offline tap,
 *  a wrong clock), so this phone does too. */
export function acked(i: Intent, ok: boolean, t: number): void {
  if (i.kind !== 'music' || !ok || Math.abs(i.at - t) <= MUSIC_SKEW_MS) return;
  const cur = stage.on[i.src];
  if (cur?.at !== i.at || cur.who !== net.me()) return;
  stage.on = { ...stage.on, [i.src]: { ...cur, at: t } };
  sweep();
  changed();
}

/** I'm where stage `src` plays (the island page, a home's room): its sound is heard here. Returns the leaving. */
export function enterStage(src: MusicSrc): () => void {
  stage.here = src;
  changed();
  return () => {
    if (stage.here !== src) return;
    stage.here = null;
    changed();
  };
}

/** What plays on stage `src` now (null: nothing, stopped or over): its record, how far in. */
export function live(src: MusicSrc, now = net.serverNow()): (Stage & { song: string; elapsedMs: number }) | null {
  const s = stage.on[src];
  return s?.song && now < s.at + s.ms ? { ...s, song: s.song, elapsedMs: Math.max(0, now - s.at) } : null;
}

/** The relay's clock less this device's (ms): a record's `at` on this device's clock is `at − skew()`. */
export const skew = (): number => net.serverNow() - Date.now();

/** Forget every record (tests). */
export function resetStage(): void {
  clearTimeout(timer);
  stage.on = {};
  stage.here = null;
  subs.clear();
  net = { send: () => false, serverNow: () => Date.now(), me: () => null };
}
