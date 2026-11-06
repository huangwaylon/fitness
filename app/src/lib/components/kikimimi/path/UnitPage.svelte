<script lang="ts">
  // A unit's page (docs/kikimimi-ux.md §6.3b; the UX review's sketch B), pushed from a stop on しまの みち: its scene with
  // the host villager, the domain, the can-do's one line (the template's sentence folded under 「くわしく」), the stamps (mine and the partner's, the double), the 3
  // core lessons as big cards (6もん・2ぷん; ✓ once played to the end; the next one carries the only green あそぶ; the
  // チェック its 5-of-6 rule), the extras (☆ おと, ☆ じっせん) never blocking anything, the key phrases (caught or not:
  // a tap opens the ずかん on this unit's) and 「とばして チェック」 at the foot. A lesson opens its intro card. Its own
  // chunk with the path's.
  import { load, unitPart, type Unit } from '#lib/kikimimi/pool.ts';
  import type { UnitChunk } from '#lib/kikimimi/lesson.ts';
  import { playIds } from '#lib/kikimimi/lesson.ts';
  import { CORE, DOMAINS, isDomain, nextLesson } from '#lib/kikimimi/path.ts';
  import { LESSONS, type Lesson } from '#lib/kikimimi/stages.ts';
  import { phrasesOf } from '#lib/kikimimi/srs.ts';
  import { answersOf } from '#lib/kikimimi/progress.ts';
  import type { RosterId } from '#lib/villagers/roster.ts';
  import OfficialArt from '../../characters/OfficialArt.svelte';
  import { artUrl, villagerArt } from '#lib/art.ts';
  import { rosterName, sceneArt, sceneSrcset, SCENE_SIZES } from '../scene/stage.ts';
  import { currentReport, currentUnits } from '../progress.svelte.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { villagerNameOf } from '#lib/ui-state/viewer.ts';
  import { t } from '#lib/i18n/index.ts';

  let { id, onlesson, onzukan }: { id: string; onlesson: (id: string, lesson: Lesson) => void; onzukan: (unit: string) => void } = $props();

  let ready = $state(0);
  $effect(() => {
    void load(id as Unit).then(() => ready++, () => {});
  });
  const part = $derived((void ready, unitPart(id) as UnitChunk | undefined));
  const u = $derived(part?.unit);
  const us = $derived(currentUnits().get(id));
  const report = $derived(currentReport());
  const lessons = $derived(u ? LESSONS.filter((l) => part && playIds(part, l).length) : []);
  const next = $derived(nextLesson(lessons, us));
  const done = $derived(us?.done ?? []);
  const phrases = $derived.by(() => {
    if (!u) return [];
    const st = phrasesOf(u.ph, report ? answersOf(report.games) : []);
    return u.ph.map((p) => ({ ...p, caught: !!st.get(p.id)?.caught, heard: !!st.get(p.id)?.heard }));
  });
  const caught = $derived(phrases.filter((p) => p.caught).length);
  const scene = $derived(u && artUrl(sceneArt(u.scene)) ? u.scene : null);
  const host = $derived(u ? rosterName(u.host as RosterId) : '');
  const domain = $derived(u && isDomain(u.domain) ? u.domain : null);
  const partner = $derived(week.view && week.view.viewer !== 'G' ? villagerNameOf(week.view, week.view.viewer === 'A' ? 'B' : 'A') : null);
  const extras = $derived(lessons.filter((l) => !CORE.includes(l)));
</script>

{#if u}
  <div class="unit" data-kiki-page="unit" data-kiki-unit-page={id}>
    <div class="hero" style:--tint={domain ? DOMAINS[domain].tint : 'var(--c-mint)'}>
      {#if scene}<img class="bd" src={artUrl(sceneArt(scene))} srcset={sceneSrcset(scene)} sizes={SCENE_SIZES} width="393" height="224" alt="" decoding="async" draggable="false" />{/if}
      <span class="who"><OfficialArt key={villagerArt(u.host)} alt={host} size={112} eager /></span>
      <span class="tag">{host}</span>
      {#if domain}<span class="dom">{DOMAINS[domain].icon} {t(`kiki.domain.${domain}`)}</span>{/if}
    </div>

    <div class="goal card">
      <small>{t('kiki.lesson.goal')}</small>
      {#if u.cando.short}
        <p class="short" data-kiki-short>{u.cando.short}</p>
        <details class="more"><summary>{t('kiki.more')}</summary><p data-kiki-cando lang="ja">「{u.cando.ja}」</p></details>
      {:else}
        <p data-kiki-cando>「{u.cando.ja}」</p>
      {/if}
    </div>

    <div class="stamps card" data-kiki-stamps data-stamped={us?.stamped ? '1' : undefined} data-double={us?.double ? '1' : undefined}>
      <span class="slot" class:on={!!us?.stamped} data-kiki-stamp-mine={us?.stamped ? '1' : '0'}>
        <i aria-hidden="true">{us?.stamped ? '🏅' : '○'}</i><small>{t('kiki.unit.me')}</small>
      </span>
      {#if partner}
        <span class="slot" class:on={!!us?.partner} data-kiki-stamp-partner={us?.partner ? '1' : '0'}>
          <i aria-hidden="true">{us?.partner ? '🏅' : '○'}</i><small>{partner}</small>
        </span>
      {/if}
      <p class="sline">
        {#if us?.double}<b class="dbl">{t('kiki.stamp.double')}</b>
        {:else if us?.stamped}<b>{t('kiki.stamp.got')}</b>
        {:else}{t('kiki.unit.stampHow')}{/if}
        {#if us?.tally}<small data-kiki-tally-mine={us.tally.first}>{t('kiki.stamp.mine', { k: us.tally.first, n: us.tally.of })}</small>{/if}
      </p>
    </div>

    <ol class="core">
      {#each CORE.filter((l) => lessons.includes(l)) as l, i (l)}
        {@const isNext = l === next}
        <li>
          <button type="button" class="lesson" class:next={isNext} class:done={done.includes(l)} data-kiki-unit-lesson={l} data-done={done.includes(l) || undefined}
            data-sfx="confirm" onclick={() => onlesson(id, l)}>
            <span class="no" aria-hidden="true">{done.includes(l) ? '✓' : i + 1}</span>
            <span class="ltxt">
              <b>{t(`kiki.lesson.${l}`)}</b>
              <small>{l === 'check' ? t('kiki.unit.checkSub') : t(`kiki.unit.sub.${l}`)} · {t('kiki.unit.len')}</small>
            </span>
            {#if isNext}<span class="play">{t('kiki.path.play')}</span>
            {:else if done.includes(l)}<span class="ok">{t('kiki.unit.again')}</span>{/if}
          </button>
        </li>
      {/each}
    </ol>

    {#if extras.length}
      <section class="extras" aria-labelledby="kk-extra">
        <h3 id="kk-extra" class="sec-label">{t('kiki.unit.extras')}</h3>
        <div class="egrid">
          {#each extras as l (l)}
            <button type="button" class="extra" class:done={done.includes(l)} data-kiki-unit-lesson={l} data-sfx="confirm" onclick={() => onlesson(id, l)}>
              <span class="star" aria-hidden="true">{done.includes(l) ? '★' : '☆'}</span>
              <span class="ltxt"><b>{t(`kiki.lesson.${l}`)}</b><small>{t(`kiki.unit.sub.${l}`)}</small></span>
            </button>
          {/each}
        </div>
      </section>
    {/if}

    {#if phrases.length}
      <button type="button" class="phr card" data-kiki-unit-phrases={caught} data-sfx="open" onclick={() => onzukan(id)}>
        <span class="phead"><b>{t('kiki.unit.phrases')}</b><small>{t('kiki.zukan.caught', { k: caught, n: phrases.length })}</small><span class="chev" aria-hidden="true">›</span></span>
        <span class="pchips">
          {#each phrases.slice(0, 6) as p (p.id)}<span class="pc" class:caught={p.caught} lang="en">{p.en}</span>{/each}
        </span>
      </button>
    {/if}
  </div>

  {#if next !== 'check' && !us?.stamped}
    <div class="level-acts">
      <button type="button" class="btn paper" data-kiki-skip-check data-sfx="confirm" onclick={() => onlesson(id, 'check')}>{t('kiki.unit.skip')}</button>
    </div>
  {/if}
{:else}
  <p class="wait" role="status">{t('kiki.unit.loading')}</p>
{/if}

<style>
  .unit { display: grid; gap: 12px; }
  .card { border-radius: var(--r-card); background: var(--card); box-shadow: var(--sh-lip); }
  /* the scene: the backdrop (or the domain's tint) with the host standing in it */
  .hero {
    position: relative; height: 150px; border-radius: var(--r-card); overflow: hidden; box-shadow: var(--sh-lip);
    background: linear-gradient(color-mix(in srgb, var(--tint) 30%, var(--card)), color-mix(in srgb, var(--tint) 55%, var(--card)));
  }
  .bd { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .who { position: absolute; left: 50%; bottom: 4px; translate: -50% 0; line-height: 0; filter: drop-shadow(0 4px 0 rgba(74, 58, 44, .18)); }
  .tag {
    position: absolute; left: 12px; bottom: 12px; padding: 4px 12px; border-radius: var(--r-pill); rotate: -4deg;
    background: var(--c-yuzu); color: var(--c-ink); font: 700 var(--fs-s)/1.2 var(--font-ui); box-shadow: 0 2px 0 var(--c-yuzu-lip);
  }
  .dom {
    position: absolute; right: 10px; top: 10px; padding: 5px 10px; border-radius: var(--r-pill); background: var(--c-card); color: var(--c-ink);
    font: 700 var(--fs-s)/1.2 var(--font-ui); box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--tint) 70%, var(--c-card));
  }
  .goal { display: grid; gap: 4px; padding: 12px 16px; }
  .goal small { font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); }
  .goal p { margin: 0; font: 700 var(--fs-body)/1.55 var(--font-ui); }
  .goal .short { font: 700 var(--fs-title)/1.3 var(--font-ui); }
  .more summary { cursor: pointer; width: fit-content; font: 700 var(--fs-s)/1.6 var(--font-ui); color: var(--text-soft); }
  .more p { font-weight: 600; font-size: var(--fs-s); color: var(--text-soft); }
  .stamps { display: flex; align-items: center; gap: 12px; padding: 10px 14px; }
  .slot { display: grid; justify-items: center; gap: 2px; min-width: 48px; }
  .slot i { font-style: normal; font-size: 26px; line-height: 1.1; color: var(--ctl-off); }
  .slot.on i { color: inherit; }
  .slot small { font: 700 var(--fs-xs)/1.2 var(--font-ui); color: var(--text-soft); }
  .sline { flex: 1; margin: 0; display: grid; gap: 2px; font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }
  .sline b { font-size: var(--fs-body); color: var(--coral-text); }
  .core { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
  .lesson, .extra {
    appearance: none; border: 0; cursor: pointer; width: 100%; display: flex; align-items: center; gap: 12px; text-align: left; font: inherit;
    border-radius: var(--r-card); background: var(--ctl); color: var(--text); box-shadow: var(--sh-ctl);
  }
  .lesson { min-height: 72px; padding: 10px 14px; }
  .lesson:active, .extra:active { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
  .lesson.next { background: var(--card); box-shadow: inset 0 0 0 3px var(--c-leaf-edge), 0 var(--lip-h) 0 var(--c-leaf-edge); }
  .no {
    flex: none; width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; font: 700 var(--fs-talk)/1 var(--font-num, var(--font-ui));
    background: var(--ctl-off); color: var(--text-soft);
  }
  .lesson.next .no { background: var(--c-yuzu); color: var(--c-ink); }
  .lesson.done .no { background: var(--c-leaf-edge); color: #fff; }
  .ltxt { flex: 1; min-width: 0; display: grid; gap: 2px; }
  .ltxt b { font: 700 var(--fs-talk)/1.2 var(--font-ui); }
  .ltxt small { font: 700 var(--fs-s)/1.35 var(--font-ui); color: var(--text-soft); }
  .play {
    flex: none; padding: 10px 16px; border-radius: var(--r-btn); background: var(--c-leaf); color: var(--c-ink);
    box-shadow: inset 0 0 0 2px var(--c-leaf-edge), 0 var(--lip-h) 0 var(--c-leaf-edge); font: 700 var(--fs-body)/1 var(--font-ui);
  }
  .ok { flex: none; font: 700 var(--fs-s)/1 var(--font-ui); color: var(--text-soft); }
  .extras { display: grid; gap: 6px; }
  .egrid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .extra { min-height: 60px; padding: 8px 12px; gap: 8px; }
  .extra .ltxt b { font-size: var(--fs-body); }
  .star { font: 700 20px/1 var(--font-ui); color: var(--text-soft); }
  .extra.done .star { color: var(--c-yuzu-lip); }
  .phr { appearance: none; border: 0; cursor: pointer; display: grid; gap: 8px; padding: 12px 14px; text-align: left; font: inherit; color: var(--text); width: 100%; }
  .phead { display: flex; align-items: baseline; gap: 8px; }
  .phead b { font: 700 var(--fs-body)/1.2 var(--font-ui); }
  .phead small { flex: 1; font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); }
  .chev { font: 700 20px/1 var(--font-ui); color: var(--text-soft); }
  .pchips { display: flex; flex-wrap: wrap; gap: 6px; }
  .pc {
    padding: 4px 10px; border-radius: var(--r-pill); font: 600 var(--fs-s)/1.3 'Fredoka', var(--font-ui);
    box-shadow: inset 0 0 0 1.5px var(--ctl-off); color: var(--text-soft);
  }
  .pc.caught { background: color-mix(in srgb, var(--c-leaf) 30%, var(--card)); box-shadow: inset 0 0 0 1.5px var(--leaf-text); color: var(--text); }
  .level-acts > .btn { flex: 1 1 100%; }
  .wait { margin: 0; padding: 24px 0; text-align: center; font: 700 var(--fs-body)/1.4 var(--font-ui); color: var(--text-soft); }
  @media (prefers-reduced-motion: reduce) { .lesson:active, .extra:active { transform: none; } }
</style>
