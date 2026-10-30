<script lang="ts">
  // しまフォン → 村人: my villager (roster radios) and its name. The name field is seeded once, when the app opens:
  // the store recomputes `view` on every tick, sync and tap, and must never overwrite what is being typed (round 8).
  // Picker: a search field (name / species / personality, ja or en: villagers/search.ts) over the icon grid, which
  // flows in the phone's one scroller (round 10 M2: no scroller inside the scroller); icons load lazily as they scroll in. The chosen villager stays in the tab order even when filtered out of view.
  // Two groups in one radiogroup: とくべつ (たぬきち, しずえ…) first, then the villagers by species; a heading only shows
  // over a group the search left non-empty.
  import { untrack } from 'svelte';
  import type { WeekView } from '#lib/types.ts';
  import Avatar from '../characters/Avatar.svelte';
  import Villager from '../characters/Villager.svelte';
  import { roving } from '../ui/roving.ts';
  import { setVillagerName, setVillager } from '#lib/store/actions.ts';
  import { ROSTER, resolveLook, type RosterId } from '#lib/villagers/roster.ts';
  import { searchVillagers } from '#lib/villagers/search.ts';
  import { PERSONALITIES, SPECIAL, SPECIES } from '#lib/villagers/species.ts';
  import { t, i18n } from '#lib/i18n/index.ts';

  let { view }: { view: WeekView } = $props();

  const me = $derived(view.people[view.me]);
  /** My current roster villager (prefs `villager`, else the per-person default). */
  const current = $derived(resolveLook({ villager: me.villager, person: view.me }).id);
  const lang = $derived(i18n.locale === 'ja' ? 0 : 1);
  const vName = (id: RosterId) => (lang === 0 ? ROSTER[id].nameJa : ROSTER[id].nameEn);
  const vKind = (id: RosterId) => {
    const { species, personality } = ROSTER[id];
    return species && personality ? `${SPECIES[species][lang]} · ${PERSONALITIES[personality][lang]}` : SPECIAL[lang];
  };
  let name = $state(untrack(() => me.villagerName));
  let query = $state('');
  const shown = $derived(searchVillagers(query));
  const groups = $derived([
    { label: SPECIAL[lang], ids: shown.filter((id) => ROSTER[id].special) },
    { label: t('phone.villager.villagers'), ids: shown.filter((id) => !ROSTER[id].special) }
  ].filter((g) => g.ids.length));
  /** The radio in the tab order: the chosen one if it is shown, else the first shown. */
  const tabStop = $derived(shown.includes(current) ? current : shown[0]);

  function saveName() {
    if (name.trim() && name.trim() !== me.villagerName) setVillagerName(name);
  }
  // Closing the phone (✕, Esc) while the field is focused may not blur it first: save on the way out too.
  $effect(() => () => untrack(saveName));
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
    <input class="name" type="text" maxlength="12" data-sfx="none" bind:value={name} onblur={saveName}
      onkeydown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()} enterkeyhint="done" />
  </label>
</div>
<label class="search">
  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.6" /><path d="M15.5 15.5 20 20" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" /></svg>
  <span class="sr-only">{t('phone.villager.search')}</span>
  <input type="search" data-sfx="none" bind:value={query} placeholder={t('phone.villager.search')} enterkeyhint="search" autocomplete="off" spellcheck="false"
    onkeydown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()} />
</label>
<div class="scroll">
  {#if shown.length}
    <div role="radiogroup" aria-label={t('phone.app.villager')} {@attach roving}>
      {#each groups as g (g.label)}
        <h3 class="grp">{g.label}</h3>
        <div class="roster">
          {#each g.ids as id (id)}
            <button type="button" class="rv" role="radio" aria-checked={current === id} tabindex={tabStop === id ? 0 : -1} aria-label={vName(id)}
              title={vName(id)} data-sfx={current === id ? 'none' : 'tick'} onclick={() => current !== id && setVillager(id)}>
              <Avatar person={view.me} villager={id} size={64} />
              {#if current === id}<svg class="ck" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check" /></svg>{/if}
            </button>
          {/each}
        </div>
      {/each}
    </div>
  {:else}
    <p class="none" role="status">{t('phone.villager.none')}</p>
  {/if}
</div>

<style>
  .preview { display: flex; align-items: flex-end; gap: 14px; }
  .vn { font-size: var(--fs-s); font-weight: 700; color: var(--text); text-align: center; }
  .vk { margin-top: -4px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); text-align: center; line-height: 1.25; }
  .pv { width: 88px; display: grid; gap: 4px; justify-items: center; flex: none; animation: if-pop var(--dur-pop) var(--ease-bounce) both; }
  .namefield { flex: 1; min-width: 0; display: grid; gap: 6px; padding-bottom: 20px; }
  .namefield span { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .name {
    width: 100%; min-height: 52px; border-radius: var(--r-btn); border: 0;
    background: var(--c-card); color: var(--c-ink); padding: 0 14px; font-weight: 700; box-shadow: inset 0 0 0 2px var(--c-edge), inset 0 4px 0 var(--c-lip);
  }
  .search {
    display: flex; align-items: center; gap: 8px; margin: 12px 0 10px; min-height: 48px; padding: 0 14px;
    border-radius: 999px; background: var(--c-card); color: var(--c-ink); box-shadow: inset 0 0 0 2px var(--c-edge), inset 0 4px 0 var(--c-lip);
  }
  .search svg { width: 20px; height: 20px; flex: none; opacity: .55; }
  .search input { flex: 1; min-width: 0; min-height: 44px; border: 0; background: none; color: inherit; font: 700 var(--fs-input) var(--font-ui); outline: none; }
  /* the clear ✕ in ink, not the browser's blue (round 21) */
  .search input::-webkit-search-cancel-button {
    -webkit-appearance: none; appearance: none; width: 18px; height: 18px; cursor: pointer; background: var(--c-ink-soft);
    -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M6 6l12 12M18 6 6 18' stroke='%23000' stroke-width='3.2' stroke-linecap='round'/%3E%3C/svg%3E") center / contain no-repeat;
    mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M6 6l12 12M18 6 6 18' stroke='%23000' stroke-width='3.2' stroke-linecap='round'/%3E%3C/svg%3E") center / contain no-repeat;
  }
  .search input::placeholder { color: color-mix(in srgb, var(--c-ink) 45%, transparent); }
  .search:focus-within { box-shadow: inset 0 0 0 2px var(--c-edge), inset 0 4px 0 var(--c-lip), 0 0 0 3px var(--focus); }
  .scroll { margin: 0 -4px; padding: 6px 4px; }
  .none { margin: 24px 0; text-align: center; font-weight: 700; color: var(--text-soft); }
  .grp { margin: 6px 4px 8px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .grp:not(:first-child) { margin-top: 14px; }
  /* round 21: the heads are sized so the column gaps match the 12px row gap (at 375 five 64px heads overlapped by 5px;
     at 390 they sat 2.5px apart): five 56px heads up to 419px wide, five 64px from 420, four 56px under 360 */
  .roster { display: grid; grid-template-columns: repeat(5, 56px); justify-content: space-between; row-gap: 12px; padding: 4px 4px 8px; }
  .rv :global(.av) { --s: 56px !important; }
  @media (min-width: 420px) {
    .roster { grid-template-columns: repeat(5, 64px); }
    .rv :global(.av) { --s: 64px !important; }
  }
  @media (max-width: 359px) {
    .roster { grid-template-columns: repeat(4, 56px); }
  }
  .rv {
    appearance: none; cursor: pointer; border: 0; padding: 0; background: none; border-radius: 50%; position: relative;
    box-shadow: 0 0 0 3px transparent; transition: transform var(--dur-base) var(--ease-bounce), box-shadow var(--dur-quick);
  }
  .rv:active { transform: scale(1.06, .92); transition-duration: var(--dur-tap); }
  .rv[aria-checked='true'] { box-shadow: 0 0 0 4px var(--c-leaf-edge); }
  .ck {
    position: absolute; right: -4px; bottom: -4px; width: 20px; height: 20px; padding: 3px; border-radius: 50%;
    background: var(--c-leaf); color: var(--c-ink);
  }
</style>
