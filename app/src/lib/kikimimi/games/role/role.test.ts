// ふたりで ロールプレイ (games/role/): the scenes against their units (every dialogue there, two voices, the roles' villagers,
// 6-10 turns), the key phrases a line has (the unit's `match`, else its words), the options, the deck (no clip, no
// limit, the reveal moving on; the answers' bounds; a turn's points its phrases), the content version, and a whole game
// over two phones on the `play` wire (round/session.ts): A and B in turn, the listener's ack, the team's phrases the
// same on both phones.
import { beforeAll, describe, expect, it } from 'vitest';
import type { Who } from '../../../types.ts';
import { INDEX, load, unitPart, type Unit } from '../../pool.ts';
import { RoundSession, WINDOWS } from '../../round/session.ts';
import { registry } from '../../round/registry.ts';
import { playIn, playOut, type PlayIn, type RoundOut } from '../../round/wire.ts';
import { HEARD, KEYS_MAX, SPOKE, keysOf, phrasesIn, roleCv, roleDeal, roleGame, roleOpts, roundsOf, saidAnswer, saidCount, saidOf, teamSaid, turnOk } from './def.ts';
import { SCENES } from './scenes.ts';

beforeAll(() => load(...SCENES.map((s) => s.unit as Unit)));
const dealOf = (k: number) => roleDeal(SCENES[k], unitPart(SCENES[k].unit)!);

describe('ふたりで ロールプレイ: the scenes', () => {
  it('chain two dialogues of their unit, each two voices with role A’s villager in it, 6–10 turns, both roles speaking', () => {
    for (const s of SCENES) {
      const part = unitPart(s.unit);
      expect(part, s.unit).toBeDefined();
      for (const p of s.parts) {
        const it = part!.items.find((x) => x.id === p.id);
        expect(it?.lines, p.id).toBeDefined();
        expect(new Set(it!.lines!.map((l) => l.who)).size, p.id).toBe(2);
        expect(it!.lines!.some((l) => l.who === p.a), p.id).toBe(true);
        expect(it!.voice, p.id).toBe('us');
        for (const g of p.goals) expect(g.length, p.id).toBeLessThanOrEqual(25);
      }
      const cards = roleDeal(s, part!);
      expect(cards.length, s.unit).toBeGreaterThanOrEqual(6);
      expect(cards.length, s.unit).toBeLessThanOrEqual(10);
      expect(new Set(cards.map((c) => c.turn.role))).toEqual(new Set([0, 1]));
      expect(phrasesIn(roundsOf(cards)), s.unit).toBeGreaterThanOrEqual(3);
    }
  });

  it('puts every line of each part in order, with its speaker’s role and the unit’s phrases in it', () => {
    const cards = dealOf(0);
    expect(cards.map((c) => `${c.id}:${c.turn.k}:${c.turn.role}`)).toEqual([
      'dk-dinner-move:0:0', 'dk-dinner-move:1:1', 'dk-dinner-move:2:0', 'dk-dinner-move:3:1', 'dk-dinner-move:4:0',
      'dk-really-cancel:0:0', 'dk-really-cancel:1:1', 'dk-really-cancel:2:0', 'dk-really-cancel:3:1'
    ]);
    expect(cards[1].turn.keys.map((k) => k.en)).toEqual(["something's come up", 'push it back']);
    expect(cards[0].turn.keys.map((k) => [k.ph, k.en, k.ja])).toEqual([['ph-still-on', 'still on', 'よていは そのまま？']]);
    expect(cards.every((c) => c.quietReveal && c.lines.length >= 2)).toBe(true);
    expect(roundsOf(cards).map((r) => r.first)).toEqual([true, false, false, false, false, true, false, false, false]);
  });

  it('finds a phrase by its match, else by its words (case, curly quotes), in the order said, at most six', () => {
    const ph = [
      { id: 'b', en: 'rain check', ja: 'また こんど', register: 'friend', scene: '', trap: '', in: [] },
      { id: 'a', en: "something's come up", match: "something('s| has)? come up", register: 'friend', scene: '', trap: '', in: [] },
      { id: 'q', en: 'Sorry?', match: '(^|[.!?] )Sorry\\?', register: 'friend', scene: '', trap: '', in: [] },
      { id: 'w', en: "wouldn't miss it", register: 'friend', scene: '', trap: '', in: [] }
    ];
    expect(keysOf('Something has come up. Rain Check?', ph).map((k) => [k.ph, k.en])).toEqual([['a', 'Something has come up'], ['b', 'Rain Check']]);
    expect(keysOf('Oh. Sorry? I wouldn’t miss it.', ph).map((k) => [k.ph, k.en])).toEqual([['q', 'Sorry'], ['w', "wouldn't miss it"]]);
    expect(keysOf('No phrase here.', ph)).toEqual([]);
    const many = Array.from({ length: 8 }, (_, i) => ({ id: `p${i}`, en: `w${i}`, register: 'friend', scene: '', trap: '', in: [] }));
    expect(keysOf('w0 w1 w2 w3 w4 w5 w6 w7', many)).toHaveLength(KEYS_MAX);
  });
});

describe('ふたりで ロールプレイ: options, answers, the deck', () => {
  const opts = roleOpts(SCENES.length);
  it('encodes the level, the timer and the scene; refuses a scene this build hasn’t', () => {
    expect(opts.decode(opts.encode({ lv: 3, timer: 0, scene: 2 }))).toEqual({ lv: 3, timer: 0, scene: 2 });
    expect(opts.decode([3, 3, SCENES.length])).toBeNull();
    expect(opts.decode([3, 3])).toBeNull();
    expect(opts.decode([0, 0, 0])).toBeNull();
  });

  it('reads an answer as the phrases said and whether it was spoken; the ack says nothing', () => {
    expect(saidOf(saidAnswer(0b101, true))).toEqual({ mask: 0b101, spoke: true });
    expect(saidOf(saidAnswer(0, false))).toEqual({ mask: 0, spoke: false });
    expect(saidOf(HEARD)).toBeNull();
    expect(saidCount(saidAnswer(0b111, true))).toBe(3);
    expect(turnOk({ keys: 2 }, saidAnswer(0b11, true))).toBe(true);
    expect(turnOk({ keys: 2 }, saidAnswer(0b01, true))).toBe(false);
    expect(turnOk({ keys: 0 }, saidAnswer(0, true))).toBe(true);
    expect(turnOk({ keys: 0 }, saidAnswer(0, false))).toBe(false);
  });

  it('a turn has no clip and no limit, its reveal moves on; a part’s first turn has a longer lead; points are phrases said', () => {
    const cards = dealOf(0), game = roleGame({ scenes: SCENES.length, cards: () => cards });
    const deck = game.deck(1, { lv: 3, timer: 0, scene: 0 }, { w: WINDOWS, enc: [] });
    expect(deck.count).toBe(9);
    expect(deck.timing(0)).toEqual({ lead: 2500, play: 0, answer: Infinity, auto: true });
    expect(deck.timing(1).lead).toBe(800);
    expect(deck.maxScore).toBe(phrasesIn(roundsOf(cards)));
    // turn 1 has two phrases: bits 0-1 and the spoken bit; a bit past them, or a negative, isn't an answer
    expect(deck.valid(1, saidAnswer(0b11, true))).toBe(true);
    expect(deck.valid(1, 0b100 | SPOKE)).toBe(false);
    expect(deck.valid(1, -1)).toBe(false);
    expect(deck.valid(1, [1])).toBe(false);
    expect(deck.valid(1, HEARD)).toBe(true);
    expect(deck.grade(1, saidAnswer(0b11, true), 0)).toEqual({ ok: true, pts: 2 });
    expect(deck.grade(1, saidAnswer(0b10, true), 0)).toEqual({ ok: false, pts: 1 });
    expect(deck.grade(1, HEARD, 0)).toEqual({ ok: false, pts: 0 });
    expect(game.modes).toMatchObject({ solo: false, coop: true, vs: false });
    expect(game.roles).toBe(2);
  });

  it('a scene’s content version follows its unit’s, the build and the scene, never its text', () => {
    const s = SCENES[0], cv = roleCv(s, 'abc123', 1);
    expect(cv).toMatch(/^[0-9a-f]{6}$/);
    expect(roleCv(s, 'abc123', 1)).toBe(cv);
    expect(roleCv(s, 'abc124', 1)).not.toBe(cv);
    expect(roleCv(s, 'abc123', 2)).not.toBe(cv);
    expect(roleCv({ ...s, as: ['x', 'y'], parts: s.parts.map((p) => ({ ...p, goals: ['a', 'b'] as const })) }, 'abc123', 1)).toBe(cv);
    expect(roleCv(s, undefined, 1)).toBeUndefined();
    expect(INDEX.games[`lesson:${s.unit}`]).toMatch(/^[0-9a-f]{6}$/);
  });

  it('the team’s phrases are the players’ totals, at most the scene’s', () => {
    expect(teamSaid({ A: 3, B: 2 }, 9)).toBe(5);
    expect(teamSaid({ A: 6, B: 5, G: 2 }, 9)).toBe(9);
    expect(teamSaid({}, 9)).toBe(0);
  });
});

// ---------- two phones ----------

const T0 = Date.UTC(2026, 10, 7, 3);

function pair(cards: ReturnType<typeof dealOf>) {
  let n = 0;
  const random = () => ((n = (n * 9301 + 49297) % 233280) / 233280);
  const def = roleGame({ scenes: SCENES.length, cards: () => cards, cv: () => 'abc123' });
  const make = (me: Who) => new RoundSession({ me, defs: registry([def]), random });
  const s = { A: make('A'), B: make('B') };
  type P = keyof typeof s;
  const deliver = (from: P, out: RoundOut[], now: number) => {
    for (const m of out) {
      const p = playOut(m);
      expect(p, `${m.op} goes out on play`).not.toBeNull();
      const to: P = from === 'A' ? 'B' : 'A';
      deliver(to, s[to].receive(playIn({ ...p!, v: 3, who: from, t: now } as PlayIn)!, now), now);
    }
  };
  s.A.presence(['B'], T0);
  s.B.presence(['A'], T0);
  return { s, act: (w: P, f: (x: RoundSession) => RoundOut[], now = T0) => deliver(w, f(s[w]), now) };
}

describe('ふたりで ロールプレイ: a game over two phones', () => {
  it('A and B take their turns; each speaker’s phrases go as a mask, the other acks; the reveal moves on; the team’s count is the same on both', () => {
    const cards = dealOf(0), rounds = roundsOf(cards), r = pair(cards);
    r.act('A', (x) => x.open({ gm: 'role', o: roleOpts(SCENES.length).encode({ lv: 3, timer: 0, scene: 0 }) }, T0));
    r.act('A', (x) => x.invite(T0));
    r.act('B', (x) => x.join(T0));
    r.act('A', (x) => x.go(T0));
    let t = T0 + WINDOWS.countdown;
    let all = 0;
    for (let i = 0; i < rounds.length; i++) {
      const at = t + (rounds[i].first ? 2500 : 800) + 10;
      for (const w of ['A', 'B'] as const) expect(r.s[w].view(at)).toMatchObject({ phase: 'answer', i, roles: { A: 0, B: 1 } });
      const speaker: Who = rounds[i].role === 0 ? 'A' : 'B', listener: Who = speaker === 'A' ? 'B' : 'A';
      // every phrase but turn 1's second
      const mask = (1 << rounds[i].keys) - 1 - (i === 1 ? 2 : 0);
      all += saidCount(mask);
      r.act(speaker, (x) => x.answer(saidAnswer(mask, true), 0, at), at);
      expect(r.s[listener].view(at).phase).toBe('answer');
      r.act(listener, (x) => x.answer(HEARD, 0, at), at);
      for (const w of ['A', 'B'] as const) expect(r.s[w].view(at).phase).toBe('reveal');
      // nobody taps つぎへ: the next turn's lead comes by itself
      t = at + WINDOWS.auto;
      if (i < rounds.length - 1) expect(r.s.A.view(t + 1)).toMatchObject({ phase: 'lead', i: i + 1 });
    }
    const A = r.s.A.view(t + 1), B = r.s.B.view(t + 1);
    expect([A.phase, B.phase]).toEqual(['results', 'results']);
    const of = phrasesIn(rounds);
    expect(all).toBe(of - 1);
    expect(teamSaid(A.scores, of)).toBe(of - 1);
    expect(teamSaid(B.scores, of)).toBe(of - 1);
  });
});
