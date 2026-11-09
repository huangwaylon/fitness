// Small numeric helpers and easing curves shared by the 3D rooms, the island and the charts, and a number as typed
// (the goals', ごはん's fields). Pure, imports nothing.

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

/** A number as typed on a phone (a goal, a food's grams): full-width digits, point and comma (「６５０」, 「１２．５」) as
 *  ASCII, a trailing unit (`units`: `g|ml`) dropped, thousands commas (`1,200`) or else a decimal comma (`68,4`), five
 *  digits at most before the point. null: nothing typed; undefined: not a number. */
export function parseTyped(text: string, units: string): number | null | undefined {
  const raw = text.trim().replace(/[０-９．，]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(new RegExp(`\\s*(${units})$`, 'i'), '');
  const s = /^\d{1,3}(,\d{3})+(\.\d+)?$/.test(raw) ? raw.replace(/,/g, '') : raw.replace(',', '.');
  if (!s) return null;
  return /^\d{1,5}(\.\d+)?$/.test(s) ? Number(s) : undefined;
}
