<script lang="ts">
  // ききみみ's sheet (docs/kikimimi-ux.md §5; docs/kikimimi.md "UI"), its own chunk with the bank, the deck, the session
  // and the strings: full height (Sheet's `pop`), one title bar (the page's name, the game's question 3 / 8; ‹ and ✕,
  // ⚙ at the root) over one scroller. The root is the hub (an invite on top while one waits); its pages are pushed on
  // one stack (nav.ts): あそぶ › a mode, みんなで, きろく, せってい, しまの みち › a unit › the ずかん. ‹ pops one (a
  // shared lobby popped is cancelled), ✕ closes the sheet from any page (asking first when others are in my lobby), a
  // backdrop tap or Esc pops (closes at the hub). A game sits over the stack: its notice, よーい 3-2-1, a question (Play),
  // the results (おわる back to the hub; a lesson's back to its page). Another's lobby I joined is みんなで (‹ leaves it
  // for the hub). Mid-game a backdrop tap or Esc doesn't close it, and ✕ asks 「ここで やめる？」. Opened from the HUD's
  // ききみみ (my own lobby, kept alone: the hub) or the banner's さんか (that game joined: [hub, みんなで]). The voice
  // session is the opener's tap's (invite.svelte.ts openQuiz); closing ends it and drops every clip.
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
  import { QuizGame, needs } from './game.svelte.ts';
  import { gameIn } from '#lib/kikimimi/round/wire.ts';
  import { currentPath, currentReport, currentUnits, recordGame, unitAdded } from './progress.svelte.ts';
  import { KikiActions } from './actions.ts';
  import { keepLv, keepTimer, lastLv, lastTimer } from './prefs.ts';
  import { packs } from './packs.ts';
  import { rechecksDue } from '#lib/kikimimi/stamps.ts';
  import type { Filter } from '#lib/kikimimi/path.ts';
  import { heardQuiz, liveInvite, quizLive } from './invite.svelte.ts';
  import { levelMark } from './look.ts';
  import { inviteStack, pop, push as pushOn, type Page } from './nav.ts';
  import type { Tile, HubInvite } from './hub/Hub.svelte';
  import { INDEX, addUnit, itemOf, load, loadIds, unitPart } from '#lib/kikimimi/pool.ts';
  import { tierFor, type UnitPlay } from '#lib/kikimimi/lesson.ts';
  import type { WireMode } from '#lib/kikimimi/round/wire.ts';
  import { reloadForUpdate } from '#lib/ui-state/reload.ts';
  import type { QuizPhase } from '#lib/kikimimi/games/quiz/view.ts';
  import { voice, voiceSession } from '#lib/sound/sound.svelte.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { villagerNameOf } from '#lib/ui-state/viewer.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { t } from '#lib/i18n/index.ts';
  import { hook, hooksOn } from '../island/devHooks.ts';

  let { open = $bindable(), join = null }: { open: boolean; join?: string | null } = $props();

  let game = $state.raw<QuizGame | null>(null);
  /** ✕ (or a backdrop tap, Esc) mid-game: 「ここで やめる？」; ✕ with others in my lobby: 「みんなの へやが なくなります」. */
  let asking = $state<false | 'quit' | 'close'>(false);
  const v = $derived(game?.view ?? null);
  const MID: readonly QuizPhase[] = ['countdown', 'lead', 'play', 'answer', 'reveal'];
  const mid = $derived(!!v && MID.includes(v.phase));
  /** In a lobby (a boolean: the view itself is a new object at each refresh, about once a second, and what hangs off
   *  the lobby (the report, the path) is folded again only when this changes). */
  const inLobby = $derived(v?.phase === 'lobby');
  /** A unit's lesson on this phone (its intro card in the lobby; its name over the game). */
  const lesson = $derived(game?.lesson ?? null);
  /** The stack over the hub (nav.ts). */
  let pages = $state<Page[]>([]);
  const page = $derived(pages.at(-1) ?? null);
  /** My own lobby (kept alone or shared), no lesson picked: the hub or the page on top. */
  const hosting = $derived(inLobby && !lesson && !!v?.amHost);
  /** Another's lobby I joined: みんなで. */
  const guest = $derived(inLobby && !lesson && !v?.amHost);
  /** The hub shows: my lobby with nothing pushed, or no game of mine yet (an invite waiting). */
  const atHub = $derived(!!v && !v.notice && ((hosting && !page) || v.phase === 'idle'));
  let pathFilter = $state<Filter>('all');
  const path = $derived(inLobby ? currentPath(pathFilter) : null);
  const pageTitle = (p: Page): string => {
    switch (p.k) {
      case 'asobu': return t('kiki.tile.asobu');
      case 'mode': return t(`kiki.mode.${p.m}`);
      case 'lobby': return t('kiki.tile.together');
      case 'record': return t('kiki.tile.record');
      case 'settings': return t('kiki.set.title');
      case 'path': return t('kiki.path.title');
      case 'zukan': return t('kiki.zukan.title');
      case 'unit': return path?.stages.flatMap((s) => s.stops).find((s) => s.id === p.id)?.name ?? t('kiki.path.title');
    }
  };
  const title = $derived(
    v?.phase === 'results' ? t('kiki.results') : v && v.i >= 0 && v.i < v.n && mid ? t('kiki.q', { i: v.i + 1, n: v.n })
      : lesson ? (lesson.recheck ? t('kiki.lesson.recheck') : t(`kiki.lesson.${lesson.lesson}`))
      : hosting && page ? pageTitle(page) : guest ? t('kiki.tile.together') : t('kiki.title')
  );
  /** A page pushed (from the idle hub, an invite waiting: a lobby of my own first). */
  function enter(p: Page) {
    if (v?.phase === 'idle') act.startOwn();
    pages = pushOn(pages, p);
  }
  /** ‹: a lesson's intro card back to its page (another's: leave it), another's lobby left for the hub, else one page
   *  popped (my shared lobby popped: cancelled for everyone, mine kept alone again). */
  function back() {
    if (lesson && v?.amHost) game?.dropLesson();
    else if (lesson || guest) act.toHub();
    else {
      if (page?.k === 'lobby' && v && !v.local) game?.open(lastLv(), { timer: v.timer });
      pages = pop(pages);
    }
  }
  const canBack = $derived(!!v && !v.notice && inLobby && (!!lesson || guest || (hosting && !!page)));
  /** The 30-day rechecks (solo: in my lobby kept alone). */
  const due = $derived(hosting && page?.k === 'path' && v?.local ? rechecksDue(currentUnits(), currentReport()?.today ?? '') : []);

  // Each opening: a game of its own (what the island heard handed to it), joined or opened (mine: on this phone till
  // さそう); closing leaves it. Who I am may come a moment after the sheet (the week's first load). The game begins
  // once the chunks it starts on are in (pool.ts): the remembered level's and those of the lobbies heard.
  const me = $derived(week.view?.viewer);
  $effect(() => {
    if (!open || !me) return;
    const who = me, joining = untrack(() => join);
    let g: QuizGame | null = null, gone = false;
    void load(...heardQuiz().flatMap((m) => needs(gameIn(m))), lastLv())
      .catch(() => {}) // (offline with a chunk never fetched: the game waits for it as it would for a heard one)
      .then(() => {
        if (gone) return;
        const it = new QuizGame({
          live: quizLive(), me: who, fast: hook('kikimimi') === 'fast', wire: wireHook(), heard: heardQuiz(), record: (row) => recordGame(who, row),
          tierOf: (stage) => tierFor(currentReport()?.stats.level ?? null, stage)
        });
        g = it;
        untrack(() => {
          if (joining) {
            it.join(joining);
            pages = inviteStack();
          } else if (!it.view.invite) it.open(lastLv(), { timer: lastTimer() });
        });
        game = it;
        // (tests: `deck(ids)` starts my lobby kept alone on these items, as おさらい does: a dialogue before its clips)
        if (hooksOn())
          (window as unknown as { __kiki?: unknown }).__kiki = {
            view: () => it.view, right: () => it.items[it.view.i]?.answer ?? -1, items: () => it.items.map((x) => x.id),
            deck: (ids: string[]) => loadIds(ids).then(() => it.practice(ids.map(itemOf).filter((x) => !!x))),
            talk: () => it.talk,
            // (a fixture unit put in from the bank's items, as if its chunk were the build's: the units' e2e)
            unit: (unit: UnitPlay, ids: string[], cv?: string) => loadIds(ids).then(() => {
              addUnit(unit.id, { unit, items: ids.map(itemOf).filter((x) => !!x) }, cv);
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
  // The voice session the opening tap began ends as the sheet closes (a game or not), and the packs held go.
  $effect(() => {
    if (open)
      return () => {
        voiceSession(false);
        packs.clear();
      };
  });

  // Its open and close tunes (it mounts on the first tap, already open: that is an open too).
  let wasOpen = false;
  $effect(() => {
    const o = open;
    if (o === wasOpen) return;
    wasOpen = o;
    cue(o ? 'panel-open' : 'panel-close');
  });

  // An invite that lapsed while the hub waited on it (idle, no game of mine): my own lobby, so the hub's pages work.
  let invited = false;
  $effect(() => {
    const idle = v?.phase === 'idle' && !v.notice, inv = !!v?.invite;
    if (idle && !inv && invited) untrack(() => act.startOwn());
    invited = idle && inv;
  });
  /** The games I've been in (an invite still heard for one of them isn't offered again). */
  const been = new Set<string>();
  $effect(() => {
    if (v?.g) been.add(v.g);
  });

  /** ✕: mid-game asks first, and so does my lobby with others in it; otherwise closes (my lobby is cancelled for
   *  everyone: the session's leave). */
  function requestClose() {
    if (mid || (inLobby && v?.amHost && !v.local && v.players.length > 1)) {
      cue('tick');
      asking = mid ? 'quit' : 'close';
    } else {
      cue('back');
      open = false;
    }
  }
  /** A backdrop tap or Esc: mid-game asks; on a page it pops; at the hub it closes. */
  const dismiss = (): boolean => {
    if (mid) {
      asking = 'quit';
      return false;
    }
    if (canBack) {
      back();
      return false;
    }
    return true;
  };
  function quit() {
    asking = false;
    open = false;
  }
  function closed() {
    if (toasts.current) toasts.dismiss();
  }
  const report = $derived(page?.k === 'record' && hosting ? currentReport() : null);
  /** What the buttons start (actions.ts), over this sheet's game and its stack. */
  const act = new KikiActions(() => game, {
    close: () => (open = false),
    pages: () => pages.length,
    setPages: (p) => (pages = p)
  });
  const hostName = (w: 'A' | 'B' | 'G') => (week.view ? villagerNameOf(week.view, w) : '');
  /** The e2e's `?wire=quiz`: this phone sends as an 8b one (the dual stack). */
  const wireHook = (): WireMode | undefined => {
    const w = hook('wire');
    return w === 'quiz' || w === 'guarded' || w === 'play' ? w : undefined;
  };
  /** A unit's name (its chunk's, else the index's path line). */
  const unitName = (u: string) => unitPart(u)?.unit.name ?? INDEX.paths.find((p) => p[0] === u)?.[1] ?? '';
  /** The hub's invite card: the one the session offers while I'm in no game, else (my lobby kept alone) the island's
   *  latest live one I haven't been in. */
  const hubInvite = $derived.by<HubInvite | null>(() => {
    if (!v) return null;
    const iv = v.invite;
    if (v.phase === 'idle' && iv) {
      const what = iv.blocked ? t('kiki.update.why') : iv.lesson && iv.u ? `${unitName(iv.u)} · ${t(`kiki.lesson.${iv.lesson}`)}`
        : iv.ladder ? t('kiki.mode.ladder') : iv.lv === 5 ? t('kiki.mode.announce') : `${t('kiki.mode.quiz')} · ${levelMark(iv.lv)} ${t(`kiki.lv.${iv.lv}`)}`;
      return { g: iv.g, name: hostName(iv.host), what: iv.started ? `${what} · ${t('kiki.started')}` : what, blocked: !!iv.blocked };
    }
    const live = hosting && v.local ? liveInvite() : null;
    return live && !been.has(live.g) ? { g: live.g, name: hostName(live.host), what: '', blocked: false } : null;
  });
  function joinIt(g: string) {
    game?.join(g);
    pages = inviteStack();
  }
  function tile(k: Tile) {
    enter(k === 'asobu' ? { k: 'asobu' } : k === 'together' ? { k: 'lobby' } : k === 'zukan' ? { k: 'zukan', unit: null } : { k: 'record' });
  }
  /** A co-op lesson in my shared lobby: who's in it, whether I start it, the others' wait line. */
  const shared = $derived(v && !v.local && lesson ? { players: v.players.map((p) => p.who), host: v.amHost, wait: t('kiki.waitHost', { name: v.host ? hostName(v.host) : '' }) } : null);
  /** The countdown (WINDOWS.countdown, 4 s): 「よーい」 for its first second (4), then 3-2-1. */
  const count = $derived(v && v.phase === 'countdown' ? Math.max(1, Math.ceil((v.until - game!.now) / 1000)) : 0);
</script>

{#snippet gear()}
  <button type="button" class="gear" aria-label={t('kiki.set.title')} data-kiki-gear data-sfx="open" onclick={() => enter({ k: 'settings' })}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.3 2.6h3.4l.5 2.6c.6.2 1.2.5 1.7.9l2.5-.9 1.7 2.9-2 1.7c.1.6.1 1.3 0 1.9l2 1.7-1.7 2.9-2.5-.9c-.5.4-1.1.7-1.7.9l-.5 2.6h-3.4l-.5-2.6c-.6-.2-1.2-.5-1.7-.9l-2.5.9-1.7-2.9 2-1.7c-.1-.6-.1-1.3 0-1.9l-2-1.7 1.7-2.9 2.5.9c.5-.4 1.1-.7 1.7-.9z" transform="translate(0 1)" /><circle cx="12" cy="13" r="3.2" /></svg>
  </button>
{/snippet}

<Sheet bind:open label={t('kiki.title')} variant="pop" onclose={closed} ondismiss={dismiss}>
  <div class="titlebar"><NavBar {title} onback={canBack ? back : null} onclose={requestClose} sfx="self" lead={atHub ? gear : null} /></div>
  <div class="kk-body" data-kikimimi data-phase={v?.phase} data-host={v?.amHost || undefined} data-kiki-at={atHub ? 'hub' : hosting && page ? page.k : guest ? 'lobby' : undefined}>
    {#if game && v}
      {#if v.notice}
        <div class="center" data-kiki-notice={v.notice}>
          <Host pose="bow" size={96} />
          <p class="say">{t(`kiki.notice.${v.notice}`)}</p>
          <button type="button" class="btn small" data-sfx="back" onclick={act.toHub}>{t('kiki.back')}</button>
        </div>
      {:else if atHub}
        {#await import('./hub/Hub.svelte') then { default: Hub }}
          <Hub here={game.here} me={game.me} invite={hubInvite} onjoin={joinIt} onupdate={() => void reloadForUpdate()} ontile={tile} onact={act.menu} />
        {/await}
      {:else if hosting && page}
        {#if page.k === 'asobu'}
          {#await import('./asobu/Asobu.svelte') then { default: Asobu }}
            <Asobu {path} onpath={() => enter({ k: 'path' })} onmode={(m) => enter({ k: 'mode', m })} />
          {/await}
        {:else if page.k === 'mode'}
          {#await import('./mode/ModeDetail.svelte') then { default: ModeDetail }}
            {#key page.m}<ModeDetail {game} m={page.m} oninvite={() => (game?.invite(), enter({ k: 'lobby' }))} onpractice={() => act.practice()} />{/key}
          {/await}
        {:else if page.k === 'lobby'}
          {#if path && path.stages.some((s) => s.stops.length)}<PathCard {path} onopen={() => enter({ k: 'path' })} />{/if}
          <Lobby {game} onlevel={keepLv} ontimer={keepTimer} />
        {:else if page.k === 'record'}
          {#await import('./Progress.svelte') then { default: Progress }}
            {#if report}<Progress {report} onplay={() => (pages = [])} />{/if}
          {/await}
        {:else if page.k === 'settings'}
          {#await import('./settings/KikiSettings.svelte') then { default: KikiSettings }}
            <KikiSettings {game} />
          {/await}
        {:else if page.k === 'path' && path}
          {#await import('./path/IslandPath.svelte') then { default: IslandPath }}
            <IslandPath {path} bind:filter={pathFilter} {due} onunit={(id) => enter({ k: 'unit', id })} onlesson={act.startLesson}
              onquiz={act.quickQuiz} onzukan={() => enter({ k: 'zukan', unit: null })} />
          {/await}
        {:else if page.k === 'unit'}
          {#await import('./path/UnitPage.svelte') then { default: UnitPage }}
            {#key page.id}<UnitPage id={page.id} onlesson={act.startLesson} onzukan={(unit) => enter({ k: 'zukan', unit })} />{/key}
          {/await}
        {:else if page.k === 'zukan'}
          {#await import('./path/PhraseZukan.svelte') then { default: PhraseZukan }}
            <PhraseZukan unit={page.unit} onreview={act.reviewPhrases} />
          {/await}
        {/if}
      {:else if v.phase === 'lobby' && lesson}
        <LessonIntro unit={lesson.unit} lesson={lesson.lesson} recheck={lesson.recheck} {shared} onstart={() => game?.go()} onback={back} />
      {:else if v.phase === 'lobby'}
        <Lobby {game} onlevel={keepLv} ontimer={keepTimer} />
      {:else if v.phase === 'countdown'}
        <div class="center count" data-kiki-count={count}>
          <Host pose="stand" size={110} />
          <p class="say">{t('kiki.ready')}</p>
          {#key count}<span class="num" class:set={count > 3} aria-live="assertive">{count > 3 ? t('kiki.set') : count}</span>{/key}
        </div>
      {:else if v.phase === 'results'}
        <Results {game} onagain={act.again} onmissed={act.replayMissed} ondone={act.done} onnext={(l) => game?.lesson && act.relesson(game.lesson.unit.id, l)} />
      {:else}
        <Play {game} />
      {/if}
    {/if}
  </div>

  {#if asking}
    <div class="veil" role="alertdialog" aria-modal="true" aria-labelledby="kk-quit" data-kiki-quit={asking}>
      <div class="ask card">
        <h3 id="kk-quit">{t(asking === 'quit' ? 'kiki.quit' : 'kiki.closeAsk')}</h3>
        <p>{t(asking === 'quit' ? 'kiki.quitBody' : 'kiki.closeAskBody')}</p>
        <div class="row">
          <!-- つづける the primary (the safe choice), やめる the paper one -->
          <button type="button" class="btn paper small" data-kiki-quit-yes data-sfx="back" onclick={quit}>{t(asking === 'quit' ? 'kiki.quitYes' : 'kiki.closeYes')}</button>
          <button type="button" class="btn small" data-kiki-stay data-sfx="confirm" onclick={() => (asking = false)}>{t(asking === 'quit' ? 'kiki.quitNo' : 'kiki.back')}</button>
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
  /* ⚙ at the hub, in ‹'s place: the NavButton's round cream game object */
  .gear {
    appearance: none; cursor: pointer; flex: none; width: var(--hit); height: var(--hit); border-radius: 50%; padding: 0; border: 0;
    display: inline-grid; place-items: center; background: var(--c-card); color: var(--c-ink); box-shadow: var(--sh-obj);
  }
  .gear:active { transform: translateY(2px); box-shadow: var(--sh-obj-press); }
  .gear svg { width: 24px; height: 24px; fill: #A88B68; }
  .gear circle { fill: var(--c-card); }
  /* the one scroller (as the other full-height sheets'): it bleeds 8px past the side padding so focus rings and lips show */
  .kk-body {
    flex: 1; min-height: 0; overflow: hidden auto; overscroll-behavior: contain;
    margin: 0 -8px; padding: 6px 8px var(--body-pad); display: flex; flex-direction: column; gap: 14px;
  }
  .kk-body > :global(*) { flex: none; }
  /* a page's actions stay at the foot of the screen, even on a short page */
  .kk-body > :global(.level-acts) { margin-top: auto; }
  .center { display: grid; justify-items: center; align-content: center; gap: 14px; flex: 1 0 auto; text-align: center; padding: 12px 0; }
  .say { margin: 0; font: 700 var(--fs-talk)/1.4 var(--font-ui); }
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
  .resume b { font: 700 var(--fs-talk)/1.2 var(--font-ui); }
  .resume small { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  @media (prefers-reduced-motion: reduce) { .num { animation: none; } .gear:active { transform: none; } }
</style>
