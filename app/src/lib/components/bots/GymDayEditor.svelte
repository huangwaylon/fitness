<script lang="ts">
  // ジム's day editor (docs/design.md "Bots"): a day's sheet from the calendar, applied at once (the page sends each
  // choice: GymPage `send`, with 取り消す on its banner). The title 11/14（金）; what it is now; 終日 / 時間指定 / オフ;
  // for 時間指定 the half-hour slot chips 10:00…21:30, 6 × 4 (■ watched, ✓ announced: lib/gym/calendar.ts pickSlot —
  // a tap starts an hour, the next picks the last slot, a tap inside trims the end) and the line naming the slots; 通知の
  // 開始 すぐ | 時刻 for 終日 and 時間指定, 時刻 a start day (today … the day, Tokyo) and time (lib/gym/calendar.ts fromDates /
  // fromTimes: the times the bot would refuse disabled, never sent; a saved ⏳ moves with its day); ふだんに戻す / リセット
  // when there is something to clear, naming the announced times that go with it. `note`: the last act's refusal or
  // failure (the bot's words, coral) with もう一度.
  import Sheet from '../ui/Sheet.svelte';
  import Segmented from '../ui/Segmented.svelte';
  import GymSlots from './GymSlots.svelte';
  import { t } from '#lib/i18n/index.ts';
  import { dayTitle, fromDates, fromText, fromTimes, fromWords, longRange, pickSlot, ruleOf, ruleText, slotCount, type SlotPick } from '#lib/gym/calendar.ts';
  import { DEFAULT_WINDOW, at, clockOf, dayOf, fromRefusal, type ActInput, type Clock, type Day, type DayRow } from '#lib/gym/contract.ts';

  type Kind = 'any' | 'range' | 'off';
  interface Props {
    open: boolean;
    row: DayRow | null;
    /** One of the default days (unset: ふだん). */
    usualDay: boolean;
    /** The Worker's clock (GymPage pickNow), the times offered are after it. */
    now: number;
    onact: (input: ActInput) => void;
    note: { text: string; retry?: () => void } | null;
  }
  let { open = $bindable(), row: given, usualDay, now, onact, note }: Props = $props();
  /** The day, a ⏳ that has passed (the bot drops it at its next check) shown as none: checks have started. */
  const row = $derived(given && given.from !== null && given.from <= now ? { ...given, from: null } : given);

  /** 時間指定 chosen here before the rule is one (a ふだん or 未チェック day shows its grid at once). */
  let wantRange = $state(false);
  let pick = $state<SlotPick>({ range: null, open: false });
  /** 時刻 chosen, no time picked yet. */
  let wantAt = $state(false);
  /** A start day picked that the saved ⏳ (if any) isn't on yet: its time is still to pick. */
  let wantDate = $state<Day | null>(null);
  let lastDay = '';
  let lastFrom: number | null = null;

  const rule = $derived(row ? ruleOf(row) : null);
  const kind = $derived<Kind | ''>(!row ? '' : row.rule === 'any' ? 'any' : row.rule === 'skip' ? 'off' : Array.isArray(row.rule) || wantRange ? 'range' : '');
  const shownRange = $derived<[Clock, Clock] | null>(pick.open ? pick.range : Array.isArray(rule) ? rule : wantRange ? [DEFAULT_WINDOW[0], DEFAULT_WINDOW[1]] : null);
  const fromMode = $derived(row && (row.from !== null || wantAt) ? 'at' : 'now');
  const dates = $derived(row ? fromDates(row, now) : []);
  /** The start day shown: the one picked, else the saved ⏳'s, else the day itself (or the latest one left). */
  const fromDate = $derived.by(() => {
    if (!row) return '';
    const shown = wantDate ?? (row.from !== null ? dayOf(row.from) : row.day);
    return dates.includes(shown) ? shown : (dates.at(-1) ?? '');
  });
  const times = $derived(row && fromDate ? fromTimes(row, fromDate, now) : []);
  /** The saved ⏳ isn't on the start day shown (its time can't move there): it stays until a time is picked. */
  const kept = $derived(row && row.from !== null && fromDate !== dayOf(row.from) ? row.from : null);
  const watched = $derived(rule === 'any' || Array.isArray(rule));
  const resetLabel = $derived(row && row.rule !== null && usualDay ? t('gym.editor.back') : t('gym.editor.reset'));

  // a new day: the picker and the choices start over
  $effect(() => {
    const d = open && row ? row.day : '';
    if (d !== lastDay) {
      lastDay = d;
      wantRange = false;
      wantAt = false;
      wantDate = null;
      pick = { range: null, open: false };
    }
    // a ⏳ saved or changed on another day (from LINE, by the other member): its own day shows; one gone (cleared,
    // or a first one refused) keeps the day picked
    const f = row ? row.from : null;
    if (f !== lastFrom) {
      lastFrom = f;
      if (f !== null && dayOf(f) !== wantDate) wantDate = null;
    }
  });

  const kinds = $derived([
    { id: 'any' as const, label: t('gym.kind.any') },
    { id: 'range' as const, label: t('gym.kind.range') },
    { id: 'off' as const, label: t('gym.kind.off') }
  ]);

  function setKind(k: Kind) {
    if (!row) return;
    pick = { range: null, open: false };
    if (k === 'range') {
      wantRange = true;
      if (!Array.isArray(row.rule)) onact({ a: 'range', d: row.day, s: DEFAULT_WINDOW[0], e: DEFAULT_WINDOW[1] });
      return;
    }
    wantRange = false;
    onact({ a: k === 'any' ? 'any' : 'skip', d: row.day });
  }

  function tapSlot(slot: Clock) {
    if (!row) return;
    const from = { range: shownRange, open: pick.open };
    pick = pickSlot(from, slot);
    const r = pick.range!;
    if (!row.rule || !Array.isArray(rule) || r[0] !== rule[0] || r[1] !== rule[1]) onact({ a: 'range', d: row.day, s: r[0], e: r[1] });
  }

  function setFromMode(m: 'now' | 'at') {
    if (!row) return;
    wantAt = m === 'at';
    if (m === 'now' && row.from !== null) onact({ a: 'unfrom', d: row.day });
  }

  /** A start day: a saved ⏳ moves to it at once when its time is allowed then; else the time is picked next. */
  function setFromDate(e: Event) {
    if (!row) return;
    const d = (e.currentTarget as HTMLSelectElement).value;
    wantDate = d;
    if (row.from === null) return;
    const moved = at(d, clockOf(row.from));
    if (moved !== row.from && fromRefusal(row.day, moved, now, ruleOf(row)) === null) onact({ a: 'from', d: row.day, at: moved });
  }

  function setFrom(e: Event) {
    const v = Number((e.currentTarget as HTMLSelectElement).value);
    if (row && v) onact({ a: 'from', d: row.day, at: v });
  }

  /** `11/10（火）`, with （今日） / （当日）. */
  const dateLabel = (d: Day, day: Day): string =>
    dayTitle(d) + (d === dayOf(now) ? t('gym.cell.today') : d === day ? t('gym.editor.fromTheDay') : '');
</script>

<Sheet bind:open title={row ? dayTitle(row.day) : ''} name="gym.day">
  {#if row}
    <div class="ed" data-gym-editor={row.day}>
      <p class="now" data-gym-editor-now>{t('gym.editor.now', { rule: ruleText(row) })}{#if row.from !== null}<small>{t('gym.cell.from', { time: fromText(row) ?? '' })}</small>{/if}</p>
      {#if note}
        <div class="note bad" role="alert" data-gym-note>
          <span>{note.text}</span>
          {#if note.retry}<button type="button" class="btn small paper" data-sfx="tick" onclick={note.retry}>{t('state.retry')}</button>{/if}
        </div>
      {/if}
      <Segmented items={kinds} value={kind as Kind} label={t('gym.kind.label')} attr="gym-kind" onpick={setKind} />

      {#if kind === 'range'}
        <GymSlots range={shownRange} announced={row.announced} onpick={tapSlot} />
        {#if shownRange}<p class="line" data-gym-slots-line aria-live="polite">{t('gym.editor.slots', { range: longRange(shownRange), n: slotCount(shownRange) })}</p>{/if}
        <p class="hint">{pick.open ? t('gym.editor.slotsEnd') : t('gym.editor.slotsHint')}</p>
      {/if}

      {#if watched}
        <span class="lbl">{t('gym.editor.from')}</span>
        <Segmented items={[{ id: 'now' as const, label: t('gym.editor.fromNow') }, { id: 'at' as const, label: t('gym.editor.fromAt') }]} value={fromMode}
          label={t('gym.editor.from')} attr="gym-from" onpick={setFromMode} />
        {#if fromMode === 'at'}
          <p class="hint" data-gym-from-why>{t('gym.editor.fromWhy')}</p>
          {#if dates.length}
            <div class="when">
              <label class="lbl" for="gym-from-date">{t('gym.editor.fromDate')}</label>
              <label class="lbl" for="gym-from-time">{t('gym.editor.fromPick')}</label>
              <select id="gym-from-date" class="pick" data-gym-from-date data-sfx="none" value={fromDate} onchange={setFromDate}>
                {#each dates as d (d)}<option value={d}>{dateLabel(d, row.day)}</option>{/each}
              </select>
              <select id="gym-from-time" class="pick" data-gym-from-time data-sfx="none"
                value={row.from !== null && dayOf(row.from) === fromDate ? String(row.from) : ''} onchange={setFrom}>
                <option value="" disabled>{t('gym.editor.fromChoose')}</option>
                {#each times as c (c.at)}<option value={String(c.at)} disabled={!c.ok}>{c.clock}</option>{/each}
              </select>
            </div>
            {#if kept !== null}<p class="hint" data-gym-from-kept>{t('gym.editor.fromKept', { time: clockOf(kept), from: fromWords(null, kept) })}</p>{/if}
          {:else}
            <p class="hint" data-gym-from-none>{t('gym.editor.fromNone')}</p>
          {/if}
        {/if}
      {/if}

      {#if row.resettable}
        <div class="reset">
          <button type="button" class="btn small paper" data-gym-reset data-sfx="tick" onclick={() => onact({ a: 'reset', d: row.day })}>{resetLabel}</button>
          {#if row.announced.length}<small data-gym-reset-note>{t('gym.editor.resetNote', { n: row.announced.length })}</small>{/if}
        </div>
      {/if}
    </div>
  {/if}
</Sheet>

<style>
  .ed { display: grid; gap: 10px; padding-bottom: 12px; }
  .now { margin: 0 4px; font: 700 var(--fs-body)/var(--lh) var(--font-ui); }
  .now small { display: block; font-size: var(--fs-s); color: var(--text-soft); }
  .lbl { font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); margin: 4px 4px 0; }
  .hint { margin: 0 4px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .line { margin: 0 4px; font: 700 var(--fs-body)/1.3 var(--font-ui); }
  /* the start day and time side by side, each under its label */
  .when { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 8px; }
  .when .lbl { margin-top: 0; }
  .pick:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  /* 16px so Safari doesn't zoom; the app's field look */
  .pick {
    min-height: var(--hit); padding: 6px 12px; border: 0; border-radius: var(--r-btn); appearance: none;
    font: 700 var(--fs-input)/1.1 var(--font-num); color: var(--text); background: var(--ctl); box-shadow: inset 0 0 0 2px var(--edge);
  }
  .reset { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 4px; }
  .reset .btn { margin: 0; }
  .reset small { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .note { display: flex; align-items: center; gap: 8px; padding: 8px 8px 8px 12px; border-radius: var(--r-card); font-size: var(--fs-s); font-weight: 700; line-height: var(--lh); }
  .note span { flex: 1; }
  .note .btn { margin: 0; flex: none; }
  .note.bad { color: var(--coral-text); background: color-mix(in srgb, var(--c-coral) 18%, var(--card)); }
</style>
