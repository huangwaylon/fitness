<script lang="ts">
  // Who made a shared マイ食品 or マイレシピ (someone else's: their avatar and 「Nさんの…」, over the name).
  import Avatar from '../characters/Avatar.svelte';
  import { t } from '#lib/i18n/index.ts';
  import type { Who } from '#lib/types.ts';

  let { owner, mark }: { owner: { who: Who; name: string; villager: string | null }; mark: 'custom' | 'recipe' } = $props();
</script>

<p class="who" {...{ [`data-${mark}-by`]: owner.who }}><span class="av" aria-hidden="true"><Avatar worn person={owner.who} villager={owner.villager} size={22} /></span>{t(mark === 'custom' ? 'food.my.by' : 'food.rcp.by', { name: owner.name })}</p>

<style>
  .who { margin: 0; display: flex; align-items: center; gap: 6px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .av { display: flex; }
</style>
