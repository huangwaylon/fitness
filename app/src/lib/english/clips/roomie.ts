// REVIEW 2026-11-16: pass 4, fix 19, drop 1, new 0; ear checks 1
// OPEN: h3 takes "And I never clean up" as April's turn (whisper marks a speaker change); if one voice says both
//   lines, h3's key needs rewording.
// “You Want My Gum? | Parks and Recreation” (the official Parks and Recreation channel, Season 3): Ben, sick of seven
// months in a motel, asks Tom about a roommate and moves in with Andy and April, whose joke rules, mess and dish-free
// breakfasts make him want out, until he decides to clean the place up and teach them to be adults.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈185 s. Whisper's timings drift after
// ≈81 s (its second pass repeats 85–98 s), so every segment past 80 s uses the captions' word times only.
// Untested: 43–48 s (the Spanish "usted" rule), 51.4 s ("She's joking" vs whisper "He's joking"), 57.9 s ("sad" vs
// "side" movie), 62.5 s ("noise a lot" vs "noise loud"), 67.6–70 s ("it's"/"She is lying again", "because it's hard to
// tell"), 83–86 s (who offers the gum, and why: the title line rests on what's seen), 102.8 s (who asks to throw
// "that" away), and 125–130 s, 140 s, 187.6 s ("fork"/"pork": unclear in both sources).
// EAR CHECK: 180.9–185.4 s a4 — the replies: whisper "Cool. We'll get to be adults. — Gee golly. Thanks, mister.",
//   captions "cool we're good to be adults … drink golly thanks mister"; the key takes "Cool…" as keen (not sarcastic)
//   and "Gee golly…" as mocking (who says which no longer matters)
import type { Clip } from '../types.ts';

export const roomie: Clip = {
  id: 'roomie', video: 'VAPcpAwKtFc', title: 'You Want My Gum?', dur: 209, wpm: 152, band: 'slow',
  tags: ['家', '友だち'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 55 %: "himself" made the key the only self-referring choice) and seg 14.9 s, under the gist
    //   15 s floor; now parallel "needs somewhere to live" twice, seg end 15.0 (before "I've")
    // why: spare room ← "looking for a roommate" is what someone with a room to fill says; a woman ← Tom's own "the
    //   woman that's looking" heard as a fact
    { id: 'g1', skill: 'gist', level: 'B1', point: 'need', seg: [0, 15.0],
      stem: 'Why does Ben ask Tom about a roommate?',
      choices: ['He’s the one who needs somewhere to live', 'He has a spare room he wants to rent out',
                'A woman he knows needs somewhere to live'],
      a: 0,
      cue: '「looking」が2回。2回目は誰のこと？',
      line: '…it’s *me*, *I’m looking*.',
      said: '「ルームメイトを探してる人いない？」と聞き、探しているのは自分だと言う。',
      mean: 'looking for a roommate は探す側にも貸す側にも使う。ここは自分の住む所。',
      trap: 'roommate で「部屋を貸す」と取りやすい。最後の me まで聞く。',
      use: 'I’m looking for a place to stay.（泊まる所を探しています）' },

    // R fix: V2 (blind 85 %): the quoted "How hot?" plus a room-temperature filler gave the key away. The stem no
    //   longer quotes it, and all three choices are about the person looking
    // why: in a hurry ← "hot" as urgent (a hot issue), a real sense of the word; Ben's friend ← Ben's "anyone" heard as
    //   someone he knows, so Tom asks after a friend
    { id: 'i1', skill: 'infer', level: 'B2', point: 'hot', seg: [2.2, 11.25],
      stem: 'From Tom’s first reply, what has he assumed?',
      choices: ['That the one looking is a woman', 'That the one looking is in a hurry', 'That the one looking is Ben’s friend'], a: 0,
      cue: '次の Tom の長い質問で、hot が何のことか分かる。',
      line: 'How *hot* is the *woman* that’s looking for a place to stay?',
      said: '「どのくらいホット？」と聞き、「部屋を探してる女性はどのくらい美人？」と言い直す。',
      mean: '人について hot と言うと「魅力的な」。探しているのは女性だと決めている。',
      trap: 'hot ＝ 急ぎ、と取りやすい。何の hot かは次の woman で分かる。',
      use: 'Wait, who are we talking about?（待って、誰の話？）' },

    // R fix: V2 (blind 60 %) and S4: the cue points at Ben's first question ("anyone", 3.2 s), which the old seg
    //   (from 9.0 s) left out. Seg start 9.0 → 2.2; parallel "He blames Ben for…" choices
    // why: keeping a woman ← "let me believe… a beautiful woman" heard as a real woman Ben hid; lying as a joke ← "you
    //   shouldn't have let me believe" heard as Ben pranking him
    { id: 'h1', skill: 'humor', level: 'C1', point: 'fair', reveals: ['hot'], seg: [2.2, 14.9],
      stem: 'Why does the audience laugh when Tom says it’s “not fair”?',
      choices: ['He blames Ben for a mistake Tom made himself', 'He blames Ben for keeping a woman to himself',
                'He blames Ben for lying to him as a joke'], a: 0,
      cue: 'Ben の最初の質問に、女性の話は出ていたか。',
      line: 'that’s *not fair*. You shouldn’t have *let me believe*… — *I didn’t*.',
      said: '「美人だと思わせるなんてずるい」と言い、Ben は「思わせてない」と返す。',
      mean: '女性だと決めたのは Tom 自身。自分の早とちりを人のせいにするのが笑い。',
      trap: 'let me believe を「だまされた」と取りやすい。最初の質問は anyone。',
      use: 'Hey, I never said that.（ちょっと、そんなこと言ってないよ）' },

    // keep: ascending. why: days/weeks ← "seven" caught and the unit lost; eleven ← seven/eleven both end in "-ven"
    { id: 'n1', skill: 'number', level: 'B1', point: 'months', reveals: ['need'], seg: [14.6, 19.8], keep: true,
      stem: 'How long has Ben been living at the motel?',
      choices: ['Seven days', 'Seven weeks', 'Seven months', 'Eleven months'], a: 2,
      cue: '「motel」のすぐあと、for のうしろ。',
      line: 'I’ve been staying at the… motel *for seven months*.',
      said: '「ポーニーのスーパー・スイーツ・モーテルに、もう7か月泊まってる」と言う。',
      mean: '7か月もモーテル暮らしが続いている。だから部屋を探している、という事情の説明になる。',
      trap: 'seven だけ聞いて、うしろの単位を落としやすい。数字のあとの名詞まで聞く。',
      use: 'I’ve been staying here for a week.（ここに1週間泊まっています）' },

    // R fix: V2 (blind 70 %): "really" in the stem and "as a joke" in the key; now three "stance: reason" choices
    // why: fond ← "charming", "wonderfully", "delightfully" taken at face value, and the bugs heard as the one new
    //   problem; torn ← the Japanese frame: polite praise first, then the complaint, both meant
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'motel', reveals: ['need'], seg: [19.4, 28.9],
      stem: 'As Ben describes the motel, how does he feel about it?',
      choices: ['Fed up: the nice words are all sarcastic', 'Fond: the bugs are his only real complaint',
                'Torn: he means the praise but wants out'], a: 0,
      cue: 'ほめ言葉のうしろに付く名詞（何がすてき？）。',
      line: 'a *charming* little inn with *wonderfully random* wake-up calls, *delightfully unstable* temperatures…',
      said: '「すてきな宿だよ。モーニングコールは見事にでたらめ、室温は楽しく不安定」と並べる。',
      mean: 'ほめ言葉と欠点を組み合わせた皮肉。本当はうんざりしていて、出たい。',
      trap: 'charming などの語だけで「好き」と取りやすい。ほめ言葉が何を飾っているかを聞く。',
      use: 'Lovely weather, if you like rain.（いい天気だね、雨が好きならね）' },

    // why: gone ← "as of" heard as an end point (〜をもって終了); from the start ← seven months and a long list make every
    //   fault sound old
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'bugs', seg: [23.95, 28.9],
      stem: 'What does Ben say about the bed bugs at the motel?',
      choices: ['They showed up just yesterday', 'They were gone as of yesterday', 'They’ve been there from the start'],
      a: 0,
      cue: 'リストの最後、and のあとの短い前置き。',
      line: 'and, *as of yesterday*, bed bugs.',
      said: '欠点リストの最後に「そして昨日からはトコジラミ」と付け足す。',
      mean: 'as of ～ ＝「〜の時点で、〜から」。昨日から新しく加わった、という意味。',
      trap: 'as of を「〜で終わり」と取ると逆になる。as of today（今日付けで）の形で覚えておく。',
      use: 'As of today, I’m on vacation.（今日から休暇です）' },

    // R fix: V2 (blind 55 %): "rated well, though nobody admits it" was a non-reading; now the sincerity flip
    // why: no reviews yet ← "says nobody" taken literally (誰も言っていない＝まだ評価がない); honest four stars ← "four
    //   stars" heard as Tom's real rating of a "charming little inn", the "says nobody" lost
    { id: 'p2', skill: 'phrase', level: 'C1', point: 'stars', reveals: ['motel'], seg: [26.0, 31.9],
      stem: 'What does Tom mean with his short review right after the motel list?',
      choices: ['No one would ever rate it that highly', 'Nobody has bothered to review it yet',
                'He would honestly give it four stars'], a: 0,
      cue: '星の数のあと、誰がそう言っている？',
      line: '*Four stars*, *says nobody*.',
      said: 'レビュー風に「星4つ、と言う人は誰もいない」と返す。',
      mean: '〜, says nobody ＝「誰もそう言わない」という皮肉の型。Ben の皮肉に乗っている。',
      trap: 'nobody を「まだ評価がない」と取りやすい。最後の says nobody が打ち消す。',
      use: '“Best coffee in town,” said no one ever.（「町一番のコーヒー」…なんて誰も言わない）' },

    // R fix: V2 (blind 55 %), the cue leaked "moved" (key only), and S4: seg start 33.4 cut into "perfect" (33.44),
    //   end 37.65 left < 0.5 s after "rent". Seg → [32.0, 39.1]; choices rebuilt on "rich girlfriend" and "rent"
    // why: girlfriend stopped paying ← "rich girlfriend" + "help with the rent" heard as her money drying up; landlord ←
    //   "help with the rent" heard as a rent increase
    { id: 'd2', skill: 'detail', level: 'B1', point: 'rent', seg: [32.0, 39.1],
      stem: 'Why do Andy and April need a roommate right now?',
      choices: ['A friend moved out to live with his girlfriend', 'A friend’s rich girlfriend stopped paying rent',
                'Their landlord just put the rent up'], a: 0,
      cue: 'Burly の名前のあと、誰とどうしたか。',
      line: 'Burly just *moved in with his rich girlfriend*, and we *need help with the rent*.',
      said: '「バーリーが金持ちの彼女と住み始めたから、家賃を手伝って」と言う。',
      mean: 'ルームメイトが出て家賃が苦しい。だから Ben が来るのは好都合。',
      trap: 'rich と rent で「彼女のお金」の話に聞こえやすい。moved in with ＝ 〜と住み始める。',
      use: 'My roommate just moved out.（ルームメイトが出ていったばかりで）' },

    // R fix: V2 (blind 55 %): parallel "He seems to…" choices; seg start 48.0 cut "usted" (≈47.8–48.4), now 46.5
    // why: hinting ← "free electricity" right after "need help with the rent" sounds like a money hint; teasing ← it's a
    //   correction of her rule, so it sounds like a jab at her
    { id: 'h2', skill: 'humor', level: 'C1', point: 'free', reveals: ['rules'], seg: [46.5, 56.15],
      stem: 'When Andy corrects the electricity rule, why do people laugh?',
      choices: ['He seems to think power costs them nothing', 'He seems to hint that Ben should pay for power',
                'He seems to tease April by breaking her rule'], a: 0,
      cue: '最後に付け足す、とても短い一文。',
      line: 'You can use as much *free electricity* as you want. *It’s free.*',
      said: '「夜6時以降は電気禁止」を打ち消し、「電気は好きなだけ使って。タダだから」と言う。',
      mean: '電気代はかかるのに、本気でタダだと思っている。二人の幼さが笑い。',
      trap: 'free を「自由に」とだけ聞くと笑いを逃す。It’s free. の念押しが勘違い。',
      use: 'Is this free, or do I pay?（これは無料ですか、有料ですか）' },

    // R fix: S4 seg 15.7 s (over 15) → [62.0, 76.95]; K8: a scale, so keep: true in ascending order; V2 (blind 65 %)
    //   "Very" now grants the rules are odd
    // keep: ascending. why: very ← her flat, list-like delivery and "house rules, though" sound like real terms;
    //   partly ← only the first correction ("free electricity") heard, the "again" missed
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'rules', seg: [62.0, 76.95], keep: true,
      stem: 'How serious is April about her house rules?',
      choices: ['Not at all: she’s making them up to tease Ben', 'Partly: only the rule about electricity was a joke',
                'Very: they’re odd, but she means every one'], a: 0,
      cue: 'TV のルールのあとの訂正。前にもあった、という語。',
      line: '…*lying again*… No, we *leave the TV on all day long*…',
      said: '「朝食後はTV禁止」のあと、「またうそついてる」「TVは一日中つけてる」と打ち消される。',
      mean: 'again ＝ 前にもあった。ルールは全部作り話で、新入りをからかっている。',
      trap: '電気の訂正だけで「冗談は一つ」と取りやすい。again は前のものも含む。',
      use: 'Relax, I’m just messing with you.（落ち着いて、からかってるだけ）' },

    // R fix: S3: the cue pointed at "move in tonight?" (77.8 s), outside the seg (the captions put the reply at 83.5 s)
    { id: 'x1', skill: 'dict', level: 'B1', point: 'great', seg: [82.9, 86.2],
      stem: 'Type Ben’s answer: “Yeah, sure, ___.” (3 words)', answer: "that'd be great",
      cue: '短い2語のあと、つながって聞こえる3語。',
      line: 'Yeah, sure, *that’d be great*.',
      said: '「今夜引っ越してくる？」に「うん、ぜひ。助かるよ」と答える。',
      mean: 'that’d ＝ that would。申し出を受けるときの決まった言い方。',
      trap: 'that’d の d はほぼ聞こえず、that be に聞こえやすい。would を補って聞く。',
      use: 'A window seat? That’d be great.（窓側の席？ それは助かります）' },

    // R fix: K1/V2 (blind 65 %): "each counts on the other" overstated (only Andy says he counts on April), and Ben
    //   has already arrived. Parallel "He leaves it to her…" choices; seg start 104.0 → 104.2 (clear of "can")
    // why: too busy ← "three weeks ago for your wedding" puts a busy time just before; soon ← "gonna clean up" heard
    //   as a promise about the future
    { id: 'h3', skill: 'humor', level: 'C1', point: 'clean', seg: [104.2, 111.4],
      stem: 'Why does the couple’s explanation of the mess get a laugh?',
      choices: ['He leaves it to her, and she never does it', 'He leaves it to her, but she’s been too busy',
                'He leaves it to her, and she’ll do it soon'], a: 0,
      cue: '「I always think」と、もう一人の付け足し。',

      line: 'I always think *April’s gonna clean up*. — And *I never clean up*.',
      said: '「いつも April が片付けると思ってて」に、「で、私は片付けない」と続く。',
      mean: '彼は April 任せ、April はやらない。平気で言うのが笑い。',
      trap: 'gonna clean up を予定と取りやすいが、always think は習慣の話。',
      use: 'I always think someone else will do it.（いつも誰かがやると思っちゃう）' },

    // C2: how they see each other (cf. h3)
    // anchor: 109.84–114.32 s "I never clean up" is followed straight away by "It's cute, right?" and, after Ben's
    //   "No.", by "Yes, it is."
    // R fix: K1: "each other's mess" rested on who says "It's cute, right?" (no name settles it); the key is now
    //   about the pair. Seg start 107.5 → 107.6 (clear of "happened")
    // why: resents ← the Japanese frame: housework remarks between partners heard as a complaint (不満); guilty ← "It's
    //   cute, right?" heard as covering embarrassment in front of a guest
    { id: 'c2', skill: 'attitude', level: 'C2', point: 'clean', reveals: ['cute'], seg: [107.6, 115.2],
      stem: 'What does the mess talk tell us about how the couple see each other?',
      choices: ['Neither minds; to them the mess is cute', 'One of them quietly resents the other’s mess',
                'Both feel guilty but hide it from Ben'], a: 0,
      cue: '片付けの話のすぐあとの一言と、言い返し。',
      line: 'And *I never clean up*. — *It’s cute, right?* — No. — *Yes, it is.*',
      said: '「片付けない」のすぐあとに「かわいいでしょ？」。Ben に否定されても「かわいいの」と言い張る。',
      mean: '責め合わず、だらしなさまで「かわいい」と思っている。言い返しが、互いに夢中な二人を示す。',
      trap: '夫婦の家事の話は不満に聞こえやすい。相手を責めるか、かばうかで関係をつかむ。',
      use: 'He’s always late, and I love that about him.（いつも遅れるけど、そこが好き）', retired: true },

    // R fix: V2 (blind 55 %): "worked once" was a filler; the near sound is now "It does work"
    // why: does work ← the -n't of "doesn't" lost, "it does" heard; too well ← the sitcom alarm that goes off at any
    //   frying, and "worked" is the louder, longer word
    { id: 'd4', skill: 'detail', level: 'B2', point: 'alarm', seg: [116.3, 123.4],
      stem: 'What did the fire alarm check show?',
      choices: ['It doesn’t work', 'It does work', 'It works too well'], a: 0,
      cue: 'checking の文のあと、It で始まる短い一言。',
      line: 'We were checking to see if the fire alarm worked. — It *doesn’t*.',
      said: 'ビー玉を揚げた理由を「報知器が鳴るか確かめてた」と言い、「鳴らない」と付け足す。',
      mean: '報知器は壊れている。危ないことを平気で言うのが二人らしい。',
      trap: 'doesn’t の t は消えやすく、does に聞こえる。n のあとの小さな間を聞く。',
      use: 'The Wi-Fi doesn’t work in my room.（部屋の Wi-Fi が使えません）' },

    // R fix: V2 (blind 60 %: "How'd you sleep?" is the set phrase) and seg 2.55 s, under 3 s. Fourth sound-alike
    //   "Could you" (couldja ≈ クジュ); seg start 131.9 → 131.4
    // why: How do you ← "how'd" heard with a vowel put back, as a habit question; Did you ← only the "d‿you" (ジュ) caught,
    //   the weak "how" lost; Could you ← "-d you" heard, and "could you sleep?" fits a first night
    { id: 's1', skill: 'sound', level: 'B2', point: 'sleep', seg: [131.4, 134.45],
      stem: 'Fill the gap: “Morning, roomie. ___ sleep?”',
      choices: ['How’d you', 'How do you', 'Did you', 'Could you'], a: 0,
      cue: 'roomie のあと、短くつながる2語。',
      line: 'Morning, roomie. *How’d you* sleep?',
      said: '朝、Ben に「おはよう、ルームメイト。よく眠れた？」と聞く。',
      mean: 'How’d you ＝ How did you。d と you がつながり「ハウジュ」に近い。',
      trap: 'How do you だと「普段どう寝る？」になる。朝の質問は昨夜の話。',
      use: 'How’d you get here so fast?（どうやってそんなに早く来たの？）' },

    // R fix: V2 (blind 50 %): "He loves it" was a weak filler; now "puts up with it, then decides to leave"
    // why: leave ← "I might need to not stay here anymore" heard as the outcome; gets used to it ← "Oh, good. Okay, all
    //   right" heard as giving in to the mess
    { id: 'g2', skill: 'gist', level: 'B2', point: 'turn', reveals: ['leave'], seg: [132.0, 185.6],
      stem: 'Over his first morning there, how does Ben’s attitude change?',
      choices: ['He wants out, then decides to take charge', 'He puts up with it, then decides to leave',
                'He wants out, then slowly gets used to it'], a: 0,
      cue: '最後の「Here’s the deal」のあと、何を始めると言うか。',
      line: 'We’re going to *clean this place up*… and then I’m going to *teach you how to be adults*.',
      said: '出ていこうとして引き止められ、「片付けて、大人のやり方を教える」と宣言する。',
      mean: '文句を言う側から、仕切る側へ。逃げられないなら変える、という流れ。',
      trap: 'Oh, good. を喜びと取りやすい。Here’s the deal は計画の前置き。',
      use: 'Okay, here’s the deal.（よし、こうしよう）' },

    // why: slept well ← only "no bed bugs" (the first half) heard; brought them ← "bed bugs" heard without the "no"
    // R fix: S4: seg start 134.0 clipped the end of "sleep" (133.76); now 134.2
    { id: 'i2', skill: 'infer', level: 'B2', point: 'bed', seg: [134.2, 139.7],

      stem: 'What does Ben’s answer tell us about his first night?',
      choices: ['He had no proper bed to sleep in', 'He finally slept well, free of bugs',
                'He brought the bed bugs along with him'], a: 0,
      cue: '前半のあと、Also で付け足す一言。',
      line: 'Well, there were *no bed bugs*. *Also, no bed*.',
      said: '「トコジラミはいなかった。ついでにベッドもなかった」と言い、ベッドを買いに行くと続ける。',
      mean: '良い知らせのふりで始めて、もっと悪い事実を出す。モーテルの話を受けた冗談。',
      trap: '前半だけで「よく眠れた」と取りやすい。Also のあとに本題が来ることがある。',
      use: 'Good news and bad news.（いい知らせと悪い知らせがある）' },

    // R fix: V2 (blind 75 %): quoting the rhetorical question in the stem gave it away; the stem now names the moment
    // why: what's cute ← the question form taken as a real question (literal); joking ← "pretty cute, right?" heard as a
    //   joke, so Ben checks
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'cute', seg: [146.0, 150.85],
      stem: 'When Ben answers “pretty cute, right?”, what is his follow-up question doing?',
      choices: ['Firmly saying it isn’t cute at all', 'Asking what Andy finds cute about it', 'Checking whether Andy is only joking'],
      a: 0,
      cue: 'すぐ前の一語の返事と、そのあとの質問の形。',
      line: 'It’s pretty cute, right? — *No.* *Do you know what cute means?*',
      said: 'フリスビーの朝食を「かわいいでしょ？」と言われ、「いや。cute の意味分かる？」と返す。',
      mean: '答えを求めない質問で、「どこがかわいいんだ」という強い否定。',
      trap: '疑問文なので意味を聞いていると取りやすい。直前の No. が答え。',
      use: 'Do you know what “quiet” means?（「静かに」って意味分かる？）' },

    // R drop: c3 (C2 stress on "you guys"), K1 + V2. Ben's line swaps two things against Andy's ("you" → "you guys",
    //   "turkey chili" → "washing dishes"), so stress on "dishes" is as defensible as on "you guys"; blind 60 % by
    //   the "stress the swapped pronoun" rule. Deleted (never shipped); its ear check went with it.

    { id: 'x2', skill: 'dict', level: 'B2', point: 'jerk', seg: [156.95, 160.75],
      stem: 'Type what’s said: “Now I ___ like a jerk.” (3 words)', answer: 'bet you feel',
      cue: 'Burly が皿を持っていった話のすぐあと。',
      line: 'Now I *bet you feel* like a jerk.',
      said: '「皿はバーリーが持っていった」と言い、「悪かったと思うでしょ」と続ける。',
      mean: 'I bet ＝「きっと〜だ」。bet you が「ベッチュ」とつながる。',
      trap: 'bet you を better と聞きやすい。I のあとの短い動詞は bet のことが多い。',
      use: 'I bet you’re tired.（きっと疲れてるよね）' },

    // R fix: V2 (blind 60 %): the key was the only softened choice; all three are now "Softly…"
    // why: stay ← "stay here" heard without the weak "not" and "anymore"; dishes ← "might need to" heard as a need,
    //   right after "we don't have any dishes"
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'leave', seg: [160.3, 164.6],
      stem: 'Right after his “Oh, God”, what is Ben doing?',
      choices: ['Softly saying he’s going to move out', 'Softly asking to stay one more night',
                'Softly hinting they should buy dishes'], a: 0,
      cue: 'might need to のあとの小さな否定語。',
      line: 'Okay, I *might need to not stay* here anymore.',
      said: '皿もないと知って「えっと、もうここにはいられないかも」と言う。',
      mean: 'might need to で和らげているが、中身は「出ていきたい」。遠回しな宣言。',
      trap: 'not が弱く stay だけ聞こえやすい。最後の anymore は「もう〜ない」の印。',
      use: 'I might need to leave early.（早めに失礼するかもしれません）' },

    // C2: exact words in fast speech (cf. pr2)
    // anchor: 162.72–164.0 s "I might need to not stay here anymore" in both sources: 7 words in ≈1.3 s, and "to not"
    //   is the split order grammar would move
    { id: 'c1', skill: 'dict', level: 'C2', point: 'leave', seg: [161.8, 164.6],
      stem: 'Type Ben’s words: “Okay, I ___ here anymore.” (5 words)', answer: 'might need to not stay',
      cue: '「Oh, God」のあと。文法より、聞こえた順番で。',
      line: 'Okay, I *might need to not stay* here anymore.',
      said: '「もういられないかも」。5語が1秒ほどで続き、to not は「タナッ」とつながる。',
      mean: 'need to not stay ＝「いないようにしないと」。not を動詞の直前に置く形は会話でよく出る。',
      trap: 'might not need to に直すと「いなくてもいい」になる。聞こえた順に書く。',
      use: 'I need to not eat so late.（夜遅く食べないようにしないと）', retired: true },

    // why: need it for an Xbox ← "Xbox" is heard, but "already spent" puts it in the past; nobody else ← the usual
    //   sitcom reason, and they did need help with the rent
    // R fix: S4: seg start 164.2 cut "anymore" (164.0–≈164.5); now 164.5
    { id: 'd5', skill: 'detail', level: 'B1', point: 'spent', reveals: ['leave'], seg: [164.5, 169.75],
      stem: 'Why does the couple say Ben can’t leave now?',
      choices: ['They’ve already spent the money he paid', 'They still need his money for an Xbox',
                'Nobody else will rent the room from them'], a: 0,
      cue: 'sorry dude のあとの理由。時制に注目。',
      line: 'We *already spent your money* on a new Xbox… You got to stay.',
      said: '「ごめん、もう君のお金で Xbox とフリスビーを買っちゃった。いてもらわないと」と言う。',
      mean: '家賃のお金を使ってしまい、返せない。だから出ていかれると困る。',
      trap: 'Xbox が聞こえて「これから買う」と取りやすい。already と過去形は済んだこと。',
      use: 'Sorry, I already spent it.（ごめん、もう使っちゃった）' },

    // R fix: GUIDE §9.7: the key rested on who says which reply (no name settles it); now "one… the other". V2 (blind
    //   70 % from the characters) eased too. The tone of "Cool…" stays on the ear check
    // why: both keen ← "Thanks, mister" heard as real thanks, and "Cool" taken as the pair's answer; both mock ← "Gee
    //   golly… mister" (kid talk to a grown-up) heard as the pair's joint reply
    { id: 'a4', skill: 'attitude', level: 'C1', point: 'adults', reveals: ['turn'], seg: [174.9, 185.6],
      stem: 'How do the two react to Ben’s plan to teach them to be adults?',
      choices: ['One is keen, and the other makes fun of it', 'Both are keen and thank him for it', 'Both make fun of it, like kids to a dad'], a: 0,

      cue: '2つの返事。後の方の、わざと古い言葉づかい。',
      line: '*Cool.* We’ll get to be adults. — *Gee golly. Thanks, mister.*',
      said: '「大人のやり方を教える」に、一人は「やった」、もう一人は「わあ、ありがとう、おじさん」。',
      mean: 'Gee golly や mister は昔の子ども言葉。子どもを演じてからかう。',
      trap: 'Thanks で素直なお礼と取りやすい。古い子ども言葉はからかいの合図。',
      use: 'Gee, thanks, Mom.（はいはい、ありがとね、お母さん）' },
  ]
};
