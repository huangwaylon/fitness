<script lang="ts">
  // A bot page's last line (docs/design.md "Bots"): `[mode, sha7 | workflow, 更新 {time}]` (the status's own time; the
  // date too when it isn't `today`); `children`: a line above it (保養所's 設定の変更). `attr`: data-<attr>-foot.
  import type { Snippet } from 'svelte';
  import { t } from '#lib/i18n/index.ts';
  import { formatSyncTime } from '#lib/i18n/format.ts';

  let { parts, at, today, attr, children }: { parts: readonly (string | null | undefined)[]; at: number; today: string; attr: string; children?: Snippet } = $props();
  const line = $derived([...parts, t('bots.updated', { time: formatSyncTime(new Date(at), today) })].filter(Boolean).join(' · '));
</script>

<p class="foot" {...{ [`data-${attr}-foot`]: '' }}>{#if children}{@render children()}<br />{/if}{line}</p>

<style>
  .foot { margin: 0 4px; text-align: center; font-size: var(--fs-s); color: var(--text-soft); overflow-wrap: anywhere; line-height: var(--lh); }
</style>
