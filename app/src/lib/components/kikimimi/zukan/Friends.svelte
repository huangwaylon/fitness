<script lang="ts">
  // ずかん › なかま (docs/kikimimi-ux.md §6.10, §7.7): the villagers I've heard, the closest first, each with NH's hearts
  // (its level, never the points: friendship.ts) and the next reward; a level reached since ずかん last showed it is
  // announced once with a heart. A tap opens the rewards it has opened: their greeting (L1), their letter (L2), the
  // でんわ ともだち badge (L3), the silver frame on the card (L4), their photo in a gold frame (L5); English first, its
  // Japanese a tap away. The ones not met yet are silhouettes. Friendship grows with every line of theirs I understand
  // and never drops. Its own chunk.
  import { untrack } from 'svelte';
  import { FRIEND_MAX, friendOrder, friendsOf, greetingOf, letterOf, levelUps, nextReward, rewardsAt } from '#lib/kikimimi/friendship.ts';
  import { CAST } from '#lib/kikimimi/cast.ts';
  import { ROSTER, type RosterId } from '#lib/villagers/roster.ts';
  import type { Who } from '#lib/types.ts';
  import { villagerArt } from '#lib/art.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { villagerNameOf } from '#lib/ui-state/viewer.ts';
  import OfficialArt from '../../characters/OfficialArt.svelte';
  import { rosterName } from '../scene/stage.ts';
  import { currentAnswers } from '../progress.svelte.ts';
  import { keepSeen, seenOf, type ZukanData } from './data.svelte.ts';
  import { t } from '#lib/i18n/index.ts';

  let { data, me }: { data: ZukanData; me: Who } = $props();
  const answers = $derived(currentAnswers());
  const friends = $derived((void data.ready, friendsOf(answers, (id) => data.info(id)?.who)));
  const order = $derived(friendOrder(friends));
  /** The villagers with a voice not heard yet (the silhouettes). */
  const unmet = $derived((Object.keys(CAST) as RosterId[]).filter((w) => !friends.has(w)));
  const myName = $derived(week.view ? villagerNameOf(week.view, me) : '');
  /** The levels announced before this visit; the level-ups since, each once (then kept as shown). */
  const shown = untrack(() => seenOf(me).fr);
  const ups = $derived(levelUps(friends, shown));
  $effect(() => {
    const fr = Object.fromEntries([...friends].map(([w, f]) => [w, f.level]));
    if (Object.entries(fr).some(([w, n]) => n > (seenOf(me).fr[w] ?? 0))) untrack(() => keepSeen(me, { fr: { ...seenOf(me).fr, ...fr } }));
  });
  let open = $state<RosterId | null>(null);
  let ja = $state(false);
  const hearts = (n: number) => '♥'.repeat(n) + '♡'.repeat(FRIEND_MAX - n);
</script>

<div class="friends" data-kiki-friends={friends.size}>
  <div class="top card">
    <span class="big" aria-hidden="true">💛</span>
    <span class="ttxt"><b>{t('kiki.zukan.friendsN', { n: friends.size })}</b><small>{t('kiki.zukan.friendHow')}</small></span>
  </div>

  {#each ups as u (u.who)}
    <div class="up card" data-kiki-levelup={u.who} data-to={u.to} role="status">
      <span class="pop" aria-hidden="true">♥</span>
      <span class="head"><OfficialArt key={villagerArt(u.who, true)} alt="" size={40} /></span>
      <b>{t('kiki.zukan.levelUp', { name: rosterName(u.who), n: u.to })}</b>
    </div>
  {/each}

  {#if !order.length}<p class="none">{t('kiki.zukan.friendNone')}</p>{/if}
  <ul class="list">
    {#each order as w (w)}
      {@const f = friends.get(w)!}
      {@const next = nextReward(f.level)}
      <li>
        <button type="button" class="row card" class:silver={f.level >= 4} class:gold={f.level >= 5} aria-expanded={open === w} data-kiki-friend={w} data-level={f.level}
          data-sfx="tick" onclick={() => ((open = open === w ? null : w), (ja = false))}>
          <span class="head"><OfficialArt key={villagerArt(w, true)} alt="" size={46} /></span>
          <span class="txt">
            <b>{rosterName(w)}{#if f.level >= 3}<span class="badge" title={t('kiki.reward.call')}>📞</span>{/if}</b>
            <span class="hearts" aria-label={t('kiki.zukan.hearts', { n: f.level })}>{hearts(f.level)}</span>
            {#if f.level >= 1}<small class="greet" lang="en">“{greetingOf(ROSTER[w].personality, myName, rosterName(w)).en}”</small>{/if}
            <small class="next">{next ? t('kiki.zukan.next', { r: t(`kiki.reward.${next}`) }) : t('kiki.zukan.allRewards')}</small>
          </span>
        </button>
        {#if open === w && f.level >= 1}
          {@const p = ROSTER[w].personality}
          <div class="gifts card" data-kiki-gifts={w}>
            {#each rewardsAt(f.level) as r (r)}
              {#if r === 'greeting'}
                {@const g = greetingOf(p, myName, rosterName(w))}
                <p class="say" lang={ja ? 'ja' : 'en'}>{ja ? g.ja : g.en}</p>
              {:else if r === 'letter'}
                {@const l = letterOf(p, myName, rosterName(w))}
                <div class="letter" data-kiki-letter={w}>
                  <small>✉️ {t('kiki.zukan.letterFrom', { name: rosterName(w) })}</small>
                  <p lang={ja ? 'ja' : 'en'}>{ja ? l.ja : l.en}</p>
                </div>
              {:else if r === 'call'}
                <span class="pill">📞 {t('kiki.reward.call')}</span>
              {:else if r === 'frame'}
                <span class="pill">🖼️ {t('kiki.reward.frame')}</span>
              {:else}
                <figure class="photo" data-kiki-photo={w}>
                  <OfficialArt key={villagerArt(w)} alt={t('kiki.zukan.photoOf', { name: rosterName(w) })} size={150} />
                  <figcaption>{t('kiki.zukan.photoOf', { name: rosterName(w) })}</figcaption>
                </figure>
              {/if}
            {/each}
            <button type="button" class="chip" aria-pressed={ja} data-sfx="tick" onclick={() => (ja = !ja)}>{t('kiki.zukan.jaShow')}</button>
          </div>
        {/if}
      </li>
    {/each}
  </ul>

  {#if unmet.length}
    <section class="unmet" aria-labelledby="kk-unmet">
      <h3 id="kk-unmet">{t('kiki.zukan.notMet', { n: unmet.length })}</h3>
      <div class="shadows" aria-hidden="true">
        {#each unmet.slice(0, 14) as w (w)}<span class="head shadow"><OfficialArt key={villagerArt(w, true)} alt="" size={34} /></span>{/each}
      </div>
    </section>
  {/if}
</div>

<style>
  .friends { display: grid; gap: 12px; }
  .top { display: flex; align-items: center; gap: 12px; padding: 12px 14px; }
  .big { font-size: 30px; line-height: 1; }
  .ttxt { flex: 1; display: grid; gap: 2px; }
  .ttxt b { font: 700 var(--fs-talk)/1.2 var(--font-ui); }
  .ttxt small { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .up { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: color-mix(in srgb, var(--c-coral) 18%, var(--card)); }
  .up b { font: 700 var(--fs-body)/1.3 var(--font-ui); }
  .pop { color: var(--c-coral); font-size: 26px; animation: pop 900ms var(--ease-bounce) both; }
  @keyframes pop { from { transform: scale(0); } 60% { transform: scale(1.35); } to { transform: none; } }
  .list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  .row { appearance: none; border: 0; cursor: pointer; font: inherit; color: var(--text); text-align: left; width: 100%; display: flex; gap: 12px; align-items: center; padding: 10px 12px; }
  .row[aria-expanded='true'] { box-shadow: inset 0 0 0 2.5px var(--c-yuzu-lip), var(--sh-lip); }
  .head { flex: none; display: inline-grid; place-items: center; width: 52px; height: 52px; border-radius: 50%; background: var(--lip); overflow: hidden; }
  .up .head { width: 44px; height: 44px; }
  .silver .head { box-shadow: 0 0 0 3px #C9CFD8, 0 0 0 5px #9AA3B1; }
  .gold .head { box-shadow: 0 0 0 3px #F2CF63, 0 0 0 5px #C99B2E; }
  .txt { flex: 1; min-width: 0; display: grid; gap: 2px; }
  .txt b { font: 700 var(--fs-body)/1.2 var(--font-ui); display: flex; gap: 6px; align-items: center; }
  .badge { font-size: 14px; }
  .hearts { color: var(--c-coral); font-size: 15px; letter-spacing: 2px; line-height: 1; }
  .greet { font: italic 600 var(--fs-xs)/1.35 var(--font-ui); color: var(--text); overflow-wrap: anywhere; }
  .next { font: 700 var(--fs-xs)/1.2 var(--font-ui); color: var(--text-soft); }
  .gifts { display: grid; gap: 10px; padding: 12px 14px; margin-top: 6px; }
  .say { margin: 0; font: 700 var(--fs-body)/1.45 var(--font-ui); }
  .letter { padding: 10px 12px; border-radius: 12px; background: color-mix(in srgb, var(--c-yuzu) 22%, var(--card)); }
  .letter small { font: 700 var(--fs-xs)/1.2 var(--font-ui); color: var(--text-soft); }
  .letter p { margin: 6px 0 0; white-space: pre-line; font: 600 var(--fs-s)/1.55 var(--font-ui); }
  .pill { justify-self: start; padding: 6px 12px; border-radius: var(--r-pill); background: var(--ctl); box-shadow: var(--sh-ctl); font: 700 var(--fs-s)/1.2 var(--font-ui); }
  .photo { margin: 0; justify-self: center; display: grid; justify-items: center; gap: 6px; padding: 12px 18px 8px; border-radius: 6px; background: #FFFDF6; box-shadow: 0 0 0 5px #F2CF63, 0 0 0 8px #C99B2E, var(--sh-lip); }
  .photo figcaption { font: 700 var(--fs-xs)/1.2 var(--font-ui); color: var(--c-ink); }
  .gifts .chip { justify-self: end; min-height: var(--hit); }
  .gifts .chip[aria-pressed='true'] { background: var(--ctl-sel); }
  .none { margin: 0; padding: 12px 0; text-align: center; font: 700 var(--fs-body)/1.4 var(--font-ui); color: var(--text-soft); }
  .unmet { display: grid; gap: 8px; }
  .unmet h3 { margin: 4px 4px 0; font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); }
  .shadows { display: flex; flex-wrap: wrap; gap: 6px; }
  .shadow { width: 40px; height: 40px; }
  .shadow :global(img) { filter: brightness(0); opacity: .22; }
  @media (prefers-reduced-motion: reduce) { .pop { animation: none; } }
</style>
