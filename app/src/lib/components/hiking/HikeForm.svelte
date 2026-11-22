<script lang="ts">
  // A registered hike's form (docs/hiking.md "Screens"), the kit's form sheet (ui/Sheet: ✕ in its title bar, 保存 at
  // its foot), one form for the three ways in: YAMAP's link (pasted, share text and all; 読み込む asks the relay, then
  // the preview), a GPX file (read on the phone: parseGpx → fitTrack), or typed in. Then the same fields: the name
  // (prefilled from the title or the file: check it holds no one's name), the area, the date, the status (行きたい ·
  // 予定 · 歩いた), the figures (a link's or a file's read-only, typed in by hand), the notes; a track's elevation chart
  // as its preview (no map here). 編集 reopens it on a hike, its track kept. A link already saved (its `ref`) opens
  // that hike instead. ✕, the backdrop or Esc with anything entered ask first.
  import { untrack } from 'svelte';
  import Sheet from '../ui/Sheet.svelte';
  import Segmented from '../ui/Segmented.svelte';
  import Phrases from '../ui/Phrases.svelte';
  import ElevCard from './ElevCard.svelte';
  import { hikes, importYamap, type HikeFields, type ImportError, type SaveWhy } from './hikes.svelte.ts';
  import { HIKE_AREA, HIKE_NAME, HIKE_NOTES, hikeTrkOf, newHikeId, type HikeSrc, type HikeStatus, type HikeView } from '#lib/contract/hike.ts';
  import { cleanLine } from '#lib/contract/text.ts';
  import { fitTrack, parseGpx, type TrackFile } from '#lib/contract/hikeTrack.ts';
  import { yamapLink } from '#lib/contract/yamap.ts';
  import { prepare } from '#lib/hiking/track.ts';
  import { gainOf } from '#lib/hiking/user.ts';
  import { S } from '#lib/hiking/strings.ts';
  import { fmtM, pick } from '../travel/text.ts';
  import { fmtKm } from '../travel/units.ts';
  import { i18n } from '#lib/i18n/index.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';

  interface Props {
    open: boolean;
    /** A new hike's way in (ignored when editing). */
    src: HikeSrc;
    /** The hike edited; null: a new one. */
    edit: HikeView | null;
    /** Saved (new or edited), or a link already saved: that hike's id. */
    onsaved: (id: string) => void;
    /** Another way in instead (a private activity's: its GPX). */
    onswitch: (src: HikeSrc) => void;
  }
  let { open = $bindable(), src, edit, onsaved, onswitch }: Props = $props();
  const L = $derived(i18n.locale);
  const uid = $props.id();

  const mode = untrack(() => edit?.src ?? src);
  /** The fields the form doesn't show, kept as they are (a link's ref, くだり, level). */
  let base = $state.raw<Partial<HikeFields>>(untrack(() => {
    if (!edit) return { src };
    const { id: _i, at: _a, who: _w, ...f } = edit;
    return f;
  }));
  let name = $state(untrack(() => edit?.name ?? ''));
  let area = $state(untrack(() => edit?.area ?? ''));
  let date = $state(untrack(() => edit?.date ?? ''));
  let status = $state<HikeStatus>(untrack(() => edit?.status ?? (src === 'gpx' ? 'done' : 'want')));
  let km = $state(untrack(() => (edit?.km !== undefined ? String(edit.km) : '')));
  let gain = $state(untrack(() => (edit?.gainM !== undefined ? String(edit.gainM) : '')));
  let hh = $state(untrack(() => edit?.time?.split(':')[0] ?? ''));
  let mm = $state(untrack(() => (edit?.time ? String(+edit.time.split(':')[1]) : '')));
  let notes = $state(untrack(() => edit?.notes ?? ''));
  let track = $state.raw<TrackFile | null>(untrack(() => (edit ? hikes.track(edit.id) : null)));
  /** Whether the fields show: always by hand or editing; a link's or a file's once read. */
  let read = $state(untrack(() => !!edit || src === 'manual'));
  const prep = $derived(track ? prepare(track) : null);
  /** The figures typed in (by hand only: a link's and a file's are theirs). */
  const typed = mode === 'manual';

  let url = $state('');
  let loading = $state(false);
  let err = $state<string | null>(null);
  let notFound = $state(false);
  let needName = $state(false);
  /** Why 保存 didn't save (shown by the button). */
  let saveErr = $state<string | null>(null);
  let picked = $state('');

  const start = untrack(() => JSON.stringify([name, area, date, status, km, gain, hh, mm, notes]));
  const unsaved = () => !!url.trim() || !!picked || JSON.stringify([name, area, date, status, km, gain, hh, mm, notes]) !== start;

  const IMPORT_ERR: Record<ImportError, keyof typeof S> = {
    bad_link: 'errBadLink', not_found: 'errNotFound', offline: 'errOffline', capped: 'errCapped', timeout: 'errTimeout', upstream: 'errUpstream',
    too_large: 'errTooLarge', unauthorized: 'errOther', bad_request: 'errOther'
  };
  const STATUS: { id: HikeStatus; label: string }[] = $derived([
    { id: 'want', label: pick(S.secWant, L) }, { id: 'planned', label: pick(S.secPlanned, L) }, { id: 'done', label: pick(S.secWalked, L) }
  ]);

  /** A link's own ref, already saved: that hike opens instead (no second). */
  function existing(ref: string | undefined): boolean {
    const had = ref ? hikes.byRef(ref) : null;
    if (!had || had.id === edit?.id) return false;
    toasts.show(pick(S.dupe, L), 2400, { low: true });
    open = false;
    onsaved(had.id);
    return true;
  }

  async function load() {
    err = null;
    notFound = false;
    if (!yamapLink(url)) return void (err = pick(S.errBadLink, L));
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return void (err = pick(S.errOffline, L));
    loading = true;
    const r = await importYamap(url);
    loading = false;
    if (!r.ok) {
      err = pick(S[IMPORT_ERR[r.error]], L);
      notFound = r.error === 'not_found';
      return;
    }
    const m = r.meta;
    if (existing(m.ref)) return;
    const { name: n, area: a, date: d, status: st, ...rest } = m;
    base = { ...rest };
    name = n;
    area = a;
    date = d ?? '';
    status = st;
    [hh, mm] = m.time ? [m.time.split(':')[0], String(+m.time.split(':')[1])] : ['', ''];
    km = m.km !== undefined ? String(m.km) : '';
    gain = m.gainM !== undefined ? String(m.gainM) : '';
    track = r.track;
    read = true;
  }

  /** The GPX's own name (its track's, else its metadata's), else the file's. */
  const gpxName = (text: string, file: string): string =>
    (/<trk\b[^>]*>\s*<name>([\s\S]*?)<\/name>/.exec(text)?.[1] ?? /<metadata\b[^>]*>[\s\S]*?<name>([\s\S]*?)<\/name>/.exec(text)?.[1] ?? file.replace(/\.gpx$/i, ''))
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();

  /** The day its first point was recorded (the phone's own zone), if it has a time. */
  function gpxDay(text: string): string {
    const d = new Date(/<trkpt\b[\s\S]*?<time>([^<]+)<\/time>/.exec(text)?.[1] ?? '');
    return Number.isNaN(+d) ? '' : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  async function pickFile(e: Event) {
    const input = e.currentTarget as HTMLInputElement, f = input.files?.[0];
    err = null;
    if (!f) return;
    picked = f.name;
    let t: TrackFile | null = null, text = '';
    try {
      // (a phone's day out is a few MB at most)
      if (f.size > 30_000_000) throw new Error('big');
      text = await f.text();
      const g = parseGpx(text);
      if (g.pts.length < 2) throw new Error('empty');
      // the waypoints as the record takes them: a number for each coordinate, a name of one clean line
      const wpts = g.wpts.filter((w) => Number.isFinite(w.lat) && Number.isFinite(w.lon) && Math.abs(w.lat) <= 90 && Math.abs(w.lon) <= 180).slice(0, 30)
        .map((w) => ({ ...w, name: cleanLine(w.name, HIKE_NAME) }));
      t = fitTrack(g.pts, wpts);
      if (!t) return void (err = pick(S.errTooLarge, L));
      // (the record's own check: a track it would drop is no track)
      if (!hikeTrkOf({ id: newHikeId(Date.now()), ...t })) throw new Error('unfit');
    } catch {
      return void (err = pick(S.errGpx, L));
    } finally {
      // (the same file picked again fires change again)
      input.value = '';
    }
    track = t;
    name ||= gpxName(text, f.name).slice(0, HIKE_NAME);
    date ||= gpxDay(text);
    km = String(Math.round(t.len / 100) / 10);
    gain = String(gainOf(t));
    read = true;
  }

  const num = (s: string, max: number): number | undefined => {
    const n = Number(s.trim().replace(',', '.'));
    return s.trim() && Number.isFinite(n) && n >= 0 && n <= max ? n : undefined;
  };
  function fields(): HikeFields {
    const k = num(km, 1000), g = num(gain, 20_000), h = num(hh, 99), m = num(mm, 59);
    const f: HikeFields = { ...base, src: mode, name: name.trim(), area: area.trim(), status } as HikeFields;
    for (const key of ['date', 'km', 'gainM', 'time', 'notes'] as const) delete f[key];
    if (date) f.date = date;
    if (k !== undefined) f.km = Math.round(k * 10) / 10;
    if (g !== undefined) f.gainM = Math.round(g);
    if (h !== undefined || m !== undefined) {
      const all = Math.round(h ?? 0) * 60 + Math.round(m ?? 0);
      if (all > 0) f.time = `${Math.floor(all / 60)}:${String(all % 60).padStart(2, '0')}`;
    }
    if (notes.trim()) f.notes = notes;
    return f;
  }
  /** The figures typed but not read as numbers (a typo would be dropped silently): their labels. */
  function badFigures(): string[] {
    const bad = (s: string, max: number) => !!s.trim() && num(s, max) === undefined;
    return [
      ...(typed && bad(km, 1000) ? [pick(S.statDist, L)] : []),
      ...(typed && bad(gain, 20_000) ? [pick(S.statGain, L)] : []),
      ...(mode !== 'yamap' && (bad(hh, 99) || bad(mm, 59)) ? [pick(S.statTime, L)] : [])
    ];
  }
  const SAVE_ERR: Record<SaveWhy, keyof typeof S> = { ready: 'errNotReady', hike: 'errSaveHike', track: 'errSaveTrack', send: 'errSend' };
  function submit(e: SubmitEvent) {
    e.preventDefault();
    saveErr = null;
    if (!read) return void (mode === 'yamap' && url.trim() && !loading && load());
    needName = !name.trim();
    if (needName) return;
    const figs = badFigures();
    if (figs.length) return void (saveErr = pick(S.errFigures, L).replace('{f}', figs.join(L === 'en' ? ', ' : '・')));
    const f = fields();
    if (existing(f.ref)) return;
    const r = hikes.save(f, edit ? null : track, edit?.id);
    if ('why' in r) return void (saveErr = pick(S[SAVE_ERR[r.why]], L));
    open = false;
    onsaved(r.id);
  }
</script>

{#snippet footer()}
  {#if read}
    <button type="submit" form="{uid}-f" class="btn" data-hike-save data-sfx="confirm">{pick(S.save, L)}</button>
  {:else if mode === 'yamap'}
    <button type="submit" form="{uid}-f" class="btn" aria-disabled={url.trim() && !loading ? undefined : 'true'} aria-busy={loading || undefined} data-hike-load data-sfx="confirm">
      {#if loading}<span class="spin" aria-hidden="true"></span>{pick(S.loading, L)}{:else}{pick(S.load, L)}{/if}
    </button>
  {/if}
{/snippet}

<Sheet bind:open title={pick(edit ? S.edit : S.add, L)} focusField={!edit && mode !== 'gpx'} {footer} dirty={unsaved} name="hike.form">
  <form class="form" id="{uid}-f" data-hike-form={mode} onsubmit={submit}>
    {#if mode === 'yamap' && !edit}
      <label class="f">
        <span class="fl">{pick(S.fUrl, L)}</span>
        <input class="input" type="text" inputmode="url" enterkeyhint="go" autocomplete="off" autocapitalize="off" spellcheck="false" bind:value={url} data-hike-url data-sfx="none"
          placeholder="https://yamap.com/activities/…" aria-invalid={err ? true : undefined} aria-describedby="{uid}-u" />
        <span class="hint" id="{uid}-u">{pick(S.urlHint, L)}</span>
      </label>
    {:else if mode === 'gpx' && !edit}
      <div class="f">
        <span class="fl">{pick(S.fFile, L)}</span>
        <label class="btn small paper file">
          <input type="file" accept=".gpx,application/gpx+xml,application/xml,text/xml" data-hike-file data-sfx="none" onchange={pickFile} />
          {picked || pick(S.pickFile, L)}
        </label>
      </div>
    {/if}
    {#if err}
      <p class="err" role="alert" data-hike-error><Phrases text={err} /></p>
      {#if notFound}<button type="button" class="text-link" data-hike-use-gpx data-sfx="tick" onclick={() => ((open = false), onswitch('gpx'))}>{pick(S.useGpx, L)}</button>{/if}
    {/if}

    {#if read}
      {#if prep}<ElevCard {prep} />{/if}
      <label class="f">
        <span class="fl">{pick(S.fName, L)}<b class="req">{pick(S.required, L)}</b></span>
        <input class="input" type="text" enterkeyhint="done" maxlength={HIKE_NAME} bind:value={name} oninput={() => (needName = false)} aria-required="true" data-hike-field="name" data-sfx="none"
          aria-invalid={needName || undefined} aria-describedby="{uid}-n" />
        {#if needName}<span class="err" id="{uid}-n" role="alert">{pick(S.needName, L)}</span>{:else if mode !== 'manual'}<span class="hint" id="{uid}-n">{pick(S.nameCheck, L)}</span>{/if}
      </label>
      <div class="f">
        <span class="fl">{pick(S.fStatus, L)}<b class="req">{pick(S.required, L)}</b></span>
        <Segmented items={STATUS} value={status} label={pick(S.fStatus, L)} attr="hike-status" onpick={(v) => (status = v)} />
      </div>
      <div class="two">
        <label class="f">
          <span class="fl">{pick(S.fArea, L)}</span>
          <input class="input" type="text" enterkeyhint="done" maxlength={HIKE_AREA} bind:value={area} data-hike-field="area" data-sfx="none" />
        </label>
        <label class="f">
          <span class="fl">{pick(S.fDate, L)}</span>
          <span class="pair">
            <input class="input" type="date" bind:value={date} data-hike-field="date" data-sfx="none" />
            {#if date}<button type="button" class="chip s" data-sfx="tick" onclick={() => (date = '')}>{pick(S.clear, L)}</button>{/if}
          </span>
        </label>
      </div>
      {#if typed}
        <div class="three">
          <label class="f">
            <span class="fl">{pick(S.statDist, L)}</span>
            <span class="unit"><input class="input num" type="text" inputmode="decimal" bind:value={km} data-hike-field="km" data-sfx="none" />km</span>
          </label>
          <label class="f">
            <span class="fl">{pick(S.statGain, L)}</span>
            <span class="unit"><input class="input num" type="text" inputmode="numeric" bind:value={gain} data-hike-field="gain" data-sfx="none" />m</span>
          </label>
        </div>
      {:else}
        <dl class="card dense figs" data-hike-figs>
          <div class="row kv"><dt>{pick(S.statDist, L)}</dt><dd>{km ? fmtKm(+km) : '—'}</dd></div>
          <div class="row kv"><dt>{pick(S.statGain, L)}</dt><dd>{gain ? fmtM(+gain) : '—'}</dd></div>
          {#if mode === 'yamap'}<div class="row kv"><dt>{pick(S.statTime, L)}</dt><dd>{hh || mm ? `${hh || 0}:${(mm || '0').padStart(2, '0')}` : '—'}</dd></div>{/if}
        </dl>
      {/if}
      {#if mode !== 'yamap'}
        <div class="f">
          <span class="fl">{pick(S.statTime, L)}</span>
          <span class="unit">
            <input class="input num" type="text" inputmode="numeric" maxlength="2" bind:value={hh} aria-label="{pick(S.statTime, L)}（{pick(S.fHours, L)}）" data-hike-field="hours" data-sfx="none" />{pick(S.fHours, L)}
            <input class="input num" type="text" inputmode="numeric" maxlength="2" bind:value={mm} aria-label="{pick(S.statTime, L)}（{pick(S.fMins, L)}）" data-hike-field="mins" data-sfx="none" />{pick(S.fMins, L)}
          </span>
        </div>
      {/if}
      <label class="f">
        <span class="fl">{pick(S.fNotes, L)}</span>
        <textarea class="input notes" rows="3" maxlength={HIKE_NOTES} bind:value={notes} data-hike-field="notes" data-sfx="none"></textarea>
      </label>
      {#if saveErr}<p class="err" role="alert" data-hike-save-error><Phrases text={saveErr} /></p>{/if}
    {/if}
  </form>
</Sheet>

<style>
  .form { display: grid; gap: 14px; padding-bottom: 4px; }
  .f { display: grid; gap: 6px; min-width: 0; }
  .fl { font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); letter-spacing: .03em; padding-left: 4px; }
  .req { margin-left: 6px; color: var(--coral-text); }
  .hint { font-size: var(--fs-s); color: var(--text-soft); padding-left: 4px; }
  .err { margin: 0; font-size: var(--fs-s); color: var(--coral-text); padding-left: 4px; }
  .text-link { justify-self: start; }
  .two, .three { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .pair, .unit { display: flex; gap: 6px; align-items: center; min-width: 0; }
  .pair input { flex: 1; min-width: 0; }
  .unit { font: 600 var(--fs-body)/1 var(--font-num); color: var(--text-soft); }
  .unit .num { flex: 1; min-width: 0; max-width: 96px; }
  input[type='date'] { display: block; text-align: start; -webkit-appearance: none; appearance: none; }
  .notes { resize: vertical; min-height: 84px; font: 400 var(--fs-input)/1.45 var(--font-body); }
  .figs { margin: 0; }
  .figs dd { margin: 0; font-weight: 600; }
  .file { position: relative; justify-content: flex-start; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .file input { position: absolute; inset: 0; opacity: 0; cursor: pointer; font-size: 16px; }
  .spin { width: 18px; height: 18px; border-radius: 50%; border: 2.5px solid currentColor; border-right-color: transparent; animation: spin .8s linear infinite; }
  @keyframes spin { to { transform: rotate(1turn); } }
  @media (max-width: 359px) { .two { grid-template-columns: 1fr; } }
</style>
