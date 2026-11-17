// REVIEW 2026-11-16: pass 2, fix 17, drop 0, new 0; ear checks 0
// OPEN: on a cold re-read g1 (80 %), d3 (80 %) and i1 (70 %) stay guessable: “honest” is the coherent opposite of
//   “mean”, and “I thought it would taste terrible” sets up a reversal. Second rewrite, or accept as inherent?
// “would YOU drink LewbJuice? 🍹 | iCarly #Shorts” (NickRewind, Best of the New iCarly 🎉): Lewbert's juice is a drink
// and a foot scrub that makes people honest; insults, a wedding grudge and gushing praise come out, until the woman
// from Poison Control turns up.
// Segments from the captions, words from whisper (2026-11-16). The product word at 2.8 s differs (captions “exfoliate”,
// whisper “exfolded”), and so does the word before “off your brain” at 19.9 s (captions “fter”, whisper “tilter”): no
// key or shown line uses either. The nickname at 42–45 s (captions “Captain Charisma”, whisper “Captain Cornett's
// mother”) is never quoted. Speakers aren't named in the audio, so items say “the speaker”, “the first / second
// speaker”; the keys rest on words and turn order only. Left out on purpose: the Ben Affleck lines (24–30 s, world
// knowledge) and the insult before “Trina” at 48 s (never quoted).
import type { Clip } from '../types.ts';

export const lewbJuice: Clip = {
  id: 'lewbjuice', video: '9mlRiZd2FuI', title: 'would YOU drink LewbJuice?', dur: 61, wpm: 158, band: 'mid',
  tags: ['友だち', '家'],
  show: 'iCarly',
  credit: 'iCarly (NickRewind, official YouTube channel)',
  questions: [
    // R fix: V2 (blind 90 %): the key was the only choice covering both halves; the distractors now cover both halves
    //   too (manners lost, silliness)
    // why: forget their manners ← the insults, and gushing reads as unguarded; sillier ← the “lovable goofball” line
    //   heard as the effect; “it just makes you honest” settles it
    { id: 'g1', skill: 'gist', level: 'B2', point: 'juice', reveals: ['honest'], seg: [0, 45.8],
      stem: 'From the whole scene, what does the juice do to people?',
      choices: ['Makes them say what they really think', 'Makes them forget their manners',
                'Makes them act sillier than usual'], a: 0,
      cue: '悪口のあとの質問への答えと、後半のほめ合い。',
      said: '思ったことを隠せなくなる。悪口も、相手へのあこがれも口に出る。',
      mean: 'just makes you honest ＝ 意地悪にはせず、本音を言わせるだけ。',
      trap: '悪口だけだと「無作法」、goofball の話だと「おどける」に見える。質問への答えが軸。',
      use: 'Honestly? I think it’s too expensive.（正直に言うと、高すぎると思う）' },

    // R fix: V2 (blind 85 %): smell and color were the only non-clip choices; one is now the foot scrub said at 2 s
    //   (so it reveals `feet`)
    // why: foot scrub ← “a drink and a foot exfoliate” just before, a word said in the wrong relation; color ← a taste
    //   guess often rests on looks; “because the name” settles it
    { id: 'd2', skill: 'detail', level: 'B1', point: 'name', reveals: ['feet'], seg: [3.3, 12.1],
      stem: 'Why did the speaker expect the juice to taste terrible?',
      choices: ['Because of its name', 'Because it’s also a foot scrub', 'Because of its color'], a: 0,
      cue: 'because のあと、最初の名詞。',
      line: 'would taste terrible *because the name*, like Lewbert, is disgusting.',
      said: '「名前が、ほら Lewbert だから、ひどい味だと思ってた」と言う。',
      mean: '味を予想した理由は名前だけ。飲む前の思い込み。',
      trap: '直前の「足の角質取り」や見た目と結びやすい。because のすぐあとの語を拾う。',
      use: 'I never tried it because of the name.（名前のせいで食べたことなかった）' },

    // R fix: V2 (blind 80 %), S1: “After saying what they expected… now” cued a reversal; the stem is neutral and the
    //   hedge filler is now “even worse”
    // why: as bad ← “terrible” is the loudest word, and the past “thought” is lost; even worse ← “disgusting” comes
    //   right after and sounds stronger than “terrible”
    { id: 'i1', skill: 'infer', level: 'B2', point: 'taste', seg: [3.3, 12.1],
      stem: 'What does the speaker think of the juice’s taste?',
      choices: ['Better than they had expected', 'Just as bad as they had expected',
                'Even worse than they had feared'], a: 0,
      cue: '文の最初、You know, I thought の形。',
      line: 'You know, *I thought* Lewb juice would taste terrible…',
      said: '「ねえ、ひどい味だと思ってたんだよ」と話し始める。',
      mean: 'I thought ～ は「そう思っていたが違った」の含み。飲むと悪くなかった。',
      trap: 'terrible が耳に残り「やっぱりまずい」と取りやすい。I thought の過去形は、予想が外れた合図。',
      use: 'I thought I’d hate it. I didn’t!（嫌いだと思ってたけど、違った！）' },

    // R fix: V2 (blind 60 %): “tasting so awful” was a far miss; it becomes the near miss “the name itself”
    // why: the name ← what the line literally calls disgusting, but the replies keep the man; the speaker ← the joke
    //   read as self-mockery for judging by a name
    // anchor: 10.2–13.6 s the replies “Lewbert is disgusting” and “You are disgusting” drop the name and keep the man
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'name', seg: [3.3, 14.1],
      stem: 'In the line about the juice’s name, who is the joke really on?',
      choices: ['Lewbert himself, the man it’s named after', 'The juice’s name, which really is awful',
                'The speaker, for judging a drink by its name'], a: 0,
      cue: '次の返事が、何を disgusting と言っているか。',
      line: 'because the name, *like Lewbert*, is disgusting. — *Lewbert is disgusting.*',
      said: '名前がひどい、「Lewbert みたいな」と言うと、すぐ「Lewbert はひどい」と続く。',
      mean: '名前の話の形で、名前のもとの本人をけなしている。次の返事が人そのものを指すので的が決まる。',
      trap: '名前そのものや、言った人の思い込みを笑う話に取りやすい。皮肉の的は、次の返事の主語で確かめる。',
      use: 'It’s not the name, it’s the person.（名前じゃなくて、人の問題）' },

    // R fix: V2 (blind 80 %), K2: “Lewbert has been mean” can't be refuted (who says “You are disgusting” is unknown);
    //   now the name talk (so it reveals `name`) and a taste reading
    // why: the name ← the name talk comes just before, but it was about taste; bitter taste ← “mean” heard as a
    //   harsh flavor
    { id: 'i2', skill: 'infer', level: 'B2', point: 'mean', reveals: ['name'], seg: [9.7, 18.15],
      stem: 'What prompts someone to ask whether the juice makes you mean?',
      choices: ['The insults that were just said', 'The juice’s off-putting name',
                'The bitter taste it’s left them with'], a: 0,
      cue: '質問の直前に、何が言われたか。',
      line: '*You are disgusting.* — Does Lewb juice make you *mean*?',
      said: '「あなたは気持ち悪い」と言われた直後に、「これで意地悪になるの？」と聞く。',
      mean: '直前の悪口に驚いて、原因が飲み物か確かめている。mean ＝ 意地悪な。',
      trap: 'mean を「意味する」や味と取りやすい。make you ＋形容詞は「あなたを～にする」。',
      use: 'Does coffee make you jumpy?（コーヒー飲むとそわそわする？）' },

    // R fix: V2 (blind 85 %): “honest” in two choices pointed at it; now three h- words after “No; it just makes…”
    // why: happy, hyper ← “honest”, “happy” and “hyper” all start with a breathy h and end weak
    { id: 'd3', skill: 'detail', level: 'B1', point: 'honest', seg: [14.1, 18.15],
      stem: 'Does the juice make people mean, according to the answer?',
      choices: ['No; it just makes them honest', 'No; it just makes them happy', 'No; it just makes them hyper'],
      a: 0,
      cue: 'No のすぐあと、just makes you の次の語。',
      line: 'No, it *just makes you honest*.',
      said: '「ううん、正直になるだけ」と答える。',
      mean: 'just ＝「～だけ」。悪口は意地悪ではなく、本音が出ているだけ。',
      trap: 'honest、happy、hyper は語頭が似ている。悪口の直後なので、笑顔や元気より本音の話がつながる。',
      use: 'It doesn’t hurt. It just feels cold.（痛くないよ。冷たいだけ）' },

    // R fix: V2 (blind 55 %): “dirt off your shoes” wasn't body care; both distractors are now body care
    // why: face ← “skin” heard, skin care pictured as the face; hair off your legs ← “off your…” heard, the body part
    //   lost
    { id: 'd1', skill: 'detail', level: 'B1', point: 'feet', reveals: ['honest'], seg: [17.75, 21.45],
      stem: 'Besides making people honest, what else is the juice said to do?',
      choices: ['Take the skin off your feet', 'Soften the skin on your face', 'Take the hair off your legs'], a: 0,
      cue: 'honest の説明の次の文、off your の次の語。',
      line: '*Dissolves the skin off your feet* and the … off your brain.',
      said: '「足の皮を溶かして取る。そして頭の…も取る」と続ける。',
      mean: '飲み物なのに足の角質取りにも使える、という変な商品。',
      trap: 'skin で顔のスキンケアを思い浮かべやすい。off your のあとの体の部分を拾う。',
      use: 'This cream takes the dry skin off.（このクリームで乾燥した皮がとれる）' },

    // R fix: V2 (blind 80 %), S1: “Right after explaining the juice” cued a test; “warning not to lie” becomes
    //   “Go ahead” as an offer to drink
    // why: take a sip ← “Go ahead” as the usual “help yourself”; free to leave ← “Go ahead” read as “go” (行け)
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'goahead', reveals: ['honest'], seg: [17.75, 23.9],
      stem: 'What is the speaker doing with “Go ahead…”?',
      choices: ['Daring someone to tell a lie', 'Inviting someone to take a sip',
                'Telling someone they can leave'], a: 0,
      cue: '効き目の説明のあと、短い二つの命令。',
      line: '*Go ahead. Try to lie.*',
      said: '「さあ、うそをついてみな」と言う。',
      mean: 'Go ahead ＝「どうぞ、やってみて」。効き目を試させる挑戦。',
      trap: 'Go ahead だけだと「どうぞ飲んで」や「行っていい」に聞こえる。Go ahead ＋命令は「やってごらん」。',
      use: 'Go ahead, try it. It’s good.（どうぞ食べてみて。おいしいよ）' },

    // R fix: V2 (blind 65 %): the stem quoted “my mother”, which points at “her son”; it now says only “wedding”, and
    //   the distractors are sound-alikes
    // why: so young ← “her son” and “so young” share the s and the vowel; around ← a short weak ending, the wish read
    //   as “go away”
    { id: 'd4', skill: 'detail', level: 'B1', point: 'mother', seg: [29.9, 34.4],
      stem: 'In the exchange about the wedding, what does the second speaker wish?',
      choices: ['That the first speaker weren’t her son', 'That the first speaker weren’t so young',
                'That the first speaker weren’t around'], a: 0,
      cue: '返事の最後の一語。前の文と形が同じ。',
      line: 'I wish you weren’t marrying my mother. — I wish you weren’t *her son*.',
      said: '「母と結婚しないでほしい」に、「君が彼女の息子でなければ」と返す。',
      mean: '同じ形で言い返す。お互い、相手がいなければという本音。',
      trap: 'her son は短く、so young にも聞こえる。前の文の my mother と結べば「彼女の息子」と分かる。',
      use: 'I wish you weren’t leaving.（行かないでほしいな）' },

    // R fix: V2 (blind 65 %): the key was the only one fitting an honesty juice; now a near miss (resentful but
    //   hiding it), refuted by saying it
    // why: hiding it ← “I wish” read as a soft, indirect wish; teasing ← a matched comeback looks like friendly banter
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'mother', seg: [29.9, 34.4],
      stem: 'In that exchange about the marriage, how do the two feel about each other?',
      choices: ['Resentful, and finally saying so', 'Resentful, but trying to hide it',
                'Teasing, the way close friends do'], a: 0,
      cue: '二人とも同じ I wish の形。直前の「正直になる」と結ぶ。',
      line: '*I wish you weren’t* marrying my mother. — *I wish you weren’t* her son.',
      said: '二人が同じ形で、相手がいなければよかったと言い合う。',
      mean: '正直になる飲み物のせいで、ふだん隠している嫌な気持ちが両方から出る。冗談の軽さはない。',
      trap: 'I wish は遠回しにも、同じ形の言い返しはじゃれ合いにも見えるが、ここは本音しか言えない場面。',
      use: 'Honestly, I wish you’d asked first.（正直、先に聞いてほしかった）' },

    // R fix: V2 (blind 65 %): only the key used “silly act”; all three now name the act
    // why: get a person ← “how far” read as getting ahead in life; find it funny ← “goofball” pictured as a
    //   comedian's act
    { id: 'f1', skill: 'phrase', level: 'C1', point: 'takethis', seg: [34.4, 42.1],
      stem: 'What is the speaker wondering about at “Sometimes I wonder…”?',
      choices: ['How long the silly act can keep going', 'How far a silly act can get a person',
                'How many people find the act funny'], a: 0,
      cue: 'Sometimes I wonder のあと、take と thing。',
      line: 'Sometimes I wonder *how far I can take* this lovable goofball thing.',
      said: '「この愛されおバカキャラ、どこまで続くかな」と言う。',
      mean: 'take ～ far ＝ ～を押し通す、続ける。thing はここでは「キャラ、やり方」。',
      trap: 'far を距離や出世と取りやすい。take ～ far は「どこまで続けるか」。',
      use: 'How far can we take this joke?（この冗談、どこまで続ける？）' },

    // R fix: V2 (blind 60 %), S3: “fading with age” was a far miss; now the near miss “simply who they are”; the cue's
    //   “up” was a key-only word
    // why: unfair label ← “goofball” heard as a name others call him (a hurt reading); who they are ← “lovable” heard
    //   as sincere self-description, “take” and “thing” missed
    // anchor: 35.5–37.3 s “how far I can take this … thing”: you “take” an act you keep up, and “thing” names it as a
    //   routine; 37.5 s “Will I ever have to grow up?” asks whether it can go on
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'takethis', reveals: ['growup'], seg: [34.4, 42.1],
      stem: 'By “this lovable goofball thing”, what is the speaker admitting about the goofball side?',
      choices: ['It’s partly a role they choose to play', 'It’s simply who they are, for good',
                'It’s a label others pin on them unfairly'], a: 0,
      cue: 'take と thing、そのあとの「大人に」の質問。',
      line: 'how far I can *take this* lovable goofball *thing*. Will I ever have to grow up?',
      said: 'キャラを「どこまで続けられるか」と言い、大人になる日が来るかと聞く。',
      mean: 'take this thing は自分で選んで続ける「やり方」の言い方。キャラが半分は演技だと認めている。',
      trap: 'lovable を素直な自己紹介、goofball を悪口と取りやすい。take と thing を聞く。',
      use: 'I’m not really this calm. It’s an act.（本当はこんなに落ち着いてない。演技だよ）' },

    // R fix: V2 (blind 70 %): the distractors broke the parallel (“It's a…”); all three are now about the praise
    // why: a dig ← a nickname after “Please” heard as sarcasm; a lie ← “Try to lie” carried over from 22 s, the test
    //   read into the praise
    { id: 'h2', skill: 'humor', level: 'C1', point: 'charisma', reveals: ['idwant'], seg: [34.4, 47.5],
      stem: 'What makes the reply “Please, you’re the cool one…” funny?',
      choices: ['The honest truth comes out as gushing praise', 'The praise is really a dig in disguise',
                'The praise is a lie told to test the juice'], a: 0,
      cue: 'If I did の文と、Please で始まる返事を合わせて。',
      line: 'If I did, I’d want to be like you. — *Please, you’re the cool one*…',
      said: '「君みたいになりたい」に、「いやいや、かっこいいのは君の方」と返す。',
      mean: '本音の飲み物で、悪口だけでなく、照れて言えないほめ言葉まで出てしまう。そのギャップが笑い。',
      trap: 'あだ名で皮肉に聞こえやすい。ここは本音しか言えない場面なので、ほめ言葉も本気。',
      use: 'Please, you’re the real star here.（いやいや、主役は君だよ）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'growup', seg: [36.75, 40.9],
      stem: 'Type what the speaker asks: “Will I ever ___?” (4 words)', answer: 'have to grow up',
      cue: 'ever のあと、四語が一続き。',
      line: 'Will I ever *have to grow up*?',
      said: '「いつか大人にならなきゃいけないのかな」と言う。',
      mean: 'have to は「ハフタ」と縮まる。grow up ＝ 大人になる。',
      trap: 'have to が一語に聞こえ、grow up だけ書きやすい。ever のあとの「ハフタ」を拾う。',
      use: 'Do I have to dress up?（ちゃんとした服じゃないとだめ？）' },

    // R fix: V2 (blind 85 %): only the key fit “If I did”; “I'll want” and “I wanted” become two that fit (“I would
    //   want”, “I'd have”); the cue's “did” tripped the leak check
    // why: I want ← the weak 'd lost before w, common in casual speech; I would want ← the full form, the same
    //   meaning but a longer sound; I'd have ← “'d” caught, “want to” heard as “have to”
    { id: 's1', skill: 'sound', level: 'B2', point: 'idwant', seg: [36.75, 42.1],
      stem: 'Fill the gap: “If I did, ___ to be like you.”',
      choices: ['I’d want', 'I want', 'I would want', 'I’d have'], a: 0,
      cue: 'If で始まる文の後半、want の前の小さな音。',
      line: 'If I did, *I’d want* to be like you.',
      said: '「もし大人になるなら、君みたいになりたい」と言う。',
      mean: '仮定なので I’d want。’d はごく短く、want とつながる。',
      trap: '’d が消えると I want に聞こえやすい。If の文の後半は、would の短い形を待つ。',
      use: 'If I could, I’d want to stay.（できるなら、残りたいな）' },

    // R fix: V2 (blind 80 %), S4: the key was the only specific one; now three causes of the same weight. The segment
    //   was 10 s, under the gist minimum; now 40.6–56.2
    // why: falling sick ← “Poison Control” pictured as an illness; unsafe ← Poison Control heard as a ban, but she let
    //   the speaker drink it
    { id: 'g2', skill: 'gist', level: 'B2', point: 'end', reveals: ['alarm', 'aslongas'], seg: [40.6, 56.2],
      stem: 'What turns things into an “emergency” at the end?',
      choices: ['The arrival of someone who set a rule', 'Someone falling sick after drinking it',
                'Finding out the juice is unsafe to drink'], a: 0,
      cue: '最後の場面、出てくる名前と、その人の条件。',
      said: '売らなければいいと言った人が来たらしく、慌てて「緊急事態、行かなきゃ」と言う。',
      mean: '本音大会が、売ってはいけない物を売っていた問題で急に終わる。',
      trap: 'Poison Control から「誰かが具合を悪くした」と想像しやすいが、そういう話は出ない。',
      use: 'Sorry, something came up. I have to go.（ごめん、急用ができた。行かなきゃ）' },

    // why: selling but not drinking ← the two verbs swapped, both heard; as long as they liked ← “as long as” read as time
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'aslongas', seg: [46.0, 52.9],
      stem: 'What had the woman from Poison Control allowed, by the speaker’s account?',
      choices: ['Drinking it, but only if not selling it', 'Selling it, but only if not drinking it',
                'Drinking it for as long as they liked'], a: 0,
      cue: 'could still drink のあと、as long as の次。',
      line: 'She said I could still drink Lewb juice *as long as I didn’t sell it*!',
      said: '「売らなければ、まだ飲んでもいいって言ったのに！」と叫ぶ。',
      mean: 'as long as ＝「～さえすれば、～する限り」。条件つきの許可。',
      trap: 'as long as を時間の「～の間ずっと」と取りやすい。後ろに文が来たら条件の意味。',
      use: 'Stay as long as you’re quiet.（静かにしてるなら、いていいよ）' },

    // R fix: V2 (blind 85 %), K6: the key was the only one with a broken rule; all three now end “though told not to”
    // why: drinking ← “drink” is the verb heard first, but drinking was allowed; giving it away ← “didn't sell” heard
    //   as “gave it free”
    { id: 'i3', skill: 'infer', level: 'C1', point: 'aslongas', seg: [46.0, 56.0],
      stem: 'So what has the speaker probably been doing with the juice?',
      choices: ['Selling it, though told not to', 'Drinking it, though told not to', 'Giving it away, though told not to'],
      a: 0,
      cue: '許可の条件と、すぐあとの emergency。',
      line: 'as long as I didn’t sell it! — Guys, this is an *emergency*. We gotta go.',
      said: '「売らなければいいと言われた」と叫んで、すぐ「緊急事態、行かなきゃ」と言う。',
      mean: '条件は「売らないこと」。その人が現れて慌てるので、売っていたと分かる。',
      trap: 'drink が先に聞こえるので「飲みすぎ」と取りやすい。慌てる理由は、守るべき条件の方にある。',
      use: 'We weren’t supposed to do this.（これ、やっちゃいけなかったんだ）' },

    // R fix: V2 (blind 80 %): relieved and amused were far from the words; now guilt (the selling) with owning up,
    //   refuted by “We gotta go”
    // why: guilty ← she had a rule, and it was broken, but “We gotta go” is no confession; glad ← “Oh, my God” also
    //   greets good news
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'alarm', seg: [46.0, 56.0],
      stem: 'How does the speaker react on realizing who it is?',
      choices: ['Alarmed, and keen to get away fast', 'Guilty, and ready to own up to it',
                'Surprised, and glad to see her again'], a: 0,
      cue: '最初の短い叫びと、最後の emergency。',
      line: '*Oh, my God. No.* … this is an *emergency*. We gotta go.',
      said: '「うそ、やめて」と言い、「緊急事態。行かなきゃ」と続ける。',
      mean: 'No はここでは「いやだ、まさか」。会いたくない人が来た驚きと焦り。',
      trap: 'Oh my God は喜びにも、慌てる様子は反省にも取れる。続く No と We gotta go で決まる。',
      use: 'Oh no. We need to go, now.（やばい。今すぐ行かないと）' },
  ]
};
