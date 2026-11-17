// REVIEW 2026-11-16: pass 0, fix 24, drop 0, new 0; ear checks 1
//   Blind pass first: 19 of 22 choice items right at ≥ 50 % from stem + choices alone; the fixes target that, plus
//   said + mean + trap over 120 (140 for C2) on 22 items, n1 showing n2's key, and g2 out of clip order.
// “When Half the Friends Can't Afford Dinner | Friends” (the official Friends channel, Best of Season 2): at Monica's
// promotion dinner the bill is split six ways, Phoebe objects for the three who ate little, and afterwards the three
// explain they have less money; Ross's birthday concert plan gives way to just being together.
// Segments from the captions, words from whisper (2026-11-16). Whisper's timings drift from ≈96 s (up to 9 s early) and
// it repeats lines at 121–140 s and 224–249 s, so every time here is from the captions. Phoebe is settled by “Feebs”
// (153.6 s), Ross by “my sister” (3.4 s) and “my birthday” (241.8 s); other speakers are left unnamed. Untested: 22 s
// (“beeper”/“paper”), 52 s (“ching”/“chiching”), 109 s (the song request), 133 s (“prom night flashback”).
// EAR CHECK: 280.9 s nt3 — “that we all be together” (both sources): confirm the bare “be”, not “we’re all” or “we all get”
// (R: the nt2 tone ear check is dropped: its key rests on the friend's words “now I feel bad”, not on Ross's tone.)
import type { Clip } from '../types.ts';

export const cantAfford: Clip = {
  id: 'cantafford', video: 'lkbr5qnYSUU', title: 'When Half the Friends Can’t Afford Dinner', dur: 310, wpm: 143,
  band: 'slow', tags: ['店・レストラン', '友だち'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: V2: the key sat where the choices overlap (head x2, lunch x2); “Head brunch chef” replaces “Assistant
    //   lunch chef”, so all three share “Head … chef”; notes trimmed (N6)
    // why: brunch ← lunch/brunch share the ending, and both are daytime posts; dinner chef ← they are at dinner
    { id: 'd1', skill: 'detail', level: 'B1', point: 'job', seg: [2.1, 8.3],
      stem: 'In the toast, what is Monica’s new position?',
      choices: ['Head lunch chef', 'Head brunch chef', 'Head dinner chef'], a: 0,
      cue: '「appointed」のすぐあと、役職の言葉。',
      line: 'the newly appointed *head lunch chef*, who’s also in charge of purchasing',
      said: '妹に乾杯し、「新しくランチの料理長になり、仕入れも担当」と紹介する。',
      mean: 'head ＝ 長。lunch で、どの時間帯の料理長かが分かる。',
      trap: '夕食の席なので dinner と思いやすい。head のあとの一語を、最初の音から聞く。',
      use: 'She was just made head of sales.（彼女、営業部長になったばかり）' },

    // R fix: V2 + K6: the key was the only mocking choice; a second mock reading (the prices) now competes, and
    //   “Politely patient” goes; notes trimmed (N6)
    // why: prices ← “look at these prices” comes right after, so the mockery seems aimed at the cost; truly eager ←
    //   “on the edge of my seat” read literally as excitement
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'edge', seg: [35.0, 43.1],
      stem: 'When the waiter says where he’ll be waiting, how does he sound?',
      choices: ['Mock-eager, hinting they’re being slow', 'Mock-eager, teasing them about the prices',
                'Truly eager to serve such a big table'], a: 0,
      cue: '注文はまだ、と言われた直後の返し。',
      line: 'Well, when you do, just let me know. I’ll be right over there *on the edge of my seat*.',
      said: '「まだ見てない」に、「決まったら呼んで。あそこで待ってる。身を乗り出して」と返す。',
      mean: '注文待ちに「手に汗にぎる」は大げさ。わざとそう言い、待たされる退屈をにおわせる。',
      trap: '文字通り取ると本気の熱意。値段の話はこのあと。場違いな大げささは皮肉のサイン。',
      use: 'The ending had me on the edge of my seat.（結末はずっとハラハラした）' },

    // R fix: V2: the money theme made the key the only sensible choice; “without nuts” as a diet request and a smaller
    //   pizza now compete; notes trimmed (N6)
    // why: without nuts ← “without the nuts” heard as an allergy request, “is it cheaper?” lost; smaller pizza ←
    //   “cheaper” plus Joey’s “teeny pizza” later
    { id: 'd2', skill: 'detail', level: 'B1', point: 'nuts', seg: [64.6, 71.6],
      stem: 'After ordering his pizza, what does Joey ask the waiter?',
      choices: ['If it costs less without some toppings', 'If it can be made without nuts for him',
                'If the smaller pizza costs any less'], a: 0,
      cue: '「But hey, look」のあと、if で始まる質問。',
      line: 'If I get it *without the nuts and leeks* and stuff, *is it cheaper?*',
      said: 'タイ風チキンピザを頼み、「ナッツやネギ抜きなら安くなる？」と聞く。',
      mean: '具を減らして値段を下げたい。お金が気になっていると分かる質問。',
      trap: 'without the nuts だけだとアレルギーの相談に聞こえる。質問は is it cheaper まで。',
      use: 'Is it cheaper without the cheese?（チーズなしだと安くなる？）' },

    // R fix: V2: “he’ll ask the kitchen” was an easy reject; the distractors are now the yes reading and a vague
    //   maybe, both from “You’d think”; notes trimmed (N6)
    // why: yes ← “You’d think” taken as agreement (そう思うよね = yes); maybe ← a vague reply read as the Japanese
    //   「確認します」
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'youdthink', reveals: ['nuts'], seg: [67.0, 74.6],
      stem: 'What does the waiter’s reply to Joey’s question mean?',
      choices: ['No; it costs the same either way', 'Yes; it would naturally cost less', 'Maybe; he would have to check'],
      a: 0,
      cue: 'Joey の質問への、短い返し。',
      line: '…is it cheaper? — *You’d think, wouldn’t you?*',
      said: '「具なしなら安い？」に、店員は「そう思うでしょうね」とだけ返す。',
      mean: '「普通はそう思うよね（でも違う）」という遠回しの no。値段は同じ。',
      trap: 'think から同意や「確認する」に聞こえる。You’d think は「そう思うだろうが実は違う」の型。',
      use: 'You’d think it’d be open on Sunday.（日曜は開いてると思うでしょ）' },

    // R fix: V2: the distractors (snapping, not hearing) were fillers; a second reading of “side” and indecision now
    //   compete; notes trimmed (N6)
    // why: smaller salad ← “side salad” really does mean a small salad, so the joke seems to be about size; can’t
    //   decide ← “I don’t know” heard as indecision
    { id: 'h1', skill: 'humor', level: 'C1', point: 'side', seg: [76.5, 88.7],
      stem: 'Why does Rachel’s answer about the salad get a laugh?',
      choices: ['She takes “the side of” as a place on the table', 'She takes “side” to mean a smaller salad',
                'She can’t decide, so she leaves it to him'], a: 0,
      cue: '「I don’t know」のあと、水の話。',
      line: 'And what would that be *on the side of*? — I don’t know. Why don’t you just put it *right here next to my water*?',
      said: '「何のサイド？」と聞かれ、「さあ。じゃあ私の水の横に置いて」と答える。',
      mean: '「何の付け合わせか」を「どこの横か」に取りかえ、メインなしをごまかす。',
      trap: 'I don’t know だけだと迷っているよう。笑いはそのあと、side の意味のずらし。',
      use: 'Can I get the dressing on the side?（ドレッシングは別でください）' },

    // R fix: N6 only (notes trimmed); the blind read couldn’t pick it
    // why: a cup of ← the weak “the” swallowed between “of” and “cucumber”; a cup of that ← “the” heard as a stressed
    //   “that”
    { id: 's1', skill: 'sound', level: 'B2', point: 'cup', seg: [92.5, 97.45],
      stem: 'Fill the gap: “I’m gonna have ___ cucumber soup.”',
      choices: ['a cup of the', 'a cup of', 'a cup of that'], a: 0,
      cue: '「have」と「cucumber」の間、弱い音はいくつ？',
      line: 'I’m gonna have *a cup of the* cucumber soup and, um, take care.',
      said: '「キュウリのスープをカップで」と頼む。of the は「アヴザ」と弱い。',
      mean: 'メニューの「その」スープなので the が入る。ひと息につながる。',
      trap: 'the は短く弱く、消えたように聞こえる。that なら強く「ザッ」と言い、t で止まる。',
      use: 'Can I get a slice of the cheesecake?（そのチーズケーキを1切れください）' },

    // R fix: V2 across items: $33.50 was n2’s key, so seeing it here pointed n2 at it; “$30” (Phoebe’s
    //   “30-something bucks”) replaces it; notes trimmed (N6)
    // why: $8 ← only “eight” caught in “twenty-eight bucks”; $30 ← “30-something bucks” is said a little later
    { id: 'n1', skill: 'number', level: 'B1', point: 'owe', seg: [110.6, 114.0], keep: true,
      stem: 'When the bill comes, how much does everyone owe?',
      choices: ['$8', '$28', '$30'], a: 1,
      cue: '「owes」のすぐあとの数字。',
      line: 'Everyone owes *28 bucks*.',
      said: '会計を見て「みんな28ドルずつ」と言う。bucks はドルのくだけた言い方。',
      mean: '全員同じ額の割り勘。だれが何を食べたかは数えていない。',
      trap: 'twenty を聞き逃すと eight だけ残る。bucks の前の数字は、ひとかたまりで聞く。',
      use: 'It’s ten bucks each.（1人10ドルね）' },

    // R fix: V2: the key was the only scene-specific choice; “some had costly wine” keeps the even split but swaps
    //   the reason, and the payday choice goes
    // why: costly wine ← the even split is right, and a usual reason replaces the one said; bill above the menu ←
    //   “look at these prices” earlier, so the bill itself feels like the shock
    { id: 'g1', skill: 'gist', level: 'B2', point: 'split', seg: [110.6, 160.6],
      stem: 'At the restaurant, what sets off the argument about the bill?',
      choices: ['An even split, though some ate very little', 'An even split, though some had costly wine',
                'A bill far above what the menu showed'], a: 0,
      cue: '割り勘の額と、そのあとの反対の理由。',
      said: '一人いくらと割ったあと、少ししか食べていない人がいる、と反対の声が出る。',
      mean: '問題は店の高さより、食べた量に関係なく同じ額を払う割り方。',
      trap: '最初に値段に驚く声があるので、請求額そのものと思いやすい。反対の理由に何が挙がるかを聞く。',
      use: 'Should we just split it evenly?（普通に割り勘にする？）' },

    // R fix: N6 only (notes trimmed); the blind read picked the complaint
    // why: complaint ← what “everyone?” really hints at, so a listener assumes it was heard that way; pay for all ←
    //   “everyone” read as “treat everyone”
    { id: 'i1', skill: 'infer', level: 'B2', point: 'misread', seg: [114.0, 124.3],
      stem: 'How is the question “Um, everyone?” taken?',
      choices: ['As a reminder that Monica shouldn’t pay', 'As a complaint that an even split is unfair',
                'As a hint that one person should pay for all'], a: 0,
      cue: '質問のすぐあと、「you’re right」に続く話。',
      line: 'What? Um, everyone? — Oh, you’re right… It’s *Monica’s big night. She shouldn’t pay.*',
      said: '「え、全員？」に、「そうだね。今夜はモニカの晩だから払わなくていい」と返る。',
      mean: '「全員で割るの？」を「モニカも入れるの？」と取った。結果、残りの負担が増える。',
      trap: '本当の気持ち（割り方への不満）から選びやすい。問いは「どう取られたか」。返事で決める。',
      use: 'Wait, you mean all of us?（待って、全員ってこと？）' },

    // R fix: V2: the key was the one value the others converged on (33 x2, .50 x2, and shown in n1); four choices
    //   on a 2 x 2 grid now, so no value is central; notes trimmed (N6)
    // why: $30.50 ← “thirty-three fifty” with the second “three” lost; $33.15 ← fifty/fifteen; $30.15 ← both slips
    { id: 'n2', skill: 'number', level: 'B2', point: 'share', seg: [124.0, 129.5], keep: true,
      stem: 'When the share is worked out again, how much is it?',
      choices: ['$30.15', '$30.50', '$33.15', '$33.50'], a: 3,
      cue: '「five of us is」のあと。',
      line: 'So, five of us is *$33.50* apiece.',
      said: '「じゃあ5人で、1人33ドル50セント」。apiece は「1人あたり」。',
      mean: '一人分が上がった。値段はドルとセントを「33、50」と区切る。',
      trap: 'fifty は前が強く、fifteen は後ろが長い。二つ目の three も落とさない。',
      use: 'That’s twelve fifty apiece.（1人12ドル50セントね）' },

    // R fix: V2: only the key described the reply (“a no said several ways”); all three now say “several noes” and
    //   differ in what they mean; notes trimmed (N6)
    // why: playful ← “Uh-uh” sounds light, and a joke (“Prom night flashback”) follows; unsure ← “Sorry” read as the
    //   Japanese すみません before giving in
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'noway', seg: [124.0, 132.05],
      stem: 'When the new share is announced, how does the reply sound?',
      choices: ['Firm: several noes, every one meant', 'Playful: several noes, all in fun',
                'Unsure: several noes, then a maybe'], a: 0,
      cue: '新しい額のすぐあと、返事の言い方。',
      line: '*No. Uh-uh. No way.* Sorry. *Not gonna happen.*',
      said: '新しい額に「だめ。いや。絶対むり。ごめん、ありえない」と続けて断る。',
      mean: '同じ no を言いかえて重ねるのは、交渉の余地がないという強い拒否。',
      trap: 'Sorry は日本語の「すみません」のように折れる前ぶれに聞こえる。ここは言い方を和らげるだけ。',
      use: 'Sorry, not gonna happen.（悪いけど、それはないわ）' },

    // R fix: V2 + S1: “begin with” told the reader something else follows; the stem now names the moment, and every
    //   choice is a softener of something different; notes trimmed (N6)
    // why: an offer ← “happy you got promoted” and “Monica’s night” lead toward paying for her; must leave ← “I’m
    //   sorry, Monica” read as an excuse before going
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'promoted', seg: [136.6, 142.8],
      stem: 'What is Phoebe doing when she says she’s happy for Monica?',
      choices: ['Softening the objection that follows', 'Softening an offer to pay Monica’s share',
                'Softening the news that she must leave'], a: 0,
      cue: '「but」の前と後で、話の向きがどう変わるか。',
      line: 'I’m sorry, Monica. I’m *really happy you got promoted, but* cold cucumber mush for 30-something bucks?',
      said: '「ごめん。昇進はうれしいけど、冷たいキュウリに30ドル以上は…」と言う。',
      mean: 'お祝いを先に置いて、そのあとの「払えない」を和らげる。本題は but のあと。',
      trap: '祝う言葉と sorry から、払う話か帰る話に聞こえる。本音は but の後ろ。',
      use: 'I love the idea, but it’s too pricey.（いい考えだけど、高すぎる）' },

    // R fix: V2: “a big deal for Monica” was easy to reject; the distractors are now a parallel “small only for…”
    //   (the big eaters) and the agreeing reading; notes trimmed (N6)
    // why: ate a lot ← the talk is who ate what, so “you” seems to mean the big eaters; not worth a fight ← “no big
    //   deal” caught and the short reply heard as going along
    { id: 'i2', skill: 'infer', level: 'C1', point: 'notforyou', seg: [154.0, 160.6],
      stem: 'After “It’s no big deal”, what does the reply “Not for you” imply?',
      choices: ['It’s small only for someone with money', 'It’s small only for the ones who ate a lot',
                'It’s small, so not worth fighting over'], a: 0,
      cue: '「no big deal」への短い返事、for のあと。',
      line: 'How about we’ll each just pay for what we had?… It’s no big deal. — *Not for you.*',
      said: '「食べた分だけ払おう。大したことじゃない」に「あなたにはね」と返す。',
      mean: '「あなたには小さくても、こっちには大きい」。お金に困らない人の言葉だ、という指摘。',
      trap: '短い返事は同意に聞こえやすい。Not で始まる返事は、前の文の一部を打ち消す。',
      use: 'Easy for you to say.（あなたは簡単に言うけどね）' },

    // R fix: N6 only (notes trimmed)
    { id: 'x1', skill: 'dict', level: 'B2', point: 'getinto', seg: [167.3, 171.4],
      stem: 'Type what is said: “I really don’t want to ___ right now.” (3 words)', answer: 'get into this',
      cue: '「want to」のあと、3語がひと続き。',
      line: 'I really don’t want to *get into this* right now.',
      said: '「今はこの話に入りたくない」と言う。',
      mean: 'get into ＝（話題に）踏み込む。言いにくい話を避けるときの決まった言い方。',
      trap: 'get の t が「ラ」に近く変わり「ゲリントゥ」。get が消えて into だけ残りやすい。',
      use: 'Let’s not get into politics tonight.（今夜は政治の話はやめよう）' },

    // R fix: V2: “say hello first” was a filler; the distractors are now “Hello?” as “are you listening?” and “it’s
    //   us” as an offer to pay; notes trimmed (N6)
    // why: listening ← “Hello?” really is used for “anyone there?”; pay for you ← the money talk all scene, so
    //   “it’s us” heard as an offer
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'itsus', seg: [173.5, 178.9],
      stem: 'When the friends say “Hello, it’s us”, what do they mean?',
      choices: ['We’re your friends, so you can tell us', 'Are you listening? Speak up a bit',
                'We’re your friends, so we’ll pay for you'], a: 0,
      cue: '「話していいよ」の誘いに続く言い方。',
      line: 'You can tell us. — Yeah. *Hello, it’s us.* … We’ll be fine.',
      said: '「話していいよ」「そう。ちょっと、私たちだよ？大丈夫だから」と促す。',
      mean: 'この Hello は「ねえ、分かってる？」の念押し。遠慮しないで、の意味。',
      trap: 'Hello? は「聞いてる？」にも使うが、ここは We’ll be fine と続く。',
      use: 'Hello? It’s me. You can tell me.（ちょっと、私だよ。言っていいよ）' },

    // R fix: V2 + S1: “finally starts” in the stem pointed at hesitation; the stem now names the moment, the choices
    //   are parallel (mood: reason); segment 183.8–198.8 s (S4: 0.5 s before “Um”, ≤ 15 s); notes trimmed (N6)
    // why: bitter ← “you guys don’t get that” sounds like an accusation; casual ← “It’s no big deal” earlier sets a
    //   light tone
    { id: 'a3', skill: 'attitude', level: 'B1', point: 'telling', seg: [183.8, 198.8],
      stem: 'When one of the three starts to explain, how does it come out?',
      choices: ['Hesitant: it’s hard for them to say', 'Bitter: it’s been held in too long',
                'Casual: it’s no big deal to say'], a: 0,
      cue: '話し始めの um や uh と、長い間。',
      line: '*Um*… *uh*, we three feel like that, *um*, sometimes you, you guys…',
      said: '「えっと…私たち3人は、その、ときどき、あなたたち…」となかなか言えない。',
      mean: 'um や uh、言い直し、長い沈黙は、言いにくいことを言うサイン。',
      trap: 'don’t get that は責める言葉にも聞こえる。言葉より、つっかえ方と間で判断する。',
      use: 'Um, this is kind of hard to say…（えっと、ちょっと言いにくいんだけど…）' },

    // R fix: N6 only (notes trimmed); the blind read couldn’t pick it
    // why: have talked ← n’t’s t drops and the n is short; hadn’t talked ← the same shape in the past perfect; didn’t
    //   talk ← the meaning fits, so grammar fills it in
    { id: 's2', skill: 'sound', level: 'B2', point: 'havent', seg: [228.2, 232.55],
      stem: 'Fill the gap: “How come you guys ___ about this before?”',
      choices: ['haven’t talked', 'have talked', 'hadn’t talked', 'didn’t talk'], a: 0,
      cue: '「you guys」のすぐあと、最初の母音と n。',
      line: 'So, um, how come you guys *haven’t talked* about this before?',
      said: '「なんで今まで話さなかったの？」と聞く。haven’t の t はほぼ消える。',
      mean: 'how come ＝ なぜ（くだけた形）。今まで言わなかった、という現在完了。',
      trap: 't が消えても短い「ン」は残る。didn’t なら「ディ」で始まる。',
      use: 'How come you didn’t call me?（なんで電話くれなかったの？）' },

    // R fix: K5: “A small gift for a birthday” wasn’t parallel; now “A pricey gift for an event”; the segment starts
    //   after “before?” ends (S4); notes trimmed (N6)
    // why: loud fight ← “hoopla” sounds noisy, and the talk is about conflict; pricey gift ← the gift talk that follows
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'hoopla', seg: [232.4, 239.0],
      stem: 'In “the whole Ross’s birthday hoopla”, what is a “hoopla”?',
      choices: ['A big fuss over an event', 'A loud fight about an event', 'A pricey gift for an event'], a: 0,
      cue: '「Monica’s new job」と並べている点。',
      line: 'it’s always something… like with Monica’s new job or *the whole Ross’s birthday hoopla*.',
      said: '「いつも何かある。モニカの昇進とか、ロスの誕生日の大さわぎとか」と言う。',
      mean: 'hoopla ＝ お祭りさわぎ。the whole ～ で「～のあれこれ」。お金のかかる行事。',
      trap: '音がにぎやかで、けんかを連想しやすい。並ぶ昇進祝いと同じ種類の話と考える。',
      use: 'all the hoopla around the wedding（結婚式にまつわる大さわぎ）' },

    // R fix: V2: “Whoever let the plan slip” was easy to reject; a second “Ross, whose…” (hurt feelings) now
    //   competes; notes trimmed to the C2 limit (N6)
    // anchor: 241.28–247.12 s “I don’t want my birthday to be the source of any kind of… negative” breaks off into
    //   “There’s gonna be a hoopla?”: his own question replaces his protest, and both are about his birthday
    // why: hurt feelings ← the protest starts out sounding wounded (right target, wrong turn); the three ← the protest
    //   sounds like a retort aimed at them (right mechanism, wrong target)
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'hoopla', seg: [239.0, 248.2],
      stem: 'When Ross breaks off mid-sentence about his birthday, who is the joke on?',
      choices: ['Ross, whose excitement wins over his worry', 'Ross, whose worry turns into hurt feelings',
                'The three, for making his birthday a problem'], a: 0,
      cue: '言いかけた文と、次の問いの向きの差。',
      line: 'I don’t want my birthday to be the source of any kind of… negative… *There’s gonna be a hoopla?*',
      said: 'ロスは「誕生日が悪いことの原因になるのは嫌だ」と言いかけ、途中で「大さわぎがあるの？」と聞く。',
      mean: 'まじめな気づかいが、自分のお祝いと聞いた瞬間に喜びに負ける。笑われているのは本人の素直さ。',
      trap: '最初の文は反論にも、傷ついた声にも聞こえる。笑いの対象は、文が途中で何に切りかわったかで決まる。',
      use: 'Wait, there’s cake? I mean, that’s terrible.（え、ケーキあるの？いや、ひどい話だね）' },

    // R fix: C6: moved up to clip order (seg 239.0); V2: the key was the only good outcome; every choice now starts
    //   “The concert…”, and “the three just skip it” uses “Not at the concert”; notes trimmed (N6)
    // why: Ross pays ← “You wanna go to the concert?” heard as still going; the three skip it ← “Not at the concert”
    //   heard as the three staying away
    { id: 'g2', skill: 'gist', level: 'B2', point: 'plans', reveals: ['concert'], seg: [239.0, 290.2],
      stem: 'By the end, what happens to the birthday plans?',
      choices: ['The concert is dropped so no one is left out', 'The concert stays, and Ross pays for the three',
                'The concert stays, and the three just skip it'], a: 0,
      cue: '最後に付け足される短い一言。',
      said: 'ライブの計画を聞いたロスは、行かなくていいと言い、「ライブ以外で」と決まる。',
      mean: 'お金のかかる計画をやめ、全員が参加できる形に変えた、という着地。',
      trap: 'Not at the concert を「3人は行かない」と取りやすい。直前の「全員で」とつなげる。',
      use: 'Let’s do something we can all afford.（みんなが払える範囲で何かしよう）' },

    // R fix: V2: the gift and the party were in other forms (“The birthday gift they had bought”); all three are now
    //   “A … they were going to …”; notes trimmed (N6)
    // why: gift ← “The thing’s not the gift?”, and “gift” is heard three times; party ← “the stuff after the thing”
    //   heard as a party
    { id: 'd3', skill: 'detail', level: 'B2', point: 'concert', seg: [255.1, 267.6],
      stem: 'What does “the thing” turn out to be?',
      choices: ['A concert they were going to see', 'A gift they were going to buy', 'A party they were going to throw'],
      a: 0,
      cue: '「No, the thing was」のあと。',
      line: 'The thing’s not the gift? — No, the thing was we were gonna go *see Hootie and the Blowfish*.',
      said: '「プレゼントじゃないの？」に「違う、バンドを見に行く予定だった」と答える。',
      mean: 'the thing はぼかした言い方。中身はライブで、プレゼントとは別。',
      trap: 'gift が何度も聞こえて引かれる。No のあとに中身が来る。go see は見に行くもの。',
      use: 'The thing is, I already have plans.（実はね、もう予定があるの）' },

    // R fix: V2: “tickets cost more than he’d pay” was easy to reject; “he’d hoped for a gift” (the gift talk just
    //   before) replaces it; notes trimmed to the C2 limit (N6)
    // anchor: 267.68–270.56 s he starts “Hootie and…”, breaks off, then says “I can catch them on the radio”;
    //   272.64–275.52 s a friend answers “No, now I feel bad. You wanna go to the concert?”: the disappointment came through
    // why: never cared for them ← “catch them on the radio” heard as “the radio is enough” (sincerity flip); a gift ←
    //   “Gift? The thing’s not the gift?” just before (right feeling, wrong object)
    { id: 'nt2', skill: 'attitude', level: 'C2', point: 'radio', reveals: ['concert'], seg: [264.3, 276.1],
      stem: 'When Ross mentions the radio, what is he trying not to say?',
      choices: ['How much he wanted to see them live', 'That he never cared much for the band',
                'That he’d hoped for a gift instead'], a: 0,
      cue: 'ラジオの話のすぐあと、友だちの返し。',
      line: 'Hootie and… Oh… I can *catch them on the radio*. — No, *now I feel bad*.',
      said: 'ロスは言葉に詰まり「ラジオで聞けるから」と言う。友だちは「悪い気がしてきた」と返す。',
      mean: '「ラジオで十分」は、がっかりを隠す強がり。相手の「悪い気がする」が、本音が伝わった証拠。',
      trap: '言葉どおりだと「興味がない」、直前の gift から「プレゼント希望」に聞こえる。相手が謝ったら強がり。',
      use: 'It’s fine. I’ll just watch it online.（いいよ、ネットで見るから）' },

    // R fix: N6 only (notes trimmed to the C2 limit)
    // anchor: 280.72–281.44 s “that we all be together”: four short words in under a second, the same in both sources,
    //   and “All of us. Together.” follows; grammar pulls toward “we’re all” or “we can all be”
    { id: 'nt3', skill: 'dict', level: 'C2', point: 'together', seg: [276.7, 283.2],
      stem: 'Type what Ross says: “The important thing is that ___.” (4 words)', answer: 'we all be together',
      cue: '「that」のあと、4語が速くひと続き。',
      line: 'it’s my birthday, and the important thing is that *we all be together*.',
      said: '「誕生日で大事なのは、みんなが一緒にいること」と言う。4語が速くひと続き。',
      mean: 'important thing is that のあとは、原形 be も使える（「～であること」）。',
      trap: '習った文法から are や can be に直したくなる。正しいと思う形でなく、聞こえた音を書く。',
      use: 'It’s important that everyone be on time.（全員が時間通りに来ることが大事）' },

    // R fix: V2 + S1: “After the long pause” in the stem gave the silence away; the stem now names the moment, and
    //   the distractors are a return to an earlier topic and real news; notes trimmed (N6)
    // why: earlier topic ← the opening “So,” sounds like a return to something said before; sad news ← “that’s
    //   gotta suck, huh?” heard as sharing real news
    { id: 'p3', skill: 'pragma', level: 'C1', point: 'ebola', seg: [286.5, 299.9],
      stem: 'At the very end, what does the last line do?',
      choices: ['Fills an awkward silence with any topic', 'Brings back a topic from earlier on',
                'Shares some sad news just heard'], a: 0,
      cue: '長い沈黙のあと、急に出る話題。',
      line: 'So, the Ebola virus, *that’s gotta suck, huh?*',
      said: 'お礼のあと沈黙が続き、だれかが「で、エボラウイルスって最悪だよね」と言う。',
      mean: '話題に意味はなく、気まずい間を埋める一言。無関係な話ほど気まずさが伝わる。',
      trap: '文頭の So は話を戻す合図にも聞こえるが、エボラの話は出ていない。急な話は場つなぎ。',
      use: 'So… how about this weather, huh?（で…いい天気だね）' },
  ]
};
