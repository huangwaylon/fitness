<script lang="ts">
  // ききみみ's units on the lobby, a test entry before しまの みち (docs/curriculum-units.md §8 U2-U3; the real path is the
  // UX's next step): behind the dev hook `?units` (a dev build or `?demo`). Each unit this phone has (pool.ts unitIds:
  // the build's and a fixture put in): its name, the three core lessons' dots and the two extras' ☆, my stamp (🏅, with
  // my own tally beside it), the partner's, the double stamp when both have it, the phrases caught (once its chunk is
  // in), the 30-day おさらい チェック when it's due; a lesson's button starts it (its intro card first).
  import { INDEX, load, unitIds, unitPart, type Unit } from '#lib/kikimimi/pool.ts';
  import { LESSONS, type Lesson } from '#lib/kikimimi/stages.ts';
  import type { UnitChunk } from '#lib/kikimimi/lesson.ts';
  import { phrasesOf } from '#lib/kikimimi/srs.ts';
  import { answersOf } from '#lib/kikimimi/progress.ts';
  import { rechecksDue } from '#lib/kikimimi/stamps.ts';
  import { currentReport, currentUnits } from './progress.svelte.ts';
  import { t } from '#lib/i18n/index.ts';

  let { bump = 0, onlesson }: { bump?: number; onlesson: (unit: string, lesson: Lesson, recheck: boolean) => void } = $props();

  /** The units listed, and their chunks once in (the names, the lessons, the phrases). */
  let ready = $state(0);
  const ids = $derived((void bump, unitIds()));
  $effect(() => {
    const want = ids;
    void load(...(want as Unit[])).then(() => ready++, () => {});
  });
  const units = $derived(currentUnits());
  const report = $derived(currentReport());
  const due = $derived(report ? new Set(rechecksDue(units, report.today)) : new Set<string>());
  const rows = $derived.by(() => {
    void ready;
    return ids.map((id) => {
      const part = unitPart(id) as UnitChunk | undefined;
      const path = INDEX.paths.find((p) => p[0] === id);
      const caught = part && report ? [...phrasesOf(part.unit.ph, answersOf(report.games)).values()].filter((p) => p.caught).length : null;
      return {
        id, name: part?.unit.name ?? path?.[1] ?? id, lessons: LESSONS.filter((l) => (part ? !!part.unit.lessons[l] : !!((path?.[6] ?? 0) & (1 << LESSONS.indexOf(l))))),
        state: units.get(id), caught, phrases: part?.unit.ph.length ?? 0
      };
    });
  });
  const CORE: readonly Lesson[] = ['deai', 'bamen', 'check'];
</script>

<section class="units" data-kiki-units>
  <h3 class="sec-label">{t('kiki.units.title')}</h3>
  {#each rows as u (u.id)}
    {@const s = u.state}
    <div class="unit card" data-kiki-unit={u.id} data-stamped={s?.stamped ? '1' : undefined} data-double={s?.double ? '1' : undefined} data-partner={s?.partner ? '1' : undefined}>
      <div class="head">
        <b class="name">{u.name}</b>
        <span class="dots" aria-hidden="true">
          {#each u.lessons as l (l)}<i class:core={CORE.includes(l)} class:done={s?.done.includes(l)} data-dot={l}>{CORE.includes(l) ? (s?.done.includes(l) ? '●' : '○') : s?.done.includes(l) ? '★' : '☆'}</i>{/each}
        </span>
        {#if s?.double}<span class="stamp double" data-kiki-double>🏅🏅 {t('kiki.stamp.double')}</span>
        {:else if s?.stamped}<span class="stamp" data-kiki-stamp>🏅</span>
        {:else if s?.partner}<span class="stamp partner" data-kiki-partner-stamp>{t('kiki.stamp.partnerHas')}</span>{/if}
      </div>
      <p class="meta">
        {#if s?.tally}<span data-kiki-tally-mine={s.tally.first}>{t('kiki.stamp.mine', { k: s.tally.first, n: s.tally.of })}</span>{#if s.tally.tm !== undefined} · <span>{t('kiki.stamp.team', { k: s.tally.tm })}</span>{/if}{/if}
        {#if u.caught !== null && u.phrases} · <span data-kiki-caught={u.caught}>{t('kiki.units.caught', { k: u.caught, n: u.phrases })}</span>{/if}
      </p>
      <div class="acts">
        {#each u.lessons as l (l)}
          <button type="button" class="btn small paper" data-kiki-lesson={l} data-sfx="confirm" onclick={() => onlesson(u.id, l, false)}>{t(`kiki.lesson.${l}`)}</button>
        {/each}
        {#if due.has(u.id)}<button type="button" class="btn small" data-kiki-recheck data-sfx="confirm" onclick={() => onlesson(u.id, 'check', true)}>{t('kiki.lesson.recheck')}</button>{/if}
      </div>
    </div>
  {:else}
    <p class="hint">{t('kiki.units.none')}</p>
  {/each}
</section>

<style>
  .units { display: grid; gap: 8px; }
  .card { border-radius: var(--r-card); background: var(--card); box-shadow: var(--sh-lip); }
  .unit { display: grid; gap: 6px; padding: 12px 14px; }
  .head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .name { font: 700 var(--fs-body)/1.3 var(--font-ui); }
  .dots { display: flex; gap: 2px; color: var(--text-soft); font-size: var(--fs-s); }
  .dots i { font-style: normal; }
  .dots i.done { color: var(--c-leaf-edge, var(--text)); }
  .stamp { margin-left: auto; font: 700 var(--fs-s)/1 var(--font-ui); }
  .meta { margin: 0; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .meta:empty { display: none; }
  .acts { display: flex; flex-wrap: wrap; gap: 6px; }
  .hint { margin: 0 4px; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
</style>
