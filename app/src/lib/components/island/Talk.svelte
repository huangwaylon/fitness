<script lang="ts">
  // Speech on the island (docs/design.md "Villager chats"): NH's speech balloon (a cream bubble with a soft lip, a tail
  // to the speaker and a nameplate) for my villager's chat and the visitors' lines. One at a time; a new line replaces
  // the last. It sits as close above (else below) the speaker as it can, inside the scene's safe area and clear of
  // every control, a tree's popup, しずえ's box and the villager's own emote (placement.ts); with no room it's skipped.
  // The text types in at 33 ms a glyph (NH). Gone after a read's length (≥ 2.8 s).
  //   <Talk bind:this={talk} scene={el} />   talk.say(name, text, speakerEl)
  import { tick } from 'svelte';
  import { place, type Box } from './placement.ts';

  let { scene }: { scene?: HTMLElement } = $props();

  interface Said { n: number; name: string; text: string; shown: number; x: number; y: number; tail: number; below: boolean; placed: boolean }
  let said = $state<Said | null>(null);
  let el = $state<HTMLElement>();
  let seq = 0;
  let typing: ReturnType<typeof setInterval> | undefined;
  let done: ReturnType<typeof setTimeout> | undefined;
  const stop = () => {
    clearInterval(typing);
    clearTimeout(done);
  };
  $effect(() => stop);

  /** Say a line from `from` (an element: its top centre is the speaker's head). `avoid`: more boxes to keep clear of
   *  (client px), e.g. the speaker's emote. */
  export async function say(name: string, text: string, from: Element, avoid: Box[] = []) {
    stop();
    const n = ++seq;
    said = { n, name, text, shown: 0, x: 0, y: 0, tail: 0, below: false, placed: false };
    await tick();
    const stage = scene?.querySelector('.stage')?.getBoundingClientRect();
    const box = el?.getBoundingClientRect(), src = from.getBoundingClientRect();
    if (!scene || !stage || !box || said?.n !== n) return;
    const sx = src.left + src.width / 2, sy = src.top;
    const at = place(scene, box.width, box.height + 10, sx, sy, avoid); // + the tail
    if (!at) return (said = null);
    const below = at.y > sy;
    const tail = Math.max(-box.width / 2 + 18, Math.min(box.width / 2 - 18, sx - at.x));
    Object.assign(said, { x: at.x - stage.left, y: at.y - stage.top + (below ? 5 : -5), tail, below, placed: true });
    typing = setInterval(() => {
      if (!said || said.n !== n || said.shown >= text.length) return clearInterval(typing);
      said.shown++;
    }, 33);
    done = setTimeout(() => said?.n === n && (said = null), text.length * 33 + Math.max(2800, 900 + text.length * 70));
  }
</script>

<div class="talk">
  {#if said}
    {#key said.n}
      <span class="say" class:placed={said.placed} class:below={said.below} data-fx="talk" bind:this={el}
        style:left="{said.x}px" style:top="{said.y}px" style:--tail="{said.tail}px">
        <b class="who">{said.name}</b>
        <span class="text" aria-hidden="true"><span>{said.text.slice(0, said.shown)}</span><span class="rest">{said.text.slice(said.shown)}</span></span>
        <span class="sr" role="status">{said.text}</span>
      </span>
    {/key}
  {/if}
</div>

<style>
  .talk { position: absolute; inset: 0; z-index: var(--z-taps); pointer-events: none; }
  /* NH's speech balloon: cream, round, a soft lip, the nameplate on its top-left edge, a tail to the speaker */
  .say {
    position: absolute; translate: -50% -50%; width: max-content; max-width: min(240px, calc(100vw - 32px));
    padding: 12px 16px 10px; border-radius: 22px; background: var(--c-cream, #FFF9E3); color: var(--c-ink, #4A3A2C);
    box-shadow: 0 3px 0 rgba(150, 110, 70, .28); font: 700 15px/1.45 var(--font-ui); text-wrap: pretty;
    animation: pop .22s cubic-bezier(.3, 1.4, .5, 1) both;
  }
  .say:not(.placed) { visibility: hidden; animation: none; }
  .say::after {
    content: ''; position: absolute; left: calc(50% + var(--tail) - 9px); bottom: -9px; width: 18px; height: 11px;
    background: inherit; clip-path: polygon(0 0, 100% 0, 50% 100%); filter: drop-shadow(0 2px 0 rgba(150, 110, 70, .2));
  }
  .say.below::after { bottom: auto; top: -9px; clip-path: polygon(50% 0, 100% 100%, 0 100%); filter: none; }
  .who {
    position: absolute; left: 12px; top: -11px; padding: 2px 10px; border-radius: 999px; rotate: -3deg;
    background: var(--c-yuzu, #FFD84D); color: var(--c-ink, #4A3A2C); font: 700 12px/1.3 var(--font-ui); box-shadow: 0 2px 0 rgba(150, 110, 70, .3);
  }
  .text { display: block; }
  .rest { visibility: hidden; } /* the untyped rest keeps its room, so the bubble never grows as it types */
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  @keyframes pop { from { transform: scale(.6); opacity: 0; } }
</style>
