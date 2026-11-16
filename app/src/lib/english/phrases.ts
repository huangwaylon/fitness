// この動画のフレーズ (docs/english.md "The page"): the bank's quoted lines, the retired questions' too, once each (by
// their words, the first kept), in time order; lines starting within a second of a moment's first are that moment, and
// its ▶ plays from its first start to its last end. No new data: each question's own line, notes and phrase. Pure.
import type { Clip, Question } from './types.ts';

export interface Moment {
  from: number;
  to: number;
  qs: Question[];
}

/** Lines this close after a moment's first start are of that moment, s. */
const SAME = 1;

export function momentsOf(clip: Clip): Moment[] {
  const seen = new Set<string>();
  const lines = clip.questions
    .filter((q) => {
      const k = q.line?.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
      return !!k && !seen.has(k) && !!seen.add(k);
    })
    .sort((a, b) => a.seg[0] - b.seg[0]);
  const out: Moment[] = [];
  for (const q of lines) {
    const m = out.at(-1);
    if (m && q.seg[0] - m.from <= SAME) (m.to = Math.max(m.to, q.seg[1])), m.qs.push(q);
    else out.push({ from: q.seg[0], to: q.seg[1], qs: [q] });
  }
  return out;
}
