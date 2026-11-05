// ききみみ's staging (docs/kikimimi.md "Visuals"): every scene's backdrop on disk at 1x / 2x / 3x and in the art
// manifest, level 4's items each staged (a known scene or none, a valid channel), the sound marks landing on their words,
// and the line as SoundLine renders it.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { art } from '#lib/art.ts';
import { BANK, CHANNELS, SCENE_IDS, channelOf, isDialogue, type SoundMark } from './bank.ts';
import { MARKS, PLACES } from './staging.ts';
import { findWords, markKinds, placeMark, soundLine, wordSpans } from './marks.ts';

const STATIC = join(import.meta.dirname, '../../../static');
const SCRIPT = JSON.parse(readFileSync(join(import.meta.dirname, '../../../scripts/scenes/scenes.json'), 'utf8')) as { scenes: Record<string, string> };
const L4 = BANK.filter((it) => it.lv === 4);

describe('kikimimi scenes', () => {
  it('every scene has its three webps, its manifest entry at the card size, and its prompt', () => {
    expect(Object.keys(SCRIPT.scenes).sort()).toEqual([...SCENE_IDS].sort());
    for (const id of SCENE_IDS) {
      for (const s of ['', '@2x', '@3x']) expect(existsSync(join(STATIC, `art/scene/${id}${s}.webp`)), `${id}${s}`).toBe(true);
      expect(art(`scene/${id}`), id).toMatchObject({ w: 393, h: 224 });
    }
  });

  it('every level-4 item is staged: a known scene or none, a valid channel', () => {
    expect(Object.keys(PLACES).sort()).toEqual(L4.map((it) => it.id).sort());
    for (const it of L4) {
      if (it.scene) expect(SCENE_IDS, it.id).toContain(it.scene);
      expect(CHANNELS, it.id).toContain(channelOf(it));
      // a channel written out only where the conditions don't already give it
      if (it.channel) expect(channelOf({ tags: it.tags }), it.id).not.toBe(it.channel);
    }
    // each frame and most scenes in use
    for (const c of CHANNELS) expect(L4.some((it) => channelOf(it) === c), c).toBe(true);
    for (const s of SCENE_IDS) expect(L4.some((it) => it.scene === s), s).toBe(true);
    expect(L4.filter((it) => it.scene).length / L4.length).toBeGreaterThan(0.8);
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

  it('every level-4 item and line with a tts respelling has marks, and only those (by their clip ids)', () => {
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
