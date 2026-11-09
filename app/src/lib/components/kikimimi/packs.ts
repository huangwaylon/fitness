// ききみみ's audio packs on the phone (docs/kikimimi-engine.md "Audio", "Loading"): a clip is a slice of
// its pack (static/audio/listen/<pack>.<hash>.pak, kikimimi/packing.ts), where its loaded chunk says (clips.ts clipAt).
// A pack holding WHOLE_AT of a deck's clips (a bedtime chapter's, a たちぎき pair's) is fetched whole and held in memory among the
// most recently used (HOLD_BYTES), each clip's bytes sliced out for the engine to decode (sound.svelte.ts loadVoice: its
// LRU of decoded clips, keyed by pack and offset); any other clip is fetched alone, its bytes as a Range of its pack
// (`<pack>.pak?s=<from>-<to>`, which the service worker keeps per slice: a lesson's few bank clips are ~25 KB each, not
// three 1.2 MB packs, where the host answers Ranges; Pages answers with the whole pack, then held: lib/packStore.ts). The lobby fetches its deck's packs and slices ahead (prefetchClips: the first question's first).
import { clipAt } from '#lib/kikimimi/clips.ts';
import type { PackRef } from '#lib/kikimimi/packing.ts';
import { audioUrl } from '#lib/sound/manifest.ts';
import { loadVoice } from '#lib/sound/sound.svelte.ts';
import { PackStore as Store, sliceOf } from '#lib/packStore.ts';

/** The packs held in memory (bytes): any one game's (a level-4 deck may touch all eight of its level's ~1.15 MB packs). */
const HOLD_BYTES = 12_000_000;

/** A pack's URL (its stem names its content: cached for good). */
export const packUrl = (stem: string): string => audioUrl(`listen/${stem}.pak`);
/** A clip's slice of its pack: the pack's URL with the bytes asked for (the service worker's cache key, caches.ts
 *  packSlice), and the Range that asks for them. */
export const sliceUrl = (ref: PackRef): string => sliceOf(packUrl(ref[0]), ref);
/** A pack holding this many of a deck's clips is fetched whole (its other clips come with it); else each clip alone. */
export const WHOLE_AT = 16;

/** The packs and slices (lib/packStore.ts), and a deck's fetched ahead. */
export class PackStore extends Store {
  constructor(get: (url: string, init?: RequestInit) => Promise<Response> = (u, i) => fetch(u, i), cap = HOLD_BYTES) {
    super({ url: packUrl, get, cap, tag: 'kiki' });
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
      asks.push(whole ? () => this.pack(ref[0]) : () => (this.holds(ref[0]) ? Promise.resolve() : this.slice(ref)));
    }
    const [first, ...rest] = asks;
    if (first) void first().then(() => rest.forEach((ask) => void ask()));
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
