<script lang="ts">
  // 設定 (docs/design.md "Settings"): the HUD's menu's せってい button opens it, full height like the island panel,
  // at once (Sheet's `pop`). One scroller: 姿 (the look's portrait,
  // the よびな; 変更 → the 姿 level: the closet and the villagers, one dresser), プロフィール (性別, 生年月日, the BMI
  // standard: ProfileSection), サウンド, 言語 (one dropdown), 季節 (the whole island's look: SeasonSection),
  // ジムボット (one row, members only, hidden while GYM_URL is empty: its 動作状況 level, gym/status.ts), 保養所ボット (one
  // row, members only, hidden while ITS_URL is empty: its 予約設定・動作状況 level, ItsPage, lib/its) and
  // 図鑑 (one row: this closes, the ずかん's sheet in its place; its ‹ reopens this where it was); the guest's the same (2026-11-06) but for ジムボット and 保養所ボット, with a line saying it's visiting. The island is arranged in /editor, not here.
  // 姿, ジムボット and 保養所ボット push a level with ‹ (姿's edits are sent as it's left, with a 取り消す banner here; 保養所ボット's
  // ‹ asks before throwing an unsaved draft away);
  // ✕, the backdrop and Esc close it (asking first while a draft holds changes: Sheet's guard), and the next opening starts
  // at its top.
  import { tick, untrack } from 'svelte';
  import Sheet from '../ui/Sheet.svelte';
  import NavBar from '../ui/NavBar.svelte';
  import LookPage from '../look/LookPage.svelte';
  import LookPortrait from '../look/LookPortrait.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { prefetchSheet } from '../island/sheetChunks.ts';
  import SoundSection from './SoundSection.svelte';
  import LangSection from './LangSection.svelte';
  import SeasonSection from './SeasonSection.svelte';
  import ProfileSection from './ProfileSection.svelte';
  import GymPage from './GymPage.svelte';
  import ItsPage from './ItsPage.svelte';
  import { GYM_URL } from '#lib/gym/status.ts';
  import { ITS_URL } from '#lib/its/client.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { resolveLook } from '#lib/villagers/look.ts';
  import { lookOf, mySavedLooks } from '#lib/store/look.ts';
  import { DEFAULT_LOOKS, playerOf, sameLook } from '#lib/contract/look.ts';
  import { ROSTER } from '#lib/villagers/roster.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { isGuest, mine } from '#lib/ui-state/viewer.ts';
  import { lastSentAt, unsentStuck } from '#lib/sync/queue.ts';
  import { formatSyncTime } from '#lib/i18n/format.ts';
  import { dayKey, minuteNow } from '#lib/time/clock.ts';

  /** `resume`: this opening is ずかん's ‹ back (Hud): at 図鑑's row again, where the list was scrolled to. */
  let { open = $bindable(), onzukan, resume = $bindable(false) }: { open: boolean; onzukan: () => void; resume?: boolean } = $props();

  /** The levels pushed: すがた, ジムボット, 保養所ボット. */
  let stack = $state<('look' | 'gym' | 'its')[]>([]);
  /** 保養所ボット's ‹ guard (its draft). */
  let itsLeave = $state<((run: () => void) => void) | undefined>();
  const push = $derived(stack.at(-1) ?? null);
  let body: HTMLElement | undefined = $state();
  let sheet: ReturnType<typeof Sheet> | undefined = $state();
  let savedTop = 0;
  /** The list's scroll as 図鑑's row opened ずかん (its ‹ comes back to it). */
  let zukanTop = 0;

  const view = $derived(week.view);
  const title = $derived(push === 'gym' ? t('gym.title') : push === 'its' ? t('its.title') : push ? t(`panel.${push}`) : t('title.settings'));
  /** This phone's villager (the guest's own on the guest's phone). */
  const me = $derived(view ? mine(view) : null);
  const myVillager = $derived(me ? resolveLook({ villager: me.villager, person: me.who }).id : null);
  /** The look worn (the row's portrait) and what it's called: the roster villager's name, いつもの, or the コーデ's. */
  const worn = $derived(me ? lookOf(me.who) : null);
  const wornName = $derived.by(() => {
    if (!me || !worn) return null;
    if (worn.kind === 'villager') return myVillager ? (i18n.locale === 'ja' ? ROSTER[myVillager].nameJa : ROSTER[myVillager].nameEn) : null;
    const p = playerOf(worn, me.who);
    if (me.who !== 'G' && sameLook(p, DEFAULT_LOOKS[me.who])) return t('look.usual');
    return mySavedLooks().find((s) => sameLook(s.look, p))?.name ?? null;
  });
  /** The writes not sent yet (2026-11-08: a stuck queue was invisible): 「未送信 {n}件（最終送信 {time}）」, 送信 sends
   *  them now, the set-aside ones too. As the sync chip counts them (unsentStuck): none while every write is in its
   *  hold or fresh. (The view recomputes as one is queued or acked, the minute as one waits: the count follows it.) */
  const unsent = $derived((void week.view, week.demo ? 0 : unsentStuck(minuteNow().getTime())));
  const sentAt = $derived((void week.view, lastSentAt()));
  /** The guest's phone (docs/design.md "The guest"): a line saying it's visiting. */
  const guest = $derived(isGuest(view));

  async function go(to: 'look' | 'gym' | 'its') {
    if (!stack.length) savedTop = body?.scrollTop ?? 0;
    stack = [...stack, to];
    await tick();
    body?.scrollTo({ top: 0 });
  }

  /** ‹: back to the list, where it was scrolled to, focus on the row it came from (保養所ボット's after its guard). */
  function back() {
    if (push === 'its' && itsLeave) itsLeave(() => void pop());
    else void pop();
  }
  async function pop() {
    cue('back');
    const from = push;
    stack = stack.slice(0, -1);
    await tick();
    if (!stack.length) body?.scrollTo({ top: savedTop });
    document.querySelector<HTMLElement>(`[data-push="${from}"]`)?.focus({ preventScroll: true });
  }

  /** Closing ends its banner too, and the next open starts at the top. */
  function closed() {
    if (toasts.current) toasts.dismiss();
    stack = [];
  }

  // Back on 図鑑 when it opens again from there.
  $effect(() => {
    if (open && untrack(() => resume)) {
      resume = false;
      void tick().then(() => {
        body?.scrollTo({ top: zukanTop });
        document.querySelector<HTMLElement>('[data-settings-zukan]')?.focus({ preventScroll: true });
      });
    }
  });

  function toZukan() {
    zukanTop = body?.scrollTop ?? 0;
    open = false;
    onzukan();
  }
</script>

<Sheet bind:this={sheet} bind:open tunes label={t('title.settings')} variant="pop" onclose={closed} timed="settings">
  <div class="titlebar"><NavBar {title} onback={push ? back : null} onclose={() => (sheet ? sheet.guard(() => (open = false)) : (open = false))} sfx="self" /></div>
  <div class="panel-body" class:fill={push === 'look'} data-settings bind:this={body}>
    {#if push === 'look' && view}
      <div class="page"><LookPage {view} /></div>
    {:else if push === 'gym'}
      <div class="page"><GymPage /></div>
    {:else if push === 'its'}
      <div class="page"><ItsPage bind:leave={itsLeave} /></div>
    {:else if !push && view && me && worn}
      {#if unsent}
        <div class="prow static" data-unsent={unsent}>
          <span class="prl">{t('panel.unsent', { n: unsent, time: formatSyncTime(sentAt === null ? null : new Date(sentAt), dayKey()) })}</span>
          <button type="button" class="btn small paper" data-sfx="sync" aria-disabled={week.syncing} onclick={() => week.refresh({ unpark: true })}>{t('panel.unsentSend')}</button>
        </div>
      {/if}
      <section class="sec" aria-labelledby="sec-look">
        <h2 id="sec-look" class="sec-label">{t('panel.look')}</h2>
        <div class="prow static me" data-look-row={worn.kind}>
          <LookPortrait who={me.who} look={worn} size={48} />
          <span class="prl">{me.villagerName}{#if wornName}<small data-look-worn>{wornName}</small>{/if}</span>
          <button type="button" class="btn small paper" data-push="look" data-sfx="page" onclick={() => go('look')}>{t('panel.change')}</button>
        </div>
        {#if guest}<p class="guest" data-guest-note>{t('guest.note')}</p>{/if}
      </section>
      <section class="sec" aria-labelledby="sec-profile" data-profile-section><h2 id="sec-profile" class="sec-label">{t('panel.profile')}</h2><ProfileSection {view} /></section>
      <section class="sec" aria-labelledby="sec-sound"><h2 id="sec-sound" class="sec-label">{t('panel.sound')}</h2><SoundSection /></section>
      <section class="sec" aria-labelledby="sec-lang"><h2 id="sec-lang" class="sec-label">{t('panel.lang')}</h2><LangSection /></section>
      <section class="sec" aria-labelledby="sec-season"><h2 id="sec-season" class="sec-label">{t('panel.season')}</h2><SeasonSection {view} /></section>
      {#if GYM_URL && !guest}
        <section class="sec" aria-labelledby="sec-gym">
          <h2 id="sec-gym" class="sec-label">{t('gym.title')}</h2>
          <button type="button" class="prow go" data-push="gym" data-sfx="page" onclick={() => go('gym')}>
            <span class="ic"><OfficialArt key="items/nook-yoga-mat" size={36} /></span>
            <span class="prl">{t('gym.status')}</span>
            <svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
          </button>
        </section>
      {/if}
      {#if ITS_URL && !guest}
        <section class="sec" aria-labelledby="sec-its">
          <h2 id="sec-its" class="sec-label">{t('its.title')}</h2>
          <button type="button" class="prow go" data-push="its" data-sfx="page" onclick={() => go('its')}>
            <span class="ic"><OfficialArt key="items/oil-barrel-bathtub" size={36} /></span>
            <span class="prl">{t('its.status')}</span>
            <svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
          </button>
        </section>
      {/if}
      <section class="sec" aria-labelledby="sec-zukan">
        <h2 id="sec-zukan" class="sec-label">{t('title.zukan')}</h2>
        <button type="button" class="prow go" data-settings-zukan aria-haspopup="dialog" data-sfx="tick" onpointerdown={() => void prefetchSheet('zukan')}
          onclick={toZukan}>
          <span class="ic"><OfficialArt key="critters/agrias-butterfly" size={36} /></span>
          <span class="prl">{t('zukan.open')}</span>
          <svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
        </button>
      </section>
      {#if week.demo}<span class="demo">{t('demo.badge')}</span>{/if}
    {/if}
  </div>
</Sheet>

<style>
  /* The one scroller. It bleeds 8px past the side padding so focus rings and lips are not clipped by its overflow. */
  .panel-body {
    flex: 1; min-height: 0; overflow: hidden auto; overscroll-behavior: contain;
    margin: 0 -8px; padding: 6px 8px var(--body-pad); display: flex; flex-direction: column; gap: 14px;
  }
  .panel-body > :global(*) { flex: none; }
  /* すがた pins its stage and tabs and scrolls its own panel (to the bottom edge): the body holds still */
  .panel-body.fill { overflow: hidden; padding-bottom: 0; }
  .panel-body.fill > .page { flex: 1; min-height: 0; }
  /* a pushed level slides in from the right (design.md "Navigation") */
  .page { display: flex; flex-direction: column; gap: 14px; animation: slide 240ms cubic-bezier(.2, .8, .2, 1); }
  @keyframes slide { from { opacity: 0; transform: translateX(24%); } to { opacity: 1; transform: none; } }

  /* one section per topic: a small heading over its rows */
  .sec { display: grid; gap: 8px; }
  .me .prl small { display: block; margin-top: 2px; font-size: var(--fs-s); color: var(--text-soft); }
  .me .btn { flex: none; }
  /* a row that goes somewhere (ジムボット, 図鑑): an icon, the label, a chevron */
  .go .ic { flex: none; display: flex; width: 40px; justify-content: center; }
  .go .chev { flex: none; width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; color: var(--text-soft); }
  .guest { margin: 6px 4px 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); line-height: var(--lh); }
  .demo { align-self: center; background: var(--c-yuzu); color: var(--c-ink); border-radius: var(--r-chip); padding: 4px 10px; font: 700 var(--fs-s)/1 var(--font-ui); }

  /* Rows shared by the sections (サウンド). */
  .panel-body :global(.prows) { display: grid; gap: 10px; }
  .panel-body :global(.prow) {
    appearance: none; cursor: pointer; display: flex; align-items: center; gap: 10px; min-height: 52px; padding: 8px 12px;
    border-radius: var(--r-card); border: 0; background: var(--ctl); color: var(--text);
    box-shadow: var(--sh-ctl); text-align: left; width: 100%; font: inherit;
  }
  .panel-body :global(.prow:not(.static):active) { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
  /* a static row is information, not a control: the soft card lip, no edge */
  .panel-body :global(.prow.static) { box-shadow: var(--sh-lip); background: var(--card); cursor: default; }
  /* the chosen row: NH's yellow highlight */
  .panel-body :global(.prow[aria-checked='true']) { background: var(--ctl-sel); color: var(--c-ink); }
  .panel-body :global(.prl) { flex: 1; min-width: 0; font-weight: 700; font-size: var(--fs-body); text-wrap: balance; line-height: 1.3; }
</style>
