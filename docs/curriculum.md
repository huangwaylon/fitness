# ききみみ curriculum (retired)

What the old game taught, its stages, units and generated content went with it on 2026-11-16 ([kikimimi.md](kikimimi.md)).
Left: what an old `listen` row's fields meant, for the contract that still parses them.

## Modes

An old row's `gm`: absent (or `quiz`) the quiz, else the game's id: `lesson`, `check`, `ladder`, `henshin`, `tile`,
`tachi`, `call`, `rush`, `news`, `taikai`, `long`, `story` (minutes only) and the mic games (`mane`, `kuri`, `pair`,
`role`: minutes only). English Study's is `tv`.

## Units

`u`: a unit's id (`UNIT_RE`), a story's serial, or English Study's clip.

### Lessons

`l`, a unit's lesson: 1 であい, 2 ばめん, 3 チェック (6 questions; 5 right on the first listen stamped the unit), 4 おと,
5 じっせん.

### Playing together

`tm` (0–6) was a co-op チェック's team tally: `stampsUnit` stamps `l` 3 on my own ≥ 5 first-listen rights or `tm` ≥ 5.
The partner's summary of such a row carries `{u, stamped: 1}`, never the answers.
