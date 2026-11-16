// REVIEW 2026-11-16: pass 4, fix 20, drop 0, new 0; ear checks 0
// “Leslie's ex has the audacity and a gun ft. Louis C.K. | Parks and Recreation” (the official Parks and Recreation
// channel, Season 4): at dinner with Leslie and Ben, her ex Dave, a cop, says he's still in love with her and keeps
// trying to get her alone, while Ben tries to stay polite.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 263 s (the end is a visual gag).
// Untested: the "Wiz Palace" exchange (29–36 s; captions and whisper garble who calls it that), "How's work out there,
// Dave?" (81 s; whisper "Dick", captions "da") and "you're contrioring me / I don't think that's a word" (229 s; the
// word itself is garbled). No predict item (no clean pause before a projected move).
// EAR CHECK: none (every key's words agree in both sources; a3's tone is carried by the stammer, in both)
import type { Clip } from '../types.ts';

export const daveex: Clip = {
  id: 'daveex', video: 'n0_sMwMn3os', title: 'Leslie\'s ex has the audacity and a gun ft. Louis C.K.', dur: 285, wpm: 185,
  band: 'fast', tags: ['恋愛', '店・レストラン'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 90 %): the key was the only choice about Leslie; all three now fit an ex at a polite dinner
    // why: friend ← Dave is friendly to Ben and thanks him "man to man" at the end; happy for her ← the gracious-ex
    //   script, and he praises her at the start
    { id: 'g1', skill: 'gist', level: 'B2', point: 'want', reveals: ['love'], seg: [0, 70.2],
      stem: 'What does Dave want from this evening?',
      choices: ['Some time alone with Leslie, without Ben', 'A chance to get to know Ben as a friend',
                'A chance to show Leslie he’s happy for her'], a: 0,
      cue: 'ベンが席を立ったあとの、デイブの話。',
      said: 'ベンがいない間に気持ちを打ち明け、二人きりで話させてほしいと何度も頼む。',
      mean: '表向きは感じよくしているが、目的はレスリーを取り戻すこと。',
      trap: '冒頭のほめ言葉で、感じのいい元恋人に見えやすい。ベンがいない間の頼みごとを聞く。',
      use: 'Can we talk alone for a minute?（ちょっと二人で話せる？）' },

    // R fix: V2 (blind 60 %): the two distractors were weak; now both misread the "Oh, Ben" moment
    // why: cut short ← Leslie's "Oh, Ben" lands right after the compliments; mocked ← "you can say that again" read as
    //   sarcasm
    { id: 'h1', skill: 'humor', level: 'B2', point: 'first', seg: [4.6, 17.6],
      stem: 'Why does the audience laugh at “I said my thing first”?',
      choices: ['The men are competing to praise her', 'Leslie cut a man’s compliment short',
                'A man thinks his compliment was mocked'], a: 0,
      cue: 'ほめ言葉が何回、誰に向くか。',
      line: '…you’re a real smart lady. — …If anything, I’m holding her back. — *I said my thing first.*',
      said: 'ほめ合いが、いつの間にかレスリーをどちらが上手にほめるかの競争になる。',
      mean: '「先に言ったのは俺だ」で、張り合っていたことがはっきりする。',
      trap: 'Oh, Ben で話を切られた、からかわれたと取りやすい。ほめ言葉が誰に向いているかを追う。',
      use: 'Hey, I said it first!（ちょっと、先に言ったのは僕だよ）' },

    // R fix: K5/V2 (blind 55 %): two distractors meant the same thing ("say it again" / "didn't catch"); one is now doubt
    // why: say it once more ← "say that again" taken literally; not so sure ← "Uh" heard as hesitation, as in Japanese
    //   「えーと、それは…」
    { id: 'ph1', skill: 'phrase', level: 'B2', point: 'sayagain', seg: [9.4, 15.9],
      stem: 'After Leslie is called “a real smart lady”, what does the reply mean?',
      choices: ['I totally agree with that', 'Could you say that once more', 'I’m not so sure about that'], a: 0,
      cue: '「Uh,」のあとの決まり文句と、次の一文。',
      line: 'Uh, *you can say that again*. If anything, I’m holding her back.',
      said: '「ほんとそれ。むしろ僕が足を引っぱってるくらい」と返す。',
      mean: 'You can say that again ＝ 全くその通り。強い同意の決まり文句。',
      trap: '文字どおり「もう一度」と取ったり、Uh を迷いと取ったりしやすい。続く文が同意の中身。',
      use: 'You can say that again.（ほんと、その通り）' },

    // R fix: V2 (blind 70 %): theft / job were off-topic; both distractors are now campaign errands
    // why: permit ← a campaign errand at a city office; invite ← "Chief" caught, but not what they want from him
    { id: 'd1', skill: 'detail', level: 'B1', point: 'endorse', seg: [17.45, 21.6],
      stem: 'Why were Leslie and Ben at the police station today?',
      choices: ['To get the chief to back her', 'To get a permit for a rally', 'To invite the chief to a rally'], a: 0,
      cue: '「We’re trying to」のあと。', line: 'We’re trying to get *Chief Trumple’s endorsement*.',
      said: '「だから今日は警察署に行ってたの。トランプル署長の推薦がほしくて」と言う。',
      mean: 'endorsement ＝ 選挙での推薦・支持。署長に応援してもらいたい。',
      trap: '選挙の話なので、集会の手続きや招待を思い浮かべやすい。get のあとの名詞を聞く。',
      use: 'We’re hoping to get her endorsement.（彼女の推薦がほしいと思ってる）' },

    // R fix: V2 (blind 75 %): rebalanced; the distractors now misread "he was" and the favor's direction. N7: its line shows
    //   the endorsement d1 asks about, so it reveals `endorse`
    // why: already backs ← "he was… endorse you" heard without "probably get him to"; put in a word ← the favor's
    //   direction flipped (Dave's own job comes up later)
    { id: 'i1', skill: 'infer', level: 'B2', point: 'buddy', reveals: ['endorse'], seg: [21.45, 25.85],
      stem: 'What is Dave offering when he mentions the chief?',
      choices: ['To use his old friendship to help her', 'To say the chief already backs her',
                'To ask her to put in a word for him'], a: 0,
      cue: '「buddy of mine」のあとの一文。', line: 'He was a *buddy of mine*. I’d probably *get him to endorse you*.',
      said: '「署長は昔の仲間だから、たぶん推薦させられるよ」とデイブが言う。',
      mean: '自分のコネを使ってレスリーを助けられる、と申し出ている。',
      trap: 'He was から「もう推薦している」と取りやすい。probably get him to ＝ これから頼めば。',
      use: 'I can probably get him to help.（たぶん彼に手伝わせられるよ）' },

    // R fix: V2 (blind 85 %): "angry" was off; the distractors now turn on "were" and "with me"
    // why: once ← "you were" heard as past, "still" lost; someone new ← "in love" caught without "with me"
    { id: 'd2', skill: 'detail', level: 'B1', point: 'love', seg: [39.6, 50.2],
      stem: 'What does Leslie ask whether Dave just said?',
      choices: ['That he’s still in love with her', 'That he was once in love with her',
                'That he’s now in love with someone new'], a: 0,
      cue: '「Did you just say」で始まる問い。', line: 'Did you just say you were *still in love with me*?',
      said: '「今、まだ私を愛してるって言った？」とレスリーが聞き返す。',
      mean: 'デイブはごまかすが、言ったことをレスリーが言葉にして確かめている。',
      trap: 'were を過去と取り、still を聞き落とすと「昔は」の話になる。still と with me まで聞く。',
      use: 'Wait, did you just say that?（待って、今それ言った？）' },

    // R fix: V2 (blind 80 %): "make peace with Ben" was weak; now "wait until Ben is gone", the literal reading of her no
    // why: wait ← "not… when my boyfriend is here" read as "later, then"; campaign ← "endorse" comes up again and again
    { id: 'g2', skill: 'gist', level: 'B2', point: 'leslie', reveals: ['weregood', 'candidates'], seg: [39.6, 137.1],
      stem: 'Through the dinner, what does Leslie keep wanting from Dave?',
      choices: ['For him to drop it and back off', 'For him to wait until Ben is gone', 'For him to back her campaign'], a: 0,
      cue: '彼女の No の数と、断り方。',
      said: '打ち明けられた話を、今ここではやめてと言い、外へ誘われても断り続ける。',
      mean: '推薦の話が出ても、彼女の願いは話を持ち出さず引き下がってもらうこと。',
      trap: '「彼氏がいる時はだめ」を「いない時ならいい」と取りやすい。二人きりの誘いにも No と言う。',
      use: 'Please just drop it.（その話はもうやめて）' },

    // R fix: S4: the seg ended inside the second "nothing"; now 42.45–44.5
    { id: 'x1', skill: 'dict', level: 'B1', point: 'whatdid', seg: [42.45, 44.5],
      stem: 'Type Leslie’s question: “___?” (5 words)', answer: 'what did you just say',
      cue: '急な一言のあと、驚いて聞き返す。', line: '*What did you just say?* — Nothing.',
      said: '「今、何て言った？」と聞き返す。',
      mean: 'what did you が「ワッディジュ」と一つになる。驚いて確かめる決まった言い方。',
      trap: 'did と you がつながって、did が聞こえにくい。just の t も消えやすい。',
      use: 'Sorry, what did you just say?（ごめん、今何て言った？）' },

    // R fix: V2 (blind 65 %): the key was the only "clever" reading; seg now starts at his "five minutes" request
    // why: step away ← "get rid of him" misheard as "me"; never said ← he did play dumb a moment earlier ("Nothing
    //   was said")
    { id: 'h3', skill: 'humor', level: 'C1', point: 'ridof', seg: [58.3, 70.2],
      stem: 'Why is Dave’s answer to “you cannot bring this up” funny?',
      choices: ['He takes her “no” as a problem to fix', 'He offers to step away so she can relax',
                'He acts as if he never said a thing'], a: 0,
      cue: '「boyfriend is here」への返事と、自分へのほめ言葉。',
      line: 'Okay, well, *get rid of him*. That’s a good call. — No, bad call.',
      said: '「彼氏の前で言わないで」に「じゃあ彼を追い払おう。名案だ」と返す。',
      mean: '断られたのに、邪魔者をどかせばいいと考え、自分の案を自分でほめている。',
      trap: 'him を me と聞くと、自分が去る話に聞こえる。誰を get rid of するかを聞く。',
      use: 'That’s a good call.（それはいい判断だね）' },

    // R fix: S4: the seg missed Dave's "while he's in the Wiz Palace", the name Ben is trying to top; now from 66.2
    // why: wrong room ← "another… name for the bathroom" heard as confusion; hinting ← his return read as a cue for
    //   Dave to go
    { id: 'h2', skill: 'humor', level: 'C1', point: 'manor', seg: [66.2, 80.6],
      stem: 'Why is Ben’s comment on his return funny?',
      choices: ['He’s trying to top Dave’s private joke', 'He’s mixing up which room is the bathroom',
                'He’s hinting that Dave should leave now'], a: 0,
      cue: '戻ってきた一言と、「another」「I thought of」。',
      line: 'It’s *another funny name for the bathroom* that *I thought of*.',
      said: '戻るなり、トイレの新しいあだ名を言い、自分で考えたと説明する。',
      mean: 'デイブとレスリーの呼び名に負けまいと、自分の呼び名を作ってきた。',
      trap: 'bathroom が聞こえると場所の話に取りやすい。another と I thought of が対抗の合図。',
      use: 'I came up with that myself.（それ、自分で考えたんだ）' },

    // why: 12:50 ← fifteen and fifty differ mostly in stress; 12:05 ← "twelve…" caught, the rest lost
    { id: 'n2', skill: 'number', level: 'B1', point: 'flight', seg: [87.6, 93.75],
      stem: 'What time is Dave’s flight tomorrow?',
      choices: ['12:05', '12:15', '12:50'], a: 1, keep: true,
      cue: '「on the」のあと、flight の前。', line: 'I’m scheduled to leave tomorrow on the *12:15* flight…',
      said: '「明日の12時15分の便で、ソルトレイク経由で帰る予定」と言う。',
      mean: 'twelve fifteen と言う。fifteen は後ろの「ティーン」を強く長く言う。',
      trap: 'fifteen と fifty は強さの位置で分かれる。後ろが伸びればティーン。',
      use: 'I’m on the 12:15 flight.（12時15分の便です）' },

    // R fix: V2 (blind 50 %) and S1: "Why might he be coming back" didn't match the key; the stem now asks what he's
    //   in town for, and both distractors use "Trumple"
    // why: help run ← "Trumple's job" heard as working for him; case ← "caught… bad guys" just before
    { id: 'd5', skill: 'detail', level: 'B1', point: 'chief', seg: [95.65, 101.75],
      stem: 'What is Dave mainly in town to do?',
      choices: ['Interview for the police chief job', 'Help Chief Trumple run his office', 'Work on a case with Chief Trumple'], a: 0,
      cue: '「How’s that now?」への答え。', line: 'I’m mainly here to *interview for Trumple’s job*. Police chief.',
      said: '「戻るかも」と言い、トランプルの後任、署長の面接に来たと明かす。',
      mean: '町に住むかもしれない、という知らせ。',
      trap: 'Trumple や bad guys から、署長の手伝いや事件の話に取りやすい。interview for を聞く。',
      use: 'I’m here to interview for a job.（仕事の面接で来ました）' },

    // R fix: V2 (blind 55 %): "win without help" was weak; now the Japanese 遠慮 frame, where "no need" can mean yes
    // why: better candidate ← "a lot of good candidates" heard as pointing elsewhere; accepting ← 「いえいえ、そんな」
    //   is often a polite yes in Japanese
    { id: 'p3', skill: 'pragma', level: 'C1', point: 'candidates', reveals: ['haveto'], seg: [101.75, 111.6],
      stem: 'When Dave offers to back her, what is Leslie doing with her reply?',
      choices: ['Politely turning down his support', 'Asking him to back a better candidate',
                'Accepting with a modest “no need”'], a: 0,
      cue: '「I would definitely」への返事。', line: '*You don’t have to*, there’s a lot of good candidates.',
      said: '「しなくていいよ、いい候補はたくさんいるし」と返す。',
      mean: '本当の理由は言わず、借りを作りたくない相手の応援をやんわり断っている。',
      trap: '日本語の「いえ、そんな」は遠慮しつつ受けることもある。ここは candidates で話をそらす断り。',
      use: 'Oh, you don’t have to do that.（いえ、そこまでしなくていいよ）' },

    // why: want to ← "have to" and "want to" both shrink to two syllables; need to ← same sense, the d lost
    { id: 's1', skill: 'sound', level: 'B2', point: 'haveto', seg: [107.35, 111.6],
      stem: 'Fill the gap: “___, there’s a lot of good candidates.”',
      choices: ['You don’t have to', 'You don’t want to', 'You don’t need to'], a: 0,
      cue: '文の最初、don’t のあとの短い二音。', line: '*You don’t have to*, there’s a lot of good candidates.',
      said: '「しなくていいよ、いい候補はたくさんいるから」。',
      mean: 'have to が「ハフタ」と濁らずにつながる。v が f の音になる。',
      trap: 'want to も「ワナ」と縮むので混ざりやすい。f の息の音があれば have to。',
      use: 'You don’t have to wait for me.（待たなくていいよ）' },

    // R fix: V2 (blind 60 %), V5: the literal and "unwell" readings were weak; the stem now names the moment. catch up is
    //   a common idiom, so B2
    // why: sort out ← an ex asking to talk alone suggests "talk about us"; meet again ← "catch up" heard as "catch you
    //   later"
    { id: 'ph2', skill: 'phrase', level: 'B2', point: 'catchup', seg: [115.3, 125.95],
      stem: 'When Dave asks Leslie to step outside, what does he suggest they do?',
      choices: ['Swap news on what each has been doing', 'Sort out what went wrong between them',
                'Make plans to meet up again soon'], a: 0,
      cue: '「step outside with me and」のあと。', line: 'Would you like to step outside with me and *catch up*?',
      said: '「外で近況でも話さない？」と誘い、彼女は「もう話した」と返す。',
      mean: 'catch up ＝ 久しぶりの相手と近況を話す。二人きりになる口実。',
      trap: '元恋人の誘いなので「二人の話し合い」と取りやすい。返事の San Diego が近況の中身。',
      use: 'We should get coffee and catch up.（お茶でもして近況話そうよ）' },

    // why: friendship fine ← "we're good" read as "we're on good terms"; feels fine ← "good" read as health
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'weregood', reveals: ['catchup'], seg: [120.85, 125.95],
      stem: 'What is the “I think…” line at the end of Leslie’s answer doing?',
      choices: ['Turning the offer down', 'Saying their friendship is fine', 'Saying she feels fine now'], a: 0,
      cue: '最後の一文、think のあと。', line: 'We have caught up. … *I think we’re good*.',
      said: '「近況ならもう話した。サンディエゴも悪者6人も。もう十分」。',
      mean: 'I think we’re good ＝ もう足りている、結構です。やわらかい断り。',
      trap: 'good を「仲がいい」「元気」と取ると話がずれる。誘いへの返事なら No thanks。',
      use: 'I think we’re good, thanks.（大丈夫です、足りてます）' },

    // R fix: V2 (blind 60 %): the key was the only face-saving reading; all three are now framings. V5: the reason is
    //   said outright with a common idiom, so B2
    // why: air ← "step outside" earlier, the usual reason; time to think ← a gracious exit after a no
    { id: 'i3', skill: 'infer', level: 'B2', point: 'word', seg: [125.95, 137.1],
      stem: 'After Leslie says no, how does Dave explain going outside anyway?',
      choices: ['As keeping his word about going out', 'As giving Leslie time to think it over',
                'As needing air after their awkward talk'], a: 0,
      cue: '「I already said」のあとの理由づけ。',
      line: 'I already said I’m gonna go, so I guess I’m *a man of my word*. I’m gonna go.',
      said: '「行くって言っちゃったし、俺は約束を守る男だから、行くよ」と言う。',
      mean: '断られて一人で出るのを、約束を守るかっこいい話にすり替えて面子を保っている。',
      trap: '断られて席を外すと、気づかいや気分転換に見えやすい。本人が口にする理由を聞く。',
      use: 'I’m a man of my word.（言ったことは守るよ）' },

    // R fix: V2 (blind 75 %): police/jealous readings were off the verb; now a secrecy request and the フリーク reading
    // why: tell anyone ← the usual request after a secret is shared; jokes ← "freak" heard as katakana フリーク (odd,
    //   funny)
    { id: 'ph3', skill: 'phrase', level: 'B2', point: 'freak', seg: [146.9, 154.35],
      stem: 'What does Leslie ask Ben not to do?',
      choices: ['Panic and lose his cool', 'Tell anyone what Dave said', 'Make jokes about Dave'], a: 0,
      cue: '「Can you just not」のあと。', line: 'Can you just *not freak out*?',
      said: '「警官で、君を愛してて、銃を持ってるって？」と言うベンに「取り乱さないで」と頼む。',
      mean: 'freak out ＝ パニックになる、取り乱す。',
      trap: '打ち明け話のあとなので「人に言わないで」と取りやすい。not のあとの動詞を聞く。',
      use: 'Don’t freak out, but I lost the keys.（落ち着いて聞いて、鍵なくした）' },

    // R fix: K6/V2 (blind 85 %): the key was the only two-part, nuanced choice; all three are "X, though Y" now. Ear
    //   check dropped: the stammer and the self-contradiction are in both transcripts
    // why: calm ← "I'm not freaking out" taken at its word; annoyed ← the repeats heard as irritation
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'notfreak', reveals: ['freak'], seg: [152.4, 159.3],
      stem: 'How does Ben sound when he answers Leslie’s request?',
      choices: ['Rattled, though he says he’s fine', 'Calm, though a bit hurt that she asked',
                'Annoyed, though he tries to joke'], a: 0,
      cue: '同じ言葉を何回言うか、途中で切れるか。',
      line: 'I’m not freaking out. … I’m not freaking— I know, that’s— I know.',
      said: '「取り乱してないよ」と言い、また同じことを言いかけて、言葉が途切れる。',
      mean: '口では否定しても、言い直しや途切れが動揺を表している。',
      trap: '言葉だけなら落ち着いている。繰り返しと途切れは、言葉と逆の本音の合図。',
      use: 'I’m fine. Totally fine.（大丈夫。全然大丈夫）' },

    // R fix: V2 (blind 55 %): the ride and weather choices were weak; now a did/didn't near sound
    // why: soaking ← "didn't" weak, heard as "did… get wet"; go home ← rain as a reason to end the night
    { id: 'i4', skill: 'infer', level: 'B2', point: 'rain', seg: [158.85, 164.2],
      stem: 'Why does Dave mention the rain when he comes back?',
      choices: ['To explain why he’s back so soon', 'To explain why he’s soaking wet', 'To hint that they should all go home'], a: 0,
      cue: '戻ってきた最初の一文、so のあと。', line: 'Uh, it— it was raining out, *so I didn’t want to get wet*.',
      said: '「外は雨だったから、ぬれたくなくて」と言いながら席に戻る。',
      mean: '出て行ったばかりで戻った言い訳。本当はレスリーのそばにいたい。',
      trap: 'didn’t の t が弱く「ぬれた」と取りやすい。出て行ってすぐ戻った、という流れで聞く。',
      use: 'It was raining, so I came back.（雨だったから戻ってきた）' },

    // R fix: V2 (blind 80 %): afford / diet were weak; now the two men's rivalry and a literal "overrated"
    // why: beat Dave ← the men compete all night; too full ← "dessert's overrated" taken as a real reason
    { id: 'i5', skill: 'infer', level: 'B2', point: 'quick', seg: [164.0, 175.5],
      stem: 'Why does Ben push to pay the bill right then?',
      choices: ['He wants to end the night and get away', 'He wants to beat Dave to paying the bill',
                'He’s too full to stay on for dessert'], a: 0,
      cue: '「quick now」と、デザートへの返事。', line: 'Here’s my credit card, *quick now*. … Oh, *dessert’s overrated and gross*.',
      said: '「カードです、急いで」と払い、デザートを勧められても「まずいし」と断る。',
      mean: '早く食事を終えてデイブから離れたい。最後は「楽しい夜をありがとう」で締める。',
      trap: '二人の張り合いが続くので、支払いの競争に見えやすい。quick now と締めの言葉を聞く。',
      use: 'Could we get the check, please?（お会計お願いします）' },

    // R fix: V2 (blind 60 %): "nobody should talk" was weak; now overlap, the natural guess for a fast scene
    // why: talk over ← the fast turns heard as overlap; who is who ← the names fly by too fast to track
    { id: 'h5', skill: 'humor', level: 'C1', point: 'loop', seg: [188.0, 202.9],
      stem: 'Why does the audience laugh at “So, who’s talking now?”',
      choices: ['Their careful plan leaves it unclear who goes first', 'They all talk over each other at the same time',
                'Someone keeps mixing up who is who'], a: 0,
      cue: '「talk to」が何回続くか。', line: '…and then you’ll talk to each other, and then we’ll all three talk then.',
      said: '誰が誰と話すか、順番を決めようとして「talk to」が延々と続く。',
      mean: '丁寧に決めるほど話が回り、結局だれが話すのか分からなくなる。',
      trap: '速いやりとりを、同時に話している、人を取り違えていると取りやすい。順番の talk to を聞く。',
      use: 'Okay, who’s going first?（じゃあ、誰からいく？）' },

    // why: arrest threat ← he's a cop, and "clear the area" comes later; laugh ← "frankly" heard as light
    { id: 'a4', skill: 'attitude', level: 'C1', point: 'pertinent', seg: [214.7, 226.5],
      stem: 'How does Dave brush off what Ben says about the couple?',
      choices: ['In stiff, formal words, as if on duty', 'With an angry threat to arrest Ben',
                'With a laugh, as though Ben were joking'], a: 0,
      cue: '返事に出てくる、かたい言葉。', line: 'That information is… *not pertinent*, *frankly, at this juncture*.',
      said: '「僕たちは愛し合ってる」と言うベンに、「その情報は現時点では関係ない」と返す。',
      mean: '恋の話を、仕事の報告のようなかたい言葉で切り捨てている。そこがおかしい。',
      trap: '警官なので脅しを想像しやすい。怒鳴る言葉はなく、事務的な語が並ぶ。',
      use: 'That’s not relevant right now.（それは今は関係ないよ）' },

    // R fix: V2 (blind 60 %): the key was the only sensible gift; now a keyword trap ("win my girlfriend") and "clear
    //   the area". N7: its line shows what Dave is after (g1), so it reveals `want`
    // why: help ← "win my girlfriend away" right after "give my"; stay out ← "clear the area" just before, heard as
    //   what Dave wants
    { id: 'ph4', skill: 'phrase', level: 'B2', point: 'blessing', reveals: ['want'], seg: [240.35, 250.9],
      stem: 'What does Ben refuse to give Dave?',
      choices: ['His OK for Dave to go after Leslie', 'His help in winning Leslie back', 'His promise to stay out of it'], a: 0,
      cue: '「give my」のあとの名詞と、その中身。',
      line: 'I’m not gonna *give my blessing* for you to go and try and win my girlfriend away from me.',
      said: '「彼女を奪いに行くのに、賛成はできない」とベンが言う。',
      mean: 'give my blessing ＝ 賛成する、許す。結婚の許しにも使う。',
      trap: 'すぐあとの win my girlfriend から「手伝い」と取りやすい。blessing ＝ 許し、賛成。',
      use: 'You have my blessing.（応援するよ、どうぞ）' },
  ]
};
