<script lang="ts">
  // しまフォン → 村人: my villager (roster radios) and its name. The name field is seeded once, when the app opens:
  // the store recomputes `view` on every tick, sync and tap, and must never overwrite what is being typed (round 8).
  import { untrack } from 'svelte';
  import type { WeekView } from '#lib/types.ts';
  import Avatar from '../Avatar.svelte';
  import Villager from '../Villager.svelte';
  import { roving } from '../roving.ts';
  import { setVillagerName, setVillager } from '#lib/client/actions.ts';
  import { ROSTER, ROSTER_IDS, resolveLook } from '#lib/villagers/roster.ts';
  import { t, i18n } from '#lib/i18n/index.ts';

  let { view }: { view: WeekView } = $props();

  const me = $derived(view.people[view.me]);
  /** My current roster villager (prefs `villager`, else the per-person default). */
  const current = $derived(resolveLook({ villager: me.villager, person: view.me }).id);
  const vName = (id: string) => (i18n.locale === 'ja' ? ROSTER[id as keyof typeof ROSTER].nameJa : ROSTER[id as keyof typeof ROSTER].nameEn);
  let name = $state(untrack(() => me.villagerName));

  function saveName() {
    if (name.trim() && name.trim() !== me.villagerName) setVillagerName(name);
  }
</script>

<div class="preview">
  {#key current}
    <span class="pv">
      <Villager person={view.me} villager={current} size={88} head={false} expression="cheer" eager />
      <span class="vn">{vName(current)}</span>
    </span>
  {/key}
  <label class="namefield">
    <span>{t('phone.name.label')}</span>
    <input class="name" type="text" maxlength="12" bind:value={name} onblur={saveName}
      onkeydown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()} enterkeyhint="done" />
  </label>
</div>
<div class="roster" role="radiogroup" aria-label={t('phone.app.villager')} {@attach roving}>
  {#each ROSTER_IDS as id (id)}
    <button type="button" class="rv" role="radio" aria-checked={current === id} tabindex={current === id ? 0 : -1} aria-label={vName(id)}
      onclick={() => current !== id && setVillager(id)}>
      <Avatar person={view.me} villager={id} size={64} />
      {#if current === id}<svg class="ck" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check" /></svg>{/if}
    </button>
  {/each}
</div>

<style>
  .preview { display: flex; align-items: flex-end; gap: 14px; }
  .vn { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .pv { width: 88px; display: grid; gap: 4px; justify-items: center; flex: none; animation: if-pop var(--dur-pop) var(--ease-bounce) both; }
  .namefield { flex: 1; min-width: 0; display: grid; gap: 6px; padding-bottom: 20px; }
  .namefield span { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .name {
    width: 100%; min-height: 52px; border-radius: var(--r-btn); border: 0;
    background: var(--c-cream); color: var(--c-ink); padding: 0 14px; font-weight: 700; box-shadow: inset 0 3px 0 var(--c-lip);
  }
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
