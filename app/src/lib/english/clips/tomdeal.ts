// “Tom's Negotiation Skills | Parks and Recreation” (the official Parks and Recreation channel, Season 7): Tom, now
// Andy's agent, bargains with the station boss for a raise and the rights to Johnny Karate; Andy threatens to walk,
// the boss brags to the camera, and Tom brings back the rights, which (a flashback shows) he got by begging and
// offering free meals at his restaurant.
// Segments from the captions, words from whisper (2026-11-16). The captions and whisper differ at 33.3 s ("10" vs
// "10%"), 47.5 s (the page name), 52.5 s ("in snerlin" vs "and snarling"), 60.6 s (roll/role), 86.8 s ("proper" vs
// "profit"), 110.6 s (rights "of" vs "to"), 150.3 s (mob/mop), 159.4 s (want to/wanna), 166.8 s ("in" vs "at" my
// restaurant) and 170.7 s (whisper's "Okay, okay" missing); no key rests on those words, and no line quotes them. The
// 0–28 s kids'-show sketch is untested. h1 no longer names who says "The human head weighs eight pounds" (Tom answers
// "No, show me the money"); pr2 assumes the boss says "my office" and Tom "Sit down", as the words imply.
// REVIEW 2026-11-16: pass 4, fix 19, drop 1, new 0; ear checks 1
// EAR CHECK: 94.5 s pr2 — is "Sit down" Tom's (the key assumes so: the boss says "my office", then gives in)?
import type { Clip } from '../types.ts';

export const tomNegotiate: Clip = {
  id: 'tomdeal', video: '5_1LuKDuvk8', title: 'Tom\'s Negotiation Skills', dur: 203, wpm: 166, band: 'slow',
  tags: ['職場', 'お願い・断り'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 50 %, right): "the customer" was weak. Now the waiter, the go-between an agent most resembles.
    // why: chef ← "a chef… making all the food" comes first and sounds like the hard worker Tom thinks he is; waiter ←
    //   an agent as the middleman who carries the work to the buyer (a sensible mapping the words don't make)
    { id: 'i1', skill: 'infer', level: 'C1', point: 'owner', seg: [30, 43.4],
      stem: 'In Tom’s restaurant comparison, which part is Tom himself?',
      choices: ['The owner who takes the profit', 'The chef who makes all the food',
                'The waiter who carries the food out'], a: 0,
      cue: '利益の話の直後、短い一言。',
      line: 'and then the *owner gets the profit*. *Which is my other job.*',
      said: '「シェフが全部作って、オーナーが利益を取る。それが僕のもう一つの仕事」。',
      mean: 'Andy がシェフで Tom がオーナー。本当に店も持っていて、得意げ。',
      trap: '最初の chef を Tom と取りやすい。最後の一言が何を指すかで決まる。',
      use: 'It’s like getting paid to watch TV.（テレビを見てお金をもらうようなもの）' },

    // R fix: V2 (blind 70 %, right): the distractors left out pay. All three now start "a raise for Andy and…". S1: the
    //   rights demand is pressed by Andy too ("I'm gonna walk"), so the stem names both.
    // why: parking ← the boss's own offer, said twice (keyword trap: who offered it); more cities ← "three cities" and
    //   "rival station" from Tom's opening pitch
    { id: 'g1', skill: 'gist', level: 'B2', point: 'demands', reveals: ['invented'], seg: [43.3, 130.5],
      stem: 'What do Tom and Andy mainly push the station boss for?',
      choices: ['A raise for Andy and the rights to his character', 'A raise for Andy and a better parking spot',
                'A raise for Andy and his show in more cities'], a: 0,
      cue: 'Tom が具体的に求めるもの、二つ。',
      said: 'Tom は人気と移籍をちらつかせ、Andy の給料アップと、Johnny Karate の権利を求める。',
      mean: '駐車場や息子の役は局長からの話。Tom が押すのは、お金と権利。',
      trap: '局長の提案も長く耳に残る。誰が出した条件かを分けて聞く。',
      use: 'Here’s what we’re asking for.（こちらの要求はこれです）' },

    // why: thirteen, thirty ← "three" linked to "cities", the s heard as -teen or -ty
    { id: 'n1', skill: 'number', level: 'B1', point: 'cities', seg: [43.3, 49.85],
      stem: 'In how many cities does Andy’s show get huge ratings?',
      choices: ['Three', 'Thirteen', 'Thirty'], a: 0, keep: true,
      cue: 'huge ratings のあと、数と場所。',
      line: 'Andy’s show gets huge ratings in *three cities*.',
      said: '「Andy の番組は3つの都市で大人気だ」と、まず数字で押す。',
      mean: '交渉の最初に、人気という強みを出している。',
      trap: 'three cities は続けて言うと thirty や thirteen と混ざりやすい。-teen と -ty は語尾が長い。',
      use: 'It’s popular in three cities.（3つの街で人気だ）' },

    // R fix: V2 (blind 70 %, right): only the key named the ex-wife. Now a direction flip on "drive my ex-wife crazy".
    // why: a start in show business ← the usual parent's motive (broken script); pleasing the ex ← "drive… crazy"
    //   heard as "make her happy" (crazy about = loves)
    { id: 'i2', skill: 'infer', level: 'B2', point: 'son', seg: [55.5, 65.35],
      stem: 'Why does the boss want his son cast as a kid ninja?',
      choices: ['To win his son over and annoy his ex-wife', 'To give his son a start in show business',
                'To please his ex-wife, who wants their son on TV'], a: 0,
      cue: 'all right? のあと、二つの理由。',
      line: 'He’s *gonna love me for it*. It’s gonna *drive my ex-wife crazy*.',
      said: '「息子は喜ぶし、元妻はカンカンになる」と、理由を二つ挙げる。',
      mean: '番組でなく家庭の事情。息子の気を引き、元妻を困らせたい。',
      trap: 'crazy about（大好き）と混ざると、元妻が喜ぶ話に聞こえる。drive 人 crazy は「いらだたせる」。',
      use: 'It’ll drive my boss crazy.（上司がイライラするだろうな）' },

    // R fix: V2 (blind 60 %, right): the distractors didn't share the key's shape. Now three "It's fine…" readings.
    // why: wrap it up ← "so good" taken as a final verdict, though "but" follows; too long ← "so far" heard as
    //   distance (遠い), as in "it's come so far"
    { id: 'p3', skill: 'phrase', level: 'B1', point: 'sofar', seg: [65.1, 72],
      stem: 'What does Tom mean by his first words after the boss’s offer?',
      choices: ['It’s fine up to now, but there’s more', 'It’s fine, so they can wrap it up now',
                'It’s fine, but it took too long to get here'], a: 0,
      cue: '次の要求に入る前、but の前。',
      line: '*So far, so good.* But…',
      said: '「ここまでは順調。でも…」と、さらに条件を出す前置き。',
      mean: 'so far ＝ 今のところ。続く but で「まだ足りない」と次の要求へ。',
      trap: 'so good だけ拾うと、まとめに聞こえる。so far は距離でなく「今のところ」で but とセット。',
      use: 'So far, so good.（今のところ順調）' },

    // R fix: S1 (passes V2, blind wrong): the stem named Andy as the speaker, which no name in the audio settles. The
    //   stem and choices now say "someone"; the key doesn't depend on who.
    // why: the wrong film ← "in the words of Jerry Maguire" heard as the part being corrected; too early ← the line
    //   cuts in, so "No" read as "not your turn"
    { id: 'h1', skill: 'humor', level: 'C1', point: 'maguire', seg: [65.1, 72],
      stem: 'Why does Tom say “No” when his quote is finished for him?',
      choices: ['It was the wrong line from the film', 'It was the right line from the wrong film',
                'It was his line, said before he could say it'], a: 0,
      cue: 'No のあとに Tom が言う言葉と比べる。',
      line: 'in the words of Jerry Maguire— — The human head weighs eight pounds. — *No, show me the money.*',
      said: 'Tom が映画のせりふを引こうとすると、横から別のせりふが入り、Tom が言い直す。',
      mean: '交渉で使いたいのは「金を見せろ」。横から出たのは、ずれたせりふ。',
      trap: '映画を知らなくても解ける。No のあとに、Tom が言いたかった言葉が来る。',
      use: 'In the words of my dad: relax.（父の言葉を借りれば、落ち着け）' },

    // why: rules the station ← "king" taken literally, as the boss of the place; famous friends ← the list of names
    //   heard as people he knows
    // R fix: V2 (blind 55 %, right): "to show Andy how lucky he is" pointed at a star-making boss. Neutral stem.
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'kingmaker', seg: [72, 80.45],
      stem: 'What does the boss call himself, after the names he lists?',
      choices: ['Someone who turns people into stars', 'Someone who rules over the whole station',
                'Someone who has many famous friends'], a: 0,
      cue: 'lucky のあと、自分を一語で言う。',
      line: 'I’m a *kingmaker*. … I *made them*.',
      said: '「わしはキングメーカーだ。あの人たちはわしが育てた」と名前を並べる。',
      mean: 'kingmaker ＝ 人を世に出す力のある人。',
      trap: 'king を文字通り「王」と取ると、局を支配する話に聞こえる。あとの I made them で決まる。',
      use: 'She made me who I am.（今の私があるのは彼女のおかげ）' },

    // R fix: V2 (blind 50 %, right): the choices weren't parallel. All three are now about "his famous name".
    // why: never met ← the brag collapsing heard as a full confession; said wrong ← "different" heard as fixing how
    //   Andy said the name
    { id: 'h2', skill: 'humor', level: 'C1', point: 'selena', seg: [74.3, 83.4],
      stem: 'Why does the boss’s answer to Andy’s surprised question get a laugh?',
      choices: ['His famous name is just a stranger with that name', 'His famous name is someone he has never met',
                'His famous name was said wrong by Andy'], a: 0,
      cue: 'Andy の質問への、短い返事の最初の語。',
      line: 'You discovered Selena Gomez? — *Different Selena Gomez.*',
      said: 'Andy が「あのセレーナ・ゴメスを？」と驚くと、局長は「別のだ」と返す。',
      mean: '並べた名前で唯一有名なのは、同じ名前の別人。自慢がしぼむ。',
      trap: 'different を言い方の訂正と取りやすい。人について different と言えば「別の人」。',
      use: 'Oh, a different John. Never mind.（ああ、別のジョンね。気にしないで）' },

    // R fix: V2 (blind 85 %, right): "Look, … for a raise" signals a refusal, so "I do have" was out. All three are now
    //   negatives that differ in sound and tense; Tom's present "you do" settles it.
    // why: won't ← don't/won't share the vowel and the dropped t; didn't ← don't and didn't blur before "have"
    { id: 's1', skill: 'sound', level: 'B2', point: 'donthave', seg: [83.4, 87.65],
      stem: 'Fill the gap: “Look, ___ the money for a raise.”',
      choices: ['I don’t have', 'I won’t have', 'I didn’t have'], a: 0,
      cue: 'Look のすぐあと、主語と動詞。',
      line: 'Look, *I don’t have* the money for a raise.',
      said: '「いいか、昇給するお金はない」と断る。don’t の t はほぼ消える。',
      mean: 'Tom の返事 you do は現在形。won’t や didn’t でなく don’t への返事。',
      trap: 't が消えると三つとも似る。母音と、相手の返事の時制で確かめる。',
      use: 'I don’t have time for that.（そんな時間はない）' },

    // R drop: nt3 (C2 stress on "you do"). Blind 80 %, right: the auxiliary that answers "don't" is the only sensible
    //   stress, so the key is guessable at heart. It also repeated s1's point. Never shipped, so deleted.

    // why: $50 ← "five hundred" with "hundred" swallowed; $5,000 ← hundred/thousand
    { id: 'n2', skill: 'number', level: 'B1', point: 'salary', seg: [87.65, 92.8],
      stem: 'What salary does Tom demand for Andy?',
      choices: ['$50 a week', '$500 a week', '$5,000 a week'], a: 1, keep: true,
      cue: 'starts making のあと、金額と期間。',
      line: 'Andy starts making *$500 a week*. Now.',
      said: '「Andy の給料は週500ドルから。今すぐ」と要求する。',
      mean: 'お願いでなく starts making と言い切り、強気に出ている。',
      trap: 'hundred を聞き落とすと50に聞こえる。単位まで聞く。',
      use: 'It pays five hundred a week.（週500ドルの仕事だ）' },

    // R fix: V2 (blind 65 %, right): "takes charge" was the only bold move. Now three replies of the same shape. The
    //   speaker of "Sit down" goes on the ear-check list.
    // why: begging ← the usual script after "get out" (Japanese frame: すみません); one last offer ← the reply missed,
    //   and the next offer comes from the boss
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'sitdown', seg: [92.85, 96.6],
      stem: 'When the boss orders Tom out of his office, how does Tom respond?',
      choices: ['He orders the boss to sit back down', 'He begs the boss to let him stay',
                'He agrees to go after one last offer'], a: 0,
      cue: 'get out のすぐあと、Tom の短い返し。',
      line: '…out of my office. — *Sit down.* — I don’t… *Okay.*',
      said: '局長が「出て行け」と言うと、Tom は「座って」と返し、局長は従ってしまう。',
      mean: '自分の部屋で命令されて座る。立場が逆になり、交渉は Tom のペース。',
      trap: '「出て行け」のあとは謝るのが普通の流れ。ここは命令に命令で返している。',
      use: 'Sit down. Let’s talk.（座って。話をしよう）' },

    // R fix: V2 (blind 50 %, right): the choices weren't parallel. Three "He won't have to…" now, one from the son's
    //   ninja part.
    // why: a driver ← "parking spot" heard, so a car perk is guessed; kids ← the boss's son joining as a kid ninja,
    //   turned around
    { id: 'd2', skill: 'detail', level: 'B2', point: 'perks', seg: [96.6, 104.38],
      stem: 'Which job change is part of the boss’s offer to Andy?',
      choices: ['He won’t have to do any cleaning', 'He won’t have to drive himself to work',
                'He won’t have to share the show with kids'], a: 0,
      cue: 'no more のあと。',
      line: '*No more janitorial duties.* Better parking spot.',
      said: '「掃除係の仕事はもうなし。駐車場も良くする」と、条件を並べる。',
      mean: 'janitorial ＝ 清掃員の。Andy は番組の主役なのに、掃除もしていた。',
      trap: 'parking spot から車の話を想像しやすい。no more のあとの語が仕事の変化。',
      use: 'No more night shifts for me.（もう夜勤はなし）' },

    // R fix: V2 (blind 75 %, right): "don't know who owns them" clashed with "we own". Three "He won't…" now.
    // why: won't discuss ← "can't" plus an unknown verb read as "can't go into it"; not for that price ← the haggling
    //   script, with "bend" heard as "won't come down"
    { id: 'p2', skill: 'phrase', level: 'B2', point: 'bend', seg: [109.75, 115.33],
      stem: 'What does the boss mean about the rights to Johnny Karate?',
      choices: ['He won’t give way on them at all', 'He won’t talk about them right now',
                'He won’t sell them at Tom’s price'], a: 0,
      cue: 'we own のあと、can’t に続く動詞。',
      line: 'We own the rights… *I can’t bend on that one.*',
      said: '「権利はうちのものだ。そこは譲れない」と言う。',
      mean: 'bend ＝ 曲がる → 交渉で「折れる、譲る」。',
      trap: 'bend を知らないと「今は話せない」「その値では」と想像しやすい。can’t bend は一歩も譲らない。',
      use: 'Sorry, I can’t bend on the price.（すみません、値段は譲れません）' },

    // R fix: V2 (blind 75 %, right): "his agent owns a share" was weak. Now Tom's ratings pitch as a keyword trap.
    // why: years in the part ← the usual actor's argument; the viewers ← Tom's "huge ratings in three cities" from the
    //   opening pitch
    { id: 'd3', skill: 'detail', level: 'B1', point: 'invented', seg: [111.45, 115.33],
      stem: 'Why does Andy think the rights should be his?',
      choices: ['He came up with the character', 'He has played the part for years',
                'The viewers tune in just for him'], a: 0,
      cue: 'can’t bend のあと、Andy の but。',
      line: 'But *I invented the character*.',
      said: '「でも、あのキャラクターは僕が考えたんだ」と言う。',
      mean: 'invent ＝ 生み出す。作った人だから権利も自分のもの、という理屈。',
      trap: '演じた年数で権利を主張する、よくある話に引っぱられやすい。but のあとの動詞を聞く。',
      use: 'I came up with that idea.（そのアイデアは私が考えた）' },

    // R fix: V2 (blind 55 %, right): the key was the only two-part answer. Three "X, and/but Y" now.
    // why: insulted ← the names sound silly, so mockery is expected; taking one ← "actually pretty great" heard
    //   without what follows
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'names', seg: [116.7, 126.85],
      stem: 'How does Andy react to the boss’s quick new character names?',
      choices: ['Impressed, but still set on his own', 'Insulted, and still set on his own',
                'Impressed, and ready to pick one'], a: 0,
      cue: '名前を聞いたあとの、Andy の二つの文。',
      line: 'Those are *actually pretty great*. *But Johnny Karate is special to me.*',
      said: '「実はけっこういいね。でも僕のキャラは特別」と言う。',
      mean: 'actually ＝ 意外にも。本気でほめてから、それでも自分のキャラを手放さない。',
      trap: '変な名前なので、皮肉や怒りを予想しやすい。actually は本気の驚き、but のあとが本心。',
      use: 'That’s actually pretty good.（それ、意外といいね）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'walk', seg: [126.85, 130.5],
      stem: 'Type the end: “If we can’t get the rights, ___.” (3 words)', answer: "i'm gonna walk",
      cue: 'rights のあと、文の終わりまで。',
      line: 'If we can’t get the rights, *I’m gonna walk*.',
      said: '「権利が取れないなら、降りる」と言う。',
      mean: 'walk ＝ 交渉から立ち去る、話を降りる。walk away とも言う。',
      trap: 'gonna は「ガナ」と短く、I’m とつながる。going to と書かず、聞こえた形で書く。',
      use: 'If the price goes up, I’ll walk.（値上げするなら、やめる）' },

    // C2 humor: who the joke is on
    // R fix: V2 (blind 70 %, right): "the stars, for being easy to reach" was weak. Now Tom, whose deal the boss's
    //   "he's gonna regret this" seems to threaten.
    // why: Andy ← the boss's own framing ("the biggest mistake of his life") taken at face value; Tom ← "he's gonna
    //   regret this" heard as aimed at the agent (right mechanism, wrong target)
    // anchor: 134.6–140.8 s "I have six Lower Great Lakes Emmy Awards. I once sat in the original Batmobile. James Woods
    //   follows my niece on Twitter." — every claim is "I" or "my", and each is smaller than the last
    // retired: with nt1 (one C2 alone is under the tier's 2)
    { id: 'nt2', skill: 'humor', level: 'C2', retired: true, point: 'creds', seg: [130.5, 143.6],
      stem: 'In the boss’s talk to the camera, who is the joke on?',
      choices: ['The boss, whose claims to fame keep shrinking', 'Andy, for walking away from such a big name',
                'Tom, whose tough deal is about to fall apart'], a: 0,
      cue: '自慢が一つずつ、どう変わっていくか。',
      line: 'I once *sat in the original Batmobile*. James Woods *follows my niece* on Twitter.',
      said: '「エミー賞が6つ。本物のバットモービルに座った。有名俳優が姪をフォロー」と並べる。',
      mean: '自慢がどんどん小さくなり、最後は姪の話。大物のつもりだが、笑われているのは局長自身。',
      trap: '「人生最大の失敗」から、Andy が笑われていると取りやすい。主語の I / my を追うと、ずっと自分の話。',
      use: 'I once shook hands with a senator.（議員と握手したことがあるんだ）' },

    // R fix: V2 (blind 70 %, right): the key alone carried a clip detail ("lowest legal wage"). Three "X, and he…" now.
    //   The "step up" distractor needed the earlier "no more janitorial duties" to refute; replaced.
    // why: upset ← sincerity flip: bad terms said brightly heard as putting on a brave face; unsure ← "I think I found
    //   a job" heard as doubt (Japanese frame: 〜と思う = 自信がない)
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'janitor', seg: [143.25, 149.95],
      stem: 'How does Andy feel about the job he has just found?',
      choices: ['Thrilled, and he brags about the pay', 'Upset, and he hides it with a bright voice',
                'Unsure, and he wants Tom’s opinion'], a: 0,
      cue: 'get this のあと、何を自慢するか。',
      line: '*Good news*, I think I found a job. … *Get this*, they’re gonna pay me *the minimum wage*.',
      said: '「いい知らせ！局の掃除係で、最低賃金がもらえる」と喜ぶ。',
      mean: 'get this ＝「聞いてよ、すごいよ」。最低賃金を自慢するずれが笑いになる。',
      trap: '悪い条件を明るく言うと強がりに聞こえる。good news と get this は本気の喜び。',
      use: 'Get this: the hotel upgraded us!（聞いて、ホテルが部屋を格上げしてくれた）' },

    // R fix: V2 (blind 65 %, right): "Andy agrees to work as a janitor" was weak. Three "Tom … the boss" moves now.
    // why: the threat ← the rival-station threat from Tom's opening pitch (keyword); the raise ← the agent's
    //   trade-off script, with "$500" still in the ear
    { id: 'g2', skill: 'gist', level: 'B2', point: 'how', reveals: ['plea', 'free'], seg: [143.25, 183.6],
      stem: 'How does the fight over the rights finally get settled?',
      choices: ['Tom wears the boss down with begging and a bribe', 'Tom scares the boss with a move to a rival station',
                'Tom wins the boss over by giving up Andy’s raise'], a: 0,
      cue: '「どうやって？」のあとに流れる場面。',
      said: 'Tom は泣きつき、恋の悩みまで話し、店でのただ飯を差し出す。局長は「もうやめて」と折れる。',
      mean: 'うまい交渉ではなく、しつこく頼みこんだ結果。',
      trap: '前半の強気な脅しが残ると、それで勝ったと思いやすい。最後の場面の Tom の言葉を聞く。',
      use: 'Fine, you win. Just stop.（分かった、負けた。もうやめて）' },

    // C2 attitude: what he is trying not to say
    // R fix: V2 (blind 70 %, right): "the boss was going to give in anyway" was weak. Now a near miss: "I guess" heard
    //   as "I got lucky".
    // why: luck ← "I guess" heard as a real shrug (Japanese frame: たまたま); part of the salary ← the agent's "10%" and
    //   the usual trade-off script
    // anchor: 155.0–155.8 s "Just a great agent, I guess"; 156.7–171.8 s the scene that follows: "Please, man,
    //   please… Do you want to eat… for free?… fine, just stop"
    // retired: never drawn under g2, which shares its point (how), so play 4 under g2 had no C2 to give
    { id: 'nt1', skill: 'attitude', level: 'C2', retired: true, point: 'how', reveals: ['plea', 'free'], seg: [149.95, 173.2],
      stem: 'When Tom answers Andy’s “How?”, what is he trying not to say?',
      choices: ['That it took begging, not skill', 'That it took luck, not skill', 'That it cost Andy part of his raise'],
      a: 0,
      cue: '「どうやって？」への答えと、そのあとの場面。',
      line: 'No way. How? — *Just a great agent, I guess.*',
      said: '「どうやって？」に「まあ、腕のいいエージェントだからね」と答える。直後に泣きつく場面。',
      mean: 'I guess で謙遜に見せた自慢。実際は頼みこみ、ただ飯で折れさせた。',
      trap: 'I guess を本当の謙遜と取りやすい。答えのすぐあとの場面が、言葉を書きかえる合図。',
      use: 'Oh, it was nothing, really.（いや、大したことないよ）' },

    // R fix: V2 (blind 70 %, right): the key alone had a "though…" twist. Three plain purposes now, one a request.
    // why: Andy moving away ← "Chicago" heard as another threat to leave, like the rival station; advice ← a personal
    //   problem told to an older man heard as asking for help
    { id: 'pr4', skill: 'pragma', level: 'C1', point: 'plea', seg: [156.2, 166.3],
      stem: 'Why does Tom bring up a girl in Chicago while pleading with the boss?',
      choices: ['To add to the pity, though it’s off the subject', 'To hint that Andy might move to Chicago',
                'To get the boss’s advice about the girl'], a: 0,
      cue: 'friend と good job のあとに足される話。',
      line: 'And there’s *this girl I really like*. And she lives in Chicago and *she’s still dating someone*.',
      said: '好きな子がシカゴにいて、まだ誰かと付き合っている、と続ける。',
      mean: '関係ない悩みまで並べ、同情で押している。局長の「Oh, God」がうんざりの合図。',
      trap: 'Chicago を聞くと、移籍の脅しに聞こえやすい。and が続くたびに話がずれていく。',
      use: 'On top of that, my car broke down.（おまけに車も故障して）' },

    // why: twice ← "every week" then "once a week": two "week"s heard; every day ← "every" caught, "week" lost
    { id: 'n3', skill: 'number', level: 'B1', point: 'free', seg: [165.2, 173],
      stem: 'How often does Tom offer the boss a free meal?',
      choices: ['Once a week', 'Twice a week', 'Every day'], a: 0, keep: true,
      cue: 'every week のあと、言い直した部分。',
      line: 'Every week— you can come *once a week*, it’s free.',
      said: '「毎週…週に1回来ていい、ただで」と言い直す。',
      mean: '最初の every week を、すぐ once a week に絞っている。',
      trap: 'every が耳に残ると、毎日のように聞こえる。言い直したあとの数を聞く。',
      use: 'You can come once a week.（週に1回来ていいよ）' },

    // R fix: V2 (blind 60 %, right) and S2: the stem quoted "I told you", which carries the answer. The stem now names
    //   the moment.
    // why: look ← "see" taken literally (見る); checking ← "see?" as a tag question (分かる？)
    { id: 'm1', skill: 'marker', level: 'B2', point: 'see', seg: [172.8, 175.9],
      stem: 'Back with Andy after the deal, what does Tom’s first word do?',
      choices: ['It points to the result: he was right', 'It asks Andy to look at something',
                'It checks that Andy is following him'], a: 0,
      cue: '場面が戻った直後、文頭の短い一語。',
      line: '*See*, I told you it was gonna work out.',
      said: '「ほらね、うまくいくって言っただろ」と言う。',
      mean: 'See ＝「ほらね」。結果を見せて、自分が正しかったと言う前置き。',
      trap: '「見る」や「分かる？」と取りやすい。文頭の See は I told you とよく組む。',
      use: 'See? I told you it’d be fine.（ほらね、大丈夫って言ったでしょ）' },
  ]
};
