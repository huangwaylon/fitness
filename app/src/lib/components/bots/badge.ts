// The bots' attention dots' one read (open.svelte.ts readBadge, loaded on the first): true while that bot needs a
// person, null when it couldn't be read (the dot stays as it was).
import { fetchStatus as itsStatus } from '#lib/its/client.ts';
import { needsAttention as itsNeeds } from '#lib/its/view.ts';
import { fetchStatus as gymStatus, needsAttention as gymNeeds } from '#lib/gym/status.ts';
import type { BotTab } from './open.svelte.ts';

export async function attention(k: BotTab): Promise<boolean | null> {
  if (k === 'its') {
    const r = await itsStatus();
    return r.ok ? itsNeeds(r.status) : null;
  }
  return gymStatus().then(gymNeeds, () => null);
}
