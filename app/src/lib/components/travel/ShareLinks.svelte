<script lang="ts">
  // 共有リンク, the trips list's second level (docs/design.md §Trips, docs/travel.md "Sharing"): links that show the
  // whole trips page (every trip, its 持ち物 and notes, private values 🔒) to someone without a key. A form card (名前（任意）, 有効期限 1週間 · 1か月 · 3か月 · 1年, 作成), then the live links (a card
  // each: its name, who made it and until when, its views; tapped, its visits; ⋯: 共有… · コピー · 期限を変更 · 名前を変更
  // · 無効にする) and the ended ones under a fold (期限を変更 revives one). Made, a link's card shows 共有… (the system's
  // share sheet, else the clipboard) and コピー. 無効にする acts at once, a 取り消す banner (the kit's delete rule). Online
  // only (the relay's actions, never queued): offline says so, with もう一度. Anyone with the week loaded, the guest too
  // (TravelSheet; docs/decisions.md).
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import { SHARE_DEFAULT_DAYS, SHARE_TRIPS_REF, SHARE_LABEL_MAX, SHARE_PRESETS, shareState, type SharePreset, type ShareRow, type ShareVisit } from '#lib/contract/share.ts';
  import { clockAt, localDateAt } from '#lib/contract/tokyo.ts';
  import { untilDate } from '../share/until.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import { md, weekdayOf } from '#lib/i18n/format.ts';
  import { UNDO_MS, toasts } from '#lib/ui-state/toast.svelte.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { villagerNameOf } from '#lib/ui-state/viewer.ts';
  import NavBar from '../ui/NavBar.svelte';
  import NavButton from '../ui/NavButton.svelte';
  import Segmented from '../ui/Segmented.svelte';
  import LoadError from '../ui/LoadError.svelte';
  import ActionSheet, { type Action } from '../ui/ActionSheet.svelte';
  import Sheet from '../ui/Sheet.svelte';
  import Phrases from '../ui/Phrases.svelte';
  import Icon from '../ui/Icon.svelte';
  import { copyUrl, listShares, makeShare, setShare, shareOrCopy, shareUrl, shareVisits } from './shares.ts';

  interface Props {
    now: number;
    onback: () => void;
    onclose: () => void;
  }
  let { now, onback, onclose }: Props = $props();

  let rows = $state<ShareRow[] | null>(null);
  let status = $state<'loading' | 'ok' | 'offline' | 'failed'>('loading');
  let label = $state('');
  let days = $state<SharePreset>(SHARE_DEFAULT_DAYS);
  let busy = $state(false);
  /** The link just made: its card offers 共有… and コピー. */
  let fresh = $state<string | null>(null);
  /** The link whose visits are shown, and the visits fetched. */
  let shown = $state<string | null>(null);
  let visits = $state<Record<string, ShareVisit[]>>({});

  const live = $derived((rows ?? []).filter((r) => shareState(r, now) === 'live'));
  const ended = $derived((rows ?? []).filter((r) => shareState(r, now) !== 'live'));
  let endedOpen = $state(false);

  async function load() {
    status = 'loading';
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return void (status = 'offline');
    const r = await listShares('trips', SHARE_TRIPS_REF);
    if (r.ok) {
      rows = r.rows;
      status = 'ok';
    } else status = r.error === 'offline' ? 'offline' : 'failed';
  }
  onMount(() => void load());

  /** A row as it now is (an answer's), in its place. */
  const put = (row: ShareRow) => (rows = (rows ?? []).some((x) => x.id === row.id) ? (rows ?? []).map((x) => (x.id === row.id ? row : x)) : [row, ...(rows ?? [])]);
  const failed = (e: { error: string; detail?: string }) => toasts.show(e.detail === 'cap' ? t('travel.share.cap') : e.error === 'offline' ? t('travel.share.offline') : t('travel.share.saveFailed'));

  async function create(e: SubmitEvent) {
    e.preventDefault();
    if (busy || status !== 'ok') return;
    busy = true;
    const r = await makeShare('trips', SHARE_TRIPS_REF, days, label);
    busy = false;
    if (!r.ok) return failed(r);
    put(r.row);
    fresh = r.row.id;
    label = '';
    days = SHARE_DEFAULT_DAYS;
  }

  const urlOf = (r: ShareRow) => shareUrl(location.origin + resolve('/').replace(/\/?$/, '/s'), r.token);

  async function send(r: ShareRow) {
    const how = await shareOrCopy(urlOf(r), t('travel.title'));
    if (how === 'copied') toasts.show(t('travel.share.copied'));
    else if (how === 'failed') toasts.show(t('travel.share.copyFailed'));
  }
  async function copy(r: ShareRow) {
    toasts.show(t((await copyUrl(urlOf(r))) ? 'travel.share.copied' : 'travel.share.copyFailed'));
  }

  async function change(r: ShareRow, o: { days?: SharePreset; label?: string; off?: boolean }): Promise<boolean> {
    const res = await setShare(r.id, o);
    if (!res.ok) {
      failed(res);
      return false;
    }
    put(res.row);
    return true;
  }
  /** 無効にする: at once, 取り消す on the banner. */
  async function turnOff(r: ShareRow) {
    if (!(await change(r, { off: true }))) return;
    if (fresh === r.id) fresh = null;
    toasts.show(t('travel.share.offDone'), UNDO_MS, { action: { label: t('travel.share.undo'), run: () => void change(r, { off: false }) } });
  }

  /** The open card's visits couldn't be read (offline, a timeout): said in the card, a tap on the row asks again. */
  let visitsFailed = $state(false);
  async function toggle(r: ShareRow) {
    shown = shown === r.id ? null : r.id;
    if (shown !== r.id) return;
    visitsFailed = false;
    const v = await shareVisits(r.id);
    if (v.ok) {
      visits = { ...visits, [r.id]: v.visits };
      put(v.row);
    } else if (shown === r.id) visitsFailed = true;
  }

  // ---- the row's ⋯, 期限を変更 and 名前を変更
  let acting = $state<ShareRow | null>(null);
  let actsOpen = $state(false);
  let renewOpen = $state(false);
  let renameOpen = $state(false);
  let renameText = $state('');
  const actsFor = (r: ShareRow): Action[][] => (shareState(r, now) === 'live'
    ? [[{ id: 'send', label: t('travel.share.send'), icon: 'share', hook: 'share-act-send' }, { id: 'copy', label: t('travel.share.copy'), icon: 'link', hook: 'share-act-copy' }],
      [{ id: 'renew', label: t('travel.share.renew'), icon: 'clock', hook: 'share-act-renew' }, { id: 'rename', label: t('travel.share.rename'), icon: 'edit', hook: 'share-act-rename' }],
      [{ id: 'off', label: t('travel.share.off'), icon: 'close', danger: true, hook: 'share-act-off' }]]
    : [[{ id: 'renew', label: t('travel.share.renew'), icon: 'clock', hook: 'share-act-renew' }]]);
  function more(r: ShareRow) {
    acting = r;
    actsOpen = true;
  }
  function act(id: string) {
    const r = acting;
    if (!r) return;
    if (id === 'send') void send(r);
    else if (id === 'copy') void copy(r);
    else if (id === 'off') void turnOff(r);
    else if (id === 'renew') renewOpen = true;
    else if (id === 'rename') {
      renameText = r.label;
      renameOpen = true;
    }
  }
  const renewActs = $derived<Action[][]>([SHARE_PRESETS.map((d) => ({ id: String(d), label: t(`travel.share.days.${d}`), hook: `share-renew-${d}` }))]);
  function renew(id: string) {
    const r = acting;
    // (an ended link comes back: a turned-off one is turned on with it)
    if (r) void change(r, { days: Number(id) as SharePreset, ...(r.off ? { off: false } : {}) });
  }
  async function rename() {
    const r = acting;
    if (!r) return;
    if (await change(r, { label: renameText })) renameOpen = false;
  }

  // ---- the words
  const slash = (iso: string) => untilDate(iso, i18n.locale);
  const dayOf = (iso: string) => {
    const d = localDateAt(Date.parse(iso));
    return i18n.locale === 'ja' ? `${md(d)}（${weekdayOf(d)}）` : `${weekdayOf(d)} ${md(d)}`;
  };
  const whenOf = (iso: string) => `${dayOf(iso)} ${clockAt(Date.parse(iso))}`;
  const nameOf = (r: ShareRow) => r.label || t('travel.share.unnamed', { date: slash(r.at) });
  const whoOf = (by: string) => (week.view && (by === 'A' || by === 'B' || by === 'G') ? villagerNameOf(week.view, by) : by);
  const endedOf = (r: ShareRow) => (r.off ? t('travel.share.endedOff', { date: slash(r.off) }) : t('travel.share.endedExp', { date: slash(r.exp) }));
  const presets = $derived(SHARE_PRESETS.map((d) => ({ id: String(d), label: t(`travel.share.days.${d}`) })));
</script>

{#snippet card(r: ShareRow, over: boolean)}
  <article class="card pad link" class:over data-share-row={r.id} data-share-state={shareState(r, now)}>
    <div class="hd">
      <button type="button" class="main" aria-expanded={shown === r.id} data-share-open data-sfx="tick" onclick={() => void toggle(r)}>
        <span class="nm" data-share-name>{nameOf(r)}</span>
        <span class="meta">{over ? endedOf(r) : t('travel.share.meta', { who: whoOf(r.by), date: slash(r.exp) })}</span>
        <span class="views" data-share-views={r.views}>{r.views ? `${t('travel.share.views', { n: r.views, u: r.uniq })}${r.last ? ` · ${t('travel.share.last', { date: dayOf(r.last) })}` : ''}` : t('travel.share.noViews')}</span>
      </button>
      <NavButton kind="tool" icon="more" label={t('travel.share.acts', { name: nameOf(r) })} popup sfx="open" data-share-more onclick={() => more(r)} />
    </div>
    {#if fresh === r.id && !over}
      <div class="ctas">
        <button type="button" class="btn" data-share-send data-sfx="open" onclick={() => void send(r)}><Icon name="share" />{t('travel.share.send')}</button>
        <button type="button" class="btn small paper" data-share-copy data-sfx="tick" onclick={() => void copy(r)}>{t('travel.share.copy')}</button>
      </div>
    {/if}
    {#if shown === r.id}
      <div class="visits" data-share-visits>
        {#if r.first}<p class="span">{t('travel.share.first', { date: dayOf(r.first) })} · {t('travel.share.last', { date: dayOf(r.last ?? r.first) })}</p>{/if}
        {#if visits[r.id]?.length}
          <ul aria-label={t('travel.share.visits')}>
            {#each visits[r.id] as v (v.at)}<li data-share-visit>{whenOf(v.at)} · {t(`travel.share.dev.${v.dev}`)}{v.cc ? ` · ${v.cc}` : ''}</li>{/each}
          </ul>
        {:else if visits[r.id]}<p class="span">{t('travel.share.noViews')}</p>
        {:else if visitsFailed}<p class="span" data-share-visits-failed><Phrases text={t('common.loadFailed')} /></p>{/if}
      </div>
    {/if}
  </article>
{/snippet}

<div class="share" data-share-level>
  <div class="top"><NavBar pad title={t('travel.share.title')} {onback} {onclose} /></div>
  <div class="scroll sheet-scroll">
    <p class="lead"><Phrases text={t('travel.share.lead')} /></p>
    {#if status === 'offline'}
      <LoadError text={t('travel.share.offline')} onretry={() => void load()} data-share-offline />
    {:else if status === 'failed'}
      <LoadError text={t('common.loadFailed')} onretry={() => void load()} data-share-failed />
    {:else}
      <section class="sec" aria-labelledby="share-new">
        <h3 id="share-new" class="sec-label">{t('travel.share.new')}</h3>
        <form class="card form" data-share-form onsubmit={create}>
          <label class="fld">
            <span class="fl">{t('travel.share.label')}</span>
            <input class="input" type="text" enterkeyhint="done" maxlength={SHARE_LABEL_MAX} placeholder={t('travel.share.labelHint')} bind:value={label} data-share-label data-sfx="none" />
          </label>
          <div class="fld">
            <span class="fl">{t('travel.share.expiry')}</span>
            <Segmented size="s" grow items={presets} value={String(days)} label={t('travel.share.expiry')} attr="share-days" onpick={(d) => (days = Number(d) as SharePreset)} />
          </div>
          <button type="submit" class="btn" aria-disabled={busy || status !== 'ok'} data-share-make data-sfx="confirm">{t('travel.share.make')}</button>
        </form>
      </section>
      {#if rows}
        <section class="sec" aria-labelledby="share-live">
          <h3 id="share-live" class="sec-label head">{t('travel.share.title')}<span class="n">{live.length}</span></h3>
          {#each live as r (r.id)}{@render card(r, false)}{:else}<p class="none"><Phrases text={t('travel.share.none')} /></p>{/each}
        </section>
        {#if ended.length}
          <section class="sec">
            <button type="button" class="fold sec-label" aria-expanded={endedOpen} data-share-ended data-sfx="tick" onclick={() => (endedOpen = !endedOpen)}>
              {t('travel.share.ended')}<span class="n">{ended.length}</span><Icon name={endedOpen ? 'chevron-up' : 'chevron-down'} size={18} />
            </button>
            {#if endedOpen}<div class="readonly ended">{#each ended as r (r.id)}{@render card(r, true)}{/each}</div>{/if}
          </section>
        {/if}
      {:else}
        <p class="none" aria-busy="true"><Phrases text={t('travel.loading')} /></p>
      {/if}
    {/if}
  </div>
</div>

<ActionSheet bind:open={actsOpen} name="share.acts" title={acting ? nameOf(acting) : ''} groups={acting ? actsFor(acting) : []} onpick={act} />
<ActionSheet bind:open={renewOpen} name="share.renew" title={t('travel.share.renew')} note={t('travel.share.renewNote')} groups={renewActs} onpick={renew} />
<Sheet bind:open={renameOpen} title={t('travel.share.rename')} focusField name="share.rename" confirm={{ verb: t('common.save'), onyes: () => void rename() }}>
  <label class="fld rename">
    <span class="fl">{t('travel.share.label')}</span>
    <input class="input" type="text" enterkeyhint="done" maxlength={SHARE_LABEL_MAX} placeholder={t('travel.share.labelHint')} bind:value={renameText} data-share-rename data-sfx="none" />
  </label>
</Sheet>

<style>
  .share { flex: 1; min-height: 0; display: flex; flex-direction: column; }
  .top { flex: none; background-color: var(--surface); }
  .scroll { display: grid; align-content: start; gap: 14px; padding: 6px 12px 24px; }
  .lead { margin: 0 4px; font: 600 var(--fs-s)/1.5 var(--font-body); color: var(--text-soft); }
  .sec { display: grid; gap: 8px; }
  .fld { display: grid; gap: 6px; }
  .fl { font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); }
  .form .btn { margin-top: 2px; }
  .none { margin: 0 4px; font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }
  .link { display: grid; gap: 10px; }
  .hd { display: flex; align-items: flex-start; gap: 4px; margin-right: -8px; }
  .main { appearance: none; border: 0; background: none; padding: 0; margin: 0; cursor: pointer; flex: 1; min-width: 0; min-height: var(--hit); display: grid; gap: 3px; text-align: start; color: var(--text); font: inherit; }
  .nm { font: 700 var(--fs-body)/1.3 var(--font-ui); overflow-wrap: anywhere; }
  .meta, .views { font: 600 var(--fs-s)/1.35 var(--font-ui); color: var(--text-soft); }
  .views { color: var(--text); font-variant-numeric: tabular-nums; }
  .ctas { display: flex; gap: 8px; align-items: center; }
  .ctas .btn:not(.small) { flex: 1; margin: 0; }
  .ctas .btn.small { margin: 0; }
  .visits { display: grid; gap: 6px; padding-top: 8px; border-top: 2px dashed color-mix(in srgb, var(--lip) 60%, transparent); }
  .visits .span { margin: 0; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .visits ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; max-height: 240px; overflow: auto; font: 600 var(--fs-s)/1.35 var(--font-ui); font-variant-numeric: tabular-nums; }
  .fold { appearance: none; border: 0; background: none; cursor: pointer; display: flex; align-items: center; gap: 8px; min-height: var(--hit); padding: 0 4px; margin: 0; text-align: start; }
  .fold :global(svg) { margin-left: auto; }
  .n { font-family: var(--font-num); font-weight: 600; margin-left: 6px; }
  .ended { display: grid; gap: 8px; }
  .over { opacity: .85; }
  .rename { padding: 4px 16px 12px; }
</style>
