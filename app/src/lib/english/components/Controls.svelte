<script lang="ts">
  // The player's own controls under the video (docs/english.md "The player"; the embed has none: controls=0): a scrubber
  // with the time (seeking is never locked; a question's segment is its card's この部分を聞く), then play / pause (on
  // from where it stopped), −5 秒, 字幕 (YouTube's own captions, one tap: オフ → 英語 → 日本語, off by default, this
  // lesson's; counted once a play: the log's act:english.cc), ⋯ its sheet (the choice, 字幕の大きさ and, for a clip with
  // scenes, あらすじ: CaptionSheet), and 0.75× / 1× only when the frame offers more speeds than 1. The kit's 32px discs in
  // 44px hits.
  import Icon from '#lib/components/ui/Icon.svelte';
  import { count } from '#lib/sync/log.ts';
  import type { CcMode, YtPlayer } from '../player.svelte.ts';
  import { s } from '../i18n.ts';
  import CaptionSheet from './CaptionSheet.svelte';

  let { player, scenes }: { player: YtPlayer | undefined; scenes?: { on: boolean; toggle: () => void } } = $props();
  const playing = $derived(player?.state === 'playing' || player?.state === 'buffering');
  const ready = $derived(!!player && player.state !== 'loading' && player.state !== 'error');
  const dur = $derived(player?.duration || 0);
  const slow = $derived(!!player && player.rates.includes(0.75) && player.rates.some((r) => r !== 1));
  const cc = $derived<CcMode>(player?.captions ?? 'off');
  const clock = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  const NEXT: Record<CcMode, CcMode> = { off: 'en', en: 'ja', ja: 'off' };
  let ccTold = false;
  let sheet = $state(false);
  function captions(m: CcMode) {
    if (!player) return;
    player.setCaptions(m);
    if (m !== 'off' && !ccTold) (ccTold = true), count('act:english.cc');
  }
  function toggle() {
    if (!player) return;
    if (playing) player.pause();
    else if (player.state === 'ended') player.play(0, null);
    else player.resume();
  }
</script>

<div class="ctl" data-yt-controls aria-disabled={!ready || undefined}>
  <div class="row">
    <input type="range" class="scrub" min="0" max={dur || 1} step="0.1" value={player?.time ?? 0} style:--v="{dur ? Math.min(100, ((player?.time ?? 0) / dur) * 100) : 0}%" disabled={!ready || !dur}
      aria-label={s('seek')} aria-valuetext={`${clock(player?.time ?? 0)} / ${clock(dur)}`} data-yt-scrub
      oninput={(e) => player?.seek(+e.currentTarget.value)} />
    <span class="time" data-yt-clock>{clock(player?.time ?? 0)}{#if dur}{` / ${clock(dur)}`}{/if}</span>
  </div>
  <div class="row">
    <button type="button" class="disc" data-sfx="tick" disabled={!ready} aria-label={playing ? s('pause') : s('play')} data-yt-toggle={playing ? 'pause' : 'play'} onclick={toggle}>
      <Icon name={playing ? 'pause' : 'play'} size={18} stroke={2.4} />
    </button>
    <button type="button" class="chip s" data-sfx="tick" disabled={!ready} data-yt-back5 onclick={() => player?.seek((player?.now() ?? 0) - 5)}>{s('back5')}</button>
    <span class="gap"></span>
    <button type="button" class="chip s" data-sfx="tick" disabled={!ready} aria-pressed={cc !== 'off'} data-yt-cc={cc} onclick={() => captions(NEXT[cc])}>{s('captions')} {s(`cc.${cc}`)}</button>
    <button type="button" class="disc more" data-sfx="open" disabled={!ready} aria-label={s('ccMore')} data-en-cc-more onclick={() => (sheet = true)}>
      <Icon name="more" size={18} />
    </button>
    {#if slow}
      <button type="button" class="chip s" data-sfx="tick" aria-pressed={player?.rate === 0.75} data-yt-rate={player?.rate} onclick={() => player?.setRate(player.rate === 0.75 ? 1 : 0.75)}>0.75×</button>
    {/if}
  </div>
</div>
<CaptionSheet bind:open={sheet} {player} onmode={captions} {scenes} />

<style>
  .ctl { flex: none; display: grid; padding: 0 calc(12px + var(--safe-right)) 0 calc(12px + var(--safe-left)); }
  /* the scrubber: 設定's 音量 slider (panel/SoundSection.svelte), the leaf up to the time */
  .scrub { flex: 1; min-width: 0; height: var(--hit); margin: 0; background: none; appearance: none; -webkit-appearance: none; cursor: pointer; }
  .scrub::-webkit-slider-runnable-track { height: 12px; border-radius: var(--r-pill); box-shadow: inset 0 0 0 2px var(--edge);
    background: linear-gradient(90deg, var(--c-leaf) var(--v), var(--ctl-off) var(--v)); }
  .scrub::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 30px; height: 30px; margin-top: -9px; border-radius: 50%; border: 0;
    background: var(--c-card); box-shadow: inset 0 0 0 2px var(--c-edge), 0 3px 0 var(--c-edge); }
  .scrub:disabled { cursor: default; opacity: .6; }
  .scrub:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; border-radius: var(--r-pill); }
  .row { display: flex; align-items: center; gap: 8px; min-height: var(--hit); }
  .disc.more { width: 36px; margin-left: -6px; }
  .gap { flex: 1; }
  .disc { appearance: none; position: relative; flex: none; width: var(--hit); height: var(--hit); padding: 0; border: 0; background: none; color: var(--text);
    display: inline-grid; place-items: center; cursor: pointer; -webkit-tap-highlight-color: transparent; }
  .disc::before { content: ''; position: absolute; inset: 6px; border-radius: 50%; background: var(--ctl); box-shadow: var(--sh-ctl-s); }
  .disc:active::before { transform: translateY(2px); box-shadow: var(--sh-ctl-s-press); }
  .disc :global(svg) { position: relative; }
  .disc:disabled { opacity: .5; cursor: default; }
  .chip:disabled { opacity: .5; }
  .time { flex: none; font: 600 var(--fs-s)/1 var(--font-num); color: var(--text-soft); font-variant-numeric: tabular-nums; }
</style>
