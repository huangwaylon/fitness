// 聞き取りチャレンジ's lines as the build makes them (catch-build.ts): chunks for an A2 ear, distractors never homophones
// nor the line's own chunks, a line only where every word is in the captions near its segment within 6 s, and the
// library's real lines (english-captions/) checked whole.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { captionWords, catchLinesOf, chunksOf, distractorsOf, locate, MAX_SPAN, MAX_TILES, plainLine, quoteOf, wordsIn } from './catch-build.ts';
import { CLIPS } from './clips/index.ts';
import type { Clip, Question } from './types.ts';

const json3 = (words: [string, number][]) => ({ events: [{ tStartMs: 0, segs: words.map(([w, t]) => ({ utf8: ` ${w}`, tOffsetMs: t * 1000 })) }] });

describe('words and chunks', () => {
  it('drops punctuation, lower-cases the first word unless I or a name', () => {
    expect(wordsIn('But I’m trying really hard.')).toEqual(['but', 'I’m', 'trying', 'really', 'hard']);
    expect(wordsIn('Rachel, sweetheart!')).toEqual(['Rachel', 'sweetheart']);
    expect(wordsIn('Lucy, I have something', new Set(['Lucy']))).toEqual(['Lucy', 'I', 'have', 'something']);
  });
  it('a weak word goes with the word after it; ≤ 6 tiles; ≥ 3', () => {
    expect(chunksOf(wordsIn('if I got a hundred dollar advance on my salary'))).toEqual(['if I', 'got', 'a hundred', 'dollar', 'advance', 'on my salary']);
    expect(chunksOf(['does', 'anybody', 'need', 'coffee'])).toEqual(['does', 'anybody', 'need', 'coffee']);
    expect(chunksOf(['to', 'the', 'park'])).toEqual(['to', 'the', 'park']);
    for (const l of ['you know it’s not easy getting excited about stuff', 'I’ve sort of started this whole independent thing'])
      expect(chunksOf(wordsIn(l)).length).toBeLessThanOrEqual(MAX_TILES);
  });
  it('one speaker’s one sentence only; the one quote of `said`', () => {
    expect(plainLine('I *haven’t told him* yet.')).toBe('I haven’t told him yet.');
    for (const l of ['A — B', 'wait… what', 'Terry: hi there you', 'Go. Now please', undefined]) expect(plainLine(l)).toBeNull();
    expect(quoteOf('「まだ話してない」と言う。')).toBe('まだ話してない');
    expect(quoteOf('「A」と言われ「B」と返す')).toBeNull();
  });
});

describe('distractors', () => {
  it('1 for ≤ 4 chunks, 2 above; a near pair swapped in, never a homophone nor its own chunk', () => {
    expect(distractorsOf(['I', 'can', 'see', 'it'], [], 0)).toEqual(["can't"]);
    const own = ['he', 'was', 'there', 'with', 'them', 'yesterday'];
    const two = distractorsOf(own, ['some other words here'], 3);
    expect(two).toHaveLength(2);
    for (const d of two) expect(own).not.toContain(d);
    expect(distractorsOf(['to', 'your', 'four'], [], 0).some((d) => ['too', "you're", 'for'].includes(d))).toBe(false);
  });
});

describe('a clip’s lines', () => {
  const q = (o: Partial<Question>): Question => ({ id: 'x1', skill: 'dict', level: 'B1', point: 'p', seg: [10, 14], stem: 's', cue: 'c', said: '「まだ言ってない」と言う。', mean: 'm', trap: 't', use: 'u', line: 'I *haven’t told him* yet.', ...o });
  const clip = (qs: Question[]): Clip => ({ id: 'k', video: 'v', title: 'T', dur: 60, wpm: 150, band: 'mid', tags: [], show: 'Friends', credit: 'c', questions: qs });
  const cw = captionWords(json3([['so', 9.5], ['i', 10.2], ['havent', 10.5], ['told', 10.8], ['him', 11], ['yet', 11.3], ['okay', 13]]));
  it('found in the captions: its segment cut to the words, chunks timed', () => {
    const [l] = catchLinesOf(clip([q({})]), cw);
    expect(l).toMatchObject({ q: 'x1', seg: [9.9, 11.9], tiles: ['I', 'haven’t', 'told', 'him', 'yet'], t: [10.2, 10.5, 10.8, 11, 11.3], ja: 'まだ言ってない' });
    expect(l.x.length).toBe(2);
  });
  it('none: a word not in the captions, said over > 6 s, twice nearby, retired, or no quote', () => {
    expect(catchLinesOf(clip([q({ line: 'I *haven’t asked him* yet.' })]), cw)).toEqual([]);
    expect(catchLinesOf(clip([q({ retired: true })]), cw)).toEqual([]);
    expect(catchLinesOf(clip([q({ said: '言っていない。' })]), cw)).toEqual([]);
    const slow = captionWords(json3([['i', 10], ['havent', 12], ['told', 14], ['him', 16], ['yet', 17]]));
    expect(catchLinesOf(clip([q({})]), slow)).toEqual([]);
    const twice = captionWords(json3([['i', 9], ['know', 9.3], ['that', 9.6], ['i', 12], ['know', 12.3], ['that', 12.6]]));
    expect(locate(['I', 'know', 'that'], twice, [10, 14])).toBeNull();
  });
  it('the library: every line 3–6 tiles, said within 6 s, inside its clip, with distractors and Japanese', () => {
    const dir = join(process.cwd(), '../english-captions/');
    if (!existsSync(dir)) return; // (a checkout without english-captions/: the build makes none either)
    let n = 0;
    for (const c of CLIPS) {
      const f = `${dir}${c.video}.en.json3`;
      if (!existsSync(f)) continue;
      for (const l of catchLinesOf(c, captionWords(JSON.parse(readFileSync(f, 'utf8'))))) {
        n++;
        expect(l.tiles.length, `${c.id}/${l.q}`).toBeGreaterThanOrEqual(3);
        expect(l.tiles.length).toBeLessThanOrEqual(MAX_TILES);
        expect(l.t).toHaveLength(l.tiles.length);
        expect(l.seg[1] - l.seg[0]).toBeLessThanOrEqual(MAX_SPAN + 0.5);
        expect(l.seg[1]).toBeLessThanOrEqual(c.dur + 1);
        expect(l.x.length).toBeGreaterThanOrEqual(1);
        for (const x of l.x) expect(l.tiles.map((t) => t.toLowerCase())).not.toContain(x.toLowerCase());
        expect(l.ja).toMatch(/\S/);
      }
    }
    expect(n).toBeGreaterThan(500);
  }, 60_000);
});
