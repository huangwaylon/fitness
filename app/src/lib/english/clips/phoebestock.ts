// REVIEW 2026-11-16: pass 5, fix 15, drop 0, new 0; ear checks 2
// Open: p1 asks what "You realize what you are, don't you?" sets up; the answer is the insult at 15.4 s, which stays
//   outside the segment. Keep it, or drop it as too close to an insult line?
// “Phoebe the Stockbroker | Friends” (the official Friends channel, Best of Season 6): a friend reads out a list of
// errands and gets teased, then Phoebe learns she has lost millions on the market and talks herself into a heart attack.
// Segments from the captions, words from whisper (2026-11-16). Untested on purpose: whose list it is (backstory), 15.4–
// 16.5 s (the tease's punchline is an insult), 39.4 s (“Great” in whisper, “All right” in the captions), 47.7 s
// (whisper “Phoebe, are you…”, captions “baby, are you…”; stems name Phoebe from the title, and no key rests on it).
// EAR CHECK: 21.3 s s1 — “didn't just” is in both sources; the claim is that n't's t drops (“ディンジャス”)
// EAR CHECK: 32.4 s x1 a1 — both sources write “am I going to” twice; if it's said “am I gonna”, x1's answer changes
import type { Clip } from '../types.ts';

export const phoebeStock: Clip = {
  id: 'phoebestock', video: 'Z8caxxxIIbQ', title: 'Phoebe the Stockbroker', dur: 68, wpm: 129, band: 'slow',
  tags: ['友だち', '職場'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 50 %, right): the snack and phone choices were easy to rule out; both now come from words said
    // why: fired ← "they'll kill me" heard as losing her job; only a small dip ← "a little dip" is her own phrase, but
    //   from the start, and she panics right after
    { id: 'g2', skill: 'gist', level: 'B2', point: 'heart', reveals: ['symptoms', 'chest'], seg: [0.1, 59.5],
      stem: 'How does the scene end for Phoebe?',
      choices: ['Believing she is having a heart attack', 'Sure her office is about to fire her',
                'Telling herself it was only a small dip'], a: 0,
      cue: '最後のやりとり、体のどこが痛いと言っているか。',
      line: 'are you having a *heart attack*? … *Then yes, that is what I’m having.*',
      said: '大金を失って胸が痛い、息ができないと言い、最後は心臓発作だと認める。',
      mean: '株の失敗、パニック、体の症状と、話がどんどん大きくなっていく流れ。',
      trap: 'office や little dip の語が耳に残りやすいが、場面の終わりは体の話。流れの最後を追う。',
      use: 'I think I need to see a doctor.（医者に診てもらわないと）' },

    // why: dry cleaning ← it's on the list, but with "drop off"; drop off vitamins ← the two verbs swapped
    { id: 'd5', skill: 'detail', level: 'B1', point: 'errands', seg: [0.1, 9.0],
      stem: 'Which of these errands is on the list being read out?',
      choices: ['Pick up his vitamins', 'Pick up his dry cleaning', 'Drop off his vitamins'], a: 0,
      cue: '最初の2つの用事、動詞と物の組み合わせ。',
      line: 'Drop off my dry cleaning, *pick up my vitamins*…',
      said: 'クリーニングを出す、ビタミン剤を受け取る、と用事を読み上げる。',
      mean: 'drop off ＝ 置いてくる・出す、pick up ＝ 受け取ってくる。反対の意味のペア。',
      trap: '物の名前だけを聞くと、動詞との組み合わせを入れかえやすい。動詞と物をセットで聞く。',
      use: 'Can you pick up the kids at five?（5時に子どもを迎えに行ける？）' },

    // R fix: V2 (blind 60 %, right): "show them off" was a weak foil; "inside the house" (in = 室内) and "try on" replace
    //   the old pair
    // why: inside the house ← "in" read as indoors; try on ← wear + in heard as trying clothes on in a store
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'jeans', seg: [8.5, 12.9],
      stem: 'In the last errand on the list, what is he asked to do?',
      choices: ['Wear the new jeans until they feel soft', 'Wear the new jeans only inside the house',
                'Try on the new jeans to check the size'], a: 0,
      cue: '最後の用事、wear のあとの短い一語。',
      line: '*wear in* my new jeans.',
      said: '最後の用事は「新しいジーンズをはきならしておく」。',
      mean: 'wear in ＝ 何度もはいて体になじませる。新しい靴なら break in もよく使う。',
      trap: 'in を「室内で」と取ると「家の中ではく」になる。wear のあとの in は「なじませる」。',
      use: 'These boots take a week to wear in.（このブーツはなじむまで1週間）' },

    // R fix: V2 (blind 60 %, right): the key was the only choice tied to the chores; all three now are
    // why: who gave him the list ← "what you are" heard as a real question about the errands; warning ← "realize"
    //   read as 気づけ, a warning
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'tease', seg: [11.9, 14.95],
      stem: 'After the list is read, what does the next question set up?',
      choices: ['A teasing name for the one doing the chores', 'A real question about who gave him the list',
                'A warning that the list will cause him trouble'], a: 0,
      cue: 'don’t you? で終わる問いかけ。答えを待っている？',
      line: 'You *realize what you are*, don’t you?',
      said: '「自分が何なのか分かってるよね？」と聞き、相手が「何？」と返す。',
      mean: '答えを求める質問ではなく、からかいの一言を言う前ふり。続く言葉が本題。',
      trap: 'realize を「気づけ」と警告に取りやすい。don’t you? 付きのこの前ふりは、からかいの合図。',
      use: 'You know what you are? A genius.（自分が何か分かる？天才だよ）' },

    // R fix: V2 (blind 50 %, right): the key was the only realistic worry; it's now said at the scene level, and the
    //   foils are worded as worries too
    // why: losing more ← "dip in the market" is the news itself, not her worry; his anger over snacks ← "my Kit Kats"
    //   is his worry, and she answers it ("all right")
    { id: 'g1', skill: 'gist', level: 'B2', point: 'react', reveals: ['clients', 'panic'], seg: [18.2, 39.6],
      stem: 'Once the bad news hits, what worries Phoebe most?',
      choices: ['Facing the people she will have to tell', 'Losing even more as the market keeps falling',
                'Her friend’s anger over his crushed snacks'], a: 0,
      cue: '「どうしよう」のあと、誰に電話できないか。',
      line: 'I can’t call my *office*… I can’t call my *clients*…',
      said: '「どうしよう」と2回言い、会社にも顧客にも電話できない、と続ける。',
      mean: '頭にあるのは市場の先行きではなく、損を知ったときの人たちの反応。',
      trap: 'market や Kit Kats は前に出た語。不安の中身は、そのあと名前の出る相手で分かる。',
      use: 'What am I going to tell my boss?（上司に何て言おう）' },

    // R fix: V2 (blind 70 %, right): the key was the only comic choice; all three are now "his first thought"
    // why: hurt ← "sit on" + her cry heard as a question about an injury; ate his candy ← "my Kit Kats" +
    //   "didn't just" heard as an accusation of eating
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'snacks', seg: [20.3, 24.0],
      stem: 'When Phoebe cries out, what does her friend’s question show about him?',
      choices: ['His first thought is for his own candy bars', 'His first thought is that she has been hurt',
                'His first thought is that she ate his candy'], a: 0,
      cue: '「Wait」のあと、何のことを聞いているか。',
      line: 'Wait, you didn’t just sit on my *Kit Kats*, did you?',
      said: '叫び声を聞いて「まさか僕のキットカットの上に座ってないよね？」と聞く。',
      mean: '友だちの叫びに、まず自分のお菓子の心配をしている。体を気づかう問いではない。',
      trap: 'sit on から「けが」を想像しやすい。何を心配しているかは、文の終わりの物で決まる。',
      use: 'Wait, what about my laptop?（待って、僕のパソコンは？）' },

    // R fix: V2 (blind 50 %, right): "don't just" clashed with the "did you?" tag; the full form "did not just"
    //   replaces it, so all four fit
    // why: did just ← n't's t drops and the vowel is short; didn't even ← same opening, and "even" fits the
    //   complaint; did not just ← the -n't heard as a full "not"
    { id: 's1', skill: 'sound', level: 'C1', point: 'snacks', seg: [20.3, 24.0],
      stem: 'Fill the gap: “Wait, you ___ sit on my Kit Kats, did you?”',
      choices: ['didn’t just', 'did just', 'didn’t even', 'did not just'], a: 0,
      cue: 'you のあとの2語、短くつながる音。',
      line: 'Wait, you *didn’t just* sit on my Kit Kats, did you?',
      said: 'didn’t just は「ディンジャス」とつながる。',
      mean: '否定と did you? で「まさか…してないよね？」と悪い予感を確かめる形。',
      trap: 'n’t の t が消えて did に聞こえやすいが「ン」は残る。後ろの did you? も手がかり。',
      use: 'You didn’t just lose the keys, did you?（まさか鍵をなくしてないよね？）' },

    // R fix: V2 (blind 70 %, right): "stopped caring" was easy to rule out; an order trap (candy before the bad news)
    //   replaces it
    //   A cold re-read still found it at 70 %: the key's "after losing millions" spelled out the joke, so it's reworded
    // why: covering up ← "No" then "But" heard as a confession that she did sit on them; candy first ← the order
    //   misheard: the loss comes first, the candy is tacked on after
    { id: 'h1', skill: 'humor', level: 'C1', point: 'kitkat', reveals: ['snacks', 'amount', 'dip'], seg: [20.3, 32.2],
      stem: 'Why does Phoebe’s last remark about the candy get a laugh?',
      choices: ['She reports on the candy as if it matters', 'She is covering up that she did sit on them',
                'She calms his candy worry before the bad news'], a: 0,
      cue: '大きな損の話のすぐあと、But で始まる一言。',
      line: 'and I lost $13 million. *But the Kit Kats are all right.*',
      said: '1300万ドル失ったと言ったあと、「でもキットカットは無事」と付け足す。',
      mean: '大事件の直後に、彼の小さな心配にもきちんと答える。その大小の差がおかしい。',
      trap: '慰めの前置きと取りやすいが、損の話が先で、お菓子はあと。話の順番を確かめる。',
      use: 'The car’s gone, but the coffee survived.（車はダメ、でもコーヒーは無事）' },

    { id: 'n1', skill: 'number', level: 'B1', point: 'amount', seg: [23.8, 29.6],
      stem: 'How much does Phoebe say she lost?',
      choices: ['$13 thousand', '$3 million', '$13 million', '$30 million'], a: 2, keep: true,
      cue: '「I lost」のあと、数字と単位。',
      line: 'and I lost *$13 million*.',
      said: '市場が下がって、1300万ドル失ったと言う。',
      mean: 'thirteen は後ろの teen を強く長く言う。thirty なら前が強く、終わりに n がない。',
      trap: '-teen と -ty は聞き分けにくい。強く聞こえる位置と、語尾の n の有無で決める。',
      use: 'That’s fifteen, not fifty, right?（50じゃなくて15だよね？）' },

    // R fix: V2 (blind 65 %, right): "small and brief" was easy to rule out; the mirror reading (a small loss
    //   blown up) replaces it
    // why: small loss sound huge ← Phoebe's panic heard as exaggeration, the scale reversed; market will recover ←
    //   "dip" (a short drop) read as a promise that it comes back
    { id: 'i2', skill: 'infer', level: 'C1', point: 'dip', reveals: ['amount'], seg: [23.8, 29.6],
      stem: 'How does Phoebe’s first description of the loss fit what she lost?',
      choices: ['It makes a huge loss sound small', 'It makes a small loss sound huge',
                'It hints the market will soon recover'], a: 0,
      cue: '最初の言い方と、そのあとの金額の差。',
      line: 'there was a *little dip* in the market and I lost $13 million.',
      said: '「市場がちょっと下がって」と言ってから、大損を打ち明ける。',
      mean: 'little dip ＝ 小さな下落。大損を小さく言って、言い出しにくさを和らげている。',
      trap: 'あとの取り乱し方から、逆に大げさと取りやすい。控えめな言葉は、あとの数字と比べる。',
      use: 'There’s a tiny problem with the car.（車にちょっとした問題が…）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'whattodo', seg: [31.9, 34.15],
      stem: 'Type what she says twice: “What ___ do?” (4 words)', answer: 'am i going to',
      cue: '同じ問いを2回。2回目も手がかりに。',
      line: 'What *am I going to* do? What am I going to do?',
      said: '「どうしよう」を2回くり返す。am I going to が速く一続きになる。',
      mean: '困ったときの「どうしよう」。答えを求める質問ではない。',
      trap: 'am と I が「アマイ」とくっつき、語の数が分かりにくい。4語を指で数えて書く。',
      use: 'What am I going to wear?（何を着ていこう）' },

    // R fix: V2 (blind 65 %, right): "calm, planning" was easy to rule out; "stunned" (another shock state) replaces it
    // why: angry at them ← "kill" is a strong word, but it's the others' anger she expects; stunned ← the shock is
    //   right, but she can't stop talking
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'panic', reveals: ['whattodo'], seg: [31.9, 39.4],
      stem: 'How is Phoebe feeling as she talks about the calls she can’t make?',
      choices: ['Panicked, with no idea what to do next', 'Angry at the office and clients for blaming her',
                'Stunned, too shocked to say much at all'], a: 0,
      cue: '同じ問いのくり返しと、「できない」の数。',
      line: '*What am I going to do?* … I *can’t* call my office… I *can’t* call my clients…',
      said: '「どうしよう」をくり返し、会社にも顧客にも電話できない、と並べていく。',
      mean: '同じ問いのくり返しと「できない」の連続は、取り乱している合図。',
      trap: 'kill という強い語から「怒り」を選びやすいが、怒りそうなのは相手のほう。主語を確かめる。',
      use: 'Okay, okay, what do I do now?（どうしよう、どうしたらいい？）' },

    // R fix: V2 (blind 50 %, right): "feel sorry" gives way to "crushed", the clients' reaction from the next line
    // why: crushed ← the clients' "kill themselves" carried back to the office; ask her to come in ← "call my office"
    //   heard as being called in
    { id: 'f2', skill: 'phrase', level: 'B1', point: 'office', seg: [32.9, 35.95],
      stem: 'What does Phoebe expect from her office if she calls?',
      choices: ['They will be furious with her', 'They will be crushed by the news', 'They will ask her to come in'], a: 0,
      cue: 'office のあと、短い3語。',
      line: 'I can’t call my office, *they’ll kill me*.',
      said: '会社には電話できない、「殺される」と言う。',
      mean: 'they’ll kill me ＝ ものすごく怒られる、という決まり文句。本当に殺すという意味ではない。',
      trap: '強い語だけを聞くと物騒な話に聞こえる。kill me は「大目玉をくらう」の大げさな言い方。',
      use: 'My mom’s going to kill me.（母さんにすごく怒られる）' },

    // why: come after her ← "they'll kill me" just before, the same shape, heard again; call her office ← "office"
    //   is the last place named before the clients
    { id: 'd3', skill: 'detail', level: 'B2', point: 'clients', reveals: ['office'], seg: [33.6, 39.3],
      stem: 'Why does Phoebe say she can’t call her clients?',
      choices: ['They would hurt themselves, not her', 'They would come after her angrily',
                'They would call her office instead'], a: 0,
      cue: 'office の文と clients の文、終わりを比べて。',
      line: 'I can’t call my clients, *they’ll kill themselves*.',
      said: '会社は「私を殺す」、顧客は「自分を殺す」と言い分ける。',
      mean: 'themselves は顧客自身のこと。お金を失った顧客が絶望する、という大げさな言い方。',
      trap: '直前の kill me と同じだと思いこむと「私に怒る」になる。文末の語を最後まで聞く。',
      use: 'Don’t tell Dad, he’ll freak out.（父さんには言わないで、パニックになる）' },

    // anchor: 36.0–38.9 s "they'll kill themselves" set against 35.3 s "they'll kill me": the office's anger is
    //   aimed at her, the clients' despair at themselves, and people despair over what was theirs
    // R fix: V2 (blind 55 %, right) + V4: "feel for her" was weak, so "their own bets" (a near miss) replaces it. The
    //   item asks what follows when the line is taken seriously, so its skill is infer, not humor
    // why: come after her ← the "kill me" line just before, carried over (right mechanism, wrong target); their own
    //   bets ← despair right, source wrong: she'd have no news to call them with
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'clients', reveals: ['office'], seg: [33.6, 39.3],
      stem: 'Taken seriously, what does the clients line tell us about the lost money?',
      choices: ['Much of it was really her clients’ own money', 'Her clients will blame her and come after her',
                'Her clients lost money on their own bets too'], a: 0,
      cue: 'kill の後ろ、me と themselves のちがい。',
      line: 'I can’t call my office, they’ll kill *me*. I can’t call my clients, they’ll kill *themselves*.',
      said: '会社は「私を殺す」、顧客は「自分を殺す」と、最後の一語だけ変える。',
      mean: 'ひどく落ちこむのは、失ったのが自分のお金だから。預かったお金だと、この一語で分かる。',
      trap: '直前の kill me に引っぱられて「顧客も私に怒る」と聞きやすい。同じ形が続いたら、変わった一語に意味がある。',
      use: 'It wasn’t my money to lose.（失っていいお金じゃなかった）', retired: true },

    // why: head and can't think ← a panicked speaker's usual complaint; arm and can't move it ← "left arm" comes
    //   later, in her question
    { id: 'd4', skill: 'detail', level: 'B1', point: 'chest', seg: [38.9, 47.6],
      stem: 'What two problems does Phoebe report in her body?',
      choices: ['Her chest hurts and she can’t breathe', 'Her head hurts and she can’t think',
                'Her arm hurts and she can’t move it'], a: 0,
      cue: '「now」で始まる2つの文。',
      line: 'now my *chest hurts*… and now I *can’t breathe*.',
      said: '「今度は胸が痛い」「息もできない」と、体の不調を2つ続けて言う。',
      mean: 'chest ＝ 胸、breathe ＝ 息をする。どちらも心臓発作を思わせる症状。',
      trap: 'arm はあとの質問に出てくる語。今の訴えは now で始まる2つの文にある。',
      use: 'My chest hurts when I run.（走ると胸が痛い）' },

    // R fix: V2 (blind 70 %, right): "learn the signs" was easy to rule out; "chest, not arm" (her earlier words)
    //   replaces it
    // why: no such pains ← "if I were" heard as "but I'm not"; chest not arm ← "my chest hurts" said earlier, but
    //   "Then yes" takes on the arm pains too
    { id: 'i1', skill: 'infer', level: 'B2', point: 'symptoms', reveals: ['heart'], seg: [47.2, 56.0],
      stem: 'When asked about a heart attack, what is Phoebe really telling him?',
      choices: ['That she has those same arm pains right now', 'That she has no such pains, so she is fine',
                'That her pain is in her chest, not her arm'], a: 0,
      cue: 'if I were のあとの質問と、最後の答え。',
      line: 'if I were, would I have *shooting pains* up and down my left arm?',
      said: '「発作なら、左腕にズキズキする痛みがある？」と聞き、彼が「うん」と言う。',
      mean: '仮定の形で、今の自分の症状を伝えている。発作だと認めたくない気持ちも見える。',
      trap: 'if I were を「そうじゃないけど」と取りやすい。仮定の中身が今の話のこともある。',
      use: 'With a fever, would I feel cold?（熱があったら寒気がする？）' },

    // R fix: V2 (blind 60 %, right): "joking about the pain" was easy to rule out; "so he stops asking" replaces it
    // why: to scare him ← "Then yes" heard as a dramatic confession aimed at him; stop asking ← "yes" read as giving
    //   in, but she's the one asking, and "Then" draws a conclusion
    { id: 'h3', skill: 'humor', level: 'C1', point: 'symptoms', reveals: ['heart', 'then'], seg: [47.2, 56.0],
      stem: 'Why does Phoebe’s final answer get a laugh?',
      choices: ['She needs him to tell her what her own pain means', 'She admits to the pain only to scare him a bit',
                'She only says yes so he will stop asking'], a: 0,
      cue: '彼の短い返事と、彼女の答えの順番。',
      line: 'would I have shooting pains…? — Yes. — *Then yes, that is what I’m having.*',
      said: '自分の症状を彼に確かめさせ、「うん」と聞いてから「じゃあ発作だ」と答える。',
      mean: '自分の体のことなのに、診断を相手に任せている。その順番がおかしい。',
      trap: '「怖がらせたい」と取りやすいが、質問しているのは彼女のほう。答えが出る順番に注目する。',
      use: 'If that’s a yes, then I’m in.（それがイエスなら、僕も乗る）' },

    // anchor: 54.0–55.3 s "Then yes, that is what I'm having": the pains she asked about "if I were" are hers;
    //   42.2–47.1 s "my chest hurts… I can't breathe" says the same
    // R fix: V2 (blind 60 %, right): the key was the only urgent reply; "just panic" (urgent, but the wrong cause)
    //   replaces "look it up later"
    // why: you don't have that ← sincerity of the hypothetical: "if I were" taken as "I'm not"; just panic ← her
    //   panic is real, but the arm pain she confirms points to her heart
    { id: 'nt2', skill: 'pragma', level: 'C2', point: 'symptoms', seg: [47.2, 56.0],
      stem: 'Which reply from her friend would match what Phoebe really means?',
      choices: ['Your arm hurts? We need a doctor, now!', 'Yes, but you don’t have that, so relax.',
                'It’s just panic. Sit down and breathe slowly.'], a: 0,
      cue: 'if I were の質問のあと、彼女がどう締めるか。',
      line: 'Well, if I were, would I have shooting pains…? — Yes. — *Then yes, that is what I’m having.*',
      said: '「発作なら左腕に痛みがある？」と聞き、彼の「うん」に「じゃあ、それなの」と答える。',
      mean: '仮定の形は、実は今ある痛みの報告。前の胸の痛みとも合う。分かった人なら、すぐ助けを呼ぶ。',
      trap: 'if I were を「違うけど」と取りやすい。仮定の質問が、言いにくい本当の話を包んでいることがある。',
      use: 'Hypothetically, if I broke your lamp…（もし仮に、ランプを割ったら…）', retired: true },

    // R fix: V2 (blind 50 %, right): "correcting herself" was weak; "repeating his word" (she does say yes again)
    //   replaces it
    // why: pain began after ← then = それから, the time reading; repeating ← her "yes" echoes his, but the first word
    //   is "Then"
    { id: 'm1', skill: 'marker', level: 'B2', point: 'then', reveals: ['symptoms', 'heart'], seg: [53.0, 56.0],
      stem: 'When Phoebe answers right after his “Yes”, what does her first word signal?',
      choices: ['That her answer comes from what he said', 'That her pain began after his reply',
                'That she is just repeating his word'], a: 0,
      cue: '答えの最初の一語と、直前の Yes の関係。',
      line: '— Yes. — *Then* yes, that is what I’m having.',
      said: '彼の「うん」を受けて「じゃあ、そう、それなの」と答える。',
      mean: 'then ＝ それなら。時間の「そのあと」ではなく、相手の答えを受けた結論を示す。',
      trap: 'then を「それから」と時間で取りやすい。返事の頭に来る then は「それなら」。',
      use: 'Then let’s just take a taxi.（それならタクシーにしよう）' },
  ]
};
