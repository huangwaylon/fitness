// Tests for what the buttons do (actions.ts), with a fake bot: `apply` (LINE's taps and the app's acts: each refusal's
// code and LINE's hint), `parseAction` (the app's body), `webAct` (the app's act end to end in the bot: base, bulk,
// changes, logs), 📋 and /gym/config's rows.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as actions from '../src/actions.ts';
import { CHECK_COOLDOWN_MS, CHANGES_KEPT, DAYS_SHOWN } from '../../app/src/lib/gym/contract.ts';
import { DAYS_TO_CHECK } from '../src/config.ts';
import { CheckFailed, PROGRAMS, type Slot } from '../src/hacomono.ts';
import * as messages from '../src/messages.ts';
import { dayLabel as label } from '../src/messages.ts';
import { ANY, SKIP } from '../src/store.ts';
import { at } from '../src/time.ts';
import { NOON, NOW, fakeBot, inDays, today } from './fakeBot.ts';

let bot: ReturnType<typeof fakeBot>;
let logs: string[];

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  bot = fakeBot();
  logs = [];
  for (const level of ['log', 'warn', 'error'] as const) {
    vi.spyOn(console, level).mockImplementation((...a: unknown[]) => void logs.push(a.map(String).join(' ')));
  }
});

const applied = async (act: actions.GymAction) => {
  const r = await actions.apply(bot, act);
  if (actions.refused(r)) throw new Error(`refused ${r.code}`);
  return r;
};
const refusal = async (act: actions.GymAction) => {
  const r = await actions.apply(bot, act);
  if (!actions.refused(r)) throw new Error('not refused');
  return r;
};

describe('apply: day settings', () => {
  it('sets a day, and says when it already was', async () => {
    expect(await applied({ a: 'skip', d: inDays(1) })).toEqual({ changed: true, reply: `👍 ${label(inDays(1))}を 🔕 通知オフ にしました。` });
    expect(await applied({ a: 'skip', d: inDays(1) })).toEqual({ changed: false, reply: `${label(inDays(1))}はすでに 🔕 通知オフ になっています。` });
    expect((await applied({ a: 'range', d: inDays(1), s: '18:00', e: '20:00' })).reply).toContain('⏰ 18:00〜20:00');
    expect((await applied({ a: 'any', d: inDays(1) })).reply).toContain('🔔 終日');
  });

  it('resets a day', async () => {
    bot.store.setRule(inDays(10), SKIP, today());
    const r = await applied({ a: 'reset', d: inDays(10) });
    expect(r.changed).toBe(true);
    expect(r.reply.startsWith(`👍 ${label(inDays(10))}の設定をリセットしました。いまは 💤`)).toBe(true);
    expect(bot.store.rules()).toEqual([]);
    // Nothing to clear: says how the day already is, not that it was reset.
    expect(await applied({ a: 'reset', d: inDays(1) })).toEqual({ changed: false, reply: `${label(inDays(1))}はすでに ⏰ 12:00〜13:00（ふだん） になっています。` });
  });

  it.each([
    ['day_passed', { a: 'any', d: '2026-10-11' }, messages.dayPassed('2026-10-11')],
    ['day_passed', { a: 'range', d: '2026-10-11', s: '14:00', e: '13:00' }, messages.dayPassed('2026-10-11')], // the day first
    ['bad_range', { a: 'range', d: '2026-10-13', s: '14:00', e: '14:00' }, messages.BAD_RANGE],
    ['from_passed', { a: 'from', d: '2026-10-14', at: at('2026-10-12', '00:00') }, messages.FROM_PASSED],
    ['from_after_day', { a: 'from', d: '2026-10-14', at: at('2026-10-15', '09:00') }, messages.fromAfterDay('2026-10-14')],
    ['from_after_window', { a: 'from', d: '2026-10-14', at: at('2026-10-14', '12:30') }, messages.fromAfterWindow('2026-10-14', NOON)],
  ] as const)('refuses %s with LINE’s hint (%#)', async (code, act, hint) => {
    expect(await refusal(act as actions.GymAction)).toEqual({ code, hint });
    expect(bot.store.rules()).toEqual([]);
    expect(bot.store.checkFrom('2026-10-14')).toBeUndefined();
  });

  it('takes a ⏳ before the window’s last slot (🔕 and 💤 days get the usual window, 🔔 any time)', async () => {
    expect((await applied({ a: 'from', d: inDays(2), at: at(inDays(2), '12:29') })).changed).toBe(true);
    bot.store.setRule(inDays(10), SKIP, today());
    expect((await refusal({ a: 'from', d: inDays(10), at: at(inDays(10), '14:00') })).hint).toMatch(/12:00〜13:00 の枠は残りません/);
    bot.store.setRule(inDays(10), ['18:00', '20:00'], today());
    expect((await applied({ a: 'from', d: inDays(10), at: at(inDays(10), '14:00') })).changed).toBe(true);
    expect((await refusal({ a: 'from', d: inDays(10), at: at(inDays(10), '19:30') })).code).toBe('from_after_window');
    bot.store.setRule(inDays(11), ANY, today());
    expect((await applied({ a: 'from', d: inDays(11), at: at(inDays(11), '21:00') })).changed).toBe(true);
    expect((await applied({ a: 'unfrom', d: inDays(11) })).changed).toBe(true);
    expect((await applied({ a: 'unfrom', d: inDays(11) })).changed).toBe(false);
  });
});

describe('apply: check settings', () => {
  it('wakes the bot only on a change of interval', async () => {
    expect(await applied({ a: 'interval', m: 30 })).toEqual({ changed: true, reply: messages.intervalNote(30) });
    expect(bot.wake).toHaveBeenCalledOnce();
    expect(await applied({ a: 'interval', m: 30 })).toEqual({ changed: false, reply: messages.checkSettings(bot.store) });
    expect(bot.wake).toHaveBeenCalledOnce();
  });

  it('stops and restarts', async () => {
    expect(await applied({ a: 'pause' })).toEqual({ changed: true, reply: messages.PAUSED_NOTE });
    expect((await applied({ a: 'pause' })).changed).toBe(false);
    expect(await applied({ a: 'resume' })).toEqual({ changed: true, reply: messages.RESUMED_NOTE });
    expect(bot.wake).toHaveBeenCalledTimes(2);
  });
});

describe('apply: 🔎', () => {
  const slot: Slot = { program: PROGRAMS[0], start: Date.parse('2026-10-13T12:00:00+09:00') };

  it('lists slots even if just announced (LINE), and peeks for the app', async () => {
    bot.runCheck.mockImplementation(async (alert, peek) => {
      expect([alert, peek]).toEqual([false, false]); // the reply lists them; no paid push
      return [slot];
    });
    const r = await applied({ a: 'check' });
    expect(r.lines).toEqual(messages.openNow([slot], false));
    expect(r).toMatchObject({ changed: false, slots: [slot], partial: false, reply: r.lines!.join('\n') });
    vi.setSystemTime(NOW + CHECK_COOLDOWN_MS);
    bot.runCheck.mockImplementation(async (alert, peek) => (expect([alert, peek]).toEqual([false, true]), []));
    expect((await applied({ a: 'check', peek: true })).lines).toEqual(messages.openNow([], false));
  });

  it('lists what a partial check got', async () => {
    bot.runCheck.mockRejectedValue(new CheckFailed([new Error('down')], [slot], false));
    expect(await applied({ a: 'check' })).toMatchObject({ lines: messages.openNow([slot], true), partial: true });
  });

  const arrangements: Record<string, () => void> = {
    site_failed: () => void bot.runCheck.mockRejectedValue(new CheckFailed([new Error('a'), new Error('b')], [], true)),
    failed: () => void bot.runCheck.mockRejectedValue(new Error('boom')), // never silent
    paused: () => void bot.store.setPaused(true),
    running: () => void (bot.checking = true),
  };
  it.each([
    ['site_failed', messages.CHECK_FAILED], ['failed', messages.ERROR], ['paused', messages.CHECK_PAUSED], ['running', messages.CHECK_RUNNING],
  ])('refuses %s', async (code, hint) => {
    arrangements[code]();
    expect(await refusal({ a: 'check' })).toEqual({ code, hint });
    // stopped or running: no cooldown used up
    expect(bot.lastManualCheck).toBe(code === 'paused' || code === 'running' ? null : NOW);
  });

  it('has a cooldown shared by everyone, with the seconds left', async () => {
    await applied({ a: 'check' });
    vi.setSystemTime(NOW + 20_000);
    expect(await refusal({ a: 'check', peek: true })).toEqual({ code: 'cooldown', hint: messages.checkCooldown(40), retryAfter: 40 });
    expect(bot.runCheck).toHaveBeenCalledOnce();
    vi.setSystemTime(NOW + CHECK_COOLDOWN_MS);
    await applied({ a: 'check' });
    expect(bot.runCheck).toHaveBeenCalledTimes(2);
  });
});

describe('parseAction (the app’s body)', () => {
  it('reads each form, a ⏳ clock time on its day', () => {
    expect(actions.parseAction({ a: 'any', d: inDays(1), base: 'abc' }, NOW)).toEqual({ acts: [{ act: { a: 'any', d: inDays(1) }, base: 'abc' }], bulk: false });
    expect(actions.parseAction({ a: 'from', d: inDays(1), at: '09:30' }, NOW)).toEqual({ acts: [{ act: { a: 'from', d: inDays(1), at: at(inDays(1), '09:30') } }], bulk: false });
    expect(actions.parseAction({ a: 'from', d: inDays(1), at: 123 }, NOW)).toMatchObject({ acts: [{ act: { at: 123 } }] });
    expect(actions.parseAction({ a: 'check' }, NOW)).toEqual({ acts: [{ act: { a: 'check', peek: true } }], bulk: false });
    expect(actions.parseAction({ a: 'interval', m: 30 }, NOW)).toEqual({ acts: [{ act: { a: 'interval', m: 30 } }], bulk: false });
    expect(actions.parseAction({ a: 'range', s: '18:00', e: '20:00', days: [{ d: inDays(1), base: 'x' }, { d: inDays(2) }] }, NOW)).toEqual({
      acts: [{ act: { a: 'range', d: inDays(1), s: '18:00', e: '20:00' }, base: 'x' }, { act: { a: 'range', d: inDays(2), s: '18:00', e: '20:00' } }], bulk: true
    });
  });

  it.each([
    [{ a: 'nope' }], [{ a: 'any' }], [{ a: 'any', d: '2026-02-30' }], [{ a: 'interval', m: 7 }], [{ a: 'range', d: '2026-10-13', s: '12:15', e: '13:00' }],
    [{ a: 'from', d: '2026-10-13', at: '25:00' }], [{ a: 'from', days: [{ d: '2026-10-13' }], at: '09:00' }], [{ a: 'skip', days: [] }],
    [{ a: 'skip', days: [{ d: '2026-10-13' }, { d: '2026-10-13' }] }], [{ a: 'any', d: '2026-10-13', base: 'NOT A BASE!' }], [null], ['any'], [[]],
  ])('refuses a body that isn’t one: bad_action (%j)', (raw) => {
    expect(actions.parseAction(raw, NOW)).toEqual({ code: 'bad_action', hint: messages.OUTDATED });
  });

  it('refuses a day past the days shown, and a range outside the opening hours', () => {
    const far = inDays(DAYS_SHOWN);
    expect(actions.parseAction({ a: 'any', d: inDays(DAYS_SHOWN - 1) }, NOW)).toHaveProperty('acts');
    expect(actions.parseAction({ a: 'skip', days: [{ d: inDays(1) }, { d: far }] }, NOW)).toEqual({ code: 'day_too_far', hint: messages.dayTooFar(far) });
    expect(actions.parseAction({ a: 'range', d: inDays(1), s: '09:30', e: '12:00' }, NOW)).toEqual({ code: 'bad_range', hint: messages.BAD_RANGE });
    expect(actions.parseAction({ a: 'range', d: inDays(1), s: '21:30', e: '22:00' }, NOW)).toHaveProperty('acts');
  });
});

describe('webAct (the app’s act in the bot)', () => {
  const act = (body: unknown, by: 'A' | 'B' = 'A') => actions.webAct(bot, body, by, 'r1');

  it('applies, keeps the change for the group and the app, saves, and answers the config', async () => {
    const base = actions.baseOf(bot.store, inDays(3));
    const r = await act({ a: 'any', d: inDays(3), base });
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ ok: true, changed: true, reply: messages.dayChanged(bot.store, inDays(3), today()) });
    expect(bot.save).toHaveBeenCalledOnce();
    expect(bot.changes).toEqual([{ t: NOW, by: 'A', a: 'any', d: inDays(3), said: false }]);
    const config = (r.body as { config: { rows: { day: string; rule: unknown; base: string }[]; changes: unknown[] } }).config;
    expect(config.rows.find((x) => x.day === inDays(3))).toMatchObject({ rule: 'any', base: actions.baseOf(bot.store, inDays(3)) });
    expect(config.rows.find((x) => x.day === inDays(3))!.base).not.toBe(base);
    expect(config.changes).toEqual([{ t: NOW, by: 'A', who: 'ウェイ', a: 'any', d: inDays(3), text: `${label(inDays(3))}🔔 終日（ウェイ）` }]);
    expect(logs).toContain(`act by=A a=any d=${inDays(3)} changed=1 rid=r1`);
    expect(logs).toContain(`changed ${inDays(3)}: default -> any (by web A)`);
  });

  it('an unchanged act keeps nothing and saves nothing', async () => {
    const r = await act({ a: 'reset', d: inDays(1) });
    expect(r.body).toMatchObject({ ok: true, changed: false });
    expect([bot.changes, bot.save.mock.calls.length]).toEqual([[], 0]);
    expect(logs).toContain(`act by=A a=reset d=${inDays(1)} changed=0 rid=r1`);
  });

  it('refuses 409 stale (with the config) only when that day moved since its base, applying nothing', async () => {
    const seen = { d1: actions.baseOf(bot.store, inDays(1)), d2: actions.baseOf(bot.store, inDays(2)) };
    bot.store.setRule(inDays(2), SKIP, today()); // a LINE tap meanwhile, on another day
    bot.store.markNotified([at(inDays(1), '12:00')]); // an announced time is no change of setting
    expect((await act({ a: 'any', d: inDays(1), base: seen.d1 })).status).toBe(200);
    const r = await act({ a: 'skip', days: [{ d: inDays(3) }, { d: inDays(2), base: seen.d2 }] }, 'B');
    expect(r.status).toBe(409);
    expect(r.body).toMatchObject({ ok: false, error: 'stale', hint: messages.STALE, config: { v: 1 } });
    expect(bot.store.rule(inDays(3))).toBeUndefined(); // all or nothing
    expect(logs).toContain(`act by=B a=skip d=${inDays(2)} refused stale rid=r1`);
    // interval, pause, resume: absolute, never stale
    expect((await act({ a: 'interval', m: 30 })).status).toBe(200);
  });

  it('bulk: every day or none, one change and one log line a day', async () => {
    const r = await act({ a: 'range', s: '18:00', e: '20:00', days: [{ d: inDays(5) }, { d: inDays(6) }, { d: inDays(7) }] });
    expect(r.body).toMatchObject({ ok: true, changed: true });
    expect(bot.store.rules()).toEqual([[inDays(5), ['18:00', '20:00']], [inDays(6), ['18:00', '20:00']], [inDays(7), ['18:00', '20:00']]]);
    expect(bot.changes.map((c) => c.d)).toEqual([inDays(7), inDays(6), inDays(5)]); // newest first, in day order
    expect(logs.filter((l) => l.startsWith('act by=A a=range'))).toHaveLength(3);
    expect(bot.save).toHaveBeenCalledOnce();
    const passed = await act({ a: 'skip', days: [{ d: inDays(8) }, { d: inDays(-1) }] });
    expect([passed.status, passed.body]).toEqual([422, { ok: false, error: 'day_passed', hint: messages.dayPassed(inDays(-1)) }]);
    expect(bot.store.rule(inDays(8))).toBeUndefined();
  });

  it('answers each refusal with its status, a cooldown with Retry-After', async () => {
    expect((await act({ a: 'nope' })).status).toBe(400);
    expect((await act({ a: 'any', d: inDays(30) })).status).toBe(400);
    expect((await act({ a: 'from', d: today(), at: '11:00' })).status).toBe(422);
    expect((await act({ a: 'check' })).body).toMatchObject({ ok: true, changed: false, lines: messages.openNow([], false), partial: false, slots: [] });
    vi.setSystemTime(NOW + 15_000);
    const r = await act({ a: 'check' });
    expect([r.status, r.retryAfter, r.body]).toEqual([429, 45, { ok: false, error: 'cooldown', hint: messages.checkCooldown(45), config: expect.objectContaining({ checkReadyAt: NOW + CHECK_COOLDOWN_MS }) }]);
    bot.store.setPaused(true);
    expect((await act({ a: 'check' })).status).toBe(409);
  });

  it('🔎 answers the slots a row a time, every program open then', async () => {
    const t = at(inDays(1), '12:00');
    bot.runCheck.mockResolvedValue([{ program: PROGRAMS[1], start: t }, { program: PROGRAMS[0], start: t }, { program: PROGRAMS[0], start: t + 1_800_000 }]);
    const r = await act({ a: 'check' });
    expect((r.body as { slots: unknown }).slots).toEqual([
      { day: inDays(1), start: '12:00', end: '12:30', programs: ['pilates', 'training'] },
      { day: inDays(1), start: '12:30', end: '13:00', programs: ['training'] }
    ]);
    expect(bot.runCheck).toHaveBeenCalledWith(false, true); // a peek
    expect(logs).toContain('act by=A a=check open=3 rid=r1');
  });

  it('keeps the newest CHANGES_KEPT', async () => {
    for (let i = 0; i < CHANGES_KEPT + 3; i++) await act({ a: i % 2 ? 'any' : 'skip', d: inDays(10) });
    expect(bot.changes).toHaveLength(CHANGES_KEPT);
    expect(bot.changes[0].a).toBe('skip'); // the last (i = 14)
  });
});

describe('status (📋) and /gym/config', () => {
  it('shows every day', async () => {
    bot.store.setRule(inDays(1), SKIP, today());
    bot.store.setRule(inDays(20), NOON, today());
    const text = (await actions.status(bot)).join('\n');
    expect(text.split('⏰ 12:00〜13:00').length - 1).toBe(DAYS_TO_CHECK); // the 3 default days left, and the 20th
    expect(text).toContain('🔕 通知オフ');
    expect(text).not.toContain('💤');
  });

  it('shows the check settings and trouble', async () => {
    bot.store.setInterval(30);
    bot.lastCheck = at(today(), '09:05');
    expect((await actions.status(bot)).at(-1)).toBe('30分ごとにチェック・前回 09:05・次回 —');
    bot.nextCheck.mockResolvedValue(at(today(), '12:10'));
    expect((await actions.status(bot)).at(-1)).toBe('30分ごとにチェック・前回 09:05・次回 12:10');
    bot.failures = 1;
    expect((await actions.status(bot)).at(-2)).toContain('接続しにくい');
    bot.store.setPaused(true);
    expect((await actions.status(bot)).at(-1)).toBe(messages.CHECK_PAUSED);
  });

  it('names the last day’s app changes in one line after the days', async () => {
    await actions.webAct(bot, { a: 'any', d: inDays(2) }, 'A', 'r');
    await actions.webAct(bot, { a: 'interval', m: 30 }, 'B', 'r');
    const lines = await actions.status(bot);
    expect(lines).toContain(`アプリで変更：🔧 30分ごと（うめ）、${label(inDays(2))}🔔 終日（ウェイ）`);
    vi.setSystemTime(NOW + 86_400_000 + 1);
    expect((await actions.status(bot)).join('\n')).not.toContain('アプリで変更');
  });

  it('gives the calendar 25 rows: the rule, ふだん, ⏳, the announced times, whether 🧹 has anything, the base', async () => {
    bot.store.setRule(inDays(1), ['18:00', '20:00'], today());
    bot.store.setCheckFrom(inDays(2), at(inDays(1), '18:00'), today());
    bot.store.setRule(inDays(10), SKIP, today());
    bot.store.markNotified([at(inDays(2), '12:30'), at(inDays(2), '12:00')]);
    bot.lastManualCheck = NOW - 10_000;
    const c = await actions.config(bot);
    expect(c.rows).toHaveLength(DAYS_SHOWN);
    expect(c.rows[0]).toMatchObject({ day: today(), rule: null, usual: true, from: null, announced: [], resettable: false });
    expect(c.rows[1]).toMatchObject({ rule: ['18:00', '20:00'], usual: false, resettable: true });
    expect(c.rows[2]).toMatchObject({ rule: null, usual: true, from: at(inDays(1), '18:00'), announced: ['12:00', '12:30'], resettable: true });
    expect(c.rows[4]).toMatchObject({ rule: null, usual: false, resettable: false }); // 💤
    expect(c.rows[10]).toMatchObject({ rule: 'skip', usual: false });
    expect(c.rows[24].day).toBe(inDays(24));
    expect(new Set(c.rows.map((r) => r.base)).size).toBeGreaterThan(1);
    expect(c).toMatchObject({ defaultDays: DAYS_TO_CHECK, intervals: [10, 15, 30, 60], checkReadyAt: NOW + 50_000, checking: false, changes: [] });
  });
});
