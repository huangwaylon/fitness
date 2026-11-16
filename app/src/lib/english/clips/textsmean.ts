// “What texts REALLY mean - The Office US” (the official The Office channel, BEST OF The Office - Season 8): at a dinner,
// Val's boyfriend Brandon, serving the food, accuses Darryl of chasing Val; the guests make Darryl read his texts aloud
// and argue over what five dots mean.
// Segments from the captions, words from whisper (2026-11-16). Untested: 7.9–11.7 s (no captions), 23.5–30.5 s (the
// accusation and Kevin's reply: a bleeped f-word, left out on purpose), 33.8 s ("play dumb" / captions "play done"),
// 43.5 s ("y'all" / "you all"), 47.7–50.4 s ("Thornwood Wholesalers. One order."), 54.9 s ("would" / "will"), 58.3 s
// ("I'm not sure if" / "I'm pretty sure if"), 76 s (the guest's name: "Ellie" / "holly"), 96.5 s ("Yeah, sorry":
// speaker unclear), 136–155 s (whisper loops one line over the outro).
// REVIEW 2026-11-16: pass 2, fix 18, drop 1, new 1; ear checks 3 (unchanged)
// Open: a2 assumes "Five dots, Darryl? Are you kidding me?" is the woman who explains the dot rule next; the key no
//   longer depends on it, but the speaker is unconfirmed.
// EAR CHECK: 16.3–16.9 s s1, 22.0–22.3 s nt1, 81.9–82.6 s x1 — both sources agree on the words; confirm the "not" in
//   "I'm not actually" is weak but there, that "You doing good?" has no "are", and that "for once in my life" runs together
// EAR CHECK: 73.25 s r1 — the cut falls after "grown-ups here" and before "Thank you" (a 0.2 s gap)
// EAR CHECK: 124.8–132.4 s nt3 — Darryl's "Yeah. Totally crazy…" comes after a pause and sounds forced, not relaxed
import type { Clip } from '../types.ts';

export const textsMean: Clip = {
  id: 'textsmean', video: 'bDYGCjvgVWU', title: 'What texts REALLY mean', dur: 155, wpm: 158, band: 'mid',
  tags: ['友だち', '恋愛'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 70 %): game/argument fillers replaced by a "Darryl clears himself" and a "Val shows off" reading
    // why: Darryl offers ← he denies it all, so reading them looks like his way to clear himself, but the guests demand
    //   it ("Darryl, read the text!"); Val shows him off ← she is at the center and later says "it's ridiculous, right?"
    { id: 'g1', skill: 'gist', level: 'B2', point: 'scene', reveals: ['boyf', 'readtext'], seg: [0, 86],
      stem: 'Why do the guests end up hearing Darryl’s texts read out?',
      choices: ['Brandon suspects Darryl of chasing Val', 'Darryl offers to prove they’re just friends',
                'Val wants everyone to see how sweet he is'], a: 0,
      cue: 'ブランドンが最初に責める内容と、読んだもの。',
      line: 'I read the text you sent to Val, man.',
      said: '給仕のブランドンは、恋人ヴァルとダリルの仲を疑い、ダリルのメッセージを読んだと責める。',
      mean: '疑いを晴らすか確かめるかで、メッセージをみんなの前で読む流れになる。',
      trap: '読むのはダリル本人だが、言い出すのはまわり。誰が始めたかを、最初の責めの言葉から聞く。',
      use: 'Let’s just clear the air.（はっきりさせちゃおう）' },

    // R fix: V2 (blind 70 %): "brother"/"coworker" swapped for near sounds of the clipped word
    // why: best friend ← "boyf" heard as the texting short form BF; boss ← "boyf" and "boss" share b-o and a soft end
    { id: 'd1', skill: 'detail', level: 'B2', point: 'boyf', seg: [0, 7.6],
      stem: 'How is Brandon connected to Val?',
      choices: ['Her boyfriend', 'Her best friend', 'Her boss'], a: 0,
      cue: '名前のすぐあと、短く切った語。',
      line: 'our server is none other than Brandon, *her boyf*.',
      said: '「料理はヴァル経由、給仕はなんとブランドン、彼女の彼氏」と紹介する。',
      mean: 'boyf は boyfriend を途中で切った、くだけた言い方。',
      trap: '語の後ろが切れていて、boss や略語の BF（親友）と混ざりやすい。her のあとの語を最後まで聞く。',
      use: 'This is Sam, my boyfriend.（こちらサム、私の彼氏）' },

    // R fix: V2 (blind 55 %): "barely knows him" filler replaced by a cook reading of "this food comes to us"
    // why: no one else free ← "none other" read word by word as "nobody else could"; cooked it ← "this food comes to
    //   us through Val, and our server…" heard as one credit line
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'noneother', reveals: ['boyf'], seg: [0, 7.6],
      stem: 'When the server is introduced, what does the wording before his name do?',
      choices: ['Builds him up like a special guest', 'Says no one else was free to serve',
                'Stresses that he cooked it all himself'], a: 0,
      cue: 'server is のあと、名前の前の数語。',
      line: 'our server is *none other than* Brandon, her boyf.',
      said: '給仕を紹介するとき、名前の前に「ほかでもない」と付ける。',
      mean: 'none other than ＝ なんと、あの。名前を大物のように盛り上げる、少しおどけた言い方。',
      trap: '一語ずつ訳すと「ほかに誰もいない」になる。驚きの前置きとして覚える。',
      use: 'And the winner is none other than you!（そして勝者は、なんとあなた！）' },

    // R fix: V2: "Oh, no" left the stem, since it ruled out "actually" without listening
    // why: actually ← "not" is weak and runs into "actually"; not exactly ← the same rhythm, a softer correction
    { id: 's1', skill: 'sound', level: 'B2', point: 'jamaican', seg: [11.2, 18.5],
      stem: 'Fill the gap: “I’m ___ Jamaican.”',
      choices: ['not actually', 'actually', 'not exactly'], a: 0,
      cue: 'I’m と Jamaican の間の音。',
      line: 'Oh, no, I’m *not actually* Jamaican.',
      said: '「ジャマイカの選挙、大変だね」と言われ、「実はジャマイカ人じゃない」と返す。',
      mean: 'not actually ＝ 実は〜ではない。思い込みをやわらかく正す。',
      trap: 'not は弱く actually とつながる。直前の Oh, no が否定の予告。',
      use: 'I’m not actually from here.（実はここの出身じゃないんです）' },

    // R fix: V2 (blind 65 %), K1: "annoyed" rests on tone alone; now a literal "glad" reading and a Japanese apology frame
    // why: glad he isn't from there ← "terrific" taken literally after "the elections… crazy stuff"; apologizes ← the
    //   Japanese frame, where a wrong guess calls for すみません
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'terrific', reveals: ['jamaican'], seg: [11.2, 18.5],
      stem: 'After Brandon says he isn’t Jamaican, what does the one-word reply do?',
      choices: ['Glosses over his mistake and moves on', 'Owns up to his mistake and apologizes',
                'Says he is glad Brandon isn’t from there'], a: 0,
      cue: '思い込みを正された直後の、明るい一語。',
      line: 'I’m not actually Jamaican. — *Terrific.*',
      said: '「ジャマイカ人じゃない」と言われ、「すばらしい」とだけ返す。',
      mean: '中身のない明るい一語で、気まずさをごまかして話を切る。ほめているわけではない。',
      trap: 'terrific を文字どおり「よかった」と取りやすい。英語は明るい一語で流すこともある。',
      use: 'Great. Well, moving on…（そっか。じゃあ次へ…）' },

    // anchor: 21.0–22.3 s both sources: "I heard about you. You doing good?": three fast words with no "are", and
    //   "good" where school grammar wants "well"
    { id: 'nt1', skill: 'dict', level: 'C2', point: 'greet', seg: [19.9, 23.4],
      stem: 'Type what Brandon asks Darryl: “I heard about you. ___?” (3 words)', answer: 'you doing good',
      cue: 'I heard about you のすぐあと。文法より、聞こえた音を。',
      line: 'I heard about you. *You doing good*?',
      said: 'ダリルに「話は聞いてるよ。元気でやってる？」と聞く。3語が速くつながる。',
      mean: 'Are が落ち、well でなく good。会話では普通の形。I heard about you と並び、含みのあるあいさつ。',
      trap: '習った形に直して Are を足したくなる。書き取りは、言われた音だけを書く。',
      use: 'Hey, you doing okay?（ねえ、大丈夫？）' },

    // R fix: V2 (blind 75 %): "right then" left the stem; "hungry" became a get to / get back to near sound
    // why: start the meal ← "get back to" heard as "get to" (let's eat); praise ← "delicious-looking" heard as the
    //   point of the line
    { id: 'pr2', skill: 'pragma', level: 'B1', point: 'topic', seg: [33.5, 43.1],
      stem: 'When someone brings up the food, what is the aim?',
      choices: ['To steer everyone away from the fight', 'To get the meal started at last',
                'To praise how good the dishes look'], a: 0,
      cue: 'Hey! の直後、Let’s で始まる一言。',
      line: '*Let’s get back to the food.* Brandon, tell us about these delicious-looking goops.',
      said: '言い争いの最中に「料理の話に戻ろう」と言い、説明を頼む。',
      mean: 'get back to ～ ＝ 〜の話に戻る。けんかを止めて話題を変えたい。',
      trap: 'get to なら「始めよう」だが、back が入ると「戻ろう」。goops と並べたほめ言葉も本気でない。',
      use: 'Okay, let’s get back to the menu.（さて、メニューの話に戻ろう）' },

    // R fix: V2 (blind 55 %): three parallel text/direction choices
    // why: got a text ← "text" and "Val" heard without who sent it; sent Val one ← "you sent to Val" heard as "I sent"
    { id: 'd2', skill: 'detail', level: 'B1', point: 'readtext', seg: [47.3, 53.4],
      stem: 'What does Brandon say he did?',
      choices: ['Read a text Darryl sent Val', 'Got a text from Val about Darryl',
                'Sent Val a text about Darryl'], a: 0,
      cue: '誰が誰に送ったか、向きを聞く。',
      line: 'I *read the text you sent to Val*, man.',
      said: 'ダリルに向かって「お前がヴァルに送ったメッセージ、読んだぞ」と言う。',
      mean: 'read は過去形（レッド）。ヴァルの携帯で、ダリルが送った文を読んだ。',
      trap: 'text と Val だけ拾うと受け取った話に聞こえる。you sent で、送ったのはダリル。',
      use: 'Did you read the text I sent?（送ったメッセージ読んだ？）' },

    // R fix: V2 (blind 50 %): "Val let him" filler replaced by the "anyone would" defense
    // why: wrong but had to know ← the usual "sorry, but…" script for snooping; anyone would ← the common defense,
    //   but he argues from what he found, not from what others would do
    { id: 'i1', skill: 'infer', level: 'C1', point: 'snoop', reveals: ['readtext'], seg: [50.4, 58.2],
      stem: 'When someone calls his snooping messed up, how does Brandon defend it?',
      choices: ['It’s only wrong if you find nothing', 'It was wrong, but he needed to know',
                'Anyone would check, in his shoes'], a: 0,
      cue: 'it would be のあと、文の組み立て。',
      line: 'It would be messed up *if I didn’t find anything, but I did*, so…',
      said: '「見るなんておかしい」に「何も見つからなきゃおかしいけど、見つけたから」と返す。',
      mean: 'のぞき見を、見つけたもので正当化する。悪いとは認めていない。',
      trap: '謝ってから言い訳する型を当てはめやすい。I did のあとに謝罪はなく、so… で開き直っている。',
      use: 'I had a good reason, okay?（ちゃんと理由があったんだ）' },

    // R fix: V2 (blind 60 %): three "It makes…" choices, so the key is no longer the only one about the excuse
    // why: sounds normal ← the example taken literally, hospitals do have emergencies; Brandon's worry ← the defense
    //   heard as aimed at his jealousy
    { id: 'h1', skill: 'humor', level: 'C1', point: 'napkins', seg: [58.1, 69.85],
      stem: 'Why does the hospital example get a laugh?',
      choices: ['It makes the excuse even harder to believe', 'It makes the excuse sound perfectly normal',
                'It makes Brandon’s worry look silly'], a: 0,
      cue: 'At midnight? のあと、例として挙げる場面。',
      line: '*At midnight?* — Yeah. It happens. Like a hospital needs *more napkins for surgery*.',
      said: '「真夜中に紙の急用？」に「よくある。病院が手術にナプキンを要るとか」と答える。',
      mean: 'かばうつもりの例が、ありえない場面。言えば言うほど言い訳が苦しく聞こえる。',
      trap: '病院の急用は本当にあるので、もっともらしく聞こえる。手術にナプキン、で例が崩れる。',
      use: 'Bad example, but you get the idea.（例は悪いけど、言いたいことは分かるよね）' },

    // R fix: V2 (blind 50 %): "pushes the drama" was the only sitcom-loaded choice; three parallel "argument" moves
    // why: ends it ← "settle" and "grown-ups" set up the calm-down script; back to the food ← someone already
    //   tried that once (38.6 s)
    { id: 'r1', skill: 'predict', level: 'B2', point: 'texts', seg: [69.8, 73.25], then: [73.25, 75.55],
      stem: 'After “we just need to be grown-ups here”, what kind of suggestion follows?',
      choices: ['One that keeps the argument going', 'One that ends the argument for tonight',
                'One that turns everyone back to the food'], a: 0,
      cue: '「大人らしく」の続きが、どちらへ向かうか。',
      line: 'I think we just need to be grown-ups here. — Thank you. — *I think we’re going to need to hear those texts.*',
      said: '「大人になろう」のあと、「メッセージを聞かせてもらおう」と続く。',
      mean: '大人になろう、は普通「もうやめよう」の前置き。ここでは逆に、もっと調べる方へ進む。',
      trap: '落ち着かせる言葉のあとは収める話、という型。この場面では型が裏切られるのが笑いになる。',
      use: 'Let’s all be grown-ups about this.（みんな大人になろうよ）' },

    // R fix: V2 (blind 60 %): "excited… unfold" stood out; the rude/遠慮 choice gave way to an "embarrassed" reading of her "No."
    // why: still wants to go ← "you wanted to go home" heard as her wish now; embarrassed ← her quick "No." heard as
    //   denying she ever said it, out of shame
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'stay', seg: [75.3, 83.75],
      stem: 'When reminded she wanted to go home, how does the guest feel?',
      choices: ['Glad to stay now that it’s interesting', 'Still wanting to go, as she said before',
                'Embarrassed she ever wanted to leave'], a: 0,
      cue: 'No のあと、ここにいたい理由。',
      line: 'There’s no way… I’m leaving. … *I’m staying here.*',
      said: '「さっき帰りたがってたよね」と言われ、「絶対帰らない。ここにいる」と言い切る。',
      mean: '帰りたかったのが一転、目の前のもめごとが面白くて離れたくない。',
      trap: 'No だけ聞くと、帰りたかったことを恥じて否定したように取れる。no way の強さまで聞く。',
      use: 'No way. I’m not missing this.（絶対いや。これは見逃せない）' },

    // R fix: N7: the line ("Something interesting is happening here") gives away a1's key, so it reveals stay
    { id: 'x1', skill: 'dict', level: 'B1', point: 'foronce', reveals: ['stay'], seg: [80.45, 83.75],
      stem: 'Type the end: “Something interesting is happening here ___.” (5 words)', answer: 'for once in my life',
      cue: 'happening here のあと、文の終わりまで。',
      line: 'Something interesting is happening here *for once in my life*.',
      said: '「人生で一度くらい、ここで面白いことが起きてる」と言う。',
      mean: 'for once in my life ＝ 今回ばかりは。ふだんは退屈、という気持ち。',
      trap: 'for と in が弱く、once と life だけ残りやすい。一つの言い方として覚える。',
      use: 'For once in my life, I’m early!（生まれて初めて、時間より早い！）' },

    // R fix: V2 (blind 55 %), N7: "Val texted first" filler replaced by the earlier "paper emergency" excuse; said names
    //   the outraged reaction, so it reveals kidding
    // why: cleared ← Val's "it's ridiculous, right?" and Darryl's agreement at the end; about work ← the "paper
    //   emergency" excuse from before the reading
    { id: 'g2', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['kidding'], seg: [84, 133],
      stem: 'By the end, how have the texts changed things for Darryl?',
      choices: ['They make him look more suspect, not less', 'They clear him once the dots are explained',
                'They show it was all about work after all'], a: 0,
      cue: '読み上げのたびの、まわりの反応。',
      line: 'See? Yes. *Thank you, sister.*',
      said: '一通読むたびに周りが反応し、最後は点の数の話まで出て、疑いを強める人が出る。',
      mean: '普通の文だと言っても、点の数まで深読みされ、かえって怪しく見えてくる。',
      trap: '最後の「ばかげてるよね」で疑いが晴れたと取りやすい。それまでの反応の流れで結果を見る。',
      use: 'That only made it worse.（かえって悪くなったね）' },

    // R drop: w1 (who reads the texts): g1, nt2 and nt3's stems ("Darryl's texts", "As Darryl reads…") give the key
    //   away, and the vocative settles it without listening (V2/V3). Never shipped, so it's deleted.
    // R new: d3 replaces it, to keep literal at 4
    // why: fries ← "Getting my fry on" comes right after, outside the segment; a ride home ← "go home" was just said
    { id: 'd3', skill: 'detail', level: 'B1', point: 'icecream', seg: [85.9, 89.8],
      stem: 'In the first text Darryl reads, what does he offer Val?',
      choices: ['Some of his ice cream', 'Some of his fries', 'A ride home tonight'], a: 0,
      cue: '一通目、You want some? の前。',
      line: 'I got too much *ice cream*. You want some?',
      said: '一通目は「アイス買いすぎた。いる？」という、ごく普通の誘い。',
      mean: 'You want some? ＝ 少しいる？ 食べ物を分ける軽い誘い。',
      trap: '次の文の fry や、さっきの go home が残りやすい。You want some? の直前の物を聞く。',
      use: 'I made too much pasta. You want some?（パスタ作りすぎた。いる？）' },

    // R fix: S1: "she" dropped from the stem (the speaker is told only by voice)
    // why: ordinary texting ← Darryl's "regular text talk" just after; too silly ← "Oh, gosh" heard as laughing it off
    { id: 'p2', skill: 'phrase', level: 'C1', point: 'moon', seg: [92.6, 97.4],
      stem: 'When the moon text is read, how does a guest judge it?',
      choices: ['It makes Darryl look really guilty', 'It sounds like ordinary texting',
                'It is far too silly to prove anything'], a: 0,
      cue: 'Oh, gosh のあと、one’s に続く語。',
      line: 'The moon is huge tonight. — Oh, gosh. *The moon one’s damning.*',
      said: '「今夜は月が大きい」という文に、「うわ、月のやつは決定的」と言う。',
      mean: 'damning ＝ 不利な証拠になる。月の話はロマンチックで、恋の証拠に聞こえる。',
      trap: 'damn を「くそっ」という口ぐせと取りやすい。-ing の形は「不利にする」という評価。',
      use: 'The evidence is pretty damning.（証拠はかなり不利だね）' },

    // anchor: 99.8 s "You forgot one" (he skipped a text), 102.5 s "With the dots" (he read it without them), 107 s
    //   "Five dots, Darryl? Are you kidding me?"
    // R fix: V2 (blind 55 %), K3: "only sees Val as a friend" isn't something to hide; now a who-texted-most flip
    // why: how late ← midnight texts came up earlier, so the hour looks like the secret (scope shift); Val texted most ←
    //   "you forgot one" heard as pointing at her messages (direction flip); "Five dots, Darryl?" puts it on him
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'fivedots', seg: [97.4, 109.45],
      stem: 'As Darryl reads his texts, what is he trying not to show?',
      choices: ['The text that sounds more than friendly', 'How late at night the texts were sent',
                'That Val was the one who texted most'], a: 0,
      cue: '彼が飛ばしたものを、二度指摘される。',
      line: 'You forgot one. … *With the dots.*',
      said: '普通の文だと言って読み終えると「一つ忘れてる」と言われ、読んでも「点も付けて」と言われる。',
      mean: '一通を飛ばし、読んでも末尾の点を落とした。二度の指摘で、避けたものが浮かぶ。隠すほど意味ありげになる。',
      trap: '深夜の話はもう出ていて、隠すことではない。指摘された「飛ばしたもの」が何かを追う。',
      use: 'You skipped the best part.（一番いいところを飛ばしたね）' },

    // R fix: K1/N1: "his point" assumed the speaker; "Five dots… kidding me?" likely belongs to the woman who explains
    //   the rule next. Neutral wording, and "unsure" replaces "confused"
    // why: amused ← "kidding" heard as joking around; unsure ← "four dots is a typo" comes next, so the dots may mean
    //   nothing
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'kidding', seg: [102.2, 109.45],
      stem: 'When the dots are read out, how does the next speaker react?',
      choices: ['Outraged, as if it proves the point', 'Amused, as if it’s a harmless joke',
                'Unsure, as if the dots mean nothing'], a: 0,
      cue: '点の数を言ったあとの、決まり文句。',
      line: 'Five dots, Darryl? *Are you kidding me?*',
      said: '点が5つ付いた文に、「点5つだぞ、ダリル。ふざけてるのか？」と言う。',
      mean: 'Are you kidding me? はここでは怒りとあきれ。点の数を証拠と見ている。',
      trap: 'kid を「冗談」と取ると楽しそうに聞こえる。数を言って問い詰める形は、責める調子。',
      use: 'Are you kidding me? Again?（うそでしょ？また？）' },

    { id: 'n1', skill: 'number', level: 'B1', point: 'dotrule', seg: [109.3, 113.2],
      stem: 'In the dot rule that follows, how many dots mean just a typo?',
      choices: ['Three', 'Four', 'Five'], a: 1, keep: true,
      cue: 'to be continued のあとの数。',
      line: 'three dots means to be continued. *Four dots is a typo*, but five dots means…',
      said: '「点3つは『つづく』、4つはただの打ちミス、でも5つは…」と説明する。',
      mean: '点の数で意味が変わる、という冗談半分のルール。4つは意味なし、5つが本題。',
      trap: '数が続くと順番が混ざりやすい。数のすぐあとの言葉と組にして聞く。',
      use: 'Sorry, that was a typo.（ごめん、打ちミスだった）' },

    // R fix: V2 (blind 60 %): romantic vs angry vs more-later, three parallel readings of the same mock line
    // why: held-back anger ← "Do not make me say what I want to say" sounds like a threat; more later ← three dots,
    //   "to be continued", is the meaning given just before
    { id: 'i2', skill: 'infer', level: 'C1', point: 'fivedots', reveals: ['dotrule'], seg: [109.3, 121.6],
      stem: 'What does the guest say five dots mean?',
      choices: ['Romantic feelings too bold to say aloud', 'Angry feelings too harsh to say aloud',
                'That more will come in a later text'], a: 0,
      cue: 'baby と blow your mind が入る、まねの部分。',
      line: 'Do not make me say what I want to say, *baby*, but if I did, it would *blow your mind*.',
      said: '5つの意味を、文になりきって「言わせないで。言ったら驚くよ」と言う。',
      mean: 'baby と呼び、驚くほどの気持ちを匂わせる。友達以上の思いを伏せた点。',
      trap: '「言わせないで」は脅しに聞こえやすいが、baby と blow your mind で甘い調子。',
      use: 'I’ll let you guess the rest.（あとは想像におまかせ）' },

    // anchor: 124.8–126.8 s both sources leave a gap before "Yeah" and before "Totally crazy"; then he piles "insane
    //   asylum… Shutter Island" onto her one word "ridiculous"
    // R fix: V2 (blind 60 %, partly from the header): "truly driving him crazy" was too extreme to tempt
    // why: calm ← "Yeah, totally crazy" taken at face value as plain agreement; getting to him ← "insane asylum" heard
    //   literally, as the fight wearing him down
    { id: 'nt3', skill: 'attitude', level: 'C2', point: 'crazy', seg: [121.5, 133.0],
      stem: 'How does Darryl’s answer to Val’s “Right?” come across?',
      choices: ['Agreeing so strongly that it sounds forced', 'Calmly agreeing; it is just silly to him',
                'Admitting the fight is getting to him'], a: 0,
      cue: 'Right? のあとの間と、重ねるたとえ。',
      line: 'it’s ridiculous. Right? — Yeah. *Totally crazy. Puts me in an insane asylum* just thinking about it.',
      said: '「ばかげてるよね？」に、間をあけて「うん、どうかしてる。考えるだけで頭がおかしくなる」と重ねる。',
      mean: '「ばかげてる」の一語に、たとえを次々に重ねる。間のあとの言いすぎは、本心を隠す響き。',
      trap: '強く同意しているから本心、と取りやすい。間があって、たとえが大げさになるほど、無理を疑う。',
      use: 'Yeah, totally. Never crossed my mind.（うん、全然。考えたこともない）' },
  ]
};
