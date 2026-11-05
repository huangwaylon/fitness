// K.K. Slider on the island (island/kkSlider.ts): his stool on the layout (the default's spot, an arranged island's,
// the editor's moves, the checks), his week (the show, the day, asleep) and what a tap or a beat does.
import { describe, expect, test } from 'vitest';
import RECORD from '#lib/layout/record-2026-11-03.json' with { type: 'json' };
import { layoutOpOf, mergeLayout, type LayoutEntry } from '#lib/contract/layout.ts';
import { defaultLayout, layoutOf, opsBetween, withChanges } from '#lib/layout/model.ts';
import { kindDef } from '#lib/layout/catalog.ts';
import { navOf, reachable } from '#lib/layout/nav.ts';
import { stageOf } from '#lib/layout/spots.ts';
import { validate } from '#lib/layout/validate.ts';
import { tileMid } from '#lib/layout/grid.ts';
import { move, remove, removable, rotate } from '../editor/edits.ts';
import { KK_SEAT, KK_STOOL_H, kkAct, kkEmote, kkGreeting, kkMode, kkSpot } from './kkSlider.ts';
import { visitorAt } from './visitors.ts';
import ja from '#lib/i18n/ja.json';
import en from '#lib/i18n/en.json';

const errorsOf = (l: ReturnType<typeof defaultLayout>, id = 'kk-slider') => validate(l).filter((i) => i.level === 'error' && i.ids.includes(id)).map((i) => i.code);
const record = () => {
  const m = new Map<string, LayoutEntry>();
  for (const { who, ...r } of RECORD as Record<string, unknown>[]) {
    const op = layoutOpOf(r);
    if (op) mergeLayout(m, { ...op, who } as LayoutEntry);
  }
  return m;
};

describe('his stool on the layout', () => {
  test('a fixed piece of its own: one to an island, never deleted, turned, its front kept clear (listeners stand there)', () => {
    expect(kindDef('kk-stool')).toMatchObject({ fixed: true, turns: true, front: true, block: true, w: 1, d: 1 });
    expect(KK_SEAT).toBeGreaterThan(5);
    expect(KK_SEAT).toBeLessThan(KK_STOOL_H);
  });
  test('the default puts him on まえ’s lawn west of the main path, behind the visitors’ stage and off to its side, facing the camera: valid, his front reachable, the stage where it was', () => {
    const l = defaultLayout();
    expect(l.objects.get('kk-slider')).toEqual({ id: 'kk-slider', k: 'kk-stool', x: 6, z: 22, f: 0 });
    expect(kkSpot(l)).toMatchObject({ x: tileMid(6, 22)[0], z: tileMid(6, 22)[1], f: 0, yaw: 0, id: 'kk-slider' });
    expect(validate(l).filter((i) => i.level === 'error')).toEqual([]);
    const nav = navOf(l), front = nav.named['front-kk-slider'];
    expect(front).toBeDefined();
    expect(reachable(nav, front[0], front[1])).toBe(true);
    expect(stageOf(l)).toEqual(tileMid(8, 17));
  });
  test('an island arranged before him (the record of 2026-11-03) has him at his default with no op: his tile and front free there, nothing of his wrong', () => {
    const l = layoutOf(record());
    expect(l.objects.get('kk-slider')).toMatchObject({ k: 'kk-stool', x: 6, z: 22 });
    expect(errorsOf(l)).toEqual([]);
  });
  test('the editor moves him (an `o` op of his id, both phones), turns him (he faces its way), never deletes him', () => {
    const l = defaultLayout();
    const moved = move(l, ['kk-slider'], 2, 3);
    expect(moved.objects.get('kk-slider')).toMatchObject({ x: 8, z: 25 });
    const ops = opsBetween(l, moved, 1.8e12);
    expect(ops).toEqual([{ sc: 'o', id: 'kk-slider', at: 1.8e12, k: 'kk-stool', x: 8, z: 25, f: 0 }]);
    expect(layoutOpOf(ops[0] as unknown as Record<string, unknown>)).toEqual(ops[0]); // (the record and the relay take it)
    const folded = layoutOf([{ ...ops[0], who: 'B' } as LayoutEntry]);
    expect(kkSpot(folded)).toMatchObject({ x: tileMid(8, 25)[0], z: tileMid(8, 25)[1] });
    const turned = rotate(l, ['kk-slider']);
    expect(kkSpot(turned)).toMatchObject({ f: 1, yaw: Math.PI / 2 });
    expect(removable(l.objects.get('kk-slider')!)).toBe(false);
    expect(remove(l, ['kk-slider']).objects.has('kk-slider')).toBe(true);
  });
  test('the checks: on a tree he overlaps it; in the sea he’s off the land; his front walled in, nobody can stand there', () => {
    const l = defaultLayout();
    const oak = l.objects.get('oak-m1')!;
    expect(errorsOf(withChanges(l, { set: [{ ...l.objects.get('kk-slider')!, x: oak.x, z: oak.z }] }))).toContain('overlap');
    expect(errorsOf(withChanges(l, { set: [{ ...l.objects.get('kk-slider')!, x: 0, z: 0 }] }))).toContain('off-land');
    // a bush on the tile in front of him (6, 21: a flower grows there, which nobody minds)
    const walled = withChanges(l, { set: [{ id: 'b-front', k: 'bush', x: 6, z: 21, f: 0, s: 'holly' }] });
    expect(errorsOf(walled)).toContain('door');
  });
});

describe('his week', () => {
  test('Saturday 18:00–24:00 his show; asleep 00:00–06:00 (after the show too); else his day', () => {
    expect(kkMode(6, 18)).toBe('show');
    expect(kkMode(6, 23)).toBe('show');
    expect(kkMode(6, 17)).toBe('day');
    expect(kkMode(0, 0)).toBe('asleep'); // the show's over at midnight
    expect(kkMode(3, 5)).toBe('asleep');
    expect(kkMode(3, 6)).toBe('day');
    expect(kkMode(1, 23)).toBe('day');
  });
  test('no visitor stands in the plaza at his show (he isn’t one): the rotation stops at 18:00 on Saturdays', () => {
    for (const d of ['2026-10-24', '2026-10-31', '2026-11-07']) for (const h of [18, 21, 23]) {
      const v = visitorAt(d, d, h, 6, undefined, null, false);
      expect(v === null || v === 'jack', `${d} ${h}`).toBe(true); // (Halloween night's Jack comes even so)
    }
  });
  test('a tap: the show’s greeting asks for a request, by day too; no songs yet, tuning; asleep a mumble', () => {
    expect(kkGreeting('show', true)).toEqual({ key: 'chat.sp.kk-slider.hello', asks: true });
    expect(kkGreeting('day', true)).toEqual({ key: 'chat.sp.kk-slider.dayHello', asks: true });
    expect(kkGreeting('day', false)).toEqual({ key: 'chat.sp.kk-slider.tuning', asks: false });
    expect(kkGreeting('asleep', true)).toEqual({ key: 'chat.sp.kk-slider.asleep', asks: false });
    for (const k of ['hello', 'dayHello', 'tuning', 'asleep', 'bye', 'byeDay', 'intro', '0', '1', '2', '3'])
      for (const c of [ja, en] as Record<string, string>[]) expect(c[`chat.sp.kk-slider.${k}`], k).toBeTruthy();
  });
  test('a beat: asleep a snore; playing a strum; else a strum or an emote; nothing while he speaks', () => {
    const acts = (mode: Parameters<typeof kkAct>[0], s = { speaking: false, playing: false }) =>
      new Set(Array.from({ length: 40 }, (_, i) => kkAct(mode, s, () => i / 40)));
    expect(acts('asleep')).toEqual(new Set(['snore']));
    expect(acts('day', { speaking: false, playing: true })).toEqual(new Set(['strum']));
    expect(acts('day')).toEqual(new Set(['strum', 'emote']));
    expect(acts('show', { speaking: true, playing: false })).toEqual(new Set([null]));
    expect(kkEmote('asleep', Math.random)).toBeNull();
    for (let i = 0; i < 20; i++) expect(kkEmote('show', Math.random, 'mark-note')).not.toBe('mark-note');
  });
});
