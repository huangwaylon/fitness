// REVIEW 2026-11-16: pass 2, fix 16, drop 0, new 0; ear checks 8
// OPEN: n1 kept: blind it was easy only through d2/f2 (same point, never drawn together); alone about 35 %.
// “Rachel Means NOTHING to Ross | Friends” (the official Friends channel, Best of Season 6): Ross insists he isn't in
// love with Rachel, his friends don't buy it, and he vows to end the marriage at once to prove it.
// Segments from the captions, words from whisper (2026-11-16). The speakers after 31 s, other than Ross, aren't named
// in the clip, so no item names them; "Bravo, Meg" (39.4 s, both sources) and the last two lines (57–63 s) are left
// untested.
// EAR CHECK: 3.4 s s1 — "I, I have loved her": the weak "have" (both have it; captions repeat "I")
// EAR CHECK: 12.0 s t2 d1 — the voice answering "Phoebe, will you help me out here?" is Phoebe's (assumed by turn)
// EAR CHECK: 16.8 s x1 — "would have married" runs together (≈ would've); captions add "a" before "Joey"
// EAR CHECK: 20.1 s w1 h1 f1 — "Hey, you could do a lot worse than Joey Tribbiani" is Joey's voice (assumed: a new
//   voice that names himself in full), and h1: he sounds offended, not joking at Ross
// EAR CHECK: 31.5 s i3 — speaker of "now he's using this three divorces reason…" unknown (stem says "the next speaker")
// EAR CHECK: 41.9 s p2 — "Okay, fine. Fine." is irritated, not agreeing (key rests on tone)
// EAR CHECK: 49.4 s g2 — captions "get this marriage annulled", whisper "get this marriage a no"
// EAR CHECK: 51–54.5 s t1 — the shouted "Nothing! Nothing!" sounds overdone (key rests on tone); captions
//   "Because Rachel means nothing to me", whisper "She means nothing to me" (the line follows the captions)
import type { Clip } from '../types.ts';

export const rossNothing: Clip = {
  id: 'rossnothing', video: 'voCKV_bM7CI', title: 'Rachel Means NOTHING to Ross', dur: 75, wpm: 204, band: 'fast',
  tags: ['恋愛', '友だち'],
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: blind 60 %; "more than a friend" was the only other reading of the line. Now a strong slip reading.
    // why: mixes up ← both "friend" and "wife" are said; loves her still ← the weak "have" lost, so "I love her"
    { id: 'h2', skill: 'humor', level: 'C1', point: 'wife', seg: [0, 7.9],
      stem: 'Why does the audience laugh at the end of Ross’s first line?',
      choices: ['He mixes up the words “friend” and “wife”', 'He talks as if a wife meant less than a friend',
                'He lets slip that he still loves her'], a: 1,
      cue: '「but now」のあと、wife の前の小さな一語。',
      line: 'Rachel is my *good friend*… but now she is *just my wife*.',
      said: '「Rachel は親友で、昔は愛してたけど、今はただの妻」と言う。',
      mean: 'just ＝「ただの」。ふつう妻は友だちより近いので、順番がさかさま。',
      trap: 'have が弱いと「今も好き」に聞こえるが、in the past。just が付くと妻が格下げになる。',
      use: 'It’s just a cold, nothing serious.（ただの風邪だよ）' },

    // R fix: blind 90 % (the title says it). Now the key competes with "never loved her" (refuted by "in the past")
    //   and a role swap. Reveals `past`: "no longer" gives away s1's "have loved".
    // why: never loved ← "means nothing" heard, "in the past" missed; Rachel not in love ← "means nothing to me"
    //   heard with the roles swapped
    { id: 'g1', skill: 'gist', level: 'B1', point: 'claim', reveals: ['past'], seg: [0, 55],
      stem: 'What is Ross trying to convince his friends of?',
      choices: ['That he never loved Rachel at all', 'That Rachel is not in love with him',
                'That he is no longer in love with Rachel'], a: 2,
      cue: '最初の文の終わりのほうと、最後に叫ぶ言葉。',
      said: 'Rachel は友だちで今は妻なだけ、と言い張り、最後は「何でもない」と叫ぶ。',
      mean: 'もう Rachel を好きではない、と周りに認めさせたい。',
      trap: 'means nothing だけだと「一度も好きでない」に聞こえる。in the past を聞く。',
      use: 'I’m telling you, we’re just friends.（だから、ただの友だちだって）' },

    // R fix: blind 60 %; "love" didn't fit "in the past", so it was a two-way pick. "loved" is the real near sound.
    // why: loved ← the weak "have" lost (simple past fits too); haven't ← a "-n't" seems to hide in the stammer
    { id: 's1', skill: 'sound', level: 'B2', point: 'past', seg: [1.9, 5.9],
      stem: 'Fill the gap: “And I ___ her in the past.”',
      choices: ['loved', 'have loved', 'haven’t loved'], a: 1,
      cue: '「I」を2回言ったあと、動詞の前の弱い音。',
      line: 'and I, I *have loved* her in the past',
      said: '「昔は彼女を愛してたこともある」と認める。I の繰り返しは言いよどみ。',
      mean: 'have は弱く「ァヴ」程度。現在完了で「（前に）〜したことがある」。',
      trap: 'have は弱く、loved だけに聞こえやすい。動詞の前の小さな「ァヴ」の音を探す。',
      use: 'I’ve been there in the past.（前に行ったことがある）' },

    // R fix: blind 85 %; "leave him alone" and "a job" were fillers. Now two real uses of "help me out".
    // why: change the subject ← "help me out" as a rescue from an awkward talk; say what she thinks ← "will you"
    //   read as an open question to her
    { id: 'p1', skill: 'pragma', level: 'B1', point: 'helpout', seg: [5.1, 12.3],
      stem: 'What does Ross want when he turns to Phoebe?',
      choices: ['For her to change the subject', 'For her to back him up on this',
                'For her to tell him what she thinks'], a: 1,
      cue: '「Phoebe」と呼んだあとの頼み方。here の意味も考えて。',
      line: 'Phoebe, will you *help me out here*?',
      said: '「Phoebe、ちょっと助けてよ」と、話に加わるよう頼んでいる。',
      mean: 'help me out here ＝ この話で味方してよ。here は「この場で」。',
      trap: 'help me out は「話をそらして」の時もあるが、ここは言い合いの最中。',
      use: 'Can you help me out here?（ちょっと加勢してくれない？）' },

    // R fix: blind 60 %; two "his" choices against one "not his". Now three different sides. Level B2 → C1:
    //   she never says she disagrees; the stance is implicit.
    // why: his side ← she was asked to help, so she "should" help; neither ← "Well" read as a hedge (a Japanese frame)
    { id: 't2', skill: 'attitude', level: 'C1', point: 'phoebe', seg: [11.4, 15.2],
      stem: 'When Phoebe answers, whose side is she on?',
      choices: ['His; she says they are only friends', 'Not his; she questions his story',
                'Neither; she stays out of it'], a: 1,
      cue: '「Well」で始まる返事。thought のあとを聞いて。',
      line: 'Well, *I thought you loved her* when you married her.',
      said: '「でも、結婚したときは好きだったんじゃないの？」と返す。',
      mean: 'Ross の「今は妻なだけ」に疑問を投げている。助けるどころか反対側。',
      trap: 'Well はどっちつかずにも聞こえるが、ここは同意ではなく、やんわり反論の入り口。',
      use: 'Well, that’s not what you said before.（でも、前はそう言ってなかったよね）' },

    // R fix: blind 85 % with g1 in the same draw (it rules out "in love"), and "Joey talked them into it" was weak.
    // why: loved her ← Phoebe's line just before; a bet ← the usual wild-night script
    { id: 'd1', skill: 'detail', level: 'B1', point: 'drunk', seg: [11.4, 19.9],
      stem: 'What reason does Ross give for marrying Rachel?',
      choices: ['He was in love with her at the time', 'They had lost a bet with each other',
                'They had both had too much to drink'], a: 2,
      cue: 'Phoebe の言葉への、とても短い返事。',
      line: '*We were drunk.*',
      said: '「酔ってたんだ」とだけ答えている。',
      mean: '本気で結婚したのではない、と言いたい。drunk ＝ 酔っぱらった。',
      trap: 'loved her は Phoebe の言葉。Ross の理由は短い一言なので、次の長い文に気を取られない。',
      use: 'Sorry, I was a little drunk.（ごめん、ちょっと酔ってた）' },

    // R fix: blind 80 %; the key was the only sensible choice. Now a blame reading competes.
    // why: rather Joey ← "married Joey" taken as a wish; Joey got him drunk ← "Joey" + "alcohol" joined
    { id: 'i2', skill: 'infer', level: 'B2', point: 'joey', reveals: ['drunk'], seg: [15.4, 19.9],
      stem: 'What does Ross mean by his comment about Joey?',
      choices: ['Joey was the one who got him so drunk', 'He would rather have married Joey',
                'Who he married didn’t matter that night'], a: 2,
      cue: '「amount of」のあとの語。',
      line: 'I *would have married Joey* with *that amount of alcohol*.',
      said: '「あれだけ飲んだら、Joey とでも結婚してた」と言う。',
      mean: 'would have＋過去分詞＝「（そうなら）〜していた」。相手はだれでもよかった。',
      trap: 'married Joey だけだと願望に聞こえる。would have は実際にはしていない仮定。',
      use: 'I would have called, but my phone died.（電話したかったけど、充電が切れて）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'joey', seg: [15.9, 18.6],
      stem: 'Type what Ross says: “I ___ Joey…” (3 words)', answer: 'would have married',
      cue: '「drunk」のすぐあと。I に続く、弱くつながる部分。',
      line: 'I *would have married* Joey with that amount of alcohol.',
      said: '「Joey とだって結婚してた」。',
      mean: 'would have は弱く「ウダヴ」とつながる。h はほぼ消える。',
      trap: 'have が聞こえず would married に聞こえやすい。would のあとは原形か have＋過去分詞。',
      use: 'I would have come if I’d known.（知ってたら来たのに）' },

    // R fix: blind 85 %; the reasons ("defending himself") gave it away. Names only now.
    // why: Phoebe ← she spoke last; Ross ← he just named Joey and could go on
    { id: 'w1', skill: 'who', level: 'B1', point: 'worse', seg: [19.6, 24.2],
      stem: 'Who says “Hey, you could do a lot worse…”?',
      choices: ['Phoebe', 'Joey', 'Ross'], a: 1,
      cue: '新しく入ってくる声と、最後のフルネーム。',
      line: 'Hey, you could do *a lot worse than Joey Tribbiani*.',
      said: 'Joey 本人が「Joey Tribbiani よりひどい相手はいるぞ」と口をはさむ。',
      mean: '自分をフルネームで呼び、自分は悪くない相手だと言い返す。',
      trap: '直前に Joey の名を出したのは Ross なので引かれやすい。声が変わったかで判断。',
      use: 'Hey, I heard that!（おい、聞こえてるぞ）' },

    // R fix: blind 80 %; "drunk too" was a filler. Now a second "comeback" reading competes.
    // why: agrees ← "worse" heard as self-criticism; turns it on Ross ← "you could do worse" heard as a dig at him
    { id: 'h1', skill: 'humor', level: 'C1', point: 'worse', seg: [19.6, 24.2],
      stem: 'Why does the audience laugh at “Hey, you could do…”?',
      choices: ['Joey agrees he would make a bad husband', 'Joey turns the insult back on Ross',
                'Joey takes offense and talks himself up'], a: 2,
      cue: 'Ross の冗談のあと、名前を出された本人の反応。',
      line: 'Hey, you could do *a lot worse than Joey Tribbiani*.',
      said: 'Ross の「Joey とでも結婚した」に、Joey が「俺はいい相手だぞ」と返す。',
      mean: 'たとえに使われただけなのに本気で気を悪くし、自分を売りこむずれが笑い。',
      trap: 'worse だけ聞くと自分を下げているようだが、「〜より悪い人はいる」＝自分はいい。',
      use: 'Hey, I’m a great catch!（おい、俺はいい男だぞ）' },

    // R fix: blind 90 %; the stem quoted the whole phrase, so it was a vocabulary question, and "done bad things" was
    //   a filler. The stem now points at the line only.
    // why: one of the worst ← "worse" heard as the end of the scale; worse than Rachel ← "worse than" heard, the
    //   comparison pinned on the wrong person
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'worse', seg: [19.6, 24.2],
      stem: 'In the “Hey…” line, what is said about Joey as a match?',
      choices: ['He would be one of the worst choices', 'He would be a worse choice than Rachel',
                'He would be a better choice than most'], a: 2,
      cue: 'worse のあとの than に注目。何と比べている？',
      line: 'you could *do a lot worse* than Joey Tribbiani',
      said: '「Joey より悪い相手はいくらでもいる」と言っている。',
      mean: 'could do worse than ～ ＝ 〜は悪くない選択。遠回しなほめ方。',
      trap: 'worse を「最悪」と取ると逆の意味。than と組むと「〜より悪い」＝「〜はまし」。',
      use: 'You could do worse than this hotel.（このホテルなら悪くないよ）' },

    // R fix: blind 90 % (f2/n1 stems; alone about 50 %). "His lawyer told him" was weak; now parallel "does not want".
    // why: hurt Rachel ��� the kind reason a listener expects; lawyer ← "lawyer" comes up later, divorces cost money
    { id: 'd2', skill: 'detail', level: 'B1', point: 'three', seg: [25.6, 31.9],
      stem: 'What reason does Ross give for not ending the marriage?',
      choices: ['He does not want a third divorce', 'He does not want to hurt Rachel',
                'He does not want to pay a lawyer again'], a: 0,
      cue: '「you guys are wrong」のあと、「times」で終わる文。',
      line: 'I just *don’t want to be divorced three times*.',
      said: '「ただ3回も離婚したくないだけ」と言っている。',
      mean: '好きだからではなく、離婚の回数が理由だと言い張っている。',
      trap: 'Rachel を思いやる理由を期待しやすいが、Ross が言うのは自分の経歴の話。',
      use: 'I just don’t want to be late again.（また遅れたくないだけ）' },

    // why: three times ← the number said is taken as past divorces; once ← "three" read as counting the next two
    { id: 'n1', skill: 'number', level: 'B2', point: 'three', seg: [25.6, 31.9], keep: true,
      stem: 'From what Ross says, how many times has he already been divorced?',
      choices: ['Once', 'Twice', 'Three times'], a: 1,
      cue: '「divorced」のあとの回数と、今の結婚を合わせて考える。',
      line: 'I just don’t want to be *divorced three times*.',
      said: '「3回目の離婚はしたくない」という意味。今回で3回目になる。',
      mean: '今回を入れて3回なので、前に2回離婚している。数字から言っていないことを読む。',
      trap: '聞こえた three をそのまま選びやすい。「〜回になってしまう」は今回を含む数。',
      use: 'This would be my third time.（これで3回目になる）' },

    // R fix: blind 85 %; "running joke" was a filler. Level C1 → B2: the speaker says "because he loves her"
    //   outright; only "using" needs reading. Reveals `nothing`, which t1's key turns on.
    // why: fair reason ← "reason" heard as approval; cares how it looks ← "three divorces" read as worry about his image
    { id: 'i3', skill: 'infer', level: 'B2', point: 'excuse', reveals: ['three', 'nothing'], seg: [31, 37.9],
      stem: 'How does the next speaker see Ross’s divorce reason?',
      choices: ['As a fair reason to stay married', 'As a cover for still loving her',
                'As a sign he only cares how it looks'], a: 1,
      cue: '「using this」のあと、because が2回続く部分。',
      line: 'now he’s *using* this three divorces reason… *because he loves her*.',
      said: '「離婚の回数を理由にしてるけど、本当は好きだから別れたくないのよ」と言う。',
      mean: 'using ＝ 口実として使う。言っている理由の裏に本音がある、という見方。',
      trap: 'reason が聞こえるので「もっともな理由」と取りやすいが、using は言い訳の響き。',
      use: 'He’s just using that as an excuse.（それを言い訳にしてるだけ）' },

    // R fix: blind 85 %; "admits he loves her" was weak. Now a kind hand-off competes.
    // why: stays married ← "forget about the whole three divorce thing" read as dropping the plan; leaves it to
    //   Rachel ← the polite script; "marriage" heard without the verb
    { id: 'g2', skill: 'gist', level: 'B2', point: 'annul', reveals: ['fine', 'forget'], seg: [40.1, 55.5],
      stem: 'How does Ross try to settle the argument in the end?',
      choices: ['He agrees to stay married a while longer', 'He leaves it to Rachel to end it',
                'He says he’ll end the marriage at once'], a: 2,
      cue: '「lawyer’s office」と「right now」のあたり。',
      line: 'I’ll go to my *lawyer’s office right now* and get this *marriage annulled*',
      said: '「今すぐ弁護士事務所に行って、この結婚を無効にしてくる」と言う。',
      mean: 'annul ＝ 結婚をなかったことにする。好きじゃないと行動で示そうとしている。',
      trap: 'forget about を「離婚はやめる」と取ると逆。right now を聞く。',
      use: 'I’ll call them right now.（今すぐ電話するよ）' },

    // R fix: blind 70 %; "thanking them" was a filler. Now a give-up reading competes.
    // why: gives in ← "fine" = OK, agreement in a Japanese frame; lets it go ← 「もういいよ」, giving up on them
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'fine', reveals: ['forget', 'three'], seg: [41.4, 47.1],
      stem: 'Ross starts with “Okay, fine. Fine.” What is he doing?',
      choices: ['Giving in and admitting they’re right', 'Getting ready to prove them wrong',
                'Letting it go, since they won’t listen'], a: 1,
      cue: '「If this is what you think」のあと、何をすると言うか。',
      line: 'Okay, *fine*. Fine. If this is what you think, *forget about* the whole three divorce thing',
      said: '「わかった、いいよ。そう思うなら、離婚の話はなしだ」と言う。',
      mean: 'この fine は納得ではなく「なら見てろ」という開き直り。行動で証明しようとする。',
      trap: 'fine を同意や「もういい」と取りやすい。強く繰り返す fine はいらだちのサイン。',
      use: 'Fine. I’ll do it myself.（いいよ、じゃあ自分でやる）' },

    // R fix: blind 85 %; the stem quoted the phrase (a vocabulary question) and two choices were fillers. The stem
    //   now names the moment; the choices are what he does with the reason.
    // why: sticks to it ← "the whole three divorce thing" heard, "forget about" missed; never true ← dropping the
    //   reason read as a confession
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'forget', reveals: ['three'], seg: [43.5, 47.1],
      stem: 'After “If this is what you think”, what does Ross do with his reason?',
      choices: ['He sticks to it, whatever they say', 'He drops it, so it no longer counts',
                'He admits it was never true at all'], a: 1,
      cue: '「If this is what you think」の直後の言い方。',
      line: '*forget about the whole* three divorce *thing*, okay?',
      said: '「3回目の離婚がどうこうって話は、もうなしでいい」と言う。',
      mean: 'forget about ～ ＝ 〜はもういい。the whole ～ thing ＝「〜ってやつ全部」。',
      trap: 'forget を「忘れる」と取るとぼやける。ここは「取り下げる」。',
      use: 'Forget about the whole dinner thing.（夕食の件はなしでいいよ）' },

    // R fix: blind 85 %; "calmly stating" can't fit an outburst, and the stem said "outburst". Now three readings
    //   of his feelings, with the literal one stated plainly.
    // why: moved on ← the words taken at face value; angry at her ← the loud "nothing" read as anger at Rachel
    { id: 't1', skill: 'attitude', level: 'C1', point: 'nothing', seg: [50.7, 55.5],
      stem: 'What does Ross’s ending, “Nothing! Nothing!”, suggest about his feelings?',
      choices: ['He has truly moved on from her', 'He is angry at her for something',
                'He still cares, but won’t admit it'], a: 2,
      cue: '最後の一語を何回、どんな大きさで言うか。',
      line: 'Because *Rachel means nothing to me*. *Nothing! Nothing!*',
      said: '「Rachel なんて何でもない。何でもない！何でもない！」と叫ぶ。',
      mean: '否定を何度も大声で言うほど、逆に気持ちがあるように聞こえる。',
      trap: '言葉だけなら事実の説明だが、叫び方が中身と合わない。強すぎる否定は本音の裏返し。',
      use: 'I don’t care. Really, I don’t!（気にしてない。ほんとだって！）' }
  ]
};
