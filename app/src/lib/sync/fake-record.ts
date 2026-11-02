// Tests only: a fake record's handler of single events that answers the record's `events` batch too (as
// relay/src/store.ts does: each event in order, one result per id), so a test can still say what each event gets.
type Body = Record<string, unknown>;

/**
 * `handler` gets each event as `{key, action: 'event', id, type, data}` (and every other request as it came); its
 * answer becomes that event's result. `onEvent` sees each event body (the tests' call logs).
 */
export function asRecord(handler: (body: Body) => unknown, onEvent?: (body: Body) => void): (body: Body) => unknown {
  return (body) => {
    if (body.action !== 'events' || !Array.isArray(body.events)) return handler(body);
    const results = (body.events as Body[]).map((e) => {
      const one = { key: body.key, action: 'event', ...e };
      onEvent?.(one);
      const r = handler(one) as Body | Error;
      if (r instanceof Error) throw r;
      return { id: e.id, ...r };
    });
    return { ok: true, results };
  };
}
