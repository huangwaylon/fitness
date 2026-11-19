<script lang="ts">
  // 10 返事はどれ？ (mini/reply.ts): 4 exchanges, the asker round the table. The chat grows on every phone: each round's
  // line from its asker, then the reply that fit from its finder (on the timer: 答えはこれ). The asker's phone shows the
  // line to read aloud; each other seat holds its cards (online on its own phone; passed round all on the one phone,
  // each hand by its head in its seat's colour), やさしい with the Japanese under each: whoever has the one that fits taps
  // 「これ！」; one that doesn't is 「おしい！」, dimmed, never red. The round's timer: any phone's `next` for its stage
  // (online the seats one after another: the first in counts) shows the reply and moves on.
  import Phrases from '#lib/components/ui/Phrases.svelte';
  import Avatar from '#lib/components/characters/Avatar.svelte';
  import Nudge from '../Nudge.svelte';
  import { flashNote } from './note.svelte.ts';
  import { cardLine, replyOn, type ReplyState } from '../../mini/reply.ts';
  import { stagePlay } from '../../mini/hands.ts';
  import type { Play } from '../../mini/types.ts';
  import type { Who } from '#lib/types.ts';
  import { s as tr } from '../../i18n.ts';

  interface Props {
    s: ReplyState; seat: Who | null; live: boolean; mode: 'local' | 'online'; nameOf: (w: Who) => string; play: (p: Play, who?: Who) => void;
    seatIdx: number;
    turnMs: number;
  }
  let { s, seat, live, mode, nameOf, play, seatIdx, turnMs }: Props = $props();

  const shared = $derived(mode === 'local');
  const round = $derived(s.rounds[s.r] ?? null);
  const ex = $derived(replyOn(s));
  const stage = $derived(s.stage);
  const levelOf = (w: Who) => s.seats.find((x) => x.who === w)?.level ?? 2;
  /** The hands shown here: passed round every replier's, online mine. */
  const hands = $derived.by(() => {
    if (!round) return [];
    const all = s.seats.filter((x) => round.hands[x.who]).map((x) => ({ who: x.who, cards: round.hands[x.who]! }));
    return shared ? all : all.filter((h) => h.who === seat);
  });
  const asking = $derived(!shared && !!round && seat === round.asker && !round.hands[seat]);
  /** The Japanese under the line: a やさしい seat's (passed round: any at the table). */
  const easy = $derived(shared ? s.seats.some((x) => x.level === 1) : !!seat && levelOf(seat) === 1);

  const note = flashNote();
  function tap(who: Who, k: number) {
    if (!live || !round || s.tried[who]?.includes(k)) return;
    if (round.hands[who]?.[k] !== 0) note.say(tr('reMiss'), 1200);
    play({ k }, who);
  }

  // the chat: the newest in view as it grows
  let chat = $state<HTMLElement | null>(null);
  $effect(() => {
    void s.r;
    if (chat) chat.scrollTop = chat.scrollHeight;
  });

  // the round's timer: its `next` (online the seats one after another; passed round this phone's)
  $effect(() => {
    if (!live || !round || (mode === 'online' && !seat)) return;
    const at = stage, wait = turnMs + (mode === 'online' ? seatIdx * 1500 : 0), who = seat ?? round.asker;
    const id = setTimeout(() => play(stagePlay(at), who), wait);
    return () => clearTimeout(id);
  });
</script>

<div class="re" data-sg-reply={s.r}>
  {#if note.text}<Nudge text={note.text} />{/if}
  <div class="head">
    <span class="tag" data-sg-re-round>{tr('spRound', { n: Math.min(s.r + 1, s.rounds.length), of: s.rounds.length })}</span>
    {#if asking}<span class="tag say">{tr('reSay')}</span>{/if}
  </div>
  <ol class="chat" bind:this={chat}>
    {#each s.results as res, k (k)}
      {@const done = s.rounds[k]}
      <li class="msg q"><Avatar person={done.asker} worn size={24} /><p lang="en">{done.ex.q[0]}</p></li>
      <li class="msg a" data-sg-re-said={done.ex.a[0]}>
        {#if res.by}<Avatar person={res.by} worn size={24} />{:else}<span class="tag">{tr('answer')}</span>{/if}<p lang="en">{done.ex.a[0]}</p>
      </li>
    {/each}
    {#if round && ex}
      <li class="msg q now" data-sg-re-line={ex.q[0]}>
        <Avatar person={round.asker} worn size={28} />
        <div><p lang="en">{ex.q[0]}</p>{#if easy}<small>{ex.q[1]}</small>{/if}</div>
      </li>
    {/if}
  </ol>
  {#if round && ex}
    {#if asking}
      <p class="note centre"><Phrases text={tr('reWait')} /></p>
    {:else if hands.length}
      {#if !shared}<p class="note centre"><Phrases text={tr('rePick')} /></p>{/if}
      {#each hands as h (h.who)}
        <div class="hand" data-sg-re-hand={h.who}>
          {#if shared}<Avatar person={h.who} worn size={24} />{/if}
          <div class="cards">
            {#each h.cards as card, k (`${s.r}:${k}`)}
              {@const [en, ja] = cardLine(ex, card)}
              {@const tried = s.tried[h.who]?.includes(k) ?? false}
              <button type="button" class="card press s-{h.who}" disabled={!live || tried} data-sfx="tick" data-sg-re-card={en} data-fits={card === 0 ? '' : undefined} onclick={() => tap(h.who, k)}>
                <span class="txt"><b lang="en">{en}</b>{#if levelOf(h.who) === 1}<small>{ja}</small>{/if}</span>
                <span class="this">{tr('reThis')}</span>
              </button>
            {/each}
          </div>
        </div>
      {/each}
    {:else}
      <p class="note centre"><Phrases text={tr('reAsks', { name: nameOf(round.asker) })} /></p>
    {/if}
  {/if}
</div>

<style>
  .re { display: flex; flex-direction: column; gap: 8px; }
  .re > :global(*) { flex-shrink: 0; }
  .head { display: flex; align-items: center; gap: 6px; }
  .say { background: color-mix(in srgb, var(--c-rose) 40%, var(--c-cream)); color: var(--c-ink); }
  .chat { display: flex; flex-direction: column; gap: 6px; max-height: 172px; margin: 0; padding: 2px 0; list-style: none; overflow-y: auto; overscroll-behavior: contain; }
  .msg { display: flex; align-items: flex-end; gap: 6px; animation: in 220ms ease-out; }
  .msg p { margin: 0; padding: 7px 12px; border-radius: 16px; font: 600 16px/1.3 var(--font-body); color: var(--c-ink); text-wrap: pretty; }
  .msg.q p { background: var(--c-card); box-shadow: 0 2px 0 var(--c-edge); border-bottom-left-radius: 4px; }
  .msg.a { flex-direction: row-reverse; }
  .msg.a p { background: color-mix(in srgb, var(--c-mint) 45%, var(--c-cream)); border-bottom-right-radius: 4px; }
  .msg.now p { font-size: 19px; }
  .msg small { display: block; padding: 2px 12px 0; font: 600 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  @keyframes in { from { opacity: 0; translate: 0 8px; } }
  .note { margin: 0; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); text-wrap: pretty; }
  .centre { text-align: center; }
  .hand { display: flex; align-items: center; gap: 6px; }
  .cards { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
  .card { display: flex; align-items: center; gap: 8px; min-height: 52px; margin: 0 0 3px; padding: 6px 6px 6px 12px; appearance: none; border: 0; cursor: pointer; text-align: start;
    border-radius: 16px; background: var(--c-card); box-shadow: var(--sh-ctl); color: var(--c-ink); touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
  .card:disabled { opacity: .35; }
  .txt { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .txt b { font: 600 17px/1.25 var(--font-body); text-wrap: pretty; }
  .txt small { font: 600 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .this { flex: none; display: grid; place-items: center; min-width: 60px; min-height: 40px; padding: 0 10px; border-radius: var(--r-pill);
    background: var(--c-yuzu); box-shadow: 0 2px 0 var(--c-yuzu-lip); font: 700 var(--fs-s)/1 var(--font-ui); color: var(--c-ink); }
  /* passed round: each seat's colour, its head beside it */
  .s-A { background: color-mix(in srgb, var(--c-sky) 25%, var(--c-card)); }
  .s-B { background: color-mix(in srgb, var(--c-rose) 28%, var(--c-card)); }
  .s-G { background: color-mix(in srgb, var(--c-lilac) 40%, var(--c-card)); }
</style>
