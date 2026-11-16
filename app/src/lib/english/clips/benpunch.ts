// REVIEW 2026-11-16: pass 6, fix 18, drop 0, new 0; ear checks 0
// “Ben Punches a Jerk for Leslie | Parks and Recreation” (the official Parks and Recreation channel, Season 4): at a
// campaign bowling night Leslie works on a voter, Derek, who says no; she wins a rematch bet for his vote, and after the
// fight (left out) she defends Ben to the police officer, Randy.
// Segments from the captions, words from whisper (2026-11-16). Left out on purpose: 151–176 s (Derek's slur and the
// punch), the "female bird" / "Tweety Bird" teasing at 30–44 s (an insult as the point), the beer exchange at 110–115 s
// (the sources differ), and the last 10 s ("hurt fingies" is garbled in the captions, and who says it is unclear).
// The sources differ at 27.5 s ("Ron crushed" / "Ron cross"), 107.5 s ("Not now, Ben" / "now then") and 201.9 s ("jerk
// or" / "Jericho"); no line or key uses those words.
// EAR CHECK: none (every key rests on words both sources agree on; no item depends on who is speaking beyond a name
//   said in the audio)
import type { Clip } from '../types.ts';

export const benpunch: Clip = {
  id: 'benpunch', video: '3dABiuPc_Fg', title: 'Ben Punches a Jerk for Leslie',
  dur: 221, wpm: 144, band: 'slow',
  tags: ['友だち', 'お願い・断り'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 75 %): "poor throw" and "after a miss" made the key the only plain negative. All three now read
    //   the same "if you were" frame (mock / comfort / real question).
    // why: comfort ← "if you were, you did a great job" heard as a kind face-saver after a bad throw; real question ←
    //   "were you trying to get a seven?" taken at face value
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'seven', seg: [12.9, 19.8],
      stem: 'When Ron is asked about “trying to get a seven”, what is the speaker doing?',
      choices: ['Mocking him with fake praise for a bad throw', 'Comforting him with kind words for a bad throw',
                'Asking if the throw went the way he planned'], a: 0,
      cue: '後半の if で始まる条件と、Ron の返事。',
      line: 'Hey Ron, were you trying to get a seven? Because *if you were, you did a great job*.',
      said: '「7本狙い？それなら大成功だね」と言われ、Ron は「今かなり怒ってる」。',
      mean: '狙ったはずがないと知っていて「狙いどおりなら上出来」と言う。',
      trap: 'great job だけならほめ言葉。if you were と怒った返事で皮肉と分かる。',
      use: 'If that was the plan, nice work.（それが狙いなら、お見事）' },

    // R fix: K6: the key was the only hedged choice ("might"). All three now hedge the same way.
    // why: bruised ← "might" heard as a hedge, so the injury sounds mild; out of joint ← "my finger was in there" heard as
    //   a finger caught and twisted
    { id: 'd1', skill: 'detail', level: 'B1', point: 'finger', seg: [24.0, 30.3],
      stem: 'What does the hurt player think about his finger?',
      choices: ['It might be broken', 'It might be bruised', 'It might be out of joint'], a: 0,
      cue: 'I think のあと、指の状態を言う部分。',
      line: 'I think it *might be broken*.',
      said: '「指がはさまってた。折れてるかもしれない」と訴える。',
      mean: 'might be ＝ 〜かもしれない。broken は骨折。本人は大ごとだと思っている。',
      trap: 'might は弱く速く、その後の語を聞き落としやすい。状態は be のあとの語で判断。',
      use: 'I think I might have sprained it.（ねんざしたかも）' },

    // R fix: V2 (blind 60 %): the goodbye and the invite were weak. Now "ending on a friendly note" and "setting up a
    //   rematch" (a rematch does come later, so it's a keyword trap in the wrong place).
    // why: friendly close ← "Well, congratulations" and "See you around" sound like the night is ending; rematch ← "fun
    //   match, fun game", and a rematch really happens later in the clip
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'warmup', seg: [47.4, 61.65],
      stem: 'What is Leslie doing with “Well, congratulations, man. Fun match…”?',
      choices: ['Warming him up before making a request', 'Ending the night on a friendly note', 'Setting him up for a rematch later'], a: 0,
      cue: '「See you around」のあと、彼女が続ける言葉。',
      line: 'Well, congratulations, man. Fun match… — … *Uh, just one second.* I’m running for city council',
      said: '「楽しかった？」と雑談し、帰りかけた彼を「ちょっと待って」と止めて本題へ。',
      mean: '雑談で場を温めてから頼む。just one second が本題の合図。',
      trap: '「お疲れさま」の形なので別れに聞こえやすい。あいさつの後に何が来るかを聞く。',
      use: 'Before you go, one quick thing.（帰る前に、ひとつだけ）' },

    // R fix: V2 (blind 85 %): "votes" was the obvious ask once all three said "council race". Now asks how her pitch
    //   to Derek turns out; the bet is a near miss (she offers it later, he doesn't). Reveals the refusal items.
    // why: his terms ← the bet ("If I win, I get your vote") pinned on Derek and moved earlier; decide later ← "I don't
    //   think so" read as real doubt, with the rematch still to come
    { id: 'g1', skill: 'gist', level: 'B1', point: 'event', reveals: ['yeahno', 'counting'], seg: [47.4, 104.0],
      stem: 'How does Leslie’s pitch to Derek go, before the rematch?',
      choices: ['He had fun but still won’t give her his vote', 'He’ll give her his vote only if she beats him',
                'He’ll decide about his vote after the game'], a: 0,
      cue: '「city council」のあと、2回の返事。',
      line: 'do I have your vote? — *No.* … — Yeah, no, uh, *I don’t think so*.',
      said: '市議選の一票を2回頼むが、Derek は2回とも断る。楽しかったのに、と彼女は食い下がる。',
      mean: 'ボウリングは票集めの場。楽しく過ごしても、一票はもらえない。',
      trap: '「勝ったら投票」は Leslie があとで出す条件。誰が言ったかと順番を聞き分ける。',
      use: 'Can I get your vote?（一票お願いできる？）' },

    // R fix: V2 (blind 55 %): the key was the only natural paraphrase, and "free" only in the key. All three now carry
    //   "free" or "complain", built on the two misreadings of "one".
    // why: one complaint ← "one" heard as the number before "complain"; only one ← "not one" heard as "the only one who
    //   didn't"
    { id: 'f1', skill: 'phrase', level: 'C1', point: 'notone', seg: [51.7, 57.05],
      stem: 'When Leslie asks if he had fun, what does Derek say about himself?',
      choices: ['He won’t complain about anything that’s free', 'He has just one complaint about the free stuff',
                'He is the only one here with no complaints'], a: 0,
      cue: 'Yeah のあと、one の前後のまとまり。',
      line: 'Yeah, *I’m not one to complain* about free beer and free bowling.',
      said: '「楽しかった？」に「タダのビールとボウリングに文句は言わない」。',
      mean: 'I’m not one to ～ ＝ 〜するタイプではない。タダなら喜んで、という返事。',
      trap: 'one を数字の「1」と取ると「文句がひとつ」になる。後ろは動詞。',
      use: 'I’m not one to say no to cake.（ケーキを断るタイプじゃないの）' },

    // R fix: V2 (blind 60 %): the key was the only "X, not Y" contrast. Now the mirror reading (her company, not the
    //   freebies) is the near miss, and the gripe reading is phrased the same way.
    // why: her company ← the friendly "Yeah" read as goodwill toward her (a pleasant reply = a soft yes); beer let down ←
    //   "I'm not one to complain, but…" is a common lead-in to a complaint, so a hidden gripe is expected
    // anchor: 52.5–55.9 s praise only for "free beer and free bowling", no "but", then "See you around"; 65.3 s "No.";
    //   82.2 s "I don't like you, okay?"
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'notone', reveals: ['yeahno'], seg: [51.7, 57.05],
      stem: 'When asked if he had fun, what is Derek leaving unsaid?',
      choices: ['The free stuff, not Leslie, made it fun', 'Leslie’s company, not the free stuff, made it fun',
                'The bowling was fun, but the beer was not'], a: 0,
      cue: '何について楽しかったと言っているか。',
      line: 'Yeah, I’m not one to complain about *free beer and free bowling*. See you around.',
      said: '「楽しかった？」に「タダのビールとボウリングに文句はないよ。じゃあね」。',
      mean: 'ほめるのはタダの物だけで、Leslie には触れない。この後、投票を断り「あなたが嫌い」。',
      trap: 'not one to complain, but… なら不満の前置きだが、but は来ない。何に触れないかを聞く。',
      use: 'The food was great, I’ll give them that.（料理は良かった、それは認める）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'count', seg: [68.2, 71.2],
      stem: 'Type her question: “___ your vote?” (4 words)', answer: 'can i count on',
      cue: '「For reals」のすぐあと。',
      line: 'For reals. *Can I count on* your vote?',
      said: '「マジで。投票してくれる？」と再び頼む。count on は「カウントン」。',
      mean: 'Can I count on ～? ＝ 当てにしていい？支持を確かめる形。',
      trap: 'can は「クン」と弱く、count と on もつながり、語数を少なく聞きやすい。',
      use: 'Can I count on you for Saturday?（土曜、当てにしていい？）' },

    // R fix: V2 (blind 55 %): the key was the only two-part, nuanced choice. All three now name an answer plus how it
    //   moves from his first "No."
    // why: yes ← "Yeah" comes first, and the first word is taken as the answer; maybe ← "I don't think so" read as real
    //   doubt (思わない = not sure yet)
    { id: 'p3', skill: 'pragma', level: 'B2', point: 'yeahno', seg: [69.3, 73.3],
      stem: 'When Leslie asks a second time, what is Derek’s answer?',
      choices: ['A no again, put more gently', 'A yes this time, after a pause', 'A maybe, as he starts to soften'], a: 0,
      cue: '最初の2語の組み合わせと、そのあとの文。',
      line: '*Yeah, no*, uh, *I don’t think so*.',
      said: '2回目のお願いに「うん、いや、それはないかな」と答える。',
      mean: 'Yeah, no は断りの決まった言い方。後ろの文も丁寧な no。',
      trap: '最初の Yeah で yes と思いやすいが、すぐ no が来る。think も迷いではない。',
      use: 'Yeah, no, I’m good, thanks.（いや、大丈夫です）' },

    // why: promise ← "still not gonna vote" heard as going back on a promise; a win ← the bet comes a little later, so a
    //   win seems to be what she was relying on
    { id: 'i1', skill: 'infer', level: 'B2', point: 'counting', seg: [73.0, 81.75],
      stem: 'From how Leslie protests, what had she been counting on?',
      choices: ['A fun night would win his vote', 'He had already promised his vote', 'A win at bowling would earn his vote'], a: 0,
      cue: 'but のあとの、2つの have been。',
      line: '*But we’ve been here bowling all night*, and *we’ve been having fun*. And you’re still not gonna vote for me?',
      said: '「一晩中ボウリングして楽しんだのに、まだ投票しないの？」と食い下がる。',
      mean: '楽しく過ごせば票になると期待していた。still に当てが外れた気持ち。',
      trap: 'still not から「約束を破った」と取りやすいが、約束の話はない。根拠は but の後。',
      use: 'But we’ve had such a nice time!（こんなに楽しかったのに！）' },

    // R fix: V2 (blind 60 %): "beat her without trying" was weak. Now "faked having fun", the word "pretended" in the
    //   wrong relation (fun was the topic just before).
    // why: faked fun ← "pretended" heard, attached to the "having fun" talk just before; the beer ← "free beer" from
    //   earlier, a ready excuse for losing
    { id: 'd2', skill: 'detail', level: 'B1', point: 'pretend', seg: [84.4, 88.45],
      stem: 'What does Derek claim about the game they played?',
      choices: ['He let her beat him on purpose', 'He only faked having fun at it', 'He lost because of the free beer'], a: 0,
      cue: 'bowler のあと、and に続く部分。',
      line: 'you’re a … bowler, and *I pretended to lose* to you.',
      said: '「君は下手だし、わざと負けてあげたんだ」と言う。',
      mean: 'pretend to ～ ＝ 〜するふりをする。負けたのは演技だった、という主張。',
      trap: 'lose と win が近くに出るので、勝ち負けが逆になりやすい。pretended の後の動詞が本当の向き。',
      use: 'I pretended not to notice.（気づかないふりをした）' },

    // R fix: V2 (blind 50 %): the key was the only negative. Now "it stings" (laughing it off) sits beside it.
    // why: stings ← the Japanese frame: a quick laugh read as hiding hurt; half agrees ← "Yeah, right" read word by word
    //   as "yes, that's right"
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'yeahright', reveals: ['pretend'], seg: [88.0, 93.4],
      stem: 'How does Leslie take Derek’s claim about the game?',
      choices: ['She flatly rejects it as total nonsense', 'She laughs, but it clearly stings her', 'She half agrees, a bit embarrassed'], a: 0,
      cue: '返事の最初の2語と、次の動詞。',
      line: '*Yeah, right.* I *destroyed* you. … I’m a really good bowler.',
      said: '「はいはい。私の圧勝でしょ。本当にうまいんだから」と返す。',
      mean: 'Yeah, right. は「そんなわけない」という皮肉の決まり文句。',
      trap: 'Yeah も right も同意の語なので、賛成に聞こえやすい。直後に反対の主張が来れば不信の合図。',
      use: 'Yeah, right. Like that’s gonna happen.（はいはい、ありえないね）' },

    // R fix: S1/V2 (blind 65 %): "sets her terms" in the stem gave the key away. The stem now names the moment, and the
    //   distractors are the two literal readings of "tell you what".
    // why: his terms ← "tell you what" taken word by word, as "tell me what you want"; a secret ← "I'll tell you what"
    //   heard as "I'll tell you what really happened"
    { id: 'm1', skill: 'marker', level: 'B2', point: 'tellyou', reveals: ['bet'], seg: [97.4, 101.1],
      stem: 'Right after “I’d love to”, what does Leslie’s three-word phrase do?',
      choices: ['It signals she’s about to propose a deal', 'It invites him to name his own terms', 'It warns she’s about to reveal a secret'], a: 0,
      cue: 'I’d love to のすぐあと、短い決まり文句。',
      line: 'I’d love to. *Tell you what*. If I win, I get your vote.',
      said: '「喜んで。じゃあこうしよう。私が勝ったら投票してね」と条件を出す。',
      mean: 'Tell you what. ＝「じゃあこうしよう」。取引を持ちかける前置き。',
      trap: 'tell と what を一語ずつ取ると「何が欲しいか言って」に聞こえる。この後には条件が来る。',
      use: 'Tell you what, I’ll pay this time.（じゃあ、今回は私が払うよ）' },

    // why: a week ← "for a" plus a short one-syllable word; a year ← a bigger penalty to match a bigger prize (a vote)
    { id: 'n1', skill: 'number', level: 'B1', point: 'month', seg: [100.6, 104.0], keep: true,
      stem: 'If Derek wins, for how long must Leslie clean his house?',
      choices: ['A week', 'A month', 'A year'], a: 1,
      cue: '「clean my house」のすぐあと。',
      line: 'If I win, you clean my house *for a month*.',
      said: '「俺が勝ったら、1か月うちの掃除をしろ」と返す。',
      mean: 'for a month ＝ 1か月間。for は期間を表す。',
      trap: 'for a が弱く、後ろも短い語に聞こえやすい。month は「マンス」、week は「ウィーク」。',
      use: 'I’m staying for a month.（1か月滞在します）' },

    // why: friend ← "my good friend" heard as Derek being introduced; mix-up ← two "introduce" lines in a row heard as
    //   confusion over who is meeting whom
    { id: 'h1', skill: 'humor', level: 'C1', point: 'introduce', seg: [103.6, 110.55],
      stem: 'Why does the reply to the offer of an introduction get a laugh?',
      choices: ['It turns his polite phrase into a threat', 'It calls Derek her good friend instead', 'It mixes up which person is the friend'], a: 0,
      cue: '2回目の「I’d like to introduce」のあと。',
      line: 'I’d like to introduce you to my good friend… — … *I’d like to introduce* Derek’s … *to my foot*.',
      said: '「いい友だちを紹介したい」に「Derek のお尻を私の足に紹介したい」と返す。',
      mean: '丁寧な紹介の決まり文句で「蹴飛ばしたい」と言う。形と中身の落差が笑い。',
      trap: 'introduce と friend が続くと人の紹介に聞こえる。何を何に紹介するかを聞く。',
      use: 'I’d like you to meet my coworker, Ken.（同僚のケンを紹介します）' },

    // R fix: V2/K6 (blind 65 %): the key was the only two-sided choice. All three are now a stance plus the words that
    //   suggest it.
    // why: consoling ← "what a defeat, man" heard as sympathy; amazed ← "did not expect to win by that much" taken as
    //   real surprise
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'gloat', reveals: ['much'], seg: [136.7, 145.1],
      stem: 'When Leslie greets Derek after the rematch, how does she come across?',
      choices: ['Gloating behind a modest-sounding line', 'Honestly amazed at how big her win was', 'Consoling him with a friendly word or two'], a: 0,
      cue: '最初の呼びかけと、but のあとの一言。',
      line: 'Hey, Derek, *what a defeat*, man. I mean, I did not expect to win by that much, but *I warned you*',
      said: '「大敗だったね。こんな差とは。でも言ったでしょ、うまいって」と話しかける。',
      mean: '控えめな言い方は形だけ。わざわざ相手の所へ行き、勝ち誇っている。',
      trap: 'what a defeat を同情と取りやすい。but の後の「言ったでしょ」が本音。',
      use: 'Told you so.（だから言ったでしょ）' },

    // R fix: V2 (blind 70 %): "bet" was in the key only, and "thanks" was weak. Now the near misses are a free choice
    //   (sincere hope) and a tease (refuted by "All joking aside"). Seg trimmed from 15.7 s to 13.6 s.
    // why: free choice ← "all joking aside" taken at face value, so the line reads as a sincere hope; tease ← her jabs
    //   just before ("what a defeat") make one more jab likely
    // anchor: 99.7–104.0 s "If I win, I get your vote… — Done" (the bet); 139.0–144.8 s "what a defeat… I did not expect
    //   to win by that much": she won, so "looking forward to your vote" collects the prize
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'bet', reveals: ['much', 'aside'], seg: [138.5, 152.1],
      stem: 'After the rematch, how should Derek hear “I’m really looking forward to your vote”?',
      choices: ['As her collecting on the deal from the rematch', 'As a sincere hope he’ll now choose her freely',
                'As a playful tease she doesn’t expect him to honor'], a: 0,
      cue: '試合前に決めた条件と、試合の結果。',
      line: 'I did not expect to win by that much… I’m really *looking forward to your vote* in the spring.',
      said: '大差で勝ったあと、「楽しかった。春の投票、楽しみにしてる」と言う。',
      mean: '試合前に「私が勝ったら投票ね」と決めていた。勝った今、この一言は願いではなく取り立て。',
      trap: '本気の合図のあとで願いに聞こえるが、冗談でもない。前の条件と結果を結びつける。',
      use: 'A deal’s a deal. Pay up!（約束は約束。払ってね）' },

    // R fix: V2/§9.5 (blind 50 %): "by that match" isn't real English, so it fell away. Now "by that many" (pins).
    // why: by that many ← much/many share the start, and pins are counted; by so much ← same meaning, only "that"/"so"
    //   differs; by this much ← that/this, both weak
    { id: 's1', skill: 'sound', level: 'B2', point: 'much', seg: [138.6, 142.65],
      stem: 'Fill the gap: “I did not expect to win ___.”',
      choices: ['by that much', 'by that many', 'by so much', 'by this much'], a: 0,
      cue: 'win の直後、短い3語。',
      line: 'I did not expect to win *by that much*',
      said: '「あんな大差で勝つとは」と言う。that は弱く、much の語尾は「チ」。',
      mean: 'win by ～ ＝ 〜の差で勝つ。by that much ＝ あれほどの差で。',
      trap: 'that/this、much/many は近い音。語尾の「チ」まで聞く。',
      use: 'We won by two points.（2点差で勝った）' },

    // why: another joke ← "joking" is the word heard, and her last line was a jab; goodbye ← it comes at the end of the
    //   night, like a closing line
    { id: 'm2', skill: 'marker', level: 'B2', point: 'aside', seg: [144.7, 149.3],
      stem: 'After Derek’s “Whatever”, what does Leslie’s next phrase signal?',
      choices: ['She is about to speak seriously', 'She is about to make one more joke', 'She is about to say a quick goodbye'], a: 0,
      cue: 'Whatever のあと、文の最初の3語。',
      line: '*All joking aside*, I want to say that I actually had fun',
      said: '「冗談はさておき、本当に楽しかったって言いたいの」と続ける。',
      mean: 'All joking aside ＝ 冗談はさておき。本気の話に切りかえる合図。',
      trap: 'joking が耳に残ると冗談の続きに思える。aside（わきへ置く）まで聞くと逆の意味。',
      use: 'All joking aside, thank you.（冗談抜きで、ありがとう）' },

    // R fix: V2 (blind 55 %): "pain" may be true on screen (his hand) and was weak. Now "anger", the usual reason for a
    //   punch.
    // why: beer ← "free beer" earlier, and he has been drinking; anger ← the usual script after a punch, and "a lot of"
    //   plus a feeling
    { id: 'd7', skill: 'detail', level: 'B1', point: 'adrenal', seg: [179.8, 183.85],
      stem: 'Asked “What’s wrong with you?”, how does Ben explain himself?',
      choices: ['He has a lot of adrenaline', 'He has a lot of anger in him', 'He has had a lot of beer'], a: 0,
      cue: 'I don’t know のあと、a lot of に続く語。',
      line: 'I don’t know. I just… I have *a lot of adrenaline* right now.',
      said: '「どうしたの？」に「分からない。今アドレナリンがすごいんだ」と答える。',
      mean: '興奮して気持ちが高ぶり、自分でも抑えられない、という説明。',
      trap: 'a lot of の後の長い語は聞き取りにくい。英語の adrenaline は「ドレ」が強い。',
      use: 'I’m too wired to sleep.（興奮して眠れない）' },

    // R fix: V2 (blind 60 %): the key was the only realistic step ("damage to the lanes" was odd). Now a doctor's bill
    //   and a public apology, both plausible after a punch.
    // why: bill him ← "charges" = 料金, a charge for his doctor visit; apology ← press = 押す, so pushing Ben for
    //   something
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'charges', seg: [184.4, 187.55],
      stem: 'What does the man who was hit say he might do?',
      choices: ['File a formal complaint against Ben', 'Send Ben a bill for his doctor visit', 'Demand that Ben apologize in public'], a: 0,
      cue: 'might のあとの2語。',
      line: 'guy said he might *press charges*.',
      said: '「殴られた男が、訴えるかもしれないと言っている」と伝えられる。',
      mean: 'press charges ＝ 被害を届けて正式に訴えること。お金の請求とは別。',
      trap: 'charge を「料金」、press を「押す」と取ると別の話に。2語でひとつの法律用語。',
      use: 'Are you going to press charges?（被害届を出しますか）' },

    // R fix: V2 (blind 70 %): the title says Ben punched a jerk for her, so "backs him fully" stood out. All three now
    //   back him and differ in how.
    // why: adrenaline ← Ben's own "a lot of adrenaline" just before, taken up as her excuse; go easy ← the Japanese
    //   frame: after a fight, the partner apologizes to the police for him
    { id: 'g2', skill: 'gist', level: 'B2', point: 'after', seg: [184.4, 203.0],
      stem: 'In the talk with the officer, where does Leslie stand on what Ben did?',
      choices: ['She backs him and wants it put on the record', 'She backs him but begs the officer to go easy',
                'She backs him but blames it on the adrenaline'], a: 0,
      cue: 'Randy への話し方と、Ben のことを言う形容詞。',
      said: '警官に Ben をかばい、ほめ、報告書にまでそう書いてほしがる。',
      mean: '謝る場面になりそうなところで、逆に誇らしげに味方する。そこが笑いどころ。',
      trap: '警察の前では謝るのが普通と考えやすい。人をどんな形容詞で言うかで立場が分かる。',
      use: 'I’ve got your back.（味方だよ）' },

    // R fix: V2 (blind 55 %): "wrong decision" was the only other reading. Now a sincere "right call" (the reply's
    //   "Yeah" read as agreement) and "too late".
    // why: right call ← "Yeah, that really…" heard as agreement; too late ← "will not be pressing charges" heard as news
    //   about the man's side, already settled
    { id: 'i2', skill: 'infer', level: 'C1', point: 'option', reveals: ['charges'], seg: [187.1, 192.1],
      stem: 'What does Randy’s short reply tell Leslie about her announcement?',
      choices: ['It was never really her call to make', 'It was the right call, and kind of her', 'It came too late; the man has decided'], a: 0,
      cue: '彼女の宣言のすぐあと、相手の短い返事。',
      line: 'Randy, I would like you to know that *we will not be pressing charges*. — Yeah, that really *wasn’t an option*.',
      said: '「こちらは訴えません」と言うと、「そもそも選べる話じゃない」と返される。',
      mean: '訴えられうるのは殴った Ben の側。被害者のような口ぶりを正している。',
      trap: 'Yeah で同意と取りやすいが、wasn’t an option は「選べる立場にない」。',
      use: 'Staying home wasn’t an option.（家にいるという選択肢はなかった）' },

    // why: too much ← the Japanese frame: defending a friend with a small admission (やりすぎだけど); unplanned ←
    //   "What Ben did was…" heard as leading to an excuse
    { id: 'f5', skill: 'phrase', level: 'C1', point: 'warrant', seg: [191.8, 197.4],
      stem: 'Besides “awesome”, how is what Ben did described to Randy?',
      choices: ['Fully justified by the man’s behavior', 'A bit too much, but understandable', 'Unplanned; it just happened in the moment'], a: 0,
      cue: 'What Ben did was のすぐあとの語。',
      line: 'the guy was being a total jerk. What Ben did was *warranted* and extremely awesome',
      said: '「相手がひどかった。Ben のしたことは当然で、最高にかっこいい」と言う。',
      mean: 'warranted ＝ 正当な理由がある。硬い語を awesome と並べている。',
      trap: 'かばうとき「やりすぎだけど」と認めがちだが、ここは全面的に正しいという主張。',
      use: 'Your concern is totally warranted.（心配するのはもっともだよ）' },

    // R fix: V2 (blind 50 %): "already finished" was a filler. Now "it would make Ben look worse", a reason an officer
    //   could give.
    // why: disagrees ← the Japanese frame: an officer declining means he doesn't think it was awesome; Ben looks worse ←
    //   "awesome" next to "warranted" heard as a legal worry
    { id: 'd6', skill: 'detail', level: 'B2', point: 'report', seg: [197.4, 202.9],
      stem: 'Why won’t Randy write “awesome” in his report?',
      choices: ['Reports keep out words like that', 'He doesn’t think it was awesome', 'It would make Ben look worse'], a: 0,
      cue: 'When we write のあとの動詞。',
      line: 'When we write official reports, we *refrain from using words like* … awesome.',
      said: '「すごかったって書いた？」に「報告書ではそういう語は使わない」と答える。',
      mean: 'refrain from ～ing ＝ 〜を控える。意見でなく、決まりとして断っている。',
      trap: '断られると「そう思っていない」と取りやすい。理由は報告書の決まり。',
      use: 'Please refrain from using your phone.（携帯電話のご使用はお控えください）' },
  ]
};
