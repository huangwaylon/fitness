<script lang="ts">
  // 英語すごろく, English Study's third tab (docs/sugoroku.md "Rules"), its own chunk (the tab's Lazy), its levels
  // menu (続きから / 新しいゲーム / あそびかた) → だれが遊ぶ？ (2–3 of us, each as their own character, in the
  // order picked, each its English level) → the game (the board over the turn's panel: whose turn and the dice, the
  // fork's choice, then the space's ことば, ぶん, 絵, イベント or あがり; the board drawn small during a turn's English;
  // ) → 結果 (the ranking, ふりかえり:
  // a no-fail matching of the game's words, and 今日のことば). Played on one phone passed round (saved after every step:
  // save.ts, so ‹ or ✕ mid-game leaves it to 続きから), or on each player's own phone (online.svelte.ts: every action a
  // move to the relay, the game the moves folded; a phone whose turn it isn't watches). No ベル. The island is paused under it.
  import { untrack } from 'svelte';
  import NavBar from '#lib/components/ui/NavBar.svelte';
  import Icon from '#lib/components/ui/Icon.svelte';
  import Avatar from '#lib/components/characters/Avatar.svelte';
  import Board from './Board.svelte';
  import WordTurn from './WordTurn.svelte';
  import SentenceTurn from './SentenceTurn.svelte';
  import PictureTurn from './PictureTurn.svelte';
  import Review from './Review.svelte';
  import { PICTURES } from '../pictures.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { now } from '#lib/time/clock.ts';
  import { CARDS } from '../cards.ts';
  import { choose, eventDone, pictureDone, tried, finish, homeDone, lastRound as isLast, LEVEL, MAX_PLAYERS, MIN_PLAYERS, newGame, playWord, ranking, sentenceAsWord,
    sentenceDone, spin, swap, twice, wordScore, HOME_BONUS, type Game, type Length, type Level as SeatLevel, type Seat } from '../game.ts';
  import { pathOf } from '../board.ts';
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
  }
  let { active, join = false, onclose, ontop }: Props = $props();
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
    });
  });
  let wantOnline = $state(false);
  $effect(() => {
    if (wantOnline && onlineGame && onlineGame.phase.k !== 'end') untrack(() => ((wantOnline = false), (shown = []), (mode = 'online'), (level = 'play')));
  });
  const close = () => onclose();
  /** To the menu: the save as it is now (a game played since the opening). */
  const toMenu = () => ((saved = loadGame()), (level = 'menu'));

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
  function start() {
    if (playMode === 'online') {
      startOnline(seatsCode(seatsOf(picked)), lengthCode(length));
      shown = [];
      mode = 'online';
      level = 'play';
      return;
    }
    const g0 = newGame(seatsOf(picked), `${now()}:${picked.join(',')}`, length);
    shown = g0.players.map((p) => p.pos);
    mode = 'local';
    set(g0);
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
  let confirmEnd = $state(false);
  function set(g: Game) {
    game = g;
    confirmEnd = false;
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
  const walking = $derived(!!g && g.players.some((p, i) => shown[i] !== p.pos));
  $effect(() => {
    if (!walking || !g) return;
    const ps = g.players;
    const id = setInterval(() => {
      shown = shown.map((v, i) => (v === ps[i].pos ? v : pathOf(v, ps[i].pos, ps[i].branch)[0]));
      // (the dice's number kept while the walk waits at the fork)
      if (shown.every((v, i) => v === ps[i].pos)) (clearInterval(id), g?.phase.k !== 'fork' && (rolled = 0));
    }, 170);
    return () => clearInterval(id);
  });
  function resume() {
    if (!saved) return;
    shown = saved.players.map((p) => p.pos);
    mode = 'local';
    set(saved);
    level = 'play';
  }
  function resumeOnline() {
    shown = [];
    mode = 'online';
    level = 'play';
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
    const id = (rollTimer = setInterval(() => {
      rolling = (k++ % 6) + 1;
      if (k < 8) return;
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
  /** The board small: a turn's English (the controls stay on screen). */
  const compact = $derived(!!ph && (ph.k === 'word' || ph.k === 'sentence' || ph.k === 'picture' || ph.k === 'event') && !walking);
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

  const rank = $derived(g ? ranking(g) : []);
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
      </div>
    {:else if level === 'play' && g && cur && ph}
      <div class="top"><NavBar pad title={s('title')} onback={toMenu} onclose={close} /></div>
      <div class="body sheet-scroll play" data-sg-turn={g.turn} data-sg-phase={ph.k}>
        <div class="scores">
          {#each g.players as p, i (i)}
            <span class="score" class:now={i === g.turn} data-sg-score={i}>
              <Avatar {...headOf(p)} size={28} />
              {#key p.stars}<b class="bump">{p.stars}</b>{/key}<small class="lv">{s(`level.${p.level}`)}</small>
            </span>
          {/each}
          <span class="round">{lastRound ? s('lastRound') : s('round', { n: g.round })}</span>
        </div>
        <Board players={g.players} {shown} turn={g.turn} {compact} />
        <div class="panel card pad">
          {#if walking || rolling !== null}
            <div class="spinning">{#if rolling !== null || rolled}<span class="die" class:rolling={rolling !== null} data-sg-die>{rolling ?? rolled}</span><p>{rolling === null ? s('spun', { n: rolled }) : ''}</p>
              {:else}<p data-sg-moving>{s('walking')}</p>{/if}</div>
          {:else if !myTurn && ph.k !== 'end'}
            <div class="who" data-sg-waiting>
              <Avatar {...headOf(cur)} size={64} />
              <div>
                <p class="turnof">{s('waiting', { name: cur.name })}</p>
                <p class="note">{#if g.made.length}{@const m = g.made[g.made.length - 1]}{s('lastMove', { name: g.players[m.p].name, text: m.text, n: m.stars })}{:else}{s('thinking')}{/if}</p>
                {#if !online.connected}<p class="note">{s('offlineNote')}</p>{/if}
              </div>
            </div>
          {:else if ph.k === 'spin'}
            <div class="who">
              <Avatar {...headOf(cur)} size={64} />
              <div>
                <p class="turnof">{s('turnOf', { name: cur.name })}</p>
                <p class="note">{s('passTo', { name: cur.name })}</p>
              </div>
            </div>
            <button type="button" class="btn" data-sfx="confirm" data-sg-spin onclick={() => doSpin()}>{s('spin')}</button>
            {#if twice(g)}<p class="note">{s('twice')}</p>{/if}
          {:else if ph.k === 'fork'}
            <div class="event" data-sg-fork>
              <h3 class="ttl">{s('forkTitle')}</h3>
              <p class="note">{s('forkAsk', { n: ph.left })}</p>
              <div class="ways">
                {#each [0, 1] as const as b (b)}
                  <button type="button" class="way" data-sfx="confirm" data-sg-branch={b} onclick={() => act((x) => choose(x, b), { a: 'fork', b })}>
                    <b>{s(`branch.${b}`)}</b><small>{s(`branch.${b}.note`)}</small>
                  </button>
                {/each}
              </div>
            </div>
          {:else if ph.k === 'word'}
            {#if words}
              {#key `${g.n}`}
                <WordTurn rack={cur.rack} lucky={g.lucky} mult={ph.mult} minLen={LEVEL[cur.level].minLen} hintHalf={LEVEL[cur.level].hintHalf}
                  hinted0={ph.hinted} onhint={() => act((x) => tried(x, { hinted: true }), { a: 'try', h: 1 })} {words}
                  score={(w, c, h) => wordScore(g, w, c, h)}
                  onplay={(w, h) => act((x) => playWord(x, w, { everyday: !!words!.ja(w), ja: words!.ja(w), hinted: h }), { a: 'word', w, ...(h ? { h: 1 } : {}) })}
                  onswap={() => act(swap, { a: 'swap' })} />
              {/key}
            {:else if failed}
              <p class="note">{s('offline')}</p><button type="button" class="btn small" data-sfx="tick" onclick={load}>{s('retry')}</button>
            {:else}<p class="note">{s('loading')}</p>{/if}
          {:else if ph.k === 'sentence'}
            {#if line}
              {#key line.en}<SentenceTurn {line} seed={g.seed} hideJa={cur.level === 3} misses0={ph.misses} peeked0={ph.peeked} ontry={(t) => act((x) => tried(x, t), { a: 'try', m: t.misses, ...(t.peeked ? { p: 1 } : {}) })} ondone={(o) => act((x) => sentenceDone(x, { ...o, text: line.en, ja: line.ja }), { a: 'sent', m: o.misses, ...(o.unseen ? { u: 1 } : {}) })} />{/key}
            {:else if failed || lines}
              <p class="note">{lines ? s('noLine') : s('offline')}</p>
              <button type="button" class="btn small" data-sfx="tick" onclick={() => act(sentenceAsWord, { a: 'noline' })}>{s('next')}</button>
            {:else}<p class="note">{s('loading')}</p>{/if}
          {:else if ph.k === 'picture'}
            {#key ph.item}<PictureTurn pic={PICTURES[ph.item]} level={cur.level} seed={g.seed} misses0={ph.misses} ontry={(t) => act((x) => tried(x, t), { a: 'try', m: t.misses })} ondone={(m) => act((x) => pictureDone(x, m), { a: 'pic', m })} />{/key}
          {:else if ph.k === 'event' && card}
            <div class="event" data-sg-event={ph.card}>
              {#if card.who}<Avatar person="G" villager={card.who} size={48} />{/if}
              <h3 class="ttl">{s('eventTitle')}</h3>
              <p class="en" lang="en">{#each cardParts(card.en) as part, i (i)}{#if part.key}<b>{part.t}</b>{:else}{part.t}{/if}{/each}</p>
              {#if cur.level < 3 || cardJa}<p class="ja">{card.ja}</p>
              {:else}<button type="button" class="btn small paper" data-sfx="tick" data-sg-card-ja onclick={() => (cardJa = true)}>{s('peek')}</button>{/if}
              <span class="chip-eff" data-sg-effect>{effectOf(card)}</span>
              <button type="button" class="btn" data-sfx="confirm" data-sg-next onclick={() => act(eventDone, { a: 'ev' })}>{s('ok')}</button>
            </div>
          {:else if ph.k === 'home'}
            <div class="event" data-sg-home>
              <Avatar {...headOf(cur)} size={64} />
              <h3 class="ttl">{s('homeTitle')}</h3>
              <p class="ja">{s('homePlace', { n: ph.place + 1, b: HOME_BONUS[ph.place] ?? 0 })}</p>
              <button type="button" class="btn" data-sfx="confirm" data-sg-next onclick={() => act(homeDone, { a: 'home' })}>{s('next')}</button>
            </div>
          {/if}
        </div>
        <div class="end">
          {#if confirmEnd}
            <span class="note">{s('endAsk')}</span>
            <button type="button" class="btn small" data-sfx="confirm" data-sg-end-yes onclick={() => ((confirmEnd = false), act(finish, { a: 'end' }))}>{s('end')}</button>
          {:else}
            <button type="button" class="link" data-sfx="tick" data-sg-end onclick={() => (confirmEnd = true)}>{s('end')}</button>
          {/if}
        </div>
      </div>
    {:else if level === 'results' && g}
      <div class="top"><NavBar pad title={s('results')} onback={toMenu} onclose={close} /></div>
      <div class="body sheet-scroll" data-sg-results>
        <div class="card pad podium">
          <p class="win">{s('winner', { name: g.players[rank[0]].name })}</p>
          {#each rank as i, k (i)}
            {@const p = g.players[i]}
            <div class="rrow" data-sg-rank={k}>
              <span class="place">{s('place', { n: k + 1 })}</span>
              <Avatar {...headOf(p)} size={40} />
              <span class="nm">{p.name}</span>
              <span class="st"><Icon name="star" size={18} soft /><b>{p.stars}</b></span>
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
                <span class="st"><Icon name="star" size={14} soft />{m.stars}</span>
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
  .play { gap: 8px; }
  .scores { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .score { display: inline-flex; align-items: center; gap: 4px; padding: 2px 10px 2px 2px; border-radius: var(--r-pill); background: var(--c-card); box-shadow: 0 2px 0 var(--c-edge); }
  .score.now { background: var(--c-yuzu); box-shadow: 0 2px 0 var(--c-yuzu-lip); }
  .score b { font: 600 16px/1 var(--font-num); }
  /* a score that changed pops once (stars in) */
  .bump { display: inline-block; animation: bump 420ms var(--ease-bounce); }
  @keyframes bump { 0% { transform: scale(1); } 35% { transform: scale(1.45); color: var(--c-gold); } 100% { transform: scale(1); } }
  .wide2 { align-self: center; }
  /* the dice shake while rolling */
  .die.rolling { animation: shake 140ms linear infinite; }
  @keyframes shake { 0%, 100% { transform: rotate(0); } 25% { transform: rotate(-10deg) translateY(-2px); } 75% { transform: rotate(10deg) translateY(1px); } }
  .lv { font: 700 10px/1 var(--font-ui); color: var(--text-soft); }
  .chip-eff { padding: 4px 12px; border-radius: var(--r-pill); background: var(--c-yuzu); box-shadow: 0 2px 0 var(--c-yuzu-lip); font: 700 var(--fs-s)/1.2 var(--font-ui); }
  .lrow { display: flex !important; flex-wrap: wrap; align-items: center; gap: 8px; }
  .lrow .nm { flex: 1 0 auto; min-width: 4.5em; font: 700 var(--fs-body)/1.2 var(--font-ui); }
  .lrow .seg { margin-left: auto; }
  .seg { display: inline-flex; gap: 4px; }
  .sg-chip { min-height: 36px; padding: 0 10px; margin: 0; appearance: none; border: 0; border-radius: var(--r-pill); cursor: pointer;
    background: var(--c-card); box-shadow: 0 2px 0 var(--c-edge); color: var(--c-ink); font: 700 var(--fs-s)/1 var(--font-ui); }
  .sg-chip[aria-checked='true'] { background: var(--c-yuzu); box-shadow: 0 2px 0 var(--c-yuzu-lip); }
  .ways { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; width: 100%; }
  .way { display: flex; flex-direction: column; gap: 4px; align-items: center; padding: 12px 6px; margin: 0; appearance: none; border: 0; cursor: pointer;
    border-radius: var(--r-card); background: var(--c-card); box-shadow: 0 3px 0 var(--c-edge); color: var(--c-ink); font: 700 var(--fs-body)/1.2 var(--font-ui); }
  .way:first-child { background: color-mix(in srgb, var(--c-sky) 45%, var(--c-card)); }
  .way:last-child { background: color-mix(in srgb, var(--c-lilac) 45%, var(--c-card)); }
  .way small { font-weight: 500; font-size: var(--fs-s); color: var(--text-soft); }
  .round { margin-left: auto; font: 700 var(--fs-s)/1 var(--font-ui); color: var(--text-soft); }
  .panel { display: flex; flex-direction: column; align-items: center; gap: 10px; min-height: 150px; justify-content: center; }
  .who { display: flex; align-items: center; gap: 12px; }
  .turnof { margin: 0; font: 700 var(--fs-talk)/1.2 var(--font-ui); }
  .spinning { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .spinning p { margin: 0; font: 700 var(--fs-body)/1.2 var(--font-ui); min-height: 1.2em; }
  .die { width: 64px; height: 64px; display: grid; place-items: center; border-radius: 16px; background: var(--c-cream);
    box-shadow: 0 4px 0 var(--c-edge); font: 600 36px/1 var(--font-num); }
  .event { display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; }
  .ttl { margin: 0; font: 700 var(--fs-talk)/1.2 var(--font-ui); }
  .event .en { margin: 0; font: 500 20px/1.4 var(--font-body); text-wrap: pretty; }
  .event .en b { background: color-mix(in srgb, var(--c-yuzu) 60%, transparent); border-radius: 4px; padding: 0 2px; }
  .event .ja { margin: 0; font-size: var(--fs-s); color: var(--text-soft); }
  .end { display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; }
  .link { appearance: none; border: 0; background: none; padding: 10px; min-height: 44px; color: var(--text-soft); font: 500 var(--fs-s)/1.2 var(--font-ui); text-decoration: underline; cursor: pointer; }
  .podium { display: flex; flex-direction: column; gap: 8px; }
  .win { margin: 0 0 4px; text-align: center; font: 700 22px/1.3 var(--font-ui); }
  .rrow { display: flex; align-items: center; gap: 10px; }
  .place { width: 36px; font: 700 var(--fs-body)/1 var(--font-ui); }
  .rrow .nm { flex: 1; font: 700 var(--fs-body)/1.2 var(--font-ui); }
  .st { display: inline-flex; align-items: center; gap: 3px; color: var(--c-gold); }
  .st b { font: 600 18px/1 var(--font-num); color: var(--c-ink); }
  .recap { display: flex !important; align-items: center; gap: 8px; }
  .txt { flex: 1; display: flex; flex-direction: column; min-width: 0; }
  .en2 { font: 600 var(--fs-body)/1.3 var(--font-body); }
  .ja2 { font-size: var(--fs-s); color: var(--text-soft); }
  .recap .st { font: 600 14px/1 var(--font-num); color: var(--c-ink); }
</style>
