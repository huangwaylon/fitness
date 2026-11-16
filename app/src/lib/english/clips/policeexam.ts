// “Andy's Police Exam | Parks and Recreation” (the official Parks and Recreation channel, Season 5): before his police
// exam Andy shows April his memory tricks for the codes, she cheers him on and gives him a lucky charm, and then his
// earnest answers in the machine test (his own name, a kid and a gun, his father) go badly wrong.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈113 s. Untested: 57 s (the officer's call
// of Andy's surname, “Liar” in both sources), 49.4 s (“his”/“its” feet), the 113–133 s music.
// Same scene and audio as ONebUFQCBrA (“Guardian of the Streets”), which is skipped as a duplicate.
// EAR CHECK: 38.0 s s1 — “I’ll just” said short (≈“all just”); both sources agree on the words
// EAR CHECK: 48.7 s x1 — “side of the road” linked (side‿of‿the); both sources agree on the words
// EAR CHECK: 95.1 s a2 — the officer's flat, dry “Well, that’s what being a cop’s all about” (key: sarcasm)
// REVIEW 2026-11-16: pass 7, fix 13, drop 0, new 0; ear checks 3
// Open: a2 still rests on the officer's dry delivery (the ear check above); if it sounds warm, drop a2.
import type { Clip } from '../types.ts';

export const policeExam: Clip = {
  id: 'policeexam', video: 'd9mRGWX61e0', title: 'Andy\'s Police Exam', dur: 133, wpm: 148, band: 'slow',
  tags: ['職場', '恋愛'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 50 %, right): "Andy quizzing April" was refuted by "quiz me" alone. Two readings of April's
    //   own words replace both distractors: the divorce line as a warning, her deadpan "Great" as finding him silly.
    //   C5: `reveals: ['plan']` is gone. Nothing here gives away nt1's "cheats with", and it left play 3 without a C2.
    // why: warning ← "if you don't… divorce you" stopped early sounds like a threat about failing; silly ← April's
    //   flat "Great" after each trick heard as mockery
    { id: 'g1', skill: 'gist', level: 'B1', point: 'prep', seg: [0, 56.4],
      stem: 'What is the talk between Andy and April before the test mostly about?',
      choices: ['April quizzing Andy, then cheering him on to pass', 'April quizzing Andy, then warning him not to fail',
                'Andy showing his tricks, and April finding them silly'], a: 0,
      cue: '誰が問題を出すか、最後にどんな言葉をかけるか。',
      said: 'アンディが暗記法を披露し、エイプリルが出題する。最後に「絶対受かる」と励まし、お守りを渡す。',
      mean: '試験前の練習と励ましの場面。答えには Great と返している。',
      trap: '離婚の話は脅しに、平坦な Great は呆れに聞こえやすい。最後の言葉で判断する。',
      use: 'You’ve got this. I believe in you.（大丈夫、信じてる）' },

    // R fix: V2 (blind 50 %, right): the key was the only confident choice. "Fine, if he stays calm" is a second
    //   upbeat one, built on the hedge "I feel like".
    // why: badly ← "nail" and "fail" share the vowel; if he stays calm ← "I feel like" heard as a hedge, and later he
    //   says he's nervous
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'nail', seg: [3.8, 9.5],
      stem: 'How does Andy expect the second part of the exam to go?',
      choices: ['Perfectly, with no trouble at all', 'Badly, the way tests usually go for him',
                'Fine, as long as he can stay calm'], a: 0,
      cue: 'evaluation のあと、feel like I’m の次の動詞。',
      line: 'which I feel like I’m *gonna nail*',
      said: '「性格評価は楽勝。『でも性格はいい』ってよく言われるから」と話す。',
      mean: 'nail ＝「ばっちり決める」。nail the interview のように使う。',
      trap: 'nail と fail は母音が同じ。because のあとの理由が自信を示している。',
      use: 'You totally nailed that presentation.（プレゼン、完璧だったね）' },

    // R fix: V2 (blind 70 %, right): "consolation" made the key the only nuanced choice, and the exam distractor was
    //   weak. A near miss replaces it: right target (Andy), wrong direction (he knows and plays along).
    // why: the people ← the quote sounds like others teasing him; Andy plays along ← the sincerity flip: a backhanded
    //   line repeated as self-mockery
    // anchor: 7.0 s the quote opens with "But", the frame for a consolation after weak points, and Andy offers it as
    //   proof he'll "nail" the evaluation, which rules out self-mockery
    { id: 'nt2', skill: 'humor', level: 'C2', point: 'personality', reveals: ['nail'], seg: [3.8, 9.5],
      stem: 'When Andy quotes what people always say about him, who is the joke on?',
      choices: ['Andy, who takes a backhanded line as real praise', 'Andy, who sees it is backhanded and plays along',
                'The people, for teasing him to his face'], a: 0,
      cue: '引用の最初の一語と、それを何の根拠にするか。',
      line: 'people always say, “*But* he’s got a great personality.”',
      said: '「みんな『でも性格はいいから』って言うし、性格評価は楽勝」と自信満々。',
      mean: '文頭の But は「ほかはダメだけど」の前置きで、慰めの決まり文句。本人は褒め言葉と取り、合格の根拠にしている。',
      trap: '自虐の冗談に聞こえやすいが、合格の根拠にしているので本気。But で始まる引用は欠点を省いている。',
      use: 'Well, at least he’s nice.（まあ、少なくともいい人だよね）' },

    // why: 35-24 ← the second pair heard in the wrong order; 53-42 ← the first pair flipped (fifty-three/thirty-five)
    { id: 'n1', skill: 'number', level: 'B1', point: 'code', seg: [12.0, 22.7],
      stem: 'Which code does April ask about first?',
      choices: ['35-24', '35-42', '53-42'], a: 1, keep: true,
      cue: 'calls in a のあと、2つに分けて読む数字。',
      line: 'when an officer calls in a *35-42*?',
      said: '「無線で35-42と言ったら？」と出題し、アンディが答える。',
      mean: '番号は2桁ずつ、thirty-five forty-two と区切って読むのが普通。',
      trap: '2桁の組の順番が入れかわりやすい。暗記法でもう一度言う35と42で確かめる。',
      use: 'My room number is fourteen twenty.（部屋番号は1420です）' },

    // why: a sound-alike again ← the first trick works by sound (assault ≈ a salt), so a second one is expected; wrong
    //   number ← the two codes run together, but he says 533 both times
    { id: 'h1', skill: 'humor', level: 'C1', point: 'trick', reveals: ['arson', 'code'], seg: [17.0, 31.1],
      stem: 'Why is Andy’s memory trick for arson funny?',
      choices: ['He reuses the picture he made for assault', 'He finds a sound-alike for arson, as before',
                'He gets the number wrong the second time'], a: 0,
      cue: '2つの暗記法で、思い浮かべる物を比べる。',
      line: 'I picture 533 *salt shakers and batteries* lighting a building on fire.',
      said: '暴行・傷害は「塩入れ35個と電池42個」。放火も「塩入れ533個と電池」。',
      mean: 'assault が a salt に聞こえて塩入れ。放火にも同じ物を使うので意味がない。',
      trap: '1つ目は音が鍵なので、2つ目も音を探しやすい。実際は同じ物に火を足しただけ。',
      use: 'That’s how I remember it.（そうやって覚えてるの）' },

    // why: 353 ← the digits heard out of order; 523 ← "thirty" missed as "twenty"; 535 ← thirty-three and thirty-five
    //   end alike
    { id: 'n2', skill: 'number', level: 'B1', point: 'arson', seg: [21.7, 31.1],
      stem: 'What number does Andy give for arson?',
      choices: ['353', '523', '533', '535'], a: 2, keep: true,
      cue: 'arson のあと、すぐ答える数字。',
      line: 'Arson is *533*.',
      said: '「放火は533」と即答し、暗記法を続ける。',
      mean: 'five thirty-three と読む。3桁は「1桁＋2桁」で読むことが多い。',
      trap: 'thirty-three と thirty-five は語尾が弱く似て聞こえる。暗記法の2回目で確かめる。',
      use: 'We’re in room five thirty-three.（533号室です）' },

    // why: I'd ← the dark l of I'll heard as a d; I just ← the l swallowed, leaving a plain present
    { id: 's1', skill: 'sound', level: 'B2', point: 'divorce', seg: [32.6, 42.4],
      stem: 'Fill the gap: “And if you don’t, ___ divorce you…”',
      choices: ['I’ll just', 'I’d just', 'I just'], a: 0,
      cue: 'don’t のあと、文頭の短い一音。',
      line: 'And if you don’t, *I’ll just* divorce you…',
      said: '「落ちたら離婚して、ほかの人と結婚する」。I’ll は短い。',
      mean: 'if you don’t は現実の条件なので I’ll。I’d なら「仮に」の話。',
      trap: 'I’ll の l は暗く短く、I’d や I に聞こえやすい。if 節が現在形なら will。',
      use: 'If it rains, I’ll just take a cab.（雨ならタクシーにする）' },

    // R fix: V2 (blind 50 %, right): the key was the only two-sided, upbeat choice. The choices now turn on the weak
    //   words of "cheat on them with you": who is cheated on and who is cheated with.
    // why: cheats on ← "on" and "with" are weak and the pronouns swap (on you with them); leaves ← the plan stopped at
    //   "divorce you and marry someone else"
    // anchor: 40.9–41.5 s "cheat on them with you" puts Andy back as her partner, and at 42.8 s he calls it sweet
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'plan', reveals: ['divorce'], seg: [32.6, 44.5],
      stem: 'If Andy fails, what part does April’s plan leave for him?',
      choices: ['The man she cheats with', 'The man she cheats on', 'The man she leaves behind'], a: 0,
      cue: '計画の最後の一言と、アンディの反応。',
      line: 'I’ll just divorce you and marry someone else and then *cheat on them with you*.',
      said: '「落ちたら離婚して別の人と結婚し、その人を裏切ってあなたと付き合う」。彼は喜ぶ。',
      mean: 'cheat on A with B ＝ A を裏切って B と。結局アンディと一緒にいる話。',
      trap: 'on と with は弱く、them と you の役が入れかわりやすい。最後の一言と反応まで聞く。',
      use: 'You’re stuck with me either way.（どっちにしても離れないよ）' },

    // R fix: V2 (blind 60 %, right): "Unsure whether she means it as a joke" was weak. The three are now three ways
    //   to take the gift: loves it, creeped out but thankful, plays along with a joke.
    // why: creeped out ← the Japanese frame: thanks after "creepy" heard as 建前; plays along ← April's flat delivery
    //   makes the gift sound like a joke
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'creepy', seg: [42.7, 56.4],
      stem: 'How does Andy really feel about April’s gift?',
      choices: ['He truly likes it, creepy as it is', 'He’s creeped out but thanks her anyway',
                'He takes it as a joke and plays along'], a: 0,
      cue: '呼びかけと、そのあとの短い2文。',
      line: 'Baby, you are *so creepy*. Thank you. *I love it*.',
      said: '「ベイビー、君ほんと不気味。ありがとう、気に入った」。',
      mean: 'creepy は悪口でなく、相手らしさを面白がる言い方。Baby と I love it が本心の印。',
      trap: '「気持ち悪い」のあとのお礼は建前に聞こえやすい。呼びかけと最後の一言を合わせて聞く。',
      use: 'That’s so weird. I love it.（変なの。でも好き）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'road', seg: [47.1, 51.15],
      stem: 'Type where she found it: “I found a dead rabbit on the ___.” (4 words)', answer: 'side of the road',
      cue: 'rabbit のあと、つながって速くなる部分。',
      line: 'I found a dead rabbit on the *side of the road*',
      said: '「道ばたで死んだウサギを見つけ、お守りにした」。',
      mean: 'side of the road ＝ 道ばた。side‿of‿the が「サイダザ」に近い。',
      trap: 'of と the が弱く、side road に聞こえやすい。名詞＋of the＋名詞を予想する。',
      use: 'He parked on the side of the road.（彼は路肩に車を止めた）' },

    // R fix: V2 (blind 65 %, right): "when he calls his name" set up a turn-taking reading, and "stand up" could be
    //   true on screen. The stem now names the line only; the distractors are "up next" and "up" as awake. S4: the
    //   segment was 2.8 s; it now ends at 59.0 s.
    // why: after one more ← "you're up next", the usual waiting-room form; wake up ← "up" as awake and alert
    { id: 'p2', skill: 'phrase', level: 'B2', point: 'up', seg: [56.0, 59.0],
      stem: 'What does the officer’s first line tell Andy?',
      choices: ['His turn has come, right now', 'His turn is coming, after one more',
                'He should wake up and pay attention'], a: 0,
      cue: '名前のすぐあと、2語の短い呼び出し。',
      line: '…, *you’re up*.',
      said: '係官が名前を呼んで、「次は君の番だ」と知らせる。',
      mean: 'you’re up ＝ 今があなたの番。up next なら「その次」。',
      trap: 'up から起きる・立つを思い浮かべやすい。順番を呼ぶ場面の up は「出番」と覚えておく。',
      use: 'Okay, you’re up next.（はい、次どうぞ）' },

    // why: right person ← asking a name sounds like an ID check; relaxed ← an easy first question often eases nerves
    { id: 'd1', skill: 'detail', level: 'B1', point: 'check', seg: [58.7, 67.2],
      stem: 'Why does the officer first ask if Andy’s name is Andy?',
      choices: ['To make sure that the machine is working', 'To check he’s the right person for the test',
                'To help him feel relaxed before it starts'], a: 0,
      cue: 'Just to のあと、何を確かめたいか。',
      line: 'Just to *make sure the machine is working*, is your name Andy?',
      said: '「機械の確認のために聞くけど、名前はアンディ？」と最初に質問する。',
      mean: '答えが分かっている質問で、機械が正しく動くか確かめている。本人確認ではない。',
      trap: '名前を聞かれると本人確認だと思いやすい。Just to 〜 は質問の目的を先に言う形。',
      use: 'Just to be sure, is this seat free?（念のため、この席空いてますか）' },

    // R fix: V2 (blind 65 %, right): the key was the only two-part, nuanced choice, and "at all" was an absolute only
    //   in a distractor. The three are now parallel: a manner, then what follows from it.
    // why: nervous ← Andy's "I'm nervous" before the test; joking ← the odd answers sound like he's mocking the test
    { id: 'g2', skill: 'gist', level: 'B2', point: 'test', reveals: ['gun', 'dad', 'name'], seg: [58.7, 113.6],
      stem: 'Overall, what do Andy’s answers in the machine test show?',
      choices: ['He’s sincere, but his judgment is way off', 'He’s nervous, so his answers come out wrong',
                'He’s joking, to show the test is silly'], a: 0,
      cue: '質問ごとの答えと、係官の反応。',
      said: '名前の質問で迷い、子どもに銃を渡したと答え、父親の違反では家族の話を始める。',
      mean: 'どの答えも本人は真剣で善意だが、警官としての判断はずれている。それが場面の笑い。',
      trap: '緊張やふざけに聞こえやすいが、本人は大まじめ。落ち着いて理由を言う口ぶりに注目。',
      use: 'He means well, but…（悪気はないんだけど…）' },

    // R fix: V2 (blind 65 %, right): the key was the longest choice and the only one about Andy's own doubt. Three
    //   choices of one shape and length now. S4: the segment ran 17.9 s, into the gun scenario; it now ends at 75.7 s,
    //   after "I think", before "So, no?".
    // why: corrects the officer ← "my full name is Andrew" heard as a correction; a false name ← the usual
    //   lie-detector script of testing the machine, with "Andrew" heard as the made-up name
    { id: 'h2', skill: 'humor', level: 'C1', point: 'name', seg: [65.1, 75.7],
      stem: 'What makes Andy’s answer to the name question funny?',
      choices: ['He treats a warm-up question as a real puzzle', 'He corrects the officer on what to call him',
                'He gives a false name to see if the machine notices'], a: 0,
      cue: '最初の返事と、最後に付けた2語。',
      line: 'I *don’t know how to answer that*. … my full name is Andrew, *I think*.',
      said: '「どう答えればいいか」と悩み、「正式にはアンドリュー、だと思う」。',
      mean: '機械確認用の簡単な質問で迷い、自分の名前に I think を付ける。そのずれが笑い。',
      trap: 'Andrew は名前の訂正に聞こえやすい。最後の I think が自信のなさの合図。',
      use: 'I don’t know how to answer that.（なんて答えたらいいか…）' },

    // R fix: V2 + S2 (blind 65 %, right): the stem quoted "Simple yes or no", which pointed straight at "won't be
    //   simple". The stem now names the turn, and the cue no longer says "length".
    // why: a yes ← the Japanese frame: 「ええ」 at the start of a reply as agreement; irritated ← "Well" can open an
    //   irritated reply, and he was just pushed to say yes or no
    { id: 'm1', skill: 'marker', level: 'B2', point: 'well', reveals: ['name'], seg: [69.8, 75.6],
      stem: 'When Andy starts his second reply, what does his first word signal?',
      choices: ['More than a yes or no is coming', 'He’s going along: a yes is coming',
                'He’s irritated at being rushed'], a: 0,
      cue: '返事の最初の一語と、そのあとの流れ。',
      line: '*Well*, everyone calls me Andy, but my full name is Andrew, I think.',
      said: '「えっと、みんなアンディと呼ぶけど、正式にはアンドリュー、だと思う」。',
      mean: '文頭の Well は「単純には答えられない」予告。このあと説明が続く。',
      trap: '日本語の「ええ」に似て同意に聞こえやすい。Well のあとは、期待とずれる答えが来やすい。',
      use: 'Well, it’s a little complicated.（えっと、ちょっと複雑で）' },

    // R fix: V2 + K2 (blind 55 %, right): the machine distractor can't be refuted by ear (a needle may be on screen).
    //   A near sound replaces it: "everyone calls me Andy" heard as "no one".
    // why: dodging ← a long answer to a yes/no question sounds like dodging it; no one calls him Andy ← everyone/no
    //   one, the stressed half of the word kept
    { id: 'i1', skill: 'infer', level: 'B2', point: 'sono', reveals: ['name'], seg: [71.2, 79.3],
      stem: 'Why does the officer answer Andy’s explanation with “So, no?”',
      choices: ['He hears that Andy’s full name is Andrew', 'He hears Andy dodging the question',
                'He hears that no one calls him Andy'], a: 0,
      cue: 'but のあと、正式な名前の部分。',
      line: 'my full name is *Andrew*, I think. — So, no?',
      said: '「でも正式にはアンドリュー」と聞いて、係官は「じゃあ、いいえ？」と確かめる。',
      mean: '「本当はアンドリュー」と答えたので、答えは「いいえ」だと受け取った。',
      trap: '長い答えははぐらかしに、everyone は no one に聞こえやすい。So は結論の合図。',
      use: 'So, that’s a no, then?（じゃあ、ダメってこと？）' },

    // why: asking again ← after a changed answer, a check is the usual next step; machine trouble ← the opening
    //   "make sure the machine is working"
    { id: 'r1', skill: 'pragma', level: 'B2', point: 'moveon', reveals: ['sono'], seg: [75.5, 83.0],
      stem: 'After Andy changes his answer, what is the officer doing with his next line?',
      choices: ['Dropping the question and going to the next', 'Asking Andy to give his answer once more',
                'Telling Andy the machine has a problem'], a: 0,
      cue: 'Yes のあと、係官の短い一言。',
      line: 'Wait. Yes. — *Let’s move on*.',
      said: '「待って、はい」と言い直すと、係官が「次に行こう」と言う。',
      mean: 'Let’s move on ＝ この話はここまで、次へ。答えを確かめないまま切り上げている。',
      trap: '言い直しのあとは確認が来ると思いやすい。move on は先へ進む合図で、会議でも使う。',
      use: 'Okay, let’s move on to the next item.（では、次の議題へ）' },

    // R fix: V2 (blind 50 %, right): "teach the boy safety" was a filler. A keyword trap (kid, hold, cop's gun all
    //   said, in the wrong relation) replaces it, and the "asked nicely" reading becomes Andy's soft heart.
    // why: a cop let him ← "when I was a kid… hold a cop's gun" heard as something that happened; can't say no ← the
    //   scenario's "asks to hold" plus Andy's kindness
    { id: 'd2', skill: 'detail', level: 'B2', point: 'gun', seg: [83.0, 94.8],
      stem: 'Why does Andy say he handed the student his gun?',
      choices: ['He’d dreamed of holding one as a kid', 'A cop let him hold one when he was a kid',
                'The boy asked, and he hates saying no'], a: 0,
      cue: 'When I was a kid のあと。',
      line: 'When I was a kid, I *always wanted to hold a cop’s gun*',
      said: '「はい、渡しました。子どものころ警官の銃を持ちたかったから」。',
      mean: '子どものころの夢を別の子にかなえたという理由。警官としてはありえない。',
      trap: 'kid と cop’s gun から、持たせてもらった話に聞こえる。wanted は願いのまま。',
      use: 'As a kid, I always wanted one.（子どものころずっと欲しかった）' },

    // R fix: V2 (blind 50 %, right): "Mocking… by pretending to praise" was the only ironic choice. Now two ironic
    //   readings with different targets (right mechanism, wrong target) and one sincere.
    // why: the scenario ← the officer reads a silly-sounding scenario, so the irony could be at the test; sincere ←
    //   the words alone are praise, and Andy's reason sounds kind
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'allabout', seg: [87.4, 97.2],
      stem: 'How does the officer mean his reply to the gun answer?',
      choices: ['Ironic, aimed at Andy’s answer', 'Ironic, aimed at the test’s scenario',
                'Sincere, moved by Andy’s reason'], a: 0,
      cue: '銃を子どもに渡した、という答えのすぐあと。',
      line: '*Well, that’s what being a cop’s all about*.',
      said: '子どもに銃を渡したという答えに、係官は「それこそ警官の仕事だね」と返す。',
      mean: '明らかにダメな答えを大げさに褒めるのは皮肉。that は Andy の答えを指す。',
      trap: '言葉だけなら褒め言葉に聞こえる。答えの中身と褒め方が合わないときは、皮肉を疑う。',
      use: 'Great, that’s exactly what we needed.（最高、まさに必要だったやつね）' },

    // R fix: S4: the segment ran 16.2 s; it now ends at 110.9 s, after "What the hell?" and before the mitt line
    //   (said trimmed to match).
    // why: sick ← "alive" read literally as surviving an illness; speeding ← the scenario's "speeding" heard as a
    //   habit of his dad's
    { id: 'i2', skill: 'infer', level: 'C1', point: 'dad', seg: [97.4, 110.9],
      stem: 'What does Andy’s first reaction to his father suggest?',
      choices: ['He hasn’t heard from his dad in years', 'His dad has been very sick in hospital',
                'His dad is often stopped for speeding'], a: 0,
      cue: 'Dad? のあと、驚きの短い一言。',
      line: 'Dad? *You’re alive?* What the hell?',
      said: '父親を止めたら、と聞かれ「まず『父さん？生きてたの？何なの？』ってなる」。',
      mean: '生きていたのかと驚くのは、長く連絡がなかったから。警官の対応でなく再会の話。',
      trap: 'alive から病気を想像しやすいが、病気の話は出ない。驚きは会っていない期間を表す。',
      use: 'Wow, you’re alive! It’s been ages.（生きてたんだ！久しぶり）' },
  ]
};
