// English Study's content (docs/english.md "Content"): a clip is an official YouTube video, played by YouTube's embed,
// with our questions over its segments and our Japanese notes. Nothing of the clip's audio or transcript is ours to
// ship: a question quotes one short line at most. Pure types.

/** How fast the clip's speech runs (its words a minute over speech time): ゆっくり < 100, ふつう 100–130, 速い > 130. */
type Band = 'slow' | 'mid' | 'fast';

/** The question's kind, shown on its card (大意 the gist first, ≤ 1 書き取り a clip). */
type QType = '大意' | '詳細' | '数字' | '含み' | 'フレーズ' | 'ことば' | '書き取り';

export interface Question {
  /** The segment that answers it, s into the video: [from, to]. */
  seg: readonly [number, number];
  type: QType;
  /** The question, in English. */
  stem: string;
  /** Its choices (English); absent for a dictation. */
  choices?: readonly string[];
  /** The right choice's index. */
  a?: number;
  /** A dictation's words (lower case, as said). */
  answer?: string;
  /** The nudge for the second listen (Japanese): where to listen, never the answer. */
  cue: string;
  /** The short line that answers it, its key words in *stars*. */
  line: string;
  /** 言っていること: what is said. */
  said: string;
  /** 意味: what it means here. */
  mean: string;
  /** 迷いやすい点: why the tempting choice tempts. */
  trap: string;
  /** 使えるフレーズ: a reusable chunk, its Japanese in （…）. */
  use: string;
}

export interface Clip {
  /** Its id (≤ 12 of a-z, 0-9, -): a `listen` row's `u`, a flag's `item`. */
  id: string;
  /** The YouTube video's id. */
  video: string;
  /** Its title as on YouTube. */
  title: string;
  /** Its length, s. */
  dur: number;
  /** Words a minute over speech time (from the captions). */
  wpm: number;
  band: Band;
  /** The situation, one or two (職場, 店・レストラン, 電話, 家, 恋愛, 友だち, 旅行, 買い物, お願い・断り). */
  tags: readonly string[];
  /** Whose video (the channel), shown under the player. */
  credit: string;
  questions: readonly Question[];
}
