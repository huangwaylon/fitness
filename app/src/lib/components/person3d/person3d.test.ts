import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_LOOKS, resolveLook, type Look, type PlayerLook } from '#lib/contract/look.ts';

const made: string[] = [];
const freed: string[] = [];
const model = (id: string) => {
  const bones = { dispose: () => freed.push(`skeleton:${id}`) };
  return { id, group: { traverse: (f: (n: object) => void) => [{}, { skeleton: bones }].forEach(f) }, dispose: () => freed.push(id) };
};
vi.mock('../villager3d/villager3d.ts', () => ({
  createVillager: (id: string) => (made.push(id), Promise.resolve(model(id)))
}));
let playerFails = false;
vi.mock('../player3d/player3d.ts', () => ({
  createPlayer: (who: string, look: PlayerLook, dir: string) =>
    playerFails ? Promise.reject(new Error('no part')) : (made.push(`player:${who}:${look.hair}:${dir}`), Promise.resolve(model(`player:${who}`)))
}));
const { person3 } = await import('./person3d.ts');

const DIRS = { villagers: '/room/villagers3d/', player: '/room/player/' };

describe('person3d: who draws a person', () => {
  it('a villager look draws the villager pref, or the person’s default villager', () => {
    expect(person3('A', { kind: 'villager', villager: 'bob' }, 'bob', DIRS)).toMatchObject({ key: 'v:bob', kind: 'villager', villager: 'bob', has3d: true });
    expect(person3('G', resolveLook({}, 'G'), null, DIRS)).toMatchObject({ key: 'v:judy', villager: 'judy' });
    expect(person3('B', { kind: 'villager', villager: 'no-such' }, null, DIRS).key).toBe('v:anchovy');
  });

  it('a player look draws the human player, keyed by the look (a change of it is a new model)', () => {
    const a = person3('A', resolveLook({}, 'A'), 'bob', DIRS);
    expect(a).toMatchObject({ kind: 'player', villager: 'bob', has3d: true });
    expect(a.key).toMatch(/^p:/);
    expect(person3('A', resolveLook({}, 'A'), 'bob', DIRS).key).toBe(a.key);
    expect(person3('A', { kind: 'player', ...DEFAULT_LOOKS.A, hair: 'PlayerHair12' }, 'bob', DIRS).key).not.toBe(a.key);
    expect(person3('B', resolveLook({}, 'B'), null, DIRS).key).not.toBe(a.key);
  });

  it('is memoised by the look object and its villager pref', () => {
    const look: Look = { kind: 'villager', villager: null };
    const p = person3('A', look, 'bob', DIRS);
    expect(person3('A', look, 'bob', DIRS)).toBe(p);
    expect(person3('A', look, 'goldie', DIRS).key).toBe('v:goldie');
  });

  it('creates the model; its dispose lets go of its skeletons’ bone textures too', async () => {
    made.length = freed.length = 0;
    const v = await person3('B', { kind: 'villager', villager: 'bob' }, 'bob', DIRS).create(1);
    expect(made).toEqual(['bob']);
    v!.dispose();
    expect(freed).toEqual(['skeleton:bob', 'bob']);
    made.length = freed.length = 0;
    const p = await person3('A', resolveLook({}, 'A'), null, DIRS).create(1);
    expect(made).toEqual([`player:A:${DEFAULT_LOOKS.A.hair}:/room/player/`]);
    p!.dispose();
    expect(freed).toEqual(['skeleton:player:A', 'player:A']);
  });

  it('a player whose parts can’t be had draws its villager', async () => {
    made.length = 0;
    playerFails = true;
    const v = await person3('B', resolveLook({}, 'B'), 'raymond', DIRS).create(1);
    playerFails = false;
    expect(made).toEqual(['raymond']);
    expect((v as unknown as { id: string }).id).toBe('raymond');
  });
});
