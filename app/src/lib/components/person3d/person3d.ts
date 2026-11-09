// Who a person is drawn as in 3D (docs/design.md "Players"; design/avatar/customization.md §1): the one seam between a
// person's effective look (contract/look.ts Look, store/look.ts lookOf) and the model a scene stands up for them (the
// island's world3d/villagers.ts, the tent's and the museum's engines; first person, seats, the rod and the net go
// through the model's own interface, the same for both kinds). A `player` look is NH's human player
// (player3d createPlayer), a `villager` look the roster villager (villager3d createVillager, the `villager` pref).
// A scene keeps the model while its `key` stays and swaps it, in place, when the key changes (the look changed: on
// leaving すがた, or the partner's phone sending theirs). Pure but for the model factories (player3d loads on first use).
import type { Look } from '#lib/contract/look.ts';
import type { Who } from '#lib/types.ts';
import { resolveLook as villagerLook } from '#lib/villagers/look.ts';
import { createVillager, type Villager3D } from '../villager3d/villager3d.ts';
import { url3d } from '../villager3d/manifest.ts';
import type { WebGLRenderer } from 'three';
import type { Painter } from '../look/portraits.svelte.ts';
import type { Shooter } from '../player3d/player3d.ts';
import { drawOff } from '../../ui-state/testMode.ts';

/** Where the models are (the site's room/villagers3d/ and room/player/: $app/paths asset). */
export interface Dirs { villagers: string; player: string }

/** A person's model as a scene draws it. */
export interface Person3 {
  /** Same key, same model: a new one swaps it. */
  key: string;
  kind: 'villager' | 'player';
  /** The roster villager: drawn for a villager look (its render the 2D card till its model is in), and a player's
   *  stand-in if its parts can't be had. */
  villager: string;
  /** It has a 3D model (a villager without one: the card only). */
  has3d: boolean;
  /** Load it (null: no model). `seed` staggers its blinks and breathing. */
  create(seed: number): Promise<Villager3D> | null;
}

/** A roster villager's model (a person's, or a visitor's: world3d/villagers.ts). */
export function villager3(id: string, dir: string): Person3 {
  const url = url3d(id, dir);
  return { key: `v:${id}`, kind: 'villager', villager: id, has3d: !!url, create: (seed) => (url ? createVillager(id, url, seed) : null) };
}

/** A look's fields in a fixed order (the key: two equal looks are one model). */
const lookKey = (l: Look): string => JSON.stringify(Object.keys(l).sort().map((k) => [k, l[k as keyof Look] ?? null]));

const memo = new WeakMap<Look, { pref: string | null | undefined; p: Person3 }>();

/**
 * Who draws `who` wearing `look`: their villager (`villagerPref`, the `villager` pref; null: their default) for a
 * villager look, NH's human player for a player look (their villager if a part can't be had). Memoised by the look
 * object (a scene asks every frame).
 */
export function person3(who: Who, look: Look, villagerPref: string | null | undefined, dirs: Dirs): Person3 {
  const hit = memo.get(look);
  if (hit && hit.pref === villagerPref) return hit.p;
  const id = villagerLook({ villager: look.kind === 'villager' ? (look.villager ?? villagerPref) : villagerPref, person: who }).id;
  const v = villager3(id, dirs.villagers);
  let p = v;
  if (look.kind === 'player') {
    const { kind: _kind, ...parts } = look;
    p = {
      key: `p:${lookKey(look)}`, kind: 'player', villager: id, has3d: true,
      create: (seed) => import('../player3d/player3d.ts')
        .then(({ createPlayer }) => createPlayer(who, parts, dirs.player, seed))
        .catch(() => v.create(seed) ?? Promise.reject(new Error(`no model for ${who}`)))
    };
  }
  memo.set(look, { pref: villagerPref, p });
  return p;
}

/**
 * The 2D heads' portraits (look/portraits.svelte.ts useIdlePainter) drawn by a renderer the page has (the island's),
 * one at a time when `idle()` (nothing moving, or paused under a sheet): one player kept for the shots, dressed in each
 * look. Nothing in the logic mode (null: the stand-in stays). `drawn()` after each (the island draws again).
 */
export function createPainter(renderer: WebGLRenderer, dir: string, idle: () => boolean, drawn: () => void): { paint: Painter; dispose(): void } {
  let gone = false, queue: Promise<unknown> = Promise.resolve(), pending = 0, done: ReturnType<typeof setTimeout> | undefined;
  let shooter: Shooter | null = null;
  const settle = () => new Promise<void>((ok) => {
    const t = () => (gone || idle() ? ok() : setTimeout(t, 400));
    setTimeout(t, 400);
  });
  /** The shots' player let go of once none are asked for a while (its textures off the island's renderer). */
  const letGo = () => {
    shooter?.dispose();
    shooter = null;
  };
  const paint: Painter = (look, px) => {
    pending++;
    clearTimeout(done);
    const run = queue.then(async () => {
      if (gone || drawOff()) return null;
      await settle();
      const { createShooter } = await import('../player3d/player3d.ts');
      shooter ??= createShooter('portrait', dir);
      const url = await shooter.shoot(renderer, look, px, () => gone);
      if (url) drawn();
      return url;
    });
    queue = run.catch(() => null).finally(() => {
      if (--pending === 0) done = setTimeout(letGo, 5000);
    });
    return run;
  };
  return {
    paint,
    dispose() {
      gone = true;
      clearTimeout(done);
      letGo();
    }
  };
}
