// 設定's 保養所ボット page's view (docs/design.md "Settings"), so ItsPage stays thin: the draft the page edits and how
// it becomes a PUT /its/settings body, the date rows' notes, the facilities (the roster, the names the runner has seen
// and the settings' lists, merged by normName), the verdict card, the facts, the bookings that need a person and the
// recent events. Pure but for t().
import {
  AUTO_CONFIRM_MIN_DAYS, GUESTS_MAX, GUESTS_MIN, LATE_AFTER_SEC, MAX_DATES, MAX_DAYS_AHEAD, daysUntil, isDate, normName, tokyoToday,
  type BookingEntry, type IntervalSec, type ItsEvent, type ItsSettings, type ItsSettingsInput, type ItsStatus, type Verdict
} from './contract.ts';
import { ROSTER, type RosterHotel } from '#lib/its/roster.ts';
import { t } from '#lib/i18n/index.ts';
import { formatDate, formatSyncTime } from '#lib/i18n/format.ts';
import '#lib/i18n/its.ts';

// ---- The draft ----
/** What the page edits (paused is 開始 / 停止's, at once). */
export interface Draft {
  intervalSec: IntervalSec;
  dates: string[];
  guests: number;
  skip: string[];
  priority: string[];
  autoConfirm: boolean;
}

export const draftOf = (s: ItsSettings): Draft => ({
  intervalSec: s.intervalSec, dates: [...s.dates], guests: s.guests, skip: [...s.skip], priority: [...s.priority], autoConfirm: s.autoConfirm
});

const sortedNorm = (xs: string[]) => [...new Set(xs.map(normName))].sort().join('\n');
/** The same settings: dates and skips as sets (skips by normName), priority in its order. */
export function sameDraft(a: Draft, b: Draft): boolean {
  return a.intervalSec === b.intervalSec && a.guests === b.guests && a.autoConfirm === b.autoConfirm
    && [...new Set(a.dates)].sort().join() === [...new Set(b.dates)].sort().join()
    && sortedNorm(a.skip) === sortedNorm(b.skip) && a.priority.map(normName).join('\n') === b.priority.map(normName).join('\n');
}

/** The PUT body: dates sorted, any that passed while the draft was open dropped (the Worker refuses those). */
export function toInput(d: Draft, baseUpdatedAt: number | null, now: number): ItsSettingsInput {
  const dates = [...new Set(d.dates)].filter((x) => daysUntil(x, now) >= 0).sort();
  return { intervalSec: d.intervalSec, dates, guests: Math.min(GUESTS_MAX, Math.max(GUESTS_MIN, d.guests)), skip: [...d.skip], priority: [...d.priority], autoConfirm: d.autoConfirm, baseUpdatedAt };
}

/** The date field's bounds: tonight in Tokyo to MAX_DAYS_AHEAD days on. */
export function dateBounds(now: number): { min: string; max: string } {
  const min = tokyoToday(now);
  return { min, max: new Date(Date.parse(min) + MAX_DAYS_AHEAD * 86_400_000).toISOString().slice(0, 10) };
}

/** A date added, or why not. */
export function addDate(d: Draft, date: string, now: number): { ok: true; draft: Draft } | { ok: false; why: 'bad' | 'past' | 'far' | 'dup' | 'full' } {
  if (!isDate(date)) return { ok: false, why: 'bad' };
  const n = daysUntil(date, now);
  if (n < 0) return { ok: false, why: 'past' };
  if (n > MAX_DAYS_AHEAD) return { ok: false, why: 'far' };
  if (d.dates.includes(date)) return { ok: false, why: 'dup' };
  if (d.dates.length >= MAX_DATES) return { ok: false, why: 'full' };
  return { ok: true, draft: { ...d, dates: [...d.dates, date].sort() } };
}

export const removeDate = (d: Draft, date: string): Draft => ({ ...d, dates: d.dates.filter((x) => x !== date) });

/** A stay's note: 自動で確定 (on, and AUTO_CONFIRM_MIN_DAYS+ away), only the D−4 facilities (under 10 days), past
 *  every cutoff (under 4), or none. */
export type DateNote = 'auto' | 'd4' | 'late' | null;
export function dateRows(d: Draft, now: number): { date: string; label: string; days: number; note: DateNote; text: string }[] {
  return [...d.dates].sort().map((date) => {
    const days = daysUntil(date, now);
    const note: DateNote = days < 4 ? 'late' : days < 10 ? 'd4' : d.autoConfirm && days >= AUTO_CONFIRM_MIN_DAYS ? 'auto' : null;
    const left = days <= 0 ? t('its.date.tonight') : t('its.date.left', { n: days });
    return { date, label: formatDate(date), days, note, text: note ? `${left} · ${t(`its.date.note.${note}`)}` : left };
  });
}

// ---- The facilities ----
export interface HotelRow {
  /** normName(name): the row's identity. */
  key: string;
  name: string;
  roster: RosterHotel | null;
  /** Offered by the site but on no roster here (a new facility, or a spelling the roster doesn't have). */
  fresh: boolean;
  /** Not skipped: the runner may book it. */
  search: boolean;
  /** Its place in the priority (0 = tried first), or null. */
  star: number | null;
}

/** A priority entry names a facility: a substring after normName, as the runner matches. */
const names = (key: string, p: string): boolean => {
  const n = normName(p);
  return n !== '' && key.includes(n);
};
/** The first priority entry's index that names a facility, or null. */
function starOf(key: string, priority: string[]): number | null {
  const i = priority.findIndex((p) => names(key, p));
  return i < 0 ? null : i;
}

const GROUP = (r: HotelRow): number => (r.star !== null ? 0 : r.fresh ? 1 : r.roster?.region === 'kanto' ? 2 : 3);

/** Every facility the page lists: the roster, the seen names it doesn't have (新しい施設), and any skip or priority
 *  entry matching neither. 探す: ★ first (in priority order), the new ones, 関東, the rest; then 除外中. */
export function hotelRows(d: Draft, seen: readonly string[], roster: readonly RosterHotel[] = ROSTER): { search: HotelRow[]; skipped: HotelRow[] } {
  const skipped = new Set(d.skip.map(normName));
  const rows = new Map<string, HotelRow>();
  const add = (name: string, r: RosterHotel | null, fresh: boolean) => {
    const key = normName(name);
    if (!key || rows.has(key)) return;
    rows.set(key, { key, name, roster: r, fresh, search: !skipped.has(key), star: null });
  };
  for (const r of roster) add(r.name, r, false);
  for (const n of seen) add(n, null, true);
  for (const n of d.skip) add(n, null, false);
  for (const p of d.priority) if (![...rows.keys()].some((k) => names(k, p))) add(p, null, false);
  const all = [...rows.values()].map((r) => ({ ...r, star: r.search ? starOf(r.key, d.priority) : null }));
  const search = all.map((r, i) => ({ r, i })).filter(({ r }) => r.search)
    .sort((a, b) => GROUP(a.r) - GROUP(b.r) || (a.r.star ?? 0) - (b.r.star ?? 0) || a.i - b.i).map(({ r }) => r);
  return { search, skipped: all.filter((r) => !r.search) };
}

/** 探す ↔ 除外. Skipping a facility takes it out of the priority too (★ and 除外 never both). */
export function toggleSkip(d: Draft, name: string): Draft {
  const key = normName(name);
  if (d.skip.some((s) => normName(s) === key)) return { ...d, skip: d.skip.filter((s) => normName(s) !== key) };
  return { ...d, skip: [...d.skip, name], priority: d.priority.filter((p) => !names(key, p)) };
}

/** ★ on (last in the priority; a skipped one is searched again) or off (every entry matching it). */
export function toggleStar(d: Draft, name: string): Draft {
  const key = normName(name);
  if (starOf(key, d.priority) !== null) return { ...d, priority: d.priority.filter((p) => !names(key, p)) };
  return { ...d, priority: [...d.priority, name], skip: d.skip.filter((s) => normName(s) !== key) };
}

/** A facility's small line: 通年 · 10日前まで, and 名前未確認 / 新しい施設. */
export function hotelNote(r: HotelRow): string {
  const parts: string[] = [];
  if (r.roster?.kind) parts.push(t(`its.kind.${r.roster.kind}`));
  if (r.roster?.cutoff) parts.push(t('its.cutoff', { n: r.roster.cutoff }));
  if (r.fresh) parts.push(t('its.hotel.fresh'));
  else if (!r.roster || !r.roster.verified) parts.push(t('its.hotel.unverified'));
  return parts.join(' · ');
}

// ---- The verdict and the facts ----
export type Tone = 'good' | 'warn' | 'bad' | 'idle';
const TONE: Record<Verdict, Tone> = { healthy: 'good', starting: 'good', idle: 'idle', degraded: 'warn', late: 'warn', failing: 'bad', stopped: 'idle', off: 'idle' };

export function verdictView(s: ItsStatus): { tone: Tone; word: string; sentence: string } {
  return { tone: TONE[s.verdict], word: t(`its.verdict.${s.verdict}`), sentence: t(`its.reason.${s.reasons[0] ?? 'none'}`, { n: s.runner?.scanFailures ?? 0 }) };
}

/** Running, or about to: polled every 15 s while shown, else every minute. */
export const pollMs = (s: ItsStatus | null): number =>
  s && s.mode === 'on' && !s.settings.paused && ['healthy', 'starting', 'degraded', 'failing'].includes(s.verdict) ? 15_000 : 60_000;

/** `2時間10分`, `12分`, `40秒`. */
export function duration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return t('its.dur.s', { s });
  const m = Math.floor(s / 60);
  return m < 60 ? t('its.dur.m', { m }) : t('its.dur.hm', { h: Math.floor(m / 60), m: m % 60 });
}

const at = (ms: number | null, today: string): string => formatSyncTime(ms === null ? null : new Date(ms), today);

export interface Fact { id: string; label: string; value: string; href?: string }
/** The rows under the card. Without a report yet only 最終報告 (まだ); 最後の成功 only when it isn't the last scan,
 *  連続失敗 only when there are any, 起動 only when the dispatch failed. */
export function factRows(s: ItsStatus, today: string): Fact[] {
  const r = s.runner;
  const out: Fact[] = [];
  if (s.dispatch && !s.dispatch.ok) out.push({ id: 'dispatch', label: t('its.fact.dispatch'), value: t('its.fact.dispatchFailed', { status: s.dispatch.status ?? '—' }) });
  if (!r) return [...out, { id: 'report', label: t('its.fact.report'), value: at(null, today) }];
  const live = s.now - r.lastSeen < LATE_AFTER_SEC * 1000 && r.phase !== 'stopping';
  out.push(
    { id: 'phase', label: t('its.fact.phase'), value: live ? t(`its.phase.${r.phase}`) : t('its.phase.ended') },
    { id: 'uptime', label: t('its.fact.uptime'), value: t('its.fact.since', { time: at(r.startedAt, today), dur: duration((live ? s.now : r.lastSeen) - r.startedAt) }) },
    { id: 'report', label: t('its.fact.report'), value: at(r.lastSeen, today) },
    { id: 'scan', label: t('its.fact.scan'), value: r.lastScanAt === null ? at(null, today) : t('its.fact.scans', { time: at(r.lastScanAt, today), n: r.scans }) }
  );
  if (r.lastOkAt !== r.lastScanAt) out.push({ id: 'ok', label: t('its.fact.ok'), value: at(r.lastOkAt, today) });
  if (r.scanFailures > 0) out.push({ id: 'failures', label: t('its.fact.failures'), value: t('its.fact.failuresN', { n: r.scanFailures }) });
  const sv = r.solves;
  out.push({ id: 'solves', label: t('its.fact.solves'), value: sv.lastSecs === null ? t('its.fact.solvesN', sv) : t('its.fact.solvesLast', { ...sv, secs: sv.lastSecs }) });
  if (r.lastError) {
    const e = r.lastError;
    out.push({ id: 'error', label: t('its.fact.error'), value: `${[e.step, e.cls, e.status ? `HTTP ${e.status}` : ''].filter(Boolean).join(' · ')}（${at(e.at, today)}）` });
  }
  if (r.unsynced > 0) out.push({ id: 'unsynced', label: t('its.fact.unsynced'), value: t('its.fact.unsyncedN', { n: r.unsynced }) });
  if (r.runUrl?.startsWith('https://github.com/')) out.push({ id: 'run', label: t('its.fact.run'), value: `#${r.runId}`, href: r.runUrl });
  return out;
}

// ---- Bookings ----
type BookingState = 'action' | 'applying' | 'hold' | 'confirmed';
const STATE_ORDER: Record<BookingState, number> = { action: 0, applying: 1, hold: 2, confirmed: 3 };
const NEEDS = ['near_date', 'auto_off', 'no_mail', 'leg_failed', 'bookings_unsynced'];
const DAY_MS = 86_400_000;

export interface BookingRow { key: string; state: BookingState; date: string; hotel: string; label: string; detail: string }

/** 要対応 · 申込中 · 仮押さえ · 予約確定, one row a stay and facility still ahead: 要対応 for a failed leg or a
 *  human_needed event newer than any 予約確定 for it within the last 24 h (with why), else its furthest step. */
export function bookingRows(s: ItsStatus, today: string): BookingRow[] {
  const pairs = new Map<string, { date: string; hotel: string; entries: BookingEntry[]; need: ItsEvent | null }>();
  const pair = (date: string, hotel: string) => {
    const k = `${date}\n${normName(hotel)}`;
    let p = pairs.get(k);
    if (!p) pairs.set(k, (p = { date, hotel, entries: [], need: null }));
    return p;
  };
  for (const b of s.bookings) if (daysUntil(b.date, s.now) >= 0) pair(b.date, b.hotel).entries.push(b);
  for (const e of s.events) {
    if (e.kind !== 'human_needed' || !e.date || !e.hotel || daysUntil(e.date, s.now) < 0 || s.now - e.t > DAY_MS) continue;
    const p = pair(e.date, e.hotel);
    if (!p.need || e.t > p.need.t) p.need = e;
  }
  const rows: BookingRow[] = [];
  for (const [key, p] of pairs) {
    const latest = (k: BookingEntry['kind']) => p.entries.filter((b) => b.kind === k).reduce<BookingEntry | null>((m, b) => (m && m.at >= b.at ? m : b), null);
    const done = latest('confirmed'), failed = latest('failed'), applying = latest('confirming'), hold = latest('hold');
    const since = done?.at ?? -Infinity;
    const needAt = Math.max(p.need && p.need.t > since ? p.need.t : -Infinity, failed && failed.at > since && s.now - failed.at <= DAY_MS ? failed.at : -Infinity);
    let state: BookingState, detail: string;
    if (needAt > -Infinity) {
      state = 'action';
      const why = p.need && p.need.t === needAt ? p.need.detail ?? '' : 'leg_failed';
      detail = t(`its.need.${NEEDS.includes(why) ? why : 'other'}`);
    } else if (done) {
      state = 'confirmed';
      detail = done.number ? t('its.booking.number', { number: done.number }) : at(done.at, today);
    } else if (applying) {
      state = 'applying';
      detail = at(applying.at, today);
    } else if (hold) {
      state = 'hold';
      detail = t('its.booking.heldAt', { time: at(hold.at, today) });
    } else continue;
    rows.push({ key, state, date: p.date, hotel: p.hotel, label: t(`its.booking.${state}`), detail });
  }
  return rows.sort((a, b) => STATE_ORDER[a.state] - STATE_ORDER[b.state] || a.date.localeCompare(b.date) || a.hotel.localeCompare(b.hotel));
}

// ---- Recent events ----
const EVENTS_SHOWN = 10;
const RUN_DETAILS = ['schedule', 'dispatch', 'local', 'time_up', 'paused', 'no_dates', 'mode_off', 'ban', 'lease_lost', 'error'];

/** The last EVENTS_SHOWN events, newest first: the time, what happened, and for whom (a stay, a facility, why). */
export function eventLines(s: ItsStatus, today: string): { key: string; time: string; what: string; info: string; bad: boolean }[] {
  return s.events.slice(0, EVENTS_SHOWN).map((e) => {
    const d = e.detail ?? '';
    const why = e.kind === 'run_start' || e.kind === 'run_end' ? (RUN_DETAILS.includes(d) ? t(`its.run.${d}`) : d)
      : e.kind === 'human_needed' ? t(`its.need.${NEEDS.includes(d) ? d : 'other'}`)
      : e.kind === 'confirmed' && d ? t('its.booking.number', { number: d }) : d;
    const info = [e.date ? formatDate(e.date) : '', e.hotel ?? '', why].filter(Boolean).join(' · ');
    return { key: `${e.runId}:${e.seq}`, time: at(e.t, today), what: t(`its.ev.${e.kind}`), info, bad: ['ban', 'error', 'human_needed', 'solve_failed'].includes(e.kind) };
  });
}
