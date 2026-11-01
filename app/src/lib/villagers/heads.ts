// Where each villager render's head and eyes are (scripts/heads.ts measures them from the art), for what sits on them:
// the birthday hat, Jack's party glasses and a sting's swollen eye. Loaded only when one is worn (heads.json is ~22 KB).
/** [cx, hatY, eyeY, faceW, lx, ly, rx]: the head's middle, where a hat sits, the eyes' line (estimated from the head's
 *  shape) and the face's width; then the eyes as found: the left one as drawn (or a profile's only one) and the right
 *  one's x (null when only one shows), the pair level. Fractions of the drawn figure (x and widths of its width, y of
 *  its height). */
export type HeadBox = readonly [cx: number, hatY: number, eyeY: number, faceW: number, lx: number, ly: number, rx: number | null];

/** A typical NH villager's head, until the table is in (or for a render it doesn't know). */
export const TYPICAL_HEAD: HeadBox = [0.5, 0.07, 0.27, 0.95, 0.3, 0.27, 0.7];

export const loadHeads = (): Promise<Record<string, HeadBox>> =>
  import('./heads.json').then((m) => m.default as unknown as Record<string, HeadBox>);

/** NH's sting: one eye swollen shut under a pink lump. Which eye: the left as drawn, or the right on a render drawn
 *  looking right (its near eye), or a profile's only one; the lump's width about half the eyes' spacing (a profile: a
 *  fifth of the face), 10–26% of the figure. Its middle (x, y) and width, as fractions of the figure. */
export function swollenEye(box: HeadBox, looksRight: boolean): { x: number; y: number; w: number } {
  const [, , , faceW, lx, ly, rx] = box;
  const w = Math.min(0.26, Math.max(0.1, rx === null ? faceW * 0.2 : Math.abs(rx - lx) * 0.55));
  return { x: looksRight && rx !== null ? rx : lx, y: ly, w };
}
