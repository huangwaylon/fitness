<script lang="ts">
  // ききみみ クイズ's results (docs/kikimimi.md "Results"): しずえ reads them out like the morning broadcast (the ranking,
  // the winner's row with 🏆, and how many I got right under her line; co-op, the default with several players: the
  // team's 「ふたりで 7/8」 and 「そろって せいかい」 instead, no ranking, no one's points), then the review list, the game's main learning
  // moment: every sentence's English (its key words marked) and Japanese (a reply's on two lines), ▶︎ and 🐢 (levels
  // 1-2), ○ / × for my answer and on a miss what I picked, and 「まちがえた だけ」 to show only the missed.
  import type { QuizGame } from './game.svelte.ts';
  import { PIC_JA, isDialogue, jaLines, splitFocus, type Item } from '#lib/kikimimi/bank.ts';
  import Transcript from './Transcript.svelte';
  import Bubble from '../ui/Bubble.svelte';
  import PlayerChip from './PlayerChip.svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import { villagerNameOf } from '#lib/ui-state/viewer.ts';
  import { t } from '#lib/i18n/index.ts';
  import Host from '../characters/Host.svelte';
  import { currentReport, recWords } from './progress.svelte.ts';
  import { feedbackFor } from '#lib/kikimimi/report.ts';
  import { tripKeys, tripsOf } from '#lib/kikimimi/advice.ts';

  let { game, onagain, ondone }: { game: QuizGame; onagain: () => void; ondone: () => void } = $props();
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
  const line = $derived.by(() => {
    if (ranking.length <= 1) return t('kiki.hostSolo', { score: ranking[0]?.score ?? 0 });
    if (coop) return t(v.team.right >= v.n ? 'kiki.hostTeam.all' : v.team.right * 4 >= v.n * 3 ? 'kiki.hostTeam.good' : 'kiki.hostTeam.try');
    const top = ranking.filter((r) => r.rank === 1);
    return top.length > 1 || !week.view ? t('kiki.hostTie') : t('kiki.hostTop', { name: villagerNameOf(week.view, top[0].who) });
  });
  const ok = (i: number) => !!v.answers[i] && v.answers[i]!.k === items[i]?.answer;
  let missedOnly = $state(false);
  const rows = $derived(items.map((it, i) => ({ it, i, ok: ok(i), k: v.answers[i]?.k ?? null })).filter((r) => !missedOnly || !r.ok));
  const tally = $derived(items.filter((_, i) => ok(i)).length);
  /** A choice as written (a picture's Japanese name: the English isn't given away). */
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
  </div>

  {#if recorded}
    <section class="fb card" data-kiki-feedback={fb?.kind ?? ''}>
      {#if fbLine}
        <div class="fb-line"><span class="fb-host" aria-hidden="true"><Host head size={44} animate={false} eager /></span><p>{fbLine}</p></div>
      {/if}
      <div class="trips" data-kiki-trips={trips.length}>
        <h3 class="sec-label in">{t('kiki.trips')}</h3>
        {#if trips.length}
          <ul>{#each trips as x (x.key)}<li data-trip={x.key}>{tripLabel(x.key)}{#if x.n > 1} <b>×{x.n}</b>{/if}</li>{/each}</ul>
        {:else}<p class="none">{t('kiki.tripsNone')}</p>{/if}
      </div>
    </section>
  {/if}

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

  <section class="sec" aria-labelledby="kk-review">
    <div class="rev-head">
      <h3 id="kk-review" class="sec-label">{t('kiki.review')}</h3>
      <button type="button" class="chip" aria-pressed={missedOnly} data-kiki-missed data-sfx="tick" onclick={() => (missedOnly = !missedOnly)}>{t('kiki.missedOnly')}</button>
    </div>
    {#if !rows.length}<p class="none">{t('kiki.allRight')}</p>{/if}
    <ul class="review">
      {#each rows as r (r.i)}
        {@const [pre, focus, post] = splitFocus(r.it)}
        <li class="item card" data-review={r.i} data-ok={r.ok}>
          <span class="sym" class:ok={r.ok} aria-label={r.ok ? t('kiki.right') : t('kiki.wrong')}>{r.ok ? '○' : '×'}</span>
          <div class="txt">
            {#if isDialogue(r.it)}
              <Transcript it={r.it} compact talk={game.talk?.i === -1 && game.talk.at === r.it.id ? game.talk.k : -1} from={game.talk?.from ?? null} clock={() => game.clock()} />
              {#if r.it.type === 'gist'}<p class="ans" lang="en">→ {r.it.choices[r.it.answer]}<span>{r.it.ja}</span></p>{/if}
            {:else}
              <p class="en" lang="en">{pre}{#if focus}<mark>{focus}</mark>{/if}{post}</p>
              <p class="ja">{#each jaLines(r.it) as l, n (n)}<span>{l}</span>{/each}</p>
            {/if}
            {#if r.it.type === 'pic' || r.it.type === 'num'}<p class="ans">→ {choiceText(r.it, r.it.answer)}</p>{/if}
            {#if !r.ok}<p class="tags">{tripKeys(r.it.id).map((x) => tripLabel(x.key)).join(' · ')}</p>{/if}
            {#if !r.ok && r.k !== null}<p class="picked" data-kiki-picked>{t('kiki.picked', { a: choiceText(r.it, r.k) })} <span aria-hidden="true">×</span></p>{/if}
          </div>
          <div class="hear">
            <button type="button" class="ib" aria-label={t('kiki.play')} data-kiki-hear={r.i} data-sfx="tick" onclick={() => game.hear(r.it)}>▶︎</button>
            {#if r.it.lv <= 2}<button type="button" class="ib" aria-label={t('kiki.playSlow')} data-sfx="tick" onclick={() => game.hear(r.it, true)}>🐢</button>{/if}
          </div>
        </li>
      {/each}
    </ul>
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
  /* co-op's team tally: one big number, the together count under it (never who missed) */
  .team.card { display: grid; justify-items: center; gap: 4px; padding: 12px 14px; background: color-mix(in srgb, var(--c-yuzu) 35%, var(--card)); }
  .team b { font: 700 var(--fs-title)/1.2 var(--font-num, var(--font-ui)); }
  .team span { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .tally { margin: 0; text-align: center; font: 700 var(--fs-body)/1.3 var(--font-ui); color: var(--text-soft); }
  .card { border-radius: var(--r-card); background: var(--card); box-shadow: var(--sh-lip); }
  .fb { display: grid; gap: 10px; padding: 12px 14px; }
  .fb-line { display: flex; align-items: center; gap: 10px; }
  .fb-line p { margin: 0; font: 700 var(--fs-body)/1.4 var(--font-ui); }
  .fb-host { flex: none; line-height: 0; }
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
  .no.top { color: var(--c-coral); font-size: var(--fs-title); }
  .rank :global(.pc) { grid-auto-flow: column; justify-items: start; align-items: center; max-width: none; gap: 10px; }
  .pts { justify-self: end; font: 700 var(--fs-talk)/1 var(--font-num, var(--font-ui)); }
  .sec { display: grid; gap: 8px; }
  .rev-head { display: flex; align-items: center; justify-content: space-between; }
  .none { margin: 0; text-align: center; font: 700 var(--fs-body)/1.4 var(--font-ui); color: var(--leaf-text); }
  .review { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  .item { display: grid; grid-template-columns: auto 1fr auto; align-items: start; gap: 10px; padding: 12px 10px 12px 14px; }
  .sym { font: 700 22px/1.2 var(--font-ui); color: var(--c-coral); }
  .sym.ok { color: var(--leaf-text); }
  .txt { min-width: 0; display: grid; gap: 4px; }
  .en { margin: 0; font: 700 17px/1.4 var(--font-ui); }
  .en mark { background: linear-gradient(transparent 55%, color-mix(in srgb, var(--c-yuzu) 85%, transparent) 55%); color: inherit; }
  .ja, .ans, .picked { margin: 0; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .ja span, .ans span { display: block; }
  .picked { color: var(--c-coral); }
  .hear { display: flex; gap: 6px; }
  .ib {
    appearance: none; border: 0; cursor: pointer; width: var(--hit); height: var(--hit); border-radius: 50%; display: grid; place-items: center;
    background: var(--ctl); color: var(--text); box-shadow: var(--sh-ctl); font: 700 18px/1 var(--font-ui);
  }
  .ib:active { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
</style>
