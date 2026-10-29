<script lang="ts">
  // The host しずえ (Isabelle), style guide v4 §M.6: the official render by pose, a generic silhouette
  // as fallback, plus her motion: idle bob, a bounce while her line is typing (`talking`), and the
  // beats the stage director plays (greeting hop, bow, head-shake, pose swaps with a 160 ms
  // crossfade, a reaction bubble at her top-right, sparkles / notes / sweat).
  //   <Host size={96} />                      waving (default)
  //   <Host pose="bow" size={72} talking />   explicit pose, bouncing while text types
  //   <Host head size={44} />                 round head icon (static)
  // A full-body Host with `animate` registers itself with the director, so island idle life and
  // reactions (check-in saved, sync error, harvest…) can reach her. Call `hostTap()` from
  // motion/director when she is tapped with nothing left to read.
  // Dec–Feb: the winter outfit replaces every pose. Night 22–05: slow breathing.
  import { onMount } from 'svelte';
  import OfficialArt from './OfficialArt.svelte';
  import Silhouette from './Silhouette.svelte';
  import Emote from './Emote.svelte';
  import Fx from './Fx.svelte';
  import { artUrl, hostArt, type HostPose } from '#lib/client/assets.ts';
  import { theme } from '#lib/client/theme.svelte.ts';
  import { actors, removeFx } from './motion/director.svelte.ts';
  import { now } from './motion/clock.ts';

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
  const wanted = $derived<Exclude<HostPose, 'icon' | 'winter'>>((live && st.pose) || pose);
  const resolve = (p: HostPose): HostPose => (head ? 'icon' : theme.season === 'winter' ? 'winter' : p);
  const h = $derived(typeof size === 'number' ? `${size}px` : size);
  const night = $derived.by(() => {
    const hr = now().getHours();
    return theme.night && (hr >= 22 || hr < 5);
  });

  // Crossfade: keep the shown pose until the next one is decoded, then fade (opacity only).
  // svelte-ignore state_referenced_locally
  let shown = $state<HostPose>(resolve(pose));
  let prev = $state<HostPose | null>(null);
  $effect(() => {
    const next = resolve(wanted);
    if (next === shown) return;
    const url = artUrl(hostArt(next));
    const swap = () => {
      prev = shown;
      shown = next;
      setTimeout(() => (prev = null), 180);
    };
    if (!url || typeof Image === 'undefined') return swap();
    const img = new Image();
    img.src = url;
    img.decode().then(swap, swap);
  });

  onMount(() => {
    if (!live) return;
    st.present = true;
    return () => {
      st.present = false;
    };
  });

  let bodyEl = $state<HTMLElement | null>(null);
  $effect(() => {
    const m = live ? st.motion : null;
    void st.motionN;
    if (!bodyEl) return;
    bodyEl.removeAttribute('data-act');
    if (m) {
      void bodyEl.offsetWidth;
      bodyEl.setAttribute('data-act', m);
    }
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
  {#if live && st.emote}
    <span class="emote">{#key st.emoteN}<Emote id={st.emote} size="40px" hold={st.emoteHold} tail="left" />{/key}</span>
  {/if}
  {#if live}
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
