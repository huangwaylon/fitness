// The uses ridden or sat in (villager3d/poses-ride.ts), where each is used: by the rooms' item code (`room`) and the
// island's kind (`island`), spread into scripts/seat-anchors.ts's ROOM_USE and USE. By hand from each model's own views
// and rays (model units, +z its front; the feet's spot stood, the hips' sat: seats3d.ts `u`): the vehicles face −x (NH's),
// their driver's seat under the cab's roof; a cart is pushed from behind its handle (`top` the handle's height); the
// elephant slide's round starts behind its back (`top` the slide's top: poses-ride.ts slideAt). RIDE_BATHS are soaked in
// (their inner floor found as a bath's: scripts/inner-floor.ts).
import type { UseShape } from '../src/lib/components/villager3d/seats3d.ts';

const Q = Math.PI / 2;
const u = (use: UseShape['use'], x: number, y: number, z: number, yaw: number, fx: number, fz: number, more: Partial<UseShape> = {}): UseShape => ({ k: 'u', use, x, y, z, yaw, fx, fz, ...more });
/** Pushed from behind its handle (`h` up), facing `yaw`, stood at (x, z). */
const pushAt = (x: number, z: number, yaw: number, h: number) => u('push', x, 0, z, yaw, x, z, { top: h });

export const RIDE_ROOM: Record<string, UseShape> = {
  // driven: the tractor (its canopy hidden meanwhile: lid.ts PARTS), the bulldozer, the excavator (its cab at +z), the
  // steamroller, the truck (the right-hand seat, −z), the minicar: in a closed cab, hidden once in (poses-ride.ts CABS)
  f12606: u('drive', 4.5, 8.1, 0, -Q, 4.5, 13),
  f12600: u('drive', 4.8, 11, 0, -Q, 4.8, 13.5),
  f12602: u('drive', 2.5, 10.2, 3.5, -Q, 2.5, 13),
  f12603: u('drive', 3, 11.7, 0, -Q, 3, 13),
  f14049: u('drive', -9, 9.1, -2, -Q, -9, 13),
  f13621: u('drive', 0.5, 5.3, -2, -Q, 0.5, 13),
  // pedalled: the mountain bike and the cruiser bike, on the saddle (both stand turned on their kickstands)
  f2614: u('pedal', -3.1, 9.6, -2.4, 1.09, -3, 8),
  f12311: u('pedal', -2.9, 8.5, -2.2, 0.88, -3, 8),
  // climbed into and hidden: the rocket (at its gantry's lowest arm), the space shuttle's cockpit, the saucer (beamed up)
  f1441: u('board', -2.8, 14, 0, Q, 3, 8),
  f1444: u('board', 4.5, 3.5, 0, Q, 4, 9),
  f1447: u('board', 0, 12, 0, 0, 0, 13),
  // the ship's helm: at its wheel (its front, +z), facing it
  f1273: u('steer', 0, 0, 5.4, Math.PI, 0, 9),
  // balanced on: the skateboard (side on along its diagonal), the surfboard laid down off its rack (poses-ride.ts LAID)
  f13523: u('balance', 0, 1.9, 0, Q / 2, 0, 8),
  f7868: u('balance', 0, 1.75, 11, Q, 6, 11),
  // pushed: the stroller, the shopping cart, the handcart (a wheelbarrow, turned on its diagonal), the utility wagon, the
  // rolling cart, the caged cart, the garden wagon, the clackercart, the mining car, the operating-room cart, the ironwood
  // cart
  f1493: pushAt(7.7, 0, -Q, 6),
  f1133: pushAt(7.5, 0, -Q, 10),
  f7229: pushAt(-4.8, -4.95, Q / 2, 6.1),
  f13638: pushAt(-7.8, 0, Q, 10),
  f13356: pushAt(7.3, 0, -Q, 9.8),
  f13211: pushAt(7.5, 0, -Q, 9),
  f8419: pushAt(12.8, 0, -Q, 7.2),
  f80: pushAt(6.3, 0, -Q, 8.3),
  f13505: pushAt(7.8, 0, -Q, 6.6),
  f543: pushAt(7.3, 0, -Q, 9.3),
  f3195: pushAt(7.9, 0, -Q, 7.3),
  // dug in: the sandbox (in it, behind its toys), beside the sand castle
  f1116: u('dig', 2, 1.2, -3, 0, 2, 13),
  f1117: u('dig', 7.2, 0, 1.5, -Q, 7.2, 1.5),
  // the elephant slide: behind its back, facing along it (its top 9 up)
  f86: u('slide', -10.5, 0, 0, Q, -10.5, 0, { top: 9 }),
  // ridden as it spins: in the teacup ride's blue cup, on the carousel's front horse; in the plaza train's cab
  f1507: u('ride', 7.5, 4.4, 0, 0, 7.5, 18),
  f12684: u('carousel', 5, 13.6, 4, 2.47, 5, 18),
  f12803: u('ride', 6, 7.8, 0, -Q, 4, 8),
  // the seats that do something more (their seat's own spot, as the rays found it): the massage chairs shake, the gaming
  // and office chairs swivel, the tire toy bounces; the playground gym is climbed (its front's first level, 6.5 up)
  f12338: u('massage', 0, 4.5, 0, 0, 0, 9.8),
  f12339: u('massage', 0, 5, 0, 0, 0, 7.3),
  f13519: u('swivel', 0, 5.2, 2, 0, 0, 10.3),
  f12599: u('swivel', 0, 5.1, 0.5, 0, 0, 9.3),
  f832: u('swivel', 0, 5.2, 1.5, 0, 0, 9.8),
  f2329: u('bounce', 0, 3.8, 0, 0, 0, 7.3),
  f3430: u('climb', 0, 0, 10.8, Math.PI, 0, 10.8, { top: 6.5 })
};

/** The island's own kinds of the same NH pieces (their models' frames the rooms'; the wheelbarrow's and the garden wagon's aren't: not ridden). */
export const RIDE_ISLAND: Record<string, UseShape> = {
  sandcastle: RIDE_ROOM.f1117,
  'utility-wagon': RIDE_ROOM.f13638
};

/** Soaked in, as the baths (seat-anchors.ts BATHS): the plastic pool, the pool. */
export const RIDE_BATHS: readonly string[] = ['f3348', 'f3596'];
