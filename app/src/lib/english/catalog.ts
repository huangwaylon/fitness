// English Study's library index (docs/english.md "Data"): what home, the library and ⚙ need of every clip, without its
// bank. The build makes it from clips/index.ts's CLIPS (vite.config.ts english-data: the module
// `clips/index.ts?english-index`, in the sheet's chunk) and writes each bank as a file of its own, fetched when a
// lesson opens (data.ts). Pure.
import { drawSize } from './draw.ts';
import { clipHash } from './hash.ts';
import type { Band, Clip } from './types.ts';

/** The show, short (a row's sub line, a chip). */
export type Show = 'Friends' | 'The Office' | 'Parks';

/** A clip as listed: its bank's version and the play's size, not its questions. */
export interface ClipMeta {
  id: string;
  video: string;
  title: string;
  show: Show;
  /** Its length, s. */
  dur: number;
  band: Band;
  tags: readonly string[];
  /** A play's questions (draw.ts drawSize, or the live items if fewer). */
  n: number;
  /** The clip's version (hash.ts clipHash): its saved place's, a clip flag's, and its bank file's name. */
  v: string;
  credit: string;
}

const SHORT: Record<Clip['show'], Show> = { Friends: 'Friends', 'The Office': 'The Office', 'Parks and Recreation': 'Parks' };

export const metaOf = (c: Clip): ClipMeta => ({
  id: c.id, video: c.video, title: c.title, show: SHORT[c.show], dur: c.dur, band: c.band, tags: c.tags,
  n: Math.min(drawSize(c.dur), c.questions.filter((q) => !q.retired).length), v: clipHash(c), credit: c.credit
});

/** A bank's file, under the base path: its name carries its version, so a cached copy is never stale and a page left
 *  from an older build asks for a file the deploy took away (data.ts: then a reload). */
export const bankPath = (m: Pick<ClipMeta, 'id' | 'v'>): string => `english/c/${m.id}.${m.v}.json`;
