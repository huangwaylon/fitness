import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROSTER } from '#lib/villagers/roster.ts';
import { villagerArt } from '#lib/art.ts';
import { DIALOGUE_TYPES, PIC_JA, channelOf, clipIds, isDialogue, jaLines, splitFocus, type Item, type ItemType, type Level } from './bank.ts';
import { BANK } from './source.ts';
import { CAST } from './bank4.ts';
import { LEVELS, MIX } from './deck.ts';
import { mixes, unitItems } from './compile.ts';
import type { Clip } from './clips.ts';
import clipsJson from './clips.json';
import { DIALOGUES } from './dialogues.ts';
import { RUNG_ITEMS } from './ladders.ts';

const CLIPS: Readonly<Record<string, Clip>> = clipsJson;
/** The units' own items (app/content/units/*.yaml), voiced beside the bank's (their units' status: units.test). */
const UNIT_ITEMS = unitItems();

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
  it('has unique, file-safe ids', () => {
    const ids = BANK.map((it) => it.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('has at least 40 items per level, enough of each type for a game', () => {
    // the fixed counts: levels 1-3's first bank; level 4 bank4.ts 67 + dialogues.ts 24 + もり's 85 + 85 (content/); level 5
    // the アナウンス pack; 6 やま's 100 + 100; 7 ほし's 115
    const count = (lv: Level) => BANK.filter((it) => it.lv === lv).length;
    expect([1, 2, 3, 4, 5, 6, 7].map((lv) => count(lv as Level))).toEqual([46, 49, 49, 261, 30, 200, 115]);
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

  it('accents: American at levels 1-3 (US only), levels 4-7 by their villagers’ cast voices', () => {
    const all = ['us', 'uk', 'au'];
    const allowed: Partial<Record<Level, string[]>> = { 1: ['us'], 2: ['us'], 3: ['us'], 4: all, 5: all, 6: all, 7: all };
    for (const it of BANK) expect(allowed[it.lv], it.id).toContain(it.voice);
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

  it('levels 4-7: a cast voice of its accent and its speaker’s gender, one per villager, all 12 used', () => {
    const l4 = BANK.filter((it) => it.lv >= 4);
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

  it('dialogues: 24 + 30 at level 4, 40 at 6, 25 at 7 (gist and next), 2-4 lines between two villagers taking turns, each with its cast voice, its Japanese and its spoken text', () => {
    expect(DIALOGUES).toHaveLength(24);
    expect(DIALOGUES.filter((it) => it.type === 'gist')).toHaveLength(12);
    expect(DIALOGUES.filter((it) => it.type === 'next')).toHaveLength(12);
    const dialogues = BANK.filter(isDialogue);
    expect([4, 5, 6, 7].map((lv) => dialogues.filter((it) => it.lv === lv).length)).toEqual([54, 0, 40, 25]);
    for (const it of dialogues) {
      expect(DIALOGUE_TYPES, it.id).toContain(it.type);
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
        expect(c.dur, id).toBeLessThan(clipCap(it));
        expect(c.hash).toMatch(/^[0-9a-f]{8}$/);
        expect(existsSync(join(STATIC, 'audio/kikimimi', `${id}.m4a`)), id).toBe(true);
        const slow = it.lv <= 2;
        expect(Boolean(c.slow), id).toBe(slow);
        expect(existsSync(join(STATIC, 'audio/kikimimi', `${id}-slow.m4a`)), id).toBe(slow);
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
        expect(existsSync(join(STATIC, 'audio/kikimimi', `${id}.m4a`)), id).toBe(true);
        expect(c.slow, id).toBeUndefined();
      }
    }
    // (and スピード はしご's rungs: ladder.test)
    const ids = new Set([...[...BANK, ...UNIT_ITEMS].flatMap((it) => clipIds(it)), ...RUNG_ITEMS.map((it) => it.id)]);
    expect(Object.keys(CLIPS).filter((id) => !ids.has(id))).toEqual([]);
  });

  it('ships no other files, and the clips stay small (each under 60 KB; level 4’s 80 KB, the アナウンス pack’s and やま’s 100 KB, ほし’s 2-4 sentences 160 KB, a ladder rung 80 KB; all under 40 MB)', () => {
    const dir = join(STATIC, 'audio/kikimimi');
    const rungs = new Set(RUNG_ITEMS.map((it) => `${it.id}.m4a`));
    const want = new Set([...[...BANK, ...UNIT_ITEMS].flatMap((it) => clipIds(it).flatMap((id) => [`${id}.m4a`, ...(it.lv <= 2 ? [`${id}-slow.m4a`] : [])])), ...rungs]);
    const files = readdirSync(dir);
    expect(files.filter((f) => !want.has(f))).toEqual([]);
    const sizes = files.map((f) => statSync(join(dir, f)).size);
    // (a ladder rung is a whole 5-9 s line, slowed at its foot: 2 a game, 8 clips, ~280 KB fetched in the lobby)
    const lvOf = new Map([...BANK, ...UNIT_ITEMS].flatMap((it) => clipIds(it).map((id) => [`${id}.m4a`, it.lv])));
    const kb = (f: string) => (rungs.has(f) ? 80 : ({ 4: 80, 5: 100, 6: 100, 7: 160 } as Partial<Record<Level, number>>)[lvOf.get(f)!] ?? 60);
    for (const [k, f] of files.entries()) expect(sizes[k], f).toBeLessThan(kb(f) * 1024);
    // (raised from 14 MB for the content sprint's ~700 clips; increment 9 moves the audio into packs)
    expect(sizes.reduce((a, b) => a + b, 0)).toBeLessThan(40 * 1024 * 1024);
  });
});
