// REVIEW 2026-11-16: pass 8, fix 16, drop 0, new 0; ear checks 2
// Open: a second blind read of the fixes still lands on g1, p1, p2, pr2, m1, nt2, g2, r1, h5, p3 at 55–70 %, mostly from
//   cross-item hints (kept out of one draw by reveals) or from knowing Michael; accepted after one rewrite each.
// “Suck It, Oscar! - The Office US” (the official The Office channel, BEST OF SEASON 7): Michael says China has 56
// cities of a million people to America's nine; Oscar says that's a projection, a search proves Michael right, the
// office teases Oscar, and over coffee Michael turns the win into a speech about talking and friendship.
// Segments from the captions, words from whisper (2026-11-16). Untested: 14.9–17.4 s (“Thank God” / “that is right
// now”: speakers unclear), 40–46 s (who asks “Are you watching this?”), 123.3–126.2 s (an ethnic stereotype),
// 127–135 s (who pays for the coffee), 174–184 s (the “your victory” speaker is unclear). r1 and h5 don't name the
// speaker of the digging saying.
// EAR CHECK: 121.96 s nt2 — “Actually, you're speculating there, Jim.” is in the captions only (whisper has nothing
//   between “correct grammar” and the next line); the key needs it, and needs it to be Oscar's voice
// EAR CHECK: 191.8 s r1 — the cut falls after “and that may be true”, before “But what they don't tell you”
import type { Clip } from '../types.ts';

export const suckit: Clip = {
  id: 'suckit', video: 'S2XOOESpZg0', title: 'Suck It, Oscar!', dur: 224, wpm: 150, band: 'slow',
  tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2: the news-site choice was easy to drop (and leaked d2); all three are now about China’s size.
    // why: size ← "over a million people" and "here? Nine" heard as a contest of city size; land ← Oscar’s "most in terms of land, not population"
    { id: 'g1', skill: 'gist', level: 'B1', point: 'argue', seg: [0, 56],
      stem: 'What are Michael and Oscar arguing about at first?',
      choices: ['How many big cities China has right now', 'How big China’s cities are next to America’s', 'Whether China’s land or people make it bigger'], a: 0,
      cue: '最初の質問と、最後に読み上げられる結果。',
      said: 'Michael が中国の大都市の数を言い、Oscar は「将来の予測だ」と反論。調べて決着する。',
      mean: '争点は「今」の都市の数。土地や情報源は、途中の言い合いの一部。',
      trap: 'land や Nine がはっきり聞こえて争点に思える。最初と最後の文で決める。',
      use: 'Let’s look it up and settle this.（調べて決着をつけよう）' },

    // why: 46 / 65 / 66 ← -ty + six heard in the wrong order or with the wrong tens (fifty / sixty)
    { id: 'n1', skill: 'number', level: 'B1', point: 'cities', seg: [2.8, 7.3], keep: true,
      stem: 'How many Chinese cities with over a million people does Michael mention?',
      choices: ['46', '56', '65', '66'], a: 1,
      cue: 'there are のすぐあと、cities の前。',
      line: 'in China there are *56 cities* with over a million people?',
      said: '「中国には人口百万を超える都市が56もあるって知ってた？」と聞く。',
      mean: 'fifty-six。十の位を先に、一の位をあとに言う。',
      trap: 'fifty と sixty は語頭の音が違う。fif- か six- か、最初の音を聞く。',
      use: 'There are over fifty of them.（50以上あるんだよ）' },

    // why: 5 ← "years from now" heard without the number's ending; 50 ← fifteen/fifty, the -teen/-ty pair
    { id: 'n3', skill: 'number', level: 'B1', point: 'projection', seg: [9.0, 14.9], keep: true,
      stem: 'Oscar says Michael’s figure is a projection for how many years from now?',
      choices: ['5', '15', '50'], a: 1,
      cue: 'projection of のあと、years の前。',
      line: 'it’s a projection of *15 years* from now.',
      said: '「君の言う数字は知ってる。15年後の予測だ」と言う。',
      mean: 'projection ＝ 予測。今の数ではない、という反論。',
      trap: 'fifteen は後ろの -teen が強く長い。fifty は前が強く、後ろは短い。',
      use: 'In fifteen years, who knows?（15年後なんて分からないよ）' },

    // R fix: V2: the stem’s “X, ___, but Y” frame announced a concession; the stem now only points at the spot, and the choices are paraphrases.
    // why: didn’t know ← betcha heard as "bet you (didn’t know)"; bet on it ← bet read literally (賭ける)
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'betcha', seg: [18.5, 21.7],
      stem: 'What does Oscar mean by the short phrase after “Urbanizing fast”?',
      choices: ['Sure, I’ll give you that', 'I bet you didn’t know that', 'Want to bet on it?'], a: 0,
      cue: 'fast と but の間の、短い一言。',
      line: 'Urbanizing fast, *you betcha*, but still agrarian.',
      said: '「都市化は速い、それはそう。でもまだ農業国だ」と言う。',
      mean: 'you bet(cha) ＝ もちろん、そのとおり。一部を認めてから but で反論する形。',
      trap: 'bet を「賭ける」と取ると話がずれる。認める一言のあとの but に本題が来る。',
      use: 'Is it worth it? You bet.（価値ある？もちろん）' },

    // R fix: V2: “NYT is the standard source” plus two sound-alikes still pointed at the key (2nd blind read 65 %); now three major papers, one sharing “Times”.
    // why: LA Times ← "Times" caught but the city missed; Washington Post ← another big paper, heard as "a newspaper"
    { id: 'd2', skill: 'detail', level: 'B1', point: 'source', reveals: ['nervous'], seg: [27.4, 31.0],
      stem: 'Where does Michael say he got his information?',
      choices: ['The New York Times website', 'The Los Angeles Times website', 'The Washington Post website'], a: 0,
      cue: 'I got it from のあと。',
      line: 'I got it from *NewYorkTimes.com*.',
      said: '「どこからの情報だ？」に「ニューヨーク・タイムズのサイトだよ」と答える。',
      mean: '新聞社のサイトという、信じてよさそうな出どころ。だから Oscar が少し不安になる。',
      trap: 'Times だけ拾うと別の新聞にも聞こえる。前の地名まで聞く。',
      use: 'I read it on the BBC website.（BBCのサイトで読んだよ）' },

    // why: bored ← "not worth our time" taken at face value; kind ← the Japanese frame: 相手の顔を立てる, as if he
    //   were saving Michael from a loss
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'nervous', seg: [30.9, 40.0],
      stem: 'Once someone starts looking it up, how does Oscar seem?',
      choices: ['Uneasy, so he tries to stop the search', 'Bored, since he is sure that he is right',
                'Kind, so that Michael won’t lose face'], a: 0,
      cue: '「調べて」のあと、Oscar が何を言いだすか。',
      line: 'Getting nervous, Oscar? … Guys, it’s *not worth it*, really.',
      said: '「緊張してる？」とからかわれ、Oscar は「調べるほどの事じゃない」と2回言う。',
      mean: 'さっきまで強気だったのに、調べると聞いて止めようとする。',
      trap: 'not worth it を「興味がない」と取りやすい。急に話を止めたがるのは不安の合図。',
      use: 'Never mind, it’s not worth it.（いいよ、そこまでする事じゃない）' },

    // R fix: V2: “I’ll do it right now” was the only sensible reply to a request; the choices now all end in “Jim”.
    // why: with you ← "on" read as being on someone’s side; know ← "I’m on it" heard as already having the answer
    { id: 'p2', skill: 'phrase', level: 'B1', point: 'onit', seg: [33.5, 36.55],
      stem: 'When Jim asks someone to look it up, what does the reply mean?',
      choices: ['I’ll take care of it, Jim', 'I’m with you on that, Jim', 'I know the answer, Jim'], a: 0,
      cue: '「誰か調べて」のあと、すぐ返る短い返事。',
      line: 'Okay, someone look it up. — *I’m on it*, Jim.',
      said: '「誰か調べて」に「任せて、すぐやる」と返す。',
      mean: 'I’m on it ＝ 今すぐ取りかかる。頼まれた事を引き受ける決まり文句。',
      trap: 'on を「味方」と取りやすい。頼みのすぐあとの on it は「やります」。',
      use: 'The printer’s jammed. — I’m on it.（コピー機が詰まった。—すぐやる）' },

    // R fix: K3/K5: “only about the year it holds” was garbled English.
    // why: thanks ← "Great" taken at face value; close ← the projection argument carried on, as if he kept a point
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'admit', seg: [56, 63],
      stem: 'How does Oscar admit his mistake?',
      choices: ['He owns it, but sounds fed up with them all', 'He owns it and thanks Michael for the facts', 'He owns it, but says his figure was close'], a: 0,
      cue: 'Great のあと、最後の問いかけ。',
      line: '*Great*. I was wrong. I’m wrong. *Is everyone happy?*',
      said: '「はいはい、間違えたよ。俺の負け。みんなこれで満足？」と言う。',
      mean: 'Great は皮肉。最後の問いは答えを求めず、からかう周りへの不満を出している。',
      trap: 'Great を「いいね」と取ると、素直に喜んでいるように聞こえる。最後の問いの調子で決める。',
      use: 'Fine, you win. Happy now?（はいはい、君の勝ち。満足？）' },

    // R fix: V2: “really feel” pointed at a hidden feeling (1st blind read 70 %), and the key was the only “though” choice (2nd 65 %); two choices now share the “though” shape.
    // why: uneasy ← "So what? I don’t care" heard as a hurt denial; calm ← the words taken at face value
    { id: 'a5', skill: 'attitude', level: 'C1', point: 'care', seg: [63.9, 70.5],
      stem: 'In his comment to the camera, how does Michael come across?',
      choices: ['Proud, though he claims it means nothing', 'Uneasy, though he claims it means nothing', 'Calm, since he truly doesn’t care'], a: 0,
      cue: '前半の言い方と、後半の「気にしない」の差。',
      line: 'So, I happen to know more than *the smartest guy in the office*. So what? I don’t care.',
      said: '「オフィス一頭のいい男より物知りってこと。だから何？気にしてない」と話す。',
      mean: 'わざわざ「一番の男より上」と言うのが自慢。「気にしない」は照れ隠し。',
      trap: 'I don’t care をそのまま取ると平気に聞こえる。自慢のあとの否定は本音と逆。',
      use: 'Not that I care, but I won.（別にいいけど、勝ったのは僕）' },

    // R fix: V2: “a great deal” made the key the only strong claim; one distractor is now a near miss (still on the argument, but sore).
    // why: work ← "where were we" read as a plain return to business; sore ← "before I bested Oscar" heard as still fighting, not gloating
    // anchor: 64.3–69.7 s “So what? I don't care.”, then 70.8–73.3 s “where were we before I bested Oscar?”: he names
    //   the win the moment he's back in the room
    // retired: with nt2 out, one C2 alone is under 2; back with nt2 after its ear check
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'care', reveals: ['bested'], seg: [63.9, 74.0], retired: true,
      stem: 'Right after his talking head, what does Michael’s next line in the room show?',
      choices: ['That he is still thinking about the win', 'That he is ready to get back to their work', 'That he is still sore about the argument'], a: 0,
      cue: 'カメラへの一言と、部屋に戻った最初の一文。',
      line: 'So what? *I don’t care*. … Okay, now where were we *before I bested Oscar*?',
      said: 'カメラに「気にしてない」と言った直後、部屋で「Oscar を負かす前、どこまで話したっけ？」と言う。',
      mean: '話を戻すだけなら勝ちに触れなくていい。わざわざ言うので、カメラ前の否定が裏返る。',
      trap: 'where were we は普通「話を戻そう」。でも後ろに付けた一言が本当の用件。',
      use: 'Anyway, as the winner, I say…（ともかく、勝者として言うと…）' },

    // R fix: K5/V2: “based” didn’t fit the gap, which left three; every choice is now a verb that fits.
    // why: busted ← /e/ heard as /ʌ/, and "caught Oscar" fits the scene; beat ← the same b…t frame, one syllable; blasted ← a strong verb for a win
    { id: 's1', skill: 'sound', level: 'C1', point: 'bested', seg: [70.4, 74.0],
      stem: 'Fill the gap: “Now where were we before I ___ Oscar?”',
      choices: ['bested', 'busted', 'beat', 'blasted'], a: 0,
      cue: 'before I のあと、Oscar の前の動詞。',
      line: 'Okay, now where were we before I *bested* Oscar?',
      said: '「さて、Oscar を負かす前は何の話だっけ？」と言う。',
      mean: 'best を動詞にすると「負かす」。少し古風で大げさな語を選んで、勝ちを飾っている。',
      trap: 'busted だと「捕まえた」。母音が「エ」か「ア」かで語が変わる。best の音を思い出す。',
      use: 'She bested me at chess again.（またチェスで彼女に負けた）' },

    // why: seats ← "order" read as where they sit; age ← "order" read as by age (年の順)
    { id: 'h1', skill: 'humor', level: 'C1', point: 'order', seg: [74.0, 84.6],
      stem: 'Why does the end of Jim’s “brain power” remark get a laugh?',
      choices: ['He ranks Michael above Oscar, to tease Oscar', 'He says they are sitting in that order',
                'He lists the two of them from oldest down'], a: 0,
      cue: 'two smartest guys のあと、最後に足す一言。',
      line: 'Michael and Oscar, the two smartest guys in the office, *also in that order*.',
      said: '「オフィス一の頭脳が二人。しかもこの順番で」と言う。',
      mean: 'in that order ＝ 言った順に。Michael を上に置いて Oscar をからかっている。',
      trap: 'order を席や年の順と取ると笑いが消える。順番は、さっきの勝負の結果。',
      use: 'Pizza and ice cream, in that order.（ピザとアイス、この順番でね）' },

    // why: fix ← "computer question" + "Hey, Oscar" (he's the one asked); for him ← "so that I can ask Michael" heard
    //   as asking Oscar to pass it on
    { id: 'h2', skill: 'humor', level: 'B2', point: 'aside', seg: [84.65, 89.4],
      stem: 'Why does the computer question to Oscar get a laugh?',
      choices: ['He calls Oscar over only to make him step aside', 'He asks Oscar to fix Michael’s computer for him',
                'He wants Oscar to ask Michael the question for him'], a: 0,
      cue: 'What is it? のあと、頼みの中身。',
      line: 'Hey, Oscar? — What is it? — Can you *move aside* so that I can *ask Michael*?',
      said: 'Oscar が「何？」と答えると、「Michael に聞くから、どいて」と言う。',
      mean: '呼んだのに用はない。物知りの Oscar を飛ばすからかい。',
      trap: 'Hey, Oscar? で Oscar への質問に思える。so that のあとに本当の相手が来る。',
      use: 'Could you move aside a little?（少しどいてもらえる？）' },

    // R fix: V2/N7: the stem named “the request to move” (h2’s key); it now says only “Jim’s request”, and the choices are parallel.
    // why: question ← "I get it" heard as understanding the tab question; smarter ← the Japanese frame: 分かった heard as giving in
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'getit', reveals: ['aside'], seg: [84.65, 90.7],
      stem: 'When Oscar answers Jim’s request, what is he doing?',
      choices: ['Showing he sees the joke and wants it to end', 'Showing he understands the computer question', 'Showing he accepts that Michael is smarter'], a: 0,
      cue: 'All right のくり返しのあと。',
      line: 'All right, all right, *I get it*.',
      said: '「はいはい、分かったよ」と言ってどく。',
      mean: 'I get it ＝ 言いたい事は分かった、もういい。からかいを止めてほしい気持ち。',
      trap: '「分かった」を内容の理解や同意と取りやすい。くり返しの All right はうんざりの合図。',
      use: 'Okay, okay, I get it. Enough.（はいはい、分かった。もういいよ）' },

    // why: print / printer ← both are said right after, in the wrong relation
    { id: 'd4', skill: 'detail', level: 'B1', point: 'tab', reveals: ['ctrlp'], seg: [90.6, 95.5],
      stem: 'What does Michael get asked how to do?',
      choices: ['Open a new tab', 'Print a page', 'Set up the printer'], a: 0,
      cue: 'how do I のあと、最後の名詞。',
      line: 'Michael, how do I *create a new tab*?',
      said: '「新しいタブを開くには？」と聞かれ、Michael は「Ctrl+P」と答える。',
      mean: '答えは印刷の操作。だから Oscar が「それは印刷」と言う。',
      trap: 'print や printer がすぐあとに聞こえる。質問は how do I のあとだけを聞く。',
      use: 'How do I open a new window?（新しい窓はどう開くの？）' },

    // R fix: V2: “won’t admit” was the only reading that fit Michael; the choices are now three readings of “Not if…”.
    // why: warning ← "the printer isn’t hooked up" taken as a real fact; joke ← "dangerous assumptions" heard as playful self-mockery
    { id: 'i2', skill: 'infer', level: 'B2', point: 'ctrlp', seg: [92.2, 100.2],
      stem: 'What does Michael’s answer about the printer show?',
      choices: ['He is dodging so that he won’t look wrong', 'He is warning that the printer isn’t set up', 'He is owning the mix-up with a little joke'], a: 0,
      cue: 'That’s print. のあと、Not if で始まる返事。',
      line: '*Not if* the printer isn’t hooked up. You are making some very *dangerous assumptions*, Oscar.',
      said: '「プリンターがつながってなければ印刷じゃない」と言い、Oscar を責める。',
      mean: 'Ctrl+P が印刷だと認めず、へりくつで押し通している。',
      trap: 'Not if… は条件を付けた反論。プリンターの調子の話ではなく、負けたくないだけ。',
      use: 'Not if you ask me.（私に言わせれば、そうじゃない）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'killing', seg: [100.1, 102.95],
      stem: 'Type what someone says to Oscar: “Oscar, it ___ now…” (4 words)', answer: 'must be killing you',
      cue: 'Oscar, it のあと。語がつながって速い。',
      line: 'Oscar, it *must be killing you* now that Michael is smarter than you.',
      said: '「Michael の方が頭がいいなんて、つらいだろう」とからかう。',
      mean: 'It’s killing me ＝ つらくてたまらない。本当に死ぬ話ではない。',
      trap: 'must be の t が消え「マスビ」、killing you もつながる。4語を一息で。',
      use: 'This waiting is killing me.（待つのがつらくてたまらない）' },

    // R fix: V4: it tests Jim’s stated reason (a detail), not what a marker does, so the skill is now detail. V2: the key was the only specific choice.
    // why: emails ← "correct grammar" heard without "conversation", as office editing; filler ← actually read as his own habit word (口ぐせ)
    { id: 'm1', skill: 'detail', level: 'B2', point: 'actually', seg: [112.9, 121.9],
      stem: 'Why, according to Jim, does the office call Oscar by a nickname?',
      choices: ['He cuts into talks to fix facts and grammar', 'He checks facts and grammar in people’s emails', 'He starts every story with the same filler word'], a: 0,
      cue: 'because のあと、何をしに会話に入るか。',
      line: 'Oscar is known as *“Actually”*, because he will *insert himself* into… any conversation to *add facts or correct grammar*.',
      said: 'あだ名は「アクチュアリー」。どの会話にも入って事実や文法を直すから。',
      mean: 'actually は訂正を始める合図。口ぐせがあだ名に。',
      trap: 'grammar だけだとメールの直しに思える。conversation が手がかり。',
      use: 'Actually, it’s on Tuesday, not Monday.（いや、月曜じゃなくて火曜だよ）' },

    // R fix: V2: the key was the only clever reading and the office choice had no basis; the near misses are now one Jim reading and one Oscar reading.
    // why: Jim ← "you’re speculating" taken at face value; made up ← "Around here… is known as" missed, so the nickname sounds like Jim’s own
    // anchor: 113.1–121.4 s Jim: Oscar will "insert himself into just about any conversation to… correct"; 121.96 s
    //   "Actually, you're speculating there, Jim." (captions only: EAR CHECK)
    // retired: the key rests on “Actually, you’re speculating there, Jim.”, in the captions only (whisper has
    //   nothing there); back after its ear check (121.96 s)
    { id: 'nt2', skill: 'humor', level: 'C2', point: 'actually', seg: [112.9, 123.3], retired: true,
      stem: 'Who is the joke on when Jim’s comment to the camera gets a reply?',
      choices: ['Oscar, who does the very thing Jim describes', 'Jim, whose claim turns out to be only a guess', 'Oscar, whose nickname Jim makes up on the spot'], a: 0,
      cue: 'Jim の説明と、すぐ割り込む一言の最初の語。',
      line: '…to add facts or correct grammar. — *Actually*, you’re speculating there, Jim.',
      said: 'Jim が「Oscar は会話に入って直す」と話すと、「実は、それは推測だよ」と割り込まれる。',
      mean: '割り込んで actually で直す事自体が、今の説明そのもの。本人が証明してしまう。',
      trap: '中身は Jim への指摘なので、Jim が笑われているように聞こえる。割り込みが何をしたかを聞く。',
      use: 'Case in point.（ほら、まさにそれ）' },

    // R fix: V2: firing and China were easy to drop; all three now start “America stays strong”.
    // why: control ← "I could fire you… show mercy" heard as the message; China ← the opening topic, but the point is "as long as… don’t stop talking"
    { id: 'g2', skill: 'gist', level: 'B2', point: 'talking', seg: [136.6, 172.8],
      stem: 'Over coffee, what is Michael’s message to Oscar?',
      choices: ['America stays strong while people like them keep talking', 'America stays strong while bosses keep firm control', 'America stays strong only by watching China closely'], a: 0,
      cue: 'My point is のあと、as long as の文。',
      line: 'as long as *people like you and me don’t stop talking*, nobody can stop the USA.',
      said: '上司と経理、違う二人が話し続ける限り、アメリカは止まらない、と語る。',
      mean: '言い合った二人のお茶を、国の強さの話に広げた大げさな仲直り。',
      trap: 'I could fire you が強く聞こえるが、それは前置き。要点は My point is のあと。',
      use: 'My point is, we should keep talking.（要するに、話し続けようってこと）' },

    // R fix: V2: the “but” was the only move with a twist; two choices now carry a “but”.
    // why: false ← "that may be true. But" heard as a plain correction; advice ← "get to China" carried on as the topic
    { id: 'r1', skill: 'predict', level: 'B2', point: 'dig', reveals: ['friend'], seg: [184.3, 191.8], then: [191.8, 199.8],
      stem: 'After the saying about digging to China, what is coming next?',
      choices: ['A “but” that turns the saying to his own point', 'A “but” that says the saying is simply false', 'A “so” that turns it into advice about China'], a: 0,
      cue: '最後の一言は、何の前置きによく使われる？',
      line: 'you will get to China, and *that may be true*. *But* what they don’t tell you is…',
      said: '「掘り続ければ中国に着くと言う。それはそうかも。でも…」と続く。',
      mean: '一度認めて、but で自分の話に持っていく前置き。',
      trap: 'may be true で話が終わったように聞こえる。認める一言のあとには but が来やすい。',
      use: 'That may be true, but think about it.（そうかもね。でも考えてみて）' },

    // R fix: V2: the key was the only choice about friendship or a joke shape; all three now start “An old saying”.
    // why: tease ← "dig long enough and hard enough in a conversation" heard as a jab at Oscar; fact ← the saying taken as a claim to correct
    { id: 'h5', skill: 'humor', level: 'C1', point: 'friend', seg: [186.4, 199.8],
      stem: 'Why does the end of the digging saying get a laugh?',
      choices: ['An old saying is bent into a corny line on friendship', 'An old saying is used to tease Oscar as hard to talk to', 'An old saying is corrected with a real fact about China'], a: 0,
      cue: 'in a conversation のあと、何に着くか。',
      line: 'if you dig long enough and hard enough *in a conversation*, you *get to a friend*.',
      said: '「会話でも、長く深く掘れば友だちに着く」と、中国の話を友情に変える。',
      mean: '子どもの言い伝えを無理に名言にした。いい話にしたい気持ちと、こじつけの差が笑い。',
      trap: '最後の friend だけ聞くと、Oscar への皮肉に聞こえる。笑いはつなぎ方の無理。',

      use: 'Keep talking, and you’ll find a friend.（話し続ければ、友だちができるよ）' },

    // why: coffee ← "it's on me" earlier; numbers ← the argument that opened the clip, heard as reopened
    { id: 'i5', skill: 'infer', level: 'C1', point: 'whole', reveals: ['closed'], seg: [201.9, 215.5],
      stem: 'When the talk ends with a toast, what is the last complaint about?',
      choices: ['The toast closes on a point no one argued', 'The coffee still has not been paid for',
                'The numbers on China were wrong after all'], a: 0,
      cue: '締めの一言のあと、くり返される That wasn’t。',
      line: 'Case closed. — *That wasn’t* where we were. That wasn’t the whole—',
      said: '「これで決着」と締められ、「そんな話じゃなかった、そもそも…」と言いかける。',
      mean: '勝手に「会話は大事」という結論にされ、言いたい事が言えないまま終わった。',
      trap: 'コーヒーや都市の数が頭に残ると、その話に聞こえる。That wasn’t のあとを聞く。',

      use: 'That’s not what we were talking about.（そういう話じゃなかったでしょ）' },

    // R fix: V2: “settled” was the only sensible ending; the distractors are now other things a toast can close with.
    // why: drink up ← the toast just made, so a toast phrase is expected; tie ← the friendly speech heard as calling it even
    { id: 'p3', skill: 'phrase', level: 'B2', point: 'closed', seg: [205.5, 209.6],
      stem: 'What does Michael mean by the two words after his toast?',
      choices: ['The matter is settled; there’s nothing to add', 'They should drink up now that the toast is done', 'They both argued well, so it ends in a tie'], a: 0,
      cue: 'Raise your cups のあと、短い2語。',
      line: 'Raise your cups on high. *Case closed*.',
      said: '「カップを高く。これにて一件落着」と言う。',
      mean: 'case closed ＝ この件は終わり。自分の結論で話を締める言い方。',
      trap: 'カップを上げた直後なので、乾杯の決まり文句に聞こえる。case は「件」、closed は「終わり」。',
      use: 'He said sorry. Case closed.（彼は謝った。これで一件落着）' },
  ]
};
