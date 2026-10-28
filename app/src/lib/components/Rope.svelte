<script lang="ts">
  /** Striped "rope" progress bar (style guide §6). */
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
  .rope { display: block; border-radius: var(--r-pill); background: var(--leaf-soft); box-shadow: var(--sh-inset); overflow: hidden; }
  i {
    display: block; height: 100%; border-radius: var(--r-pill);
    background: repeating-linear-gradient(-45deg, var(--leaf) 0 8px, #8FD092 8px 16px);
    animation: stripes 1.6s linear infinite;
    transition: width var(--dur-slow) var(--ease-soft);
  }
  :global(:root[data-theme="night"]) .rope { background: #24314F; }
</style>
