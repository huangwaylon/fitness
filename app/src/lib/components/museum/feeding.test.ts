// The aquarium's feeding (museum/feeding.ts): feeders come only where a predator is, never over the cap, all inside
// the water; each hunt ends in a bite or an escape in time, some of each. (The misses collected, checked once.)
import { describe, expect, test } from 'vitest';
import { bandOf, cruiseOf, spawn, stepSchool, swimBox, type Swimmer } from './boids.ts';
import { FEEDERS, PREDATORS, HUNT_S, feederBox, feedersIn, feedingOf, stepFeeding, type Feeding } from './feeding.ts';
import { FISH_IDS, WALKERS } from './species.ts';
import { TANKS, bodyIn, openOf, type Box } from './tanks.ts';
import { modelBounds } from '../world3d/models3d.ts';

const FPS = 30;
const inside = (b: Box, p: readonly number[], e = 1e-6) =>
  p[0] >= b.x0 - e && p[0] <= b.x1 + e && p[1] >= b.y0 - e && p[1] <= b.y1 + e && p[2] >= b.z0 - e && p[2] <= b.z1 + e;

/** A tank with these fish, its feeding stepped as the aquarium does (its swimmers first) for `minutes`. */
function run(tank: string, ids: string[], minutes: number, seed: number) {
  const t = TANKS.find((x) => x.id === tank)!, w = openOf(t);
  const fish = ids.map((id, i) => {
    const b = modelBounds(`critters/fish/${id}`)!, body = bodyIn(t, b.min, b.max);
    return { id, f: spawn(w, body.r, body.reach, cruiseOf(body.r), seed * 31 + i * 17 + 5, bandOf(id)) };
  });
  const all = fish.map((x) => x.f), predators: Swimmer[] = fish.filter((x) => PREDATORS.has(x.id)).map((x) => x.f);
  const fd: Feeding = feedingOf(seed), fb = feederBox(w), out: string[] = [];
  let most = 0, began = -1, longest = 0;
  for (let k = 0; k < minutes * 60 * FPS; k++) {
    stepSchool(all, w, 1 / FPS, k / FPS);
    stepFeeding(fd, predators, w, 1 / FPS);
    most = Math.max(most, feedersIn(fd));
    for (const x of fd.feeders) if (x.alive && !inside(fb, x.p)) out.push(`feeder out at ${k}: ${x.p.map((v) => v.toFixed(1))}`);
    for (const x of all) {
      if (!inside(swimBox(w, x.reach), x.p)) out.push(`swimmer out at ${k}`);
      if (!(Math.hypot(...x.v) <= x.speed * 1.61)) out.push(`swimmer too quick at ${k}: ${Math.hypot(...x.v).toFixed(2)} of ${x.speed.toFixed(2)}`);
    }
    // (each hunt's length: from its start to its end)
    if (fd.hunter && began < 0) began = k;
    if (!fd.hunter && began >= 0) {
      longest = Math.max(longest, (k - began) / FPS);
      began = -1;
    }
  }
  return { fd, most, longest, out };
}

describe('the feeding', () => {
  test('a shark’s and a pike’s tank: schools come, each hunt a bite or an escape within its time, some of each, never more than the cap, all in the water', () => {
    const out: string[] = [];
    let bites = 0, escapes = 0;
    for (const [tank, ids] of [['sea', ['great-white-shark', 'clownfish', 'ray', 'sea-bass']], ['sea', ['hammerhead-shark', 'tuna']], ['river', ['pike', 'koi', 'neon-tetra']], ['deep', ['football-fish', 'squid']], ['sea', ['giant-trevally', 'puffer-fish', 'suckerfish', 'napoleonfish', 'whale-shark']], ['river', ['dorado', 'crucian-carp', 'killifish', 'loach']]] as const)
      for (const seed of [1, 2]) {
        const r = run(tank, [...ids], 10, seed);
        out.push(...r.out.slice(0, 3).map((m) => `${tank} ${ids[0]} ${seed}: ${m}`));
        if (r.most > FEEDERS) out.push(`${tank} ${ids[0]} ${seed}: ${r.most} feeders`);
        if (!(r.longest <= HUNT_S + 0.1)) out.push(`${tank} ${ids[0]} ${seed}: a hunt of ${r.longest.toFixed(1)} s`);
        if (r.fd.hunts < 3) out.push(`${tank} ${ids[0]} ${seed}: only ${r.fd.hunts} hunts`);
        // (every hunt that's over ended one way or the other)
        if (r.fd.bites + r.fd.escapes < r.fd.hunts - 1) out.push(`${tank} ${ids[0]} ${seed}: ${r.fd.hunts} hunts, ${r.fd.bites} bites, ${r.fd.escapes} escapes`);
        bites += r.fd.bites;
        escapes += r.fd.escapes;
      }
    expect(out).toEqual([]);
    // (a fair share of each: about four in ten a bite)
    expect(bites / (bites + escapes)).toBeGreaterThan(0.2);
    expect(escapes / (bites + escapes)).toBeGreaterThan(0.2);
  });
  test('no feeders in a tank without a predator: the whale shark’s (a filter feeder), the koi’s', () => {
    for (const [tank, ids] of [['sea', ['whale-shark', 'clownfish']], ['river', ['koi', 'carp']]] as const) {
      const r = run(tank, [...ids], 5, 3);
      expect(r.most, tank).toBe(0);
      expect(r.fd.hunts, tank).toBe(0);
    }
    expect(PREDATORS.has('whale-shark')).toBe(false);
    // (each one a fish of the ずかん, a swimmer: never a walker)
    expect([...PREDATORS].filter((id) => !FISH_IDS.includes(id) || id in WALKERS)).toEqual([]);
  });
  test('the predator gone (the hour’s pick): its feeders leave, and none come', () => {
    const t = TANKS.find((x) => x.id === 'sea')!, w = openOf(t), b = modelBounds('critters/fish/great-white-shark')!, body = bodyIn(t, b.min, b.max);
    const shark = spawn(w, body.r, body.reach, cruiseOf(body.r), 9), fd = feedingOf(4);
    let k = 0;
    for (; feedersIn(fd) === 0 && k < 60 * FPS; k++) {
      stepSchool([shark], w, 1 / FPS, k / FPS);
      stepFeeding(fd, [shark], w, 1 / FPS);
    }
    expect(feedersIn(fd)).toBeGreaterThan(0);
    for (let j = 0; j < 120 * FPS; j++) stepFeeding(fd, [], w, 1 / FPS);
    expect(feedersIn(fd)).toBe(0);
    expect(fd.hunter).toBe(null);
  });
});
