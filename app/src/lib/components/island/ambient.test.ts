import { describe, expect, it } from 'vitest';
import { shuffle, seeded } from '#lib/random.ts';
import type { PersonId as Who } from '#lib/types.ts';
import {
  DECIDE_MS, HOLD_SLOTS, SLOT_MS, SLOTS_PER_DAY, WANDER_REACH_U, crittersAt, held, msToNextSlot, slotAt, slotRand, slotStart, spawnRand,
  bugRivals, villagerBeats, type AmbientWorld, type Poi, type Spawn, type VillagerBeat
} from './ambient.ts';
import { FISH, pickBug, pickFish } from './critters.ts';
import { pickAct } from './visitorLife.ts';
import { SPOT_MIN, bugPath, critterId } from './critterPath.ts';

/** The critters coming in `slot`. */
const spawnsIn = (date: string, slot: number, coasts = 1): Spawn[] => crittersAt(date, slot, coasts).filter((s) => s.slot === slot);

const DATE = '2026-11-01';
const T0 = Date.parse('2026-11-01T00:00:00+09:00');

const POIS: Poi[] = [
  { node: 'treeA', at: [62, 350] }, { node: 'treeB', at: [330, 350] }, { node: 'rock', at: [112, 500] },
  { node: 'shoreL', at: [100, 20] }, { node: 'shoreR', at: [290, 20] }, { node: 'centreStage', at: [195, 900] },
  { node: 'museumDoor', at: [190, 1620] }
];

function world(o: Partial<AmbientWorld> = {}): AmbientWorld {
  return {
    villagers: { A: { at: [132, 214], home: [132, 214], free: true }, B: { at: [262, 214], home: [262, 214], free: true } },
    pois: POIS,
    phase: 'day',
    scores: { A: 50, B: 50 },
    ...o
  };
}

const day = (w: AmbientWorld, from = 0, to = SLOTS_PER_DAY) => Array.from({ length: to - from }, (_, i) => villagerBeats(w, DATE, from + i));
const beats = (slots: ReturnType<typeof day>) => slots.flatMap((s) => Object.entries(s) as [Who, VillagerBeat][]);

describe('ambient life: the slot clock', () => {
  it('cuts the Tokyo day into 8,640 slots of 10 s, with the hour and month', () => {
    expect(slotAt(T0)).toEqual({ date: DATE, slot: 0, into: 0, hour: 0, month: 11 });
    expect(slotAt(T0 - 1)).toEqual({ date: '2026-10-31', slot: SLOTS_PER_DAY - 1, into: SLOT_MS - 1, hour: 23, month: 10 });
    expect(slotAt(T0 + 13.5 * 3600_000 + 4_321)).toEqual({ date: DATE, slot: 13.5 * 360, into: 4_321, hour: 13, month: 11 });
  });

  it('corrects the device clock by the relay offset, so two phones whose clocks disagree share the slot', () => {
    const relay = T0 + 7 * 3600_000 + 2_500;
    const fast = relay + 4_000, slow = relay - 9_000; // device clocks; offset = serverNow − Date.now
    expect(slotAt(fast, relay - fast)).toEqual(slotAt(slow, relay - slow));
    expect(slotAt(fast).slot).not.toBe(slotAt(slow).slot);
    expect(msToNextSlot(fast, relay - fast)).toBe(7_500);
  });

  it('slotStart is where slotAt begins a slot, on whole 10 s of the epoch', () => {
    for (const ms of [T0, T0 + 1, T0 + 86_399_999, Date.parse('2027-03-01T05:06:07.890Z')]) {
      const s = slotAt(ms);
      expect(slotStart(s.date, s.slot)).toBe(ms - s.into);
      expect(slotStart(s.date, s.slot) % SLOT_MS).toBe(0);
    }
  });

  it('gives each slot and kind its own PRNG, the same on every phone (the visitor beats from it)', () => {
    const draw = (kind: string, slot = 100) => Array.from({ length: 5 }, slotRand(DATE, slot, kind));
    expect(draw('visitor')).toEqual(draw('visitor'));
    expect(draw('visitor')).not.toEqual(draw('host'));
    expect(draw('visitor')).not.toEqual(draw('visitor', 101));
    const beat = () => pickAct('daisy-mae', { speaking: false, asleep: false, walking: false, away: false, sinceMeet: Infinity, villagerFree: true }, slotRand(DATE, 4321, 'visitor'));
    expect(beat()).toBe(beat());
  });
});

describe('ambient life: the same on both phones', () => {
  it('gives the same beats for the same date, slot and world, whichever phone and however often asked', () => {
    const a = day(world(), 4000, 4400);
    // the other phone: its own copy of the world, its points of interest listed in another order
    const w2 = structuredClone(world());
    w2.pois = shuffle([...POIS], seeded('other phone'));
    expect(day(w2, 4000, 4400)).toEqual(a);
    expect(day(world(), 4000, 4400)).toEqual(a);
  });

  it('varies with the slot and the date', () => {
    const a = JSON.stringify(day(world(), 4000, 4100));
    expect(JSON.stringify(day(world(), 4100, 4200))).not.toBe(a);
    expect(JSON.stringify(Array.from({ length: 100 }, (_, i) => villagerBeats(world(), '2026-11-02', 4000 + i)))).not.toBe(a);
  });

  it('computes a whole day, villagers and critters, in well under a second (one slot per 10 s on a phone)', () => {
    const t = performance.now();
    day(world());
    for (let s = 0; s < SLOTS_PER_DAY; s++) spawnsIn(DATE, s);
    expect(performance.now() - t).toBeLessThan(1500);
  });
});

describe('ambient life: the villagers', () => {
  it('mixes outings, small moves and pair moves through the day, one villager a slot (both for a pair)', () => {
    const slots = day(world(), 10 * 360, 18 * 360);
    const all = beats(slots);
    expect(new Set(all.map(([, b]) => b.kind))).toEqual(new Set(['idle', 'outing', 'pair']));
    for (const s of slots) {
      const v = Object.values(s);
      if (v.length === 2) {
        expect(v.every((b) => b.kind === 'pair')).toBe(true);
        expect(v.filter((b) => b.kind === 'pair' && b.lead)).toHaveLength(1);
      } else expect(v.length).toBeLessThanOrEqual(1);
    }
    const outings = all.filter(([, b]) => b.kind === 'outing').length / slots.length;
    expect(outings).toBeGreaterThan(0.2);
    expect(outings).toBeLessThan(0.4);
    const idle = new Set(all.flatMap(([, b]) => (b.kind === 'idle' ? [b.action] : [])));
    expect(idle).toEqual(new Set(['look', 'wiggle', 'hop', 'peek', 'treeshake'])); // stretch is a morning move
  });

  it('keeps the hours: stretching only 5–10, no day-only moves in the evening; awake at night too (no night’s sleep: 2026-11-09)', () => {
    const morning = beats(day(world(), 5 * 360, 10 * 360));
    expect(morning.some(([, b]) => b.kind === 'idle' && b.action === 'stretch')).toBe(true);
    const evening = beats(day(world({ phase: 'evening' }), 19 * 360, 22 * 360));
    expect(evening.some(([, b]) => b.kind === 'idle' && ['hop', 'peek', 'treeshake', 'stretch'].includes(b.action))).toBe(false);
    const night = beats(day(world({ phase: 'evening' }), 0, 5 * 360));
    expect(night.some(([, b]) => b.kind === 'idle')).toBe(true);
  });

  it('leaves a sleeping villager out (its app closed: not free): no beat of its own, never a pair’s other, no dusk meet-up', () => {
    const seats: Poi[] = [...POIS, { node: 'seatMaeL', at: [27, 146] }, { node: 'seatMaeR', at: [53, 146] }];
    const w = world({ pois: seats, scores: { A: 100, B: 100 } });
    w.villagers.B = { ...w.villagers.B, free: false };
    const got = beats(day(w, 9 * 360, 18 * 360));
    expect(got.some(([who]) => who === 'B')).toBe(false);
    expect(got.some(([, b]) => b.kind === 'pair')).toBe(false);
    expect(got.some(([, b]) => b.kind === 'outing' && b.together)).toBe(false);
    expect(got.some(([who, b]) => who === 'A' && b.kind === 'idle')).toBe(true);
  });

  it('sends one villager out at a time, from home, to points of interest within reach and never where it stands', () => {
    for (const [, b] of beats(day(world(), 9 * 360, 12 * 360))) {
      if (b.kind !== 'outing') continue;
      expect(b.stops.length).toBeGreaterThanOrEqual(1);
      expect(b.stops.length).toBeLessThanOrEqual(3);
      expect(b.stops.map((x) => x.node)).not.toContain('museumDoor'); // > 600u from home
      for (let i = 1; i < b.stops.length; i++) expect(b.stops[i].node).not.toBe(b.stops[i - 1].node);
      for (const x of b.stops) expect(x.linger).toBeGreaterThanOrEqual(3000);
    }
    const away = world();
    away.villagers.B.at = [62, 350]; // B is out by its tree
    expect(beats(day(away, 9 * 360, 12 * 360)).some(([, b]) => b.kind === 'outing')).toBe(false);
    expect(WANDER_REACH_U).toBe(600);
  });

  it('never sends out a villager whose person has the island open (their own phone, or the relay says so)', () => {
    const w = world();
    w.villagers.A.present = true;
    const all = beats(day(w, 9 * 360, 12 * 360));
    expect(all.some(([who, b]) => who === 'A' && b.kind === 'outing')).toBe(false);
    expect(all.some(([who, b]) => who === 'A' && b.kind === 'idle')).toBe(true);
    expect(all.some(([who, b]) => who === 'B' && b.kind === 'outing')).toBe(true);
  });

  it('pairs only two free villagers, and dances only when both day scores reach 70', () => {
    const w = world();
    w.villagers.B.free = false;
    const one = beats(day(w, 9 * 360, 12 * 360));
    expect(one.every(([who]) => who === 'A')).toBe(true);
    expect(one.some(([, b]) => b.kind === 'pair')).toBe(false);
    const low = beats(day(world({ scores: { A: 90, B: 60 } }), 9 * 360, 12 * 360));
    expect(low.some(([, b]) => b.kind === 'pair' && b.action === 'dance')).toBe(false);
    const high = beats(day(world({ scores: { A: 90, B: 85 } }), 9 * 360, 12 * 360));
    const dances = high.filter(([, b]) => b.kind === 'pair' && b.action === 'dance').length;
    expect(dances).toBeGreaterThan(low.filter(([, b]) => b.kind === 'pair').length / 4);
  });

  it('leaves a villager its owner is steering alone for 12 slots after the last walk sent before the slot', () => {
    const w = world();
    w.villagers.A.lastIntent = slotStart(DATE, 4000) - 1;
    expect(held(w.villagers.A, slotStart(DATE, 4000))).toBe(true);
    expect(held(w.villagers.A, slotStart(DATE, 4000 + HOLD_SLOTS - 1))).toBe(true);
    expect(held(w.villagers.A, slotStart(DATE, 4000 + HOLD_SLOTS))).toBe(false);
    expect(held(w.villagers.A, slotStart(DATE, 3999))).toBe(false); // sent after that slot began
    expect(held({ ...w.villagers.A, lastIntent: slotStart(DATE, 4000) }, slotStart(DATE, 4000))).toBe(false); // counts from the next
    for (const s of day(w, 4000, 4000 + HOLD_SLOTS)) {
      expect(s.A).toBeUndefined();
      expect(s.B?.kind).not.toBe('pair');
    }
    expect(beats(day(w, 4000 + HOLD_SLOTS, 4200)).some(([who]) => who === 'A')).toBe(true);
    expect(DECIDE_MS).toBeLessThan(SLOT_MS / 10);
  });

  it('times small moves within the slot and starts outings on its boundary', () => {
    for (const [, b] of beats(day(world(), 9 * 360, 10 * 360))) {
      if (b.kind === 'idle' || b.kind === 'pair') expect(b.at >= 0 && b.at < 6000).toBe(true);
      else expect('at' in b).toBe(false);
    }
  });
});

describe('ambient life: the critters', () => {
  const all = Array.from({ length: SLOTS_PER_DAY }, (_, s) => spawnsIn(DATE, s)).flat();

  it('never brings two at once to the sea, a fresh water or a bug lane, each staying its time within its block', () => {
    const fresh = (w: string) => (x: Spawn) => x.kind === 'fresh' && x.water === w;
    // (failures collected, one expect: an expect a spawn is ~56k calls)
    const fails: string[] = [];
    for (const [name, of] of [['sea', (x: Spawn) => x.kind === 'fish' && !x.coast], ['bubbles', (x: Spawn) => x.kind === 'bubbles'], ...['pond', 'river', 'mouth', 'clifftop'].map((w) => [w, fresh(w)] as const), ['bug', (x: Spawn) => x.kind === 'bug' && !x.lane], ['bug2', (x: Spawn) => x.kind === 'bug' && x.lane === 2]] as const) {
      const s = all.filter(of);
      if (!(s.length > 100)) fails.push(`${name}: only ${s.length}`);
      for (let i = 1; i < s.length; i++) if (!(s[i].slot >= s[i - 1].slot + s[i - 1].slots)) fails.push(`${name}: two at once at slot ${s[i].slot}`);
    }
    // each fresh water has its shadow nearly all the time (the pond on screen is never long empty)
    for (const w of ['pond', 'river', 'mouth', 'clifftop']) expect(all.filter(fresh(w)).reduce((n, x) => n + x.slots, 0) / SLOTS_PER_DAY, w).toBeGreaterThan(0.6);
    for (const x of all) {
      const at = `${x.kind} at slot ${x.slot}`;
      if (!(x.at < 8000)) fails.push(`${at}: at ${x.at}`);
      if (!(x.slots <= (x.kind === 'fish' || x.kind === 'fresh' ? 5 : x.kind === 'bubbles' ? 3 : 2))) fails.push(`${at}: ${x.slots} slots`);
      if (Math.floor(x.slot / 60) !== Math.floor((x.slot + x.slots - 1) / 60)) fails.push(`${at}: ${x.slots} slots, past its 10-minute block`);
    }
    expect(fails.slice(0, 10)).toEqual([]);
    const busy = (k: string[]) => all.filter((x) => k.includes(x.kind)).reduce((n, x) => n + x.slots, 0) / SLOTS_PER_DAY;
    expect(busy(['fish'])).toBeGreaterThan(0.75); // a fish is basically always there
    expect(busy(['bug'])).toBeGreaterThan(0.6); // two lanes: about twice the one lane's 0.3+
    // the front's bubbles about as many a day as when they took 1 sea turn in 4 (~500)
    const bubbles = all.filter((x) => x.kind === 'bubbles').length;
    expect(bubbles).toBeGreaterThan(400);
    expect(bubbles).toBeLessThan(650);
  });

  it('the rest of the coast (coast.ts): a channel per stretch, fish only, one at a time each; the front and the rest as with one', () => {
    const many = Array.from({ length: SLOTS_PER_DAY / 4 }, (_, s) => spawnsIn(DATE, s, 9)).flat();
    const one = all.filter((x) => x.slot < SLOTS_PER_DAY / 4);
    expect(many.filter((x) => !x.coast)).toEqual(one);
    const bad: string[] = [];
    for (let k = 1; k < 9; k++) {
      const s = many.filter((x) => x.coast === k);
      if (s.length < 100 || s.some((x) => x.kind !== 'fish')) bad.push(`coast ${k}: ${s.length}`);
      for (let i = 1; i < s.length; i++) if (s[i].slot < s[i - 1].slot + s[i - 1].slots) bad.push(`coast ${k}: two at once at ${s[i].slot}`);
    }
    expect(bad).toEqual([]);
    expect(new Set(many.map((x) => critterId(x))).size).toBe(many.length);
  });

  it('a phone opening mid-stay sees who is there, as the phone that saw them come', () => {
    const x = all.filter((c) => c.slots >= 3)[10];
    expect(crittersAt(DATE, x.slot + 2)).toContainEqual(x);
    expect(crittersAt(DATE, x.slot + x.slots)).not.toContainEqual(x);
    expect(spawnsIn(DATE, x.slot + 2)).not.toContainEqual(x);
    expect(spawnsIn(DATE, x.slot)).toContainEqual(x);
  });

  it('seeds the species: the same fish and bug on both phones from the real pickers', () => {
    const fish = all.filter((x) => x.kind === 'fish').slice(0, 40);
    const names = fish.map((x) => pickFish(11, 13, spawnRand(x)));
    expect(fish.map((x) => pickFish(11, 13, spawnRand(structuredClone(x))))).toEqual(names);
    expect(new Set(names).size).toBeGreaterThan(3);
    const bug = all.find((x) => x.kind === 'bug')!;
    expect(pickBug(11, 13, spawnRand(bug))).toBe(pickBug(11, 13, spawnRand(structuredClone(bug))));
  });

  it('a fish’s odds are its water’s and the hour’s, month’s and sky’s, never its stretch’s: as many shadows off every stretch of coast (the front’s too: its bubbles their own turns), the rare ones alike', () => {
    // (the pickers take no stretch: pickFish(month, hour, r, sky), pickFresh(water, …); so a stretch's share is its
    // shadows' count and its seeds'.) Two seeded days, 9 stretches: ~1,900 shadows a stretch a day
    const n = Array.from({ length: 9 }, () => ({ all: 0, rare: 0 }));
    for (const [date, sky] of [['2026-08-10', 'clear'], ['2026-02-10', 'rain']] as const)
      for (let slot = 0; slot < SLOTS_PER_DAY; slot++)
        for (const c of spawnsIn(date, slot, 9)) {
          if (c.kind !== 'fish') continue;
          const x = n[c.coast ?? 0];
          x.all++;
          if (FISH[pickFish(+date.slice(5, 7), Math.floor(slot / 360), spawnRand(c), sky)].weight <= 0.5) x.rare++;
        }
    const all = n.reduce((s, x) => s + x.all, 0), rare = n.reduce((s, x) => s + x.rare, 0);
    for (const [k, x] of n.entries()) {
      // (the front's had 0.81× when its bubbles took 1 sea turn in 4)
      expect(x.all / (all / 9), `stretch ${k}: its shadows`).toBeCloseTo(1, 1);
      expect(x.rare / (rare / 9), `stretch ${k}: its rare ones`).toBeGreaterThan(0.6);
      expect(x.rare / (rare / 9), `stretch ${k}: its rare ones`).toBeLessThan(1.4);
    }
  });

  it('two roaming bugs at once (two lanes, the same per-slot odds and stays), never on one spot, the same on every phone', () => {
    // (one seeded summer day: how often both are about; its first 150 second-lane bugs with a first-lane one about)
    const date = '2026-07-01';
    let both = 0, pairs = 0;
    const bad: string[] = [];
    for (let slot = 0; slot < SLOTS_PER_DAY; slot++) {
      const now = crittersAt(date, slot).filter((x) => x.kind === 'bug');
      if (now.length === 2) both++;
      for (const c of now) {
        if (c.lane !== 2 || c.slot !== slot || pairs >= 150) continue;
        const id = pickBug(7, Math.floor(slot / 360), spawnRand(c));
        if (!id) continue;
        const taken = bugRivals(date, c).flatMap((q) => {
          const rid = pickBug(7, Math.floor(q.slot / 360), spawnRand(q));
          const p = rid && bugPath(rid, q.seed, 0);
          return p ? [p.spot] : [];
        });
        const p = bugPath(id, c.seed, 0, { taken })!;
        // (both phones: the same spot from the same inputs)
        expect(bugPath(id, c.seed, 0, { taken: structuredClone(taken) })!.spot).toEqual(p.spot);
        for (const t of taken) {
          pairs++;
          if ((t.x - p.spot.x) ** 2 + (t.z - p.spot.z) ** 2 < SPOT_MIN ** 2) bad.push(`slot ${slot} ${id}`);
        }
      }
    }
    expect(both / SLOTS_PER_DAY).toBeGreaterThan(0.3);
    expect(pairs).toBeGreaterThan(100);
    expect(bad).toEqual([]);
  });
});

describe('ambient life: the decor (benches, the campfire, the pull-up bar)', () => {
  const seats: Poi[] = [...POIS, { node: 'seatMaeL', at: [27, 146] }, { node: 'stoolW', at: [232, 969] }, { node: 'pullup', at: [330, 917] }];
  it('a seat is sat on for 20–40 s; the far seats and the bar only by their own beats', () => {
    const all = beats(day(world({ pois: seats }), 9 * 360, 16 * 360));
    const stops = all.flatMap(([, b]) => (b.kind === 'outing' ? b.stops : []));
    for (const s of stops.filter((s) => s.node === 'seatMaeL')) expect(s.linger >= 20_000 && s.linger <= 40_000).toBe(true);
    expect(stops.some((s) => s.node === 'pullup' || s.node === 'stoolW')).toBe(false);
  });
  it('on an exercise day a villager goes to the pull-up bar now and then (its own person’s only)', () => {
    const all = beats(day(world({ pois: seats, exercise: { A: true, B: false } }), 9 * 360, 16 * 360));
    const bar = all.filter(([, b]) => b.kind === 'outing' && b.stops.some((s) => s.node === 'pullup'));
    expect(bar.length).toBeGreaterThan(0);
    expect(bar.every(([who]) => who === 'A')).toBe(true);
  });
  it('in the evening they go sit at the campfire, each on their own stool', () => {
    const all = beats(day(world({ pois: seats, phase: 'evening' }), 19 * 360, 22 * 360));
    const fire = all.filter(([, b]) => b.kind === 'outing' && b.stops.some((s) => /^stool/.test(s.node)));
    expect(fire.length).toBeGreaterThan(0);
    for (const [who, b] of fire) expect(b.kind === 'outing' && b.stops[0].node).toBe(who === 'A' ? 'stoolW' : 'stoolE');
  });
  it('both met every goal: at dusk they set off together for the front bench, side by side; not otherwise', () => {
    const at = (scores: Record<Who, number>, hour: number) => villagerBeats(world({ pois: seats, scores }), DATE, hour * 360);
    expect(at({ A: 100, B: 100 }, 17)).toEqual({
      A: { kind: 'outing', stops: [{ node: 'seatMaeL', linger: 90_000 }], together: true },
      B: { kind: 'outing', stops: [{ node: 'seatMaeR', linger: 90_000 }], together: true }
    });
    for (const b of Object.values(at({ A: 100, B: 60 }, 17))) expect(b.kind === 'outing' && b.together).toBeFalsy();
    for (const b of Object.values(at({ A: 100, B: 100 }, 15))) expect(b.kind === 'outing' && b.together).toBeFalsy();
  });
});

describe('ambient life: the guest’s villager while it’s on the island (2026-11-06)', () => {
  const G = { at: [200, 120] as [number, number], home: [200, 120] as [number, number], free: true, present: true };
  const withG = (o: Partial<AmbientWorld> = {}) => {
    const w = world(o);
    return { ...w, villagers: { ...w.villagers, G } };
  };
  type Any = [string, VillagerBeat];
  const all = (w: AmbientWorld, from = 9 * 360, to = 16 * 360) => day(w, from, to).flatMap((s) => Object.entries(s) as Any[]);

  it('takes its turns as a present member does: small moves, chats and dances with either member, never an outing of its own', () => {
    const got = all(withG({ scores: { A: 90, B: 90 } }));
    const g = got.filter(([who]) => who === 'G');
    expect(g.some(([, b]) => b.kind === 'idle')).toBe(true);
    const pairs = g.filter(([, b]) => b.kind === 'pair').map(([, b]) => (b.kind === 'pair' ? b.with : null));
    expect(new Set(pairs)).toEqual(new Set(['A', 'B']));
    expect(g.some(([, b]) => b.kind === 'outing')).toBe(false);
    // its partner's entry is the same pair, back to it
    for (const s of day(withG(), 9 * 360, 12 * 360)) {
      const b = s.G;
      if (b?.kind === 'pair') expect(s[b.with]).toEqual({ ...b, with: 'G', lead: !b.lead });
    }
    // the members still go out (one at a time) with it here; it never shakes a tree (it has none)
    expect(got.some(([who, b]) => who !== 'G' && b.kind === 'outing')).toBe(true);
    expect(g.some(([, b]) => b.kind === 'idle' && b.action === 'treeshake')).toBe(false);
  });

  it('the same beats on every phone, and the members’ day as before when it isn’t here', () => {
    expect(JSON.stringify(day(withG(), 4000, 4200))).toBe(JSON.stringify(day(withG(), 4000, 4200)));
    expect(day(world(), 4000, 4200).every((s) => !('G' in s))).toBe(true);
  });

  it('pairs only with an awake one (a member asleep: the guest’s pairs are with the other), and joins the dusk meet-up beside the bench (not on a seat)', () => {
    const asleepB = withG({ scores: { A: 90, B: 90 } });
    asleepB.villagers.B = { ...asleepB.villagers.B, free: false };
    const pairs = all(asleepB).flatMap(([who, b]) => (b.kind === 'pair' ? [[who, b.with]] : []));
    expect(pairs.length).toBeGreaterThan(0);
    expect(pairs.flat()).not.toContain('B');
    const seats: Poi[] = [...POIS, { node: 'seatMaeL', at: [27, 146] }, { node: 'seatMaeR', at: [53, 146] }];
    const dusk = villagerBeats(withG({ pois: seats, scores: { A: 100, B: 100 } }), DATE, 17 * 360);
    expect(dusk.A).toEqual({ kind: 'outing', stops: [{ node: 'seatMaeL', linger: 90_000 }], together: true });
    expect(dusk.G).toEqual({ kind: 'outing', stops: [{ node: 'shoreL', linger: 90_000 }], together: true });
  });
});
