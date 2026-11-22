// What a tap on a room's piece does (toggles.ts): each family's pieces by NH's own names, a switched piece's state and a
// screen's channel kept in its switch's time, the few moving at once, where one stands to play.
import { describe, expect, it } from 'vitest';
import { ITEMS } from './items.ts';
import { CUES } from '#lib/sound/cues.ts';
import en from '../../i18n/tent.en.json';
import {
  ACTIVE_MAX, CHANNELS, INSTRUMENTS, SWITCHED, activeOf, atFor, channelOf, codesOf, familyOf, insideOf, isInstrument, isSwitched, nextOf, onOf, playSpot, toyMove,
  type Family
} from './toggles.ts';

/** The rule the table holds (NH's English names; first match wins, a rug or a gyroid never). */
const RULES: [Family, RegExp, RegExp?][] = [
  ['screen', /\btv\b|television|computer|laptop|monitors?\b|arcade .*game|pinball|game stand|game-show stand|crane game|tablet device|led display|ekg|video camera|touchscreen|control panel|projection screen|gaming desk|karaoke/, /tv camera|tv tray|floor monitor/],
  ['fan', /\bfan\b/, /fan palm|windflower/],
  ['washer', /washer|washing machine|dryer/],
  ['water', /sink|faucet|washbasin|handwashing|shower|bathroom vanity/],
  ['steam', /bathtub|\bbath\b|\btub\b|sauna heater|humidifier/, /bath mat|bath stool|bath bucket|birdbath/],
  ['heater', /space heater/],
  ['keys', /piano|synthesizer|\borgan\b|sampler/, /bench/],
  ['strings', /guitar|ukulele|violin|cello|\bharp\b/, /beetle/],
  ['drums', /drum|timpani|taiko/, /drummoid/],
  ['gong', /\bgong\b/],
  ['mallet', /marimba|xylophone/],
  ['winds', /saxophone|trumpet|clarinet|flute|tuba|french horn/],
  ['theremin', /theremin/],
  ['sing', /\bmic\b|microphone/],
  ['dj', /turntable/],
  ['closet', /wardrobe|closet|refrigerator|fridge|freezer|locker|dresser|cupboard|cabinet|\bchest\b|organizer/, /console/],
  ['toy', /\btoy\b|toy box|plushie|teddy|\bdoll\b|dollhouse|robot|newton|metronome|globe|hourglass|rocking horse|dala horse|cucumber horse|music box|spinning wheel|wobbling/, /tire toy|plaza toy|robot hero|sleigh|stockings|centipede|cockroach|steamroller/]
];
const names = en as Record<string, string>;
const ruled = (code: string): Family | null => {
  const n = (names[`tent.item.${code}`] ?? '').toLowerCase();
  if (!n || ITEMS[code].rug || ITEMS[code].gy) return null;
  return RULES.find(([, re, not]) => re.test(n) && !not?.test(n))?.[0] ?? null;
};

describe('families', () => {
  it("every piece's family is NH's name's (the table and the rule agree, both ways)", () => {
    for (const code of Object.keys(ITEMS)) expect(familyOf(code), `${code} ${names[`tent.item.${code}`]}`).toBe(ruled(code));
  });
  it('the counts: 31 instruments, 30 screens, 5 fans, 3 washers, 11 taps, 13 baths and steamers, a heater, 39 wardrobes and fridges, 33 toys', () => {
    const n = (f: Family) => codesOf(f).length;
    expect(INSTRUMENTS.reduce((a, f) => a + n(f), 0)).toBe(31);
    expect([n('screen'), n('fan'), n('washer'), n('water'), n('steam'), n('heater'), n('closet'), n('toy')]).toEqual([30, 5, 3, 11, 13, 1, 39, 33]);
    for (const f of [...INSTRUMENTS, ...SWITCHED, 'closet', 'toy'] as Family[]) for (const c of codesOf(f)) expect(ITEMS[c], c).toBeDefined();
  });
  it('every instrument has its riff (a world cue)', () => {
    for (const f of INSTRUMENTS) expect(CUES[`room-play-${f}`]?.world, f).toBe(true);
  });
  it('a piano plays, a TV switches, a wardrobe and a chair do neither', () => {
    expect(familyOf('f1081')).toBe('keys');
    expect(isInstrument(familyOf('f1081'))).toBe(true);
    expect(isSwitched(familyOf('f1108'))).toBe(true);
    expect(familyOf('f3959')).toBe('closet');
    expect(isSwitched(familyOf('f3959')) || isInstrument(familyOf('f3959'))).toBe(false);
    expect(familyOf('f3681')).toBeNull(); // the piano bench: a seat
  });
  it("a fridge's inside is cold, a locker's stuff, a wardrobe's clothes; a cradle sways, a rocking horse rocks, a globe turns", () => {
    expect([insideOf('f2713'), insideOf('f833'), insideOf('f3959')]).toEqual(['cold', 'stuff', 'clothes']);
    expect([toyMove('f8464'), toyMove('f83'), toyMove('f1411'), toyMove('f1892'), toyMove('f13719')]).toEqual(['sway', 'rock', 'spin', 'flip', 'hop']);
  });
});

describe('switched', () => {
  it('off as it came, but a light (on as it came); its switch decides', () => {
    expect(onOf(undefined, false)).toBe(false);
    expect(onOf(undefined, true)).toBe(true);
    expect(onOf(1, false)).toBe(true);
    expect(onOf(0, true)).toBe(false);
  });
  it('a screen: off → channel 0 → 1 → 2 → off; a fan on ↔ off', () => {
    expect(nextOf('screen', false, 2)).toEqual({ l: 1, ch: 0 });
    expect(nextOf('screen', true, 0)).toEqual({ l: 1, ch: 1 });
    expect(nextOf('screen', true, CHANNELS - 1)).toEqual({ l: 0 });
    expect(nextOf('fan', false, 0)).toEqual({ l: 1 });
    expect(nextOf('fan', true, 0)).toEqual({ l: 0 });
  });
  it("a channel is its switch's time: atFor finds the next time with it, at most CHANNELS − 1 ms on", () => {
    for (const at of [1_795_000_000_000, 1_795_000_000_001, 1_795_000_000_002, 7]) for (let ch = 0; ch < CHANNELS; ch++) {
      const t = atFor(at, ch);
      expect(channelOf(t)).toBe(ch);
      expect(t - at).toBeGreaterThanOrEqual(0);
      expect(t - at).toBeLessThan(CHANNELS);
    }
  });
  it('at most ACTIVE_MAX move, the nearest the middle first, ties by id', () => {
    const on = Array.from({ length: 7 }, (_, i) => ({ id: `p${i}`, at: [i * 10, 0] as const }));
    expect(activeOf(on, [0, 0]).map((p) => p.id)).toEqual(['p0', 'p1', 'p2', 'p3']);
    expect(activeOf(on, [60, 0]).map((p) => p.id)).toEqual(['p6', 'p5', 'p4', 'p3']);
    expect(activeOf([{ id: 'b', at: [5, 0] }, { id: 'a', at: [-5, 0] }], [0, 0]).map((p) => p.id)).toEqual(['a', 'b']);
    expect(ACTIVE_MAX).toBe(4);
  });
});

describe('where one plays', () => {
  const free = () => true;
  it("its front's middle first (turned with it), the nearer side when the front's taken, its back last, none: null", () => {
    // a 2 × 1 piano at the origin facing +z (f 0): the front is 5 + 4 out
    expect(playSpot([0, 0], [10, 5], 0, free, [0, 30])).toEqual([0, 9]);
    // turned a quarter (f 1: its front +x)
    expect(playSpot([0, 0], [10, 5], 1, free, [0, 30])).toEqual([9, 0]);
    const noFront = (p: readonly [number, number]) => !(p[0] === 0 && p[1] === 9);
    expect(playSpot([0, 0], [10, 5], 0, noFront, [-30, 0])).toEqual([-14, 0]);
    expect(playSpot([0, 0], [10, 5], 0, (p) => p[1] < 0, [0, 30])).toEqual([0, -9]);
    expect(playSpot([0, 0], [10, 5], 0, () => false, [0, 30])).toBeNull();
  });
});
