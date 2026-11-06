<script lang="ts">
  // A photo band (docs/design.md "Unified kit"): a photo across the sheet, `height` px (a trip's hero 150, a trail's
  // card 120), a soft dark gradient at its foot for the words over it (`children`), and `nav` laid over its top (a
  // NavBar size="s" over). The wedding banner keeps its own markup on this frame.
  //   <PhotoBand src={trip.photo} height={150}>{#snippet nav()}<NavBar over … />{/snippet}<h2>{trip.title}</h2></PhotoBand>
  import type { Snippet } from 'svelte';

  interface Props {
    src: string;
    height?: number;
    /** The photo's description; '' for a decorative one (the words over it say what it is). */
    alt?: string;
    /** object-position (the subject of a photo that crops). */
    focus?: string;
    /** At the sheet's top edge (a hero): the band grows by the safe area, `nav` under it, the photo loads at once. */
    edge?: boolean;
    nav?: Snippet;
    children?: Snippet;
  }
  let { src, height = 150, alt = '', focus = 'center', edge = false, nav, children }: Props = $props();
</script>

<div class="band" class:edge style:--h="{height}px">
  <img {src} {alt} loading={edge ? 'eager' : 'lazy'} decoding="async" style:object-position={focus} />
  {#if nav}<div class="nav">{@render nav()}</div>{/if}
  {#if children}<div class="foot">{@render children()}</div>{/if}
</div>

<style>
  .band { position: relative; flex: none; height: var(--h); overflow: hidden; background: var(--ctl-off); color: #fff; }
  .band.edge { height: calc(var(--h) + var(--ui-top)); }
  img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .nav { position: absolute; top: 0; left: 0; right: 0; padding: 0 calc(4px + var(--safe-right)) 0 calc(4px + var(--safe-left)); }
  .edge .nav { padding-top: var(--ui-top); }
  .foot {
    position: absolute; left: 0; right: 0; bottom: 0; padding: 28px 12px 10px;
    background: linear-gradient(transparent, rgb(30 24 18 / .55)); text-shadow: 0 1px 2px rgb(30 24 18 / .4);
  }
</style>
