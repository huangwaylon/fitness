<script lang="ts">
  // The app's state screens (docs/design.md): one figure, one line, one action. Tom Nook over what's wrong (not set
  // up, the week's load error: routes/AppShell.svelte; a route's error or an unknown URL: +error.svelte), or the host
  // hopping while the week loads (`busy`); the page under it is tan unless busy (the layout's). A bilingual h1 puts
  // its English in a <small>. Busy draws nothing (the bare sea) for BUSY_AFTER_MS: a launch reads the week from the
  // phone's cache in ~250 ms (perf.boot `data` p50, p95 ~610), and しずえ shown for that long was a flash before the
  // island (review 11-24 T8); a real wait (the first launch's fetch, a slow phone) still gets her.
  //   <NookScreen><h1>…</h1><button class="btn">…</button></NookScreen>
  import type { Snippet } from 'svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import Host from '../characters/Host.svelte';

  /** A busy screen's figure and line only after this long (ms): a shorter wait is the sea, then the island. */
  const BUSY_AFTER_MS = 1500;

  let { busy = false, children }: { busy?: boolean; children: Snippet } = $props();
  let late = $state(false);
  $effect(() => {
    if (!busy) return;
    const id = setTimeout(() => (late = true), BUSY_AFTER_MS);
    return () => clearTimeout(id);
  });
</script>

<main class="nook-screen sheet-copy" aria-busy={busy || undefined}>
  {#if busy && !late}
    <!-- (nothing yet: the sea under it) -->
  {:else if busy}
    <span class="bob"><Host size={96} animate={false} eager /></span>
  {:else}
    <span class="nook"><OfficialArt key="host/tom-nook" alt="" size="var(--nook-h)" eager>
      {#snippet fallback()}<Host pose="stand" size={96} />{/snippet}
    </OfficialArt></span>
  {/if}
  {#if !busy || late}{@render children()}{/if}
</main>

<style>
  .nook-screen {
    --nook-h: 120px;
    max-width: 380px; margin: 0 auto;
    min-height: var(--vh-page); display: grid; place-content: center stretch; justify-items: center; gap: 16px; text-align: center;
    padding: calc(var(--ui-top) + 24px) calc(var(--side) + var(--safe-right) + 6px) calc(var(--pad-bottom) + 24px) calc(var(--side) + var(--safe-left) + 6px);
  }
  .nook { line-height: 0; }
  .nook-screen :global(.talk), .nook-screen :global(.btn) { width: 100%; }
  .nook-screen :global(h1) { display: grid; gap: 4px; text-wrap: balance; }
  .nook-screen :global(h1 small) { font-size: var(--fs-body); color: var(--text-soft); }
  .nook-screen :global(p) { margin: 0; font-size: var(--fs-talk); font-weight: 700; color: var(--text-soft); text-wrap: balance; }
  .bob { display: block; transform-origin: 50% 100%; animation: if-hop 1.1s var(--ease-idle) infinite; }
  @media (max-height: 700px), (max-width: 359px) { .nook-screen { --nook-h: 96px; gap: 12px; } }
</style>
