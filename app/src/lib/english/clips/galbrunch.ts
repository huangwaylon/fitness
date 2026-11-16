// REVIEW 2026-11-16: pass 1, fix 22, drop 1, new 1; ear checks 2
// OPEN: nt4 (new C2) keys "but look" as Leslie defending Shauna's place on the list, not a dig at Ann; if you hear
//   real spite toward Ann in her voice at 145 s, drop nt4 (the bank keeps 2 C2 items).
// “How to make friends as an adult (according to Leslie) | Parks and recreation” (the official Parks and Recreation
// channel, Season 2 playlist): Ann cancels their weekly chat, so Leslie calls an impromptu Galentine's Day brunch to
// find "an Ann who lives in Pawnee"; her "just for fun" questions turn out to be a test, the guests find her friendship
// rankings and walk out, and Shauna is the one left.
// Segments from the captions, words from whisper (2026-11-16). Named in the audio: Ann (5.1, 11.7, 83.4, 90.0, 146.2,
// 154.1 s), Donna (40.5, 134.8, 187.0, 272.8 s), April (55.8, 137.9, 201.3 s), Shauna (107.9, 140.9, 242.4, 288.6 s),
// Ethel (147.7, 240.3 s), Evelyn (152.5 s). Leslie is never named; she runs every scene and every talking head.
// Left out on purpose: 16–24.8 s (whisper only: "I'm coming in, voicemail", "I have not been taken"), the Liam Neeson
// "Taken" reference (world knowledge), "tampon commercial" (70.5 s), "whipped cream… do not Google that phrase"
// (102.7–106.5 s), Shauna's married boyfriend (113.6–119 s), "Rome's played out" (captions "let's play it out", 122.9 s),
// "skin flicks… top me off" (214–219.8 s), the annulments and Keith Sweat (232.7–239.4 s: backstory and a long con),
// "Leave the bag" (280.7 s) and "I'll see you next week" (whisper only, 292 s): speakers unclear.
// Not an ear check: the captions' "this candle" (195.9 s) is whisper's "it's Scandal" (h2 stands on the other three);
// the captions' "Hops in Eaglewood" (46.4 s) is whisper's "haps in Migglewood" (p1 doesn't quote it).
// EAR CHECK: 29.2–32.2 s h1 — both sources: "That's exactly what they'd make you say. — Also, no one's making me say
//   this." Assumed: Leslie says the first line to the voicemail, and the second is Ann's recording going on (her
//   "I'll call you later" at 38 s matches April's message). Confirm the two voices.
// EAR CHECK: 76.9 s s1 — captions "weren't gonna", whisper "weren't going to": the key is "weren't gonna" (dictation-
//   style scoring ignores gonna/going to); confirm the t of "weren't" is weak but the negative is audible.
import type { Clip } from '../types.ts';

export const galBrunch: Clip = {
  id: 'galbrunch', video: 'JJW1ZNOKGqo', title: 'How to make friends as an adult (according to Leslie)', dur: 314,
  wpm: 173, band: 'fast', tags: ['友だち', '職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: K4, cut "Seven to eleven hours" (only "seven" caught: a filler); notes trimmed to ≤ 120
    // why: one or two ← "one to" runs together like "one or"; two to seven ← the weak "to" heard as "two"
    { id: 'n1', skill: 'number', level: 'B1', point: 'hours', seg: [0, 6.85],
      stem: 'How long does Leslie say she will be in her office?',
      choices: ['One or two hours', 'One to seven hours', 'Two to seven hours'], a: 1, keep: true,
      cue: '「in my office for」のあと、数の幅。',
      line: 'I will be in my office for *one to seven hours*…',
      said: 'アンとの毎週のおしゃべりのため、オフィスに「1〜7時間」こもると言う。',
      mean: '幅が広すぎる冗談で、どれだけ長話かが伝わる。',
      trap: 'to は弱く「タ」になり、or や two に聞こえやすい。幅は A to B の形で待つ。',
      use: 'It takes one to two hours.（1〜2時間かかります）' },

    // R fix: V2, blind 65 % (the key was the only reason a call gets cancelled); a "call you later" distractor now;
    //   notes trimmed
    // why: phone ← "she'll call you later" heard as the reason, as if the line dropped; coming up ← "came up" read
    //   literally (上がってくる), as if Ann were coming to the office in person
    { id: 'd1', skill: 'detail', level: 'B1', point: 'cameup', seg: [10.6, 18],
      stem: 'What was Ann’s message while Leslie was in the bathroom?',
      choices: ['Something came up, so the chat is off', 'Her phone was dying, so she’d call back',
                'She was coming up to the office instead'], a: 0,
      cue: '「She said」のあと、短い決まり文句。',
      line: 'She said *something came up*…',
      said: 'エイプリルが「アンから電話。急用ができたって。あとでかけ直すって」と伝える。',
      mean: 'something came up ＝ 急用ができた。断りの決まり文句。',
      trap: 'call you later から別の理由を想像しやすい。came up は「急に起きる」。',
      use: 'Sorry, something came up. Rain check?（ごめん、急用で。また今度でいい？）' },

    // R fix: V2 + K2, blind 55 %; "her voice shows she is scared" could only be refuted by ear; now a kidnap-script
    //   reading the words refute ("I am a free woman, untaken"); notes trimmed
    // why: forced ← "no one's making me say this" read as an admission, with "no one's" lost; plea ← the kidnap talk
    //   ("they'd make you say") heard as Ann slipping in a coded cry for help
    { id: 'h1', skill: 'humor', level: 'C1', point: 'voicemail', seg: [24.3, 33.9],
      stem: 'Why is the message’s next line funny after Leslie’s reply?',
      choices: ['The recording seems to answer her doubt', 'Ann admits someone is making her talk',
                'Ann slips in a hidden plea for help'], a: 0,
      cue: '返事のあと、留守電の次の一文。',
      line: 'That’s exactly what *they’d make you say*. — Also, *no one’s making me say this*.',
      said: '「言わされてるんだ」と返した直後、録音が「誰にも言わされてない」と続く。',
      mean: '録音がレスリーの疑いに先回りして答え、会話のように聞こえるのが笑い。',
      trap: '誘拐の話から、助けを求める合図を探しやすい。no one’s の否定を聞き落とさない。',
      use: 'Honestly, nobody put me up to this.（ほんとに、誰かに頼まれたわけじゃない）' },

    // R fix: V2 + K5, blind 60 %: the key was the only "manner" choice among "asking about X"; now three parallel
    //   moves, one of them built on Donna's reply; notes trimmed
    // why: listening ← Donna answers "I'm listening to…", so the questions seem to have asked that; hometown ←
    //   "Donnatown" heard as a real place
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'greet', seg: [40, 47.4],
      stem: 'What are Leslie’s quick questions to Donna doing?',
      choices: ['Saying hi and asking how she is', 'Asking what she is listening to',
                'Asking about the town she grew up in'], a: 0,
      cue: 'ドナに近づいてすぐ、続けて出る3つの問い。',
      line: 'What’s good, baby? *What’s going down* in Donnatown?',
      said: 'ドナに「調子どう？ドナの町では何が起きてる？」と、くだけた言い方で続けて聞く。',
      mean: 'どちらも「最近どう？」というふざけたあいさつ。',
      trap: 'town や good を文字通りに取ると、町の話に聞こえる。返事の内容に引っぱられず、あいさつは形で覚える。',
      use: 'Hey, what’s good? Long time!（よう、元気？久しぶり！）' },

    // R fix: V2, blind 60 %; "worried about work" was a filler, now a sincere-pride misreading; notes trimmed
    // why: glad ← "my husband" heard as a proud answer she's been waiting to give; shy ← "my husband" + a sharp reply read
    //   as embarrassment (日本語の照れ)
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'girltalk', seg: [55.3, 63.95],
      stem: 'When Leslie asks April about her love life, how does April react?',
      choices: ['She’s annoyed by the girl talk and wants out', 'She’s glad to talk about her husband at last',
                'She’s too shy to talk about her husband'], a: 0,
      cue: '答えの終わりの呼び方と、最後の二語。',
      line: '…my husband, *weirdo*. Can I get back to work now? *Thanks. Bye.*',
      said: '「夫に決まってるでしょ、変な人。仕事に戻っていい？どうも、じゃあね」と返す。',
      mean: 'weirdo と一方的な Thanks. Bye. で、早く切り上げたい気持ちが出る。',
      trap: '恋の話を嫌がる様子は照れにも見える。呼び名と締め方で本音を聞く。',
      use: 'Can I get back to work now?（もう仕事に戻っていい？）' },

    // R fix: V2, blind 70 %: "really for" in the stem flagged a hidden purpose, and "goodbye party" was weak; notes trimmed
    // why: bond ← the Galentine's script (women bonding) that the talking head turns into a test; cheer up ← "she is
    //   gone, and I have accepted it" heard as the reason for a party
    { id: 'g1', skill: 'gist', level: 'B2', point: 'tryout', seg: [71.7, 100.1],
      stem: 'What is the brunch for, as Leslie explains it to the camera?',
      choices: ['Trying out the women to find one new Ann', 'Getting the women to bond as one group',
                'Cheering herself up now that Ann is gone'], a: 0,
      cue: 'カメラに向かって話す部分、何をするつもりか。',
      line: '…so I will *test them out* on the ultimate battlefield of female friendship…',
      said: 'カメラに「パーニーに住むアンが必要。候補を試す」と話す。',
      mean: '楽しい会に見えて、実は親友の選考会。battlefield（戦場）が本音を表す。',
      trap: '女性の会なので、仲良くなる会や気晴らしに聞こえやすい。カメラへの一言で目的が分かる。',
      use: 'Let’s test it out this weekend.（今週末に試してみよう）' },

    // R fix: V2, blind 50 %: "Wait," in the stem signalled surprise, pointing at the negative; cut; notes trimmed
    // why: were gonna ← the t of weren't drops, leaving "were"; wouldn't ← the same w…n't shape and the same sense;
    //   wanted to ← "gonna" ≈ "wanna"
    { id: 's1', skill: 'sound', level: 'B2', point: 'werent', seg: [75.5, 82.5],
      stem: 'Fill the gap: “I thought you ___ do Galentine’s Day this year…”',
      choices: ['were gonna', 'weren’t gonna', 'wouldn’t', 'wanted to'], a: 1,
      cue: '「I thought you」のあと、短い音のまとまり。',
      line: 'I thought you *weren’t gonna* do Galentine’s Day this year because…',
      said: '「今年はやらないと思ってた。あの人が引っ越したから」と言う。',
      mean: 'weren’t gonna ＝ 〜するつもりじゃなかった。理由と合う。',
      trap: 'weren’t の t が落ちて were に聞こえやすい。否定は後ろの理由と合うかで確かめる。',
      use: 'I thought you weren’t coming!（来ないと思ってた！）' },

    // R drop: nt1 (C2 attitude, "I have accepted it", never shipped). V2: blind 65 % ("As a front" was the only knowing
    //   reading). It also shared `tryout` with gist g1, so it could never be drawn on g1's plays: with harder on, play 3
    //   (a g1 play) found no C2 left in 9 of 20 seeds, which fails the repo's draw test. Replaced by nt4 on another point.

    // R fix: notes trimmed to ≤ 120 (the item itself passes: blind 35 %, wrong)
    // why: guess ← the question form taken literally, as a quiz; change the subject ← "jacuzzi" heard as a new topic
    //   (her home)
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'boast', seg: [125.2, 130.95],
      stem: 'After “When did you go to Asia?”, what does her question back do?',
      choices: ['It proves she has been there, as a boast', 'It asks the others to guess where she shops',
                'It turns the talk to her house and jacuzzi'], a: 0,
      cue: '「I go all the time」に続く、質問の形の一文。',
      line: 'I go all the time. *Where do you think I got* that…',
      said: '「しょっちゅう行ってる。あの置き物、どこで買ったと思う？」と返す。',
      mean: '答えを求めない質問。「アジアに決まってる」と、行った証拠を自慢している。',
      trap: '疑問文なので「当てて」と聞こえやすい。Where do you think…? は自慢にも使う。',
      use: 'Who do you think made this cake?（このケーキ、誰が作ったと思う？）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'wayback', seg: [134.3, 139.4],
      stem: 'Type what Leslie says about Donna: “Confident, worldly, we ___.” (3 words)', answer: 'go way back',
      cue: '「worldly」のあと、短い3語。',
      line: 'Donna Meagle, confident, worldly, we *go way back*.',
      said: 'ドナについて「自信家で世慣れてる。昔からの付き合い」と言う。',
      mean: 'go way back ＝ ずっと前からの知り合い。way は「ずっと」を強める語。',
      trap: 'way を「道」と取ると意味が通らない。3語がつながり「ゴウェイバック」に聞こえる。',
      use: 'Oh, we go way back.（ああ、古い付き合いなんだ）' },

    // R fix: notes trimmed to ≤ 120 (the item passes: blind 45 %)
    // why: not pretty ← "hot" = attractive, the slang every learner knows; popular ← "not like" missed, flipping the line
    //   to its opposite
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'sohot', seg: [140.4, 148.8],
      stem: 'After calling Shauna “a real fixer-upper”, what does Leslie say about Ann?',
      choices: ['Ann’s life wasn’t going well then either', 'Ann wasn’t very good-looking back then',
                'Ann was the most popular girl back then'], a: 0,
      cue: '「but look」のあと、Ann の話。',
      line: '…a real fixer-upper, but look, it’s *not like Ann was doing so hot* when I met her.',
      said: '「手のかかる人。でも出会ったころのアンだって調子よくなかった」と言う。',
      mean: 'not doing so hot ＝ うまくいっていない。ショーナにも見込みはある、という理屈。',
      trap: 'hot を「見た目がいい」と取りやすいが、調子の話。',
      use: 'I’m not doing so hot today.（今日はあまり調子が良くない）' },

    // R new: nt4, C2 pragma on f2's point, replacing nt1. Blind read before the transcript check: 40 % (the dig at Ann
    //   is as tempting as the key).
    // why: dig ← right mechanism, wrong target: an unflattering line about Ann heard as spite now that she's gone;
    //   write off ← right target, wrong direction: the list of flaws heard as the verdict, "but look" missed
    // anchor: 144.3–147.7 s "a real fixer-upper, but look, it's not like Ann was doing so hot when I met her": "but
    //   look" turns from Shauna's flaws to a reason she could still work, and "when I met her" puts Ann's trouble
    //   before their friendship, as the precedent
    { id: 'nt4', skill: 'pragma', level: 'C2', point: 'sohot', seg: [140.4, 148.8],
      stem: 'Right after “a real fixer-upper”, what is Leslie’s line about Ann doing?',
      choices: ['Talking herself into Shauna as a real choice', 'Taking a dig at Ann now that she’s gone',
                'Writing Shauna off, since Ann was hard work'], a: 0,
      cue: '欠点の列のあと、but look からの理屈。',
      line: 'Shauna… *pretty, fragile*, makes terrible life decisions, a real fixer-upper, *but look*, it’s not like Ann…',
      said: '欠点を並べてから but look と切りかえ、昔のアンも調子が悪かったと言う。',
      mean: 'アンをけなすのが目的ではない。「アンも最初はそうだった」と、ショーナを候補に残す理屈。',
      trap: '悪口に聞こえやすいが、when I met her で話は過去。but のあとは、誰の弁護かを聞く。',
      use: 'Sure, he’s messy. But look, so was I.（確かにだらしない。でも、僕だってそうだった）' },

    // R fix: V2, blind 70 % (the key was the only idiom-like meaning); distractors now read like idiom meanings too;
    //   notes trimmed
    // why: dark moods ← "dark" read literally, with "crotchety" right after it; works hard ← "horse" read literally
    //   (働き者の馬)
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'darkhorse', seg: [147.3, 151.9],
      stem: 'What does Leslie mean by the first thing she calls Ethel?',
      choices: ['Someone who might surprise everyone', 'Someone hard to read, with dark moods',
                'Someone who works hard, with no thanks'], a: 0,
      cue: '「Ethel」の名前のすぐあとの言い方。',
      line: 'Ethel Biebers, bit of a *dark horse*, crotchety, but probably wise.',
      said: 'エセルを「ちょっとダークホース。気難しいけど、たぶん賢い」と言う。',
      mean: 'dark horse ＝ 実力が知られていない人。意外な活躍への期待。',
      trap: 'dark から暗い性格を連想しやすく、あとの crotchety も後押しする。比喩は全体で覚える。',
      use: 'She’s a bit of a dark horse.（彼女は意外な実力者かも）' },

    // R fix: V2, blind 50 %; "a real pick" was weak; now "a.k.a. fake Ann" heard as a likeness; notes trimmed
    // why: reminds ← "a.k.a. fake Ann" heard as why she's there; old friend ← "we go way back", said of Donna,
    //   carried over
    { id: 'i1', skill: 'infer', level: 'B2', point: 'bodies', seg: [151.9, 159.65],
      stem: 'From Leslie’s words about Evelyn, why is Evelyn at the brunch?',
      choices: ['Because they needed people to fill seats', 'Because she reminds Leslie of Ann',
                'Because she’s an old friend of Leslie’s'], a: 0,
      cue: '名字の話のあと、honestly で始まる一言。',
      line: 'And then we got Evelyn, a.k.a. fake Ann. … Honestly, *we just needed bodies*.',
      said: 'イヴリンを「別名ニセのアン。名字も知らない。正直、人数合わせ」と紹介する。',
      mean: 'need bodies ＝ 頭数がほしい。候補ではなく、席を埋めるため。',
      trap: 'fake Ann から「アンに似ている」と取りやすい。honestly のあとが本当の理由。',
      use: 'We need more bodies for the game.（試合の人数が足りない）' },

    // R fix: V2, blind 55 % ("no one" was weak, and "mostly since" was the only hedge); two Shauna readings now;
    //   notes trimmed
    // why: Donna ← "first place" heard as her winning; best answers ← Shauna is the one who stayed for the questions,
    //   heard as winning them
    { id: 'g2', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['default'], seg: [156.6, 293.8],
      stem: 'How does Leslie’s search for a new best friend end up?',
      choices: ['With Shauna, the one guest left at the end', 'With Donna, who was first in the rankings',
                'With Shauna, who did best on the questions'], a: 0,
      cue: '最後の二人の言葉と、それまでに帰った人。',
      said: '順位表が見つかり、ドナたちは怒って帰る。残ったショーナに「消去法で」と決める。',
      mean: '選考会は、選ばれる側が去って崩れる。勝ち残りではなく、残っただけ。',
      trap: 'first place が聞こえるとドナに決まったと思いやすい。一位でも帰った人は選べない。',
      use: 'Looks like it’s just you and me.（どうやら、あなたと私だけね）' },

    // R fix: S3, the cue's "Day" was a word only the key had ("day"); notes trimmed
    // why: not a holiday ← "not technically" heard as "not really a holiday"; not just women ← "a group of women" heard in
    //   the wrong relation
    { id: 'd3', skill: 'detail', level: 'B1', point: 'date', seg: [159.4, 169.55],
      stem: 'Right after “happy Galentine’s Day”, what does Leslie admit?',
      choices: ['Today isn’t the right day for it', 'It isn’t really a holiday at all', 'It isn’t meant just for women'],
      a: 0,
      cue: 'お祝いの言葉のすぐあと、Now で始まる一文。',
      line: 'Now this is *not technically the right date*, but any time a group of women…',
      said: '「厳密には今日じゃないけど、女性がブランチに集まればその精神」と言う。',
      mean: 'not technically ＝ 厳密には違う。日付の違いを認めて流す。',
      trap: 'technically を落とすと「本当の祝日じゃない」に聞こえる。何が違うかは最後の語で。',
      use: 'Technically, it’s not my birthday yet.（厳密には、まだ誕生日じゃないけど）' },

    // R fix: V2, blind 75 % (the key was the only non-literal reading); now a second "test" reading, wrong in what is
    //   tested; notes trimmed to ≤ 140
    // why: know me ← right mechanism, wrong target: a quiz on Leslie herself (her "correct answer" later makes it
    //   tempting); just a game ← "just for fun, nothing serious" taken at face value
    // anchor: 174.9–179.8 s "nothing serious" is followed by "complete honesty… I'll be able to tell if you're lying":
    //   no one polices a game that's only for fun, and lying is about yourself, not about knowing her
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'test', seg: [173.97, 181.2],
      stem: 'Which plain-English version keeps what Leslie means about her questions?',
      choices: ['“It’s a game in name, but I’m judging you.”', '“It’s a quiz on how well you know me.”',
                '“It’s just a game, so relax and have fun.”'], a: 0,
      cue: '「nothing serious」と、そのあとの頼み方の差。',
      line: 'Just for fun, *nothing serious*. But please answer them with *complete honesty* because *I’ll be able to tell if you’re lying*.',
      said: '「ただの遊び、深い意味はない。でも完全に正直に答えて。うそはわかるから」と言う。',
      mean: '遊びにうそ発見はいらない。「深い意味はない」の直後に本気がもれ、品定めの場だと分かる。',
      trap: '「私をどれだけ知ってるか」のクイズではない。うそを見抜くのは本人の答え。軽い言葉のあとの but に本気。',
      use: 'Just a quick chat. Nothing serious.（ちょっと話すだけ。深い話じゃない）' },

    // R fix: V2, blind 55 % (the key was the only one about the pattern); now three readings of her "but"; notes trimmed
    // why: true favorite ← "but… actually" promises a different show, and the name is heard as new; fashion ← "for
    //   fashion" heard as a change of subject away from TV
    { id: 'h2', skill: 'humor', level: 'C1', point: 'scandal', seg: [186.5, 201.1],
      stem: 'Why is Donna’s answer about her favorite show funny?',
      choices: ['Her “but” promises a change that never comes', 'Her “but” brings in her true favorite at last',
                'Her “but” turns the talk from TV to fashion'], a: 0,
      cue: '分け方が変わるたびに、何が答えになるか。',
      line: 'For live tweeting, it’s Scandal… But for fashion, it’s *actually Scandal*. *My answer is Scandal*.',
      said: '「実況も一気見もスキャンダル、でもおしゃれなら実はスキャンダル」。',
      mean: 'but と actually で別の答えを予告し、結局同じ番組。期待を外す笑い。',
      trap: 'but や actually は変化の合図だが、ここはわざと裏切る。番組名を最後まで聞く。',
      use: 'For lunch? Pizza. For dinner? Also pizza.（昼はピザ。夜も、やっぱりピザ）' },

    // R fix: V2, blind 60 % ("watch together" was a filler); now "correct" read as correcting Donna; notes trimmed
    // why: joke ← a host's playful "the right answer is my show!", a common party tease; fixing ← "correct answer" heard
    //   as setting Donna's facts straight
    { id: 'i2', skill: 'infer', level: 'C1', point: 'test', seg: [219.9, 227],
      stem: 'When Leslie gives her own answer to the TV question, what does it show?',
      choices: ['She is grading their answers against hers', 'She is joking, to lighten up a dull game',
                'She is fixing a mistake in Donna’s answer'], a: 0,
      cue: '自分の答えの言い出し方と、相手の聞き返し。',
      line: '*The correct answer* for favorite TV show is Friday Night Lights. — *The correct answer?*',
      said: '「好きな番組の正解はフライデー・ナイト・ライツ」と言い、「正解？」と聞き返される。',
      mean: '好みに正解はない。自分の答えを基準に採点しているのがもれた。',
      trap: '冗談や、ドナの答えの訂正に聞こえやすい。聞き返しが、冗談に聞こえなかった証拠。',
      use: 'There’s no right answer here.（これに正解はないよ）' },

    // R fix: notes trimmed to ≤ 120 (the item passes: blind 40 %, wrong)
    // why: Rome ← her solo trip, the story she told earlier, carried over; blog posts ← "based on my blog" in the wrong
    //   relation
    { id: 'd5', skill: 'detail', level: 'B1', point: 'memoir', seg: [242.6, 254.1],
      stem: 'What is Shauna’s memoir about?',
      choices: ['Finding happiness by smiling through pain', 'Her trip alone to Rome after a breakup',
                'The most-read posts from her blog'], a: 0,
      cue: '「it’s about」のあと。',
      line: '…it’s about my journey to *find happiness by smiling through the pain*.',
      said: 'ブログが元の回想録で、「痛みを笑顔でこらえ幸せを探す旅」の話。',
      mean: 'smile through the pain ＝ つらくても笑ってしのぐ。',
      trap: '先に聞こえる based on my blog に引っぱられやすい。中身は about のあと。',
      use: 'Just smile through it.（笑って乗り切ろう）' },

    // R fix: V2 + K6, blind 55 %: the key was the only hedged choice; now a hedged sincerity flip too; notes trimmed
    // why: hiding ← the Japanese frame: a short "Okay" heard as modest praise held back; work with her ← "work with"
    //   read literally, as working together on the book
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'workwith', seg: [242.6, 254.1],
      stem: 'After Shauna’s memoir answer, what does the reply show?',
      choices: ['Not wowed, but it’s something to build on', 'Impressed, but hiding it behind “okay”',
                'Keen to work with her on writing it'], a: 0,
      cue: '答えのあと、Okay で始まる短い返事。',
      line: 'Okay, *I can work with that*.',
      said: 'ショーナの話を聞いて「まあ、それなら何とかなる」と返す。',
      mean: 'I can work with that ＝ 理想ではないが使える。妥協の一言。',
      trap: 'Okay を控えめなほめ言葉、work with を「一緒に働く」と取りやすい。that は話の中身。',
      use: 'Not perfect, but I can work with that.（完ぺきじゃないけど、それでいける）' },

    // R fix: V2 + K1, blind 55 %; "she claims it's just memories" was also a defensible joke in the segment, so the stem
    //   now points past "Friendship rankings"; the key was the longest by far; notes trimmed
    // why: herself ← "for me… which one of you" heard as her ranking herself too; memories ← "jotting down memories",
    //   said just before, taken as the explanation
    { id: 'h3', skill: 'humor', level: 'C1', point: 'notwhat', reveals: ['test'], seg: [253.75, 267.5],
      stem: 'Once “Friendship rankings” is read out, why is Leslie’s explanation funny?',
      choices: ['She denies it, then describes just that', 'She says it only holds memories of today',
                'She admits she ranks herself in it, too'], a: 0,
      cue: '否定の一言のあと、simply で始まる説明。',
      line: 'It’s *not what it sounds like*. It’s simply a way for me to figure out *which one of you is the best*.',
      said: '「友情ランキング」を読まれ、「そういうのじゃない。誰が一番か見きわめる方法」と言う。',
      mean: '否定したそばから、ランキングそのものを説明する。言い訳が白状になる笑い。',
      trap: '前の「思い出」に引っぱられやすい。否定のあとの説明が本当に違うかを聞く。',
      use: 'Okay, this isn’t what it looks like.（待って、これは見た目どおりじゃないの）' },

    // R fix: notes trimmed to ≤ 120 (the item passes: blind 45 %)
    // why: low rank ← "angry" + rankings: the usual reason to be upset, against "first place"; teasing ← her cheery
    //   question read as a joke
    { id: 'i3', skill: 'infer', level: 'C1', point: 'firstplace', seg: [267.6, 276.2],
      stem: 'What does Leslie’s question to Donna show about Leslie?',
      choices: ['She thinks a top rank should please Donna', 'She thinks Donna is upset about a low rank',
                'She knows Donna’s not angry and is teasing'], a: 0,
      cue: 'Donna への問いと、そのすぐあとの理由。',
      line: 'Donna, why are you angry? *You were in first place*.',
      said: '帰ろうとするドナに「何で怒ってるの？一位だったのに」と言う。',
      mean: '順位をつけられたこと自体が嫌なのに、一位なら喜ぶはずと思っている。そのずれ。',
      trap: '怒る理由は順位の低さ、という型で聞きやすい。first place で順位の話は消える。',
      use: 'Why the long face? You won!（なんで浮かない顔？勝ったのに）' },

    // R fix: K1, "too polite to say" claimed politeness, but leaving the word out here is a pointed jab; key reworded;
    //   notes trimmed to ≤ 140
    // why: lost for words ← the pause heard as delight too big for words (sincerity flip); talked over ← the gap heard as
    //   someone cutting in
    // anchor: 275.9–280.2 s a 2 s gap between "really" and "brunch" that no one fills, between "That's messed up… I'm
    //   leaving" (268–271.5 s) and "If you do this again next year, don't call me" (281.6–285.6 s)
    { id: 'nt3', skill: 'attitude', level: 'C2', point: 'brunch', seg: [272.3, 286.3],
      stem: 'In “This was a really… brunch”, what does the gap leave out?',
      choices: ['A harsh word she leaves them to fill in', 'A kind word so big she can’t find it',
                'Words cut off when someone talks over her'], a: 0,
      cue: '「really」と「brunch」の間の沈黙。',
      line: 'Bye, everyone. This was a *really…* brunch. … If you do this again next year, *don’t call me*.',
      said: '「じゃあね。ほんとに…なブランチだった」と形容詞を抜いて帰る。続けて「次は呼ばないで」。',
      mean: '入るはずの語を飲みこみ、聞き手に埋めさせる遠回しな批判。言わないことで、ひどかったと伝える。',
      trap: '言葉に詰まると、感動で言葉が出ないようにも聞こえる。前後の「帰る」「呼ばないで」と合わせて聞く。',
      use: 'Well, that was… an experience.（いやあ、なんというか…いい経験だったよ）' },

    // R fix: V1 + V2, blind 70 %: the walkout alone answered it ("the only one who stayed"), not the phrase; now every
    //   choice fits a guest who stayed, and only "by default" picks the key; notes trimmed
    // why: loyal ← wrong implication: staying heard as a merit that won her the spot; safe pick ← katakana デフォルト =
    //   the standard setting, plus "no one obvious candidate" earlier
    { id: 'f4', skill: 'phrase', level: 'B2', point: 'default', seg: [286.5, 293.8],
      stem: 'Why is Shauna the new best friend, according to the last lines?',
      choices: ['Only because no one else is left', 'Because staying showed she’s loyal',
                'Because she was the safe, standard pick'], a: 0,
      cue: '「Well」のあとの二語と、そのくり返し。',
      line: 'Well, *by default*, it’s Shauna. … *By default?*',
      said: '「まあ、消去法でショーナかな」と言い、「親友をそうやって決めるの？消去法で？」と返る。',
      mean: 'by default ＝ ほかに残っていないから。勝ち取ったのではない。',
      trap: 'カタカナのデフォルトから「定番」、残ったことから「忠実さ」と取りやすい。',
      use: 'I won by default; nobody else came.（不戦勝だよ、誰も来なかった）' },
  ]
};
