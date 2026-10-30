<script lang="ts">
  // しまフォン → 通信: when each of us last synced, and いま同期. (No "reload everything": a hand edit of the sheet changes
  // `rev`, and the next sync refetches everything by itself, sheets-architecture.md §2.1.)
  import type { WeekView } from '#lib/types.ts';
  import Avatar from '../characters/Avatar.svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import { formatSyncTime } from '#lib/i18n/format.ts';

  let { view }: { view: WeekView } = $props();
</script>

<div class="prows">
  {#each [view.people[view.me], view.people[view.partner]] as p (p.person)}
    <div class="prow static">
      <Avatar person={p.person} villager={p.villager} size={40} />
      <span class="prl">{p.villagerName}</span>
      <span class="money when">{formatSyncTime(p.lastSyncAt, view.today)}</span>
    </div>
  {/each}
  <button type="button" class="btn" aria-disabled={week.syncing} data-sfx="sync" onclick={() => week.refresh()}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-sync" /></svg>{week.syncing ? t('sync.syncing') : t('phone.syncNow')}
  </button>
</div>

<style>
  .when { font-size: var(--fs-body); color: var(--text-soft); white-space: nowrap; }
</style>
