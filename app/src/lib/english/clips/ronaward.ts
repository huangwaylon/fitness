// “Ron toys with Leslie's feelings | Parks and recreation” (the official Parks and Recreation channel, Season 2): Leslie
// opens a letter from the Indiana Organization of Women sure she's Pawnee's Woman of the Year, but the award is Ron's;
// he keeps it only to tease her, takes the credit for her camp project, and she sends him the work that comes with it.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈209 s (whisper loops one line from 208 s).
// Untested: 35 s (“Where my ladies at” vs “Where are my ladies at”), 66–75 s (no captions: “Bully for me”), 163–165 s
// (“some other lesser award” vs captions “it's a motherless reward”), 182–186 s (“it's a man's world, Winston… I'm a
// man”: who says it, and to whom, is unclear).
// EAR CHECK: 174.7 s pr2 — Ron's reply to “Congratulations, Ron” is “What's that?” in whisper, “what's up” in the
//   captions; the key rests on her answer “You heard me” (both sources)
// REVIEW 2026-11-16: pass 5, fix 16, drop 0, new 0; ear checks 1
import type { Clip } from '../types.ts';

export const ronAward: Clip = {
  id: 'ronaward', video: 'IEgEv00bNsw', title: 'Ron toys with Leslie\'s feelings | Parks and recreation', dur: 230,
  wpm: 154, band: 'slow', tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 75 %: dues was weak, and the title points at Ron) — asked as how her moment turns out; both
    //   distractors keep her winning, one shared with Ron, one with the soup on the mail
    // why: shares it ← "Ronald Swanson" heard as one more name read out; soup ← "you got soup all over our mail"
    //   at the start, as if the letter were spoiled
    { id: 'g1', skill: 'gist', level: 'B1', point: 'winner', seg: [0, 63.3],
      stem: 'How does Leslie’s big moment with the letter turn out?',
      choices: ['Ron wins the award she was sure was hers', 'She wins, but has to share it with Ron',
                'She wins, but the letter is soaked in soup'], a: 0,
      cue: '読み上げの最後の名前と、そのあとの反応。',
      line: 'this year’s… Female Empowerment Award winner, *Ronald Swanson*.',
      said: '自分が「今年の女性」だと思いこんだレスリーが手紙を読ませると、受賞者はロンだった。',
      mean: '期待と結果が真逆。女性団体の賞が、男のロンに行ってしまった。',
      trap: '開ける前の「私が今年の女性よ」や冒頭のスープが残りやすい。決め手は、読み上げの最後の名前。',
      use: 'And the winner is…（受賞者は…）' },

    // why: nineteen ← nine/nineteen near sound; twenty-nine ← an adult age, with "nine" heard at the end
    { id: 'n1', skill: 'number', level: 'B1', point: 'nine', seg: [17.4, 23.9], keep: true,
      stem: 'Since what age has Leslie been a paying member?',
      choices: ['Since she was nine', 'Since she was nineteen', 'Since she was twenty-nine'], a: 0,
      cue: '「since I was」のあとの数。',
      line: 'I’ve been a dues-paying member *since I was nine*',
      said: '「9歳のときから会費を払っている会員なの」と言う。',
      mean: 'dues ＝ 会費。子どものころからの熱心な会員だという自慢。',
      trap: 'nine と nineteen は最初が同じ。-teen なら語尾が長く強くなる。ここは短く切れる。',
      use: 'I’ve been a member since I was ten.（10歳のときから会員なの）' },

    // why: only a dream ← "every girl's dream" heard as her own; doesn't care ← "but" heard as brushing it off
    { id: 'h1', skill: 'humor', level: 'C1', point: 'destiny', seg: [27.95, 33.9],
      stem: 'What makes Leslie’s line about every girl’s dream funny?',
      choices: ['She puts it above a dream, then adds it back', 'She admits it is only a dream, not a sure thing',
                'She says the win would mean little to her'], a: 0,
      cue: '「But it’s my」のあと、少し間をあけて何を足すか。',
      line: 'Winning is every girl’s dream. But it’s my *destiny*. … *And my dream*.',
      said: '「受賞はみんなの夢。でも私には運命」と言い、間をおいて「それに夢」と足す。',
      mean: '夢より上の「運命」にしたのに、夢も手放さない。欲ばりな言い足しが笑い。',
      trap: 'dream で終わると思って聞くと、最後の一言を逃す。間のあとの短い足し言葉に笑いがある。',
      use: 'It’s not just a dream. It’s a plan.（ただの夢じゃない。計画だよ）' },

    // why: named too ← "Ronald Swanson" heard as one name in a list; she's pleased ← "pretty funny" taken as enjoying it
    { id: 't1', skill: 'attitude', level: 'B2', point: 'prank', reveals: ['winner'], seg: [45.5, 55.4],
      stem: 'When the name is first read out, how does Leslie take it?',
      choices: ['As a joke someone is playing on her', 'As a name read out along with her own',
                'As good news that she’s happy about'], a: 0,
      cue: '名前の直後、okay のあとの二語。',
      line: '*Ah-ha, okay, pretty funny.* — Says Ronald Swanson. — What? *No, no, no*…',
      said: '「はいはい、面白い」と流すが、本当にロンだと言われて崩れる。',
      mean: 'pretty funny ＝ 冗談だと思っての返し。本気にしていない。',
      trap: 'funny を「楽しい」と取りやすいが、読み手のいたずらだと思っている。',
      use: 'Okay, very funny. Now give it back.（はいはい、面白い。返して）' },

    // why: it's a bad time ← "about" heard as "a bad"; it's on time ← the vowel of "about" lost
    { id: 'x1', skill: 'dict', level: 'B1', point: 'abouttime', seg: [65.4, 67.4],
      stem: 'Type what Ron says: “Well, ___.” (3 words)', answer: "it's about time",
      cue: '「Well,」のあと。三語がひと続き。',
      line: 'Well, *it’s about time*.',
      said: '自分の受賞を聞いて「やっと来たか」と言う。',
      mean: 'it’s about time ＝ ようやくだ、遅すぎたくらいだ。もらって当然という顔。',
      trap: 'it’s‿about がつながり「イツァバウ」に聞こえる。time の前の t は消えやすい。',
      use: 'You’re here! It’s about time.（来た！やっとか）' },

    // R fix: S4 (20.9 s; now 82.5–96.9 s, from “…go to Leslie”) and V2 (blind 80 %) — three "Keeping it …" choices;
    //   "cure her of caring" is the near miss on "she cares way too much"
    // why: cure her ← "she cares way too much about crap like this" heard as a lesson for her; less work ← Ron's
    //   "I don't" (work hard) heard as the motive
    { id: 'i2', skill: 'infer', level: 'B2', point: 'tease', seg: [82.5, 96.9],
      stem: 'Ron calls awards stupid, so why does he keep this one?',
      choices: ['Keeping it lets him tease Leslie about it', 'Keeping it may cure Leslie of caring so much',
                'Keeping it is less work than turning it down'], a: 0,
      cue: '「which is why」が二回。二回目のあと。',
      line: 'which is why I can’t pass up this opportunity *to tease her about it*.',
      said: 'カメラに「賞はくだらない。辞退してレスリーに回すつもりだった。だが…」と話す。',
      mean: '賞そのものには興味がない。レスリーをからかう材料として手放さない。',
      trap: 'cares too much から「直す」と取りやすい。目的は to tease her。',
      use: 'I couldn’t resist teasing him.（からかわずにいられなかった）' },

    // R fix: V2 (blind 65 %) — "a list" was weak; a topic-change reading of the pause replaces it
    // why: second reason ← "However" heard as "also"; new topic ← the long pause before it heard as a break
    { id: 'm1', skill: 'marker', level: 'B2', point: 'however', reveals: ['tease'], seg: [82.9, 92.3],
      stem: 'After Ron says Leslie should get the award, what does his next word signal?',
      choices: ['He is about to reverse that plan', 'He is adding one more reason for it',
                'He is moving on to a new topic'], a: 0,
      cue: '「and I don’t」のあと、間をあけた一語。',
      line: 'because she works really hard and I don’t. … *However*, she cares way too much…',
      said: '「彼女はよく働き、私は働かない。…しかし、彼女は気にしすぎる」と続ける。',
      mean: 'However は前の話をひっくり返す合図。辞退する話が、手放さない話に変わる。',
      trap: '間があくので話の区切りに聞こえやすい。However のあとは、前と逆の内容が来る。',
      use: 'I wanted to go. However, it’s raining.（行きたかった。でも雨なんだ）' },

    // R fix: V2 (blind 55 %) — "keep putting off" was weak; a 遠慮 reading ("turn it down to be polite") replaces it
    // why: hand it over ← "pass" taken as passing something to someone; polite ← "pass" as declining, read through
    //   the Japanese 遠慮 frame
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'passup', reveals: ['tease'], seg: [89.4, 96.9],
      stem: 'What does Ron say he can’t do with this opportunity?',
      choices: ['Let it go by without using it', 'Hand it over to somebody else', 'Turn it down just to be polite'],
      a: 0,
      cue: '「I can’t」のあとの動詞と、短い語。',
      line: 'which is why I *can’t pass up this opportunity* to tease her',
      said: '「だから、からかうこの機会は逃せない」と言う。',
      mean: 'pass up ＝ 機会などを見送る、逃す。can’t pass up で「絶対にやる」。',
      trap: 'pass を「渡す」と取ると、賞を譲る話に聞こえる。pass up は機会を「見送る」。',
      use: 'I can’t pass up a free lunch.（タダのランチは逃せない）' },

    // why: gives it up ← his to-camera plan to "decline… and recommend it go to Leslie"; share ← "you deserve an
    //   award" heard as an offer
    // R fix: V2 (blind 80 %: the only "keeps it" choice) — three "keeps it / gives it up" choices; the key's
    //   "teases" now lists i2's point
    { id: 'g2', skill: 'gist', level: 'B2', point: 'keep', reveals: ['however', 'tease'], seg: [117.1, 170.9],
      stem: 'How does Ron answer Leslie’s case that the award should be hers?',
      choices: ['He keeps it and teases her about it', 'He keeps it, but agrees to share it',
                'He gives it up, but only after teasing her'], a: 0,
      cue: '彼女が理由を言うたび、ロンがどう返すか。',
      line: 'Well, it *definitely said Ron Swanson* in the letter.',
      said: '賞は自分の物だと理由を並べるレスリーを、ロンは手紙の名前を盾に一つずつかわしていく。',
      mean: '返すつもりは最初からない。話し合いの形で、からかいを続けている。',
      trap: 'カメラの前の「辞退するつもりだった」が残りやすいが、そのあと考えを変えている。',
      use: 'It says my name right here.（ここに僕の名前が書いてある）' },

    // R fix: S4 (15.4 s; now from “I think the Pawnee chapter…”) and V2 (blind 80 %) — the soup choice was weak; a
    //   "wrong office" reading of "the Pawnee chapter… made a mistake" replaces it
    // why: dues ← "dues-paying member" from the start; wrong office ← "the Pawnee chapter… has made a little mistake"
    //   heard as a mailing error
    { id: 'd1', skill: 'detail', level: 'B1', point: 'women', seg: [118.4, 132.5],
      stem: 'Why does Leslie tell Ron the award must be a mistake?',
      choices: ['The award only goes to women', 'Ron isn’t a paying member', 'It was sent to the wrong office'], a: 0,
      cue: '「the fact is」のあと。',
      line: 'But the fact is, *they only give that award to women*.',
      said: 'ロンを呼び、「支部のミスみたい。あの賞は女性にしか出ない」と話す。',
      mean: 'the fact is ＝ 実はね、事実として。言いにくいことを言う前置き。',
      trap: '冒頭の会費や支部の mistake に引かれやすい。the fact is のあとに理由が来る。',
      use: 'The fact is, we’re out of time.（実のところ、時間がないんです）' },

    // C2: what is he doing with her words? (cf. d1)
    // anchor: 121.2–128.9 s "made a little mistake" → "Really? You're saying a women's organization made a mistake?"
    //   (the subject is "you") → "I was as surprised as you were": she answers as the one being caught out
    // why: agrees ← "made a mistake" repeated, heard as confirming it; women's groups ← the same words heard as Ron's own
    //   doubt about such groups (right mechanism, wrong target)
    // R fix: V2/K5 (blind 70 %: the key was the only "her" choice) — three parallel choices on who doubts the group
    { id: 'nt1', skill: 'pragma', level: 'C2', point: 'women', seg: [118.45, 129.55],
      stem: 'When Leslie calls it a little mistake, what is Ron’s “Really?” doing?',
      choices: ['Making her the one doubting a women’s group', 'Doubting a women’s group himself, for a laugh',
                'Agreeing the women’s group got this one wrong'], a: 0,
      cue: '「Really?」のあとの文の主語。',
      line: '*Really? You’re saying* a women’s organization made a mistake?',
      said: '「支部が少し間違えた」と言われ、ロンは「へえ？女性団体が間違えたって、君が言うの？」と返す。',
      mean: '主語は you。女性を応援する彼女に「女性団体を疑うのか」と矛先を向け、自分の受賞を守っている。',
      trap: 'ロンの発言なので、女性団体への皮肉と取りやすい。疑う側に立たされているのは、話し相手の彼女。',
      use: 'Wait, you’re saying the expert is wrong?（え、専門家が間違ってるって君が言うの？）' },

    // why: her dues ← "dues-paying member" earlier; office work ← "making me look good" comes later
    { id: 'd2', skill: 'detail', level: 'B1', point: 'campproj', seg: [132.4, 138.8],
      stem: 'What else was in the letter, according to Leslie?',
      choices: ['Her camp project', 'Her years of dues', 'Her office work'], a: 0,
      cue: '「it also mentioned」のあと。',
      line: 'Yeah, but it *also mentioned my camp project*.',
      said: '「手紙には確かにロンの名前。でも私のキャンプの企画のことも書いてあった」と言う。',
      mean: '賞の理由は彼女の企画。本当に働いたのは自分だ、という主張。',
      trap: 'mentioned my のあとが速い。名詞の camp を聞き逃すと、前に出た会費に引かれる。',
      use: 'The email also mentioned the price.（メールに値段も書いてあった）' },

    // R fix: cue leak ("even" was only in the key) and V2 (blind 75 %) — "should learn the names" was weak; a
    //   mix-up reading (Zena / Athena as two camps) replaces it
    // why: mixed up ← "Zena" and "Athena" heard as two different camps; on purpose ← Ron's teasing all along
    { id: 'i3', skill: 'infer', level: 'B2', point: 'camp', reveals: ['campproj'], seg: [136.65, 144.4],
      stem: 'When Ron gets the camp’s name wrong, what is Leslie’s point?',
      choices: ['He can’t have done work he can’t even name', 'He is mixing her camp up with another one',
                'He is only pretending to get it wrong'], a: 0,
      cue: '名前を直したあと、You で始まる一文。',
      line: 'Camp Zena. — Athena. Camp Athena. *You don’t even know the name*.',
      said: '「キャンプ・ジーナね」に、「アテナ。名前も知らないじゃない」と返す。',
      mean: 'even ＝ 〜さえ。名前も知らない人が、その仕事で賞をもらうのはおかしいという指摘。',
      trap: 'わざとと取りやすいが、even が示すのは「仕事をしていない」証拠。',
      use: 'You don’t even know my name!（私の名前も知らないくせに！）' },

    // R fix: S4 (1.8 s; now 140.6–145.9 s, "Camp Athena…" to "Look, Leslie") and §9.5 ("I almost get it" isn't real
    //   English) — "had it" (the same idiom, a near sound) replaces "get it"
    // why: forgot it ← "-got it" heard with a weak first syllable; had it ← "I almost had it" is the same set phrase,
    //   and the vowel is close
    { id: 's1', skill: 'sound', level: 'B2', point: 'almost', seg: [140.6, 145.9],
      stem: 'Fill the gap: “Oh, I almost ___. I was pretty close.”',
      choices: ['got it', 'forgot it', 'had it'], a: 0,
      cue: '「almost」のあと、とても短い二語。',
      line: 'Oh, I *almost got it*. I was pretty close.',
      said: '名前を直され、「惜しかった。かなり近かった」と開き直る。',
      mean: 'almost got it ＝ もう少しで当たった。悪びれない返し。',
      trap: 'almost の t と got がつながり、forgot に聞こえやすい。got‿it は「ガリッ」と弾む。',
      use: 'So close! I almost got it.（惜しい！もう少しだった）' },

    // why: sincere thanks ← "which you're great at" and "be proud" taken at face value; cheer her up ← the praise
    //   heard as comfort after her loss
    // R fix: V2/K5 (blind 65 %: the key was the only two-part choice) — three parallel "Praising her to …"
    { id: 't3', skill: 'attitude', level: 'C1', point: 'lookgood', seg: [144.4, 155.5],
      stem: 'When Ron describes Leslie’s job, what is he really doing?',
      choices: ['Praising her to take credit for her work', 'Praising her to thank her for her work',
                'Praising her to cheer her up after losing'], a: 0,
      cue: '「your job」のあと、誰をよく見せる仕事か。',
      line: 'your job, which you’re great at, is *making me look good*, which you’ve clearly done well *because I’m getting an award*.',
      said: '「君の仕事は私をよく見せること。得意だね。だから私が賞をもらうんだ」と言う。',
      mean: 'ほめる形で、彼女の手柄を自分の物にしている。',
      trap: 'great at や done well はほめ言葉だが、結論は「私が賞をもらう」。ほめ言葉の行き先を聞く。',
      use: 'You make me look good, you know.（君のおかげで僕がよく見えるよ）' },

    // R fix: V2 (blind 60 %: "generous" was weak) — three "He praises her, then …" choices; one is the weak "Not"
    //   lost
    // why: a real promise ← "you deserve an award… some other one" taken at face value; this one is hers ← the weak
    //   "Not" in "Not this one, obviously" lost
    { id: 'h2', skill: 'humor', level: 'C1', point: 'deserve', reveals: ['lookgood'], seg: [155.9, 166.3],
      stem: 'What makes Ron’s “you deserve an award” funny?',
      choices: ['He praises her, then rules out this award', 'He praises her, then promises her an award',
                'He praises her, then says this one is hers'], a: 0,
      cue: '「you deserve an award」の直後の、Not で始まる言葉。',
      line: 'you deserve an award. *Not this one, obviously. This one belongs to me.*',
      said: '「誇りに思って。君も賞に値する。もちろんこれじゃない。これは私の物だ」と言う。',
      mean: 'ほめた直後に取り消し、賞は自分の物と念を押す。わざとの逆なで。',
      trap: '前半だけ聞くと優しい励ましに聞こえる。直後の Not this one で意味がひっくり返る。',
      use: 'You deserve a break. Just not today.（休みに値するよ。今日じゃないけど）' },

    // R fix: V2 (blind 75 %) — "went badly" was weak; "he had turned it down" (his to-camera plan) replaces it
    // why: in charge ← "on the other foot" heard as "in her shoes" as the judge; turned down ← his earlier plan to
    //   "decline this nonsense"
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'shoe', reveals: ['wouldhave'], seg: [166.2, 170.9],
      stem: 'What situation does Ron imagine next?',
      choices: ['One where their places were swapped', 'One where she chose the award winner',
                'One where he had turned the award down'], a: 0,
      cue: '「if the shoe were」のあと。',
      line: 'And *if the shoe were on the other foot* and you won the award, I would have congratulated you.',
      said: '「立場が逆で君が受賞していたら、祝ったよ」と言う。',
      mean: 'shoe on the other foot ＝ 立場が逆。「祝ってくれないの？」という催促。',
      trap: '靴や足を文字通りに考えるとつかめない。続く and you won で入れ替わりと分かる。',
      use: 'Imagine the shoe on the other foot.（立場が逆だと考えてみて）' },

    // R fix: V2 (blind 50 %, right) — "will have" didn't fit an "if … won" frame; "should have" (a near sound) replaces it
    // why: wouldn't have ← the -n't is lost and the meaning flips; should have ← "sh-" and "w-" blur in "I'd've"-speed
    //   speech, and a lecture fits Ron
    { id: 's2', skill: 'sound', level: 'B2', point: 'wouldhave', seg: [166.2, 170.9],
      stem: 'Fill the gap: “…and you won the award, I ___ congratulated you.”',
      choices: ['would have', 'wouldn’t have', 'should have'], a: 0,
      cue: '「award, I」のあと、二語が弱く続く。',
      line: 'and you won the award, *I would have* congratulated you.',
      said: '「君が受賞していたら、私なら祝っていた」と言う。',
      mean: 'would have は「ウダヴ」と縮む。もしもの話で、祝う側の自分を演出している。',
      trap: 'would have が短く、wouldn’t と聞き分けにくい。n’t なら d のあとに「ン」が入る。',
      use: 'I would have called, but I forgot.（電話するつもりだったけど忘れた）' },

    // R fix: V2 (blind 60 %) — "asking what she means" was weak; a brush-off reading replaces it
    // why: didn't hear ← "What's that?" taken literally; waving off ← Ron's scorn for awards, and a short reply heard
    //   as dismissive
    { id: 'pr2', skill: 'pragma', level: 'C1', point: 'heard', reveals: ['shoe'], seg: [172.9, 176.4],
      stem: 'When Leslie congratulates Ron, what is his short reply doing?',
      choices: ['Trying to make her say it again', 'Telling her he didn’t catch it', 'Waving off her congratulations'],
      a: 0,
      cue: '彼の返事と、彼女の三語の答え。',
      line: 'Congratulations, Ron. — What’s that? — *You heard me.*',
      said: 'しぶしぶ「おめでとう」と言い、「何だって？」に「聞こえたでしょ」と返す。',
      mean: '聞こえたのに、もう一度言わせて楽しもうとしている。',
      trap: 'What’s that? を本当の聞き返しと取りやすい。You heard me の返事が、聞こえていた証拠。',
      use: 'You heard me. I’m not saying it again.（聞こえたでしょ。二度は言わない）' },

    // R fix: S4 (16.9 s; now ends after "Ron Swanson", 190.4 s)
    // why: a camp ← "Camp Athena" from earlier; an award ← the award talk all through the clip
    { id: 'd3', skill: 'detail', level: 'B2', point: 'field', seg: [178.4, 190.4],
      stem: 'What complaint does Leslie send on to Ron?',
      choices: ['A field promised to the girls by week’s end', 'A camp promised to the girls for the summer',
                'An award promised to the girls’ group'], a: 0,
      cue: '最初の文の、promised のあと。',
      line: 'promised the girls *a field by the end of this week*… You know who you should talk to? Ron Swanson.',
      said: '「今週中に運動場をと約束した」と言われ、レスリーはロンを勧める。',
      mean: 'field ＝ 運動場。約束の仕事ごと、ロンに回している。',
      trap: '前に出た Camp Athena や賞に引かれやすい。promised the girls のあとの名詞を聞く。',
      use: 'They promised it by Friday.（金曜までにと約束した）' },

    // C2: what she says vs what we saw (the talking head)
    // anchor: 187.9–194.6 s "Ron Swanson. He's an award-winning public servant… Go on in there", then to camera
    //   202.9–209.4 s "If you don't get credit for your work, why bother doing it? Because I love it. But I'm going to
    //   make a point."
    // why: teamwork ← "He's the guy that's going to help you out" heard as sincere; giving up ← "why bother doing it" taken as her
    //   answer, when "Because I love it" follows
    // R fix: V2 (blind 70 %) — "real praise" was weak; a sincere "teamwork" reading of "he's the guy that's going to
    //   help you out" replaces it
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'field', reveals: ['tease'], seg: [187.3, 209.9],
      stem: 'After her comment to the camera, how should we hear her sending him to Ron?',
      choices: ['As payback: the credit comes with the work', 'As teamwork: Ron is the right one to help',
                'As giving up: she won’t work without credit'], a: 0,
      cue: '紹介の言葉と、カメラへの最後の一文。',
      line: 'He’s an *award-winning public servant*… — *Because I love it. But I’m going to make a point.*',
      said: '「受賞したロンに相談を」と送り出し、カメラに「好きだからやる。でも思い知らせる」と話す。',
      mean: 'カメラへの本音が場面を書きかえる。紹介は、手柄を取った人に仕事も渡す仕返し。',
      trap: 'why bother を答えと取ると「もうやらない」に聞こえる。答えは Because 以下。',
      use: 'Fine, you take the credit. And the work.（いいよ、手柄はどうぞ。仕事もね）' },
  ]
};
