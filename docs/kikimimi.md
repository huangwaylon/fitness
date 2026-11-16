# ききみみ (retired)

The old English listening game (its sheet, games, lessons, stories, co-op, ずかん and stamps) was removed on
2026-11-16: the 英語 pill opens English Study ([english.md](english.md)). This doc keeps only what the record and the
contract still need. The other leftovers: [kikimimi-engine.md](kikimimi-engine.md) (the wire, the row's fields),
[kikimimi-mic.md](kikimimi-mic.md) (the relay's `/stt`), [curriculum.md](curriculum.md) (the row's unit and lesson
fields).

## Progress & feedback

The old game wrote one `listen` row per person per game. Those rows stay on the record, read-only and never compacted,
until a later admin step deletes them; nothing in the app reads them for progress any more (English Study counts its
own `gm` 'tv' rows).

### Storage

- **One row per person per game**, with its own event id (docs/backend.md "Events"; its fields:
  kikimimi-engine.md "The listen row").
- **Who sees it** (`contract/guest.ts rowsFor`, server-enforced): its owner the whole row; everyone else `{d, g, n, ms}`
  and a unit's `{u, stamped: 1}`.
- `contract/listen.ts` `listenOf` keeps accepting every shape ever written: the partner's summaries and a restore
  (`record.ts load`, `verify-dump`) re-read the stored rows.

### おやすみ ものがたり

A bedtime story's row has no answers: `{gm: 'story', u: <serial>, lv 4, n 1, r: []}`, the minutes heard.
