// “Pam Has Just Given Up Trying - The Office US” (the official The Office channel, BEST OF SEASON 4): Pam explains her
// glasses to the camera, Michael calls a meeting to "energize" the office (a co-worker teases Pam with a fake proposal,
// Jim mocks Andy's voicemail idea; Stanley flatly refuses to join in), and Toby asks Michael to deal with Stanley's
// "Did I stutter?", which Michael insists was friends joking. One scene thread, mostly talk; not a gag compilation.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 183 s; whisper's repeated "I'll see
// you again" after it is a hallucination. Untested on purpose: 30–36 s (whisper "I don't have my contacts" vs
// captions "a glass boundary"), 49.8–51 s (whisper "Don't, don't you care" vs captions "don't want to tear"),
// 105–106 s ("Earth to Stanley" heard two ways), 114–118 s (Stanley's outburst: in whisper, missing from the
// captions), and the "beautiful, sassy, powerful black man" line (not a target). Speakers are settled by "Pam"
// (21.9 s), "Pamela Morgan Beasley" (48.4 s), "Andy" (79.8 s), "Jim" (91.1 s), "Stanley" (102.6 s) and "Toby"
// (161.7 s); the man who fake-proposes to Pam is never named, so no stem names him.
// EAR CHECK: 96.3 s n1 — Jim's line: captions “zing and pet”, whisper “zing and pep”; the key assumes he repeats Andy's
//   “zing and pep” word for word
// REVIEW 2026-11-16: pass 7, fix 17, drop 0, new 0; ear checks 1
//   Open: n2 (C2) and g2 stay partly guessable from Michael's known character ("knew all along", "insists it was
//   joking"); the choices are better balanced, but the type invites the key.
//   (Removed s1's ear check: both sources have "What are you".)
import type { Clip } from '../types.ts';

export const pamGivenUp: Clip = {
  id: 'pamgivenup', video: 'EvsFBWUMrCw', title: 'Pam Has Just Given Up Trying', dur: 204, wpm: 170, band: 'mid',
  tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // why: parents' ← the usual place to stay over; hotel ← "slept over" heard as a night away from home
    { id: 'd3', skill: 'detail', level: 'B1', point: 'friend', seg: [5.6, 10.3],
      stem: 'Where does Pam say she spent the night?',
      choices: ['At a friend’s house', 'At her parents’ house', 'At a hotel near work'], a: 0,
      cue: 'slept over のあと、少し言いよどむところ。',
      line: 'I slept over at a, uh, *friend’s house*,',
      said: '「えっと、友だちの家に泊まって」と、言いよどみながら話す。',
      mean: 'sleep over ＝ 人の家に泊まる。um や uh が多く、言いにくそうな話し方。',
      trap: 'slept over を旅行と取るとホテルを選びやすい。at のあとの場所を聞く。',
      use: 'Can I sleep over at your place?（君の家に泊まってもいい？）' },

    // why: lost a lens ← "contact" is heard, and losing one is the usual story; broke ← "backup glasses" suggests the
    //   main pair is gone
    { id: 'd1', skill: 'detail', level: 'B1', point: 'glasses', seg: [10.3, 15.2],
      stem: 'Why is Pam wearing glasses today?',
      choices: ['She forgot her contact solution', 'She lost one of her contact lenses',
                'She broke her usual pair of glasses'], a: 0,
      cue: '眼鏡の話の前、何がなかったか。',
      line: 'I forgot my *contact solution*, so I had to wear my backup glasses.',
      said: '「保存液を忘れて、予備の眼鏡をかけるしかなかった」と話す。',
      mean: 'contact solution ＝ 保存液。had to で「仕方なく」と分かる。',
      trap: 'contact や backup から、なくした・壊したと思いやすい。何を忘れたかを聞く。',
      use: 'I forgot my charger at home.（充電器を家に忘れた）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'glasses', seg: [10.3, 13.3],
      stem: 'Type what she forgot: “I forgot my ___.” (2 words)', answer: 'contact solution',
      cue: 'forgot my のあとの2語。',
      line: 'I forgot my *contact solution*,',
      said: '「保存液を忘れた」。contact の最後の t は、ほぼ聞こえない。',
      mean: 'contact solution ＝ コンタクトレンズの保存液。旅行の持ち物でもよく出る語。',
      trap: 't が消えて「コンタク・ソリューション」とつながる。聞こえない t も書く。',
      use: 'Do you sell contact solution?（コンタクトの保存液はありますか）' },

    // R fix: V2 (blind 65 %): "usual pointless" was the only evaluative choice (and leaned on show knowledge, V1); all
    //   three are now neutral readings of name + noun: style, participants, topic
    // why: one-on-one ← "a Michael meeting" read as a meeting with Michael alone; about his plans ← the name read as
    //   the meeting's topic
    { id: 'i1', skill: 'infer', level: 'B2', point: 'michaelmtg', reveals: ['sayno'], seg: [42.3, 54.1],
      stem: 'When Pam names the kind of meeting, what does she mean?',
      choices: ['A meeting run in Michael’s usual style', 'A one-on-one meeting with Michael',
                'A meeting about Michael’s own plans'], a: 0,
      cue: '会議の前に付いた人の名前。',
      line: 'If you propose to me during *a Michael meeting*, I will say no.',
      said: '会議中に「マイケルの会議でプロポーズしたら断る」と言う。',
      mean: '名前＋名詞は「いかにもあの人らしい〜」。いつもの意味のない会議、という皮肉。',
      trap: 'Michael meeting を「マイケルとの面談」と取りやすい。人の名前が会議の種類になっている。',
      use: 'That’s such a Tom thing to say.（いかにもトムが言いそう）' },

    // R fix: V2 (blind 65 %): the key was the only "sounds like X but Y"; all three now start from the proposal
    // why: real proposal ← her full name and "the happiest man in the world" are the marriage script; coffee date ←
    //   "a cup of coffee" heard as "have coffee with me"
    { id: 'h1', skill: 'humor', level: 'C1', point: 'propose', seg: [47.7, 61.05],
      stem: 'What makes the reply to Pam’s warning funny?',
      choices: ['It sounds like a proposal, then asks her to fetch coffee',
                'It sounds like a proposal, then asks her out for coffee',
                'It sounds like a proposal, then turns into a real one'], a: 0,
      cue: 'I’m proposing のあと、何を頼むか。',
      line: 'it’s too late, because *I’m proposing* that you *get me a cup of coffee*',
      said: '「もう遅い。僕にコーヒーを持ってくることを提案します」と続ける。',
      mean: 'propose は「結婚を申し込む」と「提案する」。結婚の流れから、ただの頼みごとに落とす。',
      trap: 'coffee からデートの誘いと取りやすい。get me 〜 は「持ってきて」。',
      use: 'I propose we order pizza.（ピザを頼むことを提案します）' },

    // why: walk out ← "during a Michael meeting" heard as leaving the meeting; wait ← "Don't…" heard as "not now,
    //   later"
    { id: 'd2', skill: 'detail', level: 'B1', point: 'sayno', seg: [48.2, 54.1],
      stem: 'What does Pam say she’ll do if he proposes in the meeting?',
      choices: ['Turn him down on the spot', 'Walk out of the meeting', 'Tell him to wait till later'], a: 0,
      cue: '文の最後、will のあとの短い返事。',
      line: '…during a Michael meeting, *I will say no*.',
      said: '「マイケルの会議中にプロポーズしたら断るから」と先に言う。',
      mean: 'say no ＝ 断る。will で「必ずそうする」と冗談まじりに予告している。',
      trap: 'Don’t で始まるので「今はやめて、あとで」と取りやすい。最後の say no まで聞く。',
      use: 'If you ask me now, I’ll say no.（今聞かれたら、断るよ）' },

    // R fix: V2 (blind 50 %): the party choice was weak; it's now the voicemail idea that the meeting produces
    // why: Pam ← "Pam clearly has just given up trying" (also the title) heard as the meeting's topic; phone message ←
    //   the first idea offered, heard as the agenda
    { id: 'g1', skill: 'gist', level: 'B1', point: 'energize', reveals: ['percolate'], seg: [60.95, 79.5],
      stem: 'What is Michael’s meeting for?',
      choices: ['Finding ways to liven up the office', 'Getting Pam to start trying harder',
                'Coming up with a new phone message'], a: 0,
      cue: '「how are we going to」のあと。',
      line: 'so how are we going to *energize our office*?',
      said: '「どうやってオフィスを元気にしようか」と、みんなにアイデアを求める。',
      mean: 'energize ＝ 活気づける。パムの眼鏡もクリスマスも、元気がない例。',
      trap: 'パムの話や、あとの留守電の案が残りやすい。how are we going to のあとが目的。',
      use: 'How are we going to fix this?（これ、どうやって直そうか）' },

    // R fix: V2 (blind 60 %): the stem's "After “get things going”" pointed at a restatement; it now names the moment only
    // why: coffee ← percolate = brew coffee, and coffee was just asked for; slowly take shape ← percolate also means
    //   ideas slowly filtering through, and this is a brainstorm
    { id: 'p1', skill: 'phrase', level: 'C1', point: 'percolate', reveals: ['energize'], seg: [71.3, 78.1],
      stem: 'Just before asking for ideas, what does Michael’s second “We need to…” mean?',
      choices: ['Get everyone active and moving', 'Brew some fresh coffee for all',
                'Let the ideas slowly take shape'], a: 0,
      cue: '同じ形で2回目の文、-ing の語。',
      line: 'we need to get things going. We need to *get percolating* a little bit.',
      said: '「物事を動かさないと。少し沸き立たせないと」と、同じ形で2回言う。',
      mean: 'percolate ＝ コーヒーが沸いて上がること。そこから「活気づく」。前の文の言い換え。',
      trap: 'コーヒーの語なので文字通りに取りやすい。同じ形の文が並んだら、言い換えと考える。',
      use: 'Let’s get things going.（さあ、始めよう）' },

    // why: Jim ← Jim offers an "even newer" message right after; Michael ← he runs the meeting and repeats "zing and
    //   pep"
    { id: 'w1', skill: 'who', level: 'B1', point: 'andy', seg: [78.2, 88.15],
      stem: 'Who is the first to suggest changing the phone message?',
      choices: ['Andy', 'Jim', 'Michael'], a: 0,
      cue: '「Yes,」のあとに呼ばれる名前。',
      line: 'Yes, *Andy*. — What if we changed our outgoing answering machine message…',
      said: '「はい、アンディ」と指名され、その人が留守電のメッセージを変えようと言う。',
      mean: '会議では名前を呼んで指名してから話させる。誰の意見かは、直前の名前で分かる。',
      trap: 'あとでジムも似た案を出すので混ざりやすい。指名の名前と、次の発言をセットで聞く。',
      use: 'Yes, you in the back.（はい、後ろの方どうぞ）' },

    // R fix: V2 (blind 65 %): "useful information" was a filler; now jokes, from zing ≈ zinger
    // why: jokes ← "zing" heard as a "zinger" (a witty line); music ← Michael's "rap rhyme" comes soon after
    { id: 'p2', skill: 'phrase', level: 'B2', point: 'zing', seg: [80.28, 88.15],
      stem: 'What would the changed phone message have more of?',
      choices: ['Energy and liveliness', 'Jokes and witty lines', 'Music and sound effects'], a: 0,
      cue: 'a little more のあとの2語。',
      line: 'so it just had *a little more zing* and *a little more pep*?',
      said: '「もう少し勢いと元気がある感じに」と言う。',
      mean: 'zing も pep も「元気・活気」。似た語を重ねて、明るい雰囲気にしたいと言っている。',
      trap: 'zing から zinger（気の利いた一言）を、留守電から音楽を考えやすい。2語並んだら似た意味が多い。',
      use: 'This soup needs a little more zing.（このスープ、もう少しパンチがほしい）' },

    // R fix: S4: the segment ran 22 s, to 102.3; it now ends after "Now we're cooking" (17.2 s, the two turns can't be
    //   shorter; the rap line falls outside, so Jim plainly doesn't say it).
    //   V2 (blind 60 %): the key was the only "X; Y" choice; all three now have that shape, and the second-message
    //   distractor became the sincere reading ("even more" taken at face value)
    // why: more energy ← "even more zing and pep" taken sincerely, as Andy's idea pushed further; rap theme ← Michael's
    //   "rap rhyme" is the next idea heard, so it seems to be part of Jim's
    // anchor: 80.3–87.7 s Andy: "changed our outgoing answering machine message… a little more zing… a little more
    //   pep"; 91.6–96.4 s Jim: "an even newer voicemail message that had even more zing and pep": the same idea with
    //   "even" added; 98.6 s the rap theme is Michael's, after "I like this"
    // retired: the ear-check policy: the key needs Jim's “zing and pep” (whisper), the captions have “zing and pet”
    //   (96.3 s); back if the ear says pep
    { id: 'n1', skill: 'humor', level: 'C2', point: 'evenmore', reveals: ['zing', 'andy'], seg: [80.28, 97.5], retired: true,
      stem: 'What would Jim’s suggestion actually add to Andy’s idea?',
      choices: ['Nothing; it is Andy’s idea with “even” added', 'More energy; Andy’s idea, but pushed further',
                'A rap theme; a catchier way to give it energy'], a: 0,
      cue: 'アンディの案とジムの案の言葉を比べて。',
      line: 'What if we changed our outgoing answering machine message… — What about if we did *an even newer* voicemail message that had *even more zing and pep*?',
      said: 'アンディの「留守電を変えてもっと元気に」を、ジムが even を付けてくり返す。',
      mean: '本気なら何も足していない。同じ案に even を付けただけで、まじめなふりで会議を茶化している。',
      trap: 'newer で別の案、直後の rap で新しい工夫と取りやすい。前の人の言葉をなぞる案は、茶化しの合図。',
      use: 'Good idea. Even better: the same idea.（いい案。もっといいのは、同じ案）' },

    // why: hinting weak ← Japanese frame: praising the wording as a polite way to dodge the idea; more detail ←
    //   "those are the kind of…" heard as a call for more
    { id: 'i2', skill: 'infer', level: 'C1', point: 'words', reveals: ['zing'], seg: [87.7, 91.55],
      stem: 'What does Michael’s reaction to the first idea show?',
      choices: ['He likes the catchy words more than the plan', 'He is hinting politely that the idea is weak',
                'He wants to hear the idea in more detail'], a: 0,
      cue: 'See のあと、何をほめているか。',
      line: 'Zing and pep. See, *those are the kind of words* we’re looking for.',
      said: '「勢いと元気。そういう言葉がほしかった」と言い、すぐ次の人を指名する。',
      mean: 'ほめたのは案の中身でなく言葉の響き。中身より勢いのある言葉が好きな上司だと分かる。',
      trap: '日本語の「いい言葉ですね」は遠回しな否定にもなるが、ここは本気。何をほめたかを聞く。',
      use: 'That’s exactly what I was looking for.（まさにそれを探してた）' },

    // R fix: V2 (blind 65 %): "going too far" was weak; now "cook up" (= make up)
    // why: trouble ← "we're cooked" (= we're done for) is a near idiom; making it up ← "cook up" = invent, and the
    //   ideas are getting silly
    { id: 'p3', skill: 'phrase', level: 'B2', point: 'cooking', seg: [91.55, 98.62],
      stem: 'When Michael hears Jim’s idea, what does his reaction mean?',
      choices: ['Now we’re getting somewhere', 'Now we’re in real trouble', 'Now we’re just making it up'],
      a: 0,
      cue: 'I like this の直前の短い一言。',
      line: '*Now we’re cooking.* I like this.',
      said: '「いいぞ、乗ってきた。気に入った」と言う。',
      mean: 'Now we’re cooking ＝ 調子が出てきた、いい感じになってきた。',
      trap: 'we’re cooked（もうだめ）や cook up（でっち上げる）と混ぜやすい。I like this で判断。',
      use: 'Now we’re cooking! Keep going.（いい感じ！その調子）' },

    // R fix: V2 (blind 60 %): the key was the only flat refusal against two conditions; one distractor is now the usual
    //   "refuses, then gives in" script
    // why: after game ← "put your little game down" heard as his condition; gives in ← the boss keeps pushing, and the
    //   usual script ends with a yes
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'refuse', seg: [101.15, 112.85],
      stem: 'How does Stanley answer Michael’s requests to help out?',
      choices: ['He refuses each time he is asked', 'He refuses at first, then gives in',
                'He agrees once he has finished his game'], a: 0,
      cue: 'Stanley と呼ばれたあとの、短い返事の数。',
      line: '…you want to help us out with that? — *Not me.* … join the group. — *No.*',
      said: '「手伝って」に「僕はいい」、「ゲームを置いて参加して」に「いやだ」と返す。',
      mean: '短い返事を重ねて、はっきり断っている。上司の頼みでも理由を言わない。',
      trap: '上司が押せば最後は折れる、と予想しやすい。短い返事の数を数えると、全部が拒否。',
      use: 'Not me. Ask someone else.（僕はいい。ほかの人に頼んで）' },

    // R fix: V2 (blind 50 %): the key's HR wording ("take action on how… behaved") stood out; it's now plainer
    // why: say sorry ← "address what happened with Stanley" heard as making it up to Stanley; why upset ← "what
    //   happened" read as asking why Stanley got angry
    { id: 'g3', skill: 'gist', level: 'B1', point: 'complaint', seg: [134.1, 152.4],
      stem: 'What does Toby want Michael to do?',
      choices: ['Deal with Stanley for defying him', 'Say sorry to Stanley for this morning',
                'Find out why Stanley got so upset'], a: 0,
      cue: '「you need to」のあとと、次の Toby の一言。',
      line: 'you need to *address what happened with Stanley* this morning… Stanley was *openly insubordinate*.',
      said: '「今朝のスタンリーの件に対処して。上司に公然と逆らった」と話す。',
      mean: 'address ＝ 問題に取り組む。insubordinate ＝ 上司に従わない。',
      trap: 'address を「話しかける」と取ると、謝る話に聞こえる。次の一言で誰の非か分かる。',
      use: 'We need to address this problem.（この問題に対処しないと）' },

    // R fix: V2 (blind 60 %): "admits it went too far" was the only concession; one distractor is now a near miss that
    //   agrees but excuses Stanley
    // why: talk later ← "Can I talk to you…" and "address" set up the usual boss-fixes-it script; agrees but excuses ←
    //   "He was joking" heard as a concession that Stanley meant no harm
    { id: 'g2', skill: 'gist', level: 'B2', point: 'denial', reveals: ['nothing'], seg: [138.6, 183.7],
      stem: 'How does Michael handle Toby’s concern by the end?',
      choices: ['He insists it was only friendly joking', 'He agrees to talk with Stanley later',
                'He agrees, but says Stanley meant no harm'], a: 0,
      cue: 'Toby の名前を呼ぶところと、最後の一言。',
      line: '*He was joking*, Toby, all right?… *That’s what friends do.*',
      said: '「冗談だよ」「友だちならからかい合うもの」と、問題はなかったと言い張る。',
      mean: '注意を受け止めず、友だちの冗談だったことにして話を終わらせようとしている。',
      trap: '上司が「あとで話しておく」と引き取る型を予想しやすい。最後まで何も認めていない点を聞く。',
      use: 'Relax, I was only joking.（落ち着いて、冗談だよ）' },

    // R fix: V2 (blind 60 %): "Who are you blabbering about?" was a weak choice; now "What have you been", another weak
    //   auxiliary that fits the gap
    // why: were ← the weak "are" ≈ "er", easily heard as past "were"; have been ← "-ra-ya" heard as "-v-ya", and a
    //   complaint often runs in the present perfect
    { id: 's1', skill: 'sound', level: 'B2', point: 'blabber', reveals: ['nothing'], seg: [143.7, 147.05],
      stem: 'Fill the gap: “___ blabbering about?”',
      choices: ['What are you', 'What were you', 'What have you been'], a: 0,
      cue: '文の最初、短くつながる3語。',
      line: '*What are you* blabbering about? Nothing happened.',
      said: '「何をぺらぺら言ってる」。What are you が「ワラユ」と一続き。',
      mean: 'are は弱く「ア」程度、t は弾む。blabber ＝ くだらない話をぺらぺらする。',
      trap: '弱い are は were に聞こえやすい。時制は前後で判断。ここは今の話。',
      use: 'What are you talking about?（何の話？）' },

    // R fix: V2 (blind 55 %): "worries about how serious it is" was a filler; now a light-joking reading
    // why: can't recall ← "What are you… about?" taken as a real question; joking ← "blabbering" is a playful word, so
    //   the reply sounds like teasing
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'nothing', reveals: ['blabber'], seg: [143.7, 152.4],
      stem: 'When Toby raises the Stanley matter, how does Michael first respond?',
      choices: ['He waves the whole thing away as nonsense', 'He honestly can’t recall what Toby means',
                'He jokes about it to lighten the mood'], a: 0,
      cue: '最初の質問と、そのすぐあとの短い文。',
      line: 'What are you blabbering about? *Nothing happened.*',
      said: '「何をぺらぺら言ってる。何もなかった」と答える。',
      mean: '相手の話を「くだらないおしゃべり」扱いし、問題自体を打ち消している。',
      trap: 'What are you 〜 about? を本当の質問と取りやすい。次の文で、とぼけていると分かる。',
      use: 'Oh, come on, it was nothing.（もう、大したことないって）' },

    // R fix: V2 (blind 65 %): reworded so all three are about when and how he knew (partial: "give away" still
    //   invites the hidden-knowledge key)
    // why: truly forgot ← "Nothing happened" taken at face value, with the question as memory coming back; hearsay ←
    //   "That, in the conference room?" heard as asking about something he only heard of
    // anchor: 145.8 s "Nothing happened", then 150.2 s he names the room himself before Toby does, and 152.9–157.0 s he
    //   retells Stanley's words word for word ("the two of us… he said, 'Did I stutter?'")
    // R fix: S4: 16.8 s → 12.8 s (144.5–157.3), ending after "Did I stutter?"
    // retired: never drawn under g2, which reveals its point (nothing), so play 3 under g2 had no C2 to give
    { id: 'n2', skill: 'infer', level: 'C2', point: 'nothing', seg: [144.5, 157.3], retired: true,
      stem: 'What does Michael’s question about the conference room give away?',
      choices: ['He knew from the start what Toby meant', 'He only just now worked out what Toby meant',
                'He only knows of it from what others told him'], a: 0,
      cue: 'Nothing happened と、そのあとの場所の名前。',
      line: 'Nothing happened. … *That, in the conference room?*',
      said: '「何もなかった」の直後、自分から「会議室のあれ？」と言い、やり取りを言葉どおりに再現する。',
      mean: '場所もせりふも覚えている。「何もなかった」はとぼけただけで、最初から分かっていたと自分で明かしている。',
      trap: '思い出しただけと取りやすい。否定のすぐあとに細かい記憶が出たら、知らないふりを疑う。',
      use: 'Oh, that? That was nothing.（ああ、あれ？何でもないよ）' },

    // R fix: S4: the segment ended on the first sound of "and" (155.4); it now ends after "and he" (155.85)
    { id: 'x2', skill: 'dict', level: 'B2', point: 'joshing', seg: [152.4, 155.85],
      stem: 'Type what Michael says: “We were ___, the two of us.” (2 words)', answer: 'joshing around',
      cue: 'We were のあと、つながる2語。',
      line: 'We were *joshing around*, the two of us,',
      said: '「二人でふざけ合ってただけ」。joshing around が「ジョシンガラウン」とつながる。',
      mean: 'joshing around ＝ ふざけ合う。joking よりくだけた語。',
      trap: 'joking と聞き間違えやすい。ng と a がつながる点に注意。',
      use: 'Don’t worry, I’m just joshing you.（心配しないで、からかっただけ）' },

    // R fix: V2 (blind 90 %): both distractors were literal questions, so the one idiomatic choice won; they're now
    //   non-literal readings too (offense, an apology)
    // why: mocking ← stutter = どもる, heard as "are you making fun of my speech?"; offer to repeat ← "Did I…?" heard as
    //   a polite check before saying it again
    { id: 'p4', skill: 'phrase', level: 'C1', point: 'stutter', seg: [155.42, 160.5],
      stem: 'In Michael’s retelling, what did Stanley’s short question mean?',
      choices: ['You heard me the first time', 'Are you mocking the way I talk?', 'Sorry, should I say it again?'],
      a: 0,
      cue: 'he said のあとの3語と、マイケルの反応。',
      line: 'he said, “*Did I stutter?*” And I said, “Whoa, whoa, whoa…”',
      said: '「俺、どもったか？」と言われ、「おいおい」と返したと話す。',
      mean: 'Did I stutter? ＝「はっきり言ったよな」。強く突き放す決まり文句。',
      trap: 'stutter（どもる）から話し方や言い直しの話と取りやすい。Whoa の反応で強さが分かる。',
      use: 'You heard me. I said no.（聞こえたでしょ。だめって言ったの）' },

    // R fix: V2 (blind 65 %): the key was the only nuanced choice; one distractor is now a polite going-along
    // why: goes along ← "seem like he was joking" heard without "didn't", and Toby's soft voice; unsure ← "seem" heard
    //   as a hedge (Japanese 〜みたい = not sure)
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'notjoking', seg: [160.0, 166.1],
      stem: 'When Michael insists Stanley was kidding, what does Toby’s reply do?',
      choices: ['It quietly disagrees with Michael', 'It politely goes along with Michael',
                'It admits Toby isn’t sure what he saw'], a: 0,
      cue: '返事の最初の方、短い否定の音。',
      line: 'He was joking, Toby… — *He didn’t seem like he was joking.*',
      said: '「冗談だったんだよ」に、トビーが「冗談には見えなかった」と返す。',
      mean: 'seem で言い方を和らげながら、上司の説明に反対している。マイケルも反論で返す。',
      trap: 'didn’t の t が消えると同意に聞こえる。seem は迷いでなく、角を立てない言い方。',
      use: 'It didn’t seem that way to me.（私にはそう見えなかった）' },

    // R fix: V2 (blind 70 %): "Offering to help Toby make some friends" was a filler; now a friendly hint, and the key
    //   is shorter
    // why: hint ← "If you had any friends" heard as a warm opening; concession ← "you would understand" heard as "you'd
    //   see my side, and I see yours"
    { id: 'pr2', skill: 'pragma', level: 'C1', point: 'friends', seg: [170.5, 175.5],
      stem: 'What is Michael doing when he brings up Toby’s friends?',
      choices: ['Insulting Toby to avoid his point', 'Hinting that he and Toby could be friends',
                'Gently admitting Toby has a point'], a: 0,
      cue: 'If you had のあとと、文の終わり。',
      line: '*If you had any friends*, you would understand.',
      said: '「友だちがいれば分かるはずだ」とトビーに言う。',
      mean: '仮定法で「君には友だちがいない」と言っている。注意の中身には答えず、相手を攻撃して話をそらす。',
      trap: '「友だちがいれば」を思いやりと取りやすい。仮定法の had は「実際はいない」の意味。',
      use: 'If you were there, you’d understand.（その場にいたら分かるよ）' },

    // why: Toby ← Michael has just mocked him for having no friends, so the speech sounds aimed at him; Stanley ←
    //   "Hey, you're poor" heard as Michael's joke about Stanley
    // anchor: 175.5–182.7 s "Friends joke with one another", then his two examples ("you're poor", "your mama's
    //   dead") are plain cruelty with no names, and "That's what friends do" closes his own case
    // retired: with n1 and n2 (one C2 alone is under the tier's 2)
    { id: 'n3', skill: 'humor', level: 'C2', point: 'jokeon', reveals: ['friends'], seg: [175.0, 183.7], retired: true,
      stem: 'In Michael’s lesson on how friends joke, who is the joke on?',
      choices: ['Michael, whose examples of friends joking are cruel',
                'Toby, who Michael says doesn’t have any friends', 'Stanley, the friend Michael jokes is poor'], a: 0,
      cue: '「Friends joke」のあとの二つの例。',
      line: '*Friends joke with one another.* “Hey, you’re poor.” “Well, hey, your mama’s dead.” *That’s what friends do.*',
      said: '「友だちはからかい合う。『お前貧乏だな』『お前の母ちゃん死んでるし』。それが友だち」。',
      mean: '友だちの冗談の例が、ただのひどい悪口。自分の例で自分の主張を崩していて、笑われているのはマイケル。',
      trap: '直前にトビーをけなしたので、トビーへの皮肉と取りやすい。例を出した本人が損をしていないかを聞く。',
      use: 'Friends tease each other. It’s fine.（友だちならからかい合うよ、平気）' }
  ]
};
