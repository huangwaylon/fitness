# ききみみ engine (retired)

The round engine, its games, the content compiler and the levels' chunks went with the old game on 2026-11-16
([kikimimi.md](kikimimi.md)). Left: two presence intents in the contract and the row's fields. Its audio packs went too, and
the service worker deletes their `island-listen-v1` cache at its next activate.

## Sync

`quiz` and `play` (contract/live-protocol.ts) were the game's presence-only intents: unstored, unacked, never replayed.
No build since the English Study switch sends or hears either; the relay never interprets them, and an unknown or
unparseable intent is dropped on both sides. They stay parseable until at least 2026-11-24, then leave the contract,
the app first and the relay last.

### The play wire

`PlayWire`: ops `open`, `join`, `leave`, `end`, `go`, `a`, `skip` and `ev`; `playOf` keeps known fields only, each
bounded, and checks `gm` by `GM_RE` (a shape, never a list). `{kind: 'quiz'}` is the older quiz's wire.

### The listen row

`contract/listen.ts`: `listen {d, g, lv, n, ms, p?, r}` plus `gm?` (absent: the quiz), `u?`, a lesson's `l?` (1 であい, 2
ばめん, 3 チェック, 4 おと, 5 じっせん) and `tm?` (0–6, the team's first-listen rights). `r`: 0–12 answers `[id, ok, pick,
rp]`; `pick` −1…4095; `lv` 1–8. A mic game's or a story's row is minutes only (`minutesOnly`). The relay checks rows
with the same file and refuses unknown keys, so a row field ships relay first. `stampsUnit`: curriculum.md "Playing
together". English Study writes the same row (`gm` 'tv': [english.md](english.md#progress)).
