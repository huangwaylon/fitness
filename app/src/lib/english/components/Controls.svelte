<script lang="ts">
  // The player's own controls under the video (docs/english.md "The player"; the embed has none: controls=0): a scrubber
  // with the time (seeking is never locked; a question's segment is its card's この部分を聞く), then play / pause (on
  // from where it stopped), −5 秒 and 0.75× / 1× (only when the frame offers more speeds than 1), the two listening
  // aids side by side, and 字幕 at the row's end (YouTube's own captions, one tap: オフ → 英語 → 日本語, off by default,
  // this lesson's: `oncc`, the lesson's, counts it; the size and the rest are in ツール, StudySheet). All 44 pt.
  import Icon from '#lib/components/ui/Icon.svelte';
  import type { CcMode, YtPlayer } from '../player.svelte.ts';
  import { s } from '../i18n.ts';

  let { player, oncc }: { player: YtPlayer | undefined; oncc: (m: CcMode) => void } = $props();
  const playing = $derived(player?.state === 'playing' || player?.state === 'buffering');
  const ready = $derived(!!player && player.state !== 'loading' && player.state !== 'error');
  const dur = $derived(player?.duration || 0);
  const slow = $derived(!!player && player.rates.includes(0.75) && player.rates.some((r) => r !== 1));
  const cc = $derived<CcMode>(player?.captions ?? 'off');
  const clock = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  const NEXT: Record<CcMode, CcMode> = { off: 'en', en: 'ja', ja: 'off' };
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
    <button type="button" class="chip big" data-sfx="tick" disabled={!ready} data-yt-back5 onclick={() => player?.seek((player?.now() ?? 0) - 5)}>{s('back5')}</button>
    {#if slow}
      <button type="button" class="chip big" data-sfx="tick" aria-pressed={player?.rate === 0.75} data-yt-rate={player?.rate} onclick={() => player?.setRate(player.rate === 0.75 ? 1 : 0.75)}>0.75×</button>
    {/if}
    <span class="gap"></span>
    <button type="button" class="chip big" data-sfx="tick" disabled={!ready} aria-pressed={cc !== 'off'} data-yt-cc={cc} onclick={() => oncc(NEXT[cc])}>{s('captions')} {s(`cc.${cc}`)}</button>
  </div>
</div>

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
  .row + .row { padding-bottom: 6px; }
  .chip.big { flex: none; white-space: nowrap; }
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
