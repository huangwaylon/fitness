// 英語すごろく online's live view (docs/sugoroku.md "Online"): the turn as its player's sheet shows it now (the tiles
// placed, 「おしい！」, ヒント, the speaking step...), sent to the others at the table (contract/live-protocol.ts SgView:
// presence only, never kept) so their phones show the same panel, read-only. Each panel's state is a few indices and
// flags (`s`: the tiles are the fold's, the same on every phone), the speaking step's words its texts (`x`). Pure: the
// codec and the size fit; the sending (throttled, resent while the turn is open) is online.svelte.ts's.
import { MAX_BYTES, type SgPanel, type SgView } from '#lib/contract/live-protocol.ts';

/** A turn's try: placing, 「おしい！」 shown, right, or 答えはこれ. */
type Stage = 'try' | 'miss' | 'right' | 'answer';
const STAGES: readonly Stage[] = ['try', 'miss', 'right', 'answer'];
/** The ことば turn's notes (WordTurn), by index. */
const WORD_NOTES = ['', 'mustUse', 'noWord', 'hintNote', 'hintFree', 'minLen', 'notWord'] as const;
export type WordNote = (typeof WORD_NOTES)[number];
/** The speaking step's phases and notes (SpeakStep), by index. */
const SPEAK_PHASES = ['ask', 'rec', 'stt', 'confirm', 'feedback'] as const;
type SpeakPhase = (typeof SPEAK_PHASES)[number];
const SPEAK_NOTES = ['', 'again', 'target', 'verb', 'ok', 'denied', 'missed'] as const;
type SpeakNote = (typeof SPEAK_NOTES)[number];

export interface WordView { picked: number[]; hinted: boolean; asking: boolean; done: boolean; note: WordNote }
export interface SentenceView { placed: number[]; stage: Stage; misses: number; peeked: boolean }
/** The speaking step: its phase; the 聞こえた文 screen's field (`text`), typed or heard, its note, the re-says used; the
 *  feedback's sentence (`text`), recast, tip (as shown) and other way, settled, graded, the tip open, the stars,
 *  re-said, the cheer (speak.ts cheerOf; -1 none). */
export interface SpeakView {
  phase: SpeakPhase; typed: boolean; heard: boolean; note: SpeakNote; resays: number;
  settled: boolean; graded: boolean; tipOpen: boolean; resaid: boolean; stars: number; cheer: number;
  text: string; recast: string; tip: string; also: string;
}
/** The 絵 turn: the letters placed (or the spellings tried, やさしい), the stage, the misses, the speaking step if on. */
export interface PictureView { placed: number[]; tried: number[]; stage: Stage; misses: number; speak: SpeakView | null }
interface EventView { ja: boolean }
export type View =
  | { p: 'word'; v: WordView }
  | { p: 'sentence'; v: SentenceView }
  | { p: 'picture'; v: PictureView }
  | { p: 'event'; v: EventView }
  /** A mini-game's live state (the typing, a race's counts): its own short code (mini/'s, ≤ 64 of [0-9a-z.]). */
  | { p: 'mini'; v: string }
  | { p: 'fork' | 'home'; v: null };

/** A view's frame as sent, the relay's `who` and `t` still to come (`,"who":"A","t":` and 13 digits: 28). */
export const FRAME_MAX = MAX_BYTES - 32;

const ids = (xs: readonly number[]): string => xs.map((x) => x.toString(36)).join('');
const unids = (s: string): number[] | null => (/^[0-9a-z]*$/.test(s) ? [...s].map((c) => parseInt(c, 36)) : null);
const bits = (...fs: boolean[]): string => fs.reduce((n, f, k) => n | (f ? 1 << k : 0), 0).toString(36);
const bit = (s: string, k: number): boolean => ((parseInt(s, 36) >> k) & 1) === 1;
const digit = (s: string, max: number): number | null => (/^[0-9a-z]$/.test(s) && parseInt(s, 36) <= max ? parseInt(s, 36) : null);
const at = <T>(list: readonly T[], s: string): T | null => { const k = digit(s, list.length - 1); return k === null ? null : list[k]; };

/** A view as its frame's fields: the panel, the state, the texts (the speaking step's only). */
export function encode(view: View): Pick<SgView, 'p' | 's' | 'x'> {
  switch (view.p) {
    case 'word': {
      const v = view.v;
      return { p: 'word', s: `${ids(v.picked)}.${bits(v.hinted, v.asking, v.done)}.${WORD_NOTES.indexOf(v.note)}` };
    }
    case 'sentence': {
      const v = view.v;
      return { p: 'sentence', s: `${ids(v.placed)}.${STAGES.indexOf(v.stage)}.${v.misses}.${bits(v.peeked)}` };
    }
    case 'picture': {
      const v = view.v, sp = v.speak;
      const s = `${ids(v.placed)}.${ids(v.tried)}.${STAGES.indexOf(v.stage)}.${v.misses}`;
      if (!sp) return { p: 'picture', s };
      const more = `${SPEAK_PHASES.indexOf(sp.phase)}.${bits(sp.typed, sp.heard, sp.settled, sp.graded, sp.tipOpen, sp.resaid)}.${SPEAK_NOTES.indexOf(sp.note)}.${sp.resays}.${sp.stars}.${sp.cheer + 1}`;
      const x = sp.phase === 'confirm' ? [sp.text] : sp.phase === 'feedback' ? [sp.text, sp.recast, sp.tip, sp.also] : undefined;
      return { p: 'picture', s: `${s}.${more}`, ...(x ? { x } : {}) };
    }
    case 'event':
      return { p: 'event', s: bits(view.v.ja) };
    case 'mini':
      return { p: 'mini', s: view.v };
    default:
      return { p: view.p, s: '' };
  }
}

/** A frame's fields as the view, or null when they don't read as one (another build's, malformed). */
export function decode(p: SgPanel, s: string, x: readonly string[] = []): View | null {
  const f = s.split('.');
  switch (p) {
    case 'word': {
      const picked = unids(f[0] ?? ''), note = at(WORD_NOTES, f[2] ?? '');
      if (f.length !== 3 || !picked || note === null || digit(f[1], 7) === null) return null;
      return { p, v: { picked, hinted: bit(f[1], 0), asking: bit(f[1], 1), done: bit(f[1], 2), note } };
    }
    case 'sentence': {
      const placed = unids(f[0] ?? ''), stage = at(STAGES, f[1] ?? ''), misses = digit(f[2] ?? '', 2);
      if (f.length !== 4 || !placed || stage === null || misses === null || digit(f[3], 1) === null) return null;
      return { p, v: { placed, stage, misses, peeked: bit(f[3], 0) } };
    }
    case 'picture': {
      const placed = unids(f[0] ?? ''), tried = unids(f[1] ?? ''), stage = at(STAGES, f[2] ?? ''), misses = digit(f[3] ?? '', 2);
      if ((f.length !== 4 && f.length !== 10) || !placed || !tried || stage === null || misses === null) return null;
      if (f.length === 4) return { p, v: { placed, tried, stage, misses, speak: null } };
      const phase = at(SPEAK_PHASES, f[4]), note = at(SPEAK_NOTES, f[6]), resays = digit(f[7], 9), stars = digit(f[8], 9), cheer = digit(f[9], 9);
      if (phase === null || digit(f[5], 63) === null || note === null || resays === null || stars === null || cheer === null) return null;
      const fl = f[5];
      return {
        p, v: {
          placed, tried, stage, misses, speak: {
            phase, typed: bit(fl, 0), heard: bit(fl, 1), settled: bit(fl, 2), graded: bit(fl, 3), tipOpen: bit(fl, 4), resaid: bit(fl, 5),
            note, resays, stars, cheer: cheer - 1, text: x[0] ?? '', recast: x[1] ?? '', tip: x[2] ?? '', also: x[3] ?? ''
          }
        }
      };
    }
    case 'event':
      return digit(s, 1) === null ? null : { p, v: { ja: bit(s, 0) } };
    case 'mini':
      return { p, v: s };
    default:
      return s === '' ? { p, v: null } : null;
  }
}

/** Whether a view heard is of the panel shown now: this game at its next move (one of an older move, or of one ahead
 *  of a move not here yet, is let go), from whose turn it is, of this phase. */
export const isCurrent = (v: Pick<SgView, 'g' | 'i' | 'p'> & { who: string }, now: { g: string; i: number; who: string; p: string }): boolean =>
  v.g === now.g && v.i === now.i && v.who === now.who && v.p === now.p;

/** A frame within FRAME_MAX: the speaking step's texts given up first the other way, then the longest cut (…). */
export function fit(frame: SgView): SgView {
  const size = (f: SgView) => JSON.stringify({ v: 3, ...f }).length;
  if (size(frame) <= FRAME_MAX || !frame.x) return frame;
  const x = [...frame.x];
  if (x[3]) x[3] = '';
  for (let k = 0; k < 40 && size({ ...frame, x }) > FRAME_MAX; k++) {
    const over = size({ ...frame, x }) - FRAME_MAX;
    const j = x.reduce((m, t, i) => (t.length > x[m].length ? i : m), 0);
    if (!x[j]) break;
    x[j] = `${Array.from(x[j]).slice(0, Math.max(0, Array.from(x[j]).length - over - 1)).join('').trimEnd()}…`;
    if (x[j] === '…') x[j] = '';
  }
  return { ...frame, x };
}
