<script lang="ts">
  // 以前の記録（n件）にも反映する (the save of my own マイ食品 or recipe, docs/design.md "Gohan"): off each time; on, the
  // save re-snapshots my entries of it whose values the edit changes (Food.svelte saveWithPast), its banner's 取り消す
  // putting them back. The kit's switch row (theme.css .prow + .sw).
  import { t } from '#lib/i18n/index.ts';

  let { n, on, toggle }: { n: number; on: boolean; toggle: () => void } = $props();
</script>

<button type="button" class="prow past" role="switch" aria-checked={on} data-past-fresh={n} data-sfx={on ? 'toggle-off' : 'toggle-on'} onclick={toggle}>
  <span class="prl">{t('food.fresh.past', { n: String(n) })}<small>{t('food.fresh.pastHint')}</small></span><span class="sw s" aria-hidden="true"><i></i></span>
</button>

<style>
  .past { width: 100%; }
</style>
