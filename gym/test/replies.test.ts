// Old cards keep working, word for word: a corpus of LINE taps (every postback the cards send, valid, refused and
// garbled, over a store with days set) driven through ui.handle, each reply and the state after it compared with
// replies.snap.json, recorded from the bot before the taps and the app shared one code path (actions.apply).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CheckFailed, PROGRAMS, type Slot } from '../src/hacomono.ts';
import { ANY, SKIP } from '../src/store.ts';
import { at } from '../src/time.ts';
import * as ui from '../src/ui.ts';
import { GROUP, NOON, NOW, fakeBot, inDays, today } from './fakeBot.ts';

type Json = Record<string, any>;

const tap = (data: string, params: Json = {}): Json =>
  ({ type: 'postback', replyToken: 'rt', source: { type: 'group', groupId: GROUP, userId: 'U1' }, postback: { data, params } });
const picked = (day: string, clock: string): string => `${day}T${clock}`;

/** [name, the tap, what to arrange first]: run in order on one bot, so later taps see earlier changes. */
const corpus = (): [string, Json, ((bot: ReturnType<typeof fakeBot>) => void)?][] => [
  ['menu', tap('a=menu')],
  ['help', tap('a=help')],
  ['status', tap('a=status')],
  ['settings', tap('a=settings')],
  ['days', tap('a=days')],
  ['day today', tap(`a=day&d=${today()}`)],
  ['day +2 (old date picker)', tap('a=day', { date: inDays(2) })],
  ['day with settings', tap(`a=day&d=${inDays(1)}`)],
  ['start 14:00', tap(`a=start&d=${inDays(1)}`, { time: '14:00' })],
  ['start 21:30', tap(`a=start&d=${inDays(1)}`, { time: '21:30' })],
  ['range 14–16', tap(`a=range&d=${inDays(1)}&s=14:00`, { time: '16:00' })],
  ['range again (unchanged)', tap(`a=range&d=${inDays(1)}&s=14:00`, { time: '16:00' })],
  ['range odd minutes', tap(`a=range&d=${inDays(5)}&s=14:17`, { time: '15:43' })],
  ['range backwards', tap(`a=range&d=${inDays(1)}&s=14:00`, { time: '14:20' })],
  ['range default (usual)', tap(`a=range&d=${inDays(2)}&s=12:00`, { time: '13:00' })],
  ['any +10', tap(`a=any&d=${inDays(10)}`)],
  ['any +10 again', tap(`a=any&d=${inDays(10)}`)],
  ['skip +1', tap(`a=skip&d=${inDays(1)}`)],
  ['skip +11', tap(`a=skip&d=${inDays(11)}`)],
  ['from +10 ok', tap(`a=from&d=${inDays(10)}`, { datetime: picked(inDays(9), '18:00') })],
  ['from passed', tap(`a=from&d=${inDays(10)}`, { datetime: picked(today(), '09:00') })],
  ['from after day', tap(`a=from&d=${inDays(2)}`, { datetime: picked(inDays(3), '09:00') })],
  ['from after window (usual)', tap(`a=from&d=${inDays(3)}`, { datetime: picked(inDays(3), '12:30') })],
  ['from on 🔕 day', tap(`a=from&d=${inDays(11)}`, { datetime: picked(inDays(11), '09:00') })],
  ['from on 💤 day', tap(`a=from&d=${inDays(12)}`, { datetime: picked(inDays(12), '11:00') })],
  ['unfrom', tap(`a=unfrom&d=${inDays(10)}`)],
  ['unfrom again', tap(`a=unfrom&d=${inDays(10)}`)],
  ['reset with announced', tap(`a=reset&d=${inDays(2)}`), (b) => b.store.markNotified([at(inDays(2), '12:00')])],
  ['reset nothing', tap(`a=reset&d=${inDays(3)}`)],
  ['reset rule', tap(`a=reset&d=${inDays(10)}`)],
  ['past day', tap(`a=skip&d=${inDays(-1)}`)],
  ['past day range', tap(`a=range&d=${inDays(-1)}&s=12:00`, { time: '13:00' })],
  ['past day card', tap(`a=day&d=${inDays(-1)}`)],
  ['interval 30', tap('a=interval&m=30')],
  ['interval 30 again', tap('a=interval&m=30')],
  ['interval 7', tap('a=interval&m=7')],
  ['pause', tap('a=pause')],
  ['pause again', tap('a=pause')],
  ['check while paused', tap('a=check')],
  ['menu while paused', tap('a=menu')],
  ['status while paused', tap('a=status')],
  ['resume', tap('a=resume')],
  ['check: none open', tap('a=check')],
  ['check: cooldown', tap('a=check'), () => vi.setSystemTime(NOW + 20_000)],
  ['check: open slots', tap('a=check'), (b) => {
    vi.setSystemTime(NOW + 120_000);
    const slots: Slot[] = [{ program: PROGRAMS[0], start: at(inDays(1), '12:00') }, { program: PROGRAMS[1], start: at(inDays(1), '12:00') }];
    b.runCheck.mockResolvedValueOnce(slots);
  }],
  ['check: partial', tap('a=check'), (b) => {
    vi.setSystemTime(NOW + 240_000);
    b.runCheck.mockRejectedValueOnce(new CheckFailed([new Error('down')], [{ program: PROGRAMS[0], start: at(inDays(2), '18:00') }], false));
  }],
  ['check: site down', tap('a=check'), (b) => {
    vi.setSystemTime(NOW + 360_000);
    b.runCheck.mockRejectedValueOnce(new CheckFailed([new Error('a'), new Error('b')], [], true));
  }],
  ['check: running', tap('a=check'), (b) => { vi.setSystemTime(NOW + 480_000); b.checking = true; }],
  ['unknown', tap('a=something-new'), (b) => { b.checking = false; }],
  ['garbled day', tap('a=day&d=tomorrow')],
  ['garbled time', tap(`a=start&d=${inDays(1)}`, { time: 'noon' })],
  ['status at the end', tap('a=status'), (b) => { b.failures = 1; b.lastCheck = at(today(), '11:50'); }],
];

let bot: ReturnType<typeof fakeBot>;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  for (const level of ['log', 'warn', 'error'] as const) vi.spyOn(console, level).mockImplementation(() => {});
  bot = fakeBot();
  bot.store.setRule(inDays(1), NOON, today());
  bot.store.setCheckFrom(inDays(1), at(inDays(1), '09:00'), today());
  bot.store.setRule(inDays(4), ANY, today());
  bot.store.setRule(inDays(6), SKIP, today());
});
afterEach(() => vi.restoreAllMocks());

describe('LINE replies', () => {
  it('are what they were, tap for tap', async () => {
    const seen: Record<string, unknown> = {};
    for (const [name, event, arrange] of corpus()) {
      arrange?.(bot);
      bot.line.reply.mockClear();
      await ui.handle(bot, event);
      seen[name] = { reply: bot.line.reply.mock.calls.map((c) => c[1]), state: bot.store.toJSON() };
    }
    await expect(JSON.stringify(seen, null, 1)).toMatchFileSnapshot('./replies.snap.json');
  });
});
