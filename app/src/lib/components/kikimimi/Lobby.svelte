<script lang="ts">
  // ききみみ クイズ's lobby (docs/kikimimi.md "UI"): しずえ's welcome, the level (the host picks; the others see it),
  // 🔊 「きこえる？」 (with 音量 0's hint). My lobby starts on this phone alone: 「ひとりで はじめる」, or 「みんなを さそう」
  // (the invite goes out); once shared, who's here and who joined, 「おなじ へやで あそぶ」 (only the host's phone speaks),
  // 「たいせん」 (a ranking; off: co-op, the team's tally) and the host's 「はじめる（Nにん）」 (the others wait for it).
  import type { Who } from '#lib/types.ts';
  import { ORDER } from '#lib/kikimimi/session.ts';
  import type { Level } from '#lib/kikimimi/bank.ts';
  import { LEVELS } from '#lib/kikimimi/deck.ts';
  import type { QuizGame } from './game.svelte.ts';
  import Host from '../characters/Host.svelte';
  import PlayerChip from './PlayerChip.svelte';
  import { sound } from '#lib/sound/sound.svelte.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { villagerNameOf } from '#lib/ui-state/viewer.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { t } from '#lib/i18n/index.ts';

  let { game, onlevel, onpractice }: { game: QuizGame; onlevel: (lv: Level) => void; onpractice: () => void } = $props();
  const v = $derived(game.view);
  /** Everyone in the lobby or on the island: joined first (A B G), then those here who haven't. */
  const people = $derived(ORDER.filter((w) => w === game.me || v.players.some((p) => p.who === w) || game.here.includes(w)));
  const joined = (w: Who) => v.players.some((p) => p.who === w);
  const hostName = $derived(week.view && v.host ? villagerNameOf(week.view, v.host) : '');
  /** The sound check: not tried, tried (the hint shows), or failed to play. */
  let tested = $state(false);
  const zero = $derived(sound.settings.volume <= 0);

  function level(lv: Level) {
    if (lv === v.lv) return;
    game.configure({ lv });
    onlevel(lv);
  }
  function same() {
    cue(v.same ? 'toggle-off' : 'toggle-on');
    game.configure({ same: !v.same });
  }
  /** たいせん (ranking) or co-op (the default: the team's tally). */
  function versus() {
    cue(v.vs ? 'toggle-off' : 'toggle-on');
    game.configure({ vs: !v.vs });
  }
  async function test() {
    tested = true;
    await game.test();
  }
</script>

<div class="lobby" data-kiki-lobby>
  <div class="hello">
    <span class="host" aria-hidden="true"><Host head size={52} animate={false} eager /></span>
    <p>{t('kiki.sub')}</p>
  </div>

  <section class="sec" aria-labelledby="kk-lv">
    <h3 id="kk-lv" class="sec-label">{t('kiki.level')}</h3>
    <div class="levels" role="radiogroup" aria-labelledby="kk-lv">
      {#each LEVELS as lv (lv)}
        <button type="button" class="lv" role="radio" aria-checked={v.lv === lv} aria-disabled={!v.amHost && v.lv !== lv} data-level={lv}
          data-sfx={v.lv === lv ? 'none' : 'tick'} onclick={() => v.amHost && level(lv)}>
          <span class="stars" aria-hidden="true">{'★'.repeat(lv)}</span>
          <span>{t(`kiki.lv.${lv}`)}</span>
        </button>
      {/each}
    </div>
  </section>

  {#if !v.local}
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
      <button type="button" class="row" role="switch" aria-checked={v.same} data-kiki-same data-sfx="self" onclick={same}>
        <span class="rl">{t('kiki.same')}{#if v.same}<small>{t('kiki.sameOn')}</small>{/if}</span>
        <span class="sw" aria-hidden="true"><i></i></span>
      </button>
      <button type="button" class="row" role="switch" aria-checked={v.vs} data-kiki-vs data-sfx="self" onclick={versus}>
        <span class="rl">{t('kiki.vs')}<small>{t(v.vs ? 'kiki.vsOn' : 'kiki.vsOff')}</small></span>
        <span class="sw" aria-hidden="true"><i></i></span>
      </button>
    {:else}
      <p class="row static"><span class="rl">{t('kiki.same')}{#if v.same}<small>{t('kiki.sameOn')}</small>{/if}</span>
        <span class="flag">{v.same ? '✓' : '—'}</span></p>
      <p class="row static" data-kiki-vs-flag={v.vs}><span class="rl">{t('kiki.vs')}<small>{t(v.vs ? 'kiki.vsOn' : 'kiki.vsOff')}</small></span>
        <span class="flag">{v.vs ? '✓' : '—'}</span></p>
    {/if}
  {/if}

  <div class="test">
    <button type="button" class="btn paper" data-kiki-test data-sfx="tick" onclick={test}>🔊 {t('kiki.test')}</button>
    {#if zero}<p class="hint warn" data-kiki-zero>{t('kiki.testZero')}</p>
    {:else if tested}<p class="hint">{t('kiki.testHint')}</p>{/if}
  </div>
</div>

<div class="level-acts">
  {#if v.amHost && v.local}
    <button type="button" class="btn" data-kiki-start data-sfx="confirm" onclick={() => game.go()}>{t('kiki.startSolo')}</button>
    <button type="button" class="btn paper wide" data-kiki-practice data-sfx="confirm" onclick={onpractice}>🎯 {t('kiki.practice')}</button>
    <button type="button" class="btn paper wide" data-kiki-invite-all data-sfx="open" onclick={() => game.invite()}>{t('kiki.inviteAll')}</button>
  {:else if v.amHost}
    <button type="button" class="btn" data-kiki-start data-sfx="confirm" onclick={() => game.go()}>{t('kiki.startN', { n: v.players.length })}</button>
  {:else}
    <p class="wait" role="status">{t('kiki.waitHost', { name: hostName })}</p>
  {/if}
</div>

<style>
  .lobby { display: grid; gap: 14px; }
  .hello { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: var(--r-card); background: var(--card); box-shadow: var(--sh-lip); }
  .hello p { margin: 0; font: 700 var(--fs-body)/1.4 var(--font-ui); }
  .host { flex: none; line-height: 0; }
  .sec { display: grid; gap: 8px; }
  /* the four levels a 2×2 grid (three and one left a hole) */
  .levels { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .lv {
    appearance: none; border: 0; cursor: pointer; min-height: 64px; border-radius: var(--r-card); display: grid; place-content: center; gap: 2px;
    background: var(--ctl); color: var(--text); box-shadow: var(--sh-ctl); font: 700 var(--fs-body)/1.2 var(--font-ui);
  }
  .lv[aria-checked='true'] { background: var(--ctl-sel); color: var(--c-ink); }
  .lv[aria-disabled='true'] { background: var(--ctl-off); color: var(--text-soft); box-shadow: none; cursor: default; }
  .lv:active:not([aria-disabled='true']) { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
  .stars { color: var(--c-coral); letter-spacing: 1px; font-size: var(--fs-s); }
  /* the chosen one's stars stay coral (the darker text coral on yuzu) */
  .lv[aria-checked='true'] .stars { color: var(--c-coral-text); }
  .row {
    appearance: none; cursor: pointer; display: flex; align-items: center; gap: 12px; min-height: 60px; padding: 8px 16px; margin: 0;
    border-radius: var(--r-card); border: 0; background: var(--ctl); color: var(--text); box-shadow: var(--sh-ctl); text-align: left; width: 100%; font: inherit;
  }
  .row.static { background: var(--card); box-shadow: var(--sh-lip); cursor: default; }
  .row:not(.static):active { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
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
  .card { border-radius: var(--r-card); background: var(--card); box-shadow: var(--sh-lip); }
  .who { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px 18px; padding: 14px 10px 12px; }
  .test { display: grid; gap: 6px; }
  .test .btn { width: 100%; }
  .level-acts > .wide { flex: 1 1 100%; }
  .hint { margin: 0 4px; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .hint.warn { color: var(--coral-text); }
  .wait { flex: 1; margin: 0; padding: 14px 0; text-align: center; font: 700 var(--fs-body)/1.4 var(--font-ui); color: var(--text-soft); }
  @media (prefers-reduced-motion: reduce) { .sw i { transition: none; } }
</style>
