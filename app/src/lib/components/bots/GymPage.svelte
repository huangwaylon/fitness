<script lang="ts">
  // ボット's ジム tab (docs/design.md "Bots"): the gym bot's settings, then its health. On top (members, with this
  // phone's key: lib/gym/config.ts) the control row — チェック中・15分ごと (a tap stops, asked first, or restarts),
  // 今すぐ確認 (a peek: its 60 s countdown, its answer under the row) and ⋯ (確認の間隔) — then the 4-week calendar
  // (GymCalendar: a tap opens the day's editor, GymDayEditor; 選択 or a long press the select mode, its sticky bar one
  // bulk act), a one-line legend and the 3-reservation note; アプリで変更 (the last ones, one a day) folded near the
  // foot. Every change applies at once (no draft): the page shows it, POST /gym/act sends it after the ones before it
  // (one at a time, each with its days' bases as the last answer left them), and its banner offers 取り消す for 5 s
  // (one undo an act or bulk act: lib/gym/calendar.ts undoActs); a failure puts back only its own days, with a coral
  // note and もう一度, the bot's refusals in its words, a 409 stale shows the day as it is now
  // (「ほかの人が変更しました」). A poll that sees a day change under the page flashes its cell.
  // At the foot, quiet, 動作状況: the verdict (compact), 直近12時間 (StatusStrip), the facts (FactList), the foot.
  // Both read on open, then every minute while shown (poll.svelte.ts; each status read sets the tab's dot:
  // open.svelte.ts); leaving it (the other tab or ✕ unmounts it) stops that, and nothing ticks while hidden. The last
  // status read shows at once, marked 更新中 (lastKnown.ts). A failed read keeps the last answer shown under a row with
  // もう一度; the settings have their own, and stay out of sight while the Worker doesn't serve them (config.ts settle).
  import { tick } from 'svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import { formatSyncTime } from '#lib/i18n/format.ts';
  import { dayKey, minuteNow } from '#lib/time/clock.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { checkStrip, factRows, fetchStatus, needsAttention, parseStatus, verdictView, type GymStatus } from '#lib/gym/status.ts';
  import { fetchConfig, postAct, settle, type GymConfig } from '#lib/gym/config.ts';
  import { bulkAct, changeLine, dayTitle, fromWords, longRange, movedDays, pickSlot, predictAll, slotCount, undoActs, weeks, withBase, type SlotPick } from '#lib/gym/calendar.ts';
  import { at, type ActInput, type Clock, type Day, type DayAct } from '#lib/gym/contract.ts';
  import Sheet from '../ui/Sheet.svelte';
  import Segmented from '../ui/Segmented.svelte';
  import ActionSheet from '../ui/ActionSheet.svelte';
  import Icon from '../ui/Icon.svelte';
  import { setBadge } from './open.svelte.ts';
  import VerdictCard from './VerdictCard.svelte';
  import StatusStrip from './StatusStrip.svelte';
  import FactList from './FactList.svelte';
  import Skeleton from './Skeleton.svelte';
  import GymCalendar from './GymCalendar.svelte';
  import GymDayEditor from './GymDayEditor.svelte';
  import GymSlots from './GymSlots.svelte';
  import { statusPoll } from './poll.svelte.ts';
  import { recall, remember } from './lastKnown.ts';

  const EVERY_MS = 60_000;
  const UNDO_MS = 5000;

  /** The status shown: the last read (the one kept from before until this page's first answer: `fresh` false). */
  let data = $state<GymStatus | null>(recall('gym', parseStatus));
  let fresh = $state(false);
  let failed = $state(false);
  /** The settings shown: the last answer (`confirmed`) with the acts still queued predicted on it. */
  let cfg = $state<GymConfig | null>(null);
  let confirmed: GymConfig | null = null;
  let cfgState = $state<'hidden' | 'ok' | 'failed'>('hidden');
  let cfgLoading = $state(false);
  let cfgCtl: AbortController | null = null;
  /** The acts not yet answered, the first on its way; how many have answered (a read that began before the last
   *  answer is dropped). */
  let queue: { input: ActInput; undoable: boolean; done: (ok: boolean) => void }[] = [];
  let answered = 0;
  /** The last act's refusal or failure (coral), with もう一度; `stale`: someone else changed the day. */
  let note = $state<{ text: string; retry?: () => void } | null>(null);
  /** 今すぐ確認's answer (the bot's lines), or its refusal. */
  let result = $state<{ lines: string[]; bad: boolean } | null>(null);
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
  let askBulkReset = $state(false);
  let intervalOpen = $state(false);
  let bulkRangeOpen = $state(false);
  let bulkPick = $state<SlotPick>({ range: ['12:00', '13:00'], open: false });
  let lastCell: Day | null = null;

  async function loadConfig() {
    if (week.guest) return; // members only: the guest asks nothing
    cfgCtl?.abort();
    const c = (cfgCtl = new AbortController());
    const signal = AbortSignal.any([c.signal, poll.life]);
    const seen = answered;
    cfgLoading = true;
    const r = await fetchConfig(signal);
    if (cfgCtl === c) cfgLoading = false;
    // an act answered (or is on its way) since: its config is newer than this read's
    if (signal.aborted || queue.length || seen !== answered) return;
    const was = confirmed;
    const s = settle(confirmed, r);
    [confirmed, cfgState] = [s.cfg, s.state];
    show();
    if (was && s.cfg && was !== s.cfg) light(movedDays(was.rows, s.cfg.rows));
    if (s.cfg) take(s.cfg);
  }

  /** A config with an act predicted on it (the page shows it at once; the answer replaces it). */
  const predicted = (c: GymConfig, input: ActInput): GymConfig => ({
    ...c, rows: predictAll(c.rows, input, c.defaultDays),
    ...(input.a === 'pause' || input.a === 'resume' ? { paused: input.a === 'pause' } : input.a === 'interval' ? { intervalMin: input.m } : {})
  });

  function show() {
    cfg = confirmed && queue.reduce((c, q) => predicted(c, q.input), confirmed);
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
    setTimeout(() => (flash = new Set()), 1600);
  }

  const poll = statusPoll(async (signal) => {
    void loadConfig();
    const r = await fetchStatus(signal);
    if (signal.aborted) return;
    failed = !r.ok;
    if (!r.ok) return;
    [data, fresh] = [r.status, true];
    remember('gym', r.status);
    setBadge('gym', needsAttention(r.status));
  }, () => EVERY_MS);

  // 今すぐ確認's countdown: a tick a second while it runs (none while the phone is put away: the clock catches up)
  $effect(() => {
    if (readyAt <= tickNow) return;
    const id = setInterval(() => (document.hidden ? undefined : (tickNow = Date.now())), 1000);
    return () => clearInterval(id);
  });

  const today = $derived(dayKey(minuteNow()));
  /** The editor's now: the Worker's clock, a minute ahead (the tick is up to a minute old), so a ⏳ time isn't
   *  offered in its last minute, when the bot would refuse it as passed. */
  const pickNow = $derived(minuteNow().getTime() + skew + 60_000);
  const verdict = $derived(data && verdictView(data));
  const facts = $derived(data ? factRows(data, today) : []);
  const strip = $derived(data && checkStrip(data));
  const legend = { ok: t('gym.strip.legend.ok'), avail: t('gym.strip.legend.avail'), fail: t('gym.strip.legend.fail'), none: t('gym.strip.legend.none') };
  const cells = $derived(cfg ? weeks(cfg.rows) : []);
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

  /** One change: shown at once, then sent after the ones before it (one act on its way at a time), the answer's config
   *  taken; 取り消す on its banner. Resolves when it is answered: true when applied. */
  function send(input: ActInput, undoable = true): Promise<boolean> {
    if (!confirmed) return Promise.resolve(false);
    note = null;
    return new Promise((done) => {
      queue.push({ input, undoable, done });
      show();
      if (queue.length === 1) void drain();
    });
  }

  /** The queue's acts, in turn: each with the bases and the rows of the latest config when it goes out (so a second
   *  edit to a day carries the base the first one's answer gave it). A refusal or failure puts back only its own days
   *  (the bot's refusal in its words; a stale day as it is now); the acts after it go on. */
  async function drain() {
    while (queue.length && confirmed) {
      const q = queue[0];
      const was = confirmed;
      const r = await postAct(withBase(q.input, was.rows), poll.life);
      answered++;
      if (poll.life.aborted) break;
      queue.shift();
      confirmed = r.config ?? was;
      if (r.ok) take(r.config);
      show();
      if (r.ok) {
        if (r.changed && q.undoable) offerUndo(q.input, was, r.config);
        q.done(true);
        continue;
      }
      cue('boop');
      if (r.err === 'stale') {
        note = { text: t('gym.err.stale') };
        if (r.config) light(movedDays(was.rows, r.config.rows));
      } else {
        const own = r.hint && r.http !== null && r.http < 500 && r.http !== 401 && r.http !== 403;
        note = own ? { text: r.hint! } : { text: t('gym.err.failed'), retry: () => void send(q.input, q.undoable) };
      }
      q.done(false);
    }
    for (const x of queue.splice(0)) x.done(false); // the page left
  }

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
      confirmed = r.config;
      show();
      take(r.config);
    }
    if (r.ok) result = { lines: r.lines ?? [], bad: false };
    else {
      if (r.err === 'cooldown' && r.retryAfter) readyAt = Date.now() + r.retryAfter * 1000;
      result = { lines: [r.hint ?? t('gym.err.failed')], bad: true };
    }
    tickNow = Date.now();
  }

  function toggleRun() {
    if (!cfg) return;
    if (cfg.paused) void send({ a: 'resume' });
    else askStop = true;
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

<div class="gym" data-gym-page aria-busy={poll.loading} data-config={cfgLoading ? 'loading' : cfgState}>
  {#if cfgState !== 'hidden'}
    <section class="sec" aria-labelledby="gym-config" data-gym-config>
      <h3 id="gym-config" class="sr">{t('gym.config')}</h3>
      {#if cfgState === 'failed'}
        <div class="prow static" data-gym-config-error>
          <span class="prl">{t('gym.configFailed')}</span>
          <button type="button" class="btn small paper" data-sfx="tick" aria-disabled={cfgLoading} onclick={() => cfgLoading || void loadConfig()}>{t('state.retry')}</button>
        </div>
      {/if}
      {#if cfg}
        <div class="ctl" data-gym-controls>
          <button type="button" class="pill run" class:off={cfg.paused} data-gym-run={cfg.paused ? 'stopped' : 'running'} data-sfx="tick"
            aria-haspopup={cfg.paused ? undefined : 'dialog'} onclick={toggleRun}>
            <span class="dot" aria-hidden="true"></span><span>{cfg.paused ? t('gym.ctl.off') : t('gym.ctl.on', { n: cfg.intervalMin })}</span>
          </button>
          <button type="button" class="pill" data-gym-check data-sfx="tick" aria-disabled={checkOff} onclick={() => void check()}>
            <Icon name="search" size={18} /><span>{checking || cfg.checking ? t('gym.ctl.running') : wait > 0 ? t('gym.ctl.wait', { s: wait }) : t('gym.ctl.check')}</span>
          </button>
          <button type="button" class="pill more" data-gym-interval-open data-sfx="tick" aria-haspopup="dialog" aria-label={t('gym.ctl.interval')} onclick={() => (intervalOpen = true)}>
            <Icon name="more" size={20} stroke={3} />
          </button>
        </div>
        {#if cfg.paused}<p class="hint" data-gym-stopped>{t('gym.ctl.stoppedNote')}</p>{/if}
        {#if result}
          <div class="card result" class:bad={result.bad} data-gym-result role="status">
            <div class="rhead"><b>{t('gym.result.title')}</b>
              <button type="button" class="x" data-sfx="tick" aria-label={t('gym.result.close')} onclick={() => (result = null)}><Icon name="close" size={18} /></button>
            </div>
            {#each result.lines as l, i (i)}<p class:day={/^\d+\/\d+（/.test(l)}>{l}</p>{/each}
          </div>
        {/if}
        {#if !editOpen}{@render noteRow()}{/if}

        <div class="calhead">
          <span class="sec-label">{t('gym.config')}</span>
          {#if !selecting}<button type="button" class="chip s" data-gym-select data-sfx="self" onclick={() => startSelect()}>{t('gym.cal.select')}</button>{/if}
        </div>
        <GymCalendar {cells} {selecting} {selected} {flash} onpick={openDay} onweekday={weekday} onlongpress={startSelect} />
        <p class="legend" data-gym-legend>
          <span><i class="sw-any"></i>{t('gym.legend.any')}</span><span><i class="sw-range"></i>{t('gym.legend.range')}</span><span><i class="sw-usual"></i>{t('gym.legend.usual')}</span>
          <span><i class="sw-off"></i>{t('gym.legend.off')}</span><span><Icon name="hourglass" size={12} />{t('gym.legend.from')}</span><span><i class="sw-an"></i>{t('gym.legend.announced')}</span>
        </p>
        <p class="hint" data-gym-cal-note>{t('gym.cal.note')}</p>

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
            <summary class="prow"><span class="prl">{t('gym.changes.title')}</span><span class="chev" aria-hidden="true"></span></summary>
            <ul class="card rows">
              {#each cfg.changes.slice(0, 6) as c (`${c.t}-${c.d}-${c.a}`)}
                <li data-gym-change><span class="txt"><b>{changeLine(c)}</b><small>{t('gym.changes.by', { who: c.who, time: formatSyncTime(new Date(c.t), today) })}</small></span></li>
              {/each}
            </ul>
          </details>
        {/if}
      {/if}
    </section>
  {/if}

  <section class="sec status" aria-labelledby="gym-status" data-gym-status>
    <h3 id="gym-status" class="sec-label">{t('gym.status')}</h3>
    {#if failed}
      <div class="prow static" data-gym-error>
        <span class="prl">{t('common.loadFailed')}</span>
        <button type="button" class="btn small paper" data-sfx="tick" aria-disabled={poll.loading} onclick={() => poll.loading || void poll.refresh()}>{t('state.retry')}</button>
      </div>
    {/if}
    {#if data && verdict && strip}
      <VerdictCard tone={verdict.tone} word={verdict.word} sentence={verdict.sentence} attr={{ 'data-gym-verdict': data.verdict }} stale={!fresh && poll.loading} compact />
      <div class="card">
        <StatusStrip cells={strip.cells} ticks={strip.ticks} title={t('gym.strip.title')} {legend} summary={strip.summary} hint={t('gym.strip.pick')} attr="gym" />
        <FactList {facts} more={t('gym.more')} attr="gym" />
      </div>
      <p class="foot" data-gym-foot>{[data.mode, data.sha?.slice(0, 7), t('gym.updated', { time: formatSyncTime(new Date(data.now), today) })].filter(Boolean).join(' · ')}</p>
    {:else if !failed}
      <Skeleton attr="gym" />
    {/if}
  </section>
</div>

<GymDayEditor bind:open={editOpen} row={editRow} {usualDay} now={pickNow} note={editOpen ? note : null} onact={(a) => void send(a)} />

<ActionSheet bind:open={askStop} title={t('gym.ctl.stopAsk')} note={t('gym.ctl.stopNote')}
  groups={[[{ id: 'stop', label: t('gym.ctl.stop'), danger: true }], [{ id: 'cancel', label: t('gym.ctl.cancel') }]]}
  onpick={(id) => id === 'stop' && void send({ a: 'pause' })} />

<ActionSheet bind:open={askBulkReset} title={t('gym.bulk.resetAsk', { n: selected.size })} note={t('gym.bulk.resetNote', { n: selAnnounced })}
  groups={[[{ id: 'reset', label: t('gym.bulk.resetYes'), danger: true }], [{ id: 'cancel', label: t('gym.ctl.cancel') }]]}
  onpick={(id) => id === 'reset' && void bulk('reset')} />

<Sheet bind:open={intervalOpen} title={t('gym.ctl.interval')} name="gym.interval">
  <div class="isheet" data-gym-interval>
    {#if cfg}
      <Segmented items={intervals} value={String(cfg.intervalMin)} label={t('gym.ctl.interval')} attr="gym-interval"
        onpick={(id) => { intervalOpen = false; void send({ a: 'interval', m: Number(id) }); }} />
    {/if}
    <p class="hint">{t('gym.ctl.intervalNote')}</p>
  </div>
</Sheet>

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
  .gym { display: flex; flex-direction: column; gap: 14px; }
  .card { margin: 0; padding: 12px 14px; border-radius: var(--r-card); background: var(--card); box-shadow: var(--sh-lip); }
  .sec { display: grid; gap: 8px; }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  /* 動作状況: the page's foot, set apart a little */
  .status { margin-top: 10px; }
  .hint { margin: 0 4px; font-size: var(--fs-s); font-weight: 700; line-height: var(--lh); color: var(--text-soft); }

  /* the control row: 3 pills, 44px; never wider than the page (min-width: 0), whatever the labels say */
  .ctl { display: flex; gap: 6px; min-width: 0; }
  .pill {
    appearance: none; border: 0; cursor: pointer; min-height: var(--hit); padding: 0 12px; border-radius: var(--r-pill); min-width: 0;
    display: inline-flex; align-items: center; justify-content: center; gap: 6px; white-space: nowrap;
    font: 700 var(--fs-s)/1 var(--font-ui); color: var(--text); background: var(--ctl); box-shadow: var(--sh-ctl);
  }
  .pill.run { flex: 1 1 auto; justify-content: flex-start; overflow: hidden; }
  .pill.run span:last-child { overflow: hidden; text-overflow: ellipsis; }
  /* 今すぐ確認, あと60秒 and 確認中… hold one width (no jump as it counts down) */
  .pill[data-gym-check] { flex: none; min-width: 7.5em; font-variant-numeric: tabular-nums; }
  .pill.more { flex: none; width: var(--hit); padding: 0; }
  .pill .dot { flex: none; width: 10px; height: 10px; border-radius: 50%; background: var(--c-leaf); box-shadow: 0 0 0 2px var(--card), 0 0 0 3px var(--c-leaf-edge); }
  .pill.run.off .dot { background: var(--ctl-off); box-shadow: 0 0 0 2px var(--card), 0 0 0 3px var(--edge); }
  .pill.run.off { color: var(--text-soft); }
  .pill[aria-disabled='true'] { color: var(--text-soft); background: var(--ctl-off); box-shadow: none; cursor: default; }
  .pill:not([aria-disabled='true']):active { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
  .pill:focus-visible, .x:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }

  .result { display: grid; gap: 2px; font-size: var(--fs-s); font-weight: 700; line-height: var(--lh); }
  .result p { margin: 0; }
  .result p.day { margin-top: 4px; color: var(--text-soft); }
  .result.bad { background: color-mix(in srgb, var(--c-coral) 14%, var(--card)); }
  .rhead { display: flex; align-items: center; justify-content: space-between; margin: -8px -10px 0 0; }
  .x { appearance: none; border: 0; background: none; cursor: pointer; width: var(--hit); height: var(--hit); display: grid; place-items: center; color: var(--text-soft); }

  .note { display: flex; align-items: center; gap: 8px; padding: 8px 8px 8px 12px; border-radius: var(--r-card); font-size: var(--fs-s); font-weight: 700; line-height: var(--lh); }
  .note span { flex: 1; }
  .note .btn { margin: 0; flex: none; }
  .note.bad { color: var(--coral-text); background: color-mix(in srgb, var(--c-coral) 18%, var(--card)); }

  .calhead { display: flex; align-items: center; justify-content: space-between; margin-top: 4px; }
  .calhead .sec-label { margin: 0 4px; }
  .legend { margin: 0 4px; display: flex; flex-wrap: wrap; gap: 2px 10px; font-size: var(--fs-xs); font-weight: 700; color: var(--text-soft); }
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
  .line { margin: 0 4px; font: 700 var(--fs-body)/1.3 var(--font-ui); }
  .foot { margin: 0 4px; text-align: center; font-size: var(--fs-s); color: var(--text-soft); overflow-wrap: anywhere; line-height: var(--lh); }
  @media (prefers-reduced-motion: reduce) { .pill:active { transform: none; } }
</style>
