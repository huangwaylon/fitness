// ききみみ クイズ's きろく on this phone (docs/kikimimi.md "Progress & feedback", "Storage"): a game's `listen` row is
// sent to the record (the write queue: offline it waits) and kept on the phone too (DEVICE.kikimimiGames, my last 300),
// so きろく has it at once, offline, and even when the record refused it (a relay from before the row: no toast,
// store/live.ts). The report folds the record's rows (mine whole, the partner's as summaries; the queued ones too)
// with the phone's own, the record's winning by game id. Loaded with the sheet only.
import type { EventRow } from '#lib/contract/api.ts';
import { listenOf, type ListenRow } from '#lib/contract/listen.ts';
import { localDateAt } from '#lib/contract/tokyo.ts';
import { levelMark, type Level } from '#lib/kikimimi/bank.ts';
import { LADDER_OK, LEVELS } from '#lib/kikimimi/deck.ts';
import { reportOf, type Report } from '#lib/kikimimi/report.ts';
import { week } from '#lib/store/week.svelte.ts';
import { DEVICE, localKV, readJson, writeJson } from '#lib/sync/storage.ts';
import type { Who } from '#lib/types.ts';
import type { Rec } from '#lib/kikimimi/advice.ts';
import { sx } from '#lib/kikimimi/ladder.ts';
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

/** My report now (null before the week's first load). Reactive: call it in a $derived. */
export function currentReport(levels: readonly Level[] = LEVELS): Report | null {
  void kept;
  const m = week.model;
  if (!m) return null;
  return reportOf(progressRows(m.me, m.state.listen), m.me, localDateAt(m.now), levels, LADDER_OK);
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
