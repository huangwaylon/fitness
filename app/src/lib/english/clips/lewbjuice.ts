// A2 REVIEW 2026-11-17: keep 3, rewrite 11, retire 5, new 0
// “would YOU drink LewbJuice? 🍹 | iCarly #Shorts” (NickRewind, Best of the New iCarly 🎉): Lewbert's juice is a drink
// and a foot scrub that makes people honest; insults, a wedding grudge and gushing praise come out, until the woman
// from Poison Control turns up.
// Segments from the captions, words from whisper (2026-11-16). The product word at 2.8 s, the word before "off your
// brain" at 19.9 s and the nickname at 42–45 s differ between the sources: no key or shown line uses them. Speakers
// aren't named in the audio, so items say "the speaker"; the keys rest on words and turn order only. Left out on
// purpose: the Ben Affleck lines (24–30 s), the "cool one" praise (40–45 s) and the insult before "Trina" at 48 s.
import type { Clip } from '../types.ts';

export const lewbJuice: Clip = {
  id: 'lewbjuice', video: '9mlRiZd2FuI', title: 'would YOU drink LewbJuice?', dur: 61, wpm: 158, band: 'mid',
  tags: ['友だち', '家'],
  show: 'iCarly',
  credit: 'iCarly (NickRewind, official YouTube channel)',
  questions: [
    { id: 'g1', skill: 'gist', level: 'B1', point: 'juice', reveals: ['honest'], seg: [0, 44],
      stem: 'What does the juice do to people?', ja: 'このジュースは、人をどうする？',
      choices: ['Makes them say what they think', 'Makes them rude for no good reason', 'Makes them act very silly'], a: 0,
      choicesJa: ['思っていることを言わせる', 'わけもなく失礼にする', 'すごくふざけさせる'],
      cue: '「make you mean?」への答え',
      said: '思ったことを隠せなくなる。悪口も、相手へのあこがれも口に出る。',
      mean: 'it just makes you honest ＝ 意地悪にするのではなく、本音を言わせるだけ。',
      trap: '悪口だけ聞くと、失礼にする飲み物だと思いやすい。後半はほめ言葉も出てくる。',
      use: 'Honestly? I think it’s too expensive.（正直に言うと、高すぎると思う）' },

    { id: 'd2', skill: 'detail', level: 'B1', point: 'name', seg: [3.3, 12.1],
      stem: 'Why did the speaker expect the juice to taste terrible?', ja: 'この人は、なぜジュースがひどい味だと思っていた？',
      choices: ['Because of its name', 'Because it’s a foot scrub', 'Because of its color'], a: 0,
      choicesJa: ['名前のせい', '足の角質取りだから', '色のせい'],
      cue: '「because」のあと',
      line: 'would taste terrible *because the name*, like Lewbert, is disgusting.',
      said: '「名前が、ほらルーバートみたいで気持ち悪いから、ひどい味だと思ってた」と言う。',
      mean: 'disgusting ＝ 気持ち悪い。味を予想した理由は名前だけ。飲む前の思いこみ。',
      trap: '前の「足の角質取り」と結びつけやすい。because のすぐあとの the name を拾う。',
      use: 'I never tried it because of the name.（名前のせいで食べたことなかった）' },

    // R fix: V2 (blind 80 %), S1: “After saying what they expected… now” cued a reversal; the stem is neutral and the
    //   hedge filler is now “even worse”
    // why: as bad ← “terrible” is the loudest word, and the past “thought” is lost; even worse ← “disgusting” comes
    //   right after and sounds stronger than “terrible”
    { id: 'i1', skill: 'infer', level: 'B2', point: 'taste', seg: [3.3, 12.1], retired: true,
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
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'name', seg: [3.3, 14.1], retired: true,
      stem: 'In the line about the juice’s name, who is the joke really on?',
      choices: ['Lewbert himself, the man it’s named after', 'The juice’s name, which really is awful',
                'The speaker, for judging a drink by its name'], a: 0,
      cue: '次の返事が、何を disgusting と言っているか。',
      line: 'because the name, *like Lewbert*, is disgusting. — *Lewbert is disgusting.*',
      said: '名前がひどい、「Lewbert みたいな」と言うと、すぐ「Lewbert はひどい」と続く。',
      mean: '名前の話の形で、名前のもとの本人をけなしている。次の返事が人そのものを指すので的が決まる。',
      trap: '名前そのものや、言った人の思い込みを笑う話に取りやすい。皮肉の的は、次の返事の主語で確かめる。',
      use: 'It’s not the name, it’s the person.（名前じゃなくて、人の問題）' },

    { id: 'i2', skill: 'infer', level: 'B2', point: 'mean', seg: [9.7, 18.15],
      stem: 'Why does someone ask if the juice makes you mean?', ja: 'なぜ「このジュースで意地悪になる？」と聞く？',
      choices: ['Someone just said something rude', 'The juice’s name sounds really bad', 'It tastes very bitter'], a: 0,
      choicesJa: ['今ひどいことを言われた', '名前がすごくひどい', 'すごく苦い'],
      cue: '質問の直前',
      line: '*You are disgusting.* — Does Lewb juice make you *mean*?',
      said: '「あなたは気持ち悪い」と言われた直後に、「これで意地悪になるの？」と聞く。',
      mean: 'mean ＝ 意地悪な。make you ＋形容詞 ＝ あなたを〜にする。直前の悪口に驚いている。',
      trap: 'mean を「意味する」と思いやすい。make you mean は「あなたを意地悪にする」。',
      use: 'Does coffee make you sleepy?（コーヒー飲むと眠くなる？）' },

    { id: 'd3', skill: 'detail', level: 'B1', point: 'honest', seg: [14.1, 18.15],
      stem: 'What does the answer say the juice does?', ja: '答えによると、ジュースは何をする？',
      choices: ['It just makes you honest', 'It just makes you happy', 'It just makes you hyper'], a: 0,
      choicesJa: ['正直になるだけ', '楽しくなるだけ', 'はしゃぐだけ'],
      cue: '「just makes you」のあと',
      line: 'No, it *just makes you honest*.',
      said: '「ううん、正直になるだけ」と答える。',
      mean: 'just ＝ 〜だけ。honest ＝ 正直な。悪口は意地悪ではなく、本音が出ているだけ。',
      trap: 'honest、happy、hyper は出だしが似ている。honest は h を言わず「オネスト」。',
      use: 'It doesn’t hurt. It just feels cold.（痛くないよ。冷たいだけ）' },

    { id: 'd1', skill: 'detail', level: 'B1', point: 'feet', seg: [17.75, 21.45],
      stem: 'What else does the juice do?', ja: 'ジュースは、ほかに何をする？',
      choices: ['Take the skin off your feet', 'Soften the skin on your face', 'Take the hair off your legs'], a: 0,
      choicesJa: ['足の皮を取る', '顔の肌をやわらかくする', '足の毛を取る'],
      cue: '「off your」のあとの体の部分',
      line: '*Dissolves the skin off your feet* and the … off your brain.',
      said: '「足の皮を溶かして取る。そして頭の…も取る」と続ける。',
      mean: 'dissolve ＝ 溶かす。飲み物なのに、足の角質取りにも使える変な商品。',
      trap: 'skin（肌）から、顔のスキンケアを思いやすい。off your のあとの feet を拾う。',
      use: 'This cream takes the dry skin off.（このクリームで乾燥した皮がとれる）' },

    { id: 'p1', skill: 'pragma', level: 'B1', point: 'goahead', seg: [17.75, 23.9],
      stem: 'What does “Go ahead. Try to lie.” mean?', ja: '“Go ahead. Try to lie.” はどういう意味？',
      choices: ['I dare you to lie', 'Please have a drink', 'You can leave now'], a: 0,
      choicesJa: ['うそをついてみな', 'どうぞ飲んで', 'もう帰っていいよ'],
      cue: '効き目の説明のあと',
      line: '*Go ahead. Try to lie.*',
      said: '「さあ、うそをついてみな」と言う。',
      mean: 'Go ahead ＝ どうぞ、やってみて。効き目を試させる挑戦。',
      trap: 'Go ahead だけだと「どうぞ飲んで」に聞こえやすい。あとの Try to lie で何をするか決まる。',
      use: 'Go ahead, try it. It’s good.（どうぞ食べてみて。おいしいよ）' },

    { id: 'd4', skill: 'detail', level: 'B1', point: 'mother', seg: [29.9, 34.4],
      stem: 'What does the second speaker wish?', ja: '二人目の人は、何を願う？',
      choices: ['That he weren’t her son', 'That he weren’t so young', 'That he weren’t here'], a: 0,
      choicesJa: ['彼が彼女の息子でなければ', '彼がそんなに若くなければ', '彼がここにいなければ'],
      cue: '返事の最後の語',
      line: 'I wish you weren’t marrying my mother. — I wish you weren’t *her son*.',
      said: '「母と結婚しないでほしい」に、「君が彼女の息子でなければ」と返す。',
      mean: 'I wish you weren’t 〜 ＝ 君が〜でなければいいのに。同じ形で言い返している。',
      trap: 'her son は短く、so young に聞こえやすい。前の my mother と結べば「彼女の息子」。',
      use: 'I wish you weren’t leaving.（行かないでほしいな）' },

    // R fix: V2 (blind 65 %): the key was the only one fitting an honesty juice; now a near miss (resentful but
    //   hiding it), refuted by saying it
    // why: hiding it ← “I wish” read as a soft, indirect wish; teasing ← a matched comeback looks like friendly banter
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'mother', seg: [29.9, 34.4], retired: true,
      stem: 'In that exchange about the marriage, how do the two feel about each other?',
      choices: ['Resentful, and finally saying so', 'Resentful, but trying to hide it',
                'Teasing, the way close friends do'], a: 0,
      cue: '二人とも同じ I wish の形。直前の「正直になる」と結ぶ。',
      line: '*I wish you weren’t* marrying my mother. — *I wish you weren’t* her son.',
      said: '二人が同じ形で、相手がいなければよかったと言い合う。',
      mean: '正直になる飲み物のせいで、ふだん隠している嫌な気持ちが両方から出る。冗談の軽さはない。',
      trap: 'I wish は遠回しにも、同じ形の言い返しはじゃれ合いにも見えるが、ここは本音しか言えない場面。',
      use: 'Honestly, I wish you’d asked first.（正直、先に聞いてほしかった）' },

    { id: 'f1', skill: 'phrase', level: 'B2', point: 'takethis', seg: [34.4, 42.1],
      stem: 'What does “how far I can take this” mean?', ja: '“how far I can take this” はどういう意味？',
      choices: ['How long I can keep it up', 'How far I can travel', 'How many people really like it'], a: 0,
      choicesJa: ['どこまで続けられるか', 'どこまで遠くへ行けるか', '何人が好きか'],
      cue: '「Sometimes I wonder」のあと',
      line: 'Sometimes I wonder *how far I can take* this lovable goofball thing.',
      said: '「この愛されおバカキャラ、どこまで続けられるかな」と言う。',
      mean: 'take 〜 far ＝ 〜を押し通す、続ける。goofball ＝ おバカな人。',
      trap: 'far から、距離の話だと思いやすい。take this のあとの thing（キャラ）をどこまで続けるか。',
      use: 'How far can we take this joke?（この冗談、どこまで続ける？）' },

    // R fix: V2 (blind 60 %), S3: “fading with age” was a far miss; now the near miss “simply who they are”; the cue's
    //   “up” was a key-only word
    // why: unfair label ← “goofball” heard as a name others call him (a hurt reading); who they are ← “lovable” heard
    //   as sincere self-description, “take” and “thing” missed
    // anchor: 35.5–37.3 s “how far I can take this … thing”: you “take” an act you keep up, and “thing” names it as a
    //   routine; 37.5 s “Will I ever have to grow up?” asks whether it can go on
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'takethis', reveals: ['growup'], seg: [34.4, 42.1], retired: true,
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
    { id: 'h2', skill: 'humor', level: 'C1', point: 'charisma', reveals: ['idwant'], seg: [34.4, 47.5], retired: true,
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
      stem: 'Type what the speaker asks: “Will I ever ___?” (4 words)', ja: '書こう：“Will I ever ___?”（4語）',
      answer: 'have to grow up',
      cue: '「ever」のあと',
      line: 'Will I ever *have to grow up*?',
      said: '「いつか大人にならなきゃいけないのかな」と言う。',
      mean: 'have to は「ハフタ」と縮まる。grow up ＝ 大人になる。',
      trap: 'have to が一語に聞こえ、grow up だけ書きやすい。ever のあとの「ハフタ」を拾う。',
      use: 'Do I have to dress up?（ちゃんとした服じゃないとだめ？）' },

    { id: 's1', skill: 'sound', level: 'B2', point: 'idwant', seg: [36.75, 42.1],
      stem: 'Fill the gap: “If I did, ___ to be like you.”', ja: '空所に入るのは？ “If I did, ___ to be like you.”',
      choices: ['I’d want', 'I want', 'I’d have'], a: 0,
      choicesJa: ['〜したいだろう', '〜したい', '〜しなければならないだろう'],
      cue: 'If の文の後半',
      line: 'If I did, *I’d want* to be like you.',
      said: '「もし大人になるなら、君みたいになりたい」と言う。',
      mean: 'If のあとの仮の話なので I’d want。’d はごく短く、want とつながる。',
      trap: 'I want なら「アイワント」で「ド」がない。I’d have なら「ハヴ」。短い「ド」のあと「ワント」なら I’d want。',
      use: 'If I could, I’d want to stay.（できるなら、残りたいな）' },

    { id: 'g2', skill: 'gist', level: 'B2', point: 'end', seg: [40.6, 56.2],
      stem: 'Why is it suddenly an “emergency” at the end?', ja: '最後に、なぜ急に「緊急事態」になる？',
      choices: ['Someone they must avoid arrives', 'Someone gets sick from it', 'The juice turns out unsafe'], a: 0,
      choicesJa: ['会いたくない人が来た', '誰かが飲んで具合が悪くなった', 'ジュースが危ないと分かった'],
      cue: '最後に出てくる名前と、その人の条件',
      said: '「売らなければいい」と言った人が来たらしく、あわてて「緊急事態、行かなきゃ」と言う。',
      mean: 'emergency ＝ 緊急事態。売ってはいけない物を売っていたので、その人から逃げる。',
      trap: 'Poison Control（中毒の相談所）から、誰かが具合を悪くしたと思いやすい。そういう話は出ない。',
      use: 'Sorry, something came up. I have to go.（ごめん、急用ができた。行かなきゃ）' },

    { id: 'f2', skill: 'phrase', level: 'B2', point: 'aslongas', seg: [46, 52.9],
      stem: 'What does “as long as I didn’t sell it” mean?', ja: '“as long as I didn’t sell it” はどういう意味？',
      choices: ['Only if I didn’t sell it', 'While I was selling it', 'Even if I sold it'], a: 0,
      choicesJa: ['売らないならいい', '売っている間は', '売ってもいい'],
      cue: '「could still drink」のあと',
      line: 'She said I could still drink Lewb juice *as long as I didn’t sell it*!',
      said: '「売らなければ、まだ飲んでもいいって言ったのに！」と叫ぶ。',
      mean: 'as long as 〜 ＝ 〜さえすれば、〜するなら。条件つきの許可。',
      trap: 'long から「〜の間ずっと」と時間の話だと思いやすい。うしろに文が来たら条件。',
      use: 'You can stay as long as you’re quiet.（静かにしてるなら、いていいよ）' },

    { id: 'i3', skill: 'infer', level: 'C1', point: 'aslongas', seg: [46, 56],
      stem: 'What has the speaker probably been doing?', ja: 'この人は、たぶん何をしていた？',
      choices: ['Selling the juice', 'Drinking too much', 'Giving it away'], a: 0,
      choicesJa: ['ジュースを売っていた', '飲みすぎていた', 'タダで配っていた'],
      cue: '許可の条件と、すぐあとの emergency',
      line: 'as long as I didn’t sell it! — Guys, this is an *emergency*. We gotta go.',
      said: '「売らなければいいと言われた」と叫んで、すぐ「緊急事態、行かなきゃ」と言う。',
      mean: '条件は「売らないこと」。その人が来てあわてるので、売っていたと分かる。',
      trap: 'drink が先に聞こえるので、飲みすぎだと思いやすい。あわてる理由は条件の sell。',
      use: 'We weren’t supposed to do this.（これ、やっちゃいけなかったんだ）' },

    { id: 'a1', skill: 'attitude', level: 'B1', point: 'alarm', seg: [46, 56],
      stem: 'How does the speaker react to who is coming?', ja: '誰が来たか分かって、この人はどうする？',
      choices: ['Alarmed, wants to leave fast', 'Guilty, ready to say sorry', 'Happy to see her again'], a: 0,
      choicesJa: ['あわてて、すぐ逃げたい', '悪いと思って、謝るつもり', 'また会えてうれしい'],
      cue: '最初の叫びと、最後の一言',
      line: '*Oh, my God. No.* … this is an *emergency*. We gotta go.',
      said: '「うそ、やめて」と言い、「緊急事態。行かなきゃ」と続ける。',
      mean: 'We gotta go ＝ 行かなきゃ。会いたくない人が来た驚きとあせり。',
      trap: 'Oh my God は喜びにも使う。続く No と We gotta go で、逃げたいと分かる。',
      use: 'Oh no. We need to go, now.（やばい。今すぐ行かないと）' },
  ]
};
