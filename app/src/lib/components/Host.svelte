<script lang="ts">
  // The host しずえ (Isabelle), style guide v3 §7.5: the official render by pose, a generic silhouette as fallback.
  //   <Host size={96} />            waving (default)
  //   <Host pose="bow" size={72} />  explicit pose
  //   <Host head size={44} />        round head icon
  // Dec–Feb (U5): the winter outfit replaces every pose, so she never wears summer clothes in snow.
  // `size` is the figure height (padded renders are cropped, so every pose lines up).
  import OfficialArt from './OfficialArt.svelte';
  import Silhouette from './Silhouette.svelte';
  import { hostArt, type HostPose } from '#lib/client/assets.ts';
  import { theme } from '#lib/client/theme.svelte.ts';

  interface Props {
    pose?: Exclude<HostPose, 'icon' | 'winter'>;
    /** Height in px (or a CSS length). */
    size?: number | string;
    /** Head icon only. */
    head?: boolean;
    /** Gentle idle float (off under reduced motion). */
    animate?: boolean;
    eager?: boolean;
  }
  let { pose = 'wave', size = 72, head = false, animate = true, eager = false }: Props = $props();

  const resolved = $derived<HostPose>(head ? 'icon' : theme.season === 'winter' ? 'winter' : pose);
  const h = $derived(typeof size === 'number' ? `${size}px` : size);
</script>

<span class="host" aria-hidden="true">
  <span class="body" class:float={animate && !head}>
    <OfficialArt key={hostArt(resolved)} size={h} {eager}>
      {#snippet fallback()}<Silhouette height={h} {head} />{/snippet}
    </OfficialArt>
  </span>
</span>

<style>
  .host { position: relative; display: inline-block; flex: none; line-height: 0; vertical-align: bottom; }
  .body { display: block; transform-origin: 50% 100%; }
  .body.float { animation: if-float 2800ms var(--ease-idle) infinite; }
  @keyframes if-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-1.5%); } }
  @media (prefers-reduced-motion: reduce) { .body.float { animation: none; } }
</style>
