<script lang="ts">
  // The host しずえ (Isabelle), style guide v3 §7.5: the official render with our fan-art as fallback.
  //   <Juniper expression="cheer" size={96} />   pose follows the expression (and the season)
  //   <Juniper pose="bow" size={72} />            explicit pose
  //   <Juniper head size={44} />                  round head icon
  // Pose map: cheer / proud / happy → wave · surprised / sleepy → stand · Dec–Feb → winter.
  // `size` is the figure height (padded renders are cropped, so every pose lines up).
  import IsabelleArt from '#lib/villagers/IsabelleArt.svelte';
  import OfficialArt from './OfficialArt.svelte';
  import Emote from './Emote.svelte';
  import { EXPRESSION_EMOTE, type EmoteKind, type Expression } from '#lib/villagers/species.ts';
  import { hostArt, type HostPose } from '#lib/client/assets.ts';
  import { theme } from '#lib/client/theme.svelte.ts';

  interface Props {
    expression?: Expression;
    /** Overrides the expression → pose mapping. */
    pose?: HostPose;
    /** Height in px (or a CSS length). */
    size?: number | string;
    /** Head icon only. */
    head?: boolean;
    emote?: boolean | EmoteKind;
    emoteHold?: boolean;
    /** Gentle idle float (off under reduced motion). */
    animate?: boolean;
    replay?: number;
    label?: string;
    /** false = always the fan-art. */
    official?: boolean;
    eager?: boolean;
  }
  let {
    expression = 'happy', pose, size = 72, head = false, emote = false, emoteHold = false, animate = true,
    replay = 0, label, official = true, eager = false
  }: Props = $props();

  const resolved = $derived.by<HostPose>(() => {
    if (head) return 'icon';
    if (pose) return pose;
    if (theme.season === 'winter') return 'winter';
    return expression === 'surprised' || expression === 'sleepy' ? 'stand' : 'wave';
  });
  const h = $derived(typeof size === 'number' ? `${size}px` : size);
  const fbW = $derived(head ? h : `calc(${h} * 100 / 128)`);
  const emoteKind = $derived<EmoteKind | null>(
    emote === false ? null : emote === true ? (EXPRESSION_EMOTE[expression] ?? 'note') : emote
  );
</script>

<span
  class="juniper" style:--h={h}
  role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : 'true'}
>
  {#key replay}
    <span class="body" class:float={animate && !head}>
      <OfficialArt key={official ? hostArt(resolved) : null} size={h} {eager}>
        {#snippet fallback()}
          <svg class="fb" viewBox={head ? '6 -9 88 88' : '0 -10 100 128'} style:width={fbW} style:height={h}>
            <IsabelleArt {expression} {head} {animate} />
          </svg>
        {/snippet}
      </OfficialArt>
    </span>
    {#if emoteKind}
      <span class="emote"><Emote kind={emoteKind} size="100%" hold={emoteHold} {animate} /></span>
    {/if}
  {/key}
</span>

<style>
  .juniper { position: relative; display: inline-block; flex: none; line-height: 0; vertical-align: bottom; }
  .body { display: block; transform-origin: 50% 100%; }
  .body.float { animation: if-float 2800ms var(--ease-idle) infinite; }
  .fb { display: block; overflow: visible; }
  .emote { position: absolute; left: 58%; top: calc(var(--h) * -0.22); width: max(22px, calc(var(--h) * .3)); pointer-events: none; }
  @keyframes if-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-1.5%); } }
  @media (prefers-reduced-motion: reduce) { .body.float { animation: none; } }
</style>
