// The partner's doings on this phone (docs/backend.md#shared-world, docs/design.md "Shared world"): when their catch
// or find arrives over the relay, their villager here holds it up with a small plate (「うめが スズキを つかまえた！」)
// if the spot is in view, else a gentle notice slides in at the edge their villager is beyond. The island's parts
// (Critters, Finds, TreeShakes) tell it through `tellPartner`; PartnerNews.svelte shows it.
import { loadNames } from './catchLine.ts';
import { t } from '#lib/i18n/index.ts';
import { week } from '#lib/store/week.svelte.ts';
import type { Who } from '#lib/types.ts';

/** How the partner got it: the caption's verb. */
type PartnerVerb = 'caught' | 'fished' | 'dived' | 'picked' | 'dug' | 'got' | 'beat';

export interface PartnerNews {
  /** The item's official art. */
  art: string;
  verb: PartnerVerb;
  /** The item's name key (critter.name.*, sea.name.*, beach.name.*, a catalog name), or a ready name. */
  name: string;
  /** Where it happened (world) and how high to hold the plate's source. */
  x: number;
  z: number;
  lift?: number;
  /** Their villager has it in hand (in view): hold it up. */
  hold?: boolean;
  /** Whose (absent: the partner's; the guest's on a member's phone, a member's on the guest's). */
  who?: Who;
}

let sink: ((n: PartnerNews, text: string) => void) | null = null;

/** PartnerNews.svelte takes the news (null: unmounted). */
export function setPartnerSink(fn: typeof sink): void {
  sink = fn;
}

/** The caption for the partner's news: 「{who}が {name}を つかまえた！」. */
async function partnerCaption(n: Pick<PartnerNews, 'verb' | 'name' | 'who'>): Promise<string> {
  await loadNames().catch(() => {});
  const v = week.view;
  const w = n.who ?? v?.partner;
  const who = !v || !w ? '' : w === 'G' ? v.guest.villagerName : v.people[w].villagerName;
  const name = /^[a-z]+\.[\w.-]+$/.test(n.name) ? t(n.name) : n.name;
  return t(`world.partner.${n.verb}`, { who, name });
}

/** Show the partner's news (their villager holds it up if it's in view; else the edge notice). */
export function tellPartner(n: PartnerNews): void {
  if (!sink) return;
  void partnerCaption(n).then((text) => sink?.(n, text));
}
