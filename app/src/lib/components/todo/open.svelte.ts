// やること's always-loaded part (docs/todo.md): its sheet, a lazySheet (the lists' store and strings come
// with its chunk, TodoSheet.svelte); the menu's pill shows it, the HUD mounts it. `show({list, item})`: open on that
// list, the item scrolled into view and flashed (the menu's 今日・明日 panel, a reminder's tap).
import { lazySheet } from '#lib/ui-state/lazySheet.svelte.ts';

export const todoSheet = lazySheet<{ list?: string; item?: string }>(() => import('./TodoSheet.svelte'));
