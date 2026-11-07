<script lang="ts">
  // One question of ききみみ クイズ (docs/kikimimi.md "The game"), in the round's frame (frame/RoundFrame.svelte: the
  // players' chips, the timer, the status line, つぎへ / よみおわった): the speaker pops in (the lead-in), their bubble
  // stays empty 「♪…」 with a bar the clip's length while it plays, 🔁 and 🐢 (levels 1-2) under it as often as wanted (off
  // on おなじへや's other phones: the host's plays them); what to listen for (the item's `ask`, or its type's) and a word
  // item's line with its blank; the choices (frame/ChoiceGrid.svelte) dimmed until the first play ends, then one final
  // tap. The reveal: ○ on the right choice, × on a wrong pick, the English (its key words marked), the Japanese (a reply's
  // on two lines) and the accent, the verdict (Verdict.svelte over frame/RevealFrame.svelte), the speaker's ✨ / 💦.
  // A dialogue (gist, next): both speakers' heads, the one talking bobbing; at the reveal the verdict and only the right
  // choice and my pick (never under the sticky つぎへ), then its two-sided transcript
  // (Transcript.svelte) with the focus marked; level 4's `note` (the trap) under the accent.
  // A game's own parts around the round (a lane's play view: the tournament's taikai/TaikaiPlay.svelte, みみ チェック's
  // check/CheckPlay.svelte): `show` above the frame (the show's bar), `gate` above the choices (the wager's bet, its
  // reveal), `hold` the choices waiting (the wager's, for a bet), `plain` a verdict without points (the check's).
  // A staged item (level 4: a scene, or a phone, PA or video call) shows the scene card instead of the plain stage from
  // the lead-in to the reveal (scene/SceneCard.svelte); at the reveal the English carries its sound marks and the karaoke
  // as it replays (scene/SoundLine.svelte), the marks' key under it.
  // The Japanese help (docs/kikimimi.md "Japanese help"), each where the item has it: the situation (`ctx`) under the
  // speaker until the reveal; at the reveal each choice's Japanese (`cja`) under it and 解説 (`why`, frame/Why.svelte)
  // under the verdict.
  // A スピード はしご rung: the ladder over the stage (its four speeds as rising steps: climbed, this one, ahead, or
  // stopped), the question in Japanese (rung 4: the line with its chunk blanked); at a rung's reveal whether it climbed
  // (right on the first listen, every rung under it climbed: +100), and below the top no line and no replay (the next
  // rung's listen is the next, faster one); the top's reveal the line, its marks and how high the ladder went.
  import type { Snippet } from 'svelte';
  import { canSlow, hidesLine, type QuizGame } from './game.svelte.ts';
  import { SPEEDS, laddersIn, rungState } from '#lib/kikimimi/ladder.ts';
  import { sx } from './look.ts';
  import { PIC_JA, isDialogue, jaLines, splitFocus, type Item } from '#lib/kikimimi/bank.ts';
  import Transcript from './Transcript.svelte';
  import LadderSteps from './LadderSteps.svelte';
  import Verdict from './Verdict.svelte';
  import RoundFrame from './frame/RoundFrame.svelte';
  import ChoiceGrid from './frame/ChoiceGrid.svelte';
  import Why from './frame/Why.svelte';
  import ClipBar from './scene/ClipBar.svelte';
  import SceneCard from './scene/SceneCard.svelte';
  import SoundLine from './scene/SoundLine.svelte';
  import MarkLegend from './scene/MarkLegend.svelte';
  import { isStaged, rosterName as name, speakersOf } from './scene/stage.ts';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import Mark from '../ui/Mark.svelte';
  import { villagerArt } from '#lib/art.ts';
  import { t } from '#lib/i18n/index.ts';

  let { game, show, gate, hold = false, plain = false }: { game: QuizGame; show?: Snippet; gate?: Snippet; hold?: boolean; plain?: boolean } = $props();
  const v = $derived(game.view);
  const it = $derived<Item | undefined>(game.items[v.i]);
  const reveal = $derived(v.phase === 'reveal');
  /** A dialogue (gist, next): its two speakers' heads while it plays, the one talking bobbing; its transcript at the reveal. */
  const dlg = $derived(it && isDialogue(it) ? it : null);
  const duo = $derived(dlg ? speakersOf(dlg) : []);
  const talking = $derived(game.talk && game.talk.i === v.i ? game.talk.k : -1);
  /** Who's talking now (before the first turn's timer: the first speaker). */
  const talker = $derived(dlg ? dlg.lines[Math.max(0, talking)].who : null);
  /** The scene card in place of the stage: a staged item, before its reveal. */
  const card = $derived(!!it && !reveal && isStaged(it));
  /** A single item's clip replaying at the reveal: when it started (its karaoke). */
  const playFrom = $derived(!dlg && game.sounding && game.sounding.i === v.i ? game.sounding.from : null);
  const clock = () => game.clock();
  const mine = $derived(v.answers[v.i] ?? null);
  const right = $derived(!!mine && !!it && mine.k === it.answer);
  /** The choices take a tap: the answer window, not answered, not sat out. */
  const open = $derived(v.phase === 'answer' && !mine && !v.out && !hold);
  /** 🔁 / 🐢 once the first play is over, on a phone that speaks (not at a ladder rung's reveal below the top). */
  const canHear = $derived(v.speaks && !v.out && (v.phase === 'answer' || (reveal && !hidesLine(it))));
  /** A スピード はしご rung: where it is on its ladder, which ladder of the game, and whether this rung climbs. */
  const rs = $derived(it?.rung ? rungState(game.items, v.answers, v.i) : null);
  const ladders = $derived(it?.rung ? laddersIn(game.items) : []);
  const ladderNo = $derived(ladders.findIndex((l) => l.ladder === it?.rung?.ladder) + 1);
  /** This rung climbed (its reveal): right on the first listen with every rung under it climbed. */
  const climbed = $derived(!!rs && reveal && rs.open && right && !mine?.rp);
  /** The ladder's height after this rung (its reveal): the rungs under it, and this one if it climbed. */
  const height = $derived(rs ? rs.below + (climbed ? 1 : 0) : 0);
  /** A step's look on the ladder: climbed, stopped (a miss or a replay under it), this one, or ahead. */
  function step(k: number): 'up' | 'off' | 'now' | 'ahead' {
    if (!rs) return 'ahead';
    if (k < rs.n - 1) return k < rs.below ? 'up' : 'off';
    if (k === rs.n - 1) return reveal ? (climbed ? 'up' : 'off') : 'now';
    return 'ahead';
  }
  /** Co-op (a game of several, not たいせん): how many got it at the reveal, never who. */
  const coop = $derived(v.players.length > 1 && !v.vs);

  /** The bubble's bar: a replay sounding, else the first play (on every phone: おなじへや's others hear the host's). */
  const bar = $derived.by(() => {
    const s = game.sounding;
    if (s && s.i === v.i) return { from: s.from, until: s.until, key: `r${s.from}` };
    if (v.phase === 'play') return { from: v.playAt, until: v.playEnd, key: `p${v.i}:${v.playAt}` };
    return null;
  });
  /** The `en` around its focus (marked at the reveal; a word item's blank before it). */
  const parts = $derived(it ? splitFocus(it) : null);
  /** What to listen for: the item's own question, else its type's (word, reply). */
  const ask = $derived(it ? (it.ask ?? (it.type === 'word' || it.type === 'reply' ? t(`kiki.ask.${it.type}`) : '')) : '');
  /** The reveal's verdict (しずえ's word on it): sat out, right, wrong (a pick) or none (time up). */
  const verdict = $derived(v.out ? 'out' : right ? 'right' : mine ? 'wrong' : 'none');
  /** A dialogue's line being spoken at this question: when it started (its karaoke in the transcript). */
  const talkFrom = $derived(game.talk && game.talk.i === v.i ? game.talk.from : null);
</script>

{#snippet fold(body: Snippet)}
  <!-- a lesson's reveal folds the depth (the trap's note, a dialogue's transcript) under 「くわしく」 (docs/curriculum-units.md §3: depth optional) -->
  {#if game.lesson}<details class="more" data-kiki-more><summary data-sfx="tick">{t('kiki.more')}</summary>{@render body()}</details>
  {:else}{@render body()}{/if}
{/snippet}
{#snippet note()}<p class="note" data-kiki-note>{it?.note}</p>{/snippet}
{#snippet situation()}{#if it?.ctx && !reveal}<p class="ctx" data-kiki-ctx>{it.ctx}</p>{/if}{/snippet}
{#snippet listening()}<p class="notes"><span aria-hidden="true">♪…</span><span class="sr-only">{t('kiki.listen')}</span></p>{/snippet}

{#snippet hearRow()}
  {#if (v.speaks || game.listenOnly) && !v.out && !(reveal && hidesLine(it))}
    <!-- 🔁 / 🐢 under the bubble, the clip's own controls (おなじへや on another's phone: shown, never live; the host's phone plays them for the room) -->
    <div class="hear">
      <button type="button" class="btn small paper" data-kiki-replay aria-disabled={!canHear} data-sfx="tick" onclick={() => canHear && game.replay(false)}>🔁 {t('kiki.replay')}</button>
      {#if canSlow(it!)}<button type="button" class="btn small paper" data-kiki-slow aria-disabled={!canHear} data-sfx="tick" onclick={() => canHear && game.replay(true)}>🐢 {t('kiki.slow')}</button>{/if}
      {#if game.listenOnly}<small class="hint" data-kiki-host-plays>{t('kiki.replayHost')}</small>{/if}
    </div>
  {/if}
{/snippet}

{#if it}
{#snippet stage()}
  {#if rs}
    <!-- the ladder: its four speeds as rising steps -->
    <div class="ladder" data-kiki-rung={rs.n} data-kiki-ladder={it.rung!.ladder}>
      <span class="lname">{t('kiki.rung.which', { k: ladderNo, n: ladders.length })}</span>
      <LadderSteps {step} label={t('kiki.rung.label', { x: sx(SPEEDS[rs.n - 1]), n: rs.n, of: rs.of })} />
    </div>
  {/if}

  {#if card}
    <div class="staged" data-kiki-card>
      <SceneCard {it} {talker} {bar} now={game.now} pop={v.phase === 'lead'} {name} />
      {@render situation()}
      {@render hearRow()}
    </div>
  {:else}
    <div class="stage" class:dlg={reveal && dlg}>
      {#if dlg}
        <span class="speaker duo" class:pop={v.phase === 'lead'} data-kiki-duo>
          {#each duo as who (who)}
            <span class="one" class:talk={!!bar && talker === who}>
              <OfficialArt key={villagerArt(who, true)} alt={name(who)} size={reveal ? 44 : 56} eager />
            </span>
          {/each}
          {#if reveal && !v.out}<span class="react" aria-hidden="true"><Mark id={right ? 'sparkle' : 'sweat'} /></span>{/if}
        </span>
      {:else}
        <span class="speaker" class:pop={v.phase === 'lead'} class:talk={!!bar}>
          <OfficialArt key={villagerArt(it.speaker, true)} alt={name(it.speaker)} size={76} eager />
          {#if reveal && !v.out}<span class="react" aria-hidden="true"><Mark id={right ? 'sparkle' : 'sweat'} /></span>{/if}
        </span>
      {/if}
      <div class="bubble obj-cream" class:open={reveal} aria-live="polite">
        {#if reveal && dlg}
          <span class="accent" data-accent={it.voice}>{t(`kiki.accent.${it.voice}`)}</span>
          {#if it.note}{@render fold(note)}{/if}
        {:else if reveal && hidesLine(it)}
          <!-- a rung below the top: the line stays a secret till the top's reveal -->
          {@render listening()}
          <p class="later" data-kiki-later>{t('kiki.rung.later', { x: sx(SPEEDS[it.rung!.n]) })}</p>
        {:else if reveal && parts}
          {#if rs}<p class="height" data-kiki-height={height}>{height ? t('kiki.rung.height', { x: sx(SPEEDS[height - 1]) }) : t('kiki.rung.none')}</p>{/if}
          <p class="en" data-kiki-en><SoundLine en={it.en} focus={it.focus} marks={it.marks} clip={it.id} from={playFrom} {clock} /></p>
          <p class="ja">{#each jaLines(it) as l, n (n)}<span>{l}</span>{/each}</p>
          <!-- the accent and the marks' key on one row (the key wraps under it when long) -->
          <div class="meta">
            <span class="accent" data-accent={it.voice}>{t(`kiki.accent.${it.voice}`)}</span>
            {#if it.marks}<MarkLegend marks={it.marks} />{/if}
          </div>
          {#if it.note}{@render fold(note)}{/if}
        {:else}
          {@render listening()}
          <ClipBar {bar} now={game.now} height={8} />
        {/if}
      </div>
      {@render situation()}
      {@render hearRow()}
    </div>
  {/if}
{/snippet}

{#snippet input()}
  {@render gate?.()}
  {#if !reveal}
    {#if ask}<p class="ask">{ask}</p>{/if}
    {#if it.type === 'word' && parts}
      <p class="line" lang="en">{parts[0]}<span class="blank"><span aria-hidden="true">　　　</span><span class="sr-only">{t('kiki.blank')}</span></span>{parts[2]}</p>
    {/if}
  {:else}
    <Verdict {it} out={v.out} {right} picked={!!mine} replayed={!!mine?.rp} same={v.same} {rs} {climbed} {coop} rightNow={v.rightNow} {plain} sand={v.players.length <= 1 && v.speaks && !hidesLine(it) ? game : undefined} />
    {#if it.why}<Why text={it.why} />{/if}
  {/if}

  <ChoiceGrid choices={it.choices} right={it.answer} pics={it.type === 'pic'} label={it.type === 'pic' ? (c) => PIC_JA[c] ?? '' : undefined}
    english={!(it.type === 'num' || (it.rung && it.type !== 'word'))} ja={it.type === 'pic' ? undefined : it.cja} {open} {reveal} dim={!open && !reveal && !mine} picked={mine?.k ?? null}
    onlyMarked={reveal && !!dlg} onpick={(k) => game.answer(k)} />
{/snippet}

{#snippet after()}
  <!-- a dialogue's transcript under its verdict and choices, so the answer is never under the sticky つぎへ -->
  {#if reveal && dlg}
    {#snippet transcript()}<Transcript it={dlg} talk={talking} from={talkFrom} {clock} />{/snippet}
    {@render fold(transcript)}
  {/if}
{/snippet}

  {@render show?.()}
  <RoundFrame {v} now={game.now} me={game.me} type={it.type} answered={!!mine} {verdict} {stage} {input} {after}
    onnext={() => game.next()} onready={() => game.ready()} />
{/if}

<style>
  /* the speaker and their NH bubble: the speaker's head left, the bubble's tail pointing at it */
  .stage { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 12px; padding: 4px 2px; }
  .speaker { position: relative; line-height: 0; transform-origin: 50% 100%; }
  .speaker.pop { animation: pop-in 420ms var(--ease-bounce) both; }
  .speaker.talk, .duo .one.talk { animation: bob 520ms ease-in-out infinite alternate; }
  /* a dialogue's two speakers, side by side (the one not talking a little back) */
  .duo { display: flex; gap: 2px; }
  .duo .one { line-height: 0; transform-origin: 50% 100%; transition: opacity var(--dur-quick); }
  .duo:has(.talk) .one:not(.talk) { opacity: .6; }
  /* 「くわしく」: the full 44px to tap (padded round its one line; the marker kept) */
  .more summary { cursor: pointer; padding-block: calc((var(--hit) - 1.6em) / 2); font: 700 var(--fs-s)/1.6 var(--font-ui); color: var(--text-soft); }
  /* the trap's note (the explanation under the answer): in the cream bubble, a yuzu tint on cream */
  .note { margin: 0; font: 700 var(--fs-s)/1.5 var(--font-ui); color: var(--c-ink); position: relative; padding: 6px 10px; border-radius: 10px; background: color-mix(in srgb, var(--c-yuzu) 35%, var(--c-card)); }
  .react { position: absolute; right: -10px; top: -12px; width: 34px; height: 34px; animation: pop-in 320ms var(--ease-bounce) both; }
  .react :global(svg) { width: 100%; height: 100%; }
  .bubble {
    position: relative; min-height: 76px; display: grid; align-content: center; gap: 6px; padding: 12px 16px;
    border-radius: 28px; background: var(--c-card); color: var(--c-ink); box-shadow: 0 var(--lip-h) 0 var(--c-lip);
  }
  .bubble::before {
    content: ''; position: absolute; left: -9px; top: 50%; width: 20px; height: 20px; margin-top: -10px; rotate: 45deg;
    background: var(--c-card); border-radius: 4px;
  }
  .notes { margin: 0; font: 700 var(--fs-title)/1 var(--font-ui); color: var(--c-ink-soft); letter-spacing: .1em; }
  .en { margin: 0; font: 700 max(17px, var(--fs-talk))/1.4 var(--font-ui); position: relative; }
  .ja { margin: 0; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--c-ink-soft); position: relative; word-break: normal; line-break: strict; }
  .ja span { display: block; }
  .meta { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; position: relative; }
  .accent {
    justify-self: start; position: relative; padding: 3px 10px; border-radius: var(--r-pill); background: var(--c-mint); color: var(--c-ink);
    font: 700 var(--fs-s)/1.2 var(--font-ui);
  }

  .ask, .line { margin: 0; text-align: center; font: 700 var(--fs-body)/1.5 var(--font-ui); }
  .line { font-size: max(17px, var(--fs-body)); }
  .blank { display: inline-block; min-width: 3.5em; border-bottom: 3px solid var(--text); margin: 0 4px; }

  /* the scene card, 🔁 🐢 under it */
  .staged { display: grid; gap: 10px; }
  /* 🔁 🐢 in one row under the speaker and the bubble, centred, small; おなじへや's others: off, with why */
  .hear { grid-column: 1 / -1; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 8px; }
  .hear .btn.small { flex: 0 1 auto; white-space: nowrap; }
  /* the situation, under the speaker: quiet, one line */
  .ctx { grid-column: 1 / -1; margin: 0; text-align: center; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .hint { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }

  /* スピード はしご: which ladder, and its four speeds as steps (LadderSteps) */
  .ladder { display: flex; align-items: flex-end; justify-content: center; gap: 12px; }
  .lname { font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); padding-bottom: 2px; }
  .later, .height { margin: 0; font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--c-ink-soft); position: relative; }
  .height { color: var(--c-ink); }

  @keyframes bob { from { transform: translateY(0); } to { transform: translateY(-5px); } }
  @keyframes pop-in { from { transform: scale(.3); opacity: 0; } to { transform: none; opacity: 1; } }
  @media (prefers-reduced-motion: reduce) {
    .speaker.pop, .speaker.talk, .duo .one.talk, .react { animation: none; }
  }
</style>
