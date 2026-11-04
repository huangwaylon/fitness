<script lang="ts">
  // せってい → フレームレート (docs/design.md "Frame rate"): 30 (the default) | 60, the 3D scenes' full rate, kept on
  // this phone only.
  import { roving } from '../ui/roving.ts';
  import { FPS, frameRate, setFrameRate } from '#lib/store/frameRate.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
</script>

<div class="prows" role="radiogroup" aria-label={t('panel.fps')} {@attach roving}>
  {#each FPS as f (f)}
    {@const on = frameRate.fps === f}
    <button type="button" class="prow" role="radio" aria-checked={on} tabindex={on ? 0 : -1} data-fps={f} data-sfx={on ? 'none' : 'tick'} onclick={() => !on && setFrameRate(f)}>
      <span class="prl">{t(`fps.${f}`)}<small>{t(`fps.${f}.hint`)}</small></span><span class="radio" aria-hidden="true"></span>
    </button>
  {/each}
</div>

<style>
  .prl small { display: block; margin-top: 2px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .prow[aria-checked='true'] .prl small { color: var(--c-ink-soft); }
  .radio { width: 26px; height: 26px; border-radius: 50%; background: var(--c-card); box-shadow: inset 0 0 0 2px var(--c-edge); flex: none; }
  .prow[aria-checked='true'] .radio { background: radial-gradient(circle, var(--c-card) 0 5px, var(--c-leaf-edge) 6px); box-shadow: none; }
</style>
