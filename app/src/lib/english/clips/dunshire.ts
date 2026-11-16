// “The Cones of Dunshire | Parks and Recreation” (the official Parks and Recreation channel, Season 6): between jobs,
// a man shows his wife the board game he invented in a week; the rules keep growing as he talks, and she gently asks
// when his new job starts.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 97 s. Neither speaker is named in the
// clip, so stems say "the man" and "the woman" (the woman's talking head is 22.5–28.6 s; "Thanks to me" and "when do
// you go back to work" are hers by sense: he lost the job, he starts the new one). Untested: the opening "Are you
// ready? — No, babe" (0–6 s, tone only), 46.1 s "Oh, boy" (whisper only), 60.2 s "roadblocks" (captions "Roblox").
// REVIEW 2026-11-16: pass 9, fix 13, drop 0, new 0; ear checks 1
// Open: nt1 (C2) stays partly guessable: a "how should we see it" stem after a talking head points to the ironic
//   reading. Its segment is 24.4 s (≤ 25 s for talking head vs scene).
// R: removed the x1 ear check (both sources have "How have I not") and the s1 one (the gap is now "'cause you're",
//   which both sources have; "gonna"/"going to" is outside the gap).
// EAR CHECK: 95.3 s a3 — “It's fine. I'll just throw this in the garbage” sounds hurt and clipped, not relieved
import type { Clip } from '../types.ts';

export const conesOfDunshire: Clip = {
  id: 'dunshire', video: 'R5fBO-Ua2rk', title: 'The Cones of Dunshire', dur: 108, wpm: 168, band: 'fast',
  tags: ['家'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2. "closed down" was weak; replaced with a keyword trap on "tried to hire me"
    // why: hired away ← "They've tried to hire me" comes right after; quit ← the new job, said next, heard as the reason
    { id: 'd1', skill: 'detail', level: 'B1', point: 'fired', seg: [6.3, 10.0],
      stem: 'Why did the man stop running the Sweetums Foundation?',
      choices: ['He was fired from the job', 'He was hired away by a firm', 'He quit to take another job'], a: 0,
      cue: '「I got」のすぐあとの一語。',
      line: 'I *got fired* from running the Sweetums Foundation.',
      said: '「スウィータムズ財団の代表をクビになった」と言う。',
      mean: 'get fired ＝ 解雇される。本人がやめたのではない。新しい仕事の話の前置き。',
      trap: 'あとに hire や新しい仕事の話が来るので、引き抜きと取りやすい。got のあとの語で決まる。',
      use: 'He got fired for being late.（遅刻でクビになった）' },

    // R fix: V2. "getting ready for the job" was weak; replaced with resting up, the usual use of a week off
    { id: 'g1', skill: 'gist', level: 'B2', point: 'project', reveals: ['cooking'], seg: [6.3, 29.0],
      stem: 'What has the man been doing with his week off?',
      choices: ['Working on a big project of his own', 'Resting up before starting at the firm',
                'Making a short claymation film again'], a: 0,
      cue: '「in between jobs」のあと、何をしていたか。',
      line: 'I had a week off in between jobs, and I’ve been *cooking up something pretty big*.',
      said: '次の仕事までの1週間で「かなり大きなものを作っていた」と言う。',
      mean: '新しい仕事の準備ではなく、自分の企画に夢中になっていた。この先の場面の前置き。',
      trap: 'week off を休みと取りやすい。claymation は前回の話。',
      use: 'I’ve been working on something fun.（ちょっと楽しいものを作ってるんだ）' },

    // why: thanking ← "Thanks" taken literally, as gratitude; telling again ← "again" heard on the story, not the apology
    { id: 'i1', skill: 'infer', level: 'B2', point: 'sorry', seg: [6.6, 10.7],
      stem: 'What does the woman’s quick reply tell us about the firing?',
      choices: ['It was her fault, and she has said sorry before', 'He helped her, and she is still thankful for it',
                'He has told this story before, and she is tired of it'], a: 0,
      cue: '「Foundation」のすぐあと、短い二つの文。',
      line: '*Thanks to me*. *Sorry again*.',
      said: '「私のせいでね。改めてごめん」と言う。',
      mean: 'thanks to me ＝ 私のせいで（皮肉な言い方）。again で、前にも謝ったことが分かる。',
      trap: 'thanks を感謝と取りやすい。thanks to は「〜のおかげで」にも「〜のせいで」にもなる。',
      use: 'We missed the train, thanks to me.（私のせいで電車に乗り遅れた）' },

    // R fix: V2. "secret gift" was weak; replaced with a brave-face (強がり) reading
    // why: hides a problem ← the parts reversed; brave face ← the Japanese frame: a cheerful line after an apology heard
    //   as 強がり
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'blessing', seg: [9.6, 12.8],
      stem: 'How does the man see losing his job?',
      choices: ['As a bad thing that turned out well', 'As a good thing that hid a problem',
                'As a bad thing he is putting a good face on'], a: 0,
      cue: '「Hey」のあとの決まった言い方。',
      line: 'Hey, *blessing in disguise*.',
      said: '謝る妻に「いや、むしろよかったんだ」と返す。',
      mean: 'blessing in disguise ＝ 悪く見えて実はよいこと。相手の気を楽にする言い方でもある。',
      trap: 'disguise（変装）から逆の意味や強がりと取りやすい。決まり文句は形ごと覚える。',
      use: 'The rain was a blessing in disguise.（雨はかえって好都合だった）' },

    // why: twice ← "tried to hire me" heard as tries before the yes; four ← "finally" heard as one more on top
    { id: 'n1', skill: 'number', level: 'B1', point: 'three', reveals: ['gavein'], seg: [12.3, 16.9], keep: true,
      stem: 'How many times had the firm tried to hire him?',
      choices: ['Once', 'Twice', 'Three times', 'Four times'], a: 2,
      cue: '「hire me」のすぐあと。',
      line: 'They’ve tried to hire me *three times*.',
      said: '「会計事務所に入った。3回誘われて、ついに折れた」と話す。',
      mean: '何度も誘われていたので、仕事はすぐ見つかった、という流れ。',
      trap: 'three の th は日本語にない音で、短く弱いと別の数に聞こえやすい。times の直前を聞く。',
      use: 'I’ve asked you three times already.（もう3回も頼んだよ）' },

    // R fix: V2/S1. "finally" in the stem gave away a yes after no; stem reworded, "gave notice" swapped for "gave up"
    // why: gave up ← "gave in" and "gave up" sound alike and both mean stopping; handed in ← "give in" confused with
    //   "hand in" (提出)
    { id: 'p2', skill: 'phrase', level: 'B2', point: 'gavein', seg: [13.8, 17.0],
      stem: 'What does the man say he did about the firm’s offers?',
      choices: ['Said yes after saying no before', 'Gave up on them and said no', 'Handed in an application form'], a: 0,
      cue: '「finally」のあとの短い二語。',
      line: 'I *finally gave in*.',
      said: '「何度も誘われて、ついに折れた」と言う。',
      mean: 'give in ＝ 根負けする、折れる。ずっと断っていたことも伝わる。',
      trap: 'give in を give up や hand in と混ぜやすい。in は「中へ」でなく「折れる」の意味。',
      use: 'Okay, I give in. Let’s get pizza.（分かった、折れるよ。ピザにしよう）' },

    // R fix: V2. "first day" was weak and "plan" overstated it; key now "inventing", with a cook-up-a-story distractor
    // why: cooking ← taken literally (料理); a story ← "cook up" also means inventing an excuse
    { id: 'p3', skill: 'phrase', level: 'B2', point: 'cooking', seg: [16.6, 22.2],
      stem: 'What does the man mean by what he’s been doing all week?',
      choices: ['Inventing something new on his own', 'Cooking a big meal to surprise her',
                'Making up a story to tell her'], a: 0,
      cue: '「I’ve been」のあとの動詞と up。',
      line: 'I’ve been *cooking up* something pretty big.',
      said: '「かなり大きなことをたくらんでいた」と言う。',
      mean: 'cook up ＝ 計画や作り話をこっそり考え出す。料理の話ではない。',
      trap: 'cook を料理と取りやすい。cook up のように up が付くと「考え出す」の意味になる。',
      use: 'What are you two cooking up?（二人で何たくらんでるの？）' },

    // why: sure it'll go better ← "should be different" heard without "hopefully"; fed up ← the claymation memory
    //   heard as the point
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'hopefully', seg: [22.0, 29.0],
      stem: 'How does the woman feel about his new project, talking to the camera?',
      choices: ['Hopeful it will go better, but not too sure', 'Sure it will go better, since he has learned',
                'Sure it will go the same, and fed up already'], a: 0,
      cue: '文の最後に付け足した一語。',
      line: 'he got deep into claymation. So this *should be different*, *hopefully*.',
      said: '「前はクレイアニメにはまった。今回は違うはず、たぶん」と話す。',
      mean: '最後の hopefully に自信のなさが出る。前回を思い出して心配している。',
      trap: 'should be different だけで言い切りに取りやすい。最後に足した一語が本音。',
      use: 'It should be easy, hopefully.（簡単なはず、たぶん）' },

    // R fix: V2. "something useful this time" was weak; replaced with the sales-pitch reading of the demo
    // C2 the talking head against the scene
    // anchor: 22.5–28.6 s "The last time… he got deep into claymation. So this should be different, hopefully";
    //   then 30.6–46.1 s "a brand-new gaming experience. 8 to 12 players… he wears this hat": a week's hobby, gone
    //   just as deep
    // why: worth selling ← "a brand-new gaming experience" taken as a real pitch; for the firm ← "accounting firm" is the
    //   only work word near the game
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'hopefully', seg: [22.0, 46.4],
      stem: 'After the woman’s comment to the camera, how should we see his game?',
      choices: ['As last time again: a hobby he has sunk into', 'As a real change: a game good enough to sell',
                'As a work plan: something for the new firm'], a: 0,
      cue: 'カメラへの一言と、そのあとの説明の細かさ。',
      line: 'he *got deep into claymation*. So this should be different, hopefully. — Presenting *the Cones of Dunshire*…',
      said: 'カメラに「前はクレイアニメにはまった。今回は違うはず、たぶん」と言い、すぐゲームの説明になる。',
      mean: 'カメラへの一言が次の場面の見方を決める。説明の細かさで、前回と同じだと分かる。',
      trap: 'should be different をそのまま信じやすい。この形式では、次の場面が答え合わせ。',
      use: 'Famous last words.（そう言って、だいたいそうならない）' },

    // R fix: V2. "stops early" was weak; replaced with a "never mind" = gives up reading
    { id: 'g2', skill: 'gist', level: 'B2', point: 'sprawl', reveals: ['hownot', 'actually', 'lumber'], seg: [30.0, 92.5],
      stem: 'How does the man’s explanation of the game go?',
      choices: ['It keeps growing, and he adds to it as he goes', 'It goes smoothly, and she gets into it too',
                'It falls apart once he forgets a key rule'], a: 0,
      cue: '説明の途中で、話が戻ったり足されたりする所。',
      line: 'Actually, let me tell you more about… Um, never mind… *How have I not thought of this before?*',
      said: '説明の途中で別の話に行きかけてやめ、さらに新しいルールまで思いつく。',
      mean: 'ルールが説明しきれないほど多く、話しながら増えていく。作った本人が一番夢中。',
      trap: 'never mind で行きづまったと取りやすいが、すぐ続けて新しい案まで出る。',
      use: 'Long story short, it got complicated.（要するに、ややこしくなった）' },

    // why: twenty ← -ty/-teen and twelve/twenty share "tw-"; two ← "to" heard as "two"
    { id: 'n2', skill: 'number', level: 'B1', point: 'players', seg: [34.6, 37.6], keep: true,
      stem: 'How many players is the game for?',
      choices: ['2 to 8', '8 to 12', '8 to 20'], a: 1,
      cue: '「experience」のすぐあとの数。',
      line: '*Eight to 12 players*.',
      said: '「8人から12人で遊ぶ」と言う。',
      mean: 'eight to twelve ＝ 8〜12人。家で二人で遊ぶには多すぎる、大がかりなゲーム。',
      trap: 'to は two と同じ音。twelve と twenty は最初が同じなので、最後の v の音で聞き分ける。',
      use: 'The table seats six to eight.（そのテーブルは6〜8人掛け）' },

    // why: money ← "ledger" is an accounts book (帳簿); rules ← "the arbiter" is named just before
    { id: 'd3', skill: 'detail', level: 'B1', point: 'ledger', seg: [41.8, 46.4],
      stem: 'What is the ledgerman’s job in the game?',
      choices: ['He just keeps the score', 'He keeps all the money', 'He decides on the rules'], a: 0,
      cue: '「the ledger man」のあとの動詞。',
      line: 'the ledger man *just keeps score*, and he wears this hat.',
      said: '「帳簿係は点数をつけるだけ。それとこの帽子をかぶる」と言う。',
      mean: 'keep score ＝ 点数をつける。役は小さいのに専用の帽子がある、という細かさ。',
      trap: 'ledger（帳簿）からお金の係と取りやすい。役の名前より、そのあとの動詞を聞く。',
      use: 'You keep score, I’ll deal.（君は点数係、僕が配るよ）' },

    // why: trivia ← "trivia cards" come up a moment later; challenge ← "the challenge play" comes right after
    { id: 'd4', skill: 'detail', level: 'B1', point: 'cone', seg: [46.6, 53.3],
      stem: 'What must a player do to get a cone?',
      choices: ['Build up a whole civilization', 'Answer one of the trivia cards',
                'Beat another player in a challenge'], a: 0,
      cue: '「in order to get a cone」のあと。',
      line: 'in order to get a cone, you have to *build a civilization*.',
      said: '「4つ集めたら勝ち。でも1つ取るには文明を作る」と言う。',
      mean: '1つのために文明を作る、という大げさなルール。ゲームの重さが伝わる。',
      trap: 'このあと trivia や challenge が出るので混ざりやすい。in order to のあとが条件。',
      use: 'To get in, you have to show ID.（入るには身分証が必要です）' },

    // why: really ← "actually" read as 実は/本当に, stressing a fact; confession ← "actually" read as admitting
    //   something hidden
    { id: 'm1', skill: 'marker', level: 'B2', point: 'actually', reveals: ['gonna'], seg: [53.4, 61.8],
      stem: 'Right after he names the challenge play, what does his next word signal?',
      choices: ['A change in what he will explain first', 'A stress that the challenge play is real',
                'A fact about the game he had kept back'], a: 0,
      cue: '「challenge play」のすぐあとの一語。',
      line: '*Actually*, let me tell you more about the trivia cards ’cause you’re gonna need to know…',
      said: '「挑戦プレイがすごい。いや、やっぱり先にカードの話を」と言い直す。',
      mean: 'この actually は「やっぱり」。話す順番を変える合図で、事実の強調ではない。',
      trap: 'actually を「実は」と覚えていると秘密の話に聞こえる。言い直しの合図にもなる。',
      use: 'Actually, let’s meet at six instead.（やっぱり6時にしよう）' },

    // R fix: S2/N1. the stem quoted "about it first", but the audio has "roadblocks" (captions "Roblox"); the gap is
    //   now "'cause you're" only, which both sources agree on, so the ear check is gone
    // why: were ← "you're" and "you were" sound alike when weak; so ← the weak "'cause" heard as "so"; not ← the
    //   stretch heard as a warning against it
    { id: 's1', skill: 'sound', level: 'B2', point: 'gonna', seg: [57.0, 61.1],
      stem: 'Fill the gap: “…about the trivia cards ___ gonna need to know…”',
      choices: ['’cause you’re', '’cause you were', 'so you’re', '’cause you’re not'], a: 0,
      cue: '「trivia cards」のすぐあと、速く弱い音。',
      line: 'the trivia cards *’cause you’re* gonna need to know… first.',
      said: '「先に知っておく必要があるから」。’cause you’re が「カジャ」のように短くつながる。',
      mean: '’cause ＝ because。理由を後から足している。',
      trap: 'you’re は弱いと you were に聞こえる。not があれば強く残る。',
      use: 'Bring a jacket, ’cause it’s gonna rain.（上着持ってきて、雨降るから）' },

    // R fix: V2. "called perfect" was weak; replaced with a "buy" reading (roll, buy, action follows)
    // why: impossible roll ← "16" from “three dice” sounds like too much (it isn't: 3–18); buy ← "roll, buy, action"
    //   comes right after
    { id: 'h1', skill: 'humor', level: 'C1', point: 'dice', seg: [65.3, 70.7],
      stem: 'Why is the rule about rolling three dice funny?',
      choices: ['The roll only decides how many dice to roll next',
                'The roll only decides how many dice to buy next', 'The roll gives a total three dice can’t reach'], a: 0,
      cue: '「to see how many」のあと。',
      line: 'you roll three dice *to see how many dice you roll with*. Oh, 16.',
      said: '「3つ振って、何個で振るか決める」と言い、16と出て喜ぶ。',
      mean: 'サイコロを振るためにサイコロを振る、回りくどいルール。結果は16個で、さらに大ごとに。',
      trap: '16 を3つでは出ない数と思いやすいが出る。おかしさは数でなく、ルールの回りくどさ。',
      use: 'We need a meeting to plan the meeting.（会議の計画のための会議が要る）' },

    // R fix: V2. "loves the name" was weak; replaced with a hint that the name should change
    // why: rename ← "What is this called" heard as doubt about the name; look it up ← a name asked for so it can be
    //   found later
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'calledagain', seg: [81.2, 84.4],
      stem: 'When the woman asks the game’s name, what does her question suggest?',
      choices: ['She has lost track amid all the rules', 'She hints that the name should be changed',
                'She wants the name so she can find it'], a: 0,
      cue: '質問の最後の一語。',
      line: 'What is this called *again*?',
      said: 'ずっと説明を聞いたあとで「これ、何て名前だっけ？」と聞く。',
      mean: '文末の again ＝「前に聞いたけど」。最初に聞いた名前を忘れるほど、話が長く細かい。',
      trap: 'again を「もう一度聞きたい」と取りやすい。質問の again は、忘れたことを示す。',
      use: 'Sorry, what was your name again?（すみません、お名前何でしたっけ）' },

    // R fix: V2/K6. the key was the only nuanced, longest choice; all three are now "He has … rule"
    // why: breaks it ← "Oh, my God" heard as alarm at a problem; recalled ← "How have I not thought of this" heard as
    //   remembering an old rule
    { id: 'i3', skill: 'infer', level: 'B2', point: 'lumber', reveals: ['hownot'], seg: [83.0, 89.7],
      stem: 'What does the man’s outburst about the maverick show?',
      choices: ['He has just thought up a brand-new rule', 'He has recalled a rule he left out earlier',
                'He has spotted a rule that breaks the game'], a: 0,
      cue: '「Oh, my God」のあとの「should」。',
      line: 'The maverick *should be able to trade* lumber for agriculture credits. *How have I not thought of this before?*',
      said: '「マーベリックは材木を農業ポイントと交換できるべきだ」と言い出す。',
      mean: '説明中に新しいルールを思いつく。ゲームはまだ増え続けている。',
      trap: 'Oh, my God で問題や思い出しと取りやすい。should be able to は新しい案。',
      use: 'Why didn’t I think of that before?（なんで前に思いつかなかったんだろう）' },

    // A linked stretch, both sources agree
    { id: 'x1', skill: 'dict', level: 'B2', point: 'hownot', reveals: ['lumber'], seg: [87.8, 90.0],
      stem: 'Type the gap: “___ thought of this before?” (4 words)', answer: 'how have i not',
      cue: '「credits」のすぐあと、速い四語。',
      line: '*How have I not* thought of this before?',
      said: '「なんで今まで思いつかなかった」。How have I が「ハウヴァイ」とつながる。',
      mean: 'How have I not…? ＝ なぜ〜しなかったのかと自分に驚く。',
      trap: 'have が弱く、ほぼ v だけ。強い not を手がかりに前を埋める。',
      use: 'How have I not seen this movie?（なんでこの映画見てなかったんだろう）' },

    // R fix: V2. "help make it better" was weak; replaced with "nothing" at face value (謙遜)
    // why: just fun ← "nothing" taken at face value, the Japanese 謙遜 frame; unfinished ← "nothing" heard as "not done
    //   yet"
    { id: 'pr3', skill: 'pragma', level: 'C1', point: 'nothing', seg: [90.0, 93.7],
      stem: 'What is the man doing with his question about the game?',
      choices: ['Inviting her to tell him it is something big', 'Telling her the game is just a bit of fun',
                'Admitting the game is not finished yet'], a: 0,
      cue: '文末に付けた短い一語。',
      line: '*This is nothing, right?*',
      said: '夢中で説明したあと「こんなの大したことないよね？」と聞く。',
      mean: 'わざと小さく言い、「すごいよ」と返してほしい言い方。',
      trap: '日本語の謙遜のように取りやすい。right? を付けた控えめな一言は、相手の返事を待っている。',
      use: 'It’s nothing special, right?（大したことないよね？）' },

    // R fix: V2/K6. the key was the only two-part, feeling choice; all three are now plain one-part statements
    // C2 what is she trying not to say?
    // anchor: 92.7–96.8 s he asks "This is nothing, right?", and instead of answering she says "Um, when do you go back
    //   to work again?"; his reply "Tomorrow. It's fine. I'll just throw this in the garbage" answers the worry, not
    //   the date
    // why: wants him home ← the question heard as wishing he could stay and finish; forgot ← "again" heard as a plain
    //   memory lapse about the date
    { id: 'nt2', skill: 'attitude', level: 'C2', point: 'work', reveals: ['garbage'], seg: [92.2, 97.4],
      stem: 'When the woman asks about his job, what is she trying not to say?',
      choices: ['That the game is taking over his life', 'That she has lost track of when he starts',
                'That she wants him home to finish the game'], a: 0,
      cue: '彼の質問に答えたかどうかと、彼の返事。',
      line: 'This is nothing, right? — *Um, when do you go back to work again?* — Tomorrow. *It’s fine*.',
      said: '「大したことないよね？」に答えず、「えっと、仕事いつからだっけ？」と聞く。彼は「明日。大丈夫」と返す。',
      mean: '答えず話を変えるのが本音。彼の「大丈夫、捨てる」は日付でなく心配への返事。',
      trap: '質問を言葉どおり日付の確認と取りやすい。答えずに話を変えたら、言えないことがあるしるし。',
      use: 'So… when’s your flight again?（で…飛行機いつだっけ？）' },

    // why: relieved ← "It's fine" taken at face value; planned ← "just throw this" heard as a casual, long-held plan
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'garbage', seg: [93.3, 97.4],
      stem: 'How does the man take her question about work?',
      choices: ['Hurt: he says he’ll throw it all out', 'Relieved: he is glad to be done with it',
                'Calm: he always meant to throw it out'], a: 0,
      cue: '「Tomorrow」のあとの二つの文。',
      line: 'Tomorrow. *It’s fine*. I’ll *just throw this in the garbage*.',
      said: '「明日。大丈夫。これはゴミ箱に捨てるよ」と言う。',
      mean: '1週間の作品を一言で捨てると言う。It’s fine は大丈夫ではないときの言い方で、すねている。',
      trap: 'It’s fine を言葉どおりに取りやすい。大きすぎる反応と並んだら、強がりを疑う。',
      use: 'No, it’s fine. I’ll just eat alone.（いいよ、一人で食べるから）' },
  ]
};
