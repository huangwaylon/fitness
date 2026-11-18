// R4 REVIEW 2026-11-18: keep 8, rewrite 6, retire 1, new 2, ctx 4, tx 3, qa 11
// A2 REVIEW 2026-11-17: keep 3, rewrite 11, retire 6, new 1
// “Smile If You Love Men's Prostates - The Office US” (the official The Office channel, BEST OF SEASON 9 - The Office
// US): the men grow mustaches for Movember; a conference call with Jim breaks down over his echoing line; Erin's
// compliments on a coworker's mustache keep turning into insults.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 128 s. Jim is named at 68.9 s and 77.4 s.
// Untested: the slang and innuendo at 18–42 s, 66.9 s ("spooky sexy"), 81–85 s (garbled), the wait at 90–99 s.
// EXCLUDE 18–21, 36–42, 66–69 (innuendo)
// SKIP 128.5–154.4: talk ends; the last line runs over the end music
// EAR CHECK: 100–128 s d3 m1 a2 pr2 — the woman who answers after “Erin, did this call come?” is Erin (from the turns)
import type { Clip } from '../types.ts';

export const movember: Clip = {
  id: 'movember', video: 'BXxyRv2elcE', title: 'Smile If You Love Men\'s Prostates', dur: 155, wpm: 127, band: 'slow',
  tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    { id: 'g1', skill: 'gist', level: 'B1', point: 'why', seg: [0, 17.9],
      stem: 'Why do the men have mustaches?', ja: '男性たちはなぜ口ひげを生やしている？',
      choices: ['To raise money for a charity', 'To win a contest set by Toby', 'To look like a famous actor'], a: 0,
      choicesJa: ['チャリティーのお金を集めるため', 'トビーのコンテストで勝つため', '有名な俳優に似せるため'],
      cue: '「Toby got us all」から',
      line: 'It’s *a charity* for prostate cancer.',
      said: '前立腺がんの寄付のために、11月のあいだ口ひげを伸ばす企画に、男性みんなで参加したと話す。',
      mean: 'charity ＝ チャリティー、寄付の活動。口ひげは、寄付の企画に参加したしるし。',
      trap: 'Tom Selleck（口ひげで有名な俳優）や Toby から、まねやコンテストと考えがち。決め手は It’s a charity。',
      use: 'It’s for a good cause.（いいことのためなんだ）' },

    { id: 'd1', skill: 'detail', level: 'B1', point: 'pledge', seg: [10.3, 17.9],
      stem: 'What do you do first for Movember?', ja: 'モーベンバーでは、まず何をする？',
      choices: ['Promise some money', 'Bet a lot of money', 'Get a checkup'], a: 0,
      choicesJa: ['お金を出すと約束する', '大金を賭ける', '健康診断を受ける'],
      cue: '「You」のすぐあと',
      line: 'You *pledge money* and then you grow a mustache for the month of November.',
      said: '「お金を出すと約束して、それから11月のあいだ口ひげを伸ばす」と説明する。',
      mean: 'pledge ＝ （寄付を）約束する。and then ＝ それから。順番を言っている。',
      trap: 'money だけ聞くと、賭けと勘違いしやすい。pledge は「出すと約束する」こと。',
      use: 'I pledged twenty dollars.（20ドル寄付すると約束した）' },

    { id: 'p1', skill: 'phrase', level: 'B2', point: 'got', seg: [24.6, 35.1],
      stem: 'What does “I got all of the dudes to do Movember” mean?', ja: '「I got all of the dudes to do Movember」の意味は？',
      choices: ['I made all the men join', 'I joined after the other men', 'I started a new charity'], a: 0,
      choicesJa: ['男性みんなを参加させた', 'ほかの男性のあとに参加した', '新しいチャリティーを始めた'],
      cue: '「so glad」のあと',
      line: 'I am so glad I *got all of the dudes to do* Movember.',
      said: '「男たち全員をモーベンバーに参加させられて、本当によかった」と話す。',
      mean: 'get 人 to do ＝ 人に〜してもらう、〜させる。dudes ＝ 男たち（くだけた言い方）。',
      trap: 'got を「もらった」と思うと、誘われた側に聞こえやすい。get 人 to do なら、させた側。',
      use: 'I finally got him to see a doctor.（やっと彼を医者に行かせた）' },

    // R fix: V2 (blind 55 %): the key was the only positive choice. "Proud of the money" (keyword) and "Amused by how
    //   silly…" replace "Tired of it" and "Embarrassed".
    // why: proud of the money ← "pledge money" earlier and a charity setting; amused ← an adult using teen slang
    //   heard as self-mocking
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'proud', reveals: ['dope', 'got'], seg: [26.9, 41.0], retired: true,
      stem: 'How does the speaker feel about the Movember group?',
      choices: ['Proud, like he’s one of the cool guys', 'Proud of the money they’ve raised',
                'Amused by how silly the mustaches look'], a: 0,
      cue: '言葉選び。若者っぽい語の重ね方。',
      line: 'I am *so glad*… We have *the dopest time*… We even go to lunch, *pick up babes*.',
      said: '「誘えてよかった。別室は最高。昼は女の子に声をかける」と話す。',
      mean: 'so glad, dopest, babes と若者言葉を重ね、仲間の中心にいるのを得意がる。',
      trap: '寄付の話なのでお金の自慢と思いやすいが、出てくるのは time と babes。',
      use: 'I’m so glad I came.（来て本当によかった）' },

    // R fix: V2 (blind 55 %): "a great time" is the default collocation. Now superlatives, with a near sound
    //   ("dullest"). S4: seg widened to 3.1 s (was 2.9).
    // why: dullest ← dopest/dullest share d- and -est; busiest ← "back in the annex" heard as a work report
    { id: 'p2', skill: 'phrase', level: 'B2', point: 'dope', seg: [31.6, 34.7], retired: true,
      stem: 'How does he describe the time they have in the annex?',
      choices: ['The best time', 'The dullest time', 'The busiest time'], a: 0,
      cue: '「We have the」のあと、最上級の一語。',
      line: 'We have *the dopest time* back in the annex.',
      said: '「奥の別室で、最高に楽しくやってる」と話す。',
      mean: 'dope は若者言葉で「最高」「かっこいい」。dopest はその最上級。',
      trap: 'dopest は dullest と出だしも語尾も同じ。dope には薬の意味もあるが、ここは若者言葉の「最高」。',
      use: 'That concert was dope.（あのライブ最高だった）' },

    // anchor: 36.1–40.1 s "We even go to lunch, pick up babes." then "Smile if you love men's prostates": offered
    //   straight after "pick up babes" as his line, by a man who has just bragged about "the dopest time"
    // R fix: V2 (blind 60 %): "the men who wouldn't grow a mustache" was refuted by "all of the dudes" (a filler).
    //   Now the charity's awkward cause (wrong target).
    // why: the charity ← the laugh seems to come from the word "prostates" itself; the women ← "smile if…" sounds
    //   aimed at them
    { id: 'c1', skill: 'humor', level: 'C2', point: 'smile', reveals: ['dope', 'proud'], seg: [35.5, 41.0], retired: true,
      stem: 'In his line about lunch and prostates, who is the joke on?',
      choices: ['Himself, for thinking it’s a smooth line', 'The charity, for having such an awkward cause',
                'The women, who have to hear it at lunch'], a: 0,
      cue: '「pick up babes」の直後に、何を言っているか。',
      line: 'We even go to lunch, *pick up babes*. *Smile if you love men’s prostates.*',
      said: '「昼に女の子に声をかける」と言い、続けて「前立腺が好きなら笑って」と決めぜりふ風に言う。',
      mean: '本人は気の利いた口説き文句のつもりだが中身は前立腺。笑われているのは本人。',
      trap: '前立腺という語そのものや、女性への冗談と取りやすい。pick up babes の直後の、彼の決めぜりふ。',
      use: 'I thought it was smooth. It wasn’t.（うまく言えたと思ったのに）' },

    { id: 'i1', skill: 'who', level: 'B1', point: 'on', ctx: true, seg: [43.2, 51.7],
      stem: 'Who is on the phone line?', ja: '電話でつながっているのは誰？',
      choices: ['Only Jim', 'Everyone in the room', 'No one yet'], a: 0,
      choicesJa: ['ジムだけ', '部屋にいる全員', 'まだ誰も'],
      cue: '「Well」のあと',
      line: 'We all on? / Well, *you’re the only one on*. We’re *all here*.',
      said: '「みんな入ってる？」と聞かれ、「入ってるのは君だけ。みんなここにいる」と返す。',
      mean: 'on ＝ 電話会議につながっている。the only one ＝ ただ一人。ほかの全員は同じ部屋にいる。',
      trap: 'all から、全員つながっていると思いやすい。you’re the only one on を聞く。',
      use: 'Is everyone on the call?（全員つながってる？）' },

    { id: 'n1', skill: 'number', level: 'B1', point: 'months', seg: [51.2, 60.3], keep: true,
      stem: 'How far ahead does the meeting plan?', ja: '会議では、どのくらい先まで計画する？',
      choices: ['3 weeks', '30 days', '3 months', '13 months'], a: 2,
      choicesJa: ['3週間', '30日', '3か月', '13か月'],
      cue: '「over the next」のあと',
      line: 'over the next *three months*… That’s the winter season. *Three months.*',
      said: '「この先3か月で…」と始め、別の人が「冬のシーズンだ。3か月」と言い直す。',
      mean: 'over the next three months ＝ この先3か月で。2回言うので、2回目で確かめられる。',
      trap: '30 は「サーティ」、13 は「サーティーン」。「スリー」のあと「マンス」なら3か月、「ウィーク」なら3週間。',
      use: 'Over the next three months, I’ll save money.（この先3か月で貯金する）' },

    { id: 'pr1', skill: 'phrase', level: 'B1', point: 'trustme', seg: [58.5, 65.9],
      stem: 'What does Jim mean by “Trust me”?', ja: 'ジムの “Trust me” はどういう意味？',
      choices: ['Believe me', 'Keep it secret', 'Do what I say'], a: 0,
      choicesJa: ['本当だって', '秘密にして', '言うとおりにして'],
      cue: '「Yeah」のあとの二語',
      line: 'Are you at your office right now? — Yeah. *Trust me*, I’d rather be with you guys.',
      said: '「今、自分のオフィス？」と聞かれ、「うん。本当だよ、そっちにいたい」と答える。',
      mean: 'Trust me ＝ 本当だって、信じて。自分の気持ちが本当だと強めるときの前置き。',
      trap: 'trust（信用する）から、何かを任せる話を連想しやすい。ここは「本当だよ」の前置き。',
      use: 'Trust me, this place is good.（本当だって、この店いいよ）' },

    { id: 'c3', skill: 'detail', level: 'B1', point: 'office', ctx: true, seg: [59.5, 65.9],
      stem: 'Where is Jim during the call?',
      ja: '電話会議のあいだ、ジムはどこにいる？',
      choices: ['At his own office', 'In the same room', 'In the annex'], a: 0,
      choicesJa: ['自分のオフィス', 'みんなと同じ部屋', '別館'],
      cue: '「Are you at」の質問への返事。',
      line: 'Are you at your office right now? / Jim: *Yeah*.',
      said: '「今、自分のオフィスにいるの？」に、ジムは「うん」と答える。',
      mean: 'Are you at 〜 right now? ＝ 今〜にいるの？ Yeah で「そうだ」と答えている。',
      trap: 'with you guys から、みんなと同じ部屋と考えがち。決め手は質問への Yeah。',
      use: 'Are you at the office right now?（今、会社にいる？）' },

    { id: 's1', skill: 'sound', level: 'B2', point: 'rather', reveals: ['trustme'], seg: [61.3, 65.9],
      stem: 'Fill the gap: “Trust me, ___ be with you guys.”', ja: '空所に入るのは？ “Trust me, ___ be with you guys.”',
      choices: ['I’d rather', 'I’d better', 'I’d like to'], a: 0,
      choicesJa: ['むしろ〜したい', '〜したほうがいい', '〜したい'],
      cue: '「Trust me」のあと',
      line: 'Trust me, *I’d rather* be with you guys.',
      said: '「本当だって、そっちでみんなといたいよ」と答える。',
      mean: 'I’d rather ＝ むしろ〜したい。I’d の d はほぼ聞こえない。',
      trap: 'I’d better なら「ベラ」、I’d like to なら「ライク」。「ラザー」と聞こえれば rather。',
      use: 'I’d rather take the train.（電車で行くほうがいいな）' },

    // R fix: K2: "tired and low" was half true (a Batman voice is low), and "echoey" in the key isn't in the words.
    //   Now "tired and flat" against "strange and eerie" (spooky).
    // why: tired ← a flat voice on a bad line can sound tired; flirting ← "sexy" taken literally
    { id: 'i2', skill: 'infer', level: 'C1', point: 'voice', seg: [65.8, 74.4], retired: true,
      stem: 'What does the coworker mean about how Jim sounds?',
      choices: ['His voice sounds strange and eerie', 'His voice sounds tired and flat',
                'He sounds like he’s flirting'], a: 0,
      cue: '「kind of」のあとの2語と、ジムの返事。',
      line: 'that sounded kind of *spooky sexy* over here, Halpert. — Sorry, I was saying… *call me on the*…',
      said: '「なんか、こっちには不気味でセクシーに聞こえるぞ」と言われ、ジムは別の電話を勧めかける。',
      mean: '電話の声がこもって、不気味で変に聞こえるということ。spooky ＝ 不気味な。',
      trap: 'sexy だけ拾うと口説きに聞こえるが、話しているのは電話の音のこと。',
      use: 'You’re breaking up a little.（ちょっと声が途切れてるよ）' },

    { id: 'g2', skill: 'gist', level: 'B1', point: 'call', seg: [71, 95],
      stem: 'What happens to the call with Jim?', ja: 'ジムとの電話会議はどうなる？',
      choices: ['A bad line stops it', 'Jim gets called away', 'They finish their plan'], a: 0,
      choicesJa: ['音が悪くて止まる', 'ジムが呼ばれていなくなる', '計画を決め終える'],
      cue: '電話会議の最後',
      line: 'We’re trying to reach Jim Halpert, *not Batman*. … I’ll *call you right back*.',
      said: 'ジムの声が響いて「バットマンじゃない」と言われ、彼は場所を変えてかけ直すと言う。',
      mean: 'a bad line ＝ 電話の音が悪いこと。not Batman ＝ 声が響いて、低い声のバットマン（ヒーロー）みたいだという冗談。',
      trap: 'call you right back を、だれかに呼ばれたと考えがち。音が悪くて、かけ直すだけ。',
      use: 'Can you hear me okay?（ちゃんと聞こえてる？）' },

    // R fix: V2 (blind 60 %): "his important new job" had no hook in the clip. Now "acting like a hero" (a reading of
    //   "not Batman"), and the wrong-number choice is reworded.
    // why: a stranger ← "there's been a mistake… trying to reach Jim" is the usual wrong-person line; hero ← "not
    //   Batman" heard as a dig at Jim acting big
    { id: 'h1', skill: 'humor', level: 'C1', point: 'batman', reveals: ['voice'], seg: [74.4, 79.6], retired: true,
      stem: 'Why does the coworker’s “mistake” line get a laugh?',
      choices: ['He pretends the odd voice is someone else’s', 'He really thinks a stranger has picked up',
                'He’s mocking Jim for acting like a hero'], a: 0,
      cue: '「mistake」のあとの、名前の対比。',
      line: 'I think there’s been a mistake. We’re trying to reach *Jim Halpert, not Batman*.',
      said: '「何かの手違いでは。ジム・ハルパートにかけていて、バットマンではないんですが」と言う。',
      mean: 'こもった変な声を、ヒーローの声に見立てて別人扱いしている。',
      trap: 'mistake を本当の人違い、Batman をヒーロー気取りへの皮肉と取りやすい。話題は声。',
      use: 'Sorry, I think you have the wrong number.（番号をお間違えのようです）' },

    { id: 'd2', skill: 'detail', level: 'B2', point: 'spot', ctx: true, seg: [79.5, 89.5],
      stem: 'What does Jim say he’ll do next?', ja: 'ジムは、次に何をすると言う？',
      choices: ['Call back from another spot', 'Send them his ideas by email', 'Have them call his cell'], a: 0,
      choicesJa: ['別の場所からかけ直す', 'アイデアをメールで送る', '携帯にかけてもらう'],
      cue: '「I’m gonna try」のあと',
      line: 'Jim: I should have just had you call me on my cell. / Yeah. / Jim: *I’m gonna try a different spot*, okay?',
      said: '「携帯にかけてもらえばよかった」「うん」「別の場所で試してみるよ」と言う。',
      mean: 'spot ＝ 場所。call you right back ＝ すぐかけ直す。電話の音が悪いので場所を変える。',
      trap: 'my cell から「携帯にかけてもらう」と考えがち。あれは「そうすればよかった」の話。',
      use: 'Let me call you right back.（すぐかけ直します）' },

    { id: 'c4', skill: 'pragma', level: 'B2', point: 'thing', ctx: true, seg: [101.2, 108.6],
      stem: 'What does Erin say to “It’s for the thing”?',
      ja: '「It’s for the thing」に、エリンは何と言う？',
      choices: ['She already knows about it', 'She asks what thing', 'She tells him to shave'], a: 0,
      choicesJa: ['もう知っている', '何のことか聞く', 'ひげをそるように言う'],
      cue: '「the thing」への返事。',
      line: 'Erin: I just, I saw your face. / I’m sorry. *It’s for the thing*. / Erin: *I know. That’s great.*',
      said: '「顔を見ちゃって」に「ごめん、あれのためなんだ」と返し、エリンは「分かってる。すごくいいと思う」と言う。',
      mean: 'the thing ＝ 「あれ」。名前を言わずにモーベンバーを指している。I know ＝ 分かってる。',
      trap: 'the thing（あれ）だけでは何か分からず、聞き返すと考えがち。答えは I know（分かってる）。',
      use: 'I know. That’s great.（分かってる。いいと思うよ）' },

    { id: 'd3', skill: 'detail', level: 'B1', point: 'eyebrow', seg: [107.4, 113.2],
      stem: 'What does Erin say the mustache looks like?', ja: 'エリンは、口ひげが何みたいだと言う？',
      choices: ['An eyebrow in the middle', 'An eye in the middle', 'A smile above his lip'], a: 0,
      choicesJa: ['顔の真ん中の眉毛', '顔の真ん中の目', '唇の上の笑顔'],
      cue: '「makes it look like」のあと',
      line: 'it makes it look like there’s *an eyebrow in the middle of your face*.',
      said: '「顔の真ん中に眉毛があるみたい」と言う。',
      mean: 'make 〜 look like … ＝ 〜を…みたいに見せる。口ひげを、顔の真ん中の眉毛にたとえている。',
      trap: 'あとで eye socket や Cyclops（一つ目の巨人）も出るので、「目」と混ざりやすい。ここは eyebrow（眉毛）。',
      use: 'That hat makes you look taller.（その帽子だと背が高く見えるね）' },

    { id: 'm1', skill: 'marker', level: 'B1', point: 'but', reveals: ['socket'], seg: [111.9, 119],
      stem: 'What comes after Erin’s “but, um”?', ja: 'エリンの “but, um” のあとに来るのは？',
      choices: ['Something not so nice', 'Another nice thing to say', 'A brand-new topic'], a: 0,
      choicesJa: ['あまりよくないこと', 'もう一つのほめ言葉', 'まったく新しい話'],
      cue: 'ほめ言葉のすぐあと',
      line: 'A handsome eyebrow, *but, um*, makes your mouth look like an eye socket.',
      said: '「ハンサムな眉毛よ。でも、えっと、口が目のくぼみみたいに見える」と続ける。',
      mean: 'but のあとに本音が来る。um は言いにくさのしるしで、ここから悪い話になる。',
      trap: 'handsome（かっこいい）のあとなので、ほめ言葉が続くと思いやすい。but のあとが本音。',
      use: 'It’s nice, but, um, a bit loud.（いいけど、えっと、ちょっと派手かな）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'socket', seg: [113.2, 119],
      stem: 'Type what Erin says: “makes your mouth ___ eye socket.” (3 words)', ja: '書こう：“makes your mouth ___ eye socket.”（3語）',
      answer: 'look like an',
      cue: '「mouth」のあと',
      line: 'makes your mouth *look like an* eye socket.',
      said: '「口が目のくぼみみたいに見える」と言う。',
      mean: 'look like an が「ルッライカン」のようにひと続き。an は次の eye とつながる。',
      trap: 'k と l、n と eye がつながって、語の切れ目が消える。like のあとの短い an を落としやすい。',
      use: 'You look like a movie star.（映画スターみたい）' },

    { id: 's2', skill: 'sound', level: 'B2', point: 'notbad', seg: [117.6, 123],
      stem: 'Fill the gap: “___ bad.”', ja: '空所に入るのは？ “___ bad.”',
      choices: ['Which isn’t', 'Which is', 'It isn’t'], a: 0,
      choicesJa: ['（それは）〜ではない', '（それは）〜だ', 'それは〜ではない'],
      cue: '「eye socket」のすぐあと',
      line: '*Which isn’t* bad.',
      said: '「…悪くはないけど」と付け足す。',
      mean: 'isn’t の t はほぼ消えて「イズン」。悪口のあとに、あわててフォローしている。',
      trap: 'n’t が弱いと Which is に聞こえやすい。最後の「ン」が否定。出だしは「ウィッチ」で It ではない。',
      use: 'Which isn’t a bad thing.（それは悪いことじゃないけど）' },

    { id: 'a2', skill: 'attitude', level: 'B2', point: 'cover', retired: true, seg: [117.8, 129.2],
      stem: 'How does Erin feel as she talks?', ja: '話しながら、エリンはどんな気持ち？',
      choices: ['Nervous, trying to be nice', 'Happy, joking with him', 'Angry, being mean to him'], a: 0,
      choicesJa: ['あせって、やさしくしようとしている', '楽しく、冗談を言っている', '怒って、意地悪をしている'],
      cue: 'たとえのたびに付ける一言',
      line: 'you look like a Cyclops whose eye fell out. *Which is great.* It’s such a great cause.',
      said: '「目が抜けた一つ目の巨人みたい。…素敵。いい活動だし」と言い足す。',
      mean: '傷つけまいとフォローするが、たとえがどんどんひどくなる。悪気はなく、正直すぎるだけ。',
      trap: 'ひどいたとえから、意地悪だと思いやすい。毎回 Which is great と急いでほめ直している。',
      use: 'Sorry, that came out wrong.（ごめん、今の言い方はまずかった）' },

    // anchor: 109–124 s her real view comes in the pictures ("an eyebrow in the middle of your face", "an eye
    //   socket", "a Cyclops whose eye fell out"); 126.6 s "It's such a great cause" moves the praise from the
    //   mustache to the charity
    // R fix: V2 (blind 70 %): near misses now: the cause as a bit silly (wrong target), starting to like it (wrong
    //   direction).
    // why: silly cause ← "cause" heard as what her doubt is about; starting to like it ← "a handsome eyebrow" and
    //   "Which is great" taken at face value
    { id: 'c2', skill: 'attitude', level: 'C2', point: 'cover', seg: [119.2, 128.4], retired: true,
      stem: 'When Erin ends on the “great cause”, what is she trying not to say?',
      choices: ['That the mustache just doesn’t suit him', 'That she thinks the cause is a bit silly',
                'That she’s starting to like the mustache'], a: 0,
      cue: 'ほめる相手が、ひげから何に変わるか。',
      line: '…whose eye fell out. Which is great. *It’s such a great cause.*',
      said: '「目が抜けた巨人みたい。素敵よ。すごくいい活動だし」と、最後は寄付の目的をほめる。',
      mean: 'ほめる対象をひげから目的にすり替えた。ほめる所がないとき目的をほめるのは、よくある逃げ方。',
      trap: 'cause を活動への本音と、handsome や great を好意と取りやすい。直前のたとえが本音。',
      use: 'Well, it’s the thought that counts.（まあ、気持ちが大事だよね）' },

    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'cause', seg: [122.5, 128.4],
      stem: 'What is Erin trying to do with “such a great cause”?', ja: 'エリンは「such a great cause」で何をしようとしている？',
      choices: ['To end on something nice', 'To ask him for some money', 'To change the plan'], a: 0,
      choicesJa: ['最後はいいことを言うため', '彼にお金を頼むため', '計画を変えるため'],
      cue: '最後の一文',
      line: 'Which is great. *It’s such a great cause.*',
      said: '「素敵。すごく立派な活動だもの」と、最後は寄付の目的をほめる。',
      mean: 'cause ＝ （寄付などの）目的、活動。ひげはほめられないので、活動のほうをほめて終える。',
      trap: 'cause を「原因」と思いやすい。a great cause は「立派な目的」。',
      use: 'It’s for a great cause.（立派な目的のためなんだ）' },
  ]
};
