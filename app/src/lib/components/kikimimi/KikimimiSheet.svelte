<script lang="ts">
  // ききみみ クイズ's sheet (docs/kikimimi.md "UI"), its own chunk with the bank, the deck, the session and the strings:
  // full height (Sheet's `pop`), one title bar (the game's name, or the question 3 / 8; ✕) over one scroller showing
  // the game's phase: a notice (the host cancelled), the invite or my own lobby (idle), the lobby, the 3-2-1, a
  // question (Play), the results. Opened from せってい's あそぶ (a lobby of mine at once, unless someone's invite is
  // waiting) or the banner's さんか (that game joined). Mid-game a backdrop tap or Esc doesn't close it, and ✕ asks
  // 「やめる？」. The voice session is the opener's tap's (invite.svelte.ts openQuiz); closing ends it and drops every clip.
  import { untrack } from 'svelte';
  import '#lib/i18n/kikimimi.ts';
  import Sheet from '../ui/Sheet.svelte';
  import NavBar from '../ui/NavBar.svelte';
  import Host from '../characters/Host.svelte';
  import Lobby from './Lobby.svelte';
  import Play from './Play.svelte';
  import Results from './Results.svelte';
  import { QuizGame } from './game.svelte.ts';
  import { heardQuiz, quizLive } from './invite.svelte.ts';
  import type { Level } from '#lib/kikimimi/bank.ts';
  import type { QuizPhase } from '#lib/kikimimi/session.ts';
  import { voice, voiceSession } from '#lib/sound/sound.svelte.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { DEVICE, localKV } from '#lib/sync/storage.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { t } from '#lib/i18n/index.ts';
  import { hook, hooksOn } from '../island/devHooks.ts';

  let { open = $bindable(), join = null }: { open: boolean; join?: string | null } = $props();

  let game = $state.raw<QuizGame | null>(null);
  /** ✕ (or a backdrop tap, Esc) mid-game: 「やめる？」. */
  let asking = $state(false);
  const v = $derived(game?.view ?? null);
  const MID: readonly QuizPhase[] = ['countdown', 'lead', 'play', 'answer', 'reveal'];
  const mid = $derived(!!v && MID.includes(v.phase));
  const title = $derived(v?.phase === 'results' ? t('kiki.results') : v && v.i >= 0 && v.i < v.n && mid ? t('kiki.q', { i: v.i + 1, n: v.n }) : t('kiki.title'));

  /** The level last played on this phone (the next lobby's). */
  const lastLv = (): Level => {
    const n = Number(localKV()?.getItem(DEVICE.kikimimiLv));
    return n === 2 || n === 3 ? n : 1;
  };
  function keepLv(lv: Level) {
    try {
      localKV()?.setItem(DEVICE.kikimimiLv, String(lv));
    } catch {
      /* full or private: the next lobby starts at level 1 */
    }
  }

  // Each opening: a game of its own (what the island heard handed to it), joined or opened; closing leaves it.
  $effect(() => {
    if (!open) return;
    const me = untrack(() => week.view?.viewer);
    if (!me) return;
    const g = new QuizGame({ live: quizLive(), me, fast: hook('kikimimi') === 'fast', heard: heardQuiz() });
    untrack(() => {
      if (join) g.join(join);
      else if (!g.view.invite) g.open(lastLv());
    });
    game = g;
    if (hooksOn()) (window as unknown as { __kiki?: unknown }).__kiki = { view: () => g.view, right: () => g.items[g.view.i]?.answer ?? -1, items: () => g.items.map((it) => it.id) };
    return () => {
      g.dispose();
      voiceSession(false);
      game = null;
      asking = false;
    };
  });

  // Its open and close tunes (it mounts on the first tap, already open: that is an open too).
  let wasOpen = false;
  $effect(() => {
    const o = open;
    if (o === wasOpen) return;
    wasOpen = o;
    cue(o ? 'panel-open' : 'panel-close');
  });

  /** ✕: mid-game asks first; otherwise closes (my lobby is cancelled for everyone: the session's leave). */
  function requestClose() {
    if (mid) {
      cue('tick');
      asking = true;
    } else {
      cue('back');
      open = false;
    }
  }
  const dismiss = (): boolean => {
    if (!mid) return true;
    asking = true;
    return false;
  };
  function quit() {
    asking = false;
    open = false;
  }
  function closed() {
    if (toasts.current) toasts.dismiss();
  }
  /** Play again: the host opens a new lobby at the same level; another goes back to the invite (the host's next). */
  function again() {
    if (!game || !v) return;
    const host = v.amHost, lv = v.lv;
    game.close();
    if (host || !game.view.invite) game.open(lv as Level, v.same);
  }
  function startOwn() {
    game?.open(lastLv());
  }
  const hostName = (w: 'A' | 'B' | 'G') => {
    const view = week.view;
    return !view ? '' : w === 'G' ? view.guest.villagerName : view.people[w].villagerName;
  };
  /** The 3-2-1. */
  const count = $derived(v && v.phase === 'countdown' ? Math.max(1, Math.ceil((v.until - game!.now) / 1000)) : 0);
</script>

<Sheet bind:open label={t('kiki.title')} variant="pop" onclose={closed} ondismiss={dismiss}>
  <div class="titlebar"><NavBar {title} onclose={requestClose} sfx="self" /></div>
  <div class="kk-body" data-kikimimi data-phase={v?.phase} data-host={v?.amHost || undefined}>
    {#if game && v}
      {#if v.notice}
        <div class="center" data-kiki-notice={v.notice}>
          <Host pose="bow" size={96} />
          <p class="say">{t(`kiki.notice.${v.notice}`)}</p>
          <button type="button" class="btn small" data-sfx="back" onclick={() => game?.close()}>{t('kiki.back')}</button>
        </div>
      {:else if v.phase === 'idle'}
        <div class="center idle">
          <Host size={96} />
          {#if v.invite}
            <div class="invite card" data-kiki-invite={v.invite.g}>
              <p class="say">{t('kiki.invited', { name: hostName(v.invite.host) })}<small>{'★'.repeat(v.invite.lv)} {t(`kiki.lv.${v.invite.lv}`)}{#if v.invite.started} · {t('kiki.started')}{/if}</small></p>
              <button type="button" class="btn" data-kiki-join data-sfx="confirm" onclick={() => game?.join(v.invite!.g)}>{t('kiki.joinIt')}</button>
            </div>
          {/if}
          <button type="button" class="btn paper" data-kiki-own data-sfx="open" onclick={startOwn}>{t('kiki.openOwn')}</button>
        </div>
      {:else if v.phase === 'lobby'}
        <Lobby {game} onlevel={keepLv} />
      {:else if v.phase === 'countdown'}
        <div class="center count" data-kiki-count={count}>
          <Host pose="stand" size={110} />
          <p class="say">{t('kiki.ready')}</p>
          {#key count}<span class="num" aria-live="assertive">{count}</span>{/key}
        </div>
      {:else if v.phase === 'results'}
        <Results {game} onagain={again} ondone={() => (open = false)} />
      {:else}
        <Play {game} />
      {/if}
    {/if}
  </div>

  {#if asking}
    <div class="veil" role="alertdialog" aria-modal="true" aria-labelledby="kk-quit" data-kiki-quit>
      <div class="ask card">
        <h3 id="kk-quit">{t('kiki.quit')}</h3>
        <p>{t('kiki.quitBody')}</p>
        <div class="row">
          <button type="button" class="btn paper small" data-kiki-stay data-sfx="back" onclick={() => (asking = false)}>{t('kiki.quitNo')}</button>
          <button type="button" class="btn small" data-kiki-quit-yes data-sfx="confirm" onclick={quit}>{t('kiki.quitYes')}</button>
        </div>
      </div>
    </div>
  {:else if voice.on && voice.state !== 'running'}
    <!-- a lock or an app switch suspended the voice: a tap wakes it (inside the tap) -->
    <button type="button" class="veil resume" data-kiki-resume data-sfx="tick" onclick={() => voiceSession(true)}>
      <span class="ask card">
        <Host head size={52} animate={false} eager />
        <b>{t('kiki.resume')}</b>
        <small>{t('kiki.resumeBody')}</small>
      </span>
    </button>
  {/if}
</Sheet>

<style>
  .titlebar { flex: none; position: relative; z-index: 2; margin-bottom: 4px; }
  .titlebar::after {
    content: ''; position: absolute; left: -8px; right: -8px; top: 100%; height: 14px; pointer-events: none;
    background: linear-gradient(var(--surface), transparent);
  }
  /* the one scroller (as the other full-height sheets'): it bleeds 8px past the side padding so focus rings and lips show */
  .kk-body {
    flex: 1; min-height: 0; overflow: hidden auto; overscroll-behavior: contain;
    margin: 0 -8px; padding: 6px 8px var(--body-pad); display: flex; flex-direction: column; gap: 14px;
  }
  .kk-body > :global(*) { flex: none; }
  /* a level's actions stay at the foot of the screen, even on a short phase */
  .kk-body > :global(.level-acts) { margin-top: auto; }
  .card { border-radius: var(--r-card); background: var(--card); box-shadow: var(--sh-lip); }
  .center { display: grid; justify-items: center; align-content: center; gap: 14px; flex: 1 0 auto; text-align: center; padding: 12px 0; }
  .say { margin: 0; font: 700 var(--fs-talk)/1.4 var(--font-ui); }
  .say small { display: block; margin-top: 4px; font-size: var(--fs-s); color: var(--text-soft); }
  .idle .btn { width: 100%; }
  .invite { width: 100%; display: grid; gap: 12px; padding: 16px; box-sizing: border-box; }
  .num {
    font: 700 96px/1 var(--font-num, var(--font-ui)); color: var(--c-coral); text-shadow: 0 4px 0 var(--c-lip);
    animation: count 900ms var(--ease-bounce) both;
  }
  @keyframes count { from { transform: scale(1.6); opacity: 0; } 30% { opacity: 1; } to { transform: none; } }

  .veil {
    position: absolute; inset: 0; z-index: 5; display: grid; place-items: center; padding: 24px; border: 0; margin: 0;
    background: var(--scrim); appearance: none; font: inherit; color: inherit; width: 100%;
  }
  .veil .ask { display: grid; justify-items: center; gap: 10px; padding: 20px 18px 16px; width: min(100%, 320px); box-sizing: border-box; text-align: center; color: var(--text); }
  .ask h3 { margin: 0; font: 700 var(--fs-title)/1.2 var(--font-ui); }
  .ask p { margin: 0; font: 700 var(--fs-body)/1.4 var(--font-ui); color: var(--text-soft); }
  .ask .row { display: flex; gap: 10px; width: 100%; }
  .ask .row .btn { flex: 1; }
  .resume { cursor: pointer; }
  .resume b { font: 700 var(--fs-talk)/1.2 var(--font-ui); }
  .resume small { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  @media (prefers-reduced-motion: reduce) { .num { animation: none; } }
</style>
