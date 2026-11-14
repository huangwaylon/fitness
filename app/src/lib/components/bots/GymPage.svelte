<script lang="ts">
  // ボット's ジム tab (docs/design.md "Bots"), on BotPage: the verdict with its key row (前回 · 次回 · いま) and its ⋯
  // (members, with this phone's key: lib/gym/config.ts; an ActionSheet: 今すぐ確認 — a peek, its 60 s cooldown in its
  // label — 確認を停止 (asked first) or 確認を再開 (first, while stopped), 確認の間隔 ›: a sheet), the result line under
  // the verdict's sentence (確認中…, 「12:03の確認：空きなし · 次はあと42秒」, an act's failure), 確認が必要 (the other
  // reasons, what to do), 直近12時間, then 日ごとの設定 — the calendar (GymCalendar: 2 weeks from today, 4 in the select
  // mode; a tap opens the day's editor, GymDayEditor; 選択 or a long press the select mode, its sticky bar one bulk
  // act), the 3-reservation note, the legend folded and アプリで変更 (the last ones, one a day, folded); くわしく last.
  // No 設定 section: every change applies at once (no draft): the page shows it, POST
  // /gym/act sends it after the ones before it (one at a time, each with its days' bases as the last answer left them),
  // and its banner offers 取り消す for 5 s (one undo an act or bulk act: lib/gym/calendar.ts undoActs); a failure puts
  // back only its own days, with a coral note and もう一度, the bot's refusals in its words, a 409 stale shows the day as
  // it is now (「ほかの人が変更しました」). A poll that sees a day change under the page flashes its cell. Both read on
  // open, then every minute while shown (useBot.svelte.ts; the config with each status read); the settings have their
  // own failure row, and stay out of sight while the Worker doesn't serve them (config.ts settle).
  import { tick } from 'svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import { minuteNow } from '#lib/time/clock.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { checkStrip, factRows, keyRow, reasonLines, verdictView, type GymStatus } from '#lib/gym/status.ts';
  import { driver } from '#lib/gym/bot.ts';
  import { fetchConfig, postAct, settle, type GymConfig } from '#lib/gym/config.ts';
  import { bulkAct, changeLine, dayTitle, fromWords, longRange, movedDays, pickSlot, slotCount, undoActs, weeks, type SlotPick } from '#lib/gym/calendar.ts';
  import { at, type ActInput, type Clock, type Day, type DayAct } from '#lib/gym/contract.ts';
  import { timeOf } from '#lib/i18n/when.ts';
  import Sheet from '../ui/Sheet.svelte';
  import Phrases from '../ui/Phrases.svelte';
  import Segmented from '../ui/Segmented.svelte';
  import ActionSheet from '../ui/ActionSheet.svelte';
  import Icon from '../ui/Icon.svelte';
  import BotPage from './BotPage.svelte';
  import GymCalendar from './GymCalendar.svelte';
  import GymDayEditor from './GymDayEditor.svelte';
  import GymSlots from './GymSlots.svelte';
  import { useBot } from './useBot.svelte.ts';
  import { acts, attach, send as sendAct, shownConfig } from './gymActs.svelte.ts';

  const UNDO_MS = 5000;
  /** The settings shown: the last answer (gymActs.svelte.ts: it outlives the page) with the acts still queued predicted
   *  on it. */
  const cfg = $derived(shownConfig());
  let cfgState = $state<'hidden' | 'ok' | 'failed'>(acts.confirmed ? 'ok' : 'hidden');
  let cfgLoading = $state(false);
  let cfgCtl: AbortController | null = null;
  let flashTimer: ReturnType<typeof setTimeout> | undefined;
  $effect(() => () => clearTimeout(flashTimer));
  /** The last act's refusal or failure (coral), with もう一度; `stale`: someone else changed the day. */
  let note = $state<{ text: string; retry?: () => void } | null>(null);
  /** 今すぐ確認's answer (one line, the open slots under it), or its refusal. */
  let result = $state<{ text: string; slots: string[]; bad: boolean } | null>(null);
  let checking = $state(false);
  /** When 今すぐ確認 is ready again, on this phone's clock (the Worker's cooldown, shifted). */
  let readyAt = $state(0);
  let tickNow = $state(Date.now());
  /** The Worker's clock less this phone's, at the last answer. */
  let skew = $state(0);
  let flash = $state<ReadonlySet<Day>>(new Set());
  let editDay = $state<Day | null>(null);
  let editOpen = $state(false);
  let selecting = $state(false);
  let selected = $state<ReadonlySet<Day>>(new Set());
  let askStop = $state(false);
  let menuOpen = $state(false);
  let intervalOpen = $state(false);
  let askBulkReset = $state(false);
  let bulkRangeOpen = $state(false);
  let bulkPick = $state<SlotPick>({ range: ['12:00', '13:00'], open: false });
  let lastCell: Day | null = null;

  async function loadConfig() {
    if (week.guest) return; // members only: the guest asks nothing
    cfgCtl?.abort();
    const c = (cfgCtl = new AbortController());
    const signal = AbortSignal.any([c.signal, poll.life]);
    const seen = acts.answered;
    cfgLoading = true;
    const r = await fetchConfig(signal);
    if (cfgCtl === c) cfgLoading = false;
    // an act answered (or is on its way) since: its config is newer than this read's
    if (signal.aborted || acts.queue.length || seen !== acts.answered) return;
    const was = acts.confirmed;
    const s = settle(was, r);
    [acts.confirmed, cfgState] = [s.cfg, s.state];
    if (was && s.cfg && was !== s.cfg) light(movedDays(was.rows, s.cfg.rows));
    if (s.cfg) take(s.cfg);
  }

  /** A config's 🔎 cooldown on this phone's clock. */
  function take(c: GymConfig) {
    readyAt = c.checkReadyAt === null ? 0 : Date.now() + (c.checkReadyAt - c.now);
    skew = c.now - Date.now();
  }

  /** Days a poll saw change: flashed a moment. */
  function light(days: Day[]) {
    if (!days.length) return;
    flash = new Set(days);
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => (flash = new Set()), 1600);
  }

  const bot = useBot<GymStatus>('gym', driver, { onRead: () => void loadConfig() });
  const poll = bot.poll;
  const data = $derived(bot.data);

  // 今すぐ確認's countdown: a tick a second while it runs (none while the phone is put away: the clock catches up)
  $effect(() => {
    if (readyAt <= tickNow) return;
    const id = setInterval(() => (document.hidden ? undefined : (tickNow = Date.now())), 1000);
    return () => clearInterval(id);
  });

  const nowMs = $derived(minuteNow().getTime());
  /** The editor's now: the Worker's clock, a minute ahead (the tick is up to a minute old), so a ⏳ time isn't
   *  offered in its last minute, when the bot would refuse it as passed. */
  const pickNow = $derived(minuteNow().getTime() + skew + 60_000);
  /** The verdict; 停止中 points to the page's own 再開 while it serves the settings (else to LINE's). */
  const verdict = $derived(data && { ...driver.verdict(data, Date.now()), sentence: verdictView(data, cfgState === 'ok').sentence });
  const reasons = $derived(data ? reasonLines(data) : []);
  const facts = $derived(data ? factRows(data, nowMs) : []);
  const strip = $derived(data && checkStrip(data));
  const legend = { ok: t('gym.strip.legend.ok'), avail: t('gym.strip.legend.avail'), warn: t('gym.strip.legend.warn'), fail: t('gym.strip.legend.fail'), none: t('gym.strip.legend.none') };
  const cells = $derived(cfg ? weeks(cfg.rows, selecting ? 4 : 2) : []);
  const editRow = $derived(cfg && editDay ? (cfg.rows.find((r) => r.day === editDay) ?? null) : null);
  // the day passed while its editor was open (the rows start at the new today): nothing left to set
  $effect(() => {
    if (editOpen && cfg && editDay && !editRow) editOpen = false;
  });
  const usualDay = $derived(!!cfg && !!editDay && cfg.rows.findIndex((r) => r.day === editDay) < cfg.defaultDays);
  const wait = $derived(Math.max(0, Math.ceil((readyAt - tickNow) / 1000)));
  const checkOff = $derived(!cfg || cfg.paused || cfg.checking || checking || wait > 0);
  const selAnnounced = $derived(cfg ? cfg.rows.filter((r) => selected.has(r.day)).reduce((n, r) => n + r.announced.length, 0) : 0);
  const intervals = $derived((cfg?.intervals ?? []).map((m) => ({ id: String(m), label: t('gym.ctl.every', { n: m }) })));

  /** What an act did, for its banner: `11/14（金） 終日`, `3日を オフ`, `30分ごと`. */
  function whatOf(input: ActInput): string {
    if (input.a === 'interval') return t('gym.ctl.every', { n: input.m });
    if (input.a === 'pause' || input.a === 'resume' || input.a === 'check') return input.a === 'check' ? '' : t(`gym.ch.${input.a}`);
    const what = input.a === 'range' ? longRange([input.s, input.e])
      : input.a === 'from' ? t('gym.cell.from', { time: fromWords(input.d, typeof input.at === 'number' ? input.at : at(input.d, input.at)) }) : t(`gym.ch.${input.a}`);
    return 'days' in input ? what : `${dayTitle(input.d)} ${what}`;
  }

  /** The act undoing a check setting. */
  function undoSetting(input: ActInput, was: GymConfig): ActInput | null {
    if (input.a === 'interval') return { a: 'interval', m: was.intervalMin };
    if (input.a === 'pause' || input.a === 'resume') return { a: was.paused ? 'pause' : 'resume' };
    return null;
  }

  /** One change: shown at once, then sent after the ones before it (gymActs.svelte.ts: never cut off by a close).
   *  Resolves when it is answered: true when applied. */
  function send(input: ActInput, undoable = true): Promise<boolean> {
    note = null;
    return sendAct(input, undoable);
  }

  // each answer while shown: 取り消す on its banner; a refusal or failure puts back only its own days (the bot's
  // refusal in its words; a stale day as it is now), with もう一度 for a failure
  $effect(() => attach((q, r, was) => {
    if (r.ok) {
      take(r.config);
      if (r.changed && q.undoable) offerUndo(q.input, was, r.config);
      return;
    }
    cue('boop');
    if (r.err === 'stale') {
      note = { text: t('gym.err.stale') };
      if (r.config) light(movedDays(was.rows, r.config.rows));
    } else {
      const own = r.hint && r.http !== null && r.http < 500 && r.http !== 401 && r.http !== 403;
      note = own ? { text: r.hint! } : { text: t('gym.err.failed'), retry: () => void send(q.input, q.undoable) };
    }
  }));

  function offerUndo(input: ActInput, was: GymConfig, now: GymConfig) {
    const n = 'days' in input ? input.days.length : 1;
    let text = n > 1 ? t('gym.toast.changedN', { n, what: whatOf(input) }) : t('gym.toast.changed', { what: whatOf(input) });
    // a 🔔 / ⏰ that left a ⏳ no slot: the bot cleared it (store.setRule), and says so
    if (input.a === 'any' || input.a === 'range') {
      if (was.rows.some((b) => b.from !== null && now.rows.find((a) => a.day === b.day)?.from === null)) text += t('gym.toast.fromDropped');
    }
    const setting = undoSetting(input, was);
    const plan = setting ? [setting] : undoActs(was.rows, now.rows, now.defaultDays);
    toasts.show(text, UNDO_MS, { action: { label: t('gym.toast.undo'), run: () => void undo(plan) } });
  }

  async function undo(plan: ActInput[]) {
    for (const p of plan) if (!(await send(p, false))) return void toasts.show(t('gym.toast.undoFailed'));
    toasts.show(t('gym.toast.undone'));
  }

  async function check() {
    if (checkOff) return;
    checking = true;
    result = null;
    const r = await postAct({ a: 'check' }, poll.life);
    checking = false;
    if (poll.life.aborted) return;
    if (r.config) {
      acts.confirmed = r.config;
      take(r.config);
    }
    if (r.ok) {
      const n = r.slots?.length ?? 0;
      const what = [n ? t('gym.result.open', { n }) : t('gym.result.none'), ...(r.partial ? [t('gym.key.partial')] : [])].join(' · ');
      result = { text: t('gym.result.line', { time: timeOf(Date.now(), Date.now()), what }), slots: (r.slots ?? []).map((x) => `${dayTitle(x.day)} ${x.start}〜${x.end}`), bad: false };
    } else {
      if (r.err === 'cooldown' && r.retryAfter) readyAt = Date.now() + r.retryAfter * 1000;
      result = { text: r.hint ?? t('gym.err.failed'), slots: [], bad: true };
    }
    tickNow = Date.now();
  }

  /** ⋯'s rows: 今すぐ確認 (its cooldown, 確認中… while it runs; off while stopped), 確認を停止 or 確認を再開 (first while
   *  stopped), 確認の間隔 ›. */
  const checkLabel = $derived(checking || cfg?.checking ? t('gym.ctl.running') : wait > 0 ? t('gym.menu.checkWait', { s: wait }) : t('gym.ctl.check'));
  const menu = $derived.by(() => {
    if (!cfg) return [];
    const check = { id: 'check', label: checkLabel, off: checkOff };
    const every = { id: 'interval', label: t('gym.menu.interval', { n: cfg.intervalMin }) };
    return cfg.paused ? [[{ id: 'resume', label: t('gym.menu.resume') }, check, every]] : [[check, { id: 'stop', label: t('gym.menu.stop') }, every]];
  });

  /** A row of ⋯ picked (its sheet closed first; a question or the interval opens after it). */
  function pickMenu(id: string) {
    if (id === 'check') void check();
    else if (id === 'resume') void send({ a: 'resume' });
    else if (id === 'stop') void tick().then(() => (askStop = true));
    else if (id === 'interval') void tick().then(() => (intervalOpen = true));
  }

  // ---- the calendar ----

  function openDay(day: Day) {
    if (selecting) return toggle([day]);
    lastCell = day;
    note = null;
    editDay = day;
    editOpen = true;
  }

  function toggle(days: Day[]) {
    const next = new Set(selected);
    const all = days.every((d) => next.has(d));
    for (const d of days) if (all) next.delete(d); else next.add(d);
    selected = next;
  }

  function weekday(col: number) {
    toggle(cells.flatMap((w) => (w[col]?.row ? [w[col].day] : [])));
  }

  function startSelect(day?: Day) {
    selecting = true;
    selected = new Set(day ? [day] : []);
    cue('toggle-on');
  }

  function endSelect() {
    selecting = false;
    selected = new Set();
  }

  async function bulk(kind: DayAct | 'range', range?: readonly [Clock, Clock]) {
    if (!cfg || !selected.size) return void cue('boop');
    const days = [...selected].sort();
    await send(bulkAct(kind, days, cfg.rows, range));
  }

  function bulkReset() {
    if (selAnnounced) askBulkReset = true;
    else void bulk('reset');
  }

  function openBulkRange() {
    if (!selected.size) return void cue('boop');
    bulkPick = { range: ['12:00', '13:00'], open: false };
    bulkRangeOpen = true;
  }

  // the editor closed: its note goes, and focus back on the day (VoiceOver and the keyboard stay where they were)
  let wasOpen = false;
  $effect(() => {
    const o = editOpen;
    if (wasOpen && !o) note = null; // its note was the day's
    if (wasOpen && !o && lastCell) {
      const d = lastCell;
      void tick().then(() => document.querySelector<HTMLElement>(`[data-gym-day="${d}"]`)?.focus());
    }
    wasOpen = o;
  });
</script>

{#snippet noteRow()}
  {#if note}
    <div class="note bad" role="alert" data-gym-note>
      <span>{note.text}</span>
      {#if note.retry}<button type="button" class="btn small paper" data-sfx="tick" onclick={note.retry}>{t('state.retry')}</button>{/if}
    </div>
  {/if}
{/snippet}

<!-- under the verdict's sentence: 確認中…, 今すぐ確認's answer with the cooldown's tail (gone when it ends), an act's
     failure (the editor's own while it's open) -->
{#snippet answer()}
  {#if checking || cfg?.checking}
    <p class="rline" role="status" data-gym-result>{t('gym.ctl.running')}</p>
  {:else if result}
    <div class="rline" class:bad={result.bad} data-gym-result>
      <p role="status">{result.text}{#if wait > 0 && !result.bad}<span data-gym-wait> · {t('gym.result.next', { s: wait })}</span>{/if}</p>
      {#if result.slots.length}<ul>{#each result.slots as l (l)}<li>{l}</li>{/each}</ul>{/if}
    </div>
  {/if}
  {#if !editOpen}{@render noteRow()}{/if}
{/snippet}

<BotPage attr="gym" busy={poll.loading} failed={bot.failed} onretry={() => void poll.refresh()} {verdict} vid={data?.verdict} stale={bot.stale}
  readAt={bot.readAt} now={nowMs} keys={data ? keyRow(data, nowMs) : []}
  rootAttr={{ 'data-config': cfgLoading ? 'loading' : cfgState }} menu={cfg ? { label: t('gym.menu.label'), onopen: () => (menuOpen = true) } : null}
  note={result || checking || cfg?.checking || (note && !editOpen) ? answer : undefined}
  attention={reasons.length ? { lines: reasons } : null}
  strip={strip && { ...strip, title: t('gym.strip.title', { n: strip.width }), legend }}
  {facts}>
  {#if cfgState !== 'hidden'}
    <section class="sec" aria-labelledby="gym-config" data-gym-config>
      <div class="calhead">
        <h3 id="gym-config" class="sec-label">{t('gym.config')}</h3>
        {#if cfg && !selecting}<button type="button" class="chip s" data-gym-select data-sfx="self" onclick={() => startSelect()}>{t('gym.cal.select')}</button>{/if}
      </div>
      {#if cfgState === 'failed'}
        <div class="prow static" data-gym-config-error>
          <span class="prl"><Phrases text={t('gym.configFailed')} /></span>
          <button type="button" class="btn small paper" data-sfx="tick" aria-disabled={cfgLoading} onclick={() => cfgLoading || void loadConfig()}>{t('state.retry')}</button>
        </div>
      {/if}
      {#if cfg}
        <GymCalendar {cells} {selecting} {selected} {flash} onpick={openDay} onweekday={weekday} onlongpress={startSelect} />
        <p class="hint" data-gym-cal-note>{t('gym.cal.note')}</p>
        <details class="legend-fold" data-gym-legend-fold>
          <summary data-sfx="tick">{t('gym.legend.title')}<span class="chev" aria-hidden="true"></span></summary>
          <p class="legend" data-gym-legend>
            <span><i class="sw-any"></i>{t('gym.legend.any')}</span><span><i class="sw-range"></i>{t('gym.legend.range')}</span><span><i class="sw-usual"></i>{t('gym.legend.usual')}</span>
            <span><i class="sw-off"></i>{t('gym.legend.off')}</span><span><Icon name="hourglass" size={12} />{t('gym.legend.from')}</span><span><i class="sw-an"></i>{t('gym.legend.announced')}</span>
          </p>
        </details>

        {#if selecting}
          <div class="bulkbar" data-gym-bulk role="toolbar" aria-label={t('gym.cal.selected', { n: selected.size })}>
            <span class="count" aria-live="polite">{selected.size ? t('gym.cal.selected', { n: selected.size }) : t('gym.cal.pickDays')}</span>
            <div class="acts">
              <button type="button" class="btn small paper" data-gym-bulk-act="any" data-sfx="tick" aria-disabled={!selected.size} onclick={() => void bulk('any')}>{t('gym.kind.any')}</button>
              <button type="button" class="btn small paper" data-gym-bulk-act="range" data-sfx="tick" aria-disabled={!selected.size} aria-haspopup="dialog" onclick={openBulkRange}>{t('gym.kind.range')}</button>
              <button type="button" class="btn small paper" data-gym-bulk-act="skip" data-sfx="tick" aria-disabled={!selected.size} onclick={() => void bulk('skip')}>{t('gym.kind.off')}</button>
              <button type="button" class="btn small paper" data-gym-bulk-act="reset" data-sfx="tick" aria-disabled={!selected.size} onclick={bulkReset}>{t('gym.editor.reset')}</button>
              <button type="button" class="btn small" data-gym-bulk-done data-sfx="tick" onclick={endSelect}>{t('gym.cal.done')}</button>
            </div>
          </div>
        {/if}
        {#if cfg.changes.length}
          <details class="changes" data-gym-changes>
            <summary class="prow"><span class="prl">{t('gym.changes.title')}<small>{t('gym.changes.n', { n: Math.min(6, cfg.changes.length) })}</small></span><span class="chev" aria-hidden="true"></span></summary>
            <ul class="card rows">
              {#each cfg.changes.slice(0, 6) as c (`${c.t}-${c.d}-${c.a}`)}
                <li data-gym-change><span class="txt"><b>{changeLine(c)}</b><small>{t('gym.changes.by', { who: c.who, time: timeOf(c.t, nowMs) })}</small></span></li>
              {/each}
            </ul>
          </details>
        {/if}
      {/if}
    </section>

  {/if}
</BotPage>

<GymDayEditor bind:open={editOpen} row={editRow} {usualDay} now={pickNow} note={editOpen ? note : null} onact={(a) => void send(a)} />

<ActionSheet bind:open={menuOpen} title={t('gym.menu.label')} groups={menu} onpick={pickMenu} />

<Sheet bind:open={intervalOpen} title={t('gym.ctl.interval')} name="gym.interval">
  <div class="isheet" data-gym-interval>
    {#if cfg}
      <Segmented items={intervals} value={String(cfg.intervalMin)} label={t('gym.ctl.interval')} attr="gym-interval"
        onpick={(id) => { intervalOpen = false; void send({ a: 'interval', m: Number(id) }); }} />
    {/if}
    <p class="hint">{t('gym.ctl.intervalNote')}</p>
  </div>
</Sheet>

<ActionSheet bind:open={askStop} title={t('gym.ctl.stopAsk')} note={t('gym.ctl.stopNote')}
  groups={[[{ id: 'stop', label: t('gym.ctl.stop'), danger: true }], [{ id: 'cancel', label: t('gym.ctl.cancel') }]]}
  onpick={(id) => id === 'stop' && (cue('toggle-off'), void send({ a: 'pause' }))} />

<ActionSheet bind:open={askBulkReset} title={t('gym.bulk.resetAsk', { n: selected.size })} note={t('gym.bulk.resetNote', { n: selAnnounced })}
  groups={[[{ id: 'reset', label: t('gym.bulk.resetYes'), danger: true }], [{ id: 'cancel', label: t('gym.ctl.cancel') }]]}
  onpick={(id) => id === 'reset' && void bulk('reset')} />

<Sheet bind:open={bulkRangeOpen} title={t('gym.bulk.rangeTitle', { n: selected.size })} name="gym.bulk">
  <div class="isheet" data-gym-bulk-range>
    <GymSlots range={bulkPick.range} onpick={(s) => (bulkPick = pickSlot(bulkPick, s))} />
    {#if bulkPick.range}<p class="line">{t('gym.editor.slots', { range: longRange(bulkPick.range), n: slotCount(bulkPick.range) })}</p>{/if}
    <p class="hint">{bulkPick.open ? t('gym.editor.slotsEnd') : t('gym.editor.slotsHint')}</p>
  </div>
  {#snippet footer()}
    <button type="button" class="btn" data-gym-bulk-range-apply data-sfx="tick" aria-disabled={!bulkPick.range}
      onclick={() => { const r = bulkPick.range; bulkRangeOpen = false; if (r) void bulk('range', r); }}>{t('gym.bulk.apply', { n: selected.size })}</button>
  {/snippet}
</Sheet>

<style>
  .card { margin: 0; padding: 12px 14px; border-radius: var(--r-card); background: var(--card); box-shadow: var(--sh-lip); }

  /* 今すぐ確認's line under the verdict's sentence */
  .rline { margin: 0; font-size: var(--fs-s); font-weight: 700; line-height: var(--lh); font-variant-numeric: tabular-nums; }
  .rline p { margin: 0; }
  .rline ul { margin: 2px 0 0; padding-left: 1.2em; color: var(--text-soft); }
  .rline.bad { color: var(--coral-text); }

  .note { display: flex; align-items: center; gap: 8px; padding: 8px 8px 8px 12px; border-radius: var(--r-card); font-size: var(--fs-s); font-weight: 700; line-height: var(--lh); }
  .note span { flex: 1; }
  .note .btn { margin: 0; flex: none; }
  .note.bad { color: var(--coral-text); background: color-mix(in srgb, var(--c-coral) 18%, var(--card)); }

  .calhead { display: flex; align-items: center; justify-content: space-between; min-height: 32px; }
  .legend-fold > summary { list-style: none; display: inline-flex; align-items: center; gap: 6px; min-height: var(--hit); margin: -8px 0; padding: 0 4px; font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); cursor: pointer; }
  .legend-fold > summary::-webkit-details-marker { display: none; }
  .legend { margin: 4px 4px 0; display: flex; flex-wrap: wrap; gap: 2px 10px; font-size: var(--fs-xs); font-weight: 700; color: var(--text-soft); }
  .legend span { display: inline-flex; align-items: center; gap: 4px; }
  .legend i { display: inline-block; width: 11px; height: 11px; border-radius: 3px; }
  .sw-any { background: color-mix(in srgb, var(--c-leaf) 55%, var(--card)); }
  .sw-range { background: color-mix(in srgb, var(--c-mint) 60%, var(--card)); }
  .sw-usual { outline: 1.5px dashed color-mix(in srgb, var(--c-mint) 75%, var(--text-soft)); outline-offset: -1.5px; background: color-mix(in srgb, var(--c-mint) 22%, var(--card)); }
  .sw-off { background: var(--ctl-off); }
  .legend i.sw-an { border-radius: 50%; background: var(--c-gold); }

  /* the select mode's bar: stuck to the scroller's foot */
  .bulkbar {
    position: sticky; bottom: 0; z-index: 2; display: grid; gap: 6px; margin: 0 -4px; padding: 10px; border-radius: var(--r-card);
    background: var(--surface); box-shadow: var(--sh-float);
  }
  .bulkbar .count { font: 700 var(--fs-s)/1.2 var(--font-ui); margin: 0 4px; }
  .bulkbar .acts { display: flex; flex-wrap: wrap; gap: 6px; }
  .bulkbar .btn { margin: 0; padding: 0 12px; flex: 1 0 auto; }

  .changes > summary { list-style: none; }
  .changes > summary::-webkit-details-marker { display: none; }
  .changes[open] > summary { margin-bottom: 8px; }
  .rows { list-style: none; display: grid; gap: 8px; margin: 0; }
  .rows > li + li { padding-top: 8px; border-top: 1px dashed color-mix(in srgb, var(--text-soft) 40%, transparent); }
  .txt { font-size: var(--fs-body); }
  .txt b { display: block; line-height: 1.3; }
  .txt small { display: block; margin-top: 2px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }

  .isheet { display: grid; gap: 10px; padding-bottom: 12px; }
  .isheet .hint { margin: 0 4px; font-size: var(--fs-s); font-weight: 700; line-height: var(--lh); color: var(--text-soft); }
  .line { margin: 0 4px; font: 700 var(--fs-body)/1.3 var(--font-ui); }
</style>
