<script lang="ts">
  // おやすみ ものがたり's chapters (docs/kikimimi.md "あそぶ"'s ねる まえに): each serial with its host and its chapters in
  // order: a finished one ✓, the one to listen to next green-edged with きく (つづきから when it was left part-way), a
  // later one locked until the one before is finished (kikimimi/bedtime.ts unlocked). A row plays its chapter at once
  // (StoryFrame). No score anywhere. Its own chunk.
  import type { Who } from '#lib/types.ts';
  import { villagerArt } from '#lib/art.ts';
  import { nextOf, unlocked } from '#lib/kikimimi/bedtime.ts';
  import OfficialArt from '../../characters/OfficialArt.svelte';
  import { rosterName } from '../scene/stage.ts';
  import { SERIALS, storyProgress } from './serials.svelte.ts';
  import { t } from '#lib/i18n/index.ts';

  let { me, onplay }: { me: Who; onplay: (unit: string, ch: number, seg: number) => void } = $props();
  const progress = $derived(storyProgress(me));
  const mins = (s: number) => Math.max(1, Math.round(s / 60));
</script>

<div class="list" data-kiki-page="story">
  <p class="hint">{t('kiki.story.listHint')}</p>
  {#each SERIALS as s (s.unit)}
    {@const p = progress[s.unit]}
    {@const next = nextOf(p, s.chapters.length)}
    <section class="serial card" aria-labelledby="kk-st-{s.unit}" data-kiki-serial={s.unit}>
      <header>
        <span class="host" aria-hidden="true"><OfficialArt key={villagerArt(s.host, true)} alt="" size={48} eager /></span>
        <span><h3 id="kk-st-{s.unit}">{s.name}</h3><small>{rosterName(s.host)}</small></span>
      </header>
      <ol>
        {#each s.chapters as c (c.part)}
          {@const open = unlocked(p, c.ch)}
          {@const done = !!p?.done[c.ch]}
          {@const isNext = c.ch === next.ch}
          <li>
            <button type="button" class="row" class:next={isNext} aria-disabled={!open} data-kiki-chapter={c.part} data-kiki-locked={!open || undefined}
              data-kiki-done={done || undefined} data-sfx={open ? 'confirm' : 'tick'} onclick={() => open && onplay(s.unit, c.ch, isNext ? next.seg : 0)}>
              <span class="n">{done ? '✓' : open ? c.ch : '🔒'}</span>
              <span class="txt">
                <small>{t('kiki.story.chapter', { n: c.ch })} · {t('kiki.chip.mins', { n: mins(c.secs) })}</small>
                <b lang="en">{c.title}</b>
                <small>{open ? c.line : t('kiki.story.locked')}</small>
              </span>
              {#if isNext && open}<span class="go">{t(next.seg ? 'kiki.story.resume' : 'kiki.story.listen')}</span>{/if}
            </button>
          </li>
        {/each}
      </ol>
    </section>
  {/each}
</div>

<style>
  .list { display: grid; gap: 14px; }
  .hint { margin: 0 6px; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .serial { padding: 12px; display: grid; gap: 10px; }
  header { display: flex; align-items: center; gap: 10px; }
  header h3 { margin: 0; font: 700 var(--fs-talk)/1.2 var(--font-ui); }
  header small { font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); }
  .host { flex: none; line-height: 0; border-radius: 50%; background: #3A4886; }
  ol { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
  .row {
    appearance: none; border: 0; cursor: pointer; width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 16px;
    text-align: left; font: inherit; color: var(--text); background: color-mix(in srgb, var(--surface) 55%, var(--card));
  }
  .row.next { box-shadow: inset 0 0 0 2px var(--c-leaf); }
  .row[aria-disabled='true'] { cursor: default; color: var(--text-soft); background: color-mix(in srgb, var(--surface) 80%, var(--card)); }
  .n { flex: none; width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; font: 700 var(--fs-body)/1 var(--font-num); background: var(--card); }
  .txt { flex: 1; min-width: 0; display: grid; gap: 2px; }
  .txt b { font: 700 var(--fs-body)/1.25 var(--font-ui); }
  .txt small { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .go { flex: none; font: 700 var(--fs-s)/1 var(--font-ui); color: var(--leaf-text); }
</style>
