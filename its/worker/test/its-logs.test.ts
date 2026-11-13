// scripts/its-logs.ts's pure parts: which ids are the run's, the Worker's rows for it, the private log's times (ISO with
// offset, or an older HH:MM:SS in UTC rolled over at midnight), the merge and the Tokyo-time lines.
import { describe, expect, it } from 'vitest';
import example from '../../contract-example.json';
import type { ItsStatus } from '../../../app/src/lib/its/contract.ts';
import { format, isRun, logRows, merge, parseRun, workerRows } from '../scripts/its-logs.ts';

describe('the run asked for', () => {
  it('is <run> or <run>-<attempt>', () => {
    expect(parseRun('19283746')).toEqual({ run: '19283746', attempt: null });
    expect(parseRun('19283746-2')).toEqual({ run: '19283746', attempt: '2' });
    for (const bad of [undefined, '', 'abc', '1-2-3', '19283746-']) expect(parseRun(bad), String(bad)).toBeNull();
  });
  it('a run alone matches every attempt; an attempt only itself', () => {
    const run = parseRun('100')!;
    expect(['100', '100-1', '100-2'].map((id) => isRun(id, run))).toEqual([true, true, true]);
    expect(isRun('1000-1', run)).toBe(false);
    const att = parseRun('100-2')!;
    expect(['100-1', '100-2', '100'].map((id) => isRun(id, att))).toEqual([false, true, false]);
  });
});

describe('the Worker’s rows', () => {
  it('this run’s events and bookings, and a prev_unclean naming it', () => {
    const s = structuredClone(example.status) as unknown as ItsStatus;
    s.events.push({ runId: '555-1', seq: 0, t: s.now, kind: 'prev_unclean', detail: '19283746' }, { runId: '555-1', seq: 1, t: s.now, kind: 'run_start' });
    const rows = workerRows(s, parseRun('19283746')!);
    expect(rows.map((r) => [r.src, r.text.split(' ').slice(0, 2).join(' ')])).toEqual([
      ['event', '#4 human_needed'], ['event', '#3 hold'], ['event', '#0 prev_unclean'], ['booking', 'hold 2026-11-22'],
    ]);
    expect(workerRows(s, parseRun('42')!)).toEqual([]);
  });
});

describe('the private log', () => {
  it('reads ISO times with an offset; a line without one takes the line before’s', () => {
    const rows = logRows('2026-11-13T12:00:01.250+09:00 scan ok\nTraceback (most recent call last):\n\n2026-11-13T03:00:02Z hold', null);
    expect(rows).toEqual([
      { t: Date.parse('2026-11-13T03:00:01.250Z'), src: 'log', order: 0, text: 'scan ok' },
      { t: Date.parse('2026-11-13T03:00:01.250Z'), src: 'log', order: 1, text: 'Traceback (most recent call last):' },
      { t: Date.parse('2026-11-13T03:00:02Z'), src: 'log', order: 3, text: 'hold' },
    ]);
  });
  it('reads an older runner’s HH:MM:SS as UTC on the run’s start day, rolled over at midnight', () => {
    const start = Date.parse('2026-11-13T23:58:00Z');
    const rows = logRows('23:59:58 a\n00:00:03 b', start);
    expect(rows.map((r) => r.t)).toEqual([Date.parse('2026-11-13T23:59:58Z'), Date.parse('2026-11-14T00:00:03Z')]);
    expect(logRows('12:00:00 a', null)[0]).toMatchObject({ t: null, text: '12:00:00 a' });   // no day to put it on
  });
});

describe('the timeline', () => {
  it('merges oldest first, stable among equal times, in Tokyo time with a line per day', () => {
    const t = Date.parse('2026-11-13T14:59:59Z');   // 23:59:59 JST
    const rows = merge([
      { t: t + 2000, src: 'log', order: 5, text: 'later' },
      { t, src: 'log', order: 2, text: 'b' },
      { t, src: 'event', order: 3, text: '#3 hold' },
      { t, src: 'log', order: 1, text: 'a' },
      { t: null, src: 'log', order: 0, text: 'before any time' },
    ]);
    expect(rows.map((r) => r.text)).toEqual(['before any time', '#3 hold', 'a', 'b', 'later']);
    expect(format(rows)).toEqual([
      '             log     before any time',
      '── 2026-11-13 (JST)',
      '23:59:59.000 event   #3 hold',
      '23:59:59.000 log     a',
      '23:59:59.000 log     b',
      '── 2026-11-14 (JST)',
      '00:00:01.000 log     later',
    ]);
  });
});
