<script lang="ts">
  // けっこんしき (docs/wedding.md): the wedding board's sheet, its own chunk with its strings, full height (Sheet's
  // `pop`, grown out of the menu's pill). One title bar (けっこんしき; ⚙ at its left for a member: せってい, a level; ✕)
  // over one scroller: the head (NH's wedding arch, the countdown, the names, the bouquet: Top), パニエル's one line
  // (the day's first opening on this phone), やること · メモ (Segmented), then the plan (Plan) or the note (Notes). A
  // task's page, a new task's fields and せってい are levels with ‹. Props-driven: `board` (null: nothing yet, the empty
  // board) and the `actions` (the store's); `canEdit` false (the guest): read-only, no ✓, ✎, ＋ or ⚙.
  import '#lib/i18n/wedding.ts';
  import Sheet from '../ui/Sheet.svelte';
  import NavBar from '../ui/NavBar.svelte';
  import Bubble from '../ui/Bubble.svelte';
  import Segmented from '../ui/Segmented.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import Top from './Top.svelte';
  import Plan from './Plan.svelte';
  import Notes from './Notes.svelte';
  import TaskPage from './TaskPage.svelte';
  import Settings from './Settings.svelte';
  import { counts, daysLeft, summary, type Board, type Filter, type WeddingActions, type Who3 } from './view.ts';
  import { DEVICE, localKV } from '#lib/sync/storage.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';

  interface Props {
    open: boolean;
    /** The board (null: nothing yet: the empty board). */
    board: Board | null;
    /** A member's phone (the guest's: false, read-only). */
    canEdit: boolean;
    /** The players' names for the who-did-it chips. */
    names: Record<Who3, string>;
    actions?: WeddingActions;
  }
  let { open = $bindable(), board, canEdit, names, actions }: Props = $props();

  type Level = { k: 'home' } | { k: 'task'; id: string } | { k: 'new' } | { k: 'settings' };
  let level = $state<Level>({ k: 'home' });
  let tab = $state<'plan' | 'notes'>('plan');
  let filter = $state<Filter>('all');
  let held = $state(new Set<string>());
  let noteEditing = $state(false);
  const kv = localKV();
  let showDone = $state(kv?.getItem(DEVICE.weddingDone) === '1');

  const empty: Board = { tasks: [], deleted: [], config: { p1: '', p2: '', date: '', venue: '', tz: 'Asia/Tokyo', cats: [] }, note: { md: '', at: 0 }, today: '' };
  const b = $derived(board ?? empty);
  const days = $derived(b.today ? daysLeft(b.today, b.config.date) : null);
  const sum = $derived(summary(b.tasks));
  const task = $derived(level.k === 'task' ? (b.tasks.find((x) => x.id === (level as { id: string }).id) ?? null) : null);
  const title = $derived(level.k === 'task' ? t('wed.task') : level.k === 'new' ? t('wed.newTask') : level.k === 'settings' ? t('wed.settings') : t('wed.title'));

  /** パニエル's line: the day's first opening on this phone. */
  let greeting = $state<string | null>(null);
  function greet() {
    const day = b.today;
    if (!day || kv?.getItem(DEVICE.weddingGreet) === day) return;
    const late = counts(b.tasks).overdue;
    greeting =
      days === null ? t('wed.hello.none')
      : days === 0 ? t('wed.hello.day')
      : days < 0 ? t('wed.hello.past')
      : !b.tasks.length ? t('wed.hello.empty')
      : late > 0 && canEdit ? t('wed.hello.late', { n: late })
      : days <= 30 ? t('wed.hello.near')
      : t('wed.hello.days', { n: formatNum(days) });
    try {
      kv?.setItem(DEVICE.weddingGreet, day);
    } catch {
      /* full or private: the line again next time */
    }
  }
  // each opening: home, the plan as it was left; the greeting once a day (the board may come a moment after the sheet)
  let greetedOpen = false;
  $effect(() => {
    if (!open) {
      greetedOpen = false;
      return;
    }
    if (!greetedOpen && b.today) {
      greetedOpen = true;
      greet();
    }
  });

  // its open and close tunes (it mounts on the first tap, already open: that is an open too)
  let wasOpen = false;
  $effect(() => {
    const o = open;
    if (o === wasOpen) return;
    wasOpen = o;
    cue(o ? 'panel-open' : 'panel-close');
  });

  function closed() {
    if (toasts.current) toasts.dismiss();
    level = { k: 'home' };
    noteEditing = false;
    greeting = null;
    held = new Set();
  }
  function back() {
    cue('back');
    level = { k: 'home' };
  }
  function setFilter(f: Filter) {
    filter = f;
    held = new Set();
  }
  function setShowDone(v: boolean) {
    showDone = v;
    held = new Set();
    try {
      kv?.setItem(DEVICE.weddingDone, v ? '1' : '0');
    } catch {
      /* the pref lasts this opening only */
    }
  }
  function tickTask(id: string, done: boolean) {
    held = new Set([...held, id]);
    actions?.ontick(id, done);
  }
  // a task gone from under its page (deleted on the other phone): back home
  $effect(() => {
    if (level.k === 'task' && !task) level = { k: 'home' };
  });
</script>

{#snippet gear()}
  <button type="button" class="gear" aria-label={t('wed.settings')} data-wed-gear data-sfx="open" onclick={() => (level = { k: 'settings' })}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path class="g" d="M10.3 2.6h3.4l.5 2.6c.6.2 1.2.5 1.7.9l2.5-.9 1.7 2.9-2 1.7c.1.6.1 1.3 0 1.9l2 1.7-1.7 2.9-2.5-.9c-.5.4-1.1.7-1.7.9l-.5 2.6h-3.4l-.5-2.6c-.6-.2-1.2-.5-1.7-.9l-2.5.9-1.7-2.9 2-1.7c-.1-.6-.1-1.3 0-1.9l-2-1.7 1.7-2.9 2.5.9c.5-.4 1.1-.7 1.7-.9z" transform="translate(0 1)" /><circle cx="12" cy="13" r="3.2" /></svg>
  </button>
{/snippet}

<Sheet bind:open label={t('wed.title')} variant="pop" onclose={closed}>
  <div class="titlebar"><NavBar {title} onback={level.k === 'home' ? null : back} lead={level.k === 'home' && canEdit && board ? gear : null} onclose={() => (open = false)} sfx="self" /></div>
  <div class="wd-body" data-wedding data-level={level.k} data-guest={!canEdit || undefined}>
    {#key level.k}
      <div class="lvl">
        {#if level.k === 'home'}
          <!-- (writing the note: the field has the room; the tabs come back with ほぞん / やめる) -->
          {#if !noteEditing}
          <Top config={b.config} {days} {sum} />
          {#if greeting}
            <div class="greet" data-wed-greet>
              <span class="harvey" aria-hidden="true"><OfficialArt key="villagers/harvey" size={78} eager /></span>
              <Bubble text={greeting} name={t('wed.harvey')} host={false} />
            </div>
          {/if}
          <Segmented items={[{ id: 'plan', label: t('wed.tab.plan') }, { id: 'notes', label: t('wed.tab.notes') }]} value={tab} label={t('wed.tab')} attr="wed-tab" onpick={(id) => (tab = id)} />
          {/if}
          {#if tab === 'plan'}
            <Plan board={b} canEdit={canEdit && !!board} {names} {filter} {showDone} {held} onfilter={setFilter} onshowdone={setShowDone}
              onopen={(id) => (level = { k: 'task', id })} ontick={tickTask} onadd={() => (level = { k: 'new' })} />
          {:else}
            <Notes note={b.note} {canEdit} onnote={actions?.onnote} bind:editing={noteEditing} />
          {/if}
        {:else if level.k === 'task' && task}
          <TaskPage {task} today={b.today} cats={b.config.cats} {canEdit} {names} {actions} ondone={() => (level = { k: 'home' })} />
        {:else if level.k === 'new' && canEdit}
          <TaskPage task={null} today={b.today} cats={b.config.cats} {canEdit} {names} {actions} ondone={() => (level = { k: 'home' })} />
        {:else if level.k === 'settings' && canEdit}
          <Settings config={b.config} deleted={b.deleted} {actions} />
        {/if}
      </div>
    {/key}
  </div>
</Sheet>

<style>
  .titlebar { flex: none; position: relative; z-index: 4; margin-bottom: 4px; }
  .titlebar::after {
    content: ''; position: absolute; left: -8px; right: -8px; top: 100%; height: 14px; pointer-events: none;
    background: linear-gradient(var(--surface), transparent);
  }
  /* the one scroller (as the other full-height sheets'): it bleeds 8px past the side padding so focus rings and lips show */
  .wd-body {
    flex: 1; min-height: 0; overflow: hidden auto; overscroll-behavior: contain;
    margin: 0 -8px; padding: 6px 8px var(--body-pad); display: flex; flex-direction: column;
  }
  /* each level slides in from the right (design.md "Navigation": one push motion, 240ms) */
  .lvl { flex: 1 0 auto; display: flex; flex-direction: column; gap: 14px; animation: lvl 240ms cubic-bezier(.2, .8, .2, 1); }
  .lvl > :global(*) { flex: none; min-width: 0; }
  @keyframes lvl { from { opacity: 0; transform: translateX(24%); } to { opacity: 1; transform: none; } }
  .gear {
    appearance: none; border: 0; cursor: pointer; width: var(--hit); height: var(--hit); border-radius: 50%; padding: 0; flex: none;
    display: grid; place-items: center; background: var(--c-card); color: var(--c-ink); box-shadow: var(--sh-obj); -webkit-tap-highlight-color: transparent;
  }
  .gear:active { transform: translateY(2px); box-shadow: var(--sh-obj-press); }
  .gear svg { width: 24px; height: 24px; }
  .gear .g { fill: #A88B68; }
  .gear circle { fill: var(--c-card); }
  /* パニエル beside his line, feet on the bubble's baseline, the bubble's tail at him */
  .greet { display: flex; align-items: flex-end; gap: 2px; margin-top: -2px; }
  .harvey { flex: none; width: 54px; display: grid; justify-items: center; line-height: 0; margin-bottom: 4px; }
  .greet > :global(.talk) { flex: 1; min-width: 0; }
  .greet :global(.bubble)::before {
    content: ''; position: absolute; left: -9px; bottom: 16px; width: 22px; height: 18px; background: var(--c-cream);
    clip-path: polygon(100% 0, 0 55%, 100% 100%); border-radius: 4px;
  }
  @media (prefers-reduced-motion: reduce) { .lvl { animation: none; } }
</style>
