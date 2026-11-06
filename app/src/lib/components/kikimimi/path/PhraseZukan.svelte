<script lang="ts">
  // The phrase ずかん, minimal (docs/kikimimi-ux.md §6.10's ことば; docs/curriculum-units.md §2): every unit's key
  // phrases by domain, each section with how many are caught. A card: caught (right on the first listen in 3 clips on
  // 2 days: srs.ts phrasesOf) shows the phrase, its Japanese and ★; heard shows a silhouette with 「きいた」; never heard,
  // a ？. A tap opens its entry under the grid: the trap a Japanese speaker falls into, the scene, the register. On top,
  // today's phrase review (phraseReview: ≤ 8, a new clip each) as one button. Opened from a unit's page it shows that
  // unit's phrases (and 「ぜんぶ」). Its own chunk.
  import { itemOf, load, unitPart, type Unit } from '#lib/kikimimi/pool.ts';
  import type { UnitChunk } from '#lib/kikimimi/lesson.ts';
  import type { Item } from '#lib/kikimimi/bank.ts';
  import { DOMAINS, isUnitDomain } from '#lib/kikimimi/stages.ts';
  import { domainIcon } from '../look.ts';
  import { phrasesOf, phraseReview } from '#lib/kikimimi/srs.ts';
    import { currentAnswers, currentReport, pathUnits } from '../progress.svelte.ts';
  import { t } from '#lib/i18n/index.ts';

  let { unit = null, onreview }: { unit?: string | null; onreview: (items: Item[]) => void } = $props();

  const ids = $derived(pathUnits().map((u) => u.id));
  let ready = $state(0);
  $effect(() => {
    void load(...(ids as Unit[])).then(() => ready++, () => {});
  });
  const chunks = $derived((void ready, ids.map((id) => unitPart(id)).filter((c) => !!c)));
  const report = $derived(currentReport());
  const answers = $derived(currentAnswers());
  const shown = $derived(unit ? chunks.filter((c) => c.unit.id === unit) : chunks);
  const sections = $derived.by(() => {
    const out = new Map<string, { domain: string; phrases: (UnitChunk['unit']['ph'][number] & { caught: boolean; heard: boolean })[] }>();
    for (const c of shown) {
      const st = phrasesOf(c.unit.ph, answers);
      const d = c.unit.domain;
      const sec = out.get(d) ?? out.set(d, { domain: d, phrases: [] }).get(d)!;
      for (const p of c.unit.ph) if (!sec.phrases.some((q) => q.id === p.id)) sec.phrases.push({ ...p, caught: !!st.get(p.id)?.caught, heard: !!st.get(p.id)?.heard });
    }
    const order: string[] = ['glue', ...DOMAINS];
    return [...out.values()].sort((a, b) => order.indexOf(a.domain) - order.indexOf(b.domain));
  });
  const all = $derived(sections.flatMap((s) => s.phrases));
  const caught = $derived(all.filter((p) => p.caught).length);
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
</script>

<div class="zukan" data-kiki-page="zukan" data-kiki-zukan={unit ?? 'all'}>
  <div class="top card">
    <span class="big" aria-hidden="true">📖</span>
    <span class="ttxt"><b>{unit ? unitName : t('kiki.zukan.words')}</b><small data-kiki-zukan-caught={caught}>{t('kiki.zukan.caught', { k: caught, n: all.length })}</small></span>
    {#if unit}<button type="button" class="chip" data-kiki-zukan-all data-sfx="tick" onclick={() => (unit = null)}>{t('kiki.domain.all')}</button>{/if}
  </div>

  {#if review.length}
    <button type="button" class="btn review" data-kiki-zukan-review={review.length} data-sfx="confirm" onclick={() => onreview(review)}>{t('kiki.zukan.review', { n: review.length })}</button>
  {/if}

  {#each sections as s (s.domain)}
    {@const k = s.phrases.filter((p) => p.caught).length}
    <section class="sec" aria-labelledby="kk-z-{s.domain}">
      <div class="shead">
        <h3 id="kk-z-{s.domain}">{domainIcon(s.domain)} {t(`kiki.domain.${s.domain}`)}</h3>
        <span class="meter" aria-hidden="true"><i style:width="{(k / Math.max(1, s.phrases.length)) * 100}%"></i></span>
        <small>{k} / {s.phrases.length}</small>
      </div>
      <div class="grid">
        {#each s.phrases as p (p.id)}
          <button type="button" class="zc" class:caught={p.caught} class:seen={!p.caught && p.heard} class:unseen={!p.heard} aria-expanded={open === p.id}
            data-kiki-phrase={p.id} data-caught={p.caught || undefined} data-sfx="tick" onclick={() => (open = open === p.id ? null : p.id)}>
            {#if p.caught}<span class="en" lang="en">{p.en}</span>{#if p.ja}<span class="ja">{p.ja}</span>{/if}<span class="stars" aria-hidden="true">★</span>
            {:else if p.heard}<span class="q" aria-hidden="true">{isUnitDomain(s.domain) ? domainIcon(s.domain) : '？'}</span><span class="ja">{t('kiki.zukan.heard')}</span>
            {:else}<span class="q" aria-hidden="true">？</span><span class="sr-only">{t('kiki.zukan.notYet')}</span>{/if}
          </button>
        {/each}
      </div>
      {#if opened && s.phrases.includes(opened)}
        <div class="entry card" data-kiki-phrase-entry={opened.id}>
          {#if opened.caught || opened.heard}<p class="een" lang="en">{opened.en}</p>{#if opened.ja}<p class="eja">{opened.ja}</p>{/if}
          {:else}<p class="eja">{t('kiki.zukan.notYet')}</p>{/if}
          <p class="trap"><small>{t('kiki.zukan.trap')}</small>{opened.trap}</p>
          <p class="meta">{opened.scene} · {opened.register}</p>
        </div>
      {/if}
    </section>
  {:else}
    <p class="none">{t('kiki.zukan.none')}</p>
  {/each}
</div>

<style>
  .zukan { display: grid; gap: 12px; }
  .top { display: flex; align-items: center; gap: 12px; padding: 12px 14px; }
  .big { font-size: 30px; line-height: 1; }
  .ttxt { flex: 1; display: grid; gap: 2px; }
  .ttxt b { font: 700 var(--fs-talk)/1.2 var(--font-ui); }
  .ttxt small { font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); }
  .top .chip { min-height: var(--hit); }
  .review { width: 100%; }
  .sec { display: grid; gap: 8px; }
  .shead { display: flex; align-items: center; gap: 10px; margin: 4px 4px 0; }
  .shead h3 { margin: 0; font: 700 var(--fs-body)/1.2 var(--font-ui); white-space: nowrap; }
  .shead small { font: 700 var(--fs-s)/1 var(--font-num); color: var(--text-soft); }
  .meter { flex: 1; height: 8px; border-radius: var(--r-pill); background: var(--ctl-off); overflow: hidden; }
  .meter i { display: block; height: 100%; border-radius: inherit; background: var(--c-leaf-edge); }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .zc {
    appearance: none; border: 0; cursor: pointer; font: inherit; color: var(--text); text-align: left; min-height: 92px; padding: 8px;
    border-radius: 16px; background: var(--card); box-shadow: var(--sh-lip); display: flex; flex-direction: column; gap: 3px;
  }
  .zc[aria-expanded='true'] { box-shadow: inset 0 0 0 2.5px var(--c-yuzu-lip), var(--sh-lip); }
  .zc .en { font: 700 15px/1.2 var(--font-ui); overflow-wrap: anywhere; }
  .zc .ja { font: 700 var(--fs-xs)/1.3 var(--font-ui); color: var(--text-soft); }
  .zc .stars { margin-top: auto; color: var(--c-yuzu-lip); font-size: 12px; }
  .zc.seen, .zc.unseen { align-items: center; justify-content: center; text-align: center; box-shadow: none; background: color-mix(in srgb, var(--lip) 35%, transparent); }
  .zc .q { font: 700 24px/1 var(--font-ui); color: var(--text-soft); }
  .zc.seen .q { filter: grayscale(1); opacity: .45; }
  .entry { display: grid; gap: 6px; padding: 12px 14px; }
  .entry p { margin: 0; }
  .een { font: 700 var(--fs-talk)/1.3 var(--font-ui); }
  .eja, .meta { font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }
  .trap { font: 700 var(--fs-s)/1.45 var(--font-ui); padding: 6px 10px; border-radius: 12px; background: color-mix(in srgb, var(--c-yuzu) 35%, transparent); color: var(--c-ink); }
  .trap small { display: block; font-size: var(--fs-xs); }
  .none { margin: 0; padding: 24px 0; text-align: center; font: 700 var(--fs-body)/1.4 var(--font-ui); color: var(--text-soft); }
</style>
