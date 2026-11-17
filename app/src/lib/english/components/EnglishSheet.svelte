<script lang="ts">
  // English Study's sheet (docs/english.md "The page"), its own chunk: a full sheet on the unified kit, two tabs (ホーム,
  // フレーズ: the kit's TabBar, shown on them only) and the levels pushed over them: the library, a clip's lesson (‹ back
  // to where it was opened from) and ⚙. Each opening starts on home (a lesson left part-way resumes from its card:
  // lib/english/session.ts; フレーズ at its card: deck.ts). The island is paused under it (+page's sheetOpen).
  import Sheet from '#lib/components/ui/Sheet.svelte';
  import TabBar from '#lib/components/ui/TabBar.svelte';
  import Home from './Home.svelte';
  import Phrases from './Phrases.svelte';
  import Library from './Library.svelte';
  import Lesson from './Lesson.svelte';
  import Settings from './Settings.svelte';
  import { metaById } from '../data.ts';
  import { s } from '../i18n.ts';
  import { i18n } from '#lib/i18n/index.ts';

  let { open = $bindable() }: { open: boolean } = $props();
  type Tab = 'home' | 'phrases';
  type Level = { k: Tab } | { k: 'library' } | { k: 'lesson'; id: string; from: 'home' | 'library' } | { k: 'settings' };
  let level = $state<Level>({ k: 'home' });
  /** The library's chip, collection and rows shown, kept while one of its lessons is open. */
  let filter = $state('');
  let col = $state('');
  let count = $state(20);
  // every opening on home
  $effect(() => {
    if (open) (level = { k: 'home' }), (filter = ''), (col = ''), (count = 20);
  });
  const clip = $derived.by(() => { const l = level; return l.k === 'lesson' ? (metaById(l.id) ?? null) : null; });
  const tab = $derived<Tab | null>(level.k === 'home' || level.k === 'phrases' ? level.k : null);
  const TABS = [{ id: 'home', label: s('tabHome'), icon: 'play' }, { id: 'phrases', label: s('tabPhrases'), icon: 'quote' }] as const;
  const close = () => (open = false);
  const home = () => ((level = { k: 'home' }), (col = ''));
  const lessonFrom = (from: 'home' | 'library') => (id: string) => (level = { k: 'lesson', id, from });
  const back = () => (level = level.k === 'lesson' && level.from === 'library' ? { k: 'library' } : { k: 'home' });
</script>

<Sheet bind:open tunes label={s('title')} variant="full" timed="english" name="english">
  <div class="en" lang={i18n.locale} data-english data-level={level.k}>
    <div class="panel" id="en-panel" role={tab ? 'tabpanel' : undefined} aria-labelledby={tab ? `en-tab-${tab}` : undefined}>
      {#if clip}
        {#key clip.id}<Lesson {clip} onback={back} onclose={close} />{/key}
      {:else if level.k === 'settings'}
        <Settings onback={home} onclose={close} />
      {:else if level.k === 'library'}
        <Library bind:filter bind:col bind:count onopen={lessonFrom('library')} onback={home} onclose={close} />
      {:else if level.k === 'phrases'}
        <Phrases onhome={home} onclose={close} />
      {:else}
        <Home onopen={lessonFrom('home')} onlibrary={() => (level = { k: 'library' })} onsettings={() => (level = { k: 'settings' })} onclose={close} />
      {/if}
    </div>
    {#if tab}<TabBar items={TABS} value={tab} label={s('tabs')} attr="en-tab" panel="en-panel" onpick={(k) => (level = { k })} />{/if}
  </div>
</Sheet>

<style>
  .en { position: relative; flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column; }
  .panel { position: relative; flex: 1; min-height: 0; }
</style>
