import { describe, expect, test } from 'vitest';
import { freeSeat, seatAnchor, seatNamed, seatOpen, seatPieceAt, seatSpots, sitLook, type SeatSpot } from './sitting.ts';
import { defaultLayout, objMid, withChanges, type Obj } from '#lib/layout/model.ts';
import { seatsOf } from '#lib/layout/nav.ts';

const l0 = defaultLayout();
const KINDS = [['park-bench', 2, false], ['log-bench', 2, false], ['log-stool', 1, false], ['iron-chair', 1, false], ['hammock', 1, true], ['beach-chair', 1, true]] as const;
const at = (o: Obj) => withChanges(l0, { set: [o] });

describe('sitting.ts: the island\'s seats', () => {
  for (const [k, n, lie] of KINDS)
    test(`${k}: ${n} ${lie ? 'to lie on' : 'to sit on'}, its spots a step in front of its model's own seats, every facing`, () => {
      for (const f of [0, 1, 2, 3] as const) {
        const o: Obj = { id: 'o1', k, x: 8, z: 20, f };
        const l = at(o), spots = seatSpots(l, o);
        expect(spots.map((s) => s.lie)).toEqual(Array(n).fill(lie));
        expect(spots.map((s) => s.name)).toEqual(n > 1 ? ['seat-o1-0', 'seat-o1-1'] : ['seat-o1']);
        for (const s of spots) {
          // the spot (where the walk ends) is where the 3D villager steps on and off it (its anchor's `from`, three's z)
          const a = seatAnchor(l, s.name, 0)!;
          expect(a.lie).toBe(lie);
          expect(Math.hypot(a.from[0] - s.at[0], -a.from[1] - s.at[1]), `${k} f${f} #${s.n}`).toBeLessThan(1.5);
          // the seat itself is on the piece, near its middle
          const [mx, mz] = objMid(l, o);
          expect(Math.hypot(a.x - mx, -a.z - mz)).toBeLessThan(30);
        }
        // a turning piece's seat faces the way it does (three's yaw: f 0 toward us, a quarter turn each)
        if (!lie && k !== 'log-stool') expect(seatAnchor(l, spots[0].name, 0)!.yaw).toBeCloseTo((f * Math.PI) / 2, 5);
      }
    });

  test('the default island\'s seats keep their names (the walk graph\'s, the idle life\'s), on their pieces', () => {
    for (const name of ['seatMaeL', 'seatMaeR', 'seatPondL', 'seatPondR', 'stoolW', 'stoolE', 'seat-hammock', 'seat-beach-chair']) {
      const s = seatNamed(l0, name);
      expect(s, name).not.toBeNull();
      expect(seatAnchor(l0, name, 0), name).not.toBeNull();
    }
    expect(seatNamed(l0, 'seat-hammock')!.lie).toBe(true);
    // the bench's two, left to right as it faces us
    const [l, r] = [seatNamed(l0, 'seatMaeL')!, seatNamed(l0, 'seatMaeR')!];
    expect(l.piece).toBe('bench-mae');
    expect(l.at[0]).toBeLessThan(r.at[0]);
    // the pull-up bar is no seat
    expect(seatSpots(l0, l0.objects.get('pullup')!)).toEqual([]);
    expect(seatsOf(l0, l0.objects.get('pullup')!).map(([n]) => n)).toEqual(['pullup']);
  });

  test('one villager a seat: the nearest free one, a bench two, none when all are taken', () => {
    const bench = l0.objects.get('bench-mae')!, spots = seatSpots(l0, bench);
    const [L, R] = spots;
    const none = () => false;
    expect(freeSeat(spots, [L.at[0] - 40, L.at[1]], none)).toBe(L);
    expect(freeSeat(spots, [R.at[0] + 40, R.at[1]], none)).toBe(R);
    const onL = (s: SeatSpot) => s.name === L.name;
    expect(freeSeat(spots, [L.at[0] - 40, L.at[1]], onL)).toBe(R);
    expect(freeSeat(spots, L.at, () => true)).toBeNull();
    const stool = seatSpots(l0, l0.objects.get('stool-1')!);
    expect(freeSeat(stool, [0, 0], (s) => s.name === 'stoolW')).toBeNull();
  });

  test('a seat at a decor spot is there only when the day\'s piece is its own (not the illuminated tree, the picnic set, the beach chair out of summer)', () => {
    const slots = [{ id: 'hammock' }, { id: 'bench-pond' }, { id: 'beach-chair' }];
    const hammock = seatNamed(l0, 'seat-hammock')!, pond = seatNamed(l0, 'seatPondL')!, stool = seatNamed(l0, 'stoolW')!, chair = seatNamed(l0, 'seat-beach-chair')!;
    expect(seatOpen(hammock, [{ id: 'hammock', key: 'deco/hammock' }], slots)).toBe(true);
    expect(seatOpen(hammock, [{ id: 'hammock', key: 'deco/illumi-tree' }], slots)).toBe(false);
    expect(seatOpen(pond, [{ id: 'bench-pond', key: 'deco/picnic-set' }], slots)).toBe(false);
    expect(seatOpen(chair, [], slots)).toBe(false);
    expect(seatOpen(stool, [], slots)).toBe(true);
  });

  test('a seat\'s look sits (its tap area); a tap on the ground at a seat\'s foot finds its piece', () => {
    expect(['deco/park-bench', 'deco/log-bench', 'deco/log-stool', 'deco/hammock', 'deco/beach-chair'].every(sitLook)).toBe(true);
    expect(['deco/picnic-set', 'deco/illumi-tree', 'deco/pump', 'deco/pullup'].some(sitLook)).toBe(false);
    const o: Obj = { id: 'c1', k: 'iron-chair', x: 8, z: 20, f: 1 }, l = at(o), [mx, mz] = objMid(l, o);
    expect(seatPieceAt(l, mx + 4, mz - 6)?.id).toBe('c1');
    expect(seatPieceAt(l, mx + 60, mz)).toBeNull();
  });
});
