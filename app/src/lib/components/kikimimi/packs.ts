// ききみみ's audio packs on the phone (docs/kikimimi.md "Audio", docs/kikimimi-framework.md §6): a clip is a slice of
// its pack (static/audio/listen/<pack>.<hash>.pak, kikimimi/packing.ts), where its loaded chunk says (clips.ts clipAt).
// A pack is fetched whole, never by Range (the service worker passes a Range request through uncached: caches.ts
// LISTEN_CACHE keeps whole packs), held in memory among the most recently used (HOLD_BYTES), and each clip's bytes
// sliced out for the engine to decode (sound.svelte.ts loadVoice: its LRU of decoded clips, keyed by pack and offset).
// The lobby fetches its deck's packs ahead (prefetchClips: the first question's first), as it fetched its clips.
import { clipAt } from '#lib/kikimimi/clips.ts';
import type { PackRef } from '#lib/kikimimi/packing.ts';
import { audioUrl } from '#lib/sound/manifest.ts';
import { loadVoice } from '#lib/sound/sound.svelte.ts';

/** The packs held in memory (bytes): any one game's (a level-4 deck may touch all eight of its level's ~1.15 MB packs). */
const HOLD_BYTES = 12_000_000;

/** A pack's URL (its stem names its content: cached for good). */
export const packUrl = (stem: string): string => audioUrl(`listen/${stem}.pak`);

export class PackStore {
  /** Packs asked for, least recently used first: their bytes (null: offline, not kept). */
  #held = new Map<string, Promise<ArrayBuffer | null>>();
  #size = new Map<string, number>();
  readonly #get: (url: string) => Promise<Response>;
  readonly #cap: number;

  constructor(get: (url: string) => Promise<Response> = (u) => fetch(u), cap = HOLD_BYTES) {
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
    const p: Promise<ArrayBuffer | null> = this.#get(packUrl(stem))
      .then((r) => (r.ok ? r.arrayBuffer() : null))
      .catch(() => null)
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

  /** A clip's bytes: a copy of its slice of the pack (decodeAudioData detaches what it's given); null without the pack
   *  or past its end. */
  async bytes(ref: PackRef): Promise<ArrayBuffer | null> {
    const [stem, offset, n] = ref;
    const b = await this.pack(stem);
    return b && offset + n <= b.byteLength ? b.slice(offset, offset + n) : null;
  }

  /** These packs fetched ahead, in this order. */
  prefetch(stems: Iterable<string>): void {
    for (const s of new Set(stems)) void this.pack(s);
  }

  /** Every pack let go (the sheet closed). */
  clear(): void {
    this.#held.clear();
    this.#size.clear();
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

/** The packs of these clips fetched ahead (the lobby's deck: the first question's first). */
export function prefetchClips(ids: readonly string[]): void {
  packs.prefetch(ids.flatMap((id) => clipAt(id)?.[0] ?? []));
}
