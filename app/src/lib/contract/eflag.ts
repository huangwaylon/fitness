// English Study's flags (docs/english.md "Flags"): a learner's 「ここ、違うかも」 on a clip or one of its questions, and
// the review's answer to one. Append-only, like spend / spend_void: `eflag` is sent from the sheet (anyone, the guest
// too), `eflag_done` by the review (`npm run flags` in relay/, a member's key). Everyone sees every flag (shared
// content, not anyone's answers). Pure and dependency-free (the relay imports it).
import { cleanLine } from './text.ts';
import { isInt } from './ops.ts';
import { isId } from './api.ts';

/** What looks off (the sheet's chips; その他 the default). */
export const EFLAG_KINDS = ['answer', 'heard', 'question', 'timing', 'notes', 'other'] as const;
export type EflagKind = (typeof EFLAG_KINDS)[number];

/** A note's length at most (characters), and the quoted texts'. */
export const EFLAG_NOTE = 200;
const SEEN_MAX = 400;
/** A clip's id (as a `listen` row's `u`). */
const ITEM_RE = /^[a-z0-9-]{1,12}$/;
/** A question's id. */
const Q_RE = /^[a-z0-9]{1,8}$/;
/** A content version (lib/english/hash.ts contentHash). */
const V_RE = /^[a-z0-9]{1,16}$/;

/** What the learner saw when they flagged a question: its stem, its answer and its line. */
interface EflagSeen {
  stem: string;
  answer: string;
  line: string;
}

export interface Eflag {
  /** The clip's id. */
  item: string;
  /** The question's id (lib/english/types.ts Question.id), null: the clip as a whole. (A number: a flag from the
   *  first build, by the question's place.) */
  q: string | number | null;
  kind: EflagKind;
  note?: string;
  /** The player's time then, s (one decimal). */
  t?: number;
  /** The content's version then (the question's, or the clip's for a clip flag). */
  v: string;
  /** A question's texts as shown; null for a clip flag. */
  seen: EflagSeen | null;
}

type EflagOutcome = 'fixed' | 'kept';
export interface EflagDone {
  /** The flag's event id. */
  flag: string;
  outcome: EflagOutcome;
  note?: string;
}

/** A clean, non-empty text of at most `max` characters, exactly as sent. */
const textOk = (v: unknown, max: number): v is string => typeof v === 'string' && v !== '' && cleanLine(v, max) === v;
const keysIn = (d: Record<string, unknown>, keys: readonly string[]) => Object.keys(d).every((k) => keys.includes(k));

function seenOf(v: unknown): EflagSeen | null | undefined {
  if (v === null) return null;
  if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined;
  const o = v as Record<string, unknown>;
  if (!keysIn(o, ['stem', 'answer', 'line']) || !textOk(o.stem, SEEN_MAX) || !textOk(o.answer, SEEN_MAX) || !textOk(o.line, SEEN_MAX)) return undefined;
  return { stem: o.stem, answer: o.answer, line: o.line };
}

/** An `eflag`'s data, or null when it isn't one (an unknown key, a field out of range, a note not clean). */
export function eflagOf(d: Record<string, unknown>): Eflag | null {
  if (!keysIn(d, ['item', 'q', 'kind', 'note', 't', 'v', 'seen'])) return null;
  if (typeof d.item !== 'string' || !ITEM_RE.test(d.item) || typeof d.v !== 'string' || !V_RE.test(d.v)) return null;
  if (d.q !== null && !(typeof d.q === 'string' ? Q_RE.test(d.q) : isInt(d.q, 0, 49))) return null;
  if (!(EFLAG_KINDS as readonly unknown[]).includes(d.kind)) return null;
  if (d.note !== undefined && !textOk(d.note, EFLAG_NOTE)) return null;
  if (d.t !== undefined && !(typeof d.t === 'number' && d.t >= 0 && d.t <= 36_000 && Math.round(d.t * 10) === d.t * 10)) return null;
  const seen = seenOf(d.seen);
  // a question's flag says what was shown; a clip's has nothing to quote
  if (seen === undefined || (d.q === null) !== (seen === null)) return null;
  return {
    item: d.item, q: d.q as string | number | null, kind: d.kind as EflagKind, ...(d.note !== undefined && { note: d.note as string }),
    ...(d.t !== undefined && { t: d.t as number }), v: d.v, seen
  };
}

/** An `eflag_done`'s data, or null. */
export function eflagDoneOf(d: Record<string, unknown>): EflagDone | null {
  if (!keysIn(d, ['flag', 'outcome', 'note']) || !isId(d.flag) || (d.outcome !== 'fixed' && d.outcome !== 'kept')) return null;
  if (d.note !== undefined && !textOk(d.note, EFLAG_NOTE)) return null;
  return { flag: d.flag, outcome: d.outcome, ...(d.note !== undefined && { note: d.note as string }) };
}
