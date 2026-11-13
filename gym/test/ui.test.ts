// Tests for the LINE cards and tap handling (ui.ts), with a fake bot and LINE mocked.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as actions from '../src/actions.ts';
import { LineError, menuQuickReply } from '../src/line.ts';
import * as messages from '../src/messages.ts';
import { ANY, SKIP } from '../src/store.ts';
import { addDays, at } from '../src/time.ts';
import * as ui from '../src/ui.ts';
import type { Store } from '../src/store.ts';
import { GROUP, NOON, NOW, fakeBot, inDays, today } from './fakeBot.ts';

type Json = Record<string, any>;

let bot: ReturnType<typeof fakeBot>;
let logs: string[];

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  bot = fakeBot();
  logs = [];
  for (const level of ['log', 'warn', 'error'] as const) {
    vi.spyOn(console, level).mockImplementation((...args: unknown[]) => { logs.push(args.map(String).join(' ')); });
  }
});

afterEach(() => {
  vi.restoreAllMocks();
});

const event = (type = 'postback', extra: Json = {}, group = GROUP): Json =>
  ({ type, replyToken: 'rt', source: { type: 'group', groupId: group, userId: 'U1' }, ...extra });

const tap = (data: string, params: Json = {}): Json => event('postback', { postback: { data, params } });

const replied = (): Json[] => bot.line.reply.mock.lastCall![1] as Json[];
const replyText = (): string => replied().map((m) => m.text ?? m.altText).join('\n');

const bubbles = (message: Json): Json[] =>
  message.contents.type === 'carousel' ? message.contents.contents : [message.contents];

function cardButtons(message: Json): Record<string, Json> {
  return Object.fromEntries(bubbles(message).flatMap((b) => b.footer.contents.map((x: Json) => [x.action.label, x.action])));
}

/** What LINE's datetime picker sends. */
const picked = (day: string, clock: string): string => `${day}T${clock}`;

function* allCards(): Generator<Json> {
  yield ui.menuCard(bot);
  yield ui.daysCard(bot);
  yield ui.settingsCard(bot);
  for (const n of [0, 1, 2, 24]) yield ui.dayCard(bot, inDays(n));
  for (const start of ['10:00', '21:00', '21:30']) yield ui.rangeEndCard(today(), start);
}

const loggedText = () => logs.join('\n');

describe('cards', () => {
  it('are valid for LINE', () => {
    // LINE rejects the whole reply if a label is too long or a picker's initial is outside min..max.
    bot.store.setCheckFrom(inDays(1), at(inDays(1), '09:00'), today());
    bot.store.setRule(inDays(1), NOON, today());
    bot.store.setCheckFrom(inDays(2), Date.now() - 5 * 60_000, today()); // passed, not purged
    for (const message of allCards()) {
      expect(message.altText).toBeTruthy();
      expect(message.altText.length).toBeLessThanOrEqual(400);
      expect(bubbles(message).length).toBeLessThanOrEqual(12);
      for (const action of Object.values(cardButtons(message))) {
        expect(action.label.length).toBeLessThanOrEqual(20);
        if (action.type === 'datetimepicker') {
          expect(action.min <= action.initial && action.initial <= action.max).toBe(true);
        }
      }
    }
    bot.store.setPaused(true);
    for (const action of Object.values(cardButtons(ui.settingsCard(bot)))) {
      expect(action.label.length).toBeLessThanOrEqual(20);
    }
  });

  it('keep their shape (old cards in the chat)', () => {
    expect(ui.card('Title\nmore\n', [ui.button(ui.postback('Go', { a: 'any', d: '2026-10-07' }), true)])).toEqual({
      type: 'flex',
      altText: 'Title',
      contents: {
        type: 'bubble',
        body: {
          type: 'box', layout: 'vertical', contents: [
            { type: 'text', text: 'Title', weight: 'bold', wrap: true },
            { type: 'text', text: 'more', wrap: true, size: 'sm', margin: 'md' },
          ],
        },
        footer: {
          type: 'box', layout: 'vertical', spacing: 'sm', contents: [
            { type: 'button', action: { type: 'postback', label: 'Go', data: 'a=any&d=2026-10-07' }, height: 'sm',
              style: 'primary' },
          ],
        },
      },
    });
    expect(ui.picker('P', 'time', { a: 'range', d: '2026-10-07', s: '10:30' }, '11:30', '11:00', '22:00')).toEqual({
      type: 'datetimepicker', label: 'P', data: 'a=range&d=2026-10-07&s=10%3A30', mode: 'time', initial: '11:30',
      min: '11:00', max: '22:00',
    });
  });

  it('has the menu buttons', () => {
    const buttons = cardButtons(ui.menuCard(bot));
    expect(Object.keys(buttons)).toEqual([messages.SET_DAY, messages.SHOW_STATUS, messages.CHECK_NOW,
      messages.CHECK_SETTINGS, messages.HELP]);
    expect(buttons[messages.SET_DAY].data).toBe('a=days');
  });

  it("day picker shows each day with its weekday and setting", () => {
    const monday = today(); // NOW is a Monday
    bot.store.setRule(addDays(monday, 1), SKIP, monday);
    bot.store.setRule(addDays(monday, 2), NOON, monday);
    bot.store.setCheckFrom(addDays(monday, 2), NOW + 2 * 86_400_000, monday);
    const message = ui.daysCard(bot);
    const weeks = bubbles(message).map((b) => b.footer.contents.map((x: Json) => x.action));
    expect(weeks.map((w) => w.length)).toEqual([7, 7, 7, 4]); // 25 days, Mon–Sun
    expect(weeks.flat()).toHaveLength(ui.DAYS_SHOWN);
    expect(weeks[0].slice(0, 5).map((a: Json) => a.label)).toEqual(['10/12（月） ⏰', '10/13（火） 🔕', '10/14（水） ⏰⏳',
      '10/15（木） ⏰', '10/16（金） 💤']);
    expect(weeks[0][0].data).toBe('a=day&d=2026-10-12');
    expect(bubbles(message)[0].footer.contents[0].style).toBe('primary');
    expect(bubbles(message)[0].footer.contents[1].style).toBe('secondary');
    expect(bubbles(message)[0].body.contents[0].text).toBe('🗓️ 10/12（月）〜10/18（日）');
    expect(bubbles(message).at(-1)!.body.contents[0].text).toBe('🗓️ 11/2（月）〜11/5（木）');
  });

  it('day picker starts a week mid-week when today is', () => {
    vi.setSystemTime(Date.parse('2026-10-15T08:00:00+09:00')); // Thursday
    expect(bubbles(ui.daysCard(bot)).map((b) => b.footer.contents.length)).toEqual([4, 7, 7, 7]);
  });

  it('day card shows reset and unset only when useful', () => {
    expect(Object.keys(cardButtons(ui.dayCard(bot, inDays(1))))).toEqual([
      messages.ANY_LABEL, messages.SKIP_LABEL, messages.RANGE, messages.CHECK_FROM]);
    bot.store.setCheckFrom(inDays(1), at(inDays(1), '09:00'), today());
    const buttons = cardButtons(ui.dayCard(bot, inDays(1)));
    expect(buttons[messages.RESET]).toBeDefined();
    expect(buttons[messages.CLEAR_CHECK_FROM]).toBeDefined();
    expect(buttons[messages.CHECK_FROM].initial).toBe(picked(inDays(1), '09:00')); // the saved time
  });

  it('day card suggests checking from the next whole hour', () => {
    vi.setSystemTime(Date.parse('2026-10-12T12:34:56+09:00'));
    const p = cardButtons(ui.dayCard(bot, inDays(1)))[messages.CHECK_FROM];
    expect([p.initial, p.min, p.max]).toEqual([picked(today(), '13:00'), picked(today(), '12:34'),
      picked(inDays(1), '21:30')]);
  });

  it("day card has no check-from picker once today's last slot has started", () => {
    vi.setSystemTime(Date.parse('2026-10-12T21:30:00+09:00'));
    expect(cardButtons(ui.dayCard(bot, today()))[messages.CHECK_FROM]).toBeUndefined();
  });

  it('day card starts the range picker at the saved range', () => {
    bot.store.setRule(inDays(1), ['14:00', '16:00'], today());
    expect(cardButtons(ui.dayCard(bot, inDays(1)))[messages.RANGE].initial).toBe('14:00');
    expect(cardButtons(ui.dayCard(bot, inDays(2)))[messages.RANGE].initial).toBe('12:00');
  });

  it('settings card marks the interval in use', () => {
    const buttons = cardButtons(ui.settingsCard(bot));
    expect(buttons['15分ごと（いま）']).toBeDefined();
    expect(buttons[messages.PAUSE]).toBeDefined();
    expect(Object.keys(buttons)).toHaveLength(ui.INTERVAL_CHOICES.length + 1);
    bot.store.setPaused(true);
    expect(cardButtons(ui.settingsCard(bot))[messages.RESUME]).toBeDefined();
  });

  it.each([
    ['14:17', false, '14:00'], ['14:17', true, '14:30'], ['14:30', true, '14:30'], ['23:45', true, '23:30'],
  ])('halfHour(%s, %s) = %s', (clock, up, expected) => {
    expect(ui.halfHour(clock, up)).toBe(expected);
  });

  it('check-from can be picked until the last slot', () => {
    expect(cardButtons(ui.dayCard(bot, inDays(1)))[messages.CHECK_FROM].max).toBe(picked(inDays(1), ui.LAST_START));
  });
});

describe('which messages get an answer', () => {
  const menuEvents = [
    event('join'),
    event('message', { message: { type: 'text', text: ' メニュー ' } }),
    event('message', { message: { type: 'text', text: 'MENU' } }),
    event('message', { message: { type: 'text', text: '@wayway', mention: { mentionees: [{ isSelf: true }] } } }),
    tap('a=menu'),
  ];
  const chat = [
    event('message', { message: { type: 'text', text: 'ジム行く？' } }),
    event('message', { message: { type: 'text', text: '@someone', mention: { mentionees: [{ isSelf: false }] } } }),
    event('message', { message: { type: 'sticker' } }),
    event('leave'),
  ];

  it.each(menuEvents)('shows the menu on join, mention, menu word or chip (%#)', async (e) => {
    await ui.handle(bot, e);
    expect(replied()[0].type).toBe('flex');
    expect(JSON.stringify(replied())).toContain(messages.SET_DAY);
  });

  it.each(chat)('ignores ordinary chat (%#)', async (e) => {
    await ui.handle(bot, e);
    expect(bot.line.reply).not.toHaveBeenCalled();
  });

  it('ignores other groups but logs them', async () => {
    await ui.handle(bot, event('join', {}, 'Cother'));
    expect(bot.line.reply).not.toHaveBeenCalled();
    expect(loggedText()).toContain('LINE_GROUP_ID=Cother');
  });

  it('answers nothing until the group is set up', async () => {
    bot.groupId = '';
    await ui.handle(bot, event('join'));
    await ui.handle(bot, event('join', {}, ''));
    expect(bot.line.reply).not.toHaveBeenCalled();
  });

  it.each(['a=something-new', 'a=interval&m=7', 'a=interval&m=x'])('gives a hint for an unknown tap: %s', async (data) => {
    await ui.handle(bot, tap(data));
    expect(replyText()).toBe(`🤔 ${messages.OUTDATED}`);
  });
});

describe('day settings', () => {
  it('shows the day picker', async () => {
    await ui.handle(bot, tap('a=days'));
    expect(replied()[0].contents.type).toBe('carousel');
  });

  it.each([
    [() => `a=day&d=${inDays(2)}`, {}],
    [() => 'a=day', { date: '2026-10-14' }], // an old menu card's date picker
  ])('shows the picked day (%#)', async (data, params) => {
    await ui.handle(bot, tap(data(), params));
    expect(replyText().startsWith(messages.dayLabel(inDays(2)))).toBe(true);
  });

  it.each([
    ['a=day', { date: '2026-10-11' }],
    ['a=day&d=2026-10-11', {}],
    ['a=skip&d=2026-10-11', {}],
    ['a=reset&d=2026-10-11', {}],
    ['a=range&d=2026-10-11&s=12:00', { time: '13:00' }],
  ])('gives old cards for a past day a hint: %s', async (data, params) => {
    await ui.handle(bot, tap(data, params));
    expect(replyText()).toBe(`🤔 ${messages.dayPassed(inDays(-1))}`);
    expect(bot.store.rule(inDays(-1))).toBeUndefined();
    expect(bot.save).not.toHaveBeenCalled();
  });

  it.each([['a=skip', SKIP], ['a=any', ANY]])('%s saves, then says who', async (data, rule) => {
    const order: string[] = [];
    bot.save.mockImplementation(async () => { order.push('save'); });
    bot.line.reply.mockImplementation(async () => { order.push('reply'); });
    await ui.handle(bot, tap(`${data}&d=${inDays(10)}`)); // 💤 by default, so both are changes
    expect(bot.store.rule(inDays(10))).toBe(rule);
    expect(order).toEqual(['save', 'reply']); // saved before replying
    expect(replyText().endsWith('Bobさんが変更しました')).toBe(true);
    expect(bot.line.memberName).toHaveBeenCalledExactlyOnceWith(GROUP, 'U1');
  });

  it('says an unchanged setting is so, without saving or a name', async () => {
    bot.store.setRule(inDays(1), SKIP, today());
    await ui.handle(bot, tap(`a=skip&d=${inDays(1)}`)); // already 🔕
    expect(replyText()).toBe(messages.dayUnchanged(bot.store, inDays(1), today()));
    expect(bot.save).not.toHaveBeenCalled();
    expect(bot.line.memberName).not.toHaveBeenCalled();
  });

  it('leaves the name out when it can\'t be looked up', async () => {
    bot.line.memberName.mockResolvedValue('');
    await ui.handle(bot, tap(`a=skip&d=${inDays(1)}`));
    expect(replyText()).toBe(messages.dayChanged(bot.store, inDays(1), today()));
    expect(loggedText()).toContain('(by U1 (no name))');
  });

  it('saves a change even if the reply fails', async () => {
    bot.line.reply.mockRejectedValue(new Error('LINE down'));
    await ui.handle(bot, tap(`a=skip&d=${inDays(1)}`));
    expect(bot.store.rule(inDays(1))).toBe(SKIP);
    expect(bot.save).toHaveBeenCalledOnce();
  });

  it('logs taps and changes with the setting before and after', async () => {
    const day = inDays(10);
    await ui.handle(bot, tap(`a=range&d=${day}&s=12:00`, { time: '13:00' }));
    await ui.handle(bot, tap(`a=range&d=${day}&s=12:00`, { time: '13:00' }));
    bot.store.markNotified([at(day, '12:00')]);
    await ui.handle(bot, tap(`a=from&d=${day}`, { datetime: picked(inDays(1), '09:00') }));
    await ui.handle(bot, tap(`a=reset&d=${day}`));
    await ui.handle(bot, tap('a=interval&m=30'));
    await ui.handle(bot, tap(`a=from&d=${day}`, { datetime: picked(inDays(-1), '09:00') }));
    const text = loggedText();
    expect(text).toContain(`tap from U1: a=range&d=${day}&s=12:00 {'time': '13:00'}`);
    expect(text).toContain(`changed ${day}: default -> 12:00-13:00 (by U1 Bob)`);
    expect(text).toContain(`no change for ${day}: 12:00-13:00`);
    expect(text).toContain(`changed ${day}: 12:00-13:00, 1 announced -> 12:00-13:00, from 10-13 09:00, 1 announced (by U1 Bob)`);
    expect(text).toContain(`changed ${day}: 12:00-13:00, from 10-13 09:00, 1 announced -> default (by U1 Bob)`);
    expect(text).toContain('changed check settings: every 15 min, running -> every 30 min, running');
    expect(text).toContain(`refused (invalid time) for ${day}`);
  });

  it('suggests an end an hour after the start', async () => {
    await ui.handle(bot, tap(`a=start&d=${inDays(1)}`, { time: '14:00' }));
    const [p] = Object.values(cardButtons(replied()[0]));
    expect([p.initial, p.min, p.max]).toEqual(['15:00', '14:30', '22:00']);
    await ui.handle(bot, tap(p.data, { time: '16:00' }));
    expect(bot.store.rule(inDays(1))).toEqual(['14:00', '16:00']);
    expect(replyText()).toContain('⏰ 14:00〜16:00');
  });

  it('rounds odd minutes to the same slots', async () => {
    // LINE's picker allows any minute; 14:17〜15:43 holds exactly the slots of 14:30〜15:30.
    await ui.handle(bot, tap(`a=range&d=${inDays(1)}&s=14:17`, { time: '15:43' }));
    expect(bot.store.rule(inDays(1))).toEqual(['14:30', '15:30']);
  });

  it('rounds an odd start up before picking the end', async () => {
    await ui.handle(bot, tap(`a=start&d=${inDays(1)}`, { time: '10:10' }));
    const [p] = Object.values(cardButtons(replied()[0]));
    expect([p.initial, p.min]).toEqual(['11:30', '11:00']);
    expect(p.data).toContain('s=10%3A30');
  });

  it('needs a range to end after it starts', async () => {
    await ui.handle(bot, tap(`a=range&d=${inDays(1)}&s=14:00`, { time: '14:20' })); // rounds to 14:00〜14:00
    expect(replyText()).toBe(`🤔 ${messages.BAD_RANGE}`);
    expect(bot.store.rule(inDays(1))).toBeUndefined();
  });

  it('sets and clears a check-from time', async () => {
    await ui.handle(bot, tap(`a=from&d=${inDays(1)}`, { datetime: picked(inDays(1), '09:00') }));
    expect(bot.store.checkFrom(inDays(1))).toBe(at(inDays(1), '09:00'));
    expect(replyText()).toContain('⏳');
    await ui.handle(bot, tap(`a=unfrom&d=${inDays(1)}`));
    expect(bot.store.checkFrom(inDays(1))).toBeUndefined();
    expect(bot.save).toHaveBeenCalledTimes(2);
  });

  it.each([
    [() => picked(today(), '11:00'), () => messages.FROM_PASSED],
    [() => picked(inDays(3), '09:00'), () => messages.fromAfterDay(inDays(1))],
  ])('gives a bad check-from time a hint (%#)', async (when, hint) => {
    await ui.handle(bot, tap(`a=from&d=${inDays(1)}`, { datetime: when() }));
    expect(replyText()).toBe(`🤔 ${hint()}`);
    expect(bot.store.checkFrom(inDays(1))).toBeUndefined();
    expect(bot.save).not.toHaveBeenCalled();
  });

  it('resets', async () => {
    bot.store.setRule(inDays(10), SKIP, today());
    await ui.handle(bot, tap(`a=reset&d=${inDays(10)}`));
    expect(bot.store.rule(inDays(10))).toBeUndefined();
    expect(replyText()).toContain('リセットしました');
  });
});

describe('the rest of the menu', () => {
  it('shows the status, checks and helps', async () => {
    await ui.handle(bot, tap('a=status'));
    expect(replyText().startsWith('📋 日ごとの設定')).toBe(true);
    await ui.handle(bot, tap('a=check'));
    expect(bot.runCheck).toHaveBeenCalledWith(false);
    expect(replyText().startsWith('いまは空きがありません')).toBe(true);
    await ui.handle(bot, tap('a=help'));
    expect(replyText()).toBe(messages.HELP_TEXT);
    expect(replied().at(-1)!.quickReply).toEqual(menuQuickReply());
  });

  it.each([
    ['running, with trouble', () => {
      bot.failures = 1;
      bot.nextCheck.mockResolvedValue(at(today(), '12:15'));
    }],
    ['stopped', () => void bot.store.setPaused(true)],
  ])('/gym/config answers what 📋 shows in the group, word for word (%s)', async (_, arrange) => {
    bot.store.setRule(inDays(1), SKIP, today());
    bot.store.setRule(inDays(2), ANY, today());
    bot.store.setCheckFrom(inDays(2), at(inDays(1), '18:00'), today());
    bot.store.setRule(inDays(9), NOON, today());
    bot.lastCheck = at(today(), '11:50');
    arrange();
    await ui.handle(bot, tap('a=status'));
    const config = await actions.config(bot);
    expect(replied()).toHaveLength(1);
    expect(config.text).toBe(replyText());
    // the parts, rebuilt as LINE's lines, are the same text
    const days = config.days.map((d) => `・${d.date}　${d.rule}${d.from ? `　${d.from}` : ''}`);
    expect([config.title, ...days, ...(config.notice ? [config.notice] : []), config.check].join('\n')).toBe(replyText());
    expect(config.days.map((d) => d.day)).toEqual([today(), inDays(1), inDays(2), inDays(3), inDays(9)]);
    expect(config.days[2]).toMatchObject({ rule: messages.ANY_LABEL, from: `⏳ ${messages.dayLabel(inDays(1))}18:00から` });
    expect(config).toMatchObject({ v: 1, now: NOW, intervalMin: 15, lastCheck: at(today(), '11:50'), paused: bot.store.paused });
    expect(config.nextCheck).toBe(bot.store.paused ? null : at(today(), '12:15'));
  });

  it('changes the check settings', async () => {
    await ui.handle(bot, tap('a=interval&m=30'));
    expect(bot.store.intervalMinutes).toBe(30);
    expect(replyText()).toContain(messages.intervalNote(30));
    expect(bot.wake).toHaveBeenCalled();
    await ui.handle(bot, tap('a=pause'));
    expect(bot.store.paused).toBe(true);
    expect(replyText()).toContain('Bobさん');
    await ui.handle(bot, tap('a=settings'));
    expect(cardButtons(replied()[0])[messages.RESUME]).toBeDefined();
    await ui.handle(bot, tap('a=resume'));
    expect(bot.store.paused).toBe(false);
    expect(bot.save).toHaveBeenCalledTimes(3);
  });
});

describe('errors', () => {
  it('still get a reply when unexpected', async () => {
    bot.store = null as unknown as Store & typeof bot.store; // anything that touches the store fails
    await ui.handle(bot, tap('a=settings'));
    expect(replyText()).toBe(messages.ERROR);
  });

  it('get a reply for a garbled tap', async () => {
    await ui.handle(bot, tap('a=day&d=tomorrow'));
    expect(replyText()).toBe(messages.ERROR);
    await ui.handle(bot, tap(`a=start&d=${inDays(1)}`, { time: 'noon' }));
    expect(replyText()).toBe(messages.ERROR);
  });

  it("aren't answered again when the reply failed", async () => {
    bot.line.reply.mockRejectedValue(new LineError('400 invalid reply token')); // e.g. the token expired
    await ui.handle(bot, tap('a=help'));
    expect(bot.line.reply).toHaveBeenCalledOnce();
    expect(loggedText()).toContain('invalid reply token');
  });

  it('are only logged when the error reply fails too', async () => {
    bot.store = null as unknown as Store & typeof bot.store;
    bot.line.reply.mockRejectedValue(new Error('LINE down'));
    await ui.handle(bot, tap('a=settings')); // fails, then so does the error reply
    expect(bot.line.reply).toHaveBeenCalledOnce();
    expect(loggedText()).toContain('could not send the error reply');
  });
});
