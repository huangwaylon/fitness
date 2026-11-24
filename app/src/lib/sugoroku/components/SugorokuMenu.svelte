<script lang="ts">
  // 英語すごろく, English Study's third tab (docs/sugoroku.md), its own chunk (the tab's Lazy): the menu (the online game
  // running with me in it first, 続きから / 新しいゲーム / 遊び方) → Setup (who plays, each one's level, the length). A game
  // started or resumed plays on its own screen (/sugoroku, SugorokuPlay), this way (`onscreen`); a passed-round one
  // goes there through the save.
  import { untrack } from 'svelte';
  import NavBar from '#lib/components/ui/NavBar.svelte';
  import Avatar from '#lib/components/characters/Avatar.svelte';
  import Setup from './Setup.svelte';
  import HowTo from './HowTo.svelte';
  import Phrases from '#lib/components/ui/Phrases.svelte';
  import { covered } from './InviteBanner.svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import type { Who } from '#lib/types.ts';
  import type { Length, Level } from '../game.ts';
  import { loadGame, saveGame } from '../save.ts';
  import { folder, lengthCode, seatsCode } from '../online.ts';
  import { loadWords, type Words } from '../words.ts';
  import { loadSentences, type Line } from '../sentences.ts';
  import { loadMiniData, type MiniData } from '../mini/data.ts';
  import { listen, nameOf, online, startOnline, updateNeeded } from '../online.svelte.ts';
  import { newLocal, peopleFor, seatsFor } from '../start.ts';
  import { s } from '../i18n.ts';
  import { lookOf } from '#lib/store/look.ts';
  import { portraitOf } from '#lib/components/look/portraits.svelte.ts';
  import type { PlayerLook } from '#lib/contract/look.ts';

  interface Props {
    /** The tab is shown (English Study open on it). */
    active: boolean;
    onclose: () => void;
    /** Whether its top level (the menu) is shown: English Study's tab bar only there. */
    ontop?: (top: boolean) => void;
    /** A game started or resumed: to its own screen. */
    onscreen: (mode: 'local' | 'online') => void;
  }
  let { active, onclose, ontop, onscreen }: Props = $props();
  let view = $state<'menu' | 'how' | 'setup'>('menu');
  $effect(() => ontop?.(view === 'menu'));
  let saved = $state.raw(loadGame());
  $effect(() => {
    if (!active) return;
    listen();
    untrack(() => ((saved = loadGame()), (view = 'menu')));
  });

  // the online game held, while it runs (its card): its moves folded, the words and lines asked for only then
  // (raw: never proxied, each asked for once: an effect setting them again on every run looped in WebKit)
  let words = $state.raw<Words | null>(null);
  let lines = $state.raw<readonly Line[] | null>(null);
  let mini = $state.raw<MiniData | null>(null);
  const held = $derived(online.cur.log.length > 0 && !online.cur.log.some((m) => m.a === 'end'));
  let asking = false;
  $effect(() => {
    if (!active || !held || asking || untrack(() => words && lines && mini)) return;
    asking = true;
    Promise.all([loadWords(), loadSentences(), loadMiniData()]).then(([w, l, m]) => ((words = w), (lines = l), (mini = m)), () => (asking = false));
  });
  const fold = folder();
  const running = $derived.by(() => {
    const g = held && words && lines && mini ? fold(online.cur.log, { words, lines, mini, name: nameOf }) : null;
    return !!g && g.phase.k !== 'end';
  });
  // its card shown: the one 参加 (the lasting banner for the same game waits; 続きから / 新しいゲーム paper under it)
  const card = $derived(active && view === 'menu' && running && !!online.cur.log[0]);
  $effect(() => {
    if (!card) return;
    const g = online.cur.g;
    covered.g = g;
    return () => void (covered.g === g && (covered.g = null));
  });

  // ---- だれが遊ぶ？
  const me = $derived<Who>(week.model?.me ?? 'A');
  const people = $derived(peopleFor(me));
  // the players' heads asked for as the tab opens (a look new to this phone, the partner's, is drawn by the island's
  // renderer in about a second), so Setup's seats show them, not the plain chip Avatar holds while one is drawn
  $effect(() => {
    if (!active) return;
    const looks = people.map(lookOf);
    untrack(() => looks.forEach((l) => l.kind === 'player' && portraitOf(l as PlayerLook)));
  });
  let picked = $state<Who[]>([]);
  let levels = $state<Partial<Record<Who, Level>>>({});
  let length = $state<Length>('normal');
  let playMode = $state<'local' | 'online'>('local');
  function setup() {
    picked = people.slice(0, 2);
    view = 'setup';
  }
  function start() {
    const seats = seatsFor(picked, levels);
    if (playMode === 'online') startOnline(seatsCode(seats), lengthCode(length));
    else saveGame(newLocal(seats, length, saved));
    onscreen(playMode);
  }
</script>

<div class="sg" data-sugoroku data-level={view}>
  {#if view === 'menu'}
    <div class="top"><NavBar pad title={s('title')} {onclose} /></div>
    <div class="body sheet-scroll">
      {#if card && online.cur.log[0]}
        <!-- the online game running with me in it: its card first, 参加 back into its screen -->
        {@const by = online.cur.log[0].who}
        <div class="card pad live" data-sg-online-card>
          <Avatar person={by} worn size={40} />
          <span class="nm">{s('startedBy', { name: nameOf(by) })}</span>
          <button type="button" class="btn small" data-sfx="open" data-sg-resume-online onclick={() => onscreen('online')}>{s('join')}</button>
        </div>
      {:else if updateNeeded()}
        <!-- an online game started on another build's rules: it can't be played here (wire.ts otherRules) -->
        <p class="card pad note" data-sg-update>{s('updateApp')}</p>
      {/if}
      <div class="hero card pad">
        <p class="lead"><Phrases text={s('how2')} /></p>
        <p class="note"><Phrases text={s('teamLine')} /></p>
        {#if saved}
          <button type="button" class="btn" class:paper={card} data-sfx="open" data-sg-resume onclick={() => onscreen('local')}>{s('resume')}</button>
        {/if}
        <button type="button" class="btn" class:paper={!!saved || card} data-sfx="open" data-sg-new onclick={setup}>{s('newGame')}</button>
        <button type="button" class="btn small paper" data-sfx="page" data-sg-how onclick={() => (view = 'how')}>{s('howTo')}</button>
      </div>
    </div>
  {:else if view === 'how'}
    <div class="top"><NavBar pad title={s('howTo')} onback={() => (view = 'menu')} {onclose} /></div>
    <div class="body sheet-scroll"><div class="card pad"><HowTo /></div></div>
  {:else}
    <Setup {people} {me} {nameOf} bind:picked bind:levels bind:length bind:playMode onstart={start} onback={() => (view = 'menu')} {onclose} />
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
  .live { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
  .live .nm { flex: 1; min-width: 0; font: 700 var(--fs-body)/1.4 var(--font-ui); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .lead { margin: 0 0 4px; font: 700 var(--fs-body)/1.5 var(--font-ui); text-wrap: pretty; }
  .note { margin: 0; font-size: var(--fs-s); color: var(--text-soft); text-wrap: pretty; }
</style>
