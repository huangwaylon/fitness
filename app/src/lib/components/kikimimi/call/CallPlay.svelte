<script lang="ts">
  // A round of ようじ でんわ (docs/curriculum-wave2.md §2.3; games/call/def.ts), its own chunk, in the round's frame
  // (frame/RoundFrame.svelte). Round 1 of a call: the NookPhone (scene/SceneCard's PhoneFrame over the room, its bars
  // dropping while a line breaks up) with the situation (`ctx`) under it, and the memo under that, its chips tappable
  // while the call plays; 「メモできた」 sends it once the call has ended and my rows are filled. Round 2: the call over
  // (no play), the rest of the memo from memory. 🔁 as often as wanted in either (round 1's counts as a replay; round 2
  // plays the call again for me alone). Co-op 「わけて メモ」: both hear the whole call, my rows every other one, the
  // partner's dashed. The reveal: ○ / × and my rows right, each row's right chip and its Japanese, the errand's basket
  // filling with what we caught (the rows still to come blank), then the trap's note, 解説 and the call's transcript.
  import type { QuizGame } from '../game.svelte.ts';
  import type { CallCard } from '#lib/kikimimi/games/call/def.ts';
  import { EMPTY } from '#lib/kikimimi/games/listened.ts';
  import { callOk, rowOk } from '#lib/kikimimi/games/call/def.ts';
  import { RIGHT, firstListen } from '#lib/kikimimi/score.ts';
  import { basketOf, hear, myRows, revealRows, rightJa, roundFor, teamMemo, whyOf } from './board.ts';
  import { blank, isCoop } from '../listenView.ts';
  import MemoPad from './MemoPad.svelte';
  import Basket from './Basket.svelte';
  import CallLog from './CallLog.svelte';
  import RoundFrame from '../frame/RoundFrame.svelte';
  import RevealFrame from '../frame/RevealFrame.svelte';
  import Why from '../frame/Why.svelte';
  import SceneCard from '../scene/SceneCard.svelte';
  import { rosterName as name } from '../scene/stage.ts';
  import OfficialArt from '../../characters/OfficialArt.svelte';
  import { villagerArt } from '#lib/art.ts';
  import { t } from '#lib/i18n/index.ts';

  let { game }: { game: QuizGame } = $props();
  const v = $derived(game.view);
  const cards = $derived(game.items as CallCard[]);
  const it = $derived(cards[v.i] as CallCard | undefined);
  const part = $derived(it?.call.part ?? 0);
  /** The call's own round (its clips): round 1, or the one before round 2. */
  const callIt = $derived(it ? cards[v.i - part] : undefined);
  const reveal = $derived(v.phase === 'reveal');
  const round = $derived(it ? roundFor(v, it) : null);
  const n = $derived(round?.rows.length ?? 0);
  const coop = $derived(isCoop(v));
  const mine = $derived(myRows(v, game.me, n));
  const sent = $derived(v.answers[v.i] ?? null);
  const sentA = $derived(sent && Array.isArray(sent.a) ? (sent.a as readonly number[]) : null);
  const calling = $derived(part === 0 && (v.phase === 'lead' || v.phase === 'play'));

  /** My memo this round (before 「メモできた」): kept by the round. */
  let work = $state<{ key: string; a: number[] } | null>(null);
  const key = $derived(`${v.g}:${v.i}`);
  const placed = $derived<readonly number[]>(sentA ?? (work?.key === key ? work.a : blank(n)));
  const full = $derived(mine.every((j) => placed[j] !== EMPTY));
  /** The chips take a tap: while the call plays and in the answer window, not sent, not sat out. */
  const open = $derived((v.phase === 'play' || v.phase === 'answer') && !sent && !v.out);
  function pick(j: number, k: number) {
    if (!open || !mine.includes(j)) return;
    const a = [...placed];
    a[j] = k;
    work = { key, a };
  }
  const done = () => v.phase === 'answer' && open && full && game.answer([...placed]);

  // the others' memos as each reveal shows them (the basket reads them after)
  $effect(() => hear(v, game.me));
  const team = $derived(reveal && it ? teamMemo(v, cards, v.i, game.me) : new Map());
  const right = $derived(!!sentA && !!round && callOk(round, sentA));
  const verdict = $derived(v.out ? 'out' : right ? 'right' : sent ? 'wrong' : 'none');
  const mineRight = $derived(sentA && round ? mine.filter((j) => rowOk(round, sentA, j)).length : 0);
  /** The memo as shown: my rows; at a co-op reveal, the partner's own rows too (at another tier). */
  const shownRows = $derived(it && round ? (reveal && coop ? revealRows(v, it, game.me) : round.rows) : []);
  /** My rows' places in what's shown, and my chips there (picks only ever come before the reveal: the same places). */
  const shownMine = $derived(mine.map((j) => shownRows.findIndex((r) => r.n === round?.rows[j]?.n)));
  const shownPlaced = $derived(shownRows.map((r) => placed[round?.rows.findIndex((x) => x.n === r.n) ?? -1] ?? EMPTY));
  /** The team's rows not right: of my round's, and of the partner's own (at another tier, rows I wasn't asked). */
  const teamShort = $derived(round ? new Set([...round.rows.filter((r) => !team.get(r.n)?.ok).map((r) => r.n), ...[...team].filter(([, x]) => !x.ok).map(([m]) => m)]).size : 0);
  const basket = $derived(reveal && it ? basketOf(v, cards, v.i, game.me) : []);
  const why = $derived(it ? whyOf(it) : undefined);
  let logOpen = $state(false);
  $effect(() => {
    void key;
    logOpen = false;
  });

  /** While a line breaks up (a `signal` call's "..."), the phone's bars drop. */
  const bars = $derived.by(() => {
    const k = game.talk && game.talk.i === v.i - part ? game.talk.k : -1;
    return callIt?.call.info.lines[k]?.drop ? 1 : 4;
  });
  const canHear = $derived(v.speaks && !v.out && (v.phase === 'answer' || reveal));
  /** 🔁: round 1 the round's clip again (a replay); round 2 the call for me (nothing of round 2's own plays). */
  const again = () => canHear && (part === 0 ? game.replay(false) : callIt && game.hear(callIt));
  const bar = $derived.by(() => {
    const s = game.sounding;
    if (s && (s.i === v.i || s.i === -1)) return { from: s.from, until: s.until, key: `r${s.from}` };
    if (v.phase === 'play') return { from: v.playAt, until: v.playEnd, key: `p${v.i}:${v.playAt}` };
    return null;
  });
</script>

{#if it && round}
{#snippet stage()}
  <div class="stage">
    {#if calling}
      <SceneCard it={it} talker={it.speaker} {bar} now={game.now} pop={v.phase === 'lead'} {name} {bars} />
    {:else}
      <div class="ended obj-cream" data-kiki-call-ended={part}>
        <span class="head"><OfficialArt key={villagerArt(it.speaker, true)} alt={name(it.speaker)} size={44} eager /></span>
        <span class="nm">{name(it.speaker)}</span>
        <span class="st">{part ? `📝 ${t('kiki.call.later')}` : `📞 ${t('kiki.call.ended')}`}</span>
      </div>
    {/if}
    {#if it.ctx && !reveal}<p class="ctx" data-kiki-ctx>{it.ctx}</p>{/if}
    {#if (v.speaks || game.listenOnly) && !v.out && !calling}
      <div class="hear">
        <button type="button" class="btn small paper" data-kiki-replay aria-disabled={!canHear} data-sfx="tick" onclick={again}>🔁 {t('kiki.replay')}</button>
        {#if game.listenOnly}<small class="hint" data-kiki-host-plays>{t('kiki.replayHost')}</small>{/if}
      </div>
    {/if}
  </div>
{/snippet}

{#snippet madeLine()}
  <span class="rows" data-kiki-call-rows={mineRight}>{t('kiki.call.rows', { k: mineRight, n: mine.length })}</span>
  {#if coop}<span class="team-now" data-kiki-call-team={teamShort}>{teamShort ? t('kiki.call.short', { k: teamShort }) : t('kiki.call.made')}</span>{/if}
{/snippet}

{#snippet input()}
  {#if reveal}
    <RevealFrame out={v.out} {right} picked={!!sent} pts={RIGHT} badge={firstListen(right, !!sent?.rp, v.same)} coop={false} rightNow={0} extra={v.out ? undefined : madeLine} />
  {:else if !v.out}
    <p class="ask">{coop ? t('kiki.call.coop') : t(part ? 'kiki.call.askLater' : 'kiki.call.askLive')}</p>
  {/if}

  {#if !v.out && (v.phase !== 'lead' || part === 0)}
    <MemoPad rows={shownRows} mine={shownMine} placed={shownPlaced} {open} {reveal} {team} ja={(m) => rightJa(it, m)} onpick={pick} />
  {/if}

  {#if v.phase === 'play' && !v.out && !sent}
    <p class="hint-line" data-kiki-call-after>{t('kiki.call.after')}</p>
  {:else if v.phase === 'answer' && !v.out && !sent}
    <div class="acts">
      <button type="button" class="btn" data-kiki-call-done aria-disabled={!full} data-sfx={full ? 'confirm' : 'none'} onclick={done}>✓ {t('kiki.call.done')}</button>
    </div>
  {/if}

  {#if reveal && !v.out}
    <Basket tags={basket} />
    {#if part === 1 && it.note}<p class="note" data-kiki-note>{it.note}</p>{/if}
    {#if why}<Why text={why} />{/if}
    {#if part === 1 && callIt}
      <button type="button" class="btn small paper log-btn" aria-expanded={logOpen} data-kiki-call-log-btn data-sfx="tick" onclick={() => (logOpen = !logOpen)}>
        {logOpen ? t('kiki.call.logClose') : t('kiki.call.log')}
      </button>
      {#if logOpen}<CallLog info={it.call.info} />{/if}
    {/if}
  {/if}
{/snippet}

<RoundFrame {v} now={game.now} me={game.me} type="call" answered={!!sent} {verdict} {stage} {input} onnext={() => game.next()} onready={() => game.ready()} />
{/if}

<style>
  .stage { display: grid; gap: 8px; }
  .ended { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 10px; padding: 8px 14px 8px 8px; border-radius: 22px; background: var(--c-card); color: var(--c-ink); box-shadow: 0 var(--lip-h) 0 var(--c-lip); }
  .head { width: 48px; height: 48px; border-radius: 50%; background: var(--c-mint); display: grid; place-items: center; overflow: hidden; line-height: 0; }
  .nm { font: 700 var(--fs-body)/1.2 var(--font-ui); }
  .st { font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); }
  .ctx { margin: 0; text-align: center; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .hear { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 8px; }
  .hint { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .ask { margin: 0; text-align: center; font: 700 var(--fs-body)/1.5 var(--font-ui); }
  .hint-line { margin: 0; text-align: center; font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }
  .acts { display: flex; justify-content: center; }
  .acts .btn { min-width: 10em; }
  .rows { font: 700 var(--fs-body)/1.2 var(--font-ui); color: var(--text); }
  .team-now { padding: 4px 12px; border-radius: var(--r-pill); background: color-mix(in srgb, var(--c-leaf) 30%, var(--card)); color: var(--text); font: 700 var(--fs-s)/1.2 var(--font-ui); }
  .note { margin: 0; font: 700 var(--fs-s)/1.5 var(--font-ui); color: var(--c-ink); padding: 6px 10px; border-radius: 10px; background: color-mix(in srgb, var(--c-yuzu) 35%, var(--c-card)); }
  .log-btn { justify-self: center; }
</style>
