// “How to Prevent the Spread of Germs - The Office US” (the official The Office channel, BEST OF SEASON 7 - The Office
// US): a presenter gives the office tips against colds (a keyboard study, the "vampire cough", hand washing, sanitizing
// stations); a coworker objects that germs make you stronger, wants "desanitizing" stations instead, is taken at his
// word with a sneeze, and defends the idea to the camera.
// Segments from the captions, words from whisper (2026-11-16). Nobody is named in the audio: "the presenter", "the
// coworker" (the germ fan), and "another coworker" (the one who brings up sneezing).
// Untested on purpose: 13–18 s (the "your mama" joke: an insult), 18–21 s (whisper "Sorry. I'm done. All right.",
// captions lack it), 30.5 s (whisper "cough", captions "coffee"), 38.4 s ("Because of the euro": the joke needs world
// knowledge), 63–65 s (whisper "desanitizing", captions "handy sanitizing"), 93.3 s (captions "hurt you", whisper lacks it).
// REVIEW 2026-11-16: pass 11, fix 9, drop 1, new 0; ear checks 2
//   Open: d2 and f2 are near 50 % on a blind read (f2's read leans on i2/g1, which reveal its point, so they never
//   meet in a draw).
// EAR CHECK: 32.8–35.1 s a1 c1 — "Uh-huh. Right." and "And ruin their cloaks" are one speaker (the "And" follows 0.4 s
//   later in the captions; both items assume it)
// EAR CHECK: 81.7–84.5 s h1 — a sneeze is heard before "You're welcome" (captions have "but" at 81.7 s, then nothing
//   until 84.5 s; whisper has neither)
import type { Clip } from '../types.ts';

export const germsTalk: Clip = {
  id: 'germstalk', video: 'L-NSPhLHIBA', title: 'How to Prevent the Spread of Germs  - The Office US', dur: 124,
  wpm: 150, band: 'slow', tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 55 %). "Take the tips without fuss" was a filler, and "more germs, not fewer" the only two-part
    //   choice. All three are now one coworker's objection, with the near-sound "sanitizing" reading as a distractor.
    // why: not clean enough ← "desanitizing" heard as "sanitizing" (the captions have "handy sanitizing"); cost ← "They
    //   will cost you your life" heard as money
    { id: 'g1', skill: 'gist', level: 'B2', point: 'scene', reveals: ['cost', 'coddle', 'bowl'], seg: [0, 100.5],
      stem: 'How does the presenter’s talk end up going?',
      choices: ['A coworker argues the office is too clean', 'A coworker argues the office isn’t clean enough',
                'A coworker argues the plan costs too much'], a: 0,
      cue: '消毒の話のあと、一人が何を主張し続けるか。',
      said: '風邪予防のコツを話すが、一人が「消毒は体を弱くする。むしろ菌に触れろ」と言い張る。',
      mean: '予防の話が、正反対の説への反論の場になる。最後はカメラにまでその説を語る。',
      trap: 'cost は「お金がかかる」と取りやすいが、ここでは「命取り」。主張の中身を追う。',
      use: 'Let’s get back on track.（話を元に戻しましょう）' },

    // R fix: V2 (blind 65 %) and S3. The key was the only general, upbeat choice. Now three summaries of the same kind;
    //   the near miss is cure vs prevention. The cue's "to" became a word only the key had: reworded.
    // why: getting over a cold ← "under the weather" and "flu shot" heard as advice for the sick; dirty office ← the
    //   keyboard study is the first long stretch
    { id: 'g2', skill: 'gist', level: 'B1', point: 'tips', seg: [0, 52.0],
      stem: 'What is most of the presenter’s talk made of?',
      choices: ['Everyday steps to stop germs spreading', 'Everyday tips for getting over a cold',
                'Facts about how dirty the office is'], a: 0,
      cue: '話の並べ方の言葉と、そのあとに続く項目。',
      line: 'One of the *simplest ways* to cut down on the spread of germs… *other things you can do*…',
      said: '調査の話から入り、せきの仕方、手洗い、休むこと、予防接種と、簡単な対策を並べる。',
      mean: '話の中心はうつさないための対策のリスト。調査は導入にすぎない。',
      trap: '体調の話から「治し方」と取りやすい。spread（広がる）が何度も出るので予防の話。',
      use: 'Here are some simple things to try.（簡単にできることをいくつか）' },

    // why: had ← "have been" heard as a past report; you ← "us" and "you" are both short, and a presenter often says
    //   "you"; you had ← both slips at once
    { id: 's1', skill: 'sound', level: 'B2', point: 'lotofus', seg: [0, 3.9],
      stem: 'Fill the gap: “I know ___ been feeling…”',
      choices: ['a lot of us have', 'a lot of us had', 'a lot of you have', 'a lot of you had'], a: 0,
      cue: '冒頭の数語。代名詞と、そのあとの弱い音。',
      line: 'I know *a lot of us have* been feeling…',
      said: '「最近、私たちの多くが体調を崩してる」と切り出す。',
      mean: 'a lot of us have が一続きになり、have は弱く「ヴ」程度。',
      trap: '弱い have は had と区別しにくい。lately があれば今まで続く have been。',
      use: 'A lot of us have been busy lately.（最近みんな忙しくて）' },

    // R drop: f1 (phrase, "under the weather"). The clip is about colds, so "a bit unwell" is the key from the topic
    //   alone (blind 75 %), and no weather-reading distractor can compete. The phrase stays in s1's line.

    // R fix: V2 (blind 60 %). The stem's "feeling ill" made the only cold-related choice the key. A second cold reading
    //   ("this year in particular") is now the near miss; the checkups filler is gone.
    // why: worse this year ← "that time" heard as pointing at this year; year-end ← "time of year" heard as the end of
    //   the year
    { id: 'i1', skill: 'infer', level: 'B2', point: 'season', seg: [0, 3.9],
      stem: 'Right after mentioning people feeling ill, what does the presenter suggest?',
      choices: ['Colds go around at this point every year', 'This year has been worse than most for colds',
                'The year is ending and everyone is worn out'], a: 0,
      cue: '体調の話の直後、短い一文。',
      line: 'It’s *that time of year*.',
      said: '体調を崩す人が多いと言い、「そういう時期だから」と足す。',
      mean: 'that time of year ＝ 毎年それが起こる季節。ここでは風邪がはやる時期。',
      trap: 'year から年末を、that から「今年は特別」を連想しやすい。毎年の季節の決まり文句。',
      use: 'It’s that time of year again.（またこの季節が来たね）' },

    // why: health agency ← a study about germs sounds official; the company ← "Sabre" is named later as the employer
    { id: 'd1', skill: 'detail', level: 'B1', point: 'study', seg: [3.5, 13.4],
      stem: 'Who did the study the presenter mentions?',
      choices: ['A U.S. university', 'A U.S. health agency', 'Their own company'], a: 0,
      cue: '「according to a study done by」のあと。',
      line: 'according to a study done by *the University of* Arizona…',
      said: '「アリゾナの大学が行った調査によると」と言う。',
      mean: '話の根拠として大学の研究を挙げる。数字に重みを持たせる前置き。',
      trap: '健康の話なので公的機関を想像しやすい。by のあとを最後まで聞く。',
      use: 'According to a recent study…（最近の調査によると）' },

    // why: thousands ← hundreds/thousands are easy to swap; dozens ← "-s of times" heard without the number; ten ←
    //   a modest figure that sounds believable
    { id: 'n1', skill: 'number', level: 'B1', point: 'hundreds', seg: [3.5, 13.4], keep: true,
      stem: 'How many times more bacteria do keyboards have than a toilet seat?',
      choices: ['Ten times', 'Dozens of times', 'Hundreds of times', 'Thousands of times'], a: 2,
      cue: '「keyboards have」のすぐあと。',
      line: 'your keyboards have *hundreds of times* more bacteria per square inch than a toilet seat.',
      said: '「キーボードには、便座の何百倍もの細菌がいる」と言う。',
      mean: 'hundreds of times ＝ 何百倍。大げさに聞こえる数字で注意を引いている。',
      trap: 'hundreds と thousands は入れかわりやすい。h と th の音を聞き分ける。',
      use: 'It’s hundreds of times faster.（何百倍も速い）' },

    // R fix: V2 (blind 65 %). "Clears up" was the only sensible move. All three are now two-step moves built on
    //   "Oh, no" and the vampire picture.
    // why: takes it back ← "Oh, no" heard as dismay (しまった), so a retreat follows; a vampire story ← "if a vampire had
    //   to cough" heard as the start of a tale
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'name', seg: [24.0, 32.6],
      stem: 'When a coworker asks about the word “vampire”, what does the presenter do?',
      choices: ['Plays it down, then explains the name', 'Takes it back, then renames the cough',
                'Says yes, then tells a vampire story'], a: 0,
      cue: '質問への短い返事と、「It’s just that」のあと。',
      line: 'Oh, *no*. *It’s just that if a vampire* had to…',
      said: '「いえ、吸血鬼がせきをするならこうする、というだけ」と答える。',
      mean: 'Oh, no は誤解の打ち消し。It’s just that で名前の由来を説明する。',
      trap: 'Oh, no を「しまった」と取ると撤回に聞こえる。just that は軽い打ち消し。',
      use: 'Oh, no, it’s just a nickname.（いえ、ただのあだ名です）' },

    // anchor: 33.8–37.7 s right after "Uh-huh. Right." come "And ruin their cloaks?" and "how expensive wool is in
    //   Transylvania": the objection is about what a real vampire would do with its cloak
    // why: germs ← the scene is a health talk, so a doubt about the advice is the expected script; too silly ← the
    //   doubt read as an objection to the childish name
    // R fix: V4. The item asks what the objection targets, an inference, not a feeling: skill attitude → infer.
    { id: 'c1', skill: 'infer', level: 'C2', point: 'doubt', seg: [25.9, 39.35],
      stem: 'What is the coworker’s doubt about the vampire cough really aimed at?',
      choices: ['Whether a real vampire would cough that way', 'Whether coughing that way really stops germs',
                'Whether a name like that is fit for work'], a: 0,
      cue: '相づちのあと、マントと毛糸の値段の話。',
      line: 'Uh-huh. Right. And *ruin their cloaks*? Do you have any idea *how expensive wool is in Transylvania*?',
      said: '「なるほど。それでマントを汚す？トランシルバニアの毛糸がいくらするか知ってる？」と言う。',
      mean: '疑っているのは予防法でなく、吸血鬼の行動としての正しさ。たとえ話を本物の話として聞いている。',
      trap: '健康の話の最中なので、効き目への疑いと取りやすい。反論の中身の語（cloak、wool）が的を示す。',
      use: 'That’s not how it works in real life.（実際はそうはいかないよ）' },

    // R fix: V2 (blind 55 %). "Bored" was a filler. The Japanese aizuchi frame (polite listening) replaces it.
    // why: convinced ← "Uh-huh. Right." heard as agreeing nods; polite ← the aizuchi frame: short replies that only
    //   show one is listening
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'doubt', seg: [27.8, 38.2],
      stem: 'How does the coworker take the explanation of the vampire cough?',
      choices: ['Doubtful; finding a hole in it', 'Convinced; seeing the point now', 'Polite; just letting her go on'],
      a: 0,
      cue: '短い相づち二つと、すぐに続く「And」。',
      line: '*Uh-huh. Right. And* ruin their cloaks?',
      said: '「ああ、なるほどね。それでマントを台なしに？」と返す。',
      mean: 'Uh-huh. Right. のあとに And で反論が続く。相づちは納得でなく、疑いの前置き。',
      trap: '相づちは賛成に聞こえやすい。すぐあとに And や But で反論が来るかを聞く。',
      use: 'Uh-huh. Right. And who pays for that?（へえ。で、誰が払うの？）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'flushot', seg: [46.5, 48.9],
      stem: 'Type the last tip: “and ___.” (4 words)', answer: 'get your flu shot',
      cue: '手洗いと休む話のあと、最後の項目。',
      line: 'and *get your flu shot*.',
      said: '最後に「インフルエンザの予防接種を受けて」と言う。',
      mean: 'get your が「ゲッチョア」とつながる。flu shot ＝ インフルエンザの予防接種。',
      trap: 'get と your がつながり一語に聞こえやすい。shot は「ショット」より短く強い。',
      use: 'Did you get your flu shot yet?（もう予防接種した？）' },

    // why: flu shots ← "flu shot" comes just before, in the same list; tissues ← a common office step against colds
    { id: 'd2', skill: 'detail', level: 'B1', point: 'stations', seg: [46.9, 52.0],
      stem: 'What does the presenter plan to set up around the office?',
      choices: ['Places to clean your hands', 'Places to get a flu shot', 'Places to pick up tissues'], a: 0,
      cue: '「Also」のあと、「stations」の前の語。',
      line: 'I’m going to set up *hand sanitizing stations* around the office.',
      said: '「オフィスのあちこちに手の消毒所を置きます」と言う。',
      mean: 'hand sanitizing ＝ 手の消毒。station は「〜する場所」。',
      trap: '直前の flu shot が耳に残りやすい。Also のあとは新しい項目。',
      use: 'Is there a place to wash my hands?（手を洗える所はありますか）' },

    // R fix: V2. The fumes reading was outside anything said. A keyword trap on "fight their own battles" replaces it.
    // why: money ← "cost" read as price (the usual objection to new equipment); look after themselves ← "They need to
    //   fight their own battles" heard as being about the staff, not the immune system
    { id: 'i2', skill: 'infer', level: 'C1', point: 'cost', reveals: ['stations', 'coddle'], seg: [51.6, 60.8],
      stem: 'Why is the coworker against the presenter’s stations?',
      choices: ['Too much cleaning leaves the body weak', 'The stations would cost too much money',
                'Staff should look after their own health'], a: 0,
      cue: '「Elaborate」のあと、免疫の話。',
      line: 'They will *cost you your life*. — Elaborate. — The worst thing you can do for your *immune system*…',
      said: '「命取りだ」と言い、説明を求められて、免疫を守りすぎるのが最悪だと話す。',
      mean: 'cost you your life ＝ 命を奪う、の大げさな言い方。',
      trap: 'cost でお金の話と取りやすい。ここは値段でなく代償。',
      use: 'One mistake could cost you the game.（一つのミスで試合を落とすよ）' },

    // why: push hard ← "fight their own battles" right after heard as the thing to avoid; leave alone ← the opposite
    //   reading: neglect, not care
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'coddle', seg: [55.8, 60.8],
      stem: 'What does the coworker call the worst thing to do for your immune system?',
      choices: ['Protect it too much', 'Push it too hard', 'Leave it on its own'], a: 0,
      cue: '「immune system is to」のあとの動詞。',
      line: 'The worst thing you can do for your immune system is to *coddle* it.',
      said: '「免疫にとって最悪なのは、甘やかすことだ」と言う。',
      mean: 'coddle ＝ 甘やかす、過保護にする。だから「自分で戦わせろ」と続く。',
      trap: '後ろの fight から「無理させる」を選びやすい。最悪なのは守りすぎのほう。',
      use: 'Don’t coddle him. He’ll be fine.（甘やかさないで。大丈夫だから）' },

    // R fix: V2 (blind 50 %). "Garlic" made the key the only plausible odd one out; "candy" (the usual office bowl) is
    //   the script a partial listener falls back on.
    // why: soap ← the presenter's sanitizing stations; candy ← the usual bowl on an office desk
    { id: 'd3', skill: 'detail', level: 'B1', point: 'bowl', seg: [65.4, 71.0],
      stem: 'What would fill the bowls the coworker wants around the office?',
      choices: ['Dirt and filth', 'Soap and water', 'Candy and snacks'], a: 0,
      cue: '「filled with」のあとに並ぶ語。',
      line: 'A simple bowl at every juncture filled with *dirt, vomit, fecal matter*.',
      said: '「あらゆる所に、泥や汚物を入れたボウルを置くべきだ」と言う。',
      mean: '消毒の逆。わざと菌に触れさせるための入れ物。',
      trap: '消毒の話の流れで石けんを想像しやすい。filled with のあとを聞く。',
      use: 'The bowl was filled with candy.（ボウルはお菓子でいっぱいだった）' },

    // why: agreeing ← the Japanese frame: a follow-up example read as support; warning ← "if I had to sneeze" heard as a
    //   real sneeze coming
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'rationale', seg: [70.9, 79.3],
      stem: 'When sneezing comes up, what is the other coworker doing?',
      choices: ['Taking the idea to an extreme to test it', 'Agreeing and adding an example of it',
                'Warning everyone that a sneeze is coming'], a: 0,
      cue: '文頭の「So by that」と、そのあとの極端な例。',
      line: '*So by that rationale*… I should just *sneeze on you*.',
      said: '「その理屈なら、くしゃみはあなたにかければいいことになる」と言う。',
      mean: 'by that rationale ＝ その理屈なら。極端な結論で説のおかしさを示す。',
      trap: '例を足すので賛成に聞こえやすい。by that で始まる例は反論が多い。',
      use: 'By that logic, we should never sleep.（その理屈なら、寝ちゃいけないことになる）' },

    // why: face-saving ← a yes after a challenge read as not wanting to lose; telling off ← a firm short "Yes." heard as
    //   annoyance
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'welcome', seg: [74.7, 81.6],
      stem: 'How does the coworker answer the sneezing idea?',
      choices: ['Eager; happy to be sneezed on', 'Grudging; saving face', 'Cross; wanting it to stop'], a: 0,
      cue: '「Yes」のあとの一言の動詞。',
      line: 'Yes. *I would welcome it*.',
      said: '「ああ。大歓迎だ」と答える。',
      mean: 'welcome ＝ 喜んで受け入れる。自分の説どおり、本気で受けて立っている。',
      trap: '挑発への Yes は強がりに聞こえやすい。welcome は「しぶしぶ」でなく「喜んで」。',
      use: 'Any feedback? I’d welcome it.（意見があれば、ぜひ）' },

    // R fix: V2 (blind 50 %) and S4. Only the key named the earlier request; now the choices are three short readings of
    //   the phrase. The segment ended 0.1 s after "welcome" (85.5 s): now 86.1.
    // why: sorry ← "You're welcome" heard as a kind of "excuse me" after a sneeze (すみません); thanks ← the set phrase
    //   confused with its partner, "thank you"
    { id: 'h1', skill: 'humor', level: 'C1', point: 'yourewelcome', reveals: ['welcome'], seg: [74.7, 86.1],
      stem: 'Why does “You’re welcome” after the sneeze get a laugh?',
      choices: ['It turns his own word back on him', 'It is a cheeky way of saying sorry',
                'It thanks him for being such a good sport'], a: 0,
      cue: 'くしゃみの前に、相手が何と言っていたか。',
      line: 'I would *welcome* it. … *You’re welcome*.',
      said: '「大歓迎だ」と言った相手に、くしゃみをかけてから「どういたしまして」と言う。',
      mean: '相手の welcome を逆手に取り、くしゃみを頼まれた贈り物のように扱っている。',
      trap: 'くしゃみのあとなので謝罪やお礼と取りやすい。前の一言と同じ語が返ってくる仕掛け。',
      use: 'You asked for it, so you’re welcome.（頼まれたからね、どういたしまして）' },

    // anchor: 85.7–99.3 s to the camera: "The principle is sound", "I don't know why everyone doesn't do this": the idea
    //   is defended with no wink, so the "Yes. I would welcome it" just before was meant
    // why: bluff ← a yes to a dare read as not backing down (a2's trap); playing along ← "welcome" heard as joining in the
    //   other coworker's joke
    { id: 'c2', skill: 'infer', level: 'C2', point: 'welcome', reveals: ['principle', 'forever'], seg: [74.9, 99.9],
      stem: 'After the comment to the camera, how should we hear “I would welcome it”?',
      choices: ['As meant: germs really are wanted', 'As a bluff: not wanting to lose',
                'As a joke: going along with it'], a: 0,
      cue: 'くしゃみの場面と、カメラへの話し方を比べて。',
      line: 'Yes. I would welcome it. … *The principle is sound*… *I don’t know why everyone doesn’t do this*.',
      said: '「大歓迎だ」と言ったあと、カメラに「理屈は正しい。なぜみんなやらないのか分からない」と話す。',
      mean: 'カメラへの一言が場面の答え合わせになる。ふざけた様子はなく、さっきの Yes も本気だったと分かる。',
      trap: '挑発への Yes は強がりに見えやすい。この形式では、カメラへの本音で場面を読み直す。',
      use: 'I meant every word of it.（全部本気で言ったんだ）' },

    // why: sounds nice ← sound = 音・サウンド, as in "sounds good"; well known ← "principle" heard as a famous rule
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'principle', seg: [85.2, 92.8],
      stem: 'Speaking to the camera, what does the coworker say about the idea?',
      choices: ['It holds up well', 'It sounds nice', 'It is well known'], a: 0,
      cue: 'カメラに向いた最初の一文、最後の語。',
      line: 'The principle is *sound*.',
      said: '「原理は正しい」と言い、菌に触れて抗体を作れと続ける。',
      mean: 'sound は形容詞で「しっかりした、正しい」。',
      trap: 'sound を「音」や sounds good と取りやすい。be 動詞のあとなら「健全な」。',
      use: 'The plan is sound. Let’s go.（計画はしっかりしてる。やろう）' },

    // why: knows something bad ← "have something" read as having information; owns something ← have = 持っている, read
    //   literally
    { id: 'f4', skill: 'phrase', level: 'B2', point: 'forever', seg: [93.8, 100.2],
      stem: 'In the last line, what does the coworker suggest about other people?',
      choices: ['They must not like the idea of living forever', 'They must know a downside of living forever',
                'They must own something that stops them'], a: 0,
      cue: '最後の一文、「they have」のあと。',
      line: 'Maybe they *have something against* living forever.',
      said: '「みんなやらないのは、永遠に生きるのが嫌なのかも」と言う。',
      mean: 'have something against ＝ 〜が気に入らない。本人は大まじめ。',
      trap: 'have something を「何かを持つ」と取りやすい。against が付けば「〜に反対」。',
      use: 'I have nothing against cats.（猫が嫌いなわけじゃない）' },
  ]
};
