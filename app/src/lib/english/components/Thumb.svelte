<script lang="ts">
  // A clip's thumbnail (docs/english.md "The page"): YouTube's own still, hotlinked from i.ytimg.com (CSP img-src; no
  // referrer, lazy), mqdefault (320×180) in a row, hqdefault (480×360, its letterbox cropped) on today's card. Offline,
  // failed, or YouTube's 120×90 stand-in for a removed video: a sunk paper tile with the show's name. A finished clip
  // gets the leaf ✓ disc in its corner; today's card the length on it.
  import type { Show } from '../catalog.ts';

  let { video, show, hero = false, done = false, len }: { video: string; show: Show; hero?: boolean; done?: boolean; len?: string } = $props();
  let failed = $state(false);
  const src = $derived(`https://i.ytimg.com/vi/${video}/${hero ? 'hqdefault' : 'mqdefault'}.jpg`);
</script>

<span class="thumb" class:hero data-en-thumb={failed ? 'none' : 'img'}>
  {#if failed}
    <span class="ph" lang="en">{show}</span>
  {:else}
    <img {src} alt="" loading={hero ? 'eager' : 'lazy'} decoding="async" referrerpolicy="no-referrer"
      onerror={() => (failed = true)} onload={(e) => (failed = (e.currentTarget as HTMLImageElement).naturalWidth === 120)} />
  {/if}
  {#if len}<span class="len">{len}</span>{/if}
  {#if done}<span class="done" aria-hidden="true">✓</span>{/if}
</span>

<style>
  .thumb { position: relative; flex: none; display: block; width: 80px; aspect-ratio: 16 / 9; border-radius: var(--r-row); overflow: hidden; background: var(--ctl-off); }
  .thumb.hero { width: 100%; }
  img { display: block; width: 100%; height: 100%; object-fit: cover; }
  .ph { position: absolute; inset: 0; display: grid; place-items: center; padding: 2px; text-align: center; font: 700 11px/1.1 var(--font-ui); color: var(--text-soft); }
  .hero .ph { font-size: var(--fs-s); }
  .len { position: absolute; right: 6px; bottom: 6px; padding: 1px 6px; border-radius: var(--r-pill); background: color-mix(in srgb, var(--c-ink) 70%, transparent); color: var(--c-card);
    font: 600 var(--fs-s)/1.3 var(--font-num); font-variant-numeric: tabular-nums; }
  .done { position: absolute; right: 3px; bottom: 3px; display: grid; place-items: center; width: 18px; height: 18px; border-radius: 50%; background: var(--c-leaf); color: var(--c-ink);
    font: 700 11px/1 var(--font-ui); box-shadow: inset 0 0 0 1.5px var(--c-leaf-edge); }
</style>
