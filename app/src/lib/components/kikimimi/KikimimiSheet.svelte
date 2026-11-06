<script lang="ts">
  // ききみみ クイズ's sheet (docs/kikimimi.md "UI"), its own chunk with the bank, the deck, the session and the strings:
  // full height (Sheet's `pop`), one title bar (the game's name, or the question 3 / 8; ✕) over one scroller showing
  // the game's phase: a notice (the host cancelled), the invite or my own lobby (idle), the lobby, よーい 3-2-1, a
  // question (Play), the results. Opened from せってい's あそぶ (a lobby of mine at once, unless someone's invite is
  // waiting) or the banner's さんか (that game joined). Mid-game a backdrop tap or Esc doesn't close it, and ✕ asks
  // 「やめる？」. The voice session is the opener's tap's (invite.svelte.ts openQuiz); closing ends it and drops every clip.
  import { untrack } from 'svelte';
  import '#lib/i18n/kikimimi.ts';
  import Sheet from '../ui/Sheet.svelte';
  import NavBar from '../ui/NavBar.svelte';
  import Host from '../characters/Host.svelte';
  import Lobby from './Lobby.svelte';
  import Play from './Play.svelte';
  import Results from './Results.svelte';
  import LessonIntro from './LessonIntro.svelte';
  import PathCard from './path/PathCard.svelte';
  import { QuizGame, unitFor } from './game.svelte.ts';
  import { currentPath, currentReport, currentUnits, recentGames, recordGame, unitAdded } from './progress.svelte.ts';
  import { rechecksDue } from '#lib/kikimimi/stamps.ts';
  import type { Filter } from '#lib/kikimimi/path.ts';
  import type { Item } from '#lib/kikimimi/bank.ts';
  import { practiceFor } from '#lib/kikimimi/report.ts';
  import type { Focus } from '#lib/kikimimi/srs.ts';
  import type { Rec } from '#lib/kikimimi/advice.ts';
  import { heardQuiz, quizLive } from './invite.svelte.ts';
  import { levelMark, type Level } from '#lib/kikimimi/bank.ts';
  import { addUnit, itemOf, load, loadIds } from '#lib/kikimimi/pool.ts';
  import { tierFor, type Lesson, type UnitPlay } from '#lib/kikimimi/lesson.ts';
  import { LEVELS } from '#lib/kikimimi/deck.ts';
  import { TIMERS, type QuizPhase, type QuizTimer } from '#lib/kikimimi/session.ts';
  import { voice, voiceSession } from '#lib/sound/sound.svelte.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { villagerNameOf } from '#lib/ui-state/viewer.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { DEVICE, localKV } from '#lib/sync/storage.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { t } from '#lib/i18n/index.ts';
  import { hook, hooksOn } from '../island/devHooks.ts';

  let { open = $bindable(), join = null }: { open: boolean; join?: string | null } = $props();

  let game = $state.raw<QuizGame | null>(null);
  /** ✕ (or a backdrop tap, Esc) mid-game: 「やめる？」. */
  let asking = $state(false);
  const v = $derived(game?.view ?? null);
  const MID: readonly QuizPhase[] = ['countdown', 'lead', 'play', 'answer', 'reveal'];
  const mid = $derived(!!v && MID.includes(v.phase));
  /** In a lobby (a boolean: the view itself is a new object at each refresh, about once a second, and what hangs off
   *  the lobby (the report, the path) is folded again only when this changes). */
  const inLobby = $derived(v?.phase === 'lobby');
  /** A unit's lesson on this phone (its intro card in the lobby; its name over the game). */
  const lesson = $derived(game?.lesson ?? null);
  /** The pages pushed over my lobby (docs/kikimimi-ux.md §5's one stack, until the hub): しまの みち › a unit, and the
   *  ずかん. ‹ pops one; ✕ closes the sheet; a lesson's intro card and its game sit over them, and a lesson's おわる comes
   *  back to them. */
  type Page = { k: 'path' } | { k: 'unit'; id: string } | { k: 'zukan'; unit: string | null };
  let pages = $state<Page[]>([]);
  const page = $derived(pages.at(-1) ?? null);
  /** A page shows over my own lobby only (solo: co-op lessons wait for framework 8c). */
  const paged = $derived(!!page && inLobby && !lesson && !!v?.local && !!v.amHost);
  let pathFilter = $state<Filter>('all');
  const path = $derived(inLobby ? currentPath(pathFilter) : null);
  const pageTitle = (p: Page) =>
    p.k === 'path' ? t('kiki.path.title') : p.k === 'zukan' ? t('kiki.zukan.title') : (path?.stages.flatMap((s) => s.stops).find((s) => s.id === p.id)?.name ?? t('kiki.path.title'));
  const title = $derived(
    v?.phase === 'results' ? t('kiki.results') : v && v.i >= 0 && v.i < v.n && mid ? t('kiki.q', { i: v.i + 1, n: v.n })
      : lesson ? (lesson.recheck ? t('kiki.lesson.recheck') : t(`kiki.lesson.${lesson.lesson}`)) : paged && page ? pageTitle(page) : t('kiki.title')
  );
  const push = (p: Page) => (pages = [...pages, p]);
  function back() {
    if (lesson) game?.dropLesson();
    else pages = pages.slice(0, -1);
  }
  const due = $derived(paged ? rechecksDue(currentUnits(), currentReport()?.today ?? '') : []);

  /** The level last played on this phone (the next lobby's). */
  const lastLv = (): Level => {
    const n = Number(localKV()?.getItem(DEVICE.kikimimiLv));
    return LEVELS.find((lv) => lv === n) ?? 1;
  };
  function keepLv(lv: Level) {
    try {
      localKV()?.setItem(DEVICE.kikimimiLv, String(lv));
    } catch {
      /* full or private: the next lobby starts at level 1 */
    }
  }
  /** こたえる じかん last set on this phone (the next lobby's; 30 s by default). */
  const lastTimer = (): QuizTimer => {
    const raw = localKV()?.getItem(DEVICE.kikimimiTimer);
    return TIMERS.find((x) => raw !== null && raw !== undefined && x === Number(raw)) ?? 30;
  };
  function keepTimer(timer: QuizTimer) {
    try {
      localKV()?.setItem(DEVICE.kikimimiTimer, String(timer));
    } catch {
      /* full or private: the next lobby's is 30 s */
    }
  }

  // Each opening: a game of its own (what the island heard handed to it), joined or opened (mine: on this phone till
  // みんなを さそう); closing leaves it. Who I am may come a moment after the sheet (the week's first load). The game
  // begins once the chunks it starts on are in (pool.ts): the remembered level's and those of the lobbies heard.
  const me = $derived(week.view?.viewer);
  $effect(() => {
    if (!open || !me) return;
    const who = me, joining = untrack(() => join);
    let g: QuizGame | null = null, gone = false;
    void load(...heardQuiz().flatMap((m) => (m.op === 'open' ? [unitFor(m.seed, m.lv as Level)] : [])), lastLv())
      .catch(() => {}) // (offline with a chunk never fetched: the game waits for it as it would for a heard one)
      .then(() => {
        if (gone) return;
        const it = new QuizGame({ live: quizLive(), me: who, fast: hook('kikimimi') === 'fast', heard: heardQuiz(), record: (row) => recordGame(who, row) });
        g = it;
        untrack(() => {
          if (joining) it.join(joining);
          else if (!it.view.invite) it.open(lastLv(), false, false, false, lastTimer());
        });
        game = it;
        // (tests: `deck(ids)` starts my lobby kept alone on these items, as にがて れんしゅう does: a dialogue before its clips)
        if (hooksOn())
          (window as unknown as { __kiki?: unknown }).__kiki = {
            view: () => it.view, right: () => it.items[it.view.i]?.answer ?? -1, items: () => it.items.map((x) => x.id),
            deck: (ids: string[]) => loadIds(ids).then(() => it.practice(ids.map(itemOf).filter((x) => !!x))),
            talk: () => it.talk,
            // (a fixture unit put in from the bank's items, as if its chunk were the build's: the units' e2e)
            unit: (unit: UnitPlay, ids: string[]) => loadIds(ids).then(() => {
              addUnit(unit.id, { unit, items: ids.map(itemOf).filter((x) => !!x) });
              unitAdded();
            }),
            lesson: () => it.lesson && { u: it.lesson.unit.id, lesson: it.lesson.lesson, tier: it.lesson.tier ?? null },
            recorded: () => it.recorded
          };
      });
    return () => {
      gone = true;
      g?.dispose();
      if (hooksOn()) delete (window as unknown as { __kiki?: unknown }).__kiki;
      game = null;
      asking = false;
      pages = [];
    };
  });
  // The voice session the opening tap began ends as the sheet closes (a game or not).
  $effect(() => {
    if (open) return () => voiceSession(false);
  });

  // Its open and close tunes (it mounts on the first tap, already open: that is an open too).
  let wasOpen = false;
  $effect(() => {
    const o = open;
    if (o === wasOpen) return;
    wasOpen = o;
    cue(o ? 'panel-open' : 'panel-close');
  });

  /** ✕: mid-game asks first; otherwise closes (my lobby is cancelled for everyone: the session's leave). */
  function requestClose() {
    if (mid) {
      cue('tick');
      asking = true;
    } else {
      cue('back');
      open = false;
    }
  }
  const dismiss = (): boolean => {
    if (!mid) return true;
    asking = true;
    return false;
  };
  function quit() {
    asking = false;
    open = false;
  }
  function closed() {
    if (toasts.current) toasts.dismiss();
  }
  /** Play again: the host opens a new lobby at the same level (the others invited again if they were); another goes
   *  back to the invite (the host's next). */
  function again() {
    if (!game || !v) return;
    // a lesson: again at once (a チェック retried as often as wanted; never locks), a new deal
    const ls = game.lesson;
    if (ls && v.local) {
      relesson(ls.unit.id, ls.lesson, ls.recheck, true);
      return;
    }
    const host = v.amHost, lv = v.lv, same = v.same, vs = v.vs, ladder = v.ladder, timer = v.timer, shared = !v.local, practicing = game.practicing;
    game.close();
    if (host || !game.view.invite) {
      game.open(lv as Level, same, vs, ladder, timer);
      if (host && shared) game.invite();
      else if (practicing === 'weak') practice();
    }
  }
  /** A lesson after a lesson's results (もういっかい, the strip's つぎは): a new lobby of mine with that lesson's deck at
   *  my tier; `now`: straight into it (もういっかい), else its intro card. */
  function relesson(unit: string, l: Lesson, recheck = false, now = false) {
    if (!game || !v) return;
    const timer = v.timer;
    game.close();
    game.open(lastLv(), false, false, false, timer);
    const level = currentReport()?.stats.level ?? null;
    game.playLesson(unit, l, { tier: (stage) => tierFor(level, stage), recheck });
    if (now) game.go();
  }
  /** おわる: a lesson's goes back to the page it came from (the unit's, the path's), a game's closes the sheet. */
  function done() {
    if (game?.lesson && v?.local && pages.length) {
      game.close();
      game.open(lastLv(), false, false, false, v.timer);
    } else open = false;
  }
  /** はまべ's stop on the path: the quick quiz at はまべ, back in the lobby. */
  function quickQuiz() {
    pages = [];
    if (!game || !v) return;
    const lv: Level = v.lv === 2 ? 2 : 1;
    game.configure({ lv, ladder: false });
    keepLv(lv);
  }
  /** The ずかん's phrase review: those items as a solo deck at once (recorded as practice). */
  function reviewPhrases(items: Item[]) {
    if (!game || !v?.amHost || !v.local) return;
    if (v.ladder) game.configure({ ladder: false });
    game.practice(items, 'weak');
  }
  /** まちがえた もんだいを もういちど: the last game's misses as a solo deck (a lobby of mine kept alone: nothing on the
   *  wire), its reveals untimed as every reveal, recorded as practice. */
  function replayMissed() {
    if (!game || !v) return;
    const missed = game.items.filter((it, i) => v.answers[i]?.k !== it.answer);
    if (!missed.length) return;
    const lv = v.lv, timer = v.timer;
    game.close();
    game.open(lv as Level, false, false, false, timer);
    game.practice(missed, 'missed');
  }
  /** にがて れんしゅう: my lobby kept alone starts with a deck of my weak spots (`focus`: a recommendation's). */
  function practice(focus: Focus = null) {
    const r = currentReport();
    if (!game || !r) return;
    if (game.view.ladder) game.configure({ ladder: false }); // (a quiz's: from a recommendation in スピード はしご's lobby)
    const g = game;
    void practiceFor(r, LEVELS, g.view.seed, focus, recentGames()).then((items) => g.practice(items, 'weak'), () => {});
  }
  /** The lobby's tab: あそぶ or きろく (back to あそぶ whenever the lobby is left). */
  let tab = $derived.by<'play' | 'record'>(() => (void inLobby, 'play'));
  const report = $derived(tab === 'record' && inLobby ? currentReport() : null);
  /** A recommendation's start: a level's game, or にがて れんしゅう narrowed to its skill or accent. */
  function startRec(r: Rec) {
    if (!game || !v?.amHost || !v.local) return;
    tab = 'play';
    if (r.kind === 'level') {
      game.configure({ lv: r.lv, ladder: false });
      keepLv(r.lv);
      game.go();
    } else if (r.kind === 'speed') {
      game.configure({ ladder: true });
      game.go();
    } else practice(r.kind === 'skill' || r.kind === 'try' ? { skill: r.skill } : r.kind === 'accent' ? { accent: r.accent } : null);
  }
  /** A unit's lesson from the list: my lobby (a quiz's) takes its deck, at my tier (my comfortable level against the
   *  unit's stage), and shows its intro card. */
  function startLesson(unit: string, l: Lesson, recheck: boolean) {
    if (!game || !v?.amHost || !v.local) return;
    if (v.ladder) game.configure({ ladder: false });
    const level = currentReport()?.stats.level ?? null;
    game.playLesson(unit, l, { tier: (stage) => tierFor(level, stage), recheck });
  }
  function startOwn() {
    game?.open(lastLv(), false, false, false, lastTimer());
  }
  const hostName = (w: 'A' | 'B' | 'G') => (week.view ? villagerNameOf(week.view, w) : '');
  /** The countdown (WINDOWS.countdown, 4 s): 「よーい」 for its first second (4), then 3-2-1. */
  const count = $derived(v && v.phase === 'countdown' ? Math.max(1, Math.ceil((v.until - game!.now) / 1000)) : 0);
</script>

<Sheet bind:open label={t('kiki.title')} variant="pop" onclose={closed} ondismiss={dismiss}>
  <div class="titlebar"><NavBar {title} onback={paged || (lesson && v?.phase === 'lobby' && pages.length) ? back : null} onclose={requestClose} sfx="self" /></div>
  <div class="kk-body" data-kikimimi data-phase={v?.phase} data-host={v?.amHost || undefined}>
    {#if game && v}
      {#if v.notice}
        <div class="center" data-kiki-notice={v.notice}>
          <Host pose="bow" size={96} />
          <p class="say">{t(`kiki.notice.${v.notice}`)}</p>
          <button type="button" class="btn small" data-sfx="back" onclick={() => game?.close()}>{t('kiki.back')}</button>
        </div>
      {:else if v.phase === 'idle'}
        <div class="center idle">
          <Host size={96} />
          {#if v.invite}
            <div class="invite card" data-kiki-invite={v.invite.g}>
              <p class="say">{t('kiki.invited', { name: hostName(v.invite.host) })}<small>{#if v.invite.ladder}{t('kiki.mode.ladder')}{:else}{levelMark(v.invite.lv)} {t(`kiki.lv.${v.invite.lv}`)}{/if}{#if v.invite.started} · {t('kiki.started')}{/if}</small></p>
              <button type="button" class="btn" data-kiki-join data-sfx="confirm" onclick={() => game?.join(v.invite!.g)}>{t('kiki.joinIt')}</button>
            </div>
          {/if}
          <button type="button" class="btn paper" data-kiki-own data-sfx="open" onclick={startOwn}>{t('kiki.openOwn')}</button>
        </div>
      {:else if paged && page}
        {#if page.k === 'path' && path}
          {#await import('./path/IslandPath.svelte') then { default: IslandPath }}
            <IslandPath {path} bind:filter={pathFilter} {due} onunit={(id) => push({ k: 'unit', id })} onlesson={(id, l, re) => startLesson(id, l, !!re)}
              onquiz={quickQuiz} onzukan={() => push({ k: 'zukan', unit: null })} />
          {/await}
        {:else if page.k === 'unit'}
          {#await import('./path/UnitPage.svelte') then { default: UnitPage }}
            {#key page.id}<UnitPage id={page.id} onlesson={(id, l) => startLesson(id, l, false)} onzukan={(unit) => push({ k: 'zukan', unit })} />{/key}
          {/await}
        {:else if page.k === 'zukan'}
          {#await import('./path/PhraseZukan.svelte') then { default: PhraseZukan }}
            <PhraseZukan unit={page.unit} onreview={reviewPhrases} />
          {/await}
        {/if}
      {:else if v.phase === 'lobby' && lesson}
        <LessonIntro unit={lesson.unit} lesson={lesson.lesson} recheck={lesson.recheck} onstart={() => game?.go()} onback={() => game?.dropLesson()} />
      {:else if v.phase === 'lobby'}
        <div class="tabs" role="tablist" aria-label={t('kiki.title')}>
          {#each ['play', 'record'] as const as k (k)}
            <button type="button" role="tab" class="tab" aria-selected={tab === k} data-kiki-tab={k} data-sfx={tab === k ? 'none' : 'tick'} onclick={() => (tab = k)}>{t(`kiki.tab.${k}`)}</button>
          {/each}
        </div>
        {#if tab === 'record'}
          {#await import('./Progress.svelte') then { default: Progress }}
            {#if report}<Progress {report} guest={week.guest} canStart={v.amHost && v.local} onstart={startRec} onplay={() => (tab = 'play')} />{/if}
          {/await}
        {:else}
          {#if path && path.stages.some((s) => s.stops.length) && v.amHost}<PathCard {path} solo={v.local} onopen={() => push({ k: 'path' })} />{/if}
          <Lobby {game} onlevel={keepLv} ontimer={keepTimer} onpractice={() => practice()} />
        {/if}
      {:else if v.phase === 'countdown'}
        <div class="center count" data-kiki-count={count}>
          <Host pose="stand" size={110} />
          <p class="say">{t('kiki.ready')}</p>
          {#key count}<span class="num" class:set={count > 3} aria-live="assertive">{count > 3 ? t('kiki.set') : count}</span>{/key}
        </div>
      {:else if v.phase === 'results'}
        <Results {game} onagain={again} onmissed={replayMissed} ondone={done} onnext={(l) => game?.lesson && relesson(game.lesson.unit.id, l)} />
      {:else}
        <Play {game} />
      {/if}
    {/if}
  </div>

  {#if asking}
    <div class="veil" role="alertdialog" aria-modal="true" aria-labelledby="kk-quit" data-kiki-quit>
      <div class="ask card">
        <h3 id="kk-quit">{t('kiki.quit')}</h3>
        <p>{t('kiki.quitBody')}</p>
        <div class="row">
          <!-- つづける the primary (the safe choice), やめる the paper one -->
          <button type="button" class="btn paper small" data-kiki-quit-yes data-sfx="back" onclick={quit}>{t('kiki.quitYes')}</button>
          <button type="button" class="btn small" data-kiki-stay data-sfx="confirm" onclick={() => (asking = false)}>{t('kiki.quitNo')}</button>
        </div>
      </div>
    </div>
  {:else if voice.on && voice.state !== 'running'}
    <!-- a lock or an app switch suspended the voice: a tap wakes it (inside the tap) -->
    <button type="button" class="veil resume" data-kiki-resume data-sfx="tick" onclick={() => voiceSession(true)}>
      <span class="ask card">
        <Host head size={52} animate={false} eager />
        <b>{t('kiki.resume')}</b>
        <small>{t('kiki.resumeBody')}</small>
      </span>
    </button>
  {/if}
</Sheet>

<style>
  .titlebar { flex: none; position: relative; z-index: 2; margin-bottom: 4px; }
  .titlebar::after {
    content: ''; position: absolute; left: -8px; right: -8px; top: 100%; height: 14px; pointer-events: none;
    background: linear-gradient(var(--surface), transparent);
  }
  /* the one scroller (as the other full-height sheets'): it bleeds 8px past the side padding so focus rings and lips show */
  .kk-body {
    flex: 1; min-height: 0; overflow: hidden auto; overscroll-behavior: contain;
    margin: 0 -8px; padding: 6px 8px var(--body-pad); display: flex; flex-direction: column; gap: 14px;
  }
  .kk-body > :global(*) { flex: none; }
  /* a level's actions stay at the foot of the screen, even on a short phase */
  .kk-body > :global(.level-acts) { margin-top: auto; }
  .center { display: grid; justify-items: center; align-content: center; gap: 14px; flex: 1 0 auto; text-align: center; padding: 12px 0; }
  .say { margin: 0; font: 700 var(--fs-talk)/1.4 var(--font-ui); }
  .say small { display: block; margin-top: 4px; font-size: var(--fs-s); color: var(--text-soft); }
  .idle .btn { width: 100%; }
  .invite { width: 100%; display: grid; gap: 12px; padding: 16px; box-sizing: border-box; }
  .num {
    font: 700 96px/1 var(--font-num); color: var(--coral-text); text-shadow: 0 4px 0 var(--lip);
    animation: count 900ms var(--ease-bounce) both;
  }
  /* 「よーい」: a word, not a digit (the same line's height, so 3 doesn't jump) */
  .num.set { font: 700 56px/96px var(--font-ui); }
  @keyframes count { from { transform: scale(1.6); opacity: 0; } 30% { opacity: 1; } to { transform: none; } }

  .veil {
    position: absolute; inset: 0; z-index: 5; display: grid; place-items: center; padding: 24px; border: 0; margin: 0;
    background: var(--scrim); appearance: none; font: inherit; color: inherit; width: 100%;
  }
  .veil .ask { display: grid; justify-items: center; gap: 10px; padding: 20px 18px 16px; width: min(100%, 320px); box-sizing: border-box; text-align: center; color: var(--text); }
  .ask h3 { margin: 0; font: 700 var(--fs-title)/1.2 var(--font-ui); }
  .ask p { margin: 0; font: 700 var(--fs-body)/1.4 var(--font-ui); color: var(--text-soft); }
  .ask .row { display: flex; gap: 10px; width: 100%; }
  .ask .row .btn { flex: 1; }
  .resume { cursor: pointer; }
  /* the lobby's two tabs: a segmented pair (the chosen one yuzu, as a level's) */
  .tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 4px; border-radius: var(--r-pill); background: var(--ctl-off); }
  .tab {
    appearance: none; border: 0; cursor: pointer; min-height: var(--hit); border-radius: var(--r-pill); background: transparent;
    color: var(--text-soft); font: 700 var(--fs-body)/1 var(--font-ui);
  }
  .tab[aria-selected='true'] { background: var(--ctl-sel); color: var(--c-ink); box-shadow: var(--sh-ctl); }
  .resume b { font: 700 var(--fs-talk)/1.2 var(--font-ui); }
  .resume small { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  @media (prefers-reduced-motion: reduce) { .num { animation: none; } }
</style>
