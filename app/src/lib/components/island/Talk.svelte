<script lang="ts">
  // Speech on the island (docs/design.md "Dialogue"): NH's dialogue box as a speech balloon for my villager's chat and
  // the visitors' lines: a cream bubble with a soft lip and a tail to the speaker, the name on a tilted tag in the
  // speaker's own colour (the villager's NH colour) at its top-left. The text types in at 33 ms a glyph, two lines a
  // page; a tap on the box finishes the page at once, the next turns the page (a ▼ bobs at the bottom-right while one
  // follows), and on the last page a tap closes it. Left alone, a finished page turns after 6 s and the last closes
  // after a read's length. One at a time; a new line replaces the last. It sits as close above (else below) the speaker
  // as it can, inside the scene's safe area and clear of every control, a tree's popup, しずえ's box and the speaker
  // (placement.ts); with no room it's skipped. The box is sized for its longest page, so it never jumps between pages.
  //   <Talk bind:this={talk} scene={el} />   talk.say(name, ['page…', 'next part…'], speakerEl, { colour })
  import { tick } from 'svelte';
  import { place, type Box } from './placement.ts';
  import { TYPE_MS, arrow, paginate, split, tagInk, tapBox, typeOne, typing, type PagerState } from './pager.ts';

  let { scene }: { scene?: HTMLElement } = $props();

  interface Said { n: number; name: string; colour: string; x: number; y: number; tail: number; below: boolean; placed: boolean }
  let said = $state<Said | null>(null);
  let pg = $state<PagerState>({ pages: [''], page: 0, shown: 0 });
  let el = $state<HTMLElement>();
  let seq = 0;
  let typer: ReturnType<typeof setInterval> | undefined;
  let idle: ReturnType<typeof setTimeout> | undefined;
  const stop = () => {
    clearInterval(typer);
    clearTimeout(idle);
  };
  $effect(() => stop);

  /** Type the current page, then wait: the next page after 6 s, or close after a read's length on the last. */
  function run(n: number) {
    stop();
    typer = setInterval(() => {
      if (said?.n !== n) return stop();
      pg = typeOne(pg);
      if (!typing(pg)) {
        clearInterval(typer);
        rest(n);
      }
    }, TYPE_MS);
  }
  function rest(n: number) {
    clearTimeout(idle);
    const last = pg.page >= pg.pages.length - 1;
    const read = Math.max(2800, 900 + [...pg.pages[pg.page]].length * 70);
    idle = setTimeout(() => {
      if (said?.n !== n) return;
      if (last) said = null;
      else {
        pg = tapBox(pg).state;
        run(n);
      }
    }, last ? read : 6000);
  }

  /** A tap on the box (NH's A): finish the page, turn it, or close on the last. */
  function tapIt() {
    const s = said;
    if (!s) return;
    const r = tapBox(pg);
    pg = r.state;
    if (r.action === 'close') return stop(), (said = null);
    if (r.action === 'finish') return clearInterval(typer), rest(s.n);
    run(s.n);
  }

  /** Say `parts` (each starts a page; long ones split two lines a page) from `from` (its top centre is the speaker's
   *  head). `avoid`: more boxes to keep clear of (client px), e.g. the speaker's emote; `colour`: the name tag's. */
  export async function say(name: string, parts: string | readonly string[], from: Element, o: { avoid?: Box[]; colour?: string } = {}) {
    stop();
    const n = ++seq;
    pg = { pages: paginate(parts), page: 0, shown: 0 };
    said = { n, name, colour: o.colour ?? '#FFD84D', x: 0, y: 0, tail: 0, below: false, placed: false };
    await tick();
    const stage = scene?.querySelector('.stage')?.getBoundingClientRect();
    const box = el?.getBoundingClientRect(), src = from.getBoundingClientRect();
    if (!scene || !stage || !box || said?.n !== n) return;
    const sx = src.left + src.width / 2, sy = src.top;
    // never over the speaker itself
    const self = { x0: src.left - 4, x1: src.right + 4, y0: src.top - 4, y1: src.bottom + 4 };
    const at = place(scene, box.width, box.height + 10, sx, sy, [...(o.avoid ?? []), self]); // + the tail
    if (!at) return (said = null);
    const below = at.y > sy;
    const tail = Math.max(-box.width / 2 + 18, Math.min(box.width / 2 - 18, sx - at.x));
    Object.assign(said, { x: at.x - stage.left, y: at.y - stage.top + (below ? 5 : -5), tail, below, placed: true });
    run(n);
  }
</script>

<div class="talk">
  {#if said}
    {@const [typed, untyped] = split(pg)}
    {#key said.n}
      <button type="button" class="say" class:placed={said.placed} class:below={said.below} data-fx="talk" data-sfx="tick" bind:this={el}
        aria-label="{said.name}: {pg.pages.join(' ')}" data-page={pg.page} data-pages={pg.pages.length}
        style:left="{said.x}px" style:top="{said.y}px" style:--tail="{said.tail}px" style:--tag={said.colour} style:--tag-ink={tagInk(said.colour)}
        onclick={tapIt}>
        <b class="who">{said.name}</b>
        <span class="text" aria-hidden="true">
          <!-- every page in one cell: the box takes the longest one's size -->
          {#each pg.pages as p, i (i)}<span class="pg" class:now={i === pg.page}>{#if i === pg.page}<span>{typed}</span><span class="rest">{untyped}</span>{:else}{p}{/if}</span>{/each}
        </span>
        {#if arrow(pg)}<i class="next" data-next aria-hidden="true"></i>{/if}
        <span class="sr" role="status">{pg.pages.join(' ')}</span>
      </button>
    {/key}
  {/if}
</div>

<style>
  .talk { position: absolute; inset: 0; z-index: var(--z-taps); pointer-events: none; }
  /* NH's speech balloon: cream, round, a soft lip, the name tag on its top-left edge, a tail to the speaker */
  .say {
    appearance: none; border: 0; margin: 0; cursor: pointer; pointer-events: auto; text-align: left; -webkit-tap-highlight-color: transparent;
    position: absolute; translate: -50% -50%; width: max-content; max-width: min(272px, calc(100vw - 24px));
    padding: 12px 16px 12px; border-radius: 22px; background: var(--c-cream, #FFF9E3); color: var(--c-ink, #4A3A2C);
    box-shadow: 0 3px 0 rgba(150, 110, 70, .28); font: 700 15px/1.5 var(--font-ui); text-wrap: pretty;
    animation: pop .22s cubic-bezier(.3, 1.4, .5, 1) both;
  }
  .say:not(.placed) { visibility: hidden; animation: none; }
  .say::after {
    content: ''; position: absolute; left: calc(50% + var(--tail) - 9px); bottom: -9px; width: 18px; height: 11px;
    background: inherit; clip-path: polygon(0 0, 100% 0, 50% 100%); filter: drop-shadow(0 2px 0 rgba(150, 110, 70, .2));
  }
  .say.below::after { bottom: auto; top: -9px; clip-path: polygon(50% 0, 100% 100%, 0 100%); filter: none; }
  .who {
    position: absolute; left: 12px; top: -12px; padding: 2px 11px; border-radius: 999px; rotate: -4deg;
    background: var(--tag); color: var(--tag-ink); font: 700 12px/1.35 var(--font-ui);
    box-shadow: 0 2px 0 rgba(120, 90, 60, .3), inset 0 0 0 1.5px rgba(120, 90, 60, .18);
  }
  .text { display: grid; white-space: pre-line; }
  .pg { grid-area: 1 / 1; visibility: hidden; }
  .pg.now { visibility: visible; }
  .rest { visibility: hidden; } /* the untyped rest keeps its room */
  /* NH's "next" arrow: a small rounded orange triangle at the bottom-right, bobbing gently */
  .next {
    position: absolute; right: 13px; bottom: 5px; width: 11px; height: 8px; background: #F6A623;
    clip-path: polygon(0 0, 100% 0, 50% 100%); border-radius: 2px; filter: drop-shadow(0 1px 0 rgba(150, 90, 30, .35));
    animation: bob .6s ease-in-out infinite alternate;
  }
  @keyframes bob { from { transform: translateY(-1.5px); } to { transform: translateY(1.5px); } }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  @keyframes pop { from { transform: scale(.6); opacity: 0; } }
</style>
