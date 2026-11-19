<script lang="ts">
  // English Study's sheet (docs/english.md "The page"), its own chunk: a full sheet on the unified kit, three tabs (ホーム,
  // フレーズ, すごろく: the kit's TabBar, shown on them only) and the levels pushed over them: the library, a clip's lesson (‹ back
  // to where it was opened from) and ⚙. Each opening starts on home (a lesson left part-way resumes from its card:
  // lib/english/session.ts; フレーズ at its card: deck.ts). The island is paused under it (+page's sheetOpen).
  import Sheet from '#lib/components/ui/Sheet.svelte';
  import TabBar from '#lib/components/ui/TabBar.svelte';
  import Lazy from '#lib/components/ui/Lazy.svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { english } from '../open.svelte.ts';
  import Home from './Home.svelte';
  import Phrases from './Phrases.svelte';
  import Library from './Library.svelte';
  import Lesson from './Lesson.svelte';
  import Settings from './Settings.svelte';
  import { metaById } from '../data.ts';
  import { s } from '../i18n.ts';
  import { i18n } from '#lib/i18n/index.ts';

  let { open = $bindable() }: { open: boolean } = $props();
  type Tab = 'home' | 'phrases' | 'game';
  type Level = { k: Tab } | { k: 'library' } | { k: 'lesson'; id: string; from: 'home' | 'library' } | { k: 'settings' };
  let level = $state<Level>({ k: 'home' });
  /** The library's chip, collection and rows shown, kept while one of its lessons is open. */
  let filter = $state('');
  let col = $state('');
  let count = $state(20);
  /** すごろく's tab: its menu shown (the tab bar with it), and an invitation's 参加 (english.show('sugoroku')). */
  let gameTop = $state(true);
  let askSeen: unknown = null;
  // every opening on home: put back as the sheet closes, so a reopen never mounts the level it was left on (a lesson
  // mounted only to be let go: its player made, then torn down); a fresh english.show('game') opens on すごろく's tab
  $effect(() => {
    if (!open) return void ((level = { k: 'home' }), (filter = ''), (col = ''), (count = 20), (gameTop = true));
    const ask = english.ask;
    if (ask === askSeen) return;
    askSeen = ask;
    level = { k: ask?.arg === 'game' ? 'game' : 'home' };
  });
  const clip = $derived.by(() => { const l = level; return l.k === 'lesson' ? (metaById(l.id) ?? null) : null; });
  const tab = $derived<Tab | null>(level.k === 'home' || level.k === 'phrases' || (level.k === 'game' && gameTop) ? level.k : null);
  const TABS = [{ id: 'home', label: s('tabHome'), icon: 'play' }, { id: 'phrases', label: s('tabPhrases'), icon: 'quote' }, { id: 'game', label: s('tabGame'), icon: 'dice' }] as const;
  const close = () => (open = false);
  /** すごろく's game on its own screen (the 3D board: /sugoroku), the sheet closed. */
  const toBoard = (m: 'local' | 'online') => {
    open = false;
    // (the page's own query kept: ?demo and the e2e's hooks, as the rooms' doors do)
    const q = new URLSearchParams(location.search);
    q.set('m', m);
    void goto(`${resolve('/sugoroku')}?${q}`);
  };
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
      {:else if level.k === 'game'}
        <!-- 英語すごろく (lib/sugoroku): its own chunk -->
        <Lazy load={() => import('#lib/sugoroku/components/SugorokuMenu.svelte')}>
          {#snippet children(Game)}<Game active={open} onclose={close} ontop={(t) => (gameTop = t)} onscreen={toBoard} />{/snippet}
        </Lazy>
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
