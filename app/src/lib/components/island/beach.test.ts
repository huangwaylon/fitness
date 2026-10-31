import { describe, expect, it } from 'vitest';
import {
  BEACH, BOTTLE_STAY, DIG_SPOTS, FOSSILS, FRAGMENTS, MAX_SHELLS, NOTES, SHELLS, bottleAt, digSpots, fragmentDay, fragmentsOn,
  shellsAt, zodiacOf
} from './beach.ts';
import { addDays } from '#lib/time/dates.ts';
import ja from '#lib/i18n/ja.json';
import en from '#lib/i18n/en.json';

const H = 3_600_000;

describe('seeded day items: both phones see the same island', () => {
  it('the same date, time and seed give the same shells, dig spots, bottle and fragments; another day or seed differs', () => {
    expect(shellsAt('2026-11-04', 12 * H)).toEqual(shellsAt('2026-11-04', 12 * H));
    expect(digSpots('2026-11-04', new Set())).toEqual(digSpots('2026-11-04', new Set()));
    expect(fragmentsOn('2026-11-05')).toEqual(fragmentsOn('2026-11-05'));
    expect(shellsAt('2026-11-05', 12 * H)).not.toEqual(shellsAt('2026-11-04', 12 * H));
    expect(shellsAt('2026-11-04', 12 * H, 'other')).not.toEqual(shellsAt('2026-11-04', 12 * H));
  });
});

describe('shells', () => {
  it('wash up every 60–120 s (frequent), the newest three on the sand, each where it landed', () => {
    const s = shellsAt('2026-11-04', 12 * H);
    expect(s).toHaveLength(MAX_SHELLS);
    const gaps = s.slice(1).map((x, i) => x.at - s[i].at);
    for (const g of gaps) expect(g).toBeGreaterThanOrEqual(60_000), expect(g).toBeLessThanOrEqual(120_000);
    expect(12 * H - s[2].at).toBeLessThanOrEqual(120_000);
    for (const x of s) {
      expect(x.x).toBeGreaterThanOrEqual(BEACH.x0), expect(x.x).toBeLessThanOrEqual(BEACH.x1);
      expect(x.y).toBeGreaterThanOrEqual(BEACH.y0), expect(x.y).toBeLessThanOrEqual(BEACH.y1);
    }
    // a shell keeps its kind and place as more arrive (only the oldest leaves)
    const later = shellsAt('2026-11-04', 12 * H + 130_000);
    expect(later.find((x) => x.uid === s[2].uid)).toEqual(s[2]);
    expect(shellsAt('2026-11-04', 10_000)).toHaveLength(0); // just after midnight: none yet
  });
  it('the common ones are common (sea snails, cowries), giant clams rare', () => {
    const n: Record<string, number> = {};
    for (let d = 1; d <= 28; d++) for (const x of shellsAt(`2026-02-${String(d).padStart(2, '0')}`, 23 * H)) n[x.id] = (n[x.id] ?? 0) + 1;
    for (let h = 1; h <= 23; h++) for (const x of shellsAt('2026-03-01', h * H)) n[x.id] = (n[x.id] ?? 0) + 1;
    expect(n.cowrie + n['sea-snail']).toBeGreaterThan(n['giant-clam'] * 3);
  });
});

describe('fossils', () => {
  it('1–2 dig spots at a time on distinct lawn spots; a dug one gives way to the next', () => {
    for (let d = 1; d <= 20; d++) {
      const date = `2026-05-${String(d).padStart(2, '0')}`;
      const s = digSpots(date, new Set());
      expect(s.length).toBeGreaterThanOrEqual(1);
      expect(s.length).toBeLessThanOrEqual(2);
      expect(new Set(s.map((x) => `${x.x},${x.y}`)).size).toBe(s.length);
      for (const x of s) expect(DIG_SPOTS.some(([sx, sy]) => sx === x.x && sy === x.y)).toBe(true);
      const next = digSpots(date, new Set([s[0].uid]));
      expect(next.map((x) => x.uid)).not.toContain(s[0].uid);
      expect(next).toHaveLength(s.length);
    }
  });
});

describe('the message bottle and the star fragments', () => {
  it('a bottle drifts in every 8–14 minutes and lies there for 6', () => {
    let seen = 0, last = '';
    for (let m = 0; m < 24 * 60; m++) {
      const b = bottleAt('2026-11-04', m * 60_000);
      if (b && b.uid !== last) (seen++, (last = b.uid));
      if (b) {
        expect(m * 60_000 - b.at).toBeLessThanOrEqual(BOTTLE_STAY);
        expect(b.note).toBeLessThan(NOTES);
      }
    }
    expect(seen).toBeGreaterThan(24 * 60 / 14 - 2);
    expect(seen).toBeLessThan(24 * 60 / 8 + 2);
  });
  it('a wish lands its fragments the next morning (before dawn, that morning), 2–3 of them, the season’s zodiac now and then', () => {
    const next = (d: string) => addDays(d, 1);
    expect(fragmentDay('2026-11-04', 21, next)).toBe('2026-11-05');
    expect(fragmentDay('2026-11-05', 2, next)).toBe('2026-11-05');
    for (let d = 1; d <= 30; d++) {
      const f = fragmentsOn(`2026-11-${String(d).padStart(2, '0')}`);
      expect(f.length).toBeGreaterThanOrEqual(2);
      expect(f.length).toBeLessThanOrEqual(3);
      for (const x of f) expect(FRAGMENTS).toContain(x.id);
    }
    expect(zodiacOf('2026-11-04')).toBe('scorpius-fragment');
    expect(zodiacOf('2026-11-23')).toBe('sagittarius-fragment');
    expect(zodiacOf('2026-01-05')).toBe('capricorn-fragment');
    expect(zodiacOf('2026-12-25')).toBe('capricorn-fragment');
    expect(zodiacOf('2026-03-21')).toBe('aries-fragment');
  });
});

describe('names', () => {
  it('every shell, fossil and fragment, and every note, in both languages', () => {
    const keys = [...SHELLS.map(([id]) => id), ...FOSSILS, ...FRAGMENTS].map((id) => `beach.name.${id}`);
    keys.push(...Array.from({ length: NOTES }, (_, i) => `beach.note.${i}`));
    for (const cat of [ja, en] as Record<string, string>[]) expect(keys.filter((k) => !cat[k])).toEqual([]);
    expect(FOSSILS).toHaveLength(32);
    expect(SHELLS).toHaveLength(7);
  });
});
