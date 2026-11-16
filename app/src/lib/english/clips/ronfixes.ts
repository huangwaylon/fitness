// REVIEW 2026-11-16: pass 6, fix 14, drop 0, new 0; ear checks 2
// “Ron Swanson Gives Ann Something Special | Parks and Recreation” (the official Parks and Recreation channel, Season
// 4): instead of a wedding present, Ron fixes up April and Andy's house during a party, with a helper who wants to learn.
// Segments from the captions, words from whisper (2026-11-16). Ron is named in the audio (121.8 s, “Thanks, Ron”); the
// helper never is (the title calls her Ann), so stems say “she” and no key rests on who she is. Untested on purpose:
// 29–36 s (reaching in: visual), 63–70 s (who says “Damn it, I just love it so much” and “Great”), 79–88 s (“That's
// next” and the cranium bit: visual), 92 s (“We're gonna” in whisper, “we're going to” in the captions), 102.3 s
// (“Are you sure you got the handle…” in the captions, “I see you got the handle…” in whisper), 109.2 s (“Mac”/“max”).
// EAR CHECK: 97.2–98.5 s h1 nt2 — the bare “It's just a fuse” is Ron's, and “It's just a fuse, people” is the helper's
//   (assumed from “people”, her word at 92.8 s; no name is said)
// EAR CHECK: 115.8 s r1 — the cut falls after “You know what?” and before “Keep this”
import type { Clip } from '../types.ts';

export const ronFixes: Clip = {
  id: 'ronfixes', video: 'fPoy9nL3ZvI', title: 'Ron Swanson Gives Ann Something Special', dur: 133, wpm: 136,
  band: 'slow', tags: ['家', '友だち'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 55 %, right) + K2: "advice" was easy to rule out, and nothing in 6–21 s settled the key. The
    //   segment now runs to "fix everything I can find" (74.3 s); the foils are two readings of "help them make a home"
    // why: furniture he makes ← make = 作る, the literal reading of "make a home"; paying ← "help" + "home" heard as
    //   money toward the house
    { id: 'g1', skill: 'gist', level: 'B2', point: 'present', seg: [6.3, 75.0],
      stem: 'Instead of a wedding present, what is Ron planning to give the couple?',
      choices: ['Fixing up the whole house they live in', 'A piece of furniture he makes for them',
                'Help paying for the house they bought'], a: 0,
      cue: 'But のあと、何をしてあげたいと言っているか。',
      line: 'I can really *help them make a home*. … go around this house and *fix everything*…',
      said: '結婚祝いは贈らなかったが、二人が家を整える手助けならできそうだ、と話す。',
      mean: '物を贈る代わりに、自分の手で家を直してあげる、という計画の予告。',
      trap: 'make を「作る」と取ると家具づくりに聞こえる。あとの fix everything で中身が分かる。',
      use: 'I’d love to help you settle in.（新生活の準備、手伝わせて）' },

    // R fix: V2 (blind 50 %, right) + K5: the key was the only choice about marriage; all three are now views of it
    // why: start out simple ← "nothing more than" heard as "no presents needed"; only each other ← the scorn for
    //   things heard as a romantic view, but "divorce bonfire" says the opposite
    { id: 'i1', skill: 'infer', level: 'C1', point: 'bonfire', seg: [10.0, 15.3],
      stem: 'What does Ron’s view of wedding presents say about how he sees marriage?',
      choices: ['He expects a lot of marriages not to last', 'He thinks a marriage should start simply',
                'He thinks love matters more than things'], a: 0,
      cue: 'presents を何にたとえているか。最後の2語。',
      line: 'wedding presents are nothing more than *kindling on the divorce bonfire*.',
      said: '結婚祝いは「離婚のたき火にくべる焚きつけ」にすぎない、と言う。',
      mean: '贈り物はいずれ離婚で燃やされる、というたとえ。結婚が終わる前提で話している。',
      trap: '「物は要らない」とだけ取ると素朴な結婚観に聞こえる。たとえの中心は divorce。最後の名詞を聞く。',
      use: 'In my experience, cheap shoes never last.（経験上、安い靴は長持ちしない）' },

    // R fix: V2 (blind 60 %, right): "apologizes" and "asks" were easy to rule out; two near misses replace them
    // why: takes the new name ← he does repeat the order, so half of it is right; laughs it off ← "eggplant" sounds
    //   like a joke to play along with, but "I don't care" is flat
    { id: 'a4', skill: 'attitude', level: 'B1', point: 'eggplant', seg: [21.1, 27.0],
      stem: 'When she corrects what Ron called her, how does he respond?',
      choices: ['He brushes it off and repeats his order', 'He takes the new name and repeats his order',
                'He laughs it off and makes a joke of it'], a: 0,
      cue: '言い直されたあとの、短い返事と命令。',
      line: 'You, beanbag. Come with me. — I’m an eggplant. — *I don’t care. Come with me.*',
      said: '「豆袋、来い」と呼び、「ナスです」と言われても「どうでもいい、来い」。',
      mean: '呼び方より用事が大事、という反応。',
      trap: '命令のくり返しから、呼び名を受け入れたと取りやすい。I don’t care で流している。',
      use: 'I don’t care. Just come with me.（どうでもいい。とにかく来て）' },

    // why: hold a light ← the usual helper's job in a tight spot (broken script); knows the house ← she's at the
    //   couple's party, and says "I'm a homeowner" later
    { id: 'd1', skill: 'detail', level: 'B1', point: 'hands', seg: [25.9, 29.2],
      stem: 'Why does Ron want her to come with him?',
      choices: ['He needs someone with small hands', 'He needs someone to hold a light',
                'He needs someone who knows the house'], a: 0,
      cue: '「Why?」への短い答え。',
      line: 'Why? — *I need small hands.*',
      said: '「なんで？」と聞かれ、「小さい手が要る」とだけ答える。',
      mean: '狭いすき間に手を入れる作業のために、手の小さい人を選んでいる。',
      trap: '手伝いといえば明かり持ち、と考えやすい。理由は Why? の直後の一言で言っている。',
      use: 'I need an extra pair of hands.（人手がもう一人ほしい）' },

    // R fix: V2 (blind 50 %, right): "wrong way" was weak; "too fast to follow" (she can't keep up) replaces it
    // why: hardest parts herself ← "small hands" earlier: she did do the reaching; too fast ← "at least" heard as
    //   "slow down", but she asks to be told, not for a slower pace
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'atleast', reveals: ['learn'], seg: [36.5, 44.0],
      stem: 'What does her question to Ron suggest about the work so far?',
      choices: ['He has told her nothing about what he is doing', 'He has asked her to do the hardest parts herself',
                'He has been working too fast for her to follow'], a: 0,
      cue: 'tell me の前の2語が、何を前提にしているか。',
      line: 'Can you *at least* tell me what you’re doing? I’m a homeowner…',
      said: '「せめて何をしてるか教えて」と言い、自分も家を持っている、と続ける。',
      mean: 'at least ＝ せめて。ここまで何の説明もない、という不満がこもった頼み方。',
      trap: 'Ugh と合わせて速さへの文句と取りやすいが、求めているのは説明。',
      use: 'Can you at least text me?（せめてメッセージくらいちょうだい）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'atleast', seg: [38.3, 40.4],
      stem: 'Type her request: “___ tell me what you’re doing?” (4 words)', answer: 'can you at least',
      cue: '「Ugh」のあと、質問の頭の4語。',
      line: '*Can you at least* tell me what you’re doing?',
      said: '「せめて何をしてるか教えてくれる？」と頼む。',
      mean: 'can you が「キャニュ」、at least の t が弾んで「アッリースト」のように聞こえる。',
      trap: 'at が弱く、you と least の間で消えたように聞こえる。語の数を数えて書く。',
      use: 'Can you at least call first?（せめて先に電話してくれる？）' },

    // R fix: V2 (blind 60 %, right): "break something" was easy to rule out; "a leak like this at home" (homeowner,
    //   read too narrowly) replaces it
    // why: tell the couple ← she's at April and Andy's party, so passing it on seems natural; a leak at home ←
    //   "homeowner" taken as a matching problem, but she says "learn something", in general
    { id: 'd2', skill: 'detail', level: 'B2', point: 'learn', seg: [40.5, 44.0],
      stem: 'What reason does she give for wanting to know?',
      choices: ['She owns a house and wants to learn', 'She wants to explain it to the couple',
                'She has a leak like this at home'], a: 0,
      cue: 'I’m で始まる自己紹介と、そのあとの would like to。',
      line: 'I’m a *homeowner*… would like to actually *learn something*.',
      said: '「私も家を持ってるから、ちゃんと何か覚えたい」と言う。',
      mean: 'homeowner ＝ 持ち家の人。自分の家でも使えるように、やり方を知りたい。',
      trap: '家の話から「同じ故障が家にある」と考えやすいが、言っているのは learn something と一般的。',
      use: 'I’d like to actually learn this.（ちゃんと覚えたいんです）' },

    // R fix: V2 (blind 55 %, right): "come off easily" was weak; "tighten the stem" (his step just before) replaces it
    // why: stop the leak ← what a tap repair is usually for; tighten the stem ← "tightening" is said twice, but the
    //   stem goes into the shank before the handle and the set screw
    { id: 'd3', skill: 'detail', level: 'B1', point: 'screw', seg: [49.9, 55.0],
      stem: 'What does Ron say the set screw will do?',
      choices: ['Keep the handle held in place', 'Make the tap stop dripping', 'Tighten the stem into the valve'], a: 0,
      cue: 'set screw のあと、which で始まる説明。',
      line: 'tightening the set screw, which will *hold it in place*.',
      said: '取っ手を付け替え、止めねじを締めると「これで固定される」と説明する。',
      mean: 'hold it in place ＝ 動かないように固定する。it は handle。',
      trap: '水回りの修理なので「水漏れを止める」と考えやすい。which の後ろの動詞を聞く。',
      use: 'Tape will hold it in place.（テープで固定できるよ）' },

    // R fix: V2 (blind 60 %, right): "tired" was easy to rule out; "calm, nothing special" (Ron's flat voice) replaces it
    // why: relieved it's over ← "we made it work" heard as "finally"; calm ← Ron's flat delivery, but "Oh my God",
    //   "good feeling" and "love it so much" say otherwise
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'pride', seg: [56.5, 66.0],
      stem: 'Once the repair works, how do the two of them feel?',
      choices: ['Proud of what they have done together', 'Relieved that the long job is finally over',
                'Calm, as if it were nothing special'], a: 0,
      cue: '「It’s a good feeling」のあと、2つの名詞。',
      line: 'It’s a good feeling. A sense of *accomplishment and pride*.',
      said: '「直った！」と喜び、「いい気分だ。達成感と誇り」と続ける。',
      mean: 'accomplishment ＝ やりとげたこと。直せた喜びを、誇りとして味わっている。',
      trap: '「終わった」の安心と取りやすいが、このあと「全部直す」と言い出す。気持ちを表す名詞を聞く。',
      use: 'What a sense of accomplishment!（すごい達成感！）' },

    // R fix: V2 (blind 75 %, right): the YouTube title ("Gives Ann Something Special") pointed at "earned a reward".
    //   The key no longer names a reward, and all three are "someone who…"
    //   A cold re-read still found it at 70 %, so "fun but not much use" became "owes a favor" (a second warm reading)
    // why: owes a favor ← "Keep this" heard as paying her back, but "You earned it" is about merit; talks well,
    //   works badly ← "That was nonsense" just before the gift
    { id: 'g2', skill: 'gist', level: 'C1', point: 'earned', reveals: ['youknow'], seg: [56.5, 122.5],
      stem: 'By the end, how does Ron seem to see her?',
      choices: ['As someone who has proved herself on the job', 'As someone he now owes a favor to',
                'As someone who talks well but works badly'], a: 0,
      cue: '最後に渡すときの言葉と、それまでの作業。',
      line: 'Keep this. *You earned it.* — Thanks, Ron.',
      said: '一緒に家を直した最後に、Ron が道具を渡す。',
      mean: 'You earned it ＝ 自分の力で手に入れた。口数の少ない Ron なりの最大のほめ言葉。',
      trap: '直前の nonsense から見せかけだけと思いやすいが、評価は最後の一言で決まる。',
      use: 'Take the day off. You earned it.（今日は休みな、よく頑張った）' },

    // why: had to ← the -ve of have is lost and "to" sounds like "-d to"; got to ← "gotta" comes later in the
    //   scene; want to ← "-nt to" and "-ve to" both shrink
    { id: 's1', skill: 'sound', level: 'B2', point: 'power', seg: [88.5, 91.95],
      stem: 'Fill the gap: “I ___ turn off the power for one minute.”',
      choices: ['have to', 'had to', 'got to', 'want to'], a: 0,
      cue: '「Listen up」のあと、I に続く2語。',
      line: 'Listen up! I *have to* turn off the power for one minute.',
      said: '「みんな聞いて、1分だけ電気を切る」と知らせる。',
      mean: 'have to の v は次の t につられて f の音になり、「ハフタ」と一続きに聞こえる。',
      trap: '「ハッタ」に近く had to と迷いやすいが、これからのことなので現在形。',
      use: 'I have to leave by six.（6時までに出ないと）' },

    { id: 'n1', skill: 'number', level: 'B1', point: 'power', seg: [88.5, 91.95],
      stem: 'How long does Ron say the power will be off?',
      choices: ['1 minute', '4 minutes', '10 minutes', 'an hour'], a: 0, keep: true,
      cue: 'power のあと、for に続く部分。',
      line: 'I have to turn off the power *for one minute*.',
      said: '電気を切るのは1分だけ、と部屋のみんなに伝える。',
      mean: 'for one minute ＝ 1分間。for のあとの数は長さを表す。',
      trap: 'for one が「フォーワン」とつながり、four に聞こえやすい。minute の s の有無も手がかり。',
      use: 'Can you hold this for one minute?（これ1分持っててくれる？）' },

    // R fix: V2 (blind 50 %, right): "stay close" was weak; the foils are now the two literal readings of the words
    // why: carry something ← bear = 運ぶ・支える, the literal reading; come along ← "with us" heard as "come with us",
    //   and the fuse is named next
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'bear', seg: [91.15, 94.7],
      stem: 'When the guests hear the power is going off, what are they asked to do?',
      choices: ['Be patient with them for a moment', 'Help carry something for them', 'Come along with them to the fuse box'], a: 0,
      cue: '「go dark」のあと、with us で終わる頼み。',
      line: 'We’re gonna go dark, people. *Bear with us*, okay?',
      said: '「暗くなるよ、みんな。ちょっと待っててね」と呼びかける。',
      mean: 'bear with ＝ 少しの間がまんして待つ。店や放送のおわびでもよく使う。',
      trap: 'bear を「運ぶ」と取ると「運ぶのを手伝って」になる。bear with は「待って」の決まり形。',
      use: 'Bear with me, the page is loading.（少々お待ちを、読み込み中です）' },

    // R fix: V2 (blind 60 %, right): "scared guests" was weak; "so the far guests can hear" (a plain relay) replaces it
    // why: teasing Ron ← repeating someone's words often mocks them; a relay ← "people" makes it a message to the
    //   room, but she's swapping out her own "fuse hose"
    { id: 'h1', skill: 'humor', level: 'C1', point: 'fuse', seg: [94.0, 101.0],
      stem: 'Why does the second “just a fuse” get a laugh?',
      choices: ['She passes off his correction as her own news', 'She is teasing Ron for making a fuss over it',
                'She repeats it so the far guests can hear it'], a: 0,
      cue: '直前の言い方と、直されたあとの言い方。',
      line: 'the main *fuse hose*. — It’s just a fuse. — *It’s just a fuse, people.* Just a fuse.',
      said: 'ありもしない「fuse hose」と言い、「ただのヒューズだ」と直されると、そのまま皆に言い直す。',
      mean: '自分の言いまちがいを、さも知らせのように言い直してごまかしている。',
      trap: '人の言葉のくり返しはからかいに聞こえやすい。直される前の語と比べる。',
      use: 'Sorry, I mean the blue folder.（失礼、青いフォルダーのことです）' },

    // anchor: 95.8–96.5 s "the main fuse hose" (no such part), 97.2 s "It's just a fuse", then 98.1 s the same
    //   words again with "people", her word to the room at 92.8 s: she turns his correction into her announcement
    // R fix: V2 (blind 55 %, right): "annoyed" gives way to "hurt by how Ron said it" (a public correction read as a
    //   loss of face)
    // why: scared of the dark ← "go dark… bear with us" read as her own worry (Japanese frame: 気づかい as anxiety);
    //   hurt ← being corrected in public read as a sting, but she takes up his words at once
    { id: 'nt2', skill: 'attitude', level: 'C2', point: 'fuse', seg: [94.0, 101.0],
      stem: 'When she announces the fuse to everyone, what is she trying not to show?',
      choices: ['That she had just got the word wrong', 'That she is scared of the dark too',
                'That she was hurt by how Ron said it'], a: 0,
      cue: '直される前の語と、そのあと皆に向けた一言。',
      line: 'switch off the main *fuse hose*. — It’s just a fuse. — It’s just a fuse, *people*.',
      said: '「fuse hose」と言い、「ただのヒューズ」と直されると、people を付けて皆に知らせる。',
      mean: '直された言葉を、自分の発表に作りかえる。言いまちがいを認めずに流している。',
      trap: 'くり返しを、直されて傷ついたしるしと聞きやすい。くり返す前に何を言ったかで、隠したい点が分かる。',
      use: 'As I was saying, it’s Tuesday.（さっき言ったように、火曜日です）' },

    // R fix: V2 (blind 65 %, right): "claims Ron's work" was weak; "too technical" (jargon taken as real) replaces it
    //   A cold re-read still found it at 70 %, so "wrong tool" became "mixes up the parts", which also explains "nonsense"
    // why: mixes up parts ← "flange", "bolts", "torque wrench" heard as real names misused, but her "I know" says
    //   she meant it as play; too technical ← the jargon taken as real but hard, but "I know" admits it's made up
    { id: 'i2', skill: 'infer', level: 'B2', point: 'nonsense', seg: [105.2, 113.5],
      stem: 'Why is her repair report called nonsense?',
      choices: ['It sounds expert but means nothing', 'It mixes up the names of the parts',
                'It is too technical for him to follow'], a: 0,
      cue: '「That was nonsense」への、彼女の返事。',
      line: '…goosed it with the triple-three bolts, Mac. — That was nonsense. — I know, but *it’s so fun to talk like that*.',
      said: '専門家っぽい言葉を並べ、「でたらめだ」と言われて「分かってる、でもこういう話し方楽しい」と返す。',
      mean: '中身のない職人ことばごっこ。本人もでたらめと承知している。',
      trap: '部品名が続くので言いまちがいと考えやすい。I know のあとの理由で決まる。',
      use: 'I know, but it’s so fun!（分かってる、でも楽しいんだもん）' },

    // R fix: V2 (blind 50 %, right): "crossly" gives way to "sheepishly", a near miss that gets "I know" right
    // why: ashamed ← the Japanese frame: being told off calls for embarrassment; sheepish ← "I know" is right, but
    //   "so fun" right after leaves no room for feeling silly
    { id: 'a3', skill: 'attitude', level: 'B2', point: 'nonsense', seg: [105.2, 113.5],
      stem: 'When her report is called nonsense, how does she take it?',
      choices: ['Cheerfully; she knew it and liked it', 'With shame; she thought it was right',
                'Sheepishly; she knew it and felt silly'], a: 0,
      cue: '返事の最初の2語と、fun という語。',
      line: 'That was nonsense. — *I know*, but it’s *so fun* to talk like that.',
      said: '「でたらめだ」と言われ、「知ってる、でも楽しい」と答える。',
      mean: 'I know で認めて、but のあとで楽しさを言う。悪びれずに遊びを楽しんでいる。',
      trap: '指摘されたら恥ずかしがる、と考えやすい。I know が先に来て、すぐ fun が続く。',
      use: 'I know it’s silly, but I love it.（ばかみたいだけど、好きなの）' },

    // anchor: 110.4–113.0 s "That was nonsense. — I know, but it's so fun to talk like that": she admits the words
    //   weren't a real report; the fun of the talk is the point
    // why: a bent part and bolts ← the sincere reading of real-sounding words (warped flange, bolts); not sure ← "a
    //   little warped… just goosed it" heard as hedging
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'nonsense', seg: [105.2, 113.5],
      stem: 'Which plain-English version keeps what she means by her flange report?',
      choices: ['“I’m playing a tough repairman, for fun.”', '“I fixed a bent part with extra bolts.”',
                '“I’m not sure, but I think it’s fixed.”'], a: 0,
      cue: '報告の中身より、そのあとの I know の続き。',
      line: 'the flange was a little warped, so I just goosed it… — That was nonsense. — *I know*, but it’s so fun…',
      said: '曲がった部品をボルトで直した、と職人風に話し、でたらめと言われて認める。',
      mean: '職人ごっこの遊び。I know で本人が答え合わせをしている。伝えたいのは修理でなく楽しさ。',
      trap: 'もっともらしい用語を本気の報告と取りやすい。相手の指摘をすぐ認めたら、最初から遊びだったと考える。',
      use: 'Just kidding, I have no idea.（冗談、全然分からない）' },

    // predict: the segment stops after "You know what?"; the reveal plays "Keep this. You earned it."
    // R fix: V2 (blind 60 %, right): the title gives away "a kind gesture"; the key is now "an offer", set against
    //   "an order" (the same kind of sudden decision)
    // why: a complaint ← "That was nonsense" just before; an order ← "That's next" earlier, and "You know what?"
    //   often leads into a plan
    { id: 'r1', skill: 'predict', level: 'B2', point: 'youknow', reveals: ['earned'], seg: [111.5, 115.8], then: [115.8, 121.0],
      stem: 'Right after Ron’s question, what kind of move comes next?',
      choices: ['An offer to give her something', 'A complaint about her silly talk',
                'An order to start the next job'], a: 0,
      cue: 'この前置きのあとは、どんな話が来やすい？',
      line: 'You know what? *Keep this. You earned it.*',
      said: '「そうだ。これ持ってけ。それだけのことをした」と言って渡す。',
      mean: 'You know what? のあとは、急に思いついた提案や決定が来ることが多い。',
      trap: '直前の nonsense から、さらに文句が続くと考えやすい。この前置きは「思いつき」の合図。',
      use: 'You know what? You deserve this.（そうだ、これは君が受け取るべきだ）' },

    // why: tool check ← "this" is a tool, so a question about it fits; a complaint ← "That was nonsense" just
    //   before, so more criticism seems due
    { id: 'm1', skill: 'marker', level: 'B2', point: 'youknow', reveals: ['earned'], seg: [113.6, 117.0],
      stem: 'Before Ron says “Keep this”, what does his opening question do?',
      choices: ['Shows he has just made up his mind', 'Checks that she knows what the tool is',
                'Warns her that a complaint is coming'], a: 0,
      cue: '答えを待たずに続く、文頭の3語。',
      line: '*You know what?* Keep this.',
      said: '「そうだ」と言い、「これ持っていきな」と渡す。',
      mean: '「そうだ」「よし」の意味。思いついたことを言う前の合図で、答えは求めない。',
      trap: '質問の形なので「知ってる？」と取りやすい。答えを待たずに続けば、ただの前置き。',
      use: 'You know what? Let’s order pizza.（そうだ、ピザ頼もう）' },
  ]
};
