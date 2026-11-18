import { describe, expect, it } from 'vitest';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { bareNoun, check, cheerOf, cleanGrade, diffWords, editDistance, formsOf, isSilence, longEnough, nextCheer, noteTip, onlySmall, recastOf, saidStars, say, targetUsed, tipOpens, tipsOf, TIP_MAX, type Grade } from './speak.ts';
import { notInTrimmedFont } from '../../../scripts/font-subsets.ts';
import { isGame, newGame } from './game.ts';
import { PICTURES } from './pictures.ts';

const answer = (o: Record<string, unknown> = {}) => ({ ok: true, verdict: 'tip', fixed: 'I like apples.', natural: 'I love apples.', also: '', tip: 'りんご全体の話なら apples だよ', used: true, src: 'ai', aiMs: 900, ...o });

describe('the speaking step', () => {
  it('edit distance', () => {
    expect(editDistance('boring', 'bowling')).toBe(2);
    expect(editDistance('cat', 'cat')).toBe(0);
    expect(editDistance('', 'abc')).toBe(3);
    expect(editDistance('kitten', 'sitting')).toBe(3);
  });
  it('a noun’s forms: plurals, regular and not', () => {
    expect(formsOf('dog')).toEqual(expect.arrayContaining(['dog', 'dogs']));
    expect(formsOf('box')).toContain('boxes');
    expect(formsOf('cherry')).toContain('cherries');
    expect(formsOf('knife')).toContain('knives');
    expect(formsOf('mouse')).toContain('mice');
  });
  it('the target used: its forms, a mishearing credited, not a different everyday word', () => {
    expect(targetUsed('I like apples.', 'apple')).toBe(true);
    expect(targetUsed('My APPLE is red', 'apple')).toBe(true);
    expect(targetUsed('I went bowling.', 'boring')).toBe(true);
    expect(targetUsed('I have two mice.', 'mouse')).toBe(true);
    expect(targetUsed('There is a cap.', 'cat')).toBe(true);
    expect(targetUsed('I like dogs.', 'cat')).toBe(false);
    expect(targetUsed('I want an orange.', 'ant')).toBe(false);
    expect(targetUsed('I like the color.', 'tie')).toBe(false);
    expect(targetUsed('I have a bat.', 'cat')).toBe(false);
    expect(targetUsed('', 'cat')).toBe(false);
  });
  it('Whisper on silence: no sentence (say it again), real sentences kept', () => {
    for (const t of ['', '  ', 'Thanks for watching!', 'Thank you.', 'you', 'Bye.', '[Music]', '♪', 'ありがとうございました', '...', 'Thank you for watching.'])
      expect(isSilence(t), t).toBe(true);
    for (const t of ['I like cats.', 'So tired today.', 'Thank you for the cake.', 'cat', 'I eat sushi すし'])
      expect(isSilence(t), t).toBe(false);
  });
  it('a bare noun phrase (no verb) only: casual sentences are fine', () => {
    expect(bareNoun('A big dog.', 'dog')).toBe(true);
    expect(bareNoun('apples', 'apple')).toBe(true);
    expect(bareNoun('My cute cats!', 'cat')).toBe(true);
    expect(bareNoun('So tired today.', 'dog')).toBe(false);
    expect(bareNoun('I like dogs.', 'dog')).toBe(false);
    expect(bareNoun('Dogs are cute.', 'dog')).toBe(false);
    expect(bareNoun('Dog, please.', 'dog')).toBe(false);
    expect(bareNoun('a dog in my house', 'dog')).toBe(false);
  });
  it('the task check: again, the word, a verb, then ok (the relay’s `used` credits the word too)', () => {
    expect(check('Thanks for watching!', 'cat')).toBe('again');
    expect(check('I like dogs.', 'cat')).toBe('target');
    expect(check('I like dogs.', 'cat', true)).toBe('ok');
    expect(check('a cat', 'cat')).toBe('verb');
    expect(check('I have a cat.', 'cat')).toBe('ok');
    expect(check('I went bowling yesterday.', 'boring')).toBe('ok');
  });
  it('the relay’s answer checked on the phone: tips with failure words or grammar terms dropped, also only on great', () => {
    expect(cleanGrade(answer(), 'I like apple.')).toEqual<Grade>({ verdict: 'tip', fixed: 'I like apples.', natural: 'I love apples.', also: '', tip: 'りんご全体の話なら apples だよ', used: true, src: 'ai' });
    for (const tip of ['a を忘れないでね', 'これは間違いです', '三人称なら has', 'apples'.repeat(3), 'あ'.repeat(TIP_MAX + 1)])
      expect(cleanGrade(answer({ tip }), 'I like apple.')!.tip, tip).toBe('');
    expect(cleanGrade(answer({ verdict: 'ok', also: 'I love apples.' }), 'I like apples.')!.also).toBe('');
    expect(cleanGrade(answer({ verdict: 'great', also: 'I really like apples.' }), 'I like apples.')!.also).toBe('I really like apples.');
    // a placeholder, an empty or a non-English fix: their own sentence
    for (const fixed of ['I like ...', '', 'りんごが好き', 'x'.repeat(120)]) expect(cleanGrade(answer({ fixed }), 'I like apple.')!.fixed).toBe('I like apple.');
    expect(cleanGrade({ ok: false, error: 'capped' }, 'x')).toBeNull();
    expect(cleanGrade(answer({ verdict: 'wrong' }), 'x')).toBeNull();
    expect(cleanGrade(null, 'x')).toBeNull();
    expect(cleanGrade(answer({ src: 'wasei' }), 'x')!.src).toBe('wasei');
  });
  it('their words against the recast: changed ones marked, case and punctuation aside', () => {
    const d = diffWords('i like apple', 'I like apples.');
    expect(d.mine).toEqual([{ w: 'i', changed: false }, { w: 'like', changed: false }, { w: 'apple', changed: true }]);
    expect(d.better.map((x) => x.changed)).toEqual([false, false, true]);
    const e = diffWords('He go to school yesterday.', 'He went to school yesterday.');
    expect(e.mine.filter((x) => x.changed).map((x) => x.w)).toEqual(['go']);
    expect(e.better.filter((x) => x.changed).map((x) => x.w)).toEqual(['went']);
    expect(diffWords('I have a umbrella', 'I have an umbrella').better.filter((x) => x.changed).map((x) => x.w)).toEqual(['an']);
    expect(diffWords('', 'Hi.').better).toEqual([{ w: 'Hi.', changed: true }]);
  });
  it('only articles or -s changed (やさしい: the recast, no tip)', () => {
    expect(onlySmall('I like apple', 'I like apples.')).toBe(true);
    expect(onlySmall('I have umbrella', 'I have an umbrella')).toBe(true);
    expect(onlySmall('He like dogs', 'He likes dogs')).toBe(true);
    expect(onlySmall('He go to school', 'He went to school')).toBe(false);
    expect(onlySmall('I like dog', 'I like the big dog')).toBe(false);
  });
  it('the recast: the fix, else the natural way, only when it differs', () => {
    const g = cleanGrade(answer(), 'I like apple.')!;
    expect(recastOf('I like apple.', g)).toBe('I like apples.');
    expect(recastOf('I like apples.', { ...g, verdict: 'ok' })).toBe('I love apples.');
    expect(recastOf('I like apples.', { ...g, verdict: 'great', natural: 'I love apples.' })).toBe('');
    expect(recastOf('I like apples', { ...g, natural: 'I like apples.' })).toBe('');
    expect(recastOf('x', null)).toBe('');
  });
  it('the tip opens by itself at most once in three sentences, each player’s own', () => {
    expect(tipOpens([])).toBe(true);
    expect(tipOpens([true])).toBe(false);
    expect(tipOpens([true, false])).toBe(false);
    expect(tipOpens([true, false, false])).toBe(true);
    expect(tipOpens([false, false])).toBe(true);
    noteTip('g:0', true);
    noteTip('g:0', false);
    expect(tipOpens(tipsOf('g:0'))).toBe(false);
    expect(tipOpens(tipsOf('g:1'))).toBe(true);
    noteTip('g:0', false);
    expect(tipOpens(tipsOf('g:0'))).toBe(true);
  });
  it('the stars: on task +2, said again after a tip +1; むずかしい’s length', () => {
    expect(saidStars(false, true)).toBe(0);
    expect(saidStars(true, false)).toBe(2);
    expect(saidStars(true, true)).toBe(3);
    expect(longEnough('I like cats.', 2)).toBe(true);
    expect(longEnough('I like cats.', 3)).toBe(false);
    expect(longEnough('I like cats a lot every day.', 3)).toBe(true);
  });
  it('the copy: in the font, never "incorrect", friendly', () => {
    const src = readFileSync(join(import.meta.dirname, 'speak.ts'), 'utf8');
    const ja = src.match(/ja: '[^']*'/g)!.join('');
    expect(notInTrimmedFont(ja)).toEqual([]);
    expect(ja).not.toMatch(/間違|不正解|×|%|です|ます/);
    expect(say('useWord', { w: 'cat' })).toBe('「cat」を入れて言ってみてね');
    // a great sentence's cheers in turn
    expect(Array.from({ length: 5 }, () => cheerOf(nextCheer()))).toEqual(['いい文だね！', 'バッチリ！', 'すごくいいね！', 'その言い方、自然だよ！', 'いい文だね！']);
  });
});

/** e2e/sugoroku-speak.spec.ts's save (Playwright can't import the game's JSON): a game for A (やさしい) and B at A's 絵
 *  stone, apple. Built by the game itself; `SG_FIXTURE=1 npx vitest run src/lib/sugoroku/speak.test.ts` writes it again
 *  when the save's shape or content changes. */
describe('the e2e’s save at a picture stone', () => {
  it('is a game this build plays', () => {
    const file = join(import.meta.dirname, '../../../e2e/fixtures/sugoroku-picture.json');
    const g0 = newGame([{ who: 'A', name: 'A', level: 1 }, { who: 'B', name: 'B', level: 2 }], 'speak-e2e');
    const g = { ...g0, phase: { k: 'picture' as const, item: PICTURES.findIndex((p) => p.w === 'apple'), spun: 1, r: 0 } };
    if (process.env.SG_FIXTURE) writeFileSync(file, `${JSON.stringify(g)}\n`);
    expect(JSON.parse(readFileSync(file, 'utf8'))).toEqual(g);
    expect(isGame(g)).toBe(true);
  });
});
