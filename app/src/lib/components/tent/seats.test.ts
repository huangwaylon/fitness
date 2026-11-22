import { describe, expect, it } from 'vitest';
import { ITEMS, footprint } from './items.ts';
import { TILE, centreOf, toRoom, type Facing, type Pt } from './grid.ts';
import { seatShape, seatsOf } from './seats.ts';

const FACINGS: Facing[] = [0, 1, 2, 3];
/** The beds whose head isn't at NH's −x, checked by eye (scripts/seat-anchors.ts OVERRIDES): the inflatable sofa's
 *  tall closed end. */
// (the cardboard bed's: its tallest box at +x, by eye 2026-11-10)
const HEAD_PLUS = new Set(['f3962', 'f7161']);
const SLACK = 0.6;

const at = (item: string, f: Facing) => ({ id: 'p', item, x: 3, z: 3, f });
/** The piece's footprint in the room (model units: x0, x1, z0, z1). */
function rectOf(item: string, f: Facing): [number, number, number, number] {
  const [cx, cz] = centreOf(at(item, f)), [w, d] = footprint(item, f);
  return [cx - (w * TILE) / 2, cx + (w * TILE) / 2, cz - (d * TILE) / 2, cz + (d * TILE) / 2];
}
const inside = (r: readonly number[], p: Pt, s = SLACK) => p[0] >= r[0] - s && p[0] <= r[1] + s && p[1] >= r[2] - s && p[1] <= r[3] + s;
const dot = (a: readonly number[], b: readonly number[]) => a[0] * b[0] + a[1] * b[1];

describe('the tent’s seats and beds: each pose its model’s, turned and placed with the piece', () => {
  const lie = Object.keys(ITEMS).filter((c) => ITEMS[c].u === 'l'), sit = Object.keys(ITEMS).filter((c) => ITEMS[c].u === 's');

  it('every bed-like and seat-like piece has a pose for each of its seats (none left without)', () => {
    expect(lie.length).toBeGreaterThanOrEqual(30);
    expect(sit.length).toBeGreaterThanOrEqual(70);
    for (const c of [...lie, ...sit]) for (const f of FACINGS) expect(seatsOf(at(c, f)), `${c} f${f}`).toHaveLength(Math.max(1, ITEMS[c].n ?? 1));
    // a piece with no pose isn't offered
    expect(seatsOf({ ...at('f4081', 0), item: 'no-such' })).toEqual([]);
  });

  it('lain on at every facing: inside the footprint, along its long axis, the head at the pillow end, on the mattress', () => {
    for (const c of lie) for (const f of FACINGS) {
      const m = ITEMS[c], sh = seatShape(c)!, r = rectOf(c, f), [cx, cz] = centreOf(at(c, f)), k = `${c} f${f}`;
      expect(sh.k, k).toBe('l');
      if (sh.k !== 'l') continue;
      const seats = seatsOf(at(c, f));
      for (const st of seats) {
        const a = st.anchor, dir = [Math.sin(a.yaw), Math.cos(a.yaw)];
        const head: Pt = [a.x, a.z], feet: Pt = [a.x + dir[0] * a.len, a.z + dir[1] * a.len];
        expect(inside(r, head) && inside(r, feet), `${k}: the body in the footprint`).toBe(true);
        // (a one-tile bed, the baby bed's cot, a villager overhangs: NH's own)
        expect(a.len, k).toBeGreaterThan(m.w * m.d === 1 ? 8 : 10);
        // along the model's long axis turned with it (the footprint's longer side when it has one)
        const ax = toRoom(sh.a === 'x' ? [1, 0, 0] : [0, 0, 1], f);
        expect(Math.abs(dot(dir, [ax[0], ax[2]])), k).toBeCloseTo(1, 6);
        const [fw, fd] = footprint(c, f);
        if (fw !== fd) expect(Math.abs(dir[0]) > 0.5 === fw > fd, `${k}: along the longer side`).toBe(true);
        // the head at the pillow's end (its model's −x but the hand-checked), the feet toward the other
        const pillow = toRoom([HEAD_PLUS.has(c) ? 1 : -1, 0, 0], f);
        expect(dot([head[0] - cx, head[1] - cz], [pillow[0], pillow[2]]), `${k}: the head at the pillow end`).toBeGreaterThan(3);
        expect(dot(dir, [pillow[0], pillow[2]]), k).toBeLessThan(-0.99);
        // on the mattress: over the floor, under the piece's top, the pillow end no lower
        expect(a.y > 0.3 && a.y <= m.h + 0.1, `${k}: y ${a.y} of ${m.h}`).toBe(true);
        expect(a.pillow, k).toBeGreaterThanOrEqual(0);
        // the anchor is its model's point turned by toRoom (grid.ts: as the room turns the piece)
        const o = toRoom([sh.head < 0 ? sh.s[0] : sh.s[1], 0, sh.c[st.n]], f);
        expect(Math.hypot(cx + o[0] - a.x, cz + o[2] - a.z), k).toBeLessThan(1e-6);
        // got onto from a step just off the footprint
        expect(!inside(r, st.from, 0) && inside(r, st.from, 5), `${k}: from ${st.from}`).toBe(true);
      }
      // a double bed's two side by side, a body's width apart
      if (seats.length === 2) {
        const [p, q] = seats.map((s) => [s.anchor.x, s.anchor.z]), dir = [Math.sin(seats[0].anchor.yaw), Math.cos(seats[0].anchor.yaw)];
        expect(Math.abs(dot([q[0] - p[0], q[1] - p[1]], dir)), k).toBeLessThan(0.5);
        expect(Math.hypot(q[0] - p[0], q[1] - p[1]), k).toBeGreaterThan(6);
      }
    }
  });

  it('sat on at every facing: on the seat inside the footprint, facing the piece’s front, at its seat’s height', () => {
    for (const c of sit) for (const f of FACINGS) {
      // (a turned seat, a ride-on's, faces its own way: its yaw from the piece's front)
      const sh = seatShape(c), yaw = sh?.k === 's' ? (sh.yaw ?? 0) : 0;
      const m = ITEMS[c], r = rectOf(c, f), k = `${c} f${f}`, front = toRoom([Math.sin(yaw), 0, Math.cos(yaw)], f);
      for (const st of seatsOf(at(c, f))) {
        const a = st.anchor;
        expect(inside(r, [a.x, a.z]), k).toBe(true);
        expect(Math.sin(a.yaw) * front[0] + Math.cos(a.yaw) * front[2], k).toBeCloseTo(1, 6);
        expect(a.y > 0.3 && a.y <= m.h + 0.1, `${k}: y ${a.y} of ${m.h}`).toBe(true);
        // its step is in front
        expect(dot([st.from[0] - a.x, st.from[1] - a.z], [front[0], front[2]]), k).toBeGreaterThan(2);
      }
    }
  });

  it('got on and off from the nearest free side: a bed’s own side, else the other, else its foot; a chair’s front, else a side', () => {
    // the cot turned a quarter (f 1: its length along z, its head at +z), its sides ±x
    const p = at('f4081', 1), [cx, cz] = centreOf(p);
    const side = (q: Pt) => Math.sign(Math.round(q[0] - cx));
    const near = (x: number): Pt => [cx + x, cz];
    expect(side(seatsOf(p, () => true, near(-20))[0].from)).toBe(-1);
    expect(side(seatsOf(p, () => true, near(20))[0].from)).toBe(1);
    // that side blocked (a piece or the wall there): the other
    expect(side(seatsOf(p, (q) => q[0] > cx, near(-20))[0].from)).toBe(1);
    // both: its foot (−z here: the head's +z)
    const foot = seatsOf(p, (q) => Math.abs(q[0] - cx) < 1, near(-20))[0].from;
    expect(foot[1]).toBeLessThan(cz - 10);
    // a double bed: each sleeper its own half's side
    const [l, r] = seatsOf(at('f4041', 0), () => true);
    expect(Math.sign(l.from[1] - l.anchor.z)).toBe(-Math.sign(r.from[1] - r.anchor.z));
    // a chair pushed in at a table (its front blocked): a side
    const ch = at('f4039', 0), [hx, hz] = centreOf(ch), off = seatsOf(ch, (q) => q[1] < hz + 3)[0].from;
    expect(Math.abs(off[0] - hx)).toBeGreaterThan(5);
  });

  describe('the pieces NH’s sheet leaves unused, sat or lain on by their kind (room-models.ts USE_HINT)', () => {
    const SIT = {
      toilets: ['f1929', 'f2776', 'f3472', 'f1217', 'f2775', 'f1234'],
      chairs: ['f12338', 'f12339', 'f13519', 'f13518', 'f13288', 'f3345'],
      rockers: ['f1103', 'f5954'],
      rides: ['f83', 'f4379', 'f12921']
    };
    const LIE = ['f79', 'f3621'];
    const seat = (c: string) => seatsOf(at(c, 0))[0];

    it('each has its seat or bed, at a height its model allows', () => {
      for (const c of Object.values(SIT).flat()) {
        expect(ITEMS[c]?.u, c).toBe('s');
        expect(seatsOf(at(c, 0)), c).toHaveLength(1);
      }
      for (const c of LIE) expect(ITEMS[c]?.u, c).toBe('l');
      // a toilet's seat a chair's height (the squat one's at its rim, the standing one's its lip), the portable one's
      // inside its booth
      for (const c of ['f1929', 'f2776', 'f3472']) expect(seat(c).y, c).toBeGreaterThan(4);
      expect(seat('f2775').y).toBeLessThan(2);
      expect(seat('f1217').y).toBeCloseTo(2.9, 1);
      expect(seat('f1234').y).toBeGreaterThan(5);
      // the high chair's seat under its tray, the lifeguard chair's up its ladder under its canopy
      expect(seat('f13288').y).toBeLessThan(8);
      expect(seat('f3345').y).toBeGreaterThan(13);
      expect(seat('f3345').y).toBeLessThan(ITEMS.f3345.h - 8);
      // the baby bed in its cot, the loft bed up on its loft (its desk under)
      expect(seatsOf(at('f79', 0))[0].y).toBeGreaterThan(5);
      expect(seatsOf(at('f3621', 0))[0].y).toBeGreaterThan(18);
    });

    it('the rocking chairs and the ride-ons rock; a ride-on is ridden facing its head (−x), got on from beside it', () => {
      for (const c of [...SIT.rockers, ...SIT.rides]) expect(seat(c).anchor.sway, c).toBe(true);
      for (const c of [...SIT.toilets, ...SIT.chairs]) expect(seat(c).anchor.sway, c).toBe(false);
      for (const c of [...SIT.rides, 'f5954']) for (const f of FACINGS) {
        const st = seatsOf(at(c, f))[0], head = toRoom([-1, 0, 0], f), [cx, cz] = centreOf(at(c, f));
        expect(Math.sin(st.anchor.yaw) * head[0] + Math.cos(st.anchor.yaw) * head[2], `${c} f${f}`).toBeCloseTo(1, 6);
        expect(!inside(rectOf(c, f), st.from, 0), `${c} f${f}: from off the piece`).toBe(true);
        expect(Math.hypot(st.from[0] - cx, st.from[1] - cz), `${c} f${f}`).toBeLessThan(TILE);
      }
    });

    it('not the workbenches, the flower bed nor the bathroom stall (a hiding place)', () => {
      for (const c of ['f1241', 'f3943', 'f3122', 'f7142', 'f967', 'f1235']) {
        expect(ITEMS[c]?.u, c).toBeUndefined();
        expect(seatsOf(at(c, 0)), c).toEqual([]);
      }
    });
  });
});
