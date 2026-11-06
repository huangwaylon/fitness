// ききみみ クイズ's きろく on this phone (docs/kikimimi.md "Progress & feedback", "Storage"): a game's `listen` row is
// sent to the record (the write queue: offline it waits) and kept on the phone too (DEVICE.kikimimiGames, my last 300),
// so きろく has it at once, offline, and even when the record refused it (a relay from before the row: no toast,
// store/live.ts). The report folds the record's rows (mine whole, the partner's as summaries; the queued ones too)
// with the phone's own, the record's winning by game id. Loaded with the sheet only.
import type { EventRow } from '#lib/contract/api.ts';
import { listenOf, type ListenRow } from '#lib/contract/listen.ts';
import { localDateAt } from '#lib/contract/tokyo.ts';
import { LADDER_OK, LEVELS } from '#lib/kikimimi/deck.ts';
import { reportOf, type Report } from '#lib/kikimimi/report.ts';
import { answersOf, type Answer } from '#lib/kikimimi/progress.ts';
import { week } from '#lib/store/week.svelte.ts';
import { DEVICE, localKV, readJson, writeJson } from '#lib/sync/storage.ts';
import type { LocalDate, Who } from '#lib/types.ts';
import type { Rec } from '#lib/kikimimi/advice.ts';
import { levelMark, sx } from './look.ts';
import { remember, type Recent } from '#lib/kikimimi/recent.ts';
import { unitsOf, type UnitState } from '#lib/kikimimi/stamps.ts';
import { INDEX, unitIds, unitPart } from '#lib/kikimimi/pool.ts';
import { lessonsOfMask, pathOf, type Filter, type Path, type PathUnit } from '#lib/kikimimi/path.ts';
import { LESSONS } from '#lib/kikimimi/stages.ts';
import { hooksOn } from '../island/devHooks.ts';
import { t } from '#lib/i18n/index.ts';

type Kept = { at: number; row: ListenRow };
const KEEP = 300;
/** Bumped as a game is kept here (the report reads the phone's rows again). */
let kept = $state(0);

function keptRows(me: Who): Kept[] {
  const v = readJson<{ who?: unknown; rows?: unknown }>(localKV(), DEVICE.kikimimiGames);
  if (!v || v.who !== me || !Array.isArray(v.rows)) return [];
  return v.rows.filter((k): k is Kept => !!k && typeof k === 'object' && typeof (k as Kept).at === 'number' && listenOf((k as Kept).row) !== null);
}

/** The item ids of my last games on this phone, newest first (kikimimi/recent.ts). */
export function recentGames(): Recent {
  const v = readJson<unknown>(localKV(), DEVICE.kikimimiRecent);
  return Array.isArray(v) ? v.filter((g): g is string[] => Array.isArray(g) && g.every((id) => typeof id === 'string')) : [];
}
/** A game begun on this phone: its items put first in the history. */
export function rememberGame(ids: readonly string[]): void {
  writeJson(localKV(), DEVICE.kikimimiRecent, remember(recentGames(), ids));
}

/** A game of mine finished (or left mid-way): kept on this phone and sent to the record. A game joined again after
 *  leaving it keeps both rows here as on the record (one game in the fold: progress.ts gamesOf). */
export function recordGame(me: Who, row: ListenRow): void {
  const rows = [...keptRows(me), { at: Date.now(), row }].slice(-KEEP);
  writeJson(localKV(), DEVICE.kikimimiGames, { who: me, rows });
  kept++;
  week.send('listen', row as unknown as Record<string, unknown>);
}

/** The `listen` rows きろく reads: the record's (and the queue's) and, for a game of mine they lack, the phone's. */
function progressRows(me: Who, record: readonly EventRow[]): EventRow[] {
  const have = new Set<string>();
  for (const r of record) {
    if (r[1] !== me) continue;
    const g = /"g":"([a-z0-9]+)"/.exec(r[4]);
    if (g) have.add(g[1]);
  }
  const local = keptRows(me).filter((k) => !have.has(k.row.g)).map((k): EventRow => [new Date(k.at).toISOString(), me, `local-${k.row.g}`, 'listen', JSON.stringify(k.row)]);
  return local.length ? [...record, ...local] : [...record];
}

/** The report as last built, and what it was built from: the record's `listen` rows (the model keeps them while no
 *  event changes them), who I am, today and the phone's rows. The lobby's view refreshes about once a second and
 *  several parts read the report each time; it's folded again only when one of those changes. Its units and answers
 *  are worked out once, on first ask. */
let memo: { listen: readonly EventRow[]; me: Who; day: LocalDate; kept: number; report: Report; units?: Map<string, UnitState>; answers?: Answer[] } | null = null;
function memoNow(): typeof memo {
  const k = kept;
  const m = week.model;
  if (!m) return null;
  const listen = m.state.listen, me = m.me, day = localDateAt(m.now);
  if (memo && memo.listen === listen && memo.me === me && memo.day === day && memo.kept === k) return memo;
  return (memo = { listen, me, day, kept: k, report: reportOf(progressRows(me, listen), me, day, LEVELS, LADDER_OK) });
}

/** My report now (null before the week's first load). Reactive: call it in a $derived. */
export function currentReport(): Report | null {
  return memoNow()?.report ?? null;
}

/** Each unit's dots, stamps and recheck now (stamps.ts, from my report's games and the partner's summaries); empty
 *  before the week's first load. Reactive: call it in a $derived. */
export function currentUnits(): Map<string, UnitState> {
  const m = memoNow();
  return m ? (m.units ??= unitsOf(m.report.games, m.report.others)) : new Map();
}

/** Every answer of my report's games (srs.ts's phrases); empty before the week's first load. Reactive. */
export function currentAnswers(): Answer[] {
  const m = memoNow();
  return m ? (m.answers ??= answersOf(m.report.games)) : [];
}

/** Bumped as a unit's chunk is put in at run time (the e2e's fixture: pool.ts addUnit), so the path lists it. */
let added = $state(0);
export const unitAdded = (): void => void added++;

/** The units on しまの みち: the build's (the index's path lines) and any put in at run time. A unit still a draft (not
 *  voiced: no clips) shows only with the dev hooks on (a dev build or `?demo`). Reactive. */
export function pathUnits(): PathUnit[] {
  void added;
  const drafts = hooksOn();
  const out: PathUnit[] = [];
  for (const id of unitIds()) {
    const line = INDEX.paths.find((p) => p[0] === id);
    const part = line ? null : unitPart(id)?.unit;
    const u: PathUnit | null = line
      ? { id, name: line[1], stage: line[2], domain: line[3], host: line[4], status: line[5], lessons: lessonsOfMask(line[6]), ...(line[7] && { short: line[7] }) }
      : part ? { id, name: part.name, stage: part.stage, domain: part.domain, also: part.also, host: part.host, status: part.status, lessons: LESSONS.filter((l) => !!part.lessons[l]), ...(part.cando.short && { short: part.cando.short }) } : null;
    if (u && (u.status !== 'draft' || drafts)) out.push(u);
  }
  return out;
}

/** しまの みち now (path.ts, from my report: the stamps, my comfortable level, the units of my lessons in order).
 *  Reactive: call it in a $derived. */
export function currentPath(filter: Filter = 'all'): Path {
  const r = currentReport();
  const states = currentUnits();
  const played = r ? r.games.flatMap((g) => (g.u !== undefined && g.l !== undefined ? [g.u] : [])) : [];
  return pathOf({ units: pathUnits(), states, level: r?.stats.level ?? null, played, filter });
}

/** A recommendation's words: its title and why (きろく's rows, the results' 「つぎは…」). */
export function recWords(r: Rec): { title: string; why: string } {
  const pct = (x: number) => Math.round(x * 100);
  switch (r.kind) {
    case 'review': return { title: t('kiki.rec.review', { n: r.due }), why: t('kiki.rec.reviewWhy') };
    case 'skill': return { title: t('kiki.rec.skill', { skill: t(`kiki.skill.${r.skill}`) }), why: t('kiki.rec.skillWhy', { pct: pct(r.m) }) };
    case 'try': return { title: t('kiki.rec.try', { skill: t(`kiki.skill.${r.skill}`) }), why: t('kiki.rec.tryWhy') };
    case 'level': return { title: t('kiki.rec.level', { name: `${levelMark(r.lv)} ${t(`kiki.lv.${r.lv}`)}` }), why: t('kiki.rec.levelWhy') };
    case 'steady': return { title: t('kiki.rec.steady'), why: t('kiki.rec.steadyWhy', { name: `${levelMark(r.lv)} ${t(`kiki.lv.${r.lv}`)}` }) };
    case 'accent': return { title: t('kiki.rec.accent', { accent: t(`kiki.accent.${r.accent}`) }), why: t('kiki.rec.accentWhy') };
    case 'speed': return r.tried
      ? { title: t('kiki.rec.speed'), why: r.at === null ? t('kiki.prog.speedLow') : t('kiki.rec.speedWhy', { x: sx(r.at) }) }
      : { title: t('kiki.rec.speedTry'), why: t('kiki.rec.speedTryWhy') };
  }
}
