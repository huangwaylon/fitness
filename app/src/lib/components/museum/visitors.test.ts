import { describe, expect, it } from 'vitest';
import { crowdOf, dayPlan, usablePoints, VISITORS, MAX_IN, MAX_ROOM, EMOTE_MS, WAVE_R, type LingerPoint, type VisitorRoom, type VisitorPose } from './visitors.ts';
import { VISITOR_POINTS, VISITOR_ROOMS } from './spots.ts';
import { boundsOf, ROOM_IDS, type RoomId } from './plan.ts';
import { LINES, visitorLine, type LineContext } from './visitorLines.ts';
import { ROSTER } from '#lib/villagers/roster.ts';
import { has3d } from '../villager3d/manifest.ts';
import { CAST } from '#lib/kikimimi/cast.ts';
import { mulberry32 } from '#lib/random.ts';
import type { Pt } from './plan.ts';

/** Today's museum, near enough: the hall, the aquarium off its right side, the bug wing off its left. */
const ROOMS: VisitorRoom[] = [
  { id: 'hall', kind: 'hall', door: [0, 50], doorways: [{ x0: -12, x1: 12, z0: 60, z1: 70 }, { x0: 55, x1: 65, z0: -5, z1: 25 }, { x0: -65, x1: -55, z0: -5, z1: 25 }] },
  { id: 'fish', kind: 'fish', door: [75, 10], doorways: [{ x0: 55, x1: 65, z0: -5, z1: 25 }] },
  { id: 'bug', kind: 'bug', door: [-75, 10], doorways: [{ x0: -65, x1: -55, z0: -5, z1: 25 }] }
];
const P = (id: string, room: string, x: number, z: number, kind: LingerPoint['kind'], o: Partial<LingerPoint> = {}): LingerPoint =>
  ({ id, room, x, z, faceYaw: Math.PI, kind, ...o });
const POINTS: LingerPoint[] = [
  P('h1', 'hall', -30, 0, 'look', { exhibitId: 'banner' }), P('h2', 'hall', 30, 0, 'look'), P('h3', 'hall', -20, 30, 'chat', { pair: 'h4' }),
  P('h4', 'hall', -10, 30, 'chat', { pair: 'h3' }),
  P('f1', 'fish', 120, -70, 'look', { exhibitId: 'sea-bass' }), P('f2', 'fish', 160, -70, 'look', { exhibitId: 'squid' }),
  P('f3', 'fish', 200, -70, 'look', { exhibitId: 'dab' }), P('f4', 'fish', 260, 0, 'look', { exhibitId: 'koi' }),
  P('f5', 'fish', 124, -20, 'sit', { from: [124, -10] }), P('f6', 'fish', 196, -20, 'sit', { from: [196, -10] }),
  P('f7', 'fish', 150, 60, 'chat', { pair: 'f8', faceYaw: Math.PI / 2 }), P('f8', 'fish', 165, 60, 'chat', { pair: 'f7', faceYaw: -Math.PI / 2 }),
  P('fx', 'fish', 62, 10, 'look'), // in the doorway: never used
  P('b1', 'bug', -120, -80, 'look', { exhibitId: 'tarantula' }), P('b2', 'bug', -180, -80, 'look'), P('b3', 'bug', -240, 0, 'look'),
  P('b4', 'bug', -150, 50, 'sit', { from: [-150, 60] }), P('b5', 'bug', -200, 60, 'chat', { pair: 'b6' }), P('b6', 'bug', -215, 60, 'chat', { pair: 'b5' })
];
const NAMES: Record<string, { ja: string; en: string }> = { 'sea-bass': { ja: 'スズキ', en: 'sea bass' }, squid: { ja: 'イカ', en: 'squid' } };
const options = (rand = Math.random) => ({ rooms: ROOMS, points: POINTS, path: () => [] as Pt[], name: (id: string) => NAMES[id] ?? null, rand });
/** 2026-11-10 at hh:mm Tokyo (ms). */
const at = (hh: number, mm = 0, day = 10) => Date.UTC(2026, 10, day, hh - 9, mm);
const inside = (p: VisitorPose, r: { x0: number; x1: number; z0: number; z1: number }) => p.x > r.x0 && p.x < r.x1 && p.z > r.z0 && p.z < r.z1;
const snap = (ps: readonly VisitorPose[]) => ps.map((p) => ({ ...p, point: p.point?.id ?? null }));

describe('the museum’s visitors: who', () => {
  it('three of each personality, each the roster’s, with NH’s model and a ききみみ voice', () => {
    expect(VISITORS.length).toBe(24);
    for (const [id, pers] of VISITORS) {
      expect(ROSTER[id as keyof typeof ROSTER]?.personality, id).toBe(pers);
      expect(has3d(id), id).toBe(true);
      expect(CAST[id as keyof typeof CAST], id).toBeTruthy();
    }
    const counts = Object.groupBy(VISITORS, ([, p]) => p);
    for (const p of Object.keys(LINES)) expect(counts[p as keyof typeof counts]?.length).toBe(3);
  });
});

describe('the museum’s visitors: the day’s plan', () => {
  it('is the same on every phone (the date’s, seeded), and another day’s another', () => {
    const a = crowdOf(options(mulberry32(1))), b = crowdOf(options(mulberry32(2)));
    let seen = 0;
    for (let t = at(9); t < at(21); t += 97_000) {
      for (const room of ['hall', 'fish', 'bug']) {
        const pa = snap(a.step(t, room).poses), pb = snap(b.step(t, room).poses);
        expect(pa).toEqual(pb);
        seen += pa.length;
      }
    }
    expect(seen).toBeGreaterThan(200);
    const d = Math.floor((at(12) + 9 * 3_600_000) / 86_400_000);
    const who = (day: number) => dayPlan(day, ROOMS, usablePoints(POINTS, ROOMS)).stints.map((s) => `${s.who}@${s.room}`).join();
    expect(who(d)).toBe(who(d));
    expect(who(d + 1)).not.toBe(who(d));
  });

  it(`keeps to ${MAX_IN} in the museum and ${MAX_ROOM} a room, never two on one point, never lingering in a doorway`, () => {
    for (const day of [10, 11, 12, 13, 14, 15, 16]) {
      const c = crowdOf(options());
      for (let t = at(0, 0, day); t < at(24, 0, day); t += 20_000) {
        const all: VisitorPose[] = [];
        for (const r of ROOMS) {
          const ps = snap(c.step(t, r.id).poses) as unknown as VisitorPose[];
          expect(ps.length).toBeLessThanOrEqual(MAX_ROOM);
          for (const p of ps) {
            if (p.state === 'walk') continue;
            for (const d of r.doorways) expect(inside(p, d), `${p.id} in a doorway`).toBe(false);
          }
          const held = ps.filter((p) => p.state !== 'walk' && p.point).map((p) => p.point);
          expect(new Set(held).size).toBe(held.length);
          all.push(...ps);
        }
        expect(all.length).toBeLessThanOrEqual(MAX_IN);
        expect(new Set(all.map((p) => p.id)).size).toBe(all.length);
      }
    }
  });

  it('comes by day and is quiet in the small hours; some sit, some look, some chat in pairs', () => {
    const states = new Set<string>();
    let night = 0, day = 0;
    for (const d of [10, 11, 12, 13, 14, 15, 16]) {
      const c = crowdOf(options());
      for (let t = at(1, 0, d); t < at(5, 0, d); t += 60_000) for (const r of ROOMS) night += c.step(t, r.id).poses.length;
      for (let t = at(10, 0, d); t < at(20, 0, d); t += 15_000) {
        for (const r of ROOMS) {
          const ps = c.step(t, r.id).poses;
          day += ps.length;
          for (const p of ps) states.add(p.state);
        }
      }
    }
    expect(night).toBe(0);
    expect(day).toBeGreaterThan(1000);
    for (const s of ['walk', 'look', 'sit', 'chat']) expect(states, s).toContain(s);
  });

  it('comes in at its room’s door and goes out there, fading', () => {
    const c = crowdOf(options()), first = new Map<string, VisitorPose>();
    // (not those already in at the start)
    for (const p of c.step(at(10) - 250, 'fish').poses) first.set(p.id, { ...p, x: 75, z: 10, fade: 0 });
    let prev: VisitorPose[] = [], gone = 0;
    for (let t = at(10); t < at(14); t += 250) {
      const now = c.step(t, 'fish').poses.map((p) => ({ ...p }));
      for (const p of now) if (!first.has(p.id)) first.set(p.id, p);
      // (one gone since the last step: last seen at the door, fading out)
      for (const p of prev.filter((q) => !now.some((n) => n.id === q.id))) {
        expect(Math.hypot(p.x - 75, p.z - 10)).toBeLessThan(15);
        expect(p.fade).toBeLessThan(1);
        gone++;
      }
      prev = now;
    }
    expect(first.size).toBeGreaterThan(2);
    expect(gone).toBeGreaterThan(2);
    for (const p of first.values()) {
      expect(Math.hypot(p.x - 75, p.z - 10)).toBeLessThan(15);
      expect(p.fade).toBeLessThan(1);
    }
  });

  it('never uses a point in a doorway', () => {
    expect(usablePoints(POINTS, ROOMS).map((p) => p.id)).not.toContain('fx');
  });
});

describe('the museum’s visitors: a tap, a find, the frames', () => {
  /** The first moment from 10:00 a visitor in the aquarium is at a `look` point with a name. */
  function looking(c: ReturnType<typeof crowdOf>): [number, VisitorPose] {
    for (let t = at(10); t < at(20); t += 1000) {
      const p = c.step(t, 'fish').poses.find((q) => q.state === 'look' && q.point?.exhibitId && NAMES[q.point.exhibitId]);
      if (p) return [t, { ...p }];
    }
    throw new Error('no one looking');
  }

  it('turns to my villager, hops and says a line naming what it looks at; then strolls back onto its plan', () => {
    const c = crowdOf(options(mulberry32(3)));
    const [t, p] = looking(c);
    const line = c.tap(p.id, t, [p.x + 20, p.z])!;
    expect(line.ja).toBeTruthy();
    const step = c.step(t + 33, 'fish');
    expect(step.acts).toContainEqual({ id: p.id, act: 'hop' });
    const q = step.poses.find((x) => x.id === p.id)!;
    expect(q.state).toBe('talk');
    expect(q.yaw).toBeCloseTo(Math.PI / 2);
    // (after the talk: back where the plan has it, the same as a phone that never tapped)
    const other = crowdOf(options());
    let s = t + 33;
    for (; s < t + 20_000; s += 100) c.step(s, 'fish');
    expect(snap(c.step(s, 'fish').poses)).toEqual(snap(other.step(s, 'fish').poses));
    expect(c.tap('nobody', t, [0, 0])).toBeNull();
  });

  it('its lines name the exhibit and never repeat back to back', () => {
    const c = crowdOf(options(mulberry32(4)));
    const [t, p] = looking(c);
    let last = '', named = 0;
    for (let i = 0; i < 40; i++) {
      const l = c.tap(p.id, t + i * 10, [p.x, p.z + 20])!;
      expect(l.ja).not.toBe(last);
      if (l.ja.includes(NAMES[p.point!.exhibitId!].ja)) named++;
      last = l.ja;
    }
    expect(named).toBeGreaterThan(10);
  });

  it('a new find turns the room’s visitors to it with a start, and its lines call it new', () => {
    const c = crowdOf(options(mulberry32(5)));
    const [t, p] = looking(c);
    c.notice(p.point!.exhibitId!, t);
    const { acts } = c.step(t + 33, 'fish');
    expect(acts).toContainEqual({ id: p.id, act: 'surprise' });
    const news = LINES[p.personality].new.map(([ja]) => ja.replace('{name}', NAMES[p.point!.exhibitId!].ja));
    let saw = 0;
    for (let i = 0; i < 20; i++) if (news.includes(c.tap(p.id, t + 100 + i, [0, 0])!.ja)) saw++;
    expect(saw).toBeGreaterThan(3);
  });

  it('asks for frames only while one moves: none between, the time till the next change given', () => {
    const c = crowdOf(options());
    let rest = 0, moving = 0;
    for (let t = at(10); t < at(13); t += 500) {
      const ps = c.step(t, 'fish').poses, n = c.nextChange(t, 'fish');
      if (ps.some((p) => p.state === 'walk')) expect(n).toBe(0);
      else if (n > 0) {
        rest++;
        // (nothing changes before then)
        const later = snap(c.step(t + Math.min(n, 60_000) - 1, 'fish').poses);
        expect(later).toEqual(snap(c.step(t, 'fish').poses));
      } else moving++;
    }
    expect(rest).toBeGreaterThan(moving);
  });

  it('a seat a player sits on: the visitor stands by it', () => {
    const c = crowdOf(options());
    for (let t = at(9); t < at(21); t += 2000) {
      const p = c.step(t, 'fish').poses.find((q) => q.state === 'sit');
      if (!p) continue;
      const q = c.step(t, 'fish', new Set([p.point!.id])).poses.find((x) => x.id === p.id)!;
      expect(q.state).toBe('stand');
      expect([q.x, q.z]).toEqual(p.point!.from);
      return;
    }
    throw new Error('no one sat');
  });
});

/** The longest stretch with no break opportunity under keep-all (i18n/linebreaks.test's rule), {name} one character. */
const longestRun = (s: string) => Math.max(...s.replace(/\{[^}]+\}/g, 'X').split(/[\s、。！？!?）)」』・〜~/]|(?<=[（(「『])/).map((r) => [...r].length));

describe('the museum’s visitors on the real plan: busy rooms, emotes, a wave', () => {
  const rooms = VISITOR_ROOMS.map((r) => ({ ...r, bounds: boundsOf(r.id as RoomId) }));
  const real = (rand = Math.random) => crowdOf({ rooms, points: VISITOR_POINTS, path: () => [], name: () => null, rand });
  const DAYS = [10, 11, 12, 13, 14, 15, 16];

  it(`up to ${MAX_IN} in, ${MAX_ROOM} a room; in the afternoon and evening most rooms have someone, the aquarium and the bug garden nearly always`, () => {
    let samples = 0, busy = 0, total = 0, fishBug = 0, fishBugN = 0, peak = 0;
    for (const d of DAYS) {
      const c = real();
      for (let t = at(13, 0, d); t < at(20, 0, d); t += 60_000) {
        let all = 0;
        for (const r of ROOM_IDS) {
          const n = c.step(t, r).poses.length;
          expect(n).toBeLessThanOrEqual(MAX_ROOM);
          samples++;
          if (n) busy++;
          if (r === 'fish' || r === 'bug') (fishBugN++, n && fishBug++);
          all += n;
        }
        expect(all).toBeLessThanOrEqual(MAX_IN);
        total += all;
        peak = Math.max(peak, all);
      }
    }
    // (~70 % of the rooms one walks into)
    expect(busy / samples).toBeGreaterThan(0.7);
    expect(fishBug / fishBugN).toBeGreaterThan(0.8);
    expect(total / (samples / ROOM_IDS.length)).toBeGreaterThan(5);
    expect(peak).toBeGreaterThanOrEqual(7);
  });

  it('no place at a room’s very sides or front (the room view’s edge, under the HUD), and every room still has places', () => {
    const used = usablePoints(VISITOR_POINTS, rooms);
    for (const p of used) {
      const b = boundsOf(p.room as RoomId);
      expect(p.x - b.x0 >= 10 && b.x1 - p.x >= 10 && b.z1 - p.z >= 14, `${p.id} ${p.x},${p.z}`).toBe(true);
    }
    for (const r of ROOM_IDS) expect(used.filter((p) => p.room === r).length, r).toBeGreaterThan(MAX_ROOM);
    const box: VisitorRoom = { id: 'x', kind: 'hall', door: [0, 0], doorways: [], bounds: { x0: 0, x1: 100, z0: 0, z1: 100 } };
    const kept = usablePoints([P('a', 'x', 5, 50, 'look'), P('b', 'x', 50, 90, 'look'), P('c', 'x', 50, 50, 'look')], [box]).map((p) => p.id);
    expect(kept).toEqual(['c']);
  });

  it('an emote bubble (♪ ! 💡 …) every 40 s or so while one stays, still between, the same on every phone', () => {
    const a = real(mulberry32(1)), b = real(mulberry32(2));
    const starts: number[] = [], kinds = new Set<string>();
    let stayMs = 0;
    const was = new Map<string, string | null>();
    for (let t = at(13); t < at(17); t += 500) {
      for (const r of ROOM_IDS) {
        const pa = a.step(t, r).poses, pb = b.step(t, r).poses;
        expect(pa.map((p) => `${p.id}:${p.emote}`)).toEqual(pb.map((p) => `${p.id}:${p.emote}`));
        for (const p of pa) {
          if (p.state !== 'walk') stayMs += 500;
          if (p.emote && !was.get(p.id)) (starts.push(t), kinds.add(p.emote));
          if (p.emote) expect(p.state, p.id).not.toBe('walk');
          was.set(p.id, p.emote);
        }
      }
    }
    expect(kinds.size).toBe(4);
    const every = stayMs / starts.length;
    expect(every).toBeGreaterThan(30_000);
    expect(every).toBeLessThan(60_000);
    expect(EMOTE_MS).toBeLessThan(4000);
  });

  it(`waves once a visit at my villager come within ${WAVE_R} u (2 tiles), turned to it; this phone's only`, () => {
    const c = real(), plain = real();
    for (let t = at(14); t < at(18); t += 1000) {
      for (const r of ROOM_IDS) {
        const p = c.step(t, r).poses.find((q) => q.state === 'look' && q.fade === 1);
        if (!p) continue;
        const me: Pt = [p.x + WAVE_R - 4, p.z];
        expect(c.step(t + 20, r, undefined, [p.x + 60, p.z]).acts).toEqual([]);
        const near = c.step(t + 40, r, undefined, me);
        expect(near.acts).toContainEqual({ id: p.id, act: 'wave' });
        expect(near.poses.find((q) => q.id === p.id)!.yaw).toBeCloseTo(Math.PI / 2);
        expect(c.step(t + 80, r, undefined, me).acts.filter((x) => x.act === 'wave')).toEqual([]);
        // (the turn over, the plan's pose again: as a phone that never came near)
        const later = t + 4000;
        expect(snap(c.step(later, r, undefined, me).poses)).toEqual(snap(plain.step(later, r).poses));
        return;
      }
    }
    throw new Error('no one looking');
  });
});

describe('the museum’s visitors: their lines', () => {
  const all = Object.entries(LINES).flatMap(([p, pools]) => Object.entries(pools).flatMap(([k, v]) =>
    (typeof v[0] === 'string' ? [v as readonly [string, string]] : (v as readonly (readonly [string, string])[])).map((l) => ({ key: `${p}.${k}`, ja: l[0], en: l[1] }))));

  it('are the world’s copy: spaced kana (no kanji), no run past 12, two lines at most; {name} where an exhibit is named', () => {
    for (const l of all) {
      expect(l.ja, l.key).not.toMatch(/[一-鿿]/);
      expect(longestRun(l.ja), `${l.key}: ${l.ja}`).toBeLessThanOrEqual(12);
      expect(l.ja.split('\n').length, l.key).toBeLessThanOrEqual(2);
      expect(l.en.trim(), l.key).toBeTruthy();
      expect(l.ja.includes('{name}'), l.key).toBe(/\.(look|new)$/.test(l.key));
      expect(l.en.includes('{name}'), l.key).toBe(/\.(look|new)$/.test(l.key));
    }
  });

  it('never the same twice running, in every context and personality', () => {
    const r = mulberry32(9), ctxs: LineContext[] = ['look', 'new', 'sit', 'chat', 'hall', 'bug', 'fish', 'sea', 'fossil', 'art'];
    for (const p of Object.keys(LINES) as (keyof typeof LINES)[]) {
      for (const ctx of ctxs) {
        let last: string | undefined;
        const keys = new Set<string>();
        for (let i = 0; i < 30; i++) {
          const l = visitorLine(p, ctx, r, last, { ja: 'スズキ', en: 'sea bass' }, 'fish');
          expect(l.key).not.toBe(last);
          expect(l.ja).not.toContain('{name}');
          keys.add(l.key);
          last = l.key;
        }
        expect(keys.size).toBeGreaterThanOrEqual(2);
      }
      // (no name: the room's lines instead)
      expect(visitorLine(p, 'look', r, undefined, undefined, 'art').key).toMatch(/\.(art|idle)\./);
    }
  });
});
