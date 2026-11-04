// A finger on a room's canvas (the tent's, the homes', the museum's): a tap walks or acts, a drag turns the camera (or,
// at my villager's eyes, the head: rooms/firstPerson.ts). The one rule for both rooms, kept free of three.js (the
// screens load it before their engines).

/** A finger's travel (px) that makes a drag (a touch's slop), and how long a tap may be (ms). */
export const SLOP = 10;
export const TAP_MS = 700;
/** Past the slop since it went down: a drag (it never turns back into a tap). */
export const isDrag = (dx: number, dy: number): boolean => Math.hypot(dx, dy) > SLOP;
/** Lifted within the slop and soon: a tap. */
export const isTap = (dx: number, dy: number, ms: number): boolean => !isDrag(dx, dy) && ms < TAP_MS;
