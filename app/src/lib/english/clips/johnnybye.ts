// REVIEW 2026-11-16: pass 2, fix 19, drop 1, new 0; ear checks 1
// REVIEW open: no number item now (n1 dropped; "every week" was the clip's only number). nt2's new "I" distractor
//   makes the stress item harder; it still ships only after the ear check.
// “Parks and Recreation | Johnny Karate Says Goodbye (Episode Highlight)” (the official Parks and Recreation channel,
// Season 7): on his kids' show's last episode, Andy runs through the checklist and calls April up to "be nice to";
// she says she can't be the reason he loses the show, he answers that she is what he loves, and they'll go to DC.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈198 s; 187–198 s (stuck in the set,
// "I'll help you, John Cena") is a visual gag, and whisper loops from 198 s. Untested: the third brand at 113.5 s
// (whisper “Exxon”, captions “Aon”; h3 and nt1 rest only on “Verizon, Chipotle”), “Goodbye, Pawnee” at 182.7 s
// (captions “goodbye py”). April's speaker turn is settled by Andy's “April, what's going on?” just before.
// EAR CHECK: 95.8 s nt2 — the stress in “See, but you're what I love” falls on “you're” (contrast with the show),
//   not on “love” (ship only once confirmed)
import type { Clip } from '../types.ts';

export const johnnyGoodbye: Clip = {
  id: 'johnnybye', video: 'MzIg6tMzRy0', title: 'Johnny Karate Says Goodbye (Episode Highlight)', dur: 221, wpm: 149,
  band: 'slow', tags: ['恋愛', '職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // why: watched ← "anyone who has ever…" heard with the usual "thanks for watching"; last show ← "today" and
    //   "goodbye" make it sound like thanks for this one episode
    { id: 'd1', skill: 'detail', level: 'B1', point: 'thanks', seg: [3.7, 11.0],
      stem: 'Who does Andy thank first?',
      choices: ['Everyone who ever worked on the show', 'Everyone who ever watched the show',
                'Everyone who came to see this last show'], a: 0,
      cue: '「anyone who has ever」のあとの動詞。',
      line: 'thank you to *anyone who has ever worked on* the Johnny Karate Musical Explosion show.',
      said: '「ジョニー・カラテの番組に関わったすべての人に感謝したい」と始める。',
      mean: 'worked on ～ ＝ ～の制作に関わった。スタッフや出演者への感謝。',
      trap: 'お別れの挨拶なので視聴者への感謝を予想しやすい。has ever のあとの動詞で決まる。',
      use: 'Thanks to everyone who worked on this.（関わったみんなに感謝します）' },

    // R fix: V2 (blind 60 %): the key was the only choice that read the idiom at all; now the key is plainer and
    //   both distractors are readings a listener could hold (a joke, the literal "saying something")
    // why: only joking ← the comic tone and the rock that follows; more to say ← literal "saying something" = 何か言う
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'saying', seg: [13.9, 19.0],
      stem: 'After “the best day of my life”, what does Andy’s next phrase signal?',
      choices: ['That this beats some big past moments', 'That he is only joking about the claim', 'That he has more he wants to say'], a: 0,
      cue: '「best day of my life」の直後の短い一言。',
      line: 'today has been the best day of my life. And *that’s saying something*.',
      said: '「今日は人生最高の日。これはすごいことだよ」と言う。',
      mean: 'that’s saying something ＝ それは大したことだ。比べる相手が強いほど重みが出る。',
      trap: 'saying を「何か言う」や冗談と取りやすい。決まった言い方で、主張を強める。',
      use: 'He was on time, and that’s saying something.（彼が時間通り。これはすごい）' },

    // R fix: V2 (blind 70 %): "a funny rock" named the joke; now each choice is a joke shape a sitcom could use here
    // why: above his wedding ← the classic "best day of my life" joke, and April is about to come out; a disaster ←
    //   "train wreck" said later, and the line is self-mocking
    { id: 'h1', skill: 'humor', level: 'C1', point: 'rock', reveals: ['saying'], seg: [13.9, 23.4],
      stem: 'Why does the audience laugh at what Andy compares today to?',
      choices: ['The past high point he names is tiny and silly', 'He ranks a TV show above his own wedding', 'He admits the show was mostly a disaster'], a: 0,
      cue: '「I once found」のあと、何を見つけたか。',
      line: 'that’s saying something. I once found *a rock that looked exactly like Santa Claus*.',
      said: '「すごいことだよ。前にサンタそっくりの石を見つけたことがあるからね」と続ける。',
      mean: '人生最高の日と比べる相手が、サンタ似の石。大げさな前置きと小さな中身の差が笑い。',
      trap: '「人生最高の日」には結婚式の冗談を予想しやすい。比べる相手を聞く。',
      use: 'Best pizza ever, and I’ve had a lot.（最高のピザ、たくさん食べてきたけど）' },

    // R fix: V2 (blind 70 %): "nice to someone" was the only kids'-show rule with a person in it; now three
    //   kindness rules, two of them built from words in the clip
    // why: honest with someone ← "kind and honest" in the sign-off; kind to yourself ← "knowing who you are", and the
    //   self-care script of kids' shows
    { id: 'd2', skill: 'detail', level: 'B1', point: 'nice', seg: [40.8, 49.1],
      stem: 'What is the last and most important item on the checklist?',
      choices: ['Be nice to someone', 'Be honest with someone', 'Be kind to yourself'], a: 0,
      cue: '「the most important one」のあとの短い文。',
      line: 'The most important one. *Be nice to someone.*',
      said: '「残るは一つ、いちばん大事なこと。誰かに優しくすること」。',
      mean: 'be nice to ～ ＝ ～に優しくする。子ども番組らしい、最後の課題。',
      trap: 'あとの kind and honest などから選びやすい。nice と、to のあとの相手を聞く。',
      use: 'Be nice to your little brother.（弟に優しくしてね）' },

    // R fix: V2 (blind 75 %): the title ("Says Goodbye") gave the key; now all three end in DC and differ on when
    //   and how they go
    // why: finish the season first ← "Now I can go finish the show" heard as the season, not the episode; she goes
    //   first ← her worry heard as her leaving alone, with him to follow
    { id: 'g1', skill: 'gist', level: 'B2', point: 'deal', reveals: ['plan'], seg: [64.9, 125.0],
      stem: 'By the end of their talk, what have Andy and April settled?',
      choices: ['They’ll go to DC together and see what’s next', 'He’ll finish this season, then join her in DC', 'She’ll go to DC first, and he’ll follow later'], a: 0,
      cue: 'April の心配と、Andy の「So we go…」。',
      said: 'April は番組を奪いたくないと言い、Andy は君がいれば幸せ、ワシントンへ行こうと言う。',
      mean: '番組より April を選び、二人で進む。',
      trap: 'finish the show を番組全体と取りやすい。So we go の we で二人一緒と分かる。',
      use: 'Let’s go, and figure it out there.（行こう、あとは向こうで考えよう）' },

    // R drop: n1 (number) — V1: a TV show airing "every week" is common sense (blind 60 %), and f2's stem ("the
    //   weekly show") gave it away too. Deleted (never shipped). The clip has no other number.

    // R fix: V2 (blind 75 %): two fillers; now two "messy" readings that differ on the verdict, plus the literal train
    // why: painful to watch ← "wreck" = 事故・失敗, so it's hard to sit through; headed for a crash ← "train" taken
    //   literally, and the show is ending
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'wreck', seg: [76.3, 82.25],
      stem: 'What does April’s image of the weekly show mean here?',
      choices: ['Messy, but wonderful to watch', 'Messy, and painful to watch', 'Exciting, but headed for a crash'], a: 0,
      cue: '「amazing」のあとの二語と、そのあと何と続くか。',
      line: 'the show is *an amazing train wreck*, and you love doing it',
      said: '「毎週すごい大混乱で、あなたはそれが好き」。',
      mean: 'train wreck ＝ 大混乱。amazing が付き、ひどいけど目が離せない、という言い方。',
      trap: 'wreck だけだと悪口や「終わり」に聞こえる。amazing と love が温度を決める。',
      use: 'The party was a total train wreck.（パーティーは大混乱だった）' },

    // R fix: V2 (blind 65 %): the distractors were fillers; now the hedge and the example reading of "Like," both fit
    //   what comes before
    // why: tones it down ← like as a hedge (〜みたいな); an example ← like = for example, about to show why
    { id: 'm1', skill: 'marker', level: 'B2', point: 'like', seg: [81.9, 88.1],
      stem: 'After “the best host”, what does April’s next “Like,” do?',
      choices: ['It adds an even bigger claim', 'It tones the claim down a bit', 'It starts an example of why'],
      a: 0,
      cue: '「Like」のあと、何より上だと言うか。',
      line: 'you’re the best host. *Like, even better than* my all-time favorite host',
      said: '「最高の司会者。っていうか、大好きな司会者より上」と言う。',
      mean: 'Like ＝ 「っていうか」。前の言葉にさらに大きな主張を重ねる。',
      trap: 'like を「〜みたいな」のぼかしや例と取りやすい。文頭の Like, のあとに even が来たら言い足し。',
      use: 'It’s good. Like, really good.（いいよ。ていうか、すごくいい）' },

    // R fix: V2 (blind 65 %): the key was the only reading tied to her; now a tease reading competes, and the length
    //   tell is gone
    // why: joking nobody would ← crazy = ばかげた, so she mocks the claim; the show is wild ← "crazy" heard as about
    //   the show (train wreck)
    { id: 't1', skill: 'attitude', level: 'B2', point: 'crazy', seg: [81.9, 88.1],
      stem: 'When April adds “which is crazy”, what is she saying?',
      choices: ['She’s surprised at how high she rates him', 'She’s joking that no one rates him that high', 'She means the show itself is wild and crazy'], a: 0,
      cue: '直前の「all-time favorite」との関係。',
      line: 'even better than *my all-time favorite host*, Tom Snyder, which is crazy.',
      said: '「一番好きな司会者よりも上。我ながらびっくり」と言う。',
      mean: '大好きな人より上だと言った自分に驚いている。ほめ言葉を強めている。',
      trap: 'crazy を「ばかげた」と取ると皮肉になる。which は直前の文全体を指す。',
      use: 'Better than the book, which is crazy.（原作より上。自分でも驚き）' },

    // R fix: V2 (blind 70 %): the distractors were a complaint and jealousy; now two other worries built from her own
    //   words (the kids, "meant to do")
    // why: the kids ← "all those kids love you" comes just before; not ready ← "doing what you're meant to do" heard as
    //   "he isn't done yet"
    { id: 'i1', skill: 'infer', level: 'B2', point: 'lose', reveals: ['cant'], seg: [88.2, 95.5],
      stem: 'What is April really worried about as she finishes?',
      choices: ['That she’ll be the reason he gives up the show', 'That the kids will be lost without their host', 'That he isn’t ready to leave the show yet'], a: 0,
      cue: '最後の文、「the person that makes you」のあと。',
      line: 'you’re doing what you’re meant to do. And *I can’t be the person that makes you lose what you love*.',
      said: '「あなたは天職をやっている。あなたの大好きなものを奪う人にはなれない」と言う。',
      mean: '自分のせいで彼が番組をやめることになるのがつらい、という気持ち。',
      trap: 'kids や meant to do が耳に残りやすい。最後の文の I で、心配の中心が分かる。',
      use: 'I don’t want to be why you quit.（私のせいで辞めてほしくない）' },

    // R fix: V2 (blind 60 %): "could" and "can" made no sense here, so the gap read as can't/won't; now three
    //   negatives that all fit, and only the sound decides
    // why: can ← the t of can't drops and only the vowel tells them apart; won't ← a refusal heard in her tone;
    //   shouldn't ← a softer refusal that fits, and its -n't ending sounds alike
    { id: 's1', skill: 'sound', level: 'B2', point: 'cant', seg: [91.2, 95.55],
      stem: 'Fill the gap: “And I ___ be the person that makes you lose…”',
      choices: ['can', 'can’t', 'won’t', 'shouldn’t'], a: 1,
      cue: '「And I」のあと。母音の長さと強さ。',
      line: 'And I *can’t* be the person that makes you lose what you love.',
      said: '「あなたの大好きなものを奪う人にはなれない」。',
      mean: 'can’t は t がほぼ消えるが、母音が長く強い。can なら弱く「クン」に近い。',
      trap: '意味だけでは won’t や shouldn’t も合う。t を待たず、母音が強く長い「キャーン」を聞く。',
      use: 'I can’t make it tonight.（今夜は行けないんだ）' },

    // R fix: V2 (blind 70 %): the key was the only "clever" choice; now two choices reuse her phrase, and only the
    //   new target (her, not the show) decides
    // why: agrees ← "what I love" echoes her words, so it sounds like agreement; changes the subject ← "See, but…"
    //   heard as brushing her off
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'what', seg: [92.8, 98.6],
      stem: 'How does Andy’s first reply use what April just said?',
      choices: ['It reuses her phrase to point at her instead', 'It repeats her phrase to show he agrees', 'It brushes off her worry to change the subject'], a: 0,
      cue: 'April の最後の三語と、Andy の最初の文。',
      line: 'makes you lose *what you love*. — See, but *you’re what I love*.',
      said: 'April「大好きなものを奪えない」、Andy「でも、僕の大好きなのは君」。',
      mean: '相手の what you love を使い、指す先を番組から April に変える。',
      trap: '同じ語が返ると同意に聞こえやすい。but のあと、何を指すかを聞く。',
      use: 'You need a break? So do I.（休みが要るって？僕もだよ）' },

    // anchor: 94.8–96.2 s April ends on "what you love" (the show), and Andy's "but" sets up a contrast: the new
    //   information is who, not how much, so the stress goes on "you're"
    // R fix: V2 (blind 80 %): the distractors were a vague emotion and a question; now "I" (vs the kids April named) is
    //   a real contrast too, so only the audio settles it
    // why: on "I" ← April said "all those kids love you", so a contrast of lovers (me, not the kids) is possible; on
    //   "love" ← the stress on the emotion, love vs liking
    // retired: the ear-check policy: a C2 stress item (the stress in “See, but you're what I love” on “you're”, 95.8 s); back
    //   after the ear check
    { id: 'nt2', skill: 'sound', level: 'C2', point: 'what', seg: [92.8, 98.6], retired: true,
      stem: 'In “See, but you’re what I love”, where is the stress, and why?',
      choices: ['On “you’re”: you, not the show, are what I love', 'On “I”: I love you, not just the kids do', 'On “love”: it’s love, not just liking'], a: 0,
      cue: '短い文で、いちばん強く長く聞こえる語。',
      line: 'makes you lose what you love. — See, but *you’re* what I love.',
      said: 'April の「大好きなもの（番組）」に、Andy が「でも、大好きなのは君」と返す。',
      mean: 'but のあとは「何を」の入れかえ。you’re が強いと「番組じゃなく君」。',
      trap: 'kids love you から「僕も」の対比を考えやすい。何と比べるかで強勢が決まる。',
      use: 'Not the beach. You’re the reason I came.（海じゃない、君に会いに来た）' },

    // R fix: V2 (blind 80 %): the key was the only sincere choice; now all three say she costs him nothing, for
    //   different reasons
    // why: would have quit ← "the greatest job I've ever had" forgotten, "any of this" heard as tired of it; a show
    //   anywhere ← "we go to Washington" heard as the show moving
    { id: 'i2', skill: 'infer', level: 'C1', point: 'reason', seg: [95.3, 109.6],
      stem: 'How does Andy’s list of what April did answer her worry?',
      choices: ['He owes his show to her, so she can’t cost it', 'He’d have quit soon anyway, so she costs nothing', 'He can do a show anywhere, so she costs nothing'], a: 0,
      cue: '「the only reason」と「Without you」の部分。',
      line: 'You’re *the only reason I have any of this*. … *Without you, I wouldn’t be anything.*',
      said: '「君がいたからこれがある。信じて支えてくれた。君なしでは何者でもない」。',
      mean: '番組を奪うどころか、番組があるのは君のおかげ。彼女の心配を逆にしている。',
      trap: 'どれも「君のせいじゃない」に聞こえる。the only reason が理由を示す。',
      use: 'I couldn’t have done it without you.（君なしではできなかった）' },

    // R fix: V2 (blind 60 %): the distractors were show jobs nobody would pick; now near forms: believed vs believed
    //   in, supported vs surprised
    // why: believed him ← "in" is weak and drops, and "stood up for" is close in meaning to supported; surprised ←
    //   sup-/sur- and -ported/-prised sound alike in a fast list
    { id: 'd3', skill: 'detail', level: 'B1', point: 'believed', seg: [98.5, 103.7],
      stem: 'What does Andy say April did for him?',
      choices: ['Believed in him and supported him', 'Believed him and stood up for him', 'Believed in him and surprised him'],
      a: 0,
      cue: '「You」で始まる短い文が三つ続く。',
      line: '*You believed in me. You supported me.* You make me happy.',
      said: '「信じてくれた。支えてくれた。幸せにしてくれる」と並べる。',
      mean: 'believe in ～ ＝ 人の力を信じる。believe（言葉を信じる）とは別。',
      trap: '弱い in を落とすと「言葉を信じた」になる。supported と surprised も近い。',
      use: 'Thanks for believing in me.（信じてくれてありがとう）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'happier', seg: [103.6, 107.0],
      stem: 'Type what Andy says: “Happier than I ___.” (5 words)', answer: 'ever thought i could be',
      cue: '「Happier than I」のあと。最後の二語は弱い。',
      line: 'Happier than I *ever thought I could be*.',
      said: '「思っていた以上に幸せ」と言う。',
      mean: 'than I ever thought ＝ 思ったこともないほど。比較を最大まで強める。',
      trap: 'thought I が「ソーライ」とつながり、could be は短く弱い。語数で確かめる。',
      use: 'It was easier than I ever thought.（思ってたよりずっと簡単だった）' },

    // anchor: 106.5–118.2 s the brand list sits between "Without you, I wouldn't be anything" and "As long as I'm
    //   with you, I'm gonna be happy": every line around it is sincere
    // R fix: V2 (blind 65 %): the key was the only sincere choice; now two sincere readings split on need vs choice
    //   ("what keeps me going")
    // why: the one he'd choose ← brands heard as loyalty, the right tone but the wrong point; just a joke ← the laugh,
    //   and the goofy list, heard as him dropping the serious tone
    // retired: with nt2 (one C2 alone is under the tier's 2)
    { id: 'nt1', skill: 'attitude', level: 'C2', point: 'brands', seg: [106.7, 118.7], retired: true,
      stem: 'How should April take “You’re my Verizon, Chipotle…”?',
      choices: ['As sincere: she’s what he needs every day', 'As sincere: she’s the one he’d always choose', 'As a joke to lighten things, not meant'], a: 0,
      cue: '前後の文が、どんな調子か。',
      line: 'Without you, I wouldn’t be anything. … *You’re my Verizon, Chipotle*… *As long as I’m with you, I’m gonna be happy.*',
      said: '「君なしでは何者でもない」「君は僕のベライゾン、チポトレ」「君といれば幸せ」と続ける。',
      mean: '会社名は Andy なりの「生活に欠かせないもの」。笑えても本気。前後の真剣な文が、それを示す。',
      trap: '笑いが起きると冗談と取りやすい。直前の what keeps me going が比喩の中身。',
      use: 'You’re my Wi-Fi. I mean it.（君は僕のWi-Fiだ。本気だよ）' },

    // R fix: V2 (blind 65 %): "pet name she hates" was a filler; now a DC trip reading built on the move
    // why: sponsors ← a TV show and brand names, so it sounds like a sponsor read; places in DC ← Chipotle is a
    //   restaurant, and the move to DC comes next
    { id: 'h3', skill: 'humor', level: 'C1', point: 'brands', seg: [109.4, 116.2],
      stem: 'Why does Andy’s line right after “what keeps me going” get a laugh?',
      choices: ['He praises her with a list of big brands', 'He reads out the show’s sponsors by mistake', 'He lists places he’d take her in DC'], a: 0,
      cue: '「You’re my」のあとに並ぶ三つの語。',
      line: 'You’re what keeps me going. *You’re my Verizon, Chipotle*…',
      said: '「君が僕を動かしてる。君は僕のベライゾン、チポトレ…」と、会社の名前を並べる。',
      mean: '毎日頼る電話会社や店の名前で「なくてはならない人」と言う。真剣な場面にずれた比喩。',
      trap: 'テレビなのでスポンサー紹介に聞こえやすい。You’re my のあとは彼女の話。',
      use: 'You’re my morning coffee.（君は僕の朝のコーヒーだ）' },

    // R fix: V2 (blind 55 %): now two "sure" readings that differ on the feeling, and an "excited but" reading.
    //   Added reveals: ['plan']: the line states d4's key
    // why: sad to leave the kids ← the usual "giving up a dream" script; waiting for her ← the "Okay?" that follows
    //   heard as asking her to decide
    { id: 't2', skill: 'attitude', level: 'B2', point: 'sure', reveals: ['plan'], seg: [115.9, 124.6],
      stem: 'How does Andy sound about leaving, as he ends his answer?',
      choices: ['Sure of it, and excited for what’s next', 'Sure of it, but sad to leave the kids', 'Excited, but waiting for her to agree'], a: 0,
      cue: '最後の文の形容詞二つ。',
      line: 'I’m gonna be happy. So we go to Washington, D.C. And then we figure out the *next cool and awesome thing*',
      said: '「君といれば幸せ。ワシントンに行って、次の最高なことはそこで考えよう」と言う。',
      mean: 'cool and awesome と明るい語で、迷いなく前を向いている。',
      trap: '夢を手放す話は悲しげだと思い込みやすい。明るい語があるかを聞く。',
      use: 'Let’s see what’s next. I’m excited.（次は何かな。楽しみ）' },

    // R fix: V2 (blind 55 %): the distractors were invented plans; now two built from “next … thing” and "from there"
    // why: start right away ← "the next cool and awesome thing" heard as a plan already made; decide whether to come
    //   back ← "from there" heard as a return trip
    { id: 'd4', skill: 'detail', level: 'B1', point: 'plan', seg: [115.9, 124.6],
      stem: 'What is Andy’s plan once they get to Washington?',
      choices: ['Work out what comes next once there', 'Start the next big thing right away', 'Decide there whether to come back'], a: 0,
      cue: '「And then we」のあとの動詞。',
      line: 'So we go to Washington, D.C. And then we *figure out the next* cool and awesome *thing from there*.',
      said: '「ワシントンに行って、次に何をするかはそこで考える」。',
      mean: 'figure out ＝ 考えて決める。まだ具体的な計画はない。',
      trap: 'next thing を決まった計画と取りやすい。figure out は「これから考える」。',
      use: 'We’ll figure it out when we get there.（着いてから考えよう）' },

    // R fix: V2 (blind 70 %): the "live TV" filler made the key stand out; now the key is plainer and a "relief"
    //   reading competes. Also added reveals: ['nice']: the line states d2's key.
    // why: April was nice ← "being nice to someone" heard as about her speech; relieved ← "now I can go finish the
    //   show" heard as the hard part being over
    { id: 'h4', skill: 'humor', level: 'C1', point: 'checklist', reveals: ['nice'], seg: [127.3, 138.2],
      stem: 'Why is Andy’s comment right after “Okay” funny?',
      choices: ['He treats his speech as one more show task', 'He’s glad the hard part of the show is over', 'He thinks April was the one being nice to him'], a: 0,
      cue: '「Okay」のあと、最初に言うこと。',
      line: '*That was a very good being nice to someone. I did it.* Now I can go finish the show.',
      said: '「今のはとても良い『誰かに優しく』だった。できた。番組に戻れる」と言う。',
      mean: '本気の愛の言葉を、チェックリストの課題の一つとして数えるのがおかしい。',
      trap: 'Now I can go finish を「ほっとした」と取りやすい。課題の名前のままなのが笑い。',
      use: 'Workout done. Check!（運動、完了。チェック！）' },

    // R fix: V2 (blind 70 %): the two karate-training distractors made the moral obvious; now three morals, two
    //   built from words in the song
    // why: never stop fighting ← "fighting" is said, but after "not about"; stay a team ← "forever on my team" is said
    //   near the end
    { id: 'g2', skill: 'gist', level: 'B1', point: 'message', seg: [137.4, 184.5],
      stem: 'What is the main message of Andy’s sign-off to the kids?',
      choices: ['Know yourself, and be kind as you aim high', 'Be brave, and never stop fighting for dreams', 'Stay a team, and never forget each other'], a: 0,
      cue: '「not about」と「It’s about」の対比。',
      said: '「カラテは戦いじゃない。自分を知り、優しく正直に夢を目指すこと」と話す。',
      mean: '最後の回のまとめ。番組の決まり文句で別れを告げる。',
      trap: 'fighting や team が聞こえても、前に not about。It’s about のあとが本題。',
      use: 'It’s not about winning. It’s about trying.（勝つことじゃない、挑むことだ）' },
  ]
};
