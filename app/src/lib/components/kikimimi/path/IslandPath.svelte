<script lang="ts">
  // しまの みち (docs/kikimimi-ux.md §6.3; the UX review's sketch A): the stages as the spine, はまべ → ほし, each unit a
  // stop on it. A stop: the host villager (the domain's tint behind, its icon on a badge), the unit's name, the can-do's
  // one line (else the host and the domain), the lesson dots, my stamp (✓ on the face; two when both of us have it, the
  // partner's alone as a soft one). The current unit has the green edge and 「つづける」 (its next lesson's intro card at
  // once); a tap elsewhere opens the unit's page. One row of domain chips filters: other domains collapse to a dot so the stage keeps its shape. はまべ is the quick quiz's
  // (its first two levels, no units); a stage with no units yet is mist; one far above my level is shown softly and is
  // still playable. A stamped unit's 30-day おさらい チェック, when due, is a small banner on top (hub card 1's, until
  // the hub). Its own chunk (`{#await import()}` in the sheet).
  import type { Filter, Path, Stop } from '#lib/kikimimi/path.ts';
  import { CORE } from '#lib/kikimimi/stages.ts';
  import { domainIcon, domainTint } from '../look.ts';
  import type { Lesson } from '#lib/kikimimi/stages.ts';
  import type { RosterId } from '#lib/villagers/roster.ts';
  import Host from '../../characters/Host.svelte';
  import OfficialArt from '../../characters/OfficialArt.svelte';
  import LessonDots from './LessonDots.svelte';
  import { villagerArt } from '#lib/art.ts';
  import { rosterName } from '../scene/stage.ts';
  import { t } from '#lib/i18n/index.ts';

  let { path, filter = $bindable('all'), due = [], onunit, onlesson, onquiz, onzukan }: {
    path: Path;
    filter?: Filter;
    /** Units whose 30-day recheck is due (stamps.ts rechecksDue). */
    due?: readonly string[];
    onunit: (id: string) => void;
    onlesson: (id: string, lesson: Lesson, recheck?: boolean) => void;
    /** はまべ's stop: the quick quiz at that level. */
    onquiz: () => void;
    onzukan: () => void;
  } = $props();

  const stops = $derived(path.stages.flatMap((s) => s.stops));
  const nameOf = (id: string) => stops.find((s) => s.id === id)?.name ?? id;
  const tint = (s: Stop) => domainTint(s.domain);
  const icon = domainIcon;
  const host = (s: Stop) => rosterName(s.host as RosterId);
  const label = (s: Stop) =>
    [s.name, s.short, t(`kiki.domain.${s.domain}`), t('kiki.path.dots', { k: (s.state?.done ?? []).filter((l) => CORE.includes(l)).length }),
      s.state?.double ? t('kiki.stamp.double') : s.state?.stamped ? t('kiki.path.stamped') : s.state?.partner ? t('kiki.stamp.partnerHas') : ''].filter(Boolean).join('、');
</script>

<div class="path" data-kiki-page="path">
  <div class="hello">
    <span class="host" aria-hidden="true"><Host head size={48} animate={false} eager /></span>
    <p>{t('kiki.path.hello')}</p>
  </div>

  {#each due as id (id)}
    <div class="recheck" data-kiki-recheck-due={id}>
      <span class="rtxt"><b>{t('kiki.lesson.recheck')}</b><small>{t('kiki.path.recheck', { name: nameOf(id) })}</small></span>
      <button type="button" class="btn small" data-kiki-recheck-play data-sfx="confirm" onclick={() => onlesson(id, 'check', true)}>{t('kiki.path.play')}</button>
    </div>
  {/each}

  {#if path.chips.length > 1}
    <div class="dchips" role="group" aria-label={t('kiki.path.filter')} data-kiki-chips>
      {#each ['all', ...path.chips] as const as d (d)}
        <button type="button" class="chip dchip" aria-pressed={filter === d} data-kiki-chip={d} data-sfx="tick" onclick={() => (filter = d)}>
          {#if d !== 'all'}<span aria-hidden="true">{icon(d)}</span>{/if}{t(`kiki.domain.${d}`)}
        </button>
      {/each}
    </div>
  {/if}

  {#each path.stages as st (st.stage)}
    <section class="stage" class:soft={st.soft && st.stops.length > 0} data-kiki-stage={st.stage} data-soft={st.soft || undefined} aria-labelledby="kk-st-{st.stage}">
      <h3 class="sthead" id="kk-st-{st.stage}">
        <span class="sname">{t(`kiki.stage.${st.stage}`)}</span>
        <span class="stars" role="img" aria-label={t('kiki.path.stars', { n: st.stars })}>{'★'.repeat(st.stars)}</span>
        {#if st.stops.length}<span class="count" data-kiki-stage-count={st.stamped}>✓ {st.stamped} / {st.stops.length}</span>{/if}
      </h3>
      {#if st.stage === 'hama'}
        <button type="button" class="node quick r tile-btn" data-kiki-path-quiz data-sfx="open" onclick={onquiz}>
          <span class="face" style:--tint="var(--c-yuzu)" aria-hidden="true"><Host head size={40} animate={false} /></span>
          <span class="ntxt"><b>{t('kiki.path.hama')}</b><small>{t('kiki.path.hamaSub')}</small></span>
          <span class="chev" aria-hidden="true">›</span>
        </button>
      {:else if !st.stops.length}
        <p class="mist">{t('kiki.path.mist')}</p>
      {:else}
        {#if st.soft}<p class="softnote">{t('kiki.path.soft')}</p>{/if}
        {#each st.stops as s, i (s.id)}
          {#if s.anchor && (i === 0 || !st.stops[i - 1].anchor) && !s.hidden}<p class="sec-label anchor">{t('kiki.path.anchor')}</p>{/if}
          {#if s.hidden}
            <span class="gone" class:l={i % 2 === 0} class:r={i % 2 === 1} aria-hidden="true" data-kiki-stop-hidden={s.id}></span>
          {:else}
            <div class="node" class:cur={s.current} class:l={i % 2 === 0} class:r={i % 2 === 1} data-kiki-stop={s.id} data-current={s.current || undefined}
              data-stamped={s.state?.stamped ? '1' : undefined} data-double={s.state?.double ? '1' : undefined} data-partner={s.state?.partner ? '1' : undefined}>
              <button type="button" class="hit" aria-label={label(s)} data-kiki-stop-open data-sfx="open" onclick={() => onunit(s.id)}>
                <span class="face" style:--tint={tint(s)} aria-hidden="true">
                  <OfficialArt key={villagerArt(s.host, true)} alt="" size={46} eager />
                  <span class="dbadge">{icon(s.domain)}</span>
                  {#if s.state?.double}<span class="stamp two">✓</span><span class="stamp">✓</span>
                  {:else if s.state?.stamped}<span class="stamp">✓</span>
                  {:else if s.state?.partner}<span class="stamp theirs">✓</span>{/if}
                </span>
                <span class="ntxt">
                  <b>{s.name}</b>
                  {#if s.short}<small data-kiki-stop-short>{s.short}</small>
                  {:else}<small>{host(s)} · {t(`kiki.domain.${s.domain}`)}</small>{/if}
                  <LessonDots lessons={s.lessons} done={s.state?.done ?? []} next={s.current ? s.next : null} />
                </span>
                {#if !s.current}<span class="chev" aria-hidden="true">›</span>{/if}
              </button>
              {#if s.current}
                <button type="button" class="btn small go" data-kiki-continue data-sfx="confirm" onclick={() => onlesson(s.id, s.next)}>{t('kiki.path.continue')}</button>
              {/if}
            </div>
          {/if}
        {/each}
      {/if}
    </section>
  {/each}

  <button type="button" class="zk tile-btn" data-kiki-zukan-open data-sfx="open" onclick={onzukan}>
    <span aria-hidden="true">📖</span><b>{t('kiki.zukan.title')}</b><span class="chev" aria-hidden="true">›</span>
  </button>
</div>

<style>
  .path { display: grid; gap: 10px; }
  .hello { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: var(--r-card); background: var(--card); box-shadow: var(--sh-lip); }
  .hello p { margin: 0; font: 700 var(--fs-body)/1.4 var(--font-ui); }
  .host { flex: none; line-height: 0; }
  .recheck {
    display: flex; align-items: center; gap: 10px; padding: 10px 12px 10px 14px; border-radius: var(--r-card);
    background: color-mix(in srgb, var(--c-yuzu) 30%, var(--card)); box-shadow: var(--sh-lip);
  }
  .rtxt { flex: 1; min-width: 0; display: grid; gap: 2px; }
  .rtxt b { font: 700 var(--fs-body)/1.2 var(--font-ui); }
  .rtxt small { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  /* the chips: one row, scrolling sideways (ぜんぶ first) */
  .dchips { display: flex; flex-wrap: nowrap; gap: 6px; overflow-x: auto; margin: 0 -8px; padding: 2px 8px 8px; scrollbar-width: none; }
  .dchips::-webkit-scrollbar { display: none; }
  .dchip { flex: none; min-height: var(--hit); white-space: nowrap; display: inline-flex; align-items: center; gap: 4px; }
  .stage { display: grid; gap: 8px; }
  .sthead { display: flex; align-items: baseline; gap: 8px; margin: 10px 4px 0; font: 700 var(--fs-talk)/1.2 var(--font-ui); }
  .stars { color: var(--c-coral); font-size: var(--fs-s); letter-spacing: 1px; }
  .count { margin-left: auto; font: 700 var(--fs-s)/1 var(--font-num); color: var(--leaf-text); }
  .anchor { margin: 0 4px -2px; }
  .softnote { margin: -2px 4px 0; font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }
  /* a stop: the zig-zag of the prototype (46px of the other side left free) */
  .node {
    position: relative; display: flex; align-items: center; gap: 8px; border-radius: 20px; background: var(--ctl); box-shadow: var(--sh-ctl); min-height: 72px;
  }
  .node.l { margin-right: 40px; }
  .node.r { margin-left: 40px; }
  .node:has(.hit:active) { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
  .hit, .node.quick { text-align: left; flex: 1; min-width: 0; display: flex; align-items: center; gap: 12px; padding: 10px 12px; min-height: 72px; border-radius: 20px; }
  .hit { appearance: none; border: 0; background: none; color: inherit; font: inherit; cursor: pointer; }
  .node.cur { background: var(--card); box-shadow: inset 0 0 0 3px var(--c-leaf-edge), 0 var(--lip-h) 0 var(--c-leaf-edge); }
  .node.cur .go { margin-right: 12px; flex: none; }
  .face {
    position: relative; flex: none; width: 50px; height: 50px; border-radius: 50%; display: grid; place-items: center; line-height: 0;
    background: color-mix(in srgb, var(--tint) 38%, var(--card));
  }
  .face :global(img) { border-radius: 50%; }
  .dbadge {
    position: absolute; left: -6px; top: -6px; width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center;
    background: var(--card); box-shadow: 0 0 0 2px color-mix(in srgb, var(--tint) 70%, var(--card)); font-size: 13px; line-height: 1;
  }
  /* the stamp: a leaf ✓ tilted on the face; both of us: two, fanned; only the partner: a soft outline */
  .stamp {
    position: absolute; right: -6px; bottom: -6px; width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center;
    background: var(--c-leaf-edge); color: var(--c-card); font: 700 13px/1 var(--font-ui); box-shadow: 0 0 0 2px var(--card); rotate: -12deg;
  }
  .stamp.two { right: 8px; bottom: -8px; background: var(--c-yuzu-lip); color: var(--c-ink); rotate: 10deg; }
  .stamp.theirs { background: var(--card); color: var(--leaf-text); box-shadow: inset 0 0 0 2px var(--leaf-text), 0 0 0 2px var(--card); }
  .ntxt { flex: 1; min-width: 0; display: grid; gap: 4px; }
  .ntxt b { font: 700 var(--fs-body)/1.3 var(--font-ui); }
  .ntxt small { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .chev { flex: none; font: 700 20px/1 var(--font-ui); color: var(--text-soft); padding-right: 2px; }
  .gone { justify-self: center; width: 10px; height: 10px; margin: 2px 0; border-radius: 50%; background: var(--ctl-off); }
  .mist, .soft .sthead + .softnote { margin: 0; }
  .mist {
    text-align: center; padding: 16px 12px; border-radius: var(--r-card); color: var(--text-soft); font: 700 var(--fs-s)/1.45 var(--font-ui);
    background: repeating-linear-gradient(-45deg, color-mix(in srgb, var(--lip) 40%, transparent) 0 10px, transparent 10px 20px);
  }
  /* a stage far above my level: softly, behind a light mist, still tappable */
  .soft .node { opacity: .82; }
  .soft { padding: 0 6px 8px; margin: 0 -6px; border-radius: var(--r-card); background: repeating-linear-gradient(-45deg, color-mix(in srgb, var(--lip) 22%, transparent) 0 10px, transparent 10px 20px); }
  .zk { margin-top: 6px; display: flex; align-items: center; gap: 10px; min-height: 56px; padding: 0 16px; border-radius: var(--r-card); font: 700 var(--fs-body)/1.2 var(--font-ui); }
  .zk b { flex: 1; text-align: left; }
  /* a stop's press: the whole stop sinks (its button is the stop's face and words), as a .tile-btn does */
  @media (prefers-reduced-motion: reduce) { .node:has(.hit:active) { transform: none; } }
</style>
