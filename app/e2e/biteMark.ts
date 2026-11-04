// The bite's 「！」 as the 3D island draws it (world3d/biteMark.ts: __world3d.bite(slot), canvas px), for the specs that
// fish: where it is against its villager's head on screen.
import type { Page } from '@playwright/test';

export type Mark = {
  shown: boolean;
  /** Its size held (u) and on screen (px), and as drawn now (u: the pop's scale on it). */
  size: number;
  px: number;
  s: number;
  /** Its bottom's and top's middles, its sides (canvas px). */
  bottom: [number, number];
  top: [number, number];
  left: number;
  right: number;
  /** Its anchor (three's space, unbent). */
  at: [number, number, number];
  /** Its villager's head bone and the head's top on screen (canvas px), or null (no 3D model). */
  head: [number, number] | null;
  crown: [number, number] | null;
};

/** What's off about a mark over its villager's head (none: right): drawn, straight over the head's top (within `tol`
 *  px across), its bottom just over it (never under it, never floating off), upright and square, in its size's clamp. */
export function overHead(m: Mark | null, tol = 3): string[] {
  if (!m) return ['no mark'];
  const bad: string[] = [];
  if (!m.shown) bad.push('not shown');
  const [bx, by] = m.bottom, [tx, ty] = m.top;
  if (Math.abs(tx - bx) > 0.5 || !(ty < by)) bad.push(`not upright: bottom ${m.bottom} top ${m.top}`);
  if (Math.abs(m.right - m.left - (by - ty)) > 0.5) bad.push(`not square: ${m.right - m.left} × ${by - ty}`);
  if (m.px < 30 - 0.5 || m.px > 52 + 0.5) bad.push(`${m.px} px`);
  if (!m.crown || !m.head) return [...bad, 'no head'];
  const [cx, cy] = m.crown;
  if (Math.abs(bx - cx) > tol) bad.push(`${(bx - cx).toFixed(1)} px off the head's top across`);
  // (OVER_U over it: a few px, its hop's few more)
  const gap = cy - by;
  if (!(gap > 0)) bad.push(`under the head's top by ${(-gap).toFixed(1)} px`);
  if (gap > 24) bad.push(`${gap.toFixed(1)} px over the head's top`);
  if (!(cy < m.head[1])) bad.push(`the head's top under its bone`);
  return bad;
}

/** A villager's 「！」 drawn now. */
export const markShown = (page: Page, slot = 'mine') =>
  page.evaluate((s) => (window as unknown as { __world3d: { bite(slot: string): Mark | null } }).__world3d.bite(s)?.shown ?? false, slot);
