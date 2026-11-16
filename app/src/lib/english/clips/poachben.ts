// “Michael Tries To Steal A Sales Person - The Office US” (the official The Office channel, Best of Season 4): Michael
// phones Karen to stop her branch taking Stanley, offers Toby instead, then threatens to poach one of hers and pitches
// her top salesman, Ben, who isn't sold; a talking head closes it.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 109 s; music after. Names said: Stanley,
// Toby, Michael, Karen, Ben Nugent. The voice on the line until 51 s is taken as Karen's: "Goodbye, Michael" and then
// "Karen, could you transfer me…" are one exchange. No who items, no number item (the only number is the genie's
// "three wishes", which anyone can guess). Untested on purpose: 0–7.9 s ("How they hangin'? — To the left?": innuendo;
// captions drop "Enough small talk"), 57.8 s (whisper "in Utica", captions "in America"), 88–91 s (Camden/Stamford: the
// branches need backstory), 108.5 s ("Animal House": a film reference).
// EAR CHECK: 25.3 s s1 — "You can train him": the weak "can" (both sources "can"); confirm it isn't "can't"
// EAR CHECK: 74–91 s a2 g2 c2 — Ben's lines are whisper-only (captions have a gap): "Aren't you the guy that hit the
//   woman with your car?", "Scranton Branch is worse than Camden", "Didn't everyone from Stanford quit, like,
//   immediately?" (captions keep only "immediately"); the keys rest on Michael's replies, which both sources have
// REVIEW 2026-11-16: pass 6, fix 14, drop 0, new 0; ear checks 2
// REVIEW open: c1's seg is 19.3 s (over the 15 s rule, kept: the anchor "That was a bluff" sits 15 s after "very hard";
//   the repo test only bounds gist).
import type { Clip } from '../types.ts';

export const poachBen: Clip = {
  id: 'poachben', video: 'C7t-G7ynIo8', title: 'Michael Tries To Steal A Sales Person', dur: 122,
  wpm: 139, band: 'slow', tags: ['職場', '電話'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: blind 55 %: the key was the only choice about Stanley and the only one before the call turns. Now a
    //   Stanley trade (the Toby offer + the end of the call + the title's "steal", blended) sits beside it.
    // why: offer ← Toby is offered, but only as a means to keep Stanley; trade ← he offers Toby, then asks for her best
    //   one, and the title says "steal", so a swap seems to be the plan
    { id: 'g1', skill: 'gist', level: 'B2', point: 'stanley', reveals: ['poach', 'offer', 'transfer'], seg: [7.5, 52.0],
      stem: 'Why did Michael call Karen in the first place?',
      choices: ['To keep Stanley from joining her branch', 'To offer her one of his own people',
                'To trade Stanley for her best salesperson'], a: 0,
      cue: '最初の「Listen」のあと、本題の一文。',
      line: 'you cannot *tear Stanley from his family* like this.',
      said: '部下の Stanley を Karen の支店に取られそうで、やめさせようと電話している。',
      mean: 'Toby の話も脅しも、Stanley を守るための手。目的は最初の一文にある。',
      trap: 'タイトルの「引き抜き」は後半の反撃。何のための電話かは冒頭で決まる。',
      use: 'I’m calling about my reservation.（予約の件でお電話しました）' },

    // why: threat ← "tear… from his family" heard as Michael threatening to drag Stanley's family in; coworkers ← the
    //   "work family" correction heard back into Karen's reply
    { id: 'i1', skill: 'infer', level: 'B2', point: 'family', seg: [11.0, 18.45],
      stem: 'How does Karen take Michael’s line about Stanley’s family?',
      choices: ['As his wife and kids, who are moving too', 'As a threat to call his wife and kids',
                'As his coworkers, who might move with him'], a: 0,
      cue: 'Karen の返事と、Michael の言い直し。',
      line: 'you cannot tear Stanley *from his family*… — his family’s *coming with him*. — No, his *work family*.',
      said: '「家族から離すな」に「家族も一緒に来るでしょ」と返され、「職場の家族だ」と直す。',
      mean: 'Michael の family は職場の仲間。Karen は本当の家族と取った。',
      trap: 'あとの work family を前に重ねやすい。言い直しはずれの印。',
      use: 'You guys are like my work family.（みんなは職場の家族みたいなもの）' },

    // R fix: blind 75 %: "look at a file" (on a phone call) and "angry" were fillers. Now a literal "check something on
    //   her end" and "sees what she meant" (look ≈ I see), which "No, his work family" just before refutes.
    // why: check ← look = 見る, read literally, on the phone; sees what she meant ← "Look" heard as giving in after her
    //   correction
    { id: 'm1', skill: 'marker', level: 'B2', point: 'look', reveals: ['family'], seg: [17.0, 22.4],
      stem: 'What does the short word that opens Michael’s offer do?',
      choices: ['Gets her attention for a serious point', 'Asks her to check something on her end',
                'Shows he sees what she meant now'], a: 0,
      cue: '言い直しのすぐあと、文頭の一語。',
      line: '*Look*, this is very hard for me, but I’m going to give you my best man.',
      said: '「いいかい、これはとてもつらいけど、一番の部下をあげよう」と切り出す。',
      mean: '文頭の Look ＝「いいかい」。見る話ではなく、大事な話の前置き。',
      trap: 'look を「見る」と取ると、何かを確かめる話に聞こえる。文頭の単独の一語は合図。',
      use: 'Look, I’ll be honest with you.（いいかい、正直に言うよ）' },

    // why: truly hurts ← "very hard for me" taken as sincere (the sincerity flip); hard to ask a rival ← the difficulty
    //   heard as being about talking to Karen (a scope shift)
    // anchor: 34.8–36.8 s "Toby is the worst. That was a bluff.": the "hard" sacrifice of his "best man" was staged
    // R fix: blind 55 %: "really meant" told the reader the line wasn't sincere, so the one insincere choice won. The
    //   stem now asks what it means here.
    // retired: one C2 alone is under 2 (c2 retired)
    { id: 'c1', skill: 'infer', level: 'C2', point: 'bluff', reveals: ['offer'], seg: [17.9, 37.2], retired: true,
      stem: 'Which plain-English version fits what “this is very hard for me” means here?',
      choices: ['“I’ll act sad so the offer seems big.”', '“It truly hurts to let a good man go.”',
                '“It’s hard to ask a rival for a favor.”'], a: 0,
      cue: '「very hard」と、少しあとの本音を比べて。',
      line: 'this is *very hard for me*, but… You may have Toby. … *That was a bluff*.',
      said: '「つらいけど一番の部下をあげる」と Toby を差し出し、少しあとで「はったり」と明かす。',
      mean: 'つらいふりは、差し出す物を大きく見せる演技。あとの bluff が、前置きも演技だったと書きかえる。',
      trap: '気持ちの言葉は本心と取りやすい。あとで種明かしがあれば、前の言葉もさかのぼって疑う。',
      use: 'This hurts me more than it hurts you.（つらいのはこっちのほうだよ）' },

    // R fix: blind 50 %: "a raise" (offered to Karen) was a filler. Now "his best salesman", from “my best man”, which
    //   Karen's "not a salesperson" refutes; the seg runs on to her reply, so it reveals notsales.
    // why: best salesman ← "my best man" heard as "best salesman"; swap ← he asks for one of hers later, so a trade
    //   seems to be on the table already
    { id: 'd1', skill: 'detail', level: 'B1', point: 'offer', reveals: ['notsales'], seg: [18.0, 25.6],
      stem: 'What does Michael offer Karen?',
      choices: ['Another person from his office', 'His best salesman instead of Stanley', 'A swap for her best salesperson'], a: 0,
      cue: '「very hard for me」のあと、何を差し出すか。',
      line: 'I’m going to *give you* my best man. You may have *Toby*.',
      said: '「一番の部下をあげよう。Toby を持っていっていい」と言う。',
      mean: 'Stanley の代わりに Toby を差し出す。見返りは求めていない。',
      trap: 'best man は best salesman に聞こえやすい。直後の「営業じゃない」で違うと分かる。',
      use: 'You can have my seat.（私の席、どうぞ）' },

    // R fix: blind 60 %: "too new" was weak. Now "won't want to move", the usual objection to a transfer.
    // why: won't move ← the usual objection when someone is offered to another branch, and family/moving came up just
    //   before; Michael's friend ← "best man" heard as a wedding best man
    { id: 'd2', skill: 'detail', level: 'B1', point: 'notsales', reveals: ['offer', 'train'], seg: [22.2, 25.6],
      stem: 'What problem does Karen point out with the offer?',
      choices: ['Toby doesn’t work in sales', 'Toby won’t want to move', 'Toby is Michael’s close friend'], a: 0,
      cue: '名前が出たすぐあと、Karen の一言。',
      line: '*Toby’s not a salesperson*.',
      said: 'Toby をあげると言われ、「Toby は営業じゃない」と返す。',
      mean: 'Karen がほしいのは営業の人。職種が違えば代わりにならない。',
      trap: '直前に家族や引っ越しの話があり、移る気の話と思いやすい。not a salesperson は職種の話。',
      use: 'I’m not a morning person.（朝は苦手なんです）' },

    // why: can't ← the weak "can" sounds like a clipped "can't", and a no would fit after an objection; trade ←
    //   train/trade differ only at the end
    // R fix: seg was 2.5 s (under 3); now starts at Karen's "Toby's" (23.7 s).
    { id: 's1', skill: 'sound', level: 'B2', point: 'train', reveals: ['notsales'], seg: [23.6, 27.1],
      stem: 'After Karen’s objection, what does Michael say about Toby?',
      choices: ['You can train him.', 'You can’t train him.', 'You can trade him.'], a: 0,
      cue: '異議のすぐあと、can の音の長さ。',
      line: '*You can train him*. He’s very, very smart…',
      said: '「営業じゃない」と言われ、「教えればいい」と返す。',
      mean: '肯定の can は弱く「クン」に近い。can’t なら母音がはっきりし、t の前で息が止まる。',
      trap: '弱い can は聞き落としやすく、否定に聞こえることもある。母音が短く弱いなら肯定と考える。',
      use: 'You can learn it in a day.（1日で覚えられるよ）' },

    // R fix: blind 85 %: the key was the only twist. The cue quoted "I can't do it", whose "can't" only the key held.
    //   Distractors: "Can't be trained" is now "begs her to take Toby away" (the dump-him
    //   reading of the offer), which "I can't do it… that was a bluff" refutes.
    // why: miss Toby ← "I can't do it" heard as being unable to let Toby go; begs ← "Toby is the worst" heard as him
    //   trying to get rid of Toby
    { id: 'h1', skill: 'humor', level: 'C1', point: 'bluff', seg: [25.0, 37.2],
      stem: 'Why does Michael’s praise of Toby get a laugh?',
      choices: ['Right after, he admits he can’t stand Toby', 'Right after, he admits he will miss Toby',
                'Right after, he begs her to take Toby away'], a: 0,
      cue: 'ほめ言葉のすぐあと、本音が出る部分。',
      line: 'smart and funny and charming. … *Toby is the worst*. That was a bluff.',
      said: '「賢くて面白い」とほめた直後、「無理だ。Toby は最悪。今のははったり」と言う。',
      mean: 'ほめたのは手放すための売り文句。本音を自分でばらし、前の言葉を打ち消す。',
      trap: 'I can’t do it を「手放せない」と取りやすい。本音が来たら前は演技。',
      use: 'I can’t keep a straight face.（真顔でいられない）' },

    // R fix: blind 75 %: with the title's "steal", the only taking choice won. All three now take someone: hers, Stanley
    //   back (the first "poach… my guys"), or a trade.
    // why: win Stanley back ← the first "poach one of my guys" heard as the threat; trade ← he just offered Toby, so a
    //   swap seems next
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'poach', seg: [37.0, 43.2],
      stem: 'What does Michael threaten to do after the Toby offer?',
      choices: ['Hire away one of her people', 'Win Stanley back from her', 'Trade Stanley for one of hers'], a: 0,
      cue: '「if you were going to」のあとと、後半の言い返し。',
      line: 'if you were going to *poach* one of my guys, I am going to *poach* one of yours.',
      said: '「そっちがうちの人を引き抜くなら、こっちも引き抜く」と言う。',
      mean: 'poach ＝ 他社の人材を引き抜く。もとは密猟の意味。',
      trap: 'poach は2回。1回目は my guys（Stanley）。2回目の one of yours で相手の人の話になる。',
      use: 'They poached our best designer.（うちの一番のデザイナーを引き抜かれた）' },

    // R fix: seg ended at 46.0 s, inside Michael's first "wait" (45.9 s); now 46.6 s, between the two.
    // why: agrees ← a goodbye after a deal is the usual script; warns ← "Goodbye, Michael", with his name, heard as a
    //   stern last word
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'goodbye', reveals: ['poach'], seg: [39.4, 46.6],
      stem: 'How does Karen answer the threat?',
      choices: ['She brushes it off and says goodbye', 'She agrees to it and says goodbye',
                'She warns him off and says goodbye'], a: 0,
      cue: '脅しのすぐあと、Karen の短い返事。',
      line: 'I am going to poach one of yours. — *Ooh. Goodbye, Michael*.',
      said: '「引き抜く」と言われ、「へえ。じゃあね、Michael」と切ろうとする。',
      mean: '何も言い返さず、すぐ切り上げる。相手にしていない返し方。',
      trap: '名前を呼ぶと警告に聞こえやすい。警告なら don’t などが入るはず。中身で決める。',
      use: 'Okay, sure. Bye now.（はいはい、じゃあね）' },

    // R fix: blind 70 %: "someone to complain to" was a filler. Now "pass his threat on to her staff" (transfer…
    //   salespeople heard as warning them). The line's "Your best one?" gives d3 away, so it reveals top.
    // why: pass the threat on ← "transfer me to one of your salespeople" right after the threat, heard as a warning to
    //   them; Stanley ← Stanley is the one at stake, so he seems to want him on the line
    { id: 'h2', skill: 'humor', level: 'C1', point: 'transfer', reveals: ['couldyou', 'top'], seg: [44.3, 52.0],
      stem: 'Why is Michael’s last request to Karen funny?',
      choices: ['He asks the boss he just threatened to help him', 'He asks her to put Stanley on the line for him',
                'He asks her to pass his threat on to her staff'], a: 0,
      cue: '「Wait, wait」のあと、誰に何を頼んでいるか。',
      line: 'Karen, *could you transfer me* to one of your salespeople, please? *Your best one?*',
      said: '切られかけた電話を止め、「営業の誰かにつないで。一番いい人に」と頼む。',
      mean: '引き抜くと脅した相手本人に、引き抜く人へのつなぎを頼んでいる。',
      trap: '脅しの直後なので、部下への警告に聞こえやすい。誰に何を頼むかを並べて聞く。',
      use: 'Could you transfer me to the front desk?（フロントにつないでもらえますか）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'couldyou', seg: [46.6, 50.6],
      stem: 'Type what Michael asks: “Karen, ___ to one of your salespeople?” (4 words)',
      answer: 'could you transfer me',
      cue: '「Karen」のすぐあと。',
      line: 'Karen, *could you transfer me* to one of your salespeople, please?',
      said: '「営業の人につないでくれる？」と頼む。could you が「クッジュ」とつながる。',
      mean: 'transfer ＝ 電話を別の人に回す。電話でよく使う頼み方。',
      trap: 'd と y がつながり一語に聞こえやすい。頼みの文頭は could you と予想しておく。',
      use: 'Could you hold on a second?（少々お待ちいただけますか）' },

    // R fix: blind 50 %: "newest" was weak. Now "a salesman on the road", from “on the line”.
    // why: on the road ← "on the line" heard as "on the road"; manager ← "top" heard as someone in charge
    { id: 'd3', skill: 'detail', level: 'B1', point: 'top', seg: [53.8, 58.8],
      stem: 'How does Karen describe Ben when she puts him on?',
      choices: ['As her top salesman', 'As a salesman on the road', 'As her sales manager'], a: 0,
      cue: '名前のあと、「He is」に続く部分。',
      line: 'I have Ben Nugent on the line. He is *the top salesman* in…',
      said: 'Karen が「Ben Nugent です。うちのトップ営業」と電話をつなぐ。',
      mean: 'top salesman ＝ 一番成績のいい営業。「一番いい人」の頼みに応えた。',
      trap: 'top を「上の立場」と取ると manager に引かれる。ここは「一番の」。',
      use: 'She’s our top seller.（彼女がうちの売上トップです）' },

    // why: keen ← "So what do you say?" heard as the pitch going well; says yes ← the title (stealing a salesperson)
    //   suggests it works
    { id: 'g2', skill: 'gist', level: 'C1', point: 'pitch', reveals: ['next', 'whatsay'], seg: [55.0, 99.0],
      stem: 'How does Michael’s pitch to Ben go?',
      choices: ['Ben pushes back, and Michael threatens him', 'Ben is keen, and Michael offers him more',
                'Ben says yes, and Michael hangs up happy'], a: 0,
      cue: 'Ben の質問と、Michael の答え方。',
      line: 'No, *I fired them, and you’re next*. … So what do you say?',
      said: 'Ben は事故や評判を持ち出す。Michael は「クビにした、次は君だ」と言い、「どう？」と聞く。',
      mean: '誘う相手を脅してしまい、勧誘は失敗に向かう。それでも返事を待っている。',
      trap: '最後の問いだけだと、うまくいった流れに聞こえる。直前の言葉で決まる。',
      use: 'That didn’t go as planned.（思ったようにいかなかった）' },

    // R fix: blind 70 %: "chase him until he agrees" was odd on its face. Now "keep at him until he says yes", the same
    //   literal chase in a form a pitch could hold.
    // why: keep at him ← chase taken literally (追いかける); cut a deal ← "cut" taken literally, and it is a sales pitch
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'chase', seg: [59.6, 64.4],
      stem: 'What does Michael promise to do as he starts talking to Ben?',
      choices: ['Get straight to the point', 'Keep at him until he says yes', 'Cut him a better deal'], a: 0,
      cue: '「Michael Scott」と名乗ったあと。',
      line: 'I’m going to *cut right to the chase* here.',
      said: 'Ben に名乗ったあと、「単刀直入に言おう」と切り出す。',
      mean: 'cut to the chase ＝ 前置きを飛ばして本題に入る。',
      trap: 'cut や chase を一語ずつ訳すと、値引きや「追う」話に聞こえる。まとまりで覚える。',
      use: 'Okay, cutting to the chase: can you help?（単刀直入に、手伝ってくれる？）' },

    // R fix: blind 50 %: the key was the only joke-shaped wish. "The best salesman" is now "Michael's right-hand man",
    //   a second Michael-centred wish that "my best friend" refutes.
    // why: right-hand man ← "my best…" plus "a great job" heard as a top role at Michael's side; family ← "move to
    //   Scranton" heard with Karen's earlier family talk
    { id: 'd4', skill: 'detail', level: 'B1', point: 'wishes', seg: [64.2, 74.3],
      stem: 'What is the last of the wishes Michael offers Ben?',
      choices: ['To be Michael’s best friend', 'To be Michael’s right-hand man', 'To bring his family along'], a: 0,
      cue: '願いが並ぶ最後、「and」のあと。',
      line: 'to move to Scranton, to have a great job, and *to be my best friend*.',
      said: '願いをかなえると言い、スクラントンへ移る、いい仕事、親友になる、と並べる。',
      mean: '願いを決めているのは Michael。最後の一つはすっかり自分の望み。',
      trap: '前の二つが仕事の話なので、最後も仕事の役目と予想しやすい。and のあとが最後。',
      use: 'Make a wish!（願いごとをして！）' },

    // why: ashamed ← the subject (hitting someone) makes regret the expected reaction; proud ← "I also saved her life"
    //   heard alone, as a boast
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'grabby', seg: [73.8, 86.0],
      stem: 'When Ben brings up the car accident, how does Michael feel?',
      choices: ['Annoyed that the good part gets ignored', 'Ashamed and eager to change the subject',
                'Proud that people still remember him'], a: 0,
      cue: '「saved her life」のあと、but に続く部分。',
      line: 'I also saved her life, but I guess *that’s not as grabby*.',
      said: '「車で人をひいた人？」と聞かれ、「命も救ったけど、そっちは目立たないか」と返す。',
      mean: 'grabby ＝ 人の目を引く。悪い話ばかり広まり、いい話が無視される不満。',
      trap: '事故の話なので恥じる反応を予想しやすい。I guess に気持ちが出る。',
      use: 'Bad news travels fast.（悪い話はすぐ広まる）' },

    // why: big job ← "next" heard as next in line for something good (the recruiting frame); call again ← "next" heard
    //   as the order of his calls
    // anchor: 92.0–93.3 s "I fired them, and you're next": "next" follows "fired them", so Ben is the next one fired
    // retired: for the draws (play 3+ under g2 drew no C2): g2 reveals its point
    { id: 'c2', skill: 'humor', level: 'C2', point: 'next', seg: [88.0, 94.0], retired: true,
      stem: 'Taken seriously, what would “and you’re next” tell Ben?',
      choices: ['That he would be fired once he joined', 'That he is next in line for a big job',
                'That Michael will call him again later'], a: 0,
      cue: '「next」の前にある動詞。',
      line: 'No, *I fired them*, and *you’re next*.',
      said: '「みんなすぐ辞めたんでしょ？」と聞かれ、「いや、クビにした。次は君だ」と答える。',
      mean: '強がった返しも、本気で聞けば「入ったら君もクビ」。誘う相手を脅す矛盾が笑い。',
      trap: '勧誘の場面なので next を「次の候補」と良く取りやすい。next は直前の動詞の続きとして聞く。',
      use: 'Careful, or you’re next!（気をつけないと、次は君だよ）' },

    // R fix: blind 55 %: "didn't catch what Ben said" was a filler. Now "waiting for Ben to laugh at the joke", the
    //   pause read as a beat for a laugh, which "So what do you say?" (asking for a decision) refutes.
    // why: knows it failed ← the pause read as him giving up; laugh ← the pause after a comeback read as waiting for
    //   a laugh
    { id: 'i2', skill: 'infer', level: 'C1', point: 'whatsay', reveals: ['next'], seg: [90.5, 99.0],
      stem: 'What does Michael’s question after the long pause show?',
      choices: ['He still expects Ben to say yes', 'He knows the pitch has already failed',
                'He is waiting for Ben to laugh at the joke'],
      a: 0,
      cue: '脅しのあとの間と、次の問い。',
      line: 'and you’re next. … *So what do you say?*',
      said: '「次は君だ」と言ったあと、少し間を置いて「で、どう？」と返事を求める。',
      mean: '脅した直後でも、まだ誘いに乗ってもらえると思っている。空気の読めなさが出ている。',
      trap: '間があると、あきらめたように聞こえる。そのあと返事を求める言葉が来たら、まだ期待している。',
      use: 'So, what do you say? Are you in?（で、どう？乗る？）' },

    // R fix: blind 70 %: "admits a fair point" was weak. Now "confused about what Ben meant", the literal reading of
    //   "What is that guy talking about?"; the two denials after it refute it.
    // why: confused ← "What is that guy talking about?" taken as a real question; laughs it off ← the same question
    //   heard as amused
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'lame', seg: [99.5, 109.6],
      stem: 'In his comment to the camera, how does Michael take Ben’s view of Scranton?',
      choices: ['He is stung and insists it is fun', 'He is confused about what Ben meant', 'He laughs it off as a silly joke'],
      a: 0,
      cue: 'カメラに向かって、最初の問いのあと。',
      line: 'What is that guy talking about? *Scranton is not lame*. Scranton is the cool, fun branch.',
      said: 'カメラに「あいつ何言ってるんだ。スクラントンはダサくない。楽しい支店だ」と言う。',
      mean: '言われてもいない lame まで持ち出して打ち消す。かなり気にしている。',
      trap: '問いの形なので、戸惑いや笑い飛ばしに聞こえる。打ち消しを重ねるのは、気にしている印。',
      use: 'Our town is not boring!（うちの町は退屈じゃない！）' },
  ]
};
