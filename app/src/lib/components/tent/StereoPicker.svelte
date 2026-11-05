<script lang="ts">
  // A music player's song list (tent/stereo.ts; docs/design.md "The tent: stereos"), NH's: おまかせ (any song but the
  // last one), or one of K.K.'s songs by name; ✕ or a tap outside closes it. The song plays as its aircheck
  // (sound.svelte.ts playKK(id, 'aircheck')): `onpick` gets it.
  import { i18n, t } from '#lib/i18n/index.ts';
  import { kkPick, kkTracks, type KKTrack } from '#lib/sound/kk.ts';

  let { last = null, onpick, onclose }: { last?: string | null; onpick: (song: KKTrack) => void; onclose: () => void } = $props();
  const titleOf = (s: KKTrack) => (i18n.locale === 'en' ? s.en : s.ja);
  function surprise() {
    const s = kkPick(Math.random, last);
    if (s) onpick(s);
  }
</script>

<!-- (a press outside closes it: on the press, not the click, so the tap that opened it never closes it too) -->
<div class="scrim" aria-hidden="true" onpointerdown={onclose}></div>
<div class="picker" role="dialog" aria-label={t('tent.stereo.title')} data-stereo-picker>
  <p class="title">{t('tent.stereo.title')}</p>
  {#if kkTracks.length}
    <button type="button" class="song any" data-sfx="confirm" data-song="any" onclick={surprise}>{t('tent.stereo.any')}</button>
    <ul>
      {#each kkTracks as s (s.id)}
        <li><button type="button" class="song" class:last={s.id === last} data-sfx="confirm" data-song={s.id} onclick={() => onpick(s)}>{titleOf(s)}</button></li>
      {/each}
    </ul>
  {:else}
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
