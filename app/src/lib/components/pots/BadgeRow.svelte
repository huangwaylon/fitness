<script lang="ts">
  // A week's badges (ADR 0019 §4): the four fruit, lit when that badge was met (+500 ベル each), faded when not.
  //   <BadgeRow badges={{ peach: true, apple: false, coconut: true, pear: true }} size="28px" />
  import type { FruitKey } from '#lib/types.ts';
  import { FRUITS } from '#lib/config/rules.ts';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { fruitArt } from '#lib/art.ts';
  import { t } from '#lib/i18n/index.ts';

  interface Props {
    badges: Record<FruitKey, boolean>;
    /** CSS size of one fruit. */
    size?: string;
    /** Reveal one by one (the harvest), starting after this many seconds. */
    stagger?: number | null;
  }
  let { badges, size = '28px', stagger = null }: Props = $props();
  const label = $derived(FRUITS.map((f) => `${t(`fruit.${f}`)} ${badges[f] ? '✓' : '—'}`).join('、'));
</script>

<span class="badges" style:--b={size} role="img" aria-label={label}>
  {#each FRUITS as f, i (f)}
    <span class="b" class:on={badges[f]} class:stag={stagger !== null} style:animation-delay={stagger !== null ? `${stagger + i * 0.15}s` : undefined}>
      <OfficialArt key={fruitArt(f)} size="var(--b)">
        {#snippet fallback()}<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#f-{f}" /></svg>{/snippet}
      </OfficialArt>
      {#if badges[f]}<svg class="ok" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check" /></svg>{/if}
    </span>
  {/each}
</span>

<style>
  .badges { display: inline-flex; gap: calc(var(--b) * .18); }
  .b { position: relative; display: grid; place-items: center; width: calc(var(--b) * 1.25); height: calc(var(--b) * 1.25); border-radius: 50%; line-height: 0;
    background: color-mix(in srgb, var(--lip) 35%, transparent); }
  .b :global(svg:not(.ok)) { width: var(--b); height: var(--b); }
  .b:not(.on) :global(.official), .b:not(.on) > :global(svg) { opacity: .4; filter: saturate(0); }
  .b.on { background: color-mix(in srgb, var(--c-yuzu) 55%, var(--c-cream)); box-shadow: 0 2px 0 var(--c-yuzu-lip); }
  .ok {
    position: absolute; right: -3px; bottom: -3px; width: calc(var(--b) * .5); height: calc(var(--b) * .5); min-width: 14px; min-height: 14px; padding: 2px;
    border-radius: 50%; background: var(--c-leaf); color: var(--c-ink); box-sizing: border-box;
  }
  .stag { animation: if-pop var(--dur-pop) var(--ease-bounce) both; }
  @media (prefers-reduced-motion: reduce) { .stag { animation: none; } }
</style>
