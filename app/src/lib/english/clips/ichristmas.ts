// “Top 5 Weirdest Moments from iChristmas 🎄 iCarly” (NickRewind, Best of iCarly): a narrator counts down the episode
// where Carly wishes Spencer were "normal" and an angel, Mitch, grants it: Spencer has an office job and boring books,
// Sam never became her friend and is in juvie, and Spencer is marrying a neighbor. Carly wishes it all back, and
// the weird tree she once hated is suddenly her favorite.
// Segments from the captions, words from whisper (2026-11-16). Carly and Sam are named in the audio; the other
// voices aren't, so items say "the stranger", "the adults" or "the narrator".
// Untested on purpose: 0–8 s (ostrich teaser), 49–64 s (the card trick's proof is visual), 121–128 s ("that" is
// visual), 151–157 s and 263–269 s (Nevel, Rona and the ibuprofen need backstory or are insults), 189–195 s ("no
// surprise" Sam ended up in juvie needs backstory), 221 s ("What cat?" in both sources, unclear), 231–236 s
// (slapstick), 256–260 s (captions "just a sister", whisper "just his sister").
// REVIEW 2026-11-17 (2nd review; the earlier R fixes had no REVIEW.md entry): pass 13, fix 11, drop 0, new 0;
//   ear checks 1
// Open: on the cold re-read c2, h1, h2 and h3 were still at 60–75 % (show sense: Spencer's oddness is the point);
//   retire c2 if a later cold read reaches 80 %. d1, d4 and i5 were picked only through a paired item's stem (c2,
//   x1, a2), and those pairs share a point or a reveal, so they're never drawn together.
// EAR CHECK: 293.6 s r1 c2 — the cut falls after “stuff it in”; the one who shouts “No one touches this tree” and
//   says “It's my favorite tree ever” is Carly (assumed; no name in the audio)
import type { Clip } from '../types.ts';

export const iChristmas: Clip = {
  id: 'ichristmas', video: '7Bq_mRcIWso', title: 'Top 5 Weirdest Moments from iChristmas 🎄 iCarly',
  dur: 306, wpm: 147, band: 'slow', tags: ['家', '友だち'],
  show: 'iCarly',
  credit: 'iCarly (NickRewind, official YouTube channel)',
  questions: [
    // R fix: V2 — show knowledge (Spencer is the odd one) picked the only Carly-about-Spencer choice; all three are
    //   now Carly's wish about Spencer
    // R fix: V2 (2nd review) — blind 70 %: show sense (Spencer is the odd one) still picked the only "normal"; the new
    //   near miss keeps "normal" and moves it to Carly's own life
    // why: never born ← the It's a Wonderful Life script, and "born" is said ("He was born normal"); her own life ←
    //   "normal" heard, "Spencer" before it missed
    { id: 'g1', skill: 'gist', level: 'B1', point: 'wish', seg: [8.7, 29.0],
      stem: 'What sets off the strange changes in this episode?',
      choices: ['Carly wishes Spencer were just normal', 'Carly wishes Spencer were never born',
                'Carly wishes her own life were normal'], a: 0,
      cue: '「wishes」の前後、誰が誰について願うか。',
      line: 'Carly *wishes Spencer was normal*, and everything changes.',
      said: 'カーリーが「スペンサーが普通だったら」と願い、すべてが変わる。',
      mean: 'wish ＋ 過去形 ＝ 現実と違うことを願う。ここではお兄さんの変わり者ぶり。',
      trap: 'born も出てくるし、normal だけでは自分の生活の話にも聞こえる。直後の名前を聞く。',
      use: 'I wish it were a little quieter.（もう少し静かならいいのに）' },

    // why: a fight ← "freak" heard as a quarrel word; a storm ← "freak" goes with weather (a freak storm)
    { id: 'd1', skill: 'detail', level: 'B1', point: 'fire', seg: [20.6, 29.0],
      stem: 'According to the narrator, what happens just before Carly’s wish?',
      choices: ['A fire breaks out in the Christmas tree', 'A fight breaks out over the Christmas tree',
                'A freak storm hits on Christmas Eve'], a: 0,
      cue: '「Starting out after a freak」のあとの二語と一語。',
      line: 'after a freak *Christmas tree fire*, Carly wishes…',
      said: '「突然のクリスマスツリーの火事のあと、カーリーが願う」と言う。',
      mean: 'freak ＝ 思いがけない、まれな。何が起きたかは最後の fire。',
      trap: 'freak storm という言い方もあるので天気を想像しやすい。名詞が続いたら最後の語が中心。',
      use: 'There was a freak accident at work.（職場でまさかの事故があった）' },

    // why: advice ← "you better" = 〜したほうがいい, read as kind advice; call for help ← "call the cops" heard as
    //   help for him
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'cops', seg: [35.9, 43.0],
      stem: 'After “someone’s a little jumpy”, what is the reply to the stranger doing?',
      choices: ['Warning him to leave, or else', 'Advising him kindly for his own good',
                'Offering to call someone to help him'], a: 0,
      cue: '文の前半の言い方と、後半に来るもの。',
      line: 'You *better get out of here or I’ll call the cops*.',
      said: '「出て行ったほうが身のため。でないと警察を呼ぶ」と言う。',
      mean: 'you better 〜 or … ＝ 〜しないと…するぞ、という警告。',
      trap: '「〜したほうがいい」と訳すと助言に聞こえる。or のあとに罰が来たら、警告。',
      use: 'You better hurry, or we’ll miss it.（急がないと乗り遅れるよ）' },

    // R fix: V2 — "nervous and jumpy" wasn't a look; now "tired" (you look rough = 具合が悪そう), a real reading of rough
    // why: dangerous ← rough = 乱暴; tired ← "you look rough" = looking ill or worn out
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'rough', seg: [42.8, 49.1],
      stem: 'How does the narrator say the angel looks?',
      choices: ['A bit scruffy and unpolished', 'A bit tough and dangerous', 'A bit tired and worn out'], a: 0,
      cue: '「he looks pretty」のあとの四語。',
      line: 'he looks pretty *rough around the edges*.',
      said: '「天使とは信じにくい。見た目がかなり雑だから」と言う。',
      mean: 'rough around the edges ＝ 身なりが雑で粗削り。悪人ではない。',
      trap: 'rough を「乱暴」と取ると危ない人に聞こえる。around the edges は「表面が」。',
      use: 'He’s a bit rough around the edges.（ちょっと粗削りな人だね）' },

    // R fix: V2 — "Scared" was a filler; now the Japanese frame of politely humoring him
    // R fix: V2 (2nd review) — blind 55 %: the key alone echoed "anyone"; it's reworded off the clip's words, and
    //   "polite" gives way to "nervous", from "someone's a little jumpy" just before
    // why: amazed ← an angel story, so the trick sounds like proof; nervous ← she was "a little jumpy" a moment ago
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'trick', seg: [53.4, 59.6],
      stem: 'When the stranger names the card, how does the reply sound?',
      choices: ['Unimpressed: a card trick proves nothing', 'Amazed: only an angel could know that',
                'Nervous: a stranger just read her mind'], a: 0,
      cue: '「King of clubs」のあと、「So」で始まる問い。',
      line: 'King of clubs. — *So, anyone can do card tricks?*',
      said: 'カードを当てられても「で？カードの手品なんて誰でもできるでしょ」と返す。',
      mean: 'So, 〜? は「それが何？」の問い返し。まだ信じていない。',
      trap: '天使の話なので驚きを予想しやすい。anyone can で「特別じゃない」と言っている。',
      use: 'So? Anyone can do that.（で？そんなの誰でもできるよ）' },

    // R fix: S3 — the cue's "/skr/" fit only the key; it now points at the vowel after the s
    // why: scary ← screwy/scary differ in one vowel; stupid ← the s- start and the angry tone
    { id: 's1', skill: 'sound', level: 'C1', point: 'screwy', seg: [74.4, 81.25],
      stem: 'Fill the gap: “You’re ___, that’s what you are.”',
      choices: ['screwy', 'scary', 'stupid', 'sneaky'], a: 0,
      cue: '二回目の「You’re」のあと、s の次の母音。',
      line: 'You’re — you’re *screwy*, that’s what you are.',
      said: '「普通に生まれた」と聞き、「頭おかしいよ」と言い返す。',
      mean: 'screwy ＝ 変な、いかれた（くだけた語）。that’s what you are で念押し。',
      trap: 'scary と母音一つの差。s のあとの r と、長い「ルーイ」の音を聞く。',
      use: 'This plan sounds a little screwy.（この計画、ちょっと変だよ）' },

    // R fix: V2/N7 — "office job" was the only specific, "normal" choice, and the smoke choice named d1's fire; now
    //   three stress sources, one from what Spencer is in the real show
    // why: art not selling ← Spencer the artist is the one viewers know; dinner ← antacid is for the stomach, and it's
    //   Christmas
    { id: 'i2', skill: 'infer', level: 'B2', point: 'office', reveals: ['wish'], seg: [86.0, 92.9],
      stem: 'What do the antacid lines tell us about this Spencer?',
      choices: ['His new job at an office is stressing him', 'His art isn’t selling, and it’s stressing him',
                'Christmas dinner has upset his stomach'], a: 0,
      cue: '胃薬のお礼のあと、何のせいで胃が痛いか。',
      line: 'The *stress down at the office* has really been upsetting my stomach.',
      said: '胃薬をもらって、「会社のストレスで胃の調子が悪くて」と言う。',
      mean: '普通のスペンサーは会社勤めで、ストレスをかかえている。変わり者の芸術家とは正反対。',
      trap: '胃と聞くと食べすぎ、スペンサーなら作品の話を想像しやすい。理由は stress のあと。',
      use: 'Work stress is getting to me.（仕事のストレスがこたえてる）' },

    // R fix: V2 — "while she panics" made the key the only contrast joke; all three are now jokes about the adults
    // R fix: V2 (2nd review) — blind 60 %: "scare each other" didn't fit two people praising a book; now the same
    //   gushing about a book taken as scary, so key and near miss differ only in what the book is
    // why: scary as cozy ← "scary novel" asked just before, so the baker book sounds like the scary one; neither
    //   read it ← "No, I haven't been reading a novel" heard as the adults' line
    { id: 'h1', skill: 'humor', level: 'C1', point: 'novel', reveals: ['baker'], seg: [108.7, 121.3],
      stem: 'Why is the talk about the novel funny?',
      choices: ['They gush over a book that sounds deadly dull',
                'They gush over a scary book as if it were cozy',
                'They argue over a book neither has read'], a: 0,
      cue: '本の中身と、二人目の感想の言葉。',
      line: 'It’s all about a *baker* in the 1700s who makes *bread for peasants*. — I love that book. It’s a *charming read*.',
      said: '「怖い小説でも読んだ？」のあと、大人たちはパン屋の本で盛り上がる。',
      mean: '地味な本を楽しそうにほめる、普通すぎる世界が笑い。',
      trap: 'scary novel が直前なので、その本が怖いと取りやすい。中身は bread for peasants。',
      use: 'It’s a charming read.（心温まる本だよ）' },

    // why: 1600/1800/1900 ← "seventeen hundreds" heard with the first part only
    { id: 'n1', skill: 'number', level: 'B1', point: 'baker', seg: [113.85, 118.7], keep: true,
      stem: 'When is the baker novel set?',
      choices: ['the 1600s', 'the 1700s', 'the 1800s', 'the 1900s'], a: 1,
      cue: '「a baker in the」のすぐあと。',
      line: 'a baker *in the 1700s*',
      said: '「1700年代のパン屋の話」と説明する。',
      mean: 'the 1700s ＝ seventeen hundreds。18世紀のこと。',
      trap: '年代は最初の二けたで言う。seventeen の -teen は後ろが強い。',
      use: 'The house was built in the 1800s.（その家は1800年代に建った）' },

    // R fix: S1 — "Freddie's new girl" in the stem pointed to a romance; the stem now names Spencer's moment only
    // why: can't stand each other ← "odd couple" known as a pair who clash; the only odd ones ← "aren't the only" heard
    //   as "are the only"
    { id: 'i3', skill: 'infer', level: 'C1', point: 'couple', reveals: ['married'], seg: [127.95, 136.6],
      stem: 'When the narrator first names Spencer and Mrs. Benson, what does he imply?',
      choices: ['He and Mrs. Benson are dating each other', 'He and Mrs. Benson can’t stand each other',
                'He and Mrs. Benson are the only odd ones'], a: 0,
      cue: '「aren’t the only」のあとと、続く Freddie の話。',
      line: 'Spencer and Mrs. Benson *aren’t the only odd couple*… Freddie also has a *new girl in his life*.',
      said: '「妙なカップルは二人だけじゃない。フレディにも新しい彼女が」と言う。',
      mean: 'aren’t the only 〜 ＝ ほかにもいる。二人もカップルという前提。',
      trap: 'aren’t の n’t が弱いと「唯一の」に聞こえる。also が続けば「ほかにも」。',
      use: 'You’re not the only one who’s tired.（疲れてるのは君だけじゃない）' },

    // why: never met ← "barely knows" comes later in the clip; already has one ← "girlfriend" heard, "hates" missed
    { id: 'd3', skill: 'detail', level: 'B1', point: 'rona', seg: [136.7, 147.6],
      stem: 'Why does Carly say the girl can’t be Freddie’s girlfriend?',
      choices: ['Freddie really can’t stand her', 'Freddie has never met her', 'Freddie has a girlfriend already'], a: 0,
      cue: '「No, she’s not」のあとの短い文。',
      line: 'No, she’s not. *He hates* Rona Berger.',
      said: '「そんなはずない。フレディは彼女が大嫌いなんだから」と言う。',
      mean: 'hates が理由。カーリーの知る世界と、この世界がずれている。',
      trap: 'girlfriend が何度も聞こえるので、別の彼女の話に流れやすい。理由は he hates。',
      use: 'No way. He hates spicy food.（ありえない。彼、辛いの大嫌いだよ）' },

    // why: little to her ← "not so special" read literally as a friend she doesn't value; a crush ← "special someone"
    //   as a secret love
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'special', seg: [147.6, 157.8],
      stem: 'What does the narrator say Carly has in this world?',
      choices: ['A boyfriend she’d never choose', 'A friend who means little to her',
                'A crush who doesn’t like her back'], a: 0,
      cue: '「Even Carly has a」のあと、決まり文句の変え方。',
      line: 'Even Carly has a *not-so-special someone*.',
      said: '「カーリーにも、うれしくない恋人がいる」と言う。',
      mean: 'special someone ＝ 恋人。not-so で「ありがたくない恋人」にひねっている。',
      trap: 'not so special を「大事でない友だち」と取りやすい。someone は恋人。',
      use: 'Are you bringing a special someone?（誰か大切な人を連れてくる？）' },

    // why: moved away ← "when you were little" heard as a childhood event; Carly thought ← the "she" and "Spencer"
    //   roles swapped
    { id: 'd4', skill: 'detail', level: 'B2', point: 'sam', seg: [173.1, 181.7],
      stem: 'In this world, why did Carly and Sam never become friends?',
      choices: ['Spencer kept Carly away from her as a kid', 'Sam moved away when they were both little',
                'Carly thought Sam was a bad kid back then'], a: 0,
      cue: '「thought」の文の主語と、次の文。',
      line: 'Spencer thought she was *a bad kid*… So you and Sam never became friends.',
      said: '「スペンサーがサムを悪い子だと思って、小さいころ会わせなかった。だから友だちにならなかった」と言う。',
      mean: '普通のスペンサーの判断が、二人の出会いをなくした。',
      trap: 'bad kid と思ったのはスペンサー。thought の前の主語を聞く。',
      use: 'My parents never let me stay out late.（親は夜遊びを許さなかった）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'hangout', reveals: ['sam'], seg: [177.35, 181.7],
      stem: 'Type: “He never let you ___ her when you were little.” (3 words)', answer: 'hang out with',
      cue: '「He never let you」のすぐあと、三語がひと続き。',
      line: 'He never let you *hang out with* her when you were little.',
      said: '「小さいころ、彼女と遊ぶのを許さなかった」と言う。',
      mean: 'hang out with ＝ 一緒に過ごす、遊ぶ。友だち付き合いの基本表現。',
      trap: 'hang‿out‿with がつながり「ハンガウウィズ」に近い。out の t はほぼ消える。',
      use: 'Want to hang out this weekend?（週末、遊ばない？）' },

    // R fix: V2 — "promising to get her out" didn't fit "my fault"; now "led her into crime", what my fault could mean
    // why: an apology ← "my fault" heard as sorry for something smaller; led her astray ← "my fault you're in here"
    //   read as a bad influence
    { id: 'i5', skill: 'infer', level: 'B2', point: 'fault', reveals: ['wish'], seg: [195.2, 203.8],
      stem: 'How does Sam first take “It’s my fault you’re in here”?',
      choices: ['As Carly saying she’d reported her to the cops', 'As Carly saying sorry for not visiting',
                'As Carly saying she’d led her into crime'], a: 0,
      cue: 'サムがすぐ聞き返す問いの中身。',
      line: 'It’s my fault you’re in here. — *You’re the one who called the cops?*',
      said: '「ここにいるのは私のせい」に、サムは「通報したのはあんた？」と返す。',
      mean: 'my fault を、通報したという告白と受け取った。本当は願い事の話。',
      trap: 'fault は「悪いのは私」という広い言い方。相手の聞き返しで、どう取ったかが分かる。',
      use: 'It’s my fault we’re late.（遅れたのは私のせい）' },

    // R fix: V2 — blind 55 %: the feeling labels let show sense (Sam = tough) pick "Angry"; the choices now name the
    //   move only, and the new near miss takes "when I get out of here" literally
    // why: breaking out ← "get out of here" heard as an escape plan; trusted her ← a friend's betrayal reading
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'swear', reveals: ['fault'], seg: [195.2, 201.4],
      stem: 'Thinking Carly called the cops, how does Sam start to react?',
      choices: ['She starts to warn Carly of payback', 'She starts to talk about breaking out',
                'She starts to say she trusted Carly'], a: 0,
      cue: '「Dude」のあと、when のあとに何が来そうか。',
      line: 'Dude, *I swear when I get out of here*…',
      said: '「おい、ここを出たら絶対…」と言いかけ、カーリーが止める。',
      mean: '出たら覚えてろ、という脅しの決まった形。',
      trap: 'get out of here だけ拾うと脱走の話に聞こえる。I swear when … は仕返しの予告。',
      use: 'I swear, if you’re late again…（今度遅れたら、本当に…）' },

    // anchor: 209.60–210.24 s both sources have "you know me a lot", four quick words right after "Dude, I barely know
    //   you"; a learner writes "you know me well"
    { id: 'c1', skill: 'dict', level: 'C2', point: 'barely', seg: [208.35, 213.5],
      stem: 'Type Carly’s reply to “I barely know you”: “___.” (5 words)', answer: 'you know me a lot',
      cue: '「barely know you」のすぐあと。文法より、聞こえた音を。',
      line: 'Dude, I barely know you. — *You know me a lot.* We were best friends…',
      said: '「ほとんど知らない」に「よく知ってるよ。親友だったんだから」と返す。',
      mean: '教科書なら know me well。barely の反対を急いで言い、a lot が出た。',
      trap: '習った well に直したくなる。正しい文でなく、言われた音を書く。',
      use: 'You know me better than that.（私がそんなことしないって知ってるでしょ）' },

    // R fix: V2 — "getting a cat" was no one's idea of shocking news; now "going to be a dad"
    // why: moving ← "go back" from the next line; a dad ← "shocking news" at a party, the other big announcement
    { id: 'd5', skill: 'detail', level: 'B1', point: 'married', seg: [213.6, 225.2],
      stem: 'What shocking news comes out at the party?',
      choices: ['Spencer is getting married', 'Spencer is moving away', 'Spencer is going to be a dad'], a: 0,
      cue: '「Spencer and I are」のあとの二語。',
      line: 'Spencer and I are *getting married*.',
      said: 'パーティーで「スペンサーと私、結婚するの」と発表される。',
      mean: 'getting married ＝ 結婚する予定。これが最後の一押しになる。',
      trap: 'shocking news から、引っ越しや子どもも想像しやすい。are getting のあとが中身。',
      use: 'We’re getting married in June.（6月に結婚します）' },

    // R fix: V2 (2nd review) — blind 50 %: a wish undoing a wish was the symmetrical guess; now asked as what
    //   finally pushes her, with the clip's other two shocks as near misses. Reveals the news (d5) and the straw (f4)
    // why: juvie ← Sam locked up is the scene just before, and a big shock; no iCarly ← "There is no iCarly" is the
    //   loss Carly protests most
    { id: 'g2', skill: 'gist', level: 'B2', point: 'back', reveals: ['married', 'straw'], seg: [213.6, 285.0],
      stem: 'What finally pushes Carly to undo the change?',
      choices: ['Hearing Spencer is about to get married', 'Finding out Sam is locked up in juvie',
                'Learning that iCarly was never made'], a: 0,
      cue: '「final straw」の直前に何があったか。',
      said: '結婚の知らせが最後の一押しになり、元に戻ってと願う。',
      mean: 'サムの件も iCarly がないことも重なったが、決め手は結婚の知らせ。',
      trap: 'サムや iCarly の件も大きな衝撃。final（最後の）が指すのは直前の知らせ。',
      use: 'I just want things back to normal.（元どおりになってほしいだけ）' },

    // R fix: V2 — "last chance to fix things" didn't use the straw image; now the clutch-at-straws reading
    // R fix: V2 (2nd review) — blind 60 %: "final surprise of the night" didn't parallel the other two; all three now
    //   start "The last…", and the surprise reading becomes "the last thing she expected"
    // why: last hope ← "straw" heard and 藁にもすがる (clutching at straws) recalled; expected ← "shocking news" just
    //   before, and "the last thing I expected" is a common chunk
    { id: 'f4', skill: 'phrase', level: 'B2', point: 'straw', reveals: ['back'], seg: [224.75, 231.2],
      stem: 'After the news, what does the narrator say it was for Carly?',
      choices: ['The last thing she could take', 'The last hope she could cling to', 'The last thing she expected to hear'], a: 0,
      cue: '「that was the final」のあとの一語と、続く行動。',
      line: 'that was *the final straw* for Carly, and she wished that everything would go back…',
      said: '「それがカーリーにとって最後の一押しで、元に戻ってと願った」と言う。',
      mean: 'the final straw ＝ 我慢の限界を越えさせた最後の一つ。それで行動に出る。',
      trap: 'straw から「藁にもすがる」を思い出しやすいが別の表現。直後の行動が答え合わせ。',
      use: 'That was the final straw.（もう我慢の限界だった）' },

    // R fix: V2/N7 — the key's "as she wished" tied it to g1's answer and was the only one about the wish
    // R fix: V2 (2nd review) — blind 60 %: "teasing" wasn't a reading of the line itself; now "too shy", what "only
    //   in church" could mean to a partial listener
    // why: hiding it ← "I only sing" heard as a denial of the cooking song; shy ← "only… in church" heard as "never
    //   in front of anyone", though a church has people in it
    { id: 'h2', skill: 'humor', level: 'C1', point: 'church', seg: [243.9, 254.4],
      stem: 'Why is the reply about singing funny?',
      choices: ['He’s become so proper even singing has its place', 'He’s hiding that he sings while he cooks',
                'He’s become too shy to sing where people can hear'], a: 0,
      cue: '「歌うでしょ」と言われたあと、歌う場所の一語。',
      line: 'when you make ’em, you sing a little song. — Carly, I *only sing songs in church*.',
      said: '「タコスを作るとき歌うでしょ」に、「歌うのは教会だけだよ」とまじめに返す。',
      mean: '願った「普通」がまさにこれ。まじめすぎる返事で、なくしたものの大きさが分かる。',
      trap: 'only は隠す言い方でも照れでもない。教会でなら人前で歌う人。まじめな本気の返事。',
      use: 'I only drink coffee in the morning.（コーヒーは朝しか飲まない）' },

    // R fix: V2 — the key was the only choice that read as a joke; reworded so all three are plain claims
    // R fix: V2 (2nd review) — blind 55 %: "still too normal" contradicted "abnormal"; now the right joke aimed at the
    //   wrong person (Carly, who has just been shouting)
    // why: wish not worn off ← "abnormal" heard as a warning that something's still off; Carly the odd one ← she was
    //   just screaming at everyone, and "abnormal" is said of "everything", not her
    { id: 'h3', skill: 'humor', level: 'C1', point: 'abnormal', seg: [273.95, 281.4],
      stem: 'Why does the narrator correct himself right after “returned to normal”?',
      choices: ['Their old “normal” was odd to begin with', 'Part of the wish is still hanging around',
                'Carly is now the odd one, not Spencer'], a: 0,
      cue: '「Or」のあとの一語の、頭の音。',
      line: 'everything returned to normal. *Or… abnormal?*',
      said: '「すべて普通に戻った。いや、普通じゃない状態に？」と言い直す。',
      mean: 'この家の「元どおり」は変わり者の毎日。言い直して、そこを笑っている。',
      trap: 'abnormal を「まだおかしい」という警告と取りやすい。戻ったのは、いつもの変な日常。',
      use: 'Back to normal, or what counts as normal.（元どおり、というかいつもどおり）' },

    // R fix: V2/N7 — the fire choice named d1's key and was a weak filler; now a "wait", a near miss to the "no"
    // why: thank-you ← a friendly offer to help usually gets thanks; last look ← a "wait" stops the action too, and
    //   someone attached to a tree might want one more look
    { id: 'r1', skill: 'predict', level: 'B2', point: 'tree', seg: [286.2, 293.6], then: [293.6, 301.4],
      stem: 'Spencer agrees to throw the tree out. What kind of reaction comes next?',
      choices: ['A sudden “no”: the tree must stay', 'A thank-you for clearing it away',
                'A “wait”: someone wants a last look'], a: 0,
      cue: 'このツリーは、元の世界で何を意味する？',
      line: 'Yeah, just help me stuff it in — *No! No one touches this tree!*',
      said: 'ツリーを捨てるのを手伝おうかと聞かれ、スペンサーが応じると、「だめ！誰も触らないで！」と止める声。',
      mean: '変わり者のスペンサーの象徴が、今は大事なものになっている。',
      trap: '手伝いの申し出にはお礼、という流れを予想しやすい。ここは話が元に戻った直後。',
      use: 'Don’t touch that! It stays.（触らないで！それは残すの）' },

    // anchor: 297.28–300.80 s "I thought you hated it. — I do not! It's my favorite tree ever!"; 207.12 s "He made a
    //   magnetic tree that…" and 21–26 s "after a freak Christmas tree fire, Carly wishes Spencer was normal": the tree
    //   behind the wish is now her favorite
    // R fix: V2 — the stem sends the reader to the start, and only the key tied back to it; all three now do
    // R fix: V2 (C2, 2nd review) — blind 75 %: "a warning against wishes" was a weak reading; now a keepsake of the
    //   adventure, the near miss a fluent listener might pick. One rewrite; drop if a cold read still gets it at ≥ 80 %
    // why: forgives ← the tree did start the fire, and "I thought you hated it" heard as blame; proof ← the tree was
    //   there at the start of the wish, so it reads as a souvenir
    { id: 'c2', skill: 'infer', level: 'C2', point: 'tree', reveals: ['fire'], seg: [288.45, 301.4],
      stem: 'Given how the episode began, what does “my favorite tree ever” show?',
      choices: ['She now loves the oddness she wished away', 'She now forgives the tree for starting the fire',
                'She now treasures it as proof the wish was real'], a: 0,
      cue: '最初の火事の原因と、「hated」との差。',
      line: 'I thought you *hated* it. — I do not! It’s my *favorite tree ever*!',
      said: '「嫌いだと思ってた」に「最高のツリー！」と返す。',
      mean: '願い事のきっかけの変わったツリーが、今は一番。兄の変なところごと好きになった。',
      trap: '火事の原因なので「許した」と取りやすい。hated から favorite は、許すより強い。兄への気持ち。',
      use: 'I hated it once. Now I love it.（前は嫌いだったけど、今は大好き）' },
  ]
};
