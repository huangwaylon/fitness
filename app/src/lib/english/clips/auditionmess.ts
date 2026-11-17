// REVIEW 2026-11-17: pass 9, fix 13, drop 0, new 0; ear checks 2
// REVIEW open: f1 and a1 test known idioms, so a learner who knows them gets them blind; the audio is the context.
// “Carly and Spencer's Audition DISASTER! 🎭 Full Scene | iCarly | NickRewind” (NickRewind, Best of iCarly): Harper
// sends her drag-queen friends off in the outfits she made, only to hear their night was canceled (21–103 s); Carly and
// Spencer ride to a reality-show audition in a limo with Raul, a driver on his first day, and keep overruling the GPS
// and each other until a raised bridge stops them (107–214 s); they're disqualified, let back in, and given a melon
// challenge (221–342 s).
// Segments from the captions, words from whisper (2026-11-17); whisper's timings drift after ~100 s, so every time here
// is the captions'. Named in the audio: Harper, Carly, Spencer, Raul. The show's staff aren't named, so stems say "the
// person from the show"; the limo answer at 109–113 s and the "famous" reply at 242 s aren't named, so those stems
// name no speaker.
// Untested on purpose: 0–20 s (training; whisper "Pee as you run, Carly!", captions "because you run darling"),
// 42–46 s (garbled), 78.6 s (whisper "why did", captions "why didn't"), 91–103 s (Reese Witherspoon references the
// clip doesn't explain; captions "maurice"), 129.5 s (captions "exiled" for "egg salad"), 180.6 s (the ointment
// request: whisper "Can't wonder you passing", captions "can one of you passing"), 194.6 s (whisper's "Right!" is
// missing from the captions), 231.5 s (whisper "You are known", captions "you are no"), 243.8–247.6 s (the sources
// order "it's all your fault" and "thanks for apologizing" differently), 275.8–283.4 s (the "in my bed" line),
// 315–342 s (the dummy target and the hit: mostly visual).
// EAR CHECK: 153.8–154.4 s s1 — "Hang a left up here" (both sources): "hang a" really runs together
// EAR CHECK: 176.8–177.9 s x1 — "a little bit about me" (both sources): the flapped t's and bit‿about are really there
import type { Clip } from '../types.ts';

export const auditionDisaster: Clip = {
  id: 'auditionmess', video: 'rYW9nmr6a8o', title: 'Carly and Spencer\'s Audition DISASTER!', dur: 355, wpm: 127,
  band: 'slow', tags: ['旅行', '家'],
  show: 'iCarly',
  credit: 'iCarly (NickRewind, official YouTube channel)',
  questions: [
    // why: outfits ← "four emergency alterations" is said, but they're done ("are y'all finally ready? — We are!");
    //   too late ← "if you don't get going, you'll miss drag night" heard as what happened
    { id: 'g1', skill: 'gist', level: 'B1', point: 'canceled', seg: [21, 77.4],
      stem: 'What goes wrong for the friends Harper has dressed up?',
      choices: ['The event they dressed for is off', 'Their outfits still need more changes',
                'They get there too late to get in'], a: 0,
      cue: '「drag night」と言われたあとの、短い返事。',
      said: 'drag night に間に合うよう送り出そうとすると、「それ、中止になった」と返される。',
      mean: '準備は完ぺきでも、行き先がない。だから「全部むだ？」。',
      trap: 'alterations や miss が聞こえるが、衣装は仕上がり、遅刻の話でもない。',
      use: 'The concert was canceled.（コンサートは中止になった）' },

    // R fix: blind 90 %: "praises her own work" in the stem gave success away, and "take the outfits off" was a filler.
    //   The stem now names the moment only; the distractors are the "wear it well" sense and pull out = back out.
    // why: wear well ← "pull off a look" is a real sense, and the friends are in her outfits; back out ← pull off
    //   heard as pull out; "Whoever said Harper couldn't…" is about her doing it, not wearing it
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'pulloff', seg: [47.3, 52],
      stem: 'When Harper speaks of herself by name, what does “pull this off” mean?',
      choices: ['Succeed at something difficult', 'Look good in a daring outfit', 'Back out of a big plan'], a: 0,
      cue: '自分の名前を三人称で言う文の中。',
      line: 'Whoever said Harper couldn’t *pull this off* was seriously misguided.',
      said: '「Harper にできないと言った人は見当違い」と自分をほめる。',
      mean: 'pull ～ off ＝ 難しいことをやってのける。三人称の自画自賛も冗談。',
      trap: '服の場面なので「着こなす」と取りやすいが、主語は作った Harper。',
      use: 'I can’t believe we pulled it off!（やりとげたなんて信じられない！）' },

    // why: host sick ← "the emcee called" heard as calling in sick; later date ← the usual "postponed" script; the
    //   next sentence gives the reason
    // R fix: the stem says the night is canceled, which is g1's key (blind, it lifted g1 to 70 %): reveals it now
    { id: 'd1', skill: 'detail', level: 'B1', point: 'sold', reveals: ['canceled'], seg: [68, 74.6],
      stem: 'Why is the night canceled?',
      choices: ['The club has been sold', 'The host called in sick', 'It moved to a later date'], a: 0,
      cue: '「two hours ago」のあとの短い文。',
      line: 'the emcee called two hours ago. *The club was sold.*',
      said: '「司会者から2時間前に電話があった。クラブが売られて、子ども服の店になる」。',
      mean: '中止の理由は、会場そのものがなくなったこと。',
      trap: 'emcee called（司会者が電話してきた）から「病気で休み」を想像しやすい。理由は次の文。',
      use: 'The place was sold last month.（その店、先月売られたんだ）' },

    // R fix: blind 60 %: only the key was an odd piece of logic. All three now "treat" one thing as another.
    // why: slower ride as better ← a limo is the classic "slow but fun" ride; fancy as famous ← the script of
    //   arriving in style at an audition; the reasons given are "faster" and "a longer car"
    { id: 'h1', skill: 'humor', level: 'C1', point: 'limo', seg: [107.2, 114.1],
      stem: 'Why does the answer to “in a limo?” get a laugh?',
      choices: ['It treats a longer car as a faster one', 'It treats a slower ride as a better one',
                'It treats a fancy car as a famous one'], a: 0,
      cue: 'リムジンの理由と、最後の「math」。',
      line: 'That way we get there *faster*. *It’s a longer car.* The math works.',
      said: 'リムジンで行く理由を「速く着く。長い車だから。計算は合ってる」と説明する。',
      mean: '車の長さとスピードは関係ない。自信満々のでたらめな理屈が笑い。',
      trap: 'limo から「見栄」や「楽しさ」を想像しやすいが、口にした理由は長さ＝速さだけ。',
      use: 'Trust me, the math works.（任せて、計算は合ってる）' },

    // R fix: blind 60 %: "Taken seriously" flagged the absurd choice, and the "longer car" anchor (its cue) was
    //   outside the segment. The stem is neutral now, and the segment starts at the limo answer.
    // anchor: 111.8–113.4 s "It's a longer car. The math works." (length = speed), then 116.5 s "So we get there
    //   sooner": the same logic, applied to the seats
    // why: directions ← the practical reason a learner supplies (and they do direct Raul later); watching ← a
    //   passenger up front as pressure; neither follows the "longer car" logic the answer repeats
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'limo', seg: [109.3, 118.7],
      stem: 'By the speaker’s reasoning, how do the front seats get them there sooner?',
      choices: ['The front of a long car arrives first', 'They can give the driver quicker directions',
                'The driver goes faster with them watching'], a: 0,
      cue: '直前の「長い車」の理屈と同じ考え方。',
      line: 'why are we sitting in the front? — *So we get there sooner.*',
      said: '「なんで前の席に？」と聞かれ、「早く着くから」と答える。',
      mean: '長い車ほど速い、という直前の理屈の続き。本気なら「前の席は後ろより一瞬早く着く」という意味。そのばかばかしさが笑い。',
      trap: '運転手に指示しやすい、と現実的な理由を補いやすい。直前の理屈と同じ考え方で読む。',
      use: 'I’m standing closer, so I’m first in line.（近くに立ってるから、私が先頭ね）' },

    // why: go home ← "sandwiches… at home" heard as the order itself; calmly ← "forgot" heard as a calm everyday
    //   moment; "drive like…" is a simile, and Raul's "This is too real" shows the panic it means
    // R fix: blind 70 %: "seat belt" was a filler. It's now "Keep it up!" (a near sound). said gives nt1's logic,
    //   so it reveals limo.
    // why: keep it up ← the near sound "Keep it up!" = 続けて; hold on ← "keep up" heard as speed in a moving car;
    //   it closes an argument, so it's about following
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'keepup', reveals: ['limo'], seg: [113.7, 118.7],
      stem: 'What does “Keep up!” mean at the end of that answer?',
      choices: ['Try to follow my reasoning here', 'Keep doing what you’re doing', 'Hold on; we’re picking up speed'], a: 0,
      cue: '答えのいちばん最後の、短い命令。',
      line: 'So we get there sooner. *Keep up!*',
      said: '「前に座れば早く着く。ついてきてよ」と、分かって当然という調子で言う。',
      mean: 'Keep up! ＝（話に）ついてきて。相手の理解が遅い、という軽いからかい。',
      trap: 'Keep it up（その調子）や「つかまって」と取りやすい。it なしなら「遅れないで」。',
      use: 'Keep up, the tour is moving on!（遅れないで、ツアー進んでるよ！）' },

    // R fix: the segment started 0.4 s before "Raul, I'm gonna…" (now 132, after "treat")
    { id: 'i1', skill: 'infer', level: 'B2', point: 'urgent', seg: [132, 141.9],
      stem: 'What is Raul being asked to do with the sandwich comparison?',
      choices: ['Drive as fast as he possibly can', 'Go back home for the sandwiches', 'Drive calmly and take his time'], a: 0,
      cue: '「drive like」のあとのたとえと、Raul の反応。',
      line: 'I’m going to need you to *drive like you just realized you forgot your wife’s sandwiches* at home.',
      said: '「サンドイッチを家に忘れたと気づいた時みたいに運転して」と頼まれる。',
      mean: 'それほど急いで、というたとえ。Raul も「リアルすぎる」と答える。',
      trap: 'sandwiches と at home から「取りに帰る」と取りやすい。like のあとはたとえ。',
      use: 'Run like you’re late for a flight.（飛行機に遅れそうな時みたいに走って）' },

    // why: driver doesn't know the way ← "my first day" (122.6 s) and "Left or right?" make Raul look lost; skin
    //   ← the ointment talk is long; but each delay follows an order from the back, and the bridge stops them
    { id: 'g2', skill: 'gist', level: 'B2', point: 'route', reveals: ['bridge', 'hangleft'], seg: [146.9, 214.5],
      stem: 'Why does the limo ride take so long?',
      choices: ['They keep fighting over the route', 'Their new driver doesn’t know the way',
                'Their driver stops to treat his skin'], a: 0,
      cue: 'ナビの到着時間が、指示のたびにどう変わるか。',
      said: '二人が「左」「右」「高速」「橋」と言い合い、到着時間が延び続け、最後は橋が上がって止まる。',
      mean: '道のけんかが遅れの原因。ナビに従っていれば早く着いたはず。',
      trap: '運転手が初日なので道を知らないと思いやすいが、Raul は言われたとおり曲がっているだけ。',
      use: 'Let’s just follow the GPS.（ナビどおりに行こうよ）' },

    // why: 7 ← the -teen is lost; 70 ← -teen/-ty swap
    { id: 'n1', skill: 'number', level: 'B1', point: 'seventeen', seg: [147.2, 150.95], keep: true,
      stem: 'At first, how long does the GPS say the trip will take?',
      choices: ['7 minutes', '17 minutes', '70 minutes'], a: 1,
      cue: '最初の案内、minutes の直前の数。',
      line: 'You will arrive at your destination in *17 minutes*.',
      said: 'カーナビが「目的地まで17分」と案内する。',
      mean: '到着までの最初の予定時間。seventeen は後ろの -teen を強く長く言う。',
      trap: 'seventy なら前の「セ」が強く、語尾は短い「ティ」。7 は -teen を聞き落とした形。',
      use: 'We’ll arrive in about fifteen minutes.（あと15分くらいで着きます）' },

    // why: right ← the GPS has just said "turn right"; take a left ← the same meaning, so only the first sound
    //   tells them apart
    { id: 's1', skill: 'sound', level: 'B2', point: 'hangleft', seg: [152.5, 155.5],
      stem: 'Fill the gap: “You know what, Raul? ___ up here.”',
      choices: ['Hang a left', 'Hang a right', 'Take a left'], a: 0,
      cue: '「You know what, Raul?」のすぐあと。',
      line: 'You know what, Raul? *Hang a left* up here.',
      said: 'ナビは右なのに「この先を左に」と言う。',
      mean: 'hang a left ＝ 左に曲がる。hang‿a がつながり「ハンガ」に聞こえる。',
      trap: '直前の turn right に引っぱられやすい。take a left も同じ意味だが、音は h で始まる。',
      use: 'Hang a right at the next light.（次の信号を右に）' },

    // R fix: blind 50 %: the key was the only one that wasn't about the route. All three are feelings about the
    //   longer time now.
    // why: GPS wrong ← he overruled the GPS a moment ago, so he seems to doubt it; embarrassed ← "Ooh" heard as a
    //   wince at his own shortcut; "more time in the limo" is glad, and Carly's "Spencer!" scolds it
    { id: 'i2', skill: 'infer', level: 'C1', point: 'moretime', seg: [158.2, 165.2],
      stem: 'When the arrival time goes up, what does Spencer’s reaction show?',
      choices: ['He’s pleased the ride will last longer', 'He’s embarrassed his shortcut took longer',
                'He’s sure the GPS will soon fix the time'], a: 0,
      cue: '新しい到着時間のあとの、短いひと言。',
      line: 'You will arrive in 23 minutes. — Ooh. *More time in the limo.* — Spencer!',
      said: '到着が23分に延びると「リムジンにいる時間が増えた」と言い、叱られる。',
      mean: '遅れは気にせず、リムジンを楽しめる時間が延びて喜んでいる。叱られるのはそのため。',
      trap: 'Ooh を驚きや反省と取りやすいが、続く more time が「うれしい」方向を示す。',
      use: 'Ooh, more time at the beach!（やった、ビーチにいられる時間が増えた！）' },

    // why: 13 ← thirty-one vs thirteen, the stress moves; 23 ← the last time the GPS gave
    { id: 'n2', skill: 'number', level: 'B1', point: 'thirtyone', seg: [166.9, 171.3], keep: true,
      stem: 'After the right turn, what arrival time does the GPS give?',
      choices: ['13 minutes', '23 minutes', '31 minutes'], a: 2,
      cue: '右に曲がったあとの案内、minutes の前。',
      line: 'Turning right. — You will arrive in *31 minutes*.',
      said: '右に曲がると、カーナビが「到着まで31分」と告げる。',
      mean: 'thirty-one。前の23分より、さらに延びている。',
      trap: 'thirteen は後ろの -teen が強い。thirty-one は前が強く、one が続く。23 は前の案内の数。',
      use: 'Our flight leaves in thirty-one minutes.（飛行機はあと31分で出る）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'abit', seg: [175.7, 178.3],
      stem: 'Type how Raul begins: “___.” (5 words)', answer: 'a little bit about me',
      cue: '「always wrong」のすぐあと、運転手の声。',
      line: '*A little bit about me.*',
      said: '「ちょっと自分のことを言うと」と前置きする。',
      mean: 'little と bit の t が弾み、bit‿about がつながって「リロビラバウ」に近く聞こえる。',
      trap: 'a と about の a は弱く、語数が足りなく聞こえやすい。5語を数えながら書く。',
      use: 'A little bit about me: I love hiking.（少し自己紹介を。山歩きが好きです）' },

    // why: small talk ← "A little bit about me" is the self-introduction frame (自己紹介); sandwiches ← "egg
    //   salad" is said, but only to say where the ointment is; "Conflict" names their fight
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'eczema', reveals: ['abit'], seg: [175.7, 184.3],
      stem: 'When Raul starts telling them about himself, what is he really doing?',
      choices: ['Asking them to stop fighting', 'Making small talk to calm down', 'Asking where his sandwiches are'], a: 0,
      cue: '自己紹介のすぐあと、何が肌に悪いと言うか。',
      line: 'A little bit about me. *Conflict* really *exacerbates my eczema*.',
      said: '「ちょっと自己紹介。争いごとは湿しんを悪化させるんだ」と言い、塗り薬を取ってと頼む。',
      mean: '自己紹介の形をとった、遠回しな「けんかをやめて」。',
      trap: 'about me で始まるので世間話に聞こえやすい。最初の形より、何を言いたいのかを聞く。',
      use: 'Just so you know, I get carsick.（一応言っておくと、車に酔いやすいんだ）' },

    // R fix: blind 85 %: the stem quoted "the time we lost", which answers it, and the key echoed it. The stem
    //   quotes "make up" only, so the object has to be heard.
    // why: excuse ← make up = でっち上げる; make peace ← make up = 仲直りする, and they are fighting; "the time we
    //   lost" makes it time
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'makeup', seg: [187.9, 191.05],
      stem: 'In “We can make up…”, what does “make up” mean?',
      choices: ['Win back the delay', 'Think up an excuse', 'Settle their argument'], a: 0,
      cue: '橋の名前のすぐあと、make up のうしろの語。',
      line: 'No, take Ballard Bridge. We can *make up the time* we lost.',
      said: '「いや、Ballard Bridge を通れ。遅れた分を取り戻せる」と言う。',
      mean: 'make up the time ＝ 遅れを取り戻す。',
      trap: 'make up には「でっち上げる」「仲直りする」もある。後ろが the time なら「埋め合わせる」。',
      use: 'Let’s take a cab to make up time.（タクシーで遅れを取り戻そう）' },

    // R fix: blind 80 %: the distractors were weak. They're now "just this once" (the last time) and once = this one
    //   time, as quoted paraphrases; the speaker isn't named, so they stay in the first person.
    // why: won't ask again ← for once confused with "just this once"; this time matters ← once = 一度 = this one
    //   time; "for once" is the "you never do" complaint
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'foronce', seg: [190.6, 194.4],
      stem: 'What does “for once” add to the request to listen?',
      choices: ['“You usually ignore me.”', '“I won’t ask you again.”', '“This one time really matters.”'], a: 0,
      cue: '文の最後に付いた2語。',
      line: 'Could you just listen to me *for once*?',
      said: '「一度くらい私の言うことを聞いてくれない？」と言う。',
      mean: 'for once ＝「たまには」。いつも聞いてくれない、という不満がこもる。',
      trap: 'once を「一度」「今回だけ」と取りやすい。for once は不満の決まり文句。',
      use: 'Can you be on time for once?（たまには時間どおりに来てくれない？）' },

    // why: repairs ← the usual reason a bridge is shut; traffic ← the usual reason a car stops; "raised for
    //   ferry crossing" gives the reason
    { id: 'd2', skill: 'detail', level: 'B1', point: 'bridge', seg: [200.2, 206.6],
      stem: 'Why has the car stopped, according to the GPS?',
      choices: ['The bridge is raised for a ferry', 'The bridge is closed for repairs', 'The road ahead is full of traffic'], a: 0,
      cue: '橋の名前のすぐあとの案内。',
      line: 'Ballard Bridge. *Raised for ferry crossing.*',
      said: '「Ballard Bridge、フェリー通過のため上昇中。到着まで57分」とナビが言う。',
      mean: '跳ね橋が船を通すために上がっていて、車は渡れない。',
      trap: '止まると工事や渋滞を想像しやすいが、raised for ferry ＝ 船のために上がっている。',
      use: 'The bridge is up, so we’ll be late.（橋が上がってるから遅れそう）' },

    // R fix: blind 55 %: the key was the only nuanced choice. Two choices now admit it, and only "sorry" splits them.
    // why: denying ← a short reply to a charge heard as pushing back; saying sorry ← acknowledge = 認める heard as
    //   the start of an apology (the Japanese frame); no "sorry" follows
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'privilege', seg: [234.9, 243.75],
      stem: 'How is the question about skipping the audition answered?',
      choices: ['Admitting it, with no apology', 'Admitting it, and saying sorry', 'Denying fame was the reason'], a: 0,
      cue: '質問への、かたくて短い返事。',
      line: 'You were actually able to skip most of the audition process because you’re famous? — *I acknowledge my privilege.*',
      said: '「有名だからオーディションを飛ばせたの？」と聞かれ、「特権は認める」と答える。',
      mean: '事実は認めるが、謝りも譲りもしない。さらっとかわす冗談。',
      trap: 'acknowledge は謝罪の前置きにも聞こえるが、sorry は続かない。認める＝謝る、ではない。',
      use: 'Fair point. I acknowledge that.（もっともだね。それは認める）' },

    // R fix: blind 50 %: the "praise" filler. The distractors are the GPS's voice and the reverse reading (a real
    //   question teased).
    // why: the GPS talking ← the GPS has spoken all through the ride, so "Everything!" could be its voice; teasing
    //   ← the question heard as a real one; it meant "nothing", and it's answered as a real one
    { id: 'h2', skill: 'humor', level: 'C1', point: 'gpsknows', seg: [248.2, 255.6],
      stem: 'Why does the answer “Everything!” get a laugh?',
      choices: ['A rhetorical question gets a straight answer', 'The GPS seems to answer the question itself',
                'A real question gets a teasing answer'], a: 0,
      cue: '質問の形と、それへの返事の勢い。',
      line: 'Yeah, *what does a GPS know that I don’t?* — *Everything!* It knows everything!',
      said: '「ナビが俺の知らないことを知ってる？」と返すと、「全部！」。',
      mean: '「何も知らない」のつもりの反語に、まともに答えて言い負かしている。',
      trap: 'what does ～ know? は本当の質問ではなく「知るわけない」の意味。そこに答えるのが笑い。',
      use: 'Who doesn’t love pizza?（ピザが嫌いな人なんている？）' },

    // anchor: 287.7–290.2 s "I know this is raw. I know this is painful", then 291.3–293.5 s "I do need you to save
    //   it for the cameras": the sympathy leads into keeping the fight for filming
    // R fix: blind 70 %: "Given what follows" and the key's "not comfort" pointed at it. The stem is neutral, and
    //   all three choices say what the line does.
    // why: calm down ← the sympathy taken at face value, the お見舞い frame; owns up ← "painful" heard as the show
    //   admitting the disqualification was harsh; "save it for the cameras" asks to keep the feeling, not ease it
    { id: 'nt2', skill: 'pragma', level: 'C2', point: 'cameras', seg: [284.3, 294.3],
      stem: 'How does “I know this is painful” work in this turn?',
      choices: ['It leads into what the show wants from them', 'It gives them a moment to calm down',
                'It owns up to how unfair the show was'], a: 0,
      cue: '共感の言葉のあと、do で強めた頼み。',
      line: 'I know this is raw. *I know this is painful.* I *do need you to save it for the cameras*.',
      said: '「つらいよね」と言ってから「でもそれはカメラの前で」と頼む。',
      mean: '共感は本題への前置き。気持ちを止める気はなく、撮影用に取っておいてほしいだけ。do need の強調が本音。',
      trap: 'I know ～ painful を慰めと取ると、休ませる話に聞こえる。共感のあとの do に本題が来る。',
      use: 'I know it’s hard, but I need this.（大変なのは分かるけど、必要なの）' },

    // R fix: blind 70 %: the distractors were weak. "Warn" now names the audience, and "find out" is a real ask.
    // why: warn ← "a million" heard as a scary size; find out ← "content creator, right?" heard as a real question;
    //   "Let's do a challenge, bro" right after shows the pull worked
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'followers', seg: [296, 308.2],
      stem: 'Why does the person from the show bring up followers?',
      choices: ['To get them to stay in the game', 'To warn how many people will watch', 'To find out how big their following is'], a: 0,
      cue: '「content creator, right?」のあとの数字と、その返事。',
      line: 'Some contestants on our show get *more than a million new followers*. — *Let’s do a challenge*, bro.',
      said: '「新しいフォロワーが100万人以上つく人もいる」と言うと、「やろう」と返る。',
      mean: 'フォロワーという見返りで、やめかけた人を引きもどしている。効果はすぐ出る。',
      trap: 'right? を質問と取ると「数を聞く」に見えるが、確認の形で弱みを突いている。',
      use: 'Think of all the followers you’d get!（フォロワーがどれだけ増えるか考えてみて！）' },

    // why: catch ← "slingshot" and "melon" heard without "knock over"; firefighter ← "the fire department uses
    //   these to practice rescues" comes right after
    { id: 'd3', skill: 'detail', level: 'B1', point: 'melon', seg: [308.2, 315.3],
      stem: 'What do they have to do to qualify for the race?',
      choices: ['Knock a target over with a melon', 'Catch a melon shot from a slingshot', 'Carry a dummy out like a firefighter'], a: 0,
      cue: '「pretty simple」のあとの説明。',
      line: 'Just *slingshot a melon to knock over a target* and you qualify for the race.',
      said: '「メロンを飛ばして的を倒せばレースに出られる」。',
      mean: 'slingshot は動詞で「パチンコで飛ばす」。knock over ＝ 倒す。',
      trap: 'slingshot と melon だけだと「受け取る」にも取れる。to knock over が目的。',
      use: 'Knock over three cans to win a prize.（缶を3つ倒したら景品）' },
  ]
};
