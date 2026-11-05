import { describe, expect, it, vi } from 'vitest';
import { flushSync } from 'svelte';
import { DEFAULT_LOOKS } from '#lib/contract/look.ts';

// a localStorage (node has none) before the module reads what's kept
const kv = new Map<string, string>();
vi.stubGlobal('localStorage', { getItem: (k: string) => kv.get(k) ?? null, setItem: (k: string, v: string) => void kv.set(k, v) });
const { portraitOf, usePainter } = await import('./portraits.svelte.ts');

const tick = () => new Promise((r) => setTimeout(r, 0));

describe('the players’ portraits', () => {
  it('asks the painter once a look, keeps what it drew (memory and localStorage), and not again what it couldn’t', async () => {
    const asked: string[] = [];
    const a = DEFAULT_LOOKS.A, b = { ...DEFAULT_LOOKS.A, glasses: null }, c = { ...DEFAULT_LOOKS.B, hairColor: '#123456' };
    expect(portraitOf(a)).toBeNull(); // no painter yet: waits
    usePainter(async (l, px) => {
      asked.push(l.glasses ?? 'none');
      expect(px).toBeGreaterThan(48);
      return l === c ? null : `data:image/png;base64,${l.glasses ?? 'none'}`;
    });
    expect(portraitOf(b)).toBeNull();
    expect(portraitOf(c)).toBeNull();
    for (let i = 0; i < 5; i++) await tick();
    flushSync();
    expect(portraitOf(a)).toBe(`data:image/png;base64,${a.glasses}`);
    expect(portraitOf(b)).toBe('data:image/png;base64,none');
    expect(portraitOf({ ...b })).toBe('data:image/png;base64,none'); // by its hash, not the object
    expect(portraitOf(c)).toBeNull();
    await tick();
    expect(asked).toHaveLength(3); // c not asked again
    const kept = JSON.parse(localStorage.getItem('look.portraits') ?? '[]') as [string, string][];
    expect(kept.map(([, v]) => v)).toEqual([`data:image/png;base64,${a.glasses}`, 'data:image/png;base64,none']);
    usePainter(null);
  });
});
