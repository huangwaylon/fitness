// The small instruments lifted off where they stand into the hands while played (tent/uses.ts holds them, as the gym's
// held pieces: world3d/benchBar.ts heldAt): the guitars, the ukulele and the violin, the winds, the hand mics. Each
// gripped at its model's middle (half its height up: items.json `h`) and held at a size a room's villager can carry;
// a mic in the right hand. The rest (a piano, a harp, a cello, a mic stand, the drums) stays put.
import type { Held } from '../world3d/benchBar.ts';

const at = (h: number, scale: number, one?: true): Held => ({ grip: [0, h / 2, 0], scale, ...(one ? { one } : {}) });

export const HELD_PLAY: Readonly<Record<string, Held>> = {
  // the rock, electric and acoustic guitars, the ukulele, the fancy violin
  f1644: at(15.5, 0.6),
  f1645: at(14.9, 0.6),
  f383: at(15.9, 0.6),
  f669: at(1.4, 1),
  f2772: at(10, 0.6),
  // the alto saxophone, the trumpet, the clarinet
  f846: at(11.6, 0.7),
  f1206: at(10.8, 0.7),
  f13470: at(10.9, 0.7),
  // the silver mic, the desktop mic
  f1045: at(12.2, 0.5, true),
  f13476: at(5.4, 0.7, true)
};
