// ききみみ's audio packs on the phone (docs/kikimimi-engine.md "Audio", "Loading"): a clip is a cut of its pack
// (static/audio/listen/<pack>.<hash>.pak, kikimimi/packing.ts), where its loaded chunk says (clips.ts clipAt). A pack is
// fetched whole, once, and held in memory among the most recently used (HOLD_BYTES; lib/packStore.ts), each clip's bytes
// cut out for the engine to decode (sound.svelte.ts loadVoice: its LRU of decoded clips, keyed by pack and offset). The
// lobby fetches its first question's packs once a game is in sight, the rest of its deck's at its countdown
// (prefetchClips, in the clips' order).
import { clipAt } from '#lib/kikimimi/clips.ts';
import { audioUrl } from '#lib/sound/manifest.ts';
import { loadVoice } from '#lib/sound/sound.svelte.ts';
import { PackStore } from '#lib/packStore.ts';

/** The packs held in memory (bytes): any one game's (a level-4 deck may touch all eight of its level's ~1.15 MB packs). */
const HOLD_BYTES = 12_000_000;

/** A pack's URL (its stem names its content: cached for good). */
export const packUrl = (stem: string): string => audioUrl(`listen/${stem}.pak`);

export const packs = new PackStore({ url: packUrl, cap: HOLD_BYTES, tag: 'kiki' });

/** A loaded clip (or its slow take) decoded: from the engine's decoded few, else cut from its pack. Null when its
 *  chunk isn't loaded, offline and never cached, or with no voice session. */
export function voiceClip(id: string, slow = false): Promise<AudioBuffer | null> {
  const at = clipAt(id, slow);
  if (!at) return Promise.resolve(null);
  return loadVoice(`${at[0]}:${at[1]}`, () => packs.bytes(at));
}

/** These clips' packs fetched ahead, in the clips' order (the lobby's deck: the first question's first). */
export function prefetchClips(ids: readonly string[]): void {
  packs.prefetch(ids.flatMap((id) => clipAt(id)?.[0] ?? []));
}
