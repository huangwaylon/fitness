<script lang="ts">
  // A savings amount (design.md §T): the official Bells bag before `¥146,200` (amounts stay ¥).
  //   <Yen yen={n} />        inline, bag at 1.1em (hero totals)
  // When the amount changes, the digits count up over 600 ms and the bag hops (instant under reduced motion).
  import { untrack } from 'svelte';
  import { Tween, prefersReducedMotion } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import LeafCoin from './LeafCoin.svelte';
  import { formatYen } from '#lib/i18n/index.ts';

  let { yen, class: cls = '' }: { yen: number; class?: string } = $props();

  const shown = new Tween(untrack(() => yen), { duration: 600, easing: cubicOut });
  let hop = $state(0);

  $effect(() => {
    const to = yen;
    if (to === untrack(() => shown.target)) return;
    const instant = prefersReducedMotion.current;
    if (!instant) hop++;
    shown.set(to, { duration: instant ? 0 : 600 });
  });
</script>

<span class="yen money {cls}">
  {#key hop}<span class="bag" class:hop={hop > 0}><LeafCoin size="1.1em" eager /></span>{/key}{formatYen(shown.current)}
</span>

<style>
  .yen { display: inline-flex; align-items: center; gap: .25em; white-space: nowrap; }
  .bag { display: inline-flex; line-height: 0; transform-origin: 50% 100%; }
  .hop { animation: bag-hop 600ms var(--ease-bounce); }
  @keyframes bag-hop { 0%, 100% { transform: none; } 30% { transform: translateY(-10%) scale(.94, 1.06); } 60% { transform: scale(1.06, .94); } }
</style>
