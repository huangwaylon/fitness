<script lang="ts">
  // A campsite's sheet (キャンプ場's row, a camp's dot on 地図; docs/design.md §Trips): its photo with ✕ on it, the
  // name, the kind and where with our night's tag, ★ on the shortlist, the description, its chips, the road time and
  // distance, the fee, the amenities; 地図で見る (from the list: 地図 with the camp on it) and マップで開く (Maps, a new
  // tab). On a <dialog> (focus trap; Esc and the scrim close it).
  import type { Camp } from '#lib/travel/types.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import { cue } from '#lib/sound/cues.ts';
  import NavButton from '../ui/NavButton.svelte';
  import Icon from '../quiet/Icon.svelte';
  import Photo from './Photo.svelte';
  import Txt from './Txt.svelte';
  import { hrefOf, pick } from './text.ts';
  import { fmtKm } from './units.ts';
  import { AMENITIES } from './camps.ts';

  interface Props {
    open: boolean;
    camp: Camp;
    note: Record<string, string> | null;
    /** 地図で見る: the camp on the map (none on the map itself). */
    onmap?: (id: string) => void;
    /** A data attribute on the sheet's body (`map-camp`: the one the map opens). */
    attr?: string;
  }
  let { open = $bindable(), camp, note, onmap, attr = 'camp-sheet' }: Props = $props();
  let dlg: HTMLDialogElement | undefined = $state();
  $effect(() => {
    if (!dlg) return;
    if (open && !dlg.open) {
      dlg.showModal();
      dlg.focus({ preventScroll: true });
    } else if (!open && dlg.open) dlg.close();
  });
  function backdrop(e: MouseEvent) {
    if (e.target !== dlg || !dlg) return;
    const r = dlg.getBoundingClientRect();
    if (e.clientY >= r.top) return;
    cue('back');
    open = false;
  }
  const tag = $derived(camp.chips.find((x) => x.pick && pick(x.text, 'ja') !== '候補'));
  const picked = $derived(camp.chips.some((x) => x.pick));
  const rest = $derived(camp.chips.filter((x) => !x.pick));
  const maps = $derived(hrefOf(camp.maps, note));
  const ICON = { beach: 'beach', toilet: 'toilet', shower: 'shower' } as const;
  const area = $derived(pick(camp.sub, i18n.locale).split(' · ').at(-1) ?? '');
</script>

<dialog bind:this={dlg} class="quiet q-camp" tabindex="-1" aria-label={pick(camp.name, i18n.locale)} data-sfx="self" onclose={() => (open = false)} oncancel={() => cue('back')} onclick={backdrop}>
  {#if open}
    <div class="ph">
      <Photo photo={camp.photo} fill />
      <span class="x"><NavButton kind="close" look="photo" onclick={() => (open = false)} /></span>
    </div>
    <div class="cb guide" {...{ [`data-${attr}`]: camp.id }}>
      <div class="hd">
        <div class="f1">
          <h2 class="nm q-title"><Txt l={camp.name} {note} /></h2>
          <p class="sb">{t(`travel.camps.kind.${camp.type}`)} · {area}{#if tag} · <span class="pk"><Txt l={tag.text} {note} /></span>{/if}</p>
        </div>
        {#if picked}<span class="star"><Icon name="star" size={22} fill /></span>{/if}
      </div>
      <p class="desc"><Txt l={camp.desc} {note} /></p>
      {#if rest.length}<ul class="tags">{#each rest as x, i (i)}<li class="q-tag"><Txt l={x.text} {note} /></li>{/each}</ul>{/if}
      <dl class="q-card facts">
        <div class="q-kv"><dt>{t('travel.camps.origin')}</dt><dd>{t('travel.map.mode.drive')} {t('travel.camps.drive', { min: camp.fromMin })} · {fmtKm(camp.fromKm)}</dd></div>
        <div class="q-kv"><dt>{t('travel.camps.fee')}</dt><dd><Txt l={camp.fee} {note} /></dd></div>
        {#if AMENITIES.some((a) => camp[a])}
          <div class="q-kv"><dt>{t('travel.camps.has')}</dt><dd class="am">{#each AMENITIES as a (a)}{#if camp[a]}<span><Icon name={ICON[a]} size={16} />{t(`travel.camps.${a}`)}</span>{/if}{/each}</dd></div>
        {/if}
      </dl>
      <div class="acts">
        {#if onmap}<button type="button" class="q-btn" data-camp-onmap data-sfx="page" onclick={() => ((open = false), onmap(camp.id))}><Icon name="pin" size={18} />{t('travel.camps.onMap')}</button>{/if}
        {#if maps}
          <a class="q-btn primary" href={maps} target="_blank" rel="noopener noreferrer" data-camp-maps data-sfx="open" aria-label="{t('travel.camps.maps')} ({t('travel.opens')})"><Icon name="navigate" size={17} />{t('travel.camps.maps')}</a>
        {/if}
      </div>
    </div>
  {/if}
</dialog>

<style>
  .q-camp {
    margin: auto auto 0; padding: 0; border: 0; width: 100%; max-width: 480px; max-height: calc(100dvh - var(--ui-top, 0px) - 40px);
    border-radius: var(--q-r-sheet) var(--q-r-sheet) 0 0; box-shadow: var(--q-shadow-float); overflow: hidden auto; overscroll-behavior: contain;
  }
  .q-camp:focus { outline: none; }
  .q-camp[open] { animation: up 240ms cubic-bezier(.2, .8, .2, 1); }
  .q-camp::backdrop { background: rgb(30 22 14 / .32); }
  :global(:root[data-tod='night']) .q-camp::backdrop { background: rgb(8 10 25 / .5); }
  p, h2 { margin: 0; }
  .ph { position: relative; height: 170px; background: var(--q-sunken); }
  .x { position: absolute; top: 6px; right: 6px; z-index: 1; }
  .cb { padding: 16px 16px calc(max(var(--safe-bottom, 0px), 12px) + 12px); display: grid; gap: 12px; }
  .hd { display: flex; align-items: flex-start; gap: 8px; }
  .f1 { flex: 1; min-width: 0; }
  .nm { font-size: var(--q-fs-title); line-height: 1.3; }
  .sb { margin-top: 2px; font-size: var(--q-fs-s); color: var(--q-muted); }
  .pk { font: var(--q-w-b) var(--q-fs-xs)/1.4 var(--q-font); color: var(--q-accent-ink); background: var(--q-accent-soft); padding: 1px 6px; border-radius: 6px; }
  .star { color: var(--q-accent); padding-top: 6px; display: flex; }
  .desc { line-height: 1.6; }
  .tags { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px; }
  .tags .q-tag { font-size: 12px; padding: 3px 8px; }
  .facts { margin: 0; }
  dd { margin: 0; }
  .am { display: flex; gap: 10px; align-items: center; color: var(--q-ink-2); }
  .am span { display: inline-flex; align-items: center; gap: 4px; }
  .acts { display: flex; gap: 10px; }
  .acts .q-btn { flex: 1; }
  @keyframes up { from { transform: translateY(100%); } to { transform: none; } }
  @media (prefers-reduced-motion: reduce) { .q-camp[open] { animation: none; } }
</style>
