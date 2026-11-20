// やること's always-loaded part (docs/todo.md): its sheet, a lazySheet (the lists' store and strings come
// with its chunk, TodoSheet.svelte); the menu's pill shows it, the HUD mounts it.
import { lazySheet } from '#lib/ui-state/lazySheet.svelte.ts';

export const todoSheet = lazySheet(() => import('./TodoSheet.svelte'));
