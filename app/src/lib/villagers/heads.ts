// Where each villager render's head is (scripts/heads.ts measures it from the art's alpha), for what sits on it: the
// birthday hat and Jack's party glasses. Loaded only when one is worn (heads.json is ~15 KB).
/** [cx, hatY, eyeY, faceW]: the head's middle, where a hat sits, the eyes' line and the face's width, as fractions of
 *  the drawn figure (x and widths of its width, y of its height). */
export type HeadBox = readonly [cx: number, hatY: number, eyeY: number, faceW: number];

/** A typical NH villager's head, until the table is in (or for a render it doesn't know). */
export const TYPICAL_HEAD: HeadBox = [0.5, 0.07, 0.27, 0.95];

export const loadHeads = (): Promise<Record<string, HeadBox>> =>
  import('./heads.json').then((m) => m.default as unknown as Record<string, HeadBox>);
