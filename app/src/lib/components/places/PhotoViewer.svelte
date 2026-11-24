<script lang="ts">
  // A place's photos full screen (PlacePhotos' tap): a modal <dialog> (over the places sheet; Esc closes), the light
  // paper (no dark chrome), 「3 / 10」 and ✕ on top, the photos a full-width scroll-snap row opened at the tapped one,
  // a swipe through them all. The card's own URLs (already in the cache: nothing new to fetch for the one tapped);
  // the shown one and the next load (places/photoStrip.ts), as far as the card had. Closing hands back the shown one
  // (the card's strip goes there).
  import { untrack } from 'svelte';
  import { photoOf, photosOf } from '#lib/places/strings.ts';
  import { reachOf, shownOf } from '#lib/places/photoStrip.ts';
  import { i18n } from '#lib/i18n/index.ts';
  import { lockScroll } from '../ui/scrollLock.ts';
  import NavButton from '../ui/NavButton.svelte';

  interface Props {
    urls: string[];
    /** The place's name (the dialog's and each photo's). */
    name: string;
    /** The tapped photo. */
    start: number;
    /** The last photo the card loaded. */
    reach: number;
    onclose: (shown: number) => void;
  }
  let { urls, name, start, reach: cardReach, onclose }: Props = $props();
  const L = $derived(i18n.locale);
  const n = $derived(urls.length);

  let dlg: HTMLDialogElement | undefined = $state();
  let pages: HTMLElement | undefined = $state();
  // (the props as opened: the viewer is made again on each opening)
  const s0 = untrack(() => start);
  let at = $state(s0);
  let reach = $state(untrack(() => Math.max(cardReach, Math.min(urls.length - 1, s0 + 1))));
  let bad = $state<readonly number[]>([]);

  $effect(() => {
    if (!dlg || !pages) return;
    dlg.showModal();
    pages.scrollLeft = s0 * pages.clientWidth;
    return lockScroll();
  });
  function look() {
    const w = pages?.clientWidth;
    if (!pages || !w) return;
    at = shownOf(pages.scrollLeft, w, n);
    reach = Math.max(reach, reachOf(pages.scrollLeft, w, w, n, true));
  }
  const close = () => onclose(at);
</script>

<dialog bind:this={dlg} class="viewer" aria-label={photosOf(name, L)} data-photo-viewer
  oncancel={(e) => (e.preventDefault(), close())}>
  <div class="bar">
    <span class="count" aria-live="polite" data-photo-count>{at + 1} / {n}</span>
    <NavButton kind="close" onclick={close} data-photo-close />
  </div>
  <div class="pages" bind:this={pages} onscroll={look}>
    {#each urls as u, i (u)}
      <div class="page" data-photo-page={i}>
        {#if bad.includes(i)}
          <div class="miss" role="img" aria-label={photoOf(name, i, n, L)}></div>
        {:else if i <= reach}
          <img src={u} alt={photoOf(name, i, n, L)} crossorigin="anonymous" referrerpolicy="no-referrer" decoding="async"
            onerror={() => (bad = [...bad, i])} />
        {/if}
      </div>
    {/each}
  </div>
</dialog>

<style>
  .viewer {
    width: 100vw; height: 100dvh; max-width: none; max-height: none; margin: 0; padding: 0; border: 0;
    display: flex; flex-direction: column; background: var(--c-paper); color: var(--text);
  }
  .viewer:not([open]) { display: none; }
  .viewer::backdrop { background: var(--c-paper); }
  .bar {
    flex: none; display: grid; grid-template-columns: var(--hit) 1fr var(--hit); align-items: center;
    padding: var(--ui-top) calc(6px + var(--safe-right)) 0 calc(6px + var(--safe-left));
  }
  .count { grid-column: 2; text-align: center; font: 700 var(--fs-body)/1 var(--font-ui); font-variant-numeric: tabular-nums; color: var(--text-soft); }
  .bar :global(.nav) { grid-column: 3; }
  .pages {
    flex: 1; min-height: 0; display: flex; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none;
    overscroll-behavior: contain; padding-bottom: var(--safe-bottom, 0px);
  }
  .pages::-webkit-scrollbar { display: none; }
  .page { flex: none; width: 100%; height: 100%; display: grid; place-items: center; scroll-snap-align: center; scroll-snap-stop: always; }
  .page img { width: 100%; height: auto; max-height: 100%; aspect-ratio: 600 / 338; object-fit: contain; background: var(--ctl-off); }
  .miss { width: 100%; aspect-ratio: 600 / 338; background: var(--ctl-off); }
</style>
