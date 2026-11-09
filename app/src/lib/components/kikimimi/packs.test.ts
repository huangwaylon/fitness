// ききみみ's packs (packs.ts over lib/packStore.ts): voiceClip keys the engine's decoded clips by pack and offset and cuts
// from the right pack (slow takes from the slow pack); prefetchClips asks for the deck's packs, each once.
import { describe, expect, it, vi } from 'vitest';

const loadVoice = vi.fn(async (_key: string, bytes: () => Promise<ArrayBuffer | null>) => ((await bytes()) ? ({ duration: 1 } as AudioBuffer) : null));
vi.mock('#lib/sound/sound.svelte.ts', () => ({ loadVoice: (k: string, b: () => Promise<ArrayBuffer | null>) => loadVoice(k, b) }));

describe('voiceClip, prefetchClips', () => {
  it('decodes a loaded clip by pack and offset from its pack (the slow take from the slow pack); a clip not loaded is null', async () => {
    const sizes: Record<string, number> = { 'lv1.1111': 100, 'lv1-slow.2222': 100 };
    const asked: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      asked.push(url);
      const stem = Object.keys(sizes).find((s) => url.endsWith(`/listen/${s}.pak`));
      return stem ? new Response(Uint8Array.from({ length: sizes[stem] }, (_, i) => i)) : new Response(null, { status: 404 });
    }));
    const { addClips } = await import('#lib/kikimimi/clips.ts');
    const { voiceClip, prefetchClips, packUrl } = await import('./packs.ts');
    expect(packUrl('lv1.aaaa')).toMatch(/\/audio\/listen\/lv1\.aaaa\.pak$/);
    addClips(['lv1.1111', 'lv1-slow.2222'], { q1: [231, 'abcd1234', 0, 20, 30, 1, 40, 50] }, {});
    prefetchClips(['q1', 'nope', 'q1']);
    expect(await voiceClip('q1')).not.toBeNull();
    expect(loadVoice.mock.calls[0][0]).toBe('lv1.1111:20');
    expect(new Uint8Array((await loadVoice.mock.calls[0][1]())!)[0]).toBe(20);
    expect(await voiceClip('q1', true)).not.toBeNull();
    expect(loadVoice.mock.calls[1][0]).toBe('lv1-slow.2222:40');
    expect(await voiceClip('nope')).toBeNull();
    expect(asked.filter((u) => u.includes('lv1.1111.pak'))).toHaveLength(1); // (the prefetch's, shared)
    vi.unstubAllGlobals();
  });
});
