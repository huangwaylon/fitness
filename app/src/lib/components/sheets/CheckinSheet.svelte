<script lang="ts">
  // 今夜のチェック (v5 §4: one sheet skin): my three habits for today (or yesterday, 48 h fill-in) as big toggles. Each tap saves at once (check-in = 2 taps); the sticky 保存 just closes.
  // 「ぜんぶできた！」 ticks every habit still open in one tap (round 15 food automation: a good day = 1 tap).
  // 正月: eating isn't scored, so it's "off".
  import Sheet from '../ui/Sheet.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { fruitArt } from '#lib/art.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { checkin } from '#lib/store/actions.ts';
  import { has, t } from '#lib/i18n/index.ts';
  import { HOLIDAY } from '#lib/config/rules.ts';
  import { addDays, inMonthDayRange } from '#lib/time/dates.ts';
  import { formatDate } from '#lib/i18n/format.ts';
  import { cue } from '#lib/sound/cues.ts';

  let { open = $bindable(), onclose }: { open: boolean; onclose?: () => void } = $props();

  const ICONS: Record<string, { id: string; vb: string }> = {
    protein_each_meal: { id: 'i-tray', vb: '0 0 40 40' },
    no_sweets: { id: 'i-snack', vb: '0 0 40 40' },
    veg_two_meals: { id: 'i-veg', vb: '0 0 40 40' }
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
  let popTimer: ReturnType<typeof setTimeout> | undefined;
  $effect(() => () => clearTimeout(popTimer));

  function toggle(key: string) {
    const done = !ticks.includes(key);
    if (done) {
      pop = key;
      clearTimeout(popTimer);
      popTimer = setTimeout(() => (pop = null), 900);
    }
    checkin(date, key, done);
    // each tap saves at once: ticking one on is the check-in (the confirm), off the switch's off notes
    cue(done ? 'checkin-saved' : 'toggle-off');
  }

  const habitKeys = $derived(me?.habits?.keys ?? []);
  const allDone = $derived(habitKeys.length > 0 && habitKeys.every((k) => ticks.includes(k)));
  function tickAll() {
    const open = habitKeys.filter((k) => !ticks.includes(k));
    if (!open.length) return;
    for (const k of open) checkin(date, k, true);
    pop = open[open.length - 1];
    clearTimeout(popTimer);
    popTimer = setTimeout(() => (pop = null), 900);
    cue('checkin-saved');
  }

</script>

<Sheet bind:open label={t('island.checkin')} title={t('island.checkin')} {onclose}>
  {#if view && me}
    <div class="head">
      <span class="date money">{formatDate(date)}</span>
      <!-- A segmented switch (two toggle buttons), not tabs: there is no tab panel to move to. -->
      <div class="days" role="group" aria-label={t('island.checkin')}>
        <button type="button" class="day" class:fillable={yesterdayFillable} aria-pressed={which === 'yesterday'}
          aria-label={yesterdayFillable ? `${t('checkin.yesterday')} · ${t('checkin.yesterdayOpen')}` : undefined}
          data-sfx={which === 'yesterday' ? 'none' : 'tick'} onclick={() => (which = 'yesterday')}>{t('checkin.yesterday')}</button>
        <button type="button" class="day" aria-pressed={which === 'today'}
          data-sfx={which === 'today' ? 'none' : 'tick'} onclick={() => (which = 'today')}>{t('checkin.today')}</button>
      </div>
    </div>

    {#if newYearOff}
      <div class="off card">
        <svg viewBox="0 0 48 48" aria-hidden="true"><use href="#i-bowl" /></svg>
        <p>{t('checkin.newYearOff')}</p>
      </div>
    {:else}
      <button type="button" class="btn yuzu all" aria-disabled={allDone} data-sfx="self" onclick={tickAll}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check" /></svg>{allDone ? t('checkin.allDoneDone') : t('checkin.allDone')}
      </button>
      <div class="habits">
        {#each me.habits?.keys ?? [] as key (key)}
          {@const on = ticks.includes(key)}
          {@const ic = ICONS[key] ?? ICONS.veg_two_meals}
          <button type="button" class="habit" class:on role="switch" aria-checked={on} data-sfx="self" onclick={() => toggle(key)}>
            <span class="ic"><svg viewBox={ic.vb} aria-hidden="true"><use href="#{ic.id}" /></svg></span>
            <span class="txt">{t(`habit.${key}`)}{#if has(`habit.${key}.hint`)}<small>{t(`habit.${key}.hint`)}</small>{/if}</span>
            <span class="tick" aria-hidden="true">
              {#if on}<svg viewBox="0 0 24 24"><use href="#i-check" /></svg>{/if}
              {#if pop === key}<span class="plus"><OfficialArt key={fruitArt('pear')} size={26} /></span>{/if}
            </span>
          </button>
        {/each}
      </div>
    {/if}
  {/if}
  {#snippet footer()}
    <button type="button" class="btn" data-sfx="confirm" onclick={() => (open = false)}>{t('common.save')}</button>
  {/snippet}
</Sheet>

<style>
  .head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 14px; }
  .date { font-size: var(--fs-talk); color: var(--text-soft); }
  .days { display: flex; gap: 2px; padding: 3px; border-radius: var(--r-btn); background: color-mix(in srgb, var(--lip) 45%, transparent); box-shadow: inset 0 0 0 2px var(--edge); flex: none; }
  .day {
    appearance: none; cursor: pointer; min-width: 56px; min-height: var(--hit); padding: 0 10px; border-radius: 14px; border: 0;
    display: grid; place-items: center; font-weight: 700; font-size: var(--fs-body); position: relative;
    background: transparent; color: var(--text-soft); transition: background var(--dur-quick);
  }
  .day[aria-pressed='true'] { background: var(--ctl-sel); color: var(--c-ink); box-shadow: inset 0 0 0 2px var(--c-edge); }
  .day.fillable::after { content: ''; position: absolute; top: 5px; right: 6px; width: 8px; height: 8px; border-radius: 50%; background: var(--c-mint-lip); }

  .all { margin-bottom: 14px; }
  .all[aria-disabled='true'] { --fill: var(--ctl-off); }
  .habits { display: grid; gap: 12px; }
  .habit {
    appearance: none; border: 0; cursor: pointer; text-align: left; position: relative; width: 100%; font: inherit;
    display: flex; align-items: center; gap: 12px; min-height: 68px; padding: 10px 14px; border-radius: var(--r-card);
    background: var(--c-card); color: var(--c-ink); box-shadow: var(--sh-obj);
    transition: transform var(--dur-base) var(--ease-bounce), background var(--dur-base);
    user-select: none; -webkit-user-select: none;
  }
  .habit:active { transform: translateY(3px) scale(1.02, .96); box-shadow: var(--sh-obj-press); transition-duration: var(--dur-tap); }
  .habit.on { background: var(--c-leaf); box-shadow: inset 0 0 0 2px var(--c-leaf-edge), 0 var(--lip-h) 0 var(--c-leaf-edge); }
  .habit.on:active { box-shadow: inset 0 0 0 2px var(--c-leaf-edge), 0 1px 0 var(--c-leaf-edge); }
  .ic { width: 44px; height: 44px; flex: none; display: grid; place-items: center; }
  .ic svg { width: 40px; height: 40px; }
  .txt { flex: 1; min-width: 0; line-height: 1.25; text-wrap: pretty; word-break: auto-phrase; font-weight: 700; font-size: var(--fs-talk); }
  .txt small { display: block; font: 500 var(--fs-s)/1.3 var(--font-ui); color: var(--c-ink-soft); margin-top: 2px; }
  .tick {
    position: relative; width: 36px; height: 36px; flex: none; border-radius: 50%; display: grid; place-items: center;
    background: var(--c-paper); box-shadow: inset 0 0 0 2px var(--c-edge);
  }
  .habit.on .tick { background: var(--c-card); box-shadow: inset 0 0 0 2px var(--c-leaf-edge); animation: if-pop var(--dur-pop) var(--ease-bounce); }
  .tick svg { width: 22px; height: 22px; color: var(--c-leaf-edge); }
  .plus { position: absolute; left: 6px; top: -6px; line-height: 0; animation: rise .9s var(--ease-soft) forwards; pointer-events: none; }
  @keyframes rise { 0% { transform: translateY(0) scale(.6); opacity: 0; } 20% { opacity: 1; transform: translateY(-10px) scale(1); } 100% { transform: translateY(-56px) scale(1.1); opacity: 0; } }

  .off { display: grid; justify-items: center; gap: 8px; text-align: center; }
  .off svg { width: 40px; height: 40px; }
  .off p { margin: 0; font-size: var(--fs-talk); font-weight: 700; }

  @media (max-height: 700px), (max-width: 359px) {
    .habit { min-height: 58px; padding: 8px 12px; }
    .ic { width: 36px; height: 36px; }
    .ic svg { width: 32px; height: 32px; }
    .txt { font-size: var(--fs-body); }
  }
</style>
