<script lang="ts">
  // 英語すごろく, English Study's third tab (docs/sugoroku.md "Rules"), its own chunk (the tab's Lazy), its levels
  // menu (続きから / 新しいゲーム / あそびかた) → だれが遊ぶ？ (2–3 of us, each as their own character, in the
  // order picked, each its English level) → the game (the board full-bleed under a top overlay, ‹ ⋯ ✕ with the team's
  // stars and the players' chips, and the turn's bottom sheet: whose turn and the dice, the fork's choice, then the
  // space's ことば, ぶん, 絵, イベント or あがり, its action the last row; the sheet folds to a bar to see the board, and
  // the camera frames the part the two leave) → 結果 (the ranking, ふりかえり:
  // a no-fail matching of the game's words, and 今日のことば). Played on one phone passed round (saved after every step:
  // save.ts, so ‹ or ✕ mid-game leaves it to 続きから), or on each player's own phone (online.svelte.ts: every action a
  // move to the relay, the game the moves folded; a phone whose turn it isn't watches). No ベル. The island is paused under it.
  import { untrack } from 'svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import NavBar from '#lib/components/ui/NavBar.svelte';
  import NavButton from '#lib/components/ui/NavButton.svelte';
  import Sheet from '#lib/components/ui/Sheet.svelte';
  import ActionSheet from '#lib/components/ui/ActionSheet.svelte';
  import { t } from '#lib/i18n/index.ts';
  import Icon from '#lib/components/ui/Icon.svelte';
  import Avatar from '#lib/components/characters/Avatar.svelte';
  import Board from './Board.svelte';
  import Board3D from './Board3D.svelte';
  import WordTurn from './WordTurn.svelte';
  import SentenceTurn from './SentenceTurn.svelte';
  import PictureTurn from './PictureTurn.svelte';
  import Review from './Review.svelte';
  import { PICTURES } from '../pictures.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { now } from '#lib/time/clock.ts';
  import { CARDS } from '../cards.ts';
  import { rewardOf, teamGoal, teamStars, giveLetter, choose, eventDone, pictureDone, tried, finish, homeDone, lastRound as isLast, LEVEL, MAX_PLAYERS, MIN_PLAYERS, newGame, playWord, sentenceAsWord,
    sentenceDone, spin, swap, rollMode, wordScore, HOME_BONUS, type Game, type Length, type Level as SeatLevel, type Seat } from '../game.ts';
  import { pathOf, toGoal } from '../board.ts';
  import { DEVICE, localKV, readJson, writeJson } from '#lib/sync/storage.ts';
  import { rewardGame } from '#lib/store/actions.ts';
  import { fnv1a } from '#lib/random.ts';
  import { loadWords, type Words } from '../words.ts';
  import { loadSentences, pickSentence, type Line, type Sentence } from '../sentences.ts';
  import { clearGame, loadGame, saveGame } from '../save.ts';
  import { s } from '../i18n.ts';
  import type { Who } from '#lib/types.ts';
  import { foldMoves, lengthCode, seatsCode, type Move } from '../online.ts';
  import { listen, nameOf as personName, online, sendMove, startOnline } from '../online.svelte.ts';

  interface Props {
    /** The tab is shown (English Study open on it). */
    active: boolean;
    /** Opened by an invitation's 参加: straight into the online game. */
    join?: boolean;
    onclose: () => void;
    /** Whether its top level (the menu) is shown: English Study's tab bar only there. */
    ontop?: (top: boolean) => void;
    /** The tab's: a game started or resumed goes to its own screen (the 3D board, /sugoroku), this way. */
    onscreen?: (mode: 'local' | 'online') => void;
    /** On the board's own screen (/sugoroku): this game, straight into play, the 3D board over the turn's panel. */
    screen?: 'local' | 'online';
  }
  let { active, join = false, onclose, ontop, onscreen, screen }: Props = $props();
  const open = $derived(active);
  $effect(() => ontop?.(level === 'menu'));
  type Level = 'menu' | 'how' | 'setup' | 'play' | 'results';
  let level = $state<Level>('menu');
  let game = $state<Game | null>(null);
  let saved = $state<Game | null>(null);
  /** Which game is shown: this phone's (passed round) or the online one (the moves folded). */
  let mode = $state<'local' | 'online'>('local');
  $effect(() => {
    if (!open) return;
    listen();
    untrack(() => {
      saved = loadGame();
      level = 'menu';
      // an invitation's 参加: straight into the online game, once it's folded (the words and lines may still be on their way)
      wantOnline = join;
      // the board's own screen: its game at once (a passed-round one from the save, else back to the tab)
      if (screen === 'local') saved ? resume() : onclose();
      else if (screen === 'online') resumeOnline();
    });
  });
  let wantOnline = $state(false);
  $effect(() => {
    if (wantOnline && onlineGame && onlineGame.phase.k !== 'end') untrack(() => ((wantOnline = false), resumeOnline()));
  });
  const close = () => onclose();
  /** To the menu: the save as it is now (a game played since the opening). */
  const toMenu = () => (screen ? onclose() : ((saved = loadGame()), (level = 'menu')));

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
  let levels = $state<Partial<Record<Who, SeatLevel>>>({});
  const LEVELS = [1, 2, 3] as const;
  let length = $state<Length>('normal');
  const LENGTHS = ['short', 'normal', 'long'] as const;
  const seatsOf = (ws: readonly Who[]): Seat[] => ws.map((who) => ({ who, name: nameOf(who), level: levels[who] ?? 2 }));
  const toggle = (w: Who) => (picked = picked.includes(w) ? picked.filter((p) => p !== w) : picked.length < MAX_PLAYERS ? [...picked, w] : picked);
  /** 新しいゲーム's way: one phone passed round, or each on their own (members and the guest only, me among them). */
  let playMode = $state<'local' | 'online'>('local');
  const MODES = ['local', 'online'] as const;
  const canStart = $derived(picked.length >= MIN_PLAYERS && (playMode === 'local' || picked.includes(me)));
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
    const g0 = newGame(seatsOf(picked), `${now()}:${picked.join(',')}`, length);
    shown = g0.players.map((p) => p.pos);
    mode = 'local';
    set(g0);
    toPlay();
  }
  /** Into play: on the board's screen here, from the tab to that screen. */
  function toPlay() {
    if (onscreen && !screen) return onscreen(mode);
    level = 'play';
  }
  function setup() {
    picked = people.slice(0, 2);
    level = 'setup';
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
      level = 'results';
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
      shown = shown.map((v, i) => (v === ps[i].pos ? v : pathOf(v, ps[i].pos, ps[i].branch)[0]));
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
      if (og.phase.k === 'end' && level === 'play') level = 'results';
    });
  });
  /** It's this phone's to play: passed round always; online, whose turn it is. */
  const myTurn = $derived(mode === 'local' || (!!g && g.players[g.turn].who === me));
  /** One action: on this phone's game the rule itself, online its move (every phone, this one too, folds it). */
  function act(rule: (x: Game) => Game, move: Omit<Move, 'g' | 'i' | 'who'>): void {
    if (!g) return;
    if (mode === 'online') sendMove(move);
    else set(rule(g));
  }
  let rollTimer: ReturnType<typeof setInterval> | undefined;
  $effect(() => () => clearInterval(rollTimer));
  function doSpin() {
    if (!g || rolling !== null || !myTurn) return;
    const from = g;
    const next = spin(g);
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
  const ph = $derived(g?.phase ?? null);
  const lastRound = $derived(!!g && isLast(g));
  /** The heads walking or the die rolling: the sheet a bar with the die. */
  const moving = $derived(walking || rolling !== null);
  // the play screen's overlays (the top bar and chips, the turn's sheet): their heights the board's insets
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
  /** The roll's one note, the most important: a letter sent, one picked up, then the dice's rule. */
  const spinNote = $derived.by(() => {
    if (!g || !cur) return '';
    if (cur.forced) return s('hasForced', { l: cur.forced.toUpperCase() });
    if (pickNote) return pickNote;
    const m = rollMode(g);
    return m === 'fast' ? s('twice') : m === 'slow' ? s('slowRoll') : '';
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
  /** むずかしい's event cards: the Japanese on a tap. */
  let cardJa = $state(false);
  $effect(() => void (ph?.k === 'event' && (cardJa = false)));

  /** The line for this ぶん space: the seat's level's, none used twice (its pick kept in the phase). */
  const line = $derived.by((): Sentence | null => {
    if (!g || !cur || ph?.k !== 'sentence' || !lines) return null;
    const used = new Set(g.made.filter((m) => m.kind === 'sentence').map((m) => m.text));
    return pickSentence(lines, cur.level, ph.r, used);
  });

  const card = $derived(ph?.k === 'event' ? CARDS[ph.card] : null);
  /** おくりもの: the pocket letter being sent, and who may get one (on the way, none waiting; whoever's furthest back first). */
  let giving = $state<string | null>(null);
  const takers = $derived(g ? g.players.filter((p, i) => i !== g.turn && p.home === null && !p.forced)
    .sort((a, b) => toGoal(b.pos, b.branch) - toGoal(a.pos, a.branch)) : []);
  $effect(() => void (g?.turn, (giving = null)));
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
  /** The end: each player's one good thing (their longest word, the pictures they spelt, the lines they put right), and
   *  the team's last total on this phone (beaten: said; not: nothing). */
  function highlightOf(x: Game, k: number): string {
    const mine = x.made.filter((m) => m.p === k);
    const longest = mine.filter((m) => m.kind === 'word').sort((a, b) => b.text.length - a.text.length)[0];
    const pics = mine.filter((m) => m.kind === 'picture').length, lines = mine.filter((m) => m.kind === 'sentence').length;
    if (longest && longest.text.length >= 5) return s('hlLongest', { w: longest.text });
    if (pics) return s('hlPics', { n: pics });
    if (lines) return s('hlLines', { n: lines });
    if (longest) return s('hlWord', { w: longest.text });
    return s('hlCheer');
  }
  let lastTotal = $state<number | null>(null);
  /** The game's かいがら for each of us (0: not played enough: someone home or 3 rounds). */
  let shells = $state(0);
  let savedFor = '';
  $effect(() => {
    const x = g;
    if (!x || level !== 'results') return;
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
  /** A card's effect as its chip says it. */
  function effectOf(c: (typeof CARDS)[number]): string {
    if (c.stars) return s('effStars', { n: c.stars });
    if (c.gift) return s('effGift', { n: c.gift });
    if (c.move) return s('effMove', { n: c.move });
    if (c.again) return s('effAgain');
    return '';
  }
  /** ふりかえり's pairs: the game's things with Japanese, newest first, one a text, up to five. */
  const pairs = $derived.by(() => {
    if (!g) return [];
    const seen = new Set<string>(), out: { en: string; ja: string }[] = [];
    const ok = (en: string, ja: string) => !seen.has(en) && !out.some((x) => x.ja === ja);
    for (const m of [...g.made].reverse()) if (m.ja && ok(m.text, m.ja) && out.length < 5) (seen.add(m.text), out.push({ en: m.text, ja: m.ja }));
    return out;
  });
  const cardParts = (en: string) => en.split(/\*([^*]+)\*/g).map((t, i) => ({ t, key: i % 2 === 1 }));

  const headOf = (x: { who: Who }) => ({ person: x.who, worn: true });
</script>

  <div class="sg" data-sugoroku data-level={level}>
    {#if level === 'menu'}
      <div class="top"><NavBar pad title={s('title')} onclose={close} /></div>
      <div class="body sheet-scroll">
        <div class="hero card pad">
          <p class="lead">{s('how2')}</p>
          {#if onlineGame && onlineGame.phase.k !== 'end'}
            <button type="button" class="btn" data-sfx="open" data-sg-resume-online onclick={resumeOnline}>{s('onlineResume')}</button>
          {/if}
          {#if saved}
            <button type="button" class="btn" data-sfx="open" data-sg-resume onclick={resume}>{s('resume')}</button>
          {/if}
          <button type="button" class="btn" class:paper={!!saved} data-sfx="open" data-sg-new onclick={setup}>{s('newGame')}</button>
          <button type="button" class="btn small paper" data-sfx="page" data-sg-how onclick={() => (level = 'how')}>{s('howTo')}</button>
        </div>
      </div>
    {:else if level === 'how'}
      <div class="top"><NavBar pad title={s('howTo')} onback={toMenu} onclose={close} /></div>
      <div class="body sheet-scroll">
        <ol class="card pad how">
          <li>{s('how1')}</li><li>{s('how2')}</li><li>{s('how3')}</li><li>{s('how4')}</li><li>{s('how5')}</li>
        </ol>
      </div>
    {:else if level === 'setup'}
      <div class="top"><NavBar pad title={s('setupTitle')} onback={toMenu} onclose={close} /></div>
      <div class="body sheet-scroll">
        <span class="seg wide2" role="radiogroup" aria-label={s('mode')}>
          {#each MODES as md (md)}
            <button type="button" role="radio" class="sg-chip" aria-checked={playMode === md} data-sfx="none" data-sg-mode={md}
              onclick={() => (playMode = md)}>{s(`mode.${md}`)}</button>
          {/each}
        </span>
        <p class="note">{playMode === 'online' ? s('onlineNote') : s('setupNote')}</p>
        <div class="seats" data-sg-seats>
          {#each people as w (w)}
            {@const n = picked.indexOf(w)}
            <button type="button" class="seat" class:on={n >= 0} aria-pressed={n >= 0} data-sfx="tick" data-sg-seat={w} onclick={() => toggle(w)}>
              <Avatar person={w} worn size={52} />
              <span class="nm">{nameOf(w)}</span>
              {#if n >= 0}<span class="ord">{n + 1}</span>{/if}
            </button>
          {/each}
        </div>
        {#if picked.length}
          <h3 class="sec-label">{s('levelNote')}</h3>
          <div class="card dense levels" role="list">
            {#each picked as k (k)}
              <div class="row lrow" role="listitem" data-sg-level-row={k}>
                <Avatar person={k} worn size={32} /><span class="nm">{nameOf(k)}</span>
                <span class="seg" role="radiogroup" aria-label={s('levelOf', { name: nameOf(k) })}>
                  {#each LEVELS as lv (lv)}
                    <button type="button" role="radio" class="sg-chip" aria-checked={(levels[k] ?? 2) === lv} data-sfx="none" data-sg-level={lv}
                      onclick={() => (levels = { ...levels, [k]: lv })}>{s(`level.${lv}`)}</button>
                  {/each}
                </span>
              </div>
            {/each}
          </div>
        {/if}
        {#if playMode === 'online' && !picked.includes(me)}<p class="note">{s('meNeeded')}</p>{/if}
        <h3 class="sec-label">{s('length')}</h3>
        <span class="seg wide2" role="radiogroup" aria-label={s('length')}>
          {#each LENGTHS as L (L)}
            <button type="button" role="radio" class="sg-chip" aria-checked={length === L} data-sfx="none" data-sg-length={L} onclick={() => (length = L)}>{s(`length.${L}`)}</button>
          {/each}
        </span>
        <button type="button" class="btn" data-sfx="confirm" data-sg-start disabled={!canStart} onclick={start}>{s('start')}</button>
        <!-- the relay's Whisper on trial (docs/speech-test.md) -->
        <button type="button" class="speech" data-sfx="tick" data-sg-speech onclick={toSpeech}>{s('speechTest')}</button>
      </div>
    {:else if level === 'play' && g && cur && ph}
      <!-- the board full-bleed, never resized by a phase: the top overlay and the turn's sheet are its insets -->
      <div class="play" data-sg-turn={g.turn} data-sg-phase={ph.k} style:--hud="{hudH}px">
        <div class="stage">
          {#if screen}
            <Board3D players={g.players} {shown} turn={g.turn} roll={roll3} cheer={cheer3} top={hudH} bottom={sheetH} fork={ph.k === 'fork' && !moving}>
              {#snippet fallback()}<Board players={g.players} {shown} turn={g.turn} top={hudH} bottom={sheetH} letters={g.letters} />{/snippet}
            </Board3D>
          {:else}
            <Board players={g.players} {shown} turn={g.turn} top={hudH} bottom={sheetH} letters={g.letters} />
          {/if}
        </div>
        <div class="hud" bind:offsetHeight={hudH}>
          {#snippet tools()}<NavButton kind="tool" icon="more" label={s('menu')} popup sfx="open" data-sg-menu onclick={() => (menuOpen = true)} />{/snippet}
          {#snippet team()}
            <!-- the team's stars toward its goal (one number: a team game), and the round -->
            <span class="team" data-sg-team={teamStars(g)}>
              <Icon name="star" size={16} soft />{#key teamStars(g)}<b class="bump">{teamStars(g)}</b>{/key}<span class="goal">/{teamGoal(g)}</span>
              <span class="bar"><i style:width="{Math.min(100, (teamStars(g) / teamGoal(g)) * 100)}%"></i></span>
              <span class="round">{lastRound ? s('lastRound') : s('round', { n: g.round })}</span>
            </span>
          {/snippet}
          <NavBar pad title={s('title')} onback={toMenu} onclose={close} trailing={tools} middle={team} />
          <div class="scores">
            {#each g.players as p, i (i)}
              <span class="score" class:now={i === g.turn} data-sg-score={i}>
                <Avatar {...headOf(p)} size={24} /><small class="lv">{s(`level.${p.level}`)}</small>
                {#each p.pocket as l, j (j)}<b class="pl" lang="en">{l.toUpperCase()}</b>{/each}
                {#if p.forced}<b class="pl must" lang="en">{p.forced.toUpperCase()}</b>{/if}
              </span>
            {/each}
          </div>
        </div>
        <div class="sheet" class:folded={folded && !moving} bind:offsetHeight={sheetH}>
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
              {#if !myTurn && ph.k !== 'end'}
                <div class="who" data-sg-waiting>
                  <Avatar {...headOf(cur)} size={40} />
                  <div class="txt">
                    <p class="turnof">{s('turnOf', { name: cur.name })}</p>
                    <p class="note one">{#if !online.connected}{s('offlineNote')}{:else if g.made.length}{@const m = g.made[g.made.length - 1]}{s('lastMove', { name: g.players[m.p].name, text: m.text, n: m.stars })}{:else}{s('thinking')}{/if}</p>
                  </div>
                </div>
              {:else if ph.k === 'spin'}
                <div class="who">
                  <Avatar {...headOf(cur)} size={48} />
                  <div class="txt">
                    <p class="turnof">{s('turnOf', { name: cur.name })}</p>
                    {#if mode === 'local'}<p class="note">{s('passTo', { name: cur.name })}</p>{/if}
                  </div>
                </div>
                {#if spinNote}<p class="note one" data-sg-picked={spinNote === pickNote ? '' : undefined}>{spinNote}</p>{/if}
                {#if cur.pocket.length && takers.length}
                  <!-- おくりもの: a pocket letter to someone (their next word uses it: +3 for the team) -->
                  <div class="gift" data-sg-gift>
                    {#if giving}
                      <span class="note">{s('sendTo', { l: giving.toUpperCase() })}</span>
                      {#each takers as tk (tk.who)}
                        <button type="button" class="sg-chip" data-sfx="confirm" data-sg-give={tk.who}
                          onclick={() => { const l = giving!; giving = null; act((x) => giveLetter(x, l, tk.who), { a: 'gift', ch: l, to: tk.who }); }}>
                          <Avatar person={tk.who} worn size={20} /> {tk.name}</button>
                      {/each}
                      <button type="button" class="sg-chip" data-sfx="back" onclick={() => (giving = null)}>{s('cancel')}</button>
                    {:else}
                      <span class="note">{s('sendLetter')}</span>
                      {#each cur.pocket as l, j (j)}<button type="button" class="sg-chip" data-sfx="tick" data-sg-pocket={l} onclick={() => (giving = l)} lang="en">{l.toUpperCase()}</button>{/each}
                    {/if}
                  </div>
                {/if}
                <button type="button" class="btn" data-sfx="confirm" data-sg-spin onclick={() => doSpin()}>{s('spin')}</button>
              {:else if ph.k === 'fork'}
                <div class="fork" data-sg-fork>
                  <p class="ask">{s('forkAsk', { n: ph.left })}</p>
                  <div class="ways">
                    {#each [0, 1] as const as b (b)}
                      <button type="button" class="way" data-sfx="confirm" data-sg-branch={b} onclick={() => act((x) => choose(x, b), { a: 'fork', b })}>
                        <b>{s(`branch.${b}`)}</b><small>{s(`branch.${b}.note`)}</small>
                      </button>
                    {/each}
                  </div>
                </div>
              {:else if ph.k === 'word'}
                {#if ph.rested}<p class="note one" data-sg-rested>{s('restedNote')}</p>{/if}
                {#if words}
                  {#key `${g.n}`}
                    <WordTurn rack={cur.rack} pocket={cur.pocket} forced={cur.forced} lucky={g.lucky} mult={ph.mult} minLen={LEVEL[cur.level].minLen} hintHalf={LEVEL[cur.level].hintHalf}
                      hinted0={ph.hinted} onhint={() => act((x) => tried(x, { hinted: true }), { a: 'try', h: 1 })} {words}
                      score={(w, c, h) => wordScore(g, w, c, h)}
                      onplay={(w, h) => act((x) => playWord(x, w, { everyday: !!words!.ja(w), ja: words!.ja(w), hinted: h }), { a: 'word', w, ...(h ? { h: 1 } : {}) })}
                      onswap={() => act(swap, { a: 'swap' })} />
                  {/key}
                {:else if failed}
                  <p class="note">{s('offline')}</p><button type="button" class="btn" data-sfx="tick" onclick={load}>{s('retry')}</button>
                {:else}<p class="note">{s('loading')}</p>{/if}
              {:else if ph.k === 'sentence'}
                {#if line}
                  {#key line.en}<SentenceTurn {line} seed={g.seed} hideJa={cur.level === 3} misses0={ph.misses} peeked0={ph.peeked} ontry={(tr) => act((x) => tried(x, tr), { a: 'try', m: tr.misses, ...(tr.peeked ? { p: 1 } : {}) })} ondone={(o) => act((x) => sentenceDone(x, { ...o, text: line.en, ja: line.ja }), { a: 'sent', m: o.misses, ...(o.unseen ? { u: 1 } : {}) })} />{/key}
                {:else if failed || lines}
                  <p class="note">{lines ? s('noLine') : s('offline')}</p>
                  <button type="button" class="btn" data-sfx="tick" onclick={() => act(sentenceAsWord, { a: 'noline' })}>{s('next')}</button>
                {:else}<p class="note">{s('loading')}</p>{/if}
              {:else if ph.k === 'picture'}
                {#key ph.item}<PictureTurn pic={PICTURES[ph.item]} level={cur.level} seed={g.seed} misses0={ph.misses} ontry={(tr) => act((x) => tried(x, tr), { a: 'try', m: tr.misses })} ondone={(m) => act((x) => pictureDone(x, m), { a: 'pic', m })} />{/key}
              {:else if ph.k === 'event' && card}
                <div class="event" data-sg-event={ph.card}>
                  <span class="tagrow">{#if card.who}<Avatar person="G" villager={card.who} size={32} />{/if}<span class="tag">{s('eventTitle')}</span></span>
                  <p class="en" lang="en">{#each cardParts(card.en) as part, i (i)}{#if part.key}<b>{part.t}</b>{:else}{part.t}{/if}{/each}</p>
                  {#if cur.level < 3 || cardJa}<p class="ja">{card.ja}</p>
                  {:else}<button type="button" class="sg-chip peek" data-sfx="tick" data-sg-card-ja onclick={() => (cardJa = true)}>{s('peek')}</button>{/if}
                  <div class="actrow">
                    <span class="chip-eff" data-sg-effect>{effectOf(card)}</span>
                    <button type="button" class="btn" data-sfx="confirm" data-sg-next onclick={() => act(eventDone, { a: 'ev' })}>{s('ok')}</button>
                  </div>
                </div>
              {:else if ph.k === 'home'}
                <div class="event" data-sg-home>
                  <span class="tagrow"><Avatar {...headOf(cur)} size={32} /><span class="tag">{s('homeTitle')}</span></span>
                  <p class="ja big">{s('homeTeam', { b: HOME_BONUS })}</p>
                  <button type="button" class="btn" data-sfx="confirm" data-sg-next onclick={() => act(homeDone, { a: 'home' })}>{s('next')}</button>
                </div>
              {/if}
            </div>
          {/if}
        </div>
      </div>
      <ActionSheet bind:open={menuOpen} title={s('title')} groups={[[{ id: 'how', label: s('howTo'), icon: 'info' }, { id: 'end', label: s('end'), icon: 'flag', hook: 'sg-end' }]]}
        onpick={(id) => (id === 'how' ? (howOpen = true) : (endOpen = true))} />
      <Sheet bind:open={howOpen} title={s('howTo')}>
        <ol class="how">
          <li>{s('how1')}</li><li>{s('how2')}</li><li>{s('how3')}</li><li>{s('how4')}</li><li>{s('how5')}</li>
        </ol>
      </Sheet>
      <Sheet bind:open={endOpen} title={s('endAsk')}>
        <p class="note centre">{s('endNote')}</p>
        {#snippet footer()}
          <div class="two-cta">
            <button type="button" class="btn paper" data-sfx="back" onclick={() => (endOpen = false)}>{t('common.cancel')}</button>
            <button type="button" class="btn" data-sfx="confirm" data-sg-end-yes onclick={() => ((endOpen = false), act(finish, { a: 'end' }))}>{s('end')}</button>
          </div>
        {/snippet}
      </Sheet>
    {:else if level === 'results' && g}
      <div class="top"><NavBar pad title={s('results')} onback={toMenu} onclose={close} /></div>
      <div class="body sheet-scroll" data-sg-results>
        <!-- a team game: no ranking; the team's stars and goal, each one's good thing, what we learned together -->
        <div class="card pad podium" data-sg-team-end>
          <p class="win">{s('endTitle')}</p>
          <p class="total"><Icon name="star" size={22} soft /><b>{teamStars(g)}</b><span class="goal">/ {teamGoal(g)}</span></p>
          <p class="note centre">{teamStars(g) >= teamGoal(g) ? s('goalMet', { n: teamStars(g) }) : s('goalNear', { k: teamGoal(g) - teamStars(g) })}</p>
          {#if lastTotal !== null && teamStars(g) > lastTotal}<p class="note centre">{s('beatLast', { d: teamStars(g) - lastTotal })}</p>{/if}
          <p class="shells" data-sg-shells={shells}>{shells ? s('shells', { n: shells }) : s('shellsLater')}</p>
          {#each g.players as p, k (k)}
            <div class="rrow" data-sg-hl={k}>
              <Avatar {...headOf(p)} size={40} />
              <span class="nm">{p.name}<small class="hl">{highlightOf(g, k)}</small></span>
            </div>
          {/each}
        </div>
        {#if pairs.length >= 2}<Review {pairs} seed={g.seed} />{/if}
        {#if g.made.length}
          <h3 class="sec-label">{s('recap')}</h3>
          <div class="card dense" role="list">
            {#each g.made as m, i (i)}
              <div class="row recap" role="listitem">
                <Avatar {...headOf(g.players[m.p])} size={24} />
                <span class="txt"><span lang="en" class="en2">{m.text}</span>{#if m.ja}<span class="ja2">{m.ja}</span>{/if}</span>
              </div>
            {/each}
          </div>
        {/if}
        <button type="button" class="btn" data-sfx="open" data-sg-again onclick={() => { playMode = mode; picked = g.players.map((p) => p.who); levels = Object.fromEntries(g.players.map((p) => [p.who, p.level])); level = 'setup'; }}>{s('again')}</button>
      </div>
    {/if}
  </div>

<style>
  .sg { position: absolute; inset: 0; display: flex; flex-direction: column; overflow: hidden; background: var(--surface); }
  .top { flex: none; background-color: var(--surface); }
  .body { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 10px;
    padding: 4px calc(12px + var(--safe-right)) calc(var(--safe-bottom) + 24px) calc(12px + var(--safe-left)); scrollbar-width: none; }
  /* (a scroller's column: its cards keep their height, never squeezed to fit) */
  .body > * { flex-shrink: 0; }
  .hero { display: flex; flex-direction: column; gap: 10px; }
  .lead { margin: 0 0 4px; font: 700 var(--fs-body)/1.5 var(--font-ui); text-wrap: pretty; }
  .how { margin: 0; padding-left: 28px !important; display: grid; gap: 8px; font-size: var(--fs-body); line-height: 1.5; }
  .note { margin: 0; font-size: var(--fs-s); color: var(--text-soft); text-wrap: pretty; }
  .seats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .seat {
    position: relative; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 4px; margin: 0;
    appearance: none; border: 0; border-radius: var(--r-card); background: var(--c-card); box-shadow: 0 3px 0 var(--c-edge);
    color: var(--c-ink); font: 700 var(--fs-s)/1.2 var(--font-ui); cursor: pointer; -webkit-tap-highlight-color: transparent;
  }
  .seat.on { background: color-mix(in srgb, var(--c-yuzu) 55%, var(--c-card)); box-shadow: 0 3px 0 var(--c-yuzu-lip); }
  .ord { position: absolute; top: 6px; right: 8px; width: 22px; height: 22px; display: grid; place-items: center; border-radius: 50%;
    background: var(--c-ink); color: var(--c-cream); font: 600 13px/1 var(--font-num); }
  .nm { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .total .goal { font: 600 var(--fs-s)/1 var(--font-num); color: var(--text-soft); }
  .pl { display: inline-grid; place-items: center; min-width: 18px; height: 18px; border-radius: 5px; background: color-mix(in srgb, var(--c-mint) 55%, var(--c-cream)); font: 600 12px/1 var(--font-num); color: var(--c-ink); }
  .pl.must { background: color-mix(in srgb, var(--c-lilac) 65%, var(--c-cream)); box-shadow: 0 0 0 1.5px var(--c-ink); }
  .gift { display: flex; align-items: center; justify-content: center; gap: 6px; flex-wrap: wrap; }
  .total { display: flex; align-items: center; justify-content: center; gap: 6px; margin: 0; color: var(--c-gold); }
  .total b { font: 600 34px/1 var(--font-num); color: var(--c-ink); }
  .centre { text-align: center; }
  .shells { margin: 2px 0 6px; text-align: center; font: 700 var(--fs-body)/1.3 var(--font-ui); color: var(--c-ink); }
  .hl { display: block; font: 500 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  /* a score that changed pops once (stars in) */
  .bump { display: inline-block; animation: bump 420ms var(--ease-bounce); }
  @keyframes bump { 0% { transform: scale(1); } 35% { transform: scale(1.45); color: var(--c-gold); } 100% { transform: scale(1); } }
  .wide2 { align-self: center; }
  /* the dice shake while rolling */
  .die.rolling { animation: shake 140ms linear infinite; }
  @keyframes shake { 0%, 100% { transform: rotate(0); } 25% { transform: rotate(-10deg) translateY(-2px); } 75% { transform: rotate(10deg) translateY(1px); } }
  .lv { font: 700 10px/1 var(--font-ui); color: var(--text-soft); }
  .lrow { display: flex !important; flex-wrap: wrap; align-items: center; gap: 8px; }
  .lrow .nm { flex: 1 0 auto; min-width: 4.5em; font: 700 var(--fs-body)/1.2 var(--font-ui); }
  .lrow .seg { margin-left: auto; }
  .seg { display: inline-flex; gap: 4px; }
  .sg-chip { min-height: 36px; padding: 0 10px; margin: 0; appearance: none; border: 0; border-radius: var(--r-pill); cursor: pointer;
    background: var(--c-card); box-shadow: 0 2px 0 var(--c-edge); color: var(--c-ink); font: 700 var(--fs-s)/1 var(--font-ui); }
  .sg-chip[aria-checked='true'] { background: var(--c-yuzu); box-shadow: 0 2px 0 var(--c-yuzu-lip); }
  .way:first-child { background: color-mix(in srgb, var(--c-sky) 45%, var(--c-card)); }
  .way:last-child { background: color-mix(in srgb, var(--c-lilac) 45%, var(--c-card)); }
  .way small { font-weight: 500; font-size: var(--fs-s); color: var(--text-soft); }
  .podium { display: flex; flex-direction: column; gap: 8px; }
  .win { margin: 0 0 4px; text-align: center; font: 700 22px/1.3 var(--font-ui); }
  .rrow { display: flex; align-items: center; gap: 10px; }
  .rrow .nm { flex: 1; font: 700 var(--fs-body)/1.2 var(--font-ui); }
  .recap { display: flex !important; align-items: center; gap: 8px; }
  .txt { flex: 1; display: flex; flex-direction: column; min-width: 0; }
  .en2 { font: 600 var(--fs-body)/1.3 var(--font-body); }
  .ja2 { font-size: var(--fs-s); color: var(--text-soft); }
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
  .team .bar { flex: 1; min-width: 24px; height: 6px; border-radius: 3px; background: color-mix(in srgb, var(--c-edge) 45%, transparent); overflow: hidden; }
  .team .bar i { display: block; height: 100%; background: var(--c-yuzu); border-radius: 3px; transition: width 400ms var(--ease-soft); }
  .round { flex: none; font: 700 12px/1 var(--font-ui); color: var(--text-soft); white-space: nowrap; }
  /* the players' chips: 32 tall, 92 % cream (no backdrop blur: costly in WebKit); whose turn it is yuzu */
  .scores { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; width: fit-content; margin-top: 4px; padding: 0 calc(12px + var(--safe-right)) 0 calc(12px + var(--safe-left)); }
  .score { display: inline-flex; align-items: center; gap: 4px; height: 32px; padding: 0 10px 0 4px; box-sizing: border-box; border-radius: var(--r-pill);
    background: color-mix(in srgb, var(--c-cream) 92%, transparent); box-shadow: 0 2px 0 var(--c-edge); }
  .score.now { background: var(--c-yuzu); box-shadow: 0 2px 0 var(--c-yuzu-lip); }
  /* the turn's sheet: cream, its content's height (at most what leaves the board 160 px), folded a 56 px bar */
  .sheet { position: absolute; left: 0; right: 0; bottom: 0; z-index: 1; display: flex; flex-direction: column;
    max-height: max(220px, calc(100% - var(--hud, 88px) - 160px)); padding: 0 calc(12px + var(--safe-right)) calc(12px + var(--safe-bottom)) calc(12px + var(--safe-left));
    box-sizing: border-box; border-radius: 22px 22px 0 0; background: var(--c-cream); box-shadow: 0 -2px 0 var(--c-edge), 0 -6px 18px rgb(60 40 10 / .12); }
  .sheet.folded, .sheet:has(> .bar) { padding-bottom: var(--safe-bottom); }
  .sbody { min-height: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; display: flex; flex-direction: column; gap: 10px; }
  .sbody[hidden] { display: none; }
  .sbody > * { flex-shrink: 0; }
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
  .die { width: 40px; height: 40px; display: grid; place-items: center; border-radius: 11px; background: var(--c-card);
    box-shadow: 0 3px 0 var(--c-edge); font: 600 24px/1 var(--font-num); }
  .who { display: flex; align-items: center; gap: 12px; }
  .turnof { margin: 0; font: 700 var(--fs-talk)/1.2 var(--font-ui); }
  .one { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .gift .sg-chip { min-height: 44px; }
  .fork { display: flex; flex-direction: column; gap: 8px; }
  .ask { margin: 0; text-align: center; font: 700 var(--fs-body)/1.5 var(--font-ui); }
  .ways { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .way { display: flex; flex-direction: column; gap: 4px; align-items: center; justify-content: center; min-height: 72px; padding: 8px 6px; margin: 0 0 3px; appearance: none; border: 0; cursor: pointer;
    border-radius: var(--r-card); background: var(--c-card); box-shadow: 0 3px 0 var(--c-edge); color: var(--c-ink); font: 700 var(--fs-body)/1.2 var(--font-ui); }
  .way:first-child { background: color-mix(in srgb, var(--c-sky) 45%, var(--c-card)); }
  .way:last-child { background: color-mix(in srgb, var(--c-lilac) 45%, var(--c-card)); }
  .way small { font-weight: 500; font-size: var(--fs-s); color: var(--text-soft); }
  .event { display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; }
  .tagrow { display: flex; align-items: center; gap: 6px; height: 32px; align-self: flex-start; }
  .tag { padding: 3px 10px; border-radius: var(--r-pill); background: color-mix(in srgb, var(--c-lilac) 55%, var(--c-cream)); font: 700 12px/1.3 var(--font-ui); }
  .event .en { margin: 0; font: 500 20px/1.35 var(--font-body); text-wrap: pretty; }
  .event .en b { background: color-mix(in srgb, var(--c-yuzu) 60%, transparent); border-radius: 4px; padding: 0 2px; }
  .event .ja { margin: 0; font-size: var(--fs-s); line-height: 18px; color: var(--text-soft); }
  .event .ja.big { font: 700 var(--fs-body)/1.4 var(--font-ui); color: var(--c-ink); }
  .peek { min-height: 44px; }
  .actrow { display: flex; align-items: center; gap: 8px; width: 100%; margin-top: 2px; }
  .chip-eff { flex: none; padding: 6px 12px; border-radius: var(--r-pill); background: var(--c-yuzu); box-shadow: 0 2px 0 var(--c-yuzu-lip); font: 700 var(--fs-s)/1.2 var(--font-ui); }
  .actrow .btn { flex: 1; min-width: 0; }
  .speech { align-self: center; margin-top: 4px; min-height: 44px; padding: 0 12px; border: 0; background: none; color: var(--text-soft); font: 600 var(--fs-s)/1 var(--font-ui); }
</style>
