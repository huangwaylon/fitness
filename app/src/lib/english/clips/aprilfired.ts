// REVIEW 2026-11-16: pass 13, fix 8, drop 0, new 0; ear checks 0
// REVIEW open: none. The f1 ear check is gone: f1 doesn't depend on who says "I told her…", and Andy's "Honey…"
//   reply settles it anyway.
// “April Ludgate's Getting Fired | Parks and Recreation” (the official Parks and Recreation channel, Season 4): April
// deletes every department file and hides under a table; Andy tries to help, and Donna turns out to have a backup.
// Segments from the captions, words from whisper (2026-11-16). Untested: 105.5–110 s (Donna's "almost made it with
// Councilman Hauser", sexual), 122–128 s ("I love you… Bring it in, boy": speakers unclear), and the lines where the
// two sources differ: 6.3 s "Where/Why are you hiding?", 90 s "Pawnee and Wreck / Parks and Rec history", 92 s
// "You'll most / And we'll certainly get fired", 115 s "Fix it / Fixed it". No who item (no names settle the voices
// beyond what the gist and detail items use). No predict item.
import type { Clip } from '../types.ts';

export const aprilFired: Clip = {
  id: 'aprilfired', video: 'CD9iAdtUFqI', title: 'April Ludgate’s Getting Fired', dur: 139, wpm: 174, band: 'mid',
  tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: N7: the "copied files onto a drive" distractor stated d1's key (the task); now a leak story, and "copy"
    //   stays out of the gist
    // why: sent files to the wrong people ← "department files" + a panicked confession sound like a leak; froze
    //   every computer ← "kept freezing" + "every computer" joined into one wrong story
    { id: 'g1', skill: 'gist', level: 'B1', point: 'gone', seg: [5.5, 21.75],
      stem: 'What trouble has April got herself into?',
      choices: ['She has wiped the department’s files everywhere', 'She has sent private files to the wrong people',
                'She has frozen every computer in the office'], a: 0,
      cue: '説明の最後、「every computer」の前後。',
      line: 'all the files are *gone on every computer*. They’re all gone.',
      said: 'いらいらしているうちに、どのパソコンからもファイルが全部消えた、と打ち明ける。',
      mean: 'これが場面全体の問題。机の下に隠れているのもこのため。',
      trap: 'files や freezing も聞こえるが、それは途中の経過。結論は最後の gone に来る。',
      use: 'I don’t know what happened, but it’s gone.（何が起きたか分からないけど、消えちゃった）' },

    // why: delete old files ← "files" and "every computer" are heard, in the wrong relation; fix freezing computers ←
    //   "it kept freezing" is the problem she hit, not the job
    { id: 'd1', skill: 'detail', level: 'B1', point: 'task', seg: [10.3, 18.8],
      stem: 'What was April supposed to be doing?',
      choices: ['Copying the files onto a thumb drive', 'Deleting old files on every computer',
                'Fixing the computers that kept freezing'], a: 0,
      cue: '「I was supposed to」のすぐあと。',
      line: 'I was supposed to *copy all the department files onto a thumb drive*',
      said: 'ファイルを全部USBメモリにコピーするはずだった。',
      mean: 'was supposed to ＝ 本当は〜するはずだった。',
      trap: 'files と every computer で「消す仕事」と取りやすい。supposed to の直後が本来の仕事。',
      use: 'I was supposed to call you yesterday.（昨日電話するはずだったんだけど）' },

    // why: mocking her ← praise for hiding sounds like it must be irony; wants her to come out ← "calm down" read as
    //   "stop hiding"; the next lines ("your man is here… take care of this for us") show he means it
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'hiding', seg: [18.9, 29.4],
      stem: 'When Andy calms April down, how does he mean his “first of all”?',
      choices: ['Sincerely: he thinks hiding was a smart move', 'Ironically: he is mocking her for hiding there',
                'Firmly: he is telling her to stop hiding now'], a: 0,
      cue: '「First of all」のあと、続く「Secondly」までの流れ。',
      line: 'First of all, you *did the right thing* by hiding under this table.',
      said: '落ち着いて、と言ってから「まず、机の下に隠れたのは正しかった」と言い、「次に、俺が来た」と続ける。',
      mean: '皮肉ではなく本気でほめている。本気なのがおかしいところ。',
      trap: '隠れたことをほめるので皮肉に聞こえやすい。続く言葉が励ましなら、本気と取る。',
      use: 'First of all, you did nothing wrong.（まず、あなたは何も悪くない）' },

    // R fix: V2 (blind 55 %): "He, her partner" gave the key away, and "someone from the office" was half true (Andy
    //   works at City Hall); now a plain key and a "boss" reading
    // why: a repairman ← "man" as in "the man for the job", someone sent to fix it; her boss ← "is here" after a
    //   disaster sounds like trouble arriving
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'man', seg: [24.6, 29.4],
      stem: 'What does Andy mean by his “Secondly…”?',
      choices: ['He himself is here to sort it out', 'A man who fixes computers is on his way',
                'Her boss is here and wants to talk'], a: 0,
      cue: '「Secondly」のあと、「I’m going to」につながる部分。',
      line: 'Secondly, *your man is here*. I’m going to take care of this for us.',
      said: '「それに、君の男が来た。俺がなんとかする」。',
      mean: 'your man ＝ 彼氏・夫が自分を指す言い方。「俺がついてる」という頼もしさの演出。',
      trap: 'man を「作業員・担当者」と取ると修理の人に聞こえる。直後の I’m going to で本人と分かる。',
      use: 'Don’t worry, your man is here.（心配しないで、俺がついてる）' },

    // R fix: V2 (blind 65 %): "fixing office computers" was easy to rule out; now "computers at home", which only
    //   "Xbox" refutes
    // why: fixing computers at home ← "I'm really good at fixing it when it freezes" heard as hobby experience; working
    //   in the building ← "for years" here, and Donna's "been here forever" just after
    { id: 'd2', skill: 'detail', level: 'B1', point: 'xbox', seg: [29.2, 36.2],
      stem: 'What does Andy say makes him good at this kind of problem?',
      choices: ['Many years of playing video games', 'Years of fixing computers at home', 'Years of working in this building'],
      a: 0,
      cue: '「for years」の前、何を何年もしてきたか。',
      line: 'I’ve been *playing Xbox* for years. I’m really good at fixing it when it freezes.',
      said: '何年もXboxで遊んできたので、固まったら直すのは得意だ、と言う。',
      mean: '自信の根拠がゲームだけ、というのがおかしい。会社のパソコンとは別物。',
      trap: 'fixing と freezes が聞こえるので修理の経験に聞こえる。根拠は文の前半にある。',
      use: 'I’ve been doing this for years.（これ、何年もやってるから）' },

    // why: worked on one computer ← "Try it now" heard as progress; waiting for Donna before trying ← Donna is named,
    //   but "Try it now" and "Please hurry" show something was already tried
    { id: 'i1', skill: 'infer', level: 'C1', point: 'called', seg: [41.8, 49.5],
      stem: 'When we next hear them, what has become of Andy’s plan?',
      choices: ['It has failed, and someone else is on it', 'It has worked on one computer, but not the rest',
                'They haven’t tried it yet; they’re waiting'], a: 0,
      cue: '「Try it now」から、Donna の名前が出るまで。',
      line: 'Please hurry. … Honey, *Donna’s been here forever*.',
      said: '「急いで」と頼み、「ドナはずっとここにいる、何とかしてくれる」と言う。',
      mean: '言葉にはしないが、Andy の方法は効かず、ドナに助けを求めたと分かる。',
      trap: 'Try it now は前向きに聞こえるが、そのあとの話は他人頼み。誰に頼っているかで判断。',
      use: 'Let’s ask someone who’s been here longer.（もっと長くいる人に聞こう）' },

    // why: someone could get hurt ← the literal reading of "life and death"; a personal matter ← "matter" taken as
    //   "a private matter"
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'urgent', seg: [44.9, 48.4],
      stem: 'What was Donna told about the problem?',
      choices: ['That it could not wait a minute longer', 'That someone’s life was in danger', 'That it was a private matter'], a: 0,
      cue: '「Please hurry」のすぐあと、「I told her」に続く言い方。',
      line: 'I told her it’s a *matter of life and death*.',
      said: 'ドナには「生きるか死ぬかの問題」と伝えた。',
      mean: 'a matter of life and death ＝ 一刻を争う大問題。ここは大げさに急ぎを伝える言い方。',
      trap: '文字どおりに取ると命の危険に聞こえる。誰もけがをしていないので、急ぎの強調。',
      use: 'It’s not a matter of life and death.（そんなに急ぐことじゃないよ）' },

    // why: gotta ← gonna and gotta differ by one consonant, both "ガナ/ガタ"-short; doesn't ← April's next line is
    //   "What if she doesn't?"; she'd ← "She's" + a lost "gonna" sounds like a short "She'd"
    { id: 's1', skill: 'sound', level: 'B2', point: 'gonna', seg: [46.0, 49.5],
      stem: 'Fill the gap: “Honey, Donna’s been here forever. ___ know what to do.”',
      choices: ['She’s gonna', 'She’s gotta', 'She’d', 'She doesn’t'], a: 0,
      cue: '「forever」のあと、文の頭の短いかたまり。',
      line: '*She’s gonna* know what to do.',
      said: '「ドナなら分かるはず」。going to が gonna に縮んでいる。',
      mean: 'gonna ＝ going to。ここは「きっと〜する」という見込み。',
      trap: 'gotta（〜しなきゃ）と似ている。gonna は「ナ」、gotta は「ラ」に近い。',
      use: 'You’re gonna love this place.（ここ、絶対気に入るよ）' },

    // R fix: V2 (blind 60 %): "fired before" was weak; now a feelings reading, refuted by "lecture on responsibility"
    // why: fired then lectured ← both are named, so it sounds like a two-step punishment; Leslie's feelings ← "even
    //   worse, Leslie…" heard as fear of letting her down
    { id: 'h1', skill: 'humor', level: 'C1', point: 'lecture', seg: [49.1, 56.7],
      stem: 'What makes April’s list of what could happen funny?',
      choices: ['A talk from Leslie scares her more than losing her job', 'Leslie would fire her and then give her a talk too',
                'She cares more about Leslie’s feelings than her job'], a: 0,
      cue: '「fired」のあと、「or」でつながる二つ目。',
      line: 'I could get fired, or *even worse*, Leslie might give me a *lecture* on responsibility *again*.',
      said: 'クビかも、もっと悪いと、またレスリーに責任の説教をされるかも、と言う。',
      mean: 'or even worse で、説教をクビより上に置いている。この順番の逆転が笑い。',
      trap: 'again は説教にかかる。even worse のあとに何が来るかを聞く。',
      use: 'Or even worse, it might rain.（もっと悪いと、雨かも）' },

    // R fix: S2 (§9.2): the stem quoted the preface under test; it now names the moment
    // why: a hard truth ← the Japanese frame 「言っとくけど」 before a warning; a trade ← "deal" = 取引, a favor for a favor
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'deal', reveals: ['quit'], seg: [56.3, 62.35],
      stem: 'When April says “I can’t do it”, what is Andy’s next line doing?',
      choices: ['Setting up a plan he’s about to offer', 'Setting up a hard truth she must accept',
                'Offering her a trade: his help for a favor'], a: 0,
      cue: '前置きのあと、どんな話が続くか。',
      line: 'I’ll tell you what, honey, *here’s the deal*.',
      said: '「いいかい、こうしよう」と前置きして、一緒に出ていく案を話す。',
      mean: 'I’ll tell you what も here’s the deal も、提案の前置き。',
      trap: 'deal を「取引」と取ると交換条件に聞こえる。ここは「話はこうだ」。',
      use: 'Tell you what: I’ll pay this time.（じゃあこうしよう、今回は私が払う）' },

    // anchor: 59.16–60.4 s both sources: "You get fired, I'll quit" (no "if"; whisper drops the "and" after it)
    // why: the grammar instinct adds "if" ("If you get fired, I'll quit"); a stray "you'll" for "you" is the other habit
    { id: 'nt2', skill: 'dict', level: 'C2', point: 'quit', seg: [58.66, 61.5],
      stem: 'Type his offer: “___ … we’ll leave together.” (5 words)', answer: 'you get fired i\'ll quit',
      cue: '「here’s the deal」のあと、短い二つのかたまり。',
      line: '*You get fired, I’ll quit*, and we’ll leave together.',
      said: '「君がクビになる、俺は辞める、一緒に出ていく」と、if を使わずに短く並べている。',
      mean: '話し言葉では if を言わずに、条件と結果を並べるだけのことが多い。「〜なら、〜する」の意味になる。',
      trap: '文法の感覚で if を足して書きたくなる。聞こえた語だけを書き、if がない形も条件と受け取る。',
      use: 'You cook, I’ll do the dishes.（君が作るなら、皿は僕が洗う）' },

    // why: joking to cheer her up ← the list gets wild, so it seems he can't mean any of it; testing her ← "I'm
    //   serious" read as a challenge; "What? — if we have to" keeps him sincere
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'serious', seg: [58.66, 70.1],
      stem: 'As Andy’s plan gets wilder, how serious is he?',
      choices: ['He means it: he would really go with her', 'He’s joking, just to get her to laugh again',
                'He’s testing whether she would really go'], a: 0,
      cue: '「I’m serious」と、April の「What?」への返事。',
      line: '*I’m serious.* Move to a new city… swap faces… *if we have to*.',
      said: '「本気だよ」と言い、新しい町、名前を変える、顔を取りかえる、と続け、驚かれても「必要ならね」と返す。',
      mean: 'やり方はむちゃだが、一緒にいるという気持ちは本気。',
      trap: '話が大げさになるので冗談に聞こえやすい。聞き返されても引かないなら本気。',
      use: 'I’m serious. I’ll come with you.（本気だよ。一緒に行く）' },

    // R fix: S1 + K6: "right after April's 'What?'" was off (Andy first says "If we have to"), and the key was the
    //   only choice without a clip word; the stem now names the moment and the key has "jobs"
    // why: back to her desk ← "go back" + "jobs" read literally as returning to work; old jobs ← "back" + "jobs"
    //   heard as their former jobs
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'goback', seg: [69.7, 74.4],
      stem: 'After “that’s good on places to live”, what does Andy do?',
      choices: ['Takes them back to the topic of jobs', 'Tells April to go back to work at her desk',
                'Says they should both go back to their old jobs'], a: 0,
      cue: '「places to live」のあと、次の話題への移り方。',
      line: 'Okay, that’s good on places to live. *Let’s go back to* dream jobs.',
      said: '「住む場所はいい。夢の仕事に戻ろう」。',
      mean: 'Let’s go back to ＋話題 ＝ さっきの話に戻ろう。新しい人生を考える遊びの続き。',
      trap: 'go back と jobs を文字どおりつなぐと「仕事に戻る」に聞こえる。to のあとは話題。',
      use: 'Let’s go back to what you said earlier.（さっきの話に戻ろう）' },

    // why: jobs for both ← "If we had to start a new life" sounds shared; April in the police ← she hears a list of
    //   police jobs right before "for you"
    { id: 'i2', skill: 'infer', level: 'B2', point: 'jobs', seg: [71.5, 80.9],
      stem: 'What does Andy’s list of dream jobs show so far?',
      choices: ['Every job on it is one he wants for himself', 'Every job on it is one they could share',
                'Every job on it is one he picks for April'], a: 0,
      cue: '仕事のリストのあと、「So」で始まる一言。',
      line: 'I have detective, FBI agent, policeman, CIA agent. So, *we need more for you*.',
      said: '探偵、FBI、警官、CIAと並べ、「君の分がもっと要る」と言う。',
      mean: 'for you と言うので、今までのリストは全部 Andy 自身の夢だったと分かる。',
      trap: 'we から二人の仕事に聞こえる。for you でリストの持ち主が分かる。',
      use: 'We need more ideas for you.（君のアイデアがもっと要るね）' },

    // R fix: S4: the segment ended at 86.6 s, on the onset of "made"; now 86.95 s, before "deleting"
    { id: 'x1', skill: 'dict', level: 'B2', point: 'mind', seg: [82.6, 86.95],
      stem: 'Type what he says: “I’m trying to help you ___ of this…” (4 words)', answer: 'take your mind off',
      cue: '「help you」のすぐあと、4語のかたまり。',
      line: 'I’m trying to help you *take your mind off* of this horrible mistake',
      said: '「ひどい失敗から気をそらしてあげたい」と言っている。',
      mean: 'take one’s mind off ＝ 気をまぎらわす。mind‿off が「マインドフ」に近い。',
      trap: 'your は弱く「ヤ」に近く、off と of がつながりやすい。',
      use: 'A movie might take your mind off it.（映画でも見たら気がまぎれるかも）' },

    // anchor: 83.1–94.2 s he names the "horrible mistake", calls it the worst thing in the town's history and says
    //   she'll be fired, each time followed by "I'm trying to help"; April groans at 91 and 94.6 s
    // why: April ← it sounds like he is rubbing her mistake in (sincerity flip); the town ← "worst thing… in …
    //   history" heard as a dig at how little ever happens there (scope shift)
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'help', reveals: ['mind'], seg: [82.6, 94.4],
      stem: 'In Andy’s speech about taking her mind off it, who is the joke on?',
      choices: ['Andy: his comfort keeps naming the disaster', 'April: he is rubbing her big mistake in',
                'The town: so little ever goes wrong there'], a: 0,
      cue: '「I’m trying to help」の前に毎回何を言っているか。',
      line: '…this *horrible mistake* you made… and *I’m trying to help*.',
      said: '気をそらすと言いながら、ひどい失敗、町の歴史で最悪、たぶんクビ、と並べて「助けたいんだ」と付ける。',
      mean: '本人は本気で励ましているのに、言うほど彼女を追いつめる。笑われているのは不器用な Andy。',
      trap: '責める言葉が並ぶので意地悪に聞こえる。「助けたい」をくり返す人が、ずれている側。',
      use: 'Sorry, that didn’t help, did it?（ごめん、励ましになってないね）' },

    // why: glad ← "fine" = 元気・良い in katakana English; refusing ← she has groaned twice, so a no seems next
    { id: 'a3', skill: 'attitude', level: 'B2', point: 'fine', seg: [94.4, 98.4],
      stem: 'How does April answer Andy’s “Dream big, kid”?',
      choices: ['She gives in, though she doesn’t want to', 'She agrees, glad that she feels better now',
                'She refuses and tells him to stop it'], a: 0,
      cue: '「Dream big」のすぐあとの、短い一語。',
      line: 'Dream big, kid. — *Fine.*',
      said: 'せかされて、April は一言だけ返し、答え始める。',
      mean: '一語の Fine. は「しかたない、やるよ」。乗り気ではないが、付き合う。',
      trap: 'fine を「元気・良い」と取ると明るい返事に聞こえる。せかされたあとの Fine. はしぶしぶ。',
      use: 'Fine, I’ll do it.（分かったよ、やるよ）' },

    // R fix: K1: "tell people about their future" included the key (when they'll die is their future); now "how",
    //   the near miss for "when"
    // why: talk to the dead ← "medium" = 霊媒, who usually speaks with the dead; how they'll die ← "tell them when…"
    //   with the wh-word missed
    { id: 'd3', skill: 'detail', level: 'B1', point: 'dream', seg: [98.2, 104.4],
      stem: 'What would April do in her dream job?',
      choices: ['Clean teeth and tell people when they’ll die', 'Clean teeth and talk to people who have died',
                'Clean teeth and tell people how they’ll die'], a: 0,
      cue: '「so I can」のあと、二つの動詞。',
      line: 'so I can *clean people’s teeth and tell them when they’re going to die*.',
      said: '霊能者でもある歯科衛生士になり、歯を掃除しながら死ぬ日を教えたい。',
      mean: 'April らしい暗い夢。',
      trap: 'medium から「死者と話す」を思いつきやすい。tell them のあとの疑問詞 when まで聞く。',
      use: 'So I can sleep in on Sundays.（そうすれば日曜に寝坊できる）' },

    // why: Andy's fix ← he promised to fix it and "Try it now" is heard earlier; the drive ← "flash drive" is in
    //   April's account just before
    { id: 'g2', skill: 'gist', level: 'B2', point: 'fix', seg: [105.0, 123.4],
      stem: 'How does the crisis finally get solved?',
      choices: ['Donna had quietly set up her own backup', 'Andy got the frozen computer working again',
                'April copied the files back from the drive'], a: 0,
      cue: '最後の場面、ファイルが戻った理由の説明。',
      line: 'I installed my own *secret backup*.',
      said: 'ドナが、何年も前から自分でこっそりバックアップを取っていたので、ファイルは元に戻る。',
      mean: 'クビになりそうな題名だが、ドナの備えで助かる結末。',
      trap: 'flash drive や Andy の自信の話が先に出るが、直したのはドナ。最後の説明で決まる。',
      use: 'Good thing I made a backup.（バックアップ取っといてよかった）' },

    // why: two ← "ten" with a weak vowel is short like "two"; twenty ← "years ago" plus her "been here forever"
    { id: 'n1', skill: 'number', level: 'B1', point: 'years', reveals: ['fix'], seg: [116.85, 122.45], keep: true,
      stem: 'How long ago did Donna set it up?',
      choices: ['Two years ago', 'Ten years ago', 'Twenty years ago'], a: 1,
      cue: '「years ago」の直前の数。',
      line: '*10 years ago*, I installed my own secret backup.',
      said: '「10年前に、自分だけのバックアップを入れた」と言っている。',
      mean: 'ずっと前から、こういう事故に備えていた、ということ。',
      trap: 'ten は短い一音節で two に聞こえることがある。twenty なら「トゥエ」と二音節になる。',
      use: 'I moved here ten years ago.（10年前にここに越してきました）' },

    // why: once deleted everything ← "accidentally deletes" heard, but "all the time" (often, small) missed; April
    //   deleted before ← "deletes things" heard as about her
    { id: 'd4', skill: 'detail', level: 'B1', point: 'jerry', reveals: ['fix'], seg: [116.85, 122.45],
      stem: 'Why did Donna set up her own backup in the first place?',
      choices: ['Jerry keeps deleting things by accident', 'Jerry once deleted everything by accident',
                'April has deleted files like this before'], a: 0,
      cue: '「10 years ago」の前の一文。',
      line: '*Jerry accidentally deletes things* all the time.',
      said: '「ジェリーがしょっちゅう間違って消すから」と、バックアップの理由を話す。',
      mean: '別の人のよくある失敗に備えていたおかげで、April も助かった。',
      trap: '一度の大事故ではなく all the time（しょっちゅう）。頻度の語まで聞く。',
      use: 'He loses his keys all the time.（彼はしょっちゅう鍵をなくす）' },
  ]
};
