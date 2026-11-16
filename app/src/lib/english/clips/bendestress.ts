// REVIEW 2026-11-17: pass 7, fix 16, drop 0, new 0; ear checks 1
// OPEN: w1's name choices ('Tom' 3 chars vs 'Neither of them' 15) trip a literal K7 reading; left as is, on the
//   assumption the repo test exempts who items with names like number/sound. The w1/pr2 speaker ear check was removed:
//   the address "Donna, you and I" and the reply to "Tom." settle it.
// “Ben Destresses His Life | Parks and Recreation” (the official Parks and Recreation channel, Season 4): a tense Ben
// snaps at the office over overdue forms and admits to the camera that his reason for staying in town is gone; Donna
// talks Tom into bringing him along on Treat Yourself day, and the spa and acupuncture leave him more stressed than ever.
// Segments from the captions, words from whisper (2026-11-16). Names in the audio: Jerry, Ben, Donna, Tom. Untested:
// 54.6 s (“This is expired”: what “this” is shows on screen), 58–70 s (music; whisper loops one invented line), 95.7 s
// (“Guano!”: whisper only), 110.9 s (the nickname: captions “manuvian”), 136.5–139.6 s (captions “no super events”,
// whisper “No soup in the vents”), 169–179 s (the acupuncture rhyme), 204 s on (music; whisper invents a goodbye).
// EAR CHECK: 12.96 s ph1 pr1 — captions “at our own speech”, whisper “at our own speed” (Ben's “at my speed” is in both)
import type { Clip } from '../types.ts';

export const benDestress: Clip = {
  id: 'bendestress', video: 'gn3A9O8N-SA', title: 'Ben Destresses His Life', dur: 224, wpm: 163, band: 'mid',
  tags: ['職場', '友だち'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 85 %): the key was the only concrete office task; both distractors are now paperwork too
    // why: help audit ← "auditing the budget" is the first thing he says, heard as the job he's asking for; lost forms
    //   ← "you haven't filled out a PC-10 form" heard as forms gone missing
    { id: 'g1', skill: 'gist', level: 'B1', point: 'forms', seg: [0, 39.6],
      stem: 'What does Ben want from the team in the first scene?',
      choices: ['To get their overdue forms filled out', 'To have them help him audit the budget',
                'To find out who lost the old forms'], a: 0,
      cue: '最初の一文の後半と、最後の一言。',
      line: 'you’re *way behind on your paperwork*. … *Fill out the forms*, please.',
      said: '予算を調べたら書類がかなり遅れていると言い、最後に「書類を出して」と念を押す。',
      mean: '予算の確認はきっかけで、用件は遅れている書類を出させること。',
      trap: '最初に budget が聞こえるので監査の手伝いに思える。最後の頼みが用件。',
      use: 'I’m a little behind on my emails.（メールの返信が少し遅れてて）' },

    { id: 'n1', skill: 'number', level: 'B1', point: 'years', seg: [3.5, 10.6], keep: true,
      stem: 'How long has it been since Jerry filled out that form?',
      choices: ['2 years', '2 and a half years', '10 years'], a: 1,
      cue: '「form in」のあとの数。',
      line: 'you haven’t filled out a PC-10 form in *two and a half years*.',
      said: '「PC-10の書類を2年半出していない」と言われる。',
      mean: 'in＋期間 は否定文で「〜の間ずっと」。2年半も放置している。',
      trap: 'and a が弱く two と half がつながる。書類名の10は年数ではない。',
      use: 'I haven’t seen her in two years.（彼女とは2年会ってない）' },

    // R fix: V2 (blind 50 %): the key was the only casual choice; "careful" became an opposite-pace near miss
    // why: the office's pace ← "speed" caught, "our own" lost; own way ← "our own" heard as their own method
    { id: 'ph1', skill: 'phrase', level: 'B2', point: 'speed', seg: [10.3, 16.45],
      stem: 'How does a coworker describe the team’s way with paperwork?',
      choices: ['They do it at whatever pace suits them', 'They keep to the pace the office sets',
                'They each fill it out in their own way'], a: 0,
      cue: '「paperwork」のあとの言い方。',
      line: 'we kind of do our paperwork *at our own speed*.',
      said: '「書類は自分たちのペースでやってるんで」と軽く返す。',
      mean: 'at one’s own speed ＝ 自分の好きなペースで。急かされる気はないということ。',
      trap: 'speed だけだと決まったペース、own だと方法と取りやすい。',
      use: 'Take it at your own pace.（自分のペースでいいよ）', retired: true },

    // R fix: V2 (blind 60 %): "joking along" was weak; a Japanese-frame "goes along, just this once" replaces it
    // why: unsure ← "kind of" read as real doubt (〜かも); going along ← "Oh, really? Well…" heard as そうですか、
    //   では…, a concession
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'myspeed', reveals: ['speed'], seg: [10.3, 18.3],
      stem: 'What is Ben doing with his “Oh, really? Well…” reply?',
      choices: ['Using their words to insist on his pace', 'Admitting he isn’t sure how fast it has to be',
                'Going along with their pace, just this once'], a: 0,
      cue: '相手の言葉と、彼の返事で入れかわる一語。',
      line: 'at our own speed. — Oh, really? Well, I *kind of need* you to do it at *my speed*.',
      said: '「自分たちのペースで」に、「僕のペースでやってほしいんだけど」と返す。',
      mean: '相手の言い方を借り、our を my に変えて従わせる。kind of は角を取るだけ。',
      trap: 'kind of や Well を迷いや譲歩と取りやすい。中身が命令なら飾り。',
      use: 'I kind of need this by Friday.（金曜までにお願いしたいんだけど）', retired: true },

    // R fix: V2 (blind 70 %): "openly" was weak; a calm "only tired" excuse replaces it, and "lightly" names the joke
    // why: lightly ← the coworker's joke invites a joke back; only tired ← "Nothing is wrong" heard as the polite
    //   大丈夫 with a reason to follow
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'nothing', seg: [18.4, 24.0],
      stem: 'How does Ben answer the question about his mood?',
      choices: ['Curtly, shutting the topic down', 'Lightly, joking back about the show',
                'Calmly, saying he’s only a bit tired'], a: 0,
      cue: '質問のすぐあと、二つの短い文。',
      line: '*Nothing is wrong. Just do your job.*',
      said: '「何でもない。仕事をしてくれ」とだけ言う。',
      mean: '理由は言わず、話を仕事に戻して打ち切っている。短さがいら立ちを示す。',
      trap: '冗談の質問なので冗談で返したと思いやすい。返事の短さと命令の形を聞く。',
      use: 'I’m fine. Let’s just get started.（大丈夫。とにかく始めよう）' },

    // R fix: V2 (blind 55 %): the key was the only tease; a wrong-mechanism tease replaces "the show was in the news"
    // why: worry ← "What is wrong with you today?" heard as real concern; watches at work ← a tease, but about
    //   watching TV, with "cancel" missed
    { id: 'i1', skill: 'infer', level: 'C1', point: 'got', seg: [18.4, 24.0],
      stem: 'What is the coworker’s question about the TV show really saying?',
      choices: ['A tease: only a TV show could upset him', 'Worry: he looks like he’s had some bad news',
                'A tease: he watches too much TV at work'], a: 0,
      cue: '「today」のあとの、二つ目の質問。',
      line: 'What is wrong with you today? *Did they cancel Game of Thrones?*',
      said: '「今日はどうしたの？あのドラマが打ち切りにでもなった？」と聞く。',
      mean: '動揺の理由はファンタジー番組くらいだろう、というからかい。オタク扱いしている。',
      trap: '前半だけなら心配に聞こえる。理由を軽い物で当ててみせたら、からかい。',
      use: 'Who died? Why the long face?（誰か死んだ？浮かない顔して）' },

    // C2: the talking head against the scene (cf. i1)
    // R fix: notes were 140 characters (> 120); mean and trap cut. Blind pass missed it, so the choices stay
    // anchor: 19.0–23.4 s "What is wrong… Did they cancel Game of Thrones?" → "Nothing is wrong. Just do your job.";
    //   26.2–34.7 s to camera, he answers only the joke, at length ("would never cancel… crossover hit… human stories")
    // why: show cancelled ← "cancel" heard in his own line, with "would never" missed; opening up ← talking heads often
    //   confess, but this one never leaves the show
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'got', reveals: ['nothing', 'crossover'], seg: [18.4, 35.2],
      stem: 'Set against his comment to the camera, what does Ben’s office reply show?',
      choices: ['He shrugged off the question, but the joke stung', 'He was upset because his show had been cancelled',
                'He was ready to open up, but only to the camera'], a: 0,
      cue: '場面で流したことと、カメラの前で言い返すこと。',
      line: 'Did they cancel Game of Thrones? — Nothing is wrong. … And they *would never cancel* Game of Thrones. It’s a *crossover hit*.',
      said: '場面では「何でもない」と流し、カメラには「打ち切りなんてありえない。幅広い人気作だ」と力説する。',
      mean: '本当の質問は流し、冗談にだけ後から反論する。刺さったのは冗談の方。',
      trap: 'カメラの前は本音の場と思いやすいが、話すのは番組のことだけ。',
      use: 'For the record, I wasn’t upset.（言っておくけど、怒ってないから）' },

    // why: only for fans ← "not just for" with "just" lost, so it sounds like "not for… / for fantasy enthusiasts";
    //   true stories ← "human stories" taken as real-life ones
    { id: 'd1', skill: 'detail', level: 'B2', point: 'crossover', seg: [25.6, 35.2],
      stem: 'What does Ben say about the show to the camera?',
      choices: ['It’s a hit with all kinds of viewers', 'It’s made mainly for fantasy fans', 'It’s based on real people’s true stories'], a: 0,
      cue: '「It’s a」のあとと、「not just」のあと。',
      line: 'It’s a *crossover hit*. It’s *not just for* fantasy enthusiasts.',
      said: '「ファン以外にも受けている」と言う。',
      mean: 'crossover hit ＝ 客層をこえたヒット作。だから打ち切りはない、という理屈。',
      trap: 'just が弱く消えると「ファン向け」に聞こえる。human stories は実話ではない。',
      use: 'It’s not just for kids.（子ども向けだけじゃないよ）' },

    // R fix: V2 (blind 85 %): "told to leave" was weak; a "may soon be gone" near miss on the tense replaces it
    // why: just found one ← "used to" lost, so "I… have one really good reason" sounds current; may soon be gone ←
    //   "not sure what's keeping me" heard as doubt about the future, with "used to… but now" missed
    { id: 'i2', skill: 'infer', level: 'B2', point: 'reason', seg: [39.2, 46.3],
      stem: 'What does Ben’s first line to the camera suggest about his life in town?',
      choices: ['The reason he stayed there is gone now', 'He has just found a good reason to stay on',
                'The reason he stays may soon be gone'], a: 0,
      cue: '文頭の「I」のあとの二語と、後半の対比。',
      line: 'I *used to have* one really good reason for staying in Pawnee, but now I’m *not sure what’s keeping me here*.',
      said: '「残る大きな理由があったけど、今は何が引き止めているのか分からない」と話す。',
      mean: 'used to は「前は〜だった」。理由はもうなくなった、と打ち明けている。',
      trap: 'used to が弱いと今や先の話に聞こえる。but now が対比の合図。',
      use: 'I used to love this place.（前はこの店が大好きだった）' },

    // R fix: V2 (blind 70 %): the key was the only abstract choice; all three are now concrete claims about the sub
    // why: leave after the sub ← "two sandwiches away" heard as a countdown to going; can't afford lunch ← "free" heard
    //   as money trouble
    { id: 'h1', skill: 'humor', level: 'C1', point: 'sub', reveals: ['reason'], seg: [39.2, 51.9],
      stem: 'Why does Ben’s last line to the camera get a laugh?',
      choices: ['He offers a free sandwich as a reason to stay', 'He says he’ll leave as soon as he gets the sub',
                'He admits he can’t even afford a sandwich now'], a: 0,
      cue: '「Although」のあとと、その前の話の重さ。',
      line: 'not sure what’s keeping me here. *Although* I am just *two sandwiches away from a free meatball sub*.',
      said: '残る理由がないと言った直後、「でもあと2個でサンドイッチが1個無料」と付け足す。',
      mean: 'although で、重い話の反対側に無料のサブを置く。釣り合わない小ささが笑い。',
      trap: 'although は「でも」。去る理由でなく、残る理由を一つ足している。',
      use: 'Although, there is free pizza.（まあ、ピザはタダだけどね）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'treat', seg: [72.0, 78.8],
      stem: 'Type the words: “Once a year, Donna and I ___ ourselves.” (4 words)', answer: 'spend a day treating',
      cue: '「Donna and I」のすぐあと。',
      line: 'Once a year, Donna and I *spend a day treating* ourselves.',
      said: '「年に一度、ドナと自分にごほうびの日を過ごす」と言う。',
      mean: 'spend a day ～ing ＝ 〜して1日過ごす。treat oneself ＝ 自分へのごほうび。',
      trap: 'spend a day がつながって「スペンダデイ」に聞こえ、a が消えやすい。',
      use: 'We spent a day hiking in the hills.（丘でハイキングして1日過ごした）' },

    // why: forms ← the wrong cause: the overdue paperwork opens the clip, but no cause is given here; break from him ←
    //   the wrong person: "a day off" heard as Tom and Donna's own need, with "he… could use" missed
    { id: 'd3', skill: 'detail', level: 'B1', point: 'dayoff', seg: [97.4, 104.2],
      stem: 'What reason is given for bringing Ben along?',
      choices: ['He seems badly in need of a day off from work', 'He seems stressed out over the overdue forms',
                'They need a break from how tense he makes them'], a: 0,
      cue: '「This is our thing」のあとの「but」。',
      line: 'But he really seems like he *could use a day off*.',
      said: '「でも彼、休みが必要そうに見える」と言う。',
      mean: 'could use ～ ＝ 〜があるとありがたい、〜が必要。ここでは休みが必要ということ。',
      trap: '原因を探したくなるが、言うのは休みが要ることだけ。誰の休みかは主語の he で分かる。',
      use: 'I could use a coffee.（コーヒーが飲みたいな）' },

    // R fix: V2 (blind 70 %): "worn out" was weak; a "skinny little" keyword trap replaces it
    // why: thin and weak ← "skinny little" caught, with "snap" missed; stretched but tough ← a rubber band
    //   stretches and springs back, with "about to" lost
    { id: 'ph2', skill: 'phrase', level: 'C1', point: 'snap', seg: [100.4, 104.2],
      stem: 'What picture of Ben does the rubber band comparison give?',
      choices: ['So tense he could break down any minute', 'So thin and weak he could fall ill soon',
                'Stretched a lot, but tough enough to take it'], a: 0,
      cue: '「rubber band」のあとの動き。',
      line: 'He’s like a skinny little rubber band that’s *about to snap in half*.',
      said: '「今にも真っ二つに切れそうな、細い輪ゴムみたい」と言う。',
      mean: 'snap ＝ ぷつんと切れる。人について言うと、我慢の限界でキレる寸前のこと。',
      trap: 'skinny に引かれたり、輪ゴムは戻ると考えやすい。about to snap は今にも切れる状態。',
      use: 'I’m about to snap. I need a break.（もう限界。休まないと）' },

    // R fix: V2 (blind 70 %): "how to relax" made "doesn't" the only natural collocation; the stem stops at "know",
    //   and the why: comment named a choice ("did") that isn't there
    // why: does ← n't's t drops, so "doesn'" can sound like "does"; didn't ← the d-n-t shape is caught, the vowel missed
    { id: 's1', skill: 'sound', level: 'B2', point: 'relax', seg: [104.1, 108.5],
      stem: 'Fill the gap: “Exactly. He ___ know…”',
      choices: ['does', 'doesn’t', 'didn’t'], a: 1,
      cue: '「Exactly」のあと、He に続く短い語。',
      line: 'Exactly. He *doesn’t* know how to relax.',
      said: '「その通り。あいつはくつろぎ方を知らない」と言う。',
      mean: 'doesn’t の t はほぼ消えて「ダズン」で止まる。know につながって聞こえる。',
      trap: 'does だと逆の意味。t が消えても「ン」が残るかで、否定を聞き分ける。',
      use: 'She doesn’t know how to say no.（彼女は断り方を知らない）' },

    // R fix: V2 (blind 60 %): the key was the only abstract choice; now three readings of who is too slow or fast
    // why: too slow ← the usual meaning of "keep up", with "slow down enough" missed; too fast for them ← right
    //   that Ben is fast, wrong direction: it's Ben who can't keep up
    { id: 'h2', skill: 'humor', level: 'C1', point: 'keepup', seg: [104.1, 110.95],
      stem: 'What makes the line about Ben keeping up funny?',
      choices: ['To keep up, Ben would have to go slower', 'Ben is too slow to keep up with the two of them',
                'Ben works too fast for them to keep up'], a: 0,
      cue: '「slow down」と「keep up」の組み合わせ。',
      line: 'There’s no way Ben can *slow down enough to keep up* with us.',
      said: '「ベンには、俺たちについて来られるほどペースを落とすのは無理」と言う。',
      mean: 'ついて来るにはゆっくりする必要がある、という逆さの理屈。くつろぎを競技のように話す。',
      trap: 'keep up は「遅れずについて行く」が普通。ここはベンが速すぎて、落とせない側。',
      use: 'You need to slow down a little.（もう少しペースを落とさないと）' },

    // why: Donna ← she raised the idea, and "Exactly" can sound like her side winning; neither ← "Exactly. He doesn't
    //   know how to relax" sounds like support for the plan
    { id: 'w1', skill: 'who', level: 'B2', point: 'against', seg: [104.1, 115.5],
      stem: 'Who argues against bringing Ben along?',
      choices: ['Tom, to Donna', 'Donna, to Tom', 'Neither of them'], a: 0,
      cue: '話している人が、誰に呼びかけているか。',
      line: '*Donna, you and I* are relaxation professionals.',
      said: '「ドナ、俺たちはくつろぎのプロだ。ベンじゃついて来られない」と言う。',
      mean: 'ドナに呼びかけているので、話しているのはトム。年に一度の自分の日だと渋っている。',
      trap: 'Exactly で始まるので賛成に聞こえる。同意したのは「ベンは休めない」という点だけ。',
      use: 'Sorry, this is kind of our thing.（ごめん、これは私たちの恒例なんだ）' },

    // R fix: V2 (blind 70 %): "looks fine" was weak; an "agrees he looks sad" reading of Fine replaces it, and the
    //   segment now runs to "Come on, rubber band. Come with us", which settles it
    // why: agrees he looks sad ← "Fine." heard as accepting the soup remark; go without me ← the sulky "Fine." that
    //   ends a talk
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'fine', reveals: ['against'], seg: [122.8, 135.3],
      stem: 'After the soup remark, Tom hears his name. What does his reply mean?',
      choices: ['He gives in: Ben can come along', 'He agrees: Ben does look a bit sad',
                'He refuses: Donna can go without him'], a: 0,
      cue: '呼ばれた名前と、短い返事の間。',
      line: 'Is he eating soup on a bench *alone*? — *Tom.* — *Fine.*',
      said: '「ベンチで一人でスープを飲んでる？」のあと、名前を呼ばれて「わかったよ」と返す。',
      mean: 'Fine. ＝ しぶしぶの了解。名前だけで頼まれ、ベンを誘うことに折れた。',
      trap: 'fine を「その通り」と取りやすい。頼みのあとの Fine. は「仕方ない」。',
      use: 'Fine. You win. Let’s go.（わかった、君の勝ち。行こう）' },

    // R fix: V2 (blind 80 %): the title's irony made the bleak key guessable; "quietly enjoying" became a half-right
    //   "relaxes at first" near miss
    // why: learning to slow down ← the day's plan, and the title's promise; relaxes at first ← the spa is the relaxing
    //   part, with "the sound of harps… makes me nervous" missed
    { id: 'g2', skill: 'gist', level: 'B2', point: 'stressed', seg: [133.0, 203.6],
      stem: 'By the end, how is the day working out for Ben?',
      choices: ['He’s more stressed than he has ever been', 'He’s finally learning how to slow down',
                'He relaxes at first, then the needles undo it'], a: 0,
      cue: '針の場面で彼が言う、自分の状態。',
      line: 'This is *the most stressed out* I’ve ever been in my life.',
      said: 'スパでも落ち着けず、針を打たれて「人生でいちばんストレスを感じてる」と言う。',
      mean: 'くつろぐための日が、逆に緊張を高めている。最後は「助けて」とまで言う。',
      trap: 'タイトルやスパから、少しはくつろげたと思いやすい。本人の言葉で結果を聞く。',
      use: 'This is the most tired I’ve ever been.（今までで一番疲れてる）' },

    // why: glad to join ← "treat yourself day" sounds like praise of the day; can't tell where ← the question form "So…?"
    //   read as confusion about the plan
    { id: 'a3', skill: 'attitude', level: 'B2', point: 'just', seg: [143.9, 152.3],
      stem: 'How does Ben sum up Treat Yourself Day once he’s there?',
      choices: ['As nothing special: a spa, then shopping', 'As a big treat he’s glad to be part of',
                'As a puzzle: he can’t tell where they’re going'], a: 0,
      cue: '「day」の直前の小さな一語と、返ってくる言葉。',
      line: 'So, treat yourself day is *just* a day where you go to the spa and then the mall? — I knew you *wouldn’t get it*.',
      said: '「つまり、スパに行ってモールに行くだけの日？」と聞き、「わかんないと思った」と返される。',
      mean: 'just が「ただの〜」と価値を小さくする。だから相手は分かってないと嘆く。',
      trap: '疑問の形なので、行き先が分からないと思いやすい。just が評価を決める。',
      use: 'So it’s just a long walk?（つまり、ただの長い散歩？）' },

    // R fix: V2 (blind 70 %): "try new things" was weak; a wrong-target "spoiling friends" replaces it
    // why: spoil friends ← "pamper" known as 甘やかす but "yourself" lost, and he's been brought along as a guest;
    //   pay yourself ← "pamper" heard as "pay for"
    { id: 'ph3', skill: 'phrase', level: 'B2', point: 'pamper', seg: [155.7, 162.0],
      stem: 'When Ben asks for guidance, what is he told the day is for?',
      choices: ['Spoiling yourself with nice things', 'Spoiling the friends you bring along', 'Paying for every treat yourself'], a: 0,
      cue: '「The point of this is」のあとの動詞。',
      line: 'The point of this is to *pamper yourself*. Just relax, man.',
      said: '「この日の目的は、自分を甘やかすこと。とにかくくつろげ」と言われる。',
      mean: 'pamper ＝ 甘やかす。スパや買い物で自分をもてなす日ということ。',
      trap: 'pamper の頭が pay に近く、お金の話に聞こえやすい。yourself と合わせて聞く。',
      use: 'Pamper yourself this weekend.（週末は自分を甘やかして）' },

    // why: needles ← the acupuncture comes right after; work ← the usual script for a workaholic who can't relax
    { id: 'd2', skill: 'detail', level: 'B1', point: 'harps', seg: [159.95, 166.6],
      stem: 'What does Ben say makes him nervous at the spa?',
      choices: ['The sound of the harp music', 'The thought of all the needles', 'Being away from his work'], a: 0,
      cue: '「I can’t」のあと、「Something about」に続く部分。',
      line: 'I can’t. Something about *the sound of harps* that makes me nervous.',
      said: '「無理だ。ハープの音がどうも落ち着かない」と言う。',
      mean: '癒しのはずの音楽で緊張してしまう。それほどくつろぐのが苦手ということ。',
      trap: 'すぐあとに針の場面が来るので混ざりやすい。sound of の直後を聞く。',
      use: 'Something about this room makes me sleepy.（この部屋はなんだか眠くなる）' },

    // R fix: V2 (blind 65 %): "old jobs" was weak; a "things he hates, to tease him" reading replaces it
    // why: speaker's own likes ← "things… like" heard without "you"; things he hates ← the dull list read as a tease,
    //   with "things you like" missed
    { id: 'h3', skill: 'humor', level: 'C1', point: 'list', seg: [190.2, 201.25],
      stem: 'Why is the list of “things you like” funny, given what it’s for?',
      choices: ['It’s all dull number stuff, meant to calm him', 'It’s all things the speaker likes, not Ben',
                'It’s all things Ben hates, said to tease him'], a: 0,
      cue: '「take your mind off」の目的と、並ぶ語の種類。',
      line: 'things you like *to take your mind off the needles*… Accounting. Trigonometry. Stamps, probably.',
      said: '「針から気をそらそう」と、好きな物として会計、三角法、切手を並べる。',
      mean: '気を楽にするはずの話題が、どれも地味な数字の物。ベンをどう見ているかが分かる。',
      trap: 'like を話し手の好みと聞きやすい。things you like で、ベンの好きな物。',
      use: 'Let’s talk about something fun instead.（代わりに楽しい話をしよう）' },

    // C2: who the joke is on (cf. h3)
    // anchor: 200.3–202.6 s "Stamps, probably." → "More of a rare coins guy.": he fixes only the hobby, swapping one dull
    //   collection for another, and lets "Accounting. Trigonometry." stand
    // why: the guesser ← "probably" shows a guess, and it was off; stamp collectors ← "more of a… guy" heard as a put-down
    //   of stamps
    // R fix: V2 (blind 55 %, its one rewrite): "proves the guess right" was the only paradox; the key now says
    //   what the fix does, and the choices share one frame
    { id: 'nt2', skill: 'humor', level: 'C2', point: 'list', seg: [190.2, 203.6],
      stem: 'When Ben’s hobbies are guessed at, who is the joke on?',
      choices: ['Ben: his fix swaps in an equally dull hobby', 'The guesser: the stamp guess turns out wrong',
                'Stamp fans: Ben thinks coins are far better'], a: 0,
      cue: '直されたのはどの語で、どの語が直されないか。',
      line: 'Accounting. Trigonometry. *Stamps, probably.* — *More of a rare coins guy.*',
      said: '会計、三角法、切手と並べられ、「どちらかというと珍しいコイン派」と直す。',
      mean: '直すのは切手だけで、地味な趣味を別の地味な趣味に替える。見立ては当たっていて、笑われるのは本人。',
      trap: '外した側が笑われると思いやすい。何を直し、何を認めたかを聞く。',
      use: 'I’m more of a tea person.（どちらかというと紅茶派なんだ）' },

  ]
};
