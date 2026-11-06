// The bug wing's pick (bugShow.ts): at most ten of the bugs caught, none twice, the same on every phone for an hour and
// a new ten the next; each in a place of its own (bugLife.ts slotsOf), no two taking one spot. Where those places lie
// (none meets another's room): bugLife.test.ts.
import { describe, expect, test } from 'vitest';
import { findKey, type FirstFind } from '#lib/model/finds.ts';
import { BUGS_SHOWN, bugsOnDisplay, type Shown } from './bugShow.ts';
import { slotsOf } from './bugLife.ts';
import { BUG_IDS, hourOf, onShow, type Habitat } from './species.ts';

const found: FirstFind = { date: '2026-11-04', at: 1.8e12, person: 'A' };
const showOf = (ids: readonly string[]) => onShow(new Map(ids.map((id) => [findKey('bug', id), found])));
const all = showOf(BUG_IDS);
const h0 = hourOf(Date.parse('2026-11-04T00:00+09:00'));
const ids = (l: Shown[]) => l.map((s) => `${s.sp.id}@${s.slot}`);

describe('the hour’s bugs (bugShow.ts)', () => {
  test('ten at most, only what was caught, none twice; each in a place of its own (no spot taken twice)', () => {
    expect(BUGS_SHOWN).toBe(10);
    const out: string[] = [];
    for (const caught of [all, all.filter((_, i) => i % 3 === 0), all.slice(0, 12)]) {
      for (let h = 0; h < 72; h++) {
        const pick = bugsOnDisplay(caught, h0 + h);
        if (pick.length > BUGS_SHOWN) out.push(`${h}: ${pick.length}`);
        // (with plenty caught, a full ten)
        if (caught.length >= 20 && pick.length < BUGS_SHOWN) out.push(`${h}: only ${pick.length}`);
        const seen = new Set<string>(), spots = new Set<string>();
        for (const { sp, slot } of pick) {
          if (!caught.includes(sp)) out.push(`${h}: ${sp.id} not caught`);
          if (seen.has(sp.id)) out.push(`${h}: ${sp.id} twice`);
          seen.add(sp.id);
          const place = slotsOf(sp.id, sp.tank as Habitat).find((s) => s.i === slot);
          if (!place) out.push(`${h}: ${sp.id} in no place of its own (${slot})`);
          for (const t of place?.takes ?? []) {
            if (spots.has(t)) out.push(`${h}: ${sp.id} on ${t}, taken`);
            spots.add(t);
          }
        }
      }
    }
    expect(out).toEqual([]);
  });
  test('the same ten on every phone through the hour (whatever order the finds came in), a new ten the next; over a day most are seen', () => {
    const h = hourOf(Date.parse('2026-11-04T12:00+09:00'));
    expect(ids(bugsOnDisplay(all, h))).toEqual(ids(bugsOnDisplay([...all].reverse(), h)));
    expect(h).toBe(hourOf(Date.parse('2026-11-04T12:59+09:00')));
    expect(ids(bugsOnDisplay(all, h + 1))).not.toEqual(ids(bugsOnDisplay(all, h)));
    const seen = new Set<string>();
    for (let k = 0; k < 24; k++) for (const s of bugsOnDisplay(all, h + k)) seen.add(s.sp.id);
    expect(seen.size).toBeGreaterThan(all.length * 0.75);
  });
  test('a few caught, a place each: all of them on show (two butterflies in two airs, two crickets on two patches)', () => {
    const few = showOf(['common-butterfly', 'monarch-butterfly', 'cricket', 'bell-cricket', 'tarantula', 'robust-cicada', 'pondskater']);
    for (let k = 0; k < 24; k++) {
      const pick = bugsOnDisplay(few, h0 + k);
      expect(pick.map((s) => s.sp.id).sort()).toEqual(few.map((s) => s.id).sort());
      const air = pick.filter((s) => s.sp.tank === 'fly').map((s) => s.slot), grass = pick.filter((s) => s.sp.tank === 'hop').map((s) => s.slot);
      expect(new Set(air).size).toBe(2);
      expect(new Set(grass).size).toBe(2);
    }
    expect(bugsOnDisplay([], h0)).toEqual([]);
  });
  test('more of a kind than its places: the rest wait for another hour (four dragonflies and the firefly: the pond’s air in two halves, one each)', () => {
    const pond = showOf(['darner-dragonfly', 'banded-dragonfly', 'red-dragonfly', 'damselfly', 'firefly']);
    for (let k = 0; k < 24; k++) {
      const pick = bugsOnDisplay(pond, h0 + k);
      expect(pick.length).toBe(2);
      expect(pick.map((s) => s.slot).sort()).toEqual([0, 1]);
    }
  });
});
