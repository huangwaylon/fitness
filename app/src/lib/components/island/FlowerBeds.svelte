<script lang="ts">
  // Flower beds (docs/design.md "Layout and scale", "Trees"): two tidy 2 × 2 beds mirrored about the jar, one flower
  // per tile on the NH grid (columns ±2/±3, the beds' back row and the front row), the back row one species and the
  // front row another. FLOWER_U tall (≈ 0.45 × a villager). Contact shadows are drawn in Ground.svelte. Winter: roses
  // and pansies, each with a little snow cap.
  // Each bed is the goal flowers of the person whose villager stands beside it (mine on the left, the partner's on the
  // right), one per goal in reading order (BED_FRUIT): a closed bud on its leaves and stem until that goal is met today, then it
  // blooms (the bud squashes, the flower pops open with a bounce, petal bits and a glint, a soft pop) once per phone
  // (fruit-day's `bloomed`), so a reload finds it open; buds again at the next Tokyo day.
  // A tap wiggles a flower (SceneTaps.svelte finds it by data-flower="row-col").
  import { onDestroy, untrack } from 'svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import type { Season } from '#lib/ui-state/theme.svelte.ts';
  import type { PersonWeekView, RingFruit } from '#lib/types.ts';
  import { BEDS, BED_FRUIT, BED_ROWS, BED_X, FLOWER_SCALE, FLOWER_U, u } from './scene.ts';
  import { flowerArt } from '#lib/art.ts';
  import { PETAL } from './sceneTaps.ts';
  import { flowerOf, fruitDay, fruitId, markBloomed } from './fruitDay.ts';
  import { dayKey, minuteNow } from '#lib/time/clock.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { cue } from '#lib/sound/cues.ts';

  interface Props {
    season: Season;
    /** The people beside the left bed and the right bed (me, then the partner). */
    people: [PersonWeekView, PersonWeekView];
    /** A hybrid colour in one cell today (`row-col`; the day after a watering, IslandScene). */
    hybrid?: { cell: string; flower: string } | null;
  }
  let { season, people, hybrid = null }: Props = $props();
  const bed = $derived(BEDS[season]);
  const xs = [...BED_X.left, ...BED_X.right];
  /** The bloom's petal bits fly out at these angles (deg from straight up). */
  const BITS = [-70, -30, 5, 40, 78];

  const timers = new Set<ReturnType<typeof setTimeout>>();
  onDestroy(() => {
    for (const id of timers) clearTimeout(id);
  });
  const later = (ms: number, f: () => void) => {
    const id = setTimeout(() => {
      timers.delete(id);
      f();
    }, ms);
    timers.add(id);
  };

  /** Today (the model's Tokyo day; the gallery has no view) and this phone's record of the flowers it has shown open. */
  const date = $derived(week.view?.today ?? dayKey(minuteNow()));
  // svelte-ignore state_referenced_locally
  let rec = $state(fruitDay(date));
  $effect(() => {
    const d = date;
    untrack(() => {
      if (rec.date !== d) rec = fruitDay(d);
    });
  });
  /** Flowers opening right now (their bloom plays once). */
  let opening = $state<string[]>([]);

  const cells = $derived(
    BED_ROWS.flatMap((y, r) =>
      xs.map((x, c) => {
        const p = people[c < 2 ? 0 : 1];
        const f: RingFruit = BED_FRUIT[r][c % 2];
        const id = fruitId(p.person, f);
        const species = r ? bed.front : bed.back;
        const cell = `${r}-${c}`;
        const stage = flowerOf(id, p.rings[f].met, rec);
        return { r, c, x, y, cell, id, f, person: p.person, species, stage, open: stage === 'open' };
      })
    )
  );

  // A newly met goal's flower blooms: on the first render after a beat (as the tree's fruit lands), else a moment
  // after the data arrives; several 150 ms apart. Each is marked as it opens, so a reload finds it open.
  let first = true;
  const queued = new Set<string>();
  $effect(() => {
    const d = date;
    const due = cells.filter((s) => s.stage === 'bloom' && !queued.has(`${d}|${s.id}`)).map((s) => s.id);
    untrack(() => {
      const wait = first ? 1300 : 1500;
      first = false;
      if (!due.length) return;
      for (const id of due) queued.add(`${d}|${id}`);
      due.forEach((id, k) => later(wait + k * 150, () => bloom(d, id)));
    });
  });
  function bloom(d: string, id: string) {
    if (rec.date !== d) return;
    rec = markBloomed(d, id);
    opening = [...opening, id];
    cue('flower-bloom');
    later(1400, () => (opening = opening.filter((o) => o !== id)));
  }
</script>

{#each cells as s (s.cell)}
  {@const h = FLOWER_U * (FLOWER_SCALE[s.species] ?? 1)}
  <span class="fl" class:opening={opening.includes(s.id)} data-flower={s.cell} data-goal={s.f} data-person={s.person}
    data-stage={s.open ? 'open' : 'bud'} style:left={u(s.x)} style:top={u(s.y)} style:z-index={s.r ? 53 : 49}>
    {#if s.open}
      <span class="b"><OfficialArt key={hybrid?.cell === s.cell ? `flowers/${hybrid.flower}` : flowerArt(s.species)} size={u(h)} /></span>
      {#if opening.includes(s.id)}
        <!-- the bud it was, squashing before it gives way; petal bits burst out and a glint pops at the bloom -->
        <span class="was">{@render budArt(PETAL[s.species], h)}</span>
        <span class="burst" aria-hidden="true" style:--c={PETAL[s.species]}>
          {#each BITS as a, k (k)}<i style:--a="{a}deg" style:--d={u(10 + (k % 3) * 2)}></i>{/each}
          <svg class="glint" viewBox="0 0 24 24"><path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z" /></svg>
        </span>
      {/if}
    {:else}
      <span class="sway" style:animation-delay="{-(s.c * 0.9 + s.r * 1.7)}s">{@render budArt(PETAL[s.species], h)}</span>
    {/if}
    {#if season === 'winter'}<span class="cap"></span>{/if}
  </span>
{/each}

<!-- NH's growth stage before the bloom, at the flower's full height: its leaves and stem, and a closed bud (about 0.45 of
     the flower head's width) in a darker shade of its petals, green sepals at its base -->
{#snippet budArt(tip: string, h: number)}
  <svg class="budart" viewBox="0 0 40 52" width={u(h * (40 / 52))} height={u(h)} aria-hidden="true">
    <path d="M20 51 C13 51 4 48 1 38 C9 35 17 40 20 51 Z" fill="#4E9E3C" />
    <path d="M20 51 C27 51 36 48 39 38 C31 35 23 40 20 51 Z" fill="#5DB046" />
    <path d="M20 51 C19.4 42 19.4 33 20 24" fill="none" stroke="#4A9A3A" stroke-width="3" stroke-linecap="round" />
    <path d="M20 5 C26 10 27.5 17 25 22.5 C23 26 17 26 15 22.5 C12.5 17 14 10 20 5 Z" style:fill="color-mix(in srgb, {tip} 72%, #4A2238)" />
    <path d="M17.5 9.5 C16 13 16 17 17.5 20" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="1.6" stroke-linecap="round" />
    <path d="M15 22.5 C14 19 15 16.5 16.5 15 C17.5 18.5 18.5 21.5 20 24.5 C23 21.5 22.5 18.5 23.5 15 C25 16.5 26 19 25 22.5 C23 26 17 26 15 22.5 Z" fill="#62B84A" />
  </svg>
{/snippet}

<style>
  .cap {
    position: absolute; left: 24%; right: 24%; top: 4%; height: 16%; border-radius: 50% 50% 40% 40%;
    background: #fff; box-shadow: 0 1px 0 #DDE7F3;
  }
  /* feet on the row line: the trimmed art's stem ends at its bottom edge */
  .fl { position: absolute; width: max-content; transform: translate(-50%, -96%); line-height: 0; pointer-events: none; }
  .b, .sway, .budart { display: block; transform-origin: 50% 100%; }
  /* a bud sways gently from its base, ±1.5° every 3.6 s (held still under a sheet) */
  .sway { animation: bud-sway 3.6s ease-in-out infinite; }
  :global(.if-scene[data-covered]) .sway { animation-play-state: paused; }
  @keyframes bud-sway { 0%, 100% { transform: rotate(-1.5deg); } 50% { transform: rotate(1.5deg); } }
  /* the bloom: the bud squashes (0–120 ms) and gives way; the flower pops .6 → 1.14 (120–420 ms) and settles */
  .was { position: absolute; left: 50%; bottom: 0; translate: -50% 0; line-height: 0; }
  .was .budart { animation: bud-squash 120ms ease-out both; }
  @keyframes bud-squash { 0% { transform: none; } 99% { transform: scale(1.06, .9); opacity: 1; } 100% { transform: scale(1.06, .9); opacity: 0; } }
  .opening .b { animation: fl-open 620ms linear both; }
  @keyframes fl-open {
    0%, 19% { transform: scale(.6); opacity: 0; }
    19.4% { transform: scale(.6); opacity: 1; animation-timing-function: cubic-bezier(.34, 1.56, .64, 1); }
    67.7% { transform: scale(1.14); animation-timing-function: ease-in-out; }
    84% { transform: scale(.96); animation-timing-function: ease-out; }
    100% { transform: none; opacity: 1; }
  }
  /* five petal bits burst out 10–14u from the bloom over .55 s; one white glint at 300 ms */
  .burst { position: absolute; left: 50%; top: 32%; width: 0; height: 0; }
  .burst i {
    position: absolute; left: -2.5px; top: -2px; width: 5px; height: 4px; border-radius: 50% 50% 50% 0; background: var(--c);
    box-shadow: 0 0 0 .5px rgb(0 0 0 / .08); opacity: 0; animation: bit 550ms 120ms ease-out both;
  }
  @keyframes bit {
    0% { transform: rotate(var(--a)) translateY(0) scale(.6); opacity: 1; }
    70% { opacity: 1; }
    100% { transform: rotate(var(--a)) translateY(calc(-1 * var(--d))) scale(1); opacity: 0; }
  }
  .burst .glint { position: absolute; left: 0; top: 0; width: 12px; height: 12px; translate: -50% -50%; fill: #fff; opacity: 0; animation: bloom-glint 360ms 300ms ease-out both; }
  @keyframes bloom-glint { 0% { transform: scale(0) rotate(0); opacity: 0; } 40% { transform: scale(1.1) rotate(30deg); opacity: 1; } 100% { transform: scale(0) rotate(80deg); opacity: 0; } }
</style>
