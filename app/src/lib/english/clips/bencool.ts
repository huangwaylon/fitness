// “Ben is Finally Cool | Parks and Recreation” (the official Parks and Recreation channel, Season 6): Ben starts at
// Barney's accounting firm, cracks its toughest case and is treated like a star, then his friends offer him a job
// in town and he quits the firm again.
// Segments from the captions, words from whisper (2026-11-16). Ben, Barney and Frank are named in the audio; the
// friend at 145–191 s never is, so stems say “the friend” and no key rests on who it is. Untested on purpose: 8.6 s
// (“Dad” in the captions, “Ted!” in whisper), 26.7 s (“Frank seems cool”: speaker not named), 110–119 s (whisper
// garbled), 137 s (“I think it's safe to say” in whisper, “AND I'D SAY to say” in the captions), 226–235 s (the game:
// backstory; “Agent Ben” / “Leggerman”). At 215.7 s the captions have “I knew it was”, whisper “I know it's”: at3
// keys on “too good to be true”, which both have.
// EAR CHECK: 218.8–219.5 s nt2 — the stress falls on “do” in “I do have a little going-away gift” (ship only once
//   confirmed)
// EAR CHECK: 19.4–24.4 s at1 nt1 — “A little too good… I'm not joking” is Frank's (assumed: he has just introduced
//   himself to Ben; no name is said)
// EAR CHECK: 21.2 s x1, 189.3 s s1 — “live up to” runs together (“livuptuh”); “would be” is weak (“w'd be”)
// REVIEW 2026-11-16: pass 7, fix 17, drop 0, new 0; ear checks 3
// REVIEW open: at1 and nt1 both rest on "I'm not joking" (24.1 s) being Frank's; if it's Ben's, drop both
import type { Clip } from '../types.ts';

export const benCool: Clip = {
  id: 'bencool', video: '1ov1lgYZnPQ', title: 'Ben is Finally Cool', dur: 256, wpm: 141, band: 'slow',
  tags: ['職場', '友だち'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // why: tried and failed ← "passed" heard in the test frame (合格/不合格); held it and left ← "last time" + "took
    //   the job" heard as Ben quitting it
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'passup', seg: [11.7, 17.7],
      stem: 'What does Frank say about the job he now has?',
      choices: ['Ben had been offered it and said no', 'Ben had tried for it and not got it',
                'Ben had held it and later walked away'], a: 0,
      cue: '「I took the job when」のあと、up で終わる語。',
      line: 'I took the job *when you passed it up* last time.',
      said: '「前回あなたが断った仕事を、僕が引き受けた」と自己紹介する。',
      mean: 'pass up ＝ せっかくの機会を見送る・断る。合格の pass とは別。',
      trap: 'pass を「合格・通過」と取ると意味がずれる。pass ～ up は機会を断る決まり形。',
      use: 'Don’t pass up a chance like this.（こんなチャンス、逃しちゃだめ）' },

    // anchor: 14.0–15.8 s "I took the job when you passed it up" (Ben was first in line for his place), 19.4 s "A
    //   little too good", 20.6 s "Let's see if you live up to the hype", 24.1 s "I'm not joking"
    // why: a nervous fan ← "Heard a lot about you" + "hype" heard as admiration; an old friend teasing ← the sincerity
    //   flip: the jab heard as banter, which "I'm not joking" rules out
    { id: 'nt1', skill: 'attitude', level: 'C2', point: 'frank', reveals: ['passup', 'hype'], seg: [11.7, 25.9], retired: true,
      stem: 'What do Frank’s first words to Ben tell us about how he sees him?',
      choices: ['As a rival who could take his place', 'As a hero he is nervous to meet', 'As an old friend he likes to tease'],
      a: 0,
      cue: '自己紹介の中身と、最後の念押し。',
      line: 'I took the job when you passed it up… — *A little too good.* Let’s see if you live up to the hype. … *I’m not joking.*',
      said: '「君が断った仕事を僕が取った。評判は良すぎる。お手並み拝見だ。冗談じゃない」と言う。',
      mean: '自分の席の元の候補が来たので、張り合っている。冗談でないと念を押し、敵意をはっきりさせる。',
      trap: '評判を聞いていたと言うのでファンに聞こえやすい。ほめ言葉に too が付いたら、警戒を疑う。',
      use: 'Your reputation precedes you.（お噂はかねがね）' },

    // why: a joke ← the remark sounds like banter until "I'm not joking"; a warm welcome ← "Heard a lot about you" is
    //   a friendly formula
    { id: 'at1', skill: 'attitude', level: 'B2', point: 'frank', reveals: ['hype'], seg: [17.2, 25.9],
      stem: 'How does Frank mean his remark about Ben’s reputation?',
      choices: ['As a real challenge to prove himself', 'As a light joke to break the ice', 'As a warm welcome to a famous name'],
      a: 0,
      cue: '数秒の間のあとに、念を押す一言。',
      line: 'Let’s see if you *live up to the hype*. … *I’m not joking.*',
      said: '「評判どおりか見せてもらおう」と言い、間を置いて「冗談じゃない」と付け足す。',
      mean: '本気の挑戦。笑わせる気はない、と自分で言い切っている。',
      trap: '軽口に聞こえる言い方でも、あとに I’m not joking が来れば本気。後の一言で前を読み直す。',
      use: 'I’m not joking. Be here by eight.（冗談じゃないよ。8時までに来て）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'hype', seg: [20.0, 22.8],
      stem: 'Type the end: “Let’s see if you ___ the hype.” (3 words)', answer: 'live up to',
      cue: '「Let’s see if you」のあと、短い3語。',
      line: 'Let’s see if you *live up to* the hype.',
      said: '「評判どおりか、見せてもらおう」。',
      mean: 'live up to ＝ 評判に見合う。live up が「リヴァップ」とつながり、to は弱い。',
      trap: 'up to がつぶれて live the hype に聞こえやすい。動詞のあとの小さな2語を数える。',
      use: 'The movie lived up to the hype.（あの映画、評判どおりだった）' },

    // R fix: V2 — "eased in with a small job" was a filler; "a dull family will" (the words said, wrong weight) now
    //   competes
    // why: new-hire forms ← "startup paperwork" is said, as Ben's joke about the pile; dull will ← "family trusts, a
    //   contested will" heard without "toughest" and "real puzzler"
    { id: 'g1', skill: 'gist', level: 'B2', point: 'firstday', seg: [28.6, 50.6],
      stem: 'What is Ben’s first day at the firm like?',
      choices: ['He is handed their hardest case at once', 'He is buried in his new-hire paperwork',
                'He is given a dull family will to sort out'], a: 0,
      cue: '「Sorry to start you out」のあと、but 以下。',
      line: 'Sorry to start you out like this… but it’s *our toughest case*.',
      said: '書類の山に驚く Ben に、「初日から悪いが、うちで一番の難件だ」と渡す。',
      mean: 'toughest case ＝ いちばん手ごわい案件。いきなり腕を試されている。',
      trap: 'paperwork で事務手続きと取りやすいが、Ben の冗談。but のあとが本題。',
      use: 'Sorry to throw you in the deep end.（いきなり大変な仕事でごめん）' },

    // R fix: V2 — "In the apology" in the stem pointed at "worse"; the stem is neutral now, and "the weekend to work
    //   on it" replaces the weak "less busy day"
    // why: done by Friday ← a day + "toughest case" heard as a deadline; the weekend ← Friday heard as good news:
    //   two free days ahead
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'friday', seg: [32.6, 38.7],
      stem: 'What does the mention of Friday add?',
      choices: ['That Friday makes the timing even worse', 'That the case has to be done by Friday',
                'That he’ll have the weekend to work on it'], a: 0,
      cue: '「Friday」のすぐあとの2語。',
      line: 'Sorry to start you out like this and *on a Friday, no less*',
      said: '「初日からこれで悪い、しかも金曜日に」と謝ってから案件を渡す。',
      mean: 'no less ＝ よりによって・しかも。週末前の金曜というのが、さらに悪い点。',
      trap: '曜日が出ると締め切りや週末の話に聞こえる。名詞のあとの no less は「しかも」の強調。',
      use: 'He called at 3 a.m., no less.（しかも夜中の3時に電話してきた）' },

    // R fix: V2 — only the key was about the coworkers; all three now "cast" someone, so the target decides it
    // why: the families ← "three competing family trusts, a contested will" sounds like a crime story; a murder
    //   mystery ← "puzzler", and later "cracked the case"
    { id: 'h2', skill: 'humor', level: 'C1', point: 'murder', seg: [46.2, 55.4],
      stem: 'Why does the line about being murdered get a laugh?',
      choices: ['It casts two cold coworkers as murder suspects', 'It casts the feuding families as murder suspects',
                'It casts the hard case as a murder mystery'], a: 0,
      cue: '直前の「genius」の言い方と、最後の3語。',
      line: 'let’s see what you got, *genius*. — If I’m murdered tonight, start the investigation *with those two guys*.',
      said: '「お手並み拝見だ、天才くん」と言われ、「今夜殺されたら、あの2人から調べて」と話す。',
      mean: '同僚の敵意を、殺人事件の容疑者にたとえた大げさな冗談。',
      trap: '家族の争いや puzzler から事件の話に聞こえやすい。those two guys は今いる同僚。',
      use: 'If I don’t come back, blame him.（戻らなかったら、あいつのせい）' },

    // R fix: K1 — "long ago" overstated "a month ago"; the key now says only that they already had it
    // why: worked once ← "a month ago" heard as a past success; should have done it ← the sincere reading: praise + a
    //   time = regret
    { id: 'pr1', skill: 'pragma', level: 'C1', point: 'month', seg: [68.9, 77.4],
      stem: 'When Ben’s first idea gets “Great idea…”, what does the rest do?',
      choices: ['Says they already had it', 'Says it worked for them once', 'Says they should have done it'], a: 0,
      cue: '「Great idea」のあとの間と、that 以下。',
      line: '*Great idea*… *that we had a month ago*. The problem is…',
      said: '「すばらしい案だ…ひと月前に僕らが出したね」と言い、すぐ問題点を挙げる。',
      mean: 'ほめると見せて、間のあとで「とっくに考えた」と落とす。新人への牽制。',
      trap: 'ほめ言葉で始まるので本気に聞こえやすい。間のあとの that 節で意味が反転する。',
      use: 'Great idea. We tried it last year.（いい案だね。去年やったけど）' },

    // why: arbitrating without the clients ← "arbitrate" is said, but only "if they went for it"; selling ←
    //   "property" was the problem just before
    { id: 'd1', skill: 'detail', level: 'B1', point: 'trust', seg: [78.4, 90.5],
      stem: 'What idea does Ben come up with that the others never thought of?',
      choices: ['Dissolving the trust', 'Arbitrating without the clients', 'Selling off the property'], a: 0,
      cue: '「Then we」で始まる提案。',
      line: 'Then we *dissolve the trust*. … — He’s right. We never thought of that.',
      said: '「なら信託を解消しよう」と提案し、皆が「確かに、考えもしなかった」と認める。',
      mean: 'dissolve ＝ 組織や契約を解消する。行きづまりを破る案。',
      trap: 'arbitrate も聞こえるが、顧客の同意が条件のあと段階。中心は Then we のあと。',
      use: 'Then we split the bill.（じゃあ割り勘にしよう）' },

    // R fix: V2 — the key was the only choice built from "light"; the distractors are now re-take reasons of the
    //   same size
    // why: for the office ← "say it again" heard as "say it for everyone"; clearer take ← a re-take usually means
    //   a cleaner version
    { id: 'h3', skill: 'humor', level: 'C1', point: 'light', seg: [91.4, 99.9],
      stem: 'Why is the request to say the idea again funny?',
      choices: ['He wants to act out a cartoon “idea” moment', 'He wants Ben to say it for the whole office',
                'He wants a second, clearer take for notes'], a: 0,
      cue: '「but this time」のあと、何をすると言っているか。',
      line: 'Say it again, but this time *I’m going to turn the light on like you just had an idea*.',
      said: '「もう一回言って。今度は思いついた瞬間に明かりをつけるから」と頼む。',
      mean: 'ひらめき＝電球、という漫画の型を本当に演出したい。聞き逃してはいない。',
      trap: 'say it again を「もう一度はっきり」と取りやすい。理由は this time のあと。',
      use: 'Say it again, but with feeling.（もう一回、気持ちをこめて）' },

    // R fix: N7 — the line showed "what if we dissolve the trust?", d1's key; trimmed
    // why: shares the view ← "I'm with you" read as full agreement; beside them ← "with you" taken as company
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'withyou', seg: [97.6, 106.0],
      stem: 'What does Ben’s quick reply to the light plan show?',
      choices: ['He follows the plan and will do it', 'He shares the boss’s view of the case',
                'He wants to keep working beside them'], a: 0,
      cue: '「Sure」のくり返しのあとの一言と、次の行動。',
      line: 'Sure. Sure. Yeah, *I’m with you*. Um, okay. Uh, what if…',
      said: '「うん、うん、分かった」と言い、言い直しのセリフを演じる。',
      mean: 'I’m with you ＝ 話についていけてる・乗った。意見への賛成とは限らない。',
      trap: '「あなたと同じ意見」と取りやすい。すぐ言い直しを演じるので、「了解」の意味。',
      use: 'Okay, I’m with you. Keep going.（うん、分かってる。続けて）' },

    // R fix: V2 — the distractors were thin; the key no longer echoes "cracking" and the other two are fuller
    // why: first week ← a new hire, and a welcome party is the usual script; his Saturday ← he did work the weekend
    //   ("Saturday at the firm")
    { id: 'd2', skill: 'detail', level: 'B1', point: 'party', seg: [120.5, 126.3],
      stem: 'Why do they throw Ben a party?',
      choices: ['To celebrate him solving the case', 'To mark the end of his first week', 'To thank him for giving up his Saturday'],
      a: 0,
      cue: '「pizza party」のあと、to say に続く部分。',
      line: 'We decided to throw you a pizza party *to say congrats for cracking the case*.',
      said: '「難件を解いたお祝いに、ピザパーティーを開くことにした」。',
      mean: 'crack the case ＝ 事件・難問を解く。say congrats ＝ おめでとうを言う。',
      trap: '新人の歓迎会と考えやすいが、目的は to say 以下で聞く。',
      use: 'Let’s throw her a surprise party.（彼女にサプライズパーティーを開こう）' },

    // R fix: V2 — "think calzones and pizza are the same" was a filler; "a little prank" (not pizza + a party) now
    //   competes
    // why: ran out ← "that's not pizza" heard as a mix-up; prank ← a "pizza party" that turns out not to be pizza
    //   sounds like a trick
    { id: 'i1', skill: 'infer', level: 'B2', point: 'calzone', seg: [129.8, 136.8],
      stem: 'What does the staff’s “We know!” show?',
      choices: ['They picked calzones because he loves them', 'They swapped in calzones as a little prank',
                'They got calzones since the pizza ran out'], a: 0,
      cue: '「I love calzones!」への返事。',
      line: 'That’s not pizza. Those are calzones! *I love calzones!* — *We know!*',
      said: '「ピザじゃない、カルツォーネだ！大好き！」と言うと、皆が「知ってる！」と返す。',
      mean: '好物と知って、わざと選んだ。ピザと言ったのは驚かせるため。',
      trap: 'not pizza で手ちがいに聞こえやすい。We know! は「分かってて選んだ」という返事。',
      use: 'We know! That’s why we got it.（知ってる！だから買ったの）' },

    // R fix: V2 — n1's stem ("did the vote pass") refuted "the vote did not pass" for a blind reader; replaced with
    //   a move-help and an IOU reading, both built from words said
    // why: help with the move ← "us moving away" is said; pay back loans ← "your IOUs are worthless" heard as his
    //   debt
    { id: 'g2', skill: 'gist', level: 'B1', point: 'offer', reveals: ['reason', 'insane'], seg: [141.0, 191.0],
      stem: 'How does the visit with his friends turn out for Ben?',
      choices: ['He is offered a job in town and says yes', 'He is asked to help them with the move',
                'He is told he must pay back their loans'], a: 0,
      cue: '最後の質問と、Ben の返事の後半。',
      line: 'you have the votes if you want the job. … *I would be insane to say no.*',
      said: '「町の市政担当にならない？票はそろってる」と誘われ、受けると答える。',
      mean: '会計事務所に移ったばかりの Ben に、地元の大きな仕事が舞いこむ。',
      trap: '引っ越しや IOU の話が先に出るので、手伝いや借金の話に聞こえやすい。最後の質問と返事で決まる。',
      use: 'I’d be crazy to turn this down.（これを断るなんてありえない）' },

    // why: 3–1 ← the last number is lost after a weak "to"; 2–1 ← only the end of the score is caught
    { id: 'n1', skill: 'number', level: 'B1', point: 'vote', seg: [145.3, 148.9],
      stem: 'By what score did the vote pass?',
      choices: ['2–1', '3–1', '3–2'], a: 2, keep: true,
      cue: '「vote passed」のあとの2つの数。',
      line: 'Well, vote passed. *3–2.*',
      said: '「投票は通った。3対2で」と報告する。',
      mean: '3-2 は three to two と読む。1票差の、ぎりぎりの可決。',
      trap: 'to が弱く three-two と一続きに聞こえる。two を to と思って数を落とさないよう、数を2つ数える。',
      use: 'We won three to two.（3対2で勝った）' },

    // R fix: V2 + K6 — the key was the only middling, hedged choice; now all three are two-part, and the Jamm
    //   choice is a wrong relation instead of a mood
    // why: take it back ← "not the most ethical" heard as a real confession; Jamm agreed ← his name is said twice,
    //   but he's the one who'll be "so pissed when he finds out"
    { id: 'at2', skill: 'attitude', level: 'C1', point: 'ethical', seg: [153.2, 160.4],
      stem: 'Asked about the vote, how does the friend feel about what they did?',
      choices: ['A bit guilty, but fine with it overall', 'Guilty enough to want to take it back',
                'Fine with it, since Jamm agreed to it'], a: 0,
      cue: '「not the most ethical」のあとに続く部分。',
      line: 'it’s *not the most ethical thing* that I’ve ever done, *but on the flip side*, Jamm is a big mean dope',
      said: '「一番倫理的なことではないけど、逆に Jamm は意地悪なバカだし」と答える。',
      mean: 'not the most ～ は控えめな「少し悪かった」。but 以下で納得。',
      trap: '倫理という語で深い反省に聞こえやすい。控えめな否定に but が続けば、本音は後ろ。',
      use: 'Not my best idea, but it worked.（最高の案ではないけど、うまくいった）' },

    // R fix: V2 — "deeply sad" was weak and the key was the textbook gloss; "keeping too busy" (another coping
    //   script) now competes
    // why: telling people it's off ← "denial" = 否定, the literal reading; keeping busy ← the usual way to "handle"
    //   bad news
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'denial', seg: [159.8, 165.6],
      stem: 'When the move comes up, how does the other friend say they’re handling it?',
      choices: ['By not letting themselves believe it yet', 'By telling everyone the move is off',
                'By keeping too busy to think about it'], a: 0,
      cue: '「Oh, I’m currently」のあと、deep に続く語。',
      line: 'the pain of us moving away… — Oh, I’m currently *in deep denial* that that’s happening.',
      said: '「引っ越しのつらさが和らげば」に「それ、全力で認めてない」と返す。',
      mean: 'in denial ＝ 現実を受け入れられない。冗談めかした寂しさ。',
      trap: 'denial を「否定する」と取ると、人に言い張る意味になる。in denial は心の中のこと。',
      use: 'Vacation’s over? I’m in denial.（休み終わり？認めたくない）' },

    // why: promoted ← raise vs promotion, the classic mix-up (昇給 ≠ 昇進); shorter hours ← "not complaining" heard as
    //   an easier job
    { id: 'd3', skill: 'detail', level: 'B1', point: 'raise', seg: [165.3, 172.0],
      stem: 'What does Ben say has improved since he took the new job?',
      choices: ['His salary went up', 'He was promoted', 'His hours got shorter'], a: 0,
      cue: '「how’s the new gig」への返事の最初。',
      line: 'Well, I *got a raise* and my fridge is full of calzones, so not complaining.',
      said: '「給料が上がったし、冷蔵庫はカルツォーネでいっぱい。文句なし」。',
      mean: 'raise ＝ 昇給。not complaining ＝ 文句なし、つまり満足している。',
      trap: 'raise を昇進と取りやすいが、上がったのはお金。promotion とは別の語。',
      use: 'I got a raise! Dinner’s on me.（昇給したんだ！夕飯おごるよ）' },

    // R fix: V2 — "really leading up to" plus a weak goodbye choice made the offer obvious; "move away with them"
    //   and the face-value reading now compete
    // why: move with them ← "moving away" was just said; face value ← "how's the new gig coming?" taken as only
    //   that
    { id: 'pr3', skill: 'pragma', level: 'B2', point: 'reason', seg: [165.3, 178.9],
      stem: 'What was the question about Ben’s new job really leading up to?',
      choices: ['An offer of a job back in town', 'A hint he should move away with them',
                'A check that the new job is going well'], a: 0,
      cue: '「The reason I ask is」のあと。',
      line: 'how’s the new gig coming? … *The reason I ask is* this town’s going to need *a new city manager*',
      said: '新しい仕事の調子を聞き、「聞いたのは、町に新しい市政担当が要るから」と続ける。',
      mean: 'The reason I ask is ＝ 質問の目的を明かす前置き。',
      trap: '直前の引っ越しの話から別れの流れに聞こえやすい。目的は The reason のあと。',
      use: 'The reason I ask is, I’m hiring.（聞いたのは、人を探してるから）' },

    // R fix: V2 — "to say no" in the stem let the set phrase pick "would be"; the stem now stops at "insane"
    // why: wouldn't be ← a lost final -n't, which learners hear in both directions; could be ← weak "would" and
    //   "could" both shrink to "-d"
    { id: 's1', skill: 'sound', level: 'B2', point: 'insane', seg: [186.6, 191.0],
      stem: 'Fill the gap: “I mean, I… wow. I ___ insane…”',
      choices: ['would be', 'wouldn’t be', 'could be'], a: 0,
      cue: '「wow」のあと、I に続く短い2語。',
      line: 'I mean, I— wow. I *would be* insane to say no.',
      said: '「えっと、うわ。断るなんてどうかしてる」と答える。',
      mean: 'would be が弱く「ウッビ」。断る理由がない、つまり受けるという返事。',
      trap: 'wouldn’t なら「断らないのはおかしい」と逆になる。n’t は消えても「ン」と短い間が残る。',
      use: 'I would be happy to help.（喜んでお手伝いします）' },

    // R fix: V2 — reworded so all three are about when he may arrive, and the key no longer stands out as the only
    //   free one
    // why: still has to be on time ← "you're late" taken as the real message and "just kidding" as softening it;
    //   a pass today ← "just kidding" heard as a one-time pass, which "whatever you want" rules out
    { id: 'i2', skill: 'infer', level: 'B2', point: 'kidding', seg: [194.8, 200.2],
      stem: 'What does the “you’re late” exchange show about Ben’s place at the firm?',
      choices: ['He can show up whenever he likes now', 'He has to be on time, like everyone',
                'He gets a pass today, but just today'], a: 0,
      cue: '「you’re late」のあと、2秒後の言い直し。',
      line: 'Wyatt, you’re late. — *I’m just kidding. You can do whatever you want.*',
      said: '「Wyatt、遅刻だぞ」と言い、すぐ「冗談だよ。好きにしていい」と言い直す。',
      mean: '難件を解いた Ben は特別扱い。遅刻も責められない。',
      trap: 'just kidding を「今回は見逃す」と取りやすい。whatever you want は「いつでも」。',
      use: 'Just kidding. Take your time.（冗談だよ、ゆっくりでいいよ）' },

    // R fix: V2 + K6 — the key was the only polite, nuanced choice; all three now name a kind of opener
    // why: real fear ← "afraid" read as 怖い, the literal reading; doubt ← "I'm afraid" heard as "I'm not sure"
    { id: 'm2', skill: 'marker', level: 'B1', point: 'afraid', seg: [201.3, 204.6],
      stem: 'How does Ben open his news to Barney?',
      choices: ['With a set phrase that softens bad news', 'With honest fear of how Barney will react',
                'With a hedge showing he isn’t sure yet'], a: 0,
      cue: 'Barney の名前のあと、I’m に続く語。',
      line: 'Actually, Barney, *I’m afraid* I have some bad news.',
      said: '「実は Barney、申し訳ないけど悪い知らせがある」と切り出す。',
      mean: 'I’m afraid ＝「あいにく」。悪い知らせを和らげる決まり文句。',
      trap: 'afraid を「怖い」と取りやすい。後ろに文が続く I’m afraid は、丁寧な前置き。',
      use: 'I’m afraid we’re closed today.（あいにく本日は休業です）' },

    // R fix: V2 — "angrily/glad" were weak; "hurt, as if misled" (too good to be true read as a con) and "cool"
    //   (the short reply) now compete
    // why: misled ← "too good to be true" heard as "you fooled us"; cool ← the short "No need to explain" heard
    //   as not caring
    { id: 'at3', skill: 'attitude', level: 'B2', point: 'toogood', seg: [205.9, 217.2],
      stem: 'When Ben says he is quitting, how does the reply take it?',
      choices: ['Let down, but not surprised', 'Hurt, as if Ben had misled him', 'Cool, as if it hardly matters'],
      a: 0,
      cue: '「No need to explain」のあとの一文。',
      line: '*No need to explain.* … I knew it was *too good to be true*.',
      said: '「説明はいらない。うますぎる話だと分かってた」と返す。',
      mean: 'too good to be true ＝ うますぎる話。がっかりしつつ予想していた。',
      trap: 'だまされた話と取りやすいが、責めていない。I knew が気持ち。',
      use: 'This deal is too good to be true.（この話、うますぎる）' },

    // anchor: 218.8–219.5 s "I do have": an auxiliary "do" in a plain statement ("I have" would do) is there only to
    //   carry stress; it comes right after the bad news and "too good to be true" (212.9–216.6 s)
    // R fix: V2 — a reader who knows emphatic "do" picked it blind; "on have" (the same contrast, wrong word) is
    //   added as a fourth strong choice
    // why: on "gift" ← the end-focus rule (new information goes last); on "little" ← the Japanese frame:
    //   ささやかな贈り物, a modest stress; on "have" ← the right reason heard on the next word
    { id: 'nt2', skill: 'sound', level: 'C2', point: 'gift', seg: [217.9, 222.6], retired: true,
      stem: 'Where is the stress in “I do have a little going-away gift”, and why?',
      choices: ['On “do”: a turn to something nice after bad news', 'On “have”: he still has one, despite the news',
                'On “gift”: the new thing he is telling them about', 'On “little”: playing down how big the gift is'], a: 0,
      cue: 'I のあと、ふつうは入らない短い語の長さ。',
      line: 'Oh, I *do* have a little going-away gift.',
      said: '辞めると伝えたあと、「あ、ちょっとした置き土産はあるんだ」と付け足す。I のあとが長い。',
      mean: '肯定文にわざわざ do を入れるのは強調のため。「悪い知らせだけじゃない」という切り返し。',
      trap: '新情報の gift に強勢、と考えやすい。普通の文に do が入っていたら、そこが強い。',
      use: 'I do like your new haircut.（新しい髪型、ほんとに好きだよ）' },
  ]
};
