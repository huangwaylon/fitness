// Recipe 2 (games/lesson/recipe.ts, docs/curriculum-units.md §16; W2-9): a unit's manifest naming its listening
// content (checked against content/listen/, its files in the index), the lesson that loads its kind's files before its
// deck, the deck of tiles, a call with 4 quiz items or a たちぎき, and the fallback to recipe 1, exactly, whenever a
// kind's content isn't listened (a draft, or only voiced), isn't loaded or has lost an id; the mixed deck's rounds and
// grading, the views' card view, and the row a mixed lesson writes (still a lesson's, stamping at 5 of 6). Over a fixture
// unit compiled from the bank's items and the build's listening files (never shipped).
import { beforeAll, describe, expect, it } from 'vitest';
import { listenOf as rowOf, stampsUnit, type ListenRow } from '../../../contract/listen.ts';
import { CLIPS, WORDS } from '../../testdata.ts';
import { compile, readListen } from '../../compile.ts';
import { lessonDeck, type UnitChunk } from '../../lesson.ts';
import type { ListenEntry, ListenPart } from '../../listen.ts';
import { INDEX, addUnit, listenOf, load, loadAll, unitKinds, unitPart, type Index } from '../../pool.ts';
import { checkUnits, listenRefs, manifestOf, type UnitManifest } from '../../units.ts';
import { joined } from '../../source.ts';
import { LADDERS } from '../../ladders.ts';
import { quizDeck } from '../quiz/def.ts';
import { WINDOWS } from '../../round/session.ts';
import type { QuizView } from '../quiz/view.ts';
import { listenOpts } from '../listened.ts';
import { listenAnswers } from '../../progress.ts';
import { tileOk, type TileCard, type TileRound } from '../tile/def.ts';
import type { CallCard, CallRound } from '../call/def.ts';
import type { TachiCard } from '../tachi/def.ts';
import { lessonOpts } from './def.ts';
import { lessonChunks, lessonLane } from './lane.ts';
import { cardAnswer, cardKind, kindCards, lessonRoundDeck, lessonRounds, listenAt, recipeDeck, rightAt, type KindSource } from './recipe.ts';
import { cardView } from '../../../components/kikimimi/lesson/board.ts';

const TILES = ['tile-m4-be-good', 'tile-m4-put-through', 'tile-w4-shouldve', 'tile-w4-wouldnt-have', 'tile-w4-wanna', 'tile-w4-gotta', 'tile-w4-didja'];
const LESSON_IDS = {
  deai: ['d4-hotel-suite', 'r4-room-ready', 'm4-upgrade', 'r4-overbooked', 'ml-m-quieter-room', 'r4-anything-else', 'd4-receptionist'],
  bamen: ['ml-r-incidentals', 'm4-not-ideal', 'r4-triage', 'm4-see-what', 'w4-cant-uk', 'r4-reschedule'],
  check: ['ml-n-room', 'ml-n-late-checkout', 'r4-leak', 'm4-easy', 'n4-reference', 'w4-youll-need'],
  oto: ['w4-shouldve', 'w4-wouldnt-have', 'w4-wanna', 'w4-gotta', 'w4-didja', 'w4-them'],
  jissen: ['r4-noise', 'r4-parcel', 'm4-swing-by', 'r4-cut-out', 'm4-not-bad', 'n4-water']
};
const KINDS = { tiles: TILES, tachi: ['tachi-shibuya-dinner'], call: ['call-hotel-extra-night'] };

const base = (unit: string, lessons: object, stage = 'mori') => ({
  schema: 1, unit, name: 'ホテルで こまった', stage, domain: 'tabi', host: 'diana', scene: 'lobby', sound: stage === 'mori' ? 'self-repair' : 'stress',
  cando: {
    who: 'ホテルの スタッフ', does: 'へやの もんだいへの たいおうを せつめいする', cond: 'ロビーの ざつおんの なかで', catch: 'できる ことと ついかの りょうきん',
    en: 'I can follow hotel staff explaining what they can do about a room problem, over lobby noise, and catch the options and any extra charge.'
  },
  status: 'draft',
  ph: [{ id: `ph-${unit.slice(3)}-room`, en: 'room', register: 'service', scene: 'hotel desk', trap: 'ルーム だけで なく へや ぜんぶ' }],
  lessons
});
/** A もり unit on recipe 2 (tiles from s2-tile-bank, a たちぎき from s2-tachi-a and a call from s2-call-a: all listened in this build). */
const V2 = base('tr-recipe', { v: 2, ...LESSON_IDS, ...KINDS });
/** The same unit on recipe 1 (its items V2's: here for review). */
const V1 = { ...base('tr-recipev1', { v: 1, ...LESSON_IDS }), review: [...new Set(Object.values(LESSON_IDS).flat())] };

const LISTEN = readListen();
const REFS = listenRefs(LISTEN);
let index: Index;
let v2: UnitChunk, v1: UnitChunk;
const build: KindSource = { entry: (f) => INDEX.listen[f], part: listenOf };
/** The build's files with some at another status (a draft as before the listening check, or listened). */
const at = (status: ListenEntry[2], files: string[]): KindSource => ({ entry: (f) => (files.includes(f) ? ([INDEX.listen[f][0], INDEX.listen[f][1], status] as ListenEntry) : INDEX.listen[f]), part: listenOf });
const listened = (...files: string[]) => at('listened', files);
const drafts = (...files: string[]) => at('draft', files);
const filesOf = (c: UnitChunk, l: 'oto' | 'jissen' | 'check') => unitKinds(c.unit.id)[l] ?? [];

beforeAll(async () => {
  await loadAll();
  const files = compile(CLIPS, WORDS, [{ file: 'tr-recipe.yaml', raw: V2 }, { file: 'tr-recipev1.yaml', raw: V1 }]);
  index = JSON.parse(files.get('index.json')!.replace(/,\n"paths":[\s\S]*$/, '}')) as Index;
  addUnit('tr-recipe', JSON.parse(files.get('parts/u-tr-recipe.json')!), index.games['lesson:tr-recipe'], index.units['tr-recipe'].kinds);
  addUnit('tr-recipev1', JSON.parse(files.get('parts/u-tr-recipev1.json')!), index.games['lesson:tr-recipev1']);
  await load('tr-recipe', 'tr-recipev1', 's2-tile-bank', 's2-tachi-a', 's2-call-a');
  v2 = unitPart('tr-recipe')!;
  v1 = unitPart('tr-recipev1')!;
});

describe('recipe 2: the manifest', () => {
  const unitOf = (raw: object) => manifestOf(raw, `${(raw as { unit: string }).unit}.yaml`);
  const errorsOf = (raw: object) => {
    const m = unitOf(raw);
    return m.unit ? checkUnits([m.unit as UnitManifest], joined(CLIPS), LADDERS, undefined, REFS).errors : m.errors;
  };

  it('takes v 2 with its kinds, each found in content/listen/ at the unit’s stage', () => {
    expect(unitOf(V2).errors).toEqual([]);
    expect(errorsOf(V2)).toEqual([]);
  });

  it('refuses kinds on recipe 1, recipe 2 with none, the wrong counts, a kind without its fallback, ほし', () => {
    const { tiles: _t, tachi: _a, call: _c, ...plain } = V2.lessons as Record<string, unknown>;
    expect(unitOf(base('tr-x', { ...LESSON_IDS, v: 1, call: KINDS.call })).errors.join()).toMatch(/lessons\.call: recipe 2's/);
    expect(unitOf(base('tr-x', { ...plain, v: 2 })).errors.join()).toMatch(/recipe 2 names its listening content/);
    expect(unitOf(base('tr-x', { ...LESSON_IDS, v: 2, tiles: TILES.slice(0, 5) })).errors.join()).toMatch(/lessons\.tiles: 6-40 distinct tile ids/);
    expect(unitOf(base('tr-x', { ...LESSON_IDS, v: 2, call: [...KINDS.call, 'call-gp-callback'] })).errors.join()).toMatch(/lessons\.call: 1 distinct call ids/);
    const { oto: _o, ...noOto } = LESSON_IDS;
    expect(unitOf(base('tr-x', { ...noOto, v: 2, tiles: TILES })).errors.join()).toMatch(/lessons\.tiles: needs lessons\.oto too/);
    expect(unitOf(base('tr-x', { ...LESSON_IDS, v: 2, tiles: TILES }, 'hoshi')).errors.join()).toMatch(/no listening game plays at ほし/);
  });

  it('refuses an id that isn’t its kind’s, or a file at another stage', () => {
    expect(errorsOf(base('tr-x', { ...LESSON_IDS, v: 2, call: ['tachi-shibuya-dinner'] })).join()).toMatch(/tachi-shibuya-dinner isn't a call in content\/listen/);
    expect(errorsOf(base('tr-x', { ...LESSON_IDS, v: 2, call: ['call-nope'] })).join()).toMatch(/call-nope isn't a call/);
    const kawa = [...REFS].find(([, r]) => r.kind === 'call' && r.stage === 2)![0];
    expect(errorsOf(base('tr-x', { ...LESSON_IDS, v: 2, call: [kawa] })).join()).toMatch(/is at stage 2, not mori's 3/);
  });

  it('compiles its kinds’ files into the index, and its lesson cv takes in only the listened ones', () => {
    expect(index.units['tr-recipe'].kinds).toEqual({ oto: ['s2-tile-bank'], jissen: ['s2-tachi-a'], check: ['s2-call-a'] });
    expect(index.units['tr-recipev1'].kinds).toBeUndefined();
    // recipe 1's lesson cv is its chunk's (unchanged); recipe 2's moves with its listened files
    expect(index.games['lesson:tr-recipev1']).toMatch(/^[0-9a-f]{6}$/);
    expect(index.games['lesson:tr-recipe']).not.toBe(index.games['lesson:tr-recipev1']);
  });
});

describe('recipe 2: the lesson loads its kind’s files, then deals', () => {
  it('a lesson’s chunks: its unit’s, then its kind’s listened files', () => {
    expect(lessonChunks('tr-recipe', 'oto')).toEqual(['tr-recipe', 's2-tile-bank']);
    expect(lessonChunks('tr-recipe', 'check')).toEqual(['tr-recipe', 's2-call-a']);
    expect(lessonChunks('tr-recipe', 'deai')).toEqual(['tr-recipe']);
    expect(lessonChunks('tr-recipev1', 'oto')).toEqual(['tr-recipev1']);
    expect(lessonLane.chunks({ o: lessonOpts.encode({ lv: 4, timer: 30, lesson: 'oto' }), u: 'tr-recipe' })).toEqual(['tr-recipe', 's2-tile-bank']);
  });

  it('おと: 6 of its tiles by the seed, the shortest first, the same on every phone', () => {
    const a = recipeDeck(v2, 'oto', 11, undefined, filesOf(v2, 'oto'), build);
    expect(a).toHaveLength(6);
    expect(a.every((it) => cardKind(it) === 'tile')).toBe(true);
    for (const c of a as TileCard[]) expect(TILES).toContain(c.tile.id);
    expect(recipeDeck(v2, 'oto', 11, 'hard', filesOf(v2, 'oto'), build).map((c) => c.id)).toEqual(a.map((c) => c.id));
    const lens = (a as TileCard[]).map((c) => c.tile.tiles.length);
    expect(lens).toEqual([...lens].sort((x, y) => x - y));
    // through the lane, as a phone deals it
    const dealt = lessonLane.deal({ gm: 'lesson', seed: 11, o: lessonOpts.encode({ lv: 4, timer: 30, lesson: 'oto' }), u: 'tr-recipe' });
    expect(dealt.map((c) => c.id)).toEqual(a.map((c) => c.id));
  });

  it('チェック: a call (its 2 memo rounds) first, then 4 of its held-out quiz items, once the call’s file is listened', () => {
    const src = listened('s2-call-a');
    for (const seed of [1, 2, 3]) {
      const d = recipeDeck(v2, 'check', seed, undefined, filesOf(v2, 'check'), src);
      expect(d.map((it) => cardKind(it))).toEqual(['call', 'call', null, null, null, null]);
      expect((d[0] as CallCard).call.info.id).toBe('call-hotel-extra-night');
      expect(d.slice(2).map((it) => it.id)).toEqual(lessonDeck(v2, 'check', seed).slice(0, 4).map((it) => it.id));
      for (const it of d.slice(2)) expect(LESSON_IDS.check).toContain(it.id);
    }
    // and through the lane, as a phone deals it (this build's call file is listened)
    const o = lessonOpts.encode({ lv: 4, timer: 30, lesson: 'check' });
    expect(lessonLane.deal({ gm: 'lesson', seed: 3, o, u: 'tr-recipe' })).toEqual(recipeDeck(v2, 'check', 3, undefined, filesOf(v2, 'check'), build));
  });

  it('じっせん: a たちぎき’s 3 rounds, then 3 of its quiz items', () => {
    const d = recipeDeck(v2, 'jissen', 5, undefined, filesOf(v2, 'jissen'), listened('s2-tachi-a'));
    expect(d.map((it) => cardKind(it))).toEqual(['tachi', 'tachi', 'tachi', null, null, null]);
    expect((d as TachiCard[]).slice(0, 3).map((c) => c.tachi.type)).toEqual(['opinions', 'changed', 'plan']);
  });

  it('falls back to recipe 1, exactly, while a kind’s file isn’t listened (a draft, or only voiced)', () => {
    const draft = drafts('s2-call-a', 's2-tachi-a');
    for (const seed of [0, 7, 42]) {
      for (const tier of [undefined, 'easy', 'hard'] as const) {
        expect(recipeDeck(v2, 'check', seed, tier, filesOf(v2, 'check'), draft)).toEqual(lessonDeck(v2, 'check', seed, tier));
        expect(recipeDeck(v2, 'jissen', seed, tier, filesOf(v2, 'jissen'), draft)).toEqual(lessonDeck(v2, 'jissen', seed, tier));
      }
    }
    const voiced: KindSource = { entry: (f) => (f === 's2-call-a' ? ['call', 3, 'voiced'] : INDEX.listen[f]), part: listenOf };
    expect(kindCards(v2, 'check', 1, filesOf(v2, 'check'), voiced)).toBeNull();
  });

  it('falls back when a file isn’t loaded, isn’t its kind’s, or an id is gone', () => {
    const notLoaded: KindSource = { entry: listened('s2-call-a').entry, part: () => undefined };
    expect(kindCards(v2, 'check', 1, filesOf(v2, 'check'), notLoaded)).toBeNull();
    const wrongGame: KindSource = { entry: () => ['tile', 3, 'listened'], part: listenOf };
    expect(kindCards(v2, 'check', 1, filesOf(v2, 'check'), wrongGame)).toBeNull();
    const gone: KindSource = { entry: listened('s2-call-a').entry, part: (f) => ({ ...listenOf(f)!, items: listenOf(f)!.items.filter((it) => it.id !== 'call-hotel-extra-night') }) as ListenPart };
    expect(kindCards(v2, 'check', 1, filesOf(v2, 'check'), gone)).toBeNull();
    expect(kindCards(v2, 'check', 1, [], listened('s2-call-a'))).toBeNull();
  });

  it('recipe 1 plays as before: every lesson its lessonDeck, whatever is listened', () => {
    const all = listened('s2-call-a', 's2-tachi-a');
    for (const l of ['deai', 'bamen', 'check', 'oto', 'jissen'] as const) {
      for (const seed of [0, 9]) {
        expect(recipeDeck(v1, l, seed, undefined, filesOf(v2, l === 'deai' || l === 'bamen' ? 'oto' : l), all)).toEqual(lessonDeck(v1, l, seed));
        // (recipe 2's core lessons without a kind: recipe 1's too)
        if (l === 'deai' || l === 'bamen') expect(recipeDeck(v2, l, seed, undefined, [], all)).toEqual(lessonDeck(v2, l, seed));
      }
    }
  });
});

describe('recipe 2: the rounds, the grading, the row', () => {
  const W = WINDOWS;
  const deckOf = (seed: number, src = listened('s2-call-a')) => recipeDeck(v2, 'check', seed, undefined, filesOf(v2, 'check'), src);

  it('a card’s options: its place’s level, the ear a step down for easy and up for hard, within 0-3', () => {
    expect(listenAt(4, undefined, 30)).toEqual({ lv: 4, timer: 30, ear: 2 });
    expect(listenAt(4, 'easy', 30).ear).toBe(1);
    expect(listenAt(4, 'hard', 30).ear).toBe(3);
    expect(listenAt(1, 'easy', 30)).toEqual({ lv: 1, timer: 30, ear: 0 });
    expect(listenAt(6, 'hard', 30).ear).toBe(3);
  });

  it('recipe 1’s deck: its rounds and timing are the quiz’s, round for round', () => {
    const items = lessonDeck(v1, 'bamen', 4), rs = lessonRounds(items, 4, undefined, 30);
    const mine = lessonRoundDeck(() => rs, { timer: 30 }, W), quiz = quizDeck(() => rs as never, { timer: 30 }, W);
    expect(mine.count).toBe(quiz.count);
    for (let i = 0; i < rs.length; i++) {
      expect(mine.timing(i)).toEqual(quiz.timing(i));
      for (const k of [0, 1, 2, 3]) expect(mine.grade(i, k, 0)).toEqual(quiz.grade(i, k, 0));
      expect(mine.valid(i, [1, 2])).toBe(false);
    }
  });

  it('a mixed deck grades each round by its kind: the call’s memo by its rows, a quiz item by its choice', () => {
    const items = deckOf(2), rs = lessonRounds(items, 2, undefined, 30), deck = lessonRoundDeck(() => rs, { timer: 30 }, W);
    const call = rs[0] as CallRound;
    expect(call.kind).toBe('call');
    expect(deck.timing(0).play).toBeGreaterThan(0);
    expect(deck.timing(1).play).toBe(0); // (the memo's second round plays nothing)
    const right = call.rows.map((r) => r.answer);
    expect(deck.valid(0, right)).toBe(true);
    expect(deck.grade(0, right, 0)).toEqual({ ok: true, pts: 100 });
    expect(deck.grade(0, right.map((x) => (x + 1) % 3), 0).ok).toBe(false);
    expect(deck.valid(0, 1)).toBe(false);
    expect(deck.grade(2, items[2].answer, 0)).toEqual({ ok: true, pts: 100 });
    expect(rightAt(items, rs, 0, { k: 0, a: right })).toBe(true);
    expect(rightAt(items, rs, 2, { k: items[2].answer })).toBe(true);
    expect(rightAt(items, rs, 2, { k: (items[2].answer + 1) % items[2].choices.length })).toBe(false);
  });

  it('a player’s tier is their own on the cards: hard’s tiles carry more decoys, easy’s memo fewer rows', () => {
    const tiles = recipeDeck(v2, 'oto', 3, undefined, filesOf(v2, 'oto'), build);
    const as = lessonRounds(tiles, 3, undefined, 30) as TileRound[], hard = lessonRounds(tiles, 3, 'hard', 30) as TileRound[];
    expect(hard.reduce((n, r) => n + r.board.length, 0)).toBeGreaterThan(as.reduce((n, r) => n + r.board.length, 0));
    const calls = deckOf(3);
    const easy = lessonRounds(calls, 3, 'easy', 30) as CallRound[], plain = lessonRounds(calls, 3, undefined, 30) as CallRound[];
    expect(easy[0].rows.length + easy[1].rows.length).toBeLessThan(plain[0].rows.length + plain[1].rows.length);
    // the views see the same: the card view's options at my tier, each player's ear at theirs
    const v = { o: lessonOpts.encode({ lv: 4, timer: 30, lesson: 'oto', tier: 'hard' }), timer: 30, tiers: { B: 1 } } as unknown as QuizView;
    const cv = cardView(v, tiles[0].lv);
    expect(cv.o).toEqual(listenOpts.encode({ lv: 4, timer: 30, ear: 3 }));
    expect(cv.tiers).toEqual({ B: 1 });
    expect(tileOk(as[0], as[0].tiles.map((w) => as[0].board.indexOf(w)))).toBe(true);
  });

  it('the row: each round mine, a card’s by its game, still a lesson’s; 5 of 6 on the first listen stamps', () => {
    const items = deckOf(6), rs = lessonRounds(items, 6, undefined, 30);
    const call = rs[0] as CallRound, memo = rs[1] as CallRound;
    const answers = [
      { k: 0, a: call.rows.map((r) => r.answer), rp: false, t: 0 },
      { k: 0, a: memo.rows.map((r, j) => (j === 0 ? (r.answer + 1) % r.chips.length : r.answer)), rp: false, t: 0 },
      ...items.slice(2).map((it) => ({ k: it.answer, rp: false, t: 0 }))
    ];
    const v = { seed: 6, o: lessonOpts.encode({ lv: 4, timer: 30, lesson: 'check' }), answers, had: items.map(() => true) } as unknown as QuizView;
    const r = lessonLane.record!(v, items, [], true);
    expect(r).toHaveLength(6);
    expect(r[0]).toEqual(['call-hotel-extra-night', 1, 0, 0]);
    expect(r[1][0]).toBe('call-hotel-extra-night');
    expect(r[1][1]).toBe(0);
    expect(r[1][2]).toBe(1 << memo.rows[0].n);
    for (let i = 2; i < 6; i++) expect(r[i].slice(0, 2)).toEqual([items[i].id, 1]);
    const row: ListenRow = { d: '2026-11-07', g: 'abcd1234', u: 'tr-recipe', l: 3, lv: 4, n: 1, ms: 1000, r };
    expect(rowOf(row)).toEqual(row);
    expect(stampsUnit(row)).toBe(true);
    // a card not answered at the results: timed out
    expect(cardAnswer(call, null, 2)).toEqual(['call-hotel-extra-night', 0, -1, 2]);
    expect(lessonLane.record!({ ...v, answers: [null, ...answers.slice(1)] } as QuizView, items, [], false)).toHaveLength(5);
  });

  it('recipe 1’s row is the quiz’s answers, as before', () => {
    const items = lessonDeck(v1, 'check', 1);
    const answers = items.map((it) => ({ k: it.answer, rp: false, t: 0 }));
    const r = lessonLane.record!({ seed: 1, o: lessonOpts.encode({ lv: 4, timer: 30, lesson: 'check' }), answers, had: items.map(() => true) } as unknown as QuizView, items, [], true);
    expect(r).toEqual(listenAnswers(items, answers, items.map(() => true), [], true));
    expect(r.map((x) => x[1])).toEqual([1, 1, 1, 1, 1, 1]);
  });
});
