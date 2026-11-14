// The bots' attention dots' one read (open.svelte.ts readBadge, loaded on the first): true while that bot needs a
// person, null when it couldn't be read (the dot stays as it was). A good read is kept for that tab's opening too
// (lastKnown.ts).
import { fetchStatus as itsStatus } from '#lib/its/client.ts';
import { needsAttention as itsNeeds } from '#lib/its/view.ts';
import { fetchStatus as gymStatus, needsAttention as gymNeeds } from '#lib/gym/status.ts';
import { fetchStatus as kaloriStatus, needsAttention as kaloriNeeds } from '#lib/kalori/status.ts';
import { remember } from './lastKnown.ts';
import type { BotTab } from './open.svelte.ts';

export async function attention(k: BotTab): Promise<boolean | null> {
  if (k === 'its') {
    const r = await itsStatus();
    if (r.ok) remember('its', r.status);
    return r.ok ? itsNeeds(r.status) : null;
  }
  if (k === 'kalori') {
    const r = await kaloriStatus();
    if (r.ok) remember('kalori', r.status);
    return r.ok ? kaloriNeeds(r.status, Date.now()) : null;
  }
  const r = await gymStatus();
  if (r.ok) remember('gym', r.status);
  return r.ok ? gymNeeds(r.status) : null;
}
