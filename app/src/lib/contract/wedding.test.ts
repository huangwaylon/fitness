// The wedding board's contract (docs/wedding.md "The record (relay)"): the ops' shapes and cleaning, the slots, the
// merge (latest `at`, then who; a purge final), the record's rules (the guest none; a subtask under a task; a tick of a
// task held; a note saved over one it wasn't edited from keeping that one), and the phone's fold (the record's rows
// taken, its own queued ones judged).
import { describe, expect, it } from 'vitest';
import {
  WedBook, wedClean, wedConfig, wedFold, wedNote, wedOpOf, wedRowOf, wedSlot, wedTasks, newTaskId, WTASK_MAX, type WedEntry
} from './wedding.ts';
import { eventSlot, validEventData } from './record.ts';
import { guestMayWrite } from './guest.ts';

const T = Date.parse('2026-11-06T03:00:00.000Z');
type W = 'A' | 'B' | 'G';
const row = (type: string, who: W, d: Record<string, unknown>, queued = false): WedEntry => ({ ...wedRowOf(type, d, who)!, ...(queued ? { queued: true as const } : {}) });
const task = (who: W, id: string, at: number, extra: Record<string, unknown> = {}, queued = false) =>
  row('wtask', who, { id, at, c: T, title: id, cat: '', due: '2027-04-18', ...extra }, queued);

describe('the ops', () => {
  it('reads each type, its known keys only', () => {
    expect(wedOpOf('wtask', { id: 'a1', at: T, c: T, title: 'x', cat: 'Venue', due: '2027-01-01', start: '2026-12-01', del: T })).toEqual({ id: 'a1', at: T, c: T, title: 'x', cat: 'Venue', due: '2027-01-01', start: '2026-12-01', del: T });
    expect(wedOpOf('wtask', { id: 'a2', at: T, c: T, title: 'x', cat: '', parent: 'a1', imported: true })).toEqual({ id: 'a2', at: T, c: T, title: 'x', cat: '', parent: 'a1', imported: true });
    expect(wedOpOf('wtask', { id: 'a2', at: T, rm: true })).toEqual({ id: 'a2', at: T, rm: true });
    expect(wedOpOf('wdone', { id: 'a1', at: T, v: 1 })).toEqual({ id: 'a1', at: T, v: 1 });
    expect(wedOpOf('wconf', { k: 'cats', at: T, v: ['Venue', 'Food'] })).toEqual({ k: 'cats', at: T, v: ['Venue', 'Food'] });
    expect(wedOpOf('wconf', { k: 'tz', at: T, v: 'America/Los_Angeles' })).toMatchObject({ v: 'America/Los_Angeles' });
    expect(wedOpOf('wconf', { k: 'time', at: T, v: '' })).toMatchObject({ v: '' });
    expect(wedOpOf('wnote', { at: T, md: '# x\r\n', base: T - 1, was: { at: T - 1, md: 'y', who: 'B' } })).toEqual({ at: T, md: '# x\r\n', base: T - 1, was: { at: T - 1, md: 'y', who: 'B' } });
    for (const [type, d] of [
      ['wtask', { id: 'a', at: T, c: T, title: 'x', cat: '', parent: 'b', due: '2027-01-01' }],
      ['wtask', { id: 'a', at: T, c: T, title: 'x', cat: '', parent: 'a' }],
      ['wtask', { id: 'a', at: T, c: T, title: 'x '.repeat(3), cat: '' }],
      ['wtask', { id: 'a', at: T, c: T, title: 'x', cat: '', imported: false }],
      ['wtask', { id: 'a', at: 5, c: T, title: 'x', cat: '' }],
      ['wdone', { id: 'a', at: T, v: true }],
      ['wconf', { k: 'p1', at: T, v: 'x'.repeat(41) }],
      ['wconf', { k: 'tz', at: T, v: 'not a zone' }],
      ['wconf', { k: 'cats', at: T, v: ['a', 'a'] }],
      ['wnote', { at: T, md: 1 }],
      ['wnote', { at: T, md: '', was: { at: T, md: '', who: 'X' } }],
      ['other', { at: T }]
    ] as const) expect(wedOpOf(type, d as Record<string, unknown>), JSON.stringify(d)).toBeNull();
  });

  it('a phone’s op: never imported or a `was`, never over a day ahead', () => {
    const now = { now: T };
    expect(wedOpOf('wtask', { id: 'a', at: T, c: T, title: 'x', cat: '' }, now)).not.toBeNull();
    expect(wedOpOf('wtask', { id: 'a', at: T, c: T, title: 'x', cat: '', imported: true }, now)).toBeNull();
    expect(wedOpOf('wnote', { at: T, md: '', was: { at: T, md: '', who: 'A' } }, now)).toBeNull();
    expect(wedOpOf('wdone', { id: 'a', at: T + 2 * 86400_000, v: 1 }, now)).toBeNull();
    expect(validEventData('wconf', { k: 'venue', at: T, v: 'Hall' }, T)).toBe(true);
    expect(validEventData('wconf', { k: 'venue', at: T, v: 'Hall', imported: true }, T)).toBe(false);
  });

  it('cleans titles, categories and settings; the note as sent', () => {
    expect(wedClean('wtask', { id: 'a', title: '  a\u0007\nb ', cat: ' c‮ ' })).toMatchObject({ title: 'a b', cat: 'c' });
    expect(wedClean('wconf', { k: 'cats', v: [' a ', '', 'a', 'b'] })).toMatchObject({ v: ['a', 'b'] });
    expect(wedClean('wconf', { k: 'venue', v: ' The\nHall ' })).toMatchObject({ v: 'The Hall' });
    expect(wedClean('wnote', { md: ' x\r\n' })).toEqual({ md: ' x\r\n' });
  });

  it('slots: a task’s op and tick by id, a setting by key, the note one', () => {
    expect(wedSlot('wtask', { id: 'a' })).toBe('wtask|a');
    expect(eventSlot('wdone', 'A', 'A', { id: 'a' }, T)).toBe('wdone|a');
    expect(eventSlot('wconf', 'B', 'B', { k: 'date' }, T)).toBe('wconf|date');
    expect(eventSlot('wnote', 'A', 'A', {}, T)).toBe('wnote');
    expect(wedSlot('wconf', { k: 'nope' })).toBeNull();
  });

  it('the guest writes none of them', () => {
    for (const t of ['wtask', 'wdone', 'wconf', 'wnote']) expect(guestMayWrite(t, {})).toBe(false);
    expect(new WedBook().accept(task('G', 'a', T))).toEqual({ v: 'forbidden' });
  });

  it('a new task’s id is a task id', () => {
    expect(wedOpOf('wtask', { id: newTaskId(T), at: T, c: T, title: 'x', cat: '' })).not.toBeNull();
  });
});

describe('the rules', () => {
  it('latest `at` wins, then who; a purge is final and takes the tick', () => {
    const b = new WedBook();
    expect(b.apply(task('A', 'a', T)).v).toBe('append');
    expect(b.apply(task('A', 'a', T - 1)).v).toBe('stale');
    expect(b.apply(task('B', 'a', T)).v).toBe('append');
    expect(b.apply(task('A', 'a', T)).v).toBe('stale');
    expect(b.apply(row('wdone', 'A', { id: 'a', at: T, v: 1 })).v).toBe('append');
    expect(b.apply(row('wtask', 'A', { id: 'a', at: T - 5, rm: true }))).toMatchObject({ v: 'append', drop: ['wdone|a'] });
    expect(b.apply(task('B', 'a', T + 9)).v).toBe('stale');
    expect(b.apply(row('wdone', 'A', { id: 'a', at: T + 9, v: 1 })).v).toBe('stale');
    expect(wedTasks(b)).toEqual([]);
  });

  it('a subtask under a task held (not a subtask, not purged)', () => {
    const b = new WedBook();
    expect(b.apply(task('A', 's', T, { parent: 'p', due: undefined })).v).toBe('parent');
    b.apply(task('A', 'p', T));
    expect(b.apply(task('A', 's', T + 1, { parent: 'p', due: undefined })).v).toBe('append');
    expect(b.apply(task('A', 'g', T + 2, { parent: 's', due: undefined })).v).toBe('parent');
  });

  it('a subtask whose parent was purged (added while the parent was being purged) stays editable and deletable', () => {
    const b = new WedBook();
    b.apply(task('A', 'p', T, { del: T }));
    // B adds a subtask under the deleted task as A purges it
    expect(b.apply(task('B', 's', T + 1, { parent: 'p', due: undefined })).v).toBe('append');
    expect(b.apply(row('wtask', 'A', { id: 'p', at: T + 2, rm: true })).v).toBe('append');
    expect(b.apply(task('B', 's', T + 3, { parent: 'p', due: undefined, title: 'renamed' })).v).toBe('append');
    expect(b.apply(task('B', 's', T + 4, { parent: 'p', due: undefined, del: T + 4 })).v).toBe('append');
    expect(b.apply(row('wtask', 'B', { id: 's', at: T + 5, rm: true })).v).toBe('append');
    // its parent dropped (the purging phone's set): a task of its own
    b.apply(task('B', 't', T + 6, { parent: 'q', due: undefined }));
    b.apply(task('A', 'q', T + 6));
    expect(b.apply(task('B', 't', T + 7, { parent: 'q', due: undefined })).v).toBe('append');
    expect(b.apply(task('A', 't', T + 8, { due: undefined })).v).toBe('append');
    // but a set can't move one under a purged task, and a stale edit of a purged subtask doesn't bring it back
    expect(b.apply(task('A', 't', T + 9, { parent: 'p', due: undefined })).v).toBe('parent');
    expect(b.apply(task('A', 'u', T + 9, { parent: 'p', due: undefined })).v).toBe('parent');
    expect(b.apply(task('A', 's', T + 99, { parent: 'p', due: undefined })).v).toBe('stale');
    expect(wedTasks(b).map((t) => [t.id, t.parentId]).sort()).toEqual([['q', ''], ['t', '']]);
  });

  it('a tick of a task not held is stale; the cap', () => {
    const b = new WedBook();
    expect(b.apply(row('wdone', 'B', { id: 'x', at: T, v: 1 })).v).toBe('stale');
    expect(b.accept(task('A', 'new', T), WTASK_MAX)).toEqual({ v: 'full' });
    b.apply(task('A', 'old', T));
    expect(b.accept(task('A', 'old', T + 1), WTASK_MAX).v).toBe('append');
  });

  it('a note saved over one it was not edited from keeps that one (`was`); a matching save drops it', () => {
    const b = new WedBook();
    b.apply(row('wnote', 'A', { at: T, md: 'one' }));
    b.apply(row('wnote', 'B', { at: T + 1, md: 'two', base: T }));
    expect(wedNote(b)).toEqual({ at: T + 1, md: 'two', base: T, who: 'B' });
    b.apply(row('wnote', 'A', { at: T + 2, md: 'three', base: T }));
    expect(wedNote(b)).toEqual({ at: T + 2, md: 'three', base: T, was: { at: T + 1, md: 'two', who: 'B' }, who: 'A' });
    b.apply(row('wnote', 'B', { at: T + 3, md: 'four', base: T + 2 }));
    expect(wedNote(b)?.was).toBeUndefined();
  });

  it('a save that loses on `at` to a note it was not edited from is kept, restamped after it, that one beside it', () => {
    const b = new WedBook();
    b.apply(row('wnote', 'A', { at: T, md: 'one' }));
    // B saved at T + 5 from `one`; A's offline save (stamped T + 2, from `one`) arrives after it
    b.apply(row('wnote', 'B', { at: T + 5, md: 'B’s', base: T }));
    expect(b.apply(row('wnote', 'A', { at: T + 2, md: 'A’s', base: T }))).toMatchObject({ v: 'append' });
    expect(wedNote(b)).toEqual({ at: T + 6, md: 'A’s', base: T, was: { at: T + 5, md: 'B’s', who: 'B' }, who: 'A' });
    // an older save of the same text, or one edited from the held note, changes nothing
    expect(b.apply(row('wnote', 'B', { at: T + 1, md: 'A’s', base: T })).v).toBe('stale');
    expect(b.apply(row('wnote', 'A', { at: T + 6, md: 'x', base: T + 6 })).v).toBe('stale');
  });
});

describe('the phone’s fold', () => {
  it('takes the record’s rows as they are (a tick before its task, a subtask whose parent it never saw) and judges only the queued', () => {
    const b = wedFold([
      row('wdone', 'A', { id: 'p', at: T - 10, v: 1 }),
      task('A', 's', T - 5, { parent: 'p', due: undefined }),
      task('A', 'p', T),
      row('wconf', 'B', { k: 'p1', at: T, v: 'はなこ' }),
      // queued: an edit, a tick of a task not held (dropped), a subtask under nothing (dropped), the guest's (dropped)
      task('B', 'p', T + 1, { title: 'Hall' }, true),
      row('wdone', 'A', { id: 'zz', at: T + 2, v: 1 }, true),
      task('A', 's2', T + 3, { parent: 'nope', due: undefined }, true),
      task('G', 'g', T + 4, {}, true)
    ]);
    expect(wedTasks(b).map((t) => [t.id, t.title, t.parentId, !!t.doneAt]).sort()).toEqual([['p', 'Hall', '', true], ['s', 's', 'p', false]]);
    expect(wedConfig(b)).toEqual({ p1: 'はなこ' });
  });

  it('reads a task as the old board’s rows (ISO stamps, empty strings)', () => {
    const b = wedFold([task('A', 'p', T, { del: T + 1, start: '2027-01-01', imported: true }), row('wdone', 'A', { id: 'p', at: T + 2, v: 1 })]);
    expect(wedTasks(b)).toEqual([{
      id: 'p', title: 'p', category: '', due: '2027-04-18', start: '2027-01-01', doneAt: new Date(T + 2).toISOString(), doneBy: 'A', createdAt: new Date(T).toISOString(),
      deletedAt: new Date(T + 1).toISOString(), parentId: ''
    }]);
  });
  it('two note saves crossing in flight: a conflict on the phone whichever the record took first', () => {
    const one = row('wnote', 'A', { at: T, md: 'one' });
    const a = row('wnote', 'A', { at: T + 1, md: 'A’s', base: T }), b = row('wnote', 'B', { at: T + 2, md: 'B’s', base: T });
    // A's phone: B's save reached the record first, A's still queued; B's phone: the other way about
    const onA = wedNote(wedFold([one, b, { ...a, queued: true }]))!;
    const onB = wedNote(wedFold([one, a, { ...b, queued: true }]))!;
    expect([onA.md, onA.was?.md]).toEqual(['A’s', 'B’s']);
    expect([onB.md, onB.was?.md]).toEqual(['B’s', 'A’s']);
  });

  it('names who ticked a task, never for the old Sheet’s tick (it never recorded who)', () => {
    const b = wedFold([task('A', 'p', T), task('A', 'q', T), row('wdone', 'B', { id: 'p', at: T + 2, v: 1 }), row('wdone', 'A', { id: 'q', at: T + 2, v: 1, imported: true })]);
    expect(wedTasks(b).map((t) => [t.id, t.doneBy]).sort()).toEqual([['p', 'B'], ['q', '']]);
  });
});
