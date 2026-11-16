// REVIEW 2026-11-16: pass 9, fix 15, drop 0, new 0; ear checks 3
// OPEN: a cold reader (stems and choices only) still got 19/22 right, 11 at ≥ 50 %; nt3 65 %, i2 and s2 60 %.
//   g3 leans on the title ("Bandits"); s2's "we'll" is what the grammar expects, but the item is about hearing it.
// OPEN: the stems name Chandler and Rachel from the turn order (no address settles every line); no key turns on who.
// “The Cheesecake Bandits | Friends” (the official Friends channel, Best of Season 6): a cheesecake meant for Mrs.
// Braverman downstairs reaches Chandler, he and Rachel eat it, try to forget a second one, take it anyway, fight over
// it, split it, and lose both halves to the floor.
// Segments from the captions, words from whisper (2026-11-16). Whisper's timings drift after ~250 s and it loops
// from 277 s; nothing is keyed there. Untested: 23.6 s ("addressed"; whisper hears "a dress"), 58–64 s (whose "I feel
// terrible"), 171.4 s ("Mm-mm" in whisper, "mm-hmm" in the captions), 219–237 s (who picks which half; "So, the
// smaller piece"), 249–257 s and 273–280 s (the pieces fall: visual), 280.6 s ("floor"/"flour"), 298 s on (Joey,
// visual).
// EAR CHECK: 31.8 s s1 — "didn't read": confirm the n of "didn't" is heard (both sources say "didn't")
// EAR CHECK: 117.0 s s2 — "we'll drop it off": confirm the weak 'll after "we" (both sources say "we'll")
// EAR CHECK: 187.4 s nt2 — "you're gonna have to" said as four weak words in about a second (both sources agree)
import type { Clip } from '../types.ts';

export const cheesecakeBandits: Clip = {
  id: 'cheesebandit', video: 'fWs2dWcNGu0', title: 'The Cheesecake Bandits', dur: 310, wpm: 162, band: 'mid',
  tags: ['家', '友だち'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 55 %): "already had dessert" was a weak filler; now a diet reading of the same refusal
    // why: bad tooth ← "tooth" heard literally, as a body part; cut back ← "not that much of a sweet tooth" heard
    //   as a diet, the usual polite-refusal script
    { id: 'ph1', skill: 'phrase', level: 'B2', point: 'sweet', seg: [5.5, 10.2],
      stem: 'When she’s offered the cheesecake, what does Rachel first say about herself?',
      choices: ['She doesn’t usually go for sweet things', 'She has a bad tooth and can’t eat sweets',
                'She’s trying to cut back on sweets'], a: 0,
      cue: 'you know のあと、tooth で終わる言い方。',
      line: 'Oh, you know, I’m *not that much of a sweet tooth*.',
      said: '「あんまり甘い物好きじゃないんだよね」と最初は断る。',
      mean: 'a sweet tooth ＝ 甘い物好き。歯の話ではない。このあと一口食べて大絶賛する。',
      trap: 'tooth を文字どおり歯と取ると「歯が痛い」に引っぱられる。体の一部の語は慣用句を疑う。',
      use: 'I’m not much of a coffee person.（コーヒーはあまり飲まないんだ）' },

    // R fix: V2 (blind 70 %): "as a gift" was out once the stem said "actually"; now Mrs./Mr. against up/down
    // why: upstairs ← only "-stairs" caught; a man ← the short "Mrs." before the name heard as "Mr."
    { id: 'd1', skill: 'detail', level: 'B1', point: 'braverman', seg: [23.0, 29.2],
      stem: 'Who is the cheesecake actually meant for?',
      choices: ['A woman who lives downstairs', 'A man who lives downstairs', 'A woman who lives upstairs'], a: 0,
      cue: '宛名を読み上げる部分、名前のあとの一語。',
      line: 'This is addressed to *Mrs. Braverman downstairs*.',
      said: '宛名を見て「あなた宛てじゃない。下の階のブレイバーマンさん宛てよ」。',
      mean: 'addressed to ＝ 〜宛て。二人への贈り物ではなく、配達先を取りちがえただけ。',
      trap: 'Mrs. と Mr.、up と down は一瞬の差。名前の前と最後の一語を聞く。',
      use: 'This letter is addressed to you.（この手紙、あなた宛てだよ）' },

    // R fix: V2 (blind 60 %): "don't read" and "didn't need" didn't fit the sentence; now three grammatical pasts
    // why: did read ← the t of "didn't" lost, so it sounds like "did"; hadn't read ← "I didn't" heard as "I'd…n't",
    //   the past perfect a grammar-minded listener expects before "before I opened"
    { id: 's1', skill: 'sound', level: 'B2', point: 'read', seg: [31.2, 37.6],
      stem: 'Fill the gap: “No, I ___ the box before I opened it.”',
      choices: ['didn’t read', 'did read', 'hadn’t read'], a: 0,
      cue: 'No のすぐあと。最初の語の終わりの音に注意。',
      line: 'No, I *didn’t read* the box before I opened it',
      said: '「いや、開ける前に箱を読まなかったんだ」と言い訳する。',
      mean: 'didn’t の t はほぼ消え「ディドゥン」に近い。読んでいれば気づけた、という弁解。',
      trap: 't が聞こえないと did に聞こえ、「読んだ」と逆になる。n の音が残っていれば否定。',
      use: 'Sorry, I didn’t read the sign.（すみません、表示を読んでなくて）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'sendaway', seg: [46.0, 51.6],
      stem: 'Type what he says: “Mrs. Braverman is going to ___ a free one.” (3 words)', answer: 'send away for',
      cue: 'going to のあと、動詞と2つの短い語。',
      line: 'Mrs. Braverman is going to *send away for* a free one, and that way we all win.',
      said: '「無料の代わりを取り寄せるから、みんな得をする」と言い張る。',
      mean: 'send away for ＝ 郵便などで注文して取り寄せる。',
      trap: 'away と for は弱く、send にくっついて一語のように聞こえる。小さな語も数える。',
      use: 'I sent away for a free sample.（無料サンプルを取り寄せた）' },

    // R fix: V2 (blind 55 %): the key's "big company"/"tiny shop" pair spelled the joke out; reworded, and the
    //   forgetting distractor now says he makes a name up
    // why: makes one up ← the pause before the name heard as searching for it; Rachel's favorite ← "Mama's"
    //   heard as a warm, familiar place
    { id: 'h2', skill: 'humor', level: 'C1', point: 'bakery', seg: [50.4, 58.6],
      stem: 'Why does the name of the “only losers” get a laugh?',
      choices: ['The giant firm he names is a tiny family bakery', 'He blanks on the firm’s name and makes one up',
                'The company he blames is Rachel’s favorite'], a: 0,
      cue: 'big のあとの長い語と、そのあとの名前の差。',
      line: 'The only losers are the *big cheesecake conglomerate*… *Mama’s Little Bakery*.',
      said: '「損するのは大手チーズケーキ企業だけ……ママズ・リトル・ベーカリー」',
      mean: 'conglomerate ＝ 巨大企業。悪者扱いの「大企業」の名前が、小さな家族の店そのもの。',
      trap: '間は名前を探すためではなく、オチの前のため。大げさな前置きのあとは落差を待つ。',
      use: 'The only loser here is my wallet.（損するのは私の財布だけ）' },

    // R fix: V2 (blind 55 %): "glad he saved some" was a filler; now a worry about the theft
    // why: caught ← the stolen cake is back, so "Are you serious?" heard as alarm; ate without her ← "we ate an
    //   entire cheesecake" heard as a complaint about sharing (refuted by "we")
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'serious', seg: [79.3, 87.0],
      stem: 'How does Rachel react on learning he wants more cheesecake?',
      choices: ['She can’t believe he wants more so soon', 'She’s worried they’ll get caught this time',
                'She’s hurt he ate it without her'], a: 0,
      cue: '名前を呼ぶ前の、短い問いかけ。',
      line: '*Are you serious?* Chandler, we ate an *entire cheesecake* two days ago',
      said: '「本気？2日前に丸ごと1個食べたのに、まだ欲しいの？」とあきれる。',
      mean: 'Are you serious? は質問ではなく、あきれた驚き。entire が「丸ごと」を強める。',
      trap: 'we ate は「一緒に食べた」。一人で食べられた不満ではない。',
      use: 'Are you serious? You’re hungry again?（うそでしょ、もうお腹すいたの？）' },

    // R fix: V2 (blind 60 %): "thin excuse" was the only sensible reading; now a request that Rachel's next turn
    //   seems to answer
    // why: forgettable ← "forgotten" read as "not worth remembering" (literal reading); remind him ← Rachel goes on
    //   to describe the taste, so the line sounds like a request
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'forgot', seg: [83.8, 87.5],
      stem: 'What does Chandler’s answer to “you want more?” do?',
      choices: ['It gives a flimsy reason for wanting more', 'It admits the first cake was forgettable',
                'It asks Rachel to remind him how it tasted'], a: 0,
      cue: 'forgotten のあと、文末の短い一語。',
      line: 'Well, *I’ve forgotten what it tastes like*, okay?',
      said: '「だって、どんな味か忘れちゃったんだよ、いいだろ」と返す。',
      mean: '2日で味を忘れるはずはない。食べたい本音を苦しい理由で通している。okay? は開き直り。',
      trap: 'forgotten を「印象が薄い」と取ると、まずかった話になる。苦しい理由は言い訳を疑う。',
      use: 'I just need to taste it again, okay?（もう一回味見したいだけだよ）' },

    // R fix: V2 (blind 65 %): "ate more" was a filler; now "fine" at face value (the literal hedge)
    // why: too rich ← "very rich" is said, and heard as a near-complaint; letdown ← "It was fine" taken as the
    //   polite word for "meh"
    // anchor: 87.8–100.5 s "It was fine" is followed at once by a slow, loving list (buttery, crumbly, rich yet
    //   light), and Chandler answers it with "my whole mouth just filled with saliva" (104.2 s)
    { id: 'nt1', skill: 'attitude', level: 'C2', point: 'fine', seg: [87.3, 101.5],
      stem: 'When Rachel says the first cheesecake “was fine”, what is she trying not to say?',
      choices: ['That she loved it just as much as he did', 'That she found the cake a bit too rich',
                'That she found it a bit of a letdown'], a: 0,
      cue: '「fine」と、そのあとの説明の細かさの差。',
      line: 'It was cheesecake. *It was fine.* It had a *buttery, crumbly* graham cracker crust…',
      said: '「普通だった」と言い、すぐにバターの生地、濃いのに軽いクリームと、うっとり語りだす。',
      mean: '「普通」は彼を止めるための言葉。細かく語るほど、自分も忘れられないと分かる。',
      trap: 'fine を額面どおり「いまいち」と取りやすい。rich もほめ言葉。控えめな一言のあとの細かい描写が本音。',
      use: 'It was okay. Best pizza of my life.（まあまあだった。人生最高のピザ）' },

    // why: knows the answer ← "you know what?" read as a real question (literal reading); agree ← the phrase heard
    //   as "you know, you're right", a Japanese そうだね frame
    { id: 'm1', skill: 'marker', level: 'B2', point: 'youknow', seg: [107.2, 116.8],
      stem: 'Right after Chandler’s mouth-watering remark, what does Rachel’s first phrase signal?',
      choices: ['She’s about to change the plan', 'She’s asking if he knows the answer',
                'She’s about to agree with his point'], a: 0,
      cue: '文頭の短い3語のあと、何が来るか。',
      line: '*You know what? Forget it.* We are just hungry.',
      said: '「もういい。お腹がすいてるだけ。お昼に出て忘れよう」と言う。',
      mean: 'You know what? は答えを求めない前置きで、「こうしよう」と話を切りかえる合図。',
      trap: '疑問文の形でも、知っているかは聞いていない。直後に命令や提案が来たら切りかえの合図。',
      use: 'You know what? Let’s just order pizza.（もういいや、ピザ頼もう）' },

    // why: dropped ← "drop it" runs together ("droppit") and sounds like a past -ed; drop ← the weak 'll after "we"
    //   lost
    { id: 's2', skill: 'sound', level: 'B2', point: 'dropoff', reveals: ['braverman'], seg: [116.5, 120.0],
      stem: 'Fill the gap: “Yeah, ___ downstairs so that we’re not tempted.”',
      choices: ['we’ll drop it off', 'we dropped it off', 'we drop it off'], a: 0,
      cue: 'Yeah のあと、主語にくっついた短い音。',
      line: 'Yeah, *we’ll drop it off* downstairs so that we’re not tempted.',
      said: '「うん、食べたくならないよう下に届けておこう」。',
      mean: 'we’ll の ’ll はごく弱い。drop it off はつながり「ドラピロフ」に近い。',
      trap: 'droppit を過去の -ed と聞きやすい。so that we’re not は先の話。',
      use: 'I’ll drop it off on my way home.（帰りに届けておくね）' },

    // R fix: V2 (blind 65 %): "the restaurant they always go to" was a filler; now "Mama's" heard literally
    // why: mom's house ← "Mama's" heard literally, with a far-off city; steakhouse ← "Chicago, Illinois" caught
    //   without the bakery's name
    { id: 'h4', skill: 'humor', level: 'C1', point: 'chicago', reveals: ['bakery'], seg: [119.0, 124.0],
      stem: 'Why does the audience laugh at where Chandler wants to have lunch?',
      choices: [`He picks the bakery the cake came from`, 'He picks his mom’s house for a home-cooked meal',
                'He picks a famous Chicago steakhouse'], a: 0,
      cue: '店の名前と、そのあとの地名。前にも出た名前。',
      line: 'Where do you want to go to lunch? — *Mama’s Little Bakery*, Chicago, Illinois.',
      said: '「お昼どこ行く？」に、あのケーキの店の名前とシカゴの住所で答える。',
      mean: '忘れるための外食なのに、行き先はあのケーキの店。しかも遠いシカゴ。',
      trap: '地名だけ聞くとシカゴの有名店に聞こえる。前に出た名前が戻ってきたらオチの合図。',
      use: 'Where to? Anywhere but here.（どこ行く？ここ以外ならどこでも）' },

    // R fix: K6: the key was the only two-part choice; the treat distractor is two-part too
    // why: a treat ← "Thank you for lunch" taken at face value; free meal ← "we just don't pay for food anymore"
    //   read literally, as being given food
    { id: 'i3', skill: 'infer', level: 'B2', point: 'pay', seg: [126.8, 134.8],
      stem: 'What has happened with the bill at lunch?',
      choices: ['Each thought the other paid, so no one did', 'One of them paid, so the other said thanks',
                'The restaurant gave them their meal for free'], a: 0,
      cue: 'お礼のあと、Wait a minute で何に気づいたか。',
      line: 'Wait a minute, *I didn’t pay*. *I thought you paid*.',
      said: '「お昼ありがとう」「待って、払ってない。そっちが払ったと思ってた」。',
      mean: 'お互い相手が払ったと思い、誰も払わずに店を出た。',
      trap: 'Thank you for lunch はおごられた前提のお礼。次の I didn’t pay で前提がくずれる。',
      use: 'Wait, did anyone pay for this?（待って、これ誰か払った？）' },

    // R fix: V2 (blind 50 %, the title "Bandits" points at the key): each distractor now carries a reason heard in
    //   the scene. Still title-leaning: open
    // why: leave it ← "Mrs. Braverman must be out" heard as "back soon"; knock ← "I just heard her moving around"
    //   heard as a reason to give it back now
    { id: 'g3', skill: 'gist', level: 'B2', point: 'hallway', reveals: ['protect', 'heard'], seg: [136.7, 163.0],
      stem: 'In the hallway, what do they decide about the cake?',
      choices: ['To take it, and quickly, before she sees', 'To leave it, since she’ll be back soon',
                'To knock, since she seems to be home'], a: 0,
      cue: '最後の should の文と、そのあとの短い掛け声。',
      line: 'Well, we should *take it*. — Yeah, but we should *move quick*.',
      said: '「留守かも」「腐ったら体に悪い」と理由を並べ、「持っていこう。急いで」と決める。',
      mean: '言い訳を重ねて、結局また持ち去る。go, go, go は「早く早く」。',
      trap: '「中で音がした」は返す理由ではなく急ぐ理由。結論は最後の we should の文。',
      use: 'We should move quick before it rains.（雨が降る前に急ごう）' },

    // R fix: V2 (blind 75 %): "only joking" was refuted by the title; now the irony aimed at the wrong target
    // why: honestly worried ← the reasons taken at face value (sincerity flip); making fun of her ← the escalation
    //   heard as mockery of Mrs. Braverman (right mechanism, wrong target), but every step serves "take it"
    // anchor: 149–159 s the worry grows from “gone bad” to "could kill her" to "we're protecting her", and every
    //   step ends in "we should take it" and "move quick"
    { id: 'nt3', skill: 'infer', level: 'C2', point: 'protect', seg: [146.8, 159.0],
      stem: 'Which plain-English version keeps what they mean about protecting her?',
      choices: ['“We want the cake, and we’re calling it a favor.”',
                '“We’re honestly worried it will spoil before she’s back.”',
                '“We’re making fun of her for being gone so long.”'], a: 0,
      cue: '心配の理由がどこまで大きくなり、何で終わるか。',
      line: 'We don’t want her to come back to bad cheesecake. — No, *that could kill her*. … So *we’re protecting her*.',
      said: '「留守が長いかも」「腐ったケーキを食べたら」「死んじゃうかも」「だから守ってあげるんだ」と言い合う。',
      mean: '心配は口実。理由をわざと大きくして、取りたいケーキを「親切」に言いかえている。',
      trap: '理由を一つずつ聞くと本当の心配に聞こえる。理由が大げさになっていったら、結論から聞く。',
      use: 'I’m eating this for your own good.（君のために食べてあげるんだよ）' },

    // why: someone on the stairs ← "heard" caught without "in there"; go bad ← the spoiling talk just before
    { id: 'd2', skill: 'detail', level: 'B1', point: 'heard', seg: [157.6, 163.5],
      stem: 'Why do they need to move quickly?',
      choices: ['One thinks the owner is home after all', 'One hears someone coming up the stairs',
                'The cake may go bad if they wait'], a: 0,
      cue: 'Why? と聞かれたすぐあとの答え。',
      line: 'Because I think I *just heard her moving around in there*.',
      said: '「なんで？」「中で彼女が動いてる音がした気がする」。',
      mean: '留守だと思っていた持ち主が、実は家にいるかもしれない。だから見つかる前に急ぐ。',
      trap: 'heard だけで「誰かが来る」と取りやすい。in there（その中で）で、部屋の中だと分かる。',
      use: 'I think I just heard the doorbell.（今、玄関のベルが鳴った気がする）' },

    // why: call the others ← whistling as a way to call people over, and Monica and Joey come up next; a signal ←
    //   the lookout script from the hallway grab just before
    { id: 'h5', skill: 'humor', level: 'C1', point: 'whistle', reveals: ['hundred'], seg: [168.8, 178.2],
      stem: 'Why does Chandler offer her money for a whistle?',
      choices: ['Her mouth is full, so she couldn’t do it', 'He wants her to call the others over',
                'He wants a signal if someone is coming'], a: 0,
      cue: '返事が言葉ではなく、口を閉じた音だったこと。',
      line: 'Are you eating the cheesecake without me? … I will give you a hundred dollars to *whistle right now*.',
      said: '「僕抜きで食べてる？」に口を閉じて返事。そこで「今口笛を吹けたら100ドル」。',
      mean: '口いっぱいにケーキがあれば口笛は吹けない。否定してもバレる、という意地悪な証明。',
      trap: '口笛を合図や呼び出しと取りやすい。right now は今の口の中を確かめる。',
      use: 'Prove it. Say something right now.（じゃあ証明して。今何か言って）' },

    // why: $200 ← "give you a" runs together and the a can pass for "two"; $1,000 ← hundred/thousand
    { id: 'n2', skill: 'number', level: 'B1', point: 'hundred', seg: [174.0, 178.2],
      stem: 'How much does Chandler offer her to whistle?',
      choices: ['$100', '$200', '$1,000'], a: 0, keep: true,
      cue: 'give you のあと、dollars の前。',
      line: 'I will give you *a hundred dollars* to whistle',
      said: '「今口笛を吹けたら100ドルあげる」と持ちかける。',
      mean: 'a hundred ＝ 100。give you a はつながり、a はごく短い。',
      trap: 'a を two と聞くと 200 になる。thousand なら「サウザン」と長い音が続く。',
      use: 'Ten bucks if you do the dishes.（皿洗いしたら10ドルあげる）' },

    // R fix: V2 (blind 65 %): both distractors were off the line's words; now "have to tell them" read as advice,
    //   and a near miss (petty, not self-incriminating) that "what we did" settles
    // why: own up ← "you're gonna have to tell them" heard as "you should tell them"; petty ← the right direction
    //   (he won't tell) for a reason "what we did" refutes
    { id: 'i2', skill: 'infer', level: 'C1', point: 'tell', seg: [183.5, 193.3],
      stem: 'When Rachel asks if he’ll tell Monica and Joey, what is her point?',
      choices: ['He can’t tell on her without telling on himself', 'She thinks he should own up to what they did',
                'Telling on her would just make him look petty'], a: 0,
      cue: '自分で出した質問に、自分で No と答えた理由。',
      line: 'You’re gonna go run tell Monica? … *No, because then you’re gonna have to tell them what we did.*',
      said: '「モニカに言いつける？」と聞き、自分で「無理よ、私たちのしたことも話すことになる」と答える。',
      mean: '告げ口すれば二人で盗んだことも明かすことになる、と見抜いている。',
      trap: 'have to を「〜すべき」と取りやすい。ここは「〜する羽目になる」。',
      use: 'Go ahead, tell them. I dare you.（言えば？言えるもんならね）' },

    // anchor: 187.4–188.4 s both sources: "you're gonna have to", four weak words in about a second, right after "No,
    //   because then"
    { id: 'nt2', skill: 'dict', level: 'C2', point: 'tell', seg: [186.9, 193.3],
      stem: 'Type the middle: “No, because then ___ tell them what we did.” (4 words)',
      answer: "you're gonna have to",
      cue: 'No, because then のあと、tell の前の4語。',
      line: 'No, because then *you’re gonna have to* tell them what we did.',
      said: '「無理よ、そしたら私たちのしたことを話す羽目になる」。4語が弱くつながり、ほぼ一息。',
      mean: 'you’re gonna have to ＝ 〜する羽目になる。告げ口する側が、自分の罪も話すことになる。',
      trap: '文法に合わせて you’ll と書きたくなる。聞こえた形で書く。',
      use: 'If you’re late, you’re gonna have to wait.（遅れたら待つことになるよ）' },

    // why: return it ← "taking it back" read as giving it back to Mrs. Braverman; her share ← "you've already had
    //   some" comes a few lines later
    { id: 'd3', skill: 'detail', level: 'B1', point: 'trust', seg: [193.2, 199.0],
      stem: 'What reason does Chandler give first for taking the cake back?',
      choices: ['He doesn’t trust her with it anymore', 'He wants to return it to its owner',
                'She has already had more than her share'], a: 0,
      cue: 'You know what のあと、最初の理由。',
      line: 'I *don’t trust you with this cake* anymore. And I got it first',
      said: '「もう君にこのケーキは任せられない。先に取ったのは僕だ」。',
      mean: 'trust you with ＝ 〜を安心して預ける。take it back は「取り返す」。',
      trap: 'take back を「返却」と取ると、持ち主に返す話になる。誰の手に戻るかを聞く。',
      use: 'I trust you with my keys.（君になら鍵を預けられる）' },

    // R fix: V2 (blind 50 %): the split was the only compromise; now each distractor is one side's claim
    // why: he keeps it ← "I got it first, and I'm taking it back!" sounds final; she keeps it ← "you've already had
    //   some" heard the wrong way round
    { id: 'g4', skill: 'gist', level: 'B1', point: 'split', reveals: ['cave'], seg: [193.2, 216.5],
      stem: 'How do they settle the fight over the second cheesecake?',
      choices: ['They agree to split it, half each', 'He keeps it, since he got it first', 'She keeps it, since he’s had some'],
      a: 0,
      cue: '取り返す宣言のあと、Rachel が出す別の案。',
      line: 'No, we’re gonna *split it*. You take half and I take half.',
      said: '「半分ずつにしよう」に渋るが、モニカの名前を出されて折れる。',
      mean: 'split it ＝ 分け合う。独り占めの争いが、山分けで決着する。',
      trap: 'got it first も already had some も言い分にすぎない。決着は最後の同意で聞く。',
      use: 'Let’s split the bill.（割り勘にしよう）' },

    // why: nothing to cut with ← the question taken literally, as a real problem; buying time ← a question heard as
    //   stalling in an argument (no comeback follows: they split it)
    { id: 'pr2', skill: 'pragma', level: 'C1', point: 'cave', reveals: ['split'], seg: [206.3, 216.0],
      stem: 'Right after Rachel’s remark about Monica, what does Chandler’s question do?',
      choices: ['It accepts the split so she won’t tell', 'It points out they have nothing to cut with',
                'It buys time while he thinks of a comeback'], a: 0,
      cue: '脅しの直後、彼の質問の中身と、そのあとの流れ。',
      line: 'Monica would be very interested to know that you called her cheesecake *dry and mealy*. — *What do we use to split it?*',
      said: '「モニカのケーキをパサパサって言ってたこと、話そうかな」に、すぐ「何で切る？」。',
      mean: '反論せず切り方の話に移り、「半分ずつでいい」と降参している。',
      trap: '質問の形でも、本当に道具を聞いているのではない。脅しの直後の話題転換は、受け入れの合図。',
      use: 'Fine. Where do I sign?（分かったよ。どこにサインすれば？）' },

    // why: amused ← "Oh" and a sitcom laugh heard as fond teasing; worried ← cutting and measuring heard as a risk
    //   to the cake
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'sake', seg: [229.4, 234.9],
      stem: 'When measuring the cake is suggested, how does the reply sound?',
      choices: ['Fed up with the endless choosing', 'Amused by the careful measuring', 'Worried the cake will get ruined'],
      a: 0,
      cue: 'Oh のあとの短い決まり文句と、命令の形。',
      line: 'Maybe if I measure… — *Oh, for God’s sake*, just pick a piece!',
      said: '「測ってみようか」に「もう、いいから早く選んで！」と返す。',
      mean: 'for God’s sake ＝ いいかげんにして。いらだちの決まり文句。',
      trap: 'God が入っても祈りや心配ではない。just ＋命令は「さっさと」。',
      use: 'Oh, for heaven’s sake, just ask her!（もう、さっさと聞いてみなよ！）' },

    // R fix: S3/cue leak: the cue said "to me", a word only the key has; it now points at "crying"
    // why: get upset ← "crying" taken literally and tied to "too fast"; tell the others ← telling Monica and Joey
    //   came up a minute ago
    { id: 'ph2', skill: 'phrase', level: 'B2', point: 'crying', seg: [241.0, 250.2],
      stem: 'What does the last of the three rules mean?',
      choices: ['Don’t ask me for more later', 'Don’t eat so fast you get upset', 'Don’t tell the others about this'],
      a: 0,
      cue: 'crying のあと、if で始まる条件。',
      line: 'No sharing, no switching, and *don’t come crying to me* if you eat your piece too fast.',
      said: '「分け合いなし、交換なし、早く食べても泣きついてくるなよ」と念を押す。',
      mean: 'come crying to me ＝ 泣きついてくる。食べ終えても、こっちのを欲しがるな。',
      trap: 'crying を本当に泣くと取ると、気持ちの話になる。',
      use: 'Don’t come crying to me when it breaks.（壊れても泣きついてこないでね）' },
  ]
};
