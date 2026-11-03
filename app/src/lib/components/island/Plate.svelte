<script lang="ts">
  // The catch plate (docs/design.md "Scene interactions"): NH's catch line on a plate like the jar's (cream, 4px lip,
  // the plate's ink) with an official icon at its start that pops up out of the catch, read like NH's dialogue box
  // (pager.ts): it types in, two lines a page, a ▼ bobs while a page follows; a tap finishes the page, turns it, and
  // on the last page closes it; left alone a page turns after 6 s and the last goes after a read's length. It sits in
  // the bottom stack (CatchStack.svelte), laid out there: measured hidden (its fonts in), then shown, the icon flying
  // from the catch to its place.
  //   <Plate {scene} x={u} y={u} art="critters/sea-bass" parts={[line, note]} ondone={…} />   (x, y: the source, stage u)
  import { onMount, tick } from 'svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { stageGeo } from './placement.ts';
  import { TYPE_MS, arrow, paginate, split, tapBox, typeOne, typing, type PagerState } from './pager.ts';

  interface Props {
    scene?: HTMLElement;
    /** The source (stage units). */
    x: number;
    y: number;
    art: string;
    /** The text: each part starts a page; long parts split two lines a page. */
    parts: string | readonly string[];
    /** Fading out of the stack: its timers stop, and it's no longer the catch's plate (`data-fx`). */
    leaving?: boolean;
    ondone: () => void;
  }
  let { scene, x, y, art, parts, leaving = false, ondone }: Props = $props();
  let at = $state({ dx: 0, dy: 0, placed: false });
  // the source and text are fixed for the plate's life (the stack keys a new one per catch)
  // svelte-ignore state_referenced_locally
  let pg = $state<PagerState>({ pages: paginate(parts), page: 0, shown: 0 });
  let el = $state<HTMLElement>();
  const typedNow = $derived(split(pg));
  const typed = $derived(typedNow[0]), untyped = $derived(typedNow[1]);

  let typer: ReturnType<typeof setInterval> | undefined;
  let idle: ReturnType<typeof setTimeout> | undefined;
  const stop = () => {
    clearInterval(typer);
    clearTimeout(idle);
  };
  function run() {
    stop();
    typer = setInterval(() => {
      pg = typeOne(pg);
      if (!typing(pg)) (clearInterval(typer), rest());
    }, TYPE_MS);
  }
  function rest() {
    clearTimeout(idle);
    const last = pg.page >= pg.pages.length - 1;
    idle = setTimeout(() => (last ? ondone() : ((pg = tapBox(pg).state), run())), last ? Math.max(2400, 800 + [...pg.pages[pg.page]].length * 60) : 6000);
  }
  /** NH's A on the plate. */
  function tapIt() {
    const r = tapBox(pg);
    pg = r.state;
    if (r.action === 'close') return stop(), ondone();
    if (r.action === 'finish') return clearInterval(typer), rest();
    run();
  }

  $effect(() => void (leaving && stop()));

  onMount(() => {
    // measured once its glyphs' font subsets are in (a page's first use of a subset fetches it), then shown
    void tick().then(() => document.fonts?.ready).then(() => {
      if (!el?.isConnected || leaving) return;
      const g = stageGeo(scene), icon = el.querySelector('.catch-icon')?.getBoundingClientRect();
      // the icon starts at the catch (px from its place)
      const dx = g && icon ? g.r.left + x / g.k - (icon.left + icon.width / 2) : 0, dy = g && icon ? g.r.top + y / g.k - (icon.top + icon.height / 2) : 0;
      at = { dx, dy, placed: true };
      run();
    });
    return stop;
  });
</script>

<span class="catch" class:placed={at.placed} data-fx={leaving ? 'catch-leaving' : 'catch'} bind:this={el} style:--dx="{at.dx}px" style:--dy="{at.dy}px">
  <button type="button" class="catch-plate" data-sfx="tick" data-page={pg.page} data-pages={pg.pages.length} aria-label={pg.pages.join(' ')} onclick={tapIt}>
    <span class="catch-icon"><OfficialArt key={art} size="clamp(40px, calc(46 * var(--su)), 48px)" eager /></span>
    <span class="catch-say" aria-hidden="true">
      {#each pg.pages as p, i (i)}<span class="pg" class:now={i === pg.page}>{#if i === pg.page}<span>{typed}</span><span class="rest">{untyped}</span>{:else}{p}{/if}</span>{/each}
    </span>
    {#if arrow(pg)}<i class="next" data-next aria-hidden="true"></i>{/if}
  </button>
</span>

<style>
  .catch { display: block; width: max-content; max-width: 100%; }
  /* measured hidden, then shown */
  .catch:not(.placed), .catch:not(.placed) * { visibility: hidden; animation: none !important; }
  .catch-plate {
    appearance: none; border: 0; margin: 0; cursor: pointer; pointer-events: auto; text-align: left; -webkit-tap-highlight-color: transparent;
    position: relative; display: flex; align-items: center; gap: 6px;
    width: max-content; max-width: 100%; padding: 3px 22px 3px 4px; border-radius: 22px; /* the right pad keeps the ▼'s room */
    background: var(--plate); color: var(--plate-ink); box-shadow: 0 var(--lip-h) 0 var(--plate-lip);
    font: 700 clamp(13px, calc(14 * var(--su)), 15px) / 1.35 var(--font-ui); text-wrap: balance;
    animation: say .25s ease-out both;
  }
  @keyframes say { from { opacity: 0; transform: translateY(4px) scale(.96); } }
  .catch-say { display: grid; white-space: pre-line; padding: 6px 0; }
  .pg { grid-area: 1 / 1; visibility: hidden; }
  .pg.now { visibility: visible; }
  .rest { visibility: hidden; }
  .catch-icon { flex: none; line-height: 0; animation: lift .55s cubic-bezier(.3, 1.5, .5, 1) both; }
  .catch-icon :global(.official) { max-width: none; filter: drop-shadow(0 1.5px 1.5px rgba(60, 40, 20, .3)); }
  /* the icon starts at the catch (--dx/--dy off its place) and pops over to it */
  @keyframes lift { from { transform: translate(var(--dx), var(--dy)) scale(.4); opacity: 0; } 25% { opacity: 1; } }
  /* NH's "next" arrow */
  .next {
    position: absolute; right: 9px; bottom: 9px; width: 10px; height: 7px; background: #F6A623;
    clip-path: polygon(0 0, 100% 0, 50% 100%); filter: drop-shadow(0 1px 0 rgba(150, 90, 30, .35));
    animation: bob .6s ease-in-out infinite alternate;
  }
  @keyframes bob { from { transform: translateY(-1.5px); } to { transform: translateY(1.5px); } }
  @media (prefers-reduced-motion: reduce) {
    .catch-plate { animation: fade .2s ease-out both; }
    .catch-icon, .next { animation: none; }
    @keyframes fade { from { opacity: 0; } }
  }
</style>
