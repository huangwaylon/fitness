// “Leslie and Ann's Big Fight | Parks and Recreation” (the official Parks and Recreation channel, Season 3): at a bar,
// a lost book turns into a jab about Ann's boyfriends, a “no offense, but” exchange about Leslie and Ben, and, after
// Leslie's calm plan to the camera, a drunken fight that ends with talk of not working together.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈144 s. Untested: 0–8 s (the date's crude
// pickup line), 23–29 s (“is it/he gonna last”, who says “sitting right here” and “Thank you”), 55.9 s (“Ben” vs
// “Beth”), 63.4 s (captions “I remember” vs whisper “I don't remember”), 68–71 s and 77–86 s (“douche”, the drink
// name, Jean-Ralphio), 93.4 s (“deeper intimacy” vs “deep randomnessy”), 112–118 s (overlapping shouting).
// EAR CHECK: 102.1 s nt1 — “You're stupid in your jacket…” is taken as Leslie's (the cut from her talking head to the
//   bar); the key holds as long as it's said in the fight she just planned to keep calm
// REVIEW 2026-11-16: pass 4, fix 17, drop 0, new 0; ear checks 1
// OPEN: who says “You're stupid in your jacket” (102.1 s)? nt1 assumes Leslie (her later “I just meant you were being
//   stupid” fits); if it's Ann, nt1 should be dropped.
import type { Clip } from '../types.ts';

export const bigFight: Clip = {
  id: 'bigfight', video: 'YFzyMAN9Ojk', title: 'Leslie and Ann\'s Big Fight', dur: 166, wpm: 182, band: 'fast',
  tags: ['友だち'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2/K1: the lost book was a defensible trigger and the key the only "fight" choice; now two parallel cracks
    // why: slow with men ← Ann's later "no offense" crack, said after the fight has started; the date ← he's at the
    //   table, but he only says "sitting right here" and "classic"
    { id: 'g1', skill: 'gist', level: 'B2', point: 'start', reveals: ['comego', 'dig'], seg: [9.6, 69.1],
      stem: 'What first turns the friendly talk sour?',
      choices: ['A crack about how long Ann’s boyfriends last', 'A crack about how slowly Leslie moves with men',
                'Ann’s date making fun of Leslie’s love life'], a: 0,
      cue: '本の話のあと、レスリーが何を付け足すか。',
      line: '…one of your *boyfriends*. They come and go so fast.',
      said: '本が戻らないと聞き、レスリーが「あなたの彼氏はすぐ替わるから」と言い、言い合いが始まる。',
      mean: '本はきっかけにすぎない。相手の恋愛への一言から、お互いの恋の話にまで広がる。',
      trap: 'アンの「ゆっくりすぎ」は後の言い返し。最初に空気を変えた一言を聞く。',
      use: 'It started over something small.（ささいなことから始まった）' },

    // R fix: V2: the key was the only specific choice; all three now name Leslie's book and a reason it isn't back
    // why: the title ← "what's his name" heard as the book's name; until she reads it ← "back" lost before "from"
    { id: 'd1', skill: 'detail', level: 'B1', point: 'book', seg: [9.65, 13.95],
      stem: 'What does Ann tell Leslie at the start of their talk?',
      choices: ['She can’t get Leslie’s book back from someone', 'She can’t recall the name of Leslie’s book',
                'She can’t give Leslie’s book back till she reads it'], a: 0,
      cue: '「that book」のすぐあとの短い語。',
      line: 'I don’t think I can get that *book back* from, um, what’s his name?',
      said: '「あの本、例の…名前なんだっけ、あの人から返してもらえないと思う」と言う。',
      mean: 'get … back ＝ 取り戻す。貸した本が、別の人の所に行ったまま。',
      trap: 'what’s his name を本の題名と取りやすい。his なので人のこと。',
      use: 'Can I get my charger back?（充電器、返してもらえる？）' },

    // R fix: V2/K5: the third choice was about the book, not the man; now all three read the man
    // why: on purpose ← "um" heard as holding something back; tonight's date ← "what's-his-name" as a teasing nickname
    //   for the man at the table, but she can't get the book back from him and Leslie talks of past boyfriends
    { id: 'i1', skill: 'infer', level: 'B2', point: 'name', reveals: ['comego'], seg: [9.65, 20.3],
      stem: 'When Ann trails off naming who has the book, what does it suggest?',
      choices: ['He was a short fling she’s already forgotten', 'He is her date tonight, and she’s teasing him',
                'She is keeping his name from Leslie on purpose'], a: 0,
      cue: '「um」のあとの言い方と、レスリーの返し。',
      line: '…from, um, *what’s his name*?',
      said: '本を持っている男の名前が出てこず、「名前なんだっけ」でごまかす。',
      mean: 'what’s his name ＝ 名前を忘れた人の呼び方。すぐ忘れる程度の相手だった、と分かる。',
      trap: 'um を隠しごとと取りやすいが、続くレスリーの「すぐ替わる」がその裏付け。',
      use: 'I met what’s-his-name at the party.（パーティーで、ほら、あの人に会った）' },

    // R fix: V2: "doesn't matter" was a filler; now an indirect-request reading
    // why: blames herself ← "I should have known better" taken at its word; a new copy ← the Japanese frame of a
    //   polite "that's okay" hiding a request
    { id: 'pr1', skill: 'pragma', level: 'C1', point: 'dig', seg: [13.75, 20.3],
      stem: 'When Leslie answers the book news, what does the rest of her reply do?',
      choices: ['Turns her “that’s okay” into a dig at Ann', 'Blames herself for lending the book so freely',
                'Hints that Ann ought to buy her a new copy'], a: 0,
      cue: '「I mean」のあと、誰の話になるか。',
      line: 'Oh, that’s okay. I mean, I *should have known better* than to loan something to one of your boyfriends.',
      said: '「いいの。あなたの彼氏に物を貸した私がばかだった」。',
      mean: '自分を責める形で、相手の恋愛を当てこする。I mean のあとが本音。',
      trap: 'should have known better を反省と取りやすいが、責める先は your boyfriends。',
      use: 'I should have known better.（分かっていたはずなのに）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'comego', seg: [15.0, 20.3],
      stem: 'Type the gap: “They ___ so fast.” (3 words)', answer: 'come and go',
      cue: '「boyfriends」のあと、短い3語がつながる。',
      line: 'They *come and go* so fast.',
      said: '「すぐ来て、すぐいなくなる」と、彼氏が長続きしないことを言う。',
      mean: 'come and go がつながり「カムンゴウ」に近い。and はほぼ「ン」だけ。',
      trap: 'and が消えて2語に聞こえやすい。2つの動詞の間には、弱い and を疑う。',
      use: 'Trends come and go.（流行は来ては去る）' },

    // R fix: K1: "which style suits you best" is a fair gloss of trying on hats; now a plainly literal reading
    // why: looks ← hats read literally as style; many roles ← the idiom "wear many hats" (one person, many jobs)
    { id: 'ph1', skill: 'phrase', level: 'C1', point: 'hats', seg: [28.85, 32.93],
      stem: 'How does Ann describe the point of dating around?',
      choices: ['You get to try lots of different people', 'You get to try out new looks and styles',
                'You learn to play many roles for a partner'], a: 0,
      cue: '「try on」のあとの名詞を、人に置きかえて。',
      line: 'that’s the whole point of dating around, you get to *try on a bunch of different hats*.',
      said: '「いろんな人と付き合う意味は、いろんな帽子を試せること」と言う。',
      mean: '帽子＝付き合う相手。服を試着するように、いろんな人を試すという言い方。',
      trap: 'wear many hats（いくつも役を持つ）と混ざりやすい。ここは try on で試着の意味。',
      use: 'I’m just trying it on for size.（ちょっと試してるだけ）' },

    // why: Ann ← "idiot" heard as aimed at the person she's talking to; literal ← "this hat" heard as missing the
    //   metaphor, when "this" points at the man
    { id: 'h1', skill: 'humor', level: 'C1', point: 'idiot', reveals: ['hats'], seg: [28.85, 35.3],
      stem: 'Why does Leslie’s reply to the hats idea get a laugh?',
      choices: ['She turns Ann’s hats into an insult for the date', 'She calls Ann an idiot for dating so many men',
                'She takes the hats literally and misses the point'], a: 0,
      cue: '「this hat」の this が指すもの。',
      line: 'Well, *this hat* is an *idiot*.',
      said: 'アンの「帽子」のたとえを受けて、「この帽子はばかだね」と返す。',
      mean: 'this hat ＝ 目の前のデート相手。相手のたとえを使って、本人の前で悪口にした。',
      trap: 'idiot を話し相手のアンに向けたと取りやすい。this が指すのは同じ席の男。',
      use: 'Well, this one’s a keeper.（これは手放せないね）' },

    // R fix: V2: "really going on" told you the denials were false, and the distractors were weak
    // why: cleared up ← the denials taken at their word; only Leslie ← Ann asks first ("are you mad that I came
    //   here?"), so Leslie seems the upset one, but Ann denies just as hard
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'mad', seg: [36.0, 47.5],
      stem: 'During the back-and-forth about being mad, where do the two stand?',
      choices: ['Both are upset, but neither will admit it', 'Leslie is upset, and Ann is trying to calm her',
                'Both were tense, but the talk has cleared it up'], a: 0,
      cue: '否定の回数と、言い方の速さ。',
      line: 'No, I’m not. Are you? … *I’m not, I’m not, I’m not* mad at you.',
      said: '「怒ってる？」「怒ってない。そっちこそ」「怒ってない、怒ってない」と言い合う。',
      mean: '否定を何度もくり返すほど、本当は怒っていると伝わる。言葉と気持ちが逆。',
      trap: '言葉どおり取ると仲直りに聞こえる。同じ否定が3回続いたら、気持ちは逆を疑う。',
      use: 'I’m fine. Really. I’m totally fine.（平気。ほんとに。全然平気）' },

    // R fix: S4: the segment ended on "Neither am I" (46.72 s); now 48.6 s. Ear check removed: both sources agree.
    // why: at you ← said just before, twice; after all ← the flapped t heard as "after"
    { id: 's1', skill: 'sound', level: 'B2', point: 'atall', seg: [42.72, 48.6],
      stem: 'Fill the gap just before “Neither am I”: “I’m not mad ___.”',
      choices: ['at all', 'at you', 'after all'], a: 0,
      cue: '「Neither am I」の直前。最後の音の母音。',
      line: 'I’m not mad *at all*. — Neither am I.',
      said: '「全然怒ってない」「私も」と言い合う。',
      mean: 'at all がつながり、t が弾んで「アロール」のように聞こえる。最後は「オール」。',
      trap: '直前に mad at you が2回あるので同じ語を予想しやすい。最後の母音が「ユー」か「オール」かを聞く。',
      use: 'I don’t mind at all.（全然かまわないよ）' },

    // R fix: V2/K7: the key was the longest and the only one naming criticism with politeness; distractors rebuilt
    // why: a light joke ← "no offense" read as a tease that shouldn't hurt; keep the peace ← the Japanese frame of a
    //   polite preface (すみませんが) as goodwill, though every line attacks
    { id: 'pr3', skill: 'pragma', level: 'B2', point: 'nooffense', seg: [52.0, 65.7],
      stem: 'In the exchange where every line starts the same way, what does that opener do?',
      choices: ['Warns that a criticism is about to follow', 'Signals that a light joke is coming next',
                'Shows each one is trying to keep the peace'], a: 0,
      cue: '前置きのあと、毎回どんな中身が来るか。',
      line: '*No offense, but* maybe you think I’m going too fast…',
      said: '2人とも「悪気はないけど」で始めて、相手の恋愛への批判を順に言う。',
      mean: 'no offense, but ＝ 失礼を言う合図。but のあとに本音の批判が来る。',
      trap: '日本語の「すみませんが」のように謝りに聞こえるが、言いたいのは but のあと。',
      use: 'No offense, but that shirt is loud.（悪いけど、そのシャツ派手だよ）' },

    // why: unsure of feelings ← Ann's later claim about her feelings; too busy ← "job" heard as workload
    { id: 'd2', skill: 'detail', level: 'B1', point: 'job', seg: [52.0, 58.85],
      stem: 'Why does Leslie say she is taking things slowly?',
      choices: ['She could lose her job over it', 'She isn’t sure how she really feels',
                'She is too busy with work right now'], a: 0,
      cue: '「because」のあと、might に続く動詞。',
      line: 'I’m going slow because I *might lose my job*.',
      said: '「仕事を失うかもしれないから、ゆっくりなの」と答える。',
      mean: 'might lose my job ＝ 仕事を失うかもしれない。忙しさではなく、失職の心配。',
      trap: 'job から忙しさを連想しやすい。動詞 lose まで聞いて理由を決める。',
      use: 'I might lose my seat if I leave.（離れたら席を取られるかも）' },

    // R fix: V2: "doesn't really like him" was a filler; now the near miss "not acting… feelings" → no feelings
    // why: fair but worried ← "a little bit" taken as a real softener; faded ← "not… your feelings" heard as "no
    //   feelings", when "not acting on" means the feelings are there
    { id: 'i2', skill: 'infer', level: 'B2', point: 'excuse', reveals: ['job'], seg: [55.75, 62.6],
      stem: 'What does Ann suggest about the reason Leslie just gave?',
      choices: ['It covers for feelings she’s afraid to act on', 'It hides that her feelings for him have faded',
                'It is fair, though she worries too much about it'], a: 0,
      cue: '「excuse for」のあと、何をしない言い訳か。',
      line: 'maybe that’s a little bit of an *excuse for not acting on your feelings*.',
      said: '「それって、気持ちのままに動かない言い訳なんじゃない？」と言う。',
      mean: '仕事の話は口実で、本当は好きなのに踏み出せないだけ、と見ている。',
      trap: 'a little bit を控えめな賛成と取りやすいが、中身ははっきりした批判。',
      use: 'That sounds like an excuse.（それ、言い訳っぽいよ）' },

    // R fix: V2/K6: "set phrase… literally" in the key named the mechanism; choices made parallel
    // why: a slip ← "Offense" heard as "no offense" with the "no" dropped in anger; owns up ← "That's rude" heard as
    //   her judging herself
    { id: 'h2', skill: 'humor', level: 'C1', point: 'offense', seg: [62.6, 67.5],
      stem: 'Why is the last reply in the “no offense” exchange funny?',
      choices: ['She turns “no offense” around: offense taken', 'She meant “no offense” but dropped the “no”',
                'She admits her own remark was rude to Leslie'], a: 0,
      cue: '最初の一語と、そのあとの評価。',
      line: '*Offense*. That’s rude.',
      said: '相手の「悪気はないけど」に、「気を悪くした。失礼ね」とだけ返す。',
      mean: '決まり文句の no offense を言葉どおりに受け、「悪く取ったよ」と返すのが笑い。',
      trap: 'no の言い忘れに聞こえるが、that’s rude と続くので、わざと言っている。',
      use: 'None taken.（気にしてないよ）' },

    // R fix: V2: "check on her" pointed at a fight noise; stem neutral, choices parallel ("He heard…")
    // why: dancing ← "dance" comes right after; drunk ← "drunk" is the next thing she says
    { id: 'd4', skill: 'detail', level: 'B1', point: 'yelling', seg: [71.7, 76.3],
      stem: 'What brings the man over to her?',
      choices: ['He heard them yelling', 'He heard she wanted to dance', 'He heard she was drunk'], a: 0,
      cue: '「are you okay」のあと、heard に続く語。',
      line: 'Hey, are you okay? I *heard yelling*.',
      said: '「大丈夫？ 大声が聞こえたけど」と声をかける。',
      mean: 'yelling ＝ 大声、どなり声。けんかの声が聞こえて様子を見に来た。',
      trap: 'すぐあとに drunk と dance が出るので引っぱられやすい。heard のすぐあとが理由。',
      use: 'I heard a noise. Are you okay?（音がしたけど、大丈夫？）' },

    // why: little ← the -y ending heard as cute and small; confusing ← doozy heard near dizzy
    { id: 'ph3', skill: 'phrase', level: 'C1', point: 'doozy', seg: [86.3, 89.6],
      stem: 'How does Leslie first describe the fight to the camera?',
      choices: ['As a really big one', 'As a silly, little one', 'As a confusing one'], a: 0,
      cue: '「first fight with Ann」のあと、but の前。',
      line: 'This is my first fight with Ann, and *it’s a doozy*.',
      said: '「アンと初めてのけんか。しかも、かなりの大物」とカメラに話す。',
      mean: 'a doozy ＝ とびきりのもの、すごいやつ。良くも悪くも、規模が大きいこと。',
      trap: '語尾の -y がかわいく聞こえ、小さな事に思いやすい。口語では大きい方。',
      use: 'That storm was a doozy.（あの嵐はすごかった）' },

    // R fix: S4 (ph3, above): the segment was 2.95 s; now 86.3–89.6 s.
    // R fix: V2: "bitter" had nothing in the audio behind it; now a guilt reading
    // why: guilty ← "my first fight" heard as regret over her part; worried ← "watershed moment" heard as an ending
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'clean', seg: [86.6, 98.4],
      stem: 'How does Leslie sound when she talks to the camera about the fight?',
      choices: ['Earnest, treating it as a big step for them', 'Guilty, feeling she went too far with Ann',
                'Worried that their friendship is now over'], a: 0,
      cue: '使う言葉の固さ。けんかを何と呼ぶか。',
      line: 'This is a *watershed moment* in our relationship, and it’s important that we *fight clean*.',
      said: '「関係の分かれ目。正々堂々とけんかしなきゃ」と、まじめに話す。',
      mean: 'watershed moment ＝ 転機。けんかを、仲が深まる一歩と前向きにとらえている。',
      trap: '転機を「終わり」と取ると不安に聞こえる。fight clean も前向きな語。',
      use: 'This could be a turning point.（これが転機になるかも）' },

    // EAR CHECK: nt1
    // anchor: 97.2–101.5 s “it's important that we fight clean… focus and stay calm”, then 102.1 s “You're stupid in
    //   your jacket and you're stupid”: a repeated, childish insult straight after the plan
    // R fix: V2: "a joke to make Ann laugh" was weak; the honesty reading now steelmans "fight clean"
    // why: blunt honesty ← "honest discussions… fight clean" taken at its word, so the insult reads as planned
    //   frankness; teasing ← the sincerity flip: the insult heard as play to cool things down
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'clean', seg: [86.6, 104.6],
      stem: 'After her plan to the camera, how should we hear her next line?',
      choices: ['As her plan to stay calm falling apart at once', 'As blunt honesty, which she counts as fighting clean',
                'As playful teasing to take the heat out of it'], a: 0,
      cue: 'カメラへの決意と、直後の一言を比べて。',
      line: 'All I need to do is *focus and stay calm*. — *You’re stupid* in your jacket and you’re stupid.',
      said: 'カメラに「集中して冷静に」と言った直後、バーで「上着がばかで、あなたもばか」と言う。',
      mean: 'カメラへの決意が、すぐ次の場面で崩れる。この形式では、宣言と行動のずれそのものが笑いになる。',
      trap: '正直に話すと言ったので計画どおりに聞こえるが、子どもの悪口をくり返すのは冷静の逆。',
      use: 'So much for staying calm.（冷静でいるはずが、これだよ）' },

    // anchor: 108.6–110.6 s “It's not, everything isn't your fault all the time”: grammar wants “not everything is”;
    //   both sources have “everything isn't”, said fast after “It's not”
    { id: 'nt2', skill: 'dict', level: 'C2', point: 'fault', seg: [106.2, 110.92],
      stem: 'Type the gap: “It’s not, ___ your fault all the time.” (2 words)', answer: 'everything isn\'t',
      cue: '「It’s not,」のすぐあと。文法より、聞こえた順に。',
      line: 'It’s not, *everything isn’t* your fault all the time.',
      said: '「あなたのせいじゃない。全部があなたのせいなわけじゃない」と早口で言う。',
      mean: '文法では not everything is だが、口では everything isn’t とよく言う。',
      trap: '習った形に直して not everything と書きたくなる。聞こえた語順のまま書く。',
      use: 'Everything isn’t about you.（全部が君の話じゃない）' },

    // R fix: N1: the reply at 142.5 s is “Maybe we shouldn't” in whisper but “maybe we should” in the captions; the
    //   line and notes now rest on the first sentence only, which settles the key
    // why: calmer ← "I'm sorry that…" heard as a real apology; waiting to talk ← the drunk scene read as "sleep on it"
    { id: 'g2', skill: 'gist', level: 'B2', point: 'end', seg: [118.4, 144.0],
      stem: 'By the end of the clip, where does the fight leave them?',
      choices: ['Angry enough to talk about not working together', 'Calmer, after one of them says that she is sorry',
                'Unsure, and waiting to talk again once sober'], a: 0,
      cue: '最後の短いやりとり。then の前の中身。',
      line: 'Maybe we *shouldn’t work together* then.',
      said: '謝りも出るが、最後は「それなら一緒に働かない方がいいかも」という話で終わる。',
      mean: 'then ＝ それなら。けんかの流れで、仕事の関係まで見直す話になる。収まらずに終わる。',
      trap: 'sorry で仲直りに思いやすいが、but のあとで言い返している。',
      use: 'Maybe we should take a break.（少し距離を置いた方がいいかも）' },
    // R fix: V2: "takes it back and says sorry" was the only non-comic reading; distractors rebuilt
    // why: the drinks ← the drunk scene around it; the date ← "your jacket" earlier heard as aimed at the man at the
    //   table, but "you were being stupid" is said to her
    { id: 'h3', skill: 'humor', level: 'C1', point: 'meant', seg: [118.4, 122.38],
      stem: 'Why is the explanation after “I didn’t mean it like that” funny?',
      choices: ['It claims to soften the insult but restates it', 'It turns the insult into a joke about the drinks',
                'It moves the insult from Ann onto her date'], a: 0,
      cue: '「I just meant」のあとに、何が来るか。',
      line: 'I didn’t mean it like that. I just meant *you were being stupid* and you were acting like a jerk.',
      said: '「そういう意味じゃない。ばかで嫌なやつだったって意味」と言う。',
      mean: '言い直しのはずが、同じ悪口を言い方だけ変えてくり返している。そのずれが笑い。',
      trap: 'I didn’t mean it は謝りの形。でも I just meant のあとが本当の中身。',
      use: 'That’s not what I meant.（そういう意味じゃないよ）' },

    // R fix: V2: "pushes back harder" was a filler; now an "end up" keyword trap
    // why: wrong way ← "right direction" heard as the fear; alone ← "end up" heard, the rest guessed
    { id: 'd3', skill: 'detail', level: 'B2', point: 'push', seg: [122.4, 129.5],
      stem: 'Right after her apology, what does the speaker say happens without her push?',
      choices: ['Her friend never moves forward', 'Her friend heads the wrong way',
                'Her friend ends up alone'], a: 0,
      cue: '「you end up」のあとの2語。',
      line: 'if I don’t push you in the right direction, you *end up standing still*.',
      said: '「私が押さないと、あなたはその場で止まったまま」と言う。',
      mean: 'end up ～ing ＝ 結局～になる。standing still ＝ 前に進まない。',
      trap: 'right direction が耳に残り、方向の話に聞こえる。end up のあとが結果。',
      use: 'We ended up staying home.（結局、家にいることになった）' },

  ]
};
