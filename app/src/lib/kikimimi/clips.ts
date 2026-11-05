// ききみみ クイズ: the spoken clips (docs/kikimimi.md "Audio"). clips.json is written by scripts/kikimimi-audio.ts:
// each item's clip length (`dur`, s: the schedule is computed from it) and its files' content hashes (`?v=`: audio is
// cached first and never revalidated, so a re-spoken clip must be a new URL). Bundled with the game's chunk only.
import raw from './clips.json';

export interface Clip {
  /** The normal clip's length (s). */
  dur: number;
  /** The normal clip's content hash. */
  hash: string;
  /** The slow clip's content hash (levels 1 and 2). */
  slow?: string;
}

export const CLIPS: Readonly<Record<string, Clip>> = raw;

/** The clip's length (s), or undefined if it has none. */
export const clipDur = (id: string): number | undefined => CLIPS[id]?.dur;

/** An item's clip (or its slow clip) as the engine asks for it: the path under audio/ with `?v=` its hash
 *  (`kikimimi/p1-squid.m4a?v=60016cae`), for sound.svelte.ts loadVoice. */
export function clipUrl(id: string, slow = false): string {
  const c = CLIPS[id];
  const v = slow ? c?.slow : c?.hash;
  const path = `kikimimi/${id}${slow ? '-slow' : ''}.m4a`;
  return v ? `${path}?v=${v}` : path;
}
