// “Victoria Justice Guest Stars As Shelby Marx! 🥊 | Full Scene | iCarly” (NickRewind, Best of Carly Shay): Carly's
// exhibition fight with the champion Shelby Marx, which she survives by clinging to Shelby's leg; afterwards Shelby
// explains why she broke her promise to go easy (a kid showed her a video), they work out it was Neville, and Neville
// is brought in and owns up.
// Segments from the captions, words from whisper (2026-11-17). Shelby is the one whose leg is held (the announcer says
// so at 145–167 s) and the one with "my gym" and "my grandmother" at 268–274 s (confirmed by 341–345 s). Marvin is named
// by the reply at 68.7 s. Neville is named by those greeting him. No item rests on who says the corner lines, the
// friends' praise, "That's cool" or "So?". No item uses the fight's crowd stretch (72–98 s, 116–125 s, 153–162 s,
// 199–222 s), "That's what she said" (115 s), the 240–262 s gap, or the ending (358–375 s).
// REVIEW 2026-11-17: pass 5, fix 18, drop 0, new 0; ear checks 2
// REVIEW open: blind pass (a fresh session, shuffled sheet, no keys) had 18 of 21 choice items at ≥ 50 % and right;
//   all 18 were rebalanced. A cold second read of the 18 fixed items put them at 40–65 % (p2 picked wrong); s1 65 %,
//   a1 h1 a3 d1 g2 60 %. Most of those lean on other items' stems, which the draws keep apart (reveals).
// EAR CHECK: 129.1 s p2 x1 — “promised” (captions) vs “found us” (whisper) in “Remember how you … to go easy on me”
// EAR CHECK: 347–350 s nt1 — the silence: whisper puts it after “thing” (347.7–350.2), the captions inside “no such …
//   thing” (347.3–349.5); the item needs a clear gap between the denial and “Okay, I tricked Shelby”
import type { Clip } from '../types.ts';

export const shelbyFight: Clip = {
  id: 'shelbyfight', video: 'xfweymB30B4', title: 'Victoria Justice Guest Stars As Shelby Marx!', dur: 375, wpm: 130,
  band: 'slow', tags: ['友だち'],
  show: 'iCarly',
  credit: 'iCarly (NickRewind, official YouTube channel)',
  questions: [
    // R fix: V2 (90 % blind; the stem's "let's get ready to…" called up "rumble"). The stem no longer quotes the
    //   phrase, and the fans line said just before is now the near miss.
    // why: fans ← "Let's give the millions of fans watching a good fight" is the sentence just before; music ←
    //   "rock and roll" taken literally as music
    { id: 'f2', skill: 'phrase', level: 'B1', point: 'rock', seg: [32.5, 44.4],
      stem: 'What does the referee’s closing phrase tell the two girls?',
      choices: ['That it’s time to start fighting', 'That the fans want a lively show',
                'That music will play between rounds'], a: 0,
      cue: '試合前の説明の、いちばん最後の決まり文句。',
      line: 'now go back to your corners and let’s get ready to *rock and roll*',
      said: 'コーナーに戻って、さあ始めようと声をかけている。',
      mean: 'rock and roll ＝ 音楽ではなく「さあ、いくぞ」。勢いよく何かを始める合図。',
      trap: '文字通り音楽と取ったり、直前の fans の文と混ぜたりしやすい。決まり文句は勢いで聞く。',
      use: 'Ready to rock and roll?（準備はいい？始めよう）' },

    // why: three one-minute ← "one" and "three" swap places; three three-minute ← "three" heard twice, a pro-boxing
    //   picture of several rounds
    { id: 'n1', skill: 'number', level: 'B1', point: 'round', seg: [57.6, 67.2],
      stem: 'How long is the match scheduled to be?',
      choices: ['One three-minute round', 'Three one-minute rounds', 'Three three-minute rounds'], a: 0,
      cue: '「exhibition match」のあと、数字が二つ続く。',
      line: 'it’s only scheduled for *one three-minute round*',
      said: '「3分1ラウンドだけ」と説明している。',
      mean: '3分のラウンドが1回。数字＋minute が形容詞になり s は付かない。',
      trap: '数字が二つ並ぶと順番が入れかわりやすい。「回数→長さ→round」の順で聞く。',
      use: 'a two-hour flight（2時間のフライト）' },

    // R fix: V2 (75 % blind; "she won't last" was the only choice about her losing). All three choices now turn on
    //   time, and the reassuring-sounding start ("only… one round") is the near miss.
    // why: will last ← "it's only scheduled for one three-minute round" heard as reassurance; won't count ←
    //   "exhibition" + "doesn't matter" read as "it's just for fun"
    { id: 'i1', skill: 'infer', level: 'C1', point: 'doubt', reveals: ['record'], seg: [57.6, 69.6],
      stem: 'What does Marvin’s last remark suggest he expects?',
      choices: ['Carly will be beaten before time runs out', 'Carly will last, since the round is so short',
                'The time won’t count, as it’s just an exhibition'], a: 0,
      cue: '「no one’s ever」から、「so」のあとまで。',
      line: 'no one’s ever lasted a full round with Shelby Marx, so *I doubt that even matters*.',
      said: '「誰も1ラウンドもったことがないから、時間は関係ない」と言う。',
      mean: '時間切れの前に負けるはず、という予想。説明のつもりが不安をあおっている。',
      trap: 'only や doesn’t matter で安心させる話に聞こえやすい。so の前の理由とつなげて聞く。',
      use: 'I doubt it’ll even come up.（たぶん話にも出ないよ）' },

    // R fix: V2 (65 % blind). The choices are now three readings of the same line (sarcastic, sincere,
    //   self-mocking), and "feel stupid" as self-blame is the near miss.
    // why: sincere ← "thanks" taken at face value; self-mocking ← "feel stupid" read as blaming herself, like 日本語の
    //   「私バカみたい」
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'stupid', seg: [65.3, 69.6],
      stem: 'How is the reply to Marvin, “Well, thanks…”, meant?',
      choices: ['Sarcastic: his remark only made her feel worse', 'Sincere: she’s glad he told her the facts in time',
                'Self-mocking: she feels silly for not knowing'], a: 0,
      cue: '「thanks」のあとに続く言葉。',
      line: 'Well, thanks for *making me feel stupid*, Marvin.',
      said: '「バカみたいな気分にさせてくれてありがとう」と返している。',
      mean: 'thanks for ＋ 嫌なこと は皮肉の決まった形。本当は「余計なこと言わないで」。',
      trap: 'thanks で感謝、stupid で自責と取りやすい。making me は相手のせい。',
      use: 'Thanks for reminding me.（思い出させてくれてどうも）' },

    // R fix: V2 (70 % blind; "accepts the rule" was a filler). The new near miss reads "unofficial" as quitting.
    // why: asks ← the Japanese frame: "we have…" heard as a soft request; ends ← "unofficial" + a stop heard as
    //   quitting the fight
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'timeout', reveals: ['cant'], seg: [99.0, 111.8],
      stem: 'After the time-out is refused, what does “Uh, we have…” do?',
      choices: ['Takes the refused break anyway, just renamed', 'Asks the referee if an informal break is OK',
                'Ends the fight early without officially quitting'], a: 0,
      cue: '断られたあと、「timeout」の前に付けた一語。',
      line: 'Uh, we have an *unofficial* timeout.',
      said: 'タイムアウトはだめと言われ、「非公式のタイムアウト中です」と言い出す。',
      mean: '名前を変えて、結局休む。ルールの抜け道を宣言していて、それがおかしい。',
      trap: 'we have をお願いと取りやすいが、聞いてはいない。timeout は休みで、やめるのではない。',
      use: 'Let’s call it a coffee break.（コーヒー休みってことで）' },

    // R fix: V2 (80 % blind). The stem's "!" made the refusal the natural fill; it is a full stop now.
    // why: can call ← the t of can't drops; could call ← only the short first sound is caught
    { id: 's1', skill: 'sound', level: 'B2', point: 'cant', seg: [101.5, 106.4],
      stem: 'Fill the gap: “You ___ a timeout.”',
      choices: ['can call', 'can’t call', 'could call'], a: 1,
      cue: '「You」のすぐあと、母音の長さと強さ。',
      line: 'You *can’t call* a timeout!',
      said: '「タイムアウトは取れない！」とはっきり断っている。',
      mean: 'can’t は t がほぼ消えるが、母音が長く強い「キャーン」。can は弱く短い「クン」。',
      trap: 'can’t の t を待つと聞きのがす。強さと長さで判断し、前の No とも合わせる。',
      use: 'You can’t park here.（ここは駐車できません）' },

    // R fix: V2 + S2 (80 % blind; the stem quoted "Remember…", which named the key's "reminding"). The stem stops at
    //   "Hi, Shelby", and a new-request reading of the same deal is the near miss.
    // why: asking now ← "promised" missed, the deal heard as a request made now; friendly ← "Hi" taken at face value
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'easy', seg: [124.7, 133.2],
      stem: 'Mid-fight, what is Carly doing when she says “Hi, Shelby”?',
      choices: ['Pointing to an old deal so she’ll ease off', 'Asking her now for a deal to ease off',
                'Acting friendly in the hope she’ll calm down'], a: 0,
      cue: '「Remember how you」のあと、過去の話かどうか。',
      line: 'Remember how you *promised* to go easy on me and not really hit?',
      said: '試合中に「軽くやるって約束したよね？」と話しかける。',
      mean: 'Remember how you… は過去の約束を思い出させる言い方。やめてほしいという訴え。',
      trap: 'Hi で始まるのでただのあいさつに見える。promised は過去形で、新しく頼んではいない。',
      use: 'Remember how you said you’d help?（手伝うって言ったよね？）', retired: true },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'easy', seg: [127.9, 132.3],
      stem: 'Type what Shelby promised: “…promised to ___ and not really hit?” (4 words)', answer: 'go easy on me',
      cue: '「promised to」のすぐあと、四語がつながる。',
      line: 'Remember how you promised to *go easy on me* and not really hit?',
      said: '「軽くやるって約束したよね」と言っている。',
      mean: 'go easy on 人 ＝ 人に手かげんする、厳しくしない。',
      trap: 'go‿easy‿on がつながり「ゴウイーズィオン」と一語に聞こえる。on me は弱く短い。',
      use: 'Go easy on him, he’s new.（新人だから大目に見てあげて）' },

    // R fix: V2 (85 % blind; "can't see the ring" and "a famous move" were fillers). The new near misses are the
    //   lost "don't" and "Very unusual" read as confusion.
    // why: can't tell ← "Very unusual" read as the announcer being lost; tried before ← "don't" lost, heard as
    //   "we've seen this technique before"
    { id: 'h1', skill: 'humor', level: 'C1', point: 'technique', seg: [141.0, 156.0],
      stem: 'Why does the announcer’s “I don’t think we’ve seen…” get a laugh?',
      choices: ['He treats clinging on as a real fighting move', 'He admits he can’t tell what Carly is doing',
                'He says this trick was tried before and failed'], a: 0,
      cue: '「left leg」のあと、どんな言葉で呼んでいるか。',
      line: 'hangin’ on to the left leg of the champion. Very unusual. I don’t think we’ve seen this *technique* before.',
      said: '「王者の左足にしがみついている。珍しい。こんな技は見たことがない」と実況する。',
      mean: 'しがみついているだけなのに、まじめに「技」と呼ぶ。大げさな実況との差が笑い。',
      trap: 'don’t が弱く「前にも見た」と聞こえやすい。ここは「前例がない」。',
      use: 'I’ve never seen anything like it.（こんなの見たことない）' },

    // R fix: V2 (65 % blind; a knockout and a lucky punch were the stock underdog scripts). The near misses are now
    //   things said in the scene: the run-off after the bell and Shelby's "Stop!".
    // why: runs off ← "running away, screaming" comes right after the countdown; stopped ← Shelby's "Stop! Stop!" and
    //   Carly never throwing a punch
    { id: 'g1', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['record'], seg: [141.0, 236.0],
      stem: 'How does the match itself turn out?',
      choices: ['Carly lasts until the round runs out', 'Carly runs off screaming before it ends',
                'It is stopped because Carly won’t fight'], a: 0,
      cue: '後半の実況と、試合後の友だちの言葉。',
      said: 'カリーは一発も打たないが、ラウンドの最後までもちこたえる。',
      mean: '勝ちではないが、王者相手に1ラウンドもった。それ自体が大きな出来事。',
      trap: '最後に叫んで逃げるので負けに見える。終了までの秒読みと、試合後のほめ言葉で判断。',
      use: 'I made it through the whole day.（なんとか一日乗り切った）' },

    // R fix: V2 (70 % blind; the key alone echoed "life"). The key is reworded off the idiom, and "barely" is now a
    //   full-length near miss.
    // why: gently ← dear = 大切な, as in "my dear"; barely ← "trying to shake Shay off" heard as her slipping
    { id: 'f1', skill: 'phrase', level: 'C1', point: 'dearlife', seg: [162.4, 171.1],
      stem: 'How is Carly holding on, as the announcer puts it?',
      choices: ['With all her strength, refusing to let go', 'Gently, like hugging someone dear to her',
                'Barely, and about to lose her grip any second'], a: 0,
      cue: '「but Shay is」のあと、文の最後の三語。',
      line: 'Marks tryin’ to shake Shay off her leg, but Shay is hangin’ on *for dear life*!',
      said: '振り落とされそうでも、シェイは必死にしがみついている、と実況。',
      mean: 'for dear life ＝ 命がけで、必死に。大げさに言う決まった言い方。',
      trap: 'dear を「大切な・愛しい」と取りやすい。for dear life はひとまとまりで「必死に」。',
      use: 'I held on for dear life on that ride.（あの乗り物、必死でつかまってた）' },

    // R fix: V2 (70 % blind; "amused" was a filler). The polite-request frame of "Will someone…" is the new near miss.
    // why: calm ← "Will someone…" heard as a polite request (a Japanese frame); worried ← "pry this girl off" heard as
    //   calling for help for Carly's sake
    { id: 'a3', skill: 'attitude', level: 'B2', point: 'pry', seg: [170.6, 174.6],
      stem: 'How does Shelby sound when she calls out “Will someone…”?',
      choices: ['Frustrated that she can’t get a punch in', 'Calm, simply asking the referee for help',
                'Worried that she might hurt the girl'], a: 0,
      cue: '文の最後、「so I can」のあと。',
      line: 'Will someone pry this girl off my leg *so I can punch her*?',
      said: '「誰かこの子を足からはがして。殴れないじゃない」と叫ぶ。',
      mean: '助けを呼ぶのは相手のためでなく、自分が打つため。思い通りにならずイライラしている。',
      trap: 'Will someone… は頼む形なので、冷静・心配と取りやすい。so I can のあとが目的。',
      use: 'Can someone get this off me?（誰かこれ取ってくれない？）' },

    // why: five ← the countdown that starts "in five"; eight ← the announcer's "eight more seconds" right after
    { id: 'n2', skill: 'number', level: 'B1', point: 'left', seg: [174.1, 183.0], keep: true,
      stem: 'When someone shouts to Carly near the end, how long is left in the round?',
      choices: ['Five seconds', 'Eight seconds', 'Ten seconds'], a: 2,
      cue: '「Carly, only」のすぐあと。',
      line: 'Carly, only *ten seconds* left in the round! Hang on, kiddo!',
      said: '「カリー、残り10秒だけ！がんばれ！」と声をかけている。',
      mean: '残りたった10秒。only で「もう少し」と励ましている。',
      trap: 'このあと「あと8秒」や秒読みの「5」が続き、混ざりやすい。誰の声の数字かで分ける。',
      use: 'Only five minutes left!（あと5分だけ！）' },

    // R fix: V2 + S2 (85 % blind; the stem's "If Carly lasts" held the key's verb). The stem names the moment by
    //   "eight more seconds", and "last" read as 最後の is the new near miss.
    // why: the last girl ← "last" heard as 最後の, not the verb; knock off her feet ← the usual "beat the champ" script
    { id: 'd1', skill: 'detail', level: 'B1', point: 'record', reveals: ['left'], seg: [183.6, 192.7],
      stem: 'With “eight more seconds” to go, what does the announcer say Carly will be?',
      choices: ['The first girl to last a full round with Shelby', 'The last girl who will ever fight Shelby',
                'The first girl ever to knock Shelby off her feet'], a: 0,
      cue: '「will be the first girl to ever」のあと。',
      line: 'Carly Shay will be the first girl to ever *last a full round* with Shelby Marx.',
      said: '「あと8秒で、シェルビー相手に1ラウンドもった初めての子になる」と実況している。',
      mean: 'last ＝ もちこたえる・続く。「最後の」ではなく動詞。',
      trap: 'last を「最後の」と取ったり、王者を倒す筋書きを想像したりしやすい。動詞だと気づくのがかぎ。',
      use: 'The battery lasts all day.（電池が一日もつ）' },

    // R fix: V2 + S1 (75 % blind; the stem said "the praise", which pointed at the key). The stem now names the
    //   list only, and the distractors are a take-back and a warning.
    // why: take back ← the flaws come one after another, read as real criticism; warn ← "you looked like a total…"
    //   heard as advice for next time
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'praise', reveals: ['outcome', 'record'], seg: [223.8, 237.0],
      stem: 'When a friend lists what Carly didn’t do in the fight, what is that for?',
      choices: ['To make what she did manage sound even bigger', 'To take back the praise they had just given',
                'To warn her not to fight like that next time'], a: 0,
      cue: 'できなかったことの列挙のあと、「but」に続く部分。',
      line: 'You didn’t throw one punch or kick… *but you lasted a whole round*…',
      said: '「一発も打たず、見た目もひどかった。でもプロ相手に1ラウンドもった！」とほめる。',
      mean: '欠点を先に並べるほど、but のあとの成果が大きく聞こえる。からかいまじりの本気のほめ言葉。',
      trap: '欠点が続くと、取り消しや注意に聞こえる。but のあとが本音。',
      use: 'It wasn’t pretty, but you did it!（かっこ悪くても、やりとげたね！）' },

    // R fix: V2 (70 % blind; "broke her promise" echoed the other promise items). The key is now "fought for real",
    //   and the rematch choice is two-part like the others.
    // why: ran away ← the search for Carly just before; rematch ← "What happened tonight?" heard as setting up
    //   another fight
    { id: 'g2', skill: 'gist', level: 'B2', point: 'cause', reveals: ['easy'], seg: [262.6, 288.6],
      stem: 'What is the talk after the match mostly about?',
      choices: ['Why Shelby fought for real, and who set it up',
                'Why Carly ran away, and where her friends found her',
                'Whether Shelby will give Carly a rematch, and when'], a: 0,
      cue: 'カリーの「What happened tonight?」への答え。',
      said: 'シェルビーが本気で戦った理由が分かり、仕組んだのがネビルだと気づく。',
      mean: '試合の謎ときの場面。約束が破られた原因が、第三者のしわざだと分かる。',
      trap: '直前にカリーを探す場面があるので、逃げた話と思いやすい。ここは理由と犯人の話。',
      use: 'So that’s what happened.（そういうことだったのか）' },

    // R fix: V2 (75 % blind; "the fans" was a filler). The press conference read as mockery is the new near miss.
    // why: mocked ← "press conference" + "talking about…" heard as being made fun of; told by the kid ← "some kid
    //   came to my gym" taken as an order
    { id: 'i2', skill: 'infer', level: 'C1', point: 'why', reveals: ['claim', 'gym'], seg: [264.2, 279.6],
      stem: 'From Shelby’s answer, why did she fight so hard?',
      choices: ['She thought Carly’s side meant to harm her family',
                'She thought Carly’s side mocked her at the press event',
                'A kid at her gym told her to stop going easy'], a: 0,
      cue: '「All I know is」から、動画の中身まで。',
      line: 'some kid came to my gym and played me a video… *push my grandmother down*.',
      said: '「ある子がジムに来て、あなたたちが祖母を突き飛ばすと話す動画を見せた」と答える。',
      mean: '本気だったとは言わないが、家族を傷つけると言われたと信じたのが理由。',
      trap: 'kid、gym、press が聞こえ、指示やからかいと取りやすい。その子は動画を見せただけ。',
      use: 'All I know is what he told me.（彼から聞いたことしか知らない）' },

    // why: press conference ← said in the same breath, as where the video was filmed; grandmother's house ←
    //   "grandmother" is the last word heard
    { id: 'd2', skill: 'detail', level: 'B1', point: 'gym', seg: [267.9, 274.7],
      stem: 'According to Shelby, where did the kid show her the video?',
      choices: ['At the gym where she trains', 'At the press conference', 'At her grandmother’s house'], a: 0,
      cue: '「some kid came to」のすぐあと。',
      line: 'some kid came to *my gym* and played me a video',
      said: '「ある子が私のジムに来て、動画を見せた」と言う。',
      mean: '動画を見た場所はジム。記者会見は、動画に映っていた場面。',
      trap: 'press conference も聞こえるが、それは動画の中身。場所は came to のあとを聞く。',
      use: 'Some guy came to the door.（知らない男が玄関に来た）' },

    // R fix: V2 (80 % blind; the grandmother was the only odd, specific choice). All three now share "push" or
    //   "grandmother", so only verb plus object settles it.
    // why: bring along ← "grandmother" caught but "push… down" lost; push Shelby around ← "push" caught, the object
    //   missed
    { id: 'd3', skill: 'detail', level: 'B2', point: 'claim', seg: [268.0, 275.0],
      stem: 'What did the video seem to show Carly and her friends saying?',
      choices: ['That they would push Shelby’s grandmother down', 'That they would bring Shelby’s grandmother along',
                'That they would push Shelby around in the ring'], a: 0,
      cue: '「talking about how you were gonna」のあと。',
      line: 'talking about how you were gonna *push my grandmother down*',
      said: '動画では、カリーたちが会見で「祖母を突き飛ばす」と話していた、とシェルビーは言う。',
      mean: '家族への脅しと受け取って怒った。まだ誰も「にせ物」とは言っていない。',
      trap: 'push か grandmother の片方だけだと別の話。動詞と目的語を続けて聞く。',
      use: 'They were talking about how they’d win.（勝つって話してたよ）' },

    { id: 'x2', skill: 'dict', level: 'B2', point: 'getit', seg: [279.8, 284.6],
      stem: 'Type the short line right after the kid’s name is said: “___.” (4 words)', answer: 'now i get it',
      cue: '名前が2回聞こえたあと、短い一言。',
      line: 'Neville. — *Now I get it*.',
      said: '「なるほど、分かった」。誰のしわざか気づいた一言。',
      mean: 'get it ＝ 分かる。now を付けると「やっと話がつながった」。',
      trap: 'get it の t がつながり「ゲリッ」に近い。it は弱く短い。',
      use: 'Oh, now I get it!（あ、やっと分かった！）' },

    // R fix: V2 (75 % blind; "must make" didn't fit a past guess, so it fell away). All three are now past modals.
    // why: might've ← the short vowel of "must" heard as "might"; must've had ← the m of "made" blurred after 've
    { id: 's2', skill: 'sound', level: 'B2', point: 'must', seg: [281.6, 286.4],
      stem: 'Fill the gap: “Neville ___ a fake video.”',
      choices: ['must’ve made', 'might’ve made', 'must’ve had'], a: 0,
      cue: '名前のあと、二語目までが短くつながる。',
      line: 'Neville *must’ve made* a fake video.',
      said: '「ネビルがにせの動画を作ったにちがいない」と気づく。',
      mean: 'must’ve ＝ must have。「マスタヴ」とつながる。過去への強い推量。',
      trap: '速いと must と might が混ざる。母音「ア」か「アイ」かを聞き、made まで追う。',
      use: 'I must’ve left it at home.（家に置いてきたにちがいない）' },

    // R fix: V2 (55 % blind, its one rewrite; the stem's "put 'you' first" named the contrast). The stem asks what
    //   the line tells the person, so the parse itself is tested; skill pragma → infer (a C2
    //   skill: who the fear points at is read off the contrast, never said).
    // why: ought to be scared ← "you" up front heard as the subject, the direction flipped; all three ← "Okay" heard
    //   as giving up the two earlier denials
    // anchor: 316 s and 327 s "I'm not scared of you (, either)" set up the contrast; 334 s "Okay," concedes before
    //   "you I'm scared of"
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'scared', seg: [324.0, 337.9],
      stem: 'What does Neville’s last line here tell the third person?',
      choices: ['That this one, unlike the others, scares him', 'That this one ought to be scared of him',
                'That all three of them scare him after all'], a: 0,
      cue: 'それまでに2回言った言葉と、最後の語順の差。',
      line: 'I’m not scared of you, either. … *Okay, you I’m scared of*.',
      said: '二人には「怖くない」と言ったが、三人目には「お前は怖い」と言う。',
      mean: 'you を前に出すのは「ほかの二人とちがって、お前は」という対比。日本語の「は」に近く、強がりが崩れたのが笑い。',
      trap: '語順だけで方向を取りちがえやすい。前に出た語は対比。Okay は降参の合図。',
      use: 'Coffee I can skip. Sleep I can’t.（コーヒーはなくていい。睡眠はむり）' },

    // R fix: V2 + K2 (65 % blind, its one rewrite; the key was the only choice about the silence, and "as if proud"
    //   was arguable from the "So?" that follows). The stem now quotes the admission, and the near misses are an
    //   instant admission and one more excuse.
    // why: the moment asked ← "no such thing" missed; one more excuse ← the pause read as making up an excuse
    // anchor: 345.8 s the formal "I did no such thing"; then a silent gap (≥ 2 s in both sources); 350.2 s "Okay,"
    //   concedes
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'admit', seg: [342.85, 354.4],
      stem: 'Why does Neville’s “Okay, I tricked Shelby” get a laugh?',
      choices: ['His firm denial gives way after a silent pause', 'He admits it the very moment he is asked',
                'He tries one more excuse before giving up'], a: 0,
      cue: '「no such thing」のあとの間と、次の一語。',
      line: 'I did *no such thing*. … *Okay*, I tricked Shelby.',
      said: '「そんなことはしていない」と堅く否定したあと、少し間があって「分かった、だましたよ」。',
      mean: 'no such thing は大人びた強い否定。何も言われないのに数秒で崩れる、その落差が笑いになる。',
      trap: '間を言い訳を考える時間と取りやすいが、何も言わずに白状する。否定を聞きのがすと即答に見える。',
      use: 'Okay, fine. It was me.（分かったよ、ぼくがやった）' }
  ]
};
