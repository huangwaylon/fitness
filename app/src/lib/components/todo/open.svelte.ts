// やること's always-loaded part (docs/todo.md): its sheet, a lazySheet (its strings come with its chunk,
// TodoSheet.svelte); the menu's pill and the HUD's peek show it, the HUD mounts it. `show({item})`: the item scrolled
// into view and flashed (the peek's row, a reminder's tap).
import { lazySheet } from '#lib/ui-state/lazySheet.svelte.ts';

export const todoSheet = lazySheet<{ item?: string }>(() => import('./TodoSheet.svelte'));
