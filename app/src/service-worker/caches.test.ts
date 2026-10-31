import { describe, expect, it } from 'vitest';
import { AUDIO_CACHE, isAudio, isMusic, keepShell, lruEvict, precachable, staleCaches } from './caches.ts';

describe('service worker cache generations', () => {
  const keep = ['island-fonts-v1', 'island-villagers-v1'];

  it('keeps the current and the newest previous shell, and the runtime caches', () => {
    const keys = ['island-fonts-v1', 'island-shell-1', 'island-villagers-v1', 'island-shell-2', 'island-shell-3', 'island-shell-4'];
    expect(staleCaches(keys, 'island-shell-4', keep)).toEqual(['island-shell-1', 'island-shell-2']);
  });

  it('first install: nothing to delete', () => {
    expect(staleCaches(['island-shell-1'], 'island-shell-1', keep)).toEqual([]);
  });

  it('drops caches from older schemes', () => {
    expect(staleCaches(['island-fonts-v0', 'island-shell-1', 'island-shell-2'], 'island-shell-2', keep)).toEqual(['island-fonts-v0']);
  });
});

describe('audio cache (LRU for music)', () => {
  const m = (h: string) => `https://x.example/fitness/audio/music/hour-${h}.m4a`;
  const fx = 'https://x.example/fitness/audio/sfx/coin.m4a';

  it('keeps the 3 most recently used music files, oldest out first', () => {
    expect(lruEvict([m('07'), fx, m('08'), m('09'), m('10'), m('11')])).toEqual([m('07'), m('08')]);
  });

  it('never evicts effects, and nothing under the limit', () => {
    expect(lruEvict([fx, m('07'), m('08')])).toEqual([]);
  });

  it('tells audio and music paths apart', () => {
    expect([isAudio('/fitness/audio/sfx/coin.m4a'), isMusic('/fitness/audio/sfx/coin.m4a'), isMusic('/fitness/audio/music/opening.m4a')]).toEqual([true, false, true]);
    expect(isAudio('/fitness/art/fruit/peach.webp')).toBe(false);
  });

  it('the audio cache survives a new build', () => {
    expect(staleCaches([AUDIO_CACHE, 'island-shell-1', 'island-shell-2'], 'island-shell-2', [AUDIO_CACHE])).toEqual([]);
  });
});

describe('precache', () => {
  it('leaves the critters (fish, bugs, junk) out: they are cached on first use', () => {
    for (const p of ['art/critters/sea-bass.webp', '/fitness/art/critters/common-butterfly.webp']) expect(precachable(p)).toBe(false);
  });
  it('keeps the shell, the default villagers and the scene art', () => {
    for (const p of ['_app/immutable/entry/app.js', 'art/fruit/peach.webp', 'art/villagers/goldie.webp', 'art/villagers/anchovy-icon.webp', 'manifest.webmanifest']) {
      expect(precachable(p)).toBe(true);
    }
  });
  it('leaves out audio, fonts, other villagers, the bundled manifests and .DS_Store (paths come without a leading slash)', () => {
    for (const p of ['audio/music/hour-07.m4a', 'audio/music/opening.m4a', 'audio/manifest.json', 'audio/sfx/coin.m4a',
      '_app/immutable/assets/zen-maru-gothic-54-500-normal.woff2', 'art/villagers/raymond.webp', 'art/manifest.json', 'icons/.DS_Store']) {
      expect(precachable(p)).toBe(false);
    }
    expect(precachable('/fitness/audio/music/hour-07.m4a')).toBe(false);
  });
});

describe('the offline shell from a navigation (keepShell)', () => {
  const fakeCache = (has: boolean) => {
    const puts: string[] = [];
    return { puts, cache: { match: async () => (has ? new Response('old') : undefined), put: async (k: RequestInfo | URL) => void puts.push(String(k)) } };
  };

  it('kept when this version has no shell yet (offline at install)', async () => {
    const c = fakeCache(false);
    await keepShell(c.cache as unknown as Cache, '/fitness/', new Response('<html>'));
    expect(c.puts).toEqual(['/fitness/']);
  });

  it('never over the version’s own shell (a newer build’s HTML would point at chunks no cache holds)', async () => {
    const c = fakeCache(true);
    await keepShell(c.cache as unknown as Cache, '/fitness/', new Response('<html>new build'));
    expect(c.puts).toEqual([]);
  });

  it('never an error page', async () => {
    const c = fakeCache(false);
    await keepShell(c.cache as unknown as Cache, '/fitness/', new Response('nope', { status: 404 }));
    expect(c.puts).toEqual([]);
  });
});
