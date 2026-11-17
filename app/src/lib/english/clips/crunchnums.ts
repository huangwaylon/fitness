// REVIEW 2026-11-16: pass 6, fix 18, drop 0, new 0; ear checks 2
// REVIEW 2026-11-17 (2nd): pass 12, fix 10 (5 for V2, 5 more only for N6 notes over 120), drop 2, new 0; ear checks 2. Cold blind pass first (17 of 23 at ≥ 50 %).
// REVIEW open (2026-11-16, now done): the blind pass was weakened twice: the header's scene summary was read before it (n1, d1, d2), and a
//   faulty shuffle put most keys in one slot. Treat the 18 fixes as the floor; a cold re-read of the new choices is
//   worth doing.
// REVIEW open (2026-11-17): c3 (C2) was still 70 % on a cold read after its rewrite (Michael's persona); the audio settles it.
// REVIEW open: pr1, a1 and c3 rest on who says which line in the loft and "explain" exchanges (EAR CHECK below).
// “Crunch Those Numbers Again - The Office US” (the official The Office channel, BEST OF SEASON 5 - The Office US):
// the new Michael Scott Paper Company. A 4:30 a.m. talking head about the van, early deliveries, a van with Korean
// church lettering, a cup of "milk and sugar"; then a meeting where a delivery guy is suggested, Michael pushes a loft,
// and the numbers show their prices are so low that selling more loses more. Michael asks for the numbers to be
// crunched again.
// Segments from the captions, words from whisper (2026-11-16). Only Michael and Pam are named; the one who explains
// the pricing is never named, so stems say "the reply" or "the explanation".
// Untested on purpose: 20–40 s and 58–70 s (donut pranks, mostly seen; "Halperd"/"halberd"), 74–76 s (whisper "van at
// a used car lot", captions "vanda to use car lot"), 104–113 s ("we have 20 of those": unclear without the picture),
// 168 s ("They are correct, sir": speaker unclear), 174 s (whisper "Swing and a miss", captions "swinging a miss"),
// 225–238 s ("Ty"; who says "Crunch" and "Did it help?"), 238–281 s (music; whisper loops one line).
// The Office has no laugh track, so the humor items ask what makes a line funny.
// EAR CHECK: 135.7 s pr1 — “Oh, you know what you would love… the loft” is Michael answering “Michael, we should really consider getting a delivery guy” (assumed from the address; captions don't mark speakers)
// EAR CHECK: 196.8–203.3 s c3 — the four requests to “explain” the model (“so they can under—”, “just explain what that is”, “explain what you think that is”, “just explain that”) are all Michael's (assumed)
import type { Clip } from '../types.ts';

export const crunchNumbers: Clip = {
  id: 'crunchnums', video: 'Xblkk5cEx3U', title: 'Crunch Those Numbers Again  - The Office US', dur: 281, wpm: 150,
  band: 'mid', tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // why: 4:13 ← -ty/-teen: "thirty" heard as "thirteen"; 5:00 ← "5 a.m. deliveries" later in the clip
    // R fix: S4 — the segment ended inside "are" (3.68 s); it now ends at 4.1, before "if"
    { id: 'n1', skill: 'number', level: 'B1', point: 'time', seg: [0, 4.1], keep: true,
      stem: 'What time does Michael say it is?',
      choices: ['4:13', '4:30', '5:00'], a: 1,
      cue: '最初の一文、「in the morning」の前。',
      line: 'It’s *4:30* in the morning.',
      said: '「朝の4時半だ」と言って話を始める。',
      mean: '4:30 は four thirty と読む。まだ暗いうちから働いている、という場面設定。',
      trap: 'thirty と thirteen は似て聞こえる。-ty は前、-teen は後ろが強いのが目印。',
      use: 'It’s 4:30 in the morning!（朝の4時半だよ！）' },

    // R fix (2nd review): N6 (said + mean + trap were over 120); trimmed.
    // R fix: V2 — the key was the only choice about "at his age"; all three now say how he treats the "kids"
    // why: own children ← "your kids… in this van with me" heard as him playing dad to Ryan and Pam; scolds ← "Do you
    //   know where your kids are?" heard as a reproach, and "you do" missed
    { id: 'h1', skill: 'humor', level: 'C1', point: 'kids', seg: [0, 11.0],
      stem: 'What makes his list of parents funny?',
      choices: ['He counts his own parents in, as if he were a kid', 'He treats Ryan and Pam as his own children',
                'He scolds the parents for losing track of their kids'], a: 0,
      cue: '3組目の親が、だれの親か。',
      line: 'If you are Ryan’s parents or Pam’s parents *or my parents*, you do.',
      said: '「ライアンの親、パムの親、ぼくの親なら、居場所は知ってる」と言う。',
      mean: '大人の同僚を「子ども」と呼び、自分まで数に入れているおかしさ。',
      trap: '最初の問いを親への小言と取りやすい。you do で自分で答え、3組目に my parents が来る。',
      use: 'I’m still my mom’s kid at forty.（40歳でも母の子どもだよ）' },

    // R fix: V2 (C2) — only the key named a mechanism ("makes it sound worse"); all three now give a target and a way
    // why: the parents ← right mechanism, wrong target: the opening question sounds like a dig at them; Ryan and Pam ←
    //   "kids… in this van" heard as making little kids of the two
    // anchor: 8.2–16.0 s "They're gonna be in this van with me. Who am I? Nothing to fear. I am just a 44-year-old guy
    //   with a paper route": each line meant to calm the parents adds a detail that sounds worse, and every one is about
    //   himself ("me", "I am")
    { id: 'c1', skill: 'humor', level: 'C2', point: 'fear', reveals: ['age'], seg: [7.7, 16.6],
      stem: 'In “Nothing to fear… paper route”, who is the joke on?',
      choices: ['Michael: each calming line makes him sound worse', 'The parents: his calm words are a dig at them',
                'Ryan and Pam: he makes them sound like little kids'], a: 0,
      cue: '安心させる言葉のあとに、何が足されるか。',
      line: 'in this van with me. Who am I? *Nothing to fear.* I am just a 44-year-old guy with a paper route.',
      said: '「子どもたちはぼくとバンの中。怖がらないで、ただの44歳の新聞配達だから」と言う。',
      mean: '安心させる一言ごとに「早朝・バン・中年男」と不安な情報が増える。笑われているのは本人。',
      trap: '親への問いかけで始まるので親への皮肉と取りやすい。主語の I と me を追えば、ずっと自分の話。',
      use: 'Don’t worry, I’m totally normal.（心配しないで、まったく普通の人です）' },

    // why: 14 ← -ty/-teen, and a paper route is a teenager's job (the script); 40 ← the second "four" lost; 54 ←
    //   "forty"/"fifty" share the f- start
    { id: 'n2', skill: 'number', level: 'B1', point: 'age', seg: [11.0, 16.6], keep: true,
      stem: 'How old does Michael say he is?',
      choices: ['14', '40', '44', '54'], a: 2,
      cue: '「just a」のすぐあと、year-old の前。',
      line: 'I am just a *44-year-old* guy with a paper route.',
      said: '「ただの44歳の新聞配達の男だ」と言う。',
      mean: 'forty-four-year-old の形で名詞の前に置く。year に s は付かない。',
      trap: '新聞配達は10代の仕事のイメージなので 14 に引かれやすい。forty-four は f の音が2回。',
      use: 'I’m a forty-four-year-old guy.（44歳の男です）' },

    // why: days ← "a couple" heard, the noun missed; months ← the business feels well under way
    { id: 'n3', skill: 'number', level: 'B1', point: 'weeks', seg: [41.3, 44.8], keep: true,
      stem: 'How long have they been making the early deliveries?',
      choices: ['A couple of days', 'A couple of weeks', 'A couple of months'], a: 1,
      cue: '「for a couple」のあとの一語。',
      line: 'We’ve been making 5 a.m. deliveries for *a couple weeks* now.',
      said: '「朝5時の配達を、2、3週間続けている」と言う。',
      mean: 'a couple weeks ＝ 2、3週間。会話では of が抜けやすい。',
      trap: 'a couple のあとの語が短く弱いので、days にも months にも聞こえやすい。最後の音を聞く。',
      use: 'We’ve been doing this for a couple weeks.（2、3週間これをやってる）' },

    // R fix (2nd review): N6 (said + mean + trap were over 120); trimmed.
    // R fix: V2 — the key was the only choice naming a twist; all three now say what the line does
    // why: slang ← "sick" as slang for "great" (a near miss a fluent listener knows); cleaning ← "gotten clean" heard as
    //   cleaning, and "makes me sick" as "sick of"
    { id: 'h2', skill: 'humor', level: 'C1', point: 'air', seg: [45.7, 52.0],
      stem: 'What makes the line about fresh morning air funny?',
      choices: ['It sounds hopeful, then ends in disgust', 'It uses “sick” as slang for great',
                'It says he is sick of cleaning so early'], a: 0,
      cue: '文の最後の一語と、それまでの流れ。',
      line: 'there’s something about fresh morning air that just really *makes me sick*.',
      said: '「悪い習慣をやめてから、朝の新鮮な空気が本当に気持ち悪い」と言う。',
      mean: '「朝の空気は最高」と続くと思わせ、反対の言葉で落とす。',
      trap: 'sick の俗語「すごい」と違い、makes me sick は「むかつく」。clean も掃除ではない。',
      use: 'There’s something about Mondays I hate.（月曜日ってなんだか嫌い）' },

    // why: car lot ← "used car lot" is said just before; school ← "an old school bus" right after
    { id: 'd1', skill: 'detail', level: 'B1', point: 'van', reveals: ['church'], seg: [76.2, 80.5],
      stem: 'What do they think the writing on the van says?',
      choices: ['The name of a church', 'The name of the car lot', 'The name of a school'], a: 0,
      cue: '「in Korean」の前の部分。',
      line: 'We think it says *Alleluia Church of Scranton* in Korean.',
      said: '「韓国語で『スクラントンのハレルヤ教会』と書いてあるらしい」と言う。',
      mean: '中古のバンで、前の持ち主の教会の名前が残っている。',
      trap: '前後に used car lot と school bus が出るので、それに引かれやすい。says のあとを聞く。',
      use: 'I think it says “exit” in Korean.（韓国語で「出口」って書いてあると思う）' },

    // R fix (2nd review): N6 (said + mean + trap were over 120); trimmed.
    // R fix: V2/S4 — "up so early" was a filler and the key the only natural thanks; the near miss is now the "didn't
    //   have to" line just before, and the segment starts before it (85.3 s, was mid-sentence at 86.4)
    // why: real trouble ← lifesaver taken literally (命の恩人); didn't need to ← "You didn't have to bring any coffee"
    //   said just before, and the Japanese わざわざ thanks
    { id: 'f1', skill: 'phrase', level: 'B1', point: 'lifesaver', seg: [85.3, 92.0],
      stem: 'As the cup is handed over, what does the thanks mean?',
      choices: ['That was a big help, thanks', 'You saved me from real trouble', 'You really didn’t need to do that'], a: 0,
      cue: '「awesome」のすぐあとの一語。',
      line: 'Oh, awesome. *You’re a lifesaver.*',
      said: '飲み物を受け取って「わあ、助かる」と言う。',
      mean: 'You’re a lifesaver ＝ 本当に助かった。ちょっとした親切へのお礼に使う。',
      trap: '文字通りなら「命の恩人」。直前の didn’t have to にも引かれやすい。大げさな日常のお礼。',
      use: 'Thanks, you’re a lifesaver!（ありがとう、本当に助かる！）' },

    // R fix: V2 — the key was the only odd drink; the near misses now read "Milk and sugar!" as a coffee order
    // R fix (2nd review): V2 (blind 55 %: the key was the only no-coffee choice). "Coffee with milk only" → "Just milk,
    //   no coffee", so two choices drop the coffee and "and sugar" decides. N6: said trimmed (was 126).
    // why: milk and sugar in coffee ← "Milk and sugar!" is how a coffee order sounds; just milk ← "just milk" caught,
    //   "and sugar" missed
    { id: 'd2', skill: 'detail', level: 'B1', point: 'milk', seg: [94.9, 102.3],
      stem: 'What turns out to be in the cup Michael brings?',
      choices: ['Milk and sugar, no coffee', 'Coffee with milk and sugar', 'Just milk, no coffee'], a: 0,
      cue: '「Wait」のあと、this に続く言葉。',
      line: 'Wait, is this *just milk and sugar*? — That’s what I said.',
      said: '「待って、これミルクと砂糖だけ？」「そう言ったよ」。',
      mean: 'コーヒーなしの、ミルクと砂糖だけの飲み物。マイケルは当然という顔。',
      trap: 'Milk and sugar! はコーヒーの注文のように聞こえ、コーヒー入りと思いやすい。just ＝「だけ」。',
      use: 'Is this just hot water?（これ、ただのお湯？）' },

    // R fix: V2/S4 — the choices were uneven (only the key was about a mistake); all three now say what they think.
    //   The segment started inside "of those" (114.3 s); it now starts at 114.85
    // R fix (2nd review): V2 (blind 70 %: only the key fit the "now" in the stem). "up for sale" → "still belongs to
    //   the car lot", another former owner.
    // why: car lot ← the van came from a used car lot, and "excuse me" sounds like a stranger with an offer; order
    //   paper ← "a paper company now" heard as a sales pitch
    { id: 'i2', skill: 'infer', level: 'B2', point: 'church', reveals: ['van'], seg: [114.85, 126.0],
      stem: 'Why is someone told it’s “a paper company now”?',
      choices: ['They mistake it for their church’s van', 'They think it still belongs to the car lot',
                'They want to order paper from him'],
      a: 0,
      cue: '最後の一言、何のための車ではないと言うか。',
      line: 'No, it’s a paper company now. *It’s not for the church!*',
      said: '「いや、今は紙の会社なんだ。教会のじゃない！」と言う。',
      mean: 'バンに教会の名前が残っているので、教会の送迎車と思われた。',
      trap: 'paper company から「紙を買いたい人」と取りやすい。最後の一言が、相手の勘ちがいを示す。',
      use: 'Sorry, this bus isn’t in service.（すみません、このバスは回送です）' },

    // R fix (2nd review): N6 (said + mean + trap were over 120); trimmed.
    // R fix: V2 — "hiring a delivery man" only restated the start, and the title points at the numbers; all three now
    //   name what Michael does at the end. The key now also reveals the end of the scene ('crunch')
    // why: raising prices ← "Your prices are too low" taken as leading to the fix; the loft ← "Or we just go for the
    //   loft" taken as the decision
    { id: 'g1', skill: 'gist', level: 'B2', point: 'scene', reveals: ['prices', 'crunch'], seg: [128.5, 238.0],
      stem: 'Across the office meeting, how does the talk turn?',
      choices: ['From hiring help to Michael rejecting the numbers', 'From hiring help to Michael raising the prices',
                'From hiring help to Michael ordering the loft'], a: 0,
      cue: '最初の提案と、最後にマイケルが頼むこと。',
      said: '配達係を雇う案から始まり、数字では売るほど損と分かるが、マイケルは計算のやり直しを頼む。',
      mean: '雇う相談が値段の問題に行き着き、マイケルは悪い知らせを拒む。',
      trap: 'too low から値上げで終わると思いやすい。最後の頼みは、数字を変えてほしいという願い。',
      use: 'Let’s look at the numbers first.（まず数字を見てみよう）' },

    // R fix (2nd review): N6 (said + mean + trap were over 120); trimmed.
    // R fix: V2 — the distractors were weak ("plans where the guy will sleep"); the near misses now give the cost
    //   question to Michael, or hear "you would love" as about the delivery guy. S4: the segment now runs to 144.9 s, so
    //   the cost question that refutes the first near miss is in it
    // why: asks the cost ← "Can we afford a delivery guy?" comes right after, from the other person; love having one ←
    //   "you know what you would love" heard as still about the delivery guy
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'loft', seg: [130.0, 144.9],
      stem: 'How does Michael answer the idea of hiring a delivery guy?',
      choices: ['He sidesteps it with a plan of his own', 'He agrees, and asks what it would cost',
                'He says they would love having one'], a: 0,
      cue: '提案のすぐあと、「you would love」に続く話。',
      line: 'Oh, you know what *you would love*? Is if we *built a loft*. — Why would I love that?',
      said: '配達係の話に「ロフトを作ろう」と返し、相手は「なんで？」と聞き返す。',
      mean: '答えずに自分の好きな話にすりかえている。費用を聞くのは相手のほう。',
      trap: 'you would love を配達係の話と取りやすい。love のあとの内容と、相手の聞き返しを聞く。',
      use: 'You know what would be fun?（何が楽しいか分かる？）' },

    // R fix: S4 — the segment ended between "like in" and "a dorm room" (144.0 s); it now ends at 144.9, after "room"
    // why: Can't we ← the final t of can't is often silent, so the two are close; Could we ← a polite form the line
    //   "should" use
    { id: 's1', skill: 'sound', level: 'B2', point: 'afford', reveals: ['loft'], seg: [139.6, 144.9],
      stem: 'Fill the gap: “Why would I love that? ___ afford a delivery guy?”',
      choices: ['Can we', 'Can’t we', 'Could we'], a: 0,
      cue: '「Why would I love that?」のすぐあと。',
      line: 'Why would I love that? *Can we* afford a delivery guy?',
      said: '「なんで私が？それより配達係を雇う余裕ある？」と聞き直す。',
      mean: 'can は弱く「クン」に近い。can’t なら母音が長く、後ろに小さな間が残る。',
      trap: 'can’t の t は消えやすいので迷いやすい。弱く短ければ can、強く長ければ can’t。',
      use: 'Can we afford a new car?（新しい車を買う余裕ある？）' },

    // R fix: V2/S4 — "Unsure: the word is half familiar" was weak; the near misses now take "Yeah" as agreement and "I
    //   know what a loft is" as "now I get it". The segment ended inside "don't" (151.0 s); it now ends at 152.1
    // why: agreeing ← "Yeah" heard as a yes (the Japanese はい frame); relieved ← "I know what a loft is" heard as "now I
    //   know", after the explanation
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'loftknow', seg: [143.3, 152.1],
      stem: 'After the dorm-room description of a loft, how does the reply sound?',
      choices: ['Annoyed: the explanation wasn’t needed', 'Agreeing: a loft like that sounds good',
                'Relieved: now the word makes sense'], a: 0,
      cue: '説明のすぐあとの返事、「Yeah」で始まる。',
      line: '*Yeah, I know what a loft is.*',
      said: 'ロフトの説明を長々とされ、「ロフトが何かぐらい知ってる」と返す。',
      mean: '聞いたのは配達係の話。分かりきった説明にいら立っている。',
      trap: 'Yeah で始まるので同意や「なるほど」に聞こえやすい。I know what ~ is は「説明はいらない」の合図。',
      use: 'Yeah, I know what Wi-Fi is.（Wi-Fi ぐらい知ってるよ）' },

    // R fix: V2/S4 — the key was the only reading that fit "in the magazines"; all three now say where the speaker's
    //   idea comes from. The segment ended inside "what a delivery guy costs" (154.0 s); it is now 148.55–155.4
    // why: read it ← "most do" heard as a fact backed by an article; for sale ← magazines as catalogues to buy from
    { id: 'i3', skill: 'infer', level: 'C1', point: 'magazines', seg: [148.55, 155.4],
      stem: 'What does the comeback about magazines suggest?',
      choices: ['Their dorm idea comes from photos, not real life', 'They have read that most dorms do have lofts',
                'They have seen a loft for sale in a magazine'], a: 0,
      cue: '「Most dorm rooms don’t」への返事。',
      line: 'Most dorm rooms don’t even have that. — *Most do in the magazines.*',
      said: '「寮にロフトなんかない」に「雑誌の中ならたいていある」と返す。',
      mean: '根拠は本物の寮でなく雑誌の写真。言い返したつもりで、相手の言い分を認めている。',
      trap: 'most do を証拠と取りやすい。in the magazines が「現実ではない」と示す。',
      use: 'It looks great in the photos.（写真ではすてきに見える）' },

    // why: calm acceptance ← "Okay" comes first; pay less ← "anything" heard as "not much", a hint to lower the wage
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'lame', seg: [163.0, 175.5],
      stem: 'How is “you can’t afford to pay him anything” taken in reply?',
      choices: ['As a joke, and a weak one', 'As bad news, taken calmly', 'As a hint to pay him less'], a: 0,
      cue: '「Okay」のあと、humor で終わる一言。',
      line: '*A lame attempt at humor.*',
      said: '「払えるお金はゼロ」と言われ、「オーケー」のあと「下手な冗談だ」と返す。',
      mean: '本気の数字を冗談として受け流している。現実を認めたくない反応。',
      trap: '最初の Okay で受け入れたと取りやすい。続く一言で、本気にしていないと分かる。',
      use: 'Nice try. Not funny, though.（いい線だけど、面白くはない）' },

    // R drop (2nd review): p2 and c2, what the Staples question is "really doing" and which reply would show Michael got
    //   it. Both turn on g2's fact (prices too low to make money; g2 reveals 'match'), so c2 could only be drawn with
    //   g1, and that broke the C2 draw on play 3. Both were 70 % blind. Never shipped, so deleted; pragma keeps pr1, and
    //   C2 keeps c1 and c3.
    // R fix (2nd review): V2 (blind 75 %: only the key was about the company's own prices). "delivery costs" → "too
    //   high to win customers", a low/high near miss.
    // why: rivals ← "Staples and Dunder Mifflin" heard as the problem; too high ← "too low" with the vowel misheard, and
    //   the usual startup script (too pricey to compete)
    { id: 'g2', skill: 'gist', level: 'B1', point: 'prices', seg: [175.7, 221.5],
      stem: 'What does the meeting reveal about the company?',
      choices: ['Its prices are too low to make money', 'Its rivals keep cutting their prices',
                'Its prices are too high to win customers'], a: 0,
      cue: '最初の「Your prices are」のあと。',
      line: 'Your prices are *too low*… at these prices, the more paper you sell, *the less money you’ll make*.',
      said: '値段が安すぎて、紙を売れば売るほど損をする、と説明される。',
      mean: '会社の問題は値段そのもの。安さが強みだと思っていたのが、実は弱み。',
      trap: '大手の名前に引かれやすく、low と high の聞き分けも要る。Lowest in town が決め手。',
      use: 'Your prices are way too low.（値段が安すぎるよ）' },

    // why: raise prices ← "pricing model" heard as a plan to change prices; cut delivery ← the delivery guy was the
    //   topic just before
    { id: 'd3', skill: 'detail', level: 'B2', point: 'volume', seg: [184.0, 189.8],
      stem: 'Defending their pricing, how do they expect to become profitable?',
      choices: ['By selling enough over time', 'By raising prices later on', 'By cutting delivery costs'], a: 0,
      cue: '「pricing model is fine」のあと、利益の出し方。',
      line: '*Over time, with enough volume*, we become profitable.',
      said: '「値段は大丈夫。時間がたって量が出れば、利益が出る」と言う。',
      mean: 'volume ＝ 売る量。安くても、たくさん売ればもうかるという考え。',
      trap: 'pricing model から「値上げの計画」と取りやすい。値段は変えずに量で、という話。',
      use: 'We’ll make it up in volume.（量でカバーするよ）' },

    // R fix (2nd review): V2 (blind 75 %, the C2 one rewrite). "the model is wrong" → "doubts the speaker knows it",
    //   the right mechanism (someone doesn't know) on the wrong person; that doubt is said aloud, so it isn't hidden.
    // why: doubts the speaker ← "Explain what you think that is" taken at face value; others slow ← his own stated reason
    //   ("so they can under—") taken at face value
    // anchor: 194.6–196.0 s "Okay, sure… Right." as if he knew the term; then 196.8–203.3 s four requests to explain it
    //   ("so they can under—", "just explain what that is", "explain what you think that is", "just explain that")
    //   and not one word of his own about it
    { id: 'c3', skill: 'attitude', level: 'C2', point: 'bluff', seg: [190.0, 204.0],
      stem: 'As Michael keeps asking for the model to be explained, what is he hiding?',
      choices: ['That he has no idea what it is himself', 'That he doubts the speaker knows it either',
                'That the others are too slow to follow'], a: 0,
      cue: '「Okay, sure」のあと、彼自身が説明するかどうか。',
      line: 'So why don’t you explain what that is, *so they can under—*',
      said: '「うん、そうだね」と知っているふりをし、「みんなのために説明して」と何度も相手に頼む。',
      mean: '「他の人のため」を口実に、自分が知らないことを隠している。何度頼んでも、自分の言葉は一つもない。',
      trap: '本人の言う理由をそのまま信じやすい。口実を聞いたら、その人が自分では何をしないかを見る。',
      use: 'Why don’t you explain it to everyone?（みんなに説明してあげてよ）' },

    // R fix (2nd review): V2 (blind 60 %: "unsure" was a filler). It's now "softens the bad news", the softener use of
    //   "actually" ("Actually, I'd rather not"); "putting you out of business" isn't softened.
    // why: secret ← actually = 実は, heard as a confession; softens ← "actually" as a polite cushion (the Japanese
    //   やんわり frame)
    { id: 'm1', skill: 'marker', level: 'B2', point: 'actually', reveals: ['outof', 'prices'], seg: [216.3, 221.5],
      stem: 'In the answer to “keeping us in business”, what does “actually” do?',
      choices: ['It flatly turns the claim around', 'It shares a secret kept till now', 'It softens the bad news a little'],
      a: 0,
      cue: '前の文の最後の語と、返事の最後の語。',
      line: 'Our prices are the only thing keeping us in business. — They’re *actually* putting you out of business.',
      said: '「値段のおかげで続いている」に「その値段でつぶれかけている」と返す。',
      mean: 'actually は相手の思いこみを逆にする合図。in と out of の対比。',
      trap: '実は＝打ち明け話と取りやすいが、ここは反論。あとには相手と逆の話が来る。',
      use: 'Actually, it’s the other way around.（実は、その逆なんだ）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'outof', reveals: ['prices'], seg: [219.0, 221.6],
      stem: 'Type the reply: “They’re actually ___.” (5 words)', answer: 'putting you out of business',
      cue: '「actually」のあと。out と of がつながる。',
      line: 'They’re actually *putting you out of business*.',
      said: '「実は、その値段のせいで会社がつぶれかけている」。',
      mean: 'putting の t は弾み、out of は「アウダヴ」とつながる。＝廃業に追いこむ。',
      trap: 'out of が一語に聞こえやすい。of を落とさず、5語で書く。',
      use: 'This will put us out of business.（これじゃ店がつぶれる）' },

    // why: by hand ← "It's a program" heard as the reason to do it another way; cutting costs ← "crunch" taken as
    //   "squeeze" (costs), its everyday sense
    { id: 'h5', skill: 'humor', level: 'C1', point: 'crunch', seg: [224.5, 238.5],
      stem: 'Why is the request to crunch the numbers again funny?',
      choices: ['He hopes a program will give a new answer', 'He wants the figures redone by hand this time',
                'He mixes up “crunch” with cutting the costs'], a: 0,
      cue: '頼まれた側の「There’s no such thing」。',
      line: 'I would like you to *crunch those numbers again*. — … There’s no such thing as…',
      said: '「もう一度計算して」と頼み、「プログラムだから…」と言われても押し通す。',
      mean: '同じ数字を同じ計算にかけても答えは同じ。それでも別の答えを願うおかしさ。',
      trap: 'crunch を「削る」と取ると経費の話になる。crunch numbers ＝ 計算する。',
      use: 'Can you check it one more time?（もう一回確認してくれる？）' },
  ]
};
