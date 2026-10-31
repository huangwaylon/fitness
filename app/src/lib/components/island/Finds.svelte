<script lang="ts">
  // Beach finds (docs/design.md "Beach finds"), after NH: seashells keep washing up on the front beach (one every 1–2
  // minutes, the newest three on the sand), fossil dig spots (NH's ✕ crack) on the lawn, 1–2 at a time, a new one a
  // little while after you dig; a message bottle at the water's edge every 8–14 minutes for six; star fragments on the
  // beach the morning after a wish on a shooting star; in mushroom season, mushrooms beside the trees (mushrooms.ts). A tap picks a shell, a fragment or the bottle up (it lifts off the
  // sand) or digs a fossil up (a shovel, a puff of earth, a hole), with NH's caption on the catch plate. The first find
  // of each shell, fossil and fragment goes to the shared ずかん (`find`); none of it is ベル. Mushrooms are cosmetic (no
  // find): picked up, or the rare one dug up (1 in 20 November dig spots) with NH's caption.
  // Everything derives from the Tokyo date and the time (beach.ts), so both phones broadly see the same island; what
  // this phone took is hidden here only (sceneDay.ts). SceneTaps mounts this inside the stage and asks it about each
  // tap after the critters (`tap`). Cheap: static images and one-shot animations; no timers but the dig's short wait,
  // the clock is the scene's minute tick.
  //   ?find=bottle | fragment | mushroom | rare-mushroom (dev or ?demo): a bottle, this morning's fragments, a mushroom
  //   now, or the next dig spot's rare mushroom (the e2e's hooks); ?seed= varies the island's seed.
  import { onMount } from 'svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import Plate from './Plate.svelte';
  import { t } from '#lib/i18n/index.ts';
  import { jst, minuteNow, now } from '#lib/time/clock.ts';
  import { addDays, localDateAt } from '#lib/time/dates.ts';
  import { recordFind } from '#lib/store/actions.ts';
  import { sceneSfx } from './sceneTaps.ts';
  import { loadNames } from './catchLine.ts';
  import { guardsU, clearAt, stageGeo } from './placement.ts';
  import { ISLAND_SEED, bottleAt, digSpots, findArt, fragmentDay, fragmentsOn, shellsAt, type Bottle, type DigSpot, type Fragment, type Shell } from './beach.ts';
  import { take, takenOn, wishDay, wishFor } from './sceneDay.ts';
  import { showerNight } from './meteor.ts';
  import { eggTime, eventAt, forcedEvent } from './events.ts';
  import { eggInDig } from './eggs.ts';
  import { MUSHROOM_SPOTS, mushroomsOn, rareMushroom, type Mushroom } from './mushrooms.ts';
  import { approach } from './avatar.ts';
  import { HOLD_MS, holdUp, putAway } from '../motion/director.svelte.ts';

  interface Props {
    scene?: HTMLElement;
    /** Live, not covered by a sheet, page visible. */
    enabled: () => boolean;
  }
  let { scene, enabled }: Props = $props();

  const q = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
  const hooks = import.meta.env.DEV || q.has('demo');
  const seed = (hooks && q.get('seed')) || ISLAND_SEED;
  const want = hooks ? q.get('find') : null;

  const U = (n: number) => `calc(${n.toFixed(1)} * var(--su))`;
  const rand = Math.random;

  /** Bumped when this phone takes something (the lists re-derive). */
  let taken = $state(0);
  /** A dig's replacement waits a little (NH: the next fossil turns up later), until this time. */
  let digHold = $state(0);
  let holdTimer: ReturnType<typeof setTimeout> | undefined;

  const clock = $derived(minuteNow());
  const date = $derived(localDateAt(clock.getTime()));
  const msOfDay = $derived.by(() => {
    const { hour, minute } = jst(clock);
    return (hour * 60 + minute) * 60_000 + clock.getSeconds() * 1000;
  });

  const shells = $derived.by<Shell[]>(() => {
    void taken;
    const gone = takenOn(date);
    return shellsAt(date, msOfDay, seed).filter((s) => !gone.has(s.uid));
  });
  const spots = $derived.by<DigSpot[]>(() => {
    void taken;
    void digHold;
    const list = digSpots(date, takenOn(date), seed);
    return digHold > Date.now() ? list.filter((s) => shown.has(s.uid)) : list;
  });
  /** Dig spots already on screen (a new one waits out digHold). */
  let shown = new Set<string>();
  $effect(() => {
    shown = new Set(spots.map((s) => s.uid));
  });
  const bottle = $derived.by<Bottle | null>(() => {
    void taken;
    const b = want === 'bottle' ? { uid: 'b-demo', note: 3, x: 250, y: 347, at: 0 } : bottleAt(date, msOfDay, seed);
    return b && !takenOn(date).has(b.uid) ? b : null;
  });
  const mushrooms = $derived.by<Mushroom[]>(() => {
    void taken;
    const gone = takenOn(date);
    const list = want === 'mushroom' ? [{ uid: 'm-demo', id: 'round-mushroom' as const, x: MUSHROOM_SPOTS[0][0], y: MUSHROOM_SPOTS[0][1], flip: false }] : mushroomsOn(date, seed);
    return list.filter((m) => !gone.has(m.uid));
  });
  /** Whether a dig spot holds the rare mushroom (`?find=rare-mushroom`: every one). */
  const rare = (s: DigSpot): boolean => want === 'rare-mushroom' || rareMushroom(date, s.uid, seed);
  /** Whether a dig spot holds Bunny Day's earth egg (its celebrations only; `?find=earth-egg`: every one). */
  const egg = (s: DigSpot): boolean =>
    want === 'earth-egg' || (eggTime(eventAt(date, jst(now()).hour, forcedEvent())) && eggInDig(date, s.uid, seed));
  const fragments = $derived.by<Fragment[]>(() => {
    void taken;
    if (want !== 'fragment' && wishDay() !== date) return [];
    const gone = takenOn(date);
    // a wish on a meteor shower's night (the night before this morning) brings more
    return fragmentsOn(date, seed, showerNight(addDays(date, -1), seed)).filter((f) => !gone.has(f.uid));
  });

  // Shells that wash up while you watch slide in from the foam; the ones already there when the island opens just lie.
  let first = true;
  const seen = new Set<string>();
  const fresh = (uid: string): boolean => {
    if (seen.has(uid)) return false;
    seen.add(uid);
    return !first;
  };
  onMount(() => {
    first = false;
    return () => clearTimeout(holdTimer);
  });

  // ---------- the moment of a find ----------
  interface Lift { n: number; x: number; y: number; art: string; tilt: number }
  /** `held`: the shovel is in my villager's hand (no floating one). */
  interface Dig { n: number; x: number; y: number; held?: boolean }
  interface Card { n: number; x: number; y: number; art: string; parts: string[] }
  let lift = $state<Lift | null>(null);
  let dig = $state<Dig | null>(null);
  let card = $state<Card | null>(null);
  let seq = 0;
  const timers = new Set<ReturnType<typeof setTimeout>>();
  function later(fn: () => void, ms: number) {
    const id = setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
  }
  $effect(() => () => {
    for (const id of timers) clearTimeout(id);
    timers.clear();
  });

  /** The plate, `delay` ms after the tap; a first find of its kind gets a second page saying it's in the ずかん. */
  function plate(x: number, y: number, art: string, text: () => string, delay = 0, added = false, hold = true) {
    const n = ++seq;
    const names = loadNames().catch(() => {});
    later(() => void names.then(() => {
      card = { n, x, y, art, parts: added ? [text(), t('zukan.added')] : [text()] };
      if (hold) holdUp('mine', art, HOLD_MS);
    }), delay);
  }
  function pickUp(uid: string, x: number, y: number, art: string, tilt: number) {
    take(date, uid);
    taken++;
    const n = ++seq;
    lift = { n, x, y, art, tilt };
    later(() => lift?.n === n && (lift = null), 500);
  }

  /** Things my villager is walking to (a second tap meanwhile does nothing). */
  const going = new Set<string>();
  /** My villager walks to the find (avatar.ts), picks it up and holds it up over its head while the plate reads. The
   *  find is decided (and the ずかん written) at the tap; what shows waits for the walk. */
  function walkTo(uid: string, x: number, y: number, fn: (walked: boolean) => void, tool?: { tool: 'shovel'; toolMs: number }) {
    if (going.has(uid)) return;
    going.add(uid);
    const { ms, walked } = approach(x, y, tool ?? { motion: 'squish' });
    const go = () => {
      going.delete(uid);
      fn(walked);
    };
    if (ms) later(go, ms);
    else go();
  }
  function pickShell(s: Shell) {
    const added = recordFind('shell', s.id);
    walkTo(s.uid, s.x, s.y, () => {
      pickUp(s.uid, s.x, s.y, findArt(s.id), s.tilt);
      sceneSfx('shell');
      plate(s.x, s.y, findArt(s.id), () => t('beach.picked', { name: t(`beach.name.${s.id}`) }), 180, added);
    });
  }
  function pickFragment(f: Fragment) {
    recordFind('fragment', f.id);
    walkTo(f.uid, f.x, f.y, () => {
      pickUp(f.uid, f.x, f.y, findArt(f.id), 0);
      sceneSfx('fragment');
      plate(f.x, f.y, findArt(f.id), () => t('beach.picked', { name: t(`beach.name.${f.id}`) }), 180);
    });
  }
  function pickBottle(b: Bottle) {
    walkTo(b.uid, b.x, b.y, () => {
      pickUp(b.uid, b.x, b.y, findArt('message-bottle'), -64);
      sceneSfx('bottle');
      plate(b.x, b.y, findArt('message-bottle'), () => t('beach.bottle', { note: t(`beach.note.${b.note}`) }), 180);
    });
  }
  function pickMushroom(m: Mushroom) {
    walkTo(m.uid, m.x, m.y, () => {
      pickUp(m.uid, m.x, m.y - 6, findArt(m.id), 0);
      sceneSfx('mushroom');
      plate(m.x, m.y - 6, findArt(m.id), () => t('beach.picked', { name: t(`beach.name.${m.id}`) }), 180);
    });
  }
  function digUp(s: DigSpot) {
    const special = rare(s) ? 'rare-mushroom' : egg(s) ? 'earth-egg' : null;
    const added = special ? false : recordFind('fossil', s.fossil);
    walkTo(s.uid, s.x, s.y, (walked) => {
      take(date, s.uid);
      digHold = Date.now() + 20_000 + rand() * 20_000;
      clearTimeout(holdTimer);
      holdTimer = setTimeout(() => (digHold = 0), digHold - Date.now());
      taken++;
      sceneSfx('dig');
      const n = ++seq;
      dig = { n, x: s.x, y: s.y, held: walked };
      later(() => dig?.n === n && (dig = null), 3200);
      if (special) plate(s.x, s.y - 4, findArt(special), () => t('beach.dug', { name: t(`beach.name.${special}`) }), 650);
      else plate(s.x, s.y - 4, findArt(s.fossil), () => t('beach.fossil', { name: t(`beach.name.${s.fossil}`) }), 650, added);
      later(() => sceneSfx('catch'), 650);
    }, { tool: 'shovel', toolMs: 640 });
  }

  /** A tap on the scene (client px), after the critters: true when a find took it. Reach: a 44px target. */
  export function tap(px: number, py: number): boolean {
    const g = stageGeo(scene);
    if (!g || !enabled()) return false;
    const x = (px - g.r.left) * g.k, y = (py - g.r.top) * g.k;
    const reach = 22 * g.k;
    type Hit = { d: number; go: () => void };
    const hits: Hit[] = [
      ...shells.map((s) => ({ d: Math.hypot(s.x - x, s.y - y), go: () => pickShell(s) })),
      ...fragments.map((f) => ({ d: Math.hypot(f.x - x, f.y - y), go: () => pickFragment(f) })),
      ...(bottle ? [{ d: Math.hypot(bottle.x - x, bottle.y - y), go: () => pickBottle(bottle!) }] : []),
      ...visibleSpots.map((s) => ({ d: Math.hypot(s.x - x, s.y - y), go: () => digUp(s) })),
      ...visibleMushrooms.map((m) => ({ d: Math.hypot(m.x - x, m.y - 6 - y), go: () => pickMushroom(m) }))
    ];
    const best = hits.filter((h) => h.d <= reach).sort((a, b) => a.d - b.d)[0];
    if (!best) return false;
    best.go();
    return true;
  }

  // A dig spot shows only where it's clear of every control on this screen (measured: the villagers and the fruit
  // rows are a little bigger on small phones).
  let visibleSpots = $state<DigSpot[]>([]);
  $effect(() => {
    const list = spots;
    const g = stageGeo(scene);
    if (!g) return void (visibleSpots = []);
    // flat on the lawn: clear of the controls themselves (their 6px tap padding may run over the crack)
    const keep = guardsU(g, -5 * g.k);
    visibleSpots = list.filter((s) => clearAt(keep, s.x, s.y, 10, 6));
  });
  let visibleMushrooms = $state<Mushroom[]>([]);
  $effect(() => {
    const list = mushrooms;
    const g = stageGeo(scene);
    if (!g) return void (visibleMushrooms = []);
    const keep = guardsU(g, -5 * g.k);
    visibleMushrooms = list.filter((m) => clearAt(keep, m.x, m.y - 7, 7, 7));
  });

  /** A wish on a shooting star (SceneTaps, a tap in the sky while one crosses; x, y in u): star fragments on the beach
   *  the next morning (before dawn: this morning), and NH's moment on the plate. */
  export function wish(x: number, y: number): void {
    const { hour } = jst(now());
    wishFor(fragmentDay(date, hour, (d) => addDays(d, 1)));
    taken++; // before dawn the fragments are this morning's
    plate(x, y, findArt('star-fragment'), () => t('beach.wish'), 0, false, false);
  }
</script>

<div class="finds" aria-hidden="true">
  {#each visibleSpots as s (s.uid)}
    <!-- NH's dig spot: a star-shaped crack in the ground, foreshortened -->
    <span class="item spot" data-find="fossil" style:translate="{U(s.x)} {U(s.y)}">
      <svg viewBox="-10 -10 20 20"><path d="M0 -8.5 L1.3 -1.3 L8.5 0 L1.3 1.3 L0 8.5 L-1.3 1.3 L-8.5 0 L-1.3 -1.3 Z" /></svg>
    </span>
  {/each}
  {#each visibleMushrooms as m (m.uid)}
    <span class="item mush" class:flip={m.flip} data-find="mushroom" data-id={m.id} style:translate="{U(m.x)} {U(m.y)}">
      <OfficialArt key={findArt(m.id)} size="calc(13 * var(--su))" />
    </span>
  {/each}
  {#each shells as s (s.uid)}
    <span class="item shell" class:fresh={fresh(s.uid)} data-find="shell" data-id={s.id} style:translate="{U(s.x)} {U(s.y)}" style:--tilt="{s.tilt}deg">
      <OfficialArt key={findArt(s.id)} size="calc(14 * var(--su))" />
    </span>
  {/each}
  {#each fragments as f (f.uid)}
    <span class="item frag" data-find="fragment" data-id={f.id} style:translate="{U(f.x)} {U(f.y)}">
      <OfficialArt key={findArt(f.id)} size="calc(12 * var(--su))" />
    </span>
  {/each}
  {#if bottle}
    <span class="item bottle" data-find="bottle" style:translate="{U(bottle.x)} {U(bottle.y)}">
      <OfficialArt key={findArt('message-bottle')} size="calc(15 * var(--su))" />
    </span>
  {/if}
  {#if dig}
    {#key dig.n}
      <span class="item digfx" style:translate="{U(dig.x)} {U(dig.y)}">
        <i class="hole"></i>
        {#each [-1, 0, 1] as dx, i (i)}<i class="clod" style:--dx={dx} style:--i={i}></i>{/each}
        {#if !dig.held}<span class="shovel"><OfficialArt key={findArt("shovel")} size="calc(24 * var(--su))" eager /></span>{/if}
      </span>
    {/key}
  {/if}
  {#if lift}
    {#key lift.n}
      <span class="item lift" style:translate="{U(lift.x)} {U(lift.y)}" style:--tilt="{lift.tilt}deg"><OfficialArt key={lift.art} size="calc(14 * var(--su))" eager /></span>
    {/key}
  {/if}
</div>

<div class="held">
  {#if card}
    {@const c = card}
    {#key c.n}<Plate {scene} x={c.x} y={c.y} art={c.art} parts={c.parts} ondone={() => card?.n === c.n && ((card = null), putAway('mine'))} />{/key}
  {/if}
</div>

<style>
  /* on the ground: over the grass and the sand (the ground svg), under the hedge, the trees and everyone, and under the
     time-of-day tint like the land itself */
  .finds { position: absolute; inset: 0; z-index: 5; pointer-events: none; --su: calc(100cqw / 390); }
  .held { position: absolute; inset: 0; z-index: var(--z-taps); pointer-events: none; --su: calc(100cqw / 390); }
  .item { position: absolute; left: 0; top: 0; width: 0; height: 0; }
  .item > * { position: absolute; left: 0; top: 0; line-height: 0; }
  .item :global(.official) { max-width: none; }
  /* a shell lies on the sand at its own angle, a soft contact shadow under it */
  .shell > :global(*), .frag > :global(*), .bottle > :global(*) { translate: -50% -60%; filter: drop-shadow(0 1px 0 rgba(120, 90, 50, .35)); }
  .shell > :global(*) { rotate: var(--tilt); }
  .shell.fresh { animation: wash 1.1s cubic-bezier(.3, .7, .4, 1) both; }
  @keyframes wash { from { transform: translateY(calc(12 * var(--su))); opacity: 0; } 40% { opacity: 1; } }
  .bottle > :global(*) { rotate: -64deg; }
  /* a mushroom stands on the lawn beside its tree, a soft shadow at its foot */
  .mush > :global(*) { translate: -50% -92%; filter: drop-shadow(0 1.5px 0 rgba(60, 70, 30, .35)); }
  .mush.flip > :global(*) { scale: -1 1; }
  .frag > :global(*) { filter: drop-shadow(0 0 3px rgba(255, 246, 190, .9)); }
  /* the dig spot */
  .spot svg { width: calc(19 * var(--su)); translate: -50% -50%; scale: 1 .55; fill: rgba(92, 60, 30, .78); overflow: visible; }
  /* digging: the shovel strikes twice, earth flies, a hole opens and closes again */
  .shovel { translate: -20% -95%; transform-origin: 30% 100%; animation: shovel .62s cubic-bezier(.3, .6, .4, 1) both; }
  @keyframes shovel {
    0% { transform: rotate(-40deg) translateY(-6px); opacity: 0; } 15% { opacity: 1; }
    35% { transform: rotate(8deg); } 50% { transform: rotate(-28deg) translateY(-4px); } 70% { transform: rotate(10deg); }
    90% { opacity: 1; } 100% { transform: rotate(-10deg) translateY(-8px); opacity: 0; }
  }
  .hole {
    display: block; width: calc(15 * var(--su)); height: calc(7 * var(--su)); translate: -50% -50%; border-radius: 50%;
    background: radial-gradient(closest-side, #6B4A2A, #8A6238 70%, rgba(138, 98, 56, 0)); animation: hole 3.2s ease-out .3s both;
  }
  @keyframes hole { from { transform: scale(.3); opacity: 0; } 12% { transform: scale(1); opacity: 1; } 80% { opacity: 1; } to { opacity: 0; } }
  .clod {
    display: block; width: calc(4 * var(--su)); height: calc(3.4 * var(--su)); border-radius: 50%; background: #8A6238;
    animation: clod .6s cubic-bezier(.3, .8, .6, 1) calc(.25s + var(--i) * 40ms) both;
  }
  @keyframes clod {
    0% { transform: translate(0, 0); opacity: 0; } 15% { opacity: 1; }
    50% { transform: translate(calc(var(--dx) * 7 * var(--su)), calc(-10 * var(--su))); }
    100% { transform: translate(calc(var(--dx) * 12 * var(--su)), calc(2 * var(--su))); opacity: 0; }
  }
  /* picked up: it lifts off the sand and fades */
  .lift > :global(*) { translate: -50% -60%; rotate: var(--tilt); animation: lift .5s ease-out both; }
  @keyframes lift { to { transform: translateY(calc(-16 * var(--su))) scale(1.15); opacity: 0; } }
</style>
