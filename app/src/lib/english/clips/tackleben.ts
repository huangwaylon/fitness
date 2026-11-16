// REVIEW 2026-11-16: pass 7, fix 17, drop 0, new 0; ear checks 3
// Open: h2 — who says "It's mean… I am Ben Wyatt, and I want to destroy Leslie's dreams" (123.6 s, captions "what do
//   you mean")? The key ("mocking his ad") holds whoever says it, so it isn't on the ear-check list.
// “Leslie tackles Ben to the ground | Parks and Recreation” (the official Parks and Recreation channel, Season 4):
// with the station deadline near, Leslie and Ben screen their two campaign ads; hers never says what she's running for,
// his attacks Bobby Newport, the team votes for his, and Leslie says she's "very zen" before the station scene.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈187 s.
// Note: speakers by turns. Leslie names "the two ads that Ben and I made" (16.4 s), so the critic of her ad is Ben;
//   "who's in favor of Ben's ad?" → "Traitors!" → "unanimous. We air my ad" makes "We air my ad" Ben's and "evenly
//   split… keep debating" Leslie's (the only one on the losing side). Stems avoid naming anyone else.
// Untested on purpose: 0–5 s (a celebrity name), 64.9 s (whisper "Do we even want to screen yours?", captions
//   "seniors"), 94.4 s ("cushy" vs "sushi"), 123.6 s ("It's mean" vs "What do you mean"), 179.5–187 s (whisper "I do
//   not approve this message", captions "and I approved this message"; the struggle lines are whisper only).
// EAR CHECK: 139.7 s w1 — "I did not ask you… I want you to win" is Ann's (Leslie has just said "Ann, I painted
//   your garage pink"; no other name is said)
// EAR CHECK: 169.7–179.5 s c1 — the calm talking head is followed by audible trouble at the station ("Oh my God!");
//   the key reads "very zen" as an act
// EAR CHECK: 145.3–149.6 s c3 — "Our friendship is over" and "BFF, I love you forever" sound playful, not hurt
import type { Clip } from '../types.ts';

export const tackleBen: Clip = {
  id: 'tackleben', video: 'vriHgcb96Jg', title: 'Leslie tackles Ben to the ground', dur: 207, wpm: 146,
  band: 'slow', tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // why: which office ← the question taken literally; too high ← "president" heard as a real office he wants
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'channel', seg: [4.6, 10.5],
      stem: 'When someone asks what Bobby is running for, what is the real point?',
      choices: ['His ads seem to be on all the time', 'Nobody can tell which office he wants',
                'He is aiming far too high for a town'], a: 0,
      cue: '「running for」のあと、続く冗談の中身。',
      line: 'What is this guy running for? *President of being on every channel* all the time?',
      said: '「この人、何に立候補してるの？全チャンネルに出ずっぱり大統領？」と言う。',
      mean: '本当の質問ではない。ボビーの広告がどこでも流れていることへの皮肉。',
      trap: 'president を本当の役職と取りやすい。疑問文のあとの冗談に本音が出る。',
      use: 'He’s on every channel these days.（最近どこにでも出てるね）' },

    // R fix: V2, the middle "less than an hour" stood out against "a little over"; all three are now "less than…"
    // why: half an hour ← weak "an" blurred with "half"; an hour and a half ← "an hour" heard, the end of the phrase
    //   guessed
    { id: 'n1', skill: 'number', level: 'B1', point: 'hour', seg: [8.95, 13.1], keep: true,
      stem: 'How long do they have to get the ad to the station?',
      choices: ['Less than half an hour', 'Less than an hour', 'Less than an hour and a half'], a: 1,
      cue: '「Reminder, Leslie」のすぐあと。',
      line: 'we have *less than an hour* to get the ad to the station.',
      said: '「局に広告を届けるまで1時間もない」と念を押す。',
      mean: 'less than an hour ＝ 1時間未満。締め切りが近いという合図。',
      trap: 'an hour は「アナワー」とつながり、half や and a half の有無を聞き落としやすい。',
      use: 'We have less than an hour left.（あと1時間もないよ）' },

    // R fix: V2, "two ads" made the key the only choice that fit a screening; distractors now come from the deadline
    //   line and the later "we can just put it in"
    // why: fix her ad ← the criticism and "we can just put it in" heard as the meeting's job; who takes it ← "get the
    //   ad to the station" heard as the open question
    { id: 'g1', skill: 'gist', level: 'B1', point: 'twoads', seg: [9.0, 82.2],
      stem: 'What is the team trying to decide in this meeting?',
      choices: ['How to fix Leslie’s ad in time', 'Which ad to send to the station',
                'Who should take the ad to the station'], a: 1,
      cue: '最初の数行で、何が「二つ」あるか。',
      line: 'these are *the two ads* that Ben and I made.',
      said: '局に送る広告の締め切りが迫り、レスリーとベンがそれぞれ作った2本を見比べる。',
      mean: 'この場面の目的は、どちらの広告を流すか決めること。',
      trap: '局へ届ける話や直し方の話に引かれやすいが、2本を流して投票で決める流れ。場面の骨組みを追う。',
      use: 'Let’s compare the two and pick one.（2つを比べて1つ選ぼう）' },

    // R fix: V2, "at random" in the stem pointed straight at fairness; the stem now names the moment only
    // why: Ben included ← "Ben and I made" heard as the reason; the hour ← the deadline was just mentioned
    { id: 'd1', skill: 'detail', level: 'B2', point: 'bias', seg: [13.8, 21.2],
      stem: 'What reason does Leslie give before playing the two ads?',
      choices: ['She wants it done within the hour', 'She doesn’t want to sway anyone',
                'She wants Ben to feel included'], a: 1,
      cue: '「So, in order」のあと、目的を言う部分。',
      line: 'So, *in order not to bias anyone*, these are the two ads…',
      said: '「誰にも先入観を与えないよう、1本をランダムに選ぶ」と言う。',
      mean: 'bias ＝ 意見を一方にかたむける。in order not to ～ ＝「～しないように」。',
      trap: 'Ben や締め切りの話も近いが、理由は in order not to のあと。',
      use: 'I don’t want to bias you.（先入観を与えたくない）' },

    // R fix: V2, the quoted “randomly” in the stem and key gave it away; three parallel choices now differ on whose ad
    //   and how she reacts. S4: 25.5 s cut "I'm"; it now ends at 25.8
    // why: Ben's ad ← the Japanese frame of praising the other's work first ("the awesome one" heard as polite);
    //   acts annoyed ← "Oh" heard as a groan before "yay"
    { id: 'h1', skill: 'humor', level: 'C1', point: 'awesome', seg: [16.0, 25.8],
      stem: 'Right after she picks which ad plays first, what is funny?',
      choices: ['Her fair pick lands on Ben’s ad, and she cheers anyway',
                'Her fair pick lands on her ad, and she acts annoyed',
                'Her fair pick lands on her own ad, and she cheers'], a: 2,
      cue: '選んだ直後のひと言と、流れ始める広告の声。',
      line: 'I’m just gonna pick one *randomly*… Oh, yay, *the awesome one*. — Hi, I’m Leslie Knope.',
      said: 'ランダムに選ぶと言った直後に「やった、最高のほう」と喜び、流れるのは自分の広告。',
      mean: '公平なふりをしていたのに、自分の広告を「最高」と呼んで本音が出てしまう。',
      trap: '相手の作品を先にほめる礼儀に聞こえるが、流れるのは本人の広告。誰の物かを確かめる。',
      use: 'Oh, look, my favorite. What a coincidence.（あら、私のお気に入り。偶然ね）' },

    // R fix: V2, "too long" and "hot dogs" were weak; distractors are now her own "a lot of things" and the thing
    //   Ben's ad does
    // why: too many things ← "I'm in favor of a lot of things" heard as the complaint; Bobby ← a negative ad's job,
    //   which Ben's ad does next
    { id: 'd2', skill: 'detail', level: 'B1', point: 'council', seg: [68.7, 77.5],
      stem: 'When Leslie asks for one thing wrong with her ad, what is it?',
      choices: ['It lists far too many things she is for', 'It never says why Bobby is a bad choice',
                'It never says she is running for office'], a: 2,
      cue: '「Name one thing」のあとの答え。',
      line: 'you *never even mentioned you were running for office*.',
      said: '「立候補していると一度も言ってない。市議会という言葉すらない」と指摘される。',
      mean: '選挙広告の一番大事な役目が抜けている、という指摘。',
      trap: '本人も a lot of things と言うので多すぎに思えるが、指摘は never のあと。否定語の後を聞く。',
      use: 'You never even mentioned the price.（値段を一度も言わなかったよ）' },

    // R fix: V2, "stumbling" in the stem gave the key; "station adds it" was weak and is now the did/didn't near sound
    // why: on purpose ← "it's implied" taken as a planned choice; said it ← "I didn't, I didn't" heard as "I did"
    { id: 'i1', skill: 'infer', level: 'C1', point: 'implied', reveals: ['putitin'], seg: [71.1, 82.2],
      stem: 'When her ad is criticized, what does Leslie’s reply suggest?',
      choices: ['She hadn’t noticed the gap until just now', 'She left it out on purpose, to seem modest',
                'She’s sure she said it, and he missed it'], a: 0,
      cue: '答え始めの言いよどみと、最後の提案。',
      line: 'I didn’t, I didn’t, that… *it’s implied*. I didn’t — we can just put it in.',
      said: '「言ってない…言わなくても分かる。…入れればいいだけ」と詰まる。',
      mean: '言いよどみと「言わなくても分かる」の言い訳から、指摘されて初めて気づいたと分かる。',
      trap: 'implied を「わざと」と取りやすいが、すぐ「入れればいい」と直すのは見落としの合図。',
      use: 'Oops, I missed that. I’ll add it.（あ、抜けてた。足しておく）' },

    // R fix: V2, "meeting a deadline" was weak; it's now "listing what she stands for" (what her ad did well)
    // why: on camera ← her ad is her talking to camera, so "bad at that" sounds like delivery; listing ← her ad was
    //   one long list, so "that" is taken as the list
    { id: 'i2', skill: 'infer', level: 'C1', point: 'badat', reveals: ['council'], seg: [74.2, 88.6],
      stem: 'In the comment to the camera, what is Leslie said to be bad at?',
      choices: ['Speaking smoothly in front of a camera', 'Promoting herself as the candidate',
                'Listing what she stands for'], a: 1,
      cue: '「so good at」のあと、that が指すもの。',
      line: 'Leslie is *so good at so many things*, and *so bad at that*.',
      said: 'カメラに向かって「レスリーは多くのことが得意なのに、あれは本当に苦手」と話す。',
      mean: 'that は直前の話題、自分を候補者として売り込むこと。',
      trap: '広告ではすらすら話していたので、話し方の問題ではない。that は直前の話題を指す。',
      use: 'He’s great at many things, but not that.（色々得意だけど、それだけは苦手）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'putitin', seg: [79.3, 82.2],
      stem: 'Type the quick fix: “We can just ___.” (3 words)', answer: 'put it in',
      cue: '「I didn’t」のあと、短い3語がつながる。',
      line: 'I didn’t — we can just *put it in*.',
      said: '「入れればいいだけ」と、すぐに直せると言う。',
      mean: 'put it in ＝ 中に入れる、付け足す。ここでは広告に一言加えること。',
      trap: 't が弾んで「プリリン」のように一続きに聞こえる。3語を一つの音のまとまりで覚える。',
      use: 'Just put it in the email.（メールに入れておいて）' },

    // R fix: V2, "selling candy himself" was weak; it's now "bought his way", the wrong reading of rich + handed
    // why: servants ← silver platter read literally (銀のお盆で給仕); bought ← "silver" and the boat heard as money
    //   doing the work
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'platter', seg: [88.6, 97.0],
      stem: 'What does Ben’s ad say about how Bobby got what he has?',
      choices: ['He was waited on by servants all his life', 'He bought his way into everything he has',
                'He was given it all without working'], a: 2,
      cue: 'Bobby の名前のあと、食器にたとえた言い方。',
      line: 'Bobby Newport’s been *handed everything on a silver platter*.',
      said: '「ボビーは何もかも銀の大皿にのせて手渡されてきた」と始まり、父の会社の楽な仕事が続く。',
      mean: 'on a silver platter ＝ 苦労せずに与えられる。',
      trap: '文字通り「給仕される」と取りやすい。食器のたとえは「楽に手に入る」の意味が多い。',
      use: 'Nothing was handed to me on a platter.（何も楽に手に入ったわけじゃない）' },

    // why: 20 ← twelve/twenty sound alike at speed; 60 ← "60-foot" is the number heard just before
    { id: 'n2', skill: 'number', level: 'B1', point: 'boat', reveals: ['platter'], seg: [96.7, 105.3], keep: true,
      stem: 'How old was Bobby when he got his boat, according to the ad?',
      choices: ['12', '20', '60'], a: 0,
      cue: '「when he was」のあとの数字。',
      line: 'his *60-foot* boat… handed to him *when he was 12*.',
      said: '「60フィートの船も、12歳のときに手渡された」と続く。',
      mean: '60は船の長さ、12は年齢。数字が二つ出るので、何の数字かを分けて聞く。',
      trap: 'twelve と twenty は似て聞こえる。twelve は最後が「ルヴ」、twenty は「ティ」。',
      use: 'I got my first bike at 12.（12歳で初めて自転車をもらった）' },

    // R fix: V2, the stem's "set against" made the opposite of "handed" the key; neutral stem, and "higher office"
    //   (the lost "too") replaces "grew up poor". S4: 111.0 s cut "Bobby"; it now ends at 110.8
    // why: experience ← "running for city council" heard as a record in office; higher office ← "too" lost, so her
    //   race sounds different from his
    { id: 'd3', skill: 'detail', level: 'B2', point: 'earned', reveals: ['platter'], seg: [102.0, 110.8],
      stem: 'What does Ben’s ad say about Leslie?',
      choices: ['She has more years in city government', 'She worked for everything she has',
                'She is running for a higher office'], a: 1,
      cue: '「city council too」のあと、動詞に注目。',
      line: 'Leslie Knope is running for city council too, and *she’s earned everything she’s ever gotten*.',
      said: '「レスリーも市議会に立候補している。手に入れた物はすべて自分の力で得た」。',
      mean: 'handed（与えられた）と earned（自分で得た）の対比が広告の軸。',
      trap: 'too を聞き落とすと別の役職に聞こえる。役職は同じで、違いは得た方。動詞で答える。',
      use: 'She earned that promotion.（あの昇進は実力で勝ち取った）' },

    // why: believe ← "Don't" heard as a general warning about Bobby's ads; stay home ← the get-out-and-vote script
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'dont', seg: [110.5, 117.6],
      stem: 'At the end of Ben’s ad, what does the one-word line ask viewers?',
      choices: ['Not to believe what Bobby’s ads say', 'Not to give Bobby the election',
                'Not to stay home on election day'], a: 1,
      cue: '最後の一語が、直前のどの動詞を受けているか。',
      line: 'Bobby Newport wants you to just *hand him this election*. *Don’t.* — I won’t.',
      said: '「ボビーは選挙をただで渡してほしいのだ。渡すな」と言い、別の声が「渡さない」。',
      mean: 'Don’t は直前の hand him this election を受けた命令。',
      trap: '一語だけだと、ぼんやりした警告に聞こえる。省略された命令は直前の動詞を補う。',
      use: 'They want you to give up. Don’t.（あきらめさせたいんだ。負けるな）' },

    // why: real line ← the "I'm X and I approve this message" format closes Leslie's ad, so it sounds real; better ←
    //   "destroy Leslie's dreams" heard as a joke about winning
    { id: 'h2', skill: 'humor', level: 'C1', point: 'dreams', reveals: ['dont'], seg: [118.5, 131.2],
      stem: 'After Ben’s ad is praised, what is the “I am Ben Wyatt…” line doing?',
      choices: ['Reading out the real last line of his ad', 'Admitting, as a joke, that his ad is better',
                'Mocking his ad with a cruel made-up tagline'], a: 2,
      cue: '広告の締めの決まり文句と比べて。',
      line: '*I am Ben Wyatt, and I want to destroy Leslie’s dreams.*',
      said: 'ほめられたベンの広告に、「私はベン・ワイアット、レスリーの夢を壊したい」と付ける。',
      mean: '広告の最後の名乗りの型をまねて、ひどいセリフを付けたからかい。',
      trap: '実際の広告は「Don’t. — I won’t.」で終わる。名乗りの型はまねると冗談になる。',
      use: 'I’m Tom, and I approve this pizza.（トムです、このピザを承認します）' },

    // why: keep debating ← Leslie's "evenly split" taken as the result; her ad sent ← "We air my ad" heard as Leslie
    { id: 'g2', skill: 'gist', level: 'B2', point: 'vote', reveals: ['split'], seg: [131.5, 168.6],
      stem: 'How does the argument over the two ads end?',
      choices: ['The vote is split, so they keep on debating', 'Leslie wins them over, and her ad is sent',
                'Everyone backs Ben’s ad, and Leslie goes along'], a: 2,
      cue: '投票のあとの返事と、カメラへの最初の一言。',
      line: 'We’re not split. *It’s unanimous. We air my ad.* … I’m going to air a negative ad.',
      said: '投票で全員がベンの広告を選び、レスリーは渋々それを流すと決める。',
      mean: 'この場面の結末は、自分の広告をあきらめてベンの案を受け入れること。',
      trap: 'evenly split はレスリーの言い張りで、結果ではない。結果は相手の返事で確かめる。',
      use: 'Okay, you win. We’ll do it your way.（分かった、君の案でいこう）' },

    // why: Ben ← "Ben's ad" is in the same sentence; Charlie ← the only other name said to someone in the clip
    { id: 'w1', skill: 'who', level: 'B2', point: 'better', reveals: ['garage', 'vote'], seg: [133.0, 145.4],
      stem: 'Who tells Leslie “I want you to win”?',
      choices: ['Ann', 'Ben', 'Charlie'], a: 0,
      cue: '直前にレスリーが名前を呼んだ相手。',
      line: '*Ann*, I painted your garage pink. — I did not ask you to do that. Leslie, look, *I want you to win*…',
      said: 'レスリーがアンの名前を呼んでガレージの話をすると、相手が「頼んでない。勝ってほしいの」と返す。',
      mean: '名前で呼ばれた人がすぐ答える、という順番から話し手が分かる。',
      trap: 'Ben’s ad という語が同じ文にあるので Ben を選びやすいが、ベンは話題の人。',
      use: 'Look, I want you to succeed.（ねえ、うまくいってほしいの）' },

    // R fix: V2, the key was the only choice admitting the loss; "mix the ads" is now a second "I lost" reading
    // why: unsure ← "it seems like… kind of" read as real doubt (the literal hedge); take it in ← "I lost" heard,
    //   but "keep debating" read as asking for time, not for another round
    // anchor: 133.4–136.3 s the vote ("who's in favor of Ben's ad?" → "Traitors!"), then 152.8–156.3 s "It's
    //   unanimous. We air my ad.": she knows she lost and asks for more talk
    { id: 'c2', skill: 'infer', level: 'C2', point: 'split', seg: [133.0, 156.5],
      stem: 'Which plain-English version keeps what Leslie means by “keep debating”?',
      choices: ['“I’m not sure how people voted, so let’s check.”', '“I lost, so give me a moment to take it in.”',
                '“I lost, but if we keep talking, I might not.”'], a: 2,
      cue: '「seems like」のぼかしと、直前の投票結果。',
      line: 'it *seems like* we’re *kind of* evenly split. I think we should *keep debating*.',
      said: '投票で全員が相手の広告を選んだのに、「半々みたいだから、もっと議論しよう」と言う。',
      mean: 'seems like や kind of のぼかしは、迷いではなく負けをごまかすため。時間をかせいで逆転したい。',
      trap: 'ぼかし言葉を本当の迷いと取りやすい。結果が明らかなのにぼかしたら、認めたくない合図。',
      use: 'Let’s not decide yet. Sleep on it?（まだ決めないで、一晩考えよう？）', retired: true },

    // R fix: V2, "Traitors!" in the stem and the key's lone "vote" gave it away; the stem names the moment, and a
    //   second choice now mentions the vote
    // why: apology ← "painted your garage" heard as a confession, and Ann's reply sounds like a complaint; bond
    //   ← the Japanese frame of bringing up a kindness to smooth things over
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'garage', reveals: ['better'], seg: [135.6, 142.3],
      stem: 'When Leslie brings up Ann’s garage, what is she doing?',
      choices: ['Owning up to a favor Ann never wanted', 'Making Ann feel she owes her a vote',
                'Showing the vote won’t hurt their bond'], a: 1,
      cue: '「Traitors!」の流れと、アンの返事。',
      line: 'Traitors! — Ann, *I painted your garage pink*. — *I did not ask you to do that.*',
      said: '「裏切り者！」のあと、アンに「ガレージをピンクに塗ってあげたよね」と言う。',
      mean: '前の親切を持ち出し、恩を返せと迫っている。アンの返事はそれを断るもの。',
      trap: '謝罪や仲直りにも聞こえるが、直前は Traitors!。投票の直後に恩を出すのは見返りの要求。',
      use: 'After all I’ve done for you!（あんなにしてあげたのに！）' },

    // R fix: K1, "Leslie feels betrayed, and Ann rushes to fix it" was defensible from the words; now "Leslie is
    //   joking, but Ann takes it to heart". S4: 149.9 s ran into "you know"; it now ends at 149.7
    // why: takes it to heart ← Ann's quick "No, it's not!" heard as alarm; guilty ← "No, it's not… never over"
    //   heard as Ann backing down on her vote
    // anchor: 145.3–149.6 s "Our friendship is over" gets "It's never over… BFF, I love you forever" within seconds,
    //   while the vote stands ("Ben's ad is just better", 143.4–145.2 s)
    { id: 'c3', skill: 'attitude', level: 'C2', point: 'over', reveals: ['better'], seg: [141.5, 149.7],
      stem: 'What does the “friendship is over” exchange tell us about Leslie and Ann?',
      choices: ['Leslie is joking, but Ann takes it to heart', 'They are close enough to play at a breakup',
                'Ann feels guilty and may change her vote'], a: 1,
      cue: '「over」のあと、数秒で何と言い合うか。',
      line: 'Our *friendship is over*. — No, it’s not… *It’s never over*. BFF, *I love you forever*.',
      said: '「友情は終わり」と言われ、すぐ「終わらない、絶対に。親友、永遠に大好き」と返る。投票は変えない。',
      mean: '絶交の宣言も大げさな愛の言葉も、仲がいいからこその遊び。本気なら、すぐ大好きとは言わない。',
      trap: '「絶交」を真に受けると本当の仲たがいに見える。強い言葉がすぐ大げさに返されたら、じゃれ合い。',
      use: 'You’re dead to me. — Love you too.（もう絶交。— 私も好きだよ）' },

    // R fix: V2, "won't count her vote" was weak; it's now "lost by just one vote" (the hedged "kind of evenly")
    // why: two voters ← "evenly split" heard as a tiny vote; one vote ← "kind of evenly split" heard as a close loss
    { id: 'h3', skill: 'humor', level: 'C1', point: 'split', seg: [149.75, 156.5],
      stem: 'Why is Leslie’s “evenly split” comment funny?',
      choices: ['Only two people voted at all', 'Every vote went to the other ad', 'Her side lost by just one vote'],
      a: 1,
      cue: '返事の「not split」に続く一語。',
      line: 'it seems like we’re kind of *evenly split*. — We’re not split. *It’s unanimous.*',
      said: '「半々みたいだから議論を続けよう」と言い、「割れてない。全員一致だ」と返される。',
      mean: '全員が反対側なのに「半々」と言い張る。負けを認めない言い方がおかしい。',
      trap: 'unanimous ＝ 全員一致。この語を知らないと、二人だけの投票に聞こえやすい。',
      use: 'It’s unanimous. Pizza it is.（全員一致。ピザで決まり）' },

    // R fix: V2, the key was the one mixed feeling; "relieved" is now "let down, and blaming Ben", a near miss
    // why: overrule ← her stammer after "We air my ad" heard as a fight coming; blaming Ben ← "We air my ad" is his,
    //   so her broken "But I —" sounds aimed at him
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'dreamed', reveals: ['vote'], seg: [152.8, 163.6],
      stem: 'How does Leslie feel once the team’s choice is made?',
      choices: ['Angry, and ready to overrule them', 'Let down, but going along with it',
                'Let down, and blaming Ben for it'], a: 1,
      cue: '言いよどんだあと、「dreamed」で終わる一文。',
      line: 'It’s just *not the way I dreamed it would be*.',
      said: '「これは…思い描いていた形とは違う」と、言葉に詰まりながら言う。',
      mean: '反対はせず、がっかりした気持ちだけを言う。決定は受け入れている。',
      trap: '言いよどみを怒りと取りやすいが、反論の言葉は出ない。not the way I dreamed は失望の言い方。',
      use: 'It’s not how I pictured it.（思っていたのと違う）' },

    // R fix: V2, "her own ad later" was weak; it's now a second promise about Ben's ad (the comfort script)
    // why: phone ← "call" read as a phone call, and the station is waiting; like it ← "I promise" heard as the
    //   comforting "you'll see" script
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'call', reveals: ['vote'], seg: [155.0, 163.7],
      stem: 'What does the reply to Leslie’s disappointment promise her?',
      choices: ['That the station will be called right away', 'That airing Ben’s ad is the right choice',
                'That she’ll come to like Ben’s ad too'], a: 1,
      cue: '「okay? I promise」の前の一文。',
      line: 'This is *the right call*, okay? I promise.',
      said: 'がっかりするレスリーに「これが正しい判断だ。約束する」と言う。',
      mean: 'the right call ＝ 正しい判断。審判の判定（call）から来た言い方。',
      trap: 'call を「電話」と取ると局への連絡に聞こえる。call は「判断」の意味でもよく使う。',
      use: 'Leaving early was the right call.（早めに出たのは正解だった）' },

    // R fix: V2, "given what happens at the station" cued the act; the stem is neutral, and "relief" became the
    //   near miss "sarcasm" (not sincere, but in the wrong way)
    // why: real calm ← "out of my hands" and the "I promise" just before: she trusts the call (the sincere reading);
    //   sarcasm ← the station scream read back onto her words as a joke she meant
    // anchor: 156.3–159.4 s "It's just not the way I dreamed it would be"; 169.7–172.8 s "I'm actually feeling very
    //   zen" ("actually": against what you'd expect); 174.2–179.5 s at the station, "I need that DVD" → "Oh my God!"
    { id: 'c1', skill: 'infer', level: 'C2', point: 'zen', reveals: ['outofmy'], seg: [160.0, 180.0],
      stem: 'How should we hear Leslie’s “very zen” to the camera?',
      choices: ['As real calm: she trusts the team now', 'As sarcasm: she means she is furious',
                'As a calm she is acting, not feeling'], a: 2,
      cue: 'カメラへの一言と、そのあと局で聞こえる声。',
      line: 'It’s out of my hands now. … I’m *actually* feeling *very zen* about this. … — I need that DVD. — *Oh my God!*',
      said: '「もう私の手を離れた。実はすごく穏やか」とカメラに話す。直後、局で悲鳴が上がる。',
      mean: 'actually は予想に逆らう語。落ち着いた一言を直後の場面が打ち消す、この形式の定番。',
      trap: '皮肉なら笑わせる言い方になるが、本人は本気のつもり。言葉と直後の行動がずれたら行動を信じる。',
      use: 'I’m totally calm. Totally.（全然平気。ほんとに）' },

    // R fix: V2, "out of my hands" was the only idiom among the four; now three real phrases that differ by sound
    // why: off of my ← flapped "out of" heard as "off of" (a real phrase with the same sense); out of our ← weak
    //   "my" after "of" heard as "our"
    { id: 's1', skill: 'sound', level: 'B2', point: 'outofmy', seg: [164.0, 169.2],
      stem: 'Fill the gap: “It’s ___ hands now.”',
      choices: ['off of my', 'out of my', 'out of our'], a: 1,
      cue: '「now」の前、つながって聞こえる3語。',
      line: 'It’s *out of my* hands now.',
      said: 'カメラに「もう自分の手を離れた」と話す。',
      mean: 'out of の t が弾み「アウラマイ」と一続き。もう自分では決められない、の意味。',
      trap: 'off of も同じ意味なので迷うが、out は「アウ」で始まる。my と our は母音で分ける。',
      use: 'Sorry, it’s out of my hands.（ごめん、もう私には決められない）' }
  ]
};
