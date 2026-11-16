// “Parks and Recreation | Meet Bobby Newport (Episode Highlight)” (the official Parks and Recreation channel, Season 4):
// Bobby Newport, heir to a candy fortune, opens his council campaign with jokes and free candy bars; Leslie tells the
// camera his charm doesn't matter, then introduces herself as his opponent, and Bobby, who thought he was running
// unopposed, cheerfully misses the point and hands out more bars.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 97 s (music after). Names said: Bobby
// (3.5, 14.4 s), Leslie (57.7 s, she names herself; 64.3–66.5 s). The man with Leslie is never named, so stems say
// "Leslie's side". The talking head (30–52 s) is in Leslie's voice ("I am a lifelong government bureaucrat"). Untested on
// purpose: 5–13 s (crowd greetings), "why don't we line up for autographs" (26 s: whisper "why don't we", captions "why
// do we"), "My dad made them" (34.4 s: captions "maybe"; 90.6 s garbled in both), the names Bobby gets wrong at 61 s
// ("Miss Lope or just Nesney" / "miss low pour just Nizhny"), and "Okie-dokie" (58.7 s: captions "Oh joke").
// EAR CHECK: 95 s nt2 — whisper "I think we scared him", captions "I think you scared him" (the key holds either way;
//   the line uses "we")
// REVIEW 2026-11-17: pass 3, fix 18, drop 0, new 0; ear checks 1 (unchanged)
// Open: a second blind read (fresh subagent, no keys) still picked nt2 (75 %), g2, h1, a2 (70 %), mostly from show
//   knowledge (Bobby the oblivious Sweetums heir); its d3/i3 hits came from other items' cues, now removed. nt2 is past its one C2 rewrite: if the phone read finds it too
//   obvious, retire it with nt1 (a bank holds 0 or 2+ C2) or write a new C2.
import type { Clip } from '../types.ts';

export const bobbyMeet: Clip = {
  id: 'bobbymeet', video: 'XCvC8pUI4ZA', title: 'Parks and Recreation | Meet Bobby Newport (Episode Highlight)',
  dur: 107, wpm: 165, band: 'mid', tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2, blind 65 %: the key was the only light, candy-flavoured choice. Now every choice has candy or a boast.
    // why: candy jobs ← "Bobby bars" plus the usual campaign promise, and "employs half the town" comes soon after;
    //   bragging ← "it's going great" heard as a report of numbers (the 70-point lead comes later, from Leslie)
    { id: 'g1', skill: 'gist', level: 'B1', point: 'speech', seg: [12.4, 30.4],
      stem: 'What is Bobby mostly doing in his opening words to the crowd?',
      choices: ['Joking around and handing out free candy', 'Promising new candy-factory jobs for the town',
                'Bragging about his big lead in the polls'], a: 0,
      cue: 'あいさつのあと、話の中身と最後の誘い。',
      said: '「選挙戦2日目、絶好調」と言い、だじゃれを一つ言って、サインと無料のお菓子に誘う。',
      mean: '政策の話は一つもない。明るい雰囲気づくりと人気取りだけの演説。',
      trap: '「選挙」と聞くと政策演説を想像しやすい。中身のある文が来るかを聞く。',
      use: 'So far, so good.（今のところ順調）' },

    // why: ten days ← "two" and "ten" both start with t, unstressed before "days"; two weeks ← the number caught, the
    //   unit lost
    { id: 'n1', skill: 'number', level: 'B1', point: 'days', seg: [14.9, 19.0],
      stem: 'How far into the campaign are they, according to Bobby?',
      choices: ['Two days', 'Ten days', 'Two weeks'], a: 0, keep: true,
      cue: 'we’re のあと、数字と単位。',
      line: 'we’re *two days* into this campaign, and so far it’s going great.',
      said: '「選挙戦は始まって2日、今のところ順調」と話す。',
      mean: 'two days into 〜 ＝ 〜が始まって2日。まだ始まったばかりなのに、もう余裕の口ぶり。',
      trap: '数字だけ聞いて単位を落としやすい。数字のすぐあとの days / weeks まで聞く。',
      use: 'We’re three days into the trip.（旅行は3日目です）' },

    // R fix: V2, blind 50 %: the key was the only wordplay that named both halves. Now a second "pain" reading (right
    //   mechanism, wrong direction) and a fuller champagne pun compete with it. Segment end 24.0 → 24.3, so
    //   "pleasure" isn't clipped.
    // why: has hurt ← "I don't know why they call it a campaign" heard as a complaint, the "pain" taken at face value;
    //   champagne ← campaign/champagne are near sounds, and he's in a party mood
    { id: 'h1', skill: 'humor', level: 'C1', point: 'camp', seg: [18.4, 24.3],
      stem: 'What is the joke in Bobby’s “I don’t know why they call it…” line?',
      choices: ['He hears “pain” in the word and swaps in “pleasure”', 'He hears “pain” in the word and says it has hurt',
                'He swaps the word for “champagne”, as in a party'], a: 0,
      cue: 'because のあと、後半の音が何に変わるか。',
      line: 'I don’t know why they call it a campaign. Because up until now, it’s been a *camp pleasure*.',
      said: '「campaign と呼ぶのは変だ。ずっと camp pleasure なのに」と言う。',
      mean: '後半を pain（痛み）と聞き、pleasure（楽しみ）に替えた言葉遊び。',
      trap: '前半だけで不満と取りやすい。because のあとにオチが来る。',
      use: 'Honestly, it’s been a breeze.（正直、楽勝だった）' },

    // R fix: V2, blind 85 %: only the key said "son" (family money). All three are now his family's candy business.
    // why: runs it ← "candy fortune" heard without "heir to", as a business he already runs; the ads ← heir = air
    //   (on air), and "Bobby bars" with his name on them (27 s) make him sound like the brand's face
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'heir', seg: [29.9, 34.8],
      stem: 'How does Leslie introduce Bobby to the camera?',
      choices: ['As the son set to inherit a candy fortune', 'As the son who runs the family candy firm',
                'As the son who stars in his family’s candy ads'], a: 0,
      cue: '名前のすぐあと、the の前の短い2語。',
      line: 'Bobby Newport, *heir to* the Sweetums candy fortune.',
      said: '「お菓子会社の財産の相続人、ボビー」とカメラに紹介する。',
      mean: 'heir to 〜 ＝ 〜を受け継ぐ人。自分で築いた財産ではない、という含み。',
      trap: 'heir は air と同じ音で、聞き逃しやすい。fortune の前の to を手がかりに。',
      use: 'She’s heir to the family business.（彼女は家業の跡継ぎだ）' },

    // why: 17 ← -ty/-teen: "seventy" with its flapped t heard as "seventeen"; 7 ← the "-ty" swallowed before "points"
    { id: 'n2', skill: 'number', level: 'B1', point: 'polls', seg: [34.3, 39.2],
      stem: 'How far ahead in the polls is Bobby?',
      choices: ['7 points', '17 points', '70 points'], a: 2, keep: true,
      cue: 'already のあと、数字の終わりの音。',
      line: 'he’s already *70 points* up in all of the polls.',
      said: '「出馬したばかりで、もう70ポイントのリード」と言う。',
      mean: 'points up ＝ 差をつけてリード。already で勢いを強調。',
      trap: 'seventy の t は弾んで -teen と混ざりやすい。-ty は前が強く、-teen は後ろが強い。',
      use: 'We’re ten points up.（10点リードしてる）' },

    // R fix: V2, blind 70 % (mostly the show's own backstory). The weak "friends with" is now a near sound: employs ≈
    //   enjoys.
    // why: own the land ← "family… half the town" heard as a rich family's property; liked by ← "employs" heard as
    //   "enjoys", after "attractive and charming"
    { id: 'd2', skill: 'detail', level: 'B1', point: 'employs', seg: [38.7, 43.8],
      stem: 'What does Leslie say about Bobby’s family?',
      choices: ['They give jobs to half the town', 'They own half the land in town', 'They are well liked by half the town'],
      a: 0,
      cue: 'his family のあとの動詞。',
      line: 'his family *employs half the town*',
      said: '「彼の家の会社が、町の半分の人を雇っている」と言う。',
      mean: 'employ ＝ 雇う。町の多くの人が彼の家の会社で働いていて、選挙でも強い。',
      trap: 'half the town だけ聞くと土地や人気の話に思える。直前の動詞で関係が決まる。',
      use: 'The factory employs most of the town.（町の大半があの工場で働いている）' },

    // R fix: V2, blind 60 %: "brushes aside" stood alone against two weak readings. Now three parallel stances on the
    //   strengths ("waves off / grants / doubts").
    // why: grants them ← listing a rival's strengths is how people admit a threat, and his lead is huge; only an act ←
    //   "charming" heard as a hint that the charm is fake
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'sowhat', seg: [38.8, 44.9],
      stem: 'How does Leslie treat the strengths she lists for Bobby?',
      choices: ['She waves them off: they don’t matter', 'She grants them: he’s hard to beat',
                'She doubts them: they’re only an act'], a: 0,
      cue: 'リストの最後の、短い問いかけ。',
      line: 'He is attractive and charming… *but so what?*',
      said: '「彼は魅力的で感じもいい。家の会社も大きい。でも、だから何？」と言う。',
      mean: 'so what? ＝ それがどうした。並べた強みを、まとめて「関係ない」と切り捨てる。',
      trap: 'ライバルの長所を並べると弱気に聞こえやすい。but のあとが本人の立場。',
      use: 'It’s raining. So what? Let’s go.（雨？だから何、行こう）' },

    // R fix: V2, blind 70 %: the key was the only strong self-claim. All three are now claims Leslie could make.
    // why: talks beautifully ← verse = 詩, a literal reading of "versed"; cared all her life ← "lifelong" carried over
    //   to the issues
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'versed', seg: [43.9, 48.1],
      stem: 'What does Leslie claim about herself and the issues?',
      choices: ['She knows them inside and out', 'She can talk about them beautifully',
                'She has cared about them all her life'], a: 0,
      cue: 'bureaucrat のあと、in the issues の前。',
      line: 'a lifelong government bureaucrat who’s *well-versed in* the issues',
      said: '「私は生涯役所勤めで、政策の問題に精通している」と話す。',
      mean: 'well-versed in 〜 ＝ 〜に詳しい。自分の強みは知識だと言っている。',
      trap: 'verse（詩）から「話がうまい」と取りやすい。well-versed in は知識の深さ。',
      use: 'She’s well-versed in local history.（彼女は地元の歴史に詳しい）' },

    // R fix: V2, blind 60 %: the key ("thinks her résumé is what voters crave") was the only choice that explained a
    //   mechanism. All three now say how the line works.
    // why: Bobby ← she has just listed his looks and charm and said "so what?", so the punchline sounds aimed at him;
    //   the voters ← "win elections" heard as a jab at people who vote for a pretty face
    // anchor: 44.4–51.8 s "I am a lifelong government bureaucrat… and those are the kind of sexy qualifications that
    //   win elections": "I" and "those" point at her own résumé, and she grants Bobby's strengths (39.8 s) without a jab
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'sexy', reveals: ['versed'], seg: [43.9, 52.4],
      stem: 'In Leslie’s comment to the camera, who is the joke on?',
      choices: ['Leslie: she pitches her desk-job résumé as thrilling', 'Bobby: she hints that charm is all he has',
                'The voters: she hints they just want a pretty face'], a: 0,
      cue: 'those が指すものと、sexy という語の組み合わせ。',
      line: 'I am a lifelong government bureaucrat… and those are the kind of *sexy qualifications* that win elections.',
      said: '「生涯役所勤めで政策に詳しい。こういう色気のある経歴が選挙に勝つ」と大まじめに言う。',
      mean: 'ふつう sexy と呼ばない地味な経歴を、本人は本気でそう呼ぶ。笑いの的は話し手の思い込み。',
      trap: '直前に相手の長所が並ぶので、相手への皮肉と聞きやすい。主語の I と those が誰の話かを追う。',
      use: 'Paperwork is my idea of a fun night.（書類仕事こそ楽しい夜）' },

    // R fix: V2, blind 60 %: "met Leslie before" was weak. It's now the sincerity flip: a joke that nobody knows him.
    // why: sorry ← the Japanese frame: "you probably knew that" as 恐縮, apologizing for repeating his name; nobody
    //   knows him ← the light, laughing delivery heard as self-mockery, the meaning flipped
    { id: 'i1', skill: 'infer', level: 'B2', point: 'knew', seg: [51.9, 55.6],
      stem: 'What does Bobby’s add-on after his name suggest about him?',
      choices: ['He assumes that everyone knows him', 'He’s sorry for giving his name twice',
                'He’s joking that nobody knows him'], a: 0,
      cue: '名前を言ったあとの、付け足しの一文。',
      line: 'I’m Bobby Newport. … you *probably knew that already*.',
      said: '「ボビー・ニューポートです。まあ、もうご存じでしょうけど」と言う。',
      mean: '有名だと自分で思っている一言。悪気はなく、当たり前のように言う。',
      trap: '日本語の「ご存じかと思いますが」は謙遜にもなるが、ここは自分の知名度が前提。',
      use: 'You’ve probably heard this one before.（たぶん聞いたことある話だけど）' },

    // R fix: V2, blind 70 %: "what has the meeting achieved?" cued "very little". The stem now asks how it turns out,
    //   and all three choices are things Bobby does. It now also reveals 'bar' (its said: he hands out a bar and moves
    //   on, pr1's key).
    // why: meet again ← "set up a debate" (70 s) and his cheerful "I love meeting people" heard as a yes; hides a threat ← "I love it"
    //   said twice heard as covering a shock
    { id: 'g2', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['terrific', 'bar'], seg: [52.0, 97.0],
      stem: 'How does Leslie’s first meeting with Bobby turn out?',
      choices: ['He never really takes in who she is', 'He agrees to meet again, to be polite',
                'He sees her as a threat but hides it'], a: 0,
      cue: 'ボビーの最後の質問と、それへの返事。',
      said: 'レスリー側が説明しても、ボビーは笑顔のまま、お菓子を配って次へ行く。',
      mean: '肝心の話は何も伝わらずに終わる。相手にされていないのが結末。',
      trap: '明るい返事で、話がまとまったように聞こえやすい。最後の質問で、何も聞いていなかったと分かる。',
      use: 'Well, that went nowhere.（まあ、何も進まなかったね）' },

    // R fix: V2, blind 70 %: "waiting to face him" was the only choice with a feeling in it. Each choice now gives a
    //   feeling about the meeting.
    // why: last meeting ← "last" read literally as 最後; old friends ← the "we meet again" greeting, said to someone known
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'atlast', seg: [55.2, 58.5],
      stem: 'What does Leslie’s greeting suggest about this meeting?',
      choices: ['She has wanted it for a long time', 'She hopes it will be their last one',
                'She’s glad to see an old face again'], a: 0,
      cue: 'Mr. Newport のあと、文の終わりの2語。',
      line: 'Well, Mr. Newport, we meet *at last*.',
      said: '「ニューポートさん、ついにお会いしましたね」と名乗る。',
      mean: 'at last ＝ ついに。映画の宿敵どうしのような大げさなあいさつで、対決の気分を出している。',
      trap: 'last を「最後」と取りやすい。at last は「やっと」で、待っていた気持ち。',
      use: 'At last, the weekend!（やっと週末だ！）' },

    // R fix: V2, blind 65 %: "like a fan" made the key the only joke. Now a second fan reading (a photo) and a
    //   candidate's petition compete with it.
    // why: a photo ← the same fan frame, the object lost; her petition ← "sign" said to a candidate, heard as signing
    //   for her campaign
    { id: 'i2', skill: 'infer', level: 'B2', point: 'sign', seg: [59.4, 64.2],
      stem: 'What does Bobby assume Leslie wants from him?',
      choices: ['His autograph, like a fan', 'A photo with him, like a fan', 'His name on her campaign petition'], a: 0,
      cue: 'sign のあと、どう書くかを聞いている所。',
      line: 'So, do you want me to *sign* … to Miss …?',
      said: '名乗ったばかりのレスリーに「宛名は Miss 〜にする？」と聞く。',
      mean: '「サインに並んで」と言っていた流れで、ファンだと決めてかかっている。',
      trap: 'sign は書類の署名にも使うが、to 〜（〜さんへ）と宛名を聞くのはサインの型。',
      use: 'Could you sign it to Emma?（エマさんへ、とサインしてもらえますか）' },

    // R fix: V2, blind 70 %: the key was the bank's recurring "debate" (g2 and i2 choices). Those are gone, and the
    //   distractors are now all "setting up" something.
    // why: a meeting ← "calling your office" heard as where they want to meet; an interview ← "candidate for city
    //   council" plus "set up" heard as press
    { id: 'd3', skill: 'detail', level: 'B1', point: 'debate', seg: [65.5, 72.6],
      stem: 'What has Leslie’s side been calling Bobby’s office about?',
      choices: ['Setting up a debate with him', 'Setting up a meeting at his office', 'Setting up an interview with him'],
      a: 0,
      cue: 'calling your office のあと、何をしたかったか。',
      line: 'I’ve been calling your office… to *set up a debate*.',
      said: '「レスリーは市議会の候補者です。討論会を開こうと、そちらの事務所に何度も電話しています」と言う。',
      mean: '二人は同じ選挙の候補者で、討論会を申し込んでいる、という説明。',
      trap: 'office が聞こえると会う場所の話に思える。to のあとが目的。',
      use: 'I’ve been trying to set up a meeting.（打ち合わせを入れようとしてたんだ）' },

    // R fix: V2, blind 70 %: "teasing them" was weak. It's now "certain he has already won", which the closing
    //   "right?" (a check, not a boast) refutes.
    // why: scare her off ← "you guys are wrong" heard as a power move between rivals; already won ← "running
    //   unopposed" heard as a confident claim, the asking "right?" lost
    { id: 'i3', skill: 'infer', level: 'C1', point: 'unopposed', seg: [70.9, 76.0],
      stem: 'What does Bobby’s reply about the race show?',
      choices: ['He had no idea he had a rival', 'He’s certain he has already won', 'He is trying to scare Leslie off'],
      a: 0,
      cue: 'pretty sure と、文末の right?。',
      line: 'I’m running unopposed. *I’m pretty sure* I’m running unopposed, *right?*',
      said: '「対立候補はいないよ。…いないよね？」と周りに確かめる。',
      mean: '本気で知らなかった。言いながら自信が崩れていく。',
      trap: '相手を否定する出だしで、強気のけん制と取りやすい。文末の right? は確認を求める合図。',
      use: 'I’m pretty sure it’s this way, right?（たぶんこっちだよね？）' },

    // R fix: V2, blind 55 %: the key was the only choice about his word. Now two choices are threats, and the key is
    //   the one that comes from his own word ("odd threat" vs "overly polite threat"). It now reveals 'unopposed': its
    //   stem quote gives i3's key away (second blind pass).
    // why: a slip ← "unopposed" then "opposed" heard as a word mixed up by mistake; an over-polite threat ← her formal
    //   "Mr. Newport… we meet at last" manner carried over
    { id: 'h2', skill: 'humor', level: 'C1', point: 'opposed', reveals: ['unopposed'], seg: [75.6, 80.4],
      stem: 'Why does Leslie’s answer to “I’m running unopposed” get a laugh?',
      choices: ['She bends his own word into an odd threat', 'She mixes up two words that sound alike',
                'She threatens him in an overly polite way'], a: 0,
      cue: 'not running のあと、同じ語の形の変化。',
      line: 'No, you’re not running *unopposed*. You’re *very opposed by me*.',
      said: '「対立候補なしではありません。私がとても対立しています」と言う。',
      mean: 'unopposed を裏返して very をつけた、ぎこちない言い方。決めぜりふのつもりが少しずれる。',
      trap: '似た語が続くので言い違いに聞こえやすい。わざと相手の語を拾って返している。',
      use: 'Not so fast. You’ve got competition.（ちょっと待って。ライバルがいるよ）' },

    // R fix: V2, blind 75 %: "cheerfully" was the only positive reading. Now a second positive reading competes with
    //   it ("sportingly, glad of a fair fight"), which his "I love meeting people" refutes: he's talking about people,
    //   not the race.
    // why: sporting ← "terrific" heard as welcoming a rival; nervous ← "I love it" said twice heard as covering a shock
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'terrific', reveals: ['unopposed'], seg: [78.1, 84.1],
      stem: 'How does Bobby take the news that Leslie is running against him?',
      choices: ['Cheerfully, as if it’s no threat', 'Sportingly, glad of a fair fight',
                'Nervously, while trying to sound calm'], a: 0,
      cue: 'terrific のあと、続けて言う2つの文。',
      line: 'Oh, terrific. *I love meeting people*. I love it.',
      said: '「へえ、すごい。人に会うのが大好きなんだ」と答える。',
      mean: '対立候補と聞いても、新しい知り合いができた程度に受け取っている。危機感がまったくない。',
      trap: 'terrific を「受けて立つ」の意味と取りやすい。続く文は人に会う話で、選挙の話は出てこない。',
      use: 'Great, the more the merrier!（いいね、多いほど楽しい）' },

    // R fix: K5/§9.5: "Where do you guys do?" isn't grammatical. It's now "What would you", a real option with the
    //   same "wha-… you" shape.
    // why: did ← the weak "do" heard as past, and "what did you guys do" also fits right after their explanation;
    //   would ← "do you" and "would you" both shrink to a quick "-dju"
    { id: 's1', skill: 'sound', level: 'B2', point: 'whatdo', seg: [82.6, 85.95],
      stem: 'Fill the gap: “___ guys do?”',
      choices: ['What do you', 'What did you', 'What would you'], a: 0,
      cue: '文の最初、短くつながる3語。',
      line: '*What do you* guys do?',
      said: '「で、君たちは何をしてる人？」と聞く。what do you が「ワダユ」とつながる。',
      mean: '職業を聞く決まった形。直前に聞いた話をもう忘れている。',
      trap: 'do は弱く、did と区別しにくい。What do you do? の型ごと覚える。',
      use: 'So, what do you do?（で、お仕事は？）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'told', seg: [85.4, 89.0],
      stem: 'Type the reply: “We ___.” (3 words)', answer: 'just told you',
      cue: '質問のすぐあと。We のあとの3語。',
      line: 'We *just told you*.',
      said: '「今言ったでしょ」と返す。just told you がひと続きに速く言われる。',
      mean: '直前の説明を聞いていなかった相手への、あきれた返事。',
      trap: 'just の t と told の t が重なり、一つに聞こえやすい。語の数を手がかりに。',
      use: 'Like I just told you, it’s full.（さっき言ったとおり、満席です）' },

    // R fix: V2, blind 55 %: "asks for votes" was weak. It's now "welcomes them as supporters" ("Great" heard as
    //   approval), and the key no longer spells out "so he can move on".
    // why: making up ← the candy heard as a small apology (お詫びのしるし), the Japanese frame; supporters ← "Great"
    //   right after "running for city council" heard as approval of them
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'bar', seg: [87.5, 93.3],
      stem: 'When Bobby answers their second explanation, what does his reply do?',
      choices: ['It ends the talk with a gift and moves on', 'It makes up for not listening the first time',
                'It welcomes them both as new supporters'], a: 0,
      cue: 'Great のあと、手渡しと最後の呼びかけ。',
      line: 'Great. Here, *have a Bobby bar*. … Okay, folks.',
      said: '「いいね。はい、ボビー・バーどうぞ」と渡し、「さあ皆さん」と次へ移る。',
      mean: '話を聞かないまま、お菓子を配って会話を切り上げる。誰にでも同じ対応。',
      trap: '物を渡すのをお詫びのしるしと取りやすい。すぐ Okay, folks と次の人へ向かうのを聞く。',
      use: 'Here, have one. Okay, who’s next?（はい、どうぞ。次の方は？）' },

    // R fix: V2 + the C2 rewrite, blind 80 %: the two sincere readings made "dry joke" the obvious sitcom pick. Now two
    //   ironic readings (the right mechanism, one with the wrong target) plus one sincere reading. It now also reveals
    //   'bar' (its line and notes give pr1's move-on).
    // why: they were rattled ← irony aimed back at the speakers, plausible after Leslie's big "very opposed by me";
    //   dodging them ← the sincere reading: he turns to new people right after the debate talk
    // anchor: 92.3–97.0 s just before, Bobby greets the next people with the same "Hey, I'm Bobby Newport" (as at 13.9
    //   and 53.4 s), and just after, he offers the same bar ("Here, have a Bobby bar", 95.5 s): his words haven't changed,
    //   and nothing in Leslie's side's words shows them shaken
    { id: 'nt2', skill: 'attitude', level: 'C2', point: 'scared', reveals: ['terrific', 'bar'], seg: [92.3, 97.3],
      stem: 'At the end, how should we hear the line “I think … scared him”?',
      choices: ['Ironically: nothing they said got through', 'Ironically: they were the ones rattled',
                'Sincerely: he hurried off to dodge them'], a: 0,
      cue: 'この一言の前後で、ボビーの言葉は変わったか。',
      line: 'Hey, I’m Bobby Newport. — I think we *scared him*. — Here, have a Bobby bar.',
      said: 'ボビーが次の人に同じあいさつをして同じお菓子を配るそばで、「怖がらせちゃったかな」と言う。',
      mean: 'ボビーは同じ言葉をくり返すだけ。まったく動じていないのを見て、逆を言う皮肉。',
      trap: '言葉どおりや、自分たちへの皮肉と取りやすい。相手の様子と逆の言葉なら、相手についての冗談。',
      use: 'Well, that went great.（いや、うまくいったね（皮肉））' },
  ]
};
