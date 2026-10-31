import { describe, expect, it } from 'vitest';
import { lastSyncLine, SYNC_LATE_MS } from './format.ts';

// Tokyo is UTC+9: 2026-10-31T06:24Z = 15:24 JST on 10/31.
const now = new Date('2026-10-31T06:24:00Z');

describe('lastSyncLine (the tree popup)', () => {
  it('today: the time; yesterday: きのう and the time; older: the date; never: まだ', () => {
    expect(lastSyncLine('2026-10-31T05:10:00Z', now)).toEqual({ text: '14:10 に とどいた', late: false });
    expect(lastSyncLine('2026-10-30T12:10:00Z', now)).toEqual({ text: 'きのう 21:10', late: true });
    expect(lastSyncLine('2026-10-28T23:00:00Z', now)).toEqual({ text: '10/29', late: true });
    expect(lastSyncLine(null, now)).toEqual({ text: 'まだ とどいていません', late: true });
  });
  it('is late once the data is older than SYNC_LATE_MS', () => {
    expect(lastSyncLine(new Date(now.getTime() - SYNC_LATE_MS).toISOString(), now).late).toBe(false);
    expect(lastSyncLine(new Date(now.getTime() - SYNC_LATE_MS - 60_000).toISOString(), now).late).toBe(true);
  });
});
