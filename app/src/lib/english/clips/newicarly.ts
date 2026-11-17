// REVIEW 2026-11-17: pass 8, fix 15, drop 1, new 0; ear checks 0
// Open: d2 still reads at about 50 % blind for anyone who knows what whey is; the audio's “No, like…” settles it.
// “The First Episode of the New “iCARLY” 📸 | Full Episode in 5 Minutes | @NickRewind” (NickRewind, the official iCarly
// channel, Best of the New iCarly 🎉): the reboot's first episode cut down to five minutes. Carly goes live expecting
// Beau to suggest a channel together, and he dumps her on camera; her roommate drags her to Spencer's party, where she
// leaves on a timer; a camp friend's date at a whey café goes nowhere; she decides to make things again without Sam,
// and the new iCarly opens with a skin care bit that turns dark.
// Segments from the captions, words from whisper (2026-11-17). Named in the audio: Carly, Beau, Luke, Sam, Spencer,
// Freddie. The roommate is never named (“from Spencer's apartment to ours”), so stems say “her roommate”. Speakers of the
// whey talk aren't named: stems say “the speaker” or “the one who…”, and keys rest on turn order and words.
// Untested on purpose: 7.6 s “Italian QVC” (world knowledge), 16.5 s (captions “record him”, whisper “record it”:
// lines stop before it), 53–57 s (Beau's “we need some time apart” is in whisper only and overlaps Carly's “Start a
// channel together”), 124.7 s (captions “LOSS”, whisper “Plus”), 134 s “finish her thought”, 161–171 s (who says
// “Divine mouthfeel”, “Classic Seattle tap” and who has news to tell), 182 s (captions “let's consider it good luck”,
// whisper “that's considered good luck”: lines stop at “good luck”), 196–201 s (who says “we're done”), 216–231 s (who
// says “You do mean me, right?”; the home-gym joke needs the old studio), 272–278 s (“baby Spencer”, visual), whisper's
// looped repeats at 137–156 s and 224–227 s.
// Long on purpose: i1 (15.8 s) holds both the countdown and the exit; c2 (22.2 s, C2) holds the dark joke, the teasing
// and the closing line.
// 148–161 s: the captions run “No, like the watery part of milk… curds” as one turn; whisper splits it after “of it”,
// so no item rests on who says the definition.
// EAR CHECK: none. The two speaker checks (94–111 s, 117 s) came off: the words settle them (“drag your depression…
//   to ours” is said to the heartbroken one, who answers “I just want to stay here”, sets the timer and, after
//   “while Carly is still here”, leaves), and n2's key doesn't depend on its speaker.
import type { Clip } from '../types.ts';

export const newIcarly: Clip = {
  id: 'newicarly', video: 'dGk-nwwK0sw', title: 'The First Episode of the New “iCARLY”', dur: 302, wpm: 131,
  band: 'slow', tags: ['恋愛', '友だち'],
  show: 'iCarly',
  credit: 'iCarly (NickRewind, official YouTube channel)',
  questions: [
    // why: marry ← “propose” read as a marriage proposal (katakana プロポーズ); job ← “channel” heard, but as his offer
    //   of work
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'propose', seg: [0, 4.4],
      stem: 'In her opening line, what is Carly expecting Beau to do?',
      choices: ['Suggest that the two of them start a channel', 'Ask her to marry him in front of everyone',
                'Offer her a hosting job on his channel'], a: 0,
      cue: '「propose」のすぐあとに続く部分。',
      line: 'I can’t believe Beau’s gonna *propose that we do a channel together*.',
      said: '「ボーが一緒にチャンネルをやろうと言ってくれる」と喜ぶ。',
      mean: 'propose that ～ ＝ ～しようと提案する。結婚の申し込みとは限らない。',
      trap: 'プロポーズ＝結婚と覚えていると引っかかる。propose のあとに that 節が来たら「提案」。',
      use: 'I propose that we leave early.（早めに出ようと提案します）' },

    // R fix: V2 (blind 55 %): the key was the only “big news” choice; now all three are “Her big news …”
    // why: marry ← “propose” (f1's trap) and a big on-camera moment; cut off ← “broken phone” is heard, but it breaks
    //   after Beau has spoken
    { id: 'g1', skill: 'gist', level: 'B2', point: 'stream', reveals: ['propose'], seg: [0, 72],
      stem: 'How does Carly’s big live-stream moment turn out?',
      choices: ['Her big news turns into a breakup on camera', 'Her big news turns into a marriage proposal',
                'Her big news is cut off before Beau can speak'], a: 0,
      cue: '配信中、ボーの話の向かう先と、最後の一言。',
      line: 'You’re just *dumping me*, aren’t you? … a *broken heart* and a broken phone.',
      said: '配信でうれしい話を見せるつもりが、ボーに別れを告げられ、スマホも壊れる。',
      mean: '期待した「一緒にチャンネル」の話が、正反対の別れ話になる。',
      trap: 'propose と broken phone が耳に残ると、結婚や故障の話と取りやすい。結末は最後の一言で。',
      use: 'That didn’t go as planned.（思った通りにはいかなかった）' },

    // R fix: V2 (blind 50 %): “won't ring” was a filler; now “photos as a surprise”, from “secretly” and a near miss
    //   on “record”
    // why: call Sam ← Sam is named just before; photos ← “secretly” heard as a surprise, “record” not caught
    { id: 'd1', skill: 'detail', level: 'B1', point: 'record', seg: [14.55, 17.9],
      stem: 'What does Carly want to use her phone for?',
      choices: ['Recording Beau without him knowing', 'Calling Sam to tell her the news',
                'Taking photos of Beau as a surprise'],
      a: 0,
      cue: '「where should I put my phone」のあと。',
      line: 'where should I put my phone so I can *secretly record*…',
      said: '「こっそり撮るには、スマホをどこに置こう」と考えている。',
      mean: 'secretly ＝ こっそり。ボーの申し出を、本人に知らせずに撮っておきたい。',
      trap: '直前に Sam の名前が出るので「電話する」を選びやすい。so I can のあとが目的。',
      use: 'Can I record this for my mom?（母に見せたいので撮ってもいい？）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'infor', seg: [33.5, 37.6],
      stem: 'Type what she says: “But ___ something really exciting.” (5 words)', answer: 'you guys are in for',
      cue: '「it’s been a while」のあと、but に続く部分。',
      line: 'but *you guys are in for* something really exciting.',
      said: '「すごいものが待ってるよ」と予告する。',
      mean: 'be in for ～ ＝ ～が待っている。guys are in for が「ガイザリンフォ」とつながる。',
      trap: 'are と in が弱く、一語に聞こえやすい。be in for はひと固まりで覚える。',
      use: 'You’re in for a treat tonight.（今夜はお楽しみに）' },

    // R fix: V2 (blind 65 %): “excited” was weak; now “low, but a brave face”, the post-breakup script
    // why: angry ← “the murders” heard as a wish for revenge on Beau; brave face ← “cheer me up” heard as putting on a
    //   cheerful front
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'mood', seg: [85, 99.9],
      stem: 'How is Carly feeling when she talks with her roommate?',
      choices: ['Low, and wanting to stay in', 'Angry, and wanting to get even', 'Low, but putting on a brave face'], a: 0,
      cue: '最初の質問の「depression」と、そのあとの希望。',
      line: 'drag your *depression* down the hall… I just want to *stay here*',
      said: '落ち込みを引きずって来た、と言われ、家にいたいと答える。',
      mean: '失恋のあとで元気がなく、出かけたくない気分。',
      trap: 'murders が聞こえるので怒りと取りやすいが、それはドラマの話で、気持ちは落ち込み。',
      use: 'I just want to stay in tonight.（今夜は家にいたいな）' },

    // why: revenge ← “murders” taken as her own wish (Beau has just dumped her); pretending ← a brave face is the usual
    //   post-breakup script
    { id: 'h1', skill: 'humor', level: 'C1', point: 'murders', seg: [93.7, 100.4],
      stem: 'Why is Carly’s plan for cheering herself up funny?',
      choices: ['Crime shows are an odd way to feel better', 'She is hinting she’d like to hurt Beau',
                'She’s pretending that she is fine with it'], a: 0,
      cue: '「Law & Order」のあとの一文。',
      line: 'rewatch every episode of Law & Order. *The murders will cheer me up*.',
      said: '「刑事ドラマを全話見直す。殺人事件で元気が出るから」と言う。',
      mean: '殺人事件で「元気が出る」というずれが笑い。落ち込みぶりを大げさに見せている。',
      trap: '失恋の直後なので、ボーへの仕返しと取りやすい。the murders はドラマの中の事件。',
      use: 'Sad movies always cheer me up.（悲しい映画を見ると元気が出るの）' },

    // R fix: V2 (blind 70 %): the key was the only one with a condition; now a fries condition and a refuse-then-give-in
    // why: fries ← the fries are heard, but as what comes after; gives in ← “five minutes” heard as a delay before
    //   she agrees
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'terms', reveals: ['out'], seg: [100.5, 111.2],
      stem: 'When her roommate insists on the party, how does Carly answer?',
      choices: ['She agrees, but only on her own terms', 'She agrees, if she can bring her fries',
                'She refuses, then gives in after a while'], a: 0,
      cue: '「We’re going」のあと、timer の話。',
      line: 'I’m *setting a timer*… After that, it’s *back to* numbly eating frozen french fries',
      said: '「タイマーをかける。終わったら冷凍ポテトに戻る」と答える。',
      mean: '行くことは受け入れつつ、時間を区切って自分の条件を付けている。',
      trap: 'french fries が耳に残ると「家に残る」と取りやすい。After that は「行ったあとで」。',
      use: 'Fine, but I’m leaving at ten.（いいよ、でも10時には帰るね）' },

    // R fix: B1/N7: its stem (Carly's timer) answers i1, so it now reveals 'out'
    // why: 15/50 ← the weak, fast “for exactly” blurs the number, and fifteen/fifty are the usual -teen/-ty pair
    { id: 'n1', skill: 'number', level: 'B1', point: 'fivemin', reveals: ['terms', 'out'], seg: [103.9, 107.75], keep: true,
      stem: 'How long does Carly set her timer for?',
      choices: ['5 minutes', '15 minutes', '50 minutes'], a: 0,
      cue: '「exactly」のすぐあとの数字。',
      line: 'I’m setting a timer for exactly *five minutes*.',
      said: '「ちょうど5分のタイマーをかける」と言う。',
      mean: 'exactly ＝ きっかり。それ以上はいない、という強い区切り。',
      trap: 'for exactly が速く、数字が埋もれやすい。fifteen なら「ティーン」が長く強く聞こえる。',
      use: 'Give me exactly two minutes.（きっかり2分ちょうだい）' },

    // why: 40 ← forty-five's “-five” is short and weak; 55 ← fifty/forty swap in fast speech
    { id: 'n2', skill: 'number', level: 'B2', point: 'left', reveals: ['out'], seg: [115.1, 118.9], keep: true,
      stem: 'As Spencer begins his speech, how much time is said to be left?',
      choices: ['1 minute 40 seconds', '1 minute 45 seconds', '1 minute 55 seconds'], a: 1,
      cue: '「while Carly is still here」のあと。',
      line: '*One minute, 45 seconds* to go.',
      said: '「残り1分45秒」と、タイマーの残りを読み上げる。',
      mean: 'to go ＝ 残り。スペンサーの話より、時間の方を気にしている。',
      trap: 'forty-five の five は短く弱い。数字のあとの seconds まで聞いて区切る。',
      use: 'Ten minutes to go!（あと10分！）' },

    // R fix: V2 (blind 70 %): “Freddie has offered” was weak; now “Spencer said she's free to go”, from “while Carly is
    //   still here”
    // why: sculpture ← the reveal comes right before she goes; free to go ← “while Carly is still here” heard as
    //   Spencer letting her leave
    { id: 'i1', skill: 'infer', level: 'B2', point: 'out', reveals: ['left', 'terms'], seg: [116.6, 132.4],
      stem: 'Why does Carly walk out in the middle of Spencer’s speech?',
      choices: ['Her time at the party has run out', 'The sculpture has upset her somehow',
                'Spencer has said she’s free to go'], a: 0,
      cue: '読み上げた残り時間と、最後のひと言。',
      line: 'One minute, 45 seconds to go. … *And I’m out.* Night, guys.',
      said: '残り時間を数え、話の途中で「はい、終わり。おやすみ」と帰る。',
      mean: '自分で決めた時間が来たので、話の途中でも出ていく。',
      trap: '作品の発表直後なので、作品への反応と取りやすい。合図はタイマー。I’m out ＝ 帰るね。',
      use: 'Okay, I’m out. See you tomorrow.（じゃ、帰るね。また明日）' },

    // R fix: V2 (blind 65 %): “Before saying what the café serves” pointed at a preface; the stem now names the
    //   moment only
    // why: look up ← heads up read word by word (顔を上げて); cheer up ← “chin up”, and her low mood
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'headsup', seg: [148.4, 152.5],
      stem: 'Right after “I love this place”, what does the speaker do?',
      choices: ['Gives her a quick warning', 'Tells her to look up at it', 'Asks her to cheer up'], a: 0,
      cue: '「I love this place」のあとの短い前置き。',
      line: 'I love this place. *Just a heads-up*, they only serve whey here.',
      said: '「先に言っておくと、ここはホエイしかない」と教える。',
      mean: 'a heads-up ＝ 事前の注意・知らせ。驚かないように先に伝える言い方。',
      trap: 'heads up を「顔を上げて」と文字通りに取りやすい。名詞の a heads-up は前もっての知らせ。',
      use: 'Just a heads-up, the store closes at six.（先に言っとくと、店は6時に閉まるよ）' },

    // R drop: c1 (C2 humor, “who is the joke on”). Its key needs one speaker for “No, like the watery part…” through
    //   “curds”: the captions run it as one turn, whisper splits it (“No, like the watery part of it.” / “Oh, like the
    //   watery part of milk… curds?”), which would make the guesser the lecturer (K1). Never shipped, so deleted.
    // R fix: N1: the line had “of milk” right after “watery part”, which whisper doesn't have (“…the watery part of it”)
    // why: protein powder ← her own guess, heard first; goat cheese ← “Bavarian goat whey” comes later
    { id: 'd2', skill: 'detail', level: 'B2', point: 'whey', seg: [152.6, 160.6],
      stem: 'What does the café’s whey turn out to be?',
      choices: ['The watery part left over from milk', 'A protein powder you put in smoothies',
                'A soft cheese made from goat’s milk'], a: 0,
      cue: '「No」のあと、like で始まる説明。',
      line: 'No, like *the watery part*… of milk that remains…',
      said: '「プロテインじゃなくて、牛乳の水っぽい部分」と説明される。',
      mean: 'No, like ～ ＝「じゃなくて、～の方」。相手の思い違いを直す言い方。',
      trap: '先に聞こえる whey protein に引かれやすい。No のあとが本当の答え。',
      use: 'No, like the other one, the blue one.（いや、もう一つの、青い方）' },

    // R fix: V2 (blind 50 %): “the date” was off the point; now the polarity near miss (lucky = no chunk)
    // why: tasted better ← “lucky” heard as a happy surprise; no chunk ← “lucky” read as the good outcome, missing that
    //   the chunk is the “luck”
    { id: 'i2', skill: 'infer', level: 'C1', point: 'lucky', seg: [181, 194.1],
      stem: 'After “Bottoms up”, what does “Guess I got lucky” really mean?',
      choices: ['There was a chunk in the drink', 'The drink tasted better than feared',
                'There was no chunk in the drink'], a: 0,
      cue: '店の人の「good luck」の説明と、そのあと。',
      line: 'If you get a *chunk*… *good luck*. Bottoms up. … *Guess I got lucky*.',
      said: '「かたまりが入っていたら幸運」と言われ、飲んだあとで「ついてたみたい」と言う。',
      mean: '前の説明を受けた皮肉。lucky ＝ かたまりに当たった、ということ。',
      trap: 'lucky を文字通り「良いこと」と取りやすい。直前の説明と結びつけて聞く。',
      use: 'Rain on my day off. Lucky me.（休みの日に雨。ついてるね）' },

    // R fix: V2 (blind 60 %): “fans keep asking” was weak; now “prove to Beau she can do it alone”, refuted by “I
    //   wouldn't be completely on my own”. C8: line trimmed
    // why: Sam returns ← Sam is named, but “she's off following her bliss”; prove to Beau ← the breakup is the last
    //   big event, and “on my own” is heard
    { id: 'g2', skill: 'gist', level: 'B2', point: 'restart', seg: [203.8, 250.8],
      stem: 'What leads Carly to start iCarly again?',
      choices: ['She wants to make things, even without Sam', 'Sam comes back from the gang to join her',
                'She wants to show Beau she can do it alone'], a: 0,
      cue: '「I just want to」のあとと、Sam の今。',
      line: 'I just want to *make things again*… I need Sam. But she’s off…',
      said: '「また何か作りたい」と言い、サムはいないが、プロデューサーはいると続ける。',
      mean: '一人ではないと気づいて、再開を決める。サム抜きでも始める流れ。',
      trap: 'Sam の名前が何度も出るので「戻る」と取りやすいが、But she’s off で不在と分かる。',
      use: 'I just want to make music again.（また音楽を作りたいだけ）' },

    // why: the leader ← “following” read literally, and a gang has a leader; way home ← “off” heard as away and lost
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'bliss', seg: [208.8, 215.5],
      stem: 'What does Carly say Sam is doing with the biker gang?',
      choices: ['Doing what makes her truly happy', 'Going wherever the gang leader goes', 'Trying to find her way back home'],
      a: 0,
      cue: '「she’s off」のあと、her で終わる前の語。',
      line: 'But she’s off *following her bliss* with that biker gang.',
      said: '「サムはバイク集団と、自分の幸せを追いかけてる」と言う。',
      mean: 'follow one’s bliss ＝ 本当に好きなことをして生きる。',
      trap: 'following を「ついて行く」と取ると、リーダーの話に聞こえる。追うのは bliss（至福）。',
      use: 'He quit his job to follow his bliss.（好きなことをするために仕事を辞めた）' },

    // why: votes ← /b/–/v/; boats ← /ɑ/–/oʊ/, and “Brazil” suggests travel
    { id: 's1', skill: 'sound', level: 'B2', point: 'bots', seg: [252, 256.9],
      stem: 'Fill the gap: “Probably ___ from Brazil.”',
      choices: ['bots', 'votes', 'boats'], a: 0,
      cue: '「Probably」のすぐあと、短い一語。',
      line: 'Probably *bots* from Brazil.',
      said: '「たぶんブラジルのボットだよ」と言う。',
      mean: 'bots ＝ 自動で動くアカウント。本物の視聴者ではない、という冗談。',
      trap: 'b と v、bot と boat の母音は聞き分けにくい。視聴者の話なら bots が合う。',
      use: 'Half these followers are bots.（フォロワーの半分はボットだよ）' },

    // R fix: V2 (blind 60 %, K5): the key was the only “not people” contrast; now three parallel “They are …” readings
    // why: overseas ← “from Brazil” taken as where real fans are; very few ← “a few viewers” heard, “bots” missed
    { id: 'i4', skill: 'infer', level: 'C1', point: 'bots', seg: [252, 256.9],
      stem: 'What does the reply about Brazil suggest about the first viewers?',
      choices: ['They are fake accounts, not real fans', 'They are real fans, but from overseas',
                'They are real fans, but very few'], a: 0,
      cue: '「viewers」への返事、Probably のあと。',
      line: 'it looks like she’s already got a few viewers. — Probably *bots* from Brazil.',
      said: '「もう見てる人がいる」に、「たぶんブラジルのボット」と返す。',
      mean: '喜ぶ人に水をさす冗談。数は増えても、人間とは限らない。',
      trap: 'from Brazil で「海外のファン」と取りやすい。bots の一語が、人かどうかを決める。',
      use: 'Don’t get excited, it’s probably spam.（喜ばないで、たぶんスパムだよ）' },

    // why: sculpture ← Spencer's sculpture was the last big reveal; breakup ← her story with Beau
    { id: 'd3', skill: 'detail', level: 'B1', point: 'topic', seg: [257, 263.2],
      stem: 'What has Carly planned for this first show?',
      choices: ['Sharing her skin care routine', 'Showing Spencer’s new sculpture', 'Talking about her breakup'], a: 0,
      cue: '「So, today」のあと。',
      line: 'So today I thought I’d share my *skin care routine*.',
      said: '「今日は私のスキンケアを紹介しようと思って」と始める。',
      mean: '大人になった iCarly らしい話題を選んだ、と分かる。',
      trap: '前の場面の作品や、失恋の話に引かれやすい。today のあとが今日の話題。',
      use: 'Today I thought I’d try something new.（今日は新しいことをしてみようと思って）' },

    // R fix: V2 (blind 55 %): “bored” was weak; now a sincere warning, the other half of the contradiction
    // why: sincere ← it's said like a real tip (“you should…”); warning ← “already too late” heard without the “But”
    //   that follows
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'skincare', reveals: ['topic'], seg: [279, 289],
      stem: 'How does Carly come across in this part of her skin care talk?',
      choices: ['Mocking the ads while seeming to follow them', 'Recommending the products she really uses',
                'Warning viewers not to waste their money'], a: 0,
      cue: '「too late」のあとの but と、最後の一言。',
      line: 'it’s *already too late*. *But you should still spend all your money on it*.',
      said: '「必要になる頃には手遅れ。でも、お金は全部つぎ込むべき」と話す。',
      mean: '勧めるふりをして、広告の理屈のおかしさを笑っている。',
      trap: 'you should は本気の勧めに聞こえやすいが、手遅れなのに買え、という矛盾が冗談のしるし。',
      use: 'Sure, buy the expensive one. Why not?（いいよ、高い方買えば？）' },

    // anchor: 279.6–288 s “by the time you need skin care, it's already too late. But you should still spend all your
    //   money on it… just an expensive reminder”: the advice says buy while denying any benefit
    // why: start young ← “never too early to start” (266 s) is the ad line she quotes first; save money ← “already too
    //   late” heard without the “But” that follows
    { id: 'c3', skill: 'humor', level: 'C2', point: 'skincare', reveals: ['topic'], seg: [279, 289],
      stem: 'Taken as serious advice, what is Carly telling viewers to do?',
      choices: ['Buy it all anyway, though it can’t help', 'Start young, while it can still help',
                'Save their money, since it’s too late'], a: 0,
      cue: '「too late」と「But」のあと、二つをつなげて。',
      line: 'it’s already too late. *But you should still spend all your money on it*.',
      said: '「必要になったときには手遅れ。それでも全財産をつぎ込むべき」と言う。',
      mean: '本気なら「効かないけど買え」。ありえない助言にして、広告の売り方を笑っている。',
      trap: '前の「早すぎることはない」に引かれやすい。but のあとが結論。助言が自分を打ち消したら冗談と考える。',
      use: 'It won’t help, but buy it anyway!（効かないけど、とにかく買って！）' },

    // anchor: 257.5 s “This is still iCarly, but it's grown up now”, then 289.5 s “That's a little emo for a comedy
    //   show” and the yes–no squabble (295–297 s), then 299.4 s “…seems like we never left”
    // R fix: S4 (the stem's “it's grown up now” at 257.5 s was outside the segment) and V2 (C2, blind 55 %; its one
    //   rewrite): the stem quotes the closing line instead, and the fans option is now parallel
    // why: never stopped ← “never left” read as a wish about the past (regret); the fans ← “we” heard as the audience
    //   (scope)
    { id: 'c2', skill: 'infer', level: 'C2', point: 'neverleft', reveals: ['emo', 'skincare'], seg: [279, 301.2],
      stem: 'What does the closing “…seems like we never left” suggest?',
      choices: ['It still feels like the same silly show', 'They wish they had never stopped the show',
                'It feels like the old fans never left them'], a: 0,
      cue: '「emo」のつっこみと、そのあとの言い合い。',
      line: 'That’s a little emo for a comedy show… *seems like we never left*.',
      said: '話が暗くなり、つっこみと言い合いが続いて、最後に「全然変わってない」。',
      mean: '「大人になった」と言った直後に、昔どおりのドタバタ。最後の一言はそれを認める笑い。',
      trap: 'never left を「やめなければよかった」と取りやすい。seems like は今の様子の話で、we は番組の仲間。',
      use: 'Ten years later, and nothing’s changed.（10年たっても、何も変わってない）' },

    // R fix: K3 (“should be sadder” was absurd) and B1 (the stem names the skin care talk: reveals d3's topic)
    // why: music ← “emo” as a music style; serious ← “don't you think?” heard as inviting agreement that the show has
    //   grown up
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'emo', reveals: ['topic'], seg: [289, 293.5],
      stem: 'What is the comment right after the skin care talk doing?',
      choices: ['Teasing her for getting too dark', 'Asking about her taste in music', 'Agreeing it’s a serious show now'],
      a: 0,
      cue: '「comedy show」と、最後の短い問いかけ。',
      line: 'That’s *a little emo* for a comedy show, *don’t you think*?',
      said: '「コメディ番組にしては、ちょっと暗くない？」とつっこむ。',
      mean: 'emo ＝ 暗くて感傷的。don’t you think で、やわらかくからかっている。',
      trap: 'emo は音楽のジャンル名でもあるが、ここは「暗すぎる」。疑問の形の軽いつっこみ。',
      use: 'That’s a little much, don’t you think?（ちょっとやりすぎじゃない？）' },

    // R fix: the answer had a curly apostrophe, which the dict check (/^[a-z']+…/) rejects
    { id: 'x2', skill: 'dict', level: 'B1', point: 'emo', seg: [289, 293.5],
      stem: 'Type the end: “That’s a little emo for a comedy show, ___?” (3 words)', answer: "don't you think",
      cue: '「comedy show」のあと、文末の問いかけ。',
      line: 'That’s a little emo for a comedy show, *don’t you think*?',
      said: '「コメディにしては暗すぎない？」と聞いている。',
      mean: '「ドンチュシンク」のように一続き。t と y がつながって「チュ」。',
      trap: 'don’t の t が消え、do you think と聞こえやすい。否定の形で同意を求める言い方。',
      use: 'It’s kind of cold in here, don’t you think?（ここ、ちょっと寒くない？）' },
  ]
};
