// static/audio/manifest.json → which sounds have real files (docs/design/sound.md §9). Bundled at build time like
// the art manifest, so the engine knows synchronously what to fetch and what to synthesise. The audio SOURCE is
// pluggable: drop a file under static/audio/, add its line to the JSON, rebuild. Unknown keys are ignored (and
// flagged by the test), so a typo never breaks the app.
import { asset } from '$app/paths';
import raw from '../../../static/audio/manifest.json';
import { isSoundId, type SoundId } from './ids.ts';
import { WEATHERS, hourKey, type MusicFiles, type MusicTrack, type Weather } from './hourly.ts';
import { AMBIENT_IDS, type AmbientId } from './ambient.ts';

export interface AudioManifest {
  sfx: Partial<Record<SoundId, string>>;
  /** The opening theme (a one-shot). */
  opening: string | null;
  music: MusicFiles;
  ambient: Partial<Record<AmbientId, string>>;
}

const HOURS = new Set(Array.from({ length: 24 }, (_, h) => hourKey(h)));
const str = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

/** Keep the well-formed entries; `problems` lists what was dropped. */
export function parseManifest(json: unknown): { manifest: AudioManifest; problems: string[] } {
  const problems: string[] = [];
  const root = obj(json);
  const sfx: AudioManifest['sfx'] = {};
  for (const [k, v] of Object.entries(obj(root.sfx))) {
    if (isSoundId(k) && str(v)) sfx[k] = v;
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
      // a bare path plays from 0; { file, start } from `start` s
      const t = str(v) ? { file: v, start: 0 } : obj(v);
      const start = typeof t.start === 'number' && t.start >= 0 ? t.start : 0;
      if (HOURS.has(h) && str(t.file)) out[h] = { file: t.file, start };
      else problems.push(`music.${w}.${h}`);
    }
    music[w as Weather] = out;
  }
  const ambient: AudioManifest['ambient'] = {};
  for (const [k, v] of Object.entries(obj(root.ambient))) {
    if (AMBIENT_IDS.includes(k as AmbientId) && str(v)) ambient[k as AmbientId] = v;
    else problems.push(`ambient.${k}`);
  }
  if (root.opening !== undefined && root.opening !== null && !str(root.opening)) problems.push('opening');
  return { manifest: { sfx, opening: str(root.opening) ? root.opening : null, music, ambient }, problems };
}

export const AUDIO = parseManifest(raw).manifest;

/** URL of a manifest path (under the app's base path). */
export const audioUrl = (path: string): string => asset(`audio/${path}` as Parameters<typeof asset>[0]);

/** Any hourly track at all (the settings say so when there is none yet). */
export const hasMusic = (m: AudioManifest = AUDIO): boolean => Object.values(m.music).some((h) => Object.keys(h ?? {}).length > 0);
