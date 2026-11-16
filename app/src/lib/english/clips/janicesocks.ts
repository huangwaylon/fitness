// “Chandler Can't Break Up with Janice | Friends” (the official Friends channel, Best of Season 1): at the coffee
// house Janice talks about her awful day and gives Chandler a pair of Bullwinkle socks; back with his friends, he
// calls it “really hard” and gets teased about the hug.
// Segments from the captions, words from whisper (2026-11-16). Whisper loops “I'm still working on my car” from 77 s
// and runs ≈5 s early after 69 s; the captions' times are used. Untested: 26–37 s (“I'm looking… What? What?”, a
// visual beat; “Did you get me there?” is unclear in both), and who orders the drinks (12.4 s: “Could” vs “Can”).
// EAR CHECK: 75.7–81.7 s g2 i3 a2 h1 nt1 nt2 — “Yeah, it was really hard” and “Okay, you weren't there” are Chandler,
//   “That's it?” and “the hug looked pretty brutal” a friend (no name is said; assumed from content)
// EAR CHECK: 81.7 s g2 h1 nt1 — the captions put “there” at 88.8 s, whisper ≈5 s after “That's it?” (≈81.8 s);
//   confirm “there” ends before 84 s
// EAR CHECK: 68.7–74.7 s pr1 — the captions put “mine” at 74.7 s, after the laugh; whisper ends the line at ≈69.8 s
// REVIEW 2026-11-16: pass 7, fix 12, drop 0, new 0; ear checks 3 (unchanged)
import type { Clip } from '../types.ts';

export const janiceSocks: Clip = {
  id: 'janicesocks', video: 'DiV379Hkl2E', title: 'Chandler Can’t Break Up with Janice', dur: 94, wpm: 172,
  band: 'mid', tags: ['恋愛', '店・レストラン'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 65 %): the "her work… a shoot" choice was the odd one out; all three now open "Talks about her
    //   day, then…"
    // why: help ← "so glad you called me" + an awful day sound like she needs support; photos ← "we got the proofs back"
    //   heard as her bringing them to show him
    { id: 'g1', skill: 'gist', level: 'B1', point: 'visit', seg: [0.8, 59.5],
      stem: 'What does Janice mostly do during this visit?',
      choices: ['Talks about her day, then gives him a present', 'Talks about her day, then asks for his help',
                'Talks about her day, then shows him her photos'], a: 0,
      cue: '前半の一日の話のあと、話がどう変わるか。',
      line: 'I *got you these*.',
      said: 'ひどい一日だった話をしてから、「あなたにこれを買ってきたの」と贈り物を渡す。',
      mean: '落ち込んだ日でも彼のことを考えていた。話の中心は彼女の一日と贈り物。',
      trap: 'so glad you called は「会えてうれしい」。頼みごとかは後半の動詞で決まる。',
      use: 'I picked up a little something for you.（ちょっとしたものを買ってきたよ）' },

    // R fix: K1/N1: "and asked to meet" isn't said by anyone; the choices now claim only who phoned
    // why: Janice called ← "called" is heard, but who called whom flips (you called me / I called you); by chance ←
    //   the café is the usual run-into-someone script
    { id: 'd3', skill: 'detail', level: 'B2', point: 'called', seg: [1.0, 5.2],
      stem: 'From Janice’s first lines, how did this meeting come about?',
      choices: ['Chandler had phoned her', 'Janice had phoned him', 'They met by chance at the café'], a: 0,
      cue: '最初の「so glad」のあと、誰が誰に？',
      line: 'I am so glad *you called me*.',
      said: '「電話してくれて本当にうれしい」と言っている。',
      mean: '電話をかけたのはチャンドラーの方。彼から会おうと言ったことが分かる。',
      trap: 'called だけ拾うと、どちらがかけたか分からない。you と me の位置で「誰が誰に」を聞く。',
      use: 'Thanks for calling me back.（折り返しありがとう）' },

    // R fix: V2/K6 (blind 70 %): the key was the only positive choice and "annoyed" was a filler; now a half-positive
    //   "happy but worn out" and a bad-timing reading
    // why: worn out ← "the most supremely awful day" taken as her mood; bad time ← "Oh, my God" heard as exasperation
    //   (日本語の「もう…」), the call as an interruption
    { id: 'a3', skill: 'attitude', level: 'B1', point: 'called', seg: [1.0, 9.4],
      stem: 'How does Janice sound when she first greets Chandler?',
      choices: ['Delighted to hear from him', 'Happy, but too worn out to talk',
                'Stressed: he caught her at a bad time'], a: 0,
      cue: '名前を呼ばれた直後、Oh my God のあと。',
      line: 'Oh, my God. *I am so glad* you called me.',
      said: '「わあ、電話くれて本当にうれしい」と言ってから、最悪の一日の話を始める。',
      mean: 'so glad ＝ とてもうれしい。ひどい日でも、彼から連絡が来て喜んでいる。',
      trap: 'awful day が強く聞こえるので疲れて見えるが、最初の一言が気持ちを表す。',
      use: 'I’m so glad to see you.（会えてすごくうれしい）' },

    // why: caught me ← called/caught differ only in the l/t before "me", both weak; called back ← the weak "me" is
    //   lost and "back" fills the gap
    { id: 's1', skill: 'sound', level: 'B2', point: 'called', seg: [1.8, 5.2],
      stem: 'Fill the gap: “I am so glad you ___.”',
      choices: ['called me', 'caught me', 'called back'], a: 0,
      cue: '「glad you」のあと、短い2語。',
      line: 'I am so glad *you called me*.',
      said: '「電話をくれてうれしい」。called の l は暗く、「コーゥド」に近い。',
      mean: 'called me は「コーゥミ」とつながり、d がほぼ消える。',
      trap: 'caught の t も消えやすく似て聞こえる。l の「ゥ」があれば called。',
      use: 'So glad you made it!（来てくれてうれしい！）' },

    // why: two espressos ← "another espresso" later, and "an" heard as a number; a tea ← the end of "latte" heard as
    //   "tea"
    { id: 'd2', skill: 'detail', level: 'B1', point: 'order', seg: [11.9, 15.3],
      stem: 'What drinks are ordered after Janice’s first lines?',
      choices: ['An espresso and a latte', 'Two espressos and a tea', 'A latte and a cup of tea'], a: 0,
      cue: '「over here」の前、2つの飲み物。',
      line: '…*an espresso and a latte* over here, please?',
      said: '「エスプレッソとラテを1つずつ、こっちにお願い」と注文している。',
      mean: 'over here ＝「こっちのテーブルに」。席から店員に頼むときの言い方。',
      trap: 'and a が「アンナ」とつながり、数が聞き取りにくい。latte の最後は「テイ」。',
      use: 'Could I get a refill over here?（こっちにおかわりをもらえますか）' },

    // why: vegetables went bad ← "the little vegetables" heard, but they're what the shoot was of; called off ← a
    //   bad day + "photo shoot" = the usual cancellation story
    { id: 'd1', skill: 'detail', level: 'B2', point: 'proofs', reveals: ['sucked'], seg: [15.2, 20.3],
      stem: 'Why was Janice’s day so bad?',
      choices: ['The photos from a shoot came out badly', 'The vegetables for a shoot went bad',
                'A photo shoot was called off at the last minute'], a: 0,
      cue: '「photo shoot」のあと、「Anyway」に続く部分。',
      line: 'we got *the proofs back* in that photo shoot… Anyway, they *pretty much sucked*.',
      said: '撮影の確認用写真が届いたが、「ほぼ最悪だった」と言う。',
      mean: 'proofs ＝ 仕上がり確認用の写真。その出来の悪さが一日の原因。',
      trap: 'vegetables は撮影したものの説明。「the one with」は「〜のやつ」と前の話を指す。',
      use: 'The pictures came out great!（写真、すごくよく撮れてた！）' },

    // R fix: S1 (blind 55 %): "the bit about" in the stem flagged the vegetables as an aside, which gave the key
    // why: new topic ← "anyway" often moves on to something else; doesn't care ← "anyway" read as 「どうでもいいけど」
    //   about the result
    { id: 'm1', skill: 'marker', level: 'B2', point: 'anyway', seg: [17.0, 20.3],
      stem: 'Right after Janice mentions the little vegetables, what does her next word do?',
      choices: ['Brings her back to her main story', 'Moves her on to a whole new topic',
                'Shows that the result doesn’t bother her'], a: 0,
      cue: '「vegetables」の直後の短い一語。',
      line: 'the one with the little vegetables? *Anyway*, they…',
      said: '撮影の説明を少し足してから、「とにかく」と本題に戻る。',
      mean: 'anyway は脇道から本筋に戻る合図。このあとに言いたいこと（写真の出来）が来る。',
      trap: '「どうでもいいけど」の意味もあるが、ここはそのあとも同じ話が続く。',
      use: 'Anyway, where was I?（それで、どこまで話したっけ）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'sucked', reveals: ['proofs'], seg: [18.35, 20.4],
      stem: 'Type what she says: “They ___.” (3 words)', answer: 'pretty much sucked',
      cue: '「Anyway」のすぐあと。pretty の t は弾む。',
      line: 'Anyway, they *pretty much sucked*.',
      said: '「まあ、ほぼ最悪だった」と言っている。',
      mean: 'pretty much ＝ ほぼ・だいたい。sucked は「最悪だった」のくだけた言い方。',
      trap: 'pretty の t は「ラ」に近く「プリディ」。much と sucked もつながって短く聞こえる。',
      use: 'I’m pretty much done here.（もうほとんど終わったよ）' },

    // why: lost her temper ← "blew" heard as "blew up"; stayed late ← a bad result at work = the "fix it" script
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'blewoff', reveals: ['shopping'], seg: [19.7, 23.3],
      stem: 'After the bad news, what did Janice do with her afternoon?',
      choices: ['She skipped the rest of her work', 'She lost her temper for the rest of it',
                'She stayed late to fix the photos'], a: 0,
      cue: '「So I」のあとの動詞と、その次の文。',
      line: 'So I *blew off* the rest of the afternoon. I went shopping.',
      said: '「だから午後の残りはサボって、買い物に行った」と言う。',
      mean: 'blow off ＝ 予定や仕事をすっぽかす。直後の shopping で意味が裏づけられる。',
      trap: 'blow up（かっとなる）と混ざりやすい。off は「やめて離れる」感じ。',
      use: 'I blew off the gym today.（今日はジムをサボった）' },

    // why: to bed ← the usual bad-day script; back to work ← "photo shoot" and the proofs just before
    { id: 'd4', skill: 'detail', level: 'B1', point: 'shopping', seg: [19.7, 23.3],
      stem: 'What did Janice do after hearing about the photos?',
      choices: ['She went shopping', 'She went to bed', 'She went back to work'], a: 0,
      cue: '「afternoon」のあとの短い文。',
      line: '*I went shopping*.',
      said: '写真の話のあと、「買い物に行ったの」と言う。',
      mean: 'went shopping ＝ 買い物に行った。気分を変えたいときの定番の行動。',
      trap: 'went は弱く、I went がつながって短い。動詞のあとの -ing の語をしっかり聞く。',
      use: 'I went shopping to cheer myself up.（気晴らしに買い物に行った）' },

    // R fix: V2/K5 (blind 50 %): "Photos of the Rockies" was the odd one out; all three are now things she could own
    // why: Bullwinkle pair ← Bullwinkle is the name just heard; a trip ← "had the Rockies" heard as the Rocky
    //   Mountains (a holiday)
    { id: 'i1', skill: 'infer', level: 'B2', point: 'rockies', seg: [46.2, 56.9],
      stem: 'When Janice explains her choice, what does she say he already has?',
      choices: ['A pair of Rocky socks', 'A pair of Bullwinkle socks', 'A trip booked to the Rockies'], a: 0,
      cue: '「I knew you had」のあとと、続く組み合わせの話。',
      line: 'I knew you *had the Rockies*… you could wear *Rocky and Rocky*',
      said: '「Rocky のを持ってるから、組み合わせられるでしょ」と説明する。',
      mean: 'the Rockies ＝ Rocky 柄の靴下。手持ちと組めるように選んだ。',
      trap: 'Rockies は山脈の名前でもあり、旅行の話に聞こえやすい。続く組み合わせの話で判断。',
      use: 'I knew you liked blue, so…（青が好きだって知ってたから…）' },

    // R fix: V2 (blind 65 %): the one-a-day filler went; the new distractor is the literal "match" (服に合わせる)
    // why: swap ← "Whatever you want" heard as an offer to exchange; outfit ← "match" read as matching his clothes
    { id: 'f2', skill: 'phrase', level: 'B1', point: 'mix', seg: [51.6, 57.4],
      stem: 'In Janice’s last suggestion, how can he wear the socks?',
      choices: ['One of each kind at the same time', 'Swap them for a kind he likes',
                'Match them to the rest of his outfit'], a: 0,
      cue: '「or you can」のあとの4語の言い方。',
      line: 'or you can *mix and match* moose and squirrel. Whatever you want.',
      said: '「ヘラジカとリスを組み合わせてもいいし、好きにして」と言う。',
      mean: 'mix and match ＝ 違う種類を自由に組み合わせる。左右で柄を変えてもいい。',
      trap: 'match を「服に合わせる」や「交換」と取ると別の意味に。mix とセットで「組み合わせ」。',
      use: 'You can mix and match the toppings.（トッピングは自由に組み合わせられます）' },

    // R fix: V2 (blind 50 %): the lone "Accepts" choice made the two refusals a pair; now three refusals with different
    //   reasons. Its stem shows a latte was ordered, so it reveals `order`
    // why: time to work ← "working" taken literally (仕事); espresso ← "another espresso" said just before
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'working', reveals: ['order'], seg: [61.5, 75.2],
      stem: 'When more latte is offered, what does the reply do?',
      choices: ['Turns it down: the first cup isn’t finished', 'Turns it down: it’s time to get back to work',
                'Turns it down: an espresso sounds better'], a: 0,
      cue: '「No」を2回言ったあと、理由の部分。',
      line: 'No. No. I — I’m *still working on mine*.',
      said: 'おかわりを勧められ、「いや、まだ自分のを飲んでる途中」と答える。',
      mean: 'work on ～ ＝ 〜に取りかかっている途中。飲食物なら「まだ残ってる」の意味。',
      trap: 'working を「仕事」と取りやすい。on のあと（mine＝自分の飲み物）を聞く。',
      use: 'I’m still working on this, thanks.（まだ食べてます、どうも）' },

    // R fix: V2 (blind 75 %): the key was the only tease; a second tease with the wrong target (the socks) replaces
    //   "asking for more"
    // why: comforting ← "brutal" and "really hard" taken at face value; socks ← right mechanism, wrong target: the
    //   gift is the scene's other talking point
    { id: 'g2', skill: 'gist', level: 'C1', point: 'tease', reveals: ['brutal', 'thatsit'], seg: [68.5, 84],
      stem: 'In the closing exchange, what are Chandler’s friends doing?',
      choices: ['Teasing him for making it sound so hard', 'Comforting him after a really hard talk',
                'Teasing him about the socks he got'], a: 0,
      cue: '最後のやりとり。「hug」と組む形容詞。',
      line: '*That’s it?* … the hug looked pretty *brutal*.',
      said: '「それだけ？」「大変だったよ」「ハグ、すごく過酷そうだったね」とやりとりする。',
      mean: '友だちは、ハグしかしていないのに大変ぶる彼をからかっている。',
      trap: 'brutal や hard を文字通りに取ると、なぐさめに聞こえる。何に対して言っているかを聞く。',
      use: 'Oh yeah, that looked really tough.（へえ、それは大変そうだね〔皮肉〕）' },

    // R fix: V2 (blind 55 %): "took far too long" is the opposite of "That's it?"; the new distractor is relief
    // why: relieved ← "That's it?" heard as 「やっと終わった？」; Janice left ← she has just gone for an espresso
    { id: 'i3', skill: 'infer', level: 'C1', point: 'thatsit', seg: [75.2, 78.3],
      stem: 'What does a friend’s first question at the end suggest?',
      choices: ['They expected Chandler to do much more', 'They are relieved it is finally over',
                'They are surprised Janice left so soon'], a: 0,
      cue: '最初の質問の「it」が何を指すか、返事から。',
      line: '*That’s it?* — Yeah, it was really hard.',
      said: '友だちが「それだけ？」と聞き、彼は「大変だったんだよ」と答える。',
      mean: 'That’s it? ＝「え、それで終わり？」。もっと何かが起きるはずだったという期待。',
      trap: '「やっと終わった？」の安心にも聞こえるが、返事は「大変だった」。中身の少なさへの驚き。',
      use: 'That’s it? I thought there was more.（それだけ？もっとあると思った）' },

    // R fix: V2 (blind 70 %): the key was the only dig; the new distractor is a dig with the wrong target (Janice)
    // why: sympathy ← "brutal" taken at face value; dig at Janice ← "the hug… brutal" heard as a joke about her hugs
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'brutal', seg: [75.2, 81],
      stem: 'When a friend comments on the hug, how is it meant?',
      choices: ['As a dig at him: that was hardly an ordeal', 'As sympathy: it looked painful to do',
                'As a dig at Janice: her hugs are too much'], a: 0,
      cue: '小さな出来事と、それに付く強い形容詞。',
      line: 'Oh, yeah, the hug looked pretty *brutal*.',
      said: '「ああ、あのハグはかなり過酷そうだったね」と言う。',
      mean: 'brutal（残酷な・過酷な）をハグに使う大げさな言い方。からかいの皮肉。',
      trap: '強い言葉をそのまま取ると同情に聞こえる。小さな事に大きな言葉が付いたら皮肉を疑う。',
      use: 'Wow, that sounds brutal.（うわ、それはきつそう）' },

    // C2: which reply would show he understood (cf. a2)
    // anchor: 75.7–80.6 s "That's it?", then "the hug looked pretty brutal": a word that big for a hug, after
    //   "That's it?", can only be a dig
    // R fix: C2 §3 (blind 70 %): both distractors were the sympathy misreading, so the key was the odd one out; one is
    //   now the blame misreading
    // why: thanks ← "brutal" taken as sympathy (the お礼 frame); rough ← "brutal" heard as the hug hurting Janice
    { id: 'nt2', skill: 'pragma', level: 'C2', point: 'brutal', seg: [75.2, 81],
      stem: 'Which reply from Chandler would show he got what the friend meant?',
      choices: ['Okay, okay. It was just a hug.', 'Thanks. It really was awful.', 'Hey, I wasn’t rough with her!'],
      a: 0,
      cue: '「That’s it?」の直後に、ハグをどう言ったか。',
      line: 'That’s it? … the hug looked *pretty brutal*.',
      said: '「それだけ？」のあと、友だちが「ハグ、かなり過酷そうだったね」と言う。',
      mean: 'ハグに brutal は大げさすぎるので、同情の形をしたからかい。気づいたなら、認めて苦笑いするのが合う返事。',
      trap: '同情の言葉にはお礼、という型で選びやすい。返事は言葉の形でなく、相手が言いたいことに返す。',
      use: 'Fair enough. I’m overreacting.（確かに。大げさだね）' },

    // why: admits nothing happened ← "you weren't there" heard as a confession; friend left early ← "weren't there"
    //   taken literally, missing "looked"
    { id: 'h1', skill: 'humor', level: 'C1', point: 'there', seg: [75.2, 84],
      stem: 'Why does Chandler’s last reply get a laugh?',
      choices: ['The friend has just said how it looked', 'He is admitting that nothing happened',
                'The friend had left before the hard part'], a: 0,
      cue: '直前の友だちの文の動詞（見た？聞いた？）。',
      line: 'the hug *looked* pretty brutal. — Okay, *you weren’t there*.',
      said: '「ハグ、過酷そうだった」に「君はいなかっただろ」と返す。',
      mean: 'looked で、友だちが見ていたと分かる。なのに「いなかった」と言うのがおかしい。',
      trap: 'weren’t there だけだと、途中で帰ったように聞こえる。直前の looked と合わせる。',
      use: 'You had to be there.（その場にいないと分からないよ）' },

    // C2: who is the joke on (cf. h1)
    // anchor: 75.7–81.7 s "That's it?" → "it was really hard" → "the hug looked pretty brutal" → "you weren't there":
    //   the dig and the failed comeback are both about Chandler's "really hard"
    // R fix: C2 §3 (blind 75 %): "Janice, who has no idea…" was a filler; now right mechanism, wrong target (her hug)
    // why: the friend ← "you weren't there" is Chandler's try at turning it on them; Janice ← "the hug… brutal" heard
    //   as a joke about her hugging
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'there', reveals: ['brutal', 'thatsit'], seg: [75.2, 84],
      stem: 'In the closing exchange, who is the joke on?',
      choices: ['Chandler, who makes a hug sound like an ordeal', 'The friend, who is judging it from the outside',
                'Janice, whose hug is made to sound brutal'], a: 0,
      cue: '「really hard」と言ったのは誰で、何についてか。',
      line: 'Yeah, it was *really hard*. … the *hug* looked pretty brutal.',
      said: '「本当に大変だった」に友だちが「ハグ、過酷そうだったね」と返し、彼は「いなかっただろ」と言う。',
      mean: '笑われているのは、ハグだけの事を大仕事のように語る本人。言い返しも、見られていたので空振り。',
      trap: '友だちが責められて聞こえるが、looked で見ていたと分かる。笑いの的は大げさに語った側。',
      use: 'Okay, maybe I made it sound worse.（まあ、ちょっと大げさに言ったかも）' },
  ]
};
