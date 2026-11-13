// The villagers' faces for a while (IslandScene): a wasp's sting from a shaken tree (TreeShakes: a fright, a sweat drop,
// NH's swollen eye a while) and Jack's trick (no candy for him: my villager's face goofy for a minute, NH's trick changes
// your look). Each on a timer of its own, all cleared as the island goes (`clear`: up to a minute, its closure held the
// island past its going).
import { setEmote, setMotion } from '../motion/director.svelte.ts';
import type { VillagerActor } from '#lib/ui-state/cast.ts';
import { STUNG_SWEAT_MS, SWOLLEN_MS } from './treeShake.ts';
import { TRICK_MS } from '../../world/visitors.ts';

const none = (): Record<VillagerActor, boolean> => ({ mine: false, partner: false, third: false });

export class Faces {
  stung = $state(none());
  swollen = $state(none());
  tricked = $state(false);
  #timers = new Map<string, ReturnType<typeof setTimeout>>();
  /** `fn` in `ms` under `key` (the last of a key's only). */
  #at(key: string, ms: number, fn: () => void) {
    clearTimeout(this.#timers.get(key));
    this.#timers.set(key, setTimeout(() => (this.#timers.delete(key), fn()), ms));
  }

  sting = (side: VillagerActor): void => {
    setMotion(side, 'surprise');
    setEmote(side, 'mark-bang');
    this.stung[side] = this.swollen[side] = true;
    this.#at(`swell:${side}`, SWOLLEN_MS, () => (this.swollen[side] = false));
    this.#at(`sting:${side}`, STUNG_SWEAT_MS, () => {
      setEmote(side, 'mark-sweat');
      this.#at(`sting:${side}`, STUNG_SWEAT_MS, () => (this.stung[side] = false));
    });
  };

  trick = (): void => {
    setMotion('mine', 'surprise');
    setEmote('mine', 'mark-bang');
    this.tricked = true;
    this.#at('trick', TRICK_MS, () => (this.tricked = false));
  };

  clear(): void {
    for (const t of this.#timers.values()) clearTimeout(t);
    this.#timers.clear();
  }
}
