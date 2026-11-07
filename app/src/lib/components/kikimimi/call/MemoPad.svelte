<script lang="ts">
  // ようじ でんわ's memo (docs/curriculum-wave2.md §2.3): a card of chip rows, each its question (いくつ？ なんじ？) and its
  // chips; a tap picks a row's chip, another tap on it takes it back, a tap on another changes it (the call's "oh,
  // actually…": no drag, no typing). Co-op, the partner's rows dashed with their question only. At the reveal each row
  // shows its right chip (○), a wrong pick struck (×: mine, or co-op the team's), and the right chip's Japanese when it
  // reads otherwise (`cja`).
  import type { AskedRow } from '#lib/kikimimi/games/call/def.ts';
  import { EMPTY } from '#lib/kikimimi/games/call/def.ts';
  import { t } from '#lib/i18n/index.ts';

  let { rows, mine, placed, open, reveal, team, ja, onpick }: {
    rows: readonly AskedRow[];
    /** My rows (their places in `rows`). */
    mine: readonly number[];
    /** My chip per row (EMPTY: none). */
    placed: readonly number[];
    /** The chips take a tap. */
    open: boolean;
    reveal: boolean;
    /** At the reveal, each memo row's chip as the team put it (by `n`). */
    team: ReadonlyMap<number, { chip: string; ok: boolean }>;
    /** The right chip's Japanese, when it reads otherwise. */
    ja: (n: number) => string | null;
    onpick: (j: number, k: number) => void;
  } = $props();
</script>

<ol class="memo card" aria-label={t('kiki.call.memo')} data-kiki-memo>
  {#each rows as row, j (row.n)}
    {@const own = mine.includes(j)}
    {@const put = reveal ? (team.get(row.n) ?? null) : null}
    <li class="row" class:theirs={!own} data-row={j} data-n={row.n} data-own={own || undefined} data-mark={reveal ? (put?.ok ? 'right' : 'wrong') : undefined}>
      <p class="ask"><span>{row.ask}</span>{#if !own && !reveal}<small class="who">{t('kiki.call.partner')}</small>{/if}</p>
      {#if own || reveal}
        <div class="chips" role="group" aria-label={row.ask}>
          {#each row.chips as chip, k (k)}
            {@const on = reveal ? put?.chip === chip : placed[j] === k}
            {@const mark = reveal ? (k === row.answer ? 'right' : on ? 'wrong' : undefined) : undefined}
            <button type="button" class="chip-btn tile-btn" data-chip={k} aria-pressed={on} data-mark={mark} aria-disabled={!open}
              data-sfx={open ? 'choice-pick' : 'none'} onclick={() => open && onpick(j, placed[j] === k ? EMPTY : k)}>
              {#if mark === 'right'}<span class="sym" aria-hidden="true">○</span>{:else if mark === 'wrong'}<span class="sym" aria-hidden="true">×</span>{/if}{chip}
            </button>
          {/each}
        </div>
        {#if reveal && ja(row.n)}<p class="ja" data-kiki-cja>{ja(row.n)}</p>{/if}
      {/if}
    </li>
  {/each}
</ol>

<style>
  /* a paper memo card: ruled rows, each its question and its chips (44 px targets that wrap at 393 px) */
  .memo { list-style: none; margin: 0; padding: 4px 12px; display: grid; }
  .row { display: grid; gap: 6px; padding: 10px 0; }
  .row + .row { border-top: 2px dashed color-mix(in srgb, var(--c-edge) 45%, transparent); }
  .ask { margin: 0; display: flex; align-items: baseline; gap: 8px; font: 700 var(--fs-body)/1.35 var(--font-ui); }
  .who { font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); }
  .theirs:not([data-mark]) { opacity: .6; }
  .theirs:not([data-mark]) .ask { padding: 8px 10px; border: 2px dashed var(--edge); border-radius: 12px; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip-btn {
    min-height: var(--hit); padding: 6px 12px; border-radius: 12px; display: inline-flex; align-items: center; gap: 4px;
    font: 700 var(--fs-body)/1.25 var(--font-ui); word-break: normal; line-break: strict; text-align: left;
  }
  .chip-btn[aria-pressed='true']:not([data-mark]) { background: var(--ctl-sel); color: var(--c-ink); box-shadow: inset 0 0 0 2px var(--c-leaf-edge); }
  .chip-btn[data-mark] { color: var(--c-ink); }
  .chip-btn[data-mark='right'] { background: color-mix(in srgb, var(--c-leaf) 50%, var(--c-card)); }
  .chip-btn[data-mark='wrong'] { background: color-mix(in srgb, var(--c-coral) 28%, var(--c-card)); text-decoration: line-through; text-decoration-thickness: 2px; }
  .chip-btn[aria-disabled='true']:not([data-mark]):not([aria-pressed='true']) { opacity: .75; }
  .sym { font-weight: 700; }
  .ja { margin: 0; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
</style>
