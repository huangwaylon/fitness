<script lang="ts" generics="T extends string">
  // A sheet's bottom tabs (docs/design.md "Unified kit"): a cream dock plate (--card, a stitch along its top) at the
  // foot of a full sheet (the caller places it: the last child of the flex column), 56px + the home indicator's safe
  // area; each tab its icon over its label, the shown one on a yuzu pill. `attr` names each tab's data attribute
  // (`data-trip-tab="map"`), what the specs read. A tap on the shown tab is silent. `mark`: drawn on each tab's icon's
  // corner (ボット's status dots), on a cream plate (`--plate`); a tab's `name`: its whole name to VoiceOver (「ジム、順調」),
  // `attrs` its more data-*. `panel`: the id of the one panel the tabs switch (ボット, 旅行's list): a tablist then
  // (role tab, aria-selected, aria-controls; ← → Home End move the focus, Enter or Space picks), else a nav whose
  // shown tab is aria-current.
  //   <TabBar items={[{ id: 'days', label: '日程', icon: 'calendar' }, …]} value={tab} label="ページ" attr="trip-tab" onpick={…} />
  import type { Snippet } from 'svelte';
  import Icon, { type IconName } from './Icon.svelte';

  interface Props {
    items: readonly { id: T; label: string; icon: IconName; name?: string; attrs?: Record<string, string | undefined> }[];
    /** A tab's corner mark, by its id. */
    mark?: Snippet<[T]>;
    value: T;
    /** The bar's accessible name. */
    label: string;
    attr: string;
    onpick: (id: T) => void;
    /** The panel's id: the bar is its tablist. */
    panel?: string;
  }
  let { items, value, label, attr, onpick, panel, mark }: Props = $props();
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
    <span class="icon"><Icon name={it.icon} size={22} soft={value === it.id} />{#if mark}<span class="dot">{@render mark(it.id)}</span>{/if}</span>
    <span>{it.label}</span>
  </span>
{/snippet}

{#if panel}
  <div class="tabbar" role="tablist" aria-label={label} bind:this={bar} tabindex="-1" onkeydown={key}>
    {#each items as it (it.id)}
      <button type="button" class="it" role="tab" id={tid(it.id)} aria-selected={value === it.id} aria-controls={panel} tabindex={value === it.id ? 0 : -1}
        aria-label={it.name} {...it.attrs} {...{ [`data-${attr}`]: it.id }} data-sfx={value === it.id ? 'none' : 'tick'} onclick={() => onpick(it.id)}>
        {@render face(it)}
      </button>
    {/each}
  </div>
{:else}
  <nav class="tabbar" aria-label={label}>
    {#each items as it (it.id)}
      <button type="button" class="it" aria-current={value === it.id ? 'page' : undefined}
        aria-label={it.name} {...it.attrs} {...{ [`data-${attr}`]: it.id }} data-sfx={value === it.id ? 'none' : 'tick'} onclick={() => onpick(it.id)}>
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
  /* a mark: the icon's top right corner, ringed in the plate's cream (on the selected pill too: a yuzu mark reads) */
  .dot { position: absolute; top: -4px; right: -7px; display: flex; line-height: 0; --plate: var(--card); }
  .it[aria-current='page'], .it[aria-selected='true'] { color: var(--c-ink); }
  .it[aria-current='page'] .pill, .it[aria-selected='true'] .pill { background: var(--c-yuzu); box-shadow: 0 2px 0 var(--c-yuzu-lip); }
  .it[aria-current='page'] .dot, .it[aria-selected='true'] .dot { --plate: var(--c-cream); }
  .it:active .pill { transform: translateY(1px) scale(1.04, .96); }
  .it:focus-visible { outline-offset: -4px; }
</style>
