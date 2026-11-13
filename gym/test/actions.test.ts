// Tests for what the buttons do (actions.ts), with a fake bot.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as actions from '../src/actions.ts';
import { DAYS_TO_CHECK } from '../src/config.ts';
import { CheckFailed, PROGRAMS, type Slot } from '../src/hacomono.ts';
import * as messages from '../src/messages.ts';
import { dayLabel as label } from '../src/messages.ts';
import { ANY, SKIP } from '../src/store.ts';
import { at } from '../src/time.ts';
import { NOON, NOW, fakeBot, inDays, today } from './fakeBot.ts';

let bot: ReturnType<typeof fakeBot>;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  bot = fakeBot();
});

describe('day settings', () => {
  it('sets a day', () => {
    expect(actions.setDay(bot, inDays(1), SKIP)).toEqual([`👍 ${label(inDays(1))}を 🔕 通知オフ にしました。`, true]);
    const unchanged = `${label(inDays(1))}はすでに 🔕 通知オフ になっています。`;
    expect(actions.setDay(bot, inDays(1), SKIP)).toEqual([unchanged, false]);
  });

  it('resets a day', () => {
    bot.store.setRule(inDays(10), SKIP, today());
    const [text, changed] = actions.resetDay(bot, inDays(10));
    expect(changed).toBe(true);
    expect(text.startsWith(`👍 ${label(inDays(10))}の設定をリセットしました。いまは 💤`)).toBe(true);
    expect(bot.store.rules()).toEqual([]);
    // Nothing to clear: says how the day already is, not that it was reset.
    expect(actions.resetDay(bot, inDays(1))).toEqual([`${label(inDays(1))}はすでに ⏰ 12:00〜13:00（ふだん） になっています。`, false]);
  });

  it('needs a check-from time ahead and not after the day', () => {
    expect(() => actions.setCheckFrom(bot, inDays(2), at(today(), '00:00'))).toThrow(
      new actions.Refused(messages.FROM_PASSED));
    expect(() => actions.setCheckFrom(bot, inDays(2), at(inDays(3), '09:00'))).toThrow(/までの日時/);
    expect(() => actions.setCheckFrom(bot, inDays(2), at(inDays(3), '09:00'))).toThrow(actions.Refused);
    expect(bot.store.checkFrom(inDays(2))).toBeUndefined();
    const [text, changed] = actions.setCheckFrom(bot, inDays(2), at(inDays(1), '16:00'));
    expect(changed).toBe(true);
    expect(text).toContain('⏳');
    expect(actions.setCheckFrom(bot, inDays(2), null)[1]).toBe(true);
    expect(actions.setCheckFrom(bot, inDays(2), null)[1]).toBe(false);
  });

  it("refuses a check-from that leaves no slot in the day's window", () => {
    // the default 12:00–13:00: its last slot starts at 12:30, so ⏳ must be before then
    expect(() => actions.setCheckFrom(bot, inDays(2), at(inDays(2), '12:30'))).toThrow(
      new actions.Refused(messages.fromAfterWindow(inDays(2), ['12:00', '13:00'])));
    expect(actions.setCheckFrom(bot, inDays(2), at(inDays(2), '12:29'))[1]).toBe(true);
    bot.store.setRule(inDays(10), SKIP, today()); // 🔕 and 💤 days get the default window too
    expect(() => actions.setCheckFrom(bot, inDays(10), at(inDays(10), '14:00'))).toThrow(/12:00〜13:00 の枠は残りません/);
    bot.store.setRule(inDays(10), ['18:00', '20:00'], today());
    expect(actions.setCheckFrom(bot, inDays(10), at(inDays(10), '14:00'))[1]).toBe(true);
    expect(() => actions.setCheckFrom(bot, inDays(10), at(inDays(10), '19:30'))).toThrow(actions.Refused);
    bot.store.setRule(inDays(11), ANY, today()); // all day: any time up to the picker's end
    expect(actions.setCheckFrom(bot, inDays(11), at(inDays(11), '21:00'))[1]).toBe(true);
  });
});

describe('check settings', () => {
  it('wakes the bot only on a change of interval', async () => {
    expect(await actions.setInterval(bot, 30)).toEqual([messages.intervalNote(30), true]);
    expect(bot.wake).toHaveBeenCalledOnce();
    const [text, changed] = await actions.setInterval(bot, 30);
    expect(changed).toBe(false);
    expect(text).toBe(messages.checkSettings(bot.store));
    expect(bot.wake).toHaveBeenCalledOnce();
  });

  it('stops and restarts', async () => {
    expect(await actions.setPaused(bot, true)).toEqual([messages.PAUSED_NOTE, true]);
    expect((await actions.setPaused(bot, true))[1]).toBe(false);
    expect(await actions.setPaused(bot, false)).toEqual([messages.RESUMED_NOTE, true]);
    expect(bot.wake).toHaveBeenCalledTimes(2);
  });
});

describe('status', () => {
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
});

describe('manual check', () => {
  const slot: Slot = { program: PROGRAMS[0], start: Date.parse('2026-10-13T12:00:00+09:00') };

  it('lists slots even if just announced', async () => {
    // The alert push may not have reached LINE (e.g. the monthly quota is used up).
    bot.runCheck.mockImplementation(async (alert) => {
      expect(alert).toBe(false); // the reply lists them; no paid push
      bot.store.markNotified([slot.start]); // what a real check does for new slots
      return [slot];
    });
    const text = (await actions.manualCheck(bot)).join('\n');
    expect(text).toContain('いま空いている枠');
    expect(text).toContain('12:00〜12:30');
  });

  it('lists what a partial check got', async () => {
    bot.runCheck.mockRejectedValue(new CheckFailed([new Error('down')], [slot], false));
    expect(await actions.manualCheck(bot)).toEqual(messages.openNow([slot], true));
  });

  it('says the site is down when the check failed', async () => {
    bot.runCheck.mockRejectedValue(new CheckFailed([new Error('a'), new Error('b')], [], true));
    expect(await actions.manualCheck(bot)).toEqual([messages.CHECK_FAILED]);
  });

  it('never stays silent', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    bot.runCheck.mockRejectedValue(new Error('boom'));
    expect(await actions.manualCheck(bot)).toEqual([messages.ERROR]);
  });

  it('has a cooldown shared by everyone', async () => {
    expect((await actions.manualCheck(bot))[0]).toContain('空きがありません');
    vi.setSystemTime(NOW + 20_000);
    expect((await actions.manualCheck(bot))[0]).toBe(messages.checkCooldown(40));
    expect(bot.runCheck).toHaveBeenCalledOnce();
    vi.setSystemTime(NOW + actions.MANUAL_CHECK_COOLDOWN_MS);
    await actions.manualCheck(bot);
    expect(bot.runCheck).toHaveBeenCalledTimes(2);
  });

  it("doesn't check while stopped", async () => {
    bot.store.setPaused(true);
    expect(await actions.manualCheck(bot)).toEqual([messages.CHECK_PAUSED]);
    expect(bot.runCheck).not.toHaveBeenCalled();
    expect(bot.lastManualCheck).toBeNull(); // doesn't use up the cooldown
  });

  it("doesn't wait for a running check", async () => {
    bot.checking = true;
    expect(await actions.manualCheck(bot)).toEqual([messages.CHECK_RUNNING]);
    expect(bot.runCheck).not.toHaveBeenCalled();
    expect(bot.lastManualCheck).toBeNull(); // no cooldown either
  });
});
