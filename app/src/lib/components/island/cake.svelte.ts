// The birthday cake (docs/design.md "Birthdays"; birthday.ts): on one of our birthdays NH's birthday cake stands in front
// of centre stage (world.ts CAKE, the campsite's clearing seen from おく), its candles lit. A tap (a scene item like the
// visitors, a 44px reach, while it's on screen) plays NH's Happy Birthday for everyone (the island's music stage,
// sound/stage.svelte.ts: every phone outdoors from the same point, docs/sound-sync.md; unheard, a little music box: an
// original tune, a jingle) and the candles go out as it starts on every phone: a puff of smoke, out for the day. No ベル.
// No DOM of its own (R4 step 7): the 3D island draws its model, the candles' flames (things3 emit 'candle', held while
// they're lit) and the smoke (fx3d); SceneTaps loads this chunk on a birthday and asks it about each tap (`tap`).
import { untrack } from 'svelte';
import { cutInSong, live, request } from '#lib/sound/stage.svelte.ts';
import { onStageStart } from '#lib/sound/stageStart.svelte.ts';
import { minuteNow } from '#lib/time/clock.ts';
import { localDateAt } from '#lib/time/dates.ts';
import { CAKE } from '#lib/world/world.ts';
import { site } from './site.svelte.ts';
import type { World } from './camera.svelte.ts';
import { thing, things3 } from '../world3d/things3.ts';
import { blowOut, candlesOut } from '#lib/world/birthday.ts';
import { MIN_HIT, SHOWN, grow, inside, type Seen } from './hitbox.ts';
import { fx3d } from '#lib/world/fx3d.ts';
import { propBox, type Prop } from './deck.svelte.ts';

/** The cake as the e2e's hooks have it (things3 probes 'cake'; Island3D adds `shown` by `id3`): `out` (its candles blown
 *  out) and its model's box. */
export interface CakeRow { out: boolean; id3: string; box: { left: number; top: number; width: number; height: number } }

/** NH's cake on the 3D island (u: deco/birthday-cake, 8 model units across at 3), and its five candles' flames: across
 *  its top (shares of its width), that high. */
const CAKE_W = 24, CAKE_H = 15, CANDLES = [-0.26, -0.13, 0, 0.13, 0.26], FLAME_UP = 16.5;

/** The cake on island `w` (`on`: today is a birthday): its effects in a root of their own (`stop` with the scene). */
export function useCake(w: World, o: { enabled: () => boolean; on: () => boolean }): Prop & { stop: () => void } {
  const { enabled, on } = o;
  let api!: Prop;
  const stop = $effect.root(() => {
    const date = $derived(localDateAt(minuteNow().getTime()));
    let out = $state(false);
    $effect(() => void (out = candlesOut(date)));
    /** Its spot (world.ts CAKE, on the island's layout: site.rev). */
    const at = $derived((void site.rev, CAKE));
    /** The birthday song on the island's stage (events.ts `happy-birthday`), and whether it's playing (anyone's tap). */
    const SONG = cutInSong('happy-birthday');
    const playing = $derived(live('isl')?.song === SONG);
    // the song starts (my tap or another's): the candles go out (the puff of smoke only as it starts); unheard, the music box
    onStageStart(SONG, 'birthday-cake', (fresh) => {
      if (out) return;
      out = true;
      blowOut(date);
      if (fresh) fx3d('smoke', at[0], at[1], FLAME_UP);
    }, on);

    $effect(() => {
      if (!on()) return;
      const [x, z] = at;
      return untrack(() => thing(w, { x, z, h: CAKE_H + 20, m3: { key: 'deco/birthday-cake', id: 'cake' } })());
    });
    // the candles' flames while they're lit (each a small warm light flickering on its candle)
    $effect(() => {
      if (!on() || out) return;
      const [x, z] = at;
      const offs = CANDLES.map((dx, i) => thing(w, { x: x + dx * CAKE_W, z, h: CAKE_H + 20, m3: { key: '', id: `cake-flame-${i}`, emit: { kind: 'candle', every: 0, hold: true, lift: FLAME_UP } } })());
      return () => offs.forEach((off) => off());
    });
    const box = () => propBox(w, 'cake', at[0], at[1], CAKE_W, CAKE_H);

    /** Whether a tap at client (px, py) is the cake's (no side effect: SceneTaps' claims, the 3D pick's oracle): on its
     *  model grown to MIN_HIT, 6 px round it, in view. */
    function claims(px: number, py: number, seen: Seen = SHOWN): boolean {
      if (!on() || !enabled() || !w.inView(at[0], at[1]) || !seen(at[0], at[1])) return false;
      return inside(grow(box(), MIN_HIT, 6), px, py);
    }
    /** A tap on the scene (client px): true when the cake took it. */
    function tap(px: number, py: number, seen: Seen = SHOWN): boolean {
      if (!claims(px, py, seen)) return false;
      // (playing: taken, nothing more: a tap never starts it over for everyone, the tape deck's way)
      if (!playing) request('isl', SONG);
      return true;
    }

    // The e2e's row (things3 probes 'cake') and box ('cake').
    $effect(() => {
      const r = things3(w);
      const row = (): CakeRow | null => (on() ? { out, id3: 'cake', box: box() } : null);
      const b = () => (on() ? { ...box(), foot: [...w.clientAt(at[0], at[1])] as [number, number] } : null);
      r.probes.set('cake', row);
      r.boxes.set('cake', b);
      return () => {
        if (r.probes.get('cake') === row) r.probes.delete('cake');
        if (r.boxes.get('cake') === b) r.boxes.delete('cake');
      };
    });
    api = { tap, claims };
  });
  return Object.assign(api, { stop });
}
