<script lang="ts">
  // Group stretching's tape deck (docs/design.md "Group stretching"), after NH's ラジオ体操 in the plaza: it turns up on the
  // lawn on a day either of us met 🍑 Exercise, or when the island is opened 06:00–08:00 (stretching.ts), at world.ts
  // TAPE_DECK between the villagers (a world node at its foot), where this screen's controls leave room (else not now). A tap plays its tape (an original little march: the hour's
  // music ducks) and both villagers, and the visitor if one is out and awake, do three of NH's stretches together (~6 s,
  // motion/stretch.svelte.ts), ♪ rising from the deck; once a day per phone, then the deck goes for the day. No ベル.
  // A scene item like the visitors (aria-hidden, a 44px reach): SceneTaps asks it about each tap (`tap`).
  // On the 3D island's layout the deck is the layout's (a fixed piece, world3d/objects.ts: NH's boom box at the
  // villagers' scale, there every day): a tap on it plays the tape when it's out, else says why not (done today, or
  // when it plays: an Exercise day or a morning), and its ♪ floats only when it's ready.
  //   ?stretch (dev or ?demo) brings the deck out now.
  import { hookFlag } from './devHooks.ts';
  import { su } from './scene.ts';
  import { TAPE_DECK } from './world.ts';
  import { site } from './site.svelte.ts';
  import { useWorld } from './camera.svelte.ts';
  import { sceneSfx, shownNow } from './sceneTaps.ts';
  import { MIN_HIT, grow, inside } from './hitbox.ts';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { cue } from '#lib/sound/cues.ts';
  import { dayKey, jst, minuteNow } from '#lib/time/clock.ts';
  import { clearAt, guardsU, stageGeo } from './placement.ts';
  import { POSES, POSE_MS, STRETCH_MS, deckOut, sawIsland, stretched, stretchedToday } from './stretching.ts';
  import { t } from '#lib/i18n/index.ts';
  import { groupStretch } from '../motion/stretch.svelte.ts';

  interface Props {
    scene?: HTMLElement;
    /** Live, not covered by a sheet, page visible. */
    enabled: () => boolean;
    /** Either of us met 🍑 Exercise today. */
    exercise: boolean;
    /** A line in a balloon from the deck (Talk's). */
    say?: (name: string, parts: string | string[], from: Element, o?: { colour?: string }) => void;
  }
  let { scene, enabled, exercise, say }: Props = $props();
  const w = useWorld();

  const want = hookFlag('stretch');

  /** Half its width and its height (u: the radio is about 1.4 times as wide as tall), for the clearance check. */
  const HW = 12.5, UP = 18;
  /** Its height on the 3D island (u): NH's boom box (7.3 model units) at the villagers' scale (assets.json
   *  deco/tape-deck: 5.4u a unit, as NH has it beside them), its tap area that high. */
  const UP3 = 39.5;
  const up = $derived(w.rest.three ? UP3 : UP);

  const clock = $derived(minuteNow());
  const date = $derived(dayKey(clock));
  /** Bumped when today's stretch is done (the deck re-derives). */
  let bump = $state(0);
  let playing = $state(false);
  $effect(() => sawIsland(date, jst(clock).hour));
  /** Ready to play: not played today, and an Exercise day or a morning (or the dev hook's). */
  const ready = $derived.by(() => {
    void bump;
    void clock;
    return playing || (want && bump === 0) || deckOut(date, jst(clock).hour, exercise);
  });
  /** On the layout the deck always stands (the layout's piece): only its tape waits for its day. */
  const fixed = $derived(site.on);
  const out = $derived(fixed || ready);

  let el = $state<HTMLElement>();
  /** Its spot (world x, z), or null when a control covers it on this screen (measured when the camera settles, once the
   *  projector has placed everything; off screen it stays: the projector hides it). */
  let spot = $state<readonly [number, number] | null>(null);
  $effect(() => {
    const show = out;
    void site.rev;
    void w.rest.z;
    void w.rest.vw;
    if (!show) return void (spot = null);
    // (the layout's own piece stands there whatever's on screen: its tap area with it)
    if (fixed) return void (spot = TAPE_DECK);
    if (!w.rest.ready || (playing && spot)) return;
    let id = requestAnimationFrame(() => (id = requestAnimationFrame(() => {
      const g = stageGeo(scene);
      const [x, z] = TAPE_DECK;
      if (!g || !w.inView(x, z)) return void (spot = TAPE_DECK);
      // flat on the lawn: clear of the controls themselves (their 6px tap padding may run over it; the villagers only
      // pass by), and of the rock, a dig spot or a mushroom (a weed may stand behind it)
      const keep = guardsU(g, -5 * g.k, (el) => !!el.closest('[data-actor]') || !shownNow(el));
      for (const it of scene?.querySelectorAll('[data-care="rock"], [data-find], [data-arch]') ?? []) {
        const r = (it.firstElementChild ?? it).getBoundingClientRect();
        if (r.width && shownNow(it)) keep.push({ x0: (r.left - g.r.left) * g.k, x1: (r.right - g.r.left) * g.k, y0: (r.top - g.r.top) * g.k, y1: (r.bottom - g.r.top) * g.k });
      }
      const k = w.scaleAt(x, z), [sx, sy] = w.screenU(x, z, UP / 2);
      spot = clearAt(keep, sx, sy, HW * k, (UP / 2) * k) ? TAPE_DECK : null;
    })));
    return () => cancelAnimationFrame(id);
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

  /** A tap on the scene (client px): true when the deck took it. Reach: a 44px target around the radio. Not ready (the
   *  layout's deck, every day): a line saying why. */
  export function tap(px: number, py: number): boolean {
    const r = el?.querySelector('.radio')?.getBoundingClientRect();
    // (out of view its node is hidden but keeps its last box: no tap there)
    if (!spot || !r || !enabled() || !w.inView(spot[0], spot[1])) return false;
    if (!inside(grow(r, MIN_HIT, 6), px, py)) return false;
    if (playing) return true;
    if (ready) play();
    else if (el) {
      sceneSfx('decor');
      say?.(t('world.deck'), t(stretchedToday(date) ? 'world.deck.done' : 'world.deck.when'), el, { colour: '#FFF1C9' });
    }
    return true;
  }
</script>

{#if out && spot}
  <div class="node" aria-hidden="true" {@attach w.at({ x: spot[0], z: spot[1], h: up + 22, m3: { key: 'deco/tape-deck', id: 'tape-deck', emit: playing ? { kind: 'notes', every: 1300, lift: up * 0.8 } : undefined } })}>
  <span class="deck" class:playing data-stretch={playing ? 'on' : ready ? 'ready' : 'idle'} bind:this={el} style:--up={up}>
    <span class="radio"><OfficialArt key="deco/tape-deck" size={su(up)} /></span>
    {#if playing}
      <span class="notes" data-m3art style:--total="{STRETCH_MS}ms">{#each [0, 1, 2, 3] as i (i)}<i style:--i={i}>♪</i>{/each}</span>
    {:else if ready}
      <span class="hint">♪</span>
    {/if}
  </span>
  </div>
{/if}

<style>
  /* a world node on the lawn between the villagers, among everything else by depth (it never sits under a control:
     measured) */
  .node { width: 0; height: 0; pointer-events: none; }
  .deck { position: absolute; left: 0; top: 0; width: 0; height: 0; pointer-events: none; }
  .deck > * { position: absolute; left: 0; top: 0; line-height: 0; }
  .radio { translate: -50% -94%; transform-origin: 50% 100%; animation: deck-in .5s var(--ease-bounce) both; }
  .radio :global(.official) { max-width: none; filter: var(--leaf-tint,) drop-shadow(0 2px 1px rgba(60, 70, 40, .3)); }
  @keyframes deck-in { from { transform: scale(.4); opacity: 0; } }
  /* the tape playing: the deck thumps on the beat */
  .playing .radio { animation: thump .5s ease-in-out infinite; }
  @keyframes thump { 0%, 100% { transform: none; } 20% { transform: scale(1.06, .94); } }
  .notes, .hint { top: calc((-4 - var(--up, 18)) * var(--su)); width: 0; height: 0; }
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
