<script lang="ts">
  // ボット's 保養所 tab (docs/design.md "Bots"): the ITS booker as its Worker reports it (lib/its: GET
  // /its/status) and its settings. Top to bottom: a notice (a failed read with its code; the allow-list's first save),
  // the verdict card (tinted by tone, 開始 / 停止 at once, outside the draft, and who pressed it), the bookings (a
  // hold's deadline and what to do), 状況 (くわしく folds the rest), the stays (日付: one at a time or まとめて追加, each
  // a bar of its searched facilities by why, tapped open to the names and reasons: view.ts dateRows), the facilities
  // (施設: 探す is the allow-list; a summary, presets, then 探す · 日程に合わない · 除外, the new ones' banners on
  // top), 詳細 (確認の間隔, 人数, 自動で確定), 通知 (this phone's push: ItsNotify), the recent events and the foot. The
  // settings are one draft saved with 保存
  // (the sticky bar while it differs, with why: someone else's save, the draft note or the refusal; ✕, the backdrop
  // and Esc ask first: guardForm, a tab switch too: `leave`). Fetched on open, then every 15 s while the runner is on its way or
  // running and every minute otherwise, only while shown; leaving it (the other tab, the sheet closed) aborts, and 保存 / 開始 / 停止 abort a read in
  // flight (an answer older than the one shown is dropped). A poll never touches a draft: when the saved settings moved
  // under it it says so, with 読み込み直す, and 保存 becomes 上書き保存 (asks first). Saved settings without an
  // allow-list (a Worker from before it) give a derived one (view.ts draftOf), said once until saved. Each status read
  // sets the tab's and the menu's dot (open.svelte.ts). The last status read shows at once as the page opens, marked
  // 更新中 (lastKnown.ts). The verdict, the strip, the facts, the skeleton and the poll are ジム's too (VerdictCard,
  // StatusStrip, FactList, Skeleton, poll.svelte.ts). Not in demo mode (no tab: no fixture).
  import { tick } from 'svelte';
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
  import { fetchStatus, parseStatus, postRun, putSettings, type ItsReply } from '#lib/its/client.ts';
  import {
    PRESETS, addDate, addDates, applyPreset, bookingRows, bulkDates, controlLine, dateBounds, dateMonths, dateRows, draftOf, eventLines, factRows, footLine,
    hotelHint, hotelParts, hotelRows, hotelSummary, legacy, minuteCells, pollMs, presetOf, removeDate, sameDraft, saveError, savedLine, scanCells, scanSummary, scanTicks, setSearch,
    stopsAtBooked, stripCells, toInput, toggleSearch, toggleStar, verdictView, needsAttention, type DateRow, type Draft, type HotelRow, type ListRow
  } from '#lib/its/view.ts';
  import { setBadge } from './open.svelte.ts';
  import ItsNotify from './ItsNotify.svelte';
  import VerdictCard from './VerdictCard.svelte';
  import StatusStrip from './StatusStrip.svelte';
  import FactList from './FactList.svelte';
  import Skeleton from './Skeleton.svelte';
  import { statusPoll } from './poll.svelte.ts';
  import { recall, remember } from './lastKnown.ts';

  /** A tab switch's guard (BotsSheet): asks first while the draft holds changes. */
  let { leave = $bindable() }: { leave?: (run: () => void) => void } = $props();

  /** The status shown: the last read (the one kept from before until this page's first answer: `live` false). */
  let status = $state<ItsStatus | null>(recall('its', parseStatus));
  let live = $state(false);
  /** The last read's failure code (offline, http 502, …), or null. */
  let failed = $state<string | null>(null);
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
  /** The stay whose facilities are shown (by why), or null; `allNames`: the one whose 探す names are all shown. */
  let openDate = $state<string | null>(null);
  let allNames = $state<string | null>(null);
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

  /** Every answer's status (a read's, 保存's, a 409's, 開始 / 停止's): one older than the shown one is dropped; the
   *  draft is kept (noting a move of the saved settings under it), an unchanged one let go. */
  function take(s: ItsStatus) {
    if (live && status && s.now < status.now) return;
    status = s;
    live = true;
    remember('its', s);
    setBadge('its', needsAttention(s));
    if (!dirty) {
      draft = start = null;
      conflict = false;
    } else if (s.settings.updatedAt !== base) {
      conflict = true;
      saveWhy = null;
    }
  }

  /** The reads (poll.svelte.ts): every 15 s while the runner is on its way or running, else every minute; none while
   *  保存 / 開始 / 停止 answer with the status themselves (their `hold()`; `schedule()` after). */
  const poll = statusPoll(async (signal) => {
    const r = await fetchStatus(signal);
    if (signal.aborted) return;
    if (r.ok) take(r.status);
    failed = r.ok ? null : [r.err, r.http].filter((x) => x !== null).join(' ');
  }, () => pollMs(status), () => saving || running);
  const load = poll.refresh;
  const life = poll.life;

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
  /** The runner reporting stops at a booked night and keeps to the allow-list (an older one doesn't: said neither). */
  const stops = $derived(!!status && stopsAtBooked(status));
  const dates = $derived(shown ? dateRows(shown, nowMs, hotels, status?.bookings, stops) : []);
  const months = $derived(dateMonths(dates));
  const bounds = $derived(dateBounds(nowMs));
  /** 施設's three parts (探す, 日程に合わない, 除外) from the draft's nights, as the bars count them. */
  const parts = $derived(hotelParts(hotels, dates));
  const summary = $derived(hotelSummary(parts));
  const fresh = $derived(hotels.filter((r) => r.undecided));
  /** ★'s facilities, by name: the expanded night marks them. */
  const stars = $derived(new Set(hotels.filter((r) => r.star !== null).map((r) => r.name)));
  const preset = $derived(presetOf(hotels));
  const paused = $derived(status?.settings.paused ?? true);
  /** 開始 needs a saved stay from tonight on. */
  const noDates = $derived(!!status && !status.settings.dates.some((d) => daysUntil(d, nowMs) >= 0));
  const control = $derived(status && controlLine(status, name, today));
  const saved = $derived(status && savedLine(status, name, today));
  const migrating = $derived(!!status && stops && legacy(status.settings));
  /** 直近1時間 (a Worker that keeps the reads; else hidden), by Tokyo minute (its per-minute aggregate when it sends one,
   *  else the reads one by one), drawn by the shared strip. */
  const minutes = $derived(status?.recentMinutes);
  const scans = $derived(status?.recentScans);
  const cells = $derived(minutes ? minuteCells(minutes, status!.now) : scans ? scanCells(scans, status!.now) : []);
  const legend = { ok: t('its.scan.legend.ok'), avail: t('its.scan.legend.avail'), fail: t('its.scan.legend.fail'), none: t('its.scan.legend.none') };
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
    poll.hold();
    saving = true;
    saveWhy = null;
    const r = await putSettings(toInput(draft, base, sceneNow().getTime()), life);
    saving = false;
    if (life.aborted) return;
    if (r.ok) {
      draft = start = null;
      cue('confirm');
      toasts.show(t('its.saved'));
    } else if (r.err !== 'conflict') saveWhy = saveError(r.err);
    if (r.status) take(r.status);
    if (!r.ok && r.err === 'conflict') conflict = true;
    poll.schedule();
  }

  async function run(action: RunInput['action']) {
    if (!status || running) return;
    if (action === 'start' && noDates) return void cue('boop');
    poll.hold();
    running = true;
    const r: ItsReply = await postRun(action, life);
    running = false;
    if (life.aborted) return;
    if (r.ok) take(r.status);
    else toasts.show(t(action === 'start' ? 'its.ctl.startFailed' : 'its.ctl.stopFailed'), 4000);
    poll.schedule();
  }

  const intervals = INTERVALS_SEC.map((s) => ({ id: String(s), label: s < 60 ? t('its.interval.s', { n: s }) : t('its.interval.m', { n: s / 60 }) }));
  const guests = Array.from({ length: GUESTS_MAX - GUESTS_MIN + 1 }, (_, i) => ({ id: String(GUESTS_MIN + i), label: t('its.guestsN', { n: GUESTS_MIN + i }) }));
  /** 日〜土 (0 = 日; the catalog's weekday.N is ISO, 7 = 日). */
  const weekdays = [0, 1, 2, 3, 4, 5, 6].map((n) => ({ n, label: t(`weekday.${n || 7}`) }));
</script>

{#snippet hotel(r: ListRow)}
  <li class="hrow" class:starred={r.star !== null} data-its-hotel={r.name} data-search={r.search}>
    <button type="button" class="star" aria-pressed={r.star !== null} data-its-star={r.name} data-sfx="tick"
      aria-label={r.star === null ? t('its.hotel.star', { name: r.name }) : t('its.hotel.starN', { name: r.name, n: r.star + 1 })}
      onclick={() => edit((d) => toggleStar(d, r.name))}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z" /></svg>{#if r.star !== null}<b aria-hidden="true">{r.star + 1}</b>{/if}
    </button>
    <button type="button" class="hsw" role="switch" aria-checked={r.search} aria-label={r.label} data-sfx="self"
      onclick={() => (cue(r.search ? 'toggle-off' : 'toggle-on'), edit((d) => toggleSearch(d, r)))}>
      <span class="txt"><b>{r.name}</b>{#if r.meta}<small class:fresh={r.fresh && !r.reason} data-its-meta>{r.meta}</small>{/if}</span>
      <span class="sw s" aria-hidden="true"><i></i></span>
    </button>
  </li>
{/snippet}

{#snippet part(id: string, rows: ListRow[], label: string)}
  <details class="part" data-its-part={id}>
    <summary class="psum"><h4 id="its-p-{id}">{label}<small>{t('its.part.count', { n: rows.length })}</small></h4><span class="chev" aria-hidden="true"></span></summary>
    <ul class="card rows hrows" aria-labelledby="its-p-{id}">{#each rows as r (r.key)}{@render hotel(r)}{/each}</ul>
  </details>
{/snippet}

{#snippet bar(d: DateRow)}
  <span class="bar" aria-hidden="true">{#each d.parts as p (p.why)}<i class="seg {p.why}" style:flex-grow={p.names.length}></i>{/each}</span>
  <span class="legend" aria-hidden="true">{#each d.parts as p (p.why)}<span data-its-seg={p.why}><i class="seg {p.why}"></i>{t(`its.why.${p.why}`)} {p.names.length}</span>{/each}</span>
{/snippet}

<div class="its" data-its-page aria-busy={poll.loading}>
  {#if failed}
    <div class="prow static note" data-its-error>
      <span class="prl">{t('its.loadFailed', { code: failed })}</span>
      <button type="button" class="btn small paper" data-sfx="tick" aria-disabled={poll.loading} onclick={() => poll.loading || void load()}>{t('state.retry')}</button>
    </div>
  {/if}
  {#if status && verdict && shown}
    <VerdictCard tone={verdict.tone} word={verdict.word} sentence={verdict.sentence} attr={{ 'data-its-verdict': status.verdict }} stale={!live && poll.loading}
      act={{ 'data-its-run': paused ? 'stopped' : 'running' }}>
      <span class="txt">
        {#if !paused}<small>{t('its.ctl.on')}</small>{/if}
        {#if control}<small data-its-control>{control}</small>{/if}
        {#if paused && noDates}<small class="late" data-its-need-dates>{t('its.ctl.needDates')}</small>{/if}
      </span>
      <button type="button" class="btn small runbtn" class:paper={!paused} data-its-action={paused ? 'start' : 'stop'} data-sfx="tick"
        aria-disabled={running || (paused && noDates)} onclick={() => void run(paused ? 'start' : 'stop')}>{t(paused ? 'its.ctl.start' : 'its.ctl.stop')}</button>
    </VerdictCard>

    {#if migrating}
      <div class="card note" data-its-migrate role="status">
        <p><Phrases text={t('its.hotel.migrate')} /></p>
        <button type="button" class="btn small paper" data-its-migrate-save data-sfx="tick" aria-disabled={saving} onclick={saveDerived}>{t('its.hotel.migrateSave')}</button>
      </div>
    {/if}

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
          <StatusStrip cells={stripCells(cells)} ticks={scanTicks(cells)} title={t('its.scan.title')} {legend} summary={scanSummary(cells, !!minutes)} hint={t('its.scan.pick')} attr="its" />
        {/if}
        <FactList {facts} more={t('its.fact.more')} attr="its" />
      </div>
    </section>
    <section class="sec" aria-labelledby="its-dates">
      <h3 id="its-dates" class="sec-label">{t('its.sec.dates')}</h3>
      <p class="hint">{t('its.date.one')}</p>
      {#if dates.length}
        <div class="card months">
          <p class="dhead" data-its-dates-total>{t('its.night.total', { n: dates[0].total })}</p>
          {#each months as m (m.month)}
            <h4 class="month">{m.label}</h4>
            <ul class="rows dates">
              {#each m.rows as d (d.date)}
                {@const open = openDate === d.date}
                <li data-its-date={d.date}>
                  <div class="drow">
                    {#if d.note === 'booked'}
                      <span class="txt dtxt"><b>{d.label}</b><small class="booked">{d.text}</small></span>
                    {:else}
                      <button type="button" class="night" aria-expanded={open} aria-label={d.aria} data-its-night data-its-able={d.able.length} data-sfx="tick"
                        onclick={() => (openDate = open ? null : d.date)}>
                        <span class="dtop">
                          <span class="txt"><b>{d.label}</b><small class:late={d.note === 'late'}>{d.text}</small></span>
                          <span class="nn" aria-hidden="true">{d.able.length}/{d.total}</span>
                          <span class="chev" aria-hidden="true"></span>
                        </span>
                        {#if d.total}{@render bar(d)}{:else}<small aria-hidden="true">{t('its.night.none')}</small>{/if}
                      </button>
                    {/if}
                    <button type="button" class="x" data-its-date-remove data-sfx="tick" aria-label={t('its.date.removeLabel', { date: d.label })}
                      onclick={() => edit((x) => removeDate(x, d.date))}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" /></svg></button>
                  </div>
                  {#if open && d.note !== 'booked'}
                    <div class="nlist" data-its-night-list>
                      {#each d.parts as p (p.why)}
                        {@const names = p.names.map((n) => (stars.has(n) ? `★${n}` : n))}
                        {@const cut = p.why === 'check' && allNames !== d.date && names.length > 8}
                        <div class="np" data-its-why={p.why}>
                          <h5><i class="seg {p.why}" aria-hidden="true"></i>{t(`its.why.${p.why}`)}<small>{t('its.part.count', { n: p.names.length })}</small></h5>
                          {#if p.why === 'check' || p.why === 'gone'}
                            <p>{(cut ? names.slice(0, 8) : names).join('、')}</p>
                            {#if cut}<button type="button" class="more" data-its-night-more data-sfx="tick" onclick={() => (allNames = d.date)}>{t('its.night.more', { n: names.length - 8 })} ›</button>{/if}
                          {:else}
                            {#each p.lines as l (l)}<p>{l}</p>{/each}
                          {/if}
                        </div>
                      {/each}
                      {#if d.noSeason}<p class="np-note" data-its-no-season>{t('its.night.noSeason')}</p>{/if}
                    </div>
                  {/if}
                </li>
              {/each}
            </ul>
          {/each}
        </div>
        {#if parts.off.length}<p class="hint" data-its-dates-foot>{t('its.night.foot', { n: parts.off.length })}</p>{/if}
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
      <p class="hint" data-its-hotel-hint><Phrases text={hotelHint(shown.autoConfirm, stops)} /></p>
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
        <summary class="prow"><span class="prl"><span data-its-sum>{summary.title}</span>{#if summary.line}<small data-its-sum-line>{summary.line}</small>{/if}{#if summary.more}<small data-its-sum-more>{summary.more}</small>{/if}</span><span class="chev" aria-hidden="true"></span></summary>
        {#if openHotels}
          <div class="hbody">
            <div class="presets" role="group" aria-label={t('its.preset.label')}>
              {#each PRESETS as p (p)}<Chip label={t(`its.preset.${p}`)} selected={preset === p} data-its-preset={p} onclick={() => edit((d) => applyPreset(d, hotels, p))} />{/each}
            </div>
            <section class="part" aria-labelledby="its-p-search" data-its-part="search">
              <h4 id="its-p-search">{t('its.part.search')}<small>{t('its.part.count', { n: parts.search.length })}</small></h4>
              {#if parts.starred.length}<ul class="card rows hrows" data-its-group="star">{#each parts.starred as r (r.key)}{@render hotel(r)}{/each}</ul>{/if}
              {#each parts.regions as g (g.id)}
                <h5 id="its-g-{g.id}">{g.label}<small>{g.rows.length}</small></h5>
                <ul class="card rows hrows" aria-labelledby="its-g-{g.id}" data-its-group={g.id}>{#each g.rows as r (r.key)}{@render hotel(r)}{/each}</ul>
              {/each}
            </section>
            {#if parts.unfit.length}{@render part('unfit', parts.unfit, t('its.part.unfit'))}{/if}
            {#if parts.off.length}{@render part('off', parts.off, t('its.part.off'))}{/if}
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

    <ItsNotify push={status.push} />

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
    <Skeleton attr="its" />
  {/if}
</div>

<ActionSheet bind:open={askAuto} title={t('its.auto.title')} note={t('its.auto.note')}
  groups={[[{ id: 'on', label: t('its.auto.on') }], [{ id: 'cancel', label: t('its.auto.cancel') }]]}
  onpick={(id) => id === 'on' && setAuto(true)} />

<ActionSheet bind:open={askOverwrite} title={t('its.overwrite.title')} note={t('its.overwrite.note')}
  groups={[[{ id: 'yes', label: t('its.overwrite.yes'), danger: true }], [{ id: 'cancel', label: t('its.overwrite.cancel') }]]}
  onpick={(id) => id === 'yes' && overwrite()} />

<Sheet bind:open={bulkOpen} title={t('its.bulk.title')} name="its.bulk">
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

  /* the verdict's row (VerdictCard): 開始 / 停止 */
  .runbtn { flex: none; margin: 0; }

  .rows { list-style: none; display: grid; gap: 8px; margin: 0; }
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
  .dates { padding: 0; }
  .dates > li { display: block; min-height: 0; }
  .drow { display: flex; align-items: flex-start; gap: 4px; min-height: var(--hit); }
  .dtxt { padding: 6px 0; }
  .its .booked { color: var(--leaf-text); }
  .dhead { margin: 0; font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); }
  /* a night: the whole row the tap (44px+), its bar under the date */
  .night {
    appearance: none; border: 0; background: none; cursor: pointer; flex: 1; min-width: 0; min-height: var(--hit); padding: 4px 0 6px; text-align: left;
    color: var(--text); font: inherit; display: grid; gap: 6px;
  }
  .dtop { display: flex; align-items: center; gap: 8px; }
  .nn { flex: none; font: 700 var(--fs-body)/1 var(--font-num); font-variant-numeric: tabular-nums; }
  .night[aria-expanded='true'] .chev { rotate: 225deg; margin-top: 4px; }
  /* the bar (the dataviz thin segmented bar): 8px, round ends, 2px gaps; 探す leaf, 締切 hatched, 季節外 · 休館日 · 掲載なし
     sunk and outlined; each part's word and count beside it (never colour alone) */
  .bar { display: flex; gap: 2px; height: 8px; border-radius: 4px; overflow: hidden; }
  .bar .seg { flex: 1 1 0; min-width: 3px; border-radius: 1px; }
  .seg { display: inline-block; background: var(--ctl-off); box-shadow: inset 0 0 0 1px var(--edge); }
  .seg.check { background: var(--c-leaf); box-shadow: none; }
  .seg.cutoff { background: repeating-linear-gradient(45deg, var(--text-soft) 0 1.5px, var(--ctl-off) 1.5px 4.5px); box-shadow: none; }
  .legend { display: flex; flex-wrap: wrap; gap: 2px 12px; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .legend > span { display: inline-flex; align-items: center; gap: 4px; font-variant-numeric: tabular-nums; }
  .legend .seg, .np h5 .seg { width: 12px; height: 8px; border-radius: 2px; flex: none; }
  .nlist { display: grid; gap: 10px; margin: 0 0 8px; padding: 10px 12px; border-radius: 12px; background: color-mix(in srgb, var(--ctl-off) 45%, var(--card)); }
  .np h5 { margin: 0; display: flex; align-items: center; gap: 6px; font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); }
  .np h5 small, .part h4 small, .part h5 small { display: inline; margin: 0 0 0 6px; }
  .np p, .np-note { margin: 4px 0 0; font-size: var(--fs-s); font-weight: 700; line-height: var(--lh); color: var(--text); }
  .np-note { margin: 0; color: var(--text-soft); }
  .more {
    appearance: none; border: 0; background: none; cursor: pointer; min-height: var(--hit); padding: 0; font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--sky-text);
    text-decoration: underline; text-underline-offset: 3px;
  }
  /* the small ✕: drawn 28px, a 44px target */
  .x { appearance: none; border: 0; background: none; cursor: pointer; flex: none; width: var(--hit); height: var(--hit); display: grid; place-items: center; color: var(--text-soft); margin-right: -8px; }
  .x svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2.6; stroke-linecap: round; }
  .x:focus-visible, .night:focus-visible, .more:focus-visible, .psum:focus-visible, .hsw:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; border-radius: 8px; }

  .add { display: flex; gap: 8px; align-items: center; }
  /* 16px so Safari doesn't zoom; the app's field look (ProfileSection's) */
  input[type='date'] {
    flex: 1; min-width: 0; min-height: var(--hit); padding: 6px 12px; border: 0; border-radius: var(--r-btn); appearance: none;
    font: 700 var(--fs-input)/1.1 var(--font-num); color: var(--text); background: var(--ctl); box-shadow: inset 0 0 0 2px var(--edge);
  }
  input[type='date']:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .add .btn { margin: 0; }
  .bulkopen { justify-self: start; margin: 0; }

  .fold { display: grid; gap: 8px; }
  .fold > summary, .part > summary { list-style: none; }
  .fold > summary::-webkit-details-marker, .part > summary::-webkit-details-marker { display: none; }
  .fold[open] > summary { margin-bottom: 8px; }
  .chev { flex: none; width: 10px; height: 10px; border-right: 2.6px solid var(--text-soft); border-bottom: 2.6px solid var(--text-soft); rotate: 45deg; margin: -4px 6px 0; transition: rotate var(--dur-quick); }
  details[open] > summary .chev { rotate: 225deg; margin-top: 4px; }
  .hbody { display: grid; gap: 14px; }
  .presets, .wdays { display: flex; flex-wrap: wrap; gap: 4px 6px; }
  .fresh-banner { display: flex; align-items: center; gap: 8px; background: color-mix(in srgb, var(--c-leaf) 22%, var(--card)); }
  .fresh-banner .btn { flex: none; margin: 0; }

  /* 施設's parts: 探す (h4, its regions h5), 日程に合わない and 除外 folded */
  .part { display: grid; gap: 6px; }
  .part h4 { margin: 0 4px; font: 700 var(--fs-body)/1.2 var(--font-ui); }
  .part h5 { margin: 6px 4px 0; font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); }
  .psum { display: flex; align-items: center; min-height: var(--hit); cursor: pointer; }
  .psum h4 { flex: 1; }
  .hrows { gap: 6px; padding: 6px 14px 6px 10px; }
  .hrows > .hrow + .hrow { padding-top: 6px; }
  .hrow { gap: 10px; }
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

  /* (the switches: theme.css .sw, .sw.s the rows' smaller one) */
  /* the ink rule: only on 自動で確定's chosen (yellow) row */
  .prow[data-its-auto][aria-checked='true'] .prl small { color: var(--c-ink-soft); }

  .why { flex-basis: 100%; margin: 0 4px; display: flex; align-items: center; gap: 8px; font-size: var(--fs-s); font-weight: 700; line-height: var(--lh); color: var(--text-soft); }
  .why span { flex: 1; }
  div.why { padding: 4px 4px 4px 12px; margin: 0; border-radius: var(--r-card); color: var(--text); background: color-mix(in srgb, var(--c-yuzu) 35%, var(--card)); }
  .why .btn { flex: none; margin: 0; }
  p.why.bad { padding: 8px 12px; margin: 0; border-radius: var(--r-card); color: var(--coral-text); background: color-mix(in srgb, var(--c-coral) 18%, var(--card)); }
  .foot { margin: 0 4px; text-align: center; font-size: var(--fs-s); color: var(--text-soft); overflow-wrap: anywhere; line-height: var(--lh); }

  .bulk { display: grid; gap: 8px; padding-bottom: 8px; }
  .period { display: flex; align-items: center; gap: 6px; }
  @media (prefers-reduced-motion: reduce) { .chev { transition: none; } }
</style>
