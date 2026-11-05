// content/mori-work.ts: the same rules as bank.test.ts and staging.test.ts, on this file's items and dialogues alone (they
// aren't in BANK until an integrator folds them in), plus no id clash with the bank.
import { describe, expect, it } from 'vitest';
import { ROSTER } from '#lib/villagers/roster.ts';
import { villagerArt } from '#lib/art.ts';
import { BANK, CHANNELS, SCENE_IDS, channelOf, clipIds, isDialogue, jaLines, type ItemType } from '../bank.ts';
import { CAST } from '../bank4.ts';
import { placeMark } from '../marks.ts';
import { DIALOGUES, ITEMS } from './mori-work.ts';

const ALL = [...ITEMS, ...DIALOGUES];
const words = (s: string) => s.toLowerCase().match(/[a-z0-9',]+/g) ?? [];
const has = (en: string, phrase: string) => ` ${words(en).join(' ')} `.includes(` ${words(phrase).join(' ')} `);
const DIGIT = /[0-9£$¥%]/;

describe('もり content: work and people', () => {
  it('70 items and 15 dialogues, the types mixed', () => {
    expect(ITEMS).toHaveLength(70);
    expect(DIALOGUES).toHaveLength(15);
    const n = (t: ItemType) => ALL.filter((it) => it.type === t).length;
    for (const t of ['reply', 'mean', 'word', 'num'] as ItemType[]) expect(n(t), t).toBeGreaterThanOrEqual(10);
    expect(n('gist')).toBeGreaterThanOrEqual(6);
    expect(n('next')).toBeGreaterThanOrEqual(6);
    expect(ITEMS.filter(isDialogue)).toEqual([]);
    expect(DIALOGUES.every((it) => isDialogue(it) && (it.type === 'gist' || it.type === 'next'))).toBe(true);
  });

  it('unique, file-safe ids under mw- (dialogues dmw-), no clash with the bank or its clips', () => {
    const ids = ALL.flatMap((it) => clipIds(it));
    expect(new Set(ids).size).toBe(ids.length);
    for (const it of ITEMS) expect(it.id).toMatch(/^mw-[a-z0-9]+(-[a-z0-9]+)*$/);
    for (const it of DIALOGUES) expect(it.id).toMatch(/^dmw-[a-z0-9]+(-[a-z0-9]+)*$/);
    const bank = new Set(BANK.flatMap((it) => clipIds(it)));
    expect(ids.filter((id) => bank.has(id))).toEqual([]);
  });

  it('all level 4, every speaker a roster villager with art and a cast voice of their gender, never しずえ', () => {
    for (const it of ALL) {
      expect(it.lv, it.id).toBe(4);
      for (const who of isDialogue(it) ? it.lines.map((l) => l.who) : [it.speaker]) {
        expect(ROSTER[who], it.id).toBeDefined();
        expect(villagerArt(who, true), it.id).not.toBeNull();
        expect(who).not.toBe('isabelle');
      }
      expect(it.cast, it.id).toBe(CAST[it.speaker]);
      expect(it.cast!.slice(0, 2), it.id).toBe(it.voice);
      expect(it.cast![3], it.id).toBe(ROSTER[it.speaker].gender);
    }
    // all three accents, US the most
    const by = (a: string) => ALL.filter((it) => it.voice === a).length;
    expect(by('us')).toBeGreaterThan(by('uk'));
    expect(by('uk')).toBeGreaterThan(0);
    expect(by('au')).toBeGreaterThan(0);
  });

  const EN_KANA: Record<string, string> = { Raymond: 'レイモンド', Sydney: 'シドニー', Bunnie: 'バニー' };
  it('a villager named in the English is named in the Japanese as heard', () => {
    const named = Object.values(ROSTER).map((r) => ({ ...r, re: new RegExp(`\\b${r.nameEn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`) }));
    for (const it of ALL) {
      const pairs = isDialogue(it) ? it.lines.map((l) => [l.en, l.ja]) : [[it.type === 'reply' ? `${it.en} ${it.choices[it.answer]}` : it.en, it.ja]];
      for (const [heard, ja] of pairs)
        for (const r of named.filter((r) => r.re.test(heard))) {
          const kana = r.special ? r.nameJa : EN_KANA[r.nameEn];
          expect(kana, `${it.id}: ${r.nameEn} is heard`).toBeTruthy();
          expect(ja, `${it.id}: ${r.nameEn}`).toContain(kana);
        }
    }
  });

  it('choices: 3, distinct, the answer first; ja shaped per type; a note ≤ 40 字; a scenario', () => {
    for (const it of ALL) {
      expect(it.choices.length, it.id).toBe(3);
      expect(new Set(it.choices).size, it.id).toBe(3);
      expect(it.answer, it.id).toBe(0);
      expect(it.en.trim(), it.id).toBe(it.en);
      expect(it.ja, it.id).toMatch(/[ぁ-んァ-ン一-龯]/);
      const two = it.type === 'reply' || it.type === 'mean';
      expect(jaLines(it).length, it.id).toBe(two ? 2 : 1);
      expect(it.ja.split('→').length, it.id).toBe(two ? 2 : 1);
      if (it.type === 'reply') expect(jaLines(it)[1], it.id).toMatch(/^→ 「.+」$/);
      expect(it.note, it.id).toBeTruthy();
      expect([...it.note!].length, `${it.id}: ${it.note}`).toBeLessThanOrEqual(40);
      const t = it.tags!;
      expect(Number.isInteger(t.seed) && t.seed >= 1 && t.seed <= 66, it.id).toBe(true);
      expect(t.register && t.pragmatic, it.id).toBeTruthy();
    }
  });

  it('a word item: its answer and focus in the sentence, the other choices not', () => {
    for (const it of ITEMS.filter((it) => it.type === 'word')) {
      expect(has(it.en, it.focus!), it.id).toBe(true);
      expect(words(it.focus!)).toEqual(words(it.choices[0]));
      for (const c of it.choices.slice(1)) expect(has(it.en, c), `${it.id}: ${c}`).toBe(false);
    }
  });

  it('every focus is in its sentence (a dialogue’s in exactly one line); num, mean and the dialogues ask', () => {
    for (const it of ALL) {
      if (it.focus) expect(it.en, it.id).toContain(it.focus);
      if (it.type !== 'word' && it.type !== 'reply') expect(it.ask, it.id).toBeTruthy();
      if (it.type === 'num') expect(it.focus, it.id).toBeTruthy();
    }
    for (const it of DIALOGUES) expect(it.lines!.filter((l) => l.en.includes(it.focus!)).length, `${it.id}: ${it.focus}`).toBe(1);
  });

  it('dialogues: 2-4 lines, two villagers with two voices taking turns, the item mirrors its lines', () => {
    for (const it of DIALOGUES) {
      const lines = it.lines!;
      expect(lines.length, it.id).toBeGreaterThanOrEqual(2);
      expect(lines.length, it.id).toBeLessThanOrEqual(4);
      expect(new Set(lines.map((l) => l.who)).size, it.id).toBe(2);
      expect(new Set(lines.map((l) => l.cast)).size, `${it.id}: two voices`).toBe(2);
      for (const [n, l] of lines.entries()) {
        if (n) expect(l.who, `${it.id} line ${n + 1}`).not.toBe(lines[n - 1].who);
        expect(l.cast, it.id).toBe(CAST[l.who]);
        expect(l.cast[3], it.id).toBe(ROSTER[l.who].gender);
        expect(l.ja, it.id).toMatch(/[ぁ-んァ-ン一-龯]/);
        expect(l.en.trim(), it.id).toBe(l.en);
      }
      expect(it.en, it.id).toBe(lines.map((l) => l.en).join(' '));
      expect(it.speaker, it.id).toBe(lines[0].who);
      expect(it.tts, it.id).toBeUndefined();
    }
  });

  /** Every clip's text, spoken text and marks. */
  const clips = ALL.flatMap((it) => (isDialogue(it) ? it.lines.map((l, n) => ({ id: `${it.id}-${n + 1}`, en: l.en, tts: l.tts, marks: l.marks })) : [{ id: it.id, en: it.en, tts: it.tts, marks: it.marks }]));

  it('tts (§9): only when it differs, never a digit or symbol; numbers always written out', () => {
    for (const c of clips) {
      if (c.tts) {
        expect(c.tts, c.id).not.toBe(c.en);
        expect(c.tts, c.id).not.toMatch(DIGIT);
        expect(c.tts.trim(), c.id).toBe(c.tts);
      }
      if (DIGIT.test(c.en)) expect(c.tts, `${c.id}: numbers written out`).toBeTruthy();
    }
  });

  it('marks on every clip with a tts and only those, each on whole words, say runs never overlapping', () => {
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

  it('staged: a known scene or none (most have one), a channel written only where the conditions don’t give it', () => {
    for (const it of ALL) {
      if (it.scene) expect(SCENE_IDS, it.id).toContain(it.scene);
      expect(CHANNELS, it.id).toContain(channelOf(it));
      if (it.channel) expect(channelOf({ tags: it.tags }), it.id).not.toBe(it.channel);
    }
    expect(ALL.filter((it) => it.scene).length / ALL.length).toBeGreaterThan(0.8);
  });
});
