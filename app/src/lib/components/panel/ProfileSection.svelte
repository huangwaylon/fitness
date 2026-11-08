<script lang="ts">
  // せってい → プロフィール (docs/design.md "Profile"): whose (けんこう's dropdown: the two members, this phone's first;
  // the guest only its own), then せいべつ (おとこ · おんな · ひみつ), たんじょうび (a date field, the age beside it) and the
  // BMI standard (アジア · WHO: the BMI card's category; not the guest's, who has no body data); no notes under them
  // (the user, 2026-11-08). Either member sets either's; the record shows a member's to the two members alone and the guest's
  // to the guest alone (contract/guest.ts rowsFor).
  import type { Who, WeekView } from '#lib/types.ts';
  import { roving } from '../ui/roving.ts';
  import Pick from '../health/Pick.svelte';
  import { BIRTH, latestBirth, SEXES, BMI_STDS, type ProfileKey } from '#lib/contract/profile.ts';
  import { ageAt, profileOf } from '#lib/model/profile.ts';
  import { setProfile } from '#lib/store/actions.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { localDateAt } from '#lib/time/dates.ts';
  import { t } from '#lib/i18n/index.ts';

  let { view }: { view: WeekView } = $props();

  const guest = $derived(view.viewer === 'G');
  /** Whose profile is shown: this phone's person on opening (the guest: its own, always). */
  let picked = $state<Who | null>(null);
  const who = $derived<Who>(guest ? 'G' : (picked ?? view.me));
  const m = $derived(week.model);
  const prof = $derived(m ? profileOf(m.state, who) : null);
  const age = $derived(m ? ageAt(m.state, who, m.now) : null);
  const max = $derived(m ? latestBirth(localDateAt(m.now)) : undefined);
  const name = (p: Who) => (p === 'G' ? view.guest.villagerName : view.people[p].villagerName);

  const set = (key: ProfileKey, v: string | null) => setProfile(who, key, v);
  function birth(e: Event & { currentTarget: HTMLInputElement }) {
    const v = e.currentTarget.value;
    // cleared, or a date the record takes; anything else (typed past the range) goes back to what's held
    if (!set('birth', v || null).ok) e.currentTarget.value = prof?.birth ?? '';
  }
</script>

{#if prof}
  <div class="card prof" data-profile={who}>
    <div class="head">
      {#if guest}
        <span class="nm">{name('G')}</span>
      {:else}
        <span class="pk"><Pick kind="who" value={who} options={[view.me, view.partner].map((id) => ({ id, label: name(id) }))} label={t('profile.who')}
          person={{ p: who, villager: view.people[who as 'A' | 'B'].villager }} onpick={(p) => (picked = p)} /></span>
      {/if}
      <span class="age" data-profile-age>{age === null ? '' : t('profile.age', { n: age })}</span>
    </div>
    <div class="row">
      <span class="lbl" id="prof-sex">{t('profile.sex')}</span>
      <div class="chips" role="radiogroup" aria-labelledby="prof-sex" {@attach roving}>
        {#each [...SEXES, null] as s (s)}
          {@const on = prof.sex === s}
          <button type="button" class="chip" role="radio" aria-checked={on} tabindex={on ? 0 : -1} data-sex={s ?? 'none'} data-sfx={on ? 'none' : 'tick'}
            onclick={() => !on && set('sex', s)}>{t(`profile.sex.${s ?? 'none'}`)}</button>
        {/each}
      </div>
    </div>
    <div class="row">
      <label class="lbl" for="prof-birth">{t('profile.birth')}</label>
      <input id="prof-birth" type="date" min={BIRTH.from} {max} value={prof.birth ?? ''} data-birth data-sfx="none" onchange={birth} />
    </div>
    {#if !guest}
      <div class="row">
        <span class="lbl" id="prof-bmi">{t('profile.bmiStd')}</span>
        <div class="chips" role="radiogroup" aria-labelledby="prof-bmi" {@attach roving}>
          {#each BMI_STDS as b (b)}
            {@const on = prof.bmiStd === b}
            <button type="button" class="chip" role="radio" aria-checked={on} tabindex={on ? 0 : -1} data-bmi-std={b} data-sfx={on ? 'none' : 'tick'}
              onclick={() => !on && set('bmiStd', b)}>{t(`profile.bmiStd.${b}`)}</button>
          {/each}
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .prof { display: grid; gap: 8px; padding: 10px 14px 12px; }
  .head { display: flex; align-items: center; gap: 10px; min-height: var(--hit); }
  .pk { flex: 0 1 auto; min-width: 0; display: flex; }
  .nm { flex: 1; font-weight: 700; }
  .age { margin-left: auto; flex: none; font-weight: 700; font-size: var(--fs-body); }
  .row { display: flex; align-items: center; gap: 10px; min-height: var(--hit); }
  .lbl { flex: none; width: 6.5em; font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); }
  .row .chips { flex: 1; min-width: 0; }
  /* 16px so Safari doesn't zoom; the app's field look */
  input[type='date'] {
    flex: 1; min-width: 0; min-height: var(--hit); padding: 6px 12px; border: 0; border-radius: var(--r-btn); appearance: none;
    font: 700 var(--fs-input)/1.1 var(--font-num); color: var(--text); background: var(--ctl); box-shadow: inset 0 0 0 2px var(--edge);
  }
  input[type='date']:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
</style>
