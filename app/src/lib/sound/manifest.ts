// static/audio/manifest.json → which sounds have real files (docs/design.md#audio-files). Bundled at build time like
// the art manifest, so the engine knows synchronously what to fetch and what to synthesise (K.K.'s songs, the
// manifest's bulk, are their own kk.json, loaded when first needed: kk.ts). The audio SOURCE is
// pluggable: drop a file under static/audio/, add its line to the JSON, rebuild. Unknown keys are ignored (and
// flagged by the test), so a typo never breaks the app.
import raw from '../../../static/audio/manifest.json';
import { isSoundId, type SoundId } from './ids.ts';
import { WEATHERS, hourKey, type MusicFiles, type MusicTrack, type Weather } from './hourly.ts';
import { AMBIENT_IDS, type AmbientId } from './ambient.ts';
import { EVENT_MUSIC_IDS, type EventMusicId } from './events.ts';
import { PLACE_IDS, type PlaceId } from './places.ts';
import { staticUrl } from '#lib/staticUrl.ts';

export interface AudioManifest {
  sfx: Partial<Record<SoundId, string>>;
  /** The opening theme (a one-shot; `start` 0). */
  opening: MusicTrack | null;
  music: MusicFiles;
  ambient: Partial<Record<AmbientId, string>>;
  /** Event music (events.ts): loops like the hours, the midnight jingle and the sting one-shots. */
  events: Partial<Record<EventMusicId, MusicTrack>>;
  /** A building's room's music (places.ts): loops like the hours, played indoors in place of the island's. */
  places: Partial<Record<PlaceId, MusicTrack>>;
}

const HOURS = new Set(Array.from({ length: 24 }, (_, h) => hourKey(h)));
export const str = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
export const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** An entry's path with its content hash (`v`, scripts/music.ts --hashes) as `?v=`: a re-cut file under the same name
 *  is a new URL, so neither the service worker's cache nor the browser's (/audio/* is immutable) serves the old one.
 *  The path is the file's key everywhere after (the engine's blobs, its pins). */
const versioned = (file: string, v: unknown): string => (typeof v === 'string' && /^[0-9a-f]{4,16}$/.test(v) ? `${file}?v=${v}` : file);

/** An effect's or a bed's entry: `{ file, v }` (or a plain path). */
function path(v: unknown): string | null {
  if (str(v)) return v;
  const t = obj(v);
  return str(t.file) ? versioned(t.file, t.v) : null;
}

/** `{ file, start, end?, gain?, v?, d? }` plays from `start` s (see MusicTrack). A bad `end` (not after `start`) falls
 *  back to `<audio loop>`; a bad `gain` to 0 dB. */
export function track(v: unknown): MusicTrack | null {
  const t = obj(v);
  if (!str(t.file)) return null;
  const start = num(t.start) && t.start >= 0 ? t.start : 0;
  const out: MusicTrack = { file: versioned(t.file, t.v), start };
  if (num(t.end) && t.end > start) out.end = t.end;
  if (num(t.gain)) out.gain = t.gain;
  if (num(t.d) && t.d > 0) out.dur = t.d;
  return out;
}

/** Keep the well-formed entries; `problems` lists what was dropped. */
export function parseManifest(json: unknown): { manifest: AudioManifest; problems: string[] } {
  const problems: string[] = [];
  const root = obj(json);
  const sfx: AudioManifest['sfx'] = {};
  for (const [k, v] of Object.entries(obj(root.sfx))) {
    const p = path(v);
    if (isSoundId(k) && p) sfx[k] = p;
    else problems.push(`sfx.${k}`);
  }
  const music: MusicFiles = {};
  for (const [w, hours] of Object.entries(obj(root.music))) {
    if (!WEATHERS.includes(w as Weather)) {
      problems.push(`music.${w}`);
      continue;
    }
    const out: Partial<Record<string, MusicTrack>> = {};
    for (const [h, v] of Object.entries(obj(hours))) {
      const t = track(v);
      if (HOURS.has(h) && t) out[h] = t;
      else problems.push(`music.${w}.${h}`);
    }
    music[w as Weather] = out;
  }
  const ambient: AudioManifest['ambient'] = {};
  for (const [k, v] of Object.entries(obj(root.ambient))) {
    const p = path(v);
    if (AMBIENT_IDS.includes(k as AmbientId) && p) ambient[k as AmbientId] = p;
    else problems.push(`ambient.${k}`);
  }
  const opening = root.opening === undefined || root.opening === null ? null : track(root.opening);
  if (!opening && root.opening !== undefined && root.opening !== null) problems.push('opening');
  const events: AudioManifest['events'] = {};
  for (const [k, v] of Object.entries(obj(root.events))) {
    const t = track(v);
    if (EVENT_MUSIC_IDS.includes(k as EventMusicId) && t) events[k as EventMusicId] = t;
    else problems.push(`events.${k}`);
  }
  const places: AudioManifest['places'] = {};
  for (const [k, v] of Object.entries(obj(root.places))) {
    const t = track(v);
    if (PLACE_IDS.includes(k as PlaceId) && t) places[k as PlaceId] = t;
    else problems.push(`places.${k}`);
  }
  return { manifest: { sfx, opening: opening && { ...opening, start: 0 }, music, ambient, events, places }, problems };
}

export const AUDIO = parseManifest(raw).manifest;

/** URL of a manifest path (under the app's base path). */
export const audioUrl = (path: string): string => staticUrl(`audio/${path}`);

/** Any hourly track at all (the settings say so when there is none yet). */
export const hasMusic = (): boolean => Object.values(AUDIO.music).some((h) => Object.keys(h ?? {}).length > 0);
