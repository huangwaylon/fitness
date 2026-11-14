<script lang="ts">
  // まるごと 聞く's stage (docs/kikimimi.md "まるごと 聞く"): the piece's speakers in a row, each a villager's head (a
  // generated piece) or a name's first letter in a tinted circle (a real recording: its people aren't villagers), the
  // one talking lifted (two where they overlap: clipPlayer.svelte.ts `talk`), the piece's bar while it plays, and its
  // kind (本物の録音 / 会話劇). Nothing of what's said shows before the reveal.
  import type { LongSpeaker } from '#lib/kikimimi/games/long/def.ts';
  import OfficialArt from '../../characters/OfficialArt.svelte';
  import ClipBar from '../scene/ClipBar.svelte';
  import { rosterName } from '../scene/stage.ts';
  import { villagerArt } from '#lib/art.ts';
  import { nameOf } from './board.ts';
  import { t } from '#lib/i18n/index.ts';

  let { speakers, real, talking, bar, now, small = false }: {
    speakers: readonly LongSpeaker[];
    real: boolean;
    /** The speakers talking now (their places). */
    talking: readonly number[];
    bar: { from: number; until: number; key: string } | null;
    now: number;
    small?: boolean;
  } = $props();
  const TINTS = ['var(--c-mint)', 'var(--c-yuzu)', 'var(--c-sky)', 'var(--c-lilac)'];
</script>

<div class="stage obj-cream" class:small data-kiki-frame="long" data-live={bar ? 'true' : undefined}>
  <p class="kind" data-kiki-long-kind={real ? 'real' : 'drama'}><span aria-hidden="true">{real ? '🎙️' : '🎭'}</span> {real ? t('kiki.long.real') : t('kiki.long.drama')}</p>
  <ul class="who" aria-label={t('kiki.long.who')}>
    {#each speakers as s, k (s.key)}
      <li class="sp" class:talk={talking.includes(k)} data-speaker={k}>
        <span class="head" style:background={TINTS[k % TINTS.length]}>
          {#if s.villager}<OfficialArt key={villagerArt(s.villager, true)} alt={rosterName(s.villager)} size={small ? 40 : 56} eager />
          {:else}<span class="init" aria-hidden="true">{(s.name ?? '?').slice(0, 1)}</span>{/if}
        </span>
        <span class="nm">{nameOf(s, (id) => rosterName(id as never))}</span>
      </li>
    {/each}
  </ul>
  {#if bar}<ClipBar {bar} {now} height={8} />{/if}
</div>

<style>
  .stage { display: grid; gap: 8px; justify-items: center; padding: 10px 12px 12px; border-radius: var(--r-game); background: var(--c-card); color: var(--c-ink); box-shadow: var(--sh-lip-cream); }
  .kind { justify-self: start; margin: 0; padding: 2px 10px; border-radius: var(--r-pill); background: var(--ctl-off); font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }
  .who { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; justify-content: center; gap: 10px 14px; }
  .sp { display: grid; justify-items: center; gap: 4px; transition: transform var(--dur-quick); }
  .head { width: 64px; height: 64px; border-radius: 50%; display: grid; place-items: center; overflow: hidden; line-height: 0; }
  .small .head { width: 46px; height: 46px; }
  .init { font: 800 26px/1 var(--font-ui); color: var(--c-ink); }
  .small .init { font-size: 19px; }
  .nm { font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); max-width: 96px; text-align: center; }
  .talk { transform: translateY(-4px); }
  .talk .head { box-shadow: 0 0 0 3px var(--c-leaf); animation: bob 0.6s ease-in-out infinite alternate; }
  .talk .nm { color: var(--text); }
  @keyframes bob { from { transform: translateY(0); } to { transform: translateY(-3px); } }
</style>
