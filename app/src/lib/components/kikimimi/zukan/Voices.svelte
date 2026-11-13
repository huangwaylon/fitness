<script lang="ts">
  // ずかん › こえ (docs/kikimimi.md "図鑑"): the cast's 18 voices (speech.ts CAST_IDS: 12 American, the few UK and
  // AU ones of the accent-exposure items) as villager cards: the voice's face (its first villager), its accent and kind,
  // the villagers who speak with it, the items heard in it, and caught after 10 understood (zukan.ts voicesOf). Unheard
  // ones are silhouettes. A tap plays a sample: a clip I've heard in it first, else any (the levels loaded for one if
  // none is). Its own chunk.
  import { CAST_IDS } from '#lib/kikimimi/speech.ts';
  import { accentOf, type CastId } from '#lib/kikimimi/bank.ts';
  import { VOICE_CAUGHT, sampleClip, voiceVillagers, voicesOf } from '#lib/kikimimi/zukan.ts';
  import { villagerArt } from '#lib/art.ts';
  import OfficialArt from '../../characters/OfficialArt.svelte';
  import { rosterName } from '../scene/stage.ts';
  import { currentAnswers } from '../progress.svelte.ts';
  import { loadLevels, type ZukanData } from './data.svelte.ts';
  import { t } from '#lib/i18n/index.ts';

  let { data }: { data: ZukanData } = $props();
  const answers = $derived(currentAnswers());
  const voices = $derived((void data.ready, voicesOf(answers, data.info)));
  const caught = $derived([...voices.values()].filter((v) => v.caught).length);
  const cards = CAST_IDS.map((id) => {
    const { home, exposure } = voiceVillagers(id);
    return { id, accent: accentOf(id), face: home[0] ?? exposure[0], users: home.length ? home : exposure, exposure: !home.length };
  });
  let open = $state<CastId | null>(null);
  /** The voice whose sample is coming (its levels loading). */
  let wait = $state<CastId | null>(null);
  async function sample(id: CastId) {
    open = id;
    const heard = new Set(answers.map((a) => a.id));
    let clip = sampleClip(id, data.items(), heard);
    if (!clip) {
      wait = id;
      await loadLevels().catch(() => {});
      data.ready++;
      wait = null;
      clip = sampleClip(id, data.items(), heard);
    }
    if (clip && open === id) await data.play(clip, `v:${id}`);
  }
  const FLAG = { us: '🇺🇸', uk: '🇬🇧', au: '🇦🇺' } as const;
</script>

<div class="voices" data-kiki-voices>
  <div class="top card">
    <span class="big" aria-hidden="true">🎙️</span>
    <span class="ttxt"><b>{t('kiki.zukan.tab.voices')}</b><small data-kiki-voices-caught={caught}>{t('kiki.zukan.voicesCaught', { k: caught, n: CAST_IDS.length })} · {t('kiki.zukan.voiceHow')}</small></span>
  </div>
  <div class="grid">
    {#each cards as c (c.id)}
      {@const v = voices.get(c.id)}
      <button type="button" class="vc card" class:unheard={!v} class:got={v?.caught} aria-expanded={open === c.id} data-kiki-voice={c.id} data-heard={v?.heard ?? 0}
        data-caught={v?.caught || undefined} data-sounding={data.sounding === `v:${c.id}` || undefined} data-sample={open === c.id && data.sample ? data.sample : undefined}
        aria-busy={wait === c.id} data-sfx="tick" onclick={() => sample(c.id)}>
        <span class="face" aria-hidden="true"><OfficialArt key={villagerArt(c.face, true)} alt="" size={52} /></span>
        <span class="acc">{FLAG[c.accent]} {t(`kiki.accent.${c.accent}`)}</span>
        <b>{t(`kiki.voice.${c.id}`)}</b>
        <small class="n">{v ? t('kiki.zukan.voiceHeard', { n: v.heard }) : t('kiki.zukan.voiceNone')}</small>
        {#if v}<span class="meter" aria-hidden="true"><i style:width="{Math.min(1, v.understood / VOICE_CAUGHT) * 100}%"></i></span>{/if}
        {#if v?.caught}<span class="got-mark">{t('kiki.zukan.voiceGot')}</span>{/if}
        <span class="play" aria-hidden="true">{data.sounding === `v:${c.id}` ? '🔊' : '▶︎'}</span>
      </button>
      {#if open === c.id}
        <div class="users card" data-kiki-voice-users={c.id}>
          <small>{c.exposure ? t('kiki.zukan.voiceAlso') : t('kiki.zukan.voiceUsers')}</small>
          <div class="heads">
            {#each c.users.slice(0, 10) as w (w)}<span class="head" title={rosterName(w)}><OfficialArt key={villagerArt(w, true)} alt={rosterName(w)} size={32} /></span>{/each}
            {#if c.users.length > 10}<span class="more">+{c.users.length - 10}</span>{/if}
          </div>
        </div>
      {/if}
    {/each}
  </div>
</div>

<style>
  .voices { display: grid; gap: 12px; }
  .top { display: flex; align-items: center; gap: 12px; padding: 12px 14px; }
  .big { font-size: 30px; line-height: 1; }
  .ttxt { flex: 1; display: grid; gap: 2px; }
  .ttxt b { font: 700 var(--fs-talk)/1.2 var(--font-ui); }
  .ttxt small { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); grid-auto-flow: row dense; gap: 8px; }
  .vc {
    position: relative; appearance: none; border: 0; cursor: pointer; font: inherit; color: var(--text); text-align: left; padding: 10px 10px 10px;
    display: grid; grid-template-columns: 56px 1fr; grid-template-rows: auto auto auto auto; column-gap: 8px; row-gap: 2px; align-items: center;
  }
  .vc[aria-expanded='true'] { box-shadow: inset 0 0 0 2.5px var(--c-yuzu-lip), var(--sh-lip); }
  .face { grid-row: 1 / 5; display: inline-grid; place-items: center; width: 56px; height: 56px; border-radius: 50%; background: var(--lip); overflow: hidden; }
  .unheard .face { filter: brightness(0); opacity: .22; }
  .acc { font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); }
  .vc b { font: 700 var(--fs-s)/1.25 var(--font-ui); }
  .n { font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); }
  .meter { height: 6px; border-radius: var(--r-pill); background: var(--ctl-off); overflow: hidden; margin-right: 22px; }
  .meter i { display: block; height: 100%; border-radius: inherit; background: var(--c-leaf-edge); }
  .got .meter i { background: var(--c-yuzu-lip); }
  .got-mark {
    position: absolute; top: -6px; right: -2px; padding: 2px 7px; border-radius: var(--r-pill); background: var(--c-yuzu); color: var(--c-ink);
    font: 700 var(--fs-xs)/1.3 var(--font-ui);
  }
  .play { position: absolute; right: 8px; bottom: 8px; font-size: 13px; color: var(--text-soft); }
  [data-sounding] .play { color: var(--leaf-text); }
  .users { grid-column: 1 / -1; display: grid; gap: 6px; padding: 10px 12px; }
  .users small { font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); }
  .heads { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
  .head { display: inline-grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; background: var(--lip); overflow: hidden; }
  .more { font: 700 var(--fs-xs)/1 var(--font-num); color: var(--text-soft); padding-left: 4px; }
</style>
