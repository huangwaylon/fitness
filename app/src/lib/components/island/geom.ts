// Stage geometry shared by the island's placement searches: an axis-aligned box and its overlap test.

/** A box (stage units or client px, as the caller uses it): x0 ≤ x1, y0 ≤ y1. */
export interface Box { x0: number; x1: number; y0: number; y1: number }

/** Whether two boxes overlap (touching edges don't). */
export const hits = (a: Box, b: Box): boolean => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
