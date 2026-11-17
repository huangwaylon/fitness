// “iCan't Believe Carly & Freddie Are Together 😱 | Full Episode in 5 Minutes” (NickRewind, Best of Carly & Freddie):
// Carly's phone dies with her photos, and her recreation of a night in Italy sets off Freddie's version of it (he had
// planned to ask her out; she laughed off "a couple"). They argue about the kiss, the closure and a "consolation
// prize"; she leaves him a note, shows him good memories in the studio, and they get together.
// Segments from the captions, words from whisper (2026-11-17). Speakers come from the words: Carly is named at 2.5 s
// and 117 s and owns the dead phone; Freddie is named at 117 s and 242 s, is the one who came to Italy and slept at the
// airport, and says "I can't believe you recreated…" (51.8 s; he goes on with "That's not how it happened… you kissed
// me", and Carly is the one who left for Italy). The friend at 168–182 s is unnamed, so no stem names them. Untested:
// 71–74.6 s whisper "gonna" vs captions "going to" (d4's key words agree); "Chantani"/"chani" (50 s), "St. Geppetto",
// "House of Gucci" (144 s), "I could be my son" (206 s) and "It took us long enough" (283 s) differ or are cut, and no
// key rests on them. Reduction claims in s1 and x1 rest on words both sources agree on (GUIDE §9.7).
// REVIEW 2026-11-17: pass 6, fix 17, drop 1, new 0; ear checks 0 (c3, the only one, was dropped). The file was
//   not green before (x1's answer, clip order: g2 now comes before s1).
// Open: with the title known, d4 and i5 still read at ~50 % blind (romance is the expected outcome); the audio
//   settles both. p3's end: captions put "will" at 278.4 s, whisper by 274.7 s; the segment covers both.
import type { Clip } from '../types.ts';

export const creddieTogether: Clip = {
  id: 'creddie', video: 'gE5CQopQEdc',
  title: 'iCan\'t Believe Carly & Freddie Are Together 😱 | Full Episode in 5 Minutes', dur: 304, wpm: 134,
  band: 'slow', tags: ['恋愛', '友だち'],
  show: 'iCarly',
  credit: 'iCarly (NickRewind, official YouTube channel)',
  questions: [
    // why: phone the store ← call = 電話 (literal reading); a new phone ← "we'll go to the Pear store and get you a new
    //   phone" comes right after, but as the friend's offer, not what "Fine" agrees to
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'callit', seg: [2.0, 11.1],
      stem: 'After a pause, what does Carly agree to with “Fine”?',
      choices: ['To accept that her phone is gone for good', 'To phone the store about getting it fixed',
                'To get a new phone at the store today'], a: 0,
      cue: '「let go」と言われたあとの短い返事。',
      line: 'It’s time to let go. — Fine. *Let’s call it.*',
      said: '「もう手放す時」と言われ、「わかった、おしまいにしよう」と答える。',
      mean: 'call it ＝ 終わりを宣言する。ここでは電話をあきらめる合図。',
      trap: 'call を「電話する」と取りやすく、次の店の話に引っぱられる。決まり文句は場面で読む。',
      use: 'It’s late. Let’s call it a day.（遅いし、今日はここまでにしよう）' },

    // why: messages, music ← what else a phone holds: a partial listener who catches "all of my…" fills in the rest;
    //   only "photos" is said (both sources)
    { id: 'd1', skill: 'detail', level: 'B1', point: 'photos', seg: [11.0, 19.5],
      stem: 'What upsets Carly most about losing her phone?',
      choices: ['All of her photos are gone with it', 'All of her messages are gone with it',
                'All of her music is gone with it'], a: 0,
      cue: '「Oh my God」のあとのひと言。',
      line: 'It’s really gone. *All of my photos.*',
      said: '新しい電話を買おうと言われ、「本当になくなった。写真が全部」と嘆く。',
      mean: '電話より、中の写真を失ったことがつらい。',
      trap: 'all of my のあとの一語が肝心。電話に入っている物を想像で補わず、最後の名詞まで聞く。',
      use: 'I lost all my photos!（写真が全部消えちゃった！）' },

    // why: get them back ← "we can fix this" heard as data recovery; talk them through ← "memories" read as telling
    //   stories, but the next line is already a staged "Is this…?" scene
    { id: 'i1', skill: 'infer', level: 'B2', point: 'recreate', seg: [18.05, 27.0],
      stem: 'What does the plan to “fix this” mean for the lost photos?',
      choices: ['They will act out the moments in them again', 'They will get them back off the old phone',
                'They will talk through what each one showed'], a: 0,
      cue: '「fix this」のあとの動詞と、次の場面。',
      line: 'We can fix this. We’ll… *recreate your memories*. — Is this…?',
      said: '「なんとかなる。思い出を再現しよう」と言い、すぐ Italy の一場面が始まる。',
      mean: 'recreate ＝ 作り直す。データを戻すのでなく、場面を演じ直す案。',
      trap: 'fix this を「データを直す」と取りやすい。続く場面で答え合わせを。',
      use: 'Let’s recreate the photo from our trip.（旅行の写真を撮り直そう）' },

    // R fix: V2 (60 % blind: the key was the only specific reason). Both distractors now sit on "closed"/"feast day":
    //   booked up (right day, wrong reason) and the kitchen closing (the word "closed", the wrong cause)
    // why: booked up ← "feast day" heard as a busy holiday, "closed" lost; kitchen closed ← "closed" caught, the
    //   missed-dinner script fills in "too late"
    { id: 'd2', skill: 'detail', level: 'B1', point: 'closed', seg: [21.9, 33.7],
      stem: 'Why didn’t they have the fancy dinner in Italy?',
      choices: ['The restaurant was closed for a saint’s day', 'The restaurant was booked up for a saint’s day',
                'They got there after the kitchen had closed'], a: 0,
      cue: '「but then」のあと。',
      line: 'We got all dressed up… *but then the restaurant was closed* for the feast day of…',
      said: 'おしゃれして出かけたのに、聖人の祝日で店が休みだった、と話す。',
      mean: '予定のディナーは店の休みで流れ、川沿いを歩くことになった。',
      trap: 'closed だけだと「遅すぎた」、feast day だけだと「満席」と補いやすい。was closed を一続きで。',
      use: 'We went, but then it was closed.（行ったけど、休みだったの）' },

    // R fix: V2 (55 % blind: the key was the only scene-level choice). All three are now "that night in Italy…"
    // why: neither remembers ← "That's not how it happened" heard as a memory gap (both remember it in detail);
    //   a fight ← the sitcom script, but "you weren't upset, you were fine": no fight that night
    { id: 'g1', skill: 'gist', level: 'B2', point: 'versions', reveals: ['worst'], seg: [21.9, 116.7],
      stem: 'What sets off the argument between Carly and Freddie?',
      choices: ['That night in Italy meant opposite things to each of them',
                'That night in Italy is one neither of them remembers well',
                'That night in Italy ended in a fight they never settled'], a: 0,
      cue: '前半の楽しい思い出話と、そのあとの返事。',
      said: 'Carly が楽しい夜として再現した一夜を、Freddie は最悪の夜と言う。',
      mean: '同じ夜の記憶のずれが、しまっていた気持ちを表に出す。',
      trap: 'not how it happened を記憶違いと取りやすいが、二人とも覚えている。違うのは夜の意味。',
      use: 'That’s not how I remember it.（私の記憶とは違うな）' },

    // why: touched ← "I can't believe you…" heard as happy surprise (信じられない＝感激); puzzled ← "That's not how it
    //   happened" heard as a gap in his memory
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'worst', seg: [51.25, 60.2],
      stem: 'Seeing the recreated night, how does Freddie feel?',
      choices: ['Hurt, because for him it was a bad night', 'Touched, because she remembers it so well',
                'Puzzled, because he can’t remember it at all'], a: 0,
      cue: '「can’t believe」のあと、夜の言い方。',
      line: 'I can’t believe you recreated *the worst night of my life*.',
      said: '「僕の人生最悪の夜を再現するなんて」と言い、「実際は違った」と続ける。',
      mean: 'I can’t believe はあきれや痛みにも使う。ここは痛み。',
      trap: '「信じられない」を感激と取りやすい。あとに来る語で、うれしいかどうかが決まる。',
      use: 'I can’t believe you forgot my birthday.（誕生日を忘れるなんて）' },

    // why: an hour ← "hours" with its final -s lost; every week ← "every day" missed after "for hours"
    { id: 'n1', skill: 'number', level: 'B1', point: 'hours', seg: [65.6, 70.8],
      stem: 'After Carly moved, how much did she and Freddie talk?',
      choices: ['An hour a week', 'Hours every week', 'An hour every day', 'Hours every day'], a: 3, keep: true,
      cue: '「so lonely」のすぐあと。',
      line: 'you were so lonely. We talked *for hours every day*.',
      said: '引っ越してさびしがっていた Carly と、毎日何時間も話した、と言う。',
      mean: '毎日何時間も、という量が、二人の近さと彼の期待の大きさを示す。',
      trap: 'hours の s が弱く「an hour」に聞こえやすい。for のあとに a がなければ複数。',
      use: 'We talked for hours on the phone.（電話で何時間も話した）' },

    // R fix: V2 (75 % blind: the title makes the romantic choice the only one). "Goodbye" became a "girlfriend" keyword
    //   trap, so two choices are now about a girlfriend
    // why: cheer her up ← "you were so lonely" comes just before; a new girlfriend ← "girlfriend" caught, "ask you to
    //   be my" lost in the fast "gonna ask you to be my"
    { id: 'd4', skill: 'detail', level: 'B2', point: 'plan', seg: [70.5, 76.1],
      stem: 'Why had Freddie planned the fancy dinner?',
      choices: ['To ask her to be his girlfriend', 'To cheer her up while she was lonely',
                'To tell her about his new girlfriend'], a: 0,
      cue: '「because」のあと、速い一続き。',
      line: 'I planned that fancy dinner because I was gonna *ask you to be my girlfriend*.',
      said: '「あのディナーは、彼女になってと言うつもりで計画した」と打ち明ける。',
      mean: '彼にとっては告白の夜だった。だから最悪の夜になる。',
      trap: '直前の lonely に引かれやすい。girlfriend だけ拾うのも危ない。because のあとを ask から。',
      use: 'I was gonna ask you something.（ちょっと聞こうと思ってたんだ）' },

    // why: denial ← "Right" heard as sarcasm meaning "oh, I did say it"; changed his mind ← the sitcom script where the
    //   hero loses his nerve
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'right', seg: [76.1, 80.7],
      stem: 'When Carly says he never told her, how does Freddie answer?',
      choices: ['He agrees, and says what stopped him', 'He disagrees, and says he did tell her',
                'He agrees, and says he changed his mind'], a: 0,
      cue: '返事の最初の一語と、そのあとの理由。',
      line: 'You never said that. — *Right. Because* that old man came along.',
      said: '「そんなこと言わなかった」に「そう。あのおじいさんが来たからね」と返す。',
      mean: 'Right ＝ そのとおり。認めて、言えなかった理由を出す。',
      trap: 'Right を反論の皮肉と取ると逆になる。Right, because… は「だって」の型。',
      use: 'Right. Because I was busy.（そう。忙しかったからね）' },

    // R fix: V2 (55 % blind: only the key had the clip's "made up"). "Fine but missed his family" became the phrasal
    //   near miss make up (with) = 仲直り
    // why: a real emergency ← "my family emergency" taken at face value; made up with his family ← "made… up" and
    //   "family" both said, read as make up = 仲直り
    { id: 'i2', skill: 'infer', level: 'B2', point: 'emergency', seg: [99.0, 107.9],
      stem: 'What does Freddie’s answer about the text tell Carly?',
      choices: ['He was hurt and made up a reason to go', 'A real problem at home called him back',
                'He had made up with his family back home'], a: 0,
      cue: '「that text」のあとの短いやりとり。',
      line: 'You were fine. … — My family emergency? *Yeah, I made that up.*',
      said: '「平気そうだった」と言う Carly に、「家族の緊急事態？あれは作り話」と返す。',
      mean: '平気なふりで口実を作って帰った。傷ついていたと分かる。',
      trap: 'made up を「仲直り」と取りやすい。made that up ＝ でっち上げた。本音は告白で。',
      use: 'Sorry, I made that up.（ごめん、あれは作り話）' },

    // R fix: V2 (65 % blind: the key was the only heartbreak choice). Both distractors are now hurts too
    // why: drag him along ← string… along read word by word (ひもで引っぱる); leave him behind ← she left for Italy and
    //   he flew home alone, the heartbreak script
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'string', seg: [113.0, 116.8],
      stem: 'What did Freddie swear Carly would never do to him again?',
      choices: ['Keep him hoping when she didn’t mean it', 'Drag him along on plans that weren’t his',
                'Leave him behind without a word again'], a: 0,
      cue: '「never let you」のあとの動詞。',
      line: 'I swore I would never let you *string me along* again.',
      said: '「もう二度と、気を持たされたままにはならないと誓った」と言う。',
      mean: 'string along ＝ 本気でないのに期待させて待たせる。',
      trap: 'string を「ひも」、along を「一緒に」と取ると、連れ回す話に聞こえる。句動詞は一まとまりで。',
      use: 'Don’t string me along. Yes or no?（気を持たせないで。はいかいいえか）' },

    // R fix: V2 (65 % blind: "opening… firm denial that follows" pointed at the key). The stem no longer says
    //   "opening"; the distractors are a concession and an apology for the kiss
    // why: an apology for the kiss ← すみません read as admitting fault, and "You kissed me" comes next; a concession ←
    //   the Japanese おっしゃる通りですが frame, "but" heard as a polite yes-but
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'sorrybut', reveals: ['string'], seg: [116.7, 121.2],
      stem: 'When Carly answers Freddie’s charge, what do her first two words do?',
      choices: ['Softens the denial that comes right after', 'Admits he has a point before she objects',
                'Apologizes for kissing him back then'], a: 0,
      cue: '最初の短い一言と、そのあとの but。',
      line: 'Freddie, *I’m sorry, but* I did not string you along.',
      said: '「Freddie、ごめん。でも気を持たせたりはしてない」と言う。',
      mean: 'I’m sorry, but… は謝罪でなく、反論をやわらげる前置き。',
      trap: '「ごめん」で謝ったと取りやすい。「すみません」と違い、but が続けば反論の合図。',
      use: 'I’m sorry, but that’s not true.（悪いけど、それは違うよ）' },

    // R drop: c3 (C2 stress on "did not"). 70 % blind (an uncontracted "did not" is known to carry the stress), and
    //   "did" vs "not" can't be told apart without ears (K1); a C2 sound also ships retired until heard, so it never
    //   counted. Never shipped: deleted.

    // R fix: V2 (60 % blind: the key was the only let-down reading). "Worked hard to win" became "a first step on the
    //   way to dating her", the friends-first script
    // why: a reward ← "consolation" read as comfort (なぐさめ), so a prize for being there for her; a first step ←
    //   "being my friend" heard as the friends-first script, "just" lost
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'prize', seg: [136.1, 143.8],
      stem: 'How does Carly say Freddie sees being her friend?',
      choices: ['As a second-best thing he settled for', 'As a first step on the way to dating her',
                'As a small reward for being there for her'], a: 0,
      cue: '「I guess to you」のあと、最後の二語。',
      line: 'But I guess to you, being my friend is *just a consolation prize*.',
      said: '「私の友だちなんて、ただのおまけの賞でしょ」と言う。',
      mean: 'consolation prize ＝ 勝てなかった人がもらう賞。本命の代わり。',
      trap: 'consolation を「なぐさめた」話と取りやすい。prize の前の語で、賞の種類が決まる。',
      use: 'Second place isn’t a consolation prize.（2位は参加賞じゃない）' },

    // R fix: S6/schema, the answer had a curly apostrophe (the test wants [a-z']) and the stars took in "I", which
    //   the stem's gap leaves out
    { id: 'x1', skill: 'dict', level: 'B2', point: 'back', seg: [149.1, 154.8],
      stem: 'Type the end of Carly’s line: “…just because I ___.” (4 words)', answer: 'didn\'t like you back',
      cue: '「bad guy」のあと、文の最後。',
      line: '…the bad guy for all these years just because I *didn’t like you back*.',
      said: '「好きになり返さなかっただけで悪者扱い」と言う。didn’t の t はほぼ消える。',
      mean: 'like someone back ＝ 好意に同じ気持ちで返す。',
      trap: 'didn’t が did に聞こえやすい。否定は n の鼻にかかる音で聞き取る。',
      use: 'I like him. He doesn’t like me back.（好きだけど、向こうはそうじゃない）' },

    // R fix: N6, a broken character in mean (closure ＝)
    // why: miss him ← she was leaving for Italy: the farewell-kiss script; find out ← "If you didn't like me…" heard as
    //   her testing her own feelings
    { id: 'd6', skill: 'detail', level: 'B1', point: 'whykiss', seg: [154.4, 161.3],
      stem: 'Why, Carly says, did she kiss Freddie before leaving?',
      choices: ['So that they could both move on from it', 'Because she would miss him so much',
                'To find out if she liked him or not'], a: 0,
      cue: '「why did you kiss me」への答え。',
      line: '*To give us closure so we could both move on.*',
      said: '「なぜキスを？」に「区切りをつけて、二人とも前に進めるように」と答える。',
      mean: 'closure ＝ 気持ちの区切り。終わらせるためのキス。',
      trap: '別れ際のキス＝好きの合図、という型で読みやすい。理由は To give のあと。',
      use: 'I just need closure to move on.（前に進むには区切りが必要なの）' },

    // R fix: V2 (60 % blind: "how should we hear" flagged a non-literal key, and only the key had "not… at all").
    //   The stem is neutral; "grateful" became "relieved", a sincere reading closure invites
    // why: relieved ← "closure" taken as real relief, "thank you" at face value; teasing ← "gee" heard as playful,
    //   though he has just heard the kiss was meant as an ending
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'closure', reveals: ['whykiss'], seg: [154.4, 168.6],
      stem: 'Right after her answer, how does Freddie mean his thanks?',
      choices: ['Bitter: her reason has hurt him', 'Relieved: now he knows where they stand',
                'Teasing: he wants to lighten the mood'], a: 0,
      cue: '直前の答えと、お礼の大きさの差。',
      line: 'Oh, well, gee, *thank you for the closure*. That was *awfully generous* of you.',
      said: 'キスの理由を聞いて、「区切りをどうも。ずいぶん気前がいいね」と返す。',
      mean: '感謝の形の皮肉。終わらせるためのキスと知った直後の、傷ついた返し。',
      trap: 'thank you と generous を文字通り取りやすい。つらい話の直後の大げさなお礼は皮肉を疑う。',
      use: 'Wow, thanks for the warning.（へえ、ご忠告どうも）' },

    // R fix: C2 rewrite (75 % blind: the key was the only reply that took his feelings in). Now two replies catch the
    //   sarcasm, aimed at different targets (native-level §3.1, right mechanism, wrong target)
    // why: "You're welcome" ← the thanks answered by its form (お礼にはどういたしまして, a sincerity flip); "the kiss
    //   wasn't that bad" ← the sarcasm caught but aimed at the kiss, when "thank you for the closure" aims at her reason
    // anchor: 157.6–160.9 s the kiss was "to give us closure"; then 161.4–168 s "gee… awfully generous of you": thanks
    //   that big, for that, is the dig
    { id: 'c2', skill: 'pragma', level: 'C2', point: 'closure', reveals: ['whykiss'], seg: [154.4, 168.6],
      stem: 'Which reply from Carly would show she caught what Freddie meant?',
      choices: ['Freddie, I didn’t mean it to hurt you.', 'Hey, the kiss wasn’t that bad, Freddie.',
                'You’re welcome, Freddie. I meant it kindly.'], a: 0,
      cue: 'キスの理由と、お礼の言い方の差。',
      line: 'To give us closure… — Oh, well, gee, *thank you for the closure*.',
      said: 'キスは区切りのためだったと聞き、Freddie は「区切りをどうも、気前がいいね」と返す。',
      mean: 'お礼の形の皮肉。気づいたなら、彼の痛みを受け止める返事になる。',
      trap: 'お礼の形に返すと皮肉を見逃す。皮肉の的も大事で、for のあとの closure、つまり彼女の理由に向いている。',
      use: 'I know. That was a lot to hear.（だよね。聞くのはつらかったよね）' },

    // why: won't ← don't and won't share the vowel and the t falls away; didn't ← "last night" just before pulls
    //   toward the past
    // R fix: K3/V2 (50 % blind: "film a show about old arguments" was a filler). It became the "bad memories" keyword
    //   trap. The line was trimmed (C8)
    // why: recreate again ← the first half's "recreate your memories" plan; the bad memories again ← "bad memories"
    //   is said, but as what they've had too much of
    { id: 'g2', skill: 'gist', level: 'B1', point: 'goodones', seg: [168.5, 204.5],
      stem: 'Why does Carly bring Freddie up to the studio?',
      choices: ['To look back at some good memories together', 'To recreate one more night from their past',
                'To go over the bad memories one more time'], a: 0,
      cue: '「bad memories」のあと。',
      line: 'We spent so much time on bad memories… to *look at some good ones*.',
      said: '直したデータを前に、「悪い思い出ばかりだったから、いい思い出も見よう」と言う。',
      mean: 'ケンカのあと、Carly から歩み寄る場面。',
      trap: '前半の「再現」の続きに見えやすいが、今回は本物の記録。bad と good の対比を聞く。',
      use: 'Let’s look at the bright side.（いい面を見よう）' },

    // R fix: S4/S3, the cue's "last night" (172.1 s) was outside the segment: the segment now starts at 170.9 s
    { id: 's1', skill: 'sound', level: 'B2', point: 'worried', seg: [170.9, 176.9],
      stem: 'What do you hear after “She’s worried…”?',
      choices: ['you don’t want to be friends', 'you won’t want to be friends', 'you didn’t want to be friends'], a: 0,
      cue: '「last night」のあと、worried に続く部分。',
      line: 'She’s worried *you don’t want to be friends* at all.',
      said: '「あなたがもう友だちでいたくないんじゃないかと心配してる」と伝える。',
      mean: '昨夜の言い合いで、友情まで終わったと思っている。',
      trap: 'don’t と won’t は母音が同じで t も落ちる。違いは最初の d と w。',
      use: 'I don’t want to be late.（遅れたくないんだ）' },

    // R fix: V2 (70 % blind: with the title, the only "together" choice). All three are now about her feelings, and
    //   "faded" is the "wore off" near miss. The cue's "except" is in the captions only (whisper: "But")
    // why: keep waiting ← "we should wait to date" heard as her plan now; faded but admires ← "wore off" caught, and
    //   "still my hero" heard as respect only
    { id: 'i5', skill: 'infer', level: 'C1', point: 'hero', seg: [229.8, 244.8],
      stem: 'Recalling the taco truck and what came after, what is Carly telling Freddie?',
      choices: ['Her feelings never faded, so the wait is over', 'Her feelings are real, but they should still wait',
                'Her feelings faded, but she still looks up to him'], a: 0,
      cue: '「wore off」のあと、名前を呼んでからのひと言。',
      line: 'you said we should wait to date until the whole hero thing wore off… *Freddie, you’re still my hero.*',
      said: '「ヒーロー熱が冷めるまで待とう」と言われたが、「今もあなたは私のヒーロー」と言う。',
      mean: '熱は冷めていない＝待つ理由はもうない、という告白。',
      trap: 'wore off で「冷めた」と取りやすい。待つ条件と、名前のあとの still を合わせて読む。',
      use: 'You’re still my favorite.（今でもいちばん好き）' },

    // R fix: N6, a broken character in mean (覚えていて)
    // why: her hero words ← last-heard: "you're still my hero" comes just before, so it sounds like his reply to her
    //   praise; her worry ← right topic, wrong source: the friend's "worried you don't want to be friends" (175 s)
    // anchor: 139.3–143.1 s Carly: "being my friend is just a consolation prize"; 250.4–254.4 s Freddie: "being your
    //   friend is not a consolation prize": her words, handed back with "not"
    { id: 'c1', skill: 'infer', level: 'C2', point: 'prize', seg: [244.7, 261.3],
      stem: 'When Freddie says what being her friend is, what is he answering?',
      choices: ['Her claim last night that it was just second best', 'Her words just now that he is still her hero',
                'Her worry that he no longer wants her as a friend'], a: 0,
      cue: '前に Carly が言った言葉と、同じ形。',
      line: 'being your friend is *not a consolation prize*.',
      said: 'Freddie は「君の友だちでいることは、おまけの賞なんかじゃない」と言う。',
      mean: '昨夜の Carly の言葉に not を足して返している。言われたことを覚えていて、正面から打ち消す。',
      trap: '直前の hero への返事に聞こえやすい。同じ言い回しが戻ったら、前の場面と結んで聞く。',
      use: 'You said I never listen. I do.（聞いてないって言ったけど、聞いてるよ）' },

    // R fix: V2 (55 % blind: the key was the only glad reading). "The most he can get" became "worked to become"
    //   (get to be read as 〜になる), a second glad reading
    // why: has to ← get to heard as have to (義務); worked to become ← "get to be" read as come to be (〜になる),
    //   as if he earned it
    { id: 'f4', skill: 'phrase', level: 'B2', point: 'getto', seg: [249.9, 261.3],
      stem: 'In Freddie’s last words about friendship, what does he mean?',
      choices: ['It’s the best thing he’s lucky enough to be', 'It’s the best thing he has to be for now',
                'It’s the best thing he has worked to become'], a: 0,
      cue: '「best thing」のあと、最後の部分。',
      line: 'It is *the best thing that I get to be*.',
      said: '「君の友だちでいられるのは、僕にとって最高のことだ」と言う。',
      mean: 'get to ＝ 〜させてもらえる。義務でなく特権として言っている。',
      trap: 'get to を have to や「〜になる」と取りやすい。get to ＋動詞は「〜できてうれしい」の型。',
      use: 'I get to work from home on Fridays.（金曜は在宅で働けるんだ）' },

    // R fix: V2 (65 % blind: the only reassuring choice) and S4 (the segment began inside "work", 266.5–267.4 s; it
    //   now starts at 261.2 s, before "If we try this"). The stem no longer names the speakers. "Warns" became the
    //   "no matter what" near miss
    // why: dating will work out ← "I promise, no matter what" heard as a promise about the dating, "will" not tied to
    //   "lose"; never ask again ← "never" attached to the wrong verb
    { id: 'p3', skill: 'pragma', level: 'C1', point: 'never', seg: [261.2, 279.0],
      stem: 'Right after “I can’t lose you,” what does the reply do?',
      choices: ['Promises she won’t lose him either way', 'Promises that dating will work out for sure',
                'Says he will never ask her out again'], a: 0,
      cue: '「I promise」のあと、短い文の終わり。',
      line: 'I can’t lose you. — I promise, no matter what, *you never will*.',
      said: '「失いたくない」に、「約束する。何があっても、失うことはない」と返す。',
      mean: 'you never will のあとに lose me が省かれている。',
      trap: 'never だけ拾うと「二度としない」と取りやすい。will のあとは前の動詞を補う。',
      use: 'Forget you? I never will.（君を忘れる？絶対にない）' },
  ]
};
