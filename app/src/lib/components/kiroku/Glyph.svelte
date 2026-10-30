<script lang="ts">
  // きろく's flat glyphs (no strokes, v5 §5): the day stamps of the Nook Miles-style cards (● active, ★ strength,
  // ○ none, · ahead), the 🔒 of a closed week, the ✎ of an edit.
  import type { Stamp } from '#lib/model/history.ts';
  let { kind, size = 16, label }: { kind: Stamp | 'lock' | 'pen'; size?: number; label?: string } = $props();
</script>

<svg class="g {kind}" viewBox="0 0 24 24" width={size} height={size} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : 'true'}>
  {#if kind === 'strength'}
    <path d="M12 2.5 L14.9 8.6 L21.5 9.4 L16.6 13.9 L17.9 20.5 L12 17.2 L6.1 20.5 L7.4 13.9 L2.5 9.4 L9.1 8.6Z" />
  {:else if kind === 'active'}
    <circle cx="12" cy="12" r="8.5" />
  {:else if kind === 'none'}
    <circle cx="12" cy="12" r="7" fill="none" stroke-width="3" />
  {:else if kind === 'future'}
    <circle cx="12" cy="12" r="2.6" />
  {:else if kind === 'lock'}
    <path d="M7 10 V8 a5 5 0 0 1 10 0 V10" fill="none" stroke-width="2.6" />
    <rect x="4.5" y="10" width="15" height="11" rx="3" />
  {:else}
    <path d="M4 20 L5 15 L15.5 4.5 a2.1 2.1 0 0 1 3 0 l1 1 a2.1 2.1 0 0 1 0 3 L9 19 Z" />
  {/if}
</svg>

<style>
  .g { display: inline-block; flex: none; vertical-align: middle; }
  .strength { fill: var(--c-yuzu-lip); }
  .active { fill: var(--c-leaf-lip); }
  .none { stroke: color-mix(in srgb, var(--lip) 80%, transparent); }
  .future { fill: color-mix(in srgb, var(--text-soft) 45%, transparent); }
  .lock { fill: var(--text-soft); stroke: var(--text-soft); }
  .pen { fill: currentColor; } /* round 13: follows the text, so it reads at night too */
</style>
