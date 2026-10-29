<script lang="ts">
  // へんこう履歴: every accepted edit (both people), newest first: when, who, what, before → after.
  import type { PersonId } from '#lib/types.ts';
  import type { EditLog } from '#lib/model/history.ts';
  import Avatar from '../Avatar.svelte';
  import { dayTitle, editText, stampOf } from './fmt.ts';
  import { t } from '#lib/i18n/index.ts';

  let { edits, villagers, withDate = false }: { edits: EditLog[]; villagers: Record<PersonId, string | null>; withDate?: boolean } = $props();
</script>

<section class="log" aria-label={t('kiroku.changes')}>
  <h4>{t('kiroku.changes')}</h4>
  {#if edits.length === 0}
    <p class="none">{t('kiroku.noChanges')}</p>
  {:else}
    <ul>
      {#each edits as e (e.at + e.by + e.field + (e.subject ?? ''))}
        {@const x = editText(e)}
        <li>
          <span class="when money">{stampOf(e.at)}</span>
          <Avatar person={e.by} villager={villagers[e.by]} size={22} />
          <span class="what">{#if withDate}<small>{dayTitle(e.date)}</small>{/if}{x.field} {#if e.before !== null}<s>{x.before}</s> → {/if}<b>{x.after}</b></span>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .log { margin: 4px 2px 8px; }
  h4 { margin: 0 0 8px; font-size: var(--fs-body); }
  .none { margin: 0; font-size: var(--fs-s); color: var(--text-soft); font-weight: 700; }
  ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  li { display: flex; align-items: center; gap: 8px; font-size: var(--fs-s); font-weight: 700; }
  .when { flex: none; width: 6.4em; font-size: var(--fs-s); color: var(--text-soft); }
  .what { flex: 1; min-width: 0; line-height: 1.35; }
  .what small { display: block; font-size: 11px; color: var(--text-soft); }
  s { color: var(--text-soft); text-decoration-thickness: 1.5px; }
</style>
