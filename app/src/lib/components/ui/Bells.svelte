<script lang="ts">
  // A ベル amount: the official Bells bag before `1,234 ベル` / `1,234 Bells`.
  //   <Bells bells={n} />                  bag at 1.1em, the unit a little smaller than the digits
  //   <Bells bells={620} signed />         `+620 ベル` (today's flow)
  // When the amount changes, the digits count up over 600 ms and the bag hops (instant under reduced motion).
  import { untrack } from 'svelte';
  import { Tween, prefersReducedMotion } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import LeafCoin from './LeafCoin.svelte';
  import { formatNum, t } from '#lib/i18n/index.ts';

  interface Props {
    bells: number;
    /** `+620` for a gain. */
    signed?: boolean;
    class?: string;
  }
  let { bells, signed = false, class: cls = '' }: Props = $props();

  const shown = new Tween(untrack(() => bells), { duration: 600, easing: cubicOut });
  let hop = $state(0);

  $effect(() => {
    const to = bells;
    if (to === untrack(() => shown.target)) return;
    const instant = prefersReducedMotion.current;
    if (!instant) hop++;
    shown.set(to, { duration: instant ? 0 : 600 });
  });
  const n = $derived(Math.round(shown.current));
  const sign = $derived(n < 0 ? '−' : signed && n > 0 ? '+' : '');
  /** The unit around the digits from the catalog (`{n} ベル` / `{n} Bells`), so the word order follows the locale. */
  const parts = $derived(t('bells.amount', { n: '\u0000' }).split('\u0000'));
</script>

<span class="bells money {cls}">
  {#key hop}<span class="bag" class:hop={hop > 0}><LeafCoin size="1.1em" eager /></span>{/key}
  {#if parts[0].trim()}<span class="unit">{parts[0].trim()}</span>{/if}<span class="num">{sign}{formatNum(Math.abs(n))}</span>{#if parts[1]?.trim()}<span class="unit">{parts[1].trim()}</span>{/if}
</span>

<style>
  .bells { display: inline-flex; align-items: baseline; gap: .22em; white-space: nowrap; }
  .bag { display: inline-flex; flex: none; align-self: center; line-height: 0; transform-origin: 50% 100%; margin-right: .06em; }
  .unit { font-family: var(--font-ui); font-size: .62em; font-weight: 700; letter-spacing: 0; }
  .hop { animation: bag-hop 600ms var(--ease-bounce); }
  @keyframes bag-hop { 0%, 100% { transform: none; } 30% { transform: translateY(-10%) scale(.94, 1.06); } 60% { transform: scale(1.06, .94); } }
</style>
