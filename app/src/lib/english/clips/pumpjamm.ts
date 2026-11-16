// “Pump Up the Jamm | Parks and Recreation” (the official Parks and Recreation channel, Season 6): at a council hearing
// on an offensive tweet from the Parks account, Leslie says an employee forgot to log out; the councilmen call it
// stonewalling and flip-flopping, and she answers with a story about chocolate milk.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈84 s. Untested: 34–37 s (the councilman's
// garbled “intransigence”, captions “intence”, and the “Not a word” aside), 64–69 s (the Benghazi/Whitewater
// comparison: world knowledge, and “on a line” is a slip), 77–79 s (“a bunch of hot ladies”).
// EAR CHECK: 52.7 s s1 — “I learned” with no weak 've or 'd before it (both sources have “I learned”)
// REVIEW 2026-11-16: pass 4, fix 15, drop 0, new 0; ear checks 1
import type { Clip } from '../types.ts';

export const pumpJamm: Clip = {
  id: 'pumpjamm', video: 'L2HEBwubs90', title: 'Pump Up the Jamm', dur: 90, wpm: 162, band: 'slow',
  tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2: the key was the only cynical choice; "won over" replaced by a dismissive reading
    // why: accept but fire ← "hear from the unnamed employee" read as a call for punishment; drop it ← "utterly
    //   meaningless" heard as giving up, though the demands go on after it
    { id: 'g2', skill: 'gist', level: 'B2', point: 'press', reveals: ['employee'], seg: [0, 84.5],
      stem: 'Over the whole hearing, how do the councilmen treat Leslie’s explanation?',
      choices: ['They brush it aside and push for a bigger story', 'They accept it but want the employee fired',
                'They mock it, then drop the whole thing as silly'], a: 0,
      cue: '彼女の説明のたびに、議員が次に何を言うか。',
      said: '説明のたびに「はぐらかすな」「話が変わった」と返し、最後は職員本人を呼べと言う。',
      mean: '説明を聞く気はなく、騒ぎを大きくしたい。最初に言った「2つ目の目的」どおりの進み方。',
      trap: '最後の要求をクビの話と取りやすいが、欲しいのは処分でなく次の材料。',
      use: 'They wouldn’t take no for an answer.（何を言っても引き下がらなかった）' },

    // R fix: V2: "mixes up hearing and circus" was a filler; now a wrong-target reading of the second goal
    // why: the press ← "media circus" heard as a complaint about reporters; her office ← "circus" heard as an insult
    //   aimed at her department
    { id: 'h1', skill: 'humor', level: 'C1', point: 'circus', seg: [0.2, 12.0],
      stem: 'Why does the councilman’s list of the hearing’s goals get a laugh?',
      choices: ['His second goal admits he just wants a show', 'His second goal blames the press for the fuss',
                'He calls Leslie’s office a circus to her face'], a: 0,
      cue: '「two」のあと、2つ目の目的の中身。',
      line: 'And two, to turn this whole thing into a *media circus*.',
      said: '議長が「目的は2つ。経緯を調べること、そしてこの件を大騒ぎにすること」と言う。',
      mean: 'media circus ＝ マスコミの大騒ぎ。隠すはずの本音を、目的として言うのが笑い。',
      trap: 'circus を彼女への悪口と取りやすい。誰の目的かを聞く。',
      use: 'It turned into a media circus.（マスコミの大騒ぎになった）' },

    // why: an outsider ← the "hacked" story the councilman brings up later; harmless ← "quite simple" heard as
    //   "this is no big deal"
    // R fix: C5: d1, x1 and nt1 state its key (a slip by one employee); they now list `mistake` in reveals
    { id: 'g1', skill: 'gist', level: 'B1', point: 'mistake', seg: [12.0, 34.0],
      stem: 'What is Leslie’s statement meant to get across?',
      choices: ['One employee slipped up, and it’s dealt with', 'An outsider broke in, and the account was misused',
                'The tweet was harmless and people overreacted'], a: 0,
      cue: '「that person」のあと、何を約束しているか。',
      line: 'It was an *unfortunate mistake*.',
      said: '職員がうっかり個人的な投稿をした、本人は反省している、もう起きない、と説明する。',
      mean: '事故であり、すでに片付いた話だと伝えたい。問題を小さく、短く終わらせる説明。',
      trap: 'hacked はあとで議員が持ち出す前の説明。今の発言とあとの指摘を分けて聞く。',
      use: 'It was an honest mistake.（悪気のないミスでした）' },

    // R fix: V2: "unsure where to begin" replaced by the Japanese 実は frame (actually = a confession preface)
    // why: admit ← "actually" read as 実は, a preface to a confession; disagrees ← "Well" as a preface to pushing back
    //   on the chairman's goals
    { id: 'm1', skill: 'marker', level: 'B2', point: 'actually', seg: [12.3, 15.35],
      stem: 'When Leslie begins her statement, what does her opening signal?',
      choices: ['That this is less complicated than they think', 'That she disagrees with the goals just announced',
                'That she is about to admit something awkward'], a: 0,
      cue: 'Well のあとの短い一語と、最後の形容詞。',
      line: 'Well, it’s *actually quite simple*.',
      said: '「ええと、実はとても単純な話なんです」と話し始める。',
      mean: 'actually は相手の思い込みを正す合図。「大ごとに見えるが、実は単純」と前置きしている。',
      trap: 'actually を「実は」と訳すと告白の前置きに聞こえる。ここは相手の見方を正す合図。',
      use: 'Actually, it’s pretty easy.（実は、けっこう簡単だよ）' },

    // why: an outsider ← "hacked" from 45 s; wrong account ← "personal" and "Twitter account" heard the other way round
    // R fix: C5: its key states g1's (a slip by one employee), so reveals `mistake`
    { id: 'd1', skill: 'detail', level: 'B1', point: 'logout', reveals: ['mistake'], seg: [13.5, 24.3],
      stem: 'According to Leslie, how did the tweet get posted?',
      choices: ['Someone stayed logged in to the work account', 'An outsider got hold of the account password',
                'Someone posted a work message on their own page'], a: 0,
      cue: '「employee forgot」のあと。',
      line: 'A Parks and Rec employee *forgot to log out* of the Parks and Rec Twitter account',
      said: '職員が公式アカウントのログアウトを忘れ、私的な投稿をした。',
      mean: 'forgot to log out ＝ ログアウトし忘れた。公式の場に私的な投稿が出た。',
      trap: 'personal と account が近く、逆に取りやすい。どこに出たかを聞く。',
      use: 'I forgot to log out.（ログアウトし忘れた）' },

    // anchor: 15.2–25.3 s “a Parks and Rec employee… they posted… that person is very sorry”: three vague references
    //   where a name would go; 72.8 s the councilman names the gap: “the unnamed employee behind the tweet”
    // R fix: K1: she does keep back what the message said ("a personal private message"), so that distractor was
    //   defensible; both distractors are now things she states outright
    // why: the account ← "personal" and "account" side by side, heard as fudging where it went (she names the Parks
    //   and Rec account); an accident ← the vague tone heard as dodging intent (she says "by accident")
    // retired: never drawn under g1, whose point (mistake) it reveals, so play 3 under g1 had no C2 to give
    { id: 'nt1', skill: 'attitude', level: 'C2', retired: true, point: 'person', reveals: ['employee', 'logout', 'mistake'],
      seg: [13.5, 27.2],
      stem: 'Through her whole statement, what is Leslie careful not to say?',
      choices: ['Which of her staff posted the tweet', 'Which account the tweet went out on',
                'Whether the posting was an accident'], a: 0,
      cue: '投稿した人を、毎回どう呼んでいるか。',
      line: 'A Parks and Rec *employee*… *they* posted… *that person* is very sorry',
      said: '投稿した人を「職員」「they」「その人」とだけ呼び、名前も性別も一度も出さない。',
      mean: '名前が入るはずの所を3回ぼかしている。あとで議員が「名前の出ていない職員」を呼べと言い、ここが隠し所だと分かる。',
      trap: 'どのアカウントか、事故かは明言している。ぼかしは言い換えが続く所に出る。',
      use: 'Someone on my team made a mistake.（うちのチームの者がミスをしました）' },

    // R fix: C5: the stem states g1's key, so reveals `mistake`; ear check removed (both sources have “log out of”)
    { id: 'x1', skill: 'dict', level: 'B2', point: 'logout', reveals: ['mistake'], seg: [16.18, 20.6],
      stem: 'Type the gap: “forgot to ___ the Parks and Rec Twitter account.” (3 words)', answer: 'log out of',
      cue: '「forgot to」のあと、短い3語がつながる。',
      line: 'forgot to *log out of* the Parks and Rec Twitter account',
      said: '「公式ツイッターからログアウトし忘れた」。',
      mean: 'log out of がつながり、out の t が弾んで「ログアウラヴ」のように聞こえる。of はほぼ「ア」。',
      trap: '弱い of を落として2語と思いやすい。動詞と名詞の間の小さな音を探す。',
      use: 'Don’t forget to log out of the PC.（パソコンのログアウトを忘れずに）' },

    // R fix: V2: "making the mistake sound bigger" was the opposite of anything said; now "making light of it"
    // why: making light ← her short, calm account heard as what he objects to; staff wrote it ← "statement" heard as
    //   written for her
    { id: 'ph1', skill: 'phrase', level: 'C1', point: 'stonewall', seg: [24.3, 30.3],
      stem: 'When the councilman cuts in after her statement, what does he say she’s doing?',
      choices: ['Blocking their questions with no real answer', 'Reading them an answer her staff wrote',
                'Making light of a serious mistake'], a: 0,
      cue: '「Stop」のすぐあとの長い動詞。',
      line: '*Stop stonewalling* and tell us what happened here.',
      said: '彼女の説明が終わるとすぐ「はぐらかすのはやめて、何があったか話せ」と迫る。',
      mean: 'stonewall ＝ 石の壁のように答えをはね返す。説明を答えと認めていない。',
      trap: 'statement から原稿を連想しやすいが、責めているのは中身のなさ。',
      use: 'Stop stonewalling and give me an answer.（はぐらかさずに答えて）' },

    // R fix: V2: "worried, more to hide" was weak; now a patience reading of the repeat
    // why: patient ← repeating the answer heard as calm good will; sorry ← the Japanese frame: repeating an answer as
    //   an apology for being unclear
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'told', seg: [27.0, 34.1],
      stem: 'How does Leslie sound in her reply to that demand?',
      choices: ['Annoyed, since she has already answered', 'Patient, going over it calmly once more',
                'Sorry, since her first answer was unclear'], a: 0,
      cue: '返事の最初の4語、特に just。',
      line: 'I *just told you* what happened. It was an unfortunate mistake.',
      said: '「今言ったでしょう。不幸なミスです」と同じ説明をくり返す。',
      mean: 'I just told you ＝ 「今言ったばかり」。聞かない相手へのいら立ち。',
      trap: 'くり返しを謝りや不安と取りやすい。just told you は「もう答えた」という主張。',
      use: 'I just told you, it’s on the table.（今言ったでしょ、机の上だよ）' },

    // R fix: V2: "too old to look into" was a filler; now the your/our near sound
    // why: nobody knows ← "we may never find out" taken as a plain fact about everyone, Leslie included; the council ←
    //   "due to your" heard as "due to our"
    { id: 'i1', skill: 'infer', level: 'C1', point: 'blame', seg: [34.0, 39.3],
      stem: 'After “Sadly”, what is the councilman suggesting about the missing facts?',
      choices: ['Leslie is keeping the truth from the council', 'Nobody, Leslie included, knows the whole truth',
                'The council itself let the facts slip away'], a: 0,
      cue: '「due to your」が、誰のせいにしているか。',
      line: 'Sadly, *due to your*… we may *never find out* what happened.',
      said: '「あなたのせいで、真相は永遠に分からないかもしれない」と言う。',
      mean: 'due to your ＝ あなたが原因で。彼女が話さないからだ、とほのめかす。',
      trap: 'never find out だけだと、誰にも分からない話に聞こえる。due to が責める相手。',
      use: 'Due to the rain, we stayed in.（雨のせいで家にいた）' },

    // why: a mistake ← the words she says now ("Now you're saying"); a staff member ← "bored" pulled onto the employee
    { id: 'd3', skill: 'detail', level: 'B1', point: 'hacked', seg: [39.0, 48.0],
      stem: 'What did Leslie say when the tweet first came out?',
      choices: ['A bored teenager had probably hacked the account', 'A bored employee had posted it for a joke at work',
                'It was an unfortunate mistake by her staff'], a: 0,
      cue: '「you said」のあと、誰が何をしたか。',
      line: 'you said the account was probably *hacked by some bored teenager*.',
      said: '「最初は、退屈した10代がハッキングしたと言っていた」と議員が指摘する。',
      mean: '最初は外部の犯行という説明。今の「職員のミス」とは話が違う。',
      trap: 'unfortunate mistake は今の説明。you said と now で時を分ける。',
      use: 'My account got hacked.（アカウントが乗っ取られた）' },

    // R fix: V2/K7: the key was the longest and only two-part choice, "praise" a filler; rebuilt
    // why: name the teenager ← "teenager" is the last noun before the question; back the hack ← "hacked" repeated as
    //   if he believed it
    { id: 'i2', skill: 'infer', level: 'B2', point: 'flip', reveals: ['hacked'], seg: [39.0, 52.4],
      stem: 'Why does the councilman bring up what Leslie said back then?',
      choices: ['To show that her story keeps changing', 'To back the idea that it really was a hack',
                'To get her to name the teenager she blamed'], a: 0,
      cue: '「Now you’re saying」で、前と今を並べている。',
      line: '…hacked by some bored teenager. Now you’re saying it’s an unfortunate mistake. Why do you keep *flip-flopping*?',
      said: '「最初はハッキング、今はミス。なぜ言うことがころころ変わる？」と問いただす。',
      mean: 'flip-flop ＝ 説明を変える。前後を並べて、信用できないと印象づけている。',
      trap: 'teenager が最後に残り、人探しに聞こえる。並べた2つの説明の差が要点。',
      use: 'Stop flip-flopping and pick one.（ころころ変えないで、どっちか決めて）' },

    // why: lie ← changing her story heard as a confession; blames staff ← "employee" from her statement carried over
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'newinfo', reveals: ['flip', 'learned'], seg: [50.55, 54.95],
      stem: 'Asked why her story keeps changing, what does Leslie’s first answer do?',
      choices: ['Recasts the change as simply learning more', 'Admits that her first story was a lie',
                'Puts the blame for the change on her staff'], a: 0,
      cue: '「Well, because」のあと、変わった理由の言い方。',
      line: 'Well, because *I learned new information*.',
      said: '「新しい情報を知ったからです」と答える。',
      mean: '説明が変わったのを、うそではなく「事実を知った結果」に言いかえて、責めをかわしている。',
      trap: '話を変えた＝うそを認めた、と取りやすい。because のあとで自分をどう見せたいかを聞く。',
      use: 'I changed my mind; I learned more.（考えが変わった、詳しく知ったから）' },

    // R fix: S4: the segment was 2.55 s and began inside “flip-flopping”; now 50.55–54.95 s
    // EAR CHECK: s1
    // why: I've ← the weak 've is easy to imagine before a past participle; I'd ← a d heard in "learned" pulled forward
    { id: 's1', skill: 'sound', level: 'B2', point: 'learned', seg: [50.55, 54.95],
      stem: 'Fill the gap: “Well, because ___ new information.”',
      choices: ['I learned', 'I’ve learned', 'I’d learned'], a: 0,
      cue: 'because と learned の間に、音があるかどうか。',
      line: 'Well, because *I learned* new information.',
      said: '「新しい情報を知ったから」。I のすぐあとに learned。',
      mean: 'I と learned の間に弱い v や d の音はない。ある時に知った、という過去形。',
      trap: '’ve や ’d は弱いので、あると思えば聞こえる気がする。I の直後の音を聞く。',
      use: 'I learned something new today.（今日、新しいことを知った）' },

    // R fix: V2/K7: the key was the longest; shortened. N: the use note had broken characters (a U+FFFD pair in 気が変わった)
    // why: still believes ← "thought" heard as present; corrects herself ← "flip-flopped" in the story heard as her
    //   fixing a slip in the telling
    { id: 'h2', skill: 'humor', level: 'C1', point: 'milk', reveals: ['four'], seg: [52.4, 64.25],
      stem: 'Why does Leslie’s answer about chocolate milk get a laugh?',
      choices: ['She answers a hearing with a childhood mix-up', 'She admits she still half believes the cow idea',
                'She gets the story wrong and has to correct herself'], a: 0,
      cue: 'いつの話か、そしてどこで話しているか。',
      line: '…I *flip-flopped* when I found out that there was something called *chocolate syrup*.',
      said: '4歳でチョコ牛乳の作り方を知って「考えを変えた」と、議会の公式な場で話す。',
      mean: '理屈は正しいが、例が幼すぎる。公式の場で幼児の思い違いを証拠に出す落差が笑い。',
      trap: 'flip-flopped を言い直しと取りやすいが、議員の言葉をわざと使い返している。',
      use: 'I changed my mind after seeing the price.（値段を見て気が変わった）' },

    // R fix: V1/K3: "forty" was absurd for a milk-from-cows belief, so common sense gave "four"; now five
    // why: 14 ← -teen and four sound alike at speed; five ← the same f- onset, one short syllable before "I thought"
    { id: 'n1', skill: 'number', level: 'B1', point: 'four', reveals: ['milk'], seg: [52.4, 59.0],
      stem: 'How old was Leslie when she had her chocolate milk idea?',
      choices: ['four', 'five', 'fourteen'], a: 0, keep: true,
      cue: '「When I was」のすぐあと、語の長さ。',
      line: 'When I was *four*, I thought that chocolate milk came from brown cows.',
      said: '「4歳のとき、チョコレート牛乳は茶色い牛から出ると思っていた」。',
      mean: 'four は1音節で短い。fourteen は後ろの teen が強く長い。',
      trap: '数字のあとにすぐ I thought が続くので、語の終わりがつながって長く聞こえやすい。',
      use: 'When I was four, I lived in Osaka.（4歳のとき大阪に住んでいた）' },

    // why: agrees but too far ← the Japanese softening frame; shocked ← "utterly" heard as an intensifier of alarm
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'meaningless', seg: [64.0, 71.15],
      stem: 'When the scandal is compared to other scandals, how does the reply react?',
      choices: ['Dismisses it as making no sense at all', 'Agrees, but thinks it goes a little far',
                'Is shocked at how serious the scandal is'], a: 0,
      cue: '比べた直後の返事、最後の長い形容詞。',
      line: 'That’s *utterly meaningless*.',
      said: '大げさなたとえに、すぐ「まったく意味不明だ」と返す。',
      mean: 'utterly ＝ まったく。たとえそのものを、意味をなさないと切り捨てている。',
      trap: 'utterly を驚きの強調と取ると賛成に聞こえる。後ろの meaningless が評価。',
      use: 'That’s utterly ridiculous.（まったくばかげてる）' },

    // why: the teenager ← "hacked by some bored teenager" from earlier; the head of Parks ← "Parks and Rec" heard as
    //   Leslie's boss
    // R fix: C5: the teenager distractor states d3's key, so reveals `hacked`
    { id: 'd4', skill: 'detail', level: 'B1', point: 'employee', reveals: ['hacked'], seg: [71.1, 75.0],
      stem: 'Who does the councilman say they need to hear from next?',
      choices: ['The employee who sent the tweet', 'The teenager who hacked it',
                'The head of the Parks department'], a: 0,
      cue: '「hear from the」のあと。',
      line: 'we need to hear from the *unnamed employee* behind the tweet.',
      said: '「ツイートの裏にいる、名前の出ていない職員の話を聞くべきだ」と言う。',
      mean: 'unnamed ＝ 名前が出ていない。レスリーが名前を出さなかった本人を呼びたい。',
      trap: 'teenager の話は前の説明。behind the tweet ＝ 投稿した本人。',
      use: 'We need to hear from the manager.（担当者の話を聞かないと）' },

    // anchor: 75.1–77.5 s “Perhaps he or she— Or them.” sets “them” in place of the pronoun; 80.1 s he keeps it as a
    //   subject: “perhaps them can”, where grammar wants “they”
    // retired: with nt1 (one C2 alone is under the tier's 2)
    { id: 'nt2', skill: 'dict', level: 'C2', retired: true, point: 'them', seg: [79.6, 84.0],
      stem: 'Type the words after “Yes,”: “___ finally give us the answers we need.” (3 words)',
      answer: 'perhaps them can',
      cue: '「Yes,」のすぐあと。文法より、聞こえた語を。',
      line: 'Yes, *perhaps them can* finally give us the answers we need.',
      said: '「he or she」に「or them」と足され、「たぶん彼らが答えをくれる」と続ける。',
      mean: '文法なら they can。直前の or them を主語にそのまま使った崩れた形で、そこが笑い。',
      trap: '習った文法で they に直したくなる。書き取りは、言われた語を書く。',
      use: 'Me and him went together.（彼と私で行った）' },
  ]
};
