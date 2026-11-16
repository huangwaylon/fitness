// “Chris Gets the Flu | Parks and Recreation” (the official Parks and Recreation channel, Season 3): Chris, who calls
// his body a finely tuned microchip, wears a flu mask and confirms a dinner date with Ann; Ann tells the camera he's
// too perfect for her, then finds him on the floor with the flu, and decides she loves it.
// Segments from the captions, words from whisper (2026-11-16). Ann is named in the audio ("Hey, Ann", 57 s); Chris
// never is, so stems name him from the title. The sources differ at 0–2.8 s ("Good morning" / "Ken Perkins"), 25.2 s
// ("Speaking of" / "Speaking", the "of" weak) and 107.6 s ("This floor is my friend" / "As far as my friends"); no key
// rests on them. No item uses Ann's fart line (50–54 s), the vomit and drawer lines (92–104 s), "Way to go, buddy"
// (38.3 s, speaker unclear) or the floor line.
// REVIEW 2026-11-16: pass 6, fix 14, drop 0, new 0; ear checks 2
//   Open: h2/c1 and a2 still need the phone (speaker of the chip line; Ann's flat "Mhm"). The x1/s1 ear check is
//   dropped: both sources agree on the words.
// EAR CHECK: 20.2–22.4 s h2 / c1 — Ann says "My body's like a chip, too. Potato chip.", and Chris answers "No." (c1's key,
//   the joke is on her own body, rests on the speaker; "my body's" in both sources)
// EAR CHECK: 83.7 s a2 — "Mhm. Well, you definitely have the flu." said flat and calm (the words "definitely have the
//   flu" after "I'm dying" carry it too)
import type { Clip } from '../types.ts';

export const chrisFlu: Clip = {
  id: 'chrisflu', video: '-vmeMdTwy94', title: 'Chris Gets the Flu', dur: 127, wpm: 132, band: 'slow',
  tags: ['恋愛', '職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 — "skilled nurse" leaned on backstory and the key echoed the "problem" too plainly; distractors are
    //   now a put-off date she's nervous about and the joy of looking after him
    // why: put off the date ← the dinner planned for tomorrow, "super, super excited" heard as nerves; looking after
    //   him ← the scene of caring for him, and "I love the flu" read as enjoying the nursing
    { id: 'g2', skill: 'gist', level: 'B2', point: 'lovesflu', reveals: ['perfect'], seg: [2, 116],
      stem: 'Why is Ann happy, in the end, that Chris is sick?',
      choices: ['He no longer seems so perfect to her', 'She can put off a dinner she was nervous about',
                'She gets to look after him, which she enjoys'], a: 0,
      cue: '最後のカメラへの一言と、前半の「問題」。',
      said: '前半で「完璧すぎるのが問題」と話した Ann が、最後に「インフルって最高」と言う。',
      mean: '弱った姿を見て、完璧な人という気おくれが消えた。それで「最高」。',
      trap: '明日の夕食の話が出るので、延期を喜んでいると取りやすい。前半の悩みと結びつける。',
      use: 'He’s human after all.（彼もやっぱり人間だね）' },

    // why: 4½ ← a common record pace (script); 9½ ← "five" and "nine" share their vowel; 6½ ← the number missed and
    //   guessed near
    { id: 'n1', skill: 'number', level: 'B1', point: 'mile', reveals: ['low'], seg: [2.9, 9], keep: true,
      stem: 'How long did Chris’s last mile of the run take?',
      choices: ['4½ minutes', '5½ minutes', '6½ minutes', '9½ minutes'], a: 1,
      cue: '「Ended with a」のすぐあと。',
      line: 'Ended with a *5 1/2-minute mile*, my personal low.',
      said: '「最後の1マイルは5分半、自己ベストだった」と答える。',
      mean: 'five and a half ＝ 5と2分の1。and a は弱く「ファイヴァナハーフ」とつながる。',
      trap: 'five と nine は同じ「アイ」の母音。最初の子音 f と n を聞き分ける。',
      use: 'It takes about five and a half hours.（5時間半くらいかかる）' },

    // why: worst ← "low" read as bad (落ちこみ); felt low ← "low" read as mood, as in "feeling low"
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'low', reveals: ['mile'], seg: [2.9, 10.9],
      stem: 'What is Chris saying about his mile time?',
      choices: ['It’s the fastest he has ever run it', 'It’s the slowest he has run in a while',
                'It’s slower since he felt down today'], a: 0,
      cue: '「my personal」のあとの一語。時間は小さいほど…？',
      line: 'Ended with a 5 1/2-minute mile, *my personal low*.',
      said: '「5分半で走った。自分の最低記録」と言う。',
      mean: 'ふつうは personal best（自己ベスト）。時間は短いほど良いので、low がベストになる。',
      trap: 'low を「悪い」「落ちこむ」と取りやすい。何の数字が low なのかを考える。',
      use: 'Gas prices hit a new low.（ガソリン代が最安値を更新）' },

    // R fix: V2 — "protect his lungs" was a filler; now "keep dust out" (from “a grain of sand”)
    // why: spreading ← "flu prevention" heard as keeping his own flu in (masks often do that); dust ← "a grain of
    //   sand" and the run just before
    { id: 'd2', skill: 'detail', level: 'B1', point: 'mask', seg: [10.6, 19.9],
      stem: 'Why is Chris wearing a mask?',
      choices: ['To keep from catching the flu', 'To keep from spreading his flu', 'To keep dust out on his runs'], a: 0,
      cue: '「What’s with the mask?」への最初の答え。',
      line: 'What’s with the mask? — *Flu prevention*.',
      said: '「なぜマスク？」と聞かれ、「インフルエンザ予防」と答える。',
      mean: 'prevention ＝ 予防。まだかかっていない。かかるのを防ぐためのマスク。',
      trap: 'マスクは「うつさないため」とも取れるが、prevention は自分がかからないための語。',
      use: 'I take vitamin C as prevention.（予防にビタミンCを飲んでる）' },

    // R fix: V2 — "bounces back like a computer" was weak; now "a strict routine" (from “finely tuned”)
    // why: routine ← "finely tuned" heard as needing exact care and habits; proud ← "finely tuned" heard as pure boasting,
    //   and "shut down" missed
    { id: 'i1', skill: 'infer', level: 'B2', point: 'microchip', seg: [12.9, 19.9],
      stem: 'What is Chris’s point when he compares his body to a microchip?',
      choices: ['Even a small illness could stop his whole body', 'His body only works well on a strict routine',
                'Nothing as small as the flu could slow him down'], a: 0,
      cue: '「grain of sand」と、その次の一文。',
      line: 'My body is finely tuned like a microchip, and the flu is like *a grain of sand*. It could literally *shut down the entire system*.',
      said: '「体は精密なチップで、インフルは砂つぶ。全体が止まりかねない」と言う。',
      mean: '精密だからこそ、小さな砂つぶ一つで壊れる。強さの自慢と、もろさの告白が同時にある。',
      trap: 'finely tuned を「強い」と取りやすい。比べたものの大きさの差まで聞く。',
      use: 'One small mistake could ruin everything.（小さなミス一つで全部台なし）' },

    // EAR CHECK: h2 / c1 (header)
    // R fix: V2 — "two meanings" was the only choice naming the wordplay; all three now name what she does with "chip";
    //   S3: the cue no longer says "chip"
    // why: mishears ← the reply taken as a slip, not a joke; junk ← "potato chip" heard as a jab at his boast (junk food)
    { id: 'h2', skill: 'humor', level: 'C1', point: 'chip', seg: [12.9, 24.9],
      stem: 'Why does Ann’s reply to the microchip line get a laugh?',
      choices: ['She switches “chip” from tech to snack food', 'She mishears “microchip” as a kind of snack',
                'She mocks his boast as a lot of junk talk'], a: 0,
      cue: '「too」のあとの一語で、意味がどう変わるか。',
      line: 'My body’s like a chip, too. — *Potato chip*.',
      said: '「私の体もチップみたい。ポテトチップ」と言う。',
      mean: 'chip は半導体とお菓子の二つの意味。Chris の自慢を、お菓子の方にずらしている。',
      trap: '聞きそこないと取りやすいが、わざとの言葉遊び。間を置いた付け足しはオチの合図。',
      use: 'I’m a morning person. Morning coffee person.（朝型。朝コーヒー型ね）' },

    // EAR CHECK: h2 / c1 (header)
    // why: Chris ← the reply follows his boast, so it sounds aimed at him; snacks ← "potato chip" heard as a dig at
    //   junk food, the opposite of his health talk
    // anchor: 20.2–24.4 s "My body's like a chip, too" (her own body is the subject), and Chris answers "No."
    { id: 'c1', skill: 'humor', level: 'C2', point: 'chip', seg: [12.9, 24.9],
      stem: 'In the potato chip joke, who is the joke on?',
      choices: ['Ann herself, and her own body', 'Chris, for bragging about his body', 'Junk food, next to Chris’s diet'],
      a: 0,
      cue: '「My body’s」の主語と、Chris の短い返事。',
      line: '*My body’s* like a chip, too. — Potato chip. — *No*.',
      said: '「私の体もチップ。ポテトチップ」と言うと、Chris は「そんなことない」と打ち消す。',
      mean: '自分の体を袋菓子にたとえる自虐。Chris の No. は、自虐を本気で否定するやさしい返事。',
      trap: '自慢のあとの冗談は相手へのからかいに聞こえやすい。主語が my なら、笑われているのは本人。',
      use: 'My cooking? It’s… creative.（私の料理？…独創的よ）' },

    // R fix: V2 — "bring the chips" was a filler; now "ignores her joke" (an abrupt topic change)
    // why: ignores ← the question about dinner heard as a fresh start; food ← "potato chips" heard as the talk
    //   staying on snacks
    { id: 'm1', skill: 'marker', level: 'B2', point: 'speaking', reveals: ['dinner'], seg: [23.3, 29.6],
      stem: 'How does Chris get from Ann’s joke to his question?',
      choices: ['He picks up her last words as a link', 'He ignores her joke and starts afresh',
                'He keeps the talk on food and snacks'], a: 0,
      cue: 'Chris の文の最初の三語。',
      line: '*Speaking of potato chips*, you and I are on for dinner tomorrow, yes?',
      said: '「ポテトチップと言えば、明日の夕食、予定どおりだよね？」と聞く。',
      mean: 'Speaking of ～ ＝「～と言えば」。相手の言葉を足場に話題を変える。',
      trap: 'potato chips が出るので食べ物の話の続きと取りやすい。あとに来るのは新しい話題。',
      use: 'Speaking of Paris, how was your trip?（パリと言えば、旅行どうだった？）' },

    // R fix: V2 — "on time" was weak; now "whether she's free" (a new invitation, not a check on a set plan)
    // why: paying ← "on" heard as in "it's on me" (おごり); free ← the "yes?" tag heard as a fresh invitation
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'dinner', seg: [25, 34.4],
      stem: 'When Chris asks about tomorrow, what does he want to know?',
      choices: ['Whether their dinner plan still stands', 'Whether she’s free to have dinner with him',
                'Whether she is the one paying for dinner'], a: 0,
      cue: '「you and I are」のあとの短い語。',
      line: 'you and I *are on for dinner* tomorrow, yes? — Yes, definitely.',
      said: '「明日の夕食、予定どおりだよね？」と確かめ、Ann は「もちろん」と答える。',
      mean: 'be on for ～ ＝ ～の予定が決まっている。約束の確認に使う。',
      trap: 'on を「おごり」、yes? を新しい誘いと取りやすい。be on for はセットで。',
      use: 'Are we still on for Friday?（金曜の約束、まだ大丈夫？）' },

    // R: ear check dropped (both sources have "a couple of")
    { id: 'x1', skill: 'dict', level: 'B1', point: 'couple', seg: [39.3, 42.8],
      stem: 'Type what Ann says: “We’ve been on ___ dates.” (3 words)', answer: 'a couple of',
      cue: '「been on」のあと、三語が一続きに。',
      line: 'We’ve been on *a couple of* dates. I really like him.',
      said: '「何回かデートした。彼のこと、すごく好き」と話す。',
      mean: 'a couple of ＝ 2、3の。of は弱く、「アカプラ」と一語のように聞こえる。',
      trap: 'of が消えて a couple だけ書きやすい。数の言い方は of まで聞く。',
      use: 'Give me a couple of minutes.（2、3分ちょうだい）' },

    // R fix: V2 — "talks about his body" was weak; now "can't tell how he feels". S4: gist segment widened to 16 s
    // why: moves too fast ← "a couple of dates" heard as a complaint about pace; can't read him ← "I can't find…"
    //   heard as not knowing where she stands
    { id: 'g1', skill: 'gist', level: 'B1', point: 'perfect', seg: [39.3, 55.6],
      stem: 'In her comment to the camera, what is Ann’s problem with Chris?',
      choices: ['He seems far too perfect to her', 'He is moving too fast with her', 'She can’t tell how he feels about her'],
      a: 0,
      cue: '「The problem is」のあと。',
      line: 'The problem is, he’s like a *perfect human man*. I can’t find one flaw.',
      said: '「何度かデートして、好き。問題は、完璧すぎて欠点が一つもないこと」と話す。',
      mean: '欠点がないことが「問題」。自分と比べて気おくれしている、と分かる。',
      trap: 'can’t find を「分からない」と取りやすい。The problem is のあとが本題。',
      use: 'The problem is, it’s too quiet here.（問題は、ここが静かすぎること）' },

    // why: days ← "a few" heard and the unit guessed; this week ← "just" missed, so "recently" feels enough
    { id: 'd3', skill: 'detail', level: 'B1', point: 'hours', seg: [57.4, 61.4],
      stem: 'When did Ann last see Chris healthy?',
      choices: ['A few hours ago', 'A few days ago', 'Earlier this week'], a: 0,
      cue: '「I just saw you」のあと。',
      line: 'I just saw you *a few hours ago*, and you were fine.',
      said: '「ほんの数時間前に会ったときは元気だったのに」と驚く。',
      mean: 'just と a few hours で「ついさっき」。それだけ急に悪くなった、という驚き。',
      trap: 'a few のあとの単位は短く、days と取りやすい。最後の語まで聞く。',
      use: 'I just talked to her an hour ago.（1時間前に話したばかり）' },

    // R fix: V2 — "healthy, not hot" spelled the key out; choices now same length and register
    // why: he looks good ← "you're fine" heard as a compliment that she means; admitting ← the slang heard as her
    //   real feeling slipping out
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'fine', reveals: ['hours'], seg: [57.4, 64.9],
      stem: 'Why does Ann add a line right after “…and you were fine”?',
      choices: ['To rule out the flirty sense of “fine”', 'To say he still looks good though sick',
                'To let slip that she finds him hot'], a: 0,
      cue: '「Not like」のあとと、最後の語。',
      line: 'you were fine. *Not like, “Damn, you’re fine,” but fine health-wise*.',
      said: '「『いい男』の fine じゃなくて、健康面の fine ね」と言い足す。',
      mean: 'fine は俗語で「かっこいい」。誤解されないよう、あわてて限定する。',
      trap: '言い足した中身を本音と取りやすい。Not like A but B は B だと念を押す形。',
      use: 'Not “cheap” cheap, but affordable.（安っぽいじゃなくて、手頃ってこと）' },

    // R fix: S3 — the cue's "body" was a word only the key had
    // why: ran too hard ← his fast run earlier; mask off ← the mask scene, as if it failed
    { id: 'd4', skill: 'detail', level: 'B1', point: 'fat', seg: [64.7, 69.3],
      stem: 'According to Chris, why did he get sick so quickly?',
      choices: ['His body has no fat to protect it', 'He ran too hard out in the cold', 'He took the mask off too soon'],
      a: 0,
      cue: 'Chris の最初の一文。何がない、と言うか。',
      line: 'My body has *no fat to protect itself* from disease. Things happen very quickly.',
      said: '「僕の体には病気から守る脂肪がない。だから一気に来る」と言う。',
      mean: '体脂肪の少なさを、病気に弱い理由にしている。自慢にも聞こえる言い方。',
      trap: '直前の場面の走りやマスクの話に引っぱられやすい。理由は本人の言葉の中にある。',
      use: 'I have no energy left today.（今日はもう元気が残ってない）' },

    // R fix: V2 — "gross problem" marked the key; reworded to match the distractors
    // why: wrong words ← the long words heard as a mistake; big favor ← the polite "very important" heard as begging
    { id: 'h3', skill: 'humor', level: 'C1', point: 'fluids', seg: [69, 76.3],
      stem: 'Why is Chris’s request to Ann funny?',
      choices: ['He describes being sick in stiff, formal words', 'He uses long medical words he plainly gets wrong',
                'He begs for a simple drink as a huge favor'], a: 0,
      cue: '頼んでいる中身と、言葉の固さの差。',
      line: 'replenish my body with *electrolytes* after every *involuntary loss of bodily fluids*.',
      said: '「体液を失うたびに、電解質で補給してくれ」と頼む。',
      mean: '吐いたら飲み物を、という話を論文のような言葉で言う。言葉の固さと中身の差が笑いどころ。',
      trap: '難しい語の誤用と取りやすいが、使い方は合っている。固すぎる言い方自体が冗談。',
      use: 'Could you grab me a sports drink?（スポーツドリンク取ってくれる？）' },

    // why: excited ← "oh, boy" as a cheerful exclamation (literal reading, as in "Oh boy, cake!"); medical words ←
    //   the reaction taken as surprise at his vocabulary
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'ohboy', seg: [70.2, 80.6],
      stem: 'How does Ann react to what Chris asks of her?',
      choices: ['With dread about what lies ahead', 'With joy at a chance to look after him',
                'With surprise at his medical words'], a: 0,
      cue: '頼みのあとの、短い二語。',
      line: 'after every involuntary loss of bodily fluids. — *Oh, boy*.',
      said: '体液のたびに補給を、と頼まれて「あーあ」と小さく言う。',
      mean: 'Oh, boy ＝「やれやれ」「参ったな」。これから大変になりそう、という気持ち。',
      trap: 'boy を少年や「わーい」と取りやすい。ため息まじりの Oh, boy は先が思いやられる合図。',
      use: 'Oh, boy. Here we go again.（やれやれ、またか）' },

    // R fix: V2 — "when it's sick" in the stem ruled out "tended to"; cut from the stem. Ear check dropped (both
    //   sources agree)
    // why: tended to ← -ed lost in fast speech; intends to ← a weak "in" imagined before "tends"
    { id: 's1', skill: 'sound', level: 'B2', point: 'tends', seg: [76.8, 80.6],
      stem: 'Fill the gap: “My body ___ lose a lot of fluids…”',
      choices: ['tends to', 'tended to', 'intends to'], a: 0,
      cue: '「My body」のすぐあと。',
      line: 'My body *tends to* lose a lot of fluids when it’s sick.',
      said: '「体調を崩すと、僕の体は水分をたくさん失いがち」と言う。',
      mean: 'tend to ＝ ～しがち。ds と to がつながり「テンズタ」に近い。',
      trap: 'when it’s sick と今の話なので tended は合わない。intends は意図の語。',
      use: 'I tend to oversleep on Sundays.（日曜は寝坊しがち）' },

    // EAR CHECK: a2 (header)
    // R fix: V2 — "faking" was refuted by her own diagnosis; now "gently cheering him up" (the soft "Mhm")
    // why: alarmed ← "I'm dying" taken at face value, so she must be scared too; gently ← the soft "Mhm" heard as
    //   comfort
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'dying', seg: [80.6, 85.9],
      stem: 'When Chris says he’s dying, how does Ann answer?',
      choices: ['Calmly: to her, it’s just a regular flu', 'With alarm: she thinks it may be serious',
                'Gently: she tries hard to cheer him up'], a: 0,
      cue: '「I’m dying」のあとの、短い声と一文。',
      line: 'My brain is on fire. I’m dying. — Mhm. Well, you *definitely have the flu*.',
      said: '「脳が燃えてる、死ぬ」に、「うん。まあ、インフルなのは確かね」と返す。',
      mean: '大げさな訴えに、落ち着いて診断だけ返す。ただのインフル、という温度差。',
      trap: 'definitely（確かに）を深刻さと取りやすい。確かなのは「インフルだ」ということだけ。',
      use: 'You’ll live. It’s just a cold.（大丈夫、ただの風邪だよ）' },

    // R fix: V2 — "as he put it that morning" marked the key; "system" (his own word) now in a distractor
    // why: record ← "compromised" heard as a streak broken; system ← the mask ("flu prevention") heard as the system that failed
    { id: 'i2', skill: 'infer', level: 'B2', point: 'compromised', reveals: ['microchip'], seg: [83.2, 90.3],
      stem: 'When Chris hears the diagnosis, what is “the microchip” he mentions?',
      choices: ['His body, which he called a fine machine', 'His record of never once getting sick',
                'His system for staying well, mask and all'], a: 0,
      cue: '朝の場面で、何を何にたとえていたか。',
      line: 'Oh, my God. *The microchip has been compromised*.',
      said: 'インフルだと言われ、「ああ、マイクロチップがやられた」と嘆く。',
      mean: '朝、自分の体をチップにたとえた話を持ち出している。compromised ＝ 損なわれた。',
      trap: '機械の話と取りやすい。前に出たたとえが、あとで説明なしに戻ってくることは多い。',
      use: 'My Monday brain has been compromised.（月曜の頭はもうダメ）' },

    // R fix: V2 — "so tough" was weak; now "feel sorry for him", a fluent near miss ("breakdown" read as pity)
    // why: sorry ← "complete physical breakdown" heard as pity, "less intimidating" half-caught; scare off ← "nothing like" read literally (= not at all like, so a breakdown would be off-putting); tough ←
    //   "less intimidating" missed and "physical" heard as strength
    // anchor: 109.8–115.6 s "Nothing like… to make a guy seem less intimidating. I love the flu.": the second line
    //   settles the direction
    { id: 'c2', skill: 'infer', level: 'C2', point: 'lovesflu', seg: [109.2, 116],
      stem: 'Which plain-English version keeps what Ann means in her last comment?',
      choices: ['“Seeing him fall apart makes him easier to be with.”', '“Seeing him fall apart makes me feel sorry for him.”',
                '“A breakdown like this would scare anyone off.”'], a: 0,
      cue: '「Nothing like」の形と、最後の一言。',
      line: '*Nothing like* a complete physical breakdown to make a guy seem *less intimidating*. *I love the flu.*',
      said: '「ダウンした姿ほど男の人を怖くなく見せるものはない。インフル最高」と話す。',
      mean: 'Nothing like A to B ＝「B には A が一番」。最後の一言が向きを決める。',
      trap: 'nothing like を「全然似ていない」と取ると逆になる。続く一言で向きを確かめる。',
      use: 'Nothing like coffee to start the day.（一日の始まりはやっぱりコーヒー）' },
  ]
};
