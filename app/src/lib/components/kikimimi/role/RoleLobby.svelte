<script lang="ts">
  // ふたりで ロールプレイ's lobby (docs/kikimimi-mic.md §2.5), its own chunk: what it is (a scene acted out in English,
  // each on their own turn; the voice heard only on this phone), the scene (the host picks one of the units', the others
  // see it), the two role cards (each role's name, its villagers and goal in each part, its key phrases with their
  // Japanese; mine marked あなた, by our places among those joined: A, then B), who's in, and the foot: alone, さそう;
  // then the host's 「はじめる（2人）」 once someone has joined (it needs two); the others wait. 「ほかのゲームにする」
  // takes the host back to the quiz's lobby and its picker.
  import type { Who } from '#lib/types.ts';
  import { ORDER } from '#lib/kikimimi/round/session.ts';
  import { roleOpts, type Key, type RoleCard } from '#lib/kikimimi/games/role/def.ts';
  import { SCENES } from '#lib/kikimimi/games/role/scenes.ts';
  import { pickScene, playableScenes } from '#lib/kikimimi/games/role/lane.ts';
  import type { QuizGame } from '../game.svelte.ts';
  import { roleOfWho, unitName } from './board.ts';
  import PlayerChip from '../frame/PlayerChip.svelte';
  import OfficialArt from '../../characters/OfficialArt.svelte';
  import { villagerArt } from '#lib/art.ts';
  import { rosterName as name } from '../scene/stage.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { villagerNameOf } from '#lib/ui-state/viewer.ts';
  import { t } from '#lib/i18n/index.ts';

  let { game }: { game: QuizGame } = $props();
  const v = $derived(game.view);
  const at = $derived(roleOpts(SCENES.length).decode(v.o)?.scene ?? 0);
  const scene = $derived(SCENES[at]);
  const cards = $derived(game.items as RoleCard[]);
  const joined = (w: Who) => v.players.some((p) => p.who === w);
  /** Everyone in the lobby or on the island: joined first (A B G), then those here who haven't. */
  const people = $derived(ORDER.filter((w) => w === game.me || joined(w) || game.here.includes(w)));
  const mine = $derived(roleOfWho(v, game.me));
  const hostName = $derived(week.view && v.host ? villagerNameOf(week.view, v.host) : '');
  /** Each role's key phrases (the lines it says), once each. */
  const keysOf = (r: number): Key[] => [...new Map(cards.filter((c) => c.turn.role === r).flatMap((c) => c.turn.keys).map((k) => [k.ph, k])).values()];
  /** Each part's villager in a role. */
  const whoIn = (p: (typeof scene.parts)[number], r: number) => (r === 0 ? p.a : cards.find((c) => c.id === p.id)?.lines.find((l) => l.who !== p.a)?.who);

  function pick(k: number) {
    if (!v.amHost || k === at) return;
    pickScene(k);
    game.configure({});
  }
</script>

<div class="role" data-kiki-page="role" data-role-lobby={at}>
  <p class="about card">{t('kiki.role.about')}<small>🔒 {t('kiki.role.private')}</small></p>

  <section class="sec" aria-labelledby="kr-scene">
    <h3 id="kr-scene" class="sec-label">{t('kiki.role.scene')}</h3>
    <div class="scenes" role="radiogroup" aria-labelledby="kr-scene">
      {#each playableScenes() as k (k)}
        <button type="button" class="chip" role="radio" aria-checked={k === at} aria-disabled={!v.amHost && k !== at} data-role-scene={k}
          data-sfx={k === at ? 'none' : 'tick'} onclick={() => pick(k)}>{unitName(SCENES[k].unit)}</button>
      {/each}
    </div>
  </section>

  <section class="sec" aria-labelledby="kr-roles">
    <h3 id="kr-roles" class="sec-label">{t('kiki.role.roles')}</h3>
    {#each [0, 1] as r (r)}
      <div class="rc card" data-role-rc={r} data-mine={r === mine || undefined}>
        <p class="rh"><b>{scene.as[r]}</b>{#if r === mine}<span class="you">{t('kiki.role.you')}</span>{/if}</p>
        <ol class="goals">
          {#each scene.parts as p, j (p.id)}
            {@const w = whoIn(p, r)}
            <li>
              {#if w}<OfficialArt key={villagerArt(w, true)} alt="" size={32} />{/if}
              <span><small>{t('kiki.role.part', { k: j + 1 })}{w ? `・${name(w)}` : ''}</small>{p.goals[r]}</span>
            </li>
          {/each}
        </ol>
        {#if keysOf(r).length}
          <ul class="keys" aria-label={t('kiki.role.keys')}>
            {#each keysOf(r) as k (k.ph)}<li class="key" data-role-key={k.ph}><b lang="en">{k.en}</b><small>{k.ja}</small></li>{/each}
          </ul>
        {/if}
      </div>
    {/each}
  </section>

  <section class="sec" aria-labelledby="kr-who" data-kiki-players>
    <h3 id="kr-who" class="sec-label">{t('kiki.players')}</h3>
    <div class="who card">
      {#each people as w (w)}
        <PlayerChip who={w} state={joined(w) ? 'here' : 'away'} note={joined(w) ? scene.as[roleOfWho(v, w)] : t('kiki.notYet')} size={48} />
      {/each}
    </div>
    {#if v.players.length < 2}<p class="hint" data-role-need-two>{t('kiki.role.needTwo')}</p>{/if}
  </section>
  {#if v.amHost}
    <button type="button" class="btn small paper other" data-role-other data-sfx="back" onclick={() => game.configure({ ladder: false })}>{t('kiki.role.other')}</button>
  {/if}
</div>

<div class="level-acts">
  {#if v.amHost && v.local}
    <button type="button" class="btn" data-kiki-invite-all data-sfx="open" onclick={() => game.invite()}>{t('kiki.inviteAll')}</button>
  {:else if v.amHost && v.players.length > 1}
    <button type="button" class="btn" data-kiki-start data-sfx="confirm" onclick={() => game.go()}>{t('kiki.startN', { n: v.players.length })}</button>
  {:else if v.amHost}
    <p class="wait" role="status">{t('kiki.role.needTwo')}</p>
  {:else}
    <p class="wait" role="status">{t('kiki.waitHost', { name: hostName })}</p>
  {/if}
</div>

<style>
  .role { display: grid; gap: 14px; }
  .sec { display: grid; gap: 8px; }
  .about { margin: 0; display: grid; gap: 6px; padding: 12px 14px; font: 700 var(--fs-body)/1.5 var(--font-ui); color: var(--text); box-shadow: var(--sh-lip), inset 0 0 0 2px var(--c-yuzu); }
  .about small { font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .scenes { display: flex; flex-wrap: wrap; gap: 8px; }
  .scenes .chip[aria-disabled='true'] { background: var(--ctl-off); color: var(--text-soft); box-shadow: none; cursor: default; }
  .rc { display: grid; gap: 8px; padding: 12px 14px; }
  .rc[data-mine] { box-shadow: var(--sh-lip), inset 0 0 0 2px var(--c-leaf); }
  .rh { margin: 0; display: flex; align-items: center; gap: 8px; font: 700 var(--fs-body)/1.3 var(--font-ui); color: var(--text); }
  .you { padding: 1px 8px; border-radius: var(--r-pill); background: var(--c-yuzu); color: var(--c-ink); font: 700 var(--fs-s)/1.4 var(--font-ui); }
  .goals { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
  .goals li { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 8px; line-height: 0; }
  .goals span { display: grid; gap: 1px; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text); }
  .goals small { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .keys { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px; }
  .key { display: grid; padding: 4px 10px; border-radius: 12px; background: var(--ctl-off); }
  .key b { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text); }
  .key small { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .who { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px 18px; padding: 14px 10px 12px; }
  .hint { margin: 0 4px; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .other { justify-self: center; min-height: var(--hit); }
  .wait { flex: 1; margin: 0; padding: 14px 0; text-align: center; font: 700 var(--fs-body)/1.4 var(--font-ui); color: var(--text-soft); }
</style>
