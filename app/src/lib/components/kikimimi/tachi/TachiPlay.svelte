<script lang="ts">
  // A round of たちぎき (docs/kikimimi-engine.md "たちぎき"; games/tachi/def.ts), its own chunk, in the round's frame
  // (frame/RoundFrame.svelte: the players' chips, the timer, the status line, つぎへ / よみおわった). Three seats, the
  // speakers by first line, each face bobbing while its line plays (two at once where they overlap: clipPlayer's
  // `talk.all`); co-op, each face says whose it is (mine, the shared one, my partner's). The conversation plays before
  // its first round, the situation (`ctx`) under the seats; then three rounds:
  // - opinions: each claim a card with the three faces, a tap puts a face on it (taken off any other; again, off), 「できた」
  //   once mine are placed (co-op my own and the shared one; easy, the shared one's placed for me);
  // - changed: who changed their mind, one tap on a face;
  // - plan: what happens next, one tap on a choice (ChoiceGrid; its Japanese at the reveal).
  // After the first play, its lines replay one at a time (a chip per line: its number and face, text hidden till the
  // last reveal). The reveal: ○ / ×, the right faces and mine, 解説 (`why`); the conversation's last adds its note and the
  // whole transcript.
  import Note from '../frame/Note.svelte';
  import type { QuizGame } from '../game.svelte.ts';
  import { EMPTY, rawOf } from '#lib/kikimimi/games/listened.ts';
  import { SHARED, facesOf, givenClaim, type TachiCard } from '#lib/kikimimi/games/tachi/def.ts';
  import { RIGHT } from '#lib/kikimimi/score.ts';
  import { fresh, lineItem, okFor, partOf } from './board.ts';
  import { easy, isCoop, roleOf } from '../listenView.ts';
  import RoundFrame from '../frame/RoundFrame.svelte';
  import RevealFrame from '../frame/RevealFrame.svelte';
  import ChoiceGrid from '../frame/ChoiceGrid.svelte';
  import Why from '../frame/Why.svelte';
  import ClipBar from '../scene/ClipBar.svelte';
  import Transcript from '../Transcript.svelte';
  import { rosterName as name } from '../scene/stage.ts';
  import OfficialArt from '../../characters/OfficialArt.svelte';
  import { villagerArt } from '#lib/art.ts';
  import { t } from '#lib/i18n/index.ts';

  let { game }: { game: QuizGame } = $props();
  const v = $derived(game.view);
  const it = $derived(game.items[v.i] as TachiCard | undefined);
  const r = $derived(it?.tachi);
  const reveal = $derived(v.phase === 'reveal');
  const coop = $derived(isCoop(v));
  const role = $derived(roleOf(v, game.me));
  const right = $derived(r?.type === 'opinions' ? (r.answer as readonly number[]) : null);
  const given = $derived(right && easy(v) ? givenClaim(right) : -1);
  /** The faces I place (opinions; easy, the shared one is placed for me). */
  const faces = $derived(facesOf(role).filter((f) => given < 0 || f !== SHARED));
  const sent = $derived(v.answers[v.i] ?? null);
  const raw = $derived(rawOf(sent));

  /** My faces placed so far this round (before 「できた」): kept by the round. */
  let work = $state<{ key: string; a: number[] } | null>(null);
  const key = $derived(`${v.g}:${v.i}`);
  const placed = $derived<readonly number[]>(Array.isArray(raw) ? raw : work?.key === key ? work.a : it ? fresh(it, given >= 0) : []);
  const full = $derived(faces.every((f) => placed.includes(f)));
  const open = $derived(v.phase === 'answer' && !sent && !v.out);
  /** The first play: the conversation, nothing to answer yet. */
  const listening = $derived(r?.k === 0 && (v.phase === 'lead' || v.phase === 'play'));

  /** A face on a claim (off any other); on it already: off. */
  function put(j: number, f: number) {
    if (!open || j === given || !faces.includes(f)) return;
    const a = placed.map((x) => (x === f ? EMPTY : x));
    if (placed[j] !== f) a[j] = f;
    work = { key, a };
  }
  const done = () => open && full && game.answer([...placed]);
  const pick = (k: number) => open && game.answer(k);

  const ok = $derived(!!it && okFor(it, sent));
  const verdict = $derived(v.out ? 'out' : ok ? 'right' : sent ? 'wrong' : 'none');

  /** The speakers whose lines play now (the first play's turns, or a line replayed). */
  const talking = $derived.by(() => {
    if (!it) return new Set<number>();
    const s = game.sounding, tk = game.talk;
    if (s && s.i === -1 && s.at.startsWith(`${it.id}-`)) return new Set([it.tachi.who.indexOf(it.lines[Number(s.at.slice(it.id.length + 1)) - 1]?.who)]);
    return new Set(tk && tk.i === v.i ? tk.all.map((x) => it.tachi.who.indexOf(it.lines[x.k].who)) : []);
  });
  const bar = $derived(listening && v.phase === 'play' ? { from: v.playAt, until: v.playEnd, key: `p${v.i}:${v.playAt}` } : null);
  const canHear = $derived(v.speaks && !v.out && !listening && !!it);
  const hearing = $derived(game.sounding && game.sounding.i === -1 ? game.sounding.at : null);
  /** The conversation's last round: its reveal shows the whole transcript. */
  const last = $derived(reveal && r?.k === 2);
</script>

{#if it && r}
{#snippet seat(f: number, size: number)}
  {@const w = r.who[f]}
  {@const part = partOf(role, f)}
  <OfficialArt key={villagerArt(w, true)} alt={name(w)} {size} eager />
  <span class="nm">{name(w)}</span>
  {#if part}<span class="part" data-part={part}>{t(`kiki.tachi.part.${part}`)}</span>{/if}
{/snippet}

{#snippet stage()}
  <div class="stage">
    <p class="step" data-kiki-tachi-step={r.k}>{t('kiki.tachi.step', { c: r.conv + 1, k: r.k + 1 })}</p>
    <ul class="seats" aria-label={t('kiki.tachi.who')} data-kiki-tachi-seats>
      {#each r.who as w, f (w)}
        <li class="seat" class:talk={talking.has(f)} class:pop={v.phase === 'lead'} data-face={f} data-part={partOf(role, f)}>{@render seat(f, 60)}</li>
      {/each}
    </ul>
    {#if listening}
      <ClipBar {bar} now={game.now} height={8} />
      {#if it.ctx}<p class="ctx" data-kiki-ctx>{it.ctx}</p>{/if}
    {:else if it.ctx && !reveal}<p class="ctx" data-kiki-ctx>{it.ctx}</p>{/if}
  </div>
{/snippet}

{#snippet input()}
  {#if reveal}
    <RevealFrame out={v.out} right={ok} picked={!!sent} pts={RIGHT} {coop} rightNow={v.rightNow} />
  {:else if listening}
    <p class="ask" data-kiki-tachi-wait>{t(coop ? 'kiki.tachi.waitCoop' : 'kiki.tachi.wait')}</p>
  {:else if !v.out}
    <p class="ask">{r.type === 'plan' ? r.ask : t(`kiki.tachi.ask.${r.type}`)}</p>
    {#if r.type === 'opinions'}<p class="hint">{t(coop ? 'kiki.tachi.hintCoop' : 'kiki.tachi.hint')}</p>{/if}
  {/if}

  {#if !listening && !v.out}
    {#if r.type === 'opinions' && right}
      <ol class="claims" data-kiki-tachi-claims>
        {#each r.claims ?? [] as claim, j (j)}
          <li class="claim obj-cream" data-claim={j} data-given={j === given || undefined}>
            <p class="say">{claim}</p>
            <div class="faces" role="group" aria-label={claim}>
              {#each r.who as w, f (w)}
                {@const on = placed[j] === f}
                {@const mark = reveal ? (right[j] === f ? 'right' : on ? 'wrong' : null) : on ? 'on' : null}
                {@const mine = faces.includes(f) && j !== given}
                <button type="button" class="face tile-btn" data-face={f} data-on={on || undefined} data-mark={mark ?? undefined} aria-pressed={on}
                  aria-disabled={!open || !mine} aria-label={t('kiki.tachi.put', { name: name(w) })} data-sfx={open && mine ? 'choice-pick' : 'none'} onclick={() => put(j, f)}>
                  <OfficialArt key={villagerArt(w, true)} alt="" size={36} />
                  {#if mark === 'right'}<span class="sym ok" aria-hidden="true">○</span>{:else if mark === 'wrong'}<span class="sym ng" aria-hidden="true">×</span>{/if}
                </button>
              {/each}
            </div>
          </li>
        {/each}
      </ol>
    {:else if r.type === 'changed'}
      <div class="pick3" role="group" aria-label={t('kiki.tachi.ask.changed')} data-kiki-tachi-changed>
        {#each r.who as w, f (w)}
          {@const mark = reveal ? (r.answer === f ? 'right' : raw === f ? 'wrong' : null) : raw === f ? 'on' : null}
          <button type="button" class="who tile-btn" class:obj-cream={mark === 'right' || mark === 'wrong'} data-choice={f} data-mark={mark ?? undefined} aria-pressed={raw === f}
            aria-disabled={!open} data-sfx={open ? 'choice-pick' : 'none'} onclick={() => pick(f)}>
            <OfficialArt key={villagerArt(w, true)} alt="" size={52} />
            <span class="nm">{name(w)}</span>
            {#if mark === 'right'}<span class="sym ok" aria-hidden="true">○</span>{:else if mark === 'wrong'}<span class="sym ng" aria-hidden="true">×</span>{/if}
          </button>
        {/each}
      </div>
    {:else}
      <ChoiceGrid choices={it.choices} right={it.answer} ja={it.cja} {open} {reveal} dim={false} picked={typeof raw === 'number' ? raw : null} onlyMarked={reveal} onpick={pick} />
    {/if}
  {/if}

  {#if reveal && it.why}<Why text={it.why} />{/if}

  {#if canHear}
    <div class="lines" role="group" aria-label={t('kiki.tachi.lines')} data-kiki-tachi-lines>
      <small class="lab">{t('kiki.tachi.lines')}</small>
      {#each it.lines as l, k (k)}
        <button type="button" class="ln tile-btn" data-line={k} data-on={hearing === `${it.id}-${k + 1}` || undefined} aria-label={t('kiki.tachi.line', { n: k + 1, name: name(l.who) })}
          data-sfx="tick" onclick={() => game.hear(lineItem(it, k))}>
          <OfficialArt key={villagerArt(l.who, true)} alt="" size={24} /><span class="n" aria-hidden="true">{k + 1}</span>
        </button>
      {/each}
    </div>
  {/if}
{/snippet}

{#snippet after()}
  {#if last && !v.out}
    {#if it.note}<Note text={it.note} />{/if}
    <h3 class="script">{t('kiki.tachi.script')}</h3>
    <Transcript it={it} all={game.talk?.i === -1 && game.talk.at === it.id ? game.talk.all : []} clock={() => game.clock()} />
  {/if}
{/snippet}

{#snippet action()}
  {#if r.type === 'opinions' && right && v.phase === 'answer' && !v.out}
    <button type="button" class="btn" data-kiki-tachi-done aria-disabled={!full || !!sent} data-sfx={full && !sent ? 'confirm' : 'none'} onclick={done}>{t('kiki.tachi.done')}</button>
  {/if}
{/snippet}

<RoundFrame {game} {v} now={game.now} me={game.me} type="tachi-{r.type}" answered={!!sent} {verdict} {stage} {input} {after} {action} peek={r.k === 0} onnext={() => game.next()} onready={() => game.ready()} />
{/if}

<style>
  .stage { display: grid; gap: 8px; justify-items: center; }
  .step { margin: 0; padding: 2px 12px; border-radius: var(--r-pill); background: var(--ctl-off); color: var(--text-soft); font: 700 var(--fs-s)/1.4 var(--font-ui); }
  .seats { list-style: none; margin: 0; padding: 0; width: 100%; display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
  .seat { display: grid; justify-items: center; gap: 2px; line-height: 0; transform-origin: 50% 100%; transition: opacity var(--dur-quick); }
  .seat.pop { animation: if-pop-in 420ms var(--ease-bounce) both; }
  .seat.talk { animation: if-speak 520ms ease-in-out infinite alternate; }
  .seats:has(.talk) .seat:not(.talk) { opacity: .6; }
  .nm { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text); }
  .part { padding: 1px 8px; border-radius: var(--r-pill); font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); background: var(--ctl-off); }
  .part[data-part='mine'] { background: color-mix(in srgb, var(--c-yuzu) 15%, var(--warn-soft)); color: var(--text); }
  .part[data-part='shared'] { background: color-mix(in srgb, var(--c-mint) 45%, var(--card)); color: var(--text); }
  .seat[data-part='theirs'] { opacity: .7; }
  .ctx { margin: 0; text-align: center; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .ask { margin: 0; text-align: center; font: 700 var(--fs-body)/1.5 var(--font-ui); }
  .hint { margin: -6px 0 0; text-align: center; font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }

  /* the claims: each a cream card, its words and the three faces (44 px targets) */
  .claims { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  .claim { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 8px; padding: 8px 10px 8px 14px; border-radius: 16px; background: var(--c-card); color: var(--c-ink); box-shadow: var(--sh-lip-cream); }
  .claim[data-given] { opacity: .8; }
  .say { margin: 0; font: 700 var(--fs-body)/1.4 var(--font-ui); word-break: keep-all; overflow-wrap: anywhere; }
  .faces { display: flex; gap: 4px; }
  .face { position: relative; width: var(--hit); height: var(--hit); padding: 0; border-radius: 50%; display: grid; place-items: center; line-height: 0; background: var(--ctl-off); }
  .face[aria-disabled='true']:not([data-on]):not([data-mark]) { opacity: .45; }
  .face[data-on], .face[data-mark='on'] { background: var(--ctl-sel); box-shadow: var(--sh-sel); }
  .face[data-mark='right'] { background: color-mix(in srgb, var(--c-leaf) 50%, var(--c-card)); }
  .face[data-mark='wrong'] { background: color-mix(in srgb, var(--c-coral) 35%, var(--c-card)); }
  .sym { position: absolute; right: -4px; top: -6px; font: 700 18px/1 var(--font-ui); }
  .sym.ok { color: var(--leaf-text); }
  .sym.ng { color: var(--coral-text); }

  /* changed: the three faces as big buttons */
  .pick3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .who { position: relative; display: grid; justify-items: center; gap: 4px; padding: 10px 4px; border-radius: var(--r-card); line-height: 0; min-height: 96px; }
  .who[data-mark='on'] { box-shadow: var(--sh-sel); }
  .who[data-mark='right'] { background: color-mix(in srgb, var(--c-leaf) 50%, var(--c-card)); }
  .who[data-mark='wrong'] { background: color-mix(in srgb, var(--c-coral) 30%, var(--c-card)); }
  .who .sym { right: 6px; top: 6px; }

  /* the lines, one at a time: a chip each, its face and number (no text till the transcript) */
  .lines { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 6px; }
  .lab { width: 100%; text-align: center; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .ln { min-width: 52px; min-height: var(--hit); padding: 2px 8px; border-radius: var(--r-pill); display: inline-flex; align-items: center; gap: 4px; line-height: 0; }
  .ln[data-on] { box-shadow: var(--sh-sel); }
  .n { font: 700 var(--fs-s)/1 var(--font-num); }

  .script { margin: 4px 0 0; text-align: center; font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }

</style>
