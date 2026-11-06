// What the music plays (docs/design.md#sound), pure: the island's own music at a moment (an event's track, its
// midnight intro once, else the hour's), a room's, the order they win in, what stays fetched under a change, and what
// the settings' note and the Now Playing tile say. sound.svelte.ts holds the state and plays the result.
import { trackAt, type Fade, type MusicTrack, type Weather } from './hourly.ts';
import { eventMusicAt, type CutInId, type EventMusicId } from './events.ts';
import { placeTrack, type PlaceId } from './places.ts';
import { kkTitle, type KKTrack } from './kk.ts';
import type { AudioManifest } from './manifest.ts';
import { dayKey } from '#lib/time/clock.ts';
import { t } from '#lib/i18n/index.ts';

/** What the music is: the opening theme, the hour's track, an event's (events.ts, the wasps' too), a room's
 *  (places.ts), a K.K. song, or nothing. */
export type Playing = 'opening' | 'hour' | EventMusicId | PlaceId | 'kk' | null;

/** A track the engine should play: its key, whether it loops, and its fade (hourly.ts: a cut-in's quick swap). */
export interface Want {
  key: string;
  track: MusicTrack;
  playing: Exclude<Playing, null>;
  loop: boolean;
  fade?: Fade;
}

/** A cut-in of my own over the island's music, as in NH (events.ts CutInId: the wasps' chase and sting, Franklin's
 *  cooking, `next` played after it). */
export interface CutIn extends Want {
  id?: CutInId;
  next?: CutInId[];
}

type Files = Pick<AudioManifest, 'events' | 'music' | 'places' | 'opening'>;

/** The cut-ins one may follow (the sting after the chase: kept fetched while the chase plays). */
const MAY_FOLLOW: Partial<Record<CutInId, CutInId>> = { 'bee-chase': 'bee-stung' };

/** The island's own music at an instant: the event's track on an event day (its midnight intro first, unless `heard`
 *  that day), else the Tokyo hour's in the weather. */
export function musicAt(d: Date, weather: Weather, files: Files, heard: (day: string) => boolean): Want | null {
  const ev = eventMusicAt(d, weather);
  const intro = ev?.intro && files.events[ev.intro];
  if (ev?.intro && intro && !heard(dayKey(d))) return { key: `event/${ev.intro}`, track: intro, playing: ev.intro, loop: false };
  const id = ev && (files.events[ev.id] ? ev.id : ev.alt && files.events[ev.alt] ? ev.alt : null);
  if (id) return { key: `event/${id}`, track: files.events[id]!, playing: id, loop: true };
  const tr = trackAt(d, weather, files.music);
  return tr && { key: tr.key, track: tr, playing: 'hour', loop: true };
}

/** A room's track (null: outdoors, or the room has no file, so the island's music goes on). */
export function placeMusic(place: PlaceId | null, files: Files): Want | null {
  const tr = placeTrack(place, files.places);
  return tr && { key: `place/${tr.id}`, track: tr, playing: tr.id, loop: true };
}

/** The opening theme while it plays (a one-shot). */
export const openingMusic = (files: Files): Want | null => (files.opening ? { key: 'opening', track: files.opening, playing: 'opening', loop: false } : null);

/** What sounds, by priority (the first there): the opening theme (NH's title screen, while it plays), a cut-in of my
 *  own (the wasps: over everything, indoors too), the shared stage where I am (K.K., a room's stereo, the island's
 *  cut-ins: stage.svelte.ts), the room's track (indoors NH plays the building's music even on an event day), then the
 *  island's (the event's track on its day, else the hour's). */
export function pickMusic<T>(o: { opening?: T | null; cutIn?: T | null; stage?: T | null; place?: T | null; island?: T | null }): T | null {
  return o.opening ?? o.cutIn ?? o.stage ?? o.place ?? o.island ?? null;
}

/** The files a change keeps fetched (engine.ts pin): under a cut-in, what it interrupted (the room's and the island's,
 *  so coming back, or leaving the room meanwhile, starts at once), its chain's next and what may follow it; indoors,
 *  the island's (leaving starts it at once). */
export function pinsFor(o: { cutIn: CutIn | null; place: Want | null; island: Want | null; files: Files }): string[] {
  const { cutIn, place, island, files } = o;
  if (!cutIn) return place && island ? [island.track.file] : [];
  const after = [cutIn.next?.[0], cutIn.id && MAY_FOLLOW[cutIn.id]].map((id) => id && files.events[id]);
  return [...new Set([place?.track, island?.track, ...after].flatMap((tr) => (tr ? [tr.file] : [])))];
}

/** What the settings' note and the Now Playing tile say about the music (null: none); a K.K. song's title is the
 *  stage's (`kk`: its song, and whether a stereo's). */
export function playingLabel(playing: Playing, hour: number, kk: { song: KKTrack; aircheck: boolean } | null): string | null {
  if (playing === 'opening') return t('sound.opening');
  if (playing === 'hour') return t('sound.nowPlaying', { hour });
  if (playing === 'kk') return kk ? t(kk.aircheck ? 'sound.nowPlayingAircheck' : 'sound.nowPlayingTitle', { title: kkTitle(kk.song) }) : null;
  return playing ? t('sound.nowPlayingTitle', { title: t(`sound.title.${playing}`) }) : null;
}
