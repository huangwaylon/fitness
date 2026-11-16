// REVIEW 2026-11-16: pass 4, fix 17, drop 1, new 0; ear checks 0
// OPEN: n1 (monthly) and n3 (six minutes) were coin flips blind, not guessable; kept. g2's seg (64–128 s) runs through
// Ann's body complaints (sore, butt); nothing is asked about them, but say if you'd rather trim it.
// “Ann gets kicked out of the exclusive club | Parks and Recreation” (the official Parks and Recreation channel,
// Season 6): Ann walks in on the staff's monthly venting club, uses her turn to pour out her pregnancy troubles, and
// soon the members feel she has taken their club over.
// Segments from the captions, words from whisper (2026-11-16). No laugh track (single camera), so humor stems ask what
// makes a line funny, not why an audience laughs. Left out: 46–57 s (whisper “Hello, Walt… choke him”, captions only
// “hello I'm sorry everybody”), 141–168 s (body talk, and whisper/captions split on its last words), and the “Sweet
// Pea” / “I have a feeling” lines (captions “sweepy”, “I'm feeling”). Speakers are named only where the audio names
// them (Ann, Larry, Ron, Donna, Chris); the HR speaker is “the boss”.
// EAR CHECK: none. Every key's words agree in both sources. w1: the offer line differs (whisper "Well, have some
// cheese", captions "oh I have some cheese"), but the key rests on "I can't have cheese, Larry", which both have.
import type { Clip } from '../types.ts';

export const annclub: Clip = {
  id: 'annclub', video: 'YTVezU88sgY', title: 'Ann gets kicked out of the exclusive club', dur: 266, wpm: 190,
  band: 'mid', tags: ['職場', '友だち'],
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: blind 75 % — "settles staff disputes for HR" was close to true (the boss says HR makes him hear disputes once
    // a month, K1), and only the key kept wine and cheese; all three now share "over wine and cheese" (V2/K1/K6)
    // why: "toasts good news" ← the party feel of fine wines, vent missed; "plans staff parties" ← "monthly gathering"
    // heard as an event committee
    { id: 'd1', skill: 'detail', level: 'B1', point: 'club', seg: [17.38, 27.55],
      stem: 'What does the club do, as it’s explained to Ann?',
      choices: ['Vents about their jobs over wine and cheese', 'Toasts good news at work over wine and cheese',
                'Plans staff parties over wine and cheese'], a: 0,
      cue: '「gathering where we all」のあと。',
      line: 'a monthly gathering where we all get together and *vent about what annoys us at work*',
      said: '「月一回集まって、職場の不満をワインとチーズで吐き出す会」と説明している。',
      mean: 'vent ＝ 不満を吐き出す。仕事の愚痴を言い合うための集まり。',
      trap: 'fine wines や gathering だけ拾うとお祝いの会に見えやすい。vent を聞く。',
      use: 'I just need to vent for a minute.（ちょっと愚痴らせて）' },

    // why: twice a month / once a week ← "the fourth time this month" (Kyle's parking) lands nearby
    { id: 'n1', skill: 'number', level: 'B1', point: 'monthly', reveals: ['club'], seg: [17.38, 27.55], keep: true,
      stem: 'How often does the club meet?',
      choices: ['Once a month', 'Twice a month', 'Once a week'], a: 0,
      cue: '「It’s a」のあとの、頻度を表す一語。', line: 'It’s a *monthly* gathering',
      said: '「月に一度の集まり」と言っている。',
      mean: 'monthly ＝ 月一回。このあと上司も「月一回」の決まりの話をする。',
      trap: 'すぐあとに「今月四回目」という別の話が出るので、回数が混ざりやすい。',
      use: 'We have a monthly team lunch.（毎月チームでランチをします）' },

    // R fix: blind 55 % — "enjoys hearing their troubles" was a filler; both distractors now start "he must be there"
    // and differ only in what he'll do (V2/K5)
    // why: "takes it seriously" ← he cites the HR rule, so he must care; "may leave" ← "the rules do not specify whether
    // or not I'm allowed to…" heard without its end
    { id: 'i1', skill: 'infer', level: 'C1', point: 'ron', seg: [27.35, 41.8],
      stem: 'What does the boss’s comment about the HR rules suggest?',
      choices: ['He must be there, but he plans to tune them out',
                'He must be there, and he takes the job seriously',
                'He must be there, but he may leave when he likes'], a: 0,
      cue: '「The rules do not specify」のあと。',
      line: 'The rules do not specify whether or not I’m allowed to *listen to Willie Nelson on my headphones*.',
      said: '人事の決まりで月一回は相談に応じるが、ヘッドホンで音楽を聞くなとは書いていない、と言う。',
      mean: '出席はするが、部下の話は聞かずに音楽を聞く、という遠回しな宣言。',
      trap: '「決まりに書いてない」だけだと途中で帰る話にも取れる。headphones まで聞く。',
      use: 'Technically, the rules don’t say I can’t.（厳密には、ダメとは書いてない）' },

    // why: sixteen / sixty ← -teen/-ty after "six" are easy to blur
    { id: 'n3', skill: 'number', level: 'B1', point: 'pee', seg: [64.45, 72.95], keep: true,
      stem: 'How often does Ann say she has to go to the bathroom?',
      choices: ['Every six minutes', 'Every sixteen minutes', 'Every sixty minutes'], a: 0,
      cue: '「pee every」のすぐあとの数字。', line: 'I have to pee *every six minutes*',
      said: '「6分おきにトイレに行かなきゃいけない」と言っている。',
      mean: 'お腹の中のビーチボールのせい、と続く。大げさな言い方で大変さを伝えている。',
      trap: 'six のあとに -teen や -ty が付くかどうか。minutes の前で音が切れていれば six。',
      use: 'The bus comes every ten minutes.（バスは10分おきに来ます）' },

    // R fix: blind 75 % — the key was the one specific choice; "coworkers" is now her nursing job, named in the clip
    // ("nurse") (V2/K3)
    // why: "nursing job" ← she's called "nurse", and it's a work-venting club; "husband doesn't help" ← Chris comes up
    // later, the usual script
    { id: 'g2', skill: 'gist', level: 'B2', point: 'complaints', seg: [64.45, 128.4],
      stem: 'What are most of Ann’s complaints about?',
      choices: ['The strain her pregnancy puts on her', 'The long hours her nursing job demands',
                'Her husband not helping her enough'], a: 0,
      cue: 'お腹のボール、食べ物、痛みの話をまとめると？',
      said: 'トイレが近い、好きな物が食べられない、体のあちこちが痛い、と次々に話す。',
      mean: 'pregnant とは言わないが、全部妊娠中のつらさの話。',
      trap: '仕事の愚痴の会なので職場の話と思いやすい。夫の話はあとで出るが、内容は逆。',
      use: 'Pregnancy is no joke.（妊娠って本当に大変）' },

    // R fix: blind 85 % — the stem quoted the phrase under test, so it was a grammar question; it now names the moment
    // (S2/§9.2)
    // why: "never hungry" ← one of the two negatives is lost; "not hungry now" ← "not" heard, "never" lost
    { id: 'f5', skill: 'phrase', level: 'B2', point: 'hungry', seg: [72.95, 78.3],
      stem: 'Right after “That sucks… I know”, what does Ann say about her appetite?',
      choices: ['She is hungry all the time', 'She is never hungry these days', 'She isn’t hungry at the moment'], a: 0,
      cue: '否定の語がいくつあるか数えて。', line: 'And I’m *never not hungry*.',
      said: '「それに、お腹がすいてない時がない」と言う。',
      mean: 'never not ＝ 否定が二つで「いつも」。always より強く、うんざりした感じが出る。',
      trap: 'never か not のどちらかを落とすと、逆の意味になる。否定が二つあれば肯定。',
      use: 'He’s never not on his phone.（彼はいつもスマホを見てる）' },

    // why: Ron / Donna ← both are named in the clip; the line itself gives only the name Ann answers to
    { id: 'w1', skill: 'who', level: 'B1', point: 'cheese', seg: [75, 79.66],
      stem: 'Who offers Ann some cheese?',
      choices: ['Larry', 'Ron', 'Donna'], a: 0,
      cue: 'アンが断るとき、最後に付ける名前。', line: 'I can’t have cheese, *Larry*.',
      said: 'チーズを勧められ、「チーズは無理なの、ラリー」と答えている。',
      mean: '文の最後の呼びかけで、勧めた相手が分かる。',
      trap: 'ほかの名前もこの場面に出てくる。断りの文末に付いた名前を聞く。',
      use: 'I can’t have coffee, thanks.（コーヒーは飲めないんです、ありがとう）' },

    // R fix: "don't" was the weakest choice; "won't" is a near sound and a refusal reading (K3)
    // why: can ← the t of can't drops; won't ← a refusal ("I won't have any") with the same nasal end
    { id: 's1', skill: 'sound', level: 'B2', point: 'cheese', seg: [75, 79.66],
      stem: 'Fill the gap: “I ___ have cheese, Larry.”',
      choices: ['can', 'can’t', 'won’t'], a: 1,
      cue: '「I」のすぐあと、母音の長さに注目。', line: 'I *can’t* have cheese, Larry.',
      said: '「チーズは食べられないの、ラリー」と断っている。',
      mean: 'can’t の t はほぼ消えるが、母音が長く強い（キャーン）。can は弱く短い（クン）。',
      trap: 't が聞こえないので can に取りやすい。強く長ければ can’t と考える。',
      use: 'I can’t have dairy.（乳製品はだめなんです）' },

    // R drop: d5 (what she's allowed; deleted, as the bank shows no sign of having shipped). "Liquefied flaxseed" is
    // the only health food among the choices, so common sense picks it (V1/V2). The literal minimum still holds (d1,
    // n1, n3, w1).

    // why: "mixes up game and bakery" ← Pac-Man and cinnamon buns side by side; "gaming at work" ← Pac-Man taken literally
    { id: 'h1', skill: 'humor', level: 'C1', point: 'pacman', seg: [87.64, 101.6],
      stem: 'What makes Ann’s list of what she wants funny?',
      choices: ['Her cravings grow stranger as she goes on', 'She mixes up a video game with a real bakery',
                'She admits she has been playing games at work'], a: 0,
      cue: 'ゴミ袋のあと、願いがどう大きくなるか。',
      line: 'I want to be *Pac-Man*, and instead of dots, I want them to be *cinnamon buns*.',
      said: 'ゴミ袋いっぱいのマッシュポテト、パックマンになってシナモンロールを食べたい、と言う。',
      mean: '食べたい物の話が、どんどん大げさで変な想像になっていくのが笑い。',
      trap: 'パックマンを本当のゲームの話と取りやすい。食べたい気持ちのたとえ。',
      use: 'I could eat a whole pizza right now.（今ならピザ丸ごと食べられる）' },

    // R fix: blind 55 % — "steers the talk back to work" didn't fit; both distractors now start with her first reply
    // and differ in what follows (V2/K5)
    // why: "says she's fine" ← the Japanese 大丈夫 frame; "keeps the details to herself" ← "You don't want to know" read
    // as the end of it
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'asked', seg: [107.9, 117.93],
      stem: 'How does Ann answer when asked how she’s feeling?',
      choices: ['She warns him off, then tells him everything', 'She says she’s fine, then admits a little',
                'She warns him off and keeps the details to herself'], a: 0,
      cue: '最初の答えと、聞き返されたあとの一言。',
      line: 'You don’t want to know. … All right, man. *You asked for it*.',
      said: '「聞かないほうがいい」と言うが、「聞きたい」と返され、「じゃあ覚悟して」と話し出す。',
      mean: 'You asked for it ＝「自分で聞いたんだからね」。このあと全部話す合図。',
      trap: '最初の一言は断りに聞こえるが、前置きの警告。あとの一言で話し出す。',
      use: 'Okay, you asked for it.（いいよ、聞いたのはそっちだからね）' },

    // R fix: blind 50 % — "blames the book's writer" was half true (the book did set her off, K1); it's now a keyword
    // trap on the famous name (V2/K1)
    // why: "mixes up two words" ← the made-up compound sounds like a slip; "a famous actress's advice" ← Brooke Shields
    // heard, "book" lost
    { id: 'h2', skill: 'humor', level: 'C1', point: 'prepost', seg: [122.43, 128.4],
      stem: 'What is funny about what Ann says she has after reading the book?',
      choices: ['She worries about a problem that can only come later',
                'She mixes up two medical words without noticing', 'She says a famous actress gave her the advice'], a: 0,
      cue: '本の題材と、そのあとの長い言葉を比べて。',
      line: 'Now I have *pre-postpartum depression anxiety*.',
      said: '産後うつの本を読んで、今度は「産前の産後うつ不安」になった、と言う。',
      mean: 'まだ産んでいないのに、産後の心配をしている。言葉を重ねた造語が笑い。',
      trap: 'うっかり出た言葉に聞こえるが、わざと pre を足した造語。本の内容を先取りしている。',
      use: 'Now I’m worried about being worried.（今度は心配するのが心配）' },

    // R fix: blind 75 % — "told Leslie" was a filler; it's now "tells them how to fix their problems", the advice
    // script the clip turns around (V2/K3). Reveals `club` too: the key says the club is for venting
    // why: "scolds them for drinking" ← her first line about drinking at work; "fixing their problems" ← a nurse's job,
    // and "I need to vent" read as wanting a talk
    { id: 'g1', skill: 'gist', level: 'B2', point: 'takeover', reveals: ['sushi', 'club'], seg: [168.3, 245.5],
      stem: 'Why do the club members end up annoyed with Ann?',
      choices: ['She has turned their venting time into her own', 'She keeps telling them how to fix their problems',
                'She keeps scolding them for drinking at work'], a: 0,
      cue: '「At first this was funny」から始まる不満。',
      said: 'アンが自分の愚痴のために会を何度も開き、メンバーは「乗っ取られた」と不満を言う。',
      mean: '仕事の愚痴の会が、アンの妊娠の愚痴の会になってしまった。',
      trap: '最初に「職場で飲んでる」と言ったので注意する話に見えやすいが、そのあと自分も加わる。',
      use: 'Sorry, I didn’t mean to hijack the meeting.（ごめん、会議を乗っ取るつもりはなかった）' },

    // R fix: blind 60 % — "keep her secrets" was a filler; all three now start "to listen" and differ in what comes
    // after (V2/K5)
    // why: "tell her what to do" ← "I have a lot of complaints" read as a request for help; "share their own" ← the
    // club's turn-taking, seen earlier
    { id: 'p3', skill: 'pragma', level: 'B2', point: 'respond', seg: [174.76, 183.7],
      stem: 'When Ann calls the emergency meeting, what does she want from the others?',
      choices: ['To listen and not say anything back', 'To listen and then tell her what to do',
                'To listen and then share their own troubles'], a: 0,
      cue: '「Sit down」のあと、最後の命令の部分。',
      line: 'I need to *vent*. And do not, under any circumstances, *respond* to anything I say.',
      said: '「吐き出したいの。何を言っても、絶対に返事しないで」と言っている。',
      mean: '解決策はいらない。ただ聞いてほしい、という頼み。',
      trap: '愚痴を言う＝相談と考えると「助言」に引かれる。respond するなと言っている。',
      use: 'No advice, please. I just need to vent.（アドバイスはいらない、聞いてほしいだけ）' },

    // R fix: blind 75 % — the title ("kicked out") pointed at the key alone; "staff only" now fits the title too, and
    // "cheer Ann up" builds on her cravings (V2/§9.4)
    // why: "staff only" ← the title, and "our chance to vent about work"; "fancier" ← a club upgrading its treats
    { id: 'i3', skill: 'infer', level: 'C1', point: 'sushi', reveals: ['takeover', 'cheese'], seg: [192.4, 206.8],
      stem: 'Why do the members start their “Sushi and cigar club”?',
      choices: ['To pick things Ann can’t be around, so she stays away',
                'To make it a staff-only club that Ann can’t join', 'To try something fancier than wine and cheese'], a: 0,
      cue: 'アンが「Donna」と怒る理由と、そのあとの不満。',
      line: 'You know I *can’t be around smoke or fatty tuna*. … It’s *sushi and cigar club* now.',
      said: 'アンは煙もトロもだめ。メンバーは「乗っ取られた」と言い、「今はすしと葉巻の会」と返す。',
      mean: 'アンが近づけない物をわざと選んで、会を取り戻そうとしている。',
      trap: 'sushi と cigar だけだと豪華になった話、タイトルからは会員制の話に見える。',
      use: 'I can’t be around smoke.（煙のそばにはいられないの）' },

    // R fix: blind 85 % — the stem quoted the phrase under test; it now names the moment, and "never the club's idea"
    // (off the question) is now "too hard to hide" (S2/K5)
    // why: "boring" ← funny → its opposite; "too hard to hide" ← out of hand read as slipping out of their hands
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'outofhand', seg: [197.5, 206.8],
      stem: 'Right after “At first, this was funny, but…”, what does the member say?',
      choices: ['It has gone much too far', 'It has gotten boring', 'It has become too hard to hide'], a: 0,
      cue: '「At first this was funny, but」のあとの言葉。',
      line: 'At first, this was funny, but *it’s gotten out of hand*.',
      said: '「最初は面白かったけど、もう手に負えない」と言っている。',
      mean: 'out of hand ＝ 度を超えて収まらない。but の前の funny と対になる。',
      trap: 'hand を「手」と取り、手から離れる＝隠せない、と読みやすい。but のあとは前と逆の評価。',
      use: 'The party got a little out of hand.（パーティーがちょっと羽目を外しすぎた）' },

    // R fix: blind 65 % — "and you taken it over" isn't grammatical (§9.5), and "we've" fit the club's view; it's now
    // you've / you'd / she's (K5/V2). Reveals `club`: the stem says what the club was for
    // why: "you'd" ← a v and a d both shrink to a short stop; "she's" ← the line heard as said about Ann, not to her
    { id: 's2', skill: 'sound', level: 'B2', point: 'takeover', reveals: ['club'], seg: [197.5, 206.8],
      stem: 'Fill the gap: “…our chance to vent about work, and ___ taken it over.”',
      choices: ['you’ve', 'you’d', 'she’s'], a: 0,
      cue: '「and」のあと、「taken」の前の短い音。', line: 'and *you’ve* taken it over',
      said: '「仕事の愚痴を言う場だったのに、あなたが乗っ取った」と言う。',
      mean: 'you’ve の v はとても弱く、ほぼ「ユ」に聞こえる。',
      trap: 'v が弱く聞き取りにくい。you’d なら had の過去完了、she’s なら第三者の話になる。',
      use: 'You’ve done this before, right?（前にやったことあるよね？）' },

    // R fix: blind 60 % — "glad she understands the rules" didn't fit; it's now "fine with it", the literal I see (V2/K3)
    // why: "fine with it" ← I see = 分かった, read literally; "amused" ← "Wow" read as delight
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'seehow', seg: [204.1, 211.1],
      stem: 'When Ann hears the club’s new name, how does she feel?',
      choices: ['Hurt that they are shutting her out', 'Fine with it, since she sees their point',
                'Amused by their idea for a new club'], a: 0,
      cue: '「Wow. Okay.」に続く短い一文。', line: 'Wow. Okay. *I see how it is*.',
      said: '「へえ。そう。そういうことね」と返している。',
      mean: 'I see how it is ＝「そういうつもりなのね」。のけ者にされて傷ついた、すねた言い方。',
      trap: 'I see を「分かった」と取ると、納得したように聞こえる。how it is が付くと不満。',
      use: 'Oh, I see how it is.（へえ、そういうことね）' },

    // R fix: the seg ended on the onset of the next speaker's "I feel bad" (211.4 s); it now ends at 211.1 (S4). a2 too
    { id: 'x1', skill: 'dict', level: 'B1', point: 'seehow', seg: [206.8, 211.1],
      stem: 'Type what Ann says: “Wow. Okay. ___.” (5 words)', answer: 'i see how it is',
      cue: '「Okay」のあと、短くつながる五語。', line: 'Wow. Okay. *I see how it is*.',
      said: '「そういうことね」とつぶやいている。',
      mean: 'how it is がつながって「ハウィティズ」のように聞こえる。is は「ズ」だけに近い。',
      trap: 'how と it がつながり、it の t も弱い。語の切れ目は意味から考える。',
      use: 'That’s just how it is.（そういうものだよ）' },

    // R fix: blind 55 % — "put the cigar out" was a filler; it's now "a little sorry, but sure it was needed" (V2/K3)
    // why: "a little sorry" ← the polite script after "I feel bad"; "just as sorry" ← a guilty reading of the reply
    { id: 'a3', skill: 'attitude', level: 'B1', point: 'amazing', seg: [210.9, 217.36],
      stem: 'After one member says “I feel bad,” how does the next speaker feel?',
      choices: ['Not sorry at all, and enjoying it', 'A little sorry, but sure it was needed',
                'Just as sorry, and ready to stop'], a: 0,
      cue: '「I don’t」のあと、最後の一言。', line: '*I don’t*. This is a Cuban. This is yellowtail. *I feel amazing*.',
      said: '「私は平気。キューバの葉巻とハマチよ。最高の気分」と言う。',
      mean: 'I don’t（悪いと思ってない）と言い切り、楽しんでいる。',
      trap: '前の人に合わせて謝るのが日本の会話の流れだが、ここは真逆の返事。',
      use: 'I don’t feel bad at all.（全然悪いと思ってない）' },

    // R fix: blind 65 % — "complains more" was a filler; it's now "too busy", a common spouse complaint (V2/K3)
    // why: "never listens" ← the usual husband complaint; "too busy" ← the other usual one
    { id: 'i4', skill: 'infer', level: 'B2', point: 'chris', seg: [217.37, 229.66],
      stem: 'What is Ann’s biggest complaint about Chris?',
      choices: ['His kindness leaves her no one to vent to', 'He never really listens when she complains',
                'He is too busy at work to hear her out'], a: 0,
      cue: '「can’t take them home because」のあと。',
      line: 'Chris is the *most considerate person* in the world, and he just *wants to help me*',
      said: '夫は優しすぎて助けようとするので、愚痴を家に持ち帰れない、と言う。',
      mean: '優しさがかえって負担になっている。だから職場で吐き出したかった。',
      trap: '夫への不満と聞くと「話を聞かない」を予想しやすいが、中身は逆。because のあとを聞く。',
      use: 'He’s almost too nice.（彼、ちょっと優しすぎるくらい）' },

    // R fix: blind 70 % — the stem quoted the marker under test; it now names the moment. "New topic" is now "softens",
    // the Japanese あのね reading (S2/V2)
    // why: "asks if they know" ← you know what? taken as a real question; "softens" ← read as a polite lead-in
    { id: 'm1', skill: 'marker', level: 'B2', point: 'youknow', seg: [229.66, 238.42],
      stem: 'Right before “I guess I was wrong,” what does Ann’s short question do?',
      choices: ['It sets up a blunt, strong remark', 'It asks whether they know what she means',
                'It softens what she is about to say'], a: 0,
      cue: '「but」のすぐあと、答えを待たずに続く部分。',
      line: 'but *you know what*? I guess I was wrong.',
      said: '「でもね、私が間違ってたみたい」と言い放っている。',
      mean: 'you know what? は答えを求めない。強い一言の前の「あのね」。',
      trap: '疑問の形なので本当に聞いていると思いやすい。間を置かずに強い一言が続けば前置き。',
      use: 'You know what? Let’s just go.（もういいや、行こう）' },
  ]
};
