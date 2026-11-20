<script lang="ts">
  // 編集's 期限 and 通知 for an item (docs/todo.md "The sheet"; contract/todoDue.ts): 期限 chips なし · 今日 · 明日 · 日付…
  // (a transparent native date input over the chip's whole 44px hit: a direct tap is what opens WebKit's picker), then
  // 時刻 (a switch; on, a native time input: the next full hour today, 23:59 at most, else 9:00; 「日本時間」 beside it
  // when the phone isn't on Tokyo's offset). 通知, only with a due: なし by default (a date alone never reminds anyone),
  // 時刻 · 10分前 · 1時間前 · 前日 for a timed due, 当日朝 · 前日夜 for a date; turned on, the people who get it (me
  // pressed first; anyone may be chosen), the moment it fires in words (「11/23（月）20:00 に通知」, or that it's past), a
  // chosen person with no phone opted in (「うめ：端末の通知がオフ」), and for me, when this phone isn't on, its opt-in
  // in the tap (TodoNotify's enable). A timed due made date-only maps its reminder to 当日朝 (the contract refuses a
  // mismatch); 期限 なし drops the reminder with it.
  //   <DueFields bind:due bind:rem bind:to me="A" />
  import type { Rem } from '#lib/contract/todoDue.ts';
  import { REMS_DATE, REMS_TIMED } from '#lib/contract/todoDue.ts';
  import { addDays } from '#lib/contract/tokyo.ts';
  import type { Who } from '#lib/types.ts';
  import { GUEST, PEOPLE } from '#lib/config/rules.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { dayKey, minuteNow } from '#lib/time/clock.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import ChipRow from '../ui/ChipRow.svelte';
  import Chip from '../ui/Chip.svelte';
  import Segmented from '../ui/Segmented.svelte';
  import Phrases from '../ui/Phrases.svelte';
  import { dayLabel, defaultTime, fireLine } from './dueLabel.ts';
  import { pushState, todoPush } from './push.svelte.ts';
  import { pushSupport, type EnableResult } from '#lib/push/phone.ts';

  interface Props {
    due: string | null;
    rem: Rem | null;
    to: Who[];
    me: Who;
  }
  let { due = $bindable(), rem = $bindable(), to = $bindable(), me }: Props = $props();

  const nowD = $derived(minuteNow());
  const today = $derived(dayKey(nowD));
  const date = $derived(due ? due.slice(0, 10) : null);
  const time = $derived(due && due.length > 10 ? due.slice(11) : null);
  const picked = $derived(date && date !== today && date !== addDays(today, 1) ? date : null);
  /** The phone isn't on Tokyo's offset: the times are Japan's (D17). */
  const abroad = new Date().getTimezoneOffset() !== -540;

  function setDate(d: string | null) {
    if (!d) return void ((due = null), (rem = null), (to = []));
    due = time ? `${d}T${time}` : d;
  }
  function setTime(hm: string | null) {
    if (!date) return;
    due = hm ? `${date}T${hm}` : date;
    // the reminder follows the due's kind (a date-only due takes 当日朝 / 前日夜 only)
    if (rem && !hm && rem !== 'eve') rem = 'am';
    else if (rem === 'am' && hm) rem = 'at';
  }
  function pickRem(r: Rem | 'none') {
    if (r === 'none') return void ((rem = null), (to = []));
    rem = r;
    if (!to.length) to = [me];
  }
  function toggleWho(w: Who) {
    to = to.includes(w) ? to.filter((x) => x !== w) : [...to, w];
    if (!to.length) rem = null;
  }

  const remItems = $derived([
    { id: 'none' as const, label: t('todo.dueNone') },
    ...(time ? REMS_TIMED : REMS_DATE).map((r) => ({ id: r, label: t(r === 'eve' && !time ? 'todo.rem.eveD' : `todo.rem.${r}`) }))
  ]);
  const people = $derived<Who[]>(['A', 'B', 'G']);
  const nameOf = (w: Who): string => (w === 'G' ? GUEST.villager : (week.view?.people[w].villagerName ?? PEOPLE[w].villager));
  /** The chosen people whose phones are all off (the relay's presence; me apart while this phone offers its own). */
  const off = $derived(rem && pushState.status ? to.filter((w) => !pushState.status!.subs[w] && !(w === me && !phoneOn)) : []);

  // ---- this phone's opt-in, offered when I'm chosen and it isn't on
  let phoneOn = $state(todoPush.on());
  let support = $state(pushSupport());
  let why = $state<EnableResult | null>(null);
  let busy = $state(false);
  function enableHere() {
    if (busy) return;
    busy = true;
    why = null;
    void todoPush.enable(pushState.status?.vapidPublic ?? null, i18n.locale === 'en' ? 'en' : 'ja').then((r) => {
      busy = false;
      phoneOn = r === 'on';
      why = r;
      support = pushSupport();
    });
  }
</script>

<div class="due-f" data-due-fields>
  <h3 class="sec-label" id="todo-due-h">{t('todo.due')}</h3>
  <ChipRow label={t('todo.due')}>
    <Chip label={t('todo.dueNone')} selected={!date} onclick={() => setDate(null)} data-due-pick="none" />
    <Chip label={t('todo.today')} selected={date === today} onclick={() => setDate(today)} data-due-pick="today" />
    <Chip label={t('todo.tomorrow')} selected={date === addDays(today, 1)} onclick={() => setDate(addDays(today, 1))} data-due-pick="tomorrow" />
    <span class="chip s date" class:on={!!picked} data-due-pick="date">
      <span aria-hidden="true">{picked ? dayLabel(picked) : t('todo.pickDate')}</span>
      <input type="date" value={picked ?? ''} min="2024-01-01" max="2099-12-31" aria-label={picked ? `${t('todo.pickDateLabel')}：${dayLabel(picked)}` : t('todo.pickDateLabel')}
        data-sfx="tick" data-due-date onchange={(e) => e.currentTarget.value && setDate(e.currentTarget.value)} />
    </span>
  </ChipRow>
  {#if date}
    <button type="button" class="prow" role="switch" aria-checked={!!time} data-due-timed data-sfx={time ? 'toggle-off' : 'toggle-on'} onclick={() => setTime(time ? null : defaultTime(date, today, nowD.getTime()))}>
      <span class="prl">{t('todo.time')}{#if abroad}<small>{t('todo.jst')}</small>{/if}</span>
      <span class="sw" aria-hidden="true"><i></i></span>
    </button>
    {#if time}
      <input class="input time" type="time" value={time} required aria-label={t('todo.timeLabel')} data-sfx="tick" data-due-time
        onchange={(e) => e.currentTarget.value && setTime(e.currentTarget.value)} />
    {/if}
    <h3 class="sec-label">{t('todo.remind')}</h3>
    <Segmented items={remItems} value={rem ?? 'none'} label={t('todo.remind')} attr="due-rem" size="s" grow onpick={pickRem} />
    {#if rem && due}
      <p class="hint" data-due-fire><Phrases text={fireLine(due, rem, nowD.getTime())} /></p>
      <div class="who" role="group" aria-label={t('todo.to')}>
        {#each people as w (w)}
          <button type="button" class="chip big" aria-pressed={to.includes(w)} data-due-to={w} data-sfx="tick" onclick={() => toggleWho(w)}>{nameOf(w)}</button>
        {/each}
      </div>
      {#each off as w (w)}<p class="hint" data-due-off={w}><Phrases text={t('todo.offFor', { name: nameOf(w) })} /></p>{/each}
      {#if to.includes(me) && !phoneOn}
        {#if support === 'install'}
          <p class="hint" data-due-install><Phrases text={t('todo.pushInstall')} /></p>
        {:else if support !== 'unsupported'}
          <button type="button" class="btn small paper here" aria-disabled={busy || undefined} data-due-enable data-sfx="tick" onclick={enableHere}>{t('todo.enableHere')}</button>
          {#if why && why !== 'on'}<p class="hint" data-due-why={why}><Phrases text={t(why === 'denied' ? 'todo.pushDenied' : why === 'soon' ? 'todo.pushSoon' : 'todo.pushFailed')} /></p>{/if}
        {/if}
      {/if}
    {/if}
  {/if}
</div>

<style>
  .due-f { display: grid; gap: 10px; }
  .due-f :global(.chip-row) { margin: 0 -12px; }
  .sec-label { margin: 6px 4px 0; }
  .date { position: relative; }
  .date.on { background: var(--ctl-sel); color: var(--c-ink); }
  /* the native picker's input over the chip's whole 44px hit, unseen (a direct tap opens WebKit's picker) */
  .date input { position: absolute; inset: -6px -3px; width: calc(100% + 6px); height: calc(100% + 12px); margin: 0; padding: 0; border: 0; opacity: 0; font-size: 16px; cursor: pointer; }
  .time { justify-self: start; min-width: 8em; font-family: var(--font-num); }
  .hint { margin: 0 4px; font-size: var(--fs-s); font-weight: 700; line-height: 1.4; color: var(--text-soft); }
  .who { display: flex; flex-wrap: wrap; gap: 8px; }
  .here { justify-self: start; margin: 0; }
</style>
