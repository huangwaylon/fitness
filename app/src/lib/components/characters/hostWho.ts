// Who hosts the island right now (reactive: reads the week's view through what the app's shell binds here,
// routes/AppShell.svelte, so a page without the store, ジム's and 共有リンク's, draws しずえ without loading it): しずえ,
// or たぬきち when either player picked しずえ as their villager. <Host> draws them, the dialogue box names them.
import { hostOf } from '#lib/villagers/look.ts';

let villagers: () => readonly (string | null | undefined)[] = () => [];
/** The players' villagers, as the week's view has them. */
export const bindHostVillagers = (f: () => readonly (string | null | undefined)[]): void => void (villagers = f);

export const hostIsNook = (): boolean => hostOf(villagers()) === 'tom-nook';
