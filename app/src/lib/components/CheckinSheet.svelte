<script lang="ts">
  // 今夜のチェック: my three habits for today (or yesterday, 48 h fill-in), saved on tap.
  // No snack chip (round 3). のんびりデー toggles today's Cozy Day. 正月: eating isn't scored, so it's "off".
  import Sheet from './Sheet.svelte';
  import Villager from './Villager.svelte';
  import { week } from '#lib/client/week.svelte.ts';
  import { checkin, cozyDay } from '#lib/client/actions.ts';
  import { t, addDays, weekdayShort, formatDate } from '#lib/i18n/index.ts';
  import { HOLIDAY } from '#lib/config/rules.ts';
  import { inMonthDayRange } from '#lib/scoring/dates.ts';

  let { open = $bindable(), onclose }: { open: boolean; onclose?: () => void } = $props();

  const ICONS: Record<string, { id: string; vb: string }> = {
    teishoku_lunch: { id: 'i-tray', vb: '0 0 40 40' },
    low_salt_day: { id: 'i-salt', vb: '0 0 40 40' },
    veg_two_meals: { id: 'i-veg', vb: '0 0 40 40' },
    eat_lunch: { id: 'i-bowl', vb: '0 0 48 48' },
    snack_swap: { id: 'i-snack', vb: '0 0 40 40' }
  };

  const view = $derived(week.view);
  const me = $derived(view ? view.people[view.me] : null);
  const today = $derived(view?.today ?? '');
  const yesterday = $derived(today ? addDays(today, -1) : '');
  let which = $state<'today' | 'yesterday'>('today');
  const date = $derived(which === 'today' ? today : yesterday);
  const ticks = $derived(me?.habits?.ticksByDate[date] ?? []);
  /** 正月: eating isn't scored, so no toggles to fill in (ADR 0011). */
  const newYearOff = $derived(date !== '' && inMonthDayRange(date, HOLIDAY.pearOff.from, HOLIDAY.pearOff.to));
  /** Yesterday can still be filled in (48 h): a neutral hint dot, never an alert colour (M10). */
  const yesterdayFillable = $derived((me?.habits?.ticksByDate[yesterday] ?? []).length === 0);
  let pop = $state<string | null>(null);

  function toggle(key: string) {
    const done = !ticks.includes(key);
    if (done) {
      pop = key;
      setTimeout(() => (pop = pop === key ? null : pop), 900);
    }
    checkin(date, key, done);
  }

  async function cozy() {
    if (!me) return;
    const r = await cozyDay(today, !me.isCozyToday);
    if (typeof r === 'object') week.showToast(t(r.message), 3600);
  }
</script>

<Sheet bind:open label={t('checkin.title')} {onclose}>
  {#if view && me}
    <div class="head">
      <span class="av"><Villager person={view.me} size={52} /></span>
      <h2>{which === 'today' ? t('checkin.title') : t('checkin.yesterday')}</h2>
      <div class="days" role="tablist">
        <button type="button" role="tab" class="day" class:fillable={yesterdayFillable} aria-selected={which === 'yesterday'}
          aria-label="{t('checkin.yesterday')} {formatDate(yesterday)}" onclick={() => (which = 'yesterday')}>{weekdayShort(yesterday)}</button>
        <button type="button" role="tab" class="day" aria-selected={which === 'today'}
          aria-label="{t('checkin.today')} {formatDate(today)}" onclick={() => (which = 'today')}>{weekdayShort(today)}</button>
      </div>
    </div>

    {#if newYearOff}
      <div class="off card">
        <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-cozy" /></svg>
        <p>{t('checkin.newYearOff')}</p>
      </div>
    {:else}
    <div class="habits">
      {#each me.habits?.keys ?? [] as key (key)}
        {@const on = ticks.includes(key)}
        {@const ic = ICONS[key] ?? ICONS.eat_lunch}
        <button type="button" class="habit" class:on role="switch" aria-checked={on} onclick={() => toggle(key)}>
          <svg class="ic" viewBox={ic.vb} aria-hidden="true"><use href="#{ic.id}" /></svg>
          <span class="txt">{t(`habit.${key}`)}{#if t(`habit.${key}.hint`)}<small>{t(`habit.${key}.hint`)}</small>{/if}</span>
          {#if pop === key}<svg class="plus" viewBox="0 0 24 24" aria-hidden="true"><use href="#f-pear" /></svg>{/if}
          <span class="switch" aria-hidden="true"></span>
        </button>
      {/each}
    </div>
    {/if}

    <div class="extras">
      {#if which === 'today'}
        <button type="button" class="chip cozy" aria-pressed={me.isCozyToday} onclick={cozy}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-cozy" /></svg>{t('checkin.cozy')}
        </button>
      {/if}
    </div>
  {/if}
</Sheet>

<style>
  .head { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
  .av { width: 56px; height: 56px; border-radius: var(--r-blob); background: color-mix(in srgb, var(--p-plum) 28%, var(--surface)); display: grid; place-items: center; flex: none; }
  h2 { font-size: var(--fs-h1); }
  .days { display: flex; gap: 4px; margin-left: auto; padding: 4px; border-radius: var(--r-pill); background: var(--c-paper-2); box-shadow: var(--sh-inset); }
  :global(:root[data-theme="night"]) .days { background: #24314F; }
  .day {
    appearance: none; cursor: pointer; min-width: 48px; min-height: 44px; padding: 0 10px; border-radius: var(--r-pill); border: 0;
    display: grid; place-items: center; font-weight: 700; font-size: var(--fs-body); position: relative;
    background: transparent; color: var(--text-soft); transition: background var(--dur-quick);
  }
  .day[aria-selected='true'] { background: var(--c-bubble); color: var(--c-ink); box-shadow: 0 2px 0 var(--c-stitch); }
  .day.fillable::after { content: ''; position: absolute; top: 5px; right: 6px; width: 8px; height: 8px; border-radius: 50%; background: var(--c-sky); }

  .habits { display: grid; gap: 12px; }
  .habit {
    appearance: none; cursor: pointer; text-align: left; position: relative; width: 100%; font: inherit;
    display: flex; align-items: center; gap: 14px; min-height: 78px; padding: 10px 16px; border-radius: var(--r-card);
    background: var(--c-paper); color: var(--c-ink); border: var(--bw) solid var(--paper-edge); box-shadow: 0 4px 0 var(--sand-deep);
    outline: 2px dashed var(--c-stitch); outline-offset: -7px;
    transition: transform var(--dur-base) var(--ease-bounce), background var(--dur-base);
    user-select: none; -webkit-user-select: none;
  }
  .habit:active { transform: translateY(3px) scale(1.02, .96); box-shadow: 0 1px 0 var(--sand-deep); transition-duration: var(--dur-tap); }
  .habit.on { background: #EAF7E6; border-color: var(--c-leaf); box-shadow: 0 4px 0 var(--c-leaf-lip); outline-color: rgba(95, 168, 98, .4); }
  .ic { width: 50px; height: 50px; flex: none; }
  /* Habit cards stay paper at night, so their switches keep the day colours. */
  .habit[role="switch"] .switch { background: var(--c-paper-2); border-color: var(--paper-edge); }
  .habit.on[role="switch"] .switch { background: var(--c-leaf); border-color: var(--c-leaf-lip); }
  .txt { flex: 1; line-height: 1.25; text-wrap: pretty; font-weight: 900; font-size: var(--fs-body-lg); }
  .txt small { display: block; font: 700 var(--fs-micro)/1.3 var(--font-ui); color: var(--c-ink-faint); margin-top: 2px; }
  .plus { position: absolute; right: 86px; top: 14px; width: 28px; height: 28px; animation: floatUp .9s var(--ease-soft) forwards; }

  .extras { display: flex; gap: 10px; margin-top: 16px; }
  .extras .chip { flex: 1; min-height: 52px; border-style: dashed; }
  .extras .chip svg { width: 26px; height: 26px; }
  .chip.cozy { background: var(--c-sky-soft); border-color: var(--c-sky); color: var(--c-ink-soft); box-shadow: 0 3px 0 var(--c-sky-lip); }
  .chip.cozy[aria-pressed='true'] { background: var(--c-sky); border-style: solid; color: var(--c-ink); }
  .off { display: grid; justify-items: center; gap: 8px; text-align: center; padding: 26px 16px; }
  .off svg { width: 40px; height: 40px; color: var(--text-soft); }
  .off p { margin: 0; font-size: var(--fs-talk); font-weight: 700; }
</style>
