<script lang="ts">
  // せってい → すがた (customization.md §3; docs/design.md "すがた"): this phone's person's look, edited in a preview and
  // sent once, as one `look` pref, when the level is left (‹, ✕, Esc, the backdrop; or the app going to the background).
  // A pinned head (the preview, よびな, もどす once something changed this visit) over one scroller: the コーデ strip
  // (いつもの ★ first, the saved looks newest first, ＋ ほぞん; the chip last tapped has ⋯: うわがき, なまえを かえる,
  // けす), the category chips, the colour filter (garments) and the closet's grids, and at the foot 「むらびとの すがたに
  // する」 (→ the villager picker: the parent pushes it over this level, which stays mounted under it). コーデ edits are
  // sent as they're made (store/look.ts). The guest has the same level, its own look and コーデ.
  import { untrack } from 'svelte';
  import type { WeekView } from '#lib/types.ts';
  import Sheet from '../ui/Sheet.svelte';
  import LookPreview from './LookPreview.svelte';
  import LookPortrait from './LookPortrait.svelte';
  import ClosetGrid from './ClosetGrid.svelte';
  import { roving } from '../ui/roving.ts';
  import { CATEGORIES, HUES, closet, itemKey, wear, type Category, type ClosetKind, type Hue } from './closet.ts';
  import {
    defaultLook, LOOK_LIMITS, lookName, playerOf, sameLook, type Look, type PartId, type PlayerLook, type SavedLook
  } from '#lib/contract/look.ts';
  import {
    deleteLook, myLook, mySavedLooks, overwriteLook, renameLook, saveLook, wearLook, wearUsual, wearVillager
  } from '#lib/store/look.ts';
  import { setVillagerName, undoBanner } from '#lib/store/actions.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { mine } from '#lib/ui-state/viewer.ts';
  import { t } from '#lib/i18n/index.ts';

  let { view, onvillager }: { view: WeekView; onvillager: () => void } = $props();

  const me = $derived(mine(view));
  const who = untrack(() => me.who);
  const usual = defaultLook(who);
  /** Two looks the same (a villager is one look: which villager is its own pref, sent as it's picked). */
  const same = (a: Look, b: Look) =>
    a.kind === b.kind && (a.kind === 'villager' || sameLook(playerOf(a, who), playerOf(b, who)));

  /** What was worn when the level opened (or last sent): もどす goes back to it, leaving sends only a change from it. */
  let begun = $state<Look>(untrack(myLook));
  let draft = $state<Look>(untrack(() => begun));
  const saved = $derived(mySavedLooks());
  const editing = $derived(playerOf(draft, who));
  const changed = $derived(!same(draft, begun));
  /** The chip last tapped (its ⋯): いつもの, a コーデ's id, or none. On opening, the one that matches what's worn. */
  const matchOf = (l: Look): string | null =>
    same(l, usual) ? 'usual' : l.kind === 'player' ? (untrack(mySavedLooks).find((s) => sameLook(s.look, playerOf(l, who)))?.id ?? null) : null;
  let picked = $state<string | null>(untrack(() => matchOf(begun)));
  const pickedSaved = $derived(saved.find((s) => s.id === picked) ?? null);
  /** The preview's look: a villager as the one picked now. */
  const shown = $derived<Look>(draft.kind === 'villager' ? { kind: 'villager', villager: me.villager } : draft);

  // ---- wearing (the preview only, until the level is left)
  /** The variant last chosen per item (a tile shows it). */
  const chosen = $state<Record<string, PartId>>({});
  function put(kind: ClosetKind, id: PartId | null) {
    if (id) chosen[itemKey(id)] = id;
    draft = { kind: 'player', ...wear(editing, kind, id) };
  }
  function set<K extends 'hairColor' | 'eyeColor' | 'skin' | 'cheek' | 'nose'>(k: K, v: PlayerLook[K]) {
    draft = { kind: 'player', ...editing, [k]: v };
  }
  function wearUsualChip() {
    draft = usual;
    picked = 'usual';
  }
  function wearChip(s: SavedLook) {
    draft = { kind: 'player', ...s.look };
    picked = s.id;
  }
  function revert() {
    draft = begun;
    picked = matchOf(begun);
  }
  function toVillager() {
    draft = { kind: 'villager', villager: null };
    picked = who === 'G' ? 'usual' : null;
    onvillager();
  }

  /** Send the look worn if it changed since it was last sent: the guest's villager is its いつもの (no pref). */
  function commit() {
    if (same(draft, begun)) return;
    const r = draft.kind === 'villager' ? (who === 'G' ? wearUsual() : wearVillager()) : wearLook(playerOf(draft, who));
    if (r.ok) begun = draft;
  }

  // ---- よびな (as the villager picker's: saved on blur and on the way out)
  let name = $state(untrack(() => me.villagerName));
  function saveName() {
    if (name.trim() && name.trim() !== me.villagerName) setVillagerName(name);
  }
  $effect(() => {
    const hide = () => document.visibilityState === 'hidden' && untrack(commit);
    document.addEventListener('visibilitychange', hide);
    return () => {
      document.removeEventListener('visibilitychange', hide);
      untrack(() => (saveName(), commit()));
    };
  });

  // ---- コーデ: ＋ ほぞん and the ⋯ card (a small sheet over the level: the menu, a name, the delete's confirm)
  let card = $state<'save' | 'menu' | 'rename' | 'confirm' | null>(null);
  let cardOpen = $state(false);
  let cardName = $state('');
  const nameOk = $derived(lookName(cardName) !== null);
  function openCard(mode: 'save' | 'menu' | 'rename' | 'confirm') {
    card = mode;
    cardOpen = true;
  }
  function closeCard() {
    cardOpen = false;
  }
  function askSave() {
    if (draft.kind !== 'player') return;
    if (saved.length >= LOOK_LIMITS.saved) return toasts.show(t('look.full', { n: LOOK_LIMITS.saved }), 2600, { reaction: 'sorry' });
    const names = new Set(saved.map((s) => s.name));
    let n = saved.length + 1;
    while (names.has(t('look.defaultName', { n }))) n++;
    cardName = t('look.defaultName', { n });
    openCard('save');
  }
  function doSave() {
    const r = saveLook(cardName, editing);
    if (!r.ok) {
      if (r.why === 'full') toasts.show(t('look.full', { n: LOOK_LIMITS.saved }), 2600, { reaction: 'sorry' });
      return;
    }
    picked = r.id ?? null;
    closeCard();
    toasts.show(t('look.saved'), 2000, { reaction: 'pleased', low: true });
  }
  function doOverwrite() {
    if (!pickedSaved || !overwriteLook(pickedSaved.id, editing).ok) return;
    closeCard();
    toasts.show(t('look.overwritten'), 2000, { reaction: 'pleased', low: true });
  }
  function askRename() {
    cardName = pickedSaved?.name ?? '';
    card = 'rename';
  }
  function doRename() {
    if (pickedSaved && renameLook(pickedSaved.id, cardName).ok) closeCard();
  }
  function doDelete() {
    if (!pickedSaved) return;
    const r = deleteLook(pickedSaved.id);
    closeCard();
    if (!r.ok) return;
    picked = null;
    undoBanner(t('look.deleted'), r);
  }
  const cardTitle = $derived(
    card === 'save' ? t('look.saveTitle') : card === 'rename' ? t('look.renameTitle') : (pickedSaved?.name ?? '')
  );

  // ---- the closet
  let cat = $state<Category>('tops');
  let hue = $state<Hue | null>(null);
  const KINDS: Record<Category, ClosetKind[]> = {
    face: ['eye', 'mouth'], hair: ['hair'], tops: ['top'], bottoms: ['bottom'], onepiece: ['onepiece'],
    socks: ['socks'], shoes: ['shoes'], acc: ['glasses', 'ornament']
  };
  const garments = $derived(cat !== 'face' && cat !== 'hair');
  const colours = closet().colours;
</script>

{#snippet swatches(k: 'hairColor' | 'eyeColor' | 'skin')}
  <div class="sub">
    <h3 class="sub-label" id="look-{k}">{t(`look.colour.${k}`)}</h3>
    <div class="swatches" role="radiogroup" aria-labelledby="look-{k}" data-colour={k} {@attach roving}>
      {#each colours[k] as c, i (c)}
        {@const on = editing[k] === c}
        <button type="button" class="dot" role="radio" aria-checked={on} tabindex={on || (!colours[k].includes(editing[k]) && i === 0) ? 0 : -1}
          aria-label={t('look.swatch', { n: i + 1 })} data-hex={c} data-sfx={on ? 'none' : 'tick'} style:--sw={c} onclick={() => set(k, c)}></button>
      {/each}
    </div>
  </div>
{/snippet}

{#snippet shapes(k: 'cheek' | 'nose')}
  <div class="sub">
    <h3 class="sub-label" id="look-{k}">{t(`look.${k}`)}</h3>
    <div class="chips" role="radiogroup" aria-labelledby="look-{k}" data-shape={k} {@attach roving}>
      {#each [0, 1, 2] as const as s (s)}
        {@const on = editing[k] === s}
        <button type="button" class="chip big" role="radio" aria-checked={on} tabindex={on ? 0 : -1} data-sfx={on ? 'none' : 'tick'}
          onclick={() => set(k, s)}>{t(`look.${k}.${s}`)}</button>
      {/each}
    </div>
  </div>
{/snippet}

<div class="look" data-look-page={who}>
  <div class="head">
    <LookPreview {who} look={shown} />
    <div class="side">
      <label class="namefield">
        <span>{t('panel.nickname')}</span>
        <input class="name" type="text" maxlength="12" data-sfx="none" bind:value={name} onblur={saveName}
          onkeydown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()} enterkeyhint="done" />
      </label>
      {#if changed}
        <button type="button" class="btn small paper revert" data-look-revert aria-label={t('look.revertLabel')} data-sfx="back" onclick={revert}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7 4 12l5 5M4.5 12H14a6 6 0 0 1 0 12h-1" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" transform="translate(0 -3)" /></svg>
          {t('look.revert')}
        </button>
      {/if}
    </div>
  </div>

  <div class="scroll">
    <section class="strip-sec" aria-labelledby="look-strip">
      <h3 class="sub-label" id="look-strip">{t('look.strip')}</h3>
      <ul class="strip" data-looks>
        <li class="coord" class:on={picked === 'usual'}>
          <button type="button" class="pick" aria-pressed={picked === 'usual'} data-look-chip="usual" data-sfx="tick" onclick={wearUsualChip}>
            <LookPortrait {who} look={usual} size={60} />
            <span class="cn"><span class="star" aria-hidden="true">★</span>{t('look.usual')}</span>
          </button>
        </li>
        {#each saved as s (s.id)}
          <li class="coord" class:on={picked === s.id}>
            <button type="button" class="pick" aria-pressed={picked === s.id} data-look-chip={s.id} data-sfx="tick" onclick={() => wearChip(s)}>
              <LookPortrait {who} look={{ kind: 'player', ...s.look }} size={60} />
              <span class="cn">{s.name}</span>
            </button>
            {#if picked === s.id}
              <button type="button" class="more" aria-label={t('look.more', { name: s.name })} aria-haspopup="dialog" data-look-more data-sfx="open"
                onclick={() => openCard('menu')}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="12" r="2.2" /><circle cx="12" cy="12" r="2.2" /><circle cx="18" cy="12" r="2.2" /></svg>
              </button>
            {/if}
          </li>
        {/each}
        <li class="coord">
          <!-- full: sunk but still taking the tap, to say why (.off); a villager has nothing to save (aria-disabled) -->
          <button type="button" class="pick add" class:off={saved.length >= LOOK_LIMITS.saved} aria-disabled={draft.kind !== 'player'} data-look-save
            data-sfx={saved.length >= LOOK_LIMITS.saved ? 'none' : 'open'} onclick={askSave}>
            <span class="plus" aria-hidden="true">＋</span>
            <span class="cn">{t('look.save')}</span>
          </button>
        </li>
      </ul>
    </section>

    <div class="cats" role="radiogroup" aria-label={t('panel.look')} {@attach roving}>
      {#each CATEGORIES as c (c)}
        {@const on = cat === c}
        <button type="button" class="chip big" role="radio" aria-checked={on} tabindex={on ? 0 : -1} data-cat={c} data-sfx={on ? 'none' : 'tick'}
          onclick={() => ((cat = c), (hue = null))}>{t(`look.cat.${c}`)}</button>
      {/each}
    </div>

    {#if garments}
      <div class="hues" role="radiogroup" aria-label={t('look.filter')} {@attach roving}>
        {#each [null, ...HUES] as h (h)}
          {@const on = hue === h}
          <button type="button" class="chip" role="radio" aria-checked={on} tabindex={on ? 0 : -1} data-hue={h ?? 'all'} data-sfx={on ? 'none' : 'tick'}
            onclick={() => (hue = h)}>{#if h}<i class="hd hue-{h}" aria-hidden="true"></i>{/if}{t(`look.hue.${h ?? 'all'}`)}</button>
        {/each}
      </div>
    {/if}

    <div class="closet" data-cat-panel={cat}>
      {#if cat === 'face'}
        <div class="sub"><h3 class="sub-label">{t('look.kind.eye')}</h3><ClosetGrid kind="eye" look={editing} hue={null} {chosen} onwear={put} /></div>
        {@render swatches('eyeColor')}
        <div class="sub"><h3 class="sub-label">{t('look.kind.mouth')}</h3><ClosetGrid kind="mouth" look={editing} hue={null} {chosen} onwear={put} /></div>
        {@render swatches('skin')}
        {@render shapes('cheek')}
        {@render shapes('nose')}
      {:else if cat === 'hair'}
        <div class="sub"><h3 class="sub-label">{t('look.kind.hair')}</h3><ClosetGrid kind="hair" look={editing} hue={null} {chosen} onwear={put} /></div>
        {@render swatches('hairColor')}
      {:else}
        {#each KINDS[cat] as k (k)}
          <div class="sub">
            {#if KINDS[cat].length > 1}<h3 class="sub-label">{t(`look.kind.${k}`)}</h3>{/if}
            <ClosetGrid kind={k} look={editing} {hue} {chosen} onwear={put} />
          </div>
        {/each}
      {/if}
    </div>

    <div class="foot">
      <button type="button" class="btn small paper" data-push="villager" data-sfx="page" onclick={toVillager}>
        {t('look.villager')}
      </button>
    </div>
  </div>
</div>

<Sheet bind:open={cardOpen} label={cardTitle} title={cardTitle} onclose={() => (card = null)}>
  {#if card === 'menu' && pickedSaved}
    <div class="menu" data-look-card="menu">
      <button type="button" class="btn paper" data-look-overwrite aria-disabled={sameLook(pickedSaved.look, editing) || draft.kind !== 'player'}
        data-sfx="confirm" onclick={() => !sameLook(pickedSaved.look, editing) && draft.kind === 'player' && doOverwrite()}>{t('look.overwrite')}</button>
      <button type="button" class="btn paper" data-look-rename data-sfx="page" onclick={askRename}>{t('look.rename')}</button>
      <button type="button" class="btn paper" data-look-delete data-sfx="page" onclick={() => (card = 'confirm')}>{t('look.delete')}</button>
    </div>
  {:else if card === 'confirm' && pickedSaved}
    <div class="ask" data-look-card="confirm">
      <LookPortrait {who} look={{ kind: 'player', ...pickedSaved.look }} size={72} />
      <p>{t('look.deleteAsk')}</p>
    </div>
  {:else if card === 'save' || card === 'rename'}
    <form class="nameform" data-look-card={card} onsubmit={(e) => (e.preventDefault(), nameOk && (card === 'save' ? doSave() : doRename()))}>
      <LookPortrait {who} look={card === 'save' ? draft : { kind: 'player', ...(pickedSaved?.look ?? editing) }} size={72} />
      <label class="namefield">
        <span>{t('look.name')}</span>
        <!-- svelte-ignore a11y_autofocus -->
        <input class="name" type="text" maxlength={LOOK_LIMITS.nameMaxChars} data-look-name data-sfx="none" bind:value={cardName} autofocus enterkeyhint="done" />
      </label>
    </form>
  {/if}
  {#snippet footer()}
    {#if card === 'confirm'}
      <div class="two">
        <button type="button" class="btn paper" data-sfx="back" onclick={closeCard}>{t('look.cancel')}</button>
        <button type="button" class="btn" data-look-confirm data-sfx="confirm" onclick={doDelete}>{t('look.delete')}</button>
      </div>
    {:else if card === 'save' || card === 'rename'}
      <div class="two">
        <button type="button" class="btn paper" data-sfx="back" onclick={closeCard}>{t('look.cancel')}</button>
        <button type="button" class="btn" data-look-ok aria-disabled={!nameOk} data-sfx={nameOk ? 'confirm' : 'none'}
          onclick={() => nameOk && (card === 'save' ? doSave() : doRename())}>{t('look.ok')}</button>
      </div>
    {/if}
  {/snippet}
</Sheet>

<style>
  /* Fills the pushed page: the head holds still, the rest scrolls under it (as the villager picker). */
  .look { flex: 1; min-height: 0; display: flex; flex-direction: column; }
  .head { flex: none; position: relative; z-index: 1; display: flex; align-items: flex-end; gap: 12px; padding-bottom: 6px; }
  .head::after {
    content: ''; position: absolute; left: -8px; right: -8px; top: 100%; height: 12px; pointer-events: none;
    background: linear-gradient(var(--surface), transparent);
  }
  .side { flex: 1; min-width: 0; display: grid; gap: 8px; align-content: end; }
  .namefield { display: grid; gap: 4px; }
  .namefield span { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  /* 16px so Safari doesn't zoom */
  .name {
    width: 100%; min-height: 48px; border-radius: var(--r-btn); border: 0; font-size: var(--fs-input);
    background: var(--c-card); color: var(--c-ink); padding: 0 14px; font-weight: 700; box-shadow: inset 0 0 0 2px var(--c-edge), inset 0 4px 0 var(--c-lip);
  }
  .name:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .revert { justify-self: start; margin: 0 0 4px; }
  .scroll {
    flex: 1; min-height: 0; overflow: hidden auto; overscroll-behavior: contain;
    margin: 0 -8px; padding: 8px 8px var(--body-pad); display: flex; flex-direction: column; gap: 12px;
  }
  .scroll > * { flex: none; }
  .sub { display: grid; gap: 8px; }
  .sub-label { margin: 2px 4px 0; font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); letter-spacing: .04em; }

  /* the コーデ strip: one row of 60px portraits, names under them, scrolling sideways */
  .strip-sec { display: grid; gap: 6px; }
  .strip {
    list-style: none; margin: 0 -8px; padding: 4px 8px 6px; display: flex; gap: 10px; overflow: auto hidden;
    scrollbar-width: none; overscroll-behavior-x: contain;
  }
  .strip::-webkit-scrollbar { display: none; }
  .coord { flex: none; position: relative; width: 72px; }
  .pick {
    appearance: none; border: 0; background: none; padding: 4px 0 0; cursor: pointer; width: 100%; display: grid; justify-items: center; gap: 4px;
    color: var(--text); font: 700 var(--fs-s)/1.2 var(--font-ui); border-radius: var(--r-card);
  }
  .pick :global(.av), .pick :global(.pt) { box-shadow: 0 0 0 3px transparent; transition: box-shadow var(--dur-quick); }
  .coord.on .pick :global(.av), .coord.on .pick :global(.pt) { box-shadow: 0 0 0 4px var(--c-leaf-edge); }
  .pick:active { transform: scale(1.04, .96); }
  .pick:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .cn { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .star { color: var(--c-yuzu-lip); margin-right: 1px; }
  .add .plus {
    width: 60px; height: 60px; display: grid; place-items: center; border-radius: 50%; font-size: 26px;
    background: var(--ctl); box-shadow: var(--sh-ctl);
  }
  .add:is(.off, [aria-disabled='true']) { color: var(--text-soft); }
  .add:is(.off, [aria-disabled='true']) .plus { background: var(--ctl-off); box-shadow: none; }
  .more {
    position: absolute; top: -2px; right: 0; width: 32px; height: 32px; border: 0; padding: 0; border-radius: 50%; cursor: pointer;
    display: grid; place-items: center; background: var(--ctl-sel); color: var(--c-ink); box-shadow: var(--sh-ctl);
  }
  .more::after { content: ''; position: absolute; inset: -6px; }
  .more svg { width: 18px; height: 18px; fill: currentColor; }

  /* the category chips: one row, each ≥ 44px, held at the top of the scroller as the closet scrolls */
  .cats {
    position: sticky; top: -8px; z-index: 1; display: flex; gap: 6px; overflow: auto hidden; scrollbar-width: none;
    margin: 0 -8px; padding: 8px 8px 8px; background: linear-gradient(var(--surface) 80%, transparent);
  }
  .cats::-webkit-scrollbar { display: none; }
  .cats .chip { flex: none; }
  .hues { display: flex; gap: 6px; overflow: auto hidden; scrollbar-width: none; margin: -4px -8px 0; padding: 4px 8px; }
  .hues::-webkit-scrollbar { display: none; }
  .hues .chip { flex: none; min-height: 40px; }
  .hd { width: 12px; height: 12px; border-radius: 50%; box-shadow: inset 0 0 0 1.5px rgb(0 0 0 / .18); display: inline-block; }
  .hue-red { background: #e04848; } .hue-yellow { background: #f2c94c; } .hue-green { background: #5fae5a; } .hue-blue { background: #4f7fd0; }
  .hue-purple { background: #9b6fd0; } .hue-pink { background: #f29ab8; } .hue-brown { background: #8a5a36; } .hue-white { background: #fafafa; }
  .hue-black { background: #2a2a2a; }
  .closet { display: grid; gap: 14px; }
  .swatches { display: flex; flex-wrap: wrap; gap: 4px; }
  .dot { appearance: none; cursor: pointer; border: 0; padding: 0; width: 44px; height: 44px; border-radius: 50%; position: relative; background: none; }
  .dot::before { content: ''; position: absolute; inset: 6px; border-radius: 50%; background: var(--sw); box-shadow: inset 0 0 0 2px rgb(0 0 0 / .16); }
  .dot[aria-checked='true']::before { box-shadow: inset 0 0 0 2px rgb(0 0 0 / .16), 0 0 0 3px var(--surface), 0 0 0 6px var(--c-leaf-edge); }
  .foot { display: flex; justify-content: center; padding: 10px 0 4px; }

  /* the ⋯ card */
  .menu { display: grid; gap: 10px; padding-bottom: 8px; }
  .menu .btn { margin: 0 0 4px; }
  .ask, .nameform { display: grid; justify-items: center; gap: 10px; padding: 0 0 8px; text-align: center; }
  .ask p { margin: 0; font-weight: 700; line-height: 1.6; }
  .nameform .namefield { width: 100%; text-align: left; }
  .two { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .two .btn { margin: 0; }
</style>
