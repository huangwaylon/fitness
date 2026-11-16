// English Study's flags on the phone (docs/english.md "Flags"): an `eflag`'s data as the sheet sends it (contract/
// eflag.ts: what was shown, the content's version, the player's time), and 報告した内容's list, folded from the record's
// rows (state.eflag: every flag and every review, everyone's), newest first. Pure.
import type { EventRow } from '#lib/contract/api.ts';
import { EFLAG_NOTE, eflagDoneOf, eflagOf, type Eflag, type EflagKind } from '#lib/contract/eflag.ts';
import { cleanLine } from '#lib/contract/text.ts';
import { questionHash } from './hash.ts';
import type { ClipMeta } from './catalog.ts';
import type { Question } from './types.ts';
import type { Who } from '#lib/types.ts';

/** A flag's data: on question `q` of `clip`, or the clip itself (null). `t`: the player's time, s. */
export function flagData(clip: Pick<ClipMeta, 'id' | 'v'>, q: Question | null, kind: EflagKind, note: string, t: number | null): Eflag {
  const n = cleanLine(note, EFLAG_NOTE);
  const line = (x: string) => cleanLine(x, 400);
  return {
    item: clip.id, q: q ? q.id : null, kind, ...(n && { note: n }), ...(t !== null && Number.isFinite(t) && t >= 0 && { t: Math.round(Math.min(t, 36_000) * 10) / 10 }),
    v: q ? questionHash(q) : clip.v,
    seen: q ? { stem: line(q.stem), answer: line(q.choices ? q.choices[q.a ?? 0] : (q.answer ?? '')), line: line(q.line ?? q.stem) } : null
  };
}

export interface FlagItem {
  id: string;
  at: string;
  who: Who;
  flag: Eflag;
  /** Open, or the review's outcome and note. */
  done: { outcome: 'fixed' | 'kept'; note?: string } | null;
}

/** 報告した内容: every flag, newest first, each with its review if it has one. */
export function flagsOf(rows: readonly EventRow[]): FlagItem[] {
  const parse = (raw: string): Record<string, unknown> | null => {
    try {
      const d: unknown = JSON.parse(raw);
      return d && typeof d === 'object' && !Array.isArray(d) ? (d as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  };
  const done = new Map<string, FlagItem['done']>();
  const out: FlagItem[] = [];
  for (const r of rows) {
    const d = parse(r[4]);
    if (!d) continue;
    if (r[3] === 'eflag_done') {
      const x = eflagDoneOf(d);
      if (x) done.set(x.flag, { outcome: x.outcome, ...(x.note && { note: x.note }) });
    } else if (r[3] === 'eflag') {
      const f = eflagOf(d);
      if (f) out.push({ id: r[2], at: r[0], who: r[1] as Who, flag: f, done: null });
    }
  }
  return out.map((x) => ({ ...x, done: done.get(x.id) ?? null })).sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
}
