import { describe, expect, it } from 'vitest';
import { keepUsed } from './keepUsed.ts';

describe('keepUsed (a cache bound by use)', () => {
  it('never evicts one in use; of the unused keeps the last `keep`, the oldest going first', () => {
    const gone: string[] = [];
    const k = keepUsed<string>(2, (x) => gone.push(x));
    for (const x of ['a', 'b', 'c', 'd']) k.use(x);
    k.use('a'); // two users
    k.unuse('a');
    expect(gone).toEqual([]);
    for (const x of ['b', 'c', 'd']) k.unuse(x);
    // b, c, d unused: b (the oldest) goes; a is still used
    expect(gone).toEqual(['b']);
    expect(k.stats()).toEqual({ used: 1, idle: 2 });
    // c used again: out of the unused; a's last user gone, then e's: d (the oldest unused) goes, then a
    k.use('c');
    k.unuse('a');
    k.use('e');
    k.unuse('e');
    expect(gone).toEqual(['b', 'd']);
    expect(k.stats()).toEqual({ used: 1, idle: 2 });
  });
  it('drops the unused it is told to, never one in use', () => {
    const gone: string[] = [];
    const k = keepUsed<string>(4, (x) => gone.push(x));
    for (const x of ['a', 'b', 'c']) k.use(x);
    for (const x of ['a', 'b']) k.unuse(x);
    k.drop((x) => x === 'a');
    expect(gone).toEqual(['b']);
    k.drop(() => false);
    expect(gone).toEqual(['b', 'a']);
    expect(k.stats()).toEqual({ used: 1, idle: 0 });
  });
});
