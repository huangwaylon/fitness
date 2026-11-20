// The daily check's shape (contract/checks.ts): exactly {d, k, v}, a real day, one of the three checks, true / false /
// null; its slot per sender, day and check.
import { describe, expect, it } from 'vitest';
import { CHECK_KINDS, checkOf, checkSlot } from './checks.ts';

describe('checkOf', () => {
  it('takes each check with true, false or null', () => {
    for (const k of CHECK_KINDS) for (const v of [true, false, null]) expect(checkOf({ d: '2026-11-19', k, v })).toEqual({ d: '2026-11-19', k, v });
  });
  it('refuses a missing or extra key, a bad day, another check or a value not true / false / null', () => {
    for (const d of [
      { d: '2026-11-19', k: 'face' },
      { d: '2026-11-19', k: 'face', v: true, person: 'B' },
      { d: '2026-11-19', k: 'face', x: true },
      { d: '2026-02-30', k: 'face', v: true },
      { d: '11/19', k: 'face', v: true },
      { d: '2026-11-19', k: 'yoga', v: true },
      { d: '2026-11-19', k: 'face', v: 1 },
      { d: '2026-11-19', k: 'face', v: 'true' },
      { d: '2026-11-19', k: 'face', v: undefined }
    ]) expect(checkOf(d), JSON.stringify(d)).toBeNull();
  });
});

describe('checkSlot', () => {
  it('one per sender, day and check; none for a bad check', () => {
    expect(checkSlot('A', { d: '2026-11-19', k: 'core', v: true })).toBe('check|A|2026-11-19|core');
    expect(checkSlot('B', { d: '2026-11-19', k: 'core', v: null })).toBe('check|B|2026-11-19|core');
    expect(checkSlot('A', { d: '2026-11-19', k: 'core' })).toBeNull();
  });
});
