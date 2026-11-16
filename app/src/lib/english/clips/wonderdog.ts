// REVIEW 2026-11-16: pass 3, fix 16, drop 0, new 0; ear checks 0
//   Open: none. Blind pass ran on stems + choices only (header unread); 16 of 18 choice items were ≥ 50 % and right.
// “Parks and Recreation | Chris Loves Champion (Episode Highlight)” (the official Parks and Recreation channel,
// Season 4): Chris hands Champion, April and Andy's three-legged dog, back after minding him for a night, raves about
// him, explains his dog-only German to camera, and ends on a gentle hint about how Andy lives.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈60 s. Untested: 0–4 s (“Hey, bud, I
// missed you” vs “hey but I'm with you”), 6.8 s (“Not in the slightest” vs “out of the slightest”), 9–12 s (the German
// line, “Er ist ein Wunderhund” vs “and is I know”), 28–31 s (“Ich bin ein three-legged dog”: who says it), 39–43 s
// (“did his leg go back?” vs “which is like go back?”), 49.6 s (“sit on” vs “sew in”) and the speaker of “Right?”.
// EAR CHECK: none (every key rests on words both sources agree on; no item names who says “Who wouldn't?”)
import type { Clip } from '../types.ts';

export const wonderDog: Clip = {
  id: 'wonderdog', video: 'iQwDaX5apvM', title: 'Parks and Recreation | Chris Loves Champion (Episode Highlight)',
  dur: 72, wpm: 148, band: 'slow', tags: ['友だち', 'お願い・断り'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 75 %): "class" and "adopted" were fillers next to a plain handover. All three are now handovers
    //   with a different reason.
    // why: found ← "Hey, bud, I missed you" and "Thank you so much" fit a lost dog brought home; training ← "the dog
    //   training course I took" is said, and "took" can be heard as taking the dog
    { id: 'g1', skill: 'gist', level: 'B1', point: 'handover', seg: [0, 24.6],
      stem: 'What is going on between Chris and the dog’s owner?',
      choices: ['Chris is bringing back a dog he minded for them', 'Chris is bringing back a dog he found wandering',
                'Chris is bringing back a dog he took to training'], a: 0,
      cue: '「Thank you so much」と、カメラへの説明の後半。',
      said: '飼い主のお礼に、クリスはドイツ語まで使ってほめ、カメラには二人の外出中に預かっていたと話す。',
      mean: '旅行中の友だちの犬を預かり、返しに来た場面。お礼と、預かった理由が答え。',
      trap: '訓練コースの話が出るので「教室帰り」に思えるが、それは本人の昔の話。',
      use: 'Thanks for watching my dog.（犬を見ててくれてありがとう）' },

    // R fix: V2 (blind 50 %): the key was the one stock phrase. Now three everyday owner worries; only "handful" settles it.
    // why: ate properly ← handful = 一握り, a handful of food; missed us ← "I missed you" comes just before
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'handful', reveals: ['wasnt'], seg: [0, 7.65],
      stem: 'Right after “Thank you so much”, what does the owner hope?',
      choices: ['That the dog behaved himself', 'That the dog ate his food properly',
                'That the dog didn’t miss them much'], a: 0,
      cue: '「I hope」のあと、最後の一語のたとえ。',
      line: 'Thank you so much. I hope he *wasn’t a handful*.',
      said: 'お礼を言ってから「この子、手がかからなかったならいいけど」と言う。',
      mean: 'a handful ＝ 手に負えない人や動物。預けた側の決まり文句で、気づかいの一言。',
      trap: 'handful を「一握り」と取ると食べ物の量に聞こえる。人や犬なら「手がかかる」。',
      use: 'My kids can be a handful.（うちの子たち、手がかかるんだ）' },

    // R fix: V2 + K3 (blind 55 %): "was" makes no sense with "I hope", so grammar alone left two choices. Cut; trap rewritten.
    // why: isn't ← the dog is right there, so the present fits, and izn/wazn differ only in the first sound; won't be ←
    //   "hope" often looks ahead
    { id: 's1', skill: 'sound', level: 'B2', point: 'wasnt', reveals: ['handful'], seg: [1.2, 7.65],
      stem: 'Fill the gap: “I hope he ___ a handful.”',
      choices: ['wasn’t', 'isn’t', 'won’t be'], a: 0,
      cue: 'he のすぐあと、短い一語の終わりの音。',
      line: 'I hope he *wasn’t* a handful.',
      said: '「手がかからなかったならいいけど」。預けていた間のことを聞いている。',
      mean: 'wasn’t a が「ワズンタ」のようにつながり、t はほぼ消えて「ン」が残る。',
      trap: 'isn’t だと「今」の話になる。he のあとの w の音と時制を聞く。',
      use: 'I hope it wasn’t too much trouble.（ご迷惑でなかったらいいのですが）' },

    // R fix: V2 (blind 60 %): the key was the only hedged choice ("the little… he has"). Now three parallel sources for
    //   the line, and the stem no longer says "how should we hear".
    // why: fluent ← "fluent" taken at face value; a proverb ← "As the Germans would say" heard as a proverb
    //   introduction
    // anchor: 13.5–20.1 s "now I'm fluent in German — words relating to dogs": his German is dog words only, so the
    //   earlier "As the Germans would say… He is a wonder dog" uses the little he has
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'fluent', reveals: ['german'], seg: [6.4, 21.2],
      stem: 'Given what Chris later says about his German, what is his German line?',
      choices: ['A bit of the narrow German his course taught him', 'A bit of the fluent German his course taught him',
                'A bit of a proverb Germans use about loyal dogs'], a: 0,
      cue: 'ドイツ語の一言と、あとの説明を比べて。',
      line: 'As the Germans would say… He is a wonder dog. … now I’m fluent in German — *words relating to dogs*.',
      said: '「ドイツ人風に言えば、すばらしい犬」と言い、あとで「ドイツ語はぺらぺら、犬の言葉なら」と明かす。',
      mean: 'あとの説明が前の一言を書きかえる。ことわざに聞こえた一言は、知っている数少ない犬のドイツ語。',
      trap: 'ことわざの前置きにも、fluent の自慢にも聞こえる。あとの付け足しで答え合わせをする。',
      use: 'As the French would say, voilà!（フランス人風に言えば、ほらね）' },

    // R fix: V2 (blind 65 %): the key was the only one with the clip's "entirely", and "language class" was weak.
    //   Parallel "Its lessons…" choices now.
    // why: in Germany ← German/Germany sound alike; German breeds ← "German" next to "dog training" (German shepherds)
    { id: 'd1', skill: 'detail', level: 'B1', point: 'german', seg: [13.45, 17.5],
      stem: 'What was unusual about the dog training course Chris took?',
      choices: ['Its lessons were all in German', 'Its lessons were held in Germany',
                'Its lessons were for German breeds'], a: 0,
      cue: '「course I took」のあとの説明。',
      line: 'The dog training course I took was *conducted entirely in German*',
      said: '「僕が受けた犬の訓練コースは、全部ドイツ語で行われた」と話す。',
      mean: 'conducted ＝ 行われた。場所や語学の授業ではなく、使われた言葉の話。',
      trap: 'German から「ドイツで」と取りやすい。in German は「ドイツ語で」。',
      use: 'The tour was conducted in English.（ツアーは英語で行われた）' },

    // why: talks to dogs ← "words relating to dogs" heard as who he speaks to; trip ← "fluent" suggests real study
    { id: 'h1', skill: 'humor', level: 'C1', point: 'fluent', seg: [13.45, 21.2],
      stem: 'Why does Chris’s claim to be fluent in German get a laugh?',
      choices: ['His German covers only words about dogs', 'He uses his German only to talk to dogs',
                'He learned his German for a trip abroad'], a: 0,
      cue: '「fluent in German」の直後の、短い付け足し。',
      line: 'now I’m *fluent in German* — *words relating to dogs*.',
      said: '「今ではドイツ語がぺらぺら…犬に関する言葉なら」と付け足す。',
      mean: 'fluent と大きく言ってから、範囲を犬の単語だけに絞る。期待を落とす付け足しが笑い。',
      trap: 'relating to は「〜に関する」。犬と話すという意味ではない。付け足しで話が縮む。',
      use: 'I’m fluent in Spanish — restaurant Spanish.（スペイン語ぺらぺら。レストラン限定）' },

    // why: weekend/week ← the usual length of a getaway; only "for the night" is said
    { id: 'n1', skill: 'number', level: 'B1', point: 'night', seg: [19.35, 23.65],
      stem: 'How long were April and Andy away?',
      choices: ['One night', 'A weekend', 'A week'], a: 0, keep: true,
      cue: '「went away」のあと。',
      line: 'April and Andy *went away for the night*',
      said: '「エイプリルとアンディが一晩出かけていたので」と説明する。',
      mean: 'for the night ＝ その晩だけ、一泊。旅行より短い外出。',
      trap: '出かけたと聞くと週末旅行を思い浮かべやすい。night は一晩だけ。',
      use: 'We’re just staying for the night.（一泊だけです）' },

    // R fix: V2 (blind 70 %) + N7: the stem's "the night" and the choice "overnight" gave n1's key, and the
    //   distractors were weak. The new choices are three things a sitter's report could cover.
    // why: behaved ← "I hope he wasn't a handful" invites a report on behaviour; will need ← the advice to Andy at the
    //   end sounds like care instructions
    { id: 'g2', skill: 'gist', level: 'B2', point: 'care', seg: [19.35, 40.6],
      stem: 'What does most of Chris’s report to the owners cover?',
      choices: ['What he did for the dog while they were out', 'How the dog behaved while they were out',
                'What the dog will need once he is home'], a: 0,
      cue: 'ほめ言葉と、店でしたことの報告の量。',
      said: 'ほめ言葉を重ねてから、店に連れて行き、あれこれ世話をした話を詳しく報告する。',
      mean: '預かった一晩でどれだけ大事にしたかを、一つずつ並べて伝えている。全体の流れが答え。',
      trap: '「いい子だった？」の報告を予想しやすいが、中身は自分がした世話。',
      use: 'He had the best time with us.（うちで最高に楽しんでたよ）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'lookedafter', seg: [21.2, 24.6],
      stem: 'Type what Chris says: “and I ___ Champion here.” (2 words)', answer: 'looked after',
      // R fix: N7: the cue quoted "for the night", n1's key.
      cue: '「and I」のあとの2語。音がつながる。',
      line: 'and I *looked after* Champion here.',
      said: '「それで僕がチャンピオンを預かった」。',
      mean: 'looked after ＝ 世話をした。looked の d と after がつながり「ルッカフター」に近い。',
      trap: 'd が after とつながって消えやすい。look at と取ると意味が変わる。',
      use: 'Could you look after my bag?（荷物を見ててもらえますか）' },

    // R fix: V2 (blind 55 %): "not two breeds" in the key spelled out the contrast. Three parallel "He���" descriptions.
    // why: takes it back ← "mutt" can sound rude (雑種), so the praise sounds like a quick fix; wrong breeds ← "half…
    //   half" is the usual way to name two breeds
    { id: 'h2', skill: 'humor', level: 'C1', point: 'mutt', seg: [22.35, 27.95],
      stem: 'After calling Champion a mutt, what makes Chris’s description funny?',
      choices: ['He fills in the two halves with praise, not breeds', 'He calls the dog a mutt, then takes it back quickly',
                'He names two breeds that the dog clearly isn’t'], a: 0,
      cue: '「half」が2回。そのあとに来る語の種類。',
      line: 'He’s a mutt — *half amazing, half terrific*.',
      said: '「この子は雑種だ。半分すごくて、半分すばらしい」と言う。',
      mean: '雑種なら「半分〇〇犬」と犬種が来るはずが、ほめ言葉が2つ。型をずらした笑い。',
      trap: 'mutt は悪口にも聞こえるが、本人はうれしそう。half のあとに何が来るかを聞く。',
      use: 'It’s half work, half vacation.（半分仕事で、半分休暇）' },

    // R fix: V2 (blind 50 %): the key shared "shots" with one distractor, so it was a coin toss. Three separate pairs now.
    // why: collar and chip / bed and training ← what a sitter would plausibly do at a pet store; the fast "got him…"
    //   run invites filling in from one caught word
    { id: 'd2', skill: 'detail', level: 'B1', point: 'petsmart', seg: [31.25, 40.6],
      stem: 'Besides toys and exercise, what does Chris say he did for Champion?',
      choices: ['Got him his shots and had him groomed', 'Got him a collar and had him chipped',
                'Got him a bed and had him trained'], a: 0,
      cue: '「various toys」のあとに続く、got him の並び。',
      line: 'got him *shots*, got him *groomed*, and gave him plenty of exercise.',
      said: '店でおもちゃを買い、予防注射、トリミング、運動まで済ませた。',
      mean: 'shots ＝ 予防注射、groomed ＝ 毛を整えた。get him ＋過去分詞で「〜してもらう」。',
      trap: 'got him の並びが速く、拾えた一語から想像で補いやすい。一つずつ聞く。',
      use: 'I need to get my hair cut.（髪を切ってもらわなきゃ）' },

    // why: other dogs ← "healthier than" heard as a comparison with others; from now on ← "ever" heard as forever
    { id: 'i1', skill: 'infer', level: 'B2', point: 'healthier', seg: [32.45, 40.6],
      stem: 'What does Chris’s last line about Champion’s health suggest?',
      choices: ['He’s in better shape now than with his owners', 'He’s healthier than other dogs his age now',
                'He’ll stay this healthy for the rest of his life'], a: 0,
      // R fix: N7: the cue and notes said 一晩, n1's key.
      cue: '世話の報告の、締めくくりの比較。',
      line: 'He’s *healthier than ever*.',
      said: '預かった間の世話をひと通り報告して「今までで一番健康だ」と締める。',
      mean: 'than ever ＝ これまでのどの時より。飼い主の家にいた時より、と遠回しに言っている。',
      trap: '他の犬との比較や「永遠に」と取りやすい。比べる相手は過去の本人。',
      use: 'I feel better than ever.（今までで一番調子がいい）' },

    // R fix: V2 (blind 65 %): "say bye" was weak and "advice" stood out. Three requests, two about the dog.
    // why: see again / mind again ← "may" read as plain permission (〜してもいい？) plus how much he loves the dog
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'ifimay', seg: [42.3, 48.25],
      stem: 'When Chris stops Andy with his name, what is he doing?',
      choices: ['Asking to share a thought before they go', 'Asking to see Champion again sometime',
                'Asking to mind Champion again some time'], a: 0,
      cue: '名前の呼びかけと、短い返事のあと何が始まるか。',
      line: 'Andy, *if I may* — Yes? — Dogs tend to take on…',
      said: '「アンディ、ちょっといいかな」と切り出し、犬と飼い主の話を始める。',
      mean: 'if I may ＝ 言わせてもらえるなら。頼まれていない助言や意見の前置き。',
      trap: 'may を許可と取ると、また預かる話や会う約束に聞こえる。後ろに続くのは意見。',
      use: 'If I may, one small suggestion.（よければ、一つだけ提案を）' },

    // R fix: V2 (blind 60 %): the key was the only kind, nuanced choice. All three now name a manner and a mechanism.
    // why: doubtful ← "tend to" and "if you were to" read as real doubt (the Japanese frame: 〜かもしれない = 自信がない);
    //   playful ← the silly picture (cartoons, Cheetos) heard as a joke with no point
    { id: 'a3', skill: 'attitude', level: 'B2', point: 'tact', reveals: ['hint'], seg: [42.3, 53.85],
      stem: 'How does Chris come across as he raises his last topic with Andy?',
      choices: ['Indirect: he hides a criticism in a general rule', 'Doubtful: he isn’t sure the dog rule is true',
                'Playful: he’s teasing Andy just for a laugh'], a: 0,
      cue: '名前の呼びかけの前置きと、「もし」の形。',
      line: 'Andy, *if I may* — … so *if you were to* sit on your couch all day…',
      said: '「ちょっといいかな」と断ってから、一般論と「もし〜なら」の形で話す。',
      mean: '前置き、一般論、仮定の三つで、相手を直接責めずに言いにくいことを伝えている。',
      trap: 'tend to や if を自信のなさと取りやすいが、ここは角を立てないための形。',
      use: 'Just a thought, if you don’t mind…（よければ、ちょっと思ったんだけど）' },

    // R fix: V2 (blind 70 %): the key was the familiar saying. The other familiar saying (they look alike) is now a choice.
    // why: stand up to ← take on = 立ち向かう (take on a challenge); looking like ← the better-known saying, which
    //   "personalities" rules out
    { id: 'ph2', skill: 'phrase', level: 'B2', point: 'takeon', seg: [44.55, 48.85],
      stem: 'In Chris’s point about dogs and their owners, what do dogs tend to do?',
      choices: ['Start acting like their owners', 'Start standing up to their owners', 'Start looking like their owners'], a: 0,
      cue: '「tend to」のあとの動詞のかたまり。',
      line: 'Dogs tend to *take on the personalities* of their owners',
      said: '「犬は飼い主の性格に似てくるものだ」と言う。',
      mean: 'take on ＝ （性質などを）帯びる、身につける。ここでは「似てくる」。',
      trap: 'take on には「立ち向かう」もあるが、後ろが personalities なら「身につける」。',
      use: 'The town takes on a festive mood.（町がお祭りの雰囲気になる）' },

    // R fix: V2 (blind 60 %): "more time together" was weak. It's replaced by the same idea in reverse.
    // why: already lazy ← "tend to take on" heard as a fact about Champion now; dog's energy on Andy ← right idea, wrong
    //   direction (who copies whom)
    { id: 'i2', skill: 'infer', level: 'C1', point: 'hint', reveals: ['couch', 'takeon'], seg: [44.55, 53.85],
      stem: 'With his couch example, what is Chris really suggesting to Andy?',
      choices: ['Andy’s habits could rub off on the dog', 'The dog has already picked up Andy’s habits',
                'The dog’s energy could rub off on Andy'], a: 0,
      cue: '「if you were to」の仮定と、would の形。',
      line: 'Dogs tend to take on the personalities of their owners, so *if you were to* sit on your couch all day…',
      said: '犬は飼い主に似るから、一日中ソファでお菓子なら犬もそうしたがる、と話す。',
      mean: 'if you were to ＝ 仮に〜なら。「その生活は犬に良くない」という遠回しな忠告。',
      trap: 'もう似ている話ではない。were to と would は「もし」のしるし。',
      use: 'If you were to ask me, I’d wait.（もし聞かれたら、待つと答えるかな）' },

    // R fix: V2 (blind 70 %): "More couch time for us both!" was a joke nobody would pick. Now "he'll be just like me"
    //   (the point taken as a compliment, not advice), with parallel "Got it. …, then." choices.
    // why: like me ← the line taken as a compliment (Andy's own reading); Cheetos away ← the advice heard as about
    //   the dog's diet, not Andy's life
    // anchor: 45.2–53.7 s "Dogs tend to take on the personalities of their owners… that's what he would want to do,
    //   too": the habit to change is the owner's
    { id: 'nt2', skill: 'pragma', level: 'C2', point: 'hint', reveals: ['couch', 'takeon'], seg: [44.55, 57.45],
      stem: 'Which reply from Andy would show he got Chris’s point?',
      choices: ['Got it. Less couch for me, then.', 'Got it. He’ll be just like me, then.',
                'Got it. No more Cheetos for him, then.'], a: 0,
      cue: '誰の習慣が、誰に移ると言っているか。',
      line: 'Dogs tend to *take on the personalities of their owners*… that’s what he would want to do, too.',
      said: '犬は飼い主に似るから、一日中ソファでお菓子なら犬もそうしたがる、と言う。',
      mean: '変えるべきは飼い主の生活、という遠回しな忠告。分かったなら、自分の習慣の話で返すのが自然。',
      trap: '犬の食べ物の話と取ると、犬からお菓子を遠ざける返事を選びやすい。忠告は誰の行動に向いているかを聞く。',
      use: 'Point taken. I’ll cut back.（ごもっとも。控えるよ）' },

    // why: sports and chips / games and pizza ← the usual couch-potato picture; only cartoons and Cheetos are said
    { id: 'd3', skill: 'detail', level: 'B1', point: 'couch', seg: [48.25, 53.85],
      stem: 'In Chris’s couch example, what is Andy doing all day?',
      choices: ['Watching cartoons and eating Cheetos', 'Watching sports and eating chips',
                'Playing games and eating pizza'], a: 0,
      cue: '「all day」のあとの2つの動作。',
      line: 'sit on your couch all day *watching cartoons and eating nothing but Cheetos*',
      said: '「一日中ソファでアニメを見て、チートスばかり食べていたら」とたとえる。',
      mean: 'nothing but ＝ 〜ばかり。テレビとお菓子だけの一日、という例。',
      trap: 'よくある「ソファでだらだら」の絵で選びやすい。言われた番組と食べ物を聞く。',
      use: 'I ate nothing but rice this week.（今週はご飯ばかり食べた）' },

    // R fix: V2 (blind 50 %): the key echoed "amazing day", and the others were loosely worded. Parallel now.
    // why: joking admission ← "Who wouldn't?" read as a playful "guilty"; pushing back ← a short question after advice
    //   heard as an objection (the Japanese frame: 反論)
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'whowouldnt', seg: [48.25, 57.45],
      stem: 'How is the reply to Chris’s couch example meant?',
      choices: ['Sincerely: he’d love a day like that', 'Jokingly: he’s owning up to the habit',
                'Crossly: he’s pushing back on the advice'], a: 0,
      cue: '短い問い返しのあとの、一日の感想。',
      line: '*Who wouldn’t?* That sounds like an *amazing day*.',
      said: '「そりゃそうしたいでしょ。最高の一日じゃない」と返す。',
      mean: 'Who wouldn’t? ＝ 誰だってそうでしょ。忠告を、すてきな提案として受け取っている。',
      trap: '短い問い返しは反論にも聞こえるが、続く amazing day が本気のしるし。',
      use: 'Free pizza? Who wouldn’t want that?（ピザ無料？誰だって欲しいよ）' },
  ]
};
