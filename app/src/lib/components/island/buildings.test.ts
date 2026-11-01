import { describe, expect, it } from 'vitest';
import ja from '#lib/i18n/ja.json';
import en from '#lib/i18n/en.json';
import { INFO, NPCS, WILBUR_AT, doorAt, doorLine, nightAtRs, wilburShows, type NpcId } from './buildings.ts';
import { findPath, nav, reachable } from './nav.ts';
import { BUILDINGS, DOCK, HOMES, type BuildingId } from './world.ts';

const JA = ja as Record<string, string>, EN = en as Record<string, string>;
const ids = BUILDINGS.map((b) => b.id);
const seq = (...xs: number[]) => {
  let i = 0;
  return () => xs[i++ % xs.length];
};

describe('the buildings’ doors', () => {
  it('every door is on the main ground, reachable from home, in front of its building', () => {
    const g = nav();
    for (const id of ids) {
      const d = doorAt(id), b = BUILDINGS.find((q) => q.id === id)!;
      expect(reachable(g, d[0], d[1]), id).toBe(true);
      expect(findPath(g, [...HOMES.A], d), id).not.toBeNull();
      expect(d[1]).toBeLessThan(b.z);
      expect(Math.abs(d[0] - b.x)).toBeLessThan(1);
    }
  });

  it('each opens what the user chose: せってい, ごほうび, the むらびと picker, ずかん, つうしん; the campsite nothing', () => {
    const want: Record<BuildingId, string | null> = { rs: 'settings', cranny: 'shop', able: 'villager', museum: 'zukan', airport: 'sync', campsite: null };
    for (const id of ids) expect(INFO[id].opens, id).toBe(want[id]);
  });
});

describe('who answers and what they say', () => {
  it('しずえ by day and たぬきち at night (22:00–05:00) at Resident Services', () => {
    expect(nightAtRs(21)).toBe(false);
    expect(nightAtRs(22)).toBe(true);
    expect(nightAtRs(4)).toBe(true);
    expect(nightAtRs(5)).toBe(false);
    expect(doorLine('rs', 12, () => 0)!).toMatchObject({ npc: 'isabelle', key: 'world.door.rs.0', opens: 'settings', colour: NPCS.isabelle.colour });
    expect(doorLine('rs', 23, () => 0)!).toMatchObject({ npc: 'nook', key: 'world.door.nook.0', opens: 'settings' });
  });

  it('never says the same line twice running', () => {
    for (const id of ['rs', 'cranny', 'able', 'airport'] as const) {
      const a = doorLine(id, 12, seq(0.5))!, b = doorLine(id, 12, seq(0.5), a.key)!;
      expect(b.key).not.toBe(a.key);
    }
  });

  it('the museum is フータ’s own (Museum.svelte); the campsite has nobody, its line is about today’s guest', () => {
    expect(doorLine('museum', 12, Math.random)).toBeNull();
    expect(doorLine('campsite', 12, Math.random)).toMatchObject({ npc: null, key: 'world.door.campsite', opens: null });
    expect(JA['world.door.campsite.guest']).toContain('{name}');
  });

  it('every line exists in both languages, short (two lines in the balloon), with the same {params}', () => {
    const keys: string[] = ['world.wilbur', 'world.door.campsite'];
    for (const n of Object.values(NPCS)) {
      if (n.line === 'museum' || n.line === 'wilbur') continue;
      for (let i = 0; i < n.lines; i++) keys.push(`world.door.${n.line}.${i}`);
    }
    for (const k of keys) {
      expect(JA[k], k).toBeTruthy();
      expect(EN[k], k).toBeTruthy();
      expect(JA[k].split('\n').length, k).toBeLessThanOrEqual(2);
      expect(EN[k].split('\n').length, k).toBeLessThanOrEqual(2);
      const params = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
      expect(params(EN[k]), k).toEqual(params(JA[k]));
      for (const line of JA[k].split('\n')) expect([...line.replace(/\{\w+\}/g, 'ウェイ')].length, `${k}: ${line}`).toBeLessThanOrEqual(30);
    }
    for (const id of Object.keys(NPCS) as NpcId[]) expect(JA[NPCS[id].name] ?? JA[`${NPCS[id].name}`], id).toBeTruthy();
  });

  it('speak as they do in NH: たぬきち’s だなも, the Nooklings’ echo, ロドリー’s radio “over”, モーリー’s “Hey hey hey!”', () => {
    for (let i = 0; i < NPCS.nook.lines; i++) expect(JA[`world.door.nook.${i}`]).toMatch(/だなも/);
    for (let i = 0; i < NPCS.nooklings.lines; i++) {
      const [a, b] = JA[`world.door.cranny.${i}`].split('\n');
      // Tommy echoes the end of Timmy's line
      const echo = b.replace(/^「…|」$/g, '');
      expect(a.endsWith(echo), `${a} / ${b}`).toBe(true);
    }
    expect(JA['world.wilbur']).toMatch(/オーバー/);
    expect(EN['world.wilbur']).toMatch(/Over!/);
    expect(EN['world.door.airport.0']).toMatch(/^Hey hey hey!/);
    expect(JA['world.door.rs.0']).toMatch(/^あっ、/);
  });
});

describe('Wilbur', () => {
  it('Wilbur stands on the dock only while the partner is in the room, never in the demo', () => {
    expect(WILBUR_AT[0]).toBeGreaterThanOrEqual(DOCK.x0);
    expect(WILBUR_AT[0]).toBeLessThanOrEqual(DOCK.x1);
    expect(WILBUR_AT[1]).toBeGreaterThanOrEqual(DOCK.z0);
    expect(WILBUR_AT[1]).toBeLessThanOrEqual(DOCK.z1);
    expect(wilburShows({ connected: true, peer: true }, false)).toBe(true);
    expect(wilburShows({ connected: true, peer: false }, false)).toBe(false);
    expect(wilburShows({ connected: false, peer: true }, false)).toBe(false);
    expect(wilburShows({ connected: true, peer: true }, true)).toBe(false);
    expect(wilburShows(null, false)).toBe(false);
  });
});
