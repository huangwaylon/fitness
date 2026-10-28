<script lang="ts">
  // 今夜のチェック: my three habits for today (or yesterday, 48 h fill-in), saved on tap.
  // 「おやつ OK」 is purely decorative and never sent. のんびりデー toggles today's Cozy Day.
  import Sheet from './Sheet.svelte';
  import Villager from './Villager.svelte';
  import { week } from '#lib/client/week.svelte.ts';
  import { checkin, cozyDay } from '#lib/client/actions.ts';
  import { t, addDays, weekdayShort, formatDate } from '#lib/i18n/index.ts';

  let { open = $bindable() }: { open: boolean } = $props();

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
  const yesterdayEmpty = $derived((me?.habits?.ticksByDate[yesterday] ?? []).length === 0);
  let snackOk = $state(false);
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
    if (r === 'limit') week.showToast(t('us.cozyLimit'), 3600);
  }
</script>

<Sheet bind:open label={t('checkin.title')}>
  {#if view && me}
    <div class="head">
      <span class="av"><Villager person={view.me} size={46} /></span>
      <h2>{which === 'today' ? t('checkin.title') : t('checkin.yesterday')}</h2>
      <div class="days" role="tablist">
        <button type="button" role="tab" class="day" class:miss={yesterdayEmpty} aria-selected={which === 'yesterday'}
          aria-label="{t('checkin.yesterday')} {formatDate(yesterday)}" onclick={() => (which = 'yesterday')}>{weekdayShort(yesterday)}</button>
        <button type="button" role="tab" class="day" aria-selected={which === 'today'}
          aria-label="{t('checkin.today')} {formatDate(today)}" onclick={() => (which = 'today')}>{weekdayShort(today)}</button>
      </div>
    </div>

    <div class="habits">
      {#each me.habits?.keys ?? [] as key (key)}
        {@const on = ticks.includes(key)}
        {@const ic = ICONS[key] ?? ICONS.eat_lunch}
        <button type="button" class="habit" class:on role="switch" aria-checked={on} onclick={() => toggle(key)}>
          <svg class="ic" viewBox={ic.vb} aria-hidden="true"><use href="#{ic.id}" /></svg>
          <span class="txt">{t(`habit.${key}`)}{#if key === 'snack_swap'}<small>{t('habit.snack_swap.hint')}</small>{/if}</span>
          {#if pop === key}<svg class="plus" viewBox="0 0 24 24" aria-hidden="true"><use href="#f-pear" /></svg>{/if}
          <span class="sw" aria-hidden="true"></span>
        </button>
      {/each}
    </div>

    <div class="extras">
      <button type="button" class="chip treat" aria-pressed={snackOk} onclick={() => (snackOk = !snackOk)}>
        <svg viewBox="0 0 26 26" aria-hidden="true"><use href="#i-cake" /></svg>{t('checkin.snackOk')}
      </button>
      {#if which === 'today'}
        <button type="button" class="chip cozy" aria-pressed={me.isCozyToday} onclick={cozy}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-cozy" /></svg>{t('checkin.cozy')}
        </button>
      {/if}
    </div>
  {/if}
</Sheet>

<style>
  .head { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
  .av { width: 50px; height: 50px; border-radius: var(--r-blob); background: #EFE6FA; display: grid; place-items: center; flex: none; }
  h2 { font-size: 1.6rem; }
  .days { display: flex; gap: 6px; margin-left: auto; }
  .day {
    appearance: none; cursor: pointer; min-width: 44px; min-height: 44px; padding: 0 8px; border-radius: var(--r-sm);
    display: grid; place-items: center; font-weight: 700; font-size: var(--fs-caption); position: relative;
    background: var(--surface); border: 2px solid var(--edge); color: var(--text-soft);
  }
  .day[aria-selected='true'] { background: var(--sky-pale); border-color: var(--sky); color: var(--ink); }
  .day.miss::after { content: ''; position: absolute; top: 4px; right: 4px; width: 8px; height: 8px; border-radius: 50%; background: var(--coral); }

  .habits { display: grid; gap: 10px; }
  .habit {
    appearance: none; cursor: pointer; text-align: left; position: relative; width: 100%;
    display: flex; align-items: center; gap: 14px; min-height: 76px; padding: 10px 14px; border-radius: var(--r-lg);
    background: var(--paper); color: var(--ink); border: 2.5px solid var(--paper-edge); box-shadow: 0 4px 0 var(--sand-deep);
    font: 600 1.2rem var(--font-display); transition: transform var(--dur-quick), background var(--dur-base);
    user-select: none;
  }
  .habit:active { transform: translateY(3px); box-shadow: 0 1px 0 var(--sand-deep); }
  .habit.on { background: #EAF7E6; border-color: var(--leaf); box-shadow: 0 4px 0 #8FC98F; }
  .ic { width: 50px; height: 50px; flex: none; }
  .txt { flex: 1; line-height: 1.2; }
  .txt small { display: block; font: 700 .75rem var(--font-body); color: var(--ink-faint); }
  .sw { width: 60px; height: 36px; border-radius: var(--r-pill); background: var(--sand); position: relative; flex: none; box-shadow: var(--sh-inset); transition: background var(--dur-base); }
  .sw::after {
    content: ''; position: absolute; top: 3px; left: 3px; width: 30px; height: 30px; border-radius: 50%;
    background: #fff; box-shadow: 0 2px 0 var(--sand-deep); transition: left var(--dur-base) var(--ease-bounce);
  }
  .habit.on .sw { background: var(--leaf); }
  .habit.on .sw::after { left: 27px; }
  .plus { position: absolute; right: 86px; top: 14px; width: 28px; height: 28px; animation: floatUp .9s var(--ease-soft) forwards; }

  .extras { display: flex; gap: 10px; margin-top: 14px; }
  .extras .chip { flex: 1; min-height: 52px; border-style: dashed; }
  .extras .chip svg { width: 26px; height: 26px; }
  .chip.cozy { background: #EEF0FB; border-color: #C5CBEF; color: var(--ink-soft); }
  .chip.cozy[aria-pressed='true'] { background: #DCE0FA; border-color: #9FA8E8; border-style: solid; color: var(--ink); }
  .chip.treat[aria-pressed='true'] { background: var(--coral-soft); border-color: var(--coral); border-style: solid; color: var(--ink); }
  :global(:root[data-theme="night"]) .chip.treat:not([aria-pressed='true']) { color: var(--night-ink); }
</style>
