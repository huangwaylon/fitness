// ききみみ's staging (docs/kikimimi.md "Visuals"): every scene's backdrop on disk at 1x / 2x / 3x and in the art
// manifest, level 4's items each staged (a known scene or none, a valid channel), the sound marks landing on their words,
// and the line as SoundLine renders it.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { art } from '#lib/art.ts';
import { CHANNELS, SCENE_IDS, channelOf, isDialogue, type SoundMark } from './bank.ts';
import { BANK } from './source.ts';
import { MARKS, NOISE, PLACES } from './staging.ts';
import { CONTENT } from './content/index.ts';
import { findWords, markKinds, placeMark, soundLine, wordSpans } from './marks.ts';
import { wordTimes, type Clip } from './clips.ts';
import clipsJson from './clips.json';
import { RUNG_ITEMS } from './ladders.ts';
import aligned from './words.json';
import { loadAll } from './pool.ts';
import { unitItems } from './compile.ts';

const CLIPS: Readonly<Record<string, Clip>> = clipsJson;

// (the compiled levels' chunks: decks and clips read the loaded ones, pool.ts)
await loadAll();

const STATIC = join(import.meta.dirname, '../../../static');
const SCRIPT = JSON.parse(readFileSync(join(import.meta.dirname, '../../../scripts/scenes/scenes.json'), 'utf8')) as { scenes: Record<string, string> };
/** Levels 4-7 (5 the アナウンス pack): the staged levels. */
const L4 = BANK.filter((it) => it.lv >= 4);
/** The content sprint's sets stage their own items (content/): the older banks' staging is PLACES / MARKS / NOISE. */
const OWN = new Set(CONTENT.map((it) => it.id));

describe('kikimimi scenes', () => {
  it('every scene has its three webps, its manifest entry at the card size, and its prompt', () => {
    expect(Object.keys(SCRIPT.scenes).sort()).toEqual([...SCENE_IDS].sort());
    for (const id of SCENE_IDS) {
      for (const s of ['', '@2x', '@3x']) expect(existsSync(join(STATIC, `art/scene/${id}${s}.webp`)), `${id}${s}`).toBe(true);
      expect(art(`scene/${id}`), id).toMatchObject({ w: 393, h: 224 });
    }
  });

  it('every level-4 to level-7 item is staged: a known scene or none, a valid channel', () => {
    expect(Object.keys(PLACES).sort()).toEqual(L4.filter((it) => !OWN.has(it.id)).map((it) => it.id).sort());
    // the sets' items carry theirs, never in the tables too
    for (const t of [PLACES, MARKS, NOISE]) expect(Object.keys(t).filter((id) => OWN.has(id.replace(/-\d+$/, '')) || OWN.has(id))).toEqual([]);
    for (const it of L4) {
      if (it.scene) expect(SCENE_IDS, it.id).toContain(it.scene);
      expect(CHANNELS, it.id).toContain(channelOf(it));
      // a channel written out only where the conditions don't already give it
      if (it.channel) expect(channelOf({ tags: it.tags }), it.id).not.toBe(it.channel);
    }
    // each frame and most scenes in use
    for (const c of CHANNELS) expect(L4.some((it) => channelOf(it) === c), c).toBe(true);
    for (const s of SCENE_IDS) expect(L4.some((it) => it.scene === s), s).toBe(true);
    // (ほし, level 7, is broadcast: radio, podcasts and TV on the plain stage)
    const scened = L4.filter((it) => it.lv !== 7);
    expect(scened.filter((it) => it.scene).length / scened.length).toBeGreaterThan(0.8);
    // levels 1-3 keep the plain stage
    expect(BANK.filter((it) => it.lv < 4 && (it.scene || it.channel || it.marks))).toEqual([]);
  });

  it('a channel by the conditions: a call or voicemail a phone, a PA, a video call, else face to face', () => {
    expect(channelOf({ tags: { seed: 1, register: 'friend', pragmatic: 'literal', conditions: ['voicemail'] } })).toBe('phone');
    expect(channelOf({ tags: { seed: 1, register: 'official', pragmatic: 'literal', conditions: ['pa', 'station'] } })).toBe('pa');
    expect(channelOf({ tags: { seed: 1, register: 'colleague', pragmatic: 'literal', conditions: ['video'] } })).toBe('video');
    expect(channelOf({})).toBe('live');
    expect(channelOf({ channel: 'pa', tags: { seed: 1, register: 'friend', pragmatic: 'literal' } })).toBe('pa');
  });
});

describe('kikimimi sound marks', () => {
  /** Every clip's text and marks: an item's, or each dialogue line's. */
  const clips = L4.flatMap((it) => (isDialogue(it) ? it.lines.map((l, n) => ({ id: `${it.id}-${n + 1}`, en: l.en, tts: l.tts, marks: l.marks })) : [{ id: it.id, en: it.en, tts: it.tts, marks: it.marks }]));

  it('every level-4 to level-7 item and line with a tts respelling has marks, and only those (by their clip ids)', () => {
    expect(clips.filter((c) => c.marks?.length && !c.tts).map((c) => c.id)).toEqual([]);
    expect(clips.filter((c) => c.tts && !c.marks?.length).map((c) => c.id)).toEqual([]);
    expect(Object.keys(MARKS).filter((id) => !clips.some((c) => c.id === id && c.tts))).toEqual([]);
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

  it('whole words only', () => {
    const gate = 'Flight 815 to Sydney is now boarding at gate 50. Sorry, gate 15.';
    expect(findWords(gate, '15')).toEqual([gate.lastIndexOf('15'), gate.lastIndexOf('15') + 2]);
    expect(findWords("You're kind of leaning. Behind you.", 'you')).toEqual([31, 34]);
    expect(findWords('That comes to £8.49. Do you', '£8.49')).toEqual([14, 19]);
    expect(findWords('nothing here', 'thing')).toBeNull();
    expect(wordSpans('Let me  in.')).toEqual([[0, 3], [4, 6], [8, 11]]);
  });

  it('the line as pieces: say runs grouped with the shape above, links as arcs, swallowed letters, stress once a word, the focus', () => {
    const marks: SoundMark[] = [['say', 'Let me', 'lemme'], ['link', 'pull up'], ['drop', 'trying', 'g'], ['stress', 'pull']];
    const gs = soundLine('Let me just pull up trying.', 'pull up', marks);
    expect(gs.map((g) => g.say ?? null)).toEqual(['lemme', null]);
    expect(gs[0].segs.map((s) => s.t).join('')).toBe('Let me');
    const rest = gs[1].segs;
    expect(rest.map((s) => s.t).join('')).toBe(' just pull up trying.');
    expect(rest.find((s) => s.link)).toMatchObject({ t: ' ', w: -1 });
    expect(rest.filter((s) => s.focus).map((s) => s.t)).toEqual(['pull', ' ', 'up']);
    expect(rest.filter((s) => s.stress).map((s) => s.t)).toEqual(['pull']);
    expect(rest.filter((s) => s.drop)).toEqual([{ t: 'g', w: 5, drop: true }]);
    expect(rest.filter((s) => s.w === 5).map((s) => s.t)).toEqual(['tryin', 'g', '.']);
    // the text is whole, the words numbered as wordSpans counts them
    const all = gs.flatMap((g) => g.segs);
    expect(all.map((s) => s.t).join('')).toBe('Let me just pull up trying.');
    expect(Math.max(...all.map((s) => s.w))).toBe(wordSpans('Let me just pull up trying.').length - 1);
    expect(markKinds(marks)).toEqual(['say', 'link', 'drop', 'stress']);
    // a say ending inside a word's token (its punctuation outside the run)
    const p = soundLine('That comes to £8.49. Do you', undefined, [['say', '£8.49', 'eight forty-nine']]);
    expect(p.map((g) => g.segs.map((s) => s.t).join(''))).toEqual(['That comes to ', '£8.49', '. Do you']);
    expect(p[2].segs[0]).toEqual({ t: '.', w: 3 });
  });
});

describe('kikimimi karaoke timings', () => {
  const W = aligned as unknown as Record<string, [string, ...number[]]>;
  const texts = new Map([
    ...[...BANK, ...unitItems()].flatMap((it) => (isDialogue(it) ? it.lines.map((l, n) => [`${it.id}-${n + 1}`, l.en] as const) : [[it.id, it.en] as const])),
    ...RUNG_ITEMS.map((it) => [it.id, it.en] as const) // スピード はしご's rungs: the line at each speed
  ]);

  it('words.json: each current clip one start per shown word and its end, never backwards, within the clip', () => {
    for (const [id, [hash, ...cs]] of Object.entries(W)) {
      expect(texts.has(id), id).toBe(true);
      if (hash !== CLIPS[id]?.hash) continue; // re-spoken since: ignored (wordTimes) till scripts/kikimimi-words.ts runs
      expect(cs.length, id).toBe(wordSpans(texts.get(id)!).length + 1);
      for (let k = 1; k < cs.length; k++) expect(cs[k], id).toBeGreaterThanOrEqual(cs[k - 1]);
      expect(cs.at(-1)! / 100, id).toBeCloseTo(CLIPS[id].dur, 1);
    }
  });

  it('wordTimes: the aligned starts for the current clip, else the clip spread over the words', () => {
    const id = Object.keys(W).find((k) => W[k][0] === CLIPS[k]?.hash)!;
    expect(wordTimes(id, texts.get(id)!)).toEqual(W[id].slice(1).map((c) => (c as number) / 100));
    const t = wordTimes('no-such-clip', 'One two, three.');
    expect(t).toHaveLength(4);
    expect(t[0]).toBe(0);
    expect(t.at(-1)).toBe(2);
    expect(t[1]).toBeLessThan(t[2]);
  });
});
