// “Ron Swanson Pulls Out His Tooth | Parks and Recreation” (the official Parks and Recreation channel, Season 3): at a
// staff meeting on street parking and recycling, Ron waves off a toothache and won't see a dentist; to the camera he
// says the dentist pulled the tooth the day before, and the show was to prove he can take pain (and to make Tom faint).
// Segments from the captions, words from whisper (2026-11-16). Only Ron (and Tom, in the talking head) is named, so
// the others are “the leader” (who runs the meeting) and “a coworker”.
// Untested on purpose: 28–41 s (the tooth itself: pain noises, laughter, a visual gag), 37–43.5 s (“Oh. I'm sorry,
// everybody. What were we talking about? — Recycling.”: captions only, speakers unclear), 58–71 s (laughter, music).
// EAR CHECK: 43.5–57.5 s g3 n1 f1 a2 h2 s2 nt1 nt2 — the talking head is in the captions only (whisper loops “no”
//   over 29–59 s): “Dentist pulled the tooth out yesterday. But it's always a good idea to demonstrate to your
//   co-workers that you are capable of withstanding a tremendous amount of pain. Plus it's always fun to see Tom
//   faint.” Confirm the words, above all “yesterday” (n1, nt1) and “faint” (s2)
// Not an ear check: at 9 s, whether “'Cause nobody wants to steal a Saturn” is the coworker's reply (whisper's dash)
//   or the leader's own reason (captions run it on as “I'm doing it because…”); h1, i1 and i3 hold either way.
// REVIEW 2026-11-16: pass 6, fix 13, drop 1, new 1; ear checks 1
import type { Clip } from '../types.ts';

export const ronTooth: Clip = {
  id: 'rontooth', video: 'N6J_32cDk9Y', title: 'Ron Swanson Pulls Out His Tooth', dur: 71, wpm: 159, band: 'mid',
  tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 55 %): "repainted" was the only everyday reason; now three jobs on the lot, with "repaving"
    //   as the near sound. Trap rewritten
    // why: repaving ← repaint/repave sound alike, and both are work on a lot; bins ← the next agenda item ("blue
    //   bins") heard as the reason
    { id: 'd1', skill: 'detail', level: 'B1', point: 'lot', seg: [0, 6.5],
      stem: 'Why is everyone asked to park on the street?',
      choices: ['They are repainting the lines in the lot', 'They are repaving the whole parking lot',
                'They are putting recycling bins in the lot'], a: 0,
      cue: '最初の一文、「while」のあと。',
      line: 'So while they *repaint the lines* in the parking lot…',
      said: '「駐車場の線を塗り直すあいだ、みんな路上に止めてほしい」と言う。',
      mean: 'while ＝「〜しているあいだ」。工事のあいだだけの、一時的なお願い。',
      trap: 'repaint と repave（舗装し直す）は音が近い。後ろの the lines まで聞けば線の話。',
      use: 'While they fix the elevator, use the stairs.（エレベーター修理中は階段で）' },

    // R fix: V2 (blind 85 %): the dentist and "nicer cars" choices were plainly off-agenda. All three are now two
    //   agenda items, each sharing one with the key. Trap rewritten
    // why: car theft ← "nobody wants to steal" taken as an agenda item; staff health ← Ron's tooth and the dentist
    //   talk taken as a meeting topic
    { id: 'g1', skill: 'gist', level: 'B1', point: 'meeting', reveals: ['movingon'], seg: [0, 28.5],
      stem: 'What is the meeting itself mostly about?',
      choices: ['Street parking and recycling', 'Street parking and car theft', 'Recycling and staff health'], a: 0,
      cue: '進行役が「moving on」で次に移る前後。',
      line: '…we’re asking everyone to do *street parking*. … All right, moving on to *recycling*.',
      said: '前半は駐車場の話、後半はリサイクルの話。そのあいだに Ron の歯の話がはさまる。',
      mean: '会議は事務連絡。歯の話は、その途中に割りこんでくる別の流れ。',
      trap: 'steal や歯の話も耳に残るが、議題として出るのは parking と recycling。',
      use: 'Let’s get back to the agenda.（議題に戻りましょう）' },

    // R drop: g2 (gist B2, why Ron handled the tooth). Blind 65 % (Ron's tough-guy persona answers it), and it
    //   tied the gist to nt2 (same point, why), so plays 3+ had no C2 whenever g2 came first (C4). A rewrite still
    //   tied it to nt2, so it's deleted (never shipped) and replaced by g3
    // R new: g3, a scene-level gist on how the clip unfolds. Its key doesn't say what Ron's reason is, so it clashes
    //   with no C2. Blind read: about 40 % (all three start "A meeting, a toothache, then…")
    // why: dentist visit ← "Dentist pulled the tooth out" heard as what comes next, with the past tense lost; vote ←
    //   the usual meeting script after the Mercedes objection
    { id: 'g3', skill: 'gist', level: 'B2', point: 'arc', seg: [0, 58.5],
      stem: 'How does the clip unfold, from start to end?',
      choices: ['A meeting, a toothache, then Ron explains it', 'A meeting, a toothache, then a dentist visit',
                'A meeting, a toothache, then a vote on parking'], a: 0,
      cue: '会議のあと、カメラに向かって話す部分。',
      said: '会議の途中で Ron の歯の一件があり、最後に Ron がカメラにそのわけを話す。',
      mean: '最後のカメラへの一言が、会議の場面の見え方を変える。',
      trap: 'dentist から、このあと歯医者へ行くと取りやすい。pulled は過去形で、もう済んだ話。',
      use: 'Let me explain what happened.（何があったか説明させて）' },

    // why: agrees ← the weak "not" and its lost t make "I'm not street parking" sound like a yes; jokes ← the laughs
    //   around the Saturn line
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'mercedes', seg: [2.9, 10.6],
      stem: 'How does a coworker take the street-parking request?',
      choices: ['He refuses, to protect his fancy car', 'He agrees, though he worries about his car',
                'He jokes about it, but goes along'], a: 0,
      cue: '依頼のすぐあと、自分の車の名前を出す一言。',
      line: '*I’m not street parking* my Mercedes. — Well, everyone is.',
      said: '「僕のメルセデスを路上に止める気はない」と言い、進行役が「みんなそうしてる」と返す。',
      mean: '自分の車は特別だ、という拒否。車名には自慢も混じる。',
      trap: 'not が弱く短いので、同意に聞こえることがある。直後の「みんなそうしてる」は拒否への返し。',
      use: 'I’m not leaving my bike out there.（自転車を外に置いとく気はないよ）' },

    // R fix: V2 (blind 70 %): "repainting all the lines herself" was absurd. "The one asking everyone" (it = the
    //   asking) replaces it
    // why: asking ← "doing it" heard as "I'm the one doing this", after "we're asking everyone"; park his car ←
    //   "doing it" taken as doing it for him
    { id: 'i3', skill: 'infer', level: 'B2', point: 'doingit', seg: [4.2, 10.6],
      stem: 'What does the leader mean by “I’m doing it”?',
      choices: ['She parks on the street too', 'She is the one asking everyone', 'She will park his car for him'],
      a: 0,
      cue: '「everyone is」に続く短い一言。',
      line: 'Well, everyone is. *I’m doing it*.',
      said: '「みんな路上に止めてるし、私もそうしてる」と言う。',
      mean: 'doing it は直前の street parking のこと。自分も例外ではないと示している。',
      trap: 'it が何を指すか取りちがえると、別の話に聞こえる。it は直前の話題を指すことが多い。',
      use: 'Everyone’s walking. I’m doing it too.（みんな歩いてる。私もね）' },

    // R fix: V2 (blind 75 %): "stolen once, so she should know better" had no pull. All three now say "Her car is
    //   so…", and "so ugly that she would like it stolen" (right target, wrong direction) replaces it. Trap rewritten
    // why: ugly ← right target, wrong direction: "nobody wants to steal" turned into her wanting it gone; so nice ←
    //   direction flipped: "nobody wants to" heard as "nobody would dare"
    { id: 'h1', skill: 'humor', level: 'C1', point: 'saturn', reveals: ['doingit'], seg: [4.2, 10.6],
      stem: 'Why does the line about a Saturn get a laugh?',
      choices: ['Her car is so cheap that no thief would want it', 'Her car is so ugly that she would like it stolen',
                'Her car is so nice that no thief would dare touch it'], a: 0,
      cue: '「I’m doing it」に続く、nobody で始まる部分。',
      line: '…*nobody wants to steal* a Saturn.',
      said: '「サターンなんて誰も盗みたがらない」という一言が続く。',
      mean: '彼女が平気なのは車に盗む価値がないから。「みんなやってる」の手本にならない。',
      trap: 'wants to の主語は nobody＝泥棒の側。Saturn を知らなくても「盗む価値なし」と分かる。',
      use: 'Nobody’s going to steal that old thing.（あんな古いの、誰も盗まないよ）' },

    // R fix: V2 (blind 75 %): "a Mercedes can be stolen" needs no listening, and the flipped choice was the odd one
    //   out. It now asks what the line does to her example: two "for little" and one "for more". Stem, mean and trap
    //   rewritten, and it reveals doingit
    // why: more ← "I'm doing it" heard as a sacrifice, which would make her example stronger; private spot ← right
    //   direction, wrong reason: the usual perk of whoever runs the meeting, never said
    { id: 'i1', skill: 'infer', level: 'C1', point: 'saturn', reveals: ['doingit'], seg: [4.2, 10.6],
      stem: 'How does the Saturn line change the point of “I’m doing it”?',
      choices: ['It counts for little: her car is not worth stealing', 'It counts for more: her car means a lot to her',
                'It counts for little: she has her own private spot'], a: 0,
      cue: '「nobody wants to」の後ろ、何を盗まないか。',
      line: '…nobody *wants to* steal a *Saturn*.',
      said: '「サターンを盗みたい人はいない」と言う。',
      mean: '裏返すと「メルセデスなら盗まれる」。だから彼女の「私もやってる」は、彼の手本にならない。',
      trap: '「私もやってる」を犠牲と取ると例が強く見える。盗まれない車なら、路上でも失うものはない。',
      use: 'Nobody wants to sit in the back.（後ろの席に座りたい人はいない）' },

    // R fix: V2 (blind 50 %): the key was the only choice that moved on. All three now end "moves on to recycling",
    //   so the choice is how she leaves the fight
    // why: gives in ← "All right" heard as a concession (わかった、いいよ); vote ← the usual meeting script
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'movingon', seg: [5.5, 13.8],
      stem: 'Right after the Saturn line, what does the leader do?',
      choices: ['Leaves it unsettled and moves on to recycling', 'Gives in to him and moves on to recycling',
                'Calls for a vote and moves on to recycling'], a: 0,
      cue: '「All right」のあと、次の話題の名前。',
      line: '*All right, moving on to* recycling.',
      said: '「はい、では次、リサイクルの件」と話を進める。',
      mean: 'All right は同意でなく区切りの合図。決着をつけずに議題を変えている。',
      trap: 'All right を「分かった、いいよ」と取ると譲歩に聞こえる。ここは「はい、次」の区切り。',
      use: 'Okay, moving on.（はい、次いきます）' },

    // R fix: V2 (blind 75 %): the key was the only choice where he plays it down. "Playing down the pain so he can
    //   leave early" (right move, wrong motive) replaces the break
    // why: leave early ← right mechanism, wrong motive, which "Continue" refutes; help ← the Japanese frame: naming
    //   a pain = asking for help
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'fine', reveals: ['pain'], seg: [13.8, 21.9],
      stem: 'When asked if he is okay, what is Ron doing with his answer?',
      choices: ['Playing down the pain so the meeting goes on', 'Playing down the pain so he can leave early',
                'Admitting the pain so someone will help him'], a: 0,
      cue: '「tooth pain」のあとの短い二言。',
      line: 'Just a little tooth pain. *I’m fine. Continue.*',
      said: '「ちょっと歯が痛いだけ。大丈夫。続けて」と言う。',
      mean: '心配を打ち切って、会議を止めないよう促している。短い命令形で話を終わらせる言い方。',
      trap: '痛みを口にすると助けを求めていると取りやすいが、Continue で自分から話を戻している。',
      use: 'I’m fine. Go on.（大丈夫。続けて）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'pain', seg: [14, 21.9],
      stem: 'Type Ron’s answer: “Just a ___.” (3 words)', answer: 'little tooth pain',
      cue: '「You okay, Ron?」の直後。',
      line: 'Just a *little tooth pain*. I’m fine.',
      said: '「ちょっと歯が痛いだけ」。',
      mean: 'little の t は弾んで「リロ」に近い。tooth の th は舌先を歯に当てる音。',
      trap: 'little が短く縮むので、別の語に聞こえやすい。a little は「ちょっと」のかたまり。',
      use: 'Just a little headache. Nothing serious.（ちょっと頭痛がするだけ）' },

    // R fix: V2 (blind 70 %): "for recycling" pointed at the key, since the stem comes after "moving on to
    //   recycling". All three are now "Blue" plus a near-sound noun. Trap rewritten
    // why: bags ← another recycling container, with the weak final "-ns" of "bins" lost; binders ← "bin-" caught and
    //   finished as office supplies
    { id: 'd4', skill: 'detail', level: 'B1', point: 'bins', seg: [18.9, 22.3],
      stem: 'What will each department be getting?',
      choices: ['Blue bins', 'Blue bags', 'Blue binders'], a: 0,
      cue: '「Each department」のあと、最後の二語。',
      line: 'Each department will be getting *blue bins*.',
      said: '「各部署に青い箱が配られます」と言う。',
      mean: 'bin ＝ ごみ箱・回収箱。blue bin はリサイクル用の箱によく使う言い方。',
      trap: 'bins の n が弱く、bags や binders にも聞こえうる。色のあとの名詞は、最後の音まで聞く。',
      use: 'Which bin is for plastic?（プラスチックはどの箱？）' },

    // why: need ← the question's own verb stays in the ear; have ← "don't" plus "dentist" heard as "don't have one"
    { id: 'd2', skill: 'detail', level: 'B1', point: 'dentists', seg: [22.2, 28.5],
      stem: 'Asked about the dentist, what does Ron say?',
      choices: ['He doesn’t like them', 'He doesn’t need to go', 'He doesn’t have one'], a: 0,
      cue: '質問のすぐあと、Ron の最初の一文。',
      line: '*I don’t like dentists.* Just a second.',
      said: '「歯医者は嫌いだ。ちょっと待って」と言う。',
      mean: '行かない理由を短く言い切っている。説明はせず、話を終える答え方。',
      trap: '質問の need が耳に残り、「必要ない」と取りやすい。返事の動詞を聞く。',
      use: 'I don’t like hospitals.（病院は苦手なんだ）' },

    // why: want to ← "need to" squeezed into two quick beats, like "wanna"; Did ← "do you" run together as "d'you"
    { id: 's1', skill: 'sound', level: 'B2', point: 'needto', seg: [22.2, 28.5],
      stem: 'Fill the gap: “___ go to the dentist, Ron?”',
      choices: ['Do you need to', 'Do you want to', 'Did you need to'], a: 0,
      cue: '「blue bins」のあと、質問の最初。',
      line: '*Do you need to* go to the dentist, Ron?',
      said: '「歯医者に行ったほうがいいんじゃない？」と聞いている。',
      mean: 'Do you need to が「ドゥユニートゥ」とつながり、to は弱く「タ」に近い。',
      trap: 'want to なら「ワナ」に縮む。ニの音が聞こえたら need。',
      use: 'Do you need to sit down?（座ったほうがいい？）' },

    // why: today ← only the strong "-day" is caught; two days ago ← "yesterday" heard as "the day before yesterday"
    { id: 'n1', skill: 'number', level: 'B1', point: 'when', reveals: ['staged'], seg: [43.4, 47.1], keep: true,
      stem: 'When does Ron say the dentist pulled the tooth?',
      choices: ['Earlier today', 'Yesterday', 'Two days ago'], a: 1,
      cue: 'カメラに向かって話す最初の一文、最後の語。',
      line: 'Dentist pulled the tooth out *yesterday*.',
      said: '「歯医者が昨日、歯を抜いた」と言う。文頭の The は省いている。',
      mean: '昨日もう抜いてあった、ということ。会議での一件の見え方が変わる一言。',
      trap: 'yesterday は最後の day だけが強く残りやすい。頭の yes の音まで拾う。',
      use: 'I called them yesterday.（昨日電話しました）' },

    // R fix: V2 (blind 55 %) + C4: the key was the only one with both "planned" and "toughness", and revealing g2's
    //   point (why) left plays 3+ with no C2 whenever g2 was the gist (both C2 items were blocked). It now turns only
    //   on show vs emergency: two "A show:" choices and one "An emergency:", none naming the motive, and it reveals
    //   only `when`. Line, mean and trap rewritten
    // anchor: 43.97–46.4 s “Dentist pulled the tooth out yesterday”: the tooth was already out, so the meeting scene
    //   can't be an emergency, and a dentist did pull it; 46.5 s “But it's always a good idea to demonstrate…”:
    //   “but” marks the scene as done on purpose
    // why: skipped the dentist ← right that it was a show, wrong in one way: "I don't like dentists" in the meeting,
    //   but "Dentist pulled the tooth" refutes it; emergency ← "yesterday" missed, so the pain looks real
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'staged', reveals: ['when'], seg: [43.4, 54.3],
      stem: 'Given what Ron tells the camera, what was the tooth scene in the meeting?',
      choices: ['A show: the tooth was out the day before', 'A show: he skipped the dentist to prove a point',
                'An emergency: the tooth had to come out now'], a: 0,
      cue: 'カメラの前の最初の一文と、そのあとの「but」。',
      line: '*Dentist pulled the tooth out yesterday*. But it’s always a good idea to…',
      said: 'カメラに「歯医者が昨日もう抜いた。でも〜はいいことだ」と話す。',
      mean: '昨日もう抜いてあったなら、会議の一件は急病ではない。but で、わざと見せた芝居だったと分かる。',
      trap: '会議の「歯医者は嫌い」から歯医者を避けたと取りやすいが、抜いたのは歯医者。痛がる様子だけ見ると急病に見える。',
      use: 'It was all for show.（全部見せるためだったんだ）' },

    // R fix: V2 (blind 55 %): "teach… deal with their pain" and "tell when you are in pain" were far from the key.
    //   All three are now near-identical in form and differ in one way each: show how (teach) and show the pain
    //   (sincerity flip). Trap rewritten
    // anchor: 48.9–54 s “demonstrate to your co-workers that you are capable of withstanding…”: the that-clause is
    //   about Ron himself, so it's proof, not a how-to; “withstanding” is bearing the pain, not showing it
    // why: show how ← the katakana デモンストレーション (実演して教える); pain you are in ← sincerity flip: showing the
    //   pain instead of enduring it
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'why', reveals: ['withstand'], seg: [43.4, 54.3],
      stem: 'Which plain-English version keeps what Ron means by “demonstrate”?',
      choices: ['Let your coworkers see how much pain you can take', 'Show your coworkers how to take a lot of pain',
                'Let your coworkers see how much pain you are in'], a: 0,
      cue: '「demonstrate」のあと、that に続く中身。',
      line: 'a good idea to *demonstrate* to your co-workers *that you are capable of* withstanding…',
      said: '「すごい痛みに耐えられると同僚に見せるのはいい」と言う。',
      mean: 'demonstrate that ～ ＝「〜だと示す・証明する」。やり方を教える実演ではなく、自分の強さの証明。',
      trap: 'デモンストレーションから「やり方を見せる」と取りやすい。that 節なら「示す」。痛がる姿を見せるのでもない。',
      use: 'I want to show them I’m ready.（準備ができていると見せたい）' },

    // R fix: V2 + S2 (blind 80 %): the stem quoted the word under test, so it was a vocabulary question. The stem
    //   now names the moment, and the choices are take / cause / hide pain. Cue and trap rewritten
    // why: cause ← "demonstrate to your co-workers" heard as doing it to them; hide ← his "I'm fine" in the meeting,
    //   but withstand is bearing pain, not hiding it
    { id: 'f1', skill: 'phrase', level: 'C1', point: 'withstand', seg: [47, 54.3],
      stem: 'Right after “capable of”, what does Ron say he can do?',
      choices: ['Take a huge amount of pain', 'Cause a huge amount of pain', 'Hide a huge amount of pain'], a: 0,
      cue: '「of」のすぐあと、with で始まる長い語。',
      line: 'you are capable of *withstanding a tremendous amount of pain*.',
      said: '「ものすごい量の痛みに耐えられる」と言う。',
      mean: 'withstand ＝ 負けずに耐える。少し硬い語を、わざと大げさに使っている。',
      trap: 'stand から「立つ」、I’m fine から「隠す」と取りやすい。withstand で一語、「耐えぬく」。',
      use: 'This bag can withstand heavy rain.（このバッグは大雨にも耐える）' },

    // R fix: V2 (blind 80 %): "praise for Tom" had no pull. "A lesson for Tom" (the wrong use of the Tom line)
    //   replaces it, and "a confession of pain" replaces "admitting fear". Trap rewritten
    // why: lesson for Tom ← "see Tom faint" read as Tom needing to toughen up, but the word is "fun"; confession ←
    //   "pain" and "faint" heard as being about himself
    { id: 'h2', skill: 'humor', level: 'C1', point: 'faint', reveals: ['why', 'withstand'], seg: [47, 58],
      stem: 'What makes the very end of Ron’s comment to the camera funny?',
      choices: ['A tough-guy lesson ends with a selfish bonus reason', 'A tough-guy lesson ends with a lesson for Tom',
                'A tough-guy lesson ends with a confession of pain'], a: 0,
      cue: '立派な理由のあと、「plus」で足すもう一つ。',
      line: '…withstanding a tremendous amount of pain. *Plus it’s always fun to see Tom faint.*',
      said: '痛みに耐える大切さを語ったあと、「それにトムの気絶も楽しい」と足す。',
      mean: '立派な教訓のあとに、ただの意地悪な楽しみ。plus で同じ重さに並べるのがおかしい。',
      trap: '「トムへの教訓」と取りやすいが、言葉は always fun。自分の楽しみ。',
      use: 'Plus, it’s on the way home.（それに、帰り道だしね）' },

    // R fix: V2 + S1 (blind 85 %): the stem said "Tom fainting", which is s2's key (and the clue a blind read uses).
    //   The stem now names the moment, and "tired of it by now" ("it's always…" as a complaint) replaces "worried".
    //   Trap rewritten
    // why: bad ← the earlier "I'm sorry, everybody" heard as Ron's regret; tired ← "it's always…" heard as the start
    //   of a complaint
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'faint', seg: [53.9, 58],
      stem: 'How does Ron feel about what happens to Tom?',
      choices: ['He enjoys it every time', 'He feels a bit bad about it', 'He is tired of it by now'], a: 0,
      cue: '最後の一文、「plus」のあと。',
      line: 'plus it’s *always fun* to see Tom faint.',
      said: '「それに、トムが気絶するのを見るのはいつも楽しい」と付け足す。',
      mean: 'always fun ＝ 毎回の楽しみ。悪びれず、同僚の気絶をおまけの楽しみにしている。',
      trap: '「It’s always…」は不満にもなるが、ここは fun。あとの形容詞まで聞く。',
      use: 'It’s always fun to see you guys.（みんなに会うのはいつも楽しい）' },

    // why: paint ← "repaint" from the opening, and f/p blur for Japanese ears; fight ← the same diphthong; fail ←
    //   "fai-" caught, the final t lost
    { id: 's2', skill: 'sound', level: 'B2', point: 'faint', seg: [53.9, 58],
      stem: 'Fill the gap: “Plus it’s always fun to see Tom ___.”',
      choices: ['faint', 'paint', 'fight', 'fail'], a: 0,
      cue: '最後の一文の、いちばん最後の語。',
      line: 'Plus it’s always fun to see Tom *faint*.',
      said: '「それに、トムが気絶するのを見るのは楽しい」。',
      mean: 'faint ＝ 気を失う。f は下くちびるに歯を当てる音。',
      trap: '冒頭の repaint が耳に残ると paint に聞こえやすい。f と p、語末の nt の響きに注意。',
      use: 'I almost fainted when I saw the bill.（請求書を見て気を失いかけた）' },
  ]
};
