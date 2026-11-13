<script lang="ts" generics="T extends string">
  // A sheet's bottom tabs (docs/design.md "Unified kit"): a cream dock plate (--card, a stitch along its top) at the
  // foot of a full sheet (the caller places it: the last child of the flex column), 56px + the home indicator's safe
  // area; each tab its icon over its label, the shown one on a yuzu pill. `attr` names each tab's data attribute
  // (`data-trip-tab="map"`), what the specs read. A tap on the shown tab is silent. A tab's `dot`: a small coral dot on
  // its icon, `note` saying it to VoiceOver. `panel`: the id of the one panel the tabs switch (ボット): a tablist then
  // (role tab, aria-selected, aria-controls; ← → Home End move the focus, Enter or Space picks), else a nav whose
  // shown tab is aria-current.
  //   <TabBar items={[{ id: 'days', label: '日程', icon: 'calendar' }, …]} value={tab} label="ページ" attr="trip-tab" onpick={…} />
  import Icon, { type IconName } from './Icon.svelte';

  interface Props {
    items: readonly { id: T; label: string; icon: IconName; dot?: boolean; note?: string }[];
    value: T;
    /** The bar's accessible name. */
    label: string;
    attr: string;
    onpick: (id: T) => void;
    /** The panel's id: the bar is its tablist. */
    panel?: string;
  }
  let { items, value, label, attr, onpick, panel }: Props = $props();
  let bar: HTMLElement | undefined = $state();

  /** A tab's id (the panel's aria-labelledby: `${attr}-${id}`). */
  const tid = (id: T) => `${attr}-${id}`;

  function key(e: KeyboardEvent) {
    const tabs = [...(bar?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [])];
    const i = tabs.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    const to = e.key === 'ArrowRight' ? (i + 1) % tabs.length : e.key === 'ArrowLeft' ? (i + tabs.length - 1) % tabs.length
      : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : -1;
    if (to < 0) return;
    e.preventDefault();
    tabs[to].focus();
  }
</script>

{#snippet face(it: Props['items'][number])}
  <span class="pill">
    <span class="icon"><Icon name={it.icon} size={22} soft={value === it.id} />{#if it.dot}<i class="dot" data-tab-dot aria-hidden="true"></i>{/if}</span>
    <span>{it.label}</span>{#if it.dot && it.note}<span class="sr-only">{` ${it.note}`}</span>{/if}
  </span>
{/snippet}

{#if panel}
  <div class="tabbar" role="tablist" aria-label={label} bind:this={bar} tabindex="-1" onkeydown={key}>
    {#each items as it (it.id)}
      <button type="button" class="it" role="tab" id={tid(it.id)} aria-selected={value === it.id} aria-controls={panel} tabindex={value === it.id ? 0 : -1}
        {...{ [`data-${attr}`]: it.id }} data-sfx={value === it.id ? 'none' : 'tick'} onclick={() => onpick(it.id)}>
        {@render face(it)}
      </button>
    {/each}
  </div>
{:else}
  <nav class="tabbar" aria-label={label}>
    {#each items as it (it.id)}
      <button type="button" class="it" aria-current={value === it.id ? 'page' : undefined}
        {...{ [`data-${attr}`]: it.id }} data-sfx={value === it.id ? 'none' : 'tick'} onclick={() => onpick(it.id)}>
        {@render face(it)}
      </button>
    {/each}
  </nav>
{/if}

<style>
  .tabbar {
    flex: none; display: flex; gap: 4px; position: relative; z-index: 4;
    padding: 4px calc(8px + var(--safe-right)) max(var(--safe-bottom), 6px) calc(8px + var(--safe-left));
    background: var(--card); box-shadow: 0 -2px 0 var(--lip);
  }
  .tabbar:focus { outline: none; }
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
  .icon { position: relative; display: flex; }
  /* needs a person: a small coral dot on the icon's top right, ringed in the plate's cream */
  .dot { position: absolute; top: -2px; right: -5px; width: 9px; height: 9px; border-radius: 50%; background: var(--c-coral); box-shadow: 0 0 0 2px var(--card); }
  .it[aria-current='page'], .it[aria-selected='true'] { color: var(--c-ink); }
  .it[aria-current='page'] .pill, .it[aria-selected='true'] .pill { background: var(--c-yuzu); box-shadow: 0 2px 0 var(--c-yuzu-lip); }
  .it[aria-selected='true'] .dot { box-shadow: 0 0 0 2px var(--c-yuzu); }
  .it:active .pill { transform: translateY(1px) scale(1.04, .96); }
  .it:focus-visible { outline-offset: -4px; }
  @media (prefers-reduced-motion: reduce) { .it:active .pill { transform: none; } }
</style>
