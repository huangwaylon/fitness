<script lang="ts">
  // 確認が必要 (docs/design.md "Bots"), under the verdict only while there is something to do that its sentence doesn't
  // say: the steps or other reasons, a line each, the bot's own rows (`children`: 保養所's holds), and the links that
  // help (the PR: 44px paper buttons, side by side), tinted as the verdict, a little paler. A live region (role
  // status). `attr`: the page's data-* prefix (data-kalori-alert, data-kalori-reason).
  import type { Snippet } from 'svelte';
  import { t } from '#lib/i18n/index.ts';

  interface Props {
    tone: string;
    lines: readonly string[];
    links?: readonly { id: string; href: string; label: string }[];
    attr: string;
    children?: Snippet;
  }
  let { tone, lines, links = [], attr, children }: Props = $props();
  const data = (k: string, v = '') => ({ [`data-${attr}-${k}`]: v });
</script>

<div class="card pad alert {tone}" role="status" aria-labelledby="{attr}-alert" {...data('alert')}>
  <h3 id="{attr}-alert">{t('bots.attn.title')}</h3>
  {@render children?.()}
  {#if lines.length}<ul>{#each lines as l (l)}<li {...data('reason')}>{l}</li>{/each}</ul>{/if}
  {#if links.length}
    <div class="links">
      {#each links as a (a.id)}<a class="btn small paper" href={a.href} target="_blank" rel="noopener noreferrer" data-sfx="open" {...data('link', a.id)}>{a.label}</a>{/each}
    </div>
  {/if}
</div>

<style>
  .alert { display: grid; gap: 6px; background: color-mix(in srgb, var(--c-yuzu) 18%, var(--card)); }
  .alert.bad { background: color-mix(in srgb, var(--c-coral) 14%, var(--card)); }
  .alert h3 { margin: 0; font: 700 var(--fs-body)/1.3 var(--font-ui); }
  .alert ul { margin: 0; padding-left: 1.2em; display: grid; gap: 2px; font-size: var(--fs-s); font-weight: 700; line-height: var(--lh); }
  .links { display: flex; flex-wrap: wrap; gap: 8px; }
  .links .btn { margin: 0; min-height: var(--hit); }
</style>
