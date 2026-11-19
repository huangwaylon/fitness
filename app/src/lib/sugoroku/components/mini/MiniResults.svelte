<script lang="ts">
  // A みんなで！'s result (docs/sugoroku.md "みんなで！"), on every phone once it closes, till 次へ (this phone's: the game
  // has gone on): the game, what the table made (the longest word, the lines, the pictures got across, the cards
  // sorted, the chain's longest word, a request asked right, a reply found) as TurnResult with the team's stars, then
  // each seat's share in seat order (never ranked, never a 0: a seat with none お休み), and 「みんなで星N個！」 (none:
  // 「次はきっと！」).
  import Avatar from '#lib/components/characters/Avatar.svelte';
  import TurnResult from '../TurnResult.svelte';
  import type { Game } from '../../game.ts';
  import type { Who } from '#lib/types.ts';
  import { s as tr } from '../../i18n.ts';

  interface Props {
    g: Game;
    onnext: () => void;
  }
  let { g, onnext }: Props = $props();
  /** The mini-game as it closed (its last play in), for each seat's part. */
  const last = $derived(g.lastMini ?? null);
  const res = $derived(g.minis?.at(-1) ?? null);
  /** What it made: the game's made at the end of the list. */
  const made = $derived.by(() => {
    if (!res) return [];
    const out = [];
    for (let k = g.made.length - 1; k >= 0 && g.made[k].mini === res.id; k--) out.unshift(g.made[k]);
    return out;
  });
  const team = $derived(res ? Object.values(res.stars).reduce((n, x) => n + (x ?? 0), 0) : 0);
  const seats = $derived(res ? g.players.filter((p) => !last || last.here.includes(p.who)) : []);
  const st = $derived(last && res && last.id === res.id ? last : null);
  /** Each seat's part, said in a word (none: nothing said). */
  function partOf(w: Who): string {
    if (!st) return '';
    if (st.id === 'market') {
      const n = st.s.found.filter((f) => f.who === w).length;
      return n ? tr('mkWords', { n }) : '';
    }
    if (st.id === 'sort' || st.id === 'numbers') {
      const n = st.s.counts[w] ?? 0;
      return n ? tr(st.id === 'sort' ? 'soCount' : 'nuCount', { n }) : '';
    }
    if (st.id === 'chain') {
      const n = st.s.chain.filter((l) => l.who === w).length;
      return n ? tr('chLinks', { n }) : '';
    }
    if (st.id === 'reply') {
      const n = st.s.results.filter((x) => x.by === w).length;
      return n ? tr('reCount', { n }) : '';
    }
    if (st.id === 'spell') {
      const gave = made.filter((m) => m.p === g.players.findIndex((p) => p.who === w)).length;
      return gave ? tr('spGot', { n: gave }) : '';
    }
    return '';
  }
  const headline = $derived.by((): { text: string; kind: 'word' | 'line'; ja: string } | null => {
    if (!res) return null;
    if (res.id === 'together') return made[0] ? { text: made.map((m) => m.text).join(' / '), kind: 'line', ja: made.map((m) => m.ja).join(' / ') } : null;
    if (res.id === 'sort' || res.id === 'numbers') return null;
    // (the chain's longest word; the last request asked right, the last reply found)
    if (res.id === 'chain') return made[0] ? { text: made[0].text, kind: 'word', ja: made[0].ja } : null;
    if (res.id === 'shopping' || res.id === 'reply') return made.length ? { text: made.at(-1)!.text, kind: 'line', ja: made.at(-1)!.ja } : null;
    const m = res.id === 'market' ? made[0] : made.at(-1);
    return m ? { text: res.id === 'spell' ? made.map((x) => x.text).join(', ') : m.text, kind: res.id === 'spell' && made.length > 1 ? 'line' : 'word', ja: res.id === 'spell' ? made.map((x) => x.ja).join('、') : m.ja } : null;
  });
</script>

{#if res}
  <section class="mres" data-sg-mini-result={res.id} data-sg-mini-team={team}>
    <div class="head"><span class="tag mtag">{tr('miniTitle')}</span><b class="name">{tr(`mini.${res.id}`)}</b></div>
    {#if (res.id === 'market' || res.id === 'chain') && headline}<p class="soft">{tr('mkLongest')}</p>{/if}
    {#if headline}
      <TurnResult answer={false} text={headline.text} stars={team} kind={headline.kind} />
      {#if headline.ja}<p class="ja">{headline.ja}</p>{/if}
    {/if}
    <p class="teamline" data-sg-mini-total>{team ? tr('miniTeam', { n: team }) : tr('miniTeam0')}</p>
    <ul class="seats">
      {#each seats as p (p.who)}
        <li data-sg-mini-seat={p.who} data-stars={res.stars[p.who] ?? 0}>
          <Avatar person={p.who} worn size={28} /><span class="pn">{p.name}</span>
          {#if partOf(p.who)}<span class="part">{partOf(p.who)}</span>{/if}
          <span class="st">{(res.stars[p.who] ?? 0) > 0 ? tr('miniSeat', { n: res.stars[p.who] ?? 0 }) : tr('miniRest')}</span>
        </li>
      {/each}
    </ul>
    <button type="button" class="btn" data-sfx="confirm" data-sg-next data-sg-mini-next onclick={onnext}>{tr('next')}</button>
  </section>
{/if}

<style>
  .mres { display: flex; flex-direction: column; gap: 8px; }
  .mres > :global(*) { flex-shrink: 0; }
  .head { display: flex; align-items: center; gap: 8px; min-height: 32px; }
  .mtag { background: color-mix(in srgb, var(--c-rose) 45%, var(--c-cream)); color: var(--c-ink); }
  .name { font: 700 var(--fs-body)/1.2 var(--font-ui); color: var(--c-ink); }
  .soft { margin: 0; text-align: center; font: 500 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .ja { margin: 0; text-align: center; font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); text-wrap: pretty; }
  .teamline { margin: 0; text-align: center; font: 700 var(--fs-body)/1.3 var(--font-ui); color: var(--c-ink); }
  .seats { display: flex; flex-direction: column; gap: 4px; margin: 0; padding: 0; list-style: none; }
  .seats li { display: flex; align-items: center; gap: 8px; min-height: 36px; padding: 0 10px 0 4px; border-radius: var(--r-pill); background: color-mix(in srgb, var(--c-paper) 60%, var(--c-cream)); }
  .pn { font: 700 var(--fs-s)/1 var(--font-ui); color: var(--c-ink); }
  .part { font: 500 var(--fs-s)/1 var(--font-ui); color: var(--text-soft); }
  .st { margin-left: auto; font: 600 var(--fs-s)/1 var(--font-num); color: var(--c-ink); }
  .btn { margin: 0; min-height: 48px; }
</style>
