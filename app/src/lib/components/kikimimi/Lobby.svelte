<script lang="ts">
  // みんなで, the lobby (docs/kikimimi-ux.md §6.5; docs/kikimimi.md "UI"): the game to play together (ひとこと クイズ,
  // スピード はしご, アナウンス, a lane's game: catalog.ts sharable; the host picks, the others see it) with its ばしょ (the
  // quiz's levels, a lane's game's content places) or the ladder's speeds and こたえる じかん,
  // who's in (joined, or on the island and not yet), 「きょうりょく ／ しょうぶ」 (co-op by default: one team score, never
  // who missed; しょうぶ ranks by points) and 「おとを 1だいに まとめる」 (only the host's phone speaks). The foot: さそう
  // while my lobby is still on this phone alone, then the host's 「はじめる（Nにん）」; the others wait for it.
  import type { Who } from '#lib/types.ts';
  import type { Level } from '#lib/kikimimi/bank.ts';
  import type { QuizTimer } from '#lib/kikimimi/seed.ts';
  import { ORDER } from '#lib/kikimimi/round/session.ts';
  import { LADDER_OK, LEVELS } from '#lib/kikimimi/deck.ts';
  import { SPEEDS } from '#lib/kikimimi/ladder.ts';
  import { lvForMode, modeOf, modeOfGame, sharable, type ModeId } from '#lib/kikimimi/catalog.ts';
  import { LANES, laneLevels, levelFor } from '#lib/kikimimi/round/registry.ts';
  import type { QuizGame } from './game.svelte.ts';
  import PlayerChip from './frame/PlayerChip.svelte';
  import LadderSteps from './LadderSteps.svelte';
  import StageRow from './mode/StageRow.svelte';
  import TimerRow from './mode/TimerRow.svelte';
  import Segmented from '../ui/Segmented.svelte';
  import { sound } from '#lib/sound/sound.svelte.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { villagerNameOf } from '#lib/ui-state/viewer.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { t } from '#lib/i18n/index.ts';

  let { game, onlevel, ontimer }: { game: QuizGame; onlevel: (lv: Level) => void; ontimer: (t: QuizTimer) => void } = $props();
  const v = $derived(game.view);
  /** Everyone in the lobby or on the island: joined first (A B G), then those here who haven't. */
  const people = $derived(ORDER.filter((w) => w === game.me || v.players.some((p) => p.who === w) || game.here.includes(w)));
  const joined = (w: Who) => v.players.some((p) => p.who === w);
  const hostName = $derived(week.view && v.host ? villagerNameOf(week.view, v.host) : '');
  const zero = $derived(sound.settings.volume <= 0);
  /** The games that can be shared (the quiz family's, the lanes' this build can play). */
  const games = sharable({ levels: LEVELS, ladder: LADDER_OK, review: false, games: (gm) => LANES.ready(gm) });
  const now = $derived<ModeId>(modeOfGame(v.gm ?? '')?.id ?? (v.ladder ? 'ladder' : v.lv === 5 ? 'announce' : 'quiz'));
  /** A lane's game's places (its content's), when its mode offers them. */
  const places = $derived(modeOf(now).game && modeOf(now).places ? laneLevels(v.gm ?? '') : null);

  function pickGame(id: ModeId) {
    if (!v.amHost || id === now) return;
    const gm = modeOf(id).game;
    if (gm) game.setGame(gm, { lv: levelFor(gm, v.lv === 5 ? 1 : v.lv), timer: v.timer });
    else if (id === 'ladder') game.configure({ ladder: true });
    else game.configure({ ladder: false, lv: lvForMode(id, v.lv === 5 ? 1 : v.lv) as Level });
  }
  function level(lv: number) {
    game.configure({ lv: lv as Level });
    onlevel(lv as Level);
  }
  function timer(x: QuizTimer) {
    game.configure({ timer: x });
    ontimer(x);
  }
  function same() {
    cue(v.same ? 'toggle-off' : 'toggle-on');
    game.configure({ same: !v.same });
  }
  /** しょうぶ (ranking) or きょうりょく (the default: the team's tally). */
  const VS = [{ id: 'coop', label: t('kiki.vs.coop') }, { id: 'vs', label: t('kiki.vs.vs') }] as const;
  function versus(vs: boolean) {
    if (vs !== v.vs) game.configure({ vs });
  }
</script>

<div class="lobby" data-kiki-lobby data-kiki-page="lobby">
  <section class="sec" aria-labelledby="kk-game">
    <h3 id="kk-game" class="sec-label">{t('kiki.lobby.game')}</h3>
    <div class="games" role="radiogroup" aria-labelledby="kk-game" data-kiki-modes>
      {#each games as g (g.id)}
        <button type="button" class="chip big" role="radio" aria-checked={now === g.id} aria-disabled={!v.amHost && now !== g.id} data-kiki-mode={g.id}
          data-sfx={now === g.id ? 'none' : 'tick'} onclick={() => pickGame(g.id)}>{t(`kiki.mode.${g.id}`)}</button>
      {/each}
    </div>
  </section>

  {#if now === 'ladder'}
    <section class="sec ladder card" data-kiki-ladder-about>
      <p class="about">{t('kiki.ladderAbout')}</p>
      <LadderSteps size="big" step={(k) => (k === SPEEDS.length - 1 ? 'up' : 'soft')} />
      <p class="hint">{t('kiki.ladderRule')}</p>
    </section>
  {:else if now === 'quiz'}
    <StageRow lv={v.lv} levels={LEVELS.filter((x) => x !== 5)} readonly={!v.amHost} onpick={level} />
  {:else if places?.length}
    <StageRow lv={v.lv} levels={places} readonly={!v.amHost} onpick={level} />
  {/if}
  <TimerRow timer={v.timer} readonly={!v.amHost} onpick={timer} />

  <section class="sec" aria-labelledby="kk-who" data-kiki-players>
    <h3 id="kk-who" class="sec-label">{t('kiki.players')}</h3>
    <div class="who card">
      {#each people as w (w)}
        <PlayerChip who={w} state={joined(w) ? 'here' : 'away'} note={joined(w) ? null : t('kiki.notYet')} size={48} />
      {/each}
    </div>
    {#if people.length === 1}<p class="hint">{t('kiki.soloOk')}</p>{/if}
  </section>

  {#if v.amHost}
    <!-- きょうりょく ／ しょうぶ: co-op by default; しょうぶ ranks by points -->
    <section class="sec" data-kiki-vs={v.vs ? 'vs' : 'coop'}>
      <Segmented label={t('kiki.vs')} attr="kiki-vs-pick" value={v.vs ? 'vs' : 'coop'} items={VS} onpick={(id) => versus(id === 'vs')} />
      <p class="hint">{t(v.vs ? 'kiki.vsOn' : 'kiki.vsOff')}</p>
    </section>
    <button type="button" class="row tile-btn" role="switch" aria-checked={v.same} data-kiki-same data-sfx="self" onclick={same}>
      <span class="rl">{t('kiki.same')}<small>{t('kiki.sameOn')}</small></span>
      <span class="sw" aria-hidden="true"><i></i></span>
    </button>
  {:else}
    <p class="row static" data-kiki-vs-flag={v.vs}><span class="rl">{t(v.vs ? 'kiki.vs.vs' : 'kiki.vs.coop')}<small>{t(v.vs ? 'kiki.vsOn' : 'kiki.vsOff')}</small></span></p>
    <p class="row static"><span class="rl">{t('kiki.same')}<small>{t('kiki.sameOn')}</small></span>
      <span class="flag">{v.same ? '✓' : '—'}</span></p>
  {/if}
  {#if zero}<p class="hint warn" data-kiki-zero>🔊 {t('kiki.testZero')}</p>{/if}
</div>

<div class="level-acts">
  {#if v.amHost && v.local}
    <button type="button" class="btn" data-kiki-invite-all data-sfx="open" onclick={() => game.invite()}>{t('kiki.inviteAll')}</button>
  {:else if v.amHost}
    <button type="button" class="btn" data-kiki-start data-sfx="confirm" onclick={() => game.go()}>{t('kiki.startN', { n: v.players.length })}</button>
  {:else}
    <p class="wait" role="status">{t('kiki.waitHost', { name: hostName })}</p>
  {/if}
</div>

<style>
  .lobby { display: grid; gap: 14px; }
  .sec { display: grid; gap: 8px; }
  .games { display: flex; flex-wrap: wrap; gap: 8px; }
  .games .chip[aria-disabled='true'] { background: var(--ctl-off); color: var(--text-soft); box-shadow: none; cursor: default; }
  .ladder.card { padding: 12px 14px; gap: 10px; }
  .about { margin: 0; font: 700 var(--fs-body)/1.4 var(--font-ui); }
  .ladder .hint { margin: 0; }
  .row { display: flex; align-items: center; gap: 12px; min-height: 60px; padding: 8px 16px; margin: 0; border-radius: var(--r-card); text-align: left; width: 100%; }
  .row.static { background: var(--card); box-shadow: var(--sh-lip); }
  .rl { flex: 1; min-width: 0; font: 700 var(--fs-body)/1.3 var(--font-ui); }
  .rl small { display: block; margin-top: 2px; font-size: var(--fs-s); color: var(--text-soft); }
  .flag { font: 700 var(--fs-body)/1 var(--font-ui); color: var(--text-soft); }
  .sw {
    position: relative; flex: none; width: 56px; height: 32px; border-radius: var(--r-pill);
    background: var(--ctl-off); box-shadow: inset 0 0 0 2px var(--edge); transition: background var(--dur-quick);
  }
  .sw i {
    position: absolute; top: 4px; left: 4px; width: 24px; height: 24px; border-radius: 50%;
    background: var(--c-card); box-shadow: inset 0 0 0 2px var(--c-edge), 0 2px 0 var(--c-edge); transition: translate var(--dur-base) var(--ease-bounce);
  }
  .row[aria-checked='true'] .sw { background: var(--c-leaf); box-shadow: inset 0 0 0 2px var(--c-leaf-edge); }
  .row[aria-checked='true'] .sw i { translate: 24px 0; }
  .who { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px 18px; padding: 14px 10px 12px; }
  .hint { margin: 0 4px; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .hint.warn { color: var(--coral-text); }
  .wait { flex: 1; margin: 0; padding: 14px 0; text-align: center; font: 700 var(--fs-body)/1.4 var(--font-ui); color: var(--text-soft); }
  @media (prefers-reduced-motion: reduce) { .sw i { transition: none; } }
</style>
