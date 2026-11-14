// The Kalori scraper's status (docs/design.md "Bots": ボット's メニュー tab): status.json on the `kalori-status` branch,
// written by the scrape and merge workflows (the shape: their contract, `v: 1`; unknown fields and reason codes
// tolerated), read raw from GitHub (public: no key), a failed read logged as kalori.fail; with the page's view helpers
// so KaloriPage stays thin. The verdict is the file's, but for 遅れ: the app's own clock says so too once the
// scheduled run is a day overdue with no newer run (the workflows can't write a file when they never start).
import { t } from '#lib/i18n/index.ts';
import { formatNum } from '#lib/i18n/index.ts';
import { isNum, isRec, isText } from '#lib/contract/guards.ts';
import type { CellState, StripCell, StripTick } from '#lib/strip.ts';
import { fetchPublic, type PublicReply } from '#lib/bots/fetchPublic.ts';
import type { BotTone, BotWord } from '#lib/bots/types.ts';
import { dayOf, dayOfDate, durationOf, mdOf, timeOf, whenOf } from '#lib/i18n/when.ts';
import '#lib/i18n/kalori.ts';
import '#lib/i18n/bots.ts';

// ---- The payload (the workflows own it: change both together) ----
export type Verdict = 'healthy' | 'running' | 'held' | 'failing' | 'late' | 'none';
type RunResult = 'published' | 'held' | 'failed' | 'running' | 'cancelled';
type WeekResult = 'merged' | 'held' | 'failed' | 'none';
type Deploy = 'ok' | 'failed' | 'pending' | 'held' | 'reverted';
/** The diff's shares (and their limits) the merge gate weighs: fractions of the accepted dataset (0.021 = 2.1 %). */
type ShareKey = 'added' | 'gone' | 'valuesChanged' | 'estChanged';
interface Run {
  id: number; url: string | null; event: string | null; round: number; result: RunResult;
  startedAt: number; endedAt: number | null; shardsDone: number; shardsTotal: number;
}
interface DatasetInfo { tag: string; date: string | null; url: string | null; items: number | null; shops: number | null; ended: number | null }
/** A gate the merge failed (kalori_status.py writes the failed band rows): its reason code, the gate's key (gone,
 *  renamed, items, shops, …), its share and limit (null for the shop and drop counts, or without a base). */
interface Tripped { code: string; key: string; share: number | null; limit: number | null }
export interface Diff {
  added: number; gone: number; renamed: number; valuesChanged: number; estChanged: number; endedChanged: number; itemsDelta: number;
  shares: Partial<Record<ShareKey, number>>; limits: Partial<Record<ShareKey, number>>;
  /** null: a file from before the gates wrote it. */
  tripped: Tripped[] | null;
}
interface Coverage { complete: boolean; fetched: number | null; discovered: number | null; shopsTracked: number | null; noNutrition: number | null; failed: number | null }
interface Merge { sha: string | null; deploy: Deploy | null; pr: string | null }
/** No email or issue: the alert lives here only (the tab's dot and its card are the one signal). */
interface Alert { text: string; since: number | null; runUrl: string | null; prUrl: string | null }
interface Week { t: number; result: WeekResult; tag: string | null; added: number; gone: number; valuesChanged: number; endedChanged: number; ms: number | null; runUrl: string | null }
export interface KaloriStatus {
  v: 1;
  at: number;
  verdict: Verdict;
  reasons: string[];
  run: Run | null;
  next: number | null;
  dataset: DatasetInfo | null;
  diff: Diff | null;
  coverage: Coverage | null;
  merge: Merge | null;
  alert: Alert | null;
  history: Week[];
}

/** The raw file (a fork or e2e passes its own). vite.config.ts's CSP allows the host. */
const KALORI_STATUS_URL = 'https://raw.githubusercontent.com/huangwaylon/fitness/kalori-status/status.json';
/** The workflow ⋯ opens. */
const WORKFLOW = 'kalori-scrape.yml';

const VERDICTS: readonly Verdict[] = ['healthy', 'running', 'held', 'failing', 'late', 'none'];
const RESULTS: readonly RunResult[] = ['published', 'held', 'failed', 'running', 'cancelled'];
const WEEK_RESULTS: readonly WeekResult[] = ['merged', 'held', 'failed', 'none'];
const DEPLOYS: readonly Deploy[] = ['ok', 'failed', 'pending', 'held', 'reverted'];
const SHARE_KEYS: readonly ShareKey[] = ['added', 'gone', 'valuesChanged', 'estChanged'];
/** The reasons the page has words for (the alert job's codes; another is left out). */
export const REASONS = [
  'drift', 'nonut', 'crash', 'limits', 'incomplete', 'publish', 'update', 'diff_gate', 'band_added', 'band_gone', 'band_values', 'band_est',
  'band_ended', 'band_items', 'band_shops', 'band_drops', 'tests', 'main_moved', 'deploy_failed', 'reverted', 'late', 'stuck'
] as const;
const HISTORY_MAX = 12;

const num = (x: unknown): number | null => (isNum(x) ? x : null);
/** A short text (a tag, a sha, a code), at most `max` characters. */
const str = (x: unknown, max = 80): string | null => (isText(x, max) ? x : null);
/** The repo's own pages only (a run, a release, a PR): another host, a scheme, a long string is dropped. */
const REPO = 'https://github.com/huangwaylon/fitness/';
const link = (x: unknown): string | null => (isText(x, 300) && x.startsWith(REPO) && !/[\s"'<>\\]/.test(x) ? x : null);
/** A time the file can mean: 2020 on, at most 400 days ahead of the phone (none else: a 1e300 `next`). */
const T_MIN = Date.UTC(2020, 0, 1);
const AHEAD_MS = 400 * 86_400_000;
const ts = (x: unknown, now: number): number | null => (isNum(x) && x >= T_MIN && x <= now + AHEAD_MS ? x : null);
const pick = <T extends string>(x: unknown, list: readonly T[]): T | null => (list.includes(x as T) ? (x as T) : null);

function parseRun(x: unknown, now: number): Run | null {
  if (!isRec(x) || num(x.id) === null || ts(x.startedAt, now) === null) return null;
  return {
    id: x.id as number, url: link(x.url), event: str(x.event), round: num(x.round) ?? 1, result: pick(x.result, RESULTS) ?? 'failed',
    startedAt: x.startedAt as number, endedAt: ts(x.endedAt, now), shardsDone: num(x.shardsDone) ?? 0, shardsTotal: num(x.shardsTotal) ?? 20
  };
}

const BAND_KEYS = ['added', 'gone', 'values', 'est', 'ended', 'renamed', 'items', 'shops', 'drops'];
function parseTripped(x: unknown): Tripped[] | null {
  if (!Array.isArray(x)) return null;
  return x.flatMap((r): Tripped[] => isRec(r) && typeof r.code === 'string' && (REASONS as readonly string[]).includes(r.code) && BAND_KEYS.includes(r.key as string)
    ? [{ code: r.code, key: r.key as string, share: num(r.share), limit: num(r.limit) }] : []);
}

function parseShares(x: unknown): Partial<Record<ShareKey, number>> {
  const o: Partial<Record<ShareKey, number>> = {};
  if (isRec(x)) for (const k of SHARE_KEYS) if (isNum(x[k])) o[k] = x[k];
  return o;
}

function parseWeek(x: unknown, now: number): Week | null {
  if (!isRec(x) || ts(x.t, now) === null) return null;
  return {
    t: x.t as number, result: pick(x.result, WEEK_RESULTS) ?? 'none', tag: str(x.tag), added: num(x.added) ?? 0, gone: num(x.gone) ?? 0,
    valuesChanged: num(x.valuesChanged) ?? 0, endedChanged: num(x.endedChanged) ?? 0, ms: num(x.ms), runUrl: link(x.runUrl)
  };
}

/** status.json as the page reads it, or null when it isn't one (another version, a proxy's page, garbage). `v`, `at`
 *  and the verdict must be there; a part that's missing or malformed is null, an unknown reason left out, a time out
 *  of range (ts) null, a link not the repo's (link) null, a text capped. `now`: the phone's clock. */
export function parseStatus(x: unknown, now = Date.now()): KaloriStatus | null {
  if (!isRec(x) || x.v !== 1 || ts(x.at, now) === null || !pick(x.verdict, VERDICTS)) return null;
  const d = x.dataset, f = x.diff, c = x.coverage, m = x.merge, a = x.alert;
  return {
    v: 1, at: x.at as number, verdict: x.verdict as Verdict,
    reasons: Array.isArray(x.reasons) ? [...new Set(x.reasons.filter((r): r is string => (REASONS as readonly string[]).includes(r as string)))] : [],
    run: parseRun(x.run, now),
    next: ts(x.next, now),
    dataset: isRec(d) && str(d.tag) ? { tag: d.tag as string, date: typeof d.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.date) ? d.date : null, url: link(d.url), items: num(d.items), shops: num(d.shops), ended: num(d.ended) } : null,
    diff: isRec(f)
      ? {
          added: num(f.added) ?? 0, gone: num(f.gone) ?? 0, renamed: num(f.renamed) ?? 0, valuesChanged: num(f.valuesChanged) ?? 0, estChanged: num(f.estChanged) ?? 0,
          endedChanged: num(f.endedChanged) ?? 0, itemsDelta: num(f.itemsDelta) ?? 0, shares: parseShares(f.shares), limits: parseShares(f.limits),
          tripped: parseTripped(f.tripped)
        }
      : null,
    coverage: isRec(c)
      ? { complete: c.complete === true, fetched: num(c.fetched), discovered: num(c.discovered), shopsTracked: num(c.shopsTracked), noNutrition: num(c.noNutrition), failed: num(c.failed) }
      : null,
    merge: isRec(m) ? { sha: str(m.sha), deploy: pick(m.deploy, DEPLOYS), pr: link(m.pr) } : null,
    alert: isRec(a) && str(a.text, 300) ? { text: a.text as string, since: ts(a.since, now), runUrl: link(a.runUrl), prUrl: link(a.prUrl) } : null,
    history: Array.isArray(x.history) ? x.history.slice(-HISTORY_MAX).map((w) => parseWeek(w, now)).filter((w): w is Week => w !== null) : []
  };
}

/** A read's outcome: the status, or why not (`offline`: no answer; `http`: another status; `json`: not a status). */
export type StatusReply = PublicReply<KaloriStatus>;

/** GET status.json (lib/bots/fetchPublic.ts: public, logged as `kalori.fail`), past the HTTP cache
 *  (raw.githubusercontent.com keeps a copy ~5 min: the CDN's, not ours). */
export const fetchStatus = (signal?: AbortSignal, url = KALORI_STATUS_URL): Promise<StatusReply> =>
  fetchPublic(url, 'kalori.fail', (x) => parseStatus(x), { signal, cache: 'no-cache' });

// ---- Time, Tokyo's ----
const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;
/** 遅れ: the scheduled run this long overdue with no newer one. */
const LATE_MS = DAY_MS;
/** The dot on its own: the scheduled run this long overdue, whatever the file says. */
const STALE_MS = 2 * DAY_MS;

/** `4時間12分`; under an hour `38分`. */
const duration = (ms: number): string => durationOf(ms, false);
const pct = (f: number): string => `${(Math.round(f * 1000) / 10).toFixed(1)}%`;

// ---- The page's view ----
/** The verdict shown: the file's, or 遅れ when the scheduled run (`next`) is LATE_MS behind `now` with no run since
 *  it (a 順調, 取得中 or まだ file the workflows never got to rewrite). 保留 and 不調 stay theirs. */
export function verdictOf(s: KaloriStatus, now: number): Verdict {
  if (s.verdict === 'held' || s.verdict === 'failing' || s.verdict === 'late') return s.verdict;
  return overdue(s, now, LATE_MS) ? 'late' : s.verdict;
}

/** The scheduled run more than `by` behind `now`, and no run started since it. */
const overdue = (s: KaloriStatus, now: number, by: number): boolean => s.next !== null && now > s.next + by && !(s.run && s.run.startedAt >= s.next);

const TONE: Record<Verdict, BotTone> = { healthy: 'good', running: 'busy', held: 'warn', late: 'warn', failing: 'bad', none: 'idle' };
const WORD: Record<Verdict, BotWord> = { healthy: 'healthy', running: 'fetching', held: 'held', late: 'late', failing: 'failing', none: 'none' };

/** ボット's dot (the menu's pill, the メニュー tab): 保留, 不調 or 遅れ, an alert standing, or the run two days overdue. */
export const needsAttention = (s: KaloriStatus, now: number): boolean =>
  ['held', 'failing', 'late'].includes(verdictOf(s, now)) || s.alert !== null || overdue(s, now, STALE_MS);

const isBand = (r: string): boolean => r.startsWith('band_');
/** The bands of the changes themselves (保留's 変更が多すぎる); the others (item and shop counts, drops): いつもと違う. */
const CHANGE_BANDS = new Set(['band_added', 'band_gone', 'band_values', 'band_est', 'band_ended']);

/** The gates that tripped: the file's (`diff.tripped`, the failed rows), else the band reasons without figures (a
 *  file from before it: never a share that isn't the one that tripped). */
const trippedOf = (s: KaloriStatus): Tripped[] =>
  s.diff?.tripped ?? s.reasons.filter(isBand).map((code) => ({ code, key: code.slice(5), share: null, limit: null }));

/** A tripped gate's line: 「削除 2.1%・上限1.5%」 (its share against its limit), else its word. */
function bandText(b: Tripped): string {
  const word = t(`kalori.band.${b.key}`);
  return b.share === null || b.limit === null ? word : t('kalori.band.line', { word, share: pct(b.share), limit: pct(b.limit) });
}

/** A reason in words: its sentence (`limits` with the rounds run, `late` with the run's time); a band's, its tripped
 *  gates' lines. */
export function reasonText(s: KaloriStatus, r: string): string {
  if (isBand(r)) return trippedOf(s).filter((b) => b.code === r).map(bandText).join('、') || t(`kalori.band.${r.slice(5)}`);
  return t(`kalori.reason.${r}`, { n: s.run?.round ?? 1, time: s.next === null ? t('kalori.unknown') : whenOf(s.next) });
}

/** The accepted data's day, in words (the dataset's date, else the tag's). */
const dataDay = (s: KaloriStatus): string => {
  const d = s.dataset?.date ?? s.dataset?.tag.match(/\d{4}-\d{2}-\d{2}/)?.[0];
  return d ? dayOfDate(d) : t('kalori.unknown');
};

/** The verdict card: its tone, its word, and one plain sentence. */
export function verdictView(s: KaloriStatus, now: number): { tone: BotTone; w: BotWord; word: string; sentence: string; verdict: Verdict } {
  const v = verdictOf(s, now);
  const nextAt = s.next === null ? t('kalori.unknown') : whenOf(s.next);
  const bands = trippedOf(s);
  const first = s.reasons.find((r) => !isBand(r));
  const sentence =
    v === 'healthy' ? t('kalori.say.healthy', { date: dataDay(s) })
    : v === 'running' ? t('kalori.say.running', { n: s.run?.round ?? 1, d: s.run?.shardsDone ?? 0, total: s.run?.shardsTotal ?? 20 })
    : v === 'held' ? (bands.length ? t(bands.every((b) => CHANGE_BANDS.has(b.code)) ? 'kalori.say.held' : 'kalori.say.heldOdd', { what: bands.map(bandText).join('、'), date: dataDay(s) })
      : first ? reasonText(s, first) : t('kalori.say.heldPlain', { date: dataDay(s) }))
    : v === 'late' ? t('kalori.reason.late', { time: nextAt })
    : v === 'failing' ? (first ? reasonText(s, first) : t('kalori.reason.crash'))
    : t('kalori.say.none', { time: nextAt });
  return { tone: TONE[v], w: WORD[v], word: t(`bots.w.${WORD[v]}`), sentence, verdict: v };
}

/** 確認が必要's lines, only what the verdict's sentence doesn't say: held with a PR, the step (look, merge by hand;
 *  the card has its link); the reasons the sentence leaves out (a band's line among them); an alert's own text when no
 *  reason words it. Empty when there's nothing more (遅れ, a plain 不調: the sentence says it). */
export function alertLines(s: KaloriStatus, now: number): string[] {
  const v = verdictOf(s, now);
  if (v !== 'held' && v !== 'failing' && !s.alert) return [];
  const said = verdictView(s, now).sentence;
  const rest = s.reasons.filter((r) => !(v === 'held' && isBand(r))).map((r) => reasonText(s, r)).filter((l) => !said.includes(l));
  if (!s.reasons.length && s.alert && !said.includes(s.alert.text)) rest.push(s.alert.text);
  return [...(prLink(s, now) ? [t('kalori.attn.merge')] : []), ...new Set(rest)];
}

/** The run, while there's one worth a look (取得中, 保留, 不調), else null. */
const runLink = (s: KaloriStatus, now: number): string | null =>
  ['running', 'held', 'failing'].includes(verdictOf(s, now)) ? (s.alert?.runUrl ?? s.run?.url ?? null) : null;
/** 保留's PR, else null. */
const prLink = (s: KaloriStatus, now: number): string | null => (verdictOf(s, now) === 'held' ? (s.alert?.prUrl ?? s.merge?.pr ?? null) : null);

/** The verdict's ⋯ (docs/design.md "Bots"): 実行を開く (a run worth a look), PRを開く (保留), ワークフローを開く (always). */
export const menuLinks = (s: KaloriStatus, now: number): { id: 'run' | 'pr' | 'workflow'; href: string }[] => [
  ...(runLink(s, now) ? [{ id: 'run' as const, href: runLink(s, now)! }] : []),
  ...(prLink(s, now) ? [{ id: 'pr' as const, href: prLink(s, now)! }] : []),
  { id: 'workflow', href: `${REPO}actions/workflows/${WORKFLOW}` }
];

/** The key row (docs/design.md "Bots"): 前回 (the newest run kept, with what came of it: the deploy's failure or
 *  revert when it's the merge's run, else its result; a run under way doesn't count yet) · 次回 · 品目 (the accepted data's; 不調: 最後の成功, the
 *  newest merged run). */
export function keyRow(s: KaloriStatus, now: number): { id: string; label: string; value: string; sub?: string }[] {
  const h = s.history.at(-1);
  const d = s.merge?.deploy;
  // the merge's outcome only when that newest run is the merge's (merged, or a released one the revert marked failed);
  // a later run (a nochange, a failure) says its own
  const mine = !!h && (h.result === 'merged' || (h.result === 'failed' && d === 'reverted' && h.tag !== null));
  const out = !h ? undefined : mine && (d === 'failed' || d === 'reverted') ? t(`kalori.key.${d}`) : t(h.result === 'none' ? 'kalori.key.none' : `kalori.strip.${h.result}`);
  const ok = s.history.findLast((w) => w.result === 'merged');
  const third = verdictOf(s, now) === 'failing'
    ? { id: 'ok', label: t('bots.key.lastOk'), value: ok ? timeOf(ok.t, now) : t('bots.key.never') }
    : s.dataset?.items != null
      ? { id: 'items', label: t('kalori.fact.items'), value: t('kalori.items', { n: formatNum(s.dataset.items) }), ...(s.dataset.shops === null ? {} : { sub: t('kalori.shops', { n: formatNum(s.dataset.shops) }) }) }
      : null;
  return [
    { id: 'last', label: t('bots.key.last'), value: h ? timeOf(h.t, now) : t('bots.key.never'), ...(out ? { sub: out } : {}) },
    { id: 'next', label: t('bots.key.next'), value: s.next === null ? t('kalori.unknown') : t('bots.key.about', { time: timeOf(s.next, now) }) },
    ...(third ? [third] : [])
  ];
}

/** 網羅: 完了, else what was fetched of what was found, and the failures. */
function coverageText(c: Coverage): string {
  if (c.complete) return t('kalori.cov.complete');
  const parts = [c.fetched !== null && c.discovered !== null ? t('kalori.cov.of', { a: formatNum(c.fetched), b: formatNum(c.discovered) }) : t('kalori.cov.partial')];
  if (c.failed) parts.push(t('kalori.cov.failed', { n: formatNum(c.failed) }));
  return parts.join(' · ');
}

export interface Fact { id: string; label: string; value: string; href?: string }

/** くわしく: データ (the release), 網羅, 実行 (unless ⋯ opens it), 所要時間, ラウンド, 変更率 (unless 保留 names the
 *  gates), PR (unless ⋯ opens it), デプロイ. Each only when the file has it. */
export function factRows(s: KaloriStatus, now: number): Fact[] {
  const { run, dataset: d, diff, coverage: c, merge: m } = s;
  const held = verdictOf(s, now) === 'held';
  const rates = diff ? SHARE_KEYS.filter((k) => diff.shares[k] !== undefined).map((k) => {
    const lim = diff.limits[k];
    return lim === undefined ? `${t(`kalori.change.${k}`)} ${pct(diff.shares[k]!)}` : t('kalori.band.line', { word: t(`kalori.change.${k}`), share: pct(diff.shares[k]!), limit: pct(lim) });
  }) : [];
  const rows: (Fact | null)[] = [
    d ? { id: 'data', label: t('kalori.fact.data'), value: d.tag, ...(d.url ? { href: d.url } : {}) } : null,
    c ? { id: 'coverage', label: t('kalori.fact.coverage'), value: coverageText(c) } : null,
    run && !runLink(s, now) ? { id: 'run', label: t('kalori.fact.run'), value: `#${run.id}`, ...(run.url ? { href: run.url } : {}) } : null,
    run ? { id: 'took', label: t('kalori.fact.took'), value: duration((run.endedAt ?? now) - run.startedAt) } : null,
    run ? { id: 'rounds', label: t('kalori.fact.rounds'), value: t('kalori.roundsN', { n: run.round }) } : null,
    rates.length && !held ? { id: 'rate', label: t('kalori.fact.rate'), value: rates.join('、') } : null,
    m?.pr && !held ? { id: 'pr', label: t('kalori.fact.pr'), value: `#${m.pr.match(/\/pull\/(\d+)/)?.[1] ?? 'PR'}`, href: m.pr } : null,
    m?.deploy ? { id: 'deploy', label: t('kalori.fact.deploy'), value: t(`kalori.deploy.${m.deploy}`) } : null
  ];
  return rows.filter((r): r is Fact => r !== null);
}

/** 最新の更新's bar: added leaf, 値の変更 yuzu, 終了 hatched, 削除 sunk; its one line for VoiceOver. */
export function changeParts(d: Diff): { parts: { id: string; tone: 'leaf' | 'yuzu' | 'hatch' | 'sunk'; label: string; n: number }[]; summary: string } {
  const parts = [
    { id: 'added', tone: 'leaf' as const, label: t('kalori.change.added'), n: d.added },
    { id: 'valuesChanged', tone: 'yuzu' as const, label: t('kalori.change.valuesChanged'), n: d.valuesChanged },
    { id: 'endedChanged', tone: 'hatch' as const, label: t('kalori.change.endedChanged'), n: d.endedChanged },
    { id: 'gone', tone: 'sunk' as const, label: t('kalori.change.gone'), n: d.gone }
  ];
  return { parts, summary: t('kalori.change.summary', { list: parts.map((p) => `${p.label}${formatNum(p.n)}`).join(t('kalori.change.sep')) }) };
}

// ---- 直近8週: a cell a week ----
const WEEKS = 8;
/** A week's cell begins this long before its scheduled run (a dispatch a little early stays in its week). */
const LEAD_MS = DAY_MS / 2;
const CELL: Record<WeekResult, CellState> = { merged: 'ok', held: 'warn', failed: 'fail', none: 'none' };

/** A run's part of its cell's line: 「11/14（土）· 公開 · 追加12 値38 終了3 · 4時間12分」. */
function weekText(w: Week): string {
  const counts = w.result === 'none' ? [] : [t('kalori.strip.counts', { a: formatNum(w.added), v: formatNum(w.valuesChanged), e: formatNum(w.endedChanged) })];
  return t('kalori.fmt.lead', { day: dayOf(w.t), rest: [t(`kalori.strip.${w.result}`), ...counts, ...(w.ms ? [duration(w.ms)] : [])].join(' · ') });
}

/** The last 8 weeks, oldest first, a cell each, around the Wednesday run (`next`, stepped a week at a time until the
 *  newest cell holds `now`): green 公開, yellow capped 保留, coral hatched 失敗, a low tick no run (each week's newest
 *  run decides it; all of them are named in its line). Ticks every other week (the run's day); VoiceOver's line
 *  「直近8週：公開7回、保留1回、失敗0回」, the one under it 「公開7 · 保留1 · 失敗0」. */
export function weekStrip(s: KaloriStatus, now: number): { cells: StripCell[]; ticks: StripTick[]; summary: string; line: string } {
  // the first week's end past now, on the run's weekly grid (arithmetic: never a loop over the file's numbers)
  const base = (s.next ?? now) - LEAD_MS;
  const end = base + (Math.floor((now - base) / WEEK_MS) + 1) * WEEK_MS;
  const cells: StripCell[] = Array.from({ length: WEEKS }, (_, i) => {
    const start = end - (WEEKS - i) * WEEK_MS, stop = start + WEEK_MS;
    const runs = s.history.filter((w) => w.t >= start && w.t < stop).sort((a, b) => a.t - b.t);
    const last = runs.at(-1);
    return {
      start, end: stop, state: last ? CELL[last.result] : 'none',
      label: runs.length ? runs.map(weekText).join(' / ') : t('kalori.fmt.lead', { day: dayOf(start + LEAD_MS), rest: t('kalori.strip.none') })
    };
  });
  const count = (st: CellState) => cells.filter((c) => c.state === st).length;
  const ticks = cells.flatMap((c, i) => ((WEEKS - 1 - i) % 2 === 0 ? [{ i, label: mdOf(c.start + LEAD_MS) }] : []));
  const n = { ok: count('ok'), held: count('warn'), failed: count('fail') };
  return { cells, ticks, summary: t('kalori.strip.summary', n), line: t('kalori.strip.line', n) };
}
