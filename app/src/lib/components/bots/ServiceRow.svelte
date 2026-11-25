<script lang="ts" module>
  import type { BotVerdict, Fact } from '#lib/bots/types.ts';
  import type { CardStrip } from '#lib/strip.ts';
  /** A status as the row shows it (null: none read or kept yet). */
  export interface ServiceView { verdict: BotVerdict; vid: string; strip: CardStrip | null; lines: readonly string[]; facts: readonly Fact[] }
</script>

<script lang="ts">
  // A bot's status in Jobs (JobsPage's Services, docs/bots.md "Jobs"; English, as the page): ジム's or 保養所's status
  // card as a JobRow-like row. One button: the dot (the tab's verdict, dimmed while stale or failed), the bot's name,
  // the as-of at the right (Updating while the kept copy waits for a read), the word under the name, then the recent
  // checks' strip (a picture, gone once unfolded: the detail has the slider). What a person must do beside the word.
  // A tap unfolds the detail: the sentence, the strip (ScanStrip: counts, Next), the other reasons, the facts and a
  // button to the bot's tab. The
  // view's words come in English (JobsPage). `id`: the data-* prefix too (data-gym-verdict, data-its-strip, …).
  import { shown } from '#lib/bots/types.ts';
  import { scoped } from '#lib/i18n/index.ts';
  import { timeOf } from '#lib/i18n/when.ts';
  import Phrases from '../ui/Phrases.svelte';
  import StatusDot from './StatusDot.svelte';
  import ScanStrip from './ScanStrip.svelte';

  interface Props {
    id: 'gym' | 'its';
    view: ServiceView | null;
    stale: boolean;
    failed: string | null;
    readAt: number | null;
    now: number;
    open: boolean;
    ontoggle: () => void;
    onopen: (tab: 'gym' | 'its') => void;
  }
  let { id, view, stale, failed, readAt, now, open, ontoggle, onopen }: Props = $props();

  // (JobsPage pins English)
  const { t, at } = scoped();
  const v = $derived(view?.verdict ?? null);
  const dot = $derived(v ? shown(v) : { tone: 'unknown' as const, look: false, w: 'unknown' as const });
  const word = $derived(v && dot.w !== 'needsYou' ? v.word : t(`bots.w.${dot.w}`));
  const act = $derived(v?.needsLook && v.act ? v.act : null);
  const asOf = $derived(stale ? t('bots.updating') : readAt !== null ? t('bots.asOf', { time: at(() => timeOf(readAt, now)) }) : null);
  const name = $derived(t(`jobs.svc.${id}`));
  const label = $derived([name, word, asOf ?? ''].filter(Boolean).join(', '));
  const data = $derived(view ? { [`data-${id}-verdict`]: view.vid } : {});
</script>

<li class="job svc" class:open data-jobs-svc={id} data-jobs-tone={dot.tone} {...data}>
  <button type="button" class="head" aria-expanded={open} aria-controls="jobs-d-svc-{id}" aria-label={label} data-sfx="tick" onclick={ontoggle}>
    <span class="l1">
      <StatusDot tone={dot.tone} look={dot.look} stale={!!v && (stale || !!failed)} size={10} />
      <b class="name">{name}</b>
      {#if asOf}<span class="age" class:busy={stale} data-jobs-svc-asof>{asOf}</span>{/if}
      <span class="chev" aria-hidden="true"></span>
    </span>
    <span class="l2"><span class="why {dot.tone}" data-bots-word>{word}</span>{#if act}<span class="act" data-bots-act>{act}</span>{/if}</span>
    {#if !open && view?.strip?.cells.some((c) => c.state !== 'none')}
      <span class="strip" aria-hidden="true">{#each view.strip.cells as c (c.start)}<i class="cell {c.state}"></i>{/each}</span>
    {/if}
  </button>
  {#if open}
    <div class="detail" id="jobs-d-svc-{id}" data-jobs-detail="svc-{id}">
      {#if failed}<p class="bad" data-jobs-svc-error><Phrases text={t('bots.loadFailed', { code: failed === 'offline' ? t('bots.offline') : failed === 'timeout' ? t('bots.timeout') : failed })} /></p>{/if}
      {#if v?.sentence}<p class="say" data-bots-say><Phrases text={v.sentence} /></p>{/if}
      {#if view?.strip}<div class="scan"><ScanStrip strip={view.strip} page={id} /></div>{/if}
      {#if view?.lines.length}<ul class="lines">{#each view.lines as l (l)}<li {...{ [`data-${id}-reason`]: '' }}><Phrases text={l} /></li>{/each}</ul>{/if}
      {#if view?.facts.length}
        <dl class="kv">
          {#each view.facts as f (f.id)}<div {...{ [`data-${id}-fact`]: f.id }}><dt>{f.label}</dt><dd>{#if f.href}<a href={f.href} target="_blank" rel="noopener noreferrer" data-sfx="open">{f.value}</a>{:else}{f.value}{/if}</dd></div>{/each}
        </dl>
      {/if}
      <button type="button" class="btn small paper" data-sfx="tick" data-jobs-svc-open onclick={() => onopen(id)}>{t(`jobs.d.${id}`)}</button>
    </div>
  {/if}
</li>

<style>
  /* JobRow's row, the bot's status in it */
  .job + :global(.job), :global(.job) + .job { border-top: 1.5px dashed var(--stitch); }
  .head {
    appearance: none; display: grid; gap: 4px; width: 100%; min-height: var(--hit); margin: 0; padding: 10px 12px;
    border: 0; background: none; color: var(--text); font: inherit; text-align: left; cursor: pointer;
  }
  .head:focus-visible { outline: 3px solid var(--focus); outline-offset: -3px; border-radius: var(--r-card); }
  .l1 { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .name { flex: 1; min-width: 0; font: 700 var(--fs-body)/1.3 var(--font-ui); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .age { flex: none; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); font-variant-numeric: tabular-nums; white-space: nowrap; }
  .age.busy { padding: 0 7px; border-radius: var(--r-pill); background: var(--ctl-off); }
  .l1 .chev { margin-right: 0; }
  .open .l1 .chev { rotate: 225deg; margin-top: 4px; }
  .l2 { display: flex; flex-wrap: wrap; gap: 0 10px; padding-left: 18px; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .why.good { color: var(--leaf-text); }
  .why.warn, .act { color: var(--text); }
  .why.bad { color: var(--coral-text); }

  /* the mini strip: JobRow's */
  .strip { display: flex; align-items: flex-end; gap: 1px; height: 16px; margin: 2px 0 0; }
  .strip .cell { flex: 1 1 0; min-width: 0; height: 70%; border-radius: 2px; box-shadow: inset 0 0 0 1px var(--edge); background: var(--ctl-off); }
  .strip .cell.ok, .strip .cell.avail { background: var(--c-leaf); }
  .strip .cell.avail, .strip .cell.warn, .strip .cell.fail { height: 100%; }
  .strip .cell.warn { background: var(--c-yuzu); box-shadow: inset 0 2px 0 var(--text-soft), inset 0 0 0 1px var(--edge); }
  .strip .cell.fail { background: repeating-linear-gradient(135deg, var(--c-coral) 0 3px, color-mix(in srgb, var(--c-coral) 45%, var(--card)) 3px 5px); }
  .strip .cell.idle { height: 35%; box-shadow: inset 0 2px 0 var(--edge), inset 0 0 0 1px var(--edge); }
  .strip .cell.none { height: 3px; box-shadow: none; background: color-mix(in srgb, var(--edge) 35%, var(--ctl-off)); }

  .detail { display: grid; gap: 8px; padding: 0 12px 12px 30px; }
  .say { margin: 0; font-size: var(--fs-s); font-weight: 700; line-height: var(--lh); color: var(--text-soft); text-wrap: pretty; }
  .bad { margin: 0; font: 700 var(--fs-s)/var(--lh) var(--font-ui); color: var(--coral-text); }
  .lines { margin: 0; padding-left: 1.2em; display: grid; gap: 2px; font-size: var(--fs-s); font-weight: 700; line-height: var(--lh); }
  .kv { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: 4px 12px; margin: 0; }
  .kv div { display: contents; }
  .kv dt { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .kv dd { margin: 0; min-width: 0; font: 700 var(--fs-s)/1.3 var(--font-ui); font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
  .kv a { color: var(--sky-text); display: inline-flex; align-items: center; min-height: var(--hit); margin: -12px 0; }
  .detail .btn { justify-self: start; margin: 2px 0 0; min-height: var(--hit); }
</style>
