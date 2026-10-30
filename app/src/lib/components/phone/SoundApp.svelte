<script lang="ts">
  // しまフォン → サウンド (docs/design/sound.md §10): ミュージック, 効果音 and おしゃべり as three ON/OFF rows (NH's yellow
  // highlight when on, round 13 tiers) and one 音量 slider. All start OFF; turning one on plays a taste of it (the
  // opening theme, a confirm, a few blips). Kept on this phone only (not synced like the language).
  import { setSound, sound } from '#lib/sound/sound.svelte.ts';
  import { hasMusic } from '#lib/sound/manifest.ts';
  import { jst, minuteNow } from '#lib/time/clock.ts';
  import { t } from '#lib/i18n/index.ts';

  const ROWS = ['music', 'sfx', 'voice'] as const;
  const s = $derived(sound.settings);
  const hour = $derived(jst(minuteNow()).hour);
  const volume = $derived(Math.round(s.volume * 10));
  const off = $derived(!s.music && !s.sfx && !s.voice);
</script>

<div class="prows">
  {#each ROWS as k (k)}
    <button type="button" class="prow" role="switch" aria-checked={s[k]} onclick={() => setSound({ [k]: !s[k] })}>
      <span class="prl">{t(`sound.${k}`)}<small>{t(`sound.${k}.hint`)}</small></span>
      <span class="sw" aria-hidden="true"><i></i></span>
    </button>
  {/each}

  <!-- nothing to turn up while all three are off: the disabled tier (round 13: sunk, no edge) -->
  <label class="prow vol" class:off>
    <span class="prl">{t('sound.volume')}</span>
    <input type="range" min="0" max="10" step="1" value={volume} disabled={off} style:--v="{volume * 10}%"
      oninput={(e) => setSound({ volume: Number(e.currentTarget.value) / 10 })} />
  </label>

  <p class="note">
    {#if s.music}{sound.playing === 'opening' ? t('sound.opening') : hasMusic() ? t('sound.nowPlaying', { hour }) : t('sound.noMusic')}<br />{/if}
    {t('sound.silentNote')}
  </p>
</div>

<style>
  .prl small { display: block; margin-top: 2px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .prow[aria-checked='true'] .prl small { color: var(--c-ink-soft); }

  /* the switch: a sunk tan track (off) or a leaf one (on) with a cream knob, both edged (round 13) */
  .sw {
    position: relative; flex: none; width: 56px; height: 32px; border-radius: var(--r-pill);
    background: var(--ctl-off); box-shadow: inset 0 0 0 2px var(--edge); transition: background var(--dur-quick);
  }
  .sw i {
    position: absolute; top: 4px; left: 4px; width: 24px; height: 24px; border-radius: 50%;
    background: var(--c-card); box-shadow: inset 0 0 0 2px var(--c-edge), 0 2px 0 var(--c-edge);
    transition: translate var(--dur-base) var(--ease-bounce);
  }
  .prow[aria-checked='true'] .sw { background: var(--c-leaf); box-shadow: inset 0 0 0 2px var(--c-leaf-edge); }
  .prow[aria-checked='true'] .sw i { translate: 24px 0; }

  /* 音量: a cream row with a track that fills leaf green up to the knob */
  .vol { cursor: default; }
  .prow.vol.off { background: var(--ctl-off); box-shadow: none; transform: translateY(4px); color: var(--text-soft); }
  .vol.off input { cursor: default; }
  .vol.off input::-webkit-slider-runnable-track { background: var(--ctl-off); box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--edge) 35%, transparent); }
  .vol.off input::-webkit-slider-thumb { box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--c-edge) 45%, transparent); }
  .vol .prl { flex: none; }
  input[type='range'] {
    flex: 1; min-width: 0; height: var(--hit); margin: 0; background: none; appearance: none; -webkit-appearance: none; cursor: pointer;
  }
  input[type='range']::-webkit-slider-runnable-track {
    height: 12px; border-radius: var(--r-pill); box-shadow: inset 0 0 0 2px var(--edge);
    background: linear-gradient(90deg, var(--c-leaf) var(--v), var(--ctl-off) var(--v));
  }
  input[type='range']::-moz-range-track {
    height: 12px; border-radius: var(--r-pill); box-shadow: inset 0 0 0 2px var(--edge);
    background: linear-gradient(90deg, var(--c-leaf) var(--v), var(--ctl-off) var(--v));
  }
  input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none; appearance: none; width: 30px; height: 30px; margin-top: -9px; border-radius: 50%; border: 0;
    background: var(--c-card); box-shadow: inset 0 0 0 2px var(--c-edge), 0 3px 0 var(--c-edge);
  }
  input[type='range']::-moz-range-thumb {
    width: 30px; height: 30px; border-radius: 50%; border: 0;
    background: var(--c-card); box-shadow: inset 0 0 0 2px var(--c-edge), 0 3px 0 var(--c-edge);
  }
  input[type='range']:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; border-radius: var(--r-pill); }

  .note { margin: 4px 6px 0; font-size: var(--fs-s); font-weight: 700; line-height: 1.5; color: var(--text-soft); word-break: auto-phrase; }
</style>
