<script lang="ts">
  // ずかん's なかま (docs/design.md "Zukan", "Visitors: roles"): NH's special characters, each with NH's own head icon
  // (static/room/npc/: scripts/npc-icons.ts), their official name and where we meet them: the visitors, the guests, the
  // shop's twins, the museum's curator, K.K. on his stool, Resetti at the island's reset, Booker and Copper at the
  // pairing gate, the ones to choose as a villager, and those with no role on our island (in here only).
  import { CAST, type CastRole } from '#lib/world/visitorRoles.ts';
  import { staticUrl } from '#lib/staticUrl.ts';
  import { t } from '#lib/i18n/index.ts';

  const ORDER: readonly CastRole[] = ['shop', 'museum', 'stool', 'visit', 'guest', 'reset', 'gate', 'roster', 'none'];
  const groups = ORDER.map((role) => ({ role, list: CAST.filter(([, , r]) => r === role) })).filter((g) => g.list.length);
</script>

<div class="cast" data-cast>
  {#each groups as g (g.role)}
    <h2 class="sec-label" data-cast-role={g.role}>{t(`cast.role.${g.role}`)}</h2>
    <ul class="grid">
      {#each g.list as [id] (id)}
        <li class="who" data-cast-id={id}>
          <img src={staticUrl(`room/npc/${id}.webp`)} alt="" width="56" height="56" loading="lazy" decoding="async" />
          <span class="nm">{t(`cast.name.${id}`)}</span>
        </li>
      {/each}
    </ul>
  {/each}
</div>

<style>
  .cast { display: grid; gap: 8px; padding-bottom: 12px; }
  .grid { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(84px, 1fr)); gap: 8px; }
  .who { display: grid; justify-items: center; gap: 4px; padding: 8px 4px; border-radius: var(--r-btn); background: var(--ctl); box-shadow: var(--sh-ctl); }
  .who img { width: 56px; height: 56px; object-fit: contain; }
  .nm { font: 700 var(--fs-s)/1.2 var(--font-ui); text-align: center; overflow-wrap: anywhere; }
</style>
