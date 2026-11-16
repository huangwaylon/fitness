// “Pranking Utica - The Office US” (the official The Office channel, Best of Season 4): Michael and Dwight sneak into
// the Utica branch's warehouse with Jim waiting in the car, trade the silly-string plan for the branch's copier, get
// stuck, and Jim runs into Karen; she has the last word to camera.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 195 s; whisper's lines after that are
// a loop.
// Untested on purpose: the Afro-wig offer at 5 s, "Go, go… / Move, move…" and "This is the dumbest thing we've ever
// done" at 37–44 s (speakers unclear), "great Scott / choking hazard poster" at 90–94 s (who is meant is unclear),
// the stuck copier at 112–133 s (crosstalk; only "Leave us… help us, Jim" and Jim's reply, in both sources, are
// used), and the Karen lines at 135–160 s (sexual, and they lean on backstory).
// EAR CHECK: 0.6–4.1 s a1 — "I can't believe we're here… — Believe it." is excited, not dreading (assumed excited:
//   the reply "Believe it" and the plan that follows; the words alone allow both)
// REVIEW 2026-11-16: pass 5, fix 16, drop 0, new 0; ear checks 1
import type { Clip } from '../types.ts';

export const prankUtica: Clip = {
  id: 'prankutica', video: 'S1c75vaqMJo', title: 'Pranking Utica - The Office US', dur: 215, wpm: 181,
  band: 'fast', tags: ['職場', '友だち'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // why: nervous ← "can't" heard as a negative feeling (信じたくない); far drive ← "can't believe we're here" heard
    //   as about the distance
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'arrive', seg: [0.2, 4.6],
      stem: 'In the opening lines, how does the speaker feel about being there?',
      choices: ['Thrilled that it’s finally happening', 'Nervous and wishing he hadn’t come',
                'Shocked by how far they had to drive'], a: 0,
      cue: '最初の2文と、それへの短い返事。',
      line: '*I can’t believe* we’re here. I can’t believe this is happening. — *Believe it.*',
      said: '「ここにいるなんて信じられない。本当に起きてる」に、「信じろ」と返される。',
      mean: 'I can’t believe は驚きの決まり文句。ここは待ちに待った興奮。',
      trap: 'can’t から否定の気持ちと取りやすい。この決まり文句は、うれしいときにも使う。',
      use: 'I can’t believe we’re finally here!（ついに来たなんて信じられない！）' },

    // R fix: V2 — "stairwell" was a filler (blind 70 %); it's now the near-sound "I'm leaving in the car" with
    //   "not" lost
    // why: lobby ← the usual lookout spot in a heist script; drive off ← "not" lost and "leaving the car" heard as
    //   leaving in it
    { id: 'd1', skill: 'detail', level: 'B1', point: 'car', seg: [5.5, 8.6],
      stem: 'Where will Jim be while the others go in?',
      choices: ['Staying in the car outside', 'Watching from the front lobby', 'Driving off, then coming back'], a: 0,
      cue: '「Michael」のあとの一文。',
      line: 'No. Michael, *I’m not leaving the car*.',
      said: 'かつらを勧められ、「いや。マイケル、僕は車から出ない」と答える。',
      mean: 'leave the car ＝ 車を降りる。ジムは外で待つ役で、中には入らない。',
      trap: 'leaving を「出発」と取ると逆になる。leave ＋ 場所は「そこを出る」。',
      use: 'I’m not leaving the house today.（今日は家から出ない）' },

    // R fix: V2 — the key was the only choice that kept the prank going (blind 75 %); all three now name what they
    //   end up doing
    // why: poster ← "that choking hazard poster" (92 s) is said just before "something far better"; spray and hide ←
    //   the plan as told, plus the close call with the guard (72–82 s)
    { id: 'g2', skill: 'gist', level: 'B2', point: 'switch', reveals: ['copier', 'plan'], seg: [9.5, 112.6],
      stem: 'How does the prank change once they’re inside?',
      choices: ['They switch from the string to the copier', 'They switch from the string to a poster',
                'They spray the string, then hide from a guard'], a: 0,
      cue: '計画の説明と、中で見つけた物の話。',
      line: 'We’ve got something *far better*.',
      said: '最初はシリーストリングの計画。中に入ると「もっといい物」を見つけ、そちらに切りかえる。',
      mean: 'いたずらの中身が途中で変わる流れ。far better が切りかえの合図。',
      trap: 'poster は直前に出た語で、比べられる側。計画と、実際にしたことを比べる。',
      use: 'Change of plans, everyone.（みんな、予定変更だよ）' },

    // R fix: V2 + N7 — "wheel out the copier" gave away d2 (wheels) and d3 (copier), and made the key easy (blind
    //   65 %); it's now "take on the guards", a keyword trap on "if we have to defend ourselves"
    // why: take on the guards ← "defend ourselves… security guard" heard as part of the plan, not a fallback;
    //   pose as guards ← "security guard" comes up in the next lines
    { id: 'g1', skill: 'gist', level: 'B2', point: 'plan', reveals: ['bejesus'], seg: [10.0, 25.8],
      stem: 'What is the plan Michael lays out?',
      choices: ['Sneak in as workers and spray silly string',

                'Sneak in as workers and take on the guards', 'Pose as guards and lock the staff out'], a: 0,
      cue: '「sneak inside」のあと、then で続く部分。',
      line: 'we pretend that we are *warehouse workers*, and we will *silly string* the bejesus out of the place.',
      said: '「作業員のふりで忍び込み、シリーストリングで中をめちゃくちゃにする」と説明する。',
      mean: '最初の計画はいたずらスプレー。コピー機は、あとで中で見つけたもの。',
      trap: '警備員の話は「もし身を守るなら」の場合の話。計画は、最初の説明の then のあとを聞く。',
      use: 'Here’s the plan: we wait, then we move.（作戦はこう。待って、それから動く）' },

    // R fix: V2 — "get down there" was weak (blind 65 %); it's now a tense trap, "gonna" lost and "go down" heard as
    //   a past story
    // why: last time ← "gonna" lost, so "how it… go down" heard as a story about the past; go wrong ← "go down" as
    //   sink or fail
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'godown', seg: [10.0, 13.3],
      stem: 'When Michael starts explaining, what does his first line mean?',
      choices: ['This is how things will happen', 'This is how it all went last time',
                'This is how it could all go wrong'], a: 0,
      cue: '「Dwight」「Yeah?」のあとの一文。',
      line: '*Here’s how it’s gonna go down.*',
      said: '「よし、段取りはこうだ」と計画の説明を始める。',
      mean: 'go down ＝ 起こる・展開する。作戦や事件の話でよく使う、くだけた言い方。',
      trap: 'down を「失敗」と取ったり、gonna を聞き落として過去の話と取りやすい。これは計画の前置き。',
      use: 'Tell me how it all went down.（どうなったか全部教えて）' },

    // R fix: V2 — "just a little" broke the parallel "Enough to…" (blind 55 %); it's now "scare", the verb this
    //   phrase usually takes
    // why: chase out ← “out of the place” heard as driving people out; scare ← “the bejesus out of” known from “scare
    //   the bejesus out of”, with the verb supplied
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'bejesus', seg: [16.4, 21.0],
      stem: 'How much silly string is Michael planning to use?',
      choices: ['Enough to cover the whole place', 'Enough to chase everybody out', 'Enough to scare the workers'],
      a: 0,
      cue: 'silly string のあと、強めの言い方。',
      line: 'we will silly string *the bejesus out of* the place.',
      said: '「中をシリーストリングまみれにしてやる」と言う。',
      mean: 'the bejesus out of ＝ 徹底的に。scare とよく組む、くだけた強調。',
      trap: 'out of を「追い出す」、scare と組む形から「おどす」と取りやすい。ここは強調だけ。',
      use: 'That movie scared the bejesus out of me.（あの映画、死ぬほど怖かった）' },

    // R fix: V2 — the key was the only choice with the eyes, and "softer" in quotes flagged it (blind 70 %); all
    //   three are now "He swaps…"
    // why: more dangerous ← "grind up" heard as a worse weapon; draw ← "chalk" suggests drawing, with "Nope" and
    //   "then" heard as backing down
    { id: 'h1', skill: 'humor', level: 'C1', point: 'chalk', seg: [21.0, 30.8],
      stem: 'Why is Dwight’s second idea for the guard funny?',
      choices: ['He swaps the method but still aims for the eyes', 'He swaps the chalk for something even worse',
                'He swaps the attack for drawing on the guard'], a: 0,
      cue: '「No」のあと、Then で始まる代案。',
      line: '…stab the security guard *in the eye* with the jumbo chalk. — No… — Then I’ll *grind up the jumbo chalk and blow it in his eyes*.',
      said: '「チョークで目を刺す」を止められ、「なら粉にして目に吹きかける」と言いかえる。',
      mean: '譲ったふりで、ねらいは同じ目のまま。代案がちっとも穏やかになっていない。',
      trap: 'grind up から別の武器を想像しやすいが、同じチョーク。代案は前と何が同じかを聞く。',
      use: 'Okay, then plan B.（わかった、じゃあ別の案で）' },

    // R fix: V2 — "lookout" was a filler (blind 60 %); it's now a scope shift (only the stabbing)
    // why: his own eyes ← "eyes" heard as about Dwight's safety; only the stabbing ← "No, you won't do that" (26 s)
    //   heard as the whole ruling, "nothing with" lost
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'eyes', seg: [30.4, 35.5],
      stem: 'What is Jim doing with his reply to Dwight’s chalk ideas?',
      choices: ['Ruling out anything aimed at eyes', 'Telling Dwight to guard his own eyes',
                'Ruling out only the stabbing idea'], a: 0,
      cue: '名前を呼んだあと、Please? の前。',
      line: 'Dwight, *nothing with the eyes*. Please?',
      said: '「目に関わることは一切なし。頼むよ」と言う。',
      mean: 'nothing with ～ ＝ ～がらみは全部だめ。まとめて線を引いている。',
      trap: '刺す案だけの禁止と取りやすい。nothing with は、目がらみ全部を禁じる範囲の言い方。',
      use: 'Nothing with peanuts, please.（ピーナッツ入りは全部なしで）' },

    // why: elevator ← the usual way up; hallway ← "down the hall" comes later (104 s)
    { id: 'd5', skill: 'detail', level: 'B1', point: 'stairs', seg: [58.3, 62.3],
      stem: 'Where are they, according to the first update?',
      choices: ['Climbing up a stairwell', 'Waiting inside an elevator', 'Walking down a hallway'], a: 0,
      cue: '「We are in a」のあと。',
      line: 'We are *in a stairwell*. We are *climbing some stairs*.',
      said: '「今、階段にいる。階段をのぼっている」と無線で伝える。',
      mean: 'stairwell ＝ 建物の中の階段部分。見れば分かることまで実況している。',
      trap: 'well を「井戸」と取ると迷う。stair-well で階段の吹き抜け。最初の stair を聞く。',
      use: 'Meet me in the stairwell.（階段のところで会おう）' },

    // R fix: V2 + speaker — the key was the only sensible reply (blind 70 %); "speak up" is now "keep my voice
    //   down" (loudness, not amount), parallel to the key. The stem no longer names Michael: the words don't settle
    //   who is on the radio
    // why: tell more ← "updating me" heard without "don't need", as a request for more; voice down ← the complaint
    //   heard as about loudness, with "as much as" lost
    // anchor: 58.8–68.7 s "You really don't need to be updating me as much as you're updating me" answers "We are in
    //   a stairwell… climbing some stairs… I'm breathing heavily": the complaint is about how much, not how loud;
    //   Michael's next words ("There's a guy. There's a guy…", 69–71.4 s) show he didn't take it
    { id: 'nt2', skill: 'pragma', level: 'C2', point: 'updating', reveals: ['dontneed'], seg: [58.3, 71.8],
      stem: 'Which reply to Jim would show his point was understood?',
      choices: ['Got it. I’ll update you less.', 'Got it. I’ll keep my voice down.', 'Sure! I’ll tell you more.'],
      a: 0,
      cue: '実況の中身と、ジムの返事の as much as。',
      line: 'You really *don’t need to be updating me as much as you’re updating me*.',
      said: '階段にいる、息が荒い、と実況するマイケルに「そんなに報告しなくていい」と返す。',
      mean: '「必要ない」の形で「減らして」と頼んでいる。気づいたなら控えるはずが、すぐまた実況を始める。',
      trap: '無線なので声の大きさの話と取りやすい。as much as は量の話で、音量ではない。',
      use: 'No need to text me every minute.（毎分メールしなくていいよ）' },

    // R fix: V2 — the key was the middle of three (blind 50 %); "won't need to" added as a fourth sound-alike
    // why: need to ← the t of "don't" drops and "don'" blends into "need"; didn't / won't ← the n't is caught, the
    //   vowel is guessed
    { id: 's1', skill: 'sound', level: 'B2', point: 'dontneed', seg: [65.3, 69.4],
      stem: 'Fill the gap: “You really ___ be updating me…”',
      choices: ['don’t need to', 'need to', 'didn’t need to', 'won’t need to'], a: 0,
      cue: '「really」のすぐあと、need の前後。',
      line: 'You really *don’t need to* be updating me…',
      said: '「そんなに報告しなくていいよ」と言う。',
      mean: 'don’t need to が「ドンニートゥ」とつながる。t が消え、n が続く。',
      trap: 'don’t の t が落ちて need to だけに聞こえやすい。need の前の小さな「ン」を聞く。',
      use: 'You don’t need to wait for me.（待たなくていいよ）' },

    // R fix: V2 — "real names" was a stock filler (blind 65 %); it's now the question heard the other way round
    // why: forgot ← the greeting is short and rushed; ask him ← "Would you like more proof?" heard as asking the
    //   guard for his proof
    { id: 'h2', skill: 'humor', level: 'C1', point: 'proof', reveals: ['wouldja'], seg: [72.3, 77.2],
      stem: 'Why is the greeting to the security guard funny?',
      choices: ['Offering extra proof makes them seem suspicious', 'They forget to say what job they’re pretending to do',
                'They ask the guard to prove who he is'], a: 0,
      cue: 'workers のあとの、聞かれていない一言。',
      line: 'Hello. We’re warehouse workers. *Would you like more proof?*',
      said: '警備員に「どうも。倉庫の作業員です。もっと証拠いります？」と言う。',
      mean: '誰も疑っていないのに証拠を申し出る。言いわけを重ねるほど怪しく聞こえる。',
      trap: 'Would you like は相手への申し出で、要求ではない。笑いは、頼まれていない一言にある。',
      use: 'Not that you asked, but…（聞かれてないけど…）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'wouldja', seg: [74.8, 77.0],
      stem: 'Type the question: “___ more proof?” (3 words)', answer: 'would you like',
      cue: '「workers」のあと、問いの最初の3語。',
      line: '*Would you like* more proof?',
      said: '「もっと証拠いりますか？」と言う。would you がつながる。',
      mean: 'would you が「ウッジュ」とつながり、like まで一息で言う。',
      trap: 'd と you が合わさり「ジュ」になる。「ジュ」は d＋you を疑う。',
      use: 'Would you like some water?（お水いかがですか）' },

    // why: private ← "groin" as a part you don't touch, so a reason to leave eyes alone; most important ← "the X of
    //   the head" heard as "the heart of"
    { id: 'i1', skill: 'infer', level: 'C1', point: 'groin', seg: [80.2, 89.8],
      stem: 'When Jim says to leave the guard’s eyes alone, what does Dwight argue?',
      choices: ['Eyes are the weak spot to hit in a fight', 'Eyes are too private a part to touch',
                'Eyes are the most important part of the face'], a: 0,
      cue: '止められたあとの、たとえの一文。',
      line: 'I have to do something to his eyes. … *The eyes are the groin of the head.*',
      said: '止められても「目に何かしないと。目は頭の急所だ」と言い張る。',
      mean: 'groin は格闘での急所。目を「頭の急所」にたとえ、だからねらうと言う。',
      trap: 'groin から「触れてはいけない所」と取りやすい。前の文は攻める話。',
      use: 'Coffee is the fuel of the office.（コーヒーは職場の燃料）' },

    // R fix: V2 — "crown jewels" was absurd (blind 75 %); it's now a near-miss office machine
    // why: poster ← the thing named just before, which they're comparing against; shredder ← "industrial" kept,
    //   the machine's name lost
    { id: 'd3', skill: 'detail', level: 'B1', point: 'copier', seg: [90.0, 98.5],
      stem: 'What do Michael and Dwight find that’s “far better”?',
      choices: ['Their big industrial copier', 'A choking-hazard poster', 'Their big industrial shredder'], a: 0,
      cue: '「far better」のあと、2つの言いかえ。',
      line: 'Their *crown jewel*, their *industrial copier*.',
      said: '「もっといい物を見つけた。あそこの宝、業務用コピー機だ」と言う。',
      mean: 'crown jewel ＝ 一番の自慢の品。ここでは大型コピー機のこと。',
      trap: 'poster は直前に出た語で、比べられる側。industrial のあとの語まで聞く。',
      use: 'This painting is the museum’s crown jewel.（この絵が美術館の目玉）' },

    // R fix: V2 + speaker — "Dwight can carry it" was weak (blind 65 %); it's now "comes apart". The stem no longer
    //   names Michael: the words don't settle who answers "Isn't that thing huge?"
    // why: lighter ← "enormous, but…" heard as "but it isn't heavy"; comes apart ← "it's got…" heard as "it's got
    //   parts", a way to move a big machine
    { id: 'd2', skill: 'detail', level: 'B1', point: 'wheels', seg: [98.9, 103.5],
      stem: 'Why do they think they can take the copier?',
      choices: ['It’s on wheels, so it can roll', 'It is a lot lighter than it looks', 'It comes apart into pieces'], a: 0,
      cue: '「enormous」のあと、but に続く部分。',
      line: 'Isn’t that thing huge? — It’s enormous, *but it’s got wheels*.',
      said: '「でかくない？」に「巨大だ。でも車輪が付いてる」と答える。',
      mean: 'but のあとが本音。大きさは認めつつ、車輪があるから運べると考えている。',
      trap: 'enormous で「無理」と取りやすい。but のあとに、言いたいことが来る。',
      use: 'It’s pricey, but it’s worth it.（高いけど、その価値はある）' },

    // why: brings the car ← the order just before; wait ← "Don't do this" heard as "not now"
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'terrible', seg: [106.1, 112.6],
      stem: 'How does Jim react to being told to get the car ready?',
      choices: ['He begs them not to go through with it', 'He agrees to bring the car around',
                'He says to wait for a better time'], a: 0,
      cue: '車の指示のあと、No で始まる返事。',
      line: 'Get the car ready. — *No, that is a terrible idea. Don’t do this.*',
      said: '「車を用意しろ」に「だめ、最悪の考えだ。やめて」と返す。',
      mean: 'terrible idea と Don’t do this で反対している。',
      trap: '直前の指示が耳に残り、従ったと取りやすい。返事の最初の No を聞く。',
      use: 'That’s a terrible idea. Don’t.（それ最悪の考え。やめて）' },

    // R fix: V2 — “mocking” was a filler (blind 65 %); it's now “quiet them to explain”, from “second of all, just—”
    // why: tired of begging ← the string of "help us" right before; explain a plan ← "and second of all, just—"
    //   heard as the start of instructions he needs them quiet for
    { id: 'i3', skill: 'infer', level: 'C1', point: 'name', seg: [120.0, 128.4],
      stem: 'Why does Jim ask them to stop using his name?',
      choices: ['He doesn’t want to be linked to the prank', 'He’s tired of them begging him for help',
                'He wants quiet so he can explain a plan'], a: 0,
      cue: '「first of all」のあとの頼み。',
      line: 'Leave us, Jim… We need help, Jim. — Okay, first of all, *stop using my name*.',
      said: '「ジム、助けて」と何度も呼ばれ、「まず名前を出すな」と返す。',
      mean: '大声で名前を出されると、誰がかかわったか分かる。身元を隠したいということ。',
      trap: '何度も呼ばれるので「うるさい」と取りやすい。最優先にした理由を考える。',
      use: 'First of all, keep your voice down.（まず、声を落として）' },

    // R fix: V2 — "show him the branch" was a filler (blind 65 %); it's now the personal reading of "what are you
    //   doing here?"
    // why: job duties ← the words taken at face value; came to see her ← her "what are you doing here?" twice, heard
    //   as him owning up
    { id: 'p3', skill: 'pragma', level: 'B2', point: 'branches', seg: [167.1, 180.0],
      stem: 'What is Jim doing when Karen asks why he’s there?',
      choices: ['Giving a made-up reason for the visit', 'Telling her about his new job duties',
                'Hinting that he came to see her'], a: 0,
      cue: '「what are you doing here」への答え。',
      line: 'I’m just *checking on the other branches*. Michael wants me to do that from time to time, so…',
      said: '「何しに来たの？」に「ほかの支店の様子見で」と答える。',
      mean: '本当はいたずらの手伝い。just と so… に、その場しのぎらしさが出ている。',
      trap: '言葉どおり仕事の話と取りやすい。前の場面とつなげ、言っていない本当の理由を考える。',
      use: 'I was just in the neighborhood.（ちょっと近くまで来たから）' },

    // R fix: V2/K5 — "loud and clear" made the key the only vivid, non-"He'll" choice (blind 55 %); all four are now
    //   "He'll…", with a third literal "copy" (= repeat) added
    // why: copy for Karen ← "copy" as making a copy, with "copier" just said; write down ← "copy" as copying words;
    //   repeat it ← "copy" as imitating, so passing the words on
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'copy', seg: [179.8, 185.6],
      stem: 'How is the order about Karen and the copier answered?',
      choices: ['He’ll do as he’s told', 'He’ll make a copy for Karen', 'He’ll write the order down',
                'He’ll repeat it to Karen'], a: 0,
      cue: '指示への、2語の返事。',
      line: 'Do not tell Karen about the industrial copier. — *Copy that.*',
      said: '「カレンにコピー機のことは言うな」に「了解」と返す。',
      mean: 'copy that ＝ 了解（無線の言葉）。直前の copier と音が重なるのも笑いどころ。',
      trap: 'copy を「コピーする」と文字どおり取りやすい。無線の Copy は「受け取った」。',
      use: 'Copy that. On my way.（了解。今向かう）' },

    // R fix: V2 — "moved on, seemed happy" was weak (blind 50 %); it's now "hurt her, now sorry", wrong only in
    //   what she saw
    // why: seemed sorry ← "felt pretty good" heard as satisfaction at an apology, the forgiving reading; come back to
    //   her ← his surprise visit heard as a return to her
    // anchor: 186.2–194.3 s "I cried for weeks over that guy" sets the hurt, and what "felt pretty good" is the
    //   picture of him climbing "out of a PT Cruiser in a ladies' warehouse uniform": the pleasure is in how foolish
    //   he looked, not in anything he did for her
    { id: 'nt1', skill: 'attitude', level: 'C2', point: 'goodfeel', seg: [185.7, 195.0],
      stem: 'In the closing comment to the camera, why did seeing him feel good?',
      choices: ['He had hurt her, and now he looked silly', 'He had hurt her, and now he seemed sorry',
                'He had left, and now he’d come back to her'], a: 0,
      cue: '前半の「泣いた」と、後半に見た姿。',
      line: 'I *cried for weeks* over that guy, so yeah. Seeing him climb out of a PT Cruiser *in a ladies’ warehouse uniform* felt pretty good.',
      said: '「あの人で何週間も泣いた。女性用の作業着で車から出てくるのを見て、いい気分」と話す。',
      mean: '傷つけた相手の、かっこ悪い姿を見てすっとした。pretty good は控えめに言った満足。',
      trap: 'felt good を謝罪や再会の満足と取りやすい。何を見てそう感じたかを、直前の描写で確かめる。',

      use: 'Not gonna lie, that felt pretty good.（正直、ちょっとすっとした）' },
  ]
};
