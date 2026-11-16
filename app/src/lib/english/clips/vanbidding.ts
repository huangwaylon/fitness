// “Donna Sacrifices Her Mercedes | Parks and Recreation” (the official Parks and Recreation channel, Season 4): the van
// owner Bill tears up the campaign's $900 rental to take a rival's $10,000; Tom's pitches and Ron's appeal to his word
// fail and the price keeps rising, until a staged fender-bender in the parking lot leaves Bill owing them.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈205 s. Untested: 35–40 s (the fake
// crying, garbled in the captions), 51–56 s (the logo line: crude), 65–67 s (“boo-boo bucks” vs “boo books”), 106–110 s
// beyond the pinky-swear jab (George Washington: world knowledge), 157–165 s (“our girls”, “hit my baby”: unclear who
// and what), 203 s (“payment in van rentals” vs captions “payment and van rentals”: no key turns on it).
// EAR CHECK: 171.7 s pr2 — the cut falls after “Y'all got your seat belts on?” (captions “seatbelt done”), before the
//   crash sounds (≈172–175 s) and “Did you see that?”
// REVIEW 2026-11-16: pass 5, fix 19, drop 0, new 0; ear checks 1
import type { Clip } from '../types.ts';

export const vanBidding: Clip = {
  id: 'vanbidding', video: '2eY8lfAF06s', title: 'Donna Sacrifices Her Mercedes', dur: 228, wpm: 154, band: 'mid',
  tags: ['お願い・断り', '職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 70 %) — "broken down" was weak; a double-booking reading (Newport also renting) replaces it
    // why: pay first ← "We already paid" heard as an unpaid bill; double-booked ← "the Newport campaign… rent the
    //   vans" heard as a mix-up, with "tear up your contract" missed
    { id: 'g1', skill: 'gist', level: 'B1', point: 'deal', seg: [0, 25],
      stem: 'What problem does Tom’s team face at the start?',
      choices: ['The van owner is dropping their deal for a better one', 'The van owner wants them to pay before they get the vans',
                'The van owner rented the vans out twice by mistake'], a: 0,
      cue: '「So I’m gonna」のあと、契約をどうするか。',
      line: 'So I’m gonna *tear up your contract*, and I’m gonna *take the money*.',
      said: '900ドルで借りたバンの持ち主が「契約は破る」と言い出す。',
      mean: 'tear up a contract ＝ 契約を破棄する。高い話に乗り換える宣言。',
      trap: 'We already paid から未払いの話に思えやすいが、払った契約ごと捨てられている。',
      use: 'They tore up the contract.（契約を破棄された）' },

    // R fix: cue leak ("whole" was only in the key) and V2 (blind 50 %, right) — three "He came with …" choices, a
    //   lawyer (the contract frame) in place of the papers
    // why: police ← "posse" from westerns (a sheriff's men); lawyer ← a contract dispute, and "brought … with you"
    //   heard as bringing backup
    { id: 'f4', skill: 'phrase', level: 'B2', point: 'posse', seg: [0, 5.9],
      stem: 'When Tom arrives, what does Bill say about him?',
      choices: ['He came with a big group of people', 'He came with the police behind him', 'He came with his lawyer beside him'],
      a: 0,
      cue: '「You brought the whole」のあとの一語。',
      line: 'You brought *the whole posse* with you, huh?',
      said: 'トムが名乗ると、「仲間を全員連れてきたのか」と返す。',
      mean: 'posse ＝ 仲間の一団。くだけた、少しからかう言い方。',
      trap: '西部劇では保安官の一団を指すので、警察を思い浮かべやすい。今は「取り巻き・仲間」の意味。',
      use: 'She showed up with her whole posse.（彼女は仲間を全員連れて来た）' },

    // why: $9,000 ← "nine hundred" heard as nine thousand; $1,000 ← "ten" heard, the "thousand" heard as one;
    //   $19,000 ← nine-teen
    { id: 'n1', skill: 'number', level: 'B1', point: 'price1', seg: [7.7, 14.6], keep: true,
      stem: 'What price does Bill now ask for the vans?',
      choices: ['$1,000', '$9,000', '$10,000', '$19,000'], a: 2,
      cue: '「but now it’s」のあとの数。',
      line: 'Yeah, it was $900, but *now it’s $10,000*.',
      said: '「前は900ドルだった。でも今は1万ドルだ」と言う。',
      mean: '値段が十倍以上に。前と今を比べる形。',
      trap: '先に nine hundred が二度聞こえ、nine が耳に残りやすい。but now のあとの数を聞く。',
      use: 'It was cheap, but now it’s double.（前は安かったけど、今は倍だ）' },

    // R fix: B1 — the stem's "the other campaign" gives away g1's key, so it reveals `deal` too.
    // R fix: V2 (blind 55 %) — "rent them out" was weak; a campaign-ads reading (what a campaign would do) replaces it
    // why: drive around ← Tom's later pitch ("they drive around town all day"); campaign ads ← "the Newport campaign"
    //   plus "rent the vans" heard as using them for ads
    { id: 'd1', skill: 'detail', level: 'B1', point: 'park', reveals: ['price1', 'deal'], seg: [14, 22.6],
      stem: 'What will the other campaign do with the vans?',
      choices: ['Just leave them parked somewhere', 'Drive them around the town', 'Cover them in Newport campaign ads'], a: 0,
      cue: '「offered me 10 grand」のあと、just に続く部分。',
      line: 'The Newport campaign offered me 10 grand to *just rent the vans and park them somewhere*.',
      said: '「ニューポート陣営が1万ドルくれる。借りてどこかに停めておくだけで」と言う。',
      mean: '使うためではなく、相手陣営に使わせないための借り上げ。just が「それだけ」を表す。',
      trap: 'あとでトムが「町を走り回る」と言うので混ざりやすい。誰の案かを分けて聞く。',
      use: 'You can just park it out front.（前に停めておけばいいよ）' },

    // R fix: V2 (blind 55 %) — "polite" and "nervous" were weak; "an opening for a counter-offer" (the negotiation
    //   reading of "Anything else?") and "checks they've understood" replace them
    // why: counter-offer ← "Anything else?" heard as an invitation to bid, in a price talk; checks they understood ←
    //   short questions heard as checking
    { id: 't0', skill: 'attitude', level: 'B1', point: 'great', seg: [19.8, 25.3],
      stem: 'How does Bill end his announcement?',
      choices: ['He shuts the talk down without waiting', 'He gives them a chance to make an offer',
                'He checks they’ve understood the change'], a: 0,
      cue: '最後の三つの短い語と、その間の短さ。',
      line: '*Anything else? No? Great.*',
      said: '契約破棄を告げたあと、「他に何か？ないね？よし」と一人で片づける。',
      mean: '答えを待たずに自分で No と言う。話は終わり、という追い払い方。',
      trap: 'Anything else? は交渉では「対案は？」にも聞こえる。自分で No と答えたら、聞く気はない。',
      use: 'Anything else? No? Okay, see you.（他に何か？ない？じゃあね）' },

    // R fix: V2/K6 (blind 70 %; "won't ever" was an absolute only in a distractor) — a personal-dislike reading
    //   replaces "a game for fun"
    // why: dislikes them ← "hard" heard as being hard on them personally; mind made up ← Bill's "I'm not changing my
    //   mind" just before
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'hardball', seg: [25.8, 30.1],
      stem: 'Outside, how is Bill’s move summed up?',
      choices: ['He’s pushing hard to get a better deal', 'He’s being rude because he dislikes them',
                'He’s made up his mind for good'], a: 0,
      cue: '「He’s just playing」のあとの一語。',
      line: 'Well, what now? — He’s just *playing hardball*.',
      said: '「どうする？」に「強気に出ているだけだ」と返す。',
      mean: 'play hardball ＝ 有利な条件のために強硬に出る。交渉の余地はある、という見方。',
      trap: 'hard から個人的な敵意と取りやすい。hardball は強気の交渉のたとえ。',
      use: 'They’re playing hardball on the price.（値段で強気に出てるね）' },

    // R fix: V2/K5 (blind 60 %: the key was the only "plan" choice) — three "… in his tough plan is to …" choices
    // why: backup ← crying heard as a result if it fails, not the plan; storm out ← "BAM" heard as a slammed door
    { id: 'h1', skill: 'humor', level: 'C1', point: 'crying', seg: [28.3, 35.1],
      stem: 'What makes Tom’s plan for the meeting funny?',
      choices: ['The big move in his tough plan is to cry', 'The backup in his tough plan is to cry',
                'The big move in his tough plan is to storm out'], a: 0,
      cue: '「and then BAM!」のあと、何をするか。',
      line: 'we’ll give them our demands, and then *BAM! I start crying*.',
      said: '「中に入って要求を突きつける。そしてバン！泣き出す」と作戦を話す。',
      mean: '強気の口ぶりで盛り上げて、切り札が泣き落とし。期待と中身の落差が笑い。',
      trap: '泣くのは失敗した結果ではなく、最初から作戦。BAM のあとが決め手として来る。',
      use: 'Here’s the plan: we just ask nicely.（作戦はこう。丁寧に頼む）' },

    // R fix: V2 (blind 70 %) — a "split the vans" reading of the two-campaign comparison replaces the threat
    // why: split ← two "If you let…" clauses heard as a share-out; lower price ← any pitch heard as haggling
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'publicity', seg: [41.7, 51.4],
      stem: 'When Tom compares the two campaigns’ use of the vans, what is he doing?',
      choices: ['Offering Bill a gain besides the money', 'Asking Bill to split the vans between them',
                'Asking Bill to bring down his new price'], a: 0,
      cue: '二つの「If you let」の違いと、そのあとの二語。',
      line: 'If you let us have the vans, they drive around town all day. *Free publicity*.',
      said: '「うちに貸せば一日中町を走る。タダの宣伝になる」と言う。',
      mean: 'publicity ＝ 宣伝。お金以外の得を売りこんでいる。',
      trap: 'If you let が二つ並ぶと、分け合う案に聞こえやすい。比べているのは使い道で、要点は最後の二語。',
      use: 'It’s free advertising for you.（そちらにとってタダの宣伝ですよ）' },

    // R fix: V2 (blind 70 %) — "doesn't want people to see his vans" was weak; "ads wouldn't help" replaces it
    // why: ads won't help ← "I don't need free publicity" heard alone; already pays ← "pay for it" heard as a present
    //   habit
    { id: 'i1', skill: 'infer', level: 'B2', point: 'payfor', reveals: ['publicity', 'price1'], seg: [57.8, 63.4],
      stem: 'What does Bill’s answer to the publicity idea show?',
      choices: ['The cash is worth more than their offer', 'He thinks ads wouldn’t help his business',
                'He is already paying for ads on his vans'], a: 0,
      cue: '「I can just」のあと、何で払うか。',
      line: 'I don’t need free publicity. I can just *pay for it with my $10,000*.',
      said: '「タダの宣伝はいらない。その1万ドルで宣伝を買えばいい」と返す。',
      mean: '宣伝が欲しければ現金で買える。だから現金のほうが上、という切り返し。',
      trap: 'I don’t need だけ聞くと宣伝嫌いに聞こえる。can just pay は「これからでも買える」。',
      use: 'I’d rather just have the cash.（現金のほうがいいな）' },

    // C2: the exact words in fast speech (dict)
    // anchor: 63.4–65.2 s "Look, I ain't gonna try to play a player": both sources have "ain't gonna", six weak words
    //   in about a second
    { id: 'nt1', skill: 'dict', level: 'C2', point: 'player', seg: [63.2, 67.55],
      stem: 'Type the opener: “Look, ___ a player.” (6 words)', answer: "i ain't gonna try to play",
      cue: '「Look,」の直後。文法より、聞こえた音を。',
      line: 'Look, *I ain’t gonna try to play* a player.',
      said: '「なあ、プロをだます気はない」と切り出す。6語がひと続きに聞こえる。',
      mean: 'ain’t gonna は I’m not going to のくだけた形。相手を同類として扱う話し方。',
      trap: '習った形に直したくなる。書き取りは、正しい文でなく言われた音を書く。',
      use: 'I ain’t gonna lie, that was fun.（正直言って、楽しかった）' },

    // R fix: V2 (blind 75 %) — "a job" was weak; a near miss on timing ("a share once it takes off") replaces it
    // why: ground floor ← "floor" taken as part of a building; share later ← "worth way more than 10 grand" heard as
    //   a payout once it's big
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'ground', seg: [67.55, 78.8],
      stem: 'Along with the yogurt idea, what is Bill offered?',
      choices: ['A share in it from the very start', 'An office on the ground floor', 'A share once it takes off'],
      a: 0,
      cue: '「I’ll let you in」のあとの言い方。',
      line: 'I’ll *let you in on the ground floor*, and let me tell you, it’s gonna be worth way more than 10 grand.',
      said: '酒入りヨーグルトの案で「最初から一枚かませる」と言う。',
      mean: 'on the ground floor ＝ 事業の始まりから。出資の誘い。',
      trap: 'ground floor を文字通り「1階」と取りやすい。let you in on は「仲間に入れる」。',
      use: 'Want in on the ground floor?（最初から一口のらない？）' },

    // R fix: V2 (blind 60 %: "turns it down" wasn't funny) — an "invest" near miss ("with my $10,000") replaces it
    // why: invest ← "start the company… with my $10,000" heard as putting money into Tom's company; same idea ←
    //   "start the company myself" heard as "already have"
    { id: 'h2', skill: 'humor', level: 'B2', point: 'steal', seg: [78.85, 85.9],
      stem: 'What makes Bill’s answer to the yogurt pitch funny?',
      choices: ['He calls the idea bad, yet plans to take it', 'He calls the idea bad, yet wants to invest',
                'He claims he’d had the very same idea already'], a: 0,
      cue: '「bad idea」のあと、何をすると言うか。',
      line: 'now that I know your *bad idea*, I can *start the company myself*',
      said: '「悪いアイデアを聞いたから、自分で始められる」と言う。',
      mean: 'けなしたアイデアを、そのまま盗もうとしている。言葉と行動の食い違いが笑い。',
      trap: 'my $10,000 から出資の話に思えやすい。myself があるので、自分一人で始める話。',
      use: 'Now that I know, I’ll do it myself.（分かったから、自分でやる）' },

    // R fix: B1 — w1's line shows x1's answer and x1's stem names who is sent out (w1's evidence); each now lists
    //   the other in `reveals`
    // why: Tom ← he did the talking and he protests just before; Donna ← she is the other team member there
    { id: 'w1', skill: 'who', level: 'B2', point: 'moment', reveals: ['givemoment'], seg: [84.5, 91.8],
      stem: 'Who asks for a moment alone with Bill?',
      choices: ['Tom', 'Donna', 'Ron'], a: 2,
      cue: '呼ばれる名前と、呼ばれない名前。',
      line: 'No, you can’t do that, *Ron*! — *Tom, Donna*, could you please give us a moment?',
      said: '「ロン！」の直後、「トム、ドナ、少し外してくれ」と頼む声がする。',
      mean: '二人を名前で呼んで外させるのは、残る三人目。直前に呼ばれたロン。',
      trap: '話していたのはトムなので、続けて話すと思いやすい。呼びかけの名前で、話し手が分かる。',
      use: 'Could you give us a minute?（少し二人にしてくれる？）' },

    // why: give a smile ← "give us a" then a vowel-led word heard as "a smile"; give him ← "us" weak, heard as "him"
    { id: 'x1', skill: 'dict', level: 'B1', point: 'givemoment', reveals: ['moment'], seg: [86.2, 89.6],
      stem: 'Type what he asks: “Tom, Donna, could you please ___?” (4 words)', answer: 'give us a moment',
      cue: '「please」のあと。短い語が続く。',
      line: 'Tom, Donna, could you please *give us a moment*?',
      said: '二人に「少し外してくれないか」と頼む。',
      mean: 'give us a moment ＝ 少し二人きりにして。席を外してもらう丁寧な決まり文句。',
      trap: 'give‿us‿a がつながり「ギヴァサ」と一語に聞こえる。us の s が次の a に移る。',
      use: 'Sorry, can you give us a moment?（すみません、少し外してもらえますか）' },

    // why: honest question ← the words alone ask for his view; offering a promise ← pinky swears as a friendly deal
    { id: 't1', skill: 'attitude', level: 'C1', point: 'pinky', seg: [102.2, 112],
      stem: 'After Ron’s line about a man’s word, how does Bill respond?',
      choices: ['He mocks it as a childish kind of idea', 'He honestly asks how far a promise goes',
                'He offers a friendly promise of his own'], a: 0,
      cue: '「What’s your stance on」のあと、その直後の一言。',
      line: 'a man’s word is sacred. — Okay, *what’s your stance on pinky swears*… I’m taking the money.',
      said: '「男の言葉は神聖だ」に、「じゃあ指切りについてのご意見は？」と返し、「金はもらう」と言う。',
      mean: '子どもの指切りと並べて、ロンの言葉を幼稚な建前だと笑っている。',
      trap: '質問の形なので本気で聞いているようだが、すぐ「金はもらう」と結論を出している。',
      use: 'What’s your stance on dessert?（デザートについてのご意見は？）' },

    // why: $15,000 ← said later by Bill; $20,000 ← twelve/twenty near sound
    { id: 'n2', skill: 'number', level: 'B1', point: 'price2', seg: [117.6, 122.8], keep: true,
      stem: 'When Ron matches the rival offer, what does Bill ask now?',
      choices: ['$10,000', '$12,000', '$15,000', '$20,000'], a: 1,
      cue: '「Now it’s」のあとの数。',
      line: 'Deal? — No… *Now it’s $12,000*.',
      said: 'ロンが1万ドルを出すと、「今は1万2千だ」と返す。',
      mean: '金額を合わせた瞬間に、さらに上げる。',
      trap: 'twelve と twenty は最初が似ている。twelve は「トゥエルヴ」と短く、-ty の「ティ」がない。',
      use: 'Now it’s twelve dollars? Since when?（今は12ドル？いつから？）' },

    // why: Prices have ← the weak "has" heard as plural "have"; had ← "has" reduced to a bare "z" heard as "'d"
    { id: 's1', skill: 'sound', level: 'B2', point: 'goneup', seg: [117.6, 120.6],
      stem: 'Fill the gap: “No. ___ gone up.”',
      choices: ['Price has', 'Prices have', 'Price had'], a: 0,
      cue: '「No.」のあと、gone の前の短い音。',
      line: 'No. *Price has* gone up.',
      said: '「いや。値上がりした」と短く断る。',
      mean: 'the を落とした、くだけた言い方。has gone up で「今は上がっている」。',
      trap: 'has は弱く「ズ」程度になり、have や had と区別しにくい。',
      use: 'Sorry, the price has gone up.（すみません、値上がりしまして）' },

    // R fix: S4 (15.5 s; now 129.6–138.9 s, from “Now for a guy…”) and V2 (blind 70 %) — "drive off" was weak; a
    //   greedy "sell now" reading replaces it
    // why: get through ← "ride out" a storm = wait until it passes; sell now ← "dream scenario" heard as cashing in at
    //   once
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'rideout', reveals: ['price2'], seg: [129.6, 138.9],
      stem: 'In his talk to the camera, what does Bill plan to do?',
      choices: ['Let it run on and see how high it goes', 'Wait until the bidding war has calmed down',
                'Sell to the top bidder as soon as he can'], a: 0,
      cue: '「dream scenario」のあと、So で始まる文。',
      line: 'it’s pretty much a dream scenario. So I’m just gonna *ride this out*. See where it takes me.',
      said: 'カメラに「夢みたいな状況だ。このまま乗っかってみる」と話す。',
      mean: 'ride this out ＝ ここでは流れに乗り続ける。値上げを続けるつもり。',
      trap: '辞書の ride out は「嵐をやり過ごす」なので待つと取りやすい。dream で向きが決まる。',
      use: 'Let’s ride this out and see.（このまま様子を見よう）' },

    // R fix: V2 (blind 75 %) — "go back to the old deal" was weak; a "cash up front" reading of "dough" replaces it
    // why: keep the vans ← "demand" heard as a refusal; cash up front ← "had the dough" heard as a demand for cash
    { id: 'i2', skill: 'infer', level: 'C1', point: 'dough', seg: [146.9, 152.2],
      stem: 'If they did find the money, what does the speaker expect from Bill?',
      choices: ['He’d just raise his price again', 'He’d take it, then keep the vans anyway',
                'He’d want it all in cash, up front'], a: 0,
      cue: '「Even if」のあと、would just のあと。',
      line: 'Even if we had the *dough*, that *bunco artist would just demand more*, trust me.',
      said: '「金があっても、あのペテン師はもっと要求するだけだ」と言う。',
      mean: 'dough ＝ お金、bunco artist ＝ 詐欺師。',
      trap: 'demand を「断る」と取ると、金を取って逃げる話に聞こえる。demand more ＝ さらに要求する。',
      use: 'Even if I had the money, I wouldn’t.（お金があってもやらない）' },

    // R fix: V2 (blind 75 %: with the title and pr2's seat belts, "a crash" was the only fit) — asked from the
    //   settlement's angle (§9.4): how is it paid for
    // why: takes her car ← the title's "sacrifices her Mercedes" read as trading it; old price ← "settle this" heard
    //   as going back to the first deal
    { id: 'g2', skill: 'gist', level: 'B2', point: 'crash', seg: [152.9, 205.4],
      stem: 'How is the van problem settled in the end?',
      choices: ['Bill pays for the damage with van rentals', 'Bill takes her car in place of the cash',
                'Bill drops back to the old $900 price'], a: 0,
      cue: '最後の文で、何で払ってもらうか。',
      line: 'You just *rear-ended me*… So we can settle this now. I will *accept payment*…',
      said: '車をぶつけさせ、「追突したわね。払いはバンのレンタルで」と迫る。',
      mean: '自分の車を犠牲にして、ビルに借りを作らせた。',
      trap: 'タイトルから車を差し出したと思いやすい。最後の accept payment で、払うのはビルの側。',
      use: 'Let’s settle this right now.（今ここで話をつけよう）' },

    // R fix: S5 (it asked what happens, not what kind of move) and V2 (blind 80 %) — now asks what move the question
    //   sets up; the distractors are the give-in and keep-blocking readings
    // why: backing away ← "Move!" then "All right" heard as giving in; stalling ← the earlier plan to "stay here for
    //   like an hour and not let him out"
    { id: 'pr2', skill: 'predict', level: 'B2', point: 'crash', seg: [165.6, 171.7], then: [171.7, 179.5],
      stem: 'What kind of move does the driver’s seat-belt question set up?',
      choices: ['A warning before a risky move on purpose', 'A polite pause before backing away',
                'A stalling move to keep Bill blocked in'], a: 0,
      cue: '運転席からの質問。何に備えさせている？',
      line: 'All right. *Y’all got your seat belts on?*',
      said: 'ビルに「どけ！」と言われ、運転手が「よし。みんなシートベルトしてる？」と聞く。',
      mean: '乗っている人に衝撃への備えをさせる一言。このあと車がぶつかる。',
      trap: '「どけ」のあとなので、あきらめて動くと思いやすい。安全の確認は、何か起こす前の合図。',
      use: 'Hold on tight, everybody.（みんな、しっかりつかまって）' },

    // C2: what does she do with his words? (cf. g2)
    // anchor: 181.4–186.8 s Bill "What the hell?" → "Exactly, Bill. What the hell? You just rear-ended me." She repeats
    //   his words, then names him as the one who hit her
    // R fix: V2/K6 (blind 60 %: the key was the only two-part choice) — "asks his plan" was weak; a sincerity flip
    //   (echoing to share the shock) replaces it
    // why: agrees ← "Exactly" read as "yes, my fault"; shocked too ← the echo heard as "I'm just as shaken as you"
    // retired: for the draws (it shares g2’s point, so play 3+ under g2 drew no C2)
    { id: 'nt2', skill: 'pragma', level: 'C2', point: 'crash', seg: [180.8, 189.9], retired: true,
      stem: 'When Bill’s “What the hell?” is met with “Exactly, Bill”, what is she doing?',
      choices: ['Turning his complaint back onto him', 'Agreeing that the crash was her fault',
                'Echoing him to show she’s shocked too'], a: 0,
      cue: '彼の言葉をくり返したあと、誰が誰にぶつけたと言うか。',
      line: 'What the hell? — *Exactly, Bill. What the hell?* You just rear-ended me.',
      said: 'ビルの「何だよ」に、「そうよ、何なのよ。追突したでしょ」と同じ言葉で返す。',
      mean: 'exactly は同意でなく、相手の抗議を横取りする合図。くり返して被害者の立場を取る。',
      trap: 'exactly を「私のせい」と取りやすい。くり返しのあとの主語を聞けば、責めているのは彼女。',
      use: 'Exactly! Why would you do that?（そうでしょ！なんでそんなことするの？）' },

    // why: true ← "witnesses" heard as proof; police ← "settle this" heard as reporting it
    // R fix: V2/K5 (blind 65 %) — three parallel "Her side …" choices; the police one now reports, not calls
    { id: 'i4', skill: 'infer', level: 'C1', point: 'witness', reveals: ['crash'], seg: [186.6, 193.9],
      stem: 'When Bill denies it, what does the reply about witnesses suggest?',
      choices: ['Her side will back her story, true or not', 'Her side saw what happened, so it’s true',
                'Her side will report Bill to the police'], a: 0,
      cue: '否定の直後、But で始まる返事。',
      line: 'That is not what happened. — *But* I got *witnesses*.',
      said: '「そんなことは起きてない」に、「でも証人がいる」と返す。',
      mean: 'But は否定を認めたうえでの返事。本当かどうかより、味方の数で押し切るつもり。',
      trap: 'witnesses で「事実」と取りやすい。No でなく But で返すと、否定しきれていない。',
      use: 'Maybe, but I have witnesses.（かもね。でも証人がいるよ）' },

    // C2: how does he answer? (cf. t1)
    // anchor: 194.4–199.9 s "what about you, mister 'a man's word is sacred'?" → "Well, it is. But you're an ass.":
    //   he keeps the principle ("it is") and rules Bill out of it ("but you…")
    // why: dropped ← he backs a story he didn't see, so his word looks gone (a sincerity flip); true story ← siding
    //   with Donna heard as vouching for what happened
    // R fix: V2/K5 (blind 60 %) — three "His word …" near misses: the principle kept, kept as vouching, or dropped
    { id: 'nt3', skill: 'attitude', level: 'C2', point: 'word', seg: [193.9, 202.1],
      stem: 'When Bill throws Ron’s own words back at him, what does Ron’s reply say?',
      choices: ['His word holds, just not for someone like Bill', 'His word holds, so his account must be true',
                'His word was only talk, just as Bill suspects'], a: 0,
      cue: '「Well, it is.」と、そのあとの But。',
      line: 'what about you, mister “*a man’s word is sacred*”? — *Well, it is. But* you’re an ass.',
      said: '「男の言葉は神聖、じゃなかったのか」と突かれ、ロンは「神聖だ。だが君はろくでもない」と返す。',
      mean: '原則は捨てていない。約束を破った相手には、その原則を使う価値がない、という線引き。',
      trap: '口裏を合わせたので、原則を捨てたと取りやすい。it is で認め、But で相手を外している。',
      use: 'Rules are rules, but you’re pushing it.（ルールはルールだけど、君はやりすぎ）' },
  ]
};
