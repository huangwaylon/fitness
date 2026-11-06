// おやすみ ものがたり (docs/curriculum.md §7.1, content/listen/README.md "Stories"): the bedtime serials' chapters as the
// audio scripts voice them and as a StoryFrame loads them. Every segment of a chapter is a clip of its own, `<chapter>-<n>`
// (n from 1, like a dialogue's lines), spoken by the narrator's voice (the serial's cast.narrator) or the villager's
// CAST voice, at the stories' own loudness and with no noise bed (scripts/kikimimi-audio.ts). Each chapter compiles
// into a chunk of its own (compile.ts storyChunk: `parts/<unit>-<chapter>.json`) with an entry in the index's
// `stories` (pool.ts loadChapter). Pure: the YAML is read by compile.ts readStories.
import type { RosterId } from '#lib/villagers/roster.ts';
import type { CastId, Item, SceneId } from './bank.ts';
import { CAST } from './cast.ts';

/** A segment's speaker: the serial's narrator, or a villager. */
const NARRATOR = 'narrator';

/** A segment as authored: who says it, what's shown, what's spoken when it differs. */
interface SegmentSource {
  who: string;
  en: string;
  tts?: string;
}
/** A glossed phrase as authored (curriculum-units.md's phrase shape). */
interface PhraseSource {
  id: string;
  en: string;
  ja: string;
  match?: string;
  register: string;
  scene: string;
  trap: string;
}
/** The morning-after prediction (the next chapter tells its answer). */
interface Predict {
  ask: string;
  choices: string[];
  answer: number;
  ja: string;
}
interface ChapterSource {
  kind: 'serial';
  id: string;
  chapter: number;
  title: string;
  line: string;
  ja: string;
  scene?: SceneId;
  segments: SegmentSource[];
  ph: PhraseSource[];
  predict?: Predict;
}
/** A serial's file (content/listen/story/<unit>.yaml) as parsed. */
export interface StorySource {
  unit: string;
  name: string;
  host: RosterId;
  status: string;
  cast: Record<string, CastId>;
  items: ChapterSource[];
}

/** A chapter's segment as loaded: who says it, its English and its clip's id (the chunk's clips and words key it). */
interface Segment {
  who: string;
  en: string;
  clip: string;
}
/** A chapter's chunk as loaded: the chapter (its caption `line`, summary `ja`, segments, phrases with the clips they're
 *  heard in, the prediction) and its serial's name and host. */
export interface Chapter {
  unit: string;
  name: string;
  host: RosterId;
  id: string;
  chapter: number;
  title: string;
  line: string;
  ja: string;
  scene?: SceneId;
  segments: Segment[];
  ph: (Omit<PhraseSource, 'match'> & { in: string[] })[];
  predict?: Predict;
}
/** The index's line for a chapter: its chunk's name (`<unit>-<n>`), id, title, caption, segments, length (cs: 0 while
 *  a clip is missing) and content version. */
export type ChapterEntry = [part: string, id: string, title: string, line: string, segments: number, cs: number, cv: string];
/** The index's entry for a serial: its name, host, status and chapters in order. */
export interface StoryEntry {
  name: string;
  host: RosterId;
  status: string;
  chapters: ChapterEntry[];
}

/** A segment's clip id. */
export const segmentClip = (chapter: string, n: number): string => `${chapter}-${n + 1}`;
/** A chapter's chunk name. */
export const chapterPart = (unit: string, chapter: number): string => `${unit}-${chapter}`;

/** A segment's cast voice: the serial's (the narrator's, or a villager's override), else the villager's CAST voice. */
const voiceOf = (s: StorySource, who: string): CastId => {
  const v = s.cast[who] ?? CAST[who as RosterId];
  if (!v) throw new Error(`kikimimi: ${s.unit}: ${who} has no cast voice`);
  return v;
};

/** Every segment as the audio scripts speak it, one item per clip (scripts/kikimimi-audio.ts, kikimimi-words.ts): its
 *  clip id, its cast voice (so speech.ts castOf needs no story case), `en` and `tts`; the narrator's lines carry the
 *  host as their speaker (an icon only: the voice is `cast`). */
export function storyItems(stories: readonly StorySource[]): Item[] {
  return stories.flatMap((s) => s.items.flatMap((ch) => ch.segments.map((seg, n): Item => ({
    id: segmentClip(ch.id, n), lv: 4, type: 'gist', en: seg.en, ja: '', speaker: seg.who === NARRATOR ? s.host : (seg.who as RosterId),
    voice: 'us', cast: voiceOf(s, seg.who), choices: [], answer: 0, ...(seg.tts && { tts: seg.tts })
  }))));
}

/** Each serial's chapters as their chunks hold them (compile.ts writes them with their clips and words). */
export function chapters(s: StorySource): Chapter[] {
  return s.items.map((ch) => {
    const segments = ch.segments.map((seg, n) => ({ who: seg.who, en: seg.en, clip: segmentClip(ch.id, n) }));
    const ph = ch.ph.map(({ match, ...p }) => {
      const re = new RegExp(match ?? p.en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      return { ...p, in: segments.filter((seg) => re.test(seg.en)).map((seg) => seg.clip) };
    });
    return {
      unit: s.unit, name: s.name, host: s.host, id: ch.id, chapter: ch.chapter, title: ch.title, line: ch.line, ja: ch.ja,
      ...(ch.scene && { scene: ch.scene }), segments, ph, ...(ch.predict && { predict: ch.predict })
    };
  });
}
