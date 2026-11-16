<script lang="ts">
  // 設定 → プロフィール (docs/design.md "Profile"), settings' first section: one read-only row a person, 「ウェイ　男性・
  // 1990/1/1（35歳）」 (made-up). Locked (2026-11-15): nobody sets or clears it here, the record refuses every profile
  // pref. The same on every phone (the user, 2026-11-16): the two members and the guest, in that order (A, B, ゲスト);
  // the record sends everyone's profile to everyone (contract/guest.ts rowsFor). A value an old record never had is
  // named (性別なし, 生年月日なし); neither: 未設定. The name 15 / 500, the value 15 bold (the dense rows').
  import type { Who, WeekView } from '#lib/types.ts';
  import { ageAt, profileOf } from '#lib/model/profile.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { t } from '#lib/i18n/index.ts';

  let { view }: { view: WeekView } = $props();

  const whos: Who[] = ['A', 'B', 'G'];
  const name = (p: Who) => (p === 'G' ? view.guest.villagerName : view.people[p].villagerName);
  /** `1990/1/1`, both languages. */
  const ymd = (d: string) => `${d.slice(0, 4)}/${Number(d.slice(5, 7))}/${Number(d.slice(8, 10))}`;
  function line(p: Who): string {
    const m = week.model!;
    const { sex, birth } = profileOf(m.state, p);
    const age = ageAt(m.state, p, m.now);
    if (!sex && !birth) return t('profile.unset');
    return t('profile.line', {
      sex: t(`profile.sex.${sex ?? 'none'}`),
      birth: birth && age !== null ? t('profile.birth', { date: ymd(birth), n: age }) : t('profile.birth.none')
    });
  }
</script>

{#if week.model}
  <dl class="card dense">
    {#each whos as p (p)}
      <div class="row kv" data-profile={p}><dt>{name(p)}</dt><dd>{line(p)}</dd></div>
    {/each}
  </dl>
{/if}

<style>
  dl { margin: 0; }
  .row.kv > dt { font: 500 var(--fs-body)/1.3 var(--font-ui); color: var(--text); }
  dd { margin: 0; font: 700 var(--fs-body)/1.3 var(--font-ui); }
</style>
