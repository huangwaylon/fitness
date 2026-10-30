<script lang="ts">
  // A week's five badges (ADR 0021 §4): the ring fruits, lit when that badge was met, faded when not. `progress`
  // (a week still running) puts the days met so far under each fruit: 3/5.
  //   <BadgeRow badges={{ peach: true, pear: false, cherry: true, apple: false, coconut: true }} size="28px" />
  import type { RingFruit } from '#lib/types.ts';
  import { RING_FRUITS } from '#lib/config/rules.ts';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { fruitArt } from '#lib/art.ts';
  import { t } from '#lib/i18n/index.ts';

  interface Props {
    badges: Record<RingFruit, boolean>;
    /** CSS size of one fruit. */
    size?: string;
    /** Reveal one by one (the harvest), starting after this many seconds. */
    stagger?: number | null;
    /** Days met / days needed, per fruit (a week still running). */
    progress?: Record<RingFruit, { days: number; goal: number }> | null;
  }
  let { badges, size = '28px', stagger = null, progress = null }: Props = $props();
  const label = $derived(
    RING_FRUITS.map((f) => `${t(`fruit.${f}`)} ${badges[f] ? '✓' : progress ? `${Math.min(progress[f].days, progress[f].goal)}/${progress[f].goal}` : '—'}`).join('、')
  );
</script>

<span class="badges" style:--b={size} role="img" aria-label="{t('badge.title')}: {label}">
  {#each RING_FRUITS as f, i (f)}
    <span class="cell">
      <span class="b" class:on={badges[f]} class:stag={stagger !== null} style:animation-delay={stagger !== null ? `${stagger + i * 0.15}s` : undefined}>
        <OfficialArt key={fruitArt(f)} size="var(--b)">
          {#snippet fallback()}<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#f-{f}" /></svg>{/snippet}
        </OfficialArt>
        {#if badges[f]}<svg class="ok" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check" /></svg>{/if}
      </span>
      {#if progress && !badges[f]}<small class="n money" aria-hidden="true">{Math.min(progress[f].days, progress[f].goal)}/{progress[f].goal}</small>{/if}
    </span>
  {/each}
</span>

<style>
  .badges { display: inline-flex; gap: calc(var(--b) * .18); }
  .cell { display: grid; justify-items: center; gap: 2px; }
  .b { position: relative; display: grid; place-items: center; width: calc(var(--b) * 1.25); height: calc(var(--b) * 1.25); border-radius: 50%; line-height: 0;
    background: color-mix(in srgb, var(--lip) 35%, transparent); }
  .b :global(svg:not(.ok)) { width: var(--b); height: var(--b); }
  .b:not(.on) :global(.official), .b:not(.on) > :global(svg) { opacity: .4; filter: saturate(0); }
  /* round 16 #16: an unearned badge stays visible on the night navy */
  :global(:root[data-tod='night']) .b:not(.on) :global(.official) { opacity: .6; }
  /* round 21: and its disc reads as a disc, not a dark hole in the navy card (r19 left this) */
  :global(:root[data-tod='night']) .b:not(.on) { background: color-mix(in srgb, var(--text) 14%, transparent); }
  .b.on { background: color-mix(in srgb, var(--c-yuzu) 55%, var(--c-cream)); box-shadow: 0 2px 0 var(--c-yuzu-lip); }
  .ok {
    position: absolute; right: -3px; bottom: -3px; width: calc(var(--b) * .5); height: calc(var(--b) * .5); min-width: 14px; min-height: 14px; padding: 2px;
    border-radius: 50%; background: var(--c-leaf); color: var(--c-ink); box-sizing: border-box;
  }
  .n { font-size: var(--fs-xs); line-height: 1; color: var(--text-soft); }
  .stag { animation: if-pop var(--dur-pop) var(--ease-bounce) both; }
  @media (prefers-reduced-motion: reduce) { .stag { animation: none; } }
</style>
