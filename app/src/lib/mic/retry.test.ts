// A refused mic's way back (lib/mic/retry.ts): the note kept before the reload, read back once by the step it names,
// let go when old, malformed or without storage.
import { describe, expect, it } from 'vitest';
import { RETRY_MS, deniedKey, micReturn, retryMic } from './retry.ts';
import { DEVICE, type KV } from '#lib/sync/storage.ts';

const mem = (): KV & { m: Map<string, string> } => {
  const m = new Map<string, string>();
  return { m, getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
};

describe('retryMic', () => {
  it('keeps the step and the time, then reloads', () => {
    const kv = mem();
    let reloaded = 0;
    expect(retryMic('probe', { kv, now: 1000, reload: () => reloaded++ })).toBe(true);
    expect(reloaded).toBe(1);
    expect(JSON.parse(kv.m.get(DEVICE.micRetry)!)).toEqual({ step: 'probe', at: 1000 });
  });
  it('without storage: no reload (it would come back nowhere)', () => {
    let reloaded = 0;
    expect(retryMic('optin', { kv: null, reload: () => reloaded++ })).toBe(false);
    const full: KV = { getItem: () => null, setItem: () => { throw new Error('QuotaExceededError'); }, removeItem: () => {} };
    expect(retryMic('optin', { kv: full, reload: () => reloaded++ })).toBe(false);
    expect(reloaded).toBe(0);
  });
});

describe('micReturn', () => {
  it('peeks without dropping; take drops it', () => {
    const kv = mem();
    retryMic('optin', { kv, now: 0, reload: () => {} });
    expect(micReturn({ kv, now: 10 })).toBe('optin');
    expect(micReturn({ kv, now: 10 })).toBe('optin');
    expect(micReturn({ kv, now: 10, take: true })).toBe('optin');
    expect(micReturn({ kv, now: 10 })).toBeNull();
  });
  it('an old, future or malformed note is let go', () => {
    const kv = mem();
    retryMic('probe', { kv, now: 0, reload: () => {} });
    expect(micReturn({ kv, now: RETRY_MS })).toBeNull();
    expect(kv.m.size).toBe(0);
    retryMic('probe', { kv, now: 100, reload: () => {} });
    expect(micReturn({ kv, now: 50 })).toBeNull();
    for (const bad of ['{', '{"step":"game","at":0}', '{"step":"probe"}', 'null']) {
      kv.m.set(DEVICE.micRetry, bad);
      expect(micReturn({ kv, now: 1 })).toBeNull();
    }
    expect(micReturn({ kv: null })).toBeNull();
  });
});

describe('deniedKey', () => {
  it('the Home Screen app and a Safari tab, before and after the retry', () => {
    expect(deniedKey(false, false)).toBe('kiki.mic.perm.denied');
    expect(deniedKey(true, false)).toBe('kiki.mic.perm.deniedApp');
    expect(deniedKey(false, true)).toBe('kiki.mic.perm.stuck');
    expect(deniedKey(true, true)).toBe('kiki.mic.perm.stuckApp');
  });
});
