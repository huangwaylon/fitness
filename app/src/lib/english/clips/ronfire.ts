// REVIEW 2026-11-16: pass 3, fix 19, drop 0, new 0; ear checks 2
// Open: nt3's segment is 18 s (the anchor needs the faults and the reason); if the test's 15 s cap is strict, cut it to [72.75, 82.3].
// “Ron Swanson Tried to Fire Leslie Knope | Parks and Recreation” (the official Parks and Recreation channel, Season 5):
// Leslie comes to Ron before a vote she can't decide; he shows her the four requests he once made to fire her, explains
// why he withdrew them, and gives her a compass.
// Segments from the captions, words from whisper (2026-11-16). Untested, where the sources differ: 5.6 s "Did you get"
// (whisper) vs "you give" (captions); 43–49 s Leslie's stammer ("yep" in the captions only); 49.5 s the "boot" /
// "trash can's" line ("pans" in the captions); 86 s "with this new job" vs "what this new job"; 97–101 s "You gonna
// pull out…" (whisper) vs "I'm gonna pull out…" (captions); 107.8 s "And listen" vs "Hey, listen". The insults
// "a pain in my…" and "…kiss-ass" are trimmed from every line.
// EAR CHECK: 35.6 s r1 — the cut falls after "Keep reading" and before "Request for termination?" (captions 36.2 s, whisper 36.6 s)
// EAR CHECK: 42.6 s nt2 — the stress in "I tried to fire you four times" falls on "four" (a contrast with "once"); captions have "try", whisper "tried"; ship only once confirmed
import type { Clip } from '../types.ts';

export const ronFire: Clip = {
  id: 'ronfire', video: 'JLhO2gazhWU', title: 'Ron Swanson Tried to Fire Leslie Knope', dur: 126, wpm: 161,
  band: 'slow', tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 75 %, right): "such big praise" in the stem pointed at buttering up, and "tease" was a filler.
    //   The stem now names the moment, and the distractors are an apology opener (a Japanese frame) and a real thank-you.
    // why: apologize ← 突然すみません, a Japanese opener read into a warm greeting; thank ← warm praise is how a
    //   thank-you sounds
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'opener', reveals: ['help'], seg: [0, 12.8],
      stem: 'Why does Leslie start by calling Ron her rock and guiding light?',
      choices: ['To get him on her side before she asks', 'To apologize for barging in on him',
                'To thank him for always backing her up'], a: 0,
      cue: 'ほめ言葉のすぐあと、彼女が続ける一言。',
      line: 'Ron, my rock, my steady, guiding light… *I need you*, Ron, okay? *I’m in big trouble.*',
      said: 'ロンを「私の岩、導きの光」と持ち上げ、すぐに「助けて、大ピンチなの」と続ける。',
      mean: '大げさなほめ言葉は頼みごとの前置き。先に相手を気分よくさせている。',
      trap: 'お礼に聞こえやすいが、すぐ I need you が来る。ほめたあとの一言で目的が分かる。',
      use: 'You’re the best. Can I ask a favor?（さすが！ちょっと頼みがあるんだけど）' },

    // R fix: N7/C5: the "public forum" distractor named d1's key (now "who"), so it is replaced with a chambers
    //   speech. The blind pass was otherwise below 50 %.
    // why: his vote ← "cast a vote" + "chambers" heard as asking for Ron's vote; speech ← "go back to those chambers"
    //   heard as having to speak there
    { id: 'g1', skill: 'gist', level: 'B1', point: 'help', seg: [0, 20.3],
      stem: 'What does Leslie come to Ron for?',
      choices: ['His help deciding how she will vote', 'His vote for her plan in the chambers',
                'His help writing a speech for the chambers'], a: 0,
      cue: '「20 minutes」のあと、何をしなければならないか。',
      line: '…and I have to *cast a vote*, and *I don’t know what I’m gonna do*.',
      said: '20分後に議場で投票するのに、どうするか決められないと言う。',
      mean: '頼みたいのは、どちらに投票するかの相談。ロンに投票してもらう話ではない。',
      trap: 'chambers は場所の話で、演説の話は出ない。cast a vote の主語は I。',
      use: 'I can’t decide. What would you do?（決められない。あなたならどうする？）' },

    // R fix: V2 (blind 60 %, right): the key was the only abstract, warm choice. The distractors are now as
    //   nuanced: regret (the title's firing) and a view on the vote.
    // why: firm view on the vote ← the scene opens on her vote, so the talk "should" end in a vote plan; regret ← the
    //   Japanese script: after a confession like that, an apology follows
    { id: 'g2', skill: 'gist', level: 'C1', point: 'scene', reveals: ['stillyou'], seg: [0, 116],
      stem: 'By the end of the talk, what has Ron given Leslie?',
      choices: ['Faith that she’s still the person she was', 'Regret for the times he tried to fire her',
                'A firm view on how she should vote'], a: 0,
      cue: '最後の贈り物の前後、ロンが何を伝えたか。',
      said: '昔クビにしようとした話から、信念を買っていたと明かし、「君は君のままだ」と励ます。',
      mean: '投票の答えはくれないが、迷う彼女に自分らしさへの自信を返した場面。',
      trap: '最初の相談は投票だが、答えは出ない。謝罪もなく、最後の「許さない」にも謝らない。',
      use: 'Trust your gut. You know what’s right.（直感を信じて。正しいことは分かってるはず）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'figure', seg: [10.95, 14.15],
      stem: 'Type Ron’s reply: “I’m sure you’ll ___.” (3 words)', answer: 'figure it out',
      cue: '「what I’m gonna do」のすぐあと、短い返事。',
      line: 'I’m sure you’ll *figure it out*.',
      said: '「君ならなんとかするさ」と、あっさり返す。',
      mean: 'figure it out ＝ 考えて答えを見つける。3語がつながり「フィギャリダウ」に近い。',
      trap: 'it は弱く、t は次の out とつながって「リ」「ダ」のように弾む。1語に聞こえても3語。',
      use: 'Don’t worry, we’ll figure it out.（大丈夫、なんとかなるよ）' },

    // R fix: V2 (blind 50 %, right): the title says "fire", so the fire/hire contrast fell away. The item now asks who
    //   said it, the part of the line the title doesn't give.
    // why: council ← she has just talked about the chambers and her vote; reporters ← "public" heard as a public
    //   statement to the press
    { id: 'd1', skill: 'detail', level: 'B1', point: 'forum', seg: [14.1, 19.6],
      stem: 'Who does Leslie say might want to fire her?',
      choices: ['People at a public forum', 'Members of the city council', 'Reporters at a press event'], a: 0,
      cue: '「Ron」のあと、said の前まで。',
      line: 'the people at the *public forum* said they might want to fire me.',
      said: '公開の集会に来た人たちが、彼女を辞めさせたいと言った、と話す。',
      mean: 'public forum ＝ 市民が意見を言う集会。選挙で選ばれた仕事でも、やめさせる話が出ている。',
      trap: '直前に議場の話があるので議員と取りやすい。said の前の主語を最後まで聞く。',
      use: 'I heard they might let him go.（彼、クビになるかもって）' },

    // R fix: V2 (blind 55 %, right): "vote against her" was a filler, and the key was the only choice that wasn't a
    //   threat. "So what?" heard as coldness is now a distractor.
    // why: doesn't care ← "So what?" heard as coldness; warning ← "fire you" heard as a present threat
    { id: 'i1', skill: 'infer', level: 'B2', point: 'joking', seg: [14.1, 24.5],
      stem: 'When Ron answers “So what?…”, how does Leslie first take it?',
      choices: ['As a joke he can’t really mean', 'As a sign he doesn’t care about her',
                'As a warning he could fire her'], a: 0,
      cue: 'すぐあとの Leslie の一言と、ロンの返事。',
      line: 'So what? I tried to fire you. — Ron, come on. *Be serious.* — *I was not joking.*',
      said: '「クビにしようとした」に「まじめに」と返すと、「冗談ではない」と言われる。',
      mean: 'Be serious ＝「ふざけないで」。冗談と受け取ったが、本当の話だった。',
      trap: 'So what? は冷たく聞こえるが、返事の Be serious は冗談と取った合図。',
      use: 'Wait, are you serious?（え、本気で言ってる？）' },

    // R fix: V2 (blind 85 %, right): "even higher praise" and "a kind note" were the same move. One distractor is now
    //   a real sitcom twist (the gruff boss wrote the praise himself). The title still helps; that can't be removed.
    // why: Ron wrote it ← the sweet-twist script, where the gruff boss secretly admired her; award ← everything read
    //   so far is praise
    { id: 'r1', skill: 'predict', level: 'B2', point: 'keep', seg: [24.5, 35.6], then: [35.6, 40.55],
      stem: 'After the praise she reads, Ron says “Keep reading.” What is coming?',
      choices: ['A turn to something far less flattering', 'Proof that Ron wrote all that praise himself',
                'An award she never knew she had won'],
      a: 0,
      cue: 'わざわざ続きを読ませる理由を考えて。',
      line: 'Brilliant work, commendation… — *Keep reading.* — *Request for termination?*',
      said: '「優秀、表彰、期待以上」と読むと、ロンが「その先も」と言い、彼女は「解雇の申請？」と読む。',
      mean: '「先を読め」は、本題がまだ先にあるという合図。ほめ言葉は前置き。',
      trap: 'それまでがほめ言葉なので、続きもよい話だと思いやすい。わざわざ読ませるのは逆の話。',
      use: 'Keep going. It gets better.（続けて。この先が面白いから）' },

    // R fix: V2 (blind 70 %, right): the stem quoted "once", so "four: corrects" was the obvious pair. The stem now
    //   names the moment; "once" is in the segment. "tried" is now "I". S4: it starts at 35.6 s (36 s was 0.2 s before
    //   the captions' "request").
    // why: on "fire" ← the shock is about being fired, so "fire" feels like the heavy word; on "I" ← the request in
    //   the file could have been anyone's, so "I" sounds like the contrast
    // anchor: 39.4–43.3 s her question "You tried to fire me once?" already holds every word but the number, and the
    //   "No, no, no, no" corrects only "once"
    // retired: the ear-check policy: a C2 stress item (the stress in “I tried to fire you four times” on “four”,
    //   42.6 s); back after the ear check
    { id: 'nt2', skill: 'sound', level: 'C2', retired: true, point: 'four', seg: [35.6, 43.3],
      stem: 'When Ron answers her question about his requests, where is his stress, and why?',
      choices: ['On “four”: he corrects how many times', 'On “fire”: he stresses what he tried to do',
                'On “I”: he says it was him, not someone else'], a: 0,
      cue: '短い否定のあと、いちばん強く長い語。',
      line: 'You tried to fire me once? — No, no, no, no. I tried to fire you *four* times.',
      said: '「1回？」と聞かれ、ロンは「いや、4回だ」と、同じ文をくり返して数だけ変える。',
      mean: '相手の文をくり返すと、変えた語に強勢が来る。新しい情報は four だけで、once を直している。',
      trap: 'fire は衝撃の語なので強く感じやすいが、彼女も言った語。強勢は新しい情報に乗る。',
      use: 'Not two hours. I waited three hours.（2時間じゃない、3時間待った）' },

    // R fix: S4: the segment ended at 49.4 s, cutting "If you need to…" (captions 48.87 s); it now ends at 48.85 s,
    //   after "fire times", and starts at 35.6 s. Blind: 70 %, but only through nt2's choices (same point, never drawn
    //   together); alone ≈ 40 %.
    // why: once ← Leslie's "once?" is the first number heard; five ← her stunned "fire times" sounds like "five"
    { id: 'n1', skill: 'number', level: 'B1', point: 'four', seg: [35.6, 48.85], keep: true,
      stem: 'How many times did Ron try to fire Leslie?',
      choices: ['Once', 'Four times', 'Five times'], a: 1,
      cue: '「No, no, no」のあとの数字。',
      line: 'You tried to fire me once? — No… I tried to fire you *four times*.',
      said: '「1回？」と聞く彼女に、ロンは「いや、4回だ」と答える。',
      mean: 'once は彼女の思いこみで、ロンが直している。4回も申請していた。',
      trap: '彼女の「fire times」は five でなく、four と fire が混ざった言いよどみ。',
      use: 'I’ve been there four times.（そこには4回行ったよ）' },

    // R fix: V2 (blind 75 %, right): the title makes "impressed" a non-starter. It is now the literal reading of
    //   nuts (狂った, said of her), next to "crazy about" (in love).
    // why: a bit crazy ← nuts = 狂った, read as describing her; crazy about ← "nuts about someone" = in love, a near idiom
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'nuts', seg: [54.2, 58.6],
      stem: 'Looking back on her first year, how did Ron feel about Leslie?',
      choices: ['He found her endlessly annoying', 'He thought she was a bit crazy', 'He was totally crazy about her'], a: 0,
      cue: '「first year」のあと、短い決まり文句。',
      line: 'The first year you worked here, you *drove me nuts*.',
      said: '「最初の年、君にはおかしくなりそうだった」と言う。',
      mean: 'drive someone nuts ＝ ひどくイライラさせる。',
      trap: 'nuts を「変な人」や「夢中」と取りやすい。drive me nuts は「イライラさせる」。',
      use: 'This noise is driving me nuts.（この音、本当にイライラする）' },

    // R fix: V2 (blind 75 %, right): both distractors were tit-for-tat fillers. They are now the two usual scripts
    //   (argue until he gives in, back down), and the key no longer echoes "anyway".
    // why: kept arguing ← the stubborn-Leslie script, refuted by "ignore me"; gave up ← "I would say no" heard as the
    //   end of it (the 遠慮 frame)
    { id: 'd2', skill: 'detail', level: 'B2', point: 'ignore', reveals: ['would'], seg: [54.2, 64.4],
      stem: 'When Ron said no to her plans, what did Leslie do?',
      choices: ['She went ahead with them all the same', 'She kept arguing until he said yes',
                'She gave up and came up with new ones'], a: 0,
      cue: '「I would say no」のあと、続く2つの行動。',
      line: 'I would say no… and you’d *ignore me*. Or go over my head and *do it anyway*.',
      said: 'ロンが反対しても、彼女は無視するか、上の人に話して結局やってしまった。',
      mean: 'would は「よく〜したものだ」という過去の習慣。何度もあったことだと分かる。',
      trap: '言い争う、引き下がる、のどちらでもない。ignore と anyway を聞く。',
      use: 'I said no, but she did it anyway.（だめと言ったのに、結局やった）' },

    // R fix: V2 (blind 60 %, right): "I would" in the stem settled the tense without the audio. The stem now quotes
    //   only "…and ___ ignore me."
    // why: you'll ← the dark l and the d both shrink to a short tail; you ← the 'd almost disappears before "ignore"
    { id: 's1', skill: 'sound', level: 'B2', point: 'would', reveals: ['ignore'], seg: [58.55, 62.15],
      stem: 'Fill the gap: “…and ___ ignore me.”',
      choices: ['you', 'you’d', 'you’ll'], a: 1,
      cue: '「and」のあと、短い語の終わりの小さな音。',
      line: 'I would say no… and *you’d* ignore me.',
      said: '「僕が反対すると、君は無視したものだ」。',
      mean: '前の I would と同じ過去の習慣。d は次の i とつながる。',
      trap: 'd を落とすと you に聞こえる。you’ll なら未来。前の I would と時制をそろえて聞く。',
      use: 'We’d always stop for ice cream.（いつもアイスを食べに寄ったものだ）' },

    // why: drank ← bubbly = champagne, read as drinking at work; showy ← katakana バブリー (flashy, bubble-era)
    { id: 'h1', skill: 'humor', level: 'C1', point: 'bubbly', seg: [64.35, 68.45],
      stem: 'Why is the last word of Ron’s list funny?',
      choices: ['He calls cheerfulness her biggest fault', 'He hints that she drank champagne at work',
                'He calls her showy, harsher than the rest'], a: 0,
      cue: '「worst of all」のあとの一語の意味。',
      line: 'You were insubordinate, stubborn… and *worst of all, bubbly*.',
      said: '「反抗的、頑固、そして何より最悪なのが、明るいこと」と並べる。',
      mean: 'bubbly ＝ 明るく元気。ふつうはほめ言葉の語を「最悪」として最後に置くずれが笑い。',
      trap: '日本語のバブリーは「派手」だが、英語の bubbly は「明るい」。お酒の泡とも関係ない。',
      use: 'She’s so bubbly and fun.（彼女、明るくて楽しい人）' },

    // R fix: V2 (blind 65 %, right): "too much trouble" was far off. The new near miss flips one word: "in spite of"
    //   for "because of". That is the right target in the wrong direction, and it is the natural faults-then-reason
    //   reading.
    // why: in spite of ← faults first, then a reason, heard as a concession; work made up for it ← "brilliant work,
    //   commendation" from the file is the obvious counterweight to the faults
    // anchor: 64.5–68 s "insubordinate, stubborn" (the faults), then 77–81.9 s "because ultimately, I'd rather work
    //   with a person of conviction": the same stubbornness, renamed as the reason he kept her
    { id: 'nt3', skill: 'infer', level: 'C2', point: 'conviction', seg: [64.35, 82.3],
      stem: 'Which plain-English version keeps what Ron means about why he kept her?',
      choices: ['“I kept you because of how stubborn you were.”', '“I kept you in spite of how stubborn you were.”',
                '“Your good work made up for how annoying you were.”'], a: 0,
      cue: '不満のリストと、ultimately のあとの理由を比べて。',
      line: 'You were *insubordinate, stubborn*… I’d rather work with a *person of conviction*…',
      said: '反抗的で頑固だったと並べたあと、「信念のある人と働きたいから」取り下げた、と言う。',
      mean: '頑固さと信念は同じ性質の裏表。欠点として挙げた点を、そのまま残した理由に言いかえている。',
      trap: '欠点のあとの理由は「それでも」と逆接で聞きやすいが、because のあとは欠点の言いかえ。',
      use: 'Your stubbornness is why I trust you.（その頑固さこそ、信頼できる理由だ）' },

    // R fix: K1 + V2 (blind 60 %, right): "Right" does agree that she was dedicated, so "does it agree?" had a
    //   defensible "yes". The stem now asks how he takes her claim.
    // why: fair point ← "Right" opens like agreement (そうだね); doesn't believe ← "Right…" heard as a sarcastic
    //   "yeah, right"
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'worst', seg: [68.45, 72.8],
      stem: 'When Leslie says she was a dedicated public servant, how does Ron take it?',
      choices: ['As the worst of her faults', 'As a fair point he has to accept', 'As a claim he doesn’t believe'], a: 0,
      cue: '「Right」のすぐあとに続く一文。',
      line: 'I was a dedicated public servant. — Right. *That was the worst thing you were.*',
      said: '「献身的な公務員だった」に、「そう。それが君の一番悪いところだ」と返す。',
      mean: 'Right は「そのとおり、それが問題」。彼女の自慢を、悪口の一番上に置いている。',
      trap: 'Right を「そうだね」と取ると同意に聞こえる。直後の一文で、自慢が欠点に変わる。',
      use: 'Right. That’s exactly the problem.（そう、まさにそこが問題なんだ）' },

    // R fix: V2 (blind 75 %, right): "asks Leslie to get to her point" was off-scene, because she isn't talking. It is
    //   now a softening reading (a Japanese frame: 言いすぎたけど).
    // why: one more ← his list of faults was still running; went too far ← a Japanese softening frame after a
    //   list of insults
    { id: 'm1', skill: 'marker', level: 'B2', point: 'point', seg: [72.75, 77],
      stem: 'After his list of faults, what does Ron’s opening phrase do?',
      choices: ['It moves on to what he really wants to say', 'It adds one last fault to the list he gave',
                'It admits he went too far with the list'], a: 0,
      cue: '悪口のあと、次の文の最初の3語。',
      line: '*The point is*, I ended up…',
      said: '「要するに」と言って、ここから話の結論に入る。',
      mean: 'The point is ＝ 大事なのはここ。前の話をまとめ、本当に言いたいことを出す合図。',
      trap: '悪口のあとなので、弁解やもう一つの悪口と取りやすい。The point is は「本題はここ」の合図。',
      use: 'The point is, we need more time.（要するに、もっと時間が要るんだ）' },

    // why: good work ← the file's "brilliant work, commendation" was read aloud earlier; train someone new ← the usual
    //   "hard to replace" script
    { id: 'd3', skill: 'detail', level: 'B2', point: 'conviction', seg: [72.75, 82.3],
      stem: 'Why did Ron drop his requests in the end?',
      choices: ['He’d rather have someone firm than a flatterer', 'He decided her great work outweighed her faults',
                'He didn’t want to train someone new for her job'], a: 0,
      cue: '「because ultimately」のあと、2種類の人を比べる部分。',
      line: '…because ultimately, I’d rather work with a *person of conviction* than a wishy-washy…',
      said: '信念のある人と働くほうが、ぐらぐらしたごますりよりいい、と言う。',
      mean: 'conviction ＝ 信念。反抗や頑固さも、裏返せば信念の強さだという評価。',
      trap: '前にほめ言葉の記録を読んだので、仕事ぶりが理由だと思いやすい。理由は because のあと。',
      use: 'I’d rather be honest than polite.（礼儀より正直でいたい）' },

    // R fix: V2 (blind 75 %, right): the key was the only paraphrase, and the others repeated "lost". All three are
    //   now "She feels…" plus a "lost my ___" chunk. S4: it ends at 89.3 s (89.05 s clipped "bearings", which the
    //   captions place at 88.89 s).
    // why: nerve ← "lost my nerve" is a common chunk, and she's scared of the vote; temper ← "lost my…" is most often
    //   "lost my temper"
    { id: 'p3', skill: 'phrase', level: 'B2', point: 'bearings', seg: [82.3, 89.3],
      stem: 'What does Leslie mean by what she feels she has lost?',
      choices: ['She feels unsure which way to go', 'She feels she has lost her nerve',
                'She feels she has lost her temper'], a: 0,
      cue: '「new job」のあと、lost に続く語。',
      line: 'I just feel like I’ve *lost my bearings*.',
      said: '新しい仕事では自信が持てず、「方向を見失った気がする」と言う。',
      mean: 'bearings ＝ 位置や方角の感覚。どこへ向かえばいいか分からない状態。',
      trap: 'lost my temper や lost my nerve と形が同じ。最後の語まで聞く。',
      use: 'I lost my bearings in the new city.（新しい街で方角が分からなくなった）' },

    // R fix: V2 (blind 65 %, right) and §9.6: the key was the only two-part choice. All three now concede, then turn.
    // why: risky ← "unknown terrain" read literally as a dangerous place; urging her to quit ← "wandered" heard as
    //   having strayed from the right path
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'stillyou', seg: [87.4, 94.35],
      stem: 'What is Ron doing in his reply to her worry?',
      choices: ['Granting that it’s new, then reassuring her', 'Agreeing she’s lost, then urging her to quit',
                'Calling it risky, then wishing her luck'], a: 0,
      cue: '「No」のあと、may have と but の組み合わせ。',
      line: 'No, you haven’t. You *may have* wandered into unknown terrain, *but you’re still you*.',
      said: '「見失ってない。知らない土地に入っても、君は君だ」と言う。',
      mean: 'may have ～, but … ＝「〜は認めるが、大事なのは…」。不安を認めてから安心させる。',
      trap: 'unknown terrain を危険な場所と取りやすい。本題は but のあと。',
      use: 'It may be hard, but you’ve got this.（大変かもしれないけど、君ならできる）' },

    // R fix: V2 (blind 85 %, right): the thank-you distractor had no tie to a compass. It is now "a hint on which way to
    //   vote" (direction plus her problem), which nothing in the audio supports.
    // why: real hike ← "adventurers" + "terrain" taken literally; vote hint ← a compass points a way, and her vote is
    //   the open problem
    { id: 'i3', skill: 'infer', level: 'C1', point: 'compass', reveals: ['stillyou', 'bearings'], seg: [90.5, 105.5],
      stem: 'Why does Ron choose a compass as his gift?',
      choices: ['It answers her feeling of having lost her way', 'It’s a hint about which way to vote',
                'It’s for a real hike he has planned for her'], a: 0,
      cue: '贈り物の前に二人が使った「道・方角」の言葉。',
      line: 'You may have wandered into unknown terrain… *Take this compass.* All great *adventurers* need one.',
      said: '「知らない土地に入った」のあと、「方位磁石を。冒険家には必要だ」と渡す。',
      mean: '「方角を見失った」に合わせた贈り物。新しい仕事を冒険にたとえて励ます。',
      trap: 'adventurers を文字通り取ると旅行の話になる。比喩が続いたら、贈り物も比喩の続き。',
      use: 'Every new job is an adventure.（新しい仕事は、どれも冒険だ）' },

    // R fix: V2 (blind 70 %, right): the key was the most coherent two-part choice. The mix-up is now a two-part
    //   intent ("means X but says it backward"), so all three have the same shape.
    // why: mix-up ← "forgive and forget" is the set phrase, so the pair sounds swapped; forgives then angry ← "will not
    //   forget" heard without its "not", as a softening
    { id: 'h2', skill: 'humor', level: 'C1', point: 'forgive', seg: [105.5, 115.6],
      stem: 'Why do Leslie’s last words to Ron get a laugh?',
      choices: ['She thanks him, then swears never to let it go', 'She means “forgive and forget” but says it backward',
                'She forgives him, then gets upset again'], a: 0,
      cue: 'ロンへの最後の一言、listen に続く部分。',
      line: 'Thank you, Ron. … I *will not forget*, and I *will never forgive you*.',
      said: '礼を言った直後、「忘れないし、絶対に許さない」と言う。',
      mean: '感謝の直後に恨みを宣言する落差が笑い。決まり文句 forgive and forget の逆。',
      trap: 'forgive と forget は似ているが、not と never で両方否定している。',
      use: 'I’ll never forget this. Thank you.（このご恩は忘れません）' },

    // R fix: V2 (blind 80 %, right): "made up her mind on the vote" was too specific to be tempting. It is now the C2
    //   near miss "found her direction" (the compass read), which no line in the audio supports.
    // why: found her direction ← after the compass and "bearings" talk, "There she is" sounds like "she's found her
    //   way", but no direction or vote is named; calmed down ← "There she is" as relief that she's back to normal, read as calm,
    //   when she has just vowed a grudge
    // anchor: 108.4–113.6 s "I will not forget, and I will never forgive you": a stubborn stand against Ron himself, the
    //   trait he called "conviction" (79.6 s); 113.8 s "There she is" answers it at once
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'forgive', reveals: ['stillyou'], seg: [105.5, 116],
      stem: 'Right after her grudge, what does Ron mean by “There she is”?',
      choices: ['The stubborn Leslie he knows is back', 'She has found her direction at last',
                'She has calmed down after the shock'], a: 0,
      cue: '直前の「許さない」と、前に彼が買った性質。',
      line: 'I *will never forgive you*. — *There she is.*',
      said: '彼女が「絶対に許さない」と言い切ると、ロンは「それでこそ君だ」と言う。',
      mean: 'There she is ＝「いつもの彼女が戻った」。自分に逆らう頑固さこそ、彼が信念と呼んで評価した性質。',
      trap: '方位磁石の話のあとなので「進む道が決まった」と取りやすいが、投票の話は出ない。何に反応したかを聞く。',
      use: 'There he is! The old Tom is back.（それでこそ！いつものトムだ）' },
  ]
};
