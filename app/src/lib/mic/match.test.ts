// What the mic heard against what was to be said (match.ts): the normaliser (contractions and reductions both ways,
// numbers as words, fillers, tags and punctuation out), WER, alignment and recall, the lenient reply match, key
// phrases and the candidate pick.
import { describe, expect, it } from 'vitest';
import { align, candidate, choose, near, phrases, recall, spell, wer, words } from './match.ts';

const same = (a: string, b: string) => expect(words(a)).toEqual(words(b));

describe('words', () => {
  it('folds contractions, reductions and numbers; drops punctuation and fillers', () => {
    expect(words("Hey, it's me. Um, I've got Tuesday at a quarter to five!")).toEqual(['hey', 'it', 'is', 'me', 'i', 'have', 'got', 'tuesday', 'at', 'a', 'quarter', 'to', 'five']);
    expect(words("I'm gonna, can't, won't — 45")).toEqual(['i', 'am', 'going', 'to', 'can', 'not', 'will', 'not', 'forty', 'five']);
    expect(words('We’re out of onions')).toEqual(['we', 'are', 'out', 'of', 'onions']);
  });

  it('folds contractions both ways', () => {
    same("I'm sure you'll love it", 'I am sure you will love it');
    same("They're here, we've left, she'd go", 'They are here, we have left, she would go');
    same("Don't, doesn't, isn't, wasn't, shouldn't", 'Do not, does not, is not, was not, should not');
    same("Let's go", 'let us go');
    same("He's been busy, it's got a lid", 'He has been busy, it has got a lid');
    same("I'd better go, you'd had enough", 'I had better go, you had had enough');
    same("That's what's here", 'That is what is here');
    same('I cannot', "I can't");
    same("Y'all ain't ready", 'you all is not ready');
  });

  it('folds US reductions both ways', () => {
    same('I wanna kinda sorta go', 'I want to kind of sort of go');
    same('lemme see, gimme that, dunno', "let me see, give me that, don't know");
    same('you shoulda called, I coulda', 'you should have called, I could have');
    same("didja see 'em?", 'did you see them');
    same("nothin' doin', 'cause", 'nothing doing because');
    same('rock \'n\' roll', 'rock and roll');
    same('Okay, alright', 'ok, all right');
  });

  it('reads numbers, money, percents, times, ordinals, years and decimals as words', () => {
    expect(words('13 30 100 105 380,000')).toEqual('thirteen thirty one hundred one hundred five three hundred eighty thousand'.split(' '));
    same('a hundred and five', '105');
    same('$5 and $3.50', 'five dollars and three dollars fifty cents');
    same('¥1500', 'one thousand five hundred yen');
    same('20% off, 2.5%', 'twenty percent off, two point five percent');
    same('at 7:30, at 2:05', 'at seven thirty, at two five');
    same("at 7:00, at seven o'clock", 'at seven, at seven');
    same('7pm, 7 p.m.', 'seven pm seven pm');
    same('the 1st, 2nd, 3rd, 21st and 40th', 'the first second third twenty first and fortieth');
    same('in 1990, 2005 and 2026', 'in nineteen ninety two thousand five and twenty twenty six');
    expect(spell(1_000_001)).toBe('one million one');
    expect(spell(12)).toBe('twelve');
  });

  it("drops the recogniser's tags, curly quotes and dashes", () => {
    expect(words('[BLANK_AUDIO] (laughs) ♪ Hello—there')).toEqual(['hello', 'there']);
    expect(words('twenty-five e‑mail')).toEqual(['twenty', 'five', 'e', 'mail']);
    expect(words('')).toEqual([]);
    expect(words('Uh, hmm. Mm.')).toEqual([]);
  });
});

describe('wer', () => {
  it('is 0 for the same words however written, and counts substitutions, deletions and insertions', () => {
    expect(wer("I was going to make curry, but we're out of onions.", 'i was gonna make curry but we are out of onions')).toBe(0);
    expect(wer('feed my cat tomorrow', 'feed my hat tomorrow')).toBe(0.25);
    expect(wer('feed my cat tomorrow', 'feed cat tomorrow')).toBe(0.25);
    expect(wer('feed my cat', 'please feed my cat now')).toBeCloseTo(2 / 3);
    expect([wer('', ''), wer('', 'hello'), wer('hello there', '')]).toEqual([0, 1, 1]);
    expect(wer('It costs $15.', 'it costs fifteen dollars')).toBe(0);
    expect(wer('Meet me at 3:15', 'Meet me at three fifteen.')).toBe(0);
  });
});

describe('align and recall', () => {
  it('marks each said word heard or not, and counts the extras', () => {
    expect(align('feed my cat tomorrow', 'uh feed the cat tomorrow please')).toEqual({
      said: [{ w: 'feed', ok: true }, { w: 'my', ok: false }, { w: 'cat', ok: true }, { w: 'tomorrow', ok: true }], extra: 1
    });
    expect(align("I'm late", 'I am late').said.every((s) => s.ok)).toBe(true);
    expect(align('hello', '')).toEqual({ said: [{ w: 'hello', ok: false }], extra: 0 });
  });

  it('counts content words only', () => {
    expect(recall('Could you feed my cat tomorrow?', 'could you feed my hat tomorrow')).toEqual([2, 3]);
    expect(recall("I'm gonna make curry", 'I am going to make curry')).toEqual([3, 3]);
    expect(recall('Is it?', 'is it')).toEqual([2, 2]);
    expect(recall('Is it?', '')).toEqual([0, 2]);
  });
});

describe('near', () => {
  it('takes plurals and one-letter slips in longer words, not in short ones', () => {
    expect([near('cats', 'cat'), near('boxes', 'box'), near('tomorrow', 'tomorow'), near('color', 'colour')]).toEqual([true, true, true, true]);
    expect([near('rice', 'lice'), near('hat', 'hot'), near('walk', 'work'), near('thirteen', 'thirty')]).toEqual([false, false, false, false]);
  });
});

describe('choose', () => {
  const C = ['Sure, go ahead.', "Sorry, I'm using it.", 'It’s on the table.'];

  it('picks the choice a reply says, however worded', () => {
    expect(choose('yeah go ahead', C).i).toBe(0);
    expect(choose('Oh, sorry. I am using it right now.', C).i).toBe(1);
    expect(choose("it's on the table", C).i).toBe(2);
    expect(choose('Um, sure! Go ahead, no problem.', C).i).toBe(0);
  });

  it('says none rather than guess: off-topic, empty, or two choices alike', () => {
    expect(choose('I like trains', C).i).toBe(-1);
    expect(choose('', C).i).toBe(-1);
    expect(choose('see you at nine', ['See you at nine.', 'See you at five.'])).toMatchObject({ i: 0 });
    expect(choose('see you at', ['See you at nine.', 'See you at five.']).i).toBe(-1);
  });

  it('tells yes from no and not', () => {
    expect(choose('nope', ['Yes, I do.', 'No, I don’t.']).i).toBe(1);
    expect(choose("I can't", ['I can.', "I can't."]).i).toBe(1);
    expect(choose('yes I do', ['Yes, I do.', 'No, I don’t.']).i).toBe(0);
  });

  it('gives a score per choice', () => {
    const r = choose('sure go ahead', C);
    expect(r.scores).toHaveLength(3);
    expect(r.scores[0]).toBe(1);
    expect(Math.max(r.scores[1], r.scores[2])).toBeLessThan(0.6);
  });
});

describe('phrases', () => {
  const K = ['Could I get', 'for here or to go', 'a large coffee', 'Thank you'];

  it('sets a bit for each key phrase in the turn, a slip allowed in longer ones', () => {
    expect(phrases('Hi, could I get a large coffee?', K)).toBe(0b0101);
    expect(phrases('for here or to go? thanks', K)).toBe(0b0010);
    expect(phrases('is it for hear or to go', K)).toBe(0b0010);
    expect(phrases('thank you so much', K)).toBe(0b1000);
    expect(phrases('', K)).toBe(0);
    expect(phrases('a small coffee', ['a large coffee'])).toBe(0);
  });

  it('keeps at most 12 keys', () => {
    expect(phrases('x', Array(14).fill('x'))).toBe(0xfff);
  });
});

describe('candidate', () => {
  it("uses whisper's scores when there are, sure only with a margin", () => {
    expect(candidate({ text: '', cand: [-0.4, -2.1] }, ['rice', 'lice'])).toEqual({ i: 0, sure: true });
    expect(candidate({ text: '', cand: [-1.9, -0.2] }, ['rice', 'lice'])).toEqual({ i: 1, sure: true });
    expect(candidate({ text: '', cand: [-1.0, -1.1] }, ['rice', 'lice'])).toEqual({ i: -1, sure: false });
  });

  it('else reads the transcript: one candidate in it, or unsure', () => {
    expect(candidate({ text: 'Rice.' }, ['rice', 'lice'])).toEqual({ i: 0, sure: true });
    expect(candidate({ text: 'I said lice' }, ['rice', 'lice'])).toEqual({ i: 1, sure: true });
    expect(candidate({ text: 'nice' }, ['rice', 'lice'])).toEqual({ i: -1, sure: false });
    expect(candidate({ text: 'rice and lice' }, ['rice', 'lice'])).toEqual({ i: -1, sure: false });
    expect(candidate({ text: '13' }, ['thirteen', 'thirty'])).toEqual({ i: 0, sure: true });
    expect(candidate({ text: '30.' }, ['13', '30'])).toEqual({ i: 1, sure: true });
    expect(candidate({ text: "I can't" }, ['can', "can't"])).toEqual({ i: 1, sure: true });
    expect(candidate({ text: 'I can' }, ['can', "can't"])).toEqual({ i: 0, sure: true });
  });
});
