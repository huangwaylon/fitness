// “Sam & Cat Crossover w/ iCarly + Victorious 🐟 in 5 Minutes! #TheKillerTunaJump | NickRewind” (NickRewind, Best of
// iCarly): an episode in five short scenes. A friend finds Sam and Jade getting along without her, takes the advice
// to “steal one of theirs” and brings Freddie to LA, fights with Sam over flirting, and ends up doing Sam's motorcycle
// stunt for her “to protect you”. Segments from the captions, words from whisper (2026-11-17).
// Speakers: Cat is addressed at 155 s, 162 s, 244.5 s and 263.8 s, and Freddie names her at 125.5 s; Sam names herself
// at 234.3 s and is the one who means to “jump the tuna” (170 s, 175–183 s). Nobody is named in 0–58 s, so those stems
// say “the first speaker”, “the friend who wasn't invited” or “the two girls”; the woman who greets Freddie (92.8 s)
// isn't named either. No key uses the Dice/tuna backstory, the kiss itself (184–191 s, shown, not said), the garbled
// 162–165 s, or the lines where the sources differ: 11.9 s (“you moved in” / “she moved in”), 16.8 s (“did” / “do”),
// 24.8 s (“See” / “So”), 36.9 s (“what's up” / “sup”), 66.4 s (“Yes, she did” / “And she did”), 83 s (“And” / “But
// actually”), 170 s and 250 s (“going to” / “gonna”).
// REVIEW 2026-11-17: pass 10, fix 14, drop 0, new 0; ear checks 3
// EAR CHECK: 242.6 s r1 — the predict cut falls after "Fine!" and before "I'll jump the tuna!" (gap ~0.4 s)
// EAR CHECK: 62.0 s s1 — the n't of "wouldn't" is audible (both sources say "wouldn't")
// EAR CHECK: 215.8 s s2 — "Weren't you" starts with /w/, not "Aren't you" (both sources say "Weren't")
// Open: who says "I like that" at 84.9 s (and "Thanks" at 86 s) isn't settled by the words, so i1 now asks how the
//   advice is received, not by whom.
import type { Clip } from '../types.ts';

export const killerTuna: Clip = {
  id: 'killertuna', video: 'c4eo9ke-vY4',
  title: 'Sam & Cat Crossover w/ iCarly + Victorious 🐟 in 5 Minutes! #TheKillerTunaJump',
  dur: 303, wpm: 145, band: 'slow', tags: ['友だち'],
  show: 'iCarly',
  credit: 'iCarly (NickRewind, official YouTube channel)',
  questions: [
    // R fix: blind 60 %, the two distractors were flat; now a pick-a-side fall-out and a skipped get-together, both
    //   built from words in the scene
    // why: fall out ← "fighting" is the first word heard, and it's the expected script for two angry people; skip it
    //   ← "your little get-together" is said, so a party nobody came to seems likely
    { id: 'g2', skill: 'gist', level: 'B2', point: 'leftout', seg: [0, 86.4],
      stem: 'In the opening scenes, what goes wrong between the friends?',
      choices: ['Two of them hit it off and leave the third out', 'Two of them fall out, and the third must pick a side',
                'One throws a get-together and the others skip it'], a: 0,
      cue: '誘われなかった、と言う人の言葉に注目。',
      said: 'けんかすると思われた2人が意気投合し、もう1人は集まりにも映画にも誘われなくなる。',
      mean: '問題はけんかではなく、仲間外れ。あとの「Jade を取られた」につながる。',
      trap: '最初に fighting が聞こえるので「けんか」に引かれるが、2人は仲良し。',
      use: 'I feel a little left out.（ちょっと仲間外れな気分）' },

    // why: a boy ← Robbie and "my ex-boyfriend" come up in the middle, a familiar teen-show plot; stop the stunt ←
    //   "You are not going to jump the tuna" sounds like the friends will prevent it
    { id: 'g1', skill: 'gist', level: 'B2', point: 'story', reveals: ['care'], seg: [0, 301.5],
      stem: 'What is the whole story mostly about?',
      choices: ['Jealousy between two friends, and how they make up', 'A fight over a boy, and who ends up with him',
                'A dangerous stunt, and how the friends stop it'], a: 0,
      cue: '始まりの不満と、最後の短いやりとり。',
      said: '友だちを取られたと感じた子が仕返しをするが、最後は相手を守るために危険なことをする。',
      mean: '嫉妬から始まり、「あなたを守るため」で仲直りへ向かう話。',
      trap: 'Robbie や元カレの話も出るが、きっかけは「友だちを取られた」こと。',
      use: 'Are we good now?（もう仲直りできた？）' },

    // why: moved in ← said right after, as if it were the reason; same friend ← the later "stole Jade" plot read back
    { id: 'd1', skill: 'detail', level: 'B1', point: 'misfits', seg: [0, 9.4],
      stem: 'Why did the first speaker expect the two girls to be fighting?',
      choices: ['They’re both unfriendly people, full of anger', 'One of them had moved in without asking',
                'They both wanted the same friend to themselves'], a: 0,
      cue: '「Well」のあと、2人をまとめて説明する部分。',
      line: 'Well, you’re both *antisocial misfits filled with anger and rage*.',
      said: '「2人とも人づきあいが苦手なはみ出し者で、怒りでいっぱいだから」と答える。',
      mean: 'antisocial ＝ 人と関わりたがらない。似た者同士だから衝突すると思っていた。',
      trap: 'moved in はこのあとの話。理由は Well のあとに来る。',
      use: 'We’re both night owls.（私たち2人とも夜型なの）' },

    // R fix: blind 65 %, "nothing in common" was the only odd one out; now a keep-the-peace reading
    // why: keep the peace ← they were expected to fight, so the agreeing sounds forced; kindness ← "I hate them more"
    //   heard as a contest to be nice, the polite Japanese 謙遜 frame turned around
    { id: 'h1', skill: 'humor', level: 'C1', point: 'common', seg: [24.3, 35.1],
      stem: 'Why do the two girls’ “things in common” get a laugh?',
      choices: ['They bond happily over mean, dark things', 'They agree on things only to avoid a fight',
                'They each try to sound kinder than the other'], a: 0,
      cue: '「we both」のあとに来る2つと、最後の張り合い。',
      line: 'we both *laugh when children cry*. — How can you not? … we both *hate people*. — I *hate them more*.',
      said: '「2人とも子どもが泣くと笑う」「人が嫌い」「私の方がもっと嫌い」と楽しそうに話す。',
      mean: 'ふつう隠す性格の悪さで意気投合し、張り合う。そのズレが笑い。',
      trap: 'ふりに見えても、How can you not? と即答している。more は意地悪さの張り合い。',
      use: 'Turns out we both hate mornings.（2人とも朝が苦手だと分かった）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'aboutto', seg: [44.4, 47.6],
      stem: 'Type the reply: “No, we ___ text you.” (4 words)', answer: 'were just about to',
      cue: '「No, we」のあと、text の前。すぐあとで一部がくり返される。',
      line: 'No, we *were just about to* text you. — Just about.',
      said: '「ううん、ちょうど今メールしようとしてたとこ」と言い訳する。',
      mean: 'be just about to ＝ ちょうど〜するところ。were は弱く「ワ」程度。',
      trap: 'were が弱く、about to は「アバウタ」とつながる。返事のくり返しも手がかり。',
      use: 'I was just about to call you.（ちょうど電話しようとしてたの）' },

    // why: asleep ← "last night" is said, so a late-night excuse fits; two tickets ← the usual "we couldn't get you a
    //   seat" excuse script
    { id: 'd3', skill: 'detail', level: 'B1', point: 'horror', seg: [48.8, 57.9],
      stem: 'Why wasn’t she invited to the movies, by their account?',
      choices: ['It was a horror movie, which she hates', 'It was late, and she was already asleep',
                'There were only two tickets left for it'], a: 0,
      cue: '「last night, either」のあと、2人の説明。',
      line: 'It was a *horror movie*. You *hate horror movies*.',
      said: '「ホラー映画だったし、あなたはホラーが嫌いでしょ」と説明する。',
      mean: '誘わなかった理由を、相手の好みのせいにしている。',
      trap: 'last night が聞こえると時間の話に引かれやすい。理由は次の文に来る。',
      use: 'It was scary, and you hate scary stuff.（怖いやつだったし、苦手でしょ）' },

    // why: agrees ← "So" read as だから, a reply that accepts the reason; what happened ← "So?" read as それで？, asking
    //   for the story
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'so', reveals: ['horror'], seg: [53.5, 57.9],
      stem: 'How does she answer their excuse about the movie?',
      choices: ['She says that’s no reason to leave her out', 'She agrees she wouldn’t have wanted to go',
                'She asks them what happened in the movie'], a: 0,
      cue: '説明のあとの、とても短い一語の返事。',
      line: 'You hate horror movies. — *So?*',
      said: '「ホラー嫌いでしょ」と言われ、ひと言「だから？」と返す。',
      mean: 'So? ＝「それが何？」。理由として認めない、という反発。',
      trap: '日本語の「だから」「それで」と取ると、納得や続きの催促に聞こえる。上げ調子の一語は反発が多い。',
      use: 'So? I still want to come.（だから何？それでも行きたい）' },

    // R fix: blind 55 %, "Oh, come on." in the stem made the negative obvious; cut it (the cue still points there)
    // why: would ← the n't is nearly silent, and "Well, I would" right after makes "would" feel already heard;
    //   couldn't ← same ending, different first sound; won't ← both are short negatives before "say"
    { id: 's1', skill: 'sound', level: 'B2', point: 'wouldsay', seg: [61.4, 65.5],
      stem: 'Fill the gap: “I ___ say she stole Jade.”',
      choices: ['wouldn’t', 'would', 'couldn’t', 'won’t'], a: 0,
      cue: '「come on」のあと。すぐあとの返事と比べて。',
      line: 'Oh, come on. I *wouldn’t* say she stole Jade. — Well, I would.',
      said: '「まあまあ、盗んだとまでは言わないよ」に、別の人が「私なら言う」と返す。',
      mean: 'wouldn’t の t はほぼ消え「ウドゥン」に近い。返事の would が裏づけ。',
      trap: 'n’t は小さな「ン」だけ残る。直後に肯定の返事が来たら、前は否定。',
      use: 'I wouldn’t call it a disaster.（大失敗とまでは言わないよ）' },

    // R fix: blind 50 %, and the key rested on who says "I like that", which the words don't settle; the stem now
    //   asks how the advice is received, and “where I come from” (said twice in the clip) is no longer the pointer
    // why: laughed off ← "Oh, great" just before is sarcastic, so a mocking reply fits; unfair ← "actually" heard as
    //   the start of a correction, as in "Actually, no…"
    { id: 'i1', skill: 'infer', level: 'B2', point: 'rule', reveals: ['bug'], seg: [74.9, 86.4],
      stem: 'How is the advice about stealing one of their friends received?',
      choices: ['With approval, after a short pause', 'With a laugh, as a silly joke',
                'With a warning that it’s unfair'], a: 0,
      cue: 'アドバイスのあと、少し間をおいた短い返事。',
      line: 'if someone steals one of your friends, *you steal one of theirs*. … *I like that*.',
      said: '「相手の友だちを取れ」という助言に、少し間をおいて「それ、いいね」と返る。',
      mean: '次の場面の伏線。Sam の友だち Freddie を呼ぶ計画につながる。',
      trap: 'actually は反論の前置きにもなるが、ここは「意外と」。最後まで聞く。',
      use: 'Actually, I like that idea.（意外といいね、その案）' },

    // R fix: blind 60 %, only the key named a reason to rush over; now all three are "he was told…" news about Sam
    // why: police ← "Is Sam okay?" fits any bad news; missing ← "Sam, where are you?" comes right after, as if she
    //   had vanished
    { id: 'i3', skill: 'infer', level: 'C1', point: 'lured', seg: [94.7, 106.0],
      stem: 'Why does Freddie arrive so worried about Sam?',
      choices: ['He was told she was hurt, and came to check', 'He was told she was in trouble with the police',
                'He was told she had gone missing in LA'], a: 0,
      cue: '最初の2つの質問と、そのあとの答え。',
      line: 'Is Sam okay? *Is she in the hospital?* … Oh, *Sam’s not here*.',
      said: '「Sam は無事？入院してるの？」と聞くが、「中にいる」のあと「いない」と言われる。',
      mean: '入院を心配するのは、そう聞かされたから。だまして呼ばれた。',
      trap: 'where are you? より先に hospital と聞いている。最初の質問が理由を示す。',
      use: 'Is everyone okay? I got your message.（みんな無事？連絡見たよ）' },

    // anchor: 96.6 s "Is she in the hospital?" → 97.5 s "No, she's just in here" → 104.1 s "Sam's not here" → 107.2 s
    //   "didn't you just say she was…" → 110.5 s the compliment; then 134–137.8 s Sam: "she called my friend Freddie and
    //   made him come to LA just to bug me"
    // why: hiding ← "she's just in here" taken at face value, then "not here" as a cover; crush ← the sincerity flip:
    //   "handsome boy" taken as real interest in him
    { id: 'nt2', skill: 'attitude', level: 'C2', point: 'lured', reveals: ['handsome'], seg: [94.7, 113.5],
      stem: 'When she calls Freddie a handsome boy, what is she trying not to say?',
      choices: ['That the story about Sam was a trick to bring him', 'That Sam is hiding from him somewhere inside',
                'That she is quite taken with him herself'], a: 0,
      cue: '「中にいる」と「いない」の食い違いのすぐあと。',
      line: 'But didn’t you just say she was… — Well, *aren’t you a handsome boy full of questions?*',
      said: '「中にいる」「いない」と話が食い違い、それを突かれると「質問の多いハンサムな子ね」と返す。',
      mean: 'ほめ言葉で質問をそらし、呼び出しの話が作りごとだと隠す。後で Sam が「彼を呼んだ」と言い当てる。',
      trap: 'handsome をそのまま好意と取りやすい。答えずにほめたら、そらしたい中身がある。',
      use: 'Aren’t you full of questions today!（今日は質問が多いね！）' },

    // R fix: blind 65 %, only the key described a sensible reply; now an excuse and a confession compete
    // why: stepped out ← "Sam's not here" after "she's just in here" sounds like she has just left; admits ← the
    //   sitcom script where the liar gives up once caught
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'handsome', seg: [106.6, 113.5],
      stem: 'When Freddie starts “But didn’t you just say…”, how does she reply?',
      choices: ['She changes the subject with a compliment', 'She explains that Sam just stepped out',
                'She admits she made the story up'], a: 0,
      cue: '彼の質問に、答えているかどうか。',
      line: 'Well, *aren’t you a handsome boy full of questions?*',
      said: '矛盾を突かれて、「質問の多いハンサムな子ね」とだけ言う。',
      mean: '疑問文の形のほめ言葉で、答えずに話をそらしている。',
      trap: '矛盾を突かれたら言い訳か白状が来ると思いやすい。答えずにほめたら、はぐらかし。',
      use: 'Aren’t you curious today!（今日は知りたがりだね！）' },

    // why: cheer up ← "my friend Freddie" sounds like a kind surprise; show him around ← "a tour of… Los Angeles" was
    //   just said
    { id: 'd4', skill: 'detail', level: 'B1', point: 'bug', reveals: ['lured'], seg: [132.1, 138.4],
      stem: 'Why does Sam say Freddie was brought to LA?',
      choices: ['To annoy her, out of jealousy', 'To cheer her up, since she missed him',
                'To show him around, as a favor'], a: 0,
      cue: '「jealous」のあと、文の最後の2語。',
      line: '*She’s jealous*… so she called my friend Freddie and made him come to LA *just to bug me*.',
      said: '「嫉妬して、私を困らせるためだけに Freddie を呼んだ」と言う。',
      mean: 'bug ＝ 虫ではなく「いらいらさせる」。just to ～ ＝ 〜するためだけに。',
      trap: 'tour の直後なので「案内」に引かれやすい。理由は jealous と bug。',
      use: 'Stop bugging me. I’m working.（邪魔しないで。仕事中なの）' },

    // R fix: blind 75 %, "a dark, dark place" in the stem pointed straight at revenge; the stem no longer quotes it,
    //   and the distractors now come from “don't get mad” and even = 公平
    // why: hide it ← "We don't get mad" taken alone, as "we keep our anger in"; fair ← even = 対等・公平, read as
    //   "settle it fairly"
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'even', seg: [138.4, 147.4],
      stem: 'When the speaker describes where she comes from, what do people there do?',
      choices: ['They pay people back for what they did', 'They hide their anger and stay polite',
                'They talk it out until things are fair'], a: 0,
      cue: '「We don’t get mad」と対になる最後の文。',
      line: 'We don’t get mad at people. *We get even.*',
      said: '「私の出身地は暗い所で、人に怒ったりしない。仕返しする」と言う。',
      mean: 'get even ＝ やり返して貸し借りをなくす。怒るより怖い、という宣言。',
      trap: 'mad だけだと「我慢」、even を「公平」と取ると「話し合い」。get mad と対で考える。',
      use: 'Don’t get mad, get even.（怒るより、やり返せ）' },

    // why: promise ← "You promised me you wouldn't" is said just before, by Cat about Sam; secrets ← "my ex-boyfriend"
    //   heard with no verb caught
    { id: 'd8', skill: 'detail', level: 'B1', point: 'flirt', seg: [172.6, 180.0],
      stem: 'What does Sam accuse Cat of?',
      choices: ['Flirting with her ex in front of her', 'Breaking a promise she made to her',
                'Telling her ex secrets about her'], a: 0,
      cue: '「what do you care?」のあと、if で始まる部分。',
      line: 'You can’t like me very much if you’re going to *flirt with my ex-boyfriend right in front of my face*.',
      said: '「元カレの前でいちゃつくなんて、私のこと大して好きじゃないんでしょ」と言う。',
      mean: 'in front of my face ＝ 私の目の前で。わざとらしさへの怒り。',
      trap: 'promised は直前の Cat の言葉。責めている中身は if のあとにある。',
      use: 'Right in front of me? Seriously?（私の目の前で？本気？）' },

    // R fix: blind 60 %, the apology and the song were weak; now a denial and an excuse, the usual replies to a charge
    // why: denies ← "Well, well…" heard as the hesitant start of an excuse; just friendly ← the usual "I was only
    //   being nice" reply to a flirting charge
    { id: 'p3', skill: 'pragma', level: 'B2', point: 'flirtback', reveals: ['flirt'], seg: [174.9, 183.7],
      stem: 'What is Cat doing with her answer to Sam’s accusation?',
      choices: ['Turning the same charge back on Sam', 'Denying that she flirted with Freddie',
                'Saying she was only being friendly'], a: 0,
      cue: '2人の文の終わり方を比べて。',
      line: '*Well, you flirted with Robbie right in front of my face!*',
      said: '「そっちこそ、私の目の前で Robbie といちゃついてた！」と言い返す。',
      mean: '相手の言葉をそのまま使って、同じ非難を返している。',
      trap: 'Well, well と言いよどむので言い訳の前置きに聞こえるが、続くのは you で始まる反撃。',
      use: 'Well, you did it first!（そっちが先にやったでしょ！）' },

    // R fix: blind 55 %, "only joking" was weak; now a dare reading, built from “Jump your stupid motorcycle…”
    // why: dare ← "Jump your stupid motorcycle over the tuna fish!" just before sounds like goading; too angry ← the
    //   shouted line taken at face value, with nothing after it
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'care', seg: [206.6, 215.75],
      stem: 'When Cat shouts that she doesn’t care what happens, does she mean it?',
      choices: ['No; soon she says she won’t let Sam get hurt', 'No; she says it to dare Sam into the jump',
                'Yes; she is far too angry with Sam to care now'], a: 0,
      cue: 'そのあと Cat が理由として言う文。',
      line: 'I *don’t care* what happens to you! … I’m *not going to let you* do something stupid and *get hurt*!',
      said: '「どうなってもいい！」と叫んだあとで、「ばかなことをしてけがするのは許さない」と言う。',
      mean: '怒りで口にしただけで本心ではない。すぐあとの言葉が本音。',
      trap: '直前の「跳べば」は挑発に聞こえるが、すぐ「跳ばせない」と言う。後の言葉と合わない叫びは本心でない。',
      use: 'I didn’t mean it. I was just upset.（本気じゃなかった。腹が立ってただけ）' },

    // R fix: blind 70 %, the yes/no stem led to "No", and only the key had content; the stem is open now, and the
    //   choices are parallel "doing" readings, each with a manner
    // why: pardon ← "I'm sorry?" with a rise means "say again?" (sorry = pardon); apology ← the sorry taken as a real
    //   apology for the scare, the Japanese すみません reflex
    { id: 'a4', skill: 'attitude', level: 'C1', point: 'sorry', reveals: ['werent', 'care'], seg: [209.5, 218.9],
      stem: 'What is Sam doing when she answers “Oh, I’m sorry…”?',
      choices: ['Reminding Cat, mockingly, of what she said', 'Apologizing, a little shaken, for the scare',
                'Asking Cat, puzzled, to say it again'], a: 0,
      cue: 'sorry のすぐあとの「Weren’t you the one」。',
      line: 'Oh, *I’m sorry*. *Weren’t you the one who said*, “I don’t care what happens to you”?',
      said: '「あら、ごめん。『どうなってもいい』って言ったのはあなたじゃなかった？」と返す。',
      mean: '謝罪ではなく皮肉の前置き。相手の矛盾を突くための sorry。',
      trap: 'sorry ＝ 謝る、と取りやすい。すぐ後に相手の言葉を引用したら、皮肉の合図。',
      use: 'Sorry, weren’t you the one who was late?（あれ、遅刻したのはそっちじゃ？）' },

    // R fix: blind 50 %; "Wasn't it" didn't fit "the one who said" and nobody would pick it (K4), so it's cut
    // why: Aren't ← were/are blur when weak; Were you ← the n't drops out entirely
    { id: 's2', skill: 'sound', level: 'B2', point: 'werent', seg: [215.72, 218.9],
      stem: 'Fill the gap: “Oh, I’m sorry. ___ the one who said…”',
      choices: ['Weren’t you', 'Aren’t you', 'Were you'], a: 0,
      cue: '「sorry」のすぐあと、文頭の2語。',
      line: 'Oh, I’m sorry. *Weren’t you* the one who said…',
      said: '「あら、それ言ったのはあなたじゃなかった？」と問い返す。',
      mean: 'Weren’t you は「ワーンチュ」のようにつながる。過去に言ったことを指すので過去形。',
      trap: 'n’t の t が消えると Were you に聞こえる。残る「ン」の音で否定を聞き取る。',
      use: 'Weren’t you the one who picked this place?（ここ選んだの、君じゃなかった？）' },

    // why: hurt ← "I lied" heard as a confession that wounds Cat; never kissed ← "lied about" heard as covering the
    //   whole kiss, not just the "tasty"
    { id: 'h3', skill: 'humor', level: 'C1', point: 'tasty', seg: [225.4, 231.5],
      stem: 'Why does the exchange about Robbie being “tasty” get a laugh?',
      choices: ['Cat agrees, from her own kisses, he isn’t tasty', 'Cat is hurt to learn that Sam lied to her',
                'Sam admits she never really kissed Robbie'], a: 0,
      cue: '「I lied」への返事の、後半の部分。',
      line: 'I *lied about the tasty*. — *I know, I’ve kissed him.*',
      said: '「おいしいは嘘」に、Cat が「知ってる、私もキスしたもん」と返す。',
      mean: '怒っているはずの Cat が Sam に同意してしまう。そのズレが笑い。',
      trap: 'lied を「キス自体が嘘」と広く取りやすい。about the tasty で範囲が決まる。',
      use: 'I know, I’ve tried it.（知ってる、試したことあるもん）' },

    // why: dared ← "go back" heard as backing down, and the stunt sounds like a dare; take back ← word = 言葉, "go back
    //   on her word" read as "take back what she said"
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'word', seg: [232.3, 239.6],
      stem: 'What does Sam say about herself before insisting somebody has to jump?',
      choices: ['She never breaks a promise she has made', 'She never backs down once she is dared',
                'She never takes back a rude thing she said'], a: 0,
      cue: '自分をフルネームで呼ぶ部分。',
      line: 'I promised Dice, and Sam Puckett *does not go back on her word*.',
      said: '「約束したし、サム・パケットは約束を破らない」と言う。',
      mean: 'go back on one’s word ＝ 約束を破る。フルネームで意地を見せる。',
      trap: 'word を「言葉」とだけ取ると「発言の撤回」に聞こえる。直前の promised と結ぶ。',
      use: 'I never go back on my word.（約束は絶対に守る）' },

    // R fix: blind 55 %, after "Somebody has to jump" only the key answered it; now a dare ("Fine, then jump!") and a
    //   walk-out compete, both standard uses of "Fine!"
    // why: dare ← "Fine!" as in "Fine, go ahead then"; walk out ← "Fine!" usually closes an argument (もういい)
    { id: 'r1', skill: 'predict', level: 'B2', point: 'fine', seg: [232.3, 242.6], then: [242.6, 249.5],
      stem: 'After “Somebody has to jump…”, Cat says “Fine!”. What kind of move follows?',
      choices: ['An offer to do the jump herself', 'A dare for Sam to go ahead and jump',
                'A refusal to stay and watch it'], a: 0,
      cue: '「Somebody」という言い方が、何を求めているか。',
      line: 'Somebody has to jump over those tuna… — Fine! *I’ll jump the tuna!*',
      said: '「誰かが跳ばなきゃ」に、Cat が「いいわ！私が跳ぶ！」と言う。',
      mean: 'somebody has to ～ ＝ 誰かがやるしかない。Fine! はその引き受け。',

      trap: 'Fine! は「勝手にすれば」にもなる。前の文が人を求めていたら名乗り出かも。',
      use: 'Fine, I’ll do it.（分かった、私がやる）' },

    // R fix: blind 60 %, "pay back" was weak; now a pride reading (the fight is still on) and a "safe" reading
    // why: lose to Sam ← they have just been fighting, so the jump looks like winning; won't get hurt ← "that's the
    //   price" heard as "it's worth it, nothing bad will happen"
    { id: 'i6', skill: 'infer', level: 'C1', point: 'price', seg: [249.2, 256.3],
      stem: 'When warned she’ll get hurt, what does Cat’s reply show?',
      choices: ['She still thinks of Sam as a friend', 'She would rather get hurt than lose to Sam',
                'She believes she won’t really get hurt'], a: 0,
      cue: '「saving」のあと、誰を助けると言っているか。',
      line: 'that’s the price I’ll have to pay for *saving a friend* from doing something stupid!',
      said: '「けがしても、友だちをばかなことから救う代わりなら仕方ない」と言う。',
      mean: 'けんか中の Sam を、まだ「友だち」と呼んでいる。仲直りの気持ちが表れている。',
      trap: 'けんかの勝ち負けに見えるが、言うのは saving a friend。price ＝ 代償。',

      use: 'That’s the price of being a good friend.（いい友だちでいる代償だね）' },

    // R fix: the key's "doing" was the only choice word in the cue (cue leak); reworded to "does"
    // anchor: 256.6 s "But you're doing something stupid!" → 260.3 s "Wouldn't be the first time!": the missing subject
    //   is her own doing something stupid, the very words Sam just said about her
    // why: Sam ← right mechanism, wrong target: "saving a friend from doing something stupid" makes Sam the one who acts
    //   stupid; both ← scope shift: the whole fight read as the "stupid" thing
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'price', reveals: ['wouldsay'], seg: [249.2, 262.0],
      stem: 'Who is the joke on in Cat’s last reply here?',
      choices: ['Cat herself, who often does stupid things', 'Sam, whom she keeps saving from stupid things',
                'Both of them, for fighting over a friend'], a: 0,
      cue: '直前の「you’re doing something stupid」への返事。',
      line: 'But *you’re doing something stupid*! — *Wouldn’t be the first time!*',
      said: '「あなたこそばかなことしてる！」と言われ、「初めてじゃないし！」と返す。',
      mean: '主語が省かれているが、「私がばかなことをするのは」の意味。言われた言葉をそのまま認め、自分を笑いの的にしている。',
      trap: '直前の「友だちを救う」から Sam の話と聞きやすい。省かれた主語は、相手の言葉の中身で決まる。',
      use: 'Wouldn’t be the first time I got lost.（道に迷うのは初めてじゃない）' },
  ]
};
