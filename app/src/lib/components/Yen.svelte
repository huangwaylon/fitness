<script lang="ts">
  // A savings amount (style guide v4 §T.5): the official Bells bag before `¥146,200` (amounts stay ¥).
  //   <Yen yen={n} />        inline, bag at 1.1em (hero totals)
  //   <Yen yen={n} pill />   Bells pill: cream pill, the bag overlapping its left edge
  // When the amount changes, the digits count up over 600 ms and the bag hops (instant under reduced motion).
  import { untrack } from 'svelte';
  import LeafCoin from './LeafCoin.svelte';
  import { formatYen } from '#lib/i18n/index.ts';

  interface Props {
    yen: number;
    /** Bag height (CSS length); default 1.1em (26px in a pill). */
    bag?: string;
    pill?: boolean;
    /** Prefix, e.g. '+'. */
    sign?: string;
    class?: string;
  }
  let { yen, bag, pill = false, sign = '', class: cls = '' }: Props = $props();

  let shown = $state(untrack(() => yen));
  let hop = $state(false);
  let first = true;

  $effect(() => {
    const to = yen;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (first || reduced) {
      first = false;
      shown = to;
      return;
    }
    const from = untrack(() => shown);
    const t0 = performance.now();
    let raf = 0;
    hop = true;
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / 600);
      shown = from + (to - from) * (1 - (1 - k) ** 3);
      if (k < 1) raf = requestAnimationFrame(step);
      else hop = false;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  });
</script>

<span class="yen money {cls}" class:bells={pill}>
  <span class="bag" class:hop><LeafCoin size={bag ?? (pill ? '26px' : '1.1em')} eager /></span>{sign}{formatYen(shown)}
</span>

<style>
  .yen { display: inline-flex; align-items: center; gap: .25em; white-space: nowrap; }
  .bag { display: inline-flex; line-height: 0; transform-origin: 50% 100%; }
  .bells .bag { position: absolute; left: -8px; top: 50%; margin-top: -13px; }
  .hop { animation: bag-hop 600ms var(--ease-bounce); }
  @keyframes bag-hop { 0%, 100% { transform: none; } 30% { transform: translateY(-10%) scale(.94, 1.06); } 60% { transform: scale(1.06, .94); } }
</style>
