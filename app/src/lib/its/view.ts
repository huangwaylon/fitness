// ボット's 保養所 tab's view (docs/design.md "Bots"), so ItsPage stays thin: the draft the page edits and how
// it becomes a PUT /its/settings body, the stays (one at a time or a period's weekdays; each with its note and the
// facilities that can take it), the facilities (the roster, the names the runner has seen and the settings' lists,
// merged by normName, in groups; 探す = the allow-list `search`, the presets), the verdict card, the facts, the bookings
// that need a person (the hold's deadline, what to do) and the recent events. Pure but for t().
import {
  AUTO_CONFIRM_MIN_DAYS, GUESTS_MAX, GUESTS_MIN, HOLD_SEC, HUMAN_NEEDED_DETAILS, LATE_AFTER_SEC, MAX_DATES, MAX_DAYS_AHEAD, MAX_NAME, daysUntil, isDate, normName, tokyoToday,
  type BookingEntry, type IntervalSec, type ItsEvent, type ItsSettings, type ItsSettingsInput, type ItsStatus, type LastError, type Member, type ScanEntry, type ScanMinute, type Verdict
} from './contract.ts';
import { D4, ROSTER, SUMMER_LAST, WINTER_FIRST, WINTER_LAST, type Region, type RosterHotel } from '#lib/its/roster.ts';
import { t } from '#lib/i18n/index.ts';
import { formatDate, formatSyncTime, monthLabel } from '#lib/i18n/format.ts';
import '#lib/i18n/its.ts';
import { bucket, gridStarts, hhmm, stripTicks, type CellState, type StripCell, type StripTick } from '#lib/strip.ts';

// ---- The draft ----
/** What the page edits (paused is 開始 / 停止's, at once). */
export interface Draft {
  intervalSec: IntervalSec;
  dates: string[];
  guests: number;
  /** The allow-list: the facilities searched (a name in `skip` too is not). */
  search: string[];
  skip: string[];
  priority: string[];
  autoConfirm: boolean;
}

/** The saved settings carry no allow-list (a Worker from before it): every facility not skipped was searched. */
export const legacy = (s: ItsSettings): boolean => !Array.isArray(s.search);

/** The saved settings as a draft. Without an allow-list (legacy) it is derived: the roster and the names seen, less
 *  the skipped (what that Worker searched), so 保存 keeps today's facilities and stops taking new ones unasked. */
export function draftOf(s: ItsSettings, seen: readonly string[] = [], roster: readonly RosterHotel[] = ROSTER): Draft {
  const skipped = new Set(s.skip.map(normName));
  const search = legacy(s) ? uniq([...roster.map((r) => r.name), ...seen]).filter((n) => !skipped.has(normName(n))) : [...s.search!];
  return { intervalSec: s.intervalSec, dates: [...s.dates], guests: s.guests, search, skip: [...s.skip], priority: [...s.priority], autoConfirm: s.autoConfirm };
}

/** Names unique by normName, the first spelling kept. */
function uniq(xs: readonly string[]): string[] {
  const seen = new Set<string>();
  return xs.filter((x) => {
    const k = normName(x);
    return k !== '' && !seen.has(k) && (seen.add(k), true);
  });
}

const sortedNorm = (xs: string[]) => [...new Set(xs.map(normName))].sort().join('\n');
/** The same settings: dates, skips and the allow-list as sets (names by normName), priority in its order. */
export function sameDraft(a: Draft, b: Draft): boolean {
  return a.intervalSec === b.intervalSec && a.guests === b.guests && a.autoConfirm === b.autoConfirm
    && [...new Set(a.dates)].sort().join() === [...new Set(b.dates)].sort().join()
    && sortedNorm(a.skip) === sortedNorm(b.skip) && sortedNorm(a.search) === sortedNorm(b.search)
    && a.priority.map(normName).join('\n') === b.priority.map(normName).join('\n');
}

/** The PUT body: dates sorted, any that passed while the draft was open dropped (the Worker refuses those); the
 *  allow-list less the skipped (skipping wins). */
export function toInput(d: Draft, baseUpdatedAt: number | null, now: number): ItsSettingsInput & { search: string[] } {
  const dates = [...new Set(d.dates)].filter((x) => daysUntil(x, now) >= 0).sort();
  const skipped = new Set(d.skip.map(normName));
  return {
    intervalSec: d.intervalSec, dates, guests: Math.min(GUESTS_MAX, Math.max(GUESTS_MIN, d.guests)), search: uniq(d.search).filter((n) => !skipped.has(normName(n))),
    skip: [...d.skip], priority: [...d.priority], autoConfirm: d.autoConfirm, baseUpdatedAt
  };
}

// ---- The stays ----
/** The date fields' bounds: tonight in Tokyo to MAX_DAYS_AHEAD days on. */
export function dateBounds(now: number): { min: string; max: string } {
  const min = tokyoToday(now);
  return { min, max: new Date(Date.parse(min) + MAX_DAYS_AHEAD * 86_400_000).toISOString().slice(0, 10) };
}

type AddWhy = 'bad' | 'past' | 'far' | 'dup' | 'full';
/** A date added, or why not. */
export function addDate(d: Draft, date: string, now: number): { ok: true; draft: Draft } | { ok: false; why: AddWhy } {
  if (!isDate(date)) return { ok: false, why: 'bad' };
  const n = daysUntil(date, now);
  if (n < 0) return { ok: false, why: 'past' };
  if (n > MAX_DAYS_AHEAD) return { ok: false, why: 'far' };
  // a stay already past in Tokyo is hidden and never sent (toInput): it doesn't count, and goes from the draft here
  const live = d.dates.filter((x) => daysUntil(x, now) >= 0);
  if (live.includes(date)) return { ok: false, why: 'dup' };
  if (live.length >= MAX_DATES) return { ok: false, why: 'full' };
  return { ok: true, draft: { ...d, dates: [...live, date].sort() } };
}

export const removeDate = (d: Draft, date: string): Draft => ({ ...d, dates: d.dates.filter((x) => x !== date) });

/** 0 = 日 … 6 = 土, of a YYYY-MM-DD. */
export const weekday = (date: string): number => new Date(`${date}T00:00:00Z`).getUTCDay();

/** まとめて追加: the nights from `from` to `to` (either order) on the chosen weekdays (0 = 日), from tonight to
 *  MAX_DAYS_AHEAD, less those already listed; `add` stops at MAX_DATES (`over`: how many didn't fit). */
export function bulkDates(d: Draft, from: string, to: string, days: readonly number[], now: number): { add: string[]; over: number } {
  if (!isDate(from) || !isDate(to)) return { add: [], over: 0 };
  const [a, b] = from <= to ? [from, to] : [to, from];
  const live = d.dates.filter((x) => daysUntil(x, now) >= 0);
  const all: string[] = [];
  for (let ms = Date.parse(a), end = Date.parse(b); ms <= end && all.length <= MAX_DAYS_AHEAD; ms += 86_400_000) {
    const date = new Date(ms).toISOString().slice(0, 10);
    const n = daysUntil(date, now);
    if (n >= 0 && n <= MAX_DAYS_AHEAD && days.includes(weekday(date)) && !live.includes(date)) all.push(date);
  }
  const room = Math.max(0, MAX_DATES - live.length);
  return { add: all.slice(0, room), over: Math.max(0, all.length - room) };
}

/** The draft with these dates added (past ones let go, as addDate). */
export const addDates = (d: Draft, dates: readonly string[], now: number): Draft =>
  ({ ...d, dates: [...new Set([...d.dates.filter((x) => daysUntil(x, now) >= 0), ...dates])].sort() });

/** A facility can take a stay: searched, on a roster (or new: the site offered it), the stay at least its cutoff away
 *  (D4 for one the roster doesn't know), in its season: 夏季 up to SUMMER_LAST, 冬季 from WINTER_FIRST to WINTER_LAST,
 *  夏季・冬季 either (not the gap between). */
function canTake(r: HotelRow, date: string, days: number): boolean {
  if (!r.search) return false;
  if (r.roster && r.roster.kind === null) return false;
  if (days < (r.roster?.cutoff ?? D4)) return false;
  const md = date.slice(5), summer = md <= SUMMER_LAST, winter = md >= WINTER_FIRST || md <= WINTER_LAST;
  const kind = r.roster?.kind;
  return kind === 'summer' ? summer : kind === 'winter' ? winter : kind === 'both' ? summer || winter : true;
}

/** A stay's note: 自動で確定 (on, and AUTO_CONFIRM_MIN_DAYS+ away), only the D−4 facilities (under 10 days), past
 *  every cutoff (under 4), or none; 予約済み once one is 予約確定 (「探していません」 only when `stops`: the runner
 *  reporting is one that stops looking for it, stopsAtBooked). A stay already past in Tokyo isn't listed (保存 drops it:
 *  toInput). `able`: the searched facilities that can take it. */
type DateNote = 'auto' | 'd4' | 'late' | 'booked' | null;
export interface DateRow { date: string; label: string; days: number; note: DateNote; text: string; able: string[] }
export function dateRows(d: Draft, now: number, hotels: readonly HotelRow[] = [], bookings: readonly BookingEntry[] = [], stops = true): DateRow[] {
  const booked = new Set(bookings.filter((b) => b.kind === 'confirmed').map((b) => b.date));
  return [...new Set(d.dates)].sort().map((date) => ({ date, days: daysUntil(date, now) })).filter((r) => r.days >= 0).map(({ date, days }) => {
    const note: DateNote = booked.has(date) ? 'booked' : days < 4 ? 'late' : days < 10 ? 'd4' : d.autoConfirm && days >= AUTO_CONFIRM_MIN_DAYS ? 'auto' : null;
    const left = days === 0 ? t('its.date.tonight') : t('its.date.left', { n: days });
    const able = note === 'booked' ? [] : hotels.filter((h) => canTake(h, date, days)).map((h) => h.name);
    const said = note === 'booked' && !stops ? 'bookedOnly' : note;
    return { date, label: formatDate(date), days, note, text: said ? `${left} · ${t(`its.date.note.${said}`)}` : left, able };
  });
}

/** The stays under month headings (2026年11月). */
export function dateMonths(rows: readonly DateRow[]): { month: string; label: string; rows: DateRow[] }[] {
  const out: { month: string; label: string; rows: DateRow[] }[] = [];
  for (const r of rows) {
    const month = r.date.slice(0, 7);
    if (out.at(-1)?.month !== month) out.push({ month, label: monthLabel(r.date, { long: true }), rows: [] });
    out.at(-1)!.rows.push(r);
  }
  return out;
}

// ---- The facilities ----
export type Group = Region | 'new';
const GROUPS: readonly Group[] = ['kanto', 'near', 'far', 'new'];

export interface HotelRow {
  /** normName(name): the row's identity. */
  key: string;
  name: string;
  roster: RosterHotel | null;
  group: Group;
  /** Offered by the site but on no roster here (a new facility, or a spelling the roster doesn't have). */
  fresh: boolean;
  /** In the allow-list and not skipped: the runner may book it. */
  search: boolean;
  /** Neither searched nor skipped: offered since the allow-list was saved, nobody decided yet (新しい施設：○○). */
  undecided: boolean;
  /** Its place in the priority (0 = tried first), or null. */
  star: number | null;
  /** The other spelling of what may be the same facility (an unverified roster name and a site name, one inside the
   *  other after normName): 探す on one doesn't cover the other (the lists match exactly). */
  similar: string | null;
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

/** Every facility the page lists, in a stable order (a switch never moves a row): the roster by group (関東, 近郊,
 *  遠方), then 新しい施設: the seen names it doesn't have and any listed entry (the draft's, and the saved settings' so
 *  one let go in the draft stays listed) matching neither. An unverified roster name and a seen name, one inside the
 *  other, note each other (`similar`). */
export function hotelRows(d: Draft, seen: readonly string[], saved: Pick<Draft, 'skip' | 'priority'> & { search?: string[] } | null = null, roster: readonly RosterHotel[] = ROSTER): HotelRow[] {
  const skipped = new Set(d.skip.map(normName));
  const searched = new Set(d.search.map(normName));
  const rows = new Map<string, HotelRow>();
  const add = (name: string, r: RosterHotel | null, fresh: boolean) => {
    const key = normName(name);
    if (!key || rows.has(key)) return;
    const search = searched.has(key) && !skipped.has(key);
    rows.set(key, { key, name, roster: r, group: r?.region ?? 'new', fresh, search, undecided: !search && !skipped.has(key), star: null, similar: null });
  };
  for (const r of roster) add(r.name, r, false);
  for (const n of seen) add(n, null, true);
  for (const n of [...d.search, ...d.skip, ...(saved?.search ?? []), ...(saved?.skip ?? [])]) add(n, null, false);
  for (const p of [...d.priority, ...(saved?.priority ?? [])]) {
    let named = false;
    for (const k of rows.keys()) if ((named = names(k, p))) break;
    if (!named) add(p, null, false);
  }
  const all = [...rows.values()];
  const unverified = all.filter((r) => r.roster && !r.roster.verified);
  for (const r of all) {
    r.star = r.search ? starOf(r.key, d.priority) : null;
    const u = r.fresh ? unverified.find((x) => !x.similar && (x.key.includes(r.key) || r.key.includes(x.key))) : undefined;
    if (u) [r.similar, u.similar] = [u.name, r.name];
  }
  return GROUPS.flatMap((g) => all.filter((r) => r.group === g));
}

/** The rows by group, those whose name holds the filter (normName, so ｶﾅ and spaces don't matter); empty groups left out. */
export function hotelGroups(rows: readonly HotelRow[], filter = ''): { id: Group; label: string; rows: HotelRow[]; on: number }[] {
  const f = normName(filter);
  return GROUPS.map((id) => {
    const g = rows.filter((r) => r.group === id);
    return { id, label: t(`its.group.${id}`), rows: f ? g.filter((r) => r.key.includes(f)) : g, on: g.filter((r) => r.search).length };
  }).filter((g) => g.rows.length);
}

/** Searched (on) or not (off), a facility at a time: off skips it and takes it out of the priority (★ and off never
 *  both); on lists it and un-skips it. */
export function setSearch(d: Draft, names_: readonly string[], on: boolean): Draft {
  const keys = new Set(names_.map(normName));
  const search = d.search.filter((s) => !keys.has(normName(s)));
  const skip = d.skip.filter((s) => !keys.has(normName(s)));
  return on
    ? { ...d, search: [...search, ...names_], skip }
    : { ...d, search, skip: [...skip, ...names_], priority: d.priority.filter((p) => ![...keys].some((k) => names(k, p))) };
}
export const toggleSearch = (d: Draft, r: Pick<HotelRow, 'name' | 'search'>): Draft => setSearch(d, [r.name], !r.search);

/** The presets: 関東だけ, 近郊まで (関東 and 近郊), 直営だけ, 全部 (every row, the new ones too, never a delisted one). */
export type Preset = 'kanto' | 'near' | 'direct' | 'all';
export const PRESETS: readonly Preset[] = ['kanto', 'near', 'direct', 'all'];
/** On no roster any more (スキージャム勝山: kept so a re-contract can't book it unseen): no preset or 全部探す turns it on,
 *  only its own switch. */
export const delisted = (r: HotelRow): boolean => !!r.roster && r.roster.kind === null;
const inPreset = (p: Preset, r: HotelRow): boolean =>
  !delisted(r) && (p === 'all' || (!!r.roster?.kind && (p === 'direct' ? r.roster.kind === 'direct' : r.group === 'kanto' || (p === 'near' && r.group === 'near'))));

/** A preset applied: its facilities searched, every other listed one off. */
export function applyPreset(d: Draft, rows: readonly HotelRow[], p: Preset): Draft {
  return setSearch(setSearch(d, rows.filter((r) => !inPreset(p, r)).map((r) => r.name), false), rows.filter((r) => inPreset(p, r)).map((r) => r.name), true);
}
/** The preset the draft is now (exactly its facilities searched), or null. */
export const presetOf = (rows: readonly HotelRow[]): Preset | null => PRESETS.find((p) => rows.every((r) => r.search === inPreset(p, r))) ?? null;

/** A priority entry for a facility: its name, or (a site's name may run to MAX_SITE_NAME) its first MAX_NAME UTF-16
 *  units, whole code points, still naming it (a substring, as the runner matches). */
function priorityEntry(name: string, key: string): string {
  if (name.length <= MAX_NAME) return name;
  let cut = '';
  for (const c of name) { if (cut.length + c.length > MAX_NAME) break; cut += c; }
  while (cut && !names(key, cut)) cut = [...cut].slice(0, -1).join('');
  return cut.trim();
}

/** ★ on (last in the priority; one not searched is searched) or off (every entry matching it). */
export function toggleStar(d: Draft, name: string): Draft {
  const key = normName(name);
  if (starOf(key, d.priority) !== null) return { ...d, priority: d.priority.filter((p) => !names(key, p)) };
  return { ...setSearch(d, [name], true), priority: [...d.priority, priorityEntry(name, key)] };
}

/** A facility's small line: 通年 · 10日前まで, and 名前未確認 / 新しい施設. */
export function hotelNote(r: HotelRow): string {
  const parts: string[] = [];
  if (r.roster?.kind) parts.push(t(`its.kind.${r.roster.kind}`));
  if (r.roster?.cutoff) parts.push(t('its.cutoff', { n: r.roster.cutoff }));
  if (r.fresh) parts.push(t('its.hotel.fresh'));
  else if (!r.roster || !r.roster.verified) parts.push(t('its.hotel.unverified'));
  if (r.similar) parts.push(t('its.hotel.similar', { name: r.similar }));
  return parts.join(' · ');
}

// ---- The verdict and the facts ----
export type Tone = 'good' | 'warn' | 'bad' | 'idle';
const TONE: Record<Verdict, Tone> = { healthy: 'good', starting: 'good', idle: 'idle', degraded: 'warn', late: 'warn', failing: 'bad', stopped: 'idle', off: 'idle' };

/** The card: its tone, word and sentence (遅れ: how long nothing was heard). */
export function verdictView(s: ItsStatus): { tone: Tone; word: string; sentence: string } {
  const why = s.reasons[0] ?? 'none';
  const sentence = why === 'runner_silent' && s.runner ? t('its.reason.silentFor', { dur: duration(s.now - s.runner.lastSeen) })
    : t(`its.reason.${why}`, { n: s.runner?.scanFailures ?? 0 });
  return { tone: TONE[s.verdict], word: t(`its.verdict.${s.verdict}`), sentence };
}

/** The state in one word: 要対応 (coral) while a booking waits for a person, else the verdict's word and tone. */
export function rowBadge(s: ItsStatus): { tone: Tone; word: string } {
  if (bookingRows(s, tokyoToday(s.now), s.now).some((b) => b.state === 'action')) return { tone: 'bad', word: t('its.booking.action') };
  return { tone: TONE[s.verdict], word: t(`its.verdict.${s.verdict}`) };
}

/** The runner reporting is one that applies the allow-list and stops at a booked night (its report carries
 *  settingsAt, or it sent its reads: the round-2 runner); an older one searched every facility not skipped and kept on
 *  after a 予約確定, so the page claims neither for it. */
export const stopsAtBooked = (s: ItsStatus): boolean => (!!s.runner && s.runner.settingsAt !== undefined) || (s.recentScans?.length ?? 0) > 0;

/** 施設's line: what happens to a room (held; applied for, ★ first, with 自動で確定; else from the mail), and, from a
 *  runner that does, that a booked night is searched no more. */
export const hotelHint = (autoConfirm: boolean, stops: boolean): string =>
  t(!autoConfirm ? 'its.hotel.hintMail' : stops ? 'its.hotel.hint' : 'its.hotel.hintAuto');

/** ボット's dot (the menu's pill, the 保養所 tab): a hold waiting for a person (要対応), 不調 or 遅れ. */
export const needsAttention = (s: ItsStatus): boolean => rowBadge(s).tone === 'bad' || s.verdict === 'late';

/** Running, or about to: polled every 15 s while shown, else every minute. */
export const pollMs = (s: ItsStatus | null): number =>
  s && s.mode === 'on' && !s.settings.paused && ['healthy', 'starting', 'degraded', 'failing'].includes(s.verdict) ? 15_000 : 60_000;

/** The Worker's refusals of a 保存 the page can word (the contract's SettingsError, a too large body, this phone's key). */
const SAVE_ERRORS = ['bad_date', 'past_date', 'far_date', 'too_many_dates', 'bad_guests', 'bad_hotels', 'too_large', 'unauthorized'];
/** Why 保存 failed, in words: a refusal the page can name, else 「もう一度保存してください」. */
export const saveError = (err: string): string => t(`its.saveWhy.${SAVE_ERRORS.includes(err) ? err : 'other'}`);

/** The page's last line: the mode (稼働 / オフ), the build, and when the status was read. */
export const footLine = (s: ItsStatus, today: string): string =>
  [t(`its.mode.${s.mode}`), s.sha?.slice(0, 7), t('its.updated', { time: at(s.now, today) })].filter(Boolean).join(' · ');

/** Who pressed 開始 / 停止 last, and when: 「停止（うめ・12:03）」 (`name`: a member's name), or null (none recorded). */
export const controlLine = (s: ItsStatus, name: (m: Member) => string, today: string): string | null =>
  s.control ? t('its.ctl.by', { action: t(`its.ctl.${s.control.action}`), who: name(s.control.by), time: at(s.control.at, today) }) : null;

/** Who saved the settings last, and when: 「設定の変更：うめ・12:03」, or null (never saved). */
export const savedLine = (s: ItsStatus, name: (m: Member) => string, today: string): string | null =>
  s.settings.updatedBy && s.settings.updatedAt !== null ? t('its.savedBy', { who: name(s.settings.updatedBy), time: at(s.settings.updatedAt, today) }) : null;

/** `2時間10分`, `12分`, `40秒`. */
export function duration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return t('its.dur.s', { s });
  const m = Math.floor(s / 60);
  return m < 60 ? t('its.dur.m', { m }) : t('its.dur.hm', { h: Math.floor(m / 60), m: m % 60 });
}

const at = (ms: number | null, today: string): string => formatSyncTime(ms === null ? null : new Date(ms), today);

const STEPS = ['calendar', 'scan', 'empty_create', 'solve', 'imap', 'worker', 'bookings', 'hold'];
const CLASSES = ['timeout', 'transport', 'session_dead', 'ban', 'no_token', 'unsolved', 'no_calendar', 'record_full', 'id_conflict', 'auth_failed',
  'web_login_required', 'submit_unknown', 'no_completion', 'hold_expired', 'room_taken', 'bad_booking', 'no_credentials', 'ssl'];
/** The mailbox's failures as the runner names them (its exception's class lower-cased, an older runner's
 *  login_rejected): the class they are. */
const CLASS_OF: Record<string, string> = {
  login_rejected: 'auth_failed', timeouterror: 'timeout', sockettimeout: 'timeout', gaierror: 'transport', oserror: 'transport',
  connectionrefusederror: 'transport', connectionreseterror: 'transport', connectionabortederror: 'transport', sslerror: 'ssl', sslcertverificationerror: 'ssl'
};
/** An error class or outcome code in words (時間切れ, サイトの応答 503), else as it is. */
function clsText(code: string): string {
  const cls = CLASS_OF[code] ?? code;
  const http = /^http_(\d{3})$/.exec(cls);
  return http ? t('its.cls.http', { n: http[1] }) : CLASSES.includes(cls) ? t(`its.cls.${cls}`) : cls.startsWith('chrome_') ? t('its.cls.chrome') : code;
}
/** The last error in words: 「空室の確認 · 時間切れ」 (a code the page doesn't know stays as it is). */
export function errorText(e: LastError): string {
  const step = e.step.startsWith('calendar_') ? 'calendar' : /^step\d/.test(e.step) ? 'hold' : e.step;
  return [STEPS.includes(step) ? t(`its.step.${step}`) : e.step, clsText(e.cls)].join(' · ');
}

export interface Fact { id: string; label: string; value: string; href?: string; more?: boolean }
/** The rows under the card: 状態, 最終確認 and 実行 shown, the rest (`more`) folded under くわしく. Without a report yet
 *  only 最終報告 (まだ); 最後の成功 only when it isn't the last scan, 連続失敗 only when there are any, 起動 only when the
 *  dispatch failed. */
export function factRows(s: ItsStatus, today: string): Fact[] {
  const r = s.runner;
  const out: Fact[] = [];
  if (s.dispatch && !s.dispatch.ok) out.push({ id: 'dispatch', label: t('its.fact.dispatch'), value: t('its.fact.dispatchFailed', { status: s.dispatch.status ?? '—' }) });
  if (!r) return [...out, { id: 'report', label: t('its.fact.report'), value: at(null, today) }];
  const live = s.now - r.lastSeen < LATE_AFTER_SEC * 1000 && r.phase !== 'stopping';
  out.push(
    { id: 'phase', label: t('its.fact.phase'), value: live ? t(`its.phase.${r.phase}`) : t('its.phase.ended') },
    { id: 'scan', label: t('its.fact.scan'), value: r.lastScanAt === null ? at(null, today) : t('its.fact.scans', { time: at(r.lastScanAt, today), n: r.scans }) }
  );
  if (r.runUrl?.startsWith('https://github.com/')) out.push({ id: 'run', label: t('its.fact.run'), value: `#${r.runId}`, href: r.runUrl });
  const more: Fact[] = [
    { id: 'uptime', label: t('its.fact.uptime'), value: t('its.fact.since', { time: at(r.startedAt, today), dur: duration((live ? s.now : r.lastSeen) - r.startedAt) }) },
    { id: 'report', label: t('its.fact.report'), value: at(r.lastSeen, today) }
  ];
  if (r.lastOkAt !== r.lastScanAt) more.push({ id: 'ok', label: t('its.fact.ok'), value: at(r.lastOkAt, today) });
  if (r.scanFailures > 0) more.push({ id: 'failures', label: t('its.fact.failures'), value: t('its.fact.failuresN', { n: r.scanFailures }) });
  const sv = r.solves;
  more.push({ id: 'solves', label: t('its.fact.solves'), value: sv.lastSecs === null ? t('its.fact.solvesN', sv) : t('its.fact.solvesLast', { ...sv, secs: sv.lastSecs }) });
  if (r.lastError) more.push({ id: 'error', label: t('its.fact.error'), value: `${errorText(r.lastError)}（${at(r.lastError.at, today)}）` });
  if (r.unsynced > 0) more.push({ id: 'unsynced', label: t('its.fact.unsynced'), value: t('its.fact.unsyncedN', { n: r.unsynced }) });
  return [...out, ...more.map((f) => ({ ...f, more: true }))];
}

// ---- Bookings ----
type BookingState = 'action' | 'applying' | 'hold' | 'confirmed' | 'lapsed';
const STATE_ORDER: Record<BookingState, number> = { action: 0, applying: 1, hold: 2, confirmed: 3, lapsed: 4 };
/** The human_needed codes the page words: the runner's (the contract's list, the push's too) and an older runner's. */
const NEEDS = [...HUMAN_NEEDED_DETAILS, 'leg_failed', 'bookings_unsynced', 'queue_failed'];
/** Why a person must finish the mail's 申込 (the runner held it but didn't apply). */
const BY_MAIL = ['near_date', 'auto_off', 'not_wanted', 'lease_stale', 'confirming_unacked', 'unmapped', 'fill_rejected', 'browser_busy', 'queue_failed', 'run_ended'];
/** A human_needed detail as the page words it: the code (an older runner's 「unmapped: 事業所名」 or 「leg_room_taken」
 *  read as its code), `other` when unknown. */
export function needOf(detail: string): string {
  const head = detail.split(':')[0].trim();
  const code = NEEDS.includes(head) ? head : head.startsWith('leg_') && NEEDS.includes(head.slice(4)) ? head.slice(4) : head;
  return NEEDS.includes(code) ? code : 'other';
}
const DAY_MS = 86_400_000;

export interface BookingRow {
  key: string; state: BookingState; date: string; hotel: string; label: string; detail: string;
  /** A live hold's time left (「あと18分ごろで無効」) or 「期限切れ」; null without one. */
  left: string | null;
  expired: boolean;
  /** What to do, a line a step (the mail, that doing nothing costs nothing, a near stay's paid cancellation). */
  steps: string[];
}

/** 要対応 · 申込中 · 仮押さえ · 予約確定, one row a stay and facility still ahead: 要対応 for a failed leg or a
 *  human_needed event newer than any 予約確定 for it within the last 24 h (with why), else its furthest step. A hold
 *  not yet applied for shows its deadline (its `at` + HOLD_SEC), and a 要対応 one to finish by mail, the steps. A
 *  second hold on a night already 予約確定 elsewhere, once lapsed, is quiet: 期限切れ (「確定済みの日・期限切れ」),
 *  nothing to do. */
export function bookingRows(s: ItsStatus, today: string, now: number = s.now): BookingRow[] {
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
  const confirmedNights = new Set(s.bookings.filter((b) => b.kind === 'confirmed').map((b) => b.date));
  const rows: BookingRow[] = [];
  for (const [key, p] of pairs) {
    const latest = (k: BookingEntry['kind']) => p.entries.filter((b) => b.kind === k).reduce<BookingEntry | null>((m, b) => (m && m.at >= b.at ? m : b), null);
    const done = latest('confirmed'), failed = latest('failed'), applying = latest('confirming'), hold = latest('hold');
    const since = done?.at ?? -Infinity;
    const needAt = Math.max(p.need && p.need.t > since ? p.need.t : -Infinity, failed && failed.at > since && s.now - failed.at <= DAY_MS ? failed.at : -Infinity);
    let state: BookingState, detail: string, why = '';
    if (needAt > -Infinity) {
      state = 'action';
      why = p.need && p.need.t === needAt ? needOf(p.need.detail ?? '') : 'leg_failed';
      detail = t(`its.need.${why}`);
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
    // a hold's deadline, while nothing came after it (applying, a number, a failure)
    const open = hold && !done && !(applying && applying.at >= hold.at) && !(failed && failed.at >= hold.at) && (state === 'hold' || BY_MAIL.includes(why));
    const end = open ? hold.at + HOLD_SEC * 1000 : null;
    const expired = end !== null && now >= end;
    if (expired && !done && confirmedNights.has(p.date)) {
      rows.push({ key, state: 'lapsed', date: p.date, hotel: p.hotel, label: t('its.booking.lapsed'), detail: t('its.booking.lapsedNight'), left: null, expired: true, steps: [] });
      continue;
    }
    const left = end === null ? null : expired ? t('its.hold.expired') : t('its.hold.left', { n: Math.max(1, Math.ceil((end - now) / 60_000)) });
    const steps = state === 'action' && end !== null && !expired
      ? [t('its.hold.mail', { hotel: p.hotel }), t('its.hold.free'), ...(daysUntil(p.date, now) < 10 ? [t('its.hold.paid')] : [])]
      : [];
    rows.push({ key, state, date: p.date, hotel: p.hotel, label: t(`its.booking.${state}`), detail, left, expired, steps });
  }
  return rows.sort((a, b) => STATE_ORDER[a.state] - STATE_ORDER[b.state] || a.date.localeCompare(b.date) || a.hotel.localeCompare(b.hotel));
}

// ---- 直近1時間: the scans a minute at a time (the shared strip: lib/strip.ts) ----
export interface ScanCell { t: number; time: string; n: number; fails: number; avail: number; state: CellState; text: string }
const MIN_MS = 60_000;
const STRIP_MIN = 60;

/** One cell: its state (red when any read failed, else yellow when any saw a room, else green; none read empty) and
 *  its line 「15:32 · 4回 · 失敗1（timeout） · 空きあり1」 (`dates`: a minute's aggregate says the most nights with a room
 *  in one read, 「空き2日」, instead of how many reads saw one). */
function cell(start: number, n: number, fails: number, avail: number, codes: readonly string[], dates?: number): ScanCell {
  const state: CellState = !n ? 'none' : fails ? 'fail' : avail ? 'avail' : 'ok';
  const parts = [hhmm(start), n ? t('its.scan.n', { n }) : t('its.scan.none')];
  if (fails) parts.push(codes.length ? t('its.scan.failsWhy', { n: fails, why: codes.join('・') }) : t('its.scan.fails', { n: fails }));
  if (avail) parts.push(dates === undefined ? t('its.scan.avail', { n: avail }) : t('its.scan.availDates', { n: dates }));
  return { t: start, time: hhmm(start), n, fails, avail, state, text: parts.join(' · ') };
}

/** The last STRIP_MIN Tokyo minutes up to `now`'s, oldest first, from the reads one by one (`recentScans`). (Tokyo is
 *  whole hours off UTC: its minutes are UTC's.) */
export function scanCells(scans: readonly ScanEntry[], now: number): ScanCell[] {
  const starts = gridStarts(now, MIN_MS, STRIP_MIN);
  return bucket(scans, (s) => s.t, starts[0], MIN_MS, STRIP_MIN).map((reads, i) => {
    const codes = [...new Set(reads.flatMap((s) => (!s.ok && s.code ? [s.code] : [])))];
    return cell(starts[i], reads.length, reads.filter((s) => !s.ok).length, reads.filter((s) => s.avail > 0).length, codes);
  });
}

/** The same strip from the Worker's per-minute aggregate (`recentMinutes`: every read of the hour, however many runs);
 *  a minute's `avail` counts as one minute with a room. */
export function minuteCells(minutes: readonly ScanMinute[], now: number): ScanCell[] {
  const by = new Map(minutes.map((m) => [Math.floor(m.minute / MIN_MS) * MIN_MS, m]));
  return gridStarts(now, MIN_MS, STRIP_MIN).map((start) => {
    const m = by.get(start);
    return m ? cell(start, m.n, m.fail, m.avail > 0 ? 1 : 0, Object.keys(m.codes ?? {}), m.avail) : cell(start, 0, 0, 0, []);
  });
}

/** The strip's one line for VoiceOver: 「直近1時間：確認238回、失敗2回、空きあり3回」 (`byMinute`: 「空きあり3分」). */
export function scanSummary(cells: readonly ScanCell[], byMinute = false): string {
  const sum = (k: 'n' | 'fails' | 'avail') => cells.reduce((a, c) => a + c[k], 0);
  return t(byMinute ? 'its.scan.summaryMin' : 'its.scan.summary', { n: sum('n'), fails: sum('fails'), avail: sum('avail') });
}

/** The cells as the shared strip draws them. */
export const stripCells = (cells: readonly ScanCell[]): StripCell[] => cells.map((c) => ({ start: c.t, end: c.t + MIN_MS, state: c.state, label: c.text }));

/** The ticks under it: each quarter hour (15:00 · 15:15 …), at its cell's index. */
export const scanTicks = (cells: readonly ScanCell[]): StripTick[] => stripTicks(stripCells(cells), 15 * MIN_MS);

// ---- Recent events ----
const EVENTS_SHOWN = 10;
const RUN_DETAILS = ['schedule', 'dispatch', 'local', 'time_up', 'paused', 'no_dates', 'mode_off', 'ban', 'lease_lost', 'error'];

/** The last EVENTS_SHOWN events, newest first: the time, what happened, and for whom (a stay, a facility, why). */
export function eventLines(s: ItsStatus, today: string): { key: string; time: string; what: string; info: string; bad: boolean }[] {
  return s.events.slice(0, EVENTS_SHOWN).map((e) => {
    const d = e.detail ?? '';
    const why = e.kind === 'run_start' || e.kind === 'run_end' ? (RUN_DETAILS.includes(d) ? t(`its.run.${d}`) : d)
      : e.kind === 'human_needed' ? t(`its.need.${needOf(d)}`)
      : e.kind === 'error' && d.startsWith('imap_') ? `${t('its.step.imap')} · ${clsText(d.slice(5))}`
      : e.kind === 'error' && CLASSES.includes(d) ? clsText(d)
      : e.kind === 'confirmed' && d ? t('its.booking.number', { number: d }) : d;
    const info = [e.date ? formatDate(e.date) : '', e.hotel ?? '', why].filter(Boolean).join(' · ');
    return { key: `${e.runId}:${e.seq}`, time: at(e.t, today), what: t(`its.ev.${e.kind}`), info, bad: ['ban', 'error', 'human_needed', 'solve_failed', 'prev_unclean'].includes(e.kind) };
  });
}
