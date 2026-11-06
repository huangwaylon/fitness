<script module lang="ts">
  export interface Action {
    id: string;
    label: string;
    icon?: import('./Icon.svelte').IconName;
    /** A destructive action (削除): coral. */
    danger?: boolean;
    /** Shown but can't act now (上へ on the first row): it boops. */
    off?: boolean;
  }
</script>

<script lang="ts">
  // An iOS-like action sheet (docs/design.md "Quiet sheets"): an optional caption (what it acts on), grouped actions
  // with their icons, and キャンセル on its own; on a <dialog> (focus trap, Esc), the scrim and キャンセル close it. A
  // pick closes it, then calls `onpick`.
  //   <ActionSheet bind:open title="現金" groups={[[rename, up, down], [remove]]} onpick={(id) => …} />
  import { t } from '#lib/i18n/index.ts';
  import { cue } from '#lib/sound/cues.ts';
  import Icon from './Icon.svelte';

  interface Props {
    open: boolean;
    /** The caption over the actions (the row's name). */
    title?: string;
    groups: readonly (readonly Action[])[];
    onpick: (id: string) => void;
    /** The sheet's accessible name (defaults to the caption). */
    label?: string;
  }
  let { open = $bindable(), title, groups, onpick, label }: Props = $props();
  let dlg: HTMLDialogElement | undefined = $state();

  $effect(() => {
    if (!dlg) return;
    if (open && !dlg.open) {
      dlg.showModal();
      dlg.focus({ preventScroll: true });
    } else if (!open && dlg.open) dlg.close();
  });
  function pick(a: Action) {
    if (a.off) return;
    open = false;
    onpick(a.id);
  }
  /** The scrim (a tap outside the box) and Esc: back, as キャンセル. */
  function backdrop(e: MouseEvent) {
    if (e.target !== dlg || !dlg) return;
    const r = dlg.getBoundingClientRect();
    if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) return;
    cue('back');
    open = false;
  }
</script>

<dialog bind:this={dlg} class="quiet q-as" tabindex="-1" aria-label={label ?? title ?? ''} data-sfx="self" onclose={() => (open = false)} oncancel={() => cue('back')} onclick={backdrop}>
  {#if open}
    <div class="wrap">
      {#each groups as g, gi (gi)}
        <div class="grp">
          {#if gi === 0 && title}<p class="cap">{title}</p>{/if}
          {#each g as a (a.id)}
            <button type="button" class="a" class:danger={a.danger} aria-disabled={a.off ? 'true' : undefined} data-action={a.id} data-sfx="tick" onclick={() => pick(a)}>
              {#if a.icon}<Icon name={a.icon} size={20} />{/if}<span>{a.label}</span>
            </button>
          {/each}
        </div>
      {/each}
      <div class="grp"><button type="button" class="a cancel" data-q-cancel data-sfx="back" onclick={() => (open = false)}>{t('common.cancel')}</button></div>
    </div>
  {/if}
</dialog>

<style>
  .q-as {
    margin: auto auto 0; padding: 0 8px calc(max(var(--safe-bottom, 0px), 8px) + 8px); border: 0; width: 100%; max-width: 480px;
    background: none; overflow: visible;
  }
  .q-as:focus { outline: none; }
  .q-as[open] { animation: up 240ms cubic-bezier(.2, .8, .2, 1); }
  .q-as::backdrop { background: rgb(30 22 14 / .32); }
  :global(:root[data-tod='night']) .q-as::backdrop { background: rgb(8 10 25 / .5); }
  .grp { background: var(--q-surface); border-radius: 16px; overflow: hidden; margin-top: 8px; box-shadow: var(--q-shadow-float); }
  .cap { margin: 0; padding: 12px 18px 10px; text-align: center; font-size: var(--q-fs-s); color: var(--q-muted); border-bottom: 1px solid var(--q-hairline); }
  .a {
    appearance: none; border: 0; background: none; cursor: pointer; width: 100%; height: 52px; padding: 0 18px;
    display: flex; align-items: center; gap: 12px; text-align: start;
    font: var(--q-w) var(--q-fs-head)/1.2 var(--q-font); color: var(--q-ink); -webkit-tap-highlight-color: transparent;
  }
  .a + .a { border-top: 1px solid var(--q-hairline); }
  .a :global(svg) { color: var(--q-ink-2); }
  .a.danger, .a.danger :global(svg) { color: var(--q-coral); }
  .a[aria-disabled='true'] { opacity: .4; }
  .a:active { background: var(--q-sunken); }
  .a:focus-visible { outline: 2px solid var(--q-accent); outline-offset: -2px; }
  .cancel { justify-content: center; font-weight: var(--q-w-b); }
  @keyframes up { from { transform: translateY(100%); } to { transform: none; } }
  @media (prefers-reduced-motion: reduce) { .q-as[open] { animation: none; } }
</style>
