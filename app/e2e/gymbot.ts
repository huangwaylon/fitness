// The gym bot's Worker as ボット → ジム's specs see it (gymbot.spec.ts, gymbot-settings.spec.ts): /status and the members'
// /gym/config and /gym/act answered by page.route from a small stand-in of the bot's state (gym/src: the 25 rows from
// the record's pinned day, the check settings, the app's changes, 🔎's cooldown), so a change shows in the next read.
// A ⏳ is refused as the bot refuses it (the contract's fromRefusal, in its words). Each act's body is kept; `next` answers the next act with a refusal or a failure instead; `hold` keeps the acts
// unanswered until released; `lineTap` changes a day as a LINE tap would (its base moves, so the page's next act on it
// is 409 stale). No network.
import type { Page } from './fixtures.ts';
import type { GymStatus } from '../src/lib/gym/status.ts';
import { at, dayOf, fromLimit, fromRefusal, fromWindow, weekday, type ActInput, type Change, type DayRow, type GymConfig, type Rule } from '../src/lib/gym/contract.ts';

const ORIGIN = 'https://gym-bot.island-fund-relay.workers.dev';
export const STATUS = `${ORIGIN}/status`;
export const CONFIG = `${ORIGIN}/gym/config`;
const ACT = `${ORIGIN}/gym/act`;
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST', 'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Request-Id' };
const MIN = 60_000;
const DAY_MS = 86_400_000;
const md = (d: string) => `${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}`;
/** The bot's day label (messages.ts dayLabel): `11/13（金）`. */
const label = (d: string) => `${md(d)}（${'月火水木金土日'[weekday(d)]}）`;

/** A runner whose last check's pilates timed out, at `now`. */
export function statusPayload(now: number): GymStatus {
  const ok = { training: 'ok', pilates: 'ok' } as const;
  return {
    v: 1, now, mode: 'bot', sha: 'abc1234def', verdict: 'degraded', reasons: ['program_failing'], intervalMin: 15, paused: false,
    nextCheck: now + 9 * MIN, lastCheck: now - 6 * MIN, lastOk: now - 21 * MIN, lastError: { t: now - 6 * MIN, code: 'timeout' },
    failures: 0, siteDownSent: false, retryPending: false,
    checks: [
      { t: now - 6 * MIN, by: 'alarm', ms: 15200, r: { training: 'ok', pilates: 'timeout' }, open: 1, fresh: 0, push: 'none' },
      { t: now - 21 * MIN, by: 'tap', ms: 3000, r: ok, open: 1, fresh: 1, push: 'held' },
      { t: now - 36 * MIN, by: 'alarm', ms: 3, idle: true, open: 0, fresh: 0, push: 'none' }
    ],
    line: { used: 12, limit: 200, webhookOk: true, asOf: now - 30 * MIN }
  };
}

type Answer = { status: number; body: unknown; headers?: Record<string, string> };

/** The bot's state, from `now` (the record's pinned clock). */
export function fakeGym(now: () => number) {
  const today = dayOf(now());
  const days = Array.from({ length: 25 }, (_, i) => dayOf(at(today, '12:00') + i * DAY_MS));
  const rules = new Map<string, Rule>();
  const froms = new Map<string, number>();
  const announced = new Map<string, string[]>();
  const versions = new Map<string, number>();
  const s = { paused: false, intervalMin: 15, checkAt: null as number | null, changes: [] as Change[] };
  const acts: ActInput[] = [];
  let next: Answer | null = null;
  let gate: Promise<void> | null = null;
  const bump = (d: string) => versions.set(d, (versions.get(d) ?? 0) + 1);
  const usual = (d: string) => days.indexOf(d) < 4;
  const isDefault = (r: Rule) => Array.isArray(r) && r[0] === '12:00' && r[1] === '13:00';

  function setRule(d: string, r: Rule) {
    if (usual(d) && isDefault(r)) rules.delete(d);
    else rules.set(d, r);
    if (r === 'skip') froms.delete(d);
    // a ⏳ the new window leaves no slot after is dropped (store.setRule)
    if ((froms.get(d) ?? 0) >= fromLimit(d, rules.get(d) ?? (usual(d) ? r : null))) froms.delete(d);
  }

  function row(d: string): DayRow {
    const rule = rules.get(d) ?? null;
    const a = announced.get(d) ?? [];
    return {
      day: d, rule, usual: rule === null && usual(d), from: froms.get(d) ?? null, announced: a,
      resettable: rule !== null || froms.has(d) || a.length > 0, base: `v${versions.get(d) ?? 0}`
    };
  }

  function config(): GymConfig {
    const t = now();
    const check = s.paused ? '⏸️ チェックは停止中です。' : `${s.intervalMin}分ごとにチェック・前回 11:54・次回 12:09`;
    return {
      v: 1, now: t, title: '📋 日ごとの設定', days: [], notice: null, check, text: '📋 日ごとの設定', paused: s.paused, intervalMin: s.intervalMin,
      lastCheck: t - 6 * MIN, nextCheck: s.paused ? null : t + 9 * MIN, rows: days.map(row), defaultDays: 4, intervals: [10, 15, 30, 60],
      checkReadyAt: s.checkAt !== null && s.checkAt + MIN > t ? s.checkAt + MIN : null, checking: false, changes: s.changes
    };
  }

  function apply1(input: Extract<ActInput, { d: string }>): void {
    const d = input.d;
    if (input.a === 'any' || input.a === 'skip') setRule(d, input.a);
    else if (input.a === 'range') setRule(d, [input.s, input.e]);
    else if (input.a === 'reset') [rules, froms, announced].forEach((m) => m.delete(d));
    else if (input.a === 'unfrom') froms.delete(d);
    else if (input.a === 'from') {
      froms.set(d, typeof input.at === 'number' ? input.at : at(d, input.at));
      if (rules.get(d) === 'skip' || (!rules.has(d) && !usual(d))) setRule(d, ['12:00', '13:00']);
    }
    bump(d);
    const kept = s.changes.filter((c) => c.d !== d); // one a day, as the bot keeps them
    s.changes = [{ t: now(), by: 'A' as const, who: 'ウェイ', a: input.a, d, text: '' }, ...kept].slice(0, 12);
  }

  function act(input: ActInput): Answer {
    acts.push(input);
    if (next) {
      const n = next;
      next = null;
      return n;
    }
    if (input.a === 'check') {
      if (s.paused) return { status: 409, body: { ok: false, error: 'paused', hint: '⏸️ チェックは停止中です。' } };
      if (s.checkAt !== null && now() - s.checkAt < MIN) {
        const left = Math.ceil((MIN - (now() - s.checkAt)) / 1000);
        return { status: 429, body: { ok: false, error: 'cooldown', hint: `⏱️ ${left}秒ほど待ってから、もう一度お試しください。`, config: config() }, headers: { 'Retry-After': String(left) } };
      }
      s.checkAt = now();
      const lines = ['🟢 いま空いている枠', `${md(days[1])}（木）`, '・12:00〜12:30　💪 パーソナルトレーニング'];
      return { status: 200, body: { ok: true, changed: false, reply: lines.join('\n'), config: config(), lines, partial: false, slots: [{ day: days[1], start: '12:00', end: '12:30', programs: ['training'] }] } };
    }
    if (input.a === 'pause' || input.a === 'resume') s.paused = input.a === 'pause';
    else if (input.a === 'interval') s.intervalMin = input.m;
    else {
      const list = 'days' in input ? input.days : [{ d: input.d, base: input.base }];
      if (list.some((x) => x.base !== undefined && x.base !== row(x.d).base)) {
        return { status: 409, body: { ok: false, error: 'stale', hint: 'ほかの人が先に変更しました。', config: config() } };
      }
      if (input.a === 'from') {
        const r = row(input.d);
        const rule: Rule | null = r.rule ?? (r.usual ? ['12:00', '13:00'] : null);
        const error = fromRefusal(input.d, typeof input.at === 'number' ? input.at : at(input.d, input.at), now(), rule);
        const w = fromWindow(rule);
        const hint = error === 'from_passed' ? 'その日時はもう過ぎています。' // the bot's words (messages.ts)
          : error === 'from_after_day' ? `チェック開始は${label(input.d)}までの日時にしてください。`
            : rule === 'any' ? `その時刻からだと、${label(input.d)}の枠は残りません。`
              : `その時刻からだと、${label(input.d)}の ⏰ ${w[0]}〜${w[1]} の枠は残りません。先に時間帯を変えてください。`;
        if (error) return { status: 422, body: { ok: false, error, hint, config: config() } };
      }
      for (const x of list) apply1(('days' in input ? { ...input, d: x.d, days: undefined } : input) as Extract<ActInput, { d: string }>);
    }
    return { status: 200, body: { ok: true, changed: true, reply: '👍', config: config() } };
  }

  return {
    days, acts, config, act,
    /** The next act answered with this instead. */
    next: (a: Answer) => void (next = a),
    /** Acts wait unanswered until the returned release is called. */
    hold(): () => void {
      let open = () => {};
      gate = new Promise((r) => (open = r));
      return () => ((gate = null), open());
    },
    /** What an act waits on before it's answered (none when not held). */
    gate: () => gate,
    /** A LINE tap meanwhile: the day's rule set, its base moved. */
    lineTap(d: string, r: Rule) {
      setRule(d, r);
      bump(d);
    },
    announce: (d: string, clocks: string[]) => void announced.set(d, clocks),
    setFrom: (d: string, ms: number) => void froms.set(d, ms)
  };
}
export type FakeGym = ReturnType<typeof fakeGym>;

/** /status, /gym/config and /gym/act on `page`, answered by `gym` (the preflights answered with CORS). */
export async function routeGym(page: Page, gym: FakeGym, now: () => number) {
  const calls = { status: 0, config: 0, act: 0 };
  await page.route(STATUS, (route) => {
    calls.status++;
    return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(statusPayload(now())) });
  });
  await page.route(CONFIG, (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    calls.config++;
    return route.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify(gym.config()) });
  });
  await page.route(ACT, async (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    calls.act++;
    await gym.gate();
    const a = gym.act(route.request().postDataJSON() as ActInput);
    return route.fulfill({ status: a.status, contentType: 'application/json', headers: { ...CORS, 'Access-Control-Expose-Headers': 'Retry-After', ...a.headers }, body: JSON.stringify(a.body) });
  });
  return calls;
}
