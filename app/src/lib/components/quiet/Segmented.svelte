<script lang="ts" generics="T extends string">
  // A small segmented switch (docs/design.md "Quiet sheets"): km | mi. Hairline box, the picked one accent-filled.
  // `attr` names each option's data attribute (`data-units="mi"`); a tap on the picked one is silent.
  //   <Segmented items={[{ id: 'km', label: 'km' }, { id: 'mi', label: 'mi' }]} value={u} label="距離" attr="units" onpick={…} />
  interface Props {
    items: readonly { id: T; label: string }[];
    value: T;
    label: string;
    attr: string;
    onpick: (id: T) => void;
  }
  let { items, value, label, attr, onpick }: Props = $props();
</script>

<div class="q-seg" role="group" aria-label={label}>
  {#each items as it (it.id)}
    <button type="button" class:on={value === it.id} aria-pressed={value === it.id} {...{ [`data-${attr}`]: it.id }}
      data-sfx={value === it.id ? 'none' : 'tick'} onclick={() => onpick(it.id)}>{it.label}</button>
  {/each}
</div>

<style>
  .q-seg { display: inline-flex; flex: none; border: 1px solid var(--q-hairline); border-radius: 10px; overflow: hidden; background: var(--q-surface); }
  button {
    appearance: none; border: 0; background: none; cursor: pointer; position: relative; min-width: 48px; height: 30px; padding: 0 14px;
    font: var(--q-w) var(--q-fs-s)/1 var(--q-font); color: var(--q-ink-2); -webkit-tap-highlight-color: transparent;
  }
  button + button { border-left: 1px solid var(--q-hairline); }
  /* the 44px hit */
  button::after { content: ''; position: absolute; inset: -7px 0; }
  button.on { background: var(--q-accent); color: var(--q-on-accent); font-weight: var(--q-w-b); }
  button:focus-visible { outline: 2px solid var(--q-accent); outline-offset: -2px; }
</style>
