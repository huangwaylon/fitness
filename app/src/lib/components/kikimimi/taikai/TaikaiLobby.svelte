<script lang="ts">
  // しずえの しゅうまつ たいかい's lobby (docs/kikimimi.md "Mode detail", "The daily menu"; curriculum.md "Modes"), its own chunk: しずえ's welcome,
  // the show's three rules (7 rounds of everyone's misses mixed, the wager's round-only chips, her target and the
  // trophies), who's in with how many misses each offered (never which: the items stay a surprise), きょうりょく ／ しょうぶ
  // (co-op by default) and the foot: alone, 「ひとりで はじめる」 or 「みんなを さそう」 (the primary when someone's on the
  // island), then the host's 「はじめる（Nにん）」; the others wait. A player's phone offers its misses as it joins and the
  // host's picks the deck again as they come (game.svelte.ts #taikaiOf).
  import type { Who } from '#lib/types.ts';
  import { ORDER } from '#lib/kikimimi/round/session.ts';
  import { offersOf } from '#lib/kikimimi/games/taikai/pick.ts';
  import type { QuizGame } from '../game.svelte.ts';
  import PlayerChip from '../frame/PlayerChip.svelte';
  import Bubble from '../../ui/Bubble.svelte';
  import Segmented from '../../ui/Segmented.svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import { villagerNameOf } from '#lib/ui-state/viewer.ts';
  import { t } from '#lib/i18n/index.ts';

  let { game }: { game: QuizGame } = $props();
  const v = $derived(game.view);
  const joined = (w: Who) => v.players.some((p) => p.who === w);
  /** Everyone in the lobby or on the island: joined first (A B G), then those here who haven't. */
  const people = $derived(ORDER.filter((w) => w === game.me || joined(w) || game.here.includes(w)));
  const others = $derived(game.here.filter((w) => w !== game.me));
  /** Each player's offered misses: the host's in the options (its third), the others' as their offers heard; mine as my
   *  phone has them. */
  const offers = $derived(offersOf(v.evs));
  const mine = $derived(game.taikaiOffer().length);
  const count = (w: Who): number | null => (w === game.me ? mine : !joined(w) ? null : w === v.host ? (v.o[2] ?? 0) : (offers[w]?.length ?? 0));
  const misses = $derived(people.reduce((n, w) => n + (count(w) ?? 0), 0));
  const hostName = $derived(week.view && v.host ? villagerNameOf(week.view, v.host) : '');
  const VS = [{ id: 'coop', label: t('kiki.vs.coop') }, { id: 'vs', label: t('kiki.vs.vs') }] as const;
</script>

<div class="taikai" data-kiki-page="taikai" data-kiki-taikai-lobby data-kiki-ids={v.ids.length}>
  <Bubble text={t('kiki.taikai.hello')} host="wave" size={64} />
  <ol class="rules card">
    <li><span class="ic" aria-hidden="true">🎧</span>{t('kiki.taikai.rule1')}</li>
    <li><span class="ic" aria-hidden="true">🪙</span>{t('kiki.taikai.rule2')}</li>
    <li><span class="ic" aria-hidden="true">🏆</span>{t('kiki.taikai.rule3')}</li>
  </ol>

  <section class="sec" aria-labelledby="kt-who" data-kiki-players>
    <h3 id="kt-who" class="sec-label">{t('kiki.players')}</h3>
    <div class="who card">
      {#each people as w (w)}
        {@const n = count(w)}
        <div class="one" data-kiki-offer={w} data-kiki-offer-n={n ?? undefined}>
          <PlayerChip who={w} state={joined(w) ? 'here' : 'away'} note={n === null ? t('kiki.notYet') : n ? t('kiki.taikai.offers', { n }) : t('kiki.taikai.offersNone')} size={48} />
        </div>
      {/each}
    </div>
    <p class="hint">{misses < 7 ? t('kiki.taikai.fill') : t('kiki.taikai.mixed')}</p>
  </section>

  {#if v.amHost}
    <section class="sec" data-kiki-vs={v.vs ? 'vs' : 'coop'}>
      <Segmented label={t('kiki.vs')} attr="kiki-vs-pick" value={v.vs ? 'vs' : 'coop'} items={VS} onpick={(id) => id === 'vs' !== v.vs && game.configure({ vs: id === 'vs' })} />
      <p class="hint">{t(v.vs ? 'kiki.taikai.vsOn' : 'kiki.taikai.vsOff')}</p>
    </section>
  {:else}
    <p class="prow static" data-kiki-vs-flag={v.vs}><span class="prl">{t(v.vs ? 'kiki.vs.vs' : 'kiki.vs.coop')}<small>{t(v.vs ? 'kiki.taikai.vsOn' : 'kiki.taikai.vsOff')}</small></span></p>
  {/if}
</div>

<div class="level-acts">
  {#if v.amHost && v.local}
    <button type="button" class="btn" class:paper={!!others.length} data-kiki-taikai-solo data-sfx="confirm" onclick={() => game.go()}>{t('kiki.taikai.solo')}</button>
    <button type="button" class="btn" class:paper={!others.length} data-kiki-invite-all data-sfx="open" onclick={() => game.invite()}>{t('kiki.inviteAll')}</button>
  {:else if v.amHost}
    <button type="button" class="btn" data-kiki-start data-sfx="confirm" onclick={() => game.go()}>{t('kiki.startN', { n: v.players.length })}</button>
  {:else}
    <p class="wait" role="status">{t('kiki.waitHost', { name: hostName })}</p>
  {/if}
</div>

<style>
  .taikai { display: grid; gap: 14px; }
  .taikai :global(.bubble) { margin-bottom: 0; }
  .rules { list-style: none; margin: 0; padding: 12px 14px; display: grid; gap: 8px; box-shadow: var(--sh-lip), inset 0 0 0 2px var(--c-yuzu); }
  .rules li { display: grid; grid-template-columns: 28px 1fr; align-items: start; gap: 8px; font: 700 var(--fs-s)/1.45 var(--font-ui); }
  .ic { font-size: 18px; line-height: 1.3; text-align: center; }
  .sec { display: grid; gap: 8px; }
  .who { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px 18px; padding: 14px 10px 12px; }
  .hint { margin: 0 4px; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .wait { flex: 1; margin: 0; padding: 14px 0; text-align: center; font: 700 var(--fs-body)/1.4 var(--font-ui); color: var(--text-soft); }
</style>
