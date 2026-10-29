<script lang="ts">
  // 今夜のチェック (style guide v4 §T.4, §R.3): a DIY recipe card with my three habits for today (or yesterday,
  // 48 h fill-in) as big toggles. Each tap saves at once (check-in = 2 taps); the sticky 保存 just closes.
  // 正月: eating isn't scored, so it's "off".
  import Sheet from './Sheet.svelte';
  import Avatar from './Avatar.svelte';
  import OfficialArt from './OfficialArt.svelte';
  import { fruitArt } from '#lib/client/assets.ts';
  import { week } from '#lib/client/week.svelte.ts';
  import { checkin } from '#lib/client/actions.ts';
  import { t, formatDate } from '#lib/i18n/index.ts';
  import { HOLIDAY } from '#lib/config/rules.ts';
  import { addDays, inMonthDayRange } from '#lib/scoring/dates.ts';

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

</script>

<Sheet bind:open label={t('island.checkin')} {onclose}>
  {#if view && me}
    <div class="head">
      <Avatar person={view.me} villager={me.villager} size={48} />
      <h2 class="title">{t('island.checkin')}<small class="money">{formatDate(date)}</small></h2>
      <div class="days" role="tablist">
        <button type="button" role="tab" class="day" class:fillable={yesterdayFillable} aria-selected={which === 'yesterday'}
          aria-label={yesterdayFillable ? `${t('checkin.yesterday')} · ${t('checkin.yesterdayOpen')}` : undefined}
          onclick={() => (which = 'yesterday')}>{t('checkin.yesterday')}</button>
        <button type="button" role="tab" class="day" aria-selected={which === 'today'}
          onclick={() => (which = 'today')}>{t('checkin.today')}</button>
      </div>
    </div>

    <div class="diy card-body">
      <span class="tape">{t('fruit.pear')}<OfficialArt key={fruitArt('pear')} size={16} /></span>
      {#if newYearOff}
        <div class="off">
          <svg viewBox="0 0 48 48" aria-hidden="true"><use href="#i-bowl" /></svg>
          <p>{t('checkin.newYearOff')}</p>
        </div>
      {:else}
        <div class="habits">
          {#each me.habits?.keys ?? [] as key (key)}
            {@const on = ticks.includes(key)}
            {@const ic = ICONS[key] ?? ICONS.eat_lunch}
            <button type="button" class="habit" class:on role="switch" aria-checked={on} onclick={() => toggle(key)}>
              <span class="ic"><svg viewBox={ic.vb} aria-hidden="true"><use href="#{ic.id}" /></svg></span>
              <span class="txt">{t(`habit.${key}`)}{#if t(`habit.${key}.hint`)}<small>{t(`habit.${key}.hint`)}</small>{/if}</span>
              <span class="tick" aria-hidden="true">
                {#if on}<svg viewBox="0 0 24 24"><use href="#i-check" /></svg>{/if}
                {#if pop === key}<span class="plus"><OfficialArt key={fruitArt('pear')} size={26} /></span>{/if}
              </span>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
  {#snippet footer()}
    <button type="button" class="btn" onclick={() => (open = false)}>{t('common.save')}</button>
  {/snippet}
</Sheet>

<style>
  .head { display: flex; align-items: center; gap: 10px; min-height: 56px; margin-bottom: 18px; }
  .title { flex: 1; min-width: 0; font-size: var(--fs-h2); display: grid; gap: 2px; line-height: 1.15; }
  .title small { font-size: var(--fs-caption); font-weight: 600; color: var(--text-soft); }
  .days { display: flex; gap: 2px; padding: 3px; border-radius: var(--r-pill); background: var(--track); box-shadow: var(--sh-inset); flex: none; }
  .day {
    appearance: none; cursor: pointer; min-width: 48px; min-height: 44px; padding: 0 10px; border-radius: var(--r-pill); border: 0;
    display: grid; place-items: center; font-weight: 700; font-size: var(--fs-body); position: relative;
    background: transparent; color: var(--text-soft); transition: background var(--dur-quick);
  }
  .day[aria-selected='true'] { background: var(--c-bubble); color: var(--c-ink); box-shadow: 0 2px 0 var(--c-stitch); }
  .day.fillable::after { content: ''; position: absolute; top: 5px; right: 6px; width: 8px; height: 8px; border-radius: 50%; background: var(--c-sky); }

  .card-body { padding: 22px 14px 14px; }
  .card-body .tape { --tape: var(--c-yuzu-soft); }
  .habits { display: grid; gap: 10px; }
  .habit {
    appearance: none; cursor: pointer; text-align: left; position: relative; width: 100%; font: inherit;
    display: flex; align-items: center; gap: 12px; min-height: 64px; padding: 8px 12px; border-radius: 18px;
    background: rgba(255, 255, 255, .72); color: var(--c-ink); border: var(--bw) solid #E6D8B4; box-shadow: 0 3px 0 #DCCBA0;
    transition: transform var(--dur-base) var(--ease-bounce), background var(--dur-base);
    user-select: none; -webkit-user-select: none;
  }
  .habit:active { transform: translateY(3px) scale(1.02, .96); box-shadow: 0 1px 0 #DCCBA0; transition-duration: var(--dur-tap); }
  .habit.on { background: #E6F8E2; border-color: var(--c-leaf); box-shadow: 0 3px 0 var(--c-leaf-lip); }
  .ic { width: 46px; height: 46px; flex: none; display: grid; place-items: center; border-radius: var(--r-squircle); background: var(--c-yuzu-soft); }
  .habit.on .ic { background: var(--c-leaf-soft); }
  .ic svg { width: 38px; height: 38px; }
  .txt { flex: 1; min-width: 0; line-height: 1.25; text-wrap: pretty; word-break: auto-phrase; font-weight: 700; font-size: var(--fs-body-lg); }
  .txt small { display: block; font: 700 var(--fs-caption)/1.3 var(--font-ui); color: var(--c-ink-talk); margin-top: 2px; }
  .tick {
    position: relative; width: 40px; height: 40px; flex: none; border-radius: 50%; display: grid; place-items: center;
    border: 3px dashed #D9C79C; background: #fff;
  }
  .habit.on .tick { border: 0; background: var(--c-leaf); box-shadow: 0 3px 0 var(--c-leaf-lip); animation: if-pop var(--dur-pop) var(--ease-bounce); }
  .tick svg { width: 24px; height: 24px; color: var(--c-ink); }
  .plus { position: absolute; left: 6px; top: -6px; line-height: 0; animation: rise .9s var(--ease-soft) forwards; pointer-events: none; }
  @keyframes rise { 0% { transform: translateY(0) scale(.6); opacity: 0; } 20% { opacity: 1; transform: translateY(-10px) scale(1); } 100% { transform: translateY(-56px) scale(1.1); opacity: 0; } }

  .off { display: grid; justify-items: center; gap: 8px; text-align: center; padding: 18px 8px; }
  .off svg { width: 40px; height: 40px; }
  .off p { margin: 0; font-size: var(--fs-talk); font-weight: 700; }

  /* U10: the title never breaks mid-word (「チェッ / ク」) on 320. */
  .title { white-space: nowrap; }
  @media (max-width: 359px) { .title { font-size: 1.125rem; } .head { gap: 8px; } }
  @media (max-height: 700px), (max-width: 359px) {
    .head { min-height: 48px; margin-bottom: 16px; }
    .head :global(.av) { --s: 40px !important; }
    .card-body { padding: 20px 12px 12px; }
    .habit { min-height: 56px; }
    .ic { width: 40px; height: 40px; }
    .ic svg { width: 32px; height: 32px; }
  }
</style>
