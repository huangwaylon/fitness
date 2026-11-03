import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RECENT_MAX, SAY_GAP_MS, recentSays, rememberSay, sayGate } from './say.ts';
import { DEVICE, type KV } from '#lib/sync/storage.ts';
import ja from '#lib/i18n/ja.json';
import en from '#lib/i18n/en.json';
import { SAY_MAX } from '#lib/sync/live-protocol.ts';
import { REACTIONS } from '../motion/reactions.ts';

const kv = (): KV & { m: Map<string, string> } => {
  const m = new Map<string, string>();
  return { m, getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) };
};

describe('my villager’s phrases', () => {
  it('no presets: only my own words (the user: "get rid of all the default messages. only custom messages")', () => {
    for (const cat of [ja, en] as Record<string, string>[])
      for (const id of ['hi', 'otsukare', 'ganbaro', 'yatta', 'aruko', 'oyasumi']) expect(cat[`say.${id}`], id).toBeUndefined();
  });

  it('a tap on my villager squishes it with no ♪ (the picker is its answer; the user: "get rid of the music notes")', () => {
    expect(REACTIONS.R9.steps).toEqual([{ actor: 'mine', motion: 'squish', cue: 'villager-tap' }]);
  });

  it('keeps my own last four, newest first, once each, cleaned', () => {
    const s = kv();
    expect(recentSays(s)).toEqual([]);
    rememberSay('ねむい', s);
    rememberSay(' あるこう\n', s);
    rememberSay('ねむい', s);
    expect(recentSays(s)).toEqual(['ねむい', 'あるこう']);
    for (const x of ['a', 'b', 'c', 'd']) rememberSay(x, s);
    expect(recentSays(s)).toEqual(['d', 'c', 'b', 'a']);
    expect(recentSays(s)).toHaveLength(RECENT_MAX);
    expect(RECENT_MAX).toBe(4);
    // a quick pick said again goes first
    rememberSay('b', s);
    expect(recentSays(s)).toEqual(['b', 'd', 'c', 'a']);
    // a list kept when the cap was 3 reads as it is, and grows to four
    s.m.set(DEVICE.says, JSON.stringify(['x', 'y', 'z']));
    expect(recentSays(s)).toEqual(['x', 'y', 'z']);
    expect(rememberSay('w', s)).toEqual(['w', 'x', 'y', 'z']);
    s.m.set(DEVICE.says, JSON.stringify(['ok', 5, '\u202E', 'x'.repeat(40)]));
    expect(recentSays(s)).toEqual(['ok', 'x'.repeat(SAY_MAX)]);
    s.m.set(DEVICE.says, 'not json');
    expect(recentSays(s)).toEqual([]);
  });
});

describe('sayGate: one phrase per 1.5 s over the relay', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('sends at once, then a quicker one waits its turn, a newer one replacing it', () => {
    const sent: string[] = [];
    const g = sayGate((t) => sent.push(t));
    g.say('a');
    expect(sent).toEqual(['a']);
    vi.advanceTimersByTime(500);
    g.say('b');
    g.say('c');
    expect(sent).toEqual(['a']);
    vi.advanceTimersByTime(SAY_GAP_MS - 500);
    expect(sent).toEqual(['a', 'c']);
    vi.advanceTimersByTime(SAY_GAP_MS);
    g.say('d');
    expect(sent).toEqual(['a', 'c', 'd']);
    g.say('e');
    g.stop();
    vi.advanceTimersByTime(5000);
    expect(sent).toEqual(['a', 'c', 'd']);
  });
});
