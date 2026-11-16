// REVIEW 2026-11-16: pass 6, fix 18, drop 0, new 0; ear checks 2
// Open: who says “Well, not done” at 186.1 s (Jim correcting himself or Ryan)? No item depends on it now.
// “Ryan Gets His Own Office - The Office US” (the official The Office channel, BEST OF SEASON 6): Ryan stalls on a
// data-entry job, the staff laugh off Jim's claim to be as much of a boss as Michael (the rumor came from Ryan), and
// Jim answers with a public "reward": a new office for Ryan.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 204 s; whisper's repeated line after it
// is a hallucination. Untested on purpose: 12–22 s (captions "Good either way" vs whisper "Could go either way", and
// who says "Definitely"/"Nah"), 55–57 s (whisper "Ryan. Sorry, I'm a blast" vs captions "Sorry"), 67–69 s (an
// unnamed speaker), 96–101 s (an unrelated "Do you love her?" cutaway), 117–131 s (the apple-picking story) and
// 161–171 s (Ryan's "proactive" line, tone unclear). Speakers are settled by "Ryan" (2.0 s, 133.5 s), "Phyllis"
// (25.4 s) and "Jim" (162.8 s); the person Jim asks for advice at 102–131 s is never named, so no stem names her.
// EAR CHECK: 102.5 s s1 — captions “I got to make an example”, whisper “I gotta make an example”; the key assumes the
//   reduced “gotta” (same words, reduction to confirm)
// EAR CHECK: 144.5 s dc2 — both have “I’d kind of rather”; confirm the weak “I’d” (≈ “ad”) is audible before “kind”
import type { Clip } from '../types.ts';

export const ryanOffice: Clip = {
  id: 'ryanoffice', video: '1tlgVpbSZcE', title: 'Ryan Gets His Own Office', dur: 230, wpm: 184, band: 'mid',
  tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: blind 55 % (only coherent choice; "flatly" an absolute only in a distractor). Two "wait" choices now,
    //   told apart by the reason; cue said "2回目" but the line is Ryan's third turn; said no longer gives p1's key.
    // why: pointless ← "doesn't seem like there's much of a point" heard as a refusal; one program ← Jim's upside
    //   ("all our contacts in one program") taken as Ryan's condition for starting
    { id: 'g1', skill: 'gist', level: 'B1', point: 'wait', seg: [1.2, 22.4],
      stem: 'How does Ryan respond to the data-entry task he is given?',
      choices: ['He suggests they wait and see how things turn out',
                'He suggests waiting until they switch to one program',
                'He says it’s pointless and asks for another job'], a: 0,
      cue: '「leaning one way」のあとの提案。',
      line: 'Maybe we should just *wait and find out*.',
      said: '「先のことは分からないし、様子を見てからにしよう」と先延ばしを提案する。',
      mean: 'はっきり断らず、もっともらしい理由で後回しにする。',
      trap: 'much of a point で断った、one program を待つ条件と取りやすい。最後の提案まで聞く。',
      use: 'Let’s wait and see.（様子を見よう）' },

    // R fix: blind 55 % ("smaller building" a filler). Both distractors now come from "under": new owners, shrinking.
    // why: new owners ← "under" heard as coming under another company; cut back ← under = 下, read as getting smaller
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'under', seg: [4.9, 12.9],
      stem: 'What does Ryan think might happen to the company?',
      choices: ['It might go out of business', 'It might come under new owners',
                'It might have to cut back a lot'], a: 0,
      cue: 'company’s のあとの2語。',
      line: '…if the *company’s going under*.',
      said: '「会社が潰れるなら、やっても意味がない」と言っている。',
      mean: 'go under ＝ 倒産する。沈む船のイメージ。データ整理をしない口実に使っている。',
      trap: 'under を「下に」と取ると、縮小や傘下入りを想像しやすい。go under は丸ごと覚える。',
      use: 'The shop went under last year.（その店は去年つぶれた）' },

    // R fix: use gloss (「歩いた方が早い」 isn't what might as well means).
    { id: 'dc1', skill: 'dict', level: 'B2', point: 'mightas', seg: [19.6, 22.4],
      stem: 'Type what you hear: “Nah. ___ do it now.” (3 words)', answer: 'might as well',
      cue: '「Nah.」のすぐあと、文頭の3語。',
      line: '*Might as well* do it now.',
      said: '「待つ理由もないし、今やっちゃえば」。might as は「マイタズ」とつながる。',
      mean: 'might as well ＝ 他に手もないし〜しよう、という軽い提案。',
      trap: 'might の t が弾んで as とくっつき「マイラズ」に近い。',
      use: 'We might as well walk.（もう歩いて行っちゃおうか）' },

    // R fix: blind 60 % (the only role-based choice; "busy" a filler). New distractor from the next turn's Michael.
    // why: none of his business ← Bob + "took me" heard as a private date story; tell Michael ← Michael is named in
    //   Phyllis's reply, so "not me" is read as "tell the other boss"
    { id: 'i2', skill: 'infer', level: 'C1', point: 'tellme', seg: [25.0, 36.8],
      stem: 'Why does Jim say Phyllis shouldn’t be telling him about her lunch?',
      choices: ['As her boss, he can’t just let it slide', 'Her time with Bob is none of his business',
                'She should be telling Michael instead'], a: 0,
      cue: 'and also のあとに続く、もう一つの注意。',
      line: '*Shouldn’t be telling me* that stuff *and also*…',
      said: '昼に酔ったと話すフィリスに「そういうことは言わないで」、さらに長い昼休みも注意。',
      mean: '上司が聞いたら見逃せない話だから。also で、勤務のルールの話だと分かる。',
      trap: 'Bob の話なので私生活の話と取りやすい。also のあとの注意が理由の手がかり。',
      use: 'I didn’t hear that.（聞かなかったことにするね）' },

    // why: one hour ← the usual lunch break; three hours ← "a little tipsy" suggests a long boozy lunch
    { id: 'n1', skill: 'number', level: 'B1', point: 'lunch', seg: [31.1, 37.0], keep: true,
      stem: 'How long are the lunches Jim complains about?',
      choices: ['One hour', 'Two hours', 'Three hours'], a: 1,
      cue: 'lunches の直前の数字。',
      line: '…shouldn’t be taking *2-hour lunches* without telling me.',
      said: '「黙って2時間も昼休みを取るのはだめ」と言っている。',
      mean: '数字＋名詞の形容詞では hour に s は付かない（2-hour lunch）。',
      trap: 'two-hour は「トゥーアワ」と一続き。lunches の前の数字を聞く。',
      use: 'a two-hour layover（2時間の乗り継ぎ）' },

    // R fix: blind 50 % ("asks who complained" a filler). Distractors now a misread permission and a misread "okay".
    // why: permission ← "Michael doesn't really care" stretched to "Michael said it was fine"; accepts ← "Oh, it's
    //   okay" heard as "okay, understood"
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'brushoff', seg: [36.4, 42.6],
      stem: 'How does Phyllis take Jim’s warning?',
      choices: ['She shrugs it off as no real problem', 'She says Michael already said it was fine',
                'She accepts it and will tell him next time'], a: 0,
      cue: '「Oh,」で始まる返事と、Michael の名前。',
      line: 'Oh, *it’s okay*. *Michael doesn’t really care* about these things.',
      said: '「大丈夫よ。マイケルはそういうの気にしないから」と答える。',
      mean: '謝らずに「問題ない」と流している。もう一人の上司を盾にしている。',
      trap: 'it’s okay を「了解」と取りやすい。気にしないと許可したは別。言われた語のまま聞く。',
      use: 'Oh, it’s fine. Nobody really minds.（大丈夫、誰も気にしないよ）' },

    // R fix: blind ≥ 50 % (the key quoted the claim, the obvious joke). Now asks why they laugh, with reasons.
    // why: petty ← the lunch rule is what he was saying just before; caught out ← Phyllis was just told off, and a
    //   laugh at a colleague's expense is the usual office script
    { id: 'h1', skill: 'humor', level: 'C1', point: 'laugh', seg: [39.4, 48.6],
      stem: 'Why do the others laugh just before Jim asks what’s funny?',
      choices: ['They don’t see him as a real boss', 'They find his lunch rule a bit petty',
                'They think Phyllis just got caught out'], a: 0,
      cue: '笑いの直前の主張と、そのあとの返事。',
      line: 'I’m just as much of a *boss as Michael*.',
      said: '「僕だってマイケルと同じくらい上司だ」と言うと笑いが起き、「何がおかしい？」と聞く。',
      mean: '周りはジムを本物の上司と見ていない。すぐあとの「上司じゃない」という返事で分かる。',
      trap: '昼休みの注意を笑ったと取りやすい。笑いの理由は直後の返事で確かめる。',
      use: 'What’s so funny?（何がおかしいの？）' },

    // why: office ← the clip's title and ending; started after ← "co-" heard as junior to Michael
    { id: 'd3', skill: 'detail', level: 'B1', point: 'fire', seg: [46.7, 51.0],
      stem: 'What reason is given that a co-manager isn’t a real boss?',
      choices: ['He isn’t able to fire people', 'He has no office of his own', 'He started after Michael did'], a: 0,
      cue: '「Not like」のあと、上司ならできること。',
      line: '…not like you can *fire people* or anything.',
      said: '「共同マネージャーは上司じゃない。クビにもできないし」と言われる。',
      mean: 'not like 〜 or anything ＝「別に〜できるわけでもない」。権限の指摘。',
      trap: 'co-manager を「マイケルの下」と取ると、後から来た人だと思いやすい。',
      use: 'It’s not like I’m in a hurry.（別に急いでるわけじゃない）' },

    // why: don't know ← can't = できない, read as "unable to know"; nobody told ← "Who told you this?" answered as
    //   "no one"
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'cantsay', seg: [50.8, 56.0],
      stem: 'When Jim asks who told them, what does the answer do?',
      choices: ['It refuses to name the source', 'It admits they don’t know who', 'It says nobody really told them'], a: 0,
      cue: '「We」で始まる短い返事。',
      line: '*We can’t say*.',
      said: '問いつめるジムに「それは言えない」と答える。',
      mean: 'can’t say ＝ 知っているけど言えない。知らないなら I don’t know と言う。',
      trap: 'can’t を「分からない」と取ると、知らない意味に聞こえる。say とセットで「言えない」。',
      use: 'Sorry, I can’t say.（ごめん、それは言えない）' },

    // R fix: blind 55 % ("never reads emails" a filler). Distractors now misread the question's purpose.
    // why: not name him ← a question in place of an answer read as dodging (Japanese 遠回し frame); unsure of
    //   sender ← "count" heard as doubt about where the email came from
    { id: 'h2', skill: 'humor', level: 'C1', point: 'email', seg: [70.3, 76.4],
      stem: 'Why is the question about an email funny?',
      choices: ['Ryan didn’t just tell people; he emailed it around', 'The speaker is trying not to name Ryan directly',
                'The speaker isn’t sure the email came from Ryan'], a: 0,
      cue: 'ジムの「Who here」の質問への返し。',
      line: '*Does an email count?* — Yes. — *Then, yeah.*',
      said: '「ライアンから聞いた人は？」に「メールも入る？」「うん」「じゃあ、はい」。',
      mean: 'ライアンはその話をメールで回していた。証拠が文字で残っているのがおかしい。',
      trap: '質問返しを、はぐらかしと取りやすい。Then, yeah であっさり認めている。',
      use: 'Does a text count?（メッセージでもいい？）' },

    // R fix: blind 50 % ("meeting nearly over" a filler). New distractor: a close vote, from Jim's show of hands.
    // why: vote ← "close" after Jim's "Who here believes…?" show of hands, read as a close count; close to him ←
    //   close = 親しい, right after "support him"
    { id: 'pc', skill: 'phrase', level: 'B2', point: 'closeone', seg: [91.3, 95.6],
      stem: 'After “no matter what”, what does the speaker mean?',
      choices: ['I nearly got that wrong', 'The vote was nearly tied', 'He and I are very close'], a: 0,
      cue: '最後の短い2語。直前に「忘れてた」。',
      line: 'I forgot I have to support him no matter what. *Close one.*',
      said: '「何があっても彼を支えなきゃいけないのを忘れてた。危なかった」。',
      mean: 'Close one ＝ 危なかった。味方をし損ねかけたことへの一言。',
      trap: '挙手のあとで「票が接戦」、support のあとで「親しい」と取りやすい。I forgot と組で聞く。',
      use: 'Whoa, that was a close one!（うわ、危なかった！）' },

    // why: want to ← gotta and wanna both shrink to two syllables; had to ← "hadta" with a lost h; ought to ← "oughta",
    //   the same -ta ending
    // R fix: said gives p2's key (見せしめ), so it now reveals `example` (N7).
    { id: 's1', skill: 'sound', level: 'B2', point: 'gotta', reveals: ['example'], seg: [101.9, 105.6],
      stem: 'Fill the gap: “I ___ make an example out of him.”',
      choices: ['got to', 'want to', 'had to', 'ought to'], a: 0,
      cue: '文頭の I のすぐあと、短くつまる音。',
      line: 'I *got to* make an example out of him.',
      said: '「あいつを見せしめにしなきゃ」。got to が「ガラ」に近く縮む。',
      mean: 'got to ＝ have to の口語。t が弾んで「ガダ／ガラ」になる。',
      trap: 'wanna も gotta も2音節。最初の子音で判断：g なら「ガ」、w なら「ワ」。',
      use: 'I gotta go.（もう行かなきゃ）' },

    // R fix: blind 50 %+ ("copy his way" a filler). New distractor: example = 手本, a model held up to the others.
    // why: model ← example = 手本, a role model for the others; show him how ← example = 見本, a model of the work
    { id: 'p2', skill: 'phrase', level: 'B2', point: 'example', seg: [101.9, 105.6],
      stem: 'What does Jim want to do to Ryan?',
      choices: ['Punish him as a warning to the others', 'Hold him up as a model for the others',
                'Show him how the work should be done'], a: 0,
      cue: 'make an のあとの語と、out of him。',
      line: '…make an *example out of him*.',
      said: '「彼を見せしめにしないと」と言い、クビにすべきかを相談する。',
      mean: 'make an example of 人 ＝ その人を罰して、ほかの人への警告にする。',
      trap: 'example を「見本・手本」と取ると、やり方を見せる意味に聞こえる。ここは罰の話。',
      use: 'They made an example of him.（彼は見せしめにされた）' },

    // R fix: blind 55 % ("yelling is worse" a filler). New distractor: "I don't know" read as a soft dodge.
    // why: decided not to ← "But maybe I could just yell" heard as a choice already made; won't say ← Japanese 「さあ、
    //   どうかな」 frame, where "I don't know" softens a refusal to answer
    { id: 'i4', skill: 'infer', level: 'B2', point: 'power', reveals: ['fire'], seg: [104.2, 110.6],
      stem: 'When asked about firing Ryan, what does Jim’s answer show?',
      choices: ['He isn’t sure he’s allowed to do that', 'He has decided not to fire Ryan',
                'He’d rather not say what he’s planning'], a: 0,
      cue: '「To be honest,」のあと。',
      line: 'Can you actually fire people? — *To be honest, I don’t know.*',
      said: '「本当にクビにできるの？」と聞かれ、「正直、分からない」と答える。',
      mean: '共同マネージャーとして、どこまで権限があるのか自分でも知らない。',
      trap: 'I don’t know を、はぐらかしと取りやすい。聞かれたのは「できるか」。',
      use: 'To be honest, I’m not sure.（正直、よく分からない）' },

    // R fix: blind 60 % ("angry hint" a filler). New distractor: "Okay. I've heard you…" read as a polite yes.
    // why: real memory ← "Okay" read as agreement, and an example follows; polite agreement ← Japanese 「そうですね」
    //   frame: "Okay" + "I've heard you" as conceding
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'exclaim', seg: [110.9, 117.6],
      stem: 'After Jim insists he does yell, how is he answered?',
      choices: ['A teasing doubt that he really yells', 'A real memory of him shouting at someone',
                'A polite agreement that he can be loud'], a: 0,
      cue: '「Okay.」のあと、言い換えに選んだ語。',
      line: 'Okay. I’ve heard you *exclaim*.',
      said: '「僕だって怒鳴るよ」に「うん、声を上げたのは聞いたことある」と返す。',
      mean: 'yell（怒鳴る）を exclaim（声を上げる）に言い換え、やさしくからかう。',
      trap: 'Okay を同意と取りやすいが、言葉を言い換えて否定している。言い換えに注目。',
      use: 'Okay, “raised your voice,” maybe.（まあ「声を上げた」くらいかな）' },

    // R fix: blind 55 % (the title makes "rewarding" the obvious foil). Distractors now Jim's own cover story taken
    //   literally and a kind reading of the reward; trap no longer says who says "Well, not done" (unsettled).
    // why: quiet place ← Jim's stated reason ("a place where you could concentrate") taken at face value; win him
    //   over ← "For a job well done" + "You're a good kid" taken as a sincere reward
    { id: 'g2', skill: 'gist', level: 'B2', point: 'office', reveals: ['example', 'sorry'], seg: [132.9, 199.0],
      stem: 'What is Jim really doing with the new office?',
      choices: ['Embarrassing Ryan in front of everyone', 'Giving Ryan a quiet place to focus at last',
                'Winning Ryan over with a nice reward'], a: 0,
      cue: '発表の前の呼びかけと、最後のほめ言葉。',
      line: 'If I could have *everyone’s attention*… *For a job well done.*',
      said: '全員の注意を集めて、仕事をしないライアンに「新しいオフィス」を贈る。',
      mean: '全員の前で、ごほうびの形で恥をかかせる。最初に言った「見せしめ」。',
      trap: '集中できる場所、job well done を文字通りに取りやすい。全員を呼んだ理由を考える。',
      use: 'Can I have everyone’s attention?（みなさん、ちょっといいですか）' },

    // why: fifteen/fifty ← "five" runs into "different", and fi-ve-di can blur into a longer number
    { id: 'n2', skill: 'number', level: 'B1', point: 'five', seg: [134.9, 141.0], keep: true,
      stem: 'How many ways does Ryan say he has tried it in his head?',
      choices: ['Five', 'Fifteen', 'Fifty'], a: 0,
      cue: 'different ways の直前。',
      line: 'I’ve tried it like *five* different ways in my head',
      said: '「頭の中で5通りくらい試してみた」と言う。like は「〜くらい」。',
      mean: '実際には何もしていないのに、考えたことを努力のように言っている。',
      trap: 'five のあとに different の d が続き、「ファイヴディ」が fifty に聞こえやすい。',
      use: 'I tried it like three times.（3回くらいやってみた）' },

    // anchor: 144.5–145.2 s "I'd kind of" before "rather", fast, with the weak "I'd"; both transcripts have "I'd"
    { id: 'dc2', skill: 'dict', level: 'C2', point: 'idrather', seg: [141.9, 147.2],
      stem: 'Type what you hear: “I’m such a perfectionist that ___ not do it…” (4 words)',
      answer: 'i\'d kind of rather',
      cue: 'perfectionist that のあと、not の前。',
      line: 'I’m such a perfectionist that *I’d kind of rather* not do it…',
      said: '「ひどい出来でやるより、やらない方がいい」。I’d は短く「アd」程度。',
      mean: 'I’d rather（〜する方がいい）に kind of（ちょっと）が入った形。I’d の d はほぼ聞こえない。',
      trap: '文法の知識で I kind of rather と書きやすい。聞こえた順に、d も残して書く。',
      use: 'I’d kind of rather stay in.（どちらかというと家にいたいかな）' },

    // R fix: blind 65 % ("excuse" in the key presupposed a rebuttal). Key reworded; new distractor from "simple".
    // why: just right ← "only one way to do it" heard as "only one right way", agreeing with the perfectionism;
    //   dull ← "simple data entry" read as an apology for a boring job
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'oneway', seg: [142.0, 150.0],
      stem: 'What is Jim doing when he mentions simple data entry?',
      choices: ['Saying perfection isn’t an issue here', 'Agreeing it has to be done just right',
                'Admitting the job is dull but needed'], a: 0,
      cue: '「though」と、そのあとの so。',
      line: 'Simple data entry *though*, so there’s really *only one way* to do it.',
      said: '「完璧主義」に「ただの入力だから、やり方は一つだよ」と返す。',
      mean: '完璧主義という言い訳を、穏やかに崩している。反論を事実の形で言う。',
      trap: 'only one way を「正しくやるべき」と取りやすい。though は「でもさ」の反論の合図。',
      use: 'It’s just a form, though.（でも、ただの書類だよ）' },

    // R fix: blind 60 % ("admiring" a filler, the face value no C2 reader picks). New near miss: take a whack at it
    //   misread as "show me one".
    // why: instructions ← "specific vision" heard as "you know what you want, so tell me"; one example ← "take a
    //   whack at it" (try it) misread as "do one for me to copy"
    // anchor: 150.1–153.2 s the praise runs straight into "Do you want to maybe just take a whack at it?": the
    //   compliment only sets up handing the job back
    { id: 'x1', skill: 'pragma', level: 'C2', point: 'whack', seg: [147.2, 153.6],
      stem: 'When Ryan praises Jim’s “vision”, what is he really up to?',
      choices: ['Handing the whole job back to Jim', 'Asking Jim for clearer instructions',
                'Asking Jim to show him one example'], a: 0,
      cue: 'ほめ言葉のすぐあとの質問。',
      line: 'Sounds like you have a *really specific vision* for it. Do you want to maybe just *take a whack at it*?',
      said: '「君にははっきりしたイメージがあるみたいだね。自分でやってみたら？」と返す。',
      mean: 'ほめてから take a whack at it（やってみる）を勧める。仕事を上司に押し返す手口で、ほめ言葉は前置き。',
      trap: '「指示がほしい」「見本を見せて」と取りやすい。ほめた直後に何を頼むかで本音を聞く。',
      use: 'Why don’t you take a crack at it?（ちょっとやってみたら？）' },

    // R fix: blind 50 % ("too noisy" a filler). New distractor: the bother put on Jim, who has been nagging Ryan.
    // why: people bother Ryan ← "not be bothered" heard and the line taken to end there (the expected script); Jim ←
    //   Jim has been after Ryan about the task, so "bothering" is pinned on him
    { id: 'i5', skill: 'infer', level: 'C1', point: 'bother', seg: [174.3, 180.1],
      stem: 'When Jim explains what the office is for, what’s the twist?',
      choices: ['Ryan is the one bothering everyone', 'Everyone keeps bothering Ryan at work',
                'Jim is the one who’s been bothering Ryan'], a: 0,
      cue: 'bothered のあと、by に続く語。',
      line: '…not be *bothered by bothering people*.',
      said: '「集中できて、人の邪魔をすることにも邪魔されない場所を」と言う。',
      mean: '「邪魔されない」と思わせて「人の邪魔をすること」で落とす。迷惑なのは本人。',
      trap: 'bothered で文が終わると思うと、周りが彼を邪魔していると取りやすい。by のあとまで聞く。',
      use: 'Sorry to bother you.（お邪魔してすみません）' },

    // R fix: said gave "Well, not done" to Ryan; the speaker isn't settled (it reads like Jim correcting himself).
    // why: thanks ← "For a job well done" sets up a thank-you script; already done ← "done" is the word repeated
    { id: 'a3', skill: 'attitude', level: 'B1', point: 'sorry', seg: [185.9, 195.4],
      stem: 'How does Ryan react once he is shown the office?',
      choices: ['He turns sorry and promises to work late', 'He thanks Jim and says he deserves it',
                'He argues the job is already done'], a: 0,
      cue: '「Well, not done.」のあとに続く約束。',
      line: 'I will *stay late tonight*. I’m *very sorry* about everything.',
      said: '「今すぐやります。今夜は残業します。いろいろごめんなさい」と言う。',
      mean: 'ごほうびの形の罰だと気づき、急に態度を変えて謝っている。',
      trap: 'well done がほめ言葉なので、お礼の流れを予想しやすい。not done でひっくり返る。',
      use: 'I’ll stay late tonight.（今夜は残業します）' },

    // R fix: blind 50 %, and K1: "Saying it has more room than it looks" is literally what he says. Now
    //   "Sincerely…", and the weak future reading is replaced by a kind reading of "good kid".
    // why: roomier ← the literal reading, said kindly; making up ← "You're a good kid" + "Enjoy it" heard as Jim
    //   softening the lesson
    // anchor: 196.6–198.5 s "It gets bigger once you're in there" between "You're a good kid" and "Enjoy it": kind
    //   words wrapped around a claim no room can make
    { id: 'x2', skill: 'attitude', level: 'C2', point: 'bigger', seg: [195.1, 199.3],
      stem: 'What is Jim doing when he tells Ryan about the room’s size?',
      choices: ['Teasing Ryan about how tiny the room is', 'Sincerely saying it feels roomier inside',
                'Kindly making up for the harsh lesson'], a: 0,
      cue: '「good kid」のあと、部屋について一言。',
      line: 'You’re a good kid… It *gets bigger once you’re in there*. Enjoy it.',
      said: '「いい子だな。中に入ると広くなるんだ。楽しんで」と言う。',
      mean: '部屋が中で広くなることはない。狭さを長所のように言う、やさしい口調の皮肉。',
      trap: 'good kid と Enjoy it のやさしい口調で、本気の励ましと取りやすい。中身の主張がありえるかで判断する。',
      use: 'It’s cozy once you get used to it.（慣れれば居心地いいよ）' },

    // why: phone, printer ← the basics anyone might check in a new office
    { id: 'd4', skill: 'detail', level: 'B1', point: 'internet', seg: [202.5, 205.5],
      stem: 'What is the one thing Ryan asks about his new office?',
      choices: ['Whether it has internet', 'Whether it has a phone', 'Whether it has a printer'], a: 0,
      cue: '最後の短い質問、Is there のあと。',
      line: 'Is there *internet*?',
      said: '狭いオフィスに入ったライアンが、最後に「ネットはある？」と聞く。',
      mean: '仕事の道具より、ネットで遊べるかが気になる。反省はあまり続かないようだ。',
      trap: 'internet は「イナネッ」に近く、t が弱い。最初の「イ」と最後の「ネッ」を手がかりに。',
      use: 'Is there Wi-Fi here?（ここ Wi-Fi ありますか）' }
  ]
};
