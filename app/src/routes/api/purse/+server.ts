import type { RequestHandler } from '@sveltejs/kit';
import { desc } from 'drizzle-orm';
import { getDb } from '#lib/server/db/index.ts';
import { purseSpend } from '#lib/server/db/schema.ts';
import { handle, json, requirePerson } from '#lib/server/http.ts';
import { purseBalance } from '#lib/server/ledger.ts';

/** Purse balance, spends awaiting the partner's OK, and recent spends. */
export const GET: RequestHandler = handle(({ locals }) => {
  const me = requirePerson(locals);
  const db = getDb();
  const rows = db.select().from(purseSpend).orderBy(desc(purseSpend.id)).limit(30).all();
  const pending = rows.filter((r) => !r.ledgerEntryId).map((r) => ({ ...r, canApprove: r.requestedBy !== me }));
  const recent = rows.filter((r) => r.ledgerEntryId);
  return json({ balanceYen: purseBalance(db), pending, recent });
});
