// K.K. Slider's songs (docs/design.md#kk-slider): the pluggable list his Saturday show plays from. Add a song: its
// file under static/audio/kk/ (a one-shot AAC .m4a, `npm run audio:music -- --extras <dir>`) and its line in
// static/audio/manifest.json `kk` ({ id, ja, en, file, gain }); no code change. Play one with sound.svelte.ts
// playKK(id): the island's music stops for it and comes back after, as in NH; `sound.kk` is the song playing.
import { pickOne } from '#lib/random.ts';
import { AUDIO, type KKTrack } from './manifest.ts';

export type { KKTrack };

/** Every K.K. song with a file, in NH's song-list order: `{ id, ja, en, file, gain? }` (ja/en: NH's official
 *  titles). Empty until files are added. */
export const kkTracks: readonly KKTrack[] = AUDIO.kk;

/** A song for a request-less play (NH: K.K. picks): any but the last one heard. */
export function kkPick(r: () => number, last?: string | null, tracks: readonly KKTrack[] = kkTracks): KKTrack | null {
  const pool = tracks.length > 1 ? tracks.filter((k) => k.id !== last) : tracks;
  return pickOne(pool, r) ?? null;
}
