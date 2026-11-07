<script lang="ts">
  // A turn of ふたりで ロールプレイ (docs/kikimimi-mic.md §2.5; games/role/def.ts), its own chunk, in the round's frame
  // (frame/RoundFrame.svelte). Over the stage: where we are (場面 p · k / n), the part's two villagers (the speaker's
  // lifted, mine marked あなた), my role and its goal for this part. My turn: the line in Japanese, its key phrases as
  // chips (English, with their Japanese), the English faded on easy (else 「英文を見る」), the mic (RoleMic: tap, say it,
  // it stops on the silence after); the chips light as they're heard, what came through shows under them (mine only),
  // then 「もう一度話す」 (the phrases add up) or 次へ, which answers the phrases said; 「マイクなしで次へ」 always. The
  // partner's turn: their line's chips, dim, and 「よく聞いてね」; once their answer is in my phone answers that it heard
  // (def.ts HEARD), so the reveal shows both the ✓ chips, the line as written and a word of encouragement, and moves on.
  // No clip plays in a turn: the partner's own voice is the audio. What was heard lives in this view's state only.
  import { onDestroy, onMount } from 'svelte';
  import type { QuizGame } from '../game.svelte.ts';
  import { HEARD, lineOf, roleOpts, saidAnswer, saidOf, turnOk, type RoleCard } from '#lib/kikimimi/games/role/def.ts';
  import { SCENES } from '#lib/kikimimi/games/role/scenes.ts';
  import { rawOf } from '#lib/kikimimi/games/listened.ts';
  import type { Miss, Recogniser } from '#lib/mic/stt.ts';
  import { sttRound } from '../mic/sttRound.ts';
  import { currentReport } from '../progress.svelte.ts';
  import { easyFor, heardKeys, keepSaid, partsOf, roleHere, roleOfWho } from './board.ts';
  import RoleMic from './RoleMic.svelte';
  import RoundFrame from '../frame/RoundFrame.svelte';
  import { rosterName as name } from '../scene/stage.ts';
  import OfficialArt from '../../characters/OfficialArt.svelte';
  import { villagerArt } from '#lib/art.ts';
  import { t } from '#lib/i18n/index.ts';

  let { game }: { game: QuizGame } = $props();
  const v = $derived(game.view);
  const cards = $derived(game.items as RoleCard[]);
  const card = $derived(cards[v.i]);
  const key = $derived(`${v.g}:${v.i}`);
  const reveal = $derived(v.phase === 'reveal');
  const scene = $derived(SCENES[roleOpts(SCENES.length).decode(v.o)?.scene ?? 0]);
  const part = $derived(card ? scene.parts[card.turn.part] : undefined);
  const parts = $derived(partsOf(cards));
  /** This part's turns: where this one is among them. */
  const inPart = $derived(card ? cards.filter((c) => c.turn.part === card.turn.part) : []);
  const me = $derived(game.me);
  const mine = $derived(roleOfWho(v, me));
  /** I say this line: my role's, or the partner's while no one here plays it. */
  const speaking = $derived(!!card && (card.turn.role === mine || !roleHere(v, card.turn.role)));
  const alone = $derived(!!card && card.turn.role !== mine && speaking);
  const sent = $derived(v.answers[v.i] ?? null);
  const open = $derived(v.phase === 'answer' && !sent && !v.out);
  const line = $derived(card ? lineOf(card) : null);
  const keys = $derived(card?.turn.keys ?? []);
  /** The speaker's answer: mine, or (the reveal) theirs. */
  const theirs = $derived(v.players.find((p) => p.who !== me && roleOfWho(v, p.who) === card?.turn.role && p.pick && rawOf(p.pick) !== HEARD)?.pick ?? null);
  const shown = $derived(speaking ? rawOf(sent) : rawOf(theirs));
  const shownSaid = $derived(saidOf(shown));

  /** The phone's recogniser: looking, ready, or none can run here. */
  let rec = $state<Recogniser | 'none' | null>(null);
  const stt = sttRound();
  onMount(() => {
    let gone = false;
    void stt.ready().then((r) => !gone && (rec = r ?? 'none'));
    return () => (gone = true);
  });
  onDestroy(stt.release);

  let mic = $state<'idle' | 'listening' | 'checking'>('idle');
  /** This turn's takes: the phrases said so far (they add up), the last thing heard, or why nothing came. */
  let took = $state<{ key: string; mask: number; spoke: boolean; text?: string; miss?: Miss } | null>(null);
  const here = $derived(took?.key === key ? took : null);
  function heard(text: string) {
    if (!card || !open) return;
    const was = here?.mask ?? 0;
    took = { key, mask: was | heardKeys(text, keys), spoke: !!here?.spoke || !!text.trim(), text };
  }
  const missed = (m: Miss) => open && (took = { key, mask: here?.mask ?? 0, spoke: !!here?.spoke, miss: m });
  const send = () => open && game.answer(saidAnswer(here?.mask ?? 0, !!here?.spoke));

  /** The English line, faded: shown from the start on easy, else on a tap (by turn). */
  const easy = $derived(easyFor(scene.unit, currentReport()?.stats.level ?? null));
  let showEn = $state('');

  // the partner's answer in: mine says I heard it (the turn's reveal comes once we both have), once a turn
  let acked = '';
  $effect(() => {
    if (open && !speaking && acked !== key && v.players.some((p) => p.who !== me && p.answered && roleOfWho(v, p.who) === card?.turn.role)) {
      acked = key;
      game.answer(HEARD);
    }
  });
  // each turn's ✓ kept for the results' list (mine as I said it, the partner's at its reveal)
  $effect(() => {
    if (reveal && v.g) keepSaid(v.g, v.i, speaking ? sent : theirs);
  });

  const lit = (k: number): boolean => (here && open ? (here.mask & (1 << k)) !== 0 : !!shownSaid && (shownSaid.mask & (1 << k)) !== 0);
  const litN = $derived(keys.filter((_, k) => lit(k)).length);
  const ok = $derived(!!card && turnOk({ keys: keys.length }, shown));
  const missedKey = $derived(keys.find((_, k) => !lit(k)));
  const verdict = $derived(v.out ? 'out' : ok ? 'right' : 'wrong');
  const missLine = (m: Miss) => t(`kiki.role.miss.${m === 'none' || m === 'denied' || m === 'capped' ? m : 'other'}`);
  const who = $derived(part ? [part.a, ...new Set(card!.lines.map((l) => l.who).filter((w) => w !== part!.a))] : []);
</script>

{#if card && line && part}
{#snippet stage()}
  <div class="stage">
    <p class="step" data-role-progress>{t('kiki.role.progress', { p: card.turn.part + 1, k: inPart.indexOf(card) + 1, n: inPart.length })}</p>
    <div class="pair">
      {#each who as w, r (w)}
        <div class="one" class:talk={line.who === w && !reveal} class:pop={v.phase === 'lead' && line.who === w} data-role-seat={r} data-mine={r === mine || undefined}>
          <OfficialArt key={villagerArt(w, true)} alt={name(w)} size={64} eager />
          <span class="nm">{name(w)}</span>
          <span class="tag">{r === mine ? t('kiki.role.you') : t('kiki.role.partner')}</span>
        </div>
      {/each}
    </div>
    <p class="card-me" data-role-card={mine}><b>{scene.as[mine]}</b><span>{t('kiki.role.goal', { g: part.goals[mine] })}</span></p>
    {#if card.ctx && v.phase === 'lead' && parts.some((x) => x.at === v.i)}<p class="ctx" data-kiki-ctx>{card.ctx}</p>{/if}
  </div>
{/snippet}

{#snippet chips()}
  {#if keys.length}
    <ul class="keys" aria-label={t('kiki.role.keys')}>
      {#each keys as k, j (k.ph)}
        <li class="key" data-role-key={k.ph} data-lit={lit(j)}><span class="ok" aria-hidden="true">{lit(j) ? '✓' : '・'}</span><b lang="en">{k.en}</b><small>{k.ja}</small></li>
      {/each}
    </ul>
  {/if}
{/snippet}

{#snippet input()}
  <div class="turn" data-role-turn="{card.id}:{card.turn.k}" data-role-me={speaking ? 'speak' : 'listen'}>
    {#if reveal}
      <section class="said obj-cream" data-role-reveal={litN}>
        <p class="lbl">{t('kiki.role.line')}</p>
        <p class="en" lang="en">{line.en}</p>
        <p class="ja">{line.ja}</p>
      </section>
      {@render chips()}
      <p class="cheer" data-role-cheer>
        {keys.length ? (missedKey ? t('kiki.role.some', { w: missedKey.en }) : t('kiki.role.all')) : shownSaid?.spoke ? t('kiki.role.said') : t('kiki.role.quiet')}
      </p>
    {:else if v.phase === 'lead'}
      <p class="whose" data-role-whose={speaking ? 'mine' : 'theirs'}>{speaking ? t('kiki.role.turnMine') : t('kiki.role.turnTheirs')}</p>
    {:else if speaking}
      {#if alone}<p class="hint" data-role-alone>{t('kiki.role.alone')}</p>{/if}
      <section class="line obj-cream">
        <p class="lbl">{t('kiki.role.sayIt')}</p>
        <p class="ja big" data-role-ja>{line.ja}</p>
        {#if easy || showEn === key}<p class="en faded" lang="en" data-role-en>{line.en}</p>{/if}
      </section>
      {@render chips()}
      {#if !easy && showEn !== key}
        <button type="button" class="btn small paper" data-role-show-en data-sfx="tick" onclick={() => (showEn = key)}>{t('kiki.role.showEn')}</button>
      {/if}
      {#if !sent}
        {#if rec === 'none'}
          <p class="warn" data-role-unavailable>{t('kiki.role.unavailable')}</p>
        {:else if !rec}
          <p class="hint" data-role-preparing>{t('kiki.role.preparing')}</p>
        {:else}
          {#if here?.miss}<p class="warn" data-role-miss={here.miss}>{missLine(here.miss)}</p>{/if}
          <RoleMic {rec} bind:st={mic} idle={here ? t('kiki.role.retry') : t('kiki.role.talk')} onheard={heard} onmiss={missed} />
          {#if here?.text !== undefined}
            <p class="heard" data-role-heard><small>{t('kiki.role.heard')}</small><span lang="en">{here.text}</span></p>
          {/if}
        {/if}
        <div class="acts">
          {#if here && !here.miss && mic === 'idle'}
            <button type="button" class="btn" data-role-send data-sfx="confirm" onclick={send}>{t('kiki.role.send')}</button>
          {:else if mic === 'idle'}
            <button type="button" class="btn small paper" data-role-nomic data-sfx="tick" onclick={send}>{t('kiki.role.noMic')}</button>
          {/if}
        </div>
      {/if}
    {:else}
      <p class="listen" data-role-listen>👂 {t('kiki.role.listen')}</p>
      {@render chips()}
    {/if}
  </div>
{/snippet}

<RoundFrame {v} now={game.now} me={game.me} type="role" answered={!!sent} {verdict} {stage} {input} onnext={() => game.next()} onready={() => game.ready()} />
{/if}

<style>
  .stage { display: grid; gap: 8px; justify-items: center; }
  .step { margin: 0; padding: 2px 12px; border-radius: var(--r-pill); background: var(--ctl-off); color: var(--text-soft); font: 700 var(--fs-s)/1.4 var(--font-ui); }
  .pair { display: flex; justify-content: center; gap: 28px; }
  .one { display: grid; justify-items: center; gap: 2px; line-height: 0; opacity: .6; transform-origin: 50% 100%; transition: opacity var(--dur-quick); }
  .one.talk { opacity: 1; animation: bob 520ms ease-in-out infinite alternate; }
  .one.pop { animation: pop-in 420ms var(--ease-bounce) both; }
  .nm { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text); }
  .tag { padding: 1px 8px; border-radius: var(--r-pill); background: var(--ctl-off); font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }
  .one[data-mine] .tag { background: var(--c-yuzu); color: var(--c-ink); }
  .card-me { margin: 0; display: grid; gap: 2px; justify-items: center; text-align: center; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .card-me b { font-size: var(--fs-body); color: var(--text); }
  .ctx { margin: 0; text-align: center; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }

  .turn { display: grid; gap: 10px; justify-items: center; }
  .whose { margin: 0; font: 700 var(--fs-title)/1.2 var(--font-ui); color: var(--text); }
  .line, .said { width: 100%; display: grid; gap: 4px; padding: 12px 14px; border-radius: 16px; background: var(--c-card); color: var(--c-ink); box-shadow: var(--sh-lip-cream); }
  .lbl { margin: 0; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .ja { margin: 0; font: 700 var(--fs-body)/1.5 var(--font-ui); }
  .ja.big { font-size: var(--fs-talk); }
  .en { margin: 0; font: 700 var(--fs-body)/1.45 var(--font-ui); overflow-wrap: anywhere; }
  .en.faded { color: var(--text-soft); }
  .keys { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
  .key { display: grid; grid-template-columns: auto auto; column-gap: 6px; align-items: baseline; padding: 6px 12px; border-radius: 14px; background: var(--ctl-off); color: var(--text); }
  .key b { font: 700 var(--fs-body)/1.3 var(--font-ui); }
  .key small { grid-column: 2; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .key .ok { grid-row: span 2; font: 700 var(--fs-body)/1.3 var(--font-ui); color: var(--text-soft); }
  .key[data-lit='true'] { background: color-mix(in srgb, var(--c-leaf) 40%, var(--card)); }
  .key[data-lit='true'] .ok { color: var(--leaf-text); }
  .listen, .hint { margin: 0; text-align: center; font: 700 var(--fs-body)/1.5 var(--font-ui); color: var(--text); }
  .hint { font-size: var(--fs-s); color: var(--text-soft); }
  .warn { margin: 0; padding: 8px 12px; border-radius: 12px; text-align: center; font: 700 var(--fs-s)/1.5 var(--font-ui); color: var(--c-ink); background: color-mix(in srgb, var(--c-coral) 22%, var(--c-card)); }
  .heard { margin: 0; display: grid; gap: 2px; text-align: center; font: 700 var(--fs-body)/1.45 var(--font-ui); color: var(--text); overflow-wrap: anywhere; }
  .heard small { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .acts { display: flex; justify-content: center; gap: 8px; }
  .acts .btn { min-height: var(--hit); }
  .cheer { margin: 0; text-align: center; font: 700 var(--fs-body)/1.45 var(--font-ui); color: var(--text); }

  @keyframes bob { from { transform: translateY(0); } to { transform: translateY(-5px); } }
  @keyframes pop-in { from { transform: scale(.3); opacity: 0; } to { transform: none; opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { .one.talk, .one.pop { animation: none; } }
</style>
