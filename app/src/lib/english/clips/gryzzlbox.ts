// REVIEW 2026-11-16: pass 10, fix 12, drop 1, new 0; ear checks 1
// REVIEW open: who is the speaker at 2.8–16 s and 69.7–79 s ("I technically work for Gryzzl", "my biz", "Front Street")?
//   No name in the audio, so the stems are speaker-neutral now. The same goes for the novel reader at 165 s.
// “Parks and Recreation | Gryzzl Goes Too Far (Episode Highlight)” (the official Parks and Recreation channel, Season
// 7): free Gryzzl gift boxes are a little too perfect, Leslie's side sees data mining, April is talked into welcoming
// the interns, and a town meeting turns out to be on Leslie's side.
// Segments from the captions, words from whisper (2026-11-16). Untested: 41–48 s (the book title and "a thousand and
// one", garbled in the captions), 126–143 s (the genital-cream complaint, sexual), 119 s ("I've seen much" vs "too
// much"), 77.6 s ("I'mma" vs "I'm gonna"), and 199–211 s (the toy-pig "Ron Swanson" bit, visual). Speakers are named
// only where the audio names them (Leslie at 37 s, April at 84 s). No who item and no predict item.
// EAR CHECK: 185.3 s nt2 — the stress in the crowd's first "We're not against you on this" assumed on "not" (if it's on "this", the key moves to the third choice)
import type { Clip } from '../types.ts';

export const gryzzlBoxes: Clip = {
  id: 'gryzzlbox', video: 'KX4JErnGUlE', title: 'Parks and Recreation | Gryzzl Goes Too Far (Episode Highlight)',
  dur: 232, wpm: 169, band: 'fast', tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: S1: the stem and key said "she", which no audio settles (the speaker isn't named); now speaker-neutral
    // why: broke the law ← "illegal" comes later and "line" sounds like a legal line; switched sides ← "cross a
    //   line" heard as crossing over, and she "technically works for" them
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'line', seg: [1.9, 6.95],
      stem: 'What is meant by what “these fools” have done?',
      choices: ['They have done something unacceptable', 'They have done something against the law',
                'They have gone over to the other side'], a: 0,
      cue: '「technically work for」のあと、but に続く部分。',
      line: 'I know I technically work for Gryzzl, but these fools have *crossed a line*.',
      said: '「一応グリズルで働いてるけど、一線を越えた」。',
      mean: 'cross a line ＝ 許されない一線を越える。やりすぎだという非難。',
      trap: 'line を「陣営」と取ると寝返りに、あとの illegal から違法に聞こえる。',
      use: 'Okay, now you’ve crossed a line.（ちょっと、それは言いすぎ）' },

    // why: got ← "gotten" with its t flapped and n weak shrinks toward "got"; Haven't you ← a negative question,
    //   the -n't easy to imagine; Did you get ← same meaning, only the opening differs
    { id: 's1', skill: 'sound', level: 'B2', point: 'gotten', seg: [5.7, 8.9],
      stem: 'Fill the gap: “___ one of these Gryzzl boxes?”',
      choices: ['Have you gotten', 'Have you got', 'Haven’t you gotten', 'Did you get'], a: 0,
      cue: '「crossed a line」のあと、質問の頭。',
      line: '*Have you gotten* one of these Gryzzl boxes?',
      said: '「グリズルの箱、受け取った？」と聞いている。',
      mean: 'アメリカ英語では get の過去分詞は gotten。have you は弱く「ハヴュ」とつながる。',
      trap: 'gotten の t は弾んで「ガルン」に近く、got に聞こえやすい。最後の「ン」まで聞く。',
      use: 'Have you gotten my email?（私のメール届いた？）' },

    // why: keep it and complain ← "sternly worded letter" heard, but "sending it back" missed; thank-you letter ←
    //   "letter" + "free gifts" fit the polite script
    { id: 'd1', skill: 'detail', level: 'B1', point: 'sendback', seg: [8.4, 16.35],
      stem: 'What was Leslie planning to do with her box?',
      choices: ['Send it back, along with a stern letter', 'Keep it, but write a stern letter about it',
                'Open it after writing a thank-you letter'], a: 0,
      cue: '「haven’t opened it yet」のあとの計画。',
      line: 'planning on *sending it back* after I wrote a sternly worded letter',
      said: '物では買収されない、という厳しい手紙を書いて、送り返すつもりだった。',
      mean: 'sternly worded letter ＝ 厳しい調子の手紙。',
      trap: 'letter が耳に残るが、計画の中心は sending it back。',
      use: 'I’m sending it back.（これ、返品するよ）' },

    // R fix: V2 (blind 70 %): the title ("Goes Too Far") plus a data-reading key made it guessable; the key is now
    //   scene-level ("too personal"), which also gives away i1's key, so reveals 'perfect'
    // why: a bribe ← "I cannot be bought with free gifts" is said just before; an insider ← "How do they even know?"
    //   heard as a question about who told
    { id: 'g1', skill: 'gist', level: 'B2', point: 'creepy', reveals: ['phone', 'mining', 'perfect'], seg: [16.3, 64.9],
      stem: 'Why do the gift boxes alarm the people opening them?',
      choices: ['The gifts are too personal to be chance', 'The gifts are a bribe to win their support',
                'The gifts mean a friend has told their secrets'], a: 0,
      cue: '箱の中身と、「How do they even know?」のあと。',
      said: '夫婦だけの呼び名にちなんだ物や、ぴったりの品が届き、メールや文字を調べているに違いない、と話す。',
      mean: '贈り物そのものより、好みを知りすぎていることが問題。',
      trap: 'cannot be bought でわいろの話に聞こえる。中身がぴったりすぎる点が本題。',
      use: 'How do they even know that?（なんでそんなこと知ってるの？）' },

    // R fix: S1: "she and Joe" assumed the speaker's gender; now "the couple"
    // why: only at home ← pet names are usually private, so "at home" is the script; in letters ← "letter" was
    //   heard a moment ago
    { id: 'd2', skill: 'detail', level: 'B1', point: 'phone', seg: [27.9, 34.4],
      stem: 'When does the couple use those special names?',
      choices: ['Only on the phone or in texts', 'Only at home, when they’re alone', 'Only in letters they write'], a: 0,
      cue: '「creepy because」のあと。',
      line: 'we only call each other these things *on the phone or in texts*.',
      said: '「この呼び名は電話かメッセージでしか使わない。だから気味が悪い」と言っている。',
      mean: '人前で使わない言葉を会社が知っている。だから見られていると分かる。',
      trap: 'あだ名は家で使うものと思いこみやすい。because のあとが理由。',
      use: 'We only talk on the phone.（電話でしか話さないんだ）' },

    // R fix: V2 (blind 70 %): "won over and will keep them" was off-scene; now the 「その通り」 agreement reading
    //   of "exactly", refuted by "They must be data mining"
    // why: pleased for Leslie ← "exactly" heard as happy agreement (Japanese frame); she told them ← the perfect fit
    //   suggests she gave them a wish list
    { id: 'i1', skill: 'infer', level: 'C1', point: 'perfect', seg: [52.2, 57.6],
      stem: 'Why is Leslie’s delight met with “Yeah, exactly”?',
      choices: ['Gifts that perfect show how much Gryzzl knows', 'The speaker is happy the gifts please Leslie',
                'Leslie must have told Gryzzl what she likes'], a: 0,
      cue: '「for me」のあと、「must be」に続く部分。',
      line: 'This stuff is *perfect for me*. — Yeah, *exactly*. They must be data mining',
      said: 'レスリーが「ぴったり」と喜ぶと、「まさに」と返し、データを集めているはずと言う。',
      mean: 'ぴったりすぎるのは、知られすぎている印。',
      trap: 'exactly を「賛成」と取ると、喜びへの同意に聞こえる。続く must be が言いたいこと。',
      use: 'Exactly. That’s my point.（そう、それが言いたいの）' },

    // why: selling the data ← data talk often ends in selling it; phone calls ← "on the phone" was the earlier clue
    { id: 'd3', skill: 'detail', level: 'B1', point: 'mining', seg: [55.5, 61.1],
      stem: 'What do they think Gryzzl must be doing?',
      choices: ['Going through their texts and emails', 'Selling their texts and emails to others',
                'Listening in on their phone calls'], a: 0,
      cue: '「data mining」のすぐあと。',
      line: 'They must be data mining, *searching our texts and emails*',
      said: '「メッセージやメールを調べて、情報を集めているに違いない」。',
      mean: 'data mining ＝ 大量のデータを掘って情報を集めること。',
      trap: 'データの話は「売る」に結びつきやすいが、言っているのは searching と gathering。',
      use: 'They’re reading our emails?（メール読まれてるの？）' },

    // R fix: S2/V1 (blind 85 %): the stem quoted the phrase under test, so knowing it answered the item; the stem now
    //   names the moment, and C is a softening reading
    // why: not worth saying ← "not to mention" read word by word as 「言うまでもない＝言わない」; keep it quiet ←
    //   "mention" = 言う, so "don't say it"; goes too far ← a weak "not" heard as backing off
    { id: 'm1', skill: 'marker', level: 'B2', point: 'mention', seg: [60.7, 64.9],
      stem: 'Right after “a huge invasion of privacy”, what does the rest of the line do?',
      choices: ['Adds an even stronger point to the first one', 'Says a further point isn’t worth bringing up',
                'Admits the first point goes a bit too far'], a: 0,
      cue: '「invasion of privacy」のあと、二つ目の理由。',
      line: 'This is a huge invasion of privacy, *not to mention* illegal.',
      said: '「ひどいプライバシーの侵害だ。おまけに違法だ」と言っている。',
      mean: 'not to mention ＝「それに」「おまけに」。もっと強い点を足す。',
      trap: '文字どおりだと「言わずに」だが、実際は言っている。日本語の「言うまでもなく」と同じ働き。',
      use: 'It’s cheap, not to mention delicious.（安いし、それにおいしい）' },

    // R fix: V2 (blind 55 %): "a warning on every screen" had nothing to do with snooping; now a user switch for the
    //   tracking, a privacy measure the audio doesn't name
    // why: pick a language ← "language" = 言語; switch it off ← "preventing this" heard as a setting users control
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'language', seg: [64.5, 69.95],
      stem: 'When the town’s free Wi-Fi went in, what was made sure of?',
      choices: ['The deal had wording that banned this', 'The deal let users pick their language',
                'The deal let users switch the tracking off'], a: 0,
      cue: '「I made sure」のあと。',
      line: 'I made sure that there was *language preventing this*.',
      said: '「無料Wi-Fiを入れたとき、これを禁じる文言を入れておいた」。',
      mean: 'language ＝ 契約書の文言。preventing this で「禁止する条項」。',
      trap: 'language を「言語」と取ると意味が通らない。契約の話では「言い回し・条文」。',
      use: 'Is there language about refunds?（返金についての条項はある？）' },

    // R fix: S1: "she" assumed the speaker's gender; now "Type what is said"
    { id: 'x1', skill: 'dict', level: 'B2', point: 'agreed', seg: [69.55, 73.95],
      stem: 'Type what is said: “I ___ agreed to work with them…” (3 words)', answer: 'never would have',
      cue: '「I」のすぐあと、agreed の前の3語。',
      line: 'I *never would have* agreed to work with them if I had known',
      said: '「知っていたら、一緒に働くことに同意しなかった」。',
      mean: 'would have は「ウダヴ」のように縮む。never が前に来て強い否定になる。',
      trap: 'have が弱くて would だけに聞こえやすい。過去の「〜しなかったのに」には have が入る。',
      use: 'I never would have guessed.（まさかと思ったよ）' },

    // why: a street protest ← "Front Street" read literally as a place; making peace in public ← "put me on blast"
    //   unknown, so the reply is guessed as friendly
    { id: 'f4', skill: 'phrase', level: 'C1', point: 'blast', seg: [73.6, 79.1],
      stem: 'What does the “Front Street” line mean, judging from what comes before it?',
      choices: ['A threat to show them up in public', 'A plan to protest out on the main street',
                'An offer to settle things out in public'], a: 0,
      cue: '「going down」から続く、二つの言い回し。',
      line: 'Gryzzl is *going down*. You want to put me on blast? I’m gonna *put you on Front Street*.',
      said: '「グリズルは終わり。私をさらす気？なら大通りでさらしてやる」。',
      mean: 'on blast も Front Street も「人前でさらす」というスラング。',
      trap: 'Front Street を地名と取ると抗議の場所に。going down のあとなら攻撃。',
      use: 'You’re going down!（覚悟しとけよ！）' },

    // why: pretends to know ← the usual script of nodding at slang; thinks it's aimed at her ← "put me on" heard
    //   as about the listener
    { id: 'h1', skill: 'humor', level: 'C1', point: 'context', seg: [75.5, 83.6],
      stem: 'What’s funny about the reply to the “Front Street” line?',
      choices: ['She admits she doesn’t get it, yet loves it', 'She pretends to know the slang to seem cool',
                'She takes the threat to be aimed at her'], a: 0,
      cue: '「I don’t understand」と、最後の「I love it」。',
      line: '*I don’t understand* what that means, but I think I get the context, and *I love it*.',
      said: '「意味は分からないけど、流れは分かる。気に入った」と返す。',
      mean: '分からないと正直に言いつつ、勢いだけで大喜び。そのずれが笑い。',
      trap: '若者言葉にうなずくお決まりの場面に見えるが、ここは分からないと先に言っている。',
      use: 'I don’t get it, but I love it.（よく分からないけど、いいね）' },

    // why: party list ← "welcome speech" and "interns start today" just before; praising April ← it follows her
    //   "Go away", so it sounds like flattery
    { id: 'd5', skill: 'detail', level: 'B2', point: 'therapist', seg: [89.9, 103.3],
      stem: 'Why does the man asking April suddenly list three nice things?',
      choices: ['His therapist told him to, instead of yelling', 'He is planning the interns’ welcome party',
                'He is trying to flatter April into a yes'], a: 0,
      cue: '「Why did you just say」への答え。',
      line: 'whenever I feel like *yelling*, I just take a deep breath and say *three great things*',
      said: 'セラピストの助言で、怒鳴りたくなったら深呼吸して、生きる喜びを三つ言う。',
      mean: 'April の「消えて」に怒りそうになったので、三つ並べて気を静めた。',
      trap: '頼みごとの直後でお世辞に聞こえるが、Why への答えはセラピストの助言。',
      use: 'Take a deep breath and count to ten.（深呼吸して10数えて）' },

    // R fix: V2 (blind 65 %): "finally" in the stem pointed at reluctance; the stem is neutral now and the choices
    //   are tone + reason pairs
    // why: pleased ← "Fine" = 良い in katakana; calm ← the breathing trick comes just before
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'whatever', seg: [102.9, 108.25],
      stem: 'How does April sound when she agrees to give the speech?',
      choices: ['Grudging: she just wants the asking to end', 'Pleased: he asked her nicely in the end',
                'Calm: his breathing trick has relaxed her'], a: 0,
      cue: '「Please talk to my interns」のあとの短い返事。',
      line: '*Fine. Whatever.* I’ll do it.',
      said: '「はいはい、どうでもいい。やるよ」と引き受ける。',
      mean: 'Fine. Whatever. ＝ しぶしぶの承諾。早く終わらせたい気持ち。',
      trap: 'fine を「良い」と取ると快諾に聞こえる。Whatever が付けば投げやり。',
      use: 'Whatever. I’ll go.（どうでもいいけど、行くよ）' },

    // why: ten ← "10 years ago" comes right after; twelve ← "twenty" and "twelve" share "tw-"; thirty ← her age now
    //   (20 plus "10 years"), heard together with "now I'm old"
    { id: 'n2', skill: 'number', level: 'B1', point: 'age', seg: [107.8, 113.3], keep: true,
      stem: 'How old was April when she started working here?',
      choices: ['Ten', 'Twelve', 'Twenty', 'Thirty'], a: 2,
      cue: '「when I was」の直後の数。',
      line: 'I started here when I was *20*, and now I’m old and gross and directionless.',
      said: '「ここに来たのは20歳。今は年寄りで、目標もない」。',
      mean: '20歳で入って、今は30歳くらい。それを「年寄り」と言っている。',
      trap: 'すぐあとに 10 years ago が来るので ten や、今の年齢に引かれやすい。when I was の直後を聞く。',
      use: 'I started here when I was twenty.（ここで働き始めたのは20歳のとき）' },

    // anchor: 108.3–115.2 s "I started here when I was 20, and now I'm old and gross and directionless. Those kids
    //   are me 10 years ago": she rates herself at about 30 as old
    // why: the interns ← she calls them "kids", which sounds like a put-down; the man ← he forced the speech on her,
    //   so the dark line seems aimed at him
    // retired: with nt2 (one C2 alone is under the tier's 2)
    { id: 'nt1', skill: 'humor', level: 'C2', retired: true, point: 'old', reveals: ['age'], seg: [107.8, 115.4],
      stem: 'In April’s little talk about the interns, who is the joke on?',
      choices: ['April herself, calling herself old already', 'The interns, being treated as silly kids',
                'The man who pushed the speech onto her'], a: 0,
      cue: '自分のことを何と言い、何年前と比べているか。',
      line: 'now I’m *old and gross and directionless*. Those kids are *me 10 years ago*.',
      said: '20歳で来て今は「年寄りで、だめで、目標なし」、インターンは「10年前の私」と言う。',
      mean: '30歳ほどで自分を年寄り扱いする大げさな自虐。kids は見下しではなく、昔の自分の姿。',
      trap: 'kids で若者をからかうように聞こえる。主語が I と me なら、笑いの的は話し手自身。',
      use: 'I’m too old for this.（もうこういうのは年だわ）' },

    // why: a test ← "internship" + horror-film words read as a trial to pass; filmed ← "videotape" read literally
    { id: 'i2', skill: 'infer', level: 'C1', point: 'ring', seg: [113.0, 124.8],
      stem: 'What does April suggest the internship does to people?',
      choices: ['It slowly ruins whoever gets drawn in', 'It is a scary test that they must pass',
                'It gets filmed and shown to everyone'], a: 0,
      cue: '「too late for me」と「save them」。',
      line: 'It’s *too late for me*… but maybe I can *save them*. You’re all going to die in here!',
      said: '「私は手遅れ。でもこの子たちは救えるかも」と言い、「全員死ぬよ」と叫ぶ。',
      mean: '呪いのビデオにたとえ、ここで働くと人生がだめになる、と大げさに警告。',
      trap: 'videotape を文字どおり取ると撮影の話に。too late と save で呪いと分かる。',
      use: 'Save yourself while you can.（今のうちに逃げて）' },

    // R fix: V2 (blind 55 %): the key was the only nuanced choice; C is nuanced too now. The said note had three
    //   broken characters (気に入って)
    // why: angry at Leslie ← the town-meeting script where the crowd blames the official; defending Gryzzl ← "I am
    //   keeping it" and "I like their phones" are heard
    { id: 'g2', skill: 'gist', level: 'B2', point: 'meeting', reveals: ['pig'], seg: [143.0, 191.4],
      stem: 'What does the town meeting reveal about people’s feelings?',
      choices: ['Even people who liked their gifts back Leslie', 'They blame Leslie for letting Gryzzl in at all',
                'They like their gifts too much to turn on Gryzzl'], a: 0,
      cue: '贈り物への文句のあと、最後の三回のくり返し。',
      said: '住民は、物は気に入っても家に送るのはやりすぎ、と言い、彼女の味方だと答える。',
      mean: '贈り物は好評でも、のぞき見には町全体が反対。',
      trap: 'keeping it や I like their phones で会社の味方に聞こえる。but のあとが本音。',
      use: 'We’re all on the same side here.（ここではみんな味方だよ）' },

    // R fix: V2 (blind 60 %): "only one pig" was a filler; now "I am keeping it" misheard as having to give it back
    // why: a cheap fake ← "rare" heard with suspicion, as if it isn't real; must give it back ← "no right to give me"
    //   heard as the gift being taken away
    { id: 'h4', skill: 'humor', level: 'C1', point: 'pig', seg: [153.3, 164.7],
      stem: 'What’s funny about the pig collector’s complaint?',
      choices: ['He’s upset that the gift is too wonderful', 'He’s upset that the rare pig is a fake',
                'He’s upset that he has to give it back'], a: 0,
      cue: '「But still」のあと、何に文句を言っているか。',
      line: 'I am *keeping it*. But still, they have no right to give me something I will *treasure* the rest of my life.',
      said: '「とても珍しいから返さない。でも、一生の宝物になる物を贈る権利はない」と言う。',
      mean: '抗議の形なのに、中身は最高の贈り物だという告白。言葉と気持ちがずれている。',
      trap: 'no right で本気の抗議に聞こえる。何に怒っているか、目的語まで聞く。',
      use: 'I hate how much I love this.（好きすぎてくやしい）' },

    // R fix: S1: "her" assumed the speaker's gender; the choices are speaker-neutral now
    // why: hide from parents ← the usual teen secret; friends borrowing ← "in front of all my friends" heard as the
    //   worry
    { id: 'a3', skill: 'attitude', level: 'B2', point: 'woolf', seg: [164.6, 174.1],
      stem: 'How does the speaker who got novels feel about it?',
      choices: ['Embarrassed that friends now know about it', 'Worried that parents will see the books',
                'Annoyed that friends will borrow the books'], a: 0,
      cue: '「Now」で始まる一文と、最後の質問。',
      line: 'Now Miley and Haley *know I like to read*. What if they tell Evan?',
      said: '友だちの前で箱を開けたら小説だった。「本好きだとばれた。エヴァンに言われたら？」と心配する。',
      mean: '読書好きが知られるのを、かっこ悪いと気にしている。',
      trap: '秘密は親に隠すものと考えやすいが、心配しているのは友だちと Evan。',
      use: 'What if they tell everyone?（みんなに言われたらどうしよう）' },

    // R fix: V2 (blind 65 %): the distractors didn't build on the line; now "I like" heard as a trade-off or as a
    //   defense. "his" dropped (the speaker isn't named)
    // why: phones make up for it ← "I like their phones" heard as the conclusion; defends Gryzzl ← "I like" heard as
    //   taking Gryzzl's side
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'phones', seg: [173.7, 181.35],
      stem: 'What does the next speaker do with “I like their phones…”?',
      choices: ['Grants a good point, then makes a complaint', 'Says the good phones make up for the snooping',
                'Defends Gryzzl against the earlier complaints'], a: 0,
      cue: '「phones」のあとの but。',
      line: 'I like their phones, *but they’ve gone too far*',
      said: '「電話はいいけど、家にこんな物を送るのはやりすぎ。個人データを調べる権利はない」と言う。',
      mean: '先に良い点を認めて、but のあとで本題の不満を言う、よくある形。',
      trap: '最初の一言で味方に聞こえるが、英語は but のあとに本音が来る。',
      use: 'I like the place, but it’s too loud.（いい店だけど、うるさすぎる）' },

    // R drop: i4 (K1 + V1): "on this" doesn't settle that the town usually opposes her; Leslie's next lines ("after
    //   months… The town is behind us") fit "it had sided with Gryzzl" just as well, and the key leaned on the show's
    //   history. Never shipped, so deleted

    // anchor: 185.3–186.6 s the first "We're not against you on this", answering "you guys are not against us on
    //   this?" (stress assumed on "not": EAR CHECK)
    // why: on "you" ← a contrast reading (us vs Gryzzl) that fits the fight; on "this" ← the reading that "this time"
    //   is the exception, a fluent listener's favorite
    // retired: the ear-check policy: a C2 stress item (the stress in “We're not against you on this” on “not”,
    //   185.3 s); back after the ear check
    { id: 'nt2', skill: 'sound', level: 'C2', retired: true, point: 'stress', seg: [181.0, 187.2],
      stem: 'In the crowd’s first answer, where is the stress, and why?',
      choices: ['On “not”: denying what she feared', 'On “you”: siding with her, not Gryzzl',
                'On “this”: only on this, not on others'], a: 0,
      cue: '最初の答えで、いちばん強く長い語。',
      line: 'We’re *not* against you on this.',
      said: '「反対じゃないの？」と聞かれ、住民が「反対じゃない」と答え、だんだん声が大きくなる。',
      mean: '聞かれた not をそのまま強めて「その心配はない」と打ち消している。強勢は答えの焦点を示す。',
      trap: 'on this を強めると「今回だけ」の含みになり、対比の読みに引かれる。質問の焦点が答えの焦点。',
      use: 'I’m NOT mad at you.（怒ってないってば）' },
  ]
};
