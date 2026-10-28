<script lang="ts">
  import { t } from '#lib/i18n/index.ts';
  let { text }: { text: string } = $props();
</script>

<div class="juniper">
  <div class="bubble" aria-live="polite">
    <span class="who">{t('juniper.name')}</span>{text}
  </div>
  <svg class="juni" viewBox="0 0 100 100" aria-hidden="true"><use href="#v-juni" /></svg>
</div>

<style>
  .juniper { display: flex; align-items: flex-end; gap: 10px; }
  .bubble {
    position: relative; flex: 1; background: var(--bubble); color: var(--ink); border: 2px solid var(--paper-edge);
    border-radius: var(--r-lg); padding: 14px 16px 12px; font-size: 1.05rem; font-weight: 700; line-height: 1.38;
    box-shadow: var(--sh-soft); margin-bottom: 10px;
  }
  .who {
    position: absolute; top: -13px; left: 18px; font: 700 12px/1 var(--font-body); background: var(--sun); color: var(--ink);
    padding: 5px 10px; border-radius: var(--r-pill); transform: rotate(-3deg); box-shadow: 0 2px 0 var(--gold);
  }
  .bubble::after {
    content: ''; position: absolute; right: -11px; bottom: 14px; width: 20px; height: 20px; background: var(--bubble);
    border-right: 2px solid var(--paper-edge); border-bottom: 2px solid var(--paper-edge);
    transform: rotate(-45deg); border-bottom-right-radius: 5px;
  }
  .juni { width: 66px; height: 66px; flex: none; animation: breathe 3.2s ease-in-out infinite; transform-origin: 50% 100%; }
</style>
