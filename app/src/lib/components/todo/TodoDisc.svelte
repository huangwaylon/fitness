<script lang="ts">
  // やること's HUD disc (docs/todo.md "The disc and the peek"; docs/design.md "Island"): left of the dumbbell, a 44px
  // cream disc like the leaf's with the checklist icon and a count badge, the undone items due today or before (yuzu;
  // coral with any before today). Nothing due: nothing drawn. The badge pops once as its number changes, never loops;
  // nothing per frame (the count is derived from the record's rows and the minute). A tap opens the peek under it
  // (TodoPeek, its own chunk, fetched once something is due), the disc yuzu while it's up; a second tap, a tap
  // elsewhere (but on the snackbar its tick shows), Esc, a sheet opening or a pick shuts it. While the peek is up the
  // disc stays (its last tick taken).
  // No text on it but the number (the main catalog's label for VoiceOver).
  //   <TodoDisc />
  import { untrack } from 'svelte';
  import { todoBookOf, todoItems, type TodoEntry } from '#lib/contract/todo.ts';
  import { dueCount } from '#lib/contract/todoDue.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { dismiss } from '../ui/dismiss.ts';
  import type TodoPeekT from './TodoPeek.svelte';
  import { dayKey, minuteNow } from '#lib/time/clock.ts';
  import { chunkUnreachable } from '#lib/ui-state/lazySheet.svelte.ts';
  import { online } from '#lib/ui-state/online.svelte.ts';
  import { sheetTap } from '#lib/ui-state/sheetTiming.ts';
  import { ui } from '#lib/ui-state/ui.svelte.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';

  // (the record's rows folded here, not through the sheet's store: the disc is in the first load, the store isn't)
  const EMPTY: readonly TodoEntry[] = [];
  // (folded only when the rows change: the model is composed again each minute, its state kept)
  const rows = $derived(week.model?.state.todo ?? EMPTY);
  const items = $derived(todoItems(todoBookOf(rows)));
  const due = $derived(dueCount(items, dayKey(minuteNow())));
  let open = $state(false);
  let btn: HTMLButtonElement | undefined = $state();

  /** The peek's chunk: fetched once something is due (offline with no worker to serve it, not asked for:
   *  chunkUnreachable), again as the phone comes back online. */
  let Peek = $state<typeof TodoPeekT | null>(null);
  const load = () => void (Peek || chunkUnreachable() || import('./TodoPeek.svelte').then((m) => (Peek = m.default), () => {}));
  $effect(() => void (due.n > 0 && (online.current, untrack(load))));
  // a sheet opening (やること's own, a pill's, けんこう) shuts it
  $effect(() => {
    if (ui.sheets.length) open = false;
  });

  function toggle() {
    load();
    open = !open;
  }
  function pick(go: () => void) {
    open = false;
    sheetTap();
    go();
  }
</script>

{#if due.n > 0 || open}
  <div class="todo-disc" class:open {@attach open && dismiss(() => (open = false), { inside: '.todo-disc, .banner', onesc: () => btn?.focus({ preventScroll: true }) })}>
    <button type="button" class="disc" bind:this={btn} aria-expanded={open} aria-label={t('island.todoDue', { n: due.n })} data-hud-disc data-n={due.n} data-over={due.over || undefined}
      data-sfx="open" onpointerdown={load} onclick={toggle}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><rect class="pad" x="3" y="2.6" width="18" height="18.8" rx="3.2" /><path class="ink" d="m5.8 9.4 1.3-1.3 1.1 1.1 2.5-2.5 1.3 1.3-3.8 3.8ZM5.8 16.2l1.3-1.3 1.1 1.1 2.5-2.5 1.3 1.3-3.8 3.8Z" /><rect class="ink" x="12.8" y="8" width="5.6" height="2" rx="1" /><rect class="ink" x="12.8" y="14.8" width="5.6" height="2" rx="1" /></svg>
      {#if due.n > 0}
        {#key due.n}<span class="badge" class:over={due.over} aria-hidden="true" data-hud-disc-n>{formatNum(due.n)}</span>{/key}
      {/if}
    </button>
    {#if open && Peek}<Peek onopen={pick} />{/if}
  </div>
{/if}

<style>
  /* The leaf's disc (HudMenu .more): cream, the cream lip; open, NH's yellow. The peek's right edge on the cluster's
     (the dumbbell's pill and the leaf's disc to its right, 6px gaps: Hud's .hud-row), its tip at this disc's centre. */
  .todo-disc {
    position: relative; flex: none; width: var(--hit); height: var(--hit);
    --peek-right: calc(-1 * (var(--hud-side, 60px) + var(--hit) + 12px)); --tip: calc(var(--hud-side, 60px) + var(--hit) * 1.5 + 12px);
    animation: pop 260ms var(--ease-bounce) both;
  }
  .disc {
    position: relative; width: var(--hit); height: var(--hit); margin: 0; padding: 0; display: grid; place-items: center;
    appearance: none; border: 0; border-radius: 50%; cursor: pointer; background: var(--c-cream); color: var(--c-ink);
    box-shadow: 0 var(--lip-h) 0 var(--c-lip); -webkit-tap-highlight-color: transparent; touch-action: manipulation;
    transition: background-color 180ms var(--ease-soft), translate 120ms, box-shadow 120ms;
  }
  .disc:active { translate: 0 2px; box-shadow: 0 2px 0 var(--c-lip); }
  .open .disc { background: var(--c-yuzu); box-shadow: 0 var(--lip-h) 0 var(--c-yuzu-lip); }
  .disc:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  /* the menu's やること icon in the leaf's green, its ticks and lines cream */
  svg { width: 28px; height: 28px; filter: drop-shadow(0 1px 0 rgb(0 0 0 / .12)); }
  .pad { fill: var(--c-leaf-edge); }
  .ink { fill: var(--c-cream); }
  /* the count: yuzu with ink; coral (white on the coral text tone, 5.7:1) with anything overdue; popped once per number */
  .badge {
    position: absolute; right: -5px; top: -5px; min-width: 22px; height: 22px; padding: 0 6px; box-sizing: border-box; border-radius: 999px;
    display: grid; place-items: center; font: 700 13px/1 var(--font-num); font-variant-numeric: tabular-nums;
    color: var(--c-ink); background: var(--c-yuzu); box-shadow: 0 0 0 2.5px var(--c-cream), 0 2px 0 2.5px var(--c-yuzu-lip);
    animation: pop 260ms var(--ease-bounce) both;
  }
  .badge.over { color: #fff; background: var(--c-coral-text); box-shadow: 0 0 0 2.5px var(--c-cream), 0 2px 0 2.5px color-mix(in srgb, var(--c-coral-text) 80%, #000); }
  @keyframes pop { 0% { transform: scale(.7); opacity: 0; } 100% { transform: none; opacity: 1; } }
</style>
