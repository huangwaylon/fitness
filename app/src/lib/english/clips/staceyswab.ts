// REVIEW 2026-11-17: pass 12, fix 9, drop 0, new 0; ear checks 3
// REVIEW open: i3 may still be guessable at ~50 % ("wife" is the natural dream); kept for the audio's Mrs.-Reese trap
// “The letter S hates to see Stacey Dillson coming 😭 #Shorts” (NickRewind, Best of iCarly 📲): three cuts of Stacey,
// a fan of cotton swabs: an owner scolds someone for cleaning their ears with a display swab; at a question time
// Stacey asks Carly and Freddie about their “romance”, won't take their no, and trades finishing her swab pyramid
// alone for a date with Logan; then she pitches herself for an internship on the web show and is shouted out.
// Segments from the captions, words from whisper (2026-11-17). Her lisp is not tested: no sound or dict item rests on
// her s-words (the captions' “Shawn's Michael” at 61 s is whisper's “sans Michael”; d5 keys on “solo” and “without
// Michael”, which both have). Only Carly (“Freddie and I…”) and Stacey (“Mrs. Stacey Reese”) are settled by the words,
// so the swab scene says “the owner”, and no key rests on who says “Okay, deal”, “Get out of here!” or “This always
// happens”. Left out on purpose: “You hear that / After that, my little cotton-top friends” at 99 s (the sources
// disagree) and her “speech issues… relapse” (31–40 s), which is about the lisp.
// EAR CHECK: 64.2 s r1 — the cut falls after “You will?” and before “If” (captions: “If” at 64.48 s; whisper's “You
//   will?” runs to 64.50 s)
// EAR CHECK: 75.3 s s2 — “Have you” is reduced to a linked “havya” (both sources: “Have you seen him?”)
// EAR CHECK: 94.5 s x1 — “get you a” runs together as “getcha-a” (both sources: “I'll go get you a date with Logan”)
import type { Clip } from '../types.ts';

export const staceySwab: Clip = {
  id: 'staceyswab', video: 'aCBfyfGb6SQ', title: 'The letter S hates to see Stacey Dillson coming', dur: 126,
  wpm: 131, band: 'slow', tags: ['お願い・断り', '友だち'],
  show: 'iCarly',
  credit: 'iCarly (NickRewind, official YouTube channel)',
  questions: [
    // why: curious ← it's put as a “Who…?” question, as if solving a puzzle; amused ← the silly topic (one cotton
    //   swab) read as play
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'befoul', seg: [0, 11.1],
      stem: 'When the owner first asks about the swab, how does she sound?',
      choices: ['Outraged, as if at a crime', 'Curious, as if at a puzzle', 'Amused, as if at a prank'], a: 0,
      cue: '最初の質問の動詞と、そのあとの言い返し。',
      line: 'Who *befouled* this cotton swab? … This swab came from *my trinket box*.',
      said: '「誰がこの綿棒を汚したの？」と問いただし、「私の小物入れのものよ」と言う。',
      mean: 'befoul は「けがす」という古めかしい強い語。綿棒一本に、事件のような怒り方をしている。',
      trap: 'Who…? の形だけだと、ただの質問に聞こえる。動詞の強さで気持ちを判断。',
      use: 'Who ate my leftovers?（私の残り物食べたの誰？）' },

    // why: wrong sticks ← “plastic turquoise sticks… order online” heard as a complaint about the order; crafts ←
    //   “for crafting” is said, but as what the swabs are for
    { id: 'g2', skill: 'gist', level: 'B1', point: 'swab', reveals: ['swabuse'], seg: [0, 27],
      stem: 'What upsets the owner in the opening scene?',
      choices: ['A swab meant for show was used on ears', 'A special order came with the wrong sticks',
                'Swabs from her box were used for crafts'], a: 0,
      cue: '最初の二人のやりとりと、後半の not for のあと。',
      line: 'I used it to *clean my ears* last night.',
      said: '一人が「昨夜、耳掃除に使った」と言い、持ち主は「耳をほじるためじゃない」と怒る。',
      mean: '飾って眺める特別な綿棒を、ふつうに耳掃除に使われたのが問題。',
      trap: 'crafting や order online は綿棒の説明。怒りの理由は最初のやりとりにある。',
      use: 'That’s not for eating, it’s decoration.（それは食べ物じゃなくて飾りだよ）' },

    // why: cleaning ← “clean my ears” is the other person's line, the normal use; trading/selling ← “order online at
    //   specialty swabs.com” heard as a shop
    { id: 'd1', skill: 'detail', level: 'B1', point: 'swabuse', seg: [11.1, 24.4],
      stem: 'According to the owner, what are these swabs for?',
      choices: ['Crafting, admiring, or holding', 'Cleaning, crafting, or holding', 'Crafting, trading, or selling'], a: 0,
      cue: '「These are for」のあと、三つ並ぶ語。',
      line: 'These are for *crafting, admiring, or holding*.',
      said: '「これは工作用、眺める用、持つ用。汚い耳をほじるためじゃない」と言う。',
      mean: '綿棒を飾り物のように扱っている。三つとも、ふつうの綿棒の使い方ではない。',
      trap: 'clean は相手のせりふで、持ち主は「耳には使わない」側。並んだ語は最後まで聞く。',
      use: 'This mug is just for display.（このマグは飾り用なの）' },

    // why: the user ← her insult “filthy ears” is the loudest line, so it sounds like the target (right mechanism,
    //   wrong target); fair point ← sincerity flip: “don't use my things” taken as a reasonable complaint
    // anchor: 17.8–23.8 s the swabs are “for crafting, admiring, or holding” and “not for” ears: the ordinary use is the
    //   one she calls misuse
    // R fix: V2 (blind 60 %): "really" in the stem pointed away from the obvious target; cut it
    { id: 'nt2', skill: 'humor', level: 'C2', point: 'swabfun', reveals: ['swabuse'], seg: [17.2, 27],
      stem: 'In the swab complaint, who is the joke on?',
      choices: ['The owner, for treating swabs as treasures', 'The user, for having such filthy ears',
                'Nobody; her point is fair, just loud'], a: 0,
      cue: '綿棒の「使い道」として並べるもの。',
      line: 'These are for *crafting, admiring, or holding*. They are *not for* you to dig the muck out…',
      said: '特注の綿棒は工作や眺めるためのもので、耳掃除用ではないと本気で怒っている。',
      mean: '綿棒の本来の使い道を「悪用」と呼ぶ、逆さまの理屈。笑われているのは、怒っている本人の価値観。',
      trap: '悪口の filthy が強く響き、相手が笑いの的に見える。理屈がどちら向きにずれているかを聞く。',
      use: 'You use your good plates? For food?（いいお皿を使うの？料理に？）' },

    // why: throw out ← “filthy ears” suggests it's ruined, and “order online” suggests buying more; hand back ←
    //   “rinse it” heard as cleaning it for the user
    { id: 'i1', skill: 'infer', level: 'B2', point: 'rinse', seg: [20.3, 27],
      stem: 'What will the owner do with the used swab?',
      choices: ['Wash it and put it back', 'Throw it out and buy more', 'Hand it back to its user'], a: 0,
      cue: '最後の一文、have to go のあとの動詞。',
      line: 'Now I have to go *rinse it*.',
      said: '「さあ、これをすすぎに行かなきゃ」と言う。',
      mean: '捨てずに洗って、また小物入れに戻すつもり。それほど大事にしている。',
      trap: '汚れた綿棒は捨てるもの、という常識で選びやすい。rinse ＝ 水ですすぐ、を聞き取る。',
      use: 'I need to go rinse this cup.（このコップ、すすいでこなきゃ）' },

    // why: teasing ← the topic is a romance between friends, the usual ribbing; shy fan ← she has just apologized at
    //   length, so she sounds timid
    // R fix: V2 (blind 50 %): "asking for advice" answered a different question (K5) and left two choices; now a
    //   teasing friend and a sorry fan, both refuted by "circumstances surrounding… Details, please."
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'circum', seg: [41.2, 51.2],
      stem: 'How does Stacey put her question to Carly and Freddie?',
      choices: ['Like a reporter pressing for facts', 'Like a friend teasing them for fun',
                'Like a shy fan, half sorry to ask'], a: 0,
      cue: '質問の言葉づかいと、最後の短い一言。',
      line: 'what are the *circumstances surrounding* your romantic relationship? *Details, please.*',
      said: '「お二人の恋愛関係を取り巻く状況は？詳しくどうぞ」と聞く。',
      mean: 'circumstances surrounding は報道の硬い言い方。友だちの恋の話を取材のように聞いている。',
      trap: '直前の謝りで控えめに見えるが、言葉は強気。話題より言葉の硬さで判断。',
      use: 'So what happened? Details, please.（で、どうなったの？詳しく）' },

    // why: romance ← the question about Carly and Freddie opens the stretch, and “romantic relationship” is said
    //   twice; help with the pyramid ← “finish this pyramid” is said, but with “by myself” and “solo”
    // R fix: V2/K6 (blind 65 %): the key was the only two-part choice with a colon and the only specific one; all three
    //   are now "With Stacey …" outcomes of the same shape
    { id: 'g1', skill: 'gist', level: 'B2', point: 'deal', reveals: ['solo', 'getyou', 'if'], seg: [41.2, 96.1],
      stem: 'How does Stacey’s question time with Carly and Freddie end?',
      choices: ['With Stacey trading solo work for a date', 'With Stacey getting Carly to admit a romance',
                'With Stacey getting Carly’s help on the pyramid'], a: 0,
      cue: '後半、「Okay」で始まる返事の中身。',
      said: '恋愛は否定され、Stacey は一人でピラミッドを仕上げる代わりに、Logan とのデートを頼む。',
      mean: '質問で始まった場面が、交換条件の取引で終わる。',
      trap: 'romantic が二回聞こえて恋愛の話に見えるが、二人は否定している。',
      use: 'Okay, deal. You drive, I’ll pay for gas.（よし決まり。運転してくれたらガソリン代出す）' },

    // why: Freddie ← his name opens the reply, so a partial listener hears it as his line; Stacey ← she asked about
    //   it, and the reply is on her topic
    { id: 'w1', skill: 'who', level: 'B1', point: 'romance', seg: [41.25, 56.2],
      stem: 'Who answers that the two are not a couple?',
      choices: ['Carly', 'Freddie', 'Stacey'], a: 0,
      cue: '返事の最初の「〇〇 and I」の形。',
      line: '*Freddie and I* aren’t in a romantic relationship.',
      said: '「フレディと私は恋愛関係じゃない」と答える。',
      mean: 'Freddie and I と言うので、話しているのはフレディ以外。質問された Carly が答えている。',
      trap: '名前が最初に聞こえると、その人の発言と思いやすい。「名前 and I」の名前は自分以外。',
      use: 'My sister and I are going.（姉と私で行きます）' },

    // why: says sorry ← the Japanese frame: “respectfully” heard as a polite apology (失礼しました); accepts ← the
    //   “Okay” right after sounds like giving in
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'respect', seg: [51.3, 58],
      stem: 'What does Stacey do when her guess about the two is denied?',
      choices: ['Politely refuses to accept the denial', 'Politely says sorry for being so nosy',
                'Politely accepts it and moves on'], a: 0,
      cue: '否定された直後、丁寧な副詞のあとの動詞。',
      line: '*Respectfully, I disagree.* Okay.',
      said: '「失礼ながら、そうは思いません」と返し、すぐ別の話に移る。',
      mean: '丁寧な形の反論。本人たちの否定を、まったく受け入れていない。',
      trap: 'respectfully の丁寧さで、謝りや同意に聞こえやすい。前置きのあとの動詞で判断。',
      use: 'With respect, I see it differently.（恐れ入りますが、私は違う意見です）' },

    // why: reason ← “by myself” heard as a preference she's about to explain; help ← the usual “help me finish”
    //   script, against “by myself”
    { id: 'r1', skill: 'predict', level: 'B2', point: 'if', reveals: ['deal', 'solo'], seg: [56.2, 64.2], then: [64.2, 71],
      stem: 'After “You will?”, what kind of line is Stacey about to say?',
      choices: ['A condition: what she wants back', 'A reason: why she’d rather work alone',
                'A request: help with the pyramid'], a: 0,
      cue: '少し前の「Tell you what」は、どんな話の前置き？',
      line: 'I’ll finish this pyramid… by myself. — You will? — *If* you get me a date…',
      said: '「一人で仕上げる」と言い、「本当？」と聞かれて「もし…」と続ける。',
      mean: 'Tell you what は取引の前置き。差し出すものが先、見返りはあと。',
      trap: 'by myself で「一人がいい理由」が来ると思いやすい。この前置きのあとは交換条件。',
      use: 'Tell you what: you cook, I’ll clean.（じゃあこうしよう、君が作って僕が片づける）' },

    // why: which Logan ← the reading Stacey herself takes (“Reese”), the echo as a check; “Sure” ← the Japanese frame:
    //   an echo (オウム返し) heard as an acknowledgment, 了解
    // anchor: 73.6 s the next question, “Why do you want to go out with Logan?”: the echo was about why, not which, and
    //   Stacey's “Reese” answers a question nobody asked
    // R fix: V2 (blind 50 %): the key's "Why?" matched the stem's pointer to the next question; cut it. "Which Logan" is
    //   also refuted earlier: Stacey has just said "one Logan Reese" in full
    { id: 'nt1', skill: 'pragma', level: 'C2', point: 'which', seg: [68.4, 77.6],
      stem: 'Judging by the question right after it, what did “Logan?” mean?',
      choices: ['“Him, of all the people you could pick?”', '“Which Logan are you talking about?”', '“Logan? Sure, I can do that.”'],
      a: 0,
      cue: '名前を聞き返したあと、次に来る質問。',
      line: 'Logan? — *Reese.* — *Why* do you want to go out with Logan?',
      said: '聞き返されて Stacey は名字で答えるが、次に「なんで Logan と？」と聞かれる。',
      mean: '聞き返しは「よりによって彼？」という驚き。Stacey は「どの Logan？」と取りちがえていて、そこが笑い。',
      trap: '名字の返事につられて「確認」と取りやすい。聞き返しの意味は、次の質問で分かる。',
      use: 'Him? Seriously? Why?（彼？本気？なんで？）' },

    // why: Haven't you ← the n't fits a “come on” tone; You've ← the same two words, reduced and reordered as an echo
    //   question (“You've seen him?”); Have they ← the “you” blends into “ya” and is lost
    // R fix: K4/V2 (blind 50 %): "Had you" didn't fit the moment and nobody would pick it; now "You've", which fits the
    //   gap and is refuted by the /h/ onset
    { id: 's2', skill: 'sound', level: 'B2', point: 'haveyou', reveals: ['whylogan'], seg: [73.1, 77.6],
      stem: 'Fill the gap: “___ seen him?”',
      choices: ['Have you', 'Haven’t you', 'You’ve', 'Have they'], a: 0,
      cue: '理由を聞かれた直後、文頭の短い二語。',
      line: '*Have you* seen him? He’s scrumptious.',
      said: '理由を聞かれて「彼を見たことある？最高なの」と答える。',
      mean: 'Have you が「ハヴュ」とつながり、have はほぼ聞こえない。「見れば分かる」という返事。',
      trap: 'n’t なら「見てないの？」と責める意味。否定なら n の音が残る。',
      use: 'Have you tried the soup here?（ここのスープ食べたことある？）' },

    // why: his show ← “Have you seen him?” heard as watching him on a show; friends ← “you're friends with him” is
    //   said, but to the other person
    { id: 'd3', skill: 'detail', level: 'B1', point: 'whylogan', seg: [73.1, 87.6],
      stem: 'Why does Stacey want to go out with Logan?',
      choices: ['She’s seen him and finds him gorgeous', 'She’s seen his show and loves his acting',
                'She’s friends with him and misses him'], a: 0,
      cue: '理由を聞かれた直後と、そのあと二回出てくる語。',
      line: 'He’s *scrumptious*. And *his arms*.',
      said: '「最高。それにあの腕。ああ、あの腕」とうっとりする。',
      mean: 'scrumptious は本来「おいしそう」。人に使うと「たまらなく魅力的」。理由は見た目。',
      trap: 'seen him を「番組で見た」と取りやすい。友だちなのは聞いている相手のほう。',
      use: 'This cake looks scrumptious.（このケーキ、すごくおいしそう）' },

    // why: proud ← the “yeah” heard alone as a full yes; annoyed ← the hesitant “uh” heard as irritation
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'sorta', seg: [84.2, 87.6],
      stem: 'How does the reply to “You’re friends with him” sound?',
      choices: ['Unsure: they’re only loosely friends', 'Proud: they’re very close friends',
                'Annoyed: they’ve just fallen out'], a: 0,
      cue: '「yeah」のあとに付け足す短い言葉。',
      line: 'Uh, yeah, *sort of*.',
      said: '「えっと、うん、まあね」と答える。',
      mean: 'sort of ＝「まあ、一応」。友だちだとは認めつつ、そこまで親しくないと匂わせている。',
      trap: 'yeah だけ聞くと、はっきりした yes に聞こえる。あとに付く sort of で、答えの強さが下がる。',
      use: 'Do I cook? Sort of.（料理するかって？まあ、一応ね）' },

    // why: with Michael ← “without” is weak, and its “with-” is what stands out; with Carly ← the usual “help me
    //   finish” deal script
    { id: 'd5', skill: 'detail', level: 'B1', point: 'solo', seg: [86.9, 96.1],
      stem: 'Under the deal, who will finish the pyramid?',
      choices: ['Stacey, completely on her own', 'Stacey, together with Michael', 'Stacey, with help from Carly'], a: 0,
      cue: '「pyramid」の直後の一語と、引き受ける返事。',
      line: 'I’ll finish this pyramid *solo*. … You finish the pyramid *without Michael*',
      said: '「一人で仕上げる」「マイケル抜きでね」と確認する。',
      mean: 'solo ＝ 一人で。without Michael も同じ。手伝いなしで完成させるのが条件。',
      trap: 'without の out は弱く、with だけが耳に残りやすい。solo と合わせて判断。',
      use: 'I traveled solo this time.（今回は一人旅だったの）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'getyou', seg: [91.1, 96.1],
      stem: 'Type what is said: “…I’ll go ___ with Logan.” (4 words)', answer: 'get you a date',
      cue: '「I’ll go」のあと、つながって速い部分。',
      line: '…I’ll go *get you a date* with Logan.',
      said: '「Logan とのデート、取りつけてくる」と引き受ける。',
      mean: 'get you a は「ゲッチュア」とつながり、t と y が合わさって「チュ」になる。',
      trap: 'get you が一語に聞こえ、a は消えやすい。語数を数えて、date の前の a を入れる。',
      use: 'I’ll go get you a coffee.（コーヒー買ってくるね）' },

    // why: his mother ← “Mrs. … Reese” heard as Logan's mother's name; famous ← “One day I could be…” heard as a
    //   dream of fame, with the web show around it
    // R fix: V2 (blind 60 %): "After the deal… already dreaming of" pointed at romance; the stem now names the line
    //   only, and the choices fit "what she pictures"
    { id: 'i3', skill: 'infer', level: 'B2', point: 'mrs', seg: [98.6, 104.4],
      stem: 'In her “One day, I could be…” line, what does Stacey picture?',
      choices: ['Herself married to Logan', 'Herself meeting Logan’s mother', 'Herself as famous as Logan'], a: 0,
      cue: '「One day I could be」のあとの呼び名。',
      line: 'One day, I could be *Mrs. Stacey Reese*!',
      said: '「いつか私、ミセス・ステイシー・リースになれるかも！」と言う。',
      mean: 'Mrs.＋自分の名前＋相手の名字 ＝ 結婚した自分。デートの約束だけで結婚を夢見る。',
      trap: 'Mrs. Reese だけ聞くと Logan の母親に聞こえる。間に自分の名前が入っている。',
      use: 'One day, I could live in Paris.（いつかパリに住めるかも）' },

    // why: as much as she can ← capacity as katakana キャパ (how much she can take on); training interns ← “serve you
    //   in an internship” heard as running one
    // R fix: V2 (blind 55 %): "exactly" in the stem cued the precise, role-shaped choice; cut it
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'intern', seg: [105.4, 112],
      stem: 'How does Stacey offer to serve the web show?',
      choices: ['By working for them as an intern', 'By doing as much work as she can', 'By training interns for the show'],
      a: 0,
      cue: '「serve you」のあと、capacity で終わる言い方。',
      line: 'I would sincerely love to serve you *in an internship capacity*.',
      said: '「この番組に夢中で、インターンとしてお仕えしたい」と申し出る。',
      mean: 'in a ～ capacity ＝「〜という立場で」。仕事で使う硬い言い方。',
      trap: 'capacity はカタカナの「キャパ（量）」と結びつきやすいが、この形では「役割・立場」。',
      use: 'I’m here in a personal capacity.（個人として来ています）' },

    // why: never watched ← “I don't know if you guys are into…” heard as not knowing the show; already said yes ←
    //   “I would sincerely love to serve you” heard as taking the job for granted
    { id: 'h2', skill: 'humor', level: 'C1', point: 'pitch', reveals: ['intern'], seg: [105.4, 120.4],
      stem: 'What makes Stacey’s pitch to the web show funny?',
      choices: ['She sells herself with her odd hobby', 'She admits she has never watched the show',
                'She talks as if they had already said yes'], a: 0,
      cue: 'オファーのあと、自分の好きなものを挙げる部分。',
      line: 'I don’t know if you guys are into *cotton swabs and white glue* as much as I am, but—',
      said: 'インターンを頼み、「綿棒と白いボンドがお好きか…」と続ける。',
      mean: '自己アピールの決め手に、誰も求めない綿棒の趣味を出す。売り込みの型からのずれが笑い。',
      trap: 'I don’t know if を「番組を知らない」と取りやすい。分からないのは相手の趣味。',
      use: 'I’m really into board games.（ボードゲームにはまってるの）' },

    // why: right away ← now read as time (今すぐ); the end ← a wrap-up word before the close of a pitch
    // R fix: V2/S1 (blind 55 %): "goes on" in the stem echoed the key's "moves… on" and the key alone had "pitch"; both
    //   reworded
    { id: 'm1', skill: 'marker', level: 'B2', point: 'now', reveals: ['pitch'], seg: [113.9, 120.4],
      stem: 'After Stacey’s offer, what does the first word of her next line do?',
      choices: ['Shifts her talk to a new point', 'Says she needs an answer right away',
                'Marks the end of what she has to say'], a: 0,
      cue: 'オファーのあと、少し間をおいた最初の一語。',
      line: '*Now*, I don’t know if you guys are into cotton swabs and white glue as much as I am, but—',
      said: '「さて、皆さんが私ほど綿棒と白いボンドに興味があるか…」と続ける。',
      mean: '文頭の Now は「今」でなく「さて」。話を次の段階に進める合図。',
      trap: 'now を「今すぐ」と取ると急かしに聞こえる。文頭で間をおく Now は、話の切りかえ。',
      use: 'Now, about the price…（さて、お値段ですが…）' },

    // why: no way ← “Get out of here!” is also slang for “no way, that's amazing!”; go somewhere else ← “out of here”
    //   heard as “let's get out of here” (leave together)
    // R fix: N1: the line dropped "Dude," from the middle of a turn without …
    { id: 'p2', skill: 'pragma', level: 'C1', point: 'getout', seg: [118.4, 126],
      stem: 'What does the shout right after Stacey’s pitch mean?',
      choices: ['“Leave this place right now.”', '“No way, that’s so amazing!”', '“Let’s all go somewhere else.”'], a: 0,
      cue: '叫びのあと、名前を呼ぶ声と最後の一言。',
      line: 'Get out of here! — Carly. — Dude, it’s okay. *This always happens.*',
      said: '叫び声のあと「Carly」と呼ぶ声がして、「大丈夫、いつものこと」と返す。',
      mean: '文字どおり「出ていって」。とがめる声と「いつものこと」から、追い出されたと分かる。',
      trap: '「うそ、すごい！」の意味もあるが、どちらかはそのあとの反応で決まる。',
      use: 'Get out! You won the trip?（うそ！旅行当たったの？）' },
  ]
};
