// What a tap on a room's piece does (toggles.ts): each family's pieces by NH's own names, a switched piece's state and a
// screen's channel kept in its switch's time, the few moving at once, where one stands to play; the dress-up pieces, a
// clock's line, the gadgets' answers.
import { describe, expect, it } from 'vitest';
import { ITEMS } from './items.ts';
import { CUES } from '#lib/sound/cues.ts';
import { HELD_PLAY } from './heldPlay.ts';
import en from '../../i18n/tent.en.json';
import jaRooms from '../../i18n/rooms.ja.json';
import enRooms from '../../i18n/rooms.en.json';
import {
  ACTIVE_MAX, CHANNELS, GADGETS, INSTRUMENTS, SWITCHED, activeOf, atFor, channelOf, clockLine, codesOf, dressesAt, familyOf, playFrom, gadgetOf, insideOf, isGadget, isInstrument,
  isSwitched, nextOf, onOf, playSpot, toyMove, type Family
} from './toggles.ts';

/** The rule the table holds (NH's English names; first match wins, a rug or a gyroid never). */
const RULES: [Family, RegExp, RegExp?][] = [
  ['screen', /\btv\b|television|computer|laptop|monitors?\b|arcade .*game|pinball|game stand|game-show stand|crane game|tablet device|led display|ekg|video camera|touchscreen|control panel|projection screen|gaming desk|karaoke/, /tv camera|tv tray|floor monitor/],
  ['fan', /\bfan\b/, /fan palm|windflower/],
  ['washer', /washer|washing machine|dryer/],
  ['water', /sink|faucet|washbasin|handwashing|shower|bathroom vanity/],
  ['steam', /bathtub|\bbath\b|\btub\b|sauna heater|humidifier/, /bath mat|bath stool|bath bucket|birdbath/],
  ['heater', /space heater/],
  ['glow', /plasma ball/],
  ['keys', /piano|synthesizer|\borgan\b|sampler/, /bench/],
  ['strings', /guitar|ukulele|violin|cello|\bharp\b/, /beetle/],
  ['drums', /drum|timpani|taiko/, /drummoid/],
  ['gong', /\bgong\b/],
  ['mallet', /marimba|xylophone/],
  ['winds', /saxophone|trumpet|clarinet|flute|tuba|french horn/],
  ['theremin', /theremin/],
  ['sing', /\bmic\b|microphone/],
  ['dj', /turntable/],
  ['closet', /wardrobe|closet|refrigerator|fridge|freezer|locker|dresser|cupboard|cabinet|\bchest\b|organizer|storage shed/, /console/],
  ['toy', /\btoy\b|toy box|plushie|teddy|\bdoll\b|dollhouse|robot|newton|metronome|globe|hourglass|rocking horse|dala horse|cucumber horse|music box|spinning wheel|wobbling/, /tire toy|plaza toy|robot hero|sleigh|stockings|centipede|cockroach|steamroller/],
  ['dress', /vanity|mirror|changing room|powder-room booth|clothing rack|hanger (rack|stand)|mannequin|kimono stand|samurai suit|plate armor|\bdrawers\b|pompompurin rack/, /rescue/],
  ['clock', /clock|wristwatch/, /star clock/],
  ['bin', /garbage|trash can|waste bin|busing station/],
  ['whir', /\bgears\b|gear (apparatus|tower)|meter and pipes|conveyor belt|amazing machine|unknown machine|sewing machine|winnowing machine|copy machine|fax machine|typewriter|microwave|rice cooker|\bmixer\b|espresso maker|coffee grinder|vacuum|popcorn machine|shaved-ice maker|pop-up toaster|\bloom\b/, /stovetop/],
  ['burst', /confetti|bubble machine|cloud maker|surprise box/],
  ['beckon', /lucky (gold )?cat|water bird/],
  ['wobble', /dharma|matryoshka/],
  ['coin', /piggy bank|donation box|cash register|candy machine/],
  ['radio', /\bradio\b/, /skull/],
  ['bell', /\bbell\b/, /cricket/],
  ['loop', /train set|rc helicopter|mini circuit/],
  ['twinkle', /festive tree|ornament tree|giant ornament/]
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
  it('the counts: 31 instruments, 30 screens, 5 fans, 3 washers, 11 taps, 13 baths and steamers, a heater, a plasma ball, 41 wardrobes, fridges and sheds, 33 toys; 31 to dress up at, 25 clocks, 7 bins, 64 gadgets', () => {
    const n = (f: Family) => codesOf(f).length;
    expect(INSTRUMENTS.reduce((a, f) => a + n(f), 0)).toBe(31);
    expect([n('screen'), n('fan'), n('washer'), n('water'), n('steam'), n('heater'), n('glow'), n('closet'), n('toy')]).toEqual([30, 5, 3, 11, 13, 1, 1, 41, 33]);
    expect([n('dress'), n('clock'), n('bin'), GADGETS.reduce((a, f) => a + n(f), 0)]).toEqual([31, 25, 7, 64]);
    expect(GADGETS.map(n)).toEqual([31, 6, 3, 5, 6, 3, 2, 3, 5]);
    for (const f of [...INSTRUMENTS, ...SWITCHED, ...GADGETS, 'closet', 'toy', 'dress', 'clock', 'bin'] as Family[]) for (const c of codesOf(f)) expect(ITEMS[c], c).toBeDefined();
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
  it("a fridge's inside is cold, a locker's and a shed's stuff, a wardrobe's clothes; a cradle sways, a rocking horse rocks, a globe turns", () => {
    expect([insideOf('f2713'), insideOf('f833'), insideOf('f14572'), insideOf('f3959')]).toEqual(['cold', 'stuff', 'stuff', 'clothes']);
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
  it('behind the drums, the marimba, the DJ deck and the theremin (facing out), beside the gong and the harps, else in front', () => {
    expect([playFrom('f1803', 'drums'), playFrom('f4121', 'mallet'), playFrom('f941', 'dj'), playFrom('f3063', 'theremin')]).toEqual(['back', 'back', 'back', 'back']);
    expect([playFrom('f4075', 'gong'), playFrom('f987', 'strings'), playFrom('f1449', 'strings'), playFrom('f1081', 'keys')]).toEqual(['side', 'side', 'front', 'front']);
    // a 2 × 1 drum set facing +z: its back first, then a side, its front last
    expect(playSpot([0, 0], [10, 5], 0, free, [0, 30], 'back')).toEqual([0, -9]);
    expect(playSpot([0, 0], [10, 5], 0, (p) => p[1] >= 0, [-30, 0], 'back')).toEqual([-14, 0]);
    expect(playSpot([0, 0], [10, 5], 0, free, [30, 0], 'side')).toEqual([14, 0]);
    expect(playSpot([0, 0], [10, 5], 0, (p) => p[0] === 0, [30, 0], 'side')).toEqual([0, 9]);
  });
});

describe('held while played', () => {
  it('the guitars, the ukulele, the violin, the winds and the hand mics are lifted, each an instrument, gripped within its height', () => {
    expect(Object.keys(HELD_PLAY)).toHaveLength(10);
    for (const [c, h] of Object.entries(HELD_PLAY)) {
      expect(isInstrument(familyOf(c)), c).toBe(true);
      expect(h.grip[1], c).toBeCloseTo(ITEMS[c].h / 2);
    }
    for (const c of ['f987', 'f1449', 'f9503', 'f1081', 'f1803']) expect(HELD_PLAY[c], c).toBeUndefined();
  });
});

describe('dress up, clocks, gadgets', () => {
  it('a mirror, a rack, a mannequin and a clothes wardrobe dress up; a fridge, a locker and a shed are peeked into', () => {
    for (const c of ['f12891', 'f12883', 'f12881', 'f1816', 'f13514', 'f3959', 'f12264']) expect(dressesAt(c), c).toBe(true);
    for (const c of ['f2713', 'f833', 'f14572', 'f1081', 'f13591']) expect(dressesAt(c), c).toBe(false);
  });
  it("a clock's line: 12-hour, ちょうど on the hour, ぷん after 1, 3, 4, 6, 8 and 0, else ふん", () => {
    expect(clockLine(15, 15)).toEqual({ key: 'fun', h: 3, m: 15, mm: '15' });
    expect(clockLine(0, 0)).toEqual({ key: 'sharp', h: 12, m: 0, mm: '00' });
    expect(clockLine(12, 3)).toMatchObject({ key: 'pun', h: 12, mm: '03' });
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 44].map((m) => clockLine(9, m).key)).toEqual(['pun', 'fun', 'pun', 'pun', 'fun', 'pun', 'fun', 'pun', 'fun', 'pun', 'pun', 'pun']);
  });
  it('every gadget has its move and a world cue; a bubble machine bubbles, a confetti blower throws confetti, the RC helicopter flies', () => {
    for (const f of GADGETS) for (const c of codesOf(f)) {
      expect(isGadget(familyOf(c)), c).toBe(true);
      expect(CUES[gadgetOf(c, f).cue]?.world, c).toBe(true);
    }
    expect(gadgetOf('f13465', 'burst')).toMatchObject({ spark: 'bubbles', cue: 'room-bubbles' });
    expect(gadgetOf('f13466', 'burst')).toMatchObject({ spark: 'confetti', cue: 'room-burst' });
    expect(gadgetOf('f13242', 'loop').move).toBe('fly');
    expect(gadgetOf('f85', 'loop').move).toBe('circle');
    expect([familyOf('f131'), familyOf('f1573'), familyOf('f1877'), familyOf('f4105'), familyOf('f3991')]).toEqual(['beckon', 'wobble', 'coin', 'glow', 'twinkle']);
    for (const k of ['room-dress', 'room-toss', 'room-tick'] as const) expect(CUES[k].world).toBe(true);
  });
  it('the lines a tap says are there in both languages (a clock: 「いまは 3じ 15ふん だよ」)', () => {
    const ja = jaRooms as Record<string, string>, enR = enRooms as Record<string, string>;
    for (const k of ['dress.0', 'dress.1', 'dress.2', 'toss.0', 'toss.1', 'toss.2', 'clock.fun', 'clock.pun', 'clock.sharp']) {
      expect(ja[`tent.${k}`], k).toBeTruthy();
      expect(enR[`tent.${k}`], k).toBeTruthy();
    }
    expect(ja['tent.clock.fun'].replace('{h}', '3').replace('{m}', '15')).toBe('いまは 3じ 15ふん だよ');
  });
});
