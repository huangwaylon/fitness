// 保存した場所's Google details (docs/places.md "Details"): the keyless maps/preview/place answer parsed into the
// whitelist the relay stores (scripts/places-details.ts fetches it; the text itself is never written anywhere).
// The fields read, under the place ([6]): [10] its ftid, [181][4] its cid, [203][0] the week, [23] 1 when Google marks
// it 閉業 (closed for good: no week then), [7][0] the site, [178][0][0] the phone, [154][0][0] a line about it,
// [4][7] / [4][8] the rating and its count, [13] Google's kinds; photo links anywhere in the text.
import { WEEK_MIN, type Period } from '../contract/places.ts';

const DESC_MAX = 240, KIND_MAX = 100, PICS_MAX = 3;
const TEL = /^[+0-9 ()-]{5,20}$/;

const at = (o: unknown, ...path: number[]): unknown => path.reduce<unknown>((x, i) => (Array.isArray(x) ? x[i] : undefined), o);

/** A place's details as scraped (the det's keys plus the staging's v, id, ftid). */
export interface GDetails {
  v: 1; id: string; at: number; ftid: string;
  hours: Period[] | null;
  web?: string; tel?: string; desc?: string; r?: number; rn?: number; kind?: string;
  /** Google marks it 閉業 (permanently closed). */
  shut?: true;
}

/** Google's week ([6][203][0], starting today; a day [name, weekday 1 Monday … 7 Sunday, date, periods, …], a period
 *  [text, [[h,m],[h,m]]] or ["定休日"]) as the contract's Period[]: a close at or before its open runs past midnight (c
 *  past 1440); "24 時間営業" every day is the one all-week period. Days without periods are closed. null: Google showed
 *  no hours. @public (tests) */
export function periodsOf(week: unknown): Period[] | null {
  if (!Array.isArray(week) || !week.length) return null;
  // a time is [h] or [h, m] (the minutes often absent: 0)
  const hm = (v: unknown): number | null => {
    if (!Array.isArray(v) || v.length < 1 || v.length > 2 || !Number.isInteger(v[0])) return null;
    const h = v[0] as number, m = v.length === 2 && Number.isInteger(v[1]) ? (v[1] as number) : 0;
    return h >= 0 && h <= 48 && m >= 0 && m < 60 ? h * 60 + m : null;
  };
  const out: Period[] = [];
  week.forEach((day, i) => {
    // the day's own weekday (1 Monday … 7 Sunday) when given, else its place in a week that starts Monday; the
    // contract's d is 0 Sunday … 6 Saturday
    const wd = at(day, 1);
    const d = (Number.isInteger(wd) && (wd as number) >= 1 && (wd as number) <= 7 ? (wd as number) : i + 1) % 7;
    const periods = at(day, 3);
    if (!Array.isArray(periods)) return;
    for (const per of periods) {
      let o = hm(at(per, 1, 0)), c = hm(at(per, 1, 1));
      const text = at(per, 0);
      if ((o === null || c === null) && typeof text === 'string' && /24\s*時間/.test(text)) {
        o = 0;
        c = 1440;
      }
      if (o === null || c === null) continue;
      if (c <= o) c += 1440; // overnight: the contract's next-day convention
      if (o >= 1440 || c > WEEK_MIN || c <= o) continue; // outside a week's minutes: dropped, never guessed
      const p = { d, o, c };
      if (!out.some((q) => q.d === p.d && q.o === p.o && q.c === p.c)) out.push(p);
    }
  });
  out.sort((a, b) => a.d - b.d || a.o - b.o);
  // open all week round the clock: the contract's one period
  if (out.length === 7 && out.every((p) => p.o === 0 && p.c === 1440) && new Set(out.map((p) => p.d)).size === 7) return [{ d: 0, o: 0, c: WEEK_MIN }];
  return out;
}

/** The payload parsed into the whitelist, or why not (stale: a stub or another place's page; mismatch: another cid). */
export type Parsed = { ok: true; meta: GDetails; refs: string[] } | { ok: false; why: 'stale' | 'mismatch' };
export function parsePlace(text: string, t: { id: string; cid: string | null; ftid: string }, now: number): Parsed {
  const d = JSON.parse(text.replace(/^\)\]\}'\s*/, '')) as unknown;
  const p = at(d, 6);
  const ftid = at(p, 10);
  if (!Array.isArray(p) || typeof ftid !== 'string') return { ok: false, why: 'stale' }; // a stale ftid gets a 1 kB stub
  if (t.cid === null) {
    if (ftid !== t.ftid) return { ok: false, why: 'stale' }; // resolved to another place
  } else {
    const cid = at(p, 181, 4);
    if (typeof cid === 'string' && /^\d+$/.test(cid) && cid !== t.cid) return { ok: false, why: 'mismatch' };
  }
  const meta: GDetails = { v: 1, id: t.id, at: now, ftid, hours: periodsOf(at(p, 203, 0)) };
  const web = at(p, 7, 0);
  if (typeof web === 'string' && web.length <= 200) {
    const https = web.startsWith('http://') ? `https://${web.slice(7)}` : web;
    if (https.startsWith('https://')) meta.web = https;
  }
  const tel = at(p, 178, 0, 0);
  if (typeof tel === 'string' && TEL.test(tel)) meta.tel = tel;
  const desc = at(p, 154, 0, 0);
  if (typeof desc === 'string' && desc.trim() && !desc.includes('<')) meta.desc = desc.slice(0, DESC_MAX);
  const r = at(p, 4, 7);
  if (typeof r === 'number' && r >= 0 && r <= 5) meta.r = r;
  const rn = at(p, 4, 8);
  if (Number.isInteger(rn) && (rn as number) >= 0) meta.rn = rn as number;
  const cats = at(p, 13);
  const kind = Array.isArray(cats) ? cats.find((c): c is string => typeof c === 'string' && !!c.trim()) : undefined;
  if (kind && kind.length <= KIND_MAX) meta.kind = kind;
  if (at(p, 23) === 1) meta.shut = true;
  // photo refs: lh3 grass-cs URLs; review avatars (/a-) and Street View never
  const refs = [...new Set(text.match(/https:\/\/lh3\.googleusercontent\.com\/grass-cs\/[^"\\=]+/g) ?? [])]
    .filter((u) => !u.includes('/a-') && !u.includes('streetviewpixels'))
    .slice(0, PICS_MAX);
  return { ok: true, meta, refs };
}
