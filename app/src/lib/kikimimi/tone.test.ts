import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { TONES, TONE_REFS, TONE_TEXT, contourScore, engineText, sentences, takeScore, type TakeMeasures } from './tone.ts';
import { CAST_IDS } from './speech.ts';

const types = (t: string) => sentences(t).map((s) => s.type);
const CAST_JSON: Record<string, { tones?: Record<string, { text: string; seed: number }> }> =
  JSON.parse(readFileSync(join(import.meta.dirname, '../../../scripts/tts/cast.json'), 'utf8'));
const take = (o: Partial<TakeMeasures>): TakeMeasures => ({ finals: [], sylS: 4.3, rangeSt: 10, content: 0, sim: 0.7, mos: 4, ...o });

describe('kikimimi tone: sentence types', () => {
  it('tells wh-, either/or, yes/no, tag and echo questions from statements', () => {
    expect(types('What did you end up doing last night?')).toEqual(['wh']);
    expect(types('So, how do you know the bride and groom?')).toEqual(['wh']);
    expect(types('Wait, sorry, what was your name again?')).toEqual(['wh']);
    expect(types('Did you want that hot or iced?')).toEqual(['alt']);
    expect(types('Is that for here or to go?')).toEqual(['alt']);
    expect(types('Are you allergic to anything?')).toEqual(['yn']);
    expect(types('I got you a coffee. No sugar, right?')).toEqual(['stmt', 'tag']);
    expect(types('Cake? Oh, I had better not.')).toEqual(['echo', 'stmt']);
    expect(types('Okay, everybody, raise your glasses!')).toEqual(['excl']);
    expect(types('Whatever happened with your car? Did you get it fixed?')).toEqual(['wh', 'yn']);
  });
  it('counts each sentence’s words', () => {
    expect(sentences("I'm kind of tired. Mind if we stay in?").map((s) => s.n)).toEqual([4, 5]);
  });
});

describe('kikimimi tone: engine text', () => {
  it('ends wh- and either/or questions with "." and leaves the rest', () => {
    expect(engineText('Did you want that hot or iced?')).toBe('Did you want that hot or iced.');
    expect(engineText('Whatever happened with your car? Did you get it fixed?')).toBe('Whatever happened with your car. Did you get it fixed?');
    expect(engineText('Sorry, did you say large or medium? It’s loud in here.')).toBe('Sorry, did you say large or medium. It’s loud in here.');
    for (const t of ['Are you allergic to anything?', 'I got you a coffee. No sugar, right?', "I'll tell her you called.", 'Hi, nice to meet you!'])
      expect(engineText(t)).toBe(t);
  });
  it('keeps the words: only a "?" becomes a "."', () => {
    const t = 'So, um, are we still on for Friday? What do you think?';
    expect(engineText(t).replace(/[.?]/g, '')).toBe(t.replace(/[.?]/g, ''));
  });
});

describe('kikimimi tone: the take score', () => {
  it('rewards each ending its type wants', () => {
    expect(contourScore(['wh'], [{ final: 'fall', fall: 5 }])).toBe(1);
    expect(contourScore(['wh'], [{ final: 'rise', fall: 0 }])).toBe(-1);
    expect(contourScore(['yn'], [{ final: 'rise', fall: 0 }])).toBe(1);
    expect(contourScore(['yn'], [{ final: 'fall', fall: 2 }])).toBe(0);
    expect(contourScore(['yn'], [{ final: 'fall', fall: 5 }])).toBe(-1);
    expect(contourScore(['stmt', 'yn'], [{ final: 'fall', fall: 4 }, { final: 'level', fall: 0 }])).toBe(0.25);
    expect(contourScore(['stmt'], [{ final: 'unclear', fall: 0 }])).toBe(0);
  });
  it('ranks a misheard take, another voice, a rushed or over-bright take below a clean one', () => {
    const t = ['wh'] as const, good = take({ finals: [{ final: 'fall', fall: 4 }] });
    const base = takeScore(t, good);
    expect(takeScore(t, { ...good, content: 1 })).toBeLessThan(base - 9);
    expect(takeScore(t, { ...good, sim: 0.2 })).toBeLessThan(base - 9);
    expect(takeScore(t, { ...good, sylS: 6.5 })).toBeCloseTo(base - 1.2);
    expect(takeScore(t, { ...good, rangeSt: 18 })).toBeCloseTo(base - 1);
    expect(takeScore(t, { ...good, finals: [{ final: 'rise', fall: 0 }] })).toBeCloseTo(base - 4);
    expect(takeScore(t, { ...good, mos: 4.4 })).toBeCloseTo(base + 0.2);
  });
});

describe('kikimimi tone: the references', () => {
  it('cast.json’s tone references are the tones that have one, each speaking its tone’s text', () => {
    expect(TONE_REFS.every((t) => (TONES as readonly string[]).includes(t))).toBe(true);
    for (const id of CAST_IDS)
      for (const [tone, r] of Object.entries(CAST_JSON[id].tones ?? {})) {
        expect(TONE_REFS as readonly string[], `${id} ${tone}`).toContain(tone);
        expect(r.text, `${id} ${tone}`).toBe(TONE_TEXT[tone as keyof typeof TONE_TEXT]);
        expect(Number.isInteger(r.seed)).toBe(true);
      }
  });
});
