// A map's location watch and its saved-places layer, the Svelte side (map/locate.svelte.ts, map/places/layer.svelte.ts).
// (vitest runs Svelte's server build: the effects don't run, the state and the derived values do.)
import { describe, expect, it, vi } from 'vitest';
import type { Place } from '#lib/contract/places.ts';

const kv = vi.hoisted(() => new Map<string, string>());
const store = vi.hoisted(() => ({ rows: null as Place[] | null, loads: 0 }));
vi.mock('#lib/sync/storage.ts', async (orig) => {
  const real = await orig<typeof import('#lib/sync/storage.ts')>();
  return { ...real, localKV: () => ({ getItem: (k: string) => kv.get(k) ?? null, setItem: (k: string, v: string) => void kv.set(k, v), removeItem: (k: string) => void kv.delete(k) }) };
});
vi.mock('#lib/places/store.svelte.ts', () => ({ places: { get rows() { return store.rows; }, load: async () => void store.loads++ } }));
const { useLocate, NOTE_MS } = await import('./locate.svelte.ts');
const { PlacesLayer } = await import('./places/layer.svelte.ts');

const place = (id: string, lat: number): Place => ({ id, name: id, lat, lng: 0.05, addr: '', cat: 'カフェ', sub: '', added: 0 }) as unknown as Place;

describe('useLocate', () => {
  it('asks on start, keeps the fix, tells a refusal for NOTE_MS, and a note of its own', () => {
    vi.useFakeTimers();
    let ok: PositionCallback | null = null, err: PositionErrorCallback | null = null;
    const geo = { watchPosition: vi.fn((o: PositionCallback, e?: PositionErrorCallback | null) => ((ok = o), (err = e ?? null), 3)), clearWatch: vi.fn() };
    const seen: boolean[] = [];
    const loc = useLocate<'far'>({ geo, onchange: (_, first) => seen.push(first) });
    expect([loc.state, loc.fix, loc.note]).toEqual(['off', null, null]);
    loc.start();
    expect(loc.state).toBe('asking');
    ok!({ coords: { latitude: 35, longitude: 139, accuracy: 9 } } as GeolocationPosition);
    expect([loc.state, loc.fix, seen]).toEqual(['on', { lon: 139, lat: 35, acc: 9 }, [false, true]]);
    loc.tell('far');
    expect(loc.note).toBe('far');
    vi.advanceTimersByTime(NOTE_MS);
    expect(loc.note).toBeNull();
    loc.start();
    err!({ code: 1 } as GeolocationPositionError);
    expect([loc.state, loc.note]).toEqual(['denied', 'denied']);
    vi.useRealTimers();
  });
});

describe('PlacesLayer', () => {
  it('the places near the path, the one chosen, the switch kept on this phone (its old key the default)', () => {
    kv.set('island.trailPlaces', 'false');
    store.rows = [place('a', 0.001), place('b', 0.0005), place('far', 0.5)];
    let path: number[][] | null = null;
    const l = new PlacesLayer(() => path);
    expect([l.on, l.near]).toEqual([false, []]);
    path = [[0, 0], [0.1, 0]];
    expect(l.near.map((p) => p.id)).toEqual(['b', 'a']);
    expect(l.pts[0]).toEqual({ id: 'b', lng: 0.05, lat: 0.0005, cat: 'カフェ', name: 'b' });
    l.select('a');
    expect(l.selected?.id).toBe('a');
    l.select('far');
    expect(l.selected).toBeNull();
    l.toggle();
    expect([l.on, kv.get('island.mapPlaces')]).toEqual([true, 'true']);
    l.select('a');
    l.toggle();
    expect([l.on, l.selected]).toEqual([false, null]);
  });
});
