// “Monica's Iron Kitchen | Friends” (the official Friends channel, Best of Season 2): Monica drives her friends
// through a huge cooking job against the clock, snaps when asked how it happened, and threatens Ross into helping.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈55.5 s; whisper loops one line from
// 57.9 s, and the captions' last event (58.9 s) is that same line. Untested: 5.8–10 s ("German subtitles", a
// national stereotype: world knowledge), "Carol and Susan" and what "this thing" is (backstory; the captions have
// "carolly"), and the speakers of 18 s, 29 s, 51 s and 52.6 s (no names; no key rests on them).
// EAR CHECK: 39.7–44.75 s c2 — the stress in "and I feel for you, I do" falls on "do" (insisting), not "I"; ship only once
//   confirmed
// EAR CHECK: 0–3.8 s c1 — "We've only got" with a weak, barely voiced "we've" (both sources have "we've"); confirm the
//   "'ve" is audible at all
// EAR CHECK: 43.3 s r1 — the cut falls in the 0.4 s gap between "I do" (ends ≈43.2 s) and "But" (43.6 s)
// REVIEW 2026-11-16: pass 4, fix 16, drop 0, new 0; ear checks 3
import type { Clip } from '../types.ts';

export const ironkitchen: Clip = {
  id: 'ironkitchen', video: 'j1lfrJEfE28', title: 'Monica\'s Iron Kitchen', dur: 67, wpm: 211, band: 'fast',
  tags: ['家', '友だち'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: V2 — the key was the one choice every distractor differed from by one step (blind 70 %); now a 2×2 grid
    //   (12/20 × 30/36), so no choice sits in the middle. "2 hours" dropped.
    // keep: ascending. why: 12 h 30 ← the "-six" at the end swallowed; 20 h 36 ← twelve/twenty, both two syllables
    //   starting "tw"; 20 h 30 ← both slips at once
    { id: 'n1', skill: 'number', level: 'B1', point: 'hours', seg: [0, 4.2], keep: true,
      stem: 'How much time does Monica say they have left?',
      choices: ['12 hours and 30 minutes', '12 hours and 36 minutes', '20 hours and 30 minutes', '20 hours and 36 minutes'],
      a: 1,
      cue: '「in trouble」のすぐあと、left で終わる文。',
      line: 'We’ve only got *12 hours and 36 minutes* left.',
      said: '「まずい、残りあと12時間36分しかない」と、みんなをせかす。',
      mean: 'only got ～ left ＝「あと〜しかない」。時間が足りないと強調している。',
      trap: 'twelve と twenty は出だしが似ている。twelve は「ルヴ」で終わる。',
      use: 'We’ve only got ten minutes left.（あと10分しかないよ）' },

    // C2: exact weak words at native speed (cf. n1)
    // anchor: 1.4–1.9 s "we've only got" at 211 wpm, both sources agreeing; "got" (not "have") is kept by both
    // why (the instinct): "we only have" ← the textbook form; "we have only" ← the 've heard and kept as a full "have"
    // retired: one C2 alone is under 2 (c2 retired)
    { id: 'c1', skill: 'dict', level: 'C2', point: 'hours', seg: [0, 3.8], retired: true,
      stem: 'Type the start of the second sentence: “___ 12 hours…” (3 words)', answer: "we've only got",
      cue: '「in trouble here」のすぐあと。文法より聞こえた音を。',
      line: '*We’ve only got* 12 hours and 36 minutes left.',
      said: '「あと12時間しかない」の出だし。we’ve はほぼ「ウィ」だけで、only got と続く。',
      mean: 'have got は会話での have。’ve は小さく、got が「持っている」の意味を運ぶ。',
      trap: '習った形の we only have に直したくなる。書き取りは、聞こえた語を書く。',
      use: 'I’ve only got one bag.（荷物は1つだけです）' },

    // R fix: V2 (blind 75 %) — the key was the only sensible choice; "guests already there" now rests on the
    //   hours/minutes slip, and the quarrel choice is about work, not peace
    // why: twelve minutes ← "12 hours and 36 minutes": "minutes" is the last word heard; arguing ← the friends do
    //   snipe ("German subtitles"), but they obey, and nobody quarrels
    { id: 'g1', skill: 'gist', level: 'B1', point: 'situation', seg: [0, 21.5],
      stem: 'Why is Monica pushing everyone so hard in this scene?',
      choices: ['There’s far more food to make than time left', 'The guests come in twelve minutes, and nothing’s cooked',
                'Her helpers keep arguing instead of working'], a: 0,
      cue: '最初の一言と、そのあとの命令の調子。',
      line: 'People, we’re *in trouble* here… *Move, move, move!*',
      said: '「みんな、まずいことになってる」と言い、「急いで！」と命令を繰り返す。',
      mean: '大量の料理が間に合いそうにない。だからモニカは隊長のように全員を動かしている。',
      trap: '急いでいるので客がもう来ていると思いやすいが、時間はまだ半日ある。急ぐ理由は量。',
      use: 'We’re in trouble here.（これはまずいことになった）' },

    // why: "speed it" two words ← the "it" linked into "speedit"; "speed up" ← the textbook phrase, the middle "it"
    //   lost
    // R fix: S4 — 14.2 s cut into "They're" (captions 14.1 s); the segment now runs to the end of Joey's line
    { id: 'x1', skill: 'dict', level: 'B1', point: 'speed', seg: [10.4, 17.5],
      stem: 'Type the order to Joey: “Joey, ___.” (3 words)', answer: 'speed it up',
      cue: '「Joey」と名前を呼んだすぐあと。',
      line: 'Joey, *speed it up*.',
      said: '「ジョーイ、急いで」と手を早めるよう言う。',
      mean: 'speed it up ＝「もっと速くやって」。it は今している作業。',
      trap: 'speed‿it‿up はつながって「スピーディダップ」。it の t は弾んで消えやすい。三語ある。',
      use: 'Can you speed it up a little?（もう少し急いでもらえる？）' },

    // R fix: V2 (blind 60 %) — "too small" against "won't go in" made the key the only one about refusing; the
    //   blankets choice now has the same "won't" shape
    // why: blankets won't close ← "blankets" is said, so the fault seems to be in them; knife ← the usual kitchen
    //   excuse (broken script), but he names the food
    { id: 'd1', skill: 'detail', level: 'B1', point: 'pigs', seg: [10.5, 17.5],
      stem: 'When told to hurry, what does Joey blame?',
      choices: ['The pigs; they won’t go in', 'The blankets; they won’t close', 'The knife; it isn’t sharp'], a: 0,
      cue: '「I’m sorry」のあと、it’s で始まる言い訳。',
      line: 'Oh, I’m sorry, *it’s the pigs*. They’re *reluctant* to get in the blankets.',
      said: '「ごめん、豚のせい。毛布に入りたがらなくて」と言う。',
      mean: 'pigs in blankets はソーセージのパイ包み。ソーセージが入らない、という言い訳。',
      trap: 'blankets も聞こえるが、主語は They＝the pigs。文の主語を追う。',
      use: 'Sorry, it’s the traffic.（ごめん、渋滞のせいなんだ）' },

    // R fix: V2 (blind 60 %) — the key was the only choice shaped like a joke; all three now blame something
    //   "as if…"
    // why: blankets shrank ← "blankets" is said, so the fault seems to be in them; Monica ← he says sorry right
    //   after her order, so the excuse seems aimed at her, but he names the pigs
    { id: 'h1', skill: 'humor', level: 'C1', point: 'pigs', seg: [12.4, 17.5],
      stem: 'Why does Joey’s excuse get a laugh?',
      choices: ['He blames the food, as if it chose not to cooperate', 'He blames the blankets, as if they had shrunk',
                'He blames Monica, as if her rushing slowed him'], a: 0,
      cue: 'They’re のあとの形容詞に注目。',
      line: 'They’re *reluctant* to get in the blankets.',
      said: '小さなソーセージが「パイ生地に入るのを嫌がる」と言う。',
      mean: 'reluctant ＝ 気が進まない。人に使う語を食べ物に使い、自分の遅さを相手のせいにしている。',
      trap: 'they を周りの人と取ると人のせいに聞こえる。they は直前の the pigs。',
      use: 'I’m a little reluctant to say yes.（ちょっと引き受けにくいな）' },

    // R fix: V2 (blind 65 %) — "with someone" was weak; the new distractor is also a planner, but one who shares
    //   the plan, which the line doesn't say
    // why: leaves it late ← "how did this happen?" heard as a complaint about her habits; explains the plan ←
    //   "I thought you had this all planned out" heard as "you told us the plan"
    { id: 'i1', skill: 'infer', level: 'B2', point: 'planned', seg: [17.5, 21.5],
      stem: 'What does the question to Monica suggest about her usual way of working?',
      choices: ['She normally has every step worked out', 'She normally leaves her planning very late',
                'She normally explains the plan to everyone'], a: 0,
      cue: '問いのあと、I thought で始まる文の中身。',
      line: 'how did this happen? *I thought you had this all planned out*.',
      said: '「どうしてこうなったの？全部計画済みだと思ってた」と聞く。',
      mean: 'I thought ～ は「〜だと思っていたのに」。普段はきちんと計画する人だと分かる。',
      trap: '問いを「いつもそうだ」という責めと取りやすい。I thought は期待の裏切り。',
      use: 'I thought you had it all planned out.（全部決めてあると思ってた）' },

    // R fix: V2 (blind 70 %) — "real tears" replaced by a guilt-trip reading; the segment now ends after "Sir, no,
    //   sir!", which settles that she is barking, not asking for sympathy
    // why: hurt ← "Do you want to see me cry?" heard as a plea for sympathy; calm joke ← a question form heard as
    //   light, but she repeats it and never answers
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'cry', seg: [17.5, 30.5],
      stem: 'When asked how this happened, how is Monica feeling?',
      choices: ['Stressed; she snaps back instead of answering', 'Hurt; she feels blamed and wants their sympathy',
                'Calm; she is joking to make them all relax'], a: 0,
      cue: '質問に答えず、何を何度聞き返すか。',
      line: '*Do you want me to cry?* Is that what you want? Do you want to see me cry?',
      said: '理由を答えず、「泣いてほしいの？それが望み？泣くとこ見たいの？」と三回聞き返す。',
      mean: '答えられない質問を、強い問い返しで止めている。追いつめられて、いらいらしている。',
      trap: 'cry を文字どおり取りやすい。答えずに同じ問いを重ねたら、反撃の合図。',
      use: 'You want me to cry? Is that it?（泣けってこと？そういうこと？）' },

    // R fix: V2 (blind 55 %) — "short answer" pointed at "Sir, yes, sir"; the stem now says "reply", and the
    //   boss choice became a teacher, a second authority a group answers in one voice
    // why: worried mother ← "Do you want to see me cry?" heard as guilt-tripping; strict teacher ← a class answers
    //   together too, but "sir" to a woman is the drill-ground form
    { id: 'i2', skill: 'infer', level: 'C1', point: 'army', reveals: ['cry'], seg: [21.1, 30.5],
      stem: 'What does the group’s reply show about how Monica is acting?',
      choices: ['Like an officer giving orders to soldiers', 'Like a mother making her children feel bad',
                'Like a strict teacher scolding a noisy class'], a: 0,
      cue: '最後の答えの、最初と最後の同じ一語。',
      line: 'Do you want to see me cry? — *Sir, no, sir!*',
      said: '「泣くとこ見たいの？」に、全員が「サー、ノー、サー！」と答える。',
      mean: '軍隊で上官に答える型。モニカが鬼軍曹のようにふるまっている、と返事で示している。',
      trap: '女性に sir は変なので聞き流しやすい。答え方の型が、相手をどう見ているかを表す。',
      use: 'Yes, sir! Right away!（了解です！すぐやります！）' },

    // R fix: N7/B1 — the stem names Ross as the one saying "No", which answers w1; reveals 'refuse' added
    // why: look at this ← "look" taken literally; changing his mind ← "look" heard as a softener before a yes,
    //   but "I told you… not" follows
    { id: 'm1', skill: 'marker', level: 'B2', point: 'look', reveals: ['refuse'], seg: [33.4, 38.9],
      stem: 'When Monica turns to Ross, what does his first word after “No” do?',
      choices: ['It signals he’s firmly saying it again', 'It asks her to look at something he has',
                'It signals he’s about to give in to her'], a: 0,
      cue: '「What? No.」のあと、文頭の短い一語。',
      line: 'What? No. *Look*, I told you…',
      said: '「え、やだ。いいかい、前にも言ったよね」と断る。',
      mean: '文頭の Look は「いいかい、聞いて」。言ったことを強く繰り返す前置き。',
      trap: '「見て」と文字どおり取りやすい。文頭の Look のあとには、強い主張が来る。',
      use: 'Look, I’m not doing this again.（いいかい、もうこれはやらないよ）' },

    // R fix: V2 (blind 65 %) — the key was the only refusal the stem's "already told" invites; all three are now
    //   refusals, two with a reason he never gives
    // why: can't cook ← the usual reason to dodge kitchen work; too busy ← the usual polite excuse, but he gives
    //   no reason at all
    { id: 'd2', skill: 'detail', level: 'B1', point: 'refuse', seg: [33.4, 38.9],
      stem: 'What has Ross already told Monica?',
      choices: ['That he’s staying out of this whole thing', 'That he can’t cook, so he’d be no help',
                'That he’s too busy with work to help today'], a: 0,
      cue: '「I told you」のあと、not が入る文。',
      line: 'I told you *I am not a part of this thing*.',
      said: '「この件には関わらないって言ったよね」と言う。',
      mean: 'not a part of ～ ＝「〜には加わらない」。手伝いを断っている。',
      trap: '料理が苦手という理由は言っていない。断るときは、理由より not の位置を聞く。',
      use: 'I’m not a part of this.（僕はこの件に関わってないよ）' },

    // R fix: V2 (blind 70 %) — the exes choice needed backstory and was the weakest; all three are now two-step,
    //   and the stem's "get Ross to help" implies he refused, so it reveals 'refuse' (w1)
    // why: pleads and cries ← "cry" from the earlier scene; a promise, then orders ← "I told you" is said (by
    //   Ross), and she gave orders to the others
    { id: 'g2', skill: 'gist', level: 'B2', point: 'threat', reveals: ['feelfor', 'refuse'], seg: [33.4, 50.5],
      stem: 'How does Monica get Ross to help in the end?',
      choices: ['She shows sympathy, then makes a joking threat', 'She pleads with him, then nearly bursts into tears',
                'She reminds him of a promise, then gives orders'], a: 0,
      cue: '名前を呼んだあと、but の前と後。',
      line: 'I feel for you… *But if you don’t help me cook*…',
      said: '「気持ちは分かる。でも手伝わないなら…」と、ふざけた脅しで引き込む。',
      mean: '共感してから、冗談めかした脅しで押し切る。断る余地を笑いで消している。',
      trap: '泣くのは前の場面の話。I told you はロスの言葉で、約束ではない。押すのは but のあと。',
      use: 'Help me out, or else.（手伝ってよ、さもないと…）' },

    // why: Joey ← the only other name said so far (11 s), the last man addressed; Chandler ← the man who complains
    //   later, a voice heard often
    { id: 'w1', skill: 'who', level: 'B2', point: 'refuse', seg: [35, 40],
      stem: 'Who says he isn’t taking part?',
      choices: ['Joey', 'Ross', 'Chandler'], a: 1,
      cue: '断ったあと、モニカが呼びかける名前。',
      said: '男性が「関わらない」と断り、モニカが「いいわ、聞いて、ロス」と名前を呼んで返す。',
      mean: '返事の最初の呼びかけで、誰に答えているかが分かる。',
      trap: '前に呼ばれた名前が残りやすい。断った直後の返事で呼ばれる名前を聞く。',
      use: 'Okay, listen, Ross.（いい、聞いて、ロス）' },

    // R fix: V2 (blind 70 %) + S1 — "Before her demand" in the stem gave the shape of the key ("before she pushes
    //   him"); the stem now just names the moment, and "talk later" became the excuse reading
    // why: sorry for asking ← the Japanese frame: a preface before a request heard as 恐縮; lets him off ← "I
    //   realize you have issues" heard as accepting his reason to stay out
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'feelfor', seg: [38.6, 50.5],
      stem: 'What does Monica’s line about Ross’s issues do?',
      choices: ['Shows she cares, to soften what comes next', 'Says sorry for having to ask him to help',
                'Accepts his reason for staying out of it'], a: 0,
      cue: 'but の前と後で、話の向きがどう変わるか。',
      line: 'I realize that you have issues… and *I feel for you, I do. But*…',
      said: '「事情があるのは分かるし、同情もする。本当に。でも…」と続ける。',
      mean: 'I feel for you ＝ 気の毒に思う。相手の気持ちを先に認めて、それから頼みを押し通す。',
      trap: '前置きを謝罪と取りやすい。英語の共感の前置きは、but のあとの本題への準備。',
      use: 'I feel for you, I really do.（気持ちは分かるよ、本当に）' },

    // R fix: V2 (blind 75 %) — "her own story" was a filler; a polite "so…" request is the near miss (it also
    //   says what she needs), and "but if…" refutes it
    // why: lets him skip ← "I feel for you" heard as giving in; polite request ← the Japanese frame: sympathy, then
    //   「だから、お願い」
    { id: 'r1', skill: 'predict', level: 'B2', point: 'feelfor', seg: [38.6, 43.3], then: [43.3, 50.5],
      stem: 'After Monica says she feels for Ross, what kind of move comes next?',
      choices: ['A “but”, then a warning with “if”', 'A “so”, then a polite request for help',
                'An offer to let him skip it this time'], a: 0,
      cue: 'この前置きのあとに、よく来る一語は？',
      line: 'I feel for you, I do. *But if you don’t help me cook*…',
      said: '「同情する。本当に」のあと、「でも、料理を手伝わないなら…」と続く。',
      mean: '相手を受け止める前置きは、たいてい but の予告。本題はそのあと。',
      trap: '同情の言葉で、許してくれると読みやすい。I do と念を押したら、次は but が多い。',
      use: 'I get it. That said, we need you.（分かるよ。とはいえ、君が必要なんだ）' },

    // C2: stress that changes the meaning (cf. pr1)
    // anchor: 42.1–43.0 s "and I feel for you, I do", then 43.6 s "But if you don't help me cook": no one else's
    //   feelings are in play, so "I" has nothing to contrast with
    // why: on "I" ← the contrast reading learners know ("I do, even if others don't"), but nobody else is
    //   mentioned; on neither ← a tag before "but" heard as filler, though it repeats the claim
    // retired: C2 stress item, until the ear check (the stress on “do” in “I feel for you, I do”)
    { id: 'c2', skill: 'sound', level: 'C2', point: 'feelfor', seg: [39.7, 44.75], retired: true,
      stem: 'Where is the stress in Monica’s “I do,” and why?',
      choices: ['On “do”: she insists she really means it', 'On “I”: unlike the others, she does care',
                'On neither: a quick filler before “but”'], a: 0,
      cue: '短いつけ足しで、いちばん強く聞こえる語。',
      line: 'and I feel for you, I *do*. But…',
      said: '「同情してる、本当にね」と、言ったことを短く言い直してから but に入る。',
      mean: 'do を強めると「本当にそう思っている」という念押し。疑われそうな気持ちを先に保証している。',
      trap: 'I を強めると「他の人は違っても」の対比になるが、比べる相手は出てこない。強勢は何と比べているかを示す。',
      use: 'I like your idea. I do.（君の案、いいと思う。本当に）' },

    // R fix: V2 (blind 60 %) — the thank-you choice was refuted by "if" alone; it's now the insult reading of
    //   "pigs and Ross", which only the dish's name refutes
    // why: calls him a pig ← "pigs" and "Ross" side by side heard as name-calling; make him eat ← "take a bunch of
    //   those little hot dogs" heard as a punishment meal
    { id: 'h2', skill: 'humor', level: 'C1', point: 'threat', seg: [43.1, 50.5],
      stem: 'What is Monica’s joke when she names her new appetizer?',
      choices: ['She’ll wrap Ross up with the little hot dogs', 'She’ll tell the guests that Ross is a pig',
                'She’ll make Ross eat all of the little hot dogs'], a: 0,
      cue: 'Joey の「pigs」と「blankets」を思い出して。',
      line: 'if you don’t help me cook… a new appetizer called *pigs and Ross*.',
      said: '手伝わないなら、前菜「ロス巻き」を作ると言う。',
      mean: 'pigs in blankets の blankets を Ross に替えた名前。ロスで巻くと脅す。',
      trap: 'pigs と Ross が並ぶと悪口に聞こえるが、Ross は blankets の代わり。',
      use: 'If you’re late again, you’re buying.（また遅れたら、おごりね）' },

    // why: bowl ← katakana ボール covers both ball and bowl; "ball and melon" ← the weak "of" heard as a weak "and"
    { id: 's1', skill: 'sound', level: 'B2', point: 'ball', seg: [49.5, 55.9],
      stem: 'Fill the gap: “All right, ___.”',
      choices: ['ball of melon', 'bowl of melon', 'ball and melon'], a: 0,
      cue: 'All right のあと。母音の長さと、真ん中の弱い音。',
      line: 'All right, *ball of melon*.',
      said: '「よし、メロンを丸くくり抜いて」と、次の仕事を決める。',
      mean: 'ball はここでは「丸くくり抜く」作業。of は弱く「ア」に近い。',
      trap: 'ball と bowl はどちらもボールに聞こえる。ball は口を縦に開く「オー」、bowl は「オウ」。',
      use: 'Can you ball the melon?（メロンを丸くくり抜いて）' },

    // R fix: V2 (blind 55 %) — parallel "He's been…" forms; "getting nowhere" (I'm stuck = 行き詰まる) is now the
    //   near miss, refuted by the contrast with "he gets to"
    // why: can't move ← "stuck" taken literally (動けない); getting nowhere ← "I'm stuck" as in a hard problem
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'stuck', reveals: ['ball'], seg: [52.1, 55.9],
      stem: 'In the last complaint, what does the speaker mean about his job?',
      choices: ['He’s been given the boring part of the work', 'He’s been kept in one spot at the table',
                'He’s been getting nowhere with the work'], a: 0,
      cue: '「how come I’m」のすぐあと、-ing の前の語。',
      line: 'how come I’m *stuck dicing* when he gets to ball of melon?',
      said: '「なんで僕はさいの目切りで、あいつはメロンなの？」。',
      mean: 'be stuck ～ing ＝ 嫌な役を押しつけられている。how come ＝ why のくだけた形。',
      trap: 'stuck を「動けない」と取りやすい。-ing が続けば押しつけられた役。',
      use: 'I’m stuck working this weekend.（今週末は仕事に縛られてる）' },

    // R fix: V2 (blind 55 %) + C5 — "proud" was weak, now the teasing reading of the odd name; and the key is the
    //   same fact as p1's (his job is the worse one), so it shares p1's point
    // why: tired ← "stuck" heard as worn out; amused ← "ball of melon" is an odd name, and he repeats it
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'stuck', reveals: ['ball'], seg: [52.1, 55.9],
      stem: 'How does the man feel about the other man’s job?',
      choices: ['Envious; that job looks like more fun', 'Tired; he’s done his own for hours',
                'Amused; he’s teasing its odd name'], a: 0,
      cue: 'when he gets to のあとの話し方。',
      line: 'how come I’m stuck dicing *when he gets to* ball of melon?',
      said: '自分はさいの目切り、相手はメロンのくり抜き、と比べて不満を言う。',
      mean: 'gets to ～ ＝「〜させてもらえる」。相手の役をうらやむ言い方。',
      trap: '変な名前を繰り返すので冗談に聞こえるが、how come ～ when he gets to は不満の型。',
      use: 'How come he gets to go first?（なんであの人が先なの？）' },
  ]
};
