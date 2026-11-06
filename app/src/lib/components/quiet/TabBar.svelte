<script lang="ts" generics="T extends string">
  // A sheet's bottom tab bar (docs/design.md "Quiet sheets"): icon over label, the active one in the accent; it sits
  // at the foot of the sheet (the caller places it: the last child of a flex column), frosted, the home indicator's
  // safe area under it. `attr` names each tab's data attribute (`data-trip-tab="map"`), what the specs read. A tap on
  // the shown tab is silent.
  //   <TabBar items={[{ id: 'days', label: '日程', icon: 'calendar' }, …]} value={tab} label="ページ" attr="trip-tab" onpick={…} />
  import Icon, { type IconName } from './Icon.svelte';

  interface Props {
    items: readonly { id: T; label: string; icon: IconName }[];
    value: T;
    /** The bar's accessible name. */
    label: string;
    attr: string;
    onpick: (id: T) => void;
  }
  let { items, value, label, attr, onpick }: Props = $props();
</script>

<nav class="q-tabbar" aria-label={label}>
  {#each items as it (it.id)}
    <button type="button" class="it" class:on={value === it.id} aria-current={value === it.id ? 'page' : undefined}
      {...{ [`data-${attr}`]: it.id }} data-sfx={value === it.id ? 'none' : 'tick'} onclick={() => onpick(it.id)}>
      <Icon name={it.icon} size={22} /><span>{it.label}</span>
    </button>
  {/each}
</nav>

<style>
  .q-tabbar {
    flex: none; display: flex; position: relative; z-index: 4;
    padding: 0 var(--safe-right, 0px) max(var(--safe-bottom, 0px), 8px) var(--safe-left, 0px);
    background: var(--q-tabbg); -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px);
    border-top: 1px solid var(--q-hairline);
  }
  .it {
    appearance: none; border: 0; background: none; cursor: pointer; flex: 1; min-width: 0; min-height: 49px; padding: 5px 2px 0;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
    color: var(--q-muted); font: var(--q-w) var(--q-fs-xs)/1.2 var(--q-font); letter-spacing: .02em; -webkit-tap-highlight-color: transparent;
  }
  .it span { white-space: nowrap; }
  .it.on { color: var(--q-accent-ink); font-weight: var(--q-w-b); }
  .it:focus-visible { outline: 2px solid var(--q-accent); outline-offset: -4px; border-radius: 10px; }
</style>
