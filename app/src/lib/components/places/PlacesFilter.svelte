<script lang="ts">
  // 保存した場所's 絞り込み (docs/places.md "Search"): the ⇅ chip's paper sheet, live (each pick changes the chips and
  // the list behind it at once; 「412件を表示」 closes it). 並び順; 営業 (指定なし · 営業中 · 今日営業 · 日時を指定: a
  // day, 今日 or 日〜土, and an hour or 終日); 評価, 距離, 保存日 (one each, 指定なし first; a typed value not on the
  // list shown picked beside them); メモあり; ジャンル
  // (the tops with counts, a picked one's subs under it). Each section replaces its own kind of chip; the chips stay the
  // one model (the head's row shows them, each with ×).
  import Sheet from '../ui/Sheet.svelte';
  import Segmented from '../ui/Segmented.svelte';
  import { PLACE_CATS, PLACE_CAT_KEYS, type PlaceCat } from '#lib/contract/places.ts';
  import { SORTS, type Sort } from '#lib/places/search.ts';
  import { withChips, type Chip } from '#lib/places/query.ts';
  import { SF, SORT_LABEL, weekday } from '#lib/places/strings.ts';
  import { i18n } from '#lib/i18n/index.ts';
  import { formatNum } from '#lib/i18n/index.ts';
  import { pick } from '../travel/text.ts';

  interface Props {
    open: boolean;
    chips: readonly Chip[];
    sort: Sort;
    /** The matches now (the CTA's count). */
    total: number;
    /** The matches per top before the category chips. */
    perCat: ReadonlyMap<PlaceCat, number>;
    onchips: (c: Chip[]) => void;
    onsort: (s: Sort) => void;
    oncat: (cat: PlaceCat, sub?: string) => void;
  }
  let { open = $bindable(), chips, sort, total, perCat, onchips, onsort, oncat }: Props = $props();
  const L = $derived(i18n.locale);

  type K = Chip['k'];
  /** The chips with those of `kinds` replaced by `add`. */
  const put = (kinds: readonly K[], add: Chip | null) => onchips(withChips(chips.filter((c) => !kinds.includes(c.k)), add ? [add] : []));
  const find = <T extends K>(k: T) => chips.find((c): c is Extract<Chip, { k: T }> => c.k === k);

  // ---- 営業: one of them (a typed second one is replaced by a pick)
  const HOURS: readonly K[] = ['open', 'today', 'day', 'at'];
  const hrs = $derived(chips.find((c) => HOURS.includes(c.k)) ?? null);
  /** 日時を指定 picked (今日 + 終日 is the 今日営業 chip, and stays under 日時を指定 when picked there). */
  let when = $state(false);
  $effect(() => {
    if (!open) when = false;
  });
  const mode = $derived(!hrs ? 'any' : hrs.k === 'open' ? 'open' : hrs.k === 'today' && !when ? 'today' : 'when');
  /** The day picked under 日時を指定: -1 今日, else a weekday. */
  const whenDay = $derived(hrs?.k === 'day' ? hrs.d : hrs?.k === 'at' && hrs.d !== undefined ? hrs.d : -1);
  /** Its hour (-1 終日), and a typed time's minutes (19:30 kept when the day changes). */
  const whenHour = $derived(hrs?.k === 'at' ? Math.floor(hrs.m / 60) : -1);
  const whenMin = $derived(hrs?.k === 'at' ? hrs.m % 60 : 0);
  function setWhen(d: number, h: number, min = 0) {
    if (h < 0) put(HOURS, d < 0 ? { k: 'today' } : { k: 'day', d });
    else put(HOURS, { k: 'at', ...(d < 0 ? {} : { d }), m: h * 60 + min });
  }
  function setMode(m: string) {
    when = m === 'when';
    if (m === 'any') put(HOURS, null);
    else if (m === 'open') put(HOURS, { k: 'open' });
    else if (m === 'today') put(HOURS, { k: 'today' });
    else setWhen(-1, 19);
  }
  const HOUR_LIST = Array.from({ length: 24 }, (_, h) => h);

  // ---- one-of sections: their values and labels
  const RATES = [4, 4.3, 4.5], RADII = [500, 1500, 5000], RECENT = [7, 30, 90];
  const rate = $derived(find('rate')?.min ?? null);
  const radius = $derived(find('radius')?.m ?? null);
  const recent = $derived(find('recent')?.days ?? null);
  const memo = $derived(!!find('memo'));
  const m = (v: number) => (v < 1000 ? `${v} m` : `${v / 1000} km`);
  const RECENT_L: Record<number, { ja: string; en: string }> = { 7: { ja: '1週間', en: '1 week' }, 30: { ja: '1か月', en: '1 month' }, 90: { ja: '3か月', en: '3 months' } };
  const days = (d: number) => (RECENT_L[d] ? pick(RECENT_L[d], L) : L === 'ja' ? `${d}日` : `${d} days`);
  /** The list's values, a typed one off it added in order. */
  const withOwn = (list: readonly number[], v: number | null) => (v === null || list.includes(v) ? list : [...list, v].sort((a, b) => a - b));

  const topOn = (cat: PlaceCat) => chips.some((c) => c.k === 'cat' && c.cat === cat);
  const subOn = (cat: PlaceCat, sub: string) => chips.some((c) => c.k === 'cat' && c.cat === cat && c.sub === sub);
  const tops = $derived(PLACE_CAT_KEYS.filter((c) => topOn(c) || (perCat.get(c) ?? 0) > 0));
</script>

{#snippet one(name: string, attr: string, list: readonly number[], v: number | null, label: (x: number) => string, kind: K, make: (x: number) => Chip)}
  <section data-filter={attr}>
    <h3 id="pf-{attr}">{name}</h3>
    <div class="chips" role="radiogroup" aria-labelledby="pf-{attr}">
      <button type="button" class="chip s" role="radio" aria-checked={v === null} data-pick="any" data-sfx={v === null ? 'none' : 'tick'} onclick={() => put([kind], null)}>{pick(SF.any, L)}</button>
      {#each withOwn(list, v) as x (x)}
        <button type="button" class="chip s" role="radio" aria-checked={v === x} data-pick={x} data-sfx={v === x ? 'none' : 'tick'} onclick={() => put([kind], make(x))}>{label(x)}</button>
      {/each}
    </div>
  </section>
{/snippet}

<Sheet bind:open name="places-filter" title={pick(SF.title, L)}>
  <div class="pf" data-places-filter>
    <section>
      <h3>{pick(SF.sort, L)}</h3>
      <Segmented size="s" items={SORTS.map((k) => ({ id: k, label: pick(SORT_LABEL[k], L) }))} value={sort} label={pick(SF.sort, L)} attr="sort-pick" onpick={onsort} />
    </section>
    <section data-filter="hours">
      <h3>{pick(SF.hours, L)}</h3>
      <Segmented size="s" grow items={[{ id: 'any', label: pick(SF.any, L) }, { id: 'open', label: pick(SF.open, L) }, { id: 'today', label: pick(SF.today, L) }, { id: 'when', label: pick(SF.when, L) }]}
        value={mode} label={pick(SF.hours, L)} attr="hours-pick" onpick={setMode} />
      {#if mode === 'when'}
        <div class="chips" role="radiogroup" aria-label={pick(SF.day, L)}>
          {#each [-1, 0, 1, 2, 3, 4, 5, 6] as d (d)}
            <button type="button" class="chip s" role="radio" aria-checked={whenDay === d} data-day-pick={d} data-sfx={whenDay === d ? 'none' : 'tick'}
              onclick={() => setWhen(d, whenHour, whenMin)}>{d < 0 ? pick(SF.todayDay, L) : weekday(d, L).replace('曜', '')}</button>
          {/each}
        </div>
        <label class="hour">
          <span>{pick(SF.hour, L)}</span>
          <select class="input" data-hour-pick data-sfx="none" value={whenHour} onchange={(e) => setWhen(whenDay, Number(e.currentTarget.value))}>
            <option value={-1}>{pick(SF.allDay, L)}</option>
            {#each HOUR_LIST as h (h)}<option value={h}>{L === 'ja' ? `${h}時` : `${h}:00`}</option>{/each}
          </select>
        </label>
      {/if}
    </section>
    {@render one(pick(SF.rate, L), 'rate', RATES, rate, (x) => `★${x.toFixed(1)}`, 'rate', (min) => ({ k: 'rate', min }))}
    {@render one(pick(SF.dist, L), 'radius', RADII, radius, m, 'radius', (r) => ({ k: 'radius', m: r }))}
    {@render one(pick(SF.saved, L), 'recent', RECENT, recent, days, 'recent', (d) => ({ k: 'recent', days: d }))}
    <button type="button" class="prow" role="switch" aria-checked={memo} data-filter-memo data-sfx="tick" onclick={() => put(['memo'], memo ? null : { k: 'memo' })}>
      <span class="prl">{pick(SF.memo, L)}</span><span class="sw s" aria-hidden="true"><i></i></span>
    </button>
    {#if tops.length}
      <section data-filter="cat">
        <h3>{pick(SF.genre, L)}</h3>
        <div class="chips">
          {#each tops as cat (cat)}
            <button type="button" class="chip s" aria-pressed={topOn(cat)} data-cat-pick={cat} data-sfx="tick" onclick={() => oncat(cat)}><span>{cat}</span><span class="n">{formatNum(perCat.get(cat) ?? 0)}</span></button>
          {/each}
        </div>
        {#each tops.filter(topOn) as cat (cat)}
          <div class="chips subs" role="group" aria-label={cat}>
            {#each PLACE_CATS[cat] as sub (sub)}
              <button type="button" class="chip s" aria-pressed={subOn(cat, sub)} data-sub-pick={sub} data-sfx="tick" onclick={() => oncat(cat, sub)}>{sub}</button>
            {/each}
          </div>
        {/each}
      </section>
    {/if}
  </div>
  {#snippet footer()}
    <button type="button" class="btn" data-places-filter-show data-sfx="tick" onclick={() => (open = false)}>{pick(SF.show, L).replace('{n}', formatNum(total))}</button>
  {/snippet}
</Sheet>

<style>
  .pf { display: grid; gap: 16px; padding-bottom: 8px; }
  .pf section { display: grid; gap: 12px; }
  .pf h3 { margin: 0; font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); }
  /* 32 px chips 12 apart: each its 44 px hit (docs/design.md "Sizes") */
  .chips { display: flex; flex-wrap: wrap; gap: 12px 6px; }
  .chips .chip { min-width: 44px; justify-content: center; }
  .subs { padding-left: 12px; }
  .hour { display: flex; align-items: center; gap: 10px; font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); }
  .hour select { width: auto; min-width: 8em; font-family: var(--font-num); }
</style>
