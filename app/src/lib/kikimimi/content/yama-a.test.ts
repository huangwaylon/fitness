// やま set A (content/yama-a.ts): its items and dialogues checked with bank.test's and staging.test's rules (ids,
// speakers and cast voices, the named-villager rule, choices, word and focus rules, tags and notes, `tts`, dialogue
// turns, scenes, channels and sound marks), plus this set's own: the prefixes, the counts, the level placeholder, no
// clash with the bank.
import { describe, expect, it } from 'vitest';
import { ROSTER } from '#lib/villagers/roster.ts';
import { villagerArt } from '#lib/art.ts';
import { BANK, CHANNELS, SCENE_IDS, channelOf, clipIds, isDialogue, jaLines, splitFocus, type Item, type ItemType } from '../bank.ts';
import { CAST } from '../bank4.ts';
import { placeMark } from '../marks.ts';
import { DIALOGUES, ITEMS } from './yama-a.ts';

const ALL: readonly Item[] = [...ITEMS, ...DIALOGUES];
const words = (s: string) => s.toLowerCase().match(/[a-z0-9',]+/g) ?? [];
const has = (en: string, phrase: string) => ` ${words(en).join(' ')} `.includes(` ${words(phrase).join(' ')} `);
const DIGIT = /[0-9£$¥%]/;

describe('kikimimi やま set A', () => {
  it('80 items and 20 dialogues (10 gist, 10 next), all at the placeholder level 5, a mix of every type', () => {
    expect(ITEMS).toHaveLength(80);
    expect(DIALOGUES).toHaveLength(20);
    expect(DIALOGUES.filter((it) => it.type === 'gist')).toHaveLength(10);
    expect(DIALOGUES.filter((it) => it.type === 'next')).toHaveLength(10);
    expect(ITEMS.filter(isDialogue)).toEqual([]);
    expect(DIALOGUES.every(isDialogue)).toBe(true);
    for (const t of ['reply', 'mean', 'word', 'num'] as ItemType[]) expect(ITEMS.filter((it) => it.type === t).length, t).toBeGreaterThanOrEqual(12);
    for (const it of ALL) expect(it.lv, it.id).toBe(5);
  });

  it('unique, file-safe ids with this set’s prefixes, clashing with nothing in the bank (clip ids too)', () => {
    for (const it of ITEMS) expect(it.id).toMatch(/^ya-[a-z0-9]+(-[a-z0-9]+)*$/);
    for (const it of DIALOGUES) expect(it.id).toMatch(/^dya-[a-z0-9]+(-[a-z0-9]+)*$/);
    const clips = [...BANK, ...ALL].flatMap((it) => clipIds(it));
    expect(new Set(clips).size).toBe(clips.length);
    const seen = new Set(BANK.map((it) => it.en));
    for (const it of ALL) expect(seen.has(it.en), `${it.id}: same line as the bank`).toBe(false);
  });

  it('speakers are roster villagers with art, never the host, each with their cast voice (accent, gender)', () => {
    for (const it of ALL) {
      expect(ROSTER[it.speaker], it.id).toBeDefined();
      expect(villagerArt(it.speaker, true), it.id).not.toBeNull();
      expect(it.speaker).not.toBe('isabelle');
      expect(it.cast, it.id).toBe(CAST[it.speaker]);
      expect(it.cast!.slice(0, 2), it.id).toBe(it.voice);
      expect(it.cast![3], it.id).toBe(ROSTER[it.speaker].gender);
    }
    // mostly US, some UK and AU; many speakers
    const n = (a: string) => ALL.filter((it) => it.voice === a).length;
    expect(n('us')).toBeGreaterThan(n('uk') + n('au'));
    expect(n('uk')).toBeGreaterThan(0);
    expect(n('au')).toBeGreaterThan(0);
    const who = new Set(ALL.flatMap((it) => (isDialogue(it) ? it.lines.map((l) => l.who) : [it.speaker])));
    expect(who.size).toBeGreaterThanOrEqual(35);
  });

  // bank.test's rule: a villager named in the clip is named in the Japanese as heard (here only Sydney, the city)
  const EN_KANA: Record<string, string> = { Raymond: 'レイモンド', Sydney: 'シドニー', Bunnie: 'バニー' };
  it('a villager named in the English is named in the Japanese as heard', () => {
    const named = Object.values(ROSTER).map((r) => ({ ...r, re: new RegExp(`\\b${r.nameEn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`) }));
    for (const it of ALL) {
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

  it('choices: 3, distinct, the answer in range; the Japanese on one line, a reply and a mean on two', () => {
    for (const it of ALL) {
      expect(it.choices.length, it.id).toBe(3);
      expect(new Set(it.choices).size, it.id).toBe(3);
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

  it('a word item: its answer and focus in the sentence, the other choices not', () => {
    for (const it of ITEMS.filter((it) => it.type === 'word')) {
      expect(it.focus, it.id).toBeDefined();
      expect(has(it.en, it.focus!), it.id).toBe(true);
      expect(words(it.focus!)).toEqual(words(it.choices[it.answer]));
      for (const [i, c] of it.choices.entries()) if (i !== it.answer) expect(has(it.en, c), `${it.id}: ${c}`).toBe(false);
    }
  });

  it('every focus is in its sentence; all but word and reply say what to listen for', () => {
    for (const it of ALL) {
      if (it.focus) expect(it.en, it.id).toContain(it.focus);
      if (it.type !== 'word' && it.type !== 'reply') expect(it.ask, it.id).toBeTruthy();
    }
  });

  it('a scenario (seed 1-66, register, pragmatics), a note ≤ 40 字, Japanese', () => {
    for (const it of ALL) {
      expect(Number.isInteger(it.tags?.seed) && it.tags!.seed >= 1 && it.tags!.seed <= 66, it.id).toBe(true);
      expect(it.tags!.register && it.tags!.pragmatic, it.id).toBeTruthy();
      expect(it.note, it.id).toBeTruthy();
      expect([...it.note!].length, `${it.id}: ${it.note}`).toBeLessThanOrEqual(40);
      expect(it.ja, it.id).toMatch(/[ぁ-んァ-ン一-龯]/);
    }
    // variety: many seeds, every register but broadcast's, most pragmatic layers
    expect(new Set(ALL.map((it) => it.tags!.seed)).size).toBeGreaterThanOrEqual(30);
    expect(new Set(ALL.map((it) => it.tags!.pragmatic)).size).toBeGreaterThanOrEqual(9);
  });

  it('what’s spoken: only when it differs from `en`, never a digit or symbol; numbers in `en` always written out', () => {
    for (const it of ITEMS) {
      if (it.tts) {
        expect(it.tts, it.id).not.toBe(it.en);
        expect(it.tts, it.id).not.toMatch(DIGIT);
        expect(it.tts.trim(), it.id).toBe(it.tts);
      }
      if (DIGIT.test(it.en)) expect(it.tts, it.id).toBeTruthy();
    }
  });

  it('dialogues: 2-4 lines, two villagers taking turns with their own voices, numbers written out, the focus in one line', () => {
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
          expect(l.tts, it.id).not.toMatch(DIGIT);
        }
        if (DIGIT.test(l.en)) expect(l.tts, `${it.id} line ${n + 1}: numbers written out`).toBeTruthy();
      }
      expect(it.en, it.id).toBe(lines.map((l) => l.en).join(' '));
      expect(it.speaker, it.id).toBe(lines[0].who);
      expect(lines.filter((l) => l.en.includes(it.focus!)).length, `${it.id}: ${it.focus}`).toBe(1);
      expect(it.tts, it.id).toBeUndefined();
    }
  });

  it('staged: a known scene or none, a valid channel, written out only where the conditions don’t give it', () => {
    for (const it of ALL) {
      if (it.scene) expect(SCENE_IDS, it.id).toContain(it.scene);
      expect(CHANNELS, it.id).toContain(channelOf(it));
      if (it.channel) expect(channelOf({ tags: it.tags }), it.id).not.toBe(it.channel);
    }
    expect(ALL.filter((it) => it.scene).length / ALL.length).toBeGreaterThan(0.8);
  });

  const clips = ALL.flatMap((it) => (isDialogue(it) ? it.lines.map((l, n) => ({ id: `${it.id}-${n + 1}`, en: l.en, tts: l.tts, marks: l.marks })) : [{ id: it.id, en: it.en, tts: it.tts, marks: it.marks }]));

  it('sound marks: on every item and line with a tts respelling, and only those', () => {
    expect(clips.filter((c) => c.tts && !c.marks?.length).map((c) => c.id)).toEqual([]);
    expect(clips.filter((c) => c.marks && !c.tts).map((c) => c.id)).toEqual([]);
  });

  it('every mark lands on whole words of its line; say runs never overlap', () => {
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
});
