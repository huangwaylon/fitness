# Listening content (`content/listen/`)

Source units for the ききみみ games, one YAML file per unit (docs/kikimimi-framework.md §6, §8 and "Listen parts as
built", docs/curriculum.md §5 and §9, docs/curriculum-wave2.md §2.1–2.3). `npm run kikimimi:levels` checks them
(src/lib/kikimimi/listen.ts) and compiles each into `levels/parts/<unit>.json`; a problem in any file stops it, and
content.test runs the same checker. The games show `listened` files only.

## Files and names

- `<unit>.yaml`, where `unit` is the file name: `[a-z0-9-]{1,12}`. It is the pack name and the `u` on the wire.
- The prefix is the curriculum stage (`s0` はまべ … `s4` ほし), then the game, then a letter when a stage has more
  than one unit: `s1-tile-a`, `s2-call-b`, `s3-tachi-a`.
- `stage` in the header is 1–5 (S0–S4), so an `s2-` unit has `stage: 3`. The framework's `s2-clinic` / `stage: 2`
  example predates this rule.
- Item ids are `[a-z0-9][a-z0-9-]{0,31}` and unique across all units, prefixed by kind (`tile-`, `call-`, `tachi-`).
  They key SRS history and `listen` rows, so **never rename or reuse one**. Retire an item by deleting it.

## Header

```yaml
schema: 1
unit: s2-call-a
game: call                       # the GameDef that shows it: tile | call | tachi | quiz | ladder | news | long | serial
stage: 3                         # 1-5 = S0-S4
track: life                      # life | people | work | broadcast
seeds: [3, 10, 14, 25, 30]       # curriculum §5.5 (1-66); every item's tags.seed is one of these
features: { primary: self-repair, review: numbers }
cando: "でんわで 番号や 日時の 訂正を ききとって メモできる"
status: draft                    # draft | voiced | listened (the compiler ships listened only)
cast: { me: us-m3 }              # optional: speaker -> cast voice for this unit
items: [...]
```

**Voices.** A villager speaks with their bank4.ts `CAST` voice unless the unit's `cast` says otherwise. The voice must
be one of speech.ts `CAST_IDS` and match the villager's gender. Speakers in one item must have different voices, or
the listener can't tell them apart. Every voice here is American (`us-*`), and so is the English: the US-only lint
(listen.ts `notUs`: mate, cheers for thanks, queue, flat, lift, fortnight, reckon, half nine, -our and -ise spellings…)
is an error over `en`, the lines and the plan choices (never `tts`).

## Every item

| field | |
|---|---|
| `kind` | `tile`, `call` or `tachi` (the quiz kinds come over from bank.ts in 9b) |
| `id` | see above |
| `note` | the trap, in Japanese, ≤ 40 字 (counted with `[...s].length`, spaces included). No grammar terms |
| `tags` | `{seed, register, pragmatic, conditions?, features}`, from the vocabulary below |
| `scene` | optional backdrop: `cafe platform pharmacy office door gate street living` (bank.ts `SCENE_IDS`). None means the plain stage |
| `channel` | optional: `live phone pa video`, when `tags.conditions` don't already say it |
| `ask` | optional: what the scene card says while it plays (Japanese, UI style) |
| `ctx` | the situation, Japanese with kanji, one line ≤ 30 字: who, where, why, never the answer (a tile's and a call's; a たちぎき's per round) |
| `why` | 解説: why the answer fits and what each trap was, Japanese with kanji, ≤ 90 字 (a tile's; a call's per memo round; a たちぎき's per round) |
| `cja` | the choices in Japanese, one per option in the authored order, no Latin letters (a call's per memo slot; optional on a たちぎき's plan round) |

The help (bank.ts `helpProblems`) is checked wherever it is, and required once a file's status is past `draft`: a
tile's `ctx` and `why`; a call's `ctx`, each memo round's `why` and each slot's `cja`; each たちぎき round's `ctx` and
`why`.

## Text rules (curriculum §9)

- `en` is what the reveal shows, in standard American spelling (neighbor, realize). Digits
  are fine in `en` (`¥3,000`, `090-2816-4473`, `the 14th`).
- `tts` is what the engine says, spelled as said: gonna, hafta, lemme, d'you, didja, 'em, an', ya, yer, goin',
  'im (a dropped h), "bud it" (a flap). **No digits, ever**: write numbers as they are said
  (oh-nine-oh, twenty-two thousand yen, the fourteenth). Whenever `en` has a digit, a `tts` is required.
- Punctuation is prosody: a comma is a breath, "—" or "..." a break or trailing off.
- `ja` is natural written Japanese with no spaces between Japanese words, like bank4.ts.
- `ask`, `cando`, the memo `ask`s and options, and the たちぎき `claims` are UI copy: kanji with spaces between
  phrases, like the app's other Japanese copy (「何時に 行く？」).
- Adult, real life: yen and real places, villagers playing people, no island currency (curriculum §5.4).

## `tile` (ことば タイル, increment 10)

```yaml
- kind: tile
  id: tile-shoulda-told-him
  speaker: audie
  en: "I should've just told him the truth."
  tts: "I shoulda just told 'im the truth."
  ja: "最初から本当のことを言えばよかった。"
  tiles: ["I", "should've", "just", "told", "him", "the", "truth"]
  decoys: ["shouldn't have", "them"]
  marks: [[say, "should've", "shoulda"], [say, "him", "'im"], [link, "told him"]]
  note: "should've は「シュダ」。'im の h は落ちて「トールディム」"
  tags: { seed: 57, register: friend, pragmatic: attitude, features: [contraction, h-drop] }
```

- `tiles` are `en`'s words in order (the answer). Joined with spaces they must equal `en` without `. , ? ! ; : " —
  …`, with the case kept. 3–12 tiles: the wire's answer holds at most 12.
- `decoys` (1–4) are what a Japanese ear plausibly hears instead: weak-form swaps (to/the/a, and/in, for/four, of/have),
  contraction swaps (I'd/I'll, should've/shouldn't have, would've/wouldn't have), want/won't, can/can't, a missing
  auxiliary (I for I've), or a near sound (end/and, ten/then). A decoy must not also be a tile.
- `tts` is required and differs from `en`. That respelling is the point of the item.
- `marks` are the sound marks shown at the reveal (bank.ts `SoundMark`). Their words must appear in `en`.

**Derived tiles** (`s2-tile-bank`, `s3-tile-bank`): a voiced one-clip quiz item rebuilt as a tile, playing its own clip
(`clip: <bank id>`, the tile's id `tile-<bank id>`). Its `en` is the item's, with no `speaker` or `tts` (the clip has
them). `npm run kikimimi:tiles` writes them from the bank: every US item in play with a reducing `tts`, 3–12 words, no
digits and a reduction feature (a dialogue's lines aren't one-clip items). Each run rewrites what the bank owns and
keeps the reviewed `decoys`, `marks`, `note`, `ctx` and `why`; a new tile comes with defaults and `review: true` until
a person writes its help. A draft that says what a bank item already says is folded into that item's derived tile.

## `call` (ようじ でんわ, increment 14)

```yaml
- kind: call
  id: call-oat-milk
  lines:
    - { who: goldie, en: "...", tts: "...", ja: "..." }
    - { who: me, en: "Sure. What do you need?", ja: "いいよ。何がいる？" }
    - { who: goldie, en: "Oh, actually, make that two cartons...", ja: "...", repair: true }
  half: [0, 0, 1]
  memo:
    - slots:
        - { ask: "いくつ？", options: ["1本", "2本", "12本"], answer: 1 }
```

- `who: me` is the player's side of the call. It is voiced by the unit's `cast.me` (us-m3 in every unit so far).
- At least one line has `repair: true`: the mid-call change, the correction, or the condition remembered late. Each
  call also has an indirect request, a bad line (`signal`), background noise, or several of these.
- `half` gives one role (0 or 1) per line for co-op 「each hears half」, and both roles are used. Spread the memo's
  answers over both halves, so the team has to pool them. Put the pre-correction value in one half and the
  correction in the other.
- `memo` holds 1–2 rounds of 1–12 slots. Each slot has 2–6 distinct `options`, shown in the authored order (times and
  amounts ascending reads best), and `answer` is an index. The distractors are the corrected value, a value heard
  elsewhere in the call, and a plausible inference (a sum, the time to arrive early).

## `tachi` (たちぎき, increment 15)

```yaml
- kind: tachi
  id: tachi-shibuya-dinner
  lines:
    - { who: cherry, at: 0, en: "...", ja: "..." }
    - { who: raymond, at: -0.3, en: "...", tts: "...", ja: "..." }
  rounds:
    - { type: opinions, claims: ["待つのは いや。満席なら ラーメン", "...", "..."], answer: [cherry, raymond, dom] }
    - { type: changed, answer: dom }
    - { type: plan, ask: "このあと どうなる？", choices: ["...", "...", "..."], answer: 0, ja: "..." }
```

- Exactly three speakers, with three different voices, ideally three accents.
- `at` is the gap in seconds from the previous line's end to this line's start: the first line is 0, then −1.5 to 3.
  A negative value overlaps the previous line, and every たちぎき has at least one. Keep overlaps mild (−0.2 to −0.5) and
  on lines whose start doesn't carry the answer.
- `rounds` come in this order: `opinions`, `changed`, `plan`.
  - `opinions`: three claims, each held by one speaker **by the end**; `answer` names the speaker for each claim.
  - `changed`: who changed their mind.
  - `plan`: 3–4 English choices; `ja` is the right one in Japanese. Vary `answer`. Avoid villager names in the
    choices: describe roles ("the one taking her to dinner").

## Stories (`story/`, おやすみ ものがたり, curriculum §7.1)

Bedtime serials in the framework's `serial` shape, one file per serial (`st-johnny`, `st-cafe`): extensive listening
at ~95 % comprehension, so no score, no questions, no notes or tags. They live in `story/` so content.test doesn't
read them; `src/lib/kikimimi/stories.test.ts` does.

```yaml
unit: st-johnny                  # the header above, plus name (UI copy) and host; game: serial
cast: { narrator: us-f5 }        # required: the narrator's voice
items:
  - kind: serial
    id: serial-johnny-1          # serial-…
    chapter: 1                   # 1, 2, … in order
    title: "Washed Up Again"     # English, no digits (it may be read out)
    line: "ジョニーが タイペイの よいちの はなしを します"   # StoryFrame's one line, UI copy
    ja: "..."                    # the chapter's summary, natural written Japanese
    scene: street
    segments:                    # 6-28 words each (3-12 s at ~140 wpm); 450-700 words a chapter (3-5 min)
      - { who: narrator, en: "..." }
      - { who: dom, en: "Hey, buddy, are you okay? You're kind of soaked, man.", tts: "Hey, buddy, you okay? You're kinda soaked, man." }
    ph: [{ id: ph-wash-up, en: "wash up", ja: "...", match: "wash(ed|es)? up", register: friend, scene: "...", trap: "..." }]
    predict: { ask: "...", choices: ["...", "...", "..."], answer: 0, ja: "..." }
```

- `who` is `narrator` or a roster villager. Every voice is US (`us-*`), of the speaker's gender, and distinct within
  a chapter. No digits in `en` either: the narrator reads it. `tts` only where a character speaks casually.
- `ph`: 5–8 per chapter (curriculum-units.md's phrase shape). Its `match` (or `en`) must be heard in the chapter; ids
  are unique across stories and units.
- `predict` is for the morning after, never during the story; `answer` is what the next chapter tells. The last
  chapter has none.
- **Voiced** (2026-11-06, `status: voiced`): `npm run audio:kikimimi` speaks every segment as a clip of its own,
  `<chapter>-<n>` (n from 1), in the narrator's voice or the villager's (story.ts), as the engine speaks it (Qwen has
  no pace setting: ~200 wpm), with no noise bed, at −18 LUFS (the quiz's −16). The gate is the quiz's (whisper, re-rolls).
  Each chapter's clips go into its own packs (`st-johnny-3`, a second part past 1.2 MB) and its chunk,
  `levels/parts/st-johnny-3.json` (the chapter, its clips and word timings), with a line in the index's `stories`
  (pool.ts `loadChapter`). After changing a segment: `npm run audio:kikimimi -- --only '^serial-'`, then
  `npm run audio:kikimimi-words`.
- A word the engine says wrong gets a `tts` respelling, and whisper's spelling of a name a fold in tts.py: `mee-kahn`
  (mikan), `hun` (hon), the misspelt sign said "Little", Pekoe heard as "Pico".

## Vocabulary

- `register`: service, colleague, boss, friend, partner, neighbour, stranger, official, broadcast.
- `pragmatic`: literal, indirect, refusal, hedge, understatement, sarcasm, humour, formula, ritual, attitude,
  deception.
- `conditions`: bank.ts's `phone voicemail pa video cafe station desk`, plus new ones from these drafts: `signal` (a
  phone line breaking up), `street`, `train`, `party` (bar or crowd noise). On a `signal` call, each line with `...`
  is mixed breaking up (dropouts), so the next line is the player asking again and no answer is said in it; `party`
  puts the party bed under every line (docs/kikimimi.md "Conditions").
- `features`: bank.ts `Feature`, plus new ones from these drafts: `linking`, `h-drop`, `chain` (reduction chains:
  whatcha, whaddaya, wouldja've), `elision` (t/d dropped: jus'), `assimilation`, `overlap`, `filler`, `stress`.

A new value goes into listen.ts's lists and here, in the same commit.

## Checks

listen.ts `checkListen` (the compiler and content.test) checks:
- the header;
- each kind's required fields;
- speakers in the roster, with a voice of the right gender and distinct voices within an item;
- cast ids;
- `tts` without digits;
- notes ≤ 40 字;
- tiles that rebuild `en`;
- marks that are in `en`;
- the `half` arrays;
- `at` offsets;
- ids unique across files and apart from every bank, unit and rung clip;
- a derived tile's `clip` (a voiced one-clip bank item, its `en`);
- the Japanese help (above);
- US voices and the US-only lint;
- every answer in range.

It doesn't check whether the English is natural, whether a decoy is fair, or whether a claim really belongs to one
speaker. Those need an English reviewer and a Japanese reviewer, then the listening check on `/dev/listen` once the
items are voiced.
