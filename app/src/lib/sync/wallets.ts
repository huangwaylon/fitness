// The かいがら wallets the relay sends (docs/backend.md#the-wallet: contract/api.ts Wallets) and the stored ledgers'
// parts (#the-ledger: contract/ledger.ts Ledgers), merged as they come in: a snapshot's, a page's, an op's ack. Pure.
import type { Wallets } from '#lib/contract/api.ts';
import type { LedgerPart, Ledgers } from '#lib/contract/ledger.ts';
import type { Who } from '#lib/types.ts';

/** Each person's wallet of the higher `seq` of `a` and `b` (`b`'s on a tie): a reply that started before an ack (a page
 *  of a fetch, a poll) never takes the number back. `a` itself when `b` changes nothing. */
export function newestWallets(a: Wallets | undefined, b: Wallets | undefined): Wallets | undefined {
  if (!a || !b) return b ?? a;
  const out: Wallets = { ...a };
  let changed = false;
  for (const who of Object.keys(b) as Who[]) {
    const x = b[who]!, was = a[who];
    if (!was || x.seq >= was.seq) {
      changed ||= !was || was.h !== x.h || was.seq !== x.seq;
      out[who] = x;
    }
  }
  return changed ? out : a;
}

/** Each person's each ledger part (docs/backend.md#the-ledger) of the higher `seq` of `a` and `b` (`b`'s on a tie), as
 *  newestWallets: a reply that started before an ack never takes a part back. `a` itself when `b` changes nothing. */
export function newestLedgers(a: Ledgers | undefined, b: Ledgers | undefined): Ledgers | undefined {
  if (!a || !b) return b ?? a;
  let out: Ledgers | null = null;
  for (const who of Object.keys(b) as Who[]) {
    for (const part of Object.keys(b[who] ?? {}) as LedgerPart[]) {
      const x = b[who]![part]!, was = (out ?? a)[who]?.[part];
      if (was && (x.seq < was.seq || (x.seq === was.seq && x.at === was.at))) continue;
      out ??= { ...a };
      out[who] = { ...out[who], [part]: x };
    }
  }
  return out ?? a;
}

/** The latest change among `l`'s parts (an ISO instant), or null. */
export function ledgersAt(l: Ledgers | undefined): string | null {
  let at: string | null = null;
  for (const parts of Object.values(l ?? {})) for (const p of Object.values(parts ?? {})) if (p && (at === null || p.at > at)) at = p.at;
  return at;
}
