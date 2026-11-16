// REVIEW 2026-11-16: pass 9, fix 14, drop 3, new 0; ear checks 1
// Q: d1, g1, i1, a1, nt1 and i3 still blind-read at 70–85 % from the episode premise and Kelly's known chattiness, not
//   the choices; acceptable as is, or rebuild some?
// Q: nt1's key is an inference the clip only shows by Kelly's talk (no line names it); keep it as C2, or retire it?
// “Jim Works in the Back | The Office US” (the official The Office channel, Best of Season 2): Michael takes Jim's
// desk while his own carpet is changed, so Jim moves to the back next to Kelly; she talks nonstop, gets him to sound
// out the new guy for her, and Jim ends the day leaving a woman a voicemail asking her out.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈200 s (whisper loops "I'll talk to you
// later" from 199.6 s, and the captions put "phone" at 210.8 s). Untested: 70.8–78.6 s (Kelly's list, an answer to
// an unheard question), 79–87 s (the desk-chair errand: who sends whom, and "That's what I told him" reads two ways),
// 122.9–127.1 s ("depends if you like a little junk": unclear words and speaker), 162.2–163.7 s (Kelly's "I'm not a…"
// line), 164.1–167.7 s ("from the boat", which needs backstory), and 199–223 s (looped whisper; "Congratulations"
// is in whisper only).
// EAR CHECK: 19.1–31.0 s g1 i1 a1 s2 — "But there's definitely a desk open in the back" and "No, no, seriously, I
//   don't mind sharing" are taken as Michael's, "Which I guess I'll be taking" and "I'll be in the back" as Jim's (no
//   names; set by the turns)
import type { Clip } from '../types.ts';

export const jimBack: Clip = {
  id: 'jimback', video: 'hkoBZJcx2xs', title: 'Jim Works in the Back', dur: 224, wpm: 159,
  band: 'mid', tags: ['職場', '恋愛'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // why: computer ← "the one computer" comes next, read as the cause; painting ← a common office-works reason
    { id: 'd1', skill: 'detail', level: 'B1', point: 'carpet', seg: [9.7, 14.8],
      stem: 'Why does Michael want to sit with Jim?',
      choices: ['His carpet is being changed', 'His computer has stopped working', 'His room is being painted'], a: 0,
      cue: 'desk buddies のあと、while に続く部分。',
      line: 'I thought that we would be desk buddies *while they changed my carpet*.',
      said: '「カーペットを替える間、机仲間になれると思って」と言う。',
      mean: 'while ～ ＝「〜している間」。一時的な理由で、ジムの机に来たい。',
      trap: '次に computer が出てくるので機械の故障を思いやすいが、理由は while のあと。',
      use: 'Can I sit here while they clean?（掃除の間ここにいていい？）' },

    // why: Jim's carpet ← "they changed my carpet" heard without "my"; quiet place ← the back-room script
    { id: 'g1', skill: 'gist', level: 'B1', point: 'back', reveals: ['carpet'], seg: [9.7, 31.0],
      stem: 'Why does Jim end up working in the back?',
      choices: ['Michael is using Jim’s desk for now', 'The carpet at Jim’s desk is being changed',
                'Jim wants a quiet place to work today'], a: 0,
      cue: '最初の頼みと、「in the back」が出てくる流れ。',
      line: 'But there’s definitely *a desk open in the back*.',
      said: '上司が自分の部屋のカーペットを替える間ジムの机を使い、ジムは後ろの空き机へ。',
      mean: '「一緒に」と言いつつ後ろの机をすすめる。結局ジムが席をゆずる形。',
      trap: 'carpet でジムの席の工事と思いやすいが、my carpet は Michael の部屋。',
      use: 'Need me? I’ll be in the back.（用があれば後ろにいるよ）' },

    // R fix: V2 (blind 65–75 %) and K2, "Kelly keeps asking him for help" is half true (she does ask for help); now
    //   a broken-script distractor that no line supports
    // why: desk back ← the usual script after losing a desk, but he never asks; work in peace ← the back-room script
    { id: 'g2', skill: 'gist', level: 'B2', point: 'favors', seg: [9.7, 197.6],
      stem: 'Across the clip, what keeps happening to Jim in the back?',
      choices: ['Others keep pulling him into their plans', 'He keeps trying to get his own desk back',
                'He finally gets some work done in peace'], a: 0,
      cue: '机、恋の相談、また頼みごと。ジムが何をされ続けるか。',
      said: '席をゆずり、ケリーの話を聞かされ、恋の橋渡しまで頼まれる。',
      mean: '後ろの席でも静かにはならない。人の用事や恋に次々と巻きこまれる一日。',
      trap: '後ろの席＝静か、席を取り返す、という筋を思い浮かべやすいが、実際は頼まれごとの連続。',
      use: 'Sorry, can I bother you for a sec?（ごめん、ちょっといい？）' },

    // R fix: V2/K6 (blind 70–75 %), the key was the only polite, nuanced choice; both distractors are now conditional
    //   yeses
    // why: yes with a second computer ← "with the one computer" heard as a condition; yes but slow ← might / a little
    //   read literally as "possible but slow"
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'onecomp', reveals: ['might'], seg: [14.5, 18.95],
      stem: 'How does Jim answer the desk-buddies idea?',
      choices: ['He hints it won’t work, without saying no', 'He says yes, if they get a second computer',
                'He says yes, but warns it may be a bit slow'], a: 0,
      cue: '答えの最初の一文と、with に続く理由。',
      line: 'That might be *a little difficult* with *the one computer*.',
      said: '「パソコン1台だと、ちょっと難しいかもね」と答える。',
      mean: 'a little difficult は遠回しの no。理由を添えて角を立てずに断る。',
      trap: 'might や a little を「大変だができる」と取りやすい。difficult は断りの合図。',
      use: 'That might be a little tricky.（それはちょっと難しいかも）' },

    // why: may be ← same meaning, only the vowel differs; would be ← the -d sound of a conditional; must be ← a strong
    //   opener heard as certainty
    { id: 's1', skill: 'sound', level: 'B2', point: 'might', seg: [15.1, 18.95],
      stem: 'Fill the gap: “That ___ a little difficult.”',
      choices: ['might be', 'may be', 'would be', 'must be'], a: 0,
      cue: 'That のすぐあと、弱く短い2語。',
      line: 'That *might be* a little difficult with the one computer.',
      said: '「パソコン1台じゃ、ちょっと難しいかも」。',
      mean: 'might be が「マイビ」と短く、t はほぼ消える。可能性を弱く言う形。',
      trap: 'may be と意味が近い。母音が「アイ」なら might、「エイ」なら may。',
      use: 'It might be closed today.（今日は閉まってるかも）' },

    // R fix: V2 (blind 65–75 %), "confused" was a filler; now "hopeful" (Michael's "No, no" heard as the reply he
    //   fished for), so the segment runs on to Jim's "I'll be in the back"; its stem states g1's key: reveals `back`
    // why: pleased ← he volunteers, so he must want it; hopeful ← Michael's "No, no, seriously" read as what Jim was
    //   after, but Jim insists "I'll be in the back"
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'which', reveals: ['back'], seg: [18.4, 31.0],
      stem: 'How does Jim sound when he says he’ll take the open desk?',
      choices: ['Resigned; he can tell what Michael wants', 'Pleased; he’d rather work on his own',
                'Hopeful; he wants Michael to stop him'], a: 0,
      cue: '長い間のあと、Which で始まる一言。',
      line: '*Which I guess* I’ll be taking.',
      said: '間をおいて「…で、それを僕が使うってことね」と言う。',
      mean: 'Which で相手の文を受け、言われていない結論を自分で言う。I guess に「しかたない」。',
      trap: '自分から移るので喜んでいるように見えるが、I guess は「しかたない」の合図。',
      use: 'Which I guess means I’m driving.（つまり運転は僕ってことね）' },

    // R fix: V2/K6 (blind 70–80 %), the key explained itself and was the only "No"; now two "No"s, and the line
    //   states g1's key: reveals `back`
    // why: wants the back desk ← "a desk open in the back" heard as his own wish, but he's at Jim's desk; feels bad ←
    //   the Japanese frame: 遠慮 read as guilt
    { id: 'i1', skill: 'infer', level: 'C1', point: 'forshow', reveals: ['back'], seg: [18.4, 31.0],
      stem: 'When Michael says he doesn’t mind sharing, does he mean it?',
      choices: ['No; it’s for show, and Jim knows it', 'No; he’d rather take the back desk himself',
                'Yes; he feels bad taking Jim’s desk'], a: 0,
      cue: '「Oh.」のあと Michael が何をすすめたか。',
      line: 'But there’s definitely *a desk open in the back*. … No, no, seriously, *I don’t mind sharing*.',
      said: '後ろの空き机をすすめておき、ジムが移ると言うと「いやいや、一緒でいいよ」。',
      mean: '先に机をすすめているので「構わない」は形だけ。ジムも分かって引く。',
      trap: 'seriously は本気に聞こえるが、直前に後ろの机をすすめている。前の一言と合わせる。',
      use: 'No, no, really, it’s fine.（いやいや、本当に大丈夫）' },

    // why: I'd be ← the l of I'll is dark and weak, close to d; I'm ← "I'm taking" also fits; I was ← past, if the
    //   be is lost
    { id: 's2', skill: 'sound', level: 'B2', point: 'which', seg: [22.5, 26.15],
      stem: 'Fill the gap: “Which I guess ___ taking.”',
      choices: ['I’ll be', 'I’d be', 'I’m', 'I was'], a: 0,
      cue: 'guess のすぐあと、短くつながる部分。',
      line: 'Which I guess *I’ll be* taking.',
      said: '「それを僕が使うんだろうね」と言う。',
      mean: 'I’ll be ～ing ＝ この先そうなる流れ。I’ll の「ル」は弱く、be とつながる。',
      trap: 'l が弱く I’d に聞こえやすい。I’d なら「もし」の話。ここは決まった流れ。',
      use: 'I guess I’ll be working late.（たぶん残業になるな）' },

    // R fix: V2, "for the day" was the common-sense pick next to an hour / for good; "the morning" is now as short
    // keep: short to long. why: the morning ← "just" makes it sound brief; the week ← the/the, only the vowel
    //   differs; for good ← "moving back here" heard as a real move
    { id: 'n1', skill: 'number', level: 'B1', point: 'day', seg: [37.4, 42.1], keep: true,
      stem: 'How long does Jim say he’s moving to the back?',
      choices: ['For the morning', 'For the day', 'For the week', 'For good'], a: 1,
      cue: '「moving back here?」への答え、just for のあと。',
      line: 'Are you moving back here? — Um, *just for the day*.',
      said: '「ここに引っ越し？」に「今日だけね」と答える。',
      mean: 'just for the day ＝ 今日1日だけ。一時的だと伝えている。',
      trap: 'day と week は母音で区別。for good（ずっと）なら「グッ」と強く聞こえる。',
      use: 'I’m only here for the day.（今日だけここにいるんだ）' },

    // C2: what Toby was really getting away from
    // anchor: 42.5–51.3 s "Toby used to sit there, but then he had to move over there because of an allergy. — Allergy
    //   to the desk? — Weird." He only moved "over there"; from 53.2 s Kelly talks nonstop, and at 136.2 s Jim sums her
    //   up: "She said lots of things."
    // R fix: S3, the cue's "Kelly" was only in the key; S4, 22.5 s cut to 15 s (the jump to the closet doors right
    //   after "Weird" is the evidence); C2 bans two distractors on one misreading (both took the allergy literally),
    //   so one is now "right target, wrong reason"
    // why: the desk ← "allergy" taken at face value, as Jim's question frames it; a fight ← right target, wrong
    //   reason: nothing in the clip says they fell out, while her talk starts at once
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'allergy', reveals: ['lots'], seg: [42.2, 57.2],
      stem: 'What does the clip hint Toby was really getting away from?',
      choices: ['Sitting next to Kelly and her talking', 'Something at that desk that made him sick',
                'Sitting by Kelly after a fight with her'], a: 0,
      cue: '「Weird.」のあと、話がどこへ飛ぶか。',
      line: 'he had to *move over there* because of an allergy. — *Allergy to the desk?* — Weird.',
      said: '「トビーはアレルギーで向こうへ移った」に、ジムが「机のアレルギー？」。直後からケリーが話し続ける。',
      mean: '机のアレルギーはありえず、移った先も同じ部屋。隣のおしゃべりから離れたかった、とほのめかす。',
      trap: 'allergy を本当の病気と取りやすい。ありえない理由のあとは、何が起きるかを聞く。',
      use: 'He moved desks for “health reasons.”（「健康上の理由」で席を替えたんだって）' },

    // R fix: S3, the cue's "but" was only in the key ("anything but shy"); V2 (blind 75 %), the distractors are now
    //   "She says…" claims, as specific as the key
    // why: Jim is shy ← "I'm too shy" heard as "you're too shy" (weak pronouns); likes him too much ← "so much" and
    //   "too" heard as "too much to ask"
    { id: 'h3', skill: 'humor', level: 'C1', point: 'shy', seg: [104.3, 108.95],
      stem: 'Why does Kelly’s reason for not asking him herself get a laugh?',
      choices: ['She claims to be shy while begging loudly', 'She says Jim is the shy one, not her',
                'She says she likes him too much to ask'], a: 0,
      cue: '「I would do it」のあとの理由と、その言い方。',
      line: 'I would do it, but *I’m too shy*. *Please, Jim, please*…',
      said: '「自分で言えばいいけど、恥ずかしがり屋だから」と言い、また「お願い」。',
      mean: '大声で何度も頼む人が「恥ずかしがり屋」と言う。言葉と様子の落差が笑い。',
      trap: 'too ～ で「好きすぎて話せない」と取りやすい。but のあとの理由は shy だけ。',
      use: 'I’d do it myself, but I’m too shy.（自分でやるけど、恥ずかしくて）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'notmuch', seg: [113.95, 116.4],
      stem: 'Type the reply to “What’s up?”: “___.” (3 words)', answer: 'not that much',
      cue: '「What’s up?」のすぐあと。',
      line: 'What’s up? — *Not that much*.',
      said: '「どう？」に「別に」と返す。',
      mean: 'Not that much ＝「特に何も」。What’s up? への定番の返事で、本題の前置き。',
      trap: 'not の t と that がつながり「ナッザッ」と短い。much の前に2語あると数えて書く。',
      use: 'What’s up? — Not much, you?（どう？ — 別に、そっちは？）' },

    // R fix: V2/K6 (blind 70 %), the key was the only two-part choice and named Kelly's talking (nt1's key); all
    //   three are now "It …" one-part readings
    // why: bad things ← "lots of things" heard as a hint at gossip; ask her yourself ← a dodge read as "go ask her"
    { id: 'h4', skill: 'humor', level: 'C1', point: 'lots', seg: [134.0, 137.7],
      stem: 'Why does Jim’s answer to “Did she say something?” get a laugh?',
      choices: ['It’s true, but it tells him nothing useful', 'It hints she said some bad things about him',
                'It tells him to go and ask her himself'], a: 0,
      cue: '質問の something と、答えの言い方の違い。',
      line: 'Did she say something? — *She said lots of things*.',
      said: '「彼女、何か言ってた？」に「いろんなことを言ってたよ」と答える。',
      mean: 'うそではないが答えになっていない。止まらないケリーのおしゃべりを知っていると、なおおかしい。',
      trap: '悪口などの含みを探しやすいが、ここは質問をかわしつつ本当のことを言う、とぼけた返事。',
      use: 'Well, she said a lot of things.（まあ、いろいろ言ってたよ）' },

    // why: group of friends ← hang out = 友だちと遊ぶ; sitting around ← hang out = ぶらぶらする, a place reading
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'casual', seg: [137.55, 144.2],
      stem: 'In his question, what is the second choice he gives for Kelly?',
      choices: ['Seeing each other casually, no promises', 'Going out with a group of friends',
                'Sitting around the office together'], a: 0,
      cue: 'long-term thing と並べた、もう一つの言い方。',
      line: 'a long-term thing or she’d be cool *just hanging out*?',
      said: '「長い付き合いか、気軽に会うだけか」と並べる。',
      mean: 'just hanging out ＝ 付き合うと決めず、気軽に会う関係。long-term の反対側。',
      trap: 'hang out を「ぶらぶらする」とだけ覚えていると、場所の話に聞こえる。',
      use: 'We’re just hanging out, nothing serious.（ただ会ってるだけ、本気じゃないよ）' },

    // why: casual ← she later asks Jim to say she's "up for anything"; wait and see ← "who knows" style hedging
    { id: 'd5', skill: 'detail', level: 'B1', point: 'longterm', reveals: ['anything'], seg: [152.9, 158.8],
      stem: 'What does Kelly say she wants?',
      choices: ['To fall in love and have a family', 'To keep things casual for now', 'To wait and see what he wants'],
      a: 0,
      cue: 'Oh のあと、すぐに言う一語と、続く三つ。',
      line: 'Oh, *long-term, definitely*. Fall in love, have babies…',
      said: '「長期に決まってる。恋をして、子どもを作って、ずっと一緒」。',
      mean: '迷わず long-term。definitely で、はっきり望みを言っている。',
      trap: '後で up for anything と言うので気軽な関係に思えるが、最初の答えが本音。',
      use: 'Definitely, no question.（もちろん、迷わずに）' },

    // R fix: V2 (blind 60–75 %), rebalanced lengths and wording; V5, the reason is never said, so C1 (implicit stance)
    // why: tell him herself ← "don't tell him" heard as "I'll do it"; not sure ← the "like" and "okay?" hedges read as
    //   doubt
    { id: 'i3', skill: 'infer', level: 'C1', point: 'donttell', reveals: ['longterm'], seg: [152.9, 160.2],
      stem: 'Why does Kelly want Jim to keep her answer from him?',
      choices: ['It could make him back off', 'She’d rather tell him herself', 'She hasn’t really decided yet'], a: 0,
      cue: 'but のあと、何を言わないでほしいか。',
      line: '…spend every second together. *But don’t tell him that*, okay?',
      said: '本音を一気に言ったあと、「でもそれは彼に言わないで」と頼む。',
      mean: '重すぎる望みを知られると引かれる、と分かっている。だから隠したい。',
      trap: '言わないで＝自分で言いたい、と取りやすいが、言ったばかりの中身が重すぎるのが理由。',
      use: 'Don’t tell her I said that, okay?（私が言ったって言わないでね）' },

    // R fix: V2 (blind 50–55 %), "up late" was the only literal trap and the key the only casual choice; the second
    //   distractor now reads "up for" as "ready for" her real wish
    // why: ready for something serious ← "up for" read as "ready for", and her real wish came just before; up late ←
    //   up = 起きている
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'anything', seg: [158.8, 162.45],
      stem: 'What does Kelly want Jim to tell him about her?',
      choices: ['That she’s open to whatever he wants', 'That she’s ready for something serious',
                'That she’s usually up late at night'], a: 0,
      cue: 'Just tell him のあと、like に続く言い方。',
      line: 'Just tell him I’m, like, *up for anything*.',
      said: '「何でもオッケーな感じって伝えて」と頼む。',
      mean: 'up for anything ＝ 何でも乗り気、こだわりがない。重い本音を隠して、気軽な人に見せたい。',
      trap: 'up を「起きている」と取ると話がずれる。up for ～ は「〜に乗り気」のセット。',
      use: 'I’m up for anything tonight.（今夜は何でもいいよ）' },

    // R fix: V2 (blind 60–80 %), "a woman" was only in the key; a distractor now shares it
    // why: for a coworker ← he has just been matchmaking; about work ← "corporate directory" sounds like business
    { id: 'g3', skill: 'gist', level: 'B1', point: 'call', reveals: ['assume'], seg: [163.6, 197.6],
      stem: 'What is Jim doing in the phone message at the end?',
      choices: ['Asking a woman out on a date', 'Setting up a date for his coworker', 'Asking a woman to call him about work'],
      a: 0,
      cue: '名乗ったあと、なぜ電話したかを言う部分。',
      line: 'you wanted me to *ask you out*, all right?',
      said: '会社の名簿で番号を知ったと言い、デートに誘う留守電を残す。',
      mean: 'ask ～ out ＝ デートに誘う。��事ではなく個人的な誘いの電話。',
      trap: 'corporate directory（社内名簿）で仕事の電話に思えるが、番号の入手先の話。',
      use: 'Are you asking me out?（それってデートの誘い？）' },

    // R fix: V2 (blind 60–80 %), the stem said "got his joke", so the only joking reply was the key; the stem now
    //   asks what matches his meaning, and a sincere yes joins the correction (sincerity flip both ways). S4: 22.7 s
    //   cut to 9.5 s (the joke itself is the anchor), so "Yikes" leaves the line and `yikes` the reveals; the line's
    //   "ask you out" is g3's key: reveals `call`
    // C2: which reply would match what he meant
    // anchor: 170.1–176.6 s "I got your number from the corporate directory and — well, I was assuming that you
    //   probably gave it to them because you wanted me to ask you out": a company list everyone is on, read as a
    //   personal invitation; 190.1 s "Yikes": he hears how it sounds
    // why: the company did ← the joke taken as a real claim and corrected; a glad yes ← the joke taken as a real guess
    //   and confirmed (both sincerity flips)
    { id: 'nt2', skill: 'pragma', level: 'C2', point: 'assume', reveals: ['call'], seg: [168.4, 177.9],
      stem: 'Which reply from Brenda would match what Jim meant about the directory?',
      choices: ['Ha, right, that’s the only reason I’m in there.', 'Actually, the company put my number in there.',
                'Yes! I was hoping you’d see it and call.'], a: 0,
      cue: '名簿の話の「well」のあと、理由の付け方。',
      line: '…from the corporate directory and, well, *I was assuming* that you probably gave it to them *because you wanted me to ask you out*',
      said: '社内名簿で番号を見たと言い、「僕に誘ってほしくて載せたんだと思って」と続ける。',
      mean: '名簿にはみんな載っている。わざと都合よく読みかえた冗談なので、分かった人は冗談に乗って返す。',
      trap: '本気の主張と取ると、事実で正すか、本気でうなずきたくなる。冗談には、事実でなく冗談で返す。',
      use: 'Ha, you caught me.（はは、ばれたか）' },

    { id: 'x2', skill: 'dict', level: 'B2', point: 'callback', seg: [178.6, 180.8],
      stem: 'Type what Jim says: “Um, so ___.” (5 words)', answer: 'give me a call back',
      cue: 'Um, so のあと。速く、語がつながる。',
      line: 'Um, so *give me a call back*.',
      said: '「じゃあ、折り返し電話して」と頼む。',
      mean: 'give me a call back ＝ 折り返し電話して。give me が「ギミ」とつながる。',
      trap: 'give me と a がまとめて「ギミア」に聞こえ、語の数を落としやすい。5語あると数えて書く。',
      use: 'Give me a call when you land.（着いたら電話して）' },

    // R fix: K7/C7, the key was the longest choice (blind 55 %); now three of equal length
    // why: what she said ← said = 言った; forgets the name ← "said" heard as a filler before the noun
    { id: 'h5', skill: 'humor', level: 'C1', point: 'said', seg: [180.7, 184.6],
      stem: 'What makes Jim’s remark about getting his number funny?',
      choices: ['He uses a stiff legal word in a casual call', 'He asks her to look up what she said before',
                'He can’t remember what the list is called'], a: 0,
      cue: 'directory の直前の、短い一語。',
      line: 'You can get my number from *said directory*.',
      said: '「僕の番号は、前述の名簿で調べられます」と言う。',
      mean: 'said ＋名詞 ＝「前述の」。契約書のような堅い言い方を、デートの誘いに使うずれが笑い。',
      trap: 'said を「言った」と取ると、彼女の発言の話に聞こえる。名詞の前の said は「その」。',
      use: 'Please return said item by Friday.（前述の品を金曜までにご返却ください）' },

    // why: a text ← "sent you one" heard without "email"; will send ← "just" heard as "just about to"
    { id: 'd4', skill: 'detail', level: 'B1', point: 'email', seg: [184.7, 188.8],
      stem: 'Besides the directory, where does Jim say she can find his number?',
      choices: ['In an email he just sent', 'In a text he just sent her', 'In an email he’ll send tonight'], a: 0,
      cue: 'check your のあと、because に続く部分。',
      line: 'or just *check your email*, because *I just sent you one*.',
      said: '「メールを見てくれてもいい、さっき送ったから」と付け足す。',
      mean: '電話の前に、もうメールも送っている。少し前のめりな誘い方。',
      trap: 'just を「これから」と取ると未来に聞こえる。sent は過去で、もう送ってある。',
      use: 'Check your email. I just sent it.（メール見て、今送ったから）' },

    // R fix: V2 (blind 60–70 %) and C5, the stem said "the email" (d4's key); the stem now names the end of the
    //   message, and "surprised by a reply" (a filler) is now "relieved"
    // why: relieved ← the hard part (asking) is said, so it can sound like relief; annoyed ← a voicemail = she didn't
    //   pick up
    { id: 'a4', skill: 'attitude', level: 'B2', point: 'yikes', reveals: ['callback'], seg: [187.4, 192.3],
      stem: 'Near the end of his message, how does Jim feel?',
      choices: ['Embarrassed by how the message is going', 'Relieved that the hard part is finally over',
                'Annoyed that she didn’t pick up the phone'], a: 0,
      cue: 'メールの話の直後の一語と、最後の I hope。',
      line: 'because I just sent you one. *Yikes*. Uh, give me a call back. *I hope*.',
      said: 'メールの話のあと「うわ」ともらし、「折り返してね…できれば」と続ける。',
      mean: 'Yikes ＝「うわ、まずい」。自分の留守電の重さに気づいて照れている。',
      trap: '言い終えてほっとしたようにも聞こえるが、Yikes と I hope は自信のなさの合図。',
      use: 'Yikes, that came out wrong.（うわ、変な言い方になっちゃった）' },
  ]
};
