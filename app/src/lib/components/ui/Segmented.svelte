<script lang="ts" generics="T extends string">
  // A segmented switch (けんこう's かつどう · からだ, ごはん's きろく · グラフ): pills side by side, each an optional NH
  // icon and its name, the picked one pressed; the panel's tab look, smaller. `attr` names each pill's data attribute
  // (`data-group="body"`, `data-tab="chart"`), what the specs and the sounds read (a tap on the picked one is silent).
  import OfficialArt from '../characters/OfficialArt.svelte';

  interface Props {
    items: readonly { id: T; label: string; art?: string }[];
    value: T;
    /** The group's accessible name. */
    label: string;
    attr: string;
    onpick: (id: T) => void;
  }
  let { items, value, label, attr, onpick }: Props = $props();
</script>

<div class="seg" role="group" aria-label={label}>
  {#each items as it (it.id)}
    <button type="button" class="sb" aria-pressed={value === it.id} {...{ [`data-${attr}`]: it.id }} data-sfx={value === it.id ? 'none' : 'tick'}
      onclick={() => onpick(it.id)}>{#if it.art}<span class="gi" aria-hidden="true"><OfficialArt key={it.art} size={22} /></span>{/if}{it.label}</button>
  {/each}
</div>

<style>
  .seg { display: flex; gap: 6px; }
  .sb {
    appearance: none; border: 0; cursor: pointer; flex: 1 1 0; min-width: 0; min-height: var(--hit); padding: 0 4px; border-radius: var(--r-pill);
    display: inline-flex; align-items: center; justify-content: center; gap: 6px; white-space: nowrap;
    font: 700 var(--fs-body)/1 var(--font-ui); color: var(--text); background: var(--ctl); box-shadow: var(--sh-ctl);
  }
  .sb[aria-pressed='true'] { background: var(--ctl-sel); color: var(--c-ink); box-shadow: inset 0 0 0 2px var(--c-edge), 0 var(--lip-h) 0 var(--c-edge); }
  .sb:active { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
  .gi { display: inline-flex; width: 22px; height: 22px; flex: none; line-height: 0; }
</style>
