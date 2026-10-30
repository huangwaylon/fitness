<script lang="ts">
  // The jar (v5 §5, F6): ONE drawing for the island and the ふたりの壺 hero.
  // Glass #DDF2FB (round 7: lit from the upper left, a white streak there and a soft #BFDCEA shade toward the
  // lower right, over the coins too), a stack of coins up to the fill line, a yuzu lid with a leaf; no ink.
  //   <Jar fill={0.6} width="132px" />            fill 0–1 of the glass (wallet/fill.ts walletFill) (the coins slide, 1.4 s, eased)
  //   <Jar fill={old} band={after} width="96px" /> band: a lighter "this harvest" layer up to `band`
  // The art is 54 × 68 (height = width × 68 / 54). Set `name` to give it a view-transition-name, so a
  // route change can morph the island jar into the ふたりの壺 hero jar (ui-state/jarTransition.ts + tokens.css).
  interface Props {
    /** 0–1: how full the glass is (0 = empty; a little shows as soon as there is anything). */
    fill: number;
    /** 0–1, ≥ fill: a lighter coin layer on top (a harvest about to drop in). */
    band?: number;
    /** CSS width (default 60px). */
    width?: string;
    /** view-transition-name (one per page). */
    name?: string;
    class?: string;
  }
  let { fill, band, width = '60px', name, class: cls = '' }: Props = $props();
  const uid = $props.id();

  const BODY = 'M13 18 Q4 24 4 36 V58 Q4 66 12 66 H42 Q50 66 50 58 V36 Q50 24 41 18 Z';
  const COIN_TOP = 22;
  /** The coin stack is drawn full and slid down by (1 − fill) × 44 (+8 when empty, fully hidden). */
  const slide = (f: number) => ((1 - Math.min(1, Math.max(0, f))) * 44 + (f > 0 ? 0 : 8)).toFixed(2);
</script>

<svg class="jarart {cls}" viewBox="0 0 54 68" style:width style:view-transition-name={name} aria-hidden="true">
  <defs>
    <clipPath id="{uid}-body"><path d={BODY} /></clipPath>
    <linearGradient id="{uid}-shade" x1="0" y1="0" x2="1" y2="1">
      <stop offset=".4" stop-color="#BFDCEA" stop-opacity="0" /><stop offset="1" stop-color="#BFDCEA" stop-opacity=".85" />
    </linearGradient>
  </defs>
  <path d={BODY} class="glass" />
  <g clip-path="url(#{uid}-body)">
    {#if band != null && band > fill}
      <g class="coins band" style:transform="translateY({slide(band)}px)">{@render coins()}</g>
    {/if}
    <g class="coins" style:transform="translateY({slide(fill)}px)">{@render coins()}</g>
  </g>
  <path d={BODY} fill="url(#{uid}-shade)" />
  <path d="M8.6 30 Q7.4 38 8.6 47 Q9.4 48.6 10.8 47.4 Q9.8 38 11.2 30.6 Q10.2 28.6 8.6 30 Z" class="glint" />
  <rect x="11" y="10.4" width="32" height="10" rx="4" class="lid-lip" />
  <rect x="11" y="8" width="32" height="10" rx="4" class="lid" />
  <path d="M27 8 Q29 1 36 1.6 Q33 8 27 8 Z" class="leaf" />
</svg>

{#snippet coins()}
  <rect x="0" y={COIN_TOP + 3} width="54" height="70" class="coinfill" />
  {#each Array.from({ length: 8 }) as _, row (row)}
    {#each [0, 1, 2, 3] as col (col)}
      <ellipse cx={8 + col * 13 + (row % 2) * 6} cy={COIN_TOP + 2 + row * 6} rx="5.8" ry="2.4" class="coin" />
    {/each}
  {/each}
{/snippet}

<style>
  .jarart { display: block; height: auto; aspect-ratio: 54 / 68; overflow: visible; }
  .glass { fill: var(--jar-glass); }
  .coinfill { fill: var(--jar-coin-rim); }
  .coin { fill: var(--jar-coin); }
  .coins { transition: transform 1.4s var(--ease-soft); will-change: transform; }
  .band { opacity: .5; }
  .glint { fill: #fff; opacity: .85; }
  .lid-lip { fill: var(--c-yuzu-lip); }
  .lid { fill: var(--c-yuzu); }
  .leaf { fill: var(--jar-leaf); }
  @media (prefers-reduced-motion: reduce) { .coins { transition: none; } }
</style>
