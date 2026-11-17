// REVIEW 2026-11-16: pass 7, fix 17, drop 0, new 0; ear checks 1
// REVIEW open: a3 rests on the turn split at 158–165 s (ear check). The medication question's speaker (≈90 s) is
//   still unknown; p1's stem only says it is put to Craig.
// “When your coworker is a lot but you respect the hustle | Parks and Recreation” (the official Parks and Recreation
// channel, Season 6): Leslie pairs her staff with their Eagleton counterparts and brings in Craig as a filing temp; his
// intensity wins Donna over, and when Leslie plans to cut him, Donna defends him and the staff start offering to leave.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈175 s; music to 196 s. Untested: 9.6 s
// "Tinnifer" (a name), 31–34 s "No! Why? This can't be happening. Why, Leslie?" (several voices, speakers unknown),
// 49–52 s the "Spanish man named Terrence" joke, 68.6 s and 90 s (who says the Bermuda-grass line and the medication
// question; no item asks), 136.7 s "It won't last" (speaker unclear), 149.4 s "Okie dokie, Leslie", 162 s "Mellie"
// (whisper gives it a new turn), 172.3 s "Excuse me! Who even are you?" (speaker unknown).
// EAR CHECK: 158.2–172.2 s a3 — "Scandal's my favorite show…" is taken as Donna's and "of course you like Scandal…
//   I love you" as Craig's (whisper splits the turns, captions run them together; no name inside)
import type { Clip } from '../types.ts';

export const craigTemp: Clip = {
  id: 'craigtemp', video: 'sLo1Q4xRGBs', title: 'When your coworker is a lot but you respect the hustle', dur: 196,
  wpm: 165, band: 'fast', tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 50 %, right): "Eagleton wants to hire them" was far off; "who their new boss will be" (paired
    //   up with someone from Eagleton, heard as reporting to them) replaces it
    // why: vote ← "new filing temp" comes at the end of her speech; new boss ← "paired up with the person…in
    //   Eagleton" heard as being put under someone
    { id: 'g2', skill: 'gist', level: 'B1', point: 'pairs', seg: [0, 30.6],
      stem: 'What is Leslie doing in the opening of the scene?',
      choices: ['Pairing each staffer with someone from Eagleton', 'Asking her staff to vote on a new filing temp',
                'Telling each staffer who their new boss will be'], a: 0,
      cue: '最初の文と、そのあとの名前の並べ方。',
      line: 'you will be *paired up* with the person who is roughly your *equivalent in Eagleton*',
      said: 'イーグルトンで同じ立場の人と組ませる、と言い、一人ずつ相手の名前を告げる。',
      mean: 'paired up ＝ 二人一組にされる。equivalent ＝ 同じ役割の人。',
      trap: 'paired up with を「〜の下につく」と取ると、上司の発表に聞こえる。',
      use: 'We’ll pair you up with a buddy.（相棒と組んでもらいます）' },

    // why: hurt ← being left off a list is usually a sad beat; relieved ← "Not surprised" read as he expected, and
    //   wanted, to work alone
    { id: 't1', skill: 'attitude', level: 'B2', point: 'tom', seg: [12.0, 21.1],
      stem: 'When Tom hears no name for himself, how does he take it?',
      choices: ['Proud: he sees himself as unique', 'Hurt: he feels left out again', 'Relieved: he wants to work alone'],
      a: 0,
      cue: '「Not surprised」のあと、自分をどう言うか。',
      line: 'Not surprised, and *one of a kind*. Just like the *custom Nikes I designed*',
      said: '「驚かないね、唯一無二だから。自分でデザインした特注スニーカーみたいに」と言う。',
      mean: '相手がいないのを、特別な証拠と受け取って得意になっている。',
      trap: '名前が呼ばれないのは普通は寂しい場面。でも one of a kind は自慢の言葉。',
      use: 'This bag is one of a kind.（このバッグは一点物なんだ）' },

    // R fix: V2 (blind 50 %, right): "hurt by his advice" was a filler; "plays along, as if touched" (the sincerity
    //   flip) replaces it
    // why: meant to change it ← "Wasn't" heard as "Was" (the n't lost); plays along ← a two-word reply to praise read
    //   as a warm thank-you
    { id: 'h2', skill: 'humor', level: 'C1', point: 'wasnt', reveals: ['planning'], seg: [35.0, 42.0],
      stem: 'What makes Donna’s short reply to Craig funny?',
      choices: ['Her flat reply makes his big advice pointless', 'Her reply admits she had meant to change it',
                'Her reply plays along, as if deeply touched'], a: 0,
      cue: '大げさなアドバイスと、返事の長さの差。',
      line: 'I love it. *Never change it!* — *Wasn’t gonna.*',
      said: '「名前、変えないで！」と熱く言う Craig に、Donna が二語で返す。',
      mean: '名前を変える人はまずいない。熱すぎる相手に冷静な一言で返すのが笑い。',
      trap: 'wasn’t を was と聞くと「変える気だった」になる。短い返事ほど否定の n を確かめる。',
      use: 'Relax, I wasn’t going to.（大丈夫、そのつもりはないよ）' },

    // R fix: N1/dict test: the star span held the full stop ("wasn't gonna."); now it matches the answer
    { id: 'x1', skill: 'dict', level: 'B2', point: 'wasnt', reveals: ['planning'], seg: [38.0, 42.0],
      stem: 'Type what Donna says: “___.” (2 words)', answer: "wasn't gonna",
      cue: '「Never change it!」のすぐあと、短い返事。', line: 'Never change it! — *Wasn’t gonna*.',
      said: '「絶対変えないで！」に「その気なかったけど」と返す。',
      mean: 'Wasn’t gonna ＝ I wasn’t going to の主語が落ちた形。会話でよく使う。',
      trap: 'wasn’t の t が消え「ワズン」と聞こえる。n が残れば否定。',
      use: 'Don’t tell her. — Wasn’t gonna.（言わないでね—言う気ないよ）' },

    // why: perfect ← "the perfect name" was his line about Donna's name; too long ← "Craig, Craig" repeated sounds like
    //   a fuss over the name's form
    { id: 'd1', skill: 'detail', level: 'B1', point: 'name', seg: [41.6, 48.9],
      stem: 'What does Craig think of his own name?',
      choices: ['It is boring', 'It is perfect', 'It is too long'], a: 0,
      cue: '「You’re Craig, right?」への返事。', line: 'Oh, yes, *I hate that name*. *So boring*.',
      said: '「そう、その名前大嫌い。すごく退屈」と答える。',
      mean: '自分の名前が平凡でつまらない、と思っている。',
      trap: 'perfect は直前に Donna の名前をほめた言葉。自分の名前には hate と言う。',
      use: 'I hate my handwriting. It’s so messy.（自分の字が嫌い。汚くて）' },

    // R fix: V2 (blind 65 %) and K1: "head of the office" was defensible from “I did everything”; it and the
    //   literal "heavy things" give way to two shoulder readings
    // why: blame ← "on my shoulders" heard as "shoulder the blame"; good spirits ← "loved every second of it" heard as
    //   what he carried for the team
    { id: 'ph1', skill: 'phrase', level: 'B2', point: 'shoulders', seg: [58.8, 67.2],
      stem: 'When Craig describes his old job in Eagleton, what does he mean?',
      choices: ['He did most of the work there', 'He took the blame for everything', 'He kept everyone in good spirits'],
      a: 0,
      cue: '「Everything.」のあと、体の部分が出る言い方。',
      line: 'I *carried* the Eagleton department *on my shoulders* for years',
      said: '「何でもやった。イーグルトンの部署を何年も背負ってた」と言う。',
      mean: 'carry ... on my shoulders ＝ 責任や仕事を一人で背負う。',
      trap: '肩から「責任を負わされた」と取りやすいが、楽しかったと言っている。',
      use: 'She carried the team on her shoulders.（彼女がチームを背負っていた）' },

    // why: 18 ← the -ty/-teen swap; 8 dollars ← "eighty" clipped, plus price talk
    { id: 'n1', skill: 'number', level: 'B1', point: 'grass', seg: [68.0, 73.4], keep: true,
      stem: 'How much more per square foot does the switch to Bermuda grass cost?',
      choices: ['18 cents', '80 cents', '8 dollars'], a: 1,
      cue: '「only」のすぐあと、数字の語尾。', line: 'It’s only *80 cents more* per square foot.',
      said: '平方フィートあたり、たった80セント高いだけ、と言う。',
      mean: 'eighty は最初の「エイ」を強く言う。eighteen なら後ろの「ティーン」が強い。',
      trap: '-ty と -teen は強勢の位置で聞き分ける。cents があるのでドルではない。',
      use: 'It’s only five dollars more.（たった5ドル高いだけだよ）' },

    // R fix: V2 (blind 75 %) and S1: "really" in the stem flagged the one non-literal choice; a second non-literal
    //   reading (wrong target) now competes. S4: the seg ended on "I" (98.4 s); it ends at 98.2 s
    // why: stress check ← the Japanese frame: a health question as concern (体調を気づかう); rude to Donna ← he has
    //   just shouted "apologize to… Donna", so the jab seems to be about manners
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'meds', seg: [89.4, 98.2],
      stem: 'After Craig’s rant, what is the medication question telling him?',
      choices: ['That he is acting out of control', 'That he is being rude to Donna',
                'That he should get his stress checked'], a: 0,
      cue: '「I’m just guessing here」と、薬の量の言い方。',
      line: 'and *I’m just guessing here*, some kind of medication that you maybe need a lot of',
      said: '「ただの推測だけど、必要な薬を飲んでないか、飲みすぎたんじゃない？」と聞く。',
      mean: '本気の質問ではなく「どうかしてるよ」という皮肉。推測のふりが皮肉を強める。',
      trap: '健康の質問は日本語では気づかいだが、ここは「ゼロか多すぎ」の両極端が皮肉の印。',
      use: 'Did you, I don’t know, forget to sleep?（もしかして、寝るの忘れた？）' },

    // R fix: S4: the seg cut into "that" (94.4 s) and "I" (98.4 s); now 94.35–98.2 s
    // why: "and taken none of" ← the weak "have" drops out; "and have taken one of" ← "none" loses its n after
    //   "taken"
    // anchor: 95.9–96.8 s "and have taken none of" in both sources; the weak "and have" and the final "of" are what
    //   grammar tidies away
    { id: 'c2', skill: 'dict', level: 'C2', point: 'meds', seg: [94.35, 98.2],
      stem: 'Type the missing words: “…a lot of ___, or maybe too much…” (5 words)', answer: 'and have taken none of',
      cue: '「a lot of」と「or maybe」の間、弱い語が多い。',
      line: 'that you maybe need a lot of *and have taken none of*, or maybe too much of today?',
      said: '「たくさん要るのに飲んでないか、今日飲みすぎた薬」と皮肉る。',
      mean: 'and have は「ンハヴ」ほどに弱まる。文末の of は need a lot of と同じく前置詞が残る形。',
      trap: '文末の of は書き落としやすく、have も taken の前で消えかける。聞こえた語のまま書く。',
      use: 'Something I’ve heard a lot about.（よく話に聞いていたもの）' },

    // R fix: V2 (blind 50 %, right): "time off work" was a filler; a sincere confession and a comeback now compete
    // why: temper ← "medical condition… incurable" heard as an honest admission about his outbursts; comeback ←
    //   "all right?" heard as throwing the jab back
    { id: 'h4', skill: 'humor', level: 'C1', point: 'caring', seg: [98.0, 104.5],
      stem: 'What makes Craig’s answer about his health funny?',
      choices: ['He names a virtue as if it were a disease', 'He admits his temper is a real problem',
                'He turns the jab back around on the asker'], a: 0,
      cue: '「It’s called」のあと、病名の中身。', line: 'It’s called *caring too much*, and it’s *incurable*!',
      said: '「持病がある。思いやりすぎ病で、治らないんだ！」と叫ぶ。',
      mean: '欠点のふりをした自慢。面接の「短所は頑張りすぎです」と同じ型。',
      trap: 'medical condition や incurable は深刻な言葉だが、病名の中身が長所なので冗談。',
      use: 'My only flaw? I work too hard.（短所？頑張りすぎることかな）' },

    // R fix: V2 (blind 70 %) and S1: "right after the line before" pointed at the contrast; "seriously ill" was far
    //   off, and a causal reading replaces it
    // why: made up ← "Also" heard as "actually", a correction; real reason ← the itch heard as the real cause of his
    //   temper
    // anchor: 100.3–103.8 s the grand fake condition ("caring too much… incurable"); 105.0 s "Also" adds a true, small
    //   skin complaint to the same list, in the same loud tone
    { id: 'c1', skill: 'humor', level: 'C2', point: 'eczema', reveals: ['caring'], seg: [98.0, 107.2],
      stem: 'Why does “Also, I have eczema” get a laugh?',
      choices: ['A small, real complaint tops the grand mock one', 'It admits that the caring problem was made up',
                'It gives the real reason he is so worked up'], a: 0,
      cue: '直前の「病名」と、Also で足すものの重さの差。',
      line: 'It’s called caring too much… *Also, I have eczema.*',
      said: '「思いやりすぎ病」と叫んだあと、「あと、肌の病気もある」と付け足す。',
      mean: '大げさな作り話の病気の次に、本物だが小さな悩みを同じ調子で並べる落差の笑い。Also は訂正ではなく追加。',
      trap: 'Also を「実は」と取ると、うその告白に聞こえる。大きな話のすぐあとの小さな話は、たいていオチ。',
      use: 'I’m tired, broke, and also hungry.（疲れてて金欠で、あと腹ぺこ）' },

    // R fix: V2 (blind 80 %): "shouting" and "refuse to work with partners" were from other scenes; both are now
    //   built on this segment's words
    // why: moving to marry ← "the fiancé in Denver" is heard, "It won't last" is missed; vote ← "No, you should keep
    //   him" heard as the staff overruling her
    { id: 'g1', skill: 'gist', level: 'B2', point: 'cuts', reveals: ['cut', 'keep', 'leave', 'larry', 'even'], seg: [108.0, 150.9],
      stem: 'Why is Leslie so upset by the end of the cutback talk?',
      choices: ['Her plan to cut one person makes others offer to leave',
                'Donna announces she is moving away to get married',
                'Her staff take a vote and overrule her plan to cut'], a: 0,
      cue: 'Craig を減らす案のあと、ほかの人が何を言い出すか。',
      said: 'Craig を減らす案に Donna は彼をかばい、ほかの人まで辞めると言い出す。',
      mean: '一人減らすつもりが、みんな去りそうになり、Leslie は怒る。',
      trap: 'Denver の婚約者や keep him が耳に残る。最後の怒りの言葉が何についてかを聞く。',
      use: 'Is everyone quitting on me?（みんな私を置いて辞めるの？）' },

    // R fix: V2 (blind 80 %): the key was the only "but"; a "but" about Donna's own pay now competes. S5: the cut
    //   fell 0.28 s before "but" (114.48 s); it is now at 114.15 s. N7: `said` named "the glue" (ph2), reworded
    // why: her pay ← "cutbacks" plus "but" read as a catch for Donna herself; extra work ← "cutbacks" read as more
    //   work for the ones who stay
    { id: 'r1', skill: 'predict', level: 'B2', point: 'cut', seg: [108.0, 114.15], then: [114.15, 116.7],
      stem: 'After telling Donna her job is safe, what is Leslie about to say?',
      choices: ['A “but”, then bad news for someone else', 'A “but”, then a catch about her own pay',
                'A request that she take on extra work'], a: 0,
      cue: 'cutbacks の話で、まず安心させる言い方のあと。',
      line: 'your job is secure, of course… *But I think Craig’s gonna have to go.*',
      said: '「あなたの仕事はもちろん安泰」と言ったあと、「でもクレイグには辞めてもらう」と続く。',
      mean: '先に安心させるのは、別の人への悪い知らせの前置き。but が来る合図。',
      trap: '安心させる言葉のあとは but が来やすい。その but が誰の話かまで待って聞く。',
      use: 'You’re great, but we need to talk.（君は最高。でも話がある）' },

    // R fix: V2 (blind 65 %): "stuck in the same role" was a put-down that the praise context ruled out; now two
    //   praising "stick" readings compete
    // why: rules ← glue = くっつく, so she sticks to the rules; stayed longest ← glue = stuck to the place for years
    { id: 'ph2', skill: 'phrase', level: 'B2', point: 'glue', seg: [108.0, 114.2],
      stem: 'When Leslie tells Donna her job is secure, what does she say about her?',
      choices: ['She keeps the whole department together', 'She sticks to the rules no matter what',
                'She has stuck around longer than anyone'], a: 0,
      cue: '「basically」のあと、身近な物のたとえ。', line: 'You’re basically *the glue of this department*.',
      said: '「あなたはこの部署の接着剤みたいなもの」と言う。',
      mean: 'the glue ＝ みんなをつなぎとめる中心の人。ほめ言葉。',
      trap: 'glue を「くっつく」と取ると規則や居座りの話に聞こえる。人に使うと「まとめ役」。',
      use: 'She’s the glue that holds us together.（彼女がみんなをまとめてる）' },

    // R fix: V2 (blind 50 %, right) and §9.4: the title ("you respect the hustle") gave "admires" away. Now three
    //   reasons to keep him, all respectful; skill attitude → detail (it asks for her stated reason)
    // why: work done ← his "I did everything" claim, and "hustle" in the title; stood up for her ← he demanded an
    //   apology to "my best friend, Donna" just before
    { id: 'a2', skill: 'detail', level: 'B2', point: 'keep', seg: [116.3, 129.0],
      stem: 'What reason does Donna give for keeping Craig?',
      choices: ['He is a lot, but he truly cares about the job', 'He is a lot, but he gets so much work done',
                'He is a lot, but he stood up for her before'], a: 0,
      cue: '「No, you should keep him.」のあとの理由。',
      line: 'He’s *crazy intense*, but I’ve *never met anyone who cares more* about this job.',
      said: '「すごく暑苦しいけど、彼ほど仕事を大事にする人はいない」と言う。',
      mean: 'crazy intense は欠点の認め。but のあとが本音で、理由は仕事への熱意。',
      trap: '「何でもやった」や Donna をかばった場面が浮かぶが、理由は but のあと。',
      use: 'He’s a lot, but he’s great.（クセは強いけど、いい人だよ）' },

    // R fix: V2 (blind 55 %) and S3: the cue held "cares more", words only the key had. "Speaking loudly" (a filler)
    //   gives way to a wrong-person reading
    // why: Craig can hear ← "I'm right here" heard as "he's right here", a warning about Craig; boss ← the cutback
    //   talk, so it sounds like pulling rank
    { id: 'i2', skill: 'infer', level: 'C1', point: 'here', reveals: ['keep'], seg: [116.3, 129.0],
      stem: 'Why does Leslie cut in with “Uh, Donna, I’m right here”?',
      choices: ['She cares about the job at least as much', 'She is reminding Donna who the boss is',
                'She warns that Craig can hear them talking'], a: 0,
      cue: '直前のほめ言葉と、そのあとの Donna の返事。',
      line: 'anyone who *cares more* about this job. — Uh, Donna, *I’m right here.*',
      said: 'Donna のほめ言葉に、Leslie が「私ここにいる」と割り込む。',
      mean: '私だって誰より大事にしてる、という抗議。Donna の「あなたより上かも」で確定。',
      trap: 'I’m を he’s と聞くと Craig の話になる。直前の比べ方への反応と取る。',
      use: 'Hello? I’m right here.（ちょっと、本人ここにいるんですけど）' },

    // why: new job ← "thinking about leaving" sets up the job-offer script; saved enough ← "but I could" read as
    //   money
    { id: 'd4', skill: 'detail', level: 'B2', point: 'leave', reveals: ['planning'], seg: [129.0, 136.3],
      stem: 'What makes Donna say she could leave if she wanted?',
      choices: ['She has a home in another city', 'She has a new job lined up', 'She has saved enough to quit'], a: 0,
      cue: '「but I could」のあと、You know で並べるもの。',
      line: 'You know, I got the *condo in Seattle*, the fiancé in Denver.',
      said: '「シアトルにマンション、デンバーに婚約者がいるし」と、行き先があることを並べる。',
      mean: 'condo ＝ 分譲マンション。いつでも別の町に移れる、という意味。',
      trap: 'leaving と聞くと転職の話を予想しやすいが、挙げているのは住む場所と人。',
      use: 'I’ve got a place in Seattle.（シアトルに家があるんだ）' },

    // R fix: V2 (blind 55 %): "but I could" ruled out "was" by meaning alone; a fourth grammatical negative
    //   ("haven't been") joins, so the sound has to settle it
    // why: was ← wasn't's n't nearly vanishes; am not ← the negation is caught but the tense is lost; haven't been ←
    //   "wasn't" heard as "-n't" plus a weak "been"
    { id: 's1', skill: 'sound', level: 'B2', point: 'planning', seg: [129.0, 132.35],
      stem: 'Fill the gap: “I ___ planning on it, but I could.”',
      choices: ['was', 'wasn’t', 'am not', 'haven’t been'], a: 1,
      cue: '「Are you thinking about leaving?」への返事の頭。', line: 'I *wasn’t* planning on it, but I could.',
      said: '「その気はなかったけど、できるよ」と答える。',
      mean: 'wasn’t の t はほぼ消えて「ワズン」。but I could と対で「その気はないが可能」。',
      trap: 'n’t が聞こえにくく was に取りやすい。but のあとの could と意味で確かめる。',
      use: 'I wasn’t planning on it, but sure.（その気はなかったけど、いいよ）' },

    // why: salary ← "cut the staff" heard as pay cuts; Eagleton ← the pairing talk at the start
    { id: 'd5', skill: 'detail', level: 'B1', point: 'larry', seg: [137.1, 141.1],
      stem: 'What does Larry offer to do?',
      choices: ['Go back into retirement', 'Take a smaller salary', 'Move to the Eagleton office'], a: 0,
      cue: '「Leslie, I would be happy to」のあと。',
      line: 'I would be happy to *go back into retirement* if you have to cut the staff.',
      said: '「人を減らすなら、喜んで引退生活に戻るよ」と申し出る。',
      mean: 'go back into retirement ＝ 引退生活に戻る。自分から身を引く申し出。',
      trap: 'cut から給料を減らす話に思えるが、cut the staff は人数を減らすこと。',
      use: 'I’d be happy to step aside.（喜んで身を引きます）' },

    // why: glad ← his offer solves her cut; joking ← "What?" heard as disbelief at a joke
    { id: 'i3', skill: 'infer', level: 'B2', point: 'even', reveals: ['larry'], seg: [137.1, 144.1],
      stem: 'When Leslie hears Larry’s offer, what does her reaction show?',
      choices: ['She never expected him of all people to leave', 'She is glad that someone finally offered to go',
                'She thinks that Larry is only joking about it'], a: 0,
      cue: '「What?」のあとの文、名前の前の一語。', line: 'What? *Even Larry* wants out?',
      said: '「え？ラリーまで辞めたいの？」と驚く。',
      mean: 'even ＝ 「〜まで」。辞めそうにない人まで、という驚きと嘆き。',
      trap: '削減したいのだから喜ぶはず、と考えやすい。even は予想外の印で、喜びではない。',
      use: 'Even my mom liked it!（母でさえ気に入った！）' },

    // R fix: V2 (blind 70 %) and K6: the key was the only hedged "not really"; "explaining" (a filler) gives way to
    //   a real question about who else is leaving
    // why: honest opinions ← "Does everybody think…" taken as a real yes/no question; who else ← "even Larry wants
    //   out" just before, so it sounds like a head count
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'game', seg: [142.4, 149.3],
      stem: 'What is Leslie doing with her question about running a town?',
      choices: ['Complaining, not looking for answers', 'Polling the staff for honest opinions',
                'Checking who else plans to leave'], a: 0,
      cue: '「What the hell」のあと、Does で始まる長い文。',
      line: 'Does everybody think that running a town is *just some game*…?',
      said: '「町の運営を、好きに出入りできるゲームだとでも思ってるの？」と言う。',
      mean: '答えを求めない修辞疑問。「そんなに軽く考えないで」という怒りの表現。',
      trap: 'Does で始まると答えを返したくなるが、強い調子の疑問は不満の表明が多い。',
      use: 'Do you think money grows on trees?（お金が木に生るとでも？）' },

    // why: three ← "thir-" heard and the -teen tail lost; thirty ← the -teen/-ty swap
    { id: 'n2', skill: 'number', level: 'B1', point: 'dvr', seg: [151.0, 158.1], keep: true,
      stem: 'How many months “pregnant” does Craig say his DVR is?',
      choices: ['three', 'thirteen', 'thirty'], a: 1,
      cue: '「my DVR is」のすぐあと。', line: 'my DVR is *13 months* pregnant with episodes',
      said: '「録画機は妊娠13か月」と言う。',
      mean: 'thirteen は後ろの「ティーン」を強く長く言う。thirty は前が強く、「ティ」は短い。',
      trap: '-teen と -ty は強勢の位置が違う。後ろが伸びたら teen。three なら後ろに何も付かない。',
      use: 'I’m thirteen episodes behind.（13話分たまってる）' },

    // R fix: V2 (blind 80 %): the distractors were easy to drop; both now carry "pregnant" or "13 months" readings
    //   as plausibly as the key
    // why: about to give out ← "13 months" heard as an old machine, "pregnant" as about to burst; babies ←
    //   "pregnant" read literally
    { id: 'ph3', skill: 'phrase', level: 'C1', point: 'dvr', seg: [151.0, 158.1],
      stem: 'What does Craig mean about his DVR?',
      choices: ['It holds months of shows he hasn’t seen', 'It is old and about to give out on him',
                'It keeps on recording a show about babies'], a: 0,
      cue: '「Plus,」のあと、録画機を人にたとえる言い方。', line: 'my DVR is 13 months *pregnant with episodes* of Scandal',
      said: '「それに録画機が13か月分のドラマでパンパン」と言う。',
      mean: 'pregnant with ＝ 〜でいっぱいにふくらんだ。見ていない録画がたまっている冗談。',
      trap: 'pregnant を文字通りに取ると赤ちゃんの話になる。機械のたとえなので「中身で満杯」。',
      use: 'My phone is full of unwatched videos.（スマホが見てない動画でいっぱい）' },

    // R fix: V2 (blind 60 %) and K1: "thanks for helping to save his job" was defensible from Donna's defence; now
    //   "relief that his job is safe", which "no matter what happens with this job" refutes
    // why: romantic ← "I love you… always" read literally; relief ← "this job" is heard, and "no matter what
    //   happens" is missed
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'love', seg: [158.0, 172.2],
      stem: 'In the last exchange, what does “I love you” mean here?',
      choices: ['Wild joy at finding a fellow fan', 'A heartfelt confession of romance',
                'Relief that his job is safe now'], a: 0,
      cue: '「of course you like Scandal」のあとの理由。',
      line: 'Oh, of course you like Scandal. Because you’re amazing. *I love you.*',
      said: '「そりゃ好きだよね、最高だもん。大好き。仕事がどうなっても、ずっと大好き」と言う。',
      mean: '好きな番組が同じでうれしすぎての、大げさな友情表現。恋の告白ではない。',
      trap: 'I love you を恋愛と取りやすいが、理由は「同じ番組が好き」。理由の部分を聞く。',
      use: 'You like this band too? I love you!（このバンド好きなの？最高！）' },
  ]
};
