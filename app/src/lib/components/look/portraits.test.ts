import { describe, expect, it, vi } from 'vitest';
import { flushSync } from 'svelte';
import { DEFAULT_LOOKS } from '#lib/contract/look.ts';

// a localStorage (node has none), holding the old format's list (one head drawn by an older build), and a head no
// index names (a write of the index that failed)
const kv = new Map<string, string>([['look.portraits', JSON.stringify([['old1', 'data:image/png;base64,OLD'], ['bad', 'nope']])], ['look.portrait.orphan', 'data:image/png;base64,LOST'], ['other', 'x']]);
const reads: string[] = [];
vi.stubGlobal('localStorage', {
  getItem: (k: string) => (reads.push(k), kv.get(k) ?? null),
  setItem: (k: string, v: string) => void kv.set(k, v),
  removeItem: (k: string) => void kv.delete(k),
  key: (i: number) => [...kv.keys()][i] ?? null,
  get length() {
    return kv.size;
  }
});
const { portraitOf, usePainter } = await import('./portraits.svelte.ts');

const tick = () => new Promise((r) => setTimeout(r, 0));

describe('the players’ portraits', () => {
  it('reads nothing as the module loads', () => {
    expect(reads).toEqual([]);
  });

  it('asks the painter once a look, keeps what it drew (memory and localStorage), and not again what it couldn’t', async () => {
    const asked: string[] = [];
    const a = DEFAULT_LOOKS.A, b = { ...DEFAULT_LOOKS.A, glasses: null }, c = { ...DEFAULT_LOOKS.B, hairColor: '#123456' };
    expect(portraitOf(a)).toBeNull(); // no painter yet: waits
    // (the first ask split the old list: each head under its own key, the list the hashes)
    expect(kv.get('look.portrait.old1')).toBe('data:image/png;base64,OLD');
    expect(JSON.parse(kv.get('look.portraits')!)).toEqual(['old1']);
    // (and swept the head no index names; nothing else of the storage's)
    expect(kv.has('look.portrait.orphan')).toBe(false);
    expect(kv.get('other')).toBe('x');
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
    const keys = JSON.parse(kv.get('look.portraits')!) as string[];
    expect(keys).toHaveLength(3);
    expect(keys.slice(1).map((k) => kv.get(`look.portrait.${k}`))).toEqual([`data:image/png;base64,${a.glasses}`, 'data:image/png;base64,none']);
    usePainter(null);
  });

  it('keeps the latest 24 (their entries too), and at most 24 in memory', async () => {
    let n = 0;
    usePainter(async () => `data:image/png;base64,${n++}`);
    const looks = Array.from({ length: 30 }, (_, i) => ({ ...DEFAULT_LOOKS.B, hairColor: `#0000${(i + 16).toString(16)}` }));
    for (const l of looks) portraitOf(l);
    for (let i = 0; i < 40; i++) await tick();
    const keys = JSON.parse(kv.get('look.portraits')!) as string[];
    expect(keys).toHaveLength(24);
    expect([...kv.keys()].filter((k) => k.startsWith('look.portrait.'))).toHaveLength(24);
    // the first looks' let go of everywhere: drawn again when asked; the latest still at hand (from memory, no read)
    reads.length = 0;
    expect(portraitOf(looks[29])).toMatch(/^data:image/);
    expect(reads).toEqual([]);
    usePainter(null);
  });
});
