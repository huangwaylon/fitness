<script lang="ts">
  // A quiet form sheet (docs/design.md "Quiet sheets"): キャンセル on the left, the title in the middle, 保存 on the
  // right (accent; it boops while `can` is false), the form under it. On a <dialog> (focus trap, Esc and the scrim
  // close it, as キャンセル does). `onsave` returns false to stay open (a refused value). Fields in it are 16px.
  //   <BottomSheet bind:open title="名前を変更" onsave={() => …}> <input class="q-field" …/> </BottomSheet>
  import type { Snippet } from 'svelte';
  import { t } from '#lib/i18n/index.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { onScrim } from '../ui/scrim.ts';

  interface Props {
    open: boolean;
    title: string;
    onsave: () => void | boolean;
    /** Whether 保存 can act now (false: it boops). */
    can?: boolean;
    children: Snippet;
  }
  let { open = $bindable(), title, onsave, can = true, children }: Props = $props();
  let dlg: HTMLDialogElement | undefined = $state();

  $effect(() => {
    if (!dlg) return;
    if (open && !dlg.open) {
      dlg.showModal();
      // the first field takes the focus (the keyboard comes up with the sheet)
      queueMicrotask(() => dlg?.querySelector<HTMLElement>('input, textarea, select')?.focus());
    } else if (!open && dlg.open) dlg.close();
  });
  function save(e?: Event) {
    e?.preventDefault();
    if (!can) return;
    if (onsave() !== false) open = false;
  }
  /** The scrim (ui/scrim.ts) and Esc: back, as キャンセル. */
  function backdrop(e: MouseEvent) {
    if (!onScrim(e, dlg)) return;
    cue('back');
    open = false;
  }
</script>

<dialog bind:this={dlg} class="quiet q-bs" tabindex="-1" aria-label={title} data-sfx="self" onclose={() => (open = false)} oncancel={() => cue('back')} onclick={backdrop}>
  {#if open}
    <form onsubmit={save}>
      <header class="bar">
        <button type="button" class="tb" data-q-cancel data-sfx="back" onclick={() => (open = false)}>{t('common.cancel')}</button>
        <h2 class="t">{title}</h2>
        <button type="submit" class="tb save" aria-disabled={can ? undefined : 'true'} data-q-save data-sfx="confirm">{t('common.save')}</button>
      </header>
      <div class="body">{@render children()}</div>
    </form>
  {/if}
</dialog>

<style>
  .q-bs {
    margin: auto auto 0; padding: 0; border: 0; width: 100%; max-width: 480px; max-height: calc(100dvh - 56px);
    border-radius: var(--q-r-sheet) var(--q-r-sheet) 0 0; box-shadow: var(--q-shadow-float); overflow: hidden auto;
    padding-bottom: calc(max(var(--safe-bottom, 0px), 8px) + var(--kb, 0px) + 12px);
  }
  .q-bs:focus { outline: none; }
  .q-bs[open] { animation: up 240ms cubic-bezier(.2, .8, .2, 1); }
  /* (::backdrop inherits the dialog's .quiet tokens) */
  .q-bs::backdrop { background: var(--q-scrim); }
  .bar { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; height: 52px; padding: 0 4px; border-bottom: 1px solid var(--q-hairline); }
  .t { margin: 0; font: var(--q-w-b) var(--q-fs-head)/1.2 var(--q-font); color: var(--q-ink); text-align: center; white-space: nowrap; }
  .tb {
    appearance: none; border: 0; background: none; cursor: pointer; min-height: 44px; padding: 0 12px; justify-self: start;
    font: var(--q-w) var(--q-fs-body)/1 var(--q-font); color: var(--q-ink-2); -webkit-tap-highlight-color: transparent;
  }
  .save { justify-self: end; color: var(--q-accent-ink); font-weight: var(--q-w-b); }
  .save[aria-disabled='true'] { opacity: .4; }
  .tb:focus-visible { outline: 2px solid var(--q-accent); outline-offset: -4px; border-radius: 10px; }
  .body { padding: 16px; display: grid; gap: 12px; }
  /* the kit's field: a card-white box with a hairline, 16px text (no iOS zoom) */
  .body :global(.q-field) {
    width: 100%; box-sizing: border-box; min-height: 44px; padding: 10px 12px; border-radius: var(--q-r-ctl);
    border: 1px solid var(--q-hairline); background: var(--q-surface); color: var(--q-ink); font: 400 16px/1.4 var(--q-font);
  }
  .body :global(.q-field:focus) { outline: 2px solid var(--q-accent); outline-offset: -1px; }
  @keyframes up { from { transform: translateY(100%); } to { transform: none; } }
  @media (prefers-reduced-motion: reduce) { .q-bs[open] { animation: none; } }
</style>
