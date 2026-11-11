<script module lang="ts">
  import Lazy from '#lib/components/ui/Lazy.svelte';
  import { load as loadUnits } from '#lib/kikimimi/pool.ts';
  import { lastLv as rememberedLv } from './prefs.ts';
  /** Ahead of an opening (island/sheetChunks.ts, a quiet moment): the hub's chunk and the remembered level's items,
   *  what the opening waits for before its first page shows. */
  export function warm(): Promise<unknown> {
    return Promise.all([import('./hub/Hub.svelte'), loadUnits(rememberedLv())]);
  }
</script>

<script lang="ts">
  // ききみみ's sheet (docs/kikimimi.md "Navigation", "UI details"), its own chunk with the bank, the deck, the session
  // and the strings: full height (Sheet's `pop`), one title bar (the page's name, the game's question 3 / 8; ‹ and ✕,
  // ⚙ at the root) over one scroller. The root is the hub (an invite on top while one waits); its pages are pushed on
  // one stack (nav.ts): あそぶ › a mode, みんなで, きろく, せってい, しまの みち › a unit › the ずかん (ことば · こえ · なかま · スタンプ), the weekend's
  // たいかい (its lobby, show and results: taikai/, their own chunks). ‹ pops one (a
  // shared lobby popped is cancelled), ✕ closes the sheet from any page (asking first when others are in my lobby), a
  // backdrop tap or Esc pops (closes at the hub). A game sits over the stack: its notice, よーい 3-2-1, a question (Play),
  // the results (おわる back to the hub; a lesson's back to its page); a game whose lane has its own views (round/
  // registry.ts; views.ts: the tournament's, みみ チェック's, a later game's) shows them in their place, each its own chunk. Another's lobby I joined is みんなで (‹ leaves it
  // for the hub). Mid-game a backdrop tap or Esc doesn't close it, and ✕ asks 「ここでやめますか？」 (キャンセル or ✕ goes on, the coral やめる leaves). Opened from the HUD's
  // ききみみ (my own lobby, kept alone: the hub) or the banner's さんか (that game joined: [hub, みんなで]). The voice
  // session is the opener's tap's (invite.svelte.ts openQuiz); closing ends it and drops every clip. A player's first
  // open on this phone (none played yet) has the welcome in the hub's place (onboarding/: hello, the sound check, then
  // みみ チェック, whose result is onboarding/Placed).
  import { untrack } from 'svelte';
  import '#lib/i18n/kikimimi.ts';
  import Sheet from '../ui/Sheet.svelte';
  import NavBar from '../ui/NavBar.svelte';
  import NavButton from '../ui/NavButton.svelte';
  import Host from '../characters/Host.svelte';
  import Lobby from './Lobby.svelte';
  import Play from './Play.svelte';
  import Results from './Results.svelte';
  import LessonIntro from './LessonIntro.svelte';
  import PathCard from './path/PathCard.svelte';
  import { QuizGame, needs } from './game.svelte.ts';
  import { gameIn } from '#lib/kikimimi/round/wire.ts';
  import { currentHenshin, currentLong, currentPath, currentReport, currentUnits, recordGame, unitAdded } from './progress.svelte.ts';
  import { KikiActions } from './actions.ts';
  import { jaMode, keepJa, keepLv, keepOnboarded, keepTimer, lastLv, lastTimer, onboarded, sameDefault, type JaMode } from './prefs.ts';
  import { LANES } from '#lib/kikimimi/round/registry.ts';
  import { viewOf } from './views.ts';
  import { modeOfGame } from '#lib/kikimimi/catalog.ts';
  import { packs } from './packs.ts';
  import { rechecksDue } from '#lib/kikimimi/stamps.ts';
  import type { Filter } from '#lib/kikimimi/path.ts';
  import { heardQuiz, liveInvite, quizLive } from './invite.svelte.ts';
  import { levelMark } from './look.ts';
  import { inviteStack, pop, push as pushOn, taikaiStack, type Page } from './nav.ts';
  import type { Tile, HubInvite } from './hub/Hub.svelte';
  import { INDEX, addUnit, itemOf, load, loadIds, unitPart } from '#lib/kikimimi/pool.ts';
  import { tierFor, type Lesson, type UnitPlay } from '#lib/kikimimi/lesson.ts';
  import type { Item } from '#lib/kikimimi/bank.ts';
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
  import { nextOf, pickSerial } from '#lib/kikimimi/bedtime.ts';
  import { SERIALS, serialOf, storyProgress } from './story/serials.svelte.ts';

  let { open = $bindable(), join = null }: { open: boolean; join?: string | null } = $props();

  let game = $state.raw<QuizGame | null>(null);
  /** ✕ (or a backdrop tap, Esc) mid-game: 「ここでやめますか？」; ✕ with others in my lobby: 「部屋を閉じますか？」. The kit's
   *  confirm (docs/design.md "Forms and confirms"): キャンセル + the coral verb, its ✕ the safe choice too. */
  let asking = $state<false | 'quit' | 'close'>(false);
  /** A mic game's さんか asked first (role/MicJoin.svelte: joining is consenting): its game, and whether the mic is on. */
  let micJoin = $state<{ g: string; on: boolean } | null>(null);
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
  /** おやすみ ものがたり playing (StoryFrame, a game page over the stack: no ‹): its serial, chapter and segment. */
  let story = $state<{ unit: string; ch: number; seg: number } | null>(null);
  /** The hub shows: my lobby with nothing pushed, or no game of mine yet (an invite waiting). */
  const atHub = $derived(!story && !!v && !v.notice && ((hosting && !page) || v.phase === 'idle'));
  /** The first run's welcome in the hub's place (docs/kikimimi.md "First run"): once per player on this phone, never for one
   *  who has played (their stage is their rows'). */
  let welcome = $state(false);
  /** The game's lane (round/registry.ts), and its own view for this phase (null: the quiz's). */
  const lane = $derived(LANES.of(v?.gm));
  const slot = $derived(!v || !v.g ? null : v.phase === 'lobby' ? 'lobby' : v.phase === 'results' ? 'results' : mid && v.phase !== 'countdown' ? 'play' : null);
  const own = $derived(slot ? viewOf(v?.gm, slot) : null);
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
      case 'zukan': return t('kiki.tile.zukan');
      case 'story': return t('kiki.mode.story');
      case 'taikai': return t('kiki.mode.taikai');
      case 'unit': return path?.stages.flatMap((s) => s.stops).find((s) => s.id === p.id)?.name ?? t('kiki.path.title');
    }
  };
  const title = $derived(
    // every game's results are 「結果」 (みみ チェック's end is its placement, under its own name)
    story ? t('kiki.mode.story') : lane?.title?.game && (mid || (v?.phase === 'results' && v.gm === 'check')) ? t(lane.title.game) : v?.phase === 'results' ? t('kiki.results') : v && v.i >= 0 && v.i < v.n && mid ? t('kiki.q', { i: v.i + 1, n: v.n })
      : lesson ? (lesson.recheck ? t('kiki.lesson.recheck') : t(`kiki.lesson.${lesson.lesson}`))
      : hosting && page ? pageTitle(page) : guest ? t(lane?.title?.lobby ?? 'kiki.tile.together') : t('kiki.title')
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
      else if (page?.k === 'taikai') game?.open(lastLv(), { timer: lastTimer(), same: sameDefault() }); // (the hub's lobby is a quiz's)
      pages = pop(pages);
    }
  }
  const canBack = $derived(!story && !!v && !v.notice && inLobby && (!!lesson || guest || (hosting && !!page)));
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
          tierOf: (stage) => tierFor(currentReport()?.stats.level ?? null, stage), level: () => currentReport()?.stats.level ?? null,
          focus: (gm, lv) => (gm === 'long' ? currentLong(lv).piece : currentHenshin().focus)
        });
        g = it;
        untrack(() => {
          if (joining) joinIt(joining, it);
          else if (!it.view.invite) it.open(lastLv(), { timer: lastTimer(), same: sameDefault() });
        });
        game = it;
        // (tests: `deck(ids, help?)` starts my lobby kept alone on these items, as おさらい does: a dialogue before its
        // clips; `help` a fixture's Japanese help over an item, its cja aligned to the choices as authored)
        if (hooksOn())
          (window as unknown as { __kiki?: unknown }).__kiki = {
            view: () => it.view, right: () => it.items[it.view.i]?.answer ?? -1, items: () => it.items.map((x) => x.id),
            deck: (ids: string[], help: Record<string, Pick<Item, 'cja' | 'why' | 'ctx'>> = {}) =>
              loadIds(ids).then(() => it.practice(ids.map(itemOf).filter((x) => !!x).map((x) => ({ ...x, ...help[x.id] })))),
            talk: () => it.talk,
            // (a fixture unit put in from the bank's items, as if its chunk were the build's: the units' e2e; `kinds` its
            // recipe-2 lessons' listening files, the index's units[<id>].kinds)
            unit: (unit: UnitPlay, ids: string[], cv?: string, kinds?: Partial<Record<Lesson, string[]>>) => loadIds(ids).then(() => {
              addUnit(unit.id, { unit, items: ids.map(itemOf).filter((x) => !!x) }, cv, kinds);
              unitAdded();
            }),
            recorded: () => it.recorded
          };
      });
    return () => {
      gone = true;
      g?.dispose();
      if (hooksOn()) delete (window as unknown as { __kiki?: unknown }).__kiki;
      game = null;
      asking = false;
      micJoin = null;
      pages = [];
      story = null;
      welcome = false;
    };
  });
  $effect(() => {
    if (!open || !me || welcome) return;
    const r = currentReport();
    if (r && !r.games.length && !onboarded(me)) untrack(() => (welcome = true));
  });
  /** The welcome left: あとで (the hub, its card for the check) or on into みみ チェック. */
  function welcomed(check: boolean) {
    if (me) keepOnboarded(me);
    welcome = false;
    if (check) act.check();
  }
  // The voice session the opening tap began ends as the sheet closes (a game or not), and the packs held go.
  $effect(() => {
    if (open)
      return () => {
        voiceSession(false);
        packs.clear();
      };
  });


  // An invite that lapsed while the hub waited on it (idle, no game of mine): my own lobby, so the hub's pages work.
  let invited = false;
  $effect(() => {
    const idle = v?.phase === 'idle' && !v.notice, inv = !!v?.invite;
    if (idle && !inv && invited) untrack(() => act.startOwn());
    invited = idle && inv;
  });
  /** When the Japanese shows (せってい's にほんごやく): every reveal and review row, only a miss's, or never. */
  let ja = $state<JaMode>(jaMode());
  /** My answer to the reveal's question was right (a miss's Japanese only: hidden then). */
  const right = $derived(v?.phase === 'reveal' && !!game && v.answers[v.i]?.k === game.items[v.i]?.answer);
  /** The games I've been in (an invite still heard for one of them isn't offered again). */
  const been = new Set<string>();
  $effect(() => {
    if (v?.g) been.add(v.g);
  });

  /** ✕: mid-game asks first, and so does my lobby with others in it; otherwise closes (my lobby is cancelled for
   *  everyone: the session's leave). */
  function requestClose() {
    if (!story && (mid || (inLobby && v?.amHost && !v.local && v.players.length > 1))) {
      cue('tick');
      asking = mid ? 'quit' : 'close';
    } else {
      cue('back');
      open = false;
    }
  }
  /** A backdrop tap or Esc: mid-game asks; on a page it pops; at the hub it closes. */
  const dismiss = (): boolean => {
    if (story) return false; // (a game page: a backdrop tap or Esc does nothing; ✕ closes)
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
    setPages: (p) => (pages = p),
    story: () => playTonight()
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
      const named = iv.gm === 'taikai' ? 'taikai' : modeOfGame(iv.gm)?.id;
      const what = iv.blocked ? t('kiki.update.why') : named ? `${t(`kiki.mode.${named}`)}${micMode(iv.gm) ? ` · 🎤 ${t('kiki.micGame')}` : ''}` : iv.lesson && iv.u ? `${unitName(iv.u)} · ${t(`kiki.lesson.${iv.lesson}`)}`
        : iv.ladder ? t('kiki.mode.ladder') : iv.lv === 5 ? t('kiki.mode.announce') : `${t('kiki.mode.quiz')} · ${levelMark(iv.lv)} ${t(`kiki.lv.${iv.lv}`)}`;
      return { g: iv.g, name: hostName(iv.host), what: iv.started ? `${what} · ${t('kiki.started')}` : what, blocked: !!iv.blocked };
    }
    const live = hosting && v.local ? liveInvite() : null;
    return live && !been.has(live.g) ? { g: live.g, name: hostName(live.host), what: '', blocked: false } : null;
  });
  /** A game's mode when it uses the mic (ロールプレイ: its invitee asked first). */
  const micMode = (gm: string) => {
    const m = modeOfGame(gm);
    return m?.requires === 'mic' ? m : null;
  };
  /** さんか (the hub's card, the banner's): a mic game's asked first (MicJoin), any other joined. */
  function joinIt(g: string, it = game) {
    const gm = it?.view.invite?.g === g ? it.view.invite.gm : heardQuiz().map(gameIn).find((m) => m?.op === 'open' && m.g === g)?.gm;
    const mic = gm ? micMode(gm) : null;
    if (mic && !micJoin) return void (micJoin = { g, on: mic.gate?.() ?? true });
    micJoin = null;
    it?.join(g);
    pages = inviteStack();
  }
  /** A bedtime chapter played at once (StoryFrame; from an invite's idle hub: my own lobby first, for after it). */
  function playStory(unit: string, ch: number, seg = 0) {
    if (v?.phase === 'idle') act.startOwn();
    story = { unit, ch, seg };
  }
  /** The night's きまぐれ card: the serial to go on with, at its next chapter (つづき: its segment). */
  function playTonight() {
    const progress = me ? storyProgress(me) : {};
    const unit = pickSerial(progress, SERIALS.map((s) => ({ unit: s.unit, chapters: s.chapters.length })));
    const s = unit ? serialOf(unit) : undefined;
    if (!s) return;
    const at = nextOf(progress[s.unit], s.chapters.length);
    playStory(s.unit, at.ch, at.seg);
  }
  function tile(k: Tile) {
    enter(k === 'asobu' ? { k: 'asobu' } : k === 'together' ? { k: 'lobby' } : k === 'zukan' ? { k: 'zukan', unit: null } : { k: 'record' });
  }
  // My tournament's lobby is its page (the hub's lobby is a quiz's): one left at the hub (a results' もういっかい from
  // there) gets its page back.
  $effect(() => {
    if (hosting && !page && v?.gm === 'taikai') untrack(() => (pages = taikaiStack()));
  });
  // a game in sight (みんなで, a lesson's card, another's lobby; a mode's page once it has dealt its own deck:
  // ModeDetail): its first question's packs fetched now; a look at the hub, あそぶ's list (its lobby's deck is not what a
  // mode's page deals), きろく or ずかん fetches none (game.svelte.ts ahead)
  $effect(() => {
    const g = game, on = !!lesson || guest || (!!page && ['lobby', 'taikai'].includes(page.k));
    untrack(() => g?.ahead(on));
  });
  /** A co-op lesson in my shared lobby: who's in it, whether I start it, the others' wait line. */
  const shared = $derived(v && !v.local && lesson ? { players: v.players.map((p) => p.who), host: v.amHost, wait: t('kiki.waitHost', { name: v.host ? hostName(v.host) : '' }) } : null);
  /** The countdown (WINDOWS.countdown, 4 s): 「よーい」 for its first second (4), then 3-2-1. */
  const count = $derived(v && v.phase === 'countdown' ? Math.max(1, Math.ceil((v.until - game!.now) / 1000)) : 0);
</script>

{#snippet gear()}<NavButton kind="tool" icon="gear" label={t('kiki.set.title')} data-kiki-gear sfx="open" onclick={() => enter({ k: 'settings' })} />{/snippet}

{#snippet ownView(view: NonNullable<typeof own>)}
  <!-- a lane's own view in this phase's place (its lobby, its round, its results) -->
  {#key view}<Lazy load={view}>{#snippet children(View)}
    <View {game} onagain={act.again} onmissed={act.replayMissed} ondone={act.done} onhub={act.toHub} />
  {/snippet}</Lazy>{/key}
{/snippet}

<Sheet bind:open tunes label={t('kiki.title')} variant="pop" onclose={closed} ondismiss={dismiss} timed="kikimimi">
  <div class="titlebar"><NavBar {title} onback={canBack ? back : null} onclose={requestClose} sfx="self" lead={atHub && !welcome ? gear : null} /></div>
  <div class="kk-body" data-kikimimi data-phase={v?.phase} data-host={v?.amHost || undefined} data-kiki-at={story ? 'story-frame' : atHub ? (welcome ? 'welcome' : 'hub') : hosting && page ? page.k : guest ? 'lobby' : undefined} data-kiki-night={story ? '' : undefined}
    data-kiki-ja={ja} data-kiki-right={right || undefined}>
    {#if game && v}
      {@const g = game}
      {#if story}
        {@const s = story}
        <Lazy load={() => import('./story/StoryFrame.svelte')}>{#snippet children(StoryFrame)}
          {#key `${s.unit}:${s.ch}`}
            <StoryFrame me={g.me} unit={s.unit} ch={s.ch} seg={s.seg} onclose={() => (open = false)}
              onlist={() => ((story = null), (pages = [{ k: 'story' }]))} />
          {/key}
        {/snippet}</Lazy>
      {:else if v.notice}
        <div class="center" data-kiki-notice={v.notice}>
          <Host pose="bow" size={96} />
          <p class="say kana">{t(`kiki.notice.${v.notice}`)}</p>
          <button type="button" class="btn small" data-sfx="back" onclick={act.toHub}>{t('kiki.back')}</button>
        </div>
      {:else if atHub && welcome}
        <Lazy load={() => import('./onboarding/Welcome.svelte')}>{#snippet children(Welcome)}
          <Welcome game={g} onlater={() => welcomed(false)} onstart={() => welcomed(true)} />
        {/snippet}</Lazy>
      {:else if atHub}
        <Lazy load={() => import('./hub/Hub.svelte')}>{#snippet children(Hub)}
          <Hub here={g.here} me={g.me} invite={hubInvite} onjoin={joinIt} onupdate={() => void reloadForUpdate()} ontile={tile} onact={act.menu} ontaikai={act.taikai}
            oncheck={act.check} />
        {/snippet}</Lazy>
      {:else if hosting && page}
        {#if page.k === 'asobu'}
          <Lazy load={() => import('./asobu/Asobu.svelte')}>{#snippet children(Asobu)}
            <Asobu {path} onpath={() => enter({ k: 'path' })} onmode={(m) => enter(m === 'story' ? { k: 'story' } : { k: 'mode', m })} />
          {/snippet}</Lazy>
        {:else if page.k === 'mode'}
          <Lazy load={() => import('./mode/ModeDetail.svelte')}>{#snippet children(ModeDetail)}
            {#key page.m}<ModeDetail game={g} m={page.m} oninvite={() => (game?.invite(), enter({ k: 'lobby' }))} onpractice={() => act.practice()} />{/key}
          {/snippet}</Lazy>
        {:else if page.k === 'lobby'}
          {#if path && path.stages.some((s) => s.stops.length)}<PathCard {path} onopen={() => enter({ k: 'path' })} />{/if}
          {#if own}{@render ownView(own)}{:else}<Lobby {game} onlevel={keepLv} ontimer={keepTimer} />{/if}
        {:else if page.k === 'record'}
          <Lazy load={() => import('./Progress.svelte')}>{#snippet children(Progress)}
            {#if report}<Progress {report} onplay={() => (pages = [])} />{/if}
          {/snippet}</Lazy>
        {:else if page.k === 'settings'}
          <Lazy load={() => import('./settings/KikiSettings.svelte')}>{#snippet children(KikiSettings)}
            <KikiSettings game={g} {ja} onja={(m) => ((ja = m), keepJa(m))} oncheck={act.check} />
          {/snippet}</Lazy>
        {:else if page.k === 'path' && path}
          <Lazy load={() => import('./path/IslandPath.svelte')}>{#snippet children(IslandPath)}
            <IslandPath {path} bind:filter={pathFilter} {due} onunit={(id) => enter({ k: 'unit', id })} onlesson={act.startLesson}
              onquiz={act.quickQuiz} onzukan={() => enter({ k: 'zukan', unit: null })} />
          {/snippet}</Lazy>
        {:else if page.k === 'unit'}
          <Lazy load={() => import('./path/UnitPage.svelte')}>{#snippet children(UnitPage)}
            {#key page.id}<UnitPage id={page.id} onlesson={act.startLesson} onzukan={(unit) => enter({ k: 'zukan', unit })} />{/key}
          {/snippet}</Lazy>
        {:else if page.k === 'story'}
          <Lazy load={() => import('./story/StoryList.svelte')}>{#snippet children(StoryList)}
            <StoryList me={g.me} onplay={playStory} />
          {/snippet}</Lazy>
        {:else if page.k === 'taikai'}
          {@render ownView(viewOf('taikai', 'lobby')!)}
        {:else if page.k === 'zukan'}
          <Lazy load={() => import('./zukan/KikiZukan.svelte')}>{#snippet children(KikiZukan)}
            <KikiZukan me={g.me} unit={page.unit} onreview={act.reviewPhrases} />
          {/snippet}</Lazy>
        {/if}
      {:else if v.phase === 'lobby' && lesson}
        <LessonIntro unit={lesson.unit} lesson={lesson.lesson} recheck={lesson.recheck} {shared} onstart={() => game?.go()} onback={back} />
      {:else if v.phase === 'lobby' && own}
        {@render ownView(own)}
      {:else if v.phase === 'lobby'}
        <Lobby {game} onlevel={keepLv} ontimer={keepTimer} />
      {:else if v.phase === 'countdown'}
        <div class="center count" data-kiki-count={count}>
          <Host pose="stand" size={110} />
          <p class="say kana">{t('kiki.ready')}</p>
          {#key count}<span class="num" class:set={count > 3} aria-live="assertive">{count > 3 ? t('kiki.set') : count}</span>{/key}
        </div>
      {:else if v.phase === 'results' && own}
        {@render ownView(own)}
      {:else if v.phase === 'results'}
        <Results {game} onagain={act.again} onmissed={act.replayMissed} ondone={act.done} onnext={(l) => game?.lesson && act.relesson(game.lesson.unit.id, l)} />
      {:else if own}
        {@render ownView(own)}
      {:else}
        <Play {game} />
      {/if}
    {/if}
  </div>

  {#if micJoin}
    {@const mj = micJoin}
    <Lazy load={() => import('./role/MicJoin.svelte')}>{#snippet children(MicJoin)}
      <MicJoin on={mj.on} onjoin={() => micJoin && joinIt(micJoin.g)} oncancel={() => (micJoin = null)} />
    {/snippet}</Lazy>
  {/if}
  <!-- the ask: キャンセル (and its ✕) goes on, the coral verb leaves (the other confirms' footer) -->
  <Sheet bind:open={() => !!asking, (o) => { if (!o) asking = false; }} title={t(asking === 'close' ? 'kiki.closeAsk' : 'kiki.quit')}>
    <p class="ask-note">{t(asking === 'close' ? 'kiki.closeAskBody' : 'kiki.quitBody')}</p>
    {#snippet footer()}
      <div class="two-cta">
        <button type="button" class="btn paper" data-action="cancel" data-sfx="back" onclick={() => (asking = false)}>{t('common.cancel')}</button>
        <button type="button" class="btn danger" data-action="kiki-quit" data-sfx="tick" onclick={quit}>{t(asking === 'close' ? 'kiki.closeYes' : 'kiki.quitYes')}</button>
      </div>
    {/snippet}
  </Sheet>
  {#if !asking && voice.on && voice.state !== 'running'}
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
  .ask-note { margin: 0 4px 8px; text-align: center; text-wrap: pretty; word-break: auto-phrase; }
  /* おやすみ ものがたり: the night palette (tokens.css data-tod night) on the whole sheet, whatever the island's hour,
     its paper a step deeper (the screen kept dim) */
  :global(dialog:has(> .inner > .kk-body[data-kiki-night])) {
    --bg: #2E3A72; --surface: #2E3A72; --lip: #232D5E; --card: #3A4886;
    --ctl: #3A4886; --ctl-off: #2A3468; --edge: #B9C3F0;
    --text: #FFF6E0; --text-soft: #C9D0EE; --focus: #FFF6E0; --leaf-text: #9EE6A6; --coral-text: #FFD0C6;
    --scrim: rgba(20, 24, 56, .5); --hl: rgba(255, 246, 224, .12);
    color-scheme: dark;
  }
  /* the one scroller (as the other full-height sheets'): it bleeds 8px past the side padding so focus rings and lips show */
  .kk-body {
    flex: 1; min-height: 0; overflow: hidden auto; overscroll-behavior: contain;
    margin: 0 -8px; padding: 6px 8px var(--body-pad); display: flex; flex-direction: column; gap: 14px;
  }
  .kk-body > :global(*) { flex: none; }
  /* a page's actions stay at the foot of the screen, even on a short page */
  .kk-body > :global(.level-acts) { margin-top: auto; }
  /* にほんごやく: never, or only for a miss (the reveal answered right; a review row right) */
  .kk-body[data-kiki-ja='never'] :global(.ja),
  .kk-body[data-kiki-ja='missed'][data-kiki-right] :global(.ja),
  .kk-body[data-kiki-ja='missed'] :global([data-ok='true'] .ja) { display: none; }
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
  .resume { cursor: pointer; }
  .resume b { font: 700 var(--fs-talk)/1.2 var(--font-ui); }
  .resume small { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  @media (prefers-reduced-motion: reduce) { .num { animation: none; } }
</style>
