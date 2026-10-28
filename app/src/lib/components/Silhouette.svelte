<script lang="ts">
  // The one generic fallback for a missing official render (villager or host): a soft blob with two eyes.
  interface Props {
    /** Fill colour (the villager's fur, or しずえ's yuzu). */
    colour?: string;
    /** Rendered height (CSS length). */
    height: string;
    /** Head-only (round icon) framing. */
    head?: boolean;
  }
  let { colour = '#FFD66B', height, head = false }: Props = $props();
</script>

<svg class="sil" viewBox={head ? '0 0 100 100' : '0 0 100 128'} style:height
  style:width={head ? height : `calc(${height} * 100 / 128)`} aria-hidden="true">
  <g fill={colour} stroke="#4A3A2C" stroke-width="2.6" stroke-linejoin="round">
    {#if !head}<path d="M32 74 H68 Q78 98 72 124 H28 Q22 98 32 74 Z" fill="#FFFBEA" />{/if}
    <ellipse cx="50" cy={head ? 54 : 44} rx="38" ry="34" />
  </g>
  <circle cx="37" cy={head ? 56 : 46} r="4" fill="#4A3A2C" /><circle cx="63" cy={head ? 56 : 46} r="4" fill="#4A3A2C" />
</svg>

<style>
  .sil { display: block; flex: none; overflow: visible; }
</style>
