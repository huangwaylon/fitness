// K.K. Slider's songs (docs/design.md#kk-slider): the pluggable list he plays from on the island (his stool,
// island/KKSlider.svelte) and the tent's stereos play as airchecks. Add a song: its file under static/audio/kk/ (a
// one-shot AAC .m4a, `npm run audio:music -- --extras <dir>`) and its line in static/audio/manifest.json `kk`
// ({ id, ja, en, file, gain }); its aircheck (NH's stereo version) at `kkAircheck.<id>` ({ file, start: 0, gain }); no
// code change. Play one with sound.svelte.ts playKK(id, source): the island's music stops for it and comes back after,
// as in NH; `sound.kk` is the song playing, `sound.kkFrom` where from.
import { pickOne } from '#lib/random.ts';
import { AUDIO, type KKTrack } from './manifest.ts';
import type { MusicTrack } from './hourly.ts';

export type { KKTrack };
/** Where a K.K. song plays from: K.K. himself on the island (`live`), or a stereo in a room (`aircheck`, NH's
 *  recorded version). */
export type KKSource = 'live' | 'aircheck';

/** Every K.K. song with a file, in NH's song-list order: `{ id, ja, en, file, gain? }` (ja/en: NH's official
 *  titles). Empty until files are added. */
export const kkTracks: readonly KKTrack[] = AUDIO.kk;

/** A song for a request-less play (NH: K.K. picks): any but the last one heard. */
export function kkPick(r: () => number, last?: string | null, tracks: readonly KKTrack[] = kkTracks): KKTrack | null {
  const pool = tracks.length > 1 ? tracks.filter((k) => k.id !== last) : tracks;
  return pickOne(pool, r) ?? null;
}

/** The file a song plays from a source: from a stereo its aircheck, else (none yet) its live file, as K.K. plays it. */
export function kkFile(song: KKTrack, source: KKSource, airchecks: Partial<Record<string, MusicTrack>> = AUDIO.kkAircheck): MusicTrack {
  return (source === 'aircheck' && airchecks[song.id]) || song;
}
