<script lang="ts">
  // 英語すごろく, English Study's third tab (docs/sugoroku.md "Rules"), its own chunk (the tab's Lazy), its levels
  // menu (続きから / 新しいゲーム / 遊び方) → Setup (who plays, each one's level, the length) → the game (the board
  // full-bleed under a top overlay, ‹ ⋯ ✕ with the team's stars and the players' pills, and the turn's bottom sheet,
  // TurnPanel; the sheet folds to a bar to see the board, and the camera frames the part the two leave) → Results.
  // Played on one phone passed round (saved after every step: save.ts, so ‹ or ✕ mid-game leaves it to 続きから), or on
  // each player's own phone (online.svelte.ts: every action a move to the relay, the game the moves folded; a phone whose
  // turn it isn't watches, the player's panel live and read-only: view.ts). One rules path: an action is a move (online.ts applyMove), applied here when passed round,
  // sent when online. No ベル. The island is paused under it.
  import { untrack } from 'svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import NavBar from '#lib/components/ui/NavBar.svelte';
  import NavButton from '#lib/components/ui/NavButton.svelte';
  import Sheet from '#lib/components/ui/Sheet.svelte';
  import ActionSheet from '#lib/components/ui/ActionSheet.svelte';
  import { t } from '#lib/i18n/index.ts';
  import Icon from '#lib/components/ui/Icon.svelte';
  import ProgressBar from '#lib/components/ui/ProgressBar.svelte';
  import Avatar from '#lib/components/characters/Avatar.svelte';
  import Board from './Board.svelte';
  import Board3D from './Board3D.svelte';
  import Setup from './Setup.svelte';
  import TurnPanel from './TurnPanel.svelte';
  import Results from './Results.svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import { now } from '#lib/time/clock.ts';
  import { hook } from '#lib/world/devHooks.ts';
  import { REWARD, REWARD_GOAL, rewardOf, speakOn, teamGoal, teamStars, lastRound as isLast, newGame, boardFor, type Game, type Length, type Level, type Seat } from '../game.ts';
  import { pathOf } from '../board.ts';
  import { familyOfKey, layoutKey } from '../family.ts';
  import { DEVICE, getKey, localKV, readJson, writeJson } from '#lib/sync/storage.ts';
  import { rewardGame } from '#lib/store/actions.ts';
  import { fnv1a } from '#lib/random.ts';
  import { loadWords, type Words } from '../words.ts';
  import { loadSentences, type Line } from '../sentences.ts';
  import { clearGame, loadGame, saveGame } from '../save.ts';
  import { s } from '../i18n.ts';
  import type { Who } from '#lib/types.ts';
  import { applyMove, foldMoves, lengthCode, seatsCode, type Move } from '../online.ts';
  import { listen, nameOf as personName, online, sendMove, sendView, startOnline, updateNeeded } from '../online.svelte.ts';
  import { decode, isCurrent, type View as TurnView } from '../view.ts';

  interface Props {
    /** The tab is shown (English Study open on it). */
    active: boolean;
    onclose: () => void;
    /** Whether its top level (the menu) is shown: English Study's tab bar only there. */
    ontop?: (top: boolean) => void;
    /** The tab's: a game started or resumed goes to its own screen (the 3D board, /sugoroku), this way. */
    onscreen?: (mode: 'local' | 'online') => void;
    /** On the board's own screen (/sugoroku): this game, straight into play, the 3D board over the turn's panel. */
    screen?: 'local' | 'online';
  }
  let { active, onclose, ontop, onscreen, screen }: Props = $props();
  const open = $derived(active);
  $effect(() => ontop?.(view === 'menu'));
  type View = 'menu' | 'how' | 'setup' | 'play' | 'results';
  let view = $state<View>('menu');
  let game = $state<Game | null>(null);
  let saved = $state<Game | null>(null);
  /** Which game is shown: this phone's (passed round) or the online one (the moves folded). */
  let mode = $state<'local' | 'online'>('local');
  $effect(() => {
    if (!open) return;
    listen();
    untrack(() => {
      saved = loadGame();
      view = 'menu';
      // the board's own screen: its game at once (a passed-round one from the save, else back to the tab)
      if (screen === 'local') saved ? resume() : onclose();
      else if (screen === 'online') resumeOnline();
    });
  });
  const close = () => onclose();
  /** To the menu: the save as it is now (a game played since the opening). */
  const toMenu = () => (screen ? onclose() : ((saved = loadGame()), (view = 'menu')));

  // the words and lines (their own chunks), asked for as the sheet opens
  // (raw: never proxied, so a second assignment is no change; each asked for only while missing and not on its way:
  // an effect that set them again on every run looped in WebKit, the words arriving before the lines)
  let words = $state.raw<Words | null>(null);
  let lines = $state.raw<readonly Line[] | null>(null);
  let failed = $state(false);
  let asking = false;
  function load() {
    if (asking) return;
    asking = true;
    failed = false;
    Promise.all([words ?? loadWords().then((w) => (words = w)), lines ?? loadSentences().then((l) => (lines = l))])
      .catch(() => (failed = true))
      .finally(() => (asking = false));
  }
  $effect(() => {
    if (open && untrack(() => !words || !lines)) load();
  });

  // ---- seats
  const me = $derived<Who>(week.model?.me ?? 'A');
  const nameOf = personName;
  /** Who can play: the three of us, each as their own character (the island's look), me first. */
  const people = $derived<Who[]>(me === 'B' ? ['B', 'A', 'G'] : me === 'G' ? ['G', 'A', 'B'] : ['A', 'B', 'G']);
  let picked = $state<Who[]>([]);
  /** Each seat's level (ふつう till changed). */
  let levels = $state<Partial<Record<Who, Level>>>({});
  let length = $state<Length>('normal');
  const seatsOf = (ws: readonly Who[]): Seat[] => ws.map((who) => ({ who, name: nameOf(who), level: levels[who] ?? 2 }));
  /** 新しいゲーム's way: one phone passed round, or each on their own (members and the guest only, me among them). */
  let playMode = $state<'local' | 'online'>('local');
  /** The speaking step after a 絵 (game.ts speakOn): with the switch on and a person's key on this phone (the relay's
   *  /stt and /grade refuse the guest's: a guest's own phone gets none; passed round, this phone's key for everyone). */
  const speakable = $derived(speakOn(location.search) && !!getKey() && me !== 'G');
  /** The speech test's page (docs/speech-test.md), the page's own query kept (?demo, the e2e's hooks). */
  const toSpeech = () => {
    onclose();
    void goto(`${resolve('/speech')}${location.search}`);
  };
  function start() {
    if (playMode === 'online') {
      startOnline(seatsCode(seatsOf(picked)), lengthCode(length));
      return resumeOnline();
    }
    // (its board's family not the last game's: two games in a row look different; `?sgSeed=` the e2e's, pinned)
    const seed = hook('sgSeed') || `${now()}:${picked.join(',')}`, last = familyOfKey((game ?? saved)?.layout);
    let lay = seed;
    for (let k = 1; k < 20 && last && familyOfKey(layoutKey(lay)) === last; k++) lay = `${seed}~${k}`;
    const g0 = newGame(seatsOf(picked), seed, length, layoutKey(lay));
    shown = g0.players.map((p) => p.pos);
    mode = 'local';
    set(g0);
    toPlay();
  }
  /** Into play: on the board's screen here, from the tab to that screen. */
  function toPlay() {
    if (onscreen && !screen) return onscreen(mode);
    view = 'play';
  }
  function setup() {
    picked = people.slice(0, 2);
    view = 'setup';
  }
  /** もう一度遊ぶ: the setup again, the same table, levels and way. */
  function again(x: Game) {
    playMode = mode;
    picked = x.players.map((p) => p.who);
    levels = Object.fromEntries(x.players.map((p) => [p.who, p.level]));
    view = 'setup';
  }

  // ---- the game: every step saved; the heads walk the route a stone at a time to where the game has them
  let shown = $state<number[]>([]);
  let rolling = $state<number | null>(null);
  /** The dice's number shown while its walk is on (not a card's move). */
  let rolled = $state(0);
  function set(g: Game) {
    game = g;
    endOpen = false;
    if (shown.length !== g.players.length) shown = g.players.map((p) => p.pos);
    if (g.phase.k === 'end') {
      clearGame();
      saved = null;
      view = 'results';
    } else saveGame(g);
  }
  /** The online game: its moves folded (with the words and lines in: a word's bonus and a ぶん's line are the fold's). */
  const onlineGame = $derived(words && lines && online.cur.g ? foldMoves(online.cur.log, { words, lines, name: nameOf }) : null);
  const g = $derived(mode === 'online' ? onlineGame : game);
  // the 3D board's die and joy (Board3D): a roll's face; stars made (6+: a jump of joy, else a hop), あがり a jump
  let roll3 = $state<{ n: number; key: number } | null>(null);
  let cheer3 = $state<{ k: number; kind: 'joy' | 'small'; key: number } | null>(null);
  let madeSeen = -1;
  $effect(() => {
    const x = g;
    if (!x || !screen) return;
    untrack(() => {
      const key = (cheer3?.key ?? 0) + 1;
      if (madeSeen >= 0 && x.made.length > madeSeen) {
        const m = x.made[x.made.length - 1];
        cheer3 = { k: m.p, kind: m.stars >= 6 ? 'joy' : 'small', key };
      } else if (x.phase.k === 'home') cheer3 = { k: x.turn, kind: 'joy', key };
      madeSeen = x.made.length;
    });
  });
  const walking = $derived(!!g && g.players.some((p, i) => shown[i] !== p.pos));
  $effect(() => {
    if (!walking || !g) return;
    const ps = g.players;
    const id = setInterval(() => {
      shown = shown.map((v, i) => (v === ps[i].pos ? v : pathOf(board!, v, ps[i].pos, ps[i].ways)[0]));
      // (the dice's number kept while the walk waits at the fork)
      if (shown.every((v, i) => v === ps[i].pos)) (clearInterval(id), g?.phase.k !== 'fork' && (rolled = 0));
    }, screen ? 260 : 170);
    return () => clearInterval(id);
  });
  function resume() {
    if (!saved) return;
    shown = saved.players.map((p) => p.pos);
    mode = 'local';
    set(saved);
    toPlay();
  }
  function resumeOnline() {
    shown = [];
    mode = 'online';
    toPlay();
  }
  // an online game's heads start where it is (a new one, a resume); its end: the results
  let shownFor = '';
  $effect(() => {
    const og = mode === 'online' ? onlineGame : null;
    if (!og) return;
    untrack(() => {
      if (shownFor !== og.seed || shown.length !== og.players.length) (shownFor = og.seed), (shown = og.players.map((p) => p.pos));
      if (og.phase.k === 'end' && view === 'play') view = 'results';
    });
  });
  /** It's this phone's to play: passed round always; online, whose turn it is. */
  const myTurn = $derived(mode === 'local' || (!!g && g.players[g.turn].who === me));
  type Act = Omit<Move, 'g' | 'i' | 'who'>;
  /** A move as this phone's game folds it (passed round: whose turn it is plays it). */
  const applied = (x: Game, m: Act): Game =>
    applyMove(x, { ...m, g: '', i: 0, who: x.players[x.turn].who } as Move, { words: words ?? NO_WORDS, lines: lines ?? [], name: nameOf }) ?? x;
  /** (only a word asks the words, and a ことば waits for them) */
  const NO_WORDS: Words = { has: () => false, ja: () => '', from: () => [] };
  /** One action, one move: online sent (every phone, this one too, folds it), passed round applied here. */
  function act(m: Act): void {
    if (!g) return;
    if (mode === 'online') sendMove(m);
    else set(applied(g, m));
  }
  let rollTimer: ReturnType<typeof setInterval> | undefined;
  $effect(() => () => clearInterval(rollTimer));
  function doSpin() {
    if (!g || rolling !== null || !myTurn) return;
    const from = g;
    const next = applied(g, { a: 'roll' });
    const ph = next.phase;
    const n = 'spun' in ph ? ph.spun : 1;
    let k = 0;
    rolling = 1;
    // (the 3D die tumbles ~0.9 s: the move after it lands)
    if (screen) roll3 = { n, key: (roll3?.key ?? 0) + 1 };
    const id = (rollTimer = setInterval(() => {
      rolling = (k++ % 6) + 1;
      if (k < (screen ? 13 : 8)) return;
      clearInterval(id);
      rolling = null;
      if (g !== from) return; // (a new game or a resume since: this roll is void)
      rolled = n;
      if (mode === 'online') sendMove({ a: 'roll' });
      else set(next);
    }, 70));
  }

  const cur = $derived(g ? g.players[g.turn] : null);
  const board = $derived(g ? boardFor(g) : null);
  const ph = $derived(g?.phase ?? null);
  const lastRound = $derived(!!g && isLast(g));
  /** The heads walking or the die rolling: the sheet a bar with the die. */
  const moving = $derived(walking || rolling !== null);

  // ---- online, the turn's live view (view.ts): mine sent while my panel shows; another's shown while theirs does
  /** This panel: the game, its step (a try doesn't move it on), whose turn and the phase. */
  const panelKey = $derived(mode === 'online' && g && ph ? `${online.cur.g}:${g.n}:${g.turn}:${ph.k}` : '');
  const viewing = $derived(mode === 'online' && myTurn && !moving && !!ph && ph.k !== 'spin' && ph.k !== 'end');
  $effect(() => void (viewing || sendView(null)));
  $effect(() => () => sendView(null));
  /** The latest view of another's that read as this panel's: at the game's next move (a view of an older one let go),
   *  from whose turn it is, of this phase. Kept for the panel (a try moves the index on before the next view comes). */
  let seen = $state.raw<{ key: string; view: TurnView } | null>(null);
  $effect(() => {
    const v = online.view, x = g;
    if (!v || !x || mode !== 'online' || myTurn) return;
    untrack(() => {
      if (!isCurrent(v, { g: online.cur.g, i: online.cur.log.length, who: x.players[x.turn].who, p: x.phase.k })) return;
      const view = decode(v.p, v.s, v.x);
      if (view) seen = { key: panelKey, view };
    });
  });
  const watch = $derived(!myTurn && !moving && seen && seen.key === panelKey ? seen.view : null);
  // the play screen's overlays (the top bar and pills, the turn's sheet): their heights the board's insets
  let hudH = $state(88), sheetH = $state(140);
  /** The sheet folded to its bar (the board seen); every new phase opens it again. */
  let folded = $state(false);
  const phaseKey = $derived(g && ph ? `${g.n}:${g.turn}:${ph.k}:${moving}:${myTurn}` : '');
  $effect(() => {
    void phaseKey;
    folded = false;
  });
  let menuOpen = $state(false), howOpen = $state(false), endOpen = $state(false);
  /** The folded bar's name: the phase's, or whose turn it is. */
  const phaseName = $derived.by(() => {
    if (!ph || !cur) return '';
    if (!myTurn || ph.k === 'spin') return s('turnOf', { name: cur.name });
    const k = ({ word: 'wordTitle', sentence: 'sentenceTitle', picture: 'pictureTitle', event: 'eventTitle', home: 'homeTitle', fork: 'forkTitle' } as const)[ph.k as 'word'];
    return k ? s(k) : '';
  });
  // the fold's handle: a tap, or a drag down (the bar: a tap or a drag up)
  let dragY: number | null = null;
  const down = (e: PointerEvent) => ((dragY = e.clientY), (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId));
  function up(e: PointerEvent, fold: boolean) {
    if (dragY === null) return;
    const dy = e.clientY - dragY;
    dragY = null;
    if (Math.abs(dy) < 8 || (fold ? dy > 24 : dy < -24)) folded = fold;
  }

  /** A letter just picked up on the way (this turn's walk): 「Zを拾った！」 till the next turn. */
  let pickNote = $state('');
  let pocketsSeen: string[] = [];
  $effect(() => {
    const x = g;
    if (!x) return;
    untrack(() => {
      const now = x.players.map((p) => p.pocket.join(''));
      const k = now.findIndex((p, i) => pocketsSeen[i] !== undefined && p.length > pocketsSeen[i].length);
      if (k >= 0) pickNote = s('picked', { l: now[k].slice(-1).toUpperCase() });
      else if (x.phase.k === 'spin') pickNote = '';
      pocketsSeen = now;
    });
  });
  /** The team's last total on this phone (Results: beaten, said). */
  let lastTotal = $state<number | null>(null);
  /** The game's かいがら for each of us (0: not played enough: someone home or 3 rounds). */
  let shells = $state(0);
  let savedFor = '';
  $effect(() => {
    const x = g;
    if (!x || view !== 'results') return;
    untrack(() => {
      if (savedFor === x.seed) return;
      savedFor = x.seed;
      lastTotal = readJson<number>(localKV(), DEVICE.sugorokuLast);
      writeJson(localKV(), DEVICE.sugorokuLast, teamStars(x));
      // かいがら for everyone at the table (a game once: the record pays each of us once, whichever phone sends it)
      shells = rewardOf(x);
      if (shells) rewardGame(`sg-${fnv1a(x.seed).toString(36)}`, shells, x.players.map((p) => p.who));
    });
  });

  const headOf = (x: { who: Who }) => ({ person: x.who, worn: true });
</script>

  <div class="sg" data-sugoroku data-level={view}>
    {#if view === 'menu'}
      <div class="top"><NavBar pad title={s('title')} onclose={close} /></div>
      <div class="body sheet-scroll">
        {#if onlineGame && onlineGame.phase.k !== 'end' && online.cur.log[0]}
          <!-- the online game running with me in it: its card first, 参加 back into its screen -->
          {@const by = online.cur.log[0].who}
          <div class="card pad live" data-sg-online-card>
            <Avatar person={by} worn size={40} />
            <span class="nm">{s('startedBy', { name: nameOf(by) })}</span>
            <button type="button" class="btn small" data-sfx="open" data-sg-resume-online onclick={resumeOnline}>{s('join')}</button>
          </div>
        {:else if updateNeeded()}
          <!-- an online game started on another build's rules: it can't be played here (wire.ts otherRules) -->
          <p class="card pad note" data-sg-update>{s('updateApp')}</p>
        {/if}
        <div class="hero card pad">
          <p class="lead">{s('how2')}</p>
          <p class="note">{s('teamLine')}</p>
          {#if saved}
            <button type="button" class="btn" data-sfx="open" data-sg-resume onclick={resume}>{s('resume')}</button>
          {/if}
          <button type="button" class="btn" class:paper={!!saved} data-sfx="open" data-sg-new onclick={setup}>{s('newGame')}</button>
          <button type="button" class="btn small paper" data-sfx="page" data-sg-how onclick={() => (view = 'how')}>{s('howTo')}</button>
        </div>
      </div>
    {:else if view === 'how'}
      <div class="top"><NavBar pad title={s('howTo')} onback={toMenu} onclose={close} /></div>
      <div class="body sheet-scroll">
        <ol class="card pad how">
          <li>{s('how1')}</li><li>{s('how2')}</li><li>{s('how3')}</li><li>{s('how4')}</li><li>{s('how5')}</li><li>{s('how6', { n: REWARD, g: REWARD + REWARD_GOAL })}</li>
        </ol>
      </div>
    {:else if view === 'setup'}
      <Setup {people} {me} {nameOf} bind:picked bind:levels bind:length bind:playMode onstart={start} onspeech={toSpeech} onback={toMenu} onclose={close} />
    {:else if view === 'play' && g && cur && ph && board}
      <!-- the board full-bleed, never resized by a phase: the top overlay and the turn's sheet are its insets -->
      <div class="play" data-sg-turn={g.turn} data-sg-phase={ph.k} style:--hud="{hudH}px">
        <div class="stage">
          {#if screen}
            {#key board}<Board3D {board} players={g.players} {shown} turn={g.turn} roll={roll3} cheer={cheer3} top={hudH} bottom={sheetH} fork={ph.k === 'fork' && !moving}>
              {#snippet fallback()}<Board {board} players={g.players} {shown} turn={g.turn} top={hudH} bottom={sheetH} letters={g.letters} />{/snippet}
            </Board3D>{/key}
          {:else}
            <Board {board} players={g.players} {shown} turn={g.turn} top={hudH} bottom={sheetH} letters={g.letters} />
          {/if}
        </div>
        <div class="hud" bind:offsetHeight={hudH}>
          {#snippet tools()}<NavButton kind="tool" icon="more" label={s('menu')} popup sfx="open" data-sg-menu onclick={() => (menuOpen = true)} />{/snippet}
          {#snippet team()}
            <!-- the team's stars toward its goal (one number: a team game), and the round -->
            <span class="team obj-cream" data-sg-team={teamStars(g)}>
              <Icon name="star" size={16} soft />{#key teamStars(g)}<b class="bump">{teamStars(g)}</b>{/key}<span class="goal">/{teamGoal(g)}</span>
              <span class="tbar"><ProgressBar value={teamStars(g)} max={teamGoal(g)} h={6} fill="var(--c-yuzu)" decor /></span>
              <span class="round">{lastRound ? s('lastRound') : s('round', { n: g.round })}</span>
            </span>
          {/snippet}
          <NavBar pad title={s('title')} onback={toMenu} onclose={close} trailing={tools} middle={team} />
          <div class="scores">
            {#each g.players as p, i (i)}
              <span class="score obj-cream" class:now={i === g.turn} aria-current={i === g.turn ? 'true' : undefined} data-sg-score={i}>
                <Avatar {...headOf(p)} size={24} /><span class="pn">{p.name}</span><span class="tag" data-sg-level-tag>{s(`level.${p.level}`)}</span>
                {#each p.pocket as l, j (j)}<b class="pl" lang="en">{l.toUpperCase()}</b>{/each}
                {#if p.forced}<b class="pl must" lang="en">{p.forced.toUpperCase()}</b>{/if}
              </span>
            {/each}
          </div>
        </div>
        <div class="sheet obj-cream" class:folded={folded && !moving} bind:offsetHeight={sheetH}>
          {#if moving}
            <div class="bar">{#if rolling !== null || rolled}<span class="die" class:rolling={rolling !== null} data-sg-die>{rolling ?? rolled}</span><b>{rolling === null ? s('spun', { n: rolled }) : ''}</b>
              {:else}<b data-sg-moving>{s('walking')}</b>{/if}</div>
          {:else}
            {#if folded}
              <button type="button" class="bar unfold" data-sfx="open" aria-label={s('unfold')} data-sg-unfold
                onpointerdown={down} onpointerup={(e) => up(e, false)} onclick={(e) => e.detail === 0 && (folded = false)}>
                <b>{phaseName}</b><Icon name="chevron-up" size={20} />
              </button>
            {:else}
              <button type="button" class="handle" data-sfx="tick" aria-label={s('fold')} data-sg-fold
                onpointerdown={down} onpointerup={(e) => up(e, true)} onclick={(e) => e.detail === 0 && (folded = true)}><i></i></button>
            {/if}
            <div class="sbody" hidden={folded}>
              <TurnPanel {g} {board} {myTurn} {mode} connected={online.connected} {words} {lines} {failed} {speakable} {pickNote}
                onact={act} onspin={doSpin} onretry={load} {watch} onview={viewing ? sendView : undefined} />
            </div>
          {/if}
        </div>
      </div>
      <ActionSheet bind:open={menuOpen} title={s('title')} groups={[[{ id: 'how', label: s('howTo'), icon: 'info' }, { id: 'end', label: s('end'), icon: 'flag', hook: 'sg-end' }]]}
        onpick={(id) => (id === 'how' ? (howOpen = true) : (endOpen = true))} />
      <Sheet bind:open={howOpen} title={s('howTo')}>
        <ol class="how">
          <li>{s('how1')}</li><li>{s('how2')}</li><li>{s('how3')}</li><li>{s('how4')}</li><li>{s('how5')}</li><li>{s('how6', { n: REWARD, g: REWARD + REWARD_GOAL })}</li>
        </ol>
      </Sheet>
      <Sheet bind:open={endOpen} title={s('endAsk')}>
        <!-- (online: an end is everyone's, so the verb is the danger one, docs/design.md "Forms and confirms") -->
        <p class="note centre" data-sg-end-note>{mode === 'online' ? s('endNoteOnline') : s('endNote')}</p>
        {#snippet footer()}
          <div class="two-cta">
            <button type="button" class="btn paper" data-sfx="back" onclick={() => (endOpen = false)}>{t('common.cancel')}</button>
            <button type="button" class="btn" class:danger={mode === 'online'} data-sfx="confirm" data-sg-end-yes onclick={() => ((endOpen = false), act({ a: 'end' }))}>{s('end')}</button>
          </div>
        {/snippet}
      </Sheet>
    {:else if view === 'results' && g}
      <Results {g} {lastTotal} {shells} onback={toMenu} onclose={close} onagain={() => again(g)} />
    {:else if view === 'play'}
      <!-- (no game to show yet: the online one's moves and the words on their way, or a game of another build's rules) -->
      <div class="top"><NavBar pad title={s('title')} onback={toMenu} onclose={close} /></div>
      <div class="body sheet-scroll">
        {#if mode === 'online' && updateNeeded()}<p class="card pad note" data-sg-update>{s('updateApp')}</p>
        {:else if failed}<p class="note">{s('offline')}</p><button type="button" class="btn" data-sfx="tick" onclick={load}>{s('retry')}</button>
        {:else}<p class="note centre">{s('loading')}</p>{/if}
      </div>
    {/if}
  </div>

<style>
  /* the game's own tokens (its turns', below it): the letter tiles' paper, lip and darker edge; the mic's coral */
  .sg { position: absolute; inset: 0; display: flex; flex-direction: column; overflow: hidden; background: var(--surface);
    --sg-tile: #f6e7c6; --sg-tile-lip: #b99364; --sg-tile-edge: #8a6d48; --sg-rec: #f6b8a6; --sg-rec-lip: #c98a77; }
  .top { flex: none; background-color: var(--surface); }
  .body { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 10px;
    padding: 4px calc(12px + var(--safe-right)) calc(var(--safe-bottom) + 24px) calc(12px + var(--safe-left)); scrollbar-width: none; }
  /* (a scroller's column: its cards keep their height, never squeezed to fit) */
  .body > * { flex-shrink: 0; }
  .hero { display: flex; flex-direction: column; gap: 10px; }
  .live { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
  .live .nm { flex: 1; min-width: 0; font: 700 var(--fs-body)/1.4 var(--font-ui); }
  .lead { margin: 0 0 4px; font: 700 var(--fs-body)/1.5 var(--font-ui); text-wrap: pretty; }
  .how { margin: 0; padding-left: 28px !important; display: grid; gap: 8px; font-size: var(--fs-body); line-height: 1.5; }
  .note { margin: 0; font-size: var(--fs-s); color: var(--text-soft); text-wrap: pretty; }
  .nm { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .pl { display: inline-grid; place-items: center; min-width: 18px; height: 18px; border-radius: 5px; background: color-mix(in srgb, var(--c-mint) 55%, var(--c-cream)); font: 600 12px/1 var(--font-num); color: var(--c-ink); }
  .pl.must { background: color-mix(in srgb, var(--c-lilac) 65%, var(--c-cream)); box-shadow: 0 0 0 1.5px var(--c-ink); }
  .centre { text-align: center; }
  /* a score that changed pops once (stars in) */
  .bump { display: inline-block; animation: bump 420ms var(--ease-bounce); }
  @keyframes bump { 0% { transform: scale(1); } 35% { transform: scale(1.45); color: var(--c-gold); } 100% { transform: scale(1); } }
  /* the dice shake while rolling */
  .die.rolling { animation: shake 140ms linear infinite; }
  @keyframes shake { 0%, 100% { transform: rotate(0); } 25% { transform: rotate(-10deg) translateY(-2px); } 75% { transform: rotate(10deg) translateY(1px); } }
  /* ---- the play screen: the board under everything, the top overlay and the turn's sheet over it */
  .play { position: absolute; inset: 0; overflow: hidden; }
  .stage { position: absolute; inset: 0; }
  .hud { position: absolute; inset: 0 0 auto; z-index: 1; padding-bottom: 4px; pointer-events: none; }
  .hud > :global(*) { pointer-events: auto; }
  /* the team's pill in the title's place: ★ 5/120, a thin bar, the round */
  .team { display: flex; align-items: center; gap: 5px; height: 32px; width: min(208px, 100%); padding: 0 12px 0 10px; box-sizing: border-box;
    border-radius: var(--r-pill); background: color-mix(in srgb, var(--c-cream) 92%, transparent); box-shadow: 0 2px 0 var(--c-edge); color: var(--c-gold); }
  .team b { font: 600 17px/1 var(--font-num); color: var(--c-ink); }
  .team .goal { font: 600 12px/1 var(--font-num); color: var(--text-soft); }
  .tbar { flex: 1; min-width: 24px; display: flex; }
  .round { flex: none; font: 700 12px/1 var(--font-ui); color: var(--text-soft); white-space: nowrap; }
  /* the players' pills: 32 tall, 92 % cream (no backdrop blur: costly in WebKit); whose turn it is yuzu */
  .scores { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; width: fit-content; margin-top: 4px; padding: 0 calc(12px + var(--safe-right)) 0 calc(12px + var(--safe-left)); }
  .score { display: inline-flex; align-items: center; gap: 4px; height: 32px; padding: 0 10px 0 4px; box-sizing: border-box; border-radius: var(--r-pill);
    background: color-mix(in srgb, var(--c-cream) 92%, transparent); box-shadow: 0 2px 0 var(--c-edge); color: var(--text); }
  .score.now { background: var(--c-yuzu); box-shadow: 0 2px 0 var(--c-yuzu-lip); }
  /* the player's name (ellipsized: three pills fit a 375 phone) and their level, the kit's 13 px .tag */
  .pn { min-width: 0; max-width: 5.5em; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font: 700 var(--fs-s)/1 var(--font-ui); }
  .score .tag { padding: 2px 7px; }
  /* the turn's sheet: cream at every time of day (.obj-cream: the day's text inside, as the team pill and the chips), its content's height (at most what leaves the board 160 px), folded a 56 px bar */
  .sheet { position: absolute; left: 0; right: 0; bottom: 0; z-index: 1; display: flex; flex-direction: column;
    max-height: max(220px, calc(100% - var(--hud, 88px) - 160px)); padding: 0 calc(12px + var(--safe-right)) calc(6px + var(--safe-bottom)) calc(12px + var(--safe-left));
    box-sizing: border-box; border-radius: var(--r-card) var(--r-card) 0 0; background: var(--c-cream); color: var(--text); box-shadow: 0 -2px 0 var(--c-edge), 0 -6px 18px rgb(60 40 10 / .12); }
  .sheet.folded, .sheet:has(> .bar) { padding-bottom: var(--safe-bottom); }
  /* (a scroller clips at its padding box: the 6 px under and 4 px beside hold the last row's 3–4 px lips and a sent tile's
     2 px ring, which spill out of the tiles' and buttons' boxes) */
  .sbody { min-height: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; display: flex; flex-direction: column; gap: 10px;
    margin: 0 -4px; padding: 2px 4px 6px; }
  .sbody[hidden] { display: none; }
  .sbody > :global(*) { flex-shrink: 0; }
  .sbody :global(.btn) { margin: 0; min-height: 48px; }
  /* the fold's handle: a 5 × 36 bar, its hit 44 tall */
  .handle { position: relative; flex: none; display: grid; place-items: center; width: 120px; height: 24px; margin: 0 auto; padding: 0; appearance: none; border: 0;
    background: none; cursor: pointer; touch-action: none; -webkit-tap-highlight-color: transparent; }
  .handle::after { content: ''; position: absolute; inset: -4px 0 -16px; }
  .handle i { width: 36px; height: 5px; border-radius: 3px; background: color-mix(in srgb, var(--c-edge) 80%, transparent); }
  /* the 56 px bar: the walk's die and its number, or the folded sheet's phase ▲ */
  .bar { flex: none; display: flex; align-items: center; justify-content: center; gap: 10px; height: 56px; font: 700 var(--fs-body)/1.2 var(--font-ui); }
  .unfold { width: 100%; padding: 0; margin: 0; appearance: none; border: 0; background: none; color: var(--c-ink); cursor: pointer; touch-action: none; -webkit-tap-highlight-color: transparent; }
  .unfold :global(svg) { color: var(--text-soft); }
  .die { width: 40px; height: 40px; display: grid; place-items: center; border-radius: var(--r-chip); background: var(--c-card);
    box-shadow: 0 3px 0 var(--c-edge); font: 600 24px/1 var(--font-num); }
</style>
