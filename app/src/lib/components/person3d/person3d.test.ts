import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_LOOKS, resolveLook, type Look } from '#lib/contract/look.ts';

const made: string[] = [];
const freed: string[] = [];
vi.mock('../villager3d/villager3d.ts', () => ({
  createVillager: (id: string) => {
    made.push(id);
    const bones = { dispose: () => freed.push(`skeleton:${id}`) };
    return Promise.resolve({ id, group: { traverse: (f: (n: object) => void) => [{}, { skeleton: bones }].forEach(f) }, dispose: () => freed.push(id) });
  }
}));
const { person3 } = await import('./person3d.ts');

const DIR = '/room/villagers3d/';

describe('person3d: who draws a person', () => {
  it('a villager look draws the villager pref, or the person’s default villager', () => {
    expect(person3('A', { kind: 'villager', villager: 'bob' }, 'bob', DIR)).toMatchObject({ key: 'v:bob', kind: 'villager', villager: 'bob', has3d: true });
    expect(person3('G', resolveLook({}, 'G'), null, DIR)).toMatchObject({ key: 'v:judy', villager: 'judy' });
    expect(person3('B', { kind: 'villager', villager: 'no-such' }, null, DIR).key).toBe('v:anchovy');
  });

  it('a player look draws the person’s villager until the player runtime is on (no swap as the look changes)', () => {
    const a = person3('A', resolveLook({}, 'A'), 'bob', DIR);
    expect(a.villager).toBe('bob');
    const b = person3('A', { kind: 'player', ...DEFAULT_LOOKS.A, hair: 'PlayerHair12' }, 'bob', DIR);
    expect(b.key).toBe(a.key);
  });

  it('is memoised by the look object and its villager pref', () => {
    const look: Look = { kind: 'villager', villager: null };
    const p = person3('A', look, 'bob', DIR);
    expect(person3('A', look, 'bob', DIR)).toBe(p);
    expect(person3('A', look, 'goldie', DIR).key).toBe('v:goldie');
  });

  it('creates the villager’s model; its dispose lets go of its skeletons’ bone textures too', async () => {
    made.length = 0;
    const v = await person3('B', { kind: 'villager', villager: 'bob' }, 'bob', DIR).create(1);
    expect(made).toEqual(['bob']);
    v!.dispose();
    expect(freed).toEqual(['skeleton:bob', 'bob']);
  });
});
