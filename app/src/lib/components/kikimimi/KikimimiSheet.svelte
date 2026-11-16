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
  // ⚙ at the root) over one scroller. The root is the hub; its pages are pushed on one stack (nav.ts): あそぶ › a mode,
  // きろく, せってい. Solo only: the game has no Live, so
  // nothing is sent or heard. ‹ pops one, ✕ closes the sheet from any page, a backdrop tap or Esc pops (closes at the hub). A game sits over the stack: its notice, よーい 3-2-1, a question (Play),
  // the results; a game whose lane has its own views (round/registry.ts; views.ts: the tournament's, みみ チェック's, a
  // later game's) shows them in their place, each its own chunk. A game is a level over the page that started it: its ‹ (a backdrop tap, Esc) and the results' 終わる land
  // there (actions.ts done), its ✕ closes the sheet; mid-game both ask 「ここでやめますか？」 first unless nothing is lost
  // (before my first answer). Opened from the HUD's ききみみ (my own lobby, kept alone: the hub). The voice
  // session is the opener's tap's (invite.svelte.ts openQuiz); closing ends it and drops every clip.
  import { untrack } from 'svelte';
  import '#lib/i18n/kikimimi.ts';
  import Sheet from '../ui/Sheet.svelte';
  import NavBar from '../ui/NavBar.svelte';
  import NavButton from '../ui/NavButton.svelte';
  import Host from '../characters/Host.svelte';
  import Play from './Play.svelte';
  import Results from './Results.svelte';
  import LessonIntro from './LessonIntro.svelte';
  import { QuizGame } from './game.svelte.ts';
  import { currentHenshin, currentLong, currentReport, recordGame, unitAdded } from './progress.svelte.ts';
  import { KikiActions } from './actions.ts';
  import { jaMode, keepJa, lastLv, lastTimer, sameDefault, type JaMode } from './prefs.ts';
  import { LANES } from '#lib/kikimimi/round/registry.ts';
  import { viewOf } from './views.ts';
  import { packs } from './packs.ts';
  import { pop, push as pushOn, type Page } from './nav.ts';
  import type { Tile } from './hub/Hub.svelte';
  import { addUnit, itemOf, load, loadIds } from '#lib/kikimimi/pool.ts';
  import { tierFor, type Lesson, type UnitPlay } from '#lib/kikimimi/lesson.ts';
  import type { Item } from '#lib/kikimimi/bank.ts';
  import type { QuizPhase } from '#lib/kikimimi/games/quiz/view.ts';
  import { voice, voiceSession } from '#lib/sound/sound.svelte.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { t } from '#lib/i18n/index.ts';
  import { hook, hooksOn } from '#lib/world/devHooks.ts';

  let { open = $bindable() }: { open: boolean } = $props();

  let game = $state.raw<QuizGame | null>(null);
  /** Mid-game ‹ (`leave`: to the page under the game) or ✕ (`quit`: the sheet closed): 「ここでやめますか？」; ✕ with
   *  others in my lobby: 「部屋を閉じますか？」. The kit's confirm (docs/design.md "Forms and confirms"): キャンセル + the
   *  coral verb, its ✕ the safe choice too. */
  let asking = $state<false | 'leave' | 'quit' | 'close'>(false);
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
  /** おやすみ ものがたり playing (StoryFrame, a game page over the stack: ‹ to 寝る前に): its serial, chapter and segment. */
  let story = $state<{ unit: string; ch: number; seg: number } | null>(null);
  /** The hub shows: my lobby with nothing pushed, or no game of mine yet (an invite waiting). */
  const atHub = $derived(!story && !!v && !v.notice && ((hosting && !page) || v.phase === 'idle'));
  /** The game's lane (round/registry.ts), and its own view for this phase (null: the quiz's). */
  const lane = $derived(LANES.of(v?.gm));
  const slot = $derived(!v || !v.g ? null : v.phase === 'lobby' ? 'lobby' : v.phase === 'results' ? 'results' : mid && v.phase !== 'countdown' ? 'play' : null);
  const own = $derived(slot ? viewOf(v?.gm, slot) : null);
  const pageTitle = (p: Page): string => {
    switch (p.k) {
      case 'asobu': return t('kiki.tile.asobu');
      case 'mode': return t(`kiki.mode.${p.m}`);
      case 'record': return t('kiki.tile.record');
      case 'settings': return t('kiki.set.title');
      case 'story': return t('kiki.mode.story');
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
  /** Mid-game, nothing to lose yet: solo, in the countdown or round 1 before my answer. */
  const lossless = $derived(!!v && v.players.length <= 1 && (v.phase === 'countdown' || (v.i === 0 && v.phase !== 'reveal' && !v.answers[0])));
  /** ‹: a story back to 寝る前に (its place kept); a game left for the page it was started from (mid-game asked first,
   *  the results' as 終わる); a lesson's intro card back to its page (another's: leave it), another's lobby left for the
   *  hub, else one page popped (my shared lobby popped: cancelled for everyone, mine kept alone again). */
  function back() {
    if (story) toStories();
    else if (mid) {
      cue(lossless ? 'back' : 'tick');
      if (lossless) leaveGame();
      else asking = 'leave';
    } else if (v?.phase === 'results') act.done();
    else if (lesson && v?.amHost) game?.dropLesson();
    else if (lesson || guest) act.toHub();
    else {
      pages = pop(pages);
    }
  }
  const canBack = $derived(!!story || (!!v && !v.notice && (mid || v.phase === 'results' || (inLobby && (!!lesson || guest || (hosting && !!page))))));
  /** 寝る前に (StoryList) on top of the stack (from the hub's card: pushed). */
  function toStories() {
    story = null;
    if (page?.k !== 'story') pages = pushOn(pages, { k: 'story' });
  }

  // Each opening: a game of its own, solo (no Live: nothing on the wire); closing leaves it. Who I am may come a moment
  // after the sheet (the week's first load). The game begins once the remembered level's chunk is in (pool.ts).
  const me = $derived(week.view?.viewer);
  $effect(() => {
    if (!open || !me) return;
    const who = me;
    let g: QuizGame | null = null, gone = false;
    void load(lastLv())
      .catch(() => {}) // (offline with a chunk never fetched: the game waits for it)
      .then(() => {
        if (gone) return;
        const it = new QuizGame({
          live: null, me: who, fast: hook('kikimimi') === 'fast', record: (row) => recordGame(who, row),
          tierOf: (stage) => tierFor(currentReport()?.stats.level ?? null, stage), level: () => currentReport()?.stats.level ?? null,
          focus: (gm, lv) => (gm === 'long' ? currentLong(lv).piece : currentHenshin().focus)
        });
        g = it;
        untrack(() => it.open(lastLv(), { timer: lastTimer(), same: sameDefault() }));
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
      pages = [];
      story = null;
    };
  });
  /** A game left mid-way (‹): to the page it was started from (actions.ts done). */
  const leaveGame = () => act.done();
  // The voice session the opening tap began ends as the sheet closes (a game or not), and the packs held go.
  $effect(() => {
    if (open)
      return () => {
        voiceSession(false);
        packs.clear();
      };
  });

  /** When the Japanese shows (せってい's にほんごやく): every reveal and review row, only a miss's, or never. */
  let ja = $state<JaMode>(jaMode());
  /** My answer to the reveal's question was right (a miss's Japanese only: hidden then). */
  const right = $derived(v?.phase === 'reveal' && !!game && v.answers[v.i]?.k === game.items[v.i]?.answer);
  /** ✕: mid-game asks first (but with nothing to lose), and so does my lobby with others in it; otherwise closes (my
   *  lobby is cancelled for everyone: the session's leave). */
  function requestClose() {
    if (!story && ((mid && !lossless) || (inLobby && v?.amHost && !v.local && v.players.length > 1))) {
      cue('tick');
      asking = mid ? 'quit' : 'close';
    } else {
      cue('back');
      open = false;
    }
  }
  /** A backdrop tap or Esc: ‹ where there is one (mid-game: asking as it does); at the hub it closes. */
  const dismiss = (): boolean => {
    if (story) return false; // (a backdrop tap or Esc never stops a bedtime story: its ‹ or ✕ does)
    if (canBack) {
      back();
      return false;
    }
    return true;
  };
  /** やめる: ‹'s to the page under the game, else the sheet closed. */
  function quit() {
    const to = asking;
    asking = false;
    if (to === 'leave') leaveGame();
    else open = false;
  }
  const report = $derived(page?.k === 'record' && hosting ? currentReport() : null);
  /** What the buttons start (actions.ts), over this sheet's game and its stack. */
  const act = new KikiActions(() => game, {
    close: () => (open = false),
    pages: () => pages.length,
    setPages: (p) => (pages = p)
  });
  /** A bedtime chapter played at once (StoryFrame). */
  function playStory(unit: string, ch: number, seg = 0) {
    if (v?.phase === 'idle') act.startOwn();
    story = { unit, ch, seg };
  }
  function tile(k: Tile) {
    enter(k === 'asobu' ? { k: 'asobu' } : { k: 'record' });
  }
  // a game in sight (a lesson's card; a mode's page once it has dealt its own deck:
  // ModeDetail): its first question's packs fetched now; a look at the hub, あそぶ's list (its lobby's deck is not what a
  // mode's page deals), きろく or ずかん fetches none (game.svelte.ts ahead)
  $effect(() => {
    const g = game, on = !!lesson;
    untrack(() => g?.ahead(on));
  });
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

<Sheet bind:open tunes label={t('kiki.title')} variant="pop" ondismiss={dismiss} timed="kikimimi">
  <div class="titlebar"><NavBar {title} onback={canBack ? back : null} onclose={requestClose} sfx="self" lead={atHub ? gear : null} /></div>
  <div class="kk-body sheet-scroll" data-kikimimi data-phase={v?.phase} data-host={v?.amHost || undefined} data-kiki-at={story ? 'story-frame' : atHub ? 'hub' : hosting && page ? page.k : guest ? 'lobby' : undefined} data-kiki-night={story ? '' : undefined}
    data-kiki-ja={ja} data-kiki-right={right || undefined}>
    {#if game && v}
      {@const g = game}
      {#if story}
        {@const s = story}
        <Lazy load={() => import('./story/StoryFrame.svelte')}>{#snippet children(StoryFrame)}
          {#key `${s.unit}:${s.ch}`}
            <StoryFrame me={g.me} unit={s.unit} ch={s.ch} seg={s.seg} onclose={() => (open = false)}
              onlist={toStories} />
          {/key}
        {/snippet}</Lazy>
      {:else if v.notice}
        <div class="center" data-kiki-notice={v.notice}>
          <Host pose="bow" size={96} />
          <p class="say kana">{t(`kiki.notice.${v.notice}`)}</p>
          <button type="button" class="btn small" data-sfx="back" onclick={act.toHub}>{t('kiki.back')}</button>
        </div>
      {:else if atHub}
        <Lazy load={() => import('./hub/Hub.svelte')}>{#snippet children(Hub)}
          <Hub ontile={tile} />
        {/snippet}</Lazy>
      {:else if hosting && page}
        {#if page.k === 'asobu'}
          <Lazy load={() => import('./asobu/Asobu.svelte')}>{#snippet children(Asobu)}
            <Asobu onmode={(m) => enter(m === 'story' ? { k: 'story' } : { k: 'mode', m })} />
          {/snippet}</Lazy>
        {:else if page.k === 'mode'}
          <Lazy load={() => import('./mode/ModeDetail.svelte')}>{#snippet children(ModeDetail)}
            {#key page.m}<ModeDetail game={g} m={page.m} onpractice={() => act.practice()} />{/key}
          {/snippet}</Lazy>
        {:else if page.k === 'record'}
          <Lazy load={() => import('./Progress.svelte')}>{#snippet children(Progress)}
            {#if report}<Progress {report} onplay={() => (pages = [])} />{/if}
          {/snippet}</Lazy>
        {:else if page.k === 'settings'}
          <Lazy load={() => import('./settings/KikiSettings.svelte')}>{#snippet children(KikiSettings)}
            <KikiSettings game={g} {ja} onja={(m) => ((ja = m), keepJa(m))} />
          {/snippet}</Lazy>
        {:else if page.k === 'story'}
          <Lazy load={() => import('./story/StoryList.svelte')}>{#snippet children(StoryList)}
            <StoryList me={g.me} onplay={playStory} />
          {/snippet}</Lazy>
        {/if}
      {:else if v.phase === 'lobby' && lesson}
        <LessonIntro unit={lesson.unit} lesson={lesson.lesson} recheck={lesson.recheck} onstart={() => game?.go()} onback={back} />
      {:else if v.phase === 'lobby' && own}
        {@render ownView(own)}
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

  <!-- the ask: キャンセル (and its ✕) goes on, the coral verb leaves (the other confirms' footer) -->
  <Sheet bind:open={() => !!asking, (o) => { if (!o) asking = false; }} title={t(asking === 'close' ? 'kiki.closeAsk' : 'kiki.quit')}>
    <p class="ask-note" data-kiki-ask={asking || undefined}>{t(asking === 'close' ? 'kiki.closeAskBody' : 'kiki.quitBody')}</p>
    {#if asking !== 'close' && v && v.players.length > 1}<p class="ask-note" data-kiki-ask-others>{t('kiki.quitOthers')}</p>{/if}
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
  /* おやすみ ものがたり: the night palette (tokens.css --n-*, data-tod night) on the whole sheet, whatever the island's
     hour, a step deeper (the screen kept dim): the paper the night's lip, the cards its paper, under them deeper still */
  :global(dialog:has(> .inner > .kk-body[data-kiki-night])) {
    --bg: var(--n-lip); --surface: var(--n-lip); --lip: #232D5E; --card: var(--n-bg);
    --ctl: var(--n-bg); --ctl-off: #2A3468; --edge: var(--n-edge);
    --text: var(--n-text); --text-soft: var(--n-soft); --focus: var(--n-text); --leaf-text: #9EE6A6; --coral-text: #FFD0C6;
    --scrim: rgba(20, 24, 56, .5); --hl: rgba(255, 246, 224, .12); --warn-soft: var(--n-warn);
    color-scheme: dark;
  }
  /* the one scroller (as the other full-height sheets'): it bleeds 8px past the side padding so focus rings and lips show */
  .kk-body {
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
</style>
