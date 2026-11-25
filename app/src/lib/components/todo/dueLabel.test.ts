import { describe, expect, it } from 'vitest';
import '#lib/i18n/todo.ts';
import { defaultTime, dueLabel, fireLine, peekOf, peekWhen } from './dueLabel.ts';
import { dueCount } from '#lib/contract/todoDue.ts';
import type { TodoItemView } from '#lib/contract/todo.ts';

const TODAY = '2026-11-20';
/** Tokyo wall clock as epoch ms. */
const at = (s: string) => Date.parse(`${s}:00+09:00`);

describe('dueLabel (the row chip)', () => {
  it('今日 15:00, 明日, a later date with its weekday, a past one by its date', () => {
    expect(dueLabel('2026-11-20T15:00', TODAY)).toBe('今日 15:00');
    expect(dueLabel('2026-11-21', TODAY)).toBe('明日');
    expect(dueLabel('2026-11-21T09:30', TODAY)).toBe('明日 9:30');
    expect(dueLabel('2026-11-24', TODAY)).toBe('11/24（火）');
    expect(dueLabel('2026-11-24T09:00', TODAY)).toBe('11/24（火）9:00');
    expect(dueLabel('2026-11-18', TODAY)).toBe('11/18（水）');
    expect(dueLabel('bad', TODAY)).toBe('');
  });
  it('the peek shows a time, a past one its date', () => {
    expect(peekWhen({ id: 'd', text: 'x', done: false, due: '2026-11-20T08:05', day: 'today' })).toBe('8:05');
    expect(peekWhen({ id: 'd', text: 'x', done: false, due: '2026-11-20', day: 'today' })).toBe('');
    expect(peekWhen({ id: 'd', text: 'x', done: false, due: '2026-11-02T09:00', day: 'past' })).toBe('11/2');
  });
});

describe('defaultTime (the form)', () => {
  it('today: the next full hour, 23:xx clamped to 23:59; another day 9:00', () => {
    expect(defaultTime(TODAY, TODAY, at('2026-11-20T14:20'))).toBe('15:00');
    expect(defaultTime(TODAY, TODAY, at('2026-11-20T08:00'))).toBe('09:00');
    expect(defaultTime(TODAY, TODAY, at('2026-11-20T23:10'))).toBe('23:59');
    expect(defaultTime('2026-11-21', TODAY, at('2026-11-20T23:10'))).toBe('09:00');
  });
});

describe('fireLine (the 通知 line)', () => {
  it('says when it fires, or that it is past', () => {
    expect(fireLine('2026-11-24', 'eve', at('2026-11-20T12:00'))).toBe('11/23（月）20:00 に通知');
    expect(fireLine('2026-11-20T15:00', 'b10', at('2026-11-20T12:00'))).toBe('11/20（金）14:50 に通知');
    expect(fireLine('2026-11-20', 'am', at('2026-11-20T12:00'))).toBe('11/20（金）8:00：もう過ぎているので通知しません');
    expect(fireLine('2026-12-01', 'eve', at('2026-11-20T12:00'))).toBe('11/30（月）20:00 に通知');
  });
});

describe('peekOf and dueCount (the HUD’s disc and peek)', () => {
  const items: TodoItemView[] = [
    { id: 'di1', text: 'ゴミ出し', ord: 0, done: false, due: '2026-11-20' },
    { id: 'di2', text: '牛乳', ord: 1, done: false, due: '2026-11-20T15:00' },
    { id: 'di3', text: '電話', ord: 2, done: false, due: '2026-11-18' },
    { id: 'd10', text: '区役所', ord: 2, done: false, due: '2026-11-02' },
    { id: 'di4', text: 'old done', ord: 3, done: true, due: '2026-11-17' },
    { id: 'di5', text: 'nodate', ord: 4, done: false },
    { id: 'di6', text: '歯医者', ord: 5, done: false, due: '2026-11-21T09:30' },
    { id: 'di7', text: '朝', ord: 6, done: false, due: '2026-11-20T08:00' },
    { id: 'di8', text: 'later', ord: 7, done: false, due: '2026-11-25' },
    { id: 'di9', text: 'done today', ord: 8, done: true, due: '2026-11-20' }
  ];
  it('the past oldest first, today timed by time then untimed, tomorrow; done, undated and later never', () => {
    const p = peekOf(items, TODAY);
    expect(p.past.map((r) => r.id)).toEqual(['d10', 'di3']);
    expect(p.today.map((r) => r.id)).toEqual(['di7', 'di2', 'di1']);
    expect(p.tomorrow.map((r) => r.id)).toEqual(['di6']);
  });
  it('a done row stays while kept (ticked with the peek up)', () => {
    expect(peekOf(items, TODAY, new Set(['di9'])).today.map((r) => r.id)).toEqual(['di7', 'di2', 'di1', 'di9']);
  });
  it('the count: undone today and before (tomorrow never); over with any before today', () => {
    expect(dueCount(items, TODAY)).toEqual({ n: 5, over: true });
    expect(dueCount(items.filter((i) => i.due !== '2026-11-18' && i.due !== '2026-11-02'), TODAY)).toEqual({ n: 3, over: false });
    expect(dueCount([items[5], items[6]], TODAY)).toEqual({ n: 0, over: false });
  });
});
