// REVIEW 2026-11-16: pass 6, fix 17, drop 0, new 0; ear checks 2
// REVIEW open: s1 (does / doesn't / didn't) was a 55 % blind pick on scene sense; every gap that keeps the three
//   choices grammatical has the same issue, so it's kept. nt1, x1 and s1 left the ear-check list (both sources agree
//   on their words: review-rubric addendum).
// REVIEW open: on a cold re-read, ph1 and a2 still came in at 60 % (a known idiom, an ironic "generous"); kept.
// “Leslie Throws Ann an Epic Going-Away Party | Parks and Recreation” (the official Parks and Recreation channel,
// Season 6): Leslie's farewell party for Ann celebrates every event of the year; her surprise at the lot is blocked
// (a sign, guards, a voicemail that's full), friends swap tips and say goodbye, each in their own way.
// Segments from the captions, words from whisper (2026-11-16). Untested: 67–74 s (“baby bump” vs “baby boom”, “good
// looking out” vs “thanks for looking out”), 114–118 s (a joke on real people's names: world knowledge), 124–129 s
// (Oren and the costume: visual), 256–272 s (Larry's and Ron's goodbyes; “Oh, God, Ron” is in whisper only), and the
// groundbreaking and Harold, which need the show's backstory.
// EAR CHECK: 3.8 s h1 — captions “Thailand about the groundbreaking”, whisper “Tell Anne about the groundbreaking”;
//   the key needs “Tell” (the reversal of “don't mention”)
// EAR CHECK: 199–206 s nt2 — the speaker is audibly upset (whisper: “Oh, God. April, are you okay?”; captions have
//   only “are you okay”); the key also stands on the words (“are you okay? What's happening?” → “so scared”)
import type { Clip } from '../types.ts';

export const bonVoyage: Clip = {
  id: 'bonvoyage', video: 'u6yo0Ot66EA', title: 'Leslie Throws Ann an Epic Going-Away Party', dur: 283, wpm: 164,
  band: 'mid', tags: ['友だち', '家'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2/K3 — the key was the only choice with a twist; the near miss is now the right repeat with crimes added
    // why: right ← "about the groundbreaking" comes back intact, so only the added crimes stand out; takes it back ← a
    //   joke repeat usually ends with "just kidding"
    { id: 'h1', skill: 'humor', level: 'C1', point: 'repeat', seg: [0, 9.2],
      stem: 'Why does the repeat-back at the very start get a laugh?',
      choices: ['He reverses it, then adds crazier orders', 'He gets it right, then adds crazier orders',
                'He reverses it, then takes it all back'], a: 0,
      cue: '「Repeat that back」のあと、文頭の動詞。',
      line: 'don’t mention anything about the groundbreaking to Ann… — *Tell Ann* about the groundbreaking. *Frame Ann for murder.*',
      said: '「言わないで、復唱して」と頼まれ、「アンに話す。殺人の罪を着せる…」と返す。',
      mean: 'don’t を抜いて正反対にし、物騒な話まで足していくのがおかしさ。',
      trap: '同じ語句が戻るので、物騒な部分だけが冗談に聞こえる。復唱の文頭の動詞を聞く。',
      use: 'Can you repeat that back to me?（復唱してもらえる？）', retired: true },

    // R fix: V2 — both distractors were weak; the new ones reuse "this year" and "every event"
    // why: missed ← "every event… this year" heard as making up for past events; can't choose ← "every event" taken as
    //   indecision
    { id: 'd1', skill: 'detail', level: 'B2', point: 'visit', seg: [14.4, 26.1],
      stem: 'Why does Leslie make the party a celebration of every event?',
      choices: ['She doesn’t know when they’ll see each other', 'She missed all of Ann’s big days this year',
                'She couldn’t choose which event to celebrate'], a: 0,
      cue: '「safe」の前にある一文。',
      line: 'I don’t know *when we’re gonna be able to visit each other*. So just to be safe…',
      said: '「次にいつ会えるか分からないから、念のため今年の行事を全部祝う」と言う。',
      mean: '会えない間の誕生日や祝日を、まとめて先に祝っておく。',
      trap: 'this year から「祝えなかった分」と取りやすい。理由は safe の前の一文。',
      use: 'Just to be safe, let’s leave early.（念のため早めに出よう）' },

    // why: 13 ← -teen/-ty: "thirty" with its flapped t; 3 ← the -ty lost after "actually"
    { id: 'n1', skill: 'number', level: 'B1', point: 'chant', seg: [27.55, 32.6],
      stem: 'In the party chant, how many parties is a Leslie Knope party?',
      choices: ['3', '13', '30'], a: 2, keep: true,
      cue: '「actually」のすぐあとの数。',
      line: '’cause a Leslie Knope party is *actually 30 parties*.',
      said: '「レスリー・ノープのパーティーは実は30回分」と節をつけて言う。',
      mean: '1年分の行事をまとめたので、1回で30回分という自慢。',
      trap: 'thirteen は後ろの teen が強い。thirty は前が強く、t が弾んで「サーディ」に近い。',
      use: 'It’s actually three meetings in one.（実は会議3つ分なんだ）' },

    // R fix: N6 — said + mean + trap were 134 characters; trimmed to 120
    // C2: exact words in fast speech (cf. n1)
    // anchor: 28.26–29.0 s both sources have "ain't no party like a Leslie (Knope) party"; the line runs ≈ 220 wpm
    { id: 'nt1', skill: 'dict', level: 'C2', point: 'chant', seg: [27.55, 32.6],
      stem: 'Type the chant’s first words: “___ party like a Leslie Knope party.” (2 words)', answer: "ain't no",
      cue: '「Flag Day」のすぐあと。文法より聞こえた音を。',
      line: '*Ain’t no* party like a Leslie Knope party…',
      said: '「レスリー・ノープのパーティーに勝るものなし」と歌う。2語は短い。',
      mean: 'ain’t no ＝ there’s no のくだけた形。否定が2つに見えるが「〜はない」の意味。',
      trap: '習った形に直して there’s no と書きたくなる。言われた音を書く。',
      use: 'Ain’t no way I’m missing that.（それは絶対見逃せない）' },

    // R fix: V2 — apologizing and livening up were weak; both near misses now read "dying down" literally
    // why: tired ← "dying down" taken literally, as the guests winding down; flop ← "Weird" heard as a dig at the host
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'hurry', seg: [33.4, 42.3],
      stem: 'When a guest remarks on the party and adds “Weird,” what is she doing?',
      choices: ['Joking that Ann should hurry up and leave', 'Noting that the guests are getting tired',
                'Teasing Leslie that her party is a flop'], a: 0,
      cue: 'その直後の「Michigan」と、続く行動。',
      line: 'Seems like the party’s *dying down*. Weird. … I *packed a bag for you*.',
      said: '「下火みたい。変ね」と言い、「荷物まとめといた」と続ける。',
      mean: '盛り上がっている場で「下火」と言うのは、そろそろ帰れという合図。',
      trap: 'dying down を文字どおりに取ると、客の様子や失敗の話に聞こえる。直後の行動で狙いが分かる。',
      use: 'Looks like things are winding down.（そろそろお開きかな）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'bunch', seg: [42.3, 45.2],
      stem: 'Type the words: “This is just ___ bras and knives.” (3 words)', answer: 'a bunch of',
      cue: '「This is just」のあと、量を表す言い方。',
      line: 'This is just *a bunch of* bras and knives.',
      said: '渡されたバッグを見て「ブラとナイフばっかり」と言う。',
      mean: 'a bunch of ＝ たくさんの、ごちゃっとした。荷物の中身がめちゃくちゃなことへの驚き。',
      trap: 'of が弱く「アバンチャ」と次の語につながる。a と of の2語を落とさない。',
      use: 'I have a bunch of emails to answer.（返すメールが山ほどある）' },

    // R fix: V2/S1 — "really telling" + the quote pointed at a compliment; plain stem, near misses on "not meet"
    // why: no friends ← "100% sure… will not meet" heard as a worry about making friends; never forget ← "not meet another"
    //   with "another" lost
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'donna', seg: [49.9, 57.7],
      stem: 'What does Ann tell Donna in her first goodbye line?',
      choices: ['That there’ll never be another friend like Donna', 'That she’s sure she’ll find no friends there',
                'That she’ll never forget meeting Donna'], a: 0,
      cue: '名前の前の一語の働きと、直後の一言。',
      line: 'I’m 100% sure that I will *not meet another Donna Meagle* in Michigan. I’m gonna miss you.',
      said: '「ミシガンで第二のドナ・ミーグルには絶対会えない。寂しくなる」と言う。',
      mean: 'another＋人名 ＝「あの人のような人」。ドナは唯一無二というほめ言葉。',
      trap: 'not meet だけ聞くと友だち作りの不安に聞こえる。another まで聞く。',
      use: 'There’s only one you.（君みたいな人はほかにいない）' },

    // R fix: V2 — the key was the only choice that fit Donna's "run this town"; all three now say what she'll rule
    // why: City Hall ← "run this town" read literally; parties ← the party around them, with "dating pool" missed
    { id: 'i1', skill: 'infer', level: 'C1', point: 'pool', seg: [54.1, 61.1],
      stem: 'Why does Donna say she’ll “run this town” now?',
      choices: ['With Ann off the market, she’ll get all the dates', 'With Ann gone, she’ll take Ann’s place at City Hall',
                'With Ann gone, she’ll be queen of every party'], a: 0,
      cue: '「run this town」の直前の理由の部分。',
      line: 'now that you’re officially *out of the dating pool*, you know I’m gonna *run this town*, right?',
      said: '「あなたが恋人探しから抜けたから、この町は私のものね」と言う。',
      mean: 'dating pool ＝ 恋人募集中の人たち。アンが抜けて敵なし、という冗談。',
      trap: 'run this town を町を仕切る仕事と取りやすい。直前の理由が何の話かを決める。',
      use: 'He’s officially off the market.（彼はもう売約済みだよ）' },

    // R fix: V2 — the key was the only reading of "focused on these ribs"; all three now answer "Have you seen April?"
    // why: saw April ← "April" and the food names come close together; went for food ← "you're out of…" heard as why April
    //   left
    { id: 'i2', skill: 'infer', level: 'B2', point: 'ribs', seg: [74.4, 85.6],
      stem: 'When asked about April, what does Ron’s answer suggest?',
      choices: ['He hasn’t looked, as he’s been busy eating', 'He saw April near the ham and the turkey',
                'He thinks April went out to get more food'], a: 0,
      cue: '「By the way」のあとの報告。',
      line: 'I’ve been mostly *focused on these ribs*. By the way, *you’re out of Easter ham* and Thanksgiving turkey.',
      said: '「ずっとリブに夢中だった。ちなみにハムと七面鳥はもうない」と言う。',
      mean: '食べるのに夢中で見ていない。料理が切れたのも、自分が食べたからと分かる。',
      trap: 'April と料理の名前が続くので結びつけやすい。you’re out of ＝ もう切れている。',
      use: 'Sorry, we’re out of milk.（ごめん、牛乳切らしてる）' },

    // why: party shut down ← "Public Works", "no trespassing" and "security guards" heard as about the party itself;
    //   guards coming ← "two huge security guards" taken as on their way
    { id: 'g1', skill: 'gist', level: 'B2', point: 'lot', seg: [85.4, 122.8],
      stem: 'What bad news comes in the phone call?',
      choices: ['They’re kept out of a lot they planned to use', 'The city is shutting Leslie’s party down early',
                'Security guards are on their way to the party'], a: 0,
      cue: '「Public Works」から始まる説明。',
      line: 'Are you on the lot? … a sign that says *no trespassing*.',
      said: '電話で「区画は大丈夫？」と聞くと、「フェンスに立入禁止の看板が出た」と返る。',
      mean: '使うはずの区画に入れなくなった。最後は作戦を立てに集まる。',
      trap: '看板や警備員と聞くと会場の話に思えるが、場所は lot（区画・空き地）。',
      use: 'Is everything okay over there?（そっちは大丈夫？）' },

    // why: does ← n't's t drops and the n is light; didn't ← the d-n-t shape is caught, the vowel missed
    { id: 's1', skill: 'sound', level: 'B2', point: 'apply', reveals: ['lot'], seg: [95.3, 98.6],
      stem: 'Fill the gap: “That probably ___ apply to us.”',
      choices: ['does', 'doesn’t', 'didn’t'], a: 1,
      cue: '「probably」のあと、語尾の小さな音。',
      line: 'That probably *doesn’t* apply to us.',
      said: '立入禁止の看板に「たぶん私たちには関係ない」と言う。',
      mean: 'doesn’t の t はほぼ消え「ダズン」で止まる。禁止は自分たち向けではないという強気。',
      trap: 'does だと「当てはまる」で逆の意味。t が消えても「ン」が残るかを聞く。',
      use: 'That rule doesn’t apply to kids.（その決まりは子どもには関係ない）' },

    // R fix: V2 — "a silly excuse" was the only pointed choice; all three are now a feeling plus a reason
    // why: proud ← "a professor in Copenhagen" heard as fame abroad; hurt ← "especially Leslie Knope" taken as the point
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'professor', reveals: ['lot'], seg: [98.05, 110.8],
      stem: 'How does Leslie react to the second sign at the lot?',
      choices: ['In denial: she says the sign means someone else', 'Proud: she’s glad her name is known abroad',
                'Hurt: she feels the sign singles her out'], a: 0,
      cue: '「common name」と言ったあとの理由づけ。',
      line: 'Well, Leslie Knope is a *very common name*. … *They probably mean him.*',
      said: '「よくある名前よ。コペンハーゲンに同名の教授がいる。たぶん彼のこと」と言う。',
      mean: '名指しを認めたくなくて、苦しい言い訳をひねり出している。',
      trap: 'Copenhagen で有名人の話に思える。教授を出すのは、自分ではないと言いたいから。',
      use: 'They probably mean someone else.（たぶん別の人のことだよ）' },

    // why: chia seeds ← the next tip's food comes right after; sugar ← "too hyper" brings the usual sugar script
    { id: 'd2', skill: 'detail', level: 'B1', point: 'hyper', seg: [132.2, 137.7],
      stem: 'What can’t Leslie do before bedtime?',
      choices: ['Watch anything with Julie Andrews in it', 'Eat anything with chia seeds in it',
                'Drink anything with lots of sugar in it'], a: 0,
      cue: '「can’t」のすぐあとの動詞。',
      line: 'Leslie can’t *watch anything with Julie Andrews* in it before bedtime…',
      said: '「レスリーは寝る前にジュリー・アンドリュースの出る物を見ちゃだめ」。',
      mean: 'hyper ＝ 興奮して落ち着かない。寝る前に避けるべき物を教えている。',
      trap: '次に chia seeds の話が来るので食べ物と混ざりやすい。can’t の直後を聞く。',
      use: 'Coffee makes me too hyper at night.（夜のコーヒーは目がさえすぎる）' },

    // R fix: V2 — “planning a surprise” was a weak filler; “complaining” is the near miss from “intense people”
    // why: complaining ← "we really picked some intense people" taken as a complaint; sick ← "cranky around noon" heard as
    //   symptoms
    { id: 'i3', skill: 'infer', level: 'B2', point: 'intense', seg: [137.0, 148.9],
      stem: 'What are the two friends doing with this tip about Chris?',
      choices: ['Passing on how to handle the people they love', 'Complaining about how hard their partners are',
                'Worrying that Chris gets sick around noon'], a: 0,
      cue: '「Wow」のあとの感想と、助言の中身。',
      line: 'If Chris gets *cranky* around noon, just stuff some chia seeds into a fig. … Wow, we really picked some *intense people*…',
      said: '「クリスが昼に不機嫌なら、イチジクにチアシードを」と教え、「濃い人を選んだね」。',
      mean: '別れの前に世話のコツを引き継ぐ。intense は愛情まじりの「手ごわい」。',
      trap: 'intense を不満と取りやすいが、話は世話のコツ。cranky も体調ではない。',
      use: 'He gets cranky when he’s hungry.（彼はお腹がすくと機嫌が悪くなる）' },

    // R fix: V2 — the key was the only choice with a joke's shape; all three are now kinds of reply
    // why: dig ← "that attitude" heard as about her dancing; hates it ← "isn't dancing music" taken as his view
    { id: 'h3', skill: 'humor', level: 'C1', point: 'song', seg: [154.6, 162.6],
      stem: 'Why is Chris’s reply about the song funny?',
      choices: ['It’s a pep-talk line used on a fact about a song', 'It’s a dig at her dancing, dressed up as advice',
                'It’s a polite way to say he hates the song'], a: 0,
      cue: '彼の返事が、何について話しているか。',
      line: 'I told him that One Headlight… *isn’t dancing music* and he said *not with that attitude*.',
      said: '「ダンス向きの曲じゃない」と言ったら「その態度じゃね」と返された、と話す。',
      mean: 'not with that attitude は「前向きならできる」。曲の種類には効かない。',
      trap: 'attitude を踊りへの悪口と取りやすい。何に返した言葉かを聞く。',
      use: 'Can’t do it? Not with that attitude!（できない？その考えじゃね！）' },

    // R fix: V2/K1 — an assistant can screen calls, so that distractor was defensible; new near misses: blocking, recording
    // why: blocking ← screening read as a phone setting; recording ← スクリーン read as monitoring
    { id: 'ph1', skill: 'phrase', level: 'B2', point: 'screen', seg: [180.7, 187.0],
      stem: 'In Leslie’s message, what does she say Harold has been doing?',
      choices: ['Seeing it’s her and not picking up', 'Blocking her number so it won’t ring',
                'Recording her calls to use against her'], a: 0,
      cue: '「I know」のあとの動詞と、その目的語。',
      line: 'I know you are *screening my calls*, but if you could call me ba—',
      said: '「電話を選んで出てないのは分かってるけど、折り返して…」と留守電に話す。',
      mean: 'screen calls ＝ 相手を確かめ、出たくない電話には出ない。避けられていると承知の上。',
      trap: 'カタカナの「スクリーン」から記録や着信拒否を想像しやすい。',
      use: 'Are you screening my calls?（私の電話、わざと出てないでしょ）' },

    // R fix: V2 — the key was the only choice that fit "again"; the near miss now reads "again" as one earlier call
    // why: spoke once ← "again" as one earlier talk; hung up ← the cut-off taken as Harold picking up, with "voicemail"
    //   missed
    { id: 'i4', skill: 'infer', level: 'B2', point: 'full', seg: [180.7, 187.0],
      stem: 'What does the cut-off message suggest about Leslie’s calls to Harold?',
      choices: ['She has called him many times already', 'She already got through to him once today',
                'He picked up, then hung up on her'], a: 0,
      cue: '名前のすぐあとの一語と、最後の一文。',
      line: 'Harold, it is Leslie Knope *again*. … And his *voicemail is full*.',
      said: '「ハロルド、またレスリーです」と吹き込むが途中で切れ、「留守電がいっぱい」と言う。',
      mean: 'again と、留守電がいっぱいなことから、何度もかけて伝言を残してきたと分かる。',
      trap: '切れたのを相手が出て切ったと思いやすい。voicemail は留守電。',
      use: 'Sorry, it’s me again.（たびたびすみません）' },

    // R fix: V2 — the key was the only plain outcome; all three now begin with where they stand
    // why: Harold ← "if you could call me back" from the message just before; a rule ← "flip through the bylaws" heard as a
    //   find
    { id: 'g2', skill: 'gist', level: 'B1', point: 'wall', seg: [180.7, 199.1],
      stem: 'After her husband checks the rules, where do they stand?',
      choices: ['They’re stuck, with nothing left to try', 'They’re stuck until Harold calls them back',
                'They found a rule that might get them in'], a: 0,
      cue: '最後の「Looks like」で始まる一言。',
      line: 'I don’t think there’s *anything I can do*. … Looks like we *hit a wall*.',
      said: '夫は「規則を見たけど打つ手はなさそう」と言い、最後に「行き詰まったね」とまとめる。',
      mean: 'hit a wall ＝ 壁にぶつかる、行き詰まる。今は打つ手がないという結論。',
      trap: 'bylaws を調べたと聞くと、抜け道が見つかったと思いやすい。',
      use: 'I think we’ve hit a wall here.（ここで行き詰まったね）' },

    // R fix: V2 — the key was the only joke-shaped choice; all three now read "other reasons" as his reply
    // why: no power ← "city manager" + "can't" heard as his own admission; other ways ← "a few other reasons" heard as
    //   other ways to crush her enemies
    { id: 'h5', skill: 'humor', level: 'C1', point: 'married', seg: [188.7, 199.1],
      stem: 'Why does the reply to Leslie’s question about being married get a laugh?',
      choices: ['He hopes power isn’t all he’s good for', 'He admits his job has no real power',
                'He hints he has other ways to crush Harold'], a: 0,
      cue: '彼の返事の「other」が、何の「ほか」か。',
      line: 'What is the point of being *married to a city manager*… — *Hopefully there are a few other reasons*.',
      said: '「市の幹部と結婚した意味は？」と嘆き、夫は「ほかにも理由があるといいけど」と返す。',
      mean: '大げさな嘆きを文字通りに受け、結婚の理由は権力だけかと寂しがってみせる。',
      trap: 'other を「ほかの方法」と取ると、作戦の提案に聞こえる。',
      use: 'Hopefully that’s not the only reason.（それだけが理由じゃないといいけど）' },

    // R fix: V2 — "trying not to say" pointed at the hidden opposite; the stem now asks what she feels, and the literal
    //   reading is a choice
    // C2: what she is trying not to say (cf. pr1)
    // anchor: 201.0–202.7 s "are you okay? What's happening?" (both sources), then 203.1–206.1 s "I'm just so scared that
    // why: afraid she'll stay ← the words taken at face value (and the bag she packed at 41 s); surprise ← "we hit a wall"
    //   is the line just before, and "this means" seems to point back to it
    { id: 'nt2', skill: 'attitude', level: 'C2', point: 'scared', seg: [198.65, 207.0],
      stem: 'Answering “are you okay?”, what is the speaker really feeling?',
      choices: ['Sad that Ann is really leaving', 'Afraid that Ann won’t leave after all', 'Upset that the surprise fell through'], a: 0,
      cue: '「are you okay」と聞かれる様子と、答えの中身。',
      line: 'are you okay? What’s happening? — I’m just *so scared* that this means that Ann *won’t really leave*.',
      said: '「大丈夫？」と聞かれ、「アンが本当は出ていかないのが怖い」と答える。',
      mean: 'お別れ会で取り乱して「残られるのが怖い」と言う。寂しさを意地悪な言い方で隠している。',
      trap: '言葉どおりなら追い出したい人になる。取り乱し方と理由が合わないときは、裏返しを疑う。',
      use: 'I’m not sad. It’s just allergies.（悲しくないよ。花粉のせい）' },

    // R fix: V2 — the key was the only full idiom gloss; three short, parallel readings of life
    // why: too fast ← another common saying about life; far from home ← "ride" read literally, as Ann's move
    { id: 'ph2', skill: 'phrase', level: 'B2', point: 'ride', seg: [208.2, 212.8],
      stem: 'When Tom sums up life in a few words, what does he mean?',
      choices: ['It’s full of ups and downs', 'It goes by far too fast', 'It takes you far from home'], a: 0,
      cue: '「Life, huh?」のあとのたとえ。',
      line: 'Life, huh? It’s *quite a ride*.',
      said: '「人生ってさ、なかなかのものだよな」としみじみ言う。',
      mean: 'quite a ride ＝ 浮き沈みの多い体験。ジェットコースターのような人生のたとえ。',
      trap: 'ride を移動や旅と取ると、引っ越しの話に聞こえる。quite a＋名詞は「すごい〜」。',
      use: 'That trip was quite a ride.（あの旅は波乱万丈だった）' },

    // why: club pass ← his "mega club" comes later in the same speech; photo ← "phone" heard, "deleting" missed
    { id: 'd4', skill: 'detail', level: 'B1', point: 'present', seg: [214.7, 222.5],
      stem: 'What going-away present does Tom give Ann?',
      choices: ['He deletes her number from his phone', 'He gives her a pass to his new club',
                'He puts a new photo of her on his phone'], a: 0,
      cue: '「present」のすぐあとの一文。',
      line: 'I got you a going-away present. *I’m deleting you from my phone.*',
      said: '「お別れの品がある。君を携帯から消す」と言う。',
      mean: '連絡先を消すことが「プレゼント」。自分の魅力から自由にしてあげる、という自信過剰な冗談。',
      trap: '後で club の話が出るので招待だと思いやすい。present の直後の動詞 deleting を聞く。',
      use: 'I got you a little something.（ちょっとしたものを買ってきたよ）' },

    // R fix: V2 — the only ironic choice was the key; the new near miss is real annoyance
    // why: annoyed ← "generous" said flat after an insult, heard as irritation; real thanks ← "generous" at face value
    //   (the お礼 frame)
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'generous', seg: [233.1, 247.6],
      stem: 'When Ann answers Tom’s plan for her at his club, what is her tone?',
      choices: ['Dry teasing: she plays along with his insult', 'Real annoyance: she’s tired of his bragging',
                'Real thanks: she’s touched he’d let her in'], a: 0,
      cue: '「too old」と「in the back」に返す一言。',
      line: 'that woman’s *way too old* to get into this club, but… let her *in the back*. — *That’s very generous.*',
      said: '「年寄りだが裏口から入れてやれ」と言う未来の自分を語るトムに、「ご親切に」と返す。',
      mean: 'generous を大げさに使い、失礼な「親切」を軽くからかい返している。',
      trap: 'お礼や本気の苛立ちと取りやすい。直後の「寂しくなるわ」で軽い冗談と分かる。',
      use: 'Wow, how generous of you.（まあ、なんてご親切に）' },
  ]
};
