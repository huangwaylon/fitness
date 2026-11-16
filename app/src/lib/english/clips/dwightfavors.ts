// REVIEW 2026-11-16: pass 9, fix 12, drop 1, new 0; ear checks 2
// REVIEW open: none beyond the two ear checks.
// “Dwight's Favors - The Office US” (the official The Office channel, Best of Season 6): Dwight hands out bagels so
// the office will owe him favors he can use against the man who took his co-manager job; Andy answers with favors of
// his own, the two trade kindnesses all day, and the office pays Dwight back at once with a cheap gift card.
// Segments from the captions, words from whisper (2026-11-16). Named in the audio: Dwight (20.6, 75.5, 193.1, 202.2,
// 214.5 s), Stanley (6.4 s), Michael (27.4 s), Andy (158.1, 168.5 s), Jim (238.7 s). Talk ends at ≈ 253 s; whisper's
// lines after that are a loop. Left out on purpose: 28–41 s (the girlfriend, "aphrodisiac" and "deer penis"), "I'm
// taking one for/from my lady friend" (51.4 s; the sources disagree), the door and "Campbell"/"finished" (112–116 s),
// "Not necessary. You didn't have to do that" (154.6 s: who says it isn't settled by a name), and the mushroom lines
// (241–253 s: "this high" is a gesture, and the reply is "they don't"/"I don't").
// EAR CHECK: 186.6 s r1 — the cut falls after “awfully complicated to make” and before “I will make everyone's tacos”
//   (0.3 s gap)
// EAR CHECK: 232 s g2 — captions “It's FROM everybody”, whisper “It's FOR everybody”: the key (everyone pays him back)
//   reads best with “from”; it also stands on “What if Dwight dies and I still owe him” (214 s) and “no closer” (237 s)
import type { Clip } from '../types.ts';

export const dwightFavors: Clip = {
  id: 'dwightfavors', video: '04TmqfAbKKM', title: 'Dwight\'s Favors', dur: 270, wpm: 180, band: 'fast',
  tags: ['職場', 'お願い・断り'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // why: wait ← "No, no, no" heard as manners (Stanley took one too soon); Michael ← Dwight brings Michael a bagel next
    //   (26–47 s), so the first one seems saved for the boss
    { id: 'd1', skill: 'detail', level: 'B1', point: 'pumpernickel', seg: [4.7, 11.1],
      stem: 'When Stanley says “Thank you”, why does Dwight say “No, no, no”?',
      choices: ['He has a different kind saved just for Stanley', 'He wants Stanley to wait until everyone has one',
                'He has to give the first one to Michael'], a: 0,
      cue: '「No, no, no」のあと、I got に続く部分。',
      line: 'No, no, no. I got *a pumpernickel just for you*.',
      said: '「待って、君には黒パンのベーグルを用意したんだ」と、別の種類を差し出す。',
      mean: 'just for you ＝「君のためだけに」。一人ずつに合わせて、恩を売る下準備。',
      trap: 'No が3回続くと「だめ」と止めたように聞こえる。no のあとに来る理由まで聞く。',
      use: 'I got this just for you.（これ、あなたのために買ったの）' },

    // R drop: i1 (K1 + V1). "Oh, why? Is there a place closer that sells them?" reads two ways from the words alone: a
    //   sincere question (he didn't know) or a rhetorical one (an authentic bagel means New York). Only his tone settles
    //   it, and the blind pass got it at 55 %. Never shipped, so deleted; infer stays at 2 (i2, i3).

    // R fix: V2 (75 % blind: "favor" is in the title, and the key was the only favor choice). The new near miss is the
    //   literal "one" = one bagel; "welcome, it's free" keeps the "don't mention it" reading.
    // why: one bagel ← "owe me one" with "one" heard as a bagel, the thing just handed out; welcome ← "don't mention it",
    //   said just before, taken as the whole message
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'oweone', seg: [19.5, 26.5],
      stem: 'What does Dwight mean by his reply to the thank-yous?',
      choices: ['Each of them owes him something back later', 'Each of them owes him one bagel next time',
                'Each of them is welcome; the bagels are free'], a: 0,
      cue: '「don’t mention it」のあと、短い一言。',
      line: 'Oh, *don’t mention it*. *You owe me one*.',
      said: '「礼にはおよばないよ。そのかわり貸しひとつね」と全員に言う。',
      mean: 'owe me one ＝「借りができたね」。お金ではなく、お返しの頼みごとを指す。',
      trap: 'one を配ったベーグル1個と取りやすい。ここの one は頼みごと一つ。',
      use: 'Thanks, I owe you one!（ありがとう、借りができたね）' },

    // why: no ← "don't" + "mind" heard as a refusal (日本語の「結構です」の発想); later ← he has just said he ate two
    //   sandwiches, so a hedge seems likely
    // R fix: S4 (2.8 s, under 3 s). Now starts before "that you are hungry", 3.8 s.
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'mindif', seg: [45.75, 49.55],
      stem: 'When Dwight offers Michael a bagel, what is Michael’s answer?',
      choices: ['Yes, he’d be glad to take one', 'No, he is still too full to eat', 'He’ll have one later, if any are left'],
      a: 0,
      cue: '「Bagel?」への返事。don’t だけで決めない。',
      line: 'Bagel? — *I don’t mind if I do*.',
      said: '「ベーグル？」に「じゃあ、いただこうかな」と答える。',
      mean: 'I don’t mind if I do ＝ 勧められた物を受け取る決まり文句。「遠慮なく」。',
      trap: 'don’t で断りに聞こえる。mind は「嫌がる」なので、「嫌じゃない」＝もらう。',
      use: 'More cake? Don’t mind if I do.（ケーキもっと？じゃあ遠慮なく）' },

    // R fix: V2 (50 % blind: "make friends" was a filler). The new near miss swaps "fired" for "quit"; "fired" is said.
    // why: quit ← the right target and the right goal, with "fired" softened to the likelier office outcome; votes ←
    //   "co-manager position" heard as an election he wants to win
    { id: 'd2', skill: 'detail', level: 'B2', point: 'motive', seg: [57.4, 67.6],
      stem: 'In his comment to the camera, what does Dwight plan to use the favors for?',
      choices: ['To get the man who took his job fired', 'To win votes for the co-manager job',
                'To get the new co-manager to quit'], a: 0,
      cue: '「a favor which he can use」のあと。',
      line: '…a favor which he can use *to get someone fired who stole a co-manager position* from him',
      said: 'ベーグルで恩を売り、その貸しで「共同部長の座を奪ったやつ」をクビにしたいと話す。',
      mean: '親切は手段。目的は地位を取った相手への仕返し。',
      trap: '辞めさせる、と丸めて覚えやすい。get + 人 + fired は「クビにさせる」。最後の語まで聞く。',
      use: 'I’ll save that favor for later.（その貸しは取っておくよ）' },

    // why: coworkers ← "When did everyone get so cynical?" taken at face value: he blames them, so the joke seems aimed
    //   at them; the man ← "get someone fired" heard as the scheme's target, so the joke's target too
    // anchor: 58.9–66.7 s his own words lay out a cynical plan ("so they'll owe him a favor… to get someone fired"), then
    //   70.2–72.2 s he complains about everyone else's cynicism
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'cynical', reveals: ['motive'], seg: [57.4, 72.8],
      stem: 'In Dwight’s comment to the camera, who is the joke on?',
      choices: ['Dwight, who can’t see his own cynicism', 'His coworkers, for doubting his kindness',
                'The man who took the co-manager job'], a: 0,
      cue: '自分で話した計画と、最後の嘆きの差。',
      line: '…a favor which he can use *to get someone fired*… Jeez. *When did everyone get so cynical?*',
      said: '恩を売ってライバルをクビにさせる計画を話した直後、「みんな、いつからそんなにひねくれた？」と嘆く。',
      mean: '一番打算的なのは本人。自分の計画の打算に気づかず他人を責めるので、笑いは本人に向く。',
      trap: '嘆きの対象がみんななので、皮肉の的もみんなに見える。誰の行動が一番ひねくれているかを比べる。',
      use: 'Ugh, when did everyone get so serious?（もう、みんな、いつからそんなに真面目に？）' },

    // anchor: 61.5–62.3 s "so they'll owe him" runs together at ~180 wpm: "they'll" ≈ "thel", "him" loses its h
    { id: 'nt2', skill: 'dict', level: 'C2', point: 'theyllowe', seg: [59, 64.5],
      stem: 'Type the fast stretch: “…for his friends so ___ a favor.” (3 words)', answer: "they'll owe him",
      cue: '「friends so」のあと、a favor の前。',
      // R fix: B1/S6 — the stars held "so", which isn't in the answer (the stem gives it).
      line: '…for his friends so *they’ll owe him* a favor…',
      said: '恩を着せるためにベーグルを買う、と言う。they’ll は「ゼル」、him は h が落ち、3語が一続き。',
      mean: 'so they’ll ～ ＝「〜するように」。本音がさらっと出る。',
      trap: 'him の h が消えて owe とつながり「オウイム」になる。弱い代名詞は前の語にくっついた音で探す。',
      use: 'I’ll bring snacks so they’ll like me.（好かれるようにお菓子を持っていく）' },

    // R fix: V2 (75 % blind: the key was the only rivalry choice). Now three exchange patterns.
    // why: call it even ← "Favor returned" (108 s) heard as the end of it, the polite script; asking ← "favor" heard
    //   over and over, in the wrong relation (Dwight helps, Andy asks)
    { id: 'g1', skill: 'gist', level: 'B2', point: 'rivalry', seg: [75, 206.2],
      stem: 'What goes on between Dwight and Andy through the middle of the clip?',
      choices: ['They keep paying each other back, each time a bit more', 'Andy returns one favor, and they call it even',
                'Andy keeps asking Dwight for favors, and Dwight says yes'], a: 0,
      cue: '片方が親切をすると、もう片方は何をする？',
      said: 'アンディがかばんを磨いてお返しをし、ドワイトは「すぐ返す」と宣言。昼食、タコスと親切が続く。',
      mean: '親切で相手に借りを作らせる勝負。どちらも借りを負いたくない。',
      trap: '「お返しした」で一件落着に聞こえやすい。誰が誰に、何のお返しをしているかを最後まで追う。',
      use: 'Come on, this isn’t a contest.（ちょっと、張り合うことじゃないでしょ）' },

    // R fix: V2 (70 % blind: "special oil" was a giveaway literal trap) + S1/K1 ("stress" made "only a moment" half
    //   defensible, since "a little" is modest). Now asks what it took, with three concrete methods.
    // why: quick wipe ← "a little" heard as a little time or work; shoe polish ← grease = 油, taken literally, with
    //   "polishing my loafers" just before
    { id: 'f4', skill: 'phrase', level: 'C1', point: 'elbow', seg: [84.6, 95.4],
      stem: 'What does he say it took to fix up the briefcase?',
      choices: ['Some hard rubbing by hand', 'Some oil from his shoe polish', 'A quick wipe with a cloth'], a: 0,
      cue: '「worse for the wear」のあと、So に続く語。',
      line: 'So, *a little elbow grease*, and she’s polished right up…',
      said: 'くたびれたかばんを「ちょっと腕によりをかけて」磨き直したと言う。',
      mean: 'elbow grease ＝ 手でこする労力。a little は謙遜。',
      trap: 'grease を油、a little を短い時間と取りやすい。体の部位＋名詞の熟語は、まず比喩を疑う。',
      use: 'It just needs some elbow grease.（ちょっと手間をかければきれいになる）' },

    // why: never takes ← "Do not test my politeness" heard as a warning to keep away; list ← "thank you note" and
    //   "RSVP" heard as checking other people's manners
    { id: 'i2', skill: 'infer', level: 'B2', point: 'rule', seg: [99.6, 112.3],
      stem: 'In Dwight’s comment to the camera, what is his rule?',
      choices: ['He pays back every kindness right away', 'He never takes gifts or favors from anyone',
                'He keeps a list of who forgot to thank him'], a: 0,
      cue: '「bam」「wham」のあとの短い語。',
      line: 'You give me a gift, bam! *Thank-you note*. … You do me a favor, wham! *Favor returned*.',
      said: '「贈り物にはすぐ礼状、招待にはすぐ返事、親切にはすぐお返し」と効果音つきで並べる。',
      mean: 'もらった恩は即座に返す、という決まり。借りを作らない主義。',
      trap: '最後の警告が強いので「受け取らない」と取りやすい。bam のあとは、自分がすることを言っている。',
      use: 'You cooked, so I’ll do the dishes.（作ってくれたから、皿洗いは私が）' },

    // why: back ← clenching while walking sounds like a back-care tip; stand up straight ← the jacket "straight as an
    //   arrow" right after (134–139 s)
    { id: 'd3', skill: 'detail', level: 'B1', point: 'knees', seg: [118.3, 126.2],
      stem: 'What does the walking tip claim to help with?',
      choices: ['The pressure on your knees', 'The pain in your lower back', 'The way you stand up straight'], a: 0,
      cue: '「you can really take」のあと。',
      line: 'you can really *take the pressure off your knees*.',
      said: '「歩くときにお尻を締めると、ひざの負担が減る」という健康の豆知識。',
      mean: 'take the pressure off ～ ＝ ～の負担を軽くする。体にも気持ちにも使う。',
      trap: '体の話なので腰や姿勢を思い浮かべやすい。off のあとの名詞を最後まで聞く。',
      use: 'That takes the pressure off me.（それで気が楽になる）' },

    // why: buttoned ← "do not walk around with your jacket…" heard as a dress-code fix; too big ← the unknown word guessed
    //   as "baggy"
    { id: 'i3', skill: 'infer', level: 'C1', point: 'jacket', seg: [132.2, 141.3],
      stem: 'From the words that follow, what is wrong with the jacket?',
      choices: ['It is sitting crooked on him', 'It is buttoned up the wrong way', 'It is too big across the back'],
      a: 0,
      cue: '知らない語のあと、比べている形容。',
      line: 'Do not walk around with your jacket *cattywampus*. … *straight as an arrow*.',
      said: '「上着をゆがめて歩くな。矢のようにまっすぐ」と直す。',
      mean: 'cattywampus ＝ 斜め、ゆがんだ（くだけた米語）。あとの straight が反対語。',
      trap: '知らない語は勘で「大きい」「ボタン」と埋めやすい。直後の言い直しや反対語から意味を決める。',
      use: 'Your collar’s a little crooked.（えりがちょっと曲がってるよ）' },

    // why: worried ← "not worried" with the n't lost: "I'm (not) worried"; thankful ← Andy's favors taken at face value
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'upgame', seg: [157.5, 163.1],
      stem: 'In his comment to the camera, how does Dwight feel about Andy’s favors?',
      choices: ['Pushed to try even harder himself', 'Worried that Andy will win everyone over',
                'Thankful that someone is finally helping'], a: 0,
      cue: '「but」のあとの2つの文。',
      line: 'Andy is complicating things. *But I’m not worried*. This will only *up my game*.',
      said: '「ややこしくなった。でも心配してない。むしろ本気が出る」。',
      mean: 'up my game ＝ 自分のレベルを上げる。相手の親切を挑戦と受け取っている。',
      trap: 'not が弱く「心配だ」に聞こえやすい。but のあとが本音。not の t の止めを聞く。',
      use: 'Okay, time to up my game.（よし、本気を出さなきゃ）' },

    // why: book on manners ← "book of niceness" taken literally; on his own ← "Yep. Yep." heard as proud ownership
    // R fix: S4 (15.5 s). Ends after "so I got lunch for everyone", 14.15 s.
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'page', seg: [166.8, 180.95],
      stem: 'By the speaker’s own account, where did the lunch idea come from?',
      choices: ['He copied Dwight’s own trick', 'He read it in a book on manners', 'He thought it up all on his own'],
      a: 0,
      cue: '「took a page」と、そのあとの説明。',
      line: 'Took a *page right out of* the old Schrute book of niceness. … *You bought breakfast* for everyone, so I got lunch…',
      said: '「シュルート流・親切の本から拝借」と言い、「朝食をおごったから昼食を」と説明する。',
      mean: 'a page out of ～’s book ＝ ～のやり方をまねる。',
      trap: 'book を本物の本と取りやすい。直後の「朝食をおごったから」が答え合わせ。',
      use: 'I took a page out of your book.（あなたのやり方をまねたよ）' },

    // R fix: V2 (50 % blind: the complaint was a filler). The new near miss is the right move (an offer) of the wrong
    //   kind (teach, not do).
    // why: show how ← "awfully complicated" heard as setting up a lesson, and Dwight likes to instruct; request ← a hard
    //   job usually sets up asking for help
    // predict: the segment stops after "to make"; the reveal plays "I will make everyone's tacos"
    { id: 'r1', skill: 'predict', level: 'B2', point: 'tacos', seg: [182.1, 186.6], then: [186.6, 189],
      stem: 'Right after the remark about the tacos, what kind of move comes next?',
      choices: ['An offer to make them for everyone', 'An offer to show everyone how',
                'A request for someone to help him'], a: 0,
      cue: '「allow me」から始まる流れに注目。',
      line: '*Allow me*. … these tacos are *awfully complicated to make*. — I will make everyone’s tacos.',
      said: '「どうぞ私に」と言い、「タコスって作るの大変だよね」と前置きして全員分を作ると言う。',
      mean: '「大変だ」は助けを頼む前置きではなく、自分が引き受ける口実。',
      trap: '「大変」は助けを求める型に聞こえる。直前の Allow me が、自分がやる流れを示す。',
      use: 'That looks heavy. Here, allow me.（重そう。貸して、持つよ）' },

    // why: wanna ← "gonna" and "wanna" share the "-nna" ending; can do ← the weak "I'm" lost; gonna get ← "do" is short
    //   and swallowed before "this"
    { id: 's1', skill: 'sound', level: 'B2', point: 'gonna', seg: [192.2, 196.7],
      stem: 'Fill the gap: “Whoa, whoa, Dwight, ___ this.”',
      choices: ['I’m gonna do', 'I wanna do', 'I can do', 'I’m gonna get'], a: 0,
      cue: '「Dwight」のあと、主語から短い3語。',
      line: 'Whoa, whoa, Dwight, *I’m gonna do* this.',
      said: '「待って、これは僕がやるよ」。going to が gonna に縮む。',
      mean: 'I’m gonna は「アムガナ」に近い。自分がやると申し出る形。',
      trap: 'wanna と gonna は語尾が同じ。頭が g か w か、I’m の m があるかで分ける。',
      use: 'I’m gonna grab some coffee.（ちょっとコーヒー買ってくる）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'covered', seg: [192.2, 196.7],
      stem: 'Type the answer after “relax”: “I ___.” (3 words)', answer: 'got it covered',
      cue: '「relax」のあと。got と it がつながる。',
      line: 'Hey, hey, hey, relax, I *got it covered*.',
      said: '「まあまあ、落ち着いて。ちゃんとやるから」。got it は「ガディ」。',
      mean: 'I got it covered ＝「任せて」。手伝いを断るときにも使う。',
      trap: 'got it の t が弾み、一語に聞こえる。3語なので、つながりをほどいて書く。',
      use: 'Don’t worry about dinner. I got it covered.（夕食は任せて）' },

    // R fix: V2 (70 % blind: the clip's theme made the debt choice obvious, and the apology was a filler). Three
    //   "Brushing it off…" moves; the new near miss reads "owe" as money now.
    // why: paid now ← owe = 借金, so money for the tacos; for free ← "Don't worry about it" taken as the whole reply
    //   (the usual kind script)
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'justowe', reveals: ['oweone'], seg: [201.2, 206.2],
      stem: 'When told “this is ridiculous”, what is Dwight’s reply really doing?',
      choices: ['Brushing it off, then making it a debt for later', 'Brushing it off, then asking to be paid for it now',
                'Brushing it off, and letting it go for free'], a: 0,
      cue: '「Don’t worry about it」のあと、just のつく一言。',
      line: '*Don’t worry about it*, you can *just owe me*.',
      said: '「ばかげてる」と言われ、「気にするな、貸しにしとけ」と返す。',
      mean: '「気にしないで」は普通、見返りなしの意味。ここでは逆に借りを作らせる。',
      trap: 'Don’t worry about it で親切に聞こえやすい。owe はお金とは限らない。',
      use: 'Don’t worry about it, buy me lunch sometime.（気にしないで、今度お昼おごって）' },

    // R fix: V2 (60 % blind: "cheaply" marked the key as the twist, and the Andy choice was weak). The new near miss
    //   is the right payback in the wrong form (one by one).
    // why: one by one ← the machine favor (209–222 s) heard as the first of many small paybacks; enough to use ←
    //   "you're gonna owe me big time" (219 s) heard as a debt finally big enough
    { id: 'g2', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['waste', 'motive'], seg: [201.2, 245.7],
      stem: 'How does the favor plan turn out for Dwight in the end?',
      choices: ['They clear their debts all at once with one small gift', 'They pay him back one by one with small favors',
                'They now owe him enough for him to finally use it'], a: 0,
      cue: '最後のプレゼントと、そのあとの一言。',
      line: '*Starbucks gift card*. Surprise! … Damn it. I am *no closer* to taking Jim down.',
      said: 'みんなから安いギフトカードを贈られ、「ジムを倒すのに一歩も近づいてない」とこぼす。',
      mean: '全員がまとめて借りを返し、貸しは帳消し。集めた恩は使えずに終わる。',
      trap: '途中の「大きな貸しだぞ」が残りやすいが、最後のカードで貸しは消える。結末は最後の一言で。',
      use: 'Here, now we’re even.（はい、これで貸し借りなし）' },

    // R fix: V2 (50 % blind: the key was the only odd choice). The machine filler is replaced by the opposite
    //   implication (death cancels the debt).
    // why: way out ← "dies" + "still owe" heard as hoping the debt dies with him; glad ← "What if Dwight dies" heard as
    //   a wish
    { id: 'h1', skill: 'humor', level: 'C1', point: 'ghost', seg: [213.6, 218.85],
      stem: 'Why does the worry about Dwight dying get a laugh?',
      choices: ['It makes a small debt the cause of a haunting', 'It treats his death as a way out of the debt',
                'It hints the speaker would be glad to see him go'], a: 0,
      cue: '「recipe for」のあとの名詞。',
      line: 'What if Dwight dies… I *still owe him something*? That is a *recipe for a ghost*.',
      said: '「ドワイトが死んで、まだ借りが残ってたら？それは幽霊のもとだ」。',
      mean: 'recipe for ～ ＝ ～を生むもと。小さな貸し借りを、化けて出るほどの大事に語るのが笑い。',
      trap: 'dies が強く響き、死を望む話に聞こえやすい。笑いの中心は最後の名詞。',
      use: 'That’s a recipe for disaster.（それは失敗のもとだよ）' },

    // why: $50 ← fifteen/fifty: -teen vs -ty; $5 ← the "five" core heard and the "fif-" lost
    { id: 'n1', skill: 'number', level: 'B1', point: 'value', seg: [227.3, 235.3], keep: true,
      stem: 'What value is the gift card said to have?',
      choices: ['$5', '$15', '$50'], a: 1,
      cue: '「everybody」のあと、value の前の数。',
      line: 'Starbucks gift card. Surprise! … *$15 value*.',
      said: 'スターバックスのギフトカードを渡し、「15ドル相当」と言い添える。',
      mean: 'value ＝ 相当額。「〜ドル相当」は景品や割引の説明でよく聞く言い方。',
      trap: 'fifteen と fifty は似ている。-teen は語尾が長く強く、-ty は前が強く短い。',
      use: 'Sorry, was that fifteen or fifty?（すみません、15？それとも50？）' },

    // R fix: V2 (55 % blind: the only negative feeling at the end of a scheme). Two "Frustrated…" choices now; the
    //   reason is what the audio settles.
    // why: Andy ← the favor war with Andy (75–206 s) taken as what he lost; calm, even ← the sigh "Ah" and the gift
    //   card from everybody heard as a clean slate he accepts
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'waste', reveals: ['outcome'], seg: [236.2, 245.7],
      stem: 'How does Dwight feel about his day at the very end?',
      choices: ['Frustrated, because the day got him nowhere', 'Frustrated, because Andy beat him at favors',
                'Calm, because everyone is now even with him'], a: 0,
      cue: '最初の短い一言と、ため息のあとの一文。',
      line: '*Damn it*. I am no closer… Ah, *what a waste of a day*.',
      said: '「くそ、何も前に進んでない。ああ、無駄な一日だった」。',
      mean: 'what a waste of ～ ＝「なんて〜の無駄」。がっかりといら立ちの決まった形。',
      trap: '「Ah」はほっとした声にも聞こえる。no closer と waste が気持ちを決める。',
      use: 'What a waste of time.（時間の無駄だった）' },
  ]
};
