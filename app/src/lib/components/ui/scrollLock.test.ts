import { describe, expect, it, vi } from 'vitest';

describe('lockScroll', () => {
  it('holds while any lock is held (stacked sheets), and a release is idempotent', async () => {
    const classes = new Set<string>();
    vi.stubGlobal('document', { documentElement: { classList: { add: (c: string) => classes.add(c), remove: (c: string) => classes.delete(c) } } });
    const { lockScroll } = await import('./scrollLock.ts');
    const a = lockScroll();
    const b = lockScroll();
    expect(classes.has('sheet-open')).toBe(true);
    a();
    a();
    expect(classes.has('sheet-open')).toBe(true);
    b();
    expect(classes.has('sheet-open')).toBe(false);
    vi.unstubAllGlobals();
  });
});
