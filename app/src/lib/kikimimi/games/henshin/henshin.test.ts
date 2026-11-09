// 音の へんしん's GameDef (def.ts) and its standing per phenomenon (henshin.ts): the deal (today's phenomenon and the ones
// before it, every phrase in another voice, the kinds in turn), the tiers, the grading, the row, the options on the wire.
import { describe, expect, it } from 'vitest';
import { ITEMS } from '../../content/henshin.ts';
import { PHENOMENA, focusOf, phenomenaOf, phenomenonOf } from '../../henshin.ts';
import type { Entry } from '../../bank.ts';
import { EMPTY } from '../listened.ts';
import { FAST_WINDOWS } from '../../round/session.ts';
import { HENSHIN_QS, OTHER, boardOf, choicesFor, decoysFor, henshinDeal, henshinGame, henshinOpts, henshinRecord, henshinRounds, typedAnswer, type HenshinCard } from './def.ts';
import { matchTyped } from './match.ts';

const deal = (seed: number, focus: number) => henshinDeal(seed, ITEMS, { focus });
const byId = new Map<string, Entry>(ITEMS.map((it) => [it.id, it]));

describe('音の へんしん: the deal', () => {
  it('8 phrases: 5 of today’s phenomenon, one each of those before it (all today’s at the first), the same for a seed', () => {
    for (const focus of [0, 1, 3, 9, PHENOMENA.length - 1]) {
      const d = deal(7, focus);
      expect(d).toHaveLength(HENSHIN_QS);
      expect(deal(7, focus)).toEqual(d);
      const today = d.filter((c) => phenomenonOf(c) === PHENOMENA[focus]).length;
      expect(today, `focus ${focus}`).toBe(focus === 0 ? 8 : Math.max(5, 8 - focus));
      expect(new Set(d.map((c) => c.id)).size).toBe(8);
      for (const c of d) expect(PHENOMENA.indexOf(phenomenonOf(c)!)).toBeLessThanOrEqual(focus);
    }
    expect(deal(8, 4).map((c) => c.id)).not.toEqual(deal(7, 4).map((c) => c.id));
  });

  it('the kinds take turns, a choice first; no voice twice in a row', () => {
    const d = deal(3, 6);
    expect(d.map((c) => c.ask)).toEqual(['pick', 'type', 'pick', 'type', 'pick', 'type', 'pick', 'type']);
    for (let i = 1; i < d.length; i++) expect(d[i].cast, d[i].id).not.toBe(d[i - 1].cast);
  });
});

describe('音の へんしん: tiers and rounds', () => {
  const it0 = ITEMS.find((x) => x.id === 'hs-chain-want-do')!;
  it('choices: easy two (the right one and the first wrong), else three', () => {
    expect(choicesFor(it0, 'easy')).toEqual(['What do you', 'What did you']);
    expect(choicesFor(it0, undefined)).toHaveLength(3);
  });
  it('tiles: the focus’s words and decoys from the wrong choices (easy one, else up to three; hard four with sound swaps), never in order', () => {
    expect(decoysFor(it0, 'easy')).toEqual(['did']);
    expect(decoysFor(it0, undefined)).toEqual(['did', 'would']);
    expect(decoysFor(it0, 'hard')).toHaveLength(4);
    for (const seed of [1, 2, 3]) {
      const b = boardOf(it0, seed, undefined);
      expect(b.slice().sort()).toEqual(['What', 'do', 'you', 'did', 'would'].sort());
      expect(b.filter((w) => ['What', 'do', 'you'].includes(w)).join(' ')).not.toBe('What do you');
    }
  });
  it('rounds per ear: a pick’s right choice in its dealt place, a dictation’s words and board', () => {
    const cards = deal(5, 14);
    const rs = henshinRounds(cards, 5, { ear: 1 }, () => 2000);
    for (const [i, r] of rs.entries()) {
      expect(r.id).toBe(cards[i].id);
      if (r.kind === 'henshin.pick') expect(r.choices[r.answer]).toBe(cards[i].focus);
      else expect(r.words.join(' ')).toBe(cards[i].focus);
    }
    const easy = henshinRounds(cards, 5, { ear: 0 }, () => 2000);
    expect(easy.filter((r) => r.kind === 'henshin.pick').every((r) => r.kind === 'henshin.pick' && r.choices.length === 2)).toBe(true);
  });
});

describe('音の へんしん: grading and the row', () => {
  const o = { lv: 8 as const, timer: 30 as const, ear: 1, focus: 2 };
  const cards = deal(11, o.focus);
  const game = henshinGame({ cards: () => cards, playMs: () => 1800 });
  const d = game.deck(11, o, { w: FAST_WINDOWS, enc: henshinOpts.encode(o) });
  const rs = henshinRounds(cards, 11, o, () => 1800);

  it('a pick right at its place; a dictation right when every word is its tile, typed or tapped', () => {
    const p = rs[0], t = rs[1];
    if (p.kind !== 'henshin.pick' || t.kind !== 'henshin.type') throw new Error('kinds');
    expect(d.grade(0, p.answer, 0)).toEqual({ ok: true, pts: 100 });
    expect(d.grade(0, (p.answer + 1) % 3, 0).ok).toBe(false);
    const tapped = t.words.map((w) => t.board.indexOf(w));
    expect(d.grade(1, tapped, 0).ok).toBe(true);
    const typed = typedAnswer(t, matchTyped(t.words.join(' ').toUpperCase(), t.words));
    expect(typed).toEqual(tapped);
    expect(d.grade(1, typed, 0).ok).toBe(true);
    expect(d.grade(1, typedAnswer(t, t.words.map(() => false)), 0).ok).toBe(false);
    expect(d.valid(1, t.words.map(() => EMPTY))).toBe(false);
    expect(d.valid(1, t.words.map(() => OTHER))).toBe(true);
    expect(d.valid(1, [99])).toBe(false);
    expect(d.timing(1).answer).toBeGreaterThan(d.timing(0).answer);
  });

  it('the row: a pick as authored, the dictation’s wrong words as a mask', () => {
    const p = rs[0], t = rs[1];
    if (p.kind !== 'henshin.pick' || t.kind !== 'henshin.type') throw new Error('kinds');
    const wrong = (p.answer + 1) % p.choices.length;
    const row = henshinRecord(cards, rs, [wrong, t.words.map((w, j) => (j ? t.board.indexOf(w) : OTHER))], [true, true], [0, 2], false);
    expect(row).toEqual([[cards[0].id, 0, cards[0].choices.indexOf(p.choices[wrong]), 0], [cards[1].id, 0, 1, 2]]);
  });

  it('the options on the wire: level 8, the timer, the ear, today’s phenomenon', () => {
    expect(henshinOpts.decode(henshinOpts.encode(o))).toEqual(o);
    expect(henshinOpts.decode([3, 0, 1, 0])).toBeNull();
    expect(henshinOpts.decode([8, 0, 1, PHENOMENA.length])).toBeNull();
  });
});

describe('音の へんしん: each phenomenon’s standing', () => {
  const ids = (ph: string) => ITEMS.filter((it) => phenomenonOf(it) === ph).map((it) => it.id);
  const answer = (id: string, ok: boolean, d = '2026-11-09') => ({ id, ok, rp: 0, d: d as `${number}-${number}-${number}` });

  it('mastered at 80 % over 6 answers on its phrases; today’s the first not mastered', () => {
    const gonna = ids('gonna').slice(0, 6).map((id) => answer(id, true));
    const s = phenomenaOf(gonna, (id) => byId.get(id), '2026-11-09');
    expect(s[0]).toMatchObject({ id: 'gonna', n: 6, mastered: true });
    expect(s[1]).toMatchObject({ id: 'wanna', n: 0, m: null, mastered: false });
    expect(focusOf(s)).toBe(1);
    const half = phenomenaOf([...gonna.slice(0, 3), ...ids('gonna').slice(6, 9).map((id) => answer(id, false))], (id) => byId.get(id), '2026-11-09');
    expect(half[0].mastered).toBe(false);
    expect(focusOf(half)).toBe(0);
  });

  it('answers on other items leave it alone; a phenomenon tried long without it waits in review', () => {
    expect(phenomenaOf([answer('w3-gotta', true)], () => ({ id: 'w3-gotta', lv: 3, type: 'word', voice: 'us', tags: { pragmatic: 'literal', features: ['gotta'] } }), '2026-11-09')[2].n).toBe(0);
    const stuck = Array.from({ length: 24 }, (_, k) => answer(ids('gonna')[k % 12], k % 3 === 0));
    expect(focusOf(phenomenaOf(stuck, (id) => byId.get(id), '2026-11-09'))).toBe(1);
  });
});

describe('音の へんしん: the content', () => {
  it('every card dealt is a phrase of the drill', () => {
    const cards: HenshinCard[] = deal(1, 0);
    for (const c of cards) expect(c.hs).toBeDefined();
  });
});
