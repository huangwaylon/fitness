// Small numeric helpers and easing curves shared by the 3D rooms, the island and the charts. Pure, imports nothing.

/** `v` held to [lo, hi]. */
export const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

/** `v` held to [0, 1]. */
export const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

/** The smoothstep curve 3k² − 2k³, unclamped (for a k already in [0, 1]). */
export const hermite = (k: number): number => k * k * (3 - 2 * k);

/** The smoothstep curve over [0, 1], `v` clamped first. */
export const smooth01 = (v: number): number => hermite(clamp01(v));

/** GLSL's smoothstep: 0 at `a`, 1 at `b` (either way round), smooth between; 1 when a = b. */
export const smoothstep = (a: number, b: number, v: number): number => (a === b ? 1 : smooth01((v - a) / (b - a)));

/** Ease out, cubic: quick, then settling (k in [0, 1]). */
export const cubicOut = (k: number): number => 1 - (1 - k) ** 3;

/** Ease in and out, cubic (k in [0, 1]). */
export const cubicInOut = (k: number): number => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);
