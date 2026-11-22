// The small instruments lifted off where they stand into the hands while played (tent/uses.ts holds them, as the gym's
// held pieces: world3d/benchBar.ts heldAt): the guitars, the ukulele and the violin, the winds, the hand mics. Each
// gripped at its model's middle (half its height up: items.json `h`) and held at a size a room's villager can carry,
// turned in the hands as it's played (`turn`) and held its own way (`how`: playPose.ts's arms for it): a guitar's neck
// out to the left hand, the strumming hand at its body; the violin up at the chin, its scroll to the left hand, the bow
// arm across; a sax, a clarinet or the trumpet upright in front at the mouth, the hands on its keys; a mic in the right hand at the mouth. The rest (a piano, a harp, a cello, a mic stand, the
// drums) stays put.
import type { Held } from '../world3d/benchBar.ts';

/** How a held instrument is played (playPose.ts's arms for it). */
export type HoldHow = 'guitar' | 'violin' | 'sax' | 'horn' | 'mic';
export type HeldPlay = Held & { how: HoldHow };

/** Upright on its stand (model y its length): its top to the left hand (heldAt's x runs from it to the right). Lying
 *  flat across a diagonal (the ukulele's): along the hands, its face out. Upright, its top tipped back to the mouth (the
 *  winds: their stands come with them). */
const NECK_LEFT = [0, 0, -Math.PI / 2] as const, FLAT_DIAGONAL = [Math.PI / 2, -Math.PI / 4, 0] as const, TO_MOUTH = [-0.3, 0, 0] as const;
const at = (h: number, scale: number, how: HoldHow, turn?: readonly [number, number, number]): HeldPlay => ({
  grip: [0, h / 2, 0], scale, how, ...(how === 'mic' ? { one: true as const } : {}), ...(turn ? { turn } : {})
});

export const HELD_PLAY: Readonly<Record<string, HeldPlay>> = {
  // the rock, electric and acoustic guitars, the ukulele, the fancy violin
  f1644: at(15.5, 0.6, 'guitar', NECK_LEFT),
  f1645: at(14.9, 0.6, 'guitar', NECK_LEFT),
  f383: at(15.9, 0.6, 'guitar', NECK_LEFT),
  f669: { ...at(1.4, 1, 'guitar', FLAT_DIAGONAL), grip: [0, 0.7, 0] },
  f2772: at(10, 0.6, 'violin', NECK_LEFT),
  // the alto saxophone, the trumpet, the clarinet
  f846: at(11.6, 0.7, 'sax', TO_MOUTH),
  f1206: at(10.8, 0.7, 'horn', TO_MOUTH),
  f13470: at(10.9, 0.7, 'sax', TO_MOUTH),
  // the silver mic, the desktop mic
  f1045: at(12.2, 0.5, 'mic'),
  f13476: at(5.4, 0.7, 'mic')
};
