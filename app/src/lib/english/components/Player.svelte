<script lang="ts">
  // The clip's player (docs/english.md "The player"): YouTube's youtube-nocookie embed at 16:9, pinned over the lesson,
  // driven by player.svelte.ts. Its own referrer policy (the site sends no-referrer, which the embed refuses), inline
  // on iOS. Offline: a note in its place, the embed once back online. Unavailable (an error, no answer): a note, a link
  // to the video on YouTube and もう一度読み込む. A play that doesn't start: the tap-the-video hint under it. Edge to edge
  // (393 pt wide on an iPhone 15, ~1,179 device px: YouTube picks its quality by the frame's size); the quality it plays
  // counted once a play (the log's `use`: act:english.q.<quality>), and so is how 字幕 日本語 went
  // (act:english.ccja.<track | tr | offer | none | silent>: player.svelte.ts jaOutcome).
  import { onDestroy } from 'svelte';
  import { YtPlayer, embedUrl } from '../player.svelte.ts';
  import { s } from '../i18n.ts';
  import { count } from '#lib/sync/log.ts';
  import { ccSizeOf } from '../prefs.ts';

  let { video, title, player = $bindable() }: { video: string; title: string; player?: YtPlayer } = $props();

  let online = $state(typeof navigator === 'undefined' || navigator.onLine !== false);
  let frame: HTMLIFrameElement | undefined = $state();
  const src = $derived(embedUrl(video, location.origin));

  $effect(() => {
    const on = () => (online = true), off = () => (online = false);
    addEventListener('online', on);
    addEventListener('offline', off);
    return () => (removeEventListener('online', on), removeEventListener('offline', off));
  });
  // the player once the frame is in (offline at first: from when it comes)
  $effect(() => {
    if (!frame || player) return;
    player = new YtPlayer(frame, (q) => count(`act:english.q.${q}`), (r) => count(`act:english.ccja.${r}`));
    player.ccSize = ccSizeOf();
  });
  onDestroy(() => player?.destroy());
  const ps = $derived(player?.state ?? 'loading');
</script>

<div class="player" data-yt-state={online || player ? ps : 'offline'} data-yt-time={player?.time ?? 0}>
  <div class="frame">
    {#if online || player}
      <iframe bind:this={frame} {src} {title} referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture" data-yt-frame></iframe>
    {/if}
    {#if !online && !player}
      <p class="note" data-yt-offline>{s('offline')}</p>
    {:else if ps === 'error'}
      <div class="note" data-yt-unavailable={player?.error ?? 'none'}>
        <p>{s('unavailable')}</p>
        <a class="btn small paper" href="https://www.youtube.com/watch?v={video}" target="_blank" rel="noopener noreferrer" data-sfx="tick">{s('openYoutube')}</a>
        <button type="button" class="btn small paper" data-sfx="tick" data-yt-retry onclick={() => player?.reload(src)}>{s('retry')}</button>
      </div>
    {/if}
  </div>
  {#if player?.stuck}<p class="hint" data-yt-stuck>{s('noStart')}</p>{/if}
</div>

<style>
  .player { flex: none; }
  .frame { position: relative; aspect-ratio: 16 / 9; overflow: hidden; background: #000; }
  iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
  .note { position: absolute; inset: 0; margin: 0; display: grid; place-content: center; justify-items: center; gap: 8px; padding: 16px; text-align: center;
    background: var(--c-sunk); color: var(--text); font-size: var(--fs-s); }
  .note p { margin: 0; }
  .note .btn { margin: 0; }
  .hint { margin: 6px calc(16px + var(--safe-right)) 0 calc(16px + var(--safe-left)); font-size: var(--fs-s); color: var(--text-soft); }
</style>
