// “Ron Interferes with Tom's Love Life | Parks and Recreation” (the official Parks and Recreation channel, Season 7): at
// Donna's wedding Tom tells Ron he'd marry Lucy tomorrow, Ron repeats it to her, and his "fix" makes it bigger until
// Tom has to say how he feels.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 221 s. Untested on purpose: 0–12 s and
// 56.9–65 s (who hands out the hand cream, who says "Damn, Tommy, well done" and "Tommy's the man"), 91.4 s (captions
// "strict life coats", whisper "codes"; x1's line stops before it), 100 s ("Tommy's Bahama" leans on a brand name),
// 85.4 s ("the small hamburgers" rests on what Ron sees). Ron is named at 63.5 s and 189.9 s; "son" (36.9 s, 85.8 s)
// marks his turns to Tom; Lucy is named at 116.4 s.
// REVIEW 2026-11-16: pass 9, fix 15, drop 0, new 0; ear checks 0
//   Open: d4 stays about 50 % blind (the break-up reason is the usual one in a romance); its distractors are sound
//   traps. The authored ear check (215.4 s, Lucy's "free dresses" line) went: the turn-taking settles it ("I know you
//   just got out of a relationship" → "I'm only dating you for the free dresses"; only Lucy gets the dresses).
import type { Clip } from '../types.ts';

export const ronTomLucy: Clip = {
  id: 'rontomlucy', video: 'LEVt2ZydByI', title: 'Ron Interferes with Tom\'s Love Life', dur: 241, wpm: 159,
  band: 'mid', tags: ['恋愛', '友だち'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // why: hand cream ← the clip's first gift talk (Lucy's own purchase, before this segment); a part in the wedding ←
    //   "Donna's butler of honor" heard as Lucy's role, not Tom's
    { id: 'd1', skill: 'detail', level: 'B1', point: 'dress', seg: [15.9, 26.1],
      stem: 'What surprise has Tom got for Lucy for tonight?',
      choices: ['A dress that matches his outfit', 'A hand cream from the nail salon', 'A part in Donna’s wedding party'],
      a: 0,
      cue: '「As a surprise」のあと。',
      line: 'As a surprise, I got a *matching dress* for Lucy.',
      said: 'ドナの結婚式で付き添い役を務めるトムは、ルーシーにも自分とおそろいのドレスを用意した。',
      mean: 'matching ＝ おそろいの。同じ柄のドレスをサプライズで贈る。',
      trap: 'butler of honor はトム自身の役目。誰の話か、主語を追って聞く。',
      use: 'We got matching T-shirts.（おそろいのTシャツを買ったんだ）' },

    // why: ninety ← a careful answer heard into "a hundred"; a hundred and ten ← the hype script ("110 percent") that
    //   fits Tom's excitement
    { id: 'n1', skill: 'number', level: 'B1', point: 'sure', seg: [25.7, 32.6], keep: true,
      stem: 'How sure is Tom that Lucy will be happy with the gift?',
      choices: ['Ninety percent', 'A hundred percent', 'A hundred and ten percent'], a: 1,
      cue: '「happy with this gift?」のあとの答え。',
      line: 'do you believe Lucy will be happy with this gift? — *A hundred percent*.',
      said: '「喜ぶと思うか」に、「100パーセント。息ぴったりだから」と答える。',
      mean: 'A hundred percent ＝ 絶対に。迷いがないことを数字で言う。',
      trap: '110パーセントと言う人もいるが、ここは100。数字のあとに and が続くかを聞く。',
      use: 'Are you sure? — A hundred percent.（確か？ー絶対）' },

    // R fix: V2. "I’m marrying" left the idiom "I’d marry" as the only natural choice; "I want to marry" is Tom's own
    //   later wording (83.3 s), so a blind read can't lean on the idiom.
    // why: I'll ← 'd and 'll both shrink to a short, dark sound after "I"; I want to ← Tom's own retelling at 83.3 s
    //   ("You told Lucy I want to marry her?"), the same meaning in plainer words
    { id: 's1', skill: 'sound', level: 'B2', point: 'marry', seg: [32.4, 37.5],
      stem: 'Fill the gap: “___ her tomorrow.”',
      choices: ['I’d marry', 'I’ll marry', 'I want to marry'], a: 0,
      cue: '「forever」の文のすぐあと、文頭の短い音。',
      line: 'I’m with the person I’m going to be with forever. *I’d marry* her tomorrow.',
      said: '「ずっと一緒にいる相手だと思える。明日にでも結婚したい」と言う。',
      mean: 'I’d ＝ I would。「明日でもいいくらい」という気持ちで、予定ではない。',
      trap: 'I’ll なら「明日結婚する」予定になる。I のあとの短い音が d か ll か、意味ごと聞く。',
      use: 'I’d move there tomorrow.（明日にでも引っ越したいくらい）' },

    // R fix: K1. "Bully for you" is often sarcastic, so "scornful, but hiding it" was defensible. The key is hedged to
    //   "pleased enough", and "shocked, trying to talk him out of it" (refuted: no objection, just food) replaces it.
    // why: shocked ← "bully" heard as いじめっ子 plus "I'd marry her tomorrow", read as alarm; worried but silent ← the usual friend
    //   script after "I'd marry her tomorrow" ("slow down"), held back as 遠慮
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'food', seg: [34.7, 43.3],
      stem: 'How does Ron take Tom’s news about his feelings for Lucy?',
      choices: ['Pleased enough, but keener on the food', 'Shocked, and trying to talk him out of it',
                'Worried for him, but unwilling to say so'], a: 0,
      cue: '「son」のあと、話題がどこへ行くか。',
      line: '*Bully for you*, son. *More importantly*, do you have tri-tip for tonight?',
      said: '「よかったな」と流し、「それより今夜トライチップ（牛肉）は？」と聞く。',
      mean: 'Bully for you ＝ よかったね（古風）。肉の話が大事。',
      trap: 'bully を「いじめっ子」と取ると冷たく聞こえる。関心は More importantly のあと。',
      use: 'Good for you. Anyway, where’s the food?（よかったね。で、食べ物はどこ？）' },

    // why: faith ← "organized religion" is said, so churches read as about faith; food ← "good food" opens the list,
    //   and the speaker keeps chasing food all clip
    { id: 'h1', skill: 'humor', level: 'C1', point: 'church', seg: [44.6, 56.3],
      stem: 'In the comment to the camera, why are churches top of the list?',
      choices: ['For how well the buildings are made', 'For the faith that is practiced there',
                'For the food that is served after them'], a: 0,
      cue: '「Say what you will」のあとの文。',
      line: 'Say what you will about organized religion… knew how to *construct an edifice*.',
      said: '結婚式で一番好きなのは教会。「宗教はともかく、建物は見事」と言う。',
      mean: '宗教でなく建築として教会をほめる意外さが笑い。edifice ＝ 建物。',
      trap: 'religion や food も聞こえるが、ほめているのは construct（建てる）の部分。',
      use: 'Say what you will, it’s a great car.（何と言われようと、いい車だよ）' },

    // R fix: V2. The title ("Ron Interferes…") made "told Lucy what Tom said" the only interfering choice. Both
    //   distractors now interfere too.
    // why: lied about a gift ← "sounds like lying" is said in the scene, plus the dress gift; not serious ← "walk back"
    //   heard as Ron undercutting Tom (he said the opposite: "quite taken with you")
    { id: 'g1', skill: 'gist', level: 'B1', point: 'leak', reveals: ['walkback'], seg: [62.4, 115.4],
      stem: 'Why does Tom end up needing Ron to fix things with Lucy?',
      choices: ['Ron passed on to Lucy something Tom said to him', 'Ron warned Lucy that Tom wasn’t serious about her',
                'Ron told Lucy that Tom had lied to her about a gift'], a: 0,
      cue: '「You told Lucy」で始まるトムの質問。',
      line: 'You *told Lucy* I want to marry her?',
      said: 'トムが二人だけの話で言った「結婚したい」を、ロンがルーシーに伝えてしまった。',
      mean: '本人のいない所での本音が相手に届き、トムは後始末をロンにさせようとする。',
      trap: 'lying という語は出るが、うその話ではない。本当のことを言ってしまったのが問題。',
      use: 'That was just between us!（それ、ここだけの話だったのに！）' },

    // why: won't give an opinion ← the Japanese frame: "I normally don't get involved" heard as 遠慮, a polite refusal;
    //   Lucy should stay out ← "personal affairs" heard as aimed at her, not at Ron himself
    // R fix: V2. "Apologizes for missing part of the wedding" was a filler; the new distractor is a keyword trap.
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'preface', seg: [64.6, 74.6],
      stem: 'What does Ron’s line about not getting involved do here?',
      choices: ['It warns that he’s about to share something private', 'It explains why he won’t give an opinion on Tom',
                'It tells Lucy to stay out of Tom’s private life'], a: 0,
      cue: 'but のあと、何が始まるか。',
      line: 'I normally don’t get involved in people’s personal affairs, *but* something about a wedding, *I’ll just say it*.',
      said: '「普段は人の私生活に口を出さないが、結婚式だからな、言おう」と前置きする。',
      mean: '「普段はしないが」は、立ち入ったことを言う合図。but のあとが本題。',
      trap: '日本語の「口は出さないけど」は遠慮で終わることもあるが、英語は but のあとで言う。',
      use: 'I don’t usually say this, but…（普段は言わないんだけど…）' },

    // why: seeing someone ← "taken" alone = 恋人がいる ("Are you taken?"); surprised ← "taken aback" (驚く) heard in
    //   "taken with"; fooled ← "taken in" (だまされる), one small word away
    // R fix: V2. With three choices the only warm one was the key; a fourth "taken" phrase (taken in) joins.
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'taken', seg: [71.5, 79.6],
      stem: 'What does Ron tell Lucy about Tom, in plain words?',
      choices: ['He likes her very much', 'He is already seeing someone', 'He was surprised by her',
                'He has been fooled by her'], a: 0,
      cue: '「taken」のあとの短い語に注目。',
      line: 'Tom is *quite taken with you*.',
      said: '「トムは君にかなり夢中だ」とルーシーに言う。',
      mean: 'be taken with ～ ＝ ～に心をひかれている。with のあとが好きな相手。',
      trap: 'taken だけなら「相手がいる」、taken aback なら「驚く」。後ろの with まで聞く。',
      use: 'She was really taken with the city.（彼女はその街がすっかり気に入った）' },

    // R fix: V2. "Say it again slowly" was a filler; "back up his words" (the opposite, with "back") replaces it.
    // why: walk Lucy back ← walk back = 歩いて戻る, the literal reading at a party; back up ← "back" + "what you
    //   said" heard as support for the words, the opposite of taking them back
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'walkback', reveals: ['liar', 'leak'], seg: [82.7, 91.0],
      stem: 'What does Tom ask Ron to do after finding out?',
      choices: ['Take back his words to Lucy', 'Walk Lucy back to the party', 'Back up his words to Lucy'], a: 0,
      cue: '「you have to」のあと。',
      line: 'you have to *walk back* what you said. — Walk back sounds like lying.',
      said: '「取り消せ」と頼まれ、ロンは「取り消すのは、うそみたいだ」と渋る。',
      mean: 'walk back ＝ 発言を撤回する。失言のニュースでよく聞く。',
      trap: '「歩いて戻る」と取りやすいが、walk back のあとに what you said（言葉）が来ている。',
      use: 'I need to walk that back a little.（さっきの話、少し訂正させて）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'helpout', seg: [91.0, 94.2],
      stem: 'Type the end of Tom’s request: “…for a second and ___?” (3 words)', answer: 'help me out',
      cue: '「for a second and」のあと。',
      line: '…for a second and *help me out*?',
      said: '「ちょっとだけルールを曲げて、助けてくれ」と頼む。',
      mean: 'help me out ＝ 手を貸して。help me より気軽で、困った時によく使う。',
      trap: '「ヘルプミアウ」とつながり、out の t はほぼ消える。最後の語を落とさない。',
      use: 'Could you help me out with this bag?（このかばん、ちょっと手伝ってくれる？）' },

    // R fix: V2. The key was the only nuanced "means it, but"; "meant it then, but not anymore" is nuanced too.
    // why: not anymore ← he wants it walked back, so it sounds as if he took it back; start right now ← "tomorrow"
    //   and "spending a life together" heard as a plan
    { id: 'i1', skill: 'infer', level: 'B2', point: 'future', reveals: ['marry'], seg: [93.9, 105.0],
      stem: 'When Tom explains, how did he mean “I’d marry her tomorrow”?',
      choices: ['He means it, but for far in the future', 'He meant it then, but not anymore',
                'He means it, and wants to start right now'], a: 0,
      cue: '長い夢の話のあと、最後の一言。',
      line: 'I could see myself spending a life together with her… *That’s way in the future*, man.',
      said: '「一緒に人生を送り、子どもを持ち、島を買う」と語り、「それはずっと先の話」と言う。',
      mean: '気持ちは本物だが、明日の予定ではない。way ＝ ずっと（強め）。',
      trap: '取り消してと頼むので冗談と取りやすい。本気かどうかと、いつの話かは別。',
      use: 'That’s way down the road.（それはずっと先の話だよ）' },

    // R fix: V2 + K1. "Ignores it all except one small word" read as the punchline, and "hurt that Tom spoke rudely"
    //   was close to Ron's real reaction to "man". The key is plainer; "makes fun of the island plan" replaces "hurt".
    // why: makes fun ← "Don't call me man" heard as a put-down of the whole dream; too far off ← "way in the future"
    //   is Tom's own line, heard as Ron's objection
    { id: 'h2', skill: 'humor', level: 'B2', point: 'man', reveals: ['future'], seg: [102.9, 110.1],
      stem: 'What makes Tom say “That’s what you took away from this?”',
      choices: ['Ron answers only the last word Tom said', 'Ron makes fun of Tom’s island plan',
                'Ron says the plan is too far off'], a: 0,
      cue: 'ロンの返事が、トムの話のどこに反応しているか。',
      line: 'That’s way in the future, *man*. — *Don’t call me man*.',
      said: 'トムが話の最後に man と付けると、ロンは「man と呼ぶな」とだけ返す。',
      mean: '長い本気の話を全部聞き流し、呼び方だけに反応する。そのずれが笑い。',
      trap: '夢をばかにしたと取りやすいが、トムの不満は「そこ？」。took away ＝ 話から得たこと。',
      use: 'That’s what you got from all that?（あれだけ話して、そこ？）' },

    // R fix: V2. The key was the only choice about Ron's own honesty, and "Lucy was upset with Tom" was weak. The
    //   key is plainer, and "a lie would hurt Lucy" (also about lying) replaces it.
    // why: forgot ← he starts with the wrong thing and stops, as if he lost his script; hurt Lucy ← the "What?" right
    //   after, heard as Lucy's pain, so the retraction sounds like kindness
    { id: 'h3', skill: 'humor', level: 'C1', point: 'liar', seg: [116.1, 131.1],
      stem: 'Why does Ron take back his first words to Lucy right away?',
      choices: ['He can’t bring himself to say he lies', 'He forgot what Tom wanted him to tell her',
                'He worried a lie would hurt Lucy more'], a: 0,
      cue: '「I am not a liar」のあとに続く話。',
      line: 'I am a liar. — What? — Well, no, *I am not a liar*. I have *never lied* about anything in my life.',
      said: '「私はうそつきだ」と言いかけ、すぐ「いや、うそは一度もない。迷彩はうそかもしれんが」と直す。',
      mean: '撤回のつもりでも、うそつき扱いだけは我慢できない。正直すぎるのが笑い。',
      trap: '言うことを忘れたと取りやすいが、続くのは自分の正直さの話だけ。',
      use: 'Let me rephrase that.（言い方を変えさせて）' },

    // R fix: V2. "Plans sound bigger" against "words sound smaller" paired the key with its opposite. The new "Yes"
    //   choice is what Ron was sent to do (take it back).
    // why: takes it back ← the walk-back he was sent for, and "he likes you a great deal" sounds like a softer start;
    //   Lucy thinks he's lying ← Ron's "I am a liar" just before
    { id: 'i3', skill: 'infer', level: 'C1', point: 'island', reveals: ['leak'], seg: [132.3, 147.1],
      stem: 'Does Ron’s new version of Tom’s words help Tom?',
      choices: ['No; it adds even more to what Tom said', 'Yes; it takes back most of what Tom said',
                'No; it makes Lucy think Ron is lying'], a: 0,
      cue: 'ルーシーの返事で、何が増えたか。',
      line: 'marrying you and *living on an island with your kids*. — Wait, now we’re *on an island*? With *kids*? Plural?',
      said: '「結婚して子どもと島で暮らす想像ができるそうだ」と言い直し、ルーシーは「島？子ども？」と驚く。',
      mean: '取り消すはずが、島と子どもまで足して話が大きくなった。',
      trap: 'a great deal は穏やかだが、続きで話が広がる。結果は相手の反応で確かめる。',
      use: 'You’re making it worse.（余計にひどくしてるよ）' },

    // R fix: V2. "A fight about the island" was weak; "talked, and now feel awkward" fits "weirdos" with "not" lost.
    // why: talked but can't agree / talked and awkward ← the weak "not yet" lost, leaving "you have… talked about what
    //   happened", with "acting like weirdos" as the awkwardness
    { id: 'd3', skill: 'detail', level: 'B2', point: 'talk', reveals: ['nottalked'], seg: [152.3, 161.7],
      stem: 'Later on, what does Ron suspect about Tom and Lucy?',
      choices: ['They haven’t talked about what happened', 'They have talked, but still can’t agree',
                'They have talked, and now feel awkward'], a: 0,
      cue: '「I further suspect」のあと。',
      line: 'I further suspect you have *not yet talked about* what happened.',
      said: '「二人とも様子が変だ。さっきの件、まだ話していないだろう」と言う。',
      mean: 'have not yet talked ＝ まだ話していない。気まずくて避けている、という見立て。',
      trap: 'not yet は弱く速いので落としやすい。落とすと「話はした」と逆になる。',
      use: 'Have you talked to her yet?（もう彼女と話した？）' },

    // anchor: 164.72–166.04 s both sources have "us having not talked about": five weak words in 1.3 s, a tangle that
    //   grammar would rewrite as "that we haven't talked about"
    { id: 'nt2', skill: 'dict', level: 'C2', point: 'nottalked', reveals: ['talk'], seg: [161.6, 166.07],
      stem: 'Type the end of the flustered reply: “…what you’re talking about ___.” (5 words)',
      answer: 'us having not talked about',
      cue: '「talking about」のあと。文法より、聞こえた音を。',
      line: 'I don’t even know what you’re talking about *us having not talked about*.',
      said: '「僕らが話していないって、何のこと？」と慌てて否定する。about が2回出る。',
      mean: '動揺して文がもつれ、us having not ～ という形になった。慌てた否定ほど文は崩れる。',
      trap: '文法どおり we haven’t に直したくなるが、言っていない。書き取りは聞こえた音を書く。',
      use: 'I don’t know what you’re talking about.（何の話だか分からないな）' },

    // why: teasing ← "acting like weirdos" just before, heard as the tone of the whole visit; the food ← "missed out on
    //   the food" right after, heard as his real aim
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'team', seg: [166.05, 176.5],
      stem: 'When Ron says the two make a good team, is he sincere?',
      choices: ['Yes; he means it, plain and simple', 'Partly; he’s teasing them a bit too',
                'No; he just wants to get to the food'], a: 0,
      cue: '「I’m sorry if」の文の、理由の部分。',
      line: 'there’s no shame in declaring how you feel… I’m sorry if I caused a problem because *the two of you make a good team*.',
      said: '「問題を起こしたならすまない。二人はいいチームだから」と言う。',
      mean: 'ロンは思ったことをそのまま言う人。because 以下が、謝る理由そのもの。',
      trap: 'weirdos の直後なので、からかいに聞こえやすい。謝罪と理由が一続きなら本気。',
      use: 'You two make a great team.（二人はいいコンビだね）' },

    // why: the food ← "I missed out on the food" in the same turn, heard as where he's off to; skip ← "damned if I
    //   don't" heard as a plain negative: "I don't honor"
    { id: 'f4', skill: 'phrase', level: 'C1', point: 'damned', seg: [176.5, 188.6],
      stem: 'As he leaves, what does Ron say he is going to do?',
      choices: ['Properly honor the love being celebrated', 'Go and find the food he missed out on',
                'Skip honoring the love being celebrated'], a: 0,
      cue: '「but」のあと、否定が2つ重なる言い方。',
      line: 'I missed out on the food… but *I’ll be damned if I don’t* properly honor the expression of romantic love.',
      said: '「食事も面白い話も逃した。だが愛の表現は、きちんと祝う」と去る。',
      mean: 'I’ll be damned if I don’t ～ ＝ 絶対に～する、という決意。',
      trap: 'don’t だけ拾うと「祝わない」になる。前の damned if が全体を逆にする。',
      use: 'I’ll be damned if I miss this game.（この試合は絶対に見逃さない）' },

    // why: never means a word ← the usual excuse ("he doesn't mean it") heard in place of "exactly what he means";
    //   weird for minding his business ← "weird thing" + Ron's own "I normally don't get involved" (65.4 s)
    // R fix: V2. "Makes Lucy trust Ron more" was a filler; the new distractor also "calls Ron weird".
    { id: 'h4', skill: 'humor', level: 'C1', point: 'weird', seg: [189.4, 194.8],
      stem: 'Why is Tom’s explanation of Ron to Lucy funny?',
      choices: ['He calls saying what you mean a weird habit', 'He says Ron never means a word he says',
                'He calls Ron weird for minding his business'], a: 0,
      cue: 'weird thing の中身と、そのあとの一言。',
      line: 'Ron does this *weird thing* where he *says exactly what he means*. You just have to ignore him.',
      said: '「ロンは思ったことをそのまま言う変な癖がある。気にしないで」と言う。',
      mean: 'ふつうは長所の「本音を言う」を変な癖と呼ぶ。言い訳が逆さま。',
      trap: 'よくある言い訳は「本気じゃない」。ここは逆に exactly what he means と言っている。',
      use: 'He just says what he thinks.（あの人は思ったまま言うだけ）' },

    // anchor: 195.4–201.3 s Lucy asks "So you didn't mean what you said?" and Tom answers "Look, I'm all in. That's all
    //   I meant": "ignore him" was cover for feelings he does have
    // R fix: V2 + K5. "That he doesn't feel that way" is what "ignore him" seems to say, not what he holds back; the
    //   new distractor is the face-value reading put as a hidden fact (it was just talk to Ron).
    // why: embarrass him ← right target, wrong reason: "weird thing" heard as a complaint about Ron's mischief;
    //   only said it to Ron ← "ignore him" taken at face value; "I'm all in" refutes it
    { id: 'nt1', skill: 'attitude', level: 'C2', point: 'weird', reveals: ['allin'], seg: [189.4, 201.45],
      stem: 'When Tom tells Lucy to ignore Ron, what is he trying not to say?',
      choices: ['That Ron told her just how he feels', 'That Ron says things to embarrass him',
                'That he only said it to sound good to Ron'], a: 0,
      cue: 'ルーシーの質問への、トムの答え。',
      line: 'You just have to *ignore him*. — So you didn’t mean what you said? — Look, *I’m all in*.',
      said: '「ロンは気にしないで」と言うと「じゃあ本気じゃなかったの？」と聞かれ、「本気だよ」と認める。',
      mean: '無視してと言うの���照れ隠し。ロンが正しかったから、ごまかしたかった。',
      trap: '「無視して」を「本気じゃない」と取りやすい。照れ隠しかは、問い返された時の答えで分かる。',
      use: 'Don’t listen to him. …Okay, it’s true.（あいつの話は気にしないで…まあ、本当だけど）' },

    // R fix: V2. "Taking a break" and "Over" against "Still together" made the happy ending easy; "together, but she
    //   asks him to slow down" (she never does) replaces "a break".
    // why: slow down ← "I don't expect you to feel the same way" and "jumping the gun" heard as her request; over ←
    //   "jumping the gun" heard as what actually happened
    { id: 'g2', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['allin', 'dresses'], seg: [189.4, 221],
      stem: 'By the end of the clip, where do Tom and Lucy stand?',
      choices: ['Still together, and easy about it', 'Together, but she asks him to slow down',
                'Over, since he moved much too fast'], a: 0,
      cue: 'トムの長い告白のあと、ルーシーの返事。',
      said: 'トムは「本気だけど、同じ気持ちは求めない」と伝え、ルーシーは軽い冗談で返す。',
      mean: 'ロンの余計な一言のおかげで、トムは気持ちを言えた。関係はそのまま続く。',
      trap: '「期待しない」「先走り」はトムの気づかい。最後のやりとりが結論。',
      use: 'So we’re good?（じゃあ、私たち大丈夫だね？）' },

    // R fix: V2. "Ready to end things" was a filler; "fine with going slowly" draws on his next lines.
    // why: worn out ← "all in" = くたくた (an older meaning); going slowly ← "I don't expect you to feel the same way"
    //   just after, pulled onto "all in"
    { id: 'f5', skill: 'phrase', level: 'B2', point: 'allin', seg: [194.9, 201.45],
      stem: 'What does Tom tell Lucy with his first words after “Look”?',
      choices: ['He is fully serious about her', 'He is worn out from the night', 'He is fine with going slowly'],
      a: 0,
      cue: '「Look」のすぐあとの短い言い方。',
      line: 'Look, *I’m all in*. That’s all I meant.',
      said: '「本気じゃな���ったの？」に、「僕は本気だ。言いたかったのはそれだけ」と答える。',
      mean: 'all in ＝ 全部を賭けている。ポーカーの言葉で、迷いなく本気。',
      trap: '「疲れた」の意味もあり、あとの「期待しない」に引かれやすいが、all in は迷わず本気。',
      use: 'I’m all in on this plan.（この計画に全力で乗るよ）' },

    // why: back from a trip ← "just got out of" heard as "just got back"; known him a short time ← the usual reason for
    //   "jumping the gun"
    { id: 'd4', skill: 'detail', level: 'B1', point: 'relationship', seg: [201.45, 211.4],
      stem: 'Why doesn’t Tom expect Lucy to feel the same way yet?',
      choices: ['She just got out of a relationship', 'She just got back from a long trip',
                'She has only known him a short time'], a: 0,
      cue: '「I know you just」のあと。',
      line: 'I know you *just got out of a relationship*, so I don’t expect you to feel the same way',
      said: '「君は別れたばかりだから、同じ気持ちは期待しない」と言う。',
      mean: 'get out of a relationship ＝ 恋愛関係を終える、別れる。',
      trap: 'got out of を「戻った」と取ると旅の話になる。out of のあとの語が中身。',
      use: 'She just got out of a long relationship.（彼女は長く付き合った人と別れたばかり）' },

    // anchor: 207.2–217.6 s "I don't expect you to feel the same way", then "I'm only dating you for the free
    //   dresses": a mock-mercenary reason, answered with "I'm fine with that"; the dress is Tom's gift (24.4 s)
    // why: don't like me ← "only… for the free dresses" taken at face value (the mercenary reading); stop buying ← the
    //   remark heard as a complaint about his gifts (the Japanese frame: 気をつかわせた)
    { id: 'nt3', skill: 'pragma', level: 'C2', point: 'dresses', seg: [204.4, 221],
      stem: 'Which reply from Tom would match what Lucy meant by her answer?',
      choices: ['Ha. Then I’d better keep them coming.', 'Oh. So you don’t really like me?',
                'Okay. I’ll stop buying you things.'], a: 0,
      cue: '告白の重さと、返事の理由の軽さ。',
      line: 'I don’t expect you to feel the same way… — Well, I’m *only dating you for the free dresses*, so.',
      said: '「同じ気持ちは期待しない」と言うトムに、ルーシーは「タダのドレス目当てだし」と返す。',
      mean: 'わざと打算的な理由を言う冗談。重い告白を軽く受け止め、「このままでいい」と伝えている。',
      trap: '言葉どおりなら冷たいが、冗談の「問題なし」。返事は言葉の形でなく、相手の気持ちに合わせる。',
      use: 'I’m only here for the snacks.（お菓子目当てで来てるだけだよ）' },
  ]
};
