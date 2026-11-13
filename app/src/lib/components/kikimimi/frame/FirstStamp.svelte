<script lang="ts">
  // 一発 (right on the first listen): a rubber stamp, no points; a cream sticker at any time of day (.obj-cream: the day
  // coral). At a reveal it pops in (`pop`), on a review row it's small (`sm`), on the results card it counts them.
  import type { HTMLAttributes } from 'svelte/elements';
  import { t } from '#lib/i18n/index.ts';

  let { text = t('kiki.firstTry'), sm = false, pop = false, ...rest }: { text?: string; sm?: boolean; pop?: boolean } & HTMLAttributes<HTMLSpanElement> = $props();
</script>

<span class="stamp obj-cream" class:sm class:pop {...rest}>{text}</span>

<style>
  .stamp {
    display: inline-block; align-self: center; padding: 3px 10px; border-radius: 8px; rotate: -4deg; white-space: nowrap; color: var(--coral-text);
    background: color-mix(in srgb, var(--c-yuzu) 45%, var(--c-card)); box-shadow: inset 0 0 0 2px var(--c-coral); font: 700 var(--fs-s)/1.2 var(--font-ui);
  }
  .sm { padding: 2px 6px; }
  .pop { rotate: -6deg; animation: if-pop-in 320ms var(--ease-bounce) 200ms both; }
  @media (prefers-reduced-motion: reduce) { .pop { animation: none; } }
</style>
