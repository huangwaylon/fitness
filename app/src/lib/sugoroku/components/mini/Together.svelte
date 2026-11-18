<script lang="ts">
  // ★3 みんなで一文 (mini/together.ts): a line's word cards dealt across the seats; one shared row; each taps their own
  // cards into it in order (online: mine on this phone, the others' counted, so the table talks: "who has 'the'?";
  // passed round: every hand on the one phone, each in its seat's colour, its head beside it). A card out of order stays
  // in the hand: 「おしい！」 and the next word's first letter; after two, 答えを見る. A line done shows with its Japanese
  // (むずかしい's table: the Japanese only then). Online, a seat whose word is next and that has been quiet QUIET_MS has
  // its cards made everyone's (any other phone sends it: the first counts).
  import Avatar from '#lib/components/characters/Avatar.svelte';
  import Nudge from '../Nudge.svelte';
  import { untrack } from 'svelte';
  import { mayPlace, nextWord, type TogetherState } from '../../mini/together.ts';
  import type { Play } from '../../mini/types.ts';
  import type { Who } from '#lib/types.ts';
  import { s as tr } from '../../i18n.ts';
  import { QUIET_MS } from './len.ts';

  interface Props {
    s: TogetherState; seat: Who | null; live: boolean; mode: 'local' | 'online'; nameOf: (w: Who) => string; play: (p: Play, who?: Who) => void;
    here: readonly Who[]; me: Who;
  }
  let { s, seat, live, mode, nameOf, play, here, me }: Props = $props();

  const line = $derived(s.lines[s.l] ?? null);
  const shared = $derived(mode === 'local');
  /** The cards not placed, by seat (a freed seat's anyone's). */
  const hands = $derived(line ? s.seats.map((x) => ({ who: x.who, cards: line.words.map((w, k) => ({ w, k })).filter(({ k }) => line.owner[k] === x.who && !s.row.includes(k)), free: s.free.includes(x.who) })) : []);
  const mine = $derived(hands.filter((h) => h.who === seat || (h.free && !!seat)));
  const others = $derived(hands.filter((h) => h.who !== seat && !h.free));
  function place(k: number) {
    if (!live || !line) return;
    const who = shared ? line.owner[k] : seat;
    if (!who || !mayPlace(s, who, k)) return;
    play({ k }, who);
  }
  // 「おしい！」 with the next word's first letter, as a nudge comes in; a line done, a moment
  let note = $state('');
  let noteTimer: ReturnType<typeof setTimeout> | undefined;
  let seen = { l: -1, n: 0 };
  const say = (t: string, ms: number) => (clearTimeout(noteTimer), (note = t), (noteTimer = setTimeout(() => (note = ''), ms)));
  $effect(() => {
    const l = s.l, n = s.nudges, nx = nextWord(s);
    untrack(() => {
      if (l === seen.l && n > seen.n && nx) say(tr('toNext', { l: nx[0] }), 1500);
      if (seen.l >= 0 && l > seen.l && s.lines[l - 1]) say(`${tr('spNice')} ${s.lines[l - 1].en}`, 2000);
      seen = { l, n };
    });
  });
  $effect(() => () => clearTimeout(noteTimer));

  // online: a quiet seat's cards everyone's, once its word is next
  const quietOwner = $derived.by((): Who | null => {
    if (!line || mode !== 'online') return null;
    const nx = line.words[s.row.length];
    const k = line.words.findIndex((w, i) => w === nx && !s.row.includes(i));
    const o = k >= 0 ? line.owner[k] : null;
    return o && o !== seat && !s.free.includes(o) ? o : null;
  });
  $effect(() => {
    const o = quietOwner;
    if (!o || !live || !seat) return;
    void s.row.length, s.nudges, s.l;
    const idx = s.seats.findIndex((x) => x.who === o), gone = o !== me && !here.includes(o);
    const id = setTimeout(() => play({ op: 'free', k: idx }), gone ? 2000 : QUIET_MS);
    return () => clearTimeout(id);
  });
</script>

<div class="to" data-sg-together={s.l}>
  {#if note}<Nudge text={note} />{/if}
  {#if line}
    <div class="head">
      <span class="tag" data-sg-to-line>{tr('toLine', { n: s.l + 1, of: s.lines.length })}</span>
      {#if s.nudges >= 2 && !s.shown}<button type="button" class="chip" data-sfx="tick" data-sg-to-show disabled={!live} onclick={() => play({ op: 'show' }, seat ?? undefined)}>{tr('showAnswer')}</button>{/if}
    </div>
    {#if !s.unseen}<p class="ja">{line.ja}</p>{/if}
    {#if s.shown}<p class="answer" lang="en" data-sg-answer>{line.en}</p>{/if}
    <div class="row sg-strip" lang="en" data-sg-to-row={s.row.map((k) => line.words[k]).join(' ')}>
      {#each s.row as k (k)}<span class="sg-wt s-{line.owner[k]}">{line.words[k]}</span>{/each}
    </div>
    {#each shared ? hands : mine as h (h.who)}
      {#if h.cards.length}
        <div class="hand" data-sg-to-hand={h.who}>
          <Avatar person={h.who} worn size={24} />
          <div class="cards" lang="en">
            {#each h.cards as c (c.k)}<button type="button" class="sg-wt s-{h.who}" disabled={!live} data-sfx="tick" data-sg-to-card={c.w} onclick={() => place(c.k)}>{c.w}</button>{/each}
          </div>
        </div>
        {#if h.free && h.who !== seat && !shared}<p class="note">{tr('toFree', { name: nameOf(h.who) })}</p>{/if}
      {/if}
    {/each}
    {#if !shared}
      <p class="note others">{#each others.filter((h) => h.cards.length) as h, i (h.who)}{i ? '・' : ''}{tr('toCount', { name: nameOf(h.who), n: h.cards.length })}{/each}</p>
    {/if}
  {/if}
</div>

<style>
  .to { display: flex; flex-direction: column; gap: 8px; }
  .to > :global(*) { flex-shrink: 0; }
  .head { display: flex; align-items: center; gap: 8px; min-height: 32px; }
  .head .chip { margin-left: auto; }
  .ja { margin: 0; font: 700 var(--fs-body)/1.35 var(--font-ui); text-wrap: pretty; }
  .answer { margin: 0; font: 600 18px/1.3 var(--font-body); color: var(--c-ink); text-wrap: pretty; }
  .note { margin: 0; font-size: var(--fs-s); color: var(--text-soft); text-wrap: pretty; }
  .row { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; padding: 4px 8px; align-content: center; }
  .row span { cursor: default; }
  .hand { display: flex; align-items: center; gap: 8px; }
  .cards { flex: 1; display: flex; flex-wrap: wrap; gap: 6px; }
  /* each seat's colour (its head beside it too: never colour alone) */
  .s-A { background: color-mix(in srgb, var(--c-sky) 32%, var(--c-cream)); }
  .s-B { background: color-mix(in srgb, var(--c-rose) 38%, var(--c-cream)); }
  .s-G { background: color-mix(in srgb, var(--c-lilac) 55%, var(--c-cream)); }
</style>
