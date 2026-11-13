// The island's walk speeds, on their own (no imports: the e2e read them too, e.g. shared-world.spec's drift).

/** Walk speeds (u/s): brisk (a goal met walks to its tree, the meet-up), running where a tap sends it (spec §4), and
 *  strolling (idle outings, visitors). A player's two (action, run) are half as fast again as they were (240, 200: the
 *  user, 2026-11-04, "increase the walk speed of players by 50%"); the strolls are as they were. */
export const SPEED = { action: 360, run: 300, wander: 90 } as const;
