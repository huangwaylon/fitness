<script lang="ts">
  /** Flat progress bar (v5 §5): leaf on a soft lip-coloured track, no stripes, no outline. */
  interface Props {
    pct: number;
    height?: number;
    label?: string;
  }
  let { pct, height = 12, label }: Props = $props();
  const w = $derived(Math.max(0, Math.min(100, pct)));
</script>

<span
  class="rope"
  style:height="{height}px"
  role="progressbar"
  aria-valuemin={0}
  aria-valuemax={100}
  aria-valuenow={Math.round(w)}
  aria-label={label}
><i style:width="{w}%"></i></span>

<style>
  .rope { display: block; border-radius: var(--r-pill); background: color-mix(in srgb, var(--lip) 55%, transparent); overflow: hidden; }
  i {
    display: block; height: 100%; border-radius: var(--r-pill); min-width: 8px; background: var(--c-leaf);
    transition: width var(--dur-slow) var(--ease-soft);
  }
</style>
