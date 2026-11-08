<script lang="ts">
  // ずかん › ことば (docs/kikimimi.md "ずかん"; docs/curriculum.md "A unit"): every unit's key phrases by domain, then each
  // bedtime serial's (🌙), a section's caught count and bar. A card: caught (srs.ts phrasesOf: right on the first listen
  // in 3 clips on 2 days; a story's: its chapter heard to the end) shows the phrase, its Japanese and its ★ (zukan.ts
  // phraseBook: ★ caught, ★★ in 2 accents, ★★★ on a phone or in noise too; a story's none) and NEW until seen once;
  // heard, a silhouette with 「Nかい きいた」; never heard, ？. ぜんぶ / つかまえた / まだ filter the cards. A tap opens its
  // entry under the grid: the trap, the scene, who said it and when, and ▶︎ a clip with it (heard ones only: never a
  // spoiler). On top, today's phrase review (phraseReview: ≤ 8, a new clip each). Opened from a unit's page it shows
  // that unit's phrases (and 「ぜんぶ」). Its own chunk.
  import { untrack } from 'svelte';
  import { itemOf } from '#lib/kikimimi/pool.ts';
  import type { Item } from '#lib/kikimimi/bank.ts';
  import { DOMAINS } from '#lib/kikimimi/stages.ts';
  import { phraseReview } from '#lib/kikimimi/srs.ts';
  import { PHRASE_FILTERS, STAR_MAX, passes, phraseBook, phraseClip, storyPhrases, type PhraseFilter } from '#lib/kikimimi/zukan.ts';
  import type { Who } from '#lib/types.ts';
  import type { RosterId } from '#lib/villagers/roster.ts';
  import { villagerArt } from '#lib/art.ts';
  import OfficialArt from '../../characters/OfficialArt.svelte';
  import Segmented from '../../ui/Segmented.svelte';
  import { domainIcon } from '../look.ts';
  import { rosterName } from '../scene/stage.ts';
  import { currentAnswers, currentReport } from '../progress.svelte.ts';
  import { storyProgress } from '../story/serials.svelte.ts';
  import { keepSeen, seenOf, type ZukanData } from './data.svelte.ts';
  import { t } from '#lib/i18n/index.ts';

  let { data, me, unit = null, onreview }: { data: ZukanData; me: Who; unit?: string | null; onreview: (items: Item[]) => void } = $props();

  type Card = {
    id: string; en: string; ja?: string; trap: string; meta: string; caught: boolean; heard: boolean; stars: number; times: number;
    last: string | null; who: RosterId[]; clip: () => string | null;
  };
  type Section = { key: string; icon: string; name: string; cards: Card[] };

  const report = $derived(currentReport());
  const answers = $derived(currentAnswers());
  const heardIds = $derived(new Set(answers.map((a) => a.id)));
  const chunks = $derived(data.units());
  const shown = $derived(unit ? chunks.filter((c) => c.unit.id === unit) : chunks);
  /** The caught phrases already seen when the page opened (NEW: the rest). */
  const seen = untrack(() => seenOf(me).ph);
  const sections = $derived.by<Section[]>(() => {
    void data.ready;
    const out = new Map<string, Section>(), have = new Set<string>();
    for (const c of shown) {
      const book = phraseBook(c.unit.ph, answers, data.info);
      const d = c.unit.domain;
      const sec = out.get(d) ?? out.set(d, { key: d, icon: domainIcon(d), name: t(`kiki.domain.${d}`), cards: [] }).get(d)!;
      for (const p of c.unit.ph) {
        if (have.has(p.id)) continue;
        have.add(p.id);
        const st = book.get(p.id)!;
        sec.cards.push({
          id: p.id, en: p.en, ja: p.ja, trap: p.trap, meta: `${p.scene} · ${p.register}`, caught: st.caught, heard: st.heard, stars: st.stars, times: st.times,
          last: st.last, who: st.who, clip: () => phraseClip(p.en, p.in, itemOf, heardIds)
        });
      }
    }
    const order: string[] = ['glue', ...DOMAINS];
    const units = [...out.values()].sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
    if (unit) return units;
    // the bedtime serials', each a section of its own
    const progress = storyProgress(me);
    const stories = new Map<string, Section>();
    const states = storyPhrases(data.chapters, progress);
    for (const ch of data.chapters) {
      const sec = stories.get(ch.unit) ?? stories.set(ch.unit, { key: `story-${ch.unit}`, icon: '🌙', name: ch.name, cards: [] }).get(ch.unit)!;
      for (const p of ch.ph) {
        if (have.has(p.id)) continue;
        have.add(p.id);
        const st = states.get(p.id)!;
        sec.cards.push({
          id: p.id, en: p.en, ja: p.ja, trap: p.trap, meta: `${t('kiki.story.chapter', { n: ch.chapter })} ${ch.title}`, caught: st.caught, heard: st.heard, stars: 0,
          times: 0, last: null, who: [], clip: () => p.in[0] ?? null
        });
      }
    }
    return [...units, ...stories.values()];
  });
  const all = $derived(sections.flatMap((s) => s.cards));
  const caught = $derived(all.filter((p) => p.caught).length);
  let filter = $state<PhraseFilter>('all');
  const FILTERS = PHRASE_FILTERS.map((id) => ({ id, label: t(`kiki.zukan.f.${id}`) }));
  // the caught ones kept as seen once shown (NEW stays on this visit's cards)
  $effect(() => {
    const ids = all.filter((p) => p.caught).map((p) => p.id);
    if (ids.some((id) => !seen.has(id))) untrack(() => keepSeen(me, { ph: [...seenOf(me).ph, ...ids] }));
  });
  /** Today's review: over every loaded unit's phrases, the items to hear them in (loaded ones only). */
  const review = $derived.by(() => {
    if (!report) return [];
    const ph = chunks.flatMap((c) => c.unit.ph);
    const playable = new Set(chunks.flatMap((c) => c.items.map((it) => it.id)));
    return phraseReview(ph, answers, report.today, playable).map((r) => itemOf(r.item)).filter((it): it is Item => !!it);
  });
  let open = $state<string | null>(null);
  const opened = $derived(all.find((p) => p.id === open) ?? null);
  const unitName = $derived(unit ? (chunks.find((c) => c.unit.id === unit)?.unit.name ?? '') : '');
  const md = (d: string) => ({ m: +d.slice(5, 7), d: +d.slice(8, 10) });
  function hear(p: Card) {
    const clip = p.clip();
    if (clip) void data.play(clip, `ph:${p.id}`);
  }
</script>

<div class="words" data-kiki-zukan={unit ?? 'all'}>
  <div class="top card">
    <span class="big" aria-hidden="true">📖</span>
    <span class="ttxt"><b>{unit ? unitName : t('kiki.zukan.words')}</b><small data-kiki-zukan-caught={caught}>{t('kiki.zukan.caught', { k: caught, n: all.length })}</small></span>
    {#if unit}<button type="button" class="chip" data-kiki-zukan-all data-sfx="tick" onclick={() => (unit = null)}>{t('kiki.domain.all')}</button>{/if}
  </div>

  {#if review.length}
    <button type="button" class="btn review" data-kiki-zukan-review={review.length} data-sfx="confirm" onclick={() => onreview(review)}>{t('kiki.zukan.review', { n: review.length })}</button>
  {/if}

  <Segmented label={t('kiki.zukan.filter')} attr="kiki-zukan-filter" value={filter} items={FILTERS} onpick={(f) => (filter = f)} />
  <p class="how">{t('kiki.zukan.starHow')}</p>

  {#each sections as s (s.key)}
    {@const k = s.cards.filter((p) => p.caught).length}
    {@const cards = s.cards.filter((p) => passes(filter, p.caught))}
    {#if cards.length}
      <section class="sec" aria-labelledby="kk-z-{s.key}" data-kiki-zukan-sec={s.key}>
        <div class="shead">
          <h3 id="kk-z-{s.key}">{s.icon} {s.name}</h3>
          <span class="meter" aria-hidden="true"><i style:width="{(k / Math.max(1, s.cards.length)) * 100}%"></i></span>
          <small>{k} / {s.cards.length}</small>
        </div>
        <div class="grid">
          {#each cards as p (p.id)}
            <button type="button" class="zc" class:caught={p.caught} class:seen={!p.caught && p.heard} class:unseen={!p.heard} aria-expanded={open === p.id}
              data-kiki-phrase={p.id} data-caught={p.caught || undefined} data-stars={p.stars || undefined} data-sfx="tick" onclick={() => (open = open === p.id ? null : p.id)}>
              {#if p.caught}
                {#if !seen.has(p.id)}<span class="new" data-kiki-new>{t('kiki.zukan.new')}</span>{/if}
                <span class="en" lang="en">{p.en}</span>{#if p.ja}<span class="ja">{p.ja}</span>{/if}
                {#if p.stars}<span class="stars" aria-label={t('kiki.zukan.stars', { n: p.stars })}>{'★'.repeat(p.stars)}<span class="off">{'★'.repeat(STAR_MAX - p.stars)}</span></span>
                {:else}<span class="stars" aria-hidden="true">{s.icon}</span>{/if}
              {:else if p.heard}<span class="q" aria-hidden="true">{s.icon || '？'}</span><span class="ja">{p.times ? t('kiki.zukan.times', { n: p.times }) : t('kiki.zukan.heard')}</span>
              {:else}<span class="q" aria-hidden="true">？</span><span class="sr-only">{t('kiki.zukan.notYet')}</span>{/if}
            </button>
          {/each}
        </div>
        {#if opened && cards.includes(opened)}
          <div class="entry card" data-kiki-phrase-entry={opened.id}>
            {#if opened.caught || opened.heard}
              <p class="een" lang="en">{opened.en}</p>{#if opened.ja}<p class="eja">{opened.ja}</p>{/if}
            {:else}<p class="eja">{t('kiki.zukan.notYet')}</p>{/if}
            <p class="trap"><small>{t('kiki.zukan.trap')}</small>{opened.trap}</p>
            <p class="meta">{opened.meta}</p>
            {#if opened.who.length}
              <div class="who"><small>{t('kiki.zukan.who')}</small>
                {#each opened.who.slice(0, 6) as w (w)}<span class="head" title={rosterName(w)}><OfficialArt key={villagerArt(w, true)} alt={rosterName(w)} size={34} /></span>{/each}
              </div>
            {/if}
            {#if opened.last}<p class="meta">{t('kiki.zukan.lastDay', md(opened.last))}</p>{/if}
            {#if opened.heard}
              <button type="button" class="btn paper small hear" data-kiki-phrase-hear={opened.id} data-sounding={data.sounding === `ph:${opened.id}` || undefined}
                data-sfx="tick" onclick={() => hear(opened)}>{t('kiki.zukan.hear')}</button>
            {/if}
          </div>
        {/if}
      </section>
    {/if}
  {:else}
    <div class="none">
      <span aria-hidden="true">？ ？ ？</span>
      <p>{t('kiki.zukan.none')}</p>
    </div>
  {/each}
</div>

<style>
  .words { display: grid; gap: 12px; }
  .top { display: flex; align-items: center; gap: 12px; padding: 12px 14px; }
  .big { font-size: 30px; line-height: 1; }
  .ttxt { flex: 1; display: grid; gap: 2px; }
  .ttxt b { font: 700 var(--fs-talk)/1.2 var(--font-ui); }
  .ttxt small { font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); }
  .top .chip { min-height: var(--hit); }
  .review { width: 100%; }
  .how { margin: -4px 4px 0; font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }
  .sec { display: grid; gap: 8px; }
  .shead { display: flex; align-items: center; gap: 10px; margin: 4px 4px 0; }
  .shead h3 { margin: 0; font: 700 var(--fs-body)/1.2 var(--font-ui); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 60%; }
  .shead small { font: 700 var(--fs-s)/1 var(--font-num); color: var(--text-soft); }
  .meter { flex: 1; height: 8px; border-radius: var(--r-pill); background: var(--ctl-off); overflow: hidden; }
  .meter i { display: block; height: 100%; border-radius: inherit; background: var(--c-leaf-edge); }
  .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
  .zc {
    position: relative; appearance: none; border: 0; cursor: pointer; font: inherit; color: var(--text); text-align: left; min-height: 92px; padding: 8px;
    border-radius: 16px; background: var(--card); box-shadow: var(--sh-lip); display: flex; flex-direction: column; gap: 3px;
  }
  .zc[aria-expanded='true'] { box-shadow: inset 0 0 0 2.5px var(--c-yuzu-lip), var(--sh-lip); }
  .zc .en { font: 700 15px/1.2 var(--font-ui); overflow-wrap: anywhere; }
  .zc .ja { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .zc .stars { margin-top: auto; color: var(--c-yuzu-lip); font-size: 12px; letter-spacing: 1px; }
  .zc .stars .off { color: var(--ctl-off); }
  .zc .new {
    position: absolute; top: -6px; right: -4px; padding: 2px 6px; border-radius: var(--r-pill); background: var(--c-coral); color: #fff;
    font: 700 10px/1.2 var(--font-num); box-shadow: 0 2px 0 var(--c-coral-edge, #c8644f);
  }
  .zc.seen, .zc.unseen { align-items: center; justify-content: center; text-align: center; box-shadow: none; background: color-mix(in srgb, var(--lip) 35%, transparent); }
  .zc .q { font: 700 24px/1 var(--font-ui); color: var(--text-soft); }
  .zc.seen .q { filter: grayscale(1); opacity: .45; }
  .entry { display: grid; gap: 6px; padding: 12px 14px; }
  .entry p { margin: 0; }
  .een { font: 700 var(--fs-talk)/1.3 var(--font-ui); }
  .eja, .meta { font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }
  .trap { font: 700 var(--fs-s)/1.45 var(--font-ui); padding: 6px 10px; border-radius: 12px; background: color-mix(in srgb, var(--c-yuzu) 35%, var(--c-card)); color: var(--c-ink); }
  .trap small { display: block; font-size: var(--fs-s); color: var(--c-ink-soft); }
  .who { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
  .who small { font: 700 var(--fs-s)/1 var(--font-ui); color: var(--text-soft); margin-right: 4px; }
  .head { display: inline-grid; place-items: center; width: 38px; height: 38px; border-radius: 50%; background: var(--lip); overflow: hidden; }
  .hear { justify-self: start; }
  .hear[data-sounding] { box-shadow: inset 0 0 0 2.5px var(--c-leaf-edge), var(--sh-ctl); }
  .none { display: grid; justify-items: center; gap: 6px; padding: 24px 0; text-align: center; }
  .none span { font: 700 28px/1 var(--font-ui); letter-spacing: 12px; color: var(--text-soft); opacity: .5; }
  .none p { margin: 0; font: 700 var(--fs-body)/1.4 var(--font-ui); color: var(--text-soft); }
</style>
