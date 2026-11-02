<script lang="ts">
  // せってい → しまの えがきかた: the island as it is (2D) | in 3D (world3d/: kept on this phone, store/islandRender).
  import { roving } from '../ui/roving.ts';
  import { t } from '#lib/i18n/index.ts';
  import { islandRender } from '#lib/store/islandRender.svelte.ts';

  const MODES = ['2d', '3d'] as const;
</script>

<div class="prows" role="radiogroup" aria-label={t('panel.render')} {@attach roving}>
  {#each MODES as m (m)}
    {@const on = islandRender.mode === m}
    <button type="button" class="prow" role="radio" aria-checked={on} tabindex={on ? 0 : -1} data-render={m} data-sfx={on ? 'none' : 'tick'} onclick={() => !on && islandRender.set(m)}>
      <span class="prl">{t(`panel.render.${m}`)}</span><span class="radio" aria-hidden="true"></span>
    </button>
  {/each}
</div>

<style>
  .radio { width: 26px; height: 26px; border-radius: 50%; background: var(--c-card); box-shadow: inset 0 0 0 2px var(--c-edge); flex: none; }
  .prow[aria-checked='true'] .radio { background: radial-gradient(circle, var(--c-card) 0 5px, var(--c-leaf-edge) 6px); box-shadow: none; }
</style>
