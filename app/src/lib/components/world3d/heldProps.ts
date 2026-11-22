// What's held for a use stood at (docs/design.md "The gym": Stood at), and which pieces have one: the props (another
// piece's model, or a few boxes built in code: tent/standFx.ts) each as benchBar.ts Held, spread into HELD_PROPS (by
// their model's item code, or their name); the pieces stood at and used by their seat (STAND_PIECES: the use synced,
// scripts/uses-stand.ts writes their spots) and the one-offs (ACT_PIECES: this phone's, played once). Each prop's grip
// from its model's bounds (static/room/models/<code>.glb: origin at its foot's middle), its size for a room's 16-unit
// villager. Pure tables.
import type { Held } from './benchBar.ts';
import type { Act, StandUse } from '../villager3d/poses-stand.ts';

/** The props by name: a model (`m`: an item code; `b`: built in code) and how it's held. */
export const PROPS = {
  pot: { m: 'f13717', grip: [0, 4.2, 0], scale: 0.6 },
  kettle: { m: 'f724', grip: [0, 4, 0], scale: 0.6 },
  hammer: { b: 'hammer', grip: [0, 0.8, 0], one: true, scale: 1 },
  book: { m: 'f3582', grip: [0, 0.4, 0], scale: 0.75 },
  magazine: { m: 'f3586', grip: [0, 0.3, 0], scale: 0.68 },
  slr: { m: 'f13575', grip: [0, 1.6, 0], scale: 0.5 },
  phone: { m: 'f4009', grip: [0, 3, 0], one: true, scale: 0.6 },
  bottle: { m: 'f13360', grip: [0, 3, 0], one: true, scale: 0.5 },
  soda: { m: 'f12784', grip: [0, 2.6, 0], one: true, scale: 0.5 },
  cup: { m: 'f918', grip: [0, 1, 0], one: true, scale: 0.55 },
  mug: { m: 'f1870', grip: [0, 1.1, 0], one: true, scale: 0.7 },
  dart: { b: 'dart', grip: [0, 0, 0.6], one: true, scale: 1 },
  cue: { b: 'cue', grip: [5, 0, 0], scale: 1 },
  basketball: { m: 'f2010', grip: [0, 2.6, 0], scale: 0.55 },
  football: { m: 'f4381', grip: [0, 2, 0], scale: 0.6 }
} as const satisfies Record<string, Held & ({ m: string } | { b: 'hammer' | 'dart' | 'cue' })>;
export type PropName = keyof typeof PROPS;

/** Held (benchBar.ts HELD_PROPS) by the prop's model code or its built name. */
export const HELD_STAND: Readonly<Record<string, Held>> = Object.fromEntries(Object.values(PROPS).map((p) => ['m' in p ? p.m : p.b, p]));

const codes = (s: string) => s.split(' ').map((n) => `f${n}`);
const table = <V>(rows: [string, V][]): Readonly<Record<string, V>> => Object.fromEntries(rows.flatMap(([s, v]) => codes(s).map((c) => [c, v])));

/** The pieces stood at, their use synced (the seat's), what's held: every stove, range, kitchen, fire, grill and oven,
 *  the microwave, the toaster, the fryer, the rice cooker and the pots (the metal pot; the kettles their kettle); the
 *  workbenches (a hammer); the desks, sewing machines, the typewriter, the registers, the copier and the fax; the
 *  telescopes and the microscope; the bookshelves and the racks (a book, a magazine); the chalkboards and the
 *  whiteboard. */
export const STAND_PIECES: Readonly<Record<string, { use: StandUse; prop?: PropName }>> = table([
  ['292 717 744 3251 3270 998 3615 14055 14054 13496 3616 1157 1429 7788 1433 4100 330 889 14216 722 13448 4117 1043 3282 14050 1888 13717 2559 12706 12705', { use: 'cook', prop: 'pot' }],
  ['724 1845 3619 8297', { use: 'cook', prop: 'kettle' }],
  ['1241 3995 3943 3122 7142', { use: 'hammer', prop: 'hammer' }],
  ['3956 1330 3783 12637 2014 840 1328 13163 3701 12700 13115 1128 1127 1211 12713 12714 12768 12679 12678 1745 4101', { use: 'type' }],
  ['1186 3078 1319', { use: 'peer' }],
  ['4125 1558 13078 870 1759', { use: 'read', prop: 'book' }],
  ['12676 1032 1861', { use: 'read', prop: 'magazine' }],
  ['2012 4116 1866', { use: 'write' }]
]);

/** The one-offs: a drink poured and sipped at the coffee things, the tea sets, the mixers, the coolers, the machines; a
 *  photo (the camera's own, the TV camera's); a call (the phones, the phone box); a dart thrown at the dartboard; a shot
 *  on the billiard table; a ball shot at the hoop, kicked into the goal; a ball kicked away (it rolls back). */
export const ACT_PIECES: Readonly<Record<string, { act: Act; prop?: PropName }>> = table([
  ['920 954 429 427 4107 12775 12613', { act: 'sip', prop: 'cup' }],
  ['3467 4033 12720 13369', { act: 'sip', prop: 'mug' }],
  ['1050 4019 667 12610 7392', { act: 'sip', prop: 'soda' }],
  ['3960 1232 1802 1092 971 4412', { act: 'sip', prop: 'bottle' }],
  ['13575 1412', { act: 'photo', prop: 'slr' }],
  ['4009 4029 12313 1185 3987', { act: 'call', prop: 'phone' }],
  ['937', { act: 'dart', prop: 'dart' }],
  ['863', { act: 'cue', prop: 'cue' }],
  ['4226', { act: 'shoot', prop: 'basketball' }],
  ['1149', { act: 'kick', prop: 'football' }],
  ['2010 4381 9584', { act: 'kick' }]
]);
