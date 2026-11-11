<script lang="ts">
  // せってい → すがた (docs/players.md "The dresser"; docs/design.md "すがた"): one dresser. The stage on top (LookStage:
  // the final form, its status in words, もどす, the nameplate, the tapped item's colours), six tabs (コーデ · かお · かみ
  // · ふく · こもの · むらびと), a sub-row where a tab has one, then the panel (a grid, the コーデ, the villagers), which
  // scrolls to the screen's foot. What's tapped is worn on the stage (the draft: a villager too); leaving the level (‹,
  // ✕, Esc, the backdrop, the app hidden) keeps it, sent once: `look`, and `villager` first when a villager was picked
  // (the guest's villager is its いつもの: `villager`, then `look: null`). Leaving with a change shows 「すがたを
  // かえたよ」 with とりけす (it re-sends what was worn when the level opened). コーデ edits (ほぞん, うわがき, なまえ, けす)
  // go out as they're made (store/look.ts). The guest has the same level, its own look and コーデ.
  import { tick, untrack } from 'svelte';
  import type { WeekView } from '#lib/types.ts';
  import Sheet from '../ui/Sheet.svelte';
  import LookStage from './LookStage.svelte';
  import LookPortrait from './LookPortrait.svelte';
  import ClosetGrid from './ClosetGrid.svelte';
  import VillagerGrid from './VillagerGrid.svelte';
  import { roving } from '../ui/roving.ts';
  import { HUES, closet, itemKey, wear, wornIn, type ClosetItem, type ClosetKind, type Hue } from './closet.ts';
  import { KIND_OF, SUBS, TABS, dotNames, firstTab, statusOf, type Sub, type Tab } from './tabs.ts';
  import {
    defaultLook, LOOK_LIMITS, lookName, playerOf, sameLook, type Hex, type Look, type PartId, type PlayerLook
  } from '#lib/contract/look.ts';
  import {
    deleteLook, myLook, mySavedLooks, overwriteLook, renameLook, restoreLook, saveLook, wearLook, wearUsual, wearVillager
  } from '#lib/store/look.ts';
  import { setVillager, setVillagerName, undoBanner } from '#lib/store/actions.ts';
  import { ROSTER, type RosterId } from '#lib/villagers/roster.ts';
  import { resolveLook as resolveVillager } from '#lib/villagers/look.ts';
  import { PERSONALITIES, SPECIAL, SPECIES } from '#lib/villagers/species.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { mine } from '#lib/ui-state/viewer.ts';
  import { i18n, t } from '#lib/i18n/index.ts';

  let { view }: { view: WeekView } = $props();

  const me = $derived(mine(view));
  const who = untrack(() => me.who);
  const guest = who === 'G';
  const usual = defaultLook(who);

  /** A look with its villager named (a villager look's `villager` the roster id worn). */
  const named = (l: Look, villager: string): Look => (l.kind === 'villager' ? { kind: 'villager', villager } : l);
  /** Two looks the same (a villager look: the same villager). */
  const same = (a: Look, b: Look) =>
    a.kind === b.kind && (a.kind === 'villager' ? a.villager === (b as typeof a).villager : sameLook(playerOf(a, who), playerOf(b, who)));

  /** The villager pref when the level opened (or last sent), and the look then: もどす goes back to both; leaving sends
   *  only a change from them. `opened`: as the level opened (the banner's とりけす). */
  let begunVillager = $state<string>(untrack(() => resolveVillager({ villager: me.villager, person: who }).id));
  let begun = $state<Look>(named(untrack(myLook), untrack(() => begunVillager)));
  const opened = { look: untrack(() => begun), villager: untrack(() => begunVillager) };
  let draft = $state<Look>(untrack(() => begun));
  /** The human look being dressed: the draft's, or (a villager worn) the last one, which the first human pick wears. */
  let human = $state<PlayerLook>(untrack(() => playerOf(begun, who)));
  const saved = $derived(mySavedLooks());
  const changed = $derived(!same(draft, begun));
  const wornVillager = $derived(draft.kind === 'villager' ? (draft.villager as RosterId) : null);

  /** The コーデ a look is exactly: 'usual', a コーデ's id, or null. */
  const matchOf = (l: Look): string | null =>
    l.kind === 'villager' ? (guest ? 'usual' : null)
    : !guest && same(l, usual) ? 'usual'
    : (untrack(mySavedLooks).find((s) => sameLook(s.look, playerOf(l, who)))?.id ?? null);
  /** The コーデ last picked this visit (or matched on opening): its ring, its action card, the pill's 「… · アレンジちゅう」. */
  let picked = $state<string | null>(untrack(() => matchOf(begun)));
  const pickedSaved = $derived(saved.find((s) => s.id === picked) ?? null);
  /** Whether the draft differs from the コーデ picked (its coral dot, うわがき). */
  const pickedEdited = $derived(
    picked === 'usual' ? !same(draft, named(usual, wornVillager ?? '')) && !(guest && draft.kind === 'villager')
    : pickedSaved ? draft.kind !== 'player' || !sameLook(pickedSaved.look, playerOf(draft, who))
    : false
  );

  // ---- the status pill and the stage's words
  const lang = $derived(i18n.locale === 'ja' ? 0 : 1);
  const vName = (id: RosterId) => (lang === 0 ? ROSTER[id].nameJa : ROSTER[id].nameEn);
  const vKind = (id: RosterId) => {
    const { species, personality } = ROSTER[id];
    return species && personality ? `${SPECIES[species][lang]} · ${PERSONALITIES[personality][lang]}` : SPECIAL[lang];
  };
  const nameOfChip = (id: string | null) => (id === 'usual' ? t('look.usual') : (saved.find((s) => s.id === id)?.name ?? null));
  const status = $derived.by(() => {
    const exact = draft.kind === 'player' ? matchOf(draft) : null;
    return statusOf({ villager: draft.kind === 'villager', guest, exact: exact === 'usual' ? 'usual' : nameOfChip(exact), from: nameOfChip(picked) });
  });
  const statusText = $derived(
    status.kind === 'usual' ? t('look.usual')
    : status.kind === 'saved' ? status.name
    : status.kind === 'edited' ? t('look.status.edited', { name: status.from ?? '' })
    : status.kind === 'none' ? t('look.status.none')
    : t(status.usual ? 'look.status.guestVillager' : 'look.status.villager', { name: wornVillager ? vName(wornVillager) : '' })
  );

  // ---- wearing (the stage only, until the level is left)
  /** The variant last chosen per item (a tile shows it). */
  const chosen = $state<Record<string, PartId>>({});
  function put(kind: ClosetKind, id: PartId | null) {
    if (id) chosen[itemKey(id)] = id;
    human = wear(human, kind, id);
    draft = { kind: 'player', ...human };
  }
  function set<K extends 'hairColor' | 'eyeColor' | 'skin' | 'cheek' | 'nose'>(k: K, v: PlayerLook[K]) {
    human = { ...human, [k]: v };
    draft = { kind: 'player', ...human };
  }
  function wearChip(id: string) {
    if (id === 'usual') {
      draft = guest ? { kind: 'villager', villager: wornVillager ?? begunVillager } : usual;
      if (usual.kind === 'player') human = playerOf(usual, who);
    } else {
      const s = saved.find((x) => x.id === id);
      if (!s) return;
      human = { ...s.look };
      draft = { kind: 'player', ...s.look };
    }
    picked = id;
  }
  function pickVillager(id: RosterId) {
    draft = { kind: 'villager', villager: id };
    picked = guest ? 'usual' : null;
  }
  function revert() {
    draft = begun;
    human = playerOf(begun, who);
    picked = matchOf(begun);
  }

  /** Send what's worn if it changed since it was last sent; true if anything went out. */
  function commit(): boolean {
    if (same(draft, begun)) return false;
    let r;
    if (draft.kind === 'villager') {
      const id = draft.villager!;
      if (guest) {
        r = id !== begunVillager ? setVillager(id) : { ok: true };
        if (r.ok) r = wearUsual();
      } else r = wearVillager(id !== begunVillager ? id : undefined);
      if (r.ok) begunVillager = id;
    } else r = wearLook(playerOf(draft, who));
    if (r.ok) begun = draft;
    return r.ok;
  }

  // ---- よびな: the nameplate's sheet
  function saveNick() {
    const n = cardName.trim();
    if (n && n !== me.villagerName) setVillagerName(n);
    closeCard();
  }

  $effect(() => {
    const hide = () => document.visibilityState === 'hidden' && untrack(commit);
    document.addEventListener('visibilitychange', hide);
    return () => {
      document.removeEventListener('visibilitychange', hide);
      untrack(() => {
        commit();
        // left with a change since the level opened: say so, with とりけす (what was worn then, sent again)
        if (!same(draft, opened.look)) {
          undoBanner(t('look.changed'), { ok: true, undo: () => restoreLook(opened.look, opened.villager).ok });
        }
      });
    };
  });

  // ---- コーデ: ＋ ほぞん, the action card's なまえ / けす, and the name sheet (a small sheet over the level)
  let card = $state<'save' | 'rename' | 'confirm' | 'nick' | null>(null);
  let cardOpen = $state(false);
  let cardName = $state('');
  const nameOk = $derived(card === 'nick' ? cardName.trim().length > 0 : lookName(cardName) !== null);
  function openCard(mode: 'save' | 'rename' | 'confirm' | 'nick') {
    card = mode;
    cardOpen = true;
  }
  function closeCard() {
    cardOpen = false;
  }
  function askNick() {
    cardName = me.villagerName;
    openCard('nick');
  }
  function askSave() {
    if (draft.kind !== 'player') return toasts.show(t('look.noSaveVillager'), 2600, { reaction: 'sorry' });
    if (saved.length >= LOOK_LIMITS.saved) return toasts.show(t('look.full', { n: LOOK_LIMITS.saved }), 2600, { reaction: 'sorry' });
    const names = new Set(saved.map((s) => s.name));
    let n = saved.length + 1;
    while (names.has(t('look.defaultName', { n }))) n++;
    cardName = t('look.defaultName', { n });
    openCard('save');
  }
  async function doSave() {
    const r = saveLook(cardName, human);
    if (!r.ok) {
      if (r.why === 'full') toasts.show(t('look.full', { n: LOOK_LIMITS.saved }), 2600, { reaction: 'sorry' });
      return;
    }
    picked = r.id ?? null;
    closeCard();
    toasts.show(t('look.saved'), 2000, { reaction: 'pleased', low: true });
    await tick();
    document.querySelector<HTMLElement>(`[data-look-chip="${r.id}"]`)?.focus({ preventScroll: true });
  }
  function doOverwrite() {
    if (!pickedSaved || draft.kind !== 'player' || !overwriteLook(pickedSaved.id, human).ok) return;
    toasts.show(t('look.overwritten'), 2000, { reaction: 'pleased', low: true });
  }
  function askRename() {
    cardName = pickedSaved?.name ?? '';
    openCard('rename');
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
    card === 'save' ? t('look.saveTitle') : card === 'rename' ? t('look.renameTitle') : card === 'nick' ? t('panel.nickname') : (pickedSaved?.name ?? '')
  );
  function submitCard() {
    if (!nameOk) return;
    if (card === 'save') void doSave();
    else if (card === 'rename') doRename();
    else if (card === 'nick') saveNick();
  }

  // ---- tabs, sub-rows, the panel
  let tab = $state<Tab>(firstTab(untrack(() => saved.length)));
  const subs = $state<Record<Tab, Sub | null>>({ coord: null, face: 'eye', hair: null, wear: 'tops', acc: 'glasses', villager: null });
  const sub = $derived(subs[tab]);
  /** The closet grid the panel lists (null: not a grid). */
  const kind = $derived<ClosetKind | null>(tab === 'hair' ? 'hair' : sub ? KIND_OF[sub] : null);
  const garment = $derived(tab === 'wear' || tab === 'acc');
  /** The colour filter, per sub for the visit. */
  const hues = $state<Partial<Record<Sub, Hue | null>>>({});
  /** The tabs opened this visit: each kept (hidden) once opened, so a switch is a show and a hide. */
  const visited = $state<Partial<Record<Tab, true>>>({ [untrack(() => tab)]: true });
  let panel = $state<HTMLElement | null>(null);
  function goTab(t: Tab) {
    if (t === tab) return;
    tab = t;
    visited[t] = true;
    panel?.scrollTo({ top: 0 });
  }
  function goSub(s: Sub) {
    if (sub === s) return;
    subs[tab] = s;
    panel?.scrollTo({ top: 0 });
  }
  const TAB_CAT: Partial<Record<Tab, string>> = { face: 'face', hair: 'hair', acc: 'acc' };
  const SUB_CAT: Partial<Record<Sub, string>> = { tops: 'tops', bottoms: 'bottoms', onepiece: 'onepiece', socks: 'socks', shoes: 'shoes', hat: 'hat' };
  const subLabel = (s: Sub) =>
    s === 'nose' || s === 'cheek' ? t(`look.${s}`) : s === 'skin' ? t('look.colour.skin') : t(`look.kind.${KIND_OF[s]!}`);

  // ---- the stage's height: compact once the panel scrolls, a strip while the villager search has the keyboard
  let compact = $state(false);
  let searching = $state(false);
  function scrolled(e: Event) {
    const el = e.currentTarget as HTMLElement;
    if (!compact && el.scrollTop > 8 && el.scrollHeight - el.clientHeight > 130) compact = true;
    else if (compact && el.scrollTop <= 2) compact = false;
  }
  const mode = $derived(searching ? 'strip' : compact ? 'compact' : 'full');

  // ---- the stage's colour dots: the item last tapped in this grid (else the one worn), or めのいろ / かみのいろ
  const tapped = $state<Partial<Record<ClosetKind, string | null>>>({});
  function onTap(k: ClosetKind, item: ClosetItem | null) {
    tapped[k] = item?.key ?? null;
  }
  const dotItem = $derived.by(() => {
    if (!kind || !garment || draft.kind !== 'player') return null;
    const key = tapped[kind];
    const item = key !== undefined
      ? (key === null ? null : closet().items(kind).find((i) => i.key === key) ?? null)
      : (closet().find(wornIn(human, kind))?.item ?? null);
    return item && item.variants.length > 1 ? item : null;
  });
  const colourKey = $derived<'eyeColor' | 'hairColor' | null>(draft.kind !== 'player' ? null : tab === 'hair' ? 'hairColor' : tab === 'face' && sub === 'eye' ? 'eyeColor' : null);
  const colours = closet().colours;
  const hueLabel = (h: { hue: Hue; n: number | null }) => t(`look.hue.${h.hue}`) + (h.n ? ` ${h.n}` : '');
  const dotLabel = $derived(dotItem ? t('look.colours', { name: t(`look.kind.${dotItem.kind}`) }) : colourKey ? t(`look.colour.${colourKey}`) : '');
</script>

{#snippet swatchRow(k: 'hairColor' | 'eyeColor' | 'skin', big: boolean)}
  {@const names = dotNames(colours[k] as Hex[])}
  <div class="swatches" class:big role="radiogroup" aria-label={t(`look.colour.${k}`)} data-colour={k} {@attach roving}>
    {#each colours[k] as c, i (c)}
      {@const on = human[k] === c}
      <button type="button" class="dot" role="radio" aria-checked={on} tabindex={on || (!colours[k].includes(human[k]) && i === 0) ? 0 : -1}
        aria-label={hueLabel(names[i])} data-hex={c} data-sfx={on ? 'none' : 'tick'} style:--sw={c} onclick={() => set(k, c)}></button>
    {/each}
  </div>
{/snippet}

{#snippet stageDots()}
  {#if dotItem}
    {@const item = dotItem}
    {@const names = dotNames(item.variants.map((v) => v.swatch))}
    {@const worn = wornIn(human, item.kind)}
    <div class="swatches" role="radiogroup" aria-label={dotLabel} data-colours={item.key} {@attach roving}>
      {#each item.variants as v, i (v.id)}
        {@const on = v.id === worn}
        <button type="button" class="dot" role="radio" aria-checked={on} tabindex={on || (!item.variants.some((x) => x.id === worn) && i === 0) ? 0 : -1}
          aria-label={hueLabel(names[i])} data-part={v.id} data-sfx={on ? 'none' : 'tick'} style:--sw={v.swatch} onclick={() => !on && put(item.kind, v.id)}></button>
      {/each}
    </div>
  {:else if colourKey}
    {@render swatchRow(colourKey, false)}
  {/if}
{/snippet}

{#snippet shapes(k: 'cheek' | 'nose')}
  <div class="chips shapes" role="radiogroup" aria-label={t(`look.${k}`)} data-shape={k} {@attach roving}>
    {#each [0, 1, 2] as const as s (s)}
      {@const on = human[k] === s}
      <button type="button" class="chip big" role="radio" aria-checked={on} tabindex={on ? 0 : -1} data-sfx={on ? 'none' : 'tick'}
        onclick={() => set(k, s)}>{t(`look.${k}.${s}`)}</button>
    {/each}
  </div>
{/snippet}

{#snippet tabBody(tb: Tab)}
  {@const sb = subs[tb]}
  {@const kd = tb === 'hair' ? 'hair' : sb ? KIND_OF[sb] : null}
  {@const hu = tb === 'wear' && sb ? (hues[sb] ?? null) : null}
  {#if SUBS[tb].length}
    <div class="subs" role="radiogroup" aria-label={t(`look.tab.${tb}`)} {@attach roving}>
      {#each SUBS[tb] as s (s)}
        {@const on = sb === s}
        <button type="button" class="sb" role="radio" aria-checked={on} tabindex={on ? 0 : -1} data-look-sub={s} data-cat={SUB_CAT[s]}
          data-sfx={on ? 'none' : 'tick'} onclick={() => goSub(s)}>{subLabel(s)}</button>
      {/each}
    </div>
  {/if}

  {#if tb === 'coord'}
    <ul class="coords" data-looks>
      <li class="coord" class:on={picked === 'usual'}>
        <button type="button" class="pick" aria-pressed={picked === 'usual'} data-look-chip="usual" data-sfx={picked === 'usual' && !pickedEdited ? 'none' : 'tick'}
          onclick={() => wearChip('usual')}>
          <LookPortrait {who} look={guest ? { kind: 'villager', villager: wornVillager ?? begunVillager } : usual} size={64} />
          <span class="cn"><span class="star" aria-hidden="true">★</span>{t('look.usual')}</span>
          {#if picked === 'usual' && pickedEdited}<i class="ed" aria-hidden="true"></i>{/if}
        </button>
      </li>
      {#each saved as s (s.id)}
        <li class="coord" class:on={picked === s.id}>
          <button type="button" class="pick" aria-pressed={picked === s.id} data-look-chip={s.id} data-sfx={picked === s.id && !pickedEdited ? 'none' : 'tick'}
            onclick={() => wearChip(s.id)}>
            <LookPortrait {who} look={{ kind: 'player', ...s.look }} size={64} />
            <span class="cn">{s.name}</span>
            {#if picked === s.id && pickedEdited}<i class="ed" aria-hidden="true"></i>{/if}
          </button>
        </li>
      {/each}
      <li class="coord">
        <!-- full or a villager worn: sunk but still taking the tap, to say why -->
        <button type="button" class="pick add" class:off={saved.length >= LOOK_LIMITS.saved || draft.kind !== 'player'} data-look-save
          data-sfx={saved.length >= LOOK_LIMITS.saved || draft.kind !== 'player' ? 'none' : 'open'} onclick={askSave}>
          <span class="plus" aria-hidden="true">＋</span>
          <span class="cn">{t('look.save')}</span>
        </button>
      </li>
    </ul>
    {#if pickedSaved}
      <div class="acts" data-look-acts>
        <p>{pickedEdited ? t('look.differs', { name: pickedSaved.name }) : pickedSaved.name}</p>
        {#if pickedEdited && draft.kind === 'player'}
          <button type="button" class="btn small" data-look-overwrite data-sfx="confirm" onclick={doOverwrite}>{t('look.overwriteNow')}</button>
        {/if}
        <button type="button" class="btn small paper" data-look-rename data-sfx="open" onclick={askRename}>{t('look.renameShort')}</button>
        <button type="button" class="btn small paper" data-look-delete data-sfx="open" onclick={() => openCard('confirm')}>{t('look.delete')}</button>
      </div>
    {/if}
  {:else if tb === 'face' && sb === 'skin'}
    {@render swatchRow('skin', true)}
  {:else if tb === 'face' && (sb === 'nose' || sb === 'cheek')}
    {@render shapes(sb)}
  {:else if kd}
    {#if tb === 'wear' && sb}
      <div class="hues" role="radiogroup" aria-label={t('look.filter')} {@attach roving}>
        {#each [null, ...HUES] as h (h)}
          {@const on = hu === h}
          <button type="button" class="hue" class:all={!h} role="radio" aria-checked={on} tabindex={on ? 0 : -1} data-hue={h ?? 'all'}
            aria-label={t(`look.hue.${h ?? 'all'}`)} data-sfx={on ? 'none' : 'tick'} onclick={() => (hues[sb] = h)}>
            {#if h}<i class="hd hue-{h}" aria-hidden="true"></i>{:else}{t('look.hue.all')}{/if}
          </button>
        {/each}
      </div>
    {/if}
    {#key kd}
      <ClosetGrid kind={kd} look={human} hue={hu} {chosen} onwear={put} ontap={(item) => onTap(kd, item)} />
    {/key}
  {/if}
{/snippet}

{#snippet tabIcon(id: Tab)}
  <svg viewBox="0 0 24 24" aria-hidden="true">
    {#if id === 'coord'}<path d="M12 6a2 2 0 1 1 2 2c-1 .3-2 1-2 2v1M3 18l9-6 9 6z" />
    {:else if id === 'face'}<circle cx="12" cy="12" r="8.5" /><circle cx="9" cy="11" r=".9" class="fill" /><circle cx="15" cy="11" r=".9" class="fill" /><path d="M9.5 15c1.5 1.2 3.5 1.2 5 0" />
    {:else if id === 'hair'}<path d="M5 14c0-6 3-9 7-9s7 3 7 9M5 14c2-1 4-4 4-6 2 3 6 4 10 6M5 14v4M19 14v4" />
    {:else if id === 'wear'}<path d="M9 4 4 7l2 4 2-1v10h8V10l2 1 2-4-5-3c0 1.5-1.3 3-3 3S9 5.5 9 4z" />
    {:else if id === 'acc'}<circle cx="7" cy="14" r="3.5" /><circle cx="17" cy="14" r="3.5" /><path d="M10.5 14h3M3.5 13 3 10M20.5 13 21 10" />
    {:else}<path d="M6 9 4 4l5 2.5M18 9l2-5-5 2.5" /><path d="M5 13a7 6.5 0 0 0 14 0 7 6.5 0 0 0-14 0z" /><circle cx="9.5" cy="12.5" r=".9" class="fill" /><circle cx="14.5" cy="12.5" r=".9" class="fill" /><path d="M11 15.5h2" />
    {/if}
  </svg>
{/snippet}

<div class="look" data-look-page={who}>
  <LookStage {who} look={draft} status={statusText} star={status.kind === 'usual' || (status.kind === 'villager' && status.usual)} name={me.villagerName}
    title={wornVillager ? vName(wornVillager) : me.villagerName} kind={wornVillager ? vKind(wornVillager) : statusText} {mode} {changed} onrevert={revert} onname={askNick}
    dots={(dotItem || colourKey) && tab !== 'coord' && tab !== 'villager' ? stageDots : undefined} />

  <div class="tabs" role="tablist" aria-label={t('panel.look')} {@attach roving}>
    {#each TABS as id (id)}
      {@const on = tab === id}
      <button type="button" class="tab" role="tab" id="look-tab-{id}" aria-selected={on} aria-controls="look-panel-{id}" tabindex={on ? 0 : -1}
        data-look-tab={id} data-cat={TAB_CAT[id]} data-sfx={on ? 'none' : 'tick'} onclick={() => goTab(id)}>
        {@render tabIcon(id)}<span>{t(`look.tab.${id}`)}</span>
      </button>
    {/each}
  </div>

  <div class="panel" bind:this={panel} onscroll={scrolled}
    onfocusin={(e) => (searching = (e.target as HTMLElement).matches('input[type=search]'))} onfocusout={() => (searching = false)}>
    {#if wornVillager && tab !== 'coord' && tab !== 'villager'}
      <p class="vnote" data-look-villager-note>
        <LookPortrait {who} look={draft} size={40} />
        <span>{t('look.villagerNow', { name: vName(wornVillager) })}</span>
      </p>
    {/if}
    {#each TABS as tb (tb)}
      {#if tb !== 'villager' && visited[tb]}
        <div class="tp" role="tabpanel" id="look-panel-{tb}" aria-labelledby="look-tab-{tb}" data-cat-panel={subs[tb] ?? tb} hidden={tab !== tb}>
          {@render tabBody(tb)}
        </div>
      {/if}
    {/each}
    {#if visited.villager}
      <div class="tp" role="tabpanel" id="look-panel-villager" aria-labelledby="look-tab-villager" hidden={tab !== 'villager'}>
        <VillagerGrid {who} current={wornVillager} onpick={pickVillager} root={panel} />
      </div>
    {/if}
  </div>
</div>

<Sheet bind:open={cardOpen} title={cardTitle} onclose={() => (card = null)}>
  {#if card === 'confirm' && pickedSaved}
    <div class="ask" data-look-card="confirm">
      <LookPortrait {who} look={{ kind: 'player', ...pickedSaved.look }} size={72} />
      <p>{t('look.deleteAsk')}</p>
    </div>
  {:else if card === 'save' || card === 'rename' || card === 'nick'}
    <form class="nameform" data-look-card={card} onsubmit={(e) => (e.preventDefault(), submitCard())}>
      <LookPortrait {who} look={card === 'save' || card === 'nick' ? draft : { kind: 'player', ...(pickedSaved?.look ?? human) }} size={72} />
      <label class="namefield">
        <span>{card === 'nick' ? t('panel.nickname') : t('look.name')}</span>
        <!-- svelte-ignore a11y_autofocus -->
        <input class="name" type="text" maxlength={card === 'nick' ? 12 : LOOK_LIMITS.nameMaxChars} data-look-name data-sfx="none" bind:value={cardName} autofocus enterkeyhint="done" />
      </label>
    </form>
  {/if}
  {#snippet footer()}
    {#if card === 'confirm'}
      <div class="two">
        <button type="button" class="btn paper" data-sfx="back" onclick={closeCard}>{t('common.cancel')}</button>
        <button type="button" class="btn danger" data-look-confirm data-sfx="confirm" onclick={doDelete}>{t('look.delete')}</button>
      </div>
    {:else if card}
      <button type="button" class="btn" data-look-ok aria-disabled={!nameOk} data-sfx={nameOk ? 'confirm' : 'none'} onclick={submitCard}>{t('common.save')}</button>
    {/if}
  {/snippet}
</Sheet>

<style>
  /* Fills the pushed page: the stage and the tabs hold still, the panel scrolls under them to the screen's foot. */
  .look { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 10px; }

  /* the six tabs: an icon and its name, the picked one yuzu with the edge and lip (not colour alone) */
  .tabs {
    flex: none; position: relative; z-index: 1; display: grid; grid-template-columns: repeat(6, 1fr); gap: 2px; padding: 5px; border-radius: 20px;
    background: var(--c-cream); box-shadow: 0 var(--lip-s) 0 var(--c-lip);
  }
  .tabs::after {
    content: ''; position: absolute; left: -8px; right: -8px; top: calc(100% + var(--lip-s)); height: 10px; pointer-events: none;
    background: linear-gradient(var(--surface), transparent);
  }
  .tab {
    appearance: none; border: 0; background: none; cursor: pointer; min-width: 0; min-height: 52px; padding: 5px 0 4px; border-radius: 14px;
    display: grid; justify-items: center; align-content: center; gap: 3px; font: 700 var(--fs-s)/1 var(--font-ui); color: var(--c-ink);
    white-space: nowrap; letter-spacing: -.02em;
  }
  .tab svg { width: 24px; height: 24px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
  .tab svg .fill { fill: currentColor; stroke: none; }
  .tab[aria-selected='true'] { background: var(--c-yuzu); box-shadow: inset 0 0 0 1.5px var(--c-edge), 0 2px 0 var(--c-edge); }
  .tab:active { transform: translateY(1px); }
  .tab:focus-visible { outline: 3px solid var(--focus); outline-offset: 1px; }

  .panel {
    flex: 1; min-height: 0; overflow: hidden auto; overscroll-behavior: contain;
    margin: 0 -8px; padding: 4px 8px var(--body-pad);
  }
  .tp { display: flex; flex-direction: column; gap: 12px; }
  .tp > * { flex: none; }
  .tp[hidden] { display: none; }

  /* a villager worn: the human tabs say what a pick does */
  .vnote {
    margin: 0 0 12px; display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 18px;
    background: color-mix(in srgb, var(--c-yuzu) 30%, var(--c-card)); box-shadow: inset 0 0 0 2px var(--c-yuzu-lip);
    font: 700 var(--fs-s)/1.5 var(--font-ui); color: var(--c-ink);
  }

  /* the sub-row: a segmented strip (scrolls sideways if it has to) */
  .subs {
    display: flex; gap: 2px; padding: 4px; border-radius: var(--r-pill); overflow: auto hidden; scrollbar-width: none;
    background: color-mix(in srgb, var(--c-lip) 45%, var(--c-paper));
  }
  .subs::-webkit-scrollbar { display: none; }
  .sb {
    appearance: none; border: 0; background: none; cursor: pointer; position: relative; flex: 1 0 auto; min-height: 36px; padding: 0 5px; border-radius: var(--r-pill);
    font: 700 var(--fs-s)/1 var(--font-ui); color: var(--c-ink-soft); white-space: nowrap; letter-spacing: -.02em;
  }
  .sb::after { content: ''; position: absolute; inset: -4px 0; }
  .sb[aria-checked='true'] { background: var(--c-card); color: var(--c-ink); box-shadow: inset 0 0 0 1.5px var(--c-edge), 0 2px 0 var(--c-edge); }
  .sb:focus-visible { outline: 3px solid var(--focus); outline-offset: -1px; }

  /* the colour filter: すべて, then the nine hues, sideways; the end fades when there's more */
  .hues {
    display: flex; gap: 6px; overflow: auto hidden; scrollbar-width: none; margin: -2px -8px 0; padding: 2px 8px 6px;
    mask-image: linear-gradient(90deg, #000 calc(100% - 28px), transparent);
  }
  .hues::-webkit-scrollbar { display: none; }
  .hue {
    appearance: none; border: 0; cursor: pointer; flex: none; position: relative; width: 36px; height: 36px; border-radius: var(--r-pill); display: grid; place-items: center;
    background: var(--ctl); box-shadow: var(--sh-ctl); font: 700 var(--fs-s)/1 var(--font-ui); color: var(--text);
  }
  .hue::after { content: ''; position: absolute; inset: -4px -3px; }
  .hue.all { width: auto; padding: 0 14px; }
  .hue[aria-checked='true'] { background: var(--ctl-sel); color: var(--c-ink); }
  .hd { width: 20px; height: 20px; border-radius: 50%; box-shadow: inset 0 0 0 1.5px rgb(0 0 0 / .45); display: block; }
  .hue-red { background: #e04848; } .hue-yellow { background: #f2c94c; } .hue-green { background: #5fae5a; } .hue-blue { background: #4f7fd0; }
  .hue-purple { background: #9b6fd0; } .hue-pink { background: #f29ab8; } .hue-brown { background: #8a5a36; } .hue-white { background: #fafafa; }
  .hue-black { background: #2a2a2a; }

  /* colour dots (the stage's row, はだ's in the panel): a 28px dot in a 44px target */
  .swatches { display: flex; flex-wrap: nowrap; gap: 0; }
  .swatches.big { flex-wrap: wrap; gap: 6px; justify-content: center; padding: 8px 0; }
  .dot { appearance: none; cursor: pointer; border: 0; padding: 0; width: 44px; height: 44px; flex: none; border-radius: 50%; position: relative; background: none; }
  .dot::before { content: ''; position: absolute; inset: 8px; border-radius: 50%; background: var(--sw); box-shadow: inset 0 0 0 2px rgb(0 0 0 / .16); }
  .big .dot { width: 52px; height: 52px; }
  .dot[aria-checked='true']::before { box-shadow: inset 0 0 0 2px rgb(0 0 0 / .16), 0 0 0 3px var(--c-cream), 0 0 0 6px var(--c-leaf-edge); }
  .dot:focus-visible { outline: 3px solid var(--focus); outline-offset: -2px; }
  .shapes { justify-content: center; padding: 8px 0; }

  /* the コーデ: a 4-column grid of 64px portraits, names under them */
  .coords { list-style: none; margin: 0; padding: 4px 0 0; display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px 6px; }
  .coord { position: relative; min-width: 0; }
  .pick {
    appearance: none; border: 0; background: none; padding: 4px 0 0; cursor: pointer; width: 100%; display: grid; justify-items: center; gap: 5px;
    color: var(--text); font: 700 var(--fs-s)/1.2 var(--font-ui); border-radius: var(--r-card); position: relative;
  }
  .pick :global(.av), .pick :global(.pt) { box-shadow: 0 0 0 3px transparent; transition: box-shadow var(--dur-quick); }
  .coord.on .pick :global(.av), .coord.on .pick :global(.pt) { box-shadow: 0 0 0 4px var(--c-leaf-edge); }
  .pick:active { transform: scale(1.04, .96); }
  .pick:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .cn { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .star { color: var(--c-yuzu-lip); margin-right: 1px; }
  .ed { position: absolute; top: 2px; right: calc(50% - 36px); width: 14px; height: 14px; border-radius: 50%; background: #ff8f7a; box-shadow: 0 0 0 2px var(--surface); }
  .add .plus {
    width: 64px; height: 64px; display: grid; place-items: center; border-radius: 50%; font-size: 26px;
    background: var(--ctl); box-shadow: var(--sh-ctl);
  }
  .add.off { color: var(--text-soft); }
  .add.off .plus { background: var(--ctl-off); box-shadow: none; }

  /* the picked コーデ's actions, inline */
  .acts {
    display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding: 10px 12px 8px; border-radius: 20px;
    background: var(--card); box-shadow: var(--sh-lip);
  }
  .acts p { flex: 1 0 100%; margin: 0 2px; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); overflow-wrap: anywhere; }
  .acts .btn { margin: 0 0 var(--lip-h); }

  /* the name sheet */
  .ask, .nameform { display: grid; justify-items: center; gap: 10px; padding: 0 0 8px; text-align: center; }
  .ask p { margin: 0; font-weight: 700; line-height: 1.6; }
  .namefield { width: 100%; text-align: left; display: grid; gap: 4px; }
  .namefield span { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  /* 16px so Safari doesn't zoom */
  .name {
    width: 100%; min-height: 48px; border-radius: var(--r-btn); border: 0; font-size: var(--fs-input);
    background: var(--c-card); color: var(--c-ink); padding: 0 14px; font-weight: 700; box-shadow: inset 0 0 0 2px var(--c-edge), inset 0 4px 0 var(--c-lip);
  }
  .name:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .two { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .two .btn { margin: 0; }
</style>
