// “Rent-A-Swag: Origin Story | Parks and Recreation” (the official Parks and Recreation channel, Season 5): Tom opens
// a clothes-rental store for teens and runs it on a painfully tight budget, until a friend at breakfast tells him he
// needs a little of his old swagger, and the friends chip in money for the store.
// Segments from the captions, words from whisper (2026-11-16). Untested: 18–19 s ("thought to buy" in both, likely
// "don't have to"), 43 s ("fiscal" vs "physical"), 55–58 s and 79–82 s (visual gags), 91–94 s (a hustling joke),
// 104–108 s (the phlegm and mannequin lines), 128–136 s ("topic" in both; "Does/Did someone… own stock"), 160–161 s
// and 176–178 s (whisper and captions disagree), 216–220 s (who says "public offering"), 245–252 s (the shoe shelf),
// 261 s (a name only world knowledge explains).
// REVIEW 2026-11-16: pass 6, fix 17, drop 1, new 1; ear checks 2
//   Open: who orders “Eight strips of bacon, uncooked, in a sealed package” (222 s)? Tom or Ron; nt2 was dropped on it.
// EAR CHECK: 182.6 s r1 — the cut falls after “and that’s great”, before “but you’re gonna need…” (183.0 s)
// EAR CHECK: 77.2 s h1 — Jerry: whisper “the rehab is grueling”, captions “the rehab is great”; h1's key needs “grueling”
import type { Clip } from '../types.ts';

export const rentASwag: Clip = {
  id: 'rentaswag', video: 'RYdSvdgl-FY', title: 'Rent-A-Swag: Origin Story', dur: 284, wpm: 169, band: 'mid',
  tags: ['職場', '店・レストラン'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 80 %: the title says rent, and only the key was a sensible renter). All three now rent, so
    //   the who and the direction carry it.
    // why: parents ← "their parents" is said, so they sound like the customers; rent out ← "grow out of" heard as the
    //   teens' own outgrown clothes, which fits "Rent-A-Swag" too
    { id: 'g1', skill: 'gist', level: 'B1', point: 'teens', seg: [11.1, 29.2],
      stem: 'In his talk to the camera, who is Tom’s new business meant for?',
      choices: ['Teens who rent his clothes, so parents needn’t buy', 'Parents who rent his fancy clothes for their own use',
                'Teens who rent out clothes they have grown out of'], a: 0,
      cue: '「I started a business」のあと、誰に貸すか。',
      line: 'I *rent my fancy clothes to teens*… nice things they’ll just *grow out of*.',
      said: 'ぜいたくな服を10代に貸す商売を始めた。すぐ着られなくなる服を、親が買わずに済む。',
      mean: 'rent ＝ お金を取って貸す。お客は10代の子で、買わずに借りて着る。',
      trap: 'parents が聞こえると親が客に思えるが、親は「買わずに済む」側。',
      use: 'Can I rent a suit for the weekend?（週末にスーツを借りられますか）' },

    // R fix: V2 (blind 75 %: the key was the only two-step move). The help distractor is two-step now too, and the
    //   weak "poor choice" is replaced by brushing the remark off.
    // why: help fix ← the Japanese frame: a concession, then "work" heard as a request to the people there; brush off
    //   ← the remark is about animals, and "Look," can open a dismissal
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'needswork', seg: [29.15, 38.7],
      stem: 'When Tom answers the remark about the store with “Look,…”, what is he doing?',
      choices: ['Granting a weak point, then arguing for the place', 'Granting a weak point, then asking them for help',
                'Brushing off the remark as a joke about animals'], a: 0,
      cue: '「Look,」のあと、but の前と後。',
      line: 'Look, the place *needs some work, but* this is a *great location*.',
      said: '「手を入れる必要はあるけど、場所は最高なんだ」と言う。',
      mean: '弱点を先に認めてから、but のあとで言いたい良さを出す。反論の型。',
      trap: '認める部分だけ聞くと降参に思える。英語では but のあとに本音が来る。',
      use: 'It needs some work, but it’s cheap.（手直しは要るけど安いよ）' },

    // R fix: V2 (blind 50 %: "a big lot" was a filler). Now cars/people × free/meters, with the key not the majority
    //   pick on both halves.
    // why: cars ← "traffic" heard as cars; meters ← "metered" is said, but the "no" before it is short and weak
    { id: 'd1', skill: 'detail', level: 'B1', point: 'location', reveals: ['needswork'], seg: [35.0, 41.2],
      stem: 'When Tom defends the location, what are his first two selling points?',
      choices: ['Many people walk by, and parking is free', 'Many cars pass by, and parking is free',
                'Many cars pass by, and it has parking meters'], a: 0,
      cue: '「great location」のあと、並ぶ2つの点。',
      line: 'Lots of *foot traffic*, *no metered parking*…',
      said: '「人通りが多いし、メーター式の駐車場じゃない」と言う。',
      mean: 'foot traffic ＝ 歩く人の流れ。no metered parking ＝ 駐車が無料。',
      trap: 'traffic を車と取りやすいが、foot が付くと歩く人。no も弱く短い。',
      use: 'This street gets a lot of foot traffic.（この通りは人通りが多い）' },

    // R fix: V2 (blind 65 %: the fame distractor was off topic). It now misses the old self, "dead" heard as a loss.
    // why: misses ← "is dead" heard as mourning, with "Long live" lost; Thomas ← the two names taken literally, as a
    //   request about what to call him
    { id: 'i1', skill: 'infer', level: 'B2', point: 'reinvent', seg: [49.6, 55.0],
      stem: 'In his talk to the camera about two names, what is Tom saying?',
      choices: ['He has left his flashy old self behind', 'He misses the flashy self he used to be',
                'He wants people to call him Thomas now'], a: 0,
      cue: '「is dead」と「Long live」、2つの名前の差。',
      line: '*Tommy Timberlake is dead*. *Long live* Thomas M. Haverford, *responsible tycoon*.',
      said: '「トミー・ティンバーレイクは死んだ。責任ある実業家トーマス万歳」と言う。',
      mean: '昔の派手な自分を終わらせ、まじめな経営者に生まれ変わったという宣言。',
      trap: '名前の話に聞こえるが、呼び方の注文ではない。responsible が新しい自分の中身。',
      use: 'The old me is gone.（昔の自分はもういない）' },

    // R fix: V2 (blind 55 %: the running joke was a filler). New near miss: a habit from a boss, as "Lee Iacocca"
    //   sounds like a person he knew if "autobiography" is lost.
    // why: sees their work ← "Wow, genuine praise" taken as proof he means it (sincerity at face value); a boss ←
    //   "picked up from Lee Iacocca's…" with the last word lost: the right mechanism, the wrong source
    // anchor: 58.6–66.3 s the praise round and "Wow, genuine praise"; then to camera 67.0–73.1 s "It's a tip I
    //   picked up from… autobiography. A small connection… helps build loyalty."
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'praise', seg: [58.1, 73.2],
      stem: 'After Tom’s comment to the camera, how should we hear his praise?',
      choices: ['As a method he read about for keeping staff loyal', 'As a sign he finally sees how hard they all work',
                'As a habit he picked up from a boss he once had'], a: 0,
      cue: 'ほめたあと、カメラに向かって話す理由。',
      line: 'Ann, great organizational skills. … It’s a *tip I picked up* from… *autobiography*. A small connection… *helps build loyalty*.',
      said: '部下を一人ずつほめたあと、カメラに「経営者の自伝で覚えたコツ。ちょっとしたつながりが忠誠心を育てる」と話す。',
      mean: 'カメラへの一言が場面を書きかえる。心からに見えたほめ方は、本で読んだ手法の実践。',
      trap: '「本物のほめ言葉ね」の反応で本心と思いやすい。この形式では、カメラへの一言が答え合わせ。',
      use: 'I read it in a management book.（経営の本で読んだんだ）' },

    // why: watch ← a ticker literally ticks, like a clock; work ← the praise round just before was about everyone's
    //   work
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'ticker', seg: [73.1, 79.3],
      stem: 'When Tom turns to Jerry, what does he ask about?',
      choices: ['His heart', 'His watch', 'His work'], a: 0,
      cue: 'Jerry への質問と、その答えに出る語。',
      line: 'Jerry, how’s *the old ticker*? — Oh, uh, well, *the rehab* is grueling.',
      said: '「心臓の調子はどう？」と聞かれ、「リハビリがきつくて」と答える。',
      mean: 'the old ticker ＝ 心臓のくだけた言い方。時計のようにカチカチ打つから。',
      trap: 'ticker を時計と取りやすい。答えの rehab が体の話だと教えてくれる。',
      use: 'How’s the old back doing?（腰の調子はどう？）' },

    // R fix: V2 (blind 55 %: the rude-word distractor was weak). New near sound: the captions themselves hear "the
    //   rehab is great", so "good news" is the partial listener's reading. On the ear-check list for that reason.
    // why: stops him ← "Great" comes fast on the heels of Jerry's answer; cheers ← "grueling" heard as "great"
    // retired: the ear-check policy: the key needs “grueling” (whisper; the captions have “great”, 77.2 s); back after
    //   the ear check
    { id: 'h1', skill: 'humor', level: 'C1', point: 'ticker', seg: [73.1, 79.3], retired: true,
      stem: 'Why does Tom’s reply to Jerry get a laugh?',
      choices: ['He replies to bad news as if it were good', 'He stops Jerry before he can finish his answer',
                'He cheers Jerry’s good news far too loudly'], a: 0,
      cue: 'Jerry の答えの中身と、それへの返事。',
      line: 'the rehab is *grueling*. — *Great. Glad to hear it.*',
      said: 'リハビリが「きつい」と言うジェリーに、「よかった、何より」と返す。',
      mean: '悪い知らせに喜ぶ返事。つながりを作るはずが、答えを聞いていないのがばれる。',
      trap: 'grueling を great と聞くと、良い知らせへの返事に思える。rehab の次の語を聞く。',
      use: 'Sorry, I wasn’t really listening.（ごめん、ちゃんと聞いてなかった）' },

    // why: praises ← "important… achieved it" sounds like approval, as Tom himself takes it; new goal ← "goal" is
    //   said, but about what they already did
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'dodge', seg: [108.55, 115.15],
      stem: 'When Tom asks for opinions, what does the reply about a goal do?',
      choices: ['Avoids giving an opinion of the store', 'Praises the store’s new look for the team',
                'Sets the team a new goal for next month'], a: 0,
      cue: 'Tom の「So you like…?」の前の答え方。',
      line: 'I think *what’s important is* we all had a goal… — So you like the place? — *Oh, no.*',
      said: '店の感想に「大事なのは、みんなで目標を達成したこと」と答え、念を押されると「ひどい」。',
      mean: '感想の代わりに別の良い点を言う、答えをかわす言い方。',
      trap: 'important や achieved は前向きで、ほめ言葉に聞こえる。聞かれた事に答えているか。',
      use: 'What matters is we tried.（大事なのは、やってみたことだよ）' },

    // why: $14 ← "forty" heard as "fourteen"; $40 ← the "six" lost before "under"; $60 ← only "six" caught
    { id: 'n1', skill: 'number', level: 'B1', point: 'budget', seg: [113.4, 119.6],
      stem: 'How far under budget does Tom say he is?',
      choices: ['$14', '$40', '$46', '$60'], a: 2, keep: true,
      cue: '「the best I can do」のあと、under の前。',
      line: 'and I’m *$46 under budget*.',
      said: '「今はこれが精一杯。しかも予算より46ドル安く済んだ」と言う。',
      mean: 'under budget ＝ 予算より安く済んだ。節約の自慢。',
      trap: 'forty の -ty は短く弱い。fourteen なら後ろの「ティーン」が長く強い。six まで聞いて一つの数。',
      use: 'We came in under budget.（予算内で済みました）' },

    // R fix: V2 (blind 70 %: "to a silly degree" made the key the only comic choice). All three are plain now.
    // why: out of money ← "the best I can do for now" heard as being broke; not earned ← one small pizza heard as a
    //   verdict on their work
    { id: 'i4', skill: 'infer', level: 'B2', point: 'cheap', reveals: ['budget'], seg: [113.4, 128.1],
      stem: 'What does Tom’s treat for the team show about him now?',
      choices: ['He still counts every dollar, even on a treat', 'He has used up most of his budget on the store',
                'He doesn’t think the team has earned much yet'], a: 0,
      cue: '「Pizza party!」のあと、量と中身。',
      line: 'a small treat for you guys for all your hard work… *One small pizza for all of us, with no toppings*.',
      said: '「頑張ったごほうびにピザパーティー！」と言うが、全員で小さいピザ1枚、具なし。',
      mean: 'ごほうびと言いながら最小限。節約しすぎて、ごほうびの意味がなくなっている。',
      trap: 'お金はある。直前に、予算が46ドル余ったと自慢している。小ささは節約のしすぎ。',
      use: 'Drinks are on me tonight.（今夜の飲み物はおごるよ）' },

    // why: $5 ← "nine" and "five" share the vowel; $19 ← heard as "nineteen"; $90 ← "nine dollars" run together
    //   and heard as "ninety"
    { id: 'n2', skill: 'number', level: 'B1', point: 'missing', seg: [142.85, 147.5],
      stem: 'How much money does Tom say is missing?',
      choices: ['$5', '$9', '$19', '$90'], a: 1, keep: true,
      cue: '「going over the books」のあと、missing のあと。',
      line: 'I’ve been going over the books, and I’m *missing $9*.',
      said: '「帳簿を見直したら、9ドル足りない」とみんなの前で言う。',
      mean: 'go over the books ＝ 帳簿を確かめる。足りないのは、たった9ドル。',
      trap: 'nineteen なら「ティーン」が長く強い。nine dollars は -ty には聞こえない。',
      use: 'I went over the numbers again.（数字をもう一度確かめた）' },

    // R fix: V2 (blind 70 %: "I'm not angry at whoever…" is a set phrase, and it was the only negative). A second
    //   negative, told apart by one weak word, splits the cliché.
    // why: I'm angry ← the t of "not" all but vanishes before "angry"; so angry ← a short word is heard there, and the
    //   lawsuit that follows makes anger plausible; not that ← the set phrase plus a filler word imagined
    { id: 's1', skill: 'sound', level: 'B2', point: 'lawsuit', seg: [147.45, 150.75],
      stem: 'Fill the gap: “Now, ___ at whoever took it.”',
      choices: ['I’m not angry', 'I’m angry', 'I’m so angry', 'I’m not that angry'], a: 0,
      cue: '「Now,」のあと、angry の前の短い音。',
      line: 'Now, *I’m not angry* at whoever took it. Just come forward.',
      said: '「取った人に怒ってはいない。名乗り出てくれ」と言う。',
      mean: 'not は短く、t はほぼ消えるが「ナ」は残る。このあと「訴える」と続くのが笑い。',
      trap: 'angry だけ強く聞こえ、否定を落としやすい。I’m のあとの短い「ナッ」を聞く。',
      use: 'I’m not mad, just disappointed.（怒ってないよ、がっかりしただけ）' },

    // why: fired ← the boss script (a thief gets fired), with "move on with our lives" heard as letting the person go;
    //   whole team ← "whoever" said to a room full of staff
    { id: 'h4', skill: 'humor', level: 'C1', point: 'lawsuit', reveals: ['missing'], seg: [147.45, 154.95],
      stem: 'Why does Tom’s speech about the missing money get a laugh?',
      choices: ['His “no hard feelings” offer ends with a lawsuit', 'His calm offer ends with firing the person',
                'He blames the whole team before he knows who did it'], a: 0,
      cue: '「Just come forward.」のあと、何が待っているか。',
      line: 'I’m not angry at whoever took it… *You’ll be served with a lawsuit*, and we will *move on with our lives*.',
      said: '「怒ってない、名乗り出て」と言い、「訴状を受け取ってもらって、水に流そう」と続ける。',
      mean: '許すような前置きと、数ドルで訴えるという中身のずれが笑い。',
      trap: 'クビではない。served with a lawsuit ＝ 訴えられる。前置きのあとを聞く。',
      use: 'No hard feelings. Let’s move on.（恨みっこなし。前に進もう）' },

    // R fix: V2 (blind 50 %: "each" was the only choice without a reason). All three give one now.
    // why: each ← the usual script for two friends going to breakfast; Tom ← "You're driving" heard as a trade
    //   (you drive, I pay)
    { id: 'd5', skill: 'detail', level: 'B1', point: 'pays', seg: [154.95, 160.35],
      stem: 'When his friend suggests breakfast, who does Tom say will pay?',
      choices: ['His friend, since the idea was his', 'Each of them, since money is tight', 'Tom, since his friend is driving'],
      a: 0,
      cue: '「Fine.」のあと、Tom の最初の一文。',
      line: 'It was *your idea, so you’re paying*. You’re driving.',
      said: '「君の提案なんだから、君のおごり。運転も君ね」と言う。',
      mean: '誘いは受けるが、お金は一切出さないという宣言。今の Tom の節約ぶり。',
      trap: 'driving を交換条件と取ると、Tom が払うように聞こえる。you’re paying の you を聞く。',
      use: 'Your idea, so you’re buying.（言い出したのは君だから、君のおごりね）' },

    // R fix: S1 + V2 (blind 65 %). The stem gave away "uncooked/untoasted"; it now names the moment. The weak
    //   trust distractor is replaced by the big-meal reading of a listener who misses "uncooked… untoasted".
    // why: huge meal ← "12 eggs… 20 slices" heard without "uncooked/untoasted", on a friend's bill; misread ← the
    //   waiter's question heard as correcting a simple ordering mistake
    { id: 'i5', skill: 'infer', level: 'C1', point: 'groceries', reveals: ['pays'], seg: [163.6, 176.4],
      stem: 'Why does Tom add the eggs and bread to his breakfast order?',
      choices: ['To take food home on his friend’s bill', 'To eat a huge meal on his friend’s bill',
                'Because he misread what the breakfast includes'], a: 0,
      cue: '店員の聞き返しと、「in a bag」。',
      line: '*12 eggs, uncooked*… 20 slices, untoasted… *in a bag*. — You want *a carton of eggs and a loaf of bread*?',
      said: 'パンケーキに加え、生卵12個と焼く前のパン20枚を袋で頼む。店員が聞き返す。',
      mean: '友人のおごりで、家の食料を手に入れようとしている。',
      trap: '数だけ聞くと大食いに思えるが、uncooked と in a bag は持ち帰り。店員の言い直しがヒント。',
      use: 'Could I get this to go?（これ、持ち帰りにできますか）' },

    // R fix: V2 (blind 70 %). The money offer is replaced by the list of the old Tom's faults, which does come, but
    //   only after the "but" (189 s), so it's a near miss the `then` settles.
    // why: praise ← "that's great" heard as the start of more praise (the Japanese frame: agreement ends the turn);
    //   faults ← "the mistakes of Entertainment 720" just said, and the list does follow a few seconds later
    // retired: for the levels: with h1 out C1 was 4/21 (19 %, under 20 %); r1 is the B2 whose predict cut is still an
    //   ear check (182.6 s)
    { id: 'r1', skill: 'predict', level: 'B2', point: 'turn', seg: [176.4, 182.6], retired: true, then: [182.6, 186.15],
      stem: 'After “…and that’s great”, what kind of move is his friend about to make?',
      choices: ['A turn to what Tom shouldn’t give up', 'More praise for how Tom has changed',
                'A list of what the old Tom got wrong'], a: 0,
      cue: 'この「that’s great」は、どんな話の前に来やすい？',
      line: 'I know you don’t want to repeat the mistakes…, and *that’s great*, *but* you’re gonna need…',
      said: '「くり返したくないのは分かるし、いいことだ。でも…」と本題に入る。',
      mean: 'まず相手の考えを認め、but のあとで本当に言いたいことを言う前置き。',
      trap: 'that’s great で賛成して終わると取りやすい。認める言葉のあとは反対が来やすい。',
      use: 'That’s great, but here’s the thing.（それはいいんだけど、実はね）' },

    // R fix: N/C5: its segment is r1's `then` and its stem and line give r1's key, so it now reveals `turn`.
    { id: 'x1', skill: 'dict', level: 'B2', point: 'littlebit', reveals: ['dose', 'turn'], seg: [182.6, 186.15],
      stem: 'Type it: “you’re gonna need ___ old Tom to make this business work.” (5 words)',
      answer: 'a little bit of the',
      cue: 'need のあと、5語が一続きに。',
      line: 'you’re gonna need *a little bit of the* old Tom to make this business work.',
      said: '「この商売には、昔の Tom が少し必要だ」。',
      mean: 'a little bit of the が「アリルビロヴザ」とつながる。t は弾む。',
      trap: 'of と the が弱く、消えやすい。5語あるので of と the を探す。',
      use: 'Add a little bit of salt.（塩をほんの少し足して）' },

    // why: unsure ← the friend keeps talking and Tom stays, so he seems open to it; pleased ← "the old Tom" heard as
    //   praise of his past
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'ruined', seg: [185.0, 189.3],
      stem: 'How does Tom react to the idea of bringing back his old self?',
      choices: ['Firmly against it', 'Unsure, but curious', 'Quietly pleased'], a: 0,
      cue: '提案のすぐあと、Tom の短い返事。',
      line: '*No. That Tom ruined everything.* — Yes, he did.',
      said: '「だめだ。あの頃の俺が全部だめにした」と言い、友人も「確かに」と認める。',
      mean: 'That Tom ＝ 昔の自分を他人のように指す言い方。きっぱり拒んでいる。',
      trap: 'old Tom はほめ言葉ではなく、失敗した昔の自分。最初の No で立場が決まる。',
      use: 'No way. Never again.（絶対いや。二度とごめんだ）' },

    // R new: replaces nt2 as the second C2 (who the joke is on / a broken script). Blind read: 40 %.
    // why: ironic ← the friend does go on to praise his swagger, so "Yes, he did" can sound like mock agreement; new
    //   Tom ← "he did" heard as about Tom now, the cheap boss of the last scenes (scope shift)
    // anchor: 186.2–194.8 s "No. That Tom ruined everything. — Yes, he did. And that Tom made you a horrible
    //   boyfriend… and drove you to bankruptcy": the past tense and the earnest list settle it
    { id: 'nt3', skill: 'humor', level: 'C2', point: 'ruined', seg: [185.5, 196.6],
      stem: 'When Tom says the old Tom “ruined everything”, why is his friend’s reply funny?',
      choices: ['He agrees in earnest, then adds more faults', 'He says it ironically, as he admires the old Tom',
                'He means the new Tom is ruining things, too'], a: 0,
      cue: '「No.」のあと、友人の短い返事とその続き。',
      line: 'That Tom ruined everything. — *Yes, he did. And that Tom made you a horrible boyfriend*… *drove you to bankruptcy*.',
      said: '「あの頃の俺が全部だめにした」に、友人は「ああ、その通り」と返し、ひどい恋人、破産と失敗を並べる。',
      mean: '友だちなら「そんなことない」と励ます場面。そこで本気で同意し、さらに足すずれが笑い。',
      trap: 'Yes, he did を皮肉と取りやすいが、続く列挙は本気で、過去形。he は昔の Tom。',
      use: 'You’re right, I did mess that up.（確かに、あれは僕の失敗だ）' },

    // R fix: V2 (blind 70 %). The stem said "keeps listing… faults", which pointed at impatience, and the driving
    //   distractor was absurd at a diner. Now a neutral stem and a polite-request distractor (a Japanese frame).
    // why: go on ← the Japanese frame: a question as a polite invitation to continue; accepts ← the long list heard
    //   as finally winning him over
    { id: 'pr4', skill: 'pragma', level: 'C1', point: 'point', seg: [186.1, 196.65],
      stem: 'After his friend’s list about the old Tom, what does Tom’s short question do?',
      choices: ['Pushes him to get to what he wants to say', 'Asks him, politely, to go on with the list',
                'Shows he accepts the blame for all of it'], a: 0,
      cue: '悪い点の列挙のあと、Tom の短い質問。',
      line: 'drove you to bankruptcy. — *Are we nearing the point?*',
      said: '昔の Tom の悪い所を次々に挙げられ、「そろそろ本題？」と聞く。',
      mean: '「で、何が言いたいの」とせかす言い方。質問の形で、もうやめてと伝えている。',
      trap: '質問の形なので「続けて」という丁寧な促しに思える。要点はまだか、という意味。',
      use: 'Can we get to the point?（本題に入ってもらえる？）' },

    // R fix: V2 + K6 (blind 75 %: "always" was the only absolute). The harm choice is replaced by a reading of "is
    //   part of you".
    // why: more ← "doses" heard but "small" lost; really him ← "is part of you" heard as the condition
    { id: 'p3', skill: 'phrase', level: 'B2', point: 'dose', reveals: ['turn'], seg: [195.3, 204.4],
      stem: 'What does his friend say about Tom’s swagger and confidence?',
      choices: ['A little of it can help', 'More of it can help', 'It helps if it’s really him'], a: 0,
      cue: '「part of you」のあと、in のあとの2語。',
      line: 'your swagger… is part of you, and *in small doses, it can help*.',
      said: '「自信や派手さも君の一部。少しなら役に立つ」と言う。',
      mean: 'in small doses ＝ 少しずつなら。薬の量にたとえて「やりすぎなければ」と伝える。',
      trap: 'doses だけだと量を増やす話に思える。small が量を限る。',
      use: 'Coffee is fine in small doses.（コーヒーは少しなら大丈夫）' },

    // R fix: V2 (blind 85 %: only "barely" made sense with "enough cash… set up"). A fourth choice, "nearly", fits
    //   the sense too, so the sound has to decide.
    // why: rarely ← /b/ heard as /r/, and both make a sentence; really ← the vowel caught and the b lost; nearly ←
    //   the same "-early" ending and the same sense; "I know. Take this." rules out "really"
    { id: 's2', skill: 'sound', level: 'B2', point: 'cash', seg: [204.3, 208.7],
      stem: 'Fill the gap: “I ___ enough cash to get everything set up.”',
      choices: ['barely have', 'nearly have', 'rarely have', 'really have'], a: 0,
      cue: '文の最初、I のすぐあとの語。',
      line: 'I *barely have* enough cash to get everything set up. — I know. Take this.',
      said: '「準備のお金もぎりぎりしかない」と言い、友人は「分かってる。これを」。',
      mean: 'barely ＝ かろうじて、ほとんど〜ない。お金が足りないという訴え。',
      trap: 'rarely（めったに〜ない）と音が近い。直後の Take this. が証拠。',
      use: 'I barely made the train.（電車にぎりぎり間に合った）' },

    // R drop: nt2. The key needs the bacon order to be Tom's, and no name settles it; Ron (on screen later, a
    //   bacon lover) is as likely. A speaker-dependent key with no anchor (GUIDE §9.7, V1/K1). Replaced by nt3.

    // R fix: V2 (blind 70 %: "friends decide" was off topic). New near miss: plain store, bigger treat.
    // why: spends ← "30% more swag", the flair and the bigger party heard on their own; plain store ← "two pizzas"
    //   remembered, "add a little flair" lost
    { id: 'g2', skill: 'gist', level: 'B2', point: 'change', reveals: ['dose', 'cheap'], seg: [227.0, 264.0],
      stem: 'By the end, how has Tom’s way of running the store changed?',
      choices: ['He adds some flair but still keeps costs down', 'He drops his budget and spends like the old Tom',
                'He keeps the store plain, but spends on the team'], a: 0,
      cue: 'ピザパーティーの2回目、1回目との差。',
      line: 'I used the money… to *add a little flair*… — Two pizzas. — And toppings. — *Only on half*.',
      said: 'もらったお金で店を華やかにし、2回目のピザは2枚で具付き。ただし半分だけ。',
      mean: '昔の派手さを少し戻しつつ、節約も続ける。助言どおりの変化。',
      trap: '30% more swag や具付きピザだけだと昔に戻ったように思える。Only on half が名残。',
      use: 'Let’s splurge a little, but not too much.（少しぜいたくしよう、ほどほどに）' },

    // R fix: V2 (blind 50 %). "Mocking" is replaced by the literal reading, so two choices start "He dislikes it".
    // why: won't sell ← "I hate all of this" heard alone, the "which…" clause lost; secretly likes ← the Japanese
    //   frame: blunt words as 照れ隠し
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'hate', seg: [239.35, 245.6],
      stem: 'In the blunt review of the new store, what is the speaker’s real view?',
      choices: ['He dislikes it, but truly thinks it will sell', 'He dislikes it, and doubts that it will sell',
                'He likes it, but won’t admit it to Tom'], a: 0,
      cue: '「I hate all of this」のあと、which のあと。',
      line: '*I hate all of this*, *which probably means it’s good for your business*.',
      said: '「全部嫌いだ。ということは、たぶん商売にはいい」と言う。',
      mean: '自分の好みは客と逆と分かった上での、本気の評価。嫌いなことが、売れる証拠になっている。',
      trap: 'hate だけ聞くと皮肉や悪口に思える。which のあとで、評価が前向きに変わる。',
      use: 'Not my style, but people will love it.（私の好みじゃないけど、受けると思う）' },
  ]
};
