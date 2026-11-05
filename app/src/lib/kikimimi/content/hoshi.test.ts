// ほし's content (content/hoshi.ts) against bank.test.ts's and the dialogues' rules, before the integrator wires it in.
import { describe, expect, it } from 'vitest';
import { ROSTER, type RosterId } from '#lib/villagers/roster.ts';
import { villagerArt } from '#lib/art.ts';
import { BANK, CHANNELS, SCENE_IDS, clipIds, isDialogue, jaLines, splitFocus, type Item, type ItemType } from '../bank.ts';
import { CAST } from '../bank4.ts';
import { SLOTS } from '../speech.ts';
import { DIALOGUES, FAMILY, HOSHI_CAST, ITEMS } from './hoshi.ts';
import { CAST_ML } from './mori-life.ts';
import { CAST_YB } from './yama-b.ts';

const ALL: readonly Item[] = [...ITEMS, ...DIALOGUES];
const words = (s: string) => s.toLowerCase().match(/[a-z0-9',]+/g) ?? [];
const has = (en: string, phrase: string) => ` ${words(en).join(' ')} `.includes(` ${words(phrase).join(' ')} `);
const castOf = (who: RosterId) => CAST[who] ?? HOSHI_CAST[who];
const DIGIT = /[0-9£$¥%]/;

describe('kikimimi ほし content', () => {
  it('90 items and 25 dialogues, ids unique, file-safe, prefixed and clear of the bank', () => {
    expect(ITEMS).toHaveLength(90);
    expect(DIALOGUES).toHaveLength(25);
    const ids = ALL.flatMap((it) => clipIds(it));
    expect(new Set(ids).size).toBe(ids.length);
    for (const it of ITEMS) expect(it.id).toMatch(/^ho-[a-z0-9]+(-[a-z0-9]+)*$/);
    for (const it of DIALOGUES) expect(it.id).toMatch(/^dho-[a-z0-9]+(-[a-z0-9]+)*$/);
    const bank = new Set(BANK.flatMap((it) => clipIds(it)));
    for (const id of ids) expect(bank.has(id), id).toBe(false);
  });

  it('a mix of types, every family, a placeholder level the integrator replaces', () => {
    const n = (t: ItemType) => ITEMS.filter((it) => it.type === t).length;
    for (const t of ['word', 'num', 'reply', 'mean', 'gist', 'next'] as ItemType[]) expect(n(t), t).toBeGreaterThanOrEqual(6);
    expect(n('pic')).toBe(0);
    expect(DIALOGUES.filter((it) => it.type === 'gist').length).toBeGreaterThanOrEqual(12);
    expect(DIALOGUES.filter((it) => it.type === 'next').length).toBeGreaterThanOrEqual(12);
    expect(Object.keys(FAMILY).sort()).toEqual(ALL.map((it) => it.id).sort());
    expect(new Set(Object.values(FAMILY)).size).toBe(10);
    for (const it of ALL) expect(it.lv as number, it.id).toBe(6);
  });

  it('every speaker is a roster villager with art, never the host, with a cast voice of its gender and an existing slot', () => {
    for (const [id, cast] of Object.entries(HOSHI_CAST)) {
      expect(CAST[id as RosterId], `${id} is already in CAST`).toBeUndefined();
      expect(cast![3], id).toBe(ROSTER[id as RosterId].gender);
    }
    const speakers = ALL.flatMap((it) => (isDialogue(it) ? it.lines.map((l) => [l.who, l.cast] as const) : [[it.speaker, it.cast!] as const]));
    for (const [who, cast] of speakers) {
      expect(ROSTER[who], who).toBeDefined();
      expect(villagerArt(who, true), who).not.toBeNull();
      expect(who).not.toBe('isabelle');
      expect(cast, who).toBe(castOf(who));
      expect(cast[3], who).toBe(ROSTER[who].gender);
      expect(Number(cast[4]), cast).toBeLessThanOrEqual(SLOTS[cast.slice(0, 2) as 'us' | 'uk' | 'au'][cast[3] as 'f' | 'm']);
    }
    // one voice per villager for good: the same as the other sets' casts
    for (const other of [CAST_ML, CAST_YB])
      for (const [id, cast] of Object.entries(HOSHI_CAST)) if (other[id as RosterId]) expect(cast, id).toBe(other[id as RosterId]);
    // every added voice speaks; all three accents, US the most
    expect(Object.keys(HOSHI_CAST).filter((id) => !speakers.some(([w]) => w === id))).toEqual([]);
    const by = (a: string) => speakers.filter(([, c]) => c.startsWith(a)).length;
    expect(by('us')).toBeGreaterThan(by('uk'));
    expect(by('uk')).toBeGreaterThan(0);
    expect(by('au')).toBeGreaterThan(0);
  });

  it('a villager named in the English is named in the Japanese as heard', () => {
    const EN_KANA: Record<string, string> = { Sydney: 'シドニー' };
    const named = Object.values(ROSTER).map((r) => ({ ...r, re: new RegExp(`\\b${r.nameEn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`) }));
    for (const it of ALL) {
      const pairs = isDialogue(it) ? it.lines.map((l) => [l.en, l.ja]) : [[it.type === 'reply' ? `${it.en} ${it.choices[it.answer]}` : it.en, it.ja]];
      for (const [heard, ja] of pairs)
        for (const r of named.filter((r) => r.re.test(heard))) {
          const kana = r.special ? r.nameJa : EN_KANA[r.nameEn];
          expect(kana, `${it.id}: ${r.nameEn} named`).toBeTruthy();
          expect(ja, `${it.id}: ${r.nameEn}`).toContain(kana);
        }
    }
  });

  it('choices: 3, distinct, the answer in range; the Japanese laid out per type', () => {
    for (const it of ALL) {
      expect(it.choices.length, it.id).toBe(3);
      expect(new Set(it.choices).size, it.id).toBe(3);
      expect(it.answer, it.id).toBe(0);
      expect(it.en.trim(), it.id).toBe(it.en);
      expect(splitFocus(it).join(''), it.id).toBe(it.en);
      const lines = jaLines(it), two = it.type === 'reply' || it.type === 'mean';
      expect(lines.length, it.id).toBe(two ? 2 : 1);
      if (it.type === 'reply') expect(lines[1], it.id).toMatch(/^→ 「.+」$/);
      if (it.type === 'mean') expect(lines[1], it.id).toMatch(/^→ つまり、/);
      expect(it.ja, it.id).toMatch(/[ぁ-んァ-ン一-龯]/);
    }
  });

  it('a word item: its answer and focus are in the sentence, the other choices are not', () => {
    for (const it of ITEMS.filter((it) => it.type === 'word')) {
      expect(has(it.en, it.focus!), it.id).toBe(true);
      expect(words(it.focus!)).toEqual(words(it.choices[it.answer]));
      for (const [i, c] of it.choices.entries()) if (i !== it.answer) expect(has(it.en, c), `${it.id}: ${c}`).toBe(false);
    }
  });

  it('every focus is in its sentence; all but word and reply say what to listen for', () => {
    for (const it of ALL) {
      if (it.type !== 'reply') expect(it.focus, it.id).toBeTruthy();
      if (it.focus) expect(it.en, it.id).toContain(it.focus);
      if (it.type !== 'word' && it.type !== 'reply') expect(it.ask, it.id).toBeTruthy();
    }
  });

  it('a scenario (seed 1-66, register, pragmatics), a note ≤ 40 字, a known scene and channel', () => {
    for (const it of ALL) {
      expect(Number.isInteger(it.tags!.seed) && it.tags!.seed >= 1 && it.tags!.seed <= 66, it.id).toBe(true);
      expect(it.tags!.register && it.tags!.pragmatic, it.id).toBeTruthy();
      expect([...it.note!].length, `${it.id}: ${it.note}`).toBeLessThanOrEqual(40);
      if (it.scene) expect(SCENE_IDS, it.id).toContain(it.scene);
      if (it.channel) expect(CHANNELS, it.id).toContain(it.channel);
    }
  });

  it('what’s spoken: `tts` only when it differs, never a digit or symbol; numbers in `en` always written out', () => {
    const spoken = ALL.flatMap((it) => (isDialogue(it) ? it.lines.map((l) => [it.id, l.en, l.tts] as const) : [[it.id, it.en, it.tts] as const]));
    for (const [id, en, tts] of spoken) {
      if (tts) {
        expect(tts, id).not.toBe(en);
        expect(tts, id).not.toMatch(DIGIT);
        expect(tts.trim(), id).toBe(tts);
      }
      if (DIGIT.test(en)) expect(tts, `${id}: numbers written out`).toBeTruthy();
    }
  });

  it('long but not too long: a clip at most ~45 words (the integrator lifts the 8 s clip cap for ほし)', () => {
    for (const it of ALL) for (const c of isDialogue(it) ? it.lines.map((l) => l.en) : [it.en]) expect(c.split(/\s+/).length, `${it.id}: ${c}`).toBeLessThanOrEqual(45);
  });

  it('dialogues: 3-4 lines between two villagers taking turns, two voices, the focus in one line', () => {
    for (const it of DIALOGUES) {
      const lines = it.lines!;
      expect(lines.length, it.id).toBeGreaterThanOrEqual(3);
      expect(lines.length, it.id).toBeLessThanOrEqual(4);
      expect(new Set(lines.map((l) => l.who)).size, it.id).toBe(2);
      expect(new Set(lines.map((l) => l.cast)).size, `${it.id}: two voices`).toBe(2);
      for (const [n, l] of lines.entries()) {
        if (n) expect(l.who, `${it.id} line ${n + 1}`).not.toBe(lines[n - 1].who);
        expect(l.ja, it.id).toMatch(/[ぁ-んァ-ン一-龯]/);
        expect(l.en.trim(), it.id).toBe(l.en);
      }
      expect(it.en, it.id).toBe(lines.map((l) => l.en).join(' '));
      expect(it.speaker, it.id).toBe(lines[0].who);
      expect(lines.filter((l) => l.en.includes(it.focus!)).length, `${it.id}: ${it.focus}`).toBe(1);
      expect(it.tts, it.id).toBeUndefined();
    }
  });
});
