<script lang="ts">
  // What a shaken tree drops (docs/design.md "Trees", "Shaking a tree"; island/treeShake.ts), for every tree on the
  // island: a goal tree reports a shake from its canopy (FruitTree), any other from SceneTaps (IslandScene counts the
  // taps), and this rolls the drop by the kind of tree. A tree branch falls beside the trunk on the inner side and lies
  // there until a tap picks it up (a pop, into my pocket: the shop buys it); a palm drops its two coconuts round its foot
  // (a tap picks one up, into my pocket too). Any tree now and then knocks out a piece of NH's wood (wood, softwood or
  // hardwood: treeShake.ts woodFall, three a tree a day), put on the island for both (`wd:<tree>:<k>`, first wins); it
  // lies in front of the trunk until a tap picks it up into my pocket. Now and then a bagworm (at night sometimes a spider) drops out of the canopy on its thread beside the trunk
  // on the outer side and dangles there, swaying, for DANGLE_MS: a tap nets it (NH's catch line, the ずかん's bagworm or
  // spider), else it climbs back up. Rarely a wasp nest falls beside the trunk on the outer side: it lands with a thud,
  // and SWARM_DELAY_MS later three wasps buzz out and charge the villager who shook it for SWARM_MS. A tap on them in
  // time nets one (the net's swing, NH's catch line on the plate, the shared ずかん's wasp); too late and they sting
  // (`onsting`: the scene gives that villager a fright and a sweat drop), then fly off. Nothing here pays ベル.
  // Shared (docs/backend.md#shared-world): my shake's outcome goes to the partner (world.share), and theirs plays here:
  // their villager turns to the tree and it shakes, the same drop falls, their wasps charge them. What lies (branches,
  // coconuts) is the shared day's, so a reload or the partner's phone finds it there; a pick-up or a catch by either of
  // us takes it on both phones (first wins). `?shake=nest|branch|bagworm|spider|coconut|wood` (dev or ?demo) makes the
  // next shake drop that (the e2e's hook; `wood`: a piece of wood and nothing else, while the tree has some today). Two oaks or cedars a day hold a present (treeGifts.ts): their first shake drops it,
  // put on the island for both (`put`, by the tree's id: first wins); it lies and opens as a balloon's present does
  // (Finds.svelte). Everything is a world node beside its tree; the swarm's node follows the
  // villager's feet as it flies (its live position, frames only while it's out).
  import { showCatch } from './catchCard.ts';
  import { pickUp } from '../motion/transitions.ts';
  import { timers } from './timers.ts';
  import { hookOneOf, islandSeed } from './devHooks.ts';
  import { giftAt, giftId, holdsGift } from './treeGifts.ts';
  import { site } from './site.svelte.ts';
  import { offBuildingsAt } from './world.ts';
  import { onDestroy, onMount } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { t } from '#lib/i18n/index.ts';
  import { recordFind, recordGoods } from '#lib/store/actions.ts';
  import { world } from '#lib/store/world.svelte.ts';
  import { caught, taken } from '#lib/sync/world-day.ts';
  import type { Drop } from '#lib/contract/live-protocol.ts';
  import { VILLAGER, u } from './scene.ts';
  import { OVER, useWorld } from './camera.svelte.ts';
  import { sceneSfx } from './sceneTaps.ts';
  import { waspMusic } from '#lib/sound/sound.svelte.ts';
  import { critterArt, type BugId } from './critters.ts';
  import { catchLine, loadLines, loadNames } from './catchLine.ts';
  import { dayKey, jst } from '#lib/time/clock.ts';
  import { artUrl } from '#lib/art.ts';
  import {
    DANGLE_MS, SWARM_DELAY_MS, SWARM_MS, WOODS, bearsCoconuts, dropAt, dropIds, fallen, lastNestOf, netsSwarm, shakeDrop, wireDrop,
    woodAt, woodFall, woodOut, woodTree, type ShakeDrop, type ShakeTree, type Wood
  } from './treeShake.ts';
  import { partnerTurnTo, turnTo } from './avatar.ts';
  import { livePos } from '../motion/director.svelte.ts';
  import { tellPartner } from './partnerNews.ts';
  import { actorOf } from '#lib/ui-state/cast.ts';

  type Side = 'mine' | 'partner' | 'third';
  interface Props {
    scene?: HTMLElement;
    /** The wasps reached the villager on `side`. */
    onsting?: (side: Side) => void;
    /** A tree by id (the same on both phones), or null. */
    treeOf: (id: string) => ShakeTree | null;
    /** The partner shook a tree: rustle it (their villager has just got there). */
    rustle?: (tree: ShakeTree) => void;
  }
  let { scene, onsting, treeOf, rustle }: Props = $props();
  const w = useWorld();

  const { later, clear } = timers();
  onDestroy(() => {
    clear();
    stopSwarm();
  });

  /** Their nodes stand NEAR in front of the tree's own (the canopy's and the fruit row's buttons), so a branch's or a
   *  bug's own tap target is on top. */
  const NEAR = -60;
  /** Where a falling thing starts: inside the canopy (u above the ground), by the tree's height. */
  const fromOf = (tr: ShakeTree) => tr.h * 0.55;
  /** A dangling bug hangs at a branch's height (its tap target between the canopy's and the fruit row's buttons). */
  const DANGLE_UP = 22;
  /** The wasps come out of the nest this high, and go for the villager's face. */
  const NEST_UP = 10, FACE = VILLAGER.h * 0.78;

  let seq = 0;
  /** World x, y = the world's z. */
  let nests = $state<{ n: number; tree: string; x: number; y: number; from: number; fading: boolean }[]>([]);
  let swarm = $state<{ n: number; id: string; side: Side; x0: number; z0: number; at: number; stung: boolean; away: number } | null>(null);
  /** The net's swing at world (x, z), `lift` up. */
  let net = $state<{ n: number; x: number; z: number; lift: number } | null>(null);
  let dangler = $state<{ n: number; id: string; tree: string; bug: 'bagworm' | 'spider'; x: number; y: number; from: number; up: boolean } | null>(null);

  /** What the day's shakes left lying (the shared day: a reload or the partner's phone finds it too), and which of it
   *  fell while this island watched (only those fall; the rest just lie there). */
  const lyingNow = $derived.by(() => {
    void site.rev;
    const d = world.day;
    // anyone's pick-up takes it at once, mine too (a phone that lost its own record gets my claims back in the replay)
    return fallen(d.shakes, treeOf, (id) => !!taken(d, id));
  });
  const dropping = new SvelteSet<string>();

  // the dev hook: the next shake drops this (a bagworm or a spider: that bug)
  let forced: string | undefined = hookOneOf('shake', ['nest', 'branch', 'bagworm', 'spider', 'coconut', 'wood']) ?? undefined;

  /** The day's wood lying under the trees (the shared day's puts, `wd:`), as the branches: anyone's pick-up takes it
   *  at once. A piece put on a building's ground lies at the free spot off it (world.ts offBuildingsAt). */
  const woodLying = $derived.by(() => {
    void site.rev;
    const d = world.day;
    return Object.values(d.puts).flatMap((p) => {
      const tree = woodTree(p.id);
      if (!tree || !(WOODS as readonly string[]).includes(p.what)) return [];
      if (taken(d, p.id)) return [];
      const [x, z] = offBuildingsAt(p.at[0], p.at[1]);
      return [{ id: p.id, tree, what: p.what as Wood, x, z }];
    });
  });
  /** A piece of wood falls out of the tree (mine as I shake it, the partner's as theirs comes in: `at`, its tree). */
  function woodFalls(id: string, at?: readonly [number, number]) {
    dropping.add(id);
    later(() => sceneSfx('twig', at), 520);
    later(() => dropping.delete(id), 900);
  }

  /** My villager shook `tree` (where it stands: a tap acts in place): roll what falls by its kind, share it, play it. */
  export function shaken(tree: ShakeTree) {
    const d = world.day, now = world.now();
    const bugForced = forced === 'bagworm' || forced === 'spider' ? forced : undefined;
    const woodForced = forced === 'wood';
    const force = bugForced ? 'bug' : woodForced ? null : (forced as ShakeDrop | undefined);
    // this shake's place among the tree's shakes today (both of ours): its wood's seed
    const nth = d.shakes.filter((s) => s.tree === tree.id).length;
    const gift = holdsGift(dayKey(), tree.id, d.puts, islandSeed());
    let drop: ShakeDrop = shakeDrop(Math.random, now, lastNestOf(d.shakes, tree.id), force, tree.kind, bearsCoconuts(d.shakes, tree.id), gift);
    forced = undefined;
    // one thing of a kind at a tree at a time; while its present lies unopened under it, only a rustle (its spot clear)
    const giftLies = !!d.puts[giftId(tree.id)] && !taken(d, giftId(tree.id));
    if (!force && drop !== 'gift' && giftLies) drop = null;
    if (drop === 'nest' && (swarm || dangler?.tree === tree.id || nests.some((s) => s.tree === tree.id))) drop = null;
    if (drop === 'branch' && lyingNow.some((b) => b.tree === tree.id && b.what === 'branch')) drop = null;
    if (drop === 'bug' && (dangler || nests.some((s) => s.tree === tree.id))) drop = null;
    const wire = wireDrop(drop, jst().hour, Math.random, bugForced);
    world.share({ kind: 'shake', tree: tree.id, drop: wire });
    // the tree's present falls out of the canopy (Finds draws it: a put of the day); the partner's phone may have
    // dropped it a moment before (the relay keeps the first)
    if (drop === 'gift' && world.share({ kind: 'put', id: giftId(tree.id), what: 'present', at: giftAt(tree) }).fresh) later(() => sceneSfx('twig'), 520);
    play(tree, 'mine', wire);
    // NH's wood without an axe: now and then a piece, three a tree a day (treeShake.ts woodFall); put for both, first
    // wins (the partner's phone may have knocked the same piece out a moment before); none with its present
    const wood = (giftLies || drop === 'gift') && !woodForced ? null : woodFall(dayKey(), tree.id, nth, woodOut(d.puts, tree.id), islandSeed(), woodForced);
    if (wood) {
      const [x, z] = woodAt(tree, woodOut(d.puts, tree.id));
      if (world.share({ kind: 'put', id: wood.id, what: wood.what, at: [x, z] }).fresh) woodFalls(wood.id);
    }
  }

  /** The `drop` of a shake of `tree` by `side`, as it falls here (its ids from the day's shakes). */
  function play(tree: ShakeTree, side: Side, drop: Drop) {
    if (drop === 'none') return;
    const d = world.day;
    const i = d.shakes.findLastIndex((s) => s.tree === tree.id && s.drop === drop);
    const ids = i >= 0 ? dropIds(d.shakes, i) : [];
    const from = fromOf(tree);
    // (another's shake: its sounds by where it is)
    const far = side === 'mine' ? undefined : ([tree.x, tree.z] as const);
    if (drop === 'bagworm' || drop === 'spider') {
      const id = ids[0] ?? `dg:${tree.id}:x`;
      void loadLines().catch(() => {});
      const url = artUrl(critterArt(drop));
      if (url) new Image().src = url;
      const at = dropAt(tree, drop);
      const g = { n: ++seq, id, tree: tree.id, bug: drop, x: at.x, y: at.z, from, up: false };
      dangler = g;
      later(() => dangler?.n === g.n && (dangler = { ...g, up: true }), DANGLE_MS);
      later(() => dangler?.n === g.n && (dangler = null), DANGLE_MS + 900);
    } else if (drop === 'branch' || drop === 'coconut') {
      for (const id of ids) dropping.add(id);
      later(() => sceneSfx('twig', far), 520);
      later(() => ids.forEach((id) => dropping.delete(id)), 900);
    } else if (drop === 'nest') {
      void loadLines().catch(() => {});
      const at = dropAt(tree, 'nest');
      const nest = { n: ++seq, tree: tree.id, x: at.x, y: at.z, from, fading: false };
      nests = [...nests, nest];
      later(() => (sceneSfx('nest', far), side === 'mine' && waspMusic('nest')), 560);
      later(() => charge(nest.n, ids[0] ?? `ws:${tree.id}:x`, nest.x, nest.y, side), 560 + SWARM_DELAY_MS);
    }
  }

  /** A tap on the dangling bug: netted (the net's swing, NH's catch line, a ずかん find), unless the partner has it. */
  function netDangler() {
    const d = dangler;
    if (!d || d.up) return;
    // first wins: claimed at the tap (the relay's first claim is the catch: the partner's phone hears it)
    if (!world.share({ kind: 'catch', what: d.bug, id: d.id, at: [Math.round(d.x), Math.round(d.y)], how: 'net' }).fresh) return;
    // in place: my villager turns to it and the net swings at the bug; caught at the tap
    turnTo(d.x);
    dangler = null;
    // the partner's claim reached the relay first: theirs (its plate is the news's)
    const c = caught(world.day, d.id);
    if (c && c.who !== world.me) return;
    net = { n: ++seq, x: d.x, z: d.y, lift: DANGLE_UP };
    sceneSfx('net');
    later(() => (net = null), 420);
    later(async () => {
      sceneSfx('catch');
      const added = recordFind('bug', d.bug, `catch:${d.id}`);
      const text = await catchLine(d.bug as BugId);
      const [sx, sy] = w.screenU(d.x, d.y, DANGLE_UP);
      showCatch(sx, sy, critterArt(d.bug), text, added);
    }, 160);
  }

  /** The swarm's world point now: from the nest to the villager's face where its feet are this frame (it may be
   *  walking somewhere), easing in. */
  function swarmAt(): [number, number, number] {
    const s = swarm;
    if (!s) return [0, 0, 0];
    const k = Math.min(1, Math.max(0, (performance.now() - s.at) / SWARM_MS)), e = k * k * (1.6 - 0.6 * k);
    const [vx, vz] = livePos(s.side);
    return [s.x0 + (vx - s.x0) * e, s.z0 + (vz - s.z0) * e, NEST_UP + (FACE - NEST_UP) * e];
  }
  /** Frames run while the swarm is out (its node follows `swarmAt`). */
  let stopFrames: (() => void) | null = null;
  function stopSwarm() {
    stopFrames?.();
    stopFrames = null;
  }

  function charge(nestN: number, id: string, x: number, z: number, side: Side) {
    const n = ++seq;
    stopSwarm();
    // the partner already netted these (their catch came in while the nest fell)
    if (caught(world.day, id)) return fadeNest(nestN);
    swarm = { n, id, side, x0: x, z0: z, at: performance.now(), stung: false, away: x < site.midX ? -1 : 1 };
    stopFrames = w.moveStart();
    const at = side === 'mine' ? undefined : ([x, z] as const);
    sceneSfx('buzz', at);
    if (side === 'mine') waspMusic('chase'); // NH's Chased by Bees cuts in over the island's music
    later(() => {
      if (swarm?.n !== n) return;
      swarm = { ...swarm, stung: true };
      sceneSfx('sting', at);
      if (side === 'mine') waspMusic('stung');
      onsting?.(side);
      later(() => {
        if (swarm?.n !== n) return;
        swarm = null;
        stopSwarm();
      }, 900);
      fadeNest(nestN);
    }, SWARM_MS);
  }

  function fadeNest(n: number) {
    later(() => (nests = nests.map((s) => (s.n === n ? { ...s, fading: true } : s))), 1200);
    later(() => (nests = nests.filter((s) => s.n !== n)), 1800);
  }

  /** A tap on the swarm: netted while it's on its way (mine only: the partner's wasps are theirs to net). */
  function netIt() {
    const s = swarm;
    if (!s || s.stung || s.side !== 'mine' || !netsSwarm(performance.now() - s.at)) return;
    const [x, z, lift] = swarmAt();
    world.share({ kind: 'catch', what: 'wasp', id: s.id, at: [Math.round(x), Math.round(z)], how: 'swarm' });
    swarm = null;
    stopSwarm();
    turnTo(x); // no walk: the wasps' timing stays as it is
    net = { n: ++seq, x, z, lift };
    sceneSfx('net');
    waspMusic('caught');
    const nest = nests.find((ns) => !ns.fading);
    if (nest) fadeNest(nest.n);
    later(() => (net = null), 420);
    later(async () => {
      sceneSfx('catch');
      const added = recordFind('bug', 'wasp', `catch:${s.id}`);
      const text = await catchLine('wasp');
      const [sx, sy] = w.screenU(x, z, lift);
      showCatch(sx, sy, critterArt('wasp'), text, added);
    }, 160);
  }

  /** A tap picks it up where it lies (a pop, gone; a coconut's plate with its line), my villager turning to it
   *  (avatar.ts). First wins: claimed at the tap. */
  function pick(id: string) {
    const b = lyingNow.find((x) => x.id === id);
    if (!b) return;
    const coconut = b.what === 'coconut';
    if (coconut) void loadNames().catch(() => {});
    if (!world.share({ kind: 'pick', id, what: b.what, at: [Math.round(b.x), Math.round(b.z)] }).fresh) return;
    turnTo(b.x);
    sceneSfx('twig');
    const good = coconut ? 'coconut' : 'tree-branch';
    recordGoods(good, `pick:${id}`);
    picked(b.x, b.z, `finds/${good}`, good);
  }
  /** Picked up (into my pocket): NH's line on the plate, 「ヤシのみを ひろった！」. */
  function picked(x: number, z: number, art: string, id: string) {
    const [sx, sy] = w.screenU(x, z, 4);
    void loadNames().then(() => showCatch(sx, sy, art, t('beach.picked', { name: t(`beach.name.${id}`) })), () => {});
  }
  /** A tap picks up a piece of wood where it lies, into my pocket. First wins: claimed at the tap. */
  function pickWood(id: string) {
    const b = woodLying.find((x) => x.id === id);
    if (!b) return;
    void loadNames().catch(() => {});
    if (!world.share({ kind: 'pick', id, what: b.what, at: [b.x, b.z] }).fresh) return;
    turnTo(b.x);
    sceneSfx('twig');
    recordGoods(b.what, `pick:${id}`);
    picked(b.x, b.z, `finds/${b.what}`, b.what);
  }

  // The partner's shakes and catches (the shared day's news): their villager turns to the tree and it shakes, the same
  // drop falls; they net the dangling bug or their wasps, or pick up a branch or a coconut, and it's gone here too.
  onMount(() =>
    world.on(({ e, live }) => {
      if (e.kind === 'shake') {
        const tree = treeOf(e.tree);
        if (!tree || !live) return;
        partnerTurnTo(tree.x, e.who);
        rustle?.(tree);
        play(tree, actorOf(e.who), e.drop);
      } else if (e.kind === 'catch' && e.id && /^(dg|ws):/.test(e.id)) {
        const d = dangler;
        if (d?.id === e.id) {
          dangler = null;
          if (live) {
            partnerTurnTo(d.x, e.who);
            net = { n: ++seq, x: d.x, z: d.y, lift: DANGLE_UP };
            later(() => (net = null), 420);
            tellPartner({ who: e.who, art: critterArt(d.bug), verb: 'caught', name: `critter.name.${d.bug}`, x: d.x, z: d.y, lift: DANGLE_UP });
          }
        }
        const s = swarm;
        if (s?.id === e.id) {
          swarm = null;
          stopSwarm();
          const nest = nests.find((ns) => !ns.fading);
          if (nest) fadeNest(nest.n);
          if (live) tellPartner({ who: e.who, art: critterArt('wasp'), verb: 'caught', name: 'critter.name.wasp', x: s.x0, z: s.z0 });
        }
      } else if (e.kind === 'put' && woodTree(e.id) && live && e.who !== world.me) {
        // the partner knocked a piece of wood out: it falls here too
        const tr = treeOf(woodTree(e.id) ?? '');
        woodFalls(e.id, tr ? [tr.x, tr.z] : undefined);
      } else if (e.kind === 'pick' && /^wd:/.test(e.id) && live) {
        const p = world.day.puts[e.id];
        if (p) partnerTurnTo(p.at[0], e.who);
      } else if (e.kind === 'pick' && /^(br|co):/.test(e.id) && live) {
        const b = fallen(world.day.shakes, treeOf, () => false).find((x) => x.id === e.id);
        if (!b) return;
        partnerTurnTo(b.x, e.who);
        if (b.what === 'coconut') tellPartner({ who: e.who, art: 'finds/coconut', verb: 'picked', name: 'beach.name.coconut', x: b.x, z: b.z });
      }
    })
  );
</script>

{#each nests as s (s.n)}
  <div class="node" {@attach w.at({ x: s.x, z: s.y, h: s.from, dz: NEAR, m3: { key: 'finds/wasp-nest', id: `nest-${s.n}`, drop: s.from, ms: 520, off: s.fading } })}>
    <span data-m3art class="drop nest" class:fading={s.fading} data-nest={s.tree} style:--from={u(-s.from)}>
      <!-- NH's wasp nest: a papery grey-brown hive, banded, with its dark mouth -->
      <svg viewBox="0 0 24 28" aria-hidden="true">
        <path d="M12 1.5 C17.5 1.5 21.5 7 21.5 14 C21.5 21.5 17 26.5 12 26.5 C7 26.5 2.5 21.5 2.5 14 C2.5 7 6.5 1.5 12 1.5 Z" fill="#B49A78" />
        <path d="M4 9.5 C9 11 15 11 20 9.5 M3 15 C9 16.8 15 16.8 21 15 M4 20.5 C9 22 15 22 20 20.5" fill="none" stroke="#8C7356" stroke-width="1.3" stroke-linecap="round" />
        <path d="M8 4.5 C9 3.5 10.5 3 12 3" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1.2" stroke-linecap="round" />
        <ellipse cx="12" cy="23.4" rx="2.6" ry="1.8" fill="#4A3828" />
        <path d="M11 1.8 L12 -1 L13 1.8 Z" fill="#7A6248" />
      </svg>
    </span>
  </div>
{/each}

{#each lyingNow as b (b.id)}
  {@const from = (treeOf(b.tree)?.h ?? 120) * 0.55}
  <div class="node" {@attach w.at({ x: b.x, z: b.z, h: from, dz: NEAR, inv: true, m3: { key: b.what === 'branch' ? 'finds/tree-branch' : 'finds/coconut', id: `drop-${b.id}`, drop: dropping.has(b.id) ? from : 0, ms: 520 } })}>
    <span class="drop {b.what}" class:still={!dropping.has(b.id)} style:--from={u(-from)} out:pickUp>
      <OfficialArt key={b.what === 'branch' ? 'finds/tree-branch' : 'finds/coconut'} size={u(b.what === 'branch' ? 36 : 28)} eager />
    </span>
    {#if b.what === 'branch'}
      <button type="button" class="pick" data-branch={b.tree} data-sfx="self" aria-label={t('shake.branch')} style:top={u(-9)}
        onclick={() => pick(b.id)}></button>
    {:else}
      <button type="button" class="pick" data-coconut={b.id} data-sfx="self" aria-label={t('shake.coconut')} style:top={u(-7)}
        onclick={() => pick(b.id)}></button>
    {/if}
  </div>
{/each}

{#each woodLying as b (b.id)}
  {@const from = (treeOf(b.tree)?.h ?? 120) * 0.55}
  <div class="node" {@attach w.at({ x: b.x, z: b.z, h: from, dz: NEAR, inv: true, m3: { key: `finds/${b.what}`, id: `drop-${b.id}`, drop: dropping.has(b.id) ? from : 0, ms: 520 } })}>
    <span class="drop wood" class:still={!dropping.has(b.id)} style:--from={u(-from)} out:pickUp>
      <OfficialArt key={`finds/${b.what}`} size={u(26)} eager />
    </span>
    <button type="button" class="pick" data-wood={b.what} data-wood-id={b.id} data-sfx="self" aria-label={t('shake.wood')} style:top={u(-7)}
      onclick={() => pickWood(b.id)}></button>
  </div>
{/each}

{#if dangler}
  {@const d = dangler}
  {#key d.n}
    <!-- a bagworm or a spider on its thread, out of the canopy beside the trunk: it drops, sways, and climbs back up -->
    <!-- the 3D island's: the bug at its thread's end, the thread from the canopy -->
    <i class="m3n" {@attach w.at({ bare: true, x: d.x, z: d.y, lift: d.up ? d.from : DANGLE_UP, h: 4, always: true,
      m3: { key: `critters/${d.bug}`, id: `dangle-${d.n}`, ms: 900, art: () => scene?.querySelector(`[data-dangle="${d.bug}"]`), line: () => [d.x, d.y, d.from] } })}></i>
    <div class="node" {@attach w.at({ x: d.x, z: d.y, h: d.from, dz: NEAR, inv: true })}>
      <span class="dangle {d.bug}" class:up={d.up} data-dangle={d.bug} style:top={u(-d.from)} style:--len={u(d.from - DANGLE_UP)}>
        <i class="thread"></i>
        <svg class="dbug" viewBox="-8 -8 16 16" aria-hidden="true">
          {#if d.bug === 'bagworm'}
            <path d="M0 -6 C3.6 -5 4.4 1 3 5.6 C1.6 7.4 -1.6 7.4 -3 5.6 C-4.4 1 -3.6 -5 0 -6 Z" fill="#8A6A3E" />
            <path d="M-3.4 -1.6 L3.4 -2.6 M-3.8 1.6 L3.8 .8 M-3.2 4.6 L3.2 4" stroke="#5E4628" stroke-width=".8" stroke-linecap="round" />
            <path d="M-2.6 -3.6 L-1 -5 M1.4 -4.8 L2.8 -3.4 M-3.6 .6 L-5 -.4 M3.8 -.6 L5 -1.8" stroke="#6E8A3E" stroke-width="1" stroke-linecap="round" />
          {:else}
            <path d="M-1.8 -1 L-6 -4.4 L-7 -1 M-1.8 .6 L-6.6 1 L-7 4.6 M1.8 -1 L6 -4.4 L7 -1 M1.8 .6 L6.6 1 L7 4.6 M-1.4 2 L-4 5.8 M1.4 2 L4 5.8 M-1.4 -2 L-3.6 -6 M1.4 -2 L3.6 -6"
              fill="none" stroke="#2A2420" stroke-width=".8" stroke-linecap="round" stroke-linejoin="round" />
            <ellipse cx="0" cy="1.6" rx="2.6" ry="3" fill="#2E2826" /><circle cx="0" cy="-2" r="1.8" fill="#3A322E" />
            <path d="M-1 1 H1 M-1.4 2.6 H1.4" stroke="#C9A040" stroke-width=".6" />
          {/if}
        </svg>
      </span>
      <button type="button" class="pick" data-dangler={d.bug} data-sfx="self" aria-label={t('shake.dangle')} disabled={d.up}
        style:top={u(-DANGLE_UP)} onclick={netDangler}></button>
    </div>
  {/key}
{/if}

{#if swarm}
  {@const s = swarm}
  {#key s.n}
    <!-- the swarm: a ≥ 44px button over every world thing, flying from the nest to the villager's face (its live spot) -->
    <div class="node" {@attach w.at({ x: s.x0, z: s.z0, lift: NEST_UP, h: FACE + 20, zi: OVER, inv: true, live: swarmAt, m3: { key: 'critters/wasp-swarm', id: `swarm-${s.n}` } })}>
      <button type="button" class="swarm" class:stung={s.stung} class:theirs={s.side !== 'mine'} data-swarm={s.side} data-sfx="self" aria-label={t('shake.swarm')}
        style:--away={u(s.away * 120)} onclick={netIt}>
        {#each [[-11, -4, 0], [10, -9, 0.13], [1, 9, 0.26]] as [dx, dy, d], k (k)}
          <svg class="wasp" data-m3art viewBox="-8 -8 16 16" aria-hidden="true" style:--dx={u(dx)} style:--dy={u(dy)} style:animation-delay="-{d}s">
            <g class="w"><ellipse cx="-2" cy="-4.2" rx="2" ry="3.4" transform="rotate(-25 -2 -4.2)" /><ellipse cx="2" cy="-4.2" rx="2" ry="3.4" transform="rotate(25 2 -4.2)" /></g>
            <ellipse cx="-2.6" cy=".2" rx="3.4" ry="2.6" fill="#F2B21E" />
            <path d="M-4.4 -2 V2.4 M-2.2 -2.5 V2.9" stroke="#2E2218" stroke-width="1.1" />
            <path d="M-6 .2 L-7.6 .2" stroke="#2E2218" stroke-width="1" stroke-linecap="round" />
            <circle cx="1.2" cy="0" r="1.6" fill="#D6921A" />
            <circle cx="3.9" cy="-.3" r="1.9" fill="#2E2218" />
          </svg>
        {/each}
      </button>
    </div>
  {/key}
{/if}
{#if net}
  {#key net.n}
    <div class="node" {@attach w.at({ x: net.x, z: net.z, lift: net.lift, h: 40, zi: OVER })}>
      <span class="netfx">
        <svg viewBox="-20 -20 40 40" aria-hidden="true"><path class="handle" d="M6 6 L19 19" /><circle class="hoop" cx="-1" cy="-1" r="9.5" /><path class="mesh" d="M-10 -1 H8 M-1 -10 V8 M-7.5 -7.5 L5.5 5.5 M-7.5 5.5 L5.5 -7.5" /></svg>
      </span>
    </div>
  {/key}
{/if}

<style>
  /* a world node at the feet (camera.svelte.ts places it) */
  .node { width: 0; height: 0; pointer-events: none; }
  /* on the grass beside the trunk; it falls out of the canopy (--from) and bounces */
  .drop { position: absolute; left: 0; top: 0; translate: -50% -100%; line-height: 0; pointer-events: none; transform-origin: 50% 100%; animation: shake-drop 560ms cubic-bezier(.45, 0, .8, .6) both; }
  .drop::before {
    content: ''; position: absolute; z-index: -1; left: 10%; width: 90%; bottom: -12%; height: 26%; border-radius: 50%;
    background: radial-gradient(closest-side, var(--sh-c), transparent);
  }
  @keyframes shake-drop {
    0% { transform: translateY(var(--from)); }
    60% { transform: translateY(0) scale(1.1, .88); animation-timing-function: ease-out; }
    76% { transform: translateY(-18%) scale(.96, 1.04); animation-timing-function: ease-in; }
    90% { transform: translateY(0) scale(1.03, .97); } 100% { transform: none; }
  }
  /* in a 0 × 0 node: sized by its art, not squeezed to the node's width */
  .drop { width: max-content; }
  .drop :global(.official) { max-width: none; }
  .nest svg { width: calc(20 * 100cqw / 390); display: block; }
  .nest.fading { transition: opacity 600ms ease; opacity: 0; }
  /* lying there since before this island watched (a reload, the partner's phone): no fall */
  .drop.still { animation: none; }
  /* a branch: ≥ 44px to tap, over the grass beside the trunk (between the canopy and the fruit row) */
  .pick {
    position: absolute; left: 0; translate: -50% -50%; width: max(calc(44px * var(--inv, 1)), calc(30 * 100cqw / 390)); aspect-ratio: 1; pointer-events: auto;
    appearance: none; border: 0; background: none; padding: 0; cursor: pointer; border-radius: 50%; -webkit-tap-highlight-color: transparent;
  }
  .pick:focus-visible, .swarm:focus-visible { outline: 3px solid var(--focus); outline-offset: -4px; }
  /* a dangling bug: its thread out of the canopy (it drops down it, sways, and climbs back up it) */
  .dangle {
    /* under the canopy (its thread runs up into it), over the grass */
    position: absolute; left: 0; width: 0; height: var(--len); pointer-events: none; transform-origin: 50% 0;
    animation: dangle-drop 650ms cubic-bezier(.3, .6, .5, 1.2) both, sway 2.6s ease-in-out 650ms infinite alternate;
  }
  .dangle.up { animation: dangle-up 850ms ease-in both; }
  .thread { position: absolute; left: -.5px; top: 0; width: 1px; height: 100%; background: rgba(255, 255, 255, .7); }
  .dbug { position: absolute; left: 0; top: 100%; width: calc(16 * 100cqw / 390); translate: -50% -30%; overflow: visible; }
  @keyframes dangle-drop { from { translate: 0 calc(var(--len) * -1); } }
  @keyframes dangle-up { from { translate: 0 0; opacity: 1; } to { translate: 0 calc(var(--len) * -1); opacity: 0; } }
  @keyframes sway { from { rotate: -5deg; } to { rotate: 5deg; } }
  /* the swarm: a ≥ 44px button (whatever the perspective: --inv) centred on its node, which flies from the nest to the
     villager's face, wobbling; stung, it flies off */
  .swarm {
    --s: max(calc(44px * var(--inv, 1)), calc(46 * 100cqw / 390));
    position: absolute; left: 0; top: 0; width: var(--s); aspect-ratio: 1; margin: calc(var(--s) / -2) 0 0 calc(var(--s) / -2);
    appearance: none; border: 0; background: none; padding: 0; cursor: pointer; border-radius: 50%; pointer-events: auto;
    -webkit-tap-highlight-color: transparent;
  }
  .swarm.stung { animation: away 900ms ease-in both; pointer-events: none; }
  /* the partner's wasps: theirs to net, on their phone */
  .swarm.theirs { pointer-events: none; }
  @keyframes away { from { translate: 0 0; opacity: 1; } to { translate: var(--away) -25cqw; opacity: 0; } }
  .wasp {
    /* NH's wasps are big and plain to see: each about a third of a villager's head */
    position: absolute; left: 50%; top: 50%; width: calc(21 * 100cqw / 390); overflow: visible;
    translate: calc(-50% + var(--dx)) calc(-50% + var(--dy)); animation: buzz .3s ease-in-out infinite alternate;
  }
  @keyframes buzz { from { transform: translate(-2px, 1px) rotate(-8deg); } to { transform: translate(2px, -2px) rotate(8deg); } }
  .w { fill: rgba(255, 255, 255, .75); stroke: rgba(110, 120, 140, .6); stroke-width: .4; transform-origin: 0 -1px; animation: flap .05s linear infinite alternate; }
  @keyframes flap { to { scale: 1 .3; } }
  .netfx { position: absolute; width: 0; height: 0; }
  .netfx svg {
    position: absolute; width: calc(30 * var(--su)); translate: -50% -50%; overflow: visible; transform-origin: 80% 80%;
    animation: swing .4s cubic-bezier(.3, .7, .4, 1) both;
  }
  /* the net: the critters' own swing (Critters.svelte) */
  .hoop { fill: rgba(255, 255, 255, .25); stroke: #F4E9D2; stroke-width: 1.6; }
  .mesh { stroke: rgba(255, 255, 255, .6); stroke-width: .5; }
  .handle { stroke: #B88A55; stroke-width: 2.2; stroke-linecap: round; }
  @keyframes swing { 0% { transform: rotate(-70deg); opacity: 0; } 20% { opacity: 1; } 70% { transform: rotate(25deg); opacity: 1; } 100% { transform: rotate(32deg); opacity: 0; } }
</style>
