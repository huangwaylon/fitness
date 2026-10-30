// Who hosts the island right now (reactive: reads the week store's view): しずえ, or たぬきち when either player picked
// しずえ as their villager. <Host> draws them, the dialogue box names them.
import { week } from '#lib/store/week.svelte.ts';
import { hostOf } from '#lib/villagers/roster.ts';

export const hostIsNook = (): boolean => {
  const people = week.view?.people;
  return hostOf(people ? [people.A?.villager, people.B?.villager] : []) === 'tom-nook';
};
