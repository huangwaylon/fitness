// The look's actions (store/look.ts): what each sends (one `pref` of the sender's own), and that the look and the
// コーデ read back through the model at once.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configureStorage, type KV } from '#lib/sync/storage.ts';
import { configureTransport } from '#lib/sync/transport.ts';
import { queued } from '#lib/sync/queue.ts';
import { setKey } from '#lib/sync/pairing.ts';
import { applySnapshot } from '#lib/sync/cache.ts';
import type { Who } from '#lib/types.ts';
import { DEFAULT_LOOKS } from '#lib/contract/look.ts';
import { composeModel } from './view.ts';
import { week } from './week.svelte.ts';
import {
  deleteLook, lookOf, myLook, mySavedLooks, overwriteLook, renameLook, saveLook, wearLook, wearUsual, wearVillager
} from './look.ts';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

class Mem implements KV {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}

const NOW = Date.parse('2026-11-05T03:00:00.000Z');
const { A, B } = DEFAULT_LOOKS;
let me: Who = 'A';
/** The model over the queued events (what the store recomputes after a send). */
const sync = () => {
  const cache = applySnapshot(null, { me, rev: 'r1', now: new Date(NOW).toISOString(), rows: { metrics: [], events: [] } }, NOW);
  week.model = composeModel(cache, queued(), NOW);
};
const prefs = () => queued().filter((e) => e.type === 'pref').map((e) => e.data);

function pair(who: Who) {
  me = who;
  configureStorage({ local: new Mem() });
  setKey((who === 'A' ? 'ab' : who === 'B' ? 'cd' : 'ef').repeat(32), who);
  week.view = null;
  sync();
}

beforeEach(() => {
  vi.useFakeTimers({ now: NOW });
  configureTransport({ fetch: (() => new Promise<Response>(() => {})) as typeof fetch, url: 'https://script.example/exec' });
  pair('A');
});

describe('reading the look', () => {
  it('いつもの before anything is set: A’s and B’s players, the guest’s villager', () => {
    expect(myLook()).toEqual({ kind: 'player', ...A });
    expect(lookOf('B')).toEqual({ kind: 'player', ...B });
    expect(lookOf('G')).toEqual({ kind: 'villager', villager: null });
    expect(mySavedLooks()).toEqual([]);
  });
});

describe('wearing', () => {
  it('wearLook sends the look and shows it; one’s own いつもの is sent as null', () => {
    expect(wearLook(B).ok).toBe(true);
    sync();
    expect(myLook()).toEqual({ kind: 'player', ...B });
    expect(wearLook({ ...A }).ok).toBe(true);
    expect(wearUsual().ok).toBe(true);
    expect(prefs()).toEqual([{ key: 'look', value: { kind: 'player', look: B } }, { key: 'look', value: null }, { key: 'look', value: null }]);
    sync();
    expect(myLook()).toEqual({ kind: 'player', ...A });
  });

  it('refuses a look that isn’t whole', () => {
    expect(wearLook({ ...A, top: 'TopsTexOnepieceAlineHLinen0' })).toEqual({ ok: false });
    expect(wearLook({ ...A, hair: 'nope' })).toEqual({ ok: false });
    expect(queued()).toEqual([]);
  });

  it('wearVillager: the villager pref (when named), then the look', () => {
    expect(wearVillager('goldie').ok).toBe(true);
    expect(wearVillager().ok).toBe(true);
    expect(prefs()).toEqual([{ key: 'villager', value: 'goldie' }, { key: 'look', value: { kind: 'villager' } }, { key: 'look', value: { kind: 'villager' } }]);
    sync();
    expect(myLook()).toEqual({ kind: 'villager', villager: 'goldie' });
  });

  it('the guest wears its own (A’s いつもの is just a look to it)', () => {
    pair('G');
    expect(wearLook(A).ok).toBe(true);
    expect(prefs()).toEqual([{ key: 'look', value: { kind: 'player', look: A } }]);
    sync();
    expect(lookOf('G')).toEqual({ kind: 'player', ...A });
    expect(lookOf('A')).toEqual({ kind: 'player', ...A });
  });
});

describe('the コーデ', () => {
  it('save (newest first), wear, overwrite, rename, delete: each sends the whole list', () => {
    const one = saveLook(' おでかけ ', B);
    expect(one).toMatchObject({ ok: true, id: expect.stringMatching(/^[a-z0-9]{8}$/) });
    sync();
    const two = saveLook('しごと', { ...A, glasses: null });
    sync();
    expect(mySavedLooks().map((s) => s.name)).toEqual(['しごと', 'おでかけ']);
    expect(wearLook(mySavedLooks().find((x) => x.id === one.id)!.look).ok).toBe(true);
    sync();
    expect(myLook()).toEqual({ kind: 'player', ...B });
    expect(overwriteLook(one.id!, A).ok).toBe(true);
    sync();
    expect(renameLook(two.id!, 'やすみ').ok).toBe(true);
    sync();
    expect(mySavedLooks()).toEqual([{ id: two.id, name: 'やすみ', look: { ...A, glasses: null } }, { id: one.id, name: 'おでかけ', look: A }]);
    const del = deleteLook(two.id!);
    expect(del.ok && typeof del.undo).toBe('function');
    sync();
    expect(mySavedLooks().map((s) => s.id)).toEqual([one.id]);
    expect(del.undo!()).toBe(true);
    sync();
    expect(mySavedLooks()).toHaveLength(2);
    expect(prefs().every((d) => d.key === 'savedLooks' || d.key === 'look')).toBe(true);
  });

  it('refuses a bad name, a full closet, an unknown id', () => {
    expect(saveLook('  ', A)).toEqual({ ok: false, why: 'name' });
    expect(saveLook('あ'.repeat(13), A)).toEqual({ ok: false, why: 'name' });
    expect(saveLook('x', { ...A, v: 2 as 1 })).toEqual({ ok: false, why: 'look' });
    for (let i = 0; i < 20; i++) {
      expect(saveLook(`コーデ ${i + 1}`, A).ok).toBe(true);
      sync();
    }
    expect(saveLook('もう一つ', A)).toEqual({ ok: false, why: 'full' });
    expect(renameLook('zzzzzzzz', 'x')).toEqual({ ok: false });
    expect(renameLook(mySavedLooks()[0].id, '')).toEqual({ ok: false });
    expect(overwriteLook('zzzzzzzz', A)).toEqual({ ok: false });
    expect(deleteLook('zzzzzzzz')).toEqual({ ok: false });
  });
});
