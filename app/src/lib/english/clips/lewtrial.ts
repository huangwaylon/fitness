// REVIEW 2026-11-17: pass 9, fix 14, drop 1, new 0; ear checks 2
// “Lewbert, Guppy, and Chuck RETURN to iCarly | Full Scene | NickRewind” (NickRewind, Best of iCarly): a mock trial.
// Lewbert sues Carly: he cross-examines Freddie, then Guppy and Chuck; Carly's side calls Mrs. Benson, who melts when
// Lewbert woos her, and Lewbert ends by asking for even more.
// Segments from the captions, words from whisper (2026-11-17). The man questioning Freddie, Guppy and Chuck isn't named
// while he does it, so stems call him "the questioner"; the cross-examiner after "Lewbert, the witness is all yours" is
// Lewbert. Spencer is named ("Spencer, you gotta…", "Spencer, get it together"), Guppy ("Hi, Guppy") and Mrs. Benson
// ("Wow, Mrs. Benson"). The speaker of "Spencer, you gotta do something" isn't named, so no stem names her. Left out:
// "It ain't called the Weeternet" (captions "wernet"), the film quotes ("What's in the box?", "You can't handle the
// truth!"), the wart line and the kiss, and the last line (299–340 s).
// EAR CHECK: 316.4 s r1 — the cut falls after "dropping the case" and before "Wrong again"
// EAR CHECK: 76.2–76.7 s s1 — captions "you got to", whisper "you gotta": the key assumes the reduced "gotta"
import type { Clip } from '../types.ts';

export const lewTrial: Clip = {
  id: 'lewtrial', video: 'lbKEes-DX40', title: 'Lewbert, Guppy, and Chuck RETURN to iCarly', dur: 358, wpm: 123,
  band: 'slow', tags: ['友だち'],
  show: 'iCarly',
  credit: 'iCarly (NickRewind, official YouTube channel)',
  questions: [
    // why: agrees politely ← the Japanese frame: "いいえ" to a negative question can mean agreement; avoids ← he
    //   is cut off right after, so the answer can sound unfinished
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'horrific', seg: [12.9, 17.4],
      stem: 'Asked “Pretty horrific, wouldn’t you say?”, how does Freddie answer?',
      choices: ['He disagrees, plainly and at once', 'He agrees, though in a polite way', 'He avoids giving a clear answer'],
      a: 0,
      cue: '最初の短い一語と、そのあとの助動詞。',
      line: '*No, I wouldn’t.*',
      said: '「かなりひどいよね？」に「いや、思わない」と即答する。',
      mean: 'No, I wouldn’t ＝「そうは言わない」。No は中身への反対。',
      trap: '日本語では否定の問いに「いいえ」で同意できるが、英語の No は中身の否定。',
      use: 'No, I wouldn’t say that.（いや、そうは思わないな）' },

    // R fix: V2 (blind 60 %): the key was the only choice about Carly; all three now name both, and "run the show"
    //   became the unrequited-love keyword trap
    // why: worst moments his idea ← "none of it was your idea" / "your fault" are said, but the questioner waves them
    //   off; still hopes ← "deep, unrequited love" is asked about, but only on the way to "all for whose benefit?"
    { id: 'g1', skill: 'gist', level: 'B2', point: 'used', seg: [12.9, 73.3],
      stem: 'What is the man questioning Freddie trying to show?',
      choices: ['That Carly has used Freddie for her own gain', 'That the show’s worst moments were Freddie’s idea',
                'That Freddie still hopes Carly will love him back'], a: 0,
      cue: '問いかけの最後が、毎回どこへ向かうか。',
      said: '番組名、片思い、今の仕事と聞き、最後に「全部誰のため？」と問う。',
      mean: '重ねた質問で「Carly に利用されてきた」と本人に認めさせる誘導尋問。',
      trap: 'your idea や producing は途中の言葉。問いが最後にどこへ着くかで判断。',
      use: 'No further questions.（質問は以上です）' },

    // R fix: V2 (blind 55 %): "wouldn't even discuss" was an extreme filler; now a "never discussed" near miss
    // why: never discussed ← "discuss" is said, but in "we actually did discuss it"; like another show ← the usual
    //   reason a name gets dropped (the script trap)
    { id: 'd1', skill: 'detail', level: 'B1', point: 'whyname', seg: [27.3, 32.45],
      stem: 'Asked about another possible name for the show, what reason does Freddie give?',
      choices: ['It didn’t do well when tested', 'They never really discussed it', 'It sounded like another show'], a: 0,
      cue: '「discuss it」のあと、but に続く部分。',
      line: 'We actually did discuss it, but apparently it *tested poorly*.',
      said: '「話し合ったけど、どうやら評判が悪かったらしい」と答える。',
      mean: 'test poorly ＝ 試してみて反応が悪い。名前の案が落ちた理由。',
      trap: 'discuss が聞こえても、did discuss は「ちゃんと話した」の意味。did は強めの印。',
      use: 'We tried it, but it tested poorly.（試したけど、反応がいまいちだった）' },

    // R drop: m1 ("apparently"): the stem named the word, so knowing it answered the item without the audio (V1,
    //   blind 80 %); i1 already turns on the same line
    // why: viewers ← "tested" calls up a survey or test audience; network bosses ← who usually kills a show's name
    { id: 'i1', skill: 'infer', level: 'B2', point: 'tested', reveals: ['whyname', 'apparently'], seg: [29.5, 35.2],
      stem: 'From his answer to “With who?”, who really turned the name down?',
      choices: ['Carly, on her own', 'A group of viewers', 'The TV network bosses'], a: 0,
      cue: '「With who?」への、ひと言の答え。',
      line: 'apparently it tested poorly. — With who? — *Carly.*',
      said: '「評判が悪かった」と言うが、「誰に？」と聞かれて「Carly に」と答える。',
      mean: '「テストした」と言っても、実は Carly 一人が反対しただけ。大げさな言い方の中身がばれる。',
      trap: 'tested から視聴者の調査を想像しやすいが、名前は一人だけ。',
      use: 'It tested poorly with my mom.（母にはウケなかった）' },

    // why: loved her less ← the questioner's "unrequited" is about him, so "requited" seems to be too; wanted to quit
    //   ← "requited" holds the sound of "quit"
    { id: 'f1', skill: 'phrase', level: 'C1', point: 'requited', seg: [37.6, 46.6],
      stem: 'Asked whether his love for Carly was one-sided, what does Freddie claim?',
      choices: ['At times she loved him back', 'At times he cared for her less', 'At times he wanted to quit'], a: 0,
      cue: '「unrequited」に答える、よく似た形の一語。',
      line: 'It was *occasionally requited*.',
      said: '「片思いでは？」に「たまには報われた」と返す。',
      mean: 'requited ＝ 想いが返された。相手の unrequited から un を外して言い返す。',
      trap: 'requited は quit に似て聞こえる。un の有無で意味が反対になる。',
      use: 'My love was finally returned.（やっと想いが通じた）' },

    // R fix: V2 (blind 75 %): the stem pointed at "the last word"; it now asks what he concedes, and one near miss
    //   moves the pity to Freddie
    // why: he pitied her ← "pity" heard as his feeling, after "I threw myself in front of a taco truck" (right word,
    //   wrong person); only looked ← "go off of how it sounds and looks" heard as appearances only (scope)
    // anchor: 51.3–56.1 s "how it sounds and looks and is, then yes": "is" goes past appearances, and "yes" accepts
    //   the questioner's "more like pity"
    { id: 'c1', skill: 'infer', level: 'C2', point: 'pity', seg: [46.4, 56.6],
      stem: 'Told it sounds “more like pity”, what does Freddie concede?',
      choices: ['That Carly’s kindness to him was really pity', 'That he pitied Carly more than he loved her',
                'That it only looked like pity from outside'], a: 0,
      cue: '「then yes」の前に並べる3つの語の、最後。',
      line: 'if you’re gonna go off of how it *sounds and looks and is*, then yes.',
      said: '「聞こえ方、見え方、実際どうかで判断するなら、そうだね」と認める。',
      mean: 'sounds と looks は見かけ、is は事実。is を足したことで、言い逃れのふりをしつつ全部認めている。',
      trap: 'if のせいで条件つきの譲歩に聞こえるが、条件に事実まで入れたら逃げ道はない。',
      use: 'Going by the facts? Then yes.（事実で言えば、そうだね）' },

    // anchor: 50.6–51.2 s "go off of" in both sources, at full speed between "gonna" and "how"
    { id: 'c2', skill: 'dict', level: 'C2', point: 'gooff', reveals: ['pity'], seg: [49.1, 52.35],
      stem: 'Type the words: “Well, if you’re gonna ___ how it sounds…” (3 words)', answer: 'go off of',
      cue: '「gonna」のすぐあと、「how」の前。',
      line: 'if you’re gonna *go off of* how it sounds',
      said: '「〜で判断するなら」の部分。go off of の3語が一息に続く。',
      mean: 'go off (of) ＝ 〜を根拠にする。of は文法上なくてもいいが、会話ではよく足される。',
      trap: '習った形に合わせて of を消したくなる。書き取りは聞こえた語を書く。',
      use: 'Going off of the map, we’re close.（地図で見る限り、もうすぐだ）' },

    // R fix: V2 (blind 60 %): "Oh, God…" in the stem marked the feeling as bad; neutral stem, and a "proud" reading
    //   of doing it all for Carly
    // why: proud ← "all for Carly" read as loyalty (尽くす as a virtue); annoyed ← he was cut off earlier in the scene,
    //   but here he answers "Carly" himself and turns on himself
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'become', reveals: ['used'], seg: [61.1, 73.3],
      stem: 'After Freddie answers the last question, how does he feel?',
      choices: ['Dismayed at how much he does for Carly', 'Proud of how loyal he has been to Carly',
                'Annoyed that the man keeps cutting him off'], a: 0,
      cue: '「Oh, God」に続く、自分への問いかけ。',
      line: 'all for whose benefit? — Carly. — Oh, God. *What has become of me?*',
      said: '「全部誰のため？」に「Carly」と答え、「僕はどうなっちゃったんだ」と言う。',
      mean: '自分で答えて、ずっと Carly のために動いてきたと気づき、がっくりしている。',
      trap: '「全部 Carly のため」は日本語なら美談に聞こえるが、続く自分への問いは嘆き。',
      use: 'Ugh, what have I become?（うわ、私どうなっちゃったの）' },

    // why: gonna ← same vowel, only the middle sound differs; oughta ← also a flapped "-tta" ending; wanna ← a common
    //   reduction that fits the gap
    { id: 's1', skill: 'sound', level: 'B2', point: 'gotta', seg: [74.9, 79.4],
      stem: 'Fill the gap: “Spencer, you ___ do something.”',
      choices: ['gotta', 'gonna', 'oughta', 'wanna'], a: 0,
      cue: '「Spencer」の直後、「do」の前の短い音。',
      line: 'Spencer, *you gotta* do something.',
      said: '「Spencer、なんとかして」と頼む。gotta は got to の縮まった形。',
      mean: 'gotta ＝ 〜しなきゃ。t が弾んで「ガラ」に近い。',
      trap: 'gonna とは真ん中の音だけが違う。「ラ」なら gotta、「ナ」なら gonna。',
      use: 'You gotta try this place.（この店、絶対行ってみて）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'side', seg: [74.9, 79.6],
      stem: 'Type the request: “Get Freddie ___.” (4 words)', answer: 'back on our side',
      cue: '「Get Freddie」のあと、文の終わりまで。',
      line: 'Get Freddie *back on our side*.',
      said: '「Freddie をこっちの味方に戻して」と頼む。',
      mean: 'on our side ＝ 私たちの味方。get ～ back で「引き戻す」。',
      trap: 'on と our がつながり「オナワ」と一語に聞こえやすい。',
      use: 'Are you on my side or not?（味方なの、どっちなの）' },

    // why: a break ← "permission" sounds like a procedural request; objecting ← "Your Honor" opens most objections
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'hug', seg: [79.3, 84.6],
      stem: 'What is Spencer doing with his request to the judge?',
      choices: ['Trying to win Freddie back with kindness', 'Asking for a short break so Freddie can rest',
                'Objecting to how Freddie was questioned'], a: 0,
      cue: '「permission to」のあと、何をしたいと言うか。',
      line: 'Your Honor, permission to *wrap the witness in a warm hug*.',
      said: '裁判官に「証人を温かく抱きしめる許可を」と求める。',
      mean: '法廷の決まり文句をまねて、Freddie を優しさで味方に戻そうとしている。',
      trap: 'Your Honor や permission で正式な異議に聞こえるが、中身は「ハグさせて」。形より中身を聞く。',
      use: 'Permission to sit down? My feet hurt.（座ってもいい？足が痛くて）' },

    // why: some ← the questioner repeats "some of the time" twice right after; all ← Guppy is defending Gibby
    { id: 'n1', skill: 'number', level: 'B1', point: 'most', seg: [118.3, 121.55], keep: true,
      stem: 'How often, says Guppy, did Gibby want to do the stunts?',
      choices: ['Some of the time', 'Most of the time', 'All of the time'], a: 1,
      cue: '「stunts」のすぐあと。',
      line: 'Gibby wanted to do those stunts *most of the time*.',
      said: 'Gibby はあのスタントを「たいてい」やりたがっていた、と答える。',
      mean: 'most of the time ＝ たいてい。Carly たちをかばう答え。',
      trap: 'このあと質問者が some of the time を繰り返すので、そちらが残りやすい。',
      use: 'I cook at home most of the time.（たいてい家で料理する）' },

    // R fix: V2 (blind 70 %): the key was the only twist; the distractors are now a record-keeping keyword trap and
    //   Guppy's own, pro-Carly reading of his answer
    // why: asks to repeat ← "Let the record show" and "most of the time" said twice; by choice ← what Guppy meant,
    //   which the questioner flips
    { id: 'i2', skill: 'infer', level: 'B2', point: 'twist', reveals: ['most'], seg: [118.3, 130.4],
      stem: 'What does the questioner do with Guppy’s answer?',
      choices: ['Uses the other side of it against Carly', 'Asks Guppy to repeat it for the record',
                'Points out that Gibby did the stunts by choice'], a: 0,
      cue: '「Aha!」のあと、言い換え方に注目。',
      line: '*Most* of the time. *Which means some of the time* he didn’t want to do them.',
      said: '「たいてい」を「ということは、やりたくない時もあった」と言い換え、記録に残させる。',
      mean: '同じ事実の裏側だけを取り出して、Carly に不利な証言に変えている。',
      trap: 'record は記録に残す決まり文句。Guppy に聞き直してはいない。',
      use: 'So you’re saying sometimes you don’t?（つまり、そうじゃない時もあるってこと？）' },

    // R fix: V2 (blind 50 %, right): the key was the only choice about his answer, and "any of the questions" an
    //   absolute; all three are now about the answer
    // why: unfair to his brother ← the questioner talks about Gibby's suffering; enjoyed answering ← "I liked it
    //   better when…" heard the wrong way round
    { id: 'h2', skill: 'humor', level: 'C1', point: 'guppy', reveals: ['twist', 'most'], seg: [121.9, 134.9],
      stem: 'Why does Guppy’s “I liked it better when…” line get a laugh?',
      choices: ['His answer only made things worse for his side', 'He feels his answer was unfair to his brother',
                'He enjoyed answering more than saying hello'], a: 0,
      cue: '「happy birthday」と言っていた最初と、今の比較。',
      line: '*I liked it better when I just said happy birthday.*',
      said: '「ハッピーバースデーと言ってただけの方がよかった」とつぶやく。',
      mean: '素直な答えが不利な記録にされた。あいさつだけの方がまし、という嘆き。',
      trap: 'liked it better when… は「〜の方がましだった」。どちらが上か、比べる向きを聞く。',
      use: 'I liked it better when we didn’t know.（知らなかった頃の方がよかった）' },

    // R fix: V2 (blind 60 %): "every one" was an absolute, and Carly did them was weak; now a "to Carly" near miss
    // why: made up ← "Liar!" alone means "you made it up"; to Carly ← Carly is named in the charges just before
    { id: 'i3', skill: 'infer', level: 'B2', point: 'liar', seg: [175.8, 183.7],
      stem: 'What does Spencer claim when he shouts back at Chuck?',
      choices: ['Chuck did those things to him, not the reverse', 'Chuck did those things to Carly, not to him',
                'Chuck made up all of the things he said'], a: 0,
      cue: '「Liar!」のすぐあと、主語と目的語。',
      line: 'Liar! *You did all that stuff to me!*',
      said: '「嘘つき！全部お前が僕にやったんだ！」と言い返す。',
      mean: '話を作ったというより、やった側とやられた側が逆だと言っている。',
      trap: 'Liar! だけ聞くと「全部作り話」と取りやすい。続く you…to me で、誰が誰にしたかを聞く。',
      use: 'No, it was the other way around.（いや、逆だよ）' },

    // R fix: V2 (blind 70 %): the literal "throw"/"game" fillers were absurd; now "throw a game" (lose on purpose)
    //   and the "cutest little angel" sympathy act
    // why: give up on purpose ← "throw the game" = lose on purpose; feel sorry ← Chuck is brought on as "the cutest
    //   little angel", and he plays the victim
    { id: 'f4', skill: 'phrase', level: 'B2', point: 'offgame', seg: [182.0, 186.3],
      stem: 'According to the warning Spencer gets, why was Chuck brought in?',
      choices: ['To make Spencer lose his focus', 'To make Spencer give up on purpose', 'To make Spencer feel sorry for him'],
      a: 0,
      cue: '「brought Chuck here to」のあと。',
      line: 'He brought Chuck here to *throw you off your game*.',
      said: '「Chuck はあなたを動揺させるために呼ばれた」と注意される。',
      mean: 'throw ～ off one’s game ＝ 調子を狂わせる。',
      trap: 'throw the game（わざと負ける）に似るが、off があれば「調子を崩す」。',
      use: 'Don’t let him throw you off your game.（あいつにペースを乱されないで）' },

    // R fix: K6: "never once… in person" was an absolute only in a distractor
    // why: never met ← "the one person" heard as "someone new"; worked with him ← she knows the building, so a
    //   coworker seems likely
    { id: 'd4', skill: 'detail', level: 'B1', point: 'plan', seg: [222.0, 229.8],
      stem: 'Asked about the plan, who does the answer say has been called in?',
      choices: ['Someone who hates Lewbert as much as they do', 'Someone who has never met Lewbert before',
                'Someone who used to work with Lewbert'], a: 0,
      cue: '「called up the one person」のあと。',
      line: 'I have called up the one person who *hates Lewbert as much as we do*.',
      said: '「私たちと同じくらい Lewbert を嫌う人を呼んだ」と答える。',
      mean: 'as much as we do の do は hate の繰り返しを省いた形。',
      trap: 'the one person を「知らない人」と取ると外れる。ここは「ただ一人の人」。',
      use: 'She loves pizza as much as I do.（彼女も私と同じくらいピザ好き）' },

    // R fix: V2 (blind 60 %) and K5: only the key had no reason; all three now give one
    // why: better ← "no longer want to sue… for $1 million" sounds like a win; even ← no verdict is heard
    { id: 'g2', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['more'], seg: [222.0, 324.2],
      stem: 'How do things stand for Carly’s side by the end?',
      choices: ['Worse, since he now asks for even more', 'Better, since he drops the money claim',
                'Even, since the judge hasn’t ruled yet'], a: 0,
      cue: '最後の証人のあとの一言と、最後の要求。',
      said: '頼みの証人も味方でなくなり、相手の要求はさらに大きくなる。',
      mean: '「最後の望みだった」「もうおしまい」という言葉どおり、状況は悪くなる一方。',
      trap: 'dropping the case が聞こえて好転と取りやすいが、すぐに「もっと欲しい」と返される。',
      use: 'Well, that backfired.（うわ、裏目に出た）' },

    // R fix: V2 (blind 60 %): the distractors were the only accidents with a made-up "told off"; now both accidents
    //   are things "Nailed it" rules out
    // why: mixes up ← a changed name sounds like a slip; swears by accident ← "hell" in court
    { id: 'h4', skill: 'humor', level: 'C1', point: 'bushhell', seg: [236.1, 245.5],
      stem: 'Why does Mrs. Benson’s line about the building get a laugh?',
      choices: ['She twists its name into a pun she planned', 'She mixes up its name and doesn’t notice',
                'She swears by accident and is embarrassed'], a: 0,
      cue: '建物の名前の、後半の音。',
      line: 'He turned the *Bushwell* into the *Bush hell*.',
      said: '「Bushwell を Bush hell にした」と言い、自分で「決まった」と喜ぶ。',
      mean: 'well を hell（地獄）に変えるだじゃれ。用意してきたのが Nailed it で分かる。',
      trap: '言いそこないと取りやすいが、本人は得意げ。',
      use: 'Nailed it!（バッチリ決まった！）' },

    // R fix: V2 (blind 70 %): both distractors were fillers; now "once mine" = my witness, and a never-met reading
    // why: on his side ← "she was once mine" heard as "my witness"; never met ← "Hello, Marissa" heard as a first
    //   greeting
    { id: 'h3', skill: 'humor', level: 'C1', point: 'mine', seg: [251.1, 258.8],
      stem: 'Why is Lewbert’s reply to “the witness is all yours” funny?',
      choices: ['He turns a court phrase into talk of old love', 'He claims the witness used to be on his side',
                'He acts as if he has never met the witness'], a: 0,
      cue: '「all yours」と「mine」のつながり。',
      line: 'the witness is *all yours*. — Oh, she was *once mine*, wasn’t she?',
      said: '「証人はどうぞ」に「彼女はかつて僕のものだった」と返す。',
      mean: 'all yours は「お好きにどうぞ」の決まり文句。それを恋の mine で受けている。',
      trap: 'mine を「自分側の証人」と取りやすいが、続く口説き文句で恋の話と分かる。',
      use: 'The bathroom’s free. It’s all yours.（トイレ空いたよ、どうぞ）' },

    // R fix: V2 (blind 60 %): "fall down in front of" was absurd and "twist" gave the game away; it now asks what
    //   his reply means, with "fall for" = be tricked as the near miss; the segment takes in "nursed me back"
    // why: tricked him ← her "falling for it" = be tricked, carried over; trusted ← "fell for" heard as "fell for a
    //   lie", i.e. let down
    { id: 'f7', skill: 'phrase', level: 'C1', point: 'fell', seg: [268.8, 277.7],
      stem: 'What does Lewbert mean by his answer to “I’m not falling for it”?',
      choices: ['That he fell in love with her', 'That she once tricked him too', 'That he trusted her and got hurt'], a: 0,
      cue: '断りの言葉と、すぐあとの返事に同じ動詞。',
      line: 'I’m not *falling for it*. — But I *fell for you*.',
      said: '「その手には乗らない」に「でも僕は君を好きになった」と返す。',
      mean: 'fall for it ＝ だまされる、fall for you ＝ 好きになる。同じ形で意味を変える。',
      trap: 'fall for it（だまされる）につられやすいが、続く思い出話は恋の話。',
      use: 'Don’t fall for that old trick.（その古い手に引っかからないで）' },

    // why: $100,000 ← "hundred" is a common lead-in for big sums; $10 million ← "one" is weak and short
    { id: 'n2', skill: 'number', level: 'B1', point: 'amount', seg: [308.0, 314.5], keep: true,
      stem: 'What sum does Lewbert name to the judge?',
      choices: ['$100,000', '$1 million', '$10 million'], a: 1,
      cue: '「Carly Shay for」のあと。',
      line: 'I no longer want to sue Miss Carly Shay for *$1 million*.',
      said: '「100万ドルで訴えるのは、もうやめる」と言う。',
      mean: 'a million ＝ 100万。sue A for ～ ＝ ～を求めて A を訴える。',
      trap: 'one は弱く短いので、ten や hundred を補いやすい。',
      use: 'They sued the company for damages.（会社に損害賠償を求めて訴えた）' },

    // R fix: V2 (blind 85 %): a twist was the only non-polite move; now three "not over" moves. Broken characters in
    //   mean repaired
    // why: a condition ← "no longer want to sue" heard as a deal on offer; sue Spencer ← "sue Miss Carly Shay" heard
    //   with the stress on Carly
    // EAR CHECK: the cut at 316.4 s must fall before "Wrong again"
    { id: 'r1', skill: 'predict', level: 'B2', point: 'more', reveals: ['amount'], seg: [308.0, 316.4],
      then: [316.4, 324.2],
      stem: 'After “Thank God, he’s dropping the case,” what kind of reply comes next?',
      choices: ['A correction: he wants more than that', 'A condition: he’ll drop it for an apology',
                'A warning: he’ll sue Spencer instead'], a: 0,
      cue: '安心した一言のあと。相手がどんな人か考えて。',
      line: 'Thank God, he’s dropping the case. — *Wrong again*… *I just want more*.',
      said: '「よかった、取り下げるのね」の直後、「また外れ。もっと欲しい」と返される。',
      mean: '「100万ドルで訴えるのはやめる」は、金額を変える前ふり。',
      trap: 'no longer want だけで取り下げと思いやすい。何をやめるのか、文の最後まで聞く。',
      use: 'Wait, it gets worse.（待って、まだ続きがあるの）' },
  ]
};
