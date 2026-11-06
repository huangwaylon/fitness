# Units proposal: engineering lead review

Main is 76df3e93. 8a has landed: `play` is in the contract, and the `listen` row already takes `gm` and `u`. The per-level chunk split is in progress in worktree agent-a7efb4cbd3dafc0b4 (compile.ts → levels/index.json + parts, pool.ts `load`). Its index is already keyed by "units" (`Record<Unit,{parts,n,cv}>`), and that is the seam this plan uses.

## Issues

**P0-1. A unit must be a manifest, not a new home for items.** Moving 750 items into unit files would rewrite every bank, collide with the chunk split, change level decks and cv, and freeze bad groupings. **Fix:** a unit is `content/units/<id>.yaml`. It *references* item ids (`uses:`) and *defines* new items inline. Every item keeps its `lv`, so level quizzes still draw from the whole pool. An item has at most one `home` unit (for stamps and ずかん) and may be reused by any number of units for review. Source TS banks stay where they are until 9b's `from-bank` conversion, and that conversion is mechanical.

**P0-2. Lessons 2 and 5 depend on games that don't exist yet.** Lesson 2 needs tile (increment 10). Lesson 5 needs call or tachi (14/15). The stamp hangs on lesson 5. **Fix:** a versioned lesson recipe. Until those games land, lesson 2 = word plus the unit's chunk-focused items, and lesson 5 = an 8-round mixed check (reply, mean, gist, next) drawn from the unit's held-out items. The stamp rule carries `v`. Swapping in the mission later doesn't re-stamp anyone or take a stamp away.

**P0-3. The row has no lesson field.** `u` exists; a lesson index doesn't. **Fix:** add `l?: 1–5` to contract/listen.ts KEYS. The relay ships first, as in 8a, and phones write it one deploy later. The stamp is derived and never stored: any row with `u`, `l=5` and ≥ 80 % `ok` at `rp=0`. Pin down "first listen" as per answer (rp 0) in a retakeable check. One bad first attempt must not lock a unit.

**P1-1. Unit ids are capped at 12 characters (`u`, the pack name).** The proposal's names won't fit. **Fix:** `<domain2>-<slug>`, e.g. `ev-bday`, `fd-izakaya`, `tr-hotel`. Ids never encode a stage. Item ids never encode a unit, so an item can be re-homed. The freeze set is only the ids that have shipped (clips.json ∪ rungs). Draft YAML ids (s1–s3 tile, call and tachi: no audio, no rows) can still be renamed once. After that, ids.json is append-only.

**P1-2. The double stamp leaks past the privacy line.** The partner gets `{d,g,n,ms}` only (guest.ts listenFor). **Fix:** the user decides. Either add `u` plus a stamped bit to ListenSummary (contract change, relay first) or drop the double stamp.

**P1-3. Not all content fits a unit.** About 290 items are news, academic, "other" or island S0. **Fix:** they stay level-only, or go to the アナウンス/news tracks. A coverage ratchet lets the unassigned count fall but never rise.

**P1-4. cv churn will block co-play.** Every content wave bumps unit cv. **Fix:** cv per unit, so only the edited unit blocks, and the banner reloads.

**P2.** The phrase "caught in 3 contexts" needs phrase ids and a matcher. The compiler fills `in:` by normalised match and lints at least 3 contexts across units.

## Schema (unit manifest)

```yaml
schema: 1
unit: ev-bday            # ≤ 12
domain: events           # one of 9
band: 2                  # B1..B2 → protocol lv on rows
host: kanon
scene: party
cando: "…"
function: inviting
sound: gonna
status: draft            # gate as today
phrases: [{id: ph-swing-by, en: "swing by", ja: …, evp: B1, match: "swing(s|ing)? by"}]
uses: [m4-be-good, dmo-party-2, sp-cake]   # existing ids, incl. ladders
items: [...]             # new items, today's kinds
lessons:
  - {n: 1, kind: dialogue, items: [dmo-party-2]}
  - {n: 2, kind: chunks,   items: [...], v: 1}
  - {n: 3, kind: vary,     items: [...]}
  - {n: 4, kind: ladder,   items: [sp-cake, ...]}
  - {n: 5, kind: check,    items: [...], held: true, v: 1}
```

The compiler validates the manifest:
- every id exists and has the right kind;
- one home per item;
- band within ±1 of each item's `lv`;
- each lesson builds at least its round count for 50 seeds, deterministically;
- seed budget and near-dupes across units.

## Migration

A script, `scripts/listen/units-from-audit.ts`, reads /tmp/audit/classified.json (domain, function), each item's seed and level, and proposes draft manifests (`uses` only) for the 36 units, plus `unassigned.json`. The content lead hand-edits the drafts. The ratchet test and golden level decks (seeds 0–99 per level, unchanged by any re-tagging commit) prove that the migration doesn't touch the quiz.

## Ordering

- **Waits for the chunk split:** extend its `Unit` type and index (unit entries, an item's home) rather than writing a second loader.
- **Independent of 8b and 9:** manifests, the validator, the migration, solo lessons as local decks (the にがて れんしゅう path: nothing goes on the wire) and the stamp fold. All of these can run in parallel with 8b and 8c.
- **Needs 8c:** multiplayer lessons.
- **Lands with 9b:** turning TS items into YAML.
- **Lands with 9c:** packs.

## Multiplayer

- `open {gm:'unit', u, o:[lesson], cv:unitCv, f}`, worst case about 120 B.
- RoundGame buffers the `g` until `load(u)` resolves.
- The host picks the lesson; both rows carry `u` and `l`.
- An unknown or newer unit is treated as `blocked:'update'`.
- The guest may play, and its rows are its own.

## Performance

- Today's index is 8.7 KB gz.
- Add a path index (about 120 B per unit), but no phrases, which go in the unit's chunk. Budget: ≤ 12 KB gz at 200 units.
- Unit chunks are ≤ 20 KB gz (25 items with words is about 10 KB).
- A unit chunk duplicates its level part's bytes, about 1 MB in total, cached by the service worker.
- In 9c, flip storage so a level = its units' chunks, with no duplication. The unit is the pack.

## Tests

- schema fixtures (good and bad);
- unit build determinism and cv golden;
- golden level decks;
- the ratchet;
- the stamp fold (79/80 %, rp>0, `v`, a row naming an unknown unit skipped on an older build);
- listen.test for `l`, plus relay room.test;
- e2e: a solo lesson, two-page co-op on `play`, the cv banner;
- bundle budgets.

## Risks

1. Merge conflict with the chunk split. Wait for it.
2. Thin existing coverage for the gap units (events: 10 items in total). Waves are gated by the listening check, not by code.
3. Interim lessons 2 and 5 feel unlike the spec.
4. Privacy of stamps.
5. cv churn.
6. id renames.

## Steps (main green each)

| # | Work | Est. | After |
|---|---|---|---|
| U0 | contract `l` (+ summary, if approved), relay first | 0.25 d | now |
| U1 | manifest schema, validator, index unit entries, home map | 1 d | chunk split |
| U2 | migration script, 36 draft manifests, ratchet, golden decks | 1 d + review | U1 |
| U3 | lesson builders (1, 3, 4, interim 2 and 5), solo local decks, stamp fold; hidden behind `?units` | 1.5 d | U2 |
| U4 | しまの みち (UX U7) | 2 d (UI) | U3 |
| U5 | `gm:'unit'` on `play`, co-op e2e | 0.75 d | 8c, U3 |
| U6 | from-bank → YAML, items moved to their homes | 1 d | 9b |
| U7 | unit = pack and chunk, no duplication | 0.5 d | 9c |
| U8 | real lesson 2 / lesson 5, stamp `v: 2` | per game | 10, 14, 15 |

Code total about 6 agent-days, plus UI. Content waves start after U1.

## Sign-off

- P0-1/2/3 adopted (manifest overlay, versioned lessons, `l` on rows);
- unit ids ≤ 12;
- the user decides the double stamp;
- the chunk split lands first;
- the golden level-deck test in U1.
