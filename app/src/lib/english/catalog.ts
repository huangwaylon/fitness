// English Study's library index (docs/english.md "Data"): what home, the library and ⚙ need of every clip, without its
// bank. The build makes it from clips/index.ts's CLIPS (vite.config.ts english-data: the module
// `clips/index.ts?english-index`, in the sheet's chunk) and writes each bank as a file of its own, fetched when a
// lesson opens (data.ts). Pure.
import { drawSize } from './draw.ts';
import { fnv1a } from '#lib/random.ts';
import { clipHash, scenesHash, transcriptHash } from './hash.ts';
import { keyWordsOf, splitUse, wordsOf } from './phrases.ts';
import type { Band, Bank, Clip, Question, ScenesFile, TranscriptLine } from './types.ts';

/** The show, short (a row's sub line, a chip). */
export type Show = 'Friends' | 'The Office' | 'Parks' | 'iCarly';

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
  /** The bank's live items (home's もう一度 prefers a clip with many not met yet). */
  items: number;
  /** The clip's version (hash.ts clipHash): its saved place's, a clip flag's, and its bank file's name. */
  v: string;
  /** Its scenes' version (hash.ts scenesHash), when it has scenes: in its bank file's name too. */
  sv?: string;
  /** Its transcript's version (hash.ts transcriptHash), when it has one: in its bank file's name too. */
  tv?: string;
  credit: string;
}

const SHORT: Record<Clip['show'], Show> = { Friends: 'Friends', 'The Office': 'The Office', 'Parks and Recreation': 'Parks', iCarly: 'iCarly' };

export function metaOf(c: Clip): ClipMeta {
  const items = c.questions.filter((q) => !q.retired).length;
  return {
    id: c.id, video: c.video, title: c.title, show: SHORT[c.show], dur: c.dur, band: c.band, tags: c.tags,
    n: Math.min(drawSize(c.dur), items), items, v: clipHash(c), credit: c.credit
  };
}

/** A clip's entry with its scenes' (and beats') version, when it has scenes (vite.config.ts english-data). */
export const withScenes = (m: ClipMeta, sf: Pick<ScenesFile, 'scenes' | 'beats'> | undefined): ClipMeta => (sf ? { ...m, sv: scenesHash(sf.scenes, sf.beats) } : m);

/** A clip's entry with its transcript's version, when it has one (vite.config.ts english-data). */
export const withTranscript = (m: ClipMeta, lines: readonly TranscriptLine[] | undefined): ClipMeta => (lines ? { ...m, tv: transcriptHash(lines) } : m);

/** A bank's file, under the base path: its name carries its version (and its scenes', its transcript's), so a cached copy is never stale and a page left
 *  from an older build asks for a file the deploy took away (data.ts: then a reload). */
export const bankPath = (m: Pick<ClipMeta, 'id' | 'v' | 'sv' | 'tv'>): string => `english/c/${m.id}.${m.v}${m.sv ?? ''}${m.tv ?? ''}.json`;

/** What a retired question keeps in its bank file: この動画のセリフと解説's line and notes (phrases.ts momentsOf), its id and
 *  `retired` (a saved ☆ on it let go: PhraseReview). Nothing else reads one: a draw, the plan and the deck skip them, a
 *  flag is only on a drawn one and a saved place is dropped with its clip's version. */
const RETIRED_KEEPS = ['id', 'retired', 'seg', 'line', 'said', 'mean', 'use'] as const;

/** A clip's bank as its file holds it (vite.config.ts english-data): the clip with its scenes (and beats) and transcript
 *  lines when it has them, its retired questions cut to RETIRED_KEEPS (one without a line dropped: no phrase shows it). */
export function bankOf(c: Clip, sf: Pick<ScenesFile, 'scenes' | 'beats'> | undefined, lines: readonly TranscriptLine[] | undefined): Bank {
  const questions = c.questions.flatMap((q) =>
    !q.retired ? [q] : q.line ? [Object.fromEntries(RETIRED_KEEPS.filter((k) => q[k] !== undefined).map((k) => [k, q[k]])) as unknown as Question] : []);
  return { ...c, questions, ...(sf && { ...sf }), ...(lines && { lines }) };
}

/** A card of フレーズ's deck (docs/english.md "フレーズ"): a question's phrase, where it's heard and its 意味,
 *  `[clip, qid, from, to, use, line, mean]`; the video and title come from the index. */
export type PhraseEntry = readonly [clip: string, qid: string, from: number, to: number, use: string, line: string, mean: string];
/** The deck's files (`english/p/<n>.<v>.json`), each a stable share of the whole library (`fnv1a(clip/qid) % SHARDS`). */
export const SHARDS = 12;
/** A card's `use` at most, English words. */
const DECK_WORDS = 8;
/** A card's segment at most, s. */
const DECK_SEG = 15;
/** The shows' characters: a `use` naming one isn't portable (our own example names, Ken or Tanaka, are). */
const CHARACTERS = new Set(('Rachel Ross Monica Chandler Joey Phoebe Gunther Janice Emma Ben Carol Susan Mike Michael Dwight Jim Pam ' +
  'Ryan Andy Angela Kevin Oscar Stanley Phyllis Creed Meredith Kelly Toby Erin Darryl Jan Holly Gabe Leslie Ron Ann April Tom Chris ' +
  'Jerry Donna Craig Garry Carly Sam Freddie Spencer Gibby Lewbert').split(' '));
const SKIPPED = new Set(['gist', 'humor', 'who', 'predict']);
/** Words too common to tie a phrase to its line alone (unless they're all the line's key words: "*So* what…"). */
const COMMON = new Set(('i you he she it its we they me him her us them my your his our their of to in on at for with from by and or ' +
  'but so is are was were be been am do does did have has had this that just').split(' '));

/** Whether a question makes a card: live, B1, not a gist, joke, voice or guess; its `use` ≤ DECK_WORDS English words with
 *  its Japanese in （…）, sharing a key word with its line (so ▶ plays the words taught: one not COMMON, or all of
 *  them), no character named; its segment ≤ DECK_SEG s. */
export function inDeck(q: Question): boolean {
  if (q.retired || q.level !== 'B1' || SKIPPED.has(q.skill) || !q.line || !q.use || q.seg[1] - q.seg[0] > DECK_SEG) return false;
  const { en, ja } = splitUse(q.use);
  const words = wordsOf(en);
  if (!ja || words.length > DECK_WORDS || en.split(/\s+/).some((w) => CHARACTERS.has(w.replace(/[^A-Za-z]/g, '')))) return false;
  const keys = keyWordsOf(q.line), shared = words.filter((w) => keys.has(w));
  return shared.some((w) => !COMMON.has(w)) || (shared.length > 0 && [...keys].every((k) => words.includes(k)));
}

/** The deck: every card of the clips (in the plan's order), one per English `use` (any case or punctuation: the first kept). */
export function deckOf(clips: readonly Clip[]): PhraseEntry[] {
  const seen = new Set<string>(), out: PhraseEntry[] = [];
  for (const c of clips) for (const q of c.questions) {
    if (!inDeck(q)) continue;
    const en = wordsOf(splitUse(q.use).en).join(' ');
    if (seen.has(en)) continue;
    seen.add(en);
    out.push([c.id, q.id, q.seg[0], q.seg[1], q.use, q.line!, q.mean]);
  }
  return out;
}

/** A card's file: `fnv1a(clip/qid) % SHARDS`. */
export const shardOf = (clip: string, qid: string): number => fnv1a(`${clip}/${qid}`) % SHARDS;

/** The deck split into its SHARDS files, each in the deck's order. */
export function shardsOf(deck: readonly PhraseEntry[]): PhraseEntry[][] {
  const out: PhraseEntry[][] = Array.from({ length: SHARDS }, () => []);
  for (const e of deck) out[shardOf(e[0], e[1])].push(e);
  return out;
}

/** A shard's file, under the base path: its name carries its content's version (`v`: hash.ts fnv of its JSON). */
export const shardPath = (n: number, v: string): string => `english/p/${n}.${v}.json`;
