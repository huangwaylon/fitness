<script lang="ts">
  // 字幕's sheet (docs/english.md "The player"), from the controls' ⋯ beside the 字幕 chip: 字幕 オフ / 英語 / 日本語 (the
  // lesson's, as the chip), 字幕の大きさ 小 / 中 / 大 / 特大 (this phone's, 大 by default: YouTube's captions fontSize),
  // and for a clip with scenes, あらすじ (場面のあらすじ's line, this phone's). Each applies at once, the clip playing on.
  import Sheet from '#lib/components/ui/Sheet.svelte';
  import { CC_SIZES, type CcMode, type CcSize, type YtPlayer } from '../player.svelte.ts';
  import { setCcSize } from '../prefs.ts';
  import { s } from '../i18n.ts';

  interface Props {
    open: boolean;
    player: YtPlayer | undefined;
    /** The captions' mode chosen (counted as the chip's). */
    onmode: (m: CcMode) => void;
    /** あらすじ, for a clip with scenes. */
    scenes?: { on: boolean; toggle: () => void };
  }
  let { open = $bindable(), player, onmode, scenes }: Props = $props();
  const MODES: CcMode[] = ['off', 'en', 'ja'];
  const size = (n: CcSize) => {
    player?.setCcSize(n);
    setCcSize(n);
  };
</script>

<Sheet bind:open title={s('captions')} name="english-captions">
  <div class="cc" data-en-cc-sheet>
    <p class="sec-label" id="en-cc-mode">{s('ccLang')}</p>
    <div class="chips" role="radiogroup" aria-labelledby="en-cc-mode">
      {#each MODES as m (m)}
        <button type="button" class="chip big" role="radio" aria-checked={player?.captions === m} data-sfx="none" data-en-cc-mode={m} onclick={() => onmode(m)}>{s(`cc.${m}`)}</button>
      {/each}
    </div>
    <p class="sec-label" id="en-cc-size">{s('ccSize')}</p>
    <div class="chips" role="radiogroup" aria-labelledby="en-cc-size">
      {#each CC_SIZES as n, i (n)}
        <button type="button" class="chip big" role="radio" aria-checked={player?.ccSize === n} data-sfx="none" data-en-cc-size={n} onclick={() => size(n)}>{s(`ccSize.${i}` as 'ccSize.0')}</button>
      {/each}
    </div>
    {#if scenes}
      <button type="button" class="prow" role="switch" aria-checked={scenes.on} data-sfx="tick" data-en-scenes-toggle={scenes.on ? 'on' : 'off'} onclick={scenes.toggle}>
        <span class="prl">{s('scenes')}<small>{s('scenesSub')}</small></span><span class="sw" aria-hidden="true"><i></i></span>
      </button>
    {/if}
  </div>
</Sheet>

<style>
  .cc { display: grid; gap: 8px; padding-bottom: calc(var(--safe-bottom) + 8px); }
  .sec-label { margin: 4px 4px 0; }
  .chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .prow { margin-top: 8px; }
</style>
