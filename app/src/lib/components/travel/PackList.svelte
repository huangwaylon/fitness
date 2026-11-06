<script lang="ts">
  // もちもの: a trip's shared packing list (docs/travel.md "Packing list (relay)"). A card per category (its icon, its
  // name, my 「N / M」), a row per item: the big check bubble is MY tick (each person ticks their own), the text and its
  // note in the reader's language (else the other side), and under them one line of who has packed it (「✓ ウェイ
  // うめ」 in their tags' colours; nothing while nobody has). The header holds my progress, ✎ and, all packed, Orville's
  // 「じゅんび OK！」 stamp (celebrated once per trip and person on this phone); a trip that's over only a quiet count
  // (ticking still works). ✎ (once the phone knows who I am): add an item to a category (an inline field, enter adds),
  // add a category, rename (a tap on the name; ✎ off keeps what was typed), ↑ ↓, 🗑 (an item at once with とりけす on
  // the banner; a category asks first, NH style, then とりけす too). The guest adds, and changes only what it added.
  // 「チェックを リセット」 (mine only) asks first, then とりけす too.
  //   <PackList trip={okinawa} />
  import '#lib/i18n/travel.ts';
  import { untrack } from 'svelte';
  import Sheet from '../ui/Sheet.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import Glyph from '../kiroku/Glyph.svelte';
  import { packing } from './packing.svelte.ts';
  import { celebrate, clip, myProgress, packView, type PackCatView } from './packView.ts';
  import { phaseOf } from './when.ts';
  import { iconOf } from './icons.ts';
  import { PACK_NAME } from '#lib/contract/pack.ts';
  import type { Trip } from '#lib/travel/types.ts';
  import type { Who } from '#lib/types.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { undoBanner } from '#lib/store/actions.ts';
  import { minuteNow } from '#lib/time/clock.ts';
  import { tagOf, villagerNameOf } from '#lib/ui-state/viewer.ts';
  import { DEVICE, localKV, readJson, writeJson } from '#lib/sync/storage.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import { cue } from '#lib/sound/cues.ts';

  let { trip }: { trip: Trip } = $props();

  /** A removal's and a reset's とりけす window (the banner's life; sent after it). */
  const UNDO_MS = 5000;
  /** A name on the one-line undo banner at most (characters). */
  const BANNER_NAME = 12;
  /** The celebration's length: the stamp's slam, Orville's line. */
  const CHEER_MS = 4200;

  const locale = $derived(i18n.locale);
  const me = $derived(packing.me);
  const seed = $derived(trip.packing);
  const view = $derived(packView(packing.list(trip.id, seed), me, locale));
  const prog = $derived(myProgress(view));
  /** The trip is over: no nagging, no stamp; a quiet count. */
  const past = $derived(phaseOf(trip, minuteNow().getTime()).k === 'past');
  const done = $derived(prog.done && !past);
  const nameOf = (w: Who): string => (week.view ? villagerNameOf(week.view, w) : w);

  let editing = $state(false);
  /** The id being renamed (a category's or an item's), and its field's text. */
  let renaming = $state<string | null>(null);
  let renameText = $state('');
  /** Each category's add field, and the new category's. */
  let drafts = $state<Record<string, string>>({});
  let newCat = $state('');
  /** The item just ticked (its bubble pops). */
  let popped = $state<string | null>(null);

  // ---- my tick
  function toggle(id: string, on: boolean) {
    if (!packing.tick(trip.id, id, on)) return;
    popped = on ? id : null;
  }

  // ---- 「じゅんび OK！」: shown while everything is packed; celebrated (the slam, Orville's line, the miles chime) the
  // first time on this phone for this trip and person
  let cheering = $state(false);
  $effect(() => {
    if (!done || !me) return;
    const who = me, id = trip.id;
    untrack(() => {
      const c = celebrate(readJson<string[]>(localKV(), DEVICE.travelPacked) ?? [], who, id);
      if (!c.now) return;
      writeJson(localKV(), DEVICE.travelPacked, c.seen);
      cheering = true;
      cue('badge-met');
    });
  });
  $effect(() => {
    if (!cheering) return;
    const h = setTimeout(() => (cheering = false), CHEER_MS);
    return () => clearTimeout(h);
  });

  // ---- ✎
  function toggleEdit() {
    commitRename();
    editing = !editing;
  }
  function startRename(id: string, current: string) {
    renaming = id;
    renameText = current;
  }
  function commitRename() {
    const id = renaming;
    if (!id) return;
    renaming = null;
    if (renameText.trim()) packing.rename(trip.id, seed, id, renameText, locale);
  }
  function renameKey(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitRename();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation(); // (the sheet's Esc closes it: here it only ends the rename)
      renaming = null;
    }
  }
  const focusIn = (el: HTMLInputElement) => {
    el.focus({ preventScroll: false });
    el.select();
  };

  function addItem(e: SubmitEvent, cat: string) {
    e.preventDefault();
    const text = drafts[cat] ?? '';
    if (!text.trim()) return;
    if (packing.addItem(trip.id, seed, cat, text, locale)) drafts[cat] = '';
  }
  function addCat(e: SubmitEvent) {
    e.preventDefault();
    if (!newCat.trim()) return;
    if (packing.addCat(trip.id, seed, newCat, locale)) newCat = '';
  }
  function move(id: string, index: number) {
    packing.move(trip.id, seed, id, index);
  }
  function remove(id: string, name: string) {
    undoBanner(t('travel.pack.removed', { name: clip(name, BANNER_NAME) }), packing.removeHeld(trip.id, seed, id, UNDO_MS));
  }

  // ---- the NH confirmations: a category's 🗑, リセット
  let ask = $state<{ kind: 'cat'; cat: PackCatView } | { kind: 'reset' } | null>(null);
  let asking = $state(false);
  function askFor(a: NonNullable<typeof ask>) {
    ask = a;
    asking = true;
  }
  function yes() {
    asking = false;
    const a = ask;
    if (a?.kind === 'cat') remove(a.cat.id, a.cat.name);
    else if (a?.kind === 'reset') undoBanner(t('travel.pack.resetDone'), packing.resetHeld(trip.id, UNDO_MS));
  }

  const pct = $derived(prog.total ? Math.round((prog.mine / prog.total) * 100) : 0);
</script>

{#snippet trash()}
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" /></svg>
{/snippet}
{#snippet arrow(up: boolean)}
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d={up ? 'M6 14l6-6 6 6' : 'M6 10l6 6 6-6'} /></svg>
{/snippet}
<!-- a row's ↑ ↓ 🗑 (`asks`: its 🗑 asks first, a category's) -->
{#snippet acts(id: string, name: string, i: number, n: number, asks: boolean, del: () => void)}
  <span class="acts">
    <button type="button" class="ib" aria-label={t('travel.pack.up', { name })} aria-disabled={i === 0 || undefined} data-sfx="tick" data-pack-up={id} onclick={() => move(id, i - 1)}>{@render arrow(true)}</button>
    <button type="button" class="ib" aria-label={t('travel.pack.down', { name })} aria-disabled={i === n - 1 || undefined} data-sfx="tick" data-pack-down={id} onclick={() => move(id, i + 1)}>{@render arrow(false)}</button>
    <button type="button" class="ib del" aria-label={t('travel.pack.remove', { name })} data-sfx={asks ? 'open' : 'undo'} data-pack-del={id} onclick={del}>{@render trash()}</button>
  </span>
{/snippet}
{#snippet icon(name: string, size: number)}
  {@const ic = iconOf(name)}
  {#if 'art' in ic}<OfficialArt key={ic.art} size="{size}px" />{:else}<span class="emoji" style:font-size="{size * 0.8}px">{ic.emoji}</span>{/if}
{/snippet}

<div class="pack" data-pack={trip.id} data-pack-editing={editing || undefined}>
  <header class="head" class:done class:past>
    <span class="bag" aria-hidden="true"><OfficialArt key="finds/items/aluminum-briefcase" size="48px" /></span>
    <div class="prog">
      <span class="pl">{t('travel.pack.mine')}</span>
      {#if !past}
        <span class="bar" role="progressbar" aria-label={t('travel.pack.mine')} aria-valuemin={0} aria-valuemax={prog.total} aria-valuenow={prog.mine}>
          <i style:width="{pct}%"></i>
        </span>
      {/if}
      <span class="sub">
        <b class="money" data-pack-mine={prog.mine} data-pack-total={prog.total}>{t('travel.pack.count', { n: prog.mine, m: prog.total })}</b>
        {#if past}<span class="left" data-pack-past>{t('travel.pack.past')}</span>
        {:else if prog.total && !prog.done}<span class="left">{t('travel.pack.left', { n: prog.total - prog.mine })}</span>{/if}
        {#if done}
          <span class="stamp" class:cheer={cheering} data-pack-stamp={cheering ? 'cheer' : 'on'} role="status">
            <span class="orv" aria-hidden="true"><OfficialArt key="villagers/orville-icon" size="28px" /></span>
            <b>{t('travel.pack.done')}</b>
          </span>
        {/if}
      </span>
    </div>
    {#if me}<button type="button" class="pen-btn" class:on={editing} aria-pressed={editing} aria-label={t('travel.pack.edit')} data-pack-edit data-sfx={editing ? 'toggle-off' : 'toggle-on'} onclick={toggleEdit}>
      {#if editing}<svg class="ok" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>{:else}<Glyph kind="pen" size={20} />{/if}
    </button>{/if}
  </header>
  {#if cheering}<p class="cheer-line" aria-hidden="true"><span class="nameplate">{t('travel.orville')}</span>{t('travel.pack.orville')}</p>{/if}

  {#if editing}
    <p class="edit-note" data-pack-editbar>
      <span class="dot" aria-hidden="true"></span>{t('travel.pack.editing')}{#if me === 'G'}<small>{t('travel.pack.guestNote')}</small>{/if}
    </p>
  {/if}

  {#if !view.length}
    <p class="card empty" data-pack-empty>{t('travel.pack.empty')}</p>
  {/if}

  {#each view as c, ci (c.id)}
    <section class="cat card" data-pack-cat={c.id} aria-labelledby="pc-{c.id}">
      <h3 class="ch" id="pc-{c.id}">
        <span class="ci">{@render icon(c.icon, 34)}</span>
        {#if editing && renaming === c.id}
          <input data-sfx="none" class="field nm-in" type="text" maxlength={PACK_NAME} aria-label={t('travel.pack.rename', { name: c.name })} bind:value={renameText}
            onkeydown={renameKey} onblur={commitRename} {@attach focusIn} />
        {:else if editing && c.editable}
          <button type="button" class="nm edit" data-pack-rename={c.id} aria-label={t('travel.pack.rename', { name: c.name })} data-sfx="open" onclick={() => startRename(c.id, c.name)}>
            <span>{c.name}</span><Glyph kind="pen" size={14} />
          </button>
        {:else}
          <span class="nm">{c.name}</span>
        {/if}
        {#if !editing}
          <span class="cc money" class:full={c.total > 0 && c.mine === c.total} data-pack-cat-mine={c.mine}>{t('travel.pack.count', { n: c.mine, m: c.total })}</span>
        {:else if c.editable && renaming !== c.id}
          {@render acts(c.id, c.name, ci, view.length, true, () => askFor({ kind: 'cat', cat: c }))}
        {/if}
      </h3>

      {#if c.rows.length}
        <ul class="rows">
          {#each c.rows as r, ri (r.id)}
            <li data-pack-item={r.id} data-mine={r.mine || undefined} data-ticks={r.item.ticks.join('')}>
              {#if !editing}
                <button type="button" class="row" role="checkbox" aria-checked={r.mine} data-sfx={r.mine ? 'toggle-off' : 'toggle-on'} onclick={() => toggle(r.id, !r.mine)}>
                  <span class="bub" class:on={r.mine} class:pop={popped === r.id && r.mine} aria-hidden="true">
                    <svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                  </span>
                  <span class="tx">
                    <span class="it">{r.text}</span>{#if r.note}<small>{r.note}</small>{/if}
                    {#if r.item.ticks.length}
                      <span class="by" aria-hidden="true"><span class="ck">✓</span>{#each r.item.ticks as w (w)}<i class="tag" style:--tag={tagOf(w)} data-chip={w}>{nameOf(w)}</i>{/each}</span>
                      <span class="sr-only">{t('travel.pack.packedBy', { names: r.item.ticks.map(nameOf).join(locale === 'ja' ? '、' : ', ') })}</span>
                    {/if}
                  </span>
                </button>
              {:else}
                <div class="erow" class:locked={!r.editable}>
                  {#if renaming === r.id}
                    <input data-sfx="none" class="field" type="text" maxlength={PACK_NAME} aria-label={t('travel.pack.rename', { name: r.text })} bind:value={renameText}
                      onkeydown={renameKey} onblur={commitRename} {@attach focusIn} />
                  {:else if r.editable}
                    <button type="button" class="tx edit" data-pack-rename={r.id} aria-label={t('travel.pack.rename', { name: r.text })} data-sfx="open" onclick={() => startRename(r.id, r.text)}>
                      <span class="it">{r.text}<Glyph kind="pen" size={12} /></span>{#if r.note}<small>{r.note}</small>{/if}
                    </button>
                  {:else}
                    <span class="tx"><span class="it">{r.text}</span>{#if r.note}<small>{r.note}</small>{/if}</span>
                  {/if}
                  {#if r.editable && renaming !== r.id}{@render acts(r.id, r.text, ri, c.rows.length, false, () => remove(r.id, r.text))}{/if}
                </div>
              {/if}
            </li>
          {/each}
        </ul>
      {:else}
        <p class="none">{t('travel.pack.emptyCat')}</p>
      {/if}

      {#if editing}
        <form class="add" data-pack-add={c.id} onsubmit={(e) => addItem(e, c.id)}>
          <input data-sfx="none" class="field" type="text" maxlength={PACK_NAME} enterkeyhint="enter" autocomplete="off" placeholder={t('travel.pack.addItem')}
            aria-label={t('travel.pack.addItemIn', { cat: c.name })} bind:value={drafts[c.id]} />
          <button type="submit" class="btn small" aria-disabled={!(drafts[c.id] ?? '').trim() || undefined} data-sfx="confirm">{t('travel.pack.add')}</button>
        </form>
      {/if}
    </section>
  {/each}

  {#if editing}
    <form class="add newcat card" data-pack-addcat onsubmit={addCat}>
      <span class="ci" aria-hidden="true">{@render icon('shopping-bag', 30)}</span>
      <input data-sfx="none" class="field" type="text" maxlength={PACK_NAME} enterkeyhint="enter" autocomplete="off" placeholder={t('travel.pack.addCat')}
        aria-label={t('travel.pack.addCat')} bind:value={newCat} />
      <button type="submit" class="btn small" aria-disabled={!newCat.trim() || undefined} data-sfx="confirm">{t('travel.pack.add')}</button>
    </form>
  {:else if prog.mine > 0}
    <button type="button" class="btn small paper reset" data-pack-reset data-sfx="open" onclick={() => askFor({ kind: 'reset' })}>{t('travel.pack.reset')}</button>
  {/if}
</div>

<Sheet bind:open={asking} label={ask?.kind === 'cat' ? t('travel.pack.catAsk', { name: ask.cat.name }) : t('travel.pack.reset')} onclose={() => (asking = false)}>
  {#if ask}
    <div class="ask" data-pack-ask={ask.kind}>
      {#if ask.kind === 'cat'}
        <span class="big" aria-hidden="true">{@render icon(ask.cat.icon, 56)}</span>
        <p><b>{t('travel.pack.catAsk', { name: ask.cat.name })}</b>{#if ask.cat.total}<br /><small>{t('travel.pack.catAskItems', { n: ask.cat.total })}</small>{/if}</p>
      {:else}
        <span class="big" aria-hidden="true"><OfficialArt key="finds/items/aluminum-briefcase" size="56px" /></span>
        <p><b>{t('travel.pack.resetAsk')}</b><br /><small>{t('travel.pack.resetNote')}</small></p>
      {/if}
    </div>
  {/if}
  {#snippet footer()}
    <div class="two">
      <button type="button" class="btn paper" data-sfx="back" data-pack-no onclick={() => (asking = false)}>{t('travel.pack.no')}</button>
      <button type="button" class="btn" data-sfx="confirm" data-pack-yes onclick={yes}>{t('travel.pack.yes')}</button>
    </div>
  {/snippet}
</Sheet>

<style>
  .pack { --dodo: #2F7FC1; display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; }
  /* the guide's own text breaks as normal Japanese (docs/design.md §Trips), never wider than its card */
  .tx, .nm { word-break: normal; overflow-wrap: anywhere; }

  /* the header: the suitcase, my progress (a cream track filling leaf green), ✎ */
  .head {
    position: relative; display: flex; align-items: center; gap: 12px; padding: 12px 14px 12px 12px;
    background: var(--card); border-radius: var(--r-card); box-shadow: var(--sh-lip);
  }
  .bag { flex: none; width: 52px; height: 52px; display: grid; place-items: center; line-height: 0; }
  .prog { flex: 1; min-width: 0; display: grid; gap: 6px; }
  .pl { font-weight: 700; font-size: var(--fs-s); color: var(--text-soft); }
  .bar {
    display: block; height: 14px; border-radius: var(--r-pill); background: var(--ctl-off);
    box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--edge) 45%, transparent); overflow: hidden;
  }
  .bar i {
    display: block; height: 100%; border-radius: inherit; background: var(--c-leaf); box-shadow: inset 0 -3px 0 var(--c-leaf-lip);
    transition: width var(--dur-pop) var(--ease-bounce); min-width: 0;
  }
  .sub { display: flex; align-items: center; gap: 10px; min-height: 28px; }
  .sub .money { font-size: var(--fs-talk); }
  .left { font-weight: 700; font-size: var(--fs-s); color: var(--text-soft); }
  .done .sub .money { color: var(--leaf-text); }
  .past .sub .money { font-size: var(--fs-body); color: var(--text-soft); }
  .pen-btn { margin-bottom: 0; align-self: center; }
  .pen-btn.on { background: var(--c-yuzu); }
  .pen-btn .ok { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }

  /* Orville's stamp: Dodo Airlines blue, a rubber stamp's double ring, tilted beside my count */
  .stamp {
    position: relative; margin: -6px 0 -8px 2px; rotate: -7deg; pointer-events: none;
    display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px 4px 4px; border-radius: var(--r-pill);
    color: var(--dodo); background: color-mix(in srgb, var(--c-card) 88%, transparent);
    box-shadow: inset 0 0 0 2.5px var(--dodo), inset 0 0 0 5px var(--c-card), inset 0 0 0 6.5px var(--dodo);
    font: 700 var(--fs-body)/1 var(--font-ui); white-space: nowrap;
  }
  .orv { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; overflow: hidden; line-height: 0; }
  .stamp.cheer { animation: slam 520ms var(--ease-bounce) both; }
  @keyframes slam {
    0% { scale: 2.2; opacity: 0; rotate: 6deg; }
    55% { scale: .92; opacity: 1; rotate: -10deg; }
    100% { scale: 1; rotate: -7deg; }
  }
  .cheer-line {
    margin: 2px 8px 0 64px; justify-self: start; position: relative; padding: 10px 14px; border-radius: 20px;
    background: var(--c-cream); color: var(--c-ink); box-shadow: 0 var(--lip-h) 0 var(--c-lip); font-weight: 700;
    animation: rise 360ms var(--ease-bounce) 260ms both;
  }
  .cheer-line::before {
    content: ''; position: absolute; left: 92px; top: -8px; border: 8px solid transparent; border-top: 0; border-bottom-color: var(--c-cream);
  }
  .nameplate {
    position: absolute; left: 10px; top: -12px; padding: 3px 10px; border-radius: var(--r-pill); rotate: -3deg;
    background: var(--dodo); color: #fff; font-size: var(--fs-xs);
  }
  @keyframes rise { from { opacity: 0; translate: 0 8px; scale: .9; } to { opacity: 1; translate: 0; scale: 1; } }

  .edit-note {
    margin: 0 4px; display: flex; flex-wrap: wrap; align-items: center; gap: 2px 8px;
    font-weight: 700; font-size: var(--fs-s); color: var(--text-soft);
  }
  .edit-note small { flex-basis: 100%; font-size: var(--fs-s); }
  .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--c-yuzu); box-shadow: 0 0 0 2px var(--c-yuzu-lip); }

  .empty { margin: 0; padding: 18px 16px; text-align: center; font-weight: 700; color: var(--text-soft); }

  /* a category's card */
  .cat { padding: 10px 10px 8px 14px; display: grid; grid-template-columns: minmax(0, 1fr); gap: 2px; }
  .ch { display: flex; align-items: center; gap: 8px; min-height: var(--hit); margin: 0; font-size: var(--fs-talk); }
  .ci { flex: none; width: 36px; height: 36px; display: grid; place-items: center; line-height: 0; }
  .emoji { line-height: 1; }
  .nm { flex: 1; min-width: 0; font-weight: 700; overflow-wrap: anywhere; }
  .cc {
    flex: none; padding: 5px 10px 4px; border-radius: var(--r-pill); background: var(--ctl-off); font-size: var(--fs-s); color: var(--text);
  }
  .cc.full { background: var(--c-leaf); color: var(--c-ink); }

  .rows { list-style: none; margin: 0; padding: 0; display: grid; }
  .rows li + li { box-shadow: 0 -2px 0 color-mix(in srgb, var(--lip) 40%, transparent); }

  /* an item: the whole row is my tick */
  .row {
    appearance: none; border: 0; background: none; cursor: pointer; width: 100%; padding: 8px 2px; margin: 0;
    display: flex; align-items: center; gap: 12px; text-align: left; border-radius: var(--r-btn); min-height: 60px;
    -webkit-tap-highlight-color: transparent; color: var(--text);
  }
  .row:active { background: var(--hl); }
  .row:focus-visible { outline: 3px solid var(--focus); outline-offset: -2px; }
  .bub {
    flex: none; width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center;
    background: var(--ctl); box-shadow: inset 0 0 0 2.5px var(--edge), 0 3px 0 var(--edge);
    transition: background-color var(--dur-quick), box-shadow var(--dur-quick);
  }
  .bub svg {
    width: 26px; height: 26px; fill: none; stroke: #fff; stroke-width: 3.6; stroke-linecap: round; stroke-linejoin: round;
    stroke-dasharray: 22; stroke-dashoffset: 22; transition: stroke-dashoffset 220ms var(--ease-soft) 60ms;
  }
  .bub.on { background: var(--c-leaf); box-shadow: inset 0 0 0 2.5px var(--c-leaf-edge), 0 3px 0 var(--c-leaf-edge); }
  .bub.on svg { stroke-dashoffset: 0; }
  .bub.pop { animation: pop 380ms var(--ease-bounce); }
  @keyframes pop { 0% { scale: .72; } 60% { scale: 1.16; } 100% { scale: 1; } }

  .tx { flex: 1; min-width: 0; display: grid; gap: 2px; font-weight: 700; font-size: var(--fs-body); line-height: 1.35; }
  .tx small { font-size: var(--fs-s); font-weight: 500; color: var(--text-soft); line-height: 1.4; }
  .row[aria-checked='true'] .it { color: var(--text-soft); }

  /* who has packed it: one line, each name on its tag's colour (ink on the pastel, day and night) */
  .by { display: flex; align-items: center; gap: 4px; min-width: 0; margin-top: 1px; overflow: hidden; white-space: nowrap; }
  .ck { flex: none; font: 700 var(--fs-xs)/1 var(--font-ui); color: var(--leaf-text); }
  .tag {
    font-style: normal; flex: 0 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis;
    padding: 2px 7px 1px; border-radius: var(--r-pill); font: 700 var(--fs-xs)/1.35 var(--font-ui); background: var(--tag); color: var(--c-ink);
  }

  /* ✎: a row's name to rename, ↑ ↓ 🗑 */
  .erow { display: flex; align-items: center; gap: 4px; min-height: 56px; padding: 4px 0; }
  .erow.locked .tx { opacity: .62; }
  /* ✎: a note on one line (the row's controls take its room; the note is read in the list) */
  .erow small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .edit {
    appearance: none; border: 0; background: none; cursor: pointer; text-align: left; padding: 6px 4px; margin: 0; border-radius: var(--r-chip);
    color: var(--text); font: inherit; min-height: var(--hit);
  }
  .edit:active { background: var(--hl); }
  .nm.edit { display: flex; align-items: center; gap: 6px; font-size: var(--fs-talk); font-weight: 700; }
  .edit :global(.g) { margin-left: 4px; color: var(--text-soft); }
  .acts { flex: none; display: flex; gap: 0; margin-left: auto; }
  .ib {
    appearance: none; border: 0; cursor: pointer; width: var(--hit); height: var(--hit); padding: 0; border-radius: 50%;
    display: grid; place-items: center; background: none; color: var(--text);
  }
  .ib svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
  .ib:active:not([aria-disabled='true']) { background: var(--hl); transform: scale(.92); }
  .ib[aria-disabled='true'] { opacity: .28; cursor: default; }
  .ib.del { color: var(--text-soft); }

  .field {
    flex: 1; min-width: 0; height: var(--hit); padding: 0 12px; border: 0; border-radius: var(--r-btn);
    font: 700 var(--fs-input) var(--font-ui); color: var(--c-ink); background: var(--c-card);
    box-shadow: inset 0 0 0 2px var(--c-edge);
  }
  .field::placeholder { color: color-mix(in srgb, var(--c-ink-soft) 75%, transparent); font-weight: 500; }
  .field:focus { outline: 3px solid var(--c-yuzu); outline-offset: 0; }
  .nm-in { font-size: max(16px, var(--fs-talk)); }

  .add { display: flex; align-items: center; gap: 8px; padding: 8px 0 4px; }
  .add .btn { flex: none; margin: 0 0 var(--lip-h); padding: 0 14px; }
  .newcat { padding: 10px 12px 8px; }
  .none { margin: 2px 0 6px; font-weight: 700; font-size: var(--fs-s); color: var(--text-soft); }
  .reset { justify-self: center; margin-top: 4px; }

  .ask { display: grid; justify-items: center; gap: 6px; padding: 0 0 8px; text-align: center; }
  .big { width: 64px; height: 64px; display: grid; place-items: center; line-height: 0; }
  .ask p { margin: 6px 0 0; font-weight: 700; line-height: 1.6; }
  .ask small { font-size: var(--fs-s); color: var(--text-soft); }
  .two { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .two .btn { margin: 0; }

  @media (max-width: 359px) { .head { gap: 8px; } .bag { display: none; } }
</style>
