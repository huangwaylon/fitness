import { describe, expect, it } from 'vitest';
import { POND_FISH, RARE_W, freshPool, pickFresh, type PondFishId } from './pondFish.ts';
import { FISH, IN_SEASON, caption, findKind, oddsAt, pick } from './critters.ts';
import { mulberry32 } from '#lib/random.ts';
import ja from '#lib/i18n/catch.ja.json';
import en from '#lib/i18n/catch.en.json';

const tally = (month: number, hour: number, n: number, seed: number) => {
  const r = mulberry32(seed);
  const out: Partial<Record<PondFishId, number>> = {};
  for (let i = 0; i < n; i++) {
    const f = (pick(POND_FISH, month, hour, r) ?? 'crucian-carp') as PondFishId;
    out[f] = (out[f] ?? 0) + 1;
  }
  return out;
};

describe('the pond fish (NH freshwater, northern hemisphere)', () => {
  it("all 46 of NH's river, river-mouth, clifftop and pond fish, none of them a sea fish, NH's shadow sizes 1–6", () => {
    const ids = Object.keys(POND_FISH);
    expect(ids).toHaveLength(46);
    expect(ids.filter((id) => id in FISH)).toEqual([]);
    const by = (w: string) => Object.values(POND_FISH).filter((f) => f.water === w).length;
    expect([by('river'), by('mouth'), by('clifftop'), by('pond')]).toEqual([27, 3, 4, 12]);
    for (const f of Object.values(POND_FISH)) expect(f.size).toBeGreaterThanOrEqual(1), expect(f.size).toBeLessThanOrEqual(6);
    expect(POND_FISH.bitterling.size).toBe(1);
    expect(POND_FISH.arapaima.size).toBe(6);
    expect(POND_FISH.sturgeon.size).toBe(6);
  });
  it("by where you cast, NH's locations: the pond's 12 in the pond; the river's 27 in the river, at its mouth and on the clifftop, with the mouth's and the clifftop's own", () => {
    const pond = freshPool('pond'), river = freshPool('river'), mouth = freshPool('mouth'), cliff = freshPool('clifftop');
    expect(pond.filter((id) => POND_FISH[id].water === 'pond').sort()).toEqual(['carp', 'catfish', 'crawfish', 'frog', 'gar', 'giant-snakehead', 'goldfish', 'killifish', 'koi', 'pop-eyed-goldfish', 'ranchu-goldfish', 'tadpole']);
    expect(river).toHaveLength(27);
    expect(river).toContain('crucian-carp'); // NH: a river fish
    expect(river).toContain('soft-shelled-turtle');
    expect(mouth.filter((id) => !river.includes(id)).sort()).toEqual(['king-salmon', 'salmon', 'sturgeon']);
    expect(cliff.filter((id) => !river.includes(id)).sort()).toEqual(['char', 'cherry-salmon', 'golden-trout', 'stringfish']);
    // the pond's only river fish are the rare strays
    expect(pond.filter((id) => river.includes(id) || mouth.includes(id) || cliff.includes(id)).sort()).toEqual(['arapaima', 'arowana', 'dorado', 'golden-trout', 'king-salmon', 'saddled-bichir', 'stringfish', 'sturgeon']);
    // a pick keeps to its water (and someone is always about)
    const r = mulberry32(4);
    for (const wh of ['pond', 'river', 'mouth', 'clifftop'] as const)
      for (const hour of [3, 12, 20]) for (let i = 0; i < 300; i++) expect(freshPool(wh), `${wh} ${hour}`).toContain(pickFresh(wh, 7, hour, r));
    const sep = new Set(Array.from({ length: 4000 }, () => pickFresh('mouth', 9, 12, r)));
    expect(sep.has('salmon')).toBe(true);
    expect(sep.has('carp')).toBe(false);
  });
  it('seeded: the same rolls bring the same fish', () => {
    expect(tally(10, 22, 500, 3)).toEqual(tally(10, 22, 500, 3));
  });
  it('the season only weights the odds (3× in its NH months), never a gate; the hours still hold', () => {
    // the salmon runs in September (NH only then): here any month, three times likelier in September
    const sep = tally(9, 12, 40_000, 1).salmon ?? 0, mar = tally(3, 12, 40_000, 1).salmon ?? 0;
    expect(mar).toBeGreaterThan(0);
    expect(sep / mar).toBeGreaterThan(2);
    expect(oddsAt(POND_FISH.salmon, 9, 12)).toBe(POND_FISH.salmon.weight * IN_SEASON);
    expect(oddsAt(POND_FISH.koi, 6, 12)).toBe(0); // 4 pm – 9 am
    expect(oddsAt(POND_FISH.koi, 6, 20)).toBe(POND_FISH.koi.weight * IN_SEASON);
    // the piranha's two spans: midday and midnight, not the evening
    expect(oddsAt(POND_FISH.piranha, 7, 12)).toBeGreaterThan(0);
    expect(oddsAt(POND_FISH.piranha, 7, 23)).toBeGreaterThan(0);
    expect(oddsAt(POND_FISH.piranha, 7, 18)).toBe(0);
    const night = tally(7, 23, 20_000, 2), day = tally(7, 12, 20_000, 2);
    expect(night['pale-chub']).toBeUndefined(); // a day fish
    expect(day['saddled-bichir']).toBeUndefined(); // 9 pm – 4 am
    expect(night['saddled-bichir']).toBeGreaterThan(0);
  });
  it('rare is a low weight: the common carp and crucian carp far outnumber the golden trout and the stringfish', () => {
    const n = tally(11, 20, 60_000, 5);
    expect((n['crucian-carp'] ?? 0) + (n.carp ?? 0)).toBeGreaterThan(((n['golden-trout'] ?? 0) + (n.stringfish ?? 0)) * 10);
    expect(n['golden-trout']).toBeGreaterThan(0); // rare, still possible
    expect(Math.min(...Object.values(POND_FISH).map((f) => f.weight))).toBe(POND_FISH['golden-trout'].weight);
  });
  it('rare fish in the pond too (the user, 2026-11-25): the rare river fish stray in at half their odds, in their own months and hours', () => {
    const pondOf = (month: number, hour: number, n: number, seed: number) => {
      const r = mulberry32(seed), out: Partial<Record<PondFishId, number>> = {};
      for (let i = 0; i < n; i++) { const f = pickFresh('pond', month, hour, r); out[f] = (out[f] ?? 0) + 1; }
      return out;
    };
    const strays = freshPool('pond').filter((id) => POND_FISH[id].water !== 'pond');
    for (const id of strays) expect(POND_FISH[id].weight, id).toBeLessThanOrEqual(RARE_W);
    // September nights: the golden trout, the arowana, the sturgeon in season; still a rare few of the pond's shadows
    const n = 40_000, sep = pondOf(9, 20, n, 11), share = strays.reduce((s, id) => s + (sep[id] ?? 0), 0) / n;
    for (const id of ['golden-trout', 'arowana', 'sturgeon', 'dorado', 'arapaima'] as const) expect(sep[id], id).toBeGreaterThan(0);
    expect(share).toBeGreaterThan(0.03), expect(share).toBeLessThan(0.1);
    expect(sep.carp!).toBeGreaterThan((sep['golden-trout'] ?? 0) * 10);
    // their hours hold: no saddled bichir (9 pm – 4 am) at noon, no dorado (4 am – 9 pm) at 3 am
    expect(pondOf(7, 12, 20_000, 12)['saddled-bichir']).toBeUndefined();
    expect(pondOf(7, 3, 20_000, 13).dorado).toBeUndefined();
    // seeded: the same rolls bring the same fish on every phone
    expect(pondOf(11, 20, 2000, 7)).toEqual(pondOf(11, 20, 2000, 7));
  });
  it('a catch is a fish find with its name in both languages', () => {
    for (const id of Object.keys(POND_FISH) as PondFishId[]) {
      expect(findKind(id), id).toBe('fish');
      expect(caption(id), id).toEqual({ key: 'critter.caughtFish', name: `critter.name.${id}` });
      expect((ja as Record<string, string>)[`critter.name.${id}`], id).toBeTruthy();
      expect((en as Record<string, string>)[`critter.name.${id}`], id).toMatch(/^an? /);
    }
    expect(findKind('boot')).toBeNull();
    expect(findKind('wasp')).toBe('bug');
  });
});
