<script lang="ts">
  // A day's four goals for one person, like stamps: the ring fruits, bright when met (+1 ベル each), faded when not.
  //   <GoalMarks met={{ pear: true, peach: false, cherry: true, apple: true }} name="ウェイ" />
  import type { RingFruit } from '#lib/types.ts';
  import { RING_FRUITS } from '#lib/config/rules.ts';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { fruitArt } from '#lib/art.ts';
  import { t } from '#lib/i18n/index.ts';

  let { met, name, size = '15px' }: { met: Record<RingFruit, boolean>; name: string; size?: string } = $props();
  const label = $derived(`${name}: ` + RING_FRUITS.map((f) => `${t(`fruit.${f}`)} ${met[f] ? '✓' : '—'}`).join('、'));
</script>

<span class="marks" style:--m={size} role="img" aria-label={label}>
  {#each RING_FRUITS as f (f)}
    <span class="m" class:on={met[f]}>
      <OfficialArt key={fruitArt(f)} size="var(--m)">
        {#snippet fallback()}<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#f-{f}" /></svg>{/snippet}
      </OfficialArt>
    </span>
  {/each}
</span>

<style>
  .marks { display: inline-flex; gap: 2px; line-height: 0; }
  .m { display: grid; place-items: center; width: var(--m); height: var(--m); }
  .m :global(svg) { width: var(--m); height: var(--m); }
  /* a goal not met: a small flat silhouette, like the tree's fruit that hasn't fallen yet */
  .m:not(.on) { opacity: .22; }
  .m:not(.on) :global(.official) { filter: brightness(0); }
  :global(:root[data-tod='night']) .m:not(.on) { opacity: .35; }
  :global(:root[data-tod='night']) .m:not(.on) :global(.official) { filter: brightness(0) invert(1); }
</style>
