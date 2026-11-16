// “Ann tortures April with her friendship | Parks and recreation” (the official Parks and Recreation channel, Season
// 5): April needs a recommendation letter for vet school, and Ann's price is a week of being her friend; the week
// ends with Ann's secret about Chris, a song, and a gift.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 257 s. Untested on purpose: 56–65 s
// (the hook-up talk), 76–96 s and 107–118 s (lists of celebrities and TV characters: world knowledge), 118–130 s
// ("This is weird" / "No, it's not": the voices aren't settled by words), 143–149 s ("Back to forced friendship",
// speaker unclear), 154–219 s (the song). Jerry names himself at 10.8 s (captions "Gage", whisper "Gergish"; never
// asked). Ann is named at 133.6 s, April at 18.8 s, Chris at 140.4 s; turns are settled by words ("to Ann", "the
// letter", "veterinary school").
// REVIEW 2026-11-16: pass 5, fix 19, drop 0, new 0; ear checks 1
//   Open: s1 stays about 60 % blind ("I can't tell if…" is a set phrase; the can/can't contrast is the point). h2 is
//   about 50 %: a "why the laugh" stem points at the funny choice.
// EAR CHECK: 219.5 s nt2 — captions “This never happened”, whisper “It's never happened”; the speaker is assumed
//   April (she just said "It's amazing" about the song)
import type { Clip } from '../types.ts';

export const annApril: Clip = {
  id: 'annapril', video: '3PS3x98ag3Y', title: 'Ann tortures April with her friendship', dur: 278, wpm: 163,
  band: 'mid', tags: ['友だち', 'お願い・断り'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // why: checking she heard ← "you know what?" read literally as a question (知ってる？); trying to end the call ←
    //   the last one comes just before "Bye"
    { id: 'm1', skill: 'marker', level: 'B2', point: 'jerry', seg: [0, 12.6],
      stem: 'What does Jerry keep doing in his phone message?',
      choices: ['Changing what he wants done', 'Checking that she heard him', 'Trying to end the call'], a: 0,
      cue: '新しい頼みの直前に入る、短い決まり文句。',
      line: '*Actually, you know what?* Don’t tell him that I called… *You know what?* Let’s just pretend this didn’t happen',
      said: '「戻ったら電話を」→「メールで」→「全部なかったことに」と頼みが変わる。',
      mean: 'Actually, you know what? ＝ やっぱりさ。考えが変わった合図。',
      trap: '「知ってる？」という質問ではない。返事を待たずに次の頼みが来ることで分かる。',
      use: 'Actually, you know what? Make it two.（やっぱり、2つにして）' },

    // R fix: V2 + K1. "Keep a secret" was half true ("if you tell anyone, I will kill you"); "a ride to Bloomington"
    //   (a keyword trap) replaces it.
    // why: ride ← "veterinary school in Bloomington" heard as the errand; advice ← "thinking about applying to
    //   veterinary school" heard as asking what Ann thinks
    { id: 'g1', skill: 'gist', level: 'B1', point: 'reco', reveals: ['secret'], seg: [12.8, 38.4],
      stem: 'Why does April come to Ann in the first place?',
      choices: ['She needs a letter from Ann', 'She needs a ride to Bloomington', 'She needs Ann’s advice on school'],
      a: 0,
      cue: '「So, I really need」のあと。',
      line: 'So, I really need *a letter of recommendation*',
      said: '獣医学校に応募したいので、病院で働くアンに推薦状を書いてほしいと頼む。',
      mean: '秘密は前置きで、本題は推薦状。So, I really need で頼みが始まる。',
      trap: 'Bloomington や school は前置き。So のあとに本題が来る。',
      use: 'Could you write me a reference?（推薦状を書いてもらえますか）' },

    // R fix: V2. "Working at a hospital" was off the topic; "already applied" is a second stage trap.
    // why: accepted / already applied ← "applying… veterinary school" with "thinking about" lost, so only the stage
    //   is in doubt
    { id: 'd1', skill: 'detail', level: 'B1', point: 'secret', seg: [12.8, 25.9],
      stem: 'What secret does April tell Ann?',
      choices: ['She’s thinking of applying to vet school', 'She’s already applied to a vet school',
                'She’s been accepted to a vet school'], a: 0,
      cue: '「What’s your secret?」への答え。',
      line: 'I’m *thinking about applying to veterinary school* in Bloomington.',
      said: '「言ったら殺す」と前置きし、「獣医学校への応募を考えてる」と言う。',
      mean: 'thinking about applying ＝ まだ考えている段階。',
      trap: 'school だけだと合格の話に聞こえる。thinking about で段階を確かめる。',
      use: 'I’m thinking about applying for that job.（あの仕事に応募しようか考え中）' },

    // why: nervous ← asking a favor is awkward, so the slip reads as nerves (the Japanese frame: 緊張して言い間違え);
    //   flattering ← "janitor" missed, so naming Ann's job sounds like praise before the favor
    // R fix: V2. "Checking whether Ann has changed jobs" was a filler; "flattering her" (also about the favor) replaces it.
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'janitor', reveals: ['reco'], seg: [29.0, 38.5],
      stem: 'When April gets Ann’s job wrong, what is she doing?',
      choices: ['Teasing her, even while asking a favor', 'Mixing it up, because she is nervous',
                'Flattering her, to make the favor easier'], a: 0,
      cue: '頼みごとの途中で、アンが一語で口をはさむ所。',
      line: 'since you work in a hospital as a *janitor*… — *Nurse*. — I was wondering if maybe you would write one for me?',
      said: '「病院で清掃員として働いてるから」と言いかけ、アンが「看護師」と直す。そのまま推薦状を頼む。',
      mean: '頼みごとの最中でも、仕事を下に言ってからかう。エイプリルらしい意地悪。',
      trap: '緊張のせいと取りやすいが、謝りも言い直しもせず、そのまま頼みを続けている。',
      use: 'I was wondering if you could help me.（手伝ってもらえないかなと思って）' },

    // R fix: V2. The key was the only odd prank, so it stood out; "salt in her coffee" is a prank too.
    // why: money ← h/m: "honey" heard as "money", and a purse is where money goes; salt in coffee ← "pouring" pulls
    //   toward a drink, and it's the usual office prank
    { id: 'd2', skill: 'detail', level: 'B1', point: 'honey', seg: [39.6, 48.1],
      stem: 'In her comment to the camera, what does Ann say April usually does?',
      choices: ['Pours honey in her purse', 'Takes money from her purse', 'Pours salt in her coffee'], a: 0,
      cue: '「or」のあと、二つ目の意地悪。',
      line: '…or *pouring honey in my purse*.',
      said: '「エイプリルはいつも、私のバッグにはちみつを注いだりする」と言う。',
      mean: 'purse ＝ ハンドバッグ。子どもっぽい意地悪の例。',
      trap: 'honey と money は最初の音だけの差。お金なら pouring（注ぐ）とは言わない。動詞も手がかり。',
      use: 'Someone spilled coffee in my bag.（誰かがバッグにコーヒーをこぼした）' },

    // R fix: V2. "A free hand" was close to a filler; "a helping hand" is the literal "hand" reading. S4: the
    //   segment was 15.4 s; it now starts at 41.0 s, after "between us".
    // why: higher position ← "upper" read as rank (上司), and the letter is a work favor; helping hand ← "hand" read
    //   literally, and she's about to help
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'upper', seg: [41.0, 55.0],
      stem: 'In her comment to the camera, what does Ann say she has now?',
      choices: ['Control over how things go between them', 'A higher position at work than April',
                'A chance to give April a helping hand'], a: 0,
      cue: '「But now」のあと。前の文と同じ言い方。',
      line: 'April always has *the upper hand*… But now *I have the upper hand*',
      said: '「いつも優位なのはエイプリル。でも今は私が優位」と言う。',
      mean: 'the upper hand ＝ 優位、主導権。頼みごとをされた今、力関係が逆転した。',
      trap: 'upper を地位、hand を手伝いと取りやすい。二人の力関係の話で、職場の上下ではない。',
      use: 'This time, I have the upper hand.（今回は、こっちが有利だ）' },

    // R fix: V2. "Use force to make April be nice" echoed "forced friendship" (g2's stem, the title's idea); all three
    //   choices are now "She'll be…" plans.
    // why: be kind so April likes her ← "crush" heard as "have a crush on" (好きになる); gives up on school ← "crush
    //   her" with the letter as the leverage
    { id: 'h1', skill: 'humor', level: 'C1', point: 'crush', reveals: ['upper'], seg: [48.0, 55.0],
      stem: 'What is funny about how Ann sums up her plan?',
      choices: ['She’ll be harsh to get kindness out of April', 'She’ll be kind so that April starts to like her',
                'She’ll be harsh until April gives up on school'], a: 0,
      cue: '「crush her」のあと、何をさせるのか。',
      line: 'I’m going to use it to *crush her into being nice* to me.',
      said: '「優位を使って、彼女を押しつぶして私に優しくさせる」と言う。',
      mean: '力ずくで優しさを引き出す矛盾が笑い。crush A into ～ ＝ つぶして～させる。',
      trap: 'crush には「好きになる」の意味もあるが、ここは後ろに into ～ が続く。',
      use: 'They pressured him into saying yes.（彼らは無理やり彼にイエスと言わせた）' },

    // why: weekend ← "week with" runs together and is heard as "weekend"; two weeks ← "to spend the next week": "to"
    //   heard as "two"
    { id: 'n1', skill: 'number', level: 'B1', point: 'week', seg: [64.9, 69.7], keep: true,
      stem: 'How long does Ann say April must spend with her?',
      choices: ['The next weekend', 'The next week', 'The next two weeks'], a: 1,
      cue: '「spend the next」のあと。',
      line: 'you have to spend *the next week* with me and do everything I say.',
      said: '「書く前に、1週間私と過ごして言うことを聞いて」と条件を出す。',
      mean: 'the next week ＝ これからの1週間。期間つきの条件。',
      trap: 'week with が「ウィークウィズ」とつながり weekend に聞こえやすい。「エンド」は聞こえない。',
      use: 'I’ll be away for the next week.（これから1週間いません）' },

    // R fix: V2 + N7. "As long as it lasts only a week" gave away n1's key; the mirror ranking replaces it.
    // why: wants a servant ← "slave or something" is April's guess, heard as Ann's real wish; slave worse ← "so much
    //   worse" caught without what it compares, so the usual ranking is assumed
    { id: 'h2', skill: 'humor', level: 'B2', point: 'worse', seg: [69.4, 75.9],
      stem: 'Why does April’s last reply in this exchange get a laugh?',
      choices: ['She finds being friends worse than being a slave', 'She thinks Ann wants a servant, not a friend',
                'She finds being a slave worse than being friends'], a: 0,
      cue: '「No」で始まる最後の返事。',
      line: 'So I have to be your slave or something? — No. You have to be my friend. — No, that is *so much worse*.',
      said: '「奴隷になれってこと？」「違う、友だちになって」「それはもっとひどい」と続く。',
      mean: '友だちのほうが奴隷より嫌だという、ふつうと逆の順位づけが笑い。',
      trap: '最後の No を断りとだけ取りやすい。so much worse で何と比べているかを聞く。',
      use: 'That’s even worse!（それはもっとひどい！）' },

    // R fix: V2 + N7. "After this week" gave away n1's key; the future choice no longer names the time.
    // why: will come to like ← the deal's aim (Ann's plan) heard as her claim, with the present "likes" missed; grumpy
    //   with everyone ← "grumpiness" heard as April's nature, not a cover
    { id: 'i1', skill: 'infer', level: 'B2', point: 'deepdown', seg: [96.9, 104.5],
      stem: 'In her second comment to the camera, what does Ann believe about April?',
      choices: ['She likes Ann but hides it', 'She’ll come to like Ann in time', 'She’s grumpy with everyone alike'],
      a: 0,
      cue: '「I know」のあと。',
      line: 'she hides it underneath layers of sarcasm, resentment, and grumpiness, *I know, deep down somewhere, April likes me*.',
      said: '「皮肉や不機嫌の下に隠してるけど、本当は私が好き」と言う。',
      mean: '皮肉などは隠す層。本心は deep down の部分にある。',
      trap: 'resentment や grumpiness は隠すための層。likes は今の話で、これからの話ではない。',
      use: 'Deep down, he’s a nice guy.（根はいい人なんだよ）' },

    // R fix: V2. The key was the only choice with an image ("layers"); all three are images now.
    // why: fishing ← "fracking for" sounds like "fishing for (compliments)", a chunk learners know; hunting down ←
    //   "crush her into being nice" earlier, heard as the same plan
    { id: 'h3', skill: 'humor', level: 'C1', point: 'fracking', reveals: ['deepdown'], seg: [96.9, 107.7],
      stem: 'What image does Ann use to end her comment to the camera?',
      choices: ['Drilling to get at April’s buried friendship', 'Fishing for April to say nice things',
                'Hunting April down until she gives in'], a: 0,
      cue: '最後の文。前の「layers」「deep down」とつながる。',
      line: 'layers of sarcasm… deep down somewhere… I’m kind of just *fracking for friendship*.',
      said: '「心の奥では私が好き。友情を掘っている」と締めくくる。',
      mean: 'fracking ＝ 岩を割ってガスを取る方法。層の奥の友情を掘るたとえ。',
      trap: 'fishing for（～を引き出す）に音が近い。layers と deep down が、掘る話だと教える。',
      use: 'I’m just digging for the truth.（本当のことを掘り出そうとしてるだけ）' },

    // R fix: V2. "Made up" was weak; "keeping Chris away from Ann" (the guard-dog friend) replaces it.
    // why: offering to leave ← the polite script after "talk in private?", with her "No" heard as "no problem";
    //   keeping Chris away ← her "No" heard as a refusal on Ann's behalf, with "say to me" lost
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'bestfriends', reveals: ['week'], seg: [130.15, 136.3],
      stem: 'When Chris asks Ann to talk in private, what is April’s reply doing?',
      choices: ['Using the deal as an excuse to listen in', 'Offering to leave so the two can talk',
                'Keeping Chris away from Ann for a while'], a: 0,
      cue: '文の最後の二語。',
      line: 'Anything you can say to Ann, you can say to me, because we’re *best friends this week*.',
      said: '「アンに言えることは私にも言える。今週は親友だから」と、その場に残る。',
      mean: '「今週だけの親友」を逆手に取って、話を聞こうとしている。',
      trap: 'No をアンを守る断りと取りやすいが、say to me と期限つきの this week が取引を示す。',
      use: 'You can tell me. We’re friends, right?（言ってよ。友だちでしょ？）' },

    // R fix: V2. The key was the only choice naming April's questions; the choices are plainer and parallel.
    // why: cheer up ← the friendship-week fun (PJs, white Russians) just before, heard as the reason; until Chris
    //   returns ← "talk to you later" heard as Chris coming back soon
    { id: 'i2', skill: 'infer', level: 'B2', point: 'sing', seg: [149.4, 160.75],
      stem: 'Why does Ann start to sing instead of answering?',
      choices: ['To avoid talking about Chris yet', 'To cheer April up about school',
                'To pass the time until Chris is back'], a: 0,
      cue: '「Are you ready?」のあと、二人の答えのずれ。',
      line: 'Are you ready? — For you to tell me what’s going on with Chris? Yes. — *No. To sing.*',
      said: '「準備はいい？」「クリスの話をする準備？うん」「違う、歌う準備」と、歌い出す。',
      mean: 'クリスの話をはぐらかすために歌に逃げている。期待を No で外す流れが笑い。',
      trap: '直前のパジャマの話から「楽しませるため」と取りやすい。何を聞かれ、何で返したか。',
      use: 'Nice try changing the subject.（話をそらそうとしてもだめだよ）' },

    // R fix: V2. "Already has a letter" was weak; "had enough of Ann" (the literal "or I'm leaving") replaces it.
    // why: no longer wants ← "I don't care about the letter" heard as giving up the plan itself; had enough ← "or I'm
    //   leaving" heard as the goal, not the threat
    { id: 'i3', skill: 'infer', level: 'C1', point: 'letter', reveals: ['reco'], seg: [161.0, 170.4],
      stem: 'What does April’s last demand before Ann gives in show?',
      choices: ['She’d give up the letter to hear Ann out', 'She no longer wants to go to vet school',
                'She’s had enough of Ann and wants to leave'], a: 0,
      cue: '「or I’m leaving」のあと。',
      line: 'Tell me about Chris *or I’m leaving and I don’t care about the letter*.',
      said: '歌でごまかすアンに、「クリスのことを話して。でないと帰る。推薦状なんてどうでもいい」と言う。',
      mean: '取引の推薦状より、アンの悩みを聞くことを選んだ。本当は気にかけている。',
      trap: '「どうでもいい」を進学をやめる話と取りやすい。比べているのは推薦状とアンの話。',
      use: 'Forget the money. Just tell me what happened.（お金はいいから、何があったか話して）' },

    // R fix: S3. The cue quoted "taking", a word only the key has; it now points at "and he's".
    // why: told her no ← "a really long time" heard as a polite no (the Japanese frame: 返事が遅い＝断り); wants one
    //   sooner ← "I want to have a baby" heard with the roles mixed
    { id: 'd4', skill: 'detail', level: 'B2', point: 'mind', seg: [170.2, 176.62],
      stem: 'What is Ann so worried about with Chris?',
      choices: ['He’s taking a long time to decide', 'He’s already told her he won’t help',
                'He wants a baby sooner than she does'], a: 0,
      cue: 'クリスの話の「and he’s」のあと。',
      line: 'I want to have a baby… and he’s *taking a really long time to make up his mind*',
      said: '「赤ちゃんがほしくてクリスにドナーを頼んだ。でも返事に時間がかかっている」。',
      mean: 'make up one’s mind ＝ 決心する。まだ答えが出ていないことが不安の種。',
      trap: '日本語では返事が遅い＝断りのこともあるが、ここはまだ決めていないだけ。',
      use: 'Take your time making up your mind.（ゆっくり決めていいよ）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'freaking', seg: [173.3, 176.62],
      stem: 'Type what Ann says: “and it’s really ___.” (3 words)', answer: 'freaking me out',
      cue: '「and it’s really」のあと。',
      line: 'and it’s really *freaking me out*',
      said: '「それで、すごく不安でたまらない」と言う。',
      mean: 'freak ～ out ＝ ひどく動揺させる。scare より口語的で、落ち着かない気持ち。',
      trap: '「フリーキンミアウ」と3語がつながる。最後の out の t はほぼ消えるが、落とさない。',
      use: 'Stop it, you’re freaking me out.（やめて、怖くなってきた）' },

    // R fix: V2 + K1. "For once" made the key the only nuanced choice, and "offended" could be argued from “Of course
    //   I do”. "Polite, not really interested" (refuted by "It's amazing") replaces it.
    // why: bored ← "Everyone knows the song" heard as "it's overplayed"; polite ← "Of course I do" heard as a flat
    //   reply, with "It's amazing" taken as a filler
    { id: 'a3', skill: 'attitude', level: 'B2', point: 'song', seg: [191.8, 195.9],
      stem: 'When Ann asks if she knows the song, how does April sound?',
      choices: ['Truly excited, and not hiding it', 'Bored, as if it’s far too common', 'Polite, but not really interested'],
      a: 0,
      cue: '最後の短い一言。',
      line: 'You know the song already? — Of course I do. Everyone knows the song. *It’s amazing.*',
      said: '「この歌知ってたの？」「当たり前。最高の歌」と答える。',
      mean: 'いつも冷めたエイプリルが It’s amazing と素直にほめる。本音がのぞく。',
      trap: 'Everyone knows は「ありふれた」とも取れるが、最後の amazing で本気と分かる。',
      use: 'Of course I know it. It’s a classic.（もちろん知ってる。名曲だよ）' },

    // anchor: 193.4–195.4 s "Of course I do. Everyone knows the song. It's amazing."; 219.0–223.4 s "Good stuff. This
    //   never happened.": praise, then an order to forget it — the enjoyment is what she hides
    // R fix: V2. The key was the only warm choice; all three are now "she found…" feelings.
    // why: embarrassing ← "Good stuff" read as dry sarcasm (her usual tone), so "never happened" sounds like disgust;
    //   Ann's news ← right mechanism, wrong target: "this" heard as Ann's confession about Chris
    { id: 'nt2', skill: 'attitude', level: 'C2', point: 'song', seg: [218.6, 224.3], retired: true,
      stem: 'Right after the song, what is April trying not to say?',
      choices: ['That she found the duet with Ann fun', 'That she found the song embarrassing',
                'That she found Ann’s news upsetting'], a: 0,
      cue: '歌のあとの二つの短い文。',
      line: '*Good stuff*. *This never happened*.',
      said: '一緒に歌いきったあと、「よかった。今のはなかったことに」と言う。',
      mean: '先にほめてから「なかったことに」と言うのは、楽しんだと認めたくないから。素直になれない照れ。',
      trap: 'いつもの皮肉と取りやすいが、さっき amazing と言っている。「なかったことに」は、恥ずかしい本音を隠す決まり文句。',
      use: 'That was fun. Tell no one.（楽しかった。誰にも言うなよ）' },

    // R fix: V2. "April begs" was weak; "Ann frees April, and lets the friendship drop" (off the hook, no need to
    //   pretend) is the strong half-listen.
    // why: holds the letter ← "letter of recommendation" heard with "here is" lost, plus the deal's terms; lets it drop
    //   ← "off the hook" and "no need to pretend to be my friend anymore" heard as the last word
    { id: 'g2', skill: 'gist', level: 'B2', point: 'end', reveals: ['hook', 'book', 'reco', 'week'], seg: [224.0, 257.6],
      stem: 'How does the week of forced friendship end?',
      choices: ['Ann frees April, but calls her a friend anyway', 'Ann frees April, and lets the friendship drop',
                'Ann holds the letter until April is nicer'], a: 0,
      cue: '推薦状を渡すときの言葉と、そのあとの話。',
      said: 'アンは推薦状を渡して取引を終えるが、「それでも友だち」と言う。エイプリルも贈り物で返す。',
      mean: '取引で始まった友情が、取引のあとも続く。「痛い」も照れ隠し。',
      trap: 'off the hook で終わりに聞こえるが、you’re my friend と続く。',
      use: 'Deal’s done, but let’s stay in touch.（取引は終わり。でも連絡は取り合おう）' },
    // R fix: V2. "Caught by Ann" was odd; the choices are now three states (free, in debt, stuck).
    // why: stuck ← "hook" = 釣り針, as if Ann has hooked her; in debt ← being handed a letter heard as a debt
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'hook', reveals: ['reco'], seg: [224.0, 231.3],
      stem: 'When Ann hands over the letter, what does she tell April?',
      choices: ['She is free of the deal now', 'She is in debt to Ann now', 'She is stuck with Ann now'], a: 0,
      cue: '「so you’re」のあと。',
      line: 'Here is your letter of recommendation, so *you’re off the hook*.',
      said: '推薦状を渡し、「これで解放。もう友だちのふりはしなくていい」と言う。',
      mean: 'off the hook ＝ 義務や責任から解放されて。釣り針から外れた魚のイメージ。',
      trap: 'hook を「引っかける」と取ると逆の意味になる。off（外れる）が先に来ている。',
      use: 'You’re off the hook for tonight.（今夜は来なくていいよ）' },

    // anchor: 229.9 s "Thank God", then 231.8–243.0 s "I can't tell if you actually hate me… but I had fun… I don't
    //   care what you say, you're my friend": the doubt is kept, and the friendship claimed anyway
    // R fix: V2. "Sure April secretly loves her" was easy to rule out; "thinks April has warmed to her" is subtler.
    // why: hurt ← "Thank God" heard as a real rejection, and "I can't tell if you hate me" as pain; warmed to her ←
    //   "I had fun hanging out with you" heard as about both of them, but she says she can't tell
    { id: 'nt1', skill: 'attitude', level: 'C2', point: 'canttell', seg: [229.4, 245.0],
      stem: 'What does Ann’s answer to “Thank God” say about how she sees April?',
      choices: ['She’ll call April a friend, hate or not', 'She thinks April has warmed to her at last',
                'She’s hurt, and ready to let April go'], a: 0,
      cue: '「I don’t care what you say」の前後。',
      line: 'Thank God. — I can’t tell if you actually hate me… but *I don’t care what you say, you’re my friend*.',
      said: '「助かった」と言われ、「嫌われてるのか分からないけど、何と言おうと友だち」と返す。',
      mean: '嫌われているかもと認めたうえで、友だちと宣言する。相手の態度に左右されない友情。',
      trap: '「分からない」を傷ついた言葉と取りやすいが、but のあとで迷いごと受け入れている。前の「好きなはず」とも違う。',
      use: 'Say what you want. You’re stuck with me.（何と言っても、私からは離れられないよ）' },

    // why: can ← the t of -n't drops, leaving a short "can"; couldn't ← the same -n't ending, with a past form
    //   expected in a farewell
    { id: 's1', skill: 'sound', level: 'B2', point: 'canttell', seg: [231.3, 234.9],
      stem: 'Fill the gap: “I ___ tell if you actually hate me.”',
      choices: ['can’t', 'can', 'couldn’t'], a: 0,
      cue: '文の最初、I のすぐあと。母音の長さに注目。',
      line: '*I can’t tell* if you actually hate me…',
      said: '「本当に私が嫌いなのか、こういう性格なのか分からない」と言う。',
      mean: 'can’t は母音が長く強め（キャーン）、can は弱く短い（クン）。',
      trap: 't が消えても can’t は母音が長い。can’t tell ＝ 見分けがつかない。',
      use: 'I can’t tell if he’s joking.（彼が冗談を言ってるのか分からない）' },

    // why: hands the letter ← "there" read as ほら (here you go); asks for a reply ← a pause after a heartfelt speech
    //   heard as a turn offered
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'sothere', reveals: ['secret'], seg: [237.0, 245.1],
      stem: 'What does Ann do with the two words that end her speech?',
      choices: ['Ends her point and dares April to argue', 'Hands April the letter she wrote for her',
                'Asks April to say something in return'], a: 0,
      cue: '話の最後、短い決め台詞。',
      line: 'I hope you get into veterinary school because I like you. *So there.*',
      said: '「獣医学校に受かってほしい。好きだから。以上」と言い切る。',
      mean: 'So there. ＝ これで決まり、文句ある？ 言い返させない締めの一言。',
      trap: 'there を「ほら、どうぞ」と取りやすいが、推薦状はもう渡している。言い切りの So there。',
      use: 'I’m right, so there.（私が正しい。以上）' },

    // anchor: 247.8–252.6 s "Baby naming book. I hope it works out with Chris, and if it doesn't, I hope it works out
    //   with someone": a gift built on what Ann confessed at 170 s, and two plain wishes with no joke in them; it
    //   follows April's "Thank God" (229.9 s)
    // R fix: S1/V2. "After all her grumbling" pointed at a warm answer; the stem is now neutral.
    // why: making fun ← right gift, sincerity flipped: April's dry style makes the book look like a joke; expects a no
    //   ← scope shift: "if it doesn't", a backup wish, heard as her forecast
    { id: 'nt3', skill: 'infer', level: 'C2', point: 'book', seg: [245.0, 253.5],
      stem: 'What does April’s gift show?',
      choices: ['She listened, and wants Ann to be happy', 'She’s making fun of Ann’s plan for a baby',
                'She expects Chris to say no to Ann'], a: 0,
      cue: '贈り物のあとの二つの「I hope」。',
      line: 'Baby naming book. *I hope it works out with Chris*, and if it doesn’t, *I hope it works out with someone*.',
      said: '「赤ちゃんの名前の本。クリスとうまくいくといいね。だめでも誰かと」と渡す。',
      mean: 'アンの打ち明け話を覚えていて、合う贈り物を選んだ。皮肉抜きの I hope が二回。',
      trap: 'いつもの皮肉に見えやすいが、願いの文に冗談がない。if it doesn’t は予想でなく、だめな時の励まし。',
      use: 'If it doesn’t work out, something better will.（だめでも、もっといいことがあるよ）' },

  ]
};
