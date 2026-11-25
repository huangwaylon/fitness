<script lang="ts">
  // 確認が必要 (docs/bots.md), under the status only while there is something to do that it doesn't say: `act`
  // (under ジム's and 保養所's head: what a person must do, in ink), the bot's own rows (`children`: 保養所's holds),
  // the steps or other reasons, a line each, and the links that help (the PR: 44px paper buttons, side by side): a
  // plain card with the verdict's colour as a 4px left edge (one filled warn surface a page at most), its lines in
  // phrases. A live region (role
  // status). `attr`: the page's data-* prefix (data-kalori-alert, data-kalori-reason).
  import type { Snippet } from 'svelte';
  import Phrases from '../ui/Phrases.svelte';
  import { scoped } from '#lib/i18n/index.ts';

  interface Props {
    tone: string;
    act?: string | null;
    lines: readonly string[];
    links?: readonly { id: string; href: string; label: string }[];
    attr: string;
    children?: Snippet;
  }
  let { tone, act = null, lines, links = [], attr, children }: Props = $props();
  const { t } = scoped();
  const data = (k: string, v = '') => ({ [`data-${attr}-${k}`]: v });
</script>

<div class="card pad alert {tone}" role="status" aria-labelledby="{attr}-alert" {...data('alert')}>
  <h3 id="{attr}-alert">{t('bots.attn.title')}</h3>
  {#if act}<p class="act" data-bots-act><Phrases text={act} /></p>{/if}
  {@render children?.()}
  {#if lines.length}<ul>{#each lines as l (l)}<li {...data('reason')}><Phrases text={l} /></li>{/each}</ul>{/if}
  {#if links.length}
    <div class="links">
      {#each links as a (a.id)}<a class="btn small paper" href={a.href} target="_blank" rel="noopener noreferrer" data-sfx="open" {...data('link', a.id)}>{a.label}</a>{/each}
    </div>
  {/if}
</div>

<style>
  .alert { display: grid; gap: 6px; border-left: 4px solid var(--c-yuzu); }
  .alert.bad { border-left-color: var(--c-coral); }
  .alert h3 { margin: 0; font: 700 var(--fs-body)/1.3 var(--font-ui); }
  .act { margin: 0; font: 700 var(--fs-body)/var(--lh) var(--font-ui); text-wrap: pretty; }
  .alert ul { margin: 0; padding-left: 1.2em; display: grid; gap: 2px; font-size: var(--fs-s); font-weight: 700; line-height: var(--lh); }
  .links { display: flex; flex-wrap: wrap; gap: 8px; }
  .links .btn { margin: 0; min-height: var(--hit); }
</style>
