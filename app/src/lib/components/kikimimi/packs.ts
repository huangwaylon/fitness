// ききみみ's audio packs on the phone (docs/kikimimi-engine.md "Audio", "Loading"): a clip is a slice of
// its pack (static/audio/listen/<pack>.<hash>.pak, kikimimi/packing.ts), where its loaded chunk says (clips.ts clipAt).
// A pack holding WHOLE_AT of a deck's clips (a bedtime chapter's, a たちぎき pair's) is fetched whole and held in memory among the
// most recently used (HOLD_BYTES), each clip's bytes sliced out for the engine to decode (sound.svelte.ts loadVoice: its
// LRU of decoded clips, keyed by pack and offset); any other clip is fetched alone, its bytes as a Range of its pack
// (`<pack>.pak?s=<from>-<to>`, which the service worker keeps per slice: a lesson's few bank clips are ~25 KB each, not
// three 1.2 MB packs). The lobby fetches its deck's packs and slices ahead (prefetchClips: the first question's first).
import { clipAt } from '#lib/kikimimi/clips.ts';
import type { PackRef } from '#lib/kikimimi/packing.ts';
import { audioUrl } from '#lib/sound/manifest.ts';
import { loadVoice } from '#lib/sound/sound.svelte.ts';
import { quiet } from '#lib/quiet.ts';

/** The packs held in memory (bytes): any one game's (a level-4 deck may touch all eight of its level's ~1.15 MB packs). */
const HOLD_BYTES = 12_000_000;

/** A pack's URL (its stem names its content: cached for good). */
export const packUrl = (stem: string): string => audioUrl(`listen/${stem}.pak`);
/** A clip's slice of its pack: the pack's URL with the bytes asked for (the service worker's cache key, caches.ts
 *  isListenSlice), and the Range that asks for them. */
export const sliceUrl = ([stem, offset, n]: PackRef): string => `${packUrl(stem)}?s=${offset}-${offset + n - 1}`;
/** A pack holding this many of a deck's clips is fetched whole (its other clips come with it); else each clip alone. */
export const WHOLE_AT = 16;
/** The slices held in memory (a game's few, its replays and review). */
const HOLD_SLICES = 64;

export class PackStore {
  /** Packs asked for, least recently used first: their bytes (null: offline, not kept). */
  #held = new Map<string, Promise<ArrayBuffer | null>>();
  #size = new Map<string, number>();
  /** Slices asked for, least recently used first (key `stem:offset`). */
  #slices = new Map<string, Promise<ArrayBuffer | null>>();
  readonly #get: (url: string, init?: RequestInit) => Promise<Response>;
  readonly #cap: number;

  constructor(get: (url: string, init?: RequestInit) => Promise<Response> = (u, i) => fetch(u, i), cap = HOLD_BYTES) {
    this.#get = get;
    this.#cap = cap;
  }

  /** A pack's bytes, whole: fetched once at a time, held among the most recently used within the cap (the newest
   *  always); null when it can't be fetched (asked again, it tries again). */
  pack(stem: string): Promise<ArrayBuffer | null> {
    const had = this.#held.get(stem);
    if (had) {
      this.#held.delete(stem);
      this.#held.set(stem, had);
      return had;
    }
    const p: Promise<ArrayBuffer | null> = quiet(this.#get(packUrl(stem)).then((r) => (r.ok ? r.arrayBuffer() : null)), 'kiki.pack', null)
      .then((b) => {
        if (!b) {
          if (this.#held.get(stem) === p) this.#held.delete(stem);
          return null;
        }
        this.#size.set(stem, b.byteLength);
        this.#trim();
        return b;
      });
    this.#held.set(stem, p);
    return p;
  }

  #trim(): void {
    let total = [...this.#held.keys()].reduce((s, k) => s + (this.#size.get(k) ?? 0), 0);
    for (const k of [...this.#held.keys()].slice(0, -1)) {
      if (total <= this.#cap) break;
      total -= this.#size.get(k) ?? 0;
      this.#held.delete(k);
      this.#size.delete(k);
    }
  }

  /** A clip's bytes, a copy (decodeAudioData detaches what it's given): sliced from its pack when that's held or on its
   *  way, else fetched alone (slice); null when neither can be had, or past the pack's end. */
  async bytes(ref: PackRef): Promise<ArrayBuffer | null> {
    const [stem, offset, n] = ref;
    if (!this.#held.has(stem)) {
      const b = await this.slice(ref);
      return b && b.byteLength === n ? b.slice(0) : null;
    }
    const b = await this.pack(stem);
    return b && offset + n <= b.byteLength ? b.slice(offset, offset + n) : null;
  }

  /** A clip's bytes alone: a Range of its pack (a server that answers with the whole pack: sliced here), fetched once at
   *  a time, held among the most recent HOLD_SLICES; null when it can't be fetched (asked again, it tries again). */
  slice(ref: PackRef): Promise<ArrayBuffer | null> {
    const [stem, offset, n] = ref, key = `${stem}:${offset}`;
    const had = this.#slices.get(key);
    if (had) {
      this.#slices.delete(key);
      this.#slices.set(key, had);
      return had;
    }
    const p: Promise<ArrayBuffer | null> = quiet(this.#get(sliceUrl(ref), { headers: { range: `bytes=${offset}-${offset + n - 1}` } }).then(async (r) => {
      if (!r.ok) return null;
      // (the slice itself: a 206, or the service worker's 200 of just its bytes; else the whole pack, sliced here)
      const got = await r.arrayBuffer();
      return r.status === 206 || got.byteLength === n ? got : offset + n <= got.byteLength ? got.slice(offset, offset + n) : null;
    }), 'kiki.slice', null).then((b) => {
      if (!b && this.#slices.get(key) === p) this.#slices.delete(key);
      return b;
    });
    this.#slices.set(key, p);
    for (const k of [...this.#slices.keys()].slice(0, Math.max(0, this.#slices.size - HOLD_SLICES))) this.#slices.delete(k);
    return p;
  }

  /** A deck's clips fetched ahead, in order: a pack holding WHOLE_AT of them whole, the others' clips alone; the first
   *  clip's first, the rest once it's in (on 4G a level-4 deck's six packs at once took the first question's 6.3 s). */
  prefetch(refs: readonly PackRef[]): void {
    const per = new Map<string, number>();
    for (const [stem] of refs) per.set(stem, (per.get(stem) ?? 0) + 1);
    const asks: (() => Promise<unknown>)[] = [], seen = new Set<string>();
    for (const ref of refs) {
      const whole = (per.get(ref[0]) ?? 0) >= WHOLE_AT, key = whole ? ref[0] : `${ref[0]}:${ref[1]}`;
      if (seen.has(key)) continue;
      seen.add(key);
      asks.push(whole ? () => this.pack(ref[0]) : () => (this.#held.has(ref[0]) ? Promise.resolve() : this.slice(ref)));
    }
    const [first, ...rest] = asks;
    if (first) void first().then(() => rest.forEach((ask) => void ask()));
  }

  /** Every pack and slice let go (the sheet closed). */
  clear(): void {
    this.#held.clear();
    this.#size.clear();
    this.#slices.clear();
  }
}

export const packs = new PackStore();

/** A loaded clip (or its slow take) decoded: from the engine's decoded few, else sliced from its pack. Null when its
 *  chunk isn't loaded, offline and never cached, or with no voice session. */
export function voiceClip(id: string, slow = false): Promise<AudioBuffer | null> {
  const at = clipAt(id, slow);
  if (!at) return Promise.resolve(null);
  return loadVoice(`${at[0]}:${at[1]}`, () => packs.bytes(at));
}

/** These clips fetched ahead, their home pack whole (the lobby's deck: the first question's first). */
export function prefetchClips(ids: readonly string[]): void {
  packs.prefetch(ids.flatMap((id) => { const r = clipAt(id); return r ? [r] : []; }));
}
