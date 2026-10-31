<script lang="ts">
  // Group stretching's tape deck (docs/design.md "Group stretching"), after NH's ラジオ体操 in the plaza: it turns up on the
  // lawn on a day either of us met 🍑 Exercise, or when the island is opened 06:00–08:00 (stretching.ts), on a spot
  // measured clear of every control (else the next, else none). A tap plays its tape (an original little march: the hour's
  // music ducks) and both villagers, and the visitor if one is out and awake, do three of NH's stretches together (~6 s,
  // motion/stretch.svelte.ts), ♪ rising from the deck; once a day per phone, then the deck goes for the day. No ベル.
  // A scene item like the visitors (aria-hidden, a 44px reach): SceneTaps asks it about each tap (`tap`).
  //   ?stretch (dev or ?demo) brings the deck out now.
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { cue } from '#lib/sound/cues.ts';
  import { jst, minuteNow } from '#lib/time/clock.ts';
  import { localDateAt } from '#lib/time/dates.ts';
  import { clearAt, guardsU, stageGeo } from './placement.ts';
  import { POSES, POSE_MS, STRETCH_MS, deckOut, sawIsland, stretched } from './stretching.ts';
  import { groupStretch } from '../motion/stretch.svelte.ts';

  interface Props {
    scene?: HTMLElement;
    /** Live, not covered by a sheet, page visible. */
    enabled: () => boolean;
    /** Either of us met 🍑 Exercise today. */
    exercise: boolean;
  }
  let { scene, enabled, exercise }: Props = $props();

  const q = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
  const want = (import.meta.env.DEV || q.has('demo')) && q.has('stretch');
  const U = (n: number) => `calc(${n.toFixed(1)} * var(--su))`;

  /** Where the deck may stand (stage units: x, foot y), in order: on the lawn in front of the hedge beside the plaza
   *  (either side of a weed there), else between the villagers' feet (the beach in front stays the visitors'). */
  const SPOTS: readonly (readonly [number, number])[] = [[220, 103], [200, 103], [195, 303]];
  /** Half its width and its height (u: the radio is about 1.4 times as wide as tall), for the clearance check. */
  const HW = 12.5, UP = 18;

  const clock = $derived(minuteNow());
  const date = $derived(localDateAt(clock.getTime()));
  /** Bumped when today's stretch is done (the deck re-derives). */
  let bump = $state(0);
  let playing = $state(false);
  $effect(() => sawIsland(date, jst(clock).hour));
  const out = $derived.by(() => {
    void bump;
    void clock;
    return playing || (want && bump === 0) || deckOut(date, jst(clock).hour, exercise);
  });

  let el = $state<HTMLElement>();
  let spot = $state<readonly [number, number] | null>(null);
  $effect(() => {
    const show = out, g = stageGeo(scene);
    if (!show || !g) return void (spot = null);
    if (playing && spot) return;
    // flat on the lawn: clear of the controls themselves (their 6px tap padding may run over it), and of the rock, a dig
    // spot or a mushroom (a weed may stand behind it)
    const keep = guardsU(g, -5 * g.k);
    for (const it of scene?.querySelectorAll('[data-care="rock"], [data-find]') ?? []) {
      const r = (it.firstElementChild ?? it).getBoundingClientRect();
      if (r.width) keep.push({ x0: (r.left - g.r.left) * g.k, x1: (r.right - g.r.left) * g.k, y0: (r.top - g.r.top) * g.k, y1: (r.bottom - g.r.top) * g.k });
    }
    spot = SPOTS.find(([x, y]) => clearAt(keep, x, y - UP / 2, HW, UP / 2)) ?? null;
  });

  function play() {
    playing = true;
    stretched(date);
    cue('stretch');
    groupStretch(POSES, POSE_MS, () => {
      playing = false;
      bump++;
    });
  }

  /** A tap on the scene (client px): true when the deck took it. Reach: a 44px target around the radio. */
  export function tap(px: number, py: number): boolean {
    const r = el?.querySelector('.radio')?.getBoundingClientRect();
    if (!spot || !r || !enabled()) return false;
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    if (Math.abs(px - cx) > Math.max(22, r.width / 2 + 6) || Math.abs(py - cy) > Math.max(22, r.height / 2 + 6)) return false;
    if (!playing) play();
    return true;
  }
</script>

{#if out && spot}
  <span class="deck" class:playing data-stretch={playing ? 'on' : 'ready'} bind:this={el} style:translate="{U(spot[0])} {U(spot[1])}" aria-hidden="true">
    <span class="radio"><OfficialArt key="deco/tape-deck" size={U(UP)} /></span>
    {#if playing}
      <span class="notes" style:--total="{STRETCH_MS}ms">{#each [0, 1, 2, 3] as i (i)}<i style:--i={i}>♪</i>{/each}</span>
    {:else}
      <span class="hint">♪</span>
    {/if}
  </span>
{/if}

<style>
  /* on the lawn: in front of the hedge and a weed, behind the trees and the jar (it never overlaps them: measured) */
  .deck { position: absolute; left: 0; top: 0; width: 0; height: 0; z-index: 26; pointer-events: none; --su: calc(100cqw / 390); }
  .deck > * { position: absolute; left: 0; top: 0; line-height: 0; }
  .radio { translate: -50% -94%; transform-origin: 50% 100%; animation: deck-in .5s var(--ease-bounce) both; }
  .radio :global(.official) { max-width: none; filter: drop-shadow(0 2px 1px rgba(60, 70, 40, .3)); }
  @keyframes deck-in { from { transform: scale(.4); opacity: 0; } }
  /* the tape playing: the deck thumps on the beat */
  .playing .radio { animation: thump .5s ease-in-out infinite; }
  @keyframes thump { 0%, 100% { transform: none; } 20% { transform: scale(1.06, .94); } }
  .notes, .hint { top: calc(-22 * var(--su)); width: 0; height: 0; }
  .notes i, .hint {
    font: 700 calc(12 * var(--su)) / 1 var(--font-ui); font-style: normal; color: #FFF6C8; text-shadow: 0 1px 2px rgba(60, 40, 20, .5);
  }
  .notes i { position: absolute; left: 0; animation: note 1.6s ease-out calc(var(--i) * .4s) infinite both; }
  @keyframes note {
    from { transform: translate(0, 0) rotate(-10deg); opacity: 0; } 20% { opacity: 1; }
    to { transform: translate(calc(12 * var(--su)), calc(-24 * var(--su))) rotate(14deg); opacity: 0; }
  }
  /* waiting: now and then a single ♪ floats up (a tape deck: tap it) */
  .hint { animation: hint 4.5s ease-out 1s infinite both; }
  @keyframes hint {
    0% { transform: translate(0, 0); opacity: 0; } 8% { opacity: 1; } 28% { transform: translate(calc(6 * var(--su)), calc(-16 * var(--su))); opacity: 0; }
    100% { opacity: 0; }
  }
</style>
