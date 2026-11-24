import { describe, expect, it } from 'vitest';
import { QUIET_MS, urgentIn, waitMs } from '../../scripts/deploy-quiet.ts';
import { KEEP_MS, plan } from '../../scripts/deploy-keep.ts';

describe('the deploy\'s quiet window (scripts/deploy-quiet.ts)', () => {
  const now = 10 * QUIET_MS;
  it('waits till QUIET_MS after the live deployment, never more, nothing past it', () => {
    expect(waitMs({ now, liveAt: now - 5 * 60_000, urgent: false })).toBe(QUIET_MS - 5 * 60_000);
    expect(waitMs({ now, liveAt: now - QUIET_MS, urgent: false })).toBe(0);
    expect(waitMs({ now, liveAt: now - 3 * QUIET_MS, urgent: false })).toBe(0);
    expect(waitMs({ now, liveAt: now + 60_000, urgent: false }), 'a clock ahead: QUIET_MS at most').toBe(QUIET_MS);
  });
  it('urgent, or the live deployment unknown: no wait', () => {
    expect(waitMs({ now, liveAt: now - 60_000, urgent: true })).toBe(0);
    expect(waitMs({ now, liveAt: null, urgent: false })).toBe(0);
    expect(waitMs({ now, liveAt: Number.NaN, urgent: false })).toBe(0);
  });
  it('an Urgent: trailer line in any commit since the live one', () => {
    expect(urgentIn('Fix the sync queue.\n\nUrgent: rows dropped on both phones\n\nnext commit')).toBe(true);
    expect(urgentIn('a\n\nurgent: yes')).toBe(true);
    expect(urgentIn('Not urgent: just docs')).toBe(false);
    expect(urgentIn('')).toBe(false);
  });
});

describe('the deploy keeps older builds\' hashed files (scripts/deploy-keep.ts)', () => {
  const now = 100 * KEEP_MS;
  it('this build\'s files at now; older ones within KEEP_MS copied, the latest first, MAX at most; never outside _app/immutable', () => {
    const own = ['_app/immutable/chunks/a.1.js', '_app/immutable/chunks/b.2.js'];
    const live = {
      '_app/immutable/chunks/a.1.js': now - 10,
      '_app/immutable/chunks/a.0.js': now - 1000,
      '_app/immutable/chunks/c.0.js': now - 500,
      '_app/immutable/chunks/old.js': now - KEEP_MS - 1,
      'index.html': now,
      '_app/immutable/../../x.js': now
    };
    const { kept, copy } = plan(own, live, now);
    expect(copy).toEqual(['_app/immutable/chunks/c.0.js', '_app/immutable/chunks/a.0.js']);
    expect(kept).toEqual({ '_app/immutable/chunks/a.1.js': now, '_app/immutable/chunks/b.2.js': now, '_app/immutable/chunks/c.0.js': now - 500, '_app/immutable/chunks/a.0.js': now - 1000 });
    expect(plan(own, live, now, KEEP_MS, 1).copy).toEqual(['_app/immutable/chunks/c.0.js']);
    expect(plan(own, {}, now).copy, 'no kept.json live (the first deploy with it)').toEqual([]);
  });
});
