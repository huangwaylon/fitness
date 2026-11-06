<script lang="ts">
  // A task's fields (けっこんしき's ✎ and ＋): its name, its category (the board's list; one no longer in it is kept as
  // an option while it's this task's), the day it starts (optional, with なしに する: a date wheel has no way back to
  // blank) and the day it's due (required), one under the other in the order they happen; `dated` false (a task
  // promoted from a checklist, which holds no dates): the name and category only. Every input 16px or more (iOS zooms
  // under that). `errors`: the fields that stopped ほぞん, each said at once.
  import { t } from '#lib/i18n/index.ts';
  import { WTASK_TITLE } from '#lib/contract/wedding.ts';
  import type { Fields } from './view.ts';

  interface Props {
    value: Fields;
    cats: readonly string[];
    dated: boolean;
    errors: { title: boolean; due: boolean };
  }
  let { value = $bindable(), cats, dated, errors }: Props = $props();
  const options = $derived(value.cat && !cats.includes(value.cat) ? [...cats, value.cat] : cats);
  const uid = $props.id();
</script>

<div class="fields">
  <label class="f">
    <span class="w-lbl">{t('wed.field.title')}</span>
    <input class="w-in" type="text" enterkeyhint="done" maxlength={WTASK_TITLE} bind:value={value.title} data-wed-field="title" data-sfx="none"
      aria-invalid={errors.title || undefined} aria-describedby={errors.title ? `${uid}-t` : undefined} />
    {#if errors.title}<span class="err" id="{uid}-t" role="alert" data-wed-error="title">{t('wed.needTitle')}</span>{/if}
  </label>
  <label class="f">
    <span class="w-lbl">{t('wed.field.cat')}</span>
    <select class="w-in" bind:value={value.cat} data-wed-field="cat" data-sfx="none">
      <option value="">{t('wed.field.noCat')}</option>
      {#each options as c (c)}<option value={c}>{c}</option>{/each}
    </select>
  </label>
  {#if dated}
    <label class="f">
      <span class="w-lbl">{t('wed.field.start')}</span>
      <span class="row">
        <input class="w-in" type="date" bind:value={value.start} data-wed-field="start" data-sfx="none" />
        {#if value.start}<button type="button" class="chip clear" data-sfx="tick" onclick={() => (value.start = '')}>{t('wed.clear')}</button>{/if}
      </span>
    </label>
    <label class="f">
      <span class="w-lbl">{t('wed.field.due')}<b class="req">{t('wed.field.required')}</b></span>
      <input class="w-in" type="date" bind:value={value.due} required data-wed-field="due" data-sfx="none" aria-invalid={errors.due || undefined}
        aria-describedby={errors.due ? `${uid}-d` : undefined} />
      {#if errors.due}<span class="err" id="{uid}-d" role="alert" data-wed-error="due">{t('wed.needDue')}</span>{/if}
    </label>
  {/if}
</div>

<style>
  .fields { display: grid; gap: 12px; }
  .f { display: grid; gap: 5px; min-width: 0; }
  .req { margin-left: 6px; color: var(--coral-text); }
  .row { display: flex; gap: 6px; align-items: center; min-width: 0; }
  .row input { flex: 1; }
  .clear { flex: none; }
  .err { padding-left: 4px; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--coral-text); }
</style>
