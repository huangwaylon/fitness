import { describe, expect, it } from 'vitest';
import { parseClient, parseServer, type SgView } from '#lib/contract/live-protocol.ts';
import { FRAME_MAX, decode, encode, fit, isCurrent, type SpeakView, type View } from './view.ts';

const speak: SpeakView = {
  phase: 'feedback', typed: false, heard: true, note: '', resays: 1, settled: true, graded: true, tipOpen: true, resaid: false, stars: 2, cheer: -1,
  text: 'I eated an apple.', recast: 'I ate an apple.', tip: 'eat の「食べた」は ate だよ', also: ''
};
const VIEWS: View[] = [
  { p: 'word', v: { picked: [3, 0, 10, 11], hinted: true, asking: false, done: false, note: 'hintNote' } },
  { p: 'word', v: { picked: [], hinted: false, asking: true, done: false, note: '' } },
  { p: 'word', v: { picked: [1, 2, 3], hinted: false, asking: false, done: true, note: '' } },
  { p: 'sentence', v: { placed: [2, 0, 1, 5, 4, 3], stage: 'miss', misses: 1, peeked: true } },
  { p: 'picture', v: { placed: [0, 13, 4], tried: [], stage: 'try', misses: 0, speak: null } },
  { p: 'picture', v: { placed: [], tried: [2], stage: 'answer', misses: 2, speak: null } },
  { p: 'picture', v: { placed: [], tried: [], stage: 'right', misses: 0, speak: { ...speak, phase: 'rec', text: '', recast: '', tip: '' } } },
  { p: 'picture', v: { placed: [], tried: [], stage: 'right', misses: 0, speak: { ...speak, phase: 'confirm', text: 'I like apple.', recast: '', tip: '' } } },
  { p: 'picture', v: { placed: [], tried: [], stage: 'right', misses: 0, speak: { ...speak, cheer: 2, also: 'I love red apples.' } } },
  { p: 'event', v: { ja: true } },
  { p: 'event', v: { ja: false, quiz: { tried: [2, 0], stage: 'miss', misses: 1 } } },
  { p: 'fork', v: null },
  { p: 'home', v: null },
  { p: 'mini', v: 'w3.a0b2' },
  { p: 'word', v: { picked: [0], hinted: false, asking: false, done: false, note: 'hintClue' } }
];
const frame = (v: View, i = 41): SgView => fit({ kind: 'sgv', g: 'abcdefghij', i, ...encode(v) });
/** The frame as the watcher hears it: sent, through the relay (who and when stamped on), parsed. */
const heard = (f: SgView) => parseServer(JSON.stringify({ v: 3, ...f, who: 'A', t: 1_795_000_000_000 }));

describe('すごろく live view (view.ts)', () => {
  it('a panel’s view comes back as it went, through the wire’s parse on both sides', () => {
    for (const v of VIEWS) {
      const f = frame(v), raw = JSON.stringify({ v: 3, ...f });
      expect(parseClient(raw), raw).not.toBeNull();
      const h = heard(f);
      expect(h?.kind).toBe('sgv');
      if (h?.kind !== 'sgv') continue;
      // (the speaking step's texts only where its phase shows them)
      const want = v.p === 'picture' && v.v.speak && v.v.speak.phase === 'rec' ? { ...v, v: { ...v.v, speak: { ...v.v.speak, text: '', recast: '', tip: '', also: '' } } } : v;
      expect(decode(h.p, h.s, h.x), raw).toEqual(want);
    }
  });

  it('every frame fits the wire with the relay’s stamp on: a long sentence and tip are cut (…), the other way first', () => {
    const sizes = VIEWS.map((v) => JSON.stringify({ v: 3, ...frame(v), who: 'A', t: 1_795_000_000_000 }).length);
    expect(Math.max(...sizes)).toBeLessThanOrEqual(256);
    // (a word turn's frame, the commonest: about 100 bytes as heard)
    expect(sizes[0]).toBeLessThan(110);
    const long: View = { p: 'picture', v: { placed: [], tried: [], stage: 'right', misses: 0, speak: { ...speak, text: 'I '.repeat(60) + 'apple.', recast: 'I really like the "apple" '.repeat(4), tip: 'ヒント'.repeat(13), also: 'Another way to say it.' } } };
    const f = frame(long);
    expect(JSON.stringify({ v: 3, ...f }).length).toBeLessThanOrEqual(FRAME_MAX);
    const h = heard(f);
    expect(h?.kind === 'sgv' && h.x).toBeTruthy();
    if (h?.kind !== 'sgv' || !h.x) return;
    expect(h.x[3]).toBe('');
    expect(h.x.some((t) => t.endsWith('…'))).toBe(true);
    // a short one goes whole
    expect(frame(VIEWS[8]).x).toEqual([speak.text, speak.recast, speak.tip, 'I love red apples.']);
  });

  it('a view of another build’s shape reads as none', () => {
    for (const [p, s] of [['word', '01.1'], ['word', '01.z.0'], ['sentence', '0.9.0.0'], ['picture', '0..0'], ['picture', '0..0.0.9.0.0.0.0.0'], ['event', '5'], ['event', '1.0.9.0'], ['event', '1.0.0.3'], ['fork', '1']] as const)
      expect(decode(p, s), `${p} ${s}`).toBeNull();
  });

  it('a view counts only at the game’s next move, from whose turn it is, of this phase', () => {
    const now = { g: 'abcdefghij', i: 41, who: 'A', p: 'word' };
    const v = { g: 'abcdefghij', i: 41, who: 'A', p: 'word' as const };
    expect(isCurrent(v, now)).toBe(true);
    expect(isCurrent({ ...v, i: 40 }, now)).toBe(false); // an older move's: let go
    expect(isCurrent({ ...v, i: 42 }, now)).toBe(false); // ahead of a move not here yet
    expect(isCurrent({ ...v, who: 'B' }, now)).toBe(false);
    expect(isCurrent({ ...v, p: 'sentence' }, now)).toBe(false);
    expect(isCurrent({ ...v, g: 'zzzzzzzzzz' }, now)).toBe(false);
  });
});
