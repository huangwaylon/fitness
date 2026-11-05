// A `/api` request as the log keeps it (docs/ops/observability.md, the relay's `req` event): the record's answer and,
// beside it, what it was: the action, the caller's role (never the key), the status (`ok` or the error code), sizes,
// and for a batch of events how many were refused and the first refusal's rule, for an ingest how many metrics it
// added, skipped and warned of (counts only: an ingest's warnings name values). The ids the phone sent (`rid`, `sid`)
// join it to the phone's own events. Only enums and numbers.
import { isLogId, isToken, LOG_ACTIONS, LOG_STATUS } from '../../app/src/lib/contract/log.ts';
import { isRec } from '../../app/src/lib/contract/api.ts';
import type { StoreCore } from './store.ts';
import type { Who } from '../../app/src/lib/contract/api.ts';

export interface ReqMeta {
  action: string;
  st: string;
  role: Who | null;
  rid: string | null;
  sid: string | null;
  inB: number;
  outB: number;
  n?: number;
  rej?: number;
  dup?: number;
  why?: string;
  m?: number;
  sk?: number;
  w?: number;
  exc?: string;
}

const utf8 = new TextEncoder();
/** The record's refusal details that are a rule's name (store.ts), as tokens; anything else is just the code. */
const RULES: Record<string, string> = {
  'no such spend': 'no_such_spend', 'tent full': 'tent_full', 'layout full': 'layout_full', 'decor full': 'decor_full',
  owned: 'owned', 'pocket short': 'pocket_short', 'wallet short': 'wallet_short', 'no such repeat': 'no_such_repeat'
};

/** One refusal as a rule: `<type>.<rule or code>`. */
function ruleOf(type: unknown, r: { error?: unknown; detail?: unknown }): string {
  const t = typeof type === 'string' && /^[a-z_]{1,16}$/.test(type) ? type : 'event';
  const rule = typeof r.detail === 'string' && Object.hasOwn(RULES, r.detail) ? RULES[r.detail] : String(r.error ?? 'refused');
  const w = `${t}.${rule}`;
  return isToken(w) ? w : t;
}

/** The record's reply to `text` and its `req` meta (`role`: who the key is, from the store's own check). */
export function apiWithMeta(core: StoreCore, text: string, roleOf: (key: unknown) => Who | null): { body: string; meta: ReqMeta } {
  const inB = utf8.encode(text).length;
  let parsed: unknown = undefined;
  try {
    parsed = text ? JSON.parse(text) : undefined;
  } catch {
    parsed = undefined;
  }
  // as handleText answers it, without parsing the body twice
  const r: Record<string, unknown> = parsed === undefined ? { ok: false, error: 'bad_request' } : core.handle(parsed, inB);
  const body = JSON.stringify(r);
  const b = isRec(parsed) ? parsed : {};
  const action = (LOG_ACTIONS as readonly unknown[]).includes(b.action) ? String(b.action) : 'other';
  const meta: ReqMeta = { action, st: 'ok', role: roleOf(b.key), rid: isLogId(b.rid) ? b.rid : null, sid: isLogId(b.sid) ? b.sid : null, inB, outB: body.length };
  if (r.ok !== true) {
    meta.st = (LOG_STATUS as readonly unknown[]).includes(r.error) ? String(r.error) : 'unavailable';
    if (action === 'event') meta.why = ruleOf(b.type, r);
    if (action === 'ingest' && r.error === 'bad_request') meta.why = 'ingest.parse';
    const exc = core.lastError();
    if (meta.st === 'unavailable' && exc) meta.exc = exc;
  } else if (action === 'events' && Array.isArray(r.results)) {
    const results = r.results as { ok?: unknown; duplicate?: unknown; error?: unknown; detail?: unknown }[];
    const sent = Array.isArray(b.events) ? (b.events as unknown[]) : [];
    meta.n = results.length;
    meta.dup = results.filter((x) => x.ok === true && x.duplicate === true).length;
    const refused = results.map((x, i) => [x, i] as const).filter(([x]) => x.ok !== true);
    meta.rej = refused.length;
    if (refused.length) {
      const [x, i] = refused[0];
      meta.why = ruleOf(isRec(sent[i]) ? sent[i].type : undefined, x);
    }
  } else if (action === 'event' && r.duplicate === true) meta.dup = 1;
  else if (action === 'ingest') {
    meta.m = typeof r.metrics === 'number' ? r.metrics : 0;
    if (typeof r.skipped === 'number') meta.sk = r.skipped;
    if (Array.isArray(r.warnings)) meta.w = r.warnings.length;
  }
  return { body, meta };
}
