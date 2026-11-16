// “I am not to be ******** with - The Office US” (the official The Office channel, BEST OF SEASON 5 - The Office US):
// Michael brings Pam and Ryan back as salespeople with the clients his paper company took; the old salespeople want
// those clients back, threaten to quit, and get an apology that Michael withdraws once he hands the clients over.
// Segments from the captions, words from whisper (2026-11-16). Dwight is named by address (35.7 s, 190.4 s); the other
// salespeople aren't, so they are "the salespeople".
// Untested on purpose: 6–9 s (captions "deserves to know", whisper "Yes, yes"), 59–65 s (the "love triangle" aside),
// 65–83 s and 101–119 s (short overlapping lines, "youtube him" / "You too, Pam"), 124–134 s (the "truffled" talking
// head: the title hides the word, so it stays out), 134–166 s (the phone scramble talks over itself; "ten years" vs
// "tennis" at 144.8 s), 175–182 s ("your secretary", "in your attempt"), 203–208 s (the company's name list), 269–274 s
// ("Hold that thought" / "all that thought"), 343–369 s (whisper loops one line).
// No ear checks: every key rests on words both sources agree on, and no item depends on an unnamed speaker.
// REVIEW 2026-11-16: pass 8, fix 16, drop 0, new 0; ear checks 0
import type { Clip } from '../types.ts';

export const truffled: Clip = {
  id: 'truffled', video: 'TOB2vzPfxNA', title: 'I am not to be ******** with - The Office US', dur: 369, wpm: 190,
  band: 'fast', tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 75 %: the only choice about clients in a clip about clients). All three are about the clients now.
    // why: paid extra ← "bringing over a ton of clients" heard as a bonus question; follow them ← "How is that going
    //   to work?" heard as doubt that the clients will come along
    { id: 'g1', skill: 'gist', level: 'B2', point: 'dispute', reveals: ['lost'], seg: [0, 50.3],
      stem: 'What is the first argument in the office mainly about?',
      choices: ['Whether the clients Pam and Ryan bring are really the old staff’s',
                'Whether Pam and Ryan should be paid extra for their clients',
                'Whether the clients will really follow Pam and Ryan back'], a: 0,
      cue: '「How is that going to work?」のあとの言い合い。',
      said: '二人が顧客を連れて加わると聞き、営業たちは「うちから盗んだ顧客だ」と言い返す。',
      mean: 'もめているのは顧客の持ち主。お金の話は出ない。',
      trap: '「どうなるの？」を心配と取りやすい。stole from us で持ち主の争いと分かる。',
      use: 'So how is that going to work?（で、それってどうなるの？）' },

    // why: are we ← n't is lost before "we"; giving ← "getting" and "giving" differ in one weak vowel and a flap
    { id: 's1', skill: 'sound', level: 'B2', point: 'getback', seg: [23.5, 28.6],
      stem: 'Fill the gap: “Yeah, ___ those clients back?”',
      choices: ['aren’t we getting', 'are we getting', 'aren’t we giving'], a: 0,
      cue: '「Yeah」のすぐあと、最初の語の終わり。',
      line: 'Yeah, *aren’t we getting* those clients back?',
      said: '「その顧客、うちに戻ってくるんじゃないの？」と聞く。',
      mean: 'aren’t we ～? は当然を確かめる形。t はほぼ消え「アーンウィ」。',
      trap: 'n’t が聞こえないと、ただの質問 are we に聞こえる。「ン」の鼻音が残るかを聞く。',
      use: 'Aren’t we supposed to check in first?（先にチェックインするんじゃないの？）' },

    // R fix: V2 (blind 80 %: the only "no" with a reason from the scene). Two near "no"s and a "not yet" now; f1's
    //   stem no longer quotes this answer.
    // why: never theirs ← "the clients you stole" heard as Michael's side; not yet ← the buyout talk (just after)
    //   heard as a decision still pending
    { id: 'd2', skill: 'detail', level: 'B1', point: 'lost', reveals: ['getback'], seg: [25.0, 28.6],
      stem: 'When the salespeople ask for the clients back, what is the answer?',
      choices: ['No; they lost those clients', 'No; they were never theirs',
                'Not yet; corporate must decide'], a: 0,
      cue: '質問のすぐあと、最初の一語と動詞。',
      line: 'No, you *lost* those clients.',
      said: '「いや、君たちはその顧客を失ったんだ」と答える。',
      mean: '戻す気はまったくない。取られた側の負け、という言い方。',
      trap: 'lost は「持っていたのに失った」。元は彼らの顧客と認めている。会社の話は次の人の言い分。',
      use: 'Sorry, that ship has sailed.（ごめん、もう手遅れだよ）' },

    // R fix: V2 (blind 50 %: phone / disgusting were absurd here) + S1 (the stem quoted d2's answer). Near readings
    //   of call and foul now; the cue no longer says "sports", which pointed at the key.
    // why: a vote ← call read as "call for (a vote)"; a bad mistake ← foul read as foul-up / ひどい
    { id: 'f1', skill: 'phrase', level: 'C1', point: 'foul', seg: [26.3, 30.55],
      stem: 'Right after Michael says no, what does the short protest mean?',
      choices: ['That isn’t fair play', 'I want a vote on that', 'That was a bad mistake'], a: 0,
      cue: '「sir」の前の三語。決まった言い方。',
      line: 'I *call foul*, sir.',
      said: '「それは反則です」と抗議する。',
      mean: 'call foul ＝ 審判が反則を宣言する言い方。「ずるい、不公平だ」と言っている。',
      trap: 'call を「求める」、foul を「ひどい失敗」と取りやすい。スポーツの決まり文句として聞く。',
      use: 'Wait, I call foul on that.（ちょっと、それは反則だよ）' },

    // R fix: V2 (blind 60 %) + S3 (the cue named "bought out", a word only the key had). New distractors are
    //   arguments Dwight could have made; the cue now points at the repeated verb without naming it.
    // why: his first ← the salespeople's "the clients you stole from us"; Pam and Ryan work for it ← "the company"
    //   heard with the wrong people as its object
    { id: 'i2', skill: 'infer', level: 'B2', point: 'boughtout', seg: [30.1, 37.6],
      stem: 'What is Dwight’s argument for getting the clients back?',
      choices: ['The company bought Michael out, so it owns the clients too',
                'The clients were his first, so they should go back to him',
                'Pam and Ryan work for the company now, so their clients do too'], a: 0,
      cue: '「so」の前と後に、同じ動詞が二回。',
      line: 'You were *bought out*, so the company then bought out all of the stolen clients.',
      said: '「あなたの会社は買収された。だから盗まれた顧客ごと会社のものになった」と言う。',
      mean: 'buy out ＝ 会社ごと買い取る。顧客も本社のものだから戻るはず、という理屈。',
      trap: '「元は自分の顧客」と言いそうだが、理屈は買収。買われたのは you の会社。',
      use: 'The company was bought out last year.（その会社は去年買収された）' },

    // R fix: V2 (blind 70 %). "Joking to ease the tension" (the Japanese softener frame) replaces "pointing them to
    //   the proper place", which read as a filler.
    // why: easing the tension ← the trash-can punchline heard as a friendly joke; upstairs ← an office "department"
    //   heard as corporate
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'trash', seg: [35.5, 50.3],
      stem: 'What is Michael doing with his line about the complaint department?',
      choices: ['Making it clear their objections will be ignored',
                'Joking to ease the tension before he hears them out',
                'Promising to pass their objections upstairs'], a: 0,
      cue: '「department」のあと、その正体を言う一文。',
      line: 'you can talk to our *complaint department*. *It’s a trash can.*',
      said: '「文句があれば苦情係へどうぞ。ゴミ箱だけど」と言う。',
      mean: '苦情はゴミ箱行き、つまり聞く気はない。直前の「ルールは私が決める」と同じ態度。',
      trap: '冗談の形なので場を和ませる一言に取りやすい。直前の follow them blindly が本気を示す。',
      use: 'Feel free to complain. I won’t listen.（文句はどうぞ。聞かないけど）' },

    // why: days ← "six" heard, the unit lost; sixteen ← six weeks ≈ "sixteen" when weeks is weak; months ← a long time
    //   "through a lot" sounds like
    { id: 'n1', skill: 'number', level: 'B1', point: 'weeks', seg: [50.5, 55.7], keep: true,
      stem: 'How long have Pam, Ryan and the speaker been through a lot together?',
      choices: ['Six days', 'Six weeks', 'Sixteen weeks', 'Six months'], a: 1,
      cue: '「in the last」のあと、数と単位。',
      line: 'Pam and Ryan and I have been through a lot in the last *six weeks*.',
      said: '「この6週間、三人でいろいろ乗り越えてきた」と言う。',
      mean: 'go through a lot ＝ 苦労を共にする。短い間に強い仲間意識ができた、という話。',
      trap: 'six と weeks がつながる。-teen の長い「ティーン」は聞こえない。',
      use: 'We’ve been through a lot together.（いろいろ一緒に乗り越えてきた）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'coolit', seg: [86.5, 89.9],
      stem: 'Type the advice: “I think ___ cool it with that.” (4 words)', answer: "you're gonna want to",
      cue: '「I think」のあと、一続きに聞こえる部分。',
      line: 'I think *you’re gonna want to* cool it with that',
      said: '「それ、控えたほうがいいよ」と言う。4語が一続きで「ヨガナワナ」。',
      mean: '「～したほうがいい」というやわらかい忠告。未来の予想ではない。',
      trap: 'going to と want to を全部待つと聞き逃す。どちらも短く弱い。',
      use: 'You’re gonna want to bring a jacket.（上着を持って行ったほうがいいよ）' },

    // anchor: 95.3 s "This is awkward to talk about" before the hedge, and 98.1 s "but definitely is… right now":
    //   the hedge is taken back in the same breath, so it can't be doubt
    // why: real doubt ← "may or may not be" read as かもしれない; only teasing ← the self-cancelling sentence read as
    //   a joke with nothing behind it
    { id: 'c1', skill: 'infer', level: 'C2', point: 'mutiny', seg: [94.95, 101.2],
      stem: 'Which plain-English version keeps what the warning about the warehouse means?',
      choices: ['“There is a revolt, and I hate being the one to say it.”',
                '“There may be a revolt, but nobody knows for sure yet.”',
                '“There is no real revolt; I am only teasing you.”'], a: 0,
      cue: '前置きの一言と、「but」のあとの一語。',
      line: 'This is *awkward to talk about*, but there may or may not be, but *definitely is* a mutiny forming…',
      said: '「言いにくいけど、反乱が起きてるかもしれないし、ないかも、いや確実に起きてる」と言う。',
      mean: 'ぼかしをすぐ自分で取り消している。迷いではなく言いにくさで、悪い知らせの前置き。',
      trap: 'may or may not を本当の迷いと取りやすい。ぼかしのあとに but と強い語が来たら、そちらが本音。',
      use: 'I hate to say it, but we’re lost.（言いたくないけど、道に迷った）' },

    // why: twelve ← "ten" plus the "y" of "years" heard as a longer number; twenty ← -teen/-ty confusion of the
    //   same digit; two ← the weak "for" swallows part of "ten"
    { id: 'n2', skill: 'number', level: 'B1', point: 'ten', seg: [167.2, 171.3], keep: true,
      stem: 'How long does the angry salesman say the lost client was his?',
      choices: ['Two years', 'Ten years', 'Twelve years', 'Twenty years'], a: 1,
      cue: '「my client for」のあと。',
      line: 'He was my client for *ten years*.',
      said: '「あの人は10年もおれの顧客だったんだ」と怒る。',
      mean: '長年の大事な顧客を失った、という怒り。数字が重さを伝えている。',
      trap: 'for が弱く ten とつながると、短い数に聞こえやすい。ten の n は次の years とつながる。',
      use: 'I’ve been coming here for ten years.（ここには10年通ってる）' },

    // R fix: V2 (blind 70 %). Both distractors are now client-centred, so the theme no longer points at the key.
    // why: apologizes ← the apology the scene turns to next; on their own ← "We'll start our own paper company"
    //   right after, and "want our clients back" without "or we quit"
    { id: 'd5', skill: 'detail', level: 'B1', point: 'quit', seg: [190.8, 199.0],
      stem: 'What do the salespeople tell Michael they will do?',
      choices: ['Quit unless they get their clients back', 'Quit unless Michael apologizes to them',
                'Win their clients back on their own'], a: 0,
      cue: '「or」のあとの短い動詞と、続く返事の数。',
      line: 'We want our clients back *or we quit*, Michael.',
      said: '「顧客を返さないなら辞める」と言い、次々に「おれも」「私も」と続く。',
      mean: 'A or B ＝「Aしないと Bする」という最後通告の形。',
      trap: 'or のあとが弱く短いので、前半だけで「頼み」に聞こえやすい。or のあとに条件の重さが来る。',
      use: 'Fix it or I’m leaving.（直さないなら帰るよ）' },

    // anchor: 224.4 s "But if you stay, I want an apology, and I want a big one": the praise and money only work as a
    //   dare; he plans for them to stay
    // R fix: V2 (blind 50 %). "Making peace, hoping they will stay" (right goal, wrong move) replaces "glad to be rid
    //   of them", which the apology demand rules out at a glance.
    // why: cheering ← "I love this idea, and I fully support you" taken at face value; making peace ← the money and
    //   "no hard feelings" heard as a peace offering
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'bluff', seg: [215.4, 228.15],
      stem: 'When Michael backs their plan and hands out money, what is he doing?',
      choices: ['Calling their bluff, sure that they will stay',
                'Cheering them on, sure that they will succeed',
                'Making peace, hoping that they will stay'], a: 0,
      cue: 'お金を配ったあと、「But」で始まる一文。',
      line: '*But if you stay*, I want an apology, and I want a big one.',
      said: 'お金を一人ずつ渡し、「でも残るなら、謝ってもらう。大きなのをね」と言う。',
      mean: '応援のふりで、辞められないと見ている。残ったときの条件まで出している。',
      trap: 'no hard feelings を仲直りと取りやすい。but のあとで謝罪を求めるので挑発。',
      use: 'Go ahead, I dare you.（やれるものならやってみな）' },

    // R fix: V2 (blind 55 %: "makes up an opposite word" named the joke). Three readings of the same short reply now.
    // why: a dig at him ← backward = 遅れている, heard as an insult he pushes back on; his plan ← a confident one-word
    //   reply heard as "that was the point"
    { id: 'h1', skill: 'humor', level: 'C1', point: 'frontwards', seg: [228.0, 233.35],
      stem: 'Why does Michael’s reply to “completely backwards” get a laugh?',
      choices: ['He just flips their word around, as if that were a reason',
                'He hears “backwards” as calling him slow, and objects',
                'He admits the point but says it was his plan all along'], a: 0,
      cue: '「backwards」の直後、彼の短い一言。',
      line: 'That’s completely backwards. — *It’s frontwards.*',
      said: '「謝れなんて逆でしょ」に、「いや、正方向だ」と返す。',
      mean: 'frontwards は普通使わない語。反対語を作って言い返すだけで、理由ではない。',
      trap: '「遅れた」の意味や認めた返事と取りやすい。back を front に変えただけ。',
      use: 'You’ve got it backwards.（それ、逆だよ）' },

    // R fix: V2 (blind 50 %: "add to their complaint" ruled out any non-blaming reading). The stem is neutral now, and
    //   "family forgives" (the Japanese frame) replaces "care like a parent".
    // why: forgiven ← family = 身内は許し合う; protect them ← "attacking corporate" heard as the real problem
    { id: 'i3', skill: 'infer', level: 'B2', point: 'family', seg: [233.3, 244.5],
      stem: 'What point does the line about being “a family” make?',
      choices: ['He turned on the people he called his own', 'He should be forgiven, the way family forgives',
                'He should have kept corporate from hurting them'], a: 0,
      cue: '「family」のあと、「Then」で始まる一文。',
      line: 'you always said *we were a family*. *Then you went after us.*',
      said: '「いつも家族だと言ってたのに、その僕らを攻撃した」と言う。',
      mean: '家族と言っておきながら裏切った、という指摘。だから謝るべきはそっち、と続く。',
      trap: 'family から「身内なら許す」と取りやすい。言いたいのは Then のあとの「裏切り」。',
      use: 'I thought we were friends.（友だちだと思ってたのに）' },

    // R fix: S4: the seg ended 0.3 s after "wrong" (and began 0.2 s before "No"); now 246.0–249.8 s.
    // why: both to blame ← "from my point of view, from their point of view" heard as weighing both sides; they're
    //   wrong ← "the wrong" heard without "I am in"
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'wrong', seg: [246.0, 249.8],
      stem: 'In his comment to the camera, how does Michael see the fight now?',
      choices: ['He is the one in the wrong', 'Both sides share the blame', 'The salespeople are in the wrong'], a: 0,
      cue: '「No matter how」のあと、文の最後。',
      line: 'No matter how I look at this, *I am in the wrong*.',
      said: '「どう考えても、悪いのは自分だ」とカメラに言う。',
      mean: 'in the wrong ＝ 非がある側にいる。ここで初めて自分の非を認めている。',
      trap: 'the wrong だけ聞くと相手の話にも聞こえる。主語の I を聞き取る。',
      use: 'I was in the wrong. I’m sorry.（悪いのは私でした。ごめんなさい）' },

    // why: only two ← he names just two views out loud; loses count ← "like" heard as a guess
    { id: 'h2', skill: 'humor', level: 'C1', point: 'hundred', reveals: ['wrong'], seg: [250.2, 265.2],
      stem: 'Why is his count of the ways he looked at it funny?',
      choices: ['He treats “a hundred” as an exact number', 'He admits he really looked at it only two ways',
                'He keeps losing count of the ways partway'], a: 0,
      cue: '二つの見方のあと、残りをいくつと言うか。',
      line: 'like, *a hundred* different ways. From my point of view, from their point of view… *98 others*',
      said: '「100通りは考えた。自分の視点、相手の視点、ほか98通り」と言う。',
      mean: 'like a hundred は大げさな「たくさん」。それを2＋98と本当に数えるのがおかしい。',
      trap: '二つしか挙げていないと取りやすいが、残りを98と言って100にそろえている。',
      use: 'I’ve told you, like, a hundred times.（もう百回は言ったよ）' },

    // R fix: V2 + S1 (blind 55 %: "before his last conclusion" in the stem said "summing-up"). The stem names the moment
    //   by "98 others"; "an aside before he goes on counting" replaces the literal "limit".
    // why: a new point ← a two-word phrase before a clause heard as "also"; an aside ← he is mid-count, so the phrase
    //   sounds like a pause in the list
    { id: 'm1', skill: 'marker', level: 'B2', point: 'bottomline', reveals: ['wrong'], seg: [259.5, 265.4],
      stem: 'What does the two-word phrase after “98 others” signal?',
      choices: ['A summing-up after all the views', 'A new point he has not made yet',
                'An aside before he goes on counting'], a: 0,
      cue: '「98 others」のあと、言い切る直前の二語。',
      line: '98 others, and… *bottom line*, I’m in the wrong.',
      said: '「ほかに98通り。要するに、悪いのは自分」と言う。',
      mean: 'bottom line ＝ 結局のところ。いろいろ言ったあと、結論を言う合図。',
      trap: '数えている途中なので、ひと休みや追加の話と取りやすい。会計の最終行から来た「結論」の合図。',
      use: 'Bottom line, we need more time.（要するに、もっと時間が要る）' },

    // R fix: V2 (blind 75 %: the title and c2's stem gave away "returns the clients", and only one choice had a
    //   twist). "They turn down his apology" (right outcome, wrong side) is the near miss now. Also N6: the old trap
    //   held a broken character (U+FFFD).
    // why: they turn it down ← "That's fair. That's all right." heard as a refusal; keeps them ← he holds back at
    //   first ("there won't be enough clients")
    { id: 'g2', skill: 'gist', level: 'B2', point: 'outcome', seg: [269.0, 336.0],
      stem: 'How does the apology meeting end?',
      choices: ['He returns the clients but takes back his apology',
                'He returns the clients, and they turn down his apology',
                'He keeps the clients, but they accept his apology'], a: 0,
      cue: '「Fine」のあと、「However」で始まる一言。',
      said: '謝罪を受け入れてほしい彼に、相手は顧客のことだけ聞く。結局顧客を返し、謝罪は取り消す。',
      mean: 'rescind ＝ 取り消す。望んだ形の仲直りにはならなかった。',
      trap: 'That’s fair を断りと取りやすいが、取り消したのは彼。相手は流している。',
      use: 'I take that back.（今のは取り消す）' },

    // R fix: V2 (blind 55 %). The choices are now one yes/no frame each way: the key agrees with the excuse, the
    //   distractors turn it into praise or into doubt.
    // why: looks fine anyway ← "Looks…" heard as the start of praise; someone helped ← "it" heard as "like you had
    //   help", the opposite direction
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'looksit', seg: [277.4, 280.75],
      stem: 'After the excuse about having no help, what does the two-word reply mean?',
      choices: ['Yes, and the fort shows it', 'Yes, but it looks fine anyway',
                'No, it looks like someone helped'], a: 0,
      cue: '言い訳のすぐあと、短い二語。',
      line: 'I didn’t have any help. — *Looks it.*',
      said: '「急いで一人で作ったんだ」に、「そう見える」と短く返す。',
      mean: 'Looks it ＝ It looks like it. 「見れば分かる」と、出来の悪さを突く一言。',
      trap: 'looks をほめ言葉の出だしと取りやすい。it は直前の「手伝いなし」を指す。',
      use: 'You look tired. — I feel it.（疲れてるね。—実際疲れてる）' },

    // why: playing with ← "playing" taken literally (遊ぶ); best clients ← the scene is about clients, so "favorites"
    //   heard as favorite clients
    { id: 'f4', skill: 'phrase', level: 'B2', point: 'favorites', seg: [288.4, 292.9],
      stem: 'What does Michael apologize for at the meeting?',
      choices: ['Treating Pam and Ryan better than the rest', 'Spending work time playing around with Pam and Ryan',
                'Letting Pam and Ryan pick the best clients'], a: 0,
      cue: '「I’ve been」のあとの動詞と名詞。',
      line: 'I am sorry that I’ve been *playing favorites* with Pam and Ryan.',
      said: '「パムとライアンをひいきしてきたことを謝る」と言う。',
      mean: 'play favorites ＝ 特定の人をひいきする。仕事でも家庭でもよく使う。',
      trap: 'playing を「遊ぶ」と取りやすい。play favorites で一つの決まった言い方。',
      use: 'A good teacher doesn’t play favorites.（いい先生はひいきしない）' },

    // why: aren't you ← a complaint reading, with n't lost in fast speech; giving up ← "us" links to "our" and its s
    //   sounds like p is lost
    { id: 's2', skill: 'sound', level: 'B2', point: 'givingus', seg: [296.3, 299.4],
      stem: 'Fill the gap: “___ clients back?”',
      choices: ['Are you giving us our', 'Aren’t you giving us our', 'Are you giving up our'], a: 0,
      cue: '謝罪のすぐあと、文の真ん中の短い二語。',
      line: '*Are you giving us our* clients back?',
      said: '謝罪が終わるとすぐ「で、顧客は返してくれるの？」と聞く。',
      mean: 'us our がつながり「アサウア」。気持ちより顧客、という一言でもある。',
      trap: 'us の s が our につながり、別の語に聞こえやすい。動詞のあとの人称を聞く。',
      use: 'Are you giving us a discount?（割引してくれるの？）' },

    // R fix: V2 (blind 55 %). "Says no, but softens it with a gift" (the bark offer right after) replaces "asks them to
    //   accept that", which no reading of the line supports.
    // why: a yes ← "if… everyone would say" heard as a condition for returning them; a no with a gift ← "my gift to
    //   you" heard as a consolation prize. The seg now runs to 312.3 s, so the gift line is in it.
    { id: 'p3', skill: 'pragma', level: 'C1', point: 'dodge', seg: [297.5, 312.3],
      stem: 'When asked about the clients, what does Michael’s answer do?',
      choices: ['Steers away from it, back to the apology', 'Says yes, once everyone accepts the apology',
                'Says no, but softens it with a gift'], a: 0,
      cue: '質問のあと、「If we could just」から先。',
      line: 'If we could just focus… and everyone would say, “*Apology accepted*,” I think we would all feel better.',
      said: '質問には答えず、「順に『謝罪を受け入れます』と言えば気分が良くなる」と話す。',
      mean: '質問をかわして、自分の望む流れに戻している。yes も no も言っていない。',
      trap: 'if の文を交換条件と取りやすい。聞かれたことに答えているか、まず確かめる。',
      use: 'Let’s not get off track here.（話をそらさないでいこう）' },

    // R fix: V2 (blind 50 %). "Promised them the very best clients" (promise heard, wrong content) and "would quit"
    //   (the salespeople's threat moved onto Pam and Ryan) replace two distractors that read as fillers.
    // why: best clients ← "promised" and "clients" in one breath; would quit ← the quit threat earlier in the clip
    { id: 'd6', skill: 'detail', level: 'B1', point: 'notenough', seg: [319.0, 325.8],
      stem: 'Why doesn’t Michael want to give the clients back?',
      choices: ['Pam and Ryan would not have enough clients left', 'He promised Pam and Ryan the very best clients',
                'Pam and Ryan would quit if they lost those clients'], a: 0,
      cue: '「there won’t be」のあとと、「promised」の中身。',
      line: 'there *won’t be enough clients* for Pam and Ryan. And I *promised* both of them…',
      said: '「返したらパムとライアンの分が足りない。二人を営業にすると約束した」と言う。',
      mean: '返すと二人の分が足りず、営業にするという約束が守れない。',
      trap: 'promised と clients から「顧客を約束」と取りやすい。中身は「営業にする」こと。',
      use: 'I promised her I’d be there.（行くって彼女に約束したんだ）' },

    // anchor: 330.3 s "However, I rescind my apology" (taking it back out of spite) and 333.1 s "You are not reacting
    //   at all as I had hoped": he wanted his apology to matter to them, and it didn't
    // R fix: V2 (blind 65 %: the only hurt-feelings choice). All three are feelings now; the near miss is "upset
    //   for Pam and Ryan" (right feeling, wrong target). S1: the stem quoted "Have your clients", half of g2's key;
    //   it quotes only "Fine…" now. (Listing `outcome` in reveals instead broke the play-3 C2 draw. The line's
    //   "rescind" shows only after the answer, and a draw's gist always comes first.)
    // why: relieved ← "Fine. Have your clients" heard as relief; upset for Pam and Ryan ← his reason just before
    //   ("there won't be enough clients for Pam and Ryan")
    { id: 'c2', skill: 'attitude', level: 'C2', point: 'allalong', reveals: ['notenough'], seg: [325.6, 335.8],
      stem: 'When Michael answers “So?” with “Fine…”, what is he trying not to say?',
      choices: ['That he is hurt they only cared about the clients',
                'That he is upset Pam and Ryan will be left short',
                'That he is relieved the fight is finally over'], a: 0,
      cue: 'このあとの「However」の一言と、最後の文句。',
      line: 'I can see that’s *what you wanted all along*. … However, I *rescind my apology*.',
      said: '「最初から顧客が目当てだったんだね」と言い、すぐ「ただし謝罪は取り消す」と続け、反応が期待どおりでないとこぼす。',
      mean: '謝罪を取り消すのは傷ついた仕返し。気にかけてほしかったのは自分の気持ちのほう。',
      trap: 'Fine を「よかった」と取りやすい。すぐあとの取り消しと不満が、本当の気持ちを示す。',
      use: 'Fine. I see how it is.（いいよ。そういうことね）' },
  ]
};
