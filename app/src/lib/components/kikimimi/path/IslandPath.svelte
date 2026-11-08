<script module lang="ts">
  /** Where the path was scrolled when a stop's page, a lesson or the ずかん went over it: put back on the way back
   *  (else the path opens on the current stop, scrolled to smoothly). */
  let kept: number | null = null;
  /** And the stages opened or folded by hand then. */
  let keptToggles: Partial<Record<string, boolean>> = {};
</script>

<script lang="ts">
  // しまの みち (docs/kikimimi.md "しまの みち"; the UX review's sketch A): the stages as the spine, はまべ → ほし, each unit a
  // stop on it. A stop: the host villager (the domain's tint behind, its icon on a badge), the unit's name, the can-do's
  // one line (else the host and the domain), the lesson dots, my stamp (✓ on the face; two when both of us have it, with
  // 「ふたりで スタンプ！」 under the dots; the partner's alone a soft one). The current unit has the green edge and
  // 「つづける」 (its next lesson's intro card at once); a tap elsewhere opens the unit's page. One row of domain chips
  // filters: other domains collapse to a dot so the stage keeps its shape. はまべ is the quick quiz's (its first two
  // levels, no units); a stage with no units yet is mist; one far above my level (after みみ チェック: any above the
  // placed one) is shown softly and is still playable. Each stage folds under its head (its stamps k / n and a bar): the
  // current unit's stage is open (U7), the placed one says 「ここから」, every one a filter shows is open; on opening,
  // the current stop is scrolled to. A stage whose units I've all stamped one by one has its landmark on its head and,
  // the first time, a celebration in it (seen once per player on this phone: prefs.ts; cosmetic, no economy). A stamped
  // unit's 30-day おさらい チェック, when due, is a small banner on top. Its own chunk (a <Lazy> in the sheet).
  import { onMount } from 'svelte';
  import { LANDMARKS, type Filter, type Path, type Stop } from '#lib/kikimimi/path.ts';
  import { CORE, type Lesson, type Stage } from '#lib/kikimimi/stages.ts';
  import { domainIcon, domainTint } from '../look.ts';
  import type { RosterId } from '#lib/villagers/roster.ts';
  import Host from '../../characters/Host.svelte';
  import OfficialArt from '../../characters/OfficialArt.svelte';
  import LessonDots from './LessonDots.svelte';
  import { villagerArt } from '#lib/art.ts';
  import { rosterName } from '../scene/stage.ts';
  import { keepLandmarkSeen, landmarksSeen } from '../prefs.ts';
  import { week } from '#lib/store/week.svelte.ts';
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

  const me = $derived(week.view?.viewer ?? null);
  /** The landmarks whose celebration this player has seen on this phone (read at once: the opening scroll looks for a
   *  celebration). */
  // svelte-ignore state_referenced_locally
  let seen = $state<string[]>(me ? landmarksSeen(me) : []);
  $effect(() => {
    if (me) seen = landmarksSeen(me);
  });
  const party = $derived(me ? path.stages.filter((s) => s.cleared && !seen.includes(s.stage)).map((s) => s.stage) : []);
  function seenIt(stage: Stage) {
    if (me) keepLandmarkSeen(me, stage);
    seen = [...seen, stage];
  }
  /** A stage's head tapped: open or folded, over its default (the current unit's stage, the placed one, one a filter shows, a party). */
  let toggled = $state<Partial<Record<Stage, boolean>>>(kept !== null ? keptToggles : {});
  const isOpen = (st: Path['stages'][number]) =>
    toggled[st.stage] ?? (st.stage === path.open || st.stage === path.here || party.includes(st.stage) || (filter !== 'all' && st.stops.some((s) => !s.hidden)));
  const pct = (k: number, n: number) => `${Math.round((k / Math.max(1, n)) * 100)}%`;

  let root: HTMLDivElement;
  const scroller = (el: HTMLElement): HTMLElement | null => {
    for (let p = el.parentElement; p; p = p.parentElement) if (/(auto|scroll)/.test(getComputedStyle(p).overflowY)) return p;
    return null;
  };
  /** Away to a page, a lesson or the ずかん: where the path is scrolled is kept for the way back. */
  const away = <A extends unknown[]>(f: (...a: A) => void) => (...a: A) => {
    kept = scroller(root)?.scrollTop ?? 0;
    keptToggles = { ...toggled };
    f(...a);
  };
  // On opening: back where it was (a celebration waiting goes first), else the current stop (or 「ここから」) brought
  // into view, smoothly (at once under reduced motion); one near the top already isn't moved.
  onMount(() => {
    const sc = scroller(root), back = kept;
    kept = null;
    if (!sc) return;
    const party = root.querySelector<HTMLElement>('[data-kiki-landmark-party]');
    if (back !== null && !party) return void (sc.scrollTop = back);
    const to = party ?? root.querySelector<HTMLElement>('[data-current]') ?? root.querySelector<HTMLElement>('[data-kiki-here]');
    if (!to) return;
    const top = to.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - sc.clientHeight * 0.28;
    if (top > 0) sc.scrollTo({ top, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
</script>

<div class="path" data-kiki-page="path" bind:this={root}>
  <div class="hello">
    <span class="host" aria-hidden="true"><Host head size={48} animate={false} eager /></span>
    <p class="kana">{t('kiki.path.hello')}</p>
  </div>

  {#each due as id (id)}
    <div class="recheck" data-kiki-recheck-due={id}>
      <span class="rtxt"><b>{t('kiki.lesson.recheck')}</b><small>{t('kiki.path.recheck', { name: nameOf(id) })}</small></span>
      <button type="button" class="btn small" data-kiki-recheck-play data-sfx="confirm" onclick={away(() => onlesson(id, 'check', true))}>{t('kiki.path.play')}</button>
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
    {@const open = isOpen(st)}
    {@const units = st.stops.length > 0}
    <section class="stage" class:soft={st.soft && units} data-kiki-stage={st.stage} data-soft={st.soft || undefined} data-open={open || undefined}
      aria-labelledby="kk-st-{st.stage}">
      {#snippet head()}
        <span class="sname">{t(`kiki.stage.${st.stage}`)}</span>
        <span class="stars" role="img" aria-label={t('kiki.path.stars', { n: st.stars })}>{'★'.repeat(st.stars)}</span>
        {#if path.here === st.stage}<span class="here" data-kiki-here>{t('kiki.path.here')}</span>{/if}
        {#if st.cleared}<span class="lm" role="img" aria-label={t(`kiki.landmark.${st.stage}`)} data-kiki-landmark={st.stage}>{LANDMARKS[st.stage]}</span>{/if}
        {#if units}
          <span class="count" data-kiki-stage-count={st.stamped}>
            <span class="bar" aria-hidden="true"><i style:width={pct(st.stamped, st.stops.length)}></i></span>✓ {st.stamped} / {st.stops.length}
          </span>
        {/if}
      {/snippet}
      <h3 class="sthead" id="kk-st-{st.stage}">
        {#if units || st.stage === 'hama'}
          <button type="button" class="sttog" aria-expanded={open} aria-controls="kk-sb-{st.stage}" data-kiki-stage-toggle={st.stage} data-sfx="tick"
            onclick={() => (toggled = { ...toggled, [st.stage]: !open })}>
            {@render head()}<span class="fold" class:up={open} aria-hidden="true">›</span>
          </button>
        {:else}<span class="sttog">{@render head()}</span>{/if}
      </h3>
      {#if !units && st.stage !== 'hama'}
        <p class="mist">{t('kiki.path.mist')}</p>
      {:else if open}
        <div class="sbody" id="kk-sb-{st.stage}">
          {#if party.includes(st.stage)}
            <div class="party" data-kiki-landmark-party={st.stage} role="status">
              <span class="lmbig" aria-hidden="true">{LANDMARKS[st.stage]}</span>
              <b>{t('kiki.landmark.clear', { stage: t(`kiki.stage.${st.stage}`) })}</b>
              <span class="built">{t('kiki.landmark.built', { name: t(`kiki.landmark.${st.stage}`) })}</span>
              <small>{t('kiki.landmark.how', { n: st.stops.length })}</small>
              <button type="button" class="btn small" data-kiki-landmark-ok data-sfx="confirm" onclick={() => seenIt(st.stage)}>{t('kiki.landmark.ok')}</button>
            </div>
          {/if}
          {#if st.stage === 'hama'}
            <button type="button" class="node quick r tile-btn" data-kiki-path-quiz data-sfx="open" onclick={away(onquiz)}>
              <span class="face" style:--tint="var(--c-yuzu)" aria-hidden="true"><Host head size={40} animate={false} /></span>
              <span class="ntxt"><b>{t('kiki.path.hama')}</b><small>{t('kiki.path.hamaSub')}</small></span>
              <span class="chev" aria-hidden="true">›</span>
            </button>
          {/if}
          {#if st.soft && units}<p class="softnote"><span aria-hidden="true">🌫️ </span>{t('kiki.path.soft')}</p>{/if}
          {#each st.stops as s, i (s.id)}
            {#if s.anchor && (i === 0 || !st.stops[i - 1].anchor) && !s.hidden}<p class="sec-label anchor">{t('kiki.path.anchor')}</p>{/if}
            {#if s.hidden}
              <span class="gone" class:l={i % 2 === 0} class:r={i % 2 === 1} aria-hidden="true" data-kiki-stop-hidden={s.id}></span>
            {:else}
              <div class="node" class:cur={s.current} class:l={i % 2 === 0} class:r={i % 2 === 1} data-kiki-stop={s.id} data-current={s.current || undefined}
                data-stamped={s.state?.stamped ? '1' : undefined} data-double={s.state?.double ? '1' : undefined} data-partner={s.state?.partner ? '1' : undefined}>
                <button type="button" class="hit" aria-label={label(s)} data-kiki-stop-open data-sfx="open" onclick={away(() => onunit(s.id))}>
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
                    {#if s.state?.double}<small class="both" data-kiki-stop-double>{t('kiki.stamp.double')}</small>{/if}
                  </span>
                  {#if !s.current}<span class="chev" aria-hidden="true">›</span>{/if}
                </button>
                {#if s.current}
                  <button type="button" class="btn small go" data-kiki-continue data-sfx="confirm" onclick={away(() => onlesson(s.id, s.next))}>{t('kiki.path.continue')}</button>
                {/if}
              </div>
            {/if}
          {/each}
        </div>
      {/if}
    </section>
  {/each}

  <button type="button" class="zk tile-btn" data-kiki-zukan-open data-sfx="open" onclick={away(onzukan)}>
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
  .sbody { display: grid; gap: 8px; }
  /* a stage's head: its name, ★, 「ここから」, the landmark, the stamps' bar and k / n; a tap folds or opens it */
  .sthead { margin: 6px 0 0; font: 700 var(--fs-talk)/1.2 var(--font-ui); }
  .sttog {
    appearance: none; border: 0; background: none; color: inherit; font: inherit; width: 100%; min-height: var(--hit);
    display: flex; align-items: center; gap: 8px; padding: 4px 4px; text-align: left; border-radius: 12px;
  }
  button.sttog { cursor: pointer; }
  button.sttog:active { background: color-mix(in srgb, var(--lip) 25%, transparent); }
  .stars { color: var(--coral-text); font-size: var(--fs-s); letter-spacing: 1px; }
  .here {
    padding: 3px 9px; border-radius: var(--r-pill); background: var(--c-yuzu); color: var(--c-ink); font: 700 var(--fs-s)/1.2 var(--font-ui);
    box-shadow: 0 2px 0 var(--c-yuzu-lip); rotate: -3deg; white-space: nowrap;
  }
  .lm {
    width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; font-size: 17px; line-height: 1;
    background: color-mix(in srgb, var(--c-yuzu) 45%, var(--card)); box-shadow: inset 0 0 0 2px var(--c-yuzu-lip);
  }
  .count { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; font: 700 var(--fs-s)/1 var(--font-num); color: var(--leaf-text); white-space: nowrap; }
  .bar { width: 44px; height: 6px; border-radius: 3px; background: var(--ctl-off); overflow: hidden; }
  .bar i { display: block; height: 100%; border-radius: 3px; background: var(--c-leaf-edge); }
  .fold { flex: none; width: 18px; text-align: center; font: 700 18px/1 var(--font-ui); color: var(--text-soft); rotate: 90deg; transition: rotate 160ms var(--ease-out, ease); }
  .fold.up { rotate: -90deg; }
  .sttog:not(:has(.count)) .fold { margin-left: auto; }
  .anchor { margin: 0 4px -2px; }
  .softnote { margin: -2px 4px 0; font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }
  /* the landmark's celebration: once, in its stage */
  .party {
    position: relative; display: grid; justify-items: center; gap: 4px; padding: 16px 14px 14px; border-radius: var(--r-card); text-align: center;
    background: radial-gradient(circle at 50% 30%, color-mix(in srgb, var(--c-yuzu) 55%, var(--card)), color-mix(in srgb, var(--c-yuzu) 18%, var(--card)) 70%);
    box-shadow: var(--sh-lip), inset 0 0 0 2px var(--c-yuzu-lip);
  }
  .party::before, .party::after { content: '✦'; position: absolute; top: 14px; font-size: 18px; color: var(--c-coral); animation: twinkle 1.6s ease-in-out infinite; }
  .party::before { left: 22%; }
  .party::after { right: 22%; animation-delay: .5s; }
  .lmbig { font-size: 52px; line-height: 1.1; animation: rise 640ms var(--ease-bounce) both; }
  .party b { font: 700 var(--fs-title)/1.25 var(--font-ui); color: var(--coral-text); }
  .built { font: 700 var(--fs-body)/1.35 var(--font-ui); }
  .party small { font: 700 var(--fs-s)/1.35 var(--font-ui); color: var(--text-soft); }
  .party .btn { margin-top: 6px; min-width: 140px; }
  @keyframes rise { from { transform: translateY(14px) scale(.4); opacity: 0; } 60% { opacity: 1; } to { transform: none; } }
  @keyframes twinkle { 0%, 100% { opacity: .25; scale: .8; } 50% { opacity: 1; scale: 1.15; } }
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
  /* the stamp: a leaf ✓ tilted on the face; both of us: two, fanned (the second yuzu, beside it); only the partner: a soft outline */
  .stamp {
    position: absolute; right: -6px; bottom: -6px; width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center;
    background: var(--c-leaf-edge); color: var(--c-card); font: 700 13px/1 var(--font-ui); box-shadow: 0 0 0 2px var(--card); rotate: -12deg;
  }
  .stamp.two { right: 12px; bottom: -9px; background: var(--c-yuzu-lip); color: var(--c-ink); rotate: 12deg; }
  .stamp.theirs { background: var(--card); color: var(--leaf-text); box-shadow: inset 0 0 0 2px var(--leaf-text), 0 0 0 2px var(--card); }
  .ntxt { flex: 1; min-width: 0; display: grid; gap: 4px; }
  .ntxt b { font: 700 var(--fs-body)/1.3 var(--font-ui); }
  .ntxt small { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .ntxt small.both { color: var(--coral-text); }
  .chev { flex: none; font: 700 20px/1 var(--font-ui); color: var(--text-soft); padding-right: 2px; }
  .gone { justify-self: center; width: 10px; height: 10px; margin: 2px 0; border-radius: 50%; background: var(--ctl-off); }
  .mist {
    margin: 0; text-align: center; padding: 16px 12px; border-radius: var(--r-card); color: var(--text-soft); font: 700 var(--fs-s)/1.45 var(--font-ui);
    background: repeating-linear-gradient(-45deg, color-mix(in srgb, var(--lip) 40%, transparent) 0 10px, transparent 10px 20px);
  }
  /* a stage far above my level: behind a light mist (the stripes) and the note's 🌫️, at full contrast, still tappable */
  .soft { padding: 0 6px 8px; margin: 0 -6px; border-radius: var(--r-card); background: repeating-linear-gradient(-45deg, color-mix(in srgb, var(--lip) 22%, transparent) 0 10px, transparent 10px 20px); }
  .soft:not([data-open]) { padding-bottom: 0; }
  .zk { margin-top: 6px; display: flex; align-items: center; gap: 10px; min-height: 56px; padding: 0 16px; border-radius: var(--r-card); font: 700 var(--fs-body)/1.2 var(--font-ui); }
  .zk b { flex: 1; text-align: left; }
  /* a stop's press: the whole stop sinks (its button is the stop's face and words), as a .tile-btn does */
  @media (prefers-reduced-motion: reduce) {
    .node:has(.hit:active) { transform: none; }
    .lmbig, .party::before, .party::after { animation: none; }
    .fold { transition: none; }
  }
</style>
