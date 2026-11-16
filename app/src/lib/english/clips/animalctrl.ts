// REVIEW 2026-11-16: pass 6, fix 12, drop 2, new 1; ear checks 1
// “Animal Control Suck | Parks and Recreation” (the official Parks and Recreation channel, Season 5): a stoner guide
// shows two visitors round the town's Animal Control office; one visitor rips into the department, the other asks to
// wait and see, a coyote trap ends the visit, and the whole department is fired.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 75.6 s (music after). Left out on purpose:
// "Tougher than it looks" (22 s; whisper "a look", captions "it look"), "Ready to blow?" (50 s; captions "Ra."), the
// "Bark Obama" pun (world knowledge), "Thanks." (40.6 s; speaker and tone unclear), the
// "wouldn't have" / "would we" before "been meaning" (57 s; trimmed out of p2's line) and the final "No." (74.8 s,
// whisper only). No speaker is named in the audio, so stems say "the guide", "the visitor", "the staff".
// EAR CHECK: 59.2 s nt1 — "nobody *get* on the phone": both whisper and captions have "get"; confirm it isn't "got" or
//   "gets" (the C2 dict turns on it)
import type { Clip } from '../types.ts';

export const animalControl: Clip = {
  id: 'animalctrl', video: 'P5RyGecbBY0', title: 'Animal Control Suck', dur: 96, wpm: 159, band: 'slow',
  tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    { id: 'x1', skill: 'dict', level: 'B1', point: 'letme', seg: [0, 4.5],
      stem: 'Type what he says: “Welcome to Animal Control. ___ around.” (4 words)', answer: 'let me show you',
      cue: '「Animal Control」のあと、短くつながる4語。',
      line: 'Welcome to Animal Control. *Let me show you* around.',
      said: '「ようこそ。中を案内するよ」と客を迎える。',
      mean: 'Let me show you around ＝ 中を案内しますね。施設や家を見せるときの決まり文句。',
      trap: 'let me は「レミ」、show you は「ショウユ」とつながり、4語が2語に聞こえやすい。',
      use: 'Come on in, let me show you around.（どうぞ、中を案内するね）' },

    // R fix: V2 (blind 50 %): "joking" was a filler; now a second reading of "cat or possum" (a cross of the two)
    // why: two animals ← the weak "or" lost, "cat… possum" heard as a list of two caught animals; a cross ← "cat or
    //      possum" heard as one odd animal that is both
    { id: 'i1', skill: 'infer', level: 'B2', point: 'possum', seg: [0, 12.6],
      stem: 'When the guide points to an animal, what does his description show?',
      choices: ['He doesn’t know which animal it is', 'He’s showing two animals they caught',
                'He thinks it’s a cross of cat and possum'], a: 0,
      cue: '動物の名前が二つ。その間の短い一語に注目。',
      line: 'Those are some chairs. That’s a *cat or possum*.',
      said: '「これはイス。これは猫かポッサム」と、どうでもいい物を紹介する。',
      mean: 'A or B ＝ どちらか分からない。動物の課なのに、目の前の動物が何か言えない。',
      trap: 'or は弱く「ア」程度で、2匹の紹介に聞こえやすい。That’s a の a は1匹。',
      use: 'Is that a fox or a dog?（あれ、キツネ？それとも犬？）' },

    // R drop: a2 (K1 + tone): "bored" is defensible from the flat "Those are some chairs", and "pleased" rests on the
    //   napkin aside, not the tour; the key can't be settled from the words. Attitude stays at 2 (a1, c1).

    // why: report ← the rant heard as building a case for someone higher up; walk out ← "pothead losers" plus the
    //      Jamaica plan heard as the staff quitting in protest
    { id: 'g1', skill: 'gist', level: 'B1', point: 'outcome', seg: [0, 76],
      stem: 'How does the visit to the department end?',
      choices: ['The visitors leave to report them to the city', 'One visitor fires everyone in the department',
                'The staff walk out after being called losers'], a: 1,
      cue: '最後の方、わなで痛がる声のあと。',
      line: 'You’re fired. You’re fired. *The whole department is fired.*',
      said: 'わなで痛い思いをした人が「課ごと全員クビ」と言い渡し、職員は行き先の話を始める。',
      mean: '視察に来た側が人事の力を持っていた。結末は課ごとの解雇。',
      trap: '悪口が続くので職員が怒って辞めるように見えやすい。fired は辞めさせられること。',
      use: 'Sorry, but we have to let you go.（悪いが、辞めてもらう）' },

    // R fix: V2 (blind 50 %): the key was the only made-up name and "phone number" the odd one out; now three names.
    //   reveals 'tour' removed (a2 dropped)
    // why: caught dog ← "a name for a dog" heard as one dog's name (they catch animals); lost dog ← "a dog" heard as a
    //      particular dog, the animal-control script of lost pets
    { id: 'd1', skill: 'detail', level: 'B1', point: 'napkin', seg: [4.5, 12.6],
      stem: 'What did the guide write on the napkin?',
      choices: ['The name of a dog they had caught', 'The name of a dog someone had lost', 'A name he came up with for a dog'],
      a: 2,
      cue: '「wrote down」のあと、何のための名前か。',
      line: 'this is a napkin where I wrote down *a cool name for a dog*',
      said: 'ナプキンを見せ「犬にいい名前を思いついて書いた」と言う。',
      mean: 'a name for a dog ＝ 犬につけたい名前。特定の犬ではない。',
      trap: 'for a dog の a は「犬なら何でも」。捕まえた犬の名前と取らないよう冠詞を聞く。',
      use: 'I wrote it down so I wouldn’t forget.（忘れないようにメモした）' },

    // why: caring ← "found this bird outside" fits the animal-control script of looking after found animals; pets ← a
    //      found bird kept at the office
    { id: 'i2', skill: 'infer', level: 'B2', point: 'bird', seg: [12.6, 23.4],
      stem: 'What does the bird story show about how the staff spend their time?',
      choices: ['Caring for hurt animals they find outside', 'Making odd gadgets out of the animals they find',
                'Keeping the animals they find as office pets'], a: 1,
      cue: '鳥を見つけたあと、何に「しようとした」か。',
      line: 'we found this bird outside. We tried to *turn it into a work whistle*…',
      said: '外で見つけた鳥を、アニメのように仕事の合図の笛にしようとした、と話す。',
      mean: '鳥を笛にするというばかげた工作。本来の仕事をせず遊んでいる。',
      trap: 'found this bird だけで保護の話と思いやすい。何に「しようとしたか」まで聞く。',
      use: 'We tried to turn it into a game.（ゲームにしてみようとしたんだ）' },

    // R fix: V2 (blind 55 %): "lets them go" was weak; now a keyword trap from the next line ("selling"). V5: B1 → B2
    //   ("a disaster at" is an idiom, and B1 was at 35.3 %)
    // why: too small ← "run by two" (36 s) heard as understaffing; sells them ← "great at… selling" heard as what they
    //      do with the animals
    { id: 'd3', skill: 'detail', level: 'B2', point: 'cause', seg: [21.9, 34.45],
      stem: 'What is the town’s pest problem blamed on?',
      choices: ['A department that’s bad at catching animals', 'A department too small to catch them all',
                'A department that sells the animals it catches'], a: 0,
      cue: '「because」のあと、課の何がダメなのか。',
      line: 'it’s because the Animal Control Department has been *a disaster at catching animals*.',
      said: '害獣が多いのは、この課が動物を捕まえるのがひどく下手だからだと言う。',
      mean: 'a disaster at ～ ＝ ～がまるでダメ。because のあとが原因。',
      trap: 'selling から動物を売る話に取りやすい。原因は because のあとで決める。',
      use: 'I’m a disaster at cooking.（料理はまるでダメなんだ）' },

    // R fix: V2 (blind 70 %): with the title ("Suck"), "too many animals" was out; now a sympathetic reading (the "wait
    //   and see" visitor's view) and the two-minutes mishearing
    // why: no money ← the second visitor's defence heard as the verdict; new staff ← "we've only been here for two
    //      minutes" heard as the staff being new
    { id: 'g2', skill: 'gist', level: 'B2', point: 'problem', seg: [21.9, 62],
      stem: 'From the complaints and the visit, what is wrong with the department?',
      choices: ['Its staff are doing their best with no money', 'Its staff are new and still learning the job',
                'Its staff don’t do the job they’re there for'], a: 2,
      cue: '責める言葉と、電話の話のあとの一言。',
      line: 'It’s *completely and utterly mismanaged*.',
      said: '町の害獣問題でこの課を責め、職員をダメな二人と呼び、運営がひどいと言う。',
      mean: '問題は数や道具でなく、職員が仕事をしていないこと。証拠が次々出る。',
      trap: 'only been here や method から、新人や同情の話に取りやすい。証拠で決める。',
      use: 'This place is a complete mess.（ここは本当にめちゃくちゃだ）' },

    // R fix: V2 (blind 55 %) + §9.6: the key was the only two-part choice; now all three are "As X: reason"
    // why: praise ← the Japanese frame of balancing a complaint with some praise ("great at… selling"); a joke ← the
    //      charge heard as an exaggeration not meant seriously
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'greatat', seg: [27.62, 40.5],
      stem: 'After “a disaster at catching animals”, how is “They’re great at…” meant?',
      choices: ['As praise: at least they are good at selling', 'As a joke: the drug part is not meant seriously',
                'As a dig: drugs are the only thing they do well'], a: 2,
      cue: '「great」のあとの中身と、次の文の呼び方。',
      line: 'They’re *great at* ingesting and selling marijuana… run by two *pothead losers*.',
      said: '「得意なのはマリファナを吸うことと売ること」と言い、「ダメな二人」と呼ぶ。',
      mean: 'ほめる形の皮肉。できるのは悪いことだけ、と本気で責めている。',
      trap: '「良い点も言う」流れで公平なほめ言葉と取りやすい。great at の中身で決める。',
      use: 'He’s great at one thing: taking naps.（彼が得意なのは一つ、昼寝だ）' },

    // R drop: c2 (V1 + V2 blind 60 %): the stem prints "does", and its own anchor says grammar alone puts the stress
    //   there, so the key comes from the text, not the audio. Replaced by the C2 dict nt1 (58 s); its ear check goes too.

    // R fix: V2 (blind 55 %): the key was the only "granting"; now two choices grant the point and differ after it
    // why: pushing back ← "poorly run" missed and "a method to their madness" heard as praise; agreeing and adding ←
    //      "It does seem… very poorly run" heard as full agreement (the Japanese 「確かに」 frame), the "but" lost
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'butwait', reveals: ['minutes'], seg: [37.7, 47.95],
      stem: 'How does the next speaker answer the rant about the department?',
      choices: ['Disputing the point, then praising the staff', 'Granting the point, then adding more to it',
                'Granting the point, then asking to wait a bit'], a: 2,
      cue: '前半で認める部分と、but のあとの理由。',
      line: 'It does seem to be very poorly run, *but we’ve only been here for two minutes*.',
      said: '「確かにひどい運営に見える。でも来てまだ2分だ」と言う。',
      mean: 'いったん認めて but で保留する。決めつけずに様子を見よう、となだめている。',
      trap: 'It does seem だけで全面的な同意と取りやすい。英語は but のあとが本題。',
      use: 'Fair point, but let’s give it a week.（もっともだけど、一週間様子を見よう）' },

    // why: forty ← "for two" runs together like "forty"; twenty ← "two" blurred into the following "minutes"
    { id: 'n1', skill: 'number', level: 'B1', point: 'minutes', seg: [40.5, 46.45], keep: true,
      stem: 'How long have they been at the department so far?',
      choices: ['Two minutes', 'Twenty minutes', 'Forty minutes'], a: 0,
      cue: '「only been here」のあと。',
      line: '…only been here *for two minutes*.',
      said: '「ここに来てまだ2分」と言う。',
      mean: 'only ＋ 短い時間で「判断にはまだ早い」と伝えている。',
      trap: 'for two がつながると forty に近い。forty なら t が弾む。two の長い「トゥー」を聞く。',
      use: 'We’ve only been here for ten minutes.（まだ来て10分なんだ）' },

    // R fix: V2 (blind 55 %): "make sense after all" was the only defensive choice; now parallel and closer in kind
    // why: drive people crazy ← "madness" read literally (クレイジー); stricter method ← "method" read literally as a
    //      procedure they lack
    { id: 'p1', skill: 'phrase', level: 'C1', point: 'method', seg: [40.5, 47.95],
      stem: 'In the reply, what does the first saying suggest about the staff?',
      choices: ['Their odd ways might drive the town crazy', 'Their odd ways might have a plan behind them',
                'Their odd ways might need a proper method'], a: 1,
      cue: '「There may be」のあと、二つの語の組み合わせ。',
      line: 'There may be *a method to their madness*.',
      said: '「むちゃくちゃに見えて、実は考えがあるのかも」と言う。',
      mean: 'method to one’s madness ＝ 変なやり方にも筋がある。かばう言い方。',
      trap: 'madness だけなら「迷惑」、method だけなら「手順」と読みやすい。二語で覚える。',
      use: 'Trust me, there’s a method to my madness.（信じて、ちゃんと考えがあるから）' },

    // R fix: V2 (blind 65 %): "how many staff" was weak; now a darker literal reading. The stem named "the guide", but
    //   no source says who says "Four."; it now quotes the word instead
    // why: four cats ← "skin a cat" + "four" heard as a confession; their methods ← "method" just before, "four" heard
    //      as how many ways they catch animals
    { id: 'h1', skill: 'humor', level: 'C1', point: 'four', seg: [44.7, 50.9],
      stem: 'Why does the one-word reply “Four.” get a laugh?',
      choices: ['It admits four cats have been skinned there', 'It takes a saying as a real count and fixes it',
                'It says they know four ways to catch animals'], a: 1,
      cue: '「more than one」のあと、何を直したか。',
      line: 'There’s more than one way to skin a cat. — *Four.* — There’s four ways to skin a cat.',
      said: 'ことわざ「やり方は一つじゃない」に職員が「四つ」と口をはさみ、相手も言い直す。',
      mean: 'ことわざの数は本当の数ではない。それを事実のように直すずれがおかしい。',
      trap: 'Four だけだと猫の数や捕まえ方の話に結びつけやすい。直後の言い直しが答え。',
      use: 'There’s more than one way to do this.（やり方は一つじゃないよ）' },

    // why: bird ← the bird from earlier in the tour; cat or possum ← the animal pointed out at the start
    { id: 'd4', skill: 'detail', level: 'B1', point: 'trap', seg: [50, 54.85],
      stem: 'What is hurting the visitor?',
      choices: ['A bite from the bird they found', 'A trap they set for coyotes', 'A scratch from the cat or possum'],
      a: 1,
      cue: '「what is this?」への答え、最初の2語。',
      line: 'Ow, ow, ow, what is this? — *Coyote trap*, dude.',
      said: '「痛い、何これ？」に、職員が「コヨーテ用のわなだよ」と軽く答える。',
      mean: '室内にわなを置いたまま。dude も軽く、危なさを気にしていない。',
      trap: 'Coyote は「カヨーティ」に近く聞き慣れない。後ろの trap を先につかむ。',
      use: 'Watch out, there’s a step here.（気をつけて、段差があるよ）' },

    // R fix: V2 (blind 50 %): the key was the only "excuse" shape; now three accounts of the call. N7: the line showed
    //   nt1's dict answer and is trimmed; the key still paraphrases it, so reveals 'nobody'
    // why: called, nobody answered ← "phone" + "nobody" heard as a failed call; chose not to ← "would… meaning" (whisper
    //      "wouldn't have") heard as "didn't mean to"
    { id: 'p2', skill: 'phrase', level: 'B2', point: 'meaning', reveals: ['nobody'], seg: [54.85, 62],
      stem: 'What does the guide say about calling someone about the pests?',
      choices: ['They called, but nobody answered the phone', 'They thought it over, and chose not to call',
                'They meant to, but nobody ever made the call'], a: 2,
      cue: '「I mean,」のあと、call の前の部分。',
      line: '…*been meaning to call* somebody about it, but…',
      said: '「誰かに電話しようと思ってたけど、誰も電話をかけなくて」と言う。',
      mean: 'been meaning to ～ ＝ ずっと～するつもり（まだしていない）。',
      trap: 'meaning を「意味」と取ると話が見えない。been meaning to は決まった形。',
      use: 'I’ve been meaning to call you.（電話しようと思ってたんだ）' },

    // why: you'd been ← "would be" squeezed to "'d b…"; you were ← "would" lost, its w kept; you've been ← "be
    //      calling" heard as "been calling"
    { id: 's1', skill: 'sound', level: 'B2', point: 'wouldbe', reveals: ['calling'], seg: [54.85, 62],
      stem: 'Fill the gap: “You’re the people ___ calling.”',
      choices: ['you were', 'you’ve been', 'you’d been', 'you would be'], a: 3,
      cue: 'people のあと、calling の前の弱い部分。',
      line: 'You’re the people *you would be* calling.',
      said: '「電話する相手はあなたたちでしょ」と返す。would be は弱い。',
      mean: '仮定の would で「もしかけるなら」。まだ電話していないことも分かる。',
      trap: '縮んだ would be は you’d been に聞こえやすい。been なら n が残る。',
      use: 'You’re the person I’d call first.（真っ先に電話するのはあなただよ）' },

    // R fix: V2 (blind 70 %): the "make the call" request was weak; now three targets of the call, two of them near
    //   misses on who "you" is. N7: the line showed nt1's answer and is trimmed
    // why: the visitors ← "You're the people" heard as aimed at the visitors themselves; his bosses ← the visitors fire
    //      him later, so "the people" heard as the ones he works for
    { id: 'h2', skill: 'humor', level: 'C1', point: 'calling', reveals: ['wouldbe'], seg: [54.85, 62],
      stem: 'Why does the visitor’s reply about the phone get a laugh?',
      choices: ['He would be calling the visitors themselves', 'He would be calling his own department',
                'He would be calling the people he works for'], a: 1,
      cue: '「You’re the people」の You が誰を指すか。',
      line: '…meaning to call somebody… — *You’re the people you would be calling.*',
      said: '「誰かに電話するつもりだった」職員に「電話する相手はあなたたち」と返す。',
      mean: '害獣の電話を受けるのはこの課自身。自分に電話する気だったと気づかせる皮肉。',
      trap: 'You を客や上司のことと取りやすい。答えている相手、つまり職員を指すと押さえる。',
      use: 'Wait, isn’t that your job?（待って、それあなたの仕事じゃない？）' },

    // R fix: V2 (blind 50 %): the key was the only one naming "the criticism"; now all three do, in parallel form
    // why: embarrassed ← the Japanese frame: a reply after being caught out read as 照れ隠し / saving face; mocking ←
    //      "so trippy" heard as sarcasm that brushes the point aside
    // anchor: 62.4–63.36 s "That is so trippy": "so" + "trippy" (mind-bending) is wonder at the idea itself; no
    //         "sorry", no excuse, no "yeah, right", no pushback, and no promise to do anything
    { id: 'c1', skill: 'attitude', level: 'C2', point: 'calling', reveals: ['wouldbe'], seg: [54.85, 63.75],
      stem: 'How does the guide take the remark about who he’d be calling?',
      choices: ['Embarrassed, and laughing off the criticism', 'Dismissive, and waving away the criticism',
                'Amazed, and not seeing the criticism'], a: 2,
      cue: '返事の一言に、謝りや言い訳があるか。',
      line: 'You’re the people you would be calling. — *That is so trippy.*',
      said: '「相手はあなたたち」と言われ、職員は「それ、すごく不思議」と感心して返す。',
      mean: 'trippy ＝ 頭がくらくらするほど不思議。責めには反応せず、話の面白さにだけ乗っている。',
      trap: '指摘のあとの一言は照れ隠しと取りやすいが、謝りも言い訳もない。返事が中身と責めのどちらに向くかを聞く。',
      use: 'Huh, that’s so weird, actually.（へえ、それって不思議だね）' },

    // R new: nt1 (C2 dict) replaces c2, keeping the bank at 2 C2 items. Fresh read: the stem gives no form; grammar
    //   pulls toward "got", which is the point
    // anchor: 58.8–59.7 s whisper and captions both "nobody get on the phone"; ≈ 8 words in 1.9 s
    { id: 'nt1', skill: 'dict', level: 'C2', point: 'nobody', seg: [58.2, 62.3],
      stem: 'Type how the guide ends his excuse: “…but, you know, ___.” (5 words)', answer: 'nobody get on the phone',
      cue: '「you know」のあと。文法より聞こえた音を。',
      line: 'but, you know, *nobody get on the phone*.',
      said: '「でもさ、誰も電話しなくて」と言う。nobody get on は「ノバディゲロン」とひと続き。',
      mean: '文法なら got か gets だが、ここは get。くだけた早口では時制の形や s が落ちる。',
      trap: '習った形に合わせて got と書きたくなる。書き取りは、聞こえた音をそのまま書く。',
      use: 'Can someone get on the phone with them?（誰かあちらに電話してくれる？）' },

    // R fix: V2 (blind 60 %): "argue over two places" was weak; now a near miss (a similar place) and the claimed idea
    // why: his own idea ← "No, we should…" heard as claiming the plan; a similar place ← "No," taken as a real
    //      disagreement and the second "Jamaica" heard as another name
    { id: 'h3', skill: 'humor', level: 'C1', point: 'jamaica', seg: [68.5, 75.6],
      stem: 'Why does the staff’s talk about where to go next get a laugh?',
      choices: ['He agrees, but claims it was his idea', 'He objects, then suggests the same place',
                'He objects, then suggests a similar place'], a: 1,
      cue: '反対の一言のあとの行き先と、次の質問。',
      line: 'Yo, let’s go to Jamaica. — *No, we should go to Jamaica.* Oh, is that what you said?',
      said: '「ジャマイカ行こう」に「いや、ジャマイカだ」と返し、「あ、そう言った？」と気づく。',
      mean: 'No と反対しながら同じ場所を言う。相手の話を聞いていないのがおかしい。',
      trap: 'No のあとは反対意見と予想しやすい。手柄を取るなら、気づく一言は出ない。',
      use: 'Oh, is that what you said? Sorry.（あ、そう言ったの？ごめん）' },
  ]
};
