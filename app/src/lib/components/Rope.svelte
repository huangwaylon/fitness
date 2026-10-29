<script lang="ts">
  /** Striped progress bar (style guide v4 §3: --pat-stripes-fill, animated; stopped under reduced motion). */
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
  .rope { display: block; border-radius: var(--r-pill); background: var(--track); box-shadow: var(--sh-inset); overflow: hidden; border: var(--bw) solid var(--edge); }
  i {
    display: block; height: 100%; border-radius: var(--r-pill); min-width: 8px;
    background: var(--pat-stripes-fill), var(--c-leaf); box-shadow: inset 0 -3px 0 var(--c-leaf-lip);
    animation: stripes 1s linear infinite;
    transition: width var(--dur-slow) var(--ease-soft);
  }
</style>
