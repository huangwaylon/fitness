import { describe, expect, it } from 'vitest';
import { mulberry32 } from '#lib/random.ts';
import { MOTION_MS } from '../motion/reactions.ts';
import { VISITORS } from '../../world/visitors.ts';
import {
  BEHAVIOUR, EDGE_FADE_MS, GULLIVER_WAKE, MEET_GAP, VISITOR_SPEED, WAY_MS, nudge, pickAct, pickEmote, strollSpots, tapMotion, wayMs,
  type BeatState, type VisitorAct
} from './visitorLife.ts';
import { COLOUR_GLYPHS, isMark } from '#lib/art.ts';
import ja from '#lib/i18n/ja.json';
import en from '#lib/i18n/en.json';

const idle: BeatState = { speaking: false, asleep: false, walking: false, away: false, sinceMeet: Infinity, villagerFree: true };
/** What a visitor does over many beats. */
function acts(id: (typeof VISITORS)[number], s: Partial<BeatState> = {}, n = 2000): Set<VisitorAct | null> {
  const r = mulberry32(7), out = new Set<VisitorAct | null>();
  for (let i = 0; i < n; i++) out.add(pickAct(id, { ...idle, ...s }, r));
  return out;
}

describe('visitor life (NH behaviours)', () => {
  it('every visitor has a behaviour: emotes from the villagers’ set, a known motion', () => {
    for (const id of VISITORS) {
      const b = BEHAVIOUR[id];
      expect(b.emotes.length, id).toBeGreaterThan(1);
      for (const e of [...b.emotes, b.hello]) expect(isMark(e) || COLOUR_GLYPHS.includes(e as never), `${id} ${e}`).toBe(true);
      if (b.signature.motion) expect(MOTION_MS[b.signature.motion], id).toBeGreaterThan(0);
    }
  });
  it('the ones who roam in NH stroll (Daisy Mae, Franklin, Zipper, Celeste); Gulliver, Jack and the rest stay put', () => {
    for (const id of ['daisy-mae', 'franklin', 'zipper', 'celeste'] as const) {
      expect(BEHAVIOUR[id].roam, id).toBeGreaterThan(0);
      expect(BEHAVIOUR[id].roam, id).toBeLessThanOrEqual(80);
      expect(acts(id).has('wander'), id).toBe(true);
    }
    for (const id of ['gulliver', 'jack', 'wisp', 'jingle', 'reese'] as const) {
      expect(BEHAVIOUR[id].roam, id).toBe(0);
      expect(acts(id).has('wander'), id).toBe(false);
    }
  });
  it('signatures after NH: Jack twirls, Zipper hops, Celeste looks up, Reese and Cyrus nuzzle', () => {
    expect(BEHAVIOUR.jack.signature.motion).toBe('twirl');
    expect(BEHAVIOUR.zipper.signature.motion).toBe('hop2');
    expect(BEHAVIOUR.celeste.signature.motion).toBe('lookup');
    expect(BEHAVIOUR.reese.signature.fx).toBe('hearts');
    expect(BEHAVIOUR.franklin.signature.motion).toBe('flap');
    expect(BEHAVIOUR['daisy-mae'].signature.fx).toBe('notes'); // she hums
  });
  it('a beat: nothing while speaking or walking; asleep, only the signature', () => {
    expect(acts('daisy-mae', { speaking: true })).toEqual(new Set([null]));
    expect(acts('daisy-mae', { walking: true })).toEqual(new Set([null]));
    expect(acts('gulliver', { asleep: true })).toEqual(new Set(['signature']));
  });
  it('a beat: signature, emote and look always; home only when away; a villager comes over at most once per MEET_GAP, when one is free', () => {
    const base = acts('celeste');
    for (const a of ['signature', 'emote', 'look', 'wander', 'meet'] as const) expect(base.has(a), a).toBe(true);
    expect(base.has('home')).toBe(false);
    const away = acts('celeste', { away: true });
    expect(away.has('home')).toBe(true);
    expect(away.has('wander')).toBe(false);
    expect(away.has('meet')).toBe(false);
    expect(acts('jack', { villagerFree: false }).has('meet')).toBe(false);
    expect(acts('jack', { sinceMeet: MEET_GAP - 1 }).has('meet')).toBe(false);
    expect(acts('jack', { sinceMeet: MEET_GAP }).has('meet')).toBe(true);
  });
  it('the signature is the likeliest beat, a meet the rarest', () => {
    const r = mulberry32(3), n: Record<string, number> = {};
    for (let i = 0; i < 6000; i++) {
      const a = pickAct('zipper', idle, r)!;
      n[a] = (n[a] ?? 0) + 1;
    }
    expect(n.signature).toBeGreaterThan(n.emote);
    expect(n.meet).toBeLessThan(n.wander);
  });
  it('an emote of their own, never the same twice running', () => {
    const r = mulberry32(5);
    let last = pickEmote('jingle', r);
    for (let i = 0; i < 100; i++) {
      const e = pickEmote('jingle', r, last);
      expect(BEHAVIOUR.jingle.emotes).toContain(e);
      expect(e).not.toBe(last);
      last = e;
    }
  });
  it('a stroll ends within the radius, level with or in front of their spot (world z: toward the camera)', () => {
    const home = [195, 900] as const;
    const spots = strollSpots(home, 30, mulberry32(1));
    expect(spots.length).toBeGreaterThan(4);
    for (const [x, z] of spots) {
      expect(Math.hypot(x - home[0], z - home[1])).toBeLessThanOrEqual(30.5);
      expect(z).toBeLessThanOrEqual(home[1]);
    }
    expect(new Set(spots.map(String)).size).toBe(spots.length);
    expect(strollSpots(home, 0, mulberry32(1))).toEqual([]);
  });
  it('Gulliver wakes on the fifth nudge (NH), not before; his sleep talk in both languages', () => {
    expect(GULLIVER_WAKE).toBe(5);
    let taps = 0;
    for (let i = 1; i < 5; i++) {
      const r = nudge(taps);
      expect(r).toEqual({ taps: i, woke: false });
      taps = r.taps;
    }
    expect(nudge(taps)).toEqual({ taps: 5, woke: true });
    expect(nudge(5).woke).toBe(true);
    for (const i of [0, 1, 2]) {
      expect((ja as Record<string, string>)[`visitor.gulliver.zzz.${i}`]).toBeTruthy();
      expect((en as Record<string, string>)[`visitor.gulliver.zzz.${i}`]).toBeTruthy();
    }
  });
  it('arrivals and departures: walkers from the campsite at their pace plus the fade at its door, the rest their own length', () => {
    expect(wayMs('walk', 160)).toBe(Math.round((160 / VISITOR_SPEED.arrive) * 1000) + EDGE_FADE_MS);
    expect(wayMs('hop', 90)).toBe(1000 + EDGE_FADE_MS);
    expect(wayMs('float')).toBe(WAY_MS.float);
    expect(wayMs('fly')).toBeLessThan(wayMs('float')); // Wisp drifts down slower than Celeste flies
    expect(wayMs('appear')).toBeLessThan(1000);
    for (const w of Object.values(WAY_MS)) expect(w).toBeLessThanOrEqual(2400); // never a long wait
    expect(BEHAVIOUR.wisp.arrive).toBe('float');
    expect(BEHAVIOUR.celeste.arrive).toBe('fly');
    expect(BEHAVIOUR.jack.arrive).toBe('spook');
    expect(BEHAVIOUR.zipper.arrive).toBe('hop');
    expect(BEHAVIOUR.gulliver.leave).toBe('fly'); // off with his crew
  });
  it('the little move before a line: a hop, Wisp wobbles, Gulliver starts', () => {
    expect(tapMotion('daisy-mae')).toBe('hop');
    expect(tapMotion('wisp')).toBe('wiggle');
    expect(tapMotion('gulliver')).toBe('surprise');
  });
});
