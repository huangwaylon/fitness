<script lang="ts">
  // 設定's 保養所ボット level (docs/design.md "Settings"): the ITS booker as its Worker reports it (lib/its: GET
  // /its/status) and its settings. The verdict card and the facts; the bookings that need a person, the holds and the
  // reservations; 開始 / 停止 (at once, outside the draft); the stays (日付), the facilities (施設: 探す or 除外, ★ for
  // 優先), 詳細 (間隔, 人数, 自動で確定) and the recent events, all edited as one draft saved with 保存 (the sticky bar
  // while it differs; ✕, the backdrop and Esc ask first: guardForm, ‹ too: `leave`). Fetched on open, then every 15 s
  // while the runner is on its way or running and every minute otherwise, only while shown; leaving it aborts. A poll
  // never touches a draft: when the saved settings moved under it (someone else saved, or a 409) it says so with
  // 読み込み直す. Demo mode: the contract's example, saved on the page only.
  import { untrack } from 'svelte';
  import Segmented from '../ui/Segmented.svelte';
  import ActionSheet from '../ui/ActionSheet.svelte';
  import { askDiscard, guardForm } from '../ui/discard.svelte.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import { formatDate, formatSyncTime } from '#lib/i18n/format.ts';
  import { dayKey, minuteNow, now as sceneNow } from '#lib/time/clock.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { mine } from '#lib/ui-state/viewer.ts';
  import { GUESTS_MAX, GUESTS_MIN, INTERVALS_SEC, type IntervalSec, type ItsStatus, type RunInput } from '#lib/its/contract.ts';
  import { demoRun, demoSave, demoStatus, fetchStatus, postRun, putSettings, type ItsReply } from '#lib/its/client.ts';
  import {
    addDate, bookingRows, dateBounds, dateRows, draftOf, eventLines, factRows, hotelNote, hotelRows, pollMs, removeDate, sameDraft,
    toInput, toggleSkip, toggleStar, verdictView, type Draft
  } from '#lib/its/view.ts';

  /** ‹'s guard (SettingsSheet's back): asks first while the draft holds changes. */
  let { leave = $bindable() }: { leave?: (run: () => void) => void } = $props();

  let status = $state<ItsStatus | null>(null);
  let failed = $state(false);
  let loading = $state(false);
  /** The draft (null: the saved settings shown as they are), what it began from and that `updatedAt`. */
  let draft = $state<Draft | null>(null);
  let start: Draft | null = null;
  let base: number | null = null;
  /** The saved settings moved under the draft (a poll saw it, or 保存 got a 409). */
  let conflict = $state(false);
  let saving = $state(false);
  let saveFailed = $state(false);
  let running = $state(false);
  let adding = $state('');
  let addWhy = $state<string | null>(null);
  let askAuto = $state(false);
  let openSearch = $state(false);
  let openSkipped = $state(false);

  const dirty = $derived(!!draft && !!start && !sameDraft(draft, start));
  guardForm(() => dirty);
  const ask = askDiscard();
  leave = (run) => (dirty ? ask(run) : run());

  /** The page's life: every call aborts as it's left. */
  const life = new AbortController();
  let ctl: AbortController | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const me = (): 'A' | 'B' => (week.view && mine(week.view).who === 'B' ? 'B' : 'A');

  /** A fresh status: the draft kept (a changed one notes the move), an unchanged one let go. */
  function take(s: ItsStatus) {
    status = s;
    if (draft && !dirty) draft = start = null;
    if (draft && s.settings.updatedAt !== base) conflict = true;
  }

  function schedule() {
    clearTimeout(timer);
    if (!life.signal.aborted) timer = setTimeout(() => (document.hidden ? schedule() : void load()), pollMs(status));
  }

  async function load() {
    if (week.demo) {
      status ??= demoStatus(sceneNow().getTime());
      return;
    }
    ctl?.abort();
    const c = (ctl = new AbortController());
    const stop = () => c.abort();
    life.signal.addEventListener('abort', stop);
    loading = true;
    const r = await fetchStatus(c.signal);
    life.signal.removeEventListener('abort', stop);
    if (ctl === c) loading = false;
    if (c.signal.aborted) return;
    if (r.ok) take(r.status);
    failed = !r.ok;
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

  const nowMs = $derived(minuteNow().getTime());
  const today = $derived(dayKey(minuteNow()));
  /** What the page shows: the draft, else the saved settings. */
  const shown = $derived(draft ?? (status ? draftOf(status.settings) : null));
  const verdict = $derived(status && verdictView(status));
  const facts = $derived(status ? factRows(status, today) : []);
  const bookings = $derived(status ? bookingRows(status, today) : []);
  const events = $derived(status ? eventLines(status, today) : []);
  const dates = $derived(shown ? dateRows(shown, nowMs) : []);
  const bounds = $derived(dateBounds(nowMs));
  const hotels = $derived(shown && status ? hotelRows(shown, status.seen) : { search: [], skipped: [] });
  const starred = $derived(hotels.search.filter((r) => r.star !== null).map((r) => r.name));
  const paused = $derived(status?.settings.paused ?? true);

  function edit(f: (d: Draft) => Draft) {
    if (!status || !shown) return;
    if (!draft) {
      start = draftOf(status.settings);
      base = status.settings.updatedAt;
    }
    draft = f(shown);
    saveFailed = false;
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

  function setAuto(on: boolean) {
    cue(on ? 'toggle-on' : 'toggle-off');
    edit((d) => ({ ...d, autoConfirm: on }));
  }

  function discard() {
    cue('back');
    draft = start = null;
    conflict = saveFailed = false;
  }

  /** 読み込み直す: the draft let go, the saved settings read again. */
  function reload() {
    discard();
    void load();
  }

  async function save() {
    if (!draft || !status || saving) return;
    const input = toInput(draft, base, sceneNow().getTime());
    if (week.demo) {
      status = demoSave(status, input, me(), sceneNow().getTime());
      draft = start = null;
      toasts.show(t('its.saved'));
      return;
    }
    saving = true;
    const r = await putSettings(input, life.signal);
    saving = false;
    if (life.signal.aborted) return;
    if (r.ok) {
      status = r.status;
      draft = start = null;
      conflict = saveFailed = false;
      cue('confirm');
      toasts.show(t('its.saved'));
    } else if (r.err === 'conflict') {
      if (r.status) status = r.status;
      conflict = true;
    } else saveFailed = true;
  }

  async function run(action: RunInput['action']) {
    if (!status || running) return;
    if (week.demo) {
      status = demoRun(status, action, sceneNow().getTime());
      return;
    }
    running = true;
    const was = status.settings.updatedAt;
    const r: ItsReply = await postRun(action, life.signal);
    running = false;
    if (life.signal.aborted) return;
    if (r.ok) {
      // (our own 停止 / 開始 moving the stamp is no one else's save: the draft follows it)
      if (draft && base === was) base = r.status.settings.updatedAt;
      take(r.status);
      schedule();
    } else toasts.show(t(action === 'start' ? 'its.ctl.startFailed' : 'its.ctl.stopFailed'), 4000);
  }

  const intervals = INTERVALS_SEC.map((s) => ({ id: String(s), label: s < 60 ? t('its.interval.s', { n: s }) : t('its.interval.m', { n: s / 60 }) }));
  const guests = Array.from({ length: GUESTS_MAX - GUESTS_MIN + 1 }, (_, i) => ({ id: String(GUESTS_MIN + i), label: t('its.guestsN', { n: GUESTS_MIN + i }) }));
</script>

{#snippet hotel(r: (typeof hotels.search)[number])}
  <div class="hrow" data-its-hotel={r.name} data-search={r.search}>
    <button type="button" class="prow" role="switch" aria-checked={r.search} data-sfx="self"
      onclick={() => (cue(r.search ? 'toggle-off' : 'toggle-on'), edit((d) => toggleSkip(d, r.name)))}>
      <span class="prl">{r.name}<small class:fresh={r.fresh}>{hotelNote(r)}</small></span>
      <span class="sw" aria-hidden="true"><i></i></span>
    </button>
    <button type="button" class="star" aria-pressed={r.star !== null} aria-label={t('its.hotel.star', { name: r.name })} data-its-star={r.name} data-sfx="tick"
      onclick={() => edit((d) => toggleStar(d, r.name))}>
      <span aria-hidden="true">★</span>{#if r.star !== null}<b aria-hidden="true">{r.star + 1}</b>{/if}
    </button>
  </div>
{/snippet}

<div class="its" data-its-page aria-busy={loading}>
  {#if failed}
    <div class="prow static" data-its-error>
      <span class="prl">{t('common.loadFailed')}</span>
      <button type="button" class="btn small paper" data-sfx="tick" aria-disabled={loading} onclick={() => loading || void load()}>{t('state.retry')}</button>
    </div>
  {/if}
  {#if conflict}
    <div class="prow static warn" data-its-conflict role="status">
      <span class="prl">{t('its.conflict')}</span>
      <button type="button" class="btn small paper" data-sfx="tick" onclick={reload}>{t('its.reload')}</button>
    </div>
  {/if}
  {#if status && verdict && shown}
    <div class="card verdict" data-its-verdict={status.verdict}>
      <span class="dot {verdict.tone}" aria-hidden="true"></span>
      <div><b>{verdict.word}</b><p>{verdict.sentence}</p></div>
    </div>
    <dl class="card facts">
      {#each facts as f (f.id)}
        <div data-its-fact={f.id}><dt>{f.label}</dt><dd>{#if f.href}<a href={f.href} target="_blank" rel="noopener noreferrer" data-sfx="open">{f.value}</a>{:else}{f.value}{/if}</dd></div>
      {/each}
    </dl>

    {#if bookings.length}
      <section class="sec" aria-labelledby="its-bookings">
        <h3 id="its-bookings" class="sec-label">{t('its.sec.bookings')}</h3>
        <ul class="card rows">
          {#each bookings as b (b.key)}
            <li data-its-booking={b.state}>
              <span class="tag {b.state}">{b.label}</span>
              <span class="txt"><b>{b.hotel}</b><small>{formatDate(b.date)} · {b.detail}</small></span>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    <div class="prow static run" data-its-run={paused ? 'stopped' : 'running'}>
      <span class="prl">{t(paused ? 'its.ctl.off' : 'its.ctl.on')}</span>
      <button type="button" class="btn small" class:paper={!paused} data-its-action={paused ? 'start' : 'stop'} data-sfx="tick" aria-disabled={running}
        onclick={() => void run(paused ? 'start' : 'stop')}>{t(paused ? 'its.ctl.start' : 'its.ctl.stop')}</button>
    </div>

    <section class="sec" aria-labelledby="its-dates">
      <h3 id="its-dates" class="sec-label">{t('its.sec.dates')}</h3>
      {#if dates.length}
        <ul class="card rows">
          {#each dates as d (d.date)}
            <li data-its-date={d.date}>
              <span class="txt"><b>{d.label}</b><small class:late={d.note === 'late'}>{d.text}</small></span>
              <button type="button" class="btn small paper" data-sfx="tick" aria-label={t('its.date.removeLabel', { date: d.label })}
                onclick={() => edit((x) => removeDate(x, d.date))}>{t('its.date.remove')}</button>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="hint">{t('its.date.empty')}</p>
      {/if}
      <div class="add">
        <input type="date" min={bounds.min} max={bounds.max} bind:value={adding} aria-label={t('its.date.field')} data-its-date-field data-sfx="none"
          oninput={() => (addWhy = null)} />
        <button type="button" class="btn small" data-its-date-add data-sfx="self" onclick={add}>{t('its.date.add')}</button>
      </div>
      {#if addWhy}<p class="hint bad" role="alert" data-its-date-why>{addWhy}</p>{/if}
    </section>

    <section class="sec" aria-labelledby="its-hotels">
      <h3 id="its-hotels" class="sec-label">{t('its.sec.hotels')}</h3>
      <p class="hint">{t('its.hotel.hint')}</p>
      <details class="fold" bind:open={openSearch} data-its-search>
        <summary class="prow"><span class="prl">{t('its.hotel.search', { n: hotels.search.length })}{#if starred.length}<small>★ {starred.join('、')}</small>{/if}</span><span class="chev" aria-hidden="true"></span></summary>
        {#if openSearch}<div class="prows">{#each hotels.search as r (r.key)}{@render hotel(r)}{/each}</div>{/if}
      </details>
      {#if hotels.skipped.length}
        <details class="fold" bind:open={openSkipped} data-its-skipped>
          <summary class="prow"><span class="prl">{t('its.hotel.skipped', { n: hotels.skipped.length })}</span><span class="chev" aria-hidden="true"></span></summary>
          {#if openSkipped}<div class="prows">{#each hotels.skipped as r (r.key)}{@render hotel(r)}{/each}</div>{/if}
        </details>
      {/if}
    </section>

    <section class="sec" aria-labelledby="its-detail">
      <h3 id="its-detail" class="sec-label">{t('its.sec.detail')}</h3>
      <div class="card opts">
        <span class="lbl" id="its-interval">{t('its.interval')}</span>
        <Segmented items={intervals} value={String(shown.intervalSec)} label={t('its.interval')} attr="its-interval"
          onpick={(id) => edit((d) => ({ ...d, intervalSec: Number(id) as IntervalSec }))} />
        <p class="hint">{t('its.interval.note')}</p>
        <span class="lbl">{t('its.guests')}</span>
        <Segmented items={guests} value={String(shown.guests)} label={t('its.guests')} attr="its-guests" onpick={(id) => edit((d) => ({ ...d, guests: Number(id) }))} />
      </div>
      <button type="button" class="prow" role="switch" aria-checked={shown.autoConfirm} data-its-auto data-sfx="self"
        onclick={() => (shown!.autoConfirm ? setAuto(false) : (askAuto = true))}>
        <span class="prl">{t('its.auto')}<small>{t('its.auto.hint')}</small></span>
        <span class="sw" aria-hidden="true"><i></i></span>
      </button>
    </section>

    {#if events.length}
      <details class="fold" data-its-recent>
        <summary class="prow"><span class="prl">{t('its.sec.recent')}</span><span class="chev" aria-hidden="true"></span></summary>
        <ol class="card rows ev">
          {#each events as e (e.key)}
            <li data-its-event data-bad={e.bad ? '' : undefined}>
              <span class="time">{e.time}</span><span class="txt"><b class:bad={e.bad}>{e.what}</b>{#if e.info}<small>{e.info}</small>{/if}</span>
            </li>
          {/each}
        </ol>
      </details>
    {/if}

    <p class="foot" data-its-foot>{[status.mode, status.sha?.slice(0, 7), t('its.updated', { time: formatSyncTime(new Date(status.now), today) })].filter(Boolean).join(' · ')}</p>

    {#if dirty}
      <div class="level-acts" data-its-save-bar>
        {#if saveFailed}<p class="hint bad" role="alert" data-its-save-failed>{t('its.saveFailed')}</p>{/if}
        <button type="button" class="btn paper small" data-sfx="self" onclick={discard}>{t('its.discard')}</button>
        <button type="button" class="btn" data-its-save data-sfx="tick" aria-disabled={saving} onclick={() => void save()}>{t('its.save')}</button>
      </div>
    {/if}
  {:else if !failed}
    {#each [0, 1, 2] as i (i)}<div class="card skel" data-its-skeleton aria-hidden="true"><span></span></div>{/each}
  {/if}
</div>

<ActionSheet bind:open={askAuto} title={t('its.auto.title')} note={t('its.auto.note')}
  groups={[[{ id: 'on', label: t('its.auto.on') }], [{ id: 'cancel', label: t('its.auto.cancel') }]]}
  onpick={(id) => id === 'on' && setAuto(true)} />

<style>
  .its { display: flex; flex-direction: column; gap: 14px; }
  .card { margin: 0; padding: 12px 14px; border-radius: var(--r-card); background: var(--card); box-shadow: var(--sh-lip); }
  .sec { display: grid; gap: 8px; }
  .hint { margin: 0 4px; font-size: var(--fs-s); font-weight: 700; line-height: var(--lh); color: var(--text-soft); }
  .hint.bad, .late, b.bad { color: var(--coral-text); }
  .warn { background: color-mix(in srgb, var(--c-yuzu) 35%, var(--card)); }

  .verdict { display: flex; align-items: flex-start; gap: 12px; }
  .verdict b { font-size: var(--fs-title); line-height: 1.3; }
  .verdict p { margin: 2px 0 0; font-size: var(--fs-body); line-height: var(--lh); color: var(--text-soft); font-weight: 700; }
  .dot { flex: none; width: 14px; height: 14px; margin-top: 5px; border-radius: 50%; box-shadow: 0 0 0 2px var(--card), 0 0 0 3px var(--edge); }
  .dot.good { background: var(--c-leaf); }
  .dot.warn { background: var(--c-yuzu); }
  .dot.bad { background: var(--c-coral); }
  .dot.idle { background: var(--ctl-off); }

  .facts { display: grid; gap: 8px; }
  .facts div { display: flex; justify-content: space-between; gap: 12px; font-size: var(--fs-body); }
  .facts dt { flex: none; color: var(--text-soft); font-weight: 700; }
  .facts dd { margin: 0; min-width: 0; font-weight: 700; text-align: right; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
  .facts a { color: var(--sky-text); display: inline-block; min-height: 24px; }

  .rows { list-style: none; display: grid; gap: 8px; }
  .rows li { display: flex; align-items: center; gap: 10px; min-height: var(--hit); }
  .rows li + li { padding-top: 8px; border-top: 1px dashed color-mix(in srgb, var(--text-soft) 40%, transparent); }
  .txt { flex: 1; min-width: 0; font-size: var(--fs-body); }
  .txt b { display: block; line-height: 1.3; }
  small { display: block; margin-top: 2px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); line-height: 1.3; }
  .rows .btn { flex: none; margin: 0; }
  .tag { flex: none; padding: 4px 8px; border-radius: var(--r-chip); font: 700 var(--fs-s)/1 var(--font-ui); background: var(--ctl-off); color: var(--text); }
  .tag.action { background: var(--c-coral); color: var(--c-ink); }
  .tag.hold, .tag.applying { background: var(--c-yuzu); color: var(--c-ink); }
  .tag.confirmed { background: var(--c-leaf); color: var(--c-ink); }
  .ev .time { flex: none; align-self: flex-start; font-size: var(--fs-s); font-weight: 700; font-variant-numeric: tabular-nums; color: var(--text-soft); padding-top: 2px; }
  .ev li { align-items: flex-start; min-height: 0; }

  .run .btn { flex: none; margin: 0; }

  .add { display: flex; gap: 8px; align-items: center; }
  /* 16px so Safari doesn't zoom; the app's field look (ProfileSection's) */
  input[type='date'] {
    flex: 1; min-width: 0; min-height: var(--hit); padding: 6px 12px; border: 0; border-radius: var(--r-btn); appearance: none;
    font: 700 var(--fs-input)/1.1 var(--font-num); color: var(--text); background: var(--ctl); box-shadow: inset 0 0 0 2px var(--edge);
  }
  input[type='date']:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .add .btn { margin: 0; }

  .fold { display: grid; gap: 8px; }
  .fold > summary { list-style: none; }
  .fold > summary::-webkit-details-marker { display: none; }
  .fold[open] > summary { margin-bottom: 8px; }
  .chev { flex: none; width: 10px; height: 10px; border-right: 2.6px solid var(--text-soft); border-bottom: 2.6px solid var(--text-soft); rotate: 45deg; margin: -4px 6px 0; transition: rotate var(--dur-quick); }
  .fold[open] > summary .chev { rotate: 225deg; margin-top: 4px; }
  .prows { display: grid; gap: 10px; }

  .hrow { display: flex; gap: 8px; align-items: stretch; }
  .hrow .prow { flex: 1; min-width: 0; }
  .prl small { color: var(--text-soft); }
  .prl small.fresh { color: var(--leaf-text); }
  .star {
    appearance: none; border: 0; cursor: pointer; flex: none; width: 52px; min-height: 52px; border-radius: var(--r-card); position: relative;
    display: flex; align-items: center; justify-content: center; gap: 1px; background: var(--ctl); color: var(--text-soft); box-shadow: var(--sh-ctl);
    font: 700 22px/1 var(--font-ui);
  }
  .star b { font: 700 var(--fs-s)/1 var(--font-num); }
  .star[aria-pressed='true'] { background: var(--ctl-sel); color: var(--c-ink); }
  .star:active { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }

  .opts { display: grid; gap: 8px; }
  .lbl { font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); }
  .opts .hint { margin: 0 0 6px; }

  /* the switch (SoundSection's): a sunk tan track (off) or a leaf one (on) with a cream knob */
  .sw {
    position: relative; flex: none; width: 56px; height: 32px; border-radius: var(--r-pill);
    background: var(--ctl-off); box-shadow: inset 0 0 0 2px var(--edge); transition: background var(--dur-quick);
  }
  .sw i {
    position: absolute; top: 4px; left: 4px; width: 24px; height: 24px; border-radius: 50%;
    background: var(--c-card); box-shadow: inset 0 0 0 2px var(--c-edge), 0 2px 0 var(--c-edge);
    transition: translate var(--dur-base) var(--ease-bounce);
  }
  .prow[aria-checked='true'] .sw { background: var(--c-leaf); box-shadow: inset 0 0 0 2px var(--c-leaf-edge); }
  .prow[aria-checked='true'] .sw i { translate: 24px 0; }
  .prow[aria-checked='true'] .prl small { color: var(--c-ink-soft); }

  .level-acts .hint { flex-basis: 100%; }
  .foot { margin: 0 4px; text-align: center; font-size: var(--fs-s); color: var(--text-soft); overflow-wrap: anywhere; }

  .skel { height: 52px; display: flex; align-items: center; }
  .skel span { width: 60%; height: 12px; border-radius: 6px; background: var(--ctl-off); animation: pulse 1.2s ease-in-out infinite alternate; }
  @keyframes pulse { from { opacity: .45; } to { opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { .skel span { animation: none; } .chev, .sw, .sw i { transition: none; } }
</style>
