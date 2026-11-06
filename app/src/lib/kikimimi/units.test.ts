// ききみみ's units (docs/curriculum-units.md, units.ts, compile.ts): the manifest's schema (good and bad), the checks
// against the bank (homes, references, the band, the lesson recipe, tiers, phrases, recycling, coverage), the compiled
// chunks and index entries (budgets, determinism), and the level decks, which no unit may change: the levels' chunks
// byte for byte with and without units, and a golden digest of seeds 0-99 per level.
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { beforeAll, describe, expect, it } from 'vitest';
import type { Item, Level } from './bank.ts';
import { CLIPS, WORDS } from './testdata.ts';
import { UNIT_MAX, checkUnitSources, compile, readUnits, type UnitSource } from './compile.ts';
import { DECK_SIZE, MIX, deck } from './deck.ts';
import { LADDERS } from './ladders.ts';
import { loadAll } from './pool.ts';
import { BANK } from './source.ts';
import {
  DOMAINS, LESSON_QS, PLANNED, SHORT_MAX, STAGES, WAVE1, candoProblems, candoText, checkUnits, lessonIds, manifestOf, type Stage
} from './units.ts';

type Raw = Record<string, unknown>;

const reply = (id: string, speaker: string, cast: string, en: string): Item =>
  ({ id, lv: 4, type: 'reply', en, ja: '（テスト）', speaker, voice: cast.slice(0, 2), cast, choices: ['Sure, no problem.', 'It was yesterday.', 'On the left.'], answer: 0 }) as unknown as Item;

/** A もり unit over the bank's hotel items (seed 3) and 5 new ones of its own: a fixture, never shipped. */
function hotel(): Raw {
  return {
    schema: 1, unit: 'tr-hotel', name: 'ホテルで こまった', stage: 'mori', domain: 'tabi', also: ['machi'], host: 'diana', scene: 'lobby', sound: 'self-repair',
    cando: {
      who: 'ホテルの スタッフ', does: 'へやの もんだいへの たいおうを せつめいする', cond: 'ロビーの ざつおんの なかで', catch: 'できる ことと ついかの りょうきん',
      short: 'ホテルの もんだいを ききとれる',
      en: 'I can follow hotel staff explaining what they can do about a room problem, over lobby noise, and catch the options and any extra charge.'
    },
    status: 'draft',
    ph: [
      { id: 'ph-im-afraid', en: "I'm afraid", ja: 'あいにく', register: 'service', scene: 'hotel desk', trap: 'こわい ではなく「あいにく」' },
      { id: 'ph-small-extra', en: 'a small charge', match: 'small (additional charge|supplement|fee)', register: 'service', scene: 'hotel desk', trap: 'small でも お金は かかる' }
    ],
    items: [
      reply('tst-wifi', 'julian', 'uk-m1', "I'm afraid the Wi-Fi's down on this floor. Try the lobby."),
      reply('tst-towels', 'saharah', 'au-f1', "Towels? I'll send some up. There's a small fee for extras, I'm afraid."),
      reply('tst-key', 'keaton', 'uk-m1', "Your key's not working? I'm afraid it's been wiped. Pop it on the reader."),
      reply('tst-noise', 'diana', 'uk-f1', "There's a small supplement for the quiet side, but it's lovely."),
      {
        id: 'tst-late-d', lv: 4, type: 'gist', en: 'x', ja: '（テスト）', speaker: 'diana', voice: 'uk', cast: 'uk-f1', choices: ['A later checkout.', 'A taxi.', 'A refund.'], answer: 0,
        lines: [
          { who: 'diana', cast: 'uk-f1', en: 'Checkout is at ten, I\'m afraid.', ja: 'チェックアウトは10時です。', tts: 'Checkout is at ten, I\'m afraid.' },
          { who: 'julian', cast: 'uk-m1', en: 'Could I stay till noon?', ja: '正午まで いられますか？' }
        ]
      }
    ],
    lessons: {
      v: 1,
      deai: ['d4-hotel-suite', 'r4-room-ready', 'm4-upgrade', 'ml-w-wont', 'tst-wifi', 'tst-towels'],
      bamen: ['dml-party-next-door', 'ml-m-quieter-room', 'r4-room-ready', 'm4-upgrade', 'tst-wifi', 'tst-towels'],
      check: ['ml-r-incidentals', 'ml-n-room', 'ml-n-late-checkout', 'tst-late-d', 'tst-key', 'tst-noise']
    },
    tiers: { 'r4-room-ready': { easy: { choices: ['OK, I can wait.', 'It is a big room.'], answer: 0 }, hard: { choices: ['Could I leave my bags, then?', 'Then I will be ready.', 'Is it quite big?', 'Not quite yet.'], answer: 0 } } }
  };
}

const src = (raw: Raw, file = `${raw.unit as string}.yaml`): UnitSource => ({ file, raw });
const errorsOf = (raw: Raw, file?: string) => manifestOf(raw, file ?? `${raw.unit as string}.yaml`).errors;
const unitOf = (raw: Raw) => manifestOf(raw, `${raw.unit as string}.yaml`).unit!;
const check = (raws: Raw[], clips?: Record<string, unknown>) => checkUnits(raws.map(unitOf), BANK, LADDERS, clips);

describe('units: the manifest', () => {
  it('a good one reads, with its can-do as one sentence', () => {
    expect(errorsOf(hotel())).toEqual([]);
    const u = unitOf(hotel());
    expect(candoText(u.cando)).toBe('ホテルの スタッフが へやの もんだいへの たいおうを せつめいするのを ロビーの ざつおんの なかで きいて、できる ことと ついかの りょうきんが わかる');
    expect(lessonIds(u)).toHaveLength(14);
  });

  it('refuses each bad field', () => {
    const bad: [string, (r: Raw) => void, RegExp][] = [
      ['unknown key', (r) => (r.extra = 1), /unknown key extra/],
      ['schema', (r) => (r.schema = 2), /schema/],
      ['id too long', (r) => (r.unit = 'tr-hotelrooms'), /unit/],
      ['id with no domain prefix', (r) => (r.unit = 'hotel'), /unit/],
      ['name long', (r) => (r.name = 'ホテルで とても こまった こと'), /name/],
      ['name レッスン', (r) => (r.name = 'ホテルの レッスン'), /name/],
      ['stage', (r) => (r.stage = 'S2'), /stage/],
      ['domain', (r) => (r.domain = 'travel'), /domain/],
      ['also its own domain', (r) => (r.also = ['tabi']), /also/],
      ['host', (r) => (r.host = 'nobody'), /host/],
      ['sound from another stage', (r) => (r.sound = 'l-r'), /sound/],
      ['status', (r) => (r.status = 'done'), /status/],
      ['no phrases', (r) => (r.ph = []), /ph:/],
      ['phrase id', (r) => ((r.ph as Raw[])[0].id = 'im-afraid'), /phrase/],
      ['phrase twice', (r) => (r.ph as Raw[]).push({ ...(r.ph as Raw[])[0] }), /twice/],
      ['phrase register', (r) => ((r.ph as Raw[])[0].register = 'posh'), /register/],
      ['phrase trap long', (r) => ((r.ph as Raw[])[0].trap = 'あ'.repeat(41)), /trap/],
      ['phrase match', (r) => ((r.ph as Raw[])[1].match = '(('), /regex/],
      ['item speaker', (r) => ((r.items as Raw[])[0].speaker = 'nobody'), /speaker/],
      ['item answer', (r) => ((r.items as Raw[])[0].answer = 5), /answer/],
      ['item tts digit', (r) => ((r.items as Raw[])[0].tts = 'at 10'), /tts/],
      ['item digit, no tts', (r) => ((r.items as Raw[])[0].en = 'Room 512.'), /digit/],
      ['dialogue without lines', (r) => delete (r.items as Raw[])[4].lines, /lines/],
      ['line cast', (r) => (((r.items as Raw[])[4].lines as Raw[])[1].cast = 'xx'), /line 2/],
      ['no recipe version', (r) => delete (r.lessons as Raw).v, /lessons\.v/],
      ['an unknown recipe', (r) => ((r.lessons as Raw).v = 9), /lessons\.v/],
      ['no check', (r) => delete (r.lessons as Raw).check, /core lesson/],
      ['short lesson', (r) => ((r.lessons as Raw).bamen = ['r4-room-ready']), /at least 6/],
      ['an id twice', (r) => ((r.lessons as Raw).deai = [...((r.lessons as Raw).deai as string[]).slice(0, 5), 'r4-room-ready']), /twice/],
      ['unknown lesson', (r) => ((r.lessons as Raw).quiz = []), /unknown lesson/],
      ['tier shape', (r) => ((r.tiers as Raw)['r4-room-ready'] = { easy: { choices: ['a'], answer: 0 } }), /tiers/],
      ['tier answer', (r) => ((r.tiers as Raw)['r4-room-ready'] = { hard: { choices: ['a', 'b'], answer: 2 } }), /tiers/],
      ['tier key', (r) => ((r.tiers as Raw)['r4-room-ready'] = { medium: { choices: ['a', 'b'], answer: 0 } }), /tiers/]
    ];
    for (const [what, edit, want] of bad) {
      const r = hotel();
      edit(r);
      const errs = errorsOf(r);
      expect(errs.some((e) => want.test(e)), `${what}: ${errs.join('; ')}`).toBe(true);
    }
    expect(errorsOf(hotel(), 'other.yaml').some((e) => /file's name/.test(e))).toBe(true);
    expect(errorsOf(null as unknown as Raw, 'x.yaml')).toEqual(['x.yaml: not a unit']);
  });

  it('the can-do follows the template', () => {
    const c = (hotel().cando as Raw);
    expect(candoProblems(c)).toEqual([]);
    expect(candoProblems({ ...c, who: 'ホテルの スタッフが' })).toEqual(['cando.who: the template adds が']);
    expect(candoProblems({ ...c, does: 'せつめいするのを' })).toEqual(['cando.does: the template adds のを']);
    expect(candoProblems({ ...c, cond: 'ロビーで きいて' })).toEqual(['cando.cond: the template adds きいて']);
    expect(candoProblems({ ...c, catch: 'りょうきんが わかる' })).toEqual(['cando.catch: the template adds が わかる']);
    expect(candoProblems({ ...c, catch: '' })).toEqual(['cando.catch: missing']);
    expect(candoProblems({ ...c, en: 'I understand hotel staff.' })).toHaveLength(1);
    expect(candoProblems({ ...c, en: 'I can follow hotel staff on the phone and catch the price.' })).toHaveLength(1); // no condition clause
    expect(candoProblems({ ...c, mood: 'x' })).toEqual(['cando: unknown key mood']);
    expect(candoProblems('a sentence')).toHaveLength(1);
  });

  it('the can-do’s one line (short): ≤ 25 characters, one line, no 。 or 、; optional in a draft, required past it', () => {
    const c = (hotel().cando as Raw);
    const msg = `cando.short: one line, ≤ ${SHORT_MAX} characters, no 。 or 、`;
    expect(candoProblems({ ...c, short: 'あ'.repeat(SHORT_MAX) })).toEqual([]);
    expect(candoProblems({ ...c, short: 'あ'.repeat(SHORT_MAX + 1) })).toEqual([msg]);
    expect(candoProblems({ ...c, short: 'ホテルの もんだいを ききとれる。' })).toEqual([msg]);
    expect(candoProblems({ ...c, short: 'ホテルの もんだい、\nききとれる' })).toEqual([msg]);
    expect(candoProblems({ ...c, short: '' })).toEqual([msg]);
    const without = () => {
      const r = hotel();
      delete (r.cando as Raw).short;
      return r;
    };
    expect(errorsOf(without())).toEqual([]);
    for (const status of ['voiced', 'listened']) {
      expect(errorsOf({ ...without(), status })).toEqual([`tr-hotel.yaml: cando.short: the one line, required once ${status}`]);
      expect(errorsOf({ ...hotel(), status })).toEqual([]);
    }
  });
});

describe('units: against the bank', () => {
  it('a good one: homes for its own and the bank’s lesson items, the phrases found, no errors', () => {
    const c = check([hotel()]);
    expect(c.errors).toEqual([]);
    expect(c.home.get('r4-room-ready')).toBe('tr-hotel');
    expect(c.home.get('tst-late-d')).toBe('tr-hotel');
    expect(c.phraseIn.get('ph-im-afraid')!.items).toEqual(expect.arrayContaining(['r4-room-ready', 'tst-wifi', 'tst-late-d']));
    expect(c.phraseIn.get('ph-small-extra')!.items).toEqual(expect.arrayContaining(['m4-upgrade', 'd4-hotel-suite', 'tst-towels', 'tst-noise']));
    expect(c.phraseIn.get('ph-im-afraid')!.voices.length).toBeGreaterThanOrEqual(2);
  });

  it('each item has one home; review reuses without one', () => {
    const other: Raw = { ...hotel(), unit: 'tr-hotel2', ph: [{ id: 'ph-other', en: 'upgrade', register: 'service', scene: 'desk', trap: 'x' }], items: [], tiers: undefined };
    other.lessons = { v: 1, deai: ['d4-hotel-suite', 'r4-room-ready', 'm4-upgrade', 'ml-w-wont', 'ml-n-room', 'ml-r-incidentals'], bamen: ['d4-hotel-suite', 'r4-room-ready', 'm4-upgrade', 'ml-w-wont', 'ml-n-room', 'ml-r-incidentals'], check: ['dml-party-next-door', 'ml-m-quieter-room', 'ml-n-late-checkout', 'r4-lunch', 'r4-store-credit', 'm4-be-good'] };
    delete other.tiers;
    expect(check([hotel(), other]).errors.some((e) => /tr-hotel2: d4-hotel-suite: its home is tr-hotel already/.test(e))).toBe(true);
    const reviewing = { ...other, review: ['d4-hotel-suite', 'r4-room-ready', 'm4-upgrade', 'ml-w-wont', 'ml-n-room', 'ml-r-incidentals', 'dml-party-next-door', 'ml-m-quieter-room', 'ml-n-late-checkout'] };
    expect(check([hotel(), reviewing]).errors.filter((e) => /home/.test(e))).toEqual([]);
    expect(check([hotel(), { ...reviewing, review: [...reviewing.review, 'ml-w-gonna-x'] }]).errors.some((e) => /review ml-w-gonna-x: in no lesson/.test(e))).toBe(true);
    expect(check([{ ...hotel(), review: ['tst-wifi'] }]).errors.some((e) => /the unit's own item/.test(e))).toBe(true);
  });

  it('references, ids, the band, the recipe and the tiers', () => {
    const errs = (edit: (r: Raw) => void) => {
      const r = hotel();
      edit(r);
      expect(errorsOf(r), 'the manifest reads').toEqual([]);
      return check([r]).errors;
    };
    const L = (r: Raw) => r.lessons as Record<string, string[]>;
    expect(errs((r) => (L(r).check[0] = 'no-such-item'))).toContain('tr-hotel: lessons.check: no-such-item isn\'t an item');
    expect(errs((r) => ((r.items as Raw[])[0].id = 'r4-lunch'))).toEqual(expect.arrayContaining([expect.stringMatching(/item r4-lunch: the id is taken/)]));
    expect(errs((r) => (L(r).check[0] = 'p1-squid')).some((e) => /level 1\) is more than a step from mori/.test(e))).toBe(true);
    expect(errs((r) => (L(r).deai = ['r4-room-ready', 'm4-upgrade', 'ml-w-wont', 'tst-wifi', 'tst-towels', 'ml-m-quieter-room']))).toContain('tr-hotel: lessons.deai: needs a model dialogue (gist or next)');
    expect(errs((r) => (L(r).check[0] = 'r4-room-ready')).some((e) => /held out/.test(e))).toBe(true);
    expect(errs((r) => (L(r).oto = ['r4-room-ready', 'm4-upgrade', 'tst-wifi', 'tst-towels', 'tst-key', 'ml-w-wont']))).toContain('tr-hotel: lessons.oto: mostly word items (chunks in connected speech)');
    expect(errs((r) => (L(r).jissen = LADDERS.slice(0, 2).map((l) => l.id).concat(['r4-room-ready', 'm4-upgrade', 'tst-wifi', 'tst-towels'])))).toEqual([]);
    expect(errs((r) => (L(r).jissen = [LADDERS[0].rungs[0].id, 'r4-room-ready', 'm4-upgrade', 'tst-wifi', 'tst-towels', 'ml-w-wont'])).some((e) => /a rung: name its ladder/.test(e))).toBe(true);
    expect(errs((r) => ((r.tiers as Raw)['r4-lunch'] = { easy: { choices: ['a', 'b'], answer: 0 } }))).toContain("tr-hotel: tiers.r4-lunch: not one of the unit's lesson items");
  });

  it('the check needs 2 voices', () => {
    const r = hotel();
    const one = ['tst-a', 'tst-b', 'tst-c', 'tst-d', 'tst-e', 'tst-f'];
    r.items = [...(r.items as Item[]), ...one.map((id) => reply(id, 'diana', 'uk-f1', "I'm afraid not."))];
    (r.lessons as Raw).check = one;
    expect(check([r]).errors).toContain('tr-hotel: lessons.check: at least 2 voices');
  });

  it('a unit past draft needs every clip', () => {
    expect(check([{ ...hotel(), status: 'voiced' }], CLIPS).errors.some((e) => /tst-wifi: no clip, but the unit is voiced/.test(e))).toBe(true);
    expect(check([hotel()], CLIPS).errors).toEqual([]);
  });

  it('a phrase in < 3 items or < 2 voices: a warning in a draft, an error past it', () => {
    const r = hotel();
    (r.ph as Raw[]).push({ id: 'ph-rare', en: 'elevators are on your left', register: 'service', scene: 'desk', trap: 'elevator＝エレベーター' });
    expect(check([r]).warnings).toContain('tr-hotel: phrase ph-rare is in 1 items by 1 voices (needs 3 by 2)');
    expect(check([{ ...r, status: 'voiced' }]).errors).toContain('tr-hotel: phrase ph-rare is in 1 items by 1 voices (needs 3 by 2)');
  });
});

/** `n` synthetic units of a stage over its level's items, every bank item under review (no homes), one phrase each,
 *  spread over the domains. */
function synthetic(stage: Stage, n: number, from = 0, status = 'draft'): Raw[] {
  const lv = ({ hama: 3, kawa: 4, mori: 4, yama: 6, hoshi: 7 } as const)[stage];
  const pool = BANK.filter((it) => it.lv === lv);
  const dialogues = pool.filter((it) => it.lines), singles = pool.filter((it) => !it.lines);
  return Array.from({ length: n }, (_, k) => {
    const i = from + k, take = (j: number) => singles[(i * 7 + j) % singles.length].id;
    const deai = [dialogues[i % dialogues.length].id, take(0), take(1), take(2), take(3), take(4)];
    const check = [take(5), take(6), take(7), take(8), take(9), take(10)].filter((id) => !deai.includes(id));
    while (check.length < LESSON_QS) check.push(singles.find((it) => !deai.includes(it.id) && !check.includes(it.id))!.id);
    return {
      schema: 1, unit: `fr-${stage.slice(0, 2)}${String(i).padStart(3, '0')}`, name: `よていを かえる${i % 10}`, stage, domain: DOMAINS[i % DOMAINS.length], host: 'diana',
      scene: 'cafe', sound: STAGES[stage].sounds[0], status, cando: { ...(hotel().cando as Raw), short: `${['よていの へんこうが', 'ホテルの もんだいを', 'ざつだんの わだいが'][i % 3]} わかる${i}` },
      ph: [{ id: `ph-${stage}-${i}`, en: 'the', register: 'friend', scene: 'cafe', trap: 'テスト' }],
      review: [...new Set([...deai, ...check])], lessons: { v: 1, deai, bamen: deai, check }
    };
  });
}

describe('units: recycling and coverage', () => {
  it('recycling: a warning till wave 1 is past draft, then an error', () => {
    const units = synthetic('mori', 3);
    // a lower stage's phrase the mori units never use
    const low = synthetic('kawa', 1).map((r) => ({ ...r, ph: [{ id: 'ph-low', en: 'zzz never said', register: 'friend', scene: 'cafe', trap: 'テスト' }] }));
    const c = check([...units, ...low]);
    expect(c.recycled.get('fr-mo000')).toEqual({ n: 0, of: 12 });
    expect(c.warnings.some((e) => /fr-mo000: 0 of 12 items reuse/.test(e))).toBe(true);
    const many = [...units, ...low, ...synthetic('yama', WAVE1, 0)].map((r) => ({ ...r, status: 'listened' }));
    expect(check(many).errors.some((e) => /fr-mo000: 0 of 12 items reuse/.test(e))).toBe(true);
    // a mori unit whose phrase is a kawa unit's: recycled
    const reuse = { ...low[0], ph: [{ id: 'ph-low', en: 'the', register: 'friend', scene: 'cafe', trap: 'テスト' }] };
    expect(check([...units, reuse]).recycled.get('fr-mo000')!.n).toBeGreaterThan(0);
  });

  it('coverage: ≥ 7 of 9 domains a stage, none over 25 %: warnings till the stage has its planned units, then errors', () => {
    const few = synthetic('mori', 4).map((r) => ({ ...r, domain: 'tabi' }));
    const c = check(few);
    expect(c.coverage.get('mori')).toEqual({ units: 4, glue: 0, domains: { tabi: 4 } });
    expect(c.warnings).toEqual(expect.arrayContaining(['mori: 1 of 9 domains (needs 7)', 'mori: tabi is 4 of 4 units (over 25 %)']));
    const full = synthetic('mori', PLANNED.mori).map((r) => ({ ...r, domain: 'tabi' }));
    expect(check(full).errors).toEqual(expect.arrayContaining(['mori: 1 of 9 domains (needs 7)']));
    const spread = synthetic('mori', PLANNED.mori);
    const s = check(spread);
    expect(s.errors.filter((e) => /^mori:/.test(e))).toEqual([]);
    expect(Object.keys(s.coverage.get('mori')!.domains)).toHaveLength(9);
  });
});

describe('units: compiled', () => {
  const sources = [src(hotel())];
  const withUnits = compile(CLIPS, WORDS, sources);
  const without = compile(CLIPS, WORDS, []);

  it('app/content/units checks (the committed manifests: wave 1’s, as written)', () => {
    expect(checkUnitSources(readUnits(), CLIPS).errors).toEqual([]);
  });

  it('a unit is a chunk of its own and an index entry; the levels’ chunks are byte for byte as without it', () => {
    const chunk = JSON.parse(withUnits.get('parts/u-tr-hotel.json')!);
    expect(chunk.unit).toMatchObject({ id: 'tr-hotel', stage: 'mori', domain: 'tabi', status: 'draft', home: expect.arrayContaining(['r4-room-ready', 'tst-late-d']) });
    expect(chunk.unit.cando.ja).toMatch(/きいて、.*が わかる$/);
    expect(chunk.unit.cando.short).toBe('ホテルの もんだいを ききとれる');
    expect(chunk.unit.ph[0].in).toEqual(expect.arrayContaining(['r4-room-ready']));
    expect(chunk.items.map((it: Item) => it.id)).toEqual(lessonIds(unitOf(hotel())));
    expect(chunk.items.find((it: Item) => it.id === 'r4-room-ready')).toEqual(BANK.find((it) => it.id === 'r4-room-ready'));
    expect(Object.keys(chunk.clips)).toContain('r4-room-ready');
    expect(gzipSync(withUnits.get('parts/u-tr-hotel.json')!).length).toBeLessThanOrEqual(UNIT_MAX);
    for (const [path, text] of without) if (path !== 'index.json') expect(withUnits.get(path) === text, path).toBe(true);
    const a = JSON.parse(withUnits.get('index.json')!), b = JSON.parse(without.get('index.json')!);
    expect(a.paths).toEqual([['tr-hotel', 'ホテルで こまった', 'mori', 'tabi', 'diana', 'draft', 7, 'ホテルの もんだいを ききとれる']]);
    expect(a.units['tr-hotel']).toEqual({ parts: ['u-tr-hotel'], n: 14, cv: expect.stringMatching(/^[0-9a-f]{6}$/) });
    delete a.units['tr-hotel'];
    expect({ ...a, paths: [] }).toEqual(b);
  });

  it('a draft with no one line: no short in its chunk or its path line', () => {
    const r = hotel();
    delete (r.cando as Raw).short;
    const files = compile(CLIPS, WORDS, [src(r)]);
    expect(JSON.parse(files.get('parts/u-tr-hotel.json')!).unit.cando).not.toHaveProperty('short');
    expect(JSON.parse(files.get('index.json')!).paths[0]).toHaveLength(7);
  });

  it('deterministic, and a failing unit stops the compiler', () => {
    expect(compile(CLIPS, WORDS, sources)).toEqual(withUnits);
    expect(() => compile(CLIPS, WORDS, [src({ ...hotel(), host: 'nobody' })])).toThrow(/host nobody/);
  });

  it('budgets: a unit’s chunk ≤ 20 KB gzipped; the path index ≤ 12 KB gzipped at 200 units', () => {
    const many = [...synthetic('kawa', 50), ...synthetic('mori', 50), ...synthetic('yama', 50), ...synthetic('hoshi', 50)].map((r) => src(r));
    const files = compile(CLIPS, WORDS, many);
    const index = JSON.parse(files.get('index.json')!);
    const ids = many.map((s) => (s.raw as Raw).unit as string);
    expect(index.paths).toHaveLength(200);
    const pathIndex = JSON.stringify({ paths: index.paths, units: Object.fromEntries(ids.map((id) => [id, index.units[id]])) });
    expect(gzipSync(pathIndex).length).toBeLessThanOrEqual(12 * 1024);
    for (const id of ids) expect(gzipSync(files.get(`parts/u-${id}.json`)!).length, id).toBeLessThanOrEqual(UNIT_MAX);
  });
});

describe('units: the level decks never change', () => {
  beforeAll(loadAll);
  it('seeds 0-99 per level as the golden digest (a re-tagging commit must not change it; a deliberate content change: vitest -u)', async () => {
    const levels = Object.keys(MIX).map(Number) as Level[];
    const digest = Object.fromEntries(levels.map((lv) => {
      const decks = Array.from({ length: 100 }, (_, seed) => deck(seed, lv).map((it) => [it.id, it.choices, it.answer]));
      expect(decks.every((d) => d.length === DECK_SIZE || d.length === 0)).toBe(true);
      return [lv, createHash('sha256').update(JSON.stringify(decks)).digest('hex')];
    }));
    await expect(`${JSON.stringify(digest, null, 1)}\n`).toMatchFileSnapshot('./decks.golden.json');
  });
});
