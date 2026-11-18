<script lang="ts">
  // 英語すごろく's 遊び方: the tab's page and the play screen's ⋯ sheet.
  import { REWARD, REWARD_GOAL } from '../game.ts';
  import { s } from '../i18n.ts';
</script>

<ol class="how">
  <li>{s('how1')}</li><li>{s('how2')}</li><li>{s('how3')}</li><li>{s('how4')}</li><li>{s('how7')}</li><li>{s('how5')}</li><li>{s('how6', { n: REWARD, g: REWARD + REWARD_GOAL })}</li>
</ol>

<style>
  .how { margin: 0; padding-left: 28px !important; display: grid; gap: 8px; font-size: var(--fs-body); line-height: 1.5; }
</style>
