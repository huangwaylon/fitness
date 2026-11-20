import { describe, expect, it } from 'vitest';
import '#lib/i18n/todo.ts';
import { defaultTime, dueLabel, duePanelOf, fireLine, panelEmpty, panelWhen } from './dueLabel.ts';
import type { TodoListView } from '#lib/contract/todo.ts';

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
  it('the panel shows only a time', () => {
    expect(panelWhen('2026-11-20T08:05')).toBe('8:05');
    expect(panelWhen('2026-11-20')).toBe('');
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

describe('duePanelOf (the menu panel)', () => {
  const lists: TodoListView[] = [
    { id: 'dl1', title: '家', ord: 0, items: [
      { id: 'di1', text: 'ゴミ出し', ord: 0, done: false, due: '2026-11-20' },
      { id: 'di2', text: '牛乳', ord: 1, done: false, due: '2026-11-20T15:00' },
      { id: 'di3', text: '電話', ord: 2, done: false, due: '2026-11-18' },
      { id: 'di4', text: 'old done', ord: 3, done: true, due: '2026-11-17' },
      { id: 'di5', text: 'nodate', ord: 4, done: false }
    ] },
    { id: 'dl2', title: '外', ord: 1, items: [
      { id: 'di6', text: '歯医者', ord: 0, done: false, due: '2026-11-21T09:30' },
      { id: 'di7', text: '朝', ord: 1, done: false, due: '2026-11-20T08:00' },
      { id: 'di8', text: 'later', ord: 2, done: false, due: '2026-11-25' },
      { id: 'di9', text: 'done today', ord: 3, done: true, due: '2026-11-20' }
    ] }
  ];
  it('today timed by time then untimed, tomorrow, past counted (undone only), undated and later never', () => {
    const p = duePanelOf(lists, TODAY);
    expect(p.today.map((r) => r.id)).toEqual(['di7', 'di2', 'di1']);
    expect(p.tomorrow.map((r) => r.id)).toEqual(['di6']);
    expect(p.past).toBe(1);
  });
  it('a done row stays while kept (ticked with the menu open)', () => {
    expect(duePanelOf(lists, TODAY, new Set(['di9'])).today.map((r) => r.id)).toEqual(['di7', 'di2', 'di1', 'di9']);
  });
  it('empty: nothing due', () => {
    expect(panelEmpty(duePanelOf([{ id: 'dl1', title: 'x', ord: 0, items: [{ id: 'di1', text: 'a', ord: 0, done: false }] }], TODAY))).toBe(true);
    expect(panelEmpty(duePanelOf(lists, TODAY))).toBe(false);
  });
});
