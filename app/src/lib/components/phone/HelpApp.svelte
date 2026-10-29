<script lang="ts">
  // しまフォン → あそびかた: the four things to know, one card each.
  import type { WeekView } from '#lib/types.ts';
  import Avatar from '../Avatar.svelte';
  import OfficialArt from '../OfficialArt.svelte';
  import { fruitArt } from '#lib/client/assets.ts';
  import { t } from '#lib/i18n/index.ts';

  let { view }: { view: WeekView } = $props();
</script>

<ul class="howto">
  <li class="card">
    <span class="hi"><Avatar person={view.me} villager={view.people[view.me].villager} size={44} /></span>{t('help.row.checkin')}
  </li>
  <li class="card">
    <span class="hi"><OfficialArt key={fruitArt('peach')} size={36} /></span>{t('help.row.fruit')}
  </li>
  <li class="card">
    <span class="hi"><Avatar person={view.partner} villager={view.people[view.partner].villager} size={44} /></span>{t('help.row.partner')}
  </li>
  <li class="card">
    <span class="hi"><OfficialArt key="money/bells" size={36} /></span>{t('help.row.harvest')}
  </li>
</ul>

<style>
  .howto { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
  .howto li { display: flex; align-items: center; gap: 14px; min-height: 64px; padding: 8px 14px; font-weight: 700; font-size: var(--fs-body); line-height: 1.3; }
  .hi { width: 44px; display: grid; place-items: center; flex: none; }
</style>
