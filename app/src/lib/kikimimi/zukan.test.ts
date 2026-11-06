import { describe, expect, it } from 'vitest';
import type { Item } from './bank.ts';
import type { Answer } from './progress.ts';
import type { UnitState } from './stamps.ts';
import {
  IPPATSU_BADGES, STAR_MAX, VOICE_CAUGHT, chaptersDone, heardOf, ippatsuOf, passes, phraseBook, phraseClip, sampleClip, storyPhrases, unitStamps,
  voiceVillagers, voicesOf, type Heard
} from './zukan.ts';

const ans = (id: string, d: string, ok = true, rp = 0): Answer => ({ id, ok, pick: ok ? 0 : 1, rp, d, g: `g-${d}`, lv: 3, p: false });
const us = (who = 'maple'): Heard => ({ accent: 'us', hard: false, casts: ['us-f3'], who: [who as never] });
const item = (id: string, over: Partial<Item> = {}): Item => ({ id, lv: 3, type: 'word', en: 'x', ja: '', speaker: 'maple', voice: 'us', choices: ['a', 'b'], answer: 0, ...over });

describe('ずかん › ことば', () => {
  const PH = [{ id: 'ph-a', in: ['i1', 'i2', 'i3', 'i4'] }];
  const caught = [ans('i1', '2026-11-01'), ans('i2', '2026-11-02'), ans('i3', '2026-11-02')];

  it('★ once caught; +1 for first listens in two accents; +1 for one under a condition', () => {
    const info = new Map<string, Heard>([['i1', us()], ['i2', us('dom')], ['i3', us()], ['i4', { accent: 'uk', hard: true, casts: ['uk-f1'], who: ['fauna'] }]]);
    expect(phraseBook(PH, caught, (id) => info.get(id)).get('ph-a')).toMatchObject({ caught: true, stars: 1, last: '2026-11-02', who: ['maple', 'dom'] });
    const all = phraseBook(PH, [...caught, ans('i4', '2026-11-03')], (id) => info.get(id)).get('ph-a')!;
    expect(all.stars).toBe(STAR_MAX);
    // a replay's right gives no extra
    expect(phraseBook(PH, [...caught, ans('i4', '2026-11-03', true, 1)], (id) => info.get(id)).get('ph-a')!.stars).toBe(1);
  });
  it('seen but not caught: no ★; never heard: nothing, and no lookup needed', () => {
    expect(phraseBook(PH, caught.slice(0, 2), () => undefined).get('ph-a')).toMatchObject({ heard: true, caught: false, stars: 0, who: [] });
    expect(phraseBook(PH, [], () => undefined).get('ph-a')).toMatchObject({ heard: false, stars: 0, last: null });
  });
  it('a bedtime chapter’s phrases: seen once begun, caught once finished', () => {
    const chapters = [1, 2, 3].map((chapter) => ({ unit: 'st-x', chapter, ph: [{ id: `p${chapter}` }] }));
    const s = storyPhrases(chapters, { 'st-x': { done: { 1: '2026-11-01' }, at: { ch: 2, seg: 3 } } });
    expect(Object.fromEntries(s)).toEqual({ p1: { heard: true, caught: true }, p2: { heard: true, caught: false }, p3: { heard: false, caught: false } });
    expect(storyPhrases(chapters, {}).get('p1')).toEqual({ heard: false, caught: false });
  });
  it('the filters', () => {
    expect([passes('all', false), passes('caught', true), passes('caught', false), passes('notyet', false), passes('notyet', true)]).toEqual([true, true, false, true, false]);
  });
  it('the clip to hear a phrase in: a heard item first, a dialogue’s line that says it', () => {
    const items = new Map<string, Item>([
      ['i1', item('i1')],
      ['d1', item('d1', { type: 'gist', lines: [{ who: 'maple', cast: 'us-f3', en: 'Hi there.', ja: '' }, { who: 'dom', cast: 'us-m1', en: "Something's come up, sorry.", ja: '' }] })]
    ]);
    expect(phraseClip("something's come up", ['nope', 'i1', 'd1'], (id) => items.get(id))).toBe('i1');
    expect(phraseClip("something's come up", ['i1', 'd1'], (id) => items.get(id), new Set(['d1']))).toBe('d1-2');
    expect(phraseClip('x', ['nope'], (id) => items.get(id))).toBeNull();
  });
});

describe('ずかん › こえ', () => {
  it('heard and understood per voice (different items); caught at 10 understood; a dialogue counts for each voice', () => {
    const info = (id: string): Heard | undefined => (id.startsWith('d') ? { accent: 'us', hard: false, casts: ['us-f3', 'us-m1'], who: ['maple', 'dom'] } : id.startsWith('i') ? us() : undefined);
    const right = Array.from({ length: VOICE_CAUGHT }, (_, k) => ans(`i${k}`, '2026-11-01'));
    const v = voicesOf([...right, ans('i0', '2026-11-02'), ans('d1', '2026-11-02', false), ans('zz', '2026-11-02')], info);
    expect(v.get('us-f3')).toEqual({ heard: VOICE_CAUGHT + 1, understood: VOICE_CAUGHT, caught: true });
    expect(v.get('us-m1')).toEqual({ heard: 1, understood: 0, caught: false });
    expect(v.size).toBe(2);
  });
  it('an item’s voices and speakers: a dialogue’s lines once each; a condition or a phone is hard', () => {
    const d = item('d', { type: 'gist', lines: [{ who: 'maple', cast: 'us-f3', en: 'a', ja: '' }, { who: 'dom', cast: 'us-m1', en: 'b', ja: '' }, { who: 'maple', cast: 'us-f3', en: 'c', ja: '' }] });
    expect(heardOf(d)).toEqual({ accent: 'us', hard: false, casts: ['us-f3', 'us-m1'], who: ['maple', 'dom'] });
    expect(heardOf(item('p', { channel: 'phone' })).hard).toBe(true);
    expect(heardOf(item('c', { cond: { kind: 'cafe', level: 'light' } })).hard).toBe(true);
    expect(heardOf(item('m')).casts).toEqual(['us-f3']); // (maple's voice for good: cast.ts)
  });
  it('who uses a voice: theirs for good, then the accent-exposure items’', () => {
    const v = voiceVillagers('uk-f1');
    expect(v.home).toEqual([]);
    expect(v.exposure).toContain('fauna');
    expect(voiceVillagers('us-f3').home.slice(0, 2)).toEqual(['maple', 'molly']);
  });
  it('a sample clip: one heard first, a dialogue’s line in that voice, never a rung', () => {
    const items = [
      item('r', { speaker: 'maple', rung: { ladder: 'sp', n: 1, speed: 1 } as never }),
      item('a', { speaker: 'maple' }),
      item('d', { type: 'gist', lines: [{ who: 'dom', cast: 'us-m1', en: 'a', ja: '' }, { who: 'maple', cast: 'us-f3', en: 'b', ja: '' }] })
    ];
    expect(sampleClip('us-f3', items)).toBe('a');
    expect(sampleClip('us-f3', items, new Set(['d']))).toBe('d-2');
    expect(sampleClip('au-m2', items)).toBeNull();
  });
});

describe('ずかん › スタンプ', () => {
  it('いっぱつ: first-listen rights and the badges reached', () => {
    const a = [...Array.from({ length: 12 }, (_, k) => ans(`i${k}`, '2026-11-01')), ans('x', '2026-11-01', true, 1), ans('y', '2026-11-01', false)];
    expect(ippatsuOf(a)).toEqual({ n: 12, badges: [10], next: 50 });
    expect(ippatsuOf([]).next).toBe(IPPATSU_BADGES[0]);
  });
  it('unit stamps in the path’s order: mine, the partner’s, the double, a blank', () => {
    const st = (o: Partial<UnitState>): UnitState => ({ done: [], stamped: null, tally: null, partner: false, double: false, recheck: null, ...o });
    const states = new Map([['a', st({ stamped: '2026-11-01', partner: true, double: true })], ['b', st({ partner: true })]]);
    expect(unitStamps(['a', 'b', 'c'], states)).toEqual([
      { id: 'a', d: '2026-11-01', partner: true, double: true }, { id: 'b', d: null, partner: true, double: false }, { id: 'c', d: null, partner: false, double: false }
    ]);
  });
  it('chapters finished, each serial’s in order', () => {
    expect(chaptersDone({ s1: { done: { 2: '2026-11-03', 1: '2026-11-02' } }, s2: { done: {} } }, ['s1', 's2', 's3'])).toEqual([['s1', 1, '2026-11-02'], ['s1', 2, '2026-11-03']]);
  });
});
