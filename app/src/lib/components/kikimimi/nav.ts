// ききみみ's one stack (docs/kikimimi-ux.md §5, SettingsSheet's pattern): the hub is the root (an empty stack) and each
// page is pushed over it; ‹ pops one, ✕ closes the sheet, and a deep link builds the whole stack (the invite: the hub,
// then みんなで; the たいかい banner: its lobby). Pages are at most three deep. Pure: the sheet keeps the stack in its state.
import type { ModeId } from '#lib/kikimimi/catalog.ts';

export type Page =
  | { k: 'asobu' }
  | { k: 'mode'; m: ModeId }
  | { k: 'lobby' }
  | { k: 'record' }
  | { k: 'settings' }
  | { k: 'path' }
  | { k: 'unit'; id: string }
  | { k: 'zukan'; unit: string | null }
  | { k: 'story' }
  | { k: 'taikai' };

/** The deepest stack: three pages over the hub (the path's unit's ずかん over あそぶ is the one that reaches it). */
export const MAX_DEPTH = 4;

const same = (a: Page, b: Page): boolean => JSON.stringify(a) === JSON.stringify(b);

/** `p` pushed (a page already on top stays once; past the depth the oldest above the hub goes). */
export function push(stack: readonly Page[], p: Page): Page[] {
  const top = stack.at(-1);
  if (top && same(top, p)) return [...stack];
  const next = [...stack, p];
  return next.length > MAX_DEPTH ? next.slice(next.length - MAX_DEPTH) : next;
}

/** One page popped (the hub stays). */
export const pop = (stack: readonly Page[]): Page[] => stack.slice(0, -1);

/** The stack an invite's さんか builds: みんなで over the hub (‹ lands on the hub). */
export const inviteStack = (): Page[] => [{ k: 'lobby' }];

/** The stack the hub's たいかい banner opens: the tournament's lobby over the hub. */
export const taikaiStack = (): Page[] => [{ k: 'taikai' }];

/** The stack a mode opens on: あそぶ, then the mode (‹ goes to あそぶ, then the hub). */
export const modeStack = (m: ModeId): Page[] => [{ k: 'asobu' }, { k: 'mode', m }];
