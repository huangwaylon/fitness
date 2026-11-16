// REVIEW 2026-11-16: pass 5, fix 16, drop 2, new 1; ear checks 3
// REVIEW open: nt1 (C2) has 4 choices as a 2 × 2; the fourth (both halves wrong) is the weakest, kept so no half cues.
// “Who's Your Daddy?  - The Office US” (the official The Office channel, BEST OF SEASON 5): Jan, expecting a baby by a
// donor, drops in to show off her candle business; Michael rehearses the birth with Dwight and a buttered watermelon,
// and when the baby comes he isn't there.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 183 s; whisper's repeated line after it
// is a hallucination, and its timings run in 1 s blocks. Untested on purpose: 52–54 s (“cervix”), 87–100 s (“have my
// baby”, “crowning” vs “drowning”, shouted overlap), 101–105 s (Dwight's talking head), 113–121 s (“natural” vs
// “nothing”, “simulating” vs “stimulating”), 145.7 s (“happiest day”, speaker not named), 170 s (“oh no”, speaker not
// named). 19.4 s “they used” (whisper) vs “I used” (captions) and 178.6 s “mark it” vs “market” carry no key. Speakers
// are settled by “Hey, Jan” (8.9 s), “Michael!” (69.8 s) and “Hi, Jim” (162 s); the talking heads are not named.
// EAR CHECK: 74.1 s s2 — “what do you do” as one run (≈ “whaddaya”), not “what did you” (both sources have “do you”)
// EAR CHECK: 83.6 s x1 — “checked the route”: the -ed runs into “the” (both sources have the words)
// EAR CHECK: 31.1 s x2 — “who your daddy is” as one fast run (both sources have the words)
import type { Clip } from '../types.ts';

export const whosDaddy: Clip = {
  id: 'whosdaddy', video: 'bEPVS5IDWy0', title: 'Who\'s Your Daddy?', dur: 204, wpm: 171, band: 'fast',
  tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // why: 10 ← weak "a" and a clipped "hundred" sound short; 1,000 ← hundred/thousand swap
    { id: 'n1', skill: 'number', level: 'B1', point: 'copies', seg: [5.1, 9.4], keep: true,
      stem: 'How many copies does Jan ask for?',
      choices: ['10', '100', '1,000'], a: 1,
      cue: '「make me」のあと、copies の直前。',
      line: 'I need you to make me *a hundred copies* of this on canary yellow.',
      said: '「これを黄色い紙で100部コピーして」と頼んでいる。',
      mean: 'I need you to ～ は「〜してほしい」。お願いというより指示に近い言い方。',
      trap: 'a も hundred の語尾も弱く、短い数に聞こえやすい。thousand なら「サウ」の音が入る。',
      use: 'I need you to print ten copies.（10部印刷してほしい）' },

    // R fix: V2 (blind 50 %, the key was the only upbeat choice and "Oh, great" gave it; also a cue leak on "great").
    //   All three now say "doing great", so the item turns on the idiom.
    // why: picking fights ← "kicking" and "taking names" read word by word as a fight; customer names ← "taking
    //   names" = 名前を集める (a customer list)
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'kicking', seg: [9.4, 16.4],
      stem: 'Asked about her candle business, how does Jan say it is going?',
      choices: ['It is doing great and beating its rivals', 'It is doing great but picking fights with rivals',
                'It is doing great and collecting customer names'], a: 0,
      cue: '「Oh, great」のあとに続く、勢いのある決まり文句。',
      line: 'Serenity by Jan is *kicking ass and taking names*.',
      said: '自分のキャンドルの店は絶好調だ、と言っている。',
      mean: 'kicking ass and taking names ＝ 相手を次々に負かして勝ち続ける。くだけた強い言い方。',
      trap: '一語ずつ訳すと、けんかや名簿の話になる。決まり文句は丸ごと覚える。',
      use: 'Our team is kicking butt this season.（うちのチーム、今季は絶好調）' },

    // R fix: V2 (blind 70 %: the only feeling tied to her candles). All three now give a reason from the story; the
    //   segment runs on through "found her, too" to refute "worried".
    // why: touched ← candles at a vigil comfort people, so a warm reading fits; worried ← the girl "went missing",
    //   heard as still missing
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'vigil', seg: [9.4, 24.2],
      stem: 'When Jan brings up the missing girl, how does she seem to feel?',
      choices: ['Proud, since the vigil showed off her candles', 'Touched, since her candles comforted the family',
                'Worried, since the girl was still missing then'], a: 0,
      cue: '「Guess whose」で始まる問いかけの調子。',
      line: 'You remember… when that girl went missing? *Guess whose candles* they used for the vigil.',
      said: '行方不明の女の子の話を出し、「誰のキャンドルが使われたと思う？」と聞く。',
      mean: 'Guess whose ～ は自慢の前ふり。悲しい事件を、自分の商品の宣伝にしている。',
      trap: '事件の話なので、感動や心配を予想しやすい。気持ちは話題でなく言葉の形で判断する。',
      use: 'Guess who got the job?（誰が受かったと思う？）' },

    // R fix: V2 (blind 70 %: candles go with a vigil by common sense). Distractors are now candle events too.
    // why: memorial ← vigil is also said for the dead; sale for the search ← "candles" + "missing" heard as Jan
    //   selling them for the cause
    { id: 'd2', skill: 'detail', level: 'B2', point: 'vigil', seg: [16.1, 20.6],
      stem: 'What were Jan’s candles used for last week?',
      choices: ['A gathering to pray for a missing girl', 'A memorial for a girl who had died',
                'A sale to raise money for the search'], a: 0,
      cue: '「Guess whose candles」のあと、最後の一語。',
      line: 'Guess whose candles they used for the *vigil*.',
      said: '行方不明の女の子のための集まりで、自分のキャンドルが使われたと言う。',
      mean: 'vigil ＝ 無事を祈って、ろうそくを手に夜に集まること。',
      trap: 'vigil は追悼にも使うので、亡くなった子の会と取りやすい。went missing と合わせて聞く。',
      use: 'They held a candlelight vigil downtown.（街でろうそくを灯して祈る会があった）' },

    // R fix: V2 (blind 70 %: the only self-centred reading). The credit distractor is self-centred too, and the key
    //   no longer names "safety".
    // why: credit ← candles and "found her" tied in the wrong relation (her candles take the credit); only now learns
    //   ← the coworker's "Oh, they found her?" is heard as Jan's surprise
    { id: 'h1', skill: 'humor', level: 'C1', point: 'found', reveals: ['vigil'], seg: [16.1, 25.15],
      stem: 'What makes Jan’s line after the coworker’s “Cool” funny?',
      choices: ['The girl’s rescue is tacked on after her candles', 'Her candles get the credit for finding the girl',
                'She only now learns that the girl was found'], a: 0,
      cue: '最後の小さな一語と、話の順番。',
      line: 'Thank God they found her, *too*.',
      said: 'キャンドルの自慢のあと「女の子も見つかってよかった」と付け足す。',
      mean: 'too で付け足すと、女の子の無事がおまけ扱いになる。順番が逆なのが笑い。',
      trap: 'キャンドルと found が近いので手柄の話に聞こえやすい。too が何を後回しにしたかを聞く。',
      use: 'Oh, and happy birthday, too.（あ、それと誕生日おめでとう）' },

    // why: Jan ← "baby" as a pet name (katakana ベイビー = 恋人); the coworker ← "how are you, good to see you" sounds
    //   like a greeting to an adult
    { id: 'i1', skill: 'infer', level: 'B2', point: 'daddy', seg: [23.75, 32.5],
      stem: 'Right after “Hey, Jan”, who is the next greeting aimed at?',
      choices: ['The baby Jan is expecting', 'Jan, with an old pet name', 'The coworker who just spoke to Jan'], a: 0,
      cue: '呼びかけのあとに続く、二つの問いかけ。',
      line: 'Hey, Jan. Hello, *baby*. … You don’t know who your daddy is, do you?',
      said: 'ジャンに声をかけたあと「やあ、ベイビー」「パパが誰か知らないよね」と続ける。',
      mean: 'お腹の赤ちゃんに話しかけている。パパを知らないと言えるのは赤ちゃんだけ。',
      trap: 'baby は恋人への呼びかけにも使う。呼びかけのあとの言葉が、相手を決める手がかり。',
      use: 'Hello, little one!（こんにちは、おちびちゃん）' },

    // anchor: 30.7–32.2 s “you don't know who your daddy is, do you” comes right after “Who's your daddy?” (29.4 s);
    //   both sources have “who your daddy is”
    { id: 'x2', skill: 'dict', level: 'C2', point: 'daddy', seg: [28.6, 32.5],
      stem: 'Type the line: “You don’t know ___, do you?” (4 words)', answer: 'who your daddy is',
      cue: '1回目の問いかけのすぐあと。語順を耳で追って。',
      line: 'You don’t know *who your daddy is*, do you?',
      said: '「パパが誰か、知らないよね？」。4語は速く、ひと続きに聞こえる。',
      mean: '文の中の疑問は「who＋主語＋動詞」の順。直前の問いと同じ語が、並びだけ変わって出てくる。',
      trap: '直前の Who’s your daddy? が耳に残り、who’s と書きたくなる。書き取りは、前の文でなく今の音を書く。',
      use: 'I don’t know where my keys are.（鍵がどこにあるか分からない）' },

    // R fix: V2 + K1 (blind 55 %; "believed far too easily" was defensible, since they believed him on his word). New
    //   distractor: "telling" heard as telling over and over.
    // why: told so often ← "by telling us" heard as repetition; maybe really the father ← "he was the father" is said
    //   twice, like a report of fact
    { id: 'h2', skill: 'humor', level: 'C1', point: 'father', seg: [34.3, 42.2],
      stem: 'What makes the comment to the camera about the pregnancy funny?',
      choices: ['A phrase for tricking ends with plain telling',
                'He told them so often that they came to believe it', 'It hints that Michael may really be the father'], a: 0,
      cue: '前半の言い方と、by で始まる後半。',
      line: 'he *led us to believe* that he was the father, *by telling us* that he was the father.',
      said: '「父親だと思わせた。父親だと言うことで」と話す。',
      mean: 'led us to believe は「思わせた」。手口が来るはずの by のあとが、ただ言っただけ。',
      trap: 'father が2回出るので本当に父親かと思いやすい。この言い方は事実でない時に使う。',
      use: 'She led me to believe it was free.（無料だと思わせられた）' },

    // R fix: V2 (blind 55 %: the key was the one choice sharing a half with each distractor). Now a full 2 × 2, so
    //   no half is a cue; the fourth choice misses both halves.
    // why: only hinted ← "led us to believe" heard as the method (a hint), missing "by telling us"; may be true ← "he was
    //   the father" said twice, heard as a plain report; hinted + may be true ← both misreads together
    // anchor: 36.8 s “led us to believe” presents the claim as something they were made to think; 39.4 s “by telling
    //   us” says it was stated outright
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'father', seg: [34.3, 42.2],
      stem: 'Which plain version keeps what the comment says about Michael’s claim?',
      choices: ['“He said it outright, and it wasn’t true.”', '“He only hinted at it, and it wasn’t true.”',
                '“He said it outright, and it may be true.”', '“He only hinted at it, and it may be true.”'], a: 0,
      cue: 'by のあとの手口と、前半の言い方の含み。',
      line: 'he *led us to believe* that he was the father, *by telling us* that he was the father.',
      said: '「父親だと思わせた。父親だと言うことで」と話す。',
      mean: 'led us to believe は「事実でないことを信じこませた」。by のあとは明言。明言で、しかも事実ではない。',
      trap: 'led を「ほのめかした」と取ると、by のあとを聞き落とす。思わせた、には事実でない含みがある。',
      use: 'Turns out he made the whole thing up.（全部作り話だったんだ）' },

    // R fix: S1 — the stem said "In the practice", which gave away g1's key.
    // why: five ← the usual sitcom labor figure; twenty ← ten and twenty start alike
    { id: 'n2', skill: 'number', level: 'B1', point: 'contract', seg: [47.0, 50.55], keep: true,
      stem: 'How often are the contractions said to be coming?',
      choices: ['Every five minutes', 'Every ten minutes', 'Every twenty minutes'], a: 1,
      cue: '「coming every」のすぐあと、短い数。',
      line: 'Contractions are coming *every ten minutes*.',
      said: '「陣痛が10分おきに来てる」と報告する。',
      mean: 'every ten minutes ＝ 10分ごと。出産が近づいている合図として言っている。',
      trap: 'ten と twenty は出だしが同じ。twenty なら最後に「ティ」が付き、少し長い。',
      use: 'The bus comes every fifteen minutes.（バスは15分おきに来る）' },

    // R fix: V2 (blind 60 %, helped by n2's and d8's stems saying "practice"; those stems are reworded). The party
    //   filler is now an office drill.
    // why: drill ← Dwight shouting orders ("Adapt") heard as an emergency drill; class ← "contractions", "breathing"
    //   and "hospital" heard as a parenting class
    { id: 'g1', skill: 'gist', level: 'B1', point: 'rehearse', seg: [47.0, 87.05],
      stem: 'What are Michael and Dwight doing for most of this part?',
      choices: ['Rehearsing the birth, with Dwight playing Jan', 'Running a first-aid drill for the whole office',
                'Taking a class for new parents at a hospital'], a: 0,
      cue: '陣痛や病院の話を、誰が誰にしているか。',
      line: 'Michael is *preparing for the birth* of a watermelon with Dwight.',
      said: 'ドワイトが妊婦役、マイケルが付き添い役になり、陣痛から病院へ向かう流れを練習する。',
      mean: 'ジャンの出産に立ち会うための予行演習。スイカを赤ちゃんに見立てている。',
      trap: '病院や呼吸の話から講習会を思いやすいが、教える先生はいない。二人で役を演じている。',
      use: 'Let’s do a practice run first.（まず一度、予行演習しよう）' },

    // R fix: V2 (blind 50 %). "Real doubt" is now the sharper near miss: the donor might be Michael.
    // why: donor is Michael ← "related to Michael through…" heard as setting up the donor (named just before); near
    //   tears ← the Japanese frame: a pause = emotion, sympathy for Michael
    // anchor: captions “through” 65.9 s, “delusion” 68.5 s (whisper 66.0 → 68.0): a 2.5 s gap; “with a sperm donor”
    //   (57 s) has already said who the father is
    { id: 'nt2', skill: 'humor', level: 'C2', point: 'delusion', reveals: ['father'], seg: [55.1, 69.6],
      stem: 'Why is the pause after “related to Michael through…” funny?',
      choices: ['It sets up a family tie, then delivers only his fantasy',
                'It hints that the donor might be Michael himself', 'It sounds like sympathy, as if holding back tears'], a: 0,
      cue: '間のあとの一語と、その前の父親の説明。',
      line: 'this baby will be *related to Michael through… delusion*.',
      said: '父親は提供者だと言ったあと「この子とマイケルのつながりは…妄想」と間をあけて言う。',
      mean: 'related through のあとには血縁が来るはず。間で期待させ、思いこみの一語で落とす。',
      trap: '間を迷いや同情と取りやすいが、父親はもう言われている。説明の途中の長い間は、落ちの前ぶれと疑う。',
      use: 'We’re related by… pizza, mostly.（僕らをつなぐのは…主にピザ）' },

    // R fix: S1 — the old stem ("what he does") echoed the new s2's key; reworded.
    // why: picks her up ← the usual "drive her there" script; calls the doctor ← "call" is said, in the wrong relation
    { id: 'd4', skill: 'detail', level: 'B1', point: 'plan', seg: [73.6, 77.5],
      stem: 'What is Michael’s plan for when the time comes?',
      choices: ['Jan calls, and he meets her at the hospital', 'He drives to Jan’s home to pick her up',
                'He calls the doctor and waits for news'], a: 0,
      cue: '「What do you do?」の答え、二つの動き。',
      line: 'I get *a call from Jan*, and I *meet her at the hospital*.',
      said: '「ジャンから電話が来て、病院で合流する」と答える。',
      mean: '出産のときの手順を、ドワイトに確かめられている。',
      trap: 'call が聞こえるので、自分が電話する側と取りやすい。from Jan なら、かけてくるのはジャン。',
      use: 'Call me, and I’ll meet you there.（電話くれたら現地で会おう）' },

    // R drop: s1 ("Highways ___ surface roads?"). V2 (blind 85 %: "or" was the only choice that made a question) and
    //   the key's own word differs (captions "are", whisper "or"). Never shipped; deleted.
    // R new: s2. Both sources have "what do you do" twice; Michael's answer "I get…" is present tense.
    // why: did ← "do you" shrinks to "dya", close to "didja"; would ← "wudja" sounds alike, and a drill question can
    //   be hypothetical
    { id: 's2', skill: 'sound', level: 'B2', point: 'whatdo', seg: [73.6, 77.5],
      stem: 'Fill the gap in the question, said twice: “___ do?”',
      choices: ['What do you', 'What did you', 'What would you'], a: 0,
      cue: '「Okay, okay」のあと、くり返される問いの頭。',
      line: '*What do you* do? What do you do?',
      said: '「どうする？」とくり返し、出産の時の手順を確かめる。',
      mean: 'What do you が「ワダヤ」と一続きになる。答えも現在形の I get。',
      trap: 'did you も「ディヂャ」と縮むので過去形に聞こえやすい。答えの動詞の形で、問いの時制を確かめる。',
      use: 'What do you do if it rains?（雨ならどうする？）' },

    // R fix: V2 (blind 60 %: the only choice that fit a rehearsal). Distractors now come from Dwight's own lines.
    // why: take the highway ← "highways" was offered just before, so the potholes read as a hint to switch; car needs
    //   fixing ← "your car breaks down" heard as a real warning about his car
    { id: 'i2', skill: 'infer', level: 'C1', point: 'potholes', seg: [77.4, 87.05],
      stem: 'When Gibson is said to be full of potholes, what does Michael’s answer miss?',
      choices: ['That the potholes are made up, to test him', 'That Dwight wants him to take the highway',
                'That his car needs fixing before the big day'], a: 0,
      cue: '「Adapt.」の一語と、最後の一文。',
      line: 'Your car breaks down. *Adapt.* … *adapting to the circumstances*.',
      said: 'ドワイトの「穴で車が壊れた。対応しろ」に、マイケルは「穴なんてない」と返す。',
      mean: '穴は対応力を試す作り話。マイケルは練習の設定を本物の道の話として受け取っている。',
      trap: '穴の話を本当の情報と取ると、道や車の忠告に聞こえる。Adapt が試しの合図。',
      use: 'Plans change. You have to adapt.（予定は変わるもの。合わせなきゃ）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'route', seg: [83.0, 85.5],
      stem: 'Type the reply: “I ___. There are no potholes.” (3 words)', answer: 'checked the route',
      cue: '「Adapt.」のすぐあと、最初の「I」に続く部分。',
      line: 'I *checked the route*. There are no potholes.',
      said: '「ルートは確認した。穴なんてない」と返す。',
      mean: 'checked の ed は t の音で、次の the とつながる。',
      trap: 'ed の t が the に飲まれて check に聞こえやすい。過去の話なら、ed は小さくても書く。',
      use: 'I checked the time. We’re fine.（時間は確認した。大丈夫）' },

    // R fix: V2 (blind 55 %: "secretly" + "fake the mark" matched) and a cue leak ("and", "no" only in the key).
    //   New distractors read "secretly" another way; the cue no longer quotes the answer.
    // why: wash off ← a secret mark heard as one hidden from staff; Jan angry ← "secretly" = behind Jan's back
    { id: 'd7', skill: 'detail', level: 'B2', point: 'mark', seg: [121.45, 132.35],
      stem: 'Why should the person with the Sharpie mark the baby secretly?',
      choices: ['So that a baby thief couldn’t copy it', 'So that the hospital staff wouldn’t wash it off',
                'So that Jan wouldn’t find out and get angry'], a: 0,
      cue: '「only you could recognize」に続く後半。',
      line: 'a mark that only you could recognize and *no baby snatcher could ever copy*.',
      said: '「自分にしか分からず、赤ちゃん泥棒にもまねできない印をこっそり付けろ」。',
      mean: 'snatcher ＝ ひったくる人。取り替えや連れ去りに備えた目印。',
      trap: 'secretly を「ジャンに内緒で」と取りやすい。理由は文の後半で、誰にまねさせないかを言う。',
      use: 'Mark your bag so no one takes it.（取られないよう、かばんに目印を）' },

    // R fix: V2 (blind 80 %: "real newborns" was the only sensible reason) and S1 ("practice" gave away g1). New
    //   distractors: a grip test (Dwight's "Adapt" style) and the Sharpie mark.
    // why: grip test ← the slip heard as one more of Dwight's tests; Sharpie ← the secret mark was just discussed (a
    //   keyword in the wrong relation)
    { id: 'd8', skill: 'detail', level: 'B1', point: 'butter', seg: [135.5, 141.35],
      stem: 'Why was the watermelon covered in butter?',
      choices: ['To make it as slippery as a real newborn', 'To make him drop it, as a test of his grip',
                'To keep the Sharpie mark from rubbing off'], a: 0,
      cue: '「What was on that?」への答えのあと。',
      line: 'Butter. *Newborns are slippery*.',
      said: '「何が付いてたんだ？」「バター。新生児はつるつるだから」。',
      mean: '本物らしさを出すための工夫だ、と説明している。',
      trap: '滑った直後なので、ドワイトの試しやいたずらに聞こえやすい。slippery は本物に似せた理由。',
      use: 'Careful, the floor is slippery.（気をつけて、床が滑るよ）' },

    // R fix: V2 (blind 55 %: "realistic detail" matched the butter). All three now judge "Dwight's idea".
    // why: dry joke ← "nice" after a mess read as irony; hiding annoyance ← the Japanese frame: polite praise as
    //   建前 over a real complaint
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'touch', seg: [135.5, 143.9],
      stem: 'After the butter is explained, how is the reply “Nice touch” meant?',
      choices: ['As sincere praise for Dwight’s idea', 'As a dry joke about Dwight’s idea',
                'As polite praise to hide his annoyance'], a: 0,
      cue: '直後に続く「Good.」と、次の一言。',
      line: '*Nice touch.* Good. Let’s try that again.',
      said: '「いい工夫だ。よし、もう一回やろう」と返す。',
      mean: '皮肉ではなく本気のほめ言葉。すぐに Good と言い、練習を続けようとしている。',
      trap: '失敗のあとの nice は皮肉にも聞こえる。皮肉なら続きは不満になる。直後の一言で判断する。',
      use: 'Fresh flowers? Nice touch.（生花？気がきいてるね）' },

    // R drop: f4 ("Nice touch" as a phrase). Same line and point as a1, blind 75 %; f1 still covers phrase. Never
    //   shipped; deleted.

    // R fix: V2 (blind 55 %: the sitcom script made "not there" the obvious twist). Distractors are now near misses
    //   on "to mark it" and "anybody's".
    // why: forgets to mark ← only "to mark it" caught, "wasn't there" missed; wrong baby ← "could be anybody's" heard
    //   as a mix-up at the hospital
    { id: 'g2', skill: 'gist', level: 'B2', point: 'outcome', seg: [160.4, 183.6],
      stem: 'How does Michael’s big plan turn out in the end?',
      choices: ['The baby is born while he is away', 'He is there but forgets to mark the baby',
                'He marks a baby, but it is the wrong one'], a: 0,
      cue: '最後のカメラへの一言、前半。',
      line: 'Jan had the baby, and *Michael wasn’t there* to mark it.',
      said: 'ジャンが赤ちゃんを連れて来る。「マイケルはその場にいなかった」と語られる。',
      mean: 'あれほど練習したのに、本番には立ち会えなかった、という結末。',
      trap: 'to mark it だけ残ると、付け忘れの話に聞こえる。wasn’t の not を聞き落とさない。',
      use: 'All that practice, and I missed it.（あれだけ練習したのに、見逃した）' },

    // why: suspicious ← "What do we have here?" is also the police or teacher line for catching someone; name ← a
    //   question to a new parent is often about the name
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'have', reveals: ['outcome'], seg: [160.45, 167.5],
      stem: 'When Jan comes in, what does Jim’s question do?',
      choices: ['Invites her to show off the new baby', 'Asks, half-suspicious, why she is here',
                'Asks politely for the baby’s name'], a: 0,
      cue: '質問のすぐあとの、ジャンの答え方。',
      line: '*What do we have here?* — This is my baby.',
      said: 'ジムが「おや、これは？」と声をかけ、ジャンが「私の赤ちゃん」と紹介する。',
      mean: 'What do we have here? は、見せたい物を紹介させる軽い問いかけ。',
      trap: '警官の決まり文句にもあり、とがめる質問に聞こえやすい。答えが紹介かどうかで判断。',
      use: 'What do we have here? A birthday cake?（おや、これは？誕生日ケーキ？）' },

    // R fix: V2 (blind 50 %). The filler "anyone can help raise it" is now an access misreading of "except Michael's".
    // why: wrong baby ← "could be anybody's" taken as the real worry (the setup without the punch); kept away ←
    //   "except Michael" heard as Michael being shut out, not as whose baby it is
    { id: 'h3', skill: 'humor', level: 'C1', point: 'anybody', reveals: ['outcome', 'father'], seg: [176.1, 183.6],
      stem: 'What makes the final comment to the camera funny?',
      choices: ['The mark never mattered; it was never his baby', 'Without a mark, Michael may take home the wrong baby',
                'Now Jan won’t let Michael near the baby at all'], a: 0,
      cue: '前半のあと、少し間をあけて足す一言。',
      line: 'So the baby could be *anybody’s… except Michael’s*.',
      said: '「印がないから、赤ちゃんは誰の子でもありうる。マイケルの子以外はね」と言う。',
      mean: 'もともと自分の子ではないので、印の作戦は意味がなかった。最後の一言でそれを突く。',
      trap: '前半だけだと、取り違えの心配に聞こえる。except のあとに本当の落ちが来る。',
      use: 'Pick any seat, except that one.（どこでもどうぞ、そこ以外なら）' },
  ]
};
