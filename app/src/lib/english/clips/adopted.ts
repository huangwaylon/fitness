// REVIEW 2026-11-17: pass 7, fix 17, drop 0, new 0; ear checks 1
// OPEN: "But kids are so intuitive" (149 s) and "See, intuitive" (155 s) are assumed Chandler's (r1's stem no
//   longer depends on it; n2's key does, loosely). Two ear checks removed: "I got nothing" and "He isn't?" are
//   settled by the turn and the words.
// “Chandler Tells a Kid That He Was Adopted | Friends” (the official Friends channel, Best of Season 10): Monica and
// Chandler visit Bill and Colleen, a couple who adopted, for advice; on his way to wash his hands Chandler tells their
// son Owen he's adopted, the couple try to flee, and Chandler gives it away again in front of the parents.
// Segments from the captions, words from whisper (2026-11-16). Named in the audio: Phoebe, Owen, Chandler, Bill,
// Colleen, Monica. The hosts are never told apart by name in a line, so items say "the host".
// Untested on purpose: 9–13 s ("malfunctioning wee-wees and hoo-hoos"), 40 s (Monica's "tiny" reaction), 80 s ("my
// father was a den mother": backstory), 112 s (captions "You know where Bill and Colleen are?", whisper "Who are Bill
// and Colleen?"), 190–197 s (who says "Monica told him"), 201–211 s (the triplets and Emma: backstory).
// EAR CHECK: 148.9 s r1 — the cut falls in the pause after "adopted yet", before "But kids are so intuitive"
import type { Clip } from '../types.ts';

export const chandlerAdopted: Clip = {
  id: 'adopted', video: 'PfrCZu1e0dU', title: 'Chandler Tells a Kid That He Was Adopted', dur: 223, wpm: 178,
  band: 'fast', tags: ['家', '友だち'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 75 %, the key was the only generic one); "thank Phoebe" → a pregnancy-tips near miss
    // why: meet a child ← "adopting" + "Owen" (named at 50 s) heard as a boy they're here to adopt; getting pregnant
    //   ← the "malfunctioning wee-wees" joke and "the same thing" heard as fertility trouble, missing "adopting"
    { id: 'g1', skill: 'gist', level: 'B1', point: 'visit', seg: [1, 31.5],
      stem: 'Why have Monica and Chandler come to see this couple?',
      choices: ['To get tips on adopting a child', 'To meet a boy who is up for adoption',
                'To get tips on getting pregnant'], a: 0,
      cue: '「We went through the same thing」のあと。',
      line: 'We went through the same thing when we were *adopting*. … we appreciate *anything you can tell us*.',
      said: '「養子を迎えたとき同じ経験をした」「何でも教えてもらえるとうれしい」。',
      mean: '養子縁組の先輩に話を聞きに来た。フィービーは紹介しただけ。',
      trap: '子どもができない冗談から妊娠の相談と取りやすい。same thing のあとの adopting を聞く。',
      use: 'Thanks so much for seeing us.（会ってくれて本当にありがとう）' },

    // R fix: K2/N1 — "you have a lovely home" is a guest's line, so "the host" in the stem was wrong and the tour
    //   distractor needed the host; V2 (blind 60 %): a flattery-before-a-request distractor replaces the tour
    // why: explain the joke ← "I mean" read literally as 言い換え; flatter before asking ← the Japanese frame of
    //   お世辞 before a request, since "we appreciate anything you can tell us" follows
    { id: 'pr1', skill: 'pragma', level: 'C1', point: 'lovelyhome', seg: [9.3, 22.2],
      stem: 'Why does the joke get followed by “I mean, you have a lovely home”?',
      choices: ['To change the subject after it falls flat', 'To explain what the joke was getting at',
                'To flatter the hosts before asking for help'], a: 0,
      cue: '冗談のあとの長い沈黙と、そのあとの話題。',
      line: 'So, a lot of malfunctioning … in this room, huh? … *I mean, you have a lovely home*.',
      said: '子どもができない者どうしだね、と冗談を言うが誰も笑わず、間のあと「素敵なお家ね」。',
      mean: 'すべった冗談をごまかす話題の切りかえ。言い直しではない。',
      trap: 'I mean を「つまり」、ほめ言葉を頼みの前置きと取りやすい。沈黙のあとは空気の立て直し。',
      use: 'Anyway, you have a lovely place.（それはそうと、素敵なお宅ですね）' },

    // why: by date ← an adoption takes months, so a timeline is the expected layout; by agency ← "forms in the back"
    //   heard as a list of offices
    { id: 'd1', skill: 'detail', level: 'B1', point: 'binder', seg: [27, 39.5],
      stem: 'How is the information in the hosts’ gift arranged?',
      choices: ['By category, with color codes', 'By date, in a long timeline', 'By agency, with its forms'], a: 0,
      cue: '「Everything is broken down into」のあと。',
      line: 'Everything is *broken down into categories* and then cross-referenced and then *color-coded*…',
      said: '項目別に分けられ、相互参照され、色分けまでしてあると感激している。',
      mean: 'break down into ～ ＝ ～に分ける。整理好きのモニカには最高の贈り物。',
      trap: 'forms（書類）が最後に聞こえ、役所別と取りやすい。動詞のすぐあとを拾う。',
      use: 'Let’s break it down into steps.（段階に分けて考えよう）' },

    // R fix: V2 (blind 65 %): "worth it" was the only cliché; a "gets easier" near miss shares "frustrating"
    // why: simple if organized ← the binder just shown suggests an easy route; gets easier ← "frustrating, but…" heard,
    //   the end of the turn lost
    { id: 'd2', skill: 'detail', level: 'B2', point: 'worth', seg: [46.2, 53],
      stem: 'What does the host say about going through the adoption process?',
      choices: ['It is frustrating, but well worth it', 'It is simple, if you stay organized',
                'It is frustrating, but it gets easier'], a: 0,
      cue: '「the process is」のあとの形容詞と、but のあと。',
      line: 'I know the process is *frustrating*, but it’s *so worth it*.',
      said: '「手続きはイライラするけど、本当にその価値がある。オーウェンは最高の出来事」。',
      mean: 'worth it ＝ 苦労してもやる価値がある。お金の話ではない。',
      trap: 'frustrating で先を予想しやすい。but の前は苦労、but のあとが言いたいこと。',
      use: 'Long trip, but so worth it.（長旅だったけど、行く価値はあった）' },

    // R fix: V2 (blind 60 %): the toilet distractor was weak; a "clean for the meal" near miss keeps the hands
    // why: find Owen ← "Owen" is the last name heard before he leaves; clean for the meal ← "wash my hands first"
    //   heard as before eating, the link to "Can I see the book?" missed
    { id: 'i1', skill: 'infer', level: 'B2', point: 'hands', seg: [53.8, 66],
      stem: 'Why is Chandler sent down the hall?',
      choices: ['So his hands are clean for the book', 'So he can go and say hello to Owen',
                'So his hands are clean for the meal'], a: 0,
      cue: '本を見たいと言ったあとの、彼自身の質問。',
      line: 'Can I see the book? — You want me to *wash my hands first*, don’t you? … *pretty and white*.',
      said: '本を見たいと言い「先に手を洗えってこと？」。「真っ白できれいだから」と返される。',
      mean: '白い本を汚されたくないので、手を洗いに行かされる。',
      trap: '手洗いは食事の前と思いやすい。直前の Can I see the book? とつなげて聞く。',
      use: 'Want me to take my shoes off?（靴、脱いだほうがいい？）' },

    // R fix: V2/K5 — the tag "don't you?" ruled out two choices by grammar; the tag is cut from the stem and "want
    //   to" (odd with "my hands") becomes "wanted me to"
    // why: wanted me to ← the t of want plus a weak "me" heard as -ed; won't let me ← the n of want heard as won't
    { id: 's1', skill: 'sound', level: 'B2', point: 'wantme', reveals: ['hands'], seg: [56.2, 59.4],
      stem: 'Fill the gap: “You ___ wash my hands first…”',
      choices: ['wanted me to', 'want me to', 'won’t let me'], a: 1,
      cue: '文の最初、You のあとの短いかたまり。',
      line: 'You *want me to* wash my hands first, don’t you?',
      said: '「先に手を洗ってほしいんでしょ？」と先回りして言う。',
      mean: 'want me to が「ワミトゥ」のようにつながる。want の t はほぼ消える。',
      trap: 't が弾むと wanted に聞こえやすい。過去形なら「ティッド」と1音増える。',
      use: 'Do you want me to come with you?（一緒に行こうか？）' },

    // R fix: V2 (blind 70 %): "tidy" keyed off show knowledge and the teasing distractor was weak; key reworded,
    //   an "envy of how Owen was raised" distractor replaces the teasing
    // why: an older child ← "adopt" taken literally on an adoption visit; envy of Owen's upbringing ← "adopt you"
    //   tied to "Adopting Owen was the best thing", heard as wanting that family life
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'adoptyou', seg: [59.8, 71],
      stem: 'When Monica asks the host “Can I adopt you?”, what is she expressing?',
      choices: ['Delight that the host thinks the way she does', 'A wish to adopt an older child someday',
                'Envy of the way the host has brought up Owen'], a: 0,
      cue: '直前の「私でもそう言った」とのつながり。',
      line: '*I would have told him to do it, too*. *Can I adopt you?*',
      said: '夫に手を洗わせた相手に「私もそうさせた。養子にしていい？」と言う。',
      mean: '同じきれい好きを見つけた喜び。養子の話題にかけて「家族になりたい」と言う。',
      trap: 'adopt を文字通りに取ると子どもの話になる。直前の「私もそうさせた」とつなげて聞く。',
      use: 'You’re my kind of person.（あなたとは気が合うね）' },

    // why: reading a map ← the expected Scout skill next to a compass; tying knots ← the Scout script, nothing heard
    { id: 'd3', skill: 'detail', level: 'B1', point: 'compass', seg: [83, 90.4],
      stem: 'What does Owen have a Scout badge for?',
      choices: ['Using a compass', 'Reading a map', 'Tying knots'], a: 0,
      cue: '「You know how to」のあと。答えは短い返事の中。',
      line: 'You know how to *use a compass*? — I have a *badge* in it.',
      said: '「コンパス使えるの？」と聞かれ、オーウェンが「それのバッジ持ってる」。',
      mean: 'badge ＝ スカウトで技能を身につけた印。in it の it はコンパスの使い方。',
      trap: 'コンパスと地図はセットで思い浮かびやすい。予想ではなく、聞こえた語で選ぶ。',
      use: 'I have a certificate in first aid.（応急手当の資格を持ってます）' },

    // R fix: V2 (blind 50 %): the key was the only kind choice; the three are now parallel no / yes / maybe
    // why: yes, later ← "I'd love to" taken as a yes (Japanese ぜひ); maybe, if parents agree ← "your parents" heard
    //   as "let's ask them first"
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'lovetobut', seg: [89.2, 95.2],
      stem: 'When Owen offers to show his badge, what does Chandler’s reply do?',
      choices: ['Says no, and gives a reason why', 'Says yes, but for a bit later on',
                'Says maybe, once his parents agree'], a: 0,
      cue: '最初の3語のあとに来る、短いつなぎ。',
      line: '*I’d love to, but* I got to get back to talking to your parents.',
      said: '「見たいけど、ご両親との話に戻らないと」と答える。',
      mean: 'I’d love to, but… は、感じよく断る決まった形。理由を添えて角を立てない。',
      trap: 'I’d love to だけ聞くと「ぜひ」で終わったように聞こえる。but のあとが本当の返事。',
      use: 'I’d love to, but I have plans tonight.（行きたいけど、今夜は予定があるんだ）' },

    // why: nothing to do with it ← "nothing" heard as a denial (関係ない); knows nothing ← "got nothing" read as
    //   "I have no information"
    { id: 'p1', skill: 'phrase', level: 'C1', point: 'gotnothing', seg: [102.5, 111],
      stem: 'After Owen’s question, what does Chandler’s short answer admit?',
      choices: ['He has no idea what to say now', 'He had nothing to do with it',
                'He knows nothing about the boy'], a: 0,
      cue: '長い沈黙のあとの、3語だけの返事。',
      line: 'I’m adopted? … *I got nothing*.',
      said: '「僕、養子なの？」と聞かれ、長い沈黙のあと「何も出てこない」。',
      mean: 'I got nothing ＝ 言うことも打つ手もない、お手上げ。くだけた言い方。',
      trap: 'nothing を「関係ない」「知らない」と取りやすい。返す言葉に詰まったときの決まり文句。',
      use: 'Any ideas? — Sorry, I got nothing.（何か案ある？―ごめん、全然）' },

    // R fix: V2 (blind 55 %): the key was the only negative choice; both distractors now start upset
    // why: accept the apology ← "I'm so sorry" heard as a make-up; still give advice ← "Still, he had to find out
    //   sometime" heard as the hosts calming down
    { id: 'g2', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['sign'], seg: [116.5, 198.6],
      stem: 'Where do things stand with the hosts by the end of the visit?',
      choices: ['They’re angry, and the visit ends in a rush', 'They’re upset, but they accept the apology',
                'They’re upset, but they still give advice'], a: 0,
      cue: '最後に友だちへ伝える、短い報告。',
      line: 'We just want to give you a heads-up. Bill and Colleen *hate us*.',
      said: '急いで帰ろうとしたが見つかり、最後は友だちに「ビルとコリーンに嫌われた」と報告する。',
      mean: '謝ってはみたが、言い訳になって許されなかった。訪問は大失敗。',
      trap: 'I’m so sorry が聞こえるので和解と取りやすい。そのあと何と言ったかまで聞く。',
      use: 'Long story short, it didn’t go well.（手短に言うと、うまくいかなかった）' },

    // R fix: V2 (blind 50 %): "feels sick" was weak; a near miss on the verb ("seen" vs "done") replaces it
    // why: seen something ← "bathroom" caught, the verb do lost; bad news about the hosts ← he's back from the
    //   house, so he might have found something out
    { id: 'i2', skill: 'infer', level: 'B2', point: 'bathroom', seg: [116.6, 122.3],
      stem: 'When Chandler says they must leave, what does Monica first assume?',
      choices: ['He has done something awful in the bathroom', 'He has seen something awful in the bathroom',
                'He has found out something bad about them'], a: 0,
      cue: '「Why?」のすぐあとの質問。',
      line: 'We have to leave. — Why? *What did you do in the bathroom?*',
      said: '「帰らなきゃ」に「なんで？トイレで何したの？」と返す。',
      mean: '理由を聞く前から、彼が何かやらかしたと決めつけている。夫婦の力関係も出ている。',
      trap: 'bathroom だけ拾うと何かを見たと取りやすい。動詞 do に注目すると決めつけが分かる。',
      use: 'What did you do this time?（今度は何やったの？）' },

    // anchor: 89.2–94 s "They're telling us all about how they adopted you" — a plain statement, not a slip of "a
    //   slight chance"; 159.8 s Owen confirms "He told me"
    // R fix: V2 (blind 75 %, its one rewrite): the key's "with no doubt" mirrored the hedge; reworded, and the
    //   doubt distractor became "only hinted"
    // why: only hinted ← the hedge taken as real doubt (かもしれない), so Owen must have guessed; Owen brought it up
    //   ← "bumped into Owen" heard as Owen starting the talk
    { id: 'n1', skill: 'attitude', level: 'C2', point: 'slightchance', seg: [123, 130.4],
      stem: 'When Chandler mentions “a slight chance”, what is he trying not to say?',
      choices: ['That he said it to Owen in plain words', 'That he only hinted, and Owen guessed the rest',
                'That Owen was the one who brought it up'], a: 0,
      cue: '控えめな言い方と、さっき実際に言ったこと。',
      line: 'there’s *a slight chance I may have told him*.',
      said: 'トイレに行く途中でオーウェンに会い「養子だと話しちゃった可能性が少しある」。',
      mean: 'さっき本人にはっきり言った。可能性ではなく事実を、ぼかして小さく見せている。',
      trap: 'may have を本当の迷いと取りやすい。控えめな語が並んだら隠し事を疑う。',
      use: 'I may have eaten your leftovers.（君の残り物、食べちゃったかも）' },

    // R fix: V2 (blind 65 %): "just go" was the only rushed choice; now all three are about what to take
    // why: purse, not binder ← the purse question heard as the decision and "binder" lost; leave both ← "No, you
    //   know what?" heard as giving up on everything
    { id: 'm1', skill: 'marker', level: 'B2', point: 'purse', seg: [131, 135.8],
      stem: 'Right after asking where her purse is, what does Monica decide?',
      choices: ['To leave her purse but take the binder', 'To take her purse but leave the binder',
                'To leave both behind and just get out'], a: 0,
      cue: '質問のすぐあと、「No」で始まる短い一言。',
      line: 'where’s my purse? *No, you know what?* I can *replace everything in there*.',
      said: '「バッグどこ？いや、中身は全部買い直せる。バインダーを持って行くよ」。',
      mean: '「やっぱりやめた」と考えを変える合図。バッグは捨てても本は持っていく。',
      trap: 'No を相手への否定と取りやすい。自分の言葉を打ち消す No もある。',
      use: 'No, you know what? Let’s just go.（いや、やっぱりもう行こう）' },

    // why: skip if they dislike sour ← "don't have to" read literally as permission; take some home ← snacks for
    //   guests heard as a gift
    { id: 'pr3', skill: 'pragma', level: 'B2', point: 'worms', seg: [137.2, 143.4],
      stem: 'What does the host really mean about the sour worms?',
      choices: ['Please leave them; they are for Owen', 'Skip them if sour things aren’t your taste',
                'Feel free to take some of them home'], a: 0,
      cue: '「you don’t have to」と、そのすぐあとの理由。',
      line: '*you don’t have to eat* the sour worms. *Those are for Owen*.',
      said: '「お菓子どうぞ。すっぱいグミは食べなくていいの。オーウェンの分」。',
      mean: 'don’t have to は「食べないで」をやわらかく言う形。理由がすぐあとに続く。',
      trap: '文字通り「無理しなくていい」と取ると気づかいに聞こえる。理由で意図が分かる。',
      use: 'You don’t have to sit there. That’s saved.（そこは座らなくていいよ、取ってある席なんだ）' },

    // R fix: V2 (blind 55 %) and who: the stem named Chandler, which no source settles; it now asks what comes
    //   next, and a natural "when will you tell him?" replaces the promise
    // why: confession ← Chandler has just told Monica, so owning up is the honest script; when will you tell him ←
    //   the usual polite follow-up to "we haven't told him yet"
    { id: 'r1', skill: 'predict', level: 'B2', point: 'intuitive', reveals: ['haventtold'], seg: [143.4, 148.9],
      then: [148.9, 157],
      stem: 'After the host’s warning about Owen, what kind of reply comes next?',
      choices: ['A hint that the boy may already know', 'A full confession of what has been done',
                'A question about when they’ll tell him'], a: 0,
      cue: '言ってしまった人なら、何と返したくなる？',
      line: 'we haven’t told him he’s adopted yet. — *But kids are so intuitive*.',
      said: '「まだ養子だと話していない」と言われ、「でも子どもは勘がいいから、もう分かってるかも」。',
      mean: '自分の失敗を、子どもの勘のせいにする前置き。白状する代わりの逃げ道。',
      trap: '正直に謝る流れを予想しやすいが、この場面の彼は先に言い訳を用意している。',
      use: 'Kids pick up on everything.（子どもは何でも気づくよ）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'haventtold', seg: [144.4, 148.6],
      stem: 'Type what the host says: “we ___ he’s adopted yet.” (3 words)', answer: "haven't told him",
      cue: '「you should know」のあと。',
      line: 'you should know we *haven’t told him* he’s adopted yet.',
      said: '「あの子にはまだ養子だと話していないの」。',
      mean: 'まだ伝えていない。yet と組んで「これから話すつもり」。',
      trap: 't はほぼ消え、told him は「トウルディム」とつながる。have との差は「ン」。',
      use: 'I haven’t told anyone yet.（まだ誰にも言ってないんだ）' },

    // anchor: 159.8 s "He told me." — the boy knew because Chandler told him, which turns "See, intuitive" back on the
    //   man saying it
    // why: Owen ← he's the one asking the naive question; the parents ← they believed he didn't know, and "kids are
    //   so intuitive" sounds aimed at them
    { id: 'n2', skill: 'humor', level: 'C2', point: 'intuitive', seg: [149, 161],
      stem: 'In “See, intuitive”, who is the joke on?',
      choices: ['Chandler: the excuse gives his own secret away', 'Owen: he is slow to work out what he heard',
                'The parents: they were wrong about what he knew'], a: 0,
      cue: '直後の「He told me」まで聞く。',
      line: 'Don’t you think on some level he already knows? — I’m adopted? — *See, intuitive*. … *He told me*.',
      said: '「子どもは勘がいい」の直後に「僕、養子？」。「ほらね」と言うが「この人に聞いた」とばれる。',
      mean: '勘が働いたのではなく、彼が話したから知っている。言い訳が自分の首をしめる形。',
      trap: '両親への反論に聞こえるが、直後の一言で笑われているのは本人だと分かる。',
      use: 'See? I told you so.（ほらね、言ったでしょ）' },

    // why: $15 ← -teen/-ty: "fifty" heard as "fifteen"; $500 ← "fifty" with a lost "hundred" imagined after it
    { id: 'c1', skill: 'number', level: 'B1', point: 'paid', seg: [158.4, 165.6],
      stem: 'How much did Chandler pay Owen to keep quiet?',
      choices: ['$15', '$50', '$500'], a: 1, keep: true,
      cue: '「he paid me」のあとの金額。強く読まれる場所。',
      line: 'And he *paid me $50* not to tell.',
      said: '「あの人に聞いた。それに、言わないようにって50ドルくれた」。',
      mean: 'fifty は最初の「フィ」が強い。fifteen なら後ろの「ティーン」が強く長い。',
      trap: '-teen と -ty は聞き分けにくい。数字のどこが強いか、最後が長いかで判断する。',
      use: 'I’ll pay you ten bucks to do it.（10ドル払うからやって）' },

    // R fix: V2 (blind 55 %): "paid too early" was weak; a wrong-target "Chandler told" replaces it, the key names
    //   who broke the deal
    // why: give it to the parents ← "give back" heard as returning it to the family; Chandler told ← "told" from
    //   "He told me" attached to the wrong deal (Chandler telling Owen wasn't what the $50 was for)
    { id: 'i3', skill: 'infer', level: 'C1', point: 'giveback', reveals: ['paid'], seg: [162.4, 169.4],
      stem: 'What is the reasoning behind “Which technically now you should give back”?',
      choices: ['Owen has told, so he broke the deal', 'The money should go back to his parents',
                'Chandler told, so the deal is now off'], a: 0,
      cue: '「not to tell」と「now」のつながり。',
      line: 'he paid me $50 *not to tell*. — Which *technically now* you should *give back*.',
      said: '「言わない約束で50ドルもらった」に、「じゃあ厳密には、今それ返すべきだよね」。',
      mean: '口止め料なのに、もう秘密を話してしまった。だから取引は無効、という理屈。',
      trap: 'give back を「元の家族に返す」と取りやすい。誰が言わない約束かを追う。',
      use: 'Technically, you still owe me.（厳密に言えば、まだ貸しがあるよね）' },

    // R fix: V2 (blind 55 %): "blaming" was the only odd move; a wrong-target "blaming Owen" joins it
    // why: blaming Owen ← "Owen doesn't know he's adopted" right after "but" heard as the boy being at fault; make it
    //   up ← an apology often ends in a promise
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'sign', seg: [174, 180.5],
      stem: 'How does Chandler’s apology to the parents turn?',
      choices: ['It turns into blaming them for what happened', 'It turns into blaming Owen for asking',
                'It turns into a promise to make it up to them'], a: 0,
      cue: '「I’m so sorry」のあとの、短いつなぎ。',
      line: 'I’m so sorry, *but you should have a sign* out there or something…',
      said: '「本当にごめん。でも看板か何か出しておくべきだよ」。',
      mean: 'but のあとで「そっちが悪い」と責任を相手に返している。謝罪になっていない謝罪。',
      trap: '謝る言葉が先に来ると、償いの話が続くと思いやすい。but のあとに本音が来る。',
      use: 'Sorry, but nobody told me.（ごめん、でも誰も教えてくれなかったんだ）' },

    // anchor: 145–148 s "we haven't told him he's adopted yet" against 177–180 s "whisper it to people when they come
    //   in the door": the advice is to tell everyone except Owen
    // R fix: V2 (blind 60 %): the key was the only absurd choice; the "tell Owen" distractor now uses the sign too
    // why: a sign for Owen ← "a sign out there" heard as a gentle way to tell the boy; keep visitors away ← "a sign
    //   out there" read as a "no visitors" sign
    { id: 'n3', skill: 'humor', level: 'C2', point: 'sign', seg: [174, 186],
      stem: 'Taken as serious advice, what is Chandler telling the parents to do?',
      choices: ['Let every visitor in on Owen’s secret', 'Put up a sign so Owen finds out gently',
                'Keep visitors away until Owen is told'], a: 0,
      cue: '誰に、いつ、何を伝えろと言っているか。',
      line: 'you should have *a sign out there* … or at least *whisper it to people* when they come in the door.',
      said: '謝ったあと「外に看板を出すか、来た人に入口でささやくべき」と言う。',
      mean: '本気なら「本人以外の全員に秘密を知らせろ」。秘密の守り方としてありえない理屈。',
      trap: 'you should を常識的な助言と取ると「本人に話せ」に聞こえる。誰にささやくかを聞く。',
      use: 'Maybe put up a sign or something?（看板でも出しといたら？）', retired: true },

    // R fix: V2 (blind 80 %): "joking" was weak; a wrong-target "the host" replaces it, and the segment now starts
    //   at "whisper it to people" so the sentence shows whose example the Santa line is
    // why: the host ← "Owen doesn't know…" heard as a parent's line, missing that it's Chandler's sample whisper;
    //   Owen guessed both ← "intuitive" from earlier carried over
    { id: 'h1', skill: 'humor', level: 'C1', point: 'santa', reveals: ['sign'], seg: [176.5, 186],
      stem: 'Why does the audience laugh at the reply “He isn’t?”',
      choices: ['Chandler has just given away a second secret', 'The host has just given away a second secret',
                'Owen had already guessed both of the secrets'], a: 0,
      cue: '「whisper it to people」から続く例の一文。',
      line: 'Owen doesn’t know he’s adopted *and he also thinks Santa is real*. — *He isn’t?*',
      said: '「養子と知らないし、サンタも信じてる」と言った瞬間「いないの？」。',
      mean: '言い訳のつもりで、本人の前でもう一つの秘密までばらした。同じ失敗の2回目。',
      trap: '親のせりふと取りやすいが、ささやく文の例として続けている。直前の一文が何をばらしたかを聞く。',
      use: 'Oops. Forget I said that.（おっと、今のは忘れて）' },

    // R fix: V2 (blind 55 %): "say sorry" was weak; a "keep it quiet" request replaces it
    // why: ask advice ← a visit to friends after trouble is the usual "what do we do" script; keep it quiet ←
    //   "just want to" heard as the start of a favour
    { id: 'p2', skill: 'phrase', level: 'B1', point: 'headsup', reveals: ['outcome'], seg: [190.4, 195],
      stem: 'Why does the couple say they are telling their friends this?',
      choices: ['To let them know ahead of time', 'To ask them what they should do',
                'To ask them to keep it quiet'], a: 0,
      cue: '「We just want to give you」のあと。',
      line: 'We just want to give you *a heads-up*. Bill and Colleen hate us.',
      said: '「先に知らせておきたくて。ビルとコリーンに嫌われた」。',
      mean: 'heads-up ＝ 前もっての知らせ、注意。後で別の人から聞く前に、という気持ち。',
      trap: '友だちに打ち明けるのは相談、と思いやすい。heads-up は「知らせ」で、頼みごとではない。',
      use: 'Just a heads-up, the store closes early today.（念のため、今日は店が早く閉まるよ）' }
  ]
};
