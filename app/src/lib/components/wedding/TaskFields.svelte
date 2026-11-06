<script lang="ts">
  // A task's fields (けっこんしき's ✎ and ＋): its name, its category (the board's list; one no longer in it is kept as
  // an option while it's this task's), the day it starts (optional, with なしに する: a date wheel has no way back to
  // blank) and the day it's due (required on a task; a subtask has neither date). Every input 16px or more (iOS
  // zooms under that). `error` names the field that stopped ほぞん.
  import { t } from '#lib/i18n/index.ts';
  import { WTASK_TITLE } from '#lib/contract/wedding.ts';
  import type { Fields } from './view.ts';

  interface Props {
    value: Fields;
    cats: readonly string[];
    error?: 'title' | 'due' | null;
  }
  let { value = $bindable(), cats, error = null }: Props = $props();
  const options = $derived(value.cat && !cats.includes(value.cat) ? [...cats, value.cat] : cats);
  const uid = $props.id();
</script>

<div class="fields" data-wed-fields>
  <label class="f">
    <span class="lbl">{t('wed.field.title')}</span>
    <input type="text" enterkeyhint="done" maxlength={WTASK_TITLE} bind:value={value.title} data-wed-field="title" data-sfx="none"
      aria-invalid={error === 'title' || undefined} aria-describedby={error === 'title' ? `${uid}-e` : undefined} />
  </label>
  <label class="f">
    <span class="lbl">{t('wed.field.cat')}</span>
    <select bind:value={value.cat} data-wed-field="cat" data-sfx="none">
      <option value="">{t('wed.field.noCat')}</option>
      {#each options as c (c)}<option value={c}>{c}</option>{/each}
    </select>
  </label>
  <div class="two">
    <label class="f">
      <span class="lbl">{t('wed.field.start')}</span>
      <span class="row">
        <input type="date" bind:value={value.start} data-wed-field="start" data-sfx="none" />
        {#if value.start}<button type="button" class="chip clear" data-wed-clear-start data-sfx="tick" onclick={() => (value.start = '')}>{t('wed.clear')}</button>{/if}
      </span>
    </label>
    <label class="f">
      <span class="lbl">{t('wed.field.due')}</span>
      <input type="date" bind:value={value.due} data-wed-field="due" data-sfx="none" aria-invalid={error === 'due' || undefined}
        aria-describedby={error === 'due' ? `${uid}-e` : undefined} />
    </label>
  </div>
  {#if error}<p class="err" id="{uid}-e" role="alert" data-wed-error={error}>{t(error === 'title' ? 'wed.needTitle' : 'wed.needDue')}</p>{/if}
</div>

<style>
  .fields { display: grid; gap: 12px; }
  .f { display: grid; gap: 5px; min-width: 0; }
  .lbl { font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); padding-left: 4px; }
  input, select {
    width: 100%; min-width: 0; min-height: var(--hit); padding: 8px 12px; border-radius: 14px; border: 0; box-sizing: border-box;
    font: 500 var(--fs-input)/1.3 var(--font-ui); color: var(--c-ink); background: var(--c-card); box-shadow: inset 0 0 0 2px var(--c-edge);
    -webkit-appearance: none; appearance: none;
  }
  select { background-image: linear-gradient(45deg, transparent 50%, var(--c-ink-soft) 50%), linear-gradient(135deg, var(--c-ink-soft) 50%, transparent 50%);
    background-position: calc(100% - 20px) 55%, calc(100% - 14px) 55%; background-size: 6px 6px; background-repeat: no-repeat; padding-right: 34px; }
  input[type='date'] { display: block; text-align: left; }
  input[aria-invalid='true'] { box-shadow: inset 0 0 0 3px var(--c-coral); }
  input:focus-visible, select:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  /* the two days one under the other, in the order they happen (start, then due): a date field needs the width */
  .two { display: grid; grid-template-columns: 1fr; gap: 12px; }
  .row { display: flex; gap: 6px; align-items: center; min-width: 0; }
  .row input { flex: 1; }
  .clear { flex: none; }
  .err { margin: 0; padding-left: 4px; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--coral-text); }
</style>
