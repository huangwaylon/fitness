// “Ron Swanson Tries Meditation | Parks and Recreation” (the official Parks and Recreation channel, Season 4): Chris
// takes Ron to a strip-mall meditation center for six hours; Ron stands there thinking of nothing, Chris takes it for
// mastery, Ron confesses he got nothing out of it, and Chris gives him the job for being flexible.
// Segments from the captions, words from whisper (2026-11-16). The captions garble 8 s ("decent sheep" for "chi"),
// 17–21 s (a Greek line they skip), 21–24 s ("when you're right" for "on your right"), 32 s ("sabai me" for "sit behind
// me"), 107 s ("should" for "showed") and 112 s ("hit back" for "head back"); no key rests on those words, and the
// lines trim them. Chris is named at 86.3 s ("Chris, wait"), Ron at 64.8, 82.6 and 108.4 s. Who says "Don't try so
// hard" the second time (79 s) and who asks "You want to head back?" (112 s) is untested; d4 and a1 don't name the
// speaker of the last line. d2 assumes Ron says "I'll stand" (35 s); his talking head ("I just stood there", 55 s)
// agrees.
// REVIEW 2026-11-16: pass 3, fix 19, drop 0, new 0; ear checks 1 (unchanged)
// EAR CHECK: 74.3 s nt2 — both sources have “that kind of a clear headspace”; is the “a” audible before “clear”?
import type { Clip } from '../types.ts';

export const ronMeditate: Clip = {
  id: 'ronmeditate', video: 'ActknnwERUs', title: 'Ron Swanson Tries Meditation', dur: 135, wpm: 163, band: 'mid',
  tags: ['職場', '友だち'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 55 %): "warning it will be hard" was a filler and the key alone echoed "doesn't look"; now a
    //   "lowering hopes" reading, which "best… surprisingly decent chi… serene quietude" refutes
    // why: apologizing ← "doesn't look like much" + "not ideal" heard as excuses; lowering hopes ← the same flaws heard
    //   as managing Ron's expectations before he sees the room
    { id: 'g2', skill: 'gist', level: 'B2', point: 'pitch', reveals: ['look', 'smells'], seg: [0, 39],
      stem: 'What is Chris mainly doing as he leads Ron into the center?',
      choices: ['Talking the place up in spite of its flaws', 'Apologizing for choosing such a poor place',
                'Lowering Ron’s hopes before they go inside'], a: 0,
      cue: '欠点を認めたあと、それぞれ何が続くか。',
      said: '見た目は大したことない、においも気になる、と言いつつ、中は静かで深いと勧める。',
      mean: '欠点を先に認めてから良さを語る、売り込みの話し方。',
      trap: '欠点だけを拾うと謝る話や期待を下げる話に聞こえる。best や but のあとの褒め言葉まで聞く。',
      use: 'Not much to look at, but it works.（見た目は地味だけど、ちゃんと使える）' },

    // R fix: V2 (blind 60 %): "busy" was a filler; now "doesn't look like" read as "doesn't look like a center". The
    //   stem no longer says "looks", which ruled out "small"
    // why: small ← "much" read as amount (size); odd ← "doesn't look like…" heard as "doesn't look like a center"
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'look', seg: [3.3, 8.45],
      stem: 'What does Chris first admit about the center?',
      choices: ['Plain; there’s nothing special to see', 'Small; there isn’t much room inside',
                'Odd; it doesn’t look like a center'], a: 0,
      cue: '「このあたりで一番」の直後、短い一文。',
      line: 'It *doesn’t look like much*.',
      said: '「見た目は大したことないけど」と先に言っている。',
      mean: '見た目がぱっとしない、の意味。中身は良いと続ける前置きによく使う。',
      trap: 'much を広さと取ると「狭い」、look like だけだと「〜らしくない」に聞こえる。ひとかたまりで聞く。',
      use: 'It doesn’t look like much, but it’s great.（見た目は地味だけど最高）' },

    // R fix: V2 (blind 50 %): "small room" was a filler; now the noise of the same restaurant (keyword trap), so the
    //   noun has to be heard
    // why: noise from the restaurant ← "restaurant next door" caught, "smells" lost; traffic ← "strip mall" +
    //   "quietude" suggest street noise
    { id: 'd1', skill: 'detail', level: 'B1', point: 'smells', seg: [8, 12.72],
      stem: 'Which drawback of the place does Chris admit?',
      choices: ['The smells from a restaurant next door', 'The noise from a restaurant next door',
                'The traffic around the strip mall'], a: 0,
      cue: 'although のあと、隣の店の話。',
      line: 'although *the smells from the Greek restaurant* next door are *not ideal*.',
      said: '隣のギリシャ料理店のにおいが「理想的ではない」と認めている。',
      mean: 'not ideal ＝「あまり良くない」の控えめな言い方。欠点をやわらかく認める。',
      trap: '隣の店と聞くと騒音を思い浮かべやすい。although のあとの最初の名詞を聞く。',
      use: 'The location is not ideal, but it’s cheap.（場所はいまいちだけど安い）' },

    // R fix: V2 (blind 60 %): the key was the only contrast ("instead of") and "wait outside" a filler; now the near
    //   sound "I'll start"
    // why: sits behind ← Chris has just said "sit behind me", so it's what was asked; start ← "I'll stand" heard as
    //   "I'll start" (final d/t)
    { id: 'd2', skill: 'detail', level: 'B1', point: 'stand', seg: [33.7, 37],
      stem: 'When Chris asks everyone to join breath, what does Ron say he’ll do?',
      choices: ['Stay on his feet', 'Sit behind Chris', 'Start on his own'], a: 0,
      cue: 'join breath のすぐあと、2語の返事。',
      line: 'let’s join breath. — *I’ll stand.*',
      said: '「一緒に呼吸を」と言われて、「私は立っている」と2語で返す。',
      mean: '座ってと言われたのに、立ったまま参加すると短く宣言している。',
      trap: '直前の「後ろに座って」につられやすい。stand と start は語尾が近いので、最後の音まで聞く。',
      use: 'Have a seat. — I’ll stand, thanks.（どうぞ座って —立ってます、どうも）' },

    // R fix: B1/N7: said（全部で）glosses p3's "all told", so it now reveals `alltold`
    // why: two hours ← a normal class length; sixteen ← -teen/-ty; sixty minutes ← "six" caught, the unit guessed
    { id: 'n1', skill: 'number', level: 'B1', point: 'hours', reveals: ['alltold'], seg: [48.4, 52.95],
      stem: 'How long does Ron say they were in there?',
      choices: ['About sixty minutes', 'About two hours', 'About six hours', 'About sixteen hours'], a: 2, keep: true,
      cue: '最初の一言のあと、数字と単位。',
      line: 'All told, we were in there *about six hours*.',
      said: '「全部で、だいたい6時間いた」とカメラに話す。',
      mean: '何もせずに6時間。この長さが、そのあとの話の重さになる。',
      trap: 'six と sixteen は語尾で分かれる。-teen は後ろが強く長い。単位の hours も聞く。',
      use: 'All in all, it took about three hours.（全部で3時間くらいかかった）' },

    // why: to be honest ← a talking head's usual opener; as I was told ← told read literally (言われた)
    { id: 'p3', skill: 'phrase', level: 'C1', point: 'alltold', reveals: ['hours'], seg: [48.4, 52.95],
      stem: 'How does Ron’s opening phrase in his comment to the camera work?',
      choices: ['It means “in total”', 'It means “to be honest”', 'It means “as I was told”'], a: 0,
      cue: '文の最初の2語。told の意味に注意。',
      line: '*All told*, we were in there about six hours.',
      said: '「全部で、だいたい6時間いた」と言っている。',
      mean: 'all told ＝ 合計で・全部ひっくるめて。時間や数を足し合わせるときの言い方。',
      trap: 'told を「言われた」と取りやすい。数字の前の all told は、合計を出す合図。',
      use: 'All told, the trip cost $500.（全部で旅行は500ドルかかった）' },

    // R fix: V2 (blind 50 %): the happy ending was the only full yes; now a conditional yes ("a trial run") too, which
    //   the unhedged "you've got the job" refutes
    // why: turns down ← "I got nothing out of that experience" and "if you're looking for someone…" sound like stepping
    //   away; trial run ← "My one reservation about you" heard as a yes with conditions
    { id: 'g1', skill: 'gist', level: 'B1', point: 'job', seg: [48.4, 111.6],
      stem: 'Where does the outing leave things between Chris and Ron?',
      choices: ['Chris gives Ron the job', 'Ron turns the job down', 'Chris gives Ron a trial run'], a: 0,
      cue: '最後に Ron の名前が呼ばれたあと。',
      line: 'Ron, *you’ve got the job*.',
      said: 'Ron が楽しめなかったと打ち明けたあと、Chris が「採用だ」と告げる。',
      mean: 'この外出は、Ron を同僚として見きわめる場だった。',
      trap: '身を引く話し方や reservation から、断りや条件付きに取りやすい。最後の一言に条件はない。',
      use: 'Congratulations, you’ve got the job!（おめでとう、採用です！）' },

    // R fix: V2 (blind 70 %) and S1: "Given Ron's comment to the camera" pointed straight at the misreading; the stem is
    //   neutral now and the choices differ only in sincerity and in whether Ron earned it
    // why: earned ← the praise taken at face value, the talking head ignored; ironic ← "radiated mindfulness" sounds
    //   too grand to be meant
    { id: 'i2', skill: 'infer', level: 'C1', point: 'praise', reveals: ['blank'], seg: [52.8, 67.75],
      stem: 'How should we take Chris’s praise of Ron?',
      choices: ['Sincere, but based on a misreading', 'Sincere, and fully earned by Ron',
                'Ironic; Chris knows Ron faked it'], a: 0,
      cue: 'カメラへの話と、そのあとのほめ言葉を比べて。',
      line: 'I was *not meditating*. … My mind was blank. … Ron, *you radiated mindfulness*.',
      said: 'Ron は「頭は空っぽ」とカメラに話し、Chris は「集中がにじみ出ていた」とほめる。',
      mean: 'カメラへの本音で場面が変わる。Chris は本気だが、中身は無。',
      trap: 'ほめ言葉だけ聞くと実力にも皮肉にも取れる。先にカメラへ「瞑想してない」と言っている。',
      use: 'You look so calm. What’s your secret?（落ち着いてるね。コツは？）' },

    // R fix: V2 (blind 55 %): "nuts" was the only vivid choice; the three are now plain stances of the same shape
    // why: envies ← they are calm and he isn't meditating, so admiration is possible; curious ← "I don't know what…
    //   they are doing" heard as a sincere question
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'crackpots', seg: [60.2, 64.75],
      stem: 'How does Ron feel about the other people at the center?',
      choices: ['He has no respect for them', 'He wishes he were like them', 'He’s curious what they do'], a: 0,
      cue: 'other のあと、人を呼ぶ一語。',
      line: 'I don’t know what the hell these other *crackpots* are doing.',
      said: '「ほかの変人たちが何をしてるのか知らん」と言い捨てる。',
      mean: 'crackpot ＝ 変わり者。the hell も加わり、見下した言い方。',
      trap: 'I don’t know what… を素直な疑問と取りやすい。人を指す語の色で気持ちを聞く。',
      use: 'Some crackpot called about aliens again.（また変な人が宇宙人の電話をしてきた）' },

    // R fix: V2 (blind 70 %) and §9.5: after "wasn't thinking", "at all" was the only idiomatic fill and "that's all"
    //   not grammatical; the gap now takes the negative too, so was/wasn't and at all/a lot both need the ear
    // why: was… a lot ← wasn't's t and n lost, and "at all" linked into "a-tall" ≈ "a lot"; wasn't… a lot ← the
    //   negative caught, the linking misheard
    { id: 's1', skill: 'sound', level: 'B2', point: 'blank', seg: [67.6, 71.8],
      stem: 'Fill the gap: “I ___.”',
      choices: ['was thinking a lot', 'wasn’t thinking at all', 'wasn’t thinking a lot'], a: 1,
      cue: 'I のすぐあとの短い音と、文の最後の2語。',
      line: 'What were you thinking about? — I *wasn’t thinking at all*.',
      said: '「何を考えていた？」に「何も」と返す。',
      mean: 'at all は「アタール」とつながる。',
      trap: 'wasn’t の t が消えると was、at all の t が弾むと a lot に聞こえる。否定と at all はセット。',
      use: 'I didn’t sleep at all last night.（昨夜はまったく寝られなかった）' },

    // R fix: V2 (blind 70 %): the key was the only choice that described a joke; "teases" is now a brag reading of
    //   "a ton of work for me", which is about his own trouble, not his skill
    // why: brags ← "it takes a ton of work for me… no matter how hard I try" heard as a boast; politeness ←
    //   "Incredible" as the Japanese 社交辞令
    { id: 'h1', skill: 'humor', level: 'C1', point: 'praise', reveals: ['blank'], seg: [67.6, 76.8],
      stem: 'What makes Chris’s reaction to Ron’s answer funny?',
      choices: ['He envies Ron for having nothing on his mind', 'He brags about his own skill while praising Ron',
                'He pretends to be impressed to be polite'], a: 0,
      cue: 'Incredible のあと、自分の話をする部分。',
      line: '*Incredible*. It takes *a ton of work for me*…',
      said: '「何も考えてなかった」と聞き、「すごい。自分は大変な努力がいる」と言う。',
      mean: 'ただの無を、修行の到達点と思い込み、本気でうらやんでいる。',
      trap: 'for me を自慢と取りやすいが「自分には大変」の意味。Incredible のあとの苦労話で本気と分かる。',
      use: 'How? That takes me forever.（どうやるの？私だと何時間もかかる）' },

    // R fix: N6: notes trimmed from 133 to ≤ 120 characters; the item itself passes (both sources agree)
    // C2 dict: a non-standard "a" that grammar would cut
    // anchor: 72.4–75.35 s "to get to that kind of a clear headspace" (both sources), four unstressed words before
    //   "clear"
    { id: 'nt2', skill: 'dict', level: 'C2', point: 'kindofa', seg: [72.4, 75.35],
      stem: 'Type what he says: “to get to ___ clear headspace” (4 words)', answer: 'that kind of a',
      cue: 'get to のあと、clear の前まで。弱い語も全部。',
      line: 'It takes a ton of work for me to get to *that kind of a* clear headspace',
      said: '「あれほど澄んだ頭になるには努力がいる」。that kind of a は「ザッカインダ」と一続き。',
      mean: 'kind of のあとの a は話し言葉でよくある形。',
      trap: '習った形に合わせて a を消したくなる。正しい文でなく、聞こえた音を書く。',
      use: 'I need that kind of a break.（ああいう休みが必要だ）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'nomatter', seg: [74.3, 76.8],
      stem: 'Type the end of his sentence: “___.” (6 words)', answer: 'no matter how hard i try',
      cue: 'headspace のあと、文の終わりまで。',
      line: '…clear headspace, *no matter how hard I try*.',
      said: '「どんなに頑張っても（なかなか行けない）」と付け足す。',
      mean: 'どんなに〜しても、の意味。how hard I try がつながって速い。',
      trap: 'matter の t が「ラ」に近く、別の語に聞こえやすい。ひとかたまりで覚える。',
      use: 'No matter how hard I try, I’m late.（どんなに頑張っても遅刻する）' },

    // R fix: V2 (blind 75 %): "in a noisy mall" was a filler; now "Ron… your… method… right here" heard as a test for
    //   Ron, which "I'm going to try" refutes
    // why: quit ← "don't try so hard" heard as "give it up"; asks Ron ← "Ron… your not-trying method… right here,
    //   right now" caught without the subject "I'm going to"
    { id: 'h2', skill: 'humor', level: 'C1', point: 'nottry', seg: [76.6, 86.25],
      stem: 'Why is Chris’s plan at the end of this exchange funny?',
      choices: ['He sets out to try hard at not trying', 'He takes the advice as a cue to give up',
                'He asks Ron to show his method right now'], a: 0,
      cue: 'I’m going to のあと、何をすると言うか。',
      line: 'I’m going to *try* your *not-trying method* right here, right now.',
      said: '「頑張りすぎるな」に、「頑張らない方法を今ここで試す」と言う。',
      mean: '頑張らないことを頑張る矛盾。助言を逆のやり方で始めている。',
      trap: 'try so hard だけだと「やめろ」に聞こえる。I’m going to の主語から、試すのは Chris 本人。',
      use: 'Don’t try so hard. Just relax.（頑張りすぎないで。気楽にね）' },

    // R fix: V2 (blind 55 %): "say sorry" was weak; now a literal reading of "come… clean" (get out cleanly), which the
    //   confession that follows refutes
    // why: clear his mind ← "clean" heard as the "clear headspace" just praised; back out ← "come clean" read as
    //   "get out of it cleanly"
    { id: 'p2', skill: 'phrase', level: 'B2', point: 'clean', seg: [86, 91.85],
      stem: 'When Ron stops Chris, what does he say he should do?',
      choices: ['Tell Chris the truth', 'Clear his own mind first', 'Back out of it cleanly'], a: 0,
      cue: 'should のあとの2語。clean の意味に注意。',
      line: 'so I should *come clean*.',
      said: 'Chris を止めて「正直に言っておくべきだ」と前置きする。',
      mean: '隠していたことを打ち明ける、の意味。言いにくい本音の前置き。',
      trap: 'clean を「きれい」と取ると、頭の整理や手を引く話に聞こえる。come clean は打ち明けの前置き。',
      use: 'I have to come clean about something.（打ち明けなきゃいけないことがある）' },

    // R fix: V2 (blind 50 %): "harmful" was too strong to tempt; now "important" taken as Ron's own view
    // why: useful but not for him ← "important to you" heard as respect for meditation itself; important to him ←
    //   "important" caught, "to you" lost
    { id: 'i1', skill: 'infer', level: 'B2', point: 'crap', seg: [86, 94.55],
      stem: 'From how Ron starts his confession, what does he think of meditation?',
      choices: ['It’s nonsense, but Chris cares about it', 'It’s useful, but just not for someone like him',
                'It’s important, and he wants to improve at it'], a: 0,
      cue: 'important to you の前、meditation を何と呼ぶか。',
      line: 'I know *this crap* is *important to you*',
      said: '「このくだらないものが、あんたには大事なのは分かってる」と切り出す。',
      mean: 'crap ＝ くだらないもの。価値は認めないが、相手の気持ちには気をつかう。',
      trap: 'important だけ拾うと Ron も認めているように聞こえる。to you に注意。',
      use: 'I know this matters to you, so…（君には大事なのは分かってる、だから…）' },

    // why: honesty ← he confessed just before, and Chris's next line answers it; mastery ← "you radiated
    //   mindfulness" earlier
    { id: 'g3', skill: 'gist', level: 'B2', point: 'flex', reveals: ['job'], seg: [86, 111.6],
      stem: 'In the end, what wins Chris over?',
      choices: ['Ron went along with something he had no interest in', 'Ron was honest that he got nothing from it',
                'Ron turned out to be a natural at meditating'], a: 0,
      cue: '「一つだけ気がかりだった」のあと。',
      line: 'My one reservation… you seemed *inflexible*. … merely by *agreeing to an activity you’re not interested in*…',
      said: '唯一の心配は頑固さだったが、興味のない事に付き合って頭のやわらかさを示した、と言う。',
      mean: '楽しめたかどうかは関係なく、付き合ったこと自体が評価された。',
      trap: '打ち明け話の直後なので、正直さが理由に聞こえやすい。merely by のあとが理由。',
      use: 'Thanks for coming along anyway.（それでも付き合ってくれてありがとう）' },

    // C2 what's withheld
    // R fix: K1: "another partner" could mean a work partner, i.e. the key; it's now a meditation buddy
    // why: another try ← the Japanese 遠慮 frame: a modest confession read as asking for a second chance; meditation
    //   buddy ← "someone who enjoys meditation" heard as a companion for the sessions
    // anchor: 94.6–96.6 s the sentence breaks off after "someone who enjoys meditation"; 99.0–103 s Chris's reply
    //   ("my one reservation about you as a co-worker") shows what was at stake
    { id: 'nt1', skill: 'attitude', level: 'C2', point: 'withdraw', seg: [87, 103.25],
      stem: 'When Ron trails off after “someone who enjoys meditation”, what goes unsaid?',
      choices: ['That Chris should pick another coworker', 'That he would like one more try at it',
                'That Chris should find a meditation buddy'], a: 0,
      cue: '途中で切れた文と、Chris の返事が何の話か。',
      line: 'So if you’re looking for *someone who enjoys meditation*— … My one reservation about you *as a co-worker*…',
      said: '「楽しめる人を探しているなら…」で止まり、Chris は同僚としての評価で答える。',
      mean: '「それは自分じゃない、ほかの人を」が省かれ、言わずに身を引いている。',
      trap: '控えめな告白を、もう一度の頼みと取りやすい。止まった文は、相手の返事から補う。',
      use: 'If you need someone who loves mornings…（朝型の人が必要なら…）' },

    // R fix: V2 (blind 60 %): "scolds" was a filler; the trap's own frame (期待してなかった = let down) is now a choice.
    //   The segment runs on through "my one reservation… inflexible" (103.2 s), which refutes "let down"
    // why: let down ← the Japanese frame: 期待してなかった = disappointed; mistake ← "didn't expect" heard as Chris
    //   regretting the trip
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'waveoff', reveals: ['expect'], seg: [96.55, 103.25],
      stem: 'How does Chris’s first reply to Ron’s confession work?',
      choices: ['It waves the problem away', 'It shows Chris is let down', 'It admits the trip was a mistake'], a: 0,
      cue: '文頭の Oh と、そのあとの動詞の形。',
      line: 'Oh, I *didn’t expect you to enjoy it*.',
      said: '打ち明けを聞いて「楽しむとは思っていなかったよ」とすぐ返す。',
      mean: '「最初から期待していない＝問題ない」と、相手の心配を軽く打ち消している。',
      trap: '日本語の「期待してなかった」はがっかりに聞こえる。Oh の軽さと、すぐ続く話から気持ちを取る。',
      use: 'Oh, I didn’t expect you to like it.（あ、気に入るとは思ってなかったよ）' },

    // R fix: V2 (blind 55 %) and §9.5: "didn't accept you to enjoy it" isn't English, and with it the key was the
    //   choice sharing most with the others; cut to 3 grammatical choices
    // why: did expect ← n't's t drops, "didn't" shrinks; don't ← the vowel heard, the tense lost
    { id: 's2', skill: 'sound', level: 'B2', point: 'expect', seg: [96.55, 99.55],
      stem: 'Fill the gap: “Oh, I ___ you to enjoy it.”',
      choices: ['did expect', 'didn’t expect', 'don’t expect'], a: 1,
      cue: 'Oh, I のあと、短くつまる音。',
      line: 'Oh, I *didn’t expect* you to enjoy it.',
      said: '「楽しむとは思っていなかったよ」と言っている。',
      mean: 'didn’t の t はほぼ消え、「ディドン」のように短い。you to enjoy とつながる。',
      trap: 'n’t の t が消えても「ン」は残る。did だけに聞こえたら、意味が通るかで確かめる。',
      use: 'I didn’t expect to see you here!（ここで会うとは思わなかった！）' },

    // R fix: V2 (blind 60 %) and N7: "meat" made the key a Ron cliché, and "the new job" gave away g1's key; both
    //   gone, all three are now places
    // why: one more session ← going back heard as going back in; strip mall ← "next door" heard as a look around
    //   the mall they're in
    { id: 'd4', skill: 'detail', level: 'B1', point: 'meat', seg: [111.3, 123.4],
      stem: 'At the very end, what is the plan before going back?',
      choices: ['A stop at the restaurant next door', 'One more session in the quiet room',
                'A quick look around the strip mall'], a: 0,
      cue: 'But first のあと。',
      line: 'But first, there’s a *hot, spinning cone of meat* in that Greek restaurant next door.',
      said: '「でも先に、隣の店に熱くて回ってる肉の塊がある」と言う。',
      mean: 'But first ＝ その前にまず。帰る前の寄り道を出している。',
      trap: '「戻る」を「また中へ」と取りやすい。But first のあとが、先にやること。',
      use: 'Sure, but first, coffee.（いいよ、でもまずコーヒー）' },

    // R fix: V2 (blind 75 %): "put off by the smell" was weak; now "I don't know what it is" as curiosity, a
    //   keyword trap the "but" settles
    // why: curious ← "I don't know what it is" heard as the point; unsure ← the same words heard as doubt
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'meat', seg: [114.3, 123.4],
      stem: 'How does the speaker feel about the spinning cone of meat?',
      choices: ['Eager to eat all of it', 'Curious to learn what it is', 'Unsure if it’s safe to eat'], a: 0,
      cue: 'I don’t know のあと、but で何が続くか。',
      line: 'I don’t know what it is, *but I’d like to eat the whole thing*.',
      said: '「何なのか分からないが、丸ごと食べたい」と言う。',
      mean: '正体が分からなくても食べたい強い食欲。the whole thing で大げさに。',
      trap: 'I don’t know what it is を不安や興味と取りやすい。but のあとに本音が来る。',
      use: 'No idea what that is. I want it.（何か知らないけど欲しい）' },
  ]
};
