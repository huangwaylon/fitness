<script lang="ts">
  // The panel's サウンド (docs/design.md "Sound settings"): ミュージック and 効果音 as two ON/OFF rows (NH's yellow
  // highlight when on, the button tiers) and one 音量 slider. Both start OFF; turning one on plays a taste of it (the
  // opening theme, a confirm). Kept on this phone only (not synced like the language). No note under them (the user,
  // 2026-11-08).
  import { setSound, sound } from '#lib/sound/sound.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import { cue } from '#lib/sound/cues.ts';

  const ROWS = ['music', 'sfx'] as const;
  const s = $derived(sound.settings);
  const volume = $derived(Math.round(s.volume * 10));
  const off = $derived(!s.music && !s.sfx);
</script>

<div class="prows">
  {#each ROWS as k (k)}
    <button type="button" class="prow" role="switch" aria-checked={s[k]} data-sfx="self" onclick={() => {
      // the switch's on / off notes; 効果音 previews itself instead (a confirm as it turns on, and off it is silent)
      if (k !== 'sfx') cue(s[k] ? 'toggle-off' : 'toggle-on');
      setSound({ [k]: !s[k] });
    }}>
      <span class="prl">{t(`sound.${k}`)}<small>{t(`sound.${k}.hint`)}</small></span>
      <span class="sw" aria-hidden="true"><i></i></span>
    </button>
  {/each}

  <!-- nothing to turn up while both are off: the disabled tier (sunk, no edge) -->
  <label class="prow vol" class:off>
    <span class="prl">{t('sound.volume')}</span>
    <input type="range" min="0" max="10" step="1" value={volume} disabled={off} data-sfx="self" style:--v="{volume * 10}%"
      oninput={(e) => setSound({ volume: Number(e.currentTarget.value) / 10 })} onchange={() => cue('tick')} />
  </label>
</div>

<style>
  .prl small { display: block; margin-top: 2px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .prow[aria-checked='true'] .prl small { color: var(--c-ink-soft); }


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

</style>
