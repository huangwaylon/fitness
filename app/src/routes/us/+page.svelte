<script lang="ts">
  // ふたり Us (being retired, ADR 0014: the partner's fruit moves to Island, settings live in しまフォン).
  // Promises and Cozy Days are gone; only the partner card is left until the UI overhaul removes this page.
  import type { FruitKey } from '#lib/types.ts';
  import FruitRing from '#lib/components/FruitRing.svelte';
  import Villager from '#lib/components/Villager.svelte';
  import HelpButton from '#lib/components/HelpButton.svelte';
  import { week } from '#lib/client/week.svelte.ts';
  import { t } from '#lib/i18n/index.ts';

  const FRUITS: FruitKey[] = ['peach', 'coconut', 'apple', 'pear'];

  const view = $derived(week.view);
  const me = $derived(view ? view.people[view.me] : null);
  const partner = $derived(view ? view.people[view.partner] : null);

  const tagOf = (who: 'A' | 'B') => (who === 'A' ? 'var(--tag-apricot)' : 'var(--tag-plum)');
</script>

{#if view && me && partner}
  <main class="screen us">
    <div class="screen-head">
      <h1><span class="tile" style:--tile="var(--app-us)"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#app-us" /></svg></span>{t('us.title')}</h1>
      <HelpButton topic="us" />
    </div>

    <!-- Partner -->
    <section class="card partner">
      <span class="tape" style:--tape={tagOf(view.partner)}>{partner.villagerName}</span>
      <div class="who">
        <span class="av"><Villager person={view.partner} size={64} /></span>
        <span class="score"><span class="hero-num">{partner.score}</span><small class="money">/100</small></span>
      </div>
      <div class="fruits">
        {#each FRUITS as f (f)}<FruitRing fruit={f} view={partner.fruits[f]} size="56px" showPct />{/each}
      </div>
    </section>

  </main>

{/if}

<style>
  .us { display: flex; flex-direction: column; gap: 22px; }
  .partner { padding: 24px 16px 14px; }
  .partner .who { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 12px; }
  .av { width: 76px; height: 76px; border-radius: var(--r-blob); background: color-mix(in srgb, var(--p-apricot) 30%, var(--surface)); display: grid; place-items: center; flex: none; }
  .score { display: flex; align-items: baseline; gap: 2px; }
  .score small { font-size: 1rem; color: var(--text-faint); }
  .fruits { display: flex; justify-content: space-between; }

</style>
