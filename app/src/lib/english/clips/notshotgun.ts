// “Chris and Ann Are Definitely Not Having a Shotgun Wedding | Parks and Recreation” (the official Parks and Recreation
// channel, Season 6): at a jewelry store, Chris and Ann talk themselves out of a ring, back into it and out again, while
// another couple starts doubting their own wedding and the jeweler loses patience; they leave with a locket.
// Segments from the captions, words from whisper (2026-11-16). Speakers are only named where the audio settles it
// (“Chris?” at 38.8 s, “Mr. Perkins” at 109.9 s, “Ann Perkins, will you marry me?” at 130.6 s, “Theodore”); stems call
// the others “the other couple” or “the jeweler”, and no key rests on which of the other couple speaks. Left out on
// purpose: who says “And that is a beautiful sentiment” (117.9 s) and whose “Hello? Actually, we don't want the ring”
// (141.9 s) it is.
// REVIEW 2026-11-16: pass 6, fix 17, drop 1, new 0; ear checks 0 (x1, s1 and nt2's checks are gone: both sources agree
//   word for word on “You wouldn't believe”, “if we didn't buy” and “let's maybe not talk”, rubric addendum)
// Open: p1's key changed from “a wedding” to “their own ring” (the follow-up is about the ring money); check it reads
//   right to you.
import type { Clip } from '../types.ts';

export const notShotgun: Clip = {
  id: 'notshotgun', video: 'YVKw_aYWAoo', title: 'Chris and Ann Are Definitely Not Having a Shotgun Wedding',
  dur: 212, wpm: 160, band: 'mid',
  tags: ['恋愛', '買い物'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2, blind 60 %: "won't sell it a second time" was a filler; now a wait-for-the-baby reading
    // why: wait ← "maybe let's not" + "a picture of our child" heard as "not before the baby"; house ← the other
    //   couple's "this could go towards buying a house"
    { id: 'g1', skill: 'gist', level: 'B2', point: 'nowedding', reveals: ['whystart'], seg: [0, 188.0],
      stem: 'Why do Chris and Ann leave with a locket instead of a ring?',
      choices: ['A wedding doesn’t fit the way they do things', 'They’d rather wait until the baby is born',
                'They want to save the money for a new house'], a: 0,
      cue: '最後のほう、二人のこれまでを並べる部分。',
      said: '指輪も式もいらない、ロケットがいいと言い、二人の型破りな歩みを並べる。',
      mean: '普通の順番で来なかった二人だから、結婚式という型にも合わせない、という結論。',
      trap: '子どもの写真から「産まれるまで待つ」と取りやすいが、式自体いらないと言う。家は別の二人の話。',
      use: 'Let’s skip the big wedding.（盛大な式はやめよう）' },

    // R fix: V2, blind 50 %: "the jeweler pushing" was easy to rule out ("If you like…"); now a can't-agree reading
    // why: can't agree ← the date comes up right before the doubt, and "haven't discussed it" is heard as a dispute;
    //   months ← the other couple's planning is the loudest contrast, but it isn't the reason given
    { id: 'g2', skill: 'gist', level: 'B2', point: 'rethink', reveals: ['date'], seg: [0, 87.4],
      stem: 'In the first half, what makes Chris and Ann rethink the ring?',
      choices: ['Seeing they’ve never really talked about it', 'Realizing they can’t agree on a date',
                'Hearing another couple needs months to plan'], a: 0,
      cue: 'Hang on のあと、if で始まる文。',
      line: 'if *neither of us has ever thought about this stuff*, then maybe there’s a reason.',
      said: '「二人とも考えたこともないなら、理由があるのかも」と言い出す。',
      mean: '日付の話で、何も話し合っていないと気づく。それ自体が答えだと考え始める。',
      trap: '日付の話がきっかけなので「意見が合わない」に見えるが、話し合ってもいない。別の二人は比べる材料。',
      use: 'Hang on, let’s think about this.（ちょっと待って、考えよう）' },

    // R drop: f1 (phrase, `shotgun`): the title says "Shotgun Wedding", so the key was blind-guessable at 80–90 % (two
    //   reads) and no rebalancing can hide it (GUIDE §9.4). Never shipped, so deleted; h1 keeps the point, f2 the phrase
    //   minimum
    // R fix: V2, blind 60 %: "take offense" was a filler (they're cheerful); now a bragging reading
    // why: not pregnant ← "this isn't…" heard as denying the pregnancy, though "yes, she is pregnant" follows; brag
    //   ← "we did just decide… today" heard as pride in being spontaneous
    { id: 'h1', skill: 'humor', level: 'C1', point: 'shotgun', reveals: ['notyet'], seg: [7.6, 20.7],
      stem: 'Why is Chris and Ann’s answer to the jeweler funny?',
      choices: ['Each fact they add proves his guess right', 'They act as if she isn’t actually pregnant',
                'They brag about how fast they decided'], a: 0,
      cue: '否定のあと、yes で始まる文がいくつ続くか。',
      line: 'this isn’t a shotgun wedding. Although, *yes*, she is pregnant. And, *yes*, we did *just decide*… today.',
      said: '否定しつつ、妊娠、今日決めた、家族に未報告と、当てはまる事実を並べる。',
      mean: '否定するほど推測どおりだと分かるのに、また「違う」と言うのが笑い。',
      trap: 'this isn’t を妊娠の否定と取りやすいが、すぐ妊娠を認めている。',
      use: 'Okay, maybe it is a little rushed.（まあ、ちょっと急ぎかも）' },

    // R fix: K6/V2, blind 55 %: the key was the only two-part choice; the pregnancy one became a two-part keyword
    //   trap
    // why: decided ← "decide to get married" is heard, but with "did just" (did = affirmative); invitations ← the
    //   other couple's list starts with "Invitations" a moment later
    { id: 'd1', skill: 'detail', level: 'B1', point: 'notyet', seg: [12.8, 18.6],
      stem: 'What do they admit they haven’t done yet?',
      choices: ['Told their families or picked a venue', 'Decided for sure to get married', 'Sent out invitations or booked a band'], a: 0,
      cue: 'haven’t のあと、二つ並ぶもの。',
      line: 'We *haven’t told our families* or *chosen a venue*',
      said: '「家族にもまだ言ってないし、式場も決めてない」と言う。',
      mean: 'venue ＝ 会場。結婚を決めたのが今日なので、何も進んでいない。',
      trap: 'decide が聞こえ「まだ決めていない」と取りやすいが、did just decide ＝ 今日決めた。',
      use: 'We haven’t picked a venue yet.（まだ会場を決めていません）' },

    // why: weeks ← "months" with its final -ths weak; a year ← the long to-do list suggests a long time
    { id: 'n1', skill: 'number', level: 'B1', point: 'months', seg: [20.3, 26.45], keep: true,
      stem: 'How long has the other couple been planning their wedding?',
      choices: ['For weeks', 'For months', 'For a year'], a: 1,
      cue: 'planning ours のすぐあと。',
      line: 'We’ve been planning ours *for months*.',
      said: '「うちは何か月も前から準備してる」と言う。',
      mean: 'ours ＝ our wedding。今日決めた二人との対比。',
      trap: 'months の語尾 ths は弱く、ほかの期間に聞こえやすい。for のあとの母音「マ」で判断。',
      use: 'I’ve been planning this for months.（何か月も前から計画してたの）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'todo', seg: [20.3, 26.45],
      stem: 'Type the words: “You ___ how much there is to do.” (2 words)', answer: 'wouldn\'t believe',
      cue: 'months の文のすぐあと、You に続く2語。',
      line: 'You *wouldn’t believe* how much there is to do.',
      said: '「やることがどれだけあるか、信じられないよ」。',
      mean: 'wouldn’t の t はほぼ消え、「ウドゥン・ビリーヴ」とつながる。驚きを伝える決まり文句。',
      trap: 'n’t の t が消えて would believe に聞こえやすい。「ン」が残れば否定。',
      use: 'You wouldn’t believe the traffic today.（今日の渋滞、信じられないよ）' },

    // R fix: V2, blind 70 %: "finished planning" was a filler; now a cost reading of the long list
    // why: costs more ← the long list sounds like the dinner is the big spend; only party ← "just for the dinner" read
    //   as "only a dinner"
    { id: 'i1', skill: 'infer', level: 'B2', point: 'rehearsal', seg: [22.0, 33.8],
      stem: 'What does the other couple’s “that’s just for the rehearsal dinner” tell us?',
      choices: ['Their full wedding plans are even bigger', 'The dinner will cost more than the wedding',
                'The dinner is the only party they’ll have'], a: 0,
      cue: '長いリストのあと、just が付く部分。',
      line: 'Invitations, table settings… *And that’s just for the rehearsal dinner.*',
      said: '招待状、配色、ダンスの練習などを並べ、「これ全部、前夜祭の分」と言う。',
      mean: 'just ＝「〜だけで」。前日の食事会だけでこの量なら、本番はもっと大がかり。',
      trap: 'just を「それだけ」と取ると、ほかの2つに引かれる。',
      use: 'And that’s just the first day.（しかもそれ、初日だけの話）' },

    // why: forgot the way ← "GPS" and "jewelry store" heard as getting lost; out of gas ← "I was getting gas" heard as
    //   a breakdown
    { id: 'h2', skill: 'humor', level: 'B2', point: 'gps', seg: [33.5, 43.4],
      stem: 'Why is the exchange about “that romantic moment” funny?',
      choices: ['Chris was too busy to even notice it', 'Chris forgot the way to the jewelry store',
                'They ran out of gas on the way there'], a: 0,
      cue: 'Chris の短い返事二つ。',
      line: 'You remember that *romantic moment*, Chris? — I was *getting gas*. No, I *don’t remember* it.',
      said: '「ナビに宝石店と入れた瞬間、覚えてる？」に「給油してた。覚えてない」。',
      mean: 'ロマンチックと呼ぶ瞬間を、相手は給油中で見てもいない。言葉と中身の落差。',
      trap: 'gas を聞いて「ガス欠」と取りやすいが、getting gas は給油中のこと。',
      use: 'Remember that? — Honestly, no.（覚えてる？—正直、全然）' },

    // R fix: V2, blind 55 %: "the band is too thin" was a filler; now a secrecy reading
    // why: secret ← "haven't told our families" earlier, so the date seems private; can't agree ← "haven't discussed" heard as an
    //   argument
    { id: 'd2', skill: 'detail', level: 'B1', point: 'date', seg: [45.6, 53.35],
      stem: 'Why might engraving the date be tough?',
      choices: ['They haven’t talked about a date yet', 'They’d rather keep the date a secret', 'They can’t agree on which date to use'], a: 0,
      cue: 'tough のあと、’cause に続く理由。',
      line: 'That might be tough, ’cause we actually *haven’t discussed it* yet.',
      said: '「難しいかも。まだ話し合ってないから」と答える。',
      mean: '結婚の日取りを、二人で一度も話していない。',
      trap: 'discussed を「もめた」と取ると「意見が合わない」に引かれる。haven’t discussed は話題にもしていない。',
      use: 'We haven’t discussed it yet.（まだその話はしてないんだ）' },

    // R fix: V2, blind 50 %: "the date they first met" became the baby's month (2014 and the pregnancy are both in
    //   the clip)
    // why: baby ← "2014" plus "she is pregnant" suggests a due date; initials ← the other classic, and "TBD" sounds like three letters
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'tbd', reveals: ['date'], seg: [53.2, 58.1],
      stem: 'Besides the year, what else is suggested for the engraving?',
      choices: ['A note that the date is still open', 'The month their baby is due', 'Their initials instead of a date'], a: 0,
      cue: '年のあと、or に続く短い略語。',
      line: 'We could engrave 2014 or *TBD*.',
      said: '「2014 か TBD と彫ればいい」と提案する。',
      mean: 'TBD ＝ to be determined（未定）。日取りが決まっていないことへの冗談まじりの案。',
      trap: 'アルファベット3文字なので頭文字に聞こえやすい。予定表の「未定」でよく使う略語。',
      use: 'Time and place: TBD.（日時と場所は未定）' },

    // R fix: C5: its key gives away g1's (no wedding), so it reveals `nowedding`.
    // R fix: V2, blind 70 %: the key was the only sensible point; now three directions the argument could take, and
    //   "more married" fits "marry now" just as well on its face
    // why: right away ← "more married" heard as readiness for the next step; after the baby ← "we're having a child"
    //   is the first reason given
    { id: 'i2', skill: 'infer', level: 'C1', point: 'moremarried', reveals: ['rethink', 'nowedding'], seg: [57.6, 70.1],
      stem: 'Where is the “more married than most married people” argument heading?',
      choices: ['Toward not needing a wedding at all', 'Toward getting married right away',
                'Toward waiting until after the baby'], a: 0,
      cue: 'その前の Hang on の文と、続く理由の列。',
      line: 'maybe there’s a reason… we are *already more married than most married people*.',
      said: '「普通の夫婦以上に夫婦だ」と、子どもや引っ越しを挙げる。',
      mean: 'すでに夫婦同然なので、式で証明する必要はない、という方向へ話が進む。',
      trap: '「夫婦以上」を「準備ができた」と取りやすいが、話は式をやめる方向。',
      use: 'We’re basically family already.（もう家族みたいなものだよ）' },

    // R fix: V2, blind 50 %: "embarrassed" was weak; now a wrong-target praise
    // why: missed episode ← "the end of… season finale" heard as a complaint; praises the partner ← a reply to "you
    //   let me…" would normally be about the kindness
    { id: 'h3', skill: 'humor', level: 'C1', point: 'finale', seg: [69.95, 79.65],
      stem: 'Why is the reply to the TV-show example funny?',
      choices: ['It gushes about the show, not the couple', 'It complains that they missed the big episode',
                'It praises the partner for being so patient'], a: 0,
      cue: '例のすぐあと、返事でほめているもの。',
      line: 'so I could watch the end of Grey’s Anatomy? — That was a *fantastic season finale*…',
      said: '「ドラマの最後を見せてくれた」という例に、相手は最終回を熱くほめる。',
      mean: '二人の絆の例なのに、ドラマそのものを熱心にほめてしまう。話のずれが笑い。',
      trap: '相手の優しさをほめる返事を予想しやすいが、出てくるのはドラマへのほめ言葉ばかり。',
      use: 'Don’t get me started on that show.（あのドラマの話を始めたら止まらない）' },

    // R fix: K1: "whether they want a wedding either" overstated it; what follows is only about not buying their
    //   ring, so the key now says that
    // why: Chris and Ann ← "we" heard as all four, as if giving advice; which ring ← "this ring" comes next, heard as
    //   choosing a different one
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'talkover', seg: [92.3, 99.6],
      stem: 'What is the other couple’s “Maybe we should talk this over, too” about?',
      choices: ['Whether to skip buying their own ring', 'Whether Chris and Ann are rushing things', 'Which ring they should pick instead'], a: 0,
      cue: 'too の一語と、すぐあとの家の話。',
      line: 'Maybe we should *talk this over, too*. … this could go towards *buying a house*.',
      said: '「うちも考え直すべきかも」と言い、指輪の代わりに家の資金に、と続ける。',
      mean: 'too ＝「私たちも」。二人の話を聞いて、自分たちの指輪にも迷い始めた。',
      trap: 'we を4人と取ると、助言しているように聞こえる。too があれば「自分たちも」。',
      use: 'Maybe we should sleep on it.（一晩考えたほうがいいかも）' },

    // R fix: V2, blind 55 %: "can't buy" was ungrammatical after "could… if", so grammar narrowed it to two; now
    //   "did buy", the -n't-lost trap
    // why: don't ← didn't's d and t drop, leaving a vowel close to "don't"; did ← the -n't swallowed, leaving "did"
    { id: 's1', skill: 'sound', level: 'B2', point: 'house', seg: [94.7, 99.6],
      stem: 'Fill the gap: “Think what we could do if we ___ this ring.”',
      choices: ['didn’t buy', 'don’t buy', 'did buy'], a: 0,
      cue: 'if we のあと、短く弱い否定。',
      line: 'Think what we could do if we *didn’t buy* this ring.',
      said: '「この指輪を買わなかったら、何ができるか考えて」と言う。',
      mean: 'if we didn’t ＝ 仮定。didn’t は「ディドゥン」と弱く、t はほぼ消える。',
      trap: 'n’t が消えると did に聞こえる。続く「家の資金に」で、買わない話だと分かる。',
      use: 'What if we didn’t go?（行かなかったらどうなる？）' },

    // R fix: V2, blind 60 %: the key was the only realistic list; "house" became a half-right taxes pair
    // why: home loan ← "taxes" is heard, and "buying a house" was just said by the other couple; gifts ← the usual
    //   wedding perks
    { id: 'd3', skill: 'detail', level: 'B1', point: 'benefits', seg: [102.2, 107.95],
      stem: 'Which benefits of marriage does Chris list first?',
      choices: ['Taxes and health insurance', 'Taxes and help with a home loan', 'Gifts and a honeymoon'], a: 0,
      cue: 'on the other hand のあと、最初の二つ。',
      line: 'there are some *benefits* to being married. *Taxes, health insurance*',
      said: '「一方で、結婚にはいい点もある。税金、健康保険」と挙げる。',
      mean: 'on the other hand で、反対側の意見に話を戻している。',
      trap: 'taxes のあとに直前の house を足しやすいが、家は別の二人の話。二つ目まで聞く。',
      use: 'On the other hand, it’s cheaper.（その一方で、安いんだよね）' },

    // R fix: V2, blind 70 %: "falling apart" was far from the scene; now a near miss, "maybe not" heard as "not yet"
    // why: not today ← "maybe let's not" heard as postponing; hurt ← "I don't know" heard as
    //   covering pain, but Chris's "Me either" answers in the same breath
    // anchor: 134.2–138.3 s "I don't know." "Me either. Maybe let's not." "Yeah, I think maybe not." — each says the same
    //   thing in turn, and at 152.8 s Ann is already excited about the locket
    { id: 'nt1', skill: 'attitude', level: 'C2', point: 'propose', seg: [130.0, 140.3],
      stem: 'What does the way the proposal ends tell us about Chris and Ann?',
      choices: ['They’re so in step that even “no” is easy', 'They both want to marry, just not today',
                'Ann is hurt by the question but hides it'], a: 0,
      cue: '答えのあと、プロポーズした側の一言。',
      line: 'Ann Perkins, will you marry me? — I don’t know. — *Me either.* Maybe let’s not. — Yeah, I think maybe not.',
      said: 'プロポーズに「分からない」、Chris も「僕も。やめとこう」、Ann も「そうね」と一致する。',
      mean: '断りも同時に出せるほど息が合っている。直後に二人でロケットを選ぶのが証拠。',
      trap: 'maybe not を「今日はやめて」と取りやすい。返事の言葉を比べると、同じ気持ちを順に言っているだけ。',
      use: 'Me neither. Let’s not, then.（僕も。じゃあ、やめとこう）' },

    // why: sick ← "I'm sorry, buddy" heard as worry; customer ← "Unbelievable" just before, as if said to a caller
    { id: 'i3', skill: 'infer', level: 'B2', point: 'late', seg: [144.8, 150.05],
      stem: 'What does the jeweler’s phone call tell us?',
      choices: ['The couples are keeping him late at work', 'His son is sick at home without him', 'He has an angry customer on the line'], a: 0,
      cue: 'buddy のあと、can’t に続く部分。',
      line: 'I’m sorry, buddy. Daddy *can’t get home* to tuck you in.',
      said: '電話で息子に「ごめん、パパは寝かしつけに帰れない」と言う。',
      mean: '客が決めては取り消すので、店を閉められない。',
      trap: 'sorry を「心配」と取りやすいが、謝っているのは帰れないこと。tuck in ＝ 寝かしつける。',
      use: 'Sorry, I can’t make it home for dinner.（ごめん、夕飯までに帰れない）' },

    // why: good gift ← "pick a thing" read as advice on a present for his son; family ← not answering read as privacy
    { id: 't1', skill: 'attitude', level: 'C1', point: 'pick', reveals: ['late'], seg: [146.9, 152.75],
      stem: 'When asked how old his son is, how does the jeweler respond?',
      choices: ['Impatiently: he just wants them to choose', 'Kindly: he points her to a good gift',
                'Coldly: he won’t talk about his family'], a: 0,
      cue: '年を聞かれた直後の、短い命令。',
      line: 'Oh, how old is your son? — *Just pick a thing.*',
      said: '「息子さん何歳？」に、答えず「とにかく何か選んで」と返す。',
      mean: 'just ＝「いいから」。世間話に付き合う余裕もない、うんざりした気持ち。',
      trap: 'pick を「おすすめ」と取りやすいが、a thing は何でもいいという言い方。質問にも答えていない。',
      use: 'Just pick one, please.（とにかく一つ選んで）' },

    // R fix: V2, blind 65 % (the key was the only "sure"), and S3 cue leak ("want" was only in the key): now two
    //   "sure" choices and a torn one
    // why: torn ← "Honey, look at this" heard as asking for an opinion; baby gift ← "a picture of our child" heard as
    //   a present for the baby
    { id: 't2', skill: 'attitude', level: 'B1', point: 'want', reveals: ['nowedding'], seg: [152.3, 160.7],
      stem: 'When one of them finds the locket, how do they feel about it?',
      choices: ['Sure that it’s what they want', 'Torn between it and the ring', 'Sure it would make a nice baby gift'], a: 0,
      cue: 'look at this のあと、言い切る文がいくつ続くか。',
      line: 'This is *what I want*. I don’t want a ring… I *just want this locket*',
      said: '「これがいい。指輪も式もいらない。このロケットがほしい」と言う。',
      mean: 'want を何度も重ね、迷いなく決めている。',
      trap: 'Honey, look at this を相談と取りやすいが、すぐ This is what I want と言い切る。',
      use: 'This is exactly what I wanted.（まさにこれがほしかったの）' },

    // R fix: V2, blind 60 %: "the breakup never happened" was a filler; now the "Yeah" read as agreement
    // why: agrees ← "Yeah" heard as full agreement with "very embarrassing"; later ← "right now" heard as "save it for later"
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'thatpart', seg: [164.75, 171.28],
      stem: 'What does the reply about “that part” do?',
      choices: ['Steers away from an awkward memory', 'Agrees that it was embarrassing for him', 'Asks for that story to be told later'], a: 0,
      cue: 'Yeah のあと、maybe not に続く部分。',
      line: 'you didn’t realize it… — Yeah, let’s maybe *not talk about that part* right now.',
      said: '「別れたのに気づかなかった」と言われ、「その話は今はやめとこう」と返す。',
      mean: 'let’s not talk about… ＝ 恥ずかしい話を止める言い方。',
      trap: 'Yeah を同意、right now を「あとで」と取りやすいが、話をそらす決まり文句。',
      use: 'Let’s not get into that right now.（その話は今はやめておこう）' },

    // C2 dict: "let's maybe not", an order grammar would "fix" to "maybe let's not" (which is said at 136.8 s)
    // anchor: 169.7–170.2 s both sources "let's maybe not talk", three weak words before the stressed "talk"
    { id: 'nt2', skill: 'dict', level: 'C2', point: 'thatpart', seg: [166.95, 171.28],
      stem: 'Type the start of the reply: “Yeah, ___ talk about that part.” (3 words)', answer: 'let\'s maybe not',
      cue: 'Yeah のすぐあと、talk の前まで。語順も聞こえたまま。',
      line: 'Yeah, *let’s maybe not* talk about that part right now.',
      said: '「うん、その話は今はやめとこう」。3語が弱くひと続き。',
      mean: '教科書の語順は maybe let’s not。maybe を中に入れ、止める言葉をさらに柔らかくしている。',
      trap: '習った語順に直したくなる。書き取りは、正しい形でなく聞こえた順で書く。',
      use: 'Let’s maybe not tell Mom yet.（ママにはまだ言わないでおこうか）' },

    // R fix: V2, blind 60 %: "when to start planning" was a filler; now "why start now" heard as "let's start now"
    // why: one thing properly ← "start now" heard as a decision to begin; wishes ← "never been very conventional" heard
    //   as regret
    { id: 'p3', skill: 'pragma', level: 'B2', point: 'whystart', seg: [173.0, 178.6],
      stem: 'What does the question that ends the speech mean?',
      choices: ['There’s no reason to turn traditional now', 'It’s time they did one thing the normal way',
                'They wish they’d been more normal before'], a: 0,
      cue: 'conventional の文と、so のあとの短い問い。',
      line: 'We’ve *never been very conventional*, so *why start now*?',
      said: '「普通だったことはない。今さら普通にする？」と締めくくる。',
      mean: 'why start now? は答えを求めない問い。「今さら始める理由はない」という意味。',
      trap: '疑問文なので本当の質問と取りやすい。so why…? は「〜する理由はない」。',
      use: 'Never done it before, so why start now?（やったことないし、今さらね）' },

    // R fix: V2, blind 55 %: "angry about the cheap locket" was a filler; now an apology reading
    // why: gift ← "Just take it" read as kindness after Ann's speech; making up ← he was short with them ("Just pick
    //   a thing"), so a free locket looks like an apology
    { id: 'h4', skill: 'humor', level: 'C1', point: 'takeit', reveals: ['late'], seg: [178.3, 186.55],
      stem: 'Why is the jeweler’s answer to “How much?” funny?',
      choices: ['He’d rather give it away than deal with them', 'He is so moved that he gives it as a gift',
                'He gives it free to make up for being rude'], a: 0,
      cue: 'How much? のあとの、二つの命令。',
      line: 'How much? — *Just take it and get out of here.*',
      said: '「このロケットはいくら？」に、店員は「いいから持っていって、出てって」と言う。',
      mean: '決めては取り消す客に疲れ、代金より早く帰ってほしい。',
      trap: '直前の話に感動した贈り物にも見えるが、get out of here がうんざりの合図。',
      use: 'Just take it. It’s on the house.（持っていって。店のおごりだよ）' },
  ]
};
