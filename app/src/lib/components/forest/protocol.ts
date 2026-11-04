// くまのもり's messages (docs/design.md "Kuma no mori"): what the players' phones say to each other. The POC carries them
// over a BroadcastChannel between tabs of one browser (link.ts); a relay room would carry the same shapes. The host
// (the lowest of A, B, G in the round) runs the bears, the items' claims and the clock; each phone moves its own player.
import type { Who } from '#lib/sync/live-protocol.ts';

/** A player as the others see it: where, facing, how fast (m/s), what it's doing. */
export type PState = 'ok' | 'hide' | 'climb' | 'down' | 'home' | 'out';
export interface PNet {
  who: Who;
  x: number;
  z: number;
  /** Facing (radians, three's yaw: 0 faces +z). */
  f: number;
  /** Speed (m/s). */
  v: number;
  st: PState;
  /** On a cliff's top. */
  top: boolean;
  /** The bush it hides in (st 'hide'). */
  bush?: number;
  /** What's in its basket. */
  n: number;
  /** Sprinting (loud). */
  run: boolean;
  /** Down, and it gets up on its own (a solo player's one get-up): the round isn't lost yet. */
  up?: boolean;
}

export type BState = 'sleep' | 'wander' | 'sniff' | 'alert' | 'chase' | 'tele' | 'lunge' | 'recover' | 'search' | 'stun' | 'trap' | 'relief' | 'eat';
export interface BNet {
  x: number;
  z: number;
  f: number;
  v: number;
  st: BState;
  /** Who it's after (chase, alert, tele, lunge). */
  tg?: Who;
  /** Tripped on a root (its chase slowed a moment). */
  trip?: boolean;
}

export type Msg =
  | { k: 'hi'; who: Who; name: string; vid: string; ready: boolean; bears: number }
  | { k: 'bye'; who: Who }
  | { k: 'start'; t0: number; seed: number; players: Who[]; bears: number; host: Who }
  | ({ k: 'p' } & PNet)
  | { k: 'bear'; b: BNet[]; t: number }
  /** A claim on an item (to the host), and the host's answer to everyone. */
  | { k: 'pick'; who: Who; id: number }
  | { k: 'picked'; who: Who; id: number; n: number }
  /** A pile dropped where someone went down (the host makes it an item). */
  | { k: 'drop'; who: Who; x: number; z: number; n: number; top: boolean }
  | { k: 'pile'; id: number; x: number; z: number; n: number; top: boolean }
  | { k: 'bank'; who: Who; n: number }
  | { k: 'banked'; who: Who; n: number; total: number }
  /** Caught by a bear (the host's call), revived by a partner, gone home. */
  | { k: 'catch'; who: Who; by: number }
  | { k: 'revive'; who: Who; by: Who }
  | { k: 'home'; who: Who; why: 'caught' | 'bled' | 'time' | 'left' }
  /** A pitfall seed planted, and a bear in it. */
  | { k: 'seed'; who: Who; x: number; z: number }
  | { k: 'trap'; id: number; x: number; z: number; bear?: number }
  /** A leaner pushed over (the host's world), a wasp nest knocked down. */
  | { k: 'push'; who: Who; id: number }
  | { k: 'fell'; id: number; hit?: number }
  | { k: 'nest'; who: Who; id: number }
  | { k: 'swarm'; id: number; bear?: number; who?: Who }
  /** A near miss (ギリギリ!) for `who`. */
  | { k: 'giri'; who: Who }
  | { k: 'end'; why: 'time' | 'wiped' | 'left'; total: number };
