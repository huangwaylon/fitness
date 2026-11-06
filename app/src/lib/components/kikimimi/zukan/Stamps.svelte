<script lang="ts">
  // ずかん › スタンプ (docs/kikimimi-ux.md §6.10, §7.6): the units' can-do stamps in the path's order (mine with its day,
  // the double stamp when both of us have it, the partner's alone a faint mark; a blank for the rest: stamps.ts), the
  // week stamps (week.ts weekStamps against my target as set now), the いっぱつ count and its badges (zukan.ts
  // ippatsuOf), the weekend tournament's trophies (the same shelf as きろく's: taikai/def.ts trophiesOf) and the bedtime
  // chapters heard to the end. No かいがら: the stamps are the reward. Its own chunk.
  import type { Who } from '#lib/types.ts';
  import { IPPATSU_BADGES, chaptersDone, ippatsuOf, unitStamps } from '#lib/kikimimi/zukan.ts';
  import { weekStamps } from '#lib/kikimimi/week.ts';
  import { trophiesOf } from '#lib/kikimimi/games/taikai/def.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { villagerNameOf } from '#lib/ui-state/viewer.ts';
  import { MEDAL, domainIcon } from '../look.ts';
  import { currentAnswers, currentReport, currentUnits, pathUnits } from '../progress.svelte.ts';
  import { weekGoal } from '../prefs.ts';
  import { SERIALS, storyProgress } from '../story/serials.svelte.ts';
  import { t } from '#lib/i18n/index.ts';

  let { me }: { me: Who } = $props();
  const report = $derived(currentReport());
  const units = $derived(pathUnits());
  const stamps = $derived(unitStamps(units.map((u) => u.id), currentUnits()));
  const mineN = $derived(stamps.filter((s) => s.d).length);
  const ippatsu = $derived(ippatsuOf(currentAnswers()));
  const weeks = $derived(report ? weekStamps([...report.games.map((g) => ({ d: g.d, n: g.r.length, ms: g.ms })), ...report.stories.map((s) => ({ d: s.d, n: 0, ms: s.ms, story: true }))], weekGoal()) : []);
  const trophies = $derived(report ? [...trophiesOf(report.games)].sort(([a], [b]) => (a < b ? 1 : -1)) : []);
  const chapters = $derived(chaptersDone(storyProgress(me), SERIALS.map((s) => s.unit)));
  const partner = $derived(week.view && me !== 'G' ? villagerNameOf(week.view, me === 'A' ? 'B' : 'A') : '');
  const md = (d: string) => ({ m: +d.slice(5, 7), d: +d.slice(8, 10) });
  const serial = (u: string) => SERIALS.find((s) => s.unit === u);
</script>

<div class="stamps" data-kiki-stampbook>
  <section class="sec" aria-labelledby="kk-st-cando">
    <div class="shead"><h3 id="kk-st-cando">{t('kiki.zukan.cando')}</h3><small data-kiki-cando={mineN}>{t('kiki.zukan.candoN', { k: mineN, n: stamps.length })}</small></div>
    <div class="grid">
      {#each stamps as s (s.id)}
        {@const u = units.find((x) => x.id === s.id)!}
        <div class="st card" class:on={!!s.d} class:double={s.double} class:theirs={!s.d && s.partner} data-kiki-cando-stamp={s.id} data-stamped={s.d ? 1 : undefined} data-double={s.double || undefined}>
          <span class="seal" aria-hidden="true">{s.d ? domainIcon(u.domain) || '✓' : '？'}</span>
          <b>{u.name}</b>
          {#if u.short}<small>{u.short}</small>{/if}
          {#if s.d}<span class="day">{t('kiki.zukan.stampDay', md(s.d))}</span>{/if}
          {#if s.double}<span class="two">{t('kiki.zukan.double')}</span>
          {:else if s.partner && partner}<span class="two soft">{t('kiki.zukan.partnerHas', { name: partner })}</span>{/if}
        </div>
      {/each}
    </div>
  </section>

  <section class="sec card box" aria-labelledby="kk-st-week" data-kiki-week-stamps={weeks.length}>
    <h3 id="kk-st-week">🗓️ {t('kiki.zukan.weeks')}</h3>
    {#if weeks.length}
      <p>{t('kiki.zukan.weeksN', { n: weeks.length })}</p>
      <ol class="dots" aria-hidden="true">{#each weeks.slice(-12) as m (m)}<li title={t('kiki.zukan.stampDay', md(m))}>✓</li>{/each}</ol>
    {:else}<p class="soft">{t('kiki.zukan.weeksNone')}</p>{/if}
  </section>

  <section class="sec card box" aria-labelledby="kk-st-ip" data-kiki-ippatsu={ippatsu.n}>
    <h3 id="kk-st-ip">⚡ {t('kiki.zukan.ippatsu')}</h3>
    <p>{t('kiki.zukan.ippatsuN', { n: ippatsu.n })}</p>
    <ol class="badges">
      {#each IPPATSU_BADGES as b (b)}<li class:got={ippatsu.badges.includes(b)} data-kiki-badge={b} data-got={ippatsu.badges.includes(b) || undefined}>{b}</li>{/each}
    </ol>
    {#if ippatsu.next}<p class="soft">{t('kiki.zukan.ippatsuNext', { n: ippatsu.next - ippatsu.n })}</p>{/if}
  </section>

  <section class="sec card box" aria-labelledby="kk-st-cup" data-kiki-zukan-trophies={trophies.length}>
    <h3 id="kk-st-cup">🏆 {t('kiki.zukan.trophies')}</h3>
    {#if trophies.length}
      <ul class="shelf">
        {#each trophies as [fri, cup] (fri)}
          <li data-kiki-shelf={cup}><span class="cup" aria-hidden="true">{MEDAL[cup]}</span><small>{t('kiki.prog.trophyWeek', md(fri))}</small><span class="sr-only">{t(`kiki.trophy.${cup}`)}</span></li>
        {/each}
      </ul>
    {:else}<p class="soft">{t('kiki.zukan.trophiesNone')}</p>{/if}
  </section>

  <section class="sec card box" aria-labelledby="kk-st-story" data-kiki-chapters={chapters.length}>
    <h3 id="kk-st-story">🌙 {t('kiki.zukan.stories')}</h3>
    {#if chapters.length}
      <ul class="chs">
        {#each chapters as [u, ch, d] (`${u}-${ch}`)}
          {@const s = serial(u)}
          <li data-kiki-chapter-stamp="{u}-{ch}"><span class="tick" aria-hidden="true">✓</span><span>{s?.name} · {t('kiki.story.chapter', { n: ch })}{#if s?.chapters[ch - 1]}「{s.chapters[ch - 1].title}」{/if}</span><small>{t('kiki.zukan.stampDay', md(d))}</small></li>
        {/each}
      </ul>
    {:else}<p class="soft">{t('kiki.zukan.storiesNone')}</p>{/if}
  </section>
</div>

<style>
  .stamps { display: grid; gap: 12px; }
  .sec { display: grid; gap: 8px; }
  .box { padding: 12px 14px; }
  .sec h3 { margin: 0; font: 700 var(--fs-body)/1.2 var(--font-ui); }
  .sec p { margin: 0; font: 700 var(--fs-s)/1.4 var(--font-ui); }
  .soft { color: var(--text-soft); }
  .shead { display: flex; align-items: baseline; justify-content: space-between; margin: 4px 4px 0; }
  .shead small { font: 700 var(--fs-s)/1 var(--font-num); color: var(--text-soft); }
  .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .st { position: relative; display: grid; justify-items: center; text-align: center; gap: 3px; padding: 12px 8px 10px; }
  .st b { font: 700 var(--fs-s)/1.25 var(--font-ui); }
  .st small { font: 700 var(--fs-xs)/1.3 var(--font-ui); color: var(--text-soft); }
  .seal {
    display: inline-grid; place-items: center; width: 52px; height: 52px; border-radius: 50%; font: 700 24px/1 var(--font-ui);
    border: 2.5px dashed var(--ctl-off); color: var(--text-soft);
  }
  .on .seal { border: 3px solid var(--c-coral); color: var(--c-coral); background: color-mix(in srgb, var(--c-coral) 12%, transparent); transform: rotate(-8deg); }
  .double .seal { box-shadow: 0 0 0 4px var(--card), 0 0 0 6.5px var(--c-mint); }
  .theirs .seal { border-style: solid; border-color: var(--c-mint); opacity: .7; }
  .day { font: 700 var(--fs-xs)/1 var(--font-num); color: var(--coral-text); }
  .two { font: 700 10px/1.2 var(--font-ui); padding: 2px 8px; border-radius: var(--r-pill); background: var(--c-mint); color: var(--c-ink); }
  .two.soft { background: transparent; color: var(--text-soft); }
  .dots { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px; }
  .dots li { display: inline-grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; background: var(--c-coral); color: #fff; font: 700 13px/1 var(--font-ui); }
  .badges { list-style: none; margin: 0; padding: 0; display: flex; gap: 6px; }
  .badges li {
    flex: 1; display: inline-grid; place-items: center; height: 40px; border-radius: 12px; font: 700 var(--fs-s)/1 var(--font-num);
    background: var(--ctl-off); color: var(--text-soft);
  }
  .badges li.got { background: var(--c-yuzu); color: var(--c-ink); box-shadow: 0 3px 0 var(--c-yuzu-lip); }
  .shelf { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 10px; }
  .shelf li { display: grid; justify-items: center; gap: 2px; }
  .cup { font-size: 30px; line-height: 1; }
  .shelf small { font: 700 var(--fs-xs)/1.2 var(--font-ui); color: var(--text-soft); }
  .chs { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
  .chs li { display: flex; gap: 8px; align-items: baseline; font: 700 var(--fs-s)/1.4 var(--font-ui); }
  .chs li span:nth-child(2) { flex: 1; }
  .chs small { font: 700 var(--fs-xs)/1 var(--font-num); color: var(--text-soft); }
  .tick { color: var(--leaf-text); }
</style>
