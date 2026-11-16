<script lang="ts">
  // English Study's home (docs/english.md "The page"): 今日の動画 (the first clip in order not finished; 別の動画にする
  // the next), the week's block, the library (every clip, ✓ once finished). ⚙: 報告した内容. After 7+ days away, once:
  // おかえりなさい.
  import { onMount, untrack } from 'svelte';
  import NavBar from '#lib/components/ui/NavBar.svelte';
  import NavButton from '#lib/components/ui/NavButton.svelte';
  import WeekProgress from './WeekProgress.svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import { localDateAt } from '#lib/time/dates.ts';
  import { LIBRARY as CLIPS, prefetch } from '../data.ts';
  import { away, studyOf, weekView } from '../progress.ts';
  import { backShown, loadSaved, markBack, partWay } from '../session.ts';
  import { skip, skipsOf } from '../prefs.ts';
  import { durText, s } from '../i18n.ts';
  import type { ClipMeta as Clip } from '../catalog.ts';
  import type { Who } from '#lib/types.ts';

  let { onopen, onsettings, onclose }: { onopen: (id: string) => void; onsettings: () => void; onclose: () => void } = $props();

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

  /** 別の動画にする: the clip shown instead of the day's (null: the day's); the one it passed over skipped for 14 days
   *  (prefs.ts), so the day's clip is the first in order neither finished nor skipped. */
  let other = $state<string | null>(null);
  let skipped = $state(untrack(() => skipsOf(me, today)));
  const open = (c: Clip) => !mine.clips.has(c.id);
  const daily = $derived(CLIPS.find((c) => open(c) && !skipped.has(c.id)) ?? CLIPS.find(open) ?? CLIPS[0]);
  const doneToday = $derived(mine.days.has(today));
  /** Done today: the card shows the clip finished today (別の動画にする still offers the next). */
  const todays = $derived(doneToday ? CLIPS.find((c) => c.id === mine.byDay.get(today)) : undefined);
  const shown = $derived<Clip>(CLIPS.find((c) => c.id === other) ?? todays ?? daily);
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

  /** おかえりなさい: shown this opening, once a gap. */
  let back = $state(false);
  onMount(() => {
    const last = mine.last;
    if (last && away(last, today) && !backShown(me, last)) {
      back = true;
      markBack(me, last);
    }
    // today's bank ahead, once home is idle (a lesson then opens with its questions, offline too)
    const idle = (f: () => void) => (typeof requestIdleCallback === 'function' ? requestIdleCallback(f, { timeout: 2000 }) : setTimeout(f, 300));
    idle(() => prefetch([shown]));
  });
  const meta = (c: Clip) => s('meta', { dur: durText(c.dur), band: s(`band.${c.band}`), n: c.n });
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
      <p class="kicker">{doneToday && !other ? s('todayDone') : s('today')}</p>
      <h3>{shown.title}</h3>
      <p class="meta">{shown.credit} · {meta(shown)}</p>
      <button type="button" class="btn" data-sfx="open" data-en-start onclick={() => onopen(shown.id)}>
        {resumes(shown) ? s('resume') : mine.clips.has(shown.id) ? s('again') : s('start')}
      </button>
      {#if CLIPS.length > 1}<button type="button" class="quiet" data-sfx="tick" data-en-other onclick={another}>{s('other')}</button>{/if}
    </article>
    <WeekProgress {view} />
    <h3 class="sec-label">{s('library')}</h3>
    <div class="card dense lib">
      {#each CLIPS as c (c.id)}
        <button type="button" class="row" data-sfx="open" data-en-clip={c.id} data-done={mine.clips.has(c.id) || undefined} onclick={() => onopen(c.id)}>
          <span class="tick" aria-hidden="true">{mine.clips.has(c.id) ? '✓' : ''}</span>
          <span class="name">{c.title}{#if mine.clips.has(c.id)}<span class="sr-only">{s('done')}</span>{/if}</span>
          <span class="len">{durText(c.dur)}</span>
        </button>
      {/each}
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
  .kicker { font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); }
  .today h3 { font: 700 var(--fs-talk)/1.3 var(--font-ui); }
  .meta { font-size: var(--fs-s); color: var(--text-soft); }
  .today .btn { margin-top: 6px; }
  .quiet { appearance: none; border: 0; background: none; color: var(--text-soft); font: inherit; font-size: var(--fs-s); padding: 10px; cursor: pointer; justify-self: center; }
  .lib { flex: none; }
  .lib .row { width: 100%; text-align: left; }
  .tick { flex: none; width: 1.2em; color: var(--c-leaf-text); font-weight: 700; }
  .name { flex: 1; min-width: 0; }
  .len { flex: none; font: 600 var(--fs-s)/1 var(--font-num); color: var(--text-soft); }
</style>
