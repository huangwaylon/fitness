<script lang="ts" generics="T extends string">
  // 健康 | ごはん, the health sheet's page switch in its title bar (docs/design.md "Kenkou"; NavBar's `middle`): one
  // cream track, each page its NH art and its name (always shown), the shown one on the yuzu thumb. Drawn 40px, taller
  // than the control pills under it (36) and joined, so it reads as the page, not a filter. `data-kenkou-tab` names
  // each (the specs); the shown one is aria-current="page", a tap on it silent.
  import OfficialArt from '../characters/OfficialArt.svelte';

  interface Props {
    /** `wide`: a flat art (the dumbbell) drawn by its width, 30px, not a 22px height. */
    items: readonly { id: T; label: string; art: string; wide?: boolean }[];
    value: T;
    /** The switch's accessible name. */
    label: string;
    onpick: (id: T) => void;
  }
  let { items, value, label, onpick }: Props = $props();
</script>

<nav class="ks" aria-label={label}>
  {#each items as it (it.id)}
    <button type="button" class="kb" aria-current={value === it.id ? 'page' : undefined} data-kenkou-tab={it.id}
      data-sfx={value === it.id ? 'none' : 'tick'} onclick={() => onpick(it.id)}>
      <span class="gi" aria-hidden="true">{#if it.wide}<OfficialArt key={it.art} width={30} eager />{:else}<OfficialArt key={it.art} size={22} eager />{/if}</span>{it.label}
    </button>
  {/each}
</nav>

<style>
  /* the track: the dock's cream plate (--card) inset in the bar, 40px drawn in the 44px hit */
  .ks { display: flex; gap: 2px; padding: 3px; margin: 2px auto; min-width: 0; border-radius: var(--r-pill); background: var(--card); box-shadow: inset 0 0 0 1.5px var(--lip), 0 2px 0 var(--lip); }
  .kb {
    appearance: none; border: 0; cursor: pointer; position: relative; flex: 1 1 auto; min-width: 0; height: 34px; padding: 0 14px 0 10px;
    border-radius: var(--r-pill); display: inline-flex; align-items: center; justify-content: center; gap: 6px; white-space: nowrap;
    font: 700 var(--fs-body)/1 var(--font-ui); color: var(--text-soft); background: none; -webkit-tap-highlight-color: transparent;
    transition: background-color var(--dur-quick);
  }
  /* 34px drawn, the hit the bar's 44 */
  .kb::after { content: ''; position: absolute; inset: -5px -1px; }
  .kb[aria-current='page'] { background: var(--c-yuzu); color: var(--c-ink); box-shadow: 0 2px 0 var(--c-yuzu-lip); }
  .kb:active { transform: translateY(1px); }
  .gi { display: inline-flex; height: 22px; flex: none; justify-content: center; align-items: center; line-height: 0; }
  /* a narrow phone (320): the names alone (they always show) */
  @container navbar (max-width: 340px) { .gi { display: none; } .kb { padding: 0 10px; } }
</style>
