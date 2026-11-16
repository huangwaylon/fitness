// REVIEW 2026-11-16: pass 0, fix 24, drop 0, new 0; ear checks 2
//   Blind pass first: about 20 of 23 choice items right at ≥ 50 % from stem + choices alone; the fixes target that,
//   plus said + mean + trap over 120 (140 for C2) on 22 items, two cue leaks (n1 “ago”, h1 “Ron”) and i3’s 2.9 s seg.
//   Open question: a1 rests on who says “Seems like her allergies are kicking in” (39.7 s); if it’s the crew, not
//   Ron, the key still holds (everyone heard “booze cruise”), but confirm it’s a flat aside.
// “You're On With Ron | Parks and Recreation” (the official Parks and Recreation channel, Season 5): Ron comes on
// Joan's TV show to promote the Pawnee Commons gala; Joan, hung over and calling it allergies, stops on air, the crew
// keeps the cameras on, and Ron ends up taking viewers' calls on whiskey, dogs, banks and movies.
// Segments from the captions, words from whisper (2026-11-16). Untested: 60.7–66.4 s (the first caller's "sexiest
// couple" bet; names garbled in both sources, and the point is sexual), 99.8–100.5 s ("pan-fried and/in salted
// butter", both sources "and"), 143–151.5 s (a montage of answers without the questions; "banks or/are Ponzi
// schemes"), 175–199 s (the ending: "Good morning… Bye", speakers unclear). No predict item (no clean cut before a
// projected move). No who item (the crew member and the callers are never named).
// EAR CHECK: 8.2 s n1 i1 nt1 — whisper "booze cruise", captions "boost cruise": confirm "booze"
// EAR CHECK: 39.7 s a1 — "Seems like her allergies are kicking in": the speaker isn't in either source; the key
//   assumes a dry aside (Ron or the crew), not real concern
// (R: the h1 ear check on “must (be) go on” is dropped: h1’s key doesn’t turn on the “be”.)
import type { Clip } from '../types.ts';

export const ronRadio: Clip = {
  id: 'ronradio', video: 'TUAqesRiV-g', title: "You're On With Ron", dur: 199, wpm: 143, band: 'slow',
  tags: ['職場', '電話'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2: the weather choice was the odd one out and the other items say she is unwell; the choices are now
    //   three parallel “feeling a bit …”, with “down” as the literal “under”; notes trimmed (N6)
    // why: down ← “under the weather” read as low spirits (under = 沈む); nervous ← a host's before-the-show jitters
    //   script
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'weather', seg: [4.1, 7.6],
      stem: 'When Joan first tells Ron how she is, what does she say?',
      choices: ['She’s feeling a bit unwell', 'She’s feeling a bit down', 'She’s feeling a bit nervous'], a: 0,
      cue: 'listen のあと、a little に続く言い方。',
      line: 'Yeah, listen, I’m *a little under the weather*.',
      said: '「ちょっとね、少し具合が悪くて」と、インタビューの前に打ち明ける。',
      mean: 'under the weather ＝ 体調がすぐれない。軽い不調を言う決まり文句。',
      trap: 'under を「沈む」と取ると気分の話になる。天気や気分でなく、体のこと。',
      use: 'I’m a bit under the weather today.（今日はちょっと体調が悪くて）' },

    // R fix: S3: the cue held “ago”, a word only the key had; V2: a fourth time, “This morning”, makes the times a
    //   full ascending scale; notes trimmed (N6)
    // why: this morning ← the hangover script (drank until the morning); last night ← the same script; last week ←
    //   “last week” is said, but for when the trip began
    { id: 'n1', skill: 'number', level: 'B1', point: 'hour', reveals: ['hangover'], seg: [7.3, 12.0], keep: true,
      stem: 'When did Joan’s trip end, from what she says?',
      choices: ['An hour ago', 'This morning', 'Last night', 'Last week'], a: 0,
      cue: '船旅の話の2文目、時を表す言葉。',
      line: 'Went on a booze cruise last week. Just *finished up an hour ago*.',
      said: '「先週、酒を飲む船旅に出て、終わったのはつい1時間前」と言う。',
      mean: 'finish up ＝ すっかり終える。ついさっきまで飲んでいた、ということ。',
      trap: 'last week が先に聞こえるので選びやすいが、それは出かけた時。終わった時は2文目。',
      use: 'We just landed an hour ago.（1時間前に着いたばかり）' },

    // R fix: V2: “really tell” in the stem and the quoted “allergies” in the key pointed at the hidden meaning; the
    //   stem drops “really”, and every choice is now about the allergies; notes trimmed (N6)
    // why: during the cruise ← the allergies tied to the trip but taken as real (the sincere reading); not the drink ←
    //   “completely unrelated” taken at face value
    { id: 'i1', skill: 'infer', level: 'C1', point: 'hangover', seg: [7.3, 18.7],
      stem: 'What does Joan’s “completely unrelated” remark tell Ron?',
      choices: ['That the allergies are really from drinking', 'That the allergies came on during the cruise',
                'That the allergies, not drink, are the problem'], a: 0,
      cue: '船旅の話の直後に出る、体の不調の話。',
      line: 'Went on a booze cruise… On a *completely unrelated note*, I have horrible *allergies*.',
      said: '船で飲んだ話のすぐあとに、「全然関係ないけど、ひどいアレルギーで」と言う。',
      mean: 'わざわざ「関係ない」と言うほど関係がある。二日酔いをアレルギーと言い換えた口実。',
      trap: 'unrelated を信じると別の話に聞こえる。わざわざ打ち消したら、そこが本題。',
      use: 'Totally unrelated, but are you free Friday?（全然関係ないけど、金曜ひま？）', retired: true },

    // R fix: V2: the key was the only knowing reply (“Right.”); the distractors now also give advice or play along,
    //   so the reader must know which advice fits a hangover from the clip; notes trimmed to the C2 limit (N6)
    // why: take medicine ← the allergies taken as real (the sincerity flip); on to the gala ← “unrelated note” taken
    //   at face value as her own change of topic, so the polite move is to change it too
    // anchor: 7.84–11.5 s "booze cruise… just finished up an hour ago", then at once "completely unrelated…
    //   horrible allergies"; 88.1 s Ron names it ("a bad hangover, which she is pretending is allergies")
    { id: 'nt1', skill: 'pragma', level: 'C2', point: 'hangover', seg: [7.3, 18.7],
      stem: 'Which reply from Ron would show he caught what Joan meant?',
      choices: ['Allergies, sure. Drink lots of water.', 'Allergies? Then take some medicine.',
                'Unrelated? Fine, on to the gala.'], a: 0,
      cue: '「関係ない」の直前に話していたこと。',
      line: 'Went on a booze cruise… On a *completely unrelated note*, I have horrible *allergies*.',
      said: '船旅で飲んで1時間前に終わったと話し、すぐ「全然関係ないけど、ひどいアレルギーで」と続ける。',
      mean: '打ち消すことで、かえって二日酔いだと伝わる。分かった人なら話を合わせ、水をすすめる。',
      trap: 'アレルギーを本当と取ると薬の話に、unrelated を信じると話題を移す返事になる。話の順番で聞く。',
      use: 'Right. Long night, huh?（なるほど。長い夜だったんだね）', retired: true },

    // R fix: K7/K6: the key was the longest and the only blunt choice; it is shorter now, and the third choice is a
    //   parallel “It …” about his event; notes trimmed (N6)
    // why: come back later ← "Sorry to hear that" + "but" heard as making room for her to rest; says sorry ← the
    //   Japanese 「恐縮ですが」 frame: a "but" after "sorry" read as an apology for asking
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'promote', seg: [16.2, 22.9],
      stem: 'After saying he’s sorry, what does Ron’s next line do?',
      choices: ['It turns straight back to his own business', 'It offers to come back once she feels better',
                'It says sorry for pushing his event on her'], a: 0,
      cue: 'but で始まる一文と、その中の do の強さ。',
      line: 'Sorry to hear that. … *But I do need to promote this event*.',
      said: '「それはお気の毒に」と言ったあと、「でもイベントの宣伝はしないと」と続ける。',
      mean: '同情は一言で済ませ、本題に戻す。do を入れると「どうしても」の強さが出る。',
      trap: 'sorry のあとの but を遠慮や「また今度」と取りやすい。本題は but の後ろ。',
      use: 'I do need this by Friday.（金曜までにどうしても必要なんです）' },

    // R fix: S3: the cue named “Ron”, a word only the key had; notes trimmed (N6)
    // why: gives away the drinking ← "will not go on" heard as a confession to the viewers; gala off ← "go on"
    //   attached to the event Ron is there to promote
    { id: 'h1', skill: 'humor', level: 'C1', point: 'goon', seg: [20.3, 34.5],
      stem: 'Why is Joan’s first line on air funny?',
      choices: ['It flatly takes back what she promised Ron', 'It tells the viewers she was out drinking',
                'It makes the gala sound as if it’s called off'], a: 0,
      cue: '本番前に言った決まり文句と比べて。',
      line: 'I’m a true professional. The show *must go on*. … Today’s show *will not go on*.',
      said: '「私はプロ。ショーは続けなきゃ」の数秒後、本番で「今日の番組はありません」と言う。',
      mean: 'must go on ＝ 何があっても続ける。それを自分で打ち消す落差が笑い。',
      trap: 'go on だけ拾うと催しの話に聞こえる。直前の約束が逆の形で戻ってきた。',
      use: 'Rain or not, the show must go on.（雨でも、ショーは続行）' },

    // R fix: V2: the key was the only choice that fit the scene; all three now start “Joan stops, and …”; notes
    //   trimmed (N6)
    // why: asks Ron to cover ← the usual "please cover for me" script, with Joan's "don't worry about me" just
    //   before; callers ask for Ron ← "take a phone call" heard as viewers wanting Ron
    { id: 'g1', skill: 'gist', level: 'B2', point: 'takeover', seg: [26.5, 77.4],
      stem: 'How does Ron end up taking viewers’ calls?',
      choices: ['Joan stops, and the crew keeps the show running', 'Joan stops, and asks Ron to cover for her',
                'Joan stops, and the callers ask for Ron'], a: 0,
      cue: '本番が止まったあと、横から聞こえるスタッフの声。',
      said: 'ジョーンが話せなくなり、スタッフが Ron に電話を受けさせ、カメラを回し続ける。',
      mean: '司会が続けられず、ゲストの Ron が番組を任される流れ。',
      trap: 'don’t worry about me から、ジョーンが頼んだと思いやすい。指示はスタッフ。',
      use: 'Can you cover for me for a minute?（ちょっと代わってもらえる？）' },

    // R fix: V2: “worried about her health” is now “believes her story”, so the choice is about what the speaker
    //   knows, not only kind vs dry; notes trimmed (N6)
    // why: believes her ← "seems like" heard as a gentle, real guess; sharply ← a stalled show suggests anger at her
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'kicking', reveals: ['hangover'], seg: [29.7, 42.2],
      stem: 'After Joan goes quiet on air, how is the remark about her allergies meant?',
      choices: ['Dryly, from someone who knows it isn’t allergies', 'Kindly, from someone who believes her story',
                'Sharply, from someone angry that she stopped'], a: 0,
      cue: '最初に彼女が話した船旅を思い出して。',
      line: 'Seems like her *allergies* are kicking in.',
      said: '番組が止まったところで、「アレルギーが出てきたようだ」と淡々と言う。',
      mean: '本当の理由はその場の全員が知っている。言い訳をそのまま使うのが乾いた皮肉。',
      trap: 'seems like を気づかいの推測と取りやすい。本人の言い訳を他人がくり返したら皮肉を疑う。',
      use: 'Seems like the coffee is kicking in.（コーヒーが効いてきたみたい）' },

    // R fix: N6 only (notes trimmed); the blind read was a coin toss
    // why: fixing an old park ← "park" caught, "building" lost; town hall ← "Commons" heard as a building's name
    { id: 'd1', skill: 'detail', level: 'B1', point: 'proceeds', seg: [44.4, 53.15],
      stem: 'What will the money from the gala pay for?',
      choices: ['Building a new park', 'Fixing up an old park', 'Building a town hall'], a: 0,
      cue: 'All proceeds のあと、toward に続く部分。',
      line: 'All *proceeds* will go *toward building a park*.',
      said: '「収益はすべて公園づくりに使われる」と説明する。',
      mean: 'proceeds ＝ 収益、売上金。go toward ～ ＝ ～の費用に充てられる。',
      trap: 'park だけ拾うと修理の話とも取れる。building まで聞けば新しく作る話。',
      use: 'All proceeds go to the animal shelter.（収益はすべて動物保護施設へ）' },

    // R fix: V2: “doubts the phone lines work” was a filler; “hopes some people will call” (apparently as hope)
    //   replaces it; notes trimmed (N6)
    // why: clearly the plan ← "apparent" = 明らかな, so apparently heard as "obviously" (a false friend); hopes ←
    //   apparently mixed up with “hopefully”, which he does say later
    { id: 'm1', skill: 'marker', level: 'B2', point: 'apparently', reveals: ['takeover'], seg: [54.3, 59.5],
      stem: 'When Ron says he’ll take calls now, what does his last word add?',
      choices: ['That he’s only just been told to', 'That it was clearly the plan all along',
                'That he hopes some people will call'], a: 0,
      cue: '直前に横から聞こえる小さな声。',
      line: 'Now I will take your calls, *apparently*.',
      said: '横から「電話を受けて」とささやかれ、「では電話を受けます、どうやら」と言う。',
      mean: 'apparently ＝ どうやら。今知らされた、自分の考えではない、という合図。',
      trap: 'apparent（明らかな）から「当然の予定」と取りやすい。文末なら「らしい」。',
      use: 'Apparently, the flight is delayed.（どうやらフライトが遅れているらしい）' },

    // R fix: V2: “Complaining” was easy to reject; “Hinting that he wants to leave too” replaces it, and “lie down”
    //   moves into the yes/no reading; notes trimmed (N6)
    // why: has she gone to lie down ← the negative question read as a real yes/no question about where Joan is;
    //   wants to leave ← being left alone on air invites a wish to go too
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'liedown', seg: [67.6, 73.75],
      stem: 'What is Ron doing with his question to the crew about Joan?',
      choices: ['Suggesting they should look after her', 'Asking if she has gone to lie down',
                'Hinting that he wants to leave too'], a: 0,
      cue: 'Shouldn’t で始まる問いと、相手の返事。',
      line: '*Shouldn’t you* be taking her to lie down somewhere?',
      said: '「どこかで横にならせてあげるべきじゃないか」とスタッフに聞く。',
      mean: 'Shouldn’t you ～? は質問の形の提案。やんわり勧めている。',
      trap: '否定の疑問文を事実の確認と取りやすい。Shouldn’t you ～? には行動が返ってくる。',
      use: 'Shouldn’t you be in bed by now?（もう寝たほうがいいんじゃない？）' },

    // R fix: V2: the gala choice was easy to reject; “They’d all lose their jobs if the show stopped” (right
    //   outcome, wrong condition) replaces it; notes trimmed (N6)
    // why: her job ← "fired" is said, but about the crew, not Joan; if the show stopped ← "fired" right, and a stalled
    //   show seems the obvious risk
    { id: 'd2', skill: 'detail', level: 'B2', point: 'fired', seg: [67.6, 73.75],
      stem: 'Why won’t the crew take Joan off camera?',
      choices: ['They’d all lose their jobs once she found out', 'She’d lose her job once the station found out',
                'They’d all lose their jobs if the show stopped'], a: 0,
      cue: 'Oh, no のあと、If she ever で始まる部分。',
      line: 'If she ever found out that we took her off camera, *we’d all be fired*.',
      said: '「カメラから外したと彼女に知られたら、全員クビになる」と答える。',
      mean: 'we’d ＝ we would。もしもの話。彼女の怒りが怖くて止められない。',
      trap: 'fired だけ拾うと、クビになるのは彼女か、番組が止まったせいに聞こえる。she が知る側。',
      use: 'If my boss found out, I’d be fired.（上司にばれたらクビだよ）', retired: true },

    // R fix: N6 only (notes trimmed)
    { id: 'x1', skill: 'dict', level: 'B2', point: 'fired', seg: [70.2, 73.75],
      stem: 'Type the end of the reply: “…we took her off camera, ___.” (4 words)', answer: "we'd all be fired",
      cue: 'off camera のあと、4語がひと続き。',
      line: 'If she ever found out that we took her off camera, *we’d all be fired*.',
      said: '「カメラから外したとばれたら、全員クビ」と言う。',
      mean: 'we’d all be がつながり「ウィドーオービ」に近い。d はほとんど聞こえない。',
      trap: 'd が消えると we all be に聞こえるが、文法に合わない。もしもの話なら we’d と書く。',
      use: 'We’d all be late without you.（君がいなきゃ全員遅刻だよ）' },

    // R fix: V2: the key was the only choice that read “hopefully” as a hint; the distractors are now two other
    //   readings of the calls so far; notes trimmed (N6)
    // why: Joan back soon ← "Hello again" + "still" heard as a stand-in waiting for the host; praised the gala ←
    //   "taking your calls… tonight's gala" heard as a report on the calls so far
    { id: 'i2', skill: 'infer', level: 'B2', point: 'hopefully', seg: [77.4, 84.5],
      stem: 'When Ron comes back on the air, what does his welcome suggest?',
      choices: ['The calls so far have been off topic', 'Joan will soon be back to take over',
                'The calls so far have praised the gala'], a: 0,
      cue: 'still のあと、文の最後に付け足す一言。',
      line: 'I am *still* taking your calls, *hopefully about tonight’s gala*.',
      said: '「引き続き電話を受けます。できれば今夜の催しについて」と言う。',
      mean: 'hopefully を付けるのは、ここまでの電話が催しと無関係だったから。',
      trap: 'gala と calls が並び、催しの電話が多いと取りやすい。hopefully は「だといいが」。',
      use: 'Hopefully, the rain stops by noon.（昼までに雨がやむといいけど）' },

    // R fix: V2: “Joan’s state” was easy to reject; “drops it and just answers whatever” (he does plug it, three
    //   times) replaces it; notes trimmed (N6)
    // why: every question back to it ← "Come to the gala" and "hopefully about tonight's gala" stick; drops it ← the
    //   calls are about steak, dogs and banks, so the plugs are forgotten
    { id: 'g2', skill: 'gist', level: 'B2', point: 'calls', seg: [77.4, 175.0],
      stem: 'Once Ron is on his own, how much does the gala come up?',
      choices: ['He mentions it, but answers whatever callers ask', 'He turns every caller’s question back to it',
                'He drops it and just answers whatever callers ask'], a: 0,
      cue: '電話の中身の幅と、催しの話が出る回数。',
      said: '催しの宣伝は時々で、ほかは趣味や暮らしの相談まで、聞かれたことに何でも答える。',
      mean: '宣伝に来たはずが、気づけば何でも相談室。その成り行きが面白さ。',
      trap: '宣伝が毎回か、まったくないかに寄りがち。Come to the gala などが何度か入る点を聞く。',
      use: 'Feel free to ask me anything.（何でも気軽に聞いてね）' },

    // R fix: N6 only (notes trimmed)
    // why: Don't ← the everyday "Don't know" fits, and wouldn't's l and d are weak; Didn't ← the past fits a question
    //   about how Joan is, and only d…n't is caught
    { id: 's1', skill: 'sound', level: 'B2', point: 'wouldnt', reveals: ['hangover'], seg: [91.85, 96.2],
      stem: 'Fill the gap: “Is she gonna be okay?” — “___ know.”',
      choices: ['Wouldn’t', 'Don’t', 'Didn’t'], a: 0,
      cue: '答えの最初の短い語。母音の響きに注目。',
      line: 'Is she gonna be okay? — *Wouldn’t* know. Never been hung over.',
      said: '「大丈夫？」に「分からないね。二日酔いになったことがないから」と答える。',
      mean: 'I が落ちた形。分かる立場にない、の意味。l は聞こえず「ウドゥン」。',
      trap: 'Don’t know は聞き慣れていて補いやすい。「ウ」の母音と、続く理由で判断する。',
      use: 'Wouldn’t know. I’ve never been there.（さあ、行ったことないから）' },

    // R fix: V2: the key sat where the choices overlap (steak x2, wet x2); a 2 x 2 of steak/water x wet/warm now, so
    //   no choice is central; notes trimmed (N6)
    // why: warm socks ← wet/warm share the w- and warm is the expected comfort; water ← the usual hangover-advice
    //   script; water + warm ← both slips
    { id: 'd3', skill: 'detail', level: 'B1', point: 'remedy', seg: [96.0, 105.9],
      stem: 'What does Ron do after he’s had too much whiskey?',
      choices: ['Eats a big steak, puts on wet socks, and sleeps', 'Eats a big steak, puts on warm socks, and sleeps',
                'Drinks some water, puts on wet socks, and sleeps', 'Drinks some water, puts on warm socks, and sleeps'],
      a: 0,
      cue: '食べる物と、socks の前の一語。',
      line: 'I cook myself a *large flank steak*… put on a pair of *wet socks*, and go to sleep.',
      said: '飲みすぎた夜は、大きなステーキを焼いて食べ、濡れた靴下をはいて寝る、と話す。',
      mean: 'Ron なりの二日酔い対策。「効くの？」に「効く」と言い切る。',
      trap: 'wet と warm は出だしが同じで、温かい方が自然に思える。短い「エ」と最後の t で wet。',
      use: 'Drink water before bed. It works.（寝る前に水を飲むといい。効くよ）' },

    // R fix: V2: the key sat where the choices overlap (cheap x2, table x2); a 2 x 2 of cheap/quick x fix the
    //   table/stop the chewing now; notes trimmed (N6)
    // why: stop the chewing ← the dog owner's usual question (the wrong implication of "chewed up"); quick ← "cheap"
    //   is a short word, easy to swap for the usual "quick way"
    { id: 'd4', skill: 'detail', level: 'B1', point: 'table', seg: [120.6, 128.7],
      stem: 'What does the caller with the terrier want to know?',
      choices: ['A cheap way to fix a chewed table', 'A quick way to fix a chewed table', 'A cheap way to stop a dog chewing',
                'A quick way to stop a dog chewing'],
      a: 0,
      cue: 'Is there a のあと、way の前と後。',
      line: 'My Yorkshire Terrier has *chewed up the legs* on my kitchen table. Is there a *cheap way to repair* that?',
      said: '「犬がテーブルの脚をかじった。安く直す方法はある？」と聞く。',
      mean: 'chew up ＝ かじってぼろぼろにする。聞きたいのは安い修理の方法。',
      trap: '犬の相談はしつけが定番で、そちらに引かれやすい。way の前の cheap と後の repair を聞く。',
      use: 'Is there a cheap way to fix this?（これを安く直す方法はある？）' },

    // R fix: V2: the key sat where the choices overlap; a 2 x 2 of ditch/keep x a proper dog/a cat now, the cat
    //   from “is a cat”; notes trimmed (N6)
    // why: keep it ← "get yourself a proper dog" caught, the short "ditch" lost; a cat ← "is a cat" heard as advice
    { id: 'p2', skill: 'phrase', level: 'B2', point: 'ditch', seg: [131.9, 140.8],
      stem: 'After the walnut tip, what does Ron tell the caller to do next?',
      choices: ['Get rid of the terrier and get a real dog', 'Keep the terrier and get a real dog too',
                'Get rid of the terrier and get a cat', 'Keep the terrier and get a cat too'], a: 0,
      cue: 'Next thing のあと、the terrier の前の短い動詞。',
      line: 'Next thing you want to do is *ditch the terrier* and get yourself a *proper dog*.',
      said: '「次にすべきは、そのテリアを手放して、ちゃんとした犬を飼うこと」と言う。',
      mean: 'ditch ＝ 手放す（くだけた言い方）。proper ＝ ちゃんとした。',
      trap: '短い ditch を聞き逃すと「もう1匹」に聞こえる。手放すときの口語として覚える。',
      use: 'Let’s ditch the car and walk.（車はやめて歩こう）' },

    // R fix: N6 only (notes trimmed)
    // why: 15 ← fifteen/fifty, the -teen/-ty trap; 60 ← fifty/sixty differ only in the first sound
    { id: 'n2', skill: 'number', level: 'B1', point: 'fifty', seg: [136.85, 140.8], keep: true,
      stem: 'By Ron’s rule, a dog under what weight is really a cat?',
      choices: ['15 pounds', '50 pounds', '60 pounds'], a: 1,
      cue: 'under のあと、pounds の前。',
      line: 'Any dog *under 50 pounds* is a cat, and cats are pointless.',
      said: '「50ポンド未満の犬は猫だ。そして猫は無意味だ」と言い切る。',
      mean: '50ポンドは約23キロ。小さい犬は犬と認めない、という極端な持論。',
      trap: 'fifteen は後ろが強く「ティーン」と伸びる。fifty は前が強く、最後は短い「ティ」。',
      use: 'The bag must be under 50 pounds.（かばんは50ポンド未満でないと）' },

    // R fix: V2: the choices differ in what the plug follows; “instead of answering” is now “right after a sincere
    //   repair tip” (the walnut tip did come first); notes trimmed (N6)
    // why: a sincere tip ← the walnut tip was a real answer, so the plug seems to cap it; get a cat ← "is a cat" heard
    //   as advice, "cats are pointless" lost
    { id: 'h2', skill: 'humor', level: 'C1', point: 'plug', seg: [136.85, 142.1],
      stem: 'Why is Ron’s last line to the dog owner funny?',
      choices: ['He plugs the gala right after insulting the dog', 'He plugs the gala right after a sincere repair tip',
                'He plugs the gala right after telling them to get a cat'], a: 0,
      cue: 'cats are pointless のすぐあとの一言。',
      line: '…and cats are pointless. *Come to the gala*.',
      said: '犬を猫呼ばわりし、猫は無意味だと切り捨てた直後に「催しに来て」と言う。',
      mean: '相手のペットをけなした直後に、何事もなかったように宣伝する落差が笑い。',
      trap: 'is a cat を「猫を飼え」と取りやすいが、すぐ cats are pointless と続く。',
      use: 'Anyway, come to the party!（とにかく、パーティーに来てね）' },

    // R fix: S4: the segment was 2.9 s; now 151.55–154.6 s; N6 (notes trimmed); the blind read missed it
    // why: lonely in a big house ← "You're lonely" is Ron's diagnosis, heard as the caller's own words; worth buying
    //   ← "haunted" caught, "your… isn't" lost
    { id: 'i3', skill: 'infer', level: 'C1', point: 'haunted', seg: [151.55, 154.6],
      stem: 'From Ron’s short answer about a house, what had that caller asked?',
      choices: ['Why their house seems to have a ghost', 'How to feel less lonely in a big house',
                'Whether a house with a ghost is worth buying'], a: 0,
      cue: '短い2文。1文目の否定と、2文目の主語。',
      line: '*Your house isn’t haunted*. You’re lonely.',
      said: '「家に幽霊なんかいない。あなたは寂しいだけだ」と答える。',
      mean: '質問は聞こえないが、答えから「家に幽霊がいる気がする」という相談だと分かる。',
      trap: 'lonely を相談の中身と取りやすいが、それは Ron の見立て。1文目から質問を逆算する。',
      use: 'You’re not sick. You’re just tired.（病気じゃない。疲れてるだけだよ）' },

    // R fix: V2: “Selling food should need a license” was easy to reject; “Buying from neighbors should be that
    //   easy” (the buyer’s side of the same sketch) replaces it; notes trimmed (N6)
    // why: polite sellers ← "Whatever happened to…" + the "Thank you" heard as nostalgia for manners; buying from
    //   neighbors ← the sketch is a buyer and a seller, and the last line (open a business) is lost
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'apples', seg: [154.45, 162.6],
      stem: 'In Ron’s story about apples, what view is he giving?',
      choices: ['Starting a business should be that simple', 'Sellers these days should be that polite',
                'Buying from neighbors should be that easy'], a: 0,
      cue: '小さな寸劇のあと、That’s as で始まる文。',
      line: 'Whatever happened to, “Hey, I have some apples…” … That’s *as complicated as it should be* to open a business',
      said: '「りんご買う？」「はい」「どうも」を演じ、商売はその程度で始めたいと言う。',
      mean: 'Whatever happened to ～? ＝ ～はどこへ。手続きの多さを嘆く。',
      trap: 'Thank you から礼儀の話に取りやすい。結論は最後の as … as の文。',
      use: 'Whatever happened to just calling people?（普通に電話する習慣はどこへ？）' },

    // R fix: V2: “calls all three funny” was easy to reject; “one he saw just for the kids” (right film, no joy)
    //   replaces it; notes trimmed to the C2 limit (N6)
    // why: just for the kids ← "My girlfriend's kids love it" heard as the reason he sat through it, "It's pretty
    //   funny" lost; making fun ← "pretty funny" heard as sarcasm about the kids' taste (the sincerity flip)
    // anchor: 169.44–173.0 s "My girlfriend's kids love it. It's pretty funny.": "it" is singular, right after the
    //   third title, with no irony marker; 162.72 s "I've seen three movies in my life" makes each one count
    { id: 'nt2', skill: 'humor', level: 'C2', point: 'herbie', seg: [162.3, 173.5],
      stem: 'Why is Ron’s last remark about his three movies funny?',
      choices: ['Of his only three films, one is a kids’ film he enjoys', 'Of his only three films, one he saw just for the kids',
                'He’s making fun of a silly film the kids enjoy'], a: 0,
      cue: '最後の2文の it が、どの映画を指すか。',
      line: 'I’ve seen *three movies in my life*… Herbie Fully Loaded. *My girlfriend’s kids love it. It’s pretty funny*.',
      said: '「見た映画は3本」と挙げ、最後の1本に「恋人の子どもが大好きでね。なかなか笑える」と付け足す。',
      mean: '3本しか見ない男の1本が子ども向けで、本気で楽しんでいる。皮肉の印はない。',
      trap: '子どものために見ただけ、と取ると pretty funny が抜ける。皮肉と取ると子どもをからかう話になる。',
      use: 'It’s a kids’ movie, but it’s pretty funny.（子ども向けだけど、けっこう笑える）', retired: true },
  ]
};
