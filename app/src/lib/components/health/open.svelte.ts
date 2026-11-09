// けんこう and ごはん's sheet, a lazySheet (its chunk holds ごはん's code, never its food data): the HUD's dumbbell shows it
// on the tab shown last; a tree popup's ごはん button (docs/design.md "Trees") shows it on ごはん, today, on the tree's
// owner's day (HealthSheet reads the ask). Kept apart so the island's chunk never loads the sheet's.
import type { Who } from '#lib/types.ts';
import { lazySheet } from '#lib/ui-state/lazySheet.svelte.ts';

/** Its show's arg: whose day ごはん opens on. */
export const kenkou = lazySheet<Who>(() => import('./HealthSheet.svelte'));

export const askFood = (who: Who): void => kenkou.show(who);
