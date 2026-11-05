// ききみみ 「やま」 set B (content/yama-b.ts): the bank's rules (bank.test.ts, staging.test.ts, the dialogue checks) applied
// to this set before it's wired in, plus its own: 80 single items and 20 dialogues, every family covered, the three
// accents with US the most, speakers spread over the roster, a clip short enough to stay under 8 s.
import { describe, expect, it } from 'vitest';
import { ROSTER } from '#lib/villagers/roster.ts';
import { villagerArt } from '#lib/art.ts';
import { BANK, CHANNELS, SCENE_IDS, channelOf, clipIds, isDialogue, jaLines, splitFocus, type ItemType } from '../bank.ts';
import { CAST } from '../bank4.ts';
import { CAST_IDS } from '../speech.ts';
import { placeMark } from '../marks.ts';
import { CAST_YB, DIALOGUES, FAMILY, ITEMS } from './yama-b.ts';

const ALL = [...ITEMS, ...DIALOGUES];
const VOICES = { ...CAST, ...CAST_YB };
const words = (s: string) => s.toLowerCase().match(/[a-z0-9',]+/g) ?? [];
const has = (en: string, phrase: string) => ` ${words(en).join(' ')} `.includes(` ${words(phrase).join(' ')} `);
const DIGIT = /[0-9£$¥%]/;

describe('kikimimi やま set B', () => {
  it('80 single items and 20 dialogues (10 gist, 10 next), level 5 until the integrator assigns one', () => {
    expect(ITEMS).toHaveLength(80);
    expect(ITEMS.filter(isDialogue)).toEqual([]);
    expect(DIALOGUES).toHaveLength(20);
    expect(DIALOGUES.filter((it) => it.type === 'gist')).toHaveLength(10);
    expect(DIALOGUES.filter((it) => it.type === 'next')).toHaveLength(10);
    for (const it of ALL) expect(it.lv, it.id).toBe(5);
    const n = (t: ItemType) => ITEMS.filter((it) => it.type === t).length;
    for (const t of ['word', 'num', 'reply', 'mean'] as const) expect(n(t), t).toBeGreaterThanOrEqual(15);
  });

  it('unique, file-safe ids with the set prefix, no clash with the bank or between clips', () => {
    const ids = ALL.map((it) => it.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const it of ITEMS) expect(it.id).toMatch(/^yb-[a-z0-9]+(-[a-z0-9]+)*$/);
    for (const it of DIALOGUES) expect(it.id).toMatch(/^dyb-[a-z0-9]+(-[a-z0-9]+)*$/);
    const clips = [...BANK, ...ALL].flatMap((it) => clipIds(it));
    expect(new Set(clips).size).toBe(clips.length);
    const heard = new Set(BANK.map((it) => it.en));
    for (const it of ALL) expect(heard.has(it.en), it.id).toBe(false);
  });

  it('every family is covered; every item has one', () => {
    const fams = new Set(Object.values(FAMILY));
    expect(fams.size).toBe(12);
    for (const it of ALL) expect(FAMILY[it.id], it.id).toBeTruthy();
    for (const f of fams) expect(ALL.filter((it) => FAMILY[it.id] === f).length, f).toBeGreaterThanOrEqual(7);
  });

  it('speakers: roster villagers with art (never しずえ), a cast voice of their gender, CAST_YB only new villagers', () => {
    for (const [id, c] of Object.entries(CAST_YB)) {
      expect(CAST[id as keyof typeof CAST], `${id} is in CAST already`).toBeUndefined();
      expect(CAST_IDS, id).toContain(c);
      expect(c![3], id).toBe(ROSTER[id as keyof typeof ROSTER].gender);
    }
    const who = ALL.flatMap((it) => (isDialogue(it) ? it.lines.map((l) => [it.id, l.who, l.cast] as const) : [[it.id, it.speaker, it.cast!] as const]));
    for (const [id, s, c] of who) {
      expect(ROSTER[s], id).toBeDefined();
      expect(villagerArt(s, true), id).not.toBeNull();
      expect(s).not.toBe('isabelle');
      expect(c, id).toBe(VOICES[s]);
      expect(c[3], id).toBe(ROSTER[s].gender);
    }
    for (const it of ALL) expect(it.voice, it.id).toBe(it.cast!.slice(0, 2));
    // spread: many villagers, none carrying the set, every new voice used
    const count = new Map<string, number>();
    for (const [, s] of who) count.set(s, (count.get(s) ?? 0) + 1);
    expect(count.size).toBeGreaterThanOrEqual(45);
    for (const [s, k] of count) expect(k, s).toBeLessThanOrEqual(6);
    for (const id of Object.keys(CAST_YB)) expect(count.has(id), id).toBe(true);
    expect(new Set(who.map(([, , c]) => c)).size).toBe(12);
  });

  it('accents: all three, US the most, UK and AU a real share', () => {
    const by = (a: string) => ALL.filter((it) => it.voice === a).length;
    expect(by('us')).toBeGreaterThan(by('uk'));
    expect(by('us')).toBeGreaterThan(by('au'));
    expect(by('uk')).toBeGreaterThanOrEqual(15);
    expect(by('au')).toBeGreaterThanOrEqual(12);
  });

  it('no villager is named in the English (the bank would need their katakana)', () => {
    const names = Object.values(ROSTER).map((r) => new RegExp(`\\b${r.nameEn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`));
    for (const it of ALL) {
      const heard = [it.en, ...(it.type === 'reply' ? [it.choices[it.answer]] : [])].join(' ');
      for (const re of names) expect(re.test(heard), `${it.id}: ${re}`).toBe(false);
    }
  });

  it('answers in range, choices distinct, 3 each; the Japanese as shown (reply, mean on two lines)', () => {
    for (const it of ALL) {
      expect(it.choices.length, it.id).toBe(3);
      expect(new Set(it.choices).size, it.id).toBe(3);
      expect(it.answer, it.id).toBe(0);
      expect(it.en.trim(), it.id).toBe(it.en);
      expect(splitFocus(it).join(''), it.id).toBe(it.en);
      const two = it.type === 'reply' || it.type === 'mean';
      expect(jaLines(it).length, it.id).toBe(two ? 2 : 1);
      expect(it.ja.split('→').length, it.id).toBe(two ? 2 : 1);
      if (it.type === 'reply') expect(jaLines(it)[1], it.id).toMatch(/^→ 「.+」$/);
      if (it.type === 'mean') expect(jaLines(it)[1], it.id).toMatch(/^→ つまり、/);
      expect(it.ja, it.id).toMatch(/[ぁ-んァ-ン一-龯]/);
    }
  });

  it('a word item: the answer and focus in the sentence, the other choices not', () => {
    for (const it of ITEMS.filter((it) => it.type === 'word')) {
      expect(has(it.en, it.focus!), it.id).toBe(true);
      expect(has(it.en, it.choices[it.answer]), it.id).toBe(true);
      expect(words(it.focus!)).toEqual(words(it.choices[it.answer]));
      for (const [i, c] of it.choices.entries()) if (i !== it.answer) expect(has(it.en, c), `${it.id}: ${c}`).toBe(false);
    }
  });

  it('every focus in its sentence; num, mean and the dialogues say what to listen for', () => {
    for (const it of ALL) {
      if (it.focus) expect(it.en, it.id).toContain(it.focus);
      if (it.type !== 'word' && it.type !== 'reply') expect(it.ask, it.id).toBeTruthy();
    }
  });

  it('a scenario (seed 1-66, register, pragmatics), a note ≤ 40 字', () => {
    for (const it of ALL) {
      expect(Number.isInteger(it.tags?.seed) && it.tags!.seed >= 1 && it.tags!.seed <= 66, it.id).toBe(true);
      expect(it.tags!.register && it.tags!.pragmatic, it.id).toBeTruthy();
      expect(it.note, it.id).toBeTruthy();
      expect([...it.note!].length, `${it.id}: ${it.note}`).toBeLessThanOrEqual(40);
    }
    // variety: most registers and pragmatic layers in use
    expect(new Set(ALL.map((it) => it.tags!.register)).size).toBeGreaterThanOrEqual(7);
    expect(new Set(ALL.map((it) => it.tags!.pragmatic)).size).toBeGreaterThanOrEqual(9);
  });

  it('what’s spoken: tts only when it differs, never a digit; every number written out; short enough for one clip', () => {
    const clips = ALL.flatMap((it) => (isDialogue(it) ? it.lines.map((l, n) => ({ id: `${it.id}-${n + 1}`, en: l.en, tts: l.tts, marks: l.marks })) : [{ id: it.id, en: it.en, tts: it.tts, marks: it.marks }]));
    for (const c of clips) {
      if (c.tts) {
        expect(c.tts, c.id).not.toBe(c.en);
        expect(c.tts, c.id).not.toMatch(DIGIT);
        expect(c.tts.trim(), c.id).toBe(c.tts);
      }
      if (DIGIT.test(c.en)) expect(c.tts, `${c.id}: numbers written out`).toBeTruthy();
      // ~5.5 syllables a second at most for B2+: about 26 words stays under the 8 s a clip may last
      expect((c.tts ?? c.en).split(/\s+/).length, c.id).toBeLessThanOrEqual(26);
    }
  });

  it('staged: a known scene or none, a channel only where the conditions don’t give it, most items with a scene', () => {
    for (const it of ALL) {
      if (it.scene) expect(SCENE_IDS, it.id).toContain(it.scene);
      expect(CHANNELS, it.id).toContain(channelOf(it));
      if (it.channel) expect(channelOf({ tags: it.tags }), it.id).not.toBe(it.channel);
    }
    expect(ALL.filter((it) => it.scene).length / ALL.length).toBeGreaterThan(0.8);
    for (const c of ['live', 'phone', 'video'] as const) expect(ALL.some((it) => channelOf(it) === c), c).toBe(true);
  });

  it('sound marks: on every clip with a tts respelling and only those, landing on whole words, say runs apart', () => {
    const clips = ALL.flatMap((it) => (isDialogue(it) ? it.lines.map((l, n) => ({ id: `${it.id}-${n + 1}`, en: l.en, tts: l.tts, marks: l.marks })) : [{ id: it.id, en: it.en, tts: it.tts, marks: it.marks }]));
    for (const c of clips) expect(Boolean(c.tts), c.id).toBe(Boolean(c.marks?.length));
    for (const it of DIALOGUES) expect(it.marks, it.id).toBeUndefined();
    for (const c of clips.filter((c) => c.marks)) {
      const taken = new Array<boolean>(c.en.length).fill(false);
      for (const m of c.marks!) {
        const at = placeMark(c.en, m);
        expect(at, `${c.id} ${m.join(' ')}`).not.toBeNull();
        if (m[0] === 'say') {
          const [a, b] = at![0];
          expect(taken.slice(a, b).some(Boolean), `${c.id} ${m[1]} overlaps`).toBe(false);
          taken.fill(true, a, b);
        }
        if (m[0] === 'link') expect(m[1], c.id).toContain(' ');
        if (m[0] === 'drop') expect(m[2].length, c.id).toBeLessThan(m[1].length);
      }
    }
  });

  it('dialogues: 2-4 lines, two villagers with two voices taking turns, the focus in one line', () => {
    for (const it of DIALOGUES) {
      const lines = it.lines!;
      expect(lines.length, it.id).toBeGreaterThanOrEqual(2);
      expect(lines.length, it.id).toBeLessThanOrEqual(4);
      expect(new Set(lines.map((l) => l.who)).size, it.id).toBe(2);
      expect(new Set(lines.map((l) => l.cast)).size, `${it.id}: two voices`).toBe(2);
      for (const [n, l] of lines.entries()) {
        if (n) expect(l.who, `${it.id} line ${n + 1}: a turn each`).not.toBe(lines[n - 1].who);
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
