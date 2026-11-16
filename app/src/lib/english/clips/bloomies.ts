// “Did You Go with Her to Bloomingdales? | Friends” (the official Friends channel, Best of Season 2): Monica agrees to
// go shopping with Julie, the others warn her it's like cheating on Rachel, and when Rachel finds the receipt the two
// play the scene as a lover's affair coming out.
// Segments from the captions, words from whisper (2026-11-16). Whisper loops “I just really need to take a look at it”
// from 246 s; the talk ends at 245.6 s.
// Speakers: Rachel and Monica are named in the audio (4 s, 52.6 s, 151 s, 220.6 s). Julie's boyfriend is placed by
// “Hi honey” and “Jules tells me” (45 s, 77.5 s), never named. The vet excuse (33 s) has no named speaker.
// Untested on purpose: Rachel's mutter at 19.4 s (whisper “what a bitch”, captions “what a”), “you can borrow it”
// (captions) vs “you could borrow it” (whisper) at 118.4 s, and who says “…put the receipt back in your pocket” (141 s:
// Monica finishing her story or Rachel finishing it for her; h3 doesn't depend on it).
// REVIEW 2026-11-16: pass 5, fix 17, drop 1 (a1), new 0; ear checks 0
// OPEN: h2 and g2 are still about 50 % blind (the phrase in h2's stem, and the clip's whole frame in g2). d4's key is
//   still known to anyone who knows the show (Julie and Ross).
// EAR CHECK: none. a1, the only tone item, is dropped.
import type { Clip } from '../types.ts';

export const bloomingdales: Clip = {
  id: 'bloomies', video: 'KGtnNI2_aBs', title: 'Did You Go with Her to Bloomingdales?', dur: 258, wpm: 126, band: 'slow',
  tags: ['友だち', '買い物'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R drop: a1 (attitude C1, muffins). The key rested on tone and the Rachel–Julie backstory (V1), and "Kindly,
    //   though she is very busy" was defensible from the words, since Julie herself says "you're busy" (K1). It was also
    //   55 % blind. Never shipped, so it's deleted. Attitude stays at 2 (c2, a2), and C1 at 4 of 20.

    // R fix: V2 (blind 60 %) and S4: the key was the only choice with a reason the friend would have. Now "starting"
    //   (the quitting/starting flip) and "manager running a sale". The segment ended on "No, I" (33.0 s); now 23.8–32.7 s.
    // why: starting ← "who's quitting tomorrow" with the verb lost, so it sounds like a new job; manager and sale ←
    //   "friend at Bloomingdale's" and "tomorrow" heard as someone in charge of a sale day
    { id: 'd1', skill: 'detail', level: 'B1', point: 'discount', seg: [23.8, 32.7],
      stem: 'Why can Julie’s friend help them shop cheaply?',
      choices: ['He’s quitting, so he’ll use up his discount', 'He’s starting, and new staff get a discount',
                'He’s the manager, and runs a sale tomorrow'], a: 0,
      cue: '「who’s」のあとと、「and he」のあと。',
      line: 'I have this friend at Bloomingdale’s *who’s quitting tomorrow* and he wants to *abuse his discount*.',
      said: '「デパートの友だちが明日辞めるから、社員割引を使いまくりたいんだって」と誘う。',
      mean: '辞める前に、社員割引を最後まで使い切りたい。だから一緒に安く買える。',
      trap: 'tomorrow から「明日セール」と取りやすい。quitting ＝ 辞める。',
      use: 'My friend can get us a discount.（友だちが割引してくれるよ）' },

    // R fix: V2 (blind 75 %): the cost filler made the key the only choice about Rachel. Now "Rachel would feel left
    //   out", the other reading of "What about Rachel?", which "cheating on Rachel" settles.
    // why: friend in trouble ← "abuse his discount" heard as breaking the store's rules; left out ← "What about
    //   Rachel?" heard as "she wasn't invited"
    { id: 'g1', skill: 'gist', level: 'B2', point: 'plan', reveals: ['worship', 'cheat'], seg: [24, 92],
      stem: 'Why do the others think Monica’s shopping plan is a problem?',
      choices: ['Rachel would take it as disloyal', 'Julie’s friend could get in trouble', 'Rachel would feel left out of it'],
      a: 0,
      cue: '「What about」のあとの説明。',
      said: '「Rachel はどうするの」「裏切るようなもの」と止められる。',
      mean: '問題は、Julie と出かけること自体が裏切りになること。',
      trap: 'What about Rachel? を「誘われない」と取りやすい。続く cheating on が答え。',
      use: 'What about Rachel, though?（でも Rachel はどうするの？）' },

    // why: soldier ← vet is also short for veteran (退役軍人); pet clinic ← "vet" tied to the grandmother in the wrong
    //   way
    { id: 'h1', skill: 'humor', level: 'B2', point: 'vet', seg: [32.3, 36],
      stem: 'Why does the excuse for not coming along get a laugh?',
      choices: ['A vet is a doctor for animals, not people', 'Her grandmother is an old soldier, a “vet”',
                'Her grandmother works at a pet clinic'], a: 0,
      cue: '文の最後の一語。',
      line: 'I have to take my grandmother *to the vet*.',
      said: '「おばあちゃんを vet に連れていく」と断る。',
      mean: 'vet ＝ 獣医。人間のおばあちゃんを動物病院に、という言い方が笑い。',
      trap: 'vet は veteran（退役軍人）の短縮でもあるが、take ～ to the vet は「獣医に連れていく」の形。',
      use: 'My cat has to see the vet.（猫を獣医に見せないと）' },

    // R fix: S4: the segment began between "shopping" and "with her" (55.0 s); now 54.0 s.
    // why: better deal ← cheat = ずるをする, with "discount" in mind; lie about the price ← cheat = だます, the money
    //   reading
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'cheat', seg: [54.0, 63.5],
      stem: 'What does “cheating on Rachel” mean here?',
      choices: ['Being unfaithful to her, like a lover', 'Getting a better deal behind her back',
                'Telling her a lie about the price'], a: 0,
      cue: '直後の前置詞 on に注目。',
      line: 'it’s like *cheating on Rachel* in her house of worship.',
      said: '「Rachel の聖地で、Rachel を裏切るようなもんだ」と言う。',
      mean: 'cheat on ＋人 ＝ 浮気する。友だちとの買い物を、恋人の浮気にたとえている。',
      trap: 'cheat はカンニングやずるの意味が有名。on のあとに人が来たら「浮気」。',
      use: 'Are you cheating on your barber?（いつもの床屋を裏切ったの？）' },

    // R fix: V2 (blind 85 %): "the same church" was the only other religious reading, and too literal to pick. Now
    //   "Rachel worships Julie", the wrong target. Still about 50 % blind (open).
    // why: looks up to Julie ← "worship" heard as aimed at the person just named; job ← "her" store heard as where she
    //   works
    { id: 'h2', skill: 'humor', level: 'C1', point: 'worship', reveals: ['cheat'], seg: [58, 63.5],
      stem: 'What makes “in her house of worship” funny?',
      choices: ['It treats a store as Rachel’s holy place', 'It says Rachel looks up to Julie like a god',
                'It says Rachel works at that same store'], a: 0,
      cue: '「Bloomingdale’s」と並べて考える。',
      line: 'you’re going to *Bloomingdale’s* with Julie, it’s like cheating on Rachel *in her house of worship*.',
      said: '「Rachel の神殿で裏切るようなもの」と言う。',
      mean: 'house of worship ＝ 教会や寺。この店は Rachel の聖地、という大げさなたとえ。',
      trap: '文字どおり教会と取ると合わない。直前の店の名前が「神殿」。',
      use: 'This bakery is my church.（このパン屋は私の聖地）' },

    // R fix: V2 (blind 60 %): "in a wild way" was the only hedge, on the key. All three are now short and plain.
    // why: repeat ← "she will kill you" taken literally, as a report of Rachel's words; go after Julie ← "she… you"
    //   heard as aimed at Julie, the wrong target
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'kill', seg: [64.6, 71.8],
      stem: 'What is the line about “a dog in the street” meant to do?',
      choices: ['Say how angry Rachel will be', 'Repeat what Rachel said she’d do', 'Say Rachel would go after Julie'], a: 0,
      cue: '「Monica」と呼んだあと、くり返す部分。',
      line: 'Monica, *she will kill you*. She will kill you *like a dog in the street*.',
      said: '「Monica、殺されるぞ。道ばたの犬みたいに殺される」と2回言う。',
      mean: 'kill you は「すごく怒る」の大げさな言い方。くり返して重さを伝える。',
      trap: '本当の脅しと取ると話が重すぎる。日常の she’ll kill me は「怒られる」程度。',
      use: 'My mom will kill me if I’m late.（遅れたら母に怒られる）' },

    // R fix: V2 (blind 55 %): reworded the key to "feels guilty toward Rachel". It touches g1's fact, but g1 is a gist
    //   and always comes first in a draw, so nothing leaks. A `reveals: ['plan']` broke the play-3 C2 slot (sim).
    // why: discount ← "abuse his discount" from earlier, the last-heard reason for going; asked by him ← "I really
    //   appreciate it" heard as thanks for a favor he asked for (the wrong direction: "Jules tells me" shows he only
    //   just heard of it)
    // anchor: 66.1–71.2 s "she will kill you like a dog in the street"; 80.5–82.6 s "Oh yeah, um, it's actually not
    //   that big a deal" (a hesitation, then shrinking it); 83.4–84.4 s "It's a big deal to me": the trip matters, so
    //   the shrinking is for her own sake
    { id: 'c2', skill: 'attitude', level: 'C2', point: 'bigdeal', seg: [64.6, 88.9],
      stem: 'When Monica calls the trip “not that big a deal”, what is she not saying?',
      choices: ['That she feels guilty toward Rachel', 'That she is only going for the discount',
                'That he was the one who asked her'], a: 0,
      cue: '直前に言われたことと、「um」のためらい。',
      line: 'She will kill you… — Jules tells me… — Oh yeah, um, it’s actually *not that big a deal*.',
      said: '「殺されるぞ」の直後に買い物の話をされ、「えっと、大したことじゃない」と答える。',
      mean: '直前に Rachel が怒ると言われたばかり。小さく言うのは、後ろめたさを隠すため。',
      trap: '割引目当てを隠すと取りやすいが、割引は誰も気にしていない。隠す中身は、直前に言われたことで決まる。',
      use: 'Oh, it’s nothing, really.（いや、なんでもないって）' },

    // R fix: V2 (blind 65 %): "Asking him to pay" was a filler. Now "asking him to keep it quiet", which her guilt
    //   makes tempting. Choices are shorter and the same length.
    // why: back out ← "not that big a deal" heard as losing interest, the Japanese 遠回しの断り; keep it quiet ← her
    //   guilt about Rachel suggests a request for secrecy
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'bigdeal', seg: [76.2, 88.9],
      stem: 'When Julie’s boyfriend brings up the trip, what is Monica doing?',
      choices: ['Making the trip sound small', 'Hinting she’d like to back out', 'Asking him to keep it quiet'],
      a: 0,
      cue: '「Oh yeah, um」のあと。',
      line: '*it’s actually not that big a deal*. — It’s a big deal to me.',
      said: '「実は大したことじゃない」と言うと、「僕には大ごとだ」と喜ばれる。',
      mean: '後ろめたい予定を小さく見せ、話を流そうとしている。',
      trap: 'not a big deal を「行きたくない」と取りやすい。最後は You’re welcome で、断っていない。',
      use: 'Don’t make a big deal out of it.（大げさにしないで）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'bigdeal', seg: [81.2, 83.4],
      stem: 'Type what Monica says: “It’s actually ___.” (5 words)', answer: 'not that big a deal',
      cue: '「actually」のすぐあと。',
      line: 'Oh yeah, um, it’s actually *not that big a deal*.',
      said: '「実はそんなに大したことじゃないの」と言う。',
      mean: 'not that big a deal ＝ そこまで大ごとじゃない。a はほぼ聞こえず、big a が「ビガ」になる。',
      trap: 'a が消えて big deal の4語に聞こえやすい。語の数を5つで確かめる。',
      use: 'It’s not that big a deal.（そこまで大ごとじゃないよ）' },

    // why: lunch ← "had some lunch" comes next; shopping ← the shopping trip from the first scene
    { id: 'd3', skill: 'detail', level: 'B1', point: 'park', seg: [104, 107.6],
      stem: 'When Rachel asks where everybody is, what is she told?',
      choices: ['They took Ben to the park', 'They went out to have lunch', 'They went shopping for the day'], a: 0,
      cue: '「Where is everybody?」への返事。',
      line: 'Where is everybody? — They *took Ben to the park*.',
      said: '「みんなは？」に、「Ben を公園に連れていった」と返る。',
      mean: 'took ～ to the park ＝ 公園に連れていった。だから部屋には二人だけ。',
      trap: 'すぐあとの lunch に引かれやすい。lunch は Monica 自身の話。',
      use: 'They took the kids to the beach.（子どもたちを海に連れていった）' },

    // R fix: V2 (blind 75 %): "a money fight over a big bill" now names roommates, which they are, so it sounds as right
    //   as the key. Still about 50 % blind (open).
    // why: money fight ← "$53" and "credit card" are heard; jacket ← "thanks for your jacket" and the receipt in its
    //   pocket
    { id: 'g2', skill: 'gist', level: 'B2', point: 'scene', reveals: ['affair', 'names'], seg: [104, 246.6],
      stem: 'How does the talk between Rachel and Monica play out?',
      choices: ['Like a couple’s fight about cheating', 'Like roommates fighting over money',
                'Like a mix-up over a borrowed jacket'], a: 0,
      cue: '「We only did it once」など、謝り方の言葉。',
      said: 'レシートから Julie との買い物がばれ、Monica は「一回だけ」「意味はなかった」と謝る。',
      mean: '友だちとの買い物を、恋人の浮気がばれた場面の言葉で演じている。',
      trap: '53ドルやカードの話が出るのでお金のけんかに見えるが、問題は誰と行ったか。',
      use: 'I never meant to hurt you.（傷つけるつもりはなかったの）' },

    // R fix: V2 (blind 60 %): the lonely and next-time choices were weak. Now a self-mocking joke and a sincere "treat
    //   for myself", the two readings a fluent learner takes.
    // why: joking ← "Just me" heard as self-mockery about having no friends; treat ← "quality time with me" taken at
    //   face value, the literal reading
    { id: 'i2', skill: 'infer', level: 'C1', point: 'alone', seg: [107.3, 114.5],
      stem: 'What does Monica’s answer about where she has been suggest?',
      choices: ['She says too much, as if hiding something', 'She is joking that she has no friends',
                'She is proud of a treat just for herself'], a: 0,
      cue: '「Just me」のあとに足す言葉。',
      line: 'Just out. Had some lunch. *Just me. Little quality time with me.*',
      said: '「ランチ。一人で。自分とのいい時間」と、聞かれていないことまで言う。',
      mean: '「一人で」を何度も足すのは不自然。言いすぎて、かえって隠しごとが見える。',
      trap: 'quality time を本気の言葉と取りやすい。聞かれていない説明が続いたら、隠しごとを疑う。',
      use: 'Just me, a book, and some coffee.（私と本とコーヒーだけ）' },

    // why: $43 ← forty/fifty share the -ty ending; $63 ← sixty/fifty both begin with a hiss-like sound
    { id: 'n1', skill: 'number', level: 'B1', point: 'cost', seg: [127.2, 131.6], keep: true,
      stem: 'How much did the “lunch alone” cost?',
      choices: ['$43', '$53', '$63'], a: 1,
      cue: '「cost you」のあと、「uh」のあと。',
      line: 'if you were at lunch alone, how come it cost you, uh, *53*?',
      said: '「一人でランチなら、なんで53ドルもするの？」と聞く。',
      mean: 'fifty-three ＝ 53。一人分にしては高い、という指摘。',
      trap: 'forty と fifty は語尾が同じ。最初の音が「フォ」か「フィ」か、sixty の「シ」かで聞き分ける。',
      use: 'How come it cost so much?（なんでそんなに高いの？）' },

    // R fix: V2 (blind 50 %): "must not have" made no sense with a stolen card, so the field was three. Now "could
    //   have", which fits as well as the others.
    // why: might ← must/might share the m- and the t, with the vowel weak; may ← "have" nearly gone, so only "m-" is
    //   left; could ← the weak "-'ve" ending is the same, and "probably" just before invites a guess
    { id: 's1', skill: 'sound', level: 'B2', point: 'musthave', seg: [134.6, 139.8],
      stem: 'Fill the gap: “Someone ___ stolen my credit card.”',
      choices: ['must have', 'might have', 'could have', 'may have'], a: 0,
      cue: '「Someone」のすぐあと。',
      line: 'Someone *must have* stolen my credit card',
      said: '「誰かがカードを盗んだに違いない」と言う。',
      mean: 'must have は「マスタヴ」「マスタ」と縮む。過去への強い推量（〜したに違いない）。',
      trap: 'might なら「〜したかも」と弱い。母音が「ア」か「アイ」かで聞き分ける。',
      use: 'I must have left it at home.（家に置いてきたに違いない）' },

    // R fix: V2 (blind 50 %): reworded all three to one length and form; the lent-card choice is now "the card turns up
    //   in her bag", the usual end of a lost-card story.
    // why: card turns up ← "my credit card" heard as the usual lost-and-found story; Rachel used it ← "stolen" and
    //   "your" heard as an accusation
    { id: 'h3', skill: 'humor', level: 'C1', point: 'receipt', reveals: ['musthave'], seg: [134.6, 143.5],
      stem: 'Why does the stolen-card story fall apart as it goes on?',
      choices: ['A thief wouldn’t return the receipt', 'The card turns up in Monica’s bag',
                'Rachel admits she used the card'], a: 0,
      cue: '「and sort of just」のあと。',
      line: 'Someone must have stolen my credit card *and sort of just put the receipt back in your pocket*.',
      said: '「誰かがカードを盗んで…レシートをポケットに戻した？」と話が続く。',
      mean: '泥棒がレシートを返すはずがない。言い訳を最後まで言うと、ばかばかしさが出る。',
      trap: 'card や stolen が聞こえるので、二人の間の貸し借りや盗みの話と取りやすい。',
      use: 'That makes no sense at all.（全然筋が通らない）' },

    // R fix: V2 (blind 65 %): "three different friends" was weak. Now "Rachel keeps mishearing", the reading of her
    //   "Who?… What?", which the changing names refute.
    // why: can't remember ← the changing names taken at face value; mishearing ← Rachel's "Who?" and "What?" heard as
    //   the reason for each new answer
    { id: 'i3', skill: 'infer', level: 'B2', point: 'names', seg: [150.6, 161.5],
      stem: 'When asked who she had lunch with, why does Monica’s answer keep changing?',
      choices: ['She hopes to hide the name Julie', 'Rachel keeps mishearing the name',
                'She can’t remember who it was'], a: 0,
      cue: '3回の答えの、音の似かた。',
      line: 'Who did you have lunch with? — *Judy.* — Who? — *Julie.* — What? — *Jody.*',
      said: '「誰とランチ？」に、「ジュディ」「ジュリー」「ジョディ」と似た名前を言い直す。',
      mean: '本当の名前をほかの名前にまぎれさせて、ぼかそうとしている。',
      trap: 'Who? What? から聞き返しへの言い直しと取りやすいが、毎回名前が変わる。わざとぼかしている。',
      use: 'Who? Sorry, I didn’t catch the name.（誰？名前が聞き取れなかった）' },

    // R fix: V2 (blind 50 %, from show knowledge): the key named "Monica's brother", the only choice with a person.
    //   All three are now reasons of the same shape.
    // why: discount ← the Bloomingdale's deal from the first scene; new ← the usual "be nice to the new girl" script
    { id: 'd4', skill: 'detail', level: 'B1', point: 'why', seg: [161.6, 168.6],
      stem: 'Why was Monica nice to Julie at first, she says?',
      choices: ['She was going out with her brother', 'She could get her a store discount', 'She was new in town and alone'],
      a: 0,
      cue: '「because」のあと。',
      line: 'I was just trying to be nice to her *because she was my brother’s girlfriend*.',
      said: '「最初は、兄の彼女だから親切にしようとしただけ」と言う。',
      mean: 'brother’s girlfriend ＝ 兄の恋人。だから仲良くしようとした、という説明。',
      trap: '割引の話が先に出ているので引かれやすい。理由は because のあと。',
      use: 'I was just trying to be nice.（親切にしようとしただけなの）' },

    // R fix: V2 (blind 75 %): "hates shopping with Julie" was weak. Now "she hints they are dating", the literal reading
    //   of the affair words, which the last word "shopping" refutes.
    // why: dating ← the affair words taken literally; blames Julie ← "one thing led to another" heard as Julie pushing
    //   her
    { id: 'h4', skill: 'humor', level: 'C1', point: 'affair', reveals: ['onething'], seg: [163.6, 178],
      stem: 'Why does Monica’s confession get a laugh?',
      choices: ['She tells a shopping trip like a love affair', 'She hints she and Julie are secretly dating',
                'She blames Julie for making her go along'], a: 0,
      cue: '「before I knew it」のあとの一語。',
      line: 'when it started… *one thing led to another* and *before I knew it, we were shopping*.',
      said: '「最初は親切のつもりが、なりゆきで…気づいたら買い物してた」と打ち明ける。',
      mean: '浮気の告白の決まり文句を並べ、最後の一語が「買い物」。期待とのずれが笑い。',
      trap: '浮気の言葉を文字どおり取りやすいが、ここは告白の型。最後の語で型が崩れる。',
      use: 'Before I knew it, it was 3 a.m.（気づいたら夜中の3時だった）' },

    // R fix: V2 (blind 85 %): "Because someone told her to" was weak. Now "by mistake, after a mix-up", the wrong
    //   implication of an excuse.
    // why: all at once ← "before I knew it" heard as suddenly; mix-up ← an excuse heard as an accident
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'onething', seg: [169.4, 177.5],
      stem: 'What does “one thing led to another” say about how it happened?',
      choices: ['Bit by bit, without a plan', 'All at once, before she could think', 'By mistake, after a mix-up'], a: 0,
      cue: '「and then」のあとの決まり文句。',
      line: 'and then *one thing led to another* and before I knew it…',
      said: '「それから、なりゆきで、気づいたら…」と言う。',
      mean: 'one thing led to another ＝ なりゆきで、少しずつ。言い訳の決まり文句。',
      trap: 'before I knew it から「一気に」と取りやすいが、出来事が次を呼んで少しずつ進んだ。',
      use: 'One thing led to another, honestly.（まあ、なりゆきでね）' },

    // R fix: V2 (blind 65 %): "agrees it meant nothing" was weak. Now "believes it, but is still hurt", the grudging
    //   acceptance frame.
    // why: still hurt ← "yeah" heard as yes, with the flat tone read as hurt; calms down ← the Japanese frame: an
    //   apology, then acceptance
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'yeahright', seg: [185.5, 194.2],
      stem: 'How does Rachel take “It didn’t mean anything to me”?',
      choices: ['She doesn’t believe it at all', 'She believes it, but is still hurt',
                'She is relieved and starts to calm down'], a: 0,
      cue: '短い返事の、二語目。',
      line: 'We only did it once! It didn’t mean anything to me. — *Yeah, right.*',
      said: '「一回だけ！何の意味もなかった」に、「はいはい、どうだか」と返す。',
      mean: 'Yeah, right ＝ 信じていない、という皮肉。yeah があっても同意ではない。',
      trap: 'yeah を「うん」と取りやすい。right が付くと「よく言うよ」になる。',
      use: 'Yeah, right. Like that’ll happen.（はいはい、ありえないね）' },

    // R fix: V2 (blind 50 %): "Yes, I left it there so you'd find out" was a confession nobody makes. Now the
    //   rhetorical "Do you think I'm that stupid?" reading, the strongest near miss.
    // why: not that careless ← "Did it ever occur to you that I might… be that stupid" heard as the rhetorical "do you
    //   think I'm that stupid?", the direction flip; you're the stupid one ← "stupid" heard as aimed at Rachel, the
    //   target flip
    // anchor: 207.7–208.8 s "you wanted to get caught"; 209.7–210.6 s "That is not true"; 211.1–213.3 s "so you just
    //   sort of happened to leave it in here?"; 214.6–216.9 s "Did it ever occur to you that I might just be that
    //   stupid?": "I" is the subject, and it answers "you wanted to get caught"
    { id: 'c1', skill: 'infer', level: 'C2', point: 'stupid', seg: [205.2, 217.6],
      stem: 'Which plain version keeps what Monica means by “that stupid”?',
      choices: ['“I didn’t want to be caught; I was just careless.”', '“I’m not careless enough to leave it by accident.”',
                '“You are the stupid one for not seeing it sooner.”'], a: 0,
      cue: '「stupid」の主語と、何への答えか。',
      line: 'you wanted to get caught. — That is not true. … *I might just be that stupid*?',
      said: 'わざとだと責められ、「違う」と言ってから「私がそこまでバカだとは思わない？」と返す。',
      mean: '「わざと」の反対は「うっかり」。わざとより、バカと言われる方を選ぶ。主語は I。',
      trap: '「私がそんなバカだと思う？」という反語と取りやすい。直前の「わざと」への答えなので、ここは本当に「うっかり」。',
      use: 'I’m not mean, I’m just forgetful.（意地悪じゃなくて、忘れっぽいだけ）' },

    { id: 'x2', skill: 'dict', level: 'B1', point: 'notbe', seg: [242.4, 246.6],
      stem: 'Type what Rachel says: “I just really ___ right now.” (6 words)', answer: 'need to not be with you',
      cue: '「I just really」のあと。',
      line: 'I just really *need to not be with you* right now.',
      said: '「今は、あなたといたくないの」と言う。',
      mean: 'need to not be は、to と be の間に not が入る形。会話ではよくある言い方。',
      trap: 'not の位置が習った文法と違うので、don’t need と書きかえたくなる。聞こえた順に書く。',
      use: 'I need to not think about work.（仕事のことは考えないようにしないと）' },
  ]
};
