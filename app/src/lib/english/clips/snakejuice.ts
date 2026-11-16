// “when you get drunk at the work party | Parks and Recreation” (the official Parks and Recreation channel, Season 3):
// a night of "snake juice" at a club: Ron pushes the drink on a stranger, Chris tells the club's owner he must sell his
// shares, Leslie and Ann fight ("No offense, but…") and Leslie's talking head vows to stay calm, two sober coworkers
// on a cleanse plan to look after everyone, a ride home with a warning, and the morning after.
// Segments from the captions, words from whisper (2026-11-16). Left out: the owner's nickname at 22 s (whisper
// “Drankermeister”, captions “Jacob Meister”), “Dance up on me” at 106 s, 124–141 s (whisper “You're stupid, you're a
// jerk…”, captions garbled), the drunk talk at 190–213 s (whisper and captions far apart), “Your mother's butt” at
// 233 s, the hangover lines at 255 s (captions “I'm still on over”) and the 5K joke at 258 s (who says “Really?” is
// unclear). The fight's two voices are both women's and only Ann is named in it, so its stems say “one friend”; Ron,
// Chris and Leslie are named in the audio; Tom is named only at 229 s, so stems say “the club's owner”.
// REVIEW 2026-11-16: pass 4, fix 18, drop 1, new 1; ear checks 1
//   Open: none.
// EAR CHECK: 141.7 s nt1 — the key rests on “you were being stupid and you were acting like a jerk” (both sources),
//   assumed to be the start of the fight's next round, not a quote of something earlier
import type { Clip } from '../types.ts';

export const snakeJuice: Clip = {
  id: 'snakejuice', video: 'SYeO3N2gvmY', title: 'when you get drunk at the work party', dur: 283, wpm: 156,
  band: 'mid', tags: ['職場', '友だち'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 55 %, right): "left alone" and "paid" were easy to rule out; now both distractors are about the
    //   drink too
    // why: warning off ← "never" + "snake juice" heard together, as advice to stay away from it; asked to sell ← "You
    //   should buy it" heard as a pitch he was put up to
    { id: 'i1', skill: 'infer', level: 'B2', point: 'never', seg: [2.9, 10.8],
      stem: 'What does the “but” in Ron’s opening tell us about why he’s talking?',
      choices: ['The drink has made him chattier than usual', 'He is warning the stranger off the drink',
                'He was asked to help sell the drink tonight'], a: 0,
      cue: '「In general」の文と、but のあとの文の差。',
      line: 'In general, I try *never to speak with people*, *but* I have been drinking this snake juice thing…',
      said: '「ふだんは人と話さないようにしている。だがこの酒を飲んでいて、これがうまい。買え」と言う。',
      mean: '人嫌いが自分から話しかけている。お酒のせいで、いつもと違う。',
      trap: 'never と snake juice だけだと「飲むな」に聞こえる。but の後が本題。',
      use: 'I don’t usually say this, but…（ふだんは言わないけど…）' },

    // R fix: V2 (blind 65 %, right): "thanking him back" and "softening" were weak; now a yes-reading and a safety reading
    // why: took it as a yes ← "Thanks, man" heard as agreeing to buy, so Ron is only confirming; safe ← "guarantee"
    //   heard as a promise that the drink is safe
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'guarantee', seg: [10.3, 18.9],
      stem: 'After “Yeah, okay. Thanks, man,” what is Ron’s reply doing?',
      choices: ['Pushing past a polite brush-off', 'Taking the thanks as a yes', 'Promising the drink is safe'],
      a: 0,
      cue: '相手の「どうも」のあと、Ron の最後の命令。',
      line: 'Yeah, okay. Thanks, man. — Son, my recommendation is *essentially a guarantee*. *Drink this, now.*',
      said: '軽く流されると、「わしのおすすめは保証も同然だ。今飲め」と押し返す。',
      mean: '相手の「はいはい、どうも」は聞き流しの合図。Ron は引かずに命令で押す。',
      trap: 'Thanks, man を「買うよ」の返事と取りやすい。最後の now は、まだ押している印。',
      use: 'Trust me on this. Try it now.（信じて、今食べてみて）' },

    // why: too strong ← "140 proof" and "kill me" come first, so the drink seems to be the problem; skipping work ← a
    //   City Hall worker who owns a club seems to be missing work for it
    { id: 'g1', skill: 'gist', level: 'B2', point: 'conflict', reveals: ['shares'], seg: [26.6, 61.4],
      stem: 'Why does Chris need to talk to the club’s owner?',
      choices: ['He used his City Hall job to make money', 'His new drink is far too strong to be safe',
                'He has been skipping work to run his club'], a: 0,
      cue: '「We need to talk」の理由は、お酒の話のあと。',
      said: '強い酒をすすめられたあと、「市役所の全員に、自分の店で自分の酒を買えとメールした」と指摘する。',
      mean: '公務員が立場を使って自分の店をもうけさせた、という問題。',
      trap: '最初の強い酒の話に引かれやすい。we need to talk の本題は、あとから来る。',
      use: 'We need to talk about the email.（あのメールのことで話がある）' },

    // why: 17% ← seventy and seventeen blur at speed; 40% ← "forty" heard inside "one forty"; 140% ← the proof number,
    //   the first number said
    { id: 'n1', skill: 'number', level: 'B1', point: 'proof', seg: [30.25, 34.45], keep: true,
      stem: 'How much of the snake juice is alcohol, according to its maker?',
      choices: ['17%', '40%', '70%', '140%'], a: 2,
      cue: '「which means」のあとの数。',
      line: 'It’s 140 proof, which means it’s *70% alcohol*.',
      said: '「140プルーフ、つまりアルコール70％」と自慢する。',
      mean: 'proof はアメリカの強さの表し方で、その半分が％。seventy は前が強い。',
      trap: '最初の数を答えにしやすい。which means のあとが言いかえ。-ty は前が強い。',
      use: 'It’s about forty percent alcohol.（アルコール40％くらいだよ）' },

    // R fix: V2 (blind 60 %, right) and S1: the stem's "caffeine" made "alarmed" the only sensible pick against two
    //   light moods; now all three are negative and the stem only names the moment
    // why: bribe ← "We need to talk" about the email comes first, so a drink from the owner sounds like a bribe;
    //   impatient ← he came "to talk", so the offer seems to keep him from business
    { id: 'a4', skill: 'attitude', level: 'B2', point: 'ounce', seg: [34.3, 40.6],
      stem: 'When he is offered the snake juice, how does Chris react?',
      choices: ['Alarmed; he thinks it could hurt him', 'Offended; he takes it as a bribe', 'Impatient; he came here to talk'],
      a: 0,
      cue: '「I believe」のあと、少しの量で何が起きるか。',
      line: 'I believe an *ounce* of that would *literally kill me*.',
      said: '「カフェインもたっぷり」と言われ、「1オンスで本当に死ぬと思う」と返す。',
      mean: '少量でも命に関わる、という強い拒否。健康に気をつける人らしい反応。',
      trap: '直前の we need to talk に引かれ、仕事の反発と取りやすい。kill me までが一文。',
      use: 'One more bite would literally kill me.（もう一口食べたら死んじゃう）' },

    // R fix: V2 (blind 60 %, right): "asking for ideas" was weak; now "letting it go"
    // why: lost ← "I don't see any way" taken literally (どうしたらいいか分からない); letting it go ← "I totally get
    //   your point" (the owner's line) heard as Chris's, and "just" as a resigned sigh
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'wayaround', seg: [53.25, 58.5],
      stem: 'After “It won’t happen again,” what is Chris’s reply doing?',
      choices: ['Saying the promise is not enough', 'Admitting he’s unsure what to do', 'Letting it go, though not happily'],
      a: 0,
      cue: '約束のあと、Chris の文の始まり方。',
      line: 'I totally get your point, Chris. It won’t happen again. — I just *don’t see any way around it*.',
      said: '「分かった、もうしない」と言われ、「避ける方法が見当たらない」と返す。',
      mean: '「約束だけでは済まない」という、やんわりした拒否。次に処分を告げる前置き。',
      trap: '文字通り「どうしていいか分からない」と取りやすい。just が付くと、気の毒だが決まり、の響き。',
      use: 'Sorry, I don’t see any way around it.（悪いけど、どうにもならないんだ）' },

    // R fix: V2 (blind 55 %, right) and S3: the key was the only "sell" choice, which the cue's "sell" pointed at; now
    //   "sell the whole club" is the near miss
    // why: whole club ← "sell" and "club" heard together, "shares" lost; stop selling ← the email was about selling
    //   snake juice, so the order seems to be about the drink
    { id: 'd2', skill: 'detail', level: 'B1', point: 'shares', seg: [56.45, 61.5],
      stem: 'What does Chris say the club’s owner will have to do?',
      choices: ['Sell his part of the club', 'Sell the whole club off', 'Stop selling the snake juice'], a: 0,
      cue: '「have to sell」のあとの語。',
      line: 'You’re gonna have to *sell your shares* in the Snake Hole.',
      said: '「スネークホールの持ち分を売らなきゃいけない」と告げると、「やだ！」と返る。',
      mean: 'shares ＝ 店の持ち分。店を閉めるのでなく、持ち主から外れる。',
      trap: 'sell と club が聞こえると「店ごと売る」に寄りやすい。sell の目的語を聞く。',
      use: 'She sold her shares in the company.（彼女は会社の株を売った）' },

    // R fix: S3: the cue quoted "boss", the word only the key has; N1: whisper has "This is my boss", captions "he's
    //   my boss", so the line drops the first words
    // why: misspelled ← a rap "about your name" that spells something is expected to spell the name; insult ← rap
    //   battles are known for insults, and "boss" is said with attitude
    { id: 'h3', skill: 'humor', level: 'C1', point: 'rap', seg: [61.7, 72.4],
      stem: 'Why is the rap “about your name” funny?',
      choices: ['It spells out “boss”, not his name', 'It spells his name, but gets it wrong', 'It mocks him right to his face'],
      a: 0,
      cue: 'ラップの前半、文字を一つずつ言う部分。',
      line: '…my boss. — You want me to write a rap about your name? … *B to the O to the double S.*',
      said: '「上司なんだ」と聞いた男が「名前でラップを作ろうか」と言い、B、O、S、S と並べる。',
      mean: '名前を聞かずに、直前に聞いた boss をつづってしまう。中身も「上司に従え」。',
      trap: 'つづりを聞くと名前だと思いやすい。並んだ文字を組み立てると直前の一語。',
      use: 'What’s your name, again?（お名前、もう一度いいですか）' },

    // anchor: 70.1–71.8 s “do what he say, and you'll be successful”: both sources have “say”, not “says”
    // R fix: S4: the start cut the "S" of "double S" (69.66 s); it now starts before "double"
    { id: 'nt2', skill: 'dict', level: 'C2', point: 'hesay', seg: [69.4, 72.6],
      stem: 'Type the rap’s last line: “___, and you’ll be successful.” (4 words)', answer: 'do what he say',
      cue: '「double S」の直後。文法より、聞こえた音で。',
      line: '*Do what he say*, and you’ll be successful.',
      said: '「彼の言うとおりにしろ、そうすりゃ成功」とラップを締める。4語が一息。',
      mean: 'he の後なら says が正しいが、ラップや口語では s を落とす言い方がある。',
      trap: '文法どおり says と書きたくなる。say のあとに s の音はなく、すぐ and が続く。',
      use: 'Do what she say, you’ll be okay.（彼女の言うとおりにすれば大丈夫）' },

    // why: lose her friend ← "lose" heard, and the friend is right there; unsure of feelings ← "feelings" comes in the
    //   next turn, heard as her own reason
    // R fix: S4: the end fell on "job" (80.94 s); now 81.3 s
    { id: 'd3', skill: 'detail', level: 'B1', point: 'slow', seg: [73.6, 81.3],
      stem: 'Why does one friend say she is going slow?',
      choices: ['She might lose her job', 'She might lose her friend', 'She isn’t sure of her feelings'], a: 0,
      cue: '「going slow because」のあと。',
      line: 'No offense, but I’m going slow *because I might lose my job*.',
      said: '「悪気はないけど、ゆっくりなのは仕事を失うかもしれないから」と言い返す。',
      mean: '恋愛を急がない理由は仕事。ばれたら職を失うおそれがある。',
      trap: '次の番で feelings が出るので、それを理由と取りやすい。because の直後を聞く。',
      use: 'I’m careful because I might lose my seat.（席を取られるかもしれないから慎重なの）' },

    // R fix: V2 (blind 60 %, right): the key was the only "grows" against two endings; now one distractor is the
    //   "favor" turn read as cooling it
    // why: make up dancing ← "I'm gonna go dance" and "dance with me" are heard, as if the dance ended it; cools ← "I
    //   was just trying to do you a favor" heard as the peace offering that ends it
    { id: 'g2', skill: 'gist', level: 'B2', point: 'fight', reveals: ['together', 'nooffense'], seg: [73.6, 165.8],
      stem: 'How does Leslie and Ann’s fight go over the course of the night?',
      choices: ['It grows until they talk of not working together', 'It ends when they make up on the dance floor',
                'It cools once one says she only meant to help'], a: 0,
      cue: '最初の「No offense」と、最後のやりとりの重さ。',
      said: '「悪気はないけど」の言い合いから始まり、ののしり合い、最後は「一緒に働かないほうが」まで行く。',
      mean: 'お酒の勢いでけんかがどんどん大きくなり、仕事の話にまで広がる。',
      trap: 'dance や favor の語で、仲直りと取りやすい。最後の言葉で決める。',
      use: 'It just kept getting worse.（どんどんひどくなっていった）' },

    // R fix: V2 (blind 80 %, right): "talking openly" was the weakest; now "admitting them to yourself", the excuse
    //   context read the Japanese way
    // why: pretending ← act = 演技する, read literally; admitting ← "an excuse for not…" heard as 気持ちを認めない言い訳,
    //   the usual line between friends
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'acton', seg: [80.38, 84.7],
      stem: 'In the line about her “feelings”, what does “acting on” them mean?',
      choices: ['Doing something about them', 'Pretending to have them', 'Admitting them to yourself'], a: 0,
      cue: '「acting」のあとの短い前置詞。',
      line: 'an excuse for not *acting on* your feelings.',
      said: '「気持ちに従って行動しないことの言い訳」と言う。',
      mean: 'act on ＝ 〜に基づいて行動する。気持ちがあるなら動け、という意味。',
      trap: 'act を「演技」と取りやすい。act on ＋ 気持ち・助言・情報は「それに従って動く」。',
      use: 'I acted on your advice.（あなたのアドバイスどおりにしたよ）' },

    // R new (p5): replaces p3 ("No offense, but…" flags a criticism), which the blind pass got at 85 % from the phrase alone.
    //   This one needs the reply: "Offense." turns the set phrase around. 84.72–89.04 s, both sources have "offense" and
    //   "rude" (whisper "Offense? That's rude.", captions "offense it's rude"). Fresh blind read 40 %.
    // why: asking ← one word with a rise heard as a "pardon?"; own jab ← every turn so far opened a new jab, so a one-word
    //   start seems the next one cut short
    { id: 'p5', skill: 'pragma', level: 'B2', point: 'nooffense', seg: [84.2, 89.4],
      stem: 'What does the short reply to the “nursing degree” line mean?',
      choices: ['She’s saying this one hurt her', 'She’s asking what that one meant', 'She’s starting a jab of her own'],
      a: 0,
      cue: '最後の「No offense」のあとの短い返事。',
      line: '…a nursing degree in feelings. — *Offense.* … *rude.*',
      said: '「気持ちの看護学位なんて持ってた？」に、一語「オフェンス」、そして「失礼ね」と返す。',
      mean: 'no offense の決まり文句を逆手に取り、「今のは気に障った」と言っている。',
      trap: '一語だけだと聞き返しに取りやすい。直後の rude で気持ちが決まる。',
      use: 'Okay, that one hurt.（今のはちょっと傷ついた）' },

    // why: better drink ← "not the best idea" heard as "there's a better one"; agreeing ← "maybe" heard as a soft
    //   yes with a warning, the Japanese hedge frame
    // R fix: V2 (blind 50 %, right) and K6: the key was the only gentle choice; now all three are soft. S4: the end
    //   cut "it" (103.92 s)
    { id: 'p4', skill: 'pragma', level: 'B2', point: 'notbest', seg: [98.45, 104.25],
      stem: 'When she asks for another snake juice, what does the reply do?',
      choices: ['Politely turns her down', 'Gently offers another drink', 'Agrees, with a soft warning'], a: 0,
      cue: '返事の「maybe」と、そのあとの彼女の一言。',
      line: 'Go get me another snake juice. — Oh, that’s, that’s *maybe not the best idea* for you. — Forget it.',
      said: '「もう一杯取ってきて」に「それはやめたほうがいいかも」と返され、「もういい」と言う。',
      mean: 'やわらかい「やめておこう」。だから彼女はすねる。',
      trap: 'maybe を本当に迷っていると取りやすい。彼女の forget it が、断られた証拠。',
      use: 'That’s maybe not the best idea.（それはやめといたほうがいいかも）' },

    // R fix: V2 (blind 75 %, right): "private and quiet" was weak; now "argue honestly", from the "honest discussions"
    //   said just before
    // why: make up fast ← "clean" heard as a clean slate, no grudges; honestly ← "honest discussions between friends"
    //   comes two lines earlier, so "clean" sounds like "nothing hidden"
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'clean', seg: [116.3, 120.15],
      stem: 'What does Leslie mean when she says they must “fight clean”?',
      choices: ['Argue fairly, with no low blows', 'Argue honestly, holding nothing back', 'Make up fast, with no grudges'],
      a: 0,
      cue: '「watershed moment」のあと、どう戦うか。',
      line: 'it’s important that we *fight clean*.',
      said: '「大事な節目だから、正々堂々とけんかしなきゃ」とカメラに話す。',
      mean: 'fight clean ＝ ルールを守って戦う。人格攻撃などの汚い手を使わない。',
      trap: 'clean を「すっきり」や直前の honest と取りやすい。反対は fight dirty。',
      use: 'Let’s keep this clean, okay?（汚い言い方はなしね）' },

    // anchor: 120.8–123.7 s “All I need to do is focus and stay calm”, then 141.7–144.4 s “you were being stupid, and
    //   you were acting like a jerk” (both sources)
    // R fix: V2 (blind 60 %, right): "play-fighting" was weak; now "only by the end", from the later "I didn't mean it
    //   like that"
    // why: plan holds ← "fight clean" taken as the rule they then follow, only louder; by the end ← "I didn't mean it
    //   like that" (139.9 s) heard as calm that lasts until the last insults
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'calm', reveals: ['clean'], seg: [120.55, 144.6],
      stem: 'After “focus and stay calm,” how should we hear the fight that follows?',
      choices: ['As her calm plan falling apart at once', 'As her plan holding: loud, but still fair',
                'As her plan failing, but only by the end'], a: 0,
      cue: 'カメラへの一言と、直後の場面の言葉づかいを比べて。',
      line: 'All I need to do is *focus and stay calm*. … you were being *stupid*, and you were acting like a *jerk*.',
      said: 'カメラに「集中して落ち着くだけ」と言った直後、場面は「ばかだった」「最低だった」の言い合い。',
      mean: 'カメラへの決意を、すぐあとの場面が裏切る。この形式でよくある笑いの型。',
      trap: '決意の言葉どおりに場面を聞きやすい。カメラの言葉と、直後の場面のずれを聞く。',
      use: 'I’m totally calm. I am SO calm.（ぜんぜん落ち着いてるから。超落ち着いてる）' },

    // R fix: V2 (blind 60 %, right): the plain "Yes; she regrets" was easy to rule out; now "partly". S4: the start cut
    //   "jerk" (144.36 s)
    // why: partly ← "I'm sorry" taken at face value for the shouting, the Japanese frame where すみません softens; mocking
    //   the job ← "the job" heard as the target of the remark
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'sorry', reveals: ['push', 'favor'], seg: [144.6, 153.15],
      stem: 'Is the “sorry” about thinking of her friend for the job a real apology?',
      choices: ['No; she’s defending what she did', 'Partly; she’s sorry for how she said it', 'No; she’s mocking her friend’s job'],
      a: 0,
      cue: '「sorry」のあと、but から続く部分。',
      line: 'I’m *sorry that I thought about you for the job*, OK? *But* sometimes… I was just trying to do you a favor.',
      said: '「仕事にあなたを考えてごめんね」と言い、「でも押さないと止まったまま。親切のつもり」と続ける。',
      mean: '謝る形で、自分は正しかったと言う。sorry that I… は皮肉な謝り方。',
      trap: 'sorry だけで謝罪と取りやすい。but のあとに本音が来る。',
      use: 'Sorry for caring, okay?（心配してごめんなさいね）' },

    // R fix: V2 (blind 75 %, right): now two "pushed" near misses: "even with" (the fast "if I don't" lost) and "the
    //   wrong way" (from “right direction”)
    // why: even with a push ← "if I don't" is fast and weak, so the condition flips; wrong way ← "right direction" heard
    //   with "push", as if a bad push were the problem
    { id: 'i3', skill: 'infer', level: 'C1', point: 'push', seg: [146.85, 151.4],
      stem: 'What is she saying about her friend with “standing still”?',
      choices: ['Without a push, her friend never moves ahead', 'Even with a push, her friend never moves ahead',
                'Pushed the wrong way, her friend gets stuck'], a: 0,
      cue: '「if I don’t」の条件と、その結果。',
      line: 'if I don’t *push you in the right direction*, you end up *standing still*.',
      said: '「私が正しい方向に押さないと、あなたはいつまでも止まったまま」と言う。',
      mean: '自分から動けない人だから押してあげた、と言っている。相手には失礼な言い方。',
      trap: 'if I don’t は速く弱いので、否定を落としやすい。if の条件と結果をつなぐ。',
      use: 'Sometimes you need a little push.（ときには少し背中を押されないとね）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'favor', seg: [151.0, 153.15],
      stem: 'Type what she says: “I was just trying to ___.” (4 words)', answer: 'do you a favor',
      cue: '「standing still」のあと、trying to の続き。',
      line: 'I was just trying to *do you a favor*.',
      said: '「あなたのためを思っただけ」と言う。',
      mean: 'do you a favor がつながって「ドゥユァフェイヴァ」。you と a が弱く短い。',
      trap: 'you a が一つの音に聞こえ、a を落としやすい。do ＋ 人 ＋ a favor の形で覚える。',
      use: 'Could you do me a favor?（ちょっとお願いしていい？）' },

    // R fix: V2 (blind 70 %, right): with three choices, the fight made "shouldn't" the only fit besides a near sound;
    //   a fourth negative, "can't", now fits the fight too
    // why: should ← "-n't" loses its t before "work", and the reply "Maybe we should—" repeats the plain form;
    //   couldn't ← the same ending, a near sound; can't ← a negative that fits the fight as well
    { id: 's1', skill: 'sound', level: 'B2', point: 'together', seg: [161.0, 165.8],
      stem: 'Fill the gap: “Maybe we ___ work together then.”',
      choices: ['shouldn’t', 'should', 'couldn’t', 'can’t'], a: 0,
      cue: '「we」のあと、語の終わりの「ン」。',
      line: 'Maybe we *shouldn’t* work together then. — Maybe we should…',
      said: '「じゃあ、一緒に働かないほうがいいかもね」と言い、相手も「そうかもね」と返しかける。',
      mean: 'shouldn’t の t は work の前で消え、「シュドゥン」で止まる。',
      trap: '返事の should と混ざりやすい。最後の「ン」が否定の印。',
      use: 'Maybe we shouldn’t go tonight.（今夜は行かないほうがいいかも）' },

    // R fix: V2 (blind 55 %, right): "a police raid" was easy to rule out; now "the boss is watching". S4: the end cut
    //   "Everybody's wasted" (whisper 190.4 s); the segment now holds it, which backs the key
    // why: boss watching ← a work party and "alert" heard as staying on guard in front of the boss; work early ← "alert"
    //   and the morning-after talk of hiring, heard as needing to be fresh tomorrow
    { id: 'i4', skill: 'infer', level: 'C1', point: 'alert', seg: [182.9, 191.5],
      stem: 'Why does “someone” need to be alert tonight?',
      choices: ['The others will be too drunk to get home', 'Their boss is watching how staff behave',
                'They both have to be at work early'], a: 0,
      cue: '「alert tonight」の直後、お酒を何にたとえるか。',
      line: 'Someone needs to be *alert tonight*. This snake juice is basically *rat poison*.',
      said: '断食中の二人が「今夜は誰かがしっかりしてないと。あの酒はほぼ殺そ剤だ」と話す。',
      mean: 'みんな酔いつぶれるから、しらふの自分たちが面倒を見る、ということ。',
      trap: 'alert を「警戒」と取ると外の危険の話に聞こえる。直後の酒の話とつなぐ。',
      use: 'Someone has to stay sober tonight.（今夜は誰かしらふでいないと）' },

    // R fix: V2 (blind 50 %, right): "pull over" was the weak one; now "only that person" twice, so the two choices
    //   that share words point away from the key
    // why: only that one ← "even one of you" heard as the subject of "walking home"; clean the car ← "in my car" heard
    //   as the thing at stake
    { id: 'd4', skill: 'detail', level: 'B2', point: 'walking', seg: [238.9, 243.4],
      stem: 'What does the driver say will happen if anyone dry-heaves in the car?',
      choices: ['Everyone will have to walk home', 'Only that person will walk home', 'Only that person will clean the car'],
      a: 0,
      cue: '「even one of you」と、後半の主語を比べて。',
      line: 'If *even one of you* thinks about dry heaving in my car, *you’re all walking home*.',
      said: '「一人でも車で吐こうとしたら、全員歩いて帰れ」と言い渡す。',
      mean: '一人の失敗で全員を罰する、という強い警告。even one と all の対比。',
      trap: 'one of you が耳に残り、その人だけと取りやすい。後半の all が対象。',
      use: 'One of you is late, we all wait.（一人でも遅れたら全員待つ）' },

    // why: fire ← hire and fire differ only in the first sound; become ← "we have to go" heard as Leslie herself
    //   taking the post
    { id: 'd5', skill: 'detail', level: 'B1', point: 'hire', seg: [250.45, 254.3],
      stem: 'The next morning, what do they have to go and do?',
      choices: ['Hire a new PR director', 'Fire the PR director', 'Become the new PR director'], a: 0,
      cue: '「have to go」のあとの動詞の最初の音。',
      line: 'We have to go *hire a new PR director* for the health department.',
      said: '翌朝、「保健局の新しい広報部長を採用しに行かないと」と声をかけられる。',
      mean: 'hire ＝ 雇う。酔いの翌朝でも仕事は待っている。',
      trap: 'hire と fire は最初の音しか違わない。h は息だけ、f は唇をかむ音。',
      use: 'We need to hire more staff.（もっと人を雇わないと）' },
  ]
};
