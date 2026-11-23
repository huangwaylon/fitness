import { afterEach, describe, expect, it, vi } from 'vitest';
import { engineReady, mapLoader } from './cached.ts';

const hooks = vi.hoisted(() => ({ on: false }));
vi.mock('#lib/ui-state/testMode.ts', () => ({ testHooks: () => hooks.on }));

const store = (shells: Record<string, string[]>) => ({
  keys: async () => Object.keys(shells),
  open: async (k: string) => ({ keys: async () => shells[k].map((u) => new Request(u)) })
}) as unknown as CacheStorage;

describe('the maps offline (engineReady)', () => {
  it('online: always tried', async () => {
    expect(await engineReady(true, undefined)).toBe(true);
  });
  it('offline: only when a shell holds the MapLibre chunk (a map drew before)', async () => {
    const drew = store({ 'island-fonts-v1': [], 'island-shell-a': ['https://x/_app/immutable/chunks/A1.js', 'https://x/_app/immutable/chunks/maplibre.Bx9.js'] });
    const never = store({ 'island-shell-a': ['https://x/_app/immutable/chunks/A1.js', 'https://x/_app/immutable/assets/maplibre.c.css'] });
    expect([await engineReady(false, drew), await engineReady(false, never), await engineReady(false, undefined)]).toEqual([true, false, false]);
  });
});

// The specs' window.__placesMap / __travelMap / __trailMap: put up by mapLoader.start only with the hooks on
// (testHooks: never on a visitor's phone, ui-state/testMode.test.ts), taken down with the map.
describe('a map’s window hook (mapLoader.start)', () => {
  afterEach(() => vi.unstubAllGlobals());
  const loader = () => mapLoader(() => new Promise<never>(() => {}), () => {}, { set: () => {}, failed: () => false });

  it('none on a visitor’s phone; with the hooks on, up while the map is, gone after (a newer map’s kept)', () => {
    const w: Record<string, unknown> = {};
    vi.stubGlobal('window', w);
    vi.stubGlobal('addEventListener', () => {});
    vi.stubGlobal('removeEventListener', () => {});
    const view = { state: () => ({}) };
    hooks.on = false;
    loader().start(true, '__placesMap', view)();
    expect('__placesMap' in w).toBe(false);
    hooks.on = true;
    const stop = loader().start(true, '__trailMap', view);
    expect(w.__trailMap).toBe(view);
    const next = { state: () => ({}) }, stopNext = loader().start(true, '__trailMap', next);
    stop();
    expect(w.__trailMap).toBe(next);
    stopNext();
    expect('__trailMap' in w).toBe(false);
  });
});
