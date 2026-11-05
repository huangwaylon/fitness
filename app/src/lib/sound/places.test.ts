// Place music (sound/places.ts, docs/design.md#place-music): which track a room plays, the doorway's settle.
import { describe, expect, it, vi } from 'vitest';
import { MUSEUM_MUSIC, PLACE_IDS, PLACE_SETTLE_MS, Settle, placeTrack } from './places.ts';
import { parseManifest } from './manifest.ts';

const T = (file: string) => ({ file, start: 2, end: 60, gain: -1 });

describe('placeTrack', () => {
  it('a room’s own file, else none (the island’s music goes on)', () => {
    const files = { shop: T('places/shop.m4a'), 'museum-hall': T('places/hall.m4a') };
    expect(placeTrack('shop', files)).toEqual({ id: 'shop', ...files.shop });
    expect(placeTrack('museum-fish', files)).toBeNull();
    expect(placeTrack(null, files)).toBeNull();
  });
  it('the museum’s three rooms each have their own track', () => {
    expect(new Set(Object.values(MUSEUM_MUSIC)).size).toBe(3);
    for (const id of Object.values(MUSEUM_MUSIC)) expect(PLACE_IDS).toContain(id);
  });
  it('the manifest’s `places` keeps the known ids and flags the rest', () => {
    const { manifest, problems } = parseManifest({ places: { shop: T('places/shop.m4a'), 'museum-hall': { start: 1 }, attic: T('x.m4a') } });
    expect(manifest.places).toEqual({ shop: T('places/shop.m4a') });
    expect(problems).toEqual(['places.museum-hall', 'places.attic']);
  });
});

describe('Settle: the doorway’s debounce', () => {
  it('passes a change once it has held; a step back meanwhile changes nothing; now() is at once', () => {
    vi.useFakeTimers();
    const seen: string[] = [];
    const s = new Settle<string>((v) => seen.push(v));
    s.now('hall');
    s.to('hall');
    s.to('fish');
    vi.advanceTimersByTime(PLACE_SETTLE_MS - 100);
    s.to('hall'); // back through the door before it settled
    vi.advanceTimersByTime(PLACE_SETTLE_MS * 2);
    expect(seen).toEqual(['hall']);
    s.to('bug');
    s.to('bug'); // read again each frame: the wait isn't restarted
    vi.advanceTimersByTime(PLACE_SETTLE_MS);
    expect(seen).toEqual(['hall', 'bug']);
    s.to('fish');
    s.stop(); // leaving: nothing pending fires
    vi.advanceTimersByTime(PLACE_SETTLE_MS * 2);
    expect(seen).toEqual(['hall', 'bug']);
    vi.useRealTimers();
  });
});
