<script lang="ts">
  // A bot page's failed read (docs/design.md "Bots"): a yuzu-tinted row on top, 「読み込めませんでした（オフライン）」 with
  // the code (offline in words), and もう一度 (held while a read is on its way). The status shown stays under it.
  import { t } from '#lib/i18n/index.ts';

  let { code, busy, onretry, attr }: { code: string; busy: boolean; onretry: () => void; attr: string } = $props();
</script>

<div class="prow static note" {...{ [`data-${attr}-error`]: '' }}>
  <span class="prl">{t('bots.loadFailed', { code: code === 'offline' ? t('bots.offline') : code })}</span>
  <button type="button" class="btn small paper" data-sfx="tick" aria-disabled={busy} onclick={() => busy || onretry()}>{t('state.retry')}</button>
</div>

<style>
  /* (a class of its own, so the row's own background rule can't win) */
  .prow.note { background: color-mix(in srgb, var(--c-yuzu) 35%, var(--card)); }
</style>
