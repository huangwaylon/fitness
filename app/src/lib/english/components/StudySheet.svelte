<script lang="ts">
  // ツール (docs/english.md "The page"): the lesson bar's one labelled button opens it. 字幕 オフ / 英語 / 日本語 (the
  // lesson's, as the chip), 字幕の大きさ 小 / 中 / 大 / 特大 (this phone's, 大 by default: YouTube's captions fontSize) and,
  // for a clip with scenes, the あらすじ switch (this phone's); then the ways into the clip's words: 場面のあらすじ一覧,
  // セリフ (a bank with lines only) and この動画のフレーズ (it shows the answers, and says so); then ⚑ この動画を報告 and the
  // credit. Each setting applies at once, the clip playing on; a row closes the sheet and opens its own.
  import Sheet from '#lib/components/ui/Sheet.svelte';
  import Icon from '#lib/components/ui/Icon.svelte';
  import { CC_SIZES, type CcMode, type CcSize, type YtPlayer } from '../player.svelte.ts';
  import { setCcSize } from '../prefs.ts';
  import { s } from '../i18n.ts';

  type ToolGo = 'scenes' | 'lines' | 'phrases' | 'flag';
  interface Props {
    open: boolean;
    player: YtPlayer | undefined;
    /** The captions' mode chosen (counted as the chip's). */
    onmode: (m: CcMode) => void;
    /** あらすじ, for a clip with scenes. */
    scenes?: { on: boolean; toggle: () => void };
    /** The bank has transcript lines (セリフ's row). */
    lines: boolean;
    /** A row tapped (the sheet closed first). */
    ongo: (to: ToolGo) => void;
    credit: string;
  }
  let { open = $bindable(), player, onmode, scenes, lines, ongo, credit }: Props = $props();
  const MODES: CcMode[] = ['off', 'en', 'ja'];
  const size = (n: CcSize) => {
    player?.setCcSize(n);
    setCcSize(n);
  };
  const go = (to: ToolGo) => ((open = false), ongo(to));
</script>

<Sheet bind:open title={s('toolsTitle')} name="english-tools">
  <div class="tools" data-en-tools-sheet>
    <p class="sec-label" id="en-cc-mode">{s('captions')}</p>
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
        <span class="prl">{s('scenesTitle')}<small>{s('scenesSub')}</small></span><span class="sw" aria-hidden="true"><i></i></span>
      </button>
    {/if}
    <div class="prows">
      {#if scenes}
        <button type="button" class="prow" data-sfx="open" data-en-tools-scenes onclick={() => go('scenes')}><span class="prl">{s('sceneList')}</span><Icon name="chevron-right" size={18} /></button>
      {/if}
      {#if lines}
        <button type="button" class="prow" data-sfx="open" data-en-transcript-open onclick={() => go('lines')}><span class="prl">{s('transcriptAll')}</span><Icon name="chevron-right" size={18} /></button>
      {/if}
      <button type="button" class="prow" data-sfx="open" data-en-phrases-open onclick={() => go('phrases')}>
        <span class="prl">{s('phrases')}<small>{s('phrasesSpoil')}</small></span><Icon name="chevron-right" size={18} />
      </button>
    </div>
    <button type="button" class="prow" data-sfx="open" data-en-flag="clip" onclick={() => go('flag')}>
      <span class="prl fl"><Icon name="flag" size={16} />{s('flagClipRow')}</span><Icon name="chevron-right" size={18} />
    </button>
    <p class="credit">{s('credit', { credit })}</p>
  </div>
</Sheet>

<style>
  .tools { display: grid; gap: 8px; padding-bottom: calc(var(--safe-bottom) + 8px); }
  .sec-label { margin: 4px 4px 0; }
  .chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .chip.big { min-width: var(--hit); }
  .tools > .prow, .prows { margin-top: 10px; }
  .prow :global(svg) { flex: none; color: var(--text-soft); }
  .fl { display: inline-flex; flex-direction: row; align-items: center; gap: 6px; }
  .fl :global(svg) { color: inherit; }
  .credit { margin: 6px 4px 0; font-size: 12px; color: var(--text-soft); }
</style>
