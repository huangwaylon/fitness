// All user-facing text (Japanese) and message formatting.
// LINE shows text as typed (no Markdown), so lists use `・` and a card's first line is its bold title.
import { DAYS_TO_CHECK, DEFAULT_WINDOW } from './config.ts';
import { PROGRAMS, slotEnd, type Slot } from './hacomono.ts';
import { ANY, SKIP, defaultDays, type Rule, type Store } from './store.ts';
import { clockOf, dayOf, weekday, type Clock, type Day } from './time.ts';
import { DAYS_SHOWN, type ChangeKind, type StatusDay } from '../../app/src/lib/gym/contract.ts';

const WEEKDAYS = '月火水木金土日';

// Button labels (LINE allows 20 characters)
export const MENU = '⚙️ メニュー';
export const SET_DAY = '🗓️ 設定を変える';
export const SHOW_STATUS = '📋 設定を見る';
export const CHECK_NOW = '🔎 今すぐ確認';
export const CHECK_SETTINGS = '🔧 チェック設定';
export const HELP = '❓ 使い方';
export const ANY_LABEL = '🔔 終日';
export const SKIP_LABEL = '🔕 通知オフ';
export const RANGE = '⏰ 時間指定';
export const RANGE_END = '⏰ 終わりの時刻を選ぶ';
export const CHECK_FROM = '⏳ チェック開始';
export const CLEAR_CHECK_FROM = '🗑️ チェック開始を解除';
export const RESET = '🧹 リセット';
export const PAUSE = '⏸️ チェックを止める';
export const RESUME = '▶️ チェックを再開';
/** After the interval in use. */
export const CURRENT = '（いま）';

const RESUME_HINT = `「${CHECK_SETTINGS}」から再開できます。`;
export const CHECK_PAUSED = `⏸️ チェックは停止中です。${RESUME_HINT}`;

// --- building blocks ---

/** `10/5（月）` */
export function dayLabel(day: Day): string {
  return `${Number(day.slice(5, 7))}/${Number(day.slice(8, 10))}（${WEEKDAYS[weekday(day)]}）`;
}

/** `12:00〜13:00`, from clock times or instants. */
export function timeRange(start: Clock | number, end: Clock | number): string {
  const clock = (t: Clock | number): Clock => (typeof t === 'number' ? clockOf(t) : t);
  return `${clock(start)}〜${clock(end)}`;
}

/** A day's rule in a few words (undefined = not checked yet). */
export function ruleLabel(rule: Rule | undefined): string {
  if (rule === ANY) return ANY_LABEL;
  if (rule === SKIP) return SKIP_LABEL;
  if (rule === undefined) return `💤 まだチェックしない（${DAYS_TO_CHECK - 1}日前から自動で${timeRange(...DEFAULT_WINDOW)}をチェック）`;
  return `⏰ ${timeRange(...rule)}`;
}

/** After the default days' rule (nothing saved): the usual, which 🧹 goes back to. */
const USUAL = '（ふだん）';

/** A day's setting in its two parts: the rule (marked when it's the default) and when checking starts, if set. */
function daySettingParts(store: Store, day: Day, today: Day): [rule: string, from: string | null] {
  const rule = store.effectiveRule(day, today);
  const label = ruleLabel(rule) + (rule !== undefined && store.rule(day) === undefined ? USUAL : '');
  const checkFrom = store.checkFrom(day);
  if (checkFrom === undefined) return [label, null];
  const when = dayOf(checkFrom) === day ? clockOf(checkFrom) : `${dayLabel(dayOf(checkFrom))}${clockOf(checkFrom)}`;
  return [label, `⏳ ${when}から`];
}

const joinSetting = (rule: string, from: string | null): string => (from === null ? rule : `${rule}　${from}`);

/** A day's full setting: its rule (marked when it's the default), plus when checking starts if that's set. */
export function daySetting(store: Store, day: Day, today: Day): string {
  return joinSetting(...daySettingParts(store, day, today));
}

/** Slots grouped under a date heading, one line per time listing every program open then. */
export function slotLines(slots: Iterable<Slot>): string[] {
  const ordered = [...slots].sort(
    (a, b) => a.start - b.start || PROGRAMS.indexOf(a.program) - PROGRAMS.indexOf(b.program),
  );
  const lines: string[] = [];
  let day: Day | undefined;
  for (let i = 0; i < ordered.length; ) {
    const first = ordered[i]!;
    let j = i;
    while (j < ordered.length && ordered[j]!.start === first.start) j++;
    if (dayOf(first.start) !== day) {
      day = dayOf(first.start);
      lines.push(dayLabel(day));
    }
    const programs = ordered.slice(i, j).map((s) => s.program.label).join('・');
    lines.push(`・${timeRange(first.start, slotEnd(first))}　${programs}`);
    i = j;
  }
  return lines;
}

// --- the menu and help ---

/** The menu card's text, with a notice while checks are stopped. */
export function panelText(paused: boolean): string {
  const text = `🏋️ ジムの空き枠お知らせ
ELEMENT 戸越銀座店で予約の空きが出たら、ここでお知らせします。
${PROGRAMS.map((p) => p.label).join('・')}（トレーナー指名なし）
下のボタンで、日ごとに通知の設定を変えられます。`;
  return paused ? `${text}\n${CHECK_PAUSED}` : text;
}

export const HELP_TEXT = `${HELP}
予約に空きが出たら、このグループでお知らせします。
今日から${DAYS_TO_CHECK}日間は、特に設定しなくても${timeRange(...DEFAULT_WINDOW)}の枠をチェックします。

日ごとの設定
${ANY_LABEL}　空きが出たらいつでも通知
${SKIP_LABEL}　その日は通知しない
${RANGE}　その時間帯にまるごと入る枠だけ通知
${CHECK_FROM}　決めた日時になるまで、その日は通知しない（任意）
${RESET}　その日の設定と通知済みの記録を消して、ふだんどおりに戻す

ほかのボタン
${SHOW_STATUS}　日ごとの設定とチェックの状況
${CHECK_NOW}　いま空いている枠を一覧で表示（ここで出た枠は、あとでお知らせしません）

変え方
メニューの「${SET_DAY}」→ 日付を選ぶ → 設定を選ぶ
「${CHECK_SETTINGS}」では、チェックの間隔（10〜60分）の変更と、停止・再開ができます。

メニューは、お知らせの下の「${MENU}」か、このアカウントへのメンション、または「メニュー」と送ると出ます。
同じ時間の空きは一度だけお知らせします。`;

export const ERROR = '😕 エラーが発生しました。もう一度お試しください。';
export const FROM_PASSED = 'その日時はもう過ぎています。';

/** ⏳ at or after the day's window's last slot: nothing could ever be found. */
export function fromAfterWindow(day: Day, window: [Clock, Clock]): string {
  return `その時刻からだと、${dayLabel(day)}の ⏰ ${timeRange(...window)} の枠は残りません。先に時間帯を変えてください。`;
}
export const OUTDATED = 'このボタンは古くなっています。メニューから開き直してください。';

export function fromAfterDay(day: Day): string {
  return `チェック開始は${dayLabel(day)}までの日時にしてください。`;
}

export function dayPassed(day: Day): string {
  return `${dayLabel(day)}はもう過ぎています。`;
}

/** The app only (LINE's buttons stop at the days shown). */
export function dayTooFar(day: Day): string {
  return `${dayLabel(day)}はまだ設定できません。${DAYS_SHOWN}日先までの日付にしてください。`;
}

/** The app's change, refused: that day changed since it was read. */
export const STALE = 'ほかの人が先に変更しました。いまの設定を確かめてください。';

/** An app change in the bot's words (the app's list): `11/14（金）🔔 終日（ウェイ）`, `🔧 30分ごと（うめ）`. */
export function changeText(c: { a: ChangeKind; d: Day | null; s?: Clock; e?: Clock; at?: number; m?: number }, name: string): string {
  const what = c.a === 'any' ? ANY_LABEL
    : c.a === 'skip' ? SKIP_LABEL
      : c.a === 'range' ? `⏰ ${timeRange(c.s!, c.e!)}`
        : c.a === 'reset' ? RESET
          : c.a === 'from' ? `⏳ ${c.d !== null && dayOf(c.at!) === c.d ? '' : dayLabel(dayOf(c.at!))}${clockOf(c.at!)}から`
            : c.a === 'unfrom' ? CLEAR_CHECK_FROM
              : c.a === 'interval' ? `🔧 ${intervalLabel(c.m!)}`
                : c.a === 'pause' ? '⏸️ チェック停止' : '▶️ チェック再開';
  return `${c.d === null ? '' : dayLabel(c.d)}${what}（${name}）`;
}

// --- alerts and the check ---

export function newSlots(slots: Slot[]): string[] {
  return ['🟢 空きが出ました！', ...slotLines(slots)];
}

/** The reply to 🔎: everything open, including times already announced. */
export function openNow(slots: Slot[], partial: boolean): string[] {
  const note = partial ? ['一部の情報を取得できませんでした。'] : [];
  if (!slots.length) {
    const none = partial ? '取得できた範囲では、いま空きはありません。' : 'いまは空きがありません。引き続きチェックします。';
    return [none, ...note];
  }
  return ['🟢 いま空いている枠', ...slotLines(slots), ...note];
}

export function checkCooldown(seconds: number): string {
  return `⏱️ ${Math.ceil(seconds)}秒ほど待ってから、もう一度お試しください。`;
}

export const CHECK_RUNNING = '⏱️ ちょうどチェック中です。少し待ってから、もう一度お試しください。';

export const CHECK_FAILED = '😕 ジムの予約サイトに接続できませんでした。少し時間をおいてお試しください。';
export const SITE_DOWN = '⚠️ ジムの予約サイトに接続できません。自動で再試行を続けます。';
export const SITE_BACK = '✅ ジムの予約サイトに再接続できました。通常どおりチェックしています。';

// --- settings ---

/** 📋's answer in parts (GET /gym/config's too, for the app): the title, a row per day that's checked or has a
 *  setting (its date, rule and ⏳ as daySetting words them), the trouble notice, and the closing line (the interval
 *  and the last and next check, or that checks are stopped). `statusLines` is LINE's text of it. */
export interface StatusView {
  title: string;
  /** soft: nothing announced that day (🔕 通知オフ, or 💤 not checked yet), which the app shows soft. */
  days: StatusDay[];
  notice: string | null;
  check: string;
}

export function statusView(
  store: Store,
  today: Day,
  lastCheck: number | null,
  nextCheck: number | null,
  havingTrouble: boolean,
): StatusView {
  const days = [...new Set([...defaultDays(today), ...store.daysWithSettings()])].sort().map((day) => {
    const [rule, from] = daySettingParts(store, day, today);
    const effective = store.effectiveRule(day, today);
    return { day, date: dayLabel(day), rule, from, soft: effective === SKIP || effective === undefined };
  });
  let check = CHECK_PAUSED;
  if (!store.paused) {
    const [last, next] = [lastCheck, nextCheck].map((t) => (t === null ? '—' : clockOf(t)));
    check = `${intervalLabel(store.intervalMinutes)}にチェック・前回 ${last}・次回 ${next}`;
  }
  const notice = havingTrouble ? '⚠️ 現在、ジムの予約サイトに接続しにくい状態です。' : null;
  return { title: '📋 日ごとの設定', days, notice, check };
}

/** The status as LINE shows it, a line each. */
export function statusLines(v: StatusView): string[] {
  const days = v.days.map((d) => `・${d.date}　${joinSetting(d.rule, d.from)}`);
  return [v.title, ...days, ...(v.notice === null ? [] : [v.notice]), v.check];
}

// --- check settings ---

export function intervalLabel(minutes: number): string {
  return `${String(minutes)}分ごと`;
}

export function checkSettings(store: Store): string {
  const state = store.paused ? '⏸️ 停止中（通知しません）' : '▶️ チェック中';
  return `🔧 チェック設定\n・間隔：${intervalLabel(store.intervalMinutes)}\n・状態：${state}`;
}

export function intervalNote(minutes: number): string {
  return `🔧 チェックの間隔を${intervalLabel(minutes)}にしました`;
}

export const PAUSED_NOTE = '⏸️ チェックを停止しました。再開するまで、空きのお知らせは届きません。';
export const RESUMED_NOTE = '▶️ チェックを再開しました';

export function dayChanged(store: Store, day: Day, today: Day): string {
  return `👍 ${dayLabel(day)}を ${daySetting(store, day, today)} にしました。`;
}

export function dayReset(store: Store, day: Day, today: Day): string {
  return `👍 ${dayLabel(day)}の設定をリセットしました。いまは ${daySetting(store, day, today)} です。`;
}

export function dayUnchanged(store: Store, day: Day, today: Day): string {
  return `${dayLabel(day)}はすでに ${daySetting(store, day, today)} になっています。`;
}

/** A settings change, answered in the group with who made it (if their name could be looked up). */
export function changedBy(text: string, name: string): string {
  return name ? `${text}\n${name}さんが変更しました` : text;
}

// --- the day card ---

export const BAD_RANGE = '「何時から」と、それより後の「何時まで」を選んでください。';

export const PICK_DAY = '🗓️ 日付を選んでください';
const DAY_MARKS = '🔔 終日・🔕 通知オフ・⏰ 時間指定・💤 まだ・⏳ 開始時刻あり';

/** A week of the day picker. */
export function pickDay(first: Day, last: Day): string {
  const week = first === last ? dayLabel(first) : `${dayLabel(first)}〜${dayLabel(last)}`;
  return `🗓️ ${week}\n日付を選んでください\n${DAY_MARKS}`;
}

/** `10/5（月） 🔔⏳`: the day with marks for its setting. */
export function dayButton(store: Store, day: Day, today: Day): string {
  const mark = [...ruleLabel(store.effectiveRule(day, today))][0]; // the emoji: a code point, not a UTF-16 unit
  return `${dayLabel(day)} ${mark}${store.checkFrom(day) !== undefined ? '⏳' : ''}`;
}

export function pickedDay(store: Store, day: Day, today: Day): string {
  return `${dayLabel(day)}　いまの設定：${daySetting(store, day, today)}\nどうしますか？`;
}

export function pickRangeEnd(day: Day, start: Clock): string {
  return `${dayLabel(day)}　${start}から何時まで通知しますか？`;
}
