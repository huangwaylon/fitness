<script lang="ts">
  // The museum's room chip (docs/design.md "The museum"): a cream pill at the top centre, the room one is in by its
  // plaque's name in spaced kana (museum/hud.ts roomLabel) and its wing's finds of its whole 「さかな 34/80」; the hall its
  // name only. The world HUD's sizes (34 high in the back pill's 44 row, the 4px lip), between ‹ 島へ and ⌂; static, the
  // name crossfading as the room changes. Not a button: it keeps a finger off the floor under it.
  let { name, found, total }: { name: string; found?: number; total?: number } = $props();
  const count = $derived(found !== undefined && total !== undefined ? `${found}/${total}` : found !== undefined ? `${found}` : '');
</script>

<div class="chip" role="status" aria-label={count ? `${name} ${count}` : name} data-museum-chip={name}>
  {#key name}<span class="name" aria-hidden="true">{name}</span>{/key}
  {#if count}<span class="n" aria-hidden="true" data-museum-chip-n>{count}</span>{/if}
</div>

<style>
  /* centred in the back pill's row (its 44px hit at --ui-top + 8: 5px each side of 34), never under ‹ 島へ (≤ ~84px
     from the side) nor ⌂ (52px) */
  .chip {
    position: absolute; z-index: 2; left: 50%; top: calc(var(--ui-top) + 13px); transform: translateX(-50%);
    height: 34px; min-width: 120px; max-width: calc(100% - 2 * (var(--side) + max(var(--safe-left), var(--safe-right)) + 92px));
    box-sizing: border-box; padding: 0 14px; display: flex; align-items: center; justify-content: center; gap: 10px;
    border-radius: var(--r-pill); background: var(--c-cream); color: var(--c-ink); box-shadow: 0 var(--lip-h) 0 var(--c-lip);
    font: 700 var(--fs-body)/1 var(--font-ui); white-space: nowrap; -webkit-tap-highlight-color: transparent; user-select: none;
  }
  /* (a plaque's letters, a little apart) */
  .name { min-width: 0; overflow: hidden; text-overflow: ellipsis; letter-spacing: .08em; animation: in 220ms ease-out both; }
  .n { flex: none; color: var(--c-ink-soft); font-variant-numeric: tabular-nums; }
  @keyframes in { from { opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { .name { animation: none; } }
</style>
