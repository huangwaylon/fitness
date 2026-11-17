// REVIEW 2026-11-16: pass 6, fix 15, drop 0, new 0; ear checks 2
// Open: g2 and f1 segments still play the curse at ~60 s (not tested, but it's in the audio the learner replays).
// “Jerry Has a Fart Attack | Parks and Recreation” (the official Parks and Recreation channel, Season 5): at the
// office Halloween party, a plan to jump out and scare Tom ends with Jerry collapsing; at the hospital his coworkers
// visit, one of them pushes the doctor to call it a "fart attack", and Jerry, grateful, vows to make some changes.
// Segments from the captions, words from whisper (2026-11-16). No item uses the opening (0–21 s: it needs the
// episode's setup, and FDR/Pearl Harbor is world knowledge), the screams and crosstalk at 31–46 s, the curse and the
// insults at 59–68 s, or “gas X” at 81.5 s (captions “gas x”, whisper “gas hacks”). Only Tom, Ann, Jerry and the
// doctor are named or addressed in the audio; other speakers are “someone” or “a coworker”.
// EAR CHECK: 67.0 s i1 — the "eat farts for lunch?" line is Tom's voice (his "I didn't know that" at 70.6 s implies it)
// EAR CHECK: 133.4 s s1 / 135.0 s x1 — "you've always" with an audible 've; "leave it to us" linked
import type { Clip } from '../types.ts';

export const fartAttack: Clip = {
  id: 'fartattack', video: 'yRXDKvoPsyY', title: 'Jerry Has a Fart Attack', dur: 157, wpm: 150, band: 'mid',
  tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 + §9.4 (85 % blind): the title names Jerry, and he was only in the key. Both distractors are now the
    //   scare's other endings, one with Jerry in it.
    // why: Tom shaken ← the prank script (the scare works); Jerry laughs ← "Jerry!" and "God, gross" heard as Jerry
    //   spoiling the moment, not falling ill
    { id: 'g2', skill: 'gist', level: 'B2', point: 'prank', seg: [21.0, 72.6],
      stem: 'How does the party plan in the first half turn out?',
      choices: ['The scare meant for Tom ends with Jerry needing help', 'The scare meant for Tom works, and Tom is left shaken',
                'The scare meant for Tom is spoiled when Jerry laughs'], a: 0,
      cue: '計画の相手と、そのあと名前を呼ばれる人。',
      said: 'Tom を驚かせる計画だったが、Jerry が倒れて心臓発作かと騒ぎになる。',
      mean: 'いたずらが、思わぬ相手と結果につながった。病院の場面はその続き。',
      trap: 'いたずらは成功して終わる型で聞きやすい。heart attack と Tom の軽口がヒント。',
      use: 'The joke kind of backfired.（その冗談、ちょっと裏目に出た）' },

    // R fix: V2 (55 % blind): "Going outside with Tom for Halloween" was a filler; "as he walks into the bathroom"
    //   (wait outside … for Tom = he's inside) replaces it.
    // why: help Tom ← "wait outside the bathroom for Tom" heard as waiting to help him; walks in ← "outside the
    //   bathroom" heard without "wait … for", so the scare seems to come on the way in
    { id: 'd1', skill: 'detail', level: 'B1', point: 'plan', seg: [21.5, 27.3],
      stem: 'What does someone suggest doing to cheer things up?',
      choices: ['Scaring Tom as he leaves the bathroom', 'Waiting by the bathroom to help Tom out',
                'Scaring Tom as he walks into the bathroom'], a: 0,
      cue: '「for Tom and」のあとの動詞。',
      line: 'Let’s go *wait outside the bathroom for Tom* and *scare him*.',
      said: '「トイレの外で Tom を待ちぶせして、驚かせよう」と提案する。',
      mean: 'wait for 人 and ～ ＝ 人を待って〜する。いたずらの計画。',
      trap: 'wait outside だけだと「手伝いに待つ」とも取れる。and のあとの動詞が目的。',
      use: 'Let’s wait outside and surprise her.（外で待って、彼女を驚かせよう）' },

    // why: polite no ← "would" heard as a hedge (〜かもね、でも…); something else ← "cheer me up" heard as asking what
    //   would
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'cheerup', seg: [23.7, 31.7],
      stem: 'What does the reply to the plan do?',
      choices: ['Says yes to the plan, warmly', 'Turns the plan down, politely', 'Asks for another plan, gently'], a: 0,
      cue: '提案と同じ言葉をくり返す返事。',
      line: 'I know it would *cheer you up*. … — *That would cheer me up.*',
      said: '「元気が出るよ」と誘われ、同じ言葉で「それなら元気が出る」と返す。',
      mean: '相手の言葉をくり返して「いいね」と乗っている。would は「そうしたら」。',
      trap: 'would を遠回しの断りと取りやすいが、すぐ計画が始まる。返事のあとも聞く。',
      use: 'Pizza tonight? — That would make my day.（今夜ピザ？ーそれ最高）' },

    // why: hold on ← grip = つかむ, read literally; get the phone ← "Call 911" just before, so "get" sounds like an
    //   errand
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'grip', seg: [55.6, 60.4],
      stem: 'What is Jerry being told to do, right after the dinosaur remark?',
      choices: ['Control himself and calm down', 'Hold on to something firmly', 'Go and get the phone for help'], a: 0,
      cue: '「Jerry,」のあとの三語。',
      line: 'Jerry, *get a grip*. — Sorry, guys.',
      said: '「Jerry、しっかりしろ」と言われ、Jerry が「ごめん」と謝る。',
      mean: 'get a grip ＝ 落ち着け、しっかりしろ。取り乱している人への言葉。',
      trap: 'grip を「握る」と取ると、何かにつかまる話に聞こえる。人に言うときは気持ちの話。',
      use: 'Get a grip. It’s just a test.（落ち着いて。ただのテストだよ）' },

    // R fix: V2 + S1 (65 % blind): "snap" in the stem gave away the rebuke; it's now "call out", so "call 911"
    //   becomes a real reading. Choices made parallel.
    // why: the one they meant to scare ← true of Tom, but not why he's called out here; call 911 ← "Call 911" was said a
    //   moment before, to someone, and "Jerry's having a heart attack!" can sound like an alarm to him
    { id: 'i1', skill: 'infer', level: 'C1', point: 'tom', seg: [65.5, 72.6],
      stem: 'Why does someone call out “Tom!” right after the lunch remark?',
      choices: ['He made a joke without knowing Jerry is ill', 'He is needed to call 911 for Jerry right now',
                'He was the one the scare was meant for'], a: 0,
      cue: '名前を呼んだあとの説明と、Tom の返事。',
      line: '*Tom!* Jerry’s having a heart attack! — Oh no, *I didn’t know that*.',
      said: '「Tom！ Jerry は心臓発作だ」と言われ、Tom は「え、知らなかった」と返す。',
      mean: '直前のからかいは Tom の言葉。病気と知らずに、においをネタにしていた。',
      trap: 'Tom はいたずらの相手なので、その話に引かれやすい。名前の直後の説明が理由。',
      use: 'Oops, sorry, I didn’t know.（あっ、ごめん、知らなかった）' },

    // R fix: V2 + K6 (75 % blind): the key was the only "and" against two "but"s. All three are now "and wants/takes",
    //   with a payback and a bills reading.
    // why: get back at ← "they did cause it" heard as Jerry's own grudge; cover his bills ← "massive hospital
    //   bills" plus "leave it to us" at the end heard as an offer to pay
    { id: 'g1', skill: 'gist', level: 'B2', point: 'scene', reveals: ['wakeup', 'glad'], seg: [72.0, 136.4],
      stem: 'What is the hospital scene mostly about?',
      choices: ['Jerry recovers, and takes the scare as a reason to change',
                'Jerry recovers, and wants to get back at those who scared him',
                'Jerry recovers, and wants his coworkers to cover his bills'], a: 0,
      cue: '後半、Jerry 自身が話す部分。',
      said: '同僚が見舞いに来て、医者に「おなら発作」と言わせたがる人もいる。Jerry は感謝している。',
      mean: '軽くすんだ Jerry が、出来事を前向きに受け止める場面。',
      trap: '入院費や「原因は彼ら」が耳に残るが、Jerry 本人は怒らず、払ってとも言わない。',
      use: 'I’m taking this as a sign.（これを合図だと受け止めるよ）' },

    // why: Jerry called them boring ← "boring" is said, but it's the giver's word; joke gift ← in this office Jerry
    //   is the usual target, so it sounds like a prank present
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'jumbles', seg: [75.2, 81.35],
      stem: 'What does the way the gift is described show about the giver?',
      choices: ['Kind, though with a small dig at Jerry’s taste', 'Kind, and just passing on what Jerry said of them',
                'Unkind: it is a joke gift Jerry won’t like'], a: 0,
      cue: '「word jumbles」の前の形容詞と、後ろの説明。',
      line: 'I got you some magazines and *those boring word jumbles you like to do*.',
      said: '「雑誌と、あなたが好きなあのつまらない言葉パズル」を渡す。',
      mean: 'Jerry の好みに合わせた親切な差し入れ。でも本音の「つまらない」がつい出る。',
      trap: 'boring だけだと Jerry の感想に聞こえるが、you like to do が続く。',
      use: 'I got you that weird tea you like.（君が好きな、あの変なお茶を買ってきたよ）' },

    // R fix: V2 (60 % blind): "The papers from Jerry's doctor" was a filler. All three are now "The news …, without …";
    //   "gently" is the Japanese softening frame.
    // why: quickly ← "straight" heard as straight away (すぐに); gently ← the Japanese frame: bad news should come
    //   softened (遠回しに), so "give it to me" sounds like a request for care
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'straight', seg: [83.2, 88.05],
      stem: 'When Ann is asked how Jerry is, what does the asker want?',
      choices: ['The news honestly, without softening it', 'The news quickly, without a long story',
                'The news gently, without a shock'],
      a: 0,
      cue: '「How is he, Ann?」のあとの決まった言い方。',
      line: 'How is he, Ann? *Give it to me straight.*',
      said: '「Ann、具合は？ はっきり言ってくれ」と聞く。',
      mean: 'give it to me straight ＝ 遠回しにせず正直に言って。悪い知らせへの覚悟。',
      trap: 'straight を「すぐに」と取りやすい。ここは「飾らずに」。遠回しを頼む言い方ではない。',
      use: 'Doctor, just give it to me straight.（先生、はっきり言ってください）' },

    // R fix: V2 (50 % blind): "a day or two" was the default guess among three; "Tomorrow morning" added (four
    //   strong choices, in time order).
    // why: today ← "out of here" heard as leaving right now; tomorrow ← "a day" heard alone; a week or two ← the "or
    //   two" frame with a longer unit
    { id: 'n1', skill: 'number', level: 'B1', point: 'day', seg: [83.2, 88.05], keep: true,
      stem: 'When does Ann say Jerry should leave the hospital?',
      choices: ['Later today', 'Tomorrow morning', 'In a day or two', 'In a week or two'], a: 2,
      cue: '「out of here」のあと、or two の前。',
      line: 'He should be *out of here in a day or two*.',
      said: '「1日か2日で退院できるはず」と答える。',
      mean: 'out of here ＝ ここを出る（退院する）。軽くすんだ、という知らせ。',
      trap: 'out of here だけ聞くと今すぐ出るように聞こえる。in のあとの期間を聞く。',
      use: 'I’ll be back in a day or two.（1、2日で戻ります）' },

    // R fix: V2 (50 % blind): the choices are now the four mild/serious × heart/stomach pairs, so neither word alone
    //   picks the key.
    // why: serious ← "heart attack" assumed to be grave; stomach ← "gastrointestinal distress" and the gas talk come
    //   next
    { id: 'd2', skill: 'detail', level: 'B1', point: 'mild', seg: [87.6, 92.7],
      stem: 'How does the doctor describe what happened to Jerry?',
      choices: ['A mild heart attack', 'A serious heart attack', 'A mild stomach upset', 'A serious stomach upset'], a: 0,
      cue: '「He had a」のあとの最初の語。',
      line: 'He had a *mild heart attack*.',
      said: '医者が「軽い心臓発作でした」と答える。',
      mean: 'mild ＝ 軽い、穏やかな。命に関わるほどではなかったということ。',
      trap: 'heart attack から重い病気を想像しやすい。前に付いた mild が程度を決める。',
      use: 'It’s just a mild cold.（ただの軽い風邪だよ）' },

    // R fix: V2 (55 % blind): "would rather not discuss the case" was a filler. All three now answer yes/no plus a
    //   reason.
    // why: caused by the scare ← the first half's scare is the obvious cause; a term, not polite ← "Not really" heard
    //   as "not really something I'd say"
    { id: 'd3', skill: 'detail', level: 'B2', point: 'notreally', seg: [97.3, 106.2],
      stem: 'How does the doctor answer the question about a term for it?',
      choices: ['No such term; the gas is common in heart attacks', 'No such term; the gas was caused by the scare',
                'Yes, a term exists, but it is not polite to use'], a: 0,
      cue: '最初の短い返事と、そのあとの説明。',
      line: '*Not really.* Gastrointestinal distress is *common during a cardiac event*.',
      said: '「特にない。心臓発作で胃腸が乱れるのはよくあること」と答える。',
      mean: 'Not really ＝ 特にない。呼び名はなく、よくある症状だと冷静に説明する。',
      trap: 'Not really を「言いにくい」と取りやすい。続く common が理由を語る。',
      use: 'Any questions? — Not really.（質問は？ー特にないです）' },

    // R fix: V2 (60 % blind): "Says sorry for asking so much" read as a filler; "Admits his silly wish is too much"
    //   (the same Japanese frame, now parallel to the key) replaces it.
    // why: cost ← "too much" heard as price, with the hospital bills to come; admits ← the Japanese frame:
    //   「無理を言ってすみません」, a rhetorical question read as a real one
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'toomuch', seg: [97.3, 110.4],
      stem: 'What does the coworker do with his last question to the doctor?',
      choices: ['Insists his silly wish is a small one', 'Asks how much Jerry’s care will cost',
                'Admits his silly wish is too much'], a: 0,
      cue: '「fart attack」のあとの、短い問い。',
      line: 'I just want to hear the doctor say that Jerry had a fart attack. *Is that too much to ask?*',
      said: '「医者から“おなら発作”と聞きたいだけ。それって無理な頼み？」と言う。',
      mean: 'ささいな願いだと言い張る決まり文句。「そのくらい、いいでしょ」。',
      trap: 'too much を値段や「無理でした」と取りやすい。ここは「大した頼みじゃない」と押す。',
      use: 'I just want one quiet day. Too much?（静かな一日がほしいだけ。無理？）' },

    // R fix: V2 (60 % blind): "making Jerry worse" and "to tease him" were weak. The new near misses: "they" taken as
    //   the food just listed, and "it" taken as his recovery.
    // why: the food ← "balloons and the flowers and the food" just before, so "they" sounds like the food (and the
    //   gas); got better ← "cause it" heard as causing his recovery, "Well," missed
    // anchor: 114.9 s "you're so sweet to come visit this often" → 117.4 s "Well, they did cause it": "did" (past)
    //   points at what caused the heart attack, the scare in the first half, so the visits are tied to blame
    { id: 'c1', skill: 'attitude', level: 'C2', point: 'cause', reveals: ['prank'], seg: [110.0, 119.0],
      stem: 'After the thanks for visiting so often, what does “Well, they…” hint?',
      choices: ['The visitors are there partly from guilt', 'The food they brought is what made him ill',
                'The visitors are the reason he got better'], a: 0,
      cue: '「よく来てくれる」へのつっこみ。did の時制。',
      line: 'you’re so sweet to *come visit this often*. — Well, *they did cause it*.',
      said: '「よく来てくれて優しい」に、横から「まあ、原因は彼らだし」と入る。',
      mean: '原因を作った側なので、見舞いには罪ほろぼしの面がある、とばらしている。',
      trap: 'they を直前の food と取りやすい。visit への返しなので they は見舞い客。did が前半を指す。',
      use: 'Well, you did break it.（まあ、壊したのは君だしね）', retired: true },

    // R fix: V2 (80 % blind): "Worried, mostly about cost" was flat; "Embarrassed, and eager to put it behind him"
    //   (the fart angle) replaces it. C5: the key states f3's change, so it reveals 'wakeup'.
    // why: bitter ← the Japanese frame: "that's okay" as 建前, hiding resentment; embarrassed ← the gas talk all
    //   scene, and "No, that's okay" heard as brushing it off
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'glad', reveals: ['wakeup'], seg: [118.5, 129.5],
      stem: 'How does Jerry feel about what happened to him?',
      choices: ['Thankful, and ready to change his life', 'Bitter, though too polite to say so',
                'Embarrassed, and eager to put it behind him'], a: 0,
      cue: '「No, that’s okay」のあとの気持ちの言葉。',
      line: 'No, that’s okay. *I’m glad this happened.*',
      said: '「いいんだ。こうなってよかった」と言い、生活を変えるつもりだと話す。',
      mean: '責めるどころか、出来事を前向きに受け止めている。',
      trap: 'that’s okay を遠慮の建前と取りやすい。続く I’m glad と changes が本心を示す。',
      use: 'Honestly, I’m glad it happened.（正直、ああなってよかった）' },

    // why: takes it back ← "I mean" read as a correction of "I'm glad"; bills really worry him ← the Japanese frame:
    //   the real feeling (本音) comes out in the aside
    // R fix: V2 (65 % blind): the key was the only two-part answer. All three are now two-part; C5: its key and line
    //   give away a2's and f3's points, so it reveals them.
    // anchor: 121.8–126.6 s "I mean, yeah, I could do without the… bills, but no, this was a wake-up call. I'm gonna
    //   make some changes": "but no" cancels the aside and returns to "I'm glad this happened"
    { id: 'c2', skill: 'pragma', level: 'C2', point: 'without', reveals: ['glad', 'wakeup'], seg: [119.0, 129.5],
      stem: 'What does Jerry’s “I mean, yeah… but no” do?',
      choices: ['Grants one downside, then stands by his upbeat view', 'Grants one downside, then admits it is his real worry',
                'Takes back his thanks, then softens it with a joke'], a: 0,
      cue: '「but no」のあとに戻ってくる話。',
      line: '*I mean, yeah*, I could do without the massive hospital bills, *but no*, this was a wake-up call.',
      said: '「高い入院費はないほうがいいけど、いや、これは目覚ましだった」と言う。',
      mean: 'I mean, yeah で小さな不満を認め、but no で打ち消して「よかった」に戻る話し方。',
      trap: 'I mean を言い直しと取ると、「よかった」を取り消したように聞こえる。but no のあとが着地点。',
      use: 'I mean, yeah, it’s far, but worth it.（まあ遠いけど、行く価値あり）', retired: true },

    // why: managed without ← do without = 無しで済ます, read as "he can manage without paying"; easy to pay ← "could
    //   do" heard as "could pay"
    { id: 'f4', skill: 'phrase', level: 'C1', point: 'without', seg: [121.3, 126.7],
      stem: 'What does Jerry say about the hospital bills?',
      choices: ['He would rather not have them', 'He can manage without paying them', 'He could pay them with ease'],
      a: 0,
      cue: '「I could」のあとの三語。',
      line: 'yeah, I *could do without* the massive hospital bills',
      said: '「まあ、高い入院費はないほうがいいけど」と言う。',
      mean: 'could do without ～ ＝ 〜はないほうがいい。軽い不満をやわらかく言う形。',
      trap: 'do without は「無しで済ます」とも読めるので、払わずに済むように聞こえやすい。',
      use: 'I could do without the rain.（雨はなくていいんだけどな）' },

    // R fix: V2 + S2 (95 % blind): the stem quoted the idiom under test, and both distractors were absurd literal
    //   readings. The stem now names the moment; the distractors are built on what's said around it.
    // why: lucky break ← "I'm glad this happened" just before; heart better ← "mild heart attack" and "out of here in a
    //   day or two" earlier, with "wake-up" heard as getting back on his feet
    { id: 'f3', skill: 'phrase', level: 'B1', point: 'wakeup', seg: [121.3, 126.7],
      stem: 'After “but no”, what does Jerry say the whole thing was for him?',
      choices: ['A warning that he has to change', 'A lucky break from his dull routine', 'A sign his heart is getting better'], a: 0,
      cue: 'すぐあとの「I’m gonna」に続く言葉。',
      line: 'this was a *wake-up call*. I’m gonna *make some changes*.',
      said: '「これは目を覚ませという合図だった。生活を変える」と言う。',
      mean: 'wake-up call ＝ 目を覚まさせる出来事、警告。変わるきっかけ。',
      trap: 'wake-up を「回復」や「幸運」と取りやすい。後ろの make some changes が決め手。',
      use: 'That exam was a real wake-up call.（あの試験で目が覚めた）' },

    // why: 13 ← thirty/thirteen; 40 ← "at least another" heard as adding to a bigger total
    { id: 'n2', skill: 'number', level: 'B1', point: 'thirty', seg: [125.45, 129.5], keep: true,
      stem: 'How many more years does Jerry say he wants with his family?',
      choices: ['At least 13', 'At least 30', 'At least 40'], a: 1,
      cue: '「another」のすぐあとの数。',
      line: 'I want at least *another 30 years* with Gail and my girls.',
      said: '「妻と娘たちと、少なくともあと30年は一緒にいたい」と言う。',
      mean: 'another ＋数＝さらに〜。健康に気をつけて長生きしたい、ということ。',
      trap: 'thirty と thirteen は似ている。-teen は後ろを強く長く、-ty は前を強く言う。',
      use: 'I need another ten minutes.（あと10分ください）' },

    // R fix: C5: its line holds s1's answer ("you've always"), so it reveals 'planned'.
    // why: pay the bills ← "massive hospital bills" a moment before; leave him alone ← "leave" taken literally
    { id: 'i2', skill: 'infer', level: 'C1', point: 'leave', reveals: ['planned'], seg: [129.2, 136.4],
      stem: 'What does the promise at the very end suggest will happen?',
      choices: ['His coworkers will take charge of his health plans', 'His coworkers will help him pay the hospital bills',
                'His coworkers will leave him alone so he can rest'], a: 0,
      cue: '「the future」の話と、最後の短い一文。',
      line: 'You are gonna have *the future that you’ve always planned*. Just *leave it to us*.',
      said: '「思い描いた未来は手に入る。私たちに任せて」と言う。',
      mean: 'leave it to us ＝ 任せて。Jerry の「変わりたい」を周りが引き受ける宣言。',
      trap: 'leave を「放っておく」と取ると逆になる。leave it to 人は「人に任せる」。',
      use: 'Don’t worry about dinner. Leave it to me.（夕食は心配しないで。任せて）' },

    // R fix: V2 (55 % blind): the "you've always + verb" chunk won on habit; "we've always" (y/w near sound, and the
    //   speakers' "leave it to us" right after) makes four strong choices.
    // why: you always planned ← the weak 've lost; you'd always planned ← 've and 'd are both one short consonant;
    //   we've always ← /juv/ vs /wiv/, with "us" in the next line
    { id: 's1', skill: 'sound', level: 'B2', point: 'planned', seg: [131.4, 136.4],
      stem: 'Fill the gap: “…the future that ___ planned.”',
      choices: ['you’ve always', 'you always', 'you’d always', 'we’ve always'], a: 0,
      cue: '「the future that」のあと、always の前の小さな音。',
      line: 'You are gonna have the future that *you’ve always* planned.',
      said: '「ずっと思い描いてきた未来が手に入る」と励ます。',
      mean: 'you’ve always planned ＝ 今までずっと計画してきた。’ve は弱く always につながる。',
      trap: '’ve は短い v だけで消えやすい。always と一緒なら完了形を疑う。',
      use: 'It’s the trip you’ve always wanted.（ずっと行きたかった旅だよ）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'leave', seg: [133.1, 136.4],
      stem: 'Type the last words: “Just ___.” (4 words)', answer: 'leave it to us',
      cue: '「planned」のあと、Just に続く短い語。',
      line: 'Just *leave it to us*.',
      said: '「私たちに任せて」と言う。',
      mean: 'leave it to は「リーヴィットゥ」とつながり、to は弱く「タ」に近い。us まで一息。',
      trap: 'leave と it がつながって一語に聞こえやすい。短い語の数を数えながら聞く。',
      use: 'Leave it to the experts.（専門家に任せよう）' },
  ]
};
