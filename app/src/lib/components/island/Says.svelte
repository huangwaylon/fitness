<script lang="ts">
  // The villagers' phrases (docs/design.md "Villager taps"): what one of us picked in the picker (SayPicker), in a
  // speech balloon over that villager for SAY_MS, on both phones (mine here at once, the partner's when the relay
  // brings it). Talk's balloon (cream, the soft lip, a tail to the speaker, the name on a tilted tag in the person's
  // colour), one per villager, a newer phrase replacing the one showing. It stands by its speaker by the one rule
  // (placement.ts placeBy), clear of the other villager's, follows the villager as it moves, and steps aside while the
  // camera moves. Not a control: taps go through it. The text is text (never markup).
  //   <Says bind:this={says} scene={el} />   says.say('mine', text, speakerEl, { name, colour })
  import { tick } from 'svelte';
  import { TAIL_IN, placeBy, type Side } from './placement.ts';
  import { tagInk } from './pager.ts';
  import { SAY_MS } from './say.ts';
  import type { Box } from './geom.ts';

  let { scene }: { scene?: HTMLElement } = $props();

  type Id = 'mine' | 'partner';
  interface One { n: number; text: string; name: string; colour: string; x: number; y: number; tail: number; side: Side; placed: boolean; follow: boolean }
  let shown = $state<Record<Id, One | null>>({ mine: null, partner: null });
  const els = $state<Record<Id, HTMLElement | undefined>>({ mine: undefined, partner: undefined });
  let layer = $state<HTMLElement>();
  let seq = 0;
  const speakers: Record<Id, Element | undefined> = { mine: undefined, partner: undefined };
  const seen: Record<Id, DOMRect | undefined> = { mine: undefined, partner: undefined };
  const timers: Record<Id, { end?: ReturnType<typeof setTimeout>; watch?: ReturnType<typeof setInterval> }> = { mine: {}, partner: {} };

  function halt(id: Id) {
    clearTimeout(timers[id].end);
    clearInterval(timers[id].watch);
    timers[id] = {};
  }
  $effect(() => () => (halt('mine'), halt('partner')));

  /** Close a villager's balloon (or both). */
  export function hush(id?: Id) {
    for (const i of id ? [id] : (['mine', 'partner'] as const)) {
      halt(i);
      shown[i] = null;
    }
  }

  /** `text` over `id`'s villager (`from`: its element) for SAY_MS; a newer one replaces it. */
  export async function say(id: Id, text: string, from: Element, o: { name: string; colour: string }) {
    halt(id);
    const n = ++seq;
    shown[id] = { n, text, name: o.name, colour: o.colour, x: 0, y: 0, tail: 0, side: 'top', placed: false, follow: false };
    speakers[id] = from;
    timers[id].end = setTimeout(() => shown[id]?.n === n && hush(id), SAY_MS);
    await tick();
    if (shown[id]?.n !== n) return;
    if (!at(id, n)) return hush(id);
    watch(id, n);
  }

  /** The camera is moving (a scroll): the balloons step aside until it settles, then stand by their speakers again. */
  let held = $state(false);
  export function hold(on: boolean) {
    if (on === held) return;
    held = on;
    if (!on) for (const id of ['mine', 'partner'] as const) if (shown[id]?.placed && !at(id, shown[id]!.n)) hush(id);
  }

  const boxOf = (r: DOMRect, pad = 0): Box => ({ x0: r.left - pad, x1: r.right + pad, y0: r.top - pad, y1: r.bottom + pad });

  /** Place `id`'s balloon by its speaker as it stands now; false when there's no room. */
  function at(id: Id, n: number): boolean {
    const s = shown[id], el = els[id], speaker = speakers[id];
    const st = scene?.querySelector('.stage')?.getBoundingClientRect();
    if (!scene || !st || !s || s.n !== n || !el || !speaker) return false;
    const w = el.offsetWidth, h = el.offsetHeight;
    const src = (seen[id] = speaker.getBoundingClientRect());
    // never over the speaker or its emote, nor over the other villager's balloon
    const other = els[id === 'mine' ? 'partner' : 'mine'], extra = [boxOf(src, 4)];
    const emote = speaker.querySelector('.emote')?.getBoundingClientRect();
    if (emote?.width) extra.push(boxOf(emote, 2));
    if (other && shown[id === 'mine' ? 'partner' : 'mine']?.placed) extra.push(boxOf(other.getBoundingClientRect(), 4));
    const p = placeBy(scene, w, h, boxOf(src), extra, layer);
    if (!p) return false;
    const vert = p.side === 'top' || p.side === 'bottom';
    const tail = vert
      ? Math.max(-w / 2 + TAIL_IN, Math.min(w / 2 - TAIL_IN, (src.left + src.right) / 2 - p.x))
      : Math.max(-h / 2 + TAIL_IN, Math.min(h / 2 - TAIL_IN, src.top + Math.min(24, src.height * 0.3) - p.y));
    Object.assign(s, { x: p.x - st.left, y: p.y - st.top, tail, side: p.side, placed: true });
    return true;
  }

  /** Follow the speaker while it shows (a move lasting 3 looks, as Talk's); close if the speaker goes. */
  function watch(id: Id, n: number) {
    let moved = 0;
    timers[id].watch = setInterval(() => {
      const s = shown[id], speaker = speakers[id];
      if (s?.n !== n || !speaker) return clearInterval(timers[id].watch);
      if (!speaker.isConnected) return hush(id);
      if (held) return;
      const r = speaker.getBoundingClientRect(), was = seen[id];
      if (!was || Math.abs(r.left - was.left) + Math.abs(r.top - was.top) < 8) return void (moved = 0);
      if (++moved < 3) return;
      s.follow = true;
      if (!at(id, n)) hush(id);
    }, 200);
  }
</script>

<div class="says" class:held bind:this={layer}>
  {#each ['mine', 'partner'] as const as id (id)}
    {@const s = shown[id]}
    {#if s}
      {#key s.n}
        <div class="say" class:placed={s.placed} class:follow={s.follow} data-fx="say" data-guard data-say={id} data-side={s.side} role="status" bind:this={els[id]}
          style:left="{s.x}px" style:top="{s.y}px" style:--tail="{s.tail}px" style:--tag={s.colour} style:--tag-ink={tagInk(s.colour)}>
          <b class="who">{s.name}</b>
          <span class="text">{s.text}</span>
        </div>
      {/key}
    {/if}
  {/each}
</div>

<style>
  .says { position: absolute; inset: 0; z-index: var(--z-taps); pointer-events: none; }
  .says.held { visibility: hidden; }
  /* Talk's balloon: cream, round, a soft lip, the name tag on its top-left edge, a tail to the speaker */
  .say {
    position: absolute; translate: -50% -50%; width: max-content; max-width: min(240px, calc(100vw - 24px));
    padding: 11px 16px 10px; border-radius: 22px; background: var(--c-cream, #FFF9E3); color: var(--c-ink, #4A3A2C);
    box-shadow: 0 3px 0 rgba(150, 110, 70, .28); font: 700 16px/1.45 var(--font-ui); text-align: center;
    overflow-wrap: anywhere; word-break: keep-all; animation: pop .22s cubic-bezier(.3, 1.4, .5, 1) both;
  }
  .say:not(.placed) { visibility: hidden; animation: none; }
  .say::after {
    content: ''; position: absolute; left: calc(50% + var(--tail) - 9px); bottom: -9px; width: 18px; height: 11px;
    background: inherit; clip-path: polygon(0 0, 100% 0, 50% 100%); filter: drop-shadow(0 2px 0 rgba(150, 110, 70, .2));
  }
  .say[data-side='bottom']::after { bottom: auto; top: -9px; clip-path: polygon(50% 0, 100% 100%, 0 100%); filter: none; }
  .say[data-side='left']::after, .say[data-side='right']::after { bottom: auto; top: calc(50% + var(--tail) - 9px); width: 11px; height: 18px; filter: none; }
  .say[data-side='left']::after { left: auto; right: -9px; clip-path: polygon(0 0, 100% 50%, 0 100%); }
  .say[data-side='right']::after { left: -9px; clip-path: polygon(100% 0, 0 50%, 100% 100%); }
  .say.follow { transition: left .2s linear, top .2s linear; }
  .who {
    position: absolute; left: 12px; top: -12px; padding: 2px 11px; border-radius: 999px; rotate: -4deg;
    background: var(--tag); color: var(--tag-ink); font: 700 12px/1.35 var(--font-ui); white-space: nowrap;
    box-shadow: 0 2px 0 rgba(120, 90, 60, .3), inset 0 0 0 1.5px rgba(120, 90, 60, .18);
  }
  .text { display: block; padding-top: 2px; }
  @keyframes pop { from { transform: scale(.6); opacity: 0; } }
</style>
