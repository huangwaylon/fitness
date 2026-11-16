<script lang="ts">
  // English Study's home (docs/english.md "The page"): three cards. 今日の動画: the first clip in the shared plan
  // (plan.ts: the library's order) neither finished nor skipped (別の動画にする shows the next and skips this one for 14
  // days: prefs.ts), its thumbnail, one meta line and
  // the one button (始める, 続きから, もう一度（新しい質問）). 今週 (WeekProgress). ライブラリ: at most five rows (a play left
  // part-way, a finished clip offered again at most once a week (progress.ts reviewOf), the next clips in order, すべて見る ›
  // the library level). ⚙: むずかしめ and 報告した内容. After 7+ days away, once: おかえりなさい. Today's bank (and the
  // part-way and offered ones') is fetched ahead while idle.
  import { onMount, untrack } from 'svelte';
  import NavBar from '#lib/components/ui/NavBar.svelte';
  import NavButton from '#lib/components/ui/NavButton.svelte';
  import WeekProgress from './WeekProgress.svelte';
  import ClipRow from './ClipRow.svelte';
  import Thumb from './Thumb.svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import { localDateAt } from '#lib/time/dates.ts';
  import { LIBRARY as CLIPS, metaById, prefetch } from '../data.ts';
  import { away, reviewOf, studyOf, weekView } from '../progress.ts';
  import { backShown, loadSaved, markBack, partWay, partWays } from '../session.ts';
  import { skip, skipsOf } from '../prefs.ts';
  import { clock, s } from '../i18n.ts';
  import type { ClipMeta as Clip } from '../catalog.ts';
  import type { Who } from '#lib/types.ts';

  let { onopen, onlibrary, onsettings, onclose }: { onopen: (id: string) => void; onlibrary: () => void; onsettings: () => void; onclose: () => void } = $props();

  const m = $derived(week.model);
  const me = $derived<Who>(m?.me ?? 'A');
  const today = $derived(localDateAt(m?.now ?? Date.now()));
  const rows = $derived(m?.state.listen ?? []);
  const mine = $derived(studyOf(rows, me, me));
  const partnerName = $derived.by(() => {
    const v = week.view;
    return v && me !== 'G' ? v.people[me === 'A' ? 'B' : 'A'].villagerName : '';
  });
  const view = $derived(weekView(rows, me, today, partnerName));

  /** 別の動画にする: the clip shown instead of the day's (null: the day's). */
  let other = $state<string | null>(null);
  let skipped = $state(untrack(() => skipsOf(me, today)));
  const open = (c: Clip) => !mine.clips.has(c.id);
  const allDone = $derived(!CLIPS.some(open));
  /** Every clip finished: the one finished longest ago. */
  const oldest = $derived(CLIPS.toSorted((a, b) => ((mine.lastOn.get(a.id) ?? '') < (mine.lastOn.get(b.id) ?? '') ? -1 : 1))[0]);
  const daily = $derived(CLIPS.find((c) => open(c) && !skipped.has(c.id)) ?? CLIPS.find(open) ?? oldest);
  const doneToday = $derived(mine.days.has(today));
  /** Done today: the card shows the clip finished today (別の動画にする still offers the next). */
  const todays = $derived(doneToday ? metaById(mine.byDay.get(today) ?? '') : undefined);
  const shown = $derived<Clip>((other ? metaById(other) : undefined) ?? todays ?? daily);
  /** The next clip after the one shown, the unfinished first (in order, round). */
  function nextAfter(id: string): string {
    const i = CLIPS.findIndex((c) => c.id === id);
    const after = [...CLIPS.slice(i + 1), ...CLIPS.slice(0, i)];
    return (after.find((c) => open(c) && !skipped.has(c.id)) ?? after.find(open) ?? after[0] ?? CLIPS[0]).id;
  }
  function another(): void {
    const was = shown;
    other = nextAfter(was.id);
    if (open(was)) {
      skip(me, was.id, today);
      skipped = skipsOf(me, today);
    }
  }
  const resumes = (c: Clip) => partWay(loadSaved(me, c.id, c.v));

  /** The library card: the latest play left part-way (not the one on today's card), then the next unfinished in order. */
  const saved = untrack(() => partWays(me));
  const part = $derived.by(() => {
    const p = saved.find((x) => x.id !== shown.id && metaById(x.id)?.v === x.v);
    return p ? { clip: metaById(p.id)!, at: p.at, n: p.n } : null;
  });
  /** もう一度: a finished clip with new questions, beside today's (never in its place). */
  const review = $derived.by(() => {
    const id = reviewOf(mine, today, CLIPS, new Set([shown.id, daily.id, part?.clip.id ?? '']));
    return id ? metaById(id) : undefined;
  });
  const upNext = $derived.by(() => {
    const i = CLIPS.findIndex((c) => c.id === shown.id);
    return [...CLIPS.slice(i + 1), ...CLIPS.slice(0, i)].filter((c) => open(c) && !skipped.has(c.id) && c.id !== part?.clip.id).slice(0, Math.min(3, 4 - +!!part - +!!review));
  });

  let online = $state(typeof navigator === 'undefined' || navigator.onLine !== false);
  /** おかえりなさい: shown this opening, once a gap. */
  let back = $state(false);
  onMount(() => {
    const last = mine.last;
    if (last && away(last, today) && !backShown(me, last)) {
      back = true;
      markBack(me, last);
    }
    // today's bank and the part-way one's ahead, once home is idle (their lessons then open with the questions, offline too)
    const idle = (f: () => void) => (typeof requestIdleCallback === 'function' ? requestIdleCallback(f, { timeout: 2000 }) : setTimeout(f, 300));
    idle(() => prefetch([shown, part?.clip, review]));
    const on = () => (online = true), off = () => (online = false);
    addEventListener('online', on);
    addEventListener('offline', off);
    return () => (removeEventListener('online', on), removeEventListener('offline', off));
  });
  const meta = (c: Clip) => [c.show, s(`band.${c.band}`), ...c.tags.slice(0, 1), s('qs', { n: c.n })].join(' · ');
</script>

<section class="screen" data-en-home>
  <div class="top">
    <NavBar pad title={s('title')} {onclose}>
      {#snippet trailing()}<NavButton kind="tool" icon="gear" label={s('settings')} sfx="open" data-en-gear onclick={onsettings} />{/snippet}
    </NavBar>
  </div>
  <div class="body sheet-scroll">
    {#if back}<p class="back" data-en-back>{s('back')}</p>{/if}
    <article class="card pad today" data-en-today={shown.id}>
      <Thumb hero video={shown.video} show={shown.show} len={clock(shown.dur)} />
      <p class="kicker">{doneToday && !other ? s('todayDone') : allDone && !other ? s('allDone') : s('today')}</p>
      <h3 lang="en">{shown.title}</h3>
      <p class="meta">{meta(shown)}</p>
      <button type="button" class="btn" data-sfx="open" data-en-start onclick={() => onopen(shown.id)}>
        {resumes(shown) ? s('resume') : mine.clips.has(shown.id) ? s('again') : s('start')}
      </button>
      {#if !online}<p class="meta off" data-en-offline>{s('offlineHome')}</p>{/if}
      {#if CLIPS.length > 1}<button type="button" class="quiet" data-sfx="tick" data-en-other onclick={another}>{s('other')}</button>{/if}
    </article>
    <WeekProgress {view} />
    <h3 class="sec-label">{s('library')}</h3>
    <div class="card dense lib" data-en-lib>
      {#if part}<ClipRow clip={part.clip} plays={mine.plays.get(part.clip.id)} part={part} {onopen} />{/if}
      {#if review}<ClipRow clip={review} plays={mine.plays.get(review.id)} again {onopen} />{/if}
      {#each upNext as c (c.id)}<ClipRow clip={c} plays={mine.plays.get(c.id)} {onopen} />{/each}
      <button type="button" class="row all" data-sfx="page" data-en-all onclick={onlibrary}>
        <span class="name">{s('seeAll', { n: CLIPS.length })}</span>
        <svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
      </button>
    </div>
  </div>
</section>

<style>
  .screen { position: absolute; inset: 0; display: flex; flex-direction: column; background: var(--surface); }
  .top { flex: none; background-color: var(--surface); }
  .body { display: flex; flex-direction: column; gap: 12px; padding: 4px calc(12px + var(--safe-right)) calc(var(--safe-bottom) + 24px) calc(12px + var(--safe-left)); scrollbar-width: none; }
  .back { margin: 0; padding: 10px 14px; border-radius: var(--r-row); background: color-mix(in srgb, var(--c-sky) 22%, var(--c-card)); color: var(--c-ink); font-weight: 700; }
  .today { display: grid; gap: 6px; flex: none; }
  .today p, .today h3 { margin: 0; }
  .today :global(.thumb) { margin-bottom: 4px; }
  .kicker { font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); }
  .today h3 { font: 700 var(--fs-talk)/1.3 var(--font-ui); display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .meta { font-size: var(--fs-s); color: var(--text-soft); }
  .off { text-align: center; }
  .today .btn { margin-top: 6px; }
  .quiet { appearance: none; border: 0; background: none; color: var(--text-soft); font: inherit; font-size: var(--fs-s); min-height: var(--hit); padding: 0 12px; cursor: pointer; justify-self: center; }
  .lib { flex: none; }
  .all { width: 100%; text-align: left; }
  .all .name { flex: 1; min-width: 0; font-weight: 700; }
  .chev { flex: none; width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; color: var(--text-soft); }
</style>
