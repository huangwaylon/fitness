<script lang="ts">
  // One question of ききみみ クイズ (docs/kikimimi.md "The game"): the speaker pops in (the lead-in), their bubble stays
  // empty 「♪…」 with a bar the clip's length while it plays, 🔁 and 🐢 (levels 1-2) under it as often as wanted (off
  // on おなじへや's other phones: the host's plays them); what to listen for (the item's `ask`, or its type's) and a word
  // item's line with its blank; the choices dimmed until the first play ends, then one final tap; each player's ✓ as
  // they answer. The reveal: ○ on the right choice, × on a wrong pick, the English (its key words marked), the Japanese
  // (a reply's on two lines) and the accent, +100 and the 「いっぱつ！」 stamp (a badge, no points), a missed picture's
  // name, the speaker's ✨ / 💦 and each player's, the host's word. The reveal is untimed: the host's つぎへ (with how many
  // tapped よみおわった), the others' よみおわった (📖 on their chip); solo, my つぎへ; the host gone, anyone's つぎへ. The
  // answer window's bar only when it's timed (こたえる じかん なし: none). The question sits mid-screen on a tall phone.
  // A dialogue (gist, next): both speakers' heads, the one talking bobbing; at the reveal the verdict and only the right
  // choice and my pick (never under the sticky つぎへ), then its two-sided transcript
  // (Transcript.svelte) with the focus marked; level 4's `note` (the trap) under the accent. Co-op (several, not
  // たいせん): the others' chips only ✓, no points, and how many got it at the reveal (「2にん せいかい！」), never who.
  // A staged item (level 4: a scene, or a phone, PA or video call) shows the scene card instead of the plain stage from
  // the lead-in to the reveal (scene/SceneCard.svelte); at the reveal the English carries its sound marks and the karaoke
  // as it replays (scene/SoundLine.svelte), the marks' key under it.
  // A スピード はしご rung: the ladder over the stage (its four speeds as rising steps: climbed, this one, ahead, or
  // stopped), the question in Japanese (rung 4: the line with its chunk blanked); at a rung's reveal whether it climbed
  // (right on the first listen, every rung under it climbed: +100), and below the top no line and no replay (the next
  // rung's listen is the next, faster one); the top's reveal the line, its marks and how high the ladder went.
  import { hidesLine, type QuizGame } from './game.svelte.ts';
  import { RUNG_POINTS, SPEEDS, laddersIn, rungState, sx } from '#lib/kikimimi/ladder.ts';
  import { PIC_JA, isDialogue, jaLines, splitFocus, type Item } from '#lib/kikimimi/bank.ts';
  import Transcript from './Transcript.svelte';
  import SceneCard from './scene/SceneCard.svelte';
  import SoundLine from './scene/SoundLine.svelte';
  import MarkLegend from './scene/MarkLegend.svelte';
  import { isStaged, rosterName as name, speakersOf } from './scene/stage.ts';
  import { RIGHT, firstListen } from '#lib/kikimimi/score.ts';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import Host from '../characters/Host.svelte';
  import Mark from '../ui/Mark.svelte';
  import PlayerChip from './PlayerChip.svelte';
  import { villagerArt } from '#lib/art.ts';
  import { t } from '#lib/i18n/index.ts';

  let { game }: { game: QuizGame } = $props();
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
  const open = $derived(v.phase === 'answer' && !mine && !v.out);
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
  const slowOk = $derived((game.items[v.i]?.lv ?? v.lv) <= 2); // the item's level (にがて れんしゅう mixes levels)
  const solo = $derived(v.players.length <= 1);
  /** Co-op (a game of several, not たいせん): no one's score or right / wrong on the others' chips, only how many got it. */
  const coop = $derived(!solo && !v.vs);

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
  /** The reveal's verdict: sat out, right, wrong (a pick) or none (time up). */
  const verdict = $derived(v.out ? 'out' : right ? 'right' : mine ? 'wrong' : 'none');

  function chip(p: (typeof v.players)[number]): 'answered' | 'right' | 'wrong' | 'away' | null {
    if (reveal) return coop ? (p.pick ? 'answered' : null) : p.pick ? (p.pick.ok ? 'right' : 'wrong') : null;
    if (p.answered) return 'answered';
    return p.here ? null : 'away';
  }
  /** A choice's look: mine (picked, before the reveal), right (○), wrong (my pick, ×), or none. */
  function mark(k: number): 'mine' | 'right' | 'wrong' | null {
    if (!it) return null;
    if (reveal) return k === it.answer ? 'right' : mine?.k === k ? 'wrong' : null;
    return mine?.k === k ? 'mine' : null;
  }
</script>

{#snippet hearRow()}
  {#if (v.speaks || game.listenOnly) && !v.out && !(reveal && hidesLine(it))}
    <!-- 🔁 / 🐢 under the bubble, the clip's own controls (おなじへや on another's phone: shown, never live; the host's phone plays them for the room) -->
    <div class="hear">
      <button type="button" class="btn small paper" data-kiki-replay aria-disabled={!canHear} data-sfx="tick" onclick={() => canHear && game.replay(false)}>🔁 {t('kiki.replay')}</button>
      {#if slowOk}<button type="button" class="btn small paper" data-kiki-slow aria-disabled={!canHear} data-sfx="tick" onclick={() => canHear && game.replay(true)}>🐢 {t('kiki.slow')}</button>{/if}
      {#if game.listenOnly}<small class="hint" data-kiki-host-plays>{t('kiki.replayHost')}</small>{/if}
    </div>
  {/if}
{/snippet}

{#if it}
  <div class="q" data-kiki-q={v.i} data-type={it.type} data-phase={v.phase}>
    {#if !solo}
      <div class="players">
        {#each v.players as p (p.who)}<PlayerChip who={p.who} state={chip(p)} ready={p.ready} note={coop ? null : t('kiki.points', { n: p.score })} size={36} />{/each}
      </div>
    {/if}

    {#if rs}
      <!-- the ladder: its four speeds as rising steps -->
      <div class="ladder" data-kiki-rung={rs.n} data-kiki-ladder={it.rung!.ladder}>
        <span class="lname">{t('kiki.rung.which', { k: ladderNo, n: ladders.length })}</span>
        <ol class="steps" aria-label={t('kiki.rung.label', { x: sx(SPEEDS[rs.n - 1]), n: rs.n, of: rs.of })}>
          {#each SPEEDS as x, k (k)}<li data-step={step(k)} style:--h="{40 + k * 20}%"><span>{sx(x)}×</span></li>{/each}
        </ol>
      </div>
    {/if}

    {#if card}
      <div class="staged" data-kiki-card>
        <SceneCard {it} {talker} {bar} now={game.now} pop={v.phase === 'lead'} {name} />
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
        <div class="bubble" class:open={reveal} aria-live="polite">
          {#if reveal && dlg}
            <span class="accent" data-accent={it.voice}>{t(`kiki.accent.${it.voice}`)}</span>
            {#if it.note}<p class="note" data-kiki-note>{it.note}</p>{/if}
          {:else if reveal && hidesLine(it)}
            <!-- a rung below the top: the line stays a secret till the top's reveal -->
            <p class="notes" aria-label={t('kiki.listen')}>♪…</p>
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
            {#if it.note}<p class="note" data-kiki-note>{it.note}</p>{/if}
          {:else}
            <p class="notes" aria-label={t('kiki.listen')}>♪…</p>
            <span class="track" aria-hidden="true">
              {#if bar}{#key bar.key}<i style:animation-duration="{Math.max(1, bar.until - bar.from)}ms" style:animation-delay="{-Math.max(0, game.now - bar.from)}ms"></i>{/key}{/if}
            </span>
          {/if}
        </div>
        {@render hearRow()}
      </div>
    {/if}

    {#if !reveal}
      {#if ask}<p class="ask">{ask}</p>{/if}
      {#if it.type === 'word' && parts}
        <p class="line" lang="en">{parts[0]}<span class="blank" aria-label="____">　　　</span>{parts[2]}</p>
      {/if}
    {:else}
      <div class="verdict" class:ok={right} data-kiki-verdict={verdict}>
        {#if v.out}<p>{t('kiki.out')}</p>
        {:else}
          {#if rs}
            <!-- a rung: climbed (+100), or right but not climbed (a replay, or the ladder stopped under it), or missed -->
            <p data-kiki-climb={climbed ? 'up' : right ? 'held' : 'stop'}>
              {#if right}<span class="sym" aria-hidden="true">○</span>{t('kiki.right')}{#if climbed} <b>+{RUNG_POINTS}</b>{/if}
              {:else}<span class="sym" aria-hidden="true">×</span>{mine ? t('kiki.wrong') : t('kiki.timeUp')}{/if}
            </p>
            <span class="climb" class:up={climbed}>
              {#if climbed}{t(rs.n === rs.of ? 'kiki.rung.top' : 'kiki.rung.up', { x: sx(SPEEDS[rs.n - 1]) })}
              {:else if right && rs.open}{t('kiki.rung.replayed')}
              {:else if rs.open}{t('kiki.rung.stop', { x: sx(SPEEDS[rs.n - 1]) })}
              {:else}{t('kiki.rung.held')}{/if}
            </span>
          {:else}
          <p>
            {#if right}<span class="sym" aria-hidden="true">○</span>{t('kiki.right')} <b>+{RIGHT}</b>
            {:else}<span class="sym" aria-hidden="true">×</span>{mine ? t('kiki.wrong') : t('kiki.timeUp')}{/if}
          </p>
          {#if firstListen(right, !!mine?.rp, v.same)}<span class="bonus" data-kiki-bonus>{t('kiki.firstTry')}</span>{/if}
          {/if}
          {#if coop}<span class="team-now" data-kiki-team-now={v.rightNow}>{v.rightNow ? t('kiki.teamNow', { n: v.rightNow }) : t('kiki.teamNone')}</span>{/if}
          {#if !right && it.type === 'pic'}<span class="answer-is">{t('kiki.answerIs', { a: PIC_JA[it.choices[it.answer]] ?? '' })}</span>{/if}
        {/if}
      </div>
    {/if}

    <div class="choices" class:pics={it.type === 'pic'} class:dim={!open && !reveal && !mine} role="group" aria-label={t('kiki.pick')}>
      {#each it.choices as c, k (k)}
        {@const m = mark(k)}
        {#if !(reveal && dlg) || m}
        <button type="button" class="ch" data-choice={k} data-mark={m ?? undefined} aria-pressed={mine?.k === k}
          aria-disabled={!open} aria-label={it.type === 'pic' ? (PIC_JA[c] ?? '') : undefined} data-sfx={open ? 'choice-pick' : 'none'}
          onclick={() => open && game.answer(k)}>
          {#if it.type === 'pic'}<OfficialArt key={c} size="min(22vw, 92px)" eager />{:else}<span class="tx" lang={it.type === 'num' || (it.rung && it.type !== 'word') ? undefined : 'en'}>{c}</span>{/if}
          {#if m === 'right'}<span class="sym ok" aria-hidden="true">○</span>{:else if m === 'wrong'}<span class="sym ng" aria-hidden="true">×</span>{/if}
        </button>
        {/if}
      {/each}
    </div>

    {#if v.phase === 'answer' && Number.isFinite(v.limit)}
      <span class="timer" aria-hidden="true">{#key `${v.i}:${v.playEnd}`}<i style:animation-duration="{Math.max(1, v.limit - v.playEnd)}ms" style:animation-delay="{-Math.max(0, game.now - v.playEnd)}ms"></i>{/key}</span>
    {/if}

    <p class="status" role="status">
      {#if reveal && !v.out}<span class="cheer"><Host head size={30} animate={false} eager />{t(`kiki.cheer.${verdict}`)}</span>
      {:else if v.out && !reveal}{t('kiki.out')}
      {:else if mine && !reveal && !solo}{t('kiki.answered')} {t('kiki.waitOthers')}
      {:else if v.phase === 'lead' || v.phase === 'play'}{t('kiki.listen')}{/if}
    </p>

    <!-- a dialogue's transcript under its verdict and choices, so the answer is never under the sticky つぎへ -->
    {#if reveal && dlg}<Transcript it={dlg} talk={talking} from={game.talk && game.talk.i === v.i ? game.talk.from : null} {clock} />{/if}
  </div>

  {#if v.canNext}
    <div class="level-acts">
      <button type="button" class="btn" data-kiki-next data-kiki-ready-n={v.ready.n} data-sfx="confirm" onclick={() => game.next()}>
        {v.amHost && v.ready.of ? t('kiki.nextReady', { n: v.ready.n, m: v.ready.of }) : t('kiki.next')}
      </button>
    </div>
  {:else if v.canReady}
    {@const done = !!v.players.find((p) => p.who === game.me)?.ready}
    <div class="level-acts">
      <button type="button" class="btn" class:paper={done} data-kiki-ready aria-pressed={done} data-sfx={done ? 'none' : 'confirm'} onclick={() => !done && game.ready()}>
        {done ? t('kiki.readyWait') : `📖 ${t('kiki.readyTap')}`}
      </button>
    </div>
  {/if}
{/if}

<style>
  /* the question takes the scroller's room, its content centred: mid-screen on a tall phone, not a gap under it */
  .q { display: grid; gap: 12px; align-content: center; }
  :global(.kk-body) > .q { flex: 1 0 auto; }
  .players { display: flex; justify-content: center; gap: 14px; }

  /* the speaker and their NH bubble: the speaker's head left, the bubble's tail pointing at it */
  .stage { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 12px; padding: 4px 2px; }
  .speaker { position: relative; line-height: 0; transform-origin: 50% 100%; }
  .speaker.pop { animation: pop-in 420ms var(--ease-bounce) both; }
  .speaker.talk, .duo .one.talk { animation: bob 520ms ease-in-out infinite alternate; }
  /* a dialogue's two speakers, side by side (the one not talking a little back) */
  .duo { display: flex; gap: 2px; }
  .duo .one { line-height: 0; transform-origin: 50% 100%; transition: opacity var(--dur-quick); }
  .duo:has(.talk) .one:not(.talk) { opacity: .6; }
  .note { margin: 0; font: 700 var(--fs-xs)/1.45 var(--font-ui); color: var(--c-ink); position: relative; padding: 4px 8px; border-radius: 10px; background: color-mix(in srgb, var(--c-yuzu) 35%, transparent); }
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
  .track { position: relative; display: block; height: 8px; border-radius: var(--r-pill); background: color-mix(in srgb, var(--c-edge) 25%, transparent); overflow: hidden; }
  .track i { position: absolute; inset: 0; transform-origin: 0 50%; background: var(--c-leaf); border-radius: inherit; animation: grow linear both; }
  .en { margin: 0; font: 700 max(17px, var(--fs-talk))/1.4 var(--font-ui); position: relative; }
  .ja { margin: 0; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--c-ink-soft); position: relative; }
  .ja span { display: block; }
  .meta { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; position: relative; }
  .accent {
    justify-self: start; position: relative; padding: 3px 10px; border-radius: var(--r-pill); background: var(--c-mint); color: var(--c-ink);
    font: 700 var(--fs-xs)/1.2 var(--font-ui);
  }

  .ask, .line { margin: 0; text-align: center; font: 700 var(--fs-body)/1.5 var(--font-ui); }
  .line { font-size: max(17px, var(--fs-body)); }
  .blank { display: inline-block; min-width: 3.5em; border-bottom: 3px solid var(--text); margin: 0 4px; }
  .verdict { display: grid; justify-items: center; gap: 6px; }
  .verdict p { margin: 0; display: flex; align-items: baseline; justify-content: center; gap: 6px; flex-wrap: wrap; font: 700 var(--fs-title)/1.2 var(--font-ui); color: var(--coral-text); }
  .verdict.ok p { color: var(--leaf-text); }
  .verdict b { font-family: var(--font-num, var(--font-ui)); }
  .verdict .sym { font-size: 1.2em; }
  /* 「いっぱつ！」: a stamp beside the +100 (a badge, no points), tilted like a rubber stamp */
  .bonus {
    padding: 4px 12px; border-radius: 8px; rotate: -6deg; background: color-mix(in srgb, var(--c-yuzu) 55%, var(--card)); color: var(--c-coral-text);
    box-shadow: inset 0 0 0 2px var(--c-coral); font: 700 var(--fs-s)/1.2 var(--font-ui); animation: pop-in 320ms var(--ease-bounce) 200ms both;
  }
  /* co-op: how many of us got it (never who) */
  .team-now { padding: 4px 12px; border-radius: var(--r-pill); background: color-mix(in srgb, var(--c-leaf) 30%, var(--card)); color: var(--text); font: 700 var(--fs-s)/1.2 var(--font-ui); }
  .answer-is { font: 700 var(--fs-body)/1.3 var(--font-ui); color: var(--text); }

  .choices { display: grid; gap: 10px; transition: opacity var(--dur-quick); }
  .choices.pics { grid-template-columns: 1fr 1fr; }
  .choices.dim { opacity: .5; }
  .ch {
    appearance: none; border: 0; cursor: pointer; position: relative; min-height: clamp(56px, 8vh, 72px); padding: 10px 16px; border-radius: var(--r-card);
    display: grid; place-items: center; background: var(--ctl); color: var(--text); box-shadow: var(--sh-ctl);
    font: 700 max(17px, var(--fs-body))/1.3 var(--font-ui); text-align: center;
  }
  .pics .ch { aspect-ratio: 1.15; padding: 8px; }
  .ch[aria-disabled='true'] { cursor: default; }
  .ch:active:not([aria-disabled='true']) { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
  .ch[data-mark='mine'] { background: var(--ctl-sel); color: var(--c-ink); }
  .ch[data-mark='right'] { background: color-mix(in srgb, var(--c-leaf) 55%, var(--c-card)); color: var(--c-ink); box-shadow: inset 0 0 0 3px var(--c-leaf-edge), 0 var(--lip-h) 0 var(--c-leaf-edge); }
  .ch[data-mark='wrong'] { background: color-mix(in srgb, var(--c-coral) 30%, var(--c-card)); color: var(--c-ink); }
  .choices:has([data-mark='right']) .ch:not([data-mark]) { opacity: .55; }
  .ch .sym { position: absolute; top: 4px; right: 10px; font: 700 26px/1 var(--font-ui); }
  .ch .sym.ok { color: var(--c-leaf-text, var(--c-ink)); }
  .ch .sym.ng { color: var(--c-coral-text); }
  .tx { overflow-wrap: anywhere; }

  .timer { display: block; height: 6px; border-radius: var(--r-pill); background: var(--ctl-off); overflow: hidden; }
  .timer i { display: block; height: 100%; background: var(--c-yuzu); transform-origin: 0 50%; animation: shrink linear both; }
  .status { min-height: 1.4em; margin: 0; text-align: center; font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }
  /* the host's word on the verdict (しずえ's head) */
  .cheer { display: inline-flex; align-items: center; gap: 8px; font-size: var(--fs-body); color: var(--text); }
  /* 🔁 🐢 in one row under the speaker and the bubble, centred, small; おなじへや's others: off, with why */
  /* the scene card, 🔁 🐢 under it */
  .staged { display: grid; gap: 10px; }
  .hear { grid-column: 1 / -1; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 8px; }
  .hear .btn.small { flex: 0 1 auto; white-space: nowrap; }
  .hint { font: 700 var(--fs-xs)/1.3 var(--font-ui); color: var(--text-soft); }
  /* つぎへ: the host's one action at the foot */
  .level-acts [data-kiki-next], .level-acts [data-kiki-ready] { min-height: var(--cta-h); font-size: var(--fs-talk); }
  .level-acts [data-kiki-ready][aria-pressed='true'] { font-size: var(--fs-body); }

  /* スピード はしご: the ladder's four speeds as steps rising left to right (climbed leaf, this one yuzu, stopped coral) */
  .ladder { display: flex; align-items: flex-end; justify-content: center; gap: 12px; }
  .lname { font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); padding-bottom: 2px; }
  .steps { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(4, 46px); align-items: end; gap: 4px; height: 44px; }
  .steps li {
    height: var(--h); border-radius: 8px 8px 4px 4px; display: grid; align-items: end; justify-items: center; padding-bottom: 2px;
    background: var(--ctl-off); color: var(--text-soft); font: 700 11px/1 var(--font-num, var(--font-ui));
  }
  .steps li[data-step='up'] { background: var(--c-leaf); color: var(--c-ink); }
  .steps li[data-step='now'] { background: var(--c-yuzu); color: var(--c-ink); box-shadow: inset 0 0 0 2px var(--c-edge); }
  .steps li[data-step='off'] { background: color-mix(in srgb, var(--c-coral) 35%, var(--card)); color: var(--c-ink); }
  .climb { padding: 4px 12px; border-radius: var(--r-pill); background: var(--ctl-off); color: var(--text); font: 700 var(--fs-s)/1.3 var(--font-ui); text-align: center; }
  .climb.up { background: var(--c-yuzu); color: var(--c-ink); animation: pop-in 320ms var(--ease-bounce) 200ms both; }
  .later, .height { margin: 0; font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--c-ink-soft); position: relative; }
  .height { color: var(--c-ink); }

  @keyframes grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  @keyframes shrink { from { transform: scaleX(1); } to { transform: scaleX(0); } }
  @keyframes bob { from { transform: translateY(0); } to { transform: translateY(-5px); } }
  @keyframes pop-in { from { transform: scale(.3); opacity: 0; } to { transform: none; opacity: 1; } }
  @media (prefers-reduced-motion: reduce) {
    .speaker.pop, .speaker.talk, .duo .one.talk, .react, .bonus, .climb.up { animation: none; }
    .choices { transition: none; }
  }
</style>
