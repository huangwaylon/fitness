<script lang="ts">
  // ツール (docs/english.md "The page"): the lesson bar's ツール icon opens it. 字幕 オフ / 英語 / 日本語 (the lesson's, as the
  // chip), 字幕の大きさ 小 / 中 / 大 / 特大 (this phone's, 大 by default: YouTube's captions fontSize), 再生速度 1× / 0.75×
  // (when the frame offers it) and, for a clip with scenes, the 場面のあらすじ switch (this phone's); then the ways into the
  // clip's words: 場面のあらすじ's list, セリフ (a bank with lines only) and この動画のセリフと解説 (it shows the answers, and
  // says so); then ⚑ この動画を報告 and the credit. Each setting applies at once, the clip playing on; a row closes the
  // sheet and opens its own.
  import Sheet from '#lib/components/ui/Sheet.svelte';
  import Icon from '#lib/components/ui/Icon.svelte';
  import Segmented from '#lib/components/ui/Segmented.svelte';
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
  const RATES = [1, 0.75];
  const slow = $derived(!!player && player.rates.includes(0.75) && player.rates.some((r) => r !== 1));
  const size = (n: CcSize) => {
    player?.setCcSize(n);
    setCcSize(n);
  };
  const go = (to: ToolGo) => ((open = false), ongo(to));
</script>

<Sheet bind:open title={s('tools')} name="english-tools">
  <div class="tools" data-en-tools-sheet>
    <p class="sec-label">{s('captions')}</p>
    <Segmented items={MODES.map((m) => ({ id: m, label: s(`cc.${m}`) }))} value={player?.captions ?? 'off'} label={s('captions')} attr="en-cc-mode" onpick={onmode} />
    <p class="sec-label">{s('ccSize')}</p>
    <Segmented items={CC_SIZES.map((n, i) => ({ id: String(n), label: s(`ccSize.${i}` as 'ccSize.0') }))} value={String(player?.ccSize)} label={s('ccSize')} attr="en-cc-size" onpick={(n) => size(+n as CcSize)} />
    {#if slow}
      <p class="sec-label">{s('speed')}</p>
      <Segmented items={RATES.map((r) => ({ id: String(r), label: `${r}×` }))} value={String(player?.rate === 0.75 ? 0.75 : 1)} label={s('speed')} attr="en-rate" onpick={(r) => player?.setRate(+r)} />
    {/if}
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
  .tools > .prow, .prows { margin-top: 10px; }
  .prow :global(svg) { flex: none; color: var(--text-soft); }
  .fl { display: inline-flex; flex-direction: row; align-items: center; gap: 6px; }
  .fl :global(svg) { color: inherit; }
  .credit { margin: 6px 4px 0; font-size: var(--fs-s); color: var(--text-soft); }
</style>
