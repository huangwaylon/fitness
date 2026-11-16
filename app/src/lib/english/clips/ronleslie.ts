// REVIEW 2026-11-16: pass 7, fix 15, drop 1, new 1; ear checks 0
// REVIEW open: none. The a3 ear check is gone: "you've been a perfect gentleman… I am an insane weirdo" answers Ron's
//   demand, so the words settle that it's Leslie's line.
// “Ron and Leslie get down to business | Parks and Recreation” (the official Parks and Recreation channel, Season 7):
// locked in a room until they talk, Leslie and Ron first plot a fake make-up for Ben, then she tries everything to
// make him talk, and he gives her three minutes.
// Segments from the captions, words from whisper (2026-11-16). Untested: 68–77 s (whisper only: the monitor
// smashed), 124–132 s ("Talk to me" on a loop), the sung verses at 180–209 s (garbled in both), 173 s "Oh, that's
// right" (speaker unclear), and 49–54 s ("We are not saying I was the problem… I will not let you lie to them":
// whose lines is unclear). No who item and no predict item.
import type { Clip } from '../types.ts';

export const ronLeslieLocked: Clip = {
  id: 'ronleslie', video: 'b_9fjLc3JBs', title: 'Ron and Leslie get down to business', dur: 238, wpm: 157,
  band: 'slow', tags: ['職場', '友だち'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // why: ten years ← "10 hours" is the number they keep coming back to; a year ← "two" is short and weak before
    //   "years"
    { id: 'n1', skill: 'number', level: 'B1', point: 'locks', seg: [3.7, 9.15], keep: true,
      stem: 'When were the locks on the room put in?',
      choices: ['A year ago', 'Two years ago', 'Ten years ago'], a: 1,
      cue: '「magnetic locks」のすぐあとの数。',
      line: 'They installed these magnetic locks *two years ago*.',
      said: '「この磁石の鍵は2年前に付けられた。避ける方法はない」と言っている。',
      mean: '鍵は新しくて頑丈なので、普通には出られない、という説明。',
      trap: 'このあと 10 hours が何度も出るので ten に引かれやすい。years の直前の一語を聞く。',
      use: 'They put in new locks two years ago.（2年前に新しい鍵を付けたんだ）' },

    // why: break the window ← Ron's own plan, heard first; really talk ← what they're locked in to do, and the words
    //   "talked it out" are in her plan
    { id: 'g1', skill: 'gist', level: 'B2', point: 'fake', reveals: ['madeup'], seg: [8.9, 37.0],
      stem: 'How does Leslie suggest they get out of the room?',
      choices: ['By telling Ben a story that they made peace', 'By breaking out through a window, wire or not',
                'By really talking things through for ten hours'], a: 0,
      cue: '「another way」のあと、何を伝えるつもりか。',
      line: 'we’ll tell Ben that we *talked it out*, made up.',
      said: '窓を割るという Ron に、少し待って「話し合って仲直りした」と伝えよう、と言う。',
      mean: '本当に話すのではなく、話したふりで出る作戦。',
      trap: 'talked it out で本当に話すように聞こえるが、wait a few minutes でふりと分かる。',
      use: 'Let’s just tell them we worked it out.（解決したって言っちゃおう）' },

    // R fix: V2 (blind 55 %): the key was the only two-part choice; both distractors are two-part now
    // why: thick glass ← breaking glass is the usual problem; alarm + guards ← "security" heard as an alarm system
    { id: 'd2', skill: 'detail', level: 'B1', point: 'window', seg: [12.0, 16.3],
      stem: 'Why does Leslie warn Ron off punching the window?',
      choices: ['There’s wire in it, and he’d cut his arm', 'The glass is too thick, and he’d hurt his hand',
                'There’s an alarm on it, and guards would come'], a: 0,
      cue: '「Ron」と呼んだすぐあと。',
      line: 'Ron, there’s *security wire* in there. You’ll *slice your arm open*.',
      said: '「ガラスに防犯ワイヤーが入ってる。腕を切るよ」と止める。',
      mean: 'security wire ＝ ガラスに入った防犯ワイヤー。けがの心配をしている。',
      trap: 'security を「警備員」と取りやすいが、続く wire と slice で、けがの話と分かる。',
      use: 'Careful, you’ll cut your hand.（気をつけて、手を切るよ）' },

    // R fix: V2 (blind 70 %): "ten hours without food" was a filler; the new distractor keeps "sit here… ten hours"
    //   and drops only the talking, so the "than" clause decides
    // why: waiting ← "sit here… for 10 hours" heard, "talk about my feelings" missed; cut not so bad ← "bleed out" heard
    //   as him playing down her warning
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'bleed', seg: [15.3, 21.2],
      stem: 'What does Ron’s answer to her warning show?',
      choices: ['He’d take an injury over talking about feelings', 'He’d take an injury over waiting here ten hours',
                'He thinks the cut won’t be as bad as she says'], a: 0,
      cue: '「I would rather」のあと、「than」の前と後。',
      line: 'I would *rather bleed out than* sit here and *talk about my feelings* for 10 hours.',
      said: '「10時間気持ちを話すなら、血を流すほうがまし」。',
      mean: 'would rather A than B ＝ B よりは A。話し合いがそれほどいや。',
      trap: 'sit here と 10 hours が残ると、待つのがいやに聞こえる。than のあとが本題。',
      use: 'I’d rather walk than wait an hour.（1時間待つなら歩くほうがいい）' },

    // R fix: V2 (blind 60 %): "wrote a story" and "got ready to go out" fit nothing in the scene; the new
    //   distractors are near chunks (catch up, come up with) a listener might hear for "made up"
    // why: caught up ← "catch up" is the other "-ed up" chunk after talking; came up with a plan ← "make up" = 作る/作り話
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'madeup', seg: [20.4, 28.4],
      stem: 'What will they claim to Ben, according to Leslie’s plan?',
      choices: ['That they talked and are friends again', 'That they talked and caught up on old news',
                'That they talked and came up with a plan'], a: 0,
      cue: '「talked it out」のすぐあと、短い二語。',
      line: 'we’ll tell Ben that we talked it out, *made up*.',
      said: '「話し合って、仲直りした」と Ben に伝えるつもりだ、と言っている。',
      mean: 'make up ＝ 仲直りする。けんかのあとによく使う。',
      trap: 'make up は「作り上げる」の意味もあり、計画の話に聞こえる。けんかの話の中なら「仲直り」。',
      use: 'Did you two make up yet?（二人、もう仲直りした？）' },

    // R fix: K1: "something she never did" was defensible (the whole apology is invented); C is now the "for whatever"
    //   reading, refuted by "heroically caring too much"
    // why: apologizes for Ron's faults ← "you admitted… stubborn" is right after; so vague it's empty ← "for whatever"
    //   heard without what follows
    { id: 'h1', skill: 'humor', level: 'C1', point: 'apology', seg: [27.5, 36.95],
      stem: 'What’s funny about the apology Leslie plans to report?',
      choices: ['Her “fault” is really a way of praising herself', 'She would apologize for his faults instead of hers',
                'Her apology is so vague that it means nothing'], a: 0,
      cue: '「apologized for whatever」のあと、何について謝るか。',
      line: 'I apologized for whatever, *heroically caring too much*',
      said: '自分は「英雄的に気にかけすぎたこと」を謝り、彼は頑固さを認めた、と報告する案。',
      mean: '謝ったことにして、中身は自分をほめている。そのずれが笑い。',
      trap: 'for whatever で適当に謝ると聞こえるが、続く heroically で自慢と分かる。',
      use: 'I’m sorry I care so much.（気にかけすぎてごめんね）' },

    // why: admits it but wants it quiet ← the question form read as a soft admission; wants a real apology ← he
    //   asks for her to be "at fault", heard as a real demand, not a different lie
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'stubborn', seg: [36.5, 42.85],
      stem: 'How does Ron react to his part in her story?',
      choices: ['He wants their roles in the story swapped', 'He admits it but wants it kept quiet',
                'He wants her to say sorry to him for real'], a: 0,
      cue: '「Why」で始まる二つの質問。',
      line: 'Why can’t the problem have been that *I was reasonable and you were at fault*?',
      said: '「なんで俺が頑固なんだ。俺がまともで、君が悪かったことにすればいい」と言う。',
      mean: 'うそをつくのは構わないが、自分が悪役なのは嫌だ、という不満。',
      trap: 'Why do I have to…? は認めているようにも聞こえるが、続きで役を逆にしたいと分かる。',
      use: 'Why do I always have to be the bad guy?（なんでいつも私が悪者なの）' },

    // R fix: K5/K6 (blind 60 %): the stem said "about Ron" and only the key was about Ron; the stem now asks what
    //   nobody would believe, and all three choices are things in the scene
    // why: the locked room ← the whole situation is odd, so "science fiction" seems to be about it; ever fought ←
    //   "laugh really hard" heard without what it's aimed at
    { id: 'i1', skill: 'infer', level: 'C1', point: 'scifi', seg: [36.5, 49.0],
      stem: 'In Leslie’s “science fiction” answer, what would nobody believe?',
      choices: ['That Ron was the reasonable one', 'That they got locked in a room', 'That the two of them ever fought'],
      a: 0,
      cue: '「Because」で答えている質問は何か。',
      line: 'Because we want them to believe us and not laugh really hard at a *ridiculous science fiction scenario*.',
      said: '「ありえないSFみたいな話で大笑いされたくない」と答える。',
      mean: 'Because は Ron の質問への答え。Ron がまともだという話は SF 並み、という皮肉。',
      trap: '閉じこめられた状況の話に聞こえるが、Because は直前の質問への答え。',
      use: 'That’s not exactly believable.（それはちょっと信じがたいね）' },

    // R fix: V2 (blind 50 %): "Kindly… to win him back" was the weak one; now a hurt, giving-up reading of "Fine".
    //   The ear check is gone: the words settle the speaker ("you've been a perfect gentleman" answers Ron's demand)
    // why: sincerely taking the blame ← "Fine" heard as giving in, and she does name herself; hurt ← a flat "Fine"
    //   read as 諦め
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'blame', seg: [52.45, 66.6],
      stem: 'How does Leslie mean her “Fine. I’ll tell them…”?',
      choices: ['Sarcastically: she is mocking the blame he wants', 'Sincerely: she is taking the blame to end it',
                'Hurt: she is giving up on fixing things'], a: 0,
      cue: '自分をどう言い表しているか、その強さ。',
      line: 'you’ve been a *perfect gentleman* and scholar, and I am an *insane weirdo* who…',
      said: '「この3年、あなたは完璧な紳士で、私は理由もなく友情を壊した変人だって言うわ」と言う。',
      mean: '大げさに自分を悪く言って、Ron の言い分のおかしさを見せている。',
      trap: 'Fine は「折れた」に聞こえやすい。言い方が極端すぎたら皮肉を疑う。',
      use: 'Fine, it’s all my fault, then.（はいはい、全部私のせいね）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'blue', seg: [63.2, 66.6],
      stem: 'Type what she says: “decided to ruin it ___ for no good reason.” (4 words)', answer: 'out of the blue',
      cue: '「ruin it」のすぐあと、4語のかたまり。',
      line: 'decided to ruin it *out of the blue* for no good reason.',
      said: '「理由もなく突然、友情を壊した」。out of the がつながって短く聞こえる。',
      mean: 'out of the blue ＝ 前ぶれなく、突然。',
      trap: 'of と the が弱く、「アウラダ」のように一続きになる。blue だけはっきり聞こえる。',
      use: 'He called me out of the blue.（彼から突然電話が来た）' },

    // R fix: V2 (blind 50 %): "said in all seriousness" swapped for a hedge reading, a Japanese learner's frame
    // why: corrects herself ← "I mean" as 「じゃなくて」; softens ← "I mean" heard as a hedge (「まあ」)
    { id: 'm1', skill: 'marker', level: 'B2', point: 'imean', seg: [81.9, 88.8],
      stem: 'After “Everything’s different”, what does the next “I mean…” do?',
      choices: ['Narrows “everything” down to examples', 'Takes back the word “everything” as wrong',
                'Softens “everything”, as if unsure of it'], a: 0,
      cue: '「different」のあとに並ぶ名詞。',
      line: 'Everything’s different. *I mean*, the furniture. The pictures.',
      said: '「全部変わった。ほら、家具とか、写真とか」と例を挙げている。',
      mean: 'この I mean ＝「つまり」「たとえば」。大まかな言葉を具体的にする。',
      trap: 'I mean は言い直しにも使うが、ここは「全部」を否定していない。続く例を聞く。',
      use: 'It’s expensive. I mean, the rent alone…（高いよ。家賃だけでも…）' },

    // why: doubts Craig did it ← "Did he?" heard as a real challenge to who changed it; upset ← the Japanese frame
    //   「えっ、変えたの？」 as dismay
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'notice', seg: [88.4, 97.2],
      stem: 'What does Ron’s short reply “Did he?” tell us?',
      choices: ['He hadn’t noticed any of the changes', 'He doubts that Craig made the changes',
                'He is upset about all of the changes'], a: 0,
      cue: '「Did he?」のあと、自分について言うこと。',
      line: 'Did he? *I tried not to notice anything* when I worked here.',
      said: '「そうか？ここで働いていたときは、何も気づかないようにしてた」と言う。',
      mean: 'Did he? は本当の質問ではなく「そうなの？」。気づいていなかったことを示す。',
      trap: '疑問の形なので疑っているように聞こえる。続く文が答え合わせになる。',
      use: 'Oh, did they? I hadn’t noticed.（え、そうなの？気づかなかった）' },

    // anchor: 94.4–99.7 s "…or learn anyone's name. You of all people should know that, Lauren." (both sources
    //   have "Lauren"); "you of all people" shows he knows she's the one he knows best
    // why: mixes her up ← "Craig changed everything" just before, so a name from the new office seems to slip in; old
    //   nickname ← "you of all people" heard as warmth, so "Lauren" sounds like a fond private name
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'lauren', seg: [88.4, 100.4],
      stem: 'Why does Ron call Leslie by the wrong name at the end?',
      choices: ['To prove, as a joke, he never learned names', 'He mixes her up with someone at the new office',
                'It is an old nickname he uses to tease her'], a: 0,
      cue: '名前の直前、ロンが自分について言う一文。',
      line: 'or *learn anyone’s name*. You of all people should know that, *Lauren*.',
      said: '「誰の名前も覚えないようにしてた。君なら知ってるだろ」と、わざと違う名前で呼ぶ。',
      mean: '一番よく知る相手の名前をわざと違えて、言ったことを実演している。you of all people がその合図。',
      trap: '言いまちがいや愛称に聞こえやすい。直前の言葉を実演していないかを聞く。',
      use: 'You of all people should get this.（あなたこそ分かるはずでしょ）' },

    // why: talks it all through ← what the lock-in was meant to get; Leslie gives up ← the long "talk to me" stretch
    //   and the silence after it
    { id: 'g2', skill: 'gist', level: 'B2', point: 'end', seg: [100.2, 217.0],
      stem: 'How does Leslie’s effort to make Ron talk turn out?',
      choices: ['He agrees to talk, but only for a short time', 'He opens up, and they talk through everything',
                'She gives up, and they sit there in silence'], a: 0,
      cue: '最後の Ron の一言。',
      said: '賭けに乗り、黙り続けた Ron だが、最後の曲のくり返しで折れて、話すことに同意する。',
      mean: '完全に折れたのではなく、条件つきの譲歩。',
      trap: '長く黙っていたので、あきらめたように見える。最後の一言で決まる。',
      use: 'Okay, you win. Five minutes.（分かった、負けたよ。5分だけね）' },

    // R fix: S4: the segment ended at 109.35 s, inside "on"; now 109.8 s, after "Ron"
    // anchor: 107.34–108.9 s both sources: "I choose sit here." (no "to", no "-ing")
    // why: the grammar instinct writes "i choose to sit here"; "i'll just sit here" ← her "just sit here" is in the
    //   line before
    { id: 'nt2', skill: 'dict', level: 'C2', point: 'choose', seg: [105.85, 109.8],
      stem: 'Type Ron’s answer to her two options: “___.” (4 words)', answer: 'i choose sit here',
      cue: '二つの選び方を聞いたあと、すぐの短い返事。',
      line: '…or we can just sit here doing nothing. — *I choose sit here.*',
      said: '「話すか、ただ座っているか」と聞かれ、「座ってる、を選ぶ」と即答する。',
      mean: '相手の言った sit here を、メニューの名前のようにそのまま選んでいる。',
      trap: '文法どおり choose to sit と書きたくなる。相手の言葉を借りた返事は形が崩れやすい。聞こえない to は足さない。',
      use: 'Pizza or pasta? — I choose pizza.（ピザかパスタ？ピザにする）' },

    // R fix: V2 (blind 65 %): "Why do we / Why did we just…" don't fit a suggestion, so the key stood out. The
    //   choices are now all natural suggestions; the weak "we" vs "you" decides
    // why: Why don't you ← after "Come on, Ron" a "you" is expected, and we/you are both weak; Why won't you ←
    //   don't/won't differ in the vowel; Why can't we ← can't with its t lost is short like don't
    { id: 's1', skill: 'sound', level: 'B2', point: 'whydont', seg: [107.2, 111.3],
      stem: 'Fill the gap: “Come on, Ron. ___ just…”',
      choices: ['Why don’t we', 'Why don’t you', 'Why won’t you', 'Why can’t we'], a: 0,
      cue: '「Come on, Ron」のすぐあと、文の頭。',
      line: 'Come on, Ron. *Why don’t we* just…',
      said: '「ちょっと〜しない？」と誘いかけて、さえぎられる。',
      mean: 'Why don’t we…? ＝「〜しようよ」。t はほぼ消え「ワイドンウィ」。',
      trap: 'Ron のあとなので you と思いやすい。弱い一語の母音「ウィ」を聞く。',
      use: 'Why don’t we grab lunch?（お昼食べに行かない？）' },

    // R fix: V2 (blind 55 %): "invites her to sit beside him" swapped for the imperative reading of "Sit here!"
    // why: agrees and sits ← "sit here" heard as a yes to her suggestion; tells her to sit ← "Sit here!" heard as an
    //   order to her
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'sithere', reveals: ['choose', 'whydont'], seg: [107.2, 113.3],
      stem: 'When Leslie starts “Why don’t we just…”, what does Ron do?',
      choices: ['Finishes her sentence his way to shut her down', 'Agrees with her plan and sits down to listen',
                'Tells her to sit down and keep quiet'], a: 0,
      cue: '彼女の文が途切れたところに入る、Ron の二語。',
      line: 'Why don’t we just… — *Sit here.* — Ron! — *Sit here!*',
      said: '彼女の誘いの続きを Ron が「座ってる」で勝手に終わらせ、呼ばれてもくり返す。',
      mean: '相手の文を乗っ取って、自分の答えをもう一度言っている。断りの合図。',
      trap: 'sit here だけ聞くと誘いに聞こえる。同じ二語をくり返すのは「話さない」の意思表示。',
      use: 'Let’s just… — Go home? Yes, please.（もう…—帰る？賛成）' },

    // R fix: V2 (blind 55 %): "nervous, but acting tough" was off-scene and the key read oddly; now two "sure" choices
    //   that only "from now into infinity" tells apart, plus the money reading
    // why: wants money ← "any amount of money" is heard; only for ten hours ← the lock-in's "10 hours" and "any length of
    //   time" heard without "into infinity"
    { id: 'a4', skill: 'attitude', level: 'B2', point: 'bet', seg: [114.3, 124.2],
      stem: 'How does Ron feel about Leslie’s bet that she can make him talk?',
      choices: ['Sure he’ll win, however long it takes', 'Sure he’ll win, at least for the ten hours',
                'Keen to win as much of her money as he can'], a: 0,
      cue: '「I’ll take that bet」のあと、any が何回続くか。',
      line: 'I’ll take that bet at any odds… over *any length of time*, stretching from now *into infinity*.',
      said: '「どんな倍率でも、いくらでも、どれだけ長くても、永遠に受けて立つ」と言う。',
      mean: 'any を重ねて、絶対に負けないという自信を大げさに示している。',
      trap: 'money や time で条件つきに聞こえる。最後の into infinity で「永遠に」。',
      use: 'I’ll take that bet any day.（その賭け、いつでも受けるよ）' },

    // R fix: V2 (blind 60 %): "find out which one he likes" was weak (she knows); now "You guys" heard as her
    //   giving up on him
    // why: telling the others ← "You guys" heard as a real announcement of what he likes; giving up ← "You guys" heard
    //   as her turning away from Ron
    { id: 'i2', skill: 'infer', level: 'B2', point: 'bait', seg: [133.4, 145.2],
      stem: 'What is Leslie up to with what she says about wood and plastic?',
      choices: ['Saying things to provoke him into answering', 'Telling the others what Ron really likes',
                'Giving up on him and chatting with the others'], a: 0,
      cue: '「One word」と「Last chance」にはさまれた部分。',
      line: '*One word and this is over.* I think wood is stupid… Ron loves plastic.',
      said: '「一言でいい」と言い、木はくだらない、Ron はプラスチック好き、と言う。',
      mean: 'Ron が言い返したくなることを言って、口を開かせようとしている。',
      trap: 'You guys で周りへの報告に聞こえるが、直前の one word が目的。',
      use: 'Just say one word and I’ll stop.（一言言えばやめるから）' },

    // R fix: V2 (blind 50 %): "make one mix" was a filler; "sing one song" keeps "song", so "choose" decides
    // why: bring a dish ← a barbecue suggests food; sing a song ← "song" is heard, and she sings later
    { id: 'd3', skill: 'detail', level: 'B1', point: 'mix', seg: [150.6, 158.95],
      stem: 'For the barbecue mix, what did Leslie ask everyone to do?',
      choices: ['Choose one song for it', 'Bring one dish to it', 'Sing one song for it'], a: 0,
      cue: '「I asked everyone」のあと。',
      line: 'I asked everyone in the parks department to *choose one song*.',
      said: '公園課の全員に、1曲ずつ選んでもらった、と言っている。',
      mean: 'その曲を集めて、バーベキュー用のミックスCDを作った。',
      trap: 'barbecue から料理を、song から歌うことを考えやすい。asked … to のあとの動詞が頼んだこと。',
      use: 'Everyone picked one song.（みんな1曲ずつ選んだ）' },

    // R fix: V2 (blind 55 %): "keeps her feelings hard" wasn't English anyone means; now "trap" read as a locked box
    // why: can't stop thinking ← "trap" read as 罠, something she can't escape; keeps secrets ← a steel trap read as a
    //   locked box
    { id: 'f1', skill: 'phrase', level: 'C1', point: 'trap', seg: [161.6, 167.8],
      stem: 'What does Leslie mean by what she says about her mind?',
      choices: ['She forgets nothing about her friends', 'She can’t stop thinking about her friends',
                'She keeps her friends’ secrets locked away'], a: 0,
      cue: '「a fact I remember because」のあと。',
      line: 'my mind is a *steel trap* of friendship nuggets.',
      said: '「私の頭は友情の小ネタを逃さない鉄のわな」と言う。',
      mean: 'a mind like a steel trap ＝ 一度覚えたら忘れない。',
      trap: 'trap を「罠」や「金庫」と取ると別の意味に。remember のあとなら記憶の話。',
      use: 'She has a mind like a steel trap.（彼女は記憶力がすごい）' },

    // R drop: i3 (V1 + V2): the key (to bother him) came from the premise, not the segment, and the blind pass got it
    //   at 60 %; the segment stopped before the words that show the tactic. Never shipped, so deleted
    // R new: what she adds to Jerry's song, from the next two lines (both sources agree)
    // why: loud ← a song played to annoy suggests volume; make him sing ← "sing along" heard as aimed at Ron
    { id: 'd4', skill: 'detail', level: 'B2', point: 'jerry', seg: [167.6, 180.4],
      stem: 'Along with Jerry’s song, what does Leslie say she’ll do?',
      choices: ['Sing along and look him in the eye throughout', 'Sing along and turn it up as loud as it goes',
                'Sing along and make him sing the chorus'], a: 0,
      cue: '「sing along」のあと、もう一つの予告。',
      line: 'And I’m gonna sing along. And I’m gonna *maintain eye contact the whole time*.',
      said: 'ジェリーの曲で一緒に歌い、ずっと目を合わせる、と宣言する。',
      mean: 'いやがることを重ねる作戦。maintain eye contact ＝ 目をそらさない。',
      trap: 'sing along のあとも I’m gonna が続く。次の動詞まで聞く。',
      use: 'Try to keep eye contact when you talk.（話すときは目を合わせてね）' },

    // why: ten ← "10 hours" earlier; thirty ← "three" with a long vowel sounds like "thirty"
    // R fix: N7/B1: the stem says Ron agrees to talk, which is g2's key; reveals 'end' now
    { id: 'n2', skill: 'number', level: 'B1', point: 'minutes', reveals: ['end'], seg: [213.0, 216.7], keep: true,
      stem: 'How long does Ron agree to talk with Leslie?',
      choices: ['Three minutes', 'Ten minutes', 'Thirty minutes'], a: 0,
      cue: '最後の一文、「minutes」の直前。',
      line: 'I will speak with you for *three minutes*.',
      said: '「3分だけ話してやる」と言っている。',
      mean: '折れはしたが、時間は最小限。Ron らしい条件。',
      trap: 'three と thirty は似ている。thirty なら「サーティ」と二音節で、t が弾む。',
      use: 'I can give you five minutes.（5分なら時間取れるよ）' },
  ]
};
