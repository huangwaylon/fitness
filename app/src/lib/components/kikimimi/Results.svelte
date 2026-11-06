<script lang="ts">
  // ききみみ クイズ's results (docs/kikimimi.md "Results"): しずえ reads them out like the morning broadcast (the ranking,
  // the winner's row with 🏆, and how many I got right under her line; co-op, the default with several players: the
  // team's 「ふたりで 7/8」 and 「そろって せいかい」 instead, no ranking, no one's points), then the review list, the game's main learning
  // moment. With misses it opens on them (「まちがえた だけ」 on, the first one open) and offers 「まちがえた もんだいを
  // もういちど」 (those again, solo, as practice; a quiz's). Each row: ○ / × and the sentence; tapped open, its English
  // with the sound marks and the karaoke as ▶︎ plays it (a dialogue: its whole transcript), the marks' key, the Japanese
  // (a reply's on two lines), the trap's note, what I picked, ▶︎ and 🐢 (levels 1-2). いっぱつ (right on the first listen)
  // a stamp.
  // スピード はしご: しずえ's line is how high I climbed; a card of my climbs (each ladder's steps, how high); the review
  // one row a ladder: its line (the chunk marked), its Japanese and note, each rung's question with my ○ / ×, and ▶︎ at
  // each speed.
  import type { QuizGame } from './game.svelte.ts';
  import { PIC_JA, isDialogue, jaLines, splitFocus, type Item } from '#lib/kikimimi/bank.ts';
  import Transcript from './Transcript.svelte';
  import SoundLine from './scene/SoundLine.svelte';
  import MarkLegend from './scene/MarkLegend.svelte';
  import { firstListen } from '#lib/kikimimi/score.ts';
  import Bubble from '../ui/Bubble.svelte';
  import PlayerChip from './PlayerChip.svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import { villagerNameOf } from '#lib/ui-state/viewer.ts';
  import { t } from '#lib/i18n/index.ts';
  import { currentReport, currentUnits, recWords } from './progress.svelte.ts';
  import { stampsUnit } from '#lib/contract/listen.ts';
  import { LESSONS, type Lesson } from '#lib/kikimimi/stages.ts';
  import { feedbackFor } from '#lib/kikimimi/report.ts';
  import { tripKeys, tripsOf } from '#lib/kikimimi/advice.ts';
  import { SPEEDS, climbs, laddersIn, speedAt, sx } from '#lib/kikimimi/ladder.ts';

  let { game, onagain, onmissed, ondone }: { game: QuizGame; onagain: () => void; onmissed: () => void; ondone: () => void } = $props();
  const v = $derived(game.view);
  const items = $derived(game.items);
  /** Highest first; ties share a rank. */
  const ranking = $derived.by(() => {
    const rows = [...v.players].sort((a, b) => b.score - a.score);
    return rows.map((p) => ({ ...p, rank: rows.findIndex((q) => q.score === p.score) + 1 }));
  });
  /** Co-op (several players, not たいせん): the team's tally, no ranking and no one's points. */
  const coop = $derived(v.players.length > 1 && !v.vs);
  const teamKey = $derived(v.players.length >= 3 ? 'kiki.team.3' : 'kiki.team.2');
  /** スピード はしご: my climb on each ladder (rungs right on the first listen, in order), its ladders' places. */
  const ladders = $derived(laddersIn(items));
  const mine = $derived(climbs(items, new Map(v.answers.flatMap((a, i) => (a ? [[i, { k: a.k, rp: a.rp }] as const] : [])))));
  const best = $derived(mine.length ? Math.max(...mine) : 0);
  const line = $derived.by(() => {
    if (ladders.length && (ranking.length <= 1 || coop)) return best ? t('kiki.hostLadder', { x: sx(speedAt(best)!) }) : t('kiki.hostLadderNone');
    if (ranking.length <= 1) return t('kiki.hostSolo', { score: ranking[0]?.score ?? 0 });
    if (coop) return t(v.team.right >= v.n ? 'kiki.hostTeam.all' : v.team.right * 4 >= v.n * 3 ? 'kiki.hostTeam.good' : 'kiki.hostTeam.try');
    const top = ranking.filter((r) => r.rank === 1);
    return top.length > 1 || !week.view ? t('kiki.hostTie') : t('kiki.hostTop', { name: villagerNameOf(week.view, top[0].who) });
  });
  const ok = (i: number) => !!v.answers[i] && v.answers[i]!.k === items[i]?.answer;
  const tally = $derived(items.filter((_, i) => ok(i)).length);
  const misses = $derived(items.length - tally);
  /** いっぱつ: right with no replay or slow play (a stamp; no points). */
  const first = (i: number) => firstListen(ok(i), !!v.answers[i]?.rp, v.same);
  const firsts = $derived(items.filter((_, i) => first(i)).length);
  // with misses, the results open on them, the first one open (once: the filter and the rows are mine after)
  // svelte-ignore state_referenced_locally
  let missedOnly = $state(items.some((_, i) => !ok(i)));
  // svelte-ignore state_referenced_locally
  let opened = $state<number[]>([items.findIndex((_, i) => !ok(i))]);
  const toggle = (i: number) => (opened = opened.includes(i) ? opened.filter((x) => x !== i) : [...opened, i]);
  const rows = $derived(items.map((it, i) => ({ it, i, ok: ok(i), k: v.answers[i]?.k ?? null })).filter((r) => !missedOnly || !r.ok));
  /** A review row's ▶︎ playing this item: when it started (its karaoke). */
  const playing = (it: Item) => (game.sounding && game.sounding.i === -1 && game.sounding.at === it.id ? game.sounding.from : null);
  /** My feedback (docs/kikimimi.md "Recommendations and feedback"): しずえ's line from my きろく with this game in it,
   *  and what tripped me (this game's missed features). Mine alone, on my phone. */
  const recorded = $derived(game.recorded && game.recorded.g === v.g ? game.recorded : null);
  const fb = $derived.by(() => {
    const r = recorded ? currentReport() : null;
    return r && recorded ? feedbackFor(r, recorded.g) : null;
  });
  const fbLine = $derived.by(() => {
    if (!fb) return '';
    const head = fb.kind === 'up' ? t('kiki.fb.up', { skill: t(`kiki.skill.${fb.skill}`) }) : t(`kiki.fb.${fb.kind}`);
    return fb.next ? `${head} ${t('kiki.fb.next', { what: recWords(fb.next).title })}` : head;
  });
  const trips = $derived(recorded ? tripsOf({ r: recorded.r.map(([id, ok]) => ({ id, ok: ok === 1 })) }) : []);
  const tripLabel = (key: string) => (key.startsWith('f:') ? t(`kiki.f.${key.slice(2)}`) : t(`kiki.skill.${key.slice(2)}`));
  /** A unit's lesson (docs/curriculum-units.md §3, §4, §10): the strip with its unit's dots and the next core lesson; a
   *  チェック's stamp from my row (contract/listen.ts stampsUnit), the double stamp when the partner's summary has it too,
   *  and my own first-listen tally next to it (the team's too, in co-op). */
  const ls = $derived(game.lesson);
  const unitState = $derived(ls && recorded ? currentUnits().get(ls.unit.id) : undefined);
  const stamped = $derived(!!recorded && stampsUnit(recorded));
  const own = $derived(recorded ? recorded.r.filter(([, ok, , rp]) => ok === 1 && rp === 0).length : 0);
  const CORE: readonly Lesson[] = ['deai', 'bamen', 'check'];
  const nextLesson = $derived(CORE.find((l) => l !== ls?.lesson && !unitState?.done.includes(l)) ?? null);
  /** A choice as written (a picture's Japanese name: the English isn't given away). */
  const choiceText = (it: Item, k: number) => (it.type === 'pic' ? (PIC_JA[it.choices[k]] ?? '') : it.choices[k]);
</script>

<div class="results" data-kiki-results>
  <div class="host">
    <Bubble text={line} host="wave" size={64} />
    {#if coop}
      <div class="team card" data-kiki-team={v.team.right}>
        <b>{t(teamKey, { k: v.team.right, n: v.n })}</b>
        {#if v.team.all}<span data-kiki-team-all={v.team.all}>{t('kiki.teamAll', { k: v.team.all })}</span>{/if}
      </div>
    {/if}
    <p class="tally" data-kiki-tally={tally}>{t(coop ? 'kiki.tallyMine' : 'kiki.tally', { n: items.length, k: tally })}</p>
    {#if firsts}<p class="firsts"><span class="stamp" data-kiki-firsts={firsts}>{t('kiki.firstCount', { k: firsts })}</span></p>{/if}
  </div>

  {#if ls && recorded}
    <section class="lesson card" data-kiki-lesson-result={ls.lesson} data-kiki-stamped={stamped ? '1' : '0'}>
      <p class="lhead"><b>{ls.unit.name}</b>
        <span class="dots" aria-hidden="true">{#each LESSONS.filter((l) => ls.unit.lessons[l]) as l (l)}<i class:done={unitState?.done.includes(l)}>{CORE.includes(l) ? (unitState?.done.includes(l) ? '●' : '○') : unitState?.done.includes(l) ? '★' : '☆'}</i>{/each}</span></p>
      {#if ls.lesson === 'check'}
        {#if stamped}
          <p class="got" data-kiki-stamp-got data-double={unitState?.double ? '1' : undefined}>🏅{#if unitState?.double}🏅 {t('kiki.stamp.double')}{:else} {t('kiki.stamp.got')}{/if}</p>
        {:else}<p class="soon">{t('kiki.stamp.notYet')}</p>{/if}
        <p class="mine" data-kiki-tally-mine={own}>{t('kiki.stamp.mine', { k: own, n: recorded.r.length })}{#if recorded.tm !== undefined} · {t('kiki.stamp.team', { k: recorded.tm })}{/if}</p>
      {:else if nextLesson}<p class="soon" data-kiki-next-lesson={nextLesson}>{t('kiki.stamp.next', { lesson: t(`kiki.lesson.${nextLesson}`) })}</p>{/if}
    </section>
  {/if}

  <!-- たいせん: the ranking first (the game's outcome), then my feedback -->
  {#if ranking.length > 1 && !coop}
    <ol class="rank card">
      {#each ranking as r (r.who)}
        <li data-rank={r.rank} class:first={r.rank === 1}>
          <span class="no" class:top={r.rank === 1}>{#if r.rank === 1}<span class="cup" aria-hidden="true">🏆</span>{/if}{t('kiki.rank', { n: r.rank })}</span>
          <PlayerChip who={r.who} state={r.rank === 1 ? 'right' : null} size={44} />
          <b class="pts">{t('kiki.points', { n: r.score })}</b>
        </li>
      {/each}
    </ol>
  {/if}

  {#if ladders.length}
    <!-- スピード はしご: how high each ladder went -->
    <section class="climbs card" data-kiki-climbs={mine.join(',')}>
      <h3 class="sec-label in">{t('kiki.ladder.title')}</h3>
      <ul>
        {#each ladders as l, j (l.ladder)}
          <li data-kiki-climb-row={j} data-height={mine[j]}>
            <ol class="steps" aria-hidden="true">{#each SPEEDS as x, k (k)}<li class:up={k < mine[j]} style:--h="{40 + k * 20}%"><span>{sx(x)}×</span></li>{/each}</ol>
            <b>{mine[j] ? t('kiki.ladder.reach', { x: sx(speedAt(mine[j])!) }) : t('kiki.ladder.reachNone')}</b>
          </li>
        {/each}
      </ul>
    </section>
  {:else if recorded}
    <section class="fb card" data-kiki-feedback={fb?.kind ?? ''}>
      {#if fbLine}
        <!-- しずえ's already speaking in the bubble above: her line here without a second head -->
        <p class="fb-line">{fbLine}</p>
      {/if}
      <div class="trips" data-kiki-trips={trips.length}>
        <h3 class="sec-label in">{t('kiki.trips')}</h3>
        {#if trips.length}
          <ul>{#each trips as x (x.key)}<li data-trip={x.key}>{tripLabel(x.key)}{#if x.n > 1} <b>×{x.n}</b>{/if}</li>{/each}</ul>
        {:else}<p class="none">{t('kiki.tripsNone')}</p>{/if}
      </div>
    </section>
  {/if}

  <section class="sec" aria-labelledby="kk-review">
    <div class="rev-head">
      <h3 id="kk-review" class="sec-label">{t('kiki.review')}</h3>
      <button type="button" class="chip" aria-pressed={missedOnly} data-kiki-missed data-sfx="tick" onclick={() => (missedOnly = !missedOnly)}>{t('kiki.missedOnly')}</button>
    </div>
    {#if misses && !ladders.length}
      <button type="button" class="btn paper retry" data-kiki-retry data-sfx="confirm" onclick={onmissed}>🎯 {t('kiki.missedReplay')}</button>
    {/if}
    {#if ladders.length}
      {@const shown = ladders.map((l, j) => ({ l, j })).filter(({ l, j }) => !missedOnly || mine[j] < l.n)}
      {#if !shown.length}<p class="none">{t('kiki.allRight')}</p>{/if}
      <ul class="review">
        {#each shown as { l, j } (l.ladder)}
          {@const last = items[l.from + l.n - 1]}
          {@const [pre, focus, post] = splitFocus(last)}
          <li class="item card ladder" data-review-ladder={j} data-ok={mine[j] === l.n}>
            <span class="sym" class:ok={mine[j] === l.n} aria-hidden="true">{mine[j] === l.n ? '○' : '×'}</span>
            <div class="txt">
              <p class="en" lang="en">{pre}{#if focus}<mark>{focus}</mark>{/if}{post}</p>
              <p class="ja">{last.ja}</p>
              {#if last.note}<p class="tags">{last.note}</p>{/if}
              <ol class="qs">
                {#each items.slice(l.from, l.from + l.n) as it, k (it.id)}
                  {@const i = l.from + k}
                  <li data-review={i} data-ok={ok(i)}>
                    <span class="x">{sx(SPEEDS[k])}×</span>
                    <span class="sym small" class:ok={ok(i)} aria-label={ok(i) ? t('kiki.right') : t('kiki.wrong')}>{ok(i) ? '○' : '×'}</span>
                    <span class="q">{it.ask ?? t('kiki.ask.word')} → <b lang={it.type === 'word' ? 'en' : undefined}>{it.choices[it.answer]}</b>
                      {#if !ok(i) && v.answers[i]}<span class="picked" data-kiki-picked>{t('kiki.picked', { a: it.choices[v.answers[i]!.k] })}</span>{/if}</span>
                  </li>
                {/each}
              </ol>
              <p class="tags">{t('kiki.ladder.speeds')}</p>
              <div class="speeds">
                {#each items.slice(l.from, l.from + l.n) as it, k (it.id)}
                  <button type="button" class="chip" data-kiki-hear={l.from + k} data-sfx="tick" aria-label="{t('kiki.play')} {sx(SPEEDS[k])}×" onclick={() => game.hear(it)}>▶︎ {sx(SPEEDS[k])}×</button>
                {/each}
              </div>
            </div>
          </li>
        {/each}
      </ul>
    {:else}
    {#if !rows.length}<p class="none">{t('kiki.allRight')}</p>{/if}
    <ul class="review">
      {#each rows as r (r.i)}
        {@const [pre, focus, post] = splitFocus(r.it)}
        {@const open = opened.includes(r.i)}
        {@const dlg = isDialogue(r.it) ? r.it : null}
        <li class="item card" data-review={r.i} data-ok={r.ok} data-open={open}>
          <button type="button" class="head" aria-expanded={open} data-kiki-row={r.i} data-sfx="tick" onclick={() => toggle(r.i)}>
            <span class="sym" class:ok={r.ok} aria-label={r.ok ? t('kiki.right') : t('kiki.wrong')}>{r.ok ? '○' : '×'}</span>
            <span class="sum">
              {#if dlg}<span class="en" lang="en">→ {dlg.choices[dlg.answer]}</span>
              {:else if open}<span class="en big" data-kiki-review-en><SoundLine en={r.it.en} focus={r.it.focus} marks={r.it.marks} clip={r.it.id} from={playing(r.it)} clock={() => game.clock()} /></span>
              {:else}<span class="en" lang="en">{pre}{#if focus}<mark>{focus}</mark>{/if}{post}</span>{/if}
              {#if !open && !r.ok && r.k !== null}<span class="picked">{t('kiki.picked', { a: choiceText(r.it, r.k) })} ×</span>{/if}
            </span>
            {#if first(r.i)}<span class="stamp sm" aria-label={t('kiki.firstTry')}>{t('kiki.firstTry')}</span>{/if}
            <span class="chev" aria-hidden="true">{open ? '▴' : '▾'}</span>
          </button>
          {#if open}
            <div class="txt" data-kiki-detail={r.i}>
              {#if dlg}
                <Transcript it={dlg} talk={game.talk?.i === -1 && game.talk.at === dlg.id ? game.talk.k : -1} from={game.talk?.from ?? null} clock={() => game.clock()} />
                {#if dlg.type === 'gist'}<p class="ans" lang="en">→ {dlg.choices[dlg.answer]}<span>{dlg.ja}</span></p>{/if}
              {:else}
                {#if r.it.marks}<MarkLegend marks={r.it.marks} />{/if}
                <p class="ja">{#each jaLines(r.it) as l, n (n)}<span>{l}</span>{/each}</p>
              {/if}
              {#if r.it.type === 'pic' || r.it.type === 'num'}<p class="ans">→ {choiceText(r.it, r.it.answer)}</p>{/if}
              {#if r.it.note}<p class="note" data-kiki-note>{r.it.note}</p>{/if}
              {#if !r.ok}<p class="tags">{tripKeys(r.it.id).map((x) => tripLabel(x.key)).join(' · ')}</p>{/if}
              {#if !r.ok && r.k !== null}<p class="picked" data-kiki-picked>{t('kiki.picked', { a: choiceText(r.it, r.k) })} <span aria-hidden="true">×</span></p>{/if}
              <div class="hear">
                <button type="button" class="ib" aria-label={t('kiki.play')} data-kiki-hear={r.i} data-sfx="tick" onclick={() => game.hear(r.it)}>▶︎</button>
                {#if r.it.lv <= 2 && !dlg}<button type="button" class="ib" aria-label={t('kiki.playSlow')} data-sfx="tick" onclick={() => game.hear(r.it, true)}>🐢</button>{/if}
              </div>
            </div>
          {/if}
        </li>
      {/each}
    </ul>
    {/if}
  </section>
</div>

<div class="level-acts">
  <button type="button" class="btn paper" data-kiki-done data-sfx="back" onclick={ondone}>{t('kiki.done')}</button>
  <button type="button" class="btn" data-kiki-again data-sfx="confirm" onclick={onagain}>{t('kiki.again')}</button>
</div>

<style>
  .results { display: grid; gap: 14px; }
  .results :global(.bubble) { margin-bottom: 0; }
  .host { display: grid; gap: 6px; }
  .lesson.card { display: grid; justify-items: center; gap: 4px; padding: 12px 14px; text-align: center; }
  .lesson p { margin: 0; }
  .lhead { display: flex; gap: 8px; align-items: center; font: 700 var(--fs-body)/1.3 var(--font-ui); }
  .lhead .dots { display: flex; gap: 2px; font-size: var(--fs-s); color: var(--text-soft); }
  .lhead .dots i { font-style: normal; }
  .got { font: 700 var(--fs-title)/1.2 var(--font-ui); color: var(--coral-text); }
  .soon, .mine { font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }
  /* co-op's team tally: one big number, the together count under it (never who missed) */
  .team.card { display: grid; justify-items: center; gap: 4px; padding: 12px 14px; background: color-mix(in srgb, var(--c-yuzu) 35%, var(--card)); }
  .team b { font: 700 var(--fs-title)/1.2 var(--font-num, var(--font-ui)); }
  .team span { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .tally { margin: 0; text-align: center; font: 700 var(--fs-body)/1.3 var(--font-ui); color: var(--text-soft); }
  .card { border-radius: var(--r-card); background: var(--card); box-shadow: var(--sh-lip); }
  .fb { display: grid; gap: 10px; padding: 12px 14px; }
  .fb-line { margin: 0; font: 700 var(--fs-body)/1.4 var(--font-ui); }
  .trips { display: grid; gap: 6px; }
  .trips .sec-label.in { margin: 0; }
  .trips ul { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px; }
  .trips li {
    padding: 4px 10px; border-radius: var(--r-pill); font: 700 var(--fs-s)/1.3 var(--font-ui);
    background: color-mix(in srgb, var(--c-coral) 16%, var(--card)); box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--c-coral) 55%, transparent);
  }
  .trips .none { text-align: left; }
  .tags { margin: 0; font: 700 11px/1.4 var(--font-ui); color: var(--text-soft); }
  .rank { list-style: none; margin: 0; padding: 8px 14px; display: grid; gap: 4px; }
  .rank li { display: grid; grid-template-columns: 4.2em auto 1fr; align-items: center; gap: 10px; }
  /* the winner's row: a ribbon of yuzu behind it, the cup by the rank */
  .rank li.first { margin: 0 -8px; padding: 2px 8px; border-radius: var(--r-pill); background: color-mix(in srgb, var(--c-yuzu) 40%, transparent); }
  .cup { margin-right: 2px; font-size: .85em; }
  .no { font: 700 var(--fs-body)/1 var(--font-num, var(--font-ui)); color: var(--text-soft); white-space: nowrap; }
  .no.top { color: var(--coral-text); font-size: var(--fs-title); }
  .rank :global(.pc) { grid-auto-flow: column; justify-items: start; align-items: center; max-width: none; gap: 10px; }
  .pts { justify-self: end; font: 700 var(--fs-talk)/1 var(--font-num, var(--font-ui)); }
  .sec { display: grid; gap: 8px; }
  .rev-head { display: flex; align-items: center; justify-content: space-between; }
  .rev-head .chip { min-height: var(--hit); }
  .none { margin: 0; text-align: center; font: 700 var(--fs-body)/1.4 var(--font-ui); color: var(--leaf-text); }
  .review { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  /* ▶︎ / 🐢 under the text (the text's column), so the Japanese has the card's width */
  .item { display: grid; gap: 8px; padding: 0; }
  /* a row's head: the whole width a button (○ / ×, the sentence, いっぱつ, ▾) */
  .head {
    appearance: none; border: 0; background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; width: 100%;
    display: grid; grid-template-columns: auto 1fr auto auto; align-items: start; gap: 10px; padding: 12px 14px; min-height: var(--hit);
  }
  .sum { min-width: 0; display: grid; gap: 2px; }
  .chev { font: 700 var(--fs-s)/1.6 var(--font-ui); color: var(--text-soft); }
  .item .txt { padding: 0 14px 12px 46px; }
  .en.big { font-size: max(17px, var(--fs-talk)); }
  .note { margin: 0; font: 700 var(--fs-xs)/1.45 var(--font-ui); color: var(--c-ink); padding: 4px 8px; border-radius: 10px; background: color-mix(in srgb, var(--c-yuzu) 35%, transparent); }
  .retry { width: 100%; }
  .firsts { margin: 0; text-align: center; }
  /* いっぱつ: a rubber stamp (no points) */
  .stamp {
    display: inline-block; padding: 3px 10px; border-radius: 8px; rotate: -4deg; color: var(--c-coral-text);
    background: color-mix(in srgb, var(--c-yuzu) 45%, var(--card)); box-shadow: inset 0 0 0 2px var(--c-coral); font: 700 var(--fs-s)/1.2 var(--font-ui);
  }
  .stamp.sm { padding: 2px 6px; font-size: var(--fs-xs); white-space: nowrap; }
  .sym { font: 700 22px/1.2 var(--font-ui); color: var(--coral-text); }
  .sym.ok { color: var(--leaf-text); }
  .txt { min-width: 0; display: grid; gap: 4px; }
  .en { margin: 0; font: 700 17px/1.4 var(--font-ui); }
  .en mark { background: linear-gradient(transparent 55%, color-mix(in srgb, var(--c-yuzu) 85%, transparent) 55%); color: inherit; }
  .ja, .ans, .picked { margin: 0; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .ja span, .ans span { display: block; }
  .picked { color: var(--coral-text); }
  .hear { display: flex; gap: 6px; }
  .ib {
    appearance: none; border: 0; cursor: pointer; width: var(--hit); height: var(--hit); border-radius: 50%; display: grid; place-items: center;
    background: var(--ctl); color: var(--text); box-shadow: var(--sh-ctl); font: 700 18px/1 var(--font-ui);
  }
  /* スピード はしご: each ladder's steps, climbed leaf */
  .climbs { display: grid; gap: 8px; padding: 12px 14px; }
  .climbs ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  .climbs > ul > li { display: flex; align-items: center; gap: 12px; }
  .climbs b { font: 700 var(--fs-body)/1.2 var(--font-ui); }
  .steps { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(4, 40px); align-items: end; gap: 3px; height: 36px; }
  .steps li {
    height: var(--h); border-radius: 6px 6px 3px 3px; display: grid; align-items: end; justify-items: center; padding-bottom: 2px;
    background: var(--ctl-off); color: var(--text-soft); font: 700 10px/1 var(--font-num, var(--font-ui));
  }
  .steps li.up { background: var(--c-leaf); color: var(--c-ink); }
  .qs { list-style: none; margin: 4px 0 0; padding: 0; display: grid; gap: 4px; }
  .qs li { display: grid; grid-template-columns: 2.6em 1.2em 1fr; gap: 4px; align-items: baseline; font: 700 var(--fs-s)/1.4 var(--font-ui); }
  .qs .x { font-family: var(--font-num, var(--font-ui)); color: var(--text-soft); }
  .sym.small { font-size: var(--fs-body); }
  .qs .picked { display: block; }
  .speeds { display: flex; flex-wrap: wrap; gap: 6px; }
  .speeds .chip { min-height: var(--hit); }
  .ib:active { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
</style>
