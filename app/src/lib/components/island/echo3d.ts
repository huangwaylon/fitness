// The 3D island's echo of a reaction (world3d/Island3D.svelte): a tap's jiggle, a tree's rustle or shake, a rock
// struck: the thing's model (by its instance id: a scenery id, `goal-A`, a flower's, a decoration's) moves with it.
let sink: ((id: string, strength: number) => void) | null = null;

/** The 3D island listens (null: it's gone). */
export function listen3d(fn: ((id: string, strength: number) => void) | null): void {
  sink = fn;
}

/** A thing (its id) moved as a reaction: the model moves with it. */
export function echo3d(id: string, strength = 1): void {
  if (id) sink?.(id, strength);
}

let poser: ((id: string, key: string | null) => void) | null = null;
/** The 3D island listens for poses (null: it's gone). */
export function listenPose3d(fn: typeof poser): void {
  poser = fn;
}
/** A thing takes another look for a moment (the shishi-odoshi tipped: its `-tip` model), or its own again (null). */
export function pose3d(id: string, key: string | null): void {
  poser?.(id, key);
}
