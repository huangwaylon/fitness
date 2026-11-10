import { describe, expect, it } from 'vitest';
import { keyOwner, originAllowed } from '../src/auth.ts';
import { sameKey } from '../../app/src/lib/contract/ticket.ts';
import { Bucket } from '../src/bucket.ts';

const A = 'a1'.repeat(16);
const B = 'b2'.repeat(16);

describe('keys', () => {
  it('names the owner of a key, case-insensitively, and nobody else', () => {
    expect(keyOwner(A, { KEY_A: A, KEY_B: B })).toBe('A');
    expect(keyOwner(B.toUpperCase(), { KEY_A: A, KEY_B: ` ${B}\n` })).toBe('B');
    expect(keyOwner('c3'.repeat(16), { KEY_A: A, KEY_B: B })).toBeNull();
    expect(keyOwner(A.slice(0, 31), { KEY_A: A, KEY_B: B })).toBeNull();
  });

  it('lets nobody in while the secrets are unset or empty', () => {
    expect(keyOwner(A, {})).toBeNull();
    expect(keyOwner('', { KEY_A: '', KEY_B: '  ' })).toBeNull();
  });

  it('compares whole strings', () => {
    expect(sameKey('abcd', 'abcd')).toBe(true);
    expect(sameKey('abcd', 'abce')).toBe(false);
    expect(sameKey('abc', 'abcd')).toBe(false);
  });
});

describe('origins', () => {
  const allowed = 'https://huangwaylon.github.io, https://example.test';
  it('allows the listed origins and localhost only', () => {
    expect(originAllowed('https://huangwaylon.github.io', allowed)).toBe(true);
    expect(originAllowed('https://example.test', allowed)).toBe(true);
    expect(originAllowed('http://localhost:5173', allowed)).toBe(true);
    expect(originAllowed('http://127.0.0.1', allowed)).toBe(true);
    expect(originAllowed('https://huangwaylon.github.io.evil.test', allowed)).toBe(false);
    expect(originAllowed('http://huangwaylon.github.io', allowed)).toBe(false);
    expect(originAllowed('http://localhost.evil.test', allowed)).toBe(false);
    expect(originAllowed(null, allowed)).toBe(false);
    expect(originAllowed('null', allowed)).toBe(false);
  });
});

describe('rate limit', () => {
  it('passes a burst of 20, then 20 a second', () => {
    const b = new Bucket(20, 20, 0);
    let n = 0;
    for (let i = 0; i < 50; i++) if (b.take(0)) n++;
    expect(n).toBe(20);
    expect(b.take(10)).toBe(false); // 0.2 of a token
    expect(b.take(50)).toBe(true); // one token after 50 ms
    let later = 0;
    for (let i = 0; i < 100; i++) if (b.take(10_000)) later++;
    expect(later).toBe(20); // refills to the burst, no more
  });
});
