// What keeps the 3D island's frames coming for the island's own life drawn by its models' `live` positions (a critter
// swimming, darting, fading: Critters.svelte), read by the effects' frame (effects.ts) each frame: `ambient` > 0 the
// ambient rate at least (a shadow drifting: the engine's 30 a second), `full` > 0 the full rate (a dart, a fade, a
// nibble). `slow`: a slow move (under SLOW_PX on screen) or one off screen may be ambience (Island3D: not where the
// ambience is a software renderer's few frames). Plain values, no dependencies (the island's chunk imports this, not three.js).
export const pace = { ambient: 0, full: 0, slow: true };
/** A move slower than this on screen (px/s) is ambience: drawn at the ambient rate, not the full one. */
export const SLOW_PX = 60;
