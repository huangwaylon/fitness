# Listening content (`content/listen/`)

Source units for the ききみみ games, one YAML file per unit (docs/kikimimi-engine.md "Listen parts"; docs/curriculum.md
"Scenarios", "Audio and script rules"). `npm run kikimimi:levels` checks them (src/lib/kikimimi/listen.ts) and
compiles each into `levels/parts/<unit>.json`; a problem in any file stops it, and content.test runs the same checker.
The games show `listened` files only (a story shows from `voiced`); a draft plays only with the dev hooks.

## Files and names

- `<unit>.yaml`, where `unit` is the file name: `[a-z0-9-]{1,12}`. It is the pack name and the `u` on the wire.
- The prefix is the curriculum stage (`s0` はまべ … `s4` ほし), then the game, then a letter when a stage has more
  than one unit: `s1-tile-a`, `s2-call-b`, `s3-tachi-a`.
- `stage` in the header is 1–5 (S0–S4), so an `s2-` unit has `stage: 3`; its clips are spoken at level stage + 1.
- Item ids are `[a-z0-9][a-z0-9-]{0,31}` and unique across all units, prefixed by kind (`tile-`, `call-`, `tachi-`).
  They key SRS history and `listen` rows, so **never rename or reuse one**. Retire an item by deleting it.

## Header

```yaml
schema: 1
unit: s2-call-a
game: call                       # the GameDef that shows it: tile | call | tachi | rush | news | quiz | ladder | long | serial
stage: 3                         # 1-5 = S0-S4
track: life                      # life | people | work | broadcast
seeds: [3, 10, 14, 25, 30]       # curriculum.md "The scenario bank" (1-70); every item's tags.seed is one of these
features: { primary: self-repair, review: numbers }
cando: "でんわで 番号や 日時の 訂正を ききとって メモできる"
status: draft                    # draft | voiced | listened (the games show listened only)
cast: { me: us-m3 }              # optional: speaker -> cast voice for this unit
items: [...]
```

**Voices.** A villager speaks with their cast.ts `CAST` voice unless the unit's `cast` says otherwise. The voice must
be one of speech.ts `CAST_IDS` and match the villager's gender. Speakers in one item must have different voices, or
the listener can't tell them apart. Every voice here is American (`us-*`), and so is the English: the US-only lint
(listen.ts `notUs`) is an error over `en`, the lines and the plan choices (never `tts`).

## Every item

| field | |
|---|---|
| `kind` | `tile`, `call`, `tachi`, `rush`, `news`, `weather` or `long` (the quiz kinds stay in bank.ts) |
| `id` | see above |
| `note` | the trap, in Japanese, ≤ 40 字 (counted with `[...s].length`, spaces included). No grammar terms |
| `tags` | `{seed, register, pragmatic, conditions?, features}`, from the vocabulary below |
| `scene` | optional backdrop: `cafe platform pharmacy office door gate street living` (bank.ts `SCENE_IDS`). None means the plain stage |
| `channel` | optional: `live phone pa video`, when `tags.conditions` don't already say it |
| `ask` | optional: what the scene card says while it plays (Japanese, UI style) |
| `ctx` | the situation, Japanese with kanji, one line ≤ 30 字: who, where, why, never the answer |
| `why` | 解説: why the answer fits and what each trap was, Japanese with kanji, ≤ 90 字 |
| `cja` | the choices in Japanese, one per option in the authored order, no Latin letters |

The help (bank.ts `helpProblems`) is checked wherever it is, and required once a file's status is past `draft`:

| kind | required help |
|---|---|
| `tile` | `ctx`, `why` |
| `call` | `ctx`; each memo round's `why`; each slot's `cja` |
| `tachi` | each round's `ctx` and `why` (`cja` optional on the plan round) |
| `rush` | `ctx`, `why`, `cja` |
| `news` | `ctx`; the gist's and the detail's `cja` and `why`; each sky's umbrella `why` |
| `long` | `ctx`; each question's `cja` and `why` |

## Text rules (curriculum.md "Audio and script rules": the rest)

- `en` is what the reveal shows, in standard American spelling (neighbor, realize). Digits
  are fine in `en` (`¥3,000`, `090-2816-4473`, `the 14th`).
- `tts` is what the engine says, spelled as said (gonna, lemme, 'im, "bud it"; a tile's: "tile" below). **No digits,
  ever**: numbers as they are said (oh-nine-oh, the fourteenth); whenever `en` has a digit, a `tts` is required.
- Punctuation is prosody: a comma is a breath, "—" or "..." a break or trailing off.
- `ja` is natural written Japanese with no spaces between Japanese words, like bank4.ts.
- `ask`, `cando`, the memo `ask`s and options, and the たちぎき `claims` are UI copy: kanji with spaces between
  phrases, like the app's other Japanese copy (「何時に 行く？」).
- Adult, real life: yen and real places, villagers playing people, no island currency (curriculum.md
  "The island frame").

## `tile` (ことば タイル)

```yaml
- kind: tile
  id: tile-shoulda-told-him
  speaker: audie
  en: "I should've just told him the truth."
  ja: "最初から本当のことを言えばよかった。"
  tiles: ["I", "should've", "just", "told", "him", "the", "truth"]
  decoys: ["shouldn't have", "them"]
  marks: [[link, "told him"]]
  note: "should've＝〜すればよかった。n の音はない"
  tags: { seed: 57, register: friend, pragmatic: attitude, features: [contraction, h-drop] }
```

Ordinary sentences at natural speed, one sound trap each (weak forms, contractions, linking, numbers, stress); the
voice says the written words and that already sounds American.
- `tiles` are `en`'s words in order (the answer). Joined with spaces they must equal `en` without `. , ? ! ; : " —
  …`, with the case kept. 3–12 tiles (the wire's answer holds 12; かわ ≤ 10). A standard contraction is one tile, never
  split or expanded (I'm, should've, Why'd). **gonna, wanna, gotta** are the only respelled tiles: `en` spells them
  when the voice says them (never for "going to" a place or "want me to"), and a `say` mark glosses them
  (`[say, "gonna", "going to"]`, the only `say` a tile has). **One order:** where words could also go elsewhere
  ("or iced", "trust me", "I think"), merge them into one tile or reword; there are no accepted orders.
- **Every tile is heard:** the clip says each tile (no dunno, whatcha, "Ya gonna" for "Are you gonna").
- `decoys` (1–4, never a tile): what a Japanese ear could hear instead, wrong by sound: I'd/I'll, We'll/We,
  should've/shouldn't have, gonna/wanna, gotta/got, for/four, and/in, of/have, can/can't, a near sound (end/and).
  Never a homophone (here/hear, your/you're), a word grammar alone rules out, or a respelled form.
- `tts` defaults to `en`: only for digits, or a flap or dropped t the engine won't make (ged, liddle, nex'), or -in'
  from a friend. Never a respelled function word or reduction (ya, an', ta, didja, lemme, hafta, kinda, 'im…).
- `note` and `why` in plain Japanese with no grammar terms (主語, 過去形, 母音…): one trap, the meaning or a kana sound
  hint (「ディジュ」), never the respelling.
- **Caps:** at most 20 % of a stage's tiles say a reduction at かわ, 25 % at もり, 30 % at やま (the trio, or a derived
  clip's lemme, hafta, -cha…); chains never.
- `tone` (optional, an own clip's only): how it's said, from `ctx`, register and pragmatic. `soft` (tired, sorry,
  hesitant, a gentle no), `firm` (staff stating a rule, venting, a little annoyed), else `neutral`; how it's voiced:
  docs/kikimimi-engine.md "Generation". Adding one re-voices the clip.
- **`revoice: true`:** its words changed since its clip was spoken. The compiler leaves it out of the part (never dealt,
  a unit's おと falls back to its quiz) until it's re-voiced (`npm run audio:kikimimi -- --only '^tile-<id>$'`) and the
  line deleted; content.test fails while another tile's clip says other words than its `tts ?? en`.

**Derived tiles** (`s2-tile-bank`, `s3-tile-bank`): a voiced one-clip quiz item rebuilt as a tile, playing its own clip
(`clip: <bank id>`, id `tile-<bank id>`, no `speaker` or `tts`; `en` the bank item's as said: listen.ts `asSaid`).
`npm run kikimimi:tiles` writes them from the bank's reducing US items and its PLAIN picks, less its RETIRED, keeping
the reviewed help and merged tiles; a new one has `review: true` until a person writes it. Its clip is never re-voiced
for a tile: keep it or retire it.

## `call` (ようじ でんわ)

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
- At least one line has `repair: true` (the mid-call change or correction); a call also has an indirect request, a
  bad line (`signal`) or background noise.
- `half` gives one role (0 or 1) per line for co-op 「each hears half」, and both roles are used. Spread the memo's
  answers over both halves, so the team has to pool them. Put the pre-correction value in one half and the
  correction in the other.
- `memo` holds 1–2 rounds of 1–12 slots, each 2–6 distinct `options` in the authored order (ascending reads best) and
  an `answer` index; the distractors are the corrected value, another value heard, and a plausible inference.

## `tachi` (たちぎき)

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
  A negative value overlaps the previous line, and every たちぎき above はまべ has at least one. Keep overlaps mild (−0.2 to −0.5) and
  on lines whose start doesn't carry the answer.
- `rounds` come in this order: `opinions`, `changed`, `plan`.
  - `opinions`: three claims, each held by one speaker **by the end**; `answer` names the speaker for each claim.
  - `changed`: who changed their mind.
  - `plan`: 3–4 English choices; `ja` is the right one in Japanese. Vary `answer`. Avoid villager names in the
    choices: describe roles ("the one taking her to dinner").

## `rush` (すうじ ラッシュ)

`s0-rush.yaml` … `s4-rush.yaml` are written by `scripts/kikimimi-rush.ts` (`npm run kikimimi:rush`). Edit the frames
there, never the files. `--check` fails when a file is stale, and `--clips` lists the clips to voice.

```yaml
- kind: rush
  id: rush-latte-1                 # rush-<frame>-<n>
  at: cafe                         # cafe | konbini | ticket | deli | taxi | pharmacy (the counter's sign)
  speaker: goldie
  en: "Morning! Can I get four iced lattes? Oh, actually, make that three."
  ja: "おはようございます。アイスラテを4杯…あ、やっぱり3杯で。"
  ask: "アイスラテは 何杯？"          # the ticket's question (UI copy)
  ctx: "カフェのカウンターで注文を受けています"
  options: ["2杯", "3杯", "4杯", "13杯"]   # 4 chips, ascending
  answer: 1
  was: 2                           # the chip said before a self-correction (only with the self-repair feature)
  cja: [...]                       # one per chip
  why: "..."
  note: "..."
```

- One customer is one clip (its id). A tier keeps 3 or 4 chips by their numbers (games/rush/def.ts `chipsAt`), so
  the chips must read as numbers.

## `news` (しずえの ニュース)

```yaml
- kind: news
  id: news-flea-market             # ≤ 24 characters (its rounds add -d, -kasa)
  season: spring                   # spring | summer | autumn | winter | any (true on any day of it)
  weekday: mon                     # optional: dealt only on that day
  ctx: "月曜の 朝の ニュース。週末の 予定と 東京の 暮らし"
  segments:
    - { topic: island, lines: [{ en: "...", ja: "..." }] }   # island | season, 3-5 lines of 6-32 words
    - { topic: tokyo, lines: [...] }                         # 100-170 words in all (はまべ 80-120, ほし 150-220)
  gist: { choices: [4 English], answer: 0, trap: 2, cja: [...], why: "..." }
  detail: { ask: "フリーマーケットは 何時 開始？", choices: [...], answer: 2, trap: 1, cja: [...], why: "..." }
```

- しずえ reads every line (the file's `cast.isabelle`). Evergreen: nothing to fact-check, no weather (the game adds
  today's). `trap` is the easy tier's other choice.
- `weather` (one item in all, news-a's): `sky` (8, each with the umbrella question's `why`), `high` (`en`, `one`, `ja`
  with `{n}`), `alerts` (6), `end`. The compiler makes its 56 sentences (games/news/weather.ts says which are read).

## `long` (まるごと 聞く)

```yaml
- kind: long
  id: lg-hama-hotel-morning        # ≤ 24 characters (its rows add -q5, -k12)
  name: 朝の フロントで               # the title, ≤ 20 字
  source: tts                      # tts (villagers speak it) | real (cut from a recording)
  lines:
    - { who: maple, at: 0, en: "...", ja: "..." }                # real: { who: a, t: [0, 6.2], en, ja }
  questions:                       # 4-5, the gist first, 3 types at least
    - { type: gist, ask: "どんな やり取り？", line: 12, choices: [3 English], answer: 0, cja: [...], why: "..." }
  dict:                            # 2-4 dictation lines
    - { line: 6, words: "Can I have your", feature: weak-form }
```

- `ctx`, `note`, `tags` as every item. The bounds (lines, words, seconds) and each field's rule: listen.ts
  `checkLong`'s header. `type`: `gist`, `mean`, `attitude` or `next`; `line` the line that answers it.
- **Generated** (`tts`): villagers with distinct US voices, `at` as たちぎき's. **Real**: `speakers`
  (`a: { name, ja, g: f|m }`), each line's `t` cut end to end, and `credit` (`npm run kikimimi:real` cuts them).

## Adding a listening file

1. Write `<unit>.yaml` at `status: draft`; `npm run kikimimi:levels` until it compiles, and
   `npm run kikimimi:tells -- <file>` for the choices. Then the reviews ("Checks"), before any voicing.
2. On the Mac: `npm run audio:kikimimi -- --only '<its ids>'` (it writes the packs and compiles the levels at its end),
   `npm run audio:kikimimi-words`, and for a `long` file `npm run kikimimi:real -- --align --only '<its ids>'`. Then
   `status: voiced`.
3. The listening check (curriculum.md "Listening check"), then `status: listened` and `npm run kikimimi:levels`: only
   now do the games deal it (a game's e2e spec pins its place: re-check it).
4. Commit together: the YAML, src/lib/kikimimi/levels/, clips.json, words.json, packs.json (and align.json),
   static/audio/listen/'s new packs, scripts/kikimimi-clips.src.json, scripts/tts/report.json (and tone-picks.json).
   bank.test caps the games' packs at 160 MiB: check the headroom before a big batch.

## Stories (`story/`, おやすみ ものがたり, curriculum.md "Modes")

Bedtime serials in the framework's `serial` shape, one file per serial: extensive listening at ~95 % comprehension, so
no score, no questions, no notes or tags. They live in `story/` (checked by `src/lib/kikimimi/stories.test.ts`).

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
- `ph`: 5–8 per chapter (curriculum.md "Units"'s phrase shape). Its `match` (or `en`) must be heard in the chapter;
  ids are unique across stories and units.
- `predict` is for the morning after, never during the story; `answer` is what the next chapter tells. The last
  chapter has none.
- **Voicing:** `npm run audio:kikimimi` speaks every segment as a clip `<chapter>-<n>`, at −18 LUFS with no bed,
  through the quiz's gate; each chapter has its own packs and chunk (`levels/parts/st-johnny-3.json`). After changing
  a segment: `npm run audio:kikimimi -- --only '^serial-'`, then `npm run audio:kikimimi-words`. A word the engine says
  wrong gets a `tts` respelling; whisper's spelling of a name, a fold in tts.py.

## Vocabulary

- `register`: service, colleague, boss, friend, partner, neighbour, stranger, official, broadcast.
- `pragmatic`: literal, indirect, refusal, hedge, understatement, sarcasm, humour, formula, ritual, attitude,
  deception.
- `conditions`: bank.ts's `phone voicemail pa video cafe station desk`, plus `signal` (a line breaking up: the next
  line is the player asking again, with no answer in it), `street`, `train`, `party` (docs/kikimimi-engine.md
  "Conditions").
- `features`: bank.ts `Feature`, plus `linking`, `h-drop`, `chain` (reduction chains:
  whatcha, whaddaya, wouldja've; never in a tile), `elision` (t/d dropped: jus'), `assimilation`, `overlap`, `filler`, `stress`.

A new value goes into listen.ts's lists and here, in the same commit.

## Checks

listen.ts `checkListen` (the compiler and content.test) checks every rule above that a machine can: the fields,
voices, `tts`, the tile rules and caps, ids unique across files, banks, units and rungs, the help, the US-only lint.

It doesn't check whether the English is natural, whether a decoy is fair, or whether a claim really belongs to one
speaker. Those need an English reviewer and a Japanese reviewer, then the listening check once the items are voiced
(`npm run audio:kikimimi -- --listen --only <regex>`; what's still flagged: docs/curriculum.md "Listening check").
