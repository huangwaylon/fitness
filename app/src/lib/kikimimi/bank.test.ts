import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROSTER } from '#lib/villagers/roster.ts';
import { villagerArt } from '#lib/art.ts';
import { BANK, PIC_JA, channelOf, clipIds, isDialogue, jaLines, splitFocus, type ItemType, type Level } from './bank.ts';
import { CAST } from './bank4.ts';
import { LEVELS, MIX, mixes } from './deck.ts';
import { CLIPS } from './clips.ts';
import { DIALOGUES } from './dialogues.ts';

const STATIC = join(import.meta.dirname, '../../../static');
const words = (s: string) => s.toLowerCase().match(/[a-z0-9',]+/g) ?? [];
const has = (en: string, phrase: string) => ` ${words(en).join(' ')} `.includes(` ${words(phrase).join(' ')} `);

describe('kikimimi bank', () => {
  it('has unique, file-safe ids', () => {
    const ids = BANK.map((it) => it.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('has at least 40 items per level, enough of each type for a game', () => {
    for (const lv of [1, 2, 3, 4] as Level[]) {
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
    expect(BANK.filter((it) => it.lv === 5)).toEqual([]);
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
  const EN_KANA: Record<string, string> = { Raymond: 'レイモンド', Sydney: 'シドニー', Bunnie: 'バニー' };
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

  it('accents: level 1 US only, level 2 adds UK, level 3 adds AU (and uses all three), level 4 all three', () => {
    const allowed: Partial<Record<Level, string[]>> = { 1: ['us'], 2: ['us', 'uk'], 3: ['us', 'uk', 'au'], 4: ['us', 'uk', 'au'] };
    for (const it of BANK) expect(allowed[it.lv], it.id).toContain(it.voice);
    for (const lv of [1, 2, 3, 4] as Level[]) expect(new Set(BANK.filter((it) => it.lv === lv).map((it) => it.voice)).size).toBe(Math.min(lv, 3));
  });

  it('splitFocus and jaLines: the focus marked in place; a reply on two lines, the question, then → the reply', () => {
    expect(splitFocus({ en: 'I got a squid!', focus: 'squid' })).toEqual(['I got a ', 'squid', '!']);
    expect(splitFocus({ en: 'Hello.', focus: 'bye' })).toEqual(['Hello.', '', '']);
    expect(splitFocus({ en: 'Hello.' })).toEqual(['Hello.', '', '']);
    for (const it of BANK) {
      expect(splitFocus(it).join(''), it.id).toBe(it.en);
      const lines = jaLines(it), two = it.type === 'reply' || it.type === 'mean';
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

  it('level 4: a cast voice of its accent and its speaker’s gender, one per villager, all 12 used', () => {
    const l4 = BANK.filter((it) => it.lv === 4);
    for (const it of l4) {
      expect(it.cast, it.id).toBe(CAST[it.speaker]);
      expect(it.cast, it.id).toMatch(/^(us|uk|au)-[fm][123]$/);
      expect(it.cast!.slice(0, 2), it.id).toBe(it.voice);
      expect(it.cast![3], it.id).toBe(ROSTER[it.speaker].gender);
    }
    for (const [id, cast] of Object.entries(CAST)) expect(cast![3], id).toBe(ROSTER[id as keyof typeof ROSTER].gender);
    expect(new Set(l4.map((it) => it.cast)).size).toBe(12);
    // every cast villager speaks (no stale entries); levels 1-3 carry no `cast` (speech.ts castOf derives theirs)
    expect(Object.keys(CAST).filter((id) => !BANK.some((it) => it.speaker === id))).toEqual([]);
    for (const it of BANK.filter((it) => it.lv !== 4)) expect(it.cast, it.id).toBeUndefined();
  });

  it('level 4: a scenario (seed 1-66, register, pragmatics), a note ≤ 40 字, and no reused distractor', () => {
    for (const it of BANK.filter((it) => it.lv === 4)) {
      expect(it.tags, it.id).toBeDefined();
      expect(Number.isInteger(it.tags!.seed) && it.tags!.seed >= 1 && it.tags!.seed <= 66, it.id).toBe(true);
      expect(it.tags!.register && it.tags!.pragmatic, it.id).toBeTruthy();
      expect(it.note, it.id).toBeTruthy();
      expect([...it.note!].length, `${it.id}: ${it.note}`).toBeLessThanOrEqual(40);
      expect(it.ja, it.id).toMatch(/[ぁ-んァ-ン一-龯]/);
      if (it.type === 'reply' || it.type === 'mean') expect(it.ja, it.id).toContain('→');
    }
  });

  it('what’s spoken (`tts`, §9): only when it differs from `en`, never a digit or symbol; level 4 numbers always written out', () => {
    for (const it of BANK.filter((it) => it.tts)) {
      expect(it.tts, it.id).not.toBe(it.en);
      expect(it.tts, it.id).not.toMatch(/[0-9£$¥%]/);
      expect(it.tts!.trim(), it.id).toBe(it.tts);
    }
    for (const it of BANK.filter((it) => it.lv === 4 && !isDialogue(it))) expect(/[0-9£$¥%]/.test(it.en) ? it.tts : 'none', it.id).toBeTruthy();
  });

  it('dialogues: 24 (12 gist, 12 next), 2-4 lines between two villagers taking turns, each with its cast voice, its Japanese and its spoken text', () => {
    expect(DIALOGUES).toHaveLength(24);
    expect(DIALOGUES.filter((it) => it.type === 'gist')).toHaveLength(12);
    expect(DIALOGUES.filter((it) => it.type === 'next')).toHaveLength(12);
    expect(BANK.filter(isDialogue)).toEqual(DIALOGUES);
    for (const it of DIALOGUES) {
      const lines = it.lines!;
      expect(lines.length, it.id).toBeGreaterThanOrEqual(2);
      expect(lines.length, it.id).toBeLessThanOrEqual(4);
      expect(new Set(lines.map((l) => l.who)).size, it.id).toBe(2);
      expect(new Set(lines.map((l) => l.cast)).size, `${it.id}: two voices`).toBe(2);
      for (const [n, l] of lines.entries()) {
        if (n) expect(l.who, `${it.id} line ${n + 1}: a turn each`).not.toBe(lines[n - 1].who);
        expect(l.cast, it.id).toBe(CAST[l.who]);
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

  it('pic choices are existing art with a Japanese label', () => {
    for (const it of BANK.filter((it) => it.type === 'pic'))
      for (const key of it.choices) {
        expect(existsSync(join(STATIC, 'art', `${key}.webp`)), `${it.id}: ${key}`).toBe(true);
        expect(PIC_JA[key], `${it.id}: ${key}`).toBeTruthy();
      }
    const used = new Set(BANK.filter((it) => it.type === 'pic').flatMap((it) => it.choices));
    expect(Object.keys(PIC_JA).filter((k) => !used.has(k))).toEqual([]);
  });

  it('every item of an offered level has its clip (and levels 1 and 2 a slow one) on disk and in clips.json', () => {
    // a level is offered (deck.ts LEVELS) only once all of its clips exist: level 4's wait for the neural cast
    expect(LEVELS).toEqual(expect.arrayContaining([1, 2, 3]));
    // (a dialogue's: one per line, `<id>-<n>`, once its level offers dialogues)
    for (const it of BANK) {
      if ((!LEVELS.includes(it.lv) || (isDialogue(it) && !MIX[it.lv]?.[it.type])) && !clipIds(it).some((id) => CLIPS[id])) continue;
      for (const id of clipIds(it)) {
        const c = CLIPS[id];
        expect(c, id).toBeDefined();
        expect(c.dur, id).toBeGreaterThan(0.5);
        // a PA's chime and hall add ~2.5 s; the アナウンス pack's announcements run longer
        expect(c.dur, id).toBeLessThan(it.lv === 5 ? 18 : channelOf(it) === 'pa' ? 11 : 8);
        expect(c.hash).toMatch(/^[0-9a-f]{8}$/);
        expect(existsSync(join(STATIC, 'audio/kikimimi', `${id}.m4a`)), id).toBe(true);
        const slow = it.lv <= 2;
        expect(Boolean(c.slow), id).toBe(slow);
        expect(existsSync(join(STATIC, 'audio/kikimimi', `${id}-slow.m4a`)), id).toBe(slow);
      }
    }
    const ids = new Set(BANK.flatMap((it) => clipIds(it)));
    expect(Object.keys(CLIPS).filter((id) => !ids.has(id))).toEqual([]);
  });

  it('ships no other files, and the clips stay small (each under 60 KB, all under 8 MB)', () => {
    const dir = join(STATIC, 'audio/kikimimi');
    const want = new Set(BANK.flatMap((it) => clipIds(it).flatMap((id) => [`${id}.m4a`, ...(it.lv <= 2 ? [`${id}-slow.m4a`] : [])])));
    const files = readdirSync(dir);
    expect(files.filter((f) => !want.has(f))).toEqual([]);
    const sizes = files.map((f) => statSync(join(dir, f)).size);
    for (const s of sizes) expect(s).toBeLessThan(60 * 1024);
    expect(sizes.reduce((a, b) => a + b, 0)).toBeLessThan(8 * 1024 * 1024);
  });
});
