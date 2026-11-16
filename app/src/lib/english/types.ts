// English Study's content (docs/english.md "Content"): a clip is an official YouTube video, played by YouTube's embed,
// with our questions over its segments and our Japanese notes. Its audio is never ours to ship; its transcript is
// (the user, 2026-11-16: docs/english.md "Transcripts"). Pure types.

/** How fast the clip's speech runs against the rest of the library: ゆっくり, ふつう, 速い = the slowest, middle and
 *  fastest third of all clips by `wpm` (clips/index.ts bandsOf; scripts/english-wpm.ts writes them). */
export type Band = 'slow' | 'mid' | 'fast';

/** What a question tests, in four groups (draw.ts GROUP_OF): the gist; literal (detail, number, who); interpretive
 *  (infer, attitude, pragma, humor, predict); form (marker, phrase, sound, dict). Its card label: i18n.ts `skill.*`. */
export type Skill =
  | 'gist'
  | 'detail' | 'number' | 'who'
  | 'infer' | 'attitude' | 'pragma' | 'humor' | 'predict'
  | 'marker' | 'phrase' | 'sound' | 'dict';
/** The CEFR level the item targets (B1 stands for B1+; C2 is the native tier: a second-order inference, two parts of
 *  the clip set against each other, stress that decides the meaning, or exact weak forms at native speed). */
type Level = 'B1' | 'B2' | 'C1' | 'C2';

/** A question of a clip's bank (docs/english.md "Content"): a play draws 6–8 of them (draw.ts). */
export interface Question {
  /** Stable (≤ 8 of a-z, 0-9), unique in the clip, never reused: a listen answer's id, a flag's `q`. */
  id: string;
  skill: Skill;
  level: Level;
  /** The fact or line it turns on: a draw holds at most one item per point. */
  point: string;
  /** Other points its stem, choices, line or notes give away: never drawn with those. */
  reveals?: readonly string[];
  /** The segment that answers it, s into the video: [from, to]. */
  seg: readonly [number, number];
  /** predict only: the continuation, played at the reveal. */
  then?: readonly [number, number];
  /** The question, in English. */
  stem: string;
  /** Its choices (English, 3 or 4); absent for a dictation. */
  choices?: readonly string[];
  /** The right choice's index. */
  a?: number;
  /** Keep the authored order (numbers, a scale); else shuffled per player. */
  keep?: true;
  /** A dictation's words (lower case, as said). */
  answer?: string;
  /** The nudge for the second listen (Japanese): where to listen, never the answer. */
  cue: string;
  /** The short line that answers it, its key words in *stars* (absent only for a whole-scene gist or a who by voices). */
  line?: string;
  /** 言っていること: what is said. */
  said: string;
  /** 意味: what it means here. */
  mean: string;
  /** 迷いやすい点: why the tempting choice tempts. */
  trap: string;
  /** 使えるフレーズ: a reusable chunk, its Japanese in （…）. */
  use: string;
  /** Kept for old rows and flags, never drawn. */
  retired?: true;
}

export interface Clip {
  /** Its id (≤ 12 of a-z, 0-9, -): a `listen` row's `u`, a flag's `item`. */
  id: string;
  /** The YouTube video's id. */
  video: string;
  /** Its title as on YouTube (without "| Friends"). */
  title: string;
  /** Its length, s. */
  dur: number;
  /** Words a minute over speech time (the union of the caption events that hold words), from the captions: one
   *  measure for every clip (scripts/english-wpm.ts). */
  wpm: number;
  /** Its third of the library by wpm. */
  band: Band;
  /** The situation, one or two (職場, 店・レストラン, 電話, 家, 恋愛, 友だち, 旅行, 買い物, お願い・断り). */
  tags: readonly string[];
  /** The show it's from (the page's chips). */
  show: 'Friends' | 'The Office' | 'Parks and Recreation' | 'iCarly';
  /** Whose video (the channel), shown under the player. */
  credit: string;
  /** The bank (16–24 once written; a lesson of 8 before), in clip order. */
  questions: readonly Question[];
}

/** A moment of the clip in our own words (docs/english.md "Scene summaries"): one short Japanese sentence of who does
 *  what, never a line's words in any language. scenes/<video>.json holds a clip's, written by the importer. */
export interface Scene {
  /** [from, to], s into the video. */
  t: readonly [number, number];
  /** ≤ 40 characters, normal kanji, no quotes. */
  ja: string;
}

/** A beat's category, its main move (i18n `beat.<k>`: 頼む・誘う, 断る, 提案, 説明, 気持ち, 冗談, 皮肉, 言い合い, 動作;
 *  their order: scenes.ts BEAT_KINDS). */
export type BeatKind = 'ask' | 'decline' | 'suggest' | 'explain' | 'feeling' | 'joke' | 'irony' | 'argue' | 'action';

/** A shorter moment inside one scene (2–10 s), categorized: the same rules as a scene's line, ≤ 30 characters. */
export interface Beat extends Scene {
  k: BeatKind;
}

/** A scenes file: scenes/<video id>.json. */
export interface ScenesFile {
  video: string;
  scenes: readonly Scene[];
  beats?: readonly Beat[];
}

/** A line of the clip's transcript (docs/english.md "Transcripts"): one whisper segment, its Japanese when translated. */
export interface TranscriptLine {
  /** [from, to], s into the video. */
  t: readonly [number, number];
  /** The line as heard (the local whisper pass's text, auto-transcribed). */
  en: string;
  /** Our Japanese translation, once the clip's ja file is in. */
  ja?: string;
}

/** A transcript file: transcripts/<video id>.en.json (scripts/english-transcripts.ts, from the whisper pass). */
export interface TranscriptFile {
  video: string;
  lines: readonly Omit<TranscriptLine, 'ja'>[];
}

/** A translation file: transcripts/<video id>.ja.json, one line for each of the en file's, same `t`s. */
export interface JaTranscriptFile {
  video: string;
  lines: readonly Required<Pick<TranscriptLine, 't' | 'ja'>>[];
}

/** A clip's bank as the build writes it (vite.config.ts english-data): the clip, and its scenes (and beats) and
 *  transcript lines when it has the files. */
export type Bank = Clip & { scenes?: readonly Scene[]; beats?: readonly Beat[]; lines?: readonly TranscriptLine[] };
