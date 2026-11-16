// REVIEW 2026-11-16: pass 5, fix 14, drop 1, new 1; ear checks 2
// REVIEW open: d2 and t2 still lean on show/title knowledge (Michael runs an office; "Wants to be Captain"), blind
//   ≈ 45–50 % after the fix. If they still read as guessable, d2 is the one to drop (literal would need a new item)
// “Michael Wants to be Captain - The Office US” (the official The Office channel, BEST OF SEASON 2 - The Office US): on
// the office booze cruise Michael hands out TV-show roles and calls himself "captain of this party", the boat's Captain
// Jack claims the ship and everyone on it, Michael tells the camera rank on a boat is "nebulous", keeps cutting into
// the safety talk, and is finally asked to sit back and let the crew do its job.
// Segments from the captions, words from whisper (2026-11-16). Named in the audio: Pam (4.1 s), Angela (10 s), Dwight
// (20.6 s), Michael Scott (28.2 s, 69 s), Captain Jack (31.3 s, 65 s), "Michael"/"Mike" (112.4 s, 118.9 s).
// Who says "Actually, I'm the Skipper" (23.4 s) and "I'd rather die" (26.2 s) isn't settled by a name, so m1, t1 and
// x1 never say who, and no key rests on it. "Don't worry… life preservers" (78 s) isn't named either; p1 says
// "someone".
// Untested on purpose: 0–4 s (the theme song, whisper only); 4–20 s (the Gilligan's Island cast: TV knowledge; 13–18 s
// "the native… neighboring… Globetrotters" is a joke on race); 48–60 s ("King of the World" and cheering: a film
// reference); 78–82 s (captions "you are not going to be needing", whisper "we're… tonight. Well, we might be");
// 96–100 s and 104–108 s (voices overlap; captions "body captain", whisper "party captain"; f3's "dancing shoes" at
// 100.8–103.5 s agrees in both); 109.7 s ("If the boat's rocking…":
// innuendo); 125–146 s (no speech). Small split no key rests on: 119.8 s captions "once you let me in my crew",
// whisper "Why don't you let me and my crew"; only the agreed "…my crew do our job. You just sit back…" is used.
// EAR CHECK: 26.2 s x1 — "I'd rather" (both sources): the 'd is nearly silent, so it can sound like "I rather"
// EAR CHECK: 82.2 s s1 — "let me" (both sources): said as one syllable, ≈ "lemme"
import type { Clip } from '../types.ts';

export const captainjack: Clip = {
  id: 'captainjack', video: 'qUXa9vJOPaE', title: 'Michael Wants to be Captain - The Office US', dur: 146, wpm: 148,
  band: 'slow', tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 55 %, right). "Shows surprise" was weak; the second distractor is now an "agree and add"
    //   reading, the other common use of actually
    // why: agrees and adds ← actually = 実際に, a fact added in support; new topic ← "Actually," as a turn to something
    //   else (話は変わるけど)
    { id: 'm1', skill: 'marker', level: 'B2', point: 'actually', seg: [18.3, 26.1],
      stem: 'After “…you will be Gilligan. Cool.”, what does the next line’s first word do?',
      choices: ['It corrects what was just said', 'It agrees and adds a little more', 'It moves on to a new topic'],
      a: 0,
      cue: '「Cool」のあと、文頭の一語と、そのあとの主張。',
      line: 'I am the Skipper… — Cool. — *Actually*, I’m the Skipper.',
      said: '「僕が船長役」と言ったあと、別の声が「いや、船長は私だ」と言う。',
      mean: '文頭の actually ＝「いや、実は」。相手の言ったことを、やんわり直す合図。',
      trap: 'actually を「実際に」と取ると補足に聞こえる。直後に逆のことを言えば訂正。',
      use: 'Actually, I ordered the fish.（あの、私が頼んだのは魚です）' },

    // R fix: V2 (blind 55 %, right), K3: "a real threat" was near absurd. Now "a real fear", the literal "die"
    // why: polite ← "I'd rather…" heard as the polite "I'd rather not" frame; real fear ← "die" taken literally
    { id: 't1', skill: 'attitude', level: 'B2', point: 'rather', seg: [24.3, 27.8],
      stem: 'How does the reply to “you could be Gilligan” come across?',
      choices: ['A flat no, put in an over-the-top way', 'A polite no, put in a soft way', 'A real fear, put in plain words'],
      a: 0,
      cue: '役をすすめられた直後の、短い返事。',
      line: '…you could be Gilligan. — *I’d rather die*.',
      said: '「君でもいい」と言われ、「死んだほうがまし」と返す。',
      mean: 'I’d rather die ＝ 絶対にいや。大げさに言ってきっぱり断る形。',
      trap: 'die を文字どおりなら恐れ、I’d rather だけなら丁寧な断り。全体で強い no。',
      use: 'Karaoke? I’d rather die.（カラオケ？絶対いや）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'rather', seg: [25.0, 27.8],
      stem: 'Type the reply: “___ die.” (2 words)', answer: "i'd rather",
      cue: '「Gilligan」のあと、短い返事の最初の2語。',
      line: '*I’d rather* die.',
      said: '「死んだほうがまし」と、役をきっぱり断る。',
      mean: 'I’d の d はほとんど聞こえず、rather にそのままつながる。',
      trap: 'd が消えて I rather と書きやすいが、英語では I’d rather の形。弱い d を形で補う。',
      use: 'I’d rather stay in tonight.（今夜は家にいたいな）' },

    // R new: d5, replaces d3. Both sources agree: "I am the captain of this party" (29.0–30.4 s)
    // why: ship ← the title "wants to be captain" and Captain Jack's "captain of the ship" right after; Dunder
    //   Mifflin ← his "Regional Manager of Dunder Mifflin" title later
    { id: 'd5', skill: 'detail', level: 'B1', point: 'partycap', seg: [25.9, 30.9],
      stem: 'When Michael first introduces himself, what does he call himself captain of?',
      choices: ['This party', 'This ship', 'Dunder Mifflin'], a: 0,
      cue: '名前を言ったすぐあと、of のあと。',
      line: 'Hi, I am Michael Scott. I am the *captain of this party*.',
      said: '船長に「やあ、マイケル・スコットです。このパーティーの船長です」と名乗る。',
      mean: '本物の船長の前で、自分も captain を名乗る。仕切り役だと言いたい。',
      trap: 'ship はこのあと船長が言う語。Michael が付けたのは party で、船ではない。',
      use: 'I’m in charge of tonight’s party.（今夜のパーティーの仕切り役です）' },

    // R fix: V2, §9.4 (blind 75 %, right): the title ("Wants to be Captain") gave the "who's in charge" key. Asked
    //   from what Michael keeps doing; the title now feeds a distractor (steering the boat)
    // why: steer ← the title's "captain" taken literally, as wanting to run the boat itself; staff ← "your company
    //   employees" at the end heard as a complaint about his people
    { id: 'g1', skill: 'gist', level: 'B2', point: 'scene', reveals: ['partycap', 'shipcap', 'sitback'], seg: [26.0, 125.0],
      stem: 'Through the clip, what does Michael keep doing?',
      choices: ['Matching the captain’s titles with his own', 'Asking the captain if he can steer the boat',
                'Trying to keep his own staff in line'], a: 0,
      cue: '二人の名乗り方と、最後に船長が頼むこと。',
      said: 'Michael は「パーティーの船長」、船長は「乗った人みんなの船長」と名乗り、最後は船長が引くよう頼む。',
      mean: '誰がこの場を仕切るかの張り合いが、場面全体を通っている。',
      trap: 'タイトルの captain は操船ではない。最後の社員の話も本人への注意。',
      use: 'Too many cooks in the kitchen.（船頭多くして船山に上る）' },

    // R fix: V2 (blind 70 %, right). "Stay off the ship" was weak; now two readings that leave Michael in charge of
    //   his party
    // why: own business ← "captain of the ship" heard as the ship only, leaving the party to Michael; run it for him
    //   ← Michael's "captain of this party" taken as agreed
    { id: 'i2', skill: 'infer', level: 'C1', point: 'shipcap', reveals: ['partycap'], seg: [26.9, 35.9],
      stem: 'What does Captain Jack’s add-on about who he commands mean for Michael?',
      choices: ['Michael has to follow his orders too', 'Michael’s party is his own business',
                'Michael may run the party for him'], a: 0,
      cue: '「captain of the ship」のあとに足す一言。',
      line: 'I am the captain of this party. — … I’m also *captain of anyone who sets foot on the ship*.',
      said: '「僕はパーティーの船長」に「私は船の船長。乗った人全員の船長でもある」と返す。',
      mean: '乗っている Michael も自分の下だ、と遠回しに言う。',
      trap: 'ship だけだと船に限って聞こえる。anyone には Michael も入る。',
      use: 'In my kitchen, I’m the boss.（うちの台所では私がボス）' },

    // anchor: 37.4–46.5 s to camera: "when you are ranking people, manager is higher than captain. On a boat, who
    //   knows?"; he is weighing his rank against the captain's, so his "captain of this party" (29.2 s) is a bid
    // why: joke ← "party" sounds playful, like a host's line; TV game ← a moment before he was handing out TV roles
    //   ("I am the Skipper")
    // retired: for the draws: g1 reveals its point (partycap), so play 3+ under g1 drew no C2 while it was unseen;
    //   nt2 with it (one C2 alone is under 2)
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'partycap', reveals: ['office', 'nebulous'], seg: [26.9, 47.6],
      retired: true,
      stem: 'After Michael’s comment to the camera, how should we hear “captain of this party”?',
      choices: ['As a bid to rank with the real captain', 'As a joke he doesn’t mean at all',
                'As one more role in his TV game'], a: 0,
      cue: '名乗りの場面と、カメラへの一言を比べて。',
      line: 'I am the *captain of this party*. … In an office… *manager is higher than captain*. On a boat, who knows?',
      said: '船長に「パーティーの船長」と名乗り、カメラには「会社ならマネージャーが上。船では、さあ」と話す。',
      mean: 'カメラへの一言が場面を書きかえる。彼はどちらが上かを気にしていて、名乗りは船長への張り合い。',
      trap: 'パーティーは遊びに聞こえるが、本人は順位の話をしている。カメラへの本音で場面を読み直す。',
      use: 'Who’s in charge here, me or you?（ここ仕切ってるのは、私？あなた？）' },

    // R fix: V2 (blind 60 %, right). The key was the only "ship and…" with a twist; all three are "the ship and X"
    // why: party ← "party" from Michael's line just before; crew ← a captain usually commands his crew
    { id: 'd1', skill: 'detail', level: 'B1', point: 'shipcap', seg: [30.4, 35.9],
      stem: 'What does Captain Jack say he is captain of?',
      choices: ['The ship and anyone who boards it', 'The ship and the party on board', 'The ship and its crew'],
      a: 0,
      cue: '名前を言ったあと、2回続く「captain of」。',
      line: 'I’m captain of the ship. I’m also *captain of anyone who sets foot on the ship*.',
      said: '「私は船の船長。船に足を踏み入れた人みんなの船長でもある」。',
      mean: 'set foot on ＝ 足を踏み入れる。乗っている人全員が自分の指示に従う、という意味。',
      trap: 'party は直前の Michael の語。足したのは乗員でなく、乗った人全員。',
      use: 'Don’t set foot in my room!（私の部屋に入らないで！）' },

    // R fix: V2 (blind 60 %, right). "At a party" was weak; "on dry land" is the contrast "on a boat" invites. Still
    //   borderline for a viewer who knows Michael runs an office (see REVIEW open)
    // why: on a boat ← "on a boat" is said, but with "who knows"; dry land ← heard as the opposite of "on a boat"
    { id: 'd2', skill: 'detail', level: 'B1', point: 'office', reveals: ['nebulous'], seg: [37.0, 43.4],
      stem: 'Where does Michael say a manager ranks higher than a captain?',
      choices: ['In an office', 'On a boat', 'On dry land'], a: 0,
      cue: 'カメラに話す最初の部分、場所を言う語。',
      line: '*In an office*, when you are ranking people, manager is higher than captain.',
      said: '「会社で人を順位づけするなら、マネージャーが船長より上」と話す。',
      mean: '自分が上だと言える場面を、わざわざ限って言っている。',
      trap: 'on a boat の反対で「陸」と思いやすいが、言うのは office。場所と言い切りをセットで聞く。',
      use: 'At work, she’s my boss.（職場では彼女が上司）' },

    // R fix: V2 (blind 60 %), S1: "admit" hinted at a concession, and the key was the only hedged choice. Stem says
    //   "say"; both distractors are hedged too
    // why: suspects lower ← "who knows" read as giving in; fairly sure ← "manager is higher than captain" carried
    //   over to the boat
    { id: 'i1', skill: 'infer', level: 'B2', point: 'nebulous', reveals: ['office'], seg: [37.0, 47.6],
      stem: 'In his comment to the camera, what does Michael say about the boat?',
      choices: ['He can’t say who outranks whom there', 'He suspects the captain outranks him there',
                'He’s fairly sure he outranks all of them there'], a: 0,
      cue: '会社の話のあと、「On a boat」に続く部分。',
      line: 'manager is higher than captain. On a boat, *who knows*? It’s nebulous.',
      said: '「会社ならマネージャーが上。船の上では、さあね。はっきりしない」と話す。',
      mean: '会社では自分が上だが、船では自信がない、と認めている。',
      trap: 'who knows は負けを認める言葉ではなく「分からない」。会社の話をそのまま船に当てはめてもいない。',
      use: 'Will it rain? Who knows.（雨降るかな？さあね）' },

    // why: unfair ← he seems to resent being outranked; unimportant ← "who knows" heard as "who cares"
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'nebulous', seg: [43.2, 47.6],
      stem: 'What does Michael mean by the last word of his comment?',
      choices: ['That it’s unclear', 'That it’s unfair', 'That it’s unimportant'], a: 0,
      cue: '「who knows」のあと、最後の一語。',
      line: 'On a boat, who knows? *It’s nebulous*.',
      said: '「船の上では、さあね。あいまいだ」と話す。',
      mean: 'nebulous ＝ ぼんやりして、はっきりしない。少し硬い語で、わざと難しく言っている。',
      trap: 'who knows を「どうでもいい」と取ると unimportant に引かれる。ここは「分からない」。',
      use: 'The plan is still a bit nebulous.（計画はまだぼんやりしてる）' },

    // R fix: V2 (blind 70 %, right). "Thank the captain" was weak; now "introducing the captain", the host's script.
    //   The title still tilts toward the key (see REVIEW open)
    // why: introducing ← a host's line after "welcome aboard"; mocking ← it echoes the captain's "I am your captain"
    //   word for word
    { id: 't2', skill: 'attitude', level: 'C1', point: 'regional', seg: [61.9, 70.1],
      stem: 'Why does Michael add his own title right after the captain’s welcome?',
      choices: ['To put his rank next to the captain’s', 'To introduce the captain to his staff',
                'To make fun of the captain’s big title'], a: 0,
      cue: '船長のあいさつと、同じ形で続く名乗り。',
      line: 'I am your captain, Captain Jack. — And *I am the Regional Manager* of Dunder Mifflin, Michael Scott.',
      said: '船長が「私が船長のジャック」と言うと、すぐ「そして私が支店長のマイケル・スコット」と続ける。',
      mean: '船長と同じ形で肩書きを並べ、自分も仕切る側だと見せたい。',
      trap: '同じ形なのでからかいに聞こえるが、本人は本気。船長はもう自分で名乗っている。',
      use: 'And I’m the one who booked this.（で、予約したのは私ね）' },

    // R drop: d3 (V1: "under the seats" is the airline-style default, so common sense answers it; never shipped, so
    //   deleted). Replaced by d5 to keep literal ≥ 4
    // R fix: V2 (blind 60 %, right). The "agrees" distractor now also skips the talk, which "Well, okay" suggests;
    //   all three are about what happens to the talk
    // why: agrees ← "Okay" and "Well" heard as accepting the point; thanks ← "thank you" is said a moment later
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'finish', seg: [77.5, 85.2],
      stem: 'After someone says no one will need life preservers, what does the next line do?',
      choices: ['Asks to be allowed to keep going', 'Agrees and moves on to the next point',
                'Thanks him for calming the guests'], a: 0,
      cue: '口をはさまれた直後の、短い頼み。',
      line: '*Please let me finish*.',
      said: '救命具の説明の途中で「心配ない、使わないよ」と口をはさまれ、「最後まで言わせて」と返す。',
      mean: '話をさえぎられたときの、ていねいだがはっきりした抗議。',
      trap: 'そのあとの Okay や thank you は同意やお礼に聞こえるが、話を戻すためのつなぎ。',
      use: 'Sorry, can I just finish?（すみません、最後まで言ってもいい？）' },

    // why: let him ← h drops in fast speech, so "let him" ≈ "lettim", near "lemme"; let us ← the vowel after t heard,
    //   the m missed ("lettus")
    // R fix: V2 (blind 60 %, right). "let's" was the odd one out in grammar; "let us" is a real option and sounds
    //   close ("lettus" vs "lemme")
    { id: 's1', skill: 'sound', level: 'B2', point: 'finish', seg: [81.4, 85.0],
      stem: 'Fill the gap: “Please ___ finish.”',
      choices: ['let me', 'let him', 'let us'], a: 0,
      cue: 'Please のあと、一つにつながる短い2語。',
      line: '*Please let me finish*.',
      said: '説明をさえぎられ、「最後まで言わせて」と言う。',
      mean: 'let me は t が消えて「レミ」と一つにつながる。自分が話を続けたいときの形。',
      trap: 'let him も h が落ちると近い音になる。誰が話していて、誰が続けたいのかで決める。',
      use: 'Let me check and get back to you.（確認して折り返します）' },

    // R fix: V1/V2 (blind 70 %, right): "the Coast Guard" is world knowledge for who sets boat safety rules. Asks
    //   instead what the rule says he must tell them
    // why: life jackets ← "life preservers" were the talk's first point, a moment before; call for help ← the usual
    //   third item of a safety talk
    { id: 'd4', skill: 'detail', level: 'B1', point: 'coastguard', seg: [85.1, 88.6],
      stem: 'What does the captain say the rules require him to tell them?',
      choices: ['Where the safety exits are', 'Where the life jackets are', 'How to call for help'], a: 0,
      cue: '「requires that I tell you」のあと。',
      line: 'the Coast Guard requires that I tell you *where the safety exits are*.',
      said: '「沿岸警備隊の決まりで、非常口の場所をお伝えします」と言う。',
      mean: 'require ＝ 求める・義務づける。案内の前置きによく使う形。',
      trap: '救命具は少し前に済んだ話。tell you のあとの where … are の中身を聞く。',
      use: 'The hotel requires a credit card.（ホテルではカードが必要です）' },

    // R fix: V2 (blind 55 %, right), K3: "has forgotten where they are" was weak. Now "the whole deck", the reading of
    //   "anywhere" without "over the side". Reveals d4's key (its stem names the safety exits)
    // why: brushes off ← "it's very easy" sounds like brushing the question off; whole deck ← "anywhere" heard,
    //   "over the side" missed
    { id: 'h1', skill: 'humor', level: 'C1', point: 'overside', reveals: ['coastguard'], seg: [87.0, 92.4],
      stem: 'Why is the answer about this ship’s safety exits funny?',
      choices: ['His “exit” means going over into the sea', 'He says the whole deck counts as an exit',
                'He brushes it off as too easy to bother with'], a: 0,
      cue: '「very easy」のあと、どこから出るか。',
      line: 'on this ship, it’s very easy. *Anywhere over the side*.',
      said: '「この船は簡単。どこでも、手すりの向こうへ」と言う。',
      mean: '船の「非常口」は、海に飛び込むことだけ。決まった案内を冗談にしている。',
      trap: 'anywhere だけ聞くと「甲板のどこでも」に聞こえるが、over the side は船べりの外、つまり海。',
      use: 'Where’s the exit? Anywhere, it’s a field.（出口？どこでも、野原だもん）' },

    // R fix: K6: the key was the only choice with "party"; the dress-up distractor has it too. (Blind 45 %, else pass)
    // why: dress up ← "shoes" taken literally, as changing for the party; walk on deck ← shoes = walking
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'dancing', seg: [100.1, 103.8],
      stem: 'What are the guests told to get ready for later on?',
      choices: ['Dancing at the party', 'Dressing up for the party', 'Taking a walk on deck'], a: 0,
      cue: '「put on your」のあとの2語。',
      line: 'you are gonna *put on your dancing shoes* later on',
      said: '「あとでダンスシューズをはいてもらうよ」と盛り上げる。',
      mean: 'put on your dancing shoes ＝ 踊る準備をして。靴をはきかえるわけではない。',
      trap: 'shoes を文字どおりに取ると着がえや散歩に聞こえる。決まった形はひとかたまりで。',
      use: 'Put on your dancing shoes tonight!（今夜は踊るよ！）' },

    // why: hands over ← "have a good time" heard as "go run the fun"; staff in line ← the earlier "your company
    //   employees" line read as the request
    { id: 'g2', skill: 'gist', level: 'B2', point: 'sitback', seg: [108.0, 125.0],
      stem: 'How does the captain deal with Michael at the end?',
      choices: ['He asks him to step back and let the crew work', 'He hands him the party for the rest of the night',
                'He tells him to keep his own staff in line'], a: 0,
      cue: '「Listen, Mike」のあとの頼み。',
      line: '…my crew do our job. You just *sit back and have a good time*.',
      said: '「船の仕事は私とクルーに任せて、くつろいで」と Michael に言う。',
      mean: '「楽しんで」は親切な形だが、中身は「口を出さないで」。',
      trap: 'your company employees の話は前置き。頼みの中身は、最後の sit back のほう。',
      use: 'Just sit back and enjoy the ride.（ゆっくり乗っててね）' },

    // why: invite ← "we're all gonna have a good time" sounds inclusive; count ← "company
    //   employees… on the boat" heard as a headcount
    { id: 'p2', skill: 'pragma', level: 'C1', point: 'others', seg: [111.9, 118.4],
      stem: 'When the captain takes Michael aside by name, what is he really saying?',
      choices: ['Calm down; this isn’t just his party', 'Invite the others to join his group',
                'Count his staff so no one is left out'], a: 0,
      cue: '名前を呼んだあと、「only」を含む文。',
      line: 'your company employees are *not the only people on the boat* tonight',
      said: '「乗っているのは君の会社の人だけじゃない。みんなで楽しもう」と言う。',
      mean: '事実を言うだけで、「騒ぎすぎ、ほかの客もいる」とたしなめている。',
      trap: 'we’re all … good time は誘いに聞こえるが、事実の指摘が遠回しの注意になっている。',
      use: 'There are other people here, you know.（ほかにも人がいるんだけどね）' },

    // anchor: 118.5–123.5 s the captain names what he wants: "…my crew do our job. You just sit back and have a good
    //   time"; that rules out a reply that keeps Michael running the fun
    // R fix: V2 (blind 60 %, right): the key was the only deferring reply. All three start "Got it." and answer a
    //   different reading of the captain (C2 recipe: right target, wrong scope)
    // why: behave ← "your company employees are not the only people" heard as a complaint about his staff, not him;
    //   invite ← "we're all gonna have a good time" heard as "bring everyone in"
    // retired: with nt1 (one C2 alone is under 2; it reveals g2's point, sitback)
    { id: 'nt2', skill: 'pragma', level: 'C2', point: 'others', reveals: ['sitback'], seg: [111.9, 123.6],
      retired: true,
      stem: 'Which reply from Michael would show he got the captain’s point?',
      choices: ['“Got it. You and your crew take it from here.”', '“Got it. I’ll make sure my people behave.”',
                '“Got it. I’ll invite the other guests too.”'], a: 0,
      cue: '「Listen, Mike」のあと、船長が何を頼むか。',
      line: 'your company employees are *not the only people on the boat* tonight… You just *sit back*…',
      said: '船長は「ほかの客もいる」と言い、続けて「仕事は私たちに任せて、くつろいで」と頼む。',
      mean: '前の一言は事実の報告でなく、引いてほしいという合図。答えは言葉の形でなく、頼まれたことに返す。',
      trap: '社員の話を「部下を静かに」と取りやすいが、頼まれたのは Michael 本人が引くこと。',
      use: 'Got it. I’ll leave it to you.（了解、お任せします）' }
  ]
};
