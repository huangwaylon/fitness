<script lang="ts">
  // 設定's 保養所ボット level (docs/design.md "Settings"): the ITS booker as its Worker reports it (lib/its: GET
  // /its/status) and its settings. Top to bottom: a notice (a failed read with its code; the allow-list's first save),
  // the verdict card (tinted by tone, 開始 / 停止 at once, outside the draft, and who pressed it), the bookings (a
  // hold's deadline and what to do), 状況 (くわしく folds the rest), the stays (日付: one at a time or まとめて追加, each
  // with what can take it), the facilities (施設: 探す is the allow-list; groups, presets, a name filter, the new ones on
  // top), 詳細 (確認の間隔, 人数, 自動で確定), the recent events and the foot. The settings are one draft saved with 保存
  // (the sticky bar while it differs, with why: someone else's save, the draft note or the refusal; ✕, the backdrop
  // and Esc ask first: guardForm, ‹ too: `leave`). Fetched on open, then every 15 s while the runner is on its way or
  // running and every minute otherwise, only while shown; leaving it aborts, and 保存 / 開始 / 停止 abort a read in
  // flight (an answer older than the one shown is dropped). A poll never touches a draft: when the saved settings moved
  // under it it says so, with 読み込み直す, and 保存 becomes 上書き保存 (asks first). Saved settings without an
  // allow-list (a Worker from before it) give a derived one (view.ts draftOf), said once until saved. Not in demo mode
  // (設定 hides the row: no fixture).
  import { tick, untrack } from 'svelte';
  import Segmented from '../ui/Segmented.svelte';
  import ActionSheet from '../ui/ActionSheet.svelte';
  import Sheet from '../ui/Sheet.svelte';
  import Chip from '../ui/Chip.svelte';
  import Phrases from '../ui/Phrases.svelte';
  import { askDiscard, guardForm } from '../ui/discard.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import { formatDate } from '#lib/i18n/format.ts';
  import { dayKey, minuteNow, now as sceneNow } from '#lib/time/clock.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { villagerNameOf } from '#lib/ui-state/viewer.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { GUESTS_MAX, GUESTS_MIN, INTERVALS_SEC, daysUntil, type IntervalSec, type ItsStatus, type Member, type RunInput } from '#lib/its/contract.ts';
  import { fetchStatus, postRun, putSettings, type ItsReply } from '#lib/its/client.ts';
  import {
    PRESETS, addDate, addDates, applyPreset, bookingRows, bulkDates, controlLine, dateBounds, dateMonths, dateRows, draftOf, eventLines, factRows, footLine,
    hotelGroups, hotelNote, hotelRows, legacy, pollMs, presetOf, removeDate, sameDraft, saveError, savedLine, scanCells, scanSummary, scanTicks, setSearch,
    toInput, toggleSearch, toggleStar, verdictView, STRIP_MIN, type Draft, type HotelRow
  } from '#lib/its/view.ts';

  /** ‹'s guard (SettingsSheet's back): asks first while the draft holds changes. */
  let { leave = $bindable() }: { leave?: (run: () => void) => void } = $props();

  let status = $state<ItsStatus | null>(null);
  /** The last read's failure code (offline, http 502, …), or null. */
  let failed = $state<string | null>(null);
  let loading = $state(false);
  /** The draft (null: the saved settings shown as they are), what it began from and that `updatedAt`. */
  let draft = $state<Draft | null>(null);
  let start: Draft | null = null;
  let base: number | null = null;
  /** The saved settings moved under the draft (a poll saw it, or 保存 got a 409). */
  let conflict = $state(false);
  let saving = $state(false);
  /** Why the last 保存 failed (the Worker's refusal in words), or null. */
  let saveWhy = $state<string | null>(null);
  let running = $state(false);
  let adding = $state('');
  let addWhy = $state<string | null>(null);
  let askAuto = $state(false);
  let askOverwrite = $state(false);
  let openHotels = $state(false);
  let openMore = $state(false);
  let filter = $state('');
  /** The stay whose facilities are shown, or null. */
  let openDate = $state<string | null>(null);
  let bulkOpen = $state(false);
  let bulkFrom = $state('');
  let bulkTo = $state('');
  let bulkDays = $state<number[]>([5, 6]);
  let autoBtn = $state<HTMLButtonElement>();
  let bulkBtn = $state<HTMLButtonElement>();

  const dirty = $derived(!!draft && !!start && !sameDraft(draft, start));
  guardForm(() => dirty);
  const ask = askDiscard();
  leave = (run) => (dirty ? ask(run) : run());

  /** The page's life: every call aborts as it's left. */
  const life = new AbortController();
  let ctl: AbortController | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  /** Every answer's status (a read's, 保存's, a 409's, 開始 / 停止's): one older than the shown one is dropped; the
   *  draft is kept (noting a move of the saved settings under it), an unchanged one let go. */
  function take(s: ItsStatus) {
    if (status && s.now < status.now) return;
    status = s;
    if (!dirty) {
      draft = start = null;
      conflict = false;
    } else if (s.settings.updatedAt !== base) {
      conflict = true;
      saveWhy = null;
    }
  }

  function schedule() {
    clearTimeout(timer);
    if (!life.signal.aborted) timer = setTimeout(() => (document.hidden ? schedule() : void load()), pollMs(status));
  }

  /** A read in flight let go and the poll held (保存 / 開始 / 停止 answer with the status themselves). */
  function hold() {
    ctl?.abort();
    ctl = null;
    loading = false;
    clearTimeout(timer);
  }

  async function load() {
    if (saving || running) return;
    ctl?.abort();
    const c = (ctl = new AbortController());
    const stop = () => c.abort();
    life.signal.addEventListener('abort', stop);
    loading = true;
    const r = await fetchStatus(c.signal);
    life.signal.removeEventListener('abort', stop);
    if (c.signal.aborted) return;
    ctl = null;
    loading = false;
    if (r.ok) take(r.status);
    failed = r.ok ? null : [r.err, r.http].filter((x) => x !== null).join(' ');
    schedule();
  }

  $effect(() => {
    untrack(() => void load());
    const onVisible = () => document.hidden || void load();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearTimeout(timer);
      life.abort();
    };
  });

  /** Focus back on what opened a sheet once it closes (VoiceOver and the keyboard stay where they were). */
  function refocus(open: () => boolean, el: () => HTMLElement | undefined) {
    let was = false;
    $effect(() => {
      const now = open();
      if (was && !now) void tick().then(() => el()?.focus());
      was = now;
    });
  }
  refocus(() => askAuto, () => autoBtn);
  refocus(() => bulkOpen, () => bulkBtn);

  const nowMs = $derived(minuteNow().getTime());
  const today = $derived(dayKey(minuteNow()));
  const name = (m: Member) => (week.view ? villagerNameOf(week.view, m) : m);
  /** What the page shows: the draft, else the saved settings (an allow-list derived when they have none). */
  const shown = $derived(draft ?? (status ? draftOf(status.settings, status.seen) : null));
  const verdict = $derived(status && verdictView(status));
  const facts = $derived(status ? factRows(status, today) : []);
  const bookings = $derived(status ? bookingRows(status, today, nowMs) : []);
  const events = $derived(status ? eventLines(status, today) : []);
  const hotels = $derived<HotelRow[]>(shown && status ? hotelRows(shown, status.seen, status.settings) : []);
  const dates = $derived(shown ? dateRows(shown, nowMs, hotels, status?.bookings) : []);
  const months = $derived(dateMonths(dates));
  const bounds = $derived(dateBounds(nowMs));
  const groups = $derived(openHotels ? hotelGroups(hotels, filter) : []);
  const fresh = $derived(hotels.filter((r) => r.undecided));
  const searching = $derived(hotels.filter((r) => r.search).length);
  const starred = $derived(hotels.filter((r) => r.star !== null).sort((a, b) => a.star! - b.star!).map((r) => r.name));
  const preset = $derived(presetOf(hotels));
  const paused = $derived(status?.settings.paused ?? true);
  /** 開始 needs a saved stay from tonight on. */
  const noDates = $derived(!!status && !status.settings.dates.some((d) => daysUntil(d, nowMs) >= 0));
  const control = $derived(status && controlLine(status, name, today));
  const saved = $derived(status && savedLine(status, name, today));
  const migrating = $derived(!!status && legacy(status.settings));
  /** 直近1時間 (a Worker that keeps the reads; else hidden), by Tokyo minute; the minute picked (its line), or null. */
  const scans = $derived(status?.recentScans);
  const cells = $derived(scans ? scanCells(scans, status!.now) : []);
  const ticks = $derived(scanTicks(cells));
  let picked = $state<number | null>(null);
  let strip = $state<HTMLElement>();
  /** A tap anywhere on the strip picks the minute under it (60 cells are narrower than a finger). */
  function pickAt(e: PointerEvent) {
    if (!strip) return;
    const r = strip.getBoundingClientRect();
    const i = Math.min(STRIP_MIN - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * STRIP_MIN)));
    picked = i;
    cue('tick');
    strip.querySelectorAll<HTMLElement>('[data-its-cell]')[i]?.focus({ preventScroll: true });
    e.preventDefault();
  }
  /** ← → move along the minutes (one tab stop: the picked one, else the newest). */
  function stripKey(e: KeyboardEvent) {
    const step = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : e.key === 'Home' ? -STRIP_MIN : e.key === 'End' ? STRIP_MIN : 0;
    if (!step) return;
    e.preventDefault();
    picked = Math.min(STRIP_MIN - 1, Math.max(0, (picked ?? STRIP_MIN - 1) + step));
    strip?.querySelectorAll<HTMLElement>('[data-its-cell]')[picked]?.focus();
  }
  const bulk = $derived(shown && bulkOpen ? bulkDates(shown, bulkFrom, bulkTo, bulkDays, nowMs) : { add: [], over: 0 });

  function edit(f: (d: Draft) => Draft) {
    if (!status || !shown) return;
    if (!draft) {
      start = draftOf(status.settings, status.seen);
      base = status.settings.updatedAt;
    }
    draft = f(shown);
    saveWhy = null;
  }

  function add() {
    if (!shown) return;
    const r = addDate(shown, adding, nowMs);
    if (!r.ok) {
      cue('boop');
      addWhy = t(`its.date.why.${r.why}`);
      return;
    }
    addWhy = null;
    adding = '';
    cue('confirm');
    edit(() => r.draft);
  }

  function openBulk() {
    bulkFrom = bulkFrom || bounds.min;
    bulkTo = bulkTo || bounds.min;
    bulkOpen = true;
  }

  function addBulk() {
    if (!bulk.add.length) return void cue('boop');
    const add = bulk.add;
    cue('confirm');
    edit((d) => addDates(d, add, nowMs));
    bulkOpen = false;
  }

  const toggleDay = (n: number) => (bulkDays = bulkDays.includes(n) ? bulkDays.filter((x) => x !== n) : [...bulkDays, n]);

  function setAuto(on: boolean) {
    cue(on ? 'toggle-on' : 'toggle-off');
    edit((d) => ({ ...d, autoConfirm: on }));
  }

  function discard() {
    cue('back');
    draft = start = null;
    conflict = false;
    saveWhy = null;
  }

  /** 読み込み直す: the draft let go, the saved settings read again. */
  function reload() {
    discard();
    void load();
  }

  /** 上書き保存 (after its question): the draft saved over the settings shown now. */
  function overwrite() {
    if (!status) return;
    base = status.settings.updatedAt;
    conflict = false;
    void save();
  }

  /** The allow-list's first save: the derived one as it is (or the draft). */
  function saveDerived() {
    if (!draft) edit((d) => d);
    void save();
  }

  async function save() {
    if (!draft || !status || saving) return;
    if (conflict) {
      askOverwrite = true;
      return;
    }
    hold();
    saving = true;
    saveWhy = null;
    const r = await putSettings(toInput(draft, base, sceneNow().getTime()), life.signal);
    saving = false;
    if (life.signal.aborted) return;
    if (r.ok) {
      draft = start = null;
      cue('confirm');
      toasts.show(t('its.saved'));
    } else if (r.err !== 'conflict') saveWhy = saveError(r.err);
    if (r.status) take(r.status);
    if (!r.ok && r.err === 'conflict') conflict = true;
    schedule();
  }

  async function run(action: RunInput['action']) {
    if (!status || running) return;
    if (action === 'start' && noDates) return void cue('boop');
    hold();
    running = true;
    const r: ItsReply = await postRun(action, life.signal);
    running = false;
    if (life.signal.aborted) return;
    if (r.ok) take(r.status);
    else toasts.show(t(action === 'start' ? 'its.ctl.startFailed' : 'its.ctl.stopFailed'), 4000);
    schedule();
  }

  const intervals = INTERVALS_SEC.map((s) => ({ id: String(s), label: s < 60 ? t('its.interval.s', { n: s }) : t('its.interval.m', { n: s / 60 }) }));
  const guests = Array.from({ length: GUESTS_MAX - GUESTS_MIN + 1 }, (_, i) => ({ id: String(GUESTS_MIN + i), label: t('its.guestsN', { n: GUESTS_MIN + i }) }));
  /** 日〜土 (0 = 日; the catalog's weekday.N is ISO, 7 = 日). */
  const weekdays = [0, 1, 2, 3, 4, 5, 6].map((n) => ({ n, label: t(`weekday.${n || 7}`) }));
</script>

{#snippet hotel(r: HotelRow)}
  <li class="hrow" class:starred={r.star !== null} data-its-hotel={r.name} data-search={r.search}>
    <button type="button" class="hsw" role="switch" aria-checked={r.search} data-sfx="self"
      onclick={() => (cue(r.search ? 'toggle-off' : 'toggle-on'), edit((d) => toggleSearch(d, r)))}>
      <span class="txt"><b>{r.name}</b><small class:fresh={r.fresh}>{hotelNote(r)}</small></span>
      <span class="sw s" aria-hidden="true"><i></i></span>
    </button>
    <button type="button" class="star" aria-pressed={r.star !== null} data-its-star={r.name} data-sfx="tick"
      aria-label={r.star === null ? t('its.hotel.star', { name: r.name }) : t('its.hotel.starN', { name: r.name, n: r.star + 1 })}
      onclick={() => edit((d) => toggleStar(d, r.name))}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z" /></svg>{#if r.star !== null}<b aria-hidden="true">{r.star + 1}</b>{/if}
    </button>
  </li>
{/snippet}

<div class="its" data-its-page aria-busy={loading}>
  {#if failed}
    <div class="prow static note" data-its-error>
      <span class="prl">{t('its.loadFailed', { code: failed })}</span>
      <button type="button" class="btn small paper" data-sfx="tick" aria-disabled={loading} onclick={() => loading || void load()}>{t('state.retry')}</button>
    </div>
  {/if}
  {#if status && verdict && shown}
    {#if migrating}
      <div class="card note" data-its-migrate role="status">
        <p><Phrases text={t('its.hotel.migrate')} /></p>
        <button type="button" class="btn small paper" data-its-migrate-save data-sfx="tick" aria-disabled={saving} onclick={saveDerived}>{t('its.hotel.migrateSave')}</button>
      </div>
    {/if}

    <div class="card verdict {verdict.tone}" data-its-verdict={status.verdict}>
      <div class="vhead">
        <span class="dot {verdict.tone}" aria-hidden="true"></span>
        <div class="vtxt"><b>{verdict.word}</b><p><Phrases text={verdict.sentence} /></p></div>
      </div>
      <div class="run" data-its-run={paused ? 'stopped' : 'running'}>
        <span class="txt">
          {#if !paused}<small>{t('its.ctl.on')}</small>{/if}
          {#if control}<small data-its-control>{control}</small>{/if}
          {#if paused && noDates}<small class="late" data-its-need-dates>{t('its.ctl.needDates')}</small>{/if}
        </span>
        <button type="button" class="btn small" class:paper={!paused} data-its-action={paused ? 'start' : 'stop'} data-sfx="tick"
          aria-disabled={running || (paused && noDates)} onclick={() => void run(paused ? 'start' : 'stop')}>{t(paused ? 'its.ctl.start' : 'its.ctl.stop')}</button>
      </div>
    </div>

    {#if bookings.length}
      <section class="sec" aria-labelledby="its-bookings">
        <h3 id="its-bookings" class="sec-label">{t('its.sec.bookings')}</h3>
        <ul class="card rows">
          {#each bookings as b (b.key)}
            <li class="booking" data-its-booking={b.state}>
              <span class="tag {b.state}">{b.label}</span>
              <span class="txt">
                <b>{b.hotel}</b><small>{formatDate(b.date)} · <Phrases text={b.detail} /></small>
                {#if b.left}<small class:late={b.expired} data-its-hold-left>{b.left}</small>{/if}
                {#if b.steps.length}<ol class="steps" data-its-steps>{#each b.steps as s (s)}<li><Phrases text={s} /></li>{/each}</ol>{/if}
              </span>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    <section class="sec" aria-labelledby="its-status">
      <h3 id="its-status" class="sec-label">{t('its.sec.status')}</h3>
      <div class="card">
        {#if cells.length}
          <div class="scans" data-its-scans>
            <div class="shead"><b>{t('its.scan.title')}</b>
              <span class="legend" aria-hidden="true">{#each ['ok', 'avail', 'fail', 'none'] as k (k)}<span><i class="cell {k}"></i>{t(`its.scan.legend.${k}`)}</span>{/each}</span>
            </div>
            <!-- one labelled group, a tab stop; a tap picks the minute under it, ← → walk them -->
            <div class="strip" role="toolbar" tabindex="-1" aria-label={scanSummary(cells)} bind:this={strip} onpointerdown={pickAt} onkeydown={stripKey} data-its-strip>
              {#each cells as c, i (c.t)}
                <button type="button" class="cell {c.state}" class:on={picked === i} tabindex={i === (picked ?? STRIP_MIN - 1) ? 0 : -1} aria-label={c.text}
                  aria-pressed={picked === i} data-its-cell={c.state} data-sfx="none" onclick={() => (picked = i)}></button>
              {/each}
            </div>
            <div class="ticks" aria-hidden="true">{#each ticks as k (k.i)}<span style:left="{((k.i + 0.5) / STRIP_MIN) * 100}%">{k.label}</span>{/each}</div>
            <p class="sline" aria-live="polite" data-its-scan-line>{picked === null ? t('its.scan.pick') : cells[picked].text}</p>
          </div>
        {/if}
        <dl class="facts">
          {#each facts.filter((f) => !f.more) as f (f.id)}
            <div data-its-fact={f.id}><dt>{f.label}</dt><dd>{#if f.href}<a href={f.href} target="_blank" rel="noopener noreferrer" data-sfx="open">{f.value}</a>{:else}{f.value}{/if}</dd></div>
          {/each}
        </dl>
        {#if facts.some((f) => f.more)}
          <details class="more" bind:open={openMore} data-its-more>
            <summary><span>{t('its.fact.more')}</span><span class="chev" aria-hidden="true"></span></summary>
            {#if openMore}
              <dl class="facts">
                {#each facts.filter((f) => f.more) as f (f.id)}<div data-its-fact={f.id}><dt>{f.label}</dt><dd>{f.value}</dd></div>{/each}
              </dl>
            {/if}
          </details>
        {/if}
      </div>
    </section>

    <section class="sec" aria-labelledby="its-dates">
      <h3 id="its-dates" class="sec-label">{t('its.sec.dates')}</h3>
      <p class="hint">{t('its.date.one')}</p>
      {#if dates.length}
        <div class="card months">
          {#each months as m (m.month)}
            <h4 class="month">{m.label}</h4>
            <ul class="rows dates">
              {#each m.rows as d (d.date)}
                <li data-its-date={d.date}>
                  <div class="drow">
                    <span class="txt"><b>{d.label}</b><small class:late={d.note === 'late'} class:booked={d.note === 'booked'}>{d.text}</small></span>
                    {#if d.note !== 'booked'}
                      <button type="button" class="able" aria-expanded={openDate === d.date} data-its-able={d.able.length} data-sfx="tick"
                        onclick={() => (openDate = openDate === d.date ? null : d.date)}>{d.able.length ? t('its.date.able', { n: d.able.length }) : t('its.date.ableNone')}</button>
                    {/if}
                    <button type="button" class="x" data-its-date-remove data-sfx="tick" aria-label={t('its.date.removeLabel', { date: d.label })}
                      onclick={() => edit((x) => removeDate(x, d.date))}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" /></svg></button>
                  </div>
                  {#if openDate === d.date && d.able.length}<p class="ablelist" data-its-able-list>{d.able.join('、')}</p>{/if}
                </li>
              {/each}
            </ul>
          {/each}
        </div>
      {:else}
        <p class="hint">{t('its.date.empty')}</p>
      {/if}
      <label class="lbl" for="its-date-field">{t('its.date.field')}</label>
      <div class="add">
        <input id="its-date-field" type="date" min={bounds.min} max={bounds.max} bind:value={adding} data-its-date-field data-sfx="none"
          oninput={() => (addWhy = null)} />
        <button type="button" class="btn small" data-its-date-add data-sfx="self" onclick={add}>{t('its.date.add')}</button>
      </div>
      {#if addWhy}<p class="hint bad" role="alert" data-its-date-why>{addWhy}</p>{/if}
      <button type="button" class="btn small paper bulkopen" bind:this={bulkBtn} aria-haspopup="dialog" data-its-bulk-open data-sfx="tick" onclick={openBulk}>{t('its.bulk.open')}</button>
    </section>

    <section class="sec" aria-labelledby="its-hotels">
      <h3 id="its-hotels" class="sec-label">{t('its.sec.hotels')}</h3>
      <p class="hint"><Phrases text={t('its.hotel.hint')} /></p>
      {#each fresh as r (r.key)}
        <div class="card fresh-banner" data-its-new={r.name}>
          <span class="txt"><b>{t('its.hotel.newBanner', { name: r.name })}</b>{#if r.similar}<small>{t('its.hotel.similar', { name: r.similar })}</small>{/if}</span>
          <button type="button" class="btn small paper" data-its-new-off data-sfx="tick" aria-label={t('its.hotel.newOffLabel', { name: r.name })}
            onclick={() => edit((d) => setSearch(d, [r.name], false))}>{t('its.hotel.newOff')}</button>
          <button type="button" class="btn small" data-its-new-on data-sfx="tick" aria-label={t('its.hotel.newOnLabel', { name: r.name })}
            onclick={() => edit((d) => setSearch(d, [r.name], true))}>{t('its.hotel.newOn')}</button>
        </div>
      {/each}
      <details class="fold" bind:open={openHotels} data-its-search>
        <summary class="prow"><span class="prl">{t('its.hotel.fold', { n: searching, total: hotels.length })}{#if starred.length}<small>★ {starred.join('、')}</small>{/if}</span><span class="chev" aria-hidden="true"></span></summary>
        {#if openHotels}
          <div class="hbody">
            <div class="presets" role="group" aria-label={t('its.preset.label')}>
              {#each PRESETS as p (p)}<Chip label={t(`its.preset.${p}`)} selected={preset === p} data-its-preset={p} onclick={() => edit((d) => applyPreset(d, hotels, p))} />{/each}
            </div>
            <input type="search" class="filter" bind:value={filter} placeholder={t('its.hotel.filter')} aria-label={t('its.hotel.filter')} data-its-filter data-sfx="none"
              enterkeyhint="search" autocomplete="off" spellcheck="false" />
            {#each groups as g (g.id)}
              <section class="group" aria-labelledby="its-g-{g.id}" data-its-group={g.id}>
                <div class="ghead">
                  <h4 id="its-g-{g.id}">{g.label}<small>{t('its.group.count', { on: g.on, n: hotels.filter((r) => r.group === g.id).length })}</small></h4>
                  <button type="button" class="gbtn" data-its-group-on data-sfx="tick" aria-label={t('its.group.allOnLabel', { group: g.label })}
                    onclick={() => edit((d) => setSearch(d, g.rows.map((r) => r.name), true))}>{t('its.group.allOn')}</button>
                  <button type="button" class="gbtn" data-its-group-off data-sfx="tick" aria-label={t('its.group.allOffLabel', { group: g.label })}
                    onclick={() => edit((d) => setSearch(d, g.rows.map((r) => r.name), false))}>{t('its.group.allOff')}</button>
                </div>
                <ul class="card rows hrows">{#each g.rows as r (r.key)}{@render hotel(r)}{/each}</ul>
              </section>
            {:else}
              <p class="hint" data-its-filter-none>{t('its.hotel.filterNone')}</p>
            {/each}
          </div>
        {/if}
      </details>
    </section>

    <section class="sec" aria-labelledby="its-detail">
      <h3 id="its-detail" class="sec-label">{t('its.sec.detail')}</h3>
      <div class="card opts">
        <span class="lbl">{t('its.interval')}</span>
        <Segmented items={intervals} value={String(shown.intervalSec)} label={t('its.interval')} attr="its-interval"
          onpick={(id) => edit((d) => ({ ...d, intervalSec: Number(id) as IntervalSec }))} />
        <p class="hint"><Phrases text={t('its.interval.note')} /></p>
        <span class="lbl">{t('its.guests')}</span>
        <Segmented items={guests} value={String(shown.guests)} label={t('its.guests')} attr="its-guests" onpick={(id) => edit((d) => ({ ...d, guests: Number(id) }))} />
      </div>
      <button type="button" class="prow" role="switch" aria-checked={shown.autoConfirm} bind:this={autoBtn} data-its-auto data-sfx="self"
        onclick={() => (shown!.autoConfirm ? setAuto(false) : (askAuto = true))}>
        <span class="prl">{t('its.auto')}<small><Phrases text={t('its.auto.hint')} /></small></span>
        <span class="sw" aria-hidden="true"><i></i></span>
      </button>
    </section>

    {#if events.length}
      <section class="sec" aria-labelledby="its-recent" data-its-recent>
        <h3 id="its-recent" class="sec-label">{t('its.sec.recent')}</h3>
        <ol class="card rows ev">
          {#each events as e (e.key)}
            <li data-its-event data-bad={e.bad ? '' : undefined}>
              <span class="time">{e.time}</span><span class="txt"><b class:bad={e.bad}>{e.what}</b>{#if e.info}<small>{e.info}</small>{/if}</span>
            </li>
          {/each}
        </ol>
      </section>
    {/if}

    <p class="foot" data-its-foot>{#if saved}<span data-its-saved-by>{saved}</span><br />{/if}{footLine(status, today)}</p>

    {#if dirty}
      <div class="level-acts" data-its-save-bar>
        {#if conflict}
          <div class="why" data-its-conflict role="status">
            <span>{status.settings.updatedBy ? t('its.conflictBy', { who: name(status.settings.updatedBy) }) : t('its.conflictAny')}</span>
            <button type="button" class="btn small paper" data-sfx="tick" onclick={reload}>{t('its.reload')}</button>
          </div>
        {:else if saveWhy}
          <p class="why bad" role="alert" data-its-save-failed>{saveWhy}</p>
        {:else if paused}
          <p class="why" data-its-draft-note>{t('its.ctl.draftNote')}</p>
        {/if}
        <button type="button" class="btn paper small" data-its-discard data-sfx="self" onclick={discard}>{t('its.discard')}</button>
        <button type="button" class="btn" data-its-save data-sfx="tick" aria-disabled={saving} onclick={() => void save()}>{t(conflict ? 'its.overwrite' : 'its.save')}</button>
      </div>
    {/if}
  {:else if !failed}
    {#each [0, 1, 2] as i (i)}<div class="card skel" data-its-skeleton aria-hidden="true"><span></span></div>{/each}
  {/if}
</div>

<ActionSheet bind:open={askAuto} title={t('its.auto.title')} note={t('its.auto.note')}
  groups={[[{ id: 'on', label: t('its.auto.on') }], [{ id: 'cancel', label: t('its.auto.cancel') }]]}
  onpick={(id) => id === 'on' && setAuto(true)} />

<ActionSheet bind:open={askOverwrite} title={t('its.overwrite.title')} note={t('its.overwrite.note')}
  groups={[[{ id: 'yes', label: t('its.overwrite.yes'), danger: true }], [{ id: 'cancel', label: t('its.overwrite.cancel') }]]}
  onpick={(id) => id === 'yes' && overwrite()} />

<Sheet bind:open={bulkOpen} title={t('its.bulk.title')}>
  <div class="bulk" data-its-bulk>
    <span class="lbl">{t('its.bulk.period')}</span>
    <div class="period">
      <input type="date" min={bounds.min} max={bounds.max} bind:value={bulkFrom} aria-label={t('its.bulk.since')} data-its-bulk-from data-sfx="none" />
      <span aria-hidden="true">〜</span>
      <input type="date" min={bounds.min} max={bounds.max} bind:value={bulkTo} aria-label={t('its.bulk.until')} data-its-bulk-to data-sfx="none" />
    </div>
    <span class="lbl">{t('its.bulk.days')}</span>
    <div class="wdays" role="group" aria-label={t('its.bulk.days')}>
      {#each weekdays as w (w.n)}<Chip label={w.label} selected={bulkDays.includes(w.n)} data-its-weekday={w.n} onclick={() => toggleDay(w.n)} />{/each}
    </div>
    {#if bulk.over}<p class="hint bad" data-its-bulk-over>{t('its.bulk.over', { n: bulk.over })}</p>{/if}
  </div>
  {#snippet footer()}
    <button type="button" class="btn" data-its-bulk-add data-sfx="self" aria-disabled={!bulk.add.length} onclick={addBulk}>
      {bulk.add.length ? t('its.bulk.add', { n: bulk.add.length }) : t('its.bulk.none')}</button>
  {/snippet}
</Sheet>

<style>
  .its { display: flex; flex-direction: column; gap: 14px; }
  .card { margin: 0; padding: 12px 14px; border-radius: var(--r-card); background: var(--card); box-shadow: var(--sh-lip); }
  .sec { display: grid; gap: 8px; }
  .hint { margin: 0 4px; font-size: var(--fs-s); font-weight: 700; line-height: var(--lh); color: var(--text-soft); }
  .its .hint.bad, .its .late, .its b.bad { color: var(--coral-text); }
  .lbl { font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); margin: 0 4px; }
  /* a notice: yuzu-tinted (a class of its own, so the row's own background rule can't win) */
  .its .note { background: color-mix(in srgb, var(--c-yuzu) 35%, var(--card)); }
  .card.note { display: grid; gap: 8px; }
  .card.note p { margin: 0; font-size: var(--fs-body); font-weight: 700; line-height: var(--lh); }
  .card.note .btn { justify-self: start; margin: 0; }

  /* the verdict, tinted by its tone */
  .verdict { display: grid; gap: 10px; }
  .verdict.good { background: color-mix(in srgb, var(--c-leaf) 22%, var(--card)); }
  .verdict.warn { background: color-mix(in srgb, var(--c-yuzu) 30%, var(--card)); }
  .verdict.bad { background: color-mix(in srgb, var(--c-coral) 24%, var(--card)); }
  .vhead { display: flex; align-items: flex-start; gap: 12px; }
  .vtxt b { font-size: var(--fs-title); line-height: 1.3; }
  .vtxt p { margin: 2px 0 0; font-size: var(--fs-body); line-height: var(--lh); color: var(--text-soft); font-weight: 700; }
  .dot { flex: none; width: 14px; height: 14px; margin-top: 5px; border-radius: 50%; box-shadow: 0 0 0 2px var(--card), 0 0 0 3px var(--edge); }
  .dot.good { background: var(--c-leaf); }
  .dot.warn { background: var(--c-yuzu); }
  .dot.bad { background: var(--c-coral); }
  .dot.idle { background: var(--ctl-off); }
  .run { display: flex; align-items: center; gap: 10px; padding-top: 10px; border-top: 1px dashed color-mix(in srgb, var(--text-soft) 40%, transparent); }
  .run .btn { flex: none; margin: 0; }

  /* 直近1時間: 60 minutes, each a cell outlined in the edge (the pale fills need it to read, 3:1); a failure hatched, a
     room full height, so neither is colour alone */
  .scans { display: grid; gap: 4px; margin-bottom: 12px; }
  .shead { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 4px 10px; font-size: var(--fs-s); }
  .legend { display: flex; flex-wrap: wrap; gap: 2px 10px; font-weight: 700; color: var(--text-soft); }
  .legend span { display: inline-flex; align-items: center; gap: 4px; }
  .legend .cell { display: inline-block; width: 10px; height: 12px; flex: none; }
  .strip { display: flex; align-items: flex-end; gap: 1px; height: var(--hit); padding: 6px 0; touch-action: pan-y; cursor: pointer; }
  .strip .cell { appearance: none; border: 0; padding: 0; flex: 1 1 0; min-width: 0; height: 70%; cursor: pointer; }
  .cell { border-radius: 2px; box-shadow: inset 0 0 0 1px var(--edge); background: var(--ctl-off); }
  .cell.ok { background: var(--c-leaf); }
  .strip .cell.avail { height: 100%; }
  .cell.avail { background: var(--c-yuzu); }
  .strip .cell.fail { height: 100%; }
  .cell.fail { background: repeating-linear-gradient(135deg, var(--c-coral) 0 3px, color-mix(in srgb, var(--c-coral) 45%, var(--card)) 3px 5px); }
  .cell.none { background: transparent; box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--edge) 55%, transparent); }
  .strip .cell.on { outline: 2px solid var(--text); outline-offset: 1px; }
  .strip .cell:focus-visible { outline: 3px solid var(--focus); outline-offset: 1px; }
  .ticks { position: relative; height: 1.3em; font: 700 var(--fs-s)/1.3 var(--font-num); color: var(--text-soft); }
  .ticks span { position: absolute; translate: -50% 0; white-space: nowrap; }
  .ticks span:first-child { translate: 0 0; }
  .sline { margin: 0; min-height: 1.3em; font-size: var(--fs-s); font-weight: 700; color: var(--text); font-variant-numeric: tabular-nums; }
  .facts { display: grid; gap: 8px; margin: 0; }
  .facts div { display: flex; justify-content: space-between; gap: 12px; font-size: var(--fs-body); }
  .facts dt { flex: none; color: var(--text-soft); font-weight: 700; }
  .facts dd { margin: 0; min-width: 0; font-weight: 700; text-align: right; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
  /* the run's link: a full 44px target, without pushing its row apart */
  .facts a { color: var(--sky-text); display: inline-flex; align-items: center; min-height: var(--hit); margin: -10px 0; }
  .more > summary { list-style: none; display: flex; align-items: center; justify-content: space-between; min-height: var(--hit); margin-top: 4px; font-weight: 700; color: var(--text-soft); cursor: pointer; }
  .more > summary::-webkit-details-marker { display: none; }
  .more[open] > summary { margin-bottom: 4px; }

  .rows { list-style: none; display: grid; gap: 8px; margin: 0; padding-left: 0; }
  .rows > li { display: flex; align-items: center; gap: 10px; min-height: var(--hit); }
  .rows > li + li { padding-top: 8px; border-top: 1px dashed color-mix(in srgb, var(--text-soft) 40%, transparent); }
  .txt { flex: 1; min-width: 0; font-size: var(--fs-body); }
  .txt b { display: block; line-height: 1.3; }
  small { display: block; margin-top: 2px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); line-height: 1.3; }
  .tag { flex: none; min-width: 4.5em; text-align: center; padding: 4px 8px; border-radius: var(--r-chip); font: 700 var(--fs-s)/1 var(--font-ui); background: var(--ctl-off); color: var(--text); }
  .tag.action { background: var(--c-coral); color: var(--c-ink); }
  .tag.hold, .tag.applying { background: var(--c-yuzu); color: var(--c-ink); }
  .tag.confirmed { background: var(--c-leaf); color: var(--c-ink); }
  .booking { align-items: flex-start !important; }
  .booking .tag { margin-top: 2px; }
  .steps { margin: 6px 0 0; padding-left: 1.3em; font-size: var(--fs-s); font-weight: 700; line-height: var(--lh); }
  .ev .time { flex: none; align-self: flex-start; font-size: var(--fs-s); font-weight: 700; font-variant-numeric: tabular-nums; color: var(--text-soft); padding-top: 2px; }
  .ev > li { align-items: flex-start; min-height: 0; }

  .months { display: grid; gap: 4px; padding-top: 8px; }
  .month { margin: 4px 0 0; font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); }
  .dates > li { display: block; min-height: 0; }
  .drow { display: flex; align-items: center; gap: 4px; min-height: var(--hit); }
  .its .booked { color: var(--leaf-text); }
  .able {
    appearance: none; border: 0; background: none; cursor: pointer; flex: none; min-height: var(--hit); padding: 0 6px;
    font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--sky-text); text-decoration: underline; text-underline-offset: 3px;
  }
  .ablelist { margin: 0 0 6px; font-size: var(--fs-s); font-weight: 700; line-height: var(--lh); color: var(--text-soft); }
  /* the small ✕: drawn 28px, a 44px target */
  .x { appearance: none; border: 0; background: none; cursor: pointer; flex: none; width: var(--hit); height: var(--hit); display: grid; place-items: center; color: var(--text-soft); margin-right: -8px; }
  .x svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2.6; stroke-linecap: round; }
  .x:focus-visible, .able:focus-visible, .gbtn:focus-visible, .hsw:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; border-radius: 8px; }

  .add { display: flex; gap: 8px; align-items: center; }
  /* 16px so Safari doesn't zoom; the app's field look (ProfileSection's) */
  input[type='date'], .filter {
    flex: 1; min-width: 0; min-height: var(--hit); padding: 6px 12px; border: 0; border-radius: var(--r-btn); appearance: none;
    font: 700 var(--fs-input)/1.1 var(--font-num); color: var(--text); background: var(--ctl); box-shadow: inset 0 0 0 2px var(--edge);
  }
  .filter { font-family: var(--font-ui); }
  input[type='date']:focus-visible, .filter:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .add .btn { margin: 0; }
  .bulkopen { justify-self: start; margin: 0; }

  .fold { display: grid; gap: 8px; }
  .fold > summary { list-style: none; }
  .fold > summary::-webkit-details-marker { display: none; }
  .fold[open] > summary { margin-bottom: 8px; }
  .chev { flex: none; width: 10px; height: 10px; border-right: 2.6px solid var(--text-soft); border-bottom: 2.6px solid var(--text-soft); rotate: 45deg; margin: -4px 6px 0; transition: rotate var(--dur-quick); }
  details[open] > summary .chev { rotate: 225deg; margin-top: 4px; }
  .hbody { display: grid; gap: 12px; }
  .presets, .wdays { display: flex; flex-wrap: wrap; gap: 4px 6px; }
  .fresh-banner { display: flex; align-items: center; gap: 8px; background: color-mix(in srgb, var(--c-leaf) 22%, var(--card)); }
  .fresh-banner .btn { flex: none; margin: 0; }

  .group { display: grid; gap: 6px; }
  .ghead { display: flex; align-items: center; gap: 4px; }
  .ghead h4 { flex: 1; margin: 0 4px; font: 700 var(--fs-body)/1.2 var(--font-ui); display: flex; align-items: baseline; gap: 8px; }
  .ghead h4 small { display: inline; margin: 0; }
  .gbtn {
    appearance: none; border: 0; background: none; cursor: pointer; min-height: var(--hit); padding: 0 8px;
    font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--sky-text);
  }
  .hrows { gap: 6px; padding: 6px 10px 6px 14px; }
  .hrows > .hrow + .hrow { padding-top: 6px; }
  .hrow { gap: 6px; }
  .hrow.starred .hsw b { color: var(--text); }
  .hsw {
    appearance: none; border: 0; background: none; cursor: pointer; flex: 1; min-width: 0; min-height: var(--hit); padding: 4px 0; text-align: left; color: var(--text);
    display: flex; align-items: center; gap: 10px; font: inherit;
  }
  .its .hsw small.fresh { color: var(--leaf-text); }
  .star {
    appearance: none; border: 0; cursor: pointer; flex: none; width: var(--hit); height: var(--hit); border-radius: 12px; position: relative;
    display: flex; align-items: center; justify-content: center; gap: 1px; background: var(--ctl); color: var(--text-soft); box-shadow: var(--sh-ctl);
  }
  .star svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linejoin: round; }
  .star b { font: 700 var(--fs-s)/1 var(--font-num); }
  /* pressed: held down (the press's lip), filled, numbered */
  .star[aria-pressed='true'] { background: var(--c-yuzu); color: var(--c-ink); box-shadow: var(--sh-ctl-press); transform: translateY(2px); }
  .star[aria-pressed='true'] svg { fill: currentColor; }
  .star:active { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }

  .opts { display: grid; gap: 8px; }
  .opts .lbl { margin: 0; }
  .opts .hint { margin: 0 0 6px; }

  /* the switch (SoundSection's): a sunk tan track (off) or a leaf one (on) with a cream knob; `.s` the rows' smaller one */
  .sw {
    position: relative; flex: none; width: 56px; height: 32px; border-radius: var(--r-pill);
    background: var(--ctl-off); box-shadow: inset 0 0 0 2px var(--edge); transition: background var(--dur-quick);
  }
  .sw i {
    position: absolute; top: 4px; left: 4px; width: 24px; height: 24px; border-radius: 50%;
    background: var(--c-card); box-shadow: inset 0 0 0 2px var(--c-edge), 0 2px 0 var(--c-edge);
    transition: translate var(--dur-base) var(--ease-bounce);
  }
  .sw.s { width: 44px; height: 26px; }
  .sw.s i { top: 3px; left: 3px; width: 20px; height: 20px; }
  [aria-checked='true'] > .sw { background: var(--c-leaf); box-shadow: inset 0 0 0 2px var(--c-leaf-edge); }
  [aria-checked='true'] > .sw i { translate: 24px 0; }
  [aria-checked='true'] > .sw.s i { translate: 18px 0; }
  /* the ink rule: only on 自動で確定's chosen (yellow) row */
  .prow[data-its-auto][aria-checked='true'] .prl small { color: var(--c-ink-soft); }

  .why { flex-basis: 100%; margin: 0 4px; display: flex; align-items: center; gap: 8px; font-size: var(--fs-s); font-weight: 700; line-height: var(--lh); color: var(--text-soft); }
  .why span { flex: 1; }
  .why .btn { flex: none; margin: 0; }
  p.why.bad { padding: 8px 12px; margin: 0; border-radius: var(--r-card); color: var(--coral-text); background: color-mix(in srgb, var(--c-coral) 18%, var(--card)); }
  .foot { margin: 0 4px; text-align: center; font-size: var(--fs-s); color: var(--text-soft); overflow-wrap: anywhere; line-height: var(--lh); }

  .bulk { display: grid; gap: 8px; padding-bottom: 8px; }
  .period { display: flex; align-items: center; gap: 6px; }

  .skel { height: 52px; display: flex; align-items: center; }
  .skel span { width: 60%; height: 12px; border-radius: 6px; background: var(--ctl-off); animation: pulse 1.2s ease-in-out infinite alternate; }
  @keyframes pulse { from { opacity: .45; } to { opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { .skel span { animation: none; } .chev, .sw, .sw i { transition: none; } }
</style>
