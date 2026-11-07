import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROSTER } from '#lib/villagers/roster.ts';
import { villagerArt } from '#lib/art.ts';
import { DIALOGUE_TYPES, PIC_JA, channelOf, clipIds, helpProblems, isDialogue, jaLines, shuffleChoices, splitFocus, type Item, type ItemType, type Level } from './bank.ts';
import { mulberry32 } from '#lib/random.ts';
import { AUTHORED as BANK, BANK as PLAYED } from './source.ts';
import { CAST, EXPOSURE } from './cast.ts';
import { LEVELS, MIX } from './deck.ts';
import { mixes, readListen, readPacks, readStories, unitItems } from './compile.ts';
import { listenClipItems } from './listen.ts';
import { clipPlaces, packFile } from './packing.ts';
import type { Clip } from './clips.ts';
import clipsJson from './clips.json';
import { DIALOGUES } from './dialogues.ts';
import { RUNG_ITEMS } from './ladders.ts';
import { storyItems } from './story.ts';

const CLIPS: Readonly<Record<string, Clip>> = clipsJson;
/** Where each clip ships: its pack and its slow pack (packs.json; packing.test checks the bytes). */
const PACKS = readPacks();
const PLACES = clipPlaces(PACKS);
/** The units' own items (app/content/units/*.yaml), voiced beside the bank's (their units' status: units.test). */
const UNIT_ITEMS = unitItems();
/** The bedtime stories' segments, a clip each (story.ts; stories.test checks them). */
const STORY_IDS = new Set(storyItems(readStories()).map((it) => it.id));
/** The listening kinds' clips (content/listen/*.yaml: a tile's own, each line of a call or a たちぎき), drafts included
 *  once voiced (they're voiced before the listening check: wave 2 §3.4). */
const LISTEN_IDS = new Set(readListen().flatMap(({ raw }) => listenClipItems(raw)).map((it) => it.id));

const STATIC = join(import.meta.dirname, '../../../static');
const words = (s: string) => s.toLowerCase().match(/[a-z0-9',]+/g) ?? [];
const has = (en: string, phrase: string) => ` ${words(en).join(' ')} `.includes(` ${words(phrase).join(' ')} `);
/** A clip's length cap by level (s): 8 a line at levels 1-3, 10 at level 4 (もり's numbers inside talk run to 9.7 s,
 *  2026-11-06); a PA's chime and hall add ~3; the アナウンス pack's announcements 18; やま's denser turns 11; ほし's 2-4
 *  sentences (news, talks, a lecture's point) 22. */
const clipCap = (it: Item): number => {
  const pa = channelOf(it) === 'pa' ? 3 : 0;
  return it.lv === 5 ? 18 : it.lv === 7 ? 22 + pa : it.lv === 6 ? 11 + pa : it.lv === 4 ? 10 + pa : 8 + pa;
};

describe('kikimimi bank', () => {
  it('the Japanese help (cja, why, ctx): cja one per choice and no English, why ≤ 90 字, ctx one line ≤ 30 字', () => {
    for (const it of [...BANK, ...UNIT_ITEMS]) expect(helpProblems(it), it.id).toEqual([]);
    const ok = { choices: ['a', 'b', 'c'], cja: ['あ', '15ドル', 'う'], why: '「gonna」は going to です。', ctx: 'カフェで、店員が 話しかけてきました' };
    expect(helpProblems(ok)).toEqual([]);
    expect(helpProblems({ ...ok, cja: ['あ', 'い'] })).toEqual(['cja: 2 for 3 choices']);
    expect(helpProblems({ ...ok, cja: ['あ', 'い', 'OK'] })).toEqual(['cja: English in 「OK」']);
    expect(helpProblems({ ...ok, cja: ['あ', '', 'う'] })).toHaveLength(1);
    expect(helpProblems({ ...ok, why: 'あ'.repeat(91) })).toHaveLength(1);
    expect(helpProblems({ ...ok, why: 'It is the answer.' })).toHaveLength(1);
    expect(helpProblems({ ...ok, ctx: 'あ'.repeat(31) })).toHaveLength(1);
    expect(helpProblems({ ...ok, ctx: 'カフェで\n店員が' })).toHaveLength(1);
  });

  it('shuffleChoices keeps cja aligned with the choices; another choice set brings its own or none', () => {
    const it0 = { ...BANK.find((it) => it.type === 'reply')!, choices: ['A', 'B', 'C', 'D'], answer: 2, cja: ['あ', 'い', 'う', 'え'] } as Item;
    const ja: Record<string, string> = { A: 'あ', B: 'い', C: 'う', D: 'え' };
    const orders = new Set<string>();
    for (let seed = 0; seed < 20; seed++) {
      const s = shuffleChoices(it0, mulberry32(seed));
      orders.add(s.choices.join(''));
      expect(s.cja, String(seed)).toEqual(s.choices.map((c) => ja[c]));
      expect(s.choices[s.answer]).toBe('C');
    }
    expect(orders.size).toBeGreaterThan(1);
    expect(shuffleChoices(it0, mulberry32(1), { choices: ['X', 'Y'], answer: 0 }).cja).toBeUndefined();
    const tier = shuffleChoices(it0, mulberry32(1), { choices: ['X', 'Y'], answer: 0, cja: ['エックス', 'ワイ'] });
    expect(tier.cja).toEqual(tier.choices.map((c) => (c === 'X' ? 'エックス' : 'ワイ')));
    const { cja: _, ...plain } = it0;
    expect('cja' in shuffleChoices(plain, mulberry32(1))).toBe(false);
  });

  it('has unique, file-safe ids', () => {
    const ids = BANK.map((it) => it.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('has at least 40 items per level, enough of each type for a game', () => {
    // the fixed counts, as written: levels 1-3's first bank; level 4 bank4.ts 67 + dialogues.ts 24 + もり's 85 + 85 + the
    // variety set's 36 (content/); level 5 the アナウンス pack; 6 やま's 100 + 100 + the variety set's 36; 7 ほし's 115
    const count = (lv: Level) => BANK.filter((it) => it.lv === lv).length;
    expect([1, 2, 3, 4, 5, 6, 7].map((lv) => count(lv as Level))).toEqual([46, 49, 49, 297, 30, 236, 115]);
    expect(count(8)).toBe(0);
    for (const lv of [1, 2, 3, 4, 6, 7] as Level[]) {
      const items = BANK.filter((it) => it.lv === lv);
      expect(items.length, `level ${lv}`).toBeGreaterThanOrEqual(40);
      const n = (t: ItemType) => items.filter((it) => it.type === t).length;
      // each type a game draws (dialogues too, once voiced): 3× what one game takes at least (variety between games); the
      // others none
      const mix = { ...MIX[lv]!, ...mixes(Object.fromEntries(BANK.flatMap((it) => clipIds(it)).map((id) => [id, {}])))[lv]! };
      for (const [t, k] of Object.entries(mix) as [ItemType, number][])
        if (k) expect(n(t), `level ${lv} ${t}`).toBeGreaterThanOrEqual(Math.max(6, 3 * k));
        else expect(n(t), `level ${lv} ${t}`).toBe(0);
    }
    // level 5, the アナウンス pack: 30 items, each type it draws 3× a game's at least
    const pack = BANK.filter((it) => it.lv === 5);
    expect(pack).toHaveLength(30);
    for (const [t, k] of Object.entries(MIX[5]!) as [ItemType, number][]) expect(pack.filter((it) => it.type === t).length, t).toBeGreaterThanOrEqual(Math.max(6, 3 * k));
    expect(new Set(pack.map((it) => it.type))).toEqual(new Set(Object.keys(MIX[5]!)));
  });

  it("every speaker is a roster villager with art, never the host (しずえ)", () => {
    for (const it of BANK) {
      expect(ROSTER[it.speaker], it.id).toBeDefined();
      expect(villagerArt(it.speaker, true), it.id).not.toBeNull();
      expect(it.speaker).not.toBe('isabelle');
    }
  });

  // A villager named in the clip is named in the Japanese as heard: the English name in katakana (EN_KANA), not their
  // Japanese game name when it differs (p1-guitar's "Raymond" was 「ジャック」). The special characters (しずえ,
  // たぬきち…) keep the names the players know them by.
  const EN_KANA: Record<string, string> = { Raymond: 'レイモンド', Sydney: 'シドニー', Bunnie: 'バニー', Tom: 'トム', Ken: 'ケン' };
  it('a villager named in the English is named in the Japanese as heard', () => {
    const named = Object.values(ROSTER).map((r) => ({ ...r, re: new RegExp(`\\b${r.nameEn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`) }));
    for (const it of BANK) {
      // (a dialogue: each line's Japanese)
      const pairs = isDialogue(it) ? it.lines.map((l) => [l.en, l.ja]) : [[it.type === 'reply' ? `${it.en} ${it.choices[it.answer]}` : it.en, it.ja]];
      for (const [heard, ja] of pairs)
        for (const r of named.filter((r) => r.re.test(heard))) {
          const kana = r.special ? r.nameJa : EN_KANA[r.nameEn];
          expect(kana, `${it.id}: add ${r.nameEn}'s katakana to EN_KANA`).toBeTruthy();
          expect(ja, `${it.id}: ${r.nameEn}`).toContain(kana);
          if (!r.special && r.nameJa !== kana) expect(ja, `${it.id}: ${r.nameEn} is heard, not ${r.nameJa}`).not.toContain(r.nameJa);
        }
    }
  });

  it('accent policy (docs/curriculum.md "American English first"): US only at はまべ, かわ, もり (levels 1-5) and in every unit; at most 10% of やま and of ほし (6, 7) UK or AU, each item tagged accent-exposure', () => {
    const accents = (it: Item) => (isDialogue(it) ? it.lines.map((l) => l.cast.slice(0, 2)) : [it.voice]);
    const foreign = (it: Item) => accents(it).some((a) => a !== 'us');
    const tagged = (it: Item) => it.tags?.features?.includes('accent-exposure') ?? false;
    for (const it of [...BANK.filter((it) => it.lv <= 5), ...UNIT_ITEMS]) {
      expect(foreign(it) ? accents(it).join('+') : 'us', `${it.id}: American only below やま and in units`).toBe('us');
      expect(tagged(it), `${it.id}: accent exposure only at やま and ほし`).toBe(false);
    }
    // a unit's voices are its villagers' own (CAST), as everywhere else
    for (const it of UNIT_ITEMS) {
      if (it.cast) expect(it.cast, it.id).toBe(CAST[it.speaker]);
      for (const l of it.lines ?? []) expect(l.cast, `${it.id}: ${l.who}`).toBe(CAST[l.who]);
    }
    for (const lv of [6, 7] as Level[]) {
      const items = BANK.filter((it) => it.lv === lv), out = items.filter(foreign);
      expect(out.length / items.length, `level ${lv}: the UK/AU share`).toBeLessThanOrEqual(0.1);
      for (const it of out) expect(tagged(it), `${it.id}: UK/AU only as tagged accent exposure`).toBe(true);
      for (const it of items.filter(tagged)) expect(foreign(it), `${it.id}: tagged but all US (its speaker needs an EXPOSURE voice)`).toBe(true);
    }
    // every EXPOSURE villager speaks in an exposure item (no stale entries)
    const speaks = (it: Item, w: string) => (isDialogue(it) ? it.lines.some((l) => l.who === w) : it.speaker === w);
    expect(Object.keys(EXPOSURE).filter((w) => !BANK.some((it) => tagged(it) && speaks(it, w)))).toEqual([]);
  });

  it('splitFocus and jaLines: the focus marked in place; a reply on two lines, the question, then → the reply', () => {
    expect(splitFocus({ en: 'I got a squid!', focus: 'squid' })).toEqual(['I got a ', 'squid', '!']);
    expect(splitFocus({ en: 'Hello.', focus: 'bye' })).toEqual(['Hello.', '', '']);
    expect(splitFocus({ en: 'Hello.' })).toEqual(['Hello.', '', '']);
    for (const it of BANK) {
      expect(splitFocus(it).join(''), it.id).toBe(it.en);
      // (a single-clip gist, level 5's, too: its answer on the second line; ほし's single gists and nexts show their
      // transcript only, the answer in English beside it)
      const lines = jaLines(it), two = it.type === 'reply' || it.type === 'mean' || (it.type === 'gist' && it.lv === 5);
      expect(lines.length, it.id).toBe(two ? 2 : 1);
      if (it.type === 'reply') expect(lines[1], it.id).toMatch(/^→ 「.+」$/);
      expect(it.ja.split('→').length, it.id).toBe(two ? 2 : 1);
    }
  });

  it('answers are in range, choices distinct, counts per type', () => {
    const count: Record<ItemType, number> = { pic: 4, word: 3, num: 3, reply: 3, mean: 3, gist: 3, next: 3 };
    for (const it of BANK) {
      expect(it.choices.length, it.id).toBe(count[it.type]);
      expect(new Set(it.choices).size, it.id).toBe(it.choices.length);
      expect(it.answer, it.id).toBeGreaterThanOrEqual(0);
      expect(it.answer, it.id).toBeLessThan(it.choices.length);
      expect(it.en.trim(), it.id).toBe(it.en);
      expect(it.ja.length, it.id).toBeGreaterThan(0);
    }
  });

  it('a word item: its answer word and its focus are in the sentence, the other choices are not', () => {
    for (const it of BANK.filter((it) => it.type === 'word')) {
      expect(it.focus, it.id).toBeDefined();
      expect(has(it.en, it.focus!), it.id).toBe(true);
      expect(has(it.en, it.choices[it.answer]), it.id).toBe(true);
      expect(words(it.focus!)).toEqual(words(it.choices[it.answer]));
      for (const [i, c] of it.choices.entries()) if (i !== it.answer) expect(has(it.en, c), `${it.id}: ${c}`).toBe(false);
    }
  });

  it("every focus is in its sentence; pic, num, mean and the dialogues say what to listen for", () => {
    for (const it of BANK) {
      if (it.focus) expect(it.en, it.id).toContain(it.focus);
      if (it.type !== 'word' && it.type !== 'reply') expect(it.ask, it.id).toBeTruthy();
    }
  });

  it('levels 4-7: a cast voice of its accent and its speaker’s gender, a US one per villager (an exposure item its UK or AU one), all 12 US voices used', () => {
    const l4 = BANK.filter((it) => it.lv >= 4);
    const voiceOf = (it: Item, who: keyof typeof CAST) => (it.tags?.features?.includes('accent-exposure') && EXPOSURE[who]) || CAST[who];
    for (const it of l4) {
      expect(it.cast, it.id).toBe(voiceOf(it, it.speaker));
      expect(it.cast, it.id).toMatch(/^(us|uk|au)-[fm][1-6]$/);
      expect(it.cast!.slice(0, 2), it.id).toBe(it.voice);
      expect(it.cast![3], it.id).toBe(ROSTER[it.speaker].gender);
    }
    for (const [id, cast] of [...Object.entries(CAST), ...Object.entries(EXPOSURE)]) expect(cast![3], id).toBe(ROSTER[id as keyof typeof ROSTER].gender);
    expect(Object.values(CAST).filter((c) => !c!.startsWith('us-'))).toEqual([]);
    expect(Object.values(EXPOSURE).filter((c) => c!.startsWith('us-'))).toEqual([]);
    expect(new Set(l4.map((it) => it.cast).filter((c) => c!.startsWith('us-'))).size).toBe(12);
    // every cast villager speaks (no stale entries); levels 1-3 carry no `cast` (speech.ts castOf derives theirs)
    expect(Object.keys(CAST).filter((id) => !BANK.some((it) => it.speaker === id))).toEqual([]);
    for (const it of BANK.filter((it) => it.lv < 4)) expect(it.cast, it.id).toBeUndefined();
  });

  it('levels 4-7: a scenario (seed 1-66, register, pragmatics), a note ≤ 40 字, and no reused distractor', () => {
    for (const it of BANK.filter((it) => it.lv >= 4)) {
      expect(it.tags, it.id).toBeDefined();
      expect(Number.isInteger(it.tags!.seed) && it.tags!.seed >= 1 && it.tags!.seed <= 66, it.id).toBe(true);
      expect(it.tags!.register && it.tags!.pragmatic, it.id).toBeTruthy();
      expect(it.note, it.id).toBeTruthy();
      expect([...it.note!].length, `${it.id}: ${it.note}`).toBeLessThanOrEqual(40);
      expect(it.ja, it.id).toMatch(/[ぁ-んァ-ン一-龯]/);
      if (it.type === 'reply' || it.type === 'mean' || (it.type === 'gist' && it.lv === 5)) expect(it.ja, it.id).toContain('→');
    }
  });

  it('what’s spoken (`tts`, §9): only when it differs from `en`, never a digit or symbol; level 4 numbers always written out', () => {
    for (const it of BANK.filter((it) => it.tts)) {
      expect(it.tts, it.id).not.toBe(it.en);
      expect(it.tts, it.id).not.toMatch(/[0-9£$¥%]/);
      expect(it.tts!.trim(), it.id).toBe(it.tts);
    }
    for (const it of BANK.filter((it) => it.lv >= 4 && !isDialogue(it))) expect(/[0-9£$¥%]/.test(it.en) ? it.tts : 'none', it.id).toBeTruthy();
  });

  it('dialogues: 24 + 30 + 6 at level 4, 40 + 6 at 6, 25 at 7 (gist and next), 2-4 lines between two villagers taking turns, each with its cast voice, its Japanese and its spoken text', () => {
    expect(DIALOGUES).toHaveLength(24);
    expect(DIALOGUES.filter((it) => it.type === 'gist')).toHaveLength(12);
    expect(DIALOGUES.filter((it) => it.type === 'next')).toHaveLength(12);
    const dialogues = BANK.filter(isDialogue);
    expect([4, 5, 6, 7].map((lv) => dialogues.filter((it) => it.lv === lv).length)).toEqual([60, 0, 46, 25]);
    for (const it of dialogues) {
      expect(DIALOGUE_TYPES, it.id).toContain(it.type);
      const lines = it.lines!;
      expect(lines.length, it.id).toBeGreaterThanOrEqual(2);
      expect(lines.length, it.id).toBeLessThanOrEqual(4);
      expect(new Set(lines.map((l) => l.who)).size, it.id).toBe(2);
      expect(new Set(lines.map((l) => l.cast)).size, `${it.id}: two voices`).toBe(2);
      for (const [n, l] of lines.entries()) {
        if (n) expect(l.who, `${it.id} line ${n + 1}: a turn each`).not.toBe(lines[n - 1].who);
        expect(l.cast, it.id).toBe((it.tags?.features?.includes('accent-exposure') && EXPOSURE[l.who]) || CAST[l.who]);
        expect(l.cast[3], it.id).toBe(ROSTER[l.who].gender);
        expect(l.ja, it.id).toMatch(/[ぁ-んァ-ン一-龯]/);
        expect(l.en.trim(), it.id).toBe(l.en);
        if (l.tts) {
          expect(l.tts, it.id).not.toBe(l.en);
          expect(l.tts, it.id).not.toMatch(/[0-9£$¥%]/);
        }
        if (/[0-9£$¥%]/.test(l.en)) expect(l.tts, `${it.id} line ${n + 1}: numbers written out`).toBeTruthy();
      }
      expect(it.en, it.id).toBe(lines.map((l) => l.en).join(' '));
      expect(it.speaker, it.id).toBe(lines[0].who);
      // the focus in one line (the transcript marks it there)
      expect(lines.filter((l) => l.en.includes(it.focus!)).length, `${it.id}: ${it.focus}`).toBe(1);
      expect(it.tts, it.id).toBeUndefined();
    }
    // a line's clip id is no item's id nor another clip's
    const all = BANK.flatMap((it) => clipIds(it));
    expect(new Set(all).size).toBe(all.length);
  });

  it('the アナウンス pack (level 5): PA, phone menus, voicemails, shops and the radio, each heard through its channel and condition', () => {
    const pack = BANK.filter((it) => it.lv === 5);
    expect(pack.every((it) => it.id.startsWith('a5-'))).toBe(true);
    const by = (ch: string) => pack.filter((it) => channelOf(it) === ch).length;
    // mostly PA, then calls and voicemails, a few heard live (a staff member, the radio)
    expect(by('pa')).toBeGreaterThanOrEqual(15);
    expect(by('phone')).toBeGreaterThanOrEqual(10);
    expect(pack.filter((it) => it.tags?.conditions?.includes('voicemail')).length).toBeGreaterThanOrEqual(5);
    for (const it of pack) {
      // its condition written out, matching its channel: a PA's a PA, a call's a phone line (a voicemail's a voicemail)
      expect(it.cond, it.id).toBeDefined();
      const ch = channelOf(it), vm = it.tags?.conditions?.includes('voicemail');
      if (ch === 'pa') expect(it.cond!.kind, it.id).toBe('pa');
      if (ch === 'phone') expect(it.cond!.kind, it.id).toBe(vm ? 'voicemail' : 'phone');
      if (ch === 'live') expect(['cafe', 'street', 'station'], it.id).toContain(it.cond!.kind);
      // num and gist say what to listen for; the answer's Japanese after →
      if (it.type === 'num' || it.type === 'gist') expect(it.ask, it.id).toBeTruthy();
      if (it.type !== 'num') expect(jaLines(it)[1], it.id).toMatch(/^→ /);
    }
    // the ladder: light and heavy both, heavy a third or less
    const heavy = pack.filter((it) => it.cond!.level === 'heavy').length;
    expect(heavy).toBeGreaterThanOrEqual(5);
    expect(heavy / pack.length).toBeLessThanOrEqual(1 / 3);
  });

  it('pic choices are existing art with a Japanese label', () => {
    for (const it of BANK.filter((it) => it.type === 'pic'))
      for (const key of it.choices) {
        expect(existsSync(join(STATIC, 'art', `${key}.webp`)), `${it.id}: ${key}`).toBe(true);
        expect(PIC_JA[key], `${it.id}: ${key}`).toBeTruthy();
      }
    const used = new Set(BANK.filter((it) => it.type === 'pic').flatMap((it) => it.choices));
    expect(Object.keys(PIC_JA).filter((k) => !used.has(k))).toEqual([]);
  });

  it('every item of an offered level has its clip (and levels 1 and 2 a slow one) in a pack and in clips.json', () => {
    // a level is offered (deck.ts LEVELS) only once all of its clips exist: level 4's wait for the neural cast
    expect(LEVELS).toEqual(expect.arrayContaining([1, 2, 3]));
    // (a dialogue's: one per line, `<id>-<n>`, once its level offers dialogues; the items in play: a waiting set's join
    // once voiced, source.ts)
    for (const it of PLAYED) {
      if ((!LEVELS.includes(it.lv) || (isDialogue(it) && !MIX[it.lv]?.[it.type])) && !clipIds(it).some((id) => CLIPS[id])) continue;
      for (const id of clipIds(it)) {
        const c = CLIPS[id];
        expect(c, id).toBeDefined();
        expect(c.dur, id).toBeGreaterThan(0.5);
        expect(c.dur, id).toBeLessThan(clipCap(it));
        expect(c.hash).toMatch(/^[0-9a-f]{8}$/);
        expect(PLACES.normal.has(id), id).toBe(true);
        const slow = it.lv <= 2;
        expect(Boolean(c.slow), id).toBe(slow);
        expect(PLACES.slow.has(id), id).toBe(slow);
      }
    }
    // the units' own items: every clip once any is made (a unit past draft needs them all: units.ts checkUnits); a
    // line 10 s at most whatever its level (かわ's level-3 items are calls and cafés with a bed's lead-in and tail, and
    // run to 9.1 s), a PA's 13
    for (const it of UNIT_ITEMS) {
      if (!clipIds(it).some((id) => CLIPS[id])) continue;
      for (const id of clipIds(it)) {
        const c = CLIPS[id];
        expect(c, id).toBeDefined();
        expect(c.dur, id).toBeGreaterThan(0.5);
        expect(c.dur, id).toBeLessThan(clipCap({ ...it, lv: Math.max(it.lv, 4) as Level }));
        expect(PLACES.normal.has(id), id).toBe(true);
        expect(c.slow, id).toBeUndefined();
      }
    }
    // the listening kinds': every clip of a file once any of its is made (a file is voiced whole: すうじ ラッシュ's wait for
    // A3), a call's or a たちぎき's whole turn 14 s at most (a call's correction comes inside a long turn: 12.9 s)
    for (const ids of readListen().map(({ raw }) => listenClipItems(raw).map((it) => it.id))) if (ids.some((id) => CLIPS[id])) for (const id of ids) {
      const c = CLIPS[id];
      expect(c, id).toBeDefined();
      expect(c.dur, id).toBeGreaterThan(0.5);
      expect(c.dur, id).toBeLessThan(14);
      expect(PLACES.normal.has(id), id).toBe(true);
      expect(c.slow, id).toBeUndefined();
    }
    // (and スピード はしご's rungs: ladder.test)
    const ids = new Set([...[...BANK, ...UNIT_ITEMS].flatMap((it) => clipIds(it)), ...RUNG_ITEMS.map((it) => it.id), ...STORY_IDS, ...LISTEN_IDS]);
    expect(Object.keys(CLIPS).filter((id) => !ids.has(id))).toEqual([]);
  });

  it('ships no other clips (no loose ones), and the clips stay small (each under 60 KB; level 4’s 80 KB, the アナウンス pack’s and やま’s 100 KB, ほし’s 2-4 sentences 160 KB, a ladder rung 80 KB, a story’s segment and a listening kind’s 100 KB; the games’ packs under 50 MB, the stories’ 20 MB)', () => {
    expect(existsSync(join(STATIC, 'audio/kikimimi')), 'the loose clips are gone (increment 9: the packs)').toBe(false);
    const rungs = new Set(RUNG_ITEMS.map((it) => it.id));
    const want = new Set([...[...BANK, ...UNIT_ITEMS].flatMap((it) => clipIds(it).flatMap((id) => [id, ...(it.lv <= 2 ? [`${id}-slow`] : [])])), ...rungs, ...STORY_IDS, ...LISTEN_IDS]);
    const clips = Object.values(PACKS).flatMap((e) => e.clips.map(([id, , bytes]) => [e.slow ? `${id}-slow` : id, bytes] as const));
    expect(clips.map(([f]) => f).filter((f) => !want.has(f))).toEqual([]);
    // (a ladder rung is a whole 5-9 s line, slowed at its foot: 2 a game, 8 clips)
    const lvOf = new Map([...BANK, ...UNIT_ITEMS].flatMap((it) => clipIds(it).flatMap((id) => [[id, it.lv], [`${id}-slow`, it.lv]] as const)));
    const kb = (f: string) => (rungs.has(f) ? 80 : STORY_IDS.has(f) || LISTEN_IDS.has(f) ? 100 : ({ 4: 80, 5: 100, 6: 100, 7: 160 } as Partial<Record<Level, number>>)[lvOf.get(f)!] ?? 60);
    for (const [f, bytes] of clips) expect(bytes, f).toBeLessThan(kb(f) * 1024);
    // (raised from 14 MB for the content sprint's ~700 clips, 40 MB for the loose files; in packs, a file a pack, so
    // Pages' 20,000 files no longer bind: past 50 MB the packs move to R2 behind PACK_BASE, docs/kikimimi-framework.md §6;
    // the bedtime stories, ~35 minutes of speech fetched a chapter at a time, have their own 20 MB beside them: 70 in all)
    const size = (story: boolean) => Object.entries(PACKS).filter(([, e]) => e.clips.some(([id]) => STORY_IDS.has(id)) === story)
      .reduce((n, [name, e]) => n + statSync(join(STATIC, 'audio/listen', packFile(name, e))).size, 0);
    expect(size(false)).toBeLessThan(50 * 1024 * 1024);
    expect(size(true)).toBeLessThan(20 * 1024 * 1024);
  });
});
