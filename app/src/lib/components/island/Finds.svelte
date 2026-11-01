<script lang="ts">
  // Beach finds (docs/design.md "Beach finds"), after NH: seashells keep washing up on the front beach (one every 1–2
  // minutes, the newest three on the sand), fossil dig spots (NH's ✕ crack) on the lawn, 1–2 at a time, a new one a
  // little while after you dig; a message bottle at the water's edge every 8–14 minutes for six; a star fragment on the
  // beach the morning after each wish on a shooting star (stars.ts: one per wish, from 5:00, at most 8); in mushroom
  // season, mushrooms beside the trees (mushrooms.ts). A tap picks a shell, a fragment or the bottle up (it lifts off the
  // sand) or digs a fossil up (a shovel, a puff of earth, a hole), with NH's caption on the catch plate. The first find
  // of each shell, fossil and fragment goes to the shared ずかん (`find`); none of it is ベル. Mushrooms are cosmetic (no
  // find): picked up, or the rare one dug up (1 in 20 November dig spots) with NH's caption.
  // Everything derives from the Tokyo date and the time (beach.ts), so both phones broadly see the same island; what
  // this phone took is hidden here only (sceneDay.ts). SceneTaps mounts this inside the stage and asks it about each
  // tap after the critters (`tap`). Cheap: static images and one-shot animations; no timers but the dig's short wait,
  // the clock is the scene's minute tick.
  //   ?find=bottle | fragment | mushroom | rare-mushroom (dev or ?demo): a bottle, this morning's fragments, a mushroom
  //   now, or the next dig spot's rare mushroom (the e2e's hooks); ?seed= varies the island's seed.
  import CatchPlate from './CatchPlate.svelte';
  import { cardFor, type CatchCard } from './catchCard.ts';
  import { timers } from './timers.ts';
  import { hook, islandSeed } from './devHooks.ts';
  import { su } from './scene.ts';
  import { onMount, tick } from 'svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { t } from '#lib/i18n/index.ts';
  import { dayKey, jst, minuteNow, now } from '#lib/time/clock.ts';
  import { addDays } from '#lib/time/dates.ts';
  import { recordFind } from '#lib/store/actions.ts';
  import { sceneSfx } from './sceneTaps.ts';
  import { loadNames } from './catchLine.ts';
  import { guardsU, clearAt, place, stageGeo } from './placement.ts';
  import { bottleAt, bottleNow, digSpots, findArt, fragmentsOn, shellsAt, type Bottle, type DigSpot, type Fragment, type Shell } from './beach.ts';
  import { take, takenOn, wish as addWish, wishes } from './sceneDay.ts';
  import { fragmentDay, fragmentsDue } from './stars.ts';
  import { showerNight } from './meteor.ts';
  import { eggTime, eventNow } from './events.ts';
  import { eggInDig } from './eggs.ts';
  import { MUSHROOM_SPOTS, mushroomsOn, rareMushroom, type Mushroom } from './mushrooms.ts';
  import { approach } from './avatar.ts';
  import { pickPresent, presentArt, presentLine } from './presents.ts';

  interface Props {
    scene?: HTMLElement;
    /** Live, not covered by a sheet, page visible. */
    enabled: () => boolean;
  }
  let { scene, enabled }: Props = $props();

  const seed = islandSeed();
  const want = hook('find');

  /** A present's confetti: [angle from straight up, colour, distance (u)], wrapping-paper colours. */
  const CONFETTI: [number, string, number][] = [[-84, '#F2484A', 28], [-62, '#FFD23F', 34], [-40, '#4FC3F7', 31], [-18, '#8BD45B', 37],
    [4, '#F78FB3', 33], [24, '#FFD23F', 36], [46, '#F2484A', 30], [68, '#4FC3F7', 29], [86, '#8BD45B', 26], [-50, '#FFFFFF', 24],
    [34, '#FFFFFF', 25], [-6, '#F2484A', 22], [-74, '#F78FB3', 21], [76, '#FFD23F', 22]];
  /** The dig spot's crack: five jagged arms of unequal length (8, 6, 7.5, 5, 6.5u) and four side cracks. */
  const CRACK = 'M0 0 L1.2 -3.4 L.6 -5.2 L1.8 -8 M0 0 L2.8 .6 L4.2 -.4 L6 .4 M0 0 L-.6 2.8 L.6 4.8 L-.2 7.4 M0 0 L-2.4 -.8 L-3.4 .2 L-5 -.4 '
    + 'M0 0 L-2 -2.4 L-2.6 -4.4 L-4.4 -5.2 M.9 -4.4 L2.6 -5 M3.6 .2 L4.2 1.6 M.1 4.2 L-1.4 4.9 M-2.3 -3.3 L-3.8 -2.8';
  const rand = Math.random;

  /** Bumped when this phone takes something (the lists re-derive). */
  let taken = $state(0);
  /** A dig's replacement waits a little (NH: the next fossil turns up later), until this time. */
  let digHold = $state(0);
  let holdTimer: ReturnType<typeof setTimeout> | undefined;

  const clock = $derived(minuteNow());
  const date = $derived(dayKey(clock));
  const msOfDay = $derived.by(() => {
    const { hour, minute } = jst(clock);
    return (hour * 60 + minute) * 60_000 + clock.getSeconds() * 1000;
  });

  /** This morning's fragments, picked or not (the shells and the bottle keep their distance from where they lay). */
  const allFragments = $derived.by<Fragment[]>(() => {
    void taken;
    const n = want === 'fragment' ? 3 : fragmentsDue(wishes(), date, jst(clock).hour);
    // after a meteor shower's night (the night before this morning) the season's zodiac fragment is likelier
    return fragmentsOn(date, n, seed, showerNight(addDays(date, -1), seed));
  });
  const shells = $derived.by<Shell[]>(() => {
    void taken;
    const gone = takenOn(date);
    return shellsAt(date, msOfDay, seed, allFragments).filter((s) => !gone.has(s.uid));
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
    const b = want === 'bottle' ? bottleNow(date, [...allFragments, ...shellsAt(date, msOfDay, seed, allFragments)], seed) : bottleAt(date, msOfDay, seed, allFragments);
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
    want === 'earth-egg' || (eggTime(eventNow()) && eggInDig(date, s.uid, seed));
  const fragments = $derived.by<Fragment[]>(() => {
    void taken;
    const gone = takenOn(date);
    return allFragments.filter((f) => !gone.has(f.uid));
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
  let lift = $state<Lift | null>(null);
  let dig = $state<Dig | null>(null);
  let card = $state<CatchCard | null>(null);
  let seq = 0;
  const { later, clear } = timers();
  $effect(() => clear);

  /** The plate, `delay` ms after the tap; a first find of its kind gets a second page saying it's in the ずかん. */
  function plate(x: number, y: number, art: string, text: () => string, delay = 0, added = false, hold = true) {
    const n = ++seq;
    const names = loadNames().catch(() => {});
    later(() => void names.then(() => {
      card = cardFor(n, x, y, art, text(), added, hold);
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
  /** Balloon presents lying where they fell (SceneTaps lands them; u), until picked up. Not kept across a reload. */
  let presents = $state<{ uid: string; x: number; y: number; art: string; size: number }[]>([]);
  /** A balloon's present has landed on the lawn (SceneTaps): it lies there until a tap picks it up (NH). */
  export function present(x: number, y: number, art: string, size: number) {
    presents = [...presents.slice(-2), { uid: `p${++seq}`, x, y, art, size }];
  }
  /** A present opening where it lay: the box pops (a squash, the lid off), confetti in the wrapping's colours bursts
   *  out with sparkles. */
  let opening = $state<{ n: number; x: number; y: number; art: string; size: number } | null>(null);
  /** NH's balloon present, picked up: my villager walks over, the wrapping pops open (confetti, a little fanfare) and
   *  what was inside is held up over its head while the plate reads 「◯◯を てにいれた！」 (presents.ts: furniture,
   *  clothing or a seasonal DIY recipe; never ベル, not kept). On Bunny Day the sky egg is just picked up. */
  function openPresent(p: (typeof presents)[number]) {
    walkTo(p.uid, p.x, p.y, () => {
      presents = presents.filter((q) => q.uid !== p.uid);
      if (p.art.endsWith('sky-egg')) {
        const n = ++seq;
        lift = { n, x: p.x, y: p.y, art: p.art, tilt: 0 };
        later(() => lift?.n === n && (lift = null), 500);
        sceneSfx('present');
        return plate(p.x, p.y, p.art, () => t('beach.picked', { name: t('beach.name.sky-egg') }), 180);
      }
      const inside = pickPresent(date, rand), art = presentArt(inside), line = presentLine(inside);
      const n = ++seq;
      opening = { n, x: p.x, y: p.y, art: p.art, size: p.size };
      later(() => opening?.n === n && (opening = null), 1100);
      sceneSfx('present');
      later(() => sceneSfx('catch'), 260);
      plate(p.x, p.y, art, () => t(line.key, { name: t(line.name) }), 420);
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
      later(() => dig?.n === n && (dig = null), 6400);
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
      ...visibleMushrooms.map((m) => ({ d: Math.hypot(m.x - x, m.y - 6 - y), go: () => pickMushroom(m) })),
      ...presents.map((p) => ({ d: Math.hypot(p.x - x, p.y - y), go: () => openPresent(p) }))
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

  /** A wish on a shooting star (SceneTaps, a tap in the sky while one crosses; client px): one more star fragment on the
   *  beach the next morning (before dawn: this morning, from 5:00), and a brief caption by the tap. */
  export function wish(px: number, py: number): void {
    const { hour } = jst(now());
    addWish(fragmentDay(date, hour, (d) => addDays(d, 1)), date);
    taken++;
    const n = ++seq;
    note = { n, x: 0, y: 0, placed: false };
    void tick().then(() => {
      const s = scene?.querySelector('.stage')?.getBoundingClientRect(), b = noteEl?.getBoundingClientRect();
      if (!scene || !s || !b || note?.n !== n) return;
      const at = place(scene, b.width, b.height, px, py);
      if (!at) return void (note = null);
      note = { n, x: at.x - s.left, y: at.y - s.top, placed: true };
      later(() => note?.n === n && (note = null), 1900);
    });
  }
  /** The wish's caption (stage px, placed clear of every control). */
  let note = $state<{ n: number; x: number; y: number; placed: boolean } | null>(null);
  let noteEl = $state<HTMLElement>();
</script>

<div class="finds" aria-hidden="true">
  {#each visibleSpots as s (s.uid)}
    <!-- NH's dig spot: a dark, uneven star-shaped crack in the soil (jagged arms of unequal length, little side cracks),
         a lighter lip of earth under each, foreshortened -->
    <span class="item spot" data-find="fossil" style:translate="{su(s.x)} {su(s.y)}">
      <svg viewBox="-10 -10 20 20">
        <path class="lip" d={CRACK} transform="translate(0 .8)" /><path class="crack" d={CRACK} />
      </svg>
    </span>
  {/each}
  {#each visibleMushrooms as m (m.uid)}
    <span class="item mush" class:flip={m.flip} data-find="mushroom" data-id={m.id} style:translate="{su(m.x)} {su(m.y)}">
      <OfficialArt key={findArt(m.id)} size="calc(13 * var(--su))" />
    </span>
  {/each}
  {#each presents as p (p.uid)}
    <span class="item gift" data-find="present" style:translate="{su(p.x)} {su(p.y)}"><OfficialArt key={p.art} size={su(p.size)} eager /></span>
  {/each}
  {#each shells as s (s.uid)}
    <span class="item shell" class:fresh={fresh(s.uid)} data-find="shell" data-id={s.id} style:translate="{su(s.x)} {su(s.y)}" style:--tilt="{s.tilt}deg">
      <OfficialArt key={findArt(s.id)} size="calc(14 * var(--su))" />
    </span>
  {/each}
  {#each fragments as f, k (f.uid)}
    <!-- NH's beach glimmer: a star fragment twinkles now and then (every 3–5 s, out of step) -->
    <span class="item frag" data-find="fragment" data-id={f.id} style:translate="{su(f.x)} {su(f.y)}" style:--tw="{3 + ((k * 7) % 5) * 0.5}s" style:--twd="{-k * 1.3}s">
      <OfficialArt key={findArt(f.id)} size="calc(12 * var(--su))" />
      <svg class="twinkle" viewBox="0 0 24 24"><path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z" /></svg>
    </span>
  {/each}
  {#if bottle}
    <!-- at the water's edge, half in the foam: it rocks with the waves, a small ring of foam now and then -->
    <span class="item bottle" data-find="bottle" style:translate="{su(bottle.x)} {su(bottle.y)}">
      <i class="foam"></i>
      <span class="rock"><OfficialArt key={findArt('message-bottle')} size="calc(15 * var(--su))" /></span>
    </span>
  {/if}
  {#if dig}
    {#key dig.n}
      <span class="item digfx" style:translate="{su(dig.x)} {su(dig.y)}">
        <i class="hole"></i>
        <!-- two strikes of the shovel, a burst of earth on each -->
        {#each [0, 1] as k (k)}{#each [-1, 0, 1] as dx, i (i)}<i class="clod" style:--dx={dx + k * 0.3} style:--i={i} style:--k={k}></i>{/each}{/each}
        {#if !dig.held}<span class="shovel"><OfficialArt key={findArt("shovel")} size="calc(30 * var(--su))" eager /></span>{/if}
      </span>
    {/key}
  {/if}
  {#if opening}
    {#key opening.n}
      <!-- the present pops open: the box squashes and its lid flies off, confetti and sparkles burst out -->
      <span class="item opening" data-fx="present-open" style:translate="{su(opening.x)} {su(opening.y)}">
        <span class="box"><OfficialArt key={opening.art} size={su(opening.size)} eager /></span>
        {#each CONFETTI as [a, c, d], i (i)}<i class="bit" style:--a="{a}deg" style:--c={c} style:--d={su(d)} style:--i={i}></i>{/each}
        {#each [[-12, -14, 0], [11, -18, 1], [2, -24, 2]] as [dx, dy, k] (k)}
          <svg class="pop-spark" viewBox="0 0 24 24" style:--dx={su(dx)} style:--dy={su(dy)} style:--k={k}><path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z" /></svg>
        {/each}
      </span>
    {/key}
  {/if}
  {#if lift}
    {#key lift.n}
      <span class="item lift" style:translate="{su(lift.x)} {su(lift.y)}" style:--tilt="{lift.tilt}deg"><OfficialArt key={lift.art} size="calc(14 * var(--su))" eager /></span>
    {/key}
  {/if}
</div>

<div class="held">
  {#if note}
    {#key note.n}<span class="wish" class:placed={note.placed} data-fx="wish-note" bind:this={noteEl} style:left="{note.x}px" style:top="{note.y}px">{t('beach.wish')}</span>{/key}
  {/if}
  <CatchPlate {scene} bind:card />
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
  .shell > :global(*), .frag > :global(*) { translate: -50% -60%; filter: drop-shadow(0 1px 0 rgba(120, 90, 50, .35)); }
  .shell > :global(*) { rotate: var(--tilt); }
  .shell.fresh { animation: wash 1.1s cubic-bezier(.3, .7, .4, 1) both; }
  @keyframes wash { from { transform: translateY(calc(12 * var(--su))); opacity: 0; } 40% { opacity: 1; } }
  .bottle .rock { translate: -50% -60%; line-height: 0; transform-origin: 50% 70%; animation: bottle-rock 2.4s ease-in-out infinite alternate; }
  .bottle .rock > :global(*) { rotate: -64deg; filter: drop-shadow(0 1px 0 rgba(120, 90, 50, .35)); }
  @keyframes bottle-rock { from { transform: rotate(-4deg); } to { transform: rotate(4deg); } }
  .foam {
    display: block; width: calc(20 * var(--su)); height: calc(6 * var(--su)); translate: -50% -30%; border-radius: 50%;
    border: 1.2px solid rgba(255, 255, 255, .9); opacity: 0; animation: foam 4s ease-out infinite;
  }
  @keyframes foam { 0% { transform: scale(.4); opacity: 0; } 8% { opacity: .9; } 30% { transform: scale(1.2); opacity: 0; } 100% { opacity: 0; } }
  .twinkle {
    width: calc(9 * var(--su)); translate: 10% -120%; fill: #FFFBE6; filter: drop-shadow(0 0 2px #FFE070); opacity: 0;
    animation: twinkle var(--tw, 4s) ease-out var(--twd, 0s) infinite;
  }
  @keyframes twinkle { 0%, 80% { transform: scale(0) rotate(0); opacity: 0; } 88% { transform: scale(1) rotate(40deg); opacity: 1; } 100% { transform: scale(0) rotate(90deg); opacity: 0; } }
  /* a present opening: the box squashes and pops up and away (its lid off), confetti bursts out, three sparkles */
  .opening .box { translate: -50% -50%; line-height: 0; transform-origin: 50% 100%; animation: box-pop .5s cubic-bezier(.3, 1.4, .5, 1) both; }
  @keyframes box-pop {
    0% { transform: none; } 25% { transform: scale(1.18, .8); } 55% { transform: translateY(-30%) scale(.9, 1.15) rotate(-6deg); opacity: 1; }
    100% { transform: translateY(-70%) scale(1.25) rotate(8deg); opacity: 0; }
  }
  .bit {
    display: block; width: calc(4 * var(--su)); height: calc(6 * var(--su)); margin: calc(-3 * var(--su)) 0 0 calc(-2 * var(--su));
    border-radius: 1px; background: var(--c); box-shadow: 0 0 0 .5px rgba(0, 0, 0, .08); rotate: var(--a); transform-origin: 50% 100%; opacity: 0;
    animation: confetti .9s cubic-bezier(.2, .7, .4, 1) calc(.12s + var(--i) * 12ms) both;
  }
  @keyframes confetti {
    0% { transform: translateY(0) scale(.4) rotate(0); opacity: 1; } 55% { opacity: 1; }
    100% { transform: translateY(calc(var(--d) * -1)) scale(1) rotate(200deg); opacity: 0; }
  }
  .pop-spark {
    width: calc(10 * var(--su)); translate: calc(-50% + var(--dx)) calc(-50% + var(--dy)); fill: #FFF8D8;
    filter: drop-shadow(0 0 2px #FFE070); opacity: 0; animation: pop-spark .6s ease-out calc(.2s + var(--k) * .12s) both;
  }
  @keyframes pop-spark { 0% { transform: scale(0) rotate(0); opacity: 0; } 40% { transform: scale(1.1) rotate(45deg); opacity: 1; } 100% { transform: scale(0) rotate(90deg); opacity: 0; } }
  /* a balloon's present where it landed, a soft shadow at its foot */
  .gift > :global(*) { translate: -50% -50%; filter: drop-shadow(0 1.5px 0 rgba(60, 70, 30, .35)); }
  /* a mushroom stands on the lawn beside its tree, a soft shadow at its foot */
  .mush > :global(*) { translate: -50% -92%; filter: drop-shadow(0 1.5px 0 rgba(60, 70, 30, .35)); }
  .mush.flip > :global(*) { scale: -1 1; }
  .frag > :global(*) { filter: drop-shadow(0 0 3px rgba(255, 246, 190, .9)); }
  /* the dig spot */
  .spot svg { width: calc(19 * var(--su)); translate: -50% -50%; scale: 1 .7; overflow: visible; fill: none; stroke-linecap: round; stroke-linejoin: round; }
  .spot .crack { stroke: #4E321A; stroke-opacity: .85; stroke-width: 1.6; }
  .spot .lip { stroke: #C9A46A; stroke-width: .8; }
  /* digging: the shovel strikes twice (.28 s each), a burst of earth on each, and leaves an open hole for 6 s */
  .shovel { translate: -20% -95%; transform-origin: 30% 100%; animation: shovel .68s cubic-bezier(.3, .6, .4, 1) both; }
  @keyframes shovel {
    0% { transform: rotate(-40deg) translateY(-6px); opacity: 0; } 10% { opacity: 1; }
    37% { transform: rotate(8deg); } 52% { transform: rotate(-32deg) translateY(-4px); } 78% { transform: rotate(10deg); }
    90% { opacity: 1; } 100% { transform: rotate(-10deg) translateY(-8px); opacity: 0; }
  }
  .hole {
    display: block; width: calc(18 * var(--su)); height: calc(8 * var(--su)); translate: -50% -50%; border-radius: 50%;
    background: radial-gradient(closest-side, #4E321A, #6B4A2A 55%, #8A6238 78%, rgba(138, 98, 56, 0)); animation: hole 6s ease-out .25s both;
  }
  @keyframes hole { from { transform: scale(.3); opacity: 0; } 5% { transform: scale(.7); opacity: 1; } 10% { transform: scale(1); } 85% { opacity: 1; } to { opacity: 0; } }
  .clod {
    display: block; width: calc(4 * var(--su)); height: calc(3.4 * var(--su)); border-radius: 50%; background: #8A6238;
    animation: clod .6s cubic-bezier(.3, .8, .6, 1) calc(.24s + var(--k) * .28s + var(--i) * 40ms) both;
  }
  @keyframes clod {
    0% { transform: translate(0, 0); opacity: 0; } 15% { opacity: 1; }
    50% { transform: translate(calc(var(--dx) * 7 * var(--su)), calc(-10 * var(--su))); }
    100% { transform: translate(calc(var(--dx) * 12 * var(--su)), calc(2 * var(--su))); opacity: 0; }
  }
  /* a wish: a small cream caption by the tap that floats up a little and fades (NH has no words for it: the moment) */
  .wish {
    position: absolute; translate: -50% -50%; width: max-content; padding: 5px 12px; border-radius: 999px;
    background: var(--c-cream, #FFF9E3); color: var(--c-ink, #4A3A2C); font: 700 13px/1.3 var(--font-ui);
    box-shadow: 0 2px 0 rgba(150, 110, 70, .28), 0 0 12px rgba(255, 246, 190, .55); pointer-events: none;
    animation: wish-note 1.9s ease-out both;
  }
  .wish:not(.placed) { visibility: hidden; animation: none; }
  @keyframes wish-note { 0% { transform: translateY(6px) scale(.85); opacity: 0; } 15% { transform: none; opacity: 1; } 75% { opacity: 1; } 100% { transform: translateY(-10px); opacity: 0; } }
  /* picked up: it lifts off the sand and fades */
  .lift > :global(*) { translate: -50% -60%; rotate: var(--tilt); animation: lift .5s ease-out both; }
  @keyframes lift { to { transform: translateY(calc(-16 * var(--su))) scale(1.15); opacity: 0; } }
</style>
