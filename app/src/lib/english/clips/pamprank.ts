// “Michael Fires Pam - The Office US” (the official The Office channel, BEST OF SEASON 1 - The Office US): Michael
// shows the new guy, Ryan, the office "vibe", then stages a fake firing of Pam for stealing Post-it notes, with Ryan as
// his "accomplice"; when Pam is in tears he reveals it was a joke, and she calls him a jerk.
// Segments from the captions, words from whisper (2026-11-16). Named in the audio: Ryan (46 s), Pam (39.2 s, 85.3 s).
// Michael is never named, so stems name him as the show does. 110–129 s is silent (Pam's reaction is only seen).
// Untested: 18.4–20 s ("Just a second, right?": unclear); 21.7–27.4 s (the TV shows named: world knowledge); 33.2 s
// ("Don't pimp me": odd in both, left out); 35.4–38.8 s (whisper "corporate just said that I don't want to— You got a
// fax", captions differ); 43.1 s ("going to" vs whisper "gonna"); 129.2 s (captions "GIVE THEM AN AXE, PUNK", whisper
// "You've been ex-punk!"); whisper loops "I don't know about that" from 154 s to the end (the captions have it once,
// at 155 s; that one is used).
// EAR CHECK: 152.5 s g2 i2 — "You're a jerk" is assumed Pam's (no name; it answers "We totally got you", and Michael
//   then says "I don't know about that").
// REVIEW 2026-11-16: pass 5, fix 17, drop 1, new 0; ear checks 1
import type { Clip } from '../types.ts';

export const pamprank: Clip = {
  id: 'pamprank', video: 'T3YkqbP-4ao', title: 'Michael Fires Pam - The Office US', dur: 194, wpm: 147,
  band: 'slow', tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // why: did you feel ← same meaning, and "yet" goes with both in American English; found ← f + vowel + final
    //   consonant, with the t lost before "the"; can you ← a common chant-like opener
    { id: 's1', skill: 'sound', level: 'B2', point: 'felt', seg: [0, 3.3],
      stem: 'Fill the gap: “So, uh, ___ the vibe yet?”',
      choices: ['did you feel', 'have you felt', 'can you feel', 'have you found'], a: 1,
      cue: 'uh のあと、弱い短い2語と動詞。',
      line: 'So, uh, *have you felt* the vibe yet?',
      said: '「職場の雰囲気、もう感じた？」と新人に聞く。',
      mean: 'have you は「ハヴュ」と弱い。felt の t は the の前でほぼ消える。',
      trap: 'have が弱いと did に、t が消えると feel に聞こえる。yet なら have＋過去分詞が多い。',
      use: 'Have you tried the new café yet?（新しいカフェ、もう行った？）' },

    // anchor: 3.6–7.2 s every clause has "we" for its subject, and the last one admits the office slacks ("when we
    //   should be working hard"), offered to the new guy as a selling point, with "right?" asking him to agree
    // R fix: blind 55 % ("brags" marked the key). Key reworded; the choices stay three targets of one joke.
    // why: the staff ← "we" heard as "you people" (he is the boss, so the dig seems aimed down); Ryan ← the line is said
    //   to him, so it sounds like a warning
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'playhard', seg: [3.1, 7.9],
      stem: 'In Michael’s “work hard, play hard” line, who is the joke on?',
      choices: ['Michael, who counts slacking as a perk', 'The staff, whom he is teasing for slacking',
                'Ryan, whom he is warning not to slack'], a: 0,
      cue: '主語の we と、最後の right? の意味。',
      line: 'We work hard, we play hard. Sometimes *we play hard when we should be working hard*, right?',
      said: '「よく働き、よく遊ぶ。働くべき時に遊ぶこともある、だろ？」と新人に自慢する。',
      mean: '上司が「仕事中に遊んでる」と自分から認め、それを売りにしている。笑われているのは話している本人。',
      trap: '上司の言葉なので部下への皮肉に聞こえやすい。主語が we なら、話し手も含めた自分たちの話。',
      use: 'We’re not on time, but we’re fun!（時間は守らないけど、楽しいよ！）', retired: true },

    // why: first ← "friend first" comes just before, and a boss naming himself first is the usual script; third ←
    //   "entertainer third" follows, and "third" is the last number heard
    { id: 'n1', skill: 'number', level: 'B1', point: 'friendfirst', seg: [7.9, 18.3], keep: true,
      stem: 'In Michael’s list, where does “boss” come?',
      choices: ['First', 'Second', 'Third'], a: 1,
      cue: 'a boss のすぐあとの語。',
      line: 'I’m a friend first and *a boss second*. Probably… entertainer third.',
      said: '「僕はまず友だち、上司は二の次。三番目はエンターテイナーかな」と言う。',
      mean: '自分は上司らしくない、親しみやすい人だ、という自己紹介。',
      trap: 'first と third も同じ文に出るので、順番を取り違えやすい。boss の直後の語を聞く。',
      use: 'Safety first, speed second.（安全第一、速さは二の次）' },

    // R fix: blind 85 %: the title says he fires Pam, and only the key was about firing (§9.4). All three choices are
    //   firings now, the stem drops "really", and the test is fake vs real and why.
    // why: tough ← the title + "theft and stealing" heard as a real firing to impress Ryan; job cuts ← "downsizing"
    //   said, but it is part of the act
    { id: 'g1', skill: 'gist', level: 'B2', point: 'prank', reveals: ['inonit'], seg: [21.5, 156.0],
      stem: 'What is Michael doing with Pam in this scene?',
      choices: ['Pretending to fire Pam, as a show for Ryan', 'Firing Pam for real, to look tough for Ryan',
                'Firing Pam for real, since jobs must be cut'], a: 0,
      cue: '最初に新人に頼むことと、最後の「冗談だよ」。',
      said: '新人を共犯にして Pam をクビにするふりをし、最後に冗談だと明かす。',
      mean: '新人に職場の「楽しさ」を見せるつもりの、たちの悪いいたずら。',
      trap: 'downsizing や stealing は芝居の中の言葉。最初の頼みごとと最後の種明かしで場面を見る。',
      use: 'Relax, it was just a prank.（落ち着いて、ただのいたずらだよ）' },

    // R fix: blind 60 % ("keep quiet" was weak). Now the newcomer frame: "follow my lead" as 見て学べ.
    // why: walk along ← "go along" and "follow my lead" read literally as walking; watch and learn ← "follow my lead"
    //   heard as the Japanese 見て覚えろ said to a newcomer
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'along', seg: [27.9, 33.0],
      stem: 'What does Michael ask Ryan to do during the prank?',
      choices: ['Play along and take his cues from him', 'Walk along with him over to Pam’s desk',
                'Watch closely and learn how it’s done'], a: 0,
      cue: 'accomplice のあと、Just で始まる2つの文。',
      line: 'Just *go along with it*, okay? All right. Just *follow my lead*.',
      said: '「話を合わせて。僕に合わせればいい」と頼む。',
      mean: 'go along with ＝ 調子を合わせる。follow my lead ＝ 僕のやり方に合わせて。',
      trap: 'along や follow を「ついて歩く」「見て学ぶ」と取りがち。どちらも「合わせる」。',
      use: 'Just go along with it. I’ll explain later.（話を合わせて。あとで説明する）' },

    // R fix: blind 50 % ("a visit from head office" was weak). Now pay cuts, the near miss on "cuts".
    // why: smaller office ← "downsizing" read as moving to a smaller place (size = 大きさ); pay cuts ← downsizing
    //   heard as cutting costs in general
    { id: 'd1', skill: 'detail', level: 'B2', point: 'downsizing', seg: [47.5, 51.3],
      stem: 'What does Michael tell Pam is coming?',
      choices: ['Job cuts at the company', 'A move to a smaller office', 'Pay cuts for the whole staff'], a: 0,
      cue: 'as you know のあとの、長い一語。',
      line: 'as you know, there’s going to be *downsizing*.',
      said: '「知ってのとおり、人員削減がある」と切り出す。',
      mean: 'downsizing ＝ 人員を減らすこと。会社の「規模を小さく」は、人を減らす意味で使う。',
      trap: 'size から移転や給料の話と取りやすい。会社の話なら人の数のこと。',
      use: 'They’re downsizing, so I’m job hunting.（人員削減で、仕事を探してる）' },

    // R drop: f2 — V2: the title (“Michael Fires Pam”) answers "let you go", and p1 shares its segment and line;
    //   never shipped. p1's reveals no longer need `letgo`.

    // R fix: blind 55 % ("before a promotion" was weak once the title says he fires her). Now "let you go first" as
    //   a favour to her.
    // why: a favour ← "let you go first" heard as letting her off, and "easier" as about her life; harder ← easier/harder,
    //   the comparison heard backwards
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'easier', seg: [51.3, 60.6],
      stem: 'What is odd about how Michael opens the bad news?',
      choices: ['He thanks her, then says he’s firing her', 'He fires her as if it were a favor to her',
                'He blames her for making his job harder'], a: 0,
      cue: '最初のほめ言葉と、in that のあとの中身。',
      line: '*you have made my life so much easier* in that I am going to have to let you go',
      said: '「君のおかげで僕はずいぶん楽になった。というのも、君を最初に解雇するから」と言う。',
      mean: 'お礼の形で始めて、中身は解雇。相手の気持ちを考えない、ずれた言い方。',
      trap: '前半だけ聞くとほめ言葉。in that ＝「という点で」のあとに本題が来る。',
      use: 'You made it easy for me to decide.（おかげで決めやすかったよ）' },

    // why: two crimes ← "and" joins two words, so it sounds like two charges; no reason ← "Why? Well…" heard as
    //   stalling with nothing to say
    { id: 'i1', skill: 'infer', level: 'C1', point: 'theft', seg: [62.1, 66.6],
      stem: 'What does Michael’s answer to “Why?” show about his case?',
      choices: ['He has one charge and pads it out', 'He has two charges against her',
                'He has no charge at all to give'], a: 0,
      cue: 'Well のあと、つないだ2語の意味。',
      line: 'Why? Well, *theft and stealing*.',
      said: '「なぜ？それは、窃盗と盗みだ」と答える。',
      mean: 'theft も stealing も同じ「盗み」。同じことを2回言って、理由を重く見せている。',
      trap: 'and でつなぐと2つの罪に聞こえる。並んだ語が同じ意味かどうかを確かめる。',
      use: 'It’s late, and it’s also not early.（遅いし、それに早くもない）' },

    // why: paper clips ← she names them later ("as much as a paper clip"); printer paper ← the usual office supply
    { id: 'd2', skill: 'detail', level: 'B1', point: 'postits', seg: [67.4, 74.5],
      stem: 'What is Pam supposed to have stolen?',
      choices: ['Post-it notes', 'Paper clips', 'Printer paper'], a: 0,
      cue: 'supposed to have stolen への答え。',
      line: 'what am I supposed to have stolen? — *Post-it notes*.',
      said: '「何を盗んだことになってるの？」に「ポストイットだ」と答える。',
      mean: 'be supposed to have done ＝ 〜したことになっている。身に覚えがない時に。',
      trap: 'paper clip もあとで出てくる。盗んだとされる物は質問の直後の答え。',
      use: 'What am I supposed to have done?（私が何をしたっていうの？）' },

    // R fix: S1/N7: the stem named "Post-it notes", d2's key. Reworded.
    // why: 15 cents ← fifty/fifteen, the -ty/-teen trap; $5 ← "fifty" heard as "five"
    { id: 'n2', skill: 'number', level: 'B1', point: '50cents', seg: [73.8, 80.0], keep: true,
      stem: 'What price do they put on each of the stolen items?',
      choices: ['15 cents', '50 cents', '$5'], a: 1,
      cue: 'worth, like のあとの数。',
      line: 'What are those worth, like *50 cents*? — *50 cents*, yeah.',
      said: '「それ、50セントくらいでしょ？」「50セント、そうだ」。',
      mean: '安い物だと確かめ合っている。だから盗んだと言われても大した額ではない。',
      trap: 'fifty と fifteen は聞き分けにくい。fifty は最初、fifteen は teen を強く読む。',
      use: 'It’s only fifty cents.（たった50セントだよ）' },

    // R fix: S1/N7: the stem named "Post-it notes" (d2's key); reworded, and the line still shows it, so it reveals
    //   `postits`.
    // why: a hundred ← "a" + a big number, the -dred/-sand endings blur; ten thousand ← "ten" heard in "steal a"
    { id: 'n3', skill: 'number', level: 'B1', point: 'thousand', reveals: ['postits'], seg: [76.5, 80.0], keep: true,
      stem: 'In Michael’s example, how many does she steal?',
      choices: ['A hundred', 'A thousand', 'Ten thousand'], a: 1,
      cue: 'You steal のあと、数の語。',
      line: 'You steal *a thousand* Post-it notes at… apiece',
      said: '「ポストイットを千個盗めば」と計算を始める。',
      mean: 'a thousand ＝ 千。安い物でも数が多ければ、という理屈の例。',
      trap: 'hundred と thousand は「ハン」と「サウ」で聞き分ける。a と弱く始まるので数を落としやすい。',
      use: 'There were about a thousand people.（千人くらいいたよ）' },

    // R fix: blind 70 % ("truly close to going under" was weak). Now the job cuts (said earlier) as the cause. Its
    //   notes name 50 セント, so it reveals `50cents`, and the choice "notes" reveals `postits`.
    // why: job cuts ← "downsizing" earlier + "run us out of business" taken at face value; more than notes ← "profit
    //   margin" heard as a large sum
    { id: 'i3', skill: 'infer', level: 'C1', point: 'profit', reveals: ['50cents', 'postits'], seg: [76.5, 85.8],
      stem: 'What does Michael’s talk of the business going under show?',
      choices: ['He blows a tiny loss up into a disaster', 'He fears the job cuts will sink the firm',
                'Pam has taken far more than just notes'], a: 0,
      cue: '安い値段の話のあと、話がどこまで大きくなるか。',
      line: 'you’ve made a *profit margin*, you know, going to *run us out of business*, Pam.',
      said: '「利益率を出したことになる。会社がつぶれるよ」と、話を大きくする。',
      mean: '50セントの物で倒産と言うのは大げさ。経済用語も使い方がずれていて、作り話だと分かる。',
      trap: '強い言葉をそのまま信じやすい。小さな数字から大きな結論に飛んだら、大げさを疑う。',
      use: 'One cookie won’t ruin your diet.（クッキー1枚でダイエットは台無しにならない）' },

    // R fix: blind 65 % ("calm, as if she had seen it coming" was weak; "unfair" marked the key). Now "she sees
    //   through it", the near miss a viewer who knows it's a prank would pick.
    // why: guilty ← "I've never even stolen" heard without "never" (the n-word is short); in on the joke ← "All right"
    //   right before, and the viewer knows it's a prank
    { id: 't1', skill: 'attitude', level: 'B2', point: 'serious', seg: [85.9, 97.6],
      stem: 'After “Are you serious?”, how does Pam sound?',
      choices: ['Stunned and hurt by the charge', 'Guilty, since she did take a few',
                'Sure it’s a joke, and playing along'], a: 0,
      cue: 'I mean のあとの、自分のことを言う文。',
      line: 'I can’t believe this. I mean, *I’ve never even stolen* as much as a paper clip…',
      said: '「信じられない。クリップ1つ盗んだこともないのに、クビなんて」と言う。',
      mean: '身に覚えがない上に解雇。驚きと悔しさがまざっている。',
      trap: 'never が弱いと罪を認めたように聞こえる。now you’re firing me まで聞けば、本気に取っている。',
      use: 'I can’t believe this is happening.（こんなことになるなんて）' },

    // R fix: blind 50 % ("even the smallest thing" glossed the idiom in the key). Key plainer; B is "only clips".
    // why: only clips ← "as much as a paper clip" heard as the thing she took; less than he says ← "even" heard
    //   as a comparison of amounts
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'paperclip', seg: [92.6, 97.6],
      stem: 'What does Pam mean by the paper clip remark?',
      choices: ['She has never stolen anything at all', 'She has only ever taken paper clips',
                'She took far less than he says she did'], a: 0,
      cue: 'paper clip の前の形。',
      line: 'I’ve never even stolen *as much as a paper clip*',
      said: '「クリップ1つだって盗んだことがない」と言う。',
      mean: 'not even as much as ～ ＝ 〜すらない。小さな物を例に完全に否定する。',
      trap: 'paper clip だけ聞くと「クリップは盗んだ」と取りやすい。never even とセットで聞く。',
      use: 'He didn’t even say as much as hello.（あいさつすらしなかった）' },

    // R fix: blind 70 % ("honestly sorry" was weak). Now the literal reading: he's glad the company saves money,
    //   which the fake firing rules out.
    // why: softening ← "the best thing about it" heard as a silver lining offered to her (日本語の「せめてもの」); saves
    //   money ← the words taken at face value, forgetting the firing is an act
    { id: 't2', skill: 'attitude', level: 'C1', point: 'bestthing', reveals: ['severance'], seg: [98.4, 104.2],
      stem: 'What does “And the best thing about it is…” show about Michael?',
      choices: ['He’s too into his act to see her pain', 'He is trying to soften the bad news for her',
                'He is pleased the company will save money'], a: 0,
      cue: '「いちばんいいこと」の中身が、誰にとっていいのか。',
      line: '*the best thing about it* is that… we’re not going to have to give you any severance pay.',
      said: '「しかもいちばんいいのは、退職金を払わなくていいことだ」と続ける。',
      mean: '会社に得な話を、泣きそうな相手に「いいこと」として言う。芝居に夢中で、相手が見えていない。',
      trap: '慰めや本当の節約の話に聞こえやすい。これは芝居で、中身は誰の得かを聞く。',
      use: 'The best part? It’s free.（いちばんいいところ？無料なんだ）' },

    // R fix: blind 50 % ("a new desk for Ryan" was weak). Now notice, the other thing owed when someone is let go.
    // why: notice ← the other thing owed on firing; corporate ← "corporate" was mentioned when Pam walked in
    { id: 'd3', skill: 'detail', level: 'B2', point: 'severance', seg: [98.4, 108.4],
      stem: 'What does Michael say they won’t have to do?',
      choices: ['Give her any pay on leaving', 'Give her two weeks’ notice', 'Report it to head office'], a: 0,
      cue: '「〜しなくていい」の中身の名詞。',
      line: 'we’re not going to have to give you any *severance pay*. Because that is gross misconduct',
      said: '「退職金は払わなくていい。重大な不正行為だから」と言う。',
      mean: 'severance pay ＝ 解雇のときに払うお金。盗みなら払わない、という理屈。',
      trap: '解雇なら予告の話かと思いやすい。give you any のあとの名詞を聞く。',
      use: 'Do I get severance pay?（解雇手当は出ますか）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'desk', seg: [108.6, 111.5],
      stem: 'Type what Michael says: “So just ___.” (4 words)', answer: 'clean out your desk',
      cue: 'gross misconduct のあと、So just に続く部分。',
      line: 'So just *clean out your desk*. I’m sorry.',
      said: '「じゃあ、机を片付けて」と告げる。',
      mean: 'clean out ＝ 中身を全部出して空にする。解雇の決まり文句。',
      trap: 'clean out がつながって「クリーナウ」に聞こえ、out を落としやすい。your も弱い。',
      use: 'I need to clean out my closet.（クローゼットを空にしないと）' },

    // R fix: blind 60 % ("thanks Ryan" was weak). Now relief without a word, the usual end of a fake-out.
    // why: laughs ← "Surprise! It's a joke!" heard as the happy ending of the usual prank script; relieved ← the
    //   firing is off, so relief seems natural
    { id: 'g2', skill: 'gist', level: 'B2', point: 'reaction', seg: [129.0, 156.5],
      stem: 'How does Pam take the news that it was all a joke?',
      choices: ['She is upset and lets him know it', 'She laughs once she hears it was fake',
                'She is relieved and lets it go quietly'], a: 0,
      cue: 'We totally got you のあとの一言。',
      line: 'We totally got you. — *You’re a jerk.*',
      said: '「冗談だよ、引っかかったね」と言われ、「最低」と返す。',
      mean: 'jerk ＝ 嫌なやつ。いたずらは楽しい冗談にならず、相手を傷つけた。',
      trap: '冗談の種明かしは笑いで終わる、という型に引かれやすい。最後の一言の中身を聞く。',
      use: 'That wasn’t funny. You’re a jerk.（笑えないよ。最低）' },

    // anchor: 7.9–15 s "a friend first and a boss second" set against 131.8–156 s: "Surprise! It's a joke… a morale
    //   booster thing… We totally got you. — You're a jerk."
    // why: true ← Michael's own frame ("We were joking around", a prank among pals: sincerity kept); can't stay angry
    //   ← "friend first" heard as the bond that will smooth it over (wrong implication)
    // R fix: blind 55 %. "The boss in him can return" became the near miss that friendship is why she'll forgive him.
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'friendfirst', reveals: ['reaction'], seg: [131.3, 156.0],
      stem: 'After the reveal, how should we hear “a friend first and a boss second”?',
      choices: ['As a self-image the prank has just disproved', 'As true: the prank was a joke between friends',
                'As why Pam can’t stay angry at him for long'], a: 0,
      cue: '「冗談だよ」のあと、相手が何と返すか。',
      line: 'Surprise, it’s a joke. … We totally got you. — *You’re a jerk.*',
      said: '「冗談だよ、士気を上げるためさ」と明かすが、Pam は「最低」と返す。',
      mean: '冒頭の「まず友だち」は本人の自己像。友だちならしない仕打ちで、その言葉が場面に打ち消される。',
      trap: '本人の「冗談」という枠で聞きやすい。自分の説明より、相手の反応を答え合わせにする。',
      use: 'He says he’s a good listener. He isn’t.（聞き上手だって言うけど、違う）', retired: true },

    // R fix: stem — token Jaccard 0.8 with x1's stem (duplicate-stem check); it now names Ryan.
    { id: 'x2', skill: 'dict', level: 'B2', point: 'inonit', seg: [135.5, 138.7],
      stem: 'Type how Michael describes Ryan: “He was ___.” (3 words)', answer: 'in on it',
      cue: 'Okay のあと、新人について言う短い文。',
      line: 'Okay, he was *in on it*. He was my accomplice.',
      said: '「彼もグルだったんだ。共犯者さ」と新人を指す。',
      mean: 'be in on it ＝ 計画を知っていて加わっている。3語が「イノニッ」とつながる。',
      trap: 'in on it は3語が1語に聞こえやすい。最後の t はほぼ消える。',
      use: 'Was everyone in on the surprise?（みんなサプライズ知ってたの？）' },

    // R fix: blind 55 % ("office rules to Ryan" was weak). Now "admitting it went too far", the near miss on contrition.
    // why: apologizing ← a boss explaining after upsetting someone, heard as 謝罪 (the Japanese frame); admitting ←
    //   "just kind of" heard as a sheepish climb-down
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'morale', seg: [139.5, 148.4],
      stem: 'What is Michael doing as he explains the prank?',
      choices: ['Playing it down to excuse what he did', 'Apologizing to Pam for hurting her',
                'Admitting the joke went too far'], a: 0,
      cue: 'just や kind of がくり返される言い方。',
      line: 'there was *just kind of* a morale booster thing… *kind of* giving him the feel of the place.',
      said: '「士気を上げるちょっとしたやつで、新人に職場を見せてた」と説明する。',
      mean: 'just, kind of をくり返して、ひどいことを小さく見せている。言い訳であって謝罪はない。',
      trap: '説明は謝罪に聞こえやすい。sorry のない説明は言い訳のことが多い。',
      use: 'It was just kind of a joke.（ほんの冗談みたいなもんだよ）' },

    // why: admits jokingly ← "I don't know" heard as a soft yes (日本語の「どうかな」 as an embarrassed admission);
    //   unsure she means it ← "I don't know" taken literally
    // R fix: blind 60 % ("unsure what the word means" was weak).
    { id: 'i2', skill: 'infer', level: 'C1', point: 'jerk', reveals: ['reaction'], seg: [150.0, 156.6],
      stem: 'What does Michael’s very last line show?',
      choices: ['He doesn’t think he did anything wrong', 'He admits it, but in a joking way',
                'He isn’t sure if she really means it'], a: 0,
      cue: '責められたあとの、短い返事。',
      line: 'You’re a jerk. — *I don’t know about that.*',
      said: '「最低」と言われ、「それはどうかな」と返す。',
      mean: 'I don’t know about that ＝ それには同意しない。やんわりした否定で、悪いと思っていない。',
      trap: '「分からない」と訳すと迷いや照れに聞こえる。言われたことへの返事なら、反対の意味。',
      use: 'Cheap? I don’t know about that.（安い？それはどうかな）' },
  ]
};
