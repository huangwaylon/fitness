// The 3D island's flourishes (world3d/effects.ts): a tap's dust, a splash, sparkles, a 「！」, … played at a world point
// (the island has no DOM art of its own: R4 step 7); true: drawn (false: no 3D island listening).
export type Fx3 =
  | 'dust' | 'sand' | 'snow' | 'splash' | 'ripple' | 'sparkle' | 'sparks' | 'bang' | 'leaves' | 'drops' | 'hearts'
  | 'ring' | 'notes' | 'zzz' | 'confetti' | 'swing' | 'bubbles' | 'flame' | 'zap' | 'glint' | 'puff' | 'mark'
  | 'art' | 'burst' | 'aura' | 'candle' | 'smoke';
/** `held`: a held one (a rearing bug's 「！」) stays while it says so; `follow`: where it is each frame (world x, z,
 *  lift: the high five's star in flight); `art`: `v` its art key (an official picture: Island3D draws it) (effects.ts
 *  FxOpts). */
type Opts = { v?: string; art?: string; ms?: number; size?: number; dir?: number; held?: () => boolean; follow?: () => readonly [number, number, number?] };
let sink: ((kind: Fx3, x: number, z: number, lift: number, o: Opts) => void) | null = null;

/** The 3D island listens (null: it's gone). */
export function listenFx3(fn: typeof sink): void {
  sink = fn;
}

/** Play a flourish at a world point (`lift` above the ground): true when the 3D island drew it. */
export function fx3d(kind: Fx3, x: number, z: number, lift = 0, o: Opts = {}): boolean {
  if (!sink) return false;
  sink(kind, x, z, lift, o);
  return true;
}
