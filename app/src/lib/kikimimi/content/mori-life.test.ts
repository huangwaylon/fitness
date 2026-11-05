// もり daily-life content (mori-life.ts): the same rules as bank.test.ts and staging.test.ts apply to level 4, run over
// this file's items before they're wired into the bank, plus its own volume and variety.
import { describe, expect, it } from 'vitest';
import { ROSTER, type RosterId } from '#lib/villagers/roster.ts';
import { villagerArt } from '#lib/art.ts';
import { BANK, CHANNELS, SCENE_IDS, channelOf, clipIds, isDialogue, jaLines, splitFocus, type Item, type ItemType } from '../bank.ts';
import { CAST } from '../bank4.ts';
import { placeMark } from '../marks.ts';
import { SLOTS } from '../speech.ts';
import { CAST_ML, DIALOGUES, FAMILY, ITEMS } from './mori-life.ts';

const ALL: readonly Item[] = [...ITEMS, ...DIALOGUES];
const words = (s: string) => s.toLowerCase().match(/[a-z0-9',]+/g) ?? [];
const has = (en: string, phrase: string) => ` ${words(en).join(' ')} `.includes(` ${words(phrase).join(' ')} `);
const castOf = (who: RosterId) => CAST[who] ?? CAST_ML[who];
const DIGIT = /[0-9£$¥%]/;

describe('もり daily-life content', () => {
  it('70 items and 15 dialogues, every type a game draws well stocked', () => {
    expect(ITEMS).toHaveLength(70);
    expect(DIALOGUES).toHaveLength(15);
    const n = (t: ItemType) => ALL.filter((it) => it.type === t).length;
    for (const t of ['reply', 'mean', 'word', 'num'] as ItemType[]) expect(n(t), t).toBeGreaterThanOrEqual(15);
    expect(n('gist')).toBeGreaterThanOrEqual(7);
    expect(n('next')).toBeGreaterThanOrEqual(7);
    expect(n('pic')).toBe(0);
    for (const it of ITEMS) expect(isDialogue(it), it.id).toBe(false);
    for (const it of DIALOGUES) expect(isDialogue(it), it.id).toBe(true);
  });

  it('unique, file-safe ids with the ml- / dml- prefix, none taken by the bank (clip ids too)', () => {
    for (const it of ITEMS) expect(it.id).toMatch(/^ml-[a-z0-9]+(-[a-z0-9]+)*$/);
    for (const it of DIALOGUES) expect(it.id).toMatch(/^dml-[a-z0-9]+(-[a-z0-9]+)*$/);
    const mine = ALL.flatMap((it) => clipIds(it));
    expect(new Set(mine).size).toBe(mine.length);
    const bank = new Set(BANK.flatMap((it) => clipIds(it)));
    expect(mine.filter((id) => bank.has(id))).toEqual([]);
  });

  it('every family is covered, and every item has one', () => {
    for (const it of ALL) expect(FAMILY[it.id], it.id).toBeTruthy();
    const fams = ['shop', 'food', 'hotel', 'travel', 'health', 'bank', 'home', 'delivery', 'office', 'gym', 'salon', 'neighbour', 'emergency'];
    for (const f of fams) expect(ALL.filter((it) => FAMILY[it.id] === f).length, f).toBeGreaterThanOrEqual(3);
  });

  it('speakers: roster villagers with art, never the host, spread wide; voices mostly US, some UK and AU', () => {
    const who = ALL.flatMap((it) => (isDialogue(it) ? it.lines.map((l) => l.who) : [it.speaker]));
    for (const id of who) {
      expect(ROSTER[id], id).toBeDefined();
      expect(villagerArt(id, true), id).not.toBeNull();
      expect(id).not.toBe('isabelle');
    }
    expect(new Set(who).size).toBeGreaterThanOrEqual(50);
    const by = (a: string) => ITEMS.filter((it) => it.voice === a).length / ITEMS.length;
    expect(by('us')).toBeGreaterThan(0.5);
    expect(by('uk')).toBeGreaterThan(0.15);
    expect(by('au')).toBeGreaterThan(0.1);
  });

  it('CAST_ML: only villagers CAST lacks, each a voice slot that exists, of their gender; every one speaks', () => {
    for (const [id, cast] of Object.entries(CAST_ML) as [RosterId, string][]) {
      expect(CAST[id], `${id} is already in CAST`).toBeUndefined();
      const [, accent, gender, slot] = cast.match(/^(us|uk|au)-([fm])([123])$/)!;
      expect(Number(slot), id).toBeLessThanOrEqual(SLOTS[accent as 'us'][gender as 'f']);
      expect(gender, id).toBe(ROSTER[id].gender);
      expect(ALL.some((it) => it.speaker === id || it.lines?.some((l) => l.who === id)), `${id} never speaks`).toBe(true);
    }
  });

  it('level 4: a cast voice of its accent and the speaker’s gender (theirs for good)', () => {
    for (const it of ALL) {
      expect(it.lv, it.id).toBe(4);
      expect(it.cast, it.id).toBe(castOf(it.speaker));
      expect(it.cast!.slice(0, 2), it.id).toBe(it.voice);
      expect(it.cast![3], it.id).toBe(ROSTER[it.speaker].gender);
    }
  });

  // as bank.test.ts: a villager named in the English is named in the Japanese as heard
  const EN_KANA: Record<string, string> = { Raymond: 'レイモンド', Sydney: 'シドニー', Bunnie: 'バニー' };
  it('a villager named in the English is named in the Japanese as heard', () => {
    const named = Object.values(ROSTER).map((r) => ({ ...r, re: new RegExp(`\\b${r.nameEn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`) }));
    for (const it of ALL) {
      const pairs = isDialogue(it) ? it.lines.map((l) => [l.en, l.ja]) : [[it.type === 'reply' ? `${it.en} ${it.choices[it.answer]}` : it.en, it.ja]];
      for (const [heard, ja] of pairs)
        for (const r of named.filter((r) => r.re.test(heard))) {
          const kana = r.special ? r.nameJa : EN_KANA[r.nameEn];
          expect(kana, `${it.id}: ${r.nameEn} needs its katakana`).toBeTruthy();
          expect(ja, `${it.id}: ${r.nameEn}`).toContain(kana);
        }
    }
  });

  it('answers in range, choices distinct, counts per type; Japanese on one line or two (reply, mean)', () => {
    const count: Record<ItemType, number> = { pic: 4, word: 3, num: 3, reply: 3, mean: 3, gist: 3, next: 3 };
    for (const it of ALL) {
      expect(it.choices.length, it.id).toBe(count[it.type]);
      expect(new Set(it.choices).size, it.id).toBe(it.choices.length);
      expect(it.answer, it.id).toBe(0);
      expect(it.en.trim(), it.id).toBe(it.en);
      expect(splitFocus(it).join(''), it.id).toBe(it.en);
      const two = it.type === 'reply' || it.type === 'mean';
      const lines = jaLines(it);
      expect(lines.length, it.id).toBe(two ? 2 : 1);
      if (it.type === 'reply') expect(lines[1], it.id).toMatch(/^→ 「.+」$/);
      expect(it.ja.split('→').length, it.id).toBe(two ? 2 : 1);
    }
  });

  it('a word item: its answer word and focus are in the sentence, the other choices are not', () => {
    for (const it of ITEMS.filter((it) => it.type === 'word')) {
      expect(has(it.en, it.focus!), it.id).toBe(true);
      expect(has(it.en, it.choices[it.answer]), it.id).toBe(true);
      expect(words(it.focus!)).toEqual(words(it.choices[it.answer]));
      for (const [i, c] of it.choices.entries()) if (i !== it.answer) expect(has(it.en, c), `${it.id}: ${c}`).toBe(false);
    }
  });

  it('every focus is in its sentence; num, mean and the dialogues say what to listen for', () => {
    for (const it of ALL) {
      if (it.focus) expect(it.en, it.id).toContain(it.focus);
      if (it.type !== 'word' && it.type !== 'reply') expect(it.ask, it.id).toBeTruthy();
    }
  });

  it('a scenario (seed 1-66, register, pragmatics), a note ≤ 40 字, Japanese', () => {
    for (const it of ALL) {
      expect(Number.isInteger(it.tags!.seed) && it.tags!.seed >= 1 && it.tags!.seed <= 66, it.id).toBe(true);
      expect(it.tags!.register && it.tags!.pragmatic, it.id).toBeTruthy();
      expect([...it.note!].length, `${it.id}: ${it.note}`).toBeLessThanOrEqual(40);
      expect(it.ja, it.id).toMatch(/[ぁ-んァ-ン一-龯]/);
    }
    // variety: most of the pragmatic layers and registers in use
    expect(new Set(ALL.map((it) => it.tags!.pragmatic)).size).toBeGreaterThanOrEqual(9);
    expect(new Set(ALL.map((it) => it.tags!.register)).size).toBeGreaterThanOrEqual(6);
  });

  it('what’s spoken (`tts`): only when it differs, never a digit or symbol; numbers always written out', () => {
    const clips = ALL.flatMap((it) => (isDialogue(it) ? it.lines.map((l) => ({ id: it.id, en: l.en, tts: l.tts })) : [{ id: it.id, en: it.en, tts: it.tts }]));
    for (const c of clips) {
      if (c.tts) {
        expect(c.tts, c.id).not.toBe(c.en);
        expect(c.tts, c.id).not.toMatch(DIGIT);
        expect(c.tts.trim(), c.id).toBe(c.tts);
      }
      if (DIGIT.test(c.en)) expect(c.tts, `${c.id}: numbers written out`).toBeTruthy();
    }
  });

  it('dialogues: 2-4 lines between two villagers taking turns, two voices, the focus in one line', () => {
    for (const it of DIALOGUES) {
      const lines = it.lines!;
      expect(lines.length, it.id).toBeGreaterThanOrEqual(2);
      expect(lines.length, it.id).toBeLessThanOrEqual(4);
      expect(new Set(lines.map((l) => l.who)).size, it.id).toBe(2);
      expect(new Set(lines.map((l) => l.cast)).size, `${it.id}: two voices`).toBe(2);
      for (const [n, l] of lines.entries()) {
        if (n) expect(l.who, `${it.id} line ${n + 1}`).not.toBe(lines[n - 1].who);
        expect(l.cast, it.id).toBe(castOf(l.who));
        expect(l.cast[3], it.id).toBe(ROSTER[l.who].gender);
        expect(l.ja, it.id).toMatch(/[ぁ-んァ-ン一-龯]/);
        expect(l.en.trim(), it.id).toBe(l.en);
      }
      expect(it.en, it.id).toBe(lines.map((l) => l.en).join(' '));
      expect(it.speaker, it.id).toBe(lines[0].who);
      expect(lines.filter((l) => l.en.includes(it.focus!)).length, `${it.id}: ${it.focus}`).toBe(1);
      expect(it.tts, it.id).toBeUndefined();
    }
  });

  it('staged: a known scene or none, a channel only where the conditions don’t give it, most with a scene', () => {
    for (const it of ALL) {
      if (it.scene) expect(SCENE_IDS, it.id).toContain(it.scene);
      expect(CHANNELS, it.id).toContain(channelOf(it));
      if (it.channel) expect(channelOf({ tags: it.tags }), it.id).not.toBe(it.channel);
    }
    expect(ALL.filter((it) => it.scene).length / ALL.length).toBeGreaterThan(0.6);
    for (const c of CHANNELS.filter((c) => c !== 'video')) expect(ALL.some((it) => channelOf(it) === c), c).toBe(true);
  });

  it('sound marks: every clip with a tts has them, only those; each lands on whole words, say runs never overlap', () => {
    const clips = ALL.flatMap((it) => (isDialogue(it) ? it.lines.map((l, n) => ({ id: `${it.id}-${n + 1}`, en: l.en, tts: l.tts, marks: l.marks })) : [{ id: it.id, en: it.en, tts: it.tts, marks: it.marks }]));
    expect(clips.filter((c) => c.tts && !c.marks?.length).map((c) => c.id)).toEqual([]);
    expect(clips.filter((c) => c.marks && !c.tts).map((c) => c.id)).toEqual([]);
    for (const c of clips.filter((c) => c.marks)) {
      const taken = new Array<boolean>(c.en.length).fill(false);
      for (const m of c.marks!) {
        const at = placeMark(c.en, m);
        expect(at, `${c.id} ${m.join(' ')}`).not.toBeNull();
        if (m[0] === 'say') {
          const [a, b] = at![0];
          expect(taken.slice(a, b).some(Boolean), `${c.id} ${m[1]} overlaps`).toBe(false);
          taken.fill(true, a, b);
          expect(m[2].length, c.id).toBeGreaterThan(0);
        }
        if (m[0] === 'link') expect(m[1], c.id).toContain(' ');
        if (m[0] === 'drop') expect(m[2].length, c.id).toBeLessThan(m[1].length);
      }
    }
  });

  it('no near-duplicate of the bank: no shared sentence or right answer', () => {
    const norm = (s: string) => words(s).join(' ');
    const bankEn = new Set(BANK.map((it) => norm(it.en)));
    const bankRight = new Set(BANK.map((it) => norm(it.choices[it.answer])));
    for (const it of ALL) {
      expect(bankEn.has(norm(it.en)), it.id).toBe(false);
      if (it.type !== 'word' && it.type !== 'num') expect(bankRight.has(norm(it.choices[0])), it.id).toBe(false);
    }
  });
});
