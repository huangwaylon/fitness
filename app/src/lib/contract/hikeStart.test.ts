// トレイル's start times (contract/hikeStart.ts): the shape, the slot (one a slug: the latest wins), the fold (a null
// back to the plan's), and the model's (model/state.ts `hikeStarts`) in server order.
import { describe, expect, it } from 'vitest';
import { hikeStartOf, hikeStartSlot, hikeStartsOf } from './hikeStart.ts';
import { eventSlot, validEventData } from './record.ts';
import { guestMayWrite } from './guest.ts';
import { reduce } from '../model/state.ts';
import type { EventRow } from './api.ts';

const NOW = Date.parse('2026-11-22T03:00:00Z');

describe('hike_start', () => {
  it('a slug (the guide’s, or a registered hike’s u-<id>) and a start 0:00–23:59, or null; nothing else', () => {
    for (const d of [{ slug: 'kinpu-odarumi', hm: '8:30' }, { slug: 'ono-yama', hm: '07:05' }, { slug: 'u-hmhz3k2a1b2c', hm: '23:59' }, { slug: 'ono-yama', hm: '0:00' }, { slug: 'ono-yama', hm: null }])
      expect([hikeStartOf(d), validEventData('hike_start', d, NOW)], JSON.stringify(d)).toEqual([d, true]);
    for (const d of [{ slug: 'ono-yama' }, { slug: 'ono-yama', hm: '24:00' }, { slug: 'ono-yama', hm: '7:60' }, { slug: 'ono-yama', hm: '7:5' }, { slug: 'ono-yama', hm: 730 }, { slug: 'ono-yama', hm: '' },
      { slug: 'Ono', hm: '7:00' }, { slug: '-x', hm: '7:00' }, { slug: 'x'.repeat(49), hm: '7:00' }, { slug: 'ono-yama', hm: '7:00', at: NOW }, { hm: '7:00' }])
      expect([hikeStartOf(d), validEventData('hike_start', d, NOW)], JSON.stringify(d)).toEqual([null, false]);
  });

  it('one slot a slug, whoever sets it (the guest too)', () => {
    expect(hikeStartSlot({ slug: 'ono-yama', hm: '8:00' })).toBe('hike_start|ono-yama');
    expect(eventSlot('hike_start', 'A', 'A', { slug: 'ono-yama', hm: null }, NOW)).toBe('hike_start|ono-yama');
    expect(eventSlot('hike_start', 'G', 'G', { slug: 'ono-yama', hm: '9:00' }, NOW)).toBe('hike_start|ono-yama');
    expect(hikeStartSlot({ slug: 'ONO', hm: '8:00' })).toBeNull();
    expect(guestMayWrite('hike_start', { slug: 'ono-yama', hm: '9:00' })).toBe(true);
  });

  it('the fold: the last of a slug wins; a null one is the plan’s again', () => {
    const m = hikeStartsOf([{ slug: 'a', hm: '7:00' }, { slug: 'b', hm: '9:00' }, { slug: 'a', hm: '8:30' }, { slug: 'b', hm: null }]);
    expect([...m]).toEqual([['a', '8:30']]);
    expect([...hikeStartsOf([{ slug: 'a', hm: null }, { slug: 'a', hm: '6:00' }])]).toEqual([['a', '6:00']]);
  });

  it('the model keeps them in server order, anyone’s; a malformed one ignored', () => {
    let n = 0;
    const ev = (iso: string, who: 'A' | 'B' | 'G', data: object): EventRow => [iso, who, `hs${++n}`, 'hike_start', JSON.stringify(data)];
    const s = reduce({ metrics: [], events: [
      ev('2026-11-22T01:00:00.000Z', 'G', { slug: 'ono-yama', hm: '9:00' }),
      ev('2026-11-22T00:00:00.000Z', 'A', { slug: 'ono-yama', hm: '11:00' }),
      ev('2026-11-22T02:00:00.000Z', 'B', { slug: 'ono-yama', hm: '25:00' })
    ] });
    expect(s.hikeStarts).toEqual([{ slug: 'ono-yama', hm: '11:00' }, { slug: 'ono-yama', hm: '9:00' }]);
    expect(hikeStartsOf(s.hikeStarts).get('ono-yama')).toBe('9:00');
  });
});
