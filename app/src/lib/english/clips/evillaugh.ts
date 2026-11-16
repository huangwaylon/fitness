// “Dwight's Evil Laugh - The Office US” (the official The Office channel, Best of Season 7): Dwight turns Jim's
// daycare troubles into a business idea and tours Jim and Pam round his “daycare”; then a talking head on his bosses,
// his list for Michael, and his advice on a baby who won't sleep.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 190 s; whisper's lines after that are
// a loop.
// Untested: the evil laugh itself (20.6–27 s, no words), "Were you painting in the dark?" (on screen), "plant in
// success" at 89.5 s (both sources, unclear), "If this works out…" at 101–104 s (speaker unclear), and "Maybe I should
// go" at 133 s. Spelling differs and nothing turns on it: CC ("ccf"), David/Davey, Jan/Jane.
// Line words that differ but carry no key: 49.1 s p1 captions "I don't know", whisper "Oh, no, no" (before "I like
// to think of it as…"); 67 s d2 captions "forks and eyes", whisper "forks and knives" ("Lieutenant Knife" in both);
// 110 s a2 captions "than Gabe I tried", whisper "than Gabe have tried".
// EAR CHECK: 9.8 s i1 — "Why didn't I think of this before?" is Dwight's (whisper's dash marks a turn just before it;
//   assumed Dwight, since the daycare pitch follows in the same breath)
// EAR CHECK: 100.6–106.2 s g2 — Dwight is the one left inside ("Oh, no, no" and "I promise you, that door locks"
//   assumed his, after Jim's "We're gonna head outside")
// REVIEW 2026-11-16: pass 7, fix 15, drop 0, new 0; ear checks 2
import type { Clip } from '../types.ts';

export const evilLaugh: Clip = {
  id: 'evillaugh', video: '8-6GQY0wZm0', title: 'Dwight\'s Evil Laugh', dur: 211, wpm: 175,
  band: 'fast', tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 — the key was the only daycare choice in a daycare clip (blind 55 %); "sick" is now a second
    //   daycare reason
    // why: moved ← "the other side of town" heard about their home; opens late ← "daycare" caught, the reason after
    //   it lost (keyword trap)
    { id: 'd1', skill: 'detail', level: 'B1', point: 'late', seg: [2.5, 9.6],
      stem: 'Why has Jim been late every day this week?',
      choices: ['The baby’s daycare is across town', 'They moved to the other side of town',
                'The baby’s daycare opens too late'], a: 0,
      cue: '遅刻の理由を言う、2文目。',
      line: 'we signed… up for this daycare. *It’s on the other side of town.*',
      said: '「保育園を決めたけど、町の反対側なんだ」と話す。',
      mean: 'other side of town ＝ 町の反対側。毎朝の送りで遠回りになるのが遅刻の原因。',
      trap: 'other side of town を「引っ越した」と取りやすい。主語の It は保育園。',
      // R fix: N5 — use was 9 words
      use: 'My office is across town.（会社は町の反対側なんだ）' },

    // R fix: V2 — "Did you know that…" won on collocation alone (blind 55 %); "Don't you know" added as a fourth
    //   sound-alike
    // why: Do you know ← the d of "did" and the y of "you" merge, and present tense is the default guess; Didn't you
    //   know / Don't you know ← a surprised tone suggests a negative question, and the n't is barely heard
    { id: 's1', skill: 'sound', level: 'B2', point: 'didja', seg: [9.3, 15.5],
      stem: 'Fill the gap: “___ that there is a daycare center…”',
      choices: ['Did you know', 'Do you know', 'Didn’t you know', 'Don’t you know'], a: 0,
      cue: 'ひとりごとのあと、問いの最初。',
      line: '*Did you know* that there is a daycare center opening right here…',
      said: '「この建物に保育園ができるって知ってた？」と持ちかける。',
      mean: 'Did you know が「ディジュノウ」とつながる。d と y が合わさり「ジュ」になる。',
      trap: '「ジュ」が聞こえたら did you を疑う。n’t の「ン」も聞こえない。',
      use: 'Did you know they’re closing early?（早く閉まるって知ってた？）' },

    // why: old owner ← "opening" sounds like something already under way; heard from Pam ← "Is there really?" heard
    //   as a polite "yes, I know"
    { id: 'i1', skill: 'infer', level: 'C1', point: 'idea', seg: [9.3, 21.0],
      stem: 'What does Dwight’s talk of a daycare “right here” suggest?',
      choices: ['He has just come up with it on the spot', 'The building’s old owner had already planned it',
                'Jim has already heard about it from Pam'], a: 0,
      cue: '問いかけの直前の、ひとりごと。',
      line: '*Why didn’t I think of this before?* … *Now that I own the building*, I’m looking for new sources of revenue.',
      said: '「なぜ思いつかなかった」と言い、「建物の持ち主として収入源を探している」と続ける。',
      mean: '保育園は、ジムの話を聞いたその場の思いつき。自分が作るつもり。',
      trap: 'opening から、決まった話と取りやすい。直前の独り言が、今のひらめきを示す。',
      use: 'Why didn’t I think of that?（なんで思いつかなかったんだろう）' },

    // R fix: V2/K6 — the key was the only "not X" contrast (blind 60 %); it now says what the laugh is, in the
    //   distractors' form
    // why: evil plan ← the laugh (20.6–27 s), a classic villain sound, taken at face value; laughing at Jim ← "And a
    //   daycare center?" right before, heard as a trick Jim fell for
    // anchor: 27.1–32.3 s "it's not an evil idea. It's just a regular idea. But there's no good laugh for a regular
    //   idea": the idea is named as ordinary, and the laugh as the only one he had
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'laugh', seg: [19.3, 33.2],
      stem: 'After his comment to the camera, how should we hear Dwight’s laugh?',
      choices: ['As the only laugh he had, for a plain idea', 'As proof he has an evil plan for the kids',
                'As a laugh at Jim for falling for his trick'], a: 0,
      cue: '笑い声と、そのあとカメラに言う理由。',
      line: 'it’s *not an evil idea*. It’s *just a regular idea*. But there’s *no good laugh for a regular idea*.',
      said: '笑ったあとカメラに「悪い考えじゃない。普通の考えだ。でも普通の考えに合う笑いがない」と言う。',
      mean: 'カメラへの一言が場面を書きかえる。悪だくみの笑いは、ほかに合う笑い方がなかっただけ。',
      trap: '悪役の笑い声を、そのまま悪だくみと取りやすい。カメラへの本音が答え合わせになる。',
      use: 'It’s not a big plan. Just a plan.（大した計画じゃない。ただの計画だよ）' },

    // R fix: V2 — the key was the only lock choice (blind 60 %); "Pam stops the tour" is now the lock test with the
    //   roles reversed
    // why: sign up ← "If this works out, I think we're looking real good" heard as the parents' verdict; Dwight locks
    //   them in ← "the door locks from the outside" + "prove it" with the roles reversed
    { id: 'g2', skill: 'gist', level: 'B2', point: 'locked', reveals: ['whirl'], seg: [33.5, 106.8],
      stem: 'How does the daycare tour end?',
      choices: ['Jim and Pam test the lock with Dwight inside', 'Jim and Pam sign their baby up on the spot',
                'Dwight locks Jim and Pam in to prove it'], a: 0,
      cue: '「Prove it」のあと、外に出る話と最後の一言。',
      line: 'We’re gonna *head outside*… I just wanna see how it works. … *I promise you, that door locks.*',
      said: '「ドアは外から鍵がかかる」と言うドワイトに、ジムが「試そう」と外に出る。',
      mean: '自慢の「脱出不可能」を、ドワイト自身が中に残って証明する形で終わる。',
      trap: '外に出るのが誰かを取り違えやすい。head outside と言うのは試したい側。',
      use: 'Let’s test it and see.（試してみよう）' },

    // R fix: V2/K6 — the key was the only nuanced choice (blind 65 %); two choices now dodge, and the third denies
    // why: Mose ← the "no" (whisper) or "I don't know" (captions) heard as hinting at someone else, with the cousin
    //   just introduced; kids run it ← "the kids' place" taken literally
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'kidsplace', seg: [47.0, 52.5],
      stem: 'When asked if the daycare is his, what does Dwight do?',
      choices: ['Dodges it with a sweet line about the kids', 'Dodges it by hinting that Mose runs it',
                'Denies it and says the kids will run it'], a: 0,
      cue: '「your place」への返事の後半。',
      line: 'I like to think of it as *the kids’ place*.',
      said: '「ここはあなたの？」と聞かれ、「子どもたちの場所だと思いたい」と答える。',
      mean: '自分の店かどうかには答えず、聞こえのいい言葉でかわしている。',
      trap: 'Mose の名は出ない。think of it as は、言いかえで逃げる型。',
      // R fix: N5 — use was 9 words
      use: 'I like to call it a challenge.（試練だと思うようにしてる）' },

    // why: mail room / back room ← near sounds: the short vowel and consonant before "room" are easy to lose
    { id: 'd2', skill: 'detail', level: 'B1', point: 'toybox', seg: [63.6, 68.0],
      stem: 'Where does Jim say the “toys” came from?',
      choices: ['From the office break room', 'From the office mail room', 'From the office back room'], a: 0,
      cue: '「actually」のあと、room の前の語。',
      line: 'These are actually forks and knives *from the break room*.',
      said: 'ジムが「これ、実は休憩室のフォークとナイフだよ」と言う。',
      mean: 'break room ＝ 職場の休憩室。おもちゃ箱の中身は会社の食器。',
      trap: 'break / mail / back は短く弱い語で聞き分けにくい。room の前の母音と子音を聞く。',
      use: 'There’s coffee in the break room.（休憩室にコーヒーがあるよ）' },

    // R fix: V2 — "hungry" was a filler (blind 60 %); it's now a safety warning, the natural worry about knives in a
    //   toy box
    // why: unsafe ← forks and knives in a kids' box, so "And a…" heard as adding a danger; fixes the name ← "And a…"
    //   heard as correcting "Miss Fork"
    { id: 'h2', skill: 'humor', level: 'C1', point: 'soy', seg: [68.0, 77.5],
      stem: 'Why does the mention of the soy sauce packet get a laugh?',
      choices: ['It adds a bit of trash to Dwight’s cast of toys', 'It warns that the box isn’t safe for children',
                'It fixes Dwight’s wrong name for one toy'], a: 0,
      cue: '名前つきのおもちゃの列と、And で始まる一言。',
      line: 'that’s Mr. Fork and Lieutenant Knife and Miss Fork. — *And a soy sauce packet.*',
      said: 'フォークやナイフに名前を付ける話に、「それとしょうゆの小袋」と続ける。',
      mean: 'ドワイトの名前つきの「おもちゃ」の列に、ただのゴミを並べて、からかっている。',
      trap: '刃物の話から「危ない」と取りやすい。And で始まる一言は、相手の列に乗る合図。',
      use: 'And a half-eaten sandwich.（あと、食べかけのサンドイッチもね）' },

    // R fix: V2 — "unsafe but won't say so" was weak (blind 60 %); it's now an open apology for sharp knives
    // why: break room ← scope shift: the embarrassment heard as about the whole box (Jim's "from the break room",
    //   67.5 s); too sharp ← "I'm embarrassed" heard as about the knives, the obvious worry for small kids
    // anchor: 75.7–81.8 s "That shouldn't have been in there. I'm embarrassed": "that" is the soy sauce packet just
    //   named, while the knives were named with pride a moment before ("to a child's imagination, that's… Lieutenant
    //   Knife")
    { id: 'nt2', skill: 'attitude', level: 'C2', point: 'soy', seg: [68.0, 82.2],
      stem: 'What does Dwight’s embarrassment tell us about the forks and knives?',
      choices: ['He has no problem with them as toys', 'He is ashamed they came from the break room',
                'He is sorry they’re too sharp for kids'], a: 0,
      cue: 'that が指すものと、ナイフの呼び方。',
      line: 'that’s Mr. Fork and *Lieutenant Knife*… — And a soy sauce packet. — *That shouldn’t have been in there.*',
      said: 'ナイフには「ナイフ隊長」と名前を付けたのに、小袋には「入っていちゃいけない。恥ずかしい」と言う。',
      mean: 'that は直前の小袋だけを指す。恥じるのはゴミの混入で、ナイフのおもちゃは気にしていない。',
      trap: '恥ずかしいを箱全体に広げて取りやすい。that が何を指すかは、直前に出た名詞で決まる。',
      use: 'That one’s on me. The rest is fine.（それは私のミス。ほかは大丈夫）' },

    // why: hurt himself ← "beat" taken literally; give up ← "don't… up" heard as "don't give up"
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'beat', seg: [80.0, 83.6],
      stem: 'When Dwight says he’s embarrassed, what does the reply tell him?',
      choices: ['Not to be so hard on himself', 'Not to hurt himself by accident', 'Not to give up on the daycare'],
      a: 0,
      cue: '「embarrassed」へのすぐの返事。',
      line: 'I’m embarrassed. — *Don’t beat yourself up.*',
      said: '「恥ずかしい」と言うドワイトに、「そう自分を責めるなよ」と返す。',
      mean: 'beat yourself up ＝ 自分を責める。失敗を気にする相手への決まった声かけ。',
      trap: 'beat を「たたく」と文字どおり取りやすい。up が付くと心の中の話。',
      use: 'Don’t beat yourself up. It happens.（自分を責めないで。よくあることだよ）' },

    // why: Mose ← the cousin introduced earlier, still in the ear; Dwight ← the owner is the usual answer
    { id: 'd4', skill: 'detail', level: 'B1', point: 'noone', seg: [90.2, 94.2],
      stem: 'Who will be watching the children, according to Dwight?',
      choices: ['Nobody at all', 'His cousin Mose', 'Dwight himself'], a: 0,
      cue: '質問のすぐあとの、短い答え。',
      line: 'Who will be watching the children? — *No one.* The door locks from the outside.',
      said: '「誰が子どもを見るの？」に「誰も。ドアは外から鍵がかかる。脱出は不可能」と答える。',
      mean: 'no one ＝ 誰も〜ない。見守りの人がいないことを、安全の売りのように話している。',
      trap: '紹介されたいとこが頭に残りやすい。答えは質問のすぐあとの2語。',
      use: 'Who’s picking up the kids today?（今日は誰が子どもを迎えに行く？）' },

    // R fix: V2 — "leave" was weak (blind 55 %); it's now a literal reading of "see how it works"
    // why: a spin ← "whirl" taken as turning around (a quick spin outside); look from outside ← "head outside" + "see
    //   how it works" taken as seeing the building
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'whirl', seg: [94.1, 100.4],
      stem: 'When Jim says they’ll head outside, what does he want to do?',
      choices: ['Try the door lock out for real', 'Take a quick spin around outside',
                'See how the place looks from outside'], a: 0,
      cue: '「head outside」のあと、whirl を使った言い方。',
      line: '…*give it a whirl*. I just wanna see how it works.',
      said: '「外に出るよ。試してみよう。どう動くか見たいだけ」と言う。',
      mean: 'give it a whirl ＝ ちょっと試してみる。「脱出不可能」を確かめる気。',
      trap: 'whirl（回転）から「ひと回り」を想像しやすい。give it a ～ は「試す」の型。',
      use: 'Never tried sushi? Give it a whirl!（お寿司食べたことない？試してみて！）' },

    // R fix: V2 — "threat" was the stock reading (blind 65 %); it's now a keyword trap on "who I liked"
    // why: better man ← "better men than Gabe" heard as praise of Gabe; liked ← "who I liked" heard as about Gabe
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'gabe', seg: [108.9, 119.8],
      stem: 'In his comment to the camera, how does Dwight see Gabe?',
      choices: ['As one more boss who won’t last', 'As a better man than his old bosses',
                'As a boss he likes, as he liked Ed'], a: 0,
      cue: '最初の一文、Gabe の前の比べる言葉。',
      line: '*Better men than Gabe* have tried to be my boss.',
      said: '「ゲイブより上の男たちが私の上司になろうとした」と言い、上司を並べる。',
      mean: 'Xより上の人も失敗した、という言い方。ゲイブもどうせ続かない、という自信。',
      trap: 'better men を「ゲイブは上」と取りやすい。who I liked は Ed の話。',

      use: 'Better cooks than me have failed at this.（私よりうまい人でも失敗してる）' },

    // R fix: V2 — "gruesome" made the key the only vivid choice (blind 65 %); it's now plainer and the same length
    // why: took credit ← "got fired" heard as his doing; mixed up ← a quick list of names and fates sounds jumbled
    { id: 'h4', skill: 'humor', level: 'C1', point: 'fates', seg: [112.8, 120.0],
      stem: 'What makes Dwight’s list of former bosses funny?',
      choices: ['Each fate is worse than the one before it', 'He takes credit for getting each one fired',
                'He mixes up which boss had which fate'], a: 0,
      cue: '上司ごとの結末と、その順番。',
      line: '…got fired. … went crazy. Ed Truck, *who I liked*, *got decapitated*.',
      said: '上司は「クビ」「クビ」「おかしくなった」、好きだった一人は「首が飛んだ」と並べる。',
      mean: '去り方がどんどんひどくなり、最後は恐ろしい結末。それを淡々と言うのがおかしい。',
      trap: '自分が追い出したと取りやすいが、主語は上司たち。動詞の主語を追う。',
      use: 'It went from bad to worse.（どんどん悪くなった）' },

    // R fix: V2 + N7 — "fired for leaving early" was a filler (blind 55 %); it's now "not following" read as loyalty
    //   to the company. Its line and key give away h5's (Dwight is on the list), so it reveals `me`
    // why: signed up ← "followed you… for your walkout" heard as joining, with "didn't" lost; loyal ← "didn't follow"
    //   heard from the company's side, as staying at work
    { id: 'i2', skill: 'infer', level: 'B2', point: 'list', reveals: ['me'], seg: [120.0, 129.0],
      stem: 'What is Dwight’s list meant to show Michael?',
      choices: ['Who let him down by not joining him', 'Who signed up to join his walkout',
                'Who stayed loyal to the company'], a: 0,
      cue: '「a list of everyone」のあと。',
      line: 'a list of everyone *who didn’t follow you* in here.',
      said: '「ついていかなかった者のリストを作った」とマイケルに言う。',
      mean: 'リストは「ついてこなかった人」の名簿。自分は味方だと示す手。',
      trap: 'didn’t の t が消えて「ついていった人」と聞きやすい。disgraceful で、誰の側の名簿か分かる。',
      // R fix: N5 — use was 9 words
      use: 'I made a list of who owes money.（まだ払ってない人のリストを作った）' },

    // why: forgot ← "Me" after a pause heard as a late addition; first to follow ← "at first" heard as "I was first"
    { id: 'h5', skill: 'humor', level: 'C1', point: 'me', seg: [128.4, 132.95],
      stem: 'Why does the end of Dwight’s list get a laugh?',
      choices: ['He names himself among those who failed Michael', 'He forgets his own name and has to add it',
                'He proudly names himself as the first to follow'], a: 0,
      cue: 'リストの最後の名前と、そのあとの2語。',
      line: 'Jim. Oscar. Creed. *Me. At first…*',
      said: '名前を読み上げ、最後に「私。最初は…」と自分も入れる。',
      mean: '忠誠を見せる名簿に、自分まで正直に載せている。at first は「最初は」。',
      trap: 'at first を「一番に」と取りやすい。at first は「最初は〜だったが」の言いわけ。',
      use: 'I didn’t like it at first.（最初は好きじゃなかった）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'gonna', seg: [134.9, 137.6],
      stem: 'Type the start: “___ quiet that baby, or do I have to?” (3 words)', answer: 'are you gonna',
      cue: 'リストの名前のあと、問いの最初の3語。',
      line: '*Are you gonna* quiet that baby, or do I have to?',
      said: '「その子、静かにさせる？それとも私がやる？」と言う。',
      mean: 'are you gonna が「ャユガナ」のように縮む。or do I have to? で強い催促。',
      trap: 'are がほぼ消え、you から始まるように聞こえる。疑問文なら先頭の弱い語を補う。',
      use: 'Are you gonna eat that?（それ食べる？）' },

    // why: oldest ← youngest/oldest, the superlative's first sound lost; his parents ← "raises the others" heard as
    //   raising everyone, parents too
    { id: 'h6', skill: 'humor', level: 'C1', point: 'youngest', seg: [147.6, 155.0],
      stem: 'Why does Dwight’s claim about raising children get a laugh?',
      choices: ['He says he started while he was still a baby', 'He says the oldest child raises all the rest',
                'He says he raised his own parents as well'], a: 0,
      cue: '家のルールと、最後の since のあと。',
      line: 'the *youngest* child always raises the others. I’ve been raising children *since I was a baby*.',
      said: '「うちでは一番下の子が上の子を育てる。私は赤ちゃんのころから子育てしてきた」と言う。',
      mean: '真顔の説明が、赤ちゃんが子育てをするというありえない話になる。',
      trap: 'youngest を oldest と取ると普通の話に聞こえる。最上級は先頭の音まで聞く。',
      use: 'I’ve been cooking since I was ten.（10歳から料理してる）' },

    // R fix: V2 — "relieved" contradicted the stem's "problem" (blind 65 %); it's now a worried reading
    // why: worried ← "sleeping normally" heard as a health concern (a Japanese 心配 frame); guilty ← the daycare talk
    //   earlier in the clip
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'sleep', seg: [159.7, 166.3],
      stem: 'How does the baby’s sleep problem leave the parent feeling?',
      choices: ['Worn out, with no time for herself', 'Worried the baby might be ill',
                'Guilty for keeping the baby at work'], a: 0,
      cue: 'If で始まる文と、その後半。',
      line: 'If I could get her *sleeping normally*, I would *get my life back*.',
      said: '「この子がふつうに寝てくれたら、生活が戻るのに」と言う。',
      mean: 'If I could… は今そうでない仮定。get my life back に疲れが出ている。',
      trap: 'normally から病気の心配と取りやすいが、話の中心は自分の生活。',

      use: 'If I could sleep in, I’d be happy.（朝寝坊できたら幸せなのに）' },

    // R fix: V2 + N7 — the key was the only "no change" choice among two successes (blind 50 %); "asleep" is now
    //   "ask Gabe". Its choices name the fat, d6's key, so it reveals `suet`
    // why: get fat ← the detailed plan heard as carried out; ask Gabe ← "I kind of doubt Gabe has suet. — Really?"
    //   heard as a plan to find out
    { id: 'g3', skill: 'gist', level: 'B2', point: 'herewe', reveals: ['doubt', 'suet'], seg: [159.7, 190.5],
      stem: 'How does the talk about the sleepless baby end?',
      choices: ['They’re back to holding her, as before', 'They go to get fat from Gabe’s fridge',
                'They plan to ask Gabe if he has any'], a: 0,
      cue: '最後の Really? と、そのあとの一言。',
      line: 'Really? Well, then *here we are*.',
      said: '脂を使う案は、ゲイブの冷蔵庫になさそう。「じゃあ、このままだね」となる。',
      mean: 'here we are ＝ 結局こうなる、今のまま。名案は使えず、だっこを続けるしかない。',
      trap: '提案が詳しいので実行したと取りやすい。最後の一言で、何も変わらないと分かる。',
      use: 'No taxis? Well, here we are.（タクシーなし？まあ、こうなるよね）' },


    // R fix: V2 — "cold milk" was weak (blind 70 %); it's now a cold teething toy, real advice that fits "refrigerator"
    // why: toy ← "tie a piece of string" heard with a toy on the end; teething toy ← "refrigerator" + "in her mouth"
    //   suggests the usual chilled teether
    { id: 'd6', skill: 'detail', level: 'B1', point: 'suet', seg: [169.0, 182.2],
      stem: 'What does Dwight suggest giving the baby?',
      choices: ['A lump of animal fat on a string', 'A piece of string tied to a toy',
                'A cold teething toy from the fridge'], a: 0,
      cue: '「refrigerator」のあと、get で始まる部分。',
      line: 'get a lump of suet, or *any kind of congealed animal fat* will do… *pop the suet in her mouth*.',
      said: '「冷蔵庫の脂の塊にひもを付けて足の指に結び、口に入れればご機嫌」と言う。',
      mean: 'suet ＝ 牛などの脂。おしゃぶり代わりに脂を、という突飛な提案。',
      trap: 'string や refrigerator が耳に残りやすい。口に入れるのは pop のあとの語。',
      use: 'Any kind of tape will do.（テープなら何でもいいよ）' },

    // R fix: V2/K6 — "gently" made the key the only hedged choice (blind 55 %); each choice now has a manner
    // why: check ← "doubt" heard as "find out"; agree ← "Gabe has suet" heard as a condition ("if he has some")
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'doubt', seg: [182.5, 186.2],
      stem: 'What does the reply about Gabe’s fridge do?',
      choices: ['Gently turns the idea down', 'Politely asks Dwight to check',
                'Agrees, as long as Gabe has some'], a: 0,

      cue: '提案への返事、Gabe の前の言葉。',
      line: '*I kind of doubt* Gabe has suet.',
      said: '「ゲイブが脂を持ってるとは、ちょっと思えない」と返す。',
      mean: 'kind of doubt で、提案をやわらかく退けている。直接「いや」と言わない。',
      trap: 'doubt を「確かめる」と取りやすい。kind of を付けた否定は、角を立てない断り。',
      use: 'I kind of doubt they’re open now.（今は開いてないんじゃないかな）' },
  ]
};
