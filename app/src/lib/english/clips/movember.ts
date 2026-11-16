// REVIEW 2026-11-16: pass 5, fix 15, drop 0, new 0; ear checks 1
// Open: c1 (C2) assumes "Smile if you love men's prostates" comes from the same voice as "pick up babes". Nothing
//   in the words contradicts it, but it isn't on the ear list.
// “Smile If You Love Men's Prostates - The Office US” (the official The Office channel, BEST OF SEASON 9 - The Office
// US): the men grow mustaches for Movember; a conference call with Jim breaks down over his echoing line; Erin's
// compliments on a coworker's mustache keep turning into insults.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 128 s. Jim is named at 68.9 s
// (“Halpert”; captions “helper”) and 77.4 s. Untested: 18–20 s (“turned on all the time”, innuendo), 23–26 s (“keeps
// all/on coming”, “I/They have very fertile hair glands”), 66.9 s (“it's sounding”/“that sounded”, not in any key),
// 81–85 s (“I should have just had you call me on my cell” is garbled in the captions), and the silent wait at
// 90–99 s (short lines whose speakers and wording the sources don't settle).
// EAR CHECK: 100–128 s d3 m1 a2 c2 — the woman who answers after “Erin, did this call come?” (captions “did this
//   called”) is Erin, and the man with the mustache says “It's for the thing” (assumed from the turns)
import type { Clip } from '../types.ts';

export const movember: Clip = {
  id: 'movember', video: 'BXxyRv2elcE', title: 'Smile If You Love Men\'s Prostates', dur: 155, wpm: 127, band: 'slow',
  tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 85 %): the key was the only choice about growing mustaches, which are on screen. All three are
    //   now reasons for the mustaches.
    // why: contest ← "Toby got us all to participate" heard as a contest he set up; checkups ← "prostate cancer" is
    //   said, so a health drive sounds likely
    { id: 'g1', skill: 'gist', level: 'B1', point: 'why', reveals: ['pledge'], seg: [7.0, 41.0],
      stem: 'Why have the men all grown mustaches?',
      choices: ['To back a cancer charity with money', 'To win a contest Toby set up for them',
                'To push each other to get checkups'], a: 0,
      cue: '「Toby got us all」から、説明の流れ全体。',
      said: '前立腺がんの寄付のために、11月のあいだ口ひげを伸ばす企画に、男性みんなで参加したと話す。',
      mean: '口ひげは、がんの寄付企画に参加したしるし。',
      trap: 'Toby の名前で「彼のコンテスト」、cancer で「検査」と取りやすい。説明の中心は寄付と口ひげ。',
      use: 'It’s for a good cause.（いいことのためなんだ）' },

    // R fix: V2 (blind 55 %): "Promise some money" was the only charity-like choice. "Bet some money" replaces "Sign up a
    //   coworker".
    // why: checkup ← "prostate cancer" just before; bet ← "money" caught, "pledge" not known, and a mustache bet
    //   sounds like an office game
    { id: 'd1', skill: 'detail', level: 'B1', point: 'pledge', seg: [10.3, 16.0],
      stem: 'In the Movember rules, what do you do besides growing a mustache?',
      choices: ['Promise some money', 'Bet some money', 'Get a medical checkup'], a: 0,
      cue: '「You」のすぐあと、mustache より前。',
      line: 'You *pledge money* and then you grow a mustache for the month of November.',
      said: '「お金を出すと約束して、11月のあいだ口ひげを伸ばす」と説明する。',
      mean: 'pledge ＝ 寄付を約束する。口ひげは、寄付したことの目印。',
      trap: 'がんと聞くと検査を、money だけ拾うと賭けを思い浮かべやすい。pledge ＝ 約束して出す。',
      use: 'I pledged twenty dollars.（20ドル寄付すると約束した）' },

    // R fix: V2 (blind 50 %): "Got the other men a deal on it" was a filler. Now the get-someone-to-do direction
    //   flipped.
    // why: talked into it by them ← the direction of "get someone to do" reversed, helped by "Toby got us all…" in
    //   another voice; joined because others did ← "all of the dudes" heard as the crowd he followed
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'got', seg: [26.9, 31.2],
      stem: 'What does the speaker say he did about Movember?',
      choices: ['Talked the other men into joining', 'Was talked into joining by the men',
                'Joined only because the other men did'], a: 0,
      cue: '「so glad」のあと、got の使い方。',
      line: 'I am so glad I *got all of the dudes to do* Movember.',
      said: '「男たち全員をモーベンバーに参加させられて、本当によかった」と話す。',
      mean: 'get 人 to do ＝ 人を説得して〜させる。この人が言い出した側。',
      trap: 'got を「もらった」や逆向きに取りやすい。get＋人＋to do は主語が「させる」側。',
      use: 'I finally got him to see a doctor.（やっと彼を医者に行かせた）' },

    // R fix: V2 (blind 55 %): the key was the only positive choice. "Proud of the money" (keyword) and "Amused by how
    //   silly…" replace "Tired of it" and "Embarrassed".
    // why: proud of the money ← "pledge money" earlier and a charity setting; amused ← an adult using teen slang
    //   heard as self-mocking
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'proud', reveals: ['dope', 'got'], seg: [26.9, 41.0],
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
    { id: 'p2', skill: 'phrase', level: 'B2', point: 'dope', seg: [31.6, 34.7],
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
    { id: 'c1', skill: 'humor', level: 'C2', point: 'smile', reveals: ['dope', 'proud'], seg: [35.5, 41.0],
      stem: 'In his line about lunch and prostates, who is the joke on?',
      choices: ['Himself, for thinking it’s a smooth line', 'The charity, for having such an awkward cause',
                'The women, who have to hear it at lunch'], a: 0,
      cue: '「pick up babes」の直後に、何を言っているか。',
      line: 'We even go to lunch, *pick up babes*. *Smile if you love men’s prostates.*',
      said: '「昼に女の子に声をかける」と言い、続けて「前立腺が好きなら笑って」と決めぜりふ風に言う。',
      mean: '本人は気の利いた口説き文句のつもりだが中身は前立腺。笑われているのは本人。',
      trap: '前立腺という語そのものや、女性への冗談と取りやすい。pick up babes の直後の、彼の決めぜりふ。',
      use: 'I thought it was smooth. It wasn’t.（うまく言えたと思ったのに）' },

    // R fix: V2 (blind 65 %): "moving back for good" was a filler. "Called away" (a near miss: it does stop) replaces
    //   it, and the plan choice names the three months.
    // why: called away ← it does stop, and Jim does leave the line, but over the sound; plan ← "three months" and
    //   "I had some ideas" sound like the meeting went on
    { id: 'g2', skill: 'gist', level: 'B2', point: 'call', reveals: ['voice', 'spot', 'months'], seg: [43.0, 90.0],
      stem: 'What happens to the conference call with Jim?',
      choices: ['A bad line stops it before it really starts', 'It goes fine until Jim is called away',
                'They agree on a plan for the next three months'], a: 0,
      cue: '電話会議の流れ全体。最後にどうなるか。',
      said: '会議を始めるが、ジムの声が響いて聞きづらく、彼は場所を変えてかけ直すと言う。',
      mean: '話し合いの中身に入る前に、回線の問題で止まってしまう。',
      trap: 'three months や ideas で計画が進んだ、途中で呼ばれた、と取りやすい。中身の前に音で止まる。',
      use: 'Can you hear me okay?（ちゃんと聞こえてる？）' },

    // why: not joined yet ← "We all on?" heard as a roll call; the line is down ← the call does break down later
    { id: 'i1', skill: 'infer', level: 'B2', point: 'on', seg: [44.6, 51.2],
      stem: 'When the caller asks if they’re all on, what does the reply point out?',
      choices: ['Only he is on the line; the rest share a room', 'Some people still have not joined the call yet',
                'The line has not been working properly'], a: 0,
      cue: '「Well」のあと、2つの居場所の言い方の対比。',
      line: 'We all on? — Well, *you’re the only one on*. We’re *all here*.',
      said: '「みんな入ってる？」と聞かれ、「入ってるのは君だけ。みんなここにいる」と返す。',
      mean: 'on は電話会議につながっていること。ほかの全員は同じ部屋にいる。',
      trap: 'まだ入っていない人がいる、と取りやすい。on と here を比べれば、離れているのは一人。',
      use: 'Is everyone on the call?（全員つながってる？）' },

    // why: three weeks ← "three" caught, the unit guessed; thirty days ← three/thirty; thirteen months ←
    //   "three months" run together
    { id: 'n1', skill: 'number', level: 'B1', point: 'months', seg: [51.6, 56.8],
      stem: 'What period is the meeting meant to plan for?',
      choices: ['The next three weeks', 'The next thirty days', 'The next three months', 'The next thirteen months'],
      a: 2, keep: true,
      cue: '「over the next」のあと。すぐあとで言い直される。',
      line: 'over the next *three months*… That’s the winter season. *Three months.*',
      said: '「この先3か月で…」と始め、別の人が「冬のシーズンだ。3か月」と言い直す。',
      mean: '会議のテーマは、冬の3か月の計画。',
      trap: 'three と thirty、three と thirteen は始まりが同じ。語の長さと months の s まで聞く。',
      use: 'Over the next three months, we’ll…（この先3か月で…）' },

    // why: to come back ← "I'd rather be with you" heard as a request; dull office ← "at your office" + a sigh-like
    //   "trust me" heard as a complaint
    { id: 'pr1', skill: 'pragma', level: 'C1', point: 'rather', seg: [59.6, 66.0],
      stem: 'Asked if he’s at his office, why does Jim add the second sentence?',
      choices: ['To show he isn’t away by choice', 'To ask if he can come back soon',
                'To complain that his office is dull'], a: 0,
      cue: '「office」の質問への、返事の2文目。',
      line: 'Are you at your office right now? — Yeah. *Trust me*, I’d rather be with you guys.',
      said: '「今、自分のオフィス？」と聞かれ、「うん。本当はそっちにいたいよ」と答える。',
      mean: '離れているのを責められた気がして、好きで離れているのではないと伝えている。',
      trap: '戻りたいという頼みに聞こえるが、頼む形ではない。Trust me は「本当だよ」の前置き。',
      use: 'Trust me, I tried.（本当だって、やってはみたんだ）' },

    // R fix: V2 (blind 70 %): "I would" left no word for "rather". "I'd like to" fits the gap as naturally.
    // why: I'd better ← the same rhythm, and the t flaps; I'd like to ← fits as naturally, r/l blur at the start
    { id: 's1', skill: 'sound', level: 'B2', point: 'rather', seg: [62.5, 65.8],
      stem: 'Fill the gap: “Trust me, ___ be with you guys.”',
      choices: ['I’d rather', 'I’d better', 'I’d like to'], a: 0,
      cue: '「Trust me」のあと、短く速い2語。',
      line: 'Trust me, *I’d rather* be with you guys.',
      said: '「本当に、そっちでみんなといたいよ」と答える。',
      mean: 'I’d rather ＝ むしろ〜したい。I’d の d はほぼ聞こえない。',
      trap: 'I’d better は「〜しないとまずい」、I’d like to なら to が残る。rather は「ラザー」。',
      use: 'I’d rather stay in tonight.（今夜は家にいたいな）' },

    // R fix: K2: "tired and low" was half true (a Batman voice is low), and "echoey" in the key isn't in the words.
    //   Now "tired and flat" against "strange and eerie" (spooky).
    // why: tired ← a flat voice on a bad line can sound tired; flirting ← "sexy" taken literally
    { id: 'i2', skill: 'infer', level: 'C1', point: 'voice', seg: [65.8, 74.4],
      stem: 'What does the coworker mean about how Jim sounds?',
      choices: ['His voice sounds strange and eerie', 'His voice sounds tired and flat',
                'He sounds like he’s flirting'], a: 0,
      cue: '「kind of」のあとの2語と、ジムの返事。',
      line: 'that sounded kind of *spooky sexy* over here, Halpert. — Sorry, I was saying… *call me on the*…',
      said: '「なんか、こっちには不気味でセクシーに聞こえるぞ」と言われ、ジムは別の電話を勧めかける。',
      mean: '電話の声がこもって、不気味で変に聞こえるということ。spooky ＝ 不気味な。',
      trap: 'sexy だけ拾うと口説きに聞こえるが、話しているのは電話の音のこと。',
      use: 'You’re breaking up a little.（ちょっと声が途切れてるよ）' },

    // R fix: V2 (blind 60 %): "his important new job" had no hook in the clip. Now "acting like a hero" (a reading of
    //   "not Batman"), and the wrong-number choice is reworded.
    // why: a stranger ← "there's been a mistake… trying to reach Jim" is the usual wrong-person line; hero ← "not
    //   Batman" heard as a dig at Jim acting big
    { id: 'h1', skill: 'humor', level: 'C1', point: 'batman', reveals: ['voice'], seg: [74.4, 79.6],
      stem: 'Why does the coworker’s “mistake” line get a laugh?',
      choices: ['He pretends the odd voice is someone else’s', 'He really thinks a stranger has picked up',
                'He’s mocking Jim for acting like a hero'], a: 0,
      cue: '「mistake」のあとの、名前の対比。',
      line: 'I think there’s been a mistake. We’re trying to reach *Jim Halpert, not Batman*.',
      said: '「何かの手違いでは。ジム・ハルパートにかけていて、バットマンではないんですが」と言う。',
      mean: 'こもった変な声を、ヒーローの声に見立てて別人扱いしている。',
      trap: 'mistake を本当の人違い、Batman をヒーロー気取りへの皮肉と取りやすい。話題は声。',
      use: 'Sorry, I think you have the wrong number.（番号をお間違えのようです）' },

    // R fix: V2 (blind 55 %): "Wait until the line gets better" was weak. "Have them call his cell phone" (his own
    //   "I should have just had you call me on my cell", 81–85 s) replaces it.
    // why: cell ← he has just said he should have had them call his cell; email ← "I had some ideas" earlier
    { id: 'd2', skill: 'detail', level: 'B1', point: 'spot', seg: [85.6, 89.6],
      stem: 'What does Jim say he’ll do next?',
      choices: ['Move to another spot and call back', 'Send them his ideas by email',
                'Have them call his cell phone'], a: 0,
      cue: '「I’m gonna try」のあと。',
      line: 'I’m gonna try a *different spot*, okay? … I’ll *call you right back*.',
      said: '「別の場所で試してみる。すぐかけ直すね」と言う。',
      mean: '電話の音が悪いので、場所を変えてかけ直すつもり。',
      trap: '直前の my cell から「携帯にかけてもらう」と取りやすいが、あれは「そうすればよかった」の話。',
      use: 'Let me call you right back.（すぐかけ直します）' },

    // why: unibrow ← "eyebrow" caught, and "makes it look like" suggests eyebrows; a smile ← the mustache sits over
    //   the mouth
    { id: 'd3', skill: 'detail', level: 'B1', point: 'eyebrow', seg: [107.4, 112.0],
      stem: 'What does Erin say the mustache makes his face look like?',
      choices: ['Like there’s an eyebrow in the middle', 'Like his two eyebrows have grown together',
                'Like a smile drawn above his lip'], a: 0,
      cue: '「makes it look like」のあと。',
      line: 'it makes it look like there’s *an eyebrow in the middle of your face*.',
      said: '「（そのひげだと）顔の真ん中に眉毛があるみたい」と言う。',
      mean: '口ひげを、顔の真ん中の眉毛にたとえている。悪気のない率直な感想。',
      trap: 'eyebrow で「眉がつながる」と思いやすい。in the middle of your face まで聞く。',
      use: 'It makes you look taller.（それ着ると背が高く見えるね）' },

    // R fix: V2 (blind 70 %): the key was the only nuanced choice. The distractors now read "um" two other ways.
    // why: a shy compliment ← "um" after "handsome" heard as shyness (えっと as 照れ); subject change ← "um" heard as
    //   her moving on
    { id: 'm1', skill: 'marker', level: 'B2', point: 'but', reveals: ['socket'], seg: [112.8, 118.0],
      stem: 'Right after Erin calls it handsome, what does the next part bring?',
      choices: ['A less flattering point she finds hard to say', 'A second compliment she is shy to say',
                'A pause before she changes the subject'], a: 0,
      cue: 'ほめ言葉のすぐあと、短い一語と「um」。',
      line: 'A handsome eyebrow, *but, um*, makes your mouth look like an eye socket.',
      said: '「ハンサムな眉毛よ。でも、えっと、口が目のくぼみみたいに見える」と続ける。',
      mean: 'but のあとに本音が来る。um は言いにくさのしるしで、ここから悪い話になる。',
      trap: 'um を照れと取るとほめ言葉の続きに聞こえる。but のあとが本音で、前は前置き。',
      use: 'It’s nice, but, um, a bit loud.（いいけど、えっと、ちょっと派手かな）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'socket', seg: [114.4, 118.0],
      stem: 'Type what Erin says: “makes your mouth ___ eye socket.” (3 words)', answer: 'look like an',
      cue: '「mouth」のあと、つながる3語。',
      line: 'makes your mouth *look like an* eye socket.',
      said: '「口が目のくぼみみたいに見える」と言う。',
      mean: 'look like an が「ルッライカン」のように一続き。an は次の eye とつながる。',
      trap: 'k と l、n と eye がつながって語の切れ目が消える。like のあとの短い an を落としやすい。',
      use: 'You look like a movie star.（映画スターみたい）' },

    // R fix: V2 (blind 50 %): "Which wasn't" (wrong tense) → "That isn't", as natural as the key. S4: seg 2.8 s →
    //   3.4 s.
    // why: Which is ← n't loses its t (and "Which is great" comes later); It isn't / That isn't ← the same ending,
    //   the weak "which" misheard
    { id: 's2', skill: 'sound', level: 'B2', point: 'notbad', seg: [115.6, 119.0],
      stem: 'Fill the gap: “___ bad.”',
      choices: ['Which isn’t', 'Which is', 'It isn’t', 'That isn’t'], a: 0,
      cue: '「eye socket」のすぐあと、文頭の2語。',
      line: '…an eye socket. *Which isn’t* bad.',
      said: '「目のくぼみみたい。…悪くはないけど」と付け足す。',
      mean: 'isn’t の t はほぼ消えて「イズン」。悪口のあとに慌ててフォローしている。',
      trap: 'n’t が弱いと Which is に聞こえ、意味が逆になる。最後の「ン」が否定のしるし。',
      use: 'Which isn’t a bad thing.（それは悪いことじゃないけど）' },

    // R fix: V2 (blind 65 %): "Praising… meaning every word" was a filler. Now "teasing, as friends do", so two
    //   readings of the barbs compete with the key.
    // why: mocking ← praise and insults side by side read as sarcasm; teasing ← the "which…" follow-ups heard as
    //   friendly ribbing
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'cover', seg: [118.8, 128.0],
      stem: 'As Erin keeps adding short “which…” lines, what is she doing?',
      choices: ['Trying to be kind, but each fix makes it worse', 'Mocking him, but hiding it behind nice words',
                'Teasing him, as friends do, and he knows it'], a: 0,
      cue: 'ひどいたとえのたびに付ける、短い一言。',
      line: 'you look like a Cyclops whose eye fell out. *Which is great.* It’s such a great cause.',
      said: '「目が抜けた一つ目の巨人みたい。…素敵。いい活動だし」と言い足す。',
      mean: '傷つけまいとフォローするが、たとえがどんどんひどくなる。悪意でなく正直すぎるだけ。',
      trap: 'ほめと悪口が並ぶと皮肉やからかいに見えるが、わざとなら謝ったり言い直したりしない。',
      use: 'That came out wrong.（今の言い方はまずかった）' },

    // anchor: 109–124 s her real view comes in the pictures ("an eyebrow in the middle of your face", "an eye
    //   socket", "a Cyclops whose eye fell out"); 126.6 s "It's such a great cause" moves the praise from the
    //   mustache to the charity
    // R fix: V2 (blind 70 %): near misses now: the cause as a bit silly (wrong target), starting to like it (wrong
    //   direction).
    // why: silly cause ← "cause" heard as what her doubt is about; starting to like it ← "a handsome eyebrow" and
    //   "Which is great" taken at face value
    { id: 'c2', skill: 'attitude', level: 'C2', point: 'cover', seg: [119.2, 128.4],
      stem: 'When Erin ends on the “great cause”, what is she trying not to say?',
      choices: ['That the mustache just doesn’t suit him', 'That she thinks the cause is a bit silly',
                'That she’s starting to like the mustache'], a: 0,
      cue: 'ほめる相手が、ひげから何に変わるか。',
      line: '…whose eye fell out. Which is great. *It’s such a great cause.*',
      said: '「目が抜けた巨人みたい。素敵よ。すごくいい活動だし」と、最後は寄付の目的をほめる。',
      mean: 'ほめる対象をひげから目的にすり替えた。ほめる所がないとき目的をほめるのは、よくある逃げ方。',
      trap: 'cause を活動への本音と、handsome や great を好意と取りやすい。直前のたとえが本音。',
      use: 'Well, it’s the thought that counts.（まあ、気持ちが大事だよね）' },
  ]
};
