// REVIEW 2026-11-16: pass 10, fix 14, drop 0, new 0; ear checks 1
// OPEN: r1 and s1 stay near 50 % blind for anyone who knows the chunk (“I'll tell you what…”, “How would you feel about…”).
// “Ann and Ben compete for the *perfect* gift | Parks and Recreation” (the official Parks and Recreation channel,
// Season 5): Ann and Ben fight over a waffle iron for Leslie, lose it at auction, join a pawn-shop bidding war, then
// team up and ask Leslie to cut back her many friendship holidays.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 230 s. The Game of Thrones names
// (Tyrion, Qarth) and the pawn-shop owner's identity are untested; he is “the man” in stems. Holiday ownership in the
// opening (whose is breakfast day, whose is waffle day) is muddled in both transcripts, so no item rests on it.
// EAR CHECK: 110.0 s r1 — the cut falls after “I'll tell you what” and before “I'll give it to you…” (captions put “Ann” at 110.04, whisper ≈ 0.5 s earlier)
import type { Clip } from '../types.ts';

export const waffleGift: Clip = {
  id: 'wafflegift', video: 'EKJ0SYcn2ik', title: 'Ann and Ben compete for the *perfect* gift', dur: 251, wpm: 186,
  band: 'fast', tags: ['友だち', '買い物'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: “Ann wins, Ben gives up” was weak (V2, blind ≈ 50 %); replaced with Ben outbidding her at the last second
    // why: Ben outbids ← “swooped in at the last second” heard without “somebody”, as one of the pair;
    //      together ← “we're both screwed” puts them on one side, the move they make later
    { id: 'g1', skill: 'gist', level: 'B1', point: 'lost', seg: [0, 61.2],
      stem: 'How does the first argument between Ann and Ben end?',
      choices: ['Someone else wins it, and both lose out', 'Ben outbids Ann for it at the last second',
                'They agree to bid on the item together'], a: 0,
      cue: '言い合いの途中、急に二人の声が変わるところ。',
      line: 'Oh, God, oh, no, we’ve *lost the auction*.',
      said: '二人で「自分が買う」と張り合うが、途中で「オークションに負けた」と気づく。',
      mean: 'どちらの物にもならず、二人とも手ぶら。ここから話が動く。',
      trap: 'last second だけ拾うと、どちらかが競り勝った話に聞こえる。主語の somebody を聞く。',
      use: 'We lost the bid.（入札に負けちゃった）' },

    // why: fight ← “the beginning of our friendship” can sound like a story with a turning point;
    //      date ← Ben is named, and an “anniversary” usually means a couple's
    { id: 'd1', skill: 'detail', level: 'B1', point: 'jjs', seg: [15.2, 23.05],
      stem: 'According to Ann, what first happened at JJ’s?',
      choices: ['Ann and Leslie hung out for the first time', 'Ann first tried the waffles Leslie loves',
                'Leslie and Ben went on their very first date'], a: 0,
      cue: '「Please, Ben」のあと、anniversary の中身。',
      line: 'the anniversary of the *first time we hung out* at JJ’s…',
      said: 'アンは「JJ’s で初めて一緒に過ごした日の記念日」と説明する。',
      mean: 'レスリーはその日を「二人の友情の始まり」と考えていて、毎年祝っている。',
      trap: 'anniversary は日本語の「記念日」と同じで、恋人同士とは限らない。友だちの記念日にも使う。',
      use: 'It’s the anniversary of our first trip.（初めての旅行の記念日なんだ）' },

    // R fix: “left out / jealous” and “bored” were weak (V2, blind ≈ 60 %); distractors now fed up and touched.
    //   Reveals pillow: mean's 息苦しい gives away h1's key (N7)
    // why: fed up ← “complaining” heard without the apology that follows;
    //      touched ← “thoughtful… cherished memories… I love you” heard as warm words
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'benfeel', reveals: ['pillow'], seg: [22.5, 33.45],
      stem: 'How does Ben feel about the way Leslie celebrates?',
      choices: ['Overwhelmed by it, and a bit guilty for saying so', 'Fed up with it, and glad to get it off his chest',
                'Touched by it, and a bit shy to admit it'], a: 0,
      cue: '例えのあと、自分で自分にツッコむ一言。',
      line: 'I can’t believe I’m *complaining* about how thoughtful my wife is. *Sorry, honey*, I love you.',
      said: '「妻が気配り上手すぎるって文句を言うなんて。ごめん、愛してるよ」と言う。',
      mean: '祝われすぎて息苦しいが、悪いのは自分の文句の方だと分かっていて、すぐ謝る。',
      trap: 'complaining だけ拾うと本気の不満に聞こえる。直後の謝りまで聞いて気持ちを決める。',
      use: 'I can’t believe I’m complaining about this.（こんなことで文句言うなんてね）' },

    // R fix: the key was the only choice with a sting (V2, blind ≈ 65 %); “treasure” is now the literal-gift reading
    // why: hated pillow ← the pillow taken as a real gift he got; grandma ← a hand-quilted pillow is a grandma's craft
    { id: 'h1', skill: 'humor', level: 'C1', point: 'pillow', seg: [22.5, 29.15],
      stem: 'Why is Ben’s pillow comparison funny?',
      choices: ['It makes being loved sound like being attacked', 'It shows he hated a pillow she once gave him',
                'It makes his wife sound like a fussy old grandma'], a: 0,
      cue: 'pillow の直前の動詞に注目。',
      line: 'It’s like being *smothered* with a hand-quilted pillow filled with cherished memories.',
      said: '「手縫いのまくらで窒息させられるみたい」と例える。',
      mean: 'smother は口をふさいで息を止めること。愛されすぎを、襲われる場面にたとえている。',
      trap: 'pillow を本物の贈り物と取りやすいが、like があるので例え。動詞が怖い方を向く。',
      use: 'I’m drowning in work.（仕事に溺れそう）' },

    // R fix: “spent more” was weak (V2, blind ≈ 60 %); now “her gift will mean more”
    // why: taste ← “I've known her longer” usually means “I know her well”;
    //      mean more ← a longer friendship heard as a more meaningful gift
    { id: 'i1', skill: 'infer', level: 'B2', point: 'senior', seg: [31.4, 37.8],
      stem: 'When Ann says she has known Leslie longer, what is her point?',
      choices: ['Her claim to the gift should come first', 'She knows better what gift Leslie would like',
                'Her gift will mean more to Leslie than his'], a: 0,
      cue: '最後の so のあとの一語。',
      line: 'I have known her for longer. I have five years’ worth of anniversaries, so I have *seniority*.',
      said: '「私の方が長い付き合い。記念日5年分だから、私が先」と言う。',
      mean: 'seniority ＝ 年数による優先権。だから自分に先に買う権利がある、という主張。',
      trap: '長い付き合い＝よく知っている、と取りやすい。so のあとは「先の権利」の話。',
      use: 'I was here first.（私の方が先だったよ）' },

    // R fix: “ended early” was weak (V2, blind 50 %); now another bidder pushing the price up
    // why: price ← “somebody” heard, “swooped in” taken as outbidding by a lot;
    //      too late ← “last second” + “we've lost” sounds like their own slow bid
    { id: 'p1', skill: 'phrase', level: 'C1', point: 'swoop', reveals: ['lost'], seg: [37.6, 43.6],
      stem: 'When the auction news comes, what happened at the end?',
      choices: ['Another bidder grabbed it at the last moment', 'Another bidder pushed the price too high',
                'Their own bid came in a moment too late'], a: 0,
      cue: 'somebody のすぐあとの動詞。',
      line: 'Somebody *swooped in* at the last second…',
      said: '「最後の最後で誰かがさっと横取りした」と知らせる。',
      mean: 'swoop in は鳥が急降下するように、他人が突然現れて持っていくこと。',
      trap: 'last second だけを聞くと自分たちの遅れに思える。主語の somebody が誰の動きかを決める。',
      use: 'Someone swooped in and took the last seat.（誰かが最後の席をさっと取った）' },

    // why: admits ← “actually” often corrects the speaker, read as conceding;
    //      drops ← “I don't even have time” sounds like moving back to the auction
    { id: 'm1', skill: 'marker', level: 'B2', point: 'actually', reveals: ['bug'], seg: [48.45, 59.3],
      stem: 'After Ben says there’s no time to correct Ann, what does his next word signal?',
      choices: ['He’s changing his mind and will correct her', 'He’s admitting that she was right after all',
                'He’s dropping the topic to deal with the auction'], a: 0,
      cue: '「時間がない」の直後、文頭の一語とその後の長い説明。',
      line: 'I don’t even have time to tell you how wrong you are. *Actually*, it’s gonna bug me if I don’t.',
      said: '「どれだけ違うか言う時間もない。…いや、言わないと気になる」と言い、結局説明を始める。',
      mean: 'この actually は、自分の言ったことをすぐひっくり返す合図。',
      trap: 'actually を「実はあなたが正しい」と取りやすい。後ろに続く話の向きで判断する。',
      use: 'Actually, never mind. I’ll do it.（やっぱりいいや、自分でやる）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'bug', reveals: ['actually'], seg: [49.32, 53.4],
      stem: 'Type what he says: “Actually, it’s ___ if I don’t.” (3 words)', answer: 'gonna bug me',
      cue: 'it’s のあと、短く速い3語。',
      line: 'Actually, it’s *gonna bug me* if I don’t.',
      said: '「言わないと気になってしかたない」。going to が gonna に縮んでいる。',
      mean: 'bug ＝ 気にさせる、イライラさせる。虫が周りを飛ぶ感じ。',
      trap: 'gonna は「ガナ」と一つに聞こえる。bug の g も弱いので、me とつながりやすい。',
      use: 'It’s really bugging me.（それがずっと気になってる）' },

    // R fix: “stop talking so he can think” was weak (V2, blind 50 %); now “get to the point”
    // why: get to the point ← “say no more” read literally as “enough talk”;
    //      turn down ← “no” is the word that stands out, and “nope” follows
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'saynomore', seg: [62.4, 70.85],
      stem: 'When Ann asks for help, what does the man’s first reply do?',
      choices: ['Agrees before he has heard what she wants', 'Asks her to get to the point quickly',
                'Turns her down before she can finish'], a: 0,
      cue: '頼みのすぐあと、短い3語の返事。',
      line: 'I was wondering if you could help me out. — *Say no more.* Here’s a bunch of guns.',
      said: 'アンが助けを頼むと、男は「皆まで言うな」と言って、なぜか銃を出す。',
      mean: 'Say no more ＝ 何も言わなくていい、引き受けた。ここでは早合点が笑いになる。',
      trap: 'no が耳に残ると断りに聞こえる。文字通りでなく「話はわかった」という決まり文句。',
      use: 'Say no more. I’ll handle it.（言わなくていいよ、任せて）' },

    // R fix: “share it with everyone” was weak (V2, blind 50 %); now a weary reply to “help me out”
    // why: favors ← “You and everyone else” heard as a sigh at being asked for help;
    //      given up ← “everyone else” heard as people who are out of the race
    { id: 'i2', skill: 'infer', level: 'B2', point: 'everyone', seg: [70.0, 80.7],
      stem: 'What does the man’s reply to Ann’s offer suggest?',
      choices: ['Other people have asked to buy it, too', 'He’s tired of people asking him for favors',
                'Everyone else has given up on buying it'], a: 0,
      cue: '短い返事と、そのすぐあとに来る人。',
      line: 'I’d like to buy it. — *You and everyone else.*',
      said: '「買いたい」と言うと「君もみんなと同じだね」と返され、直後にベンが来る。',
      mean: '欲しがる人が他にもいるということ。ここから取り合いが始まる。',
      trap: 'ため息のような返事なので「頼みごとはもう嫌」に聞こえやすい。直前の buy it への返事。',
      use: 'You and everyone else.（みんなそう言うんだよ）' },

    // why: letter ← “mail” + “first time” with the roles swapped;
    //      last week ← “by next Wednesday” sounds like an ending date
    { id: 'd3', skill: 'detail', level: 'B1', point: 'mailday', seg: [86.6, 97.42],
      stem: 'Why does Roz need a present for Leslie?',
      choices: ['To mark the first time she delivered Leslie’s mail', 'To mark the day Leslie first sent her a letter',
                'To mark her last week of delivering Leslie’s mail'], a: 0,
      cue: '「next Wednesday」のあとの文。',
      line: 'It’s the anniversary of the *first time you delivered her mail*.',
      said: '配達員ロズは来週水曜までに贈り物が要る。初めてレスリーに郵便を届けた記念日だから。',
      mean: '配達員の記念日まであるほど、レスリーは記念日好き。',
      trap: 'mail と first time が聞こえても、誰が誰に届けたかで意味が変わる。主語を追う。',
      use: 'I need a gift by Friday.（金曜までにプレゼントが要るの）' },

    // R fix: “they correct her date” was weak and broke the parallel (V2/K5, blind 50 %); now “showing they know Leslie best”
    // why: moved ← finishing someone's story can sound warm;
    //      know her best ← the pair have been competing over who knows Leslie best
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'getit', reveals: ['mailday'], seg: [89.5, 97.42],
      stem: 'How do Ann and Ben react to Roz’s reason?',
      choices: ['They finish it for her, tired of hearing it', 'They finish it for her, moved by the story',
                'They finish it for her, showing they know Leslie best'], a: 0,
      cue: '最後の文は誰の視点？ you に注目。',
      line: 'It’s the anniversary of the first time *you* delivered her mail. — *Yeah, we get it.*',
      said: 'ロズの説明の続きを二人が「あなたが初めて届けた日でしょ」と言い、「はいはい」。',
      mean: '自分たちも同じ記念日だらけで、先が読めてうんざりしている。',
      trap: '話を引き取るのは共感のこともあるが、we get it は「もう十分」に近い。',
      use: 'Yeah, we get it.（はいはい、わかったって）' },

    // why: $615,000 ← fifty heard as fifteen (-ty/-teen); $650 / $6,500 ← “thousand” lost, or heard as one word
    { id: 'n1', skill: 'number', level: 'B1', point: 'start', seg: [98.4, 106.55],
      stem: 'What opening price is suggested for the bidding war?',
      choices: ['$650', '$6,500', '$615,000', '$650,000'], a: 3, keep: true,
      cue: 'start the bidding のあと、数字の最後まで。',
      line: 'Let’s start the bidding out at *$650,000*.',
      said: '質屋で「入札は65万ドルから」と言い、すぐ「100ドル」と返される。',
      mean: 'ありえない額をふざけて言っている。最後の thousand まで聞く。',
      trap: 'fifty と fifteen は混ざりやすい。-teen は後ろが強く、-ty は前が強い。',
      use: 'Let’s start the bidding at fifty.（50から入札を始めよう）' },

    // R fix: “a complaint about low bids” was weak (V2, blind ≈ 85 %); now a bottom price, the other offer-shaped move
    // why: last price ← the bids just went 100, 200, so a take-it-or-leave-it price fits;
    //      opinion ← “I'll tell you” read literally as about to give his view
    { id: 'r1', skill: 'predict', level: 'B2', point: 'tellwhat', seg: [107.0, 110.0], then: [110.0, 116.0],
      stem: 'Right after the man says “I’ll tell you what”, what kind of move comes next?',
      choices: ['An offer that comes with a condition', 'A last price that he won’t go below',
                'A frank opinion of the offers so far'], a: 0,
      cue: 'この前置きは、どんな話の前に使われる？',
      line: 'I’ll tell you what, Ann. *I’ll give it to you if you go on a date with me.*',
      said: '「じゃあこうしよう。デートしてくれたら譲るよ」と条件を出す。',
      mean: 'I’ll tell you what は提案の前置き。後ろに if 付きの申し出が来やすい。',
      trap: '値段の流れで最低価格を待ちやすいが、この前置きのあとは条件付きの取引が多い。',
      use: 'I’ll tell you what: you pay, I drive.（じゃあこうしよう、君が払って僕が運転）' },

    // R fix: “offended, about to turn him down” fell to common sense (V2, blind 50 %); now “torn, stalling for time”
    // why: acting ← the sitcom script where a reluctant yes hides real interest;
    //      stalling ← “I can't believe I'm about to do this” heard as hesitation with no answer yet
    { id: 'a3', skill: 'attitude', level: 'B2', point: 'onedate', reveals: ['tellwhat'], seg: [109.15, 116.45],
      stem: 'How does Ann sound as she answers the man’s offer?',
      choices: ['Unwilling, but going along with it', 'Pleased, but acting unwilling for show',
                'Torn, and stalling for time to think'], a: 0,
      cue: '「Oh, God」のあと、but で話がどちらへ向くか。',
      line: 'Oh, God. I can’t believe I’m about to do this. *But fine.* One date.',
      said: '「こんなことするなんて。でも、いいわ。1回だけ」と答える。',
      mean: '嫌だけれど贈り物のためにのむ。But fine が、渋々の承諾を示している。',
      trap: 'Oh, God や I can’t believe は迷いに聞こえる。but のあとが本当の答え。',
      use: 'Fine, but just this once.（いいよ、でも今回だけね）' },

    // why: giving ← “still want to go out?” heard as the deal going ahead;
    //      calling off ← “some money” heard as complaining about her offer
    { id: 'i3', skill: 'infer', level: 'C1', point: 'stillgo', reveals: ['tellwhat'], seg: [116.4, 124.5],
      stem: 'What does the man’s question to Ann at the end suggest?',
      choices: ['He sold the item elsewhere but still wants the date', 'He’s giving Ann the item, so the date is still on',
                'He’s calling off the date because her bid was low'], a: 0,
      cue: '「500」の直後と、still の入った質問。',
      line: 'Five hundred bucks. — Sold. … You *still* want to go out?',
      said: 'ロズの500ドルで売れたあと、男はアンに「それでもデートする？」と聞く。',
      mean: '品物はもう他人の物なのに、デートだけは期待している。図々しい。',
      trap: 'go out で約束が生きていると思いやすい。still は「状況が変わったのに」の合図。',
      use: 'Do you still want to come?（それでもまだ来たい？）' },

    // why: take turns ← the next line asks “whose holiday?”;
    //      go to the shop ← “going in” read literally as walking into a store
    { id: 'p2', skill: 'phrase', level: 'B2', point: 'goin', reveals: ['wouldyou'], seg: [134.85, 141.05],
      stem: 'What is being proposed right after “Good Lord”?',
      choices: ['Paying for the gift together and giving it as one', 'Taking turns giving the gift on each holiday',
                'Going to the shop together to ask for it back'], a: 0,
      cue: '「feel about」のあと、together まで。',
      line: 'How would you feel about *going in on* the waffle iron together?',
      said: '「一緒にお金を出さない？」と持ちかけ、相手は「本当に？いいね」。',
      mean: 'go in on ＋物 ＝ 費用を出し合って買う。プレゼントの割り勘でよく使う。',
      trap: 'go in を「中に入る」と取ると店に行く話になる。on のあとの物が手がかり。',
      use: 'Want to go in on a gift?（プレゼント、一緒に出さない？）' },

    // R fix: “did” was easy to rule out for a proposal (V2, blind ≈ 55 %); now “could”, the near sound of “would”
    // why: do ← “would” shrinks to a light “d” and is easy to drop; could ← “wudju” and “kudju” differ only in the first sound
    { id: 's1', skill: 'sound', level: 'B2', point: 'wouldyou', reveals: ['goin'], seg: [134.85, 139.05],
      stem: 'Fill the gap: “___ feel about going in on the waffle iron together?”',
      choices: ['How would you', 'How do you', 'How could you'], a: 0,
      cue: '「I’ve been thinking」のあと、how の直後の弱い音。',
      line: '*How would you* feel about going in on…',
      said: '一緒に出そうという提案。would you は「ウッジュ」。',
      mean: 'How would you feel about ～? は、やわらかい提案。',
      trap: 'would は弱く do に、w は could に聞こえやすい。提案なら would が定番。',
      use: 'How would you feel about a quick break?（ちょっと休憩するのはどう？）' },

    // R fix: “nothing in their place” was an absolute only a distractor had (V2/K6, blind ≈ 70 %); now cheaper gifts
    // why: joint gift ← “joint present” is said in the scene; cheaper ← “it's too much” heard as money
    { id: 'g2', skill: 'gist', level: 'B2', point: 'compromise', reveals: ['keepup'], seg: [174.0, 226.1],
      stem: 'In the last scene, what do Ann and Ben ask Leslie to accept?',
      choices: ['Fewer celebrations, grouped into a few set times', 'One joint gift a year instead of two separate ones',
                'Cheaper gifts, but on all the same holidays'], a: 0,
      cue: '「compromise」以降の流れ。',
      said: '「記念日が多すぎて追いつけない」と打ち明け、代わりの案を出す。',
      mean: '全部やめるのではなく、減らしてまとめる。最後はレスリーも案を足す。',
      trap: 'joint present や too much に引っ張られやすい。変わるのは贈り物でなく日の数。',
      use: 'We have a compromise.（妥協案があるんだ）' },

    // R fix: “moving for jobs” wasn't funny, so the stem ruled it out (V2, blind ≈ 70 %); now a funny wrong guess too
    // why: a couple ← “Ann and I wanted to tell you” is how a couple announces news;
    //      plays along ← Parks is a comedy, so a joking reply seems likely
    { id: 'h3', skill: 'humor', level: 'C1', point: 'dying', seg: [174.0, 185.25],
      stem: 'Why is Leslie’s first reaction to the news funny?',
      choices: ['She jumps to the worst reason they could have', 'She guesses they’re a couple now, and is thrilled',
                'She takes it as a joke and plays along with it'], a: 0,
      cue: '「Wait, what?」のあとの彼女の推測。',
      line: 'this is the last breakfast day and waffle day… — Wait, what? Oh, my God, *you’re both dying*.',
      said: '「記念日はこれで最後」と言われ、レスリーは「二人とも死ぬのね」と思い込む。',
      mean: '祝いをやめる理由を、いきなり一番大げさなものにしてしまう。思い入れの強さが笑い。',
      trap: '驚きの声を冗談と取りやすい。Wait, what? は本気で動揺した反応。',
      use: 'Wait, what? Are you serious?（え、待って。本気？）' },

    // R fix: the key was the only choice about her (V2, blind ≈ 55 %); the distractors now are keep track and “so good” as money
    // why: track ← “keep up” mixed up with “keep track”; afford ← “too much… so good at them” heard as pricey gifts
    { id: 'p3', skill: 'phrase', level: 'B2', point: 'keepup', seg: [184.62, 190.12],
      stem: 'When they explain why they want to stop, what is the problem?',
      choices: ['There are too many to match her effort', 'They can’t keep track of all the dates',
                'They can’t afford gifts as nice as hers'], a: 0,
      cue: '「just can’t」のあとと、especially の理由。',
      line: 'we just *can’t keep up with* all the anniversaries. It’s too much, especially ’cause you’re so good at them.',
      said: '「記念日が多すぎてついていけない。特に君が上手だから」と言う。',
      mean: 'keep up with ＝ 相手のペースについていく。量と熱量に負けている。',
      trap: 'keep track（把握する）と混ざりやすい。too much も金額でなく量の話。',
      use: 'I can’t keep up with you.（君のペースについていけないよ）' },

    // why: one day ← “one day” is said first; one month ← “Ann Month and Ben Month” is the last number she asks for
    { id: 'n3', skill: 'number', level: 'B1', point: 'week', seg: [195.5, 209.35],
      stem: 'In the end, how long will each friend’s celebration last?',
      choices: ['One day', 'One week', 'One month'], a: 1, keep: true,
      cue: 'レスリーの返しのあと、短い提案と「Fine」。',
      line: 'What about Ann Month and Ben Month? — How about *a week*? — Fine.',
      said: '二人は1日ずつと言い、レスリーは1か月と返す。最後に1週間で決まる。',
      mean: '値切り合いのように、間を取って落ち着く。Fine が決まったという合図。',
      trap: '最初の one day と最後に出た month が耳に残りやすい。決まるのは Fine の直前。',
      use: 'How about we meet halfway?（間を取ろうよ）' },

    // why: wanted a day ← “went in with a day” taken as their real goal; gave up more ← she got more than they offered
    { id: 'i5', skill: 'infer', level: 'C1', point: 'tactic', reveals: ['week'], seg: [203.25, 215.2],
      stem: 'What does the comment right after Leslie agrees show about the deal?',
      choices: ['A week was what they wanted all along', 'They gave up more than they had planned',
                'They had hoped to keep it to one day'], a: 0,
      cue: '「Fine」のあと、went in with と figuring。',
      line: 'We *went in with a day* figuring she’d counter with a month. We were *fine with a week*.',
      said: '「1日と言えば1か月と返すと読んでいた。1週間で十分」と話す。',
      mean: '低めに出して真ん中で決める作戦。狙いどおりに終わった。',
      trap: 'went in with a day を本当の希望と取りやすい。go in with は「最初にこう出る」。',
      use: 'Start low and meet in the middle.（低めに出して、間で決めよう）' },

    // why: three met ← “this week… friends” heard as how they all began;
    //      her ← “my two best friends” heard as her bond with each of them
    { id: 'd5', skill: 'detail', level: 'B1', point: 'friendweek', seg: [216.0, 226.1],
      stem: 'What will the third week celebrate?',
      choices: ['Her two best friends becoming close to each other', 'The week when the three of them first became friends',
                'Her becoming best friends with each of them'], a: 0,
      cue: '「the week that」のあと、最後まで。',
      line: 'the week that my two best friends became *each other’s* best friends.',
      said: 'レスリーは3つ目の週を足す。親友二人が、お互いの親友になった週の記念。',
      mean: '張り合っていた二人の協力を、レスリーがまた記念日にする。',
      trap: 'best friends が2回聞こえて、自分と二人の話に取りやすい。each other’s は二人の間。',
      use: 'They became each other’s best friends.（二人はお互いの親友になった）' },
  ]
};
