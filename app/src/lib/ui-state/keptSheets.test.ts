import { afterEach, describe, expect, it, vi } from 'vitest';

const fresh = async () => {
  vi.resetModules();
  return import('./keptSheets.ts');
};
afterEach(() => vi.unstubAllGlobals());

describe('the sheets kept mounted (keptSheets)', () => {
  it('a few at most: the least recently opened closed one let go; an open one never', async () => {
    const on: Record<string, () => void> = {};
    vi.stubGlobal('addEventListener', (type: string, f: () => void) => (on[type] = f));
    const { KEEP_MAX, keepSheet } = await fresh();
    const open = new Set<number>();
    const gone: number[] = [];
    const keep = (id: number) => keepSheet(id, () => gone.push(id), () => open.has(id));
    open.add(1);
    for (let id = 1; id <= KEEP_MAX; id++) keep(id);
    keep(2); // opened again: the most recent
    keep(9);
    expect(gone).toEqual([3]);
    open.clear();
    on.pagehide(); // the kept ones, least recent first
    expect(gone).toEqual([3, 1, 2, 9]);
  });

  it('every closed one let go on pagehide and on a lost WebGL context; an unmounted sheet forgotten', async () => {
    const on: Record<string, () => void> = {};
    vi.stubGlobal('addEventListener', (type: string, f: () => void) => (on[type] = f));
    const { keepSheet, unkeepSheet } = await fresh();
    let open2 = true;
    const gone: number[] = [];
    keepSheet(1, () => gone.push(1), () => false);
    keepSheet(2, () => gone.push(2), () => open2);
    on.pagehide();
    expect(gone).toEqual([1]);
    keepSheet(3, () => gone.push(3), () => false);
    on.webglcontextlost();
    expect(gone).toEqual([1, 3]);
    unkeepSheet(2);
    open2 = false;
    on.pagehide(); // 2 forgotten: not let go again
    expect(gone).toEqual([1, 3]);
  });
});
