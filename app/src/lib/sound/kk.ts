// K.K. Slider's songs (docs/design.md#kk-slider): the list he plays from on the island (his stool,
// island/KKSlider.svelte) and the tent's stereos play as airchecks. The list (static/audio/kk.json: 73 songs and
// their airchecks, the audio manifest's bulk) isn't in the app's first chunk: loadKK() imports it the first time K.K.
// or a stereo shows, or a song is asked for. Add a song: a row in scripts/music.ts `KK` (its titles and the source's
// track numbers) and `npm run audio:music -- <dir> --only '^kk'`; no code change. Play one for everyone with
// stage.svelte.ts request(src, id) (docs/sound-sync.md: the island's stage his live file, a room's stereo its
// aircheck): the music where it plays stops for it and comes back after, as in NH; live(src) is the song playing.
import { pickOne } from '#lib/random.ts';
import { i18n } from '#lib/i18n/index.ts';
import { obj, str, track } from './manifest.ts';
import type { MusicTrack } from './hourly.ts';

/** One of K.K.'s songs (`kk[]`, in NH's song-list order): NH's official titles, a one-shot file under audio/kk/. */
export interface KKTrack extends MusicTrack {
  id: string;
  ja: string;
  en: string;
}

/** Where a K.K. song plays from: K.K. himself on the island (`live`), or a stereo in a room (`aircheck`, NH's
 *  recorded version). */
export type KKSource = 'live' | 'aircheck';

/** The songs with a file, in NH's song-list order, and their airchecks (NH's stereo version, by song id: a one-shot;
 *  a song with none plays its live file). */
interface KKList {
  tracks: readonly KKTrack[];
  airchecks: Partial<Record<string, MusicTrack>>;
}

/** Keep the well-formed songs and airchecks; `problems` lists what was dropped. */
export function parseKK(json: unknown): { list: KKList; problems: string[] } {
  const root = obj(json), problems: string[] = [];
  const tracks: KKTrack[] = [];
  (Array.isArray(root.kk) ? root.kk : []).forEach((v: unknown, i) => {
    const o = obj(v), t = track(v);
    if (t && str(o.id) && str(o.ja) && str(o.en) && !tracks.some((k) => k.id === o.id)) tracks.push({ id: o.id, ja: o.ja, en: o.en, ...t, start: 0 });
    else problems.push(`kk.${i}`);
  });
  const airchecks: KKList['airchecks'] = {};
  for (const [k, v] of Object.entries(obj(root.kkAircheck))) {
    const t = track(v);
    if (t && /^[a-z0-9-]+$/.test(k)) airchecks[k] = { ...t, start: 0 };
    else problems.push(`kkAircheck.${k}`);
  }
  return { list: { tracks, airchecks }, problems };
}

const EMPTY: KKList = { tracks: [], airchecks: {} };
let loading: Promise<KKList> | null = null;
let loaded: KKList | null = null;

/** The list, imported once (its own chunk). Offline before the chunk came: empty, and the next call tries again. */
export function loadKK(): Promise<KKList> {
  return (loading ??= import('../../../static/audio/kk.json').then(
    (m) => (loaded = parseKK(m.default).list),
    () => {
      loading = null;
      return EMPTY;
    }
  ));
}

/** The list if it has loaded (null: not yet). */
export const kkLoaded = (): KKList | null => loaded;

/** The track `id` plays from a source, with its song (null: no such song, or the list isn't here yet): from a stereo
 *  its aircheck, else (none) its live file, as K.K. plays it. */
export function kkTrack(id: string, source: KKSource, list: KKList | null = loaded): { song: KKTrack; track: MusicTrack } | null {
  const song = list?.tracks.find((k) => k.id === id);
  return song ? { song, track: kkFile(song, source, list!.airchecks) } : null;
}

/** A song's title in the app's language (NH's official one). */
export const kkTitle = (k: Pick<KKTrack, 'ja' | 'en'>): string => (i18n.locale === 'en' ? k.en : k.ja);

/** A song for a request-less play (NH: K.K. picks): any but the last one heard. */
export function kkPick(r: () => number, last: string | null | undefined, tracks: readonly KKTrack[]): KKTrack | null {
  const pool = tracks.length > 1 ? tracks.filter((k) => k.id !== last) : tracks;
  return pickOne(pool, r) ?? null;
}

/** The file a song plays from a source: from a stereo its aircheck, else (none yet) its live file, as K.K. plays it. */
export function kkFile(song: KKTrack, source: KKSource, airchecks: KKList['airchecks']): MusicTrack {
  return (source === 'aircheck' && airchecks[song.id]) || song;
}
