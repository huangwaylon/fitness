<script lang="ts">
  // English Study's sheet (docs/english.md "The page"), its own chunk: a full sheet on the unified kit, two levels
  // (home, a clip's lesson) and ⚙'s 報告した内容. Each opening starts on home (a lesson left part-way resumes from its
  // card: lib/english/session.ts). The island is paused under it (+page's sheetOpen).
  import Sheet from '#lib/components/ui/Sheet.svelte';
  import Home from './Home.svelte';
  import Lesson from './Lesson.svelte';
  import Settings from './Settings.svelte';
  import { CLIPS } from '../clips/index.ts';
  import { s } from '../i18n.ts';
  import { i18n } from '#lib/i18n/index.ts';

  let { open = $bindable() }: { open: boolean } = $props();
  type Level = { k: 'home' } | { k: 'lesson'; id: string } | { k: 'settings' };
  let level = $state<Level>({ k: 'home' });
  // every opening on home
  $effect(() => {
    if (open) level = { k: 'home' };
  });
  const clip = $derived.by(() => { const l = level; return l.k === 'lesson' ? (CLIPS.find((c) => c.id === l.id) ?? null) : null; });
  const close = () => (open = false);
  const home = () => (level = { k: 'home' });
</script>

<Sheet bind:open tunes label={s('title')} variant="full" timed="english" name="english">
  <div class="en" lang={i18n.locale} data-english data-level={level.k}>
    {#if clip}
      {#key clip.id}<Lesson {clip} onback={home} onclose={close} />{/key}
    {:else if level.k === 'settings'}
      <Settings onback={home} onclose={close} />
    {:else}
      <Home onopen={(id) => (level = { k: 'lesson', id })} onsettings={() => (level = { k: 'settings' })} onclose={close} />
    {/if}
  </div>
</Sheet>

<style>
  .en { position: relative; flex: 1; min-height: 0; overflow: hidden; }
</style>
