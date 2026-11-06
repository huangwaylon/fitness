// ききみみ's lessons and stamps (docs/curriculum-units.md §2-§4, §10; U2-U3): a lesson's 6-question deck from a unit's
// chunk (deterministic by seed, the チェック held out, a player's tier), the stamps folded from rows (mine ≥ 5/6 on the
// first listen, or a co-op team's ≥ 5: a pair pass where one player scored low), the partner's stamp and the double
// stamp, the 30-day solo recheck, and the phrase ずかん's caught rule and daily review. Over a fixture unit compiled
// from the bank's items (never shipped).
import { beforeAll, describe, expect, it } from 'vitest';
import type { EventRow } from '../contract/api.ts';
import type { ListenRow } from '../contract/listen.ts';
import { CLIPS, WORDS } from './testdata.ts';
import { compile } from './compile.ts';
import { isDialogue } from './bank.ts';
import { lessonDeck, lessonL, lessonOf, playIds, stageLevel, tierFor, type UnitChunk } from './lesson.ts';
import { INDEX, addUnit, load, loadAll, unitIds, unitPart, type Unit } from './pool.ts';
import { gamesOf, type Answer } from './progress.ts';
import { RECHECK_DAYS, rechecksDue, unitsOf } from './stamps.ts';
import { lettersOf } from './letters.ts';
import { loadLetters } from './pool.ts';
import { CAUGHT_CLIPS, CAUGHT_DAYS, REVIEW_CAP, phraseReview, phrasesOf } from './srs.ts';
import { LESSONS, LESSON_QS } from './stages.ts';

const LESSON_IDS = {
  deai: ['d4-hotel-suite', 'r4-room-ready', 'm4-upgrade', 'r4-overbooked', 'ml-m-quieter-room', 'r4-anything-else', 'd4-receptionist'],
  bamen: ['ml-r-incidentals', 'm4-not-ideal', 'r4-triage', 'm4-see-what', 'w4-cant-uk', 'r4-reschedule'],
  check: ['ml-n-room', 'ml-n-late-checkout', 'r4-leak', 'm4-easy', 'n4-reference', 'w4-youll-need'],
  oto: ['w4-shouldve', 'w4-wouldnt-have', 'w4-wanna', 'w4-gotta', 'w4-didja', 'w4-them']
};

/** A もり unit over the bank's items: a fixture, compiled as a real one is (compile.ts unitChunk). */
const MANIFEST = {
  schema: 1, unit: 'tr-testinn', name: 'ホテルで こまった', stage: 'mori', domain: 'tabi', host: 'diana', scene: 'lobby', sound: 'self-repair',
  cando: {
    who: 'ホテルの スタッフ', does: 'へやの もんだいへの たいおうを せつめいする', cond: 'ロビーの ざつおんの なかで', catch: 'できる ことと ついかの りょうきん',
    en: 'I can follow hotel staff explaining what they can do about a room problem, over lobby noise, and catch the options and any extra charge.'
  },
  status: 'draft',
  ph: [{ id: 'ph-ti-room', en: 'room', register: 'service', scene: 'hotel desk', trap: 'ルーム だけで なく へや ぜんぶ' }],
  lessons: { v: 1, ...LESSON_IDS },
  tiers: {
    'r4-room-ready': { easy: { choices: ['OK, I can wait.', 'It is a big room.'], answer: 0 }, hard: { choices: ['Could I leave my bags, then?', 'Then I will be ready.', 'Is it quite big?', 'Not quite yet.'], answer: 0 } },
    'r4-leak': { easy: { choices: ['Thanks, please send someone.', 'I like the rain.'], answer: 0 } }
  }
};

let chunk: UnitChunk;
beforeAll(async () => {
  await loadAll();
  const files = compile(CLIPS, WORDS, [{ file: 'tr-testinn.yaml', raw: MANIFEST }]);
  const part = JSON.parse(files.get('parts/u-tr-testinn.json')!);
  addUnit('tr-testinn', part);
  await load('tr-testinn');
  chunk = unitPart('tr-testinn')!;
});

describe('lessons: the deck', () => {
  it('the chunk is in, as compiled', () => {
    expect(unitIds()).toContain('tr-testinn');
    expect(chunk.unit).toMatchObject({ id: 'tr-testinn', stage: 'mori', lessons: { v: 1 } });
    expect(chunk.unit.ph[0].in.length).toBeGreaterThan(0);
  });

  it('6 questions, deterministic by seed; other seeds deal other orders', () => {
    for (const l of ['deai', 'bamen', 'check', 'oto'] as const) {
      const a = lessonDeck(chunk, l, 1234), b = lessonDeck(chunk, l, 1234);
      expect(a).toHaveLength(LESSON_QS);
      expect(b).toEqual(a);
      expect(new Set(a.map((it) => it.id)).size).toBe(LESSON_QS);
      for (const it of a) expect(LESSON_IDS[l]).toContain(it.id);
      for (const it of a) expect(it.choices[it.answer]).toBe(chunk.items.find((x) => x.id === it.id)!.choices[chunk.items.find((x) => x.id === it.id)!.answer]);
    }
    const decks = new Set(Array.from({ length: 20 }, (_, s) => JSON.stringify(lessonDeck(chunk, 'bamen', s).map((it) => [it.id, it.choices]))));
    expect(decks.size).toBeGreaterThan(5);
  });

  it('であい draws 6 of its 7 and opens on its model dialogue', () => {
    for (let s = 0; s < 30; s++) expect(isDialogue(lessonDeck(chunk, 'deai', s)[0])).toBe(true);
    const seen = new Set(Array.from({ length: 30 }, (_, s) => lessonDeck(chunk, 'deai', s).map((it) => it.id)).flat());
    expect(seen.size).toBe(7);
  });

  it('the チェック is held out of であい and ばめん (even if a manifest slipped one in)', () => {
    const heard = new Set([...LESSON_IDS.deai, ...LESSON_IDS.bamen]);
    for (let s = 0; s < 30; s++) for (const it of lessonDeck(chunk, 'check', s)) expect(heard.has(it.id)).toBe(false);
    const leaky: UnitChunk = { ...chunk, unit: { ...chunk.unit, lessons: { ...chunk.unit.lessons, check: ['r4-room-ready', ...LESSON_IDS.check] } } };
    expect(playIds(leaky, 'check')).toEqual(LESSON_IDS.check);
  });

  it('a tier plays its own choice set on the same audio; none (or a tier an item lacks): the authored set', () => {
    const find = (tier?: 'easy' | 'hard') => {
      for (let s = 0; s < 50; s++) {
        const it = lessonDeck(chunk, 'deai', s, tier).find((x) => x.id === 'r4-room-ready');
        if (it) return it;
      }
      throw new Error('never dealt');
    };
    const easy = find('easy'), hard = find('hard'), plain = find();
    expect([...easy.choices].sort()).toEqual(['It is a big room.', 'OK, I can wait.']);
    expect(easy.choices[easy.answer]).toBe('OK, I can wait.');
    expect(hard.choices).toHaveLength(4);
    expect(hard.choices[hard.answer]).toBe('Could I leave my bags, then?');
    const authored = chunk.items.find((x) => x.id === 'r4-room-ready')!;
    expect([...plain.choices].sort()).toEqual([...authored.choices].sort());
    expect(easy.en).toBe(authored.en);
    // m4-upgrade has no tiers: the same for every tier
    const s = 7;
    expect(lessonDeck(chunk, 'check', s, 'hard').map((it) => it.id)).toEqual(lessonDeck(chunk, 'check', s).map((it) => it.id));
  });

  it('a player’s tier from their comfortable level against the unit’s stage', () => {
    expect(tierFor(null, 'mori')).toBeUndefined();
    expect(tierFor(2.9, 'mori')).toBe('easy');
    expect(tierFor(3.8, 'mori')).toBeUndefined();
    expect(tierFor(5.1, 'mori')).toBe('hard');
    expect(stageLevel('kawa')).toBe(3);
    expect(stageLevel('yama')).toBe(6);
    expect(lessonL('check')).toBe(3);
    expect(lessonOf(1)).toBe('deai');
  });

  it('the committed units (wave 1 and on): every lesson deals its 6 (fewer only from ladders), the same for a seed, the チェック held out', async () => {
    const ids = INDEX.paths.map((p) => p[0]);
    await load(...(ids as Unit[]));
    for (const id of ids) {
      const c = unitPart(id)!;
      for (const l of LESSONS) {
        if (!c.unit.lessons[l]) continue;
        const d = lessonDeck(c, l, 99);
        expect(d, `${id} ${l}`).toEqual(lessonDeck(c, l, 99));
        expect(d.length, `${id} ${l}`).toBe(Math.min(LESSON_QS, playIds(c, l).filter((x) => c.items.some((it) => it.id === x)).length));
        if (l !== 'jissen') expect(d.length, `${id} ${l}`).toBe(LESSON_QS);
        for (const it of d) expect(it.choices[it.answer], `${id} ${it.id}`).toBeDefined();
      }
      const heard = new Set([...(c.unit.lessons.deai ?? []), ...(c.unit.lessons.bamen ?? [])]);
      for (const it of lessonDeck(c, 'check', 5)) expect(heard.has(it.id)).toBe(false);
    }
  });
});

// ---- stamps -----------------------------------------------------------------------------------------------------------

let n = 0;
const at = (d: string) => `${d}T03:00:00.000Z`;
/** A lesson row of mine: `first` right on the first listen of 6 (the rest right after a replay, or wrong: `wrong`). */
function lessonRow(o: { d: string; l: number; first: number; wrong?: number; tm?: number; n?: number; u?: string }): EventRow {
  const ids = LESSON_IDS.check;
  const r: ListenRow['r'] = ids.map((id, i) => (i < o.first ? [id, 1, 0, 0] : i < o.first + (o.wrong ?? 0) ? [id, 0, 1, 0] : [id, 1, 0, 1]));
  const row: ListenRow = { d: o.d, g: `lg${String(++n).padStart(3, '0')}`, u: o.u ?? 'tr-testinn', l: o.l, ...(o.tm !== undefined && { tm: o.tm }), lv: 4, n: o.n ?? 1, ms: 150_000, r };
  return [at(o.d), 'A', `e${n}`, 'listen', JSON.stringify(row)];
}
/** The partner's summary of a row (contract/listen.ts: a stamp's unit and bit, never the answers). */
const partner = (d: string, stamped: boolean, who: 'B' | 'G' = 'B'): EventRow =>
  [at(d), who, `e${++n}`, 'listen', JSON.stringify({ d, g: `pg${n}`, n: 1, ms: 150_000, ...(stamped && { u: 'tr-testinn', stamped: 1 }) })];
const fold = (rows: EventRow[]) => {
  const { mine, others } = gamesOf(rows, 'A');
  return unitsOf(mine, others);
};

describe('stamps', () => {
  it('lesson dots from lesson rows; quick play never moves them; a lesson left mid-way isn’t a dot', () => {
    const quick: EventRow = [at('2026-11-01'), 'A', 'eq', 'listen', JSON.stringify({ d: '2026-11-01', g: 'quick01', lv: 4, n: 1, ms: 1, r: [['r4-leak', 1, 0, 0]] })];
    const half: EventRow = [at('2026-11-01'), 'A', 'eh', 'listen', JSON.stringify({ d: '2026-11-01', g: 'half01', u: 'tr-testinn', l: 2, lv: 4, n: 1, ms: 1, r: [['r4-triage', 1, 0, 0]] })];
    const s = fold([quick, half, lessonRow({ d: '2026-11-01', l: 1, first: 2 }), lessonRow({ d: '2026-11-02', l: 4, first: 6 })]).get('tr-testinn')!;
    expect(s.done).toEqual(['deai', 'oto']);
    expect(s.stamped).toBeNull();
    expect(s.tally).toBeNull();
  });

  it('a チェック stamps at ≥ 5 of my 6 on the first listen; 4 doesn’t (a replay isn’t a first listen); retakes never lock', () => {
    const four = fold([lessonRow({ d: '2026-11-01', l: 3, first: 4 })]).get('tr-testinn')!;
    expect(four.stamped).toBeNull();
    expect(four.tally).toEqual({ first: 4, of: 6 });
    expect(four.done).toEqual(['check']);
    const s = fold([lessonRow({ d: '2026-11-01', l: 3, first: 4 }), lessonRow({ d: '2026-11-02', l: 3, first: 5, wrong: 1 }), lessonRow({ d: '2026-11-03', l: 3, first: 1, wrong: 5 })]).get('tr-testinn')!;
    expect(s.stamped).toBe('2026-11-02');
    expect(s.tally).toEqual({ first: 5, of: 6 }); // the stamping row's, not a later worse one
  });

  it('a pair pass: one player 2/6 on their own, the team 5/6 (tm) — both rows stamp, each shows its own tally', () => {
    const low = fold([lessonRow({ d: '2026-11-03', l: 3, first: 2, wrong: 4, tm: 5, n: 2 })]).get('tr-testinn')!;
    expect(low.stamped).toBe('2026-11-03');
    expect(low.tally).toEqual({ first: 2, of: 6, tm: 5 });
    const short = fold([lessonRow({ d: '2026-11-03', l: 3, first: 2, wrong: 4, tm: 4, n: 2 })]).get('tr-testinn')!;
    expect(short.stamped).toBeNull();
    // tm on a lesson that isn't the チェック stamps nothing
    expect(fold([lessonRow({ d: '2026-11-03', l: 2, first: 6, tm: 6, n: 2 })]).get('tr-testinn')!.stamped).toBeNull();
  });

  it('the partner’s stamp from their summary; the double stamp when both have it; the guest’s rows count for nothing', () => {
    const theirs = fold([partner('2026-11-02', true)]).get('tr-testinn')!;
    expect(theirs).toMatchObject({ partner: true, stamped: null, double: false });
    const both = fold([partner('2026-11-02', true), lessonRow({ d: '2026-11-03', l: 3, first: 6 })]).get('tr-testinn')!;
    expect(both).toMatchObject({ partner: true, stamped: '2026-11-03', double: true });
    expect(fold([partner('2026-11-02', true, 'G'), lessonRow({ d: '2026-11-03', l: 3, first: 6 })]).get('tr-testinn')!.double).toBe(false);
    expect(fold([partner('2026-11-02', false)]).get('tr-testinn')).toBeUndefined();
  });

  it('the villager’s letter comes with my stamp (the stamping game’s), once; never with a pass short of it or the partner’s alone', async () => {
    const units = [{ id: 'tr-testinn', name: 'ホテルで こまった', host: 'diana' }];
    const texts = { 'tr-testinn': { en: 'Dear you…', ja: 'あなたへ…' } };
    const four = lessonRow({ d: '2026-11-01', l: 3, first: 4 });
    expect(lettersOf(units, fold([four]), texts)).toEqual([]);
    expect(lettersOf(units, fold([partner('2026-11-01', true)]), texts)).toEqual([]);
    const pass = lessonRow({ d: '2026-11-02', l: 3, first: 6 }), again = lessonRow({ d: '2026-11-04', l: 3, first: 6 });
    const states = fold([four, pass, again]);
    expect(states.get('tr-testinn')!.stampedIn).toBe(JSON.parse(pass[4]).g);
    expect(lettersOf(units, states, texts)).toEqual([{ unit: 'tr-testinn', name: 'ホテルで こまった', host: 'diana', day: '2026-11-02', en: 'Dear you…', ja: 'あなたへ…' }]);
    // a co-op pass stamps it too, so the letter comes
    expect(lettersOf(units, fold([lessonRow({ d: '2026-11-03', l: 3, first: 2, wrong: 4, tm: 5, n: 2 })]), texts)).toHaveLength(1);
    // no letter written, or the chunk not loaded: none
    expect(lettersOf(units, states, {})).toEqual([]);
    expect(lettersOf(units, states, undefined)).toEqual([]);
    // newest first; the build's letters chunk has every built unit's
    const two = [...units, { id: 'gl-clarify', name: 'ききかえす', host: 'brewster' }];
    const both = new Map([...states, ['gl-clarify', { ...states.get('tr-testinn')!, stamped: '2026-11-05' }]]);
    const built = await loadLetters();
    expect(Object.keys(built).sort()).toEqual(INDEX.paths.map((p) => p[0]).sort());
    expect(lettersOf(two, both, { ...built, ...texts }).map((l) => l.unit)).toEqual(['gl-clarify', 'tr-testinn']);
  });

  it('the recheck: due 30 days after the stamp, once; done by a solo チェック on or after that day', () => {
    const stamp = lessonRow({ d: '2026-10-01', l: 3, first: 6 });
    const s = fold([stamp]).get('tr-testinn')!;
    expect(RECHECK_DAYS).toBe(30);
    expect(s.recheck).toEqual({ due: '2026-10-31', done: false });
    const units = fold([stamp]);
    expect(rechecksDue(units, '2026-10-30')).toEqual([]);
    expect(rechecksDue(units, '2026-10-31')).toEqual(['tr-testinn']);
    // a チェック before it, or a co-op one on the day, doesn't do it; a solo one does, whatever its score (never takes the stamp)
    expect(rechecksDue(fold([stamp, lessonRow({ d: '2026-10-20', l: 3, first: 6 }), lessonRow({ d: '2026-11-02', l: 3, first: 6, n: 2 })]), '2026-11-03')).toEqual(['tr-testinn']);
    const done = fold([stamp, lessonRow({ d: '2026-11-02', l: 3, first: 1, wrong: 5 })]);
    expect(rechecksDue(done, '2026-12-25')).toEqual([]);
    expect(done.get('tr-testinn')!).toMatchObject({ stamped: '2026-10-01', recheck: { due: '2026-10-31', done: true } });
  });

  it('a unit lesson’s answers are kept whole (its own items aren’t in the index) and a joined-again lesson is one game', () => {
    const row = (g: string, r: ListenRow['r']): EventRow => [at('2026-11-04'), 'A', g + 'e', 'listen', JSON.stringify({ d: '2026-11-04', g, u: 'tr-testinn', l: 3, lv: 4, n: 1, ms: 1000, r })];
    const { mine } = gamesOf([row('jj01', [['tst-own-a', 1, 0, 0], ['tst-own-b', 1, 0, 0], ['r4-leak', 1, 0, 0]]), row('jj01', [['m4-easy', 1, 0, 0], ['n4-reference', 1, 0, 0], ['w4-youll-need', 1, 0, 0]])], 'A');
    expect(mine).toHaveLength(1);
    expect(mine[0].r.map((a) => a.id)).toContain('tst-own-a');
    expect(mine[0]).toMatchObject({ u: 'tr-testinn', l: 3, unit: { first: 6, of: 6, stamped: true } });
  });
});

// ---- the phrase ずかん -------------------------------------------------------------------------------------------------

const ans = (id: string, d: string, ok = true, rp = 0): Answer => ({ id, ok, rp, pick: 0, d, g: `p${d}`, lv: 4, p: false });

describe('the phrase ずかん', () => {
  const PH = [{ id: 'ph-a', in: ['i1', 'i2', 'i3', 'i4'] }, { id: 'ph-b', in: ['j1', 'j2', 'j3'] }];

  it('caught: right on the first listen in 3 different clips on ≥ 2 days', () => {
    expect([CAUGHT_CLIPS, CAUGHT_DAYS]).toEqual([3, 2]);
    const oneDay = phrasesOf(PH, [ans('i1', '2026-11-01'), ans('i2', '2026-11-01'), ans('i3', '2026-11-01')]).get('ph-a')!;
    expect(oneDay).toEqual({ heard: true, clips: 3, days: 1, caught: false });
    const sameClip = phrasesOf(PH, [ans('i1', '2026-11-01'), ans('i1', '2026-11-02'), ans('i2', '2026-11-02')]).get('ph-a')!;
    expect(sameClip.caught).toBe(false);
    const replayed = phrasesOf(PH, [ans('i1', '2026-11-01'), ans('i2', '2026-11-02'), ans('i3', '2026-11-02', true, 1)]).get('ph-a')!;
    expect(replayed.caught).toBe(false);
    const caught = phrasesOf(PH, [ans('i1', '2026-11-01'), ans('i2', '2026-11-02'), ans('i3', '2026-11-02', false), ans('i4', '2026-11-03')]).get('ph-a')!;
    expect(caught).toEqual({ heard: true, clips: 3, days: 3, caught: true });
    expect(phrasesOf(PH, []).get('ph-b')).toEqual({ heard: false, clips: 0, days: 0, caught: false });
  });

  it('the daily review: heard, not caught, due; a new clip of each; capped at 8 a day (those reviewed today count)', () => {
    const many = Array.from({ length: 12 }, (_, k) => ({ id: `ph-${k}`, in: [`a${k}`, `b${k}`, `c${k}`] }));
    // each missed once a week ago: due (box 0)
    const answers = many.map((p) => ans(p.in[0], '2026-10-29', false));
    const review = phraseReview(many, answers, '2026-11-05');
    expect(REVIEW_CAP).toBe(8);
    expect(review).toHaveLength(8);
    expect(review[0]).toEqual({ phrase: 'ph-0', item: 'a0' }); // missed: a0 not yet right first time
    // two reviewed today: 6 left, and those two aren't asked again today
    const today = [...answers, ans('a0', '2026-11-05'), ans('a1', '2026-11-05')];
    const left = phraseReview(many, today, '2026-11-05');
    expect(left).toHaveLength(6);
    expect(left.map((x) => x.phrase)).not.toContain('ph-0');
    // a right first listen moves on to a new clip; only playable items
    const right = phraseReview([many[2]], [ans('a2', '2026-10-20')], '2026-11-05');
    expect(right).toEqual([{ phrase: 'ph-2', item: 'b2' }]);
    expect(phraseReview([many[2]], [ans('a2', '2026-10-20')], '2026-11-05', new Set(['c2']))).toEqual([{ phrase: 'ph-2', item: 'c2' }]);
    // never heard or caught: not reviewed
    expect(phraseReview(PH, [], '2026-11-05')).toEqual([]);
  });
});
