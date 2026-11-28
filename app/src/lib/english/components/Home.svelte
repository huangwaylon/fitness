<script lang="ts">
  // English Study's home (docs/english.md "The page"): three cards, under 聞けたセリフ's returns when lines are back
  // (ShelfReturn). 今日の動画: the first clip in the shared plan
  // (plan.ts: the library's order) neither finished nor skipped (progress.ts dailyOf: once today's is finished, the
  // next; 別の動画にする shows the next and skips this one for 14
  // days: prefs.ts), its thumbnail, one meta line and
  // the one button (始める, 続きから, もう一度（新しい質問）). 今週 (WeekProgress; これまで N本 › the history level), then
  // これまでの記録's and 聞けたセリフ's rows (always: each says when it's empty). ライブラリ: at most five rows (a play left
  // part-way, a finished clip offered again at most once a week (progress.ts reviewOf), the next clips in order, すべて見る ›
  // the library level). ⚙: 難しめ and 報告した内容. After 7+ days away, once: おかえり. Today's bank (and the
  // next, part-way and offered ones', and フレーズ's deck file) is fetched ahead while idle.
  import { onMount, untrack } from 'svelte';
  import Phrases from '#lib/components/ui/Phrases.svelte';
  import NavBar from '#lib/components/ui/NavBar.svelte';
  import NavButton from '#lib/components/ui/NavButton.svelte';
  import Icon from '#lib/components/ui/Icon.svelte';
  import WeekProgress from './WeekProgress.svelte';
  import ClipRow from './ClipRow.svelte';
  import ShelfReturn from './ShelfReturn.svelte';
  import Thumb from './Thumb.svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import { localDateAt } from '#lib/time/dates.ts';
  import { LIBRARY as CLIPS, metaById, prefetch } from '../data.ts';
  import { away, dailyOf, reviewOf, studyOf, weekView } from '../progress.ts';
  import { backShown, loadSaved, markBack, partWay, partWays } from '../session.ts';
  import { skip, skipsOf } from '../prefs.ts';
  import { cursorOf, shardAt } from '../deck.ts';
  import { heardCount, shelfOf } from '../shelf.ts';
  import { clock, s } from '../i18n.ts';
  import { online } from '#lib/ui-state/online.svelte.ts';
  import type { ClipMeta as Clip } from '../catalog.ts';
  import type { Who } from '#lib/types.ts';

  let { onopen, onlibrary, onhistory, onshelf, onsettings, onclose }: { onopen: (id: string) => void; onlibrary: () => void; onhistory: () => void; onshelf: () => void; onsettings: () => void; onclose: () => void } = $props();

  const m = $derived(week.model);
  const me = $derived<Who>(m?.me ?? 'A');
  const today = $derived(localDateAt(m?.now ?? Date.now()));
  const rows = $derived(m?.state.listen ?? []);
  const mine = $derived(studyOf(rows, me, me));
  const partnerName = $derived.by(() => {
    const v = week.view;
    return v && me !== 'G' ? v.people[me === 'A' ? 'B' : 'A'].villagerName : '';
  });
  const view = $derived(weekView(rows, me, today, partnerName, mine));

  /** 別の動画にする: the clip shown instead of the day's (null: the day's). */
  let other = $state<string | null>(null);
  let skipped = $state(untrack(() => skipsOf(me, today)));
  const open = (c: Clip) => !mine.clips.has(c.id);
  const allDone = $derived(!CLIPS.some(open));
  /** The plan's next clip (done today: the one after it; the finished one again is もう一度's row only). */
  const daily = $derived(dailyOf(CLIPS, mine, skipped)!);
  const doneToday = $derived(mine.days.has(today));
  const shown = $derived<Clip>((other ? metaById(other) : undefined) ?? daily);
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
  /** The clip shown has a play left part-way (続きから). */
  const resumed = $derived(partWay(loadSaved(me, shown.id, shown.v)));

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

  /** おかえり: shown this opening, once a gap. */
  let back = $state(false);
  onMount(() => {
    const last = mine.last;
    if (last && away(last, today) && !backShown(me, last)) {
      back = true;
      markBack(me, last);
    }
    // today's bank, the next one's (tomorrow's, or once today's is done), the part-way and offered ones' and フレーズ's
    // current deck file ahead, once home is idle (their lessons and the tab then open with no wait, offline too)
    prefetch([shown, upNext[0], part?.clip, review], shardAt(me, cursorOf(me)));
  });
  /** 聞けたセリフ's count (lines heard on a return: it only grows). */
  const heard = untrack(() => heardCount(shelfOf(me)));
  const meta = (c: Clip) => [c.show, s(`band.${c.band}`), ...c.tags.slice(0, 1), s('qs', { n: c.n })].join(' · ');
</script>

<section class="screen" data-en-home>
  <div class="top">
    <NavBar pad title={s('title')} {onclose}>
      {#snippet trailing()}<NavButton kind="tool" icon="gear" label={s('settings')} sfx="open" data-en-gear onclick={onsettings} />{/snippet}
    </NavBar>
  </div>
  <div class="body sheet-scroll">
    {#if back}<p class="back" data-en-back><Phrases text={s('back')} /></p>{/if}
    {#key me}<ShelfReturn {me} {today} {onshelf} />{/key}
    <article class="card pad today" data-en-today={shown.id}>
      <Thumb hero video={shown.video} show={shown.show} len={clock(shown.dur)} />
      <p class="kicker">{allDone && !other ? s('allDone') : doneToday && !other ? s('todayDone') : s('today')}{#if doneToday && !other && !allDone}<Icon name="check" size={14} stroke={2.6} />{/if}</p>
      <h3 lang="en">{shown.title}</h3>
      <p class="meta">{meta(shown)}</p>
      <button type="button" class="btn" data-sfx="open" data-en-start onclick={() => onopen(shown.id)}>
        <Icon name="play" />{resumed ? s('resume') : mine.clips.has(shown.id) ? s('again') : s('start')}
      </button>
      {#if !online.current}<p class="meta off" data-en-offline><Phrases text={s('offlineHome')} /></p>{/if}
      {#if CLIPS.length > 1}<button type="button" class="quiet" data-sfx="tick" data-en-other onclick={another}>{s('other')}</button>{/if}
    </article>
    <WeekProgress {view} {onhistory} />
    <div class="card dense hist">
      <button type="button" class="row go" data-sfx="page" data-en-hist-entry onclick={onhistory}>
        <span class="txt"><span class="name">{s('history')}</span><span class="sub">{s('historySub')}</span></span>
        <Icon name="chevron-right" size={22} stroke={2.6} />
      </button>
      <button type="button" class="row go" data-sfx="page" data-en-shelf-entry onclick={onshelf}>
        <span class="txt"><span class="name">{s('shelfTitle')}</span><span class="sub">{s('shelfRowSub')}</span></span>
        <span class="cnt" data-en-shelf-n>{heard}</span>
        <Icon name="chevron-right" size={22} stroke={2.6} />
      </button>
    </div>
    <h3 class="sec-label">{s('library')}</h3>
    <div class="card dense lib" data-en-lib>
      {#if part}<ClipRow clip={part.clip} plays={mine.plays.get(part.clip.id)} part={part} {onopen} />{/if}
      {#if review}<ClipRow clip={review} plays={mine.plays.get(review.id)} again {onopen} />{/if}
      {#each upNext as c (c.id)}<ClipRow clip={c} plays={mine.plays.get(c.id)} {onopen} />{/each}
      <button type="button" class="row all" data-sfx="page" data-en-all onclick={onlibrary}>
        <span class="name">{s('seeAll', { n: CLIPS.length })}</span>
        <Icon name="chevron-right" size={22} stroke={2.6} />
      </button>
    </div>
  </div>
</section>

<style>
  .screen { position: absolute; inset: 0; display: flex; flex-direction: column; background: var(--surface); }
  .top { flex: none; background-color: var(--surface); }
  .body { display: flex; flex-direction: column; gap: 12px; padding: 4px calc(12px + var(--safe-right)) 24px calc(12px + var(--safe-left)); scrollbar-width: none; }
  .back { margin: 0; padding: 10px 14px; border-radius: var(--r-row); background: color-mix(in srgb, var(--c-sky) 22%, var(--c-card)); color: var(--c-ink); font-weight: 700; }
  .today { display: grid; gap: 6px; flex: none; }
  .today p, .today h3 { margin: 0; }
  .today :global(.thumb) { margin-bottom: 4px; }
  .kicker { font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); }
  .today h3 { font: 700 var(--fs-talk)/1.3 var(--font-ui); display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .meta { font-size: var(--fs-s); color: var(--text-soft); }
  .off { text-align: center; }
  .today .btn { margin-top: 6px; }
  .quiet { padding: 0 12px; justify-self: center; }
  .lib, .hist { flex: none; }
  .all, .go { width: 100%; text-align: left; }
  .all .name { flex: 1; min-width: 0; font-weight: 700; }
  .all :global(svg), .go :global(svg) { color: var(--text-soft); }
  .go .txt { flex: 1; min-width: 0; display: grid; gap: 1px; }
  .go .name { font: 700 var(--fs-body)/1.3 var(--font-ui); }
  .go .sub { font-size: var(--fs-s); color: var(--text-soft); }
  .cnt { font: 700 var(--fs-talk)/1 var(--font-num); font-variant-numeric: tabular-nums; color: var(--c-ink); }
  .kicker :global(svg) { margin-left: 4px; vertical-align: -2px; }
</style>
