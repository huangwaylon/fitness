// The outdoor catalogue (layout/outdoor.ts, outdoor.json from scripts/outdoor-catalog.ts): every piece is its room
// piece's own data, once, in a tab of the editor's, never a piece the editor already has; loaded, its kinds stand on
// the island as the rooms' models at NH's furniture scale, their seats, tops and lights the rooms'; unloaded, nothing
// (the first load unchanged).
import { beforeAll, describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import O from './outdoor.json' with { type: 'json' };
import ITEMS_JSON from '../components/tent/items.json' with { type: 'json' };
import MORE from '../components/tent/more.json' with { type: 'json' };
import SEATS from '../components/villager3d/seats3d.json' with { type: 'json' };
import SEATS_MORE from '../components/tent/seats-more.json' with { type: 'json' };
import JA from '../i18n/tent.ja.json' with { type: 'json' };
import EN from '../i18n/tent.en.json' with { type: 'json' };
import UI_JA from '../i18n/ja.json' with { type: 'json' };
import UI_EN from '../i18n/en.json' with { type: 'json' };
import { KIND_LIST, kindDef } from './catalog.ts';
import { isOutdoor, kindOf, loadOutdoor, outdoorPiece, outdoorReady, outdoorSeatOn, wantsOutdoor, type OutdoorPiece } from './outdoor.ts';
import { defaultLayout, withChanges, type Obj } from './model.ts';
import { isSmallKind, isSurfaceKind, topOf } from './tops.ts';
import { seatsOf } from './nav.ts';
import { validate } from './validate.ts';
import { anchorsOf, shapeOf } from '../components/villager3d/seats3d.ts';
import { placeObjects } from '../components/world3d/objects.ts';
import { roomLamp } from '../components/world3d/outdoorModels.ts';
import { DECOR_U } from '#lib/world/world.ts';

const APP = join(import.meta.dirname, '..', '..', '..');
const PIECES = O.pieces as unknown as Record<string, Omit<OutdoorPiece, 'code'>>;
const ROOM = { ...ITEMS_JSON.items, ...MORE.items } as unknown as Record<string, Record<string, unknown>>;
const SEAT = { ...SEATS.tent, ...SEATS_MORE.tent } as Record<string, unknown>;
/** The island's own kinds (before the table adds its own). */
const OWN = [...KIND_LIST];
const ROOM_KEYS = ['w', 'd', 'h', 'v', 'pk', 'lit', 'lt', 'e', 's', 'sy', 'st', 'sl', 'sm', 'gy'] as const;

describe('the outdoor catalogue (outdoor.json)', () => {
  it('each piece once, in a tab the editors have, with its names', () => {
    const text = readFileSync(join(APP, 'src', 'lib', 'layout', 'outdoor.json'), 'utf8');
    for (const c of Object.keys(PIECES)) expect(text.split(`"${c}": {`).length - 1, c).toBe(1);
    expect(Object.keys(PIECES).length).toBeGreaterThan(380);
    const edit = readFileSync(join(APP, 'src', 'lib', 'components', 'layoutEdit', 'IslandEdit.svelte'), 'utf8');
    const desk = readFileSync(join(APP, 'src', 'lib', 'components', 'editor', 'Editor.svelte'), 'utf8');
    for (const t of O.tabs) {
      expect(Object.values(PIECES).some((p) => p.t === t), t).toBe(true);
      expect(edit, t).toContain(`'${t}'`);
      expect(desk, t).toContain(`['${t}', '${(UI_JA as Record<string, string>)[`decor.tab.${t}`]}']`);
      expect((UI_EN as Record<string, string>)[`decor.tab.${t}`], t).toBeTruthy();
    }
    for (const [c, p] of Object.entries(PIECES)) {
      expect(O.tabs, c).toContain(p.t);
      expect(p.ja, c).toBe((JA as Record<string, string>)[`tent.item.${c}`]);
      expect(p.en, c).toBe((EN as Record<string, string>)[`tent.item.${c}`]);
    }
  });
  it('is the rooms’ own data: footprint, height, model, light, top, small, gyroid, seat', () => {
    for (const [c, p] of Object.entries(PIECES)) {
      const m = ROOM[c];
      expect(m, c).toBeTruthy();
      for (const k of ROOM_KEYS) expect((p as Record<string, unknown>)[k], `${c}.${k}`).toEqual(m[k]);
      expect(m.rug ?? m.wl ?? m.cl ?? m.cr, c).toBeUndefined();
      // a seat with no pose isn't offered (the rooms' rule)
      if (p.u) expect(p.seat, c).toEqual(SEAT[c]);
      else expect(m.u && SEAT[c], c).toBeFalsy();
      // its icon: the ずかん's or NH's own, a loose file
      expect(existsSync(join(APP, 'static', p.i === 1 ? `room/icons/${c}.webp` : `art/finds/items/${p.i}.webp`)), c).toBe(true);
      // its model: a loose file, or a place in a room pack that exists
      if (p.pk) expect(existsSync(join(APP, 'static', 'room', 'pack', `${p.pk[0]}.pak`)), c).toBe(true);
      else expect(existsSync(join(APP, 'static', 'room', 'models', `${c}.glb`)), c).toBe(true);
    }
  });
  it('never a piece the editor has already, nor one of its names', () => {
    const inEditor = O.inEditor as Record<string, string>;
    for (const c of Object.keys(inEditor)) expect(PIECES[c], c).toBeUndefined();
    for (const k of Object.values(inEditor)) if (!k.startsWith('(')) expect(OWN.some((d) => d.k === k), k).toBe(true);
    const names = new Set(OWN.flatMap((d) => [d.ja, d.en.toLowerCase()]));
    for (const [c, p] of Object.entries(PIECES)) expect(names.has(p.ja) || names.has(p.en.toLowerCase()), `${c} ${p.en}`).toBe(false);
    expect(new Set(Object.values(PIECES).map((p) => p.en)).size).toBe(Object.keys(PIECES).length);
  });
  it('holds the gyroids, the plaza, castle and Festivale sets, the playground and the vehicles', () => {
    const tab = (t: string) => Object.values(PIECES).filter((p) => p.t === t).map((p) => p.en);
    expect(tab('gyroid')).toHaveLength(36);
    expect(tab('park')).toEqual(expect.arrayContaining(['plaza merry-go-round', 'plaza ferris wheel', 'playground gym', 'springy ride-on']));
    expect(tab('town')).toEqual(expect.arrayContaining(['castle gate', 'castle tower', 'castle wall', 'bulldozer', 'phone box']));
    expect(tab('event')).toEqual(expect.arrayContaining(['Festivale float', 'Festivale stage', 'illuminated tree', 'spooky carriage']));
  });
});

describe('its kinds on the island', () => {
  const code = 'f12688', k = `nh-${code}`; // the plaza bench: sat on by two
  it('are unknown till the table’s in, and nothing is drawn of them', () => {
    expect(outdoorReady()).toBe(false);
    expect(kindDef(k)).toBeUndefined();
    const l = withChanges(defaultLayout(), { set: [{ id: 'nh1', k, x: 4, z: 20, f: 0 }] });
    expect(wantsOutdoor(l)).toBe(true);
    expect(wantsOutdoor(defaultLayout())).toBe(false);
    expect(placeObjects(l, { season: 'autumn', foliage: 'summer', month: 11 }).insts.some((i) => i.id === 'nh1')).toBe(false);
  });
  describe('loaded', () => {
    beforeAll(() => loadOutdoor());
    it('join the catalogue: footprint, height at NH’s scale, its icon', () => {
      expect(isOutdoor(k)).toBe(true);
      const d = kindDef(k)!;
      expect(d).toMatchObject({ group: 'furniture', w: 2, d: 1, block: true, turns: true, room: code, h: Math.round((PIECES[code].h as number) * DECOR_U * 10) / 10 });
      expect(KIND_LIST.filter((x) => x.room)).toHaveLength(Object.keys(PIECES).length);
      expect(new Set(KIND_LIST.map((x) => x.k)).size).toBe(KIND_LIST.length);
      expect(kindOf(outdoorPiece('nh-f14074')!).icon).toBe('room:f14074');
    });
    it('stand as their room model at NH’s furniture scale, turned by their facing', () => {
      const l = withChanges(defaultLayout(), { set: [{ id: 'nh1', k, x: 4, z: 20, f: 1 }] });
      const i = placeObjects(l, { season: 'autumn', foliage: 'summer', month: 11 }).insts.find((x) => x.id === 'nh1')!;
      expect(i).toMatchObject({ model: `nh/${code}`, scale: DECOR_U, yaw: Math.PI / 2 });
      expect(validate(l).filter((x) => x.ids.includes('nh1') && x.level === 'error')).toEqual([]);
    });
    it('a seat’s spots are its room seat’s, where its anchors are got onto', () => {
      for (const [c, p] of Object.entries(PIECES)) {
        if (!p.seat) continue;
        const o: Obj = { id: 'x', k: `nh-${c}`, x: 6, z: 20, f: 0 };
        const l = withChanges(defaultLayout(), { set: [o] });
        const spots = seatsOf(l, o), on = outdoorSeatOn(o.k)!;
        expect(spots.length, c).toBe(on.x.length);
        const sh = shapeOf('island', o.k)!;
        const a = anchorsOf(sh, { x: 0, z: 0, y: 0, yaw: 0, s: DECOR_U });
        // (the spot a step in front, across where the anchor gets on: a bed along x has its sleepers on one side)
        for (let n = 0; n < spots.length; n++) {
          expect(on.x[n], c).toBeCloseTo(a[n].from[0], 3);
          expect(on.front, c).toBeCloseTo(a[n].from[1], 3);
        }
      }
    });
    it('a surface holds small things on its room top; a small thing goes on one', () => {
      const tops = Object.entries(PIECES).filter(([, p]) => p.s && p.sy !== undefined);
      expect(tops.length).toBeGreaterThan(10);
      for (const [c, p] of tops) {
        expect(isSurfaceKind(`nh-${c}`), c).toBe(true);
        expect(topOf(`nh-${c}`), c).toMatchObject({ w: p.w, d: p.d, sy: p.sy });
      }
      expect(isSmallKind('nh-f14338')).toBe(true); // dango
      expect(isSmallKind('nh-f12688')).toBe(false);
    });
    it('a light’s point is its room emitter; a glow without NH’s lighting none', () => {
      const lamps = Object.values(PIECES).filter((p) => p.lt && p.e);
      expect(lamps.length).toBeGreaterThan(15);
      for (const p of lamps) expect(roomLamp({ code: '', ...p })?.e).toEqual(p.e);
      expect(roomLamp({ code: 'f14207', ...PIECES.f14207 })).toBeNull(); // the glowing-moss stool: it glows, no light
    });
  });
});
