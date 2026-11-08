<script lang="ts">
  // A villager's letter (docs/kikimimi.md "Stamps, letters and landmarks"): the host of a unit I stamped writes a few lines of English on island
  // paper, signed; 「にほんごやく」 shows the gloss under it (hidden by default: the English first). Folded, it's an
  // envelope row (the villager's face, 「{name}から てがみ」, the day) that opens it in place. Text only: nothing plays.
  // Shared: the results' strip (open), a unit's page and ずかん's スタンプ (folded; letters.ts lettersOf lists them).
  import type { Letter } from '#lib/kikimimi/letters.ts';
  import type { RosterId } from '#lib/villagers/roster.ts';
  import OfficialArt from '../../characters/OfficialArt.svelte';
  import { villagerArt } from '#lib/art.ts';
  import { rosterName } from '../scene/stage.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { villagerNameOf } from '#lib/ui-state/viewer.ts';
  import { t } from '#lib/i18n/index.ts';

  let { letter, open = false, fresh = false }: {
    letter: Pick<Letter, 'unit' | 'host' | 'en' | 'ja'> & { day?: string };
    /** Open at first (the results'), else the envelope row. */
    open?: boolean;
    /** Just arrived: 「{name}から てがみが とどきました！」 over it. */
    fresh?: boolean;
  } = $props();

  // svelte-ignore state_referenced_locally
  let shown = $state(open);
  let ja = $state(false);
  const sender = $derived(rosterName(letter.host as RosterId));
  const to = $derived(week.view ? villagerNameOf(week.view, week.view.viewer) : '');
  const id = $derived(`kk-letter-${letter.unit}`);
  const md = (d: string) => d.slice(5).replace('-', '/').replace(/^0/, '').replace('/0', '/');
</script>

<section class="letter" class:shown data-kiki-letter={letter.unit} data-open={shown || undefined}>
  <button type="button" class="env" aria-expanded={shown} aria-controls={id} data-kiki-letter-open data-sfx={shown ? 'tick' : 'open'} onclick={() => (shown = !shown)}>
    <span class="face" aria-hidden="true"><OfficialArt key={villagerArt(letter.host, true)} alt="" size={36} /></span>
    <span class="etxt">
      <b>{fresh ? t('kiki.letter.came', { name: sender }) : t('kiki.letter.by', { name: sender })}</b>
      {#if letter.day}<small>{md(letter.day)}</small>{/if}
    </span>
    <span class="seal" aria-hidden="true">{shown ? '✉️' : '💌'}</span>
  </button>
  {#if shown}
    <div class="paper" {id}>
      <p class="en" lang="en" data-kiki-letter-en>
        {#if to}<span class="dear">Dear {to},</span>{/if}
        {letter.en}
        <span class="sign">— {sender}</span>
      </p>
      <button type="button" class="chip jat" aria-pressed={ja} data-kiki-letter-ja data-sfx="tick" onclick={() => (ja = !ja)}>{t('kiki.letter.ja')}</button>
      {#if ja}<p class="ja" lang="ja" data-kiki-letter-gloss>{letter.ja}</p>{/if}
    </div>
  {/if}
</section>

<style>
  .letter { border-radius: var(--r-card); background: var(--card); box-shadow: var(--sh-lip); overflow: hidden; }
  .env {
    appearance: none; border: 0; background: none; color: inherit; font: inherit; cursor: pointer; width: 100%; min-height: 60px;
    display: flex; align-items: center; gap: 10px; padding: 10px 14px; text-align: left;
  }
  .face { flex: none; width: 40px; height: 40px; border-radius: 50%; overflow: hidden; display: grid; place-items: center; line-height: 0; background: color-mix(in srgb, var(--c-coral) 22%, var(--card)); }
  .etxt { flex: 1; min-width: 0; display: grid; gap: 2px; }
  .etxt b { font: 700 var(--fs-body)/1.3 var(--font-ui); }
  .etxt small { font: 700 var(--fs-xs)/1.2 var(--font-num); color: var(--text-soft); }
  .seal { flex: none; font-size: 22px; line-height: 1; rotate: -8deg; }
  /* island stationery: cream, a coral edge like the post office's */
  .paper {
    display: grid; gap: 10px; padding: 14px 18px 16px; margin: 0 10px 10px; border-radius: 14px;
    background: color-mix(in srgb, var(--c-yuzu) 14%, var(--c-card));
    box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--c-coral) 30%, transparent);
    color: var(--c-ink);
  }
  .paper p { margin: 0; }
  .en { display: grid; gap: 4px; font: 600 var(--fs-body)/1.6 var(--font-ui); }
  .dear, .sign { font-weight: 700; }
  .sign { justify-self: end; }
  .jat { justify-self: start; min-height: var(--hit); }
  .ja { font: 600 var(--fs-s)/1.6 var(--font-ui); color: color-mix(in srgb, var(--c-ink) 78%, transparent); }
</style>
