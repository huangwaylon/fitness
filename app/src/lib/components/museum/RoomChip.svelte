<script lang="ts">
  // The museum's room chip (docs/design.md "The museum"): a cream pill at the top centre, the room one is in by its
  // doorway plaque's name, word for word (museum/hud.ts chipName: 「さ か な」, 「か せ き 2」), and what's on show in this
  // room of how many it holds 「12/120」; the hall its name only. Under it, while any came in the last day, a gold
  // 「あたらしい n」 tag (this room's new finds; the hall's, the museum's). The world HUD's sizes (34 high in the back pill's 44
  // row), between ‹ しまへ and ⌂; static, the name crossfading as the room changes. Not a button, and not drawn as one: a
  // translucent plate with no lip (the buttons beside it have theirs); it keeps a finger off the floor under it.
  let { name, found, total, fresh = 0 }: { name: string; found?: number; total?: number; fresh?: number } = $props();
  const count = $derived(found !== undefined && total !== undefined ? `${found}/${total}` : '');
</script>

<div class="chip" role="status" aria-label={[name, count, fresh ? `あたらしい ${fresh}` : ''].filter(Boolean).join(' ')} data-museum-chip={name}>
  {#key name}<span class="name" aria-hidden="true">{name}</span>{/key}
  {#if count}<span class="n" aria-hidden="true" data-museum-chip-n>{count}</span>{/if}
  {#if fresh}<span class="tag new" aria-hidden="true" data-museum-chip-new>あたらしい {fresh}</span>{/if}
</div>

<style>
  /* centred in the back pill's row (its 44px hit at --ui-top + 8: 5px each side of 34), never under ‹ しまへ (≤ ~84px
     from the side) nor ⌂ (52px) */
  .chip {
    position: absolute; z-index: 2; left: 50%; top: calc(var(--ui-top) + 13px); transform: translateX(-50%);
    height: 34px; min-width: 120px; max-width: calc(100% - 2 * (var(--side) + max(var(--safe-left), var(--safe-right)) + 92px));
    box-sizing: border-box; padding: 0 14px; display: flex; align-items: center; justify-content: center; gap: 10px;
    border-radius: var(--r-pill); background: color-mix(in srgb, var(--c-cream) 70%, transparent); color: var(--c-ink); box-shadow: none;
    font: 700 var(--fs-body)/1 var(--font-ui); white-space: nowrap; -webkit-tap-highlight-color: transparent; user-select: none;
  }
  .name { min-width: 0; overflow: hidden; text-overflow: ellipsis; animation: in 220ms ease-out both; }
  .n { flex: none; color: var(--c-ink-soft); font-variant-numeric: tabular-nums; }
  /* the gold NEW tag hangs under the pill (static: no pulse, no frames) */
  .new { position: absolute; top: calc(100% + 4px); left: 50%; transform: translateX(-50%); pointer-events: none; }
  @keyframes in { from { opacity: 0; } }
  @media (prefers-reduced-motion: reduce) { .name { animation: none; } }
</style>
