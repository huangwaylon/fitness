<script lang="ts">
  // けっこんしき (docs/wedding.md): the wedding board's sheet, its own chunk with its strings, full height (Sheet's
  // `pop`, grown out of the menu's pill), over the board's store (board.svelte.ts). One title bar (けっこんしき; at its
  // left a member's ⚙ せってい and ＋ a task, both away while the note is being written; ✕) over one scroller: the head
  // (NH's wedding arch, the countdown, the names, the bouquet: Top), パニエル's one line (the day's first opening on this
  // phone; a tap folds it, the overdue line's to the overdue tasks), やること · メモ (Segmented), then the plan (Plan)
  // or the note (Notes). A task's page, a new task's fields and せってい are levels with ‹ (back on the plan where it
  // was scrolled). The guest's phone (board.canEdit false) reads it all: no ✓, ✎, ＋ or ⚙.
  import { tick } from 'svelte';
  import '#lib/i18n/wedding.ts';
  import Sheet from '../ui/Sheet.svelte';
  import NavBar from '../ui/NavBar.svelte';
  import Bubble from '../ui/Bubble.svelte';
  import Segmented from '../ui/Segmented.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import Icon from './Icon.svelte';
  import Top from './Top.svelte';
  import Plan from './Plan.svelte';
  import Notes from './Notes.svelte';
  import TaskPage from './TaskPage.svelte';
  import Settings from './Settings.svelte';
  import { board } from './board.svelte.ts';
  import { flush, pad } from './notepad.svelte.ts';
  import type { Filter } from './view.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { villagerNameOf } from '#lib/ui-state/viewer.ts';
  import type { Who } from '#lib/types.ts';
  import { DEVICE, localKV } from '#lib/sync/storage.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';

  let { open = $bindable() }: { open: boolean } = $props();

  type Level = { k: 'home' } | { k: 'task'; id: string } | { k: 'new' } | { k: 'settings' };
  let level = $state<Level>({ k: 'home' });
  let tab = $state<'plan' | 'notes'>('plan');
  let filter = $state<Filter>('all');
  let held = $state(new Set<string>());
  const kv = localKV();
  let showDone = $state(kv?.getItem(DEVICE.weddingDone) === '1');
  let body: HTMLElement | undefined = $state();
  /** The plan's scroll when a level was opened over it (‹ comes back to it). */
  let homeScroll = 0;

  const canEdit = $derived(board.canEdit);
  const view = $derived(week.view);
  const names = $derived<Record<Who, string>>({ A: view ? villagerNameOf(view, 'A') : 'A', B: view ? villagerNameOf(view, 'B') : 'B', G: view ? villagerNameOf(view, 'G') : 'G' });
  const tasks = $derived(board.tasks);
  const task = $derived(level.k === 'task' ? (tasks.find((x) => x.id === (level as { id: string }).id) ?? null) : null);
  const title = $derived(level.k === 'task' ? t('wed.task') : level.k === 'new' ? t('wed.newTask') : level.k === 'settings' ? t('wed.settings') : t('wed.title'));
  const writing = $derived(pad.editing && tab === 'notes');

  /** パニエル's line: the day's first opening on this phone (`late`: the overdue line, its tap the overdue tasks). */
  let greeting = $state<{ text: string; late: boolean } | null>(null);
  function greet() {
    const day = board.today, days = board.countdown, late = canEdit && tasks.length ? board.overall.overdue : 0;
    if (!day || kv?.getItem(DEVICE.weddingGreet) === day) return;
    greeting =
      days === null ? { text: t('wed.hello.none'), late: false }
      : days === 0 ? { text: t('wed.hello.day'), late: false }
      : days < 0 ? { text: t('wed.hello.past'), late: false }
      : !tasks.length ? { text: t('wed.hello.empty'), late: false }
      : late > 0 ? { text: t(late === 1 ? 'wed.hello.late1' : 'wed.hello.late', { n: late }), late: true }
      : { text: days <= 30 ? t('wed.hello.near') : t('wed.hello.days', { n: formatNum(days) }), late: false };
    try {
      kv?.setItem(DEVICE.weddingGreet, day);
    } catch {
      /* full or private: the line again next time */
    }
  }
  function heard() {
    if (greeting?.late) {
      tab = 'plan';
      setFilter('overdue');
    }
    greeting = null;
  }
  // each opening: the greeting once a day (the board may come a moment after the sheet)
  let greetedOpen = false;
  $effect(() => {
    if (!open) {
      greetedOpen = false;
      return;
    }
    if (!greetedOpen && board.today) {
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

  /** Closed: the next opening is home, すべて, the plan's top (a note being written stays: back in its editor). */
  function closed() {
    if (toasts.current) toasts.dismiss();
    flush();
    level = { k: 'home' };
    homeScroll = 0;
    greeting = null;
    setFilter('all');
  }
  function go(next: Level) {
    if (level.k === 'home') homeScroll = body?.scrollTop ?? 0;
    level = next;
  }
  async function home() {
    level = { k: 'home' };
    await tick();
    body?.scrollTo({ top: homeScroll });
  }
  function back() {
    cue('back');
    void home();
  }
  function added(id: string, name: string) {
    level = { k: 'task', id };
    toasts.show(t('wed.added', { title: name }), 2400, { low: true });
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
    board.tick(id, done);
  }
  // a task gone from under its page (deleted on the other phone): back home
  $effect(() => {
    if (level.k === 'task' && !task) void home();
  });
</script>

{#snippet lead()}
  <span class="lead">
    <button type="button" class="round gear" aria-label={t('wed.settings')} data-wed-gear data-sfx="open" onclick={() => go({ k: 'settings' })}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path class="g" d="M10.3 2.6h3.4l.5 2.6c.6.2 1.2.5 1.7.9l2.5-.9 1.7 2.9-2 1.7c.1.6.1 1.3 0 1.9l2 1.7-1.7 2.9-2.5-.9c-.5.4-1.1.7-1.7.9l-.5 2.6h-3.4l-.5-2.6c-.6-.2-1.2-.5-1.7-.9l-2.5.9-1.7-2.9 2-1.7c-.1-.6-.1-1.3 0-1.9l-2-1.7 1.7-2.9 2.5.9c.5-.4 1.1-.7 1.7-.9z" transform="translate(0 1)" /><circle cx="12" cy="13" r="3.2" /></svg>
    </button>
    {#if tab === 'plan'}
      <button type="button" class="round add" aria-label={t('wed.add')} data-wed-add data-sfx="open" onclick={() => go({ k: 'new' })}><Icon name="plus" size={26} /></button>
    {/if}
  </span>
{/snippet}

<Sheet bind:open label={t('wed.title')} variant="pop" onclose={closed}>
  <div class="titlebar"><NavBar {title} onback={level.k === 'home' ? null : back} lead={level.k === 'home' && canEdit && !writing ? lead : null} onclose={() => (open = false)} sfx="self" /></div>
  <div class="wd-body" bind:this={body} data-wedding data-level={level.k} data-guest={!canEdit || undefined}>
    {#key level.k}
      <div class="lvl">
        {#if level.k === 'home'}
          <!-- (writing the note: the field has the room; the head and the tabs come back with ほぞん / やめる) -->
          {#if !writing}
            <Top config={board.config} days={board.countdown} sum={board.overall} />
            {#if greeting}
              <button type="button" class="greet" data-wed-greet data-sfx="tick" onclick={heard}>
                <span class="harvey" aria-hidden="true"><OfficialArt key="villagers/harvey" size={64} eager /></span>
                <Bubble text={greeting.text} name={t('wed.harvey')} host={false} />
              </button>
            {/if}
            <Segmented items={[{ id: 'plan', label: t('wed.tab.plan') }, { id: 'notes', label: t('wed.tab.notes') }]} value={tab} label={t('wed.tab')} attr="wed-tab" onpick={(id) => (tab = id)} />
          {/if}
          {#if tab === 'plan'}
            <Plan {tasks} overall={board.overall} today={board.today} wedding={board.config.date} {canEdit} {names} {filter} {showDone} {held} onfilter={setFilter} onshowdone={setShowDone}
              onopen={(id) => go({ k: 'task', id })} ontick={tickTask} />
          {:else}
            <Notes {names} />
          {/if}
        {:else if level.k === 'task' && task}
          <TaskPage {task} cats={board.config.cats} {canEdit} {names} ondone={home} />
        {:else if level.k === 'new' && canEdit}
          <TaskPage task={null} cats={board.config.cats} {canEdit} {names} ondone={home} onadded={added} />
        {:else if level.k === 'settings' && canEdit}
          <Settings />
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
  /* (the note's editor takes the level's height) */
  .lvl > :global(.notes) { flex: 1 0 auto; }
  @keyframes lvl { from { opacity: 0; transform: translateX(24%); } to { opacity: 1; transform: none; } }
  .lead { display: flex; gap: 8px; }
  .round {
    appearance: none; border: 0; cursor: pointer; width: var(--hit); height: var(--hit); border-radius: 50%; padding: 0; flex: none;
    display: grid; place-items: center; background: var(--c-card); color: var(--c-ink); box-shadow: var(--sh-obj); -webkit-tap-highlight-color: transparent;
  }
  .round:active { transform: translateY(2px); box-shadow: var(--sh-obj-press); }
  .gear svg { width: 24px; height: 24px; }
  .gear .g { fill: #A88B68; }
  .gear circle { fill: var(--c-card); }
  /* ＋: the leaf (NH's), the board's one action */
  .add { background: var(--c-leaf); box-shadow: inset 0 0 0 2px var(--c-leaf-edge), 0 var(--lip-h) 0 var(--c-leaf-edge); }
  .add:active { box-shadow: inset 0 0 0 2px var(--c-leaf-edge), 0 1px 0 var(--c-leaf-edge); }
  /* パニエル beside his line, feet on the bubble's baseline, the bubble's tail at him; the whole line one tap */
  .greet {
    appearance: none; border: 0; background: none; padding: 0; font: inherit; color: inherit; text-align: left; cursor: pointer;
    display: flex; align-items: flex-end; gap: 2px; margin-top: -2px; -webkit-tap-highlight-color: transparent;
  }
  .greet:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; border-radius: 16px; }
  .harvey { flex: none; width: 48px; display: grid; justify-items: center; line-height: 0; margin-bottom: 4px; }
  .greet > :global(.talk) { flex: 1; min-width: 0; }
  .greet :global(.bubble)::before {
    content: ''; position: absolute; left: -9px; bottom: 16px; width: 22px; height: 18px; background: var(--c-cream);
    clip-path: polygon(100% 0, 0 55%, 100% 100%); border-radius: 4px;
  }

  /* shared by the board's levels (TaskFields, TaskPage, TaskCard, Settings): the fields, and the who / category chips */
  .wd-body :global(.w-in) {
    width: 100%; min-width: 0; min-height: var(--hit); padding: 8px 12px; border-radius: 14px; border: 0; box-sizing: border-box;
    font: 500 var(--fs-input)/1.3 var(--font-ui); color: var(--c-ink); background: var(--c-card); box-shadow: inset 0 0 0 2px var(--c-edge);
    -webkit-appearance: none; appearance: none;
  }
  .wd-body :global(select.w-in) {
    padding-right: 34px; background-repeat: no-repeat; background-size: 6px 6px; background-position: calc(100% - 20px) 55%, calc(100% - 14px) 55%;
    background-image: linear-gradient(45deg, transparent 50%, var(--c-ink-soft) 50%), linear-gradient(135deg, var(--c-ink-soft) 50%, transparent 50%);
  }
  .wd-body :global(input.w-in[type='date']) { display: block; text-align: left; }
  .wd-body :global(.w-in[aria-invalid='true']) { box-shadow: inset 0 0 0 3px var(--c-coral); }
  .wd-body :global(.w-in:focus-visible) { outline: 3px solid var(--focus); outline-offset: 2px; }
  .wd-body :global(.w-lbl) { font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); padding-left: 4px; }
  .wd-body :global(:is(.w-cat, .w-who)) { display: inline-block; padding: 3px 8px 2px; border-radius: var(--r-pill); font: 700 var(--fs-s)/1 var(--font-ui); white-space: nowrap; }
  .wd-body :global(.w-cat) { background: var(--ctl-off); color: var(--text); }
  .wd-body :global(.w-who) { background: var(--tag); color: var(--c-ink); }
  .wd-body :global(.w-due.over) { color: var(--coral-text); }
  .wd-body :global(.w-due.soon) { color: var(--leaf-text); }
  @media (prefers-reduced-motion: reduce) { .lvl { animation: none; } }
</style>
