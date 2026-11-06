<script lang="ts">
  // A music player's song list (tent/stereo.ts; docs/design.md "The tent: stereos"), NH's: おまかせ (any song but the
  // last one), or one of K.K.'s songs by name; ✕ or a tap outside closes it. `onpick` gets it: the room's stage plays
  // it as its aircheck for everyone (TentRoom playStereo: stage.svelte.ts request).
  import { t } from '#lib/i18n/index.ts';
  import { kkPick, kkTitle, loadKK, type KKTrack } from '#lib/sound/kk.ts';
  import { dropPrefetched, prefetchKK } from '#lib/sound/sound.svelte.ts';

  let { last = null, onpick, onclose }: { last?: string | null; onpick: (song: KKTrack) => void; onclose: () => void } = $props();
  /** The songs (kk.ts: their own chunk, loaded as the list opens; null until then). */
  let kkTracks = $state.raw<readonly KKTrack[] | null>(null);
  $effect(() => void loadKK().then((l) => (kkTracks = l.tracks)));
  // closed: the songs pressed and not picked let go of (the picked one is the track's by then)
  $effect(() => () => dropPrefetched());
  function surprise() {
    const s = kkPick(Math.random, last, kkTracks ?? []);
    if (s) onpick(s);
  }
  /** A press on a song: its aircheck fetched as it's let go of without scrolling the list (a scroll's press, on iOS
   *  a pointercancel, fetches nothing: on each pointerdown a scroll of the list had fetched dozens of songs). */
  let press: { id: number; x: number; y: number } | null = null;
  const down = (e: PointerEvent) => void (press = { id: e.pointerId, x: e.clientX, y: e.clientY });
  function moved(e: PointerEvent) {
    if (press?.id === e.pointerId && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 8) press = null;
  }
  function up(e: PointerEvent, s: KKTrack) {
    if (press?.id === e.pointerId) prefetchKK(s.id, 'aircheck');
    press = null;
  }
</script>

<!-- (a press outside closes it: on the press, not the click, so the tap that opened it never closes it too) -->
<div class="scrim" aria-hidden="true" onpointerdown={onclose}></div>
<div class="picker" role="dialog" aria-label={t('tent.stereo.title')} data-stereo-picker>
  <p class="title">{t('tent.stereo.title')}</p>
  {#if kkTracks?.length}
    <button type="button" class="song any" data-sfx="confirm" data-song="any" onclick={surprise}>{t('tent.stereo.any')}</button>
    <ul>
      {#each kkTracks as s (s.id)}
        <!-- (its aircheck fetched as the press lets go, not scrolled: the click that picks it then starts it sooner) -->
        <li><button type="button" class="song" class:last={s.id === last} data-sfx="confirm" data-song={s.id} onpointerdown={down} onpointermove={moved} onpointercancel={() => (press = null)} onpointerup={(e) => up(e, s)} onclick={() => onpick(s)}>{kkTitle(s)}</button></li>
      {/each}
    </ul>
  {:else if kkTracks}
    <p class="none">{t('tent.stereo.none')}</p>
  {/if}
  <button type="button" class="close" data-sfx="back" aria-label={t('tent.stereo.close')} onclick={onclose}>✕</button>
</div>

<style>
  .scrim { position: absolute; inset: 0; z-index: 4; }
  .picker {
    position: absolute; z-index: 5; left: 50%; bottom: calc(var(--safe-bottom, 0px) + 14px); translate: -50% 0; width: min(320px, calc(100% - 24px));
    max-height: min(60vh, 420px); display: flex; flex-direction: column; gap: 6px; padding: 14px 12px 12px; border-radius: 22px;
    background: var(--c-cream); color: var(--c-ink); box-shadow: var(--sh-obj);
  }
  .title { margin: 0 32px 2px 6px; font-weight: 800; }
  .none { margin: 4px 6px; }
  ul { list-style: none; margin: 0; padding: 0; overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; }
  .song {
    display: block; width: 100%; min-height: 44px; padding: 8px 12px; border: 0; border-radius: 12px; background: none; color: inherit;
    font: inherit; text-align: left; -webkit-tap-highlight-color: transparent;
  }
  .song:active, .song:focus-visible { background: var(--c-card); }
  .song.any { font-weight: 800; background: var(--c-card); }
  .song.last { opacity: .7; }
  .close {
    position: absolute; top: 6px; right: 6px; width: 44px; height: 44px; border: 0; border-radius: 50%; background: none; color: inherit;
    font: inherit; font-size: 18px; -webkit-tap-highlight-color: transparent;
  }
</style>
