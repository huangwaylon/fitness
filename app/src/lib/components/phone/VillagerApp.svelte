<script lang="ts">
  // しまフォン → 村人: my villager (roster radios) and its name. The name field is seeded once, when the app opens:
  // the store recomputes `view` on every tick, sync and tap, and must never overwrite what is being typed (round 8).
  // Picker: a search field (name / species / personality, ja or en: villagers/search.ts) over a scrolling icon grid;
  // icons load lazily as they scroll in. The chosen villager stays in the tab order even when filtered out of view.
  import { untrack } from 'svelte';
  import type { WeekView } from '#lib/types.ts';
  import Avatar from '../characters/Avatar.svelte';
  import Villager from '../characters/Villager.svelte';
  import { roving } from '../ui/roving.ts';
  import { setVillagerName, setVillager } from '#lib/store/actions.ts';
  import { ROSTER, resolveLook, type RosterId } from '#lib/villagers/roster.ts';
  import { searchVillagers } from '#lib/villagers/search.ts';
  import { PERSONALITIES, SPECIES } from '#lib/villagers/species.ts';
  import { t, i18n } from '#lib/i18n/index.ts';

  let { view }: { view: WeekView } = $props();

  const me = $derived(view.people[view.me]);
  /** My current roster villager (prefs `villager`, else the per-person default). */
  const current = $derived(resolveLook({ villager: me.villager, person: view.me }).id);
  const lang = $derived(i18n.locale === 'ja' ? 0 : 1);
  const vName = (id: RosterId) => (lang === 0 ? ROSTER[id].nameJa : ROSTER[id].nameEn);
  const vKind = (id: RosterId) => `${SPECIES[ROSTER[id].species][lang]} · ${PERSONALITIES[ROSTER[id].personality][lang]}`;
  let name = $state(untrack(() => me.villagerName));
  let query = $state('');
  const shown = $derived(searchVillagers(query));
  /** The radio in the tab order: the chosen one if it is shown, else the first shown. */
  const tabStop = $derived(shown.includes(current) ? current : shown[0]);

  function saveName() {
    if (name.trim() && name.trim() !== me.villagerName) setVillagerName(name);
  }
</script>

<div class="preview">
  {#key current}
    <span class="pv">
      <Villager person={view.me} villager={current} size={88} head={false} expression="cheer" eager />
      <span class="vn">{vName(current)}</span>
      <span class="vk">{vKind(current)}</span>
    </span>
  {/key}
  <label class="namefield">
    <span>{t('phone.name.label')}</span>
    <input class="name" type="text" maxlength="12" bind:value={name} onblur={saveName}
      onkeydown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()} enterkeyhint="done" />
  </label>
</div>
<label class="search">
  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.6" /><path d="M15.5 15.5 20 20" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" /></svg>
  <span class="sr-only">{t('phone.villager.search')}</span>
  <input type="search" bind:value={query} placeholder={t('phone.villager.search')} enterkeyhint="search" autocomplete="off" spellcheck="false"
    onkeydown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()} />
</label>
<div class="scroll">
  {#if shown.length}
    <div class="roster" role="radiogroup" aria-label={t('phone.app.villager')} {@attach roving}>
      {#each shown as id (id)}
        <button type="button" class="rv" role="radio" aria-checked={current === id} tabindex={tabStop === id ? 0 : -1} aria-label={vName(id)}
          title={vName(id)} onclick={() => current !== id && setVillager(id)}>
          <Avatar person={view.me} villager={id} size={64} />
          {#if current === id}<svg class="ck" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check" /></svg>{/if}
        </button>
      {/each}
    </div>
  {:else}
    <p class="none" role="status">{t('phone.villager.none')}</p>
  {/if}
</div>

<style>
  .preview { display: flex; align-items: flex-end; gap: 14px; }
  .vn { font-size: var(--fs-s); font-weight: 700; color: var(--text); text-align: center; }
  .vk { margin-top: -4px; font-size: 11px; font-weight: 700; color: var(--text-soft); text-align: center; line-height: 1.25; }
  .pv { width: 88px; display: grid; gap: 4px; justify-items: center; flex: none; animation: if-pop var(--dur-pop) var(--ease-bounce) both; }
  .namefield { flex: 1; min-width: 0; display: grid; gap: 6px; padding-bottom: 20px; }
  .namefield span { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .name {
    width: 100%; min-height: 52px; border-radius: var(--r-btn); border: 0;
    background: var(--c-cream); color: var(--c-ink); padding: 0 14px; font-weight: 700; box-shadow: inset 0 3px 0 var(--c-lip);
  }
  .search {
    display: flex; align-items: center; gap: 8px; margin: 12px 0 10px; min-height: 48px; padding: 0 14px;
    border-radius: 999px; background: var(--c-cream); color: var(--c-ink); box-shadow: inset 0 3px 0 var(--c-lip);
  }
  .search svg { width: 20px; height: 20px; flex: none; opacity: .55; }
  .search input { flex: 1; min-width: 0; min-height: 44px; border: 0; background: none; color: inherit; font: 700 var(--fs-body) var(--font-ui); outline: none; }
  .search input::placeholder { color: color-mix(in srgb, var(--c-ink) 45%, transparent); }
  .search:focus-within { box-shadow: inset 0 3px 0 var(--c-lip), 0 0 0 3px var(--c-leaf); }
  /* The grid scrolls on its own so the preview and the search stay in view (about three rows at 320×568). */
  .scroll { max-height: min(46dvh, 400px); overflow-y: auto; overscroll-behavior: contain; margin: 0 -4px; padding: 6px 4px; border-radius: 16px; }
  .none { margin: 24px 0; text-align: center; font-weight: 700; color: var(--text-soft); }
  .roster { display: grid; grid-template-columns: repeat(5, 64px); justify-content: space-between; row-gap: 12px; padding: 4px 4px 8px; }
  @media (max-width: 374px) {
    .roster { grid-template-columns: repeat(4, 56px); }
    .rv :global(.av) { --s: 56px !important; }
  }
  .rv {
    appearance: none; cursor: pointer; border: 0; padding: 0; background: none; border-radius: 50%; position: relative;
    box-shadow: 0 0 0 3px transparent; transition: transform var(--dur-base) var(--ease-bounce), box-shadow var(--dur-quick);
  }
  .rv:active { transform: scale(1.06, .92); transition-duration: var(--dur-tap); }
  .rv[aria-checked='true'] { box-shadow: 0 0 0 4px var(--c-leaf); }
  .ck {
    position: absolute; right: -4px; bottom: -4px; width: 20px; height: 20px; padding: 3px; border-radius: 50%;
    background: var(--c-leaf); color: var(--c-ink);
  }
</style>
