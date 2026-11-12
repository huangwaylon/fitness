// すうじ ラッシュ (games/rush/): the deal from the rush files (8 customers, each of another frame), the chips at each tier
// (hard all four with the pre-correction value, as authored three, easy without the pre-correction value), the grading,
// the co-op register's pass, the 8 s window, the points against expectation, the combo, the row and its round trip
// through the files' parts, a co-op and a しょうぶ game over two phones on the `play` wire; and the generated content:
// the files as scripts/kikimimi-rush.ts writes them, a third corrected, US English apart from the bank.
import { spawnSync } from 'node:child_process';
import { beforeAll, describe, expect, it } from 'vitest';
import type { Who } from '../../../types.ts';
import { INDEX, listenOf, load, type Unit } from '../../pool.ts';
import type { ListenEntry, ListenItem, ListenPart } from '../../listen.ts';
import { AUTHORED as BANK } from '../../source.ts';
import { isDialogue } from '../../bank.ts';
import { RoundSession, WINDOWS } from '../../round/session.ts';
import { registry } from '../../round/registry.ts';
import { playIn, playOut, type PlayIn, type RoundOut } from '../../round/wire.ts';
import { questionPoints } from '../taikai/def.ts';
import { filesOf, listenOpts } from '../listened.ts';
import { modeOf } from '../../catalog.ts';
import { PASS, RUSH, RUSH_QS, WINDOW, bestCombo, chipsAt, comboAt, twins, registerOf, rushDeal, rushGameOf, rushRecord, rushRounds, valueOf, type RushCard } from './def.ts';

const FILES = ['s1-rush', 's2-rush'];
const parts = (us: readonly string[]): ListenPart[] => us.map((u) => listenOf(u)!);
const items = (u: string) => listenOf(u)!.items.filter((it): it is Extract<ListenItem, { kind: 'rush' }> => it.kind === 'rush');
beforeAll(() => load(...(FILES as Unit[])));

describe('すうじ ラッシュ: the deal', () => {
  it('deals the listened files at the lobby’s place (none there: the nearest’s) (this build: both listened since A3)', () => {
    const listen: Record<string, ListenEntry> = { 's1-rush': ['rush', 2, 'listened'], 's2-rush': ['rush', 3, 'draft'], 's2-call-a': ['call', 3, 'listened'] };
    expect(filesOf('rush', 3, listen)).toEqual(['s1-rush']);
    expect(filesOf('rush', 4, listen)).toEqual(['s1-rush']); // (none at もり: かわ's)
    expect(filesOf('rush', 3, INDEX.listen)).toEqual(['s1-rush']);
    expect(FILES.map((u) => INDEX.listen[u])).toEqual([['rush', 2, 'listened'], ['rush', 3, 'listened']]);
  });

  it('is the same for a seed: 8 customers, each its own clip, no two of one frame; the seeds vary it', () => {
    const a = rushDeal(5, parts(['s2-rush'])), b = rushDeal(5, parts(['s2-rush']));
    expect(a.map((c) => c.id)).toEqual(b.map((c) => c.id));
    expect(a).toHaveLength(RUSH_QS);
    expect(new Set(a.map((c) => c.id.replace(/-\d+$/, ''))).size).toBe(RUSH_QS);
    for (const c of a) expect([c.lv, c.voice, c.choices.length, c.type]).toEqual([4, 'us', 4, 'num']);
    const deals = new Set(Array.from({ length: 10 }, (_, s) => rushDeal(s, parts(['s2-rush'])).map((c) => c.id).join()));
    expect(deals.size).toBe(10);
    // corrections come at random places: over many deals, some first customers correct themselves and some don't
    const first = Array.from({ length: 40 }, (_, s) => rushDeal(s, parts(['s1-rush']))[0].rush.was !== undefined);
    expect(first.some(Boolean) && !first.every(Boolean)).toBe(true);
  });
});

describe('すうじ ラッシュ: tiers', () => {
  const card = (choices: string[], answer: number, was?: number) => ({ choices, answer, rush: { ask: '', at: 'cafe' as const, b: 1, ...(was !== undefined && { was }) } });

  it('hard all four; as authored three, the farthest from the answer dropped, the pre-correction value kept; easy without it', () => {
    const c = card(['3杯', '4杯', '5杯', '14杯'], 1, 2);
    expect(chipsAt(c, 'hard')).toEqual([0, 1, 2, 3]);
    expect(chipsAt(c, undefined)).toEqual([0, 1, 2]);
    expect(chipsAt(c, 'easy')).toEqual([0, 1, 3]);
    // no correction: easy is as authored, the -teen / -ty trap kept over a near value
    expect(chipsAt(card(['13番', '14番', '15番', '40番'], 1), 'easy')).toEqual([0, 1, 3]);
    expect(chipsAt(card(['16枚', '17枚', '18枚', '70枚'], 1), undefined)).toEqual([0, 1, 3]);
    expect(['3:15|3:50', '$16.25|$60.25', '14番|40番', '14番|41番', '3:15|4:50'].map((x) => twins(...(x.split('|') as [string, string])))).toEqual([true, true, true, false, false]);
    // never the pre-correction value dropped but at easy, even when it's the farthest
    expect(chipsAt(card(['1,000円', '1,500円', '2,000円', '10,000円'], 1, 3), undefined)).toEqual([0, 1, 3]);
  });

  it('reads a chip’s value: a time in minutes, a date’s day, a price or a count', () => {
    expect(['3:15', '11月14日', '1,450円', '$14.50', '12番線', '7193'].map(valueOf)).toEqual([195, 14, 1450, 14.5, 12, 7193]);
  });

  it('every customer: four distinct chips, ascending, the answer and the pre-correction value among them at hard', () => {
    for (const u of FILES) {
      for (const it of items(u)) {
        const vs = it.options.map(valueOf);
        expect(vs.every((v, k) => Number.isFinite(v) && (k === 0 || v > vs[k - 1])), `${it.id} ${it.options}`).toBe(true);
        expect(it.was === undefined || it.was !== it.answer).toBe(true);
        expect(it.tags.features.includes('self-repair')).toBe(it.was !== undefined);
      }
    }
  });
});

describe('すうじ ラッシュ: rounds and grading', () => {
  let cards: RushCard[] = [];
  beforeAll(() => void (cards = rushDeal(2, parts(['s1-rush']))));

  it('each player’s chips at their ear, the right one mapped; a pass is valid and never right; the row’s pick is the chip as authored', () => {
    const hard = rushRounds(cards, { lv: 3, ear: 3 }, () => 1800), easy = rushRounds(cards, { lv: 3, ear: 0 }, () => 1800);
    expect(hard.map((r) => r.id)).toEqual(easy.map((r) => r.id));
    for (const [i, c] of cards.entries()) {
      expect(hard[i].map).toHaveLength(4);
      expect(easy[i].map).toHaveLength(3);
      expect(hard[i].map[hard[i].answer]).toBe(c.answer);
      expect(easy[i].map[easy[i].answer]).toBe(c.answer);
      if (c.rush.was !== undefined) expect(easy[i].map).not.toContain(c.rush.was);
    }
    const r = easy[0];
    expect(RUSH.valid(r, r.answer) && RUSH.ok(r, r.answer)).toBe(true);
    expect(RUSH.valid(r, PASS) && !RUSH.ok(r, PASS)).toBe(true);
    for (const bad of [3, -1, 1.5, [0], 200]) expect(RUSH.valid(r, bad)).toBe(false);
    expect(RUSH.pick(r, (r.answer + 1) % 3)).toBe(r.map[(r.answer + 1) % 3]);
    expect(RUSH.pick(r, PASS)).toBe(-1);
  });

  it('8 s to answer from the clip’s end, whatever the timer; なし: no limit', () => {
    const r = rushRounds(cards, { lv: 3, ear: 1 }, () => 1800)[0];
    expect(RUSH.timing(r, 30_000, WINDOWS)).toEqual({ lead: WINDOWS.lead, play: 1800, answer: WINDOW });
    expect(RUSH.timing(r, 60_000, WINDOWS).answer).toBe(WINDOW);
    expect(RUSH.timing(r, Infinity, WINDOWS).answer).toBe(Infinity);
    expect(rushRounds(cards, { lv: 3, ear: 1 }, () => undefined)[0].play).toBe(2000);
    // its pages offer just this window and なし; the other lanes take the lobby's 20 / 30 / 60 s
    expect(modeOf('rush').window! * 1000).toBe(WINDOW);
    expect((['tile', 'tachi', 'call', 'news'] as const).map((m) => modeOf(m).window)).toEqual([undefined, undefined, undefined, undefined]);
  });

  it('a right ticket pays against expectation: more for a correction, more for a weaker ear; the deck counts them', () => {
    const def = rushGameOf({ cards: () => cards, playMs: () => 1800 });
    expect(def.modes).toMatchObject({ solo: true, coop: true, vs: true });
    const deck = (ear: number) => def.deck(2, { lv: 3, timer: 30, ear }, { w: WINDOWS, enc: [] });
    const rounds = rushRounds(cards, { lv: 3, ear: 1 }, () => 1800);
    const i = cards.findIndex((c) => c.rush.was !== undefined), j = cards.findIndex((c) => c.rush.was === undefined);
    expect(deck(1).grade(i, rounds[i].answer, 0)).toEqual({ ok: true, pts: questionPoints(1, 1.5) });
    expect(deck(1).grade(j, rounds[j].answer, 0).pts).toBeLessThan(deck(1).grade(i, rounds[i].answer, 0).pts);
    expect(deck(0).grade(j, rushRounds(cards, { lv: 3, ear: 0 }, () => 0)[j].answer, 0).pts).toBeGreaterThan(deck(2).grade(j, rushRounds(cards, { lv: 3, ear: 2 }, () => 0)[j].answer, 0).pts);
    expect(deck(1).grade(i, PASS, 0)).toEqual({ ok: false, pts: 0 });
    expect(deck(1).count).toBe(8);
    expect(deck(1).timing(0).answer).toBe(WINDOW);
  });

  it('a combo: customers served right in a row; a miss starts it again, never ends the run', () => {
    const served = [true, true, false, true, null, true, true, true];
    expect(served.map((_, i) => comboAt(i, (k) => served[k]))).toEqual([1, 2, 0, 1, 1, 2, 3, 4]);
    expect(bestCombo(8, (k) => served[k])).toBe(4);
    expect(registerOf(0)).toBe(0);
    expect(registerOf(5)).toBe(1);
  });

  it('keeps each customer I served (the pick as authored, replays), not the other register’s, and reads back through the files’ parts', () => {
    const rounds = rushRounds(cards, { lv: 3, ear: 0 }, () => 0);
    const answers = rounds.map((r, i) => (i % 2 ? PASS : i === 2 ? (r.answer + 1) % 3 : i === 4 ? null : r.answer));
    const row = rushRecord(rounds, answers, rounds.map(() => true), [1, 0, 0, 0, 0, 0, 0, 0], true);
    expect(row).toEqual([[rounds[0].id, 1, cards[0].answer, 1], [rounds[2].id, 0, rounds[2].map[(rounds[2].answer + 1) % 3], 0], [rounds[4].id, 0, -1, 0], [rounds[6].id, 1, cards[6].answer, 0]]);
    expect(rushRecord(rounds, answers, rounds.map(() => true), [], false)).toHaveLength(3);
    const byId = new Map(items('s1-rush').map((it) => [it.id, it]));
    expect(byId.get(row[1][0])!.options[row[1][2]]).toBe(cards[2].choices[rounds[2].map[(rounds[2].answer + 1) % 3]]);
  });
});

// ---------- two phones ----------

const T0 = Date.UTC(2026, 10, 7, 3);
const src = { cards: (seed: number) => rushDeal(seed, parts(['s2-rush'])), playMs: () => 3000, cv: () => 'abc123' };

function pair() {
  let n = 0;
  const random = () => ((n = (n * 9301 + 49297) % 233280) / 233280);
  const make = (me: Who) => new RoundSession({ me, defs: registry([rushGameOf(src)]), random });
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

describe('すうじ ラッシュ: two phones', () => {
  it('co-op: two registers, the customers alternating, the other passing; the team serves a customer when its register gets it', () => {
    const r = pair();
    r.act('A', (x) => x.open({ gm: 'rush', o: listenOpts.encode({ lv: 4, timer: 30, ear: 1 }) }, T0));
    r.act('A', (x) => x.invite(T0));
    r.act('B', (x) => x.join(T0, undefined, 3));
    r.act('A', (x) => x.go(T0));
    const seed = r.s.A.view(T0).seed, cards = src.cards(seed);
    const ra = rushRounds(cards, { lv: 4, ear: 1 }, src.playMs), rb = rushRounds(cards, { lv: 4, ear: 3 }, src.playMs);
    expect(ra.map((x) => x.map.length)).toEqual(Array(8).fill(3));
    expect(rb.map((x) => x.map.length)).toEqual(Array(8).fill(4));
    let t = T0 + WINDOWS.countdown;
    for (let i = 0; i < RUSH_QS; i++) {
      const at = t + WINDOWS.lead + 3000 + 10;
      expect(r.s.A.view(at).phase).toBe('answer');
      expect(r.s.A.view(at).limit).toBe(t + WINDOWS.lead + 3000 + WINDOW);
      const mine = registerOf(i) === 0 ? 'A' : 'B', rs = mine === 'A' ? ra : rb;
      // B misses customer 3; A's own are right
      const k = i === 3 ? (rs[i].answer + 1) % rs[i].map.length : rs[i].answer;
      r.act(mine, (x) => x.answer(k, 0, at), at);
      r.act(mine === 'A' ? 'B' : 'A', (x) => x.answer(PASS, 0, at), at);
      expect(r.s.A.view(at).phase).toBe('reveal');
      r.act('A', (x) => x.next(at + 1), at + 1);
      t = at + 1;
    }
    const A = r.s.A.view(t + 1), B = r.s.B.view(t + 1);
    expect([A.phase, B.phase]).toEqual(['results', 'results']);
    expect(A.team).toEqual(B.team);
    expect(A.team.right).toBe(RUSH_QS - 1);
    const rowB = rushRecord(rb, B.answers.map((a) => a?.a ?? null), B.had, [], true);
    expect(rowB.map(([id, ok]) => [id, ok])).toEqual([1, 3, 5, 7].map((i) => [rb[i].id, i === 3 ? 0 : 1]));
  });

  it('しょうぶ: both serve every customer, each paid against their own ear (the weaker ear more for the same ticket)', () => {
    const r = pair();
    r.act('A', (x) => x.open({ gm: 'rush', o: listenOpts.encode({ lv: 4, timer: 0, ear: 1 }), vs: true }, T0));
    r.act('A', (x) => x.invite(T0));
    r.act('B', (x) => x.join(T0, undefined, 3));
    r.act('A', (x) => x.go(T0));
    const seed = r.s.A.view(T0).seed, cards = src.cards(seed);
    const ra = rushRounds(cards, { lv: 4, ear: 1 }, src.playMs), rb = rushRounds(cards, { lv: 4, ear: 3 }, src.playMs);
    let t = T0 + WINDOWS.countdown;
    for (let i = 0; i < RUSH_QS; i++) {
      const at = t + WINDOWS.lead + 3000 + 10;
      expect(r.s.A.view(at).limit).toBe(Infinity);
      r.act('A', (x) => x.answer(ra[i].answer, 0, at), at);
      expect(r.s.A.view(at).phase).toBe('answer');
      r.act('B', (x) => x.answer(rb[i].answer, 0, at), at);
      expect(r.s.A.view(at).phase).toBe('reveal');
      r.act('A', (x) => x.next(at + 1), at + 1);
      t = at + 1;
    }
    const A = r.s.A.view(t + 1);
    expect(A.vs).toBe(true);
    const sum = (ear: number) => cards.reduce((s, c) => s + questionPoints(ear, c.rush.b), 0);
    expect(A.scores).toEqual({ A: sum(1), B: sum(3) });
    expect(A.scores.A!).toBeGreaterThan(A.scores.B!);
  });
});

// ---------- the content ----------

/** A sentence's content words (near-dupes.test's normalisation). */
const STOP = new Set('a an the to of and or but in on at for is are was were be been it its i you we he she they this that so just do did have has had my your our his her their me us them him'.split(' '));
const tokens = (s: string): Set<string> => new Set((s.toLowerCase().replace(/’/g, "'").match(/[a-z0-9']+/g) ?? []).filter((w) => !STOP.has(w)));
const jaccard = (a: ReadonlySet<string>, b: ReadonlySet<string>): number => {
  let n = 0;
  for (const x of a) if (b.has(x)) n++;
  return n / (a.size + b.size - n);
};

describe('すうじ ラッシュ: the content (scripts/kikimimi-rush.ts)', () => {
  it('is as the generator writes it (npm run kikimimi:rush after changing a frame)', () => {
    const run = spawnSync(process.execPath, ['scripts/kikimimi-rush.ts', '--check'], { cwd: new URL('../../../../../', import.meta.url).pathname, encoding: 'utf8' });
    expect(run.stderr).toBe('');
    expect(run.status).toBe(0);
  });

  it('~240 customers over both files, about a third correcting themselves, each frame four times by four voices', () => {
    const all = FILES.flatMap(items);
    expect(all).toHaveLength(240);
    const share = all.filter((it) => it.was !== undefined).length / all.length;
    expect(share).toBeGreaterThan(0.28);
    expect(share).toBeLessThan(0.4);
    const frames = Map.groupBy(all, (it) => it.id.replace(/-\d+$/, ''));
    for (const [f, its] of frames) {
      expect(its, f).toHaveLength(4);
      expect(new Set(its.map((it) => it.speaker)).size, f).toBe(4);
    }
    expect(new Set(all.map((it) => it.en)).size).toBe(all.length);
  });

  it('no customer says what the bank already says (rush is exempt among itself: one frame makes many)', () => {
    const bank = BANK.flatMap((it) => (isDialogue(it) ? it.lines.map((l) => l.en) : [it.en])).map(tokens).filter((t) => t.size >= 4);
    const close = FILES.flatMap(items).filter((it) => bank.some((b) => jaccard(tokens(it.en), b) >= 0.5)).map((it) => it.id);
    expect(close).toEqual([]);
  });
});
