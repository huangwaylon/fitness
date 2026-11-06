<script lang="ts" generics="T extends string">
  // A sheet's bottom tabs (docs/design.md "Unified kit"): a cream dock plate (--card, a stitch along its top) at the
  // foot of a full sheet (the caller places it: the last child of the flex column), 56px + the home indicator's safe
  // area; each tab its icon over its label, the shown one on a yuzu pill. `attr` names each tab's data attribute
  // (`data-trip-tab="map"`), what the specs read. A tap on the shown tab is silent.
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

<nav class="tabbar" aria-label={label}>
  {#each items as it (it.id)}
    <button type="button" class="it" aria-current={value === it.id ? 'page' : undefined}
      {...{ [`data-${attr}`]: it.id }} data-sfx={value === it.id ? 'none' : 'tick'} onclick={() => onpick(it.id)}>
      <span class="pill"><Icon name={it.icon} size={22} soft={value === it.id} /><span>{it.label}</span></span>
    </button>
  {/each}
</nav>

<style>
  .tabbar {
    flex: none; display: flex; gap: 4px; position: relative; z-index: 4;
    padding: 4px calc(8px + var(--safe-right)) max(var(--safe-bottom), 6px) calc(8px + var(--safe-left));
    background: var(--card); box-shadow: 0 -2px 0 var(--lip);
  }
  .tabbar::before { content: ''; position: absolute; top: 3px; left: 12px; right: 12px; border-top: 1.5px dashed var(--stitch); pointer-events: none; }
  .it {
    appearance: none; border: 0; background: none; cursor: pointer; flex: 1; min-width: 0; min-height: 56px; padding: 4px 0 0;
    display: grid; place-items: center; color: var(--text-soft); -webkit-tap-highlight-color: transparent;
  }
  .pill {
    display: flex; flex-direction: column; align-items: center; gap: 1px; min-width: 64px; padding: 4px 10px 3px; border-radius: var(--r-btn);
    font: 700 var(--fs-xs)/1.2 var(--font-ui); white-space: nowrap;
    transition: background-color var(--dur-quick), transform var(--dur-base) var(--ease-bounce);
  }
  .it[aria-current='page'] { color: var(--c-ink); }
  .it[aria-current='page'] .pill { background: var(--c-yuzu); box-shadow: 0 2px 0 var(--c-yuzu-lip); }
  .it:active .pill { transform: translateY(1px) scale(1.04, .96); }
  .it:focus-visible { outline-offset: -4px; }
  @media (prefers-reduced-motion: reduce) { .it:active .pill { transform: none; } }
</style>
