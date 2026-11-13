<script lang="ts">
  // A call's transcript (ようじ でんわ's reveal and review): the caller's lines on the left by their head, mine on the
  // right (mint), each with its Japanese; the mid-call change tagged 言い直し, a line that broke up 途切れた.
  import type { CallInfo } from '#lib/kikimimi/games/call/def.ts';
  import OfficialArt from '../../characters/OfficialArt.svelte';
  import { villagerArt } from '#lib/art.ts';
  import { rosterName as name } from '../scene/stage.ts';
  import { t } from '#lib/i18n/index.ts';

  let { info }: { info: CallInfo } = $props();
</script>

<ol class="log" data-kiki-call-log={info.id}>
  {#each info.lines as l, k (k)}
    <li class="ln" class:me={l.me} data-line={k}>
      {#if l.me}<span class="who me-tag">{t('kiki.call.me')}</span>
      {:else}<span class="who"><OfficialArt key={villagerArt(info.caller, true)} alt={name(info.caller)} size={30} /></span>{/if}
      <div class="b obj-cream">
        {#if l.repair || l.drop}
          <p class="tags">
            {#if l.repair}<span class="tag repair" data-kiki-repair>{t('kiki.call.repair')}</span>{/if}
            {#if l.drop}<span class="tag drop"><span aria-hidden="true">📶</span> {t('kiki.call.drop')}</span>{/if}
          </p>
        {/if}
        <p class="en" lang="en">{l.en}</p>
        <p class="ja">{l.ja}</p>
      </div>
    </li>
  {/each}
</ol>

<style>
  .log { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  .ln { display: grid; grid-template-columns: 36px minmax(0, 1fr); align-items: start; gap: 6px; }
  .ln.me { grid-template-columns: minmax(0, 1fr) 36px; }
  .ln.me .who { order: 2; }
  .who { display: grid; place-items: center; line-height: 0; }
  .me-tag { line-height: 1.2; font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); padding-top: 8px; }
  .b { display: grid; gap: 2px; padding: 8px 12px; border-radius: 16px; background: var(--c-card); color: var(--c-ink); box-shadow: var(--sh-lip-cream); }
  .me .b { background: color-mix(in srgb, var(--c-mint) 45%, var(--c-card)); }
  .en { margin: 0; font: 700 var(--fs-body)/1.4 var(--font-ui); }
  .ja { margin: 0; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); word-break: normal; line-break: strict; }
  .tags { margin: 0; display: flex; gap: 6px; }
  .repair, .drop { color: var(--c-ink); }
  .repair { background: color-mix(in srgb, var(--c-yuzu) 60%, var(--c-card)); }
  .drop { background: color-mix(in srgb, var(--c-coral) 25%, var(--c-card)); }
</style>
