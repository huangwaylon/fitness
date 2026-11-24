import { describe, expect, it } from 'vitest';
import type { EventRow } from '#lib/contract/api.ts';
import { englishDue } from './due.ts';
import type { LocalDate } from '#lib/types.ts';

const row = (d: string, f = true, who = 'A'): EventRow => ['2026-11-01T00:00:00Z', who, `id${d}${f}`, 'listen', JSON.stringify({ d, g: 'tvabcdef', gm: 'tv', u: 'waitress', ms: 1000, ...(f && { f: 1 }), r: [] })] as unknown as EventRow;
const due = (rows: EventRow[], today = '2026-11-26') => englishDue(rows, 'A', today as LocalDate);

describe('englishDue (the 英語 pill dot)', () => {
  it('due with nothing done, or only a part-way row today', () => {
    expect(due([])).toBe(true);
    expect(due([row('2026-11-26', false)])).toBe(true);
  });
  it('not due once today has a まとめ', () => expect(due([row('2026-11-26')])).toBe(false));
  it('not due once this week (from Monday) has its 3 days; last week’s don’t count', () => {
    expect(due([row('2026-11-24'), row('2026-11-25'), row('2026-11-22')])).toBe(true); // 11-22 is a Sunday: last week
    expect(due([row('2026-11-24'), row('2026-11-25'), row('2026-11-24')])).toBe(true);
    expect(due([row('2026-11-24'), row('2026-11-25'), row('2026-11-27')], '2026-11-28')).toBe(false);
  });
  it('someone else’s rows never count', () => expect(due([row('2026-11-26', true, 'B')])).toBe(true));
});
