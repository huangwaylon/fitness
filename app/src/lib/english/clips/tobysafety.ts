// “Toby's Health And Safety Meeting - The Office US” (the official The Office channel, Best of Season 3): Michael hands
// the office safety talk to Toby, keeps cutting in to make desk work sound dangerous, and the warehouse crew mocks it;
// Michael answers them to the camera with his own "warehouse" past.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 203 s; whisper's lines after that are a
// loop. Untested: 64–74 s (the sweater tip: "drafty" vs whisper "drafted", the clothing list garbled in the captions),
// 79–83 s ("He is very lame": speaker unclear), 122–143 s (the "fat butt" jokes and the Kelly / "sea monster" insults,
// overlapping and partly missing in the captions), 185.5 s ("greet people": captions "Creek", whisper "create"; no key
// uses it). No who item and no predict item.
// REVIEW 2026-11-16: pass 8, fix 15, drop 0, new 0; ear checks 1
//   (a1, m1, d4, a3 and p2 no longer name the speaker; x1 and nt3 checks removed: both sources have the words)
// EAR CHECK: 52.5 s g2 — "…skip ahead to the really dangerous stuff" assumed Michael's (no name in the line; the
//   captions have "making us sound kind of lame", whisper "making it"; no line quotes that word now)
import type { Clip } from '../types.ts';

export const tobySafety: Clip = {
  id: 'tobysafety', video: 'Dh7V1UheA6E', title: 'Toby\'s Health And Safety Meeting', dur: 226, wpm: 154,
  band: 'slow', tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 60 %): "makes Toby look bad" was weak; the stem now gives the aim (so g1 reveals g2's `aim`)
    //   and the choices are three outcomes
    // why: scared ← "really dangerous stuff" and "explode" are said; won over ← the crew's "it's serious down there"
    //   heard as agreement that safety matters
    { id: 'g1', skill: 'gist', level: 'B2', point: 'scene', reveals: ['lame', 'aim'], seg: [0, 167.8],
      stem: 'How does Michael’s push to make desk work sound risky turn out?',
      choices: ['The warehouse crew makes fun of it', 'The office staff gets truly scared',
                'The warehouse crew is won over by it'], a: 0,
      cue: '後半の倉庫チームの言葉と、Michael の返し方。',
      said: 'Toby の講習に Michael が口をはさみ、危なそうに見せようとして、倉庫チームに笑われる。',
      mean: '事務の「危険」を大きく見せたい Michael と、倉庫側のずれが中心。',
      trap: 'explode が耳に残るが、こわがる人も感心する人もいない。',
      use: 'That didn’t go the way I planned.（思ってたようにはいかなかった）' },

    // R fix: V2 (blind 50 %): the key was the only choice in meeting language; all three now end "now"
    // why: in charge ← "now has" heard as a handover of power; stand up in front ← "floor" taken literally (床)
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'floor', seg: [0, 7.2],
      stem: 'What does Michael announce about Toby at the very start?',
      choices: ['It’s Toby’s turn to talk now', 'Toby is in charge of the office now',
                'Toby must stand up in front now'], a: 0,
      cue: '冒頭、Toby の名前のすぐあと。',
      line: 'Toby *now has the floor*…',
      said: '「さあ、ここからは Toby の番だ」と、話し手を交代させている。',
      mean: 'have the floor ＝ 会議で発言する番にある。場所や地位の話ではない。',
      trap: 'floor を「床」と取ると立ち位置の話に聞こえる。会議の floor は「発言の場」。',
      use: 'You have the floor. Go ahead.（どうぞ、発言してください）' },

    // why: same insult again ← "rephrase" = say it in other words, taken literally; says sorry ← the expected repair
    //   after a rude remark (the Japanese frame: an apology comes next)
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'rephrase', seg: [0, 14.2],
      stem: 'Right after the remark about Toby’s life, what does Michael do?',
      choices: ['Swaps the insult for a kinder-sounding version', 'Says the very same insult again, in other words',
                'Says sorry to Toby and asks him to begin'], a: 0,
      cue: '失礼な一言のすぐあと、言い直しの中身。',
      line: '…like everything else in his life. *Let me rephrase that.* I believe that you can…',
      said: '「人生の他のことみたいに失敗しないように」のあと「言い直そう。君ならできる」と続ける。',
      mean: '口がすべり、ほめ言葉に言い換えてごまかす。謝ってはいない。',
      trap: 'rephrase を「同じことを言い直す」と取りやすい。言い直した中身を聞く。',
      use: 'Let me put that another way.（別の言い方をさせて）' },

    // R fix: V2 (blind 70 %): "more breaks" was a filler; now the sincere reading (real safety, not how it sounds)
    // why: the opening line names Darryl as the bar ("just as good as Darryl"), so "beat Darryl" is a keyword trap;
    //   take safety seriously ← sincerity flip: it is a safety talk, but every request is about how it *sounds*
    { id: 'g2', skill: 'gist', level: 'B2', point: 'aim', reveals: ['lame', 'rephrase'], seg: [0, 57.1],
      stem: 'What does Michael want this training to do?',
      choices: ['Make safety sound as serious as Darryl’s', 'Show that Toby can train better than Darryl',
                'Get the staff to take safety more seriously'], a: 0,
      cue: '冒頭の Darryl の名前と、途中の注文。',
      line: '…make it sound *just as good as Darryl*. … skip ahead to the *really dangerous stuff*.',
      said: '「Darryl と同じくらい良く聞こえるように」と言い、途中で「危ない話に飛ばして」と頼む。',
      mean: '倉庫の講習に負けない重みがほしい。中身より見え方が大事。',
      trap: '安全を本気で広めたいと取りやすいが、注文は sound（聞こえ方）の話ばかり。',
      use: 'Make it sound more exciting.（もっと面白そうに聞こえるようにして）' },

    // why: Fifteen ← "ten" and "fif-" are both short; Twenty ← two 10-minute breaks run together later; Five ← a
    //   short break is expected for typing
    { id: 'n1', skill: 'number', level: 'B1', point: 'typing', seg: [17.4, 25.4], keep: true,
      stem: 'How long a typing break per hour is recommended?',
      choices: ['Five minutes', 'Ten minutes', 'Fifteen minutes', 'Twenty minutes'], a: 1,
      cue: '「carpal tunnel」のあと、break の直前。',
      line: 'it’s recommended that you take a *10-minute break* from typing every hour',
      said: '手首の病気を防ぐため、1時間ごとにタイピングを休むよう勧めている。',
      mean: '1時間に1回の休憩。ここから「毎時」の助言が続く。',
      trap: 'ten と fifteen は似る。-teen なら語尾が長く強い。break の直前を聞く。',
      use: 'Let’s take a ten-minute break.（10分休憩しよう）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'getup', seg: [24.7, 29.3],
      stem: 'Type the missing words: “you’re gonna want to ___ your chairs” (4 words)', answer: 'get up out of',
      cue: '「want to」のすぐあと、短い4語のかたまり。',
      line: 'you’re gonna want to *get up out of* your chairs',
      said: '「椅子から立ち上がって」。4語がつながり「ゲラパウラヴ」のように聞こえる。',
      mean: 'get up out of ＝ 〜から立ち上がって離れる。',
      trap: 't が弾んで「ラ」に近くなり、of もほぼ消える。かたまりで聞く。',
      use: 'I need to get up out of bed.（そろそろ起きなきゃ）' },

    // R fix: S3: the cue's "screen" was only in the key; the key now says "rest tired eyes"
    // why: wrists ← the carpal tunnel tip comes first; blood ← "circulation" is the tip just before
    { id: 'd1', skill: 'detail', level: 'B1', point: 'eyes', seg: [34.5, 44.6],
      stem: 'What reason is given for the third hourly break?',
      choices: ['To rest tired eyes for a while', 'To give the wrists a rest from typing',
                'To get the blood moving around again'], a: 0,
      cue: '「computer screen」のあと、何に負担がかかるか。',
      line: 'your computer screen can be a big *strain on your eyes*, so … step away…',
      said: '「画面は目に大きな負担になる。だから席を離れることも勧められている」。',
      mean: 'strain ＝ 負担・疲れ。3つめの休憩は目のため。',
      trap: '前の2つ（手首、血のめぐり）と混ざりやすい。休憩の数だけ理由がある。so の前を聞く。',
      use: 'Screens are a real strain on my eyes.（画面で目がすごく疲れる）' },

    // why: An hour ← "every hour" is said twice in the line; Twenty minutes ← two breaks, if one is missed;
    //   Ten minutes ← the number heard just before
    { id: 'n2', skill: 'number', level: 'B1', point: 'halfhour', seg: [43.5, 48.9], keep: true,
      stem: 'How much break time per hour does the speaker add up to?',
      choices: ['Ten minutes', 'Twenty minutes', 'Half an hour', 'An hour'], a: 2,
      cue: '「adds up」のすぐあと。',
      line: 'that time really adds up. That’s like *a half an hour* every hour.',
      said: '「積み重なるね。1時間ごとに30分くらいになる」と計算している。',
      mean: '休憩が3つで、1時間の半分が休み。勧めすぎだという驚き。',
      trap: 'every hour が2回聞こえ、hour だけ拾いやすい。half と an hour を続けて聞く。',
      use: 'It takes about half an hour.（30分くらいかかるよ）' },

    // why: all together ← "the same time" read as 「みんなで同じ時間に」; only one needed ← "take them" heard as a
    //   cut-down, not a merge
    { id: 'i1', skill: 'infer', level: 'B2', point: 'same', reveals: ['halfhour'], seg: [43.6, 51.0],
      stem: 'What does the short answer to the break math suggest?',
      choices: ['The three breaks can be taken as one', 'Everyone should take their breaks together',
                'Only one of the three breaks is really needed'], a: 0,
      cue: '30分という計算への、すぐの返事。',
      line: 'That’s like a half an hour every hour. — *Take them at the same time.*',
      said: '「1時間に30分も」という驚きに、「同時に取ればいい」と返す。',
      mean: '目、手首、体の休憩は一度にまとめられる、ということ。実は1時間に10分。',
      trap: 'same time を「みんな一緒に」と取りやすい。them は3つの休憩を指す。代名詞の中身を追う。',
      use: 'Do both at the same time.（両方いっぺんにやっちゃえば）' },

    // anchor: 47.07–48.84 s both sources: "That's like a half an hour every hour" (the extra "a" before "half")
    // why: the grammar instinct writes "half an hour"; "like half an hour" ← "like a" runs together into one syllable
    { id: 'nt3', skill: 'dict', level: 'C2', point: 'halfhour', seg: [45.2, 49.2],
      stem: 'Type the gap: “That’s like ___ every hour.” (4 words)', answer: 'a half an hour',
      cue: '「adds up」のあと、like から hour まで。',
      line: 'That’s like *a half an hour* every hour.',
      said: '「1時間ごとに30分くらいだよ」。like a half がつながり、a はほとんど聞こえない。',
      mean: 'a half an hour は米語の会話でよく出る形。教科書の形に a が一つ足されている。',
      trap: '習った形に合わせて a を消したくなる。弱くても、聞こえた語は書く。',
      use: 'I’ll be there in a half an hour.（30分で着くよ）' },

    // R fix: V2 (blind 60 %): "worried" was weak; now "pleased it sounds safe" (tame read as safe). S1: no speaker
    //   name. N1: the line no longer quotes "us" (captions) / "it" (whisper)
    // why: annoyed at the time ← the "adds up" line just before; pleased ← "lame" missed, the talk of safe habits heard
    //   as good news
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'lame', seg: [48.6, 57.1],
      stem: 'How does the person who cuts in after the break math feel?',
      choices: ['Embarrassed that office work sounds so tame', 'Annoyed that the breaks eat up so much time',
                'Pleased that office work sounds so safe'], a: 0,
      cue: '口をはさんだ理由と、そのあとの注文。',
      line: '…*sound kind of lame*, so skip ahead to the *really dangerous stuff*',
      said: '「これじゃかっこ悪く聞こえる。本当に危ない話に飛ばして」と言う。',
      mean: 'lame ＝ ださい、さえない。心配ではなく、見え方が恥ずかしい。',
      trap: 'dangerous で「心配」に聞こえやすい。so の前の理由が本音。危険は見栄のために欲しい。',
      use: 'This party is kind of lame.（このパーティー、ちょっとイマイチ）' },

    // the same opener comes back at 75 s and 97 s
    // R fix: S1: no speaker name (the cut-ins carry no name). N1: the line drops the disputed "us"/"it"
    // why: a check ← "you know" taken literally (知ってる？); a pause ← heard as a filler while he thinks
    { id: 'm1', skill: 'marker', level: 'B2', point: 'youknow', reveals: ['lame'], seg: [48.6, 57.1],
      stem: 'Several cut-ins start with the same short phrase. What does it signal?',
      choices: ['A turn: he’s about to object to something', 'A check: he wants the staff to agree',
                'A pause: he’s trying to recall a fact'], a: 0,
      cue: '口をはさむときの、文頭の決まった言い方。',
      line: 'Okay, *you know what*, you’re making… sound kind of lame…',
      said: '「よし、あのさ」と前置きしてから、話の流れに文句をつける。',
      mean: 'you know what ＝ 話を切り替える合図。このあと反対や不満が来ることが多い。',
      trap: '文字どおり「知ってる？」と取ると質問に聞こえる。答えを待たずに続けるので、問いではない。',
      use: 'You know what? Let’s just order pizza.（あのさ、もうピザ頼もう）' },

    // why: screens ← the eye-strain tip is the last danger heard before he cuts in; heart ← Michael's own heart
    //   disease line, later in the meeting
    // R fix: S1: no speaker name (the 52–60 s voice carries no name)
    { id: 'd4', skill: 'detail', level: 'B1', point: 'explode', seg: [53.5, 61.6],
      stem: 'After the request to skip ahead, what example is given?',
      choices: ['Computers that can sometimes explode', 'Screens that can strain your eyes',
                'Sitting that can damage your heart'], a: 0,
      cue: '「skip ahead」のあと、Like で始まる例。',
      line: 'skip ahead to the really dangerous stuff. Like, sometimes *computers can explode*…',
      said: '「本当に危ない話に飛ばして。たとえば、コンピューターが爆発するとか」と言う。',
      mean: '大げさな例を自分から出して、事務の仕事も危険だと言わせたい。',
      trap: '目の負担はその前の話、心臓の話はもっとあと。Like のあとが本人の例。',
      use: 'Like, what’s the worst that could happen?（たとえば、最悪どうなるの？）' },

    // why: can't they ← the tag a learner's grammar expects; can they now ← "not" and "now" are near sounds; could
    //   they not ← "can" is weak, so its vowel is hard to hear
    { id: 's1', skill: 'sound', level: 'B2', point: 'explode', seg: [56.9, 61.6],
      stem: 'Fill the gap: “Sometimes computers can explode, ___?”',
      choices: ['can they not', 'can’t they', 'can they now', 'could they not'], a: 0,
      cue: 'explode のあと、短い3語の確認。',
      line: 'sometimes computers can explode, *can they not*?',
      said: '「コンピューターって爆発することもあるよね？」と念を押す。',
      mean: 'can’t they の改まった形。重々しく言って危険な話を引き出そうとしている。',
      trap: '習った can’t they を予想しやすい。not が最後に離れて残るのを聞く。',
      use: 'You can swim, can you not?（泳げるよね？）' },

    // R fix: V2 (blind 70 %): "too tired" was weak; now a keyword trap from the sweater/drafty tips. S1: no speaker
    //   name
    // why: scary ← "vomit" taken as a real reaction, after the talk of danger; stuffy ← the clothing tips just before
    //   (sweater, long johns) plus "vomit", with "due to boredom" missed
    { id: 'a3', skill: 'attitude', level: 'B1', point: 'boredom', seg: [74.4, 78.7],
      stem: 'What does the remark about everyone throwing up mean?',
      choices: ['Toby’s tips are so dull they’re hard to bear', 'Toby’s tips are so scary they make people ill',
                'The room is so stuffy people are feeling ill'], a: 0,
      cue: '「vomit」のすぐあとの、理由の語。',
      line: 'everybody is going to *vomit due to boredom*.',
      said: '「みんな退屈で吐きそうだよ」と言い、Toby は「ごめん」と返す。',
      mean: '大げさな言い方で、話がつまらないと文句を言っている。体調の話ではない。',
      trap: 'vomit だけ聞くと体調に聞こえる。due to のあとが理由。部屋でも怖さでもなく退屈。',
      use: 'I’m dying of boredom here.（退屈で死にそう）' },

    // R fix: V2 (blind 70 %): "relief" was easy to rule out and the key was the only quoted choice; now a sympathy
    //   reading, and no quote marks
    // why: sympathy ← "Thank God… only" heard as fellow feeling about winter; talk too long ← right mechanism, wrong
    //   target: Michael's next line is about interrupting, but the remark sets a baler against winter light
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'baler', seg: [91.7, 101.6],
      stem: 'After the winter-depression item, how is the remark about a baler meant?',
      choices: ['As a dig: office dangers are tiny next to theirs', 'As a dig: Michael’s talk is dragging on too long',
                'As sympathy: winter is hard on office workers too'], a: 0,
      cue: '「Thank God」のあとと、Michael の言い返し。',
      line: '*Thank God we only had a baler* to deal with. … I *didn’t interrupt* when you were having your presentation.',
      said: '倉庫側が「うちは圧縮機だけで助かった」と言い、Michael は「発表のとき邪魔しなかった」と返す。',
      mean: '大きな機械と冬の気分を比べ、事務の危険を笑っている。',
      trap: 'Thank God を文字どおり取ると同情に聞こえる。何と何を比べたかで皮肉の的を見る。',
      use: 'Oh no, a paper cut. Call an ambulance.（紙で指を切った？救急車呼ぶ？）' },

    // R fix: V2 (blind 60 %): "thanks" was weak; now "insists his word was fine", refuted by the "Yes". S1: no speaker
    //   name (the reader is named only later, at 122 s)
    // why: agrees it's a worry ← the topic is a real health risk; insists ← a one-word reply to a correction heard as
    //   pushback (refuted: he says "Yes" and reads on with the corrected word's sentence)
    { id: 'p2', skill: 'pragma', level: 'C1', point: 'sedentary', seg: [106.0, 118.8],
      stem: 'When the reader’s word is corrected, what does the one-word reply do?',
      choices: ['Accepts it as if he had known it all along', 'Agrees that sitting all day is a real health worry',
                'Insists that his own word was fine too'], a: 0,
      cue: '直された直後の短い返事と、そのあとの続け方。',
      line: 'a *sedimentary* lifestyle which can contribute… — *Sedentary.* — Yes, which can contribute…',
      said: '「地層のような生活」と読み、「座りがちな」と直されると、一言だけ返して同じ文を読み続ける。',
      mean: '読み違いを認めず、元から分かっていたように流す。面子を守る返事。',
      trap: 'yes を話の中身への同意と取りやすい。返事のあと止まらず同じ文へ戻るのが、流す合図。',
      use: 'Right, that’s what I meant.（そう、それが言いたかった）' },

    // R fix: V2 (blind 60 %): "their own talk again" was weak; now the reversed reading (Michael walked out once)
    // why: Darryl walked out ← "walk out" is said, in the wrong direction; Michael walked out ← "I… walk out" heard
    //   with "did not" lost
    { id: 'i4', skill: 'infer', level: 'C1', point: 'walkout', seg: [144.3, 149.4],
      stem: 'What does Michael’s complaint to Darryl tell us?',
      choices: ['The warehouse crew is walking out right now', 'Darryl walked out of Michael’s talk before',
                'Michael once walked out of the crew’s talk'], a: 0,
      cue: '「Darryl」と呼びかけた文の、比べ方。',
      line: 'Darryl, *I did not walk out in the middle of yours*, so I…',
      said: '「君らの発表の途中で、僕は出ていかなかった」と言いかける。',
      mean: '「僕はしなかった」は、相手が今それをしているから。倉庫チームが席を立った。',
      trap: 'walk out で Darryl の過去の話に取りやすい。I did not は「でも君は」を含む。',
      use: 'I didn’t laugh when you fell.（君が転んだとき、笑わなかったよ）' },

    // R fix: V2 (blind 55 %): "shorter" was weak; all three now turn on "real"
    // why: experts ← "real" heard, in the wrong relation (who gave it, not what it was about); bosses ← the same, a
    //   "real" order from above (refuted by "It's serious down there. We do dangerous stuff")
    { id: 'd3', skill: 'detail', level: 'B1', point: 'real', reveals: ['walkout'], seg: [144.3, 154.4],
      stem: 'When Michael says he stayed through theirs, what answer does he get?',
      choices: ['Their talk was about real danger, unlike this', 'Their talk was given by real experts, unlike this',
                'Their talk was ordered by the real bosses, unlike this'], a: 0,
      cue: '「Yeah, but」のあとの一語と、続く説明。',
      line: 'I did not walk out in the middle of yours… — Yeah, but *ours was real*, Michael. … We do *dangerous stuff*.',
      said: '「途中で出ていかなかった」と言う Michael に「でもうちのは本物だった」と返る。',
      mean: 'real ＝ 本当に危ない話。事務の講習はまねごとだという意味。',
      trap: 'real は話し手や指示した人でなく中身のこと。続く dangerous で確かめる。',
      use: 'Yeah, but mine was real.（でも、こっちは本物だった）' },

    // R fix: V2 (blind 55 %): "worrying" was weak; now a near sound on "sitting… risk"
    // why: snacks ← "biscuit" taken literally (ビスケット); meetings ← "sitting" and "risk" heard, "never having to"
    //   lost
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'biscuit', seg: [150.9, 165.8],
      stem: 'What is the crew’s picture of how Michael spends his days?',
      choices: ['Sitting on his backside, never facing any risk', 'Snacking at his desk on cookies and treats',
                'Sitting in meetings, always talking about risk'], a: 0,
      cue: '終わりの「sitting on」から risk まで。',
      line: '*Sitting on your biscuit*, never having to *risk it*.',
      said: '「甘い人生で座ってばかり、危ない目にもあわない」と言われる。',
      mean: 'biscuit はここではお尻のくだけた言い方。楽な仕事だとからかっている。',
      trap: 'biscuit を「お菓子」と取りやすい。sitting on と risk とあわせて聞く。',
      use: 'Get off your butt and help me.（座ってないで手伝って）' },

    // anchor: 159–183.3 s in the scene he answers "never having to risk it" with only "Okay"; to the camera he picks up
    //   their exact words ("isn't cool anymore?", "such a man") and waves them off with "big deal"
    // R fix: V2 (blind 60 %): the walkout choice was "angry", a different mechanism; now "hurt", the same mechanism
    //   aimed at the wrong thing. C5: that choice states i4's key, so nt2 also reveals `walkout`
    // why: walkout ← he did complain about it at 145 s (right mechanism, wrong target); Toby's talk ← he called it
    //   lame and boring himself, so a hidden agreement sounds plausible
    { id: 'nt2', skill: 'attitude', level: 'C2', point: 'nerfy', reveals: ['biscuit', 'walkout'], seg: [159.0, 183.3],
      stem: 'In Michael’s comment to the camera, what is he trying not to show?',
      choices: ['That the crew’s jab about his soft life stung', 'That the crew walking out hurt his feelings',
                'That he thinks Toby’s talk was dull as well'], a: 0,
      cue: '場面での短い返事と、カメラに向けた言葉の中身。',
      line: '…never having to risk it. — Okay. … What, *nerfy life isn’t cool anymore*? Darryl thinks he’s *such a man*… Well, *big deal*.',
      said: '場では「オーケー」だけ。カメラには「甘い人生はもうダメ？大したことない」と言う。',
      mean: '相手の言葉を拾い直し、big deal で平気なふり。気にしない人はここまで言い返さない。',
      trap: '出ていかれた不満にも聞こえるが、拾うのは nerfy と man。何に言い返すかを追う。',
      use: 'Whatever. I didn’t want to go anyway.（別にいいし。どうせ行きたくなかった）' },

    // why: the till ← the store is heard, the job word missed (both are soft jobs, so only "greeter" decides);
    //   Darryl's ← "worked in a warehouse" heard as Darryl's own warehouse
    { id: 'h1', skill: 'humor', level: 'C1', point: 'warehouse', seg: [178.6, 185.1],
      stem: 'Why does Michael’s claim to warehouse work get a laugh?',
      choices: ['His “warehouse” job was greeting shoppers at a store', 'His “warehouse” job was working the till at a store',
                'His “warehouse” job was at Darryl’s, years before'], a: 0,
      cue: 'warehouse の2回めと、そのあとの仕事の名前。',
      line: 'I worked in a warehouse. *Men’s Warehouse*. *I was a greeter*.',
      said: '「倉庫で働いたことがある。メンズ・ウェアハウスで。あいさつ係だった」。',
      mean: '店名に warehouse が入るだけの紳士服店。入口で客を迎える係で、力仕事ではない。',
      trap: '最初の warehouse で倉庫と思いこみやすい。続く店名と仕事名で変わる。',
      use: 'Big deal. I’ve done that too.（大したことないよ。僕もやったことある）' },

    // anchor: 185–203 s "Probably make them feel like wimps. Not me." then the greeter's welcome, played out in full as
    //   proof ("Hello. I'm Michael. Welcome to Men's Warehouse… special on khaki pants")
    // why: Darryl ← the target Michael aims at ("make them feel like wimps"); the crew ← "Darryl thinks he's such a
    //   man because… warehouse" heard as the butt of the speech
    // R fix: V2 (blind 65 %) / S1: "really" signalled the twist (the speaker himself); removed
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'warehouse', seg: [185.0, 203.2],
      stem: 'In Michael’s talk to the camera, who is the joke on?',
      choices: ['Michael, who thinks a greeter’s job makes him tough', 'Darryl, who would scare off shoppers as a greeter',
                'The crew, who think only warehouse work is real'], a: 0,
      cue: '「Not me」のあと、彼が実演してみせる中身。',
      line: '…make them *feel like wimps*. *Not me.* … *Hello. I’m Michael. Welcome to Men’s Warehouse.*',
      said: '「Darryl ならお客を弱虫気分にさせる。僕は違う」と言い、紳士服店の出迎えを実演する。',
      mean: '男らしさの証拠に、いちばんやわらかい接客を誇らしげに見せる。笑われているのは彼自身。',
      trap: '矛先は Darryl なので彼が的に聞こえる。証拠に何を出したかを聞けば、的は話し手。',
      use: 'Watch and learn. This is how it’s done.（見てて。こうやるんだよ）' },
  ]
};
