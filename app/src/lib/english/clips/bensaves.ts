// REVIEW 2026-11-16: pass 7, fix 15, drop 1, new 1; ear checks 3
// REVIEW open: s1 now has 4 choices (has to / had to / used to / has got to); the 48.6 s ear check should also confirm no "got"
// “Ben saves the day | Parks and Recreation” (the official Parks and Recreation channel, Season 2): the state auditors
// arrive at Leslie's kids' concert; Chris praises it and Ben shuts it down, Leslie goes ahead anyway, Freddy Spaghetti
// drops out, Andy steps in and breaks his arm, a stand-in performs, and Freddy turns up after all for a better offer.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 233 s; song and music after. Names said:
// Ben (42–55 s), Leslie (67, 103.9 s), Andy (102, 104.7 s), Renata (179 s, she names herself). Chris is never named; his
// lines are taken from the scene (the warm greeting, "my partner Ben", "Ben says no"). The w1 key rests on the words
// "Ben says no", not on voices. Untested on purpose: 0–8 s and 10–20 s speakers (unnamed; "the Russians" joke), 26–28 s
// (captions "and Perkins", whisper "Aunt Perkins"), 66.7–71 s (captions garbled, whisper "Freddy's Spaghetti ain't
// coming"), 80–89 s (crowd mumble), 108–121 s (the "Sex Hair" song bit), 140.6–147 s (who says "That's the side that
// hurts"; whisper "keep him over an eye" vs captions "keep them overnight"), 189–195 s ("sauce everywhere", captions
// garbled), 209–214 s (Freddy's "Hi, kids!" is whisper only), 223–233 s (song lyrics).
// EAR CHECK: 48.6 s s1 — "has to" said "hasta" (both sources have "has to")
// EAR CHECK: 75.1 s r1 — the cut falls after "may not sing" and before "but" (captions: "sing" 74.34, "but" 75.42)
// EAR CHECK: 160.6 s x1 — "got to find somebody" (both sources); it may be said "gotta", which the app scores the same
import type { Clip } from '../types.ts';

export const benSaves: Clip = {
  id: 'bensaves', video: 'CmV2GynaO2g', title: 'Ben saves the day', dur: 253, wpm: 146,
  band: 'slow', tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 55 %, right): "local vendors" (a later scene word) was a filler; now "the state police",
    //   where "state" is heard and the rest is lost.
    // why: Russians ← said first, as a joke guess; state police ← "the state…" caught, "auditors" lost
    { id: 'd1', skill: 'detail', level: 'B1', point: 'auditors', seg: [9.7, 17.9],
      stem: 'Who is coming, according to the warning?',
      choices: ['The state auditors', 'The Russians', 'The state police'], a: 0,
      cue: '「No,」のすぐあと。',
      line: 'Who, the Russians? — No, *the state auditors*.',
      said: '「来るぞ！」「ロシア人？」「いや、州の監査官」というやりとり。',
      mean: 'auditor ＝ 会計を調べる監査役。お金の使い方を調べに来る人たち。',
      trap: '先に出る Russians は冗談の当てずっぽう。No のあとが答え。',
      use: 'The inspectors are coming tomorrow.（明日、検査の人が来る）' },

    // R drop: nt1 (K1, V2): blind 60 %, right (g1's stem says the concert is called off). And "Nothing; he means every
    //   word" is defensible: the same voice then says "Damn! That's terrible news", so the segment doesn't settle that
    //   Chris knew and held it back. Never shipped, so deleted; nt3 (new) keeps C2 at 2.

    // R fix: V2 (blind 75 %, right): "agrees and calls the concert off" restated the stem; now "let the crowd decide"
    //   and "a new date". Drops `shutdown` from reveals (that point left with nt1).
    // why: crowd decides ← "Everyone here believes that what we're doing is essential" heard as a call for a vote; new
    //   date ← the usual "postpone, don't cancel" script
    { id: 'g1', skill: 'gist', level: 'B1', point: 'goeson', seg: [43.7, 66.7],
      stem: 'What does Leslie do when the concert is called off?',
      choices: ['She overrules him and says it will go ahead', 'She asks him to let the crowd decide on it',
                'She accepts it but promises a new date soon'], a: 0,
      cue: '「Ben」と呼びかけたあとの最初の文。',
      line: 'It’s *not canceled*. *We’re putting it on*, okay?',
      said: '中止と言われても、「中止じゃない。やるわよ」と言い返す。',
      mean: 'put on ＝ 公演を行う。決定に従わず、続けると宣言している。',
      trap: 'canceled は not 付き。Everyone here believes は決を取る話ではない。',
      use: 'We’re putting on a show this weekend.（今週末、ショーをやる）' },

    // R fix: V2 (blind 55 %, right): "actually" in the stem pointed away from the speaker who repeats the no. Stem
    //   reworded; seg end 53.9 → 53.8 so Leslie's "No" (54.0) isn't clipped; `shutdown` dropped from reveals.
    // why: Chris ← he says "no" out loud too ("Ben says no"); Leslie ← she argues with the decision right after
    { id: 'w1', skill: 'who', level: 'B1', point: 'saysno', seg: [45.5, 53.8],
      stem: 'Who turns down the idea of a solution?',
      choices: ['Ben, when Chris asks him', 'Chris, speaking for Ben', 'Leslie, to the crowd'], a: 0,
      cue: '「solution」の問いかけのあとの短い返事。',
      line: '*Ben says no.* I’m sorry, everyone.',
      said: 'Chris が「方法はあるよね、Ben？」と聞き、Ben が「ない」。',
      mean: 'Chris は Ben の答えをくり返しているだけ。決めたのは Ben。',
      trap: 'Chris も no と言うので彼が決めたように聞こえる。Ben says が答え。',
      use: 'My boss says no. Sorry.（上司がだめだって。ごめんね）' },

    // R fix: V2, GUIDE §9.5 (blind 70 %, right): "there have to be a solution" isn't grammatical, so grammar alone
    //   picked the key. Now 4 grammatical sound-alikes: has to / had to / used to (-sta ending) / has got to.
    // why: had to ← the weak "has" loses its s; used to ← "-sta" heard, the first sound lost; has got to ← the common
    //   "there's got to be" pattern, a "got" added that isn't said
    { id: 's1', skill: 'sound', level: 'B2', point: 'hasto', seg: [46.5, 50.2],
      stem: 'Fill the gap: “Surely there ___ be a solution, Ben?”',
      choices: ['has to', 'had to', 'used to', 'has got to'], a: 0,
      cue: '「there」のすぐあと、短くつながる二語。',
      line: 'Surely there *has to* be a solution, Ben?',
      said: '「きっと何か方法があるはずだよね、Ben？」と聞いている。',
      mean: 'has to が「ハスタ」とつながる。s は次の t に吸収されて短い。',
      trap: 'had to は過去、used to は「昔は」。どれも「〜スタ」に近いので、頭の音と got の有無を聞く。',
      use: 'There has to be a better way.（もっといい方法があるはず）' },

    // R fix: V2 (blind 50 %, right): parallel "It sets up…" choices. seg start 53.3 → 51.7, because 53.3 cut into
    //   "canceled" (captions 53.3).
    // why: show him ← "here's" read as handing over a thing; backs his view ← a preface heard as agreement (日本語の「そうですね」)
    { id: 'm1', skill: 'marker', level: 'B2', point: 'thing', reveals: ['goeson'], seg: [51.7, 57.15],
      stem: 'When Leslie first answers Ben, what does her opening phrase do?',
      choices: ['It sets up a point against his view', 'It sets up a point that backs his view',
                'It sets up an item she wants to show him'], a: 0,
      cue: '文の頭の数語と、最後の though。',
      line: 'No, *here’s the thing, though*, Ben. It’s not canceled.',
      said: '「でもね、Ben」と切り出して反対する。',
      mean: 'Here’s the thing ＝「問題はね」。though が付くと「でも」の合図になり、反論が来る。',
      trap: 'here を「ここに物がある」と取りやすいが、何も渡していない。though は反対の印。',
      use: 'Here’s the thing, though. I’m broke.（でもね、お金がないんだ）' },

    // why: tickets ← a concert usually sells tickets (script); vendors paid ← "local vendors" heard, "donated" missed
    { id: 'd2', skill: 'detail', level: 'B2', point: 'donated', reveals: ['goeson'], seg: [56.8, 66.7],
      stem: 'Which reason does Leslie give for going ahead?',
      choices: ['Everything was given to them for free', 'All the tickets have already been sold',
                'The local vendors have all been paid'], a: 0,
      cue: '「stage」のあと、vendors の前。',
      line: 'the stage is already built. Everything was *donated for free* by local vendors.',
      said: '「舞台はもう建ってるし、全部地元の業者の無料提供」と言う。',
      mean: 'donate ＝ 寄付する。お金がかかっていないから中止の理由はない、という主張。',
      trap: 'vendors が聞こえると「支払い済み」に取りやすい。donated が要点。',
      use: 'All the food was donated.（食べ物は全部寄付だった）' },

    // R fix: V2 (blind 65 %, right): the key was the only "but". Now two "but" choices, so what follows it decides.
    // why: plea ← a "but" heard, then the usual "please stay"; apology ← "may not sing" heard as the start of bad news
    { id: 'r1', skill: 'predict', level: 'B2', point: 'cooler', seg: [71.9, 75.1], then: [75.1, 81.1],
      stem: 'After “Freddy Spaghetti may not sing,” what kind of line comes next?',
      choices: ['A “but”, then a promise of something better', 'A “but”, then a plea for the crowd to stay',
                'An apology, then a promise of a new date'], a: 0,
      cue: 'may not の形は、どんな話の前に来やすい？',
      line: 'Freddy Spaghetti may not sing, *but something much cooler* is going to happen.',
      said: '「歌わないかもしれない。でも、もっとすごいことが起こる」と続ける。',
      mean: 'A may not 〜, but B ＝「A はなくても B がある」。悪い知らせのあとに希望を出す型。',
      trap: '謝罪やお願いを予想しやすいが、but のあとは「もっと良いもの」の型。',
      use: 'It may not be fancy, but it’s tasty.（豪華じゃないけど、おいしいよ）' },

    // R fix: V2 (blind 50 %, right): parallel "She makes a big promise, then…" choices.
    // why: Freddy may sing ← "may not" heard as "may"; bigger ← "much cooler" heard as raising the stakes
    { id: 'h2', skill: 'humor', level: 'C1', point: 'cooler', seg: [71.9, 81.1],
      stem: 'What makes Leslie’s promise to the crowd funny?',
      choices: ['She makes a big promise, then admits she isn’t sure', 'She makes a big promise, then says Freddy may sing',
                'She makes a big promise, then makes it bigger'], a: 0,
      cue: '約束の文の最後に付く、短い二語。',
      line: 'something much cooler is going to happen. *I think.*',
      said: '「もっとすごいことが起こる」と言い切ったあと、小さく「たぶん」と付け足す。',
      mean: '自信満々の約束の最後に I think。実は何の案もないとばれるのが笑い。',
      trap: '前半だけ聞くと本当に計画があるように聞こえる。文末の短い一言で中身が変わる。',
      use: 'It’ll be fine. I think.（大丈夫だよ。たぶん）' },

    // R fix: V2 (blind 55 %): the 2×2 set (library/school × Eagleton/Pawnee) made the key the one in the middle.
    //   All three are now in Eagleton.
    // why: school ← a kids' singer plays schools (script); mall ← a kids' gig at a shopping mall (script)
    { id: 'd3', skill: 'detail', level: 'B1', point: 'gig', seg: [89.8, 95.5],
      stem: 'Where is Freddy playing instead?',
      choices: ['At a library in Eagleton', 'At a school in Eagleton', 'At a mall in Eagleton'], a: 0,
      cue: '「another gig」のあと、二回に分けて言う場所。',
      line: 'he took another *gig in Eagleton*. — Oh. — *At a library*.',
      said: '「こっちが中止したら、イーグルトンの別の仕事を取った。図書館で」と言う。',
      mean: 'gig ＝ ミュージシャンの1回の仕事。場所を二回に分けて伝え、相手の反応を大きくしている。',
      trap: '子ども向けの歌手なので学校を想像しやすい。最後に足された一語を聞く。',
      use: 'I’ve got a gig on Friday.（金曜にライブの仕事がある）' },

    // R fix: K1/V1 (blind 60 %, right): "joking horror" vs "real fear" leans on backstory (Leslie's real feud with
    //   the library), so a fan could defend "real". The key is now the hyperbole and the switch, which the words show;
    //   "too upset to go on" is refuted by "we're not giving up".
    // why: too upset ← "the worst place I can imagine" heard as despair; glad ← "Oh!" heard as good news
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'literally', reveals: ['gig'], seg: [94.9, 101.9],
      stem: 'How does Leslie react to the news about the library?',
      choices: ['She overstates her disgust, then moves on', 'She is upset enough to think of giving up',
                'She is glad that Freddy found other work'], a: 0,
      cue: '「worst」の前の強める語と、そのあとの切り替え。',
      line: 'That’s *literally the worst place I can imagine*. Okay, guys, we’re not giving up on this.',
      said: '「想像できる最悪の場所よ」と言ってから、「でも、あきらめない」とすぐ切り替える。',
      mean: 'literally は強調で、大げさな言い方。嘆いてもすぐ次へ進む。',
      trap: 'literally を「文字どおり」と取ると本気の絶望に聞こえる。会話では強めの一語。',
      use: 'I literally waited forever.（マジで永遠に待った）' },

    // why: excited but nervous ← he is the backup act, so stage nerves; angry ← "I don't know, Leslie" heard as irritation
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'mood', seg: [101.7, 108.0],
      stem: 'How does Andy feel when Leslie first asks him to play?',
      choices: ['Not really in the mood to play', 'Excited but a little nervous', 'Angry that she asked him so late'], a: 0,
      cue: '「I don’t know, Leslie」のあとの文。',
      line: 'I *don’t really feel like playing* right now.',
      said: '「うーん、今はあまり弾く気分じゃない」と答える。',
      mean: 'feel like 〜ing ＝「〜したい気分」。怒ってはいないが、乗り気でない。',
      trap: 'I don’t know は不満にも聞こえるが、ここは迷いの声。feel like の否定が気持ち。',
      use: 'I don’t really feel like going out.（あまり出かける気分じゃない）' },

    // R fix: V2 (blind 60 %, right): parallel "Her big talk on solutions…" choices; "mocking" filler out.
    // why: loses her place ← the sentence breaks off at "there's nothing—"; hopeless ← "there's nothing" heard as the
    //   end ("nothing we can do")
    { id: 'h4', skill: 'humor', level: 'C1', point: 'solution', seg: [124.5, 135.8],
      stem: 'What makes the end of Leslie’s speech funny?',
      choices: ['Her big talk on solutions is cut off by a new problem', 'Her big talk on solutions stops as she loses her place',
                'Her big talk on solutions turns into a hopeless one'], a: 0,
      cue: '「there’s nothing」で切れたあとの声。',
      line: 'there’s *always a solution* if your motives are pure… there’s nothing— — *Ow! My arm!*',
      said: '「動機が正しければ解決策は必ずある」と言いかけた瞬間、「腕が！」と叫び声。',
      mean: '「何も問題ない」と言い切る途中で次の問題が起きる。言葉と出来事のずれが笑い。',
      trap: 'there’s nothing で詰まったようにも聞こえるが、切れた理由は直後の叫び声。',
      use: 'What could go wrong?（何が問題になるっていうの？）' },

    // why: two ← the number heard first, for the arm; six ← the two numbers added together
    { id: 'n1', skill: 'number', level: 'B1', point: 'bones', seg: [136.3, 142.6], keep: true,
      stem: 'How many bones are broken in his hand?',
      choices: ['Two', 'Four', 'Six'], a: 1,
      cue: '「in your hand」の直前の数。',
      line: 'two broken bones in your right arm and *four in your hand*.',
      said: '「右腕に2か所、手に4か所の骨折」と医師が言う。',
      mean: 'and のあとは bones を省いている。four (bones) in your hand ＝ 手に4本。',
      trap: '先に聞こえる two は腕の数。and のあとの数字と場所をセットで聞く。',
      use: 'Two in the morning, one at night.（朝に2錠、夜に1錠）' },

    // why: two ← "ten" with a weak vowel; thirty ← the doctor's "30 years" comes right after
    { id: 'n2', skill: 'number', level: 'B1', point: 'tenmin', seg: [147.3, 153.8], keep: true,
      stem: 'How soon does Andy want to be fixed?',
      choices: ['In two minutes', 'In ten minutes', 'In thirty minutes'], a: 1,
      cue: '「in the next」のあと。',
      line: 'is there any chance you can fix me *in the next 10 minutes*?',
      said: '「次の10分で治してもらえる可能性ってある？」と聞く。',
      mean: 'in the next 〜 minutes ＝「これから〜分以内に」。本番に間に合わせたい。',
      trap: 'すぐあとに医師の 30 が聞こえるので混ざりやすい。誰が言った数字かを分けて聞く。',
      use: 'Can you be here in the next hour?（1時間以内に来られる？）' },

    // R fix: V1/V2 (blind 50 %, right): the key was the only "no", and common sense says no doctor fixes broken bones
    //   in ten minutes. Now two "no" choices, so the sarcasm of "Sure… just" decides, not common sense.
    // why: thirty years to heal ← "30 years" taken as a real healing time; new treatment ← "Sure" + "advance medical
    //   science" taken literally
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'sure', seg: [147.3, 153.8],
      stem: 'What is the doctor’s answer to Andy’s request?',
      choices: ['A no, by joking that it’s impossible', 'A no, saying it takes thirty years to heal',
                'A yes, using a brand-new treatment'],
      a: 0,
      cue: '「Sure」のあとの「just」と、その年数。',
      line: '*Sure. I’ll just advance medical science 30 years.*',
      said: '「いいよ。医学を30年ほど進めればいいだけだ」と答える。',
      mean: 'Sure ＋ありえない条件 ＝ 皮肉の「無理」。just で簡単なふりをしている。',
      trap: 'Sure を「はい」、30年を本当の期間と取りやすい。後ろの条件がありえないなら冗談の断り。',
      use: 'Sure, I’ll just print money.（はいはい、お金を刷ればいいのね）' },

    // anchor: 150.4–153.3 s "Sure. I'll just advance medical science 30 years.": "just" plus an impossible job
    // R fix: V2 (blind 55 %, right): the bargaining reply read as obviously off; now "thirty minutes", n2's near
    //   sound, which sounds like a real plan.
    // why: "Great!" ← the "Sure" taken as a real yes (the sincerity flip; Andy really says it); thirty minutes ← "30
    //   years" heard as minutes, the joke missed
    { id: 'nt2', skill: 'pragma', level: 'C2', point: 'sure', reveals: ['tenmin'], seg: [147.3, 153.8],
      stem: 'Which reply from Andy would show he got the doctor’s point?',
      choices: ['Right. So no show for me tonight.', 'Great! How soon can we start?', 'Okay. So I can play in thirty minutes?'],
      a: 0,
      cue: '頼みの「10分」と、返事の「30年」の差。',
      line: 'Sure. I’ll *just* advance medical science *30 years*.',
      said: '「10分で治して」と頼まれ、医師は「医学を30年進めればいいだけ」と返す。',
      mean: '10分の頼みに30年の進歩という返し。不可能だと分かったなら、今夜はあきらめる返事が合う。',
      trap: 'Sure にお礼で返すと皮肉を本気に取ったことになる。30年を30分と聞くのも同じ。返事は相手の意図に返す。',
      use: 'Right, so that’s a no.（なるほど、つまりダメってことね）' },

    // R fix: V2 (blind 55 %, right): the key was the only specific choice; all three now say what happened to the name.
    // why: never played ← "tried once" missed; better ← "awful" missed and the new name heard as a fresh start
    { id: 'h6', skill: 'humor', level: 'C1', point: 'ratmouse', seg: [153.8, 162.5],
      stem: 'Why is Andy’s answer about his band funny?',
      choices: ['Without him, they just flipped the name and were awful', 'Without him, they kept the name but never played',
                'Without him, they flipped the name and got better'], a: 0,
      cue: '「They tried once」のあとの名前と評価。',
      line: 'They tried once. They’re called *Rat Mouse*, and *they’re awful*.',
      said: '「一度やった。名前はラット・マウスで、ひどかった」と答える。',
      mean: 'Mouse Rat を逆にしただけの名前。中身も工夫もないのが笑い。',
      trap: 'tried once を聞き落とすと「やったことがない」に取りやすい。最後の awful が評価。',
      use: 'We tried once. It was a mess.（一度やったけど、ひどかった）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'somebody', seg: [158.95, 162.7],
      stem: 'Type the line: “But you’ve ___.” (4 words)', answer: 'got to find somebody',
      cue: '「they’re awful」のあと、「But you’ve」に続く。',
      line: 'But you’ve *got to find somebody*.',
      said: '「でも、誰か見つけなきゃ」と言っている。',
      mean: 'got to が「ガタ」とつながり、gotta に近く聞こえる。have got to ＝ have to。',
      trap: 'got の t が弾んで消え、to と一つに聞こえる。',
      use: 'You’ve got to try this.（これ、絶対食べてみて）' },

    // R fix: V2 (blind 70 %, right): the "nothing breaks" filler is out; all three now start "Things go wrong", and
    //   "only in show business" is a keyword trap on the saying's frame.
    // why: give up ← "everything always goes wrong" heard without "deal with it"; show business ← "an old saying in show
    //   business" heard as the limit of the point
    { id: 'i1', skill: 'infer', level: 'B2', point: 'gowrong', seg: [162.4, 170.4],
      stem: 'What is Andy’s “old saying” telling Leslie?',
      choices: ['Things go wrong, so just cope and keep going', 'Things go wrong, so it’s fine to give up',
                'Things go wrong, but only in show business'], a: 0,
      cue: '「goes wrong」のあと、and に続く部分。',
      line: 'Everything always goes wrong, and *you just have to deal with it*.',
      said: '「いつも何かがうまくいかない。なんとかするしかない」と言う。',
      mean: 'deal with it ＝ なんとか対処する。代わりを探して続けよう、という意味。',
      trap: 'goes wrong だけ聞くと「やめよう」に聞こえる。and のあとが言いたいこと。',
      use: 'It’s not perfect, but we’ll deal with it.（完璧じゃないけど、なんとかする）' },

    // R new: C2 replacement for nt1 (dropped). Blind read: 45 %.
    // anchor: 162.8–169.5 s "There's an old saying in show business, 'The show must go wrong.' Everything always goes
    //   wrong, and you just have to deal with it.": the saying is "go on", and his gloss fits a day of broken bones
    // why: right ← a fluent learner who doesn't know "The show must go on" takes it as the real saying; no sense ← "go
    //   wrong" heard as a slip, the "deal with it" gloss missed
    { id: 'nt3', skill: 'humor', level: 'C2', point: 'gowrong', seg: [162.4, 170.4],
      stem: 'How does Andy’s “old saying” compare with the usual one?',
      choices: ['He gets it wrong, but his version fits the day', 'He gets it right, and it fits the day well',
                'He gets it wrong, and his version makes no sense'], a: 0,
      cue: '有名な決まり文句の、最後の一語。',
      line: 'There’s an old saying in show business, “The show must *go wrong*.” Everything always goes wrong…',
      said: '「ショー業界の古い言葉、『ショーは失敗するもの』。いつも何かがうまくいかない」と言う。',
      mean: '本来は The show must go on（何があっても続ける）。形は違うのに、骨折だらけの今日にはぴったり。',
      trap: '決まり文句を知らないと正しい引用に聞こえる。知っている形と最後の一語を比べる。',
      use: 'The show must go on.（何があっても続けなきゃ）' },

    // R fix: S4: "plays after all" needs Freddy's song (223.7–233.0 s, both sources); seg end 223.3 → 233.6.
    // why: Andy one-handed ← he left to get his guitar and the cast story is fresh; Renata's show ← she is the one on
    //   stage first
    { id: 'g2', skill: 'gist', level: 'B2', point: 'ending', reveals: ['gig'], seg: [176.4, 233.6],
      stem: 'How does the kids’ concert finally work out?',
      choices: ['Freddy turns up and plays after all', 'Andy plays one-handed with a cast on', 'Renata plays the whole show for them'],
      a: 0,
      cue: '最後の「Eagleton」のやりとり。',
      line: 'I thought you were *playing in Eagleton*.',
      said: '代役のレナータが歌ったあと、イーグルトンにいるはずのフレディが現れる。',
      mean: '欠けていた主役が最後に戻り、コンサートは予定どおりの形になる。',
      trap: '代役が先に舞台に出るので「代役で終わり」と取りやすい。最後の会話の相手が答え。',
      use: 'I thought you were out of town!（町にいないと思ってた！）' },

    // why: burned his dinner ← noodle read as food (the spaghetti name); lost his voice ← the usual reason a singer cancels
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'noodle', seg: [181.1, 187.2],
      stem: 'How does Renata explain why Freddy couldn’t come?',
      choices: ['He hit his head', 'He burned his dinner', 'He lost his voice'], a: 0,
      cue: '「couldn’t make it today」のあとの一文。',
      line: 'Freddy Spaghetti couldn’t make it today. He *bumped his noodle*.',
      said: '「フレディは今日来られません。頭をぶつけちゃったの」と言う。',
      mean: 'noodle は口語で「頭」。スパゲッティの名前にかけた言葉遊びにもなっている。',
      trap: 'noodle を食べ物と取ると料理の話に聞こえる。bump（ぶつける）と組なら体の部分。',
      use: 'Use your noodle!（頭を使って！）' },

    // why: show called off ← Eagleton is named, so its show might have fallen through; felt bad ← the kids'-singer
    //   script, which "all about the money" contradicts
    { id: 'i3', skill: 'infer', level: 'B2', point: 'offer', reveals: ['ending', 'gig'], seg: [215.3, 223.3],
      stem: 'Why did Freddy come after all?',
      choices: ['Someone offered him more money', 'His Eagleton show was called off', 'He felt bad about the kids here'],
      a: 0,
      cue: '「this guy showed up」のあと。',
      line: 'this guy showed up, made me a *much better offer*. I’m *all about the money*, baby.',
      said: '「ある男が来て、もっといい条件を出した。俺は金次第さ」と言う。',
      mean: '誰かが高いギャラで呼び戻した。子ども向け歌手の本音がお金なのも小さな笑い。',
      trap: '子ども思いの理由を想像しやすいが、本人は money と言い切っている。',
      use: 'They made me a better offer.（もっといい条件を出された）' },
  ]
};
