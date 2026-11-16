// “Ben Treats Himself | Parks and Recreation” (the official Parks and Recreation channel, Season 4): on their yearly
// Treat Yourself day, Donna talks Tom into bringing a stressed-out Ben along; the spa and acupuncture only make him
// tenser, his one buy is a pack of socks, and when they ask what he'd really spend big on, he finally treats himself.
// Segments from the captions, words from whisper (2026-11-16). Untested: 0–16 s (the DJ intro; names misheard),
// 53.6–63 s (the "holy day", the cupcakes and a cutaway), 114–121 s (the acupuncture rhyme), 146–149 s (the mall's
// name), 172–178 s (the "candy cane" line, a visual), 263.8 s ("Sorry, Doug"), 268–271 s (the slang "chicken heads"),
// 279–284 s ("Why so serious?", a film reference).
// REVIEW 2026-11-16: pass 6, fix 18, drop 0, new 0; ear checks 3
// Open: a1 (confused), g1 (the spa backfires) and h3 still follow the sitcom reading; a show-savvy reader may get them.
// EAR CHECK: 91–94.4 s x1 — whisper has "I knew you wouldn't get it" twice (91.1 and 92.6 s), the captions once (93.0 s);
//   check it's said once and the segment starts clean
// EAR CHECK: 33–53.6 s w1 — Donna asks about inviting Ben and Tom pushes back; inferred from turns ("Exactly." then
//   "Donna, you and I…" in the same voice) and "Tom. — Fine." at 71–74 s; no source names the first speaker
// EAR CHECK: 143.3 s nt1 — "More of a rare coins guy" is taken as Ben's own correction (both sources agree on the words;
//   neither names the speaker); the key falls if someone else says it
import type { Clip } from '../types.ts';

export const benTreats: Clip = {
  id: 'bentreats', video: 't1FM4nExR5c', title: 'Ben Treats Himself', dur: 306, wpm: 142, band: 'slow',
  tags: ['友だち', '買い物'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // why: twice ← the "one, two, one, two" mic check before; month/week ← "a" is weak and the unit word is short
    // R fix: V2 (blind 90 %): "treat day" made "once a year" the obvious special-occasion answer; the stem now just
    //   asks how often.
    { id: 'n1', skill: 'number', level: 'B1', point: 'yearly', seg: [16.4, 21.45], keep: true,
      stem: 'How often does Tom say the two of them do this?',
      choices: ['Once a year', 'Twice a year', 'Once a month', 'Once a week'], a: 0,
      cue: '「Donna and I」の前、文頭の2語。',
      line: '*Once a year*, Donna and I spend a day treating ourselves.',
      said: '「年に1回、ドナと僕は自分にごほうびをする日を過ごす」と説明する。',
      mean: '年に一度だけの特別な日。だから「一年でいちばんの日」と続く。',
      trap: 'year と month は短く弱く聞こえやすい。year は母音が長め、month は口を閉じる m から。',
      use: 'We do this once a year.（これは年に1回やるんだ）' },

    // R fix: V2 (blind 55 %): a fourth choice completes the who × reaction grid, so neither half gives away the other.
    // why: Tom suggests ← the man's voice leads the scene, so the idea sounds like his; agrees at once ← "Exactly"
    //   heard as a yes to inviting; Tom and Donna agrees ← both misreads at once
    { id: 'w1', skill: 'who', level: 'C1', point: 'invite', reveals: ['tomfine', 'exactly'], seg: [38.2, 51.15],
      stem: 'Who wants to bring Ben along, and how does the other react?',
      choices: ['Donna, and Tom pushes back', 'Tom, and Donna pushes back', 'Donna, and Tom agrees at once',
                'Tom, and Donna agrees at once'], a: 0,
      cue: '「Exactly」の人が、そのあと誰の名前を呼ぶか。',
      line: 'Oh, no. This is our thing. — But he… could use a day off. — Exactly. … *Donna, you and I* are relaxation professionals.',
      said: '「二人の行事だ」と断る声と、「休みが必要」と推す声。断る側が「ドナ、君と僕は」と続ける。',
      mean: '「ドナ」と呼ぶ側が反対なので、推しているのはドナ。',
      trap: 'Exactly を賛成と取ると、誘いに乗ったように聞こえる。誰の名前を呼ぶかで決める。',
      use: 'What do you think about inviting Sam?（サムも誘うのはどう？）' },

    // R fix: V2 (blind 60 %): "badly in need" was the only strong choice; three "He seems…" choices now.
    // why: free to take ← "could" read as permission (〜してもよい); one left ← "use a day off" heard as using a paid
    //   holiday
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'coulduse', seg: [40.1, 46.85],
      stem: 'What is said about Ben and a day off?',
      choices: ['He seems to really need one', 'He seems free to take one now', 'He seems to have one left to use'], a: 0,
      cue: '「seems like he」のあとの2語。',
      line: 'he really seems like he *could use* a day off.',
      said: '「ベンには休みが必要みたい」と言う。',
      mean: 'could use ～ ＝ 〜があると助かる、〜が必要だ。許可や可能性の could ではない。',
      trap: 'could を「〜できる」と訳すと許可の話になる。could use はひとかたまりで。',
      use: 'I could use a coffee.（コーヒーが飲みたいな）' },

    // R fix: V2 (blind 70 %): the stem named the rubber band; three "He is so … he …" choices now.
    // why: thin and weak ← "skinny little" heard alone; easygoing ← rubber stretches, so "bends to others"
    { id: 'i1', skill: 'infer', level: 'B2', point: 'rubber', seg: [40.1, 46.85],
      stem: 'What does the comparison right after “day off” say about Ben?',
      choices: ['He is so tense he could snap any minute', 'He is so thin he looks weak and small',
                'He is so easygoing he’ll stretch for anyone'], a: 0,
      cue: '「rubber band」のあとの動詞。',
      line: 'He’s like a skinny little rubber band that’s *about to snap* in half.',
      said: '「今にも真っ二つに切れそうな、細い輪ゴムみたい」と言う。',
      mean: '張りつめて限界が近い、というたとえ。だから休みが必要という話につながる。',
      trap: 'skinny little だけ聞くと体つきの話になる。たとえは最後の動詞まで聞いて決める。',
      use: 'I’m about to snap.（もう限界だよ）' },

    // R fix: V2 (blind 60 %), N7: "busy" was off the point; three "Agrees with the point, …" choices. The line shows
    //   Ben can't relax, so it reveals rubber.
    // why: offers to bring him ← "Exactly" is agreement, so a yes should follow; Ben would refuse ← "doesn't know how
    //   to relax" heard as Ben not wanting to come
    { id: 'h1', skill: 'humor', level: 'C1', point: 'exactly', reveals: ['rubber'], seg: [40.1, 53.6],
      stem: 'When the rubber band point gets “Exactly…”, what does the reply do with it?',
      choices: ['Agrees with the point, then turns it against inviting Ben', 'Agrees with the point, and offers to bring Ben along',
                'Agrees with the point, but says Ben would turn them down'], a: 0,
      cue: '同意のひと言のあと、どんな結論に向かうか。',
      line: '*Exactly.* He doesn’t know how to relax. … There’s *no way* Ben can slow down enough to keep up with us.',
      said: '「その通り、くつろぎ方を知らない」と同意し、「僕らについて来られない」と続ける。',
      mean: '相手の理由をそのまま受け取り、反対の結論に使う。同意から入って断るのが笑い。',
      trap: 'Exactly で賛成と決めやすい。同意の一言のあと、話がどちらへ曲がるかを聞く。',
      use: 'Exactly. That’s why we can’t go.（その通り。だから行けないんだ）' },

    // C2: plain-English paraphrase (deepens h1)
    // anchor: 49.2–53.1 s "you and I are relaxation professionals", then "no way Ben can slow down enough to keep up
    //   with us": relaxing is the contest, so the slower you go, the better you are
    // R fix: V2 (blind 50 %), N7: "He'll rush us…" broke the frame; three "He's too … to …" lines. Reveals rubber.
    // why: too slow ← "keep up" read as speed, "slow down" lost; too busy ← "can't slow down" heard as a schedule
    //   problem (right words, wrong contest)
    { id: 'nt3', skill: 'infer', level: 'C2', point: 'exactly', reveals: ['rubber'], seg: [40.1, 53.6],
      stem: 'Which plain-English version keeps the point about Ben keeping up?',
      choices: ['“He’s too wound up to relax at our level.”', '“He’s too slow to keep up with our pace.”',
                '“He’s too busy to take a whole day off.”'], a: 0,
      cue: '直前の「プロ」と、slow down と keep up の組み合わせ。',
      line: 'you and I are *relaxation professionals*. There’s no way Ben can *slow down enough to keep up* with us.',
      said: '「僕らはくつろぎのプロ。ベンには、僕らについて来られるほどゆっくりするのは無理」と言う。',
      mean: 'ふつうは速くして追いつくが、ここではくつろぐ事が競技。ゆっくりできる人ほど上という逆転。',
      trap: 'keep up を速さの話と取りやすい。反対の言葉が並んだら、何を競っているかを先に聞く。',
      use: 'I can’t slow down enough to sleep.（気が張って眠れない）' },

    // R fix: V2 (blind 55 %): "after the soup question" (Ben alone on a bench) pointed at sympathy; the stem now
    //   names only the line.
    // why: pointing him out ← she has just spotted Ben; warning ← a name said alone can be an alarm ("Tom, look out")
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'tomfine', reveals: ['invite'], seg: [65.2, 74.6],
      stem: 'What does the one-word line “Tom” do?',
      choices: ['Presses him to let Ben come along', 'Points Ben out so Tom will look', 'Warns him that Ben has seen them'],
      a: 0,
      cue: '名前だけの一言と、それへの返事。',
      line: 'Is he eating soup on a bench alone? — *Tom.* — *Fine.*',
      said: 'ベンチで一人スープを飲むベンを見て「トム」とだけ言い、「分かったよ」と返る。',
      mean: '名前だけで「ねえ、誘ってあげようよ」と頼んでいる。Fine はしぶしぶの承知。',
      trap: '名前だけだと呼びかけや注意に聞こえる。返事が Fine なら、前の一言はお願い。',
      use: 'Oh, fine. You win.（はいはい、分かったよ）' },

    // R fix: V2 (blind 50 %): "told to get in" pointed at a puzzled reaction; the stem now only names the moment.
    // why: cross ← "What?" again and again can sound irritated, and his soup is cut short; thrilled ← he is finally
    //   being invited
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'what', seg: [75.4, 86.25],
      stem: 'When they come to get Ben, how does he sound?',
      choices: ['Confused: he has no idea what’s going on', 'Cross: he hates being taken from lunch',
                'Thrilled: he has wanted to join them'], a: 0,
      cue: '同じ短い一語のくり返しと、最後の質問。',
      line: 'What? … *What is happening right now?*',
      said: '「何？何？」と繰り返し、「今、何が起きてるの？」と聞く。',
      mean: '文句ではなく、事情がまったく分からない驚き。急に連れ出された人の反応。',
      trap: '同じ語のくり返しは怒りにも聞こえる。最後の質問の中身で気持ちを決める。',
      use: 'Wait, what’s happening right now?（え、今どうなってるの？）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'getit', seg: [92.25, 94.35],
      stem: 'Type the reply to Ben’s spa-and-mall question. (6 words)', answer: "i knew you wouldn't get it",
      cue: 'ベンの質問のすぐあと。語がつながって速い。',
      line: '*I knew you wouldn’t get it*.',
      said: 'スパとモールだけ？と聞くベンに「分からないと思った」。',
      mean: 'get it ＝ ピンとくる。just の一語で、この日の大事さが伝わっていないと感じた。',
      trap: 'wouldn’t get it は「ウドゥンゲリッ」とつながる。t が消えても n は残る。',
      use: 'I don’t get it. Can you explain?（よく分からない。説明して？）' },

    // R fix: V2 (blind 55 %), N7: "worries about the cost" was off the scene; now uneasy-then-better and bored-but-good.
    //   said names the harps, so it reveals d1's point.
    // why: needles help ← "Just relax" said again and again at the acupuncture; bored but good ← the pampering
    //   itself sounds pleasant
    { id: 'g1', skill: 'gist', level: 'B1', point: 'spa', reveals: ['harps'], seg: [97.75, 146.1],
      stem: 'How does the spa part of the day go for Ben?',
      choices: ['Every step only puts him more on edge', 'He’s uneasy at first, then the needles help',
                'He’s bored by it, but it does him good'], a: 0,
      cue: '針が刺さったあと、ベンの長い一文。',
      line: 'This is the *most stressed out* I’ve ever been in my life.',
      said: 'ハープの音で落ち着かず、針治療では「人生でいちばんストレスを感じてる」と言う。',
      mean: 'くつろぐための一日が、ベンには逆効果。最後は「助けて」とまで言う。',
      trap: 'relax が何度も聞こえるので落ち着いたと思いやすい。言われた事より本人の返事を聞く。',
      use: 'I’m more stressed than when I started.（始める前より疲れた）' },

    // why: price ← Ben the careful spender, and "expensive" comes later; quiet ← "sound" heard, and a spa is quiet
    { id: 'd1', skill: 'detail', level: 'B1', point: 'harps', reveals: ['spa'], seg: [101.5, 108.7],
      stem: 'What does Ben say makes him nervous at the spa?',
      choices: ['The sound of the harps', 'The price of the treatments', 'The quiet of the room'], a: 0,
      cue: '「I can’t」のあとの理由。',
      line: 'There’s something about *the sound of harps* that makes me nervous.',
      said: '「リラックスして」と言われ、「無理。ハープの音がなんだか落ち着かない」と答える。',
      mean: '心を落ち着けるはずの音が、ベンには逆に緊張のもと。',
      trap: 'お金に細かい人物なので値段と思いやすい。理由は makes me nervous の前にある。',
      use: 'Something about this place makes me nervous.（ここはなんだか落ち着かない）' },

    // R fix: V2 (blind 60 %): "test how well they know him" was a filler; "keep him still" ("don't move" just
    //   before) shares "the needles" with the key.
    // why: keep still ← "don't move" said just before; buy later ← it's a shopping day
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'mindoff', seg: [132.35, 138],
      stem: 'Why are things Ben likes about to be listed?',
      choices: ['To keep him from thinking about the needles', 'To keep him still while the needles go in',
                'To work out what he should buy later'], a: 0,
      cue: '「things you like」のあと、to で始まる部分。',
      line: 'I’m going to talk to you about things you like *to take your mind off* the needles, okay?',
      said: '「針のことを忘れられるように、好きな物の話をするよ」と言う。',
      mean: 'take one’s mind off ～ ＝ 〜から気をそらす。痛みや不安を忘れさせる言い方。',
      trap: '買い物の日なので「何を買うか」の相談に聞こえやすい。to のあとが目的。',
      use: 'A movie might take your mind off it.（映画でも見たら気がまぎれるよ）' },

    // C2: who is the joke on?
    // anchor: 138.5–144.1 s "Accounting. Trigonometry. Stamps, probably." then "More of a rare coins guy.": he corrects
    //   only the last item, so accounting and trigonometry stand
    // why: the list-maker ← the guesses sound off-target (right mechanism, wrong target); stamp fans ← "more of a…
    //   guy" heard as Ben looking down on stamps (scope)
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'coins', seg: [132.35, 146.1],
      stem: 'When Ben answers the list of things he likes, who is the joke on?',
      choices: ['Ben, who fixes one item and keeps the rest', 'Whoever made the list, for not knowing him',
                'Stamp fans, whose hobby Ben looks down on'], a: 0,
      cue: '直されるのは、リストのどこか。',
      line: 'Accounting. Trigonometry. Stamps, probably. — *More of a rare coins guy.*',
      said: '会計、三角法、たぶん切手、と好きな物を並べられ、「どちらかというと古いコイン派」と答える。',
      mean: '直すのは最後の一つだけ。会計も三角法も認めたことになり、地味な趣味の人という見方を自分で裏づけている。',
      trap: '直したのでリストが外れたと思いやすい。訂正は、どこを直しどこを残したかまで聞く。',
      use: 'I’m more of a tea person.（どちらかというと紅茶派）' },

    // why: one ← "which one" ends the line; two/four ← the number is quick, right after "and"
    { id: 'n2', skill: 'number', level: 'B1', point: 'burberry', seg: [145.7, 159.4], keep: true,
      stem: 'How many Burberry stores are said to be at the mall?',
      choices: ['One', 'Two', 'Three', 'Four'], a: 2,
      cue: '「old-timey train」のあと、and の次。',
      line: 'and *three Burberrys*. … they gotta specify which one.',
      said: 'モールの自慢として、池や昔風の列車に続き「バーバリーが3軒」と言う。',
      mean: '「バーバリーで会おう」では、どの店か言わないと通じない、という自慢。',
      trap: '最後の which one の one に引かれやすい。数はリストの終わり、and のすぐあと。',
      use: 'There are three cafés on this street.（この通りにカフェが3軒ある）' },

    // why: cashmere ← "cashmere socks" in the list just before; slippers ← "velvet slippers" from the same list
    { id: 'd2', skill: 'detail', level: 'B1', point: 'socks', seg: [182.75, 189],
      stem: 'What did Ben buy for himself?',
      choices: ['A pack of plain white socks', 'A pair of soft cashmere socks', 'A pair of velvet slippers'], a: 0,
      cue: '「did you buy anything」への返事。',
      line: 'I got this *pack of socks*. — *Plain white socks*? That’s not a treat.',
      said: '自分に何か買ったかと聞かれ、ベンは「靴下のパック」。白い無地と知って、相手はあきれる。',
      mean: 'ごほうびの日に、ふだん使いの安い物しか買っていない。',
      trap: '直前にカシミアの靴下やベルベットのスリッパが並ぶので混ざりやすい。誰の物かを分けて聞く。',
      use: 'I just got a pack of socks.（靴下をひと袋買っただけ）' },

    // R fix: N7: the line shows "Plain white socks?" (d2's key), so it reveals socks.
    // why: anger ← "get me away from him" taken at face value; hint ← the Japanese frame of a request made through a
    //   third person (遠回しな頼み)
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'getaway', reveals: ['socks'], seg: [182.75, 191.45],
      stem: 'Right after “That’s not a treat”, how is the next line meant?',
      choices: ['As a joke: plain socks are too dull to bear', 'In anger: Ben has spoiled the day for him',
                'As a hint: Donna should go help Ben shop'], a: 0,
      cue: '靴下への反応の大きさ。',
      line: 'Plain white socks? … *Donna, get me away from him.*',
      said: '白い無地の靴下と聞き、「ドナ、こいつから離してくれ」と言う。',
      mean: 'ごほうびが靴下だけという事に、大げさにあきれてみせる冗談。本気で怒ってはいない。',
      trap: '言葉だけ取ると本気の拒絶に聞こえる。理由の小ささと反応の大きさの差で冗談と分かる。',
      use: 'Please, get me out of here.（お願い、ここから出して）' },

    // R fix: V2 (blind 70 %), §9.4: the title (Ben Treats Himself) gave the outcome; the stem now asks what turns it.
    // why: their splurges ← the velvet and cashmere just before; earned a break ← "could use a day off" from the
    //   start of the day
    { id: 'g2', skill: 'gist', level: 'B2', point: 'turn', reveals: ['version'], seg: [182.75, 244],
      stem: 'What finally gets Ben to treat himself?',
      choices: ['Being told to pick his own kind of treat', 'Seeing how much fun their splurges are',
                'Hearing he has earned a break from work'], a: 0,
      cue: '大金を使うなら何に、という質問のあと。',
      line: 'you’re going to buy it… — Yeah, you know what? *I’m going to treat myself*.',
      said: 'ベンが本当に欲しい物を聞かれて衣装を選ぶと、「買いなよ」と勧められ、その気になる。',
      mean: '二人のまねではなく、自分の好きな物で、ごほうびの意味がやっと分かる。',
      trap: '二人の買い物を見てまねしたと取りやすい。流れが変わるのは「君なら何に使う？」のあと。',
      use: 'You know what? I deserve this.（よし、これくらいいいよね）' },

    // R fix: V2 (blind 65 %): "back to work" was a filler; three "Treating himself…" choices.
    // why: cheaper ← "sock money" said; one big thing they pick ← "blow big money on one thing" heard without "what
    //   would it be?"
    { id: 'i2', skill: 'infer', level: 'B2', point: 'version', seg: [188.95, 201.5],
      stem: 'After the socks, what is suggested for Ben?',
      choices: ['Treating himself in his own way, not theirs', 'Treating himself the way they do, just cheaper',
                'Treating himself to one big thing they pick'], a: 0,
      cue: '「our version」と対になる言葉。',
      line: 'maybe this is *our version* of treat yourself day, and he needs to do *his version*.',
      said: '「これは私たち流。ベンにはベン流が必要かも」と言う。',
      mean: 'ごほうびの形は人それぞれ。ベンの好きな物を探す方向に話が変わる。',
      trap: 'sock money が聞こえて「安く済ませる」話に思えるが、not sock money は「靴下程度でなく」。',
      use: 'Let’s do it your way this time.（今回は君のやり方でやろう）' },

    // why: waste ← "blow big money" just before; price ← "Oh my god" three times heard as shock at a price tag
    { id: 'i3', skill: 'infer', level: 'B2', point: 'nerd', seg: [206.8, 213.15],
      stem: 'Why does Ben suddenly call his choice ridiculous?',
      choices: ['He hears the “nerd” remark as a put-down', 'He agrees it’s a waste of big money',
                'He hears “Oh my god” as shock at the price'], a: 0,
      cue: '「You’re right」が何に答えているか。',
      line: 'This is a whole new *level of nerd*. — *You’re right*. This is ridiculous.',
      said: '「オタクの新しいレベル」と言われ、「そうだね、ばかげてる」と返す。',
      mean: '直前の一言への返事。nerd を悪口と取り、恥ずかしくなった。',
      trap: 'Oh my god を値段への驚きと取りやすい。right が何への返事か聞く。',
      use: 'You’re right. What was I thinking?（そうだね。何考えてたんだろう）' },

    // C2: what "somehow" lets slip (deepens i3)
    // anchor: 214.0–222.3 s "I mean that in a good way, Ben… you're part of the treat yourself team now… If that costume
    //   somehow makes you happy, you're going to buy it": full backing, so "somehow" can only mark that they don't
    //   share the taste
    // R fix: V2 (blind 60 %): "but back him anyway" was the only two-sided choice; all three now pair a view with how
    //   far they back him.
    // why: doubt ← "somehow" read as a real hedge (本当に喜ぶかは疑問; the literal hedge); cost ← "blow big money" and
    //   a costume sounds pricey (a keyword from earlier)
    { id: 'nt2', skill: 'attitude', level: 'C2', point: 'nerd', reveals: ['gonna'], seg: [206.8, 222.6],
      stem: 'In the line about the costume making Ben happy, what does “somehow” let slip?',
      choices: ['They don’t get why, but they’re fully behind him', 'They doubt it will work, so they’re half behind him',
                'They think it costs too much, but they’re behind him'], a: 0,
      cue: '同じ文の後半が、どれだけ言い切っているか。',
      line: 'I mean that *in a good way*, Ben. … If that costume *somehow* makes you happy, you’re going to buy it.',
      said: '「いい意味で」と言い直し、「その衣装がなぜか君を幸せにするなら、買うんだ」と押す。',
      mean: 'somehow は「理由は分からないけど」。自分たちには魅力が分からないと漏らしつつ、全面的に応援している。',
      trap: '控えめな語は疑いに聞こえやすい。同じ文で強く言い切っていたら、ぼかしは「分からない」の印。',
      use: 'If it somehow works for you, great.（なぜか君に合うなら、それでいい）' },

    // R fix: V2 (blind 65 %): "warn him of the cost" was a filler; a tease (after "a whole new level of nerd") replaces it.
    // why: forecast ← "going to" learned as a prediction (〜するだろう); tease ← "a whole new level of nerd" just before
    { id: 'pr4', skill: 'pragma', level: 'C1', point: 'gonna', seg: [218.7, 226.15],
      stem: 'What do the “you’re going to…” lines about the costume do?',
      choices: ['Push him to go ahead and do it', 'Predict what he’ll end up doing',
                'Tease him about how he’ll look in it'], a: 0,
      cue: '同じ形の文が3つ続く。言い方の強さ。',
      line: '*you’re going to buy it*. *You’re going to wear it* out of the store, okay? You’re going to treat yourself.',
      said: '「買うんだよ。着たまま店を出るんだ。自分にごほうびだ」と3回くり返す。',
      mean: 'You’re going to ～ を重ねて背中を押す。予想ではなく、強い勧め。',
      trap: 'going to を予想と覚えていると占いに聞こえる。重ねて言い切るときは指示。',
      use: 'You’re going to rest. No arguing.（休むんだよ。反論なし）' },

    // R fix: V2 (blind 50 %): two dating choices now (split up / still together), plus the 見る reading.
    // why: still together ← "seeing each other… recently" heard without "stopped"; moved away ← "seeing" read as 見る
    { id: 'f5', skill: 'phrase', level: 'B2', point: 'seeing', seg: [250.85, 260.95],
      stem: 'What does Ben say happened with a woman?',
      choices: ['They dated for a while, and then split up', 'They dated for a while, and still see each other',
                'He saw her around a lot, then she moved away'], a: 0,
      cue: '同じ動詞が2回。2回目の直前の語。',
      line: 'I was *seeing a woman*… for a while, and then we *stopped seeing each other*… pretty recently.',
      said: '「付き合った人がいて、最近会わなくなった」と話す。',
      mean: 'see ＝ 付き合う。stopped seeing each other は「別れた」のやわらかい言い方。',
      trap: 'seeing を「見る」と取ると見かけた話になる。人を see なら交際を疑う。',
      use: 'Are you seeing anyone?（今付き合ってる人いる？）' },

    // R fix: V2 (blind 55 %), §9.5, N7: "you're being off your game" isn't English; "you're" (the near sound of
    //   "you've") replaces it. said gives away f5's key, so it reveals seeing.
    // why: you were ← the weak 've lost and "been" heard as a past; you'd been ← 've and 'd both shrink to one small
    //   sound; you're ← 've and 're both a short sound after "you", and "been" lost
    { id: 's1', skill: 'sound', level: 'B2', point: 'youvebeen', reveals: ['seeing'], seg: [259.5, 263.4],
      stem: 'Fill the gap: “That’s why ___ off your game.”',
      choices: ['you’ve been', 'you were', 'you’d been', 'you’re'], a: 0,
      cue: '「That’s why」のすぐあと、弱い2語。',
      line: 'That’s why *you’ve been* off your game.',
      said: '最近別れたと聞き、「だから調子が出なかったんだ」と言う。',
      mean: '’ve はほぼ v だけで「ユヴビン」とつながる。最近まで続いた状態。',
      trap: '’ve が消えると you were や you’re に聞こえる。been があれば前に have がある。',
      use: 'You’ve been quiet lately.（最近静かだね）' },

    // R fix: V2 (blind 60 %): choices reworded to one length and register, so the key isn't the only playful one.
    // why: makes fun ← "Batman's crying" just before sounds like teasing; buy something ← every "treat yourself"
    //   today has meant buying
    { id: 'h3', skill: 'humor', level: 'C1', point: 'cry', seg: [271.65, 277],
      stem: 'Why does the last piece of advice to Ben get a laugh?',
      choices: ['It treats a cry as one more thing to splurge on', 'It tells him to cheer up by buying himself a gift',
                'It teases him for crying in the middle of a mall'], a: 0,
      cue: '今日の合言葉のあと、何が続くか。',
      line: 'why don’t you *let it out*? *Treat yourself to a good cry*.',
      said: '「大丈夫。今は泣いちゃえ。思いきり泣くごほうびを」と言う。',
      mean: '買い物の合言葉を泣くことに使う。泣くのまで、ごほうびの一つになるのがおかしい。',
      trap: 'treat yourself と聞くと買い物を思い浮かべるが、to のあとは a good cry。',
      use: 'Sometimes you need a good cry.（たまには思いきり泣くのもいい）' },
  ]
};
