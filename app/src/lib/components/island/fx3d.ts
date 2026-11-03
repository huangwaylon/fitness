// The 3D island's flourishes (world3d/effects.ts): where the DOM island plays a tap's dust, a splash, sparkles, a 「！」,
// it asks the 3D island first; true: drawn there (the DOM's own goes invisible: its `in3d`). Nothing listens on the 2D
// island.
export type Fx3 =
  | 'dust' | 'sand' | 'snow' | 'splash' | 'ripple' | 'sparkle' | 'sparks' | 'bang' | 'leaves' | 'drops' | 'hearts'
  | 'ring' | 'notes' | 'zzz' | 'confetti' | 'swing' | 'bubbles' | 'flame';
/** `held`: a held one (the bite's 「！」) stays while it says so (effects.ts FxOpts). */
type Opts = { v?: string; ms?: number; size?: number; dir?: number; held?: () => boolean };
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
