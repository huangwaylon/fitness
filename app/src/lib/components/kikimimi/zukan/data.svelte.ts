// ききみみ's ずかん on this phone (docs/kikimimi-ux.md §6.10): what its four sections read, loaded once as it opens: the
// units' chunks (their key phrases and items), the bedtime chapters' (their phrases and segment clips) and the levels of
// the items I've answered (their voices and speakers: zukan.ts heardOf), each bumping `ready` as it lands; a sample
// clip played through the game's voice (packs.ts voiceClip → playVoice; one at a time); and what ずかん last showed
// (DEVICE.kikiZukan: the friendship levels announced, the phrases caught already seen). Loaded with the ずかん only.
import { itemOf, load, loadChapter, loadIds, unitPart, type Unit } from '#lib/kikimimi/pool.ts';
import type { Chapter } from '#lib/kikimimi/story.ts';
import type { Item } from '#lib/kikimimi/bank.ts';
import { heardOf, type Heard } from '#lib/kikimimi/zukan.ts';
import { playVoice } from '#lib/sound/sound.svelte.ts';
import { DEVICE, localKV, readJson, writeJson } from '#lib/sync/storage.ts';
import type { Who } from '#lib/types.ts';
import { voiceClip } from '../packs.ts';
import { currentAnswers, pathUnits } from '../progress.svelte.ts';
import { SERIALS } from '../story/serials.svelte.ts';

export class ZukanData {
  /** Bumped as each chunk lands (what reads the lookups reads this first). */
  ready = $state(0);
  /** The bedtime chapters loaded, in the serials' order. */
  chapters = $state.raw<Chapter[]>([]);
  /** What sounds now (a voice's or a phrase's key), and the last clip asked for (the e2e's look). */
  sounding = $state<string | null>(null);
  sample = $state<string | null>(null);
  #heard = new Map<string, Heard | null>();
  #stop: (() => void) | null = null;
  #timer: ReturnType<typeof setTimeout> | undefined;
  #gone = false;

  /** Everything ずかん reads loaded: the units, the chapters, my answers' levels (each failure passed by: offline). */
  start(): void {
    const bump = () => void (!this.#gone && this.ready++);
    void load(...(pathUnits().map((u) => u.id) as Unit[])).then(bump, () => {});
    void loadIds([...new Set(currentAnswers().map((a) => a.id))]).then(bump, () => {});
    const parts = SERIALS.flatMap((s) => s.chapters.map((c) => c.part));
    void Promise.all(parts.map((p) => loadChapter(p).catch(() => null))).then((cs) => {
      if (this.#gone) return;
      this.chapters = cs.filter((c): c is Chapter => !!c);
      bump();
    });
  }

  /** The units' chunks loaded (their phrases), in the path's order. */
  units() {
    void this.ready;
    return pathUnits().map((u) => unitPart(u.id)).filter((c) => !!c);
  }

  /** An item's voices and speakers (null: not loaded). Reactive through `ready`. */
  info = (id: string): Heard | undefined => {
    void this.ready;
    let h = this.#heard.get(id);
    if (h === undefined) {
      const it = itemOf(id);
      if (!it) return undefined;
      this.#heard.set(id, (h = heardOf(it)));
    }
    return h ?? undefined;
  };

  /** Every loaded item (the samples' pool): the units' and my answers' levels'. */
  items(): Item[] {
    void this.ready;
    const out = new Map<string, Item>();
    for (const c of this.units()) for (const it of c.items) out.set(it.id, it);
    for (const a of currentAnswers()) {
      const it = itemOf(a.id);
      if (it) out.set(it.id, it);
    }
    return [...out.values()];
  }

  /** A clip played now (whatever sounded stops), `key` sounding till its end. False: it couldn't (not loaded, offline,
   *  no voice session). */
  async play(clip: string, key: string): Promise<boolean> {
    this.stop();
    this.sample = clip;
    const buf = await voiceClip(clip);
    if (!buf || this.#gone || this.sample !== clip) return false;
    const h = playVoice(buf);
    if (!h) return false;
    this.#stop = () => h.stop();
    this.sounding = key;
    this.#timer = setTimeout(() => this.sounding === key && (this.sounding = null), buf.duration * 1000 + 50);
    return true;
  }

  stop(): void {
    this.#stop?.();
    this.#stop = null;
    clearTimeout(this.#timer);
    this.sounding = null;
  }

  dispose(): void {
    this.#gone = true;
    this.stop();
  }
}

/** All levels' chunks (a voice heard only on a level I haven't played: its sample). */
export const loadLevels = (): Promise<void> => load(1, 2, 3, 4, 5, 6, 7);

type Seen = { who?: unknown; fr?: unknown; ph?: unknown };
/** What ずかん last showed me on this phone: each villager's level announced, the caught phrases seen. */
export function seenOf(me: Who): { fr: Record<string, number>; ph: Set<string> } {
  const v = readJson<Seen>(localKV(), DEVICE.kikiZukan);
  if (!v || v.who !== me) return { fr: {}, ph: new Set() };
  const fr = v.fr && typeof v.fr === 'object' ? Object.fromEntries(Object.entries(v.fr as Record<string, unknown>).filter(([, n]) => typeof n === 'number')) as Record<string, number> : {};
  const ph = new Set(Array.isArray(v.ph) ? v.ph.filter((x): x is string => typeof x === 'string') : []);
  return { fr, ph };
}
/** Part of what ずかん shows, kept as seen (the rest as it was). */
export function keepSeen(me: Who, part: { fr?: Record<string, number>; ph?: Iterable<string> }): void {
  const was = seenOf(me);
  writeJson(localKV(), DEVICE.kikiZukan, { who: me, fr: part.fr ?? was.fr, ph: [...(part.ph ?? was.ph)] });
}
