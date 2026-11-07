// The mic's choices (lib/mic/pick.ts): 自動 is the phone's own whisper only; a hand-picked recogniser only where it
// can run; DEVICE.mic read safely (off by default).
import { describe, expect, it } from 'vitest';
import { keepMic, pickBackend, readMic, sanitizeMic } from './pick.ts';
import { DEVICE, type KV } from '#lib/sync/storage.ts';

const all = { whisper: true, webkit: true, relay: true }, none = { whisper: false, webkit: false, relay: false };

describe('pickBackend', () => {
  it('自動: whisper when it can run, else none (never off the phone by itself)', () => {
    expect(pickBackend('auto', all)).toBe('whisper');
    expect(pickBackend('auto', { ...all, whisper: false })).toBeNull();
  });
  it('a hand-picked one where it can run, else none', () => {
    for (const be of ['whisper', 'webkit', 'relay'] as const) {
      expect(pickBackend(be, all)).toBe(be);
      expect(pickBackend(be, none)).toBeNull();
    }
  });
});

describe('DEVICE.mic', () => {
  const kv = (): KV & { m: Map<string, string> } => {
    const m = new Map<string, string>();
    return { m, getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
  };
  it('off and 自動 by default, and for anything malformed', () => {
    expect(readMic(kv())).toEqual({ on: false, be: 'auto' });
    expect(readMic(null)).toEqual({ on: false, be: 'auto' });
    for (const v of [null, 3, 'on', { on: 'yes', be: 'cloud' }, []]) expect(sanitizeMic(v)).toEqual({ on: false, be: 'auto' });
  });
  it('kept and read back on this phone', () => {
    const s = kv();
    expect(keepMic(s, { on: true, be: 'relay' })).toBe(true);
    expect(JSON.parse(s.m.get(DEVICE.mic)!)).toEqual({ on: true, be: 'relay' });
    expect(readMic(s)).toEqual({ on: true, be: 'relay' });
  });
});
