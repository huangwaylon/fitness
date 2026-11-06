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
  // An action sheet (docs/design.md "Unified kit"): the app's sheet (ui/Sheet: its title bar with ✕, the scrim and Esc
  // close it) with the actions in dense cards, one a group; 削除 coral. A pick closes it, then calls `onpick`. `note`: a
  // line under the title (what a confirmation's 削除 takes with it).
  //   <ActionSheet bind:open title="現金" groups={[[rename, up, down], [remove]]} onpick={(id) => …} />
  import Sheet from './Sheet.svelte';
  import Icon from './Icon.svelte';

  interface Props {
    open: boolean;
    /** The title bar's title (what it acts on: the row's name). */
    title: string;
    groups: readonly (readonly Action[])[];
    onpick: (id: string) => void;
    /** The sheet's accessible name (defaults to the title). */
    label?: string;
    /** A line under the title. */
    note?: string;
  }
  let { open = $bindable(), title, groups, onpick, label, note }: Props = $props();

  function pick(a: Action) {
    if (a.off) return;
    open = false;
    onpick(a.id);
  }
</script>

<Sheet bind:open label={label ?? title} {title}>
  <div class="acts">
    {#if note}<p class="note">{note}</p>{/if}
    {#each groups as g, gi (gi)}
      <div class="card dense">
        {#each g as a (a.id)}
          <button type="button" class="row" class:danger={a.danger} aria-disabled={a.off ? 'true' : undefined} data-action={a.id} data-sfx="tick" onclick={() => pick(a)}>
            {#if a.icon}<Icon name={a.icon} size={20} />{/if}<span>{a.label}</span>
          </button>
        {/each}
      </div>
    {/each}
  </div>
</Sheet>

<style>
  .acts { display: grid; gap: 8px; padding-bottom: 4px; }
  .note { margin: -4px 4px 4px; text-align: center; font-size: var(--fs-s); color: var(--text-soft); }
  .row { min-height: 52px; font: 700 var(--fs-body)/1.2 var(--font-ui); }
  .row :global(svg) { color: var(--text-soft); }
  .danger, .danger :global(svg) { color: var(--coral-text); }
  .row[aria-disabled='true'] { opacity: .45; }
</style>
