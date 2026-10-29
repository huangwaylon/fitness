<script lang="ts">
  // The host しずえ (Isabelle), design.md §M.6: the official render by pose, a generic silhouette
  // as fallback, plus her motion: idle bob, a bounce while her line is typing (`talking`), and the
  // beats the stage director plays (greeting hop, bow, head-shake, pose swaps with a 160 ms
  // crossfade, a reaction bubble at her top-right, sparkles / notes / sweat).
  //   <Host size={96} />                      waving (default)
  //   <Host pose="bow" size={72} talking />   explicit pose, bouncing while text types
  //   <Host head size={44} />                 round head icon (static)
  // A full-body Host with `animate` claims the director's しずえ, so island idle life and reactions
  // (check-in saved, sync error, harvest…) can reach her. Only the most recently mounted live Host is
  // driven (e.g. the harvest overlay's over the island's); the others just float. Call `hostTap()`
  // from motion/director when she is tapped with nothing left to read.
  // Winter (snow season): the full-body cardigan replaces every pose. Night 22–05: slow breathing.
  // 'bow' (N2): NH has no bow render, so it shows the stand render (same outfit) and plays a CSS bow
  // each time the pose becomes 'bow'.
  import { onMount, untrack } from 'svelte';
  import OfficialArt from './OfficialArt.svelte';
  import Silhouette from './Silhouette.svelte';
  import Emote from './Emote.svelte';
  import Fx from './Fx.svelte';
  import { artUrl, hostArt, type HostPose } from '#lib/art.ts';
  import { theme } from '#lib/ui-state/theme.svelte.ts';
  import { actors, claimHost, hostOwner, removeFx } from '../motion/director.svelte.ts';
  import { now } from '../../time/clock.ts';

  interface Props {
    pose?: Exclude<HostPose, 'icon' | 'winter'>;
    /** Height in px (or a CSS length). */
    size?: number | string;
    /** Head icon only. */
    head?: boolean;
    /** Idle bob + director beats (off under reduced motion). */
    animate?: boolean;
    /** Her line is typing (letter reveal running): small talking bounce. */
    talking?: boolean;
    eager?: boolean;
  }
  let { pose = 'wave', size = 72, head = false, animate = true, talking = false, eager = false }: Props = $props();

  const live = $derived(animate && !head);
  const st = actors.host;
  let claim = $state(0);
  /** This instance renders the director's state (pose override, motions, emote, fx). */
  const driven = $derived(live && claim !== 0 && hostOwner.id === claim);
  const wanted = $derived<Exclude<HostPose, 'icon' | 'winter'>>((driven && st.pose) || pose);
  const resolve = (p: HostPose): HostPose => (head ? 'icon' : theme.season === 'winter' ? 'winter' : p);
  const h = $derived(typeof size === 'number' ? `${size}px` : size);
  // asleep-ish by the scene clock (the island naps 22–05), not by the chrome palette
  const night = $derived.by(() => {
    void theme.tod; // re-check when the minute clock ticks
    const hr = now().getHours();
    return hr >= 22 || hr < 5;
  });

  // Crossfade: keep the shown pose until the next one is decoded, then fade (opacity only).
  // svelte-ignore state_referenced_locally
  let shown = $state<HostPose>(resolve(pose));
  let prev = $state<HostPose | null>(null);
  // A→B→A within one decode must end on A: each run gets an `alive` token that the next run (or
  // unmount) revokes, and the clear-prev timer is cancelled with it.
  $effect(() => {
    const next = resolve(wanted);
    if (next === untrack(() => shown)) return;
    let alive = true;
    let t: ReturnType<typeof setTimeout> | null = null;
    const swap = () => {
      if (!alive) return;
      prev = untrack(() => shown);
      shown = next;
      t = setTimeout(() => (prev = null), 180);
    };
    const url = artUrl(hostArt(next));
    if (!url || typeof Image === 'undefined') swap();
    else {
      const img = new Image();
      img.src = url;
      img.decode().then(swap, swap);
    }
    return () => {
      alive = false;
      if (t) clearTimeout(t);
    };
  });

  onMount(() => {
    if (!live) return;
    const c = claimHost();
    claim = c.id;
    return () => {
      claim = 0;
      c.release();
    };
  });

  let bodyEl = $state<HTMLElement | null>(null);
  function act(m: string | null) {
    if (!bodyEl) return;
    bodyEl.removeAttribute('data-act');
    if (m) {
      void bodyEl.offsetWidth;
      bodyEl.setAttribute('data-act', m);
    }
  }
  $effect(() => {
    const m = driven ? st.motion : null;
    void st.motionN;
    if (bodyEl) untrack(() => act(m));
  });
  // The bow pose bows (once per change to 'bow'), unless a director motion is already playing.
  $effect(() => {
    if (live && bodyEl && wanted === 'bow' && !untrack(() => driven && st.motion)) untrack(() => act('bow'));
  });
</script>

<span class="host" style:--h={h} aria-hidden="true">
  <span bind:this={bodyEl} class="body" class:float={live && !talking && !night} class:talk={live && talking} class:sleep={live && night && !talking}>
    {#if prev}
      <span class="layer out"><OfficialArt key={hostArt(prev)} size={h} /></span>
    {/if}
    {#key shown}
      <span class="layer" class:in={!!prev}>
        <OfficialArt key={hostArt(shown)} size={h} {eager}>
          {#snippet fallback()}<Silhouette height={h} {head} />{/snippet}
        </OfficialArt>
      </span>
    {/key}
  </span>
  {#if driven && st.emote}
    <span class="emote">{#key st.emoteN}<Emote id={st.emote} size="48px" hold={st.emoteHold} tail="left" />{/key}</span>
  {/if}
  {#if driven}
    {#each st.fx as f (f.n)}
      <span class="fxa {f.kind}"><Fx kind={f.kind} dir={1} spread="calc(var(--h) * .5)" ondone={() => removeFx('host', f.n)} /></span>
    {/each}
  {/if}
</span>

<style>
  .host { position: relative; display: inline-block; flex: none; line-height: 0; vertical-align: bottom; }
  .body { display: grid; transform-origin: 50% 100%; }
  .layer { grid-area: 1 / 1; display: flex; justify-content: center; align-items: flex-end; }
  .layer.in { animation: fade-in 160ms linear both; }
  .layer.out { animation: fade-out 160ms linear both; }
  @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
  @keyframes fade-out { from { opacity: 1; } to { opacity: 0; } }
  .body.float { animation: if-bob-soft 2800ms var(--ease-idle) infinite; }
  .body.talk { animation: if-talk 260ms ease-in-out infinite; }
  .body.sleep { animation: if-breath-slow 4000ms var(--ease-idle) infinite; }
  .body:global([data-act='hop']) { animation: if-hop-small 600ms var(--ease-soft) both; }
  .body:global([data-act='wiggle']) { animation: if-wiggle 700ms ease-in-out both; }
  .body:global([data-act='bow']) { animation: if-bow 1100ms var(--ease-soft) both; }
  .body:global([data-act='headshake']) { animation: if-headshake 600ms ease-in-out both; }
  .emote { position: absolute; z-index: 2; left: 62%; bottom: 84%; pointer-events: none; line-height: 0; }
  .fxa { position: absolute; left: 50%; top: 6%; width: 0; height: 0; }
  .fxa.sweat { left: 70%; top: 20%; }
  .fxa.notes { left: 72%; }
  @media (prefers-reduced-motion: reduce) {
    .body.float, .body.talk, .body.sleep, .body:global([data-act]), .layer.in, .layer.out { animation: none; }
    .layer.out { opacity: 0; }
  }
</style>
