<script lang="ts">
  // Speech on the island (docs/design.md "Dialogue"): NH's dialogue box as a speech balloon for my villager's chat and
  // the visitors' lines: a cream bubble with a soft lip and a tail to the speaker, the name on a tilted tag in the
  // speaker's own colour (the villager's NH colour) at its top-left. The text types in at 33 ms a glyph, two lines a
  // page; a tap on the box finishes the page at once, the next turns the page (a ▼ bobs at the bottom-right while one
  // follows), and on the last page a tap closes it. Left alone, a finished page turns after 6 s and the last closes
  // after a read's length. One at a time; a new line replaces the last. It stands by its speaker, the tail pointing at
  // them (placement.ts placeBy, NH's rule for every speaker): above the head when there's room, else beside, else below,
  // at most NEAR px off, never over the HUD, しずえ's box, a tree's popup, the speaker or off the safe area (what gives
  // way first: the museum, then the island's things, then the villagers); it follows the speaker while it talks and
  // closes if they go (my villager hushes as it sets off walking). The box is sized for its longest page, so it never
  // jumps between pages.
  // A line may end on a choice (NH's answers: Jack's 「キャンディを あげる」): its answers show in a row at the balloon's
  // foot (the box keeps their room on every page) once the last page has typed; until one is picked a tap on the box
  // does nothing (left alone 15 s, it closes unanswered).
  //   <Talk bind:this={talk} scene={el} />   talk.say(name, ['page…', 'next part…'], speakerEl, { colour, choices, ondone })
  // `ondone` runs once the box closes (tapped away, answered or read through; at once when there's no room for it),
  // not when a new line replaces it.
  import { tick } from 'svelte';
  import { TAIL_IN, placeBy, type Side } from './placement.ts';
  import { TYPE_MS, arrow, paginate, split, tagInk, tapBox, typeOne, typing, type Choice, type PagerState } from './pager.ts';

  let { scene }: { scene?: HTMLElement } = $props();

  interface Said { n: number; name: string; colour: string; x: number; y: number; tail: number; side: Side; follow: boolean; placed: boolean; choices: Choice[]; mx: number; my: number; mw: number; mh: number }
  let said = $state<Said | null>(null);
  let pg = $state<PagerState>({ pages: [''], page: 0, shown: 0 });
  let el = $state<HTMLElement>();
  let menu = $state<HTMLElement>();
  let layer = $state<HTMLElement>();
  /** The answers show once the last page has typed. */
  const asking = $derived(!!said?.choices.length && pg.page >= pg.pages.length - 1 && !typing(pg));
  let seq = 0;
  /** The open box's `ondone`. */
  let done: (() => void) | undefined;
  let typer: ReturnType<typeof setInterval> | undefined;
  let idle: ReturnType<typeof setTimeout> | undefined;
  const stop = () => {
    clearInterval(typer);
    clearTimeout(idle);
  };
  /** Stop everything, the following too. */
  const halt = () => {
    stop();
    clearInterval(watcher);
    sized?.disconnect();
    sized = undefined;
  };
  $effect(() => halt);
  /** Close the box and run its `ondone`. */
  function close() {
    halt();
    said = null;
    const d = done;
    done = undefined;
    d?.();
  }

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
    // a question waits longer for its answer (then closes unanswered)
    const read = said?.choices.length ? 15000 : Math.max(2800, 900 + [...pg.pages[pg.page]].length * 70);
    idle = setTimeout(() => {
      if (said?.n !== n) return;
      if (last) close();
      else {
        pg = tapBox(pg).state;
        run(n);
      }
    }, last ? read : 6000);
  }

  /** A tap on the box (NH's A): finish the page, turn it, or close on the last. */
  function tapIt() {
    const s = said;
    if (!s || asking) return;
    const r = tapBox(pg);
    pg = r.state;
    if (r.action === 'close') return close();
    if (r.action === 'finish') return clearInterval(typer), rest(s.n);
    run(s.n);
  }

  function choose(c: Choice) {
    close();
    c.pick();
  }

  /** Close the balloon (my villager set off walking: it only speaks standing still). */
  export function hush() {
    halt();
    said = null;
  }

  /** Say `parts` (each starts a page; long ones split two lines a page) from `from` (its top centre is the speaker's
   *  head); `colour`: the name tag's. */
  export async function say(name: string, parts: string | readonly string[], from: Element, o: { colour?: string; choices?: Choice[]; ondone?: () => void } = {}) {
    halt();
    const n = ++seq;
    done = o.ondone;
    pg = { pages: paginate(parts), page: 0, shown: 0 };
    said = { n, name, colour: o.colour ?? '#FFD84D', x: 0, y: 0, tail: 0, side: 'top', follow: false, placed: false, choices: o.choices ?? [], mx: 0, my: 0, mw: 0, mh: 0 };
    await tick();
    // the answers' row: measured first, then the balloon keeps its room at its foot
    const m = menu?.getBoundingClientRect();
    if (m && said?.n === n) {
      Object.assign(said, { mw: m.width, mh: m.height });
      await tick();
    }
    if (!scene || said?.n !== n) return;
    speaker = from;
    if (!at(n)) return close();
    run(n);
    watch(n);
  }

  /** The camera is moving (a scroll): the balloon steps aside until it settles, then stands by its speaker again
   *  (placing it every frame would measure every control each frame). */
  let held = $state(false);
  export function hold(on: boolean) {
    if (on === held) return;
    held = on;
    if (!on && said?.placed && !at(said.n)) close();
  }

  /** The open balloon's speaker (to follow it as it moves). */
  let speaker: Element | undefined;
  let seen: DOMRect | undefined;
  let watcher: ReturnType<typeof setInterval> | undefined;
  /** Place the balloon by its speaker as it stands now (placement.ts placeBy: NH's rule); false when there's no room. */
  function at(n: number): boolean {
    // its layout size (a pop-in's scale, mid-way, would make the box look smaller than it stands)
    const st = scene?.querySelector('.stage')?.getBoundingClientRect(), box = el && { width: el.offsetWidth, height: el.offsetHeight };
    if (!scene || !st || !box || !speaker || said?.n !== n) return false;
    const src = (seen = speaker.getBoundingClientRect());
    const from = { x0: src.left, x1: src.right, y0: src.top, y1: src.bottom };
    // never over the speaker
    const p = placeBy(scene, box.width, box.height, from, [{ x0: src.left - 4, x1: src.right + 4, y0: src.top - 4, y1: src.bottom + 4 }], layer);
    if (!p) return false;
    // the tail: along the balloon's edge facing the speaker, at its head (from above or below) or upper part (beside)
    const side = p.side === 'top' || p.side === 'bottom';
    const tail = side
      ? Math.max(-box.width / 2 + TAIL_IN, Math.min(box.width / 2 - TAIL_IN, (src.left + src.right) / 2 - p.x))
      : Math.max(-box.height / 2 + TAIL_IN, Math.min(box.height / 2 - TAIL_IN, from.y0 + Math.min(24, (from.y1 - from.y0) * 0.3) - p.y));
    const bx = p.x - st.left, by = p.y - st.top;
    // the answers' row: centred in the room at the balloon's foot
    Object.assign(said, { x: bx, y: by, tail, side: p.side, placed: true, mx: bx - said.mw / 2, my: by + box.height / 2 - 10 - said.mh });
    return true;
  }
  /** While it talks the balloon follows its speaker (steps, the layout changing); it closes if the speaker goes. A move
   *  must last (3 looks, 0.6 s) before the balloon goes after it, so a hop or a bob doesn't shake it; once it follows,
   *  every look does until the speaker stands still again. */
  /** The balloon's own size: it can change after it was placed (its font arriving late on a slow phone), and a wider
   *  box at the same centre would run off the screen: placed again. */
  let sized: ResizeObserver | undefined;
  function watch(n: number) {
    clearInterval(watcher);
    sized?.disconnect();
    if (el) {
      let w0 = el.offsetWidth, h0 = el.offsetHeight;
      sized = new ResizeObserver(() => {
        if (said?.n !== n || !el || (Math.abs(el.offsetWidth - w0) < 1 && Math.abs(el.offsetHeight - h0) < 1)) return;
        w0 = el.offsetWidth;
        h0 = el.offsetHeight;
        if (!held && !at(n)) close();
      });
      sized.observe(el);
    }
    let moved = 0;
    watcher = setInterval(() => {
      if (said?.n !== n || !speaker) return clearInterval(watcher);
      if (!speaker.isConnected) return close();
      const r = speaker.getBoundingClientRect();
      if (!seen || Math.abs(r.left - seen.left) + Math.abs(r.top - seen.top) + Math.abs(r.width - seen.width) < 8) return void (moved = 0);
      if (++moved < 3) return;
      said.follow = true;
      if (!at(n)) close();
    }, 200);
  }
</script>

<div class="talk" class:held bind:this={layer}>
  {#if said}
    {@const [typed, untyped] = split(pg)}
    {#key said.n}
      <button type="button" class="say" class:placed={said.placed} class:follow={said.follow} data-side={said.side} data-fx="talk" data-sfx="tick" bind:this={el}
        aria-label="{said.name}: {pg.pages.join(' ')}" data-page={pg.page} data-pages={pg.pages.length}
        style:left="{said.x}px" style:top="{said.y}px" style:--tail="{said.tail}px" style:--tag={said.colour} style:--tag-ink={tagInk(said.colour)}
        style:padding-bottom={said.mh ? `${said.mh + 18}px` : null} style:min-width={said.mw ? `${said.mw + 16}px` : null}
        onclick={tapIt}>
        <b class="who">{said.name}</b>
        <span class="text" aria-hidden="true">
          <!-- every page in one cell: the box takes the longest one's size -->
          {#each pg.pages as p, i (i)}<span class="pg" class:now={i === pg.page}>{#if i === pg.page}<span>{typed}</span><span class="rest">{untyped}</span>{:else}{p}{/if}</span>{/each}
        </span>
        {#if arrow(pg)}<i class="next" data-next aria-hidden="true"></i>{/if}
        <span class="sr" role="status">{pg.pages.join(' ')}</span>
      </button>
      {#if said.choices.length}
        <!-- NH's answers: a row of pills at the balloon's foot (beside it in the DOM: a button can't hold buttons) -->
        <div class="choices" class:placed={said.placed} class:asking data-fx="choices" bind:this={menu}
          style:left="{said.placed ? said.mx : said.x}px" style:top="{said.placed ? said.my : said.y}px">
          {#each said.choices as c, i (i)}
            <button type="button" class="choice" data-sfx="choice-pick" tabindex={asking ? 0 : -1} onclick={() => choose(c)}>{c.label}</button>
          {/each}
        </div>
      {/if}
    {/key}
  {/if}
</div>

<style>
  .talk { position: absolute; inset: 0; z-index: var(--z-taps); pointer-events: none; }
  .talk.held { visibility: hidden; }
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
  .say[data-side='bottom']::after { bottom: auto; top: -9px; clip-path: polygon(50% 0, 100% 100%, 0 100%); filter: none; }
  /* beside the speaker: the tail on the edge facing it, at its upper part */
  .say[data-side='left']::after, .say[data-side='right']::after { bottom: auto; top: calc(50% + var(--tail) - 9px); width: 11px; height: 18px; filter: none; }
  .say[data-side='left']::after { left: auto; right: -9px; clip-path: polygon(0 0, 100% 50%, 0 100%); }
  .say[data-side='right']::after { left: -9px; clip-path: polygon(100% 0, 0 50%, 100% 100%); }
  /* following a speaker who moves while talking */
  .say.follow { transition: left .2s linear, top .2s linear; }
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
  /* the answers: a row at the balloon's foot, over its kept room; they pop in once the last page has typed */
  .choices { position: absolute; display: flex; gap: 6px; width: max-content; pointer-events: none; visibility: hidden; }
  .choices.placed.asking { visibility: visible; pointer-events: auto; animation: pop .22s cubic-bezier(.3, 1.4, .5, 1) both; }
  .choice {
    appearance: none; border: 0; margin: 0; cursor: pointer; min-height: 36px; padding: 6px 11px; border-radius: 999px;
    background: #FFE9A8; color: var(--c-ink, #4A3A2C); font: 700 13px/1.3 var(--font-ui); white-space: nowrap;
    box-shadow: 0 2px 0 rgba(170, 120, 60, .35); -webkit-tap-highlight-color: transparent;
  }
  .choice:hover, .choice:focus-visible { background: #FFD66B; outline: none; }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  @keyframes pop { from { transform: scale(.6); opacity: 0; } }
</style>
