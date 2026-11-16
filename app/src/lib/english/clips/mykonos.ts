// REVIEW 2026-11-17: pass 2, fix 19, drop 1, new 0; ear checks 2
// REVIEW open: i2 — the key holds whichever of 82–92 s is Holly's (the circus idea or the "more gravel" tip), but
//   the stem names her; confirm on the phone that one of the two is her voice.
// “No more brain damage - The Office US” (the official The Office channel, BEST OF SEASON 7): Michael plans to be the
// "plant" at Andy's small-business seminar as a Greek character, Mykonos; Holly, just out of a breakup, says no, then
// joins in; Andy can't bring himself to ask for the sale until Michael coaches him through it.
// Segments from the captions, words from whisper (2026-11-16). Untested: 0–12 s (“Nein” vs “nine”), 58–72 s (an
// overshare about Holly's high-school health), 92–101 s and 116–139 s (accent garble: “great kachina” / “great Aina”,
// “for my goat” / “for a gold”; the title line mocks a "miracle" cure), 139–157 s (an unnamed group's late excuse,
// h2 dropped in review), 157–160 s (“blow the sails” in both sources), 187–194 s (“secret gyro recipe”: garbled), and
// 294–301 s (“Work?” vs “well”).
// EAR CHECK: 82.8–92.3 s i2 — “Maybe Mykonos ran away to join the Italian circus” and “Try a little more gravel,
//   like he's a smoker” are Holly's (assumed; Michael answers “Okay, yeah, like a character history… Tom Hanks does that”)
// EAR CHECK: 292.1 s nt2 — “Michael, I should get back to work” is Holly's (assumed by voice), said as herself
import type { Clip } from '../types.ts';

export const mykonos: Clip = {
  id: 'mykonos', video: 'Yd9HNVrPTgI', title: 'No more brain damage', dur: 323, wpm: 141, band: 'slow',
  tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 75 %). "Take over the whole seminar" (a later line, not his plan) is now "keep the crowd
    //   laughing", a near miss on "laughing at all jokes": he laughs, he doesn't get laughs.
    // why: see how good ← "plant" read as a spy or tester; crowd laughing ← "laughing at all jokes" heard as his job
    //   being to make people laugh
    { id: 'g1', skill: 'gist', level: 'B2', point: 'plant', seg: [12.0, 38.0],
      stem: 'What is Michael’s plan for the seminar, in his own words?',
      choices: ['To pose as a guest and make the speaker look good', 'To pose as a guest and see how good the speaker is',
                'To pose as a guest and keep the crowd laughing'], a: 0,
      cue: 'I am the plant のあと、my job is の続き。',
      line: '*I am the plant.* Every great seminar has one.',
      said: '「僕はサクラ。いいセミナーには必ずいる」とカメラに話す。',
      mean: 'plant ＝ サクラ。客のふりをして、話し手を引き立てる役。',
      trap: 'plant をスパイと取ると、話し手を試す役に聞こえる。my job is の続きを聞く。',
      use: 'He was a plant in the audience.（彼は客席のサクラだった）' },

    // R fix: V2 (blind 75 %: the key was the only plant-like pair). Each distractor now misses one half: "tough"
    //   for "leading", "clapping" for "laughing".
    // why: tough questions ← "questions" caught without "leading"; clapping ← "laughing at all jokes" half heard, with
    //   the usual audience move filling in
    { id: 'd1', skill: 'detail', level: 'B1', point: 'technique', reveals: ['plant'], seg: [19.4, 27.5],
      stem: 'How does Michael say he makes the speaker look good?',
      choices: ['Leading questions and laughing at all jokes', 'Tough questions and laughing at all jokes',
                'Leading questions and clapping at all jokes'], a: 0,
      cue: 'techniques of のあと、二つ並ぶもの。',
      line: 'through the techniques of *leading questions* and *laughing at all jokes*.',
      said: '「誘導的な質問と、どんな冗談にも笑うことで」と説明する。',
      mean: 'leading question ＝ 答えやすいよう誘う質問。話し手が得意な話をできる。',
      trap: 'questions だけだと鋭い質問、jokes だけだと拍手を想像しやすい。前の1語を聞く。',
      use: 'Don’t ask me leading questions.（誘導尋問はやめて）' },

    // why: time to think ← "I don't know" heard as 考えておく; agrees ← the flat, tired voice heard as a weak yes
    // R fix: S4: the segment ended inside "Holly" (48.7); it now ends at 48.6.
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'notup', seg: [37.7, 48.6],
      stem: 'What does Holly’s answer to the Greek-couple idea do?',
      choices: ['Turns it down, gently', 'Asks to think it over', 'Agrees, without energy'], a: 0,
      cue: 'Michael と呼んだあとの、気分の言い方。',
      line: 'Oh, *I don’t know*, Michael. *I’m not feeling up to that*.',
      said: '「うーん、どうかな。そんな気分じゃないの」と答える。',
      mean: 'not feeling up to ＝ やる元気がない。I don’t know で和らげた断り。',
      trap: '「考えておく」の感覚で保留と取りやすい。up to that まで聞くと断り。',
      use: 'Sorry, I’m not feeling up to it.（ごめん、そんな元気がなくて）' },

    // R fix: V2 (blind 60 %, from knowing Michael loves Holly). The choices are now the three pairings a mixed-up
    //   listener could take from the two superlatives: the key, the two swapped, and her side read as relief.
    // why: swapped ← "greatest" and "worst" swapped between the two people; she's relieved ← "broke up… greatest
    //   thing" heard as good news for her as well
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'breakup', seg: [48.2, 57.7],
      stem: 'How do Michael and Holly each feel about her breakup?',
      choices: ['He’s thrilled; she’s miserable', 'He’s miserable; she’s thrilled', 'He’s thrilled; she’s relieved'], a: 0,
      cue: 'greatest と worst、二つの最上級。',
      line: '…*the greatest thing* that has ever happened to me. To Holly, it’s been *the worst week* of her life.',
      said: '「ホリーが先週別れた。僕には最高の出来事、彼女には最悪の1週間」と話す。',
      mean: '同じ出来事を自分には最高、彼女には最悪と並べる。彼女に気があると分かる。',
      trap: '最上級が二つ続くので、誰の話か混ざりやすい。to me と To Holly で分ける。',
      use: 'Best news I’ve heard all week!（今週いちばんの朗報だ！）' },

    // R fix: V2 (blind 55 %): "cheer up and move on" was weak, and only the key said "as his character". It is now
    //   "pressing her, as his character, to say yes now", which "If you change your mind" refutes.
    // why: Greek friend ← "Mykonos" heard as a third person; pressing ← Michael's eagerness heard as pushing, the
    //   "if" missed
    { id: 'pr2', skill: 'pragma', level: 'C1', point: 'offer', seg: [72.1, 77.3],
      stem: 'When Michael tells Holly to talk to Mykonos, what is he doing?',
      choices: ['Leaving the offer open, as his character', 'Suggesting she meet a Greek friend of his',
                'Pressing her, as his character, to say yes now'], a: 0,
      cue: 'If you change your mind で始まる一文。',
      line: '*If you change your mind*, why don’t you talk to Mykonos?',
      said: '「気が変わったら、ミコノスに話してよ」と言う。',
      mean: 'ミコノスは自分の役。役の名前を使って、誘いを開けたままにしている。',
      trap: '名前を第三者と取ると「友だちの紹介」に聞こえる。Mykonos は彼自身の役名。',
      use: 'If you change your mind, call me.（気が変わったら電話して）' },

    // R fix: V2 (blind 60 %) + S4. "Worries the act will upset people" is now "making fun of him to his face", the
    //   reading her first remark invites. The segment is now 78.7–92.6 s, taking in "Try a little more gravel", so the
    //   key holds whichever of the two lines is hers (see the EAR CHECK); it no longer starts inside "Mykonos".
    // why: talking him out of it ← the first remark sounds like criticism; making fun ← "He sounds Italian" heard as
    //   teasing, the help that follows missed
    { id: 'i2', skill: 'infer', level: 'C1', point: 'joins', seg: [78.7, 92.6],
      stem: 'As they talk over Mykonos’s accent, what does Holly show?',
      choices: ['She has started to join in the act', 'She is still trying to talk him out of it',
                'She is making fun of him to his face'], a: 0,
      cue: 'Italian のあと、彼女が足す思いつき。',
      line: 'He sounds Italian. … *Maybe Mykonos ran away to join the Italian circus*. … *Try a little more gravel*…',
      said: '「イタリア人っぽい」と言い、「イタリアのサーカスに逃げたことにしたら」と案を出す。',
      mean: '文句ではなく、役の生い立ちを一緒に考え始めている。断った後で乗り気になった。',
      trap: '最初のひと言だけだと批判に聞こえる。直後の maybe の案で、手伝いと分かる。',
      use: 'Maybe he grew up in Paris?（パリ育ちって設定はどう？）' },

    // why: 15 ← fifth/fifteenth share the opening; 3 ← "the" + a weak ordinal
    // R fix: S4: 79.5–83.0 s started inside "sounds" and ended inside "maybe"; it is now 78.7–82.75 s.
    { id: 'n1', skill: 'number', level: 'B1', point: 'fifth', seg: [78.7, 82.75],
      stem: 'Counting her, how many people have told Michael that today?',
      choices: ['3', '5', '15'], a: 1, keep: true,
      cue: 'You’re the のあとの序数。',
      line: 'You’re *the fifth person* to tell me that today.',
      said: '「今日それを言われたの、君で5人目だよ」と返す。',
      mean: 'fifth ＝ 5番目。みんなに同じことを言われている、とぼやいている。',
      trap: 'fifth と fifteenth は出だしが同じ。fifth は th で短く終わる。',
      use: 'You’re the third person to ask me.（聞かれたの、君で3人目だ）' },

    // why: proud ← people noticing sounds like attention he wants; shocked ← the quick reply heard as surprise
    // R fix: S4, as n1: segment 79.5–83.0 → 78.7–82.75.
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'tired', reveals: ['fifth'], seg: [78.7, 82.75],
      stem: 'How does Michael take Holly’s comment about his accent?',
      choices: ['Tired of hearing the same thing', 'Proud that people notice his work',
                'Shocked that it’s so easy to spot'], a: 0,
      cue: '返事の最後、today まで聞いて。',
      line: 'You’re the fifth person to tell me that *today*.',
      said: '「今日それを言われたの、君で5人目」と返す。',
      mean: '何度も言われてうんざり、というぼやき。でもすぐ彼女の案に乗っていく。',
      trap: '驚きの声に聞こえやすい。回数と today で「またか」の気持ちが分かる。',
      use: 'Yeah, I get that a lot.（うん、よく言われる）' },

    // R fix: The Office has no laugh track, so the stem now asks what makes the answer funny (it asked why it "gets a
    //   laugh"). The choices stay: the blind read got it wrong.
    // why: musical, not movie ← "musical" right after a question about movies; feels like home ← "as we call it, home"
    //   read as "I've watched it so often"
    { id: 'h1', skill: 'humor', level: 'C1', point: 'grease', seg: [101.8, 111.6],
      stem: 'What makes the answer to “Do you like movies?” funny?',
      choices: ['The title sounds like the name of his country', 'He calls a musical a movie and doesn’t notice',
                'He has seen it so often it feels like home'], a: 0,
      cue: '作品の名前の音と、最後の一語。',
      line: 'I like the musical *Grease*, or as we call it, *Home*.',
      said: '「好きなのはミュージカルのグリース。僕らは『故郷』と呼んでる」と答える。',
      mean: 'Grease（グリース）と Greece（ギリシャ）は同じ音。ギリシャ人の役なので「故郷」。',
      trap: 'home を「くつろげる場所」と取りやすい。同じ音の言葉遊びを疑う。',
      use: 'It feels like home to me.（私には故郷みたいな場所）' },

    // R fix: V2 (blind 70 %: "write the act out" and "tone it down" were weak) + S4 (the segment started on "we";
    //   111.6 → 111.45, end 115.5 → 115.2). Now "try it out on Andy first" (wrong target) and "work out a story"
    //   (from the "character history" just before).
    // why: on Andy ← "try this out" heard, and Andy's seminar is the plan; story ← "character history" a moment
    //   before, and "out" caught as "work out"
    { id: 'd2', skill: 'detail', level: 'B1', point: 'tryout', seg: [111.45, 115.2],
      stem: 'What do they decide they have to do next?',
      choices: ['Try the act out on someone', 'Try the act out on Andy first', 'Work out a story for the act'], a: 0,
      cue: 'have to のあとに続く句動詞。',
      line: 'We have to *try this out on somebody*.',
      said: '「誰かで試してみなきゃ」と言う。',
      mean: 'try out ＝ 実際に試す。本番の前に、知らない人で演技を試そうという話。',
      trap: 'out だけ拾うと別の句動詞と混ざる。try と、on のあとの相手を聞く。',
      use: 'Let’s try it out on my sister.（妹で試してみよう）' },

    // R fix: V2 (blind 55 %): "asking them to see the menu" is now "just getting their attention", the ちょっと
    //   (すみません) frame for "Look", which the question after it refutes. Segment end 118.6 → 118.5.
    // why: attention ← "Look" heard as a polite ちょっと before a question; welcoming ← a server's first line is
    //   usually a greeting
    { id: 'm1', skill: 'marker', level: 'B2', point: 'look', seg: [115.5, 118.5],
      stem: 'How does the server start the question about ordering?',
      choices: ['Impatiently, wanting them to get to it', 'Politely, just getting their attention',
                'Warmly, welcoming them to the shop'], a: 0,
      cue: '文頭の短い一語の働き。',
      line: '*Look*, you want to order something?',
      said: '「あのさ、何か注文するの？」と聞く。',
      mean: '文頭の Look は「見て」ではなく「いいかい」。いら立ちや本題への催促。',
      trap: '日本語の「ちょっと」のような丁寧な呼びかけと取りやすい。注文を急かす言い方。',
      use: 'Look, I don’t have all day.（あのね、こっちも暇じゃないの）' },

    // R drop: h2 (the trucks excuse, 146–157 s): blind 60 %; its speakers are an unnamed group, the "Hilarious" just
    //   before it may be sarcasm, the "same as the financial crisis" distractor was a filler, and The Office has no
    //   laugh track. Never shipped, so deleted; humor keeps h1 and h3.

    // R fix: S4: 160.3–164.0 s started inside "sails" and ended before "minute" (captions 164.4); now 160.7–164.85.
    // why: would you ← "could you" and "would you" both link to "-dju"; can you ← the same request, present form
    { id: 's1', skill: 'sound', level: 'B2', point: 'couldyou', seg: [160.7, 164.85],
      stem: 'Fill the gap: “Andrew, ___ come in here a minute?”',
      choices: ['could you', 'would you', 'can you'], a: 0,
      cue: 'Andrew のあと、つながる2語。',
      line: 'Andrew, *could you* come in here a minute?',
      said: '「アンドリュー、ちょっと来てくれる？」と呼ぶ。',
      mean: 'could you が「クッジュ」とつながる。d と y が合わさって「ジュ」になる。',
      trap: 'could と would は「クッジュ」「ウッジュ」で出だしだけ違う。最初の k を聞く。',
      use: 'Could you come here a minute?（ちょっと来てくれる？）' },

    // R fix: V2 (blind 60 %: the key was the only positive choice, and Michael is coaching). One distractor is
    //   positive now ("do it his own way"), and "stop it in time" is "call it off", a near miss on "off". Segment end
    //   172.2 → 172.1 (before "I am").
    // why: own way ← "pull this off" heard as a free hand, the sense of success missed; call it off ← "off" heard,
    //   and a phrasal verb with "off" that means to cancel
    { id: 'p5', skill: 'phrase', level: 'B2', point: 'pulloff', seg: [168.5, 172.1],
      stem: 'What does Michael need Andy to feel sure of?',
      choices: ['That he can make it work', 'That he can do it his own way', 'That he can call it off'], a: 0,
      cue: 'confident that you can のあとの句動詞。',
      line: 'I need you to be confident that you can *pull this off*.',
      said: '「やり遂げられると、自信を持ってほしい」と言う。',
      mean: 'pull off ＝ 難しいことを成功させる。ここでは契約をまとめ切ること。',
      trap: 'off から「やめる」系と取りやすい。pull it off は「うまくやる」。コーチの励ましの流れ。',
      use: 'I can’t believe we pulled it off!（うまくいったなんて信じられない！）' },

    // C2: what is he trying not to say?
    // R fix: V2 (blind 70 %, its one rewrite): "Michael should run it instead" (outside the segment) is now "he means
    //   to outsell Michael", a rivalry reading of "no one", which "work harder" (effort, not results) refutes.
    // why: others aren't trying ← "no one will work harder" heard as a jab at the others (scope); outsell Michael ←
    //   "no one" heard as a challenge to his coach, effort taken for results
    // anchor: 169.9–171.9 s Michael asks for confidence "that you can pull this off"; 172.8–175.8 s Andy is confident
    //   only "that no one will work harder": success has become effort (later, 205 s: "It's hard for me")
    { id: 'nt1', skill: 'attitude', level: 'C2', point: 'confident', reveals: ['pulloff'], seg: [168.5, 176.2],
      stem: 'When Andy says no one will work harder, what is he trying not to say?',
      choices: ['That he’s not sure he can close', 'That the others aren’t trying hard',
                'That he means to outsell Michael'], a: 0,
      cue: '聞かれた自信と、答えた自信の中身の差。',
      line: 'confident that you *can pull this off*. — I am. I’m confident that *no one will work harder*…',
      said: '「やれると自信を持て」と言われ、「誰よりも頑張る自信はある」と答える。',
      mean: '求められたのは成功の自信なのに、努力の自信にすり替えている。できるとは一度も言っていない。',
      trap: '自信があると言うので前向きに聞こえやすい。何についての自信か、聞かれた中身と比べる。',
      use: 'I’ll do my best. No promises.（全力は尽くす。約束はできないけど）' },

    // R fix: V2 (blind 70 %). "Inviting questions" is now "setting up follow-up calls", a near miss on "you got my
    //   business card"; the key is reworded so it isn't the only "without" choice. Segment end 187.2 → 187.1.
    // why: asking to buy ← "business card" heard as a sales pitch; follow-up calls ← "you got my business card, so…"
    //   heard as "call me"
    { id: 'pr3', skill: 'pragma', level: 'B2', point: 'wrapup', seg: [176.0, 187.1],
      stem: 'What is Andy doing as his talk ends?',
      choices: ['Letting them go without asking for a sale', 'Asking everyone to buy before they go',
                'Setting up follow-up calls with them all'], a: 0,
      cue: 'ready to go のあと、文の終わり方。',
      line: 'I guess you guys are probably *ready to go*. And you got my business card, *so…*',
      said: '「もう帰りたいよね。名刺は渡したし、じゃあ…」と締めに入る。',
      mean: '買ってと一度も言わずに終わろうとしている。営業の要の「クロージング」を避けている。',
      trap: '名刺の話から売り込みと取りやすい。so… で言い切らず、頼んでいない。',
      use: 'Well, I guess that’s it for today.（じゃあ、今日はこんなところで）' },

    // R fix: V2 (blind 75 %: only the key was a comeback). "Praises Andy" is now "he's rushing the close", the same
    //   flip read as overshooting; Andy hasn't asked anyone yet, so it fails. It reveals 'wrapup' (its key says he
    //   skipped the close).
    // why: too old ← "be past it" is also an idiom for being too old; rushing ← "past it" heard as going too fast, too
    //   far
    { id: 'h3', skill: 'humor', level: 'C1', point: 'past', reveals: ['wrapup'], seg: [194.6, 200.6],
      stem: 'Why is the reply to “I am getting to it” so sharp?',
      choices: ['It flips his words: he’s skipping the close', 'It flips his words: he’s rushing the close',
                'It says Andy is too old for this job'], a: 0,
      cue: '返事の中で入れかわる一語。',
      line: 'I am *getting to it*. — No, you’re not. You’re *getting past it*.',
      said: '「今からやるよ」に「いや、通り過ぎてる」と返す。',
      mean: 'to を past に変え、「近づいている」を「素通りしている」にひっくり返す。',
      trap: 'be past it は「もう歳だ」の意味もあるので迷う。ここは to との対比。',
      use: 'You’re not getting to it, you’re avoiding it.（やるんじゃなくて、避けてるだけ）' },

    // R fix: V2 (blind 70 %): all three now start "He asks outright…", and only the outcome differs (a few, none,
    //   everyone). The segment runs on to 276.4 s, so "The rest of you are dead to me" is inside it. It reveals
    //   'wrapup' (the stem's "after Michael's pep talk" implies he hadn't asked before).
    // why: nobody buys ← the long gaps after "Who else?" heard as silence; everyone ← "Sold… Good choice" heard as
    //   the whole room buying
    { id: 'g2', skill: 'gist', level: 'B2', point: 'close', reveals: ['wrapup'], seg: [195.0, 276.4],
      stem: 'After Michael’s pep talk, how does Andy’s seminar end?',
      choices: ['He asks outright and makes a few sales', 'He asks outright, but nobody buys',
                'He asks outright and sells to everyone'], a: 0,
      cue: '後半、Andy が何度もくり返す問いかけ。',
      line: 'who would like to purchase this… *right now*? … *I’ll take one*.',
      said: '励まされたアンディが「今すぐ買う人は？」と直接聞き、何人かが買う。',
      mean: '避けていた「買ってください」を言えたことで、売上につながった。',
      trap: '買う声は数人だけ。The rest of you で、残りは買わなかったと分かる。',
      use: 'So, who’s in?（で、乗る人は？）' },

    // R fix: V2 (blind 55 %): the choices are now one frame, "too ___ a guy", so the word itself decides it.
    //   Segment end 206.9 → 206.75 (before "you know").
    // why: too new ← "hard for me" heard as inexperience, and new/nice share the opening n; too nervous ← nice and
    //   nervous share the opening n
    { id: 'd4', skill: 'detail', level: 'B1', point: 'nice', seg: [202.6, 206.75],
      stem: 'Why does Andy say closing is hard for him?',
      choices: ['He’s too nice a guy', 'He’s too new a guy', 'He’s too nervous a guy'], a: 0,
      cue: 'hard for me のあと、自分をどう言うか。',
      line: 'It’s hard for me. *I’m a nice guy*.',
      said: '「僕には難しい。いいやつだから」と答える。',
      mean: 'いい人なので、相手に買ってと押せない、という言い分。',
      trap: 'nice は短く速い。nervous と出だしが同じ n なので、guy まで聞く。',
      use: 'I’m just not a pushy person.（押しが強いタイプじゃないんだ）' },

    // why: out of hand ← a rolling snowball read as unstoppable; time running out ← "Who else?" heard as a last call
    { id: 'p7', skill: 'phrase', level: 'B2', point: 'snowball', seg: [222.0, 230.3],
      stem: 'Right after the first “Yes”, what does Andy’s next line mean?',
      choices: ['One sale will lead to more', 'Things are getting out of hand', 'Time is running out to buy'], a: 0,
      cue: '最初の1件のあと、転がるもののたとえ。',
      line: 'Okay, *the snowball is rolling*. Who else?',
      said: '1件目が売れて「雪玉が転がり始めた。他には？」と続ける。',
      mean: '雪玉は転がるほど大きくなる。1件の成功が次々に広がる、という意味。',
      trap: '転がる＝止まらないと取ると「手に負えない」に聞こえる。直後の Who else? がヒント。',
      use: 'Once it starts, it snowballs.（一度始まると、どんどん大きくなる）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'putoff', seg: [230.3, 233.0],
      stem: 'Type what Andy says: “You can ___ for a couple of days.” (3 words)', answer: 'put it off',
      cue: 'You can のあと、つながる3語。',
      line: 'You can *put it off* for a couple of days…',
      said: '「2、3日先のばしにしてもいい」と言う。',
      mean: 'put off ＝ 先のばしにする。put it off が「プリロフ」のようにつながる。',
      trap: 't が弾んで「ラ」に近くなり、3語が1語に聞こえる。it は弱くほぼ消える。',
      use: 'Don’t put it off any longer.（これ以上先のばしにしないで）' },

    // R fix: V2 (blind 50 %): "buy when ready" contradicted the stem. It is now "behind rivals", a scope near miss on
    //   "a couple of days behind" (behind where you would be). "Costs more" is now "a higher price" (time is also a
    //   cost). Segment 232.4–247.4 cut "now"; it is now 235.3–249.4.
    // why: higher price ← the usual sales script ("prices go up"); rivals ← "behind" heard as behind competitors, "where
    //   you would be" missed
    { id: 'i3', skill: 'infer', level: 'C1', point: 'delay', reveals: ['putoff'], seg: [235.3, 249.4],
      stem: 'Which plain version keeps Andy’s argument for buying today?',
      choices: ['Waiting gains you nothing, so buy now', 'Waiting means a higher price, so buy now',
                'Waiting puts you behind rivals, so buy now'], a: 0,
      cue: 'the only thing… different のあと。',
      line: 'the only thing that’s going to be different is *you’ll be a couple of days behind*…',
      said: '「先のばししても、いずれ必要になる。違うのは2、3日遅れることだけ」と話す。',
      mean: '値上げの脅しではなく、「待っても得はない」という理屈で今の購入を勧める。',
      trap: '決まり文句の「値上がり」や、behind から「他社に遅れる」と取りやすい。比較は自分と。',
      use: 'You’ll need it anyway, so why wait?（どうせ要るなら、なぜ待つ？）' },

    // C2: how they see each other
    // why: shy wife ← a polite exit is what a shy character would say; scolds ← "work" heard as a reminder of his job
    // anchor: 281.9–284.0 s "You are the love of my life" in character; 292.1 s she answers with his real name,
    //   "Michael", and her own job
    { id: 'nt2', skill: 'attitude', level: 'C2', point: 'realname', seg: [276.3, 294.0],
      stem: 'When Holly answers the “love of my life” speech, what does she do?',
      choices: ['Steps out of the act to stop him', 'Stays in the act, as his shy wife',
                'Scolds him for skipping his own work'], a: 0,
      cue: '彼女の返事の最初の一語、その呼び方。',
      line: 'You are *the love of my life*. … — *Michael*, I should get back to work.',
      said: '役のまま「君は人生の恋人」と迫られ、「マイケル、仕事に戻らなきゃ」と答える。',
      mean: '役名でなく本名で呼ぶのは、芝居から降りる合図。役を借りた本気の口説きを、やんわり止めている。',
      trap: '丁寧な断りなので役の中の照れと取りやすい。呼び方が変わったら、場面の外の話。',
      use: 'Okay, Tom, joke’s over.（はい、トム、冗談はここまで）' },
  ]
};
