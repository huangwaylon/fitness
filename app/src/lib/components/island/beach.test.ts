import { describe, expect, it } from 'vitest';
import {
  BEACH, BEACH_GAP, BOTTLE_STAY, DIG_SPOTS, FOSSILS, FOSSIL_SETS, FRAGMENTS, MAX_SHELLS, NOTES, SHELLS, bottleAt, digSpots,
  fragmentsOn, shellOdds, shellsAt, zodiacOf
} from './beach.ts';
import { addDays } from '#lib/time/dates.ts';
import jaMain from '#lib/i18n/ja.json';
import enMain from '#lib/i18n/en.json';
import jaNames from '#lib/i18n/catch.ja.json';
import enNames from '#lib/i18n/catch.en.json';

const ja = { ...jaMain, ...jaNames };
const en = { ...enMain, ...enNames };

const H = 3_600_000;

describe('seeded day items: both phones see the same island', () => {
  it('the same date, time and seed give the same shells, dig spots, bottle and fragments; another day or seed differs', () => {
    expect(shellsAt('2026-11-04', 12 * H)).toEqual(shellsAt('2026-11-04', 12 * H));
    expect(digSpots('2026-11-04', new Set())).toEqual(digSpots('2026-11-04', new Set()));
    expect(fragmentsOn('2026-11-05', 3)).toEqual(fragmentsOn('2026-11-05', 3));
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

describe('the summer shell', () => {
  it('washes up all year, 3× likelier in NH’s summer (June–September), and stays rare (seeded days)', () => {
    const count = (month: string) => {
      let n = 0, all = 0;
      for (let d = 1; d <= 28; d++) for (let h = 2; h <= 23; h += 3) for (const x of shellsAt(`2026-${month}-${String(d).padStart(2, '0')}`, h * H)) (all++, (n += x.id === 'summer-shell' ? 1 : 0));
      return n / all;
    };
    const winter = count('01'), summer = count('07');
    expect(winter).toBeGreaterThan(0); // never a gate
    expect(summer / winter).toBeGreaterThan(2);
    expect(summer).toBeLessThan(0.15);
    expect(shellOdds(7).find(([id]) => id === 'summer-shell')![1]).toBe(3 * shellOdds(1).find(([id]) => id === 'summer-shell')![1]);
  });
});

describe('fossils', () => {
  it('NH’s 73: the 14 standalone ones and every piece of the 21 in sets, each once', () => {
    expect(new Set(FOSSILS).size).toBe(73);
    expect(Object.keys(FOSSIL_SETS)).toHaveLength(21);
    expect(Object.values(FOSSIL_SETS).flat()).toHaveLength(59);
    expect(FOSSIL_SETS['t-rex']).toEqual(['t-rex-skull', 't-rex-torso', 't-rex-tail']);
    expect(FOSSIL_SETS.diplo).toHaveLength(6);
    expect(FOSSIL_SETS.brachio).toHaveLength(4);
    // every piece can turn up at a dig spot (seeded days)
    const dug = new Set<string>();
    for (let d = 0; d < 2000; d++) for (const s of digSpots(addDays('2026-01-01', d), new Set())) dug.add(s.fossil);
    expect(dug.size).toBeGreaterThan(65);
  });
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
  it('n wishes, n fragments: spread along the beach (one to a stretch), each staying put as more come, the season’s zodiac now and then', () => {
    const ids = new Set<string>();
    for (let d = 1; d <= 30; d++) {
      const date = `2026-11-${String(d).padStart(2, '0')}`;
      const f = fragmentsOn(date, 8);
      expect(f).toHaveLength(8);
      for (const x of f) {
        expect(FRAGMENTS).toContain(x.id);
        ids.add(x.id);
        expect(x.x).toBeGreaterThanOrEqual(BEACH.x0), expect(x.x).toBeLessThanOrEqual(BEACH.x1);
        expect(x.y).toBeGreaterThanOrEqual(BEACH.y0 - 2), expect(x.y).toBeLessThanOrEqual(BEACH.y1);
      }
      expect(Math.min(...f.flatMap((a, i) => f.slice(i + 1).map((b) => Math.hypot(a.x - b.x, a.y - b.y)))))
        .toBeGreaterThan(20); // never piled up (the sand is deep: they spread both ways)
      expect(fragmentsOn(date, 3)).toEqual(f.slice(0, 3)); // a later wish only adds one
    }
    expect(ids).toEqual(new Set(['star-fragment', 'large-star-fragment', 'scorpius-fragment', 'sagittarius-fragment']));
    expect(fragmentsOn('2026-11-04', 0)).toEqual([]);
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
    expect(FOSSILS).toHaveLength(73);
    expect(SHELLS).toHaveLength(8);
  });
});

describe('where things lie on the beach', () => {
  const gaps = (pts: { x: number; y: number }[]) => pts.flatMap((a, i) => pts.slice(i + 1).map((b) => Math.hypot(a.x - b.x, a.y - b.y)));
  it(`shells and the bottle keep ${BEACH_GAP}u apart (never clumped or touching), across days and hours; with a fragment, nearly`, () => {
    for (const n of [0, 1]) {
      let worst = Infinity;
      for (let d = 1; d <= 28; d++) {
        const date = `2026-11-${String(d).padStart(2, '0')}`;
        const frags = fragmentsOn(date, n);
        for (let m = 6 * 60; m < 24 * 60; m += 7) {
          const ms = m * 60_000, b = bottleAt(date, ms, undefined, frags);
          worst = Math.min(worst, ...gaps([...frags, ...shellsAt(date, ms, undefined, frags), ...(b ? [b] : [])]));
        }
      }
      expect(worst, `${n} fragments`).toBeGreaterThanOrEqual(n ? 30 : BEACH_GAP);
    }
  });
  it('a crowded morning (8 fragments and the shells) still spreads them out as far as the sand allows', () => {
    const frags = fragmentsOn('2026-11-04', 8);
    expect(Math.min(...gaps([...frags, ...shellsAt('2026-11-04', 12 * H, undefined, frags)]))).toBeGreaterThan(10);
  });
  it('the bottle lies at the water’s edge, half in the foam; a new shell never moves the ones already lying there', () => {
    for (let m = 0; m < 24 * 60; m += 11) {
      const b = bottleAt('2026-11-04', m * 60_000);
      if (b) expect(b.y).toBeLessThan(BEACH.y0); // in front of the sand (the shoreline is z 0)
    }
    const s = shellsAt('2026-11-04', 15 * H);
    for (let k = 1; k < 6; k++) for (const x of shellsAt('2026-11-04', 15 * H + k * 61_000)) {
      const was = s.find((y) => y.uid === x.uid);
      if (was) expect(x).toEqual(was);
    }
  });
});
