// REVIEW 2026-11-16: pass 3, fix 17, drop 1 (c2), new 0; ear checks 2
// “Dwight vs. Dwight - The Office US” (the official The Office channel, Best of Season 6): at Dwight's yearly karate
// seminar he pitches a "relatable" Yakuza scenario and swears by the throat punch; Kevin won't spar with him, so a
// coworker (Jim, named at the end) flatters him into demonstrating on himself, and keeps the self-fight going.
// Segments from the captions, words from whisper (2026-11-16). The sources differ at 22.7 s (“You were” / “You are”)
// and 102.9 s (“instep” / “In step”); no key rests on them. No item uses the
// opening shouts (0–8 s), the physical self-fight (74–110 s, a sight gag) or the closing screams. The talking-head
// speaker and the coworker who questions Dwight are never named until “Jim” at 115.4 s, so items call them “the talking
// head” and “a coworker”.
// EAR CHECK: 22.7 s h1 — the line has whisper's "You are all members"; the captions have "You were" (the key doesn't
//   rest on it)
// EAR CHECK: 53.1 s s1 / 80.9 s x1 — "did choke" with "did" audible and stressed; "because he does have two" linked
import type { Clip } from '../types.ts';

export const dwightVsDwight: Clip = {
  id: 'dwightself', video: 'glMgnCJ98Aw', title: 'Dwight vs. Dwight', dur: 144, wpm: 150, band: 'mid',
  tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // why: once a month ← "once a" heard and the unit guessed; once a week ← the usual class rhythm (script)
    { id: 'n1', skill: 'number', level: 'B1', point: 'yearly', seg: [7.6, 12.4], keep: true,
      stem: 'How often does Dwight hold his karate seminar?',
      choices: ['Once a week', 'Once a month', 'Once a year'], a: 2,
      cue: '話の最初の三語。',
      line: '*Once a year*, Dwight holds a seminar…',
      said: '「年に一度、Dwight が空手の最新情報のセミナーを開く」と話す。',
      mean: 'once a year ＝ 年に一度。毎年の恒例行事だと分かる。',
      trap: 'once a のあとの語は短く、week や month と取りやすい。最後の子音まで聞く。',
      use: 'We meet once a month for lunch.（月に一度、ランチで集まる）' },

    // R fix: V2 (70 % blind) + S1: the stem's "yearly" gave away n1's key, and the two positive choices made the one
    //   ironic choice stand out. Now one distractor is "silly" for the wrong reason.
    // why: makes up moves ← "silly" caught but the reason missed; useful ← "updating us on the newest developments"
    //   and "do all the time is change" taken at face value
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'change', seg: [7.6, 18.4],
      stem: 'In the talking head, how does the speaker see Dwight’s updates?',
      choices: ['As silly, since karate hardly changes', 'As silly, since Dwight makes up his own moves',
                'As useful, since karate keeps changing'], a: 0,
      cue: '「thousand-year-old」と「all the time」。',
      line: 'the one thing that *thousand-year-old* martial arts do *all the time* is *change*.',
      said: '「千年続く武術がいつもしていることといえば、変化だ」と言う。',
      mean: '千年続くものが「いつも変わる」はずがない。わざと逆を言う皮肉。',
      trap: 'updating や newest をそのまま取ると前向きに聞こえる。古さと「いつも」の矛盾が本音。',
      use: 'Because, as we all know, I love Mondays.（だって、みんな知っての通り、月曜大好きだから）' },

    // R fix: V2 (70 % blind): the middle reading "changes slowly, but still help" was a filler; "hardly changes, but
    //   still fun" (the right fact, the wrong stance) is the near miss.
    // why: changes all the time ← the sentence taken literally; still fun ← "thousand-year-old" heard, but "as we all
    //   know" missed as the sarcasm marker, so a fond reading
    // anchor: 12.96–18.0 s "as we all know, the one thing that thousand-year-old martial arts do all the time is
    //   change": an art a thousand years old is the opposite of one that changes all the time
    { id: 'c1', skill: 'infer', level: 'C2', point: 'change', seg: [7.6, 18.4], retired: true,
      stem: 'Which plain-English version keeps what the talking head means?',
      choices: ['“Karate hardly changes, so these updates are silly.”',
                '“Karate changes all the time, so updates matter.”',
                '“Karate hardly changes, but the updates are still fun.”'], a: 0,
      cue: '「千年」と「いつも」が同じ文にあること。',
      line: '*as we all know*, the one thing that *thousand-year-old* martial arts do *all the time* is change.',
      said: '「みんな知っての通り、千年の武術がいつもしているのは変化だ」と語る。',
      mean: '千年変わらない物に「いつも変わる」と言うのは、わざと逆を言う皮肉。as we all know がその合図。',
      trap: '文をそのまま取ると、更新が大事な話に聞こえる。言葉と事実が食い違ったら皮肉を疑う。',
      use: 'Sure, because traffic is always so light.（そうだね、道はいつもすいてるもんね）' },

    // R fix: V2 (70 % blind): "too ordinary to keep them listening" was a filler; "far too long for a simple point"
    //   (the long, detailed setup) replaces it.
    // why: too long ← the setting runs over three clauses before the question; really happened ← the long, detailed
    //   setting heard as a memory
    { id: 'h1', skill: 'humor', level: 'C1', point: 'relatable', seg: [18.3, 31.0],
      stem: 'Why is the example Dwight calls “relatable” funny?',
      choices: ['It is nothing like their real lives', 'It is far too long to make a simple point',
                'It is told as if it happened to him'], a: 0,
      cue: '「relatable」のすぐあと、聞き手に何をさせるか。',
      line: 'in a *relatable* way? *You are all members of the Yakuza*…',
      said: '「身近な例で」と前置きし、「君たちは全員ヤクザで、博物館で襲われた」と始める。',
      mean: 'relatable ＝ 身近に感じられる。会社員にヤクザは最も遠い例。',
      trap: '長い前置きや思い出話に気を取られやすい。you are の仮定は聞き手の話。',
      use: 'Here’s a more relatable example.（もっと身近な例を出すね）' },

    // R fix: V2 (75 % blind): "how old gangs came to be" and "a museum trip" were off-topic fillers. All three are now
    //   about the attack; C5: the key paraphrases f1's "hold them off", so it reveals 'holdoff'.
    // why: escape ← "attacked by triads" with the usual advice to run; call for help ← "until your clan arrives"
    //   heard as the lesson itself
    { id: 'g2', skill: 'gist', level: 'B1', point: 'scenario', reveals: ['holdoff'], seg: [18.3, 38.2],
      stem: 'What is Dwight’s long story about the museum meant to teach?',
      choices: ['How to fight off an attack', 'How to escape from a gang', 'How to call for help in a crowd'], a: 0,
      cue: 'たとえ話の最後の質問と、その答え。',
      said: 'ヤクザとして博物館にいて、敵に襲われたら、仲間が来るまでどうする？と問いかける。',
      mean: '自分を守る技を教えるための、たとえ話。答えは一つの技。',
      trap: 'Yakuza や museum など目立つ語に引かれやすい。たとえ話は、最後の質問が本題。',
      use: 'Let me put it another way.（別の言い方をするとね）' },

    // R fix: V2 (55 % blind): "Put off meeting them until later" broke the parallel; "Keep away from them" (avoid,
    //   not repel) replaces it, so all three end "until help comes".
    // why: keep away ← "off" read as distance (離れている); hold on to ← "hold" read as 持つ
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'holdoff', seg: [28.3, 35.0],
      stem: 'When the triads attack, what does Dwight ask how you would do?',
      choices: ['Keep them back until help comes', 'Keep away from them until help comes', 'Hold on to them until help comes'],
      a: 0,
      cue: '「How can you」のあとの動詞と off。',
      line: 'How can you *hold them off* until your clan arrives?',
      said: '「仲間が来るまで、どうやって敵を食い止める？」と聞く。',
      mean: 'hold 人 off ＝ 人を寄せつけない、食い止める。until と合わせて時間かせぎ。',
      trap: 'off を「離れる」と取ると逃げる話になる。目的語が人で攻撃の場面なら「食い止める」。',
      use: 'Can you hold them off for five minutes?（5分だけ食い止めてくれる？）' },

    // R fix: V2: "a shout for your clan" was weak; "a punch to the nose" (the opening's "Broken nose!") replaces it.
    // why: kick to the knee ← a typical self-defense answer (script); nose ← "Broken nose!" twice in the opening
    { id: 'd1', skill: 'detail', level: 'B1', point: 'throat', seg: [30.9, 38.2],
      stem: 'What does Dwight say you can never go wrong with?',
      choices: ['A punch to the throat', 'A kick to the knee', 'A punch to the nose'], a: 0,
      cue: '「go wrong with a」のあとの二語。',
      line: 'You cannot go wrong with a *throat punch*.',
      said: '「のどへのパンチなら、まず失敗しない」と答える。',
      mean: 'You can’t go wrong with ～ ＝ 〜なら外れない。いちばんのおすすめを言う形。',
      trap: '冒頭の nose が耳に残ると、鼻へのパンチに引かれる。with a のあとを聞く。',
      use: 'You can’t go wrong with pizza.（ピザなら外れない）' },

    // R fix: V2 (55 % blind): "a secret of his" was a filler. Two choices now say "there is one", with a
    //   years-to-learn twist.
    // why: agrees ← "there's no defense for that" heard as Dwight's own claim; years to learn ← the martial-arts
    //   script, and "Let me demonstrate" missed
    { id: 'd2', skill: 'detail', level: 'B1', point: 'defense', seg: [38.8, 44.4],
      stem: 'How does Dwight answer the remark that there is no defense?',
      choices: ['He says there is one, and offers to show it', 'He agrees, and says that is why the punch works',
                'He says there is one, but it takes years to learn'], a: 0,
      cue: '「No,」のあとと、その次の一文。',
      line: '*No, there is a defense* for that. *Let me demonstrate.*',
      said: '「いや、防ぐ方法はある。やって見せよう」と言う。',
      mean: 'Let me demonstrate ＝ 実演してみせる。この一言が、このあとの流れを作る。',
      trap: '直前の「防げない」を Dwight の言葉と取ると、同意に聞こえる。No のあとが返事。',
      use: 'Let me show you how it works.（どう動くか見せるね）' },

    // R fix: V2 (70 % blind): the "Trying hard…" pair made the key the odd one. All three are now "<verb>ing Dwight …,
    //   so …".
    // why: helping ← "Good to know" and "Good point" taken at face value; calming ← "what if he comes at you" heard as
    //   a warning before someone gets hurt
    { id: 'g1', skill: 'gist', level: 'B2', point: 'coworker', reveals: ['worthy', 'twohands'], seg: [38.8, 114.2],
      stem: 'What is the coworker doing through most of the seminar?',
      choices: ['Leading Dwight on, so he looks silly', 'Helping Dwight out, so the class goes well',
                'Calming Dwight down, so nobody gets hurt'], a: 0,
      cue: '質問や提案のたびに、Dwight がどうなるか。',
      said: '「防げないんだね」「相手は君自身」「手は二本ある」と、Dwight を乗せていく。',
      mean: 'まじめな受講生のふりで、Dwight が自分と戦い続けるよう仕向けている。',
      trap: 'Good to know などの言葉だけだと熱心な人に聞こえる。その結果を聞く。',
      use: 'Stop egging him on.（あいつをけしかけるのはやめなよ）' },

    // R fix: V2 (60 % blind): all three now turn on "last time"; the distractors flip who hurt whom (the you/me
    //   pronouns) and read "pulled my pants down" as cheating.
    // why: he hurt Dwight ← "you … me" missed, the roles flipped; cheated ← "pulled my pants down" heard as a dirty
    //   trick, "choke me" missed
    { id: 'd3', skill: 'detail', level: 'B1', point: 'kevin', seg: [44.3, 52.2],
      stem: 'Why won’t Kevin attack Dwight?',
      choices: ['Dwight hurt him the last time they did this', 'He hurt Dwight the last time they did this',
                'Dwight cheated the last time they did this'], a: 0,
      cue: '「No way」のあとの理由。',
      line: 'No way. *Last time*… you *tried to choke me with my shoelace*.',
      said: '「いやだ。前回は靴ひもで首をしめようとしたじゃないか」と断る。',
      mean: '前回ひどい目にあったので、相手役をしたくない、という理由。',
      trap: 'you と me を聞き落とすと、立場が逆になる。Last time のあと、誰が誰に何をしたか。',
      use: 'No way. Last time I got lost.（いやだよ。前回迷子になったし）' },

    // R fix: V2 (75 % blind): "mixes Kevin up with someone else" was a filler; "corrects whose shoelace it was"
    //   (Kevin's "my", Dwight's "your": the same lace) is the keyword trap.
    // why: denies it ← "False" taken as a plain denial; whose shoelace ← "my shoelace" → "your shoelace" heard as the
    //   thing corrected
    { id: 'h2', skill: 'humor', level: 'C1', point: 'false', seg: [46.0, 55.0],
      stem: 'Why is Dwight’s reply to Kevin’s complaint funny?',
      choices: ['He “corrects” Kevin by admitting something worse', 'He denies it so flatly that nobody believes him',
                'He “corrects” Kevin on whose shoelace it was'], a: 0,
      cue: '「False」のあと、Kevin の言葉と何が違うか。',
      line: 'you *tried to* choke me… — *False.* I *did* choke you with your shoelace.',
      said: '「しめようとした」と言われ、「違う。実際にしめた」と言い直す。',
      mean: '否定したと思ったら、もっとひどい事実を認めている。正確さにこだわるずれが笑い。',
      trap: 'False を「やってない」と取りやすい。否定のあとに何を言い直したかを聞く。',
      use: 'Not quite. I ate the whole cake.（ちょっと違う。ケーキ全部食べた）' },

    // R drop: c2 (sound, C2; never shipped, deleted). V2 at heart (65 % blind): emphatic "did" takes the stress by
    //   rule, and the stem printed "did", so grammar alone picked the key. It also made a third item on point 'false'
    //   (with h2 and s1), and s1 already tests the same "did choke".

    // why: didn't choke ← "False" before it sets up a denial, and the -n't is easy to imagine; tried to choke ← Kevin's
    //   own words a moment before
    { id: 's1', skill: 'sound', level: 'B2', point: 'false', seg: [51.8, 55.0],
      stem: 'Fill the gap: “False. I ___ you with your shoelace.”',
      choices: ['did choke', 'didn’t choke', 'tried to choke'], a: 0,
      cue: '「False. I」のすぐあと、強く言う短い語。',
      line: 'False. I *did choke* you with your shoelace.',
      said: '「違う。本当にしめたんだ」と言い直す。',
      mean: 'did ＋動詞の原形で「本当に〜した」。did が強く、choke につながる。',
      trap: 'False のあとなので didn’t を予想しやすい。n’t の「ン」が無ければ肯定。',
      use: 'I did call you. Twice.（ちゃんと電話したよ。2回）' },

    // R fix: V2: "warns that his ego is the enemy" was off; "teases that no one will fight him" (Kevin's refusal and
    //   "with all due respect to everyone here") replaces it.
    // why: offers himself ← "opponent of you is…" heard as "is me"; no one will ← Kevin just refused, and "everyone
    //   here" heard as the people who won't
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'worthy', seg: [55.6, 61.2],
      stem: 'After Kevin refuses, what does the coworker’s suggestion do?',
      choices: ['Flatters Dwight into fighting himself', 'Offers himself as Dwight’s opponent',
                'Teases Dwight that no one will fight him'], a: 0,
      cue: '「opponent of you is」のあとの一語。',
      line: 'with all due respect… the *most worthy opponent of you is you*.',
      said: '「みなさんには失礼ながら、あなたにふさわしい相手は、あなた自身だ」と言う。',
      mean: 'ほめる形で、Dwight に自分自身と戦わせる流れを作っている。',
      trap: '最後の you を me と聞くと、自分が相手をする話になる。everyone here は前置き。',
      use: 'With all due respect, I disagree.（失礼ながら、私は反対です）' },

    // R fix: V2 (50 % blind): "a trick he sees through" leaned on knowing Dwight; "kind praise he's glad of, and thanks
    //   him for" (the polite-reply script) replaces it.
    // why: glad and thanks ← the usual reply to praise; plays it down ← the Japanese frame: praise answered with 謙遜,
    //   then a joke
    // anchor: 61.5 s "That is correct." (no thanks, no modesty) → 62.8 s "Unless there happen to be measles present.":
    //   a careful exception, as you'd add to a fact; at 70.9 s he takes the challenge ("Easy.")
    { id: 'c3', skill: 'attitude', level: 'C2', point: 'worthy', seg: [55.6, 64.8], retired: true,
      stem: 'What does Dwight’s answer show about how he took the suggestion?',
      choices: ['As a plain fact, needing no modesty at all', 'As kind praise he is glad of, and thanks him for',
                'As praise he politely plays down, then jokes'], a: 0,
      cue: '最初の三語と、そのあと付け足す条件。',
      line: '*That is correct.* *Unless* there happen to be measles present.',
      said: '「ふさわしい相手は自分自身」と言われ、「その通り。はしかがいる場合は別だが」と答える。',
      mean: 'お礼も謙遜もなく事実として認め、まじめに例外まで付ける。ほめ言葉の裏を少しも疑っていない。',
      trap: 'ほめられたら謙遜する、という型で聞きやすい。返事の最初の語が、受け取り方をそのまま示す。',
      use: 'Best cook here? — That is correct.（ここで一番の料理上手？ーその通り）' },

    // R fix: V2: "showing the class how to throw the punch" was weak; "attacking the coworker" ("Dwight has come at
    //   you", with "you" taken as the speaker) replaces it.
    // why: attacks the coworker ← "Dwight has come at you" with "you" heard as the speaker; Kevin's turn ← Kevin was
    //   asked to attack just before
    { id: 'i2', skill: 'infer', level: 'B2', point: 'self', seg: [64.3, 72.6],
      stem: 'What is the coworker’s question setting up?',
      choices: ['Dwight playing both the attacker and the defender', 'Dwight attacking the coworker with the punch',
                'Kevin finally taking his turn to attack Dwight'], a: 0,
      cue: '二回出てくる Dwight という名前の役わり。',
      line: 'let’s just say that *Dwight has come at you*… how would *you, Dwight*, defend against it?',
      said: '「Dwight が君にパンチしてきたら、君、Dwight はどう防ぐ？」と聞く。',
      mean: '攻める人も守る人も Dwight。一人で両方をやるように仕向けている。',
      trap: '直前に Kevin が誘われたので、その続きと取りやすい。名前が二回、別の役で出てくる。',
      use: 'Let’s just say you won. Then what?（仮に勝ったとして、それで？）' },

    // R fix: V2 + K6 (60 % blind): the key was the only "fair" reading; "Angrily, as a try to trip him up" becomes
    //   "Seriously, as a sign the coworker doubts him" (serious, but offended).
    // why: doubts him ← the question could be a challenge, so offense seems likely; jokingly ← "Because he does have
    //   two" is silly, so he might laugh it off
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'twohands', seg: [79.1, 84.4],
      stem: 'How does Dwight take the question about the other hand?',
      choices: ['Seriously, as a fair point to deal with', 'Seriously, as a sign the coworker doubts him',
                'Lightly, as a joke to laugh off'], a: 0,
      cue: '質問のすぐあとの二語と、次の動き。',
      line: 'Because he does have two. — *Good point.* *Second throat punch.*',
      said: '「もう片方の手で来たら？ 手は二本ある」と聞かれ、「いい指摘だ。二発目」と続ける。',
      mean: 'Good point ＝ いい指摘だ。からかいと思わず、まじめに受けている。',
      trap: '質問がばかげているので、笑って流すと思いやすい。返事の言葉と次の動きを聞く。',
      use: 'Good point. Let’s try that.（いい指摘だね。やってみよう）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'twohands', seg: [79.5, 82.35],
      stem: 'Type the reason given: “___.” (5 words)', answer: 'because he does have two',
      cue: '「other hand?」のすぐあと。',
      line: '*Because he does have two*.',
      said: '「だって手は二本あるから」と付け足す。',
      mean: 'does は強調で「ちゃんと二本ある」。because は「コズ」、he は弱くつながる。',
      trap: 'does have は has と同じ意味なので、does を落としやすい。強く言う語も書く。',
      use: 'I do have a car, you know.（車、ちゃんと持ってるんだよ）' },

    // R fix: V2 (80 % blind): the key was the only odd choice. All three now start "He agrees,", so the question is
    //   who "he" is and what "But not for long" adds.
    // why: whole fight foolish ← "He really is" heard as admitting defeat; Kevin ← "he" heard as Kevin, the one who
    //   wouldn't fight
    { id: 'h4', skill: 'humor', level: 'C1', point: 'fool', seg: [95.5, 100.4],
      stem: 'Why is Dwight’s reply to “He’s making you look like such a fool” funny?',
      choices: ['He agrees, speaking of himself as a separate rival', 'He agrees, and admits the whole fight is foolish',
                'He agrees, taking “he” to mean Kevin, not himself'], a: 0,
      cue: '返事の he が指す人と、But のあと。',
      line: 'He’s making you look like such a fool. — *He really is.* *But not for long.*',
      said: '「あいつにバカにされてるね」に「本当に。だが今のうちだ」と返す。',
      mean: '「あいつ」は Dwight 自身。自分を別のライバルのように話すのが笑い。',
      trap: 'He really is を負けの言葉と取りやすい。But not for long はまだ戦う合図。',
      use: 'You’re winning now, but not for long.（今は勝ってるけど、それも今のうち）' },

    // R fix: V2 + S2 (85 % blind): the stem quoted "get the upper…", so the idiom under test was printed. The stem
    //   now names the moment, and the choices are what he can't tell.
    // why: give up first ← "upper hand" heard as raising a hand (降参); grab ← "hand" taken literally in a hand fight
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'upperhand', seg: [110.5, 114.2],
      stem: 'After “so evenly matched”, what does the coworker say he can’t tell?',
      choices: ['Which of them will start to win', 'Which of them will give up first',
                'Which of them will grab the other’s hand'], a: 0,
      cue: '「evenly matched」のあとの、手を使った言い方。',
      line: 'You two are so *evenly matched*, I don’t know how one of you is gonna *get the upper hand*.',
      said: '「二人は互角だから、どっちが優勢になるか分からない」と言う。',
      mean: 'get the upper hand ＝ 優位に立つ。互角の勝負で、一方が勝ち始めること。',
      trap: 'hand を文字通りの「手」と取ると、つかむ話や降参に聞こえる。',
      use: 'Our team got the upper hand late.（うちのチームが後半で優勢になった）' },

    // R fix: V2 (60 % blind): "Stop the fight while nobody is looking" was a filler; "keep the class guessing about the
    //   next lesson" (surprise as a teaching trick) replaces it.
    // why: gift ← surprise = サプライズ (a party or present, the katakana sense); next lesson ← "the important thing to
    //   remember" heard as a teacher's close, surprise as a teaching trick
    { id: 'i1', skill: 'infer', level: 'B2', point: 'surprise', seg: [113.9, 120.5],
      stem: 'What does Dwight’s last line to Jim suggest he will do?',
      choices: ['Catch someone off guard with a sudden move', 'Give Jim a surprise gift to end the class',
                'Keep the class guessing about the next lesson'], a: 0,
      cue: '「what is called the」のあとの決まった言い方。',
      line: 'we always have what is called *the element of surprise*.',
      said: '「我々には“不意打ち”というものがある」と言う。',
      mean: 'the element of surprise ＝ 不意をつく強み。相手の油断を突く、という予告。',
      trap: 'surprise をサプライズの贈り物と取りやすい。戦いの話では「不意打ち」。',
      use: 'We’ll have the element of surprise.（不意打ちできるよ）' },
  ]
};
